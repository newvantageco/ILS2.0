import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import logger from './utils/logger';


const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  logger.info(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: {
      ...serverOptions,
      middlewareMode: true,
      hmr: {
        server, // Use the HTTP server instance - no need to specify port
        // Port is automatically determined from the server instance
      },
    },
    appType: "custom",
    base: '/',
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by Express routes
    if (url.startsWith('/api/') || url === '/health' || url.startsWith('/uploads/')) {
      return next();
    }

    // Skip Vite internal paths - let Vite middleware handle them
    if (url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Check if the template exists
      if (!fs.existsSync(clientTemplate)) {
        logger.error(`Template file not found: ${clientTemplate}`);
        return res.status(500).send('Server configuration error');
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use process.cwd() for reliable path resolution in production (Docker working directory is /app)
  // Build output is at /app/dist/public when bundled server runs from /app/dist/index.js
  const distPath = path.resolve(process.cwd(), "dist", "public");

  logger.info(`[serveStatic] Initializing static file serving from: ${distPath}`);
  logger.info(`[serveStatic] Current working directory: ${process.cwd()}`);

  if (!fs.existsSync(distPath)) {
    logger.error(`[serveStatic] Build directory not found: ${distPath}`);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Log directory contents for diagnostics
  try {
    const files = fs.readdirSync(distPath);
    logger.info(`[serveStatic] Files in ${distPath}: ${files.join(', ')}`);
    const indexExists = fs.existsSync(path.resolve(distPath, 'index.html'));
    logger.info(`[serveStatic] index.html exists: ${indexExists}`);
  } catch (err) {
    logger.error(`[serveStatic] Error reading directory: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Serve static files with aggressive caching for production performance
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for 1 year (they have content hashes)
    etag: true, // Enable ETags for cache validation
    lastModified: true, // Include Last-Modified header
    immutable: true, // Mark as immutable (browser won't revalidate)
    setHeaders: (res, filepath) => {
      // Different cache strategies for different file types
      if (filepath.endsWith('.html')) {
        // HTML files should not be cached (they reference the hashed assets)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filepath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
        // Static assets with content hashes can be cached forever
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // fall through to index.html for client-side routing (but NOT for API routes)
  app.use((req, res, next) => {
    // Skip if response already sent (file was served by express.static)
    if (res.headersSent) {
      return;
    }

    // Skip API routes, health check, and other server endpoints
    if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/uploads')) {
      return next();
    }

    // Serve index.html for all other routes (client-side routing)
    const indexPath = path.resolve(distPath, "index.html");
    logger.info(`[serveStatic] Serving index.html for path: ${req.path}, file: ${indexPath}`);

    // IMPORTANT: Return here to prevent middleware chain from continuing
    // Express will handle the response through sendFile's callback
    return res.sendFile(indexPath, (err) => {
      if (err) {
        // Don't log or handle aborted requests - they're normal when client cancels
        if (err.message === 'Request aborted' || err.code === 'ECONNABORTED') {
          return;
        }
        logger.error(`[serveStatic] Failed to serve index.html: ${err.message}`, { path: req.path, indexPath });
        // Don't call next if headers already sent
        if (!res.headersSent) {
          return next(err);
        }
      } else {
        logger.info(`[serveStatic] Successfully served index.html for: ${req.path}`);
      }
    });
  });
}
