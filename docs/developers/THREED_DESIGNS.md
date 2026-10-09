# ThreeD Designs: editing the active Project Scene

Designs is an editing interface for the current Project. The four View Modes 3d, 2d, combined and design share Project identity, architectural parameters, Model instances and Project Save. This local correction follows the Developer-confirmed v0.24.0-alpha release; authenticated App acceptance and a new release remain pending.

## Architecture inspection and correction

The preceding local candidate diverged from the requirement: Design mode hid the Project Scene, rendered an independent DesignPreview Canvas and saved records through /api/threed/designs. Its optional Project association did not include those meshes in the Project Scene or Project Save. That flow is superseded.

Inspection found an existing JSONB project.config column and an owner-scoped Project snapshot transaction. No new table or column is necessary. **threeDArchitecture is a new application JSON contract introduced inside that existing column**, not a pre-existing schema field or normalized Structure table.

| Concern | Actual source module | Current integration |
| --- | --- | --- |
| Active Project | src/app/dashboard/scene/page.tsx; src/components/map/hooks/useThreeDProjectSessionLoader.ts; src/libraries/services/map/threed-project-session-core.ts | Selected Project owns draft/history/selection; session loading hydrates source. Dirty cached drafts survive Project/view changes. |
| Schema and ownership | src/libraries/schema/project/index.ts: project.id, userId, config, metersPerSceneUnit | project.config.threeDArchitecture stores {version:1, document}. Authenticated owner and requested Project determine access. |
| Scene loading | src/app/api/map/threed/route.ts | Returns validated architecture in projectContext alongside assigned assets, marker snapshots, units and view state. Existing public/private read policy remains. |
| View modes | src/app/dashboard/scene/page.tsx; src/components/map/header/ProjectSceneToolbar.tsx | Design places the Plan beside the existing 3D Scene. Persistent 3D/map hosts retain owners across all four modes. |
| Drawing tools | src/components/threed/design/DesignEditor.tsx, DesignPlan.tsx, DesignFieldHelp.tsx | Existing tools/properties/history edit Project-owned source; no record picker, New record or separate Save. |
| Parameters | src/libraries/services/threed/design/document.ts, history.ts, project-architecture.ts | Strict bounded document v5, stable IDs, hosted openings, same-level topology and immutable Undo/Redo. Geometry is derived. |
| 3D geometry | src/components/map/UnifiedMapView.tsx; ThreeDScene.tsx; src/components/threed/design/DesignSceneObjects.tsx; src/libraries/services/threed/design/geometry.ts | Generated geometry mounts alongside Models inside the established Canvas under its own cache/resource owner. |
| 2D projection | UnifiedMapView.tsx; src/components/map/LeafletMap.tsx; src/libraries/services/threed/markers/map-coordinate-core.ts | Wall/floor/roof outlines use existing Project geographic/plan conversions and a dedicated layer that preserves marker layers. |
| Project Save | src/app/dashboard/scene/page.tsx; src/app/api/project/threed-markers/route.ts | Existing PUT captures marker snapshot, view state and architecture in the same advisory-lock transaction. |
| Existing instances | project_threed_markers; src/libraries/services/threed/markers/runtime-marker-core.ts and runtime-marker-builder.ts | Stable marker IDs, transforms and live-position snapshot authority remain. Architecture is not fabricated as Model assets or duplicate markers. |
| Models/resources | src/libraries/schema/threed/index.ts; src/components/threed/markers/ModelMarker3D.tsx; existing Model/File/Texture loaders | Primary File authority, saved material assignments, resource references and runtime owners remain separate and unchanged. |

## Lifecycle, units and geometry

Open an existing Project and select Design View. The Plan edits architectural parameters in the active Project coordinate frame. Metres remain authoritative in source/geometry; Imperial controls convert once. The Scene adapter scales by 1 / project.metersPerSceneUnit (default 0.3048): a 10 ft room occupies 10 default Scene units. Map outlines use the same units and existing Project origin/heading transforms.

