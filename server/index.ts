import * as dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupLocalAuth } from "./localAuth";
import { ensureMasterUser } from "./masterUser";
import { 
  securityHeaders, 
  globalRateLimiter, 
  authRateLimiter 
} from "./middleware/security";
import { auditMiddleware } from "./middleware/audit";
import { 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers,
  requestTimeout 
} from "./middleware/errorHandler";
import { scheduledEmailService } from "./services/ScheduledEmailService";
import { startDailyBriefingCron } from "./jobs/dailyBriefingCron";
import { startInventoryMonitoringCron } from "./jobs/inventoryMonitoringCron";
import { startClinicalAnomalyDetectionCron } from "./jobs/clinicalAnomalyDetectionCron";
import { startUsageReportingCron } from "./jobs/usageReportingCron";
import { startStorageCalculationCron } from "./jobs/storageCalculationCron";

// Import workers to start background job processing
import "./workers/emailWorker";
import "./workers/pdfWorker";
import "./workers/notificationWorker";
import "./workers/aiWorker";
import { initializeRedis, getRedisConnection } from "./queue/config";

// Import event system
import { initializeEventSystem } from "./events";

// Import Redis session store (Chunk 10)
import RedisStore from "connect-redis";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ============== SECURITY MIDDLEWARE (PRODUCTION HARDENING) ==============
// Apply helmet.js security headers (HSTS, CSP, X-Frame-Options, etc.)
app.use(securityHeaders);

// Configure CORS
app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
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

// ============== RATE LIMITING (DDoS Protection) ==============
// Apply global rate limiter to all /api/* routes (100 req/15min per IP)
app.use('/api', globalRateLimiter);

// Apply strict auth rate limiter (5 attempts/15min per IP)
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/login-email', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);
app.use('/api/auth/signup-email', authRateLimiter);
app.use('/api/onboarding', authRateLimiter);

if (process.env.NODE_ENV === "development") {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    log("SESSION_SECRET is not set. Generating temporary secret for development.", "express");
  }

  // Use Redis for session store (Chunk 10: Infrastructure Scale)
  const redisClient = getRedisConnection();
  const sessionConfig: any = {
    secret: sessionSecret || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // XSS protection
      secure: false, // HTTP OK in development
      sameSite: 'strict', // CSRF protection
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  // Add Redis store if available, otherwise use default memory store
  if (redisClient) {
    sessionConfig.store = new RedisStore({
      client: redisClient as any,
      prefix: "session:",
    });
    log("✅ Using Redis for session storage (fast, scalable)", "express");
  } else {
    log("⚠️  Using memory store for sessions (Redis unavailable)", "express");
  }

  app.use(session(sessionConfig));

  app.use(passport.initialize());
  app.use(passport.session());
  setupLocalAuth();
}

// ============== AUDIT LOGGING (HIPAA Compliance) ==============
// Apply audit logging middleware to all /api/* routes
// This must come AFTER authentication to capture user info
app.use('/api', auditMiddleware);

// ============== REQUEST TIMEOUT (DDoS Protection) ==============
// Set timeout for all requests (30 seconds default)
app.use(requestTimeout(30000));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate required environment variables
    if (!process.env.DATABASE_URL) {
      console.error("FATAL ERROR: DATABASE_URL environment variable is not set");
      console.error("Please configure DATABASE_URL in your deployment secrets");
      process.exit(1);
    }

  log("Starting server initialization...");

  await ensureMasterUser();
    
    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: app.get("env")
      });
    });

    // Let Vite serve the SPA shell in development, otherwise return a basic status message
    app.get('/', (req, res, next) => {
      if (app.get("env") === "development") {
        return next();
      }

      res.send('ILS Server is running');
    });
    
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
    
    // 404 handler - must be after all routes and Vite setup
    app.use(notFoundHandler);
    
    // Global error handler - must be last
    app.use(errorHandler);

    // Initialize server configuration
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '127.0.0.1';
    
    // Initialize Redis before starting server
    const redisConnected = await initializeRedis();
    if (redisConnected) {
      log(`✅ Redis connected - Background job workers will start`);
    } else {
      log(`⚠️  Redis not available - Will use immediate execution fallback`);
    }
    
    // Initialize event-driven architecture (Chunk 9)
    initializeEventSystem();
    
    server.listen(port, host, () => {
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
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error("Server error:", error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error("FATAL ERROR during server initialization:");
    console.error(error);
    
    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      if (error.message.includes("DATABASE_URL")) {
        console.error("\nPlease ensure DATABASE_URL is configured in deployment secrets");
      }
    }
    
    process.exit(1);
  }
})();
