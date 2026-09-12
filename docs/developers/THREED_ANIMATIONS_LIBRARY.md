# ThreeD Animations Library

Status: Stage 1 implemented locally after explicit User approval of the four additive tables. Baseline remains v0.19.13. The autonomous upload and management UI is now implemented locally. The User subsequently confirmed schema application and successful FBX uploads. Character assignment editing and Scene playback integration are now implemented locally; live playback acceptance remains pending. No release is included. The standalone workspace exposes the independent library inventory and management APIs. See the [staged plan](../plans/threed-animations-library.md).

## Ownership and storage

`threed_animation_files` owns reusable FBX/GLB source metadata. `threed_animations` identifies clips by source ID and zero-based clip index (clip names may be duplicate or empty). Multiple clips share a source; multiple targets share a clip without copying its file.

Model and Character assignment tables each hold one row per target/action. They contain real target foreign keys and an animation ID, never a copied URL. API writes verify target ownership while holding a row lock. Composite clip/source owner foreign keys prevent cross-owner library references; existing target tables are unchanged, so target ownership is also checked by the API. Target deletion cascades its assignments, not library assets. Clip/source deletion is blocked by foreign keys when referenced, with explicit 409 responses and coordinated row locks in the APIs.

Sources require a nonempty filename/URL, positive byte count, and FBX/GLB format. Clips require a nonnegative index and finite nonnegative duration. Assignment check constraints require an animation ID for `assigned` and no ID for `disabled`. The APIs accept only the existing locomotion and external semantic action keys. They do not add commands or world effects.

## API contracts

All endpoints authenticate through the existing session and scope reads/writes to its User ID. Responses use `{ success: true, data, ... }` or `{ success: false, error }`. Invalid requests return 400, unauthenticated requests 401, missing/not-owned targets 404, reference conflicts 409 and unexpected failures 500 with no query/connection details.

| Endpoint | Methods | Behavior |
|---|---|---|
| `/api/threed/animations` | GET | Paginated clips with source metadata and separate Model/Character usage counts. |
| `/api/threed/animations` | PATCH | `{ id, name?, isActive? }`; source/clip identity is immutable here. |
| `/api/threed/animations?id=7` | DELETE | Remove an unassigned clip record; retains source and stored file. |
| `/api/threed/animation-files` | POST | Multipart `file`: inspect FBX/self-contained GLB, store once, register all clips transactionally. |
| `/api/threed/animation-files` | GET | Paginated source records with registered clip counts. |
| `/api/threed/animation-files?id=2` | DELETE | Remove source record only after its clips are removed. Returns `storageDeleted: false`; no Blob deletion is performed in Stage 1. |
| `/api/threed/animation-assignments?target=character&targetId=11` | GET | Direct assignments, owned linked Model inheritance, batched clip/source metadata and effective action resolution. Also accepts `target=model`. |
| `/api/threed/animation-assignments` | PUT | Upsert one action on an owned target. |
| `/api/threed/animation-assignments?target=character&targetId=11&actionKey=idle` | DELETE | Remove this override; restores inheritance/legacy resolution. Does not delete the clip or source. |

List defaults: `limit=25`, `offset=0`, `sort=name`, `direction=asc`. Maximum page size 200; `search` is limited to 200 characters. Clips allow sorting by `name`, `created`, `size`, `duration`, `active`, `fileName`, `type`, `references`; source files allow `name`, `created`, `size`. Sorts have a stable ID tie-breaker. Pagination returns `{ limit, offset, total }`. Each list executes two queries regardless of page size, with aggregate usage subqueries in the row query. No per-row API or database requests.

Assignment example:

```json
{ "target": "character", "targetId": 11, "actionKey": "idle", "mode": "assigned", "animationId": 7 }
```

Use `mode: "disabled", animationId: null` to explicitly disable an action. DELETE means Inherit/Auto; it is distinct from Disabled. Unknown fields, actions, target types and invalid IDs are rejected. Assigning requires an owned, active clip with a source URL. Compatibility and remote file accessibility are not established by the assignment API; those checks belong to the upcoming inspection/preview/runtime stages.

## Resolution contract

