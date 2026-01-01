# Security Scanning Setup Guide

## Overview

This project uses automated security scanning to proactively detect vulnerabilities in dependencies and code. The security scanning stack was implemented on January 1, 2026 with three main components:

1. **Dependabot** - Daily npm dependency vulnerability scanning
2. **CodeQL** - Static code security analysis
3. **Enhanced npm audit** - Build-blocking security audit in CI

---

## Components

### 1. Dependabot (`.github/dependabot.yml`)

**Purpose**: Automatically detect and create PRs for vulnerable dependencies

**Configuration**:
- Runs daily at 9 AM PST
- Scans npm dependencies
- Groups dev dependencies to reduce PR noise
- Limits to 5 open PRs at a time
- Auto-labels PRs with "dependencies" and "security"

**What it monitors**:
- All npm packages in `dependencies`
- All npm packages in `devDependencies`
- Transitive (nested) dependencies

**Expected behavior**:
- Creates PRs when CVEs are published for dependencies
- PRs include security advisory details
- PRs are grouped by update type (patch, minor, major)

### 2. CodeQL Analysis (`.github/workflows/codeql.yml`)

**Purpose**: Static code analysis for security vulnerabilities

**Triggers**:
- Push to main branch
- Pull requests to main
- Weekly schedule (Mondays at 9 AM UTC)

**What it scans**:
- JavaScript/TypeScript code in `server/`, `client/`, `shared/`
- Uses `security-extended` query suite for comprehensive coverage

**Security patterns detected**:
- **SQL injection** - Unsafe database queries
- **Authentication bypasses** - Passport.js misconfigurations
- **Session handling issues** - express-session vulnerabilities
- **XSS vulnerabilities** - React component security
- **Insecure randomness** - Weak crypto usage

**Specific focus areas for this codebase**:
- `server/auth.ts` - Password hashing, session configuration
- `server/db.ts` - Database connection security
- `server/routes.ts` - API endpoint validation
- `server/storage.ts` - SQL injection prevention

**Results location**: GitHub Security tab → Code scanning alerts

### 3. Enhanced npm audit (`.github/workflows/ci.yml`)

**Purpose**: Block builds when high/critical vulnerabilities are present

**Configuration**:
```yaml
- name: Run security audit
  run: npm audit --audit-level=high
  # Note: continue-on-error removed - builds FAIL on high/critical
```

**Behavior**:
- ✅ Passes if only MODERATE or lower vulnerabilities exist
- ❌ Fails if HIGH or CRITICAL vulnerabilities exist
- Blocks PR merging when failing

**Why this configuration**:
- HIGH/CRITICAL vulnerabilities are security emergencies
- MODERATE vulnerabilities in dev dependencies are acceptable short-term
- Balances security with development velocity

---

## Security Vulnerability Levels

### Critical
- **Action**: Immediate fix required
- **Impact**: Active exploitation likely, severe consequences
- **Example**: Remote code execution, authentication bypass

### High
- **Action**: Fix before merging
- **Impact**: Significant security risk
- **Example**: SQL injection, XSS in production code, DoS attacks

### Moderate
- **Action**: Fix when feasible, monitor for escalation
- **Impact**: Limited security risk, often dev dependencies
- **Example**: Dev server vulnerabilities, information disclosure

### Low
- **Action**: Fix during regular dependency updates
- **Impact**: Minimal security risk
- **Example**: Outdated dependencies with no known exploits

---

## Current Security Status

### Vulnerabilities Resolved
- ✅ **qs <6.14.1** (HIGH) - DoS via arrayLimit bypass
  - **Fix**: npm override forcing `qs@>=6.14.1`
  - **Commit**: 91db4c2

### Acceptable Moderate Vulnerabilities
- ⚠️  **esbuild <=0.24.2** (MODERATE) - Dev server request disclosure
  - **Packages affected**: vite, drizzle-kit, @esbuild-kit/core-utils
  - **Impact**: Development environment only, not production
  - **Fix available**: Upgrade to vite 7.x (breaking change)
  - **Decision**: Defer until planned vite upgrade

