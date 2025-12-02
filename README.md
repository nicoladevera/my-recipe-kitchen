# My Recipe Kitchen

[![CI](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/ci.yml/badge.svg)](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/ci.yml)
[![Test Coverage](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/test-coverage.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack recipe management application that allows users to create, organize, and track their personal recipe collection with features like photo uploads, cooking logs, ratings, and advanced filtering.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Security Features](#security-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Configuration Files](#configuration-files)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [Database Migrations](#database-migrations)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- **Recipe Management**: Create, edit, and delete recipes with detailed information including ingredients, instructions, cooking time, and servings
- **Photo Uploads**: Attach high-quality photos to recipes with persistent cloud storage
- **Cooking Logs**: Track when you cook recipes with notes, ratings, and optional photo updates
- **Smart Sorting**: Recipes automatically sort by most recently cooked, keeping active recipes at the top
- **Advanced Filtering**: Filter recipes by hero ingredient, cooking time, servings, and search by name
- **User Authentication**: Secure login and registration with session management
- **User Profiles**: Public profile pages to share your recipe collection with others
- **Input Validation**: Type-safe validation using Zod for all user inputs
- **Responsive Design**: Mobile-first interface that works seamlessly across all devices
- **Environment Isolation**: Data isolation by environment (development/production/test) within shared database

## Screenshots

### Home Page
![My Recipe Kitchen Home Page](attached_assets/myrecipekitchen_home.png)

The landing page welcomes users with a clean, minimalist design featuring the app logo and three core value propositions: Create & Organize your recipes, Track Your Cooking sessions, and Share & Discover recipes with others.

### Recipe Collection
![Recipe Collection with Filters](attached_assets/myrecipekitchen_samplerecipe.png)

The recipe collection page showcases advanced filtering capabilities (search, rating, cook time) and displays recipes with rich details including ingredients, step-by-step instructions, cooking logs with ratings and notes, and high-quality food photography.

## Security Features

- **Password Security**: Passwords hashed using scrypt with individual salts
- **Timing-Safe Comparison**: Prevents timing attacks on password verification
- **Session-Based Authentication**: Secure session management with httpOnly cookies
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Input sanitization and output encoding
- **Authorization Checks**: Recipe ownership verification for all modifications
- **Input Validation**: Server-side Zod validation for all endpoints
- **Sensitive Data Redaction**: Request logging automatically redacts password fields

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for lightweight client-side routing
- **TanStack Query** (React Query) for server state management
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling with custom recipe-themed design
- **Vite** for fast development and optimized builds
- **React Hook Form** for form state management
- **date-fns** for date formatting
- **Framer Motion** for animations

### Backend
- **Node.js 20+** with Express.js
- **TypeScript** with ES modules
- **Passport.js** for authentication
- **Multer** for file upload handling
- **Express Session** for session management
- **Zod** for runtime type validation

### Database & Storage
- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries
- **Replit Object Storage** for persistent photo storage (with local fallback)
- **connect-pg-simple** for PostgreSQL session store

### Testing & CI/CD
- **Vitest** for unit and integration testing
- **Supertest** for API endpoint testing
- **@vitest/ui** for interactive test UI
- **@vitest/coverage-v8** for test coverage reporting
- **GitHub Actions** for automated CI/CD

### Development Tools (Replit-specific)
- **@replit/vite-plugin-cartographer** - Development tooling and code navigation
- **@replit/vite-plugin-runtime-error-modal** - Enhanced error handling during development

### Additional Dependencies

**Installed but not currently used** (reserved for future features):
- **OpenAI** - AI integration (planned feature)
- **SendGrid** - Email notifications (planned feature)
- **WebSockets (ws)** - Real-time updates (planned feature)
- **Google Cloud Storage** - Alternative cloud storage option
- **next-themes** - Dark mode support (partially implemented)

## Project Structure

```
my-recipe-kitchen/
├── .github/
│   ├── workflows/           # GitHub Actions CI/CD pipelines
│   │   ├── ci.yml          # Main CI pipeline (test, lint, security)
│   │   └── test-coverage.yml # Test coverage reporting
│   └── SETUP.md            # GitHub Actions setup guide
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/        # shadcn/ui primitives (50+ components)
│   │   │   ├── add-recipe-form.tsx
│   │   │   ├── recipe-card.tsx
│   │   │   ├── cooking-log-modal.tsx
│   │   │   ├── recipe-filters.tsx
│   │   │   └── confirmation-dialog.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── use-auth.tsx
│   │   │   ├── use-recipes.ts
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/            # Utility functions
│   │   │   ├── queryClient.ts
│   │   │   ├── protected-route.tsx
│   │   │   └── utils.ts
│   │   ├── pages/          # Page components
│   │   │   ├── home.tsx
│   │   │   ├── auth-page.tsx
│   │   │   ├── user-page.tsx
│   │   │   ├── settings-page.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx         # Root component with routing
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
├── server/                  # Backend Express application
│   ├── __tests__/          # Server-side tests
│   │   ├── auth.test.ts
│   │   ├── routes.test.ts
│   │   ├── storage.test.ts
│   │   ├── object-storage.test.ts
│   │   ├── env-setup.ts
│   │   └── setup.ts
│   ├── auth.ts             # Authentication logic (Passport.js)
│   ├── db.ts               # Database connection & pooling
│   ├── index.ts            # Express server entry point
│   ├── routes.ts           # API route handlers
│   ├── storage.ts          # Database operations layer
│   ├── object-storage.ts   # Cloud file storage integration
│   └── vite.ts             # Vite development server setup
├── shared/                  # Code shared between client and server
│   └── schema.ts           # Database schema & Zod validation schemas
├── docs/                    # Project documentation
│   ├── setup/
│   │   └── database.md     # Database environment setup guide
│   └── troubleshooting/
│       ├── neon_consistency.md # Eventual consistency analysis
│       └── archive/        # Legacy documentation
├── attached_assets/         # Screenshots and images
├── uploads/                 # Local file upload fallback directory
├── dist/                    # Production build output
│   └── public/             # Built frontend assets
├── migrations/              # Database migration files (Drizzle)
├── .env.test.example       # Example test environment configuration
├── .replit                 # Replit configuration
├── CHANGELOG.md            # Version history and release notes
└── README.md               # This file
```

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- **`@/`** → `client/src/` - Frontend source files
- **`@shared/`** → `shared/` - Shared code between client and server
- **`@assets/`** → `attached_assets/` - Images and screenshots

**Example usage:**
```typescript
import { Button } from "@/components/ui/button";
import { insertRecipeSchema } from "@shared/schema";
```

Path aliases are configured in:
- `tsconfig.json` - TypeScript compiler
- `vite.config.ts` - Vite bundler
- `vitest.config.ts` - Test runner

## Configuration Files

### Build & Development

- **`vite.config.ts`** - Vite build configuration
  - React plugin with Fast Refresh
  - Path aliases for imports
  - Development server settings
  - Production build optimization
  - Replit-specific plugins (cartographer, error modal)

- **`tsconfig.json`** - TypeScript compiler configuration
  - Strict mode enabled
  - ES modules with ESNext target
  - Path aliases (`@/`, `@shared/`)
  - Includes: client, server, shared

### Testing

- **`vitest.config.ts`** - Vitest test runner configuration
  - Sequential test execution (prevents race conditions)
  - 30-second test timeout (up from default 5s)
  - V8 coverage provider
  - HTML coverage reports in `coverage/` directory
  - Setup files for environment initialization

### Database

- **`drizzle.config.ts`** - Drizzle ORM database configuration
  - PostgreSQL dialect
  - Schema location: `./shared/schema.ts`
  - Migrations output: `./migrations`

### Styling

- **`tailwind.config.ts`** - Tailwind CSS configuration
  - Custom recipe-themed design system
  - Extended color palette
  - Custom breakpoints

- **`postcss.config.js`** - PostCSS processing for Tailwind

- **`components.json`** - shadcn/ui component library configuration
  - Style: "new-york"
  - Base color: "neutral"
  - Component aliases

### Runtime

- **`package.json`** - Project dependencies and scripts
  - 95+ production dependencies
  - Node.js 20+ required
  - ES modules type

- **`.env.test.example`** - Example test environment variables template

- **`.replit`** - Replit platform configuration (if using Replit)

## Getting Started

### Prerequisites

- **Node.js 20.x or higher**
- **PostgreSQL database** (Neon serverless recommended)
- **Replit Object Storage** (optional, for persistent photo storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nicoladevera/my-recipe-kitchen.git
cd my-recipe-kitchen
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section below)

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Environment Variables

### Required Variables

**Database Connection:**
```bash
DATABASE_URL=postgresql://user:password@host/database
```

**Session Secret:**
```bash
SESSION_SECRET=your-secure-random-secret-key
```

### Optional Variables

**Replit Object Storage (for persistent photo storage):**
```bash
REPLIT_DB_URL=your-replit-object-storage-url
```

**Node Environment:**
```bash
NODE_ENV=development  # development, production, or test
```

### How Environment Isolation Works

The application uses a **single database with environment-based data isolation**:

- Data is tagged with `environment` field (`development`, `production`, or `test`)
- Queries automatically filter by current environment based on `NODE_ENV`
- This ensures safe testing without affecting production data
- Test data is automatically cleaned up after each test
- No fallback logic - strict environment separation

**Benefits:**
- Single database for all environments
- Safe concurrent testing
- No production data contamination
- Automatic test cleanup

For detailed setup instructions, see [docs/setup/database.md](docs/setup/database.md)

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode (auto-rerun on changes)
- `npm run test:ui` - Open interactive Vitest UI
- `npm run test:coverage` - Generate test coverage report (sets COVERAGE=true, uses V8 provider, generates HTML report)

## Database Schema

### Users Table
- `id` - UUID primary key (auto-generated)
- `username` - Unique username (3-50 characters, alphanumeric with hyphens/underscores)
- `email` - Unique email address
- `password` - Hashed password (minimum 8 characters, hashed with scrypt)
- `displayName` - Optional display name
- `bio` - Optional user bio
- `passwordResetToken` - Token for password reset (planned feature)
- `passwordResetExpires` - Expiration time for reset token (planned feature)
- `environment` - Environment isolation tag (development/production/test)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Recipes Table
- `id` - UUID primary key (auto-generated)
- `userId` - Foreign key to users table (cascade delete)
- `name` - Recipe name
- `heroIngredient` - Main ingredient category (Chicken, Beef, Pork, Fish, Seafood, Pasta, Vegetable, Pastry, Dessert)
- `cookTime` - Cooking time in minutes (1-1440)
- `servings` - Number of servings (1-50)
- `ingredients` - List of ingredients (text)
- `instructions` - Cooking instructions (text)
- `rating` - Overall rating (0-5, calculated from cooking logs)
- `photo` - Photo URL or path
- `cookingLog` - JSONB array of cooking log entries
- `environment` - Environment isolation tag (development/production/test)
- `createdAt` - Recipe creation timestamp

### Cooking Log Entry Schema
```typescript
{
  timestamp: string;  // ISO timestamp for precise sorting
  notes: string;      // Cooking notes
  rating: number;     // Rating for this cooking session (1-5)
}
```

## Database Migrations

### Schema Changes

The project uses **Drizzle Kit** for database schema management:

```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files (for production)
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

### Migration Files

- **Location:** `migrations/` directory
- **Format:** SQL migration files generated by Drizzle Kit
- **Schema Source:** `shared/schema.ts`

### Data Migration Strategy

For data migrations:
1. Create backup before schema changes
2. Test migrations in development environment first
3. Use environment isolation to test without affecting production
4. Apply to production only after thorough testing

**Important:** Always backup your database before running migrations in production.

## API Endpoints

### Authentication

- **`POST /api/register`** - Register new user
  - Body: `{ username, email, password, displayName? }`
  - Returns: `200` User object with session cookie
  - Errors: `400` Validation error, `409` Username/email already exists

- **`POST /api/login`** - Login user
  - Body: `{ username, password }`
  - Returns: `200` User object with session cookie
  - Errors: `401` Invalid credentials

- **`POST /api/logout`** - Logout user
  - Requires: Authentication
  - Returns: `200` OK
  - Errors: `401` Not authenticated

- **`GET /api/user`** - Get current user
  - Requires: Authentication
  - Returns: `200` User object (excluding password)
  - Errors: `401` Not authenticated

### Recipes

- **`GET /api/recipes`** - Get all user's recipes
  - Requires: Authentication
  - Returns: `200` Array of recipes
  - Errors: `401` Not authenticated

- **`GET /api/recipes/:id`** - Get specific recipe
  - Returns: `200` Recipe object
  - Errors: `404` Recipe not found

- **`POST /api/recipes`** - Create new recipe
  - Requires: Authentication
  - Body: `{ name, heroIngredient, cookTime, servings, ingredients, instructions, photo? }`
  - Supports: Multipart form data with file upload
  - Returns: `201` Created recipe object
  - Errors: `400` Validation error, `401` Not authenticated

- **`PATCH /api/recipes/:id`** - Update recipe
  - Requires: Authentication, ownership
  - Body: Partial recipe object
  - Supports: Multipart form data with file upload
  - Returns: `200` Updated recipe object
  - Errors: `400` Validation error, `401` Not authenticated, `403` Not owner, `404` Recipe not found

- **`DELETE /api/recipes/:id`** - Delete recipe
  - Requires: Authentication, ownership
  - Returns: `204` No Content
  - Errors: `401` Not authenticated, `403` Not owner, `404` Recipe not found

- **`POST /api/recipes/:id/cooking-log`** - Add cooking log entry
  - Requires: Authentication, ownership
  - Body: `{ timestamp, notes, rating, photo? }`
  - Supports: Multipart form data with file upload
  - Returns: `200` Updated recipe with new log entry
  - Errors: `400` Validation error, `401` Not authenticated, `403` Not owner, `404` Recipe not found

- **`DELETE /api/recipes/:id/cooking-log/:index`** - Remove cooking log entry
  - Requires: Authentication, ownership
  - Returns: `200` Updated recipe without the log entry
  - Errors: `400` Invalid index, `401` Not authenticated, `403` Not owner, `404` Recipe not found

### Users

- **`GET /api/users/:username`** - Get user profile by username
  - Returns: `200` Public user data (excludes password, tokens)
  - Errors: `404` User not found

- **`GET /api/users/:username/recipes`** - Get user's public recipes
  - Returns: `200` Array of recipes for the specified user
  - Errors: `404` User not found

- **`PATCH /api/user`** - Update user profile
  - Requires: Authentication
  - Body: `{ username?, displayName? }`
  - Returns: `200` Updated user object
  - Errors: `400` Validation error, `401` Not authenticated, `409` Username already exists

- **`PATCH /api/user/password`** - Update user password
  - Requires: Authentication
  - Body: `{ currentPassword, newPassword }`
  - Returns: `200` Success message
  - Errors: `400` Validation error, `401` Invalid current password

### Utility

- **`GET /objects/:path(*)`** - Serve files from Object Storage
  - Returns: File with appropriate content-type headers
  - Errors: `404` File not found

- **`GET /api/generate-image/:recipe`** - Generate placeholder recipe images
  - Returns: SVG image for recipe placeholders

### Error Response Format

All error responses follow this format:

```json
{
  "message": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error (unexpected error)

## Development

### Code Style
- TypeScript strict mode enabled
- ES modules throughout the project
- Functional components with hooks in React
- Type-safe database queries with Drizzle ORM
- Zod schemas for runtime validation
- No semicolons (consistent style)

### Development Workflow

**Hot Module Replacement (HMR):**
- Vite provides instant feedback on code changes
- React Fast Refresh preserves component state
- Backend changes require server restart

**Debugging Tests:**
```bash
# Watch mode - auto-rerun on changes
npm run test:watch

# Interactive UI - visual test debugging
npm run test:ui

# Coverage report - view in browser
npm run test:coverage
open coverage/index.html
```

**Branch Naming:**
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- PR branches: `pr-*` (triggers CI)

**Development Server:**
- Frontend: Hot reload via Vite
- Backend: Manual restart required (or use nodemon)
- Port: 5000 (both API and static files)

### Mobile Compatibility
The application includes special handling for mobile devices:
- Native FormData for authentication forms (fixes mobile auth issues)
- Responsive layouts with Tailwind breakpoints
- Touch-optimized UI components
- Mobile-first design approach

## Testing

The application includes comprehensive test coverage with automated CI/CD.

### Quick Start
Run the test suite:
```bash
npm test
```

### Local Test Setup

Tests use **environment-based data isolation** within your existing database. No separate test database required!

**Simple Setup:**
```bash
# Set your database URL
export DATABASE_URL=postgresql://user:password@host/database

# Run tests
npm test
```

**How it works:**
- Tests automatically set `NODE_ENV=test`
- All test data is tagged with `environment='test'`
- Data is automatically cleaned up after each test
- Your development/production data remains untouched

**Optional: Custom Test Database**

If you prefer a separate test database:
```bash
# Copy example configuration
cp .env.test.example .env.test

# Edit .env.test with test database URL
DATABASE_URL=postgresql://user:password@host/test_database

# Create test database
createdb myrecipekitchen_test

# Push schema to test database
DATABASE_URL=postgresql://user:password@host/test_database npm run db:push

# Run tests
npm test
```

### Test Commands

- **`npm test`** - Run all tests once
- **`npm run test:watch`** - Run tests in watch mode (auto-rerun on changes)
- **`npm run test:ui`** - Open interactive Vitest UI at http://localhost:51204
- **`npm run test:coverage`** - Generate detailed coverage report
  - Sets `COVERAGE=true` environment variable
  - Uses V8 coverage provider
  - Generates HTML report in `coverage/` directory
  - 250ms propagation delays (accounts for instrumentation overhead)

### Test Configuration

**Key Settings (vitest.config.ts):**
- Sequential execution (prevents race conditions)
- 30-second timeout (up from default 5s)
- Setup files: `env-setup.ts` (runs first), `setup.ts`
- Coverage exclusions: node_modules, dist, test files

### Eventual Consistency Testing

The application runs on **Neon Serverless PostgreSQL**, which exhibits "read-after-write" eventual consistency. This means a record created (`INSERT`) on one connection might not be immediately visible (`SELECT`) on another.

**Implemented Solutions:**

1. **Adaptive Retry Logic** - `createRecipe` in `storage.ts` retries up to 15 times on Foreign Key violations with exponential backoff
2. **Environment-Aware Delays** - `waitForPropagation()` adds delays before critical reads:
   - CI Environment: 150ms
   - Coverage Environment: 250ms (accounts for V8 instrumentation)
3. **Test-Level Retries** - `withEventualConsistencyRetry` wrapper retries HTTP requests up to 10 times on 404/500 errors
4. **Strategic Waits** - Manual delays at synchronization points in storage tests

**Skipped Tests (~8% of suite):**

Due to extreme Neon latency (>10s), approximately 10 tests are intentionally skipped:
- `PATCH /api/recipes/:id` operations
- `DELETE /api/recipes/:id` operations
- Cooking log modification tests
- Multi-step ownership tests

These tests consistently fail despite aggressive retry logic and represent edge cases with rapid `create → modify/delete` sequences.

**For comprehensive analysis**, see [docs/troubleshooting/neon_consistency.md](docs/troubleshooting/neon_consistency.md)

### Test Coverage

The test suite includes **140+ tests** covering:

- **Authentication flows**: Password hashing, login/logout, session management, security checks
- **Recipe CRUD operations**: Create, read, update, delete with validation
- **Photo upload handling**: Local storage, object storage, file type validation
- **Database operations**: User management, environment isolation, data integrity
- **API endpoints**: Authentication requirements, authorization checks, error handling
- **Input validation**: Zod schema validation, SQL injection prevention, XSS prevention
- **Security**: Timing-safe password comparison, session security, ownership verification

### CI/CD Testing

Tests automatically run on:
- Every push to `main` branch
- Every pull request to `main` branch
- Every push to `pr-*` branches

**View results:** [GitHub Actions Workflow](https://github.com/nicoladevera/my-recipe-kitchen/actions)

## Deployment

### Building for Production

1. Build the application:
```bash
npm run build
```

This creates:
- `dist/public/` - Frontend assets (from Vite)
- `dist/index.js` - Backend server bundle (from esbuild)

2. Start the production server:
```bash
npm start
```

### Production Environment Setup

**Required environment variables:**
- `DATABASE_URL` - Production database connection
- `SESSION_SECRET` - Secure session secret (use strong random string)
- `NODE_ENV=production`
- `REPLIT_DB_URL` - Replit Object Storage (if using persistent photos)

### Production Runtime Behavior

**Security:**
- HTTPS redirect middleware (redirects http:// to https://)
- httpOnly session cookies
- Secure cookies (production only)
- Request logging with sensitive field redaction (passwords, tokens)

**Static Files:**
- Served from `dist/public/` directory
- Cache headers for optimization
- Fallback to `index.html` for client-side routing

**Session Storage:**
- PostgreSQL session store (via connect-pg-simple)
- Falls back to memory store if PostgreSQL unavailable

**File Storage:**
- Replit Object Storage (if `REPLIT_DB_URL` set)
- Falls back to local `uploads/` directory
- 1-year cache headers for photos

**Server:**
- Port 5000 (configurable via PORT environment variable)
- Error handling middleware
- Graceful shutdown

## CI/CD with GitHub Actions

### Workflows

The project includes two GitHub Actions workflows:

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every PR and push to `main`:

**Job 1: Run Tests**
- TypeScript type checking (`npm run check`)
- 140+ unit and integration tests (`npm test`)
- Application build verification (`npm run build`)

**Job 2: Code Quality Checks**
- TypeScript compilation
- package.json format validation

**Job 3: Security Audit**
- NPM security audit (high severity issues)
- Secret scanning in code (checks for API keys, secrets)

#### 2. Test Coverage Workflow (`.github/workflows/test-coverage.yml`)

Runs on every PR and push to `main`:

- Runs all tests with coverage
- Generates coverage reports
- Uploads to Codecov (if `CODECOV_TOKEN` configured)
- Checks minimum coverage thresholds

### Required GitHub Secrets

Configure these in: **Repository Settings → Secrets and variables → Actions**

- **`DATABASE_URL`** - Test database connection for CI (required)
- **`SESSION_SECRET`** - Session secret for tests (required)
- **`CODECOV_TOKEN`** - For coverage reporting (optional)

### Pull Request Protection

**Recommended branch protection rules for `main`:**

1. Require pull request before merging
2. Require status checks to pass:
   - `Run Tests`
   - `Code Quality Checks`
   - `Security Audit`
3. Require branches to be up to date
4. Dismiss stale approvals on new commits

**Setup:** Repository Settings → Branches → Add branch protection rule

For detailed CI/CD setup instructions, see [.github/SETUP.md](.github/SETUP.md)

## Troubleshooting

### Database Connection Issues

**Problem:** Tests fail with "DATABASE_URL must be set"

**Solution:** Ensure `DATABASE_URL` is set in your environment or `.env.test` file

```bash
export DATABASE_URL=postgresql://user:password@host/database
```

### Authentication Failures

**Problem:** Login/registration returns 401 or 400

**Solution:** Check that:
- `SESSION_SECRET` is set in environment variables
- Password meets minimum 8 character requirement
- Username is 3-50 characters, alphanumeric with hyphens/underscores only
- Email is valid format

### File Upload Issues

**Problem:** Photo uploads fail

**Solution:**
- Check that `uploads/` directory exists and is writable
- For Object Storage, verify `REPLIT_DB_URL` is correctly configured
- Ensure file size is within limits
- Verify file type is supported (JPEG, PNG, WebP, GIF)

### Test Data Persisting

**Problem:** Test data visible in development

**Solution:** Tests should auto-cleanup, but you can manually remove test data:

```sql
DELETE FROM recipes WHERE environment = 'test';
DELETE FROM users WHERE environment = 'test';
```

### Neon Eventual Consistency Test Failures

**Problem:** Tests fail with 404 errors or Foreign Key violations

**Solution:**
- This is expected behavior with Neon serverless PostgreSQL
- The test suite includes retry logic and delays
- Some tests (~8%) are intentionally skipped due to extreme latency
- See comprehensive guide: [docs/troubleshooting/neon_consistency.md](docs/troubleshooting/neon_consistency.md)

### CI/CD Pipeline Failures

**Problem:** GitHub Actions tests fail

**Solution:**
- Verify GitHub secrets are set correctly (`DATABASE_URL`, `SESSION_SECRET`)
- Check that database is accessible from GitHub Actions runners
- Review workflow logs for specific errors
- See setup guide: [.github/SETUP.md](.github/SETUP.md)

### Path Alias Import Errors

**Problem:** TypeScript can't resolve `@/` or `@shared/` imports

**Solution:**
- Ensure `tsconfig.json` includes your file in the `include` array
- Restart TypeScript server in your editor
- Check that path aliases match between `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`

### Vite Build Errors in Production

**Problem:** Build fails or app doesn't work after deployment

**Solution:**
- Run `npm run check` to catch TypeScript errors
- Verify all environment variables are set in production
- Check that `dist/public/` directory contains built assets
- Ensure `NODE_ENV=production` is set

### Object Storage Fallback Behavior

**Problem:** Photos not persisting after deployment restart

**Solution:**
- If using Replit: Verify `REPLIT_DB_URL` is set correctly
- If not using object storage: Photos stored in `uploads/` will be lost on restart
- Consider setting up persistent cloud storage (Replit Object Storage recommended)

## Documentation

### Available Guides

- **[README.md](README.md)** - This file (project overview and setup)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[docs/setup/database.md](docs/setup/database.md)** - Database environment setup guide
- **[docs/troubleshooting/neon_consistency.md](docs/troubleshooting/neon_consistency.md)** - Neon eventual consistency analysis and solutions
- **[.github/SETUP.md](.github/SETUP.md)** - GitHub Actions CI/CD setup guide
- **[.env.test.example](.env.test.example)** - Example test environment configuration

### Configuration Documentation

- **[components.json](components.json)** - shadcn/ui component library configuration
- **[tsconfig.json](tsconfig.json)** - TypeScript compiler settings
- **[vite.config.ts](vite.config.ts)** - Vite build configuration
- **[vitest.config.ts](vitest.config.ts)** - Test runner configuration
- **[drizzle.config.ts](drizzle.config.ts)** - Database tooling configuration

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests locally: `npm test`
5. Run type checking: `npm run check`
6. Run build verification: `npm run build`
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Pull Request Guidelines

- All PRs are automatically tested via GitHub Actions
- Ensure all tests pass before requesting review
- Follow existing code style (TypeScript strict mode, functional components)
- Add tests for new features
- Update documentation as needed
- Keep PRs focused on a single feature/fix

### Code Review Process

1. Automated checks run (tests, lint, security audit)
2. Code review by maintainers
3. Address feedback
4. Merge when approved and all checks pass

### Notes

- **Package name**: The `package.json` has name "rest-express" (template remnant) - this may be updated in the future to match the project name
- **Unused dependencies**: Some dependencies are installed for planned features (OpenAI, SendGrid, WebSockets) - these will be utilized in future releases

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Recipe photos from [Pexels](https://www.pexels.com/)
- Built with [Replit](https://replit.com/)
