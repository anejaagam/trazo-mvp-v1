# Service Layer & Backend Integration Guide

**Version**: 1.0  
**Last Updated**: November 12, 2025  
**Audience**: Backend Integration Team

---

## Overview

This document provides complete specifications for replacing the prototype's localStorage implementations with production-ready backend services. All service interfaces are **backend-agnostic** and designed for easy swapping between implementations.

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [IBatchService](#ibatchservice)
3. [IQualityService](#iqualityservice)
4. [IComplianceService](#icomplianceservice)
5. [API Endpoint Specifications](#api-endpoint-specifications)
6. [Data Models](#data-models)
7. [Authentication](#authentication)
8. [Error Handling](#error-handling)
9. [Migration Strategy](#migration-strategy)
10. [Testing](#testing)

---

## Service Architecture

### Current (Prototype)

```
┌──────────────────────────┐
│  React Components        │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  useBatches() Hook       │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  IBatchService Interface │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  LocalStorageBatchService│ ← Replace this
└──────────────────────────┘
```

### Target (Production)

```
┌──────────────────────────┐
│  React Components        │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  useBatches() Hook       │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  IBatchService Interface │ ← Interface stays same
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  APIBatchService         │ ← New implementation
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  REST API / GraphQL      │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  Database (PostgreSQL)   │
└──────────────────────────┘
```

---

## IBatchService

### Interface Definition

**Location**: `unified/services/BatchService.ts`

```typescript
export interface IBatchService {
  // Basic CRUD
  getAll(domain: DomainType): Promise<DomainBatch[]>;
  getById(id: string): Promise<DomainBatch | null>;
  create(batch: DomainBatch): Promise<DomainBatch>;
  update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch>;
  delete(id: string): Promise<void>;
  
  // Filtering & Queries
  getByStage(domain: DomainType, stage: string): Promise<DomainBatch[]>;
  getByLocation(locationId: string): Promise<DomainBatch[]>;
  getByCultivar(cultivarId: string): Promise<DomainBatch[]>;
  getByGroup(groupId: string): Promise<DomainBatch[]>;
  
  // Operations
  transitionStage(id: string, newStage: string): Promise<DomainBatch>;
  quarantine(id: string, reason: string, by: string): Promise<DomainBatch>;
  releaseFromQuarantine(id: string, by: string): Promise<DomainBatch>;
}
```

### Implementation Template

```typescript
import { DomainType, DomainBatch } from '../types/domains';

export class APIBatchService implements IBatchService {
  private baseURL: string;
  private getAuthHeaders: () => Record<string, string>;
  
  constructor(baseURL: string, authProvider: AuthProvider) {
    this.baseURL = baseURL;
    this.getAuthHeaders = () => ({
      'Authorization': `Bearer ${authProvider.getToken()}`,
      'Content-Type': 'application/json'
    });
  }
  
  async getAll(domain: DomainType): Promise<DomainBatch[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches?domain=${domain}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batches: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getById(id: string): Promise<DomainBatch | null> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batch: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async create(batch: DomainBatch): Promise<DomainBatch> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(batch)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create batch: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update batch: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async delete(id: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete batch: ${response.statusText}`);
    }
  }
  
  async getByStage(domain: DomainType, stage: string): Promise<DomainBatch[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches?domain=${domain}&stage=${stage}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batches by stage: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getByLocation(locationId: string): Promise<DomainBatch[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches?locationId=${locationId}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batches by location: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getByCultivar(cultivarId: string): Promise<DomainBatch[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches?cultivarId=${cultivarId}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batches by cultivar: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getByGroup(groupId: string): Promise<DomainBatch[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches?groupId=${groupId}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch batches by group: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async transitionStage(id: string, newStage: string): Promise<DomainBatch> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}/transition`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ stage: newStage })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to transition stage: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async quarantine(id: string, reason: string, by: string): Promise<DomainBatch> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}/quarantine`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason, by })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to quarantine batch: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async releaseFromQuarantine(id: string, by: string): Promise<DomainBatch> {
    const response = await fetch(
      `${this.baseURL}/api/v1/batches/${id}/release`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ by })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to release batch: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Factory function update
export function createBatchService(): IBatchService {
  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const authProvider = getAuthProvider();  // Your auth implementation
  
  if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_USE_API) {
    // Keep localStorage for local development
    return new LocalStorageBatchService();
  }
  
  return new APIBatchService(apiURL, authProvider);
}
```

---

## IQualityService

### Interface Definition

**Location**: `unified/services/QualityService.ts`

```typescript
export interface IQualityService {
  // Quality reports
  getReports(batchId: string): Promise<IQualityReport[]>;
  createReport(report: Omit<IQualityReport, 'id' | 'createdAt'>): Promise<IQualityReport>;
  updateReport(id: string, updates: Partial<IQualityReport>): Promise<IQualityReport>;
  
  // Cannabis-specific
  submitTestResults(batchId: string, results: ITestResult): Promise<ITestResult>;
  getTestResults(batchId: string): Promise<ITestResult[]>;
  
  // Produce-specific
  submitGrading(batchId: string, grading: IGradeReport): Promise<IGradeReport>;
  getGrading(batchId: string): Promise<IGradeReport[]>;
  
  submitRipenessCheck(batchId: string, check: IRipenessCheck): Promise<IRipenessCheck>;
  getRipenessHistory(batchId: string): Promise<IRipenessCheck[]>;
}
```

### Key Endpoints

```
GET    /api/v1/quality/reports?batchId={id}
POST   /api/v1/quality/reports
PUT    /api/v1/quality/reports/:id

POST   /api/v1/quality/cannabis/test-results
GET    /api/v1/quality/cannabis/test-results?batchId={id}

POST   /api/v1/quality/produce/grading
GET    /api/v1/quality/produce/grading?batchId={id}

POST   /api/v1/quality/produce/ripeness
GET    /api/v1/quality/produce/ripeness?batchId={id}
```

---

## IComplianceService

### Interface Definition

**Location**: `unified/services/ComplianceService.ts`

```typescript
export interface IComplianceService {
  // Cannabis METRC
  getAvailableTags(domain: 'cannabis'): Promise<string[]>;
  assignTag(batchId: string, tag: string): Promise<void>;
  syncToMetrc(batchId: string): Promise<MetrcSyncResult>;
  
  // Produce Food Safety
  verifyCertification(
    batchId: string,
    certType: 'GAP' | 'Organic' | string
  ): Promise<boolean>;
  
  generateLotNumber(batchId: string): Promise<string>;
  submitTraceability(batchId: string, data: TraceabilityData): Promise<void>;
  
  // Common
  getComplianceStatus(batchId: string): Promise<ComplianceStatus>;
  exportAuditLog(batchId: string, format: 'pdf' | 'csv'): Promise<Blob>;
}

export interface MetrcSyncResult {
  success: boolean;
  metrcId?: string;
  errors?: string[];
  syncedAt: string;
}

export interface ComplianceStatus {
  compliant: boolean;
  issues: string[];
  lastChecked: string;
}

export interface TraceabilityData {
  origin: string;
  handlers: string[];
  certifications: string[];
  timestamps: Record<string, string>;
}
```

### Key Endpoints

```
# Cannabis METRC
GET    /api/v1/compliance/cannabis/tags/available
POST   /api/v1/compliance/cannabis/tags/assign
POST   /api/v1/compliance/cannabis/metrc/sync

# Produce Food Safety
GET    /api/v1/compliance/produce/certifications/verify
POST   /api/v1/compliance/produce/lot-number/generate
POST   /api/v1/compliance/produce/traceability

# Common
GET    /api/v1/compliance/status/:batchId
GET    /api/v1/compliance/audit-log/:batchId
```

---

## API Endpoint Specifications

### Base URL

```
Production: https://api.trazo.com
Staging:    https://api.staging.trazo.com
Development: http://localhost:3000
```

### Authentication

All requests require Bearer token authentication:

```http
GET /api/v1/batches
Authorization: Bearer {token}
```

### Batch Endpoints

#### GET /api/v1/batches

Get all batches with optional filtering.

**Query Parameters**:
```typescript
{
  domain?: 'cannabis' | 'produce';
  stage?: string;
  status?: 'active' | 'quarantined' | 'completed' | 'closed';
  locationId?: string;
  cultivarId?: string;
  groupId?: string;
  search?: string;  // Search by name
  limit?: number;   // Pagination limit (default: 50, max: 1000)
  offset?: number;  // Pagination offset
}
```

**Response**:
```typescript
{
  data: DomainBatch[];
  total: number;
  limit: number;
  offset: number;
}
```

#### GET /api/v1/batches/:id

Get single batch by ID.

**Response**:
```typescript
DomainBatch | { error: 'Not found' }
```

#### POST /api/v1/batches

Create new batch.

**Request Body**:
```typescript
{
  domainType: 'cannabis' | 'produce';
  name: string;
  cultivarId: string;
  cultivarName: string;
  stage: string;
  plantCount: number;
  startDate: string;  // ISO 8601
  locationIds: string[];
  // ... other fields based on domain
}
```

**Response**:
```typescript
DomainBatch
```

#### PATCH /api/v1/batches/:id

Update existing batch.

**Request Body**:
```typescript
Partial<DomainBatch>
```

**Response**:
```typescript
DomainBatch
```

#### DELETE /api/v1/batches/:id

Delete batch (soft delete recommended).

**Response**:
```http
204 No Content
```

#### POST /api/v1/batches/:id/transition

Transition batch to new stage.

**Request Body**:
```typescript
{
  stage: string;
  notes?: string;
  performedBy?: string;
}
```

**Response**:
```typescript
DomainBatch
```

**Validation**:
- Check stage progression rules
- Verify minimum duration requirements
- Ensure required fields are present

#### POST /api/v1/batches/:id/quarantine

Quarantine a batch.

**Request Body**:
```typescript
{
  reason: string;
  by: string;  // User ID or name
  notes?: string;
}
```

**Response**:
```typescript
DomainBatch with updated quarantineStatus
```

#### POST /api/v1/batches/:id/release

Release batch from quarantine.

**Request Body**:
```typescript
{
  by: string;
  notes?: string;
}
```

**Response**:
```typescript
DomainBatch with updated quarantineStatus
```

---

## Data Models

### Database Schema (PostgreSQL)

#### batches table

```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_type VARCHAR(20) NOT NULL CHECK (domain_type IN ('cannabis', 'produce')),
  name VARCHAR(255) NOT NULL,
  
  -- Cultivar
  cultivar_id UUID NOT NULL REFERENCES cultivars(id),
  cultivar_name VARCHAR(255) NOT NULL,
  
  -- Lifecycle
  stage VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'quarantined', 'completed', 'closed')),
  start_date TIMESTAMP NOT NULL,
  harvest_date TIMESTAMP,
  close_date TIMESTAMP,
  
  -- Quantity
  plant_count INTEGER NOT NULL DEFAULT 0,
  
  -- Quarantine
  quarantine_status VARCHAR(20) NOT NULL DEFAULT 'none' 
    CHECK (quarantine_status IN ('none', 'quarantined', 'released')),
  quarantine_reason TEXT,
  quarantined_at TIMESTAMP,
  quarantined_by VARCHAR(255),
  
  -- Grouping
  group_id UUID REFERENCES batch_groups(id),
  parent_batch_id UUID REFERENCES batches(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_batches_domain ON batches(domain_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_batches_stage ON batches(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_batches_status ON batches(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_batches_cultivar ON batches(cultivar_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_batches_group ON batches(group_id) WHERE deleted_at IS NULL;
```

#### cannabis_batches table (extension)

```sql
CREATE TABLE cannabis_batches (
  batch_id UUID PRIMARY KEY REFERENCES batches(id) ON DELETE CASCADE,
  
  -- METRC
  metrc_package_tag VARCHAR(50) UNIQUE,
  metrc_plant_tags TEXT[],
  
  -- Cultivation
  lighting_schedule VARCHAR(10),
  mother_plant_id UUID REFERENCES cannabis_batches(batch_id),
  clone_source_batch_id UUID REFERENCES batches(id),
  
  -- Testing
  thc_content DECIMAL(5,2),
  cbd_content DECIMAL(5,2),
  terpene_profile TEXT,
  
  -- Processing
  drying_start_date TIMESTAMP,
  drying_end_date TIMESTAMP,
  curing_start_date TIMESTAMP,
  curing_end_date TIMESTAMP,
  packaged_date TIMESTAMP
);
```

#### produce_batches table (extension)

```sql
CREATE TABLE produce_batches (
  batch_id UUID PRIMARY KEY REFERENCES batches(id) ON DELETE CASCADE,
  
  -- Seeding
  seed_lot_number VARCHAR(100),
  seed_supplier VARCHAR(255),
  seeding_date TIMESTAMP,
  
  -- Grading
  grade VARCHAR(20) CHECK (grade IN ('grade_a', 'grade_b', 'grade_c', 'premium', 'processing')),
  graded_at TIMESTAMP,
  graded_by VARCHAR(255),
  ripeness VARCHAR(20) CHECK (ripeness IN ('unripe', 'ripe', 'overripe')),
  
  -- Certifications
  gap_certified BOOLEAN DEFAULT FALSE,
  organic_certified BOOLEAN DEFAULT FALSE,
  certifications TEXT[],
  
  -- Harvest
  harvest_window_start TIMESTAMP,
  harvest_window_end TIMESTAMP,
  
  -- Storage
  storage_temperature DECIMAL(4,1),
  storage_humidity DECIMAL(4,1),
  shelf_life_days INTEGER,
  
  -- Packaging
  lot_number VARCHAR(100),
  packaging_date TIMESTAMP
);
```

#### batch_locations table (many-to-many)

```sql
CREATE TABLE batch_locations (
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),
  moved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  moved_by UUID REFERENCES users(id),
  PRIMARY KEY (batch_id, location_id, moved_at)
);

CREATE INDEX idx_batch_locations_batch ON batch_locations(batch_id);
CREATE INDEX idx_batch_locations_location ON batch_locations(location_id);
```

---

## Authentication

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;  // User ID
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  facilityId: string;
  domains: ('cannabis' | 'produce')[];  // Allowed domains
  exp: number;  // Expiration timestamp
}
```

### AuthProvider Interface

```typescript
export interface AuthProvider {
  getToken(): string | null;
  refreshToken(): Promise<string>;
  login(email: string, password: string): Promise<string>;
  logout(): void;
  getCurrentUser(): Promise<User>;
}
```

### Implementation

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    if (token) {
      // Verify token and load user
      fetchCurrentUser(token).then(setUser);
    }
  }, [token]);
  
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const { token, user } = await response.json();
    setToken(token);
    setUser(user);
    localStorage.setItem('auth_token', token);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };
  
  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Error Handling

### Error Response Format

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### HTTP Status Codes

```
200 OK - Success
201 Created - Resource created
204 No Content - Deletion success
400 Bad Request - Validation error
401 Unauthorized - Missing/invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Duplicate/conflict error
422 Unprocessable Entity - Business rule violation
500 Internal Server Error - Server error
```

### Example Error Responses

**Validation Error** (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid batch data",
    "details": {
      "plantCount": "Must be greater than 0",
      "cultivarId": "Invalid cultivar ID"
    },
    "timestamp": "2025-11-12T20:30:00Z"
  }
}
```

**Business Rule Violation** (422):
```json
{
  "error": {
    "code": "STAGE_TRANSITION_INVALID",
    "message": "Cannot transition from flowering to propagation",
    "details": {
      "currentStage": "flowering",
      "attemptedStage": "propagation",
      "allowedStages": ["harvest"]
    },
    "timestamp": "2025-11-12T20:30:00Z"
  }
}
```

---

## Migration Strategy

### Phase 1: Dual Mode Operation

Run both localStorage and API simultaneously:

```typescript
export class HybridBatchService implements IBatchService {
  private localService: LocalStorageBatchService;
  private apiService: APIBatchService;
  
  async getAll(domain: DomainType): Promise<DomainBatch[]> {
    try {
      // Try API first
      return await this.apiService.getAll(domain);
    } catch (error) {
      // Fallback to localStorage
      console.warn('API unavailable, using localStorage', error);
      return await this.localService.getAll(domain);
    }
  }
  
  async create(batch: DomainBatch): Promise<DomainBatch> {
    // Write to both
    const created = await this.apiService.create(batch);
    await this.localService.create(created);  // Cache locally
    return created;
  }
}
```

### Phase 2: Data Migration

```typescript
async function migrateLocalStorageToAPI() {
  const localService = new LocalStorageBatchService();
  const apiService = new APIBatchService(apiURL, authProvider);
  
  // Migrate cannabis batches
  const cannabisBatches = localService.getAll('cannabis');
  for (const batch of cannabisBatches) {
    await apiService.create(batch);
  }
  
  // Migrate produce batches
  const produceBatches = localService.getAll('produce');
  for (const batch of produceBatches) {
    await apiService.create(batch);
  }
  
  console.log('Migration complete');
}
```

### Phase 3: Remove localStorage

Update factory function:

```typescript
export function createBatchService(): IBatchService {
  return new APIBatchService(
    import.meta.env.VITE_API_URL,
    getAuthProvider()
  );
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { APIBatchService } from './BatchService';

describe('APIBatchService', () => {
  it('should fetch all batches', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })
    );
    
    const service = new APIBatchService('http://test', mockAuthProvider);
    const batches = await service.getAll('cannabis');
    
    expect(batches).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      'http://test/api/v1/batches?domain=cannabis',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Batch API Integration', () => {
  it('should create and retrieve batch', async () => {
    const service = createBatchService();
    
    const newBatch = {
      domainType: 'cannabis',
      name: 'Test Batch',
      cultivarId: 'cult-1',
      cultivarName: 'Blue Dream',
      stage: 'propagation',
      // ...
    };
    
    const created = await service.create(newBatch);
    expect(created.id).toBeDefined();
    
    const retrieved = await service.getById(created.id);
    expect(retrieved).toMatchObject(newBatch);
  });
});
```

---

## Checklist for Backend Team

### Required Endpoints
- [ ] GET /api/v1/batches with filtering
- [ ] GET /api/v1/batches/:id
- [ ] POST /api/v1/batches
- [ ] PATCH /api/v1/batches/:id
- [ ] DELETE /api/v1/batches/:id
- [ ] POST /api/v1/batches/:id/transition
- [ ] POST /api/v1/batches/:id/quarantine
- [ ] POST /api/v1/batches/:id/release

### Database
- [ ] Create batches table
- [ ] Create cannabis_batches extension table
- [ ] Create produce_batches extension table
- [ ] Create batch_locations join table
- [ ] Add indexes for performance
- [ ] Set up soft delete support

### Authentication
- [ ] JWT token generation
- [ ] Token refresh endpoint
- [ ] Role-based access control
- [ ] Facility-based data isolation

### Validation
- [ ] Stage transition rules enforcement
- [ ] Quantity validation (min 0.1g cannabis, 5g produce)
- [ ] Required field validation by stage
- [ ] Quarantine status checks

### Testing
- [ ] Unit tests for all endpoints
- [ ] Integration tests for workflows
- [ ] Load testing (1000+ concurrent users)
- [ ] Edge case testing

---

**Questions?** Contact integration team or see `unified/services/` for current implementations.
