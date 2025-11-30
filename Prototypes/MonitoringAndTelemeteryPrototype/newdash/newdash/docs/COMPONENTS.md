# Component Documentation

## Component Architecture

The dashboard is built using a modular component structure. Each component is self-contained and can be customized independently.

---

## StatCard

**Location**: `/components/StatCard.tsx`

### Purpose
Displays a single metric with an icon, value, subtitle, and animated effects.

### Props

```typescript
interface StatCardProps {
  title: string;        // Card title (e.g., "Active Batches")
  value: string;        // Main display value (e.g., "24")
  subtitle: string;     // Subtitle text (e.g., "+3 from last week")
  icon: LucideIcon;     // Icon component from lucide-react
  gradient: string;     // Tailwind gradient class
  delay?: number;       // Animation delay in seconds (default: 0)
}
```

### Usage

```tsx
import { StatCard } from "./components/StatCard";
import { Boxes } from "lucide-react";

<StatCard
  title="Active Batches"
  value="24"
  subtitle="+3 from last week"
  icon={Boxes}
  gradient="bg-gradient-to-br from-teal-500 to-emerald-500"
  delay={0.1}
/>
```

### Animations

- **Entrance**: Fade in with scale from 0.9 to 1.0
- **Hover**: Lifts up by 8px with slight scale increase
- **Icon**: Rotates 360° on hover
- **Background**: Pulsing gradient orb effect

### Customization

Change gradient colors by modifying the `gradient` prop:
```tsx
gradient="bg-gradient-to-br from-blue-500 to-purple-500"
```

---

## BatchList

**Location**: `/components/BatchList.tsx`

### Purpose
Displays a list of recent batches with status, progress, and details.

### Data Structure

```typescript
interface Batch {
  id: string;           // Batch identifier (e.g., "B-2024-001")
  name: string;         // Batch name (e.g., "Batch Alpha")
  plants: number;       // Number of plants in batch
  day: number;          // Current day of growth
  progress: number;     // Progress percentage (0-100)
  status: "active" | "complete" | "warning";
}
```

### Status Styles

- **active**: Green gradient with teal accents
- **complete**: Blue gradient with indigo accents
- **warning**: Yellow/orange gradient with amber accents

### Features

- Animated progress bars
- Status badges with color coding
- Hover effects with translation
- Staggered entrance animations
- "View All Batches" button

### Customization

Add new batch statuses by extending the `statusStyles` object:

```typescript
const statusStyles = {
  active: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-300", glow: "from-teal-400 to-emerald-400" },
  complete: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", glow: "from-blue-400 to-indigo-400" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", glow: "from-yellow-400 to-orange-400" },
  // Add your custom status
  paused: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300", glow: "from-gray-400 to-slate-400" },
};
```

---

## EnvironmentalStatus

**Location**: `/components/EnvironmentalStatus.tsx`

### Purpose
Displays environmental monitoring data with status indicators.

### Data Structure

```typescript
interface Metric {
  label: string;        // Metric name (e.g., "Temperature")
  value: string;        // Current value (e.g., "24°C")
  status: "optimal" | "warning" | "critical";
  icon: LucideIcon;     // Icon component
  range: string;        // Acceptable range (e.g., "22-26°C")
}
```

### Status Colors

- **optimal**: Green (everything normal)
- **warning**: Orange (attention needed)
- **critical**: Red (immediate action required)

### Pod Status Display

Shows pod status in a 2x2 grid:
- Green dot: Optimal
- Orange dot: Warning
- Red dot: Critical

### Features

- Circular progress indicators
- Pulsing animations for warnings/critical
- 4-pod status grid
- Status indicators with colors
- Range information display

### Customization

Add new environmental metrics:

```typescript
const metrics = [
  { label: "Temperature", value: "24°C", status: "optimal", icon: Thermometer, range: "22-26°C" },
  { label: "Humidity", value: "65%", status: "optimal", icon: Droplets, range: "60-70%" },
  { label: "CO2", value: "850ppm", status: "warning", icon: Wind, range: "400-1000ppm" },
  // Add your custom metric
  { label: "Light Level", value: "450 lux", status: "optimal", icon: Sun, range: "400-600 lux" },
];
```

---

## AlertsList

**Location**: `/components/AlertsList.tsx`

### Purpose
Displays recent system alerts with severity levels.

### Data Structure

```typescript
interface Alert {
  id: number;           // Unique identifier
  message: string;      // Alert message
  severity: "low" | "medium" | "high";
  time: string;         // Relative time (e.g., "5 minutes ago")
}
```

### Severity Configuration

Each severity has associated styling and icons:

- **low**: Info icon, blue color scheme
- **medium**: AlertTriangle icon, orange color scheme
- **high**: AlertCircle icon, red color scheme with pulse effect

### Features

- Animated entrance for each alert
- Pulsing effect for high severity alerts
- Color-coded severity badges
- Icon indicators
- Time stamps
- "View All Alerts" button

### Customization

Add custom severity levels:

