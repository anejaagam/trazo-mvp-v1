# UI Components & Patterns

## shadcn/ui Component Library

The application uses 42 pre-built components from shadcn/ui, located in `/components/ui/`.

### Commonly Used Components

**Layout & Structure**:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogTrigger`
- `Separator`

**Form Controls**:
- `Input` (text, number, date, time)
- `Textarea`
- `Label`
- `Button` (variants: default, outline, ghost, destructive)

**Feedback & Status**:
- `Badge`
- `Alert`, `AlertDescription`
- `Progress`
- Toast (via `sonner@2.0.3`)

**Full Component List**:
- accordion, alert-dialog, alert, aspect-ratio, avatar
- badge, breadcrumb, button
- calendar, card, carousel, chart, checkbox, collapsible, command, context-menu
- dialog, drawer, dropdown-menu
- form
- hover-card
- input-otp, input
- label
- menubar
- navigation-menu
- pagination, popover, progress
- radio-group, resizable
- scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch
- table, tabs, textarea, toggle-group, toggle, tooltip

---

## Component Patterns

### Card Layout Pattern

**Basic Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title Text</CardTitle>
    <CardDescription>Subtitle or description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
</Card>
```

**Card with Actions**:
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Title</CardTitle>
      <Button variant="outline" size="sm">
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Clickable Card**:
```tsx
<Card 
  className="cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => handleClick()}
>
  {/* Content */}
</Card>
```

---

### Modal Dialog Pattern

