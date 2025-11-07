# Data Entities Documentation

## Core Entity Interfaces

All entity interfaces are defined in `/types/index.ts`.

---

## SetpointTarget

Environmental parameter setpoint for a stage.

```typescript
interface SetpointTarget {
  id: string;
  stageId: string;
  type: SetpointType;
  value: number;
  unit: string;
  dayValue?: number;
  nightValue?: number;
  ramp?: Ramp;
  deadband?: number;
  minValue?: number;
  maxValue?: number;
}
```

### Field Descriptions

**id**: Unique identifier
- Format: `sp-{stageId}-{index}` or `sp-{timestamp}`
- Immutable after creation

**stageId**: Parent stage reference
- Foreign key to Stage.id
- Establishes relationship

**type**: Parameter being controlled
- One of SetpointType enum
- Determines unit and validation

**value**: Base setpoint value
- Used when dayValue/nightValue not specified
- Fallback for day/night differential

**unit**: Measurement unit
- Auto-populated based on type
- Display purposes only

**dayValue / nightValue**: Day/night differential (optional)
- Override `value` during day/night periods
- Example: 26°C day, 22°C night

**ramp**: Gradual transition (optional)
- Typically for light intensity
- Prevents abrupt changes

**deadband**: Hysteresis band (optional)
- Prevents equipment cycling
- Example: ±1°C deadband

**minValue / maxValue**: Safety bounds (optional)
- Hard limits enforced by system
- Validation checks values within bounds

### Example

```typescript
{
  id: "sp-stage1-temp",
  stageId: "stage-1",
  type: "Temperature",
  value: 24,
  unit: "°C",
  dayValue: 26,
  nightValue: 22,
  deadband: 1,
  minValue: 18,
  maxValue: 30
}
```

---

## Stage

Growth stage definition with environmental setpoints.

```typescript
interface Stage {
  id: string;
  recipeVersionId: string;
  name: StageType;
  duration: number;
  order: number;
  setpoints: SetpointTarget[];
}
```

### Field Descriptions

**id**: Unique identifier
- Format: `stage-{recipeVersionId}-{order}`

**recipeVersionId**: Parent recipe version
- Foreign key to RecipeVersion.id

**name**: Stage type
- Germination, Vegetative, Flowering, or Harvest

**duration**: Stage length in days
- Must be > 0
- Determines stage progression

**order**: Sequence position
- 1-based indexing
- Determines progression order

**setpoints**: Environmental parameters
- Array of SetpointTarget objects
- Typically 5-6 setpoints per stage

### Example

```typescript
{
  id: "stage-rv1-2",
  recipeVersionId: "rv-1",
  name: "Vegetative",
  duration: 21,
  order: 2,
  setpoints: [
    { type: "Temperature", value: 24, ... },
    { type: "RH", value: 65, ... },
    { type: "CO2", value: 1200, ... },
    { type: "LightIntensity", value: 90, ... },
    { type: "Photoperiod", value: 18, ... }
  ]
}
```

---

## RecipeVersion

Versioned snapshot of recipe configuration.

```typescript
interface RecipeVersion {
  id: string;
  recipeId: string;
  version: number;
  createdBy: string;
  createdAt: string;
  notes: string;
  stages: Stage[];
  diff?: string;
}
```

### Field Descriptions

**id**: Unique identifier
- Format: `rv-{number}` or UUID

**recipeId**: Parent recipe
- Foreign key to Recipe.id

**version**: Version number
- 1-based, auto-increments
- Matches Recipe.currentVersion for latest

**createdBy**: Author name
- User identifier or display name

**createdAt**: Creation timestamp
- ISO 8601 UTC format
- Immutable

**notes**: Change description
- Explains modifications from previous version
- Required for Published versions

**stages**: Stage definitions
- Complete configuration for this version
- Immutable after creation

**diff**: Change summary (optional)
- Human-readable comparison
- Example: "Decreased flowering RH from 55% to 50%"

### Example

