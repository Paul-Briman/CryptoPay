import express from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import type { Request, Response, NextFunction } from "express";

const app = express();

// ✅ CORS for frontend on Vite (adjust port if needed)
app.use(
  cors({
    origin: "http://localhost:5173", // frontend dev server
    credentials: true,
  })
);

// ✅ Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// ✅ Optional: log API responses
app.use((req, res, next) => {
  const start = Date.now();
  let capturedResponse: any;
  const origJson = res.json;
  res.json = function (body, ...args) {
    capturedResponse = body;
    return origJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const time = Date.now() - start;
      let logLine = `${req.method} ${req.path} ${res.statusCode} - ${time}ms`;
      if (capturedResponse) {
        logLine += ` :: ${JSON.stringify(capturedResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ✅ Register API routes
(async () => {
  try {
    const server = await registerRoutes(app);

    // ✅ Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Error:", err.message);
      res.status(err.status || 500).json({ message: err.message || "Server error" });
    });

    // ✅ Serve frontend only in production
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      // You can skip this entirely if Vite is running separately on port 5173
      await setupVite(app, server); 
    }

    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen(port, "127.0.0.1", () => {
      log(`✅ Server running at http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
  }
})();


