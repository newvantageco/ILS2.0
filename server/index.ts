import * as dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupLocalAuth } from "./localAuth";
import { ensureMasterUser } from "./masterUser";
import {
  securityHeaders,
  globalRateLimiter,
  authRateLimiter
} from "./middleware/security";
import { csrfProtection, csrfErrorHandler } from "./middleware/csrfProtection";
import { auditMiddleware } from "./middleware/audit";
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
  requestTimeout
} from "./middleware/errorHandler";
import { performanceMonitoring, clearOldMetrics } from "./middleware/performance";
import { scheduledEmailService } from "./services/ScheduledEmailService";
import { startDailyBriefingCron } from "./jobs/dailyBriefingCron";
import { startInventoryMonitoringCron } from "./jobs/inventoryMonitoringCron";
import { startClinicalAnomalyDetectionCron } from "./jobs/clinicalAnomalyDetectionCron";
import { startUsageReportingCron } from "./jobs/usageReportingCron";
import { startStorageCalculationCron } from "./jobs/storageCalculationCron";
import { setupWebSocket } from "./websocket/index";
import { initializeWebSocket } from "./services/WebSocketService";

// Import worker factory functions - workers are initialized AFTER Redis connects
import { createEmailWorker } from "./workers/emailWorker";
import { createPDFWorker } from "./workers/pdfWorker";
import { createNotificationWorker } from "./workers/notificationWorker";
import { createAIWorker } from "./workers/aiWorker";
import { initializeRedis, getRedisConnection } from "./queue/config";
import { storage } from "./storage";
import logger from "./utils/logger";
import { db, closePool, isDatabaseAvailable } from "./db";
import { sql } from "drizzle-orm";
// Order-created workers (Strangler refactor) - register explicitly below
import { registerOrderCreatedLimsWorker } from "./workers/OrderCreatedLimsWorker";
import { registerOrderCreatedPdfWorker } from "./workers/OrderCreatedPdfWorker";
import { registerOrderCreatedAnalyticsWorker } from "./workers/OrderCreatedAnalyticsWorker";

// LIMS client package (packaged in /packages/lims-client)
import LimsClient from "../packages/lims-client/src/LimsClient";

// Import event system
import { initializeEventSystem } from "./events";
import "./events/handlers/subscriptionEvents"; // Load subscription event handlers
import { metricsHandler } from "./lib/metrics";
import { swaggerRouter } from "./middleware/swagger";
import { globalCacheControl } from "./middleware/cacheControl";
import { metricsMiddleware, performHealthCheck } from "./lib/application-metrics";
import { tracingMiddleware } from "./middleware/tracing";

// Import Redis session store (Chunk 10)
import RedisStore from "connect-redis";
import Redis from 'ioredis';

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ============== EARLY HEALTH CHECK (RAILWAY COMPATIBILITY) ==============
// This health check runs BEFORE any other middleware to ensure Railway
// can always reach the health endpoint, even if other middleware fails
// or environment variables are misconfigured.
// NOTE: Railway sends healthchecks from hostname healthcheck.railway.app
// These endpoints are registered before CORS/security middleware to ensure accessibility.
let serverReady = false;
let dbReady = false;
let configError: string | null = null;