```typescript
const severityConfig = {
  low: { icon: Info, iconBg: "bg-blue-100/80", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", pulse: "from-blue-400 to-blue-600" },
  medium: { icon: AlertTriangle, iconBg: "bg-orange-100/80", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300", pulse: "from-orange-400 to-orange-600" },
  high: { icon: AlertCircle, iconBg: "bg-red-100/80", text: "text-red-700", bg: "bg-red-50", border: "border-red-300", pulse: "from-red-400 to-red-600" },
  // Add custom severity
  critical: { icon: XCircle, iconBg: "bg-purple-100/80", text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300", pulse: "from-purple-400 to-purple-600" },
};
```

---

## ActivityChart

**Location**: `/components/ActivityChart.tsx`

### Purpose
Displays weekly activity data as an animated bar chart.

### Data Structure

```typescript
interface ChartData {
  day: string;          // Day label (e.g., "Mon", "Tue")
  value: number;        // Activity value (arbitrary scale)
}
```

### Features

- Animated bars with staggered entrance
- Hover effects with tooltips
- Grid lines for reference
- Trend indicator (+12.5%)
- Dynamic height calculation
- Gradient fills for bars

### Customization

Change bar colors:

```tsx
// In ActivityChart.tsx, update the gradient
className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-xl"
```

Add more data points:

```typescript
const data = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 52 },
  { day: "Wed", value: 49 },
  { day: "Thu", value: 63 },
  { day: "Fri", value: 58 },
  { day: "Sat", value: 71 },
  { day: "Sun", value: 67 },
  // Add more days or custom periods
];
```

---

## QuickActions

**Location**: `/components/QuickActions.tsx`

### Purpose
Provides quick access buttons for common operations.

### Data Structure

```typescript
interface Action {
  icon: LucideIcon;     // Icon component
  label: string;        // Button label
  gradient: string;     // Tailwind gradient class
  delay: number;        // Animation delay
  onClick?: () => void; // Optional click handler
}
```

### Default Actions

1. **New Batch**: Create a new batch
2. **Reports**: View reports
3. **Settings**: Access settings
4. **Export**: Export data

### Features

- 2x2 grid layout
- Animated entrance
- Rotating icons on hover
- Gradient backgrounds
- Hover glow effects
- Click handlers

### Customization

Add custom actions:

```typescript
const actions = [
  { icon: Plus, label: "New Batch", gradient: "from-teal-500 to-emerald-500", delay: 0 },
  { icon: FileText, label: "Reports", gradient: "from-blue-500 to-indigo-500", delay: 0.1 },
  { icon: Settings, label: "Settings", gradient: "from-purple-500 to-pink-500", delay: 0.2 },
  { icon: Download, label: "Export", gradient: "from-orange-500 to-red-500", delay: 0.3 },
  // Add custom action
  { icon: Share2, label: "Share", gradient: "from-green-500 to-teal-500", delay: 0.4 },
];
```

---

## Main Dashboard (App.tsx)

**Location**: `/App.tsx`

### Structure

```
Dashboard
├── Animated Background (floating orbs)
├── Navigation Bar
│   ├── Menu Button
│   ├── Logo
│   ├── Search Bar
│   └── User Actions (Notifications, Settings, Profile)
├── Hero Section
│   ├── Page Title
│   └── Performance Indicator
├── Stats Grid (4 StatCards)
├── Content Grid
│   ├── Left Column
│   │   ├── BatchList
│   │   └── ActivityChart
│   └── Right Column
│       ├── EnvironmentalStatus
│       ├── AlertsList
│       └── QuickActions
```

### Layout Breakpoints

- **Mobile**: Stacked single column
- **Tablet** (md): 2-column stats, stacked content
- **Desktop** (lg): 4-column stats, 2-column content

### Background Animation

Two floating orbs with infinite rotation and scale animations:
- Top-right: Teal to emerald gradient
- Bottom-left: Green to teal gradient

### Customization

Adjust layout:

```tsx
// Change grid columns
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Adjust lg:grid-cols-3 to change desktop columns */}
</div>
```

Modify animations:

```tsx
// Change animation duration/speed
transition={{
  duration: 20,  // Increase for slower animation
  repeat: Infinity,
  ease: "linear",
}}
```

---

## Animation Timing

All components use staggered animations for smooth entrance:

- Navigation: 0s delay
- Title: 0.2s delay
- Stats: 0.3s - 0.6s delay
- Content components: 0.9s - 1.0s delay
- Individual items: +0.1s per item

---

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Hidden search bar
- Simplified navigation
- Stacked stat cards
- Full-width components

### Tablet (768px - 1024px)
- 2-column stat cards
- Visible search bar
- 2-column content grid
- Optimized spacing

### Desktop (> 1024px)
- 4-column stat cards
- Full navigation
- 3-column content grid
- Maximum spacing

---

## Performance Tips

1. **Reduce Animation Complexity**: Lower the number of animated elements on lower-end devices
2. **Lazy Loading**: Load components below the fold lazily
3. **Memoization**: Use React.memo() for heavy components
4. **Debounce Updates**: Debounce real-time data updates
5. **GPU Acceleration**: Animations use transform and opacity for best performance

---

## Accessibility

- All interactive elements are keyboard accessible
- ARIA labels should be added for screen readers
- Color is not the only indicator (icons + text used)
- Focus states are visible
- Semantic HTML structure

Add ARIA labels:

```tsx
<button aria-label="Create new batch">
  <Plus className="size-5" />
</button>
```
