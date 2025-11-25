# Integration Guide

## Overview

This guide will help you integrate the dashboard into your existing application and connect it to your real data sources.

## Step 1: Copy Files

Copy the following files to your project:

```
/App.tsx → /src/pages/Dashboard.tsx (or your preferred location)
/components/StatCard.tsx
/components/BatchList.tsx
/components/EnvironmentalStatus.tsx
/components/AlertsList.tsx
/components/ActivityChart.tsx
/components/QuickActions.tsx
```

## Step 2: Install Dependencies

Ensure you have the required packages:

```bash
npm install motion lucide-react
# or
yarn add motion lucide-react
```

Make sure you're using Tailwind CSS v4.0 and have the following in your `globals.css`:

```css
@import "tailwindcss";
```

## Step 3: Connect to Your Data

### Stats Data

Replace the mock stats in `App.tsx`:

```tsx
// Current (mock data)
const stats = [
  { title: "Active Batches", value: "24", subtitle: "+3 from last week", icon: Boxes, gradient: "bg-gradient-to-br from-teal-500 to-emerald-500" },
  // ...
];

// Replace with (your data)
const stats = [
  { 
    title: "Active Batches", 
    value: activeBatches.length.toString(), 
    subtitle: `+${batchGrowth} from last week`, 
    icon: Boxes, 
    gradient: "bg-gradient-to-br from-teal-500 to-emerald-500" 
  },
  // ...
];
```

### Batch List Data

In `BatchList.tsx`, replace the mock batches array:

```tsx
// Current (mock)
const batches = [
  { id: "B-2024-001", name: "Batch Alpha", plants: 150, day: 45, progress: 75, status: "active" as const },
  // ...
];

// Replace with your API call or state
import { useEffect, useState } from 'react';

export function BatchList() {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    // Fetch from your API
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => setBatches(data));
  }, []);

  // Rest of component...
}
```

### Environmental Data

In `EnvironmentalStatus.tsx`, connect to your sensor data:

```tsx
// Current (mock)
const metrics = [
  { label: "Temperature", value: "24°C", status: "optimal" as const, icon: Thermometer, range: "22-26°C" },
  // ...
];

// Replace with real-time data
const [metrics, setMetrics] = useState([]);

useEffect(() => {
  // WebSocket or polling for real-time data
  const ws = new WebSocket('ws://your-server/environmental');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setMetrics([
      { 
        label: "Temperature", 
        value: `${data.temperature}°C`, 
        status: getTemperatureStatus(data.temperature), 
        icon: Thermometer, 
        range: "22-26°C" 
      },
      // ...
    ]);
  };

  return () => ws.close();
}, []);
```

### Alerts Data

In `AlertsList.tsx`, connect to your alerts system:

```tsx
// Current (mock)
const alerts = [
  { id: 1, message: "High CO2 levels detected in Pod B-3", severity: "high" as const, time: "5 minutes ago" },
  // ...
];

// Replace with your alerts
const [alerts, setAlerts] = useState([]);

useEffect(() => {
  fetch('/api/alerts?limit=5')
    .then(res => res.json())
    .then(data => setAlerts(data));
}, []);
```

### Activity Chart Data

In `ActivityChart.tsx`, replace the weekly data:

```tsx
// Current (mock)
const data = [
  { day: "Mon", value: 45 },
  // ...
];

// Replace with your analytics
const [activityData, setActivityData] = useState([]);

useEffect(() => {
  fetch('/api/analytics/weekly')
    .then(res => res.json())
    .then(data => setActivityData(data));
}, []);
```

## Step 4: Wire Up Quick Actions

In `QuickActions.tsx`, add onClick handlers:

```tsx
const actions = [
  {
    icon: Plus,
    label: "New Batch",
    gradient: "from-teal-500 to-emerald-500",
    delay: 0,
    onClick: () => router.push('/batches/new')
  },
  {
    icon: FileText,
    label: "Reports",
    gradient: "from-blue-500 to-indigo-500",
    delay: 0.1,
    onClick: () => router.push('/reports')
  },
  // ...
];

// Update the button in the component
<motion.button
  onClick={action.onClick}
  // ... rest of props
>
```

## Step 5: Add Navigation

Update the navigation bar in `App.tsx`:

```tsx
// Add real navigation handlers
<motion.button
  onClick={() => router.push('/profile')}
  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-4 py-3 rounded-2xl transition-all"
>
  <User className="size-5 text-white" />
  <span className="text-white hidden md:block">{userName}</span>
</motion.button>
```

## Step 6: Add Real-Time Updates

For live data updates, implement polling or WebSocket connections:

```tsx
// Example: Real-time stats updates
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, 30000); // Update every 30 seconds

  return () => clearInterval(interval);
}, []);
```

## Step 7: Error Handling

Add error handling for data fetching:

```tsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/batches')
    .then(res => res.json())
    .then(data => {
      setBatches(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

## Step 8: Authentication

Wrap the dashboard with authentication:

```tsx
// In your routing
import { ProtectedRoute } from './auth/ProtectedRoute';

<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

## API Endpoints Expected

Your backend should provide these endpoints:

- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/batches?limit=5` - Recent batches
- `GET /api/environmental/current` - Current environmental readings
- `GET /api/alerts?limit=5` - Recent alerts
- `GET /api/analytics/weekly` - Weekly activity data

## Data Formats

### Batch Object
```typescript
interface Batch {
  id: string;
  name: string;
  plants: number;
  day: number;
  progress: number;
  status: "active" | "complete" | "warning";
}
```

### Alert Object
```typescript
interface Alert {
  id: number;
  message: string;
  severity: "low" | "medium" | "high";
  time: string;
}
```

### Environmental Metric
```typescript
interface EnvironmentalMetric {
  label: string;
  value: string;
  status: "optimal" | "warning" | "critical";
  range: string;
}
```

## Testing

After integration, test:

1. ✅ Data loads correctly from your API
2. ✅ Real-time updates work as expected
3. ✅ Animations don't interfere with performance
4. ✅ Quick actions navigate correctly
5. ✅ Responsive design works on mobile
6. ✅ Error states display properly
7. ✅ Loading states are smooth

## Performance Considerations

- Animations use GPU-accelerated transforms
- Consider debouncing real-time updates
- Implement data caching where appropriate
- Use React.memo() for expensive components
- Lazy load chart data if necessary

## Next Steps

- Implement data fetching hooks
- Add loading skeletons
- Set up error boundaries
- Configure WebSocket connections
- Add user preferences (theme, layout)
- Implement data export functionality
