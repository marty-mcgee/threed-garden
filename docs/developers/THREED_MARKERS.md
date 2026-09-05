# ThreeD Marker Architecture

This document records the marker architecture through the production-verified v0.18.8-beta **ThreeD Ecctrl Position Authority** checkpoint. The beta promotes the v0.18.8a runtime work without adding database or API authority.

## Hierarchy and terminology

ThreeD is the parent module. A **ThreeD Asset** is a persisted Sub-Module record such as a Planting, Bed, Character, FarmBot, or Model. A Project junction-table assignment determines whether that asset belongs to the loaded Project.

Database-driven, Project-assigned ThreeD data is the authority for the current Project session. Persisted Sub-Module assets and their Project assignments determine marker eligibility. Persisted `threed_layers` records determine the available ThreeD Layers. An explicit ThreeD Project save records the current marker snapshot in `project_threed_markers`.

A **Runtime Marker** is the in-memory representation created from the saved Project marker snapshot and its eligible source asset. The Runtime Marker registry mirrors identity and current runtime position; it does not create ownership, Project assignment, or Layer records. `project_threed_markers` is the current saved Project snapshot. The old `threed_markers` table remains legacy and is not the foundation of this system.

A **ThreeD Layer** organizes and controls the visibility of Runtime Markers. An **Action Target** is an optional capability of an eligible Runtime Marker; it is not the parent identity model and does not grant persistence, MQTT, worker, or physical-device authority.

## ThreeD Layer Scene contract

ThreeD Layers are contracts and transactions with the persistent R3F Canvas. They do not create another marker authority. `project_threed_markers` remains the saved Project-instance authority, the Runtime Marker collection remains keyed by stable `marker_id`, and each Sub-Module remains responsible for its own rendering and Rapier body.

```text
Project ThreeD Markers
        ↓
ThreeD Layer transaction
        ↓
Stable Runtime Marker collection
        ↓
Bed | Planting | Character | Model | FarmBot runtime
        ↓
Persistent ThreeD Scene and Rapier Physics world
```

A Layer transaction may add, update, remove, show, or hide a marker. It must preserve these rules:

- One marker change does not reload the Canvas or rebuild the Physics world.
- Unrelated markers retain their React identity, transform, runtime state, and Sub-Module ownership.
- A hidden marker stops visual, pointer, input, collision, and Physics Debug participation without losing its saved transform.
- Showing a marker restores the same marker identity and transform.
- Character selection and Ecctrl control remain owned by the Character instance and cannot move to another marker or selection halo.
- Position, rotation, and scale use declarative Scene/RigidBody props. Layer code does not repeat the same initialization through imperative Rapier calls.
- Imperative Rapier calls are reserved for later runtime transactions that cannot be expressed through stable props and must not run during an active physics step.

The Canvas-level Rapier failure circuit limits a frame error to one contained Scene failure. It is a troubleshooting boundary only. A release still requires an error-free normal Scene containing Characters together with fixed marker types.

The current ThreeD Scene Controls expose runtime visibility by the canonical marker types actually present in the loaded marker collection. Singular and legacy aliases such as `plant`, `plants`, and `planting` resolve to the single `plantings` Scene Layer entry. The controls do not pretend that a `threed_layers.layer_type` assigns individual Runtime Markers to that database Layer: no such per-marker relationship currently exists. Establishing that relationship requires a separately approved data-model milestone.

## Current flow

```text
ThreeD Module
        ↓
ThreeD Markers Sub-Module
        ↓
Project-assigned source assets and ThreeD Layers
        ↓
Explicit Save ThreeD Project action
        ↓
project_threed_markers (saved Project snapshot)
        ↓
Runtime Marker registry (in-memory mirror)
        ↓
Visible Runtime Markers
        ↓
ThreeD Scene rendering
        ↓
Optional selection and Action Target capabilities
```

The current marker-producing Sub-Modules are Plantings, Beds, Characters, FarmBots, and Models. The current rule is one assigned ThreeD Asset to one Runtime Marker.

## Saved Project snapshot

`project_threed_markers` stores one current saved row per Project, ThreeD module, marker Sub-Module, and source asset. A row records the normalized source identity, derived marker identity, current saved position and its source, visible display fields, active/visible state, and JSON snapshots of marker data and metadata.

The table is a current snapshot, not an event log or history table. Runtime movement remains in memory until the user explicitly saves the ThreeD Project. Render frames, physics updates, MQTT messages, camera changes, and layer-filter clicks do not write marker rows automatically.

The authenticated `/api/project/threed-markers` boundary provides owner-scoped `GET` and transactional `PUT`. The server derives each marker's ThreeD module from its active Project assignment, rejects missing or ambiguous assignments, applies request and row limits, and prevents credential-like keys from entering marker JSON snapshots. `PUT` upserts rows by stable Project plus marker identity under a Project-scoped database lock and removes only rows absent from the submitted complete snapshot. Existing marker database IDs therefore remain usable by later marker-level PATCH and DELETE requests.

The Dashboard Project dropdown includes **Save ThreeD Project**. The active 3D view registers an on-demand snapshot provider, so current registry positions are collected only when Save is clicked. Layer, search, and asset-type filters do not remove markers from the saved snapshot.

The Project map loader returns saved rows separately from ordinary asset data after filtering them against the current active Project and ThreeD assignments. The Runtime Marker builder restores those saved rows when present. A Project without saved rows continues through the established source-asset builder, preserving existing Projects until their first explicit save.

When restoring a saved marker, the builder applies the saved coordinates to both `RuntimeMarker.position` and the embedded `data.positionX/Y/Z` payload. Static and parent-positioned markers use the outer position, while `EcctrlCharacter` initializes its physics body from the embedded position fields; keeping both representations aligned is required for a refreshed controlled character to spawn at the saved Project location.

## Identity

The lasting source identity is the normalized ThreeD Sub-Module type plus its asset ID. IDs may overlap between Sub-Modules, so the asset ID alone is never sufficient.

```ts
{
  moduleType: 'plantings' | 'beds' | 'characters' | 'farmbots' | 'models';
  assetId: number;
}
```

The runtime `markerId`, such as `farmbots-3`, is a derived scene identity. Marker name and position are mutable properties rather than identity. Multiple placements of one asset are not currently supported; a future requirement would need a separate placement identity instead of changing source identity.

## Eligibility and lifecycle

A persisted asset produces a Runtime Marker only when its Project assignment and source asset permit loading, its Sub-Module has a registered marker adapter, and it provides a usable ThreeD position.

Hiding a ThreeD Scene Layer hides its marker visuals, prevents new direct pointer selection, suspends its module-owned Rapier body, and disables Ecctrl movement input. It does not filter the marker out of the persistent render collection, unmount its module owner, or change its collider structure. The Scene-level Physics Debug renderer keeps Rapier's real collider outlines for enabled layers and filters the grayscale segments Rapier emits for disabled colliders. Scene bounds and the ground coordinate frame are calculated from the complete marker collection rather than the enabled subset. Removing the Project assignment or making the source unavailable is a separate lifecycle event that removes its Runtime Marker and clears or cancels client-side state that depends on it.

## Position authority

Position authority depends on the marker source:

- Plantings, Beds, FarmBots, and Models normally use their database-backed scene position.
- GardenCharacter uses its autonomous runtime world position.
- EcctrlCharacter uses its live physics-body position.
- Future live integrations require an explicit ThreeD marker adapter.

An Action Target retains source identity. Interaction planning should resolve the current authoritative Runtime Marker position immediately before use rather than treating the original selection position as permanently current.

## Capability boundary

All eligible Runtime Markers may support selection, details, camera focus, Action Target selection, Point, Point Gesture, and Talk. Sub-Modules may add their own actions. Planting farming actions remain separate from generic marker capabilities.

Target eligibility never grants database persistence, API authorization, MQTT publishing, worker access, or physical operation. Those effects remain behind their action-specific server boundaries.

## ThreeD Model Library and placement boundary

Beds, Plantings, Characters, and FarmBots retain their established Sub-Module visuals. The Dashboard does not swap those visuals at runtime. GardenCharacter and EcctrlCharacter remain separate and continue using their saved Character model relationships.

The Model Library reuses `threed_models` and `threed_model_files`. Its first increment adds `is_public` and `is_library_item`, an owner-safe shared-library read scope, Admin controls, model-file ownership enforcement, and reusable model loading helpers that honor stored scale, Y rotation, and X/Y/Z offsets. Models marked `used_by_characters = true` are excluded from direct Model placement because they require the established Character runtime path rather than generic Model rules.

The Models Admin create and edit forms expose the existing `used_by_plants` and `used_by_characters` classifications. A general directly placeable model may leave both classifications false while remaining active, public, and marked as a Library item. Setting `used_by_characters` removes it from direct placement; it does not delete the model or alter existing Character relationships.

`ModelMarker3D` supports GLTF/GLB models using `KHR_draco_mesh_compression` through one reused `DRACOLoader`. Matching decoder files from the installed Three.js version are served from `/assets/draco/`; model loading therefore does not depend on an external decoder CDN. Static-asset validation treats those decoder files as required production assets.

The approved next direction is multiple Model placements per Project. A Library model is a reusable asset; a placement is a separate Project-owned scene instance with its own identity and transform. The same model may therefore appear more than once in one Project.

The existing `project_threed_markers` table owns Model placements. A `models` marker references its reusable Model through `source_asset_id`; every placement has a unique `marker_id`, position, display data, rotation, and scale multiplier. Reusing one Model therefore produces independently selectable markers without a second placement table.

Owner-scoped create/update/delete actions use `/api/project/threed-markers`. Marker-level `PUT`, `PATCH`, and `DELETE` use `?id=X`, while `PUT` without an ID remains the explicit whole-Project snapshot save. Creation also ensures the Model is an active Project Asset for the chosen ThreeD module. Scene frames do not write these rows.

## Dashboard Model Library placement

The Project dropdown exposes **Model Library** when the Project has at least one active ThreeD module. The panel reads the shared non-Character Library scope and, for Projects with multiple ThreeD modules, requires an explicit module selection. Choosing **Place** switches to the 3D view and enters a one-shot placement mode. A cyan ground guide follows the pointer; one ground click creates the instance through the owner-scoped API, inserts only the returned marker into the current Project marker collection, and exits placement mode. Cancel or panel close performs no write. The creation API independently enforces the non-Character boundary so a manually constructed request cannot bypass the Library filter.

This is intentionally click-to-place rather than HTML drag-and-drop. It establishes one Scene-coordinate placement path without conflicting with OrbitControls or touch input. A future drag source can activate this same placement mode without adding another persistence path.

Placed model scale is calculated as `threed_models.scale × project_threed_markers.data.scaleMultiplier`. The placement panel allows the user to set the multiplier before choosing the ground location. Character sizing remains owned by the separate Character path.

### Manually verified general-model checkpoint

On August 23, 2026, a Tomato Plant GLB was uploaded to Vercel Blob through Admin Model CRUD, classified for non-Character Library use, selected from the Dashboard ThreeD Model Library, and placed into a Project. The resulting `project_threed_markers` record reloads and renders through the `models` Runtime Marker path. Its DRACO-compressed geometry successfully decodes using the App-hosted decoder files under `/assets/draco/`.

Selecting a Project Model marker exposes **Delete Model** in DetailsCard. After confirmation, it deletes only the owner-scoped `project_threed_markers` row. It does not delete the reusable Model or its Blob file.

