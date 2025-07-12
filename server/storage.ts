import { users, userPlans, type User, type InsertUser, type UserPlan, type InsertUserPlan } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getUserPlan(userId: number): Promise<UserPlan | undefined>;
  createUserPlan(userPlan: InsertUserPlan): Promise<UserPlan>;
  updateUserPlanStatus(id: number, status: string): Promise<UserPlan | undefined>;
  getAllUserPlans(): Promise<UserPlan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPlans: Map<number, UserPlan>;
  private currentUserId: number;
  private currentUserPlanId: number;

  constructor() {
    this.users = new Map();
    this.userPlans = new Map();
    this.currentUserId = 1;
    this.currentUserPlanId = 1;
    
    // Create admin user
    this.createUser({
      name: "admin",
      email: "admin@cryptopay.com",
      password: "1234"
    }).then(admin => {
      admin.isAdmin = true;
      this.users.set(admin.id, admin);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name === name,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserPlan(userId: number): Promise<UserPlan | undefined> {
    return Array.from(this.userPlans.values()).find(
      (plan) => plan.userId === userId,
    );
  }

  async createUserPlan(insertUserPlan: InsertUserPlan): Promise<UserPlan> {
    const id = this.currentUserPlanId++;
    const userPlan: UserPlan = { 
      ...insertUserPlan, 
      id,
      status: insertUserPlan.status || "pending",
      createdAt: new Date()
    };
    this.userPlans.set(id, userPlan);
    return userPlan;
  }

  async updateUserPlanStatus(id: number, status: string): Promise<UserPlan | undefined> {
    const plan = this.userPlans.get(id);
    if (plan) {
      plan.status = status;
      this.userPlans.set(id, plan);
      return plan;
    }
    return undefined;
  }

  async getAllUserPlans(): Promise<UserPlan[]> {
    return Array.from(this.userPlans.values());
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserPlan(userId: number): Promise<UserPlan | undefined> {
    const [userPlan] = await db
      .select()
      .from(userPlans)
      .where(eq(userPlans.userId, userId));
    return userPlan || undefined;
  }

  async createUserPlan(insertUserPlan: InsertUserPlan): Promise<UserPlan> {
    const [userPlan] = await db
      .insert(userPlans)
      .values(insertUserPlan)
      .returning();
    return userPlan;
  }

  async updateUserPlanStatus(id: number, status: string): Promise<UserPlan | undefined> {
    const [updatedPlan] = await db
      .update(userPlans)
      .set({ status })
      .where(eq(userPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async getAllUserPlans(): Promise<UserPlan[]> {
    return await db.select().from(userPlans);
  }
}

export const storage = new DatabaseStorage();
