# Component Reference

Complete reference for all components in the Trazo Compliance Engine.

---

## Table of Contents

1. [App.tsx](#apptsx)
2. [Dashboard.tsx](#dashboardtsx)
3. [ReportGenerator.tsx](#reportgeneratortsx)
4. [EvidenceVault.tsx](#evidencevaulttsx)
5. [AuditLog.tsx](#auditlogtsx)
6. [Additional Components](#additional-components)
7. [UI Components](#ui-components)

---

## App.tsx

**Path**: `/App.tsx`  
**Purpose**: Main application entry point with region context and navigation

### Overview
Root component that provides region management, header navigation, and tab-based routing.

### Features
- Region Context Provider (US/Canada selection)
- Region selector dropdown
- Four main navigation tabs
- Dynamic header showing active compliance standards

### Key Implementation

```tsx
// Region Context
const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) throw new Error('useRegion must be used within RegionProvider');
  return context;
};

// Main component
export default function App() {
  const [currentRegion, setCurrentRegion] = useState<Region>('US');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <RegionContext.Provider value={{ region: currentRegion, setRegion: setCurrentRegion }}>
      <header>
        {/* Region selector and branding */}
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab navigation */}
      </Tabs>
    </RegionContext.Provider>
  );
}
```

### State Management
- `currentRegion: Region` - Selected region (US or Canada)
- `activeTab: string` - Currently active tab ('dashboard', 'reports', 'evidence', 'audit')

### Exported API

**Hook:**
```tsx
useRegion(): { region: Region; setRegion: (region: Region) => void }
```

**Usage in child components:**
```tsx
import { useRegion } from '../App';

function MyComponent() {
  const { region, setRegion } = useRegion();
  // Use region to filter data or conditionally render
}
```

### Region Display
Shows active compliance standards based on selected region:
- **US**: FSMA, USDA GAP badges
- **Canada**: CFIA SFCR, PrimusGFS v3.2 badges

---

## Dashboard.tsx

**Path**: `/components/Dashboard.tsx`  
**Purpose**: Real-time compliance status overview dashboard

### Overview
Main dashboard displaying compliance metrics, status cards, risk assessments, and upcoming deadlines. All data is region-aware.

### Features
- Region-specific KPI metrics
- Compliance status by area (FSMA, CFIA, PrimusGFS, State-Ag, etc.)
- Risk assessment (commodity, facility, supply chain)
- Upcoming deadlines with priority levels
- System integration status
- Recent activity feed

### Data Structure

```tsx
// Metrics
const metrics: ComplianceMetric[] = region === 'US' 
  ? [
      { label: 'FSMA Readiness', value: '96%', status: 'good' },
      { label: 'State Compliance', value: '85%', status: 'warning' },
      // ...
    ]
  : [
      { label: 'Audit Readiness', value: '87%', status: 'warning' },
      // ...
    ];
```

### Key Sections

#### 1. Metrics Grid (4 cards)
- Readiness percentages
- Document counts
- Outstanding actions
- Compliance rates

#### 2. Compliance Status Cards
Per-system tracking:
```tsx
{
  region: 'US',
  area: 'FSMA',
  status: 'compliant',
  readiness_percentage: 96,
  outstanding_corrective_actions: 1,
  flagged_gaps: 0
}
```

Displays:
- Readiness percentage with progress bar
- Outstanding corrective actions
- Flagged gaps count
- Next audit date

#### 3. Risk Assessment
Three risk segments:
- **Commodity Risk**: By produce type
- **Facility Risk**: By location
- **Supply Chain Risk**: Supplier network

Each shows:
- Risk level (high/medium/low)
- Active issues list
- Mitigation status

#### 4. Upcoming Deadlines
Sorted by priority:
- Critical (red border)
- High (orange border)
- Medium (blue border)
- Low (gray border)

Shows:
- Title and type
- Due date and days remaining
- Assigned person/team

#### 5. System Integration Panels

**US Mode:**
- FSMA Compliance status
- State Agriculture licenses
- Recent activity

**Canada Mode:**
- PrimusGFS audit prep (GAP/GMP/FSMS)
- Recent activity
- Evidence vault stats

### Helper Functions

```tsx
const getPriorityColor = (priority: UpcomingDeadline['priority']) => {
  const colors = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-blue-100 text-blue-800',
    'low': 'bg-slate-100 text-slate-800',
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

### Region Filtering

```tsx
const { region } = useRegion();

// Filter compliance statuses
const complianceStatuses = allComplianceStatuses.filter(s => s.region === region);

// Filter deadlines
const upcomingDeadlines = allUpcomingDeadlines.filter(d => d.region === region);
```

---

## ReportGenerator.tsx

**Path**: `/components/ReportGenerator.tsx`  
**Purpose**: Create and manage compliance reports and audit preparations

### Overview
Multi-tab interface for generating region-specific reports including PrimusGFS audits, CFIA monthly reports, FSMA monitoring, and state registration.

### Features

#### Canada Mode
1. **PrimusGFS Audit Prep Tab**
   - GAP/GMP/FSMS category tracking
   - Readiness percentage calculation
   - Flagged gaps with severity levels
   - Document upload scheduling
   - Generate audit packet export

2. **CFIA Monthly Reporting Tab**
   - SFCR license tracking
   - Movement type selection
   - Traceability record counts
   - E-form generation

3. **Report History Tab**
   - Past submissions table
   - Audit history cards
   - View/download actions

#### US Mode (Future Implementation)
- FSMA Produce Safety logs
- FSMA 204 traceability records
- State agriculture registration
- USDA GAP audit prep

### Quick Stats Bar

```tsx
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardTitle>PrimusGFS Readiness</CardTitle>
    <div className="text-3xl">87%</div>
    <Progress value={87} />
  </Card>
  {/* More stat cards */}
</div>
```

### PrimusGFS Tab Structure

#### Audit Categories Display
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="bg-blue-50 rounded-lg">
    <Badge>92%</Badge>
    <p>GAP - Good Agricultural Practices</p>
    <Progress value={92} />
    <p>23/25 requirements met</p>
  </div>
  {/* GMP and FSMS similar */}
</div>
```

#### Flagged Gaps Section
```tsx
interface AuditGap {
  gap_id: string;
  category: 'GAP' | 'GMP' | 'FSMS';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  target_completion_date?: string;
  status: 'open' | 'in-progress' | 'resolved';
  assigned_to?: string;
}
```

Displays each gap with:
- Category badge
- Severity badge
- Description
- Assigned person and due date
- Status indicator

#### Document Upload Checklist
Required documents with status:
- ✅ Traceability logs (Complete)
- ⏳ Sampling results (Pending)
- ✅ Food safety plans (Complete)
- ⏳ Corrective action evidence (In Progress)
- ✅ Staff training logs (Complete)

### CFIA Tab Structure

#### Form Fields
```tsx
<Select> {/* Reporting Period (month) */}
<Select> {/* Commodity */}
<Checkbox> {/* Movement types: import/export/interprovincial */}
<Checkbox> {/* Include traceability records */}
<Checkbox> {/* Include incidents */}
<Checkbox> {/* Include recalls */}
```

#### Summary Display
```tsx
{
  traceability_records_count: 1247,
  incidents_count: 2,
  recalls_count: 0
}
```

### Report History Table

Columns:
- Report ID (code format)
- Type (PrimusGFS, CFIA)
- Commodity
- Filed date
- Status badge (draft/submitted/accepted)
- Actions (View/Download)

### State Management

```tsx
const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('Leafy Greens');
const [reportingPeriod, setReportingPeriod] = useState('2024-11');
```

### Helper Functions

```tsx
const getStatusColor = (status: ReportStatus) => {
  const colors: Record<ReportStatus, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'approved': 'bg-green-100 text-green-800',
    'submitted': 'bg-blue-100 text-blue-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'flagged': 'bg-orange-100 text-orange-800',
  };
  return colors[status];
};
```

---

## EvidenceVault.tsx

**Path**: `/components/EvidenceVault.tsx`  
**Purpose**: Secure document repository with access control

### Overview
Encrypted document management system with search, filter, upload, and access control features.

### Features
- Document upload with metadata
- Search and filter (type, commodity, keywords, tags)
- Document table with full details
- Access control by department
- Retention policy management
- Encryption status (AES-256)

### Storage Stats

```tsx
<Card>
  <CardTitle>Total Documents</CardTitle>
  <div className="text-3xl">2,347</div>
  <p className="text-green-600">+124 this month</p>
</Card>
```

Stats tracked:
- Total documents
- Storage used (GB)
- Encryption percentage (100%)
- Retention compliance (100%)

### Upload Dialog

```tsx
<Dialog>
  <DialogTrigger>
    <Button>
      <Upload className="w-4 h-4 mr-2" />
      Upload Evidence
    </Button>
  </DialogTrigger>
  <DialogContent>
    <Select> {/* Document Type */}
    <Select> {/* Commodity (optional) */}
    <Input>  {/* Title */}
    <Input>  {/* Description */}
    <Select> {/* Retention Policy */}
    <div>    {/* File upload zone */}
  </DialogContent>
</Dialog>
```

### Document Types (17+)
- Test Result
- SOP
- Staff Training Log
- Corrective Action
- Traceability Log
- Sampling Result
- Food Safety Plan
- HACCP Documentation
- Supplier Approval
- Audit Certificate
- Water Test
- Pest Control Log
- Sanitation Record
- License/Registration
- FSMA 204 Record (US)
- RFR Submission (US)
- Other

### Retention Policies
- 2 years (FSMA minimum)
- 3 years
- 5 years (CFIA standard)
- 7 years (PrimusGFS/State audits)
- Permanent

### Search & Filter

```tsx
const filteredEvidence = evidenceItems.filter((item) => {
  const matchesSearch = item.title.toLowerCase().includes(searchTerm) ||
                       item.tags.some(tag => tag.includes(searchTerm));
  const matchesType = selectedType === 'all' || item.doc_type === selectedType;
  const matchesCommodity = selectedCommodity === 'all' || item.commodity === selectedCommodity;
  return matchesSearch && matchesType && matchesCommodity;
});
```

### Evidence Table

Columns:
- Document ID (code: EV-2024-XXXX)
- Type badge
- Title with encryption icon, file size, format
- Commodity
- Upload date + uploader
- Owner department
- Retention policy + end date
- Status (active/archived/pending-deletion)
- Actions (view/download)

Example row:
```tsx
<TableCell>
  <Lock className="w-3 h-3 text-green-600" />
  <div>Water Quality Test - Irrigation System A</div>
  <p className="text-sm">1.2 MB • PDF</p>
</TableCell>
```

### Access Control Panel

Department permissions display:

**Quality Assurance:**
- View: ✅ Allowed
- Upload: ✅ Allowed
- Delete: ❌ Restricted

**FSMS Coordinator:**
- View: ✅ Allowed
- Upload: ✅ Allowed
- Export: ✅ Allowed

**Management:**
- View: ✅ Allowed
- Upload: ⚠️ Limited
- Export: ✅ Allowed

---

## AuditLog.tsx

**Path**: `/components/AuditLog.tsx`  
**Purpose**: Immutable audit trail with export capabilities

### Overview
Comprehensive activity logging system with SHA-256 hashing, advanced filtering, and regulator-ready exports.

### Features
- Tamper-proof logging with hash verification
- 15+ action types tracked
- Advanced multi-criteria filtering
- Export formats (PDF/CSV)
- User activity tracking
- Region-aware entries

### Stats Cards

```tsx
<Card>
  <CardTitle>Total Entries</CardTitle>
  <div className="text-3xl">5,623</div>
  <p className="text-green-600">+47 today</p>
</Card>
```

Stats displayed:
- Total audit entries
- Active users
- Tamper-proof status (100%)
- Export readiness

### Tracked Actions (15+)

```tsx
export type AuditAction = 
  | 'REPORT_CREATED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_APPROVED'
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_ACCESSED'
  | 'EVIDENCE_DELETED'
  | 'EXPORT_GENERATED'
  | 'GAP_IDENTIFIED'
  | 'CORRECTIVE_ACTION_INITIATED'
  | 'INCIDENT_LOGGED'
  | 'RECALL_INITIATED'
  | 'FSMA_LOG_CREATED'       // US only
  | 'FDA_INSPECTION_LOGGED'  // US only
  | 'STATE_LICENSE_RENEWED'  // US only
  | 'RFR_SUBMITTED';         // US only
```

### Advanced Filtering

```tsx
<div className="grid grid-cols-4 gap-4">
  <Input placeholder="Search keyword..." />
  <Select> {/* Action Type */}
  <Select> {/* Commodity */}
  <Input type="date" /> {/* Date From */}
  <Input type="date" /> {/* Date To */}
</div>
```

Filter logic:
```tsx
const filteredEntries = auditEntries.filter((entry) => {
  const matchesSearch = /* keyword in user name, details, resource ID */;
  const matchesAction = selectedAction === 'all' || entry.action === selectedAction;
  const matchesCommodity = selectedCommodity === 'all' || entry.commodity === selectedCommodity;
  const matchesDateFrom = !dateFrom || new Date(entry.timestamp) >= new Date(dateFrom);
  const matchesDateTo = !dateTo || new Date(entry.timestamp) <= new Date(dateTo);
  return matchesSearch && matchesAction && matchesCommodity && matchesDateFrom && matchesDateTo;
});
```

### Audit Entries Table

Columns:
- Timestamp + IP address
- User name + user ID
- Action (color-coded badge)
- Resource type + resource ID
- Commodity (if applicable)
- Details description
- Status (success/failure)
- Hash (truncated to 16 chars)

### Action Color Coding

```tsx
const getActionColor = (action: AuditAction) => {
  if (action.includes('EVIDENCE')) return 'bg-blue-100 text-blue-800';
  if (action.includes('REPORT')) return 'bg-purple-100 text-purple-800';
  if (action.includes('GAP') || action.includes('CORRECTIVE')) return 'bg-orange-100 text-orange-800';
  if (action.includes('INCIDENT') || action.includes('RECALL')) return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-800';
};
```

### Export Options

**PDF Audit Packet:**
- Complete chronological trail
- Hash verification table
- Supporting evidence references
- Regulator formatting

**Spreadsheet Export:**
- Tabular CSV/Excel format
- All audit fields
- Filter-compatible
- Analysis-ready

---

## Additional Components

### Unused Components (Available for Future Features)

Located in `/components/`:

**ComplianceTemplates.tsx**
- Pre-built compliance document templates
- SOP templates
- Report templates

**InspectionToolkit.tsx**
- On-site inspection tools
- Checklist management
- Photo documentation

**InventoryReconciliation.tsx**
- Inventory tracking
- Lot reconciliation
- Waste tracking

**RecallManager.tsx**
- Dedicated recall workflow
- Customer notifications
- Effectiveness checks

**RecordManager.tsx**
- General record keeping
- Document organization
- Archive management

**RulesEngine.tsx**
- Automated compliance rule checking
- Alert triggers
- Workflow automation

**TraceabilityTool.tsx**
- Advanced traceability features
- Lot mapping
- Supply chain visualization

### Integration Potential

These components can be integrated into main navigation as:
- Additional tabs
- Dialog-based tools
- Dashboard widgets
- Utility functions

---

## UI Components

### shadcn/ui Library

All UI primitives located in `/components/ui/`:

#### Layout Components
- **Card**: Container with header/content sections
- **Tabs**: Tab navigation system
- **Dialog**: Modal dialogs
- **Alert**: Notification messages
- **Sheet**: Slide-out panels

#### Data Display
- **Table**: Structured data display
- **Badge**: Status indicators
- **Progress**: Percentage bars
- **Avatar**: User images
- **Separator**: Visual dividers

#### Form Controls
- **Input**: Text input fields
- **Label**: Form labels
- **Select**: Dropdown selectors
- **Checkbox**: Boolean toggles
- **Button**: Action triggers
- **Textarea**: Multi-line text
- **Radio Group**: Single selection
- **Switch**: Toggle switches
- **Slider**: Range inputs

#### Navigation
- **Tabs**: Primary navigation
- **Breadcrumb**: Path navigation
- **Navigation Menu**: Complex menus
- **Pagination**: Page navigation
- **Menubar**: Application menu

#### Overlays
- **Dialog**: Modal windows
- **Popover**: Floating content
- **Tooltip**: Hover information
- **Dropdown Menu**: Contextual menus
- **Context Menu**: Right-click menus
- **Hover Card**: Preview cards

#### Feedback
- **Alert**: Important messages
- **Sonner**: Toast notifications
- **Skeleton**: Loading placeholders

### Icon Library (Lucide React)

Common icons used:
- `Leaf` - Produce/agriculture
- `Shield` - Security/compliance
- `FileText` - Documents
- `Folder` - Evidence vault
- `BarChart3` - Dashboard
- `AlertTriangle` - Warnings
- `CheckCircle` - Success
- `Clock` - Pending
- `Calendar` - Deadlines
- `Download` - Export
- `Upload` - Upload
- `Eye` - View
- `Lock` - Encryption
- `Search` - Search
- `Filter` - Filtering
- `Flag` - Region/flagging

---

## Best Practices

### 1. Region Awareness
Always check region when displaying region-specific features:

```tsx
const { region } = useRegion();
{region === 'US' && <USOnlyFeature />}
{region === 'Canada' && <CanadaOnlyFeature />}
```

### 2. Type Safety
Use TypeScript types from `/types/index.ts`:

```tsx
import type { ProduceEvidence, CommodityType, Region } from '../types';
```

### 3. Data Filtering
Filter mock data arrays by region:

```tsx
const regionSpecificData = allData.filter(item => item.region === region);
```

### 4. Status Colors
Create consistent color helper functions:

```tsx
const getStatusColor = (status: Status) => {
  const colors: Record<Status, string> = { /* ... */ };
  return colors[status];
};
```

### 5. Responsive Design
Use Tailwind responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### 6. Component Composition
Break complex components into smaller, reusable pieces:

```tsx
function ComplexComponent() {
  return (
    <Card>
      <CardHeader><Title /></CardHeader>
      <CardContent><Content /></CardContent>
    </Card>
  );
}
```

### 7. State Management
Use local state for component-specific data:

```tsx
const [searchTerm, setSearchTerm] = useState('');
const [selectedType, setSelectedType] = useState<'all' | Type>('all');
```

---

**Next**: See [3-Type-Definitions.md](./3-Type-Definitions.md) for complete type system documentation.
