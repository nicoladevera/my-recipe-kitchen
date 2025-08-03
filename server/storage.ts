import { type Recipe, type InsertRecipe, type CookingLogEntry, recipes } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
  addCookingLog(id: string, logEntry: CookingLogEntry): Promise<Recipe | undefined>;
  removeCookingLog(id: string, logIndex: number): Promise<Recipe | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getRecipes(): Promise<Recipe[]> {
    const allRecipes = await db.select().from(recipes);
    
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

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values({
        ...insertRecipe,
        rating: 0,
        cookingLog: [],
      })
      .returning();
    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(updates as any)
      .where(eq(recipes.id, id))
      .returning();
    return updatedRecipe || undefined;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addCookingLog(id: string, logEntry: CookingLogEntry): Promise<Recipe | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe) return undefined;

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
      .where(eq(recipes.id, id))
      .returning();
    
    return updatedRecipe || undefined;
  }

  async removeCookingLog(id: string, logIndex: number): Promise<Recipe | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe || !recipe.cookingLog) return undefined;

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
      .where(eq(recipes.id, id))
      .returning();
    
    return updatedRecipe || undefined;
  }
}

export const storage = new DatabaseStorage();