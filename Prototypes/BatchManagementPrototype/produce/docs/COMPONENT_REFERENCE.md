# Component Reference Guide

## Table of Contents
1. [Dashboard Components](#dashboard-components)
2. [Workflow Components](#workflow-components)
3. [Management Components](#management-components)
4. [Supporting Components](#supporting-components)
5. [Component Props Reference](#component-props-reference)

## Dashboard Components

### BatchDashboard

**Purpose:** Main landing page showing all batches with filtering and search capabilities.

**Location:** `/components/BatchDashboard.tsx`

**Props:**
```typescript
{
  batches: Batch[];
  onCreateBatch: () => void;
  onSelectBatch: (batch: Batch) => void;
}
```

**Features:**
- Displays batches in card grid layout
- Shows key metrics: total batches, active batches, total plants, harvest-ready
- Filter by stage (all, propagation, vegetative, flowering, harvest, post-harvest)
- Search by batch name or variety
- Color-coded stage badges
- Quarantine status indicators
- Plant count and location display
- Click to view batch details

**Key Functions:**
- `filterBatches()` - Applies stage and search filters
- Metric calculations (total plants, harvest-ready count)

---

### BatchDetailView

**Purpose:** Comprehensive detailed view of a single batch with tabbed interface.

**Location:** `/components/BatchDetailView.tsx`

**Props:**
```typescript
{
  batch: Batch;
  pods: GrowingArea[];
  events: TimelineEvent[];
  plants: Plant[];
  dryingRooms: DryingRoom[];
  availableTags: Label[];
  genealogy: GenealogyRecord | null;
  plantCountSnapshots: PlantCountSnapshot[];
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  onBack: () => void;
  onStageTransition: (batchId: string, newStage: BatchStage) => void;
  onAddEvidence: (batchId: string, evidence: Evidence) => void;
  onCompleteHarvest: (record: HarvestRecord) => void;
  onCompleteTagging: (session: TaggingSession) => void;
  onRecordPlantCount: (snapshot: PlantCountSnapshot) => void;
  onStartDrying: (record: DryingRecord) => void;
  onCompleteDrying: (recordId: string, data: any) => void;
  onStartCuring: (record: CuringRecord) => void;
  onCompleteCuring: (recordId: string, data: any) => void;
  onCompletePackaging: (record: PackagingRecord) => void;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onReleaseQuarantine: (batchId: string, authorizedBy: string, notes: string) => void;
}
```

**Features:**
- Header with batch name, variety, stage badge, quarantine alert
- Back navigation button
- Tabbed interface:
  - **Overview** - Metrics panel, timeline, genealogy
  - **Details** - Growing areas, plant counts, dates
  - **Harvest** - Harvest workflow (when stage is harvest)
  - **Labeling** - Plant tagging workflow
  - **Post-Harvest** - Drying, curing, packaging
  - **Evidence** - Photo/document uploads
- Stage transition controls
- Quarantine management

**Tabs:**
1. **Overview Tab** - Shows BatchMetricsPanel, BatchTimeline, BatchGenealogyView
2. **Details Tab** - Location info, plant count tracking, key dates
3. **Harvest Tab** - HarvestWorkflow component (visible in harvest stage)
4. **Labeling Tab** - PlantTaggingWorkflow component
5. **Post-Harvest Tab** - PostHarvestProcessing component
6. **Evidence Tab** - EvidenceCapture component

---

### WasteLogDashboard

**Purpose:** View and manage waste disposal logs with approval workflow.

**Location:** `/components/WasteLogDashboard.tsx`

**Props:**
```typescript
{
  wasteLogs: WasteLog[];
  onCreateNew: () => void;
  onApprove: (logId: string, reviewedBy: string, notes: string) => void;
  onReject: (logId: string, reviewedBy: string, notes: string) => void;
  userRole: 'technician' | 'compliance_manager';
}
```

**Features:**
- Summary metrics (total logs, pending approval, approved, rejected)
- Filter by status (all, pending, approved, rejected)
- Waste log cards with:
  - Waste type and reason
  - Quantity and method
  - Submitter and date
  - Status badge
  - Review controls (for compliance managers)
- Approval dialog with notes input
- Rejection dialog with reason input
- Role-based access control

**Workflow:**
1. Technician creates waste log (status: pending_approval)
2. Compliance manager reviews
3. Manager approves or rejects with notes
4. Approved logs are reported to traceability system

---

## Workflow Components

### CreateBatchDialog

**Purpose:** Modal dialog for creating new batches.

**Location:** `/components/CreateBatchDialog.tsx`

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  pods: GrowingArea[];
  onCreateBatch: (data: BatchFormData) => void;
}
```

**Form Fields:**
- Batch Name (text input, required)
- Variety (text input, required)
- Stage (select: propagation, vegetative, flowering, harvest, post_harvest)
- Start Date (date picker, required)
- Growing Areas (multi-select checkboxes)
- Plant Count (number input, min: 1)

**Validation:**
- All required fields must be filled
- Plant count must be positive
- At least one growing area must be selected

**Behavior:**
- Opens/closes based on `open` prop
- Clears form on close
- Calls `onCreateBatch` with form data
- Closes dialog after submission

---

### HarvestWorkflow

**Purpose:** Multi-step workflow for recording plant harvests.

**Location:** `/components/HarvestWorkflow.tsx`

**Props:**
```typescript
{
  batch: Batch;
  plants: Plant[];
  onCompleteHarvest: (record: HarvestRecord) => void;
}
```

**Steps:**
1. **Plant Selection** - Select which plants to harvest (checkboxes)
2. **Weight Entry** - Enter wet weight in kg
3. **Notes** - Add harvest notes (optional)
4. **Review** - Confirm harvest details

**Features:**
- Visual plant selection grid
- Plant status indicators (healthy, flowering, etc.)
- Running count of selected plants
- Weight validation (must be > 0)
- Multi-step progress indicator
- Back/Next navigation
- Submit button on final step

**Data Collected:**
- `batchId` - Source batch
- `plantIds` - Selected plant IDs
- `wetWeight` - Total harvest weight (kg)
- `notes` - Optional harvest notes
- `harvestDate` - Auto-generated timestamp
- `harvestedBy` - Current user

---

### WasteDisposalWorkflow

**Purpose:** Multi-step guided workflow for logging waste disposal.

**Location:** `/components/WasteDisposalWorkflow.tsx`

**Props:**
```typescript
{
  onSubmitForApproval: (log: WasteLog) => void;
  onCancel: () => void;
}
```

**Steps:**
1. **Source Selection** - Choose waste source (batch, facility, general)
2. **Waste Details** - Type, reason, quantity, method
3. **Evidence** - Upload photos and add notes
4. **Review** - Confirm all details

**Waste Types:**
- Plant material (trim, damaged plants)
- Soil and growing media
- Packaging materials
- Other waste

**Waste Reasons:**
- Crop failure
- Pest infestation
- Disease
- Quality control
- End of cycle
- Other

**Disposal Methods:**
- Compost
- Landfill disposal
- Incineration
- Recycling
- Other

**Features:**
- Step-by-step wizard interface
- Photo upload capability
- Weight/quantity tracking
- Reason and method documentation
- Review before submission
- Progress indicator

---

### PlantTaggingWorkflow

**Purpose:** Assign labels/tags to individual plants for tracking.

**Location:** `/components/PlantTaggingWorkflow.tsx`

**Props:**
```typescript
{
  batch: Batch;
  plants: Plant[];
  availableTags: Label[];
  onCompleteTagging: (session: TaggingSession) => void;
}
```

**Features:**
- Display available label inventory
- Select label type and range
- Assign labels to plants
- Track labeling progress
- Record labeling session metadata

**Label Types:**
- Barcode labels
- RFID tags
- QR code labels

**Workflow:**
1. Select label type
2. Enter label range (start - end)
3. Assign labels to plants
4. Record completion

**Data Tracked:**
- Labels used count
- Plants tagged count
- Session start/end time
- Operator name

---

### PostHarvestProcessing

**Purpose:** Manage drying, curing, and packaging workflows.

**Location:** `/components/PostHarvestProcessing.tsx`

**Props:**
```typescript
{
  batch: Batch;
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  dryingRooms: DryingRoom[];
  onStartDrying: (record: DryingRecord) => void;
  onCompleteDrying: (recordId: string, data: any) => void;
  onStartCuring: (record: CuringRecord) => void;
  onCompleteCuring: (recordId: string, data: any) => void;
  onCompletePackaging: (record: PackagingRecord) => void;
}
```

**Features:**

**Drying Tab:**
- Start new drying session
- Assign drying room
- Record initial weight and conditions
- Track drying progress
- Log environmental readings (temp, humidity)
- Complete drying with final weight

**Curing Tab:**
- Start curing process
- Select curing room/container
- Track duration and conditions
- Record periodic checks
- Complete with quality assessment

**Packaging Tab:**
- Package selection (bags, boxes, jars)
- Unit creation (individual packages)
- Weight per unit
- Label generation
- Final package count
- Traceability system reporting

---

### BatchStageTransition

**Purpose:** Controlled workflow for moving batches between lifecycle stages.

**Location:** `/components/BatchStageTransition.tsx`

**Props:**
```typescript
{
  batch: Batch;
  onTransition: (batchId: string, newStage: BatchStage) => void;
}
```

**Features:**
- Current stage display
- Next stage recommendation
- Stage options dropdown
- Confirmation dialog
- Validation rules (e.g., can't skip stages)
- Audit trail creation

**Stage Progression:**
```
propagation → vegetative → flowering → harvest → post_harvest
```

**Validations:**
- Prevents backwards transitions
- Ensures plant count recorded
- Checks location assignments
- Validates required data for each stage

---

## Management Components

### CultivarManagement

**Purpose:** CRUD operations for produce varieties/cultivars.

**Location:** `/components/CultivarManagement.tsx`

**Props:**
```typescript
{
  cultivars: ProduceVariety[];
  onCreateCultivar: (cultivar: ProduceVariety) => void;
  onUpdateCultivar: (id: string, data: Partial<ProduceVariety>) => void;
}
```

**Features:**
- Cultivar list with search and filter
- Create new variety dialog
- Edit existing varieties
- Archive/activate varieties
- View variety details:
  - Name, type (fruit/vegetable/herb)
  - Source (seed bank, nursery)
  - Characteristics (flavor, color, size)
  - Growing notes
  - Average yield expectations
  - Typical cycle length
  - Active status

**Create Form Fields:**
- Name (required)
- Type (fruit, vegetable, herb)
- Source (seed bank, nursery, cutting, other)
- Characteristics (description)
- Growing notes (optional)
- Average yield (kg)
- Cycle length (days)

**Actions:**
- Create new variety
- Edit variety details
- Archive variety (soft delete)
- Reactivate archived variety

---

### BatchGroupManagement

**Purpose:** Create and manage batch groups (pods) for coordinated operations.

**Location:** `/components/BatchGroupManagement.tsx`

**Props:**
```typescript
{
  groups: BatchGroup[];
  batches: Batch[];
  onCreateGroup: (data: { name: string; description: string; batchIds: string[] }) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddBatchToGroup: (groupId: string, batchId: string) => void;
  onRemoveBatchFromGroup: (groupId: string, batchId: string) => void;
}
```

**Features:**
- List all batch groups
- Create new group with name and description
- Add batches to group
- Remove batches from group
- Delete entire group
- View group details:
  - Group name
  - Description
  - Member batches
  - Total plant count
  - Creation date

**Use Cases:**
- Group batches by planting week
- Coordinate harvest schedules
- Manage customer orders
- Run trials/experiments

**Create Group Dialog:**
- Group name (required)
- Description (optional)
- Select batches to include (multi-select)

---

### BulkBatchOperations

**Purpose:** Perform operations on multiple batches simultaneously.

**Location:** `/components/BulkBatchOperations.tsx`

**Props:**
```typescript
{
  batches: Batch[];
  pods: GrowingArea[];
  onBulkStageUpdate: (batchIds: string[], newStage: BatchStage, authorizedBy: string) => void;
  onBulkLocationUpdate: (batchIds: string[], growingAreaIds: string[], authorizedBy: string) => void;
}
```

**Features:**
- Batch selection interface (checkboxes)
- Filter batches by stage
- Search batches
- Bulk operations:
  - Update stage for all selected
  - Move to new location(s)
  - Bulk quarantine (future)
- Authorization field (who approved the operation)
- Confirmation dialog with impact preview
- Selected batch count display

**Workflow:**
1. Filter/search for batches
2. Select target batches (checkboxes)
3. Choose operation type
4. Configure operation parameters
5. Enter authorization
6. Confirm changes
7. All selected batches update

**Safety Features:**
- Shows selected batch count
- Preview changes before applying
- Requires authorization
- Confirmation dialog
- Undo not supported (use caution)

---

### RoomCapacityMonitor

**Purpose:** Real-time monitoring of facility capacity and plant distribution.

**Location:** `/components/RoomCapacityMonitor.tsx`

**Props:**
```typescript
{
  pods: GrowingArea[];
  batches: Batch[];
}
```

**Features:**
- Grid display of all growing areas
- Capacity visualization (progress bars)
- Occupancy percentage
- Over-capacity warnings
- Under-utilized alerts
- Filter by room type (greenhouse, indoor, field)
- Sort by occupancy, capacity, or name

**Room Card Display:**
- Room name and type
- Current occupancy / Total capacity
- Visual progress bar:
  - Green: < 80% capacity
  - Yellow: 80-100% capacity
  - Red: > 100% capacity (over)
- Batches assigned to room (list)
- Plant count breakdown by batch

**Calculations:**
- `currentOccupancy` = Sum of plantCount for all batches in room
- `utilizationRate` = (currentOccupancy / capacity) × 100
- `availableSpace` = capacity - currentOccupancy

**Alerts:**
- Over-capacity (red badge)
- Near capacity (yellow badge)
- Empty room (gray badge)

---

## Supporting Components

### BatchTimeline

**Purpose:** Visual timeline of all batch events and state changes.

**Location:** `/components/BatchTimeline.tsx`

**Props:**
```typescript
{
  events: TimelineEvent[];
}
```

**Features:**
- Chronological event display (newest first)
- Event type icons
- Color-coded event types
- Timestamp formatting
- Event descriptions
- User attribution (who performed action)
- Related data (e.g., weights, locations)

**Event Types:**
- Batch created
- Stage transitioned
- Harvest completed
- Plant count recorded
- Location changed
- Quarantine applied/released
- Evidence added
- Notes added

**Event Card:**
- Icon (based on event type)
- Event title
- Description
- Timestamp (relative: "2 hours ago")
- User name
- Additional details (expandable)

---

### BatchGenealogyView

**Purpose:** Display parent-child relationships and batch origins.

**Location:** `/components/BatchGenealogyView.tsx`

**Props:**
```typescript
{
  genealogy: GenealogyRecord | null;
}
```

**Features:**
- Source type display (seed, transplant, cutting)
- Parent batch information (if applicable)
- Source details (vendor, lot number)
- Germination date
- Generation number
- Visual family tree (future enhancement)

**Source Types:**

**Seed:**
- Seed lot number
- Seed bank/vendor
- Germination date
- Seed count

**Transplant:**
- Parent batch ID and name
- Transplant date
- Number of transplants
- Parent variety

**Cutting:**
- Parent batch ID and name
- Cutting date
- Number of cuttings
- Parent plant ID

---

### BatchMetricsPanel

**Purpose:** Key performance indicators for a batch.

**Location:** `/components/BatchMetricsPanel.tsx`

**Props:**
```typescript
{
  batch: Batch;
  plants: Plant[];
}
```

**Metrics Displayed:**
- **Total Plants:** Current plant count
- **Days in Stage:** Time in current stage
- **Total Cycle Days:** Days since batch start
- **Harvest Progress:** Percentage harvested (if in harvest)
- **Yield to Date:** Total kg harvested
- **Health Status:** Percentage of healthy plants
- **Location Count:** Number of rooms occupied

**Visual Elements:**
- Metric cards with icons
- Large numbers with labels
- Progress bars where applicable
- Color indicators (green = good, yellow = warning, red = alert)

**Calculations:**
- `daysInStage` = Today - stageStartDate
- `cycleDays` = Today - batchStartDate
- `healthRate` = (healthyPlants / totalPlants) × 100
- `harvestProgress` = (harvestedPlants / totalPlants) × 100

---

### PlantCountTracking

**Purpose:** Record and display plant count snapshots over time.

**Location:** `/components/PlantCountTracking.tsx`

**Props:**
```typescript
{
  batch: Batch;
  snapshots: PlantCountSnapshot[];
  onRecordCount: (snapshot: PlantCountSnapshot) => void;
}
```

**Features:**
- Record new plant count
- View count history (table)
- Chart of count over time
- Count by stage breakdown
- Discrepancy detection
- Count verification workflow

**Record Count Form:**
- Stage (current batch stage)
- Total count
- Count by category:
  - Healthy plants
  - Flowering plants
  - Damaged plants
  - Quarantined plants
- Location (growing area)
- Counted by (user name)
- Notes (optional)

**History Display:**
- Date/time of count
- Total count
- Stage at time of count
- Count breakdown
- Who counted
- Variance from previous count

---

### QuarantineManagement

**Purpose:** Place batches in quarantine and manage release.

**Location:** `/components/QuarantineManagement.tsx`

**Props:**
```typescript
{
  batch: Batch;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onReleaseQuarantine: (batchId: string, authorizedBy: string, notes: string) => void;
}
```

**Features:**

**Quarantine Action:**
- Quarantine reason (dropdown):
  - Pest infestation
  - Disease detected
  - Contamination
  - Quality issues
  - Testing required
  - Other (specify)
- Detailed notes
- Authorization (supervisor name)
- Timestamp auto-recorded

**Release Action:**
- Review quarantine reason
- Enter resolution notes
- Confirm corrective actions taken
- Authorization (supervisor name)
- Release timestamp

**Quarantine Status Display:**
- Alert banner on batch (red)
- Quarantine reason
- Date quarantined
- Who initiated quarantine
- Days in quarantine
- Release button (supervisor only)

**Restrictions:**
- Quarantined batches cannot:
  - Transition stages
  - Be harvested
  - Be moved (without authorization)
  - Be included in bulk operations

---

### EvidenceCapture

**Purpose:** Upload photos and documents to support batch records.

**Location:** `/components/EvidenceCapture.tsx`

**Props:**
```typescript
{
  batch: Batch;
  onAddEvidence: (batchId: string, evidence: Evidence) => void;
}
```

**Features:**
- Photo upload (drag-and-drop or file picker)
- Document upload (PDFs, etc.)
- Evidence type selection:
  - Plant health photo
  - Pest/disease documentation
  - Harvest photo
  - Quality check
  - Environmental reading
  - Other
- Description/notes
- Timestamp auto-recorded
- User attribution

**Evidence Types:**
```typescript
{
  type: 'photo' | 'document' | 'video';
  category: 'plant_health' | 'pest_disease' | 'harvest' | 'quality' | 'environmental' | 'other';
  description: string;
  files: File[];
  timestamp: string;
  uploadedBy: string;
}
```

**Upload Process:**
1. Select evidence type
2. Choose files
3. Add description
4. Upload
5. Evidence attached to batch record

---

## Component Props Reference

### Common Prop Patterns

**Batch Props:**
```typescript
batch: Batch                    // Single batch object
batches: Batch[]               // Array of batches
```

**Callback Props:**
```typescript
onCreateBatch: (data) => void           // Create new batch
onUpdateBatch: (id, data) => void       // Update batch
onSelectBatch: (batch) => void          // Navigate to batch
onStageTransition: (id, stage) => void  // Change stage
```

**Data Props:**
```typescript
plants: Plant[]                        // Plant inventory
pods: GrowingArea[]                    // Growing locations
cultivars: ProduceVariety[]            // Variety catalog
wasteLogs: WasteLog[]                  // Waste records
```

**UI Control Props:**
```typescript
open: boolean                  // Dialog/modal open state
onClose: () => void           // Close handler
onBack: () => void            // Navigation back
onCancel: () => void          // Cancel action
```

### Type Definitions Location

All prop types are defined in `/types` directory:
- `Batch` → `types/batch.ts`
- `Plant` → `types/harvest.ts`
- `WasteLog` → `types/waste.ts`
- `ProduceVariety` → `types/cultivar.ts`
- `PlantCountSnapshot` → `types/plant-tracking.ts`
- `DryingRecord`, `CuringRecord`, `PackagingRecord` → `types/post-harvest.ts`

See [TYPE_SYSTEM.md](./TYPE_SYSTEM.md) for complete type definitions.
