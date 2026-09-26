# Model primary-file authority cleanup

## Approved scope

The User explicitly accepts that existing Models may lose usable file references. This is a schema and application-code change only. No legacy backfill, staged migration, temporary mirror triggers, or database migration assistance is required. This instruction supersedes the earlier preservation plan.

## Implementation

- `threed_models.main_model_file_id` selects the primary `threed_model_files` record through an ordinary indexed foreign key. Removed Model `file_path` and `file_size`; those values remain on Model Files.
- `model-primary-file.ts` derives response URL and size from the assigned File, checking Model, owner and file type. Missing/invalid assignments return an empty URL; no legacy or first-file fallback is used.
- Admin, Map, Project placement, runtime inspection, Plants and Characters use the derived response. Saved Model marker snapshots cannot replace the current primary asset identity.
- Single/bulk creation and the CLI importer register the primary File and assign its ID. Changes to primary URL/size/format require upload or an owned File selection. The editor shows the URL read-only.
- Model deletion clears the primary ID before deleting attachments within the same transaction, supporting Drizzle's ordinary immediate FK. Deleting an assigned primary attachment requires explicitly choosing a replacement first.
- Shared Textures still use one stored file. Attachment, thumbnail and Texture references protect shared blobs from deletion.
- Application routes validate ownership/type and primary activation; no custom database triggers or deferred constraints are required.

## Applying the schema

Use the normal `bun db:generate` / `bun db:push` workflow. The User already generated `drizzle/0016_premium_ikaris.sql`, which adds the primary FK/index and removes the duplicate Model columns. `db:push` applies the schema directly; it does not run generated migration files. No additional data migration is required or requested. Existing invalid non-null IDs may still be rejected by the database FK; address a concrete error if one occurs rather than silently repairing old data.

The User successfully ran `bun db:push`; their supplied terminal transcript ends with `[✓] Changes applied`. The agent did not execute database changes. This application checkpoint is included in the [v0.19.11 release](../releases/v0.19.11.md). Deploy the matching application code with the schema change; old application code still expects the removed columns.

## Validation

TypeScript, Library placement/readiness (including no unassigned-file fallback) and bulk runner checks pass after simplification. Reviewed transaction ordering against the ordinary FK. No build or connected database operation ran. Earlier custom migration tests are superseded; the custom SQL, audit and migration-only test runner were removed.

## User-confirmed schema application

The supplied terminal transcript confirms generation of `0016_premium_ikaris.sql` and successful `bun db:push`. The push added the primary File FK and index and removed Model `file_path` and `file_size`. It also applied additional schema differences: recreation of several foreign keys, Character animations array type/default statements, and the Layer config default. These were present in the User-run push output; no separate runtime regression verification or production application deployment is inferred from schema application.

## Post-push application check

After the User confirmed schema application, repository review found no remaining direct `threedModels.filePath` or `threedModels.fileSize` references. Model deletion clears the primary relationship before deleting Files within its transaction, matching the ordinary FK. TypeScript, import contract, bulk runner, OBJ/GLTF bundle, Blob path, shared Texture, Library placement/readiness, Project session and Runtime Marker validators passed. Diff whitespace checks passed. These are local checks; no new connected database operation or build was run.

Manual application verification remaining: create/import a fresh Model, assign a replacement primary in Model Files, verify its preview and shared Texture, then delete a disposable Model. Existing unresolved Models are accepted under the User's no-backfill scope. Production application deployment of v0.19.11 (`9cdc78e`) is now User-confirmed; individual live regression checks are not inferred from that confirmation.

## Saved Project asset references

A follow-up repository inspection found saved marker JSON could retain nested Character/Planting Models and attachment URLs, and the Model renderer retained its loaded object when its URL became empty. Project loading now hydrates current Model/File relationships (including Character and Planting sources), replaces snapshot asset URL/size/file lists, and preserves instance settings. Missing current sources yield empty references rather than saved URLs. Project and attachment requests use no-store; attachment fetch failures do not reuse persisted snapshot URLs. Clearing the Model URL clears its loaded object, and cancelled loads stop after attachment resolution.

TypeScript, Library snapshot-asset regression, Project session and Runtime Marker validators passed. No connected database or Blob changes or build ran. Project #5's live request was not independently reproduced; reload and verify its Network requests in the UI.

## Generic Model and Planting position responses — local follow-up

