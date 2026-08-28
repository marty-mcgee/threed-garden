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

The axes are explicit: local +X is geographic east when heading is zero, +Y is elevation, and +Z is geographic north. `heading_degrees` rotates Scene +Z clockwise from north. `meters_per_scene_unit` defines physical Scene scale. The WGS84 conversion uses a Project-local tangent plane, so east/west distance changes correctly with latitude and local coordinates round-trip without using a fixed degrees-per-unit value.

Local X/Y/Z remains the R3F and Rapier transform authority. Geographic latitude/longitude/altitude is the synchronized Map representation. A client may submit either a local edit or a geographic edit, but the authenticated server must calculate the other representation from the same Project origin in one transaction. Clients must not submit two independently authoritative positions.

## Proposed Drizzle fields — review boundary

No schema change is included in the coordinate-core checkpoint. The proposed next migration is:

`project_threed`:

- `origin_latitude decimal(10, 7)` — nullable until an existing Project is configured;
- `origin_longitude decimal(10, 7)` — nullable until configured;
- `origin_altitude decimal(12, 3)` — default `0` metres;
- `heading_degrees decimal(8, 3)` — default `0`;
- `meters_per_scene_unit decimal(12, 6)` — default `11.119493` for current-layout compatibility.

`project_threed_markers`:

- `latitude decimal(10, 7)` — nullable only during migration/backfill;
- `longitude decimal(10, 7)` — nullable only during migration/backfill;
- `altitude decimal(12, 3)` — nullable only during migration/backfill.

Existing marker GPS values must be backfilled only after their owning `project_threed` origin is configured. The migration must not guess a universal origin for unrelated Projects. After backfill, create/update routes keep both representations synchronized for Models, Beds, Plantings, FarmBots, and Characters through the same Project-marker transaction.
