# Compliance Engine - Quick Start for Agents

**Status:** ✅ Ready for Implementation  
**Phase:** 14 (Post Batch & Task Management)  
**Duration:** 5 weeks (can be parallelized)

---

## 🚀 START HERE

You are about to implement the Compliance Engine for TRAZO. This integrates with Metrc (state cannabis tracking) and sets up placeholders for CTLS (Canada) and PrimusGFS (Produce).

### **📋 Step 1: Read the Agent Prompt**

The complete implementation guide is here:
**[COMPLIANCE_ENGINE_AGENT_PROMPT.md](../../COMPLIANCE_ENGINE_AGENT_PROMPT.md)**

This contains:
- All 5 phases with deliverables
- Code patterns to follow
- Testing requirements
- Documentation requirements
- Progress tracking
- Success criteria

### **📚 Step 2: Review Planning Documents**

Before coding, read these 3 documents (30-45 minutes):

1. **[Compliance Implementation Plan](./COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md)** (15 min)
   - Technical architecture
   - Database schema
   - 5-phase roadmap

2. **[Metrc API Alignment Guide](../reference/METRC_API_ALIGNMENT.md)** (15 min)
   - Data model mapping
   - API endpoints
   - Authentication details

3. **[Compliance Engine Summary](./COMPLIANCE_ENGINE_SUMMARY.md)** (10 min)
   - Business value
   - ROI analysis
   - Workflow examples

### **🎯 Step 3: Choose Your Phase**

Pick any phase to work on (multiple agents can work simultaneously):

| Phase | Duration | Can Start If... |
|-------|----------|-----------------|
| **Phase 1: Foundation** | Week 1 | Always - start here if beginning fresh |
| **Phase 2: Read Operations** | Week 2 | Phase 1 complete |
| **Phase 3: Write Operations** | Week 3 | Phase 2 complete |
| **Phase 4: Reporting** | Week 4 | Phases 1-3 complete |
| **Phase 5: Polish** | Week 5 | Phases 1-4 complete |

### **✅ Step 4: Update Progress Tracking**

Before you start coding:
1. Open the [Agent Prompt](../../COMPLIANCE_ENGINE_AGENT_PROMPT.md)
2. Find the "Progress Tracking" section
3. Mark your chosen phase as ⏳ (in progress)
4. Update checklist items as you complete them

### **🧪 Step 5: Follow the Patterns**

The agent prompt includes critical patterns for:
- RBAC protection (all routes must check permissions)
- Jurisdiction-aware logic (check jurisdiction before Metrc operations)
- Database query patterns (follow existing style)
- Error handling (use proper error classes)
- Testing patterns (>95% coverage required)

### **📝 Step 6: Document as You Go**

Documentation is NOT optional. Each phase has required documentation updates listed in the agent prompt.

---

## 🔑 Key Files to Create

### Phase 1: Foundation
```
lib/compliance/
├── metrc/
│   ├── client.ts          ⭐ START HERE
│   ├── auth.ts
│   ├── config.ts
│   ├── errors.ts
│   └── types.ts
supabase/migrations/
└── YYYYMMDDHHMMSS_compliance_engine.sql
app/dashboard/admin/compliance/keys/
└── page.tsx
```

### Phase 2: Read Operations
```
lib/compliance/metrc/
├── endpoints/
│   ├── facilities.ts
│   ├── packages.ts
│   ├── plants.ts
│   └── ... (7 total)
├── sync/
│   ├── scheduler.ts
│   ├── packages-sync.ts
│   └── ... (4 total)
app/dashboard/compliance/sync/
└── page.tsx
```

### Phase 3: Write Operations
```
lib/compliance/metrc/
├── validation/
│   ├── package-rules.ts
│   ├── plant-rules.ts
│   └── ... (5 total)
components/features/compliance/
├── metrc-package-creator.tsx
├── metrc-tag-assigner.tsx
└── ... (5 total)
```

### Phase 4: Reporting
```
lib/compliance/services/
├── report-generator.ts
├── reconciliation.ts
├── evidence-service.ts
└── audit-trail.ts
app/dashboard/compliance/
├── page.tsx              # Main dashboard
├── reports/
├── evidence/
└── audit/
```

### Phase 5: Polish
```
lib/compliance/
├── ctls/ (placeholder)
├── primus-gfs/ (placeholder)
└── services/
    └── compliance-orchestrator.ts
__tests__/ (comprehensive coverage)
docs/current/ (complete documentation)
```

---

## 🚨 Critical Requirements

### Must-Haves
- ✅ RBAC protection on ALL routes
- ✅ Jurisdiction checks before Metrc operations
- ✅ >95% test coverage
- ✅ 0 TypeScript errors
- ✅ Documentation updated per phase
- ✅ RLS policies on all tables

### Must-Avoids
- ❌ Don't skip tests ("I'll add them later")
- ❌ Don't skip documentation ("I'll document it later")
- ❌ Don't hardcode API keys (always use encrypted storage)
- ❌ Don't bypass RBAC checks
- ❌ Don't leave placeholder TODOs in production code

---

## 🧪 Testing Commands

```bash
# Run tests for your phase
npm test -- compliance

# Check coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Check TypeScript
npm run typecheck

# Build check
npm run build
```

**Before marking your phase complete:**
- All tests passing
- Coverage >95%
- 0 TypeScript errors
- Build succeeds

---

## 📊 Success Metrics

Your implementation is successful when:

1. **Functional:** Metrc API client works, sync runs, reports generate
2. **Quality:** >95% test coverage, 0 TS errors, 0 critical warnings
3. **Performance:** Sync <5min for 1000 packages, API <2s response
4. **Security:** Keys encrypted, RLS enforced, audit trail complete
5. **Documentation:** All docs complete, roadmap updated

---

## 🆘 Need Help?

**If you get stuck:**
1. Check the main [Agent Prompt](../../COMPLIANCE_ENGINE_AGENT_PROMPT.md) - it has detailed examples
2. Look at existing features (inventory, monitoring) for patterns
3. Search the codebase for similar functionality
4. Document the blocker in the agent prompt
5. Move to a different phase if possible

**Key Resources:**
- [TRAZO Coding Patterns](../../.github/copilot-instructions.md)
- [Integration Patterns](../integration-deployment/integration-patterns.md)
- [Existing Query Patterns](../../lib/supabase/queries/)
- [UI Components](../../components/ui/) - 47+ ready to use

---

## 🎯 Your Mission

Build a compliance engine that:
- Saves operators 10-20 hours/month per site
- Prevents compliance violations
- Provides complete audit trails
- Integrates seamlessly with TRAZO
- Is ready for multi-jurisdiction expansion

**Let's make cannabis compliance effortless! 🚀**

---

**Next Step:** Open the [full agent prompt](../../COMPLIANCE_ENGINE_AGENT_PROMPT.md) and start Phase 1!
