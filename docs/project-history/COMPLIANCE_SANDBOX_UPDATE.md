# Metrc Sandbox Integration Update

**Date:** November 17, 2025  
**Status:** ✅ Documentation Updated

---

## 🎯 What Changed

All compliance engine documentation has been updated to include **Metrc Sandbox Environment** support for faster, safer testing and development.

---

## 🏖️ Metrc Sandbox Overview

### What is the Metrc Sandbox?

Metrc provides a **sandbox environment** that mirrors production functionality but operates in complete isolation:

- **Zero risk** to live compliance data
- **Identical API** to production (same endpoints, responses, behavior)
- **Safe training** environment for staff learning
- **Visual indicators** to prevent confusion with production
- **Faster iteration** without regulatory consequences

### Key Benefits

1. **Development Safety**: Test integrations without risking compliance violations
2. **Faster Testing**: No need to worry about regulatory reporting during development
3. **Staff Training**: Operators can learn workflows risk-free
4. **Parallel Environments**: Run sandbox and production simultaneously

---

## 🔧 Technical Implementation

### 1. Sandbox Base URLs

**Production URLs:**
```
Oregon:   https://api-or.metrc.com
Maryland: https://api-md.metrc.com
California: https://api-ca.metrc.com
```

**Sandbox URLs:**
```
Oregon:   https://sandbox-api-or.metrc.com
Maryland: https://sandbox-api-md.metrc.com
California: https://sandbox-api-ca.metrc.com
```

### 2. Setup Process

**Endpoint:** `POST /sandbox/v2/integrator/setup?userKey={optional}`

**Parameters:**
- `userKey` (optional): Existing user key to reuse, or omit for new key

**Response Codes:**
- `201`: User queued for creation
- `202`: User creation in process
- `200`: User key sent to email on file
- `204`: User key not found

**Process:**
1. Make POST request to sandbox setup endpoint
2. Receive sandbox API keys via email (separate from production)
3. Store in database with `is_sandbox=true` flag
4. Use sandbox URLs for all API calls

### 3. Database Schema

**Added `is_sandbox` flag to `compliance_api_keys` table:**

```sql
CREATE TABLE compliance_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  vendor_api_key TEXT NOT NULL,
  user_api_key TEXT NOT NULL,
  facility_license_number TEXT NOT NULL,
  state_code TEXT NOT NULL,
  is_sandbox BOOLEAN DEFAULT false,  -- ⭐ NEW: Toggle sandbox/production
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Configuration Code

**Environment Variable:**
```bash
# .env.local (Development)
NEXT_PUBLIC_METRC_USE_SANDBOX=true

# .env.production
NEXT_PUBLIC_METRC_USE_SANDBOX=false
```

**URL Resolution Function:**
```typescript
// lib/compliance/metrc/config.ts
export function getMetrcBaseUrl(state: string, useSandbox?: boolean): string {
  const isSandbox = useSandbox ?? process.env.NEXT_PUBLIC_METRC_USE_SANDBOX === 'true'
  
  if (isSandbox) {
    const sandboxUrls: Record<string, string> = {
      'OR': 'https://sandbox-api-or.metrc.com',
      'MD': 'https://sandbox-api-md.metrc.com',
      'CA': 'https://sandbox-api-ca.metrc.com',
    }
    return sandboxUrls[state] || sandboxUrls['OR']
  }
  
  const productionUrls: Record<string, string> = {
    'OR': 'https://api-or.metrc.com',
    'MD': 'https://api-md.metrc.com',
    'CA': 'https://api-ca.metrc.com',
  }
  return productionUrls[state] || productionUrls['OR']
}
```

**MetrcClient Integration:**
```typescript
export class MetrcClient {
  private baseUrl: string
  private isSandbox: boolean
  
  constructor(config: MetrcConfig) {
    this.isSandbox = config.isSandbox || false
    this.baseUrl = getMetrcBaseUrl(config.state, this.isSandbox)
  }
  
