import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupAuth, hashPassword, comparePasswords } from '../auth';
import { storage } from '../storage';
import session from 'express-session';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  setupAuth(app);
  return app;
}

// Helper to create unique username for each test
function uniqueUsername(base: string): string {
  return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

describe('Password Security', () => {
  it('should hash passwords with salt', async () => {
    const password = 'mypassword123';
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toContain('.');  // Salt separator
    expect(hashed.split('.').length).toBe(2);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'samepassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2); // Different salts
  });

  it('should verify correct password', async () => {
    const password = 'correctpassword';
    const hashed = await hashPassword(password);

    const isValid = await comparePasswords(password, hashed);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'correctpassword';
    const hashed = await hashPassword(password);

    const isValid = await comparePasswords('wrongpassword', hashed);
    expect(isValid).toBe(false);
  });

  it('should use timing-safe comparison', async () => {
    const password = 'testpassword';
    const hashed = await hashPassword(password);

    // Time multiple comparisons - should be consistent
    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await comparePasswords('wrongpassword', hashed);
      times.push(performance.now() - start);
    }

    // Timing should be relatively consistent (< 50% variance)
    const avg = times.reduce((a, b) => a + b) / times.length;
    const variance = times.every(t => Math.abs(t - avg) / avg < 0.5);
    expect(variance).toBe(true);
  });
});

describe('POST /api/register', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should register new user with valid data', async () => {
    const username = uniqueUsername('newuser');
    const response = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'password123',
        displayName: 'New User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(username);
    expect(response.body.email).toBe(`${username}@example.com`);
    expect(response.body.displayName).toBe('New User');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should create session cookie on registration', async () => {
    const username = uniqueUsername('sessionuser');
    const response = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should reject duplicate username (CRITICAL - NEW CONSTRAINT)', async () => {
    const username = uniqueUsername('duplicateuser');
    // Register first user
    await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}1@example.com`,
        password: 'password123'
      });

    // Try to register with same username
    const response = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}2@example.com`,
        password: 'password456'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username already taken');
  });

  it('should reject duplicate email (CRITICAL - NEW CONSTRAINT)', async () => {
    const email = `duplicate_${Date.now()}@example.com`;
    // Register first user
    await request(app)
      .post('/api/register')
      .send({
        username: uniqueUsername('user1'),
        email: email,
        password: 'password123'
      });

    // Try to register with same email
    const response = await request(app)
      .post('/api/register')
      .send({
        username: uniqueUsername('user2'),
        email: email,
        password: 'password456'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email already registered');
  });

  it('should reject password shorter than 8 characters', async () => {
    const username = uniqueUsername('weakpass');
    const response = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'short'
      });

    expect(response.status).toBe(400);
  });

  it('should reject invalid username format', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: 'invalid user!',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('should reject invalid email format', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: 'validuser',
        email: 'notanemail',
        password: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('should reject username less than 3 characters', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('should hash password before storing', async () => {
    const username = uniqueUsername('hasheduser');
    const password = 'plaintextpassword';
    await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password
      });

    const user = await storage.getUserByUsername(username);
    expect(user).toBeDefined();
    expect(user!.password).not.toBe(password);
    expect(user!.password).toContain('.'); // Has salt
  });
});

describe('POST /api/login', () => {
  let app: express.Express;
  let testUsername: string;

  beforeEach(async () => {
    app = createTestApp();

    // Register a test user with unique username
    testUsername = uniqueUsername('testuser');
    const response = await request(app)
      .post('/api/register')
      .send({
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: 'password123'
      });

    // Verify registration succeeded
    if (response.status !== 201) {
      throw new Error(`User registration failed: ${response.status} ${JSON.stringify(response.body)}`);
    }
  });

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: testUsername,
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe(testUsername);
    expect(response.body.email).toBe(`${testUsername}@example.com`);
    expect(response.body).not.toHaveProperty('password');
  });

  it('should create session cookie on login', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: testUsername,
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: testUsername,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should reject login with non-existent user', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: 'nonexistent',
        password: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should not reveal if username or password is wrong', async () => {
    const wrongUser = await request(app)
      .post('/api/login')
      .send({ username: 'nonexistent', password: 'password123' });

    const wrongPass = await request(app)
      .post('/api/login')
      .send({ username: testUsername, password: 'wrongpassword' });

    // Both should return same error message
    expect(wrongUser.body.error).toBe(wrongPass.body.error);
  });
});

describe('POST /api/logout', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = createTestApp();
  });

  // SKIPPED: Flaky due to Neon serverless eventual consistency
  it.skip('should logout authenticated user', async () => {
    const username = uniqueUsername('logoutuser');
    // Register and login
    const loginResponse = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'password123'
      });

    const cookies = loginResponse.headers['set-cookie'];

    // Logout
    const response = await request(app)
      .post('/api/logout')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
  });
});

describe('GET /api/user', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return user data when authenticated', async () => {
    const username = uniqueUsername('authuser');
    // Register user
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'password123',
        displayName: 'Auth User'
      });

    const cookies = registerResponse.headers['set-cookie'];

    // Get user data
    const response = await request(app)
      .get('/api/user')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe(username);
    expect(response.body.email).toBe(`${username}@example.com`);
    expect(response.body.displayName).toBe('Auth User');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/user');

    expect(response.status).toBe(401);
  });

  it('should not expose sensitive fields', async () => {
    const username = uniqueUsername('sensitiveuser');
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        username: username,
        email: `${username}@example.com`,
        password: 'password123'
      });

    const cookies = registerResponse.headers['set-cookie'];

    const response = await request(app)
      .get('/api/user')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordResetToken');
    expect(response.body).not.toHaveProperty('passwordResetExpires');
  });
});

describe('Session Security (CRITICAL - NEW)', () => {
  it('should require SESSION_SECRET in production', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.SESSION_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;

    expect(() => {
      const app = express();
      app.use(express.json());
      setupAuth(app);
    }).toThrow('SESSION_SECRET environment variable must be set in production');

    // Restore
    process.env.NODE_ENV = originalEnv;
    process.env.SESSION_SECRET = originalSecret;
  });

  it('should allow default secret in development', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.SESSION_SECRET;

    process.env.NODE_ENV = 'development';
    delete process.env.SESSION_SECRET;

    expect(() => {
      const app = express();
      app.use(express.json());
      setupAuth(app);
    }).not.toThrow();

    // Restore
    process.env.NODE_ENV = originalEnv;
    process.env.SESSION_SECRET = originalSecret;
  });
});
