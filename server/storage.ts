import { type Recipe, type InsertRecipe, type CookingLogEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
  addCookingLog(id: string, logEntry: CookingLogEntry): Promise<Recipe | undefined>;
}

export class MemStorage implements IStorage {
  private recipes: Map<string, Recipe>;

  constructor() {
    this.recipes = new Map();
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleRecipes: Recipe[] = [
      {
        id: randomUUID(),
        name: "Mediterranean Pasta Salad",
        heroIngredient: "Pasta",
        cookTime: 25,
        servings: 4,
        ingredients: "8 oz penne pasta\n1 cup cherry tomatoes\n1/2 cup olives\n1/2 red onion\n1/2 cup feta cheese\n1/4 cup olive oil\n2 tbsp lemon juice\nFresh basil leaves",
        instructions: "Cook pasta according to package directions. Drain and rinse with cold water. Combine all vegetables and cheese in a large bowl. Whisk olive oil and lemon juice together. Toss pasta with dressing and vegetables. Garnish with fresh basil.",
        rating: 5,
        photo: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        cookingLog: [
          { date: "2024-01-15", notes: "Perfect for summer dinner!" },
          { date: "2024-01-08", notes: "Added extra olives" }
        ],
        createdAt: new Date("2024-01-01"),
      },
      {
        id: randomUUID(),
        name: "Garlic Herb Roasted Chicken",
        heroIngredient: "Chicken",
        cookTime: 75,
        servings: 6,
        ingredients: "1 whole chicken (3-4 lbs)\n4 cloves garlic, minced\n2 tbsp fresh rosemary\n2 tbsp fresh thyme\n3 tbsp olive oil\n1 lemon\nSalt and pepper",
        instructions: "Preheat oven to 425°F. Mix herbs, garlic, and olive oil. Rub mixture under and over chicken skin. Stuff lemon quarters inside cavity. Roast for 60-75 minutes until internal temp reaches 165°F. Let rest 10 minutes before carving.",
        rating: 4,
        photo: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        cookingLog: [
          { date: "2024-01-12", notes: "Juicy and flavorful!" }
        ],
        createdAt: new Date("2024-01-02"),
      },
      {
        id: randomUUID(),
        name: "Chocolate Chip Cookies",
        heroIngredient: "Chocolate",
        cookTime: 12,
        servings: 24,
        ingredients: "2 1/4 cups flour\n1 tsp baking soda\n1 tsp salt\n1 cup butter, softened\n3/4 cup brown sugar\n3/4 cup white sugar\n2 eggs\n2 tsp vanilla\n2 cups chocolate chips",
        instructions: "Preheat oven to 375°F. Mix flour, baking soda, and salt. Cream butter and sugars. Beat in eggs and vanilla. Gradually add flour mixture. Stir in chocolate chips. Drop rounded tablespoons onto baking sheets. Bake 9-11 minutes.",
        rating: 5,
        photo: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        cookingLog: [],
        createdAt: new Date("2024-01-03"),
      }
    ];

    sampleRecipes.forEach(recipe => {
      this.recipes.set(recipe.id, recipe);
    });
  }

  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = {
      ...insertRecipe,
      id,
      rating: insertRecipe.rating || 0,
      photo: insertRecipe.photo || null,
      cookingLog: [],
      createdAt: new Date(),
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existing = this.recipes.get(id);
    if (!existing) return undefined;

    const updated: Recipe = { 
      ...existing, 
      ...updates,
      cookingLog: existing.cookingLog || [],
    };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.recipes.delete(id);
  }

  async addCookingLog(id: string, logEntry: CookingLogEntry): Promise<Recipe | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;

    const currentLog = recipe.cookingLog || [];
    const updatedLog = [logEntry, ...currentLog];
    const updated: Recipe = { ...recipe, cookingLog: updatedLog };
    this.recipes.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
