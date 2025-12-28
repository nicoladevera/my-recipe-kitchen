# Neon Serverless Eventual Consistency - Historical Context & Resolution

## Current Status: RESOLVED

**As of December 2024**, the test suite runs against **local PostgreSQL** (via Docker or GitHub Actions service containers), eliminating all Neon eventual consistency issues.

- **All 122 tests pass** (0 skipped)
- **Test execution time**: ~20-40 seconds (down from 2+ minutes)
- **No flakiness**: Local PostgreSQL provides instant read-after-write consistency

---

## The Problem (Historical)

When tests ran against Neon serverless PostgreSQL, they experienced persistent failures due to **eventual consistency**. Neon's separated compute/storage architecture meant:

1. `INSERT` (Create User/Recipe) - Returns immediately via `.returning()`
2. `SELECT` (Get User/Recipe) - Often runs on different pooled connection that hasn't received replication update

This caused:
- **Foreign Key Violations (Code 23503)**: Creating a recipe for a user that "doesn't exist" yet
- **404 Not Found**: Querying a recipe immediately after creation returns `undefined`
- **500 Internal Server Error**: Middleware failing when expected records are missing

### Impact

- ~24 tests (~20% of suite) were skipped
- Tests took 2+ minutes with aggressive retry logic
- CI was unreliable and flaky

---

## The Solution

### For CI/Testing: Local PostgreSQL

Tests now run against a standard PostgreSQL instance:

**GitHub Actions** uses a PostgreSQL service container:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myrecipekitchen_test
```

**Local Development** can use Docker:
```bash
npm run db:start        # Start PostgreSQL container
npm run db:push:local   # Push schema
npm test                # Run tests (fast, consistent)
```

### For Production: Neon Serverless (Unchanged)

Production continues to use Neon serverless for its benefits:
- Serverless scaling
- Automatic sleep/wake
- Cost efficiency

The eventual consistency is acceptable in production because:
- Real user interactions have natural delays between operations
- Retry logic in the storage layer handles edge cases
- The milliseconds of lag is imperceptible to users

---

## Configuration Details

### Environment Detection

The `server/db.ts` file conditionally uses the appropriate database driver:

```typescript
if (useLocalDb) {
  // Use standard pg driver for local PostgreSQL
  const pg = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  // ...
} else {
  // Use Neon serverless driver
  const { Pool } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  // ...
}
```

### Smart Test Runner

The `scripts/test.sh` automatically detects the available database:

1. If `USE_LOCAL_DB=true` is set (CI), uses local PostgreSQL
2. If local PostgreSQL is detected (Docker), uses it
3. Otherwise falls back to Neon (with longer timeout)

### Vitest Configuration

Critical settings in `vitest.config.ts`:

```typescript
fileParallelism: false,  // Test files run sequentially
sequence: {
  concurrent: false,     // Tests within files run sequentially
},
testTimeout: 10000,      // 10s timeout (was 30s for Neon)
```

---

## Legacy Workarounds (No Longer Needed)

These workarounds were implemented for Neon but are no longer necessary with local PostgreSQL:

1. **Adaptive Retry Logic** (`storage.ts`) - 15 attempts with exponential backoff
2. **`waitForPropagation()` delays** - 150-250ms waits before reads
3. **`withEventualConsistencyRetry()`** - Test-level HTTP request retries
4. **30-second test timeouts** - Now reduced to 10 seconds

The retry logic remains in the codebase as a safety net for production, but is not exercised during testing.

---

## Troubleshooting

### Tests Failing Locally Without Docker

If you don't have Docker installed, tests will fall back to Neon and may experience flakiness:

```
⚠ Local PostgreSQL not available, using Neon (eventual consistency mode)
```

**Solution**: Install Docker Desktop and run:
```bash
npm run db:start
npm run db:push:local
npm test
```

### Race Conditions Between Test Files

If you see tests failing with foreign key violations or 404s that seem random:

**Cause**: Test files running in parallel, with cleanup in one file deleting data another file needs.

**Solution**: Ensure `vitest.config.ts` has:
```typescript
fileParallelism: false,
```

### CI Failing on npm ci

If CI fails with "package-lock.json out of sync":

**Solution**: Regenerate the lock file locally:
```bash
rm -rf node_modules package-lock.json
npm install --include=optional
git add package-lock.json
git commit -m "Fix: Regenerate package-lock.json"
git push
```

---

## References

- [Neon Serverless Architecture](https://neon.tech/docs/introduction/architecture-overview)
- [Drizzle ORM with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [Vitest Configuration](https://vitest.dev/config/)
