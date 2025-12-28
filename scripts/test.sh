#!/bin/bash
# Smart test runner - auto-detects available database
# Priority: 1. Explicit USE_LOCAL_DB, 2. Local PostgreSQL detection, 3. Neon fallback

set -e

# Check if local PostgreSQL is available
check_local_postgres() {
  if command -v pg_isready &> /dev/null; then
    pg_isready -h localhost -p 5432 -q 2>/dev/null
    return $?
  elif command -v docker &> /dev/null; then
    docker compose ps postgres 2>/dev/null | grep -q "running"
    return $?
  fi
  return 1
}

# Load .env.test if it exists
load_env_test() {
  if [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
  fi
}

# Determine which database to use
# Priority: 1. Explicit USE_LOCAL_DB env var (for CI), 2. Auto-detect, 3. Neon fallback
if [ "$USE_LOCAL_DB" = "true" ]; then
  # CI or explicit local mode
  echo "✓ Using local PostgreSQL (USE_LOCAL_DB=true)"
  TIMEOUT_ARG=""
elif check_local_postgres; then
  # Auto-detected local PostgreSQL
  echo "✓ Using local PostgreSQL (auto-detected)"
  export USE_LOCAL_DB=true
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myrecipekitchen_test"
  TIMEOUT_ARG=""
else
  # Fallback to Neon
  echo "⚠ Local PostgreSQL not available, using Neon (eventual consistency mode)"
  echo "  Tip: Install Docker for faster, more reliable tests"
  load_env_test

  if [ -z "$DATABASE_URL" ]; then
    echo "✗ ERROR: No DATABASE_URL found. Set it in .env.test or environment."
    echo ""
    echo "Options:"
    echo "  1. Install Docker and run: npm run db:start"
    echo "  2. Create .env.test with DATABASE_URL=your-neon-connection-string"
    exit 1
  fi

  export USE_LOCAL_DB=false
  # Use longer timeout for Neon due to eventual consistency
  TIMEOUT_ARG="--test-timeout=30000"
fi

export NODE_ENV=test
export SESSION_SECRET="${SESSION_SECRET:-test-session-secret-for-testing-only}"

# Run vitest with any additional arguments passed to the script
exec npx vitest run $TIMEOUT_ARG "$@"