```typescript
{
  id: "rv-1",
  recipeId: "recipe-1",
  version: 3,
  createdBy: "Sarah Chen",
  createdAt: "2025-10-10T14:30:00Z",
  notes: "Adjusted flowering RH targets to reduce mold risk",
  stages: [...],
  diff: "Stage 3 (Flowering): RH 55% → 50%"
}
```

---

## Recipe

Top-level recipe entity with version history.

```typescript
interface Recipe {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  status: RecipeStatus;
  currentVersion: number;
  versions: RecipeVersion[];
  createdAt: string;
  updatedAt: string;
}
```

### Field Descriptions

**id**: Unique identifier
- Immutable across versions

**name**: Display name
- User-defined, descriptive
- Example: "Premium Flower Cycle"

**ownerId / ownerName**: Creator
- ownerId: System user ID
- ownerName: Display name

**status**: Lifecycle status
- Draft, Published, Applied, Deprecated, or Archived
- Determines availability

**currentVersion**: Latest version number
- Matches highest version in versions array

**versions**: Complete version history
- Immutable
- Enables rollback

**createdAt**: Initial creation
- Immutable

**updatedAt**: Last modification
- Updates with each new version

### Example

```typescript
{
  id: "recipe-1",
  name: "Premium Flower Cycle",
  ownerId: "user-1",
  ownerName: "Sarah Chen",
  status: "Published",
  currentVersion: 3,
  versions: [
    { version: 1, ... },
    { version: 2, ... },
    { version: 3, ... }
  ],
  createdAt: "2025-08-15T10:00:00Z",
  updatedAt: "2025-10-10T14:30:00Z"
}
```

---

## Schedule

Day/night cycle and timing configuration.

```typescript
interface Schedule {
  id: string;
  scope: 'room' | 'pod' | 'batch_group' | 'site';
  scopeId: string;
  scopeName: string;
  timezone: string;
  dayStart: string;
  nightStart: string;
  blackoutWindows: BlackoutWindow[];
  activeRecipeId?: string;
  activeRecipeName?: string;
  activationTime?: string;
}
```

### Field Descriptions

**id**: Unique identifier

**scope**: Hierarchical level
- room, pod, batch_group, or site

**scopeId / scopeName**: Scope reference
- scopeId: System identifier
- scopeName: Display name

**timezone**: IANA timezone
- Examples: "America/Los_Angeles", "UTC"
- Handles DST transitions

**dayStart / nightStart**: Cycle times
- Format: "HH:mm" (24-hour)
- Determines day/night setpoint application

**blackoutWindows**: Maintenance periods
- Array of BlackoutWindow objects
- Can be empty

**activeRecipeId / activeRecipeName**: Current recipe (optional)
- Set when recipe activated
- Display purposes

**activationTime**: Activation timestamp (optional)
- ISO 8601
- Used for stage day calculation

### Example

```typescript
{
  id: "sched-1",
  scope: "batch_group",
  scopeId: "bg-1",
  scopeName: "Batch Group A-D",
  timezone: "America/Los_Angeles",
  dayStart: "06:00",
  nightStart: "18:00",
  blackoutWindows: [
    { start: "02:00", end: "04:00", reason: "Maintenance" }
  ],
  activeRecipeId: "recipe-1",
  activeRecipeName: "Premium Flower Cycle",
  activationTime: "2025-09-01T08:00:00-07:00"
}
```

---

## BatchGroup

Group of pods with shared recipe.

```typescript
interface BatchGroup {
  id: string;
  name: string;
  pods: string[];
  activeRecipeId?: string;
  activeRecipeName?: string;
  stage?: StageType;
  stageDay?: number;
  scheduledActivation?: string;
}
```

### Field Descriptions

**id**: Unique identifier

**name**: Group display name
- User-defined
- Example: "Batch Group A-D"

**pods**: Pod identifiers
- String array
- All pods inherit group's recipe

**activeRecipeId / activeRecipeName**: Applied recipe (optional)
- Set on activation

**stage**: Current growth stage (optional)
- Calculated from activation time + stage durations

**stageDay**: Day within stage (optional)
- 1-based counter
- Example: "Day 28 of Flowering"

**scheduledActivation**: Activation time (optional)
- ISO 8601 timestamp
- Used for stage calculation

