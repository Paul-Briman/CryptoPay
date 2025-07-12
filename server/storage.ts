import { users, userPlans, type User, type InsertUser, type UserPlan, type InsertUserPlan } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
      name: "Admin",
      email: "admin@cryptopay.com",
      password: "admin123"
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

export const storage = new MemStorage();
