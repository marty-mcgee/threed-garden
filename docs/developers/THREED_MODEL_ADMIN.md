# ThreeD Model Administration

Release candidate: **v0.19.8a — ThreeD Model Administration and File Management** (`package.json` version `0.19.8-alpha`).

The initial v0.19.8a workflow deliberately manages one reusable ThreeD Model at a time. Bulk import remains implemented for future work, but it is not exposed from the primary Model administration surface during this development boundary.

The Admin route uses `#020618` as its presentation background. Its header, sidebar, and footer are translucent layers of that same color, scoped to `/admin` so Dashboard presentation remains independent.

## Admin surfaces

- `/admin/threed/models` owns Model discovery, creation, editing, taxonomy, publishing state, and deletion.
- `/admin/threed/model-files?modelId=<id>` owns the selected Model's primary file, textures, binary buffers, and supportive media.
- A Model row's file action opens the full Model Files workspace with that Model selected. The Models table does not maintain a second attachment-management dialog.
- Both routes belong to the **Models** navigation family. Model Files keeps **Models** active in the Admin sidebar and provides a header-level **Back to Models** action.
- The Models workspace uses one compact row for its item count, name/type search, and related actions: **Add Model**, **Model Categories**, **Model Animations**, then **Model Files**.

## Authority boundaries

- `threed_models` remains the reusable Model record authority.
- `threed_model_files` remains the attached-file record authority.
- Vercel Blob stores file bytes; authenticated owner-scoped App API routes coordinate records and stored objects.
- Model categories remain relational taxonomy. File names, vendor names, and derived name fragments must not become runtime field names or protocol constants.
- This boundary introduces no database schema change and does not alter Dashboard Scene placement, Runtime Marker, Character, or Rapier ownership.

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

## Release-candidate boundary

The v0.19.8a candidate includes the manually approved one-at-a-time Model workspace, shared Create/Edit configuration form, pre-storage structural analysis, transactional primary-file creation and replacement, recoverable staged-upload cleanup, and attachment integrity rules described above.

Bulk Model import remains intentionally outside this release. The candidate introduces no schema change and makes no change to Dashboard Scene rendering, Project Marker placement, Character runtimes, Rapier physics, or Model Runtime Adapter authority.

The next development boundary is reserved as `0.19.8-beta`: continued Admin Models UI/UX improvement after this alpha checkpoint is deployed and documented.

Release preparation validation:

- `npm run typecheck`
- `git diff --check`
- User-confirmed manual completion of Stages 1–4
- Production build and deployment confirmation remain the release gate
