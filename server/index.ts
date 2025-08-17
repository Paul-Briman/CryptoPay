import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import https from "https";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import stoppable from 'stoppable';

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Railway HTTPS fix - use https server in production
const server = isProduction ? https.createServer(app) : http.createServer(app);

// Environment configuration
const FRONTEND_URL = isProduction
  ? process.env.PRODUCTION_URL
  : process.env.VITE_API_BASE_URL || "http://localhost:5173";

// Enhanced CORS for Railway
const corsOptions = {
  origin: [
    FRONTEND_URL || "http://localhost:5173", // Fallback if undefined
    "https://crypto-pay-nu.vercel.app",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Trust Railway proxy
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session config with Railway compatibility
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Logging middleware (unchanged)
app.use((req, res, next) => {
  const start = Date.now();
  let responseBody: any;
  // ... [keep existing logging code]
  next();
});

// Server startup
(async () => {
  try {
    await registerRoutes(app);

    // Railway health check endpoint
    app.get("/.well-known/health", (_req, res) =>
      res.json({ status: "ok", timestamp: new Date() })
    );

    if (isProduction) {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    // Error handler (fixed missing parenthesis)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Server Error:", err.stack || err.message);
      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        ...(!isProduction && { stack: err.stack }),
      });
    });

    const port = parseInt(process.env.PORT || "3000", 10);

    // Modified Railway startup with keep-alive
    const stoppableServer = stoppable(server.listen(port, "0.0.0.0", () => {
      const protocol = isProduction ? "https" : "http";
      const railwayUrl = `https://${
        process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${port}`
      }`;

      log(
        `✅ Server running in ${
          isProduction ? "production" : "development"
        } mode`
      );
      log(`- Local: ${protocol}://localhost:${port}`);
      log(`- Railway URL: ${railwayUrl}`);
      log(`- Connected to frontend: ${FRONTEND_URL}`);

      // Keep-alive heartbeat
      setInterval(() => {
        log(`❤️  Keep-alive ping ${new Date().toISOString()}`);
      }, 10000);
    }) );

    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('🛑 Received SIGTERM signal (Railway shutdown)');
      stoppableServer.stop(() => {
        log('🔌 Server stopped gracefully');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("❌ Fatal Server Error:", err);
    process.exit(1);
  }
})();
