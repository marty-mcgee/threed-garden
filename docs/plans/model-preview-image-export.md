# ThreeD Model — Library Preview Image Export

Status: implemented; corrected PNG capture is User-confirmed working and the checkpoint is approved for release preparation. Included in [v0.20.7 — ThreeD Model: Preview Images + Library Browsing](v0.20.7-release.md). Package is `0.20.7`; final User build and production deployment are pending. Historical pending-browser notes below describe the individual development stages.

## Proof

Model Files already renders saved assets through `ThreeDModelAssetPreview`, but offered no image capture. Models already support `thumbnailUrl` and the authenticated thumbnail upload path. The accepted output is a transparent 400 × 400 PNG, with explicit download or Library Preview assignment.

Affected implementation: `ThreeDModelAssetPreview.tsx`, `ThreeDModelFilesCRUD.tsx`, and new `ModelPreviewImageExport.tsx` under `src/components/admin/threed/models`.

## Act

- Model Files → **Export 2D Image** opens a separate square preview using the existing Model renderer and saved materials.
- Orbit/zoom to frame the Model; **Capture PNG** renders and immediately copies the WebGL image into a 400 × 400 PNG. No grid, background color, selection outline or interface is included. The normal preview is unchanged.
- Capture requires a settled, successfully loaded Model, material inventory, ready textures and satisfied required-file counts. Loading failures remain visible.
- Review the captured image and file size, then **Download PNG**, **Use as Library Preview**, or **Reframe**.
- Assignment uploads with `purpose=thumbnail` to the existing `/api/threed/models/upload`, then PATCHes only `thumbnailUrl` through `/api/threed/models?id=…`. Success is shown only after both operations succeed. A failed assignment can retry the already uploaded URL.
- Capture object URLs are revoked on replacement/unmount. This uses the existing staged-upload lifecycle; abandoning a successful upload after assignment failure does not introduce automatic deletion.

## Validate

Passed:

- `npm run typecheck`
- `npm run validate -- shadcn-ui-boundary threed-gltf-material-targets`
- `git diff --check`

Browser checklist (pending):

1. Open a textured Model in Admin → ThreeD → Models → Files. Open Export 2D Image and orbit/zoom to fit the square.
2. Capture, download and inspect the PNG: exactly 400 × 400; transparent corners; correct textures and no grid/UI.
3. Reframe and capture a different angle; verify the image changes.
4. Use as Library Preview. Refresh the Model editor and Library; confirm the persisted thumbnail matches the capture.
5. Test missing files/load failure: capture must stay unavailable. Test upload/assignment failure and retry; success must not appear prematurely.
6. Switch Models and verify assignment targets the Model shown in the export dialog. Check a narrow viewport and keyboard dialog navigation.

## Resolution

No schema, API implementation, dependencies, Scene runtime or environment changes. No database commands required. Production build remains User-owned. Automated checks do not establish browser WebGL/image-export acceptance.

References: [Model Library checkpoint](v0.20.3.md), [Dashboard cleanup checkpoint](v0.20.6.md).

## Model Edit form integration

- **Proof:** Library Preview Image had Upload Preview but no capture entry point. Immediate thumbnail persistence here could be overwritten by the form's older draft URL on Save Changes.
- **Act:** Added Export 2D Image beside Upload Preview. Reuses the square capture dialog and checks saved Model dependencies before rendering. In this host, Use as Library Preview uploads the PNG and fills the draft thumbnail URL; Save Changes persists it with the other edits. The capture uses saved Model files/materials, not unsaved file or material replacements. Model Files retains its immediate assignment behavior.
- **Validate:** TypeScript, shadcn boundary and diff checks pass. Browser-check nested dialog focus, capture/download, immediate form image update, Save Changes plus refresh, and cancellation without saving. Existing draft fields must remain intact.
- **Resolution:** No API/schema changes. Browser acceptance is pending.

## Batch generation — missing Library Preview Images

Status: implemented; browser rendering/production acceptance pending. Package version unchanged.

### Proof

The single-Model exporter required manual framing and assignment for each missing thumbnail. The owner-scoped Models list is paginated, and existing thumbnail upload/PATCH routes can be reused. Batch generation must skip existing previews, render one Model at a time, handle incomplete assets and preserve per-item results.

### Act

Admin → ThreeD → Models → **Generate Missing Previews** opens the batch dialog.

1. Choose Front three-quarter (default), Front, Side or Top. These are Model-local axis views, not semantic orientations inferred from asset names.
2. Start generation. The tool discovers missing previews across all pages of the owned catalog, independent of the table search/filter.
3. Each supported FBX/GLB/GLTF/OBJ Model loads with saved materials and a square camera fit (Bounds margin 1.25). Automatic camera fitting completes without animation before capture. Grid/background/UI are omitted from the transparent 400 × 400 PNG.
4. Required-file gaps skip the Model; runtime failures and a 45-second capture timeout fail only that item. Network requests have a 30-second timeout.
5. Results show Saved, Skipped or Failed. **Cancel after current** finishes the active item, then stops. **Retry Failed** retries failed items with fresh reads. Running again discovers remaining missing previews.

The browser must stay open. Models are rechecked before capture, before upload and immediately before assignment. The existing PATCH is not an atomic “save only if empty” operation: a simultaneous write between the last read and PATCH can still race. Avoid editing preview images in another window during a batch. No server/API contract was changed. An upload abandoned after a concurrent change or failed assignment follows the existing staged-upload lifecycle; the batch does not delete it automatically.

### Validate

Passed:

- `npm run typecheck`
- `npm run validate -- shadcn-ui-boundary`
- `npm run validate -- threed-model-preview-batch`
- `git diff --check`

The batch test executes the actual component with mocked rendering/network boundaries and covers multiple list pages, existing previews, previews added during capture, missing dependencies, cancellation and rejected saves. It does not establish real WebGL framing, transparency, upload delivery or browser memory behavior.

Browser acceptance: start with a small owned catalog or cancel after the first item; inspect PNG framing/materials/transparency and the saved Library card. Check all four camera presets, cancellation, failure retry and refresh persistence. Run again to confirm saved items are excluded. Production build remains User-owned.

### Resolution

Reuses the exporter and existing authenticated persistence paths; no schema, API implementation, environment or dependency changes. No batch was run against live Models by the agent.


## Batch selection, camera review and configurable image dimensions

This supersedes the earlier immediate-query-and-run flow and fixed 400 × 400 output. The default remains 400 × 400.

- **Proof:** Batch generation previously started as soon as discovery completed, without a checklist, preflight camera view, output-size controls or processing limit.
- **Act:** The wider dialog separates Model selection from camera review. **Find Models** queries the catalog without uploading or assigning images. Each missing-preview Model has an inclusion checkbox and Preview button. **Select first N**, Clear, queued indicators and counts show the exact list order and effective batch limit. The default limit is 10, configurable from 1 to 1000; both normal runs and failed-item retries obey it. Camera presets render a read-only fitted sample before Start becomes available. Users can review different Models; no image is captured/uploaded by this sample window.
- **Dimensions:** Width and height are independently configurable from 64 to 2048 integer pixels; aspect ratio follows the output dimensions. Invalid values block processing. Admin → Settings → **ThreeD Model Preview Images · This browser** saves default dimensions in localStorage, separately from account Save Changes. Defaults apply to single-image export and batch setup; batch overrides do not overwrite Admin defaults. PNG transparency is retained. This is a browser preference, not a shared server-wide Admin policy.
- **Validate:** TypeScript, shadcn boundary, Workspace Settings and batch regression tests pass. Tests cover query/review with no writes, empty-selection and invalid-size gates, dimensions passed to the renderer, batch limit, pagination, skips, cancellation and save errors. Diff checks pass.
- **Resolution:** No schema/API/dependency changes. Browser visual acceptance remains pending; no live batch was executed by the agent.

### Browser acceptance additions

1. Save 640 × 320 in Admin Settings. Open both a single export and batch setup; verify defaults, framing ratio and downloaded pixel dimensions. Restore 400 × 400 if preferred.
2. Find Models. Confirm no uploads, the full missing-preview checklist and the initially selected first 10 entries.
3. Preview different Models and switch camera presets. Verify a readable, stable preview before enabling Start.
4. Select three Models and set the limit to two. Only the first two selected entries in list order should say Queued and be attempted.
5. Clear selection or enter invalid dimensions/limit; Start must be unavailable. Restore valid values, run, cancel and retry failures.
6. Refresh Settings to verify defaults persist in this browser. Check narrow screens, nested export dialogs and keyboard controls.


## Readiness feedback correction

- **Proof:** The browser screenshot showed a rendered Character, 0/1 dependencies and a disabled Start button. `hideCaptureControls` also hid missing-file and runtime messages, leaving no explanation.
- **Act:** Readiness/error messages remain visible in camera review. Missing required filenames and an Open Model Files link are shown beneath the sample. Start displays a reason for invalid inputs, empty selection, loading or missing dependencies. Camera descriptions clarify that Top looks down the Model's +Y axis; Front/+Z or three-quarter is more appropriate for upright portraits. Asset validation remains intact.
- **Validate:** TypeScript and batch checks passed after the readiness change. Regression coverage includes a missing-dependency sample and its visible blocking reason. Browser acceptance remains pending. Free orbit/custom camera behavior is not changed by this correction.


## Saved Texture Assignments and user-chosen perspective

- **Proof:** The companion-file audit checks attached source filenames, whereas ModelMarker3D also resolves unique saved FBX texture-library aliases and applies relational/metadata per-material assignments. Treating the audit alone as capture authority incorrectly blocked textured Models. Bounds fitting could also replace the requested camera direction, while fixed presets prevented users from choosing a useful perspective.
- **Act:** Export readiness now resolves companion references with the existing `withSavedFbxTextures` and attachment resolver. Both export entry points fetch current saved Model details. Unresolved source texture references can be satisfied by complete, successfully loaded per-material base-color assignments across the actual material inventory. Missing structural files, ambiguous fallback matches, unloaded textures and runtime errors remain blocking. Batch discovery does not mutate attachments or Texture Assignments.
- **Camera:** The sample supports mouse orbit and wheel zoom. **Use this perspective** applies the camera direction and distance relative to the fitted Model size. Each batch Model uses that same direction and relative zoom around its own bounds center. Presets are starting positions, not the only choices. Unapplied mouse adjustments block Start with an explanation. Camera positioning explicitly follows bounds refresh instead of relying on the initial Canvas position. Panning is disabled in perspective selection so the composition stays centered consistently across different Models.
- **Validate:** TypeScript, shadcn boundary and `threed-model-preview-batch` pass. The registered batch task now includes actual saved-texture resolver checks for the reported PolygonFarm texture filename, missing/ambiguous aliases and structural requirements. Mocked batch tests cover applying custom perspective and preventing Start before application. Diff checks pass.
- **Resolution:** No API/schema/Scene-runtime changes. Browser acceptance remains pending: reopen Farmer Female, verify its saved library texture resolves, orbit/zoom, apply the view, generate one image and compare the PNG with the sample. Check another Model of a different size retains the chosen angle and relative framing. No live Model writes were performed by the agent.

## Explicit selection and preview event lifecycle

- **Proof:** Find Models preselected the first N results. The installed Fiber Canvas onCreated path connects events to a DOM ref; its event manager calls target.addEventListener without a null guard. Deferred Provider setup after preview teardown matches the reported null-target error path.
- **Act:** Find Models now leaves every checkbox unchecked. The sample may still show the first Model for camera review, but this does not queue it. Select first N remains an explicit user action. A preview-only event factory disconnects and skips registration when Fiber supplies a cleared target; live targets retain the standard event manager. No dependency files or Scene event handling were changed.
- **Validate:** TypeScript, batch regression checks and diff checks passed. Tests assert an empty initial selection and exercise live/null/live event connections. Browser verification remains needed for rapid Model/preset changes, dialog close/reopen, orbit and zoom.
- **Resolution:** No automatic batch selection; null event-target handling is guarded locally. The browser exception was not reproduced live by the agent.

## Batch camera capture correction

- **Proof:** Inspected the two User-provided Model 9/11 exports: both are valid 400 × 400 RGBA PNGs, but contain only a clipped strip at the upper edge. Material readiness enabled automatic capture before the fitted camera was applied. Drei Bounds queues its movement across render frames even with `maxDuration=0`; two browser animation frames were not a camera-completion guarantee.
- **Act:** The shared preview applies batch/review perspective directly to the camera and OrbitControls target after measuring the Model bounds. Capture readiness also requires confirmation for the current Model, reset and perspective. The existing post-readiness frame delay remains for rendering, not camera synchronization. Ordinary Model Files previews retain their existing Bounds fitting.
- **Validate:** `npm run typecheck`, `npm run validate -- threed-model-preview-batch`, and `git diff --check` pass. These checks do not validate WebGL output. Browser acceptance: generate replacements for the two affected Characters, compare their framing with the reviewed perspective, and open each PNG to confirm the full Model and transparent background. Also check a different-size Model and a non-square export.
- **Resolution:** No schema/API changes or live record writes. Already assigned bad previews are not automatically removed or overwritten; use the individual export to replace them, or clear those Library Preview Image fields before retesting the missing-only batch.

## Release checkpoint acceptance

The User confirmed the fitted-camera correction works, planned a further 3–10 Model batch, and approved production release preparation. No exact subsequent batch size or per-Model results were reported. Final TypeScript, preview batch/resolver, Workspace Settings, shadcn boundary and diff checks passed. See the [production handoff](v0.20.7-release.md) for the manual build and deployment steps.
