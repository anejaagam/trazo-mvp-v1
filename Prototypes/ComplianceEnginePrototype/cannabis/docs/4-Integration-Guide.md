# Trazo Compliance Engine - Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Backend Architecture](#backend-architecture)
3. [API Endpoints](#api-endpoints)
4. [Metrc Integration](#metrc-integration)
5. [CTLS Integration](#ctls-integration)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Storage](#file-storage)
9. [Deployment](#deployment)

---

## Overview

This guide provides instructions for integrating the Trazo Compliance Engine frontend with backend services, regulatory APIs, and production infrastructure.

### Current State
The frontend is a **standalone React application** with mock data. To deploy to production, you need to implement:

1. **Backend API** - REST or GraphQL endpoints
2. **Database** - PostgreSQL, MySQL, or similar
3. **File Storage** - S3, Azure Blob, or similar for evidence documents
4. **Authentication** - User authentication and session management
5. **Regulatory APIs** - Metrc and CTLS integrations
6. **Scheduled Jobs** - Automated reporting and sync

---

## Backend Architecture

### Recommended Stack

**Option 1: Node.js + Express**
```
Frontend (React) ←→ Express API ←→ PostgreSQL
                        ↓
                   Metrc/CTLS APIs
                        ↓
                   S3 File Storage
```

**Option 2: Python + FastAPI**
```
Frontend (React) ←→ FastAPI ←→ PostgreSQL
                      ↓
                 Metrc/CTLS APIs
                      ↓
                 Azure Blob Storage
```

**Option 3: Supabase (Full-Stack)**
```
Frontend (React) ←→ Supabase (Postgres + Auth + Storage)
                        ↓
                   Edge Functions
                        ↓
                   Metrc/CTLS APIs
```

### Folder Structure (Node.js Example)

```
/backend
├── src/
│   ├── controllers/
│   │   ├── reportsController.ts
│   │   ├── evidenceController.ts
│   │   └── auditController.ts
│   ├── services/
│   │   ├── metrcService.ts
│   │   ├── ctlsService.ts
│   │   └── storageService.ts
│   ├── models/
│   │   ├── ComplianceReport.ts
│   │   ├── EvidenceDocument.ts
│   │   └── AuditEntry.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── reports.ts
│   │   ├── evidence.ts
│   │   └── audit.ts
│   ├── db/
│   │   ├── migrations/
│   │   └── seeds/
│   └── app.ts
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Reports API

**GET /api/reports**
```typescript
// Query params
{
  jurisdiction?: JurisdictionCode;
  status?: ReportStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// Response
{
  reports: ComplianceReport[];
  total: number;
  page: number;
}
```

**POST /api/reports**
```typescript
// Request body
{
  jurisdiction: JurisdictionCode;
  type: ReportType;
  reporting_period: string;
  data: {
    movement?: any[];
    waste?: any[];
    transactions?: any[];
    // ... other data
  };
  linked_evidence: string[];
}

// Response
{
  report: ComplianceReport;
  status: 'created' | 'error';
  errors?: string[];
}
```

**PUT /api/reports/:reportId/submit**
```typescript
// Request body
{
  reviewed_by: string;
  notes?: string;
}

// Response
{
  report: ComplianceReport;
  submission_result: {
    success: boolean;
    confirmation_id?: string;
    errors?: string[];
  };
}
```

**GET /api/reports/:reportId/export**
```typescript
// Response
File download (PDF, CSV, or Excel)
```

### Evidence API

**GET /api/evidence**
```typescript
// Query params
{
  jurisdiction?: JurisdictionCode;
  doc_type?: DocumentType;
  search?: string;
  tags?: string[];
}

// Response
{
  documents: EvidenceDocument[];
  total: number;
}
```

**POST /api/evidence**
```typescript
// Form data (multipart/form-data)
{
  file: File;
  doc_type: DocumentType;
  title: string;
  description?: string;
  jurisdiction: JurisdictionCode;
  retention_policy: RetentionPolicy;
  tags: string[];
}

// Response
{
  document: EvidenceDocument;
  upload_status: 'success' | 'error';
}
```

**GET /api/evidence/:evidenceId/download**
```typescript
// Response
File download with access logging
```

**DELETE /api/evidence/:evidenceId**
```typescript
// Response
{
  success: boolean;
  audit_entry_id: string;
}
```

### Audit API

**GET /api/audit**
```typescript
// Query params (AuditExportFilter)
{
  jurisdiction?: JurisdictionCode[];
  action?: AuditAction[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
}

// Response
{
  entries: AuditEntry[];
  total: number;
}
```

**POST /api/audit/export**
```typescript
// Request body
{
  filters: AuditExportFilter;
  format: ExportFormat;
}

// Response
{
  export_id: string;
  download_url: string;
  expires_at: string;
}
```

### Users API

**GET /api/users**
```typescript
// Response
{
  users: User[];
}
```

**POST /api/users**
```typescript
// Request body
{
  email: string;
  name: string;
  role: UserRole;
  jurisdictions: JurisdictionCode[];
}

// Response
{
  user: User;
  invite_sent: boolean;
}
```

---

## Metrc Integration

### API Overview

**Base URL**: 
- Production: `https://api-[state].metrc.com`
- Sandbox: `https://sandbox-api-[state].metrc.com`

**Authentication**: API Key (License Number + User Key)

### Key Endpoints

**1. Get Packages (Inventory)**
```typescript
GET /packages/v1/active
Headers: {
  'Authorization': 'Basic ' + base64(licenseNumber + ':' + apiKey)
}

Response: Package[]
```

**2. Create Plant Batch**
```typescript
POST /plantbatches/v1/createplantings
Body: {
  Name: string;
  Type: string;
  Count: number;
  Strain: string;
  Location: string;
  PatientLicenseNumber?: string;
  ActualDate: string;
}
```

**3. Record Harvest**
```typescript
POST /harvests/v1/create/packages
Body: {
  Plant: string;
  Weight: number;
  UnitOfWeight: string;
  DryingLocation: string;
  HarvestName: string;
  ActualDate: string;
}
```

**4. Record Waste**
```typescript
POST /packages/v1/adjust
Body: {
  Label: string;
  Quantity: number;
  UnitOfMeasure: string;
  AdjustmentReason: string;
  AdjustmentDate: string;
  ReasonNote: string;
}
```

### Integration Service (Node.js)

```typescript
// services/metrcService.ts
import axios from 'axios';

export class MetrcService {
  private baseUrl: string;
  private apiKey: string;
  private licenseNumber: string;

  constructor(jurisdiction: 'OR' | 'MD') {
    this.baseUrl = `https://api-${jurisdiction.toLowerCase()}.metrc.com`;
    this.apiKey = process.env[`METRC_${jurisdiction}_API_KEY`]!;
    this.licenseNumber = process.env[`METRC_${jurisdiction}_LICENSE`]!;
  }

  private getAuthHeader() {
    const credentials = `${this.licenseNumber}:${this.apiKey}`;
    return 'Basic ' + Buffer.from(credentials).toString('base64');
  }

  async getPackages(): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/packages/v1/active`, {
      headers: { 'Authorization': this.getAuthHeader() }
    });
    return response.data;
  }

  async submitReport(reportData: any): Promise<any> {
    // Format data according to Metrc API requirements
    const formatted = this.formatReportData(reportData);
    
    // Submit to Metrc
    const response = await axios.post(
      `${this.baseUrl}/packages/v1/create`,
      formatted,
      { headers: { 'Authorization': this.getAuthHeader() } }
    );
    
    return response.data;
  }

  async reconcileData(): Promise<MetrcReconciliation> {
    // Fetch Metrc data
    const metrcPackages = await this.getPackages();
    
    // Compare with local database
    const localPackages = await db.packages.findAll();
    
    // Calculate discrepancies
    const discrepancies = this.findDiscrepancies(metrcPackages, localPackages);
    
    return {
      reconciliation_id: generateId(),
      jurisdiction: 'OR',
      date: new Date().toISOString(),
      movement_matches: metrcPackages.length - discrepancies.length,
      movement_discrepancies: discrepancies.length,
      status: discrepancies.length === 0 ? 'pass' : 'fail',
      issues: discrepancies.map(d => d.description),
    };
  }
}
```

### Environment Variables

```bash
# .env
METRC_OR_LICENSE=123-ABC-456
METRC_OR_API_KEY=your_oregon_api_key

METRC_MD_LICENSE=456-DEF-789
METRC_MD_API_KEY=your_maryland_api_key
```

---

## CTLS Integration

### API Overview

**Base URL**: `https://health-canada.gc.ca/ctls/api` (example)

**Authentication**: OAuth 2.0 or API Key

### Key Endpoints

**1. Submit Monthly Report**
```typescript
POST /api/v1/reports/monthly
Headers: {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
}

Body: {
  reporting_period: string;
  production: {
    total_kg: number;
    by_strain: { strain: string; kg: number; }[];
  };
  destruction: {
    total_kg: number;
    reason: string;
  };
  inventory: {
    total_kg: number;
    by_stage: { stage: string; kg: number; }[];
  };
  sales: {
    total_kg: number;
    domestic: number;
    export: number;
  };
  gpp_compliance: boolean;
  qap_compliance: boolean;
}

Response: {
  submission_id: string;
  status: 'accepted' | 'rejected';
  confirmation_number?: string;
  errors?: string[];
}
```

**2. Get Submission Status**
```typescript
GET /api/v1/submissions/:submissionId
Response: CTLSSubmission
```

### Integration Service (Node.js)

```typescript
// services/ctlsService.ts
export class CTLSService {
  private baseUrl = 'https://health-canada.gc.ca/ctls/api';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CTLS_API_KEY!;
  }

  async submitMonthlyReport(reportData: CTLSReport): Promise<CTLSSubmission> {
    const response = await axios.post(
      `${this.baseUrl}/api/v1/reports/monthly`,
      this.formatCTLSData(reportData),
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  private formatCTLSData(report: CTLSReport) {
    // Transform internal report format to CTLS API format
    return {
      reporting_period: report.reporting_period,
      // ... transform other fields
      gpp_compliance: report.gpp_compliant,
      qap_compliance: report.qap_compliant,
    };
  }
}
```

---

## Database Schema

### PostgreSQL Schema

```sql
-- Jurisdictions (reference table)
CREATE TABLE jurisdictions (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  country VARCHAR(50) NOT NULL,
  system VARCHAR(20) NOT NULL,
  reporting_frequency VARCHAR(20) NOT NULL
);

-- Users
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- User Jurisdictions (many-to-many)
CREATE TABLE user_jurisdictions (
  user_id UUID REFERENCES users(user_id),
  jurisdiction_code VARCHAR(20) REFERENCES jurisdictions(code),
  PRIMARY KEY (user_id, jurisdiction_code)
);

-- Compliance Reports
CREATE TABLE compliance_reports (
  report_id VARCHAR(50) PRIMARY KEY,
  jurisdiction VARCHAR(20) REFERENCES jurisdictions(code),
  type VARCHAR(50) NOT NULL,
  reporting_period VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  export_url TEXT,
  reviewed_by UUID REFERENCES users(user_id),
  notes TEXT,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending-review', 'approved', 'submitted', 'accepted', 'rejected', 'error'))
);

-- Report Errors
CREATE TABLE report_errors (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(50) REFERENCES compliance_reports(report_id),
  error_message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidence Vault
CREATE TABLE evidence_vault (
  evidence_id VARCHAR(50) PRIMARY KEY,
  doc_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  jurisdiction VARCHAR(20) REFERENCES jurisdictions(code),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES users(user_id),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_format VARCHAR(20) NOT NULL,
  retention_policy VARCHAR(20) NOT NULL,
  retention_end DATE NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  CONSTRAINT valid_retention CHECK (retention_policy IN ('1-year', '3-years', '5-years', '7-years', 'permanent'))
);

-- Evidence Tags
CREATE TABLE evidence_tags (
  evidence_id VARCHAR(50) REFERENCES evidence_vault(evidence_id),
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (evidence_id, tag)
);

-- Report Evidence Links
CREATE TABLE report_evidence_links (
  report_id VARCHAR(50) REFERENCES compliance_reports(report_id),
  evidence_id VARCHAR(50) REFERENCES evidence_vault(evidence_id),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id, evidence_id)
);

-- Evidence Access Log
CREATE TABLE evidence_access_log (
  id SERIAL PRIMARY KEY,
  evidence_id VARCHAR(50) REFERENCES evidence_vault(evidence_id),
  user_id UUID REFERENCES users(user_id),
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  CONSTRAINT valid_action CHECK (action IN ('viewed', 'downloaded', 'uploaded', 'modified', 'deleted'))
);

-- Audit Log
CREATE TABLE audit_log (
  audit_id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(user_id),
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  jurisdiction VARCHAR(20) REFERENCES jurisdictions(code),
  ip_address INET,
  status VARCHAR(20) NOT NULL,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  hash VARCHAR(255) NOT NULL
);

-- Metrc Sync Logs
CREATE TABLE metrc_sync_logs (
  sync_id VARCHAR(50) PRIMARY KEY,
  jurisdiction VARCHAR(20) REFERENCES jurisdictions(code),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_type VARCHAR(20) NOT NULL,
  records_synced INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(user_id)
);

-- Metrc Sync Errors
CREATE TABLE metrc_sync_errors (
  id SERIAL PRIMARY KEY,
  sync_id VARCHAR(50) REFERENCES metrc_sync_logs(sync_id),
  error_message TEXT NOT NULL
);

-- CTLS Submissions
CREATE TABLE ctls_submissions (
  submission_id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) REFERENCES compliance_reports(report_id),
  reporting_period VARCHAR(20) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  production_kg DECIMAL(10,2),
  destruction_kg DECIMAL(10,2),
  inventory_kg DECIMAL(10,2),
  sales_kg DECIMAL(10,2),
  health_canada_confirmation VARCHAR(100),
  gpp_attestation BOOLEAN DEFAULT false,
  qap_attestation BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL,
  feedback TEXT
);

-- Indexes
CREATE INDEX idx_reports_jurisdiction ON compliance_reports(jurisdiction);
CREATE INDEX idx_reports_status ON compliance_reports(status);
CREATE INDEX idx_reports_period ON compliance_reports(reporting_period);
CREATE INDEX idx_evidence_jurisdiction ON evidence_vault(jurisdiction);
CREATE INDEX idx_evidence_type ON evidence_vault(doc_type);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_jurisdiction ON audit_log(jurisdiction);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

---

## Authentication & Authorization

### JWT Implementation

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';

export interface AuthToken {
  user_id: string;
  email: string;
  role: UserRole;
  jurisdictions: JurisdictionCode[];
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      jurisdictions: user.jurisdictions,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthToken;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

---

## File Storage

### S3 Integration (AWS)

```typescript
// services/storageService.ts
import AWS from 'aws-sdk';

export class StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async uploadEvidence(
    file: Express.Multer.File,
    evidenceId: string
  ): Promise<string> {
    const key = `evidence/${evidenceId}/${file.originalname}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256', // Encryption at rest
    };

    await this.s3.upload(params).promise();
    
    return `s3://${this.bucket}/${key}`;
  }

  async getDownloadUrl(evidenceId: string, filename: string): Promise<string> {
    const key = `evidence/${evidenceId}/${filename}`;
    
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: 3600, // 1 hour
    });

    return url;
  }
}
```

---

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/trazo_compliance

# JWT
JWT_SECRET=your_secret_key_here

# Metrc
METRC_OR_LICENSE=123-ABC-456
METRC_OR_API_KEY=key_here
METRC_MD_LICENSE=456-DEF-789
METRC_MD_API_KEY=key_here

# CTLS
CTLS_API_KEY=your_ctls_key

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
S3_BUCKET=trazo-evidence-vault

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.trazo.com
```

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://api:3000

  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/trazo
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=trazo
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

**Last Updated**: November 8, 2024
