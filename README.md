# My Recipe Kitchen

A full-stack recipe management application that allows users to create, organize, and track their personal recipe collection with features like photo uploads, cooking logs, ratings, and advanced filtering.

## Features

- **Recipe Management**: Create, edit, and delete recipes with detailed information including ingredients, instructions, cooking time, and servings
- **Photo Uploads**: Attach high-quality photos to recipes with persistent cloud storage
- **Cooking Logs**: Track when you cook recipes with notes, ratings, and optional photo updates
- **Smart Sorting**: Recipes automatically sort by most recently cooked, keeping active recipes at the top
- **Advanced Filtering**: Filter recipes by hero ingredient, cooking time, servings, and search by name
- **User Authentication**: Secure login and registration with session management
- **User Profiles**: Public profile pages to share your recipe collection with others
- **Responsive Design**: Mobile-first interface that works seamlessly across all devices
- **Environment Isolation**: Separate development and production databases for safe testing

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

### Database & Storage
- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries
- **Replit Object Storage** for persistent photo storage
- **connect-pg-simple** for PostgreSQL session store

### Testing
- **Vitest** for unit and integration testing
- **Supertest** for API endpoint testing
- **@vitest/ui** for interactive test UI

## Project Structure

```
myrecipekitchen/
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
│   ├── storage.ts         # Photo storage logic
│   └── object-storage.ts  # Replit Object Storage integration
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema and Zod validation
└── uploads/               # Local upload directory (fallback)
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Neon recommended)
- Replit Object Storage (optional, for persistent photo storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nicoladevera/myrecipekitchen.git
cd myrecipekitchen
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

**Development Database:**
```
DATABASE_URL_DEV=postgresql://user:password@host/database
```

**Production Database:**
```
DATABASE_URL_PROD=postgresql://user:password@host/database
```

**Session Secret:**
```
SESSION_SECRET=your-secure-random-secret-key
```

### Optional Variables

**Replit Object Storage (for persistent photo storage):**
```
REPLIT_DB_URL=your-replit-object-storage-url
```

**Node Environment:**
```
NODE_ENV=development  # or production
```

See [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) for detailed database configuration instructions.

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
- `username` - Unique username (3-50 characters)
- `email` - Unique email address
- `password` - Hashed password
- `displayName` - Optional display name
- `environment` - Environment isolation (development/production)

### Recipes Table
- `id` - UUID primary key
- `userId` - Foreign key to users table
- `name` - Recipe name
- `heroIngredient` - Main ingredient category (Chicken, Beef, Pork, Fish, Seafood, Pasta, Vegetable, Pastry, Dessert)
- `cookTime` - Cooking time in minutes (1-1440)
- `servings` - Number of servings (1-50)
- `ingredients` - List of ingredients (text)
- `instructions` - Cooking instructions (text)
- `rating` - Overall rating (0-5)
- `photo` - Photo URL
- `cookingLog` - JSON array of cooking log entries
- `environment` - Environment isolation (development/production)

### Cooking Log Entry Schema
```typescript
{
  timestamp: string;  // ISO timestamp
  notes: string;      // Cooking notes
  rating: number;     // Rating for this cooking session (1-5)
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Recipes
- `GET /api/recipes` - Get all recipes for current user
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/cooking-log` - Add cooking log entry

### Users
- `GET /api/users/:username` - Get user profile by username
- `GET /api/users/:username/recipes` - Get user's public recipes
- `PUT /api/settings/password` - Update user password

## Development

### Code Style
- TypeScript strict mode enabled
- ES modules throughout the project
- Functional components with hooks in React
- Type-safe database queries with Drizzle ORM

### Testing
Run the test suite:
```bash
npm test
```

Tests cover:
- Authentication flows
- Recipe CRUD operations
- Photo upload handling
- Database operations
- API endpoints

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
- `DATABASE_URL_PROD` - Production database connection
- `SESSION_SECRET` - Secure session secret
- `NODE_ENV=production`
- `REPLIT_DB_URL` - Replit Object Storage (if using)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Recipe photos from [Pexels](https://www.pexels.com/)
