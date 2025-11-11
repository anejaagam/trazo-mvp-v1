# Main Components Documentation

## App.tsx

**Purpose**: Root application component with tab-based navigation

**Location**: `/App.tsx`

**Key Features**:
- Sticky header with branding
- Tab navigation for 5 main modules
- User context display
- Responsive layout

**State**:
```typescript
const [activeTab, setActiveTab] = useState('recipes');
```

**Structure**:
```tsx
<div className="min-h-screen bg-slate-50">
  <header className="sticky top-0">
    {/* Branding and user info */}
  </header>
  <main>
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {/* 5 tabs: Recipes, Schedules, Batches, Overrides, Audit */}
      </TabsList>
      <TabsContent value="recipes">
        <RecipeLibrary />
      </TabsContent>
      {/* ... other tabs */}
    </Tabs>
  </main>
</div>
```

**Icons Used**:
- `Leaf`: Branding and Recipes tab
- `Calendar`: Schedules tab
- `Settings`: Batch Groups tab
- `Shield`: Overrides tab
- `FileText`: Audit Log tab

---

## RecipeLibrary.tsx

**Purpose**: Browse, search, and filter recipe library

**Location**: `/components/RecipeLibrary.tsx`

**State**:
```typescript
const [recipes] = useState<Recipe[]>(mockRecipes);
const [searchQuery, setSearchQuery] = useState('');
const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
const [isAuthoring, setIsAuthoring] = useState(false);
const [filterStatus, setFilterStatus] = useState<string>('all');
```

**Key Functions**:
```typescript
// Compute filtered recipes
const filteredRecipes = recipes.filter(recipe => {
  const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        recipe.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesFilter = filterStatus === 'all' || recipe.status === filterStatus;
  return matchesSearch && matchesFilter;
});

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Published': return 'bg-emerald-100 text-emerald-800';
    case 'Applied': return 'bg-blue-100 text-blue-800';
    case 'Draft': return 'bg-slate-100 text-slate-800';
    // ...
  }
};
```

**Navigation Flow**:
```
RecipeLibrary
  ├─→ Click "New Recipe" → RecipeAuthor
  └─→ Click recipe card → RecipeViewer
```

**UI Components**:
- Search input with icon
- Status filter buttons
- Recipe cards grid (3 columns on large screens)
- Empty state message

**Card Display**:
- Recipe name (title)
- Status badge (color-coded)
- Owner name with user icon
- Version number
- Last updated date

---

## RecipeAuthor.tsx

**Purpose**: Create and edit recipes with stage-based setpoints

**Location**: `/components/RecipeAuthor.tsx`

**Props**:
```typescript
interface RecipeAuthorProps {
  onCancel: () => void;
  onSave: () => void;
}
```

**State**:
```typescript
const [recipeName, setRecipeName] = useState('');
const [notes, setNotes] = useState('');
const [stages, setStages] = useState<Stage[]>([]);
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
const [activeStageId, setActiveStageId] = useState<string | null>(null);
```

**Key Functions**:

```typescript
// Stage management
addStage(): void
  // Creates new stage with defaults

removeStage(stageId: string): void
  // Removes stage from array

updateStage(stageId: string, updates: Partial<Stage>): void
  // Merges updates into stage

// Setpoint management
addSetpoint(stageId: string): void
  // Adds setpoint to stage

updateSetpoint(stageId: string, setpointId: string, updates: Partial<SetpointTarget>): void
  // Updates setpoint properties

removeSetpoint(stageId: string, setpointId: string): void
  // Removes setpoint from stage

// Validation
validateRecipe(): ValidationError[]
  // Returns array of validation errors
  // Checks: name, stages, durations, bounds

// Actions
handleSave(): void
  // Validates and saves as draft

handlePublish(): void
  // Validates and publishes recipe
```

**Validation Rules**:
1. Recipe name required
2. At least one stage required
3. Stage duration > 0
4. Setpoint values within min/max bounds
5. Warning for duplicate parameter types

**UI Organization**:
```
┌─ Header with Save/Publish buttons
├─ Validation Alerts (if errors)
├─ Basic Information Card
│  ├─ Recipe Name
│  └─ Notes
└─ Growth Stages Card
   └─ Tabs (one per stage)
      ├─ Stage Type selector
      ├─ Duration input
      └─ Setpoints section
         └─ Setpoint cards (add/remove)
            ├─ Parameter type
            ├─ Day value
            ├─ Night value
            └─ Deadband
```

