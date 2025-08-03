import { type Recipe, type InsertRecipe, type CookingLogEntry, type User, type InsertUser, recipes, users } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Recipe operations
  getRecipes(userId?: string): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe, userId: string): Promise<Recipe>;
  updateRecipe(id: string, updates: Partial<InsertRecipe>, userId: string): Promise<Recipe | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;
  addCookingLog(id: string, logEntry: CookingLogEntry, userId: string): Promise<Recipe | undefined>;
  removeCookingLog(id: string, logIndex: number, userId: string): Promise<Recipe | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Recipe operations
  async getRecipes(userId?: string): Promise<Recipe[]> {
    const query = userId 
      ? db.select().from(recipes).where(eq(recipes.userId, userId))
      : db.select().from(recipes);
    
    const allRecipes = await query;
    
    // Sort recipes by latest cooking activity, then by creation date
    return allRecipes.sort((a, b) => {
      const aLatestLog = (a.cookingLog && a.cookingLog.length > 0) 
        ? new Date(a.cookingLog[a.cookingLog.length - 1].timestamp).getTime()
        : new Date(a.createdAt!).getTime();
      
      const bLatestLog = (b.cookingLog && b.cookingLog.length > 0) 
        ? new Date(b.cookingLog[b.cookingLog.length - 1].timestamp).getTime()
        : new Date(b.createdAt!).getTime();
      
      return bLatestLog - aLatestLog;
    });
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async createRecipe(insertRecipe: InsertRecipe, userId: string): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values({
        ...insertRecipe,
        userId,
        rating: 0,
        cookingLog: [],
      })
      .returning();
    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>, userId: string): Promise<Recipe | undefined> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(updates as any)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return updatedRecipe || undefined;
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async addCookingLog(id: string, logEntry: CookingLogEntry, userId: string): Promise<Recipe | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe || recipe.userId !== userId) return undefined;

    const currentLog = recipe.cookingLog || [];
    const updatedLog = [logEntry, ...currentLog];
    
    // Calculate new average rating from all cooking log entries
    const totalRatings = updatedLog.reduce((sum, entry) => sum + entry.rating, 0);
    const averageRating = Math.round(totalRatings / updatedLog.length);

    const [updatedRecipe] = await db
      .update(recipes)
      .set({ 
        cookingLog: updatedLog,
        rating: averageRating
      })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    
    return updatedRecipe || undefined;
  }

  async removeCookingLog(id: string, logIndex: number, userId: string): Promise<Recipe | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe || recipe.userId !== userId || !recipe.cookingLog) return undefined;

    const currentLog = [...recipe.cookingLog];
    if (logIndex < 0 || logIndex >= currentLog.length) return undefined;

    // Remove the log entry at the specified index
    currentLog.splice(logIndex, 1);
    
    // Recalculate average rating from remaining entries
    let averageRating = 0;
    if (currentLog.length > 0) {
      const totalRatings = currentLog.reduce((sum, entry) => sum + entry.rating, 0);
      averageRating = Math.round(totalRatings / currentLog.length);
    }

    const [updatedRecipe] = await db
      .update(recipes)
      .set({ 
        cookingLog: currentLog,
        rating: averageRating
      })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    
    return updatedRecipe || undefined;
  }
}

export const storage = new DatabaseStorage();