---

## Monitoring and Maintenance

### Daily Tasks (Automated)
- Dependabot scans dependencies
- Creates PRs for vulnerable packages

### Weekly Tasks (Automated)
- CodeQL comprehensive scan
- Results posted to Security tab

### PR/Push Tasks (Automated)
- CodeQL incremental scan
- npm audit check (fails on high/critical)
- Test suite validation

### Manual Review (As Needed)
1. **Review Dependabot PRs**
   - Check breaking changes
   - Review security advisory details
   - Merge when safe

2. **Review CodeQL Alerts**
   - GitHub Security tab → Code scanning alerts
   - Triage false positives
   - Create issues for true positives

3. **Monitor npm Audit Results**
   - Check CI logs for new vulnerabilities
   - Evaluate risk vs. effort for moderate issues
   - Update dependencies during sprint planning

---

## How to Handle Security Alerts

### High/Critical npm Audit Failure

1. **Identify vulnerable packages**:
   ```bash
   npm audit --audit-level=high
   ```

2. **Try automatic fix**:
   ```bash
   npm audit fix
   ```

3. **If auto-fix unavailable, use overrides**:
   ```json
   "overrides": {
     "vulnerable-package": ">=secure-version"
   }
   ```
   **Important**: Only use overrides for **transitive dependencies**, not direct dependencies!

4. **Verify fix**:
   ```bash
   rm -rf node_modules && npm ci
   npm audit --audit-level=high
   ```

5. **Commit changes**:
   ```bash
   git add package.json package-lock.json
   git commit -m "Fix HIGH severity vulnerability in <package>"
   ```

### CodeQL Security Alert

1. **Review alert in GitHub Security tab**
2. **Assess severity and exploitability**
3. **Create issue if valid**:
   - Reference CodeQL alert number
   - Include affected file and line numbers
   - Propose fix approach

4. **Fix and verify**:
   - Make code changes
   - Push to branch
   - Wait for CodeQL re-scan to clear alert

### Dependabot PR

1. **Review PR description**:
   - Check security advisory details
   - Assess impact on our codebase
   - Review changelog for breaking changes

2. **Test locally** (if needed):
   ```bash
   gh pr checkout <pr-number>
   npm ci
   npm test
   npm run build
   ```

3. **Merge or postpone**:
   - ✅ Merge if safe and tests pass
   - 🔖 Add to backlog if breaking changes require planning
   - 🚫 Close if not applicable (rare)

---

## Troubleshooting

### npm ci Failures
See: [npm-ci-security-scan-failures.md](./npm-ci-security-scan-failures.md)

Common issues:
- package.json and package-lock.json out of sync
- npm overrides conflicting with direct dependencies
- Platform-specific package installation failures

### CodeQL False Positives

If CodeQL flags code that is actually safe:

1. **Add inline suppression**:
   ```typescript
   // lgtm[js/sql-injection]
   const result = await db.query(sanitizedInput);
   ```

2. **Document why it's safe in PR comments**

3. **Consider refactoring** to make safety more obvious to static analysis

### Dependabot Merge Conflicts

If Dependabot PR has conflicts:

1. **Rebase manually**:
   ```bash
   gh pr checkout <pr-number>
   git rebase main
   git push --force-with-lease
   ```

2. **Or close and let Dependabot recreate** (it will auto-rebase)

---

## References

- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL documentation](https://codeql.github.com/docs/)
- [npm audit documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Troubleshooting npm ci failures](./npm-ci-security-scan-failures.md)

---

## Quick Commands

```bash
# Check security vulnerabilities
npm audit
npm audit --audit-level=high

# Test npm ci compatibility
rm -rf node_modules && npm ci

# View dependency tree
npm ls <package>

# Update specific package
npm update <package>
npm install <package>@latest

# Check for outdated packages
npm outdated
```
