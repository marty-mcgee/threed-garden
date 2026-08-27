# Legacy ThreeD Feature Assessment and Integration

## Milestone

`v0.19.0-alpha` begins an assessment-first effort to adapt selected possibilities from legacy JavaScript into the current ThreeD App. The first release candidate is `v0.19.0a — Shared ThreeD Model Library Placement`. It does not authorize a wholesale legacy-code import or replacement of established ThreeD architecture.

Production remains `v0.18.9d — ThreeD Scene Navigation UX` until a later release passes its manual gates.

## Supplied reference source

The legacy application is supplied under `reference/legacy-threed/demo-home-design`. It remains outside `src` and `public` so it is neither active application code nor a publicly served asset path.

The first assessment focuses on application-owned reference files:

- `scripts/threed.js` — a 9,368-line global JavaScript planner implementation;
- `index.html` — its direct-DOM interface and event wiring;
- `api/threed-plan-demo-1.json` plus `.threed` files — saved plan examples;
- `api/objects.json` — legacy OBJ catalog metadata; and
- `api/annotations.json` — example camera-position annotations.

Bundled jQuery, Paper.js, legacy Three.js, TrackballControls, loaders, shaders, post-processing files, and the large OBJ/media catalog are dependencies or assets rather than application design authority. The separate `public/assets-archive` tree is excluded from this assessment.

## Legacy behavior map

The legacy planner runs two tightly coupled views:

- Paper.js owns a 2D plan canvas with walls, floors, roofs, dimensions, text, guides, levels, snapping, selection, and transform handles.
- Three.js owns a second canvas that mirrors plan geometry and placed OBJ items into a 3D view.

The saved `plan` object groups `threed`, `walls`, `roofs`, `floors`, `levels`, `dimensions`, `texts`, vertical/horizontal guides, material settings, Scene lighting, and edit-history keys. The implementation also includes file save/load, local-storage recovery, undo/redo, copy/paste, OBJ export, view recentering, catalog filtering, placement previews, position/size/rotation editing, and background-plan templates.

The source relies on mutable globals, numeric mouse modes, direct DOM lookup/mutation, inline HTML handlers, parallel Paper.js/Three.js object dictionaries, callback loaders, a separate requestAnimationFrame loop, and its own renderer/Scene/camera controls. Those implementation patterns must not be copied into the current App.

## Candidate capability groups

| Capability | Reuse assessment | Current-App destination |
|---|---|---|
| Object catalog placement and transform fields | Behavior overlaps current Model Library and Project marker CRUD | Extend existing ThreeD Models/Runtime Markers only if a missing interaction is identified |
| Position, dimensions, rotation, elevation, and flipping | Useful interaction rules; current App already supports part of this | Provider-neutral Project marker edit services and Sub-Module DetailsCards |
| Grid, rulers, guides, and snapping | Strong isolated candidate if requested | New ThreeD-owned spatial editing helpers; no Paper.js dependency assumed |
| Undo/redo and copy/paste | Useful but requires transaction design | Project marker command history above CRUD, never direct Scene mutation |
| 2D plan tools for walls, floors, and roofs | Major new feature family | Future ThreeD Sub-Modules and Project assets, designed separately |
| Levels | Potential hierarchy feature with broad data impact | Requires explicit schema and Project-authority planning before implementation |
| Background plan template | Mostly independent authoring aid | Dashboard/Admin editing surface, Blob-backed only after approval |
| Saved `.threed` plan import | Possible migration tool | Server-validated importer into current records; never load directly into Rapier |
| Legacy Three.js renderer/camera/animation loop | Do not reuse | Current persistent R3F Canvas remains authoritative |
| Legacy OBJ catalog and remote S3 paths | Reference only | Existing `threed_models` and approved storage records remain authoritative |

## Current authority mapping

| Legacy concern | Current App authority |
|---|---|
| Canvas and render lifecycle | Persistent `ThreeDScene` React Three Fiber Canvas |
| Scene membership | Project-scoped Runtime Markers and ThreeD Layer contracts |
| Saved Project instances | `project_threed_markers` and its authenticated CRUD route |
| Marker behavior | Owning ThreeD Sub-Module renderer/runtime |
| Physics | Stable Rapier world and Sub-Module-owned RigidBody/collider path |
| Movable Characters | `EcctrlCharacter` when `isMovable` is true |
| Autonomous Characters | `GardenCharacter` when `isMovable` is false |
| Model assets | Existing `threed_models` records and Model Library rules |
| Selection and actions | Dashboard marker selection, DetailsCard, and Action Target services |

## Assessment workflow

For each supplied legacy feature:

