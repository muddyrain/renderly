# Learning Path

## Engineering entrypoints

- Start frontend commands at the repository root: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`.
- Use `backend` for Go Modules commands. API and Worker are independent executables, sharing application packages only when required.
- Read ADR-002 before changing HTTP lifecycle, readiness, networking, SSE or uploads.
- Read the UI source inventory, DESIGN_HANDOFF and MOTION_SPEC before changing the Studio.

## What the current milestone establishes

A root pnpm Workspace owns JavaScript dependencies and its lockfile. Page-specific UI remains in `apps/web`; there is no shared-package consumer yet. Hertz and the reviewed shutdown fix remain independent of frontend dependency management.

The Studio demonstrates local interaction and motion, not a working generation service. API health, API readiness, demo plan state and durable generation task state are different facts.

## Verification exercise

Start the Studio, submit one local demo, cancel it, then start a new session. Inspect Network to confirm no provider or backend business request was sent. Compare the demo labels with `/healthz` and the explicit unavailable dependency results in `/readyz`.

## After the next human checkpoint

1. Wire required dependency configuration and bounded readiness probes.
2. Connect PostgreSQL through pgx and apply the first migration deliberately.
3. Use sqlc for typed project queries.
4. Implement project creation/listing and replace the corresponding demo UI data.
5. Add integration tests for ownership, validation and persistence failures.

Conversations, agent plans, approval, provider adapters, durable tasks, Worker execution and asset storage follow as separate reviewed milestones. P0.7–P0.9 does not start these steps.
