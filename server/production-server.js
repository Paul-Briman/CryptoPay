import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import { registerRoutes } from "./routes.js";
import stoppable from "stoppable";
const app = express();
const isProduction = process.env.NODE_ENV === "production";
// CORS configuration for Render
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://crypto-pay-nu.vercel.app",
    "https://crypto-pay-git-main-briman-pauls-projects.vercel.app",
    "https://crypto-lppitu4fv-briman-pauls-projects.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
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
// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});
// Register routes
registerRoutes(app);
// Error handler
app.use((err, _req, res, _next) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    });
});
const port = parseInt(process.env.PORT || "3000", 10);
// Start server
const server = stoppable(http.createServer(app));
server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("Shutdown signal received");
    server.stop(() => {
        console.log("Server stopped gracefully");
        process.exit(0);
    });
});
