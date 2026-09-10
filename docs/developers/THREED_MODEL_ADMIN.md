# ThreeD Model Administration

Current production checkpoint: **v0.19.10c — ThreeD Model Bulk Importing** (released package version `0.19.10-centaur`, commit `a618a66`). The User confirmed successful Vercel production deployment September 9, 2026. See the [release record](../releases/v0.19.10c.md).

Current candidate: **v0.19.11 — ThreeD Model Management**, package `0.19.11`. See the [scope, verification, schema compatibility and deployment handoff](../plans/v0.19.11-release.md). Historical checkpoint sections below describe behavior at their named releases.

The initial v0.19.8a workflow deliberately managed one reusable ThreeD Model at a time. The v0.19.10a alpha release adds **Bulk Import FBX** to the dedicated Models workspace; the single-Model importer remains available. See [alpha implementation and validation](../plans/v0.19.10a-implementation.md). The released beta is **v0.19.10b** (`0.19.10-beta`): **Bulk Import Models** supports mixed FBX/GLB/GLTF batches, embedded resources, external images and `.bin` files. See [beta implementation and verification](../plans/v0.19.10b-implementation.md); the User has manually accepted the local checkpoint and its build gate. Production deployment is confirmed; see the [completed handoff](../plans/v0.19.10b-release.md).

The Admin route uses `#020618` as its presentation background. Its header, sidebar, and footer are translucent layers of that same color, scoped to `/admin` so Dashboard presentation remains independent. Shared Dialog, Modal (including confirmations), dropdown/submenu and Select popup surfaces use solid very dark gray (`zinc-900`) backgrounds in dark mode across their consumers, visually separating popups from the main App. Popup surfaces, text and controls are fully opaque; existing backdrop dimming and light-mode backgrounds remain unchanged. This presentation change passed TypeScript and diff checks.

## Admin surfaces

- `/admin/threed/models` owns Model discovery, creation, editing, taxonomy, publishing state, and deletion.
- `/admin/threed/model-categories` owns the reusable Model taxonomy list and Create/Edit form.
- `/admin/threed/model-files?modelId=<id>` owns the selected Model's primary file, textures, binary buffers, and supportive media.
- A Model row's file action opens the full Model Files workspace with that Model selected. The Models table does not maintain a second attachment-management dialog.
- Both routes belong to the **Models** navigation family. Model Files keeps **Models** active in the Admin sidebar and provides a header-level **Back to Models** action.
- The Models workspace uses its compact toolbar as the semantic page header, avoiding a redundant title/description block. The row contains its item count, name/type search, and related actions: **Add Model**, **Model Categories**, **Model Animations**, then **Model Files**.
- **Bulk Import Models** is available beside **Add Model** in `/admin/threed/models` in beta (alpha: **Bulk Import FBX**). The embedded Project CRUD retains its single-Model entry point because its parent refresh unmounts child workspaces. Bulk imports create reusable Models without assigning them to a Project.
- Bulk **Batch defaults → Assign Existing Texture File** reuses an active saved Texture as Base Color for all detected material slots. Each Model can inherit the batch selection, choose another Texture, or select None. Assignments are saved and verified during import; missing named texture files remain a separate dependency check. **Resolve missing texture files later (keep inactive)** applies the selected Texture now and retains the Model for further review.

### Matching a saved Texture to an FBX requirement

When the effective batch/per-Model **Assign Existing Texture File** selection has the same filename as a required FBX image, the importer reads that active saved Texture automatically if no local file with that name was selected. Matching is case-insensitive and uses the file name, not the Texture display name. The requirement shows **Matching saved Texture — uses the shared file; no copy is uploaded**. No disk selection is needed.

The saved image is downloaded once for the current set of matching selections and enters the ordinary preparation/preview snapshot as a File. Import sends only the Model ID, Texture ID and relative dependency path to the files API. The server verifies ownership of both records and stores a lightweight Model-file reference to the original Texture URL, while retaining the Base Color assignment. No PNG upload or new Blob occurs. This deliberately preserves the saved dependency audit and runtime filename resolution; selecting a Texture does not merely waive the requirement. The reusable Texture record is unchanged.

None, inactive/unavailable Textures, different filenames and GLB/GLTF/OBJ dependencies do not gain this FBX fallback. Local files retain priority, including ambiguous choices requiring review. Downloads enforce HTTPS, a 30-second timeout, 4 MiB per file and a 32 MiB temporary preview-data limit. Read failures keep the row blocked and offer **Refresh existing Textures** or a local file. Selection changes cancel obsolete downloads; snapshots retain the reviewed bytes through import.

Validation: `validate:threed-bulk-saved-texture`, existing preparation/runner/preview validators, TypeScript and diff checks passed. An isolated browser check reproduced eight FBX rows with one matching saved PNG: one download, zero preparation writes, ready rows, verified shared-URL file references, Base Color assignments and activation after the mocked saved audit. The eight linking requests contained identifiers/path only, no file bytes. Actual-route checks with mocked database/Blob services also verified eight references to one URL with zero uploads, idempotent linking, owner/auth/path checks and deletion protection. Model Texture deletion is blocked while either material assignments or Model-file references exist; ordinary Model/file deletion does not delete library-owned Texture URLs. No existing copies were removed and no production records were changed. This fix is included in the [v0.19.11 release candidate](../plans/v0.19.11-release.md); production deployment is not yet confirmed.

### Models table and bulk deletion

