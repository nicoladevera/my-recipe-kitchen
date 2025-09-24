import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-based database connection - WITH PRODUCTION FALLBACK FOR IMMEDIATE FIX
function getDatabaseUrl() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    if (process.env.DATABASE_URL_PROD) {
      console.log('Using production database (DATABASE_URL_PROD)');
      return process.env.DATABASE_URL_PROD;
    } else if (process.env.DATABASE_URL) {
      console.log('FALLBACK: Using DATABASE_URL for production (set DATABASE_URL_PROD for proper isolation)');
      return process.env.DATABASE_URL;
    } else {
      throw new Error(
        "DATABASE_URL_PROD or DATABASE_URL must be set for production environment."
      );
    }
  } else {
    if (!process.env.DATABASE_URL_DEV) {
      throw new Error(
        "DATABASE_URL_DEV must be set for development environment. This is required for environment isolation. Please set DATABASE_URL_DEV to your development database URL."
      );
    }
    console.log('Using development database (DATABASE_URL_DEV)');
    return process.env.DATABASE_URL_DEV;
  }
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });