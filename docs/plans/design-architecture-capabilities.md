# ThreeD Design: architecture capabilities and legacy connections

## October 15 reassessment — recommendations only; implementation on hold

The Developer explicitly requested documentation only: **do not implement this recommended sequence yet**. No stage below is newly authorized or assigned a release version. Existing v0.26.4 release preparation remains separate. The October 14 records below retain their historical status; this reassessment supersedes their outdated statements about current physics, measurement support and Design persistence.

Reference: Developer-supplied `Screenshot 2026-10-15 202442.png`, showing the legacy `/home-design/index.html` page. The screenshot shows catalog objects in the plan, level tabs, rulers/guides and translucent architecture in 3D. Source inspection covered `reference/home-design/index.html` and relevant handlers in `reference/home-design/scripts/threed.js`, compared with the current typed Design modules. This is source/screenshot analysis, not a new executed legacy-browser test or proof of complete parity.

### Reassessed feature inventory

| Capability | Legacy evidence | Current App and remaining gap |
| --- | --- | --- |
| Sloped-top walls | `updateWallHeight0` / `updateWallHeight1` edit separate endpoint heights. | Constant-height walls, shared nodes and editable dimensions exist. Paired endpoint heights, opening clearance and corresponding geometry remain missing. |
| Doors/windows | `applyMasksToWall` subtracts intersecting catalog masks on the same level. | Native hosted apertures and generic visuals exist. Recovered catalog Models are not linked to native openings; handing/swing and rehosting remain separate gaps. |
| Floor openings | `redrawFloor` extrudes a polygon and subtracts intersecting masks. | Native polygon slabs exist; interior holes and their editing/validation remain missing. |
| Roofs | `relinkRoofReferences` / `reDrawRoofCorners` join legacy roof segments. | Flat/Shed/Gable roofs exist. Compatible roof joins, further forms and legacy join conversion remain gaps. |
| Skylights/cutouts | `applyMasksToRoof` subtracts catalog masks. | Native rectangular roof holes/skylights exist. Catalog associations and unsupported multi-surface/nonrectangular masks remain gaps. |
| Project Models in the plan | `loadThreed` links an OBJ/MTL object to a Paper.js raster loaded from `_top.png`. | Library and Scene placement exist. `DesignPlan.tsx` currently renders architecture, without these Project Model representations or interactions. |
| Model transforms | `updateThreedWidth/Depth/Height`, position handlers and `flipX/flipZ`. | Current placement editor exposes position, positive uniform scale and Y rotation. Independent dimensions/flips require explicit compatibility with existing instance transforms, bounds and physics. |
| Levels | `newLevel`, `setLevel`, `updateLevelHeight` and per-level object groups. | Architectural levels/elevations exist. Explicit Project Model association with Design levels requires definition. Preserve existing world positions. |
| Dimensions and text | `drawDimension`, `loadDimension`, `loadText`, text-edit handlers. | Automatic dimensions and rulers exist; persistent user-created dimension/text entities are missing. |
| Guides | Horizontal/vertical guide creation, removal and plan interaction handlers. | Grid/endpoint snapping and angle constraints exist; persistent editable guide entities are missing. |
| Tracing underlay | `loadBackgroundImage`, opacity, resize and flip handlers. | No corresponding native Design tracing-image workflow was found. File lifecycle and persistence need explicit design; legacy UI alone does not establish saved-underlay parity. |
| Architectural appearance | Wall/floor/roof color and opacity controls; shared legacy materials. | Generated architecture uses fixed materials. Per-category transparency/color settings are missing; these are separate from a full materials manager. |
| Navigation/environment | Recenter, fullscreen, compass, sunlight and grid controls. | Much already exists in Project/Design controls. Reuse existing owners and identify only specific missing behavior. |
| Copy/paste | `doCopy` / `doPaste` duplicate catalog objects with a positional offset. | Legacy behavior is not general architecture duplication. Any equivalent must explicitly define scope and use current instance identity. |
| Save/share/export | Local plan JSON, `generateShareLink` server request and `exportToObj`. | Project Save and validated architecture JSON exist. Legacy OBJ export collects walls, roofs and floors, not a complete furnished/material scene. Design geometry export and sharing require separate scope. |

### Current integration boundaries

- `src/libraries/services/threed/design/document.ts` remains the strict, versioned editable document contract; `geometry.ts` derives and retains geometry resources. New parameters must propagate through validation, history, Assets, properties, import/export, geometry and bounds.
- `DesignEditor.tsx` and `DesignPlan.tsx` retain the current App tools, properties, selection and interaction conventions. Project Models must remain references to existing Project instances, not duplicate records inside architecture.
- `project.config.threeDArchitecture` remains authoritative. `project-design-projection.ts::saveProjectDesignProjection` maintains a derived `threed_designs` record inside the Project Save transaction in `src/app/api/project/threed-markers/route.ts`. Do not revive a disconnected Design save system.
- Architecture already has Rapier colliders through `DesignScenePhysics.tsx`, generated from the same solids. Geometry changes must preserve real apertures in both rendering and collisions. Physics is no longer a wholly deferred capability as the historical Stage 6 text might suggest.
- Project measurement preferences and metre/Scene calibration already exist. Use `scene-units.ts` and existing Metric/Imperial inputs; do not recalibrate from an assumed Character height. The historical Imperial-only wording below is superseded.
- Preserve current layout, Canvas/physics owners, stable IDs, selection, undo/redo, dirty state, concurrent-save handling, Project isolation and unrelated Models/settings. New JSON document fields may require a version upgrade; that is not evidence that a SQL migration is needed.
- Reuse mathematical behavior from legacy JavaScript without importing its global mutable state, DOM property switching or obsolete ThreeBSP/Three.js APIs. The legacy mask handlers scan objects and repeatedly subtract meshes; bounded regeneration, retained resources and disposal require explicit verification in the current App.

### Recommended sequence — not scheduled or approved for implementation

**Scope clarification, October 15:** the Developer agrees with these recommendations as future stages within **ThreeD Designs (Schema + Module)**. This is agreement on scope, not permission to start implementation. All six stages extend the existing Designs data contracts, module UI and Project integration. They do not constitute a separate legacy editor, independent persistence service or general-purpose modeling framework.

For each future stage, review the existing `threedDesigns` definition in `src/libraries/schema/threed/index.ts`, the typed Design document and the Project Save projection together. Specify which parameters are durable Design content, which are workspace preferences and which are references to existing Project Models/Files. Preserve current ownership and Project relationships; propose only justified schema changes after identifying an actual gap. Do not assume each new entity needs its own SQL table or change the current authoritative storage contract implicitly.

1. **Sloped-top walls:** endpoint heights, opening clearance, shared render/collision geometry, properties and legacy conversion. Upgrade old documents without changing existing wall appearance or IDs.
2. **Floor openings:** hosted holes with stable IDs, containment/separation validation, editing, actual slab/collider gaps and atomic deletion/Undo.
3. **Project Models in the 2D plan, then catalog opening links:** first represent/select/edit existing instances; subsequently define explicit host associations and generic-versus-catalog visuals. Missing top-view images need a supported fallback; no automatic thumbnail generation is assumed.
4. **Roof joins:** begin with bounded compatible joins and deterministic geometry; defer more complex roof forms until those contracts are verified.
5. **Dimensions, text, guides and tracing underlays:** separate focused increments using current measurement, snapping and persistence conventions. Underlay storage/ownership must be specified before implementation.
6. **Architectural appearance and export:** category transparency/color controls, followed by a separately bounded geometry export scope. Presentation changes must not change collision behavior.

**Stability requirement across all six stages:** regenerate affected geometry, retain unchanged mesh/material resources and dispose replaced resources. Preserve consistent collider updates and bound any boolean work; do not reproduce the legacy full-object scans and repeated mesh subtraction on every interaction. Future verification must cover repeated edits, Undo/Redo, deletion and Project switching for resource retention/disposal as well as geometric correctness. These are implementation requirements to verify later, not claims that new optimizations or a GPU-memory guarantee have been delivered.

This revised ordering expands the historical Stage 4 catalog-link proposal with the missing 2D Model representation prerequisite and adds appearance/export as a separate recommendation. It does not mark historical Stages 2–6 completed or authorized. Do not automatically restore omitted records, rerun recovery, replace Project #17 or alter existing Projects.

