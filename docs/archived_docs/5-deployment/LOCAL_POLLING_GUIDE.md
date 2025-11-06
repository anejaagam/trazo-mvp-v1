# Local Polling & Real-Time Dashboard

## Quick Start Guide

### Step 1: Start Development Server

```bash
npm run dev
```

Your app runs at `http://localhost:3000`

### Step 2: Start Polling (in separate terminal)

**Option A: Continuous Polling (Recommended)**
```bash
npm run poll:user:watch agam@trazo.ag
```

This will poll TagoIO every 60 seconds and insert data into Supabase.

**Option B: Manual Single Poll**
```bash
npm run poll:user agam@trazo.ag
```

Run this whenever you want to fetch fresh data.

### Step 3: View Live Data

Navigate to: `http://localhost:3000/dashboard/monitoring`

The dashboard **auto-refreshes every 30 seconds** to show the latest telemetry data.

---

## How It Works

```
┌─────────────────────┐
│  Polling Script     │  npm run poll:user:watch
│  (Terminal 2)       │  ↓ Every 60s
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Supabase Database  │  telemetry_readings table
│  (Cloud)            │
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Next.js Dashboard  │  Auto-refresh every 30s
│  (Terminal 1)       │  http://localhost:3000/dashboard/monitoring
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Browser            │  Live charts & metrics
└─────────────────────┘
```

### Data Flow

1. **Polling script** fetches data from TagoIO API using device tokens
2. **Transforms** TagoIO format to TRAZO format
3. **Inserts** into `telemetry_readings` table in Supabase
4. **Dashboard** queries latest readings every 30 seconds
5. **Charts** update automatically with new data

---

## Viewing Different Time Ranges

The monitoring dashboard has a time range selector:
- **1h** - Last hour
- **6h** - Last 6 hours
- **24h** - Last 24 hours (default)
- **7d** - Last 7 days
- **Custom** - Pick your own range

---

## Testing the Setup

### 1. Add Device Tokens (First Time Only)

Navigate to: `http://localhost:3000/dashboard/admin/api-tokens`

1. Select a pod from the dropdown
2. Enter the TagoIO device token
3. Click "Validate Token" → "Save Token"

### 2. Start Polling

```bash
# Terminal 2
npm run poll:user:watch agam@trazo.ag
```

You should see output like:
```
[2025-10-30T07:27:46.472Z] 🚀 Starting TagoIO telemetry poll...
[2025-10-30T07:27:47.100Z] ✅ Poll complete: 3/3 pods, 245 readings inserted in 758ms
```

### 3. View Data in Dashboard

Open `http://localhost:3000/dashboard/monitoring` and you'll see:
- **Live metrics**: Temperature, humidity, CO₂, VPD
- **Pod status cards**: Health indicators for each pod
- **Time-series charts**: Historical trends
- **Alarm summary**: Active warnings/alerts

**The page auto-refreshes every 30 seconds** - you don't need to manually reload!

---

## Monitoring Multiple Views

### Fleet View (All Pods)
`/dashboard/monitoring` - See all pods at once

### Individual Pod
`/dashboard/monitoring/[pod-id]` - Detailed view for one pod

### Pod Detail Features:
- Real-time sensor readings
- Historical charts (temp, humidity, CO₂, VPD)
- Device status (GCU, sensors, actuators)
- Quick actions (calibrate, maintenance mode)

---

## Troubleshooting

### "No data available"

**Check polling is running:**
```bash
# Should show continuous output
npm run poll:user:watch agam@trazo.ag
```

**Check pods have device tokens:**
```bash
# Look for "No pods with device tokens found"
# If yes, add tokens via /dashboard/admin/api-tokens
```

**Check database has data:**
Navigate to Supabase dashboard → Table Editor → `telemetry_readings`

### "Auto-refresh not working"

The dashboard uses `refreshInterval: 30` in the `usePodSnapshots` hook. If data isn't updating:

1. **Hard refresh browser:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Check browser console** for errors
3. **Verify polling script is still running** in Terminal 2

### "Polling script errors"

```bash
# Verify environment variables
grep SUPABASE .env.local

# Should show both US and Canada configs
```

---

## Advanced: Manual Refresh Button

Want to manually trigger a refresh? The dashboard already auto-refreshes, but you can force it by:

1. **Browser refresh**: F5 or Cmd+R
2. **Navigate away and back**: Click another page, then return
3. **Time range change**: Select a different time range in the dropdown

---

## Production Deployment

For production, replace the local polling script with Vercel Cron:

1. Deploy to Vercel
2. Set up cron job at `/api/cron/telemetry-poll`
3. Configure schedule in `vercel.json`
4. Dashboard works the same way (auto-refresh every 30s)

The user-scoped polling logic will be integrated into the cron endpoint.