Effective actions resolve Character override → owned linked Model assignment → `legacy`. An explicit Disabled blocks fallback. Missing/inactive clips or blank source URLs produce `unavailable` rather than silently selecting a different animation. The returned `assigned` state means a usable metadata reference exists; it does not assert a successful fetch or compatible skeleton.

Character inheritance uses `threed_characters.model_id`; it does not infer a Model from a Scene instance or expose another owner's private assignments. Project-specific Character Models will require explicit, authorized runtime context when integrated. Sources are fetched in one metadata query for all referenced IDs. Neither this resolver nor these APIs are wired into Scene playback yet. GardenCharacter/EcctrlCharacter, external FBX assets, first-pose presentation, saved transforms and completion-gated world actions keep their released paths.

## Creation and deployment boundary

POST accepts only one source file, not arbitrary URLs or caller-supplied inspection metadata. It accepts nonempty FBX or self-contained GLB up to 4 MiB. The server discovers 1–256 clips and validates finite duration/keyframes and 1–4096 tracks per clip. Clip identity is source/index, so unnamed and duplicate-named clips remain valid. Texture loading is inert during inspection; external GLB buffers/images are rejected. Compressed GLB decoder support and automatic rig retargeting are not included.

Files are stored under `threed/users/<owner>/animations/<readable-name>--<uuid>/<filename>`, with SHA-256 metadata. Each upload stores one source and inserts all discovered clips in one database transaction. The tables are checked before writing Blob bytes. On a failed/ambiguous transaction, cleanup only deletes the Blob after a read confirms no committed source references it; unavailable verification retains the bytes. Refresh before retrying an interrupted upload to avoid duplicates. This is not content-hash deduplication or durable orphan recovery.

Built-in sources remain read-only and are not automatically registered. Uploaded sources/clip assignments do not copy bytes per consumer. Removing a clip retains its source record/Blob; referenced clips cannot be deleted. Physical source-file cleanup and existing-Model-file source sharing remain separate lifecycle work.

The tracked source of truth is `src/lib/schema/threed/index.ts`. Local Drizzle generation produced `drizzle/0017_threed_animations_library.sql` and its snapshot/journal entry; `/drizzle` is ignored by existing repository policy. Inspection confirmed only four new tables, their checks/indexes/FKs, and no changes to existing tables. Generation used CLI schema/dialect arguments and did not connect to a database or load environment files.

Applying the schema remains a separate User-owned step. Existing data needs no backfill and existing routes do not depend on the new tables. New library APIs require those tables before use. A code rollback can leave the additive tables in place; dropping them would discard new library records and is not part of rollback by default. No special migration triggers or old-data conversion are required.

## Validation

- `npm run validate:threed-animation-library`: passed offline against actual route/service functions with queued database results and real Drizzle schema introspection. Covers auth, owner filters, strict input, 0/1/50/200-row lists, Character/Model precedence, disabled/unavailable/inherit distinctions, mutation/reference guards and safe error responses. Included in CI.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

The fixtures do not prove live Postgres concurrency/DDL execution, remote source availability, rig compatibility or browser playback. Those checks remain for the corresponding later stages. No build ran; the User retains the manual build gate. No live database or Blob operations ran.

## Standalone library workspace — corrected ownership

User correction: ThreeD Animations must live outside Models; Model/Character usage comes later. The interim Model-bound library panel and row-level clapperboard shortcut were reverted. The prior embedded editor implementation is retained unchanged in its original source, but is no longer the library entry point. Its incremental inspection/editor tests were removed with the reverted implementation; earlier editor checkpoint results do not describe this workspace.

Use **Admin → ThreeD → Animations**, a sibling of Models and Characters. The route is `/admin/threed/animations`. Old `/admin/threed/model-animations` bookmarks redirect there, discarding Model selection. Related header links and the ThreeD overview now point to the independent library.

`src/components/admin/threed/animations/ThreeDAnimationsWorkspace.tsx` owns the UI. It never fetches Models or target assignments and takes no Model/Character ID. It lists paginated, searchable saved clips and exposes rename, active-state editing and protected deletion. Source file/index identity remains unchanged by editing. Built-in tracked FBX sources are independently visible and searchable even if the database library is unavailable; they remain read-only.

The approved file/clip schema and optional assignment APIs remain intact: the relations describe consumers, not parent ownership. No new schema or live database change occurred during this correction. Source upload is now available. Compatibility preview, target editors, built-in registration and runtime integration remain separate future work.

Local test checklist:

1. Expand ThreeD in the sidebar. **Animations** should appear beside **Models** and **Characters**, outside the Models submenu.
2. Click **Animations**. Confirm the title is **ThreeD Animations Library** and no Model selector or parent Model is required.
3. Search the built-in sources for `walk`; open an FBX source link. This inspects/downloads a tracked file, not a runtime preview.
4. If saved library records are available, search/page through them, edit one name/active state and refresh. Verify the source file and clip index are unchanged. A referenced clip must not be deletable. An empty or unavailable database library should leave built-in sources visible.
5. Visit an old Model Animations bookmark. Confirm it redirects to the same standalone workspace rather than selecting a Model.
6. Confirm the Models table no longer contains the newly added row-level animation shortcut.

Validation: TypeScript, offline library API checks and diff checks passed. No browser-rendering or live-database acceptance is claimed. The User retains the build gate; no build ran. Existing unrelated worktree changes were preserved.

## Textures-style upload and management checkpoint

**Admin → ThreeD → Animations → Upload Animation** now opens a file picker. No Model or Character is required. A successful upload registers all clips from the inspected source and refreshes the library. Invalid, empty, unsupported or zero-clip sources are rejected before storage. The file chooser resets after each selection, allowing the same file to be retried deliberately.

The workspace follows the compact Textures layout: sortable Name, Source, Type, Duration, Active, References and Size columns; 25/50/100/200 per page; First/Previous/Next/Last; page-local selection, clear selection and bulk delete; icon editing/deletion/source links; a stationary workspace header and scrolling table with sticky column headings. Search, sorting, pagination and refresh clear selection. Bulk deletion skips referenced rows and reports progress if a later deletion fails. Edit changes name/active state, preserving source and clip identity. Table reference counts are informational; server/FK guards remain authoritative for deletion races. Model and Character assignment controls/playback are not introduced by this checkpoint.

Manual tests in the local App:

1. Open **Admin → ThreeD → Animations**. Choose **Upload Animation** and select a standalone animated FBX or uncompressed self-contained GLB under 4 MiB. Confirm clip rows appear with duration, source filename and clip index. No Model selection should appear.
2. Upload a source containing multiple clips. Confirm separate rows share one source URL, including duplicate or unnamed clips distinguished by index.
3. Edit an animation's name/active state, refresh and confirm persistence. Click each sortable heading, change page size, and test navigation/search. Confirm the header and sidebar remain stationary while records scroll.
4. Select disposable unreferenced clips, clear selection, and test individual/bulk deletion. Source files are intentionally retained; clips with existing assignment references are protected.
5. Try a static FBX with no clips, a malformed source, an unsupported extension and an oversized file. Expect an error with no successful upload/registered rows. Source upload requires the previously approved tables to be applied; database application remains separate and has not been performed here.

Validation: `validate:threed-animation-upload` passes real Three.js parsing of the tracked Idle FBX and a synthetic two-clip GLB, external/empty/malformed rejection and mocked upload/transaction/failure cleanup. `validate:threed-animation-library`, `validate:threed-model-blob-paths`, TypeScript and diff checks passed. Storage/database mutations are mocked in validation. The User's browser acceptance and build remain manual; no build or live database/Blob operation ran during development.

## Blueprint correction — current presentation

The separate built-in catalog and implementation explanation banner were removed from the Admin workspace after the User rejected their departure from Model Textures. The tracked animation assets and existing runtime manifest are unchanged. Earlier instructions to search built-in sources on this page are superseded.

Animations now uses the same shared Table/Input components as Textures, a compact title/count/search/upload/navigation toolbar, an inline range/selection group opposite pagination, a bounded bordered records panel and persistent sticky column headings. Loading, empty and error-with-Retry states occupy table rows rather than removing the table. Rename is inline and active state has a separate toggle action, matching Textures. No Model selection is required.

Manual acceptance: compare **ThreeD → Animations** with **Models → Textures**. Check header/selection alignment, compact row heights, inline rename/toggle controls and scrolling. The table frame and headings must remain present for populated, empty, loading and failed requests. No animation-preview thumbnail is claimed.

