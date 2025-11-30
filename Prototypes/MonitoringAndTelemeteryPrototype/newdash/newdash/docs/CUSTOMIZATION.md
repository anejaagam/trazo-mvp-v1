# Customization Guide

## Color Theme Customization

### Changing the Color Scheme

The dashboard uses a light green theme. Here's how to change it to other colors:

#### Option 1: Different Color Variations

**Blue Theme:**
```tsx
// In App.tsx
<div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100">

// Update floating orbs
className="bg-gradient-to-br from-cyan-300/30 to-blue-300/30"
className="bg-gradient-to-br from-sky-300/30 to-cyan-300/30"

// Update all emerald/teal/green colors to blue/sky/cyan equivalents
```

**Purple Theme:**
```tsx
// In App.tsx
<div className="min-h-screen bg-gradient-to-br from-purple-100 via-violet-50 to-indigo-100">

// Update floating orbs
className="bg-gradient-to-br from-indigo-300/30 to-purple-300/30"
className="bg-gradient-to-br from-violet-300/30 to-indigo-300/30"

// Update all emerald/teal/green colors to purple/violet/indigo
```

**Rose/Pink Theme:**
```tsx
// In App.tsx
<div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-100">
```

#### Option 2: Dark Theme

To convert to a dark theme:

```tsx
// App.tsx - Background
<div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950">

// Floating orbs (brighter for dark bg)
className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20"

// Cards - change to darker glassmorphism
className="bg-gray-900/80 backdrop-blur-xl border border-emerald-800/50"

// Text colors
text-emerald-900 → text-emerald-100
text-emerald-600 → text-emerald-400
text-emerald-700 → text-emerald-300
```

### Color Mapping Guide

Replace these colors throughout all components:

| Current Color | Dark Theme | Blue Theme | Purple Theme |
|--------------|------------|------------|--------------|
| `emerald-100` | `emerald-900` | `blue-100` | `purple-100` |
| `emerald-200` | `emerald-800` | `blue-200` | `purple-200` |
| `emerald-600` | `emerald-400` | `blue-600` | `purple-600` |
| `emerald-900` | `emerald-100` | `blue-900` | `purple-900` |
| `teal-500` | `teal-400` | `cyan-500` | `indigo-500` |
| `green-50` | `green-900` | `sky-50` | `violet-50` |

---

## Typography Customization

### Font Family

To change fonts, update your `globals.css`:

```css
/* Current default fonts are set in globals.css */

/* Example: Using custom fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
}

h1, h2, h3 {
  font-family: 'Inter', system-ui, sans-serif;
}
```

### Font Sizes

Font sizes are controlled by Tailwind's default typography. To customize:

```tsx
// Example: Making stat values larger
<motion.h2 className="text-emerald-900 text-5xl"> {/* Changed from text-4xl */}
  {value}
</motion.h2>
```

---

## Animation Customization

### Disabling Animations

For users who prefer reduced motion:

```tsx
// In App.tsx and all components, add this check
import { useReducedMotion } from 'motion/react';

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
    >
```

### Adjusting Animation Speed

Make animations faster or slower:

```tsx
// Slower animations (increase duration)
transition={{ duration: 1.2, delay }}  // Instead of 0.6

// Faster animations (decrease duration)
transition={{ duration: 0.3, delay }}  // Instead of 0.6

// Remove delays for instant appearance
transition={{ duration: 0.6, delay: 0 }}  // Instead of varying delays
```

### Changing Animation Type

```tsx
// Current: Spring animation
transition={{ duration: 0.6, delay, type: "spring" }}

// Change to: Smooth ease
transition={{ duration: 0.6, delay, ease: "easeInOut" }}

// Change to: Bounce
transition={{ duration: 0.6, delay, type: "spring", bounce: 0.5 }}
```

### Disabling Specific Animations

```tsx
// Remove hover lift effect
// Change from:
whileHover={{ y: -8, scale: 1.02 }}

// To:
whileHover={{ scale: 1.02 }}  // Only scale, no lift

// Or remove completely:
// Delete the whileHover prop entirely
```

---

## Layout Customization

### Changing Grid Columns

**Stats Grid:**
```tsx
// Current: 4 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Change to: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Change to: 2 columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

**Content Grid:**
```tsx
// Current: 3 columns on desktop (2 left, 1 right)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2"> {/* Left takes 2 columns */}
  <div> {/* Right takes 1 column */}

