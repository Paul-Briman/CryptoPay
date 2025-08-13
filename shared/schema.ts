import {
  mysqlTable,
  varchar,
  int,
  boolean,
  timestamp,
  decimal,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === MySQL Tables ===

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  phonePrefix: varchar("phone_prefix", { length: 5 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).notNull().default('0.00'),

});

export const userPlans = mysqlTable("user_plans", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planType: varchar("plan_type", { length: 255 }).notNull(),
  investmentAmount: int("investment_amount").notNull(),
  expectedReturn: int("expected_return").notNull(),
  roi: int("roi").notNull(),
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

// === Types ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;           // frontend type
export type ServerInsertUser = z.infer<typeof serverInsertUserSchema>; // ✅ backend type
export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type LoginData = z.infer<typeof loginSchema>;