### Example

```typescript
{
  id: "bg-1",
  name: "Batch Group A-D",
  pods: ["Pod A", "Pod B", "Pod C", "Pod D"],
  activeRecipeId: "recipe-1",
  activeRecipeName: "Premium Flower Cycle",
  stage: "Flowering",
  stageDay: 28,
  scheduledActivation: "2025-09-01T08:00:00-07:00"
}
```

### Stage Day Calculation

```typescript
const daysSinceActivation = Math.floor(
  (Date.now() - new Date(scheduledActivation).getTime()) / (1000 * 60 * 60 * 24)
);

let cumulativeDuration = 0;
for (const stage of recipe.stages) {
  if (daysSinceActivation <= cumulativeDuration + stage.duration) {
    currentStage = stage.name;
    stageDay = daysSinceActivation - cumulativeDuration;
    break;
  }
  cumulativeDuration += stage.duration;
}
```

---

## Override

Manual setpoint override with auto-revert.

```typescript
interface Override {
  id: string;
  scopeId: string;
  scopeName: string;
  parameter: SetpointType;
  currentValue: number;
  overrideValue: number;
  unit: string;
  ttl: number;
  reason: string;
  actorId: string;
  actorName: string;
  precedence: 'Safety' | 'E-stop' | 'Manual Override' | 'Recipe' | 'DR';
  status: OverrideStatus;
  createdAt: string;
  expiresAt?: string;
  revertedAt?: string;
}
```

### Field Descriptions

**id**: Unique identifier

**scopeId / scopeName**: Target scope
- Pod, room, etc.

**parameter**: Overridden setpoint
- SetpointType value

**currentValue**: Original setpoint
- Captured at creation
- Used for reversion

**overrideValue**: New target
- Applied during active period

**unit**: Measurement unit
- Auto-populated from parameter

**ttl**: Time-to-live in seconds
- Duration before auto-revert
- Example: 1200 = 20 minutes

**reason**: Justification
- Required for audit
- Example: "Door open for inspection"

**actorId / actorName**: Creator
- User accountability

**precedence**: Control hierarchy level
- Manual Override, Safety, E-stop, Recipe, or DR

**status**: Current state
- Requested, Active, Reverted, or Blocked

**createdAt**: Creation timestamp
- ISO 8601 UTC

**expiresAt**: Expiration time (optional)
- createdAt + ttl
- Only for Active status

**revertedAt**: Reversion time (optional)
- Completion timestamp
- Only for Reverted status

### Example

```typescript
{
  id: "ovr-1",
  scopeId: "pod-a",
  scopeName: "Pod A",
  parameter: "CO2",
  currentValue: 1200,
  overrideValue: 0,
  unit: "ppm",
  ttl: 1200,
  reason: "Door open for inspection",
  actorId: "user-3",
  actorName: "James Wilson",
  precedence: "Manual Override",
  status: "Active",
  createdAt: "2025-10-16T10:30:00Z",
  expiresAt: "2025-10-16T10:50:00Z"
}
```

---

## AuditEvent

Immutable event record for compliance.

```typescript
interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 'recipe_change' | 'setpoint_update' | 'schedule_activation' 
           | 'override_event' | 'irrigation_cycle' | 'dr_event';
  actor: string;
  scope: string;
  action: string;
  reason?: string;
  metadata?: Record<string, any>;
}
```

### Field Descriptions

**id**: Unique identifier
- Immutable

**timestamp**: Event occurrence
- UTC ISO 8601
- Immutable

**eventType**: Event classification
- recipe_change, override_event, schedule_activation, etc.

**actor**: Who/what triggered
- User name or "System"

**scope**: What was affected
- Recipe name, pod ID, etc.

**action**: Description
- Example: "Published v3", "Override Started"

**reason**: Justification (optional)
- Required for critical actions

**metadata**: Additional data (optional)
- Key-value pairs
- Event-specific details

### Example

