# Trazo Control - Environmental Management System

## Overview

Trazo Control is a comprehensive environmental control system for controlled environment agriculture (CEA) and horticulture operations. Built with React and TypeScript, it implements the F2 specification for "Control, Setpoints, Schedules & Recipes."

## Quick Start

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS v4.0
- **Icons**: lucide-react
- **Notifications**: sonner

### Running the Application
This is a single-page React application that runs entirely in the browser. No backend setup required for the demo version.

## Core Features

### 1. Recipe Management
- Create stage-based environmental control recipes
- Version control with change tracking
- Recipe library with search and filtering
- Clone and edit capabilities
- Lifecycle: Draft → Published → Applied → Deprecated → Archived

### 2. Schedule Management
- Day/night cycle configuration
- Timezone support
- Maintenance blackout windows
- Non-curtailable photoperiod protection
- ±1 second activation accuracy

### 3. Batch Group Control
- Group pods for coordinated control
- Apply recipes with scheduled activation
- Track current stage and stage day
- Visual pod status indicators

### 4. Manual Overrides
- Temporary setpoint overrides with TTL
- Auto-revert timers with countdown
- Manual cancellation capability
- Safety interlock enforcement

### 5. Audit Trail
- Immutable event logging
- Compliance reporting
- CSV export
- Event filtering and search

## Project Structure

```
/
├── App.tsx                    # Main application with tab navigation
├── components/
│   ├── RecipeLibrary.tsx     # Recipe browsing
│   ├── RecipeAuthor.tsx      # Recipe creation/editing
│   ├── RecipeViewer.tsx      # Recipe details
│   ├── ScheduleManager.tsx   # Day/night scheduling
│   ├── BatchGroupManager.tsx # Batch group management
│   ├── OverrideControl.tsx   # Manual overrides
│   ├── AuditLog.tsx          # Event tracking
│   └── ui/                   # shadcn/ui components (42 components)
├── types/
│   └── index.ts              # TypeScript interfaces
├── lib/
│   └── mockData.ts           # Demo data
└── styles/
    └── globals.css           # Global styles
```

## Environmental Parameters

The system controls six environmental parameters:

| Parameter | Unit | Description |
|-----------|------|-------------|
| Temperature | °C | Air temperature |
| RH | % | Relative humidity |
| VPD | kPa | Vapor pressure deficit |
| CO₂ | ppm | Carbon dioxide concentration |
| Light Intensity | % | Light output percentage |
| Photoperiod | hrs | Light-on duration per 24h cycle |

## Growth Stages

Standard cultivation lifecycle:

1. **Germination** (3-14 days): Seed sprouting phase
2. **Vegetative** (14-60 days): Foliage development
3. **Flowering** (30-90 days): Reproductive phase
4. **Harvest** (0-3 days): Final stage before crop removal

## Control Precedence Hierarchy

```
Safety > E-stop > Manual Override > Recipe/Schedule > DR
```

- **Safety**: Absolute limits (temperature floors/ceilings)
- **E-stop**: Emergency stop overrides
- **Manual Override**: User-initiated temporary changes
- **Recipe/Schedule**: Normal operation
- **DR**: Demand response (grid optimization)

## Key Concepts

### Recipe Versioning
- Each recipe can have multiple versions
- Version number increments with each publish
- Previous versions preserved for rollback
- Change notes captured for audit trail

### Day/Night Differential
- Setpoints can have separate day and night values
- Day/night determined by schedule configuration
- Example: Temperature 26°C day, 22°C night

### Deadband (Hysteresis)
- Prevents rapid equipment cycling
- Example: 24°C setpoint with ±1°C deadband
  - Cooling activates at 25°C
  - Cooling deactivates at 23°C

### Auto-Revert Timers
- Overrides automatically expire after TTL
- Countdown timer displayed (MM:SS)
- Returns to previous setpoint
- Manual cancellation available

### Blackout Windows
- Scheduled maintenance periods
- No control changes allowed
- Photoperiod protected (non-curtailable)
- Example: 02:00-04:00 for HVAC maintenance

## Safety Features

### Safety Interlocks
- Prevent conflicting operations (heating + cooling)
- Enforce min/max bounds on all setpoints
- Block overrides during blackout windows
- Protect photoperiod schedules

### Validation
- Real-time form validation
- Business rule enforcement
- Safety bounds checking
- Warning vs error classification

### Audit Compliance
- All control actions logged
- Immutable event history
- UTC timestamps
- Mandatory reason fields for critical actions

## Navigation

The application uses tab-based navigation with 5 main sections:

1. **Recipes**: Browse, create, and manage environmental recipes
2. **Schedules**: Configure day/night cycles and maintenance windows
3. **Batch Groups**: Apply recipes to pod groups and monitor progress
4. **Overrides**: Create manual setpoint overrides with auto-revert
5. **Audit Log**: View complete event history for compliance

## Mock Data

The demo includes comprehensive mock data:
- 3 recipes at different lifecycle stages
- 2 schedules with active recipes
- 3 batch groups with varying configurations
- 2 active overrides with countdown timers
- 5 audit events spanning different event types

## F2 Specification Compliance

✅ Control precedence hierarchy  
✅ Stage-based environmental control  
✅ Day/night scheduling with timezone support  
✅ Manual overrides with auto-revert  
✅ Safety interlocks and bounds enforcement  
✅ Non-curtailable photoperiod protection  
✅ ±1 second activation accuracy  
✅ Complete audit trail  
✅ Recipe versioning with history  

## Documentation Index

- **[README.md](README.md)** (this file): Overview and quick start
- **[INDEX.md](INDEX.md)**: Complete documentation navigation guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: System design and technical details
- **[COMPONENTS-MAIN.md](COMPONENTS-MAIN.md)**: Main application components
- **[COMPONENTS-UI.md](COMPONENTS-UI.md)**: UI patterns and styling
- **[DATA-TYPES.md](DATA-TYPES.md)**: TypeScript type definitions
- **[DATA-ENTITIES.md](DATA-ENTITIES.md)**: Core data interfaces

## Support

For detailed information, refer to the documentation files listed above.

---

**Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**License**: Proprietary
