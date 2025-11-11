# System Architecture

## Technology Stack

### Frontend Framework
- **React 18**: Core UI framework with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS v4.0**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components

### Libraries
- **lucide-react**: Icon library
- **sonner@2.0.3**: Toast notifications
- **react-hook-form**: Form handling (not yet implemented)
- **recharts**: Charting (future feature)

### Build & Development
- Modern ES6+ JavaScript
- No build configuration needed (handled by runtime)
- Hot module reloading in development

## Application Architecture

### Component Hierarchy

```
App.tsx (Root)
├── Header (branding, user context)
└── Tabs Navigation
    ├── RecipeLibrary
    │   ├── RecipeAuthor (modal state)
    │   └── RecipeViewer (modal state)
    ├── ScheduleManager
    │   └── ScheduleForm (dialog)
    ├── BatchGroupManager
    │   └── ApplyRecipeForm (dialog)
    ├── OverrideControl
    │   └── OverrideForm (dialog)
    └── AuditLog
```

### State Management

**Local Component State**:
- Each component manages its own state using React hooks
- No global state management (Redux/MobX)
- Parent-child communication via props
- Suitable for demo/prototype scale

**State Patterns**:
```typescript
// List state
const [items, setItems] = useState<Item[]>(mockItems);

// Modal/dialog state
const [isOpen, setIsOpen] = useState(false);

// Form state
const [formData, setFormData] = useState({ field: '' });

// Selected item state
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### Data Flow

```
User Interaction
    ↓
Event Handler
    ↓
Validation
    ↓
State Update (setState)
    ↓
React Re-render
    ↓
UI Update
    ↓
Toast Notification
```

## Real-Time Features

### Override Countdown Timers

**Implementation**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setOverrides(current => 
      current.map(override => {
        if (override.status === 'Active' && override.expiresAt) {
          const remaining = new Date(override.expiresAt).getTime() - Date.now();
          if (remaining <= 0) {
            return { ...override, status: 'Reverted', revertedAt: new Date().toISOString() };
          }
        }
        return override;
      })
    );
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

**Features**:
- 1-second update interval
- Auto-revert on expiration
- Cleanup on component unmount
- Progress bar animation

### Future Real-Time (Production)

**WebSocket Integration**:
```typescript
// Pseudo-code for future implementation
const ws = new WebSocket('wss://api.trazo.com/events');

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch(type) {
    case 'OVERRIDE_UPDATED':
      updateOverride(payload);
      break;
    case 'RECIPE_ACTIVATED':
      updateBatchGroup(payload);
      break;
    case 'SENSOR_READING':
      updateSensorData(payload);
      break;
  }
};
```

## Validation Architecture

### Multi-Layer Validation

**1. Field-Level Validation**:
```typescript
// Input validation on change
<Input
  type="number"
  min={0}
  max={100}
  onChange={(e) => {
    const value = parseFloat(e.target.value);
    if (value < 0 || value > 100) {
      setError('Value must be between 0 and 100');
    }
  }}
/>
```

**2. Form-Level Validation**:
```typescript
// Validate all fields before submit
const validateRecipe = (): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!recipeName.trim()) {
    errors.push({ field: 'name', message: 'Recipe name is required', severity: 'error' });
  }
  
  if (stages.length === 0) {
    errors.push({ field: 'stages', message: 'At least one stage required', severity: 'error' });
  }
  
  return errors;
};
```

**3. Business Rule Validation**:
```typescript
// Check for conflicting setpoints
const tempSetpoints = stage.setpoints.filter(sp => sp.type === 'Temperature');
if (tempSetpoints.length > 1) {
  errors.push({ 
    field: `stage-${idx}`, 
    message: 'Conflicting temperature setpoints', 
    severity: 'warning' 
  });
}
```

**4. Safety Bounds Validation**:
```typescript
// Enforce min/max limits
if (sp.minValue !== undefined && sp.value < sp.minValue) {
  errors.push({ 
    field: `setpoint-${sp.id}`, 
    message: `${sp.type} value below minimum (${sp.minValue})`, 
    severity: 'error' 
  });
}
```

### Error Severity

**Error** (blocks save/publish):
- Required fields missing
- Values out of bounds
- Invalid data types

**Warning** (advisory, can proceed):
- Duplicate setpoints
- Unusual configurations
- Best practice violations

## Routing & Navigation

### Tab-Based Navigation

**Current Implementation**:
```typescript
const [activeTab, setActiveTab] = useState('recipes');

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="recipes">Recipes</TabsTrigger>
    <TabsTrigger value="schedules">Schedules</TabsTrigger>
    {/* ... */}
  </TabsList>
  <TabsContent value="recipes">
    <RecipeLibrary />
  </TabsContent>
</Tabs>
```

**Future: URL Routing**:
```typescript
// Using React Router
<Routes>
  <Route path="/recipes" element={<RecipeLibrary />} />
  <Route path="/recipes/:id" element={<RecipeViewer />} />
  <Route path="/schedules" element={<ScheduleManager />} />
  {/* ... */}
</Routes>
```

### Modal Navigation

**Pattern**:
```typescript
// State controls modal visibility
const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

// Open modal
onClick={() => setSelectedRecipe(recipe)}

// Conditional rendering
{selectedRecipe && (
  <RecipeViewer 
    recipe={selectedRecipe}
    onClose={() => setSelectedRecipe(null)}
  />
)}
```

## Data Management

### Mock Data Strategy

**Current** (Demo):
```typescript
// Static mock data loaded on component mount
import { mockRecipes, mockSchedules } from '../lib/mockData';

