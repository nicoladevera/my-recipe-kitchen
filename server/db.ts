import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for better production stability
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use fetch for better cold start performance

// Single database with environment-based data isolation
function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for database connection.");
  }
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`Using shared database with ${nodeEnv} environment isolation`);
  return process.env.DATABASE_URL;
}

// Environment helper for data isolation
export function getEnvironment(): 'development' | 'production' | 'test' {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ 
  connectionString: databaseUrl,
  // Better production settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});
export const db = drizzle({ client: pool, schema });