// Basic health check - always returns 200 for Railway container health
// Use /health/ready for load balancer readiness checks
const earlyHealthCheck = (req: Request, res: Response) => {
  // Return 200 immediately - container is healthy if HTTP server is running
  // Railway needs 200 OK to mark container as healthy
  res.status(200).json({
    status: configError ? 'degraded' : 'ok',
    server: serverReady ? 'ready' : 'starting',
    database: dbReady ? 'connected' : 'initializing',
    ...(configError && { configError }),
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

// Strict readiness check - returns 503 if not fully ready
// Use this for load balancer health checks to avoid routing to broken instances
const readinessCheck = (req: Request, res: Response) => {
  const isReady = serverReady && dbReady && !configError;
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    server: serverReady ? 'ready' : 'starting',
    database: dbReady ? 'connected' : 'initializing',
    ...(configError && { configError }),
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

// Register health checks FIRST, before any middleware that could fail
app.get('/health', earlyHealthCheck);           // Railway health check (always 200)
app.get('/api/health', earlyHealthCheck);       // Alternative path
app.get('/health/ready', readinessCheck);       // Load balancer readiness (503 if not ready)
app.get('/health/live', earlyHealthCheck);      // Kubernetes liveness (always 200)

// ============== SECURITY MIDDLEWARE (PRODUCTION HARDENING) ==============
// Apply helmet.js security headers (HSTS, CSP, X-Frame-Options, etc.)
app.use(securityHeaders);

// Configure CORS
// SECURITY: Validate CORS_ORIGIN is set in production
// Railway provides RAILWAY_PUBLIC_DOMAIN automatically
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : null;
const corsOrigin = process.env.CORS_ORIGIN || railwayDomain;

if (!corsOrigin && process.env.NODE_ENV === 'production') {
  // Log error but don't crash - allow health checks to work
  const corsError = 'CORS_ORIGIN must be set in production (or use RAILWAY_PUBLIC_DOMAIN)';
  configError = corsError;
  logger.error({}, `❌ ${corsError}`);
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin;
  
  // For local development, allow localhost and 127.0.0.1 with any port
  const isLocalhost = requestOrigin && (
    requestOrigin.includes('localhost') || 
    requestOrigin.includes('127.0.0.1')
  );
  
  let allowedOrigin: string;
  if (process.env.NODE_ENV === 'production' && !isLocalhost) {
    // Production: use configured CORS_ORIGIN
    allowedOrigin = corsOrigin || '';
  } else {
    // Development or localhost: allow the request origin
    allowedOrigin = requestOrigin || corsOrigin || 'http://localhost:3000';
  }
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Required for CSRF token cookie reading

// ============== COMPRESSION (Performance Optimization) ==============
// Enable gzip/deflate compression for responses
app.use(compression({
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is good balance)
}));

// ============== HTTP REQUEST LOGGING (Morgan) ==============
// Log HTTP requests for monitoring and debugging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req) => req.url === '/health' || req.url === '/metrics', // Skip health/metrics checks
  }));
} else {
  app.use(morgan('dev', {
    skip: (req) => req.url === '/health', // Skip health checks in dev too
  }));
}

// ============== RATE LIMITING (DDoS Protection) ==============
// Apply global rate limiter to all /api/* routes (100 req/15min per IP)
app.use('/api', globalRateLimiter);

// Apply strict auth rate limiter (5 attempts/15min per IP)
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/login-email', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);
app.use('/api/auth/signup-email', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);
app.use('/api/patient-portal/auth/forgot-password', authRateLimiter);
app.use('/api/patient-portal/auth/reset-password', authRateLimiter);
app.use('/api/onboarding', authRateLimiter);

// ============== SESSION CONFIGURATION ==============
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  // Log error but don't crash - allow health checks to work
  // Generate a temporary secret (NOT secure for production, but allows diagnostics)
  const sessionError = 'SESSION_SECRET must be set in .env file for security';
  if (!configError) configError = sessionError;
  logger.error({}, `❌ ${sessionError}`);
  logger.error({}, '   Generate one with: openssl rand -hex 32');
  sessionSecret = 'TEMPORARY_INSECURE_SECRET_' + Date.now();
  logger.error({}, '   Using temporary session secret - SESSIONS WILL NOT PERSIST');
}

// Session store: Use Redis if REDIS_URL is configured, otherwise memory
// Note: Redis connection is created synchronously here for session store
const REDIS_URL = process.env.REDIS_URL;
let sessionRedisClient: Redis | null = null;

if (REDIS_URL) {
  try {
    sessionRedisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: false, // Connect immediately
    });
    log("✅ Session Redis client created", "express");
  } catch (err) {
    log(`⚠️  Failed to create session Redis client: ${err}`, "express");
  }
}

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // XSS protection
    secure: process.env.NODE_ENV === 'production' && !process.env.DISABLE_HTTPS, // HTTPS in production (unless disabled for local testing)
    sameSite: 'strict' as const, // CSRF protection
    // SECURITY: Reduced from 30 days to 24 hours for healthcare compliance
    // Users should re-authenticate daily for PHI access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  store: undefined as session.Store | undefined, // Will be set below if Redis available
};

