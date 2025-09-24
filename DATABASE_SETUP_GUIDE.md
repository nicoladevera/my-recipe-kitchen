# Database Environment Separation Setup Guide

## Overview

Your recipe manager application now has **strict database environment separation** implemented. This ensures that changes in development never affect production and vice versa.

## Current Status

✅ **All existing data preserved**: 5 users, 17 recipes, 2 sessions  
✅ **Environment isolation implemented**: No fallback logic that could cause dev/prod to share databases  
✅ **Data backup completed**: All data exported to CSV files for safety  

## Required Environment Variables

### Development Environment
```
DATABASE_URL_DEV=[Your current development database URL]
```

### Production Environment  
```
DATABASE_URL_PROD=[Your production database URL]
```

## Setup Instructions

### Step 1: Set Development Database
The current DATABASE_URL contains all your existing data (5 users, 17 recipes). This should become your development database:

1. In your Replit project, go to the "Secrets" tab
2. Add a new secret: `DATABASE_URL_DEV`
3. Set the value to your current DATABASE_URL (copy from your existing environment variables)

### Step 2: Set Production Database
1. Add another secret: `DATABASE_URL_PROD` 
2. Set the value to your production database URL
3. Import your existing data to the production database using the CSV backups

### Step 3: Restart Application
After setting both environment variables, restart your application. You should see:
- Development: "Using development database (DATABASE_URL_DEV)"
- Production: "Using production database (DATABASE_URL_PROD)"

## Data Import for Production

**Important**: For security reasons, user data export/import should be done directly through database tools rather than storing sensitive data in files.

To import your existing data to production:
1. Use database export tools to extract data from your development database
2. Import directly to production database using secure database tools
3. Never store user passwords or session data in files for security reasons

Your development database contains:
- 5 users with full authentication data
- 17 recipes with cooking logs and photos  
- 2 active sessions

## Environment Verification

After setup, verify isolation by:
1. Making changes in development - should not affect production
2. Making changes in production - should not affect development
3. Checking user counts in both environments

## Troubleshooting

If the application fails to start:
- Ensure both `DATABASE_URL_DEV` and `DATABASE_URL_PROD` are set
- Check that the URLs are valid PostgreSQL connection strings
- Verify the databases are accessible and properly configured

Your application now has true database environment separation with all existing data preserved!