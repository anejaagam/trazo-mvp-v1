# Recipe Stage Advancement - Deployment Guide

**Created**: November 14, 2025  
**Status**: Ready for Production  
**Feature**: Automated hourly recipe stage advancement via Vercel cron

---

## Overview

The recipe stage advancement system runs every hour (`10 * * * *`) to:
1. Update `current_stage_day` counters based on elapsed time
2. Automatically advance activations when stage duration is complete
3. Log all transitions to `audit_log` for compliance tracking

---

## Step 1: Configure Environment Variables

### 1.1 Generate CRON_SECRET

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Bash/Git Bash:**
```bash
openssl rand -base64 32
```

**Save this secret** - you'll need it for Vercel and local testing.

---

### 1.2 Add to Vercel (Option A: CLI - Recommended)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Link your project (run from project root)
cd D:\TrazoMVP\trazo-mvp-v1
vercel link

# Add environment variables
vercel env add CRON_SECRET
# When prompted:
# - Paste your generated secret
# - Select: Production, Preview (not Development)
# - This allows cron to run in both production and preview deploys

vercel env add SUPABASE_URL
# Value: https://srrrfkgbcrgtplpekwji.supabase.co
# Select: Production, Preview, Development (all environments)

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Value: [Get from Supabase Dashboard → Settings → API → service_role key]
# ⚠️ IMPORTANT: Select "Production" ONLY
# ⚠️ NEVER expose service role key in preview/development branches
```

---

### 1.3 Add to Vercel (Option B: Dashboard)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add three variables:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `CRON_SECRET` | [your generated secret] | Production, Preview |
| `SUPABASE_URL` | `https://srrrfkgbcrgtplpekwji.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | [from Supabase] | **Production ONLY** ⚠️ |

**Security Note**: The service role key has admin access to your database. Only expose it to production deployments.

---

### 1.4 Update Local Environment

Add to your local `.env.local`:

```bash
CRON_SECRET=your-generated-secret-here
```

Do NOT add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` - you'll use the anon key locally.

---

## Step 2: Deploy to Vercel

```powershell
# Commit your changes
git add .
git commit -m "feat: Add automated recipe stage advancement cron"

# Push to trigger deployment
git push origin main
```

**Wait for deployment** to complete (~2-3 minutes).

Verify deployment:
```powershell
vercel ls
```

---

## Step 3: Manual Testing

### 3.1 Test Locally (Before Production)

```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test endpoint
$CRON_SECRET = (Select-String -Path .env.local -Pattern "CRON_SECRET=(.+)").Matches.Groups[1].Value

$headers = @{
    "Authorization" = "Bearer $CRON_SECRET"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/cron/advance-recipes" -Headers $headers -Method GET | ConvertTo-Json -Depth 5
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-14T10:10:00.000Z",
  "processed": 0,
  "dayIncrements": 0,
  "stagesAdvanced": 0,
  "activationsCompleted": 0,
  "errors": []
}
```

*(Count will be 0 if you have no active recipe activations yet)*

---

### 3.2 Test Production Endpoint

```powershell
# Get your production URL (e.g., trazo-mvp.vercel.app)
$PROD_URL = "https://your-project.vercel.app"
$CRON_SECRET = "your-secret-from-step-1"

$headers = @{
    "Authorization" = "Bearer $CRON_SECRET"
}

Invoke-RestMethod -Uri "$PROD_URL/api/cron/advance-recipes" -Headers $headers -Method GET | ConvertTo-Json -Depth 5
```

**Check for errors:**
- `401 Unauthorized` → Check `CRON_SECRET` matches Vercel environment variable
- `500 Internal Server Error` → Check Vercel logs or Supabase credentials

---

### 3.3 Verify Audit Logs in Supabase

After triggering the cron, check for audit entries:

```sql
-- Run in Supabase SQL Editor
SELECT 
  timestamp,
  action,
  entity_name,
  old_values->>'stage_name' as previous_stage,
  new_values->>'stage_name' as new_stage,
  old_values->>'scope_name' as affected_scope,
  new_values->>'status' as completion_status
FROM audit_log
WHERE action IN ('recipe.stage.advanced', 'recipe.activation.completed')
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 20;
```

**What to look for:**
- `recipe.stage.advanced` entries when stages complete their duration
- `recipe.activation.completed` entries when final stage finishes
- `user_id` should be `NULL` (automated by cron, not user-initiated)
- `old_values` and `new_values` should contain stage transition details

---

## Step 4: Monitor Cron Execution

### 4.1 View Cron Logs in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Deployments** → [Latest Production Deployment]
4. Click **Functions** tab
5. Find `/api/cron/advance-recipes`
6. Click to view execution logs

**What to check:**
- Executions happen every hour at :10 minutes
- Response status is `200 OK`
- `processed`, `dayIncrements`, `stagesAdvanced` counts match expectations
- No errors in `errors` array

---

### 4.2 Check Database State

```sql
-- View active recipe activations
SELECT 
  ra.id,
  ra.scope_name,
  r.name as recipe_name,
  rs.name as current_stage,
  ra.current_stage_day,
  rs.duration_days,
  ra.stage_started_at,
  EXTRACT(DAY FROM NOW() - ra.stage_started_at) as days_elapsed
