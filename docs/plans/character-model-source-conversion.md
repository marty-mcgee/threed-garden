# Character Model source switching — v0.22.18 continuation

Developer-reported production release, confirmed October 4, 2026: **v0.22.18 — ThreeD App: solidify foundations and Model editing**. Prior local validation remains separate. Detailed Developer browser verification remains pending; no browser acceptance or post-deployment testing is inferred. Read-only Git history identifies implementation commit `f3c3c050`, but neither Git history nor the release confirmation establishes deployment of that SHA; the deployed SHA remains unconfirmed. Stage 3A remains partially verified and paused; restoration and cleanup remain deferred. See the [release record](../releases/v0.22.18.md). Earlier candidate/handoff status statements below are historical and superseded only as to production-release status; their local validation and pending browser checks are preserved.


Release-preparation update, October 4, 2026: Developer approved preparing the complete v0.22.18 candidate for manual release. See the [combined release handoff](../releases/v0.22.18.md) for final scope, evidence, browser checklist and canonical suggested commit title. This readiness statement is separate from local validation and does not establish full browser acceptance, production deployment or a deployed SHA. Existing implementation evidence and historical notes below are preserved; detailed browser checks remain pending and Stage 3A stays partially verified and paused.


## Approved behavior and proof

Developer clarification, October 4, 2026: Source has **Model / Shape / Character / Other […]**. Shape switches assigned Characters to procedural geometry. Character uses the existing Character runtime and restores its saved rig. Other is disabled until supported types are defined. No saved source data is removed or deactivated.

Confirmed problem: the old editor used file URL/type/primary ID as the active source and cleared them during conversion; Character source conversion was blocked. Retaining those fields while choosing Shape would therefore keep loading imported geometry. The old source-locking/unassigned-only design below is superseded by this approved explicit active-source contract.

Affected files: Model editor fields and payload validation; Models API validation/public metadata serialization; shared source/readiness helpers; Admin preview projection and selected File override; ModelMarker3D; separate GardenCharacter/EcctrlCharacter; Scene Character memo signature; offline editor/API/source fixtures. No schema or package version changes belong to this continuation.

Acceptance: reversible source selection retains file ID/URL/type/size, saved shape, rig, textures, animation mappings and transforms. Admin draft/save/discard rules persist. Generic Model rendering and assigned Characters use Shape only when selected. Separate Character runtimes, isMovable routing, stable marker identity, persistent Canvas/Physics and existing controller/collider settings remain. Rigless Shapes expose no rig-dependent animation or action collision points, and fabricate no animation completion/world effects. Selecting Character/Model restores imported geometry through the established loader and first-pose gates. Explicit File previews continue to show that File even when the parent uses Shape.

## Implementation and local validation

Implemented locally October 4. Existing metadata.activeSource selects the rendering source without clearing the retained file configuration; legacy records infer their previous behavior. The owner-scoped API validates supported sources while preserving primary attachment ownership checks. Public Library serialization exposes only validated active source/fallback shape, retaining private metadata privacy. Active Shapes do not require textures for inactive retained FBX/OBJ geometry.

Both Character owners render a grounded procedural mesh with composed Model/Character scale and facing while retaining their original runtime/controller. Existing loader cancellation releases animation availability and clears stale rig state; Ecctrl retains visual readiness/navigation for Shapes, suppresses its old Cylinder visual and disables rig animation control. Model/Character restore the saved imported source. Source selection does not move markers between Sub-Modules or change Character classification to ordinary Models; Character selection enables the existing Character classification. Saved animation data remains available, but cannot play on a rigless Shape.

Nine focused offline tasks passed: editor tabs/source round trips, Admin form, Models API, Library placement, Character animation assignments, action collision, Soccer kick, Character ball contact and File workspace/preview. All 56 CI tasks, TypeScript and the guarded npm production build passed. The source fixture executes actual Character loader effects, proves stale geometry/clip clearing without loads/world writes, and checks retained source configurations. It also executes both task callbacks and the Ecctrl contact sampler with Shape enabled, proving immediate rejection even before stale rig cleanup; the Garden action listener refreshes on source changes. Actual UI/API fixtures cover source save payloads, primary ownership, private metadata exclusion and active Shape Library readiness. Existing imported-rig/action/physics regressions remain passing. One Windows sandbox tsx startup failure occurred before assertions (uv_os_get_passwd ENOMEM); offline fixtures passed outside that sandbox. The build used cached localhost fonts, a child-process unreachable database URL and a guard blocking external/database connections. Development was restored on port 4444. Documentation UTF-8/local-link and diff checks passed; the final task/sampler guards also passed focused regression and TypeScript checks.

These are local results, not browser acceptance or production evidence. Version remains 0.22.18; v0.22.17 remains the latest Developer-reported production checkpoint. Changes are unstaged under the Manual Release Gate. No agent browser/API requests, live database/storage, Git writes or deployment occurred. Stage 3A remains partially verified and paused; restoration and cleanup stay deferred.

## Pending Developer browser checks

