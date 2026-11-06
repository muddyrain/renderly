# Renderly

**An open-source, agent-powered visual creation platform.**

Renderly combines an AI Agent, image generation and a visual workspace. The repository currently contains a PC-first workspace with six connected local-demo pages and a Go HTTP foundation. No live Agent, image provider or persistence is connected. The development-only design system preview remains available for component review.

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

The root path redirects to `/studio`. `/studio`, `/gallery`, `/projects`, `/characters`, `/models` and `/settings` are real routes with shared graphite/sage navigation and a persistent Demo notice. Only Studio contains the Agent / Canvas split. Studio supports a local conversation / Brief / approval / cancel / retry workflow and offline sample artwork. Gallery, Projects, Characters, Models and Settings share browser-memory records with Studio. Soft navigation preserves unsent drafts and workspace changes; refresh restores fixtures. See [the frontend demo contract](docs/FRONTEND_DEMO.md).

Development reference: [design system preview](http://localhost:3000/design-system). Run `pnpm dev` from the root; this route returns 404 in production. The B1 source and components remain intact. See [the compatibility record](docs/design/SHADCN_SOURCE.md), [visual lock](docs/design/VISUAL_DIRECTION_LOCK.md) and [Aceternity motion plan](docs/design/ACETERNITY_MOTION_PLAN.md). B0–B3.1 is merged; B4–B6 stops at the new PR review.

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

The root `pnpm-lock.yaml` is the only workspace lock. CI and the web Dockerfile install with `pnpm install --frozen-lockfile` at the repository root.

## UI and demo interactions

The six workspace routes support direct access, refresh, Next Link navigation and browser history. Navigation active state and breadcrumb come from the pathname. Gallery supports local collections, favorites, comparison and sample download; Projects and Characters support local CRUD and references. Models and Settings apply validated local configuration with real consumers. Studio approval runs only a deterministic local demonstration; no credentials, model requests, upload or save operations are connected.

The new workspace uses restrained 160ms navigation selection and page entry feedback, with live reduced-motion support. Studio Canvas / Variants consumes a React adaptation of the authorized Inspira MIT port of Aceternity Tabs; see [source and license](docs/design/ACETERNITY_SOURCE.md). Gallery now uses local layout feedback, Radix detail and a native keyboard comparison range; no extra upstream component source is copied. shadcn / Radix continue to own basic component semantics and overlays.

Studio starts with a labelled preset conversation, editable Brief, pending plan and sample image. New session clears Studio conversation, Brief, draft, result and selections while retaining workspace records, favorites and preferences; it does not implicitly reload samples. Enter inserts a newline; Ctrl/Cmd+Enter sends after composition input ends, with a 4000-character limit that preserves over-limit text. Sending prepares a plan; explicit approval locks its revision. Cancellation, failure, reset and navigation invalidate old callbacks. Retry requires review and approval again. A fixed “查看计划 · 3 步” shortcut reveals the single Plan before approval, including on low-height displays. Refresh resets to the preset; nothing is persisted.

Three [local sample photos](docs/design/DEMO_ASSETS.md) support asset / version / variant selection, image failure recovery, parameters and zoom. Sample photos and local completion are never described as real model output. The development-only scenario selector provides deterministic failure verification; it is absent from production. Run lifecycle checks from the root with `pnpm --filter @renderly/web test:studio`.

## Checks

Stop the development server before type generation or production builds; run these checks sequentially so they do not write to the same `.next` directory at once.

```bash
pnpm install --frozen-lockfile --strict-peer-dependencies
pnpm --filter @renderly/web test:studio
pnpm --filter @renderly/web test:workspace
pnpm lint
pnpm typecheck
pnpm --filter @renderly/web exec tsc --noEmit --incremental false --noUncheckedSideEffectImports true
pnpm build
cd backend
go test ./...
go vet ./...
gofmt -l .
go build ./cmd/api
go build ./cmd/worker
```

Hertz remains confined to HTTP transport. The API uses the Go standard network transporter and a 10-second shutdown budget. The independent Worker currently waits for termination signals; no queue consumer is wired. See [Architecture](docs/ARCHITECTURE.md), [ADR-002](docs/DECISIONS/0002-adopt-hertz.md), [Product](docs/PRODUCT.md) and [Roadmap](docs/ROADMAP.md).

The current milestone is P0.10 B4–B6 frontend closeout and PR review. Local Project CRUD is included; real backend integration requires separate P1 authorization. Agent Runtime, paid image generation and SSE business events are not part of this milestone. License: MIT.
