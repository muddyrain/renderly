# Renderly

**An open-source, agent-powered visual creation platform.**

Renderly combines an AI Agent, image generation and a visual workspace. The repository currently contains a PC-first demo Studio and a Go HTTP foundation. Agent replies, plans, progress, images, provider status and usage in the UI are samples; no live Agent, image provider or persistence is connected.

## Stack and boundaries

- Frontend: Next.js, React, TypeScript strict, Tailwind CSS, Framer Motion and Lucide React.
- Backend: Go + CloudWeGo Hertz, with separate API and Worker processes in a modular monolith.
- Selected persistence stack: PostgreSQL, sqlc/pgx, Redis and MinIO/S3. Business adapters remain planned.
- JavaScript/TypeScript dependencies: pnpm Workspace. Go dependencies: independent `backend/go.mod` and `go.sum`.
- Local infrastructure: Docker Compose. No Turborepo or microservices.

## Local development

Prerequisites: Node.js 22+, pnpm 10.33.0, Go 1.23+ and Docker Compose. The backend was locally verified with Go 1.26.0.

From the repository root:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Root scripts also provide `pnpm build`, `pnpm lint` and `pnpm typecheck`.

Start infrastructure without replacing an existing environment file:

```bash
test -f .env || cp .env.example .env
docker compose config --quiet
docker compose up -d --wait postgres redis minio
```

Then use separate terminals:

```bash
make api
# Optional independent scaffold:
make worker
```

`GET http://localhost:8080/healthz` returns HTTP 200 with `{"status":"ok","service":"renderly-api"}`. `/readyz` intentionally returns HTTP 503: configuration is validated, while PostgreSQL, Redis and storage probes are explicitly `not_implemented`.

Compose reads the root `.env`; the API reads its process environment rather than loading that file automatically. `API_ADDR` defaults to `:8080`; `WEB_ORIGIN` defaults to `http://localhost:3000`. PostgreSQL defaults to host port 5432; use `POSTGRES_PORT` and a matching existing literal `DATABASE_URL` when that port is occupied. Redis uses 6379, MinIO uses 9000 (S3) and 9001 (console).

MinIO is built from pinned official source by Compose. Its initial build requires downloading and compiling dependencies. If Go's default proxy is unreachable, a command-scoped alternative is `GOPROXY=https://goproxy.cn go mod download` inside `backend`, or `docker compose build --build-arg GOPROXY=https://goproxy.cn minio` from the root; checksum verification remains enabled.

Ctrl+C stops local API, Worker and frontend processes. `docker compose stop` stops infrastructure while preserving volumes.

## Workspace structure

```text
apps/web/                  PC-first frontend and page-specific components
backend/cmd/api/           HTTP process entrypoint
backend/cmd/worker/        Independent worker scaffold
backend/internal/server/  Hertz transport and lifecycle tests
backend/internal/config/  Configuration and validation
backend/migrations/        SQL migrations, not applied by this task
backend/queries/           SQL-first queries for later sqlc integration
deployments/docker/        Application and MinIO Dockerfiles
docs/                      Product, architecture, roadmap and design references
pnpm-workspace.yaml        apps/* and packages/* workspace discovery
pnpm-lock.yaml             Active workspace dependency lock
```

There is one frontend application, named `@renderly/web`. No empty shared packages have been created; `packages/*` is reserved by the workspace discovery pattern. Stable reusable modules can be extracted once a second real consumer exists. Go modules stay outside pnpm.

The original nested `apps/web/pnpm-lock.yaml` is retained as v0.2.0 source provenance. The root lock is the only active workspace lock. CI and the web Dockerfile install with `pnpm install --frozen-lockfile` at the repository root.

## UI and demo interactions

Studio, Gallery, Projects, Characters, Models and Settings are views within the desktop application. Navigation, filtering, sample variants, likes, local prompt simulations and toast feedback work without backend business APIs. The visible Demo banner applies to all views. Image operations, provider configuration and downloads show demo feedback.

Framer Motion handles view/message transitions, image crossfades, plan progress and toast animation. CSS handles waveform/status activity, hover and focus glow. Reduced-motion preferences are respected. Demo runs can complete or be cancelled; starting a new session clears the previous timer. External sample image failures render an identifiable fallback. Sample images come from Unsplash and require network access.

The UI source is Renderly UI Package v0.2.0. Its scope and pre-integration file hashes are recorded in [the source inventory](docs/design/UI_PACKAGE_V0.2.0_FILES.md); original design references and package metadata are preserved.

## Checks

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
cd backend
go test ./...
go vet ./...
gofmt -l .
go build ./cmd/api
go build ./cmd/worker
```

Hertz remains confined to HTTP transport. The API uses the Go standard network transporter and a 10-second shutdown budget. The independent Worker currently waits for termination signals; no queue consumer is wired. See [Architecture](docs/ARCHITECTURE.md), [ADR-002](docs/DECISIONS/0002-adopt-hertz.md), [Product](docs/PRODUCT.md) and [Roadmap](docs/ROADMAP.md).

The next approved milestone is Project CRUD integration between the frontend and Go API. Agent Runtime, paid image generation and SSE business events are not part of P0.7–P0.9. License: MIT.
