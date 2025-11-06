# Environment Variables Setup

## Quick Fix for "URL and Key required" Error

If you're seeing the error about missing Supabase URL and Key, follow these steps:

### Option 1: Development Mode (Recommended)

For development, you only need US region configured. Canada will automatically fallback to US.

1. Make sure you have a `.env.local` file in the project root
2. Add your US Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-us-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-us-anon-key
```

3. Restart your dev server:
```bash
npm run dev
```

**Note:** You'll see a warning "⚠️ Canada region config not found, falling back to US config" - this is normal and expected in development!

### Option 2: Full Multi-Region Setup

For production with separate US and Canada databases:

1. Create two Supabase projects (one in US, one in Canada)
2. Add both configurations to `.env.local`:

```bash
# US Region (Required)
NEXT_PUBLIC_SUPABASE_URL=your-us-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-us-anon-key

# Canada Region (Optional, for true multi-region)
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=your-canada-supabase-url
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=your-canada-anon-key
```

3. Restart your dev server

## How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

### Error persists after setting variables

1. Check that your `.env.local` file is in the project root (same level as `package.json`)
2. Verify there are no typos in variable names
3. Make sure there are no spaces around the `=` sign
4. Restart your dev server (Ctrl+C then `npm run dev`)

### Canada region showing warning

This is **expected behavior** if you haven't set up Canada-specific environment variables. The system will automatically use US configuration for all users, which is perfect for development.

## Need More Help?

Check the `MULTI_REGION_SETUP.md` file for detailed multi-region configuration instructions.
