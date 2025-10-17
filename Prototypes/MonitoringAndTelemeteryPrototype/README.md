# Monitoring & Telemetry Dashboard

Real-time environmental monitoring system for controlled environment agriculture with compliance-grade data export capabilities.

## Overview

This application provides operators, growers, and compliance teams with trustworthy visibility into room/pod environmental conditions and system states. It enables fast drift detection, confident decision-making, and clean audit-ready data exports—all without touching control systems.

## Key Features

### 📊 Real-Time Monitoring
- Live pod status cards with environmental readings (Temp, RH, CO₂, Lighting)
- Auto-calculated derived metrics (VPD, Dew Point)
- 5-second auto-refresh with sub-10s freshness target
- Data quality indicators (Healthy, Stale, Faulted, Calibration Due)

### 📈 Time-Series Charts
- Interactive charts with 24h, 7d, and 30d windows
- Overlay events: setpoint changes, stage transitions, alarms, irrigation cycles
- Actual vs. setpoint comparison
- Equipment status tracking (Fan, Cooling, Dehumidifier, CO₂ injection)

### 🏭 Fleet Management
- Multi-room/pod overview with sortable table
- Filter by growth stage
- Sort by drift from setpoint or alarm count
- At-a-glance health status for all pods

### 📋 Compliance & Export
- CSV/PDF export with timezone-corrected timestamps
- Immutable audit logging for all exports
- Validity flags and sensor health indicators
- Role-based access control (5 user roles)

### 🚨 Alarms & Notifications
- Real-time alarm monitoring with severity levels (Critical, Warning, Info)
- Alarm categories: Environmental, Equipment, Calibration, Communication, System
- Acknowledge and resolve alarms with notes
- Notification center with unread indicators
- Click notifications to navigate directly to affected pods
- Alarm history tracking with timestamps and user actions

### 🔒 Read-Only Safety
- No control commands issued from this interface
- Clear safety precedence hierarchy displayed
- Stale data warnings and partial data indicators
- Immutable event sourcing for audit trails

## User Roles

1. **Operator** - Frontline monitoring and alerts
2. **Head Grower** - Trend analysis vs. recipes
3. **Site Manager** - Fleet overview and variance detection
4. **Compliance/QA** - Evidence collection and exports
5. **Executive Viewer** - Read-only rollup views (no exports)

## MVP Implementation Notes

This is a frontend MVP that simulates real-time data. In production:
- Data would come from Trazo Edge Gateway via DemeGrow Raptor GCU (RS-485 Modbus RTU)
- WebSocket/SSE streams would provide live updates
- Store-and-forward ensures no data loss during WAN outages
- Time-series database handles long-term retention

### Mock Data
The system generates realistic mock data including:
- Stage-specific setpoints (Propagation, Vegetative, Flower)
- Gradual drift patterns and alarm events
- Equipment state changes
- Irrigation cycle markers

## Technical Stack

- **Framework**: React with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Key Calculations

### VPD (Vapor Pressure Deficit)
```
SVP = 0.6108 × e^((17.27 × T) / (T + 237.3))
AVP = (RH / 100) × SVP
VPD = SVP - AVP
```

### Spec Status
- **In Spec**: |actual - setpoint| ≤ tolerance
- **Approaching**: |actual - setpoint| > tolerance × 0.8
- **Out of Spec**: |actual - setpoint| > tolerance

## Data Quality States

1. **Healthy** - Sensor reading within bounds, fresh data
2. **Stale** - No update for >30s (configurable)
3. **Faulted** - Sensor error or out of physical bounds
4. **CalDue** - Calibration due date reached

## Performance Targets

- UI freshness: p95 ≤ 10s
- Chart render: p95 ≤ 2s (24h window)
- Export time: ≤ 30s (7 days, single pod)
- Auto-refresh: 5s interval

## Compliance Features

- UTC timestamp storage with local timezone display
- Immutable event logging
- Export audit trails with checksums
- Validity flags on all data points
- No modification of historical data

## Alarm Management

### Alarm Workflow
1. **Triggered** - System detects condition exceeding threshold
2. **Acknowledged** - Operator confirms awareness of issue
3. **Resolved** - Issue is fixed and documented

### Alarm Severities
- **Critical** - Immediate action required (out of spec, equipment failure)
- **Warning** - Approaching limits, attention needed
- **Info** - Informational alerts (calibration due, maintenance reminders)

### Notification Types
- **Alarm** - Active system alarms
- **System** - Software updates, system events
- **Export** - Data export completion notifications
- **Maintenance** - Scheduled maintenance reminders

## Future Enhancements

- Custom dashboard builder
- Camera/vision overlays
- Anomaly detection ML models
- Third-party sensor integrations
- BigQuery export connector
- Mobile app with QR code deep linking
- Email/SMS alarm escalation
- Configurable alarm rules and thresholds
