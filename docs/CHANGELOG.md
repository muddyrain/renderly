# Changelog

## Unreleased

- P0.10 B4–B6: connect six routes through one browser-memory workspace; preserve drafts across soft navigation and reset fixtures on refresh. PR #1 was merged at its exact reviewed HEAD before this branch.
- Implement Gallery filters/favorites, detail, real preset versions/variants, keyboard comparison, original-JPEG download, removal and one-shot Studio references. Use restrained local Framer Motion layout; retain the previously authorized Inspira Tabs source/license chain without copying additional upstream components.
- Add project/character CRUD and association cleanup, example model configuration and ratio/density/motion preferences. Freeze approval context and insert a completed demo into Gallery once; cancel runs on route/context changes.
- Add 16 workspace domain/lifecycle tests beside the retained 12 Studio tests and Button type contract. CI executes both suites and strict side-effect import checks. Verify desktop layouts and browser workflows; no P1 or real business integration.
- Remove the unused B2 empty component/styles, update local-demo documentation and keep all existing licenses. The new PR remains open for human review, without automatic merge.

### Earlier B0–B3.1 and PR #1 changes

- PR review follow-up: make explicit Plan reveal independent of native pointer focus while cancelling delayed reveals after subsequent interaction; anchor new-message feedback outside the scroll area and preserve unsent reference drafts.
- Restrict disabled Button semantics to native buttons through a type contract; include project/shadcn/Inspira license texts in the web image. Add real-adapter completion coverage and run Studio lifecycle tests in CI.

- P0.10 B3.1: remove /legacy-demo, its Studio/SampleImage implementation and stylesheet, unused package manifest/inventory/reference images and the inactive nested lock. The root lock and current design system, photos and licenses remain.
- Replace the existing vector favicon colors with Graphite/Sage and a contrasting edge.
- Fix Plan live reduced-motion by removing the entire animated presence subtree in static mode; add a fixed “查看计划 · 3 步” shortcut to the single Plan without an approval gate.
- Update current documentation and agent reading pointers. B3.1 stops at Code Review; no B4/P1 or Git publication.

- P0.10 B3: replace the Studio skeleton with a page-local Demo conversation, editable Brief, pending Plan and guarded Composer. Explicit approval freezes revisions; cancellation/reset/unmount reject stale callbacks, and retry requires review. No live generation or persistence is connected.
- Add three offline sample photos, independent asset/version/variant selection, loading/error/retry, parameters, zoom and reference continuation. All results stay labelled as preset/local Demo.
- Adapt authorized Inspira MIT Aceternity Tabs to existing framer-motion/Tailwind 3 and Radix keyboard semantics; add exact Radix Tabs 1.2.1 only. Reuse the live motion preference hook and keep graphite/Sage tokens.
- Add lightweight lifecycle/race tests and actual browser/screenshot/video evidence. B2 is accepted; B3 delivery stopped at Code Review, with B4/P1 untouched.

### Earlier B0–B2 changes

- P0.10 B2: add `/studio`, `/gallery`, `/projects`, `/characters`, `/models`, `/settings`, shared workspace navigation and persistent Demo notice. `/` redirects to `/studio`; page actions remain unconnected skeletons.
- At B2 delivery, a development comparison route was retained; B3.1 removes it. The design system preview remains development-only.
- Add a global `*.css` ambient declaration for explicit `noUncheckedSideEffectImports` checking without editing generated Next types or weakening strict checks.
- Add lightweight navigation/page feedback with live reduced-motion support; record Aceternity source selection for B3/B4 without importing components or adding dependencies.
- Recapture the B1 1440×900 overview and preserve the original anomalous PNG as historical evidence.
- P0.10 B0+B1: freeze Graphite Atelier and official shadcn Tailwind 3 component sources with exact compatible dependencies.
- Add scoped RGB tokens and five consumed primitives: Button, Input, Textarea, Dialog and Tooltip.
- Add the development-only `/design-system` Demo preview with left navigation, left Agent and right canvas slots. It includes input/button/error states and keyboard-accessible overlays. Production returns 404 for this route.
- The B0/B1 foundation did not include backend/business integration; subsequent routing and Studio implementation are recorded above.