The supplied screenshot also reports an API/library access error. This presentation correction does not resolve that error or establish whether the approved tables have been applied. No live database action was performed. TypeScript and `git diff --check` passed; browser appearance remains for User review. Existing upload/schema/API work was preserved.

## Library access diagnosis — September 12, 2026

A bounded read-only check against the database configured for local development confirmed that all four public relations are absent: `threed_animation_files`, `threed_animations`, `threed_model_animation_assignments`, and `threed_character_animation_assignments`. This establishes the pending schema application as a blocker for this environment. Retrying the library request alone cannot create those tables. No database writes were performed.

The API wrapper now returns HTTP 503 with `ANIMATION_SCHEMA_NOT_READY` for nested PostgreSQL missing-table or missing-column errors. The existing table error row displays an explicit database-setup message instead of the generic retry message. Query text and connection details remain private; unrelated errors retain their existing handling.

The approved schema still requires separate application by the User to the intended environment. The locally generated `drizzle/0017_threed_animations_library.sql` contains the four-table additions; generating it does not apply them. After application, refresh **Admin → ThreeD → Animations**, then test uploading an animated FBX/GLB and renaming/toggling a resulting clip. Library access and live uploads remain unverified until that step is complete.

Validation: offline library checks (including nested missing-table/column errors and secret redaction), TypeScript, and `git diff --check` passed. No build ran; unrelated worktree changes were preserved.

## Filename-based upload names

New uploads use the source filename without its FBX/GLB extension as the Animation display name. Multi-clip sources append ` — Clip 1`, ` — Clip 2`, etc., retaining the 255-character limit. Internal `clipName`, clip index and playback metadata remain unchanged. Existing saved names are preserved and can be renamed inline.

Validation: the upload validator passes real FBX filename naming and multi-clip GLB numbering while confirming original clip titles are retained. TypeScript and diff checks passed. No build or live writes ran. Manual check: upload `Pick Fruit.fbx` and confirm its display name is `Pick Fruit` even when its internal title is `mixamo.com`.

## Bulk animation uploads

**Admin → ThreeD → Animations → Upload Animations** accepts one or multiple files (up to 100 per batch, 4 MiB per file). The workspace sends each source sequentially through the existing authenticated inspection/upload API. Filenames still determine clip display names, and clips share their source URL. No schema changes are needed.

A compact scrollable results panel shows Queued, Uploading, green Imported with clip count, or orange Needs attention with the error. Invalid files and failed requests do not prevent later files from importing. At completion, the library refreshes on the first page with search cleared. Clear results removes only the displayed report. Results are tab-local; there is no automatic retry or persistent resume. Check the refreshed library before resubmitting an interrupted request because it may already have committed.

Validation: `node src/lib/scripts/validate-threed-animation-bulk.cjs` exercises the actual workspace upload handler with mocked React/fetch, covering multiple selection, sequential execution, invalid-file isolation, continued uploads after a network failure, status totals and the 100-file limit. TypeScript and diff checks passed; no build or live upload ran.

Manual acceptance: select two animated FBX files and a self-contained animated GLB together. Confirm per-file results, filename-based names, and all clips in the refreshed library. Include a static or malformed source in a second batch and confirm later valid files still import. Clear results and confirm saved records remain.

## Character assignment editor

The User confirmed schema application and successful library uploads, including 46 FBX files. **Admin → ThreeD → Characters → Animations** (on the desired Character row) now opens a dedicated action-mapping dialog. This is a consumer of the autonomous library, not a new parent for its files.

The form lists the existing semantic action vocabulary, searchable/paginated library choices (200 per choices page), explicit Disabled and Use defaults options, saved effective mapping/source, and per-action Save. Only active clips can be newly assigned. Existing inactive or unavailable selections remain identifiable. Assignments use Character IDs and clip IDs through the existing authenticated API; no source URL is copied and no new schema is introduced. Search paging does not silently discard drafts, failed saves retain drafts, and saved changes are read back. Refresh assignments deliberately reloads saved mappings and clears drafts.

This stage implements assignment editing only. The dialog explicitly explains that Scene playback integration is pending. Existing GardenCharacter/EcctrlCharacter playback, first-pose gating, locomotion crossfades and completion-gated world actions remain unchanged. Model assignment editing and skeleton compatibility preview are still pending.

Manual test:

1. Open **Admin → ThreeD → Characters**. In the intended Character's row, click **Animations**.
2. Select an uploaded Idle clip for **Idle** and click its **Save**. Repeat for **Walk** and **Pick fruit** using appropriate clips.
3. Close and reopen the dialog. Confirm the saved names and Character override labels persist. Confirm the library reference counts reflect these assignments.
4. Choose **Use defaults** for one action and Save; confirm its Character override is removed. Test **Disabled** separately; it remains an explicit saved setting.
5. Search animation choices and confirm existing saved selections remain visible. Scene animation changes are not an acceptance criterion for this editor stage.

Validation: `node src/lib/scripts/validate-threed-character-animation-assignments.cjs`, `npm run validate:threed-animation-library`, TypeScript and diff checks passed. The UI handler fixture mocks network and checks ID-only writes, explicit disabling, inheritance restoration and failed-draft retention. No build, live writes or browser acceptance is claimed for this step.

## Character Scene playback — current integration

This supersedes the preceding editor-only limitation. GardenCharacter and EcctrlCharacter now resolve saved library mappings while loading their Model and before their existing first-pose presentation gate. Reload the Project Scene after editing assignments; this stage does not hot-swap a running Character.

Precedence is Character override, actual rendered Model default, then existing embedded/static behavior. The assignment read response includes the owner-resolved default Model ID so Project instances using another Model can request that actual Model's defaults rather than inherit the wrong mapping. Inaccessible owner-scoped targets return no library overrides; other API errors use the existing Model-load error path rather than claiming assignment success.

Each assigned source is fetched once per Character load even when several actions use its clips. Source formats FBX and self-contained GLB are parsed, the stored clip index is selected, and a cloned clip is normalized to its semantic action name. Assigned clips override legacy metadata mappings. Disabled actions are excluded from normalized clips and guarded against legacy action-map fallback. Source files are referenced, not copied or uploaded. The original static manifest and its cache remain the path for unassigned verified Farmer actions.

Assigned clips must have tracks whose node targets exist on the Character. This is a basic binding check, not skeleton retargeting or proof that proportions/root motion are visually appropriate. Missing/inactive clips, invalid indices, inaccessible sources or incompatible targets fail through the existing Character loading-error behavior; they do not silently play a different assigned action. FBX and GLB source inspection disposes temporary meshes/materials. Existing mixers, task crossfades, one-shot completion callbacks, physics and world persistence are unchanged.

Manual local acceptance:

1. **Admin → ThreeD → Characters → Animations**: save compatible Idle, Walk and Pick fruit clips for the intended Character. Reload its Project Scene.
2. Confirm the Character appears already posed, idles, walks, and runs. Test both Garden wander and movable Character Take/Release Control with WASD.
3. Trigger Pick Fruit without a target to verify animation-only playback. Then test the established targeted action flow; world changes must occur only after completion, followed by a smooth return to locomotion.
4. Save Character position/orientation and refresh. Confirm transforms and assigned animations remain correct, including no transient bind-pose flash.
5. Restore Use defaults and reload; confirm legacy behavior. Test Disabled for a non-locomotion action and confirm that action does not execute. An explicitly disabled Idle has no idle animation to pose.
6. An intentionally incompatible clip should report a loading error rather than appear successfully mapped. Restore a compatible clip before continuing.

Validation passed: assigned-character fixture (real tracked FBX rig binding, GLB selection, shared source fetch, Character/Model precedence, disabled mapping, Project-specific Model selection and invalid/inactive/missing clip rejection), library API checks, Character restart/first-pose checks, assignment-editor fixture, 18 orchestration groups, static asset checks, TypeScript and diff checks. Requests/storage in the new fixture are mocked. Live Scene acceptance remains with the User; no build, database write or deployment was performed.

## Sidebar placement — pre-release adjustment

At the User's latest request, Animations appears under **ThreeD → Models**, alongside Files, Categories and Textures. The Models parent recognizes `/admin/threed/animations` as an active child route. Characters returns to its direct management link without an Animations submenu. This supersedes the earlier top-level and Characters submenu placements; the independent library route, schema, uploads and assignments remain unchanged. TypeScript and diff checks passed.

The User also confirmed the preceding manual Character playback checklist, including control, saved transforms and targeted Water/Pick Fruit behavior.