DetailsCard also completes the basic placement update UI for instance name, scale multiplier, and Y rotation. Rotation is displayed in degrees and converted to the stored Scene radians on save. The existing owner-scoped PATCH route persists only the placement row; saving replaces only that marker in client state and clears stale selection or matching Action Target state. Position dragging and direct Scene manipulation remain deferred.

After loading and applying base scale plus Y rotation, `ModelMarker3D` measures the transformed geometry and offsets its local Y position from the bounding-box minimum. General Library models therefore rest on or above their Project placement ground point instead of treating a center-origin model as though its center were its base. A configured positive model Y offset adds lift above that baseline; negative offsets are clamped at ground level for direct Scene placement.

## Persistent Scene and marker runtime authority

The Dashboard ThreeD Canvas and its Rapier `<Physics>` world are persistent for the current Project session. The visible collection is keyed by stable `marker_id`. Every marker owns exactly one module-specific runtime path and physics body:

```text
ThreeD Canvas
  └─ persistent ThreeD Scene
      └─ stable marker collection keyed by marker_id
          ├─ Character — owns GardenCharacter or Ecctrl behavior
          ├─ Model — owns general Model behavior
          ├─ Bed — owns Bed behavior
          ├─ Planting — owns Planting behavior
          └─ FarmBot — owns FarmBot behavior
```

Model placement POST, PATCH, and DELETE operations update only the affected `project_threed_markers` entry in client state. They do not call the whole-Project loader. `UnifiedMapView` reconciles rebuilt marker data by `marker.id`, preserves unchanged marker object identities, and passes those same objects into `ThreeDScene`. Consequently, changing a Model must not remount an unrelated Character, transfer Ecctrl movement to a selection halo, or reset another marker's runtime state. Explicit Project switching and user-requested Refresh remain allowed full-data boundaries.

General Project Model collision uses the complete rendered asset boundary. External GLB/FBX/OBJ geometry loads asynchronously, so Rapier cannot safely derive its collider during the initial RigidBody mount. After R3F attaches and renders the composed Model group, `ModelMarker3D` measures that final group—including reusable transforms, instance scale, grounding, nested objects, and skinned geometry—then converts its world bounds into the marker RigidBody's local coordinates. The marker creates one explicit fixed cuboid collider from those bounds. This keeps physics aligned with the whole visible asset and prevents Ecctrl Characters from walking through placed Models.

The **Show/Hide Physics Debug** control in the ThreeD Scene Controls panel enables Rapier collider outlines and bounded `console.debug` Model measurements without reloading the Scene or rebuilding marker colliders. Adding `physicsDebug=1` to the Dashboard Map URL starts a session with debugging enabled. Normal sessions do not render or log this diagnostic information.

Physics Debug reads Rapier's debug buffer only through the library's after-physics-step hook. It must not call `world.debugRender()` from an unrelated R3F frame callback while Rapier may be stepping or adding independent marker bodies; that overlap can trigger the WebAssembly unsafe-aliasing error and repeatedly remount the Canvas error boundary.

Plantings with asynchronously loaded Plant models do not use Rapier's automatic child-mesh collider discovery. Each Planting owns an explicit fixed collider: a small procedural bound while loading, followed by the measured whole-model bound reported through the established `ModelMarker3D` callback. This matches the stable general-Model path and prevents several independent Plant model graphs from changing automatic collider discovery while Rapier is creating bodies.

This is not a new marker schema or wrapper contract. `project_threed_markers`, the existing Runtime Marker builder, `ThreeDScene`, and each Sub-Module renderer retain their current responsibilities.

### Character-control regression watch

During manual development testing, saving one Model's scale previously reloaded the complete Project data. The Character model object was then reconstructed while its Ecctrl/selection runtime remained active, producing a severe split: WASD moved the blue halo while the visible Character stayed behind. The fix removed whole-Project reloads from marker CRUD and preserved unrelated marker identity through the scene bridge. The user verified that the Character, Ecctrl body, and halo now move together after another marker is edited.

Any future marker CRUD or scene-population change must repeat this sequence: edit a non-Character marker, confirm the Canvas does not reload, select a movable Character, Take Control, move with WASD, and confirm the Character plus halo move together. A hard refresh is not an acceptable workaround for a failed result.

This verifies the general Model path only. Direct placement excludes `used_by_characters = true`, and no Character Library workflow is implied by this production checkpoint.

## v0.18.7b Bed Project placement and editing

New Bed, Planting, Character, and FarmBot placement does not turn these assets into generic Models. The source `threed_*` row is the reusable origin, `project_assets` owns active Project membership, and `project_threed_markers` is authoritative for the saved Project instance after creation. A later change to the source row must not silently change an existing Project instance. Creation must commit these related records together so a failed placement cannot leave an unassigned source object or an ineligible marker.

The first implementation covers a new rectangular Bed. Its pre-placement form accepts name, width, length, height, color, Y rotation, and scale. Ground click creates the owned `threed_beds` record, Project assignment, and `beds-{sourceAssetId}` marker in one transaction, then injects only the returned Bed and marker into the persistent client Scene. Rendering and physics remain on `BedMarker3D` and its Bed-owned fixed RigidBody path. DetailsCard can update width, length, height, X/Y/Z position, degree-based Y rotation, scale, and color on only the saved `project_threed_markers` Bed instance; it does not mutate `threed_beds` or reload the Project. Rotation is displayed and stored in degrees, then converted to radians only at the Three.js/Rapier rendering boundary.

**Delete Bed** removes the selected Bed's marker and Project Asset assignment without rebuilding the Scene. A Dashboard-created Bed also removes its dedicated `threed_beds` source; an older reusable Bed keeps its source row so another Project may continue using it. Deletion is blocked while active Plantings still reference the Bed. The user must move or delete those Plantings first, which prevents silently breaking the Planting-to-Bed relationship.

Original assigned Beds do not write a Project instance merely because they render. A first-save Project-instance editor was tested and rolled back during Physics lifecycle diagnosis. Original assigned Beds therefore remain read-only in the Dashboard until that workflow can be added without changing the published v0.18.7c Rapier lifecycle.

### Manually verified Bed placement checkpoint

On August 24, 2026, the user verified both new Bed placement and existing Project Bed editing. Creation writes the owned `threed_beds` source, active `project_assets` relationship, and authoritative `project_threed_markers` instance together. Editing changes only the Project instance's width, length, height, X/Y/Z position, and degree-based Y rotation. The selected fixed Rapier body applies translation and rotation changes immediately, keeping its visual and collider aligned without refreshing the Project or remounting unrelated markers. Refresh restores the edited values, while later changes to the reusable source Bed do not overwrite the saved Project instance.

## Planting Project placement and editing after v0.18.7b

A Planting is not a generic Model. It references an owned active `threed_plants` record, may reference an active Bed assigned to the same Project and ThreeD module, and may render the model owned by its Plant. The Planting remains the Runtime Marker and fixed-RigidBody owner; the Plant model is only its visual. When no model is available or loading fails, `PlantMarker3D` remains the procedural fallback.

The Dashboard **Add Planting** panel loads the owner's active Plants, offers an optional assigned Project Bed, and accepts quantity, spacing, and model scale before entering one-shot ground placement. One transaction expands that request into an independent `threed_plantings` source, active `project_assets` assignment, and authoritative `project_threed_markers` instance for each requested Plant. All returned sources and markers are injected into the existing client Scene without a Project reload.

Selecting a saved Planting exposes Project-instance model scale and X/Y/Z position editing in DetailsCard. PATCH updates only the owner-scoped Project marker and synchronizes the existing fixed body translation immediately. It does not mutate the source Planting, Plant, optional Bed, or Model.

Planting quantity is a creation instruction, not a saved visual group. The server converts `spacing_in_inches` into Scene feet, calculates centered positions, and creates one complete `threed_plantings` source, `project_assets` assignment, and `project_threed_markers` instance per requested Plant. Every created Planting has `quantity = 1`, its own XYZ position, marker identity, visual, and fixed RigidBody. The complete batch is atomic: all requested Plantings are committed or none are.

DetailsCard edits only one selected Planting's model scale and XYZ position. Quantity and spacing are absent because changing either would change the number or layout of independent Plantings. **Delete Planting** removes the selected Project marker, its dedicated Project Asset assignment, and its dedicated source Planting together; sibling Plantings from the same creation request remain unchanged.

While any one-shot placement mode is active, a Bed click no longer changes the selected marker. The Bed surface instead supplies its actual world X/Y/Z point to the placement preview and create request. This permits a Planting to be placed on the top surface of a Bed rather than being forced to ground Y=0. This checkpoint is implemented and awaits manual verification.

An optional Bed assignment currently records and validates the Project relationship only. Bed-local clamping, rotation-aware offsets, forced surface Y, and oversized-layout rejection were rolled back during Rapier regression isolation. Plantings retain the XYZ positions requested during creation and editing. Spatial restriction and awareness must remain deferred until the normal Character-plus-fixed-marker physics Scene is stable again.

## Runtime Marker safety boundary

Database rows are untrusted input at the ThreeD Scene boundary. The Runtime Marker builder validates Project marker row identity, supported Sub-Module type, source asset identity, finite bounded XYZ position, positive bounded scale and dimensions, finite rotation, and duplicate marker IDs before a marker can reach R3F or Rapier. It applies the same position, identity, scale, and dimension checks to source Sub-Module rows.

Rejected records do not stop the Canvas and do not hide valid records. `UnifiedMapView` displays an expandable warning containing only the source table category, database row ID, marker ID, marker type, and bounded validation reasons. It never displays the marker JSON payload or owner information. Users can use those identifiers to correct or remove the bad record through the Admin Surface.

For an authenticated owner, a rejected `project_threed_markers` row also offers **Remove Saved Marker** after confirmation. This repair action deletes only that saved Project marker row and patches it out of client state without reloading the Canvas. It never deletes or changes the reusable source asset, Project Asset assignment, FarmBot credentials, MQTT state, or another marker. Source Sub-Module validation warnings remain informational because their owning Admin CRUD path must repair those records.

Validation itself does not repair, delete, or rewrite database data. The separate confirmed cleanup action is limited to the rejected saved row described above. This remains a fail-closed rendering guard and troubleshooting aid; database constraints and authenticated API validation remain the write-side authority.

Movable Characters have an additional pre-render Ecctrl safety check. One movable Character may own a protected Rapier capsule spawn area. If a later movable Character overlaps that horizontal and vertical area, the first stable marker remains available and only the later conflict is rejected before its Ecctrl body mounts. Each rejected Character appears in the bounded warning with its marker ID and retained spawn owner. Validation itself does not move records, rewrite Project data, delete rows, or convert Characters into GardenCharacters.

Rejected saved Character snapshots expose **Restore Source Position**. The authenticated repair reads the Character already present in the Project payload, submits its source XYZ values through the normal Character marker PATCH contract, and replaces only the repaired snapshot in client state. This allows the marker to re-enter the Scene without deleting the reusable Character or refreshing the complete Project. Uncontrolled Ecctrl mounts and clicks do not report temporary positions, preventing the same invalid snapshot pattern from being saved again.

For v0.18.8a, `ThreeDScene` passes the position already resolved by the Runtime Marker builder directly into `EcctrlCharacter`. Ecctrl uses that explicit position to initialize its Rapier body instead of independently reading embedded Character position fields or inventing a second spawn authority. The user manually verified that the retained Character remains selectable and that Take Control keeps its model, capsule, halo, camera tracking, and WASD movement together.

