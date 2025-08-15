import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = http.createServer(app);

// Environment configuration
const isProduction = process.env.NODE_ENV === "production";
const FRONTEND_URL = isProduction 
  ? process.env.PRODUCTION_URL 
  : process.env.VITE_API_BASE_URL || "http://localhost:5173";

// Middleware
app.use(cors({ 
  origin: FRONTEND_URL, 
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  let responseBody: any;
  
  const originalJson = res.json;
  res.json = function (body, ...args) {
    responseBody = body;
    return originalJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      let logMessage = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
      if (responseBody) {
        logMessage += ` :: ${JSON.stringify(responseBody).slice(0, 100)}${responseBody.length > 100 ? "..." : ""}`;
      }
      log(logMessage);
    }
  });
  next();
});

// Server startup
(async () => {
  try {
    // 1. Register API routes
    await registerRoutes(app);

    // 2. Health check endpoint
    app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

    // 3. Frontend serving logic
    if (isProduction) {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    // 4. Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Server Error:", err.stack || err.message);
      res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error",
        ...(!isProduction && { stack: err.stack })
      });
    });

    // 5. Start server
    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`✅ Server running in ${isProduction ? "production" : "development"} mode`);
      log(`- API: http://localhost:${port}/api`);
      if (!isProduction) {
        log(`- Frontend: ${FRONTEND_URL}`);
      }
    });

  } catch (err) {
    console.error("❌ Fatal Server Error:", err);
    process.exit(1);
  }
})();




