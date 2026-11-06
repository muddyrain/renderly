# Renderly Design Handoff

## Current workspace — P1 project persistence review (2026-11-06)

Graphite Atelier is the selected direction: [visual values and reference](design/VISUAL_DIRECTION_LOCK.md). The shared shell has graphite surfaces, Sage accents, a persistent Demo notice and project context header. Navigation contains Studio, Gallery, Projects, Characters, Models and Settings. Root redirects to Studio.

Studio alone has a 352px left Creative Agent and a large right canvas. Conversation, editable Brief and three-step Plan use internal scrolling; approval/cancel and Composer remain fixed and reachable at 1280×720. A visible “查看计划 · 3 步” shortcut opens and scrolls to the same Plan. It shares expansion state and aria-controls with the Plan header; it is an optional shortcut, not a gate before approval. Keep 14px body/input text and 12px metadata.

Canvas/Variants are real Radix tabs; parameters, zoom, local image variants/versions and reference continuation are connected to shared browser-memory Demo state. Reference continuation preserves unsent text, adding a template only to an empty composer. New-message feedback stays in the fixed action area while the conversation scrolls. New session is empty; default content is labelled preset and pending approval. Nothing is generated, uploaded or saved by a provider. Gallery now contains preset/local-result collections and a Radix detail/comparison dialog. Projects and Characters have local forms and confirmed deletions; Models and Settings expose applied values with real consumers. Each page has its own component, shared form/control styles and honest empty/error states.

## Components and assets

Five shadcn primitives, scoped RGB tokens and the development-only /design-system remain consumed. The preview uses disabled navigation samples; formal navigation lives in the workspace. Production returns 404 for the preview. Root globals contain Tailwind and a document reset; workspace/studio/preview rules remain scoped.

The favicon uses the existing vector R with graphite fill and Sage foreground/border, including contrast at the icon edge on dark/light tab backgrounds. No remote logo or raster is added.

See [component provenance](design/SHADCN_SOURCE.md), [authorized Aceternity adaptation](design/ACETERNITY_SOURCE.md), [sample photos](design/DEMO_ASSETS.md) and [motion contract](MOTION_SPEC.md). Preserve their license and source records. Desktop targets are 1280×720, 1440×900 and 1920×1080. Reflow below 1280 CSS pixels, including a 320px viewport at high browser zoom, remains a known layout limitation requiring separate design scope. There is no mobile design requirement in this milestone.

## Boundaries

Provider credentials stay server-side; model status, messages, plans, artwork and results are labelled Demo. Connected mode persists projects through the local Go API; other creative state stays in memory. This UI has no real login, live generation, billing or business SSE. B0–B6 is merged. P1 adds opt-in real project CRUD and stops at its new PR review. Soft navigation keeps drafts and workspace records; refresh resets them. Project context selection is visible in the shared header.

P1 preserves layout/motion and adds pending/error behavior to the existing project forms. Confirmations retain input on failure, block duplicate writes while pending, and restore focus only after a server-confirmed close. The top notice distinguishes persisted projects from temporary creative state; all project selectors share one API source.
