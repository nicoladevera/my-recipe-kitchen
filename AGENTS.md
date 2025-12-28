# AGENTS.md

## Project Overview

**My Recipe Kitchen** is a full-stack recipe management application built with React and Express. Users can create, organize, and track their personal recipe collections with features like photo uploads, cooking logs, ratings, and advanced filtering. The application uses environment-based data isolation (development/production/test) within a single PostgreSQL database.

---

## 1. Tech Stack & Dependencies

### Core Stack

- **Node.js**: v20.0.0+ (required)
- **TypeScript**: 5.6.3 (strict mode enabled)
- **Module System**: ES Modules (`"type": "module"` in package.json)

### Frontend

- **React**: 18.3.1 with TypeScript
- **Routing**: Wouter 3.3.5 (lightweight client-side routing)
- **State Management**: TanStack Query 5.60.5 (React Query for server state)
- **UI Framework**: shadcn/ui with Radix UI primitives (50+ components)
- **Styling**: Tailwind CSS 3.4.17 with tailwindcss-animate and @tailwindcss/typography
- **Build Tool**: Vite 5.4.19
- **Forms**: React Hook Form 7.55.0 with @hookform/resolvers
- **Validation**: Zod 3.24.2
- **Date Utilities**: date-fns 3.6.0
- **Animations**: Framer Motion 11.13.1

### Backend

- **Framework**: Express.js 4.21.2
- **Runtime**: tsx 4.19.1 for development
- **Authentication**: Passport.js 0.7.0 with passport-local
- **Session Management**: express-session 1.18.1 with connect-pg-simple (PostgreSQL session store)
- **File Uploads**: Multer 2.0.2
- **Validation**: Zod 3.24.2 with zod-validation-error

### Database & ORM

- **Database**: PostgreSQL via Neon Serverless (@neondatabase/serverless 0.10.4) for production, standard pg for local testing
- **ORM**: Drizzle ORM 0.39.1 with drizzle-zod 0.7.0
- **Migrations**: Drizzle Kit 0.30.4
- **Session Store**: connect-pg-simple 10.0.0 for PostgreSQL-backed sessions
- **Local Testing**: Docker PostgreSQL 15 for consistent, fast testing

### Storage

- **Cloud Storage**: Replit Object Storage 1.0.0 (primary) with fallback to local `uploads/` directory
- **Alternative**: Google Cloud Storage 7.16.0 (installed but not currently used)

### Testing

- **Test Framework**: Vitest 4.0.8
- **Test UI**: @vitest/ui 4.0.8
- **Coverage**: @vitest/coverage-v8
- **API Testing**: Supertest 7.1.4
- **Test Database**: Docker PostgreSQL 15 (local) - eliminates Neon eventual consistency issues
- **Test Timeout**: 10 seconds (configured in vitest.config.ts)

### Build & Development

- **Bundler**: Vite 5.4.19 (client), esbuild 0.25.0 (server)
- **Dev Server**: tsx for TypeScript execution
- **PostCSS**: 8.4.47
- **Autoprefixer**: 10.4.20

### Environment Requirements

- Node.js v20.0.0 or higher (as specified in README badge)
- PostgreSQL database (Neon serverless recommended)
- Environment variables configured in `.env` (see `.env.test.example` for reference)

### Planned/Unused Dependencies

These packages are installed but not actively used (reserved for future features):

- **OpenAI** 5.11.0 - AI integration (planned)
- **SendGrid** (@sendgrid/mail 8.1.5) - Email notifications (planned)
- **WebSockets** (ws 8.18.0) - Real-time updates (planned)
- **Google Cloud Storage** - Alternative cloud storage
- **next-themes** 0.4.6 - Dark mode support (partially implemented)

---

## 2. Project Structure

