# ThreeD Model Administration

Production checkpoint: **v0.19.8b — ThreeD Model Administration, Model File Management, Model Workspaces, Model Texture Dependencies** (`package.json` version `0.19.8-beta`), released September 6, 2026.

The initial v0.19.8a workflow deliberately manages one reusable ThreeD Model at a time. Bulk import remains implemented for future work, but it is not exposed from the primary Model administration surface during this development boundary.

The Admin route uses `#020618` as its presentation background. Its header, sidebar, and footer are translucent layers of that same color, scoped to `/admin` so Dashboard presentation remains independent.

## Admin surfaces

- `/admin/threed/models` owns Model discovery, creation, editing, taxonomy, publishing state, and deletion.
- `/admin/threed/model-categories` owns the reusable Model taxonomy list and Create/Edit form.
- `/admin/threed/model-files?modelId=<id>` owns the selected Model's primary file, textures, binary buffers, and supportive media.
- A Model row's file action opens the full Model Files workspace with that Model selected. The Models table does not maintain a second attachment-management dialog.
- Both routes belong to the **Models** navigation family. Model Files keeps **Models** active in the Admin sidebar and provides a header-level **Back to Models** action.
- The Models workspace uses its compact toolbar as the semantic page header, avoiding a redundant title/description block. The row contains its item count, name/type search, and related actions: **Add Model**, **Model Categories**, **Model Animations**, then **Model Files**.

## Authority boundaries

- `threed_models` remains the reusable Model record authority.
- `threed_model_files` remains the attached-file record authority.
- Vercel Blob stores file bytes; authenticated owner-scoped App API routes coordinate records and stored objects.
- Model categories remain relational taxonomy. File names, vendor names, and derived name fragments must not become runtime field names or protocol constants.
- This boundary introduces no database schema change and does not alter Dashboard Scene placement, Runtime Marker, Character, or Rapier ownership.

## 0.19.8-beta Model attachment directories

The Model Files workspace provides a required **Attachment directory** text field with a 100-character limit. It is an App-managed relative dependency directory, not a local filesystem folder selector. Files cannot be selected or dropped until this directory is valid. The directory applies to each file in the next upload selection. For example, entering `textures/walls` and selecting `base-color.png` persists `textures/walls/base-color.png`.

New attachments use the stable Vercel Blob object layout `models/<modelId>/attachments/<relativePath>`. The browser submits each attachment's computed relative path through the existing owner-scoped Model Files API. The server normalizes separators, rejects absolute and parent-traversal paths, enforces the directory limit, and prevents case-insensitive relative-path conflicts for a Model. `threed_model_files.relative_path` remains authoritative for the User-defined portion of the stored object key. Existing attachment URLs remain valid and are not migrated.

Persisted relative paths appear in both Model Files list and grid views and participate in workspace search. This makes User directory intent durable, inspectable, and available to the runtime dependency resolver.

The Model Files dependency audit reads the selected primary FBX, GLB, or GLTF and reports every discoverable external texture or buffer reference as **Attached** or **Missing**. Exact relative paths take precedence. A filename fallback is accepted only when that filename is unique among the Model attachments, supporting FBX exports that retain exporter-workstation paths without guessing between duplicate texture names.

`ModelMarker3D` uses the same resolution rule through a Model-owned Three.js `LoadingManager`. It resolves dependency requests to their attached Blob URLs before FBX, GLTF, GLB, or OBJ loading. The resolver is scoped to reusable Model markers and does not alter GardenCharacter, EcctrlCharacter, external animation, or Rapier ownership.

### Attachment-directory verification

1. Open `/admin/threed/model-files?modelId=<id>` for a disposable Model.
2. Enter `textures/walls` in **Attachment directory** and select `albedo.png` with **Choose Files**.
3. Confirm upload progress and the resulting file card show `textures/walls/albedo.png`.
4. Confirm the stored Blob URL follows `models/<modelId>/attachments/textures/walls/albedo.png` without a generated timestamp directory.
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

The manual primary-file upload route analyzes supported Model structure before committing a new Blob. FBX, GLB, and GLTF uploads use the same bounded geometry-inspection services as the runtime inspection API. OBJ and USDZ remain valid uploads but report that structural analysis is not yet available.