// Change to: Equal 2 columns
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div> {/* Each takes 1 column */}
  <div>
```

### Adjusting Spacing

```tsx
// Gap between grid items
gap-6  // Current (24px)
gap-4  // Smaller (16px)
gap-8  // Larger (32px)

// Padding inside cards
p-6    // Current (24px)
p-4    // Smaller (16px)
p-8    // Larger (32px)

// Margin between sections
mb-8   // Current (32px)
mb-6   // Smaller (24px)
mb-12  // Larger (48px)
```

### Maximum Width

```tsx
// Current maximum width
<div className="max-w-[1600px] mx-auto">

// Narrower layout
<div className="max-w-[1200px] mx-auto">

// Wider layout
<div className="max-w-[1920px] mx-auto">

// Full width
<div className="max-w-full mx-auto">
```

---

## Component-Specific Customization

### StatCard

**Change Card Shape:**
```tsx
// Current: Rounded 3xl
className="rounded-3xl"

// More rounded
className="rounded-full"

// Less rounded
className="rounded-xl"

// Square
className="rounded-none"
```

**Change Icon Size:**
```tsx
// Current
<Icon className="size-6" />

// Larger
<Icon className="size-8" />

// Smaller
<Icon className="size-4" />
```

### BatchList

**Add More Batches:**
```tsx
// Change the number of batches displayed
const batches = [
  // Add more batch objects
  { id: "B-2024-005", name: "Batch Epsilon", plants: 95, day: 12, progress: 20, status: "active" },
];
```

**Change Progress Bar Style:**
```tsx
// Current: Thin bar
<div className="w-16 h-1.5">

// Thicker bar
<div className="w-16 h-3">

// Circular progress (replace the div)
<CircularProgress value={batch.progress} />
```

### EnvironmentalStatus

**Change Pod Grid:**
```tsx
// Current: 2x2 grid (4 pods)
<div className="grid grid-cols-2 gap-3">

// Change to: 3x3 grid (9 pods)
<div className="grid grid-cols-3 gap-3">

// Change to: Single row (4 pods)
<div className="flex gap-3">
```

**Add More Metrics:**
```tsx
const metrics = [
  { label: "Temperature", value: "24°C", status: "optimal", icon: Thermometer, range: "22-26°C" },
  { label: "Humidity", value: "65%", status: "optimal", icon: Droplets, range: "60-70%" },
  { label: "CO2", value: "850ppm", status: "warning", icon: Wind, range: "400-1000ppm" },
  // Add new metric
  { label: "pH Level", value: "6.5", status: "optimal", icon: Beaker, range: "6.0-7.0" },
  { label: "EC Level", value: "1.8", status: "optimal", icon: Zap, range: "1.5-2.5" },
];
```

### AlertsList

**Change Alert Limit:**
```tsx
// Show more or fewer alerts by adding/removing items in the array
const alerts = [
  // Add more alert objects or remove some
];
```

**Change Time Format:**
```tsx
// Current: Relative time ("5 minutes ago")
time: "5 minutes ago"

// Change to: Absolute time
time: "2:45 PM"

// Change to: Full timestamp
time: "Nov 23, 2025 2:45 PM"
```

### ActivityChart

**Change Chart Height:**
```tsx
// Current
<div className="relative h-48">

// Taller
<div className="relative h-64">

// Shorter
<div className="relative h-32">
```

**Change Bar Width:**
```tsx
// Current: Auto-width based on gap
gap-4

// Wider bars (less gap)
gap-2

// Narrower bars (more gap)
gap-6
```

**Change to Different Chart Type:**

Replace with a line chart:
```tsx
// Instead of bars, draw a line with Motion's path
<motion.svg className="absolute inset-0" viewBox="0 0 100 100">
  <motion.path
    d="M 0,80 L 20,70 L 40,75 L 60,60 L 80,65 L 100,50"
    stroke="url(#gradient)"
    fill="none"
    strokeWidth="2"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
  />
</motion.svg>
```

---

## Glassmorphism Effects

### Adjusting Blur

```tsx
// Current blur strength
backdrop-blur-xl  // 24px blur

// Less blur
backdrop-blur-lg  // 16px blur
backdrop-blur-md  // 12px blur

