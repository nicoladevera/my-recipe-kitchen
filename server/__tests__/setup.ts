// Test setup - database cleanup and lifecycle management
// Note: Environment variables are configured in env-setup.ts which runs first

import { beforeAll, afterAll } from 'vitest';
import { pool } from '../db';
import { db } from '../db';
import { users, recipes } from '@shared/schema';
import { sql } from 'drizzle-orm';

beforeAll(async () => {
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment');
  }

  // Clean up any leftover test data from previous runs
  await db.delete(recipes).where(sql`environment = 'test'`);
  await db.delete(users).where(sql`environment = 'test'`);
  console.log('✓ Test database cleaned');
});

afterAll(async () => {
  // Clean up and close database connection
  await db.delete(recipes).where(sql`environment = 'test'`);
  await db.delete(users).where(sql`environment = 'test'`);
  await pool.end();
  console.log('✓ Test database cleanup complete');
});
