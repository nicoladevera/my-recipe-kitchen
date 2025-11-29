# My Recipe Kitchen

[![CI](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/ci.yml/badge.svg)](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/ci.yml)
[![Test Coverage](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/nicoladevera/my-recipe-kitchen/actions/workflows/test-coverage.yml)

A full-stack recipe management application that allows users to create, organize, and track their personal recipe collection with features like photo uploads, cooking logs, ratings, and advanced filtering.

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

## Security Features

- **Password Security**: Passwords hashed using scrypt with individual salts
- **Timing-Safe Comparison**: Prevents timing attacks on password verification
- **Session-Based Authentication**: Secure session management with httpOnly cookies
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Input sanitization and output encoding
- **Authorization Checks**: Recipe ownership verification for all modifications
- **Input Validation**: Server-side Zod validation for all endpoints

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for lightweight client-side routing
- **TanStack Query** (React Query) for server state management
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling with custom recipe-themed design
- **Vite** for fast development and optimized builds

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Passport.js** for authentication
- **Multer** for file upload handling
- **Express Session** for session management
- **Zod** for runtime type validation

### Database & Storage
- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries
- **Replit Object Storage** for persistent photo storage
- **connect-pg-simple** for PostgreSQL session store

### Testing & CI/CD
- **Vitest** for unit and integration testing
- **Supertest** for API endpoint testing
- **@vitest/ui** for interactive test UI
- **GitHub Actions** for automated CI/CD

## Project Structure

```
my-recipe-kitchen/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD pipelines
│       ├── ci.yml          # Main CI pipeline (tests, build, linting)
│       └── test-coverage.yml # Test coverage reporting
├── client/                 # Frontend React application
│   └── src/
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       └── pages/          # Page components
├── server/                 # Backend Express application
│   ├── __tests__/         # Server-side tests
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   └── object-storage.ts  # Replit Object Storage integration
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema and Zod validation
├── uploads/               # Local upload directory (fallback)
├── .env.test.example      # Example test environment configuration
└── DATABASE_SETUP_GUIDE.md # Database configuration guide
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Neon recommended)
- Replit Object Storage (optional, for persistent photo storage)

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

3. Set up environment variables (see Environment Variables section below)

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

The application uses a single database with environment-based data isolation:
- Data is tagged with `environment` field (`development`, `production`, or `test`)
- Queries automatically filter by current environment based on `NODE_ENV`
- This ensures safe testing without affecting production data
- Test data is automatically cleaned up after each test

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Generate test coverage report

## Database Schema

### Users Table
- `id` - UUID primary key
- `username` - Unique username (3-50 characters, alphanumeric with hyphens/underscores)
- `email` - Unique email address
- `password` - Hashed password (minimum 8 characters)
- `displayName` - Optional display name
- `bio` - Optional user bio
- `passwordResetToken` - Token for password reset
- `passwordResetExpires` - Expiration time for reset token
- `environment` - Environment isolation (development/production/test)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Recipes Table
- `id` - UUID primary key
- `userId` - Foreign key to users table (cascade delete)
- `name` - Recipe name
- `heroIngredient` - Main ingredient category (Chicken, Beef, Pork, Fish, Seafood, Pasta, Vegetable, Pastry, Dessert)
- `cookTime` - Cooking time in minutes (1-1440)
- `servings` - Number of servings (1-50)
- `ingredients` - List of ingredients (text)
- `instructions` - Cooking instructions (text)
- `rating` - Overall rating (0-5, calculated from cooking logs)
- `photo` - Photo URL or path
- `cookingLog` - JSON array of cooking log entries
- `environment` - Environment isolation (development/production/test)
- `createdAt` - Recipe creation timestamp

### Cooking Log Entry Schema
```typescript
{
  timestamp: string;  // ISO timestamp for precise sorting
  notes: string;      // Cooking notes
  rating: number;     // Rating for this cooking session (1-5)
}
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
  - Body: `{ username, email, password, displayName? }`
  - Returns: User object with session cookie
- `POST /api/login` - Login user
  - Body: `{ username, password }`
  - Returns: User object with session cookie
- `POST /api/logout` - Logout user
  - Requires: Authentication
  - Returns: 200 OK
- `GET /api/user` - Get current user
  - Requires: Authentication
  - Returns: User object (excluding password)

### Recipes
- `GET /api/recipes` - Get all public recipes (seed recipes)
  - Returns: Array of recipes
- `GET /api/recipes/:id` - Get specific recipe
  - Returns: Recipe object
- `POST /api/recipes` - Create new recipe
  - Requires: Authentication
  - Body: `{ name, heroIngredient, cookTime, servings, ingredients, instructions, photo? }`
  - Supports: File upload for photo
  - Returns: Created recipe object
- `PATCH /api/recipes/:id` - Update recipe
  - Requires: Authentication, ownership
  - Body: Partial recipe object
  - Supports: File upload for photo
  - Returns: Updated recipe object
- `DELETE /api/recipes/:id` - Delete recipe
  - Requires: Authentication, ownership
  - Returns: 204 No Content
- `POST /api/recipes/:id/cooking-log` - Add cooking log entry
  - Requires: Authentication, ownership
  - Body: `{ timestamp, notes, rating, photo? }`
  - Supports: File upload for photo update
  - Returns: Updated recipe with new log entry
- `DELETE /api/recipes/:id/cooking-log/:index` - Remove cooking log entry
  - Requires: Authentication, ownership
  - Returns: Updated recipe without the log entry

### Users
- `GET /api/users/:username` - Get user profile by username
  - Returns: Public user data (excludes password, tokens)
- `GET /api/users/:username/recipes` - Get user's public recipes
  - Returns: Array of recipes for the specified user
- `PATCH /api/user` - Update user profile
  - Requires: Authentication
  - Body: `{ username?, displayName? }`
  - Returns: Updated user object
- `PATCH /api/user/password` - Update user password
  - Requires: Authentication
  - Body: `{ currentPassword, newPassword }`
  - Returns: Success message

### Utility
- `GET /objects/:path(*)` - Serve files from Object Storage
  - Returns: File with appropriate content-type headers
- `GET /api/generate-image/:recipe` - Generate placeholder recipe images
  - Returns: SVG image for recipe placeholders

## Development

### Code Style
- TypeScript strict mode enabled
- ES modules throughout the project
- Functional components with hooks in React
- Type-safe database queries with Drizzle ORM
- Zod schemas for runtime validation

### Testing

The application includes comprehensive test coverage with automated CI/CD.

#### Quick Start
Run the test suite:
```bash
npm test
```

#### CI/CD Testing

Tests automatically run on:
- Every push to `main` branch
- Every pull request to `main` branch
- Every push to `pr-*` branches

View test results in GitHub Actions: [CI Workflow](https://github.com/nicoladevera/my-recipe-kitchen/actions)

#### Local Test Setup

Tests use environment-based data isolation within your existing database. No separate test database required!

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

#### Test Commands
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (auto-rerun on changes)
- `npm run test:ui` - Open interactive Vitest UI
- `npm run test:coverage` - Generate detailed coverage report

#### Test Coverage
The test suite includes comprehensive coverage of:
- **Authentication flows**: Password hashing, login/logout, session management, security checks
- **Recipe CRUD operations**: Create, read, update, delete with validation
- **Photo upload handling**: Local storage, object storage, file type validation
- **Database operations**: User management, environment isolation, data integrity
- **API endpoints**: Authentication requirements, authorization checks, error handling
- **Input validation**: Zod schema validation, SQL injection prevention, XSS prevention
- **Security**: Timing-safe password comparison, session security, ownership verification

### Mobile Compatibility
The application includes special handling for mobile devices:
- Native FormData for authentication forms
- Responsive layouts with Tailwind breakpoints
- Touch-optimized UI components
- Mobile-first design approach

## Deployment

### Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Environment Setup

Ensure production environment variables are set:
- `DATABASE_URL` - Production database connection
- `SESSION_SECRET` - Secure session secret (use strong random string)
- `NODE_ENV=production`
- `REPLIT_DB_URL` - Replit Object Storage (if using)

### GitHub Actions Secrets

For CI/CD to work, configure these secrets in your GitHub repository:
- `DATABASE_URL` - Test database connection for CI
- `SESSION_SECRET` - Session secret for tests
- `CODECOV_TOKEN` - (Optional) For coverage reporting

Go to: Repository Settings → Secrets and variables → Actions → New repository secret

## Troubleshooting

### Database Connection Issues
**Problem:** Tests fail with "DATABASE_URL must be set"
**Solution:** Ensure `DATABASE_URL` is set in your environment or `.env.test` file

### Authentication Failures
**Problem:** Login/registration returns 401 or 400
**Solution:** Check that:
- `SESSION_SECRET` is set
- Password meets minimum 8 character requirement
- Username is 3-50 characters, alphanumeric with hyphens/underscores only

### File Upload Issues
**Problem:** Photo uploads fail
**Solution:**
- Check that `uploads/` directory exists and is writable
- For Object Storage, verify `REPLIT_DB_URL` is correctly configured
- Ensure file size is within limits

### Test Data Persisting
**Problem:** Test data visible in development
**Solution:** Tests should auto-cleanup, but you can manually remove test data:
```sql
DELETE FROM recipes WHERE environment = 'test';
DELETE FROM users WHERE environment = 'test';
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

All pull requests are automatically tested via GitHub Actions. Ensure tests pass before requesting review.

## License

This project is licensed under the MIT License.

## Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Recipe photos from [Pexels](https://www.pexels.com/)