The upload response provides configuration guidance rather than new authority:

- a suggested display name derived generically from the source filename;
- mesh, triangle, skinned-mesh, invalid-mesh, and source-component counts;
- the existing geometry readiness classification and bounded reasons;
- no inferred vendor, library, Character, Environment, or runtime-adapter assignment.

Malformed inspectable files fail analysis before Blob storage. A successful analysis appears in the Create/Edit form, while the User remains responsible for Model naming, taxonomy, publishing flags, transform, runtime role, and final creation.

When the User selects **Create Model**, the analyzed primary upload is submitted as a bounded pending-file description. The owner-scoped Model route verifies that its URL, type, and byte count exactly match the Model configuration, then creates the `threed_models` row, its `threed_model_files` primary attachment, and the `mainModelFileId` relationship in one database transaction. A database failure cannot leave a partially connected Model record. Cleanup of a staged Blob abandoned before Model creation remains a separate lifecycle boundary.

Saving an analyzed replacement from Edit follows the same contract: the replacement attachment and synchronized reusable Model fields commit together. The previous attachment remains available until the User explicitly removes it from Model Files, providing a recoverable replacement workflow.

### Manual verification

1. Select a valid FBX, GLB, or GLTF primary file and confirm the upload result says **Model analyzed and ready to configure**.
2. Confirm Meshes, Triangles, Components, and Geometry values appear without creating the Model automatically.
3. Confirm an empty Model name is suggested from the filename, while an existing User-entered name is preserved.
4. Upload a malformed file with an inspectable extension and confirm no successful Blob upload is reported.
5. Confirm the User can finish the remaining configuration and explicitly select **Create Model**.

### Staged primary-file cleanup

An analyzed primary Model file remains staged until Create or Edit is saved. Closing the editor or selecting a different primary file requests deletion of the previous staged Blob. Cleanup is limited to an authenticated User's `models/<user-id>/upload/` path and accepts only the supported Model extensions.

Before deletion, the server checks both `threed_models.file_path` and `threed_model_files.file_path`. A committed file is never eligible for staged cleanup. A save in progress prevents the controlled editor from closing, avoiding a create-versus-cleanup race.

1. Upload a disposable Model file, close the form without saving, and confirm no Model record is created.
2. Upload one disposable file and then select another. Confirm the second file is analyzed and remains selected.
3. Create a Model from an analyzed upload, close the completed workflow, and confirm its primary file remains available in Model Files.
4. Edit a Model, upload a replacement, cancel, and confirm the existing saved Model file remains unchanged.
5. Open the created Model's file workspace and confirm the uploaded source appears as its primary Model file without uploading it a second time.

## Stage 4 attachment integrity

The authenticated server routes now maintain one consistent attachment contract. Setting a primary Model file validates that the attachment belongs to the selected Model and synchronizes `mainModelFileId`, `filePath`, `fileSize`, and `modelType`; it is no longer an ID-only update. Every attachment upload or deletion recalculates `textureCount` and `hasExternalFiles` from the complete persisted attachment set.

Deleting a primary attachment promotes the first remaining Model attachment by stable load order. Deleting the only primary Model attachment is refused, because `threed_models.filePath` is required and the operation would leave a non-loadable reusable Model. The User must first upload a replacement. Database records and derived Model metadata change in one transaction, then the detached Blob is removed.

Deleting a complete Model transactionally removes its attachment records and Model record before Blob cleanup. Cleanup accepts only verified Vercel Blob URLs in that User or Model's expected storage paths, deduplicates URLs, and retains a Blob if any remaining Model or attachment record still references it. External URLs are never deleted by these routes.

### Manual verification

1. Upload a second Model file, set it as primary, and confirm the primary badge moves. Return to Models and confirm its runtime file URL, byte size, and type match the selected attachment.
2. Add two disposable textures, delete one, and confirm the texture total equals the remaining texture records rather than merely decrementing stale metadata.
3. Delete the active primary while another Model attachment remains. Confirm the next load-ordered Model file becomes primary and the Model remains loadable.
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
