# Troubleshooting: npm ci Failures in Security Scanning Setup

## Issue Summary

When setting up automated security scanning (Dependabot + CodeQL) in GitHub Actions, the CI pipeline failed with `npm ci` synchronization errors. All workflows (Security Audit, Code Quality Checks, Run Tests, CodeQL Analysis, Test Coverage) were failing with the same root cause.

**Date**: January 1, 2026
**Resolved**: Commit `813ccfc`

---

## Error Symptoms

### Primary Error
```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json
and package-lock.json or npm-shrinkwrap.json are in sync.
Please update your lock file with `npm install` before continuing.

npm error Missing: esbuild@0.18.20 from lock file
npm error Missing: @esbuild/android-arm@0.18.20 from lock file
[... 20+ more missing esbuild platform packages ...]
```

### Secondary Symptoms
- All GitHub Actions workflows failing
- Local `npm install` worked fine
- Local `npm ci` worked fine
- GitHub Actions `npm ci` consistently failed
- Warnings about peer dependency conflicts with vite@7.3.0 and @types/node

---

## Root Cause Analysis

### The Problem: npm Override Conflicts with Direct Dependencies

The issue was caused by attempting to use npm `overrides` on a package that was also a **direct dependency**:

**Problematic configuration:**
```json
{
  "devDependencies": {
    "esbuild": "^0.25.0"  // Direct dependency
  },
  "overrides": {
    "qs": ">=6.14.1",
    "esbuild": ">=0.24.3"  // ❌ CONFLICT: Cannot override direct dependencies
  }
}
```

### Why This Caused npm ci to Fail

1. **npm install** (local) is more forgiving and can resolve conflicts
2. **npm ci** (GitHub Actions) requires exact sync between package.json and package-lock.json
3. npm does **not allow** overriding direct dependencies - only transitive (nested) dependencies
4. This created an inconsistent state where the lock file couldn't satisfy the override constraint
5. GitHub Actions cache + strict `npm ci` validation exposed the issue

### Why Local Testing Didn't Catch It

- Local `npm install` had already created a working `node_modules`
- Subsequent `npm ci` validated against an already-resolved state
- GitHub Actions started fresh each time, triggering the validation error

---

## Solution

### Fix Applied in Commit 813ccfc

**Changes made:**

1. **Removed esbuild from overrides**
   ```json
   "overrides": {
     "qs": ">=6.14.1"  // Keep only qs override
     // Removed: "esbuild": ">=0.24.3"
   }
   ```

2. **Updated direct dependency to secure version**
   ```json
   "devDependencies": {
     "esbuild": "^0.25.12"  // Updated from ^0.25.0
   }
   ```

3. **Regenerated package-lock.json**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Verified npm ci compatibility**
   ```bash
   rm -rf node_modules
   npm ci  # ✅ Now works
   npm audit --audit-level=high  # ✅ Exit code 0
   npm run check  # ✅ TypeScript passes
   ```

### Why This Solution Works

- **Direct dependencies** control their version directly via `devDependencies`
- **Overrides** should only be used for transitive dependencies (nested packages)
- By updating the direct `esbuild` dependency to a secure version (^0.25.12), we eliminate the vulnerability at the source
- The `qs` override still works because it's a transitive dependency (comes through `express` and `supertest`)

---

## Security Audit Results

### Before Fix
- ❌ CI failing - unable to install dependencies
- ⚠️  1 HIGH severity vulnerability (qs)
- ⚠️  5 MODERATE severity vulnerabilities (esbuild in nested packages)

### After Fix
- ✅ CI passing
- ✅ 0 HIGH/CRITICAL vulnerabilities
- ⚠️  5 MODERATE vulnerabilities (acceptable - dev dependencies only)

**npm audit output:**
```
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the
development server and read the response
node_modules/@esbuild-kit/core-utils/node_modules/esbuild
node_modules/drizzle-kit/node_modules/esbuild
node_modules/vite/node_modules/esbuild

5 moderate severity vulnerabilities
```

**Why moderate vulnerabilities are acceptable:**
- Only affects development server (not production)
- CI configured to fail only on `--audit-level=high` (high + critical)
- Fixing requires breaking changes (vite 7.x upgrade)
- Security impact is low (local development only)

---

## Lessons Learned

### 1. Understanding npm Overrides Scope

**✅ DO use overrides for:**
- Transitive (nested) dependencies
- Dependencies of your dependencies
- Example: `qs` is brought in by `express` → we can override it

**❌ DON'T use overrides for:**
- Direct dependencies in `dependencies` or `devDependencies`
- Packages you control the version of directly
- Solution: Update the direct dependency version instead

### 2. Testing npm ci Compatibility

Always test `npm ci` when making package.json changes:

```bash
# Clean test
rm -rf node_modules package-lock.json
npm install

# Verify npm ci works
rm -rf node_modules
npm ci

# Verify security audit passes
npm audit --audit-level=high
```

### 3. Package Override Syntax

**Global override (all instances):**
```json
"overrides": {
  "package-name": ">=version"
}
```

**Scoped override (specific parent - DOESN'T WORK FOR DIRECT DEPS):**
```json
"overrides": {
  "parent-package": {
    "nested-package": ">=version"
  }
}
```

---

## Prevention Checklist

When configuring npm overrides or updating dependencies:

- [ ] Check if the package is a direct dependency first
- [ ] If direct dependency, update in `dependencies`/`devDependencies` instead
- [ ] Use overrides only for transitive dependencies
- [ ] After changes, run clean install: `rm -rf node_modules package-lock.json && npm install`
- [ ] Test `npm ci` in clean state: `rm -rf node_modules && npm ci`
- [ ] Verify security audit: `npm audit --audit-level=high`
- [ ] Commit both `package.json` AND `package-lock.json`
- [ ] Verify GitHub Actions pass before merging

---

## Related Files

- `.github/workflows/ci.yml` - CI workflow with security audit
- `.github/workflows/codeql.yml` - CodeQL security analysis
- `.github/dependabot.yml` - Dependabot configuration
- `package.json` - Dependencies and overrides
- `package-lock.json` - Lock file for npm ci

---

## References

- [npm overrides documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
- [npm ci vs npm install](https://docs.npmjs.com/cli/v9/commands/npm-ci)
- [GitHub Actions: Caching npm dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

---

## Quick Reference Commands

```bash
# Check what npm ci will do (without installing)
npm ci --dry-run

# View dependency tree
npm ls <package-name>

# Find which package depends on a transitive dependency
npm ls <package-name> --all

# Check for vulnerabilities
npm audit
npm audit --audit-level=high  # Only high/critical
npm audit --audit-level=moderate  # Moderate and above

# Fix vulnerabilities (careful - may cause breaking changes)
npm audit fix
npm audit fix --force  # Includes breaking changes
```
