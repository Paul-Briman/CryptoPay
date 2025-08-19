import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import https from "https";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import stoppable from "stoppable";
import type { StoppableServer } from "stoppable";

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
    FRONTEND_URL || "http://localhost:5173",
    "https://crypto-pay-nu.vercel.app",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Trust Railway proxy
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session config
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
  next();
});

// Server startup - FREE TIER OPTIMIZED VERSION
(async () => {
  try {
    await registerRoutes(app);

    // Railway health check endpoint with enhanced logging
    app.get("/.well-known/health", (_req, res) => {
      console.log('❤️ [FREE-TIER-HEARTBEAT]', new Date().toISOString());
      res.json({ status: "ok", timestamp: new Date() });
    });

    if (isProduction) {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Server Error:", err.stack || err.message);
      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        ...(!isProduction && { stack: err.stack }),
      });
    });

    const port = parseInt(process.env.PORT || "3000", 10);

    // ========== FREE TIER CRITICAL FIXES START ========== //
    const stoppableServer: StoppableServer = stoppable(server);

    // Railway Keep-Alive Hammer (7-second pulses for free tier)
    const keepAlive = setInterval(() => {
      console.log("🏓 [RAILWAY-FREE-KEEPALIVE]", new Date().toISOString());
    }, 7000); // Changed to 7 seconds for free tier

    stoppableServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server launched on port ${port}`);
      console.log('🔧 Free Tier Mode: ACTIVE (7s keep-alive pulses)');
      console.log(`🔗 Health: /.well-known/health`);
    });

    // Graceful shutdown with cleanup
    process.on("SIGTERM", () => {
      clearInterval(keepAlive);
      console.log("🛑 Railway shutdown signal received");
      stoppableServer.stop(() => {
        console.log("🔌 Connections closed gracefully");
        process.exit(0);
      });
    });
    // ========== FREE TIER CRITICAL FIXES END ========== //
  } catch (err) {
    console.error("❌ Fatal Server Error:", err);
    process.exit(1);
  }
})();