## Project marker CRUD and collider synchronization checkpoint

The Dashboard now exposes Project-instance Add/Edit/Delete coverage for Beds, FarmBots, Models, Plantings, and Characters while preserving each Sub-Module's runtime ownership. These operations patch only the selected `project_threed_markers` record and the matching Project source collection in client state. They do not reload the Project, remount the persistent Canvas or Rapier world, or rebuild unrelated markers.

- Bed instances edit dimensions, scale, color, XYZ position, and degree-based Y rotation.
- FarmBot placement selects an existing authenticated owner's active FarmBot. Its Project instance edits dimensions, scale, color, XYZ position, and degree-based Y rotation. Removing it deletes only its Project marker and assignment; it never deletes the reusable FarmBot, credentials, broker metadata, or MQTT records.
- Model instances edit their name, scale multiplier, XYZ position, and degree-based Y rotation. The underlying reusable `threed_models` row remains unchanged.
- Planting instances edit model scale and XYZ position. Each Planting remains an independent marker and source record.
- Character instances retain the established Character Library placement, position editing, deletion/re-placement, Garden/Ecctrl routing, and Scene-owned visual hierarchy.

Beds and FarmBots use explicit fixed cuboid colliders derived from the same Project-instance dimensions and scale as their visuals. Plantings use explicit bounds derived from the active procedural growth shape or loaded model path. Models continue to use measured whole-rendered-asset bounds. Position and rotation changes are applied to the existing fixed RigidBody before a physics step; dimension or scale changes replace only that marker's collider. Physics Debug therefore follows the edited visual without changing another marker's body or Character control state.

The user manually verified Bed, Planting, FarmBot, and Model editing plus collider synchronization. The verified regression sequence also confirms that selecting and controlling an Ecctrl Character after these marker transactions keeps the model, capsule, halo, camera, and WASD movement together.

## v0.18.9c visual hierarchy candidate

The Dashboard separates controls by ownership: Project actions live in the top-left Project dropdown, Scene presentation and Layer controls live in the top-right Controls menu, and marker actions plus Project-instance forms live in the DetailsCard. The Project dropdown has the highest Dashboard overlay priority so it remains available above marker and Scene panels.

DetailsCards share one compact visual shell across Characters, Beds, Plantings, Models, and FarmBots. The name and Close control remain in the header; module identity moves into metadata. Action Target, Zoom/Center, and Admin navigation use a small inline icon toolbar with accessible labels and hover titles. XYZ position rows and Width/Length/Height rows use equal thirds. Project-instance Save/Delete controls keep consistent locations, while Character animation controls use compact three-column rows to preserve Scene visibility.

These changes are presentation-only. They do not change marker identity, API requests, CRUD ownership, Action Target construction, camera behavior, Character animation dispatch, Canvas persistence, Rapier bodies, Scene Layers, MQTT safety, or physical-device authority.

## v0.18.9d ThreeD Scene navigation UX boundary

The v0.18.9d milestone is limited to small improvements that make the persistent ThreeD Scene easier to navigate and understand. Changes may improve camera-facing controls, navigation feedback, control placement, tooltips, or other visual guidance.

The first navigation rules preserve the user's active marker context while manipulating the Scene. Clicking or dragging over the ground no longer dismisses the DetailsCard; selection is cleared through the explicit Close control, Escape shortcut, or another intentional selection. Taking control of an Ecctrl Character starts in Stationary camera mode. If the user selects Follow and then zooms with the pointer wheel, the Dashboard returns the camera to Stationary so the user's chosen distance is retained. Broader Follow-camera behavior remains deferred.

This milestone must preserve:

- one persistent React Three Fiber Canvas and Rapier world;
- stable Runtime Marker identity and Sub-Module ownership;
- existing Project marker Add/Edit/Delete transactions;
- Character selection, Take/Release Control, Ecctrl WASD, camera tracking, and animation behavior;
- Scene Layer visibility and Physics Debug behavior; and
- the v0.18.9c Project dropdown and compact DetailsCard hierarchy.

Database schema, API contracts, marker position authority, collider ownership, and physical-device behavior are outside this milestone.

## Current development boundary

Phase 5E centralizes validated Runtime Marker-to-Action Target construction. Phase 5F centralizes target identity matching across the DetailsCard, refreshed Project data, and ThreeD scene highlighting using normalized Sub-Module type plus asset ID.

Phase 5G adds the provider-independent Runtime Marker registry core. ThreeD now owns supported marker-module normalization, canonical `moduleType:assetId` keys, derived scene marker IDs, saved/asset positions, optional live-position overrides, and current-position resolution. A complete Project marker refresh is validated before replacing registry state, retains a live override only for the same source identity, and rejects duplicate identities without partially changing the registry.

At the Phase 5G boundary, the registry was dormant. Later phases connect it through `UnifiedMapView` while keeping the registry core free of React, Three.js, physics, API, database, MQTT, worker, FarmBot, and physical-operation dependencies.

Phase 5H moves the existing Project asset-to-Runtime Marker transformation from `UnifiedMapView` into the provider-neutral ThreeD marker builder. The builder preserves the established five Sub-Module order, position-column and nested-position fallbacks, Plant lookup names, display-name fallbacks, colors, icons, active/visible defaults, source metadata, and omission of assets without usable positions. `UnifiedMapView` still owns memoization and all layer, text, active, asset-type, 2D, and 3D filtering.

At the Phase 5H boundary, the Phase 5G registry remained dormant. The builder itself does not register markers, change Project eligibility, alter layer behavior, or resolve Action Target positions.

Phase 5I creates one stable registry inside `UnifiedMapView` and synchronizes the complete builder output whenever authoritative Project marker data changes. This synchronization occurs from the unfiltered marker collection, so layer visibility, text search, active-only selection, and asset-type filters do not create or remove persisted source identity. A failed atomic synchronization clears the in-memory mirror and reports only the error class without logging marker data.

At the Phase 5I boundary, no component read registry state. Rendering, selection, scene positions, Ecctrl live-position storage, layers, and Action Target position resolution continued through their established paths. The registry is cleared when `UnifiedMapView` unmounts.

Phase 5J adds a transitional Ecctrl live-position write into the registry. `ThreeDMarkerComponent` supplies explicit marker module and asset identity rather than asking the registry to parse a scene marker string. `ThreeDScene` continues to update its established marker-ID position map first and continues forwarding the unchanged throttled Dashboard callback after the registry write. Ecctrl reporting remains limited to approximately 100 ms during controlled movement plus its existing control-state and click synchronization.

Registry live updates mutate only the matching in-memory position and return a success flag, avoiding immutable snapshot allocation on each movement report. At the Phase 5J boundary, camera focus, DetailsCard range, target-relative movement, and Action Target requests continued using their established position paths.

Phase 5K adds the explicit Project-save and restore boundary described above. The save provider reads complete current registry positions only when the user clicks **Save ThreeD Project**. The map load path merges eligible saved rows back into Runtime Markers, including the embedded position fields consumed by character scene construction.

Phase 5L registers an on-demand current-position resolver with the Dashboard. Runtime Marker selection uses it when creating an Action Target; DetailsCard proximity planning and generic interaction requests resolve the target again before use. Registry misses retain the established Runtime Marker or Action Target position as a safe compatibility fallback. Camera focus keeps its existing scene-local live-position map in this step, and GardenCharacter autonomous positions are not yet reported to the registry.

The completed persistence path declares `project_threed_markers`, provides its authenticated transactional API, connects the Dashboard's explicit Save control, and restores eligible saved rows through the Project map loader. It adds no automatic writer: movement, rendering, MQTT traffic, camera changes, and filters remain in memory until Save is clicked.

## Manual verification

1. Apply the generated schema and open an owned Project on `/dashboard/map`.
2. Confirm the Project renders normally before any snapshot exists.
3. Move an EcctrlCharacter, then inspect `project_threed_markers` before saving; no movement-triggered write should appear.
4. Open the Project dropdown and click **Save ThreeD Project**. Confirm the success toast reports the expected marker count.
5. Confirm one database row exists for every unfiltered Runtime Marker and the moved character row has `position_source = 'runtime'`.
6. Refresh the Dashboard. Confirm the character and all other markers restore at their saved positions and retain selection, layer, and Action Target behavior.
7. Remove a source asset's active Project assignment and refresh. Confirm its stale saved row does not render.
8. Recheck GardenCharacter wandering, Ecctrl Take/Release Control and WASD, camera modes, DetailsCard, targeted Water, Pick Fruit, and task-to-locomotion crossfades.

# Local and geographic position contract

The post-v0.19.0b positioning milestone gives every Project ThreeD Scene one geographic origin and gives every saved Project marker two synchronized representations of one location:

```text
Project ThreeD geographic origin
        ↓
Project-local X/Y/Z ↔ WGS84 latitude/longitude/altitude
        ↓                         ↓
R3F + Rapier                 Leaflet Map
```

The axes are explicit: local +X is geographic east when heading is zero, +Y is elevation, and -Z is geographic north. `heading_degrees` rotates Scene -Z clockwise from north. This preserves the Three.js ground-plane handedness: in a north-up overhead view, east is screen-right and north is screen-up rather than a reflected Map image. The established Bed dimensions and Planting spacing define one local Scene unit as one foot, so `meters_per_scene_unit` is `0.3048`. Beginning with the post-v0.19.0c precision milestone, horizontal distance, bearing, and forward/reverse projection use iterative WGS84 ellipsoidal geodesics rather than a latitude-dependent tangent approximation. Local Y remains a linear altitude offset because the two approved calibration references contain latitude/longitude only.

Local X/Y/Z remains the R3F and Rapier transform authority. Geographic latitude/longitude/altitude is the synchronized Map representation. A client may submit either a local edit or a geographic edit, but the authenticated server must calculate the other representation from the same Project origin in one transaction. Clients must not submit two independently authoritative positions.

## Drizzle geographic fields — migration boundary

The reviewed Drizzle schema now declares:

`project`:

- `origin_latitude decimal(10, 7)` — nullable until an existing Project is configured;
- `origin_longitude decimal(10, 7)` — nullable until configured;
- `origin_altitude decimal(12, 3)` — default `0` metres;
- `heading_degrees decimal(8, 3)` — default `0`;
- `meters_per_scene_unit decimal(12, 6)` — default `0.304800`, exactly one foot per local Scene unit.
- `calibration_point_a_local_x/z decimal(12, 3)` and `calibration_point_b_local_x/z decimal(12, 3)` — nullable until a two-point calibration is saved;
- `calibration_point_a_latitude/longitude decimal(10, 7)` and `calibration_point_b_latitude/longitude decimal(10, 7)` — the matching surveyed GPS references.

`project_threed_markers`:

- `latitude decimal(10, 7)` — nullable only during migration/backfill;
- `longitude decimal(10, 7)` — nullable only during migration/backfill;
- `altitude decimal(12, 3)` — nullable only during migration/backfill.

The parent Project owns the origin because one Dashboard Scene may combine several active `project_threed` assignments. Those assignments must not introduce competing coordinate origins into the same Canvas. Existing marker GPS values must be backfilled only after their owning Project origin is configured; the migration must not guess a universal origin for unrelated Projects.

The authenticated marker POST, PATCH, and explicit Project-save routes now derive marker latitude, longitude, and altitude from local X/Y/Z through that owned Project origin. A Project without a configured latitude/longitude retains nullable marker GPS values. The Project map response exposes the same origin. When an origin is configured, the Dashboard derives Leaflet display coordinates from authoritative local XYZ, preventing stale GPS after an origin, heading, or scale correction. R3F and Rapier continue to receive local X/Y/Z only. An explicit **Save ThreeD Project** refreshes persisted marker GPS values.

Marker selection preserves the same authority split. Clicking a marker in either the ThreeD Scene or Leaflet supplies local X/Y/Z to DetailsCard form controls. Leaflet latitude/longitude/altitude is carried separately as read-only GPS metadata; display-only spreading of overlapping Leaflet icons must not alter that stored/derived geographic value.

Leaflet marker anchors are exact projections of authoritative local XYZ. The Dashboard must not pre-spread local Runtime Markers, round GPS coordinates into overlap groups, or add latitude/longitude offsets to make icons easier to see; those presentation mutations create false positions at garden scale. Truly co-located markers may visually overlap. Future overlap handling must retain the geographic anchor and use a cluster or temporary click-only spiderfy presentation.

## Two-point Project coordinate calibration

An owned Project can be calibrated from **Edit Project → Project Coordinate Calibration** using two surveyed reference pairs. Each pair contains one local Scene X/Z position and the latitude/longitude of that same real-world point. The points must be distinct in both coordinate systems.

Calibration solves three Project-owned values together:

- `meters_per_scene_unit` from GPS distance divided by local X/Z distance;
- `heading_degrees` from the difference between the local and geographic point bearings;
- `origin_latitude` and `origin_longitude` by projecting either reference back to local `0,0`.

This replaces guessed scale correction with a measured Project transform. The authenticated Project PATCH applies the calibrated origin, heading, and scale in one database transaction, then recalculates latitude/longitude/altitude for every saved Project marker. Marker-local X/Y/Z, marker identity, Sub-Module data, R3F transforms, and Rapier bodies remain unchanged. Project origin altitude is retained because two latitude/longitude references do not independently determine vertical elevation.

The same successful transaction stores all eight submitted reference values on the Project. Returning to **Edit Project** therefore reloads the exact saved local/GPS pairs instead of presenting an empty Point B or attempting to reconstruct inputs from the calculated result. Legacy Projects retain nullable references and use the Project origin only as the initial Point A fallback until their first saved calibration.

The calibration form also reports the local reference span, ellipsoidal GPS span, solved metres-per-unit scale, and Point B endpoint residual. The residual describes how closely the solved two-point transform reproduces the submitted endpoint; it is not an independent GPS accuracy estimate. Survey/device accuracy still limits the result.

The ThreeD Scene receives the calibrated Project heading as view context. Its true-north compass projects geographic north through the active camera, so it remains accurate while the user orbits. **North-Up View** places the camera above the current OrbitControls target with geographic north at the top of the display. This is a camera operation only; it does not rotate the Scene, markers, or Rapier world.

## v0.19.0d precision checkpoint boundary

The v0.19.0d candidate replaces horizontal tangent approximations with shared iterative WGS84 ellipsoidal forward/inverse calculations, exposes calibration span/scale/residual diagnostics, and removes both local-coordinate and latitude/longitude overlap spreading from Leaflet input. Manual comparison confirms the north-up ThreeD and 2D layouts now closely match.

The release does not claim that two consumer GPS observations provide survey-grade accuracy. It preserves local XYZ as the R3F/Rapier authority, preserves Project altitude because the reference pairs contain no elevation, and does not move co-located markers merely to expose their icons. Future clustering or spiderfying must be temporary presentation behavior around the exact geographic anchor.

## v0.19.1a Project view-state milestone

**Save ThreeD Project** now captures a versioned presentation snapshot together with the complete Runtime Marker snapshot. The view state is stored under `project.config.threeDViewState`; no new table or schema field is required. The authenticated save route validates the bounded view contract and writes the marker snapshot and Project configuration in the same transaction.

The saved state includes:

- Dashboard view mode (`3d`, `2d`, or `combined`) and the combined-view panel split;
- Character camera mode;
- ThreeD camera position and OrbitControls target, which together reproduce orbit perspective and zoom distance;
- Leaflet center and zoom level;
- visible ThreeD Scene Layers, environment, auto-rotate, grid, legend, and gizmo preferences.

Restore occurs only after the relevant ThreeD or Leaflet controls exist. It does not remount the persistent Canvas or Rapier world and does not alter marker transforms. Invalid or obsolete view-state JSON is ignored during Project load rather than preventing marker data from rendering.

Transient interaction state is deliberately excluded: selected markers, DetailsCards, Take Control ownership, Action Targets, placement/edit modes, filters, open menus, and Physics Debug are never resumed from a saved Project. This keeps refresh restoration useful without reactivating input, diagnostics, or an unfinished mutation.

### Manual verification

1. Open an owned Project and choose **Combined View**. Resize the 3D/2D split.
2. Orbit and zoom the ThreeD camera, then pan and zoom Leaflet to a recognizable location.
3. Select a non-default camera mode, Scene Layer visibility, environment, grid, legend, or gizmo setting.
4. Click **Save ThreeD Project** and confirm the existing marker-count success toast.
5. Refresh `/dashboard/map` and confirm the view mode, panel split, ThreeD camera position/target, Leaflet center/zoom, camera mode, and saved display settings return.
6. Confirm no Character is automatically controlled, no marker or Action Target is selected, no DetailsCard or placement form opens, and Physics Debug remains off.
7. Confirm marker positions, Ecctrl Take/Release Control, WASD, collisions, Layer authority, and Project marker CRUD remain unchanged.

## Post-v0.19.1b authority-driven rendering boundary

The ThreeD Project uses separate, one-directional authorities rather than allowing UI surfaces or Sub-Modules to maintain competing Project state:

```text
project_threed_markers (saved Project-instance authority)
        ↓
Dashboard Project state (current client transaction)
        ↓
ThreeD Runtime Marker registry (identity and current-position reads)
        ↓
ThreeD Scene Sub-Module owner (visual and Rapier runtime)
        ↓
DetailsCard, camera, Layers, and 2D Map presentation
```

All marker Add/Edit/Delete responses now enter Dashboard state through `applyThreeDProjectClientTransaction`. The transaction updates the saved-marker collection and any returned Sub-Module source rows together while preserving unrelated collection and marker object identity. Marker CRUD must not reload the Project, Canvas, or Rapier world.

Ecctrl remains the Character movement and RigidBody authority. It reports live movement to the Runtime Marker registry; marker selection and Scene focus now resolve the registry-current position instead of treating the Scene-local Ecctrl bridge as a second shared position store. Dashboard `selectedMarker` owns marker selection identity. `ThreeDScene` derives Details/focus presentation from that selection and must not independently toggle a competing marker selection.

Project loading is a full-replacement boundary. A newer Project load aborts the previous request, and a stale response cannot overwrite the newly selected Project. Explicit Refresh uses that same boundary. Ordinary marker CRUD remains a targeted client transaction, while **Save ThreeD Project** remains the only operation that persists the complete registry snapshot.

Before any marker reaches React Three Fiber or Rapier, the Runtime Marker builder rejects unsafe identities, duplicate marker IDs, partial or non-finite XYZ positions, out-of-range transforms, non-positive scales/dimensions, and overlapping movable Ecctrl spawns. Rejected records produce bounded user-facing diagnostics while valid siblings continue rendering. This safety boundary does not mutate or delete database records automatically.

Scene Layers remain presentation/runtime-participation controls only. They may enable or disable a matching Sub-Module visual, pointer handling, RigidBody participation, and Physics Debug outline, but they do not own Project membership, marker identity, saved transforms, or the Runtime Marker collection.

### Stage 6 — current-position consumer parity

The Dashboard owns one Project-session Runtime Marker registry and supplies that same instance to separately mounted 3D and Leaflet surfaces. The registry supplies the same current local XYZ position to all established position consumers. ThreeD marker selection and Details/focus presentation, Action Target focus requests, explicit Project-save snapshots, and Leaflet geographic projection no longer independently choose between saved and live positions.

Ecctrl and Rapier remain the movement producers. Their throttled position report updates the shared registry without writing to the database. Registry subscribers notify the separately mounted Map surface, with identical positions producing no redundant notification. In Combined or 2D view, the Leaflet projection refreshes from registry-current XYZ at a maximum of four times per second and always receives a final trailing update; pure 3D view performs no map-projection rerender work. Switching into a Map-bearing view immediately derives marker geography from the latest registry state. **Save ThreeD Project** remains the only complete runtime-position persistence operation.

### Stage 7 — selected-marker identity across CRUD

Dashboard selection is retained by Project marker record identity across targeted updates. A successful Bed, Character, FarmBot, Model, or Planting PATCH reconciles the selected Runtime Marker from the returned authoritative marker record, including its name, presentation fields, local XYZ, instance data, and metadata. The DetailsCard therefore remains open and displays the saved values without requiring the user to reselect the marker.

Deleting a Project marker clears selection only when that exact Project marker record is selected. A CRUD transaction against another marker cannot dismiss or replace the user's active DetailsCard. This selection reconciliation changes no Runtime Marker key, Sub-Module renderer, RigidBody owner, or persistence boundary.

### Stage 8 — shared marker-operation lifecycle

The Dashboard header derives one active marker-operation status from the existing Add, Edit, Delete, and Move request states. Operations waiting for a Scene or Map destination are `ready` and may be cancelled. Once a POST, PATCH, or DELETE request begins, the same status becomes `pending`, displays progress, and cannot be cancelled from the header. An issued database request is allowed to resolve through its existing Sub-Module handler instead of being mistaken for an unfinished placement mode.

This is a presentation-level lifecycle over the established request locks; it is not a new marker authority or persistence service. Each Sub-Module retains its existing request guard, API contract, client transaction, Runtime Marker identity, renderer, and RigidBody owner. Pending mutations take deterministic priority over ready placement/move modes so the header never claims that two marker operations are simultaneously active.

Manual verification:

1. Start each Model, Character, FarmBot, Bed, and Planting placement mode. Confirm the header identifies the active placement and its X button cancels before a destination is chosen.
2. Start **Move Model** and confirm the header identifies the Model and allows cancellation before choosing a destination.
3. Complete one placement or move. While its request is running, confirm the header shows a spinner and disables cancellation; after success it clears.
4. Edit and delete disposable saved markers. Confirm the header reports the pending update or deletion, then clears after success or failure.
5. Confirm selection retention, DetailsCard pending buttons, targeted client-state updates, Leaflet current-position synchronization, Ecctrl Take/Release Control, and Rapier physics remain unchanged.

## v0.19.1d release-candidate boundary

The v0.19.1d candidate combines Stages 6–8 as **ThreeD Shared-Surface Operation Authority**. One Project-session Runtime Marker registry supplies current local positions to the ThreeD and Leaflet surfaces; Project marker updates retain DetailsCard selection by record identity; and the header exposes one deterministic Add/Edit/Delete/Move lifecycle without replacing the established Sub-Module request guards.

The candidate adds no schema, automatic persistence, Scene reload, secondary marker authority, or cross-Sub-Module RigidBody owner. Ecctrl remains authoritative for controlled Character movement, Rapier remains authoritative for runtime physics, and **Save ThreeD Project** remains the explicit complete-snapshot persistence boundary.

Release validation completed successfully:

- `npm run typecheck`;
- `npm run validate:threed-runtime-markers` — 37 groups;
- `npm run validate:threed-orchestration` — 18 groups;
- `git diff --check`;
- manual Add/Edit/Delete/Move lifecycle verification;
- manual `npm run build` in the client environment.

### Post-release placement surface continuity

Starting Planting placement uses the ThreeD surface already mounted by the active Dashboard view. In Combined View, **Place Planting** must retain the Combined surface and panel split; it must not switch to standalone 3D, remount `UnifiedMapView`, or reconstruct the Canvas/Rapier Scene merely to accept a ground click. The placement request and resulting Project marker transaction remain unchanged.

## v0.19.1e release-candidate boundary

The v0.19.1e candidate is a narrowly scoped surface-continuity fix. It removes the forced switch from Combined View to standalone 3D when **Place Planting** begins. The already-mounted ThreeD panel remains the placement surface, while Leaflet, the panel split, Runtime Marker registry, Canvas, and Rapier world remain mounted.

Manual interaction verification, `npm run typecheck`, all 37 Runtime Marker validation groups, and `git diff --check` passed. The client-side `npm run build` remains the final release gate.

## v0.19.2a Model Library preview-media boundary

The first v0.19.2 milestone reuses the existing nullable `threed_models.thumbnail_url` column as the canonical flat Model Library preview. It introduces no Drizzle or Neon schema change. Admin Model Create and Edit forms can upload, preview, replace, clear, or manually supply the image URL before saving the Model record.

Preview uploads use the authenticated existing Model upload route with an explicit `purpose=thumbnail` form field. Only JPG/JPEG, PNG, and WebP files from 1 byte through 5 MB are accepted. The server checks the extension, declared MIME type, and matching file signature before writing to the owner-scoped Vercel Blob `models/{userId}/previews/` path. Model POST, PUT, and PATCH normalize an empty preview to `null` and accept only HTTPS URLs whose paths end in a supported image extension.

This milestone does not yet add the Dashboard Model Library panel, drag-and-drop, Project marker creation, Scene rendering, or physics behavior. Removing or replacing the form value only changes the URL saved with the Model; it does not delete an earlier Blob object automatically.

### Manual verification

1. In Admin ThreeD Models, open **Add ThreeD Model** and upload a JPG, PNG, or WebP preview smaller than 5 MB.
2. Confirm the image preview appears, then save the Model and reopen Edit. Confirm the same preview is populated.
3. Upload a replacement image, save, reopen, and confirm the replacement URL and image persist.
4. Choose **Remove**, save, reopen, and confirm `thumbnail_url` is null and no preview appears.
5. Confirm an SVG, renamed non-image, mismatched image signature, or file larger than 5 MB is rejected without changing the form URL.
6. Set the Model active, public, and available as a Library item; confirm `GET /api/threed/models?scope=library` includes `thumbnailUrl`.
7. Confirm the existing GLB/GLTF/FBX/OBJ/USDZ primary upload and existing Model Library placement still work.

## v0.19.2b visual Model Library panel

The Dashboard Model Library is now a collapsible vertical workspace rail rather than a temporary overlay over the active surface. Opening it reserves horizontal workspace beside 3D, 2D, or Combined View. The active `UnifiedMapView`, R3F Canvas, Rapier world, Leaflet map, and Combined panel split keep their existing React identities and respond only to the available-size change.

Eligible Models render in a two-column image grid using the canonical `thumbnailUrl`. A Model without a preview receives a bounded Box placeholder. Selecting a card highlights it and displays Model type, base scale, Y rotation, and file size in a compact inspector. **Place** retains the established click-placement state, while dragging retains the existing Model ID payload; neither selection nor inspection writes Project data.

This milestone does not yet introduce a new cross-surface drag contract, drop preview, coordinate calculation, marker API, or Scene renderer. Completed placement continues through the established authenticated Project Model marker transaction.

### Manual verification

1. Open an owned Project in 3D, 2D, and Combined View and open the Model Library from the existing Add action.
2. Confirm the Library occupies a vertical rail beside the active workspace instead of covering it.
3. Toggle the Library closed and open; confirm the ThreeD camera, Leaflet location, Combined split, marker selection, and Ecctrl state remain intact.
4. Confirm uploaded previews render in a two-column grid and Models without previews show the Box placeholder.
5. Select several cards and confirm the highlight and metadata inspector follow the selected Model without starting placement.
6. Choose **Place**, click a valid destination, and confirm the existing one-marker Project transaction still succeeds.
7. Drag a Model using the existing behavior and confirm no Project write occurs until a valid drop is completed.

## v0.19.2c selected-Model click placement

Grid-card **Place**, inspector **Place Selected**, and Model drag-start now enter one Dashboard-owned Model Library placement-selection function. That function records the selected reusable Model and resets only its instance-scale draft. It does not switch view mode, calculate a destination, write Project data, or create another placement authority.

The currently mounted surface remains responsible for the destination: R3F supplies local XYZ from a ThreeD ground click, while Leaflet supplies a geographic click that the established Project coordinate transform converts to local XYZ. Combined View retains both surfaces and accepts the destination from the one the user clicks. All three routes then call the same authenticated Project Model marker POST and targeted client transaction.

### Manual verification

1. In 3D View, select a Model card, choose **Place Selected in 3D Scene**, and click the ground. Confirm one Model marker appears without a view change or Project reload.
2. In 2D View, select a different reusable Model, choose **Place Selected in 2D Map**, and click the map. Confirm the marker appears at matching local/GPS coordinates.
3. In Combined View, repeat once using the ThreeD panel and once using Leaflet. Confirm the view and split remain unchanged and each completed click creates exactly one marker.
4. Start placement and choose Cancel from either the header operation status or Library placement status. Confirm no POST occurs.
5. Enter an invalid instance scale and confirm placement is rejected before a request.
6. Confirm selecting and inspecting cards alone creates no network request and does not clear existing Scene marker selection.

## v0.19.2d bounded cross-surface Model drag

Model Library drag-and-drop now uses one versioned MIME payload containing exactly `version`, `kind`, and the reusable positive integer `modelId`. It carries no Project ID, ThreeD module ID, instance transform, local position, geographic coordinate, file path, URL, metadata, or persistence instruction. Both destination surfaces parse the payload independently and require its Model ID to match the Dashboard's currently selected placement Model.

During drag-over, the ThreeD Canvas or Leaflet container displays cyan boundary feedback for the expected Model Library MIME type and red feedback for an invalid drag. Invalid, malformed, mismatched, oversized, extra-field, or unsupported-version payloads cannot reach the placement callback. Leaving or dropping clears the feedback. A valid drop derives its position from the receiving surface and calls the same established Model placement handler exactly once.

### Manual verification

1. In 3D View, drag a preview card over the Scene. Confirm the Canvas boundary turns cyan, then drop and confirm exactly one POST and one new marker.
2. In 2D View, drag a different card over Leaflet. Confirm cyan feedback and one marker at the matching calibrated local/GPS position.
3. In Combined View, drag once onto each panel. Confirm only the receiving panel highlights and each completed drop creates one marker without changing the view or split.
4. Drag an ordinary browser image, text selection, or file over either surface. Confirm red feedback and no marker POST.
5. Begin dragging one Model, then select a different Model before completing a synthetic/manual drop if the browser permits it. Confirm the mismatched Model ID is rejected.
6. Drag outside all valid destinations or press Escape. Confirm feedback clears and no Project write occurs.
7. Recheck click placement, cancellation, invalid instance scale, repeated Model instances, DetailsCard CRUD, and explicit **Save ThreeD Project**.

## v0.19.2a release-candidate boundary

The v0.19.2a candidate combines the preview-media, visual Library panel, selected-Model click placement, and bounded cross-surface drag milestones as **Visual ThreeD Model Library and Cross-Surface Placement**.

The release reuses `threed_models.thumbnail_url`, adds authenticated owner-scoped JPG/PNG/WebP Vercel Blob uploads, and presents eligible non-Character Models in a selectable image grid beside the persistent 3D, 2D, or Combined workspace. Click placement and versioned identity-only drag payloads both resolve destinations through the receiving surface and finish through the established authenticated `project_threed_markers` Model transaction.

It adds no schema, replacement Model table, drag-supplied coordinates, secondary placement API, automatic persistence, Canvas/Rapier remount, or Character Model placement. Manual verification confirms preview create/edit/remove behavior, Library surface continuity, click placement, valid/invalid drag feedback, cancellation, and exactly one marker transaction per successful destination.

Release validation completed successfully:

- `npm run typecheck`;
- `npm run validate:threed-runtime-markers` — 38 groups;
- `git diff --check`;
- documented v0.19.2a–d manual verification.

The client-side `npm run build` remains the final release gate.

## v0.19.3a ThreeD Model taxonomy boundary

The Model Library taxonomy is owner-scoped and normalized through `threed_model_categories` plus the `threed_model_category_assignments` junction. Categories may form a parent/child hierarchy, while a reusable `threed_models` record may have multiple category assignments. Category ownership is administrative metadata; it does not replace Model visibility, Library eligibility, Plant/Character routing, Project marker identity, rendering, or physics authority.

The authenticated `/api/threed/model-categories?id=X` route follows the App's consolidated CRUD convention. Category slugs are unique per owner, parent changes reject cross-owner references and hierarchy cycles, and deletion requires child categories to be moved or removed first. Deleting a category removes only junction assignments; it never deletes a Model, stored file, Blob object, or Project marker.

Model create and update transactions validate every requested category against the Model owner and update Model/category assignments together. Public Library responses expose only bounded category identity, name, slug, and parent identity. The visual Library derives its category filter from returned eligible Models; filtering does not remount the Canvas, Rapier world, Leaflet map, or persistent marker collection.

## v0.19.3b dry-run Model manifest boundary

The version-1 ThreeD Model import manifest is metadata-only. It contains relative references to existing local Model and preview files but never embeds binary data, database IDs, owner IDs, Project IDs, marker transforms, storage credentials, Blob destinations, or persistence instructions. A stable `importKey` is the future idempotency identity; it is not a `threed_models.id`.

`npm run threed:models:import:check -- --file <manifest.json>` parses the strict contract, verifies bounded entries and supported relative file references, resolves real paths beneath the manifest directory, checks file existence and size, and prints a summary. OBJ material files, textures, GLTF buffers, and other required sidecars are declared explicitly in the bounded `supportingFiles` array so the eventual importer cannot mistake a primary OBJ or GLTF file for a complete renderable asset. It imports nothing, opens no database connection, and performs no upload. `npm run validate:threed-model-import` exercises the pure contract offline.

The dry-run boundary rejects unsupported versions and fields, duplicate or malformed import keys, absolute and escaping paths, unsupported Model/preview extensions, mismatched concrete Model types, invalid category slugs, unsafe transforms, oversized metadata, more than 500 Models, or more than 20 categories per Model. Write behavior remains deferred to separately approved v0.19.3c.

Executable import, extraction, generation, and validation code belongs under the tracked App-owned `src/lib/scripts` and `src/lib/services/threed/models` boundaries. Ignored `reference/` directories are read-only source inputs and generated local output only; package commands must never execute scripts stored there. The tracked legacy pilot generator accepts explicit `--source` and `--output` paths, validates its generated manifest through the same contract core, and writes no database or storage data.

## v0.19.3c reviewed Model import boundary

