# Architecture

## Runtime and stack

Renderly uses a modular monolith with separate Go API and Worker processes. They share application packages; process separation does not create independent services or databases.

- Browser: Next.js, React and TypeScript. The UI has independent Demo and opt-in local connected project modes.
- HTTP API: Go + CloudWeGo Hertz, restricted to `backend/internal/server`.
- Persistence: PostgreSQL, generated sqlc queries and pgx/v5 for projects; other adapters remain planned.
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

Project CRUD is the first real use-case/adaptor connection. Authentication, generation, queues and storage are not running business flows.
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
- `GET /readyz`: bounded live PostgreSQL, migration version/dirty and configured workspace checks; HTTP 200 only when the P1 requirements hold, otherwise 503. Redis/storage report not_required_not_connected. [ADR-003](DECISIONS/0003-local-project-persistence.md) defines this P1 policy.
- Request IDs are generated or accepted as bounded ASCII identifiers, returned in `X-Request-ID` and carried in standard context. They are correlation metadata, not authentication.
- Recovery returns a generic JSON 500 and omits panic values. Access logs include request ID, method, route template, status and duration; raw request data is excluded.
- CORS permits the configured `WEB_ORIGIN`, GET/POST/PATCH/DELETE/OPTIONS, and Content-Type/X-Request-ID headers. Credentials are disabled. Extend the policy when real routes require it.

The API explicitly uses Hertz's Go standard network transporter. Current limits are a 4 MiB body, 10-second read timeout, 30-second write timeout and 5-second idle timeout; automatic multipart parsing is disabled. The idle timeout stays below the 10-second drain budget because standard transport waits for idle keep-alive reads to end. These are transport limits, not application execution deadlines. Use-case/provider work needs its own context deadline.

SIGINT/SIGTERM initiate a drain bounded to 10 seconds. The main process waits for the server loop to stop and reports startup or shutdown failures. A second signal can terminate immediately. The Worker retains its existing independent signal handling.

`Server.Shutdown` owns a timeout context derived from Hertz's configured exit budget, so even callers using a longer deadline or `context.Background()` can observe exhaustion. Server budget exhaustion matches `ErrShutdownTimeout` and `context.DeadlineExceeded`; an earlier caller deadline remains `context.DeadlineExceeded`. A timeout does not automatically cancel blocked application handlers. Repeated shutdown after closure preserves Hertz's state error and is not an idempotent success.

## Future transport work

[ADR-002](DECISIONS/0002-adopt-hertz.md) records the framework decision, network deployment constraints, and the verification plan for Agent Run/Task SSE and uploads. These features require separate implementation and acceptance. Current readiness covers P1 projects only and is not deployment acceptance for future task/storage work.

## Frontend workspace