The Models table shows **Selection checkbox | Name | Category | Options | Type | Status | Active | Size | Actions**. Category displays all assigned category names; Options displays Default, Public, Library, Plants and Characters independently from Name. The former Files count column is replaced by these requested fields; the per-row Manage files action remains available. All columns remain accessible through horizontal scrolling on narrow screens.

Name, Category, Options, Type, Status, Active and Size headers toggle ascending/descending sorting and expose `aria-sort`. Initial order is Name ascending with natural numeric comparison (for example, Model 2 before Model 10). Category sorts alphabetically by its displayed category-name combination (uncategorized rows use an empty value); Options sorts alphabetically by its displayed label combination; Type/Status/Active sort by displayed text. Size compares numeric bytes, with unknown sizes last in both directions. Equal values use Model ID for stable ordering.

Each row has a selection checkbox in a narrow, unlabeled column; accessible checkbox names remain available. The header checkbox selects/deselects the visible filtered rows and shows a partial-selection state. Sorting retains selection; changing the search clears it. Selection and sorting cover the currently loaded list (the existing 200-Model request), not unseen database records.

The Delete selected and Clear selection buttons use compact text and neutral outline styling. Status uses plain green text for Active, yellow for Pending, red for Maintenance, and gray for Dormant/Retired. The Active column uses a green checkmark or gray X, with accessible Active/Inactive text.

**Delete selected** confirms the count, names and IDs before sending serial requests through the existing authenticated owner-scoped Model DELETE endpoint. That endpoint retains authority over Model/file records and Blob cleanup. Controls prevent a second deletion while the batch runs. Confirmed successes leave the table and selection immediately; failed or unconfirmed rows remain for review, with individual messages and a final count. There are no automatic retries. A lost response instructs the User to refresh and verify saved state. The per-row Delete action uses the same confirmation and result handling. No database/API or import behavior changes are involved.

Validation for this table change (September 10, 2026): TypeScript and diff checks passed. An isolated Chromium check of the actual component with mocked APIs verified column order, category/option placement, all six sort toggles, numeric size/null ordering, selection and search reset, cancellation with zero writes, mixed success/failure deletion, retained failed selection, explicit retry and mobile horizontal scrolling. No live Models were deleted and no build was run. This is a development change after the released centaur checkpoint; no new release version is designated.

### Beta GLB/GLTF workflow

Choose `.fbx`, `.glb` and `.gltf` primaries with **Choose Model files**. Add external images and geometry with **Add textures / .bin files**; review each row's **File requirements** and resolve ambiguous matches. Bare buffer names default to `buffers/`, images to `textures/`. Embedded resources require no additional attachment. Each file must be at most **4 MiB**.

Batch defaults and shared files are always expanded. The selected Model's fields stay visible; one scroll area keeps the dialog header and import actions accessible. **File requirements** appears before Model configuration with a colored border and an explicit readiness status. Completed rows retain their submitted configuration as disabled fields beside the result.

The first-use defaults are scale **1.0**, Library Item on, Public/Plants/Characters/Active after import off, no categories, and no existing Texture override. Valid batch preferences are remembered per signed-in User in this browser; **Reset defaults** restores those starting values. Batch and per-Model scale shortcuts offer **1%**, **2%**, and **100%**, alongside a custom scale. Per-Model overrides stay independent. Removed category/Texture selections remain visible and must be corrected. Files and queued Models are not saved in browser preferences.

The **Model preview** panel sits directly beneath **Queued Models** in the left column. Choose **Preview Model** to render there on demand, then **Refresh preview** after changing settings. Closing the preview, switching Models or closing the importer releases the inline viewer. **Open preview window** beside the selected filename retains the authenticated separate-window option. It renders the local FBX/GLB/GLTF and selected companion files with the effective scale, rotation, offsets, original materials, and optional saved Base Color Texture. Drag to orbit, scroll to zoom, or reset the view; the grid represents one scene unit. Change importer settings and choose **Open preview window** again to refresh that window. Missing binary geometry produces an error; missing images are labeled and shown with placeholders. Previewing uploads nothing. **Choose thumbnail image** remains a separate optional image for the saved Model.

The **Model textures** summary beneath the selected GLB/GLTF filename counts embedded texture images separately from geometry. It distinguishes images included in the primary file, images stored in required external `.bin` files, and separate texture files. A self-contained Model explicitly reports that no additional texture or binary files are needed. **None — keep original materials and textures** preserves the authored appearance; choosing an existing Texture replaces Base Color across all material slots while retaining other authored maps. The summary reflects the effective batch or per-Model choice before importing.

For GLB/GLTF, PNG, JPEG and static WebP images, embedded/data resources and locally decoded DRACO geometry are supported. The original material configuration remains when **Assign Existing Texture File** is None. Before upload, the selected bundle is loaded locally to check resource decoding and discover the default scene's material slots. A malformed bundle or missing binary buffer blocks its row, including when texture deferral is selected. Missing images may be explicitly deferred inactive. Unsupported extensions and nonlocal dependency URLs produce an actionable row error. See the [beta resource limits and manual checks](../plans/v0.19.10b-implementation.md).

### Released centaur OBJ/MTL workflow

Released package `0.19.10-centaur` adds `.obj` to **Choose Model files** and `.mtl` to **Add MTL / textures / .bin files**. Use this workflow for one OBJ or a mixed batch. Selecting a declared material library discovers its image maps in the highlighted **File requirements** section. Bare `.mtl` names default to `materials/`; bare image names default to `textures/`. MTL records use the existing `other` file type and cannot become thumbnails.

Every declared MTL must be supplied and unambiguous. Missing images may be deferred inactive; an existing Base Color Texture does not replace the need for an MTL library. **None** retains the authored MTL appearance. OBJ previews work beneath Queued Models and in the optional separate window, using the same material loader as saved Models.

