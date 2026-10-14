# Legacy Home Design JSON import

Release preparation: this accepted implementation is included in [v0.25.3](../releases/v0.25.3.md), requested October 14, 2026. Package/root lockfile are now 0.25.3; production remains Developer-confirmed v0.25.2. The no-version-change statement in the original implementation record below describes the earlier development step. Release preparation does not repeat recovery or import into any Project.

Local implementation, October 14, 2026. Based on `main` checkpoint `8ee6bd14`; the Developer confirmed v0.25.2 released to production. This import work is unreleased and does not change package/version metadata. No independent deployment verification is claimed.

## Follow-up after the recovered Scene appeared

The Developer accepted the visible Scene and plan in the October 14 screenshot. The subsequent [architecture capability plan](design-architecture-capabilities.md) records Model Library/DetailsCard guidance fixes and the staged native geometry gaps. Screenshot appearance does not confirm later Save/reopen or legacy aperture parity. These local UI/readiness changes do not repeat recovery or modify Project #17; preserve the completed journal and receipts below.

## Authorized live execution result — October 14, 2026

The Developer explicitly approved executing the script against the live environment without a Git checkpoint. The default **report** bundle was applied once, creating **Project #17 — Legacy Plan Demo 1 Recovery**, private and owned by the confirmed existing Marty McGee account. ThreeD module #11 and Models #1176–1203 were created; no existing Project or Model was used as an overwrite target. The native-window bundle was not applied.

| Committed result | Count |
| --- | --- |
| New Project / ThreeD module / Project-module link | 1 each |
| Model variants / Project asset assignments | 28 each |
| Model Files / catalog placements | 60 / 53 |
| Editable walls / floors / shed roofs / levels | 38 / 10 / 4 / 3 |
| Native architectural openings | 0 (report mode) |

Bundle fingerprint: `d02947b3107f26c004e0183dbcf31d9898db1e7c6ff1f3824e62088525726a22`. The Project uses one metre per Scene unit. Open [the recovered Project](http://localhost:4444/dashboard/scene?projectId=17&view=design) through the Developer-controlled App server.

Before uploads, read-only identity checks matched the owners of Project #8 and Model #15 and confirmed no earlier recovery for this bundle. A read-only Blob credential check confirmed the existing storage target. Inspection found the App URL uses Neon transaction pooling, which cannot hold the recovery's session advisory lock; apply now selects a matching direct `DATABASE_URL_UNPOOLED` and rejects Neon pooled connections before opening the adapter. Endpoint, port, database and username must match. Environment files were unchanged. [Neon connection-pooling restrictions](https://neon.com/docs/connect/connection-pooling) explain the lock requirement.

Executed from the repository root with the confirmed current account ID (shown here as a placeholder):

```powershell
node --env-file=.env.local --import tsx src/libraries/scripts/recover-legacy-design.ts apply --bundle reference/legacy-recovery/demo-1 --user-id 'CONFIRMED_APP_ACCOUNT_ID' --project-name 'Legacy Plan Demo 1 Recovery' --accept-warnings --apply
```

The command exited successfully with Project #17, 28 Models and 53 placements. Verification actually performed:

- The adapter checked complete relational/architecture/placement data within its create-only transaction; the journal records `database: complete` and 60 confirmed uploads.
- A separate read-only transaction confirmed committed counts/config and compared every pre-existing owner row's ID/hash across `project`, `threed`, `project_threed`, `threed_models`, `threed_model_files`, `project_assets` and `project_threed_markers`. No pre-existing row was missing or changed. This does not claim an audit of unrelated accounts/tables.
- All 60 new public Blob files were downloaded and their sizes and SHA-256 hashes matched the prepared bundle: **38,338,263 bytes** total.
- After the connection guard: `npm.cmd run typecheck`, `node src/libraries/scripts/validate-legacy-recovery-apply.cjs` and `node src/libraries/scripts/validate-legacy-recovery-files.cjs` passed. Prior broader offline checks are recorded below; full CI/build and authenticated browser checks were not rerun for live apply.

Ignored evidence is retained under `reference/legacy-recovery/demo-1`: `apply-journal.json`, `live-before.json`, `live-after.json` and `blob-readback.json`. Preserve these files; do not reset the journal or apply the other bundle by default. Non-failing Three.js CommonJS and pg SSL-mode future-change notices were emitted; no failed upload or uncertain commit remained.

**Remaining acceptance:** inspect actual Models/textures/transforms and all architectural levels in the App, edit a wall, Save and reopen. Database/file verification does not establish rendered appearance or that later App workflow. This report-mode recovery retains all 53 catalog objects but leaves their boolean apertures unresolved. The six tapered walls, invalid floor and other documented omissions below remain excluded. No local server operation, schema/migration/seed, version/dependency change, Git write, push or deployment occurred. Earlier offline-only/no-upload statements below describe their historical checkpoints; this section supersedes them for this explicitly authorized execution.

## Failure and integration boundary

The supplied ignored `public/home-design/api/threed-plan-demo-1.json` is a legacy Paper.js plan, with object maps and serialized paths. It is not a native `threed-home-design` document. The strict `parseDesign`/`validateDesign` field allowlist in `src/libraries/services/threed/design/document.ts` rejects it with “Unsupported or missing design fields.” Missing OBJ/MTL files do not cause that parsing error.

`src/libraries/services/threed/design/design-import.ts` now recognizes this legacy file format at the file-import boundary. It converts supported records into the existing version-5 metre document and validates each candidate with the unchanged native validator. Native JSON versions 1–5 keep their existing strict parsing. The 1 MiB file limit, bounded entity counts and rejection of unknown top-level Project/ownership fields remain enforced.

`src/components/threed/design/DesignImportDialog.tsx` stages the conversion, displays counts and omissions, and requires acknowledgement before a partial import. Cancel, invalid files and stale asynchronous file reads do not apply content. Merge versus architecture-only replacement remains explicit. The dialog and omission list scroll within short viewports.

`DesignEditor.importFile` still uses `importProjectArchitecture` in `project-architecture.ts`, allocating fresh IDs and remapping references. It now activates the first incoming level after a merge; selecting the existing empty Ground previously hid imported geometry in the active-level-only plan. Import creates one undoable edit through existing history, dirty state and Project Save. No independent persistence path, schema change or Model record creation is introduced.

## Supported mapping and supplied-file result

Legacy source inspected: `reference/home-design/scripts/threed.js`, `reference/home-design/index.html`, the supplied plan and catalog metadata. Paper X/Y becomes Design X/Z; legacy centimetres divide by 100, preserving positions and level elevations without recentering. Exact coincident corners share nodes only on the same level. Identity paths and straight segments are supported; unapplied transforms and curved paths are reported rather than approximated.

| Legacy content | Result |
| --- | --- |
| 3 levels | Ground at 0 m; levels at 2.65 m and 5.3 m |
| 44 walls | 38 constant-height walls; six tapered walls omitted |
| 11 floors | 10 valid polygons; two-point floor 29 omitted |
| 4 roofs | Four independent shed slopes with converted width, rise, direction, thickness and eave offset |
| 53 catalog placements | Omitted; these are asset instances, not native architecture records |
| 1 dimension, 1 text, 8 guides | Reported as unsupported annotations/guides |

Legacy slabs extend upward from their level, so their native top offset equals their converted thickness. Roof direction follows the legacy axis; native pitch is rise per 12 units of run, not degrees. Joined legacy roof miters are unsupported. The six omitted tapered walls are 151, 153, 155, 156, 158 and 161.

Catalog doors/windows/skylights lack native wall/roof host references. The legacy loader creates openings by subtracting catalog masks from intersecting geometry. This conversion does not guess hosts or infer openings from names: catalog objects and their apertures are omitted, explicitly warned about, and require reconstruction with supported tools. Legacy materials, lighting, camera and edit-history metadata are also omitted. The original file is retained unchanged for later recovery.

## OBJ/MTL audit before automation

Historical inspection below led to the recovery CLI implemented in the next section. Its earlier implementation deferrals apply to the architecture-only dialog, not to the new operator script.

The Developer suggested importing legacy 3D assets first. That is useful for recovering the furnished scene, but is not a prerequisite for the architecture conversion and does not resolve the JSON format mismatch by itself. A later placement adapter must map legacy catalog names to current Model identities and preserve instance scale, pivot, rotation, elevation and level. Editable opening hosts/masks require separate treatment.

Existing reuse points are `model-import-manifest-core.ts`, `model-obj-core.ts`, `model-obj-loader.ts` and `generate-legacy-threed-model-manifest.mts`. The existing generator targets a fixed ten-item pilot, not all placements in this plan. Do not run the live importer as an offline check or assume registering assets automatically restores plan instances.

Read-only audit found 19 unique catalog names across 53 placements. All have local OBJ and matching-name MTL files; all four referenced texture images exist. The staircase OBJ references missing `stairs_90_closed_legal_high.mtl`, although `quarterLandingStaircase.mtl` supplies the materials used by the old explicit loader. Prepare a corrected staging bundle rather than modify the reference files. `largeCouch.obj` is 6,889,671 bytes, exceeding the current bulk importer's 4 MiB primary-file limit. Asset upload/registration and placement integration are not implemented or performed by this checkpoint.

The existing single-Model direct upload accepts OBJ up to 32 MiB (`model-upload-policy-core.ts`, `ThreeDModelsCRUD.tsx`), so the couch can use that flow with its MTL/textures attached. Actual App OBJ/MTL inspection passes the other 18 bundles. Future instance conversion must account for 31 nonuniform scales, three flips and three X/Z rotations; 23 placements use legacy boolean masks. Carry catalog author/license metadata forward with any registered Models. None of these assets has been uploaded by this task.

## Automated recovery CLI — October 14 continuation

The Developer requested a script for bundle preparation, Model registration, catalog mapping, placements and compatible opening reconstruction. `npm run threed:design:recover` now provides `prepare`, `verify` and an explicit `apply`. Ordinary App Import JSON remains an architecture-only feature; it does not upload Models.

### Implemented boundaries

- `src/libraries/scripts/recover-legacy-design.ts`: validated commands; no implicit `.env` loading or live dependency import during preparation/verification. Apply requires an explicit owner, Project name, `--accept-warnings` and `--apply`.
- `design/legacy-recovery-contract.ts`: versioned local recovery artifact and receipt. This is not a new App schema/API or source of truth for an existing Project.
- `design/legacy-recovery-files.ts`: strict package/dependency/hash verification; bounded files, images and aggregate bytes; traversal/junction and source-overwrite guards; new output folder only. Corrected staircase MTL naming exists only in staged copies. Author/license values are retained from the source catalog.
- `design/legacy-recovery-geometry.ts`: uses actual OBJ bounds and the legacy bottom-center pivot; converts centimetres to metres, bakes signed nonuniform scales into reusable OBJ variants and preserves XYZ rotation in radians. UV/material references are retained; mirrored face winding and normals are corrected. Saved Y already includes level elevation. Incremental source/output limits prevent accumulating unbounded variants.
- `design/legacy-recovery-apply.ts`: injected storage/persistence coordinator with a durable upload/commit journal, confirmed-progress resume and conservative handling of uncertain outcomes.
- `design/legacy-recovery-database.ts`: explicit operator adapter using existing Drizzle definitions, native architecture/marker/view-state validators and Vercel Blob. All created database records are one transaction and are read back before commit. No schema change or API/editor behavior change.
- `design/legacy-recovery-connection.ts`: validates the direct connection required by the session advisory lock; rejects Neon pooled URLs and mismatched direct-target overrides before connecting.

`apply` creates a **new private Project** and its ThreeD module, Model/File records, asset assignments and saved Model instances. It does not target or overwrite an existing Project or Model primary. The Project uses one metre per Scene unit, matching the prepared Models and converted architecture. Editable content is stored at the existing `project.config.threeDArchitecture`, workspace defaults at `project.config.threeDViewState`, and object placements in `projectThreedMarkers`. Architecture receives fresh deterministic IDs; provenance retains legacy identifiers separately. Normal Project loading, Design editing and Save continue through the existing App pipeline.

Models are private App records, but their files use the App's existing **public Vercel Blob** storage. Public asset URLs are not private-file authorization. This first recovery adapter does not implement S3. File uploads bypass the bulk importer's 4 MiB request limit while enforcing the existing OBJ loader's 32 MiB bundle limit. At the earlier offline implementation checkpoint no live operation had run; the explicitly authorized execution and verification are recorded above.

### Prepared local results

| Mode | Prepared variants | Placed catalog Models | Editable architecture |
| --- | --- | --- | --- |
| `report` (default) | 28 from 19 catalog names | All 53 | 38 walls, 10 floors, four shed roofs, three levels |
| `native` | 28 | 51 | Same architecture plus two editable windows, legacy IDs 53 and 85 |

Different stretched/mirrored uses of one source Model need separate geometry variants because current instances use a positive uniform scale multiplier. Native mode omits the two corresponding catalog placements to avoid duplicating the replacement generic frames. It changes those windows' appearance. The other 21 boolean-mask objects remain catalog Models with reported unresolved apertures. Exact wall alignment, unique host, full-depth intersection, level and native fit/overlap rules are required; floor/roof overlap and unsupported/ambiguous masks are deferred.

Default report mode preserves all original catalog Models **without applying their boolean cutouts**. Walls/slabs can cover doors/windows/skylights until reconstructed. Neither mode recovers the six tapered walls, invalid floor, joined roof miters, floor holes, annotations/guides, old materials on generated architecture, lights, cameras or history. These omissions are listed in each bundle's `review.txt` and package warnings. This is a bounded partial recovery, not full legacy CSG parity.

Local ignored artifacts are ready at `reference/legacy-recovery/demo-1` (report) and `reference/legacy-recovery/demo-1-native` (native). Original files are unchanged. Each output contains `recovery.json`, `architecture.json`, `source-plan.json`, `review.txt` and copied asset directories. Do not import `recovery.json` through the App's Import JSON dialog; the CLI consumes it. `architecture.json` can separately use ordinary architectural import, but excludes Model placements.

### Commands

Run from the repository root. Preparation refuses an existing output directory, preserving earlier reviews/journals. Use a new folder when preparing again:

```powershell
npm run threed:design:recover -- prepare --source public/home-design --plan public/home-design/api/threed-plan-demo-1.json --out reference/legacy-recovery/my-reviewed-plan --openings report
npm run threed:design:recover -- verify --bundle reference/legacy-recovery/my-reviewed-plan
```

Choose `--openings native` during preparation only if the generic native replacements are wanted. Read `review.txt` before applying. Apply requires `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` already supplied through the operator's normal environment, plus the actual current App account ID. For a pooled Neon App URL, also supply the matching direct `DATABASE_URL_UNPOOLED`; the recovery lock cannot use transaction pooling. No implicit environment-file loading occurs. Never put credentials in the package or paste them in chat. The following is a template for a new reviewed bundle; the separate actual execution above is already complete and should not be repeated by default:

```powershell
npm run threed:design:recover -- apply --bundle reference/legacy-recovery/my-reviewed-plan --user-id 'YOUR_EXISTING_APP_USER_ID' --project-name 'Legacy Plan Recovery' --accept-warnings --apply
```

The result prints the newly created Project URL and saves ID mapping/progress in `apply-journal.json`. Preserve that journal. A retry with the same owner/package/name returns an unchanged verified recovery rather than duplicating it. Confirmed uploads can resume before database work; an uncertain upload or unresolved commit stops for review. Do not delete/reset a journal to force a retry. Uploaded files are retained if database work fails; there is no automatic cleanup of uncertain remote writes. Previously edited recovery Projects are not overwritten. Successful retry verification checks database records, not continued availability of remote Blob bytes.

After a real apply, open the printed Project, use Fit Plan/Scene as needed, inspect all levels, verify object transforms/materials and the selected opening policy, edit a wall, Save and reopen. These authenticated visual/persistence checks remain manual. Applying both example bundles would deliberately create two distinct recovery Projects.

### Automation checks

Maintained task: `npm run validate -- legacy-design-recovery`. It runs synthetic geometry, filesystem/CLI and injected apply/database-adapter regressions without credentials, servers or live services. The optional `node src/libraries/scripts/validate-legacy-recovery-geometry.cjs --fixture` additionally reads the ignored supplied assets.

- `npm.cmd run typecheck` passed. An initial new floor/roof union narrowing error was corrected before the passing run.
- `npm.cmd run validate -- legacy-design-recovery threed-designs threed-home-design shadcn-ui-boundary` passed all four tasks. The initial filesystem fixture needed `node:buffer` added to its offline dependency allowlist after bounded geometry output was introduced. Existing Three.js CommonJS deprecation notices are non-failing.
- `node src/libraries/scripts/validate-legacy-recovery-geometry.cjs --fixture` passed synthetic and supplied-asset checks: 19 catalog names, 28 variants, 53 recorded poses and exactly two supported native windows.
- Actual CLI `prepare` and `verify` completed for both ignored example bundles. The Windows sandbox's tsx user-info lookup failed with ENOMEM; narrow approved outside-sandbox retries passed and remained entirely offline.
- Mocked apply tests execute the actual adapter and current marker/architecture reconstruction. They cover ownership isolation, primary/support File paths, radians/metre transforms, fresh IDs and clean hydration, preservation of existing records, transactional readback/rollback, confirmed-progress resume, idempotency and lost responses.
- `git diff --check` passed. No full CI/build or new visual browser check was run for the CLI. No real apply/storage upload/database write/server operation was performed. The earlier dialog/browser evidence below does not establish live recovery-script success.

## Earlier architecture-import verification

- `npm.cmd run typecheck` passed.
- `git diff --check` passed; Git emitted only the repository's existing LF/CRLF normalization notices.
- `npm.cmd run validate -- threed-designs threed-home-design shadcn-ui-boundary` passed all three tasks. Existing Three.js CommonJS deprecation warnings are non-failing.
- `validate-threed-design-legacy-import.cjs`, included in the existing Designs validation task, tests conversion, bounds, units, shared corners, roof profiles, omission reporting, strict native parsing, fresh-ID merge/replacement and mocked architecture hydration. It executes the actual editor import callback across eight native/legacy × blank/populated × merge/replace cases, including one-step Undo and dirty state.
- Actual dialog tests cover staging, acknowledgement, Cancel, invalid/oversized input, callback failure, reopening and stale reads without Project writes.
- Server-free native Edge fixture used the actual dialog, converter, supplied file and compiled App CSS at 1440×1000 and 375×667. Counts, disabled/acknowledged states, Cancel and explicit Replace callback passed. Screenshots showed readable content, internal scrolling and no horizontal overflow. Only a mocked import callback was invoked. Evidence: OS temp `threed-legacy-import-ui-ZpZhpK`; initial sandbox browser timeout was followed by a passing approved isolated retry.
- Authenticated full-App import, geometry appearance and Save/reopen of this legacy plan remain manual. Earlier v0.24.0 user acceptance does not verify this new conversion. No local servers, database/storage/device writes, migrations, seeds, uploads, package installs, Git writes or deployment occurred.

## Manual verification

1. Open an owned Project with an existing Model. In Design mode, open Import JSON and choose the original legacy file.
2. Leave Merge selected to preserve existing architecture, or explicitly choose architecture-only Replace. Review the counts and all omissions; Cancel if a complete legacy reconstruction is required.
3. Acknowledge supported-content-only import and click Import. The first incoming level becomes active. Use Fit Plan and inspect all imported levels in 2D/3D.
4. Edit an imported wall, verify shared corners and Undo, then recreate required supported openings. Existing Models must remain intact.
5. Save Project and reopen; verify editable IDs/dimensions/levels and geometry survive. No live save/reopen was performed by the agent.
