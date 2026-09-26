# Character behavior and world-action UX — continuation after v0.19.16

**Continuation planning resumes in [v0.19.19](v0.19.19.md).** The v0.19.17 UI milestone and v0.19.18 presets/navigation milestone are released. Retain accepted Character forms and navigation.

Production baseline is v0.19.18, with feature and documentation deployment User-confirmed. The remaining stages below are historical proposals to re-audit against current code, not unimplemented-feature assumptions. No schema, persistence expansion or physical-device behavior is included.

## Stage 1 — explain Character control in Admin

Proved: `isMovable` chooses Ecctrl when true and Garden when false. The label Movable suggests the false state cannot move, yet Garden can wander. Both Create/Edit forms expose the ambiguous switch. CharacterRuntimeReadiness also exposed internal component names instead of usable instructions.

Implemented: label Allow Take Control (WASD), with visible help for On (Scene Take Control/WASD) and Off (configured automatic movement; Stationary versus Wander). Runtime-readiness text uses the same language. Fields, values, routing and request bodies are unchanged. TypeScript and diff checks passed. No build or live writes.

User review: Admin → ThreeD → Characters → pencil Edit on a Character → Movement. Read the current switch state and explanation; no saving or changing runtime is necessary to review the wording. The Create form uses the same labels.

## Stage 2 — show current control/behavior in Scene DetailsCard

Inspect resolved marker fields and control state before editing. Show whether the selected Character supports Take Control and whether it is currently controlled. Describe automatic behavior for the existing Garden path without promising unsupported behavior after Release Control. Preserve `isMovable` routing, original cylinders, selection, camera, physics and saved transforms. Verify labels against both runtime paths, then provide exact in-App review steps.

Affected boundaries: `src/components/map/details/DetailsCard.tsx`, resolved Character marker data, GardenCharacter and EcctrlCharacter (inspect; do not unify runtimes).

## Stage 3 — distinguish animation preview from world actions

Current evidence: DetailsCard has “None — actions remain animation-only”; action completion is handled separately in `src/app/dashboard/map/page.tsx`. Targeted watering and supported fruit actions can persist records. A single general instruction to test Water/Pick Fruit obscures this distinction.

Next audit must trace target selection, action eligibility, dispatch, animation completion and persistence separately. UI should identify the selected target and whether an action only animates or can change Project data before the User invokes it. Reuse existing eligibility checks; do not invent or expand supported targets/actions. Preserve completion-gated writes and FarmBot physical-command restrictions.

## Stage 4 — completion and recovery feedback

Distinguish moving into range, animation playing, completed animation, saved world result and failed persistence. Base labels on existing lifecycle states; an animation finishing must not be shown as successful persistence before the API succeeds. Preserve current action cancellation, duplicate-completion protection and task-to-locomotion transitions.

## Stage 5 — concrete validation and release boundary

Run applicable assignment, animation restart, position, orchestration and Runtime Marker fixtures plus TypeScript. Provide User-facing steps using actual visible buttons and names. Read-only inspection and animation-only checks should precede any tests that change Project data. Any data-changing test must explicitly state its effect; no vague “disposable assets” instruction. Record browser observations separately from offline assertions. Manual production build remains User-owned.


## Character Edit usability correction — assigned Model and dialog width

User screenshot showed a blank Model selector and narrow Edit dialog. Proved: formData preserves character.modelId, but options were limited to the first 100 active Models; the Character list API already returns its accessible linked Model separately. Dialog used max-w-md while the shared responsive default also constrained width.

Implemented: include the edited Character’s linked Model in the dropdown when absent from fetched choices, without duplicate IDs. Existing selection now resolves by stored ID. Unavailable relationships display their assigned ID explicitly and remain preserved until changed; no false “select a model” readiness prompt for that case. Empty relationship uses the None option. Files are listed only when file details were actually returned. Both Create/Edit dialogs use sm:max-w-6xl and viewport-bounded scrolling; dropdown triggers span their available width. Edit title identifies the Character.

Validation: TypeScript, Character list fixture and diff checks passed. An actual-expression harness verified selection outside the 100 choices, duplicate avoidance and inaccessible-Model handling. No build/live writes. Manual review: Characters → Farmer Kate pencil Edit; verify the named Model/ID, expanded width with developer tools open, and full-width dropdowns. Opening the form needs no save. Replacement choice pagination remains a separate limitation; this fixes preservation/display of the assigned relationship.


## Character form density — visual pass

User accepted the restored Model selection and wider dialog, then requested tighter HTML/CSS. Proved: Create/Edit bodies still used full-width stacks with large section spacing. Both now use responsive two-column grids, smaller labels/controls, reduced padding and compact bordered sections. Model relationship remains full-width; save/create buttons align right on desktop. Narrow screens retain one column. No fields were hidden or removed, and handlers, values and Model selection behavior are unchanged.

Validation: TypeScript and diff checks passed. This presentation-only change adds no tests or build. Manual review: reopen Edit and Create, inspect the compact two-column layout, Model relationship and lower fields, then narrow the window to check single-column layout.
