# Monitoring & Telemetry - Quick Reference

**Last Updated:** October 29, 2025  
**Purpose:** Fast lookup for common monitoring integration tasks  
**Multi-Region Status:** ✅ US & Canada SYNCHRONIZED

---

## 🚀 Quick Start

```bash
# 1. Review the plan
cat MONITORING_TELEMETRY_INTEGRATION_PLAN.md

# 2. Check current state
cat MONITORING_DATABASE_ANALYSIS.md

# 3. Start Phase 1
mkdir -p types
code types/telemetry.ts
```

---

## 📁 Key Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| **MONITORING_TELEMETRY_INTEGRATION_PLAN.md** | Complete technical plan | Developers |
| **MONITORING_INTEGRATION_SUMMARY.md** | Executive overview | Managers |
| **MONITORING_DATABASE_ANALYSIS.md** | Schema & architecture | Backend devs |
| **MONITORING_AGENT_HANDOFF.md** | Implementation handoff | Team lead |

---

## 📋 Phase Checklist

- [ ] **Phase 1**: Types (4h) → `/types/telemetry.ts`
- [ ] **Phase 2**: Queries (12h) → `/lib/supabase/queries/`
- [ ] **Phase 3**: Hooks (6h) → `/hooks/use-telemetry.ts`
- [ ] **Phase 4**: Components (18h) → `/components/features/monitoring/`
- [ ] **Phase 5**: Pages (6h) → `/app/dashboard/monitoring/`
- [ ] **Phase 6**: TagoIO (18h) → `/lib/tagoio/` ⚠️ CRITICAL
- [ ] **Phase 7**: Testing (8h) → `__tests__/`

**Total**: 72 hours (~3 weeks)

---

## 🔑 Critical Info

### Database Tables
```sql
telemetry_readings      -- Time-series data (28 columns)
device_status          -- Device health tracking
alarms                 -- Alarm instances
alarm_policies         -- Threshold rules
alarm_routes           -- Notification routing
notifications          -- Delivery tracking
```

### Key Fields
```typescript
pods.tagoio_device_id           // Device mapping (BLOCKER if NULL)
telemetry_readings.raw_data     // JSONB debug storage
telemetry_readings.data_source  // tagoio|manual|calculated|simulated
```

### Permissions
```typescript
'monitoring:view'               // View dashboard
'monitoring:export'             // Export data
'monitoring:manual_entry'       // Add manual readings (NEW)
'monitoring:acknowledge_alarm'  // Acknowledge alarms (NEW)
```

---

## 🎯 Common Commands

### Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Typecheck
npm run typecheck

# Check RLS policies
grep -A 20 "telemetry_readings" lib/supabase/rls-policies.sql
```

### Database Queries
```typescript
// Get latest reading
const { data } = await supabase
  .from('telemetry_readings')
  .select('*')
  .eq('pod_id', podId)
  .order('timestamp', { ascending: false })
  .limit(1)
  .single()

// Subscribe to updates
const channel = supabase
  .channel(`telemetry:${podId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'telemetry_readings',
    filter: `pod_id=eq.${podId}`
  }, callback)
  .subscribe()
```

### Testing TagoIO
```bash
# Test API connection
node scripts/test-tagoio-api.ts

# Transform sample data
node scripts/test-transformer.ts

# Run polling service once
curl -X GET http://localhost:3000/api/cron/telemetry-poll \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🚨 Troubleshooting

### No data showing
1. Check `pods.tagoio_device_id` is populated
2. Verify TagoIO credentials
3. Check polling service is running
4. Look for errors in logs

### RLS errors
1. Ensure user is authenticated
2. Verify org_id matches
3. Check `user_organization_id()` function

### Real-time not working
1. Verify subscription is active
2. Check channel name matches
3. Ensure cleanup on unmount
4. Test with direct INSERT

---

## 📞 Who to Ask

- **Architecture**: MONITORING_DATABASE_ANALYSIS.md
- **Implementation**: MONITORING_TELEMETRY_INTEGRATION_PLAN.md
- **TagoIO**: TAGOIO_API_ANALYSIS.md (create in Phase 6)
- **Patterns**: AGENT_INSTRUCTIONS.md, Inventory implementation

---

## ✅ Pre-Flight Checklist

Before starting implementation:
- [ ] Team reviewed plan
- [ ] TagoIO credentials obtained
- [ ] Test devices identified
- [ ] Dev environment ready (`NEXT_PUBLIC_DEV_MODE=true`)
- [ ] Database schema verified (US & Canada)
- [ ] Prototype components reviewed

---

## 🎯 Success Metrics

- **Test Coverage**: >90%
- **Performance**: <100ms query response
- **Reliability**: 99.9% uptime for polling
- **Accuracy**: 100% data transformation correctness
- **User Satisfaction**: <5s to see latest reading

---

**Quick Links**:
- [Full Plan](MONITORING_TELEMETRY_INTEGRATION_PLAN.md)
- [Database Analysis](MONITORING_DATABASE_ANALYSIS.md)
- [Agent Handoff](MONITORING_AGENT_HANDOFF.md)
- [NextSteps.md](NextSteps.md)
