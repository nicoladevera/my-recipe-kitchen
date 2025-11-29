import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';
import { hashPassword } from '../auth';

// Helper to create unique username for each test
function uniqueUsername(base: string): string {
  return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

describe('User Storage Operations (HIGH)', () => {
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const username = uniqueUsername('testuser');
      const hashedPassword = await hashPassword('testpassword');
      const user = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword,
        displayName: 'Test User'
      });

      expect(user.id).toBeDefined();
      expect(user.username).toBe(username);
      expect(user.email).toBe(`${username}@example.com`);
      expect(user.displayName).toBe('Test User');
      expect(user.password).toBe(hashedPassword);
      expect(user.environment).toBe('test');
    });

    it('should set timestamps on creation', async () => {
      const username = uniqueUsername('timestampuser');
      const hashedPassword = await hashPassword('password123');
      const user = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('getUser', () => {
    it('should retrieve user by ID', async () => {
      const username = uniqueUsername('getuser');
      const hashedPassword = await hashPassword('password123');
      const created = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const user = await storage.getUser(created.id);

      expect(user).toBeDefined();
      expect(user!.id).toBe(created.id);
      expect(user!.username).toBe(username);
    });

    it('should return undefined for non-existent user', async () => {
      const user = await storage.getUser('00000000-0000-0000-0000-000000000000');
      expect(user).toBeUndefined();
    });

    it('should filter by environment', async () => {
      const username = uniqueUsername('envuser');
      const hashedPassword = await hashPassword('password123');
      const created = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      // In test environment, should find it
      const user = await storage.getUser(created.id);
      expect(user).toBeDefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should retrieve user by username', async () => {
      const username = uniqueUsername('findme');
      const hashedPassword = await hashPassword('password123');
      await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const user = await storage.getUserByUsername(username);

      expect(user).toBeDefined();
      expect(user!.username).toBe(username);
      expect(user!.email).toBe(`${username}@example.com`);
    });

    it('should return undefined for non-existent username', async () => {
      const user = await storage.getUserByUsername('nonexistent');
      expect(user).toBeUndefined();
    });

    it('should be case sensitive', async () => {
      const username = uniqueUsername('CaseSensitive');
      const hashedPassword = await hashPassword('password123');
      await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const exact = await storage.getUserByUsername(username);
      const wrong = await storage.getUserByUsername(username.toLowerCase());

      expect(exact).toBeDefined();
      expect(wrong).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email', async () => {
      const username = uniqueUsername('emailuser');
      const email = `unique_${Date.now()}@example.com`;
      const hashedPassword = await hashPassword('password123');
      await storage.createUser({
        username: username,
        email: email,
        password: hashedPassword
      });

      const user = await storage.getUserByEmail(email);

      expect(user).toBeDefined();
      expect(user!.email).toBe(email);
      expect(user!.username).toBe(username);
    });

    it('should return undefined for non-existent email', async () => {
      const user = await storage.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const username = uniqueUsername('updateuser');
      const email = `${username}@example.com`;
      const hashedPassword = await hashPassword('password123');
      const created = await storage.createUser({
        username: username,
        email: email,
        password: hashedPassword
      });

      const newUsername = uniqueUsername('newusername');
      const updated = await storage.updateUser(created.id, {
        username: newUsername,
        displayName: 'New Display Name'
      });

      expect(updated).toBeDefined();
      expect(updated!.username).toBe(newUsername);
      expect(updated!.displayName).toBe('New Display Name');
      expect(updated!.email).toBe(email); // Unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const username = uniqueUsername('timestampupdate');
      const hashedPassword = await hashPassword('password123');
      const created = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await storage.updateUser(created.id, {
        displayName: 'Updated'
      });

      expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return undefined for non-existent user', async () => {
      const updated = await storage.updateUser('00000000-0000-0000-0000-000000000000', {
        displayName: 'Test'
      });

      expect(updated).toBeUndefined();
    });
  });

  describe('updateUserPassword', () => {
    it('should update password with correct current password', async () => {
      const username = uniqueUsername('passupdate');
      const currentPassword = 'oldpassword123';
      const hashedPassword = await hashPassword(currentPassword);
      const user = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const success = await storage.updateUserPassword(
        user.id,
        currentPassword,
        'newpassword456'
      );

      expect(success).toBe(true);

      // Verify old password no longer works
      const updatedUser = await storage.getUser(user.id);
      expect(updatedUser!.password).not.toBe(hashedPassword);
    });

    it('should reject incorrect current password', async () => {
      const username = uniqueUsername('wrongpass');
      const hashedPassword = await hashPassword('correctpassword');
      const user = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const success = await storage.updateUserPassword(
        user.id,
        'wrongpassword',
        'newpassword123'
      );

      expect(success).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const success = await storage.updateUserPassword(
        '00000000-0000-0000-0000-000000000000',
        'old',
        'new'
      );

      expect(success).toBe(false);
    });
  });
});

