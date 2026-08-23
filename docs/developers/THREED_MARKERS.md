# ThreeD Marker Architecture

This document records the marker architecture through the v0.18.6b **ThreeD Project Marker Snapshots** production checkpoint. Phase 5E through Phase 5L are included in that release.

## Hierarchy and terminology

ThreeD is the parent module. A **ThreeD Asset** is a persisted Sub-Module record such as a Planting, Bed, Character, FarmBot, or Model. A Project junction-table assignment determines whether that asset belongs to the loaded Project.

Database-driven, Project-assigned ThreeD data is the authority for the current Project session. Persisted Sub-Module assets and their Project assignments determine marker eligibility. Persisted `threed_layers` records determine the available ThreeD Layers. An explicit ThreeD Project save records the current marker snapshot in `project_threed_markers`.

A **Runtime Marker** is the in-memory representation created from the saved Project marker snapshot and its eligible source asset. The Runtime Marker registry mirrors identity and current runtime position; it does not create ownership, Project assignment, or Layer records. `project_threed_markers` is the current saved Project snapshot. The old `threed_markers` table remains legacy and is not the foundation of this system.

A **ThreeD Layer** organizes and controls the visibility of Runtime Markers. An **Action Target** is an optional capability of an eligible Runtime Marker; it is not the parent identity model and does not grant persistence, MQTT, worker, or physical-device authority.

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

Hiding a ThreeD Layer hides its markers and prevents direct selection, but does not remove Project ownership or automatically clear an Action Target. Removing the Project assignment or making the source unavailable removes its Runtime Marker and clears or cancels client-side state that depends on it.

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
