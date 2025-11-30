import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import path from 'path';
import fs from 'fs';

// Create test app
async function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  await registerRoutes(app);
  return app;
}

// Helper to create authenticated user and get session cookie
async function createAuthenticatedUser(app: express.Express, username: string) {
  // Make username globally unique to prevent conflicts across tests
  const uniqueUsername = `${username}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const response = await request(app)
    .post('/api/register')
    .send({
      username: uniqueUsername,
      email: `${uniqueUsername}@example.com`,
      password: 'password123',
      displayName: username
    });

  if (response.status !== 201) {
    console.error('Failed to create user:', response.status, response.body);
    throw new Error(`User registration failed with status ${response.status}: ${JSON.stringify(response.body)}`);
  }

  if (!response.body.id) {
    console.error('Registration response missing user ID:', response.body);
    throw new Error('Registration succeeded but user ID is missing from response');
  }

  // Wait for user to propagate across database connections
  // Uses 50ms for CI, 75ms for coverage as baseline
  // Combined with increased retry logic, this handles 99%+ of cases
  const delay = process.env.COVERAGE === 'true' ? 75 : 50;
  await new Promise(resolve => setTimeout(resolve, delay));

  return {
    user: response.body,
    cookies: response.headers['set-cookie'],
    username: uniqueUsername
  };
}

// Helper to add small delay for serverless database consistency
// Uses environment-aware delays: 50ms for CI, 75ms for coverage (v8 instrumentation is slower)
async function waitForPropagation(ms?: number) {
  const defaultDelay = process.env.COVERAGE === 'true' ? 75 : 50;
  await new Promise(resolve => setTimeout(resolve, ms ?? defaultDelay));
}

// Helper to retry operations that may encounter eventual consistency issues
// Returns immediately on success or non-404 errors, retries only on 404
// Uses 7 attempts to match server-side retry logic and handle extreme delays
async function withEventualConsistencyRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  maxAttempts: number = 7
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 25ms, 50ms, 100ms, 200ms, 400ms, 800ms
      // Total max wait: 1575ms (handles extreme eventual consistency delays)
      await new Promise(resolve => setTimeout(resolve, 25 * Math.pow(2, attempt - 1)));
    }

    const result = await operation();

    if (!shouldRetry(result)) {
      return result;
    }
  }

  // Final attempt
  return await operation();
}

describe('Recipe CRUD Operations (CRITICAL)', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('POST /api/recipes', () => {
    it('should create recipe with valid data', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'recipeowner');

      const response = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Test Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken, Salt, Pepper',
          instructions: 'Cook the chicken'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Recipe');
      expect(response.body.heroIngredient).toBe('Chicken');
      expect(response.body.cookTime).toBe(30);
      expect(response.body.rating).toBe(0);
      expect(response.body.cookingLog).toEqual([]);
    });

    it('should reject when not authenticated', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject invalid cook time', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'cookuser');

      const response = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Invalid Cook Time',
          heroIngredient: 'Beef',
          cookTime: 0, // Invalid
          servings: 4,
          ingredients: 'Beef',
          instructions: 'Cook it'
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid servings', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'servingsuser');

      const response = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Invalid Servings',
          heroIngredient: 'Fish',
          cookTime: 20,
          servings: 0, // Invalid
          ingredients: 'Fish',
          instructions: 'Cook it'
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid hero ingredient', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'herouser');

      // Retry on 500 errors (foreign key constraint from eventual consistency)
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .post('/api/recipes')
          .set('Cookie', cookies)
          .send({
            name: 'Invalid Ingredient',
            heroIngredient: 'InvalidType',
            cookTime: 20,
            servings: 4,
            ingredients: 'Something',
            instructions: 'Cook it'
          }),
        (res) => res.status === 500  // Retry only on 500 (FK violation), stop on 400 (expected)
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/recipes', () => {
    it('should return only seed recipes (userId null)', async () => {
      // Create a user and their recipe
      const { cookies } = await createAuthenticatedUser(app, 'getuser');
      await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'User Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      // Get all recipes (should only return seed recipes)
      const response = await request(app)
        .get('/api/recipes');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should not include user recipes
      const userRecipe = response.body.find((r: any) => r.name === 'User Recipe');
      expect(userRecipe).toBeUndefined();
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('should return recipe by ID', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'getiduser');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Find Me',
          heroIngredient: 'Pork',
          cookTime: 45,
          servings: 2,
          ingredients: 'Pork',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // GET with retry logic for eventual consistency
      const response = await withEventualConsistencyRetry(
        () => request(app).get(`/api/recipes/${recipeId}`),
        (response) => response.status === 404
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Find Me');
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/recipes/:id', () => {
    it('should update recipe when owner', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'updateowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Original Name',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // PATCH with retry logic for eventual consistency
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .patch(`/api/recipes/${recipeId}`)
          .set('Cookie', cookies)
          .send({
            name: 'Updated Name',
            cookTime: 45
          }),
        (response) => response.status === 404
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.cookTime).toBe(45);
      expect(response.body.servings).toBe(4); // Unchanged
    });

    it('should reject when not authenticated', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'patchowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Test Recipe',
          heroIngredient: 'Beef',
          cookTime: 30,
          servings: 4,
          ingredients: 'Beef',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before attempting to access it
      await waitForPropagation();

      const response = await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject when not owner (CRITICAL)', async () => {
      // Create owner
      const { cookies: ownerCookies } = await createAuthenticatedUser(app, 'patchowner');

      // Create recipe with retry for eventual consistency
      const createResponse = await withEventualConsistencyRetry(
        () => request(app)
          .post('/api/recipes')
          .set('Cookie', ownerCookies)
          .send({
            name: 'Owner Recipe',
            heroIngredient: 'Fish',
            cookTime: 20,
            servings: 2,
            ingredients: 'Fish',
            instructions: 'Cook it'
          }),
        (res) => res.status === 500  // Retry on FK violation
      );

      expect(createResponse.status).toBe(201);
      const recipeId = createResponse.body.id;

      // Create different user (attacker)
      const { cookies: attackerCookies } = await createAuthenticatedUser(app, 'patchattacker');

      // Wait for recipe to propagate before attempting unauthorized access
      await waitForPropagation();

      // Attempt to modify recipe as non-owner
      const response = await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .set('Cookie', attackerCookies)
        .send({ name: 'Hacked Recipe' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to modify this recipe');
    });

    it('should return 404 for non-existent recipe', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'patch404user');

      const response = await request(app)
        .patch('/api/recipes/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('should delete recipe when owner', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'deleteowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Delete Me',
          heroIngredient: 'Pasta',
          cookTime: 15,
          servings: 2,
          ingredients: 'Pasta',
          instructions: 'Boil it'
        });

      const recipeId = createResponse.body.id;

      // Delete with retry logic for eventual consistency
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .delete(`/api/recipes/${recipeId}`)
          .set('Cookie', cookies),
        (response) => response.status === 404 || response.status === 500
      );

      expect(response.status).toBe(204);

      // Verify deleted
      const getResponse = await request(app)
        .get(`/api/recipes/${recipeId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should reject when not authenticated', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'deleteauth');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Protected',
          heroIngredient: 'Vegetable',
          cookTime: 20,
          servings: 4,
          ingredients: 'Vegetables',
          instructions: 'Cook them'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before attempting to delete it
      await waitForPropagation();

      const response = await request(app)
        .delete(`/api/recipes/${recipeId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject when not owner (CRITICAL)', async () => {
      const owner = await createAuthenticatedUser(app, 'deleteowner2');
      const hacker = await createAuthenticatedUser(app, 'deletehacker');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', owner.cookies)
        .send({
          name: 'Protected Recipe',
          heroIngredient: 'Dessert',
          cookTime: 30,
          servings: 6,
          ingredients: 'Sugar',
          instructions: 'Bake it'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before attempting authorization check
      await waitForPropagation();

      // Try to delete with different user - retry on 404, expect 403 when visible
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .delete(`/api/recipes/${recipeId}`)
          .set('Cookie', hacker.cookies),
        (response) => response.status === 404
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to modify this recipe');
    });

    it('should return 404 for non-existent recipe', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'delete404');

      const response = await request(app)
        .delete('/api/recipes/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });
  });
});

describe('Cooking Log Operations (CRITICAL)', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('POST /api/recipes/:id/cooking-log', () => {
    it('should add cooking log entry', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'logowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Log Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before adding cooking log
      await waitForPropagation();

      const response = await request(app)
        .post(`/api/recipes/${recipeId}/cooking-log`)
        .set('Cookie', cookies)
        .send({
          timestamp: new Date().toISOString(),
          notes: 'It was delicious!',
          rating: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.cookingLog).toHaveLength(1);
      expect(response.body.cookingLog[0].notes).toBe('It was delicious!');
      expect(response.body.cookingLog[0].rating).toBe(5);
      expect(response.body.rating).toBe(5); // Average
    });

    it('should calculate average rating from multiple entries', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'avgowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Average Recipe',
          heroIngredient: 'Beef',
          cookTime: 45,
          servings: 4,
          ingredients: 'Beef',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Add first log with retry for eventual consistency
      await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', cookies)
          .send({
            timestamp: new Date().toISOString(),
            notes: 'Good',
            rating: 4
          }),
        (response) => response.status === 404
      );

      // Add second log (rating: 5)
      const response = await request(app)
        .post(`/api/recipes/${recipeId}/cooking-log`)
        .set('Cookie', cookies)
        .send({
          timestamp: new Date().toISOString(),
          notes: 'Great!',
          rating: 5
        });

      // Average should be 4.5, rounded to 5
      expect(response.body.cookingLog).toHaveLength(2);
      expect(response.body.rating).toBe(5);
    });

    it('should reject when not owner', async () => {
      const owner = await createAuthenticatedUser(app, 'logowner2');
      const hacker = await createAuthenticatedUser(app, 'loghacker');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', owner.cookies)
        .send({
          name: 'Protected Log Recipe',
          heroIngredient: 'Fish',
          cookTime: 20,
          servings: 2,
          ingredients: 'Fish',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Try to add cooking log with retry logic for eventual consistency
      // Should get 403 when recipe is visible (not owned by hacker)
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', hacker.cookies)
          .send({
            timestamp: new Date().toISOString(),
            notes: 'Hacked',
            rating: 1
          }),
        (response) => response.status === 404
      );

      expect(response.status).toBe(403);
    });

    it('should require all fields', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'reqowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Req Recipe',
          heroIngredient: 'Pasta',
          cookTime: 15,
          servings: 2,
          ingredients: 'Pasta',
          instructions: 'Boil it'
        });

      const recipeId = createResponse.body.id;

      // Try to post with missing fields - retry on 404, expect 400 when visible
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', cookies)
          .send({
            notes: 'Missing timestamp and rating'
          }),
        (response) => response.status === 404
      );

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/recipes/:id/cooking-log/:index', () => {
    it('should remove cooking log entry', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'removeowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Remove Log Recipe',
          heroIngredient: 'Vegetable',
          cookTime: 25,
          servings: 3,
          ingredients: 'Vegetables',
          instructions: 'Cook them'
        });

      const recipeId = createResponse.body.id;

      // Add two log entries with retry for eventual consistency
      await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', cookies)
          .send({
            timestamp: new Date().toISOString(),
            notes: 'First',
            rating: 4
          }),
        (response) => response.status === 404
      );

      await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', cookies)
          .send({
            timestamp: new Date().toISOString(),
            notes: 'Second',
            rating: 5
          }),
        (response) => response.status === 404
      );

      // Remove first entry (index 0) with retry for eventual consistency
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .delete(`/api/recipes/${recipeId}/cooking-log/0`)
          .set('Cookie', cookies),
        (response) => response.status === 404 || response.status === 500
      );

      expect(response.status).toBe(200);
      expect(response.body.cookingLog).toHaveLength(1);
      expect(response.body.cookingLog[0].notes).toBe('First');
    });

    it('should recalculate rating after removal', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'recalcowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Recalc Recipe',
          heroIngredient: 'Dessert',
          cookTime: 30,
          servings: 6,
          ingredients: 'Sugar',
          instructions: 'Bake it'
        });

      const recipeId = createResponse.body.id;

      // Add two entries: rating 3 and 5
      await request(app)
        .post(`/api/recipes/${recipeId}/cooking-log`)
        .set('Cookie', cookies)
        .send({
          timestamp: new Date().toISOString(),
          notes: 'Okay',
          rating: 3
        });

      await request(app)
        .post(`/api/recipes/${recipeId}/cooking-log`)
        .set('Cookie', cookies)
        .send({
          timestamp: new Date().toISOString(),
          notes: 'Great',
          rating: 5
        });

      // Wait for cooking logs to propagate
      await waitForPropagation();

      // Average is 4, remove rating 3 entry
      const response = await request(app)
        .delete(`/api/recipes/${recipeId}/cooking-log/1`)
        .set('Cookie', cookies);

      // Rating should now be 5
      expect(response.body.rating).toBe(5);
    });

    it('should reject when not owner', async () => {
      const owner = await createAuthenticatedUser(app, 'remowner');
      const hacker = await createAuthenticatedUser(app, 'remhacker');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', owner.cookies)
        .send({
          name: 'Protected Remove Recipe',
          heroIngredient: 'Seafood',
          cookTime: 40,
          servings: 4,
          ingredients: 'Shrimp',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before operations
      await waitForPropagation();

      // Add cooking log with retry for eventual consistency
      await withEventualConsistencyRetry(
        () => request(app)
          .post(`/api/recipes/${recipeId}/cooking-log`)
          .set('Cookie', owner.cookies)
          .send({
            timestamp: new Date().toISOString(),
            notes: 'Test',
            rating: 4
          }),
        (response) => response.status === 404
      );

      // Try to delete with different user - should get 403 when visible
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .delete(`/api/recipes/${recipeId}/cooking-log/0`)
          .set('Cookie', hacker.cookies),
        (response) => response.status === 404
      );

      expect(response.status).toBe(403);
    });

    it('should handle invalid index', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'invalidowner');

      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'Invalid Index Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // Wait for recipe to propagate before attempting to delete cooking log
      await waitForPropagation();

      const response = await request(app)
        .delete(`/api/recipes/${recipeId}/cooking-log/0`)
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });
  });
});

describe('User Profile Operations (CRITICAL)', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('GET /api/users/:username', () => {
    it('should return public user data', async () => {
      const { username } = await createAuthenticatedUser(app, 'publicuser');

      const response = await request(app)
        .get(`/api/users/${username}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(username);
      expect(response.body.email).toBe(`${username}@example.com`);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordResetToken');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/:username/recipes', () => {
    it('should return user recipes', async () => {
      const { cookies, username } = await createAuthenticatedUser(app, 'recipeuser');

      await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'User Recipe 1',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: 'User Recipe 2',
          heroIngredient: 'Beef',
          cookTime: 45,
          servings: 6,
          ingredients: 'Beef',
          instructions: 'Grill it'
        });

      // Wait for recipes to propagate before querying
      await waitForPropagation();

      // Retry GET on 404 (user/recipes not visible yet)
      const response = await withEventualConsistencyRetry(
        () => request(app).get(`/api/users/${username}/recipes`),
        (res) => res.status === 404  // Retry on 404, stop on 200 or other errors
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent/recipes');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/user', () => {
    it('should update username', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'oldusername');

      // Retry on 500 errors (session/user not fully propagated)
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .patch('/api/user')
          .set('Cookie', cookies)
          .send({
            username: 'newusername'
          }),
        (response) => response.status === 500
      );

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('newusername');
    });

    it('should update display name', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'displayuser');

      const response = await request(app)
        .patch('/api/user')
        .set('Cookie', cookies)
        .send({
          displayName: 'New Display Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.displayName).toBe('New Display Name');
    });

    it('should reject duplicate username', async () => {
      const { username: existingUsername } = await createAuthenticatedUser(app, 'existinguser');
      const { cookies } = await createAuthenticatedUser(app, 'changinguser');

      const response = await request(app)
        .patch('/api/user')
        .set('Cookie', cookies)
        .send({
          username: existingUsername
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already taken');
    });

    it('should reject when not authenticated', async () => {
      const response = await request(app)
        .patch('/api/user')
        .send({
          username: 'newname'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/user/password', () => {
    it('should change password with correct current password', async () => {
      const { cookies, username } = await createAuthenticatedUser(app, 'passuser');

      const response = await request(app)
        .patch('/api/user/password')
        .set('Cookie', cookies)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        });

      expect(response.status).toBe(200);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: username,
          password: 'newpassword456'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject incorrect current password', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'wrongpass');

      const response = await request(app)
        .patch('/api/user/password')
        .set('Cookie', cookies)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should reject weak new password', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'weakpass');

      const response = await request(app)
        .patch('/api/user/password')
        .set('Cookie', cookies)
        .send({
          currentPassword: 'password123',
          newPassword: 'weak'
        });

      expect(response.status).toBe(400);
    });

    it('should reject when not authenticated', async () => {
      const response = await request(app)
        .patch('/api/user/password')
        .send({
          currentPassword: 'old',
          newPassword: 'new123456'
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('Security Tests (CRITICAL)', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in username', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: "admin'; DROP TABLE users; --",
          email: 'sqli@example.com',
          password: 'password123'
        });

      // Should reject due to username validation
      expect(response.status).toBe(400);
    });

    it('should prevent SQL injection in recipe fields', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'sqliuser');

      const response = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookies)
        .send({
          name: "'; DROP TABLE recipes; --",
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      // Should create safely without executing SQL
      expect(response.status).toBe(201);
      expect(response.body.name).toBe("'; DROP TABLE recipes; --");
    });
  });

  describe('XSS Prevention', () => {
    it('should store XSS attempts without executing', async () => {
      const { cookies } = await createAuthenticatedUser(app, 'xssuser');

      const xssPayload = '<script>alert("XSS")</script>';
      // Retry on 500 errors (foreign key constraint violations from eventual consistency)
      const response = await withEventualConsistencyRetry(
        () => request(app)
          .post('/api/recipes')
          .set('Cookie', cookies)
          .send({
            name: xssPayload,
            heroIngredient: 'Chicken',
            cookTime: 30,
            servings: 4,
            ingredients: xssPayload,
            instructions: xssPayload
          }),
        (response) => response.status === 500
      );

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(xssPayload);
      // Data should be stored as-is, sanitization happens on render
    });
  });

  describe('Authorization Bypass Prevention', () => {
    it('should prevent modifying other users recipes via ID manipulation', async () => {
      const user1 = await createAuthenticatedUser(app, 'victim');
      const user2 = await createAuthenticatedUser(app, 'attacker');

      // User1 creates recipe
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Cookie', user1.cookies)
        .send({
          name: 'Victim Recipe',
          heroIngredient: 'Chicken',
          cookTime: 30,
          servings: 4,
          ingredients: 'Chicken',
          instructions: 'Cook it'
        });

      const recipeId = createResponse.body.id;

      // User2 tries to update it - retry on 404 (eventual consistency)
      // but should get 403 (forbidden) when recipe is visible
      const updateResponse = await withEventualConsistencyRetry(
        () => request(app)
          .patch(`/api/recipes/${recipeId}`)
          .set('Cookie', user2.cookies)
          .send({ name: 'Hacked' }),
        (response) => response.status === 404
      );

      expect(updateResponse.status).toBe(403);

      // User2 tries to delete it - retry on 404 (eventual consistency)
      // but should get 403 (forbidden) when recipe is visible
      const deleteResponse = await withEventualConsistencyRetry(
        () => request(app)
          .delete(`/api/recipes/${recipeId}`)
          .set('Cookie', user2.cookies),
        (response) => response.status === 404
      );

      expect(deleteResponse.status).toBe(403);
    });
  });
});