describe('Recipe Storage Operations (HIGH)', () => {
  let userId: string;

  beforeEach(async () => {
    const username = uniqueUsername('recipeowner');
    const hashedPassword = await hashPassword('password123');
    const user = await storage.createUser({
      username: username,
      email: `${username}@example.com`,
      password: hashedPassword
    });
    userId = user.id;

    // Brief delay to allow user to propagate for foreign key constraints
    await new Promise(resolve => setTimeout(resolve, 75));
  });

  describe('createRecipe', () => {
    it('should create recipe with user association', async () => {
      const recipe = await storage.createRecipe({
        name: 'Test Recipe',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken, Salt',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBe('Test Recipe');
      expect(recipe.userId).toBe(userId);
      expect(recipe.rating).toBe(0);
      expect(recipe.cookingLog).toEqual([]);
      expect(recipe.environment).toBe('test');
    });

    it('should initialize with empty cooking log', async () => {
      const recipe = await storage.createRecipe({
        name: 'Empty Log Recipe',
        heroIngredient: 'Beef',
        cookTime: 45,
        servings: 6,
        ingredients: 'Beef',
        instructions: 'Grill it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      expect(recipe.cookingLog).toEqual([]);
    });

    it('should initialize with rating 0', async () => {
      const recipe = await storage.createRecipe({
        name: 'Zero Rating Recipe',
        heroIngredient: 'Fish',
        cookTime: 20,
        servings: 2,
        ingredients: 'Fish',
        instructions: 'Fry it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      expect(recipe.rating).toBe(0);
    });
  });

  describe('getRecipe', () => {
    it('should retrieve recipe by ID', async () => {
      const created = await storage.createRecipe({
        name: 'Get Recipe',
        heroIngredient: 'Pasta',
        cookTime: 15,
        servings: 2,
        ingredients: 'Pasta',
        instructions: 'Boil it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const recipe = await storage.getRecipe(created.id);

      expect(recipe).toBeDefined();
      expect(recipe!.id).toBe(created.id);
      expect(recipe!.name).toBe('Get Recipe');
    });

    it('should return undefined for non-existent recipe', async () => {
      const recipe = await storage.getRecipe('00000000-0000-0000-0000-000000000000');
      expect(recipe).toBeUndefined();
    });
  });

  describe('getRecipes', () => {
    it('should return user recipes when userId provided', async () => {
      await storage.createRecipe({
        name: 'User Recipe 1',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.createRecipe({
        name: 'User Recipe 2',
        heroIngredient: 'Beef',
        cookTime: 45,
        servings: 6,
        ingredients: 'Beef',
        instructions: 'Grill it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const recipes = await storage.getRecipes(userId);

      expect(recipes).toHaveLength(2);
      expect(recipes.every(r => r.userId === userId)).toBe(true);
    });

    it('should sort by cooking log activity', async () => {
      const recipe1 = await storage.createRecipe({
        name: 'Old Recipe',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const recipe2 = await storage.createRecipe({
        name: 'New Recipe',
        heroIngredient: 'Beef',
        cookTime: 45,
        servings: 6,
        ingredients: 'Beef',
        instructions: 'Grill it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      // Add cooking log to recipe1 to make it more recent
      await storage.addCookingLog(recipe1.id, {
        timestamp: new Date().toISOString(),
        notes: 'Recent cook',
        rating: 5
      }, userId);

      const recipes = await storage.getRecipes(userId);

      // Recipe with cooking log should come first
      expect(recipes[0].name).toBe('Old Recipe');
    });

    it('should return empty array when user has no recipes', async () => {
      const username = uniqueUsername('norecipes');
      const hashedPassword = await hashPassword('password123');
      const newUser = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const recipes = await storage.getRecipes(newUser.id);

      expect(recipes).toEqual([]);
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe fields', async () => {
      const created = await storage.createRecipe({
        name: 'Original Name',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const updated = await storage.updateRecipe(created.id, {
        name: 'Updated Name',
        cookTime: 45
      }, userId);

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.cookTime).toBe(45);
      expect(updated!.servings).toBe(4); // Unchanged
    });

    it('should verify ownership', async () => {
      const username = uniqueUsername('otheruser');
      const hashedPassword = await hashPassword('password123');
      const otherUser = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const recipe = await storage.createRecipe({
        name: 'Owner Recipe',
        heroIngredient: 'Fish',
        cookTime: 20,
        servings: 2,
        ingredients: 'Fish',
        instructions: 'Fry it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const updated = await storage.updateRecipe(recipe.id, {
        name: 'Hacked'
      }, otherUser.id);

      expect(updated).toBeUndefined();
    });

    it('should return undefined for non-existent recipe', async () => {
      const updated = await storage.updateRecipe(
        '00000000-0000-0000-0000-000000000000',
        { name: 'Test' },
        userId
      );

      expect(updated).toBeUndefined();
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe when owner', async () => {
      const recipe = await storage.createRecipe({
        name: 'Delete Me',
        heroIngredient: 'Vegetable',
        cookTime: 25,
        servings: 3,
        ingredients: 'Vegetables',
        instructions: 'Cook them',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const deleted = await storage.deleteRecipe(recipe.id, userId);

      expect(deleted).toBe(true);

      const retrieved = await storage.getRecipe(recipe.id);
      expect(retrieved).toBeUndefined();
    });

    it('should verify ownership', async () => {
      const username = uniqueUsername('deleteother');
      const hashedPassword = await hashPassword('password123');
      const otherUser = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const recipe = await storage.createRecipe({
        name: 'Protected Recipe',
        heroIngredient: 'Dessert',
        cookTime: 30,
        servings: 6,
        ingredients: 'Sugar',
        instructions: 'Bake it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const deleted = await storage.deleteRecipe(recipe.id, otherUser.id);

      expect(deleted).toBe(false);

      // Recipe should still exist
      const retrieved = await storage.getRecipe(recipe.id);
      expect(retrieved).toBeDefined();
    });

    it('should return false for non-existent recipe', async () => {
      const deleted = await storage.deleteRecipe(
        '00000000-0000-0000-0000-000000000000',
        userId
      );

      expect(deleted).toBe(false);
    });
  });

  describe('addCookingLog', () => {
    it('should add cooking log entry', async () => {
      const recipe = await storage.createRecipe({
        name: 'Log Recipe',
        heroIngredient: 'Seafood',
        cookTime: 40,
        servings: 4,
        ingredients: 'Shrimp',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const updated = await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Delicious!',
        rating: 5
      }, userId);

      expect(updated).toBeDefined();
      expect(updated!.cookingLog).toHaveLength(1);
      expect(updated!.cookingLog[0].notes).toBe('Delicious!');
      expect(updated!.cookingLog[0].rating).toBe(5);
      expect(updated!.rating).toBe(5);
    });

    it('should calculate average rating', async () => {
      const recipe = await storage.createRecipe({
        name: 'Avg Recipe',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Good',
        rating: 4
      }, userId);

      const updated = await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Great',
        rating: 5
      }, userId);

      // Average of 4 and 5 is 4.5, rounded to 5
      expect(updated!.rating).toBe(5);
    });

    it('should add to beginning of array', async () => {
      const recipe = await storage.createRecipe({
        name: 'Order Recipe',
        heroIngredient: 'Beef',
        cookTime: 45,
        servings: 6,
        ingredients: 'Beef',
        instructions: 'Grill it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'First',
        rating: 4
      }, userId);

      const updated = await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Second',
        rating: 5
      }, userId);

      // Most recent should be first
      expect(updated!.cookingLog[0].notes).toBe('Second');
      expect(updated!.cookingLog[1].notes).toBe('First');
    });

    it('should verify ownership', async () => {
      const username = uniqueUsername('logother');
      const hashedPassword = await hashPassword('password123');
      const otherUser = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const recipe = await storage.createRecipe({
        name: 'Protected Log Recipe',
        heroIngredient: 'Fish',
        cookTime: 20,
        servings: 2,
        ingredients: 'Fish',
        instructions: 'Fry it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const updated = await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Hacked',
        rating: 1
      }, otherUser.id);

      expect(updated).toBeUndefined();
    });
  });

  describe('removeCookingLog', () => {
    it('should remove cooking log entry by index', async () => {
      const recipe = await storage.createRecipe({
        name: 'Remove Log Recipe',
        heroIngredient: 'Pasta',
        cookTime: 15,
        servings: 2,
        ingredients: 'Pasta',
        instructions: 'Boil it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'First',
        rating: 4
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Second',
        rating: 5
      }, userId);

      const updated = await storage.removeCookingLog(recipe.id, 0, userId);

      expect(updated).toBeDefined();
      expect(updated!.cookingLog).toHaveLength(1);
      expect(updated!.cookingLog[0].notes).toBe('First');
    });

    it('should recalculate rating after removal', async () => {
      const recipe = await storage.createRecipe({
        name: 'Recalc Recipe',
        heroIngredient: 'Vegetable',
        cookTime: 25,
        servings: 3,
        ingredients: 'Vegetables',
        instructions: 'Cook them',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Okay',
        rating: 3
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Great',
        rating: 5
      }, userId);

      // Remove rating 5 entry (index 0)
      const updated = await storage.removeCookingLog(recipe.id, 0, userId);

      // Rating should now be 3
      expect(updated!.rating).toBe(3);
    });

    it('should set rating to 0 when all logs removed', async () => {
      const recipe = await storage.createRecipe({
        name: 'Empty Log Recipe',
        heroIngredient: 'Dessert',
        cookTime: 30,
        servings: 6,
        ingredients: 'Sugar',
        instructions: 'Bake it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Only one',
        rating: 4
      }, userId);

      const updated = await storage.removeCookingLog(recipe.id, 0, userId);

      expect(updated!.cookingLog).toHaveLength(0);
      expect(updated!.rating).toBe(0);
    });

    it('should handle invalid index', async () => {
      const recipe = await storage.createRecipe({
        name: 'Invalid Index Recipe',
        heroIngredient: 'Chicken',
        cookTime: 30,
        servings: 4,
        ingredients: 'Chicken',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      const updated = await storage.removeCookingLog(recipe.id, 0, userId);

      expect(updated).toBeUndefined();
    });

    it('should verify ownership', async () => {
      const username = uniqueUsername('removeother');
      const hashedPassword = await hashPassword('password123');
      const otherUser = await storage.createUser({
        username: username,
        email: `${username}@example.com`,
        password: hashedPassword
      });

      const recipe = await storage.createRecipe({
        name: 'Protected Remove Recipe',
        heroIngredient: 'Seafood',
        cookTime: 40,
        servings: 4,
        ingredients: 'Shrimp',
        instructions: 'Cook it',
        cookingLog: [],
        environment: 'test'
      }, userId);

      await storage.addCookingLog(recipe.id, {
        timestamp: new Date().toISOString(),
        notes: 'Test',
        rating: 4
      }, userId);

      const updated = await storage.removeCookingLog(recipe.id, 0, otherUser.id);

      expect(updated).toBeUndefined();
    });
  });
});