// Add Redis store if available, otherwise use default memory store
if (sessionRedisClient) {
  sessionConfig.store = new RedisStore({
    client: sessionRedisClient,
    prefix: "session:",
  });
  log("✅ Using Redis for session storage (fast, scalable)", "express");
} else {
  log("⚠️  Using memory store for sessions (Redis unavailable)", "express");
}

const sessionMiddleware = session(sessionConfig);
app.use(sessionMiddleware);

// Store session middleware for WebSocket auth
app.set('sessionMiddleware', sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Setup authentication strategies
if (process.env.NODE_ENV === "development") {
  setupLocalAuth();
}

// ============== CSRF PROTECTION ==============
// Protect against Cross-Site Request Forgery attacks
// Applied to all routes EXCEPT auth endpoints (login/signup don't have sessions yet)
// Controlled by CSRF_ENABLED environment variable (default: true)
const csrfEnabled = process.env.CSRF_ENABLED !== 'false';

// Routes that should skip CSRF
// Note: For SPAs with cookie-based auth, CSRF protection on API routes is less critical
// because browsers enforce same-origin policy. Auth routes are exempt because no session exists yet.
// CSRF token flow implemented: frontend fetches token from /api/csrf-token and sends in X-CSRF-Token header
const csrfExemptPaths = [
  '/api/csrf-token', // CSRF token endpoint must be exempt (it generates the token)
  '/api/auth/login',
  '/api/auth/login-email',
  '/api/auth/signup',
  '/api/auth/signup-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/onboarding',
  '/api/health',
  '/health',
  '/api/webhooks', // Webhooks have their own signature verification
];

if (csrfEnabled) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for exempt paths
    if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    // Apply CSRF protection for all other routes
    return csrfProtection(req, res, next);
  });
  log("✅ CSRF protection enabled (auth routes exempt)", "security");
} else {
  log("⚠️  CSRF protection disabled via CSRF_ENABLED=false", "security");
}

// ============== AUDIT LOGGING (HIPAA Compliance) ==============
// Apply audit logging middleware to all /api/* routes
// This must come AFTER authentication to capture user info
app.use('/api', auditMiddleware);

// ============== PERFORMANCE MONITORING ==============
// Track API response times, database queries, and system metrics
app.use(performanceMonitoring);

// ============== HTTP CACHING ==============
// Apply Cache-Control headers and ETag support based on route patterns
// PHI/sensitive routes are automatically excluded from caching
app.use('/api', globalCacheControl());

// ============== APPLICATION METRICS ==============
// Collect HTTP request metrics (latency, status codes, error rates)
if (process.env.METRICS_ENABLED === 'true') {
  app.use(metricsMiddleware());
}

// ============== DISTRIBUTED TRACING ==============
// Create trace spans for request flows with W3C Trace Context propagation
// Enable with TRACING_ENABLED=true or OTEL_ENABLED=true
if (process.env.TRACING_ENABLED === 'true' || process.env.OTEL_ENABLED === 'true') {
  app.use(tracingMiddleware());
  logger.info({}, '✅ Distributed tracing enabled');
}

// ============== REQUEST TIMEOUT (DDoS Protection) ==============
// Set timeout for all requests (10 seconds default, except for specific slow operations)
// This prevents requests from hanging indefinitely
app.use((req, res, next) => {
  // Allow longer timeout for specific heavy operations
  if (req.path.includes('/api/reports') || req.path.includes('/api/analytics')) {
    return requestTimeout(30000)(req, res, next);
  }
  // Default fast timeout for normal operations
  return requestTimeout(10000)(req, res, next);
});

