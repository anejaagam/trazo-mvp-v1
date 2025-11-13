# TRAZO Batch Management Prototype

A standalone development environment for testing and demonstrating the TRAZO batch management system for both **Cannabis** and **Produce** domains.

## Quick Start

### Installation

```bash
npm install
```

### Running the Prototypes

Each variant runs on its own port for isolated testing:

#### Root Prototype (Port 3001)
```bash
npm run dev
```

#### Cannabis Variant (Port 3002)
```bash
npm run dev:cannabis
```

#### Produce Variant (Port 3003)
```bash
npm run dev:produce
```

## Project Structure

```
BatchManagementPrototype/
├── src/                    # Vite entry points
│   ├── main.tsx           # Root prototype entry
│   ├── cannabis-main.tsx  # Cannabis variant entry
│   └── produce-main.tsx   # Produce variant entry
├── cannabis/              # Cannabis domain implementation
│   ├── App.tsx
│   ├── components/
│   ├── types/
│   ├── lib/
│   └── docs/
├── produce/               # Produce domain implementation
│   ├── App.tsx
│   ├── components/
│   ├── types/
│   ├── lib/
│   └── docs/
├── unified/               # Future unified domain model
├── components/            # Shared UI components
└── App.tsx               # Root prototype app
```

## Development Workflow

### Testing Cannabis Features
1. Run `npm run dev:cannabis`
2. Browser opens at http://localhost:3002
3. Test cannabis-specific workflows:
   - Mother/Clone management
   - Vegetative → Flowering → Harvest
   - Drying/Curing processes
   - THC/CBD tracking
   - Metrc compliance placeholders

### Testing Produce Features
1. Run `npm run dev:produce`
2. Browser opens at http://localhost:3003
3. Test produce-specific workflows:
   - Seeding → Growing → Harvest
   - Quality grading
   - Ripeness tracking
   - Cold storage management

### Running Both Simultaneously
```bash
# Terminal 1
npm run dev:cannabis

# Terminal 2
npm run dev:produce
```

## Building for Production

```bash
# Build all variants
npm run build

# Build specific variant
npm run build:cannabis
npm run build:produce
```

Build outputs:
- Root: `dist/`
- Cannabis: `dist/cannabis/`
- Produce: `dist/produce/`

## Integration Plan

This prototype is being prepared for integration into the larger TRAZO platform. See:
- `IntegrationPlan.xml` - Detailed integration roadmap
- `AgentInstructions.md` - Development guidelines
- `cannabis/docs/` - Cannabis-specific documentation
- `produce/docs/` - Produce-specific documentation

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **shadcn/ui** - Component library
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## Key Features

### Batch Management
- Full CRUD operations for batches
- Stage-based lifecycle tracking
- Batch groups and bulk operations
- Timeline and audit trail

### Harvest Workflows
- Plant selection and tracking
- Weight recording
- Post-harvest processing
- Packaging and labeling

### Quality & Compliance
- Domain-specific quality metrics
- Quarantine management
- Waste tracking and disposal
- Evidence capture placeholders

### Location Management
- Room/Pod capacity monitoring
- Transfer workflows
- Multi-location support

## Next Steps

Follow the Integration Plan (Phase 1-8) to unify the cannabis and produce implementations into a single domain-aware system. See `IntegrationPlan.xml` for detailed tasks.

## Support

For questions about the prototype structure or integration plan, refer to:
- `AgentInstructions.md` - Complete development guide
- `cannabis/docs/COMPONENTS_GUIDE.md` - Component documentation
- `cannabis/docs/DATA_STRUCTURES.md` - Data model documentation
