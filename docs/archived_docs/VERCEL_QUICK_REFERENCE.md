# Vercel Polling Quick Reference

## 🚀 Quick Deploy (3 Commands)

```bash
# 1. Set up environment variables
./scripts/setup-vercel-env.sh

# 2. Deploy to production
vercel --prod

# 3. Test the endpoint
./scripts/test-vercel-cron.sh
```

---

## 📋 Deployment Checklist

- [x] Cron endpoint exists (`/app/api/cron/telemetry-poll/route.ts`)
- [x] Polling service implemented (`/lib/tagoio/polling-service.ts`)
- [x] Vercel config with cron schedule (`vercel.json`)
- [x] Production CRON_SECRET generated
- [ ] Environment variables set in Vercel
- [ ] Production deployment completed
- [ ] Manual test passed (200 OK)
- [ ] Automated cron running (check logs)
- [ ] Data appearing in database

---

## 🔑 Critical Environment Variables

```bash
# Authentication
CRON_SECRET=a190070be723571af295c460516c2a39236b2b70c27c426946a62fa58b7064e0

# US Region
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://srrrfkgbcrgtplpekwji.supabase.co

# Canada Region  
CAN_SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_CAN_SUPABASE_URL=https://eilgxbhyoufoforxuyek.supabase.co
```

---

## 🧪 Manual Test Commands

```bash
# Test endpoint (replace URL)
curl -X GET "https://trazo-mvp-v1.vercel.app/api/cron/telemetry-poll" \
  -H "Authorization: Bearer a190070be723571af295c460516c2a39236b2b70c27c426946a62fa58b7064e0"

# Expected: 200 OK with JSON summary
```

---

## 📊 Monitor Deployment

```bash
# View live logs
vercel logs --follow

# View last 5 minutes
vercel logs --since 5m

# Dashboard
open https://vercel.com/trazo-os/trazo-mvp-v1/logs
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify CRON_SECRET in Vercel |
| 500 Error | Check SUPABASE_SERVICE_ROLE_KEY |
| No data | Verify TagoIO tokens in database |
| Cron not running | Ensure deployed with `--prod` flag |

---

## 📚 Full Documentation

See [VERCEL_POLLING_DEPLOYMENT.md](./VERCEL_POLLING_DEPLOYMENT.md) for complete guide.

---

## 🎯 Architecture

```
Vercel Cron (every minute)
  ↓
/api/cron/telemetry-poll
  ↓
TagoIO Polling Service
  ↓
Supabase Database
  ↓
Dashboard Auto-Refresh
```

**Schedule:** `* * * * *` = Every minute  
**Cost:** ~2,592 invocations/month (1.44/day)

---

## ⚡ Quick Commands

```bash
# Deploy
vercel --prod

# View env vars
vercel env ls

# Update env var
vercel env rm CRON_SECRET production
vercel env add CRON_SECRET production

# Test locally
npm run poll:user:watch agam@trazo.ag
```

---

**Status:** ✅ Ready for deployment  
**Last Updated:** October 30, 2025
