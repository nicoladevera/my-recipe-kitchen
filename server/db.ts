import * as schema from "@shared/schema";

// Environment helper for data isolation
export function getEnvironment(): 'development' | 'production' | 'test' {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

// Determine which database driver to use
// USE_LOCAL_DB=true means use standard pg driver (for local PostgreSQL/Docker)
// Otherwise use Neon serverless driver
const useLocalDb = process.env.USE_LOCAL_DB === 'true';

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for database connection.");
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbType = useLocalDb ? 'local PostgreSQL' : 'Neon serverless';
  console.log(`Using ${dbType} with ${nodeEnv} environment isolation`);
  return process.env.DATABASE_URL;
}

const databaseUrl = getDatabaseUrl();

// Pool and db will be initialized based on driver type
let pool: any;
let db: any;

if (useLocalDb) {
  // Use standard pg driver for local PostgreSQL
  const pg = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');

  pool = new pg.default.Pool({
    connectionString: databaseUrl,
    max: 20,
  });

  db = drizzle(pool, { schema });
} else {
  // Use Neon serverless driver
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  const ws = await import('ws');

  // Configure Neon for better production stability
  neonConfig.webSocketConstructor = ws.default;
  neonConfig.poolQueryViaFetch = true;

  pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  });

  db = drizzle({ client: pool, schema });
}

export { pool, db };
