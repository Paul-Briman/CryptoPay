import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { storage } from "./storage.js";
import { serverInsertUserSchema, loginSchema, insertUserPlanSchema, userPlans, } from "../shared/schema.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import nodemailer from "nodemailer";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
console.log("✅✅✅ ROUTES.TS IS LOADED! ✅✅✅");
const otpStore = new Map();
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export async function registerRoutes(app) {
    console.log("🚀🚀🚀 registerRoutes() RAN! 🚀🚀🚀");
    // ========== RAILWAY CRITICAL FIXES START ========== //
    // 🚨 HEALTH CHECKS AT THE VERY TOP (BEFORE ANY MIDDLEWARE)
    app.get("/", (_req, res) => {
        console.log('✅ Root endpoint hit - Railway health check');
        res.json({
            status: "ok",
            time: new Date(),
            service: "CryptoPay API",
            uptime: process.uptime()
        });
    });
    app.get("/.well-known/health", (_req, res) => {
        console.log('❤️ Railway health check triggered');
        res.json({
            status: "ok",
            timestamp: new Date(),
            service: "cryptopay",
            uptime: process.uptime(),
        });
    });
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", time: new Date() });
    });
    // ========== BITCOIN PRICE API ========== //
    app.get("/api/bitcoin/price", async (_req, res) => {
        try {
            console.log("Fetching Bitcoin price from Binance...");
            // Get current price
            const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
            const priceData = await priceRes.json();
            // Get 24h change
            const changeRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
            const changeData = await changeRes.json();
            res.json({
                price: parseFloat(priceData.price),
                change: parseFloat(changeData.priceChangePercent)
            });
        }
        catch (error) {
            console.error("Failed to fetch Bitcoin price:", error);
            res.json({
                price: 68854.93,
                change: 3.6
            });
        }
    });
    // ========== RAILWAY CRITICAL FIXES END ========== //
    // Auth middleware
    const requireAuth = (req, res, next) => {
        if (!req.session?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        next();
    };
    const requireAdmin = async (req, res, next) => {
        if (!req.session?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await storage.getUser(req.session.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    };
    // === Auth Routes ===
    app.post("/api/auth/register", async (req, res) => {
        try {
            const parsed = serverInsertUserSchema.parse(req.body);
            const existingUser = await storage.getUserByEmail(parsed.email);
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }
            const hashedPassword = await bcrypt.hash(parsed.password, 10);
            const user = await storage.createUser({
                ...parsed,
                password: hashedPassword,
            });
            const welcomeHTML = `<div style="background:#0e0e0e;color:#f0f0f0;padding:30px;border-radius:12px;text-align:center;">
      <h1 style="color:#FFD700;">Welcome ${user.name}!</h1><p>Your journey with CryptoPay starts now.</p></div>`;
            await transporter.sendMail({
                from: '"CryptoPay" <no-reply@cryptopay.com>',
                to: user.email,
                subject: "Welcome!",
                html: welcomeHTML,
            });
            req.session.userId = user.id;
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            };
            res.json(req.session.user);
        }
        catch (error) {
            console.error("Registration error:", error);
            res.status(400).json({ message: error.message });
        }
    });
    app.post("/api/auth/login", async (req, res) => {
        try {
            const loginData = loginSchema.parse(req.body);
            let user = await storage.getUserByEmail(loginData.email);
            if (!user) {
                user = await storage.getUserByName(loginData.email);
            }
            if (!user || !(await bcrypt.compare(loginData.password, user.password))) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            req.session.userId = user.id;
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                role: user.role,
            };
            res.json(req.session.user);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    });
    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err)
                return res.status(500).json({ message: "Could not log out" });
            res.json({ message: "Logged out successfully" });
        });
    });
    app.get("/api/auth/me", requireAuth, async (req, res) => {
        try {
            const userId = req.session.userId;
            const user = await storage.getUser(userId);
            if (!user)
                return res.status(404).json({ message: "User not found" });
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
    // === OTP Routes ===
    app.post("/api/auth/send-otp", async (req, res) => {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Invalid email" });
        }
        const user = await storage.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const existing = otpStore.get(email);
        if (existing && Date.now() - existing.lastSent < 60000) {
            return res
                .status(429)
                .json({ message: "Please wait before requesting another OTP" });
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(email, { code: otp, expiresAt, lastSent: Date.now() });
        try {
            const info = await transporter.sendMail({
                from: '"CryptoPay Support" <no-reply@cryptopay.com>',
                to: email,
                subject: "Your OTP Code",
                text: `Your OTP code is: ${otp}`,
                html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`,
            });
            console.log("OTP email sent:", nodemailer.getTestMessageUrl(info));
            res.json({ message: "OTP sent to your email" });
        }
        catch (error) {
            console.error("Failed to send OTP email:", error);
            res.status(500).json({ message: "Failed to send OTP email" });
        }
    });
    app.post("/api/auth/verify-otp", async (req, res) => {
        const schema = z.object({
            email: z.string().email(),
            otp: z.string().length(6),
            newPassword: z.string().min(6),
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: "Invalid input" });
        }
        const { email, otp, newPassword } = result.data;
        const record = otpStore.get(email);
        if (!record || record.code !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: "OTP expired" });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        const updated = await storage.updateUserPasswordByEmail(email, hashed);
        otpStore.delete(email);
        if (!updated) {
            return res.status(500).json({ message: "Failed to reset password" });
        }
        res.json({ message: "Password reset successful" });
    });
    // === Wallet Routes ===
    app.get("/api/user/wallet", requireAuth, async (req, res) => {
        try {
            const balance = await storage.getWallet(req.session.userId);
            res.json({ balance });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
    // === User Plans Routes ===
    app.get("/api/user/plans", requireAuth, async (req, res) => {
        const userId = req.session.userId;
        const plans = await storage.getUserPlans(userId);
        res.json(plans);
    });
    app.post("/api/user/plans", requireAuth, async (req, res) => {
        try {
            const parsed = insertUserPlanSchema.parse({
                ...req.body,
                userId: req.session.userId,
            });
            const created = await storage.createUserPlan(parsed);
            res.json(created);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    });
    // === Admin Routes ===
    app.patch("/api/user/plans/:id/activate", requireAdmin, async (req, res) => {
        try {
            const planId = parseInt(req.params.id);
            if (isNaN(planId)) {
                return res.status(400).json({ message: "Invalid plan ID" });
            }
            const updated = await storage.activateUserPlan(planId);
            if (!updated) {
                return res.status(404).json({ message: "Plan not found" });
            }
            res.status(200).json({ message: "Plan activated successfully" });
        }
        catch (error) {
            console.error("Error activating plan:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    app.patch("/api/admin/plans/:id/status", requireAdmin, async (req, res) => {
        const planId = parseInt(req.params.id);
        const { status } = req.body;
        if (!["pending", "active", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const updated = await storage.updateUserPlanStatus(planId, status);
        if (!updated) {
            return res.status(404).json({ message: "Plan not found" });
        }
        res.json({ message: `Plan status updated to ${status}` });
    });
    app.patch("/api/admin/complete-plan/:planId", requireAdmin, async (req, res) => {
        const planId = parseInt(req.params.planId);
        if (isNaN(planId)) {
            return res.status(400).json({ message: "Invalid plan ID" });
        }
        const [plan] = await db
            .select()
            .from(userPlans)
            .where(eq(userPlans.id, planId));
        if (!plan || plan.status !== "active") {
            return res.status(404).json({ message: "Active plan not found" });
        }
        const updatedPlan = await storage.updateUserPlanStatus(plan.id, "completed");
        if (!updatedPlan) {
            return res.status(500).json({ message: "Failed to complete plan" });
        }
        // Update user's wallet balance
        const currentBalance = await storage.getWallet(plan.userId);
        const newBalance = (currentBalance ?? 0) + updatedPlan.expectedReturn;
        const walletUpdated = await storage.updateWalletBalance(plan.userId, newBalance);
        if (!walletUpdated) {
            return res
                .status(500)
                .json({ message: "Plan completed but wallet update failed" });
        }
        res.json({
            message: "Plan marked as completed, wallet updated",
            payout: updatedPlan.expectedReturn,
        });
    });
    app.get("/api/admin/users", requireAdmin, async (_req, res) => {
        const users = await storage.getAllUsers();
        const plans = await storage.getAllUserPlansWithUserDetails();
        const userMap = new Map();
        for (const user of users) {
            userMap.set(user.id, {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: !!user.isAdmin,
                plan: null,
            });
        }
        for (const plan of plans) {
            if (plan.user) {
                userMap.set(plan.userId, {
                    id: plan.userId,
                    name: plan.user.name,
                    email: plan.user.email,
                    isAdmin: false,
                    plan: {
                        id: plan.id,
                        planType: plan.planType,
                        investmentAmount: plan.investmentAmount,
                        expectedReturn: plan.expectedReturn,
                        roi: plan.roi,
                        status: plan.status,
                    },
                });
            }
        }
        res.json([...userMap.values()]);
    });
    app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
        const userId = parseInt(req.params.id);
        const deleted = await storage.deleteUser(userId);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted" });
    });
    return createServer(app);
}
