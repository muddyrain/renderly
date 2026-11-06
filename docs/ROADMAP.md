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

## Next vertical slice — after review

- [ ] Wire configuration for required dependencies and add bounded readiness probes
- [ ] PostgreSQL/pgx connection and first migration
- [ ] Generate typed SQL access with sqlc
- [ ] Project create/list use cases, API and frontend integration
- [ ] Unit and integration tests for ownership, validation and persistence failures

## Later milestones

- [ ] Conversations, structured Agent plans and explicit user approval
- [ ] Provider adapters and durable generation/task transitions
- [ ] Independent Worker queue consumption and recovery
- [ ] Asset metadata, storage adapters and revision history
- [ ] Verify Agent Run/Task SSE and uploads as scoped in [ADR-002](DECISIONS/0002-adopt-hertz.md)
- [ ] Deployment readiness, object storage support and self-host acceptance

Business implementation waits for the maintainer's confirmation at the current Code Review checkpoint.

## Current frontend — P0.10 B3.1 Code Review

- [x] B0/B1: Graphite/Sage tokens, five compatible shadcn primitives and development component preview
- [x] B2: six real routes, shared workspace, CSS side-effect typing and live navigation feedback; maintainer accepted
- [x] B3: local Studio conversation, Brief/revision approval, cancellation/retry/isolation, offline artwork and MIT-authorized motion adaptation; independent engineering review passed
- [x] B3.1: remove unused implementation/package provenance and redundant lock; keep current design system, photos and license records
- [x] B3.1: unify vector favicon, isolate Plan reduced-motion boundary and add visible low-height Plan shortcut
- [ ] Maintainer B3.1 Code Review and visual acceptance
- [ ] B4 Gallery and further frontend features: separately authorize
- [ ] P1 providers, durable backend tasks and persistence: separately authorize

Local evidence is in review/P0.10-B3.1-Cleanup-2026-11-06/. B3 start-relative and HEAD-relative patches include deletions and binary differences. Earlier review ZIPs remain local evidence; current docs and runtime sources describe only the maintained workspace. No Git publication is part of this checkpoint.

System IME, editor TypeScript service, other browsers and real screen-reader verification are not implied by Chromium or CLI checks. Real generation, saving, business task events and provider access remain unconnected.
