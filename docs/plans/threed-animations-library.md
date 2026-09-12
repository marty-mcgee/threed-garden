# ThreeD Animations Library — implementation plan

Status: schema additions explicitly approved by the User; Stage 1 implemented and validated locally. Live database updates remain separate. Baseline: v0.19.13, production and manual build User-confirmed; documentation release `ea41c9e` is also User-confirmed. This supersedes treating Model Animations solely as an embedded-clip mapping page.

## Evidence and acceptance

- `src/components/admin/threed/models/ThreeDModelAnimations.tsx` currently writes action-to-clip names into `threed_models.metadata.animationMap`; it has no independent library records.
- `src/lib/schema/threed/index.ts` contains Model files, reusable Model Textures and material assignments, but no reusable animation library or Model/Character animation assignments. Character animation enum fields are behavior selections, not asset references.
- `src/lib/utils/externalCharacterAnimations.ts` contains a working static FBX library selected for a known Farmer model. It loads the first clip from each file and returns cloned clips. Preserve that released fallback and the tracked assets.
- `src/lib/utils/animation.ts` maps locomotion actions; the external library also covers semantic actions such as watering and picking fruit. The new selector must cover both catalogs through explicit adapters, not rename runtime actions silently.

Acceptance: an animation exists independently of a Model or Character; multiple targets can reference the same clip/file without copying bytes. Users can preview compatibility, assign/remove/override animations, and see usage. Removing an assignment never deletes its animation. Character controls, animation crossfades, first-pose visibility, saved position/rotation, and completion-gated world actions must remain intact.

## Proposed schema (additive; no migration of old data)

| Table | Purpose and principal fields |
|---|---|
| `threed_animation_files` | Owner-scoped reusable source: id, user_id, file_name, file_path, file_size, format, checksum when available, inspected source metadata, timestamps. One stored file may contain several clips. |
| `threed_animations` | Reusable clip: id, user_id, animation_file_id, name, clip_index, clip_name, duration, rig/track inspection metadata, is_active, timestamps. Unique source/clip index. Source index distinguishes duplicate clip names. |
| `threed_model_animation_assignments` | id, user_id, model_id, action_key, animation_id, mode, timestamps. Unique Model/action. |
| `threed_character_animation_assignments` | id, user_id, character_id, action_key, animation_id, mode, timestamps. Unique Character/action. |

Use real foreign keys for each target type rather than a polymorphic target ID. Assignment mode is `assigned` (requires animation_id) or `disabled` (animation_id must be null). Inherit/Auto removes that level's assignment. Validate modes and action allowlists in the API and enforce assignment consistency in the schema. Reject owner-mismatched assignments. Restrict deletion of referenced animations/source files; target deletion removes only its assignments. No public library publishing or cross-owner catalog exposure is added in the initial phase.

An existing Model's embedded clip can be registered by referencing its existing owned source URL without a Blob copy; ownership/deletion checks must recognize that shared URL before exposing this option. Start with uploaded standalone sources to avoid silently widening existing file deletion behavior.

## Resolution and playback

Character-specific action assignment takes precedence over its Model assignment. If neither exists, preserve the released metadata mapping, embedded clips and static external-library behavior unchanged. An explicit Disabled stops fallback for that action. A failed explicit assignment is reported as unavailable rather than silently masquerading as the requested clip.

Reuse source data/parsed clips where safe, but create playback actions per runtime mixer. Do not share mutable model skeletons or AnimationActions. Resolve sources before revealing the Character, evaluate its initial pose, and retain independent GardenCharacter/EcctrlCharacter paths. Assigning an animation does not enable locomotion on a generic Model or grant permission to execute a world action. One-shot semantic actions remain one-shot; completion continues through the established world-action gate. Loop/speed controls cannot override those semantics.

Compatibility requires checking track targets/bones and previewing against the intended target. A shared filename or a common FBX format is not proof of rig compatibility. Automatic retargeting is outside the first implementation.

## UI and bounded stages

1. **Persistence and read contracts:** approved schema, owner-scoped library and assignment APIs, batched relation reads, pagination/search/sort, reference-protected deletion, fixtures for ownership and precedence. Prepare local Drizzle changes only; no live database push is authorized by this design.
2. **Library administration:** ThreeD Animations navigation and compact Model Textures-style workspace, source upload/inspection, clip selection and usage. Start with FBX and self-contained GLB sources; report other formats as unsupported until their dependencies are supported. Loading failures must not clear saved mappings or enable a destructive Save. Keep the old Model Animations route as a compatible entry point.
3. **Assignment editors:** Model and Character forms expose existing-animation selection by action, Character inheritance, explicit Disabled, compatibility preview and usage. Preserve legacy mappings until an explicit replacement is saved. No file copying for assignment.
4. **Runtime integration:** resolve explicitly assigned clips in the two existing Character paths, then verify generic Model playback only through its existing animation contract. Preserve controlled movement, semantic action mapping and no-flash readiness. Add equivalent fixture and browser coverage before rollout.
5. **Manual release checks:** one animation shared by multiple Models and Characters; Character override and inheritance; removal without Blob deletion; protected delete; incompatible/missing clip; idle/walk/run; targeted Water/Pick Fruit exactly once after completion; save/reset/reload with position/rotation and first animated pose retained.

