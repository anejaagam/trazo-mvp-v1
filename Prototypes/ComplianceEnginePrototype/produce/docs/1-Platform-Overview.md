# Trazo Compliance Engine - Platform Overview

## Introduction

**Trazo Compliance Engine** is a comprehensive produce safety and food compliance management platform supporting both **US (FDA/FSMA)** and **Canada (CFIA)** regulatory requirements.

### Purpose

The platform enables food safety professionals to:
- Manage multi-region compliance (US and Canada)
- Prepare for regulatory audits (PrimusGFS, USDA GAP, FSMA)
- Maintain secure evidence repositories
- Track immutable audit trails
- Manage recalls and incidents
- Ensure traceability compliance (including FSMA 204)

### Key Capabilities

- **Multi-Region Support**: Toggle between US and Canada compliance frameworks
- **Audit Management**: PrimusGFS v3.2, USDA GAP, FSMA, CFIA SFCR
- **Evidence Vault**: Encrypted document repository with retention policies
- **Traceability**: FSMA 204 compliance for Food Traceability List commodities
- **Audit Trail**: Immutable logs with SHA-256 hashing
- **Incident & Recall Management**: FDA/CFIA notification workflows

---

## Supported Compliance Systems

### United States
- **FSMA** (Food Safety Modernization Act) - 21 CFR Part 112
- **FSMA 204** (Food Traceability Rule)
- **USDA GAP/HGAP** (Good Agricultural Practices)
- **State Agriculture Departments** (CA CDFA, FL DOACS, NY DAM, etc.)
- **PrimusGFS v3.2**

### Canada
- **CFIA SFCR** (Safe Food for Canadians Regulations)
- **PrimusGFS v3.2**
- Provincial food safety requirements

---

## Technology Stack

### Core Technologies
- **Framework**: React 18+ with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS v4.0
- **Icons**: Lucide React
- **State Management**: React Context API (Region selection)
- **Type Safety**: Full TypeScript coverage

### Design Patterns

**1. Context-Based Region Management**
```tsx
const { region, setRegion } = useRegion();
// Access current region (US | Canada) anywhere in app
```

**2. Type-Safe Data Models**
- All data structures defined in `/types/index.ts`
- Union types for region-specific features
- Strong typing prevents runtime errors

**3. Component Composition**
- Small, focused components
- Reusable UI primitives from shadcn/ui
- Clear separation of concerns

---

## File Structure

```
/
├── App.tsx                          # Main app with region context
├── types/index.ts                   # TypeScript type definitions
├── components/
│   ├── Dashboard.tsx                # Compliance status overview
│   ├── ReportGenerator.tsx          # Audit & report creation
│   ├── EvidenceVault.tsx            # Document management
│   ├── AuditLog.tsx                 # Activity trail
│   ├── [Additional Components]      # Future features
│   └── ui/                          # shadcn/ui primitives
├── styles/globals.css               # Tailwind config & typography
└── docs/                            # Documentation
    ├── 1-Platform-Overview.md       # This file
    ├── 2-Component-Reference.md     # Component documentation
    ├── 3-Type-Definitions.md        # Type system reference
    └── 4-Integration-Guide.md       # Feature implementation guides
```

---

## Core Concepts

### 1. Regions

The platform supports two regulatory regions:

```typescript
export type Region = 'US' | 'Canada';
```

Components filter data and UI based on the current region:

```typescript
const complianceStatuses = allStatuses.filter(s => s.region === region);
```

### 2. Compliance Systems

Different compliance frameworks are tracked:

```typescript
export type ComplianceSystem = 
  | 'PrimusGFS'    // Both regions
  | 'CFIA'         // Canada only
  | 'FSMA'         // US only
  | 'USDA-GAP'     // US only
  | 'State-Ag';    // US only
```

### 3. Commodities

Produce types tracked in the system:

```typescript
export type CommodityType = 
  | 'Leafy Greens'
  | 'Tomatoes'
  | 'Cucumbers'
  | 'Peppers'
  | 'Berries'
  | 'Root Vegetables'
  | 'Stone Fruit'
  | 'Citrus'
  | 'Herbs'
  | 'Melons'
  | 'Mixed Vegetables';
```

**FSMA 204 Commodities** (US only): Subset requiring enhanced traceability
- Leafy Greens, Tomatoes, Cucumbers, Peppers, Melons

### 4. Evidence Documents

All compliance evidence is stored with metadata:

**Retention Policies:**
- `2-years` - FSMA minimum
- `5-years` - CFIA standard
- `7-years` - PrimusGFS/State audits
- `permanent` - Core food safety plans

### 5. Audit Trail

All user actions are logged immutably with SHA-256 hashing for tamper-proofing.

---

## Application Architecture

### Main Entry Point (App.tsx)

```tsx
<RegionContext.Provider value={{ region, setRegion }}>
  <Header />
  <Tabs>
    <TabsList>
      <TabsTrigger>Dashboard</TabsTrigger>
      <TabsTrigger>Reports</TabsTrigger>
      <TabsTrigger>Evidence Vault</TabsTrigger>
      <TabsTrigger>Audit Trail</TabsTrigger>
    </TabsList>
    <TabsContent>
      {/* Component rendering */}
    </TabsContent>
  </Tabs>
</RegionContext.Provider>
```

### Component Hierarchy

```
App.tsx (Region Context)
  └── Tabs
       ├── Dashboard.tsx
       ├── ReportGenerator.tsx
       ├── EvidenceVault.tsx
       └── AuditLog.tsx
```

---

## Region System

### How Region Switching Works

**1. Context Provider** (App.tsx)
```tsx
const [currentRegion, setCurrentRegion] = useState<Region>('US');
```

**2. Region Hook** (Available in all components)
```tsx
import { useRegion } from '../App';
const { region } = useRegion();
```

**3. Region-Specific Data**
```tsx
// Components filter data by region
const complianceStatuses = allStatuses.filter(s => s.region === region);

// Conditional UI rendering
{region === 'US' && <FSMAMonitoring />}
{region === 'Canada' && <CFIAReporting />}
```

### Region-Specific Features

**US Only:**
- FSMA Produce Safety monitoring (21 CFR Part 112)
- FSMA 204 traceability with KDEs/CTEs
- State agriculture license tracking
- Reportable Food Registry (RFR) submissions
- FDA inspection readiness

**Canada Only:**
- CFIA SFCR monthly reporting
- Safe Food for Canadians License tracking
- E-form submission workflows
- Interprovincial movement tracking

**Both Regions:**
- PrimusGFS v3.2 audit preparation
- Evidence vault with encryption
- Audit trail with immutable logs
- Incident and recall management
- Corrective action tracking

---

## Navigation

### Tab Structure

The application has four main tabs:

1. **Compliance Dashboard**
   - Real-time compliance status overview
   - Risk assessment by commodity/facility/supply chain
   - Upcoming deadlines and action items
   - System integration status

2. **FSMA & Audits / CFIA & Audits** (label changes by region)
   - Report generation and submission
   - Audit preparation (PrimusGFS, USDA GAP, FSMA)
   - Document upload scheduling
   - Report history

3. **Evidence Vault**
   - Secure document repository
   - Search and filter capabilities
   - Upload new evidence
   - Access control management

4. **Audit Trail**
   - Immutable activity logs
   - Advanced filtering
   - Export capabilities (PDF/CSV)
   - Hash verification

---

## Data Flow Examples

### Example 1: Uploading Evidence

1. **User Action**: Click "Upload Evidence" in EvidenceVault
2. **Dialog Opens**: Form with fields (doc type, commodity, retention, etc.)
3. **Data Creation**: 
   ```tsx
   const newEvidence: ProduceEvidence = {
     evidence_id: generateId(),
     region: region,  // From context
     uploaded_by: currentUser.name,
     // ... other fields
   };
   ```
4. **Audit Log**: Action logged automatically
   ```tsx
   const auditEntry: AuditEntry = {
     action: 'EVIDENCE_UPLOADED',
     region: region,
     resource_id: newEvidence.evidence_id,
     hash: generateHash(),
   };
   ```

### Example 2: Region-Specific Reports

```tsx
// ReportGenerator.tsx
const { region } = useRegion();

return (
  <Tabs>
    {region === 'US' && (
      <>
        <TabsTrigger value="fsma">FSMA Monitoring</TabsTrigger>
        <TabsTrigger value="fsma204">FSMA 204 Traceability</TabsTrigger>
        <TabsTrigger value="state">State Registration</TabsTrigger>
      </>
    )}
    {region === 'Canada' && (
      <>
        <TabsTrigger value="cfia">CFIA Reporting</TabsTrigger>
        <TabsTrigger value="primusgfs">PrimusGFS Audit</TabsTrigger>
      </>
    )}
  </Tabs>
);
```

