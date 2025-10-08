import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import https from "https";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";
import stoppable from "stoppable";
const app = express();
const isProduction = process.env.NODE_ENV === "production";
// ========== ATOMIC CORS FIX (100% WILL WORK) ========== //
// PUT THIS AT THE VERY TOP - BEFORE ANY OTHER MIDDLEWARE
// 1. Manual CORS headers (universal)
app.use((req, res, next) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://crypto-pay-nu.vercel.app",
        "https://crypto-pay-git-main-briman-pauls-projects.vercel.app",
        "https://crypto-lppitu4fv-briman-pauls-projects.vercel.app",
        "https://cryptopay-production-2311.up.railway.app",
        process.env.PRODUCTION_URL,
    ].filter(Boolean); // Filter out undefined values
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    else {
        // Allow all in development, specific in production
        res.header("Access-Control-Allow-Origin", isProduction ? "https://crypto-pay-nu.vercel.app" : origin || "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    // Handle preflight immediately
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});
// 2. Standard CORS middleware (backup) - FIXED TYPE ERROR
const productionOrigins = [
    "https://crypto-pay-nu.vercel.app",
    "https://crypto-pay-git-main-briman-pauls-projects.vercel.app",
    "https://crypto-lppitu4fv-briman-pauls-projects.vercel.app",
    "https://cryptopay-production-2311.up.railway.app",
    process.env.PRODUCTION_URL,
].filter(Boolean); // Explicitly cast to string[]
app.use(cors({
    origin: isProduction ? productionOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
// 3. Explicit preflight handler
app.options("*", (req, res) => {
    res.status(200).end();
});
// ========== END ATOMIC CORS FIX ========== //
// Railway HTTPS fix - use https server in production
const server = isProduction ? https.createServer(app) : http.createServer(app);
// Trust Railway proxy
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));
// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    let responseBody;
    next();
});
// Server startup - FREE TIER OPTIMIZED VERSION
(async () => {
    try {
        await registerRoutes(app);
        // Add this RIGHT AFTER await registerRoutes(app);
        app.get("/", (_req, res) => {
            res.json({
                status: "ok",
                service: "CryptoPay API",
                timestamp: new Date(),
                uptime: process.uptime(),
            });
        });
        // Railway health check endpoint with enhanced logging
        app.get("/.well-known/health", (_req, res) => {
            console.log("❤️ [FREE-TIER-HEARTBEAT]", new Date().toISOString());
            res.json({ status: "ok", timestamp: new Date() });
        });
        if (isProduction) {
            serveStatic(app);
        }
        else {
            await setupVite(app, server);
        }
        // Error handler
        app.use((err, _req, res, _next) => {
            console.error("❌ Server Error:", err.stack || err.message);
            res.status(err.status || 500).json({
                message: err.message || "Internal Server Error",
                ...(!isProduction && { stack: err.stack }),
            });
        });
        const port = parseInt(process.env.PORT || "3000", 10);
        // ========== FREE TIER CRITICAL FIXES START ========== //
        const stoppableServer = stoppable(server);
        // Railway Keep-Alive Hammer (7-second pulses for free tier)
        const keepAlive = setInterval(() => {
            console.log("🏓 [RAILWAY-FREE-KEEPALIVE]", new Date().toISOString());
        }, 7000);
        stoppableServer.listen(port, "0.0.0.0", () => {
            console.log(`🚀 Server launched on port ${port}`);
            console.log("🔧 Free Tier Mode: ACTIVE (7s keep-alive pulses)");
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
    }
    catch (err) {
        console.error("❌ Fatal Server Error:", err);
        process.exit(1);
    }
})();