Use original synthetic clips and tracked animation assets for offline tests. The User owns the manual build gate; do not run `npm run build`. Do not replace the known-good external library or migrate existing records as part of initial scaffolding.

## Scope boundary

This is a new capability, not merely a table-layout adjustment. Keep unrelated Admin page changes paused during each bounded library stage. No next release version is designated yet. Existing animation-editor loading/None/save findings from the workspace continuation remain tracked and must be handled by the corresponding replacement editor, not silently shipped as solved.

## Stage 1 implementation record

The approved file/clip and Model/Character assignment tables are now in the Drizzle schema. Owner-scoped catalog read/update/delete and assignment read/upsert/remove APIs are implemented, including reference protection, explicit Disabled versus Inherit, Character precedence and bounded/batched reads. See [API and validation details](../developers/THREED_ANIMATIONS_LIBRARY.md).

`validate:threed-animation-library`, TypeScript and diff checks passed. The generated local SQL is additive only and has not been applied. Existing dirty changes in this plan and the continuation document were retained and advanced; unrelated files were preserved. No runtime/editor, assets, environment, build or production changes occurred. Stage 2 remains next: inspected source uploads, clip registration and autonomous library administration. New sources cannot yet be created through these read/assignment APIs.

## Existing behavior audit before Stage 2

The [Model #935 screenshot and existing animation structure audit](threed-animation-existing-structure-audit.md) distinguishes embedded clips, Git-tracked external Character sources, semantic mappings, runtime playback and world actions. Stage 2 must expose independent library choices even for targets with zero embedded clips, preserve unnamed clips by index, and distinguish failed discovery from valid empty results. Built-in inventory must not require copying tracked FBXs; generic object compatibility and action catalogs need explicit adapters rather than applying Character motions indiscriminately.

## UI ownership correction — standalone workspace

The User rejected the Model-bound editor direction. Reverted its new shared panel, editor changes and row shortcut. The library now lives at **ThreeD → Animations** (`/admin/threed/animations`), with no Model/Character selector. Old Model Animations URLs redirect to this workspace. Source upload/registration and target assignment UI are later stages. The existing autonomous schema and optional relationship APIs are preserved. See the [current workspace and manual checks](../developers/THREED_ANIMATIONS_LIBRARY.md#standalone-library-workspace--corrected-ownership).

## Autonomous upload and management implemented locally

The Textures-style workspace now supports source upload/inspection, transactional multi-clip registration, rename/active edits, server sorting, pagination, page-local selection and protected bulk deletion. Source files live under the User’s independent `animations` storage prefix. See the [current upload contract and test checklist](../developers/THREED_ANIMATIONS_LIBRARY.md#textures-style-upload-and-management-checkpoint). This supersedes earlier notes that upload was unavailable. Source cleanup, built-in registration, compatibility preview, target editing and runtime integration remain pending. No additional schema or live database application was performed.

Presentation correction: the User rejected the built-in catalog block and non-blueprint layout. The current workspace uses Textures’ shared table components, inline editing/toggling, compact toolbar and persistent records/error frame. Built-in assets remain intact outside this management page. See the [current presentation record](../developers/THREED_ANIMATIONS_LIBRARY.md#blueprint-correction--current-presentation).

## Character assignment controls implemented locally

The Character table now offers an **Animations** action opening independent per-action library assignments. Search/pagination, saved-state readback, disabling and inheritance restoration use the existing APIs. See the Character assignment editor section in `docs/developers/THREED_ANIMATIONS_LIBRARY.md`. User confirmed the schema push and 46 FBX uploads. Character assignment persistence is ready for manual testing; Model editing, compatibility preview and Scene runtime consumption remain pending and are explicitly identified in the form.

## Character playback integration implemented locally

Both existing Character runtimes now consume saved library assignments during Model loading. The editor-only playback warning is replaced with instructions to reload the Scene. The actual Project Model's defaults and Character overrides use shared source URLs and stored clip indices; explicit disabled/unavailable states do not silently select a different action. See the current Character Scene playback section in `docs/developers/THREED_ANIMATIONS_LIBRARY.md` for manual regression steps and binding limitations. Model assignment editing, compatibility preview/retargeting and hot-swapping remain pending.
