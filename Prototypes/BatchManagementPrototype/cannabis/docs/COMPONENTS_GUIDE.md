# Cannabis Batch Management System - Components Guide

## Table of Contents
1. [Dashboard Components](#dashboard-components)
2. [Workflow Components](#workflow-components)
3. [Management Components](#management-components)
4. [Display Components](#display-components)
5. [Dialog Components](#dialog-components)
6. [Component Props Reference](#component-props-reference)

---

## Dashboard Components

### BatchDashboard
**File:** `/components/BatchDashboard.tsx`  
**Purpose:** Main grid view displaying all batches with filtering and search capabilities.

**Features:**
- Grid layout of batch cards
- Filter by stage (propagation, vegetative, flowering, etc.)
- Filter by cultivar/strain
- Date range filtering
- Search by batch name
- Click card to view detailed batch information
- "Create Batch" button to open creation dialog

**Props:**
```typescript
interface BatchDashboardProps {
  batches: Batch[];              // Array of all batches
  onCreateBatch: () => void;      // Opens CreateBatchDialog
  onSelectBatch: (batch: Batch) => void;  // Navigate to BatchDetailView
}
```

**Key Elements:**
- Stage badge with color coding (green/blue/purple/orange)
- Plant count display
- Cultivar name
- Pod location tags
- Quarantine warning badge (if applicable)
- Days in stage calculation

**User Interactions:**
1. View all batches in grid layout
2. Click filters to narrow results
3. Type in search to find specific batch
4. Click batch card → opens BatchDetailView
5. Click "Create Batch" → opens CreateBatchDialog

---

### BatchDetailView
**File:** `/components/BatchDetailView.tsx`  
**Purpose:** Comprehensive single-batch view with all details, timeline, SOPs, and metrics.

**Features:**
- Back button to return to dashboard
- Batch header with name, cultivar, stage, plant count
- 4-tab navigation: Overview | Timeline | SOPs | Metrics
- Stage transition controls
- Quarantine management
- Evidence attachment

**Props:**
```typescript
interface BatchDetailViewProps {
  batch: Batch;                  // Current batch being viewed
  pods: Pod[];                   // All available pods
  events: TimelineEvent[];       // Timeline events for this batch
  plants: Plant[];               // Plants in this batch (for harvest)
  dryingRooms: any[];           // Available drying rooms
  availableTags: string[];      // Metrc tags for tagging workflow
  genealogy: BatchGenealogy | null;  // Parent batch info
  plantCountSnapshots: PlantCountSnapshot[];  // Daily count records
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  onBack: () => void;           // Return to dashboard
  onStageTransition: (batchId: string, newStage: BatchStage) => void;
  onAddEvidence: (batchId: string, evidence: any) => void;
  onCompleteHarvest: (record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported'>) => void;
  onCompleteTagging: (session: Omit<TaggingSession, 'id' | 'startedAt'>) => void;
  onRecordPlantCount: (snapshot: Omit<PlantCountSnapshot, 'id' | 'timestamp'>) => void;
  onStartDrying: (record: Omit<DryingRecord, 'id'>) => void;
  onCompleteDrying: (recordId: string, data: any) => void;
  onStartCuring: (record: Omit<CuringRecord, 'id'>) => void;
  onCompleteCuring: (recordId: string, data: any) => void;
  onCompletePackaging: (record: Omit<PackagingRecord, 'id'>) => void;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onReleaseQuarantine: (batchId: string, authorizedBy: string, notes: string) => void;
}
```

**Tab 1: Overview**
- Current stage with BatchStageTransition controls
- Pod locations with badges
- Plant count and yield data
- Quarantine status (if applicable)
- Quarantine/Release buttons
- Stage-specific actions (e.g., "Begin Harvest" button when in flowering stage)

**Tab 2: Timeline**
- BatchTimeline component showing all events
- Event type filters (stage_change, alarm, override, note, qa_check)
- Evidence viewer for photos/documents
- "Add Note" functionality

**Tab 3: SOPs**
Stage-specific Standard Operating Procedure workflows:
- **Vegetative → Flowering:** PlantTaggingWorkflow (SOP-001)
- **Flowering → Harvest:** HarvestWorkflow (SOP-002)
- **Post-Harvest:** PostHarvestProcessing (drying, curing, packaging)

**Tab 4: Metrics**
- BatchMetricsPanel with environmental charts (temp, humidity, VPD)
- BatchGenealogyView showing parent batches
- PlantCountTracking for daily count snapshots
- Historical data visualization

---

## Workflow Components

### CreateBatchDialog
**File:** `/components/CreateBatchDialog.tsx`  
**Purpose:** Modal dialog for creating new batches with validation.

**Features:**
- Form fields for batch name, cultivar, stage, start date
- Multi-select for pod assignment
- Plant count input with validation
- Submit button with loading state
- Cancel button to close without saving

**Props:**
```typescript
interface CreateBatchDialogProps {
  open: boolean;                 // Controls dialog visibility
  onClose: () => void;          // Close dialog
  pods: Pod[];                  // Available pods for selection
  onCreateBatch: (data: {
    name: string;
    cultivar: string;
    stage: BatchStage;
    startDate: string;
    podIds: string[];
    plantCount: number;
  }) => void;
}
```

**Validation Rules:**
- Batch name required (min 3 characters)
- Cultivar required
- Stage required (defaults to 'propagation')
- At least one pod must be selected
- Plant count must be > 0 and < pod capacity

**User Flow:**
1. Fill in batch details
2. Select pod location(s)
3. Enter plant count
4. Click "Create Batch"
5. Dialog closes, toast notification appears
6. New batch appears in BatchDashboard

---

### HarvestWorkflow
**File:** `/components/HarvestWorkflow.tsx`  
**Purpose:** Multi-step wizard for documenting harvest process (SOP-002).

**Features:**
- Step 1: Select plants to harvest (checkboxes)
- Step 2: Weigh and record wet weight (grams)
- Step 3: Select drying room
- Step 4: Review and confirm
- Progress indicator showing current step
- Back/Next/Submit navigation

**Props:**
```typescript
interface HarvestWorkflowProps {
  batch: Batch;
  plants: Plant[];              // Plants available for harvest
  dryingRooms: any[];          // Available drying locations
  onComplete: (record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported'>) => void;
  onCancel: () => void;
}
```

**Harvest Record Generated:**
```typescript
{
  batchId: string;
  plantIds: string[];          // Selected plant IDs
  wetWeight: number;           // Total grams
  harvestedBy: string;         // User name
  dryingRoomId: string;
  notes?: string;
}
```

**Metrc Integration:**
- Records plant tag numbers
- Documents wet weight at harvest
- Reports harvest to Metrc API
- Updates plant status to "harvested"
- Creates product batch in Metrc

---

### PlantTaggingWorkflow
**File:** `/components/PlantTaggingWorkflow.tsx`  
**Purpose:** RFID tagging workflow for plants entering flowering stage (SOP-001).

**Features:**
- Display available Metrc tags
- Tag counter (plants to tag vs. available tags)
- Tag assignment interface (scan or manual entry)
- Real-time tag validation
- "Sync to Metrc" button

**Props:**
```typescript
interface PlantTaggingWorkflowProps {
  batch: Batch;
  availableTags: string[];     // Unused Metrc RFID tags
  onComplete: (session: Omit<TaggingSession, 'id' | 'startedAt'>) => void;
  onCancel: () => void;
}
```

**Tagging Session Record:**
```typescript
{
  batchId: string;
  plantsToTag: number;
  plantsTagged: number;
  tagsUsed: string[];          // Array of tag numbers
  taggedBy: string;
  completedAt: string;
  metrcSynced: boolean;
}
```

**Compliance Requirements:**
- One tag per flowering plant (required by law)
- Tags must be scanned into Metrc within 24 hours
- Unused tags must be returned to inventory
- Failed tags must be documented

---

### WasteDisposalWorkflow
**File:** `/components/WasteDisposalWorkflow.tsx`  
**Purpose:** Full-screen workflow for logging cannabis waste disposal (SOP-003).

**Features:**
- Multi-step form for waste documentation
- Cannabis-specific waste reason dropdown
- Weight input with unit validation (grams)
- Photo upload for evidence
- Approval submission (pending_approval status)

**Props:**
```typescript
interface WasteDisposalWorkflowProps {
  onSubmitForApproval: (log: Omit<WasteLog, 'id' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}
```

**Cannabis Waste Reasons (Dropdown Options):**
- Powdery mildew infection
- Bud rot (botrytis)
- Hermaphrodite plants
- Failed pesticide testing
- Failed microbial testing
- Failed heavy metals testing
- Spider mites infestation
- Aphids infestation
- Thrips infestation
- Root rot
- Nutrient burn
- Light stress
- Trim waste (stems/leaves)

**Waste Log Generated:**
```typescript
{
  batchId?: string;
  wasteType: 'plant_material' | 'trim' | 'other';
  weight: number;              // Grams
  reason: string;              // From dropdown
  disposalMethod: string;      // e.g., "Mixed with soil and disposed"
  createdBy: string;
  notes?: string;
  evidenceUrls?: string[];
}
```

**Approval Workflow:**
1. Technician creates waste log → status: `pending_approval`
2. Compliance manager reviews in WasteLogDashboard
3. Manager approves → status: `reported_to_metrc` (can dispose waste)
4. Manager rejects → status: `rejected` (must create new log)

---

### PostHarvestProcessing
**File:** `/components/PostHarvestProcessing.tsx`  
**Purpose:** Manage drying, curing, and packaging workflows post-harvest.

**Features:**
- 3 accordion sections: Drying | Curing | Packaging
- Each section shows active records + "Start New" button
- Environmental monitoring data entry
- Weight tracking through stages
- Metrc package tag assignment (packaging step)

**Props:**
```typescript
interface PostHarvestProcessingProps {
  batch: Batch;
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  onStartDrying: (record: Omit<DryingRecord, 'id'>) => void;
  onCompleteDrying: (recordId: string, data: any) => void;
  onStartCuring: (record: Omit<CuringRecord, 'id'>) => void;
  onCompleteCuring: (recordId: string, data: any) => void;
  onCompletePackaging: (record: Omit<PackagingRecord, 'id'>) => void;
}
```

**Drying Workflow:**
```typescript
// Start drying
{
  batchId: string;
  dryingRoomId: string;
  startDate: string;
  wetWeight: number;           // From harvest
  targetHumidity: number;      // 60% RH ideal
  targetTemperature: number;   // 60°F ideal
}

// Complete drying
{
  endDate: string;
  dryWeight: number;           // 70-80% weight loss expected
  finalHumidity: number;
  finalTemperature: number;
  notes?: string;
}
```

**Curing Workflow:**
```typescript
// Start curing
{
  batchId: string;
  startDate: string;
  initialWeight: number;       // Dry weight from drying
  jarType: string;            // Container type
  targetDuration: number;     // Days (14-56 typical)
}

// Complete curing
{
  endDate: string;
  finalWeight: number;
  qualityNotes: string;       // Aroma, appearance, etc.
}
```

**Packaging Workflow:**
```typescript
{
  batchId: string;
  packageDate: string;
  finalWeight: number;
  metrcPackageTag: string;    // Unique package ID
  packageType: string;        // Jar, bag, etc.
  lotNumber: string;
  packager: string;
}
```

---

## Management Components

### CultivarManagement
**File:** `/components/CultivarManagement.tsx`  
**Purpose:** Cannabis strain library with full CRUD operations.

**Features:**
- Grid of cultivar cards with key info (THC, type, genetics)
- "Create Cultivar" button opens form
- Edit/Archive buttons on each card
- Filter by strain type (Indica/Sativa/Hybrid)
- Search by strain name

**Props:**
```typescript
interface CultivarManagementProps {
  cultivars: Cultivar[];
  onCreateCultivar: (cultivar: Omit<Cultivar, 'id' | 'createdAt'>) => void;
  onUpdateCultivar: (id: string, data: Partial<Cultivar>) => void;
}
```

**Create Cultivar Form Fields:**
- Name (required) - e.g., "Blue Dream"
- Type - seed or clone
- Strain Type - Indica/Sativa/Hybrid/Indica-Dominant/Sativa-Dominant
- Genetics - e.g., "Blueberry x Haze"
- Description - Free text
- THC Range - Min/Max percentage
- CBD Range - Min/Max percentage
- Terpene Profile - Multi-select (Myrcene, Limonene, Caryophyllene, etc.)
- Flowering Time - Days to harvest
- Expected Yield - Grams per plant
- Growth Characteristics - Stretch, branching, etc.

**Cultivar Card Display:**
- Strain name and genetics
- THC/CBD ranges with badges
- Dominant terpenes list
- Flowering time and expected yield
- Active/Archived status toggle
- Batches using this cultivar count

---

### RoomCapacityMonitor
**File:** `/components/RoomCapacityMonitor.tsx`  
**Purpose:** Real-time monitoring of room capacity across all pods.

**Features:**
- Grid of pod cards organized by room type
- Capacity bar with color coding:
  - Green: < 75% capacity
  - Yellow: 75-90% capacity
  - Red: > 90% capacity
- Current plant count vs. maximum capacity
- Canopy area utilization (if applicable)
- Lighting specifications

**Props:**
```typescript
interface RoomCapacityMonitorProps {
  pods: Pod[];
  batches: Batch[];            // To calculate current occupancy
}
```

**Calculated Metrics:**
- `currentPlantCount` - Sum of all batches in this pod
- `utilizationPercentage` - (current / capacity) * 100
- `availableSpace` - capacity - currentPlantCount
- `canopyUtilization` - (usedCanopyArea / canopyArea) * 100

**Visual Indicators:**
- Progress bar showing capacity
- Warning icon if over capacity
- Plant count text: "45 / 100 plants"
- Canopy text: "320 / 500 sq ft"

---

### BulkBatchOperations
**File:** `/components/BulkBatchOperations.tsx`  
**Purpose:** Perform operations on multiple batches simultaneously.

**Features:**
- Batch selection table with checkboxes
- Two operation types:
  1. Bulk Stage Update - Change stage for all selected
  2. Bulk Location Move - Move all selected to new pod(s)
- Authorization field (compliance manager name)
- Confirmation dialog before execution

**Props:**
```typescript
interface BulkBatchOperationsProps {
  batches: Batch[];
  pods: Pod[];
  onBulkStageUpdate: (batchIds: string[], newStage: BatchStage, authorizedBy: string) => void;
  onBulkLocationUpdate: (batchIds: string[], podIds: string[], authorizedBy: string) => void;
}
```

**Use Cases:**
- Move entire grow cycle from veg to flower at once
- Relocate all batches from one room to another (room maintenance)
- Transition multiple harvests to drying simultaneously
- Emergency quarantine of multiple related batches

**Validation:**
- At least one batch must be selected
- Authorization field required
- Stage transition must be logical (can't skip stages)
- Destination pod must have capacity

---

### BatchGroupManagement
**File:** `/components/BatchGroupManagement.tsx`  
**Purpose:** Create and manage logical groupings of batches.

**Features:**
- List of existing groups with batch count
- "Create Group" button opens form
- Expand group to see member batches
- Add/remove batches from group
- Delete group (doesn't delete batches)

**Props:**
```typescript
interface BatchGroupManagementProps {
  groups: BatchGroup[];
  batches: Batch[];
  onCreateGroup: (data: { name: string; description: string; batchIds: string[] }) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddBatchToGroup: (groupId: string, batchId: string) => void;
  onRemoveBatchFromGroup: (groupId: string, batchId: string) => void;
}
```

**Create Group Form:**
- Group name (required)
- Description (optional)
- Batch selection (multi-select checkboxes)

**Group Card:**
- Group name and description
- Member batch count
- List of batches with quick view
- "Add Batch" button (dropdown selector)
- "Delete Group" button (with confirmation)

---

### QuarantineManagement
**File:** `/components/QuarantineManagement.tsx`  
**Purpose:** Quarantine and release batches for quality control.

**Features:**
- Quarantine button with reason input
- Authorized personnel field
- Date/time stamp automatic
- Visual warning for quarantined batches
- Release button (only for compliance manager)
- Release notes field

**Props:**
```typescript
interface QuarantineManagementProps {
  batch: Batch;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onRelease: (batchId: string, authorizedBy: string, notes: string) => void;
}
```

**Quarantine Reasons:**
- Failed pesticide testing
- Failed microbial testing
- Failed heavy metals testing
- Suspected contamination
- Plant count discrepancy investigation
- Quality assurance hold

**Quarantine Effects:**
- Batch cannot be moved to next stage
- Batch cannot be harvested
- Batch appears with warning badge in all views
- Requires investigation and documentation
- May result in waste disposal if cannot be remediated

---

## Display Components

### BatchTimeline
**File:** `/components/BatchTimeline.tsx`  
**Purpose:** Chronological display of all batch events with filtering.

**Features:**
- Vertical timeline with event cards
- Event type badges with colors
- Date/time stamps
- Event descriptions
- Evidence thumbnails (photos/documents)
- Filter dropdown (All | Stage Changes | Alarms | QA Checks | Notes)
- "Add Note" button

**Props:**
```typescript
interface BatchTimelineProps {
  events: TimelineEvent[];
  onAddNote: (batchId: string, note: string, evidence?: File[]) => void;
}
```

**Event Card Layout:**
- Left: Colored icon based on type
- Center: Description and metadata
- Right: Timestamp
- Bottom: Evidence thumbnails (if any)

**Event Types & Colors:**
- `stage_change` - Blue (Info)
- `alarm` - Red (Alert)
- `override` - Orange (Warning)
- `note` - Gray (Neutral)
- `qa_check` - Green (Success)

---

### BatchMetricsPanel
**File:** `/components/BatchMetricsPanel.tsx`  
**Purpose:** Visualize environmental data and batch performance.

**Features:**
- Line charts for temperature over time
- Line charts for humidity over time
- VPD (Vapor Pressure Deficit) calculation and chart
- Summary cards with min/avg/max values
- Date range selector

**Props:**
```typescript
interface BatchMetricsPanelProps {
  batch: Batch;
  metrics: BatchMetrics;       // Historical data points
}
```

**Metrics Displayed:**
```typescript
{
  temperature: { min: 68, avg: 75, max: 82 },  // Fahrenheit
  humidity: { min: 45, avg: 55, max: 65 },     // Percentage
  vpd: { min: 0.8, avg: 1.2, max: 1.6 }        // kPa
}
```

**Chart Library:** Recharts
- Line chart with gradient fill
- Tooltip on hover
- Responsive width
- Grid lines for readability

---

### BatchGenealogyView
**File:** `/components/BatchGenealogyView.tsx`  
**Purpose:** Display parent/child relationships between batches.

**Features:**
- Tree diagram showing batch ancestry
- Source type badge (seed, clone, mother plant)
- Parent batch link (clickable)
- Generation number
- Seed vendor and lot number (if from seed)
- Mother plant ID (if from clone)

**Props:**
```typescript
interface BatchGenealogyViewProps {
  genealogy: BatchGenealogy | null;
  batches: Batch[];            // All batches to lookup parents
}
```

**Genealogy Data:**
```typescript
{
  batchId: string;
  source: 'seed' | 'clone' | 'mother_plant';
  parentBatchId?: string;      // If cloned from previous batch
  seedVendor?: string;         // If from seed
  seedLotNumber?: string;
  motherPlantId?: string;      // Specific plant used for cloning
  generationNumber?: number;   // F1, F2, F3, etc.
  notes?: string;
}
```

---

### BatchStageTransition
**File:** `/components/BatchStageTransition.tsx`  
**Purpose:** Controls for moving batch to next stage with validation.

**Features:**
- Current stage display with badge
- "Next Stage" button
- Stage progression arrows
- Validation messages
- Required SOP completion checks

**Props:**
```typescript
interface BatchStageTransitionProps {
  batch: Batch;
  onTransition: (batchId: string, newStage: BatchStage) => void;
}
```

**Stage Progression Rules:**
1. propagation → vegetative (no requirements)
2. vegetative → flowering (MUST complete PlantTaggingWorkflow)
3. flowering → harvest (minimum days in flower, typically 56+)
4. harvest → drying (MUST complete HarvestWorkflow)
5. drying → curing (minimum 7 days drying)
6. curing → closed (minimum 14 days curing, PackagingWorkflow complete)

**Blocked Transitions:**
- Quarantined batches cannot transition
- Missing required SOP completion
- Pod capacity exceeded at destination
- Plant count validation failures

---

### PlantCountTracking
**File:** `/components/PlantCountTracking.tsx`  
**Purpose:** Record and display daily plant count snapshots.

**Features:**
- "Record Count" button opens form
- Table of historical counts
- Discrepancy highlighting (red if counts don't match)
- Immature lot tracking (up to 100 plants)
- Individual plant tracking (flowering stage)
- Mother plant count

**Props:**
```typescript
interface PlantCountTrackingProps {
  batch: Batch;
  snapshots: PlantCountSnapshot[];
  onRecordCount: (snapshot: Omit<PlantCountSnapshot, 'id' | 'timestamp'>) => void;
}
```

**Count Record Form:**
```typescript
{
  batchId: string;
  immatureLotCount?: number;      // Untagged plants
  individualTaggedCount?: number; // Tagged flowering plants
  motherPlantCount?: number;      // Mother plants
  recordedBy: string;
  notes?: string;
  discrepancyReason?: string;     // If count doesn't match expected
}
```

**Compliance Importance:**
- State inspectors verify physical counts match Metrc
- Daily counts required by most state regulations
- Discrepancies trigger investigations
- Repeated discrepancies risk license suspension

---

### WasteLogDashboard
**File:** `/components/WasteLogDashboard.tsx`  
**Purpose:** View and manage all waste disposal logs with approval workflow.

**Features:**
- Table of all waste logs
- Status filter (All | Pending | Approved | Rejected | Reported to Metrc)
- "Log New Waste" button (opens WasteDisposalWorkflow)
- Approve/Reject buttons (compliance manager only)
- Evidence viewer (photos of waste disposal)
- Export to CSV for audits

**Props:**
```typescript
interface WasteLogDashboardProps {
  wasteLogs: WasteLog[];
  onCreateNew: () => void;
  onApprove: (logId: string, reviewedBy: string, reviewNotes: string) => void;
  onReject: (logId: string, reviewedBy: string, reviewNotes: string) => void;
  userRole: 'technician' | 'compliance_manager';
}
```

**Waste Log Table Columns:**
- Date Created
- Batch (if applicable)
- Waste Type (plant_material, trim, other)
- Weight (grams)
- Reason
- Created By
- Status (badge with color)
- Actions (Approve/Reject buttons)

**Status Workflow:**
1. `pending_approval` - Yellow badge, awaiting review
2. `reported_to_metrc` - Green badge, approved and synced
3. `rejected` - Red badge, must create new log

---

### EvidenceCapture
**File:** `/components/EvidenceCapture.tsx`  
**Purpose:** Upload photos and documents for compliance documentation.

**Features:**
- Drag-and-drop file upload
- File preview thumbnails
- Multiple file support
- Description field for each file
- Submit button
- Progress indicator during upload

**Props:**
```typescript
interface EvidenceCaptureProps {
  onSubmit: (evidence: { files: File[]; description: string }) => void;
  onCancel: () => void;
}
```

**Supported File Types:**
- Images: .jpg, .jpeg, .png, .heic
- Documents: .pdf
- Maximum size: 10MB per file

**Use Cases:**
- Document waste disposal (required by SOP-003)
- QA check photos
- Pest infestation evidence
- Compliance violations documentation
- Before/after photos for remediation

---

## Component Props Reference

### Common Prop Patterns

**Batch Props:**
```typescript
batch: Batch  // Single batch object
batches: Batch[]  // Array of batches
```

**Callback Props (follow onAction naming):**
```typescript
onCreateBatch: (data: BatchData) => void
onUpdateBatch: (id: string, data: Partial<Batch>) => void
onDeleteBatch: (id: string) => void
onSelectBatch: (batch: Batch) => void
```

**Resource Arrays:**
```typescript
pods: Pod[]          // Physical locations
cultivars: Cultivar[]  // Strain library
groups: BatchGroup[]   // Batch groupings
wasteLogs: WasteLog[]  // Waste records
events: TimelineEvent[]  // Activity log
```

**Workflow Callbacks:**
```typescript
onComplete: (data: RecordType) => void  // Complete workflow successfully
onCancel: () => void  // Exit without saving
onSubmit: (data: FormData) => void  // Submit form data
onClose: () => void  // Close dialog/modal
```

### Props Drilling Pattern

Data flows from App.tsx down through components:

```
App.tsx
  ├─ batches state
  ├─ setBatches function
  └─ handleCreateBatch function
      ↓
  BatchDashboard
    ├─ batches (read-only)
    ├─ onCreateBatch callback
    └─ onSelectBatch callback
        ↓
    CreateBatchDialog
      └─ onCreateBatch callback
          ↓
      (User submits form)
          ↓
      handleCreateBatch executes in App.tsx
          ↓
      setBatches updates state
          ↓
      All components re-render with new data
```

---

## Component Communication Patterns

### 1. Parent-to-Child (Props)
Parent passes data down:
```typescript
<BatchDetailView batch={selectedBatch} pods={mockPods} />
```

### 2. Child-to-Parent (Callbacks)
Child triggers parent action:
```typescript
<HarvestWorkflow onComplete={(record) => handleCompleteHarvest(record)} />
```

### 3. Sibling Communication
Siblings communicate through shared parent state:
```typescript
// Component A updates state via callback
<CreateBatchDialog onCreateBatch={(data) => setBatches([...batches, data])} />

// Component B receives updated state
<BatchDashboard batches={batches} />
```

---

## Styling Patterns

### Tailwind Class Conventions
- **Spacing:** Use `p-4` (padding), `m-4` (margin), `gap-4` (flex/grid gap)
- **Layout:** Use `flex`, `grid`, `flex-col`, `items-center`, `justify-between`
- **Colors:** Use semantic classes like `text-gray-600`, `bg-blue-50`, `border-gray-200`
- **Responsive:** Use `sm:`, `md:`, `lg:` prefixes for breakpoints

### Cannabis-Specific Colors
- **Propagation:** green-500 (clones/seedlings)
- **Vegetative:** blue-500 (growing plants)
- **Flowering:** purple-500 (flowering stage)
- **Harvest:** orange-500 (harvest operations)
- **Drying:** amber-500 (drying process)
- **Curing:** emerald-500 (curing process)
- **Quarantine:** red-500 (warning status)

### shadcn/ui Component Usage
Prefer shadcn components over custom HTML:
```typescript
// Use shadcn Button
<Button variant="default" onClick={handleClick}>Submit</Button>

// Use shadcn Card
<Card>
  <CardHeader>
    <CardTitle>Batch Details</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

---

## Error Handling Patterns

### Form Validation
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  
  if (!batchName) newErrors.name = 'Batch name is required';
  if (plantCount <= 0) newErrors.plantCount = 'Plant count must be greater than 0';
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Toast Notifications
```typescript
// Success
toast.success('Batch created successfully');

// Error
toast.error('Failed to create batch: Invalid data');

// Warning
toast.warning('Batch approaching capacity limit');

// Info (long duration)
toast.success('Harvest reported to Metrc', { duration: 5000 });
```

---

## Performance Considerations

### Component Optimization
- Most components are lightweight (<300 lines)
- No heavy computations in render
- Filtering/searching done on small datasets (<1000 items)

### Future Optimization Opportunities
- Add `React.memo` for expensive list items
- Use `useCallback` for callback props
- Implement virtualization for large lists (react-window)
- Add pagination for tables with 100+ rows

---

For architecture overview, see **PLATFORM_OVERVIEW.md**.  
For TypeScript types, see **TYPE_SYSTEM.md**.  
For data flow patterns, see **DATA_FLOW.md**.
