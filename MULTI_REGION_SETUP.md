# Multi-Regional Setup Guide

This guide explains how to set up the multi-regional Supabase configuration for Trazo OS.

## Quick Start (Development)

For local development, you only need the US region configured:

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Add your US Supabase credentials to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-us-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-us-anon-key
```

3. Restart your dev server:
```bash
npm run dev
```

**Note:** If Canada environment variables are not set, the system will automatically fallback to US configuration. You'll see a warning in the console, but the app will work fine.

## Production Setup (True Multi-Region)

For production with separate US and Canada data storage:

### Step 1: Create Two Supabase Projects

1. **US Region Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project
   - Select **US East (N. Virginia)** or **US West** region
   - Note down the project URL and anon key

2. **Canada Region Project**
   - Create another new project
   - Select **Canada (Central)** region
   - Note down the project URL and anon key

### Step 2: Configure Environment Variables

Add both configurations to your `.env.local`:

```bash
# US Region (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-us-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-us-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-us-service-role-key

# Canada Region (for true multi-region)
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=https://your-canada-project.supabase.co
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=your-canada-anon-key
CAN_SUPABASE_SERVICE_ROLE_KEY=your-canada-service-role-key
```

### Step 3: Set Up Database Schema

You need to set up the same database schema in both projects:

1. Go to each Supabase project's SQL Editor
2. Run the same SQL migrations in both projects
3. Ensure both databases have identical table structures

### Step 4: Configure Authentication

In each Supabase project:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/confirm`
   - `https://yourdomain.com/auth/callback`
4. Enable **Email** provider in Authentication settings

### Step 5: Test Both Regions

1. Restart your application
2. Sign up with US region selected
3. Verify the account is created in US Supabase project
4. Sign up with Canada region selected
5. Verify the account is created in Canada Supabase project

## How It Works

### Region Selection Flow

1. **During Sign-Up:**
   - User selects their region (US or Canada)
   - Region is stored in localStorage and cookie
   - Account is created in the selected region's Supabase project

2. **During Login:**
   - System checks stored region
   - If login fails, tries both regions
   - Stores the correct region for future requests

3. **During Requests:**
   - Middleware reads region from cookie
   - Creates Supabase client for that region
   - Falls back to US if region config is missing

### Environment Variable Naming Convention

| Region | URL Variable | Anon Key Variable |
|--------|-------------|-------------------|
| US (default) | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Canada | `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` | `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` |

### Fallback Behavior

If Canada environment variables are not set:
- ⚠️ Warning logged to console
- ✅ System uses US configuration instead
- ✅ App continues to work normally
- ℹ️ All users effectively use US region

## Troubleshooting

### Error: "Your project's URL and Key are required"

**Cause:** Environment variables are not set or not loaded properly.

**Solution:**
1. Check that `.env.local` file exists
2. Verify variables are named correctly (check for typos)
3. Restart your dev server: `npm run dev`
4. For Vercel/production: Set environment variables in the dashboard

### Warning: "Canada region config not found"

**This is expected in development!** The system will use US config as fallback.

To enable true multi-region:
1. Create a Canada Supabase project
2. Add `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` and `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` to `.env.local`
3. Restart your server

### Users in wrong region

If a user signed up in one region but is being authenticated in another:

1. Check the `user_region` cookie value
2. Verify the user exists in the expected Supabase project
3. The login form automatically tries both regions
4. Clear browser cookies and localStorage to reset

## Deployment

### Vercel

1. Go to Project Settings → Environment Variables
2. Add all required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` (if using multi-region)
   - `CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY` (if using multi-region)
3. Redeploy the application

### Other Platforms

Ensure environment variables are available at build time and runtime:
- Variables starting with `NEXT_PUBLIC_` must be available at build time
- They are embedded in the client-side JavaScript bundle
- Changes require a rebuild

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different keys for dev/prod** - Don't reuse production keys in development
3. **Rotate keys regularly** - Especially service role keys
4. **Limit service role key usage** - Only use in server-side code
5. **Enable RLS policies** - Protect your data in Supabase

## Cost Considerations

Running two Supabase projects:
- 2x Free tier projects = Still free (with limitations)
- 2x Pro tier projects = Double the cost
- Consider your data residency requirements vs. cost

## Testing

Run tests to verify region configuration:
```bash
npm test
```

All tests should pass, validating:
- ✅ Region configuration fallback
- ✅ Client storage utilities
- ✅ Type definitions

## Need Help?

Check the main README.md for more information or review the following files:
- `lib/supabase/region.ts` - Region configuration logic
- `lib/supabase/client.ts` - Client-side utilities
- `lib/supabase/middleware.ts` - Authentication middleware
