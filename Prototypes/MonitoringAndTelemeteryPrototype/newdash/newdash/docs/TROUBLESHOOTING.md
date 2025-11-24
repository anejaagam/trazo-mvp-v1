# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Issue: Motion package not found
**Error:**
```
Module not found: Can't resolve 'motion/react'
```

**Solution:**
```bash
npm install motion
# or
yarn add motion
```

#### Issue: Lucide icons not loading
**Error:**
```
Module not found: Can't resolve 'lucide-react'
```

**Solution:**
```bash
npm install lucide-react
# or
yarn add lucide-react
```

#### Issue: ShadCN Badge component missing
**Error:**
```
Module not found: Can't resolve './components/ui/badge'
```

**Solution:**
Install the Badge component from ShadCN:
```bash
npx shadcn@latest add badge
```

---

### Display Issues

#### Issue: Glassmorphism effect not visible

**Problem:** Cards appear solid instead of translucent

**Causes:**
1. Browser doesn't support `backdrop-filter`
2. Parent container doesn't have a background

**Solutions:**
```tsx
// Add fallback for unsupported browsers
className="bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"

// Or use solid background as fallback
@supports not (backdrop-filter: blur(24px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

#### Issue: Gradients not showing

**Problem:** Background gradients appear as solid colors

**Solution:**
Ensure Tailwind v4 is properly configured:
```css
/* globals.css */
@import "tailwindcss";
```

#### Issue: Animations are choppy

**Problem:** Animations lag or stutter

**Causes:**
1. Too many animations running simultaneously
2. Browser performance issues
3. No GPU acceleration

**Solutions:**
```tsx
// 1. Reduce number of concurrent animations
// Increase stagger delays

// 2. Add will-change for GPU acceleration
className="will-change-transform"

// 3. Disable animations on low-end devices
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 4. Use transform instead of position changes
// Good:
animate={{ x: 10, scale: 1.1 }}
// Avoid:
animate={{ left: '10px', width: '110%' }}
```

---

### Layout Issues

#### Issue: Components overflow on mobile

**Problem:** Content is cut off or requires horizontal scrolling on mobile

**Solution:**
```tsx
// Ensure proper container padding
<div className="p-4 md:p-6 lg:p-8">

// Use responsive grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// Add overflow handling
<div className="overflow-x-auto">
```

#### Issue: Stats cards don't align properly

**Problem:** Cards have different heights or misaligned elements

**Solution:**
```tsx
// Ensure all cards use same structure
// Add min-height
className="min-h-[200px]"

// Or use flexbox alignment
className="flex flex-col justify-between h-full"
```

#### Issue: Gaps are inconsistent

**Problem:** Spacing looks uneven

**Solution:**
```tsx
// Use consistent gap values
gap-6  // For all grids

// Use consistent padding
p-6    // For all cards

// Use consistent margin
mb-8   // For all sections
```

---

### Data Integration Issues

#### Issue: Data not updating in real-time

**Problem:** Dashboard shows stale data

**Solutions:**
```tsx
// 1. Check polling interval
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);

// 2. Verify WebSocket connection
const ws = new WebSocket('ws://your-server');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('WebSocket error:', error);

// 3. Add error handling
fetch('/api/dashboard')
  .then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  })
  .catch(error => console.error('Fetch error:', error));
```

#### Issue: Mock data still showing

**Problem:** Real data doesn't replace mock data

**Solution:**
```tsx
// Ensure state is properly updated
const [batches, setBatches] = useState([]);

useEffect(() => {
  fetch('/api/batches')
    .then(res => res.json())
    .then(data => {
      setBatches(data.batches); // Make sure to update state
    });
}, []);