FROM recipe_activations ra
JOIN recipes r ON ra.recipe_id = r.id
JOIN recipe_stages rs ON ra.current_stage_id = rs.id
WHERE ra.is_active = true
ORDER BY ra.updated_at DESC;
```

**Verify:**
- `current_stage_day` matches elapsed time since `stage_started_at`
- Activations advance when `days_elapsed > duration_days`

---

## Step 5: Integration Tests (When Staging Data Ready)

### 5.1 Set Up Test Environment Variables

Create `.env.test.local`:

```bash
SUPABASE_URL=https://srrrfkgbcrgtplpekwji.supabase.co
SUPABASE_ANON_KEY=your-anon-key
TEST_ORG_ID=your-test-org-uuid
TEST_USER_ID=your-test-user-uuid
TEST_POD_ID=your-test-pod-uuid
RUN_INTEGRATION_TESTS=true
```

---

### 5.2 Run Integration Tests

```powershell
# Run integration tests
npm test -- recipes.integration.test.ts

# Or run all tests
npm test
```

**Test Coverage Goals:**
- ✅ Recipe creation → version creation → activation
- ✅ Manual stage advancement via `advanceRecipeStage()`
- ✅ Automated advancement via cron service
- ✅ Activation completion on final stage
- ✅ Audit log entries created for all transitions

---

### 5.3 Create Test Recipe Activations

Use the Recipes UI or seed script:

```sql
-- Create a test activation (expires in 2 hours for quick testing)
-- Run in Supabase SQL Editor after replacing UUIDs

INSERT INTO recipe_activations (
  recipe_id,
  recipe_version_id,
  scope_type,
  scope_id,
  scope_name,
  activated_by,
  activated_at,
  stage_started_at,
  current_stage_id,
  current_stage_day,
  is_active
) VALUES (
  'your-recipe-uuid',
  'your-version-uuid',
  'pod',
  'your-pod-uuid',
  'Test Pod',
  'your-user-uuid',
  NOW() - INTERVAL '1 day',  -- Started 1 day ago
  NOW() - INTERVAL '1 day',  -- Stage started 1 day ago
  'first-stage-uuid',
  1,
  true
);
```

Then **wait 1 hour** and check if:
- `current_stage_day` increments to 2
- Stage advances if duration was 1 day

---

## Troubleshooting

### Problem: Cron returns 401 Unauthorized

**Solution:**
1. Check `CRON_SECRET` in Vercel matches your request header
2. Verify environment variable is set for "Production" environment
3. Redeploy after changing environment variables

---

### Problem: Cron returns 500 Internal Server Error

**Check:**
1. Vercel function logs for error details
2. `SUPABASE_URL` is correct (should end in `.supabase.co`)
3. `SUPABASE_SERVICE_ROLE_KEY` is the **service role key**, not anon key
4. Key is set for "Production" environment only

**View logs:**
```powershell
vercel logs your-project-url.vercel.app
```

---

### Problem: Stages not advancing

**Check:**
1. Are there active recipe activations?
   ```sql
   SELECT COUNT(*) FROM recipe_activations WHERE is_active = true;
   ```

2. Is `stage_started_at` set correctly?
   ```sql
   SELECT id, stage_started_at, current_stage_day 
   FROM recipe_activations 
   WHERE is_active = true;
   ```

3. Is elapsed time > stage duration?
   ```sql
   SELECT 
     ra.id,
     rs.duration_days,
     EXTRACT(DAY FROM NOW() - ra.stage_started_at) as days_elapsed
   FROM recipe_activations ra
   JOIN recipe_stages rs ON ra.current_stage_id = rs.id
   WHERE ra.is_active = true;
   ```

---

### Problem: Audit logs not appearing

**Check:**
1. Does the organization have an `organization_id`?
2. Is `audit_log` table accessible by service role?
3. Check for insert errors in Vercel logs

**Manual test:**
```sql
-- Insert test audit log entry
INSERT INTO audit_log (
  organization_id,
  user_id,
  action,
  entity_type,
  entity_id,
  timestamp
) VALUES (
  'your-org-uuid',
  NULL,
  'recipe.stage.advanced',
  'recipe',
  'test-recipe-uuid',
  NOW()
);
```

---

## Production Checklist

Before going live:

- [ ] Environment variables set in Vercel Production
- [ ] CRON_SECRET is strong (32+ random bytes)
- [ ] SUPABASE_SERVICE_ROLE_KEY only in Production environment
- [ ] Manual test completed successfully
- [ ] Audit log entries verified in Supabase
- [ ] Vercel cron schedule confirmed (`10 * * * *`)
- [ ] Integration tests passing (when staging ready)
- [ ] Monitoring alerts configured (optional)

---

## Related Files

- **Cron Handler**: `app/api/cron/advance-recipes/route.ts`
- **Service Logic**: `lib/recipes/stage-advancement-service.ts`
- **Unit Tests**: `lib/recipes/__tests__/stage-advancement-service.test.ts`
- **Integration Tests**: `lib/supabase/queries/__tests__/recipes.integration.test.ts`
- **Cron Config**: `vercel.json`
- **Documentation**: `app/api/cron/README.md`

---

## Next Steps After Deployment

1. **Monitor first 24 hours** of cron executions
2. **Review audit logs** for unexpected patterns
3. **Set up alerts** for cron failures (Vercel integrations or custom monitoring)
4. **Create dashboard widget** to display active recipe progress
5. **Add manual "Advance Stage" button** in UI for growers to skip ahead if needed

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Review Supabase logs (Dashboard → Logs)
3. Run manual test locally first
4. Verify environment variables are set correctly
5. Check database permissions (RLS policies)
