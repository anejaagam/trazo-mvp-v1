# Produce Batch Management System - Platform Overview

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Core Concepts](#core-concepts)
5. [Data Flow](#data-flow)
6. [Key Features](#key-features)
7. [Technology Stack](#technology-stack)

## Introduction

The Produce Batch Management System is a comprehensive agricultural tracking platform designed for produce cultivation facilities. It manages the entire lifecycle of produce batches from seed to harvest, including variety management, plant counting, harvest workflows, post-harvest processing, waste disposal, and compliance tracking.

### Purpose
- Track produce batches through all growth stages (propagation, vegetative, flowering, harvest, post-harvest)
- Manage cultivar/variety information and genealogy
- Monitor facility capacity and room allocation
- Implement standardized SOPs for labeling, harvesting, and waste disposal
- Support bulk operations and batch grouping
- Maintain quarantine and quality control processes

### Target Users
- Cultivation technicians
- Facility managers
- Compliance officers
- Quality assurance teams

## Architecture

### Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                      App.tsx                             │
│                  (Main Application)                      │
│  - State Management                                      │
│  - Event Handlers                                        │
│  - Navigation/Routing                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       │                               │
┌──────▼──────┐                 ┌──────▼──────┐
│ Components  │                 │    Types    │
│             │                 │             │
│ - Dashboard │◄────────────────┤ - batch.ts  │
│ - Workflows │                 │ - harvest.ts│
│ - Forms     │                 │ - waste.ts  │
│ - Monitors  │                 │ - etc.      │
└──────┬──────┘                 └─────────────┘
       │
       │
┌──────▼──────┐
│  Mock Data  │
│             │
│ - Batches   │
│ - Cultivars │
│ - Facilities│
│ - Compliance│
└─────────────┘
```

### Design Patterns

**1. Centralized State Management**
- All state lives in `App.tsx`
- Props drilling for data and callbacks
- Single source of truth for application data

**2. Component Composition**
- Small, focused components
- Reusable UI components from shadcn/ui
- Separation of concerns (presentation vs. logic)

**3. Type Safety**
- TypeScript throughout
- Comprehensive type definitions in `/types`
- Interface-based contracts between components

## File Structure

### Root Level
```
/App.tsx                    # Main application component
/Attributions.md           # Third-party attributions
/DATA_STRUCTURES.md        # Data model documentation
```

### Components (`/components`)

#### Core Components
- `BatchDashboard.tsx` - Main batch listing and overview
- `BatchDetailView.tsx` - Detailed batch view with tabs
- `CreateBatchDialog.tsx` - Batch creation form
- `BatchStageTransition.tsx` - Stage progression workflow

#### Workflow Components
- `HarvestWorkflow.tsx` - Plant selection and harvest recording
- `WasteDisposalWorkflow.tsx` - Multi-step waste disposal process
- `PlantTaggingWorkflow.tsx` - Label assignment to plants
- `PostHarvestProcessing.tsx` - Drying, curing, packaging workflows

#### Management Components
- `CultivarManagement.tsx` - Variety/cultivar CRUD operations
- `BatchGroupManagement.tsx` - Pod/group organization
- `BulkBatchOperations.tsx` - Batch operations at scale
- `RoomCapacityMonitor.tsx` - Facility capacity tracking

#### Supporting Components
- `BatchTimeline.tsx` - Event history visualization
- `BatchGenealogyView.tsx` - Parent/source tracking
- `BatchMetricsPanel.tsx` - Key performance indicators
- `PlantCountTracking.tsx` - Plant count snapshots
- `QuarantineManagement.tsx` - Quality control workflows
- `EvidenceCapture.tsx` - Photo/document uploads
- `WasteLogDashboard.tsx` - Waste log review and approval
- `ComplianceDashboard.tsx` - PrimusGFS compliance metrics (for future use)

#### UI Components (`/components/ui`)
shadcn/ui component library providing:
- Forms: `input`, `select`, `textarea`, `checkbox`, `radio-group`, `calendar`
- Layout: `card`, `tabs`, `dialog`, `sheet`, `accordion`, `separator`
- Feedback: `alert`, `toast`, `progress`, `skeleton`
- Data: `table`, `badge`, `avatar`, `chart`
- Navigation: `button`, `dropdown-menu`, `breadcrumb`

### Types (`/types`)

```typescript
batch.ts              # Batch, BatchStage, BatchGroup, GrowingArea
harvest.ts            # HarvestRecord, Plant, PlantStatus
waste.ts              # WasteLog, WasteReason, WasteMethod
cultivar.ts           # ProduceVariety, GenealogyRecord
plant-tracking.ts     # PlantCountSnapshot, PlantCountByStage
post-harvest.ts       # DryingRecord, CuringRecord, PackagingRecord
tagging.ts            # TaggingSession, Label
compliance.ts         # PrimusGFS compliance types (for future use)
```

### Mock Data (`/lib`)

```typescript
mock-data.ts                  # Batches, growing areas, groups, timeline events
harvest-mock-data.ts          # Plants, harvest records, facilities
waste-mock-data.ts            # Waste logs and disposal records
cultivar-mock-data.ts         # Varieties and genealogy
plant-tracking-mock-data.ts   # Plant count snapshots
tagging-mock-data.ts          # Labels and tagging sessions
compliance-mock-data.ts       # Compliance records (for future use)
```

## Core Concepts

### 1. Batch
A batch represents a group of plants of the same variety being grown together.

**Key Properties:**
- `id` - Unique identifier
- `name` - Display name (e.g., "Tomato-001")
- `variety` - Cultivar name
- `stage` - Current growth stage
- `plantCount` - Number of plants
- `growingAreaIds` - Assigned rooms/areas
- `quarantineStatus` - Quality control status

**Lifecycle Stages:**
1. `propagation` - Seed/cutting stage
2. `vegetative` - Growth stage
3. `flowering` - Reproductive stage
4. `harvest` - Collection stage
5. `post_harvest` - Processing stage

### 2. Growing Area (Room/Pod)
Physical locations where batches are cultivated.

**Properties:**
- `id`, `name`, `type` (greenhouse, indoor, field)
- `capacity` - Max plant count
- `currentOccupancy` - Current plant count
- `environment` - Temperature, humidity, light settings

### 3. Batch Group
Logical grouping of related batches for coordinated management.

**Use Cases:**
- Same planting week
- Same customer order
- Same processing schedule
- Trial/experiment grouping

### 4. Produce Variety (Cultivar)
Genetic variety/strain information.

**Properties:**
- `name`, `type` (fruit, vegetable, herb)
- `source` (seed bank, nursery, etc.)
- `characteristics` (flavor, color, growing notes)
- `averageYield`, `typicalCycleLength`
- `isActive` - Archive inactive varieties

### 5. Plant Count Tracking
Snapshot-based counting system for inventory accuracy.

**Triggers:**
- Stage transitions
- Room transfers
- Harvest events
- Scheduled audits

### 6. Genealogy
Parent-child relationships between batches.

**Sources:**
- `seed` - Started from seed
- `transplant` - Moved from another batch
- `cutting` - Cloned from parent plant

### 7. Waste Disposal
Multi-step approval workflow for waste tracking.

**Workflow:**
1. Technician logs waste (plant material, soil, packaging)
2. Supervisor reviews and approves
3. System records in traceability system
4. Waste method documented (compost, disposal, etc.)

### 8. Post-Harvest Processing
Sequential processing stages after harvest.

**Stages:**
1. **Drying** - Remove excess moisture
2. **Curing** - Develop flavor/quality
3. **Packaging** - Final preparation for distribution

## Data Flow

### Create Batch Flow
```
User → CreateBatchDialog → handleCreateBatch()
  ↓
Create new Batch object with:
  - Generated ID
  - User-provided data
  - Initial stage
  - Plant count
  ↓
Update batches state
  ↓
Display success toast
  ↓
Batch appears in BatchDashboard
```

### Harvest Flow
```
User selects batch → BatchDetailView
  ↓
Opens "Harvest" tab
  ↓
HarvestWorkflow component
  ↓
User selects plants → weighs harvest
  ↓
handleCompleteHarvest()
  ↓
Updates batch:
  - stage = 'harvest'
  - yieldData.wetWeight
  ↓
Records in traceability system
  ↓
Success notification
```

### Stage Transition Flow
```
BatchDetailView → BatchStageTransition
  ↓
User confirms stage change
  ↓
handleStageTransition(batchId, newStage)
  ↓
Update batch state
  ↓
Update selectedBatch if viewing
  ↓
Toast notification
```

### Waste Disposal Flow
```
User clicks "New Waste Log"
  ↓
WasteDisposalWorkflow (multi-step)
  ↓
Step 1: Select waste source
Step 2: Enter quantities and reason
Step 3: Add photos/notes
Step 4: Review and submit
  ↓
handleSubmitWasteLog()
  ↓
Create WasteLog with status: 'pending_approval'
  ↓
Supervisor reviews in WasteLogDashboard
  ↓
handleApproveWasteLog() or handleRejectWasteLog()
  ↓
Status updated to 'reported_to_metrc' or 'rejected'
```

### Bulk Operations Flow
```
BulkBatchOperations component
  ↓
User selects multiple batches (checkboxes)
  ↓
Choose operation:
  - Stage update
  - Location move
  - Quarantine
  ↓
Confirm changes
  ↓
handleBulk[Operation]()
  ↓
Map through selected batches
  ↓
Update each batch state
  ↓
Success notification with count
```

## Key Features

### 1. Batch Management
- Create batches with variety, stage, location
- View detailed batch information
- Track batch timeline and history
- Manage batch groups/pods
- Stage-based workflow progression

### 2. Variety Management
- CRUD operations for produce varieties
- Track variety characteristics and yields
- Genealogy tracking (parent batches)
- Active/archived variety status
- Search and filter varieties

### 3. Facility Management
- Monitor room capacity in real-time
- Track plant distribution across locations
- Identify over/under-capacity situations
- Visualize occupancy rates

### 4. Plant Tracking
- Record plant counts by stage
- Snapshot-based inventory system
- Track transplants and movements
- Monitor plant health status
- Individual plant tagging/labeling

### 5. Harvest Operations
- Select plants for harvest
- Record weights and yields
- Generate harvest records
- Track harvest-to-batch relationships
- Traceability system integration

### 6. Post-Harvest Processing
- Drying room assignment and monitoring
- Curing process tracking
- Packaging and labeling
- Environmental condition logging
- Quality checks at each stage

### 7. Waste Management
- Multi-step waste logging workflow
- Photo evidence capture
- Supervisor approval process
- Multiple waste types (plant, soil, packaging)
- Disposal method tracking
- Traceability system reporting

### 8. Quarantine Control
- Flag batches for quality issues
- Document quarantine reasons
- Restrict operations on quarantined batches
- Supervisor-only release authority
- Audit trail for all actions

### 9. Bulk Operations
- Multi-batch stage updates
- Coordinated room transfers
- Mass quarantine actions
- Batch selection interface
- Authorization controls

### 10. Timeline & History
- Visual event timeline per batch
- Track all state changes
- Document uploads and notes
- Stage transition history
- Compliance event logging

## Technology Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Key Libraries
- **lucide-react** - Icons
- **recharts** - Data visualization
- **sonner** - Toast notifications
- **date-fns** - Date formatting

### Build Tools
- Vite (implied by modern React setup)
- TypeScript compiler
- Tailwind CSS processor

### State Management
- React useState hooks
- Props-based data flow
- No external state library (Redux, Zustand, etc.)

### Data Persistence
- Currently using in-memory state
- Mock data for development
- Ready for API integration (all handlers use callbacks)

## Getting Started

### Understanding the Codebase

1. **Start with types** (`/types`) - Understand the data models
2. **Review mock data** (`/lib`) - See example data structures
3. **Examine App.tsx** - Understand state management and data flow
4. **Explore components** - See how UI is composed

### Key Files to Review

1. `App.tsx` - Main application logic
2. `types/batch.ts` - Core batch model
3. `components/BatchDashboard.tsx` - Main interface
4. `components/BatchDetailView.tsx` - Detailed batch view
5. `lib/mock-data.ts` - Sample data

### Common Tasks

**Adding a new batch:**
1. Click "Create Batch" button
2. Fill in variety, stage, location, plant count
3. Submit form
4. Batch appears in dashboard

**Transitioning stages:**
1. Open batch detail view
2. Click stage transition button
3. Confirm new stage
4. Batch updates automatically

**Recording harvest:**
1. Open batch in harvest stage
2. Go to "Harvest" tab
3. Select plants to harvest
4. Enter weights and notes
5. Submit harvest record

**Managing waste:**
1. Click "New Waste Log"
2. Follow multi-step workflow
3. Submit for approval
4. Supervisor reviews and approves

**Bulk operations:**
1. Go to "Bulk Operations" tab
2. Select multiple batches
3. Choose operation (stage update, move, etc.)
4. Confirm changes
5. All selected batches update

### Next Steps

- Review [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md) for detailed component documentation
- Review [TYPE_SYSTEM.md](./TYPE_SYSTEM.md) for type definitions and data models
- Explore [DATA_STRUCTURES.md](../DATA_STRUCTURES.md) for detailed data structure documentation
- Check [Guidelines.md](../guidelines/Guidelines.md) for development guidelines