**Add Model** preserves the staged-primary workflow: upload an OBJ to preview geometry, create the Model, then open **Model Files** and attach the required MTL libraries followed by their images. The staged preview explicitly omits unavailable materials. Model Files exposes OBJ material slots and the existing Texture assignment controls. To see the complete bundle before any upload, use **Bulk Import Models**, including for a single OBJ.

The tested subset includes ordinary OBJ polygons, lines/points, negative indices, vertex colors, multiple named materials, and MTL diffuse/specular/emissive/alpha/bump/normal/displacement maps. Texture images support PNG, JPEG, static WebP and BMP. Required MTL and unsupported map errors are explicit. OBJ/MTL use local relative references; external URLs, paths outside the bundle, curves/free-form surfaces and unsupported MTL extensions are not supported. Bulk files remain limited to 4 MiB each; the OBJ loader bounds bundle bytes and decoded geometry to 32 MiB each. See the [complete limits, evidence and remaining manual checks](../plans/v0.19.10c.md). Production deployment of centaur is User-confirmed.

## New-upload storage organization

New uploads now use `threed/users/<userId>/` with readable Model asset folders, separate `primary`/`attachments` sections, and shared `textures` and `previews` folders. Original filenames and logical attachment paths remain authoritative for dependency matching. Reusable Texture references still use one stored file. Existing URLs continue to work and have not been migrated. See the [layout, compatibility checks and backup/migration follow-up](../plans/threed-model-blob-layout.md).

## Authority boundaries

- `threed_models` remains the reusable Model record authority.
- `threed_model_files` remains the attached-file record authority.
- Vercel Blob stores file bytes; authenticated owner-scoped App API routes coordinate records and stored objects.
- Model categories remain relational taxonomy. File names, vendor names, and derived name fragments must not become runtime field names or protocol constants.
- This boundary introduces no database schema change and does not alter Dashboard Scene placement, Runtime Marker, Character, or Rapier ownership.

## 0.19.8-beta Model attachment directories

The Model Files workspace provides a required **Attachment directory** text field with a 100-character limit. It is an App-managed relative dependency directory, not a local filesystem folder selector. Files cannot be selected or dropped until this directory is valid. The directory applies to each file in the next upload selection. For example, entering `textures/walls` and selecting `base-color.png` persists `textures/walls/base-color.png`.

The released legacy attachment layout uses `models/<modelId>/attachments/<relativePath>`. The browser submits each attachment's computed relative path through the existing owner-scoped Model Files API. The server normalizes separators, rejects absolute and parent-traversal paths, enforces the directory limit, and prevents case-insensitive relative-path conflicts for a Model. `threed_model_files.relative_path` remains authoritative for the User-defined portion of the stored object key. Existing attachment URLs remain valid and are not migrated.

Persisted relative paths appear in both Model Files list and grid views and participate in workspace search. This makes User directory intent durable, inspectable, and available to the runtime dependency resolver.

The Model Files dependency audit reads the selected primary FBX, GLB, GLTF or OBJ and reports every discoverable external texture, material library or buffer reference as **Attached** or **Missing**. Exact relative paths take precedence. A filename fallback is accepted only when that filename is unique among the Model attachments, supporting FBX exports that retain exporter-workstation paths without guessing between duplicate texture names.

`ModelMarker3D` resolves FBX/GLTF/GLB dependencies through a Model-owned Three.js `LoadingManager`. OBJ uses the shared bounded OBJ/MTL loader, resolving libraries and images only to selected attachment URLs and rejecting ambiguous matches. The resolver is scoped to reusable Model markers and does not alter GardenCharacter, EcctrlCharacter, external animation, or Rapier ownership.

### Attachment-directory verification

1. Open `/admin/threed/model-files?modelId=<id>` for a disposable Model.
2. Enter `textures/walls` in **Attachment directory** and select `albedo.png` with **Choose Files**.
3. Confirm upload progress and the resulting file card show `textures/walls/albedo.png`.
4. Confirm the stored Blob URL follows the current owner/asset/revision layout, while the logical relative path remains `textures/walls/albedo.png`. Legacy attachment URLs remain valid.
5. Search for `textures/walls` and confirm the attachment remains visible.
6. Try attaching the same relative path again and confirm the API reports the existing-path conflict without replacing the prior attachment.
7. Clear **Attachment directory** and confirm file selection and drag/drop upload remain blocked.
8. Confirm **Required Model dependencies** identifies the primary Model's external texture or buffer references.
9. Attach a missing dependency and confirm the audit changes from **Missing** to **Attached**.
10. Refresh a Dashboard Project containing the Model and confirm its materials use the attached textures instead of rendering as an untextured black silhouette.

## Planned progression

1. Establish a clear manual Model workspace and one full attached-file workspace.
2. Extract one reusable, validated Model editor for create and edit operations.
3. Make primary-file upload and Model creation a recoverable, synchronized operation.
4. Reconcile primary-file selection, attachment counters, and Blob deletion during file and Model deletion.
5. Complete manual CRUD verification and prepare the v0.19.8a release documentation.

Stage 2 separates the shared editor from CRUD orchestration. `ThreeDModelEditorFields.tsx` owns the reusable Create/Edit field presentation, while `model-admin-form-core.ts` owns defaults, JSON parsing, numeric conversion, and validation messages. `ThreeDModelsCRUD.tsx` retains list state, uploads, authenticated API requests, and mutation completion.

## Stage 1 verification

