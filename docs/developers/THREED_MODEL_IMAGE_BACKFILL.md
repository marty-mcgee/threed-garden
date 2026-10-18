# One-time ThreeD Model image backfill

**Completed October 17, 2026 through authenticated Admin CRUD. Do not rerun the static-URL apply examples below.** The agent uploaded 54 local images to existing Vercel Blob storage and saved both image fields on 27 existing Models. One matched Model already had both fields populated and was preserved. See the completed execution record below; the commands describe the earlier standalone script, not the method used for the completed run.

The standalone `src/libraries/scripts/backfill-threed-model-images.ts` scans the Developer-selected `public/home-design/objects` directory. Approved mapping: `<asset>.png` is `thumbnail_url`; `<asset>_top.png` is `image_top_view_url`. It fills only NULL/empty-string fields, preserving every nonempty URL. No Model creation, schema migration, upload, geometry/texture change or metadata rewrite.

Models match the exact existing `metadata.legacyAssetName` established by the legacy importer. Names, slugs and IDs are never guessed. For other Models, optionally provide `--mapping mapping.json` containing an explicit asset-to-ID object, for example `{"armchair":15}`; IDs are still restricted to the supplied owner. Unmatched assets are listed and skipped; ambiguous matches or multiple assets targeting one Model fail the transaction. Missing image counterparts are left untouched.

Public files are referenced through the supplied HTTPS directory `--base-url`. They must actually be deployed there; the script does not upload files or verify remote hosting. PNG signature/header, size (up to 4 MB), dimensions (1–4096) and schema path limits are checked locally. This is header validation, not a full image decode. Supply the owner and URL base explicitly when running database modes. Database selection comes from DATABASE_URL, not Git branch; this workspace's connection has historically been shared with production.

## Run manually with Node 24

Offline inventory (no credentials, database connection or network):

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types src/libraries/scripts/backfill-threed-model-images.ts --base-url "https://threedgarden.com/home-design/objects/" --report ".next/model-images-inventory-new.json"
```

The URL is an example using the App domain; confirm the images are published at your intended URL. `--folder` overrides the default local folder. Each report path must be new; existing reports are never overwritten.

Read-only database preview (operator-run only; loads the existing environment file without editing it):

```powershell
node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types src/libraries/scripts/backfill-threed-model-images.ts --base-url "https://threedgarden.com/home-design/objects/" --user-id "YOUR_OWNER_ID" --preview-db --report ".next/model-images-db-preview.json"
```

Review `changes`, current URLs and unmatched assets, and verify the database target before applying. The preview opens a read-only transaction; it lists prospective field changes, not actual database writes. No top-view attachment is created in preview.

```powershell
node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types src/libraries/scripts/backfill-threed-model-images.ts --base-url "https://threedgarden.com/home-design/objects/" --user-id "YOUR_OWNER_ID" --apply --report ".next/model-images-applied.json"
```

Apply recalculates the plan; it does not consume the previous preview. It locks/rechecks each targeted owned Model and atomically registers/reuses owned `top-view` Files, fills the empty fields and updates `updated_at` (and `has_external_files` for top-view assignments). It preserves other Files/configuration. A failure rolls back the transaction; serial IDs can still have gaps. It does not repair database sequences. Reports retain original field values and intended URLs; store them privately. `commit-pending` means the commit/receipt outcome needs manual inspection before retrying, not proof of failure or success. A successful report has `status: applied`. A subsequent run skips filled fields.

## Validation and acceptance

October 17, 2026: offline scan found 371 assets, including 367 top views; no database access or uploads performed. Final fresh TypeScript, focused mocked validation and whitespace checks passed. An initial PowerShell npm.ps1 restriction was avoided using npm.cmd; a fixture-only undefined-value narrowing error was corrected before the final passing TypeScript run. Commands:

```powershell
npm.cmd run validate -- threed-model-image-backfill
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
```

The focused check covers local inventory, exact/explicit matching, existing-field preservation, ambiguity/missing-owner match rejection, attachment insert/reuse, owner predicates and stale-row refusal. PostgreSQL transaction behavior, real row matching, hosted image availability and App acceptance remain operator checks. No live execution or complete CI/build pass is claimed for this standalone script change. Leave changes unstaged; agent execution of live preview/apply is not authorized by the request to write the script.

## Authorized execution preflight — October 17, 2026

The Developer subsequently explicitly requested agent execution, superseding the earlier script-writing-only boundary. Read-only preflight found one Model owner, 592 Models and no legacyAssetName metadata. Exact assigned primary OBJ filenames provide 28 matches across 19 assets, including multiple Models sharing an asset. Explicit per-ID mapping batches preview 27 Models needing updates; one already has both fields populated. Local mapping/preview evidence is retained under ignored `.next/model-images-*`.

No database writes have been applied. Hosting verification stopped at HTTP 404 for `https://threedgarden.com/home-design/objects/ballonFoot.png`; `public/home-design` is Git-ignored. Existing attached images do not supply the remaining requested previews. Uploading matched images to existing storage or publishing them at a reachable URL must precede apply; upload authorization is pending. Do not apply the static-URL preview reports as they stand.

## Completed Admin CRUD execution — October 17, 2026

The preceding preflight status is superseded. Developer directed use of the built-in Admin CRUD storage handling and authorized a separate browser for sign-in. The signed-in owner was verified against the sole database owner. No session cookies or credentials were extracted. Using that browser's authenticated fetch context, the runner used the same endpoints as the Admin components:

- Thumbnail upload: `POST /api/threed/models/upload` with `purpose=thumbnail`.
- Top-view upload and owned attachment: `POST /api/threed/models/{id}/top-view-image`.
- Save the selected image URLs: `PATCH /api/threed/models?id={id}`; GET before/after save verifies current fields and results.

These existing handlers use the canonical `createThreeDBlobPath` and Vercel Blob upload code, session/owner checks and Model File registration. This was API automation in the authenticated browser context, not a claim that each visual form was manually clicked. No new Models were created, so the New Model creation route was not exercised or changed. Models sharing an exact assigned primary OBJ filename were explicitly mapped individually; unrelated Models were untouched. Empty fields were rechecked before saving. No direct SQL mutation was used in this completed run, and no App server was started/stopped. The agent-owned browser was closed afterward.

Result: **27 Models updated, 54 images uploaded, 27 owned top-view attachments verified**. All 54 hosted images were fetched and matched the local SHA-256 hashes. Read-only verification compared image fields across all 592 original owned Models and confirmed existing values and unrelated image fields were preserved. One of the 28 matched Models already had both fields populated and was skipped. The other local assets had no corresponding assigned OBJ Model and were not imported as new Models.

Private local evidence remains ignored: `.next/model-images-admin-receipt.json`, `.next/model-images-admin-verification.json`, `.next/model-images-map-*.json` and `.next/model-images-preview-*.json`. The execution helpers are agent-owned `.next/model-images-admin-run.cjs` and verification/preflight helpers; they are not an App feature or an instruction to rerun. No Git write/deployment occurred. Actual Admin visual review remains Developer acceptance; database and uploaded-byte checks do not establish it.