  // ... rest of implementation
}
```

### 5. Admin UI Updates

**API Key Management Page:** `app/dashboard/admin/compliance/keys/page.tsx`

New features:
- Toggle switch for "Sandbox Mode" when adding/editing keys
- Visual indicator (badge) showing sandbox vs production
- Separate validation for sandbox and production credentials
- Warning when switching between environments

**UI Example:**
```tsx
<FormField
  control={form.control}
  name="is_sandbox"
  render={({ field }) => (
    <FormItem className="flex items-center justify-between">
      <div>
        <FormLabel>Sandbox Environment</FormLabel>
        <FormDescription>
          Use Metrc sandbox for testing (recommended for development)
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

---

## 📋 Updated Files

### Core Documentation

1. **COMPLIANCE_ENGINE_AGENT_PROMPT.md**
   - Added Phase 1.2: Sandbox Environment Setup
   - Updated MetrcClient to support sandbox mode
   - Added environment variable configuration
   - Updated acceptance criteria for sandbox support

2. **docs/roadmap/planning-progress/COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md**
   - Added "Sandbox Environment (Recommended for Development)" section
   - Updated database schema with `is_sandbox` flag
   - Added sandbox benefits and setup process

3. **docs/roadmap/reference/METRC_API_ALIGNMENT.md**
   - Added comprehensive sandbox section
   - Documented sandbox setup endpoint
   - Added sandbox base URLs for all states
   - Included environment configuration examples

4. **docs/roadmap/planning-progress/COMPLIANCE_ENGINE_SUMMARY.md**
   - Added "Development & Testing Strategy" section
   - Outlined 3-phase sandbox → production rollout
   - Updated go-live plan to include sandbox testing

---

## 🚀 Recommended Development Workflow

### Phase-by-Phase Approach

**Phase 1-2: Foundation & Read Operations**
- ✅ Use sandbox exclusively
- ✅ Set `NEXT_PUBLIC_METRC_USE_SANDBOX=true`
- ✅ Test all GET endpoints safely
- ✅ Verify data mapping without production risk

**Phase 3: Write Operations**
- ✅ Continue sandbox testing
- ✅ Test POST/PUT operations safely
- ✅ Validate workflows end-to-end
- ✅ Build confidence before production

**Phase 4: Reporting & Compliance**
- ⚠️ Parallel testing: sandbox + limited production
- ⚠️ Select 1-2 pilot sites for production testing
- ⚠️ Keep sandbox as fallback
- ⚠️ Compare sandbox vs production results

**Phase 5: Production Rollout**
- 🚀 Graduate from sandbox to production
- 🚀 Keep sandbox available for training
- 🚀 Use sandbox for new feature testing
- 🚀 Maintain both environments long-term

### Quick Toggle Guide

**Development (Local):**
```bash
# .env.local
NEXT_PUBLIC_METRC_USE_SANDBOX=true
```

**Staging:**
```bash
# .env.staging
NEXT_PUBLIC_METRC_USE_SANDBOX=true  # Still use sandbox
```

**Production:**
```bash
# .env.production
NEXT_PUBLIC_METRC_USE_SANDBOX=false  # Real compliance data
```

---

## ✅ Testing Strategy

### Unit Tests

Test both sandbox and production URL resolution:

```typescript
// lib/compliance/metrc/__tests__/config.test.ts
describe('getMetrcBaseUrl', () => {
  it('returns sandbox URL when useSandbox=true', () => {
    expect(getMetrcBaseUrl('OR', true)).toBe('https://sandbox-api-or.metrc.com')
  })
  
  it('returns production URL when useSandbox=false', () => {
    expect(getMetrcBaseUrl('OR', false)).toBe('https://api-or.metrc.com')
  })
  
  it('respects NEXT_PUBLIC_METRC_USE_SANDBOX env var', () => {
    process.env.NEXT_PUBLIC_METRC_USE_SANDBOX = 'true'
    expect(getMetrcBaseUrl('OR')).toBe('https://sandbox-api-or.metrc.com')
  })
})
```

### Integration Tests

Test client initialization with sandbox mode:

```typescript
// lib/compliance/metrc/__tests__/client.test.ts
describe('MetrcClient', () => {
  it('uses sandbox URL when isSandbox=true', () => {
    const client = new MetrcClient({
      state: 'OR',
      vendorApiKey: 'test',
      userApiKey: 'test',
      isSandbox: true
    })
    expect(client['baseUrl']).toBe('https://sandbox-api-or.metrc.com')
  })
})
```

### E2E Tests

Test full workflow in sandbox:

```typescript
// e2e/compliance-sandbox.spec.ts
test('can manage packages in sandbox environment', async ({ page }) => {
  // Set sandbox mode
  await page.goto('/dashboard/admin/compliance/keys')
  await page.click('text=Add API Key')
  await page.check('[name="is_sandbox"]')
  
  // Verify sandbox indicator
  await expect(page.locator('.badge:has-text("Sandbox")')).toBeVisible()
  
  // Test package sync in sandbox
  await page.goto('/dashboard/compliance/sync')
  await page.click('text=Sync Packages')
  await expect(page.locator('.success-message')).toBeVisible()
})
```

---

## 🎓 Benefits Summary

### For Developers

- ✅ **No regulatory risk** during development
- ✅ **Faster iteration** without production constraints
- ✅ **Parallel environments** for comparison testing
- ✅ **Safe experimentation** with new features

### For QA/Testing

- ✅ **Complete workflow testing** without compliance impact
- ✅ **Reproducible test scenarios** in isolated environment
- ✅ **Training data** that can be reset/recreated
- ✅ **Performance testing** without production load

### For Operations

- ✅ **Staff training** in risk-free environment
- ✅ **Workflow validation** before production rollout
- ✅ **Change testing** for new processes
- ✅ **Incident simulation** for troubleshooting

### For Business

- ✅ **Reduced risk** of compliance violations during implementation
- ✅ **Faster time-to-market** with parallel development/testing
- ✅ **Lower training costs** with sandbox practice environment
- ✅ **Higher confidence** before production launch

---

## 📚 Additional Resources

**Official Metrc Documentation:**
- [Metrc Sandbox Training Environment](https://www.metrc.com/metrc-sandbox-training/)
- [Massachusetts Integration Guide](https://www.metrc.com/integration-and-api/massachusetts-integration-and-api/)
- [D.C. API Integration Guide](https://www.metrc.com/integration-and-api/district-of-columbia-integration-and-api/)

**TRAZO Documentation:**
- [COMPLIANCE_ENGINE_AGENT_PROMPT.md](./COMPLIANCE_ENGINE_AGENT_PROMPT.md) - Complete implementation guide
- [METRC_API_ALIGNMENT.md](./docs/roadmap/reference/METRC_API_ALIGNMENT.md) - API details and data mapping
- [COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md](./docs/roadmap/planning-progress/COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md) - Technical architecture

---

## 🎯 Next Steps for Agents

1. **Review this document** to understand sandbox capabilities
2. **Start Phase 1** with sandbox setup as step 1.2
3. **Set environment variable** `NEXT_PUBLIC_METRC_USE_SANDBOX=true`
4. **Test in sandbox** throughout Phases 1-3
5. **Graduate to production** in Phase 4-5 after validation

**Remember:** Sandbox is not optional—it's the recommended path for all development and testing!

---

**Updated:** November 17, 2025  
**Status:** ✅ Ready for Implementation