The App-owned `npm run threed:models:import` command is the only bulk Model write boundary. It requires explicit `--file`, `--report`, `--user-id`, and `--apply` arguments. Omitting `--apply` fails closed. Every manifest entry must also carry `metadata.importReviewStatus: "approved"`; the generated legacy pilot intentionally remains `pre-import` until its dimensions, unit interpretation, scale, metadata, and category assignments have been reviewed. The importer checks the entire local file plan before opening its write workflow and requires the target user plus every referenced active owner-scoped category to exist before uploading an asset.

```bash
npm run threed:models:import:check -- --file <manifest.json>
npm run threed:models:import -- \
  --file <reviewed-manifest.json> \
  --report <import-report.json> \
  --user-id <owner-user-id> \
  --apply
```

Each approved entry uploads its primary Model, optional preview, and declared sidecars into one stable owner/import-key Blob bundle. The importer creates or updates the owner-scoped `threed_models` row by `metadata.importKey`, adds missing category assignments, and creates or updates importer-owned `threed_model_files` sidecar records. It processes entries sequentially, records created/updated/failed outcomes in bounded JSON, and never creates categories, Projects, Project assets, `project_threed_markers`, Scene objects, or runtime physics bodies. It also does not delete Models, assignments, file records, or Blob objects. A database failure after an upload may leave an unreferenced object at that entry's stable Blob path; rerunning the same reviewed manifest reuses that path and import identity.

The ignored `reference/` tree remains non-authoritative test input. Generation, validation, containment checks, Blob path construction, ownership checks, and persistence orchestration all execute from tracked App source under `src/lib`. No import command executes code from a reference asset bundle.

The authenticated Admin Model workflow remains the existing `ThreeDModelsCRUD`; it is not manifest-driven. **Add Model** accepts one deliberate primary Model upload, an optional Library preview, taxonomy, transforms, usage flags, and metadata before creating one `threed_models` record. **Edit Model** supports a deliberate replacement primary upload and preview while retaining the same Model identity. After creation, **Model Files** attaches explicitly selected textures, buffers, or other supporting files through the existing `threed_model_files` relationship. The Admin UI does not unzip archives, scan directories, infer bundles, create multiple Models from one upload, or create Project markers. Manifest-based bulk import remains a separate Super Admin package-script boundary.

**Bulk Add** is a bounded queue in front of that same Admin Add Model contract. The user explicitly selects up to 100 primary FBX, GLB, GLTF, or OBJ files, reviews the proposed name and scale for every row, and selects shared taxonomy and visibility/usage flags. Primary files are inspected locally without fetching remote resources: OBJ `mtllib` references, MTL texture maps, GLTF external buffers/images, GLB JSON-chunk URIs, and detectable FBX texture filenames become exact companion-file requirements. The Admin selects those files deliberately per Model and may also attach additional support files and one JPG, PNG, or WebP Library preview. No archive is extracted and no directory is scanned.

The client processes Models sequentially through the existing authenticated APIs. It uploads the primary and optional preview, creates one independent `threed_models` record as pending/inactive, uploads each companion through the existing `threed_model_files` relationship, then activates the Model only after those operations succeed. A failed row remains visible and retryable; a Model already created during a partial failure remains inactive and available for repair rather than being presented as a complete Library item. The queue never creates categories, Projects, Project assets, Project markers, Scene objects, or physics bodies. This milestone records complete Model file relationships; resolving those relationships in each runtime loader remains a separate rendering milestone.

Every `threed_model_files` attachment also records a model-relative logical path independently from its Blob storage URL. Bulk Add proposes paths discovered from OBJ, MTL, FBX, GLTF, and GLB references, while the Admin may deliberately replace each proposed path before upload. Paths use normalized forward slashes, preserve nested bundle structure such as `materials/chair.mtl` and `textures/chair.png`, and must be unique within a Model. Absolute paths, URL schemes, null bytes, and paths that escape the Model root are rejected. Existing attachment workflows default to the uploaded filename, preserving backward behavior. The new `relative_path` column requires the normal reviewed `db:generate` and `db:push` workflow before runtime verification.

## v0.19.3a release-candidate boundary

The v0.19.3a candidate combines the completed taxonomy, manifest validation, reviewed script import, and Admin Bulk Add stages as **ThreeD Model Taxonomy and Bundle Import**. It establishes `threed_models` as the reusable Model authority, owner-scoped categories as its filtering taxonomy, and `threed_model_files.relative_path` as the logical bundle-path authority distinct from physical Blob URLs. Bulk records remain pending/inactive until their explicitly selected companions persist successfully.

This checkpoint was released successfully to production through GitHub and Vercel on August 31, 2026.

This checkpoint does not claim runtime resolution of companion-file URLs, Character placement through general Model rules, automatic Project population, or a Project Asset inventory panel. Those belong to the next staged work: begin with a blank Project, expose which reusable Models and Characters are eligible for placement, place them only through their correct Sub-Module runtime, and add a sibling Project Assets panel for finding, selecting, focusing, and managing every assigned or placed Project asset without remounting the Scene.

Release validation requires the importer contract validation, TypeScript, diff checks, manual Admin import verification for at least one external-file bundle, the client-run production build, and confirmation that existing Model/Character placement and persistent Canvas/Rapier behavior remain unchanged.

## v0.19.3b Project environment release-candidate boundary

A Project Model marker may carry the bounded metadata role `placementRole: "environment"`; ordinary placements default to `"object"`. This role remains part of the existing `project_threed_markers` Model-instance authority and does not introduce another Model, terrain, Scene, or Project table. The Add Model placement panel and existing Model DetailsCard can set or change the role.

When at least one active, visible environment Model is present on the visible Models Layer, the Scene hides only the procedural grass material. Its invisible placement plane and fixed Rapier floor remain mounted at the established Scene origin. Environment Models deliberately omit the ordinary whole-asset cuboid collider because one farm-scale axis-aligned box would turn the entire environment volume into an obstacle. Ordinary Project Models retain their established loaded-boundary collider behavior.

During an active Add/Move placement operation, pointer events on a visible Project Model—including an environment Model—resolve the clicked world position into the existing placement callback instead of selecting that Model and swallowing the transaction. This establishes a safe flat-floor environment milestone; detailed mesh/terrain colliders and elevation-aware navigation remain separately gated because they require explicit performance and Character-grounding decisions.

The v0.19.3b candidate packages this boundary as **ThreeD Project Environment Models**. It changes no database schema and does not route Character Models through general Model rules, alter GardenCharacter/EcctrlCharacter ownership, add terrain-mesh physics, or remount the persistent Canvas/Rapier world.

This checkpoint was released successfully to production through GitHub and Vercel on August 31, 2026.

### Release verification

1. Open an owned blank Project with its ThreeD module and place a farm-scale Model at local `0,0,0`.
2. Mark that Project Model as **Project environment / base map** and save its placement.
3. Confirm the procedural grass and shadow surfaces disappear immediately while the environment Model remains visible.
4. Start another Model placement and confirm pointer interaction over the environment reaches the existing placement operation.
5. Change the Model role back to an ordinary object and confirm the procedural ground returns.
6. Confirm ordinary Project Models retain their established whole-rendered-asset fixed colliders.
7. Confirm Project refresh restores the saved environment role without a Scene or Project reload during the edit transaction.

Automated release checks require `npm run validate:threed-runtime-markers`, `npm run typecheck`, and `git diff --check`. The client-run `npm run build` and a final Character placement regression remain the production release gate.

## Post-v0.19.3c environment collision audit

Environment collision begins with a read-only geometry audit at the established post-load Model measurement boundary. After R3F has attached the external scene graph and the Model's stored transforms, Project instance scale, grounding, and nested transforms are active, `ModelMarker3D` counts triangle meshes and triangles and reports skinned or invalid geometry. It does not copy vertex buffers, create a Rapier collider, alter the fixed floor, or change Character physics.

The pure audit classifies geometry as `ready`, `empty`, `unsupported`, or `too_complex`. The initial future-collider ceiling is 256 meshes and 250,000 triangles. Skinned meshes fail closed because animated collision requires different ownership rules. When Physics Debug is active, an environment Model's existing `[ThreeD Model Physics]` `console.debug` entry includes the audit and transformed bounds. Ordinary Project Models retain their existing diagnostics and colliders.

This audit is evidence for the next explicit environment collision-mode decision. A `ready` result does not activate collision by itself.

## Model Runtime Adapter support boundary

A reusable `threed_models.metadata.runtimeAdapterKey` may select a source-controlled React Three Fiber visual adapter from the App registry. The key is a bounded lowercase identifier only. It is never evaluated as JSX, interpreted as a module path or URL, or allowed to import code from the database, Blob storage, an upload, or the ignored `reference/` tree. Missing, invalid, or unregistered keys retain the established generic loaded-scene renderer.

`ModelMarker3D` remains the binary-loading and post-transform measurement boundary. A registered adapter receives only that marker-owned, already-loaded and cloned Three.js group plus read-only reusable Model configuration. It may construct a curated visual subtree from named meshes, materials, bones, or groups. It does not receive Project Marker transforms, Runtime Marker identity, selection state, Scene controls, CRUD callbacks, Rapier bodies/colliders, or database access.

The authority order is unchanged: `threed_models` and `threed_model_files` own reusable asset identity and files; `project_threed_markers` owns the Project instance and transform; the persistent Canvas/Rapier marker owner controls Scene lifecycle and physics; the optional TSX adapter is supportive visual construction only. The initial `source-scene-v1` adapter deliberately reproduces the existing `<primitive>` construction and provides a safe registration example. No existing Model selects it automatically, and this support stage introduces no schema or active collision change.

Curated environment adapters may later expose named terrain, structure, fence, foliage, and decoration groups to an explicitly approved collision policy. Generated TSX is starting material for such an adapter, not executable user content and not a replacement for Model Library or Project Marker authority.

Before a curated adapter is authored, the environment geometry audit reports a deterministic inventory of the 64 highest-triangle mesh paths, mesh types, and triangle counts. Remaining meshes are represented only by `omittedEntryCount`; vertex/index buffers and unbounded user metadata never enter the diagnostic. The inventory appears inside the environment Model's existing Physics-Debug-only `geometryAudit.meshInventory` output. It is evidence for naming and grouping the real uploaded asset, not an automatic semantic classifier or collision instruction.

The authenticated read-only `GET /api/threed/models/runtime-inspection?id=<modelId>` route provides the same adapter-authoring evidence as JSON without relying on browser console copying. It authorizes the requested Model through the established owner-or-eligible-public-Library boundary and reads only the stored Model URL. For GLB, it streams the header and declared JSON chunk and cancels before the binary geometry payload; for GLTF, it accepts at most 16 MiB of JSON. FBX inspection accepts at most 256 MiB and uses the installed Three.js parser with a server-only inert texture handler, preserving hierarchy and geometry while preventing DOM use and texture/supporting-file requests. It does not accept caller-supplied URLs, write Model metadata, create a Project Marker, or activate physics. OBJ, USDZ, procedural, and generic Model types fail explicitly until separately reviewed format parsers exist.

The route's `sourceComponents` result exposes exact source paths, mesh types, and triangle counts through `componentOffset` (0–100,000), `componentLimit` (1–200), and an optional bounded `componentSearch`. Results are sorted by exact source path and report the filtered total. The protocol does not derive source-name families, vendor concepts, provider fields, semantic roles, or collision behavior. Source names remain evidence only; a future reviewed mapping must assign only App-generic roles such as terrain, structure, barrier, vehicle, vegetation, decoration, interaction, or unclassified.

The v0.19.3d API response contract, query limits, authorization boundary, and sanitized JSON examples are documented in [ThreeD Model runtime API](THREED_MODEL_RUNTIME_API.md). The captured Model 15 response is release evidence, not a checked-in copy of account identifiers, Blob URLs, or the full source-component inventory.

## v0.19.3d release-candidate boundary

The v0.19.3d candidate packages the Model Runtime Adapter registry, environment geometry audit, and authenticated Model Runtime Inspection route as **ThreeD Model Runtime Inspection API**. It replaces browser-console copying with bounded JSON evidence while preserving `threed_models` and `threed_model_files` as reusable-asset authority, `project_threed_markers` as Project-instance authority, and the persistent ThreeD Scene as rendering and physics authority.

The candidate activates no environment collider and assigns no semantic role from a filename. It adds no schema, accepts no caller-supplied asset URL, evaluates no uploaded JSX/TSX, and does not change Character, Project placement, or Rapier ownership. Production release remains gated on automated validation, a successful build, authenticated API checks, and Scene regression testing.

## Model Runtime Adapter development plan

### Evidence checkpoint

The first production-sized environment inspection proves why runtime construction and physics policy must remain separate. The inspected FBX contains 5,411 meshes and 2,185,617 triangles, with finite bounds, no skinned meshes, and no invalid mesh geometry. It correctly fails the initial whole-environment collider ceiling of 256 meshes and 250,000 triangles. Its top-triangle inventory includes buildings, vehicles, vegetation, and decoration, while a bounded source-component search for one fence-related source prefix returns 768 exact meshes.

Within that 768-component result, repeated source components commonly contain 104-triangle fence sections, 66-triangle poles, 120- or 332-triangle gates, and 156- or 172-triangle gate doors. This is evidence that neither one whole-environment collider nor hundreds of independent per-mesh trimesh colliders is an acceptable default. Triangle count alone is also not a geometry identity and must not be used as one.

### Vocabulary and authority constraints

Runtime Adapter APIs, schemas, TypeScript types, registry identifiers, and collision policies must use App-generic vocabulary. Vendor names, asset-pack names, provider names, Project names, and source filename fragments must not become permanent field names, type names, semantic roles, or collision strategies. Exact imported node paths may appear only as reviewed selector values and diagnostic source evidence.

The generic semantic roles are initially bounded to:

- `terrain`;
- `structure`;
- `barrier`;
- `vehicle`;
- `vegetation`;
- `decoration`;
- `interaction`; and
- `unclassified`.

An imported name does not assign a role automatically. A source name containing words such as building, fence, tree, road, ground, or vehicle may support a review suggestion, but it remains `unclassified` until an explicit reviewed mapping selects it. Runtime Adapter TSX remains supportive visual construction only. It never owns Model identity, Project placement, Runtime Marker identity, transforms, Layers, selection, CRUD, Canvas lifecycle, Rapier bodies, or persistence.

### Proposed reviewed mapping contract

A future versioned mapping may associate exact or bounded source-path selectors with generic roles and separately reviewed construction strategies. Selector property names remain generic; any source-specific text exists only in the selector value.

```json
{
  "version": 1,
  "adapterKey": "environment-structure-v1",
  "rules": [
    {
      "role": "barrier",
      "selector": {
        "kind": "source-path-prefix",
        "value": "<reviewed source prefix>"
      },
      "constructionStrategy": "spatially-merged-bounds"
    }
  ]
}
```

This example is a proposed review contract, not an implemented database field or active physics instruction. The final parser must reject unsupported versions, extra fields, unknown roles or strategies, unbounded selectors, duplicate rules, empty matches, and rules that exceed component or output limits. Missing mappings and unmatched components remain `unclassified` and visual-only.

### Proposed development stages

1. **Neutral geometry signatures:** extend read-only inspection with bounded structural signatures derived from geometry facts such as vertex/index counts, local bounds, primitive type, and material structure. A signature groups structurally equivalent evidence; it does not assign semantic meaning or physics.
2. **Reviewed mapping parser:** implement an offline, deterministic, versioned parser for generic roles, selectors, and construction strategies. Add validation fixtures without database access, file uploads, R3F, or Rapier.
3. **Read-only mapping preview:** apply a proposed mapping to inspection results and return matched/unmatched counts, triangle totals, representative source paths, and limit violations as JSON. Preview performs no Model update and creates no collider.
4. **Deliberate Model association:** after separate approval, allow an authorized Admin to associate a reviewed mapping/adapter key with reusable Model metadata. This must be an explicit save transaction, never a render-time write or name-derived automatic assignment.
5. **Visual Runtime Adapter:** register a source-controlled `environment-structure-v1` adapter that consumes the already-loaded marker-owned object and the reviewed mapping. Preserve the imported visual hierarchy unless a measured optimization is approved. Unknown or missing adapters retain the generic renderer.
6. **Collision-plan preview:** derive proposed generic collider descriptions outside Rapier. Terrain, structures, barriers, vehicles, and vegetation require distinct bounded strategies. Physics Debug must visualize the proposed plan before it becomes active.
7. **Spatial simplification:** merge or simplify repeated components using world-space evidence and explicit tolerances. Hundreds of fence pieces must not automatically become hundreds of trimesh colliders. Merging must preserve gates, openings, walkable areas, and Character scale.
8. **Scene-owned Rapier activation:** only after manual approval and performance verification may the persistent marker owner create fixed colliders from the reviewed plan. The Runtime Adapter still creates no RigidBody. Layer visibility, marker transforms, Physics Debug, Character spawn safety, Take/Release Control, and Ecctrl movement remain release-blocking regressions.

Each stage is a separate proof, implementation, validation, and approval boundary. No stage authorizes the next stage, schema changes, automatic database mutation, arbitrary uploaded JSX/TSX execution, or environment collision activation.

## v0.19.4a reviewed component mapping preview

The first v0.19.4 stage implements the offline mathematical boundary behind stage 2 above. `environment-component-mapping-core.ts` strictly parses a versioned mapping containing 1–64 reviewed rules. Rules use only generic semantic roles, exact or prefix source-path selectors, and bounded construction-strategy names. Extra fields, unsupported versions, malformed identifiers, unknown roles or strategies, control characters, duplicate rule IDs, and duplicate selectors fail closed.

The pure preview evaluates at most 100,000 source components. It returns source, matched, unmatched, conflicting, and collision-candidate component and triangle totals, bounded representative paths, and per-rule aggregates. A component matching more than one rule is reported as a conflict and remains unassigned. `visual-only` matches are counted as reviewed but never as collision candidates.

This step provides no API handler, database association, Runtime Adapter selection, geometry buffers, collider descriptions, R3F objects, or Rapier activation. Its acceptance criterion is deterministic offline proof that a proposed mapping can account for imported source evidence without silently resolving overlaps or inferring meaning from asset names.

## v0.19.4a Environment collision debug preview

The active v0.19.4a candidate adds a direct Scene-side preview for the actual goal: making Characters collide with visible structures inside a Project Environment Model. After the Environment Model is loaded and attached, `ModelMarker3D` transforms each static mesh geometry bounding box into the owning Environment marker's local coordinates. The pure preview planner rejects invalid and extremely small boxes, excludes broad flat floor-like boxes already covered by the established environment floor, and merges only near-identical duplicate bounds. Adjacent Environment objects remain separate preview candidates.

The planner accepts at most 10,000 source boxes and returns at most 2,048 preview boxes. Eligible boxes alternate between spatial coverage across the Environment footprint and proximity to the geometry dataset's median center before the output limit is applied. This prevents the largest or most distant meshes from consuming the entire preview budget while retaining central structures. It reports source, eligible, invalid, tiny, floor-like, merged, omitted, and final preview counts. Physics Debug batches every proposed cyan box into one line-segment geometry, displayed above normal depth testing and without frustum culling under the existing Environment marker transform. The preview ignores pointer input and does not alter the imported Model's materials or transparency.

This stage creates no Rapier collider for internal Environment meshes. It adds no API, database field, uploaded code, name-based semantic classification, Runtime Adapter selection, or Project Marker mutation. The cyan boxes must be visually reviewed before any box is allowed to become a fixed Scene-owned collider.

The established Scene safety floor remains the only Environment-area collision surface in this preview stage. A visible Environment Model selects a deterministic 500-unit safety-floor footprint at initial Scene render instead of the former minimum footprint derived only from marker origin points. This prevents a controlled Character from falling indefinitely at the former small procedural-ground edge while keeping the visual procedural ground hidden and avoiding any late Rapier collider replacement beneath Ecctrl.

Ecctrl retains ownership of Character movement and stopping. This candidate raises only Ecctrl's supported `decDeltaTime` and `slideGripFactor` inputs for both loaded and fallback Character paths, reducing post-input sliding without imperative velocity writes or animation-state changes.

### Manual approval gate

1. Open a Project containing an Environment Model and a movable Character.
2. Confirm the Environment and Character load normally with Physics Debug off.
3. Enable **Physics Debug** and allow the one-time Environment measurement to complete.
4. Confirm cyan boxes appear around visible structures and remain aligned while orbiting and zooming.
5. Inspect buildings, fences, barrels, trees, paths, and open walking areas. Record any missing structure or box that blocks an opening.
6. Confirm the console's bounded `collisionPreview` summary contains no component paths or geometry arrays.
7. Confirm the Character still uses only the established safety floor and can pass through the cyan boxes; internal Environment boxes are diagnostic-only in this stage.
8. Walk toward and beyond the former procedural-ground edge. Confirm the Character remains supported throughout the visible Environment footprint instead of falling indefinitely.
9. Hide and show the Models Layer and confirm the Environment and its cyan preview disappear and return together without remounting the Canvas or moving the Character.
10. Move, rotate, or scale the Environment Project marker if available and confirm the preview remains aligned with that marker transform.
11. Confirm no Rapier, Rust/WASM, WebGL, or repeated frame error occurs.

## Historical deferred Environment cuboid activation experiment

The first attempted activation mounted up to 512 fixed Environment cuboids after the loaded preview became available. Its manual gate failed because the assigned ThreeD Character was not visible or selectable at Project load. Adding Character spawn-clearance filtering did not restore the Character, disproving collider overlap at the saved spawn position as a sufficient explanation.

At that checkpoint all internal Environment `CuboidCollider` rendering was disabled. The verified cyan preview, stable Environment safety floor, and pure bounded activation-planning tests remained available, while the Scene created zero Rapier objects from the internal preview boxes. Character visibility and accessibility remained release-blocking and took precedence over Environment collision activation.

The next activation attempt was required to begin with a substantially smaller isolated collider set and prove Character mount order, visibility, selection, Ecctrl readiness, and Rapier stability before scaling the collider count. The original failed 512-collider path was not a release candidate.

## v0.19.4a release-candidate boundary

**ThreeD Environment Preview and Character Runtime Safety** is the stable checkpoint before another Environment-collider activation attempt.

This checkpoint was released successfully to production on September 3, 2026.

The Scene loads Project Models before admitting Character markers. Each Model explicitly reports that its asset load has either succeeded or failed; only after all Project Models settle may a Character enter the persistent Rapier world. The Character loader likewise publishes its visual hierarchy only after the complete embedded/external animation collection, mixer actions, and semantic animation map are ready. This prevents an arms-out base-pose model or an early Ecctrl body from entering an incomplete Environment.

