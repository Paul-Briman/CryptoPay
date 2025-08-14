// routes.ts
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  serverInsertUserSchema,
  loginSchema,
  insertUserPlanSchema,
  type InsertUserPlan,
  userPlans,
} from "@shared/schema";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import nodemailer from "nodemailer";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Extend express-session
declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: { id: number; name: string; email: string; isAdmin: boolean | null; role?: string };
  }
}

const otpStore = new Map<string, { code: string; expiresAt: number; lastSent: number }>();
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS with preflight
  const corsOptions = {
    origin: ["http://localhost:5173", "https://crypto-pay-nu.vercel.app"],
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // preflight

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Health check
  app.get("/", (_req, res) => res.json({ status: "ok", time: new Date() }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date() }));

  // === Auth ===
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = serverInsertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(parsed.email);
      if (existingUser) return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });

      const welcomeHTML = `<div style="background:#0e0e0e;color:#f0f0f0;padding:30px;border-radius:12px;text-align:center;">
      <h1 style="color:#FFD700;">Welcome ${user.name}!</h1><p>Your journey with CryptoPay starts now.</p></div>`;

      await transporter.sendMail({ from: '"CryptoPay" <no-reply@cryptopay.com>', to: user.email, subject: "Welcome!", html: welcomeHTML });

      req.session.userId = user.id;
      req.session.user = { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
      res.json(req.session.user);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      let user = await storage.getUserByEmail(loginData.email);
      if (!user) user = await storage.getUserByName(loginData.email);
      if (!user || !(await bcrypt.compare(loginData.password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.user = { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, role: user.role };
      res.json(req.session.user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Could not log out" });
      res.json({ message: "Logged out successfully" });
    });
  });

  // OTP routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ message: "Invalid email" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });

      const existing = otpStore.get(email);
      if (existing && Date.now() - existing.lastSent < 60_000)
        return res.status(429).json({ message: "Wait before requesting another OTP" });

      const otp = generateOTP();
      otpStore.set(email, { code: otp, expiresAt: Date.now() + 10 * 60_000, lastSent: Date.now() });

      await transporter.sendMail({ from: '"CryptoPay" <no-reply@cryptopay.com>', to: email, subject: "Your OTP Code", text: `Your OTP code is: ${otp}`, html: `<p>Your OTP code is: <b>${otp}</b></p>` });
      res.json({ message: "OTP sent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error sending OTP" });
    }
  });

  // Add other user plan, admin, and wallet routes similarly with try/catch and requireAuth/requireAdmin

  const httpServer = createServer(app);
  return httpServer;
}
