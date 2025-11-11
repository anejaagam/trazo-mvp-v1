# Trazo Compliance Engine - Component Reference

## Table of Contents
1. [Core Components](#core-components)
2. [App.tsx - Application Shell](#apptsx)
3. [Dashboard Component](#dashboard-component)
4. [ReportGenerator Component](#reportgenerator-component)
5. [EvidenceVault Component](#evidencevault-component)
6. [AuditLog Component](#auditlog-component)
7. [Legacy/Extended Components](#legacy-components)
8. [Hooks and Context](#hooks-and-context)

---

## Core Components

The platform has **4 primary components** that handle the main compliance functionality:

| Component | File | Purpose | Tab Name |
|-----------|------|---------|----------|
| Dashboard | `Dashboard.tsx` | Multi-jurisdiction overview | Compliance Dashboard |
| ReportGenerator | `ReportGenerator.tsx` | Metrc/CTLS reporting | Reports |
| EvidenceVault | `EvidenceVault.tsx` | Document management | Evidence Vault |
| AuditLog | `AuditLog.tsx` | Audit trail | Audit Trail |

---

## App.tsx

**Path**: `/App.tsx`

### Purpose
Main application shell that provides:
- Jurisdiction context management
- Tab-based navigation
- Global header with jurisdiction selector
- Layout structure

### Key Features

**1. Jurisdiction Management**
```typescript
const [currentJurisdiction, setCurrentJurisdiction] = useState<Jurisdiction>(jurisdictions[0]);

// Context provider wraps entire app
<JurisdictionContext.Provider value={{ jurisdiction, setJurisdiction }}>
  {/* App content */}
</JurisdictionContext.Provider>
```

**2. Available Jurisdictions**
```typescript
export const jurisdictions: Jurisdiction[] = [
  { 
    code: 'OR', 
    name: 'Oregon', 
    system: 'Metrc',
    reportingFrequency: 'Monthly'
  },
  { 
    code: 'MD', 
    name: 'Maryland', 
    system: 'Metrc',
    reportingFrequency: 'Daily'
  },
  { 
    code: 'CAN-CANNABIS', 
    name: 'Canada (Health Canada)', 
    system: 'CTLS',
    reportingFrequency: 'Monthly'
  },
];
```

**3. Navigation Structure**
- 4 main tabs (Dashboard, Reports, Evidence, Audit)
- Tab state managed via `activeTab` state
- Shadcn `Tabs` component for UI

**4. Header Elements**
- Logo with Shield icon
- Platform title: "Trazo Compliance Engine"
- Subtitle: "Regulatory Reporting & Evidence Management"
- Jurisdiction selector dropdown
- Current jurisdiction display

### State Management
```typescript
const [activeTab, setActiveTab] = useState('dashboard');
const [currentJurisdiction, setCurrentJurisdiction] = useState<Jurisdiction>(jurisdictions[0]);
```

### Context Export
```typescript
export const useJurisdiction = () => {
  const context = useContext(JurisdictionContext);
  if (!context) {
    throw new Error('useJurisdiction must be used within JurisdictionProvider');
  }
  return context;
};
```

---

## Dashboard Component

**Path**: `/components/Dashboard.tsx`

### Purpose
Displays multi-jurisdiction compliance status, deadlines, and system health at a glance.

### Key Sections

**1. Compliance Status Header**
- Jurisdiction-specific badge (Compliant/Warning/Critical)
- Status color coding: green/yellow/red

**2. Key Metrics Cards** (4 cards)
```typescript
const metrics: ComplianceMetric[] = [
  { label: 'Total Reports (30d)', value: '18', trend: '+3', status: 'good' },
  { label: 'Evidence Documents', value: '1,247', trend: '+52', status: 'good' },
  { label: 'Pending Approvals', value: N, trend: '-', status: 'warning/good' },
  { label: 'Compliance Rate', value: '98%', trend: '+2%', status: 'good' },
];
```

**3. Alert System**
- Unreported data alerts (critical)
- Urgent task notifications (warning)
- Conditional rendering based on status

**4. Multi-Jurisdiction Overview**
```typescript
const complianceStatuses: ComplianceStatus[] = [
  {
    jurisdiction: 'OR',
    status: 'compliant',
    last_report_date: '2024-10-31',
    next_deadline: '2024-11-30',
    unreported_data: 0,
    urgent_tasks: 0,
    pending_approvals: 1,
  },
  // ... MD, CAN-CANNABIS
];
```

Displays all jurisdictions with:
- Last report date
- Next deadline
- Pending items count
- Status indicator

**5. Upcoming Deadlines**
```typescript
interface UpcomingDeadline {
  id: string;
  title: string;
  jurisdiction: JurisdictionCode;
  type: 'filing' | 'renewal' | 'system-task' | 'inspection';
  due_date: string;
  days_until_due: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
}
```

Features:
- Filtered by current jurisdiction
- Priority-based color coding (left border)
- Days until due calculation
- "Today" and "Tomorrow" special highlighting

**6. System Integration Status**
- Metrc/CTLS connection status
- Last sync time
- Record sync count
- OLCC/Health Canada compliance status

**7. Recent Reports Card**
- Last 3 submitted reports
- Submission dates
- Acceptance status badges

**8. Evidence Vault Summary**
- Total documents count
- Monthly additions
- Storage usage
- Retention compliance percentage

**9. Recent Activity Feed**
```typescript
// Activity types:
- Report Submitted (green)
- Evidence Uploaded (blue)
- Metrc/CTLS Sync Complete (purple)
```

### State Management
```typescript
const { jurisdiction } = useJurisdiction(); // Hook to get current jurisdiction

// Filter data by jurisdiction
const currentStatus = complianceStatuses.find(s => s.jurisdiction === jurisdiction.code);
const filteredDeadlines = upcomingDeadlines.filter(d => d.jurisdiction === jurisdiction.code);
```

### Helper Functions
```typescript
const getPriorityColor = (priority: UpcomingDeadline['priority']) => {
  const colors = {
    'low': 'bg-slate-100 text-slate-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };
  return colors[priority];
};

const getStatusColor = (status: ComplianceStatus['status']) => {
  const colors = {
    'compliant': 'text-green-600',
    'warning': 'text-yellow-600',
    'critical': 'text-red-600',
  };
  return colors[status];
};
```

---

## ReportGenerator Component

**Path**: `/components/ReportGenerator.tsx`

### Purpose
Create, manage, and submit Metrc and CTLS compliance reports.

### Key Features

**1. Jurisdiction-Specific Report Types**
```typescript
const getReportTypeOptions = (): ReportType[] => {
  if (jurisdiction.code === 'CAN-CANNABIS') {
    return ['CTLS Monthly', 'Production Report', 'Destruction Report', 
            'Inventory Report', 'Sales Report'];
  }
  return ['Metrc Monthly', 'Seed-to-Sale Movement', 
          'Waste Reporting', 'Transaction Log'];
};
```

**2. Three Main Tabs**

**Tab 1: Create Report**
- Report type selector (jurisdiction-aware)
- Reporting period picker (month/year)
- Data inclusion checkboxes:
  - Metrc: Movement, Waste, Transactions, RFID/Tags
  - CTLS: Production, Destruction, Inventory, Sales
- Evidence linking checkbox
- Draft save option
- Generate & Submit button

**Tab 2: Report History**
- Filterable table of all reports
- Columns:
  - Report ID (code format)
  - Type
  - Reporting Period
  - Created Date
  - Submitted Date
  - Status (badge with icon)
  - Actions (View, Download)

**Tab 3: Reconciliation**
- Real-time sync status
- Reconciliation check results:
  - Movement records count + discrepancies
  - Waste logs count + discrepancies
  - Transaction/Inventory count + discrepancies
  - OLCC/Health Canada status
- "Run Reconciliation Check" button

**3. System Requirements Cards**

**Metrc Jurisdictions (OR/MD)**:
```typescript
<div>Seed-to-Sale Movement - All product movements tracked</div>
<div>Waste Reporting - Disposal documentation</div>
<div>Transaction Logs - RFID/tag data & compliance</div>
```

**CTLS Jurisdiction (CAN-CANNABIS)**:
```typescript
<div>Production Tracking - GPP/QAP compliance</div>
<div>Destruction Records - Health Canada requirements</div>
<div>Inventory & Sales - Monthly submissions</div>
```

**4. Report Status Management**
```typescript
const getStatusColor = (status: ReportStatus) => {
  const colors: Record<ReportStatus, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'pending-review': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'submitted': 'bg-blue-100 text-blue-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'error': 'bg-red-100 text-red-800',
  };
  return colors[status];
};
```

### State Management
```typescript
const { jurisdiction } = useJurisdiction();
const [reports, setReports] = useState<ComplianceReport[]>(mockReports);
const [selectedReportType, setSelectedReportType] = useState<ReportType>('Metrc Monthly');
const [reportingPeriod, setReportingPeriod] = useState('2024-11');
```

### Data Filtering
```typescript
const filteredReports = reports.filter(r => r.jurisdiction === jurisdiction.code);
```

---

## EvidenceVault Component

**Path**: `/components/EvidenceVault.tsx`

### Purpose
Secure storage and management of compliance evidence documents.

### Key Features (Typical Implementation)

**1. Document Upload**
- Drag-and-drop interface
- File type validation
- Automatic encryption flag
- Metadata capture (title, description, tags)

**2. Document Organization**
- Filter by document type (Lab Result, SOP, Permit, COA, etc.)
- Search by title/description
- Tag-based filtering
- Jurisdiction filtering

**3. Retention Policy**
```typescript
type RetentionPolicy = 
  | '1-year'
  | '3-years'
  | '5-years'
  | '7-years'
  | 'permanent';
```

**4. Access Logging**
```typescript
interface AccessLogEntry {
  user_id: string;
  user_name: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'modified' | 'deleted';
  timestamp: string;
  ip_address: string;
}
```

**5. Document Linking**
- Link documents to compliance reports
- Track which reports reference which evidence
- Maintain audit trail of linkages

**6. Table Display**
Columns typically include:
- Document Type (badge)
- Title
- Uploaded Date
- Uploaded By
- File Size
- Retention Expiration
- Status (active/archived)
- Actions (View, Download, Link)

---

## AuditLog Component

**Path**: `/components/AuditLog.tsx`

### Purpose
Comprehensive, immutable audit trail of all system actions.

### Key Features (Typical Implementation)

**1. Action Types**
```typescript
type AuditAction = 
  | 'REPORT_CREATED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_ACCESSED'
  | 'EVIDENCE_DELETED'
  | 'EXPORT_GENERATED'
  | 'USER_LOGIN'
  | 'USER_PERMISSION_CHANGED'
  | 'RECONCILIATION_RUN'
  | 'METRC_SYNC'
  | 'CTLS_SYNC';
```

**2. Filtering Interface**
```typescript
interface AuditExportFilter {
  jurisdiction?: JurisdictionCode[];
  action?: AuditAction[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
  resource_type?: string;
  keyword?: string;
}
```

**3. Export Capabilities**
- PDF export for audits
- CSV export for analysis
- Date range selection
- Multi-select filters
- Keyword search

**4. Audit Entry Display**
```typescript
interface AuditEntry {
  audit_id: string;
  timestamp: string;
  user_name: string;
  action: AuditAction;
  resource_type: 'report' | 'evidence' | 'user' | 'system';
  resource_id: string;
  jurisdiction: JurisdictionCode;
  status: 'success' | 'failure';
  details?: string;
  hash: string; // Tamper-proofing
}
```

**5. Timeline View**
- Chronological display
- Color-coded by action type
- Success/failure indicators
- Expandable details

**6. Tamper-Proof Hashing**
- Each entry includes cryptographic hash
- Ensures immutability
- Validates chain integrity

---

## Legacy Components

These components provide extended compliance functionality but are not part of the core 4 features:

### ComplianceTemplates.tsx
- Manage report templates
- Create custom compliance forms
- Template versioning
- Jurisdiction-specific templates

### RecordManager.tsx
- Lock/unlock records
- Record immutability
- Batch record management
- Record approval workflows

### TraceabilityTool.tsx
- Seed-to-sale tracking visualization
- Batch genealogy
- Product lifecycle tracking
- Chain of custody

### InventoryReconciliation.tsx
- Physical count workflows
- Variance detection
- Multi-step reconciliation process
- Location-based counts

### RulesEngine.tsx
- Configure compliance rules
- Automated rule checking
- Severity levels (critical/warning/info)
- Rule enable/disable

### InspectionToolkit.tsx
- Inspection preparation
- Employee permit tracking
- COA verification
- Inventory-by-room reports
- Inspector view mode

### RecallManager.tsx
- Product recall initiation
- Affected package tracking
- Notification management
- Recovery progress tracking

---

## Hooks and Context

### useJurisdiction Hook

**Location**: Exported from `App.tsx`

**Usage**:
```typescript
import { useJurisdiction } from '../App';

function MyComponent() {
  const { jurisdiction, setJurisdiction } = useJurisdiction();
  
  // Access current jurisdiction
  console.log(jurisdiction.code); // 'OR', 'MD', or 'CAN-CANNABIS'
  console.log(jurisdiction.system); // 'Metrc' or 'CTLS'
  
  // Switch jurisdiction
  setJurisdiction(newJurisdiction);
}
```

**Returns**:
```typescript
{
  jurisdiction: Jurisdiction;
  setJurisdiction: (jurisdiction: Jurisdiction) => void;
}
```

**Context Value**:
```typescript
interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  state?: string;
  country: string;
  system: 'Metrc' | 'CTLS';
  reportingFrequency: 'Daily' | 'Monthly' | 'Real-time';
}
```

### Context Provider Structure

```typescript
const JurisdictionContext = createContext<JurisdictionContextType | undefined>(undefined);

// In App.tsx:
<JurisdictionContext.Provider value={{ jurisdiction, setJurisdiction }}>
  <div className="min-h-screen bg-slate-50">
    {/* All components have access to jurisdiction context */}
  </div>
</JurisdictionContext.Provider>
```

---

## UI Component Library

All components use **shadcn/ui** components located in `/components/ui/`:

### Most Commonly Used

| Component | Usage |
|-----------|-------|
| `Card` | Container for content sections |
| `Button` | All interactive buttons |
| `Table` | Data tables (reports, evidence, audit logs) |
| `Badge` | Status indicators, tags |
| `Tabs` | Tab navigation within pages |
| `Select` | Dropdown selections |
| `Alert` | Warnings and notifications |
| `Progress` | Progress bars |
| `Dialog` | Modal dialogs |
| `Checkbox` | Form checkboxes |

### Import Pattern
```typescript
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
```

---

## Component Communication

### Props vs Context

**Use Context For**:
- Current jurisdiction (global state)
- User authentication (future)
- Theme settings (future)

**Use Props For**:
- Component-specific data
- Callbacks and event handlers
- Configuration options

### Data Flow Example

```typescript
// App.tsx provides jurisdiction via context
<JurisdictionContext.Provider value={{ jurisdiction, setJurisdiction }}>
  <Dashboard />
</JurisdictionContext.Provider>

// Dashboard.tsx consumes context
function Dashboard() {
  const { jurisdiction } = useJurisdiction();
  
  // Filter data by jurisdiction
  const filteredData = allData.filter(item => 
    item.jurisdiction === jurisdiction.code
  );
  
  return <div>{/* Render filtered data */}</div>;
}
```

---

## Best Practices

### Component Structure
1. Import statements
2. Type definitions (if component-specific)
3. Main component function
4. Helper functions
5. Mock data (development only)

### State Management
- Use `useState` for local component state
- Use `useJurisdiction` for jurisdiction data
- Filter data based on current jurisdiction
- Avoid prop drilling - use context

### Styling
- Use Tailwind utility classes
- Avoid inline styles
- Use shadcn components for consistency
- Follow color scheme: blue (primary), green (success), yellow (warning), red (error)

---

**See Also**:
- `1-Platform-Overview.md` - Architecture and features
- `3-Type-Definitions.md` - Complete type reference
- `4-Integration-Guide.md` - Backend integration

**Last Updated**: November 8, 2024
