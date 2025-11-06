# TRAZO API Documentation

**Version:** 0.8.0  
**Base URL:** `https://your-domain.com/api`  
**Authentication:** Supabase Auth (JWT tokens)

---

## Table of Contents
- [Authentication](#authentication)
- [Inventory API](#inventory-api)
- [Monitoring API](#monitoring-api)
- [Admin API](#admin-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication via Supabase Auth JWT tokens.

### Headers
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Getting a Token
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

### Multi-Region Support
- **US Region:** Default endpoint
- **Canada Region:** Automatically routed based on user's organization region

---

## Inventory API

### List Items
**Endpoint:** `GET /api/inventory/items`

**Query Parameters:**
- `site_id` (required) - Filter by site ID
- `category` (optional) - Filter by category
- `search` (optional) - Search by name/SKU
- `status` (optional) - `active` | `inactive` | `all`

**Response:**
```json
{
  "data": [
    {
      "id": "item-123",
      "site_id": "site-456",
      "name": "CO2 Tank - 50lb",
      "sku": "CO2-50LB-001",
      "category": "Equipment",
      "unit_of_measure": "tank",
      "current_stock": 5,
      "min_quantity": 2,
      "max_quantity": 10,
      "storage_location": "Main Storage",
      "supplier": "AirGas",
      "cost_per_unit": 45.00,
      "is_active": true,
      "created_at": "2025-10-27T10:00:00Z",
      "updated_at": "2025-10-27T10:00:00Z"
    }
  ],
  "error": null
}
```

**Permissions Required:** `inventory:view`

---

### Create Item
**Endpoint:** `POST /api/inventory/items`

**Request Body:**
```json
{
  "site_id": "site-456",
  "name": "CO2 Tank - 50lb",
  "sku": "CO2-50LB-001",
  "category": "Equipment",
  "unit_of_measure": "tank",
  "min_quantity": 2,
  "max_quantity": 10,
  "storage_location": "Main Storage",
  "supplier": "AirGas",
  "cost_per_unit": 45.00
}
```

**Response:**
```json
{
  "data": {
    "id": "item-123",
    "site_id": "site-456",
    "name": "CO2 Tank - 50lb",
    // ... full item object
  },
  "error": null
}
```

**Permissions Required:** `inventory:create`

---

### Update Item
**Endpoint:** `PATCH /api/inventory/items/[id]`

**Request Body:**
```json
{
  "name": "CO2 Tank - 50lb (Updated)",
  "min_quantity": 3,
  "cost_per_unit": 48.00
}
```

**Response:**
```json
{
  "data": {
    "id": "item-123",
    "name": "CO2 Tank - 50lb (Updated)",
    // ... updated item object
  },
  "error": null
}
```

**Permissions Required:** `inventory:update`

---

### Delete Item
**Endpoint:** `DELETE /api/inventory/items/[id]`

**Response:**
```json
{
  "data": {
    "id": "item-123",
    "is_active": false
  },
  "error": null
}
```

**Note:** Soft delete - sets `is_active` to `false`

**Permissions Required:** `inventory:delete`

---

## Monitoring API

### Get Telemetry
**Endpoint:** `GET /api/monitoring/telemetry`

**Query Parameters:**
- `pod_id` (required) - Pod identifier
- `start_time` (optional) - ISO timestamp
- `end_time` (optional) - ISO timestamp
- `limit` (optional) - Max results (default: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "reading-123",
      "pod_id": "pod-456",
      "device_id": "tagoio-device-789",
      "timestamp": "2025-11-04T10:00:00Z",
      "temperature_f": 72.5,
      "humidity": 65.0,
      "co2_ppm": 1200,
      "vpd": 1.2,
      "light_intensity": 800
    }
  ],
  "error": null
}
```

**Permissions Required:** `monitoring:view`

---

### Get Pod Status
**Endpoint:** `GET /api/monitoring/pods/[id]`

**Response:**
```json
{
  "data": {
    "id": "pod-456",
    "name": "Alpha-1",
    "site_id": "site-789",
    "room_id": "room-101",
    "status": "active",
    "device_id": "tagoio-device-789",
    "current_conditions": {
      "temperature_f": 72.5,
      "humidity": 65.0,
      "co2_ppm": 1200,
      "vpd": 1.2,
      "last_reading": "2025-11-04T10:00:00Z"
    },
    "alarms": []
  },
  "error": null
}
```

**Permissions Required:** `monitoring:view`

---

### Validate TagoIO Token
**Endpoint:** `POST /api/validate-tagoio`

**Request Body:**
```json
{
  "token": "your-tagoio-device-token"
}
```

**Response:**
```json
{
  "valid": true,
  "device": {
    "id": "device-789",
    "name": "Alpha-1 Sensor",
    "last_input": "2025-11-04T10:00:00Z"
  }
}
```

**Permissions Required:** `admin:manage_integrations`

---

## Admin API

### List Users
**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `org_id` (required) - Organization ID
- `role` (optional) - Filter by role
- `status` (optional) - `active` | `inactive` | `pending`

**Response:**
```json
{
  "data": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "org_admin",
      "org_id": "org-456",
      "status": "active",
      "created_at": "2025-09-01T10:00:00Z"
    }
  ],
  "error": null
}
```

**Permissions Required:** `admin:view_users`

---

### Invite User
**Endpoint:** `POST /api/admin/users/invite`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "grower",
  "site_ids": ["site-789"]
}
```

**Response:**
```json
{
  "data": {
    "invitation_id": "invite-123",
    "email": "newuser@example.com",
    "expires_at": "2025-11-11T10:00:00Z"
  },
  "error": null
}
```

**Permissions Required:** `admin:invite_users`

---

### Update User Role
**Endpoint:** `PATCH /api/admin/users/[id]/role`

**Request Body:**
```json
{
  "role": "head_grower"
}
```

**Response:**
```json
{
  "data": {
    "id": "user-123",
    "role": "head_grower",
    "updated_at": "2025-11-04T10:00:00Z"
  },
  "error": null
}
```

**Permissions Required:** `admin:manage_roles`

---

## Error Handling

### Error Response Format
```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to perform this action",
    "details": {
      "required_permission": "inventory:create",
      "user_role": "viewer"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate SKU, etc.) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | Invalid or expired token |
| `UNAUTHORIZED` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE` | Resource already exists |
| `RATE_LIMIT` | Too many requests |
| `SERVER_ERROR` | Internal server error |

---

## Rate Limiting

### Limits
- **Anonymous:** 10 requests per minute
- **Authenticated:** 100 requests per minute
- **Admin:** 500 requests per minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699023600
```

### Rate Limit Response
```json
{
  "data": null,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "error": null
}
```

---

## Webhooks (Coming Soon)

Future support for:
- Inventory low stock alerts
- Environmental alarm notifications
- Batch stage transitions
- Compliance report generation

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { createClient } from '@/lib/supabase/client'

async function getInventoryItems(siteId: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`/api/inventory/items?site_id=${siteId}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.json()
}
```

### cURL
```bash
curl -X GET \
  'https://your-domain.com/api/inventory/items?site_id=site-123' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

---

## Support

- **Documentation:** See `/docs/` directory
- **Issues:** GitHub Issues
- **Integration Questions:** See `CONTRIBUTING.md`

**Last Updated:** November 4, 2025
