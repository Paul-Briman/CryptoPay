import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const userPlans = pgTable("user_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planType: text("plan_type").notNull(), // 'basic', 'gold', 'platinum', 'diamond'
  investmentAmount: integer("investment_amount").notNull(),
  expectedReturn: integer("expected_return").notNull(),
  roi: integer("roi").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'completed'
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  userPlans: many(userPlans),
}));

export const userPlansRelations = relations(userPlans, ({ one }) => ({
  user: one(users, {
    fields: [userPlans.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const insertUserPlanSchema = createInsertSchema(userPlans).pick({
  userId: true,
  planType: true,
  investmentAmount: true,
  expectedReturn: true,
  roi: true,
  status: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type LoginData = z.infer<typeof loginSchema>;
