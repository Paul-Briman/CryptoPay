import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertUserPlanSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'cryptopay-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(loginData.email);
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Plan routes
  app.post("/api/plans", requireAuth, async (req, res) => {
    try {
      const planData = insertUserPlanSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      // Check if user already has a plan
      const existingPlan = await storage.getUserPlan(req.session.userId);
      if (existingPlan) {
        return res.status(400).json({ message: "User already has an active plan" });
      }

      const plan = await storage.createUserPlan(planData);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/plans/my", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getUserPlan(req.session.userId);
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const plans = await storage.getAllUserPlans();
      
      const usersWithPlans = users.map(user => {
        const plan = plans.find(p => p.userId === user.id);
        return {
          ...user,
          plan: plan || null
        };
      });
      
      res.json(usersWithPlans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/plans/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const plan = await storage.updateUserPlanStatus(parseInt(id), status);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bitcoin price route (proxy to CoinGecko)
  app.get("/api/bitcoin/price", async (req, res) => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      res.json({
        price: data.bitcoin.usd,
        change: data.bitcoin.usd_24h_change
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch Bitcoin price" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