---

## RecipeViewer.tsx

**Purpose**: Display recipe details in read-only format

**Location**: `/components/RecipeViewer.tsx`

**Props**:
```typescript
interface RecipeViewerProps {
  recipe: Recipe;
  onClose: () => void;
}
```

**Key Functions**:
```typescript
handleClone(): void
  // Creates draft copy of recipe

handleApply(): void
  // Navigates to batch group application

getStatusColor(status: string): string
  // Returns status badge color classes
```

**UI Structure**:
```
┌─ Header
│  ├─ Recipe name + status badge
│  ├─ Version + owner
│  └─ Actions: Clone, Edit, Apply
├─ Version Information Card
│  ├─ Created by
│  ├─ Created at
│  └─ Release notes
└─ Growth Stages Card
   └─ Stage tabs
      ├─ Stage summary (duration, setpoint count)
      └─ Setpoint cards
         ├─ Parameter type
         ├─ Day/Night values
         ├─ Deadband
         ├─ Ramp config (if applicable)
         └─ Safety bounds (min/max)
```

**Data Loading**:
```typescript
const version = mockRecipeVersions.find(v => v.recipeId === recipe.id) || {
  ...mockRecipeVersions[0],
  stages: createMockStages('temp')
};
```

---

## ScheduleManager.tsx

**Purpose**: Manage day/night cycles and maintenance windows

**Location**: `/components/ScheduleManager.tsx`

**State**:
```typescript
const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
const [isCreating, setIsCreating] = useState(false);
const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
```

**Key Functions**:
```typescript
handleCreateSchedule(): void
  // Saves new schedule and closes dialog

handleDeleteSchedule(scheduleId: string): void
  // Removes schedule from list
```

**Schedule Card Display**:
```
┌─ Header: Scope name + type badge
│  └─ Timezone
├─ Day/Night Times
│  ├─ Day start (Sun icon, amber background)
│  └─ Night start (Moon icon, dark background)
├─ Active Recipe (if assigned)
│  ├─ Recipe name
│  └─ Activation timestamp
└─ Blackout Windows (if any)
   └─ Time range + reason for each window
```

**Dialog**: ScheduleForm component

---

### ScheduleForm (inline component)

**Props**:
```typescript
interface ScheduleFormProps {
  schedule?: Schedule;  // For editing
  onSave: () => void;
  onCancel: () => void;
}
```

**State**:
```typescript
const [scopeName, setScopeName] = useState('');
const [dayStart, setDayStart] = useState('06:00');
const [nightStart, setNightStart] = useState('18:00');
const [blackoutWindows, setBlackoutWindows] = useState<BlackoutWindow[]>([]);
```

**Functions**:
```typescript
addBlackoutWindow(): void
  // Adds window with defaults

removeBlackoutWindow(index: number): void
  // Removes window from array

updateBlackoutWindow(index: number, updates: Partial<BlackoutWindow>): void
  // Updates window properties
```

**Form Fields**:
- Scope name (text input)
- Day start time (time picker)
- Night start time (time picker)
- Blackout windows (dynamic list)
  - Start time, End time, Reason

---

## BatchGroupManager.tsx

**Purpose**: Manage batch groups and apply recipes

**Location**: `/components/BatchGroupManager.tsx`

**State**:
```typescript
const [batchGroups] = useState<BatchGroup[]>(mockBatchGroups);
const [selectedGroup, setSelectedGroup] = useState<BatchGroup | null>(null);
const [isApplyingRecipe, setIsApplyingRecipe] = useState(false);
```

**Key Functions**:
```typescript
handleApplyRecipe(): void
  // Schedules recipe activation for batch group
```

**Batch Group Card**:
```
┌─ Header: Group name + pod count
│  └─ "Apply Recipe" button
├─ Active Recipe Section (if assigned)
│  ├─ Recipe name
│  ├─ Current stage badge
│  ├─ Stage day counter
│  └─ Activation timestamp
└─ Pod Status Grid
   └─ Pod cards (2-4 columns)
      ├─ Pod name
      └─ Stage badge
```

---

### ApplyRecipeForm (inline component)

**Props**:
```typescript
interface ApplyRecipeFormProps {
  group: BatchGroup;
  onSave: () => void;
  onCancel: () => void;
}
```

