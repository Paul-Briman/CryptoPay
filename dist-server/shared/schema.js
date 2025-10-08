import { pgTable, varchar, serial, boolean, timestamp, decimal, integer, } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// === PostgreSQL Tables ===
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    isAdmin: boolean("is_admin").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    phonePrefix: varchar("phone_prefix", { length: 5 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).notNull().default('0.00'),
});
export const userPlans = pgTable("user_plans", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    planType: varchar("plan_type", { length: 255 }).notNull(),
    investmentAmount: integer("investment_amount").notNull(),
    expectedReturn: integer("expected_return").notNull(),
    roi: integer("roi").notNull(),
    status: varchar("status", { length: 255 }).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});
// === Relationships ===
export const usersRelations = relations(users, ({ many }) => ({
    userPlans: many(userPlans),
}));
export const userPlansRelations = relations(userPlans, ({ one }) => ({
    user: one(users, {
        fields: [userPlans.userId],
        references: [users.id],
    }),
}));
// === Zod Schemas ===
export const baseUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phonePrefix: z.string().min(1, "Select a country code"),
    phoneNumber: z.string().min(6, "Enter a valid phone number"),
});
// ✅ For frontend: includes confirmPassword
export const insertUserSchema = baseUserSchema.extend({
    confirmPassword: z.string().min(6, "Confirm password must match"),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});
// ✅ For backend: no confirmPassword
export const serverInsertUserSchema = baseUserSchema;
// Plans
export const insertUserPlanSchema = createInsertSchema(userPlans).pick({
    userId: true, // ✅ add this
    planType: true,
    investmentAmount: true,
    expectedReturn: true,
    roi: true,
    status: true,
});
// Login
export const loginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});
