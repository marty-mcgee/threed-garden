# ThreeD Model Builder Tool

**[v0.24.0-alpha — 3D Object Builder + Home Design Tools](../releases/v0.24.0-alpha.md)** is Developer-confirmed in production October 9, 2026. It implements the Cottage Builder at `/admin/threed/models/builder`. The Developer authorized the agreed five implementation stages, superseding the earlier inspection-only scope. See the [implementation and acceptance record](../plans/v0.24.0-alpha-model-builder.md). No schema or dependency change, live database operation, asset upload/replacement, Git write or deployment was performed by the agent. Detailed App/live and post-deployment acceptance remain separate from release confirmation.

Package/root lockfile are 0.24.0-alpha. All 69 maintained CI tasks and TypeScript passed; the guarded agent-owned npm build generated 139 pages. The isolated real Edge fixture exported/decoded/rendered a 1,724,140-byte GLB and verified all 40 textured material-role bindings; authenticated App/live storage/Project acceptance remains pending. The plan records exact evidence separately.

## Builder workflow

1. Open **Model Builder** from Admin Models. Enter the new Model name and dimensions in inches; the default exterior doors remain 80 × 36 inches. Interior inclusion, overall scale, seed, texture resolution, weathering and contact shading are editable.
2. Choose **Generate Preview**. Shared TypeScript builds geometry and raw pixels locally, the browser exports an embedded GLB, and the existing local GLTFLoader/material inventory checks it before preview. Generation and GLB/manifest downloads create no server records.
3. Review the retained Model preview/material inspector and download the GLB or manifest. Changing parameters requires another generation before saving/downloading. Defaults, failed generation, cancellation, busy/capture locks, navigation and browser Back preserve the draft boundary. The previous valid preview remains available if generation fails or stops.
4. Optionally use **Export 2D Image**. The established capture workflow stages the selected PNG through the thumbnail upload endpoint; its returned URL remains in the local Builder draft until **Save as New Model** includes it in Model creation. A changed generated GLB resets capture state.
5. Choose **Save as New Model**. Direct Blob upload verifies the GLB, existing APIs create a new private, inactive/pending Model with its primary File, then register reusable Model Textures and their PBR assignments. **Resume Save** continues confirmed partial work. A creation POST whose outcome is unknown requires record review before another creation attempt. Review the saved Model, explicitly activate it, then explicitly adopt/place it through the Project workflow.

The Builder does not update an existing Model, replace a primary File, change an existing Project or save a Project automatically. A Model is not eligible for placement until explicitly activated through the established owner workflow.

## Reference, geometry and units

`reference/cottage-draft/` remains ignored reference material. Python, reference images and source files are not imported by production code or exposed as deployed asset paths. The supplied Python v0.4 GLB has SHA-256 `e3233b178d5b6c496c9fde74601c950ab2bd03e695065bbe6d4033149a253a02`, 253 meshes and 10,942 triangles; its historical audit is retained in the plan.

The TypeScript port emits **253 named meshes, 10,990 triangles, 11 materials and 18 unique PBR images** at default inputs. It includes front/rear gables, four-slope wing roofs, real wall/door/window/clerestory/skylight openings, frames, chimney, porch/deck, gutters/trim, paving and an optional provisional interior with lining, floors, vaulted ceilings, rear hallway/two room zones and wing rooms. Rafters stop at skylight apertures; this accounts for the 48-triangle increase over the reference. The interior is an editable draft shell, without construction certification, cellar, stairs, furnishings or movable doors.

Physical input values remain inches. Positions convert through `0.0254 * overall_scale` exactly once to metre coordinates, +Y up and front −Z. Parameters are finite/bounded and checked for dimensional fits before allocation. Named parts/materials, flat normals, UVs, vertex contact shading and bounds belong to each generation; resources are disposed through their owning bundle. Stable names do not replace the traversal-index material assignment contract.

Procedural pixels use `mulberry32-v1`, seed 1117 by default, with 64/128/256-pixel texture choices (128 default). They reproduce the reference style, rather than NumPy/Pillow byte output. Repeatability requires normalized inputs, seed, generator version and output hashes; encoded PNG/GLB bytes also depend on the browser/export runtime.

## Materials and presentation

ThreeD Model Textures remains the reusable image subsystem. Existing typed assignment validation, APIs, editor/inventory and shared runtime now support **baseColor, normalMap, roughness, metallic, occlusion and emissive**. Cottage uses the first five; emissive remains available for other Models. Assignments target `mesh:<traversal-index>:material:<slot-index>` plus channel. Regeneration requires freshly inspected bindings.

Generated GLBs remain self-contained. Their image bytes are also explicitly encoded/uploaded to Texture records when saving, with one packed ORM image reused for R occlusion, G roughness and B metallic. Identical images are deduplicated **within that generation/registration**; cross-generation owner-wide content reuse and arbitrary imported-GLB image extraction remain future work. Embedded image indices do not become fake URL-backed Texture records. No reusable Material table was added.

The shared override path clones materials, preserves scalar factors, glass flags and vertex colors, and copies source texture UV channel, repeat/offset/rotation, wrapping, filtering, orientation and color/data space. Imported maps remain available as the embedded baseline. Base color/emissive use sRGB; normal/ORM use linear data. The generator uses `normalScale=(0.7,-0.7)` for Three's tangentless convention, matching GLTFLoader and avoiding an exporter-side green-channel conversion of raw normal images. The manifest records material factors and sampling snapshots.

[Admin Asset Preview](../../src/components/admin/threed/models/ThreeDModelAssetPreview.tsx) and [Project Scene](../../src/components/map/ThreeDScene.tsx) retain their different lighting/environment/shadow setups. Compare at exposure 1 and Model light boost 0; the Builder changes no saved Project lighting. The supplied CPU-rendered PNGs approximate daylight and do not certify Three.js PBR appearance. Browser visual comparisons, glazing/reflections/shadows and capsule clearance remain acceptance work. Glass is alpha-blended, double-sided geometry; transparency does not establish refraction or physical passability. Default whole-Model box collision still blocks interior access; the existing opt-in stationary triangle-surface path needs explicit Project testing.

## Files, storage and provenance

The authoritative [ThreeD Drizzle schema](../../src/libraries/schema/threed/index.ts) and existing Model/File/Texture APIs remain the persistence boundary. Creation explicitly uses `modelType='glb'`, `metadata.activeSource='model'`, scale 1, zero source rotation/offsets, `isPublic=false`, `isActive=false`, `status='pending'`. Existing Model creation registers the same-owner primary File and returns `mainModelFileId`; supporting uploads do not become primary implicitly.

The authenticated direct Blob flow authorizes an owned immutable key, transfers bytes outside the Function request body, verifies provider metadata and actual downloaded bytes/type/structure, then returns upload details for normal Model/File registration. Progress, Stop and guarded cleanup retain the previous draft. The shared direct-primary policy is 32 MiB. Bulk GLB/glTF primary inspection accepts 32 MiB with existing decoded/image/time budgets; bulk FBX/OBJ and companions retain their separate 4 MiB gates. These are supported code budgets, not deployed performance measurements. S3, provider-neutral cleanup, larger tiers and durable jobs remain later work.

Completion still downloads the object and allocates bounded inspection buffers on the server. Known unregistered Builder primaries are cleaned before replacement; unconfirmed cleanup blocks Save and never reuses potentially deleted URLs. Idle unload cleanup is best-effort and excludes pending/associated/uncertain writes. Optional preview images have no existing guarded discard endpoint; abandoned thumbnails can remain orphaned. Confirmed save progress lives in the page, so review partial records after reload rather than blindly creating them again.

Current Project reads hydrate the reusable Model's current authorized primary and assignments. Models/Files have no asset revision pin; promoting an existing primary can affect future Project reads. Builder regeneration creates a **new Model identity** and leaves previous Models and Project instances available as fallback. Same-Model promotion, optimistic revision conflicts and marker source retargeting are separate future designs; Assembly revisions do not supply geometry pinning.

`metadata.modelBuilder` stores public-safe generator identity, normalized dimensions, input/output hashes and material recipes. Downloaded manifests add artifact hashes and confirmed Model/primary/Texture registration IDs. Local paths, private reference/source URLs and secrets are excluded. Owner-scoped records do not make public Blob objects confidential, and arbitrary Model metadata must not be treated as a private source archive.

## Shared foundation and local CLI

| Source | Responsibility |
| --- | --- |
| `src/libraries/services/threed/model-builder/types.ts` | Parameters, identity, raw texture artifacts, recipes/sampling, generated bundle and manifest contracts |
| `.../parameters.ts` | Strict bounded parsing, relational fits, canonical inputs and inch conversion |
| `.../cottage.ts` | Per-generation geometry, openings, optional interior, contact colors, bounds and disposal |
| `.../materials.ts` | Deterministic raw RGBA/height/normal/ORM maps and material ownership |
| `.../export.ts` | Browser PNG/GLB encoding, structural inspection, hashes and manifest |
| `.../registration.ts` | New-Model registration, confirmed progress, dedupe, cancellation and ambiguous-write guard |
| `src/components/admin/threed/models/builder/ThreeDModelBuilder.tsx` | Guarded parameter/preview/download/capture/save workspace |
| `src/libraries/scripts/build-threed-cottage.ts` | Offline geometry/raw-RGBA artifacts and SHA-256 report |

```powershell
node --import tsx src/libraries/scripts/build-threed-cottage.ts --input dimensions.json --output ./cottage-output
```

Omit `--input` for defaults. The CLI accepts a new or empty output directory and refuses to replace artifacts. It writes deterministic `geometry.json`, raw `textures/*.rgba` files and `generation-report.json` with hashes and material factors. These are inspection artifacts, not PNG or GLB files. Portable textured GLB and 2D capture use the browser. Node-native textured export, global DOM shims, server generation jobs and headless rendering were not added.

## Validation and remaining acceptance

Run `npm run validate -- threed-model-builder threed-model-pbr threed-model-direct-upload` for offline checks, `npm run validate -- ci` for retained behavior and `npm run typecheck`. Optional `npm run validate -- threed-model-builder-browser` uses installed Chromium/Edge (or `THREED_TEST_BROWSER`) with a temporary profile and localhost-only fixture; it is excluded from portable CI/all. Run the agent-owned guarded npm build for handoff. Use `npm run threed:models:build -- --output <new-directory>` for the offline CLI; it writes geometry/raw pixels rather than GLB/PNG.

Passed focused fixtures include actual generator geometry/pixels and CLI, actual registration state, mocked React Builder handlers, full PBR API/runtime application and direct-upload authorization/provider verification. Generator checks cover every triangle's normals/winding/indices, finite UV/colors, metre bounds and single scale conversion, true wall/clerestory/roof/ceiling/rafter apertures, ORM/color-space/normal contracts, deterministic inputs/seed, optional interior and idempotent disposal. UI checks cover changed/invalid drafts, capture reset, Back/busy guards, new inactive creation, partial Resume, progress/Stop, unconfirmed POSTs and unmount cleanup.

The plan's validation record is authoritative for pre-release TypeScript, maintained CI, build and standalone real-browser export results. The standalone browser check is distinct from authenticated App interaction or WebGL visual acceptance. Live upload/save/reload, Texture persistence, Project adoption/physics, production transport performance, original visual matching and Khronos conformance remain pending unless subsequently recorded. Developer release confirmation is recorded separately; future changes remain subject to the Manual Release Gate.
