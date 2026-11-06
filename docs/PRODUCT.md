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

## Current prototype

The PC-first frontend includes Studio, Gallery, Projects, Characters, Models and Settings. Agent conversation, plans, progress, images, model status and usage are explicitly demo data. Reference uploads, image actions and settings show local feedback; they do not execute provider calls or save credentials. There is no authentication or business persistence yet.

The Go API currently provides health and honest readiness responses. Worker and infrastructure exist separately. Readiness is not claimed until real dependency probes are wired.

## MVP journey

1. Create a project and describe a visual outcome.
2. Review an editable creative brief and generation plan.
3. Approve generation and observe durable task progress.
4. Review images, request revisions and retain prior versions.
5. Save and export the selected asset.

Projects, conversations, plans, approvals, generation and assets will be integrated one vertical slice at a time. Demo completion does not prove any backend task succeeded.

## Non-goals

P0.7–P0.9 does not implement live Agent Runtime, image generation, billing, multi-agent collaboration or mobile design. Video, a marketplace, social feed, node editing and model training remain outside the MVP.

## Next acceptance target

After human confirmation, create and list a project in the UI using Go APIs backed by PostgreSQL. Ownership, validation and error handling must have tests before replacing demo data in that flow.