The root pnpm Workspace discovers apps/* and packages/*. The sole app is @renderly/web under apps/web. Page-specific components stay there; there are no empty shared packages, Turborepo, extra services or shared Agent framework. The root lock is authoritative for local installs, CI and Docker. Go Modules remain independent under backend. Typechecking runs next typegen then tsc --noEmit; stop dev before type generation/build so .next writers are sequential.

The server workspace layout loads tokens and workspace CSS, composing WorkspaceShell around route children. Sidebar and ProjectHeader use pathname state; lib/workspace-pages.ts defines routes/labels/metadata. Root redirects to /studio. Each of the six routes composes a separate client workbench. WorkspaceProvider lives in the shared layout and owns one WorkspaceStore / DemoAgent across soft navigation. /design-system is the sole development component preview, gated with server notFound in production.

Root globals provide Tailwind/reset; scoped tokens and workspace/studio/preview styles own appearance. Dialog and Tooltip portals carry the same theme. The global CSS declaration in types/styles.d.ts is included by the existing TypeScript glob; generated next-env and strict checks are preserved. See [shadcn sources](design/SHADCN_SOURCE.md), [design handoff](DESIGN_HANDOFF.md) and [motion contract](MOTION_SPEC.md).

## Local Studio boundary

useDemoAgent subscribes to the shared DemoAgent through useSyncExternalStore and cancels a running demo when Studio unmounts. Unsent text and existing workspace values survive soft navigation. Owned values define idle / awaiting_approval / running / completed / failed / cancelled, along with Brief and asset/version/variant relations. Explicit approval freezes a cloned session/revision/run snapshot. A deterministic adapter publishes bounded timer events; generation token, active flag, session and run checks reject late callbacks. Cancel/reset/terminal events/dispose clear ownership. Failed/cancelled runs require review and explicit reapproval.

New session replaces draft, messages, Brief, errors, result and selections atomically; session-keyed conversation/canvas UI also clears local presentation state. Creative state has no provider, upload or persistence integration; connected mode separately persists only projects. The B3.1 fixed Plan shortcut opens the existing list without duplicating state. Reduced-motion renders outside the animated presence boundary so exiting content is not retained.

ImageResource is keyed by source/attempt; it owns load/error/retry and cancels old callbacks on unmount. Local fixtures resolve versions/variants by IDs and remember selections per asset. Exact files, hashes and dimensions are in [DEMO_ASSETS.md](design/DEMO_ASSETS.md). Radix Tabs provides keyboard/ARIA; the [authorized Inspira MIT adaptation](design/ACETERNITY_SOURCE.md) supplies selected-background structure using existing framer-motion.

WorkspaceStore owns local projects, assets, character sheets, example model configuration, preferences and a pending one-shot intent. Operations validate IDs and owned values. Project deletion orphans assets, removes character associations and clears active project context. Character imports copy text and image IDs, so later edits cannot rewrite an approval. Gallery version choice is per asset; continuation copies that exact selection and project while preserving unsent text.

Approval freezes project/model values, Brief/ratio/reference IDs and preset artwork selection. A session/run key is recorded before notifying workspace listeners; repeated completion or later state updates cannot append a duplicate or resurrect a removed result. New Studio sessions preserve workspace values; full refresh constructs fresh fixtures. Pure Demo uses no browser persistence/provider. P1 adds only project API synchronization; no localStorage or provider layer is introduced.

Models apply to subsequent plans; preferences affect new/reset Brief defaults, Gallery density and system-prioritized motion. Development exposes only `window.__renderlyDemoTest.loadFixture("empty" | "default")` for deterministic edge checks; production does not register it.

Node Studio and workspace suites compile actual modules with the existing TypeScript compiler into disposable temporary directories. Studio, workspace and P1 project/proxy suites plus strict CSS checks run in CI. The original Button type contract remains part of typecheck. B4–B6 was merged as the frontend foundation; the current P1 PR adds the project backend/SQL slice described below, with no deployment.

## P1 project path

The dynamic Next layout selects Demo or connected mode from server runtime configuration. A fixed same-origin Route Handler proxies only project routes to a loopback Go origin. It has bounded forwarding and safe errors, forwards statuses/body, and omits client identity/cookies. No database credential reaches browser configuration or bundles.

ProjectSync handles asynchronous pending/error/uncertain states, generation/abort ownership and all-page reloads. Only acknowledged writes reconcile WorkspaceStore projects. The same list feeds the header, Studio, Gallery and character associations. Reconciliation preserves unsent drafts and frozen runs, and cleans temporary relations only after authoritative removal. Default Demo never depends on the API.

Go server resolves the explicit local principal and parses the HTTP contract; project.Service validates Unicode text and workspace membership. repository.Projects uses generated sqlc queries through a bounded pgx pool; every query scopes membership, workspace and non-deleted rows. Writes use explicit transactions and check cancellation before commit. The API does not auto-migrate or bootstrap. Resource initialization precedes serving and pool closure follows the existing HTTP run/drain path. Worker acquires neither database nor Hertz imports.

See [API contract](PROJECT_API.md), [operation commands and pins](PROJECT_DEVELOPMENT.md) and [ADR-003](DECISIONS/0003-local-project-persistence.md). Original 000001 remains a schema draft for future tables; their existence does not implement those resources. Forward 000002 adds project soft deletion. Generated files are committed and CI checks drift alongside real PostgreSQL integration tests.