const [recipes] = useState<Recipe[]>(mockRecipes);
```

**Future** (Production):
```typescript
// API data fetching
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchRecipes() {
    const response = await fetch('/api/recipes');
    const data = await response.json();
    setRecipes(data);
    setLoading(false);
  }
  fetchRecipes();
}, []);
```

### Data Persistence

**Current**: In-memory only (lost on page refresh)

**Future**: 
- **Database**: PostgreSQL for structured data
- **Cache**: Redis for real-time sensor data
- **Storage**: S3 for audit log archives
- **Sync**: Real-time sync via WebSocket

## Performance Optimization

### Current Optimizations

**1. Computed Values**:
```typescript
// Filter/search computed on render (acceptable for small datasets)
const filteredRecipes = recipes.filter(recipe => 
  recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**2. Cleanup**:
```typescript
// Clean up timers on unmount
useEffect(() => {
  const interval = setInterval(/* ... */);
  return () => clearInterval(interval);
}, []);
```

### Future Optimizations

**1. React.memo**:
```typescript
const RecipeCard = React.memo(({ recipe }) => {
  // Prevents re-render if props unchanged
});
```

**2. useMemo**:
```typescript
const filteredRecipes = useMemo(() => 
  recipes.filter(/* ... */),
  [recipes, searchQuery]
);
```

**3. Pagination**:
```typescript
const paginatedRecipes = recipes.slice(
  (page - 1) * pageSize,
  page * pageSize
);
```

**4. Virtualization**:
```typescript
// For large lists
import { VirtualizedList } from 'react-window';
```

## Error Handling

### User-Facing Errors

**Toast Notifications**:
```typescript
toast.error('Cannot save recipe with validation errors');
toast.success('Recipe published successfully');
toast.warning('Blackout window may conflict');
```

**Inline Validation**:
```typescript
<Alert variant="destructive">
  <AlertDescription>
    Recipe validation issues:
    <ul>{errors.map(err => <li>{err.message}</li>)}</ul>
  </AlertDescription>
</Alert>
```

### Future: Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Security Considerations

### Current (Demo)

- No authentication (demo only)
- No authorization checks
- Client-side only

### Future (Production)

**Authentication**:
```typescript
// JWT token storage
const token = localStorage.getItem('auth_token');

// API requests with auth
fetch('/api/recipes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Authorization**:
```typescript
// Role-based access control
if (user.role === 'grower') {
  // Can create/edit recipes
}
if (user.role === 'viewer') {
  // Read-only access
}
```

**Data Validation**:
- Server-side validation (never trust client)
- Input sanitization
- SQL injection prevention
- XSS protection

## Accessibility

### Current Implementation

**Semantic HTML**:
```tsx
<button>Click me</button>  // Not <div onClick>
<label htmlFor="name">Name</label>
<input id="name" />
```

**Keyboard Navigation**:
- Tab order follows visual order
- Enter submits forms
- Escape closes dialogs
- Focus management in modals

**Screen Reader Support**:
- ARIA labels via shadcn/ui
- Status announcements via toast
- Descriptive button text

### WCAG Compliance

**Color Contrast**:
- All text meets WCAG AA standards
- Color not sole indicator (icons + text)

**Focus Indicators**:
- Visible focus rings on interactive elements
- High contrast focus states

## Deployment Architecture

### Current (Demo)

Single-page application deployed as static files:
```
index.html
└── JavaScript bundle (React app)
```

### Future (Production)

```
┌─────────────────┐
│   CDN/Static    │  ← React SPA (HTML, JS, CSS)
│    Hosting      │
└─────────────────┘
        ↓
┌─────────────────┐
│   API Gateway   │  ← REST/GraphQL API
└─────────────────┘
        ↓
┌─────────────────┐
│  App Servers    │  ← Node.js/Python backend
│  (Load Balanced)│
└─────────────────┘
        ↓
┌─────────────────┐
│    Database     │  ← PostgreSQL (recipes, schedules, etc.)
│  (Primary/Replica)│
└─────────────────┘

┌─────────────────┐
│  Edge Control   │  ← On-premise controllers
│    (Trazo Edge) │  ← Real-time equipment control
└─────────────────┘
        ↑
    WebSocket
        ↓
┌─────────────────┐
│  IoT Gateway    │  ← MQTT/Modbus bridge
└─────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

**Stateless API**:
- No server-side sessions
- JWT for authentication
- Database for persistence

**Load Balancing**:
- Multiple API instances
- Round-robin or least-connections
- Health check endpoints

### Database Scaling

**Read Replicas**:
- Primary for writes
- Replicas for reads
- Recipe library, schedules (read-heavy)

**Partitioning**:
- Partition audit events by date
- Archive old data to cold storage

### Caching Strategy

**Redis Cache**:
- Sensor readings (TTL: 60 seconds)
- Active overrides (TTL: based on override duration)
- Recipe library (invalidate on publish)

## Monitoring & Observability

### Future Implementation

**Metrics**:
- API response times
- Error rates
- Override duration statistics
- Recipe activation success rate

**Logging**:
- Structured JSON logs
- Correlation IDs for request tracing
- Error stack traces

**Alerting**:
- Failed recipe activations
- Override expiration failures
- Safety interlock violations
- Database connection errors

---

**Document Version**: 1.0.0  
**Last Updated**: November 7, 2025
