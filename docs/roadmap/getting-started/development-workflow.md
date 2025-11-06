# Development Workflow

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This guide covers the day-to-day development workflow for TRAZO MVP, including common commands, development tools, and best practices.

---

## Daily Development

### Standard Workflow

```bash
# 1. Pull latest
git pull origin cleanup

# 2. Start dev server
npm run dev

# 3. Watch tests (in separate terminal)
npm run test:watch

# 4. Make changes
# ...

# 5. Check types
npx tsc --noEmit

# 6. Run tests
npm test

# 7. Build verification
npm run build

# 8. Commit (if all pass)
git add .
git commit -m "feat: [description]"
git push origin cleanup
```

### Before Committing

```bash
# Run all checks:
npm run lint           # ESLint
npx tsc --noEmit      # Type checking
npm test               # Unit tests
npm run build          # Build verification
```

---

## Common Commands

### Development

```bash
# Start development server
npm run dev                    # http://localhost:3000

# Use Turbopack (faster)
npm run dev -- --turbopack
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

### Database

```bash
# Seed test data
npm run seed:dev

# Clean and reseed
npm run seed:clean
```

### Build

```bash
# Production build
npm run build

# Start production server
npm run start
```

---

## Development Tools

### Dev Mode

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` to:
- Bypass authentication
- Use mock user (test@trazo.app)
- See dev mode banner
- Access all features without database

**Toggle Dev Mode:**
```bash
# Enable
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local

# Disable
echo "NEXT_PUBLIC_DEV_MODE=false" >> .env.local

# Restart server
npm run dev
```

### VS Code Tasks

Use the task "Typecheck and run tests":
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Select "Tasks: Run Task"
3. Choose "Typecheck and run tests"

This runs both TypeScript checking and the full test suite.

---

## Git Workflow

### Branch Strategy

```
main          - Production-ready code
cleanup       - Current development branch
feature/*     - Feature branches
fix/*         - Bug fix branches
```

### Commit Messages

Follow conventional commits:

```bash
# Features
git commit -m "feat: add inventory lot tracking"

# Bug fixes
git commit -m "fix: resolve RBAC permission check"

# Documentation
git commit -m "docs: update deployment guide"

# Chores (maintenance)
git commit -m "chore: update dependencies"

# Tests
git commit -m "test: add inventory query tests"
```

### Creating a Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/task-management

# Make changes
# ...

# Commit and push
git add .
git commit -m "feat: add task management dashboard"
git push origin feature/task-management

# Create pull request on GitHub
# ...

# After approval, merge to cleanup
git checkout cleanup
git merge feature/task-management
git push origin cleanup

# Delete feature branch
git branch -d feature/task-management
git push origin --delete feature/task-management
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local` with:

```bash
# US Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Canada Supabase
NEXT_PUBLIC_SUPABASE_URL_CA=https://[ca-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_CA=eyJ...
CAN_SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Dev Mode (optional)
NEXT_PUBLIC_DEV_MODE=false

# Site URL (for production)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Cron Secret (for Vercel Cron)
CRON_SECRET=your-secure-random-token
```

### Setting Up for First Time

```bash
# 1. Clone repository
git clone https://github.com/anejaagam/trazo-mvp-v1.git
cd trazo-mvp-v1

# 2. Install dependencies
npm install

# 3. Create .env.local
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Verify type checking
npx tsc --noEmit

# 5. Run tests
npm test

# Expected: 164/173 passing (94.8%)

# 6. Seed development data (optional)
npm run seed:dev

# 7. Start development server
npm run dev

# 8. Visit http://localhost:3000
```

---

## Debugging

### Common Issues

**Issue: Authentication not working**
```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Verify Supabase connection
curl https://[project].supabase.co/rest/v1/
```

**Issue: RLS policy blocking query**
```sql
-- Check RLS policies in Supabase SQL Editor
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

**Issue: Build fails**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

**Issue: Tests failing**
```bash
# Run single test file
npm test -- feature.test.ts

# Run with verbose output
npm test -- --verbose

# Clear test cache
npm test -- --clearCache
```

### Browser DevTools

**Check console for errors:**
1. Open DevTools (F12 / Cmd+Option+I)
2. Go to Console tab
3. Look for red errors

**Check network requests:**
1. Open DevTools
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for failed requests (red)

**Check React components:**
1. Install React DevTools extension
2. Open DevTools
3. Go to Components tab
4. Inspect component props/state

---

## Performance

### Build Optimization

```bash
# Analyze bundle size
npm run build
# Check .next/analyze/ directory

# Use Turbopack (faster builds)
npm run dev -- --turbopack
```

### Database Query Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_feature_org_site ON feature_items(org_id, site_id);

-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT * FROM feature_items WHERE org_id = 'uuid';
```

### Component Optimization

```typescript
// Use React.memo for expensive components
export const FeatureCard = React.memo(({ item }: Props) => {
  // ...
})

// Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // ...
}, [dependencies])
```

---

## Helpful Scripts

### Custom Scripts

```bash
# Check for TypeScript errors
npm run typecheck

# Lint all files
npm run lint

# Fix lint errors
npm run lint -- --fix

# Generate Supabase types
npm run types:generate

# Reset database and reseed
npm run db:reset
```

### Quick Checks

```bash
# Count total lines of code
find . -name '*.ts' -o -name '*.tsx' | xargs wc -l

# Find TODO comments
grep -r "TODO" --include="*.ts" --include="*.tsx"

# Check for console.log statements
grep -r "console.log" --include="*.ts" --include="*.tsx"

# List all test files
find . -name "*.test.ts" -o -name "*.test.tsx"
```

---

## Documentation

### Key Files to Update

After completing a feature:

1. **CURRENT.md** - Mark feature complete, add details
2. **Roadmap checklists** - Check off completed tasks
3. **[FEATURE]_COMPLETE.md** - Create completion summary
4. **README.md** - Update if major feature

### Documentation Standards

- Use Markdown for all docs
- Keep line length under 100 characters
- Use code blocks with language specifiers
- Include examples for complex concepts
- Update table of contents when adding sections

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Integration Patterns](./integration-patterns.md) | [Next: Cleanup Tracking →](./cleanup-tracking.md)
