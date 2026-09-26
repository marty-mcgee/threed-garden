# ThreeD Model Blob organization

Status: implemented for new uploads after the v0.19.10c production checkpoint; not deployed. Existing stored files are not moved or renamed. This change preserves the pending Models-table, popup and shared-Texture work.

## Problem and scope proved before implementation

Primary uploads used `models/<userId>/upload/<timestamp>.<extension>`, hiding the original name and concentrating all imports in one folder. Model-owned attachments used `models/<modelId>/attachments/<relativePath>` with random filename suffixes; reusable Textures used `textures/<userId>/<uuid>.<extension>`. Staged cleanup recognized only the old timestamp layout. A naming change therefore also needs ownership/cleanup compatibility.

Affected code: primary/thumbnail upload, Model-file storage, reusable Texture upload, Blob ownership and staged cleanup helpers. Acceptance: readable names, collision-free uploads, per-owner organization, attachments grouped with new primary assets, unchanged logical filenames/relative paths, shared Texture isolation and continued use/cleanup of legacy URLs. No schema or existing-data migration is included.

## New layout

```text
threed/users/<userId>/
  models/
    SM_Chr_Attach_Buckethat_01--<asset-uuid>/
      primary/
        SM_Chr_Attach_Buckethat_01.fbx
      attachments/
        materials/<revision-uuid>/paint.mtl
        textures/<revision-uuid>/local-detail.png
    model-<modelId>/
      attachments/                 # New attachments for a legacy primary URL
        textures/<revision-uuid>/local-detail.png
  textures/
    PolygonFarm_Texture_01_A--<texture-uuid>/
      PolygonFarm_Texture_01_A.png # One Blob, referenced by many Models
  previews/
    Buckethat-preview--<preview-uuid>/
      Buckethat-preview.png
```

The asset UUID exists before Model creation and remains part of the stored URL. It is upload identity, not a replacement for the database Model ID. A primary replacement creates a new asset folder; existing referenced attachments retain their URLs. The database remains authoritative for which asset revisions belong to a Model.

Readable storage names retain ASCII letters, digits, underscores and hyphens, normalize extension case, and replace unsafe characters. Labels, filenames and physical attachment directory names are bounded to keep stored URLs within the existing 500-character column limit. Original `fileName` and exporter `relativePath` values remain unchanged in database/API records; rendering and dependency matching continue to use those values. Physical directories need not exactly mirror exporter paths after sanitization/truncation.

UUIDs prevent collisions even when two same-named files arrive together. Attachment revision folders give replacements distinct URLs, preserving the previous protection against cached missing-file responses. No new `put` operation overwrites or copies an existing Blob. Shared references bypass file upload and retain the original library Texture URL.

Primary files receive explicit content types. Thumbnails and shared Textures preserve their existing content-type behavior. The primary/preview lifecycle is unchanged: uploaded before Model creation, with committed-file checks protecting primary cleanup. New staged-primary cleanup accepts only the authenticated owner's primary paths; attachments, previews and shared Textures are not accepted by that endpoint. General Model cleanup recognizes new Model/preview paths and retains the legacy rules; it excludes shared Texture folders.

## Validation

- `validate:threed-model-blob-paths`: readable/collision-free paths, grouping, owner isolation, bounded names, new and legacy cleanup, and shared Texture exclusion passed. Included in CI.
- Existing import contract, saved-Texture and bulk-runner checks passed.
- Actual primary/thumbnail POST and staged DELETE routes passed isolated checks with mocked Blob/database: named paths, distinct repeated filenames, original response metadata, foreign-owner rejection and committed-file protection.
- TypeScript and diff checks passed. No build, production Blob operation or database mutation was performed.

## Existing files and backup follow-up

Existing timestamp files remain accessible through their stored URLs. Directory organization is not an orphan-detection or backup mechanism: an old upload path can still be the authoritative primary of a live Model. Do not delete it based on folder name or age.

A future migration should first produce a reviewable inventory joining Model, Model-file, reusable Texture and material-assignment records to Blob URLs. Record owner, record IDs, original filename, logical relative path, current URL, intended new key and size; compute checksums when reading bytes. Identify shared URLs once, unresolved references and unreferenced objects separately. Back up both Blob bytes and database relationships.

Only after that inventory is reviewed should migration copy each unique object once, verify bytes, update all affected references transactionally, and validate runtime loading and shared Texture resolution. Keep old objects through a rollback window; deletion requires a fresh reference audit. Renaming existing blobs directly in the Vercel dashboard would leave saved URLs stale. No migration or cleanup of existing uploads has been executed in this step.

## Model Files form follow-up

The Model Files attachment form still displayed the hard-coded legacy `models/<modelId>/attachments/` prefix after the upload handler changed. It now labels the editable value as the Model-relative attachment directory, opens the field by default, and explains automatic storage under `threed/users/`. The value remains the logical dependency path sent as `relativePaths`; the server selects the physical asset folder and unique upload revision. No upload or access behavior changed. TypeScript, the Blob path validator, and diff whitespace checks passed. The build remains the User-owned manual gate.
