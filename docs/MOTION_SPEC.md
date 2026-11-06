# Renderly Motion Specification

## Current Studio and workspace — 2026-11-06

Motion makes navigation, approval state and artwork selection readable in the graphite workspace. The existing framer-motion runtime is retained with Tailwind 3; shadcn/Radix own controls, focus, keyboard semantics and overlays. Source and MIT adaptation details for the actually consumed Canvas Tabs are in [ACETERNITY_SOURCE.md](design/ACETERNITY_SOURCE.md). Gallery motion remains a [B4 plan](design/ACETERNITY_MOTION_PLAN.md).

| Element | Current behavior | Timing |
|---|---|---|
| Workspace navigation | Shared selection background | 160ms easeOut |
| Page entry | Opacity only | 160ms |
| Buttons | Color feedback | 160ms |
| Dialog/Tooltip | Opacity only | 140ms |
| Studio messages | Opacity and 4px offset | 160ms |
| Studio Plan | Height/opacity expansion and collapse | 160ms |
| Canvas Tabs | Shared selected background | 160ms easeOut |
| Loaded artwork | Opacity crossfade, original color/proportion | 200ms |

## Live reduced-motion contract

The shared media hook uses useSyncExternalStore with a static server snapshot. Same-page preference changes replace animated navigation/Tabs selections with static elements. CSS removes scoped control/overlay/page transitions; message/image transitions become immediate. State and step labels remain sufficient without motion.

For Plan, the reduce branch is outside AnimatePresence. Switching preference unmounts the whole animated presence subtree, so an old exit is not retained next to the static list. Expanded content has exactly one studio-plan-details id. Returning to normal mounts presence with initial=false, preserving a stable expanded layout. Ordinary normal-mode opening/closing retains the lightweight transition. The Plan header and fixed shortcut stay outside that subtree, with one shared expanded state; preference changes preserve their focus.

The fixed Plan shortcut scrolls only after explicit activation. Normal expansion finishes before its final reveal; static expansion reveals immediately after render. It never adds a second list or requires completing a reading flow before approval.

## State and artwork boundaries

Approval freezes a local session/revision snapshot. Only the local lifecycle controls running/completed/failed/cancelled; animation callbacks do not declare success. Cancel/reset/unmount invalidate old callbacks. Real task progress will require separately authorized backend integration.

Keep photos in original color and proportion with contain on the main canvas/zoom. Avoid automatic image scaling/rotation, looping decorations, particles, glow or background animation. The design system preview is a component review surface, not a second generation workflow.
