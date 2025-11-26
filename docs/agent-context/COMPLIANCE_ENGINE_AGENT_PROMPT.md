# Compliance Engine Agent Context

**Role:** You are an expert Full-Stack Engineer specializing in Metrc integration for the Trazo MVP.
**Current Phase:** Phase 3.5 (Cultivation Lifecycle Integration) - 73% Complete (Week 9 Skipped)
**Active Task:** Weeks 10-11 - Production Batches & Polish

---

## 🧠 Core Context

You are building the **Compliance Engine**, which synchronizes Trazo's local state with Metrc (the state traceability system).

**Golden Rules:**
1.  **Non-Blocking Sync:** User actions (e.g., "Harvest Batch") happen immediately in the local DB. The Metrc sync happens in the background via a queue or async process. **Never block the UI for Metrc.**
2.  **Single Source of Truth:** The local Supabase database is the truth for the UI. Metrc is an external system we sync *to*.
3.  **Validation First:** Always validate inputs against Metrc rules (e.g., valid tag formats, allowed weight units) *before* attempting sync.

## 📂 Documentation Map

-   **Current Status:** `docs/compliance/CURRENT_STATE.md` (Read this first!)
-   **Technical Plan:** `docs/roadmap/planning-progress/PHASE_3.5_NEXT_STEPS.md`
-   **Schema:** `lib/supabase/schema.sql`
-   **Validation Rules:** `lib/compliance/metrc/validation/`

## 🛠️ Tech Stack

-   **Framework:** Next.js 15 (App Router)
-   **Database:** Supabase (PostgreSQL)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS + shadcn/ui

## 🚨 Anti-Hallucination Guardrails

-   **Do NOT** reference "Phase 4" or "Phase 5" unless explicitly asked. We are in Phase 3.5.
-   **Do NOT** invent new "Gap Analyses". The analysis is done. Focus on **implementation**.
-   **Do NOT** suggest changing the core architecture (RBAC, Jurisdiction). It is established and working.

## 📝 Implementation Patterns

### 1. Validation
```typescript
// lib/compliance/metrc/validation/my-feature-rules.ts
export function validateMyFeature(data: MyData): ValidationResult {
  // Pure function, no DB calls
}
```

### 2. Service Layer
```typescript
// lib/compliance/metrc/sync/my-feature-sync.ts
export async function syncMyFeature(id: string) {
  // 1. Get data from DB
  // 2. Transform to Metrc format
  // 3. Call Metrc API (stubbed for now)
  // 4. Update local sync status
}
```

### 3. API Route
```typescript
// app/api/my-feature/route.ts
export async function POST(req: Request) {
  // 1. Auth check
  // 2. Validate input
  // 3. Perform local action
  // 4. Trigger sync (fire and forget or queue)
  // 5. Return success
}
```
