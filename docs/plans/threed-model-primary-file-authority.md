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
