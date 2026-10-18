# Synty Farm/Nature Model and resource reconciliation

Developer requested a similar batch operation for FBX/GLB Models, Model Files, Textures, Categories, images and metadata from `C:\Users\Marty\Downloads\3D Models\farming\Synty Polygons`, focused on nature and farming. Existing Admin CRUD/storage handling, owner scope, duplicate prevention and previously requested Active/Public/Library Item/ThreeDs settings remain the working approach. Preserve existing primary Files, rigs, Animation configuration, transforms, metadata and material bindings; no broad regeneration, schema change or renderer change.

## Inventory and baseline — October 17, 2026

Read-only baseline: 848 owned Models, 1,782 Files, 22 Textures and 650 material assignments. Existing categories include ThreeDs, Polygons, Environment, Buildings, Props, Characters, Trees, Plants, Rocks, Terrain, Rivers, Mountains and Swamps; reuse and preserve established names/order rather than inventing replacement taxonomy.

The source contains 1,885 FBX and 10 GLB files, including duplicated archives/extracted packages. Main `farm/FBX` and `nature/FBX` directories contain 688 FBX files, with no cross-pack filename collision. Including root Character/Demo variants gives 703 candidates: 519 exact existing Model File matches, 184 missing format/file matches. These are file counts, not new-Model counts. The Developer selected alternate GLB Files on the matching FBX Model, preserving its primary File. Ten FBX filenames have differing bytes across extracted source copies; do not silently replace a primary File with another version. An additional watering-can FBX is present only in the nested updated Farm source package.

Canonical FBXLoader structure inspection succeeded on all 696 selected FBX files, with finite geometry and no parse errors; 177 lack an exact catalog File match. Preserve source folder/filename/hash evidence before mutation. Texture filenames are not globally unique: Nature has distinct Base/Flat/Ground images sharing basenames. Match by source path, bytes and explicit dependency identity, never choose an arbitrary similarly named texture. Existing texture records should be reused only where identity is verified.

## Execution plan and acceptance

1. Resolve format pairing and source-version conflicts before changing affected Models. Verify existing primary/secondary File identities and hashes; do not create duplicate Models for already attached assets.
2. Reuse the actual signed-in Admin bulk runner, primary upload, File/Texture/category endpoints and typed material assignment flow. Add missing resources without replacing existing configured bindings or deleting original attachments. Add only verified category memberships, preserving current assignments.
3. Validate actual dependency matching, local loading and source geometry. Handle TGA/PNG aliases only through the established explicit conversion/link boundary; no fabricated substitutions or cover art used as Model previews. The supplied Nature material list identifies custom-shader materials; uploading those assets is not proof of equivalent Unity shader behavior in ThreeD.
4. Where previews are absent, use the existing actual Model preview/capture implementation sequentially, respecting readiness/errors and the no-GPU-crash-reproduction boundary. Do not claim a generated thumbnail/top view if actual capture fails; existing image URLs remain intact.
5. Keep per-record mutation receipts, no automatic retry of uncertain creates, uploaded-byte verification and read-only before/after diffs. Preserve original resources/rig/Animation/runtime ownership and all unrelated records. Actual Character/Scene appearance remains separate acceptance.

## Execution evidence

Authenticated Admin Texture CRUD created 65 Textures and reused 22 existing matches across 87 canonical PNG/TGA sources. Four new lossless TGA-to-PNG conversions were uploaded; the existing Leaves_Diff PNG was reused after decoded RGBA pixel comparison. Hosted identities verified: 86 byte hashes and one decoded-pixel match. All 519 existing matched FBX File downloads are byte-identical to the selected local sources.

The Model pass completed through the actual Admin bulk runner, direct primary upload and normal Model/File CRUD: 177 missing FBX Models plus the additional watering-can Model were created; 517 existing Models were reconciled. ThreeDs and Polygons memberships were added while preserving other categories. All 697 selected FBX files have distinct byte hashes. Existing primary Files and configured material bindings remain authoritative. Requested Active/Public/Library Item flags are separate from the pending configuration status; unresolved imports must not be described as visually accepted or fully published Library assets.

The Developer authorized corrected GLB import copies. Six Character copies passed structural validation and the actual App's local bundle loader, then were attached as alternate Files with primary selection preserved. Texture paths were normalized and non-JSON chunks remain unchanged. Existing Female/FarmGirl Files share one Model; that grouping was preserved. The demo GLB exceeds the App validator's record limit and remains excluded. The meshless Idle conversion and two experimental AnyConv Character conversions are outside the canonical Model selection. Originals remain unchanged.

The supplied Farm PSD's merged image was decoded according to [Adobe's PSD specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/) and verified identical to existing Texture 2 across all RGBA pixels. The existing material-assignment PATCH endpoint filled 32 missing base-color slots on 31 new Models without replacing configured assignments. An initial unsupported POST changed no assignment; the first record was read back before correcting the method. Retain both attempt receipts.

Image enrichment uses the actual Admin preview/Model renderer and capture readiness, with an orthographic top-view export aligned to measured X/Z bounds. Existing images remain untouched. Background throttling caused initial readiness timeouts; corrected browser execution produced valid captures on recheck. Visual inspection also found mostly black renders despite loading completion: those selections added by this run were cleared, uploaded artifacts retained for audit, and later blank/mostly-black captures are deferred before upload. This is a visual-review heuristic, not a diagnosis of corrupted assets or a shader repair. Previews remain sequential; uploads use bounded concurrency with serialized File creation. Developer servers remain untouched.

## Completed result and preservation audit

| Result | Count |
| --- | ---: |
| Models reconciled | 695 |
| New FBX Models | 178 |
| Existing Models updated | 517 |
| Alternate GLB Files attached | 6 |
| New Textures / existing matches reused | 65 / 22 |
| New shared Texture File links | 24 |
| New material bindings on new Models | 32 |
| Missing thumbnails filled | 444 |
| Missing top views filled | 513 |
| Models with deferred previews | 182 |
| New Models retaining pending status | 149 |

Every scoped Model has Active, Public and Library Item checked and belongs to ThreeDs and Polygons; other categories are preserved. **Pending status is separate from those flags:** 149 new Models still need material/visual review and are excluded from the active public Library query until configured. The other 29 new Models reached active status after successful preview checks. Existing Models' statuses, primary Files, transforms, metadata, rigs, Animation configuration and saved images were preserved. No Character/Animation/Simulation definitions or Project placements were created.

Owner-scoped before/after comparison passed: all 331 unrelated Models, 1,782 original Files, 22 original Textures, 21 Category definitions and 650 existing material assignments remain unchanged. Original category memberships are preserved; their junction row IDs can change through the normal Admin save transaction. New records match the receipts: 178 Models, 746 Files, 65 Textures and 32 material bindings. Of the new Files, 178 are primaries, six alternate GLBs, 24 shared Texture links and 538 top-view attachments. Twenty-five rejected preview selections were cleared. Their top-view Files remain attached but unselected; uploaded thumbnail objects and receipts are retained for audit rather than deleted. No original image was cleared or replaced.

All 1,191 uploaded Model/image files verified against recorded byte hashes, including retained rejected capture artifacts. Texture verification separately covered 87 source identities: 86 byte matches and one lossless decoded-pixel match. The PSD/PNG RGBA comparison is additional evidence. Local source originals remain unchanged. Six GLBs passed actual local App loading; FBX structure checks and representative actual preview inspection are separate from full Character/Scene acceptance. No full regression-suite pass, Unity shader equivalence, placement/physics acceptance or production code deployment is claimed.

Durable private evidence is Git-ignored under `reference/imports/synty-2026-10-17`, including `synty-review.csv` (182 review rows), snapshots, source/corrected-file hashes, mutation receipts, PNG captures, final verification and `SHA256.json`. `.next/synty-*` contains working copies. **Do not rerun completed creates/uploads or prior OBJ operations.** Future repairs need a fresh comparison against these receipts and current records.

Documentation navigation checks and whitespace checks passed. Developer servers, active dependencies and environment files remain untouched. App code, schemas and package version 0.26.12 are unchanged by this task. Changes remain unstaged; no commit, push or deployment was performed.
