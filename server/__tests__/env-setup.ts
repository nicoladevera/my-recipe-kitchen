// Environment setup for tests - runs BEFORE any other setup files
// This file sets environment variables that are needed during module initialization

import fs from 'fs';
import path from 'path';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';

// Set DATABASE_URL with fallback for local development
// Priority: 1. Existing env var, 2. .env.test file, 3. Default fallback
if (!process.env.DATABASE_URL) {
  // Try to load from .env.test if it exists
  try {
    const envTestPath = path.join(process.cwd(), '.env.test');

    if (fs.existsSync(envTestPath)) {
      const envContent = fs.readFileSync(envTestPath, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key === 'DATABASE_URL') {
            process.env.DATABASE_URL = values.join('=').trim();
            console.log('✓ Loaded DATABASE_URL from .env.test');
            break;
          }
        }
      }
    }
  } catch (error) {
    // Silently continue if .env.test doesn't exist or can't be read
  }

  // If still not set, use default fallback
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Using default test database connection.');
    console.warn('   For custom configuration, create a .env.test file (see .env.test.example)');
    process.env.DATABASE_URL = 'postgresql://localhost:5432/myrecipekitchen_test';
  }
}

console.log('✓ Test environment configured');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`);
