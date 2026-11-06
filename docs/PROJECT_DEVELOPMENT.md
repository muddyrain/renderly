# P1 local setup, tests and recovery

## Daily commands

Keep the existing root .env. For a new checkout copy .env.example once. DATABASE_URL is a literal PostgreSQL URL; changing POSTGRES_PORT does not expand or modify the DSN. The example now spells port 5432 explicitly. The existing local 5433 override is preserved. Never log or commit real .env values.

```sh
pnpm install --frozen-lockfile --strict-peer-dependencies
pnpm dev                         # independent pure Demo, no API required
pnpm local:setup                 # explicitly start PostgreSQL, migrate up, bootstrap
pnpm dev:connected               # local PostgreSQL + loopback Go + connected Next
```

The connected runner starts only PostgreSQL, never rebuilds unrelated MinIO, and never migrates on API startup. Setup is the explicit schema/identity command. Separate processes for debugging:

```sh
pnpm db:migrate status
pnpm db:migrate up
pnpm db:bootstrap
pnpm api:local                   # loopback Go, no frontend
pnpm web:connected               # connected Next; PORT can override 3000
```

scripts/local.mjs reads root .env literally with process environment taking precedence; it does not run shell expansion or print credentials. Local commands explicitly opt in to the development identity and turn the legacy `:8080` default into `127.0.0.1:8080` while retaining the port. Other explicit non-loopback binds and production APP_ENV are rejected by Go. The launcher does not change the user's .env. Direct `go run ./cmd/api` does not read .env: export literal settings yourself or use api:local.

For local production frontend validation, stop dev before generating types/build:

```sh
pnpm build
pnpm start:connected             # production Next + development loopback Go
```

Mode/workspace/API-origin configuration is read by the Next server at runtime, not baked into NEXT_PUBLIC variables. A production Next build can use the local API; Go must still have explicit development/test environment. This is not a public deployment or production authentication setup. Docker build results are reported per stage in the PR; a cross-container connected deployment is outside this local-only identity boundary.

## Pinned tools and compatibility

| Component | Fixed version | Compatibility/source |
|---|---|---|
| pgx/v5 | v5.7.6 | [official go.mod](https://github.com/jackc/pgx/blob/v5.7.6/go.mod), Go 1.23.0 |
| golang-migrate library | v4.18.3 | [official go.mod](https://github.com/golang-migrate/migrate/blob/v4.18.3/go.mod), Go 1.23.0; embedded explicit db command |
| sqlc | v1.28.0 | [official go.mod](https://github.com/sqlc-dev/sqlc/blob/v1.28.0/go.mod), Go 1.22.9 minimum; pinned script with CGO_ENABLED=0 portable parser |

The Go directive is normalized from 1.23 to 1.23.0 for these modules, retaining the 1.23 target; no toolchain directive is introduced. Local Go is 1.26.0; the backend image compiles with Go 1.23. Transitive upgrades required by the new modules are recorded in go.mod/go.sum. No JS runtime dependencies or framework versions change.

```sh
pnpm sqlc:generate
# backend/internal/db is generated and committed; do not hand-edit it
```

scripts/sqlc.sh installs only the pinned tool into ignored .tools. CGO_ENABLED=0 avoids the current macOS C strchrnul conflict. Module verification stays enabled; if the default proxy cannot reach the checksum service, a command-scoped GOPROXY=https://goproxy.cn is an available mirror, not a global configuration or checksum bypass.

## Dedicated tests

Set RENDERLY_TEST_DATABASE_URL to a deliberately separate database whose name ends in _test. Never supply the daily DATABASE_URL as a test DSN. The integration helper creates random isolated schemas, preserves public application data, and drops only its own schemas. CI provisions PostgreSQL 16 and sets RENDERLY_REQUIRE_DB_TESTS=1, so missing DSN is a failure rather than a green skip.

```sh
# Run inside backend with the dedicated test DSN exported:
RENDERLY_REQUIRE_DB_TESTS=1 go test ./...
go vet ./...
go build ./cmd/api
go build ./cmd/worker
# Suitable local race checks:
RENDERLY_REQUIRE_DB_TESTS=1 go test -race ./internal/project ./internal/repository ./internal/database
```

The full suite includes real migration/reapply/rollback, idempotent bootstrap, independent connections, CRUD, 105-row tie-order pagination, cross-workspace SQL/use-case isolation, soft deletion, locked-query cancellation, live readiness and unversioned-schema refusal. Without a dedicated local DSN those tests explicitly SKIP; CI always executes them.

```sh
# From root, with dev stopped before type generation/build:
pnpm --filter @renderly/web test:studio
pnpm --filter @renderly/web test:workspace
pnpm --filter @renderly/web test:projects
pnpm lint
pnpm typecheck
pnpm --filter @renderly/web exec tsc --noEmit --incremental false --noUncheckedSideEffectImports true
pnpm build
```

## Failure/recovery and data protection

- /readyz=503 with /healthz=200 means a running process with an unavailable P1 dependency; inspect its safe check names, then verify PostgreSQL, migration status and bootstrap. Recovery does not require fake readiness flags.
- Apply only forward migrations to daily data. A dirty version needs an investigated forward repair. An existing unversioned schema is not automatically stamped or dropped; inspect it before taking any action.
- There is deliberately no production down/reset/force command. Rollback verification happens only inside disposable integration schemas. Do not run compose down -v or delete a daily volume.
- A failed/ambiguous save retains input and old relations. Reload the project list to check whether the operation committed, then explicitly acknowledge the result before writing again. Cancellation and repeated button presses do not retry a POST/DELETE.
- Refresh resets local creative records/characters/preferences but reloads projects from PostgreSQL. A new Studio session never deletes database projects.