1. Open `/admin/threed/models` and confirm **Add Model** is the primary creation action and no Bulk Import action is presented.
2. Search for a Model by name or type and confirm the current table filtering remains intact.
3. Select the file action for a Model and confirm `/admin/threed/model-files?modelId=<id>` opens with that exact Model selected.
4. Upload, inspect, set primary, and delete a disposable attachment from the dedicated Model Files workspace.
5. Return to Models and confirm create, edit, taxonomy, status, and delete actions remain available.

## Stage 2 form-contract verification

1. Begin creating a Model and submit malformed Metadata JSON. Confirm the form reports **Metadata contains invalid JSON** and sends no create request.
2. Enter an object instead of an array for Animations. Confirm the form reports **Animations must be a JSON array**.
3. Enter an invalid or negative Scale. Confirm the form reports the Scale validation problem.
4. Correct the fields and confirm the Model can be created normally.
5. Repeat one invalid JSON check while editing an existing Model and confirm the same field-specific behavior.

## Stage 3 upload analysis

The manual primary-file upload route analyzes supported Model structure before committing a new Blob. FBX, GLB, and GLTF uploads use the same bounded geometry-inspection services as the runtime inspection API. OBJ and USDZ remain valid uploads but report that server-side structural analysis is not yet available. The centaur OBJ bulk workflow independently validates the local geometry/material bundle before calling this unchanged upload API.

The upload response provides configuration guidance rather than new authority:

- a suggested display name derived generically from the source filename;
- mesh, triangle, skinned-mesh, invalid-mesh, and source-component counts;
- the existing geometry readiness classification and bounded reasons;
- no inferred vendor, library, Character, Environment, or runtime-adapter assignment.

Malformed inspectable files fail analysis before Blob storage. A successful analysis appears in the Create/Edit form, while the User remains responsible for Model naming, taxonomy, publishing flags, transform, runtime role, and final creation.

When the User selects **Create Model**, the analyzed primary upload is submitted as a bounded pending-file description. The owner-scoped Model route verifies that its URL, type, and byte count exactly match the Model configuration, then creates the `threed_models` row, its `threed_model_files` primary attachment, and the `mainModelFileId` relationship in one database transaction. A database failure cannot leave a partially connected Model record. Cleanup of a staged Blob abandoned before Model creation remains a separate lifecycle boundary.

Saving an analyzed replacement from Edit follows the same contract: the replacement attachment and primary-file assignment commit together. The previous attachment remains available until the User explicitly removes it from Model Files, providing a recoverable replacement workflow.

### Manual verification

1. Select a valid FBX, GLB, or GLTF primary file and confirm the upload result says **Model analyzed and ready to configure**.
2. Confirm Meshes, Triangles, Components, and Geometry values appear without creating the Model automatically.
3. Confirm an empty Model name is suggested from the filename, while an existing User-entered name is preserved.
4. Upload a malformed file with an inspectable extension and confirm no successful Blob upload is reported.
5. Confirm the User can finish the remaining configuration and explicitly select **Create Model**.

### Staged primary-file cleanup

An analyzed primary Model file remains staged until Create or Edit is saved. Closing the editor or selecting a different primary file requests deletion of the previous staged Blob. Cleanup is limited to an authenticated User's new ThreeD primary-upload paths or legacy `models/<user-id>/upload/` paths and accepts only the supported Model extensions.

Before deletion, the server checks committed `threed_model_files.file_path` references. Model runtime URLs are derived from these records. A committed file is never eligible for staged cleanup. A save in progress prevents the controlled editor from closing, avoiding a create-versus-cleanup race.

1. Upload a disposable Model file, close the form without saving, and confirm no Model record is created.
2. Upload one disposable file and then select another. Confirm the second file is analyzed and remains selected.
3. Create a Model from an analyzed upload, close the completed workflow, and confirm its primary file remains available in Model Files.
4. Edit a Model, upload a replacement, cancel, and confirm the existing saved Model file remains unchanged.
5. Open the created Model's file workspace and confirm the uploaded source appears as its primary Model file without uploading it a second time.

## Stage 4 attachment integrity

The authenticated server routes now maintain one consistent attachment contract. Setting a primary Model file validates that the attachment belongs to the selected Model and owner, then updates `mainModelFileId` and consistent `modelType`. Response `filePath` and `fileSize` are derived from the assigned File. Every attachment upload or deletion recalculates `textureCount` and `hasExternalFiles` from the complete persisted attachment set.

Deleting the assigned primary attachment is refused, even when other Model files exist. The User must explicitly assign a replacement first. Database records and derived Model metadata change in one transaction, then the detached Blob is removed.

Deleting a complete Model transactionally removes its attachment records and Model record before Blob cleanup. Cleanup accepts only verified Vercel Blob URLs in that User or Model's expected storage paths, deduplicates URLs, and retains a Blob if any remaining Model or attachment record still references it. External URLs are never deleted by these routes.

### Manual verification

1. Upload a second Model file, set it as primary, and confirm the primary badge moves. Return to Models and confirm its runtime file URL, byte size, and type match the selected attachment.
2. Add two disposable textures, delete one, and confirm the texture total equals the remaining texture records rather than merely decrementing stale metadata.
3. Delete the active primary while another Model attachment remains. Confirm deletion is refused until another Model file is explicitly assigned as primary.
4. Attempt to delete the only primary Model attachment. Confirm the App refuses the operation and instructs the User to upload a replacement.
5. Delete a non-primary disposable attachment. Confirm its record disappears and an owned, unshared Vercel Blob is cleaned up without changing the primary runtime file.
6. Delete a disposable complete Model and confirm its Model and attachment records disappear. Confirm external URLs and URLs still referenced by another record are retained.