// More blur
backdrop-blur-2xl // 40px blur
backdrop-blur-3xl // 64px blur
```

### Adjusting Transparency

```tsx
// Current card transparency
bg-white/80  // 80% opacity

// More transparent
bg-white/60  // 60% opacity

// Less transparent
bg-white/90  // 90% opacity

// Fully opaque
bg-white     // 100% opacity
```

### Border Opacity

```tsx
// Current
border-emerald-200/50  // 50% opacity

// More visible
border-emerald-200/80  // 80% opacity

// Less visible
border-emerald-200/30  // 30% opacity
```

---

## Navigation Bar

### Hide Search Bar

```tsx
// Remove or comment out the search bar section
{/* 
<div className="flex-1 max-w-md mx-8 hidden lg:block">
  ...
</div>
*/}
```

### Add More Nav Items

```tsx
<div className="flex items-center gap-3">
  {/* Existing buttons */}
  
  {/* Add new button */}
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="p-3 bg-emerald-100 hover:bg-emerald-200 rounded-2xl transition-colors"
  >
    <Help className="size-5 text-emerald-700" />
  </motion.button>
</div>
```

### Change Logo

```tsx
// Current
<Sprout className="size-8 text-teal-600" />
<span className="text-emerald-900 text-xl">GrowPro</span>

// Replace with image
<img src="/logo.png" alt="Logo" className="h-8" />
<span className="text-emerald-900 text-xl">Your App Name</span>
```

---

## Background Effects

### Remove Floating Orbs

```tsx
// Delete or comment out the animated background divs
{/* 
<motion.div
  animate={{ ... }}
  className="absolute top-0 right-0 ..."
/>
*/}
```

### Add More Orbs

```tsx
{/* Add third orb */}
<motion.div
  animate={{
    scale: [1, 1.3, 1],
    rotate: [0, -90, 0],
  }}
  transition={{
    duration: 30,
    repeat: Infinity,
    ease: "linear",
  }}
  className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"
/>
```

### Change Orb Animation

```tsx
// Current: Rotating and scaling
animate={{
  scale: [1, 1.2, 1],
  rotate: [0, 90, 0],
}}

// Change to: Only pulsing
animate={{
  scale: [1, 1.2, 1],
  opacity: [0.2, 0.3, 0.2],
}}

// Change to: Moving position
animate={{
  x: [0, 100, 0],
  y: [0, 50, 0],
}}
```

---

## Shadow Customization

```tsx
// Current shadow
shadow-2xl  // Large shadow

// Change to:
shadow-xl   // Medium-large
shadow-lg   // Medium
shadow-md   // Small-medium
shadow-sm   // Small
shadow-none // No shadow
```

---

## Badge Customization

Badges are used for status indicators.

```tsx
// Current
<Badge variant="outline" className="bg-teal-50 text-teal-700">

// Filled badge
<Badge className="bg-teal-500 text-white">

// Different variant
<Badge variant="secondary" className="...">
```

---

## Quick Reference: Common Customizations

### Make Everything Bigger
- Increase padding: `p-6` → `p-8`
- Increase gaps: `gap-6` → `gap-8`
- Increase font sizes: Add larger text classes
- Increase icon sizes: `size-6` → `size-8`

### Make Everything Smaller
- Decrease padding: `p-6` → `p-4`
- Decrease gaps: `gap-6` → `gap-4`
- Decrease font sizes: Add smaller text classes
- Decrease icon sizes: `size-6` → `size-4`

### Make More Compact
- Reduce margins: `mb-8` → `mb-4`
- Reduce padding: `p-6` → `p-3`
- Reduce rounded corners: `rounded-3xl` → `rounded-xl`
- Reduce gaps: `gap-6` → `gap-3`

### Make More Spacious
- Increase margins: `mb-8` → `mb-12`
- Increase padding: `p-6` → `p-10`
- Increase rounded corners: `rounded-3xl` → `rounded-full`
- Increase gaps: `gap-6` → `gap-10`

---

## Browser Compatibility

Ensure these features are supported:

- **backdrop-filter** (for glassmorphism): All modern browsers
- **CSS Grid**: All modern browsers
- **CSS Gradients**: All modern browsers
- **Motion animations**: All modern browsers

For older browsers, consider:
- Adding fallback colors
- Graceful degradation of effects
- Polyfills if necessary