When implementation is explicitly authorized, each increment needs focused old-document upgrade, geometry/collider, selection/history, import-ID and mocked Project roundtrip checks. Browser acceptance and authenticated Save/reopen remain separate. This documentation-only pass runs no runtime/build/browser/database checks and makes no application, dependency, schema or version change.

## Historical October 14 assessment

Checkpoint update: the Developer accepted Stage 1's visible browser result and requested [v0.25.3 release preparation](../releases/v0.25.3.md), with [the latest screenshot](../images/v0.25.3/design-workspace.png) supplied October 14. Stage 1 is included in that local checkpoint; Stages 2–6 remain planned. Screenshot acceptance does not establish later Save/reopen or complete legacy geometry parity.

Local staged roadmap, October 14, 2026. Production remains Developer-confirmed **v0.25.2**. This roadmap does not select a release version or claim the later stages are implemented.

The Developer accepted the visible 3D Scene and 2D plan in the green areas of the supplied Project #17 screenshot and requested help with the orange Model Library/DetailsCard areas, plus the missing legacy architectural capabilities. That is appearance feedback, not confirmation of subsequent authenticated Save/reopen or complete legacy geometry parity.

## Preserve the successful import

Project #17, **Legacy Plan Demo 1 Recovery**, is the existing working Project. The [legacy import record](legacy-design-json-import.md) documents its committed content and independently checked uploaded bytes. No recovery rerun, replacement Project, or application of the optional native bundle is part of this roadmap.

Preserve `reference/legacy-recovery/demo-1/apply-journal.json`, receipts, before/after evidence and original reference files. The completed report bundle contains 53 catalog Model placements and zero native architectural openings. Its catalog doors/windows/skylights are ordinary Model instances; their legacy masks were not applied to the architectural surfaces. Improving the editor must not silently rewrite those Models, apply masks or add the six omitted walls to the live Project.

Future changes use the existing Project draft, history, selection, geometry and Save/load pipeline. No second architecture store or independent save action is proposed. No SQL table change is currently indicated: the editable native document already lives in `project.config.threeDArchitecture`, read and validated by `src/libraries/services/threed/design/project-architecture.ts`. A future native document version is a JSON contract upgrade, not authorization to run a database migration.

## Stage 1: explain and correct the orange areas

Implemented locally in this continuation; runtime browser acceptance remains separate from the code changes.

| Screenshot area | Finding and correction | Source boundary |
| --- | --- | --- |
| A visibly colored OBJ is marked Needs configuration with zero Texture assignments | An OBJ can obtain all its colors from its MTL without an image Texture. The previous readiness rule required an image source for every FBX/OBJ. A saved HTTPS MTL attachment now counts as an OBJ material source. This metadata summary does not certify remote availability or complete dependencies; the existing OBJ loader still resolves and validates the actual bundle. | `src/libraries/services/threed/models/model-library-readiness-core.ts`; `src/components/map/panels/ThreeDModelLibraryPanel.tsx` |
| Library card says Unassigned despite an instance appearing in the Scene | That card label described Library collection membership, not assignment to this Project. The label is clarified as No collection, and Library help distinguishes reusable Models, Inspect, Place and existing Project instances. Place creates another instance; select an existing one through Project Assets. | `src/components/map/panels/ThreeDModelLibraryPanel.tsx`; `src/libraries/services/threed/models/model-library-collections-core.ts` |
| Catalog cards show a cube instead of the object image | The placeholder means there is no saved thumbnail. It does not mean the OBJ failed. The placeholder is labelled No thumbnail. Automatic thumbnail creation and uploads are not included. | `src/components/map/panels/ThreeDModelLibraryPanel.tsx`; `src/components/threed/models/ThreeDModelLibraryPreview.tsx` |
| A selected catalog Model opens a Model DetailsCard | This is correct for an ordinary Project Model instance. Its instance/physics/source controls differ from native architectural properties. The Model information heading/help is clarified without creating another selection or editing system. Select a native wall, floor, roof or opening in either view or Project Assets to use Design Properties. | `src/components/map/details/DetailsCard.tsx`; `src/components/threed/design/DesignEditor.tsx`; `src/libraries/services/threed/design/asset-inventory.ts` |

