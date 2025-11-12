# Migration Application Guide

**Quick reference for applying security migrations to Supabase**

---

## Prerequisites

- [x] All 4 migration files created
- [x] Migrations reviewed and tested locally
- [x] Supabase MCP servers configured (US & Canada)
- [x] Backup plan in place (Supabase has automatic backups)

---

## Migration Order

**MUST apply in this order:**

1. `001-fix-telemetry-aggregates-rls.sql` (CRITICAL)
2. `002-fix-inventory-views-security-definer.sql` (CRITICAL)
3. `003-fix-function-search-path.sql` (HIGH)
4. `004-optimize-rls-auth-uid.sql` (HIGH)

---

## Application Method

### Option 1: Via Supabase Dashboard (Recommended for First Time)

1. Go to https://supabase.com/dashboard
2. Select US project (srrrfkgbcrgtplpekwji)
3. Navigate to SQL Editor
4. Create new query
5. Copy/paste migration file contents
6. Run query
7. Verify no errors
8. Check verification queries at bottom of file
9. Repeat for all 4 migrations
10. Repeat entire process for Canada project (eilgxbhyoufoforxuyek)

### Option 2: Via Supabase MCP (Programmatic)

```typescript
// US Region
await mcp_supabase_mcp__execute_sql({
  query: fs.readFileSync('lib/supabase/migrations/001-fix-telemetry-aggregates-rls.sql', 'utf8')
})

// Verify
await mcp_supabase_mcp__get_advisors({ type: 'security' })

// Canada Region
await mcp_supabase_mcp_2_execute_sql({
  query: fs.readFileSync('lib/supabase/migrations/001-fix-telemetry-aggregates-rls.sql', 'utf8')
})
```

### Option 3: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to US project
supabase link --project-ref srrrfkgbcrgtplpekwji

# Run migration
supabase db execute --file lib/supabase/migrations/001-fix-telemetry-aggregates-rls.sql

# Link to Canada project
supabase link --project-ref eilgxbhyoufoforxuyek

# Run migration
supabase db execute --file lib/supabase/migrations/001-fix-telemetry-aggregates-rls.sql
```

---

## Verification Checklist

After each migration:

### Migration 001 Verification
```sql
-- Should return 8 policies
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('telemetry_readings_hourly', 'telemetry_readings_daily');

-- Should return 8
```

### Migration 002 Verification
```sql
-- Views should exist and be queryable
SELECT COUNT(*) FROM inventory_stock_balances;

-- Service role should get NULL (expected)
-- Regular user should only see their org's data
```

### Migration 003 Verification
```sql
-- Should return 13+ functions with search_path set
SELECT proname, proconfig 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proconfig IS NOT NULL
  AND array_to_string(proconfig, ',') LIKE '%search_path%'
ORDER BY proname;
```

### Migration 004 Verification
```sql
-- Should return empty set (all auth.uid() wrapped)
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND NOT qual LIKE '%(SELECT auth.uid())%';
```

---

## Post-Migration Testing

### Run Existing Tests
```bash
npm run test
# Expect: 164/173 passing (same as before)
```

### Test Queries
```bash
# Telemetry queries
npm run test -- lib/supabase/queries/__tests__/telemetry.test.ts

# Inventory queries  
npm run test -- lib/supabase/queries/__tests__/inventory.test.ts

# RBAC
npm run test -- lib/rbac/__tests__
```

### Manual Testing
```typescript
// Test as different users/roles
// 1. org_admin should see all org data
// 2. site_manager should see assigned sites only
// 3. operator should have limited access
// 4. Cross-org access should be blocked
```

---

## Rollback Instructions

**⚠️ Only rollback if migrations cause breaking issues**

### Quick Rollback (via Dashboard)

1. Go to Supabase Dashboard
2. SQL Editor
3. Run rollback commands (see SECURITY_AUDIT_SUMMARY.md)
4. Verify application functionality

### Migration 001 Rollback
```sql
DROP POLICY IF EXISTS "Users can view hourly telemetry for their organization" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "Service can create hourly telemetry aggregates" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "Users cannot update hourly telemetry" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "Org admins can delete hourly telemetry" ON telemetry_readings_hourly;

DROP POLICY IF EXISTS "Users can view daily telemetry for their organization" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "Service can create daily telemetry aggregates" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "Users cannot update daily telemetry" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "Org admins can delete daily telemetry" ON telemetry_readings_daily;
```

### Migration 002 Rollback
```sql
-- Restore SECURITY DEFINER to views
-- (See migration file for full view definitions)
DROP VIEW IF EXISTS inventory_stock_balances;
CREATE VIEW inventory_stock_balances
WITH (security_invoker = false)
AS
SELECT ... -- Original definition without org-scoping
;
```

### Migration 003 Rollback
```sql
ALTER FUNCTION activate_recipe(...) RESET search_path;
ALTER FUNCTION deactivate_recipe(...) RESET search_path;
ALTER FUNCTION auto_expire_overrides() RESET search_path;
-- ... (all 13 functions)
```

### Migration 004 Rollback
```sql
-- Restore original policies (see rls-policies.sql)
DROP POLICY "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid() AND ...);
-- ... (all 6 policies)
```

---

## Monitoring

### After Migration (24 hours)

Monitor for:
- [ ] No RLS policy violation errors in logs
- [ ] Query performance improvement (should be 10-20x faster)
- [ ] No cross-org data leakage
- [ ] All features working as expected

### Security Advisor Check
```typescript
// Should show only info-level issues
await mcp_supabase_mcp__get_advisors({ type: 'security' })
```

Expected results:
- ✅ telemetry_readings_hourly: Has policies
- ✅ telemetry_readings_daily: Has policies  
- ✅ Functions: search_path set
- ℹ️ Only low-priority issues remain

---

## Support

If issues arise:
1. Check Supabase Dashboard → Logs
2. Run verification queries from migration files
3. Check application logs for RLS violations
4. Rollback specific migration if needed
5. Document issue and re-test fix

---

## Timeline

**Recommended schedule:**

- **Day 1 Morning:** Apply migrations to US region
- **Day 1 Afternoon:** Test and monitor US region
- **Day 2 Morning:** Apply migrations to Canada region  
- **Day 2 Afternoon:** Test and monitor Canada region
- **Week 1:** Monitor performance and security metrics
- **Week 2:** Apply performance optimizations (FK indexes)

---

**Last Updated:** November 12, 2025  
**Migration Count:** 4 files, ~950 lines SQL  
**Estimated Downtime:** None (all migrations are non-breaking)
