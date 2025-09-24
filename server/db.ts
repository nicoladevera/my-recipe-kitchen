import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-based database connection
function getDatabaseUrl() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    if (!process.env.DATABASE_URL_PROD) {
      throw new Error(
        "DATABASE_URL_PROD must be set for production environment. Did you forget to provision a production database?",
      );
    }
    console.log('Using production database');
    return process.env.DATABASE_URL_PROD;
  } else {
    if (!process.env.DATABASE_URL_DEV) {
      // Fallback to DATABASE_URL for backward compatibility
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL_DEV or DATABASE_URL must be set for development environment. Did you forget to provision a development database?",
        );
      }
      console.log('Using development database (fallback to DATABASE_URL)');
      return process.env.DATABASE_URL;
    }
    console.log('Using development database');
    return process.env.DATABASE_URL_DEV;
  }
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });