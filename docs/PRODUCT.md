# Product Definition

## Vision

An open-source, agent-powered visual creation platform. Renderly turns natural-language creative intent into a user-reviewed plan, generated visual assets and an organized project history.

The product combines AI Agent + Image Generation + Visual Workspace. The primary experience is a creative Studio, with persistent projects and reusable visual references planned around it.

## Product pillars

- Agent-led, human-directed: review plans and approve billable work.
- Provider-neutral generation through explicit adapters.
- Inspectable history: prompts, models, task states, assets and versions.
- Visual continuity: references and constraints across revisions.
- Self-hostable and learnable as a modular Go monolith.

## Current product slice

The PC-first frontend connects Studio, Gallery, Projects, Characters, Models and Settings through one browser-memory workspace. Pure Demo keeps local projects and character sheets. Opt-in connected mode persists project CRUD through Go/sqlc/pgx/PostgreSQL; all pages share the same API project list. Approved Studio demos add one preset-photo record to Gallery, with frozen project, Brief, model configuration and artwork selection. Gallery supports combined filters, favorites, version/variant comparison, local sample download and one-shot continuation into Studio. Models and Settings have real local consumers.

All conversations, plans, progress, model capabilities and results are explicitly local demos. Soft navigation retains workspace data and unsent text; refreshing restores creative fixtures and reloads real projects in connected mode. Local development identity is explicit and loopback-only; real login, upload, live provider, billing and other business persistence are absent. A downloaded sample is the original local JPEG, never a generated result. See [frontend contract](FRONTEND_DEMO.md).
The Go API provides project CRUD, process health and bounded P1 readiness for database/version/workspace membership. Worker stays independent; Redis/storage are non-required and unconnected for this slice.

## MVP journey

1. Create a project and describe a visual outcome.
2. Review an editable creative brief and generation plan.
3. Approve generation and observe durable task progress.
4. Review images, request revisions and retain prior versions.
5. Save and export the selected asset.

Projects, conversations, plans, approvals, generation and assets will be integrated one vertical slice at a time. Demo completion does not prove any backend task succeeded.

## Non-goals

P0.7–P0.9 does not implement live Agent Runtime, image generation, billing, multi-agent collaboration or mobile design. Video, a marketplace, social feed, node editing and model training remain outside the MVP.

## P1 review checkpoint

Complete project create/list/detail/edit/soft delete and local identity/readiness are implemented for one reviewable PR. Cross-workspace ownership, cancellation, actual PostgreSQL persistence and frontend failure/late-response handling have tests. Real authentication, durable generation and asset/character persistence require a separate next milestone.
