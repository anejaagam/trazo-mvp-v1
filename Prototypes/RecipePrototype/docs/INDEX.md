# Trazo Control Documentation Index

## Documentation Structure

All documentation is located in the `/docs/` directory and organized into focused files under 500 lines each.

---

## Quick Navigation

### Getting Started
- **[README.md](README.md)**: System overview, quick start, core features
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Technical architecture, state management, data flow

### Components
- **[COMPONENTS-MAIN.md](COMPONENTS-MAIN.md)**: Main application components (App, RecipeLibrary, RecipeAuthor, etc.)
- **[COMPONENTS-UI.md](COMPONENTS-UI.md)**: UI patterns, styling, color system, responsive design

### Data Model
- **[DATA-TYPES.md](DATA-TYPES.md)**: TypeScript type definitions, enums, validation bounds
- **[DATA-ENTITIES.md](DATA-ENTITIES.md)**: Core entity interfaces, relationships, constraints

---

## Document Summaries

### README.md (170 lines)
**Topics Covered**:
- System overview and purpose
- Technology stack
- Core features (5 modules)
- Environmental parameters
- Growth stages
- Control precedence hierarchy
- F2 specification compliance
- Mock data overview

**Who Should Read**: Everyone (start here)

---

### ARCHITECTURE.md (270 lines)
**Topics Covered**:
- Technology stack details
- Component hierarchy
- State management patterns
- Real-time features (override countdown)
- Validation architecture (4 layers)
- Routing and navigation
- Data management strategy
- Performance optimization
- Security considerations
- Deployment architecture
- Scalability planning

**Who Should Read**: Developers, architects, technical leads

---

### COMPONENTS-MAIN.md (440 lines)
**Topics Covered**:
- App.tsx (root component)
- RecipeLibrary (browsing, search)
- RecipeAuthor (creation, editing)
- RecipeViewer (read-only display)
- ScheduleManager + ScheduleForm
- BatchGroupManager + ApplyRecipeForm
- OverrideControl + OverrideForm
- AuditLog (compliance, export)
- Component state, props, functions
- UI organization per component

**Who Should Read**: Frontend developers, UI/UX designers

---

### COMPONENTS-UI.md (480 lines)
**Topics Covered**:
- shadcn/ui component library (42 components)
- Component patterns (Card, Dialog, Tabs, Badge, etc.)
- Toast notifications
- Alert patterns
- Progress bars
- Color system (status, semantic)
- Layout patterns (grid, spacing)
- Responsive design patterns
- Icon usage (lucide-react)
- Form patterns
- Button patterns
- Search & filter patterns
- Loading & empty states
- Accessibility patterns

**Who Should Read**: Frontend developers, UI/UX designers

---

### DATA-TYPES.md (460 lines)
**Topics Covered**:
- RecipeStatus (5 states)
- StageType (4 stages)
- SetpointType (6 parameters with units)
- OverrideStatus (5 states)
- Control precedence hierarchy
- Ramp interface
- BlackoutWindow interface
- ValidationError interface
- Scope types
- AuditEventType (6 types)
- Time & date formats (ISO 8601)
- Timezone support (IANA)
- ID formats (3 patterns)
- Validation bounds per parameter
- Duration units (days, seconds, minutes)
- Metadata structure
- Type guards
- Optional vs required fields

**Who Should Read**: Developers working with data structures

---

### DATA-ENTITIES.md (480 lines)
**Topics Covered**:
- SetpointTarget (complete interface)
- Stage (with examples)
- RecipeVersion (versioning)
- Recipe (top-level entity)
- Schedule (day/night cycles)
- BatchGroup (pod management)
- Override (manual control)
- AuditEvent (compliance)
- IrrigationProgram (future)
- Entity relationships (hierarchies)
- Data integrity rules
- Cascade behaviors
- Constraints per entity
- Field-by-field descriptions
- Real-world examples

**Who Should Read**: Backend developers, database designers, API developers

---

## File Sizes (Target: <500 lines each)

