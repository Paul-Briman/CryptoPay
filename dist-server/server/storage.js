import bcrypt from "bcrypt";
import { users, userPlans, } from "@shared/schema";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
export class DatabaseStorage {
    constructor() {
        this.ensureAdminUser();
    }
    async ensureAdminUser() {
        const [admin] = await db
            .select()
            .from(users)
            .where(eq(users.email, "admin@cryptopay.com"));
        if (!admin) {
            const hashedPassword = await bcrypt.hash("1234", 10);
            await db.insert(users).values({
                name: "admin",
                email: "admin@cryptopay.com",
                password: hashedPassword,
                isAdmin: true,
                phonePrefix: "+234",
                phoneNumber: "0000000000",
            });
            console.log("✅ Admin user created: admin@cryptopay.com / 1234");
        }
    }
    addRole(user) {
        if (!user)
            return undefined;
        return {
            ...user,
            role: user.isAdmin ? "admin" : "user",
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
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!existingUser)
            return false;
        await db.delete(userPlans).where(eq(userPlans.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
        const [deletedCheck] = await db.select().from(users).where(eq(users.id, userId));
        return !deletedCheck;
    }
    async getUserPlan(userId) {
        const [userPlan] = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
        return userPlan || undefined;
    }
    async getUserPlans(userId) {
        return await db.select().from(userPlans).where(eq(userPlans.userId, userId));
    }
    async createUserPlan(userPlan) {
        await db.insert(userPlans).values(userPlan);
        const [plan] = await db
            .select()
            .from(userPlans)
            .where(eq(userPlans.userId, userPlan.userId));
        return plan;
    }
    async updateUserPlanStatus(id, status) {
        await db.update(userPlans).set({ status }).where(eq(userPlans.id, id));
        const [updated] = await db.select().from(userPlans).where(eq(userPlans.id, id));
        // ✅ CREDIT WALLET WITH INVESTMENT AMOUNT IF STATUS SET TO "active"
        if (updated && status === "active") {
            const currentBalance = await this.getWallet(updated.userId);
            const newBalance = (currentBalance ?? 0) + updated.investmentAmount;
            await this.updateWalletBalance(updated.userId, newBalance);
        }
        return updated;
    }
    async activateUserPlan(planId) {
        const [plan] = await db.select().from(userPlans).where(eq(userPlans.id, planId));
        if (!plan || plan.status === "active") {
            console.log("Plan not found or already active.");
            return undefined;
        }
        await db.update(userPlans).set({ status: "active" }).where(eq(userPlans.id, planId));
        console.log(`Plan ${planId} activated.`);
        const currentBalance = await this.getWallet(plan.userId);
        console.log(`Current wallet balance for user ${plan.userId}: ₦${currentBalance}`);
        const newBalance = currentBalance + plan.investmentAmount;
        console.log(`New balance should be: ₦${newBalance}`);
        const walletUpdated = await this.updateWalletBalance(plan.userId, newBalance);
        if (!walletUpdated) {
            console.error("⚠️ Wallet update failed.");
        }
        else {
            console.log(`✅ Wallet updated for user ${plan.userId}: ₦${newBalance}`);
        }
        const [updated] = await db.select().from(userPlans).where(eq(userPlans.id, planId));
        return updated;
    }
    async getAllUserPlans() {
        const plans = await db
            .select({
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
                email: users.email,
            },
        })
            .from(userPlans)
            .leftJoin(users, eq(userPlans.userId, users.id));
        return plans;
    }
    async getWallet(userId) {
        const [user] = await db
            .select({ walletBalance: users.walletBalance })
            .from(users)
            .where(eq(users.id, userId));
        return user ? parseFloat(user.walletBalance) : 0;
    }
    async updateWalletBalance(userId, newBalance) {
        const result = await db
            .update(users)
            .set({ walletBalance: newBalance.toString() })
            .where(eq(users.id, userId))
            .execute();
        return Array.isArray(result) ? result.length > 0 : true;
    }
    async getAllUserPlansWithUserDetails() {
        const result = await db
            .select({
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
                email: users.email,
            },
        })
            .from(userPlans)
            .leftJoin(users, eq(userPlans.userId, users.id));
        return result;
    }
    async updateUserPasswordByEmail(email, newPassword) {
        const result = await db
            .update(users)
            .set({ password: newPassword })
            .where(eq(users.email, email))
            .execute();
        return Array.isArray(result) ? result.length > 0 : true;
    }
}
export const storage = new DatabaseStorage();