## Production boundary

The v0.19.8a production release includes the manually approved one-at-a-time Model workspace, shared Create/Edit configuration form, pre-storage structural analysis, transactional primary-file creation and replacement, recoverable staged-upload cleanup, and attachment integrity rules described above.

Bulk Model import remains intentionally outside this release. v0.19.8a introduced no schema change and made no change to Dashboard Scene rendering, Project Marker placement, Character runtimes, Rapier physics, or Model Runtime Adapter authority.

The v0.19.8b production release continues this work through the Models-family workspace and texture-dependency boundary documented below.

## v0.19.8b production checkpoint

Release title: **ThreeD Model Administration, Model File Management, Model Workspaces, Model Texture Dependencies**.

This checkpoint includes:

- consistent compact workspace headers and navigation across Models, Model Categories, Model Animations, and Model Files;
- URL-based selected-Model continuity between the Model Files and Model Animations workspaces;
- a dedicated Model Categories page in place of the former Models-page dialog;
- a required, validated Attachment directory that defines the User-managed relative dependency namespace for new Model attachments;
- stable Vercel Blob attachment keys under `models/<modelId>/attachments/<relativePath>` without migrating existing stored objects;
- owner-scoped inspection of external texture and buffer references discovered in the selected primary Model file;
- **Attached** and **Missing** requirement states using exact relative-path matching and a safe unique-filename fallback;
- Model-owned runtime dependency URL resolution for FBX, GLTF, GLB, and OBJ markers.

The runtime resolver is deliberately limited to reusable Models. It does not modify GardenCharacter or EcctrlCharacter loading, external Character animations, Runtime Marker identity, Project placement persistence, or Rapier physics. The candidate introduces no database schema change and does not expose bulk Model import.

The next isolated stage is a requirement-level **Upload Needed File** action that preselects the missing dependency path. It is intentionally not part of this checkpoint; attachments continue to use the verified required-directory upload workflow.

Release validation:

- `npm run typecheck`
- `git diff --check`
- targeted resolver checks for exact relative paths, unique filename fallback, and ambiguous filename rejection
- manual release verification using the Models workspace, attachment-directory, dependency-status, and Dashboard loading checklist above

Release preparation validation:

- `npm run typecheck`
- `git diff --check`
- User-confirmed manual completion of Stages 1–4
- User-confirmed successful production build and deployment

## 0.19.8-beta development

### Stage 1: Models workspace navigation

- `/admin/threed/models`, `/admin/threed/model-files`, and `/admin/threed/model-animations` are one Admin sidebar navigation family.
- Model Files and Model Animations provide direct return navigation to Models and direct navigation to each other.
- When a Model is selected, both supporting pages store its ID in `?modelId=<id>` and carry that selection to the other supporting page.
- Models remains the reusable-asset workspace; Model Files and Model Animations retain their separate attachment and semantic animation-mapping responsibilities.
- This stage changes presentation and route state only. It does not change Model CRUD, attachment persistence, Blob lifecycle, animation metadata, Dashboard rendering, or runtime behavior.

Manual verification:

1. Open Model Files and confirm **Models** remains active in the Admin sidebar.
2. Select a Model and confirm the URL updates with its numeric `modelId` without reloading the page.
3. Open Model Animations from Model Files and confirm the same Model is selected.
4. Select a different Model in Model Animations, return to Model Files, and confirm the new selection is preserved.
5. Use **Back to Models** from both supporting pages and confirm the primary Models workspace opens.

### Stage 2: compact Admin workspace header

`AdminWorkspaceHeader` establishes the first reusable Admin-page presentation primitive. It provides a compact semantic heading, icon, visually hidden description, responsive action area, and consistent lower border without prescribing any page's data or mutation behavior.

The Models workspace supplies count, search, and actions to this header. Model Files and Model Animations use the same header for compact cross-workspace navigation. This removes their oversized title/description blocks while preserving an accessible H1 and description in the document structure.

The component is deliberately presentation-only. It does not fetch, select Models, mutate records, manage URL state, upload files, map animations, or own loading and error behavior. Those responsibilities remain with each page and will be addressed separately in later beta stages.

Manual verification:

1. Open all three Models-family pages and confirm their heading height and lower border are visually consistent.
2. Confirm Models retains its count, inline search, and four ordered actions.
3. Confirm Model Files and Model Animations retain their compact navigation actions.
4. Narrow the Admin content area and confirm header content wraps without horizontal clipping.
5. Confirm each page exposes exactly one semantic H1 to assistive technology.

### Stage 2 extension: Model Categories workspace

Model Categories now uses `/admin/threed/model-categories` instead of a Models-page dialog. The existing owner-scoped category API, taxonomy records, parent selection, sorting, activation, and deletion behavior are unchanged; only presentation ownership moved from modal state to a durable route.

The Models toolbar links to the new page, and Model Categories participates in the Models sidebar route family. Its compact header provides return navigation plus links to Model Animations and Model Files. `AdminWorkspaceLink` centralizes the related-page link presentation alongside `AdminWorkspaceHeader`.

Manual verification:

1. Select **Model Categories** from the Models toolbar and confirm a full page opens without a dialog overlay.
2. Confirm **Models** remains active in the Admin sidebar.
3. Create, edit, activate/deactivate, parent, and delete a disposable category using the existing category API behavior.
4. Use the compact header to return to Models and to open Model Animations or Model Files.
5. Return to Models and confirm category assignments in Create/Edit reflect the latest taxonomy.

