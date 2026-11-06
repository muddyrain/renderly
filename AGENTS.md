# AI coding assistant instructions

Renderly is a learning project. The maintainer must understand and participate in implementation.

1. Work in small, reviewable milestones; never expand scope silently.
2. Before editing, explain the problem, files, approach, and trade-offs.
3. Prefer simple Go and explicit interfaces.
4. Do not introduce microservices or a large agent framework in the MVP.
5. Never claim a test/provider call succeeded unless it actually ran.
6. Keep secrets out of browser code, logs, fixtures, screenshots, and Git.
7. Add tests for business rules, task transitions, adapters, and error paths.
8. Update docs and roadmap when behavior changes.
9. After each milestone, teach: what changed, why, how to run/debug it, and one exercise.
10. Stop at agreed human review checkpoints.

Architecture boundaries:
- Hertz owns HTTP transport only; keep its imports and `RequestContext` inside `backend/internal/server`.
- Business modules (`agent`, `provider`, `task`, `asset`, `storage`, `repository`, `service`) accept standard `context.Context` and owned data values. Worker stays independent of Hertz.
- Read [ADR-002](docs/DECISIONS/0002-adopt-hertz.md) before changing HTTP lifecycle, networking, readiness, SSE, or uploads.
- `agent` owns planning, approvals, and bounded tool execution.
- `provider` owns provider-specific API details.
- `task` owns generation lifecycle and transitions.
- `asset` owns metadata; `storage` owns file bytes.
- Agent code must not execute SQL or read provider credentials directly.
- Provider calls need timeouts, bounded retries, and normalized errors.
- Long-running generation must be asynchronous and durable before production.

Frontend and workspace boundaries:
- Use root pnpm Workspace commands for JavaScript/TypeScript; keep Go Modules independent in `backend`.
- Keep page-specific components in `apps/web`; extract shared packages only for real consumers. Do not add Turborepo in the current foundation.
- Read `docs/design/UI_PACKAGE_V0.2.0_FILES.md`, `docs/DESIGN_HANDOFF.md` and `docs/MOTION_SPEC.md` before changing the v0.2.0 Studio.
- Label demo Agent replies, plans, progress, artwork, provider status and usage. Provider keys remain server-side; demo completion is not a real task result.
- Keep historical ADRs and review evidence intact. `review/` is local evidence, excluded from Git and Docker contexts.