1. Record the original user-visible behavior.
2. Identify its inputs, outputs, assets, state, and external dependencies.
3. Separate reusable calculations or interaction rules from direct DOM, global state, rendering-loop, and imperative Three.js code.
4. Map the behavior to its current ThreeD owner.
5. Define regression-sensitive behavior and acceptance checks before editing.
6. Implement the smallest current-architecture version.
7. Test the affected Sub-Module together with marker selection, Scene Layers, Physics Debug, and Ecctrl control where relevant.

## Exclusions

The assessment does not automatically permit:

- mounting another Canvas, Scene, renderer, animation loop, or Rapier world;
- copying global variables or direct DOM ownership into React components;
- remounting unrelated markers after one marker changes;
- bypassing Runtime Marker or Project-instance authority;
- routing Character models through general Model behavior;
- changing database schema, API contracts, authentication, MQTT behavior, or physical-device commands; or
- moving archived assets into production paths without an explicit asset decision and validation update.

## v0.19.0-alpha product direction — shared placement workflow

The useful legacy idea is its coordinated three-panel workflow:

1. a Model Asset Library supplies the reusable asset;
2. a Three.js view accepts a spatial placement; and
3. a Paper.js plan view accepts the corresponding plan placement.

The current App will adapt that user workflow through its existing owners. It will not import the legacy panels or their implementation:

1. the existing ThreeD Model Library remains the reusable asset source;
2. the existing React Three Fiber `ThreeDScene` remains the 3D placement surface;
3. the existing 2D map remains the geographic/plan placement surface; and
4. the authenticated Project ThreeD Marker API remains the single creation transaction.

Both placement surfaces must translate their own pointer event into a common Project-marker position request. Neither surface owns a separate copy of the marker, writes directly to Scene state, or creates a second persistence format. After a successful API response, the existing Project marker client transaction updates current App state and both views derive their display from that authoritative result.

### Required behavior before implementation

- A Library item can begin one placement operation without immediately creating a record.
- The user can drop it on either the existing 3D Scene or existing 2D map.
- Each surface resolves coordinates using its own established coordinate system.
- Exactly one authenticated `project_threed_markers` creation occurs per completed drop.
- The returned marker keeps its stable marker identity and owning Model behavior.
- Switching views or cancelling placement creates no database record.
- Character-classified models remain outside general Model placement because they require GardenCharacter or EcctrlCharacter rules.
- Placement must not mount another Canvas, Rapier world, Paper.js runtime, Leaflet instance, or marker registry.

This workflow is the next design target. Drag-and-drop behavior has not yet been implemented; its event payload and 2D-to-Project coordinate conversion must be proved from the current map implementation first.

### Coordinate boundary checkpoint

The current Dashboard already projects Project X/Z positions around the Project map center at `0.0001°` per Scene unit. That existing rule is now expressed as a provider-neutral, reversible map-coordinate helper. `UnifiedMapView` uses it for its existing 2D marker display, and offline validation proves a Project position can travel to map coordinates and back without changing X/Y/Z.

This checkpoint adds no placement event and performs no write. It establishes the coordinate contract needed before a Leaflet drop can call the same Dashboard-owned Model placement transaction as a ThreeD Scene drop.

### Shared click-placement checkpoint

The existing Model Library placement state is now passed to both current view surfaces. Selecting **Place** no longer forces the Dashboard into 3D mode. A ground click in `ThreeDScene` continues to report Project X/Y/Z directly; a map click in `LeafletMap` reports latitude/longitude to `UnifiedMapView`, which converts it back to Project X/Y/Z. Both paths call the same Dashboard-owned `handleModelPlacement` function and therefore the same authenticated Project marker API.

This is one placement transaction with two coordinate-entry surfaces. The map uses a crosshair only while a Model placement is pending. Cancelling still clears the pending Model without writing. Native drag initiation and drop feedback remain a later interaction layer over this established transaction.

### Shared drag-and-drop checkpoint

Model Library rows can now start a native browser drag. During the drag, the selected Library record becomes the same pending placement state used by **Place → click**. Leaflet converts a drop point through the shared map-coordinate adapter. The R3F Canvas raycasts a drop point onto its existing Y=0 ground plane and rejects points outside the current ground boundary. Both drops call the existing Dashboard Model placement handler.

The drag payload carries only display identity; it is not a persistence authority. The active Library record, selected Project/ThreeD module, authenticated API, and returned Project marker remain authoritative. The click workflow remains available for keyboard, touch, and troubleshooting use.

### v0.19.0a release checkpoint

Manual verification passed for 2D click placement, 3D click placement, 2D drag-and-drop, 3D drag-and-drop, Combined View synchronization, cancellation, invalid drops, and one-record-per-placement behavior. The candidate is ready for the manual build and production deployment gates.

The candidate adds no database migration or new API route. It does not mount Paper.js, another Leaflet map, another R3F Canvas, another Rapier world, or another Runtime Marker registry. The existing `project_threed_markers` route and client transaction remain the write and state-update authorities.