| File | Approximate Lines | Status |
|------|------------------|--------|
| README.md | ~170 | ✅ Well under limit |
| ARCHITECTURE.md | ~270 | ✅ Well under limit |
| COMPONENTS-MAIN.md | ~440 | ✅ Within limit |
| COMPONENTS-UI.md | ~480 | ✅ Within limit |
| DATA-TYPES.md | ~460 | ✅ Within limit |
| DATA-ENTITIES.md | ~480 | ✅ Within limit |

---

## Reading Paths

### For Product Managers / Stakeholders
1. Start: **[README.md](README.md)**
2. Understand architecture: **[ARCHITECTURE.md](ARCHITECTURE.md)**
3. Review components: **[COMPONENTS-MAIN.md](COMPONENTS-MAIN.md)**

### For Frontend Developers
1. Start: **[README.md](README.md)**
2. Architecture: **[ARCHITECTURE.md](ARCHITECTURE.md)**
3. Components: **[COMPONENTS-MAIN.md](COMPONENTS-MAIN.md)**
4. UI patterns: **[COMPONENTS-UI.md](COMPONENTS-UI.md)**
5. Data types: **[DATA-TYPES.md](DATA-TYPES.md)**

### For Backend Developers / API Developers
1. Start: **[README.md](README.md)**
2. Architecture: **[ARCHITECTURE.md](ARCHITECTURE.md)**
3. Data types: **[DATA-TYPES.md](DATA-TYPES.md)**
4. Entities: **[DATA-ENTITIES.md](DATA-ENTITIES.md)**

### For QA / Testing
1. Start: **[README.md](README.md)**
2. Components: **[COMPONENTS-MAIN.md](COMPONENTS-MAIN.md)**
3. Data model: **[DATA-ENTITIES.md](DATA-ENTITIES.md)**

### For DevOps / Infrastructure
1. Start: **[README.md](README.md)**
2. Architecture: **[ARCHITECTURE.md](ARCHITECTURE.md)** (especially deployment section)

---

## Document Maintenance

### Version Control
Each document includes:
- Document Version: 1.0.0
- Last Updated: November 7, 2025

### Update Guidelines
When updating documentation:
1. Keep files under 500 lines
2. If exceeding limit, split into new file
3. Update version number
4. Update "Last Updated" date
5. Update this INDEX.md with changes

### Splitting Guidelines
If a document approaches 500 lines:
1. Identify logical sections
2. Create new file with clear naming
3. Move content to new file
4. Add cross-references in both files
5. Update INDEX.md

---

## Additional Resources

### Code Comments
- Inline comments in complex functions
- JSDoc comments for public APIs (future)
- Component documentation in code

### External Resources
- React documentation: https://react.dev
- TypeScript handbook: https://www.typescriptlang.org/docs/
- Tailwind CSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com

### F2 Specification
- Control precedence hierarchy
- Stage-based environmental control
- Safety interlocks and guardrails
- Audit trail requirements
- Timing accuracy specifications

---

## Contributing to Documentation

### When to Update Docs
- New component added
- Data model changes
- New workflow implemented
- Architecture changes
- Bug fixes affecting documented behavior

### Documentation Style Guide
- Use clear, concise language
- Include code examples
- Add real-world scenarios
- Maintain consistent formatting
- Keep examples up-to-date with code

### Example Format
```typescript
// Code example with comments
const example = () => {
  // Implementation
};
```

**Description**: What the code does

**Use Case**: When to use it

**Example**: Real-world scenario

---

## Glossary

**Batch Group**: Group of pods managed together with shared recipe  
**Blackout Window**: Scheduled maintenance period with no control changes  
**Deadband**: Hysteresis band to prevent equipment cycling  
**Override**: Temporary manual setpoint change with auto-revert  
**Photoperiod**: Light-on duration per 24-hour cycle  
**Pod**: Individual growing unit  
**Recipe**: Stage-based environmental control configuration  
**Setpoint**: Target value for environmental parameter  
**Stage**: Growth phase (Germination, Vegetative, Flowering, Harvest)  
**TTL**: Time-to-live for override auto-revert  
**VPD**: Vapor Pressure Deficit (transpiration indicator)  

---

## Support

For questions about the documentation:
1. Check relevant doc file from index above
2. Search for keywords in files
3. Review code examples
4. Check external resources

---

**Index Version**: 1.0.0  
**Last Updated**: November 7, 2025
