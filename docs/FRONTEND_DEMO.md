# Frontend modes and creative demo contract

P1 adds explicit connected project CRUD. Run `pnpm local:setup` then `pnpm dev:connected`; all project selectors share the API list, while the remaining creative state still resets on refresh. API errors never fall back to sample projects. Setup/runtime/production commands and credential boundaries: [PROJECT_DEVELOPMENT.md](PROJECT_DEVELOPMENT.md). API and asynchronous contracts: [PROJECT_API.md](PROJECT_API.md).

The following describes pure Demo and the creative portions that remain local in connected mode. Start from the repository root with `pnpm dev`; open `/studio`. The six desktop routes share one in-memory workspace. Soft navigation, Back and Forward preserve workspace records and unsent Studio text. Refresh or a new browser page creates fresh fixtures. No browser storage, provider request, real upload, billing or backend business API is used.

| Page | Observable behavior |
|---|---|
| Gallery | Combined title/project/category/favorite filters, per-ID favorites, Radix detail, preset versions/variants, keyboard range comparison, original local JPEG download, confirmed removal and one-shot Studio continuation |
| Projects | Search, validated create/edit, cancel, confirmed delete and Studio context selection; counts/thumbnails derive from current assets |
| Characters | Name/appearance/constraints, optional local mood images and project associations; validated CRUD and copy into Studio Brief |
| Models | Two explicitly example-only model definitions; validated integer detail 1–10, apply/cancel/confirmed defaults; next-plan consumer and immutable approved config |
| Settings | Default ratio for new/reset Brief, Gallery three/four-column density, system-or-app reduce; apply/cancel/confirmed defaults |
| Studio | Existing conversation, editable Brief, approval, cancel/review/reapprove, presets and image recovery; completed snapshots add one correctly associated local Gallery result |

Deleting a project retains its assets as unassigned, strips character project links and clears/cancels an active context. Deleting a character retains already copied Brief text and approved snapshots. Reference intents are consumed once, clear before application, preserve unsent draft text and invalidate old approval. Re-entering Studio or history navigation cannot replay an intent. Missing/deleted IDs are rejected. A new Studio session clears only Studio, preserving projects, assets, characters and preferences.

Approval owns cloned/frozen project/model values, Brief/ratio/reference IDs and preset artwork. Later rename/edit/config/selection changes do not rewrite a snapshot. Run/session identity prevents duplicate insertion and late cancellation, leave or context-switch callbacks. Photo versions are preset alternatives, not generated revision history; ratio is a creative intention and never resizes those files.

The previously accepted Aceternity → Inspira MIT → React Canvas Tabs remain in use. Gallery's layout/range implementation is local, with no additional upstream component or dependency. shadcn/Radix own controls and focus. App reduce combines with system reduce, including portal overlays and live Plan boundaries. Graphite/Sage and desktop widths >=1280 CSS pixels remain the design scope; mobile/320px high-zoom reflow is not claimed.

## Repeatable edge checks

Development only, after a page is hydrated:

```js
window.__renderlyDemoTest.loadFixture("empty");
window.__renderlyDemoTest.loadFixture("default");
```

`empty` clears workspace records and example models, cancels old runs and opens a blank Studio. `default` restores fixtures and pending preset Studio. Empty Models can be restored through its ordinary confirmation UI. Production does not register this test API or show the Studio failure scenario selector. For deterministic image failure, intercept one `/demo/forest.jpg` request in browser tests, remove the intercept and retry; expected failed-resource console entries are not hidden.

## Verification commands

Stop dev before type generation/build; use root pnpm 10.33.0 commands:

```sh
pnpm install --frozen-lockfile --strict-peer-dependencies
pnpm --filter @renderly/web test:studio
pnpm --filter @renderly/web test:workspace
pnpm --filter @renderly/web test:projects
pnpm lint
pnpm typecheck
pnpm --filter @renderly/web exec tsc --noEmit --incremental false --noUncheckedSideEffectImports true
pnpm build
git diff --check
```

Studio (12 cases), workspace domain/lifecycle (16 cases), project API/synchronization/proxy tests and strict CSS imports execute in CI; Button type-contract checks remain in typecheck. Local browser evidence lives under ignored `review/P0.10-B4-B6-Frontend-Closeout-2026-11-06/`. PR records actual checks and limitations; a completed frontend demo is not P1 completion. New PR merge requires human review.
