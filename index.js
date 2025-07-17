var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import session from "express-session";
import cors2 from "cors";

// server/routes.ts
import cors from "cors";
import dotenv2 from "dotenv";
import { createServer } from "http";

// server/storage.ts
import bcrypt from "bcrypt";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  baseUserSchema: () => baseUserSchema,
  insertUserPlanSchema: () => insertUserPlanSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  serverInsertUserSchema: () => serverInsertUserSchema,
  userPlans: () => userPlans,
  userPlansRelations: () => userPlansRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  mysqlTable,
  varchar,
  int,
  boolean,
  timestamp,
  decimal
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  phonePrefix: varchar("phone_prefix", { length: 5 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0.00")
});
var userPlans = mysqlTable("user_plans", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  planType: varchar("plan_type", { length: 255 }).notNull(),
  investmentAmount: int("investment_amount").notNull(),
  expectedReturn: int("expected_return").notNull(),
  roi: int("roi").notNull(),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  userPlans: many(userPlans)
}));
var userPlansRelations = relations(userPlans, ({ one }) => ({
  user: one(users, {
    fields: [userPlans.userId],
    references: [users.id]
  })
}));
var baseUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phonePrefix: z.string().min(1, "Select a country code"),
  phoneNumber: z.string().min(6, "Enter a valid phone number")
});
var insertUserSchema = baseUserSchema.extend({
  confirmPassword: z.string().min(6, "Confirm password must match")
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match"
});
var serverInsertUserSchema = baseUserSchema;
var insertUserPlanSchema = createInsertSchema(userPlans).pick({
  userId: true,
  // ✅ add this
  planType: true,
  investmentAmount: true,
  expectedReturn: true,
  roi: true,
  status: true
});
var loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

