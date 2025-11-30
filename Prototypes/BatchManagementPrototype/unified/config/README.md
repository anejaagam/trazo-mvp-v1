# Domain Configuration System

This directory contains the domain configuration and context management system.

## Files

### `domainConfig.ts`
Provides domain-specific configuration including:
- **Terminology mappings**: Adapts UI labels (e.g., "Strain" vs "Variety")
- **Feature flags**: Controls which features are available per domain
- **Units**: Domain-specific measurement units
- **Field visibility**: Controls which form fields appear
- **Color schemes**: Domain-specific UI colors

### `stageProgressions.ts`
Defines workflow stages and transitions:
- Stage definitions with labels, icons, colors
- Valid stage transitions and progressions
- Stage duration requirements (min/max days)
- Validation requirements for transitions
- Helper functions for stage logic

### `DomainContext.tsx` (in `contexts/`)
React context for domain state management:
- Provides `useDomain()` hook for accessing current domain
- Loads domain from environment variable or localStorage
- Manages domain switching
- Provides configuration and field visibility

### `DomainToggle.tsx` (in `components/`)
Development UI component:
- Toggle between cannabis and produce domains
- Only visible in development mode
- Forces reload on domain switch to ensure clean state

## Usage

### Setting up the Provider

Wrap your app with `DomainProvider`:

```tsx
import { DomainProvider } from './unified/contexts/DomainContext';
import { DomainToggle } from './unified/components/DomainToggle';

function App() {
  return (
    <DomainProvider>
      <YourApp />
      <DomainToggle /> {/* Development only */}
    </DomainProvider>
  );
}
```

### Using Domain Context

```tsx
import { useDomain } from './unified/contexts/DomainContext';

function BatchForm() {
  const { domain, config, fieldVisibility } = useDomain();
  
  return (
    <div>
      {/* Adapt label based on domain */}
      <label>{config.terminology.cultivar}</label>
      
      {/* Show/hide fields based on domain */}
      {fieldVisibility.metrcTags && (
        <input placeholder="METRC Tag" />
      )}
      
      {fieldVisibility.grade && (
        <select>
          <option>Grade A</option>
          <option>Grade B</option>
        </select>
      )}
    </div>
  );
}
```

### Using Stage Progressions

```tsx
import { getStageProgressions, isValidTransition } from './unified/config/stageProgressions';

function StageTransitionButton({ batch }) {
  const { domain } = useDomain();
  const stages = getStageProgressions(domain);
  
  const canTransition = isValidTransition(
    domain,
    batch.stage,
    'flowering'
  );
  
  return (
    <button disabled={!canTransition}>
      Transition to Flowering
    </button>
  );
}
```

## Environment Variables

Set the domain via environment variable (for production):

```bash
# .env
VITE_DOMAIN_TYPE=cannabis
# or
VITE_DOMAIN_TYPE=produce
```

In development, the domain toggle component allows switching without restart.

## Domain Configurations

### Cannabis
- **Terminology**: Strain, Pod/Room, Canopy Area, Potency
- **Features**: METRC compliance, plant tagging, lab testing
- **Units**: grams, sq ft
- **Colors**: Emerald/Green theme

### Produce
- **Terminology**: Variety, Growing Area, Yield, Grade
- **Features**: PrimusGFS compliance, grading, ripeness tracking
- **Units**: lbs, sq ft
- **Colors**: Orange/Amber theme

## Adding a New Domain

1. Add domain type to `DomainType` in `types/domains/base.ts`
2. Create domain config in `domainConfig.ts`
3. Create stage progressions in `stageProgressions.ts`
4. Create domain-specific types in `types/domains/yourdomain.ts`
5. Update discriminated unions in `types/domains/index.ts`
