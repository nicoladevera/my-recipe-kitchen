import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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
export function getEnvironment(): 'development' | 'production' {
  return (process.env.NODE_ENV === 'production') ? 'production' : 'development';
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });