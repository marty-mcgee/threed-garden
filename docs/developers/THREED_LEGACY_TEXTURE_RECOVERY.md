# Recover legacy OBJ textures

The standalone [download script](../../src/libraries/scripts/download-legacy-obj-textures.ts) inspects the local legacy OBJ files and their declared MTL files using the App's existing parser. It checks the texture references against local files, then optionally downloads missing or invalid images from:

`https://homeidea3d.sbcode.net/objects/[OBJ-name]/[texture-filename]`

For example, `stove.obj` referencing `stove11.jpg` produces `https://homeidea3d.sbcode.net/objects/stove/stove11.jpg`. Object and filename casing are preserved; URL segments are encoded. Nested MTL dependency paths remain in the report, while remote lookup uses the texture basename as requested.

## Run from the repository root

Use Node 24. First audit (no network requests):

```powershell
node --experimental-strip-types src/libraries/scripts/download-legacy-obj-textures.ts
```

Download the missing textures:

```powershell
node --experimental-strip-types src/libraries/scripts/download-legacy-obj-textures.ts --download
```

**All downloaded textures go into one directory: `reference/downloads/legacy-textures`.** Each run also saves a new JSON report there. This directory is ignored developer material. Existing source files and receipts are preserved. No database, App upload, Model creation or attachment changes occur.

To try one object, append `--object stove`. To choose a different flat destination, append `--out "E:\Textures\Legacy"`. To scan another local objects folder, use `--source "E:\path\to\objects"`. Output must be outside the original objects folder.

## Reports and repeat runs

- Existing valid source textures are reported as `present-local` and are not requested.
- Missing/invalid local textures are requested sequentially with a 20-second timeout and 32 MiB response limit. Redirects are rejected. PNG/JPEG/WebP/BMP byte signatures must match the expected extension; signature checking is not full image decoding or Model loading proof.
- Successful downloads retain their original filenames in the flat destination. Existing destination files are never overwritten. A repeat download with identical bytes is `already-downloaded`; different bytes under the same filename are saved as `downloaded-renamed`, using an object/hash-prefixed name in the same flat directory. Both images are retained. The report records the actual output filename, object, remote URL, expected dependency path and remote hash so an attachment can later use its original dependency alias. Repeat runs request the remote bytes again to detect these conflicts.
- Missing/invalid MTL, unsupported parser directives and unsafe paths are reported as issues rather than guessed or rewritten. This parser uses the App's currently supported OBJ texture formats; it does not expand loader support.
- HTTP errors, timeouts, size errors and invalid image responses are reported per texture and do not stop later requests. No automatic retries occur. Download mode exits 2 if issues, renamed collisions requiring review or failed downloads remain; fatal invocation errors exit 1.

The audit describes **local legacy bundles**, not current database attachments. Repairing ThreeD Model File records is a separate authenticated Admin workflow. Do not rerun completed legacy Model imports to attach textures. Files acquired from the legacy host retain the original assets' licensing obligations.

## Verification

Offline regression command:

```powershell
npm run validate -- legacy-texture-download
```

Tests cover canonical MTL options and filenames with spaces, missing MTL and traversal, existing-file skipping, flat output, duplicate-name conflicts, HTTP errors, invalid image bodies and size limits using mocked responses. No fixture server or database is used.

October 21, 2026 local audit: 368 OBJ bundles, 145 missing texture references, 14 valid local texture references and 82 inspection issues (70 missing MTL references). These are dependency-reference counts, not unique downloads or current database Model counts. The `stove` example already has its referenced image locally. Initial audit reports are retained under the ignored output directory; no remote recovery is claimed by this audit.

Final checks: fresh targeted TypeScript compilation of the standalone script and canonical OBJ parser passed using strict checking and the App library targets; focused recovery and repository-maintenance tasks passed (379 maintained documentation paths/anchors). The recovery test is registered in portable CI. No full App suite/build or real legacy-server download is claimed. Package/lock remain 0.26.22.

## Completed Admin attachment execution ? October 21, 2026

Developer requested uploading and assigning the recovered textures to their existing Models. The Developer started the local App when requested; the agent did not start or stop its server. The existing separate signed-in Admin browser was reused without extracting session credentials.

The supplied download-mode report contained 145 recovered references across 101 objects, represented by 135 distinct flat local files. All 145 reference hashes were verified before matching. Owner-scoped App reads matched exact primary OBJ filenames and checked available legacy provenance, then inspected the current saved OBJ/MTL requirements. No fuzzy Model-name matching or new Model creation was used.

| Result | Count |
| --- | ---: |
| Existing Models repaired | 96 |
| Texture Files uploaded and assigned | 136 |
| Hosted texture SHA-256 hashes verified | 136 |
| Models with all required Files satisfied after repair | 96 |
| Original File records preserved | 384 |
| Renamed flat downloads uploaded under original expected filenames | 14 |
| Recovered references without an existing matching Model | 9, across 5 objects |

Uploads used the existing authenticated POST /api/threed/models/files Required files workflow, category texture, original MTL filename and supported dependency directory. Existing MTL maps resolve through the saved File attachments; no blanket Texture-to-all-materials override was introduced. Primary OBJ selection, original File records, material assignments, source metadata, images, flags and other Model settings were verified unchanged; the endpoint updated only its normal attachment-derived fields and updated timestamp. No direct database, schema, Model-create, seed, release or deployment operation occurred.

The unmatched objects are chest, kitchenaid, spatifilum, white_lily and woodShelves. A subsequent owner-scoped read across all Model types found no matching provenance or OBJ File for those objects. Their nine recovered references remain local; no substitute Model was guessed or created. The 14 present-local references in the original audit were not downloaded and are outside this requested downloaded-file batch (including table/Tabletop-light.jpg and stove/stove11.jpg).

The run paused after the first two verified uploads because list/detail reads returned File arrays in different orders. The comparison was corrected to stable File IDs; verified uploads were skipped when continuing, and no uncertain upload was retried. Final read-back separately accounts for the detail-only empty textureFallbacks projection. All 96 targeted Model audits were complete, with one saved attachment per uploaded path and unchanged original records/settings. These checks establish saved dependency resolution and byte integrity; actual rendered appearance remains a separate browser review.

Private receipts, before snapshots, plan, runner, local hash preflight and final verification are retained under ignored reference/imports/legacy-texture-2026-10-21. receipt.json is complete; do not replay the apply operation. Original legacy import journals and downloaded images remain intact.

## Deferred objects for later review

Developer requested retaining the following lookup information. The October 21, 2026 authenticated owner-scoped audit found no matching Model provenance or OBJ File for these five objects across all Model types. There are no identified App Model IDs for them, and no new File IDs were created for these nine references. This is an account-scoped audit result, not a claim about every account or future database state.

The intended ThreeD Module tables are threed_models (Model id) and threed_model_files (File id, related through model_id). Recovered local images are not database records.

| Legacy OBJ | Required texture references | Historical import blocker |
| --- | --- | --- |
| chest.obj | wood.jpg | OBJ contains an incomplete primitive |
| kitchenaid.obj | kitchenaid_writing1.jpg | OBJ contains an incomplete primitive |
| spatifilum.obj | spatifilumList.jpg | Missing texture |
| white_lily.obj | leaf.jpg; petal.jpg; pollen.jpg; stem.jpg; unbloom.jpg | Missing textures |
| woodShelves.obj | wood.jpg | Missing texture |

All images remain in reference/downloads/legacy-textures. The collision-renamed files are white_lily--8b7960b435edfb45--leaf.jpg, white_lily--ba909a79fe04b0e1--stem.jpg and woodShelves--040c84d12f2edc96--wood.jpg; other filenames in this table are unchanged. Preserve original expected filenames when subsequently uploading these aliases.

Historical blockers come from reference/imports/legacy-obj-2026-10-17/obj-import-summary.md; unmatched audit evidence is reference/imports/legacy-texture-2026-10-21/verification.json, and the download mapping is texture-report-1792579383366.json in the download directory. The recovered textures do not certify geometry validity or successful rendering. Future work should freshly inspect and validate these bundles, locate any subsequently created Models, and obtain authorization before new Model creation/uploads. This retained list does not authorize replaying prior imports or repairs.
