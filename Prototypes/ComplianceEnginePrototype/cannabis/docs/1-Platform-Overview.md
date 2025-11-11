# Trazo Compliance Engine - Platform Overview

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [Core Features](#core-features)
6. [Data Flow](#data-flow)

---

## Introduction

**Trazo Compliance Engine** is a regulatory reporting and evidence management system for cannabis operations across multiple jurisdictions. The platform focuses on automated compliance reporting, secure document management, and audit trail functionality.

### Supported Jurisdictions
- **Oregon (OR)** - Metrc/OLCC integration
- **Maryland (MD)** - Metrc/MMCC integration  
- **Canada (CAN-CANNABIS)** - CTLS/Health Canada integration

### Primary Use Cases
1. Automated Metrc monthly reporting for OR/MD
2. CTLS monthly reporting for Canada
3. Secure evidence vault with retention policies
4. Comprehensive audit trail with export capabilities
5. Multi-jurisdiction compliance dashboard
6. Deadline tracking and notifications

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                  (Main Application Shell)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         JurisdictionContext Provider               │    │
│  │  - Current jurisdiction state                       │    │
│  │  - Jurisdiction switching logic                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Tab Navigation                         │    │
│  │  - Dashboard                                        │    │
│  │  - Reports                                          │    │
│  │  - Evidence Vault                                   │    │
│  │  - Audit Trail                                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Reports    │  │   Evidence   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AuditLog    │  │  Other Tools │  │   UI Kit     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Type System                             │
│                   (types/index.ts)                           │
│                                                              │
│  - ComplianceReport     - EvidenceDocument                  │
│  - AuditEntry          - User                               │
│  - Jurisdiction        - Notifications                       │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

**1. Context Pattern**
- `JurisdictionContext` provides global access to current jurisdiction
- All components access jurisdiction via `useJurisdiction()` hook

**2. Component Composition**
- Modular components with single responsibility
- UI components separated into `/components/ui`
- Business logic components in `/components`

**3. Type-Safe Data Models**
- TypeScript interfaces in `/types/index.ts`
- Strict typing for all data structures
- Compile-time safety for jurisdiction codes, report types, etc.

---

## Technology Stack

### Core Technologies
- **React** (v18+) - UI framework
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS v4.0** - Styling framework
- **Vite** - Build tool and dev server

### UI Component Library
- **shadcn/ui** - Accessible, customizable components
- **Lucide React** - Icon library
- **Recharts** - Charts and data visualization
- **date-fns** - Date manipulation

### Key Libraries
```typescript
// Component imports
import { Component } from './components/ui/component';

// Icon imports
import { Icon } from 'lucide-react';

// Date utilities
import { format } from 'date-fns';
```

---

## File Structure

```
/
├── App.tsx                          # Main application entry
├── types/
│   └── index.ts                     # TypeScript type definitions
├── components/
│   ├── Dashboard.tsx                # Main dashboard view
│   ├── ReportGenerator.tsx          # Metrc/CTLS reporting
│   ├── EvidenceVault.tsx            # Document management
│   ├── AuditLog.tsx                 # Audit trail viewer
│   ├── [Legacy Components]          # Other compliance tools
│   └── ui/                          # shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       └── [40+ components]
├── styles/
│   └── globals.css                  # Global styles & design tokens
└── docs/                            # Documentation (this file)
```

### Component Categories

**Core Features (Active)**
- `Dashboard.tsx` - Multi-jurisdiction compliance overview
- `ReportGenerator.tsx` - Metrc/CTLS report creation
- `EvidenceVault.tsx` - Secure document storage
- `AuditLog.tsx` - Audit trail and exports

**Additional Tools (Legacy/Extended)**
- `ComplianceTemplates.tsx` - Template management
- `RecordManager.tsx` - Record locking system
- `TraceabilityTool.tsx` - Seed-to-sale tracking
- `InventoryReconciliation.tsx` - Inventory counts
- `RulesEngine.tsx` - Compliance rule configuration
- `InspectionToolkit.tsx` - Inspection preparation
- `RecallManager.tsx` - Product recall management

---

## Core Features

### 1. Metrc Monthly Reporting (OR/MD)

**Purpose**: Automated monthly uploads for state compliance

**Key Capabilities**:
- Seed-to-sale movement tracking
- Waste disposal reporting
- Transaction logs with RFID/tag data
- Reconciliation checks before submission
- Error-free formatting for state portals

**Report Types**:
- `Metrc Monthly` - Comprehensive monthly report
- `Seed-to-Sale Movement` - Product movement logs
- `Waste Reporting` - Disposal documentation
- `Transaction Log` - RFID/tag transactions

### 2. CTLS Reporting (Canada)

**Purpose**: Health Canada Cannabis Tracking and Licensing System reporting

**Key Capabilities**:
- Production data (GPP/QAP compliant)
- Destruction records
- Inventory tracking (kg-based)
- Sales data
- Data integrity checks
- Regulatory submission confirmation

**Report Types**:
- `CTLS Monthly` - Comprehensive monthly submission
- `Production Report` - Cultivation production
- `Destruction Report` - Waste and destruction
- `Inventory Report` - Current stock levels
- `Sales Report` - Distribution data

### 3. Evidence Vault

**Purpose**: Secure, encrypted storage for compliance documentation

**Document Types**:
- Lab Results (COA)
- SOPs (Standard Operating Procedures)
- Permits & Licenses
- Training Certificates
- Inspection Reports
- Metrc/CTLS Exports

**Features**:
- Role-based access control
- Retention policy enforcement (1-7 years, permanent)
- Tamper-proof access logging
- Document linking to reports
- Tag-based organization

### 4. Audit Trail Export

**Purpose**: Complete, immutable record of all system actions

**Tracked Actions**:
- Report creation/submission/approval
- Evidence uploads/access/deletion
- User permission changes
- Metrc/CTLS synchronization
- Reconciliation runs

**Export Options**:
- Filter by jurisdiction, date, user, action type
- PDF format for audits
- CSV format for analysis
- Tamper-proof hashing

### 5. Compliance Dashboard

**Purpose**: Real-time overview of multi-jurisdiction compliance status

**Key Metrics**:
- Compliance status (compliant/warning/critical)
- Unreported data counts
- Pending approvals
- Upcoming deadlines
- System integration status
- Recent activity feed

**Deadline Types**:
- Filing deadlines (monthly/quarterly reports)
- Renewal deadlines (licenses, permits)
- System tasks (archive reviews, reconciliation)
- Inspection dates

### 6. Database Schema

**compliance_reports Table**:
```typescript
{
  report_id: string;          // Unique identifier
  jurisdiction: JurisdictionCode;
  type: ReportType;
  reporting_period: string;   // e.g., "2024-10"
  created_at: string;
  submitted_at?: string;
  status: ReportStatus;
  linked_evidence: string[];  // Array of evidence_ids
  export_url?: string;
  errors?: string[];
  reviewed_by?: string;
}
```

**evidence_vault Table**:
```typescript
{
  evidence_id: string;        // Unique identifier
  doc_type: DocumentType;
  title: string;
  jurisdiction: JurisdictionCode;
  uploaded_at: string;
  uploaded_by: string;
  file_size: string;
  retention_policy: RetentionPolicy;
  retention_end: string;
  linked_reports: string[];   // Array of report_ids
  access_log: AccessLogEntry[];
  encrypted: boolean;
  status: 'active' | 'archived' | 'pending-deletion';
}
```

---

## Data Flow

### 1. Report Generation Flow

```
User selects jurisdiction → 
  Choose report type (Metrc/CTLS) → 
    Configure reporting period → 
      Select data to include → 
        Link evidence documents → 
          Run reconciliation check → 
            Generate report → 
              Submit to regulatory system → 
                Receive confirmation → 
                  Update compliance status
```

### 2. Evidence Upload Flow

```
User uploads document → 
  System validates file → 
    Apply encryption → 
      Set retention policy → 
        Log access event → 
          Store metadata → 
            Enable linking to reports → 
              Schedule retention expiration
```

### 3. Audit Trail Flow

```
System action occurs → 
  Capture action metadata → 
    Generate tamper-proof hash → 
      Store in immutable log → 
        Enable filtered export → 
          Support regulator requests
```

### 4. Jurisdiction Switching Flow

```
User selects jurisdiction → 
  Context updates → 
    All components re-render → 
      Filter data by jurisdiction → 
        Update UI to show relevant:
          - Reports
          - Evidence
          - Deadlines
          - Compliance status
```

---

## Getting Started

### Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Run development server**
```bash
npm run dev
```

3. **Build for production**
```bash
npm run build
```

### Environment Configuration

No environment variables required for frontend-only operation. For production deployment with backend integration, configure:

- Metrc API credentials
- CTLS API credentials
- Document storage (S3, Azure Blob, etc.)
- Database connection strings

---

## Next Steps

- See `2-Component-Reference.md` for detailed component documentation
- See `3-Type-Definitions.md` for complete type system reference
- See `4-Integration-Guide.md` for backend integration instructions

---

**Last Updated**: November 8, 2024  
**Version**: 4.0 (Reporting-Focused)