```
my-recipe-kitchen/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ui/            # shadcn/ui primitives (50+ components)
│   │   │   ├── add-recipe-form.tsx
│   │   │   ├── recipe-card.tsx
│   │   │   ├── cooking-log-modal.tsx
│   │   │   ├── recipe-filters.tsx
│   │   │   └── confirmation-dialog.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-auth.tsx
│   │   │   ├── use-recipes.ts
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/                # Utility functions
│   │   │   ├── queryClient.ts  # TanStack Query configuration
│   │   │   ├── protected-route.tsx
│   │   │   └── utils.ts
│   │   ├── pages/              # Page components
│   │   │   ├── home.tsx
│   │   │   ├── auth-page.tsx
│   │   │   ├── user-page.tsx
│   │   │   ├── settings-page.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx             # Root component with Wouter routing
│   │   ├── main.tsx            # Application entry point
│   │   └── index.css           # Global styles and Tailwind imports
│   └── index.html              # HTML template
│
├── server/                      # Backend Express application
│   ├── __tests__/              # Server-side tests
│   │   ├── env-setup.ts        # Environment configuration (runs first)
│   │   ├── setup.ts            # Database cleanup lifecycle
│   │   ├── auth.test.ts        # Authentication tests
│   │   ├── routes.test.ts      # API endpoint tests
│   │   ├── storage.test.ts     # Database operations tests
│   │   └── object-storage.test.ts
│   ├── auth.ts                 # Passport.js authentication logic
│   ├── db.ts                   # Database connection & pooling
│   ├── index.ts                # Express server entry point
│   ├── routes.ts               # API route handlers
│   ├── storage.ts              # Database operations layer
│   ├── object-storage.ts       # Cloud file storage integration
│   └── vite.ts                 # Vite development server setup
│
├── shared/                      # Code shared between client and server
│   └── schema.ts               # Drizzle schema & Zod validation schemas
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── ci.yml             # Main CI (test, lint, security)
│       └── test-coverage.yml  # Coverage reporting
│
├── docs/                        # Project documentation
│   ├── setup/
│   │   └── database.md         # Database setup guide
│   └── troubleshooting/
│       └── neon_consistency.md # Eventual consistency documentation
│
├── attached_assets/            # Screenshots and marketing images
├── uploads/                    # Local file upload fallback (git-ignored)
├── dist/                       # Production build output (git-ignored)
│   └── public/                # Built frontend assets
├── migrations/                 # Drizzle database migrations (generated)
├── node_modules/              # Dependencies (git-ignored)
│
└── Configuration Files
    ├── package.json            # Dependencies and scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── vite.config.ts          # Vite build configuration
    ├── vitest.config.ts        # Vitest test configuration
    ├── tailwind.config.ts      # Tailwind CSS configuration
    ├── drizzle.config.ts       # Drizzle ORM configuration
    ├── postcss.config.js       # PostCSS configuration
    ├── components.json         # shadcn/ui configuration
    ├── .env                    # Environment variables (git-ignored)
    ├── .env.test               # Test environment variables (git-ignored)
    ├── .env.test.example       # Test environment template
    └── .gitignore              # Git ignore rules
```

### Architectural Pattern

**Monorepo-style Full-Stack Architecture** with clear separation of concerns:

- **Frontend**: React SPA served by Vite in development, Express in production
- **Backend**: Express REST API with Passport.js authentication
- **Shared**: Common TypeScript types and validation schemas
- **Database Layer**: Drizzle ORM with environment-aware queries

### Path Aliases

TypeScript path aliases are configured for cleaner imports:

- `@/` → `client/src/` - Frontend source files
- `@shared/` → `shared/` - Shared code between client and server
- `@assets/` → `attached_assets/` - Images and screenshots

**Example usage:**
```typescript
import { Button } from "@/components/ui/button";
import { insertRecipeSchema } from "@shared/schema";
```

### Key Directories Explained

