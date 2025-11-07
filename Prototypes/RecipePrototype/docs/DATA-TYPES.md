# Data Types Documentation

## Type Definitions

All TypeScript types are defined in `/types/index.ts`.

---

## Enums & Union Types

### RecipeStatus

```typescript
type RecipeStatus = 'Draft' | 'Published' | 'Applied' | 'Deprecated' | 'Archived';
```

**Status Lifecycle**:
```
Draft → Published → Applied
                  ↓
              Deprecated → Archived
```

**Status Descriptions**:

- **Draft**: Recipe in development
  - Not available for application
  - Can be edited freely
  - No validation required

- **Published**: Recipe approved for use
  - Available in batch group application
  - Immutable (creates new version if edited)
  - Full validation passed

- **Applied**: Recipe actively used
  - Currently running on one or more batch groups
  - Can still be edited (new version)
  - Original version immutable

- **Deprecated**: Superseded by newer version
  - Not recommended for new applications
  - Existing applications continue
  - Can be archived

- **Archived**: Retired from use
  - Hidden from main views
  - Retained for historical records
  - Cannot be applied

---

### StageType

```typescript
type StageType = 'Germination' | 'Vegetative' | 'Flowering' | 'Harvest';
```

**Stage Definitions**:

**Germination** (3-14 days):
- Seed sprouting phase
- High humidity (70-80%)
- Moderate temperature (22-26°C)
- Low light intensity
- 18-24 hour photoperiod

**Vegetative** (14-60 days):
- Foliage development
- Moderate humidity (60-70%)
- Moderate temperature (24-28°C)
- High light intensity
- 18 hour photoperiod

**Flowering** (30-90 days):
- Reproductive phase
- Lower humidity (45-55%)
- Stable temperature (22-26°C)
- High light intensity
- 12 hour photoperiod

**Harvest** (0-3 days):
- Final stage before crop removal
- Lights off or very low
- Temperature maintained
- Minimal duration

---

### SetpointType

```typescript
type SetpointType = 'Temperature' | 'RH' | 'VPD' | 'CO2' | 'LightIntensity' | 'Photoperiod';
```

**Parameter Specifications**:

**Temperature**:
- Unit: °C
- Typical range: 18-30°C
- Deadband: ±1°C
- Day/night differential: Yes (e.g., 26°C day, 22°C night)

**RH** (Relative Humidity):
- Unit: %
- Typical range: 40-80%
- Deadband: ±5%
- Day/night differential: Yes (e.g., 60% day, 70% night)

**VPD** (Vapor Pressure Deficit):
- Unit: kPa
- Typical range: 0.8-1.5 kPa
- Calculated from temperature and RH
- Indicates plant transpiration rate

**CO₂**:
- Unit: ppm
- Typical range: 400-1500 ppm
- Deadband: ±50 ppm
- Day/night differential: Optional (usually day-only)

**LightIntensity**:
- Unit: % of maximum
- Range: 0-100%
- Supports ramp configuration
- Day/night differential: Yes (100% day, 0% night)

**Photoperiod**:
- Unit: hours
- Range: 0-24 hours
- Determines light-on duration per 24h cycle
- Non-curtailable (cannot interrupt once started)

**Unit Mapping**:
```typescript
const getSetpointUnit = (type: SetpointType): string => {
  switch (type) {
    case 'Temperature': return '°C';
    case 'RH': return '%';
    case 'VPD': return 'kPa';
    case 'CO2': return 'ppm';
    case 'LightIntensity': return '%';
    case 'Photoperiod': return 'hrs';
  }
};
```

---

### OverrideStatus

```typescript
type OverrideStatus = 'Requested' | 'Active' | 'Reverted' | 'Blocked' | 'Escalated';
```

**Status Flow**:
```
Requested → Active → Reverted
    ↓
  Blocked
    ↓
  Escalated (future)
```

**Status Descriptions**:

- **Requested**: Override submitted
  - Pending activation
  - Safety checks in progress
  - Not yet affecting control

- **Active**: Override in effect
  - Setpoint currently overridden
  - Countdown timer running
  - Will auto-revert on expiration

- **Reverted**: Override completed
  - Returned to previous setpoint
  - Either auto-reverted or manually cancelled
  - Logged in audit trail

- **Blocked**: Override rejected
  - Safety interlock violation
  - Blackout window conflict
  - Out of bounds value
  - Reason logged

- **Escalated**: Requires approval (future)
  - Higher authorization needed
  - Flagged for manager review
  - Pending decision

---

### Control Precedence

```typescript
type Precedence = 'Safety' | 'E-stop' | 'Manual Override' | 'Recipe' | 'DR';
```

**Hierarchy** (highest to lowest):

1. **Safety**: Absolute limits
   - Temperature floors/ceilings
   - Humidity bounds
   - Cannot be overridden
   - Hardware interlocks

2. **E-stop**: Emergency stop
   - User-initiated emergency
   - Immediate action
   - Overrides all recipes
   - Requires manual reset