// Check that you're using the state variable
{batches.map(batch => // Not the mock data array
```

#### Issue: API data format doesn't match

**Problem:** Data from API causes errors

**Solution:**
```tsx
// Add data transformation layer
function transformBatch(apiBatch: any): Batch {
  return {
    id: apiBatch.batch_id || apiBatch.id,
    name: apiBatch.batch_name || apiBatch.name,
    plants: Number(apiBatch.plant_count || apiBatch.plants),
    day: Number(apiBatch.current_day || apiBatch.day),
    progress: Number(apiBatch.completion || apiBatch.progress),
    status: mapStatus(apiBatch.status)
  };
}

// Use transformation in fetch
.then(data => setBatches(data.map(transformBatch)))
```

---

### Performance Issues

#### Issue: Page loads slowly

**Problem:** Dashboard takes too long to render

**Solutions:**
```tsx
// 1. Lazy load components
const ActivityChart = lazy(() => import('./components/ActivityChart'));

// 2. Memoize expensive components
const BatchList = memo(({ batches }) => {
  // component code
});

// 3. Debounce updates
const debouncedUpdate = debounce((data) => {
  setData(data);
}, 300);

// 4. Reduce initial data load
// Load with limit and pagination
fetch('/api/batches?limit=5')
```

#### Issue: High memory usage

**Problem:** Dashboard uses too much memory over time

**Solutions:**
```tsx
// 1. Clean up intervals and listeners
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval); // Cleanup
}, []);

// 2. Clean up WebSocket connections
useEffect(() => {
  const ws = new WebSocket('ws://...');
  return () => ws.close(); // Cleanup
}, []);

// 3. Limit stored data
const [alerts, setAlerts] = useState([]);
// Keep only last 10 alerts
setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
```

---

### Animation Issues

#### Issue: Entrance animations only play once

**Problem:** Animations don't replay when navigating back

**Solution:**
```tsx
// Use key prop to force re-mount
<motion.div key={locationKey}>

// Or reset animations programmatically
const controls = useAnimation();
useEffect(() => {
  controls.start({ opacity: 1, y: 0 });
}, [pathname]);
```

#### Issue: Hover effects conflict

**Problem:** Multiple hover states activate simultaneously

**Solution:**
```tsx
// Use proper event propagation
onClick={(e) => {
  e.stopPropagation();
  handleClick();
}}

// Or use hover state management
const [hoveredItem, setHoveredItem] = useState(null);
onMouseEnter={() => setHoveredItem(item.id)}
```

#### Issue: Animations cause layout shift

**Problem:** Content jumps when animations play

**Solution:**
```tsx
// Use transform instead of position properties
// Good:
animate={{ x: 10, y: -5 }}

// Bad (causes layout shift):
animate={{ marginLeft: 10, marginTop: -5 }}

// Reserve space for animations
className="min-h-[200px]"
```

---

### Styling Issues

#### Issue: Tailwind classes not applying

**Problem:** Custom classes don't work

**Causes:**
1. Class names not in Tailwind's default configuration
2. Using arbitrary values incorrectly
3. Class purging in production

**Solutions:**
```tsx
// 1. Use arbitrary values correctly
className="w-[500px]" // Correct
className="w-500px"   // Wrong

// 2. Add custom colors to globals.css
@theme {
  --color-custom-green: #10b981;
}

// 3. Ensure classes are detected
// Don't use string concatenation
// Bad:
className={`bg-${color}-500`}

// Good:
className={color === 'green' ? 'bg-green-500' : 'bg-blue-500'}
```

#### Issue: Colors don't match design

**Problem:** Green shades look different than expected

**Solution:**
```tsx
// Check color consistency
// Ensure using same green scale throughout

// Background
bg-emerald-100  // Lightest
bg-emerald-200  // Borders
bg-emerald-600  // Secondary text
bg-emerald-900  // Primary text

// Or define custom colors
@theme {
  --color-brand-light: #d1fae5;
  --color-brand-main: #10b981;
  --color-brand-dark: #065f46;
}
```

#### Issue: Rounded corners not showing

**Problem:** `rounded-3xl` doesn't appear rounded

**Solution:**
```tsx
// Check for overflow hidden on parent
// Remove or adjust:
className="overflow-hidden" // This clips rounded corners

// Or apply rounding to parent as well
<div className="rounded-3xl overflow-hidden">
```

---

### Browser-Specific Issues

#### Issue: Safari glassmorphism broken

**Problem:** Backdrop blur doesn't work in Safari

**Solution:**
```css
/* Add Safari-specific prefix */
.glass-card {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px); /* Safari */
}
```

#### Issue: Firefox animation performance

**Problem:** Animations lag in Firefox

**Solution:**
```tsx
// Reduce blur complexity
backdrop-blur-xl → backdrop-blur-lg

// Simplify gradients
// Use solid colors as fallback
```

#### Issue: IE11 compatibility

**Problem:** Dashboard doesn't work in Internet Explorer

**Solution:**
This dashboard is built with modern web features and doesn't support IE11. Recommend users upgrade to a modern browser. Add a detection message:

```tsx
if (isIE11) {
  return <UnsupportedBrowser />;
}
```

---

### TypeScript Issues

#### Issue: Type errors with Motion

**Problem:** TypeScript complains about Motion props

**Solution:**
```tsx
// Install type definitions
npm install @types/motion

// Or use type assertion
<motion.div {...(props as any)}>

// Or define proper types
interface MotionDivProps extends MotionProps {
  className?: string;
  children: ReactNode;
}
```

#### Issue: Icon type errors

**Problem:** LucideIcon type not recognized

**Solution:**
```tsx
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
}

// Or use typeof
import { Boxes } from 'lucide-react';
interface Props {
  icon: typeof Boxes;
}
```

---

### Build Issues

#### Issue: Build fails in production

**Problem:** `npm run build` errors

**Common causes:**
```bash
# 1. Unused imports
# Remove any unused imports

# 2. Missing dependencies
npm install

# 3. TypeScript errors
# Fix all type errors

# 4. ESLint errors
# Fix linting issues or disable temporarily
```

#### Issue: Large bundle size

**Problem:** Build output is too large

**Solutions:**
```tsx
// 1. Use dynamic imports
const ActivityChart = lazy(() => import('./components/ActivityChart'));

// 2. Remove unused dependencies
npm uninstall unused-package

// 3. Analyze bundle
npm run build -- --analyze

// 4. Enable tree shaking
// Ensure imports are ESM
import { Boxes } from 'lucide-react'; // Good
const lucide = require('lucide-react'); // Bad
```

---

### Debugging Tips

#### Enable Debug Mode

```tsx
// Add console logs for debugging
useEffect(() => {
  console.log('Batches updated:', batches);
}, [batches]);

// Add error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  render() {
    return this.props.children;
  }
}
```

#### Check Animation State

```tsx
// Log animation states
<motion.div
  onAnimationStart={() => console.log('Animation started')}
  onAnimationComplete={() => console.log('Animation completed')}
>
```

#### Inspect Data Flow

```tsx
// Add data validation
useEffect(() => {
  if (!Array.isArray(batches)) {
    console.error('Batches is not an array:', batches);
  }
}, [batches]);
```

---

## Getting Help

If you're still experiencing issues:

1. **Check browser console** for error messages
2. **Verify dependencies** are correctly installed
3. **Test with mock data** to isolate data vs. UI issues
4. **Disable animations** temporarily to check if they're causing issues
5. **Check responsive design** in browser dev tools
6. **Clear cache** and rebuild
7. **Update packages** to latest versions

### Useful Commands

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for updates
npm outdated

# Update specific package
npm update motion

# Rebuild
npm run build

# Development mode with verbose logging
npm run dev -- --verbose
```

### Browser DevTools Tips

**Chrome/Edge:**
- F12 → Performance tab: Record and analyze performance
- F12 → Network tab: Check API calls
- F12 → Console tab: View errors and logs

**Firefox:**
- F12 → Performance: Check frame rate
- F12 → Inspector: Debug CSS issues

**Safari:**
- Develop → Show Web Inspector
- Develop → Experimental Features: Check feature support
