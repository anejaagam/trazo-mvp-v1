# 🎯 How to View the Unified Components Live

## Quick Start (2 Steps)

### 1. Start the Dev Server

```bash
npm run dev
```

### 2. Open in Browser

Navigate to: **http://localhost:5173/unified.html**

That's it! 🎉

---

## 🖥️ What You'll See

### Navigation Tabs
1. **Batch Management** - Create, view, edit batches with domain-aware fields
2. **Workflows** - Production workflow orchestration (switches between Cannabis/Produce)
3. **Flow Demos** - Step-by-step workflow walkthroughs with progress tracking
4. **Validation** - Interactive validation rule testing

### Domain Toggle
**Top-right corner** - Switch between Cannabis 🌿 and Produce 🥬 modes instantly

---

## 🌿 Cannabis Mode Features

- **Workflows**: Propagation → Harvest → Post-Harvest
- **17 workflow steps** across 5 complete flows
- **METRC compliance**: 0.1g minimum tracking
- **Components integrated**:
  - DryingCuringTracking
  - CannabisTestingIntegration  
  - MetrcTagManagement
  - WasteTracking & QuarantineManagement

---

## 🥬 Produce Mode Features

- **Workflows**: Cultivation → Processing → Cold Storage
- **16 workflow steps** across 5 complete flows
- **Food safety**: 5g minimum tracking (updated!)
- **Components integrated**:
  - GradingSystem
  - RipenessTracking
  - ColdStorageManagement
  - ProducePackaging
  - WasteTracking & QuarantineManagement

---

## 🛠️ Testing Validations Live

Go to the **Validation** tab to interactively test:

### Quantity Validation
- Try splitting batches below minimum (will show error)
- Cannabis: 0.1g minimum
- Produce: 5g minimum (just updated!)

### Stage Transition Rules
- Select current/next stages
- See allowed transitions and duration requirements
- Try invalid transitions (will show error)

### Date Validation
- Test harvest dates against batch start
- See warnings for unusual timelines
- Cannabis typical: 60-180 days
- Produce typical: 21-120 days

---

## 📂 File Locations

All unified code is in:
```
/unified/
  App.tsx                    # Main app (what you'll see)
  main.tsx                   # Entry point
  components/                # All 25+ components
  lib/validations.ts         # Business rules (quantity mins updated)
  hooks/useValidation.ts     # Validation hooks
```

Main HTML entry:
```
/unified.html                # Load this in browser
```

---

## 🔧 Advanced Options

### Set Default Domain

Create/edit `.env`:
```bash
VITE_DOMAIN_TYPE=cannabis  # or produce
```

### Run Specific Variant

Cannabis only:
```bash
npm run dev:cannabis
```

Produce only:
```bash
npm run dev:produce
```

But the **unified app** (`/unified.html`) lets you switch between both dynamically!

---

## 📊 Current Progress

**16/19 Tasks Complete (84.2%)**

✅ Phases 1-5 Complete:
- Type System & Domain Config
- Service Layer & Hooks  
- Component Unification
- Domain-Specific Features
- Complete Workflows & Validations

🔜 Phase 6: Testing & Documentation (next)

---

Happy testing! 🚀