// server/db.ts
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
console.log("Loaded DB URL:", process.env.DATABASE_URL);
var pool = mysql.createPool({
  uri: process.env.DATABASE_URL
});
var db = drizzle(pool, {
  schema: schema_exports,
  mode: "default"
  // This is required for TypeScript compatibility
});

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.ensureAdminUser();
  }
  async ensureAdminUser() {
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@cryptopay.com"));
    if (!admin) {
      const hashedPassword = await bcrypt.hash("1234", 10);
      await db.insert(users).values({
        name: "admin",
        email: "admin@cryptopay.com",
        password: hashedPassword,
        isAdmin: true,
        phonePrefix: "+234",
        phoneNumber: "0000000000"
      });
      console.log("\u2705 Admin user created: admin@cryptopay.com / 1234");
    }
  }
  addRole(user) {
    if (!user) return void 0;
    return {
      ...user,
      role: user.isAdmin ? "admin" : "user"
    };
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return this.addRole(user);
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return this.addRole(user);
  }
  async getUserByName(name) {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return this.addRole(user);
  }
  async createUser(user) {
    await db.insert(users).values(user);
    const [newUser] = await db.select().from(users).where(eq(users.email, user.email));
    return this.addRole(newUser);
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async deleteUser(userId) {
    await db.delete(userPlans).where(eq(userPlans.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return !user;
  }
  async getUserPlan(userId) {
    const [userPlan] = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
    return userPlan || void 0;
  }
  async getUserPlans(userId) {
    return await db.select().from(userPlans).where(eq(userPlans.userId, userId));
  }
  async createUserPlan(userPlan) {
    await db.insert(userPlans).values(userPlan);
    const [plan] = await db.select().from(userPlans).where(eq(userPlans.userId, userPlan.userId));
    return plan;
  }
  async updateUserPlanStatus(id, status) {
    await db.update(userPlans).set({ status }).where(eq(userPlans.id, id));
    const [updated] = await db.select().from(userPlans).where(eq(userPlans.id, id));
    return updated;
  }
  async activateUserPlan(planId) {
    await db.update(userPlans).set({ status: "active" }).where(eq(userPlans.id, planId));
    const [updated] = await db.select().from(userPlans).where(eq(userPlans.id, planId));
    return updated;
  }
  async getAllUserPlans() {
    const plans = await db.select({
      id: userPlans.id,
      userId: userPlans.userId,
      planType: userPlans.planType,
      investmentAmount: userPlans.investmentAmount,
      expectedReturn: userPlans.expectedReturn,
      roi: userPlans.roi,
      status: userPlans.status,
      createdAt: userPlans.createdAt,
      user: {
        name: users.name,
        email: users.email
      }
    }).from(userPlans).leftJoin(users, eq(userPlans.userId, users.id));
    return plans;
  }
  async getWallet(userId) {
    const [user] = await db.select({ walletBalance: users.walletBalance }).from(users).where(eq(users.id, userId));
    return user ? parseFloat(user.walletBalance) : 0;
  }
  async updateWalletBalance(userId, newBalance) {
    const result = await db.update(users).set({ walletBalance: newBalance.toString() }).where(eq(users.id, userId)).execute();
    return Array.isArray(result) ? result.length > 0 : true;
  }
  async getAllUserPlansWithUserDetails() {
    const result = await db.select({
      id: userPlans.id,
      userId: userPlans.userId,
      planType: userPlans.planType,
      investmentAmount: userPlans.investmentAmount,
      expectedReturn: userPlans.expectedReturn,
      roi: userPlans.roi,
      status: userPlans.status,
      createdAt: userPlans.createdAt,
      user: {
        name: users.name,
        email: users.email
      }
    }).from(userPlans).leftJoin(users, eq(userPlans.userId, users.id));
    return result;
  }
  async updateUserPasswordByEmail(email, newPassword) {
    const result = await db.update(users).set({ password: newPassword }).where(eq(users.email, email)).execute();
    return Array.isArray(result) ? result.length > 0 : true;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import bcrypt2 from "bcrypt";
import { z as z2 } from "zod";
import nodemailer from "nodemailer";
import { eq as eq2 } from "drizzle-orm";
dotenv2.config();
var otpStore = /* @__PURE__ */ new Map();
function generateOTP() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
var transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
async function registerRoutes(app2) {
  app2.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true
    })
  );
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
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = serverInsertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(parsed.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt2.hash(parsed.password, 10);
      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword
      });
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      };
      res.json(req.session.user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      let user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        user = await storage.getUserByName(loginData.email);
      }
      if (!user || !await bcrypt2.compare(loginData.password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role
      };
      res.json(req.session.user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Could not log out" });
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/user/wallet", requireAuth, async (req, res) => {
    try {
      const balance = await storage.getWallet(req.session.userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const existing = otpStore.get(email);
    if (existing && Date.now() - existing.lastSent < 6e4) {
      return res.status(429).json({ message: "Please wait before requesting another OTP" });
    }
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    otpStore.set(email, { code: otp, expiresAt, lastSent: Date.now() });
    try {
      const info = await transporter.sendMail({
        from: '"CryptoPay Support" <no-reply@cryptopay.com>',
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
      });
      console.log("OTP email sent:", nodemailer.getTestMessageUrl(info));
      res.json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });
  app2.post("/api/auth/verify-otp", async (req, res) => {
    const schema = z2.object({
      email: z2.string().email(),
      otp: z2.string().length(6),
      newPassword: z2.string().min(6)
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
    const hashed = await bcrypt2.hash(newPassword, 10);
    const updated = await storage.updateUserPasswordByEmail(email, hashed);
    otpStore.delete(email);
    if (!updated) {
      return res.status(500).json({ message: "Failed to reset password" });
    }
    res.json({ message: "Password reset successful" });
  });
  app2.get("/api/user/plans", requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const plans = await storage.getUserPlans(userId);
    res.json(plans);
  });
  app2.post("/api/user/plans", requireAuth, async (req, res) => {
    try {
      const parsed = insertUserPlanSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const created = await storage.createUserPlan(parsed);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/user/plans/:id/activate", requireAdmin, async (req, res) => {
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
    } catch (error) {
      console.error("Error activating plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/admin/plans/:id/status", requireAdmin, async (req, res) => {
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
  app2.patch("/api/admin/complete-plan/:planId", requireAdmin, async (req, res) => {
    const planId = parseInt(req.params.planId);
    if (isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    const [plan] = await db.select().from(userPlans).where(eq2(userPlans.id, planId));
    if (!plan || plan.status !== "active") {
      return res.status(404).json({ message: "Active plan not found" });
    }
    const updatedPlan = await storage.updateUserPlanStatus(plan.id, "completed");
    if (!updatedPlan) {
      return res.status(500).json({ message: "Failed to complete plan" });
    }
    const currentBalance = await storage.getWallet(plan.userId);
    const newBalance = (currentBalance ?? 0) + updatedPlan.expectedReturn;
    const walletUpdated = await storage.updateWalletBalance(plan.userId, newBalance);
    if (!walletUpdated) {
      return res.status(500).json({ message: "Plan completed but wallet update failed" });
    }
    res.json({
      message: "Plan marked as completed, wallet updated",
      payout: updatedPlan.expectedReturn
    });
  });
  app2.get("/api/plans", requireAdmin, async (_req, res) => {
    const allPlans = await storage.getAllUserPlans();
    res.json(allPlans);
  });
  app2.delete("/api/user/:id", requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  });
  app2.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users2 = await storage.getAllUsers();
    const plans = await storage.getAllUserPlansWithUserDetails();
    const userMap = /* @__PURE__ */ new Map();
    for (const user of users2) {
      userMap.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: !!user.isAdmin,
        plan: null
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
            status: plan.status
          }
        });
      }
    }
    res.json([...userMap.values()]);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  base: "/CryptoPay/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(
  cors2({
    origin: "http://localhost:5173",
    // frontend dev server
    credentials: true
  })
);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to true in production
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 1 week
    }
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  let capturedResponse;
  const origJson = res.json;
  res.json = function(body, ...args) {
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
(async () => {
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      console.error("\u274C Error:", err.message);
      res.status(err.status || 500).json({ message: err.message || "Server error" });
    });
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }
    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen(port, "127.0.0.1", () => {
      log(`\u2705 Server running at http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error("\u274C Server startup error:", err);
  }
})();