// ============== DETAILED HEALTH CHECK ENDPOINT ==============
// This provides more detailed health information for monitoring
// The early health check (registered above) handles Railway's basic health checks
app.get('/api/health/detailed', async (req: Request, res: Response) => {
  try {
    // Use comprehensive health check service
    const healthResult = await performHealthCheck();

    // Legacy compatibility fields
    const databaseStatus = healthResult.checks.database.status === 'up'
      ? 'connected'
      : healthResult.checks.database.status === 'degraded'
        ? 'slow'
        : 'disconnected';

    res.json({
      status: healthResult.status,
      server: serverReady ? 'ready' : 'starting',
      database: databaseStatus,
      databaseReady: healthResult.checks.database.status === 'up',
      redis: healthResult.checks.redis.status,
      ...(configError && { configError }),
      checks: healthResult.checks,
      timestamp: healthResult.timestamp,
      environment: app.get("env"),
      uptime: healthResult.uptime,
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

(async () => {
  try {
    // Validate required environment variables
    if (!process.env.DATABASE_URL) {
      const dbError = 'DATABASE_URL environment variable is not set';
      logger.error({}, `FATAL ERROR: ${dbError}`);
      logger.error({}, 'Please configure DATABASE_URL in your deployment secrets');
      // Don't exit - allow health check server to start for diagnostics
      if (!configError) configError = dbError;
    }

  log("Starting server initialization...");

  // Only initialize database-dependent services if DATABASE_URL is configured
  if (process.env.DATABASE_URL && isDatabaseAvailable()) {
    try {
      // Test database connectivity
      await db.execute(sql`SELECT 1`);
      dbReady = true;
      log("✅ Database connection verified");
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Database connection failed');
      if (!configError) configError = 'Database connection failed: ' + (err instanceof Error ? err.message : String(err));
    }

    // Only run master user setup if DB is connected
    if (dbReady) {
      try {
        await ensureMasterUser();
      } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to ensure master user - continuing anyway');
      }
    }
  } else {
    log("⚠️  Skipping database initialization - DATABASE_URL not set");
  }

    // Metrics endpoint (optional)
    if (process.env.METRICS_ENABLED === 'true') {
      app.get('/metrics', metricsHandler);
      logger.info({}, '✅ Metrics endpoint enabled at /metrics');
    }

    // API Documentation (Swagger/OpenAPI)
    app.use('/api/docs', swaggerRouter);
    logger.info({}, '✅ API documentation available at /api/docs');

    // Routes will be registered, then static files served at the end
    // Don't intercept root route - let it fall through to static file server

    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // ============== VITE / STATIC FILE SERVING ==============
    // Setup Vite in development or static serving in production
    // This must come BEFORE error handlers so the SPA catch-all works
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite setup completed for development");
    } else {
      serveStatic(app);
      log("Static file serving configured for production");
    }

    // ============== ERROR HANDLING (Production-Grade) ==============
    // Setup global process error handlers
    setupGlobalErrorHandlers();

    // CSRF error handler - must come before global error handler
    if (csrfEnabled) {
      app.use(csrfErrorHandler);
    }

    // 404 handler - must be after all routes and Vite setup
    app.use(notFoundHandler);

    // Global error handler - must be last
    app.use(errorHandler);

    // Initialize server configuration
    // Railway sets $PORT automatically; default to 5000 for local development
    const port = parseInt(process.env.PORT || '5000', 10);
    // Listen on 0.0.0.0 for Railway compatibility; defaults to localhost for dev
    const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
    
    // Initialize Redis before starting server
    const redisConnected = await initializeRedis();
    if (redisConnected) {
      log(`✅ Redis connected - Starting background job workers...`);
      // Initialize workers NOW that Redis is connected
      const emailWorker = createEmailWorker();
      const pdfWorker = createPDFWorker();
      const notificationWorker = createNotificationWorker();
      const aiWorker = createAIWorker();
      log(`✅ Background workers started: email=${!!emailWorker}, pdf=${!!pdfWorker}, notification=${!!notificationWorker}, ai=${!!aiWorker}`);
    } else {
      log(`⚠️  Redis not available - Will use immediate execution fallback`);
    }
    
    // Initialize event-driven architecture (Chunk 9)
    initializeEventSystem();

    // === Register opt-in background workers (Order-related) ===
    // Controlled by WORKERS_ENABLED (defaults to 'true' when Redis is connected)
    const workersEnabledEnv = process.env.WORKERS_ENABLED;
    const workersEnabled = typeof workersEnabledEnv === 'string'
      ? workersEnabledEnv !== 'false'
      : Boolean(redisConnected);

    if (workersEnabled) {
      try {
        // Create LIMS client if configuration is present
        let limsClient: InstanceType<typeof LimsClient> | null = null;
        if (process.env.LIMS_API_BASE_URL && process.env.LIMS_API_KEY) {
          limsClient = new LimsClient({
            baseUrl: process.env.LIMS_API_BASE_URL,
            apiKey: process.env.LIMS_API_KEY,
            webhookSecret: process.env.LIMS_WEBHOOK_SECRET || "",
          });
          logger.info({}, '✅ LIMS client initialized for background workers');
        } else {
          logger.info({}, 'ℹ️  LIMS integration disabled (optional - configure LIMS_API_BASE_URL and LIMS_API_KEY in .env to enable)');
        }

        // Register order-created workers. Pass storage + limsClient where required.
        // Note: Type assertion needed because LimsClient has diverged from legacy LimsClientInterface
        if (limsClient) {
          registerOrderCreatedLimsWorker(limsClient as any, storage);
        }

  registerOrderCreatedPdfWorker(storage);

        // Build optional analytics client. If ANALYTICS_WEBHOOK_URL is provided,
        // we'll POST events to that URL. Otherwise the worker will use the
        // placeholder logging behavior.
        interface AnalyticsClient {
          sendEvent: (payload: Record<string, unknown>) => Promise<void>;
        }
        let analyticsClient: AnalyticsClient | undefined = undefined;
        const analyticsWebhook = process.env.ANALYTICS_WEBHOOK_URL;
        if (analyticsWebhook) {
          analyticsClient = {
            sendEvent: async (payload: Record<string, unknown>) => {
              try {
                // Node 18+ has global fetch; keep this lightweight to avoid new deps
                await fetch(analyticsWebhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
              } catch (err) {
                logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Analytics POST failed');
                throw err;
              }
            },
          };
          logger.info({}, '✅ Analytics webhook client configured');
        } else {
          logger.info({}, 'ℹ️  No analytics webhook configured; analytics will be logged locally');
        }

        registerOrderCreatedAnalyticsWorker(storage, { analyticsClient: analyticsClient || undefined });

        // If we're using Redis Streams, schedule a periodic reclaimer to recover
        // stuck entries left in the Pending Entries List (PEL). The list of streams
        // to reclaim is configured via REDIS_STREAMS_RECLAIM_STREAMS (csv), defaulting
        // to 'order.submitted'. The idle threshold and interval are configurable.
        const backend = process.env.WORKERS_QUEUE_BACKEND || 'in-memory';
        if (backend === 'redis-streams' && process.env.REDIS_URL) {
          try {
            const eventBusModule = await import('./lib/eventBus');
            const eventBus = eventBusModule.default as { reclaimAndProcess?: (stream: string, idleMs: number) => Promise<void> };
            const reclaimStreams = (process.env.REDIS_STREAMS_RECLAIM_STREAMS || 'order.submitted').split(',').map(s => s.trim()).filter(Boolean);
            const idleMs = Number(process.env.REDIS_STREAMS_RECLAIM_IDLE_MS || '60000');
            const intervalMs = Number(process.env.REDIS_STREAMS_RECLAIM_INTERVAL_MS || String(5 * 60 * 1000)); // 5m

            if (eventBus.reclaimAndProcess) {
              const reclaimFn = eventBus.reclaimAndProcess;
              setInterval(() => {
                for (const s of reclaimStreams) {
                  reclaimFn(s, idleMs).catch((err: unknown) => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Reclaim error'));
                }
              }, intervalMs);
              logger.info({}, `✅ Redis Streams reclaimer scheduled for streams: ${reclaimStreams.join(', ')}`);
            } else {
              logger.info({}, 'ℹ️  Redis Streams event bus does not expose reclaimAndProcess; skipping reclaimer scheduling');
            }
            // Start periodic PEL sampler if metrics are enabled
            if (process.env.METRICS_ENABLED === 'true') {
              try {
                const { startPelSampler } = await import('./lib/redisPelSampler');
                const redisClient = getRedisConnection();
                if (redisClient) {
                  const pelInterval = Number(process.env.REDIS_STREAMS_PEL_SAMPLER_INTERVAL_MS || '60000');
                  startPelSampler(redisClient, reclaimStreams, process.env.REDIS_STREAMS_GROUP || 'ils_group', pelInterval);
                  logger.info({}, '✅ Redis Streams PEL sampler started');
                } else {
                  logger.info({}, '⚠️  Redis client not available for PEL sampler');
                }
              } catch (err) {
                logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to start PEL sampler');
              }
            }
          } catch (err) {
            logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to schedule Redis Streams reclaimer');
          }
        }

        logger.info({}, '✅ Order-created background workers registered');
      } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to register order background workers:');
      }
    } else {
      logger.info({}, 'ℹ️  Background workers are disabled via WORKERS_ENABLED=false');
    }
    
    // Initialize WebSocket server for real-time lab dashboard
    // Works in both development and production for live order updates
    const sessionMiddlewareForWs = app.get('sessionMiddleware');
    if (sessionMiddlewareForWs) {
      setupWebSocket(server, sessionMiddlewareForWs);
      log(`✅ WebSocket server initialized on /ws endpoint`);
    } else {
      log(`⚠️  WebSocket server not initialized - session middleware not available`);
    }

    // Initialize Socket.IO service for real-time notifications
    const webSocketService = initializeWebSocket(server);
    log(`✅ Socket.IO service initialized for real-time notifications`);
    
    server.listen(port, host, () => {
      // Mark server as ready for health checks
      serverReady = true;

      log(`Server successfully started on port ${port}`);
      log(`Environment: ${app.get("env")}`);
      log(`API server running at http://${host}:${port}`);
      log(`Frontend available at http://localhost:${port}`);
      
      // Log background job workers status
      if (redisConnected) {
        log(`📋 Background job workers active:`);
        log(`   - Email worker: Processing order confirmations, notifications`);
        log(`   - PDF worker: Generating invoices, receipts, lab tickets`);
        log(`   - Notification worker: In-app notifications`);
        log(`   - AI worker: Daily briefings, demand forecasts, insights`);
      }
      
      // Start scheduled email jobs
      scheduledEmailService.startAllJobs();
      log(`Scheduled email jobs started (prescription reminders, recall notifications)`);
      
      // Start daily AI briefing cron job
      startDailyBriefingCron();
      log(`Daily AI briefing cron job started (8:00 AM daily)`);
      
      // Start autonomous inventory monitoring cron job
      startInventoryMonitoringCron();
      log(`Inventory monitoring cron job started (9:00 AM & 3:00 PM daily)`);
      
      // ============================================================================
      // WORLD-CLASS TRANSFORMATION CRON JOBS (November 2025)
      // ============================================================================
      
      // Start clinical anomaly detection cron job
      startClinicalAnomalyDetectionCron();
      log(`Clinical anomaly detection cron job started (2:00 AM daily)`);
      
      // Start usage reporting cron job (Stripe metered billing)
      startUsageReportingCron();
      log(`Usage reporting cron job started (1:00 AM daily)`);
      
      // Start storage calculation cron job
      startStorageCalculationCron();
      log(`Storage calculation cron job started (3:00 AM daily)`);

      // Start performance metrics cleanup (runs every 6 hours)
      setInterval(() => {
        clearOldMetrics(24); // Clean up metrics older than 24 hours
        log(`Performance metrics cleanup completed`);
      }, 6 * 60 * 60 * 1000); // Every 6 hours
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error({ error: error.message }, 'Server error:');
      if (error.code === 'EADDRINUSE') {
        logger.error({ port }, 'Port is already in use');
      }
      process.exit(1);
    });

    // ============== GRACEFUL SHUTDOWN (Production Best Practice) ==============
    // Handle SIGTERM/SIGINT for graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      log(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        log('HTTP server closed');

        try {
          // Close database connections
          await closePool();
          log('Database connections closed');

          // Close Redis connections
          const redisClient = getRedisConnection();
          if (redisClient) {
            await redisClient.quit();
            log('Redis connections closed');
          }

          // Stop scheduled jobs
          scheduledEmailService.stopAllJobs();
          log('Scheduled jobs stopped');

          log('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during graceful shutdown:');
          process.exit(1);
        }
      });

      // Force close after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error({}, 'Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error({}, 'FATAL ERROR during server initialization:');
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Initialization error');
    
    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      logger.error({ message: error.message }, 'Error message');
      logger.error({ stack: error.stack }, 'Error stack');
      
      if (error.message.includes("DATABASE_URL")) {
        logger.error({}, '\nPlease ensure DATABASE_URL is configured in deployment secrets');
      }
    }
    
    process.exit(1);
  }
})();

// Export app for testing
export { app };
