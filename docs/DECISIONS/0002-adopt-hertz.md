# ADR-002: Adopt CloudWeGo Hertz

- Date: 2026-11-05
- Decision: Accepted by the maintainer
- Implementation: Hertz migration reviewed; P0.6-FIX awaiting human Code Review

## Context

The bootstrap API used Chi for one health route. Formal business APIs have not started, so this is the smallest point at which to adopt the maintainer's selected CloudWeGo HTTP stack. The decision does not change the modular monolith or combine the API and Worker processes.

Hertz provides routing, recovery and built-in SSE support for the planned transport work. This migration makes no performance claim; no framework benchmark has been run. Hertz adds more transitive dependencies than the initial router, which makes a strict transport boundary important.

## Decision and boundaries

Use the official `github.com/cloudwego/hertz` module, pinned to stable `v0.10.6`. Keep the existing Renderly module path and Go 1.23 directive; the migration is validated with local Go 1.26.0. Use `github.com/hertz-contrib/cors v0.1.0` for the current CORS requirement. No SSE extension, database driver or storage SDK is introduced for future work.

`internal/server` owns initialization, route registration, middleware and HTTP serialization. `cmd/api` loads configuration and coordinates serving, OS signals and graceful shutdown. Request ID and access logging use Hertz's handler API; Recovery is built into Hertz and CORS uses the documented contribution module.

Application modules accept standard `context.Context` and owned DTOs. `agent`, `provider`, `task`, `asset`, `storage`, `repository` and `service` do not import Hertz or retain its pooled buffers. The Worker does not serve HTTP and therefore has no Hertz dependency in its import graph. HTTP event formatting stays outside shared domain/task code.

## Probes and lifecycle

Preserve the health response. Add readiness with explicit per-dependency results: configuration passes only after startup validation; PostgreSQL, Redis and storage are currently `not_implemented`. The endpoint returns HTTP 503 until required adapters and probes exist. Manual connectivity checks are separate evidence, not API readiness.

Main handles SIGINT/SIGTERM, restores default handling for a second signal, and requests shutdown with a 10-second deadline. The Worker retains its independent signal lifecycle.

P0.6-FIX: Hertz v0.10.6 derives a context with `ExitWaitTimeout` and can normalize the matching transport timeout to nil. `Server.Shutdown` therefore creates its own context first, using the same public `GetOptions().ExitWaitTimeout` budget and `context.WithTimeoutCause`. The earlier caller deadline still wins. Server budget exhaustion matches both `ErrShutdownTimeout` and `context.DeadlineExceeded`; earlier caller expiry matches `context.DeadlineExceeded` without the server timeout marker. No error-string matching or extra shutdown goroutine is used. Main's 10-second policy is unchanged.

An error reports incomplete draining, not automatic cancellation of a blocked business handler. Tests keep handlers blocked past the real 10-second budget with a longer caller deadline and with `context.Background()`, then release them explicitly. Existing short-deadline and normal-drain tests remain. Hertz rejects a sequential Shutdown after the engine closes with its existing state error; the wrapper preserves that error rather than making repeated shutdown idempotent. A prior review bundle remains a historical pre-fix snapshot and does not describe the P0.6-FIX source.

## Network and deployment

Select `standard.NewTransporter` explicitly. Hertz defaults to Netpoll on supported Linux/Darwin amd64/arm64 platforms; Windows and TLS use the standard network library. Our explicit selection means deployments do not depend on an implicit platform switch. A future Netpoll switch needs benchmarks and shutdown/streaming tests on the actual OS, architecture, Go version and container target. [Official network guidance](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/network-lib/)

Keep deployment termination grace longer than the application's 10-second drain. Standard transport waits for idle keep-alive reads to finish: a real-connection test reproduced a deadline failure with a 60-second idle timeout. Set idle timeout to 5 seconds so idle clients fit the drain budget; this trades some idle connection reuse for predictable shutdown. Current read/write timeouts must be revisited for long streams. Verify reverse-proxy buffering, idle timeouts, TLS termination and client disconnect behavior before shipping SSE. This migration does not configure proxies or add service discovery.

## SSE follow-up

Use Hertz's built-in `pkg/protocol/sse`: `sse.NewWriter(c)`, `WriteEvent(id, type, data)`, `WriteKeepAlive()` and `GetLastEventID(&c.Request)`. Keep writer use within the handler; a background goroutine must not retain it after handler return. Business subscriptions use standard context and typed event values. Agent Run and Generation Task events remain separate event types. [Official SSE API](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/sse/)

Before implementation acceptance, verify durable event IDs/replay, ownership before subscription, bounded buffering, slow clients, write errors, heartbeat timing, cancellation on disconnect and shutdown. Check Hertz's `WithSenseClientDisconnection` on the chosen transporter rather than assuming the request context cancels automatically. A shutdown cancellation path must unblock stream handlers. No SSE route or live event bus is implemented now.

## Upload follow-up

For small API uploads, keep explicit size limits and validate MIME type and decoded image dimensions. For proxied large bodies, evaluate `WithStreamBody(true)` with `RequestBodyStream()` and bounded copying. Go standard networking is preferred because Netpoll streaming can retain data in transport buffers. Measure peak memory, cancellation and temporary-file cleanup before adoption. [Official streaming guidance](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/engine/)

Prefer short-lived presigned MinIO/S3 uploads for large files: authorize project ownership, allocate a unique storage key, upload directly, then verify object size/type/checksum before recording an Asset. This avoids routing bytes through API memory. Configure bucket CORS separately and keep credentials and signed URLs out of logs. Verify S3-compatible behavior against MinIO; it has not been tested here. [Presigned upload behavior](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

Evaluate multipart upload only when object sizes warrant it; include retry/resume, completion verification and abandoned-part cleanup. Presigned PUT does not itself enforce all application content constraints. No upload endpoint, SDK or multipart orchestration is added in this migration. [Multipart lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

## Consequences and review

Hertz stays replaceable at the HTTP boundary; business code and the Worker remain framework-independent. This accepts framework-specific HTTP testing and dependencies in return for the selected transport toolkit. Review the deliberate readiness 503 and network choice before starting business APIs.

Changes to Project CRUD, Agent Runtime, image generation and database business behavior remain outside ADR-002 implementation.