```typescript
{
  id: "audit-1",
  timestamp: "2025-10-16T10:30:15Z",
  eventType: "override_event",
  actor: "James Wilson",
  scope: "Pod A",
  action: "Override Started",
  reason: "Door open for inspection",
  metadata: {
    parameter: "CO2",
    value: 0,
    ttl: 1200
  }
}
```

---

## IrrigationProgram

Irrigation cycle configuration (future feature).

```typescript
interface IrrigationProgram {
  id: string;
  name: string;
  zones: string[];
  preWet?: {
    duration: number;
    flowRate: number;
  };
  pulses: {
    count: number;
    duration: number;
    interval: number;
    ecTarget?: number;
    phTarget?: number;
  };
  flush?: {
    duration: number;
  };
}
```

### Field Descriptions

**id**: Unique identifier

**name**: Program name

**zones**: Irrigation zones
- String array of zone identifiers

**preWet**: Pre-wet phase (optional)
- duration: Seconds
- flowRate: Liters per minute

**pulses**: Main irrigation
- count: Number of pulses
- duration: Pulse length in seconds
- interval: Seconds between pulses
- ecTarget: Target EC (optional)
- phTarget: Target pH (optional)

**flush**: Post-flush (optional)
- duration: Seconds

### Example

```typescript
{
  id: "irr-1",
  name: "Standard Veg Fertigation",
  zones: ["Zone A", "Zone B"],
  preWet: {
    duration: 30,
    flowRate: 5
  },
  pulses: {
    count: 3,
    duration: 120,
    interval: 300,
    ecTarget: 2.0,
    phTarget: 5.8
  },
  flush: {
    duration: 15
  }
}
```

---

## Entity Relationships

### Recipe Hierarchy

```
Recipe
└── RecipeVersion[]
    └── Stage[]
        └── SetpointTarget[]
```

**One-to-Many**:
- Recipe → RecipeVersion
- RecipeVersion → Stage
- Stage → SetpointTarget

**Cascade Behavior** (future):
- Delete Recipe → Delete all versions
- Delete RecipeVersion → Delete all stages
- Delete Stage → Delete all setpoints

### Schedule Relationships

```
Schedule
├── BlackoutWindow[] (embedded)
└── Recipe (reference)
```

**One-to-Many**:
- Schedule → BlackoutWindow (embedded)

**Many-to-One** (optional):
- Schedule → Recipe (active recipe)

### BatchGroup Relationships

```
BatchGroup
├── Pod[] (string array)
└── Recipe (reference)
```

**One-to-Many**:
- BatchGroup → Pod (via string array)

**Many-to-One** (optional):
- BatchGroup → Recipe (active recipe)

### Override Relationships

```
Override
├── Scope (reference by ID)
├── Actor (reference by ID)
└── AuditEvent (created on actions)
```

**Many-to-One**:
- Override → Scope (pod/room)
- Override → Actor (user)

**One-to-Many**:
- Override → AuditEvent (multiple events per override)

### Audit Relationships

```
AuditEvent
├── Actor (reference)
└── Scope (reference)
```

**Many-to-One**:
- AuditEvent → Actor
- AuditEvent → Scope

**No Cascade**:
- AuditEvents never deleted

---

## Data Integrity Rules

### Recipe Constraints

- currentVersion must match highest version.version
- versions array must contain at least one version for Published status
- status transitions must follow: Draft → Published → Applied
- Recipe name must be unique per owner (future)

### Stage Constraints

- order must be unique per recipeVersionId
- duration must be > 0
- setpoints array can be empty but typically has 5-6 items
- At least one stage required per recipe

### SetpointTarget Constraints

- value must be within minValue..maxValue if specified
- dayValue/nightValue must be within minValue..maxValue if specified
- deadband must be non-negative
- ramp.duration must be positive if ramp specified

### Override Constraints

- ttl must be positive
- currentValue/overrideValue must be within safe bounds
- reason required (non-empty string)
- expiresAt = createdAt + ttl (for Active status)
- revertedAt only set for Reverted status

### AuditEvent Constraints

- timestamp immutable after creation
- eventType must be valid enum value
- actor and scope required
- Events never updated or deleted

---

**Document Version**: 1.0.0  
**Last Updated**: November 7, 2025