Use disposable verification edits and restore the original source afterward.

- http://localhost:4444/admin/threed/models/11: choose Shape and a procedural shape. Expect the draft Canvas to show it, one shape control, and Other disabled. Cancel/Discard must retain the saved source. Save/reload Shape; expect that source and shape retained, with the original primary file still in Files and no re-upload required.
- http://localhost:4444/dashboard/scene?projectId=16: after a fresh Project load with the saved Shape, an assigned Character using that Model shows the selected procedural shape. Take Control/WASD/release (Ecctrl) and autonomous movement (Garden, where assigned) retain their existing owner/control behavior. Shape has no rig animation/kick collision-point availability and cannot produce an animated kick world effect. Other assets and balls retain their behavior. No collider dimensions were changed to match the new visual.
- http://localhost:4444/admin/threed/models/11/files/81: while parent source is Shape, expect the selected imported File preview and saved appearance, not the procedural parent preview. Navigate back to the parent; expect source retained.
- http://localhost:4444/admin/threed/models/11: choose Character, Save and reload; expect original primary/rig and mappings retained. Fresh Project 16 load restores the rig and available animation/kick behavior. Repeat Model → Shape → Model on a disposable ordinary Model and verify saved files/shape/scale and Library placement.

Suggested commit title only: v0.22.18 — ThreeD Models: preserve configurations across source switching.

## Historical proposal — superseded, not current implementation

The following unassigned-only proposal records the earlier analysis. Its guard/detachment recommendations are not the approved behavior above.

Requested October 4, 2026 as a separate design accompanying the Model editor refinement. This document does not authorize removal of Character conversion guards. No Character runtime or API code changed; v0.22.18 remains a local candidate.

## Confirmed boundary

`ThreeDModelEditorFields.tsx` locks source switching when `usedByCharacters` is true. The owner-scoped Models PATCH in `src/app/api/threed/models/route.ts` explicitly rejects imported Character-to-procedural conversion. Ordinary conversion detaches primary geometry without deleting attachments. Garden and Ecctrl resolve imported Character geometry and external animation mappings through separate runtime paths; absent geometry uses their established fallback, not the generic Model's procedural mesh renderer. Therefore changing only `modelType` and clearing the URL does not establish a procedural Character with working animated actions or collision points.

## Recommended first implementation milestone

Allow reversible source editing for **unassigned Character-classified Models only**, with server-side usage checks and an explicit explanation that the procedural shape is a reusable Model preview, while Character runtimes retain their established fallback behavior. Reject conversion while the Model is assigned to any Character until an assigned-runtime design is implemented. Audit actual Character references, overrides and Project assignments before choosing the usage-query predicate; no new schema is assumed. An authoritative owner transaction must recheck usage and attachment ownership at save time, not trust browser eligibility.

Preserve all attachments, reusable Texture assignments, Animation references/mappings and `usedByCharacters`. Procedural selection clears active primary ID/URL/type through the established source transaction; restoring file geometry requires choosing a valid saved owner/parent attachment and derives its format. Never deactivate the saved attachment itself as a side effect. Keep source edits draft-only until Save and retain Cancel/Discard/history guards. No automatic migration of placed Runtime Markers, Character assignments or Project snapshots.

Affected implementation after approval: source eligibility and PATCH transaction in the existing Models route/service boundary; Geometry controls in the Model editor; offline auth/usage/concurrency/source round-trip checks. Separate Garden/Ecctrl runtimes and physics need no changes for this restricted milestone. Inspect the actual schema and reference-precedence paths before writing queries; no live database/storage access is required for that audit.

## Assigned Character conversion — separate follow-up

Before allowing conversion of assigned Models, define whether a procedural Character is deliberately unanimated or receives a supported rig. Preserve `isMovable` routing, Character position/control and Cylinder fallback. Missing rigs must report unavailable animation/contact-point Actions; they must not fabricate clip completion or world effects. Define safe in-place visual/runtime transitions and rig restoration without replacing the persistent Canvas/Rapier world, marker identity or unrelated owners. This follow-up needs explicit behavioral acceptance and full Garden/Ecctrl/action/sensor/ball regression evidence; the current request does not provide those semantics.

## Acceptance and browser checks for the first milestone

- Offline: reject unauthenticated/foreign edits, reject assigned or concurrently assigned Models, preserve attachments/Texture/Animation references, round-trip procedural → valid imported file with derived format, and preserve draft/save/discard/busy guards. Run existing Character routing/animation/action/contact fixtures, TypeScript, CI and guarded npm build.
- Browser on an eligible disposable unassigned Character Model: switch to procedural shape and Cancel; expect no saved change. Save and reload; expect no active geometry file and retained attachments. Select the original file, Save and reload; expect restored primary and format without upload.
- `/admin/threed/models/11`: until usage evidence establishes eligibility, conversion remains protected. No production assignment or Scene changes should be inferred from this design.

Status: proposed design only; implementation, local validation, browser acceptance and production release are all pending for Character conversion.
