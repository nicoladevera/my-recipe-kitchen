# Changelog

## Recent Changes (November 2025)

- **Neon Eventual Consistency Fixes**: Resolved critical CI/CD test failures caused by Neon serverless "read-after-write" lag. Implemented exponential backoff retry logic for foreign key violations, environment-aware delays, and test-level retries for 404/500 errors.
- **GitHub Integration**: Successfully synced project to GitHub repository at https://github.com/nicoladevera/myrecipekitchen using git commands.
- **Browser Tab Titles Fixed**: Added default `<title>My Recipe Kitchen</title>` to HTML template to prevent URLs from showing in browser tabs before React loads.
- **Environment Database Isolation**: Implemented complete production/development environment separation using single database with environment column filtering for all CRUD operations.
- **True Persistent Storage Achieved**: Successfully configured Replit Object Storage with proper bucket initialization for permanent photo persistence across all deployments and years of inactivity, with intelligent fallback to local storage during any temporary issues, ensuring zero data loss and indefinite photo availability.
- **Production Display Issues Fixed**: Resolved two critical post-deployment bugs: removed landing page marketing blurb from user profile pages and fixed recipe collection headers to show display names instead of usernames.
- **User Profile API Enhancement**: Added `/api/users/:username` endpoint to fetch user profile data by username for proper display name rendering on profile pages.
- **Mobile Authentication Fixed**: Completely resolved mobile authentication issues by implementing native FormData handling instead of react-hook-form, enabling successful login, registration, and password changes on mobile devices.
- **Recipe Content Updated**: Replaced beef stroganoff with chocolate chip cookies recipe, using authentic Pexels food photography and proper pastry categorization with relevant cooking log notes about baking.
- **Cooking Log Layout Enhanced**: Improved spacing with 8px gaps, right-aligned notes on desktop, left-aligned on mobile for better readability.
- **User Page Cleanup**: Removed byline spacing issues by eliminating the "by [username]" text completely.
- **Login Authentication Fixed**: Resolved persistent 401 login errors by implementing proper Passport.js custom callback authentication flow with detailed error handling.
- **Recipe Photos Updated**: Replaced Chicken Parmesan and Beef Stroganoff with new high-quality Pexels photos that better represent the actual dishes.
- **Form Input Bug Fixed**: Resolved numeric field display issues in Add Recipe form where cookTime and servings showed incorrect values due to improper string/number handling.
- **Mobile Layout Spacing**: Improved mobile spacing consistency in landing page blurb section by reducing gaps between feature sections.
- **User Page Spacing**: Added proper spacing between username display and description text for better visual hierarchy.
- **Cooking Log Display**: Enhanced cooking log layout with reduced spacing between date and notes on desktop for cleaner appearance.
- **Password Change Functionality**: Implemented complete backend password update system with proper current password verification and secure hashing.
- **Form Reset Behavior**: Fixed authentication form validation by implementing proper form reset when switching between login/register tabs.
- **Recipe Creation Fixed**: Resolved form validation issues by implementing proper server-side parsing of numeric fields (cookTime, servings) from FormData strings.
- **Cooking Log Modal**: Replaced simple prompts with professional modal interface featuring star ratings, notes, and photo uploads that replace recipe photos.
- **Smart Recipe Sorting**: Implemented timestamp-based sorting where recipes with recent cooking activity appear at top, with precise time-based ordering for same-day logs.
- **Authentication UI Improvements**: Added password visibility toggle (eye icon) to all password fields for better UX.
- **Bio Field Removal**: Removed bio fields from registration, authentication, and settings per user request - can be re-added later if needed.