The overview reproduced obsolete URLs returning through saved marker JSON after position updates. The generic Model branch refreshed only fallback preferences; the Planting branch retained its saved nested Model. Acceptance: consecutive saves must use current assignments, clear unavailable file references, preserve instance transforms and retain unrelated marker owners.

`src/app/api/project/threed-markers/route.ts` now resolves accessible Models and their owner-matched File records within each affected save transaction. Generic Model responses replace primary URL/size/ID and attachment arrays, including empty values. Plantings resolve the current source Planting’s custom Model first, otherwise its Plant’s current Model. A missing or inaccessible custom assignment does not revive the saved Model or fall back to another assignment. No schema or existing-data migration is required.

Validation: TypeScript, Runtime Marker, Library placement and Project session scripts passed. Regression fixtures exercise repeated position responses, missing assignments, primary removal, Planting assignment precedence, transform retention and unrelated owner stability. These are offline checks; authenticated database round trips and browser requests still need manual verification. No build, database operation or deployment was performed. In a disposable Project, replace/remove a Model primary, move/save a generic Model and a Planting twice, then reload and verify that Network never requests the deleted URL.

## DetailsCard repair links — local follow-up

The Model File notice previously generated a direct Admin link from any positive saved Model ID. A removed or inaccessible record therefore led to “Model not found” instead of a usable repair destination. The notice now checks the current Model API record and signed-in owner before offering “Manage Model Files”. Missing/uneditable records show an unavailable-assignment message and Models management link; request errors remain distinguishable from unavailable records. Requests use no-store and are cancelled when selection changes. This does not recreate deleted Models or change access rules.

TypeScript and diff whitespace checks passed. No build or database operation ran. Manual UI checks remain: an owned Model without a primary gets its direct file link; a deleted/inaccessible Model gets the unavailable message; network failures do not masquerade as deletion. Model #39’s live database state was not inspected.

## Explicit shared Texture substitution in FBX bulk imports

The importer previously required the saved Texture filename to match the FBX requirement, so a selected Farm atlas could not satisfy a Town atlas reference. The approved acceptance criterion is a visible per-requirement substitution that reuses the existing Blob, preserves preview/readback checks and leaves ordinary unmatched files blocked.

The texture requirement dropdown now offers **Use selected shared Texture for this requirement** when an FBX has an effective existing Texture selection. It follows that row’s selected Texture (including inherited batch defaults), displays the source and required names, and uses an in-memory filename alias for preparation/preview. The attachment API stores the required alias filename/path with the original owner-checked, active Texture URL. It does not upload another image. PNG-to-PNG and other same-extension substitutions are supported; cross-extension substitution is rejected. GLB/GLTF buffers and OBJ material rules are unchanged. Resetting to the suggested match removes the explicit substitution.

TypeScript, saved Texture, bulk preparation and bulk runner validators passed. Fixtures cover explicit versus automatic matching, clearing the selected Texture, preview alias names, extension mismatch, identifier-only link requests and rejection of a copied URL during readback. No build, database changes or live uploads ran. Manual acceptance: substitute a Farm PNG for a Town PNG requirement, preview, import, and verify the attachment references the original Texture URL.

## Bulk queue reset and result visibility — local follow-up

Previously, “Clear imported rows” could not clear unknown/failed result rows or all companion files. The approved UI change adds **Clear All Selected Files** in the fixed footer. It clears queued Models, shared local files, result/progress records, local preview state and file inputs, invalidates pending preview validation and releases the separate preview connection. Batch defaults and saved Texture choices are preserved. It performs no server deletion and is disabled during importing. Existing Model scans cannot restore removed rows because their completion only updates still-present draft IDs.

Queue and selected-result status text now uses green for **Imported**, yellow for **Needs Attention** and **Check Import Result**, and red for failed imports. TypeScript and diff whitespace checks passed; no build or live upload ran. Manual acceptance: clear a mixture of ready/imported/unknown rows and companions, reselect the same files, verify defaults remain, and confirm saved Models still exist.

## Bulk queue layout refinement

A long queue previously determined the two-column height and required scrolling the entire importer to reach another Model. On desktop, the settings column now determines the row height; the left column uses size containment and a flexible, independently scrollable queue above the existing preview. Narrow layouts use a bounded queue above the settings. The scroll region supports keyboard focus and contains wheel overscroll. Needs Attention is orange; Check Import Result remains yellow and Imported remains green.

TypeScript and whitespace checks passed. No build ran. Browser verification remains manual: use a long queue, scroll/select its last row, open the preview, and check both desktop and narrow layouts.
