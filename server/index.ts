import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import http from "http";

const app = express();

// ✅ Frontend URL from environment variable (Vercel/Railway)
const FRONTEND_URL = process.env.VITE_API_BASE_URL || "http://localhost:5173";

// ✅ Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ✅ Logging middleware
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
      if (responseBody) logMessage += ` :: ${JSON.stringify(responseBody)}`;
      log(logMessage);
    }
  });

  next();
});

(async () => {
  try {
    // ✅ Register all API routes
    await registerRoutes(app);

    // ✅ Serve frontend in production
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    }

    // ✅ Create HTTP server
    const server = http.createServer(app);

    // ✅ Vite dev setup (only in development)
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    }

    // ✅ Error handler (after routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Error:", err.message);
      res.status(err.status || 500).json({ message: err.message || "Server error" });
    });

    // ✅ Listen on Railway-assigned PORT
    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`✅ Server running at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
  }
})();


