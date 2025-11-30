# Cannabis Batch Management System - Platform Overview

## Table of Contents
1. [System Purpose](#system-purpose)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Core Concepts](#core-concepts)
6. [Navigation & User Flow](#navigation--user-flow)

---

## System Purpose

The Cannabis Batch Management System is a comprehensive marijuana cultivation tracking platform that manages the entire plant lifecycle from seed/clone to packaged product. The system ensures full **Metrc compliance** (Marijuana Enforcement Tracking Reporting Compliance) and implements standard operating procedures (SOPs) required for licensed cannabis cultivation facilities.

### Key Features
- **Batch lifecycle management** through 7 stages (propagation → vegetative → flowering → harvest → drying → curing → closed)
- **Cannabis strain management** with THC/CBD ranges, terpene profiles, and genetics tracking
- **Pod grouping** for organizing plants by physical location and room type
- **Plant count monitoring** (immature lots up to 100 plants, individual flowering plant tracking)
- **Metrc compliance** for all harvest, waste, and inventory operations
- **Quarantine management** for failed QA testing or contamination
- **Waste disposal workflows** with approval chains and cannabis-specific waste reasons
- **Post-harvest processing** (drying, curing, packaging) with environmental monitoring
- **Bulk operations** for moving multiple batches between stages or locations
- **Timeline & documentation** for audit trail and regulatory compliance

---

## Technology Stack

### Frontend Framework
- **React 18+** - Component-based UI library
- **TypeScript** - Type-safe JavaScript for reduced runtime errors
- **Tailwind CSS v4.0** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

### UI Component Libraries
- **shadcn/ui** - High-quality accessible components built on Radix UI
- **Lucide React** - Icon library (1000+ SVG icons)
- **Sonner** - Toast notification system
- **Recharts** - Charting library for data visualization

### State Management
- **React useState** - Local component state
- **Props drilling** - Direct parent-to-child communication
- No global state library (Redux/Zustand) - state managed at App.tsx root level

### Form Handling
- **React Hook Form v7.55.0** - Performant form validation and handling

### Data Persistence
- **Mock data** - Currently using in-memory mock data
- **LocalStorage ready** - Structure supports easy integration with localStorage or backend API
- **Metrc integration ready** - Type structure mirrors Metrc API requirements

---

## Architecture

### Component Hierarchy

```
App.tsx (Root)
├── Header (Branding + Title)
├── Tabs Navigation
│   ├── Batches Tab
│   │   └── BatchDashboard
│   │       └── (Click) → BatchDetailView
│   ├── Cultivars Tab
│   │   └── CultivarManagement
│   ├── Room Capacity Tab
│   │   └── RoomCapacityMonitor
│   ├── Bulk Operations Tab
│   │   └── BulkBatchOperations
│   ├── Batch Groups Tab
│   │   └── BatchGroupManagement
│   └── Waste Disposal Tab
│       └── WasteLogDashboard
├── CreateBatchDialog (Modal)
├── WasteDisposalWorkflow (Full-screen overlay)
└── Toaster (Toast notifications)
```

### Data Flow Pattern

```
App.tsx (State Container)
    ↓ (Props)
Child Components
    ↓ (Callbacks)
App.tsx (State Updates)
    ↓ (Re-render)
All Components with Updated Data
```

**Example Flow:**
1. User clicks "Complete Harvest" in `HarvestWorkflow` component
2. Component calls `onCompleteHarvest(harvestData)` callback prop
3. App.tsx receives callback, updates `batches` state
4. React re-renders all components consuming `batches`
5. Toast notification appears confirming action
6. Timeline auto-updates with new event

---

## File Structure

### Root Files
- **App.tsx** - Main application container, state management, routing logic
- **docs/CANNABIS_REGULATIONS.md** - Compliance documentation (SOPs, Metrc requirements)
- **docs/PLATFORM_OVERVIEW.md** - This file
- **docs/COMPONENTS_GUIDE.md** - Detailed component documentation
- **docs/TYPE_SYSTEM.md** - TypeScript interface definitions
- **docs/DATA_FLOW.md** - State management and workflow patterns
- **DATA_STRUCTURES.md** - Original data structure documentation

### /components (Main Application Components)
**Dashboard & Navigation:**
- `BatchDashboard.tsx` - Grid view of all batches with filters and search
- `BatchDetailView.tsx` - Single batch details with tabs for timeline, SOPs, metrics
- `BatchGroupManagement.tsx` - Create and manage batch groups (multi-batch organization)

**Workflow Components:**
- `CreateBatchDialog.tsx` - Modal form for creating new batches
- `HarvestWorkflow.tsx` - Multi-step harvest process with plant selection and weighing
- `PlantTaggingWorkflow.tsx` - RFID tagging workflow before flowering transition
- `WasteDisposalWorkflow.tsx` - SOP-003 compliant waste logging and approval
- `PostHarvestProcessing.tsx` - Drying, curing, and packaging workflows

**Management Components:**
- `CultivarManagement.tsx` - Cannabis strain library with genetics and characteristics
- `RoomCapacityMonitor.tsx` - Real-time capacity monitoring for all room types
- `BulkBatchOperations.tsx` - Bulk stage transitions and location moves
- `QuarantineManagement.tsx` - Quarantine and release workflows
- `PlantCountTracking.tsx` - Daily plant count snapshots for compliance

**Display Components:**
- `BatchStageTransition.tsx` - Stage transition controls with validation
- `BatchTimeline.tsx` - Event timeline with filtering and evidence
- `BatchGenealogyView.tsx` - Parent/child batch relationships
- `BatchMetricsPanel.tsx` - Environmental data visualization
- `WasteLogDashboard.tsx` - Waste log history with approval workflow
- `EvidenceCapture.tsx` - Photo/document upload for compliance

### /components/ui (shadcn/ui Library)
Pre-built accessible components from shadcn/ui:
- Form controls: `button.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`, `switch.tsx`
- Layout: `card.tsx`, `tabs.tsx`, `dialog.tsx`, `sheet.tsx`, `separator.tsx`
- Feedback: `alert.tsx`, `sonner.tsx` (toasts), `progress.tsx`, `skeleton.tsx`
- Data display: `table.tsx`, `badge.tsx`, `avatar.tsx`, `tooltip.tsx`
- Navigation: `breadcrumb.tsx`, `pagination.tsx`, `navigation-menu.tsx`
- Advanced: `calendar.tsx`, `chart.tsx`, `carousel.tsx`, `command.tsx`

### /types (TypeScript Definitions)
- `batch.ts` - Batch, Pod, BatchGroup, TimelineEvent, BatchMetrics interfaces
- `cultivar.ts` - Cultivar (strain), BatchGenealogy interfaces
- `harvest.ts` - HarvestRecord, Plant interfaces
- `waste.ts` - WasteLog, WasteReason types
- `tagging.ts` - TaggingSession, TagInventory interfaces
- `plant-tracking.ts` - PlantCountSnapshot interface
- `post-harvest.ts` - DryingRecord, CuringRecord, PackagingRecord interfaces

### /lib (Mock Data & Utilities)
- `mock-data.ts` - Batches, pods, groups, timeline events
- `cultivar-mock-data.ts` - Cannabis strains (Blue Dream, OG Kush, etc.)
- `harvest-mock-data.ts` - Plants, drying rooms, harvest records
- `waste-mock-data.ts` - Waste logs with cannabis-specific reasons
- `tagging-mock-data.ts` - Metrc tag inventory
- `plant-tracking-mock-data.ts` - Plant count snapshots

### /styles
- `globals.css` - Tailwind v4 configuration, CSS custom properties, typography defaults

---

## Core Concepts

### 1. Batches
A **Batch** represents a group of cannabis plants of the same strain tracked together through the cultivation lifecycle.

**Batch Lifecycle Stages:**
1. **Propagation** - Seeds germinating or clones rooting (1-2 weeks)
2. **Vegetative** - Immature plants building structure (3-8 weeks)
3. **Flowering** - Plants producing cannabis flower (8-10 weeks)
4. **Harvest** - Plants cut and wet trimmed (1 day)
5. **Drying** - Flower drying in controlled environment (7-14 days)
6. **Curing** - Final quality improvement (2-8+ weeks)
7. **Closed** - Batch archived, product packaged for sale

**Key Properties:**
- `plantCount` - Number of plants (1-100+ depending on stage)
- `cultivar` - Strain name (e.g., "Blue Dream")
- `podIds` - Physical location(s) where batch is located
- `quarantineStatus` - none | quarantined | released
- `yieldData` - Weights and potency (wetWeight, dryWeight, totalTHC, totalCBD)

### 2. Pods (Physical Locations)
A **Pod** represents a physical growing area within the cultivation facility.

**Room Types:**
- **Mother Room** - Houses mother plants for cloning
- **Clone Room** - Propagation area for rooting clones
- **Veg Room** - Vegetative growth (18+ hours light)
- **Flower Room** - Flowering stage (12/12 light cycle)
- **Drying Room** - Post-harvest drying (60°F/60% RH)
- **Curing Room** - Final curing and quality control
- **Processing** - Trim, packaging, and product prep

**Capacity Tracking:**
- `capacity` - Maximum plant count (license limit)
- `currentPlantCount` - Current occupancy
- `canopyArea` - Square footage available
- `lightingWatts` - Total lighting power

### 3. Cultivars (Cannabis Strains)
A **Cultivar** is a cannabis strain with specific genetic characteristics.

**Strain Types:**
- Indica (relaxing, sedative effects)
- Sativa (energizing, cerebral effects)
- Hybrid (balanced effects)
- Indica-Dominant (mostly indica genetics)
- Sativa-Dominant (mostly sativa genetics)

**Key Data:**
- `thcRange` - Expected THC percentage (e.g., 18-24%)
- `cbdRange` - Expected CBD percentage (e.g., 0.1-0.5%)
- `terpeneProfile` - Dominant terpenes (Myrcene, Limonene, Caryophyllene, etc.)
- `floweringTime` - Days to harvest (e.g., 56-63 days)
- `expectedYield` - Grams per plant (e.g., 40-60g)

### 4. Batch Groups
A **BatchGroup** is a logical grouping of multiple batches for organization purposes.

**Use Cases:**
- Group all batches in a specific grow cycle
- Track batches from same seed lot
- Organize by customer/contract
- Coordinate harvests for workflow efficiency

### 5. Waste Logs
A **WasteLog** documents cannabis waste disposal for Metrc compliance.

**Approval Workflow:**
1. Technician creates waste log with reason and weight
2. Status: `pending_approval`
3. Compliance manager reviews and approves/rejects
4. If approved: Status → `reported_to_metrc`, waste can be disposed
5. If rejected: Status → `rejected`, must create new log

**Cannabis-Specific Waste Reasons:**
- Powdery mildew (PM) infection
- Bud rot (botrytis)
- Hermaphrodite plants
- Failed testing (pesticides, microbials, heavy metals)
- Pest infestation (spider mites, aphids, thrips)
- Root rot, nutrient burn, light stress
- Trim waste (stems, fan leaves, sugar leaves)

### 6. Timeline Events
Every significant action creates a **TimelineEvent** for audit trail.

**Event Types:**
- `stage_change` - Batch moved to new stage
- `alarm` - Environmental or system alert
- `override` - Manual intervention by staff
- `note` - General documentation
- `qa_check` - Quality assurance inspection

**Evidence Capture:**
- Photos can be attached to events
- Documents (lab results, inspection reports)
- Required for compliance audits

### 7. Plant Count Tracking
**PlantCountSnapshot** records daily plant counts for regulatory compliance.

**Tracking Categories:**
- **Immature Lots** - Groups of up to 100 untagged plants (clones, veg)
- **Individual Tagged Plants** - Flowering plants with Metrc RFID tags
- **Mother Plants** - Kept in vegetative state for cloning

**Discrepancy Handling:**
- If counts don't match Metrc: investigate immediately
- Document reasons (plant death, waste disposal, etc.)
- Update Metrc to match physical count
- Report discrepancies to state regulators if required

### 8. Post-Harvest Processing
Three sequential stages after harvest:

**Drying:**
- 7-14 days in climate-controlled room (60°F/60% RH ideal)
- Monitor temperature, humidity, air circulation
- Record start date, wet weight, end date, dry weight
- Typical 70-80% weight loss during drying

**Curing:**
- 2-8+ weeks in sealed containers with humidity control
- "Burp" containers periodically to release moisture
- Improves flavor, aroma, smoothness
- Monitor for mold development

**Packaging:**
- Final product weighing and lot assignment
- Create Metrc package tags
- Apply compliant labeling with warnings and testing results
- Ready for retail or transfer to dispensary

---

## Navigation & User Flow

### Main Tabs
The application uses a tab-based navigation system with 6 primary views:

#### 1. Batches Tab (Default View)
- **BatchDashboard** displays all batches in a grid
- Filters by stage, cultivar, date range
- Search by batch name
- Click any batch → **BatchDetailView** with full details

#### 2. Cultivars Tab
- **CultivarManagement** shows strain library
- Create new strains with genetics and characteristics
- Archive inactive strains
- View which batches use each strain

#### 3. Room Capacity Tab
- **RoomCapacityMonitor** shows real-time capacity for all pods
- Color-coded capacity indicators (green/yellow/red)
- Canopy area utilization
- Lighting specifications

#### 4. Bulk Operations Tab
- **BulkBatchOperations** for moving multiple batches at once
- Select batches → Change stage for all simultaneously
- Select batches → Move to different pod(s)
- Requires compliance manager authorization

#### 5. Batch Groups Tab
- **BatchGroupManagement** for organizing batches
- Create groups, add/remove batches
- View all batches in a group
- Delete groups (doesn't delete batches)

#### 6. Waste Disposal Tab
- **WasteLogDashboard** shows all waste logs
- Filter by status (pending, approved, rejected, reported)
- Compliance manager can approve/reject logs
- Click "Log New Waste" → **WasteDisposalWorkflow**

### Detail Views

#### BatchDetailView (Detailed Batch Page)
When you click a batch from the dashboard, you enter a detailed view with 4 tabs:

**Overview Tab:**
- Current stage with transition controls
- Pod locations
- Plant count and yield data
- Quarantine status
- Stage transition workflow

**Timeline Tab:**
- **BatchTimeline** component shows all events
- Filter by event type
- View attached evidence
- Add manual notes

**SOPs Tab:**
Contains workflow wizards for specific procedures:
- **PlantTaggingWorkflow** - Tag plants before flowering (SOP-001)
- **HarvestWorkflow** - Document harvest with weights (SOP-002)
- **PostHarvestProcessing** - Drying, curing, packaging workflows

**Metrics Tab:**
- **BatchMetricsPanel** with environmental charts
- Temperature, humidity, VPD (Vapor Pressure Deficit)
- **BatchGenealogyView** shows parent batches
- **PlantCountTracking** for daily count snapshots

### Modal Dialogs
- **CreateBatchDialog** - Opens from "Create Batch" button in BatchDashboard
- Various confirmation dialogs for destructive actions

### Full-Screen Workflows
- **WasteDisposalWorkflow** - SOP-003 compliant waste logging (overlays entire app)

---

## State Management Strategy

### Centralized State (App.tsx)
All application state lives in the root `App.tsx` component:

```typescript
const [batches, setBatches] = useState<Batch[]>(mockBatches);
const [groups, setGroups] = useState<BatchGroup[]>(mockGroups);
const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(mockWasteLogs);
const [cultivars, setCultivars] = useState<Cultivar[]>(mockCultivars);
const [plantCountSnapshots, setPlantCountSnapshots] = useState<PlantCountSnapshot[]>([]);
const [dryingRecords, setDryingRecords] = useState<DryingRecord[]>([]);
const [curingRecords, setCuringRecords] = useState<CuringRecord[]>([]);
const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([]);
const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
```

### Callback Pattern
Child components receive data as props and communicate changes via callback functions:

```typescript
<HarvestWorkflow
  batch={selectedBatch}
  plants={mockPlants}
  onCompleteHarvest={handleCompleteHarvest} // Callback to update state
/>
```

### Benefits of This Approach
- **Simple mental model** - One source of truth
- **Easy debugging** - All state changes in one file
- **Type safety** - TypeScript ensures correct data flow
- **No boilerplate** - No actions, reducers, or middleware

### Limitations
- **Props drilling** - Some components receive many props
- **Performance** - Large state changes re-render entire tree (acceptable for this app size)
- **Scalability** - Would need refactoring if app grows to 50+ components

---

## Toast Notifications

The system uses **Sonner** for user feedback:

```typescript
// Success notification
toast.success('Batch created successfully');

// Error notification
toast.error('Batch placed in quarantine: Failed pesticide testing');

// Long-duration for important actions
toast.success('Harvest completed! 12 plants (1240g wet weight) reported to Metrc', {
  duration: 5000
});
```

All CRUD operations trigger toast notifications for immediate user feedback.

---

## Mock Data Strategy

Currently, the app uses mock data for development and demonstration. All mock data files in `/lib` provide realistic cannabis cultivation data:

**Strains:** Blue Dream, OG Kush, Girl Scout Cookies, Wedding Cake, etc.
**Rooms:** Clone Room A, Veg Room 1, Flower Room 2, Drying Room B, etc.
**Waste Reasons:** Powdery mildew, bud rot, hermaphrodite plants, failed testing, etc.

### Migration to Real Backend
The type system is designed to match Metrc API structures:
1. Replace `useState` with API calls (REST or GraphQL)
2. Add loading and error states
3. Implement optimistic updates for better UX
4. Add authentication and authorization
5. Connect to Metrc API for compliance reporting

---

## Development Workflow

### Adding a New Feature
1. Define TypeScript interfaces in `/types`
2. Create mock data in `/lib`
3. Build component in `/components`
4. Add to App.tsx with state and callbacks
5. Test all user flows
6. Update documentation

### Component Creation Guidelines
- Keep components under 400 lines (split if larger)
- Use TypeScript for all props
- Export interfaces for props
- Use shadcn/ui components when possible
- Follow cannabis terminology standards (see guidelines/Guidelines.md)

---

## Next Steps for Production

### Backend Integration
- [ ] Replace mock data with API calls
- [ ] Implement authentication (JWT or OAuth)
- [ ] Add authorization (role-based access control)
- [ ] Connect to Metrc API for compliance reporting
- [ ] Implement real-time updates (WebSockets or polling)

### Additional Features
- [ ] Photo upload for evidence capture
- [ ] PDF report generation
- [ ] Calendar view for harvest scheduling
- [ ] Mobile-responsive design improvements
- [ ] Barcode/QR code scanning for plant tags
- [ ] Environmental sensor integration
- [ ] Automated alerts for capacity limits

### Performance Optimization
- [ ] Implement React.memo for expensive components
- [ ] Add virtualization for large lists (react-window)
- [ ] Lazy load non-critical components
- [ ] Optimize re-renders with useMemo/useCallback
- [ ] Add service worker for offline support

---

For detailed component documentation, see **COMPONENTS_GUIDE.md**.  
For TypeScript interfaces, see **TYPE_SYSTEM.md**.  
For data flow patterns, see **DATA_FLOW.md**.
