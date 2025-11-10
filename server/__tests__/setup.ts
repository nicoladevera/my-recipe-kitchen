// Test setup - database cleanup and lifecycle management
// Note: Environment variables are configured in env-setup.ts which runs first

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { pool } from '../db';
import { db } from '../db';
import { users, recipes } from '@shared/schema';
import { sql } from 'drizzle-orm';

beforeAll(async () => {
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment');
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await db.delete(recipes).where(sql`environment = 'test'`);
  await db.delete(users).where(sql`environment = 'test'`);
});

afterAll(async () => {
  // Clean up and close database connection
  await db.delete(recipes).where(sql`environment = 'test'`);
  await db.delete(users).where(sql`environment = 'test'`);
  await pool.end();
});