- **client/src/components/ui/**: Contains 50+ shadcn/ui components (auto-generated, modify with caution)
- **server/storage.ts**: Database operations layer - all database queries go through here
- **shared/schema.ts**: Single source of truth for database schema and validation
- **migrations/**: Auto-generated by Drizzle Kit - DO NOT manually edit

---

## 3. Development Commands

### Setup & Installation

```bash
npm install              # Install all dependencies
```

### Development

```bash
npm run dev             # Start development server with tsx
                        # Runs: NODE_ENV=development tsx server/index.ts
                        # Starts both Express API and Vite dev server
```

### Building

```bash
npm run build           # Build for production
                        # 1. Builds client with Vite → dist/public/
                        # 2. Bundles server with esbuild → dist/index.js
```

### Production

```bash
npm start               # Start production server
                        # Runs: NODE_ENV=production node dist/index.js
                        # Requires build to be run first
```

### Type Checking

```bash
npm run check           # Run TypeScript compiler type checking
                        # Uses tsc with noEmit flag
```

### Database

```bash
npm run db:push         # Push Drizzle schema changes to Neon database
                        # Uses drizzle-kit to sync schema.ts with database
                        # Requires DATABASE_URL environment variable

npm run db:start        # Start local PostgreSQL container (Docker)
                        # Runs: docker compose up -d postgres

npm run db:stop         # Stop local PostgreSQL container
                        # Runs: docker compose down

npm run db:push:local   # Push schema to local PostgreSQL
                        # For testing against Docker database
```

### Testing

Tests now run against a local PostgreSQL database (Docker) for fast, consistent results.

```bash
# First time setup - start Docker PostgreSQL and push schema
npm run db:start        # Start PostgreSQL container
npm run db:push:local   # Push schema to local database

# Run tests (uses local PostgreSQL automatically)
npm test                # Run all tests once
                        # Uses local PostgreSQL for instant consistency

npm run test:watch      # Run tests in watch mode

npm run test:ui         # Run tests with Vitest UI
                        # Launches interactive test browser UI

npm run test:coverage   # Run tests with coverage report
                        # Generates coverage reports in text, JSON, and HTML formats

npm run test:neon       # Run tests against Neon database (legacy)
                        # Uses DATABASE_URL from environment
```

### Script Details

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `NODE_ENV=development tsx server/index.ts` | Development server with hot reload |
| `build` | `vite build && esbuild server/index.ts ...` | Production build (client + server) |
| `start` | `NODE_ENV=production node dist/index.js` | Run production build |
| `check` | `tsc` | Type checking without emitting files |
| `db:push` | `drizzle-kit push` | Sync Neon database schema |
| `db:start` | `docker compose up -d postgres` | Start local PostgreSQL container |
| `db:stop` | `docker compose down` | Stop local PostgreSQL container |
| `db:push:local` | `USE_LOCAL_DB=true ... drizzle-kit push` | Sync local PostgreSQL schema |
| `test` | `USE_LOCAL_DB=true ... vitest run` | Run tests with local PostgreSQL |
| `test:neon` | `NODE_ENV=test vitest run` | Run tests with Neon (legacy) |
| `test:watch` | `USE_LOCAL_DB=true ... vitest` | Watch mode for development |
| `test:ui` | `USE_LOCAL_DB=true ... vitest --ui` | Interactive test UI |
| `test:coverage` | `USE_LOCAL_DB=true ... vitest run --coverage` | Generate coverage reports |

---

## 4. Testing Strategy

### Testing Framework

- **Vitest 4.0.8**: Unit and integration testing
- **Supertest 7.1.4**: HTTP endpoint testing
- **@vitest/ui**: Interactive test browser
- **@vitest/coverage-v8**: Code coverage reporting

### Test Organization

```
server/__tests__/
├── env-setup.ts              # Environment configuration (runs FIRST)
├── setup.ts                  # Database cleanup (beforeAll/afterAll)
├── auth.test.ts              # Authentication endpoints
├── routes.test.ts            # Recipe CRUD endpoints
├── storage.test.ts           # Database operations
└── object-storage.test.ts    # Cloud storage integration
```

### Test Execution Details

**Sequential Execution**: Tests run sequentially (not in parallel) to prevent database race conditions:

```typescript
// vitest.config.ts
fileParallelism: false,  // Prevents test FILES from running in parallel
sequence: {
  concurrent: false,     // Prevents tests WITHIN files from running in parallel
}
```

**Why both settings?**
- `fileParallelism: false` - Ensures test files run one at a time (e.g., `auth.test.ts` finishes before `routes.test.ts` starts)
- `sequence.concurrent: false` - Ensures tests within each file run sequentially

Without both settings, you may see race conditions where one file's database cleanup interferes with another file's tests.

**Setup Files** (run in order):
1. `env-setup.ts` - Configures environment variables before any imports
2. `setup.ts` - Database cleanup lifecycle management

**Test Environment**:
- Environment: `NODE_ENV=test`
- Timeout: 10 seconds per test (reduced from 30s with local PostgreSQL)
- Database: Local Docker PostgreSQL (fast, consistent) or Neon (legacy)
- Sequential execution to avoid race conditions

### Writing Tests

**Example test structure:**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Recipe API', () => {
  it('should create a new recipe', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ name: 'Test Recipe', ... });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Coverage Configuration

Coverage excludes:
- `node_modules/`
- `dist/`
- Test files (`*.test.ts`, `*.spec.ts`)
- Test directory (`server/__tests__/`)

Reports generated: text, JSON, HTML

### Known Testing Considerations

**Local PostgreSQL (Default)**:
- Tests run against Docker PostgreSQL by default (`npm test`)
- No eventual consistency issues - instant read-after-write
- Fast execution (~10-20 seconds for full suite)
- Requires Docker to be running (`npm run db:start`)

**Neon Serverless (Legacy/Production)**:
- Use `npm run test:neon` to test against Neon
- May experience "read-after-write" lag due to serverless architecture
- Retry logic implemented for foreign key violations
- See `docs/troubleshooting/neon_consistency.md` for details

### Running Tests

```bash
# First time setup
npm run db:start         # Start Docker PostgreSQL
npm run db:push:local    # Push schema to local database

# Run all tests (uses local PostgreSQL)
npm test

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run against Neon (legacy)
npm run test:neon
```

---

## 5. Code Style & Standards

### TypeScript Configuration

**Strict Mode Enabled** (`tsconfig.json`):
- `strict: true` - All strict type-checking options enabled
- `noEmit: true` - Type checking only, no compilation
- `skipLibCheck: true` - Skip type checking of declaration files
- `allowImportingTsExtensions: true` - Allow .ts imports
- `moduleResolution: "bundler"` - Modern bundler resolution

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `add-recipe-form.tsx`, `recipe-card.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `use-auth.tsx`, `query-client.ts`)
- **Pages**: `kebab-case.tsx` (e.g., `auth-page.tsx`, `user-page.tsx`)
- **Server files**: `kebab-case.ts` (e.g., `object-storage.ts`)
- **Types/Schemas**: `schema.ts`, `types.ts`

### Code Organization Patterns

**Import Order** (conventional):
1. External dependencies (React, Express, etc.)
2. Internal aliases (`@/`, `@shared/`)
3. Relative imports (`./`, `../`)
4. Type imports

**Example:**
```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { insertRecipeSchema } from "@shared/schema";
import { formatDate } from "./utils";
```

### Variable Naming

- **React Components**: PascalCase (e.g., `RecipeCard`, `AddRecipeForm`)
- **Functions/Variables**: camelCase (e.g., `fetchRecipes`, `userId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DATABASE_URL`, `SESSION_SECRET`)
- **Types/Interfaces**: PascalCase (e.g., `Recipe`, `User`, `CookingLogEntry`)

### Environment-Aware Code

All database operations must respect the `environment` column:

```typescript
// ✅ GOOD: Environment-aware query
await db.select()
  .from(recipes)
  .where(and(
    eq(recipes.userId, userId),
    eq(recipes.environment, process.env.NODE_ENV || 'development')
  ));

// ❌ BAD: Ignores environment isolation
await db.select()
  .from(recipes)
  .where(eq(recipes.userId, userId));
```

### Validation Pattern

Use Zod schemas from `@shared/schema` for all user inputs:

```typescript
import { insertRecipeSchema } from "@shared/schema";

// Validate request body
const validated = insertRecipeSchema.parse(req.body);
```

### Error Handling

- Use `try-catch` blocks for async operations
- Return appropriate HTTP status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors)
- Log errors to console in development, redact sensitive data in production

### Linting & Formatting

**No custom ESLint or Prettier configuration** - the project relies on:
- TypeScript's strict mode for type safety
- Built-in Vite defaults
- Team conventions documented here

If linting is added later, prefer:
- ESLint with TypeScript plugin
- Prettier with default settings
- Pre-commit hooks via Husky

---

## 6. Boundaries & Constraints

### NEVER Commit These Files/Directories

**Environment Files**:
- `.env` - Contains secrets (DATABASE_URL, SESSION_SECRET, API keys)
- `.env.local`
- `.env.test` - Test database credentials
- `.env.*.local`

**Build Artifacts**:
- `dist/` - Production build output
- `node_modules/` - Dependencies (install via npm)
- `vite.config.ts.*` - Temporary Vite config files

**Generated/Temporary Files**:
- `*.tar.gz` - Archive files
- `.DS_Store` - macOS system files
- `server/public/` - Served static files
- `uploads/` - Local file storage (use cloud storage in production)

**See `.gitignore` for complete list**

### NEVER Manually Edit

**Auto-Generated Files**:
- `migrations/` - Drizzle migration files (generated by `drizzle-kit`)
- `client/src/components/ui/` - shadcn/ui components (regenerate with `shadcn-ui add`)
- `package-lock.json` - Lock file (managed by npm)

### Protected Patterns

**Database Operations**:
- ALWAYS include `environment` filter in queries
- NEVER bypass environment isolation
- ALWAYS use parameterized queries (Drizzle handles this)

**Authentication**:
- NEVER store plaintext passwords (use scrypt hashing via Passport.js)
- NEVER expose password hashes in API responses
- ALWAYS verify ownership before modifying resources

**Security**:
- NEVER commit API keys, secrets, or credentials
- NEVER disable HTTPS redirect in production (see `server/index.ts`)
- NEVER trust client-side validation alone (always validate server-side)

### Deprecated Patterns to Avoid

Based on CHANGELOG.md, these patterns were removed/deprecated:

- ❌ **Direct prompts for cooking logs** - Use `CookingLogModal` component instead
- ❌ **Bio fields in registration** - Removed from forms (may be added back later)
- ❌ **react-hook-form for authentication** - Use native FormData for mobile compatibility
- ❌ **Username in profile page bylines** - Use display names instead

### Data Integrity Rules

**Environment Isolation**:
- Development, production, and test environments share one database
- Data is isolated via `environment` column (values: 'development', 'production', 'test')
- ALWAYS filter by `process.env.NODE_ENV` in queries

**Foreign Key Constraints**:
- Recipes cascade delete when user is deleted
- Handle potential eventual consistency issues in Neon serverless (see retry logic in tests)

### File Upload Constraints

- **Cloud Storage**: Replit Object Storage (primary)
- **Local Fallback**: `uploads/` directory (git-ignored)
- **NEVER commit uploads** - Cloud storage ensures persistence
- Photo URLs stored in database should reference cloud storage paths

---

## 7. Git Workflow

### Branching Strategy

**Main Branch**: `main`
- Production-ready code
- Protected branch (CI must pass before merge)
- All PRs target `main`

**Feature Branches**:
- Create feature branches from `main`
- Naming: Use descriptive names (e.g., `feature/cooking-log-modal`, `fix/mobile-auth`)
- Merge via pull request after CI passes

### Commit Message Convention

**Format**: `Category: Description`

**Categories** (based on recent commits):
- **Tests**: Test-related changes
- **Docs**: Documentation updates
- **Server**: Backend/server changes
- **Client**: Frontend changes
- **Fix**: Bug fixes
- **Feature**: New features
- **Refactor**: Code refactoring
- **Security**: Security improvements
- **CI**: CI/CD pipeline changes

**Examples** (from actual commit history):
```
Tests: Skip flaky password and XSS tests due to serverless latency
Docs: Correct author name in LICENSE
Server: Remove reusePort option for better macOS compatibility
Fix: Resolve mobile authentication with native FormData
Feature: Add cooking log modal with star ratings
```

**Guidelines**:
- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issue numbers if applicable
- Group related changes in one commit

### Pull Request Requirements

**Before Creating PR**:
1. ✅ All tests pass locally (`npm test`)
2. ✅ TypeScript compiles without errors (`npm run check`)
3. ✅ Build succeeds (`npm run build`)
4. ✅ No console errors in development

**PR Description Should Include**:
- Summary of changes
- Motivation/context
- Testing performed
- Screenshots (for UI changes)
- Breaking changes (if any)

### CI/CD Pipeline (GitHub Actions)

**Runs on**:
- All pull requests to `main`
- All pushes to `main`

**Jobs**:

1. **Test** (`test` job):
   - ✅ Uses PostgreSQL service container (fast, consistent)
   - ✅ TypeScript type checking (`npm run check`)
   - ✅ Push schema to local PostgreSQL (`npm run db:push:local`)
   - ✅ Run all tests (`npm test`)
   - ✅ Build application (`npm run build`)
   - Requires: `DATABASE_URL` secret (for production build only)

2. **Lint** (`lint` job):
   - ✅ TypeScript error checking
   - ✅ Verify package.json format

3. **Security** (`security` job):
   - ✅ npm security audit (high-level vulnerabilities)
   - ✅ Scan for secrets in code (API keys, tokens)
   - Continues on error (informational only)

**Required Environment Variables** (GitHub Secrets):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret

### Pre-Commit Hooks

**Currently**: No pre-commit hooks configured

**Recommended** (if adding later):
- Run type checking (`npm run check`)
- Run tests on changed files
- Format with Prettier
- Lint with ESLint

### Merge Strategy

- **Squash and merge** recommended for feature branches
- **Regular merge** for hotfixes to preserve commit history
- Delete feature branches after merge

---

## Environment Setup

### Required Environment Variables

Create `.env` file in project root:

```bash
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session Secret (REQUIRED)
SESSION_SECRET=your-secure-random-secret-here

# Node Environment (auto-set by npm scripts)
NODE_ENV=development

# Optional: Replit Object Storage
REPLIT_DB_URL=your-replit-object-storage-url
```

### Testing Environment

Create `.env.test` file (copy from `.env.test.example`):

```bash
DATABASE_URL=postgresql://localhost:5432/myrecipekitchen_test
SESSION_SECRET=test-session-secret-for-testing-only
NODE_ENV=test
```

**Important**: Use a separate test database to avoid affecting development data.

---

## Additional Resources

### Documentation

- **Database Setup**: `docs/setup/database.md`
- **Neon Consistency**: `docs/troubleshooting/neon_consistency.md`
- **GitHub Actions**: `.github/SETUP.md`
- **Changelog**: `CHANGELOG.md`
- **Main README**: `README.md`

### External Dependencies Docs

- [Drizzle ORM](https://orm.drizzle.team/)
- [Vitest](https://vitest.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/)
- [Wouter](https://github.com/molefrog/wouter)
- [Passport.js](https://www.passportjs.org/)

---

## Quick Reference

### Common Tasks

**Add a new UI component:**
```bash
npx shadcn-ui@latest add [component-name]
```

**Create a database migration:**
```bash
npm run db:push
```

**Debug tests:**
```bash
npm run test:ui
# Opens interactive test browser
```

**Check for type errors:**
```bash
npm run check
```

### Common Issues

1. **Tests failing - Docker not running**: Run `npm run db:start` first
2. **Tests failing - Schema not pushed**: Run `npm run db:push:local`
3. **HTTPS redirect in development**: Set `NODE_ENV=development`
4. **Session issues**: Check `SESSION_SECRET` is set
5. **Build errors**: Clear `dist/` and rebuild
6. **Neon eventual consistency**: Use `npm test` (local PostgreSQL) instead of `npm run test:neon`

---

## License

MIT License - See `LICENSE` file for details.

**Author**: Nicola DeVera
