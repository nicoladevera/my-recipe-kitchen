# Recipe Manager Application

## Overview

This is a full-stack Recipe Manager application built with React, Express, and PostgreSQL. The application allows users to create, manage, and organize their personal recipe collection with features like photo uploads, cooking logs, rating system, and advanced filtering capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

- **Mobile Authentication Fixed**: Completely resolved mobile authentication issues by implementing native FormData handling instead of react-hook-form, enabling successful login, registration, and password changes on mobile devices
- **Recipe Content Updated**: Replaced beef stroganoff with chocolate chip cookies recipe, using authentic Pexels food photography and proper pastry categorization with relevant cooking log notes about baking
- **Cooking Log Layout Enhanced**: Improved spacing with 8px gaps, right-aligned notes on desktop, left-aligned on mobile for better readability
- **User Page Cleanup**: Removed byline spacing issues by eliminating the "by [username]" text completely
- **Login Authentication Fixed**: Resolved persistent 401 login errors by implementing proper Passport.js custom callback authentication flow with detailed error handling
- **Recipe Photos Updated**: Replaced Chicken Parmesan and Beef Stroganoff with new high-quality Pexels photos that better represent the actual dishes
- **Form Input Bug Fixed**: Resolved numeric field display issues in Add Recipe form where cookTime and servings showed incorrect values due to improper string/number handling
- **Mobile Layout Spacing**: Improved mobile spacing consistency in landing page blurb section by reducing gaps between feature sections
- **User Page Spacing**: Added proper spacing between username display and description text for better visual hierarchy
- **Cooking Log Display**: Enhanced cooking log layout with reduced spacing between date and notes on desktop for cleaner appearance
- **Password Change Functionality**: Implemented complete backend password update system with proper current password verification and secure hashing
- **Form Reset Behavior**: Fixed authentication form validation by implementing proper form reset when switching between login/register tabs
- **Recipe Creation Fixed**: Resolved form validation issues by implementing proper server-side parsing of numeric fields (cookTime, servings) from FormData strings
- **Cooking Log Modal**: Replaced simple prompts with professional modal interface featuring star ratings, notes, and photo uploads that replace recipe photos
- **Smart Recipe Sorting**: Implemented timestamp-based sorting where recipes with recent cooking activity appear at top, with precise time-based ordering for same-day logs
- **Authentication UI Improvements**: Added password visibility toggle (eye icon) to all password fields for better UX
- **Bio Field Removal**: Removed bio fields from registration, authentication, and settings per user request - can be re-added later if needed

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom recipe-themed color palette
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured routes for recipes
- **File Handling**: Multer middleware for photo uploads with file type validation
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reload with tsx and Vite integration

### Database Layer
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations
- **Development Storage**: In-memory storage fallback with sample data
- **Session Storage**: PostgreSQL session store via connect-pg-simple

### Data Model
- **Recipe Schema**: Comprehensive recipe structure with ingredients, instructions, cooking time, servings, ratings, and photo support
- **Cooking Log**: JSON field storing cooking session entries with dates and notes
- **Validation**: Zod schemas for runtime type validation

### Authentication & Sessions
- **Session Management**: Express sessions with PostgreSQL store
- **File Upload Security**: Multer configuration with file type restrictions (JPEG, PNG, WebP) and size limits (5MB)

### UI/UX Design
- **Design System**: Custom recipe-themed design with warm color palette
- **Responsive Design**: Mobile-first approach with Tailwind responsive utilities
- **Component Architecture**: Modular components with shadcn/ui base components
- **User Interactions**: Toast notifications, modal dialogs, and form validation
- **Visual Elements**: Recipe cards with photos, star ratings, and cooking logs

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library
- **express**: Web framework for Node.js
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management

### Database & Storage
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **connect-pg-simple**: PostgreSQL session store
- **multer**: File upload middleware

### UI & Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tools

### Validation & Forms
- **zod**: Runtime type validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers

### Utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component