# Renderly Design Handoff

## Current workspace — P0.10 B3.1 Code Review (2026-11-06)

Graphite Atelier is the selected direction: [visual values and reference](design/VISUAL_DIRECTION_LOCK.md). The shared shell has graphite surfaces, Sage accents, a persistent Demo notice and project context header. Navigation contains Studio, Gallery, Projects, Characters, Models and Settings. Root redirects to Studio.

Studio alone has a 352px left Creative Agent and a large right canvas. Conversation, editable Brief and three-step Plan use internal scrolling; approval/cancel and Composer remain fixed and reachable at 1280×720. A visible “查看计划 · 3 步” shortcut opens and scrolls to the same Plan. It shares expansion state and aria-controls with the Plan header; it is an optional shortcut, not a gate before approval. Keep 14px body/input text and 12px metadata.

Canvas/Variants are real Radix tabs; parameters, zoom, local image variants/versions and reference continuation are connected to page-local Demo state. Reference continuation preserves unsent text, adding a template only to an empty composer. New-message feedback stays in the fixed action area while the conversation scrolls. New session is empty; default content is labelled preset and pending approval. Nothing is generated, uploaded or saved by a provider. Other five pages remain B2 skeletons.

## Components and assets

Five shadcn primitives, scoped RGB tokens and the development-only /design-system remain consumed. The preview uses disabled navigation samples; formal navigation lives in the workspace. Production returns 404 for the preview. Root globals contain Tailwind and a document reset; workspace/studio/preview rules remain scoped.

The favicon uses the existing vector R with graphite fill and Sage foreground/border, including contrast at the icon edge on dark/light tab backgrounds. No remote logo or raster is added.

See [component provenance](design/SHADCN_SOURCE.md), [authorized Aceternity adaptation](design/ACETERNITY_SOURCE.md), [sample photos](design/DEMO_ASSETS.md) and [motion contract](MOTION_SPEC.md). Preserve their license and source records. Desktop targets are 1280×720, 1440×900 and 1920×1080. Reflow below 1280 CSS pixels, including a 320px viewport at high browser zoom, remains a known layout limitation requiring separate design scope. There is no mobile design requirement in this milestone.

## Boundaries

Provider credentials stay server-side; model status, messages, plans, artwork and results are labelled Demo. This UI has no authentication, live generation, persistent project data, billing or business SSE. B3.1 stops at Code Review; B4 and P1 require separate authorization.
