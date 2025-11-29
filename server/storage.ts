import { type Recipe, type InsertRecipe, type CookingLogEntry, type User, type InsertUser, recipes, users } from "@shared/schema";
import { db, getEnvironment } from "./db";
import { eq, and, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean>;
  
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
    const currentEnv = getEnvironment();
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.environment, currentEnv)));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const currentEnv = getEnvironment();
    const [user] = await db.select().from(users).where(and(eq(users.username, username), eq(users.environment, currentEnv)));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const currentEnv = getEnvironment();
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.environment, currentEnv)));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const currentEnv = getEnvironment();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, environment: currentEnv })
      .returning();

    if (!user || !user.id) {
      throw new Error('User creation failed - no user returned from database');
    }

    // Add small delay for serverless database propagation (Neon eventual consistency)
    await new Promise(resolve => setTimeout(resolve, 25));

    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const currentEnv = getEnvironment();
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(users.id, id), eq(users.environment, currentEnv)))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const { comparePasswords, hashPassword } = await import("./auth");
    
    // Get user to verify current password
    const user = await this.getUser(id);
    if (!user) return false;
    
    // Verify current password
    const isCurrentPasswordCorrect = await comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) return false;
    
    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);
    const currentEnv = getEnvironment();
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedNewPassword, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.environment, currentEnv)))
      .returning();
    
    return !!updatedUser;
  }

  // Recipe operations
  async getRecipes(userId?: string): Promise<Recipe[]> {
    const currentEnv = getEnvironment();
    const query = userId 
      ? db.select().from(recipes).where(and(eq(recipes.userId, userId), eq(recipes.environment, currentEnv)))
      : db.select().from(recipes).where(and(isNull(recipes.userId), eq(recipes.environment, currentEnv))); // Only return static recipes (null user_id) for home page
    
    const allRecipes = await query;
    
    // Sort recipes by latest cooking activity, then by creation date
    return allRecipes.sort((a, b) => {
      const aLatestLog = (a.cookingLog && a.cookingLog.length > 0)
        ? new Date(a.cookingLog[0].timestamp).getTime()  // Index 0 is newest (entries added at beginning)
        : new Date(a.createdAt!).getTime();

      const bLatestLog = (b.cookingLog && b.cookingLog.length > 0)
        ? new Date(b.cookingLog[0].timestamp).getTime()  // Index 0 is newest (entries added at beginning)
        : new Date(b.createdAt!).getTime();

      return bLatestLog - aLatestLog;
    });
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const currentEnv = getEnvironment();
    const [recipe] = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.environment, currentEnv)));
    return recipe || undefined;
  }

  async createRecipe(insertRecipe: InsertRecipe, userId: string): Promise<Recipe> {
    const currentEnv = getEnvironment();
    const [recipe] = await db
      .insert(recipes)
      .values({
        ...insertRecipe,
        userId,
        rating: 0,
        cookingLog: [],
        environment: currentEnv,
      })
      .returning();

    // Add small delay for serverless database propagation (Neon eventual consistency)
    await new Promise(resolve => setTimeout(resolve, 25));

    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>, userId: string): Promise<Recipe | undefined> {
    const currentEnv = getEnvironment();
    const [updatedRecipe] = await db
      .update(recipes)
      .set(updates as any)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId), eq(recipes.environment, currentEnv)))
      .returning();
    return updatedRecipe || undefined;
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const currentEnv = getEnvironment();
    const result = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId), eq(recipes.environment, currentEnv)));
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

    const currentEnv = getEnvironment();
    const [updatedRecipe] = await db
      .update(recipes)
      .set({
        cookingLog: updatedLog,
        rating: averageRating
      })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId), eq(recipes.environment, currentEnv)))
      .returning();

    // Add small delay for serverless database propagation (Neon eventual consistency)
    await new Promise(resolve => setTimeout(resolve, 25));

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

    const currentEnv = getEnvironment();
    const [updatedRecipe] = await db
      .update(recipes)
      .set({
        cookingLog: currentLog,
        rating: averageRating
      })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId), eq(recipes.environment, currentEnv)))
      .returning();

    // Add small delay for serverless database propagation (Neon eventual consistency)
    await new Promise(resolve => setTimeout(resolve, 25));

    return updatedRecipe || undefined;
  }
}

export const storage = new DatabaseStorage();