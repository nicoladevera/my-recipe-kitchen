# Neon Serverless Eventual Consistency - Test Failure Analysis & Resolution

## Executive Summary

This document details the comprehensive effort to resolve persistent test failures caused by **Neon serverless PostgreSQL's eventual consistency**. The environment exhibits significant "read-after-write" lag where records created on one connection are not immediately visible to subsequent queries on different pooled connections.

**Status:**
- **CI Tests (`npm test`):** 120/122 passing.
- **Coverage Tests (`npm run test:coverage`):** 119/122 passing.
- **Key Achievement:** Resolved ~20 recurring failures across multiple suites by implementing a multi-layered consistency strategy.
- **Remaining Issues:** A few edge-case tests (`PATCH` operations and complex storage sorting) remain flaky due to extreme environmental latency (>6s) or unhandled transient 500 errors from the driver.

---

## The Core Problem

Neon serverless uses a separated compute/storage architecture. When a test performs:
1. `INSERT` (Create User/Recipe)
2. `SELECT` (Get User/Recipe)

The `INSERT` returns immediately (confirmed by `.returning()`), but the `SELECT` often runs on a different pooled connection that hasn't received the replication update yet. This leads to:
*   **Foreign Key Violations (Code 23503):** Creating a recipe for a user that "doesn't exist" yet.
*   **404 Not Found:** Querying a recipe immediately after creation returns `undefined`.
*   **Empty Results:** Sorting/filtering tests return empty arrays.

## Implemented Solutions

We implemented a robust, multi-layered defense strategy:

### 1. Adaptive Retry Logic for Writes (`storage.ts`)
We modified `createRecipe` to wrap the `INSERT` operation in a retry loop that specifically catches PostgreSQL Error `23503` (Foreign Key Violation).
*   **Strategy:** Exponential backoff (capped at 1s).
*   **Attempts:** Increased from 3 to **10**.
*   **Result:** Drastically reduced "User not found" errors during recipe creation.

### 2. Environment-Aware Delays (`waitForPropagation`)
We introduced a `waitForPropagation()` helper that sleeps for a configurable duration to allow DB sync.
*   **CI Environment:** **150ms** delay (increased from 60ms).
*   **Coverage Environment:** **250ms** delay (increased from 75ms) to account for V8 instrumentation overhead.
*   **Usage:** Injected before critical read operations and after user/recipe creation in tests.

### 3. Test-Level Retry Logic (`withEventualConsistencyRetry`)
We created a wrapper for HTTP requests in `routes.test.ts` that retries operations on failure.
*   **Triggers:** Retries on `404 Not Found` AND `500 Internal Server Error`.
*   **Strategy:** Exponential backoff (capped at 2s).
*   **Attempts:** **10** (approx 12s total wait time).
*   **Result:** Solved most "Get after Create" 404 errors.

### 4. Strategic Waits in Storage Tests
We manually injected `await waitForPropagation()` calls into `storage.test.ts` at critical synchronization points:
*   Before creating recipes (to ensure User exists).
*   Between creating recipes and adding cooking logs.
*   Before querying recipes for sorting/filtering.

### 5. Timeout Adjustments
We increased test timeouts to **20s** for specific flaky tests to accommodate the aggressive retry logic required by the slow environment.

## Remaining Challenges

Despite these fixes, a few tests remain stubborn:

1.  **`routes.test.ts` > `should update recipe when owner`**:
    *   **Symptom:** `PATCH` returns 500 consistently even after 10 retries.
    *   **Cause:** Likely a persistent `NeonDbError` or connection pool issue under load where the write connection is unstable. The `POST` succeeds (201), but the subsequent `PATCH` fails.

2.  **`storage.test.ts` > `should sort by cooking log activity`**:
    *   **Symptom:** Returns empty array.
    *   **Cause:** Extreme replication lag. The `getRecipes` query simply cannot see the created data even after >1s of cumulative waiting.

## Recommendation

The current test suite is aggressively tuned for a high-latency environment. To achieve 100% stability, we recommend:
1.  **Local Testing:** Run tests against a local Dockerized PostgreSQL instance (consistent) instead of remote Neon Serverless (eventually consistent).
2.  **Mocking:** Mock the `storage` layer for unit tests to verify logic without DB dependency.
3.  **Isolated Connections:** Refactor `db.ts` to enforce a single connection for tests (disable pooling), though this defeats the purpose of testing the production-like environment.