### Stage 3: dependency-directed upload and available-assets preview

The Model Files workspace turns each missing dependency into an explicit **Upload needed file** action. Each discovered requirement opens a single-file chooser for the expected filename, derives the requirement's directory and file category, and submits through the existing authenticated Model Files route. A mismatched filename is refused before upload. Requirements without an exported directory use the bounded `dependencies` directory and continue to resolve through the released unique-filename fallback.

The texture importer remains part of `/admin/threed/model-files?modelId=<id>` and is never presented as a modal overlay. On wide screens, a compact sticky Model Importer Canvas occupies the left side while dependency status, attachment destination, and the drop target form one right-side working surface. Texture management remains available when inspection reports zero named requirements, because some FBX exports do not retain discoverable external filenames. Supportive files may be attached at any time without preventing the reusable Model record from remaining manageable.

The primary workspace emphasizes the existing Model preview, Texture assignment, and Model files. Search, sorting, view controls, upload, attachment records, and attachment actions remain visible in the consolidated **Model files and attachments** section. New selections default to the stable Model-owned `textures` directory. The User can inspect or change that destination through its disclosure, but does not have to invent a path before performing the normal texture upload.

FBX inspection retains absolute exporter references safely by extracting their required filename. For example, a source reference such as `C:\\vendor\\barn\\textures\\Barn_Wall.png` becomes the visible requirement `Barn_Wall.png`; the uploaded object is stored under `models/<modelId>/attachments/textures/Barn_Wall.png`, and the runtime's unique-filename fallback resolves the original workstation path without reproducing it in Blob storage.

The same workspace presents an interactive **Model preview** using the selected primary Model file and every attachment currently available to that Model. It reuses `ModelMarker3D` and its Model-owned `LoadingManager` resolver, so Admin preview and Dashboard runtime exercise one attachment-resolution contract. The preview supplies only lights, a reference grid, fitted camera bounds, and orbit controls; it creates no Rapier world, Project Marker, or persisted transform.

After an upload, deletion, or primary-file change, the workspace refreshes the file records, dependency audit, and preview inputs. Missing attachments may still be supplied later; the preview deliberately shows the best currently resolvable version of the Model rather than blocking all presentation until the dependency set is complete.

Manual verification:

1. Select a Model with one or more missing texture dependencies and confirm the preview appears using its currently available assets.
2. Select **Upload needed file** for one requirement and confirm the chooser accepts one file with the displayed filename.
3. Use the consolidated attachment drop target and confirm the upload remains inline without opening a popup.
4. At desktop width, confirm the Canvas remains visible on the left while the upload workflow is used on the right.
5. Confirm the normal workflow defaults to the Model-owned `textures` destination and the **Model files and attachments** controls are visible without another disclosure.
6. Choose a differently named file and confirm the App refuses it before upload.
7. Choose the correct file and confirm its resulting Blob path uses the automatically selected Model-owned directory.
8. Confirm the dependency changes from **Missing** to **Attached** and the preview reloads with the newly available asset.
9. Orbit and zoom the preview, then use **Reset preview camera** and confirm the Model is fitted again.
10. Delete the test attachment and confirm the dependency audit and available-assets preview both refresh.
11. Confirm no Project Marker, Character runtime, or Rapier behavior changes while using the Admin preview.

### Stage 4: Canvas-first Model importer

**Add Model** now opens an **Import New Model** workspace instead of a narrow form-only dialog. The primary Importer Canvas occupies the larger left surface, while the existing validated Model editor remains independently scrollable on the right. Uploading a staged primary Model file renders it immediately before the reusable Model record is created. Changes to scale, Y rotation, and X/Y/Z offsets feed the same preview so the User can judge the configured result before submitting.

The importer reuses the attachment-aware Model rendering component but creates no Project Marker and no Rapier world. Its primary-file staging and final **Create Model** transaction remain the existing owner-scoped contracts. The create action remains unavailable until a primary file path exists or finishes uploading.

Structural statistics no longer dominate the import workflow. A successful upload presents one readiness confirmation; mesh, triangle, component, geometry, skinned-mesh, and reason details remain available under the collapsed **Technical analysis** disclosure.

This first importer stage supports the primary Model file and existing Library preview-image form upload. Staging supportive textures before the Model has an authoritative ID remains the next controlled transaction boundary; the released post-creation Model Files workflow remains available in the meantime.

Manual verification:

1. Open `/admin/threed/models`, select **Add Model**, and confirm the large Importer Canvas appears beside the configuration form.
2. Upload a valid FBX, GLB, GLTF, or OBJ and confirm it renders before selecting **Create Model**.
3. Change scale, Y rotation, and each offset and confirm the Canvas reflects those changes without closing the importer.
4. Orbit and zoom the Model, then reset the preview camera.
5. Confirm structural counts are hidden until **Technical analysis** is expanded.
6. Close the importer without creating and confirm the existing staged-primary cleanup behavior remains intact.
7. Complete one disposable import and confirm its transactional primary-file record remains available in Model Files.

### Stage 5: reusable ThreeD Model Textures and material assignments

The Admin sidebar exposes the Models family as a three-level hierarchy:
**ThreeD → Models → Models | Files | Animations | Categories | Textures**. The
Models parent remains active throughout the family, while the exact workspace child
receives its own active state. These links are direct routes and do not depend on
opening the Models page toolbar first.

The approved relational boundary separates a reusable Model Texture from a Model-owned
attachment. `threed_model_textures` owns one User's master image asset and Blob URL;
`threed_model_material_assignments` maps a stable Model material target and channel
to that Texture. A single Texture can therefore serve every material slot on one
Model and can also be reused by many Models without duplicate uploads.

Assignments are unique by Model, stable target key, and material channel. Deleting
a Model removes only its assignments. Deleting an assigned Texture is restricted,
so the App must first show its usage and require deliberate reassignment or removal.
Both tables are owner-scoped, and API operations must verify that the Model,
Texture, assignment, and authenticated User share that owner.

The initial channel remains `baseColor`, matching the current FBX Material
Assignment Inspector. The varchar channel field deliberately leaves a bounded
extension point for normal, roughness, metallic, emissive, and occlusion maps after
their rendering behavior is separately implemented and verified.

Transition rule: existing `metadata.materialOverrides` remain a runtime fallback
until the ThreeD Model Textures API, relational assignment API, Admin picker, and runtime
read path are complete. Introducing the tables must not invalidate already saved
Model material assignments.

Initial schema review:

- the generated proposal creates only `threed_model_textures` and
  `threed_model_material_assignments`;
- it adds their owner, Model, Texture, lookup, and uniqueness indexes;
- Model deletion cascades its assignment rows;
- Texture deletion is restricted while an assignment references it;
- it contains no drop, rename, truncation, or alteration of an existing table.

Before feature verification, the approved name was refined from ThreeD Textures to
ThreeD Model Textures. The follow-up migration renames `threed_textures` to
`threed_model_textures` in place, preserving its rows and IDs. It replaces only the
old table-named foreign-key constraints and indexes with equivalent
`threed_model_textures` names. It does not drop a table, column, assignment, Blob
reference, or Texture record.

The repository ignores generated `/drizzle` artifacts and uses the controlled
`db:push` workflow. Apply the reviewed additive schema only to the intended
development database before exercising ThreeD Model Textures routes or UI.

The first working vertical slice adds the authenticated
`/api/threed/model-textures` reusable Model Texture endpoint and the dedicated
`/admin/threed/model-textures` CRUD workspace. Uploads are stored once under the
User-owned `textures/<userId>/` Blob namespace. The workspace supports search,
rename, activation, assignment-usage visibility, and deletion only while unused.

Master Texture creation belongs exclusively to this workspace. The Model Files
workspace consumes the library through **Select Existing Model Texture**; it does
not create reusable master records. Model-owned dependency attachments remain a
separate workflow because they satisfy filenames embedded in FBX, OBJ/MTL, or GLTF
assets. The FBX Texture Assignment Inspector can persist a selected existing Model
Texture to one material slot or every bounded visible slot in one action.

Relational assignments are returned with Model API records. `ModelMarker3D` applies
them before the legacy metadata mirror and uses that mirror only for target keys
that do not yet have a relational assignment. This establishes a refresh-safe
transition for Admin preview and Dashboard runtime without requiring existing
Models to be migrated in one destructive operation.

For a newly imported FBX, Model Files presents **Assign Existing Texture** as the
default next action as soon as material slots are detected. The User selects one
active ThreeD Model Texture and the App assigns it to every bounded detected slot
in one transaction. Mesh counts, unavailable-map counts, temporary local testing,
and individual slot assignment remain under **Advanced per-slot Texture
assignments**. If the User has not created a master Texture yet, the same primary
surface links directly to the dedicated Model Textures workspace.

The Model Files presentation uses its `?modelId=` route as the selected-Model
authority and no longer repeats a Model selector above the Canvas. A compact Model
identity strip retains the name, type, ID, and Refresh action. Duplicate Texture
upload buttons were removed from the Canvas and dependency guidance. Dependency
status, attachment destination, and the compact drop target share one right-hand
surface. The single general **Upload files** action belongs to the always-visible
**Model files and attachments** section because primary files, attachments, paths,
and cleanup are core workspace responsibilities rather than optional diagnostics.
The bounded Canvas height keeps file records within the initial desktop working area.

Manual verification for the completed feature boundary:

1. Open `/admin/threed/model-textures`, upload one master Texture, and confirm it appears once in the User's ThreeD Model Textures library.
2. Open Model Files, use **Select Existing Model Texture**, and assign it to all seven slots of a test FBX in one action.
3. Refresh the Model Importer and confirm all seven selections and the Canvas preview remain textured.
4. Assign the same Texture to a second Model without uploading another Blob.
5. Confirm usage reports both Models and prevents accidental deletion of the assigned Texture.
6. Load both Models in the Dashboard and confirm the saved Texture resolves without changing marker, collider, or Character runtime behavior.

## v0.19.8c production checkpoint

Release title: **ThreeD Model Importer and Reusable Texture Assignments**.

This checkpoint advances the one-at-a-time Model workflow from attachment discovery to a complete visual configuration surface:

- adds the Canvas-first Model importer with live primary-file preview and transform feedback;
- establishes the dedicated **Model Textures** Admin workspace for reusable, owner-scoped master Texture assets;
- persists refresh-safe Model material assignments while retaining legacy metadata as a compatibility fallback;
- supports assigning one existing Texture to every bounded FBX material slot in one transaction;
- applies saved relational assignments in both the Admin preview and Dashboard Model runtime;
- keeps dependency-directed uploads and Model-owned file attachments available for formats that reference external filenames;
- exposes Models, Files, Animations, Categories, and Textures as direct third-level Admin navigation;
- consolidates Model Files into a compact two-column workspace with the selected Model in the Canvas header, dependency/upload controls above Texture assignment, and always-visible file management.

The approved schema adds `threed_model_textures` as reusable Texture authority and `threed_model_material_assignments` as the Model/material-slot/channel mapping authority. Model-owned files remain in `threed_model_files`; reusable Texture records do not replace external dependency attachments. Vercel Blob remains file-byte storage behind authenticated owner-scoped routes.

Release boundaries:

- bulk Model import remains deferred;
- PSD files remain authoring sources rather than browser runtime textures;
- the initial persisted Texture channel is `baseColor`;
- the Admin preview creates no Project Marker or Rapier world;
- GardenCharacter, EcctrlCharacter, Runtime Marker identity, Project placement persistence, and physics authority are unchanged;
- no MQTT publishing, FarmBot command, or physical-device capability is introduced.

Release preparation validation:

- `npm run typecheck`
- `git diff --check`
- User-confirmed Model Files layout and workflow verification
- development schema generated and pushed successfully by the User

Production gate:

1. Run the manual production build.
2. Deploy through the established GitHub/Vercel workflow.
3. Open Models and import one primary Model file.
4. Open Model Textures and confirm an existing reusable Texture is selectable.
5. Open Model Files, assign that Texture to all detected FBX slots, refresh, and confirm the assignment and Canvas appearance persist.
6. Load the configured Model in a Dashboard Project and confirm its Texture resolves without a marker, collider, Character, or Scene regression.
7. Production deployment and the configured FBX Model Files workspace were confirmed September 7, 2026.

The subsequent table presentation refinement passed TypeScript and diff checks; sorting and deletion behavior are unchanged.

## Primary-file relationship cleanup (unreleased)

Models select their primary File through `main_model_file_id`; Model Files owns URL and size. APIs derive these values for renderers. The User approved a schema-only change without preserving old file references. Use the normal `bun db:generate` / `bun db:push` workflow; no backfill or custom triggers are required. Existing Models without a valid assignment remain unresolved. The User confirmed successful `bun db:push` with terminal output showing the primary FK/index addition and redundant-column removal. See the [current scope and implementation](../plans/threed-model-primary-file-authority.md).

The Models table includes a far-right External Link icon that opens the resolved primary File URL in a new tab. When the URL is absent or is not HTTP(S), the icon is dimmed and disabled. This reflects the assigned URL; it does not probe Blob existence. TypeScript and diff checks passed for this UI addition.

For an owner's saved FBX preview, an unmatched texture filename can resolve to a unique active Texture library record's existing URL. Attached texture files take precedence; duplicate saved filenames remain unresolved. The single-Model response supplies these candidates only to its owner, and other Model formats are unchanged. This is read-only resolution: no PNG is copied, no Model File or material assignment is created, and dependency audit/activation requirements are not marked satisfied by this fallback. A Texture with no usable stored URL cannot resolve. TypeScript, saved Texture checks and an actual URL-resolver check passed.

The Model Files form distinguishes **Saved reference**, **Shared Texture available — preview only until linked**, and **Missing** dependencies. A matching shared FBX Texture offers **Link shared Texture**, which saves a Model File reference to the existing Texture URL through the authenticated files API and refreshes the dependency audit. It does not upload or copy the image. Only unresolved requirements offer **Upload needed file**. Requirement rows use the full panel width and wrap filenames so their names and actions remain readable. The summary counts saved references separately from preview availability.

Validation for this form change: TypeScript, `validate:threed-bulk-saved-texture`, `validate:threed-model-bulk-runner` (34 groups), and diff checks passed. Visual browser verification remains manual; no production build or database operation was run.

## Default fallback shapes for inaccessible Models

The generic Model viewer offers a **Default Fallback Shape** choice in the Model editor: Sphere (default), Box / Block, Rectangle, Cylinder, Pyramid or Torus. The Sphere uses 45% opacity, disables depth writes and casts no opaque shadow; explicitly chosen other shapes retain their solid material. Missing or invalid preferences default to Sphere. The choice is stored as `metadata.fallbackShape`; unrelated metadata is preserved and malformed metadata JSON must be corrected before changing the selection. No schema change is needed.

The generic fallback is one unit high, grounded at the marker origin and independent of imported asset scale. Previously its half-unit box was centered below the origin and inherited tiny FBX scales, making it difficult to see. Fallback shapes display no floating name or error label. Selecting the marker opens its ordinary DetailsCard, where missing primary files or observed generic Model load failures show a warning and a **Manage Model Files** link. Transient failure reports are keyed by reusable Model ID and URL and removed when the reporting visual recovers or unmounts; they are never stored in Project snapshots. Caller-supplied fallbacks retain priority and their original scale. GardenCharacter and EcctrlCharacter cylinders, procedural Plants and other Sub-Module fallbacks are unchanged. The placeholder is visual only; it does not substitute collision geometry for an unavailable Model.

Project asset hydration derives the current fallback preference from the reusable Model, independently of old snapshot metadata. Generic Model position updates also refresh that preference. After changing the setting in Admin, reload the Project to read it.

Validation: TypeScript, Library placement/readiness checks plus six-shape metadata-preservation and stale-preference cases, Runtime Marker checks, and diff checks passed. No production build or database operation was run by the agent. Manual checks remain: choose each shape on a generic Model, test an empty primary and a failed file URL, verify a small import scale still produces a visible grounded placeholder, confirm a repaired Model replaces the placeholder, and confirm Character cylinders and module-specific fallbacks remain as before.

DetailsCard warning validation: TypeScript, Library placement checks and failure-report lifecycle cases passed. Manual verification remains: select a missing-file placeholder, select a failed-load placeholder, follow the repair link, and confirm the shape itself has no floating text. No build was run.
