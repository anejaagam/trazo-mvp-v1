npm run poll:user:watch agam@trazo.ag
# TagoIO Polling for TRAZO MVP

User-scoped polling for multi-tenant telemetry collection.

## Quick Start

### 1. Create Your First Pod

1. Navigate to `/dashboard/admin/api-tokens`
2. Click "Create New Pod"
3. Enter pod name (e.g., "Cultivation Pod A")
4. Get device token from TagoIO (Devices → Select Device → Tokens tab)
5. Paste token and click "Test Connection"
6. Click "Save"

### 2. Run Polling

```bash
# Poll once for your organization
npm run poll:user your-email@example.com

# Continuous polling (every 60 seconds)
npm run poll:user:watch your-email@example.com
```

Press `Ctrl+C` to stop continuous polling.

## How It Works

**Multi-Region Awareness:**
1. Script finds your user in US or Canada database
2. Identifies your organization and region
3. Polls only pods in your organization's sites
4. Uses the correct regional Supabase instance
5. Stores telemetry data in your region

**Simplified Pod Creation:**
- No need to manage rooms or sites manually
- Pods are automatically assigned to a default room
- Default room is auto-created per site
- Focus on just pod names and device tokens

### Output Example
```
🎯 Organization-Scoped TagoIO Polling Service
────────────────────────────────────────────────────────────────────────────────
🔍 Searching for user: agam@trazo.ag
   ✅ Found user in US region
👤 User: agam@trazo.ag
🏢 Organization: Infinity Greens and Produce Ltd
🌍 Region: US
🔑 Role: org_admin
────────────────────────────────────────────────────────────────────────────────
✅ Poll complete: 3/3 pods, 245 readings inserted in 758ms
```

## Requirements

### Environment Variables (in `.env.local`)

**For User-Scoped Polling (both regions):**
- `NEXT_PUBLIC_SUPABASE_URL` - US Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - US service role key
- `NEXT_PUBLIC_CAN_SUPABASE_URL` - Canada Supabase URL
- `CAN_SUPABASE_SERVICE_ROLE_KEY` - Canada service role key

**For Global Polling (US only):**
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Pod Configuration
- Pods must have `tagoio_device_token` set in the database
- Navigate to `/dashboard/admin/api-tokens` to add device tokens
- Each pod needs its own TagoIO device token

## Output

The script provides colorized console output:
- 🎯 Service started
- 🚀 Poll starting
- ✅ Successful polls (green)
- ⚠️  Warnings (yellow)
- ❌ Errors (red)
- 📊 Device details

Example output:
```
[2025-10-30T07:15:42.330Z] 🎯 TagoIO Polling Service Started
[2025-10-30T07:15:42.330Z] 📡 Poll interval: 60 seconds
[2025-10-30T07:15:42.330Z] 🚀 Starting TagoIO telemetry poll...
[2025-10-30T07:15:43.100Z] ✅ Poll complete: 3/3 pods, 245 readings inserted in 758ms
[2025-10-30T07:15:43.100Z] 📊 Device details:
   ✓ Pod A: 82 readings (164 data points received)
   ✓ Pod B: 81 readings (162 data points received)
   ✓ Pod C: 82 readings (164 data points received)
```

## Configuration

Edit `scripts/poll-user-org.ts` to change:
- `POLL_INTERVAL_MS`: Polling frequency (default: 60 seconds)
- Logging verbosity
- Error handling

## How It Works

**Multi-Region Architecture:**
1. Loads environment variables for both US and Canada regions
2. Searches both databases for user by email
3. Creates appropriate regional Supabase client (service role)
4. Queries for active pods in user's organization sites only
5. For each pod:
   - Fetches data from TagoIO API using the pod's device token
   - Transforms data to TRAZO telemetry format
   - Inserts readings into regional `telemetry_readings` table
6. Logs summary with device-level details
7. In watch mode, repeats after interval

**Auto-Provisioning:**
- Default site created if none exists for organization
- Default room ("Main Cultivation Area") auto-created per site
- Pods assigned to default room automatically

## Troubleshooting

### "No pods found for this organization"
1. Navigate to `/dashboard/admin/api-tokens`
2. Click "Create New Pod"
3. Enter pod name and device token
4. Pod will be auto-assigned to default room

### "User not found in any region"
- Check email spelling
- Ensure user exists in database
- Run `npm run seed:dev` to create test users

### "Missing Supabase credentials"
- Verify `.env.local` has all required variables:
  - `NEXT_PUBLIC_SUPABASE_URL` (US)
  - `SUPABASE_SERVICE_ROLE_KEY` (US)
  - `NEXT_PUBLIC_CAN_SUPABASE_URL` (Canada)
  - `CAN_SUPABASE_SERVICE_ROLE_KEY` (Canada)

### Module/Import Errors
- Run `npm install` if packages are missing
- Ensure `tsconfig-paths` is installed
- Check `scripts/tsconfig.json` has correct path mappings

## Viewing Telemetry Data

After polling:
1. Log in to `/dashboard` with your user credentials
2. Navigate to monitoring/telemetry section
3. Dashboard auto-refreshes every 30 seconds
4. View real-time device data from your pods

## For Production

This script is designed for MVP/local testing. For production:
- Deploy to serverless function (AWS Lambda, Cloud Run, etc.)
- Use Vercel Cron for scheduled execution
- Add monitoring/alerting (Sentry, Datadog, etc.)
- Configure appropriate polling intervals per customer
- Set up error notifications and retry logic