**State**:
```typescript
const [selectedRecipeId, setSelectedRecipeId] = useState('');
const [activationDate, setActivationDate] = useState('');
const [activationTime, setActivationTime] = useState('08:00');
```

**Form Structure**:
```
┌─ Recipe selector (Published only)
├─ Activation date/time pickers
├─ Info alert: ±1 second accuracy
├─ Warning alert: Safety guardrails
└─ Actions: Cancel, Schedule Activation
```

**Validation**:
```typescript
if (!selectedRecipeId || !activationDate) {
  toast.error('Please select recipe and activation time');
  return;
}
```

---

## OverrideControl.tsx

**Purpose**: Manage manual setpoint overrides with auto-revert

**Location**: `/components/OverrideControl.tsx`

**State**:
```typescript
const [overrides, setOverrides] = useState<Override[]>(mockOverrides);
const [isCreating, setIsCreating] = useState(false);
```

**Real-Time Timer**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setOverrides(current => 
      current.map(override => {
        if (override.status === 'Active' && override.expiresAt) {
          const remaining = new Date(override.expiresAt).getTime() - Date.now();
          if (remaining <= 0) {
            return { ...override, status: 'Reverted', revertedAt: new Date().toISOString() };
          }
        }
        return override;
      })
    );
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

**Key Functions**:
```typescript
handleCancelOverride(overrideId: string): void
  // Reverts override immediately

handleCreateOverride(): void
  // Activates new override

getStatusColor(status: string): string
  // Returns badge color

calculateTimeRemaining(expiresAt?: string): number
  // Returns seconds remaining

formatTimeRemaining(seconds: number): string
  // Formats as MM:SS
```

**Active Override Display**:
```
┌─ Header: Scope name + badges
├─ Parameter change: 1200 ppm → 0 ppm
├─ Countdown Timer
│  ├─ Time remaining: 18:45
│  ├─ Progress bar (25% elapsed)
│  └─ Cancel button
├─ Details
│  ├─ Initiated by
│  └─ Started timestamp
└─ Reason text
```

**Precedence Hierarchy Card**:
```
Safety → E-stop → Manual Override → Recipe → DR
```

---

### OverrideForm (inline component)

**Props**:
```typescript
interface OverrideFormProps {
  onSave: () => void;
  onCancel: () => void;
}
```

**State**:
```typescript
const [scopeName, setScopeName] = useState('');
const [parameter, setParameter] = useState<SetpointType>('Temperature');
const [overrideValue, setOverrideValue] = useState('');
const [duration, setDuration] = useState('20');
const [reason, setReason] = useState('');
```

**Form Fields**:
- Target scope (text)
- Parameter (dropdown)
- Override value (number + unit)
- Duration in minutes
- Reason (textarea, required)

**Helper Function**:
```typescript
getUnit(param: SetpointType): string
  // Returns unit for parameter type
```

---

## AuditLog.tsx

**Purpose**: Display immutable event log for compliance

**Location**: `/components/AuditLog.tsx`

**State**:
```typescript
const [events] = useState<AuditEvent[]>(mockAuditEvents);
const [searchQuery, setSearchQuery] = useState('');
const [filterEventType, setFilterEventType] = useState<string>('all');
```

**Key Functions**:
```typescript
// Filter events
const filteredEvents = events.filter(event => {
  const matchesSearch = 
    event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.action.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesFilter = filterEventType === 'all' || event.eventType === filterEventType;
  return matchesSearch && matchesFilter;
});

// Format event type
const formatEventType = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Export CSV
const handleExport = () => {
  const csvContent = [
    ['Timestamp (UTC)', 'Event Type', 'Actor', 'Scope', 'Action', 'Reason'].join(','),
    ...filteredEvents.map(event => [
      event.timestamp,
      event.eventType,
      event.actor,
      event.scope,
      event.action,
      event.reason || ''
    ].join(','))
  ].join('\n');
  
  // Download CSV file
};
```

**Event Card Display**:
```
┌─ Icon + Event type badge
├─ Action name + timestamp
├─ Actor + Scope
├─ Reason (if provided)
└─ Metadata (key-value grid)
```

**Summary Card**:
- Total events count
- Top 3 event type counts

**CSV Export**:
- Client-side generation
- Filename: `audit-log-{ISO timestamp}.csv`

---

**Document Version**: 1.0.0  
**Last Updated**: November 7, 2025