**Basic Dialog**:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Form Dialog**:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      New Item
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create Item</DialogTitle>
      <DialogDescription>Fill in the details below</DialogDescription>
    </DialogHeader>
    <form className="space-y-6">
      {/* Form fields */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

---

### Tab Navigation Pattern

**Horizontal Tabs**:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
    <TabsTrigger value="tab4">Tab 4</TabsTrigger>
  </TabsList>
  
  <TabsContent value="tab1">
    {/* Tab 1 content */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* Tab 2 content */}
  </TabsContent>
  {/* ... */}
</Tabs>
```

**Tabs with Icons**:
```tsx
<TabsTrigger value="recipes" className="flex items-center gap-2">
  <Leaf className="w-4 h-4" />
  Recipes
</TabsTrigger>
```

---

### Badge Pattern

**Status Badge**:
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Published': return 'bg-emerald-100 text-emerald-800';
    case 'Applied': return 'bg-blue-100 text-blue-800';
    case 'Draft': return 'bg-slate-100 text-slate-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

<Badge className={getStatusColor(status)}>
  {status}
</Badge>
```

**Multiple Badges**:
```tsx
<div className="flex items-center gap-2">
  <Badge className="bg-emerald-100 text-emerald-800">
    Published
  </Badge>
  <Badge variant="outline">
    batch_group
  </Badge>
</div>
```

---

### Toast Notifications

**Import**:
```typescript
import { toast } from 'sonner@2.0.3';
```

**Usage**:
```typescript
// Success
toast.success('Recipe published successfully');

// Error
toast.error('Cannot save recipe with validation errors');

// Warning
toast.warning('Blackout window may conflict');

// Info (default)
toast('Processing request...');
```

**With Actions**:
```typescript
toast.success('Recipe saved', {
  action: {
    label: 'View',
    onClick: () => navigate('/recipes/123')
  }
});
```

---

### Alert Pattern

**Error Alert**:
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>
    <p className="mb-2">Recipe validation issues:</p>
    <ul className="list-disc list-inside space-y-1">
      {errors.map((err, idx) => (
        <li key={idx} className="text-sm">{err.message}</li>
      ))}
    </ul>
  </AlertDescription>
</Alert>
```

**Info Alert**:
```tsx
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>
```

**Warning Alert**:
```tsx
<Alert className="border-amber-200 bg-amber-50">
  <AlertTriangle className="h-4 w-4 text-amber-600" />
  <AlertDescription>
    <p className="text-amber-900 mb-1">Safety Guardrails Active</p>
    <p className="text-amber-700">
      Non-curtailable photoperiod windows will be preserved.
    </p>
  </AlertDescription>
</Alert>
```

---

### Progress Bar Pattern

**Basic Progress**:
```tsx
<Progress value={progress} />
```

**With Label**:
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm">Time Remaining: 18:45</span>
    <span className="text-sm">25% elapsed</span>
  </div>
  <Progress value={25} />
</div>
```

**Calculating Progress**:
```typescript
const timeRemaining = calculateTimeRemaining(override.expiresAt);
const totalTime = override.ttl;
const progress = ((totalTime - timeRemaining) / totalTime) * 100;
```

---

## Color System

### Status Colors

```typescript
// Recipe/Override Status
'Published': 'bg-emerald-100 text-emerald-800'
'Applied': 'bg-blue-100 text-blue-800'
'Draft': 'bg-slate-100 text-slate-800'
'Deprecated': 'bg-amber-100 text-amber-800'
'Archived': 'bg-slate-100 text-slate-500'

'Active': 'bg-blue-100 text-blue-800'
'Reverted': 'bg-slate-100 text-slate-600'
'Blocked': 'bg-red-100 text-red-800'

// Event Types
'recipe_change': 'bg-emerald-100 text-emerald-800'
'override_event': 'bg-blue-100 text-blue-800'
'schedule_activation': 'bg-purple-100 text-purple-800'
'setpoint_update': 'bg-amber-100 text-amber-800'
'irrigation_cycle': 'bg-cyan-100 text-cyan-800'
'dr_event': 'bg-red-100 text-red-800'
```

### Semantic Colors

**Brand/Primary**: `emerald-600` (green)
```tsx
<div className="bg-emerald-600 p-2 rounded-lg">
  <Leaf className="w-6 h-6 text-white" />
</div>
```

**Success**: `emerald-*`
```tsx
<div className="bg-emerald-50 border border-emerald-200">
  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
</div>
```

**Warning**: `amber-*`
```tsx
<div className="bg-amber-50 border border-amber-200">
  <AlertTriangle className="w-5 h-5 text-amber-600" />
</div>
```

**Danger/Error**: `red-*`
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
</Alert>
```

**Info**: `blue-*`
```tsx
<div className="bg-blue-50 border border-blue-200">
  <Activity className="w-5 h-5 text-blue-600" />
</div>
```

**Neutral**: `slate-*`
```tsx
<p className="text-slate-600">Subtitle text</p>
<p className="text-slate-900">Title text</p>
```

---

## Layout Patterns

### Container Pattern

**Max-Width Container**:
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Content */}
</div>
```

### Grid Layouts

**Responsive Card Grid**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

**Form Grid**:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Field 1</Label>
    <Input />
  </div>
  <div>
    <Label>Field 2</Label>
    <Input />
  </div>
</div>
```

**Pod Status Grid**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
  {pods.map(pod => (
    <div key={pod} className="p-3 bg-white border rounded text-center">
      <p className="text-sm">{pod}</p>
    </div>
  ))}
</div>
```

### Spacing Utilities

**Vertical Spacing**:
```tsx
<div className="space-y-6">  {/* 24px between children */}
  <Section1 />
  <Section2 />
  <Section3 />
</div>

<div className="space-y-4">  {/* 16px between children */}
  <Card />
  <Card />
</div>

<div className="space-y-3">  {/* 12px between children */}
  <Input />
  <Input />
</div>
```

**Horizontal Spacing**:
```tsx
<div className="flex gap-2">   {/* 8px gap */}
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

<div className="flex gap-4">   {/* 16px gap */}
  <Card />
  <Card />
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind CSS)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Responsive Patterns

**Responsive Grid**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

**Responsive Padding**:
```tsx
<div className="px-4 sm:px-6 lg:px-8">
  {/* 16px mobile, 24px tablet, 32px desktop */}
</div>
```

**Responsive Text**:
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* Larger text on larger screens */}
</h1>
```

**Hide on Mobile**:
```tsx
<div className="hidden md:block">
  {/* Only visible on tablet and up */}
</div>
```

---

## Icon Usage

### lucide-react Icons

**Import**:
```typescript
import { Plus, Edit, Trash2, Search, Calendar, Clock } from 'lucide-react';
```

**Common Icons**:
- `Plus`: Add/Create actions
- `Edit`: Edit actions
- `Trash2`: Delete actions
- `Search`: Search inputs
- `Calendar`: Date/time related
- `Clock`: Time/duration
- `User`: User/actor information
- `Shield`: Safety/security
- `CheckCircle2`: Success states
- `XCircle`: Cancel/close actions
- `AlertTriangle`: Warnings
- `ArrowLeft`: Back navigation
- `Leaf`: Branding/recipes
- `Settings`: Configuration
- `FileText`: Documents/logs
- `Activity`: Status/monitoring

**Icon with Button**:
```tsx
<Button>
  <Plus className="w-4 h-4 mr-2" />
  New Recipe
</Button>
```

**Icon Only Button**:
```tsx
<Button variant="ghost" size="sm">
  <Edit className="w-4 h-4" />
</Button>
```

**Icon with Text**:
```tsx
<div className="flex items-center gap-2">
  <User className="w-4 h-4 text-slate-400" />
  <span className="text-slate-900">Sarah Chen</span>
</div>
```

---

## Form Patterns

### Basic Form Field

```tsx
<div>
  <Label htmlFor="recipeName">Recipe Name</Label>
  <Input
    id="recipeName"
    placeholder="e.g., Premium Flower Cycle"
    value={recipeName}
    onChange={(e) => setRecipeName(e.target.value)}
  />
</div>
```

### Form with Validation

```tsx
<div>
  <Label htmlFor="duration">Duration (days)</Label>
  <Input
    id="duration"
    type="number"
    value={duration}
    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
    min={1}
  />
  {duration <= 0 && (
    <p className="text-sm text-red-600 mt-1">
      Duration must be greater than 0
    </p>
  )}
</div>
```

### Input with Unit Display

```tsx
<div>
  <Label>Override Value</Label>
  <div className="flex gap-2">
    <Input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <span className="self-center text-sm text-slate-600">°C</span>
  </div>
</div>
```

### Select Dropdown

```tsx
<div>
  <Label>Parameter</Label>
  <select
    className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-md"
    value={parameter}
    onChange={(e) => setParameter(e.target.value)}
  >
    <option value="Temperature">Temperature</option>
    <option value="RH">RH</option>
    <option value="CO2">CO2</option>
  </select>
</div>
```

### Time Input

```tsx
<div>
  <Label>Day Start Time</Label>
  <Input
    type="time"
    value={dayStart}
    onChange={(e) => setDayStart(e.target.value)}
  />
</div>
```

### Textarea

```tsx
<div>
  <Label>Reason</Label>
  <Textarea
    placeholder="Explain the reason for this action..."
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    rows={3}
  />
</div>
```

---

## Button Patterns

### Button Variants

```tsx
// Default (primary)
<Button>Save</Button>

// Outline
<Button variant="outline">Cancel</Button>

// Ghost (minimal)
<Button variant="ghost">Close</Button>

// Destructive (danger)
<Button variant="destructive">Delete</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### Button with Icon

```tsx
<Button>
  <Plus className="w-4 h-4 mr-2" />
  New Recipe
</Button>
```

### Icon-Only Button

```tsx
<Button variant="ghost" size="sm">
  <Edit className="w-4 h-4" />
</Button>
```

### Button Group

```tsx
<div className="flex gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>
```

---

## Search & Filter Patterns

### Search Input

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <Input
    placeholder="Search recipes by name or author..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10"
  />
</div>
```

### Filter Buttons

```tsx
<div className="flex gap-2">
  {['all', 'Published', 'Applied', 'Draft'].map(status => (
    <Button
      key={status}
      variant={filterStatus === status ? 'default' : 'outline'}
      onClick={() => setFilterStatus(status)}
      size="sm"
    >
      {status === 'all' ? 'All' : status}
    </Button>
  ))}
</div>
```

---

## Loading & Empty States

### Empty State

```tsx
<Card>
  <CardContent className="py-12 text-center">
    <p className="text-slate-600">
      No recipes found matching your criteria
    </p>
  </CardContent>
</Card>
```

### Empty State with Icon

```tsx
<Card>
  <CardContent className="py-12 text-center">
    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
    <p className="text-slate-600">
      No audit events found
    </p>
  </CardContent>
</Card>
```

### Loading State (future)

```tsx
<Card>
  <CardContent className="py-12 text-center">
    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
    <p className="text-slate-600">Loading recipes...</p>
  </CardContent>
</Card>
```

---

## Accessibility Patterns

### Keyboard Navigation

- Tab key moves between interactive elements
- Enter key submits forms
- Escape key closes dialogs
- Focus visible on all interactive elements

### Screen Reader Support

```tsx
// Use semantic HTML
<button>Click me</button>  // Not <div onClick>

// Associate labels with inputs
<Label htmlFor="name">Name</Label>
<Input id="name" />

// Descriptive button text
<Button>
  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
  New Recipe
</Button>
```

---

**Document Version**: 1.0.0  
**Last Updated**: November 7, 2025