---

## Key Features by Module

### Dashboard
- **Metrics**: Region-specific KPIs (FSMA readiness, audit readiness, etc.)
- **Compliance Status**: Per-system readiness percentages
- **Risk Assessment**: Commodity, facility, supply chain risk levels
- **Deadlines**: Prioritized upcoming tasks
- **Recent Activity**: Latest compliance actions

### Report Generator
- **PrimusGFS Audit Prep**: GAP/GMP/FSMS category tracking
- **CFIA Reporting**: Monthly e-form submission
- **FSMA Monitoring**: 21 CFR Part 112 compliance logs (US)
- **FSMA 204 Traceability**: KDE/CTE tracking (US)
- **Report History**: Past submissions and audit results

### Evidence Vault
- **Secure Storage**: AES-256 encryption
- **Document Types**: 17+ types including test results, training logs, SOPs
- **Retention Management**: Automatic policy enforcement
- **Access Control**: Role-based permissions by department
- **Search & Filter**: By type, commodity, keyword, tags

### Audit Trail
- **Immutable Logging**: SHA-256 hashing
- **15+ Action Types**: Evidence, reports, audits, incidents, recalls
- **Advanced Filtering**: By action, commodity, date range, user
- **Export Formats**: PDF (regulator-ready) and CSV
- **Tamper Detection**: Hash chain verification

---

## User Roles & Permissions

### Roles
- **Admin**: Full system access
- **QA Manager**: Quality assurance oversight
- **FSMS Coordinator**: Food safety management
- **Production Manager**: Operational management
- **Operator**: Day-to-day data entry
- **Auditor**: Read-only audit access
- **Viewer**: Limited read access

### Key Permissions
- View/create/approve/submit reports
- View/upload/delete evidence
- Export audit trails
- Manage users
- Manage corrective actions
- Schedule audits
- FDA inspector access (US only)

---

## Security & Compliance

### Data Security
- **Encryption**: AES-256 for all documents
- **Access Logging**: Every document interaction tracked
- **Audit Trail**: Immutable with cryptographic hashing
- **Role-Based Access**: Fine-grained permissions

### Regulatory Compliance
- **FDA Inspection Ready**: Electronic records accessible (US)
- **Retention Policies**: Automatic enforcement (2-7 years)
- **Traceability**: Full chain of custody
- **Export Formats**: Regulator-approved formats

---

## Quick Start Guide

### 1. Select Your Region
Use the region selector in the header to choose US or Canada.

### 2. Review Dashboard
Check compliance status, deadlines, and risk assessments.

### 3. Upload Evidence
Navigate to Evidence Vault and upload required documents with appropriate retention policies.

### 4. Generate Reports
Go to Reports tab and select the appropriate report type for your region.

### 5. Monitor Audit Trail
Review all system activity in the Audit Trail for compliance verification.

---

## Development Notes

### Adding a New Region

1. Update `Region` type in `/types/index.ts`
2. Add region option to select in `App.tsx`
3. Add region-specific data to components
4. Update filters: `filter(item => item.region === region)`

### Adding a New Compliance System

1. Add to `ComplianceSystem` type
2. Create interface extending `ProduceReport`
3. Add tab in `ReportGenerator.tsx`
4. Add status card in `Dashboard.tsx`

### Adding a New Document Type

1. Add to `ProduceDocumentType` type
2. Add to document type select in `EvidenceVault.tsx`
3. Set appropriate retention policy defaults

---

## UI Component Library

All UI primitives from **shadcn/ui** located in `/components/ui/`:

**Layout:**
- Card, Tabs, Dialog, Alert

**Data Display:**
- Table, Badge, Progress

**Form Controls:**
- Input, Select, Checkbox, Button

**Icons:**
- All from `lucide-react` package
- Common: Leaf, Shield, FileText, Folder, AlertTriangle, CheckCircle

---

## Next Steps

- **[2-Component-Reference.md](./2-Component-Reference.md)** - Detailed component documentation
- **[3-Type-Definitions.md](./3-Type-Definitions.md)** - Complete type reference
- **[4-Integration-Guide.md](./4-Integration-Guide.md)** - Feature-specific implementation guides

---

**Platform Version**: 1.0.0  
**Last Updated**: November 2024  
**License**: Proprietary
