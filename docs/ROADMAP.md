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

## P0.7–P0.9 — Workspace and Studio integration

- [x] Confirm the existing v0.2.0 UI source and capture its file inventory
- [x] Establish root pnpm Workspace with independent Go Modules
- [x] Keep one real web package; defer empty shared packages and Turborepo
- [x] Integrate Studio, Gallery, Projects, Characters, Models and Settings
- [x] Label demo behavior and cover completion/cancellation/session-reset states
- [x] Align root scripts, Makefile, GitHub Actions and frontend Dockerfile
- [x] Frontend build, lint, strict typecheck and frozen-lockfile installation
- [x] Go tests/vet/builds and Compose configuration check
- [x] Complete final browser, source-preservation and Git publication checks
- [ ] Human confirmation before P1

P0.6 backend source, module versions and historical decisions are retained. No live Agent Runtime, paid image API, Project CRUD or other P1 business implementation is included. Git publication uses separate reviewed backend and Workspace/UI commits.
