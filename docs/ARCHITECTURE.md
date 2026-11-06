# Architecture

## Runtime and stack

Renderly uses a modular monolith with separate Go API and Worker processes. They share application packages; process separation does not create independent services or databases.

- Browser: Next.js, React and TypeScript. The current UI is a demo prototype.
- HTTP API: Go + CloudWeGo Hertz, restricted to `backend/internal/server`.
- Persistence: PostgreSQL, SQL-first queries with sqlc and pgx adapters planned.
- Async coordination: Redis; the Worker currently only handles lifecycle signals.
- Binary storage: MinIO/S3 behind a storage adapter, not connected yet.
- Local infrastructure: Docker Compose.

```text
Browser -> Hertz HTTP transport -> application use cases -> adapters
                                      ^                    |
Worker -------------------------------+                    +-> PostgreSQL
                                                           +-> Redis
                                                           +-> MinIO/S3
```

Only HTTP probes and process lifecycle are implemented in this backend foundation. The use-case/adaptor connections in the diagram are planned boundaries, not running business flows.

## Ownership

| Package/module | Responsibility |
|---|---|
| `cmd/api` | Load configuration, start API, handle signals and bounded shutdown |
| `internal/config` | Process environment and transport configuration validation |
| `internal/server` | Hertz initialization, routes, middleware and HTTP serialization |
| `cmd/worker` | Independent worker lifecycle; no Hertz imports |
| `agent` | Planning, approvals and bounded orchestration |
| `provider` | Provider-specific protocols, timeouts, retries and normalized errors |
| `task` | Durable generation state and transitions |
| `asset` / `storage` | Metadata / binary objects |
| `repository` / `service` | Persistence adapters / application use cases |

Handlers translate HTTP input into owned Go values and call application code with standard `context.Context`. Hertz `RequestContext`, request buffers and SSE writers stay in the HTTP layer and must not escape a handler's lifetime. Agent code does not access SQL or provider credentials. Provider and generation execution are not part of this migration.

## HTTP behavior

- `GET /healthz`: HTTP 200, `{"status":"ok","service":"renderly-api"}`; liveness only.
- `GET /readyz`: HTTP 503, `status=not_ready`; `config=ok`, with `postgres`, `redis` and `storage` set to `not_implemented`. Configuration failure prevents startup. Dependency probing is not implemented, even when local containers are healthy.
- Request IDs are generated or accepted as bounded ASCII identifiers, returned in `X-Request-ID` and carried in standard context. They are correlation metadata, not authentication.
- Recovery returns a generic JSON 500 and omits panic values. Access logs include request ID, method, route template, status and duration; raw request data is excluded.
- CORS permits the configured `WEB_ORIGIN`, GET/OPTIONS, and Content-Type/X-Request-ID headers. Credentials are disabled. Extend the policy when real routes require it.

The API explicitly uses Hertz's Go standard network transporter. Current limits are a 4 MiB body, 10-second read timeout, 30-second write timeout and 5-second idle timeout; automatic multipart parsing is disabled. The idle timeout stays below the 10-second drain budget because standard transport waits for idle keep-alive reads to end. These are transport limits, not application execution deadlines. Use-case/provider work needs its own context deadline.

SIGINT/SIGTERM initiate a drain bounded to 10 seconds. The main process waits for the server loop to stop and reports startup or shutdown failures. A second signal can terminate immediately. The Worker retains its existing independent signal handling.

`Server.Shutdown` owns a timeout context derived from Hertz's configured exit budget, so even callers using a longer deadline or `context.Background()` can observe exhaustion. Server budget exhaustion matches `ErrShutdownTimeout` and `context.DeadlineExceeded`; an earlier caller deadline remains `context.DeadlineExceeded`. A timeout does not automatically cancel blocked application handlers. Repeated shutdown after closure preserves Hertz's state error and is not an idempotent success.

## Future transport work

[ADR-002](DECISIONS/0002-adopt-hertz.md) records the framework decision, network deployment constraints, and the verification plan for Agent Run/Task SSE and uploads. These features require separate implementation and acceptance. The current `/readyz` placeholder must be replaced with bounded adapter probes before using it for deployment gating.

## Frontend workspace

The root pnpm Workspace discovers apps/* and packages/*. The sole app is @renderly/web under apps/web. Page-specific components stay there; there are no empty shared packages, Turborepo, extra services or shared Agent framework. The root lock is authoritative for local installs, CI and Docker. Go Modules remain independent under backend. Typechecking runs next typegen then tsc --noEmit; stop dev before type generation/build so .next writers are sequential.

The server workspace layout loads tokens and workspace CSS, composing WorkspaceShell around route children. Sidebar and ProjectHeader use pathname state; lib/workspace-pages.ts defines routes/labels/metadata. Root redirects to /studio. Studio contains one page-local client workbench; the other five formal routes are server-rendered Demo skeletons. /design-system is the sole development component preview, gated with server notFound in production.

Root globals provide Tailwind/reset; scoped tokens and workspace/studio/preview styles own appearance. Dialog and Tooltip portals carry the same theme. The global CSS declaration in types/styles.d.ts is included by the existing TypeScript glob; generated next-env and strict checks are preserved. See [shadcn sources](design/SHADCN_SOURCE.md), [design handoff](DESIGN_HANDOFF.md) and [motion contract](MOTION_SPEC.md).

## Local Studio boundary

useDemoAgent owns one DemoAgent per mount through useSyncExternalStore. Owned values define idle / awaiting_approval / running / completed / failed / cancelled, along with Brief and asset/version/variant relations. Explicit approval freezes a cloned session/revision/run snapshot. A deterministic adapter publishes bounded timer events; generation token, active flag, session and run checks reject late callbacks. Cancel/reset/terminal events/dispose clear ownership. Failed/cancelled runs require review and explicit reapproval.

New session replaces draft, messages, Brief, errors, result and selections atomically; session-keyed conversation/canvas UI also clears local presentation state. There is no API, provider, upload or persistence integration. The B3.1 fixed Plan shortcut opens the existing list without duplicating state. Reduced-motion renders outside the animated presence boundary so exiting content is not retained.

ImageResource is keyed by source/attempt; it owns load/error/retry and cancels old callbacks on unmount. Local fixtures resolve versions/variants by IDs and remember selections per asset. Exact files, hashes and dimensions are in [DEMO_ASSETS.md](design/DEMO_ASSETS.md). Radix Tabs provides keyboard/ARIA; the [authorized Inspira MIT adaptation](design/ACETERNITY_SOURCE.md) supplies selected-background structure using existing framer-motion.

Node lifecycle tests use the existing TypeScript compiler and a disposable temporary directory. B3.1 preserves B1/B2/B3 functionality and stops at Code Review; backend/SQL/deployment/CI are outside this cleanup.
