import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  heroIngredient: text("hero_ingredient").notNull(),
  cookTime: integer("cook_time").notNull(),
  servings: integer("servings").notNull(),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  rating: integer("rating").default(0),
  photo: text("photo"),
  cookingLog: jsonb("cooking_log").$type<CookingLogEntry[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

export interface CookingLogEntry {
  timestamp: string; // ISO timestamp for precise sorting
  notes: string;
  rating: number;
}

export const heroIngredientOptions = [
  "Chicken", "Beef", "Pork", "Fish", "Seafood", 
  "Pasta", "Vegetable", "Pastry", "Dessert"
] as const;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
  passwordResetToken: true,
  passwordResetExpires: true,
}).extend({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  userId: true,
  createdAt: true,
  rating: true,
}).extend({
  cookTime: z.number().min(1).max(1440),
  servings: z.number().min(1).max(50),
  heroIngredient: z.enum(heroIngredientOptions),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
