# Cannabis Batch Management System - Data Flow & State Management

## Table of Contents
1. [State Management Architecture](#state-management-architecture)
2. [Data Flow Patterns](#data-flow-patterns)
3. [Workflow Sequences](#workflow-sequences)
4. [CRUD Operations](#crud-operations)
5. [Metrc Integration Points](#metrc-integration-points)
6. [Error Handling](#error-handling)

---

## State Management Architecture

### Centralized State Container

All application state lives in **App.tsx** root component. No external state management libraries (Redux, Zustand, etc.) are used.

```typescript
// App.tsx - State Container
export default function App() {
  // Core Entities
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [groups, setGroups] = useState<BatchGroup[]>(mockGroups);
  const [cultivars, setCultivars] = useState<Cultivar[]>(mockCultivars);
  
  // Operational Records
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(mockWasteLogs);
  const [plantCountSnapshots, setPlantCountSnapshots] = useState<PlantCountSnapshot[]>([]);
  const [dryingRecords, setDryingRecords] = useState<DryingRecord[]>([]);
  const [curingRecords, setCuringRecords] = useState<CuringRecord[]>([]);
  const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([]);
  
  // UI State
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wasteWorkflowOpen, setWasteWorkflowOpen] = useState(false);
  const [userRole] = useState<'technician' | 'compliance_manager'>('compliance_manager');
  
  // ... handler functions
  // ... render components
}
```

### State Categories

**1. Core Entities (Persistent Data)**
- `batches` - Main cultivation batches
- `groups` - Batch groupings
- `cultivars` - Cannabis strain library

**2. Operational Records (Append-Only Logs)**
- `wasteLogs` - Waste disposal records
- `plantCountSnapshots` - Daily count logs
- `dryingRecords` - Post-harvest drying
- `curingRecords` - Post-harvest curing
- `packagingRecords` - Final packaging

**3. UI State (Ephemeral)**
- `selectedBatch` - Currently viewed batch
- `createDialogOpen` - Modal visibility
- `wasteWorkflowOpen` - Workflow visibility
- `userRole` - Current user permissions

---

## Data Flow Patterns

### Pattern 1: Read-Only Data Flow (Props Down)

Parent component passes data to children as props:

```
App.tsx (State)
    ↓ [batches, onSelectBatch, onCreateBatch]
BatchDashboard (Display)
    ↓ Read batches array
    ↓ Render grid of cards
    ↓ User clicks card
    ↓ Call onSelectBatch(batch)
    ↑
App.tsx (Update selectedBatch state)
```

**Example Code:**
```typescript
// App.tsx
<BatchDashboard
  batches={batches}                        // Props down
  onCreateBatch={() => setCreateDialogOpen(true)}  // Callback
  onSelectBatch={setSelectedBatch}         // Callback
/>

// BatchDashboard.tsx
interface BatchDashboardProps {
  batches: Batch[];                        // Receives data
  onCreateBatch: () => void;               // Receives callback
  onSelectBatch: (batch: Batch) => void;   // Receives callback
}
```

---

### Pattern 2: Callback-Based Updates (Events Up)

Child component triggers parent state change via callback:

```
App.tsx (State Management)
    ↓ [batch, onStageTransition]
BatchDetailView
    ↓ [batch, onStageTransition]
BatchStageTransition
    ↓ User clicks "Transition to Flowering"
    ↓ Call onStageTransition(batchId, 'flowering')
    ↑
BatchDetailView (pass callback through)
    ↑
App.tsx handleStageTransition()
    ↓ Update batches state
    ↓ Update selectedBatch state
    ↓ Show toast notification
    ↓ React re-renders all affected components
```

**Example Code:**
```typescript
// App.tsx
const handleStageTransition = (batchId: string, newStage: BatchStage) => {
  setBatches(batches.map(b =>
    b.id === batchId ? { ...b, stage: newStage } : b
  ));
  if (selectedBatch?.id === batchId) {
    setSelectedBatch({ ...selectedBatch, stage: newStage });
  }
  toast.success(`Batch transitioned to ${newStage} stage`);
};

<BatchDetailView
  batch={selectedBatch}
  onStageTransition={handleStageTransition}
  // ... other props
/>
```

---

### Pattern 3: Derived Data (Computed on Render)

Some data is calculated from state rather than stored:

```typescript
// RoomCapacityMonitor.tsx
const calculatePodOccupancy = (pod: Pod, batches: Batch[]) => {
  const currentPlantCount = batches
    .filter(b => b.podIds.includes(pod.id))
    .reduce((sum, b) => sum + b.plantCount, 0);
  
  const utilizationPercentage = (currentPlantCount / pod.capacity) * 100;
  
  return { currentPlantCount, utilizationPercentage };
};
```

**Benefits:**
- Always in sync with source data
- No state synchronization needed
- Less memory usage
- Simpler state management

---

### Pattern 4: Cascading Updates

Single state change triggers multiple related updates:

```typescript
// Example: Complete Harvest
const handleCompleteHarvest = (record: HarvestRecord) => {
  // 1. Update batch to harvest stage
  setBatches(batches.map(b =>
    b.id === record.batchId 
      ? { 
          ...b, 
          stage: 'harvest',
          yieldData: { ...b.yieldData, wetWeight: record.wetWeight }
        } 
      : b
  ));
  
  // 2. Update selected batch if viewing
  if (selectedBatch?.id === record.batchId) {
    setSelectedBatch({ 
      ...selectedBatch, 
      stage: 'harvest',
      yieldData: { ...selectedBatch.yieldData, wetWeight: record.wetWeight }
    });
  }
  
  // 3. Show user feedback
  toast.success(
    `Harvest completed! ${record.plantIds.length} plants (${record.wetWeight}g wet weight)`,
    { duration: 5000 }
  );
  
  // 4. (Future) Sync to Metrc API
  // await metrcApi.reportHarvest(record);
};
```

---

## Workflow Sequences

### Workflow 1: Create New Batch

**User Journey:**
1. User clicks "Create Batch" button in BatchDashboard
2. CreateBatchDialog opens
3. User fills form (name, cultivar, stage, pods, plant count)
4. User clicks "Create Batch" button
5. Dialog validation runs
6. If valid: onCreateBatch callback fires
7. App.tsx handleCreateBatch executes
8. New batch added to state
9. Dialog closes
10. Toast notification appears
11. BatchDashboard re-renders with new batch

**Data Flow:**
```typescript
// Step 1-2: Open dialog
<BatchDashboard onCreateBatch={() => setCreateDialogOpen(true)} />

// Step 3-6: User interaction
<CreateBatchDialog
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  pods={mockPods}
  onCreateBatch={handleCreateBatch}
/>

// Step 7-8: State update
const handleCreateBatch = (data: CreateBatchData) => {
  const newBatch: Batch = {
    id: `batch-${Date.now()}`,
    name: data.name,
    cultivar: data.cultivar,
    stage: data.stage,
    startDate: data.startDate,
    podIds: data.podIds,
    plantCount: data.plantCount,
    createdAt: new Date().toISOString(),
  };
  
  setBatches([...batches, newBatch]);  // Immutable update
  toast.success('Batch created successfully');
};
```

---

### Workflow 2: Harvest Process (SOP-002)

**User Journey:**
1. User views BatchDetailView for flowering batch
2. Clicks "SOPs" tab
3. Clicks "Begin Harvest" in HarvestWorkflow section
4. Step 1: Select plants to harvest (checkboxes)
5. Step 2: Enter wet weight in grams
6. Step 3: Select drying room
7. Step 4: Review and confirm
8. Clicks "Complete Harvest"
9. HarvestWorkflow calls onCompleteHarvest
10. App.tsx updates batch to harvest stage
11. Batch moves to drying room
12. Toast confirms Metrc reporting
13. Timeline event auto-created
14. User returned to Overview tab

**Data Flow:**
```typescript
// Step 1-8: Workflow UI
<HarvestWorkflow
  batch={selectedBatch}
  plants={mockPlants.filter(p => p.batchId === selectedBatch.id)}
  dryingRooms={mockDryingRooms}
  onComplete={handleCompleteHarvest}
  onCancel={() => {/* return to overview */}}
/>

// Step 9-12: State updates
const handleCompleteHarvest = (record: HarvestRecord) => {
  // Update batch stage and yield data
  setBatches(batches.map(b =>
    b.id === record.batchId 
      ? { 
          ...b, 
          stage: 'harvest',
          harvestDate: new Date().toISOString(),
          yieldData: { ...b.yieldData, wetWeight: record.wetWeight },
          podIds: [record.dryingRoomId] // Move to drying room
        } 
      : b
  ));
  
  // Update selected batch
  if (selectedBatch?.id === record.batchId) {
    setSelectedBatch({ 
      ...selectedBatch, 
      stage: 'harvest',
      harvestDate: new Date().toISOString(),
      yieldData: { ...selectedBatch.yieldData, wetWeight: record.wetWeight },
      podIds: [record.dryingRoomId]
    });
  }
  
  // User feedback
  toast.success(
    `Harvest completed! ${record.plantIds.length} plants (${record.wetWeight}g wet weight) reported to Metrc`,
    { duration: 5000 }
  );
  
  // (Future) Metrc integration
  // await metrcApi.reportHarvest({
  //   plantTags: record.plantIds.map(id => plants.find(p => p.id === id)?.metrcTagId),
  //   wetWeight: record.wetWeight,
  //   harvestDate: new Date().toISOString()
  // });
};
```

---

### Workflow 3: Waste Disposal with Approval (SOP-003)

**User Journey:**
1. User clicks "Waste Disposal" tab
2. Clicks "Log New Waste" button
3. WasteDisposalWorkflow overlays entire app
4. User fills form (waste type, weight, reason, photos)
5. Clicks "Submit for Approval"
6. Waste log created with status: pending_approval
7. Workflow closes, returns to WasteLogDashboard
8. Toast confirms submission
9. Compliance manager views WasteLogDashboard
10. Clicks "Approve" button on pending log
11. Approval dialog opens
12. Manager enters review notes
13. Clicks "Approve"
14. Status changes to reported_to_metrc
15. Metrc timestamp recorded
16. Toast confirms approval
17. Technician can now dispose waste physically

**Data Flow:**
```typescript
// Step 1-5: Workflow UI
<WasteDisposalWorkflow
  onSubmitForApproval={handleSubmitWasteLog}
  onCancel={() => setWasteWorkflowOpen(false)}
/>

// Step 6-8: Create waste log
const handleSubmitWasteLog = (log: Omit<WasteLog, 'id' | 'createdAt' | 'status'>) => {
  const newLog: WasteLog = {
    ...log,
    id: `waste-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending_approval',  // Awaiting compliance manager
  };
  
  setWasteLogs([newLog, ...wasteLogs]);  // Prepend to array (newest first)
  setWasteWorkflowOpen(false);
  toast.success('Waste log submitted for approval');
};

// Step 9-16: Approval by compliance manager
<WasteLogDashboard
  wasteLogs={wasteLogs}
  onApprove={handleApproveWasteLog}
  onReject={handleRejectWasteLog}
  userRole={userRole}
/>

const handleApproveWasteLog = (logId: string, reviewedBy: string, reviewNotes: string) => {
  setWasteLogs(wasteLogs.map(log =>
    log.id === logId
      ? {
          ...log,
          status: 'reported_to_metrc' as const,  // Type assertion for union type
          reviewedBy,
          reviewedAt: new Date().toISOString(),
          reviewNotes,
          metrcReportedAt: new Date().toISOString(),
        }
      : log
  ));
  
  toast.success('Waste log approved and reported to Metrc', { duration: 5000 });
  
  // (Future) Metrc integration
  // await metrcApi.reportWaste({
  //   weight: log.weight,
  //   reason: log.reason,
  //   disposalMethod: log.disposalMethod
  // });
};
```

---

### Workflow 4: Plant Tagging (SOP-001)

**User Journey:**
1. Batch in vegetative stage, ready to flower
2. User opens BatchDetailView → SOPs tab
3. Clicks "Begin Tagging" in PlantTaggingWorkflow
4. System checks available Metrc tags
5. User scans/enters tag numbers for each plant
6. Progress counter updates (12/48 plants tagged)
7. User completes tagging session
8. Clicks "Sync to Metrc"
9. System reports all tags to Metrc
10. Batch stage changes to flowering
11. BatchStageTransition updates UI
12. Toast confirms Metrc sync complete

**Data Flow:**
```typescript
// Step 1-7: Tagging UI
<PlantTaggingWorkflow
  batch={selectedBatch}
  availableTags={mockAvailableTags}
  onComplete={handleCompleteTagging}
  onCancel={() => {/* return to overview */}}
/>

// Step 8-11: State updates
const handleCompleteTagging = (session: TaggingSession) => {
  // Transition batch to flowering
  setBatches(batches.map(b =>
    b.id === session.batchId ? { ...b, stage: 'flowering' } : b
  ));
  
  if (selectedBatch?.id === session.batchId) {
    setSelectedBatch({ ...selectedBatch, stage: 'flowering' });
  }
  
  toast.success(
    `Tagging session completed! ${session.plantsTagged} of ${session.plantsToTag} plants tagged and synced to Metrc`,
    { duration: 5000 }
  );
  
  // (Future) Metrc integration
  // await metrcApi.assignPlantTags({
  //   batchId: session.batchId,
  //   tagNumbers: session.tagsUsed
  // });
};
```

---

## CRUD Operations

### Create Operations

**Pattern: Append to Array**
```typescript
// Add new batch
const newBatch: Batch = { /* ... */ };
setBatches([...batches, newBatch]);  // Spread existing + new

// Add new waste log (prepend for newest-first)
const newLog: WasteLog = { /* ... */ };
setWasteLogs([newLog, ...wasteLogs]);
```

**Characteristics:**
- Generate unique ID (`batch-${Date.now()}`)
- Set createdAt timestamp
- Set initial status/state
- Return new array reference (immutable)

---

### Read Operations

**Pattern: Filter/Find**
```typescript
// Find specific batch
const batch = batches.find(b => b.id === batchId);

// Filter by stage
const floweringBatches = batches.filter(b => b.stage === 'flowering');

// Filter by quarantine status
const quarantinedBatches = batches.filter(b => b.quarantineStatus === 'quarantined');

// Get batches in specific pod
const podBatches = batches.filter(b => b.podIds.includes(podId));
```

**Characteristics:**
- Non-mutating operations
- Returns new array/value
- Can chain multiple filters
- Use optional chaining for safety (`batch?.name`)

---

### Update Operations

**Pattern: Map and Replace**
```typescript
// Update single batch
setBatches(batches.map(b =>
  b.id === batchId 
    ? { ...b, stage: 'flowering', plantCount: 48 }  // Replace if match
    : b  // Keep original if no match
));

// Update batch and selected batch together
setBatches(batches.map(b =>
  b.id === batchId ? { ...b, stage: newStage } : b
));
if (selectedBatch?.id === batchId) {
  setSelectedBatch({ ...selectedBatch, stage: newStage });
}

// Bulk update multiple batches
const batchIdsToUpdate = ['batch-1', 'batch-2', 'batch-3'];
setBatches(batches.map(b =>
  batchIdsToUpdate.includes(b.id)
    ? { ...b, stage: 'flowering' }
    : b
));
```

**Characteristics:**
- Immutable updates (spread operator)
- Returns new array reference
- React detects change and re-renders
- Preserve unrelated fields

---

### Delete Operations

**Pattern: Filter Out**
```typescript
// Delete batch group
setGroups(groups.filter(g => g.id !== groupId));

// Remove batch from group
setGroups(groups.map(g =>
  g.id === groupId
    ? { ...g, batchIds: g.batchIds.filter(id => id !== batchId) }
    : g
));

// Soft delete (archive instead of remove)
setCultivars(cultivars.map(c =>
  c.id === cultivarId ? { ...c, isActive: false } : c
));
```

**Characteristics:**
- Filter creates new array without deleted item
- For nested arrays, use map + filter
- Prefer soft deletes for audit trail
- Cascade updates to related entities

---

## Metrc Integration Points

### Current State: Mock Integration

All Metrc operations are currently simulated:

```typescript
const handleCompleteHarvest = (record: HarvestRecord) => {
  // Update state
  setBatches(/* ... */);
  
  // Show success message as if Metrc reported
  toast.success('Harvest reported to Metrc', { duration: 5000 });
  
  // No actual API call yet
};
```

### Future State: Real API Integration

Replace mock operations with actual API calls:

```typescript
const handleCompleteHarvest = async (record: HarvestRecord) => {
  try {
    // 1. Report to Metrc API
    const metrcResponse = await metrcApi.reportHarvest({
      plantTags: record.plantIds.map(id => getPlantTagById(id)),
      wetWeight: record.wetWeight,
      harvestDate: new Date().toISOString(),
      location: record.dryingRoomId
    });
    
    // 2. Update local state with Metrc confirmation
    setBatches(batches.map(b =>
      b.id === record.batchId 
        ? { 
            ...b, 
            stage: 'harvest',
            yieldData: { ...b.yieldData, wetWeight: record.wetWeight },
            metrcPackageTag: metrcResponse.packageTag
          } 
        : b
    ));
    
    // 3. Success feedback
    toast.success(
      `Harvest completed! Metrc Package: ${metrcResponse.packageTag}`,
      { duration: 5000 }
    );
    
  } catch (error) {
    // 4. Error handling
    console.error('Metrc API error:', error);
    toast.error('Failed to report to Metrc. Please try again.');
    
    // 5. Retry logic or queue for later
    // await queueMetrcSync(record);
  }
};
```

### Metrc API Endpoints (Future)

**Required Integrations:**
1. **Plant Tagging** - Report new plant tags before flowering
2. **Harvest Reporting** - Report wet weight and plant tags at harvest
3. **Waste Disposal** - Report waste weight and reason
4. **Stage Changes** - Update plant locations and growth stages
5. **Package Creation** - Create retail packages with testing data
6. **Transfer Manifests** - Document product transfers between facilities

---

## Error Handling

### Form Validation Errors

**Pattern: Local Error State**
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = () => {
  const newErrors: Record<string, string> = {};
  
  if (!batchName) {
    newErrors.name = 'Batch name is required';
  }
  
  if (plantCount <= 0) {
    newErrors.plantCount = 'Plant count must be greater than 0';
  }
  
  if (podIds.length === 0) {
    newErrors.pods = 'At least one pod must be selected';
  }
  
  setErrors(newErrors);
  
  if (Object.keys(newErrors).length === 0) {
    // No errors, proceed with submission
    onCreateBatch({ batchName, plantCount, podIds });
  }
};
```

**Display Errors in UI:**
```typescript
<Input
  value={batchName}
  onChange={(e) => setBatchName(e.target.value)}
/>
{errors.name && (
  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
)}
```

---

### Business Logic Errors

**Pattern: Toast Notifications**
```typescript
const handleStageTransition = (batchId: string, newStage: BatchStage) => {
  const batch = batches.find(b => b.id === batchId);
  
  // Validation: Can't transition quarantined batch
  if (batch?.quarantineStatus === 'quarantined') {
    toast.error('Cannot transition quarantined batch. Release from quarantine first.');
    return;
  }
  
  // Validation: Must complete tagging before flowering
  if (batch?.stage === 'vegetative' && newStage === 'flowering') {
    if (!batch.metrcTagsAssigned) {
      toast.error('Plants must be tagged before transitioning to flowering stage.');
      return;
    }
  }
  
  // Validation: Minimum time requirements
  const daysInStage = calculateDaysInStage(batch);
  if (batch?.stage === 'flowering' && daysInStage < 56) {
    toast.warning(`Batch has only been flowering for ${daysInStage} days. Typical minimum is 56 days.`);
    // Allow but warn
  }
  
  // Proceed with transition
  setBatches(batches.map(b =>
    b.id === batchId ? { ...b, stage: newStage } : b
  ));
  
  toast.success(`Batch transitioned to ${newStage} stage`);
};
```

---

### API Errors (Future)

**Pattern: Try-Catch with Fallback**
```typescript
const handleCompleteHarvest = async (record: HarvestRecord) => {
  try {
    // Attempt API call
    await metrcApi.reportHarvest(record);
    
    // Update state on success
    setBatches(/* ... */);
    toast.success('Harvest reported to Metrc');
    
  } catch (error) {
    if (error instanceof MetrcAuthError) {
      toast.error('Metrc authentication failed. Please re-login.');
      // Redirect to auth page
    } else if (error instanceof MetrcValidationError) {
      toast.error(`Metrc validation error: ${error.message}`);
      // Show validation details
    } else {
      toast.error('Failed to report to Metrc. Data saved locally.');
      // Queue for retry
      await saveToRetryQueue(record);
    }
  }
};
```

---

## State Synchronization

### Keep Multiple State Pieces in Sync

**Problem:** When updating a batch that's also the selectedBatch, need to update both.

**Solution:** Update pattern that checks both locations:
```typescript
const handleStageTransition = (batchId: string, newStage: BatchStage) => {
  // Update in batches array
  setBatches(batches.map(b =>
    b.id === batchId ? { ...b, stage: newStage } : b
  ));
  
  // Update selectedBatch if it's the same batch
  if (selectedBatch?.id === batchId) {
    setSelectedBatch({ ...selectedBatch, stage: newStage });
  }
  
  toast.success(`Batch transitioned to ${newStage} stage`);
};
```

---

### Derived Data Consistency

**Problem:** Pod occupancy calculation could get out of sync with batches.

**Solution:** Calculate on render, don't store in state:
```typescript
// ❌ Bad: Store derived data in state
const [podOccupancy, setPodOccupancy] = useState<Record<string, number>>({});

// Need to recalculate every time batches change
useEffect(() => {
  const newOccupancy = calculateOccupancy(pods, batches);
  setPodOccupancy(newOccupancy);
}, [pods, batches]);

// ✅ Good: Calculate on render
const RoomCapacityMonitor = ({ pods, batches }: Props) => {
  const getOccupancy = (pod: Pod) => {
    return batches
      .filter(b => b.podIds.includes(pod.id))
      .reduce((sum, b) => sum + b.plantCount, 0);
  };
  
  return pods.map(pod => (
    <PodCard 
      pod={pod} 
      currentCount={getOccupancy(pod)}  // Always current
    />
  ));
};
```

---

## Performance Considerations

### Current Approach: Simple and Fast

For current dataset sizes (<1000 batches, <100 pods), simple patterns work well:
- Direct array iteration
- Map/filter without optimization
- Re-render entire tree on state change

**Typical Performance:**
- Batch creation: <50ms
- Filter batches: <10ms
- Calculate room capacity: <5ms

---

### Future Optimizations (If Needed)

**1. Memoization**
```typescript
import { useMemo } from 'react';

const floweringBatches = useMemo(
  () => batches.filter(b => b.stage === 'flowering'),
  [batches]
);
```

**2. Component Memoization**
```typescript
import { memo } from 'react';

const BatchCard = memo(({ batch }: Props) => {
  return <Card>...</Card>;
});
```

**3. Virtualization**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={batches.length}
  itemSize={120}
>
  {({ index, style }) => (
    <div style={style}>
      <BatchCard batch={batches[index]} />
    </div>
  )}
</FixedSizeList>
```

**4. Pagination**
```typescript
const [page, setPage] = useState(1);
const pageSize = 20;
const paginatedBatches = batches.slice(
  (page - 1) * pageSize,
  page * pageSize
);
```

---

## Migration to Backend

### Current: In-Memory State
```typescript
const [batches, setBatches] = useState<Batch[]>(mockBatches);
```

### Future: API-Backed State
```typescript
const [batches, setBatches] = useState<Batch[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/batches');
      setBatches(response.data);
    } catch (err) {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };
  
  fetchBatches();
}, []);
```

### API Client Pattern
```typescript
// lib/api.ts
export const api = {
  batches: {
    list: () => fetch('/api/batches').then(r => r.json()),
    get: (id: string) => fetch(`/api/batches/${id}`).then(r => r.json()),
    create: (data: CreateBatchData) => 
      fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    update: (id: string, data: Partial<Batch>) =>
      fetch(`/api/batches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    delete: (id: string) =>
      fetch(`/api/batches/${id}`, { method: 'DELETE' })
  }
};
```

---

For architecture overview, see **PLATFORM_OVERVIEW.md**.  
For component documentation, see **COMPONENTS_GUIDE.md**.  
For TypeScript types, see **TYPE_SYSTEM.md**.
