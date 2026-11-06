# ADR-003: Local project persistence and P1 readiness

- Date: 2026-11-06
- Status: Implemented for P1 PR review; no automatic merge/deployment

P1 completes one project resource (create/list/detail/edit/soft delete), using PostgreSQL, SQL-first sqlc queries and pgx. The modular Go API and Worker remain separate. Hertz and RequestContext stay in internal/server; project use cases use standard context and owned values. Repository queries enforce workspace membership, workspace ID and non-deleted rows. No large authentication or orchestration framework is introduced.

The explicitly enabled loopback development identity is the only identity resolver in this slice. It is disabled by default and rejected in production/non-loopback environments. Bootstrap is an independent idempotent command; API startup neither migrates nor seeds. Future real authentication replaces this resolver without removing ownership checks.

P1 requires PostgreSQL connectivity, migration version 2 with dirty=false, and the configured development workspace membership. /readyz checks those facts live within one second and returns 503 on missing/failure, returning to 200 after recovery. Redis and object storage report not_required_not_connected. This is readiness for project CRUD only, not a claim that future task/queue/storage systems are ready. /healthz remains process liveness. This narrows the P0 placeholder policy explicitly without rewriting historical ADR-002.

The existing initial schema is retained byte-for-byte. Forward migration 000002 adds deleted_at and an active ordering index. Project deletion is soft so future related conversations/assets are not cascaded away. Physical purge remains unimplemented. An existing unversioned schema is refused rather than automatically baselined. Rollback is tested only in disposable schemas in an explicit *_test database; daily data uses forward repairs.

The default frontend remains an independent Demo. Connected mode uses one API project list across all six routes while all other state stays temporary. No local data is uploaded and network failure never substitutes Demo projects. Next's fixed same-origin proxy keeps configuration server-side. Mutation generation checks and explicit uncertain-write handling are chosen over optimistic local success or network retries.

Dependency versions and reproducible operations are in [PROJECT_DEVELOPMENT.md](../PROJECT_DEVELOPMENT.md); HTTP/ownership/error contracts are in [PROJECT_API.md](../PROJECT_API.md). Standard transport, shutdown budget and independent Worker remain governed by ADR-002.
