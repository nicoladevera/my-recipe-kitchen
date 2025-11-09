# GitHub Actions CI/CD Setup

This repository has automated checks that run on every pull request to protect your production application.

## 🔧 Required Setup

### 1. Add GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

- `DATABASE_URL` - Your PostgreSQL connection string (for tests)
- `SESSION_SECRET` - Your session secret key (for tests)
- `CODECOV_TOKEN` - (Optional) For coverage reports from codecov.io

### 2. Enable Branch Protection

Go to: **Settings → Branches → Add branch protection rule**

For branch: `main`

**Required settings:**
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Select: `Run Tests`, `Code Quality Checks`, `Security Audit`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

**Recommended settings:**
- ✅ Require review from Code Owners
- ✅ Dismiss stale pull request approvals when new commits are pushed

## 📋 What Gets Checked

### CI Workflow (`.github/workflows/ci.yml`)

**On every PR and push to main:**

1. **Run Tests**
   - TypeScript type checking
   - 140+ unit and integration tests
   - Application build verification

2. **Code Quality Checks**
   - TypeScript compilation
   - Package.json validation

3. **Security Audit**
   - NPM security audit (high severity)
   - Secret scanning in code

### Test Coverage Workflow (`.github/workflows/test-coverage.yml`)

**On every PR and push to main:**

1. **Generate Coverage Report**
   - Runs all tests with coverage
   - Uploads to Codecov (if configured)
   - Checks minimum coverage thresholds

## 🚫 What Gets Blocked

Pull requests **CANNOT be merged** if:
- ❌ Tests fail
- ❌ TypeScript compilation fails
- ❌ Build fails
- ❌ Security audit finds critical issues

## ✅ Successful Workflow

1. Create feature branch
2. Make changes
3. Push to GitHub
4. Open pull request
5. **GitHub Actions runs automatically** ⚡
6. Review checks and fix any failures
7. Get approvals (if required)
8. Merge when all checks pass ✅

## 🔍 Viewing Results

- Check the **Checks** tab on any pull request
- See detailed logs by clicking on individual check runs
- Failed checks show exactly what went wrong

## 🛠️ Local Testing

Before pushing, run locally:

```bash
# Run all checks
npm run check        # TypeScript
npm test            # Tests
npm run build       # Build

# Watch mode for development
npm run test:watch
```

## 📊 Coverage Reports

If you set up Codecov:
1. Sign up at https://codecov.io
2. Add your repository
3. Add `CODECOV_TOKEN` secret to GitHub
4. Coverage reports appear on PRs automatically

## 🚨 Emergency Bypass

If you need to bypass checks (NOT RECOMMENDED for production):
1. Go to Settings → Branches
2. Temporarily disable "Require status checks"
3. Merge
4. Re-enable immediately

**Never do this for production with live users!**

## 📝 Notes

- Tests use isolated test environment (`NODE_ENV=test`)
- Database is accessed with `DATABASE_URL` secret
- No production data is affected by CI tests
- All checks must pass before merging
