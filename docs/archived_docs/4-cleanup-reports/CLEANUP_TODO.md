# Repository Cleanup TODO

This file lists a prioritized plan for safely reducing bloat and duplicate/unused content while preserving application behavior and UI.

Priority 1 — Safe, low-risk (non-code or docs-only)
- Move or remove redundant documentation and backups (done: see `CLEANUP_REPORT.md`).
- Consolidate documentation into `/docs/` and keep canonical `README.md`, `CURRENT.md`, and `NextSteps.md`.
- Move old prototypes to an `/archive/Prototypes/` folder (low risk; non-production).
- Move mock/seed scripts to `/lib/mock/` or `/scripts/mock/` for clarity.

Priority 2 — Safe code re-org and small refactors
- Run an import/usage analysis to find components under `/components/` that are never imported by app pages; migrate truly unused components to `/archive/components/` or delete.
- Consolidate duplicate utility functions in `/lib/` into a single `lib/utils.ts` (ensure types/tests updated).
- Consolidate validation schemas into `/lib/validations/`.

Priority 3 — Moderate risk (requires tests)
- Remove or merge duplicate components discovered across `Prototypes/` and `components/ui/`. Add tests before removal.
- Archive prototype apps once their components have been migrated.

Priority 4 — Higher-risk refactors (requires QA)
- Remove previously-merged legacy code paths or adapters (search for TODOs like `// DEPRECATED`, `// TODO: remove`) and run full test + E2E suite.
- Consolidate and generate Supabase types from schema; replace hand-written types if safe.

QA & Validation steps (for each change)
1. Create a feature branch for each grouped cleanup task.
2. Run `npm run -s typecheck && npm run -s test` locally.
3. Run E2E (Playwright) where UI is touched.
4. Manual exploratory testing of key flows: signup, dashboard navigation, inventory CRUD, monitoring pages.
5. Open PR and request at least one reviewer with knowledge of RBAC/Jurisdiction logic.

Notes
- I did not remove or modify any runtime code in pass 1. The above TODO items require deeper analysis, one-at-a-time changes, and test validation.

Report created: 2025-11-03