3. **Manual Override**: Temporary changes
   - User-initiated setpoint change
   - Time-limited (TTL)
   - Auto-revert on expiration
   - Typical use case

4. **Recipe**: Normal operation
   - Stage-based setpoints
   - Schedule-driven
   - Standard operation mode
   - Lowest manual precedence

5. **DR**: Demand response (future)
   - Grid optimization
   - Energy curtailment
   - Lowest precedence
   - Can be overridden by user

---

## Basic Interfaces

### Ramp

```typescript
interface Ramp {
  start: number;        // Starting value
  end: number;          // Ending value
  duration: number;     // Transition time in minutes
}
```

**Use Cases**:
- Light intensity ramp-up at day start
- Light intensity ramp-down at night start
- Temperature transitions between stages

**Example**:
```typescript
{
  start: 0,
  end: 85,
  duration: 30  // Ramp from 0% to 85% over 30 minutes
}
```

**Behavior**:
- Linear interpolation between start and end
- Duration in minutes
- Prevents abrupt changes that stress plants
- Typical for light intensity transitions

---

### BlackoutWindow

```typescript
interface BlackoutWindow {
  start: string;     // Start time (HH:mm)
  end: string;       // End time (HH:mm)
  reason: string;    // Purpose description
}
```

**Time Format**: 24-hour "HH:mm"
- Examples: "02:00", "14:30", "23:45"
- Interpreted in schedule's timezone
- Can span midnight (start > end)

**Behavior**:
- No recipe activations during window
- No setpoint changes
- Overrides blocked (unless emergency)
- Photoperiod protected

**Example**:
```typescript
{
  start: "02:00",
  end: "04:00",
  reason: "Scheduled HVAC maintenance"
}
```

---

### ValidationError

```typescript
interface ValidationError {
  field: string;              // Field identifier
  message: string;            // Error description
  severity: 'error' | 'warning';  // Error level
}
```

**Severity Levels**:

**error**: Blocks save/publish
- Required fields missing
- Values out of bounds
- Invalid data types
- Business rule violations

**warning**: Advisory only
- Best practice violations
- Unusual configurations
- Non-critical issues
- User can proceed with acknowledgment

**Field Identifiers**:
- `"name"`: Recipe name
- `"stage-0"`: First stage
- `"setpoint-sp1"`: Specific setpoint
- Used to highlight field in UI

**Examples**:
```typescript
{
  field: "name",
  message: "Recipe name is required",
  severity: "error"
}

{
  field: "stage-1",
  message: "Stage duration must be > 0",
  severity: "error"
}

{
  field: "setpoint-sp3",
  message: "Conflicting temperature setpoints",
  severity: "warning"
}
```

---

## Scope Types

### Schedule Scope

```typescript
type ScheduleScope = 'room' | 'pod' | 'batch_group' | 'site';
```

**Hierarchy** (largest to smallest):
- **site**: Entire facility
- **room**: Individual grow room
- **batch_group**: Group of pods
- **pod**: Single growing unit

**Use Cases**:
- **site**: Facility-wide blackout windows
- **room**: Room-specific day/night cycles
- **batch_group**: Recipe application
- **pod**: Individual pod overrides

---

## Event Types

### AuditEventType

```typescript
type AuditEventType = 
  | 'recipe_change'
  | 'setpoint_update'
  | 'schedule_activation'
  | 'override_event'
  | 'irrigation_cycle'
  | 'dr_event';
```

**Event Type Descriptions**:

**recipe_change**:
- Recipe created, edited, published
- Status changes
- Version updates

**setpoint_update**:
- Direct setpoint modifications
- Override-independent changes
- Configuration updates

**schedule_activation**:
- Recipe activated on schedule
- Stage transitions
- Automatic events

**override_event**:
- Manual override created
- Override reverted
- Override cancelled

**irrigation_cycle** (future):
- Irrigation program executed
- Fertigation events
- Water delivery

**dr_event** (future):
- Demand response activation
- Energy curtailment
- Grid optimization

---

## Time & Date Formats

### Timestamp Format

**ISO 8601 UTC**:
```typescript
"2025-10-16T10:30:15Z"
```

**With Timezone**:
```typescript
"2025-09-01T08:00:00-07:00"
```

**Usage**:
```typescript
// Create timestamp
const timestamp = new Date().toISOString();

// Parse timestamp
const date = new Date(timestamp);

// Format for display
const formatted = date.toLocaleString();
```

### Time Format

**24-hour HH:mm**:
```typescript
"06:00"  // 6 AM
"18:30"  // 6:30 PM
"00:00"  // Midnight
"23:59"  // 11:59 PM
```

**Usage**:
```typescript
<Input
  type="time"
  value={dayStart}
  onChange={(e) => setDayStart(e.target.value)}
/>
```

---

## Timezone Support

### IANA Timezone Identifiers

**Common Timezones**:
- `"America/Los_Angeles"`: Pacific Time
- `"America/New_York"`: Eastern Time
- `"America/Chicago"`: Central Time
- `"America/Denver"`: Mountain Time
- `"UTC"`: Coordinated Universal Time