Saved Character positions have a Character-specific Ecctrl safety envelope distinct from the larger coordinate range supported by static Environment Models. A corrupt saved Character transform is rejected before Runtime Marker registration and Rapier construction. When its source Character remains valid, the Project snapshot is recovered in memory at the source position and the UI reports the recovery rather than claiming that the Character itself was skipped. Project loading does not silently rewrite the database row. New Character placement/update requests enforce the same safety envelope.

While an Ecctrl Character is controlled, the DetailsCard metadata remains a bounded live display. The disabled Project Character Instance XYZ inputs adopt the same concise coordinates after movement settles instead of copying long floating-point values on every physics frame. After Release Control, the final values remain available for the user's explicit **Save Position** transaction. Movement frames do not write to `project_threed_markers`.

The cyan Environment collision boxes remain debug-only descriptions. No internal Environment box is an active Rapier collider in this checkpoint. The next stage must activate a small bounded subset through the persistent Environment marker owner and independently prove Character visibility, idle/walk/run animation, capsule/model alignment, smooth WASD stopping, Layer behavior, and an error-free Rapier frame loop before increasing coverage.

Automated release checks require `npm run validate:threed-runtime-markers`, `npm run typecheck`, and `git diff --check`. The client-run `npm run build` and final Environment-plus-Character interaction check remain the production release gate.

## v0.19.4b Environment interaction UX boundary

The Environment/Base Map is a stationary Scene surface rather than an ordinary selectable object. Direct clicks on its rendered geometry no longer replace the active marker selection or open the Environment DetailsCard. Its geometry continues to accept deliberate Add/Move placement interactions; this UX restriction does not change Runtime Marker identity, transforms, Model loading, Layers, physics, or CRUD authority.

Environment management remains explicitly accessible through **Project → Environment Details** and the top toolbar's **Open Project Environment Details** action. Both paths select the existing Runtime Marker through Dashboard-owned selection and open the established Model DetailsCard. Projects with multiple Environment Models list each Environment in the Project menu.

The Project dropdown now dismisses when the user presses outside its complete trigger/menu boundary. Pointer actions within the menu remain available to finish before dismissal. This behavior adds no global Scene click handler and does not alter marker selection persistence.

This release keeps internal Environment collision boxes diagnostic-only. Activating a small bounded subset of Scene-owned fixed Environment colliders remains the next separately approved development boundary.

## v0.19.4c Environment collision activation boundary

The separately approved activation stage now converts a bounded subset of the already reviewed Environment collision descriptions into fixed Rapier `CuboidCollider` instances. The existing Project Environment marker owns the fixed body, transform, Layer participation, and collider lifecycle. Runtime Adapter components remain visual-only and create no physics authority. No API, schema, Project Marker, or uploaded Model file is changed by activation.

Activation was deliberately proven through manual gates of 16, 64, 256, 512, and 1,024 cuboids. At each gate the Environment loaded first, the Character entered last with its model, capsule, animation, selection, camera, and Ecctrl controls intact, and the Character collided with the active Environment boxes without a Rapier frame failure. The 1,024 ceiling remains a hard upper bound; the remaining descriptions are deferred rather than mounted indiscriminately.

Physics Debug now draws cyan outlines only for collider descriptions that actually became active Rapier colliders. The earlier display drew the complete preview set even when only a small prefix was active, which made non-colliding preview descriptions indistinguishable from physics. The bounded `[ThreeD Environment Colliders]` summary reports planned, active, deferred, spawn-overlap, oversized, capacity, and priority-point counts without returning mesh paths or geometry arrays.

Before Rapier construction, the pure activation planner applies these generic rules in order:

1. Defer boxes overlapping a Character's saved admission area so Ecctrl never spawns inside a newly mounted obstacle.
2. Defer any single box whose width, height, or depth exceeds 128 Scene units. The established coordinate contract defines one Scene unit as one physical foot; these broad aggregate bounds are not useful Character-scale obstacles.
3. When Character reference positions are available, rank remaining boxes by shortest distance from those points. The already deterministic preview order remains the tie-breaker.
4. Mount at most 1,024 descriptions and report the remaining capacity deferrals.

The ranking is computed once from stable Project marker positions; it does not add frame-by-frame React state, live-position collider churn, or movement-triggered Rapier reconstruction. The established Environment safety floor remains responsible for continuous support across the Environment footprint.

### Verified acceptance boundary

- Active cyan boxes and mounted Rapier cuboids correspond one-for-one.
- Nearby Environment structures block controlled Character movement.
- Oversized Scene-spanning boxes are removed from the active set.
- Character spawn clearance is preserved.
- Character idle/walk/run animation, smooth stopping, capsule/model alignment, selection, Take/Release Control, and camera behavior remain working.
- Environment-first and Character-last loading remains stable across refresh.
- TypeScript, the 48-group ThreeD Runtime Marker validation suite, and diff integrity pass.

This manually verified checkpoint was released successfully to production as **v0.19.4c — ThreeD Environment Character Collision** (`package.json` version `0.19.4-centaur`) on September 3, 2026. Full activation of every Environment mesh bound and dynamic collider streaming remain outside this release boundary.

## v0.19.4d Project Asset navigation and collision coverage boundary

The Dashboard now exposes a **Project Assets** panel as a navigation surface over the complete unfiltered Project Runtime Marker collection. It creates no second inventory and performs no new API request. The panel lists the existing valid Beds, Characters, FarmBots, Models, and Plantings, supports name/type search, resolves current positions through the Runtime Marker registry, and remains open while the user navigates between entries.

Selecting a row is one deliberate Dashboard operation: clear any Incident selection, select the existing Runtime Marker, switch to the authoritative ThreeD surface, and issue the established camera-focus request after selection is committed. The same marker therefore owns the Scene highlight and DetailsCard. The panel is mutually exclusive with Add-to-Scene Library and placement panels, resets on Project change, and shifts the Scene horizontally rather than obscuring it. Project Marker identity, CRUD, Layers, physics, and persistence remain unchanged.

The Environment activation planner continues to mount no more than 1,024 fixed cuboids, defer Character-spawn overlaps and bounds wider, taller, or deeper than 128 Scene units, and create all Rapier objects through the Environment marker owner. Within that fixed budget, selection now alternates between two deterministic orders:

1. shortest collision-box distance from the stable Project positions of available Characters;
2. the preview planner's existing map-wide spatial coverage order.

Duplicate descriptions are removed by identity. This prevents dense nearby geometry, such as repeated crop meshes, from consuming the complete collider budget while preserving Character-relevant obstacles near admission points. Selection is computed once from stable Project state; it introduces no movement subscription, frame-level React state, dynamic collider streaming, or Rapier remount cycle.

Physics Debug adds `prioritySelectedCount` and `coverageSelectedCount` to the bounded Environment summary. Both counts were manually confirmed above zero while active collision remained at or below 1,024. Near and distant cyan structures remained accessible as Character colliders, and Character loading, animation, capsule/model alignment, selection, camera behavior, WASD movement, and stopping remained stable.

This checkpoint was released successfully to production as **v0.19.4d — ThreeD Project Asset Navigation and Environment Collision Coverage** (`package.json` version `0.19.4-delta`) on September 3, 2026. It adds no schema, API mutation, uploaded executable code, automatic persistence, or full per-mesh collision activation.

## v0.19.5b ThreeD Scene loading presentation boundary

The Dashboard now presents Project startup as one explicit visual lifecycle instead of exposing each independently loading surface. The shared loading presentation covers the client-only Dashboard handoff, URL/Search Parameter suspense, authenticated Project data loading, dynamic ThreeD runtime loading, first Canvas frame, Scene controls, and Project Model settlement. The completed Canvas then enters Production through a whole-surface fade and records Post-Production after that transition finishes.

The established loading authority remains unchanged: Project Models and the Environment settle before Character markers are admitted to the persistent Scene and Rapier world. GardenCharacter and EcctrlCharacter remain separate runtime paths and each reports only when its complete visual/animation runtime or safe fallback has settled. The parent Scene waits for every admitted Character marker identity before beginning the fade. This readiness signal does not manipulate animation mixers, create physics, or mutate world state. Incrementally adding a Model or Character after Production does not replay the opaque loader, hide the Scene, or remount an already admitted Character.

Direct Dashboard requests retain a client-mount boundary because the ThreeD and map dependency graph contains browser-only runtimes. The boundary renders the shared loading presentation during server output and does not execute those descendants until the browser owns the surface. This prevents server evaluation of `window` while preserving the App-owned light/dark/system theme provider.

Project selection enters the loading boundary in the same event transaction as the Project identity change. Before the new identity is installed, the Dashboard clears the outgoing marker/Incident selection, DetailsCard, Character control and live position, camera mode, ready Model/Character/FarmBot placement, Model movement, and open asset/add panels. These are transient Project-scoped interaction states and must never carry into another Project. Runtime Marker persistence, Project data, saved view state, and Sub-Module CRUD authority are unchanged.

The App-owned theme provider removes the third-party client script boundary and supports explicit light, dark, and system choices. Dark is the safe first-request default. A non-sensitive `threed-theme` cookie lets the server apply a previously selected explicit theme to the root HTML before hydration, while local storage retains client compatibility. No authentication data or inline executable theme script is used.

Pre-loading reserves the established Dashboard chrome, a 36-pixel Project toolbar skeleton, its 6-pixel Scene gap, and the final viewport height. All progress stages reuse the same bounded presentation geometry so labels and percentages do not move or resize the loader. The Scene operation status is an overlay below the Project toolbar; pending deletion/update feedback therefore cannot increase the toolbar height or move the Scene.

This checkpoint was released successfully to production as **v0.19.5b — ThreeD Scene Loading Presentation** (`package.json` version `0.19.5-beta`) on September 4, 2026.

## v0.19.5c ThreeD Project guidance and Environment presentation boundary

The release candidate adds a post-load **Project Tour** for an empty ThreeD Project. It appears only after the established Scene loading presentation and whole-surface fade complete, and it reads progress from the existing Runtime Marker collection. Environment/Base Map, Character, and ordinary Scene Model remain independently owned assets; the guide creates no parallel inventory, automatic placement, or persistence path. Its actions open the existing Library and Project controls.

The default Scene presentation now uses a deterministic layered procedural ground texture and a consistent three-quarter camera framing. Environment choices come from one shared preset catalog used by both the Scene and saved-view validation. **Default Daylight** combines lightweight image-based illumination with an App-generated panoramic daylight backdrop. **Sunset Forest HD** uses a separately tracked App-owned panoramic asset for users who deliberately choose the higher-detail presentation. Existing Environment presets remain available, and unknown saved keys continue to fail closed.

Authenticated Project discovery now includes the owner's active Projects before they contain assets, allowing a newly created Project to enter the setup workflow. Anonymous discovery still requires a public Project with at least one active asset. Project coordinates remain optional. This changes no Project ownership, publication, schema, or write authorization rule.

The blank-Project Three.js message was removed because the Project Tour now owns that guidance. Project toolbar and loading-skeleton geometry remain fixed, and Project changes reset the outgoing Tour and transient interaction state. Runtime Marker identity, Project snapshot authority, persistent Canvas/Rapier ownership, Environment collision planning, and separate GardenCharacter/EcctrlCharacter paths are unchanged.

This boundary is prepared as **v0.19.5c — ThreeD Project Guidance and Environment Presentation** (`package.json` version `0.19.5-centaur`). It becomes a production checkpoint only after the client-run build, deployment, and production verification are confirmed.
