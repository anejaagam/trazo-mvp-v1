# Data Structure Reference

## Overview

This document outlines all the data structures used in the dashboard. Use these as a reference when connecting to your backend API or database.

---

## Statistics

### Stats Object

Used in the main dashboard for the stat cards.

```typescript
interface Stat {
  title: string;          // Display title
  value: string;          // Main value (formatted as string)
  subtitle: string;       // Supporting text/context
  icon: LucideIcon;       // Icon component reference
  gradient: string;       // Tailwind gradient class
  delay?: number;         // Animation delay (optional)
}
```

**Example:**
```json
{
  "title": "Active Batches",
  "value": "24",
  "subtitle": "+3 from last week",
  "icon": "Boxes",
  "gradient": "bg-gradient-to-br from-teal-500 to-emerald-500",
  "delay": 0.1
}
```

**API Response Format:**
```json
{
  "activeBatches": 24,
  "totalPlants": 1847,
  "activeAlerts": 3,
  "failedBatches": 2
}
```

---

## Batches

### Batch Object

```typescript
interface Batch {
  id: string;                    // Unique identifier (e.g., "B-2024-001")
  name: string;                  // Human-readable name
  plants: number;                // Number of plants in batch
  day: number;                   // Current day of growth cycle
  progress: number;              // Percentage complete (0-100)
  status: BatchStatus;           // Current status
}

type BatchStatus = "active" | "complete" | "warning";
```

**Example:**
```json
{
  "id": "B-2024-001",
  "name": "Batch Alpha",
  "plants": 150,
  "day": 45,
  "progress": 75,
  "status": "active"
}
```

**API Endpoint:**
```
GET /api/batches?limit=5&sort=recent
```

**Full API Response:**
```json
{
  "batches": [
    {
      "id": "B-2024-001",
      "name": "Batch Alpha",
      "plants": 150,
      "day": 45,
      "progress": 75,
      "status": "active",
      "startDate": "2024-10-09",
      "estimatedCompletion": "2024-11-23"
    }
  ],
  "total": 24,
  "page": 1
}
```

### Status Values

| Status | Description | Visual Treatment |
|--------|-------------|-----------------|
| `active` | Batch is currently growing | Green/teal colors |
| `complete` | Batch has finished | Blue/indigo colors |
| `warning` | Batch needs attention | Yellow/orange colors |

---

## Environmental Data

### Environmental Metric Object

```typescript
interface EnvironmentalMetric {
  label: string;          // Metric name
  value: string;          // Current value with unit
  status: MetricStatus;   // Current status
  icon: LucideIcon;       // Icon reference
  range: string;          // Acceptable range
}

type MetricStatus = "optimal" | "warning" | "critical";
```

**Example:**
```json
{
  "label": "Temperature",
  "value": "24°C",
  "status": "optimal",
  "icon": "Thermometer",
  "range": "22-26°C"
}
```

**API Endpoint:**
```
GET /api/environmental/current
```

**Full API Response:**
```json
{
  "timestamp": "2024-11-23T14:30:00Z",
  "metrics": {
    "temperature": {
      "value": 24,
      "unit": "°C",
      "status": "optimal",
      "min": 22,
      "max": 26
    },
    "humidity": {
      "value": 65,
      "unit": "%",
      "status": "optimal",
      "min": 60,
      "max": 70
    },
    "co2": {
      "value": 850,
      "unit": "ppm",
      "status": "warning",
      "min": 400,
      "max": 1000
    }
  }
}
```

### Pod Status Object

```typescript
interface PodStatus {
  id: string;             // Pod identifier
  status: MetricStatus;   // Current status
  name?: string;          // Optional pod name
}
```

**Example:**
```json
{
  "id": "A-1",
  "status": "optimal",
  "name": "Pod Alpha-1"
}
```

**API Response:**
```json
{
  "pods": [
    { "id": "A-1", "status": "optimal" },
    { "id": "A-2", "status": "optimal" },
    { "id": "B-1", "status": "warning" },
    { "id": "B-2", "status": "optimal" }
  ]
}
```

---

## Alerts

### Alert Object

```typescript
interface Alert {
  id: number;                  // Unique identifier
  message: string;             // Alert message text
  severity: AlertSeverity;     // Severity level
  time: string;                // Timestamp or relative time
  type?: string;               // Optional alert type/category
  acknowledged?: boolean;      // Optional acknowledgment status
}

type AlertSeverity = "low" | "medium" | "high";
```

**Example:**
```json
{
  "id": 1,
  "message": "High CO2 levels detected in Pod B-3",
  "severity": "high",
  "time": "5 minutes ago",
  "type": "environmental",
  "acknowledged": false
}
```

**API Endpoint:**
```
GET /api/alerts?limit=5&unacknowledged=true
```

**Full API Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "message": "High CO2 levels detected in Pod B-3",
      "severity": "high",
      "timestamp": "2024-11-23T14:25:00Z",
      "time": "5 minutes ago",
      "type": "environmental",
      "acknowledged": false,
      "podId": "B-3",
      "metric": "co2",
      "value": 1250
    }
  ],
  "total": 3,
  "unacknowledged": 2
}
```

### Severity Levels

| Severity | Description | Visual Treatment |
|----------|-------------|-----------------|
| `low` | Informational, no action needed | Blue colors, Info icon |
| `medium` | Attention recommended | Orange colors, Warning icon |
| `high` | Immediate action required | Red colors, Alert icon, Pulsing effect |

---

## Activity Data

### Activity Chart Data

```typescript
interface ActivityData {
  day: string;            // Day label (e.g., "Mon", "Tue")
  value: number;          // Activity metric value
  label?: string;         // Optional tooltip label
}
```

**Example:**
```json
{
  "day": "Mon",
  "value": 45,
  "label": "45 activities"
}
```

**API Endpoint:**
```
GET /api/analytics/weekly
```

**Full API Response:**
```json
{
  "period": "week",
  "startDate": "2024-11-17",
  "endDate": "2024-11-23",
  "data": [
    {
      "date": "2024-11-17",
      "day": "Mon",
      "value": 45,
      "details": {
        "newBatches": 2,
        "completedBatches": 1,
        "alerts": 3
      }
    }
  ],
  "trend": {
    "direction": "up",
    "percentage": 12.5
  }
}
```

---

## Actions

### Quick Action Object

```typescript
interface QuickAction {
  icon: LucideIcon;       // Icon component
  label: string;          // Action label
  gradient: string;       // Gradient class
  delay: number;          // Animation delay
  onClick?: () => void;   // Click handler
  route?: string;         // Optional navigation route
}
```

**Example:**
```json
{
  "icon": "Plus",
  "label": "New Batch",
  "gradient": "from-teal-500 to-emerald-500",
  "delay": 0,
  "route": "/batches/new"
}
```

---

## Combined Dashboard Data

### Complete Dashboard Response

For a single API call that returns all dashboard data:

**Endpoint:**
```
GET /api/dashboard
```

**Response:**
```json
{
  "stats": {
    "activeBatches": 24,
    "totalPlants": 1847,
    "activeAlerts": 3,
    "failedBatches": 2
  },
  "recentBatches": [
    {
      "id": "B-2024-001",
      "name": "Batch Alpha",
      "plants": 150,
      "day": 45,
      "progress": 75,
      "status": "active"
    }
  ],
  "environmental": {
    "temperature": { "value": 24, "unit": "°C", "status": "optimal" },
    "humidity": { "value": 65, "unit": "%", "status": "optimal" },
    "co2": { "value": 850, "unit": "ppm", "status": "warning" },
    "pods": [
      { "id": "A-1", "status": "optimal" },
      { "id": "A-2", "status": "optimal" },
      { "id": "B-1", "status": "warning" },
      { "id": "B-2", "status": "optimal" }
    ]
  },
  "alerts": [
    {
      "id": 1,
      "message": "High CO2 levels detected in Pod B-3",
      "severity": "high",
      "time": "5 minutes ago"
    }
  ],
  "weeklyActivity": [
    { "day": "Mon", "value": 45 },
    { "day": "Tue", "value": 52 },
    { "day": "Wed", "value": 49 },
    { "day": "Thu", "value": 63 },
    { "day": "Fri", "value": 58 },
    { "day": "Sat", "value": 71 },
    { "day": "Sun", "value": 67 }
  ],
  "timestamp": "2024-11-23T14:30:00Z"
}
```

---

## Database Schema Examples

### Batches Table

```sql
CREATE TABLE batches (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plants INTEGER NOT NULL,
  current_day INTEGER NOT NULL,
  progress DECIMAL(5,2) NOT NULL,
  status ENUM('active', 'complete', 'warning') NOT NULL,
  start_date DATE NOT NULL,
  estimated_completion DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Environmental Readings Table

```sql
CREATE TABLE environmental_readings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  co2_level INTEGER,
  pod_id VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Alerts Table

```sql
CREATE TABLE alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  alert_type VARCHAR(50),
  pod_id VARCHAR(10),
  batch_id VARCHAR(50),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  INDEX idx_acknowledged (acknowledged)
);
```

### Activity Metrics Table

```sql
CREATE TABLE activity_metrics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_date_type (date, metric_type),
  INDEX idx_date (date)
);
```

---

## TypeScript Type Definitions

Complete TypeScript definitions for use in your application:

```typescript
// stats.types.ts
export interface DashboardStats {
  activeBatches: number;
  totalPlants: number;
  activeAlerts: number;
  failedBatches: number;
}

// batch.types.ts
export type BatchStatus = "active" | "complete" | "warning";

export interface Batch {
  id: string;
  name: string;
  plants: number;
  day: number;
  progress: number;
  status: BatchStatus;
  startDate?: string;
  estimatedCompletion?: string;
}

// environmental.types.ts
export type MetricStatus = "optimal" | "warning" | "critical";

export interface EnvironmentalReading {
  value: number;
  unit: string;
  status: MetricStatus;
  min?: number;
  max?: number;
}

export interface EnvironmentalData {
  temperature: EnvironmentalReading;
  humidity: EnvironmentalReading;
  co2: EnvironmentalReading;
}

export interface PodStatus {
  id: string;
  status: MetricStatus;
  name?: string;
}

// alert.types.ts
export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: number;
  message: string;
  severity: AlertSeverity;
  time: string;
  timestamp?: string;
  type?: string;
  acknowledged?: boolean;
  podId?: string;
  batchId?: string;
}

// activity.types.ts
export interface ActivityDataPoint {
  day: string;
  value: number;
  date?: string;
  label?: string;
}

// dashboard.types.ts
export interface DashboardData {
  stats: DashboardStats;
  recentBatches: Batch[];
  environmental: {
    metrics: EnvironmentalData;
    pods: PodStatus[];
  };
  alerts: Alert[];
  weeklyActivity: ActivityDataPoint[];
  timestamp: string;
}
```

---

## Validation Rules

### Batch Validation
- `id`: Required, alphanumeric with hyphens, max 50 chars
- `name`: Required, max 255 chars
- `plants`: Required, positive integer
- `day`: Required, positive integer
- `progress`: Required, 0-100
- `status`: Required, one of: active, complete, warning

### Alert Validation
- `message`: Required, max 1000 chars
- `severity`: Required, one of: low, medium, high
- `time`: Required, valid timestamp or relative time string

### Environmental Validation
- `temperature`: -50 to 100 (°C)
- `humidity`: 0 to 100 (%)
- `co2`: 0 to 5000 (ppm)

---

## Error Responses

Standard error format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid batch status provided",
    "details": {
      "field": "status",
      "value": "invalid_status",
      "expected": ["active", "complete", "warning"]
    }
  },
  "timestamp": "2024-11-23T14:30:00Z"
}
```

Common error codes:
- `INVALID_REQUEST`: Validation error
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error

---

## Data Transformation Examples

### Converting API Response to Component Props

```typescript
// Transform API stats to StatCard props
function transformStats(apiStats: DashboardStats) {
  return [
    {
      title: "Active Batches",
      value: apiStats.activeBatches.toString(),
      subtitle: "+3 from last week",
      icon: Boxes,
      gradient: "bg-gradient-to-br from-teal-500 to-emerald-500"
    },
    // ... more transformations
  ];
}

// Transform API environmental data
function transformEnvironmental(apiData: EnvironmentalData) {
  return [
    {
      label: "Temperature",
      value: `${apiData.temperature.value}${apiData.temperature.unit}`,
      status: apiData.temperature.status,
      icon: Thermometer,
      range: `${apiData.temperature.min}-${apiData.temperature.max}${apiData.temperature.unit}`
    },
    // ... more transformations
  ];
}

// Format relative time for alerts
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
```
