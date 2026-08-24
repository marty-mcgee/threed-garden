# ThreeD Marker Architecture

This document records the marker architecture through the v0.18.7a **ThreeD Model Library Project Placements** production checkpoint.

## Hierarchy and terminology

ThreeD is the parent module. A **ThreeD Asset** is a persisted Sub-Module record such as a Planting, Bed, Character, FarmBot, or Model. A Project junction-table assignment determines whether that asset belongs to the loaded Project.

Database-driven, Project-assigned ThreeD data is the authority for the current Project session. Persisted Sub-Module assets and their Project assignments determine marker eligibility. Persisted `threed_layers` records determine the available ThreeD Layers. An explicit ThreeD Project save records the current marker snapshot in `project_threed_markers`.

A **Runtime Marker** is the in-memory representation created from the saved Project marker snapshot and its eligible source asset. The Runtime Marker registry mirrors identity and current runtime position; it does not create ownership, Project assignment, or Layer records. `project_threed_markers` is the current saved Project snapshot. The old `threed_markers` table remains legacy and is not the foundation of this system.

A **ThreeD Layer** organizes and controls the visibility of Runtime Markers. An **Action Target** is an optional capability of an eligible Runtime Marker; it is not the parent identity model and does not grant persistence, MQTT, worker, or physical-device authority.

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

The authenticated `/api/project/threed-markers` boundary provides owner-scoped `GET` and transactional `PUT`. The server derives each marker's ThreeD module from its active Project assignment, rejects missing or ambiguous assignments, applies request and row limits, and prevents credential-like keys from entering marker JSON snapshots. `PUT` replaces the Project's current saved marker rows under a Project-scoped database lock.

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

This is not a new marker schema or wrapper contract. `project_threed_markers`, the existing Runtime Marker builder, `ThreeDScene`, and each Sub-Module renderer retain their current responsibilities.

### Character-control regression watch

During manual development testing, saving one Model's scale previously reloaded the complete Project data. The Character model object was then reconstructed while its Ecctrl/selection runtime remained active, producing a severe split: WASD moved the blue halo while the visible Character stayed behind. The fix removed whole-Project reloads from marker CRUD and preserved unrelated marker identity through the scene bridge. The user verified that the Character, Ecctrl body, and halo now move together after another marker is edited.

Any future marker CRUD or scene-population change must repeat this sequence: edit a non-Character marker, confirm the Canvas does not reload, select a movable Character, Take Control, move with WASD, and confirm the Character plus halo move together. A hard refresh is not an acceptable workaround for a failed result.

This verifies the general Model path only. Direct placement excludes `used_by_characters = true`, and no Character Library workflow is implied by this production checkpoint.

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
