# P1 Project API contract

P1 persists only projects in PostgreSQL 16. Gallery results, characters, references, model configuration, preferences and unsent drafts remain browser-memory demos. There is no real login, provider, generation, upload or asset persistence.

## Local identity and ownership

The Go API accepts project requests only with `RENDERLY_LOCAL_IDENTITY=true`, explicit `APP_ENV=development` or `test`, and a numeric loopback `API_ADDR` (127.0.0.1 or ::1). Production, wildcard and non-loopback configurations fail validation. Without opt-in the API returns 401 for project routes. This is a local development boundary, not production authentication.

The server takes its principal from `DEV_USER_ID`; browser identity headers, cookies and body ownership fields cannot change it. The explicit bootstrap command creates one stable developer, workspace and membership, with no Demo projects. Defaults are user `11111111-1111-4111-8111-111111111111` and workspace `22222222-2222-4222-8222-222222222222`; these IDs are public identifiers, not credentials. Use cases authorize membership and every project SQL query repeats workspace/user and active-row constraints. Cross-workspace, unknown and soft-deleted resources are 404. Real authentication can later replace the HTTP principal resolver.

## Routes

Base: `/api/v1/workspaces/:workspaceID/projects`. IDs are UUIDs.

| Method | Path | Result |
|---|---|---|
| POST | base | 201 with the committed project |
| GET | base | 200 `{items,total,limit,offset}` |
| GET | base/:projectID | 200 project or 404 |
| PATCH | base/:projectID | 200 with the committed project |
| DELETE | base/:projectID | 204, soft delete; repeated delete 404 |

Project JSON: `id`, `workspace_id`, `name`, `description`, `created_by`, `created_at`, `updated_at`. Times are UTC RFC3339. Ownership and timestamps are read-only. DELETE retains the database row through `deleted_at`; physical purge and a recycle-bin UI are not implemented.

POST requires string `name`; string `description` defaults to empty. PATCH allows either or both of those fields, requires at least one, preserves omitted values, and rejects null. Both endpoints reject unknown/read-only fields, malformed or trailing JSON and invalid UTF-8. Project bodies are capped at 16 KiB; the existing transport-wide 4 MiB limit remains. Request Content-Type must be application/json.

Text is trimmed with Unicode White_Space (Go strings.TrimSpace and the matching frontend Unicode property), preserving internal newlines. Names contain 1–120 Unicode code points, descriptions at most 1000; NUL is rejected. A single 😀 counts as one; combining marks/variation selectors count separately. No UTF-16 maxLength silently truncates emoji. Examples: 120 × 😀 is valid, 121 is rejected; 1000 Chinese description characters are valid; whitespace-only names are rejected.

List defaults to limit=50, offset=0. Limit is 1–100, offset is a nonnegative signed 32-bit integer. Invalid parameters return 400. Ordering is updated_at DESC, id DESC. The frontend loads all pages (100 per request), detects inconsistent totals/duplicate results and asks for reload rather than publishing a partial list.

Errors use `{code,message,request_id}` and X-Request-ID. Validation=400/invalid_request, missing=404/not_found, unavailable dependency/cancelled query=503/dependency_unavailable, unexpected internal errors=500/internal_error. No SQL, raw database errors, credentials or stacks are returned/logged. Correlation IDs are not identity. CORS permits only configured WEB_ORIGIN, GET/POST/PATCH/DELETE/OPTIONS, Content-Type/X-Request-ID; no credential grant.

## Timeouts and uncertain writes

Pool connection establishment and repository operations are bounded to 3 seconds; project HTTP use cases to 4 seconds, readiness to 1 second, local Next upstream forwarding to 6 seconds. Pool resources initialize before serving and close after the HTTP lifecycle finishes. Writes use a transaction and check cancellation before commit. A lost commit response can still be ambiguous: neither client nor proxy blindly retries writes. The UI retains input/relations, blocks duplicate operations, reloads for confirmation and requires explicit acknowledgement after an uncertain result before another write.

The Hertz standard transporter and 10-second shutdown contract are unchanged. Its netpoll-only client-disconnection option is not enabled; do not infer immediate cancellation of a standard-transport handler from browser disconnection. Owned context deadlines still bound database work and cancellation tests exercise the repository.

## Same-origin frontend proxy

`RENDERLY_PROJECTS_MODE=api`, `RENDERLY_WORKSPACE_ID` and `RENDERLY_API_ORIGIN` are server runtime settings. The dynamic workspace layout passes only the public mode/workspace ID to the browser. There are no new NEXT_PUBLIC variables. DATABASE_URL, developer identity configuration and credentials are not passed to browser code or copied from root .env into Next's environment by the launcher.

Only the fixed collection/detail routes are proxied to a validated loopback origin. Requests cannot choose an upstream URL, workspace, identity headers or cookies. Write Origin must match the incoming loopback Host, accounting for Next's internal Request.url hostname. HTTP status/body and correlation metadata survive forwarding; failures become safe 503s. Responses and fetches use no-store. Runtime selection means one production Next build can run Demo or local connected mode; Next NODE_ENV=production does not permit Go APP_ENV=production with local identity.

ProjectSync owns pending/error states, AbortController generations and authoritative updates. Starting a mutation invalidates an older list; stale/unmounted responses cannot overwrite a different lifecycle. Shared project lists refresh on route/focus and after acknowledged mutation; no polling or fixtures fallback is used. Reconciliation orphans temporary assets, removes character links and cancels an active project when authoritative data removes it, while preserving drafts and approved snapshots.
