# Compliance Engine Setup Guide

**Status:** Phase 1 Complete ✅
**Last Updated:** November 17, 2025

---

## Overview

The TRAZO Compliance Engine integrates with state-mandated cannabis tracking systems (Metrc) to ensure regulatory compliance for your cultivation operations. This guide covers initial setup and configuration.

---

## Prerequisites

Before setting up the Compliance Engine, ensure you have:

1. **Metrc Vendor API Key** - Obtained through Metrc vendor registration
2. **Metrc User API Key** - Unique per facility, obtained by facility operators through Metrc
3. **Facility License Number** - Your state-issued cannabis facility license
4. **Admin or Owner Role** - Only admins and owners can configure API keys

---

## Metrc Sandbox vs Production

Metrc provides both sandbox and production environments:

### Sandbox Environment (Recommended for Testing)

- **Purpose:** Safe testing without affecting live compliance data
- **Benefits:**
  - No risk to real compliance records
  - Faster iteration during development
  - Staff training without regulatory consequences
  - Clear visual distinctions from production

### Requesting Sandbox Access

1. Contact Metrc support for your state
2. Request sandbox API access
3. Use endpoint: `POST /sandbox/v2/integrator/setup?userKey=<optional>`
4. Receive sandbox credentials via email
5. Store with `is_sandbox=true` flag in TRAZO

### Environment Configuration

```bash
# .env.local (Development)
NEXT_PUBLIC_METRC_USE_SANDBOX=true

# .env.production
NEXT_PUBLIC_METRC_USE_SANDBOX=false
```

---

## Supported States

The Compliance Engine currently supports the following states:

- **Oregon (OR)** - `api-or.metrc.com`
- **Maryland (MD)** - `api-md.metrc.com`
- **California (CA)** - `api-ca.metrc.com`
- **Colorado (CO)** - `api-co.metrc.com`
- **Michigan (MI)** - `api-mi.metrc.com`
- **Nevada (NV)** - `api-nv.metrc.com`
- **Alaska (AK)** - `api-ak.metrc.com`
- **Massachusetts (MA)** - `api-ma.metrc.com`
- **Oklahoma (OK)** - `api-ok.metrc.com`

---

## Adding Metrc API Keys

### Step 1: Navigate to Compliance Settings

1. Log in to TRAZO as an admin or owner
2. Navigate to **Dashboard → Admin → Compliance**
3. Click **"Add API Key"**

### Step 2: Enter Credentials

Fill in the following information:

1. **Site** - Select the facility/site for these credentials
2. **State** - Select your state (e.g., Oregon, Maryland)
3. **Facility License Number** - Your state-issued license number (e.g., `123-ABC`)
4. **Vendor API Key** - Your Metrc vendor key
5. **User API Key** - Your facility-specific user key
6. **Sandbox Mode** - Toggle ON for testing, OFF for production

### Step 3: Validate and Save

1. Click **"Add API Key"**
2. TRAZO will validate credentials with Metrc
3. If validation succeeds, credentials are saved securely
4. If validation fails, check your keys and try again

---

## Managing API Keys

### Viewing Existing Keys

- All configured API keys are displayed on the Compliance page
- Keys show:
  - Site name
  - License number
  - State
  - Sandbox/Production status
  - Active/Inactive status
  - Created and last updated dates

### Editing API Keys

1. Click the **Edit** button next to a key
2. Update the necessary fields
3. Click **"Update API Key"**
4. Credentials will be re-validated

### Deactivating API Keys

1. Click the **Delete** button next to a key
2. Confirm deactivation
3. The key will be marked as inactive (soft delete)

**Note:** Only one active API key is allowed per site. Adding a new key automatically deactivates the previous one.

---

## Security Best Practices

### API Key Storage

- API keys are stored encrypted in the database
- Keys are never exposed in client-side code
- Only admins and owners can view/manage keys
- All key access is logged for audit purposes

### Access Control

- API key management requires admin or owner role
- Row Level Security (RLS) policies enforce organization-level isolation
- Users can only access keys for their organization's sites

### Key Rotation

Periodically rotate your Metrc API keys:

1. Obtain new keys from Metrc
2. Add new keys in TRAZO
3. Test to ensure they work
4. Old keys are automatically deactivated

---

## Troubleshooting

### Invalid Credentials Error

**Problem:** "Invalid Metrc API credentials" error when saving

**Solutions:**
- Verify vendor API key is correct
- Verify user API key is correct
- Ensure you're using sandbox keys with sandbox mode enabled
- Ensure you're using production keys with sandbox mode disabled
- Check that the state code matches your facility's state

### Connection Timeout

**Problem:** Request times out when validating credentials

**Solutions:**
- Check your internet connection
- Verify Metrc service status
- Try again after a few minutes
- Contact Metrc support if issue persists

### Wrong State Selected

**Problem:** Credentials valid but wrong state selected

**Solution:**
- Edit the API key
- Select the correct state
- Save and re-validate

---

## Next Steps

After configuring your API keys:

1. **Phase 2:** Set up automated sync schedules
2. **Phase 3:** Configure data push for inventory operations
3. **Phase 4:** Generate compliance reports
4. **Phase 5:** Set up audit trail and evidence vault

---

## Support

For assistance with compliance setup:

- **TRAZO Support:** Review the [Compliance Workflows Guide](./compliance-workflows.md)
- **Metrc Support:** Contact your state's Metrc support team
- **Documentation:** See [Metrc API Alignment Guide](../roadmap/reference/METRC_API_ALIGNMENT.md)

---

**Status:** ✅ Phase 1 Complete - API Key Management Operational