Each wall/floor/roof/opening has a stable local ID. Generated objects carry designEntityId, projectId and sceneObjectId = project:<id>:architecture:<entityId>. Cache updates retain unchanged mesh resources. Deletion/Undo and host/level cascades preserve validated topology. Selection is shared between Plan, architecture meshes and map outlines; mode changes retain it. Architectural selection does not impersonate Model markers. Leaving Design restores whole-architecture level/roof visibility.

Normal Canvas, Rapier world, Model/Character registries and environment portal hosts remain mounted across modes. Entering Design cancels current placement/transform/Simulation work and releases Character control. Architecture provides visual meshes/picking, **not new Rapier colliders or world Actions**. Plan Fit affects only the Plan; existing Scene camera controls remain available. DesignPreview remains for local geometry tooling/fixtures, not the Dashboard Project host.

Project Save is the editor's only persistence control. Architecture is parsed before writes; the existing total snapshot transport remains bounded to 1 MiB. A JSONB merge updates threeDArchitecture and threeDViewState within the existing transaction while retaining unrelated config. Older callers omitting architecture preserve existing architectural content.

Owner/provider readiness, duplicate-click locking and stale-Project replies are guarded. Save acknowledges captured source; newer edits stay dirty. Failures retain source and show an error. Dirty status appears in Design and normal Scene, with navigation/unload guards. Per-Project history survives page-session mode/Project changes; Project Save or JSON export is needed before leaving/reloading. Reopening reads parameters and reconstructs matching geometry. Corrupt saved architecture blocks session loading rather than silently overwriting it. Existing Project snapshots retain their last-committed-write concurrency semantics; no independent design revision/conflict system is claimed.

## Entry points and legacy candidate

/admin/threed/designs and /dashboard/designs choose an existing Project and open /dashboard/scene?projectId=<id>&view=design. A valid projectId opens that Project directly. The old Admin Home Design bookmark redirects to Designs. No entry creates an independent document or Scene.

The superseded threedDesigns schema mapping and owner-only GET recovery API remain to avoid destructive cleanup of possible candidate records. **POST/PATCH /api/threed/designs return 410; the active editor never calls them.** Legacy designId is not adopted as an access or overwrite target. Recovery, if needed, requires explicit source export/import into an owned Project. Prior SQL is a superseded review reference, not an activation requirement. Removing a possibly deployed table is outside this change; no database state has been inspected or altered.

## JSON portability

Export includes supported architectural source: name/defaults, levels, nodes, walls, floors, roofs and hosted openings. It excludes Project ownership, database identity, Models and general Scene settings. The portable threed-home-design identifier and versions 1-5 remain compatible.

Import validates/migrates the whole file before mutation. The user chooses **Merge architectural content** (default) or **Replace architectural content only** (with confirmation). Both allocate fresh IDs and remap references; imported IDs cannot overwrite existing entities or determine access. Unknown ownership/record fields are rejected. Merge appends topology with unique level names, retaining imported coordinates. Replace changes architecture only and preserves unrelated Models/resources/settings. Import is undoable and remains dirty until Project Save.

## Verification and acceptance

Offline checks execute the actual Project Save callback, snapshot transaction, session loader, strict architecture/import logic and geometry with mocked authentication/HTTP/database boundaries. They cover room/floor/door plus existing Model, units, ownership, invalid/oversized input, atomic failure, pending edits, duplicate/stale saves, legacy payload preservation and safe imports. Adapter checks verify both map/Scene forwarding paths.

The optional native Edge fixture uses actual shared editor, Scene architecture component, compiled App CSS and WebGL/pointer input with a mocked Project save/reopen boundary. It proves drawing beside an existing mesh, retained Canvas/object identity across mode changes, units/IDs and editable reopened content. It does not mount the authenticated full Dashboard or connect to the App database. See [implementation evidence](../plans/v0.24.0-alpha-designs-persistence.md).

Pending Developer acceptance: open a real Project containing a Model; draw room/floor/door; switch all modes; Save Project and reopen; confirm unchanged Model transforms/materials, editable room and matching placement. Also check Character/Simulation controls, geographic alignment, short screens/touch and failure guidance. No live migration, seed, write, upload, Git operation or deployment is performed by these fixtures.