**Usage**:
```typescript
interface Schedule {
  timezone: string;  // IANA timezone
  dayStart: string;  // HH:mm in timezone
  nightStart: string;  // HH:mm in timezone
}
```

**DST Handling**:
- Timezones automatically handle DST transitions
- Day/night times remain consistent
- No manual adjustment needed

---

## ID Formats

### Timestamp-Based IDs

```typescript
`entity-${Date.now()}`

// Examples:
"stage-1699564800000"
"sp-1699564800123"
"ovr-1699564800456"
```

### Sequential IDs

```typescript
`entity-${number}`

// Examples:
"recipe-1"
"bg-2"
"sched-3"
```

### Composite IDs

```typescript
`parent-child-${number}`

// Examples:
"sp-stage1-1"      // Setpoint 1 of stage 1
"stage-rv1-2"      // Stage 2 of recipe version 1
```

---

## Validation Bounds

### Temperature Bounds

```typescript
{
  minValue: 18,    // °C (safety floor)
  maxValue: 30,    // °C (safety ceiling)
  deadband: 1      // ±1°C hysteresis
}
```

### Humidity Bounds

```typescript
{
  minValue: 40,    // % (too dry)
  maxValue: 80,    // % (mold risk)
  deadband: 5      // ±5% hysteresis
}
```

### CO₂ Bounds

```typescript
{
  minValue: 400,   // ppm (ambient)
  maxValue: 1500,  // ppm (safety limit)
  deadband: 50     // ±50 ppm hysteresis
}
```

### Light Intensity Bounds

```typescript
{
  minValue: 0,     // % (off)
  maxValue: 100,   // % (maximum)
  ramp: {
    start: 0,
    end: 85,
    duration: 30   // 30-minute ramp
  }
}
```

### Photoperiod Bounds

```typescript
{
  minValue: 0,     // hrs (dark cycle)
  maxValue: 24,    // hrs (continuous light)
}
```

---

## Duration Units

### Days

```typescript
interface Stage {
  duration: number;  // Days (integer)
}

// Examples:
duration: 7   // Germination (1 week)
duration: 21  // Vegetative (3 weeks)
duration: 56  // Flowering (8 weeks)
```

### Seconds

```typescript
interface Override {
  ttl: number;  // Time-to-live in seconds
}

// Examples:
ttl: 600    // 10 minutes
ttl: 1200   // 20 minutes
ttl: 3600   // 1 hour
ttl: 7200   // 2 hours
```

### Minutes

```typescript
interface Ramp {
  duration: number;  // Minutes
}

// Examples:
duration: 15   // 15-minute ramp
duration: 30   // 30-minute ramp
duration: 60   // 1-hour ramp
```

---

## Metadata Structure

### AuditEvent Metadata

```typescript
metadata?: Record<string, any>
```

**Examples**:

**Override Event**:
```typescript
{
  parameter: "CO2",
  value: 0,
  ttl: 1200
}
```

**Schedule Activation**:
```typescript
{
  recipe: "Premium Flower Cycle v3",
  accuracy: "+1s"
}
```

**Setpoint Update**:
```typescript
{
  parameter: "LightIntensity",
  from: 85,
  to: 90
}
```

---

## Type Guards

### Helper Functions

```typescript
function isActiveOverride(override: Override): boolean {
  return override.status === 'Active';
}

function isPublishedRecipe(recipe: Recipe): boolean {
  return recipe.status === 'Published';
}

function hasActiveRecipe(batchGroup: BatchGroup): boolean {
  return !!batchGroup.activeRecipeId;
}

function isWithinBounds(value: number, setpoint: SetpointTarget): boolean {
  if (setpoint.minValue !== undefined && value < setpoint.minValue) {
    return false;
  }
  if (setpoint.maxValue !== undefined && value > setpoint.maxValue) {
    return false;
  }
  return true;
}
```

---

## Optional vs Required Fields

### Required Fields

Always present in interface:
```typescript
interface Recipe {
  id: string;              // ✅ Required
  name: string;            // ✅ Required
  status: RecipeStatus;    // ✅ Required
  currentVersion: number;  // ✅ Required
}
```

### Optional Fields

May be undefined:
```typescript
interface Override {
  expiresAt?: string;    // ⚠️ Optional (only for Active status)
  revertedAt?: string;   // ⚠️ Optional (only for Reverted status)
}

interface SetpointTarget {
  dayValue?: number;     // ⚠️ Optional (uses value if not provided)
  nightValue?: number;   // ⚠️ Optional (uses value if not provided)
  ramp?: Ramp;          // ⚠️ Optional (no ramp if not provided)
  deadband?: number;    // ⚠️ Optional (no deadband if not provided)
  minValue?: number;    // ⚠️ Optional (no lower bound if not provided)
  maxValue?: number;    // ⚠️ Optional (no upper bound if not provided)
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: November 7, 2025
