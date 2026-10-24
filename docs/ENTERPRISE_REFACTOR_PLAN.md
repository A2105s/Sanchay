# Sanchay Enterprise Refactor Plan

## Objective

Bring the repository to production-grade quality with strict consistency, no functional regressions, and safe removal of non-essential artifacts.

## Baseline Snapshot

- Stack: Next.js App Router + TypeScript + Tailwind + Firebase + Playwright.
- Current quality gates:
  - Type check passes.
  - Lint runs but reports a large warning backlog.
  - Format check fails with style drift across many files.
- Configuration drift discovered:
  - Duplicate ESLint config existed.
  - Legacy/parallel context docs conflict with current architecture choices.

## Hard Blockers Already Addressed

- Removed committed service credentials file: service-account.json.
- Fixed syntax error in debug helper: debug-server.js.
- Consolidated lint policy to one source by removing duplicate .eslintrc.json.

## Execution Streams

### Stream 1: Security and Secrets Hygiene

1. Ensure no credentials or local env files are tracked.
2. Validate .gitignore coverage for secrets and local artifacts.
3. Add periodic secret scan in CI if missing.

Definition of done:

- No service account or env secret files tracked.
- Secret scan passes.

### Stream 2: Code Quality Convergence

1. Run Prettier write in controlled batches (module by module).
2. Auto-fix import order and simple ESLint warnings.
3. Tackle remaining typed warnings in API routes (replace any, use import type, remove dead vars).

Definition of done:

- npm run format:check passes.
- npm run lint passes with zero warnings.

### Stream 3: Architecture Consistency

1. Standardize API response envelopes per domain.
2. Reduce duplicate in-memory stores and unify service boundaries.
3. Align route ownership and naming conventions between admin and user dashboards.

Definition of done:

- Stable response contracts documented and enforced.
- No duplicate logic paths for same domain action.

### Stream 4: UI and UX Systemization

1. Complete semantic token migration in remaining outlier pages.
2. Normalize spacing, card elevations, status treatments, and table behavior.
3. Add a visual acceptance checklist for all major dashboard surfaces.

Definition of done:

- Consistent UI tokens and interaction patterns across automobiles/spaces user and admin flows.

### Stream 5: Dead Code and File Removal

Removal rule:

- Delete only when all are true:
  - No runtime references.
  - Not required by build/test/config.
  - Not part of active documentation source.

Primary candidates for verification:

- amity-labs-showcase-main/ (currently excluded from tsconfig and ignored in git).
- legacy prompt/context markdown files that contradict actual implementation.
- one-off debug scripts not used by package scripts.

Definition of done:

- Candidate list reviewed, verified, and removed safely.

## Safe-Change Protocol

For each batch:

1. Apply scoped edits.
2. Run type-check.
3. Run lint for touched scope.
4. Run targeted Playwright tests for affected journeys.
5. Record before/after diff summary.

## Validation Matrix

- Static:
  - npm run type-check
  - npm run lint
  - npm run format:check
- Functional:
  - npm run test -- tests/e2e for automobiles and spaces core flows
- Manual:
  - admin dashboards
  - user booking flow
  - error and empty states

## Delivery Order

1. Security hygiene completion.
2. Formatting and lint convergence.
3. API typing and response normalization.
4. Dead code/file removal after proof.
5. Final regression and release checklist.
