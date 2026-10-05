# Admin editor Blueprint styling — October 4, 2026

## Prove

Developer requests Character Edit styling as the Blueprint for other Admin editors, title-adjacent help, green enabled Save controls, bottom-left Save/Cancel actions and transparent form panels. Screenshots identify Character Details, Model Details and standalone Model File settings. Inspection finds Model/File `bg-card` and muted panel fills, right-aligned Model/Character footer actions and preview help rendered after the flexible heading area. Character's Movement help is on a separate line. The worktree already contains Developer-owned v0.22.21 release-confirmation documentation; preserve it.

Scope: shared opt-in Blueprint panel/action CSS, a shadcn Button save variant, existing preview header help slot, Character/Model/File editor hosts and their Model resource panels. Do not apply viewport rules or global background overrides to unreviewed pages. Acceptance: transparent rounded/bordered form sections; help immediately follows its title; enabled Save is green, disabled Save remains muted; footer Save then Cancel/Discard starts at the left and wraps on narrow widths. Preserve all handlers, busy/dirty guards, fieldsets, camera lifecycle and save authority. Keep Canvas rendering backgrounds and status colors separate from form surfaces. Package version remains the released `0.22.21`; no new release is claimed.

## Act

Added opt-in `admin-editor-panel` and `admin-editor-actions` utilities in `src/app/globals.css` and the shared shadcn Button `success` variant. Model Details, Library image, File settings and resource inventory panels now have transparent backgrounds. Character runtime information follows the same surface convention. Footer Save controls are green when enabled, muted when disabled, and precede the existing Cancel/Discard controls at the left. Character unsaved-state text remains visible at the right.

`ThreeDModelAssetPreview` now provides a separate title-adjacent `headerHelp` slot; Character and Model preview help use it. Character runtime and Movement help sit beside their headings. Existing handlers, guards, inputs and Canvas behavior are preserved. The shared Admin workspace Blueprint documents these conventions for incremental adoption by other editors.

## Document and validation

October 4, 2026: eight focused editor/list/preview/shadcn tasks, `npm run typecheck`, all 58 maintained CI tasks, `git diff --check`, and the agent-owned guarded `npm run build` passed. The initial sandbox CI run failed on Windows `tsx` OS profile lookup (`uv_os_get_passwd` ENOMEM); the offline retry outside the sandbox passed. The build used cached font fixtures and the existing network/database guard. The development server was restored on port 4444. No live database, browser acceptance or deployment testing is claimed; all changes remain unstaged.

Browser review: Character Details, Model Details and standalone File settings in both themes, short/narrow windows, title-help keyboard focus, green enabled/muted disabled Save, wrapping left footer controls and existing save/discard/cancel flows. Screenshots establish the requested appearance, not verification of the implementation.

Developer subsequently approved the appearance and requested production release. Release preparation advances package/lockfile to `0.22.22`; see the [release candidate handoff](../releases/v0.22.22.md). Detailed browser cases and production confirmation remain separate.

Suggested commit title: `v0.22.22 — ThreeD Admin: align editor Blueprint styling`.
