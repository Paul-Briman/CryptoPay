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

// ========== COMPREHENSIVE CORS CONFIGURATION START ========== //
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Express server
  "https://crypto-pay-nu.vercel.app", // Vercel frontend
  "https://crypto-pay-git-main-briman-pauls-projects.vercel.app",
  "https://crypto-lppitu4fv-briman-pauls-projects.vercel.app",
  process.env.PRODUCTION_URL, // Railway backend
].filter(Boolean) as string[];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["set-cookie"]
};

app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Additional preflight handler for Express
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || allowedOrigins[0]);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  next();
});
// ========== COMPREHENSIVE CORS CONFIGURATION END ========== //

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

// Logging middleware
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
    }, 7000);

    stoppableServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server launched on port ${port}`);
      console.log('🔧 Free Tier Mode: ACTIVE (7s keep-alive pulses)');
      console.log(`🔗 Health: /.well-known/health`);
      console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
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