These corrections do not change existing Model files, texture assignments, physics, ownership, selection or Project persistence. In particular, removing the false MTL readiness blocker must not bypass loader errors for genuinely missing referenced images.

DetailsCard now labels the sections **Project placement**, **Object or environment**, **Collisions & movement**, **Whole-model entry counter** and **Model information**. These and Physics Sensors use the existing accessible `ModelFieldHelp` component. `DetailsCardSection.storageId` keeps the original names as saved preference keys, preserving section state and the placement section's ordering. `ModelInstancePlacementEditor.tsx` and `PhysicsSensorCuboidsEditor.tsx` retain their existing callbacks and Save behavior. Browser inspection also found that the previous `.75rem` marker allowance was narrower than the native disclosure marker; reserving `1rem` keeps the arrow, title and help on one compact header row.

### Stage 1 checks actually run

- `npm.cmd run typecheck` passed.
- `npm.cmd run validate -- threed-library-placement threed-model-list-api threed-obj-bundle` passed. Coverage includes color-only MTLs through actual readiness and mocked Library API serialization; invalid URLs, primary-file absence, unrelated attachments and FBX safeguards remain tested.
- `npm.cmd run validate -- threed-designs threed-home-design threed-sensors shadcn-ui-boundary`: Designs and Home Design passed. The sensor command initially encountered the Windows tsx `uv_os_get_passwd` ENOMEM environment error; an approved offline `npm.cmd run validate -- threed-sensors shadcn-ui-boundary` rerun passed both remaining tasks.
- A file-only review of all 28 prepared recovery variants found 24 with image-free MTL materials. All 28 satisfy the updated metadata readiness check. This did not query or modify the live database or remote files.
- `git diff --check` passed; existing LF/CRLF normalization warnings are non-failing.
- Native file-based Edge fixtures rendered the actual Library, DetailsCard and its editors with compiled App CSS at 1440px and 375px. Inspected dark/light screenshots, readable labels, internal content and a narrow help tooltip. Native Enter/Space activates Inspect once; nested Place does not trigger card inspection. Focus/click/Enter on help leaves disclosure state unchanged. The old `Scene Role` key restores the renamed section, and toggling Project placement writes the original `Project Model Instance` key. Auth, APIs, preview, sensors, transforms and overlay positions were mocked; no local server was used. Initial sandbox browser startup required an approved isolated retry. This is isolated UI evidence, not actual Project rendering, placement or persistence acceptance.

Full CI/build and authenticated Project Save/reopen were not executed for this increment. Preserve the earlier recovery checks as separate evidence.

Final fresh-source fixture evidence: `C:\Users\Marty\AppData\Local\Temp\threed-orange-guidance-413vrA`. All six section headers measured 24px tall, with their title row aligned to the native marker, at both widths. `details-desktop.png`, `details-narrow.png`, `details-light.png`, `details-tooltip-narrow.png` and `library-narrow.png` record the isolated UI. Browser checks use ignored `reference/ui-orange-checks/check.cjs`; it starts no HTTP server.

Manual follow-up: refresh the Developer-controlled App, open Project #17 and inspect the ball in the Library. Its saved MTL should satisfy Placement setup even with zero color-map assignments. Confirm missing thumbnails/collections are labelled as such, select its existing instance through Project Assets, and test section toggles and question-mark help. Do not click Place merely to select the existing ball: it adds another instance. Actual Project rendering, placement and subsequent Save/reopen remain separate manual checks.

## Capability matrix: existing tools versus remaining gaps

| Capability | Already implemented | Actual gap |
| --- | --- | --- |
| Walls | Constant-height walls, shared corners, bounded two-way plan miters, length/thickness/elevation, position/rotation/flip, selection and history. | Different start/end heights for a sloped top. This is the legacy meaning of tapered wall; variable wall thickness is a separate feature. |
| Doors and windows | Wall-hosted rectangular apertures, generic frames/door leaf/glazing, width/height/offset/sill editing, host-axis dragging, fit/overlap validation and cascading deletion. | Mapping recovered catalog instances to those native hosts/apertures while retaining their chosen visuals. Door handing/swing editing and rehosting are also absent. |
| Skylights and roof cutouts | Rectangular roof-hosted holes, slope-following generic skylight frame/glass, host-relative position/dimensions and dragging. | Catalog skylight-to-host association; arbitrarily tilted or multiple-surface legacy masks; nonrectangular aperture editing. |
| Floors | Editable polygon slabs, including concave valid outlines, thickness, top offset, levels and shared nodes. | Interior holes for stairs/shafts and corresponding editing/validation. Invalid two-point floor 29 has no recoverable polygon; adding floor-hole support cannot repair it automatically. |
| Roofs | Flat, Shed and Gable forms, pitch/direction/thickness/eave offset, levels, concave footprints and native roof openings. | Joins/miters between separate roofs, hip forms, overhangs and gable infill. |
| Measurements and guides | X/Z rulers, coordinate-consistent pan/zoom, dimension labels, snapping, angle constraints, Fit Plan and selection framing. | Saved dimension annotations, text annotations and editable guide entities. Existing rulers/measurements should not be rebuilt. |

Inspected native sources:

- `src/libraries/services/threed/design/document.ts`: `DesignWall`, `DesignFloor`, `DesignRoof`, `DesignOpening`, `DesignRoofOpening`, strict v1-v5 upgrade/validation, host relationships and deletion.
- `src/libraries/services/threed/design/geometry.ts`: `wallFootprint`, `wallGeometry`, `roofGeometry`, `roofSolid`, `openingGroup`, `skylightGroup` and retained `DesignGeometryOwner`. Wall apertures are partitioned solids; roof triangulation excludes real holes. Floors currently use `extrudePlan` with one outer ring.
- `src/components/threed/design/DesignPlan.tsx`: native placement, transient previews, selected corners/hosted dragging and plan rendering.
- `src/components/threed/design/DesignEditor.tsx`: drawing tools, selected properties, levels, shared history and import callbacks.
- `src/libraries/services/threed/design/object-properties.ts`, `asset-inventory.ts`, `history.ts`, `project-architecture.ts`: transforms, Assets/Locate, undo/redo, fresh import IDs and Project draft hydration/acknowledgement.
- `src/components/threed/design/DesignSceneObjects.tsx` and `DesignPreview.tsx`: shared generated geometry, stable Scene identity/picking and preview camera bounds.

Inspected legacy/import sources:

- `reference/home-design/scripts/threed.js`: `updateWallHeight0`/`updateWallHeight1` edit distinct endpoint heights; `relinkRoofReferences`/`reDrawRoofCorners` handle old roof joins; `applyMasksToWall`, `applyMasksToRoof` and `redrawFloor` subtract catalog mask geometry. Use these as behavioral evidence, not an implementation to copy with global state or obsolete Three.js/ThreeBSP APIs.
- `src/libraries/services/threed/design/design-import.ts`: currently omits unequal wall heights, joined legacy roofs, catalog objects/masks and annotations. Native parsing remains strict.
- `src/libraries/services/threed/design/legacy-recovery-geometry.ts`: prepares catalog variants/poses and optionally reconstructs only exact upright, aligned, unique wall-host openings. It conservatively rejects overlapping floor/roof bounds, tilted/ambiguous hosts and invalid native fits.
- `reference/legacy-recovery/demo-1-native/review.txt`: only two exact window conversions were possible; the other 21 mask placements require review. Several near-corner doors fail the current `openingMargin` of twice the wall thickness. Those guards must not simply be weakened to force a conversion.

## Stage 2: sloped-top walls

**Planned; not implemented.** This is the smallest useful native capability increment. It can recover the meaning of the six omitted tapered walls without introducing a general CSG system, but needs coordinated changes rather than one extra Properties field.

- Define a bounded versioned native document contract for paired endpoint heights. Upgrade old constant-height walls deterministically with equal heights, preserving IDs and dimensions. Keep strict unknown-field rejection and import size/count limits.
- Use one shared wall-top profile for geometry, opening fit, bounds and displayed information. Ensure both opening edges fit below the sloped top with the supported clearance.
- Generate valid wall solids around apertures and shared miter footprints. Changing one endpoint height must invalidate the retained geometry owner's signature without remounting the Scene/Canvas or unrelated objects.
- Add start/end height inputs with Imperial display, retaining the established constant-height workflow. Update Assets dimensions/Locate position, preview Fit bounds and the legacy converter.
- Preserve one-step Undo/Redo, endpoint identity, stable IDs, selection, dirty state and save snapshot acknowledgement. Importing supported tapered source walls remains an explicit operation; no automatic live patch of Project #17.

Acceptance: old v1-v5 documents upgrade cleanly with unchanged visible geometry; equal/increasing/decreasing top heights render correctly; connected corners and mirrored/reversed endpoints preserve the intended heights; invalid aperture or host edits reject atomically; importing a future supported fixture retains the six tapered records; mocked Save/load reconstructs the document and geometry without touching unrelated Models/settings.

## Stage 3: floor apertures

**Planned; not implemented.** Add a typed, hosted aperture representation with stable IDs and bounded geometry. Begin with a focused supported shape and explicit editing controls rather than reproducing every legacy boolean mask.

Acceptance includes interior containment, edge/separation rules, concave host polygons, actual missing slab triangles and interior side faces, selection/Locate, vertex/host changes, level ownership, cascading deletion with Undo, and JSON import/export with fresh references. Floor holes must be visible consistently in plan and Scene, survive mocked Project roundtrips and remain independent from catalog Model physics. Defer unsupported mask shapes explicitly.

## Stage 4: catalog Models linked to architectural openings

**Planned; not implemented.** Provide an explicit reviewed association between an existing Project instance, a native host and its aperture. Reuse established Project marker ownership and native architecture identity; do not create duplicate reusable Models or infer a host from a name alone.

The UI must make generic native frames versus retained catalog visuals explicit and avoid rendering both accidentally. Define how host movement, dimensions, elevation, deletion, undo and missing/unavailable instances affect the link. Validate selected references within the active Project; imported database IDs or ownership fields must not become access authority. Do not extend a wall opening into floor/roof masks implicitly.

Acceptance: unique and ambiguous host cases, catalogue alignment review, correct single appearance, edited host/instance synchronization, missing-reference handling, Project switching, preserved unrelated content, and mocked Save/load. Multi-surface cuts depend on supported floor/roof apertures and require separate reviewed behavior.

## Stage 5: roof connections and additional roof forms

**Planned; not implemented.** Start with one bounded roof-join case and explicit editable relationships. Establish watertight intersections, pitch/elevation compatibility, openings near joins and deterministic regeneration before adding hips, overhangs or infill. Do not promise full legacy roof parity from the existing independent-shed conversion.

Acceptance covers compatible/incompatible joins, concave outlines, host/opening edits, material/geometry ownership, one-step history, stable references, clean upgraded hydration and mocked Project persistence. Keep existing Flat/Shed/Gable tools functional throughout.

## Stage 6: annotations, guides and selected additional features

**Planned; scope to be selected.** Add persistent dimension/text annotations and editable guides as focused increments that reuse current units, rulers, snapping and navigation. Materials management, physics colliders, arbitrary CSG, model export and additional architecture types are not bundled into these stages.

## Shared verification and operational boundaries

For each implemented increment, run focused geometry/document/editor checks and TypeScript, adding mocked Project persistence coverage where the contract changes. Verify old-document upgrade, bounds, stable IDs, host relationships, fresh import IDs, undo/redo, dirty-state behavior, save failure, edits during a pending save and Project isolation. Preserve the original Model content and all unrelated settings through roundtrips.

Record browser inspection separately from automated checks. Manual acceptance should open a Project with existing Models, draw/edit the new supported entity in both views, use Assets/Properties and Undo, Save, reopen, and confirm editable parameters and matching geometry remain. Earlier user acceptance of other releases or this screenshot does not establish that later check.

This roadmap does not authorize new live writes, migrations, seeds, recovery applies, uploads, package/version changes, commits, pushes or deployment. Keep local servers under Developer control. Implement future stages as separate scoped increments and update their status only after the actual changes and checks exist.
