import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
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
        "https://breakable-hamster-cryptopay1-e5464d4c.koyeb.app",
        process.env.PRODUCTION_URL,
    ].filter(Boolean);
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    else {
        res.header("Access-Control-Allow-Origin", isProduction ? "https://crypto-pay-nu.vercel.app" : origin || "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});
// 2. Standard CORS middleware (backup)
const productionOrigins = [
    "https://crypto-pay-nu.vercel.app",
    "https://crypto-pay-git-main-briman-pauls-projects.vercel.app",
    "https://crypto-lppitu4fv-briman-pauls-projects.vercel.app",
    "https://cryptopay-production-2311.up.railway.app",
    "https://breakable-hamster-cryptopay1-e5464d4c.koyeb.app",
    process.env.PRODUCTION_URL,
].filter(Boolean);
app.use(cors({
    origin: isProduction ? productionOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.options("*", (_req, res) => {
    res.status(200).end();
});
// ========== END ATOMIC CORS FIX ========== //
// ❌ REMOVE HTTPS SERVER — KOYEB REQUIRES HTTP INTERNALLY
const server = http.createServer(app);
// Trust proxy
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        httpOnly: true,
        secure: true, // ALWAYS TRUE FOR KOYEB
        sameSite: "none", // REQUIRED FOR CROSS-ORIGIN COOKIE
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));
// Logging middleware
app.use((req, res, next) => {
    next();
});
// Server startup - FREE TIER OPTIMIZED VERSION
(async () => {
    try {
        await registerRoutes(app);
        app.get("/", (_req, res) => {
            res.json({
                status: "ok",
                service: "CryptoPay API",
                timestamp: new Date(),
                uptime: process.uptime(),
            });
        });
        app.get("/.well-known/health", (_req, res) => {
            console.log("❤️ [FREE-TIER-HEARTBEAT]", new Date().toISOString());
            res.json({ status: "ok", timestamp: new Date() });
        });
        // ❌ DISABLE STATIC SERVING IN PRODUCTION (BREAKS API ROUTING ON KOYEB)
        if (!isProduction) {
            await setupVite(app, server);
        }
        app.use((err, _req, res, _next) => {
            console.error("❌ Server Error:", err.stack || err.message);
            res.status(err.status || 500).json({
                message: err.message || "Internal Server Error",
            });
        });
        const port = parseInt(process.env.PORT || "3000", 10);
        const stoppableServer = stoppable(server);
        stoppableServer.listen(port, "0.0.0.0", () => {
            console.log(`🚀 Server launched on port ${port}`);
            console.log(`🔗 Health: /.well-known/health`);
        });
        process.on("SIGTERM", () => {
            console.log("🛑 Shutdown signal received");
            stoppableServer.stop(() => {
                console.log("🔌 Connections closed gracefully");
                process.exit(0);
            });
        });
    }
    catch (err) {
        console.error("❌ Fatal Server Error:", err);
        process.exit(1);
    }
})();
