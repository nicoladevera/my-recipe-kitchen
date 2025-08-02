import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export interface CookingLogEntry {
  timestamp: string; // ISO timestamp for precise sorting
  notes: string;
  rating: number;
}

export const heroIngredientOptions = [
  "Chicken", "Beef", "Pork", "Fish", "Seafood", 
  "Pasta", "Vegetable", "Pastry", "Dessert"
] as const;

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  rating: true, // Remove rating from insert schema
}).extend({
  cookTime: z.number().min(1).max(1440), // 1 minute to 24 hours
  servings: z.number().min(1).max(50),
  heroIngredient: z.enum(heroIngredientOptions),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
