# UI Package v0.2.0 — source inventory

The maintainer confirmed on 2026-11-05 that the v0.2.0 files already present in this repository are the integration source. No ZIP or additional extraction is required.

`PACKAGE_MANIFEST.json` supplies version/scope metadata but no per-file manifest. The following inventory was captured before integration. Only the listed frontend, package metadata and design handoff files are treated as UI source. Backend, infrastructure, migrations and project architecture documents are not UI input.

The original UI-only README section is preserved as `UI_PACKAGE_README_V0.2.0.md`. The root README also contained Hertz instructions; those are project documentation, not UI package source.

| Source path | SHA-256 before integration |
|---|---|
| `PACKAGE_MANIFEST.json` | `cbe3dc931916a89a81c5b829f131ef03bdb9961eaf9270d29c00897c37bdac45` |
| `apps/web/app/globals.css` | `9d2a5e139267b1a148b4cd7a1b2695cea6fb849860c45c8d853ff4d28d6bc3e3` |
| `apps/web/app/layout.tsx` | `7271205b7d5114de4140a1f241898616e3796ad0360e52a95101fb323adae12d` |
| `apps/web/app/page.tsx` | `26119c956d856c1bce7b3abbcdc23845899e25f5ec7ddb0d74ab2c083870e166` |
| `apps/web/components/renderly-studio.tsx` | `513b30be53cd7f308ec3e07f435e6f9b5cfd7685671959b65aa5a21c46d2d931` |
| `apps/web/eslint.config.mjs` | `6544aaf754736ee42ad9a8e24b0edd22b8d218951173d282e0821699099a6652` |
| `apps/web/next-env.d.ts` | `f2b3bca04d1bfe583daae1e1f798c92ec24bb6693bd88d0a09ba6802dee362a8` |
| `apps/web/next.config.ts` | `c7477f3fcd2a5c0b00e564d84c768fe17037e1161318e8299396b251e1c0b4cd` |
| `apps/web/package.json` | `7d94d9a08ce777a198a0fbbc5d1a66f4d674d980f397bf772ed03b83e8c47dc8` |
| `apps/web/pnpm-lock.yaml` | `2250d9ef9a91681b316e55122cd3c2b8e9c88d48308f5b007eb2dd439d6ac6a0` |
| `apps/web/postcss.config.mjs` | `367fbca6f16a783112387d94ee7bb91ec72e3b36b6d61228f6247cda6ee46d47` |
| `apps/web/tailwind.config.ts` | `c2ca8dcd685841d97636cfe25f177b93cefde251b14bb4b0a8efab2ad257dda9` |
| `apps/web/tsconfig.json` | `84e6340a9aa74b3ce2130e7ff8595184888dba17dfc7cfaaf9b9a4578af0e1f0` |
| `docs/DESIGN_HANDOFF.md` | `365bb4e56d2c91532d4395c23673fffe72ebcf24a498ec512c72e3e40b032f7e` |
| `docs/FRONTEND_INTEGRATION.md` | `72f660a4b4295048e556cd285f39421797e51d4e50f46041040a40bee35d603f` |
| `docs/MOTION_SPEC.md` | `c2eb8bab2aaae0552315adef2b08d343fc433c822d17b4547c9d9de60b2a7b2c` |
| `docs/design/renderly-screen-system-reference.png` | `fb38e87afd1f6409c72d8bdd8745525a8d78954366511ba69bdbb0bfef67e7a3` |
| `docs/design/user-approved-studio-reference.png` | `a818e2f489d8b2c2798e7f36006667e649e10296f92aa2807d33bd2124b44a5c` |

The application was already located at `apps/web`, so integration did not copy over the backend or replace another frontend tree. Changes are limited to workspace naming/configuration, supported security patch versions, explicit demo labeling, safe demo timer cleanup/cancellation, image loading/error handling, and accessibility/motion configuration.

The original `apps/web/pnpm-lock.yaml` is retained unchanged as package provenance. Workspace commands use the repository-root `pnpm-lock.yaml`; the nested source lock is not the workspace install lock.

The package metadata validation fields describe the packaging environment. Repository acceptance is recorded in `docs/ROADMAP.md`, not retroactively written into the source manifest.
