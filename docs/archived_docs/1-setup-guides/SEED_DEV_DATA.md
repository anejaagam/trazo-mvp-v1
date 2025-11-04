# How to Seed Dev Mode Data

## Quick Fix

You need to seed the dev organization, site, and user records into the database so foreign keys work.

## Option 1: Via Supabase Dashboard (EASIEST)

1. **Open Supabase Dashboard:**
   - US Region: https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji
   
2. **Go to SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Paste and Run:**
   - Copy **ALL** contents from `/lib/supabase/dev-seed.sql`
   - Paste into SQL editor
   - Click "Run" or press `Ctrl+Enter`
   - ⚠️ **Important:** Must run from Supabase Dashboard (has admin access to `auth.users`)

4. **Verify Results:**
   - You should see 3 rows returned showing:
     - Dev Organization: Development Farm
     - Dev Site: Main Facility
     - Dev User: Dev User

5. **Dev User Login Credentials** (if you need to test real auth later):
   - Email: `dev@trazo.ag`
   - Password: `devpassword123`

## Option 2: Via Supabase CLI

```powershell
# If you have Supabase CLI installed
supabase db push --file lib/supabase/dev-seed.sql
```

## Option 3: Via pgAdmin or DBeaver

1. Connect to your Supabase database
2. Open a new SQL query window
3. Paste contents of `/lib/supabase/dev-seed.sql`
4. Execute

## After Seeding

1. **Restart dev server:**
   ```powershell
   npm run dev
   ```

2. **Test inventory creation:**
   - Go to http://localhost:3000/dashboard/inventory
   - Click "Add Item"
   - Fill form and submit
   - Should work now! ✅

## What Gets Seeded

The SQL script inserts (in order):

1. **Auth User** (in `auth.users` table)
   - ID: `00000000-0000-0000-0000-000000000001`
   - Email: dev@trazo.ag
   - Password: devpassword123
   - Status: Confirmed

2. **Organization** (`00000000-0000-0000-0000-000000000010`)
   - Name: "Development Farm"
   - Jurisdiction: Maryland Cannabis
   - Region: US

3. **Site** (`00000000-0000-0000-0000-000000000020`)
   - Name: "Main Facility"
   - Organization: Dev org

4. **User Profile** (in `public.users` table)
   - Links to auth.users record
   - Email: dev@trazo.ag
   - Name: "Dev User"
   - Role: org_admin
   - Organization: Dev org

5. **User Site Assignment**
   - Links dev user to dev site

## Important Notes

- ✅ Script uses `ON CONFLICT ... DO UPDATE` so it's safe to run multiple times
- ✅ These are special dev UUIDs (all zeros with endings 01, 10, 20)
- ✅ Only needed for dev mode - production users will sign up normally
- ⚠️ RLS policies don't apply because we're using service role key in dev API

## Troubleshooting

### Error: "permission denied for schema auth"
**Solution:** You MUST use Supabase Dashboard SQL Editor - it has service role access. pgAdmin/DBeaver won't work for `auth.users` table.

### Error: "function gen_salt does not exist"
**Solution:** The pgcrypto extension might not be enabled. Add this at the top of the script:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: Still getting foreign key error after seeding
**Solution:** 
1. Verify data was inserted:
   ```sql
   SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
   SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000010';
   SELECT * FROM sites WHERE id = '00000000-0000-0000-0000-000000000020';
   SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
   ```
2. Check you're connected to the correct database (US region)

### Error: "duplicate key value violates unique constraint"
**Solution:** Data already exists! Skip the auth.users INSERT or use the ON CONFLICT clause. Try creating an inventory item again.

---

**Next Step:** Run the SQL seed script via Supabase Dashboard, then test inventory creation!
