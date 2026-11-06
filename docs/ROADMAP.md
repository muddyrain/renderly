# Roadmap

## Foundation and ADR-002

- [x] Go API and independent Worker entrypoints
- [x] Adopt stable Hertz in the HTTP transport package
- [x] Keep module path and standard context boundaries
- [x] Request ID, Recovery, CORS and access logs
- [x] Health endpoint and truthful readiness placeholder
- [x] Configuration, middleware and bounded shutdown tests
- [x] Complete real process/signal and infrastructure connectivity verification
- [x] Maintainer Code Review for Hertz migration
- [x] P0.6-FIX: own the shutdown deadline and distinguish server budget exhaustion from earlier caller expiry
- [x] Maintainer Code Review for P0.6-FIX

The current frontend is a demo prototype, not a live generation workflow. The API is live for health checks; readiness remains HTTP 503 because PostgreSQL, Redis and storage probes are not implemented.

## P1 — real project persistence, PR review

- [x] Explicit PostgreSQL pool, bounded queries and P1 readiness
- [x] Preserve initial schema; add soft-delete migration and fixed migration/sqlc commands
- [x] Idempotent local development identity bootstrap, default-disabled and loopback-only
- [x] Workspace-scoped create/list/detail/edit/delete use cases, SQL and HTTP API
- [x] Same-origin connected frontend, one project source and guarded asynchronous mutations
- [x] PostgreSQL integration suite, frontend request/lifecycle suite and CI service/generation drift checks
- [ ] Human review/merge of the new P1 PR (no automatic merge)

## Later milestones

- [ ] Conversations, structured Agent plans and explicit user approval
- [ ] Provider adapters and durable generation/task transitions
- [ ] Independent Worker queue consumption and recovery
- [ ] Asset metadata, storage adapters and revision history
- [ ] Verify Agent Run/Task SSE and uploads as scoped in [ADR-002](DECISIONS/0002-adopt-hertz.md)
- [ ] Deployment readiness, object storage support and self-host acceptance

The project resource is implemented in this P1 slice; later business resources still require a separate milestone.

## Frontend foundation — P0.10 B0–B6 (merged)

- [x] B0/B1: compatible shadcn controls, Graphite/Sage tokens and development preview
- [x] B2: six routes, shared shell, CSS side-effect typing and navigation feedback
- [x] B3/B3.1: guarded local Studio, offline photos, authorized Inspira MIT Tabs, legacy cleanup and unified favicon
- [x] PR #1 merged at reviewed HEAD `81b73a540b655fc488f9fb399dc4148f656ea6ed`; merge `1ea0920bcc44b426ca775a6035daeea682ca6a37`
- [x] B4: Gallery grid, combined filters/favorites, detail, version/variant selection, keyboard comparison, sample download and Studio continuation
- [x] B4: local projects/characters CRUD, references and association cleanup
- [x] B5: model configuration and workspace preferences with consumers
- [x] B6: single in-memory workspace, immutable approved snapshots, once-only Gallery completion, route cancellation and one-shot reference intents
- [x] Workspace lifecycle tests and strict CSS checks wired into CI; desktop/browser evidence retained locally
- [x] B4–B6 PR #2 reviewed and merged at exact HEAD c2719bdc4dac31a397029ccc77c511cbea2ef25a (merge f8a2c9b2f4dd78617684a40a9a1440f0051954d7)
- [ ] Next: real authentication, providers, durable tasks and other resource persistence — separately authorize

Frontend completion is an integrated local demo, not completion of the MVP backend. Current behavior and reproducible empty fixtures: [FRONTEND_DEMO.md](FRONTEND_DEMO.md). Evidence remains excluded from Git under review/P0.10-B4-B6-Frontend-Closeout-2026-11-06/. System IME, editor TS service, Safari/Firefox and real screen readers require actual separate runs; Chromium simulation does not establish those results.
