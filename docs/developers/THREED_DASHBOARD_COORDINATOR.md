# ThreeD Dashboard Scene Coordinator

Production checkpoint: **v0.19.7b — ThreeD Dashboard Scene Coordinator Boundaries**.

The `/dashboard/map` page is the **Dashboard Scene Coordinator**. It coordinates a Project session across Dashboard controls, supporting 2D views, ThreeD Scene presentation, Runtime Markers, and explicit user operations.

This name is intentionally narrower than "orchestration layer." In this repository, **ThreeD orchestration** already describes Character approach, orientation, semantic actions, animation completion, and optional world-action sequencing. UI composition must not share that authority or terminology.

## Ownership layers

```text
Next.js Dashboard route
        ↓
Dashboard Scene Coordinator
Project session + cross-surface user intent
        ↓
Workspace presentation
Header + Toolbar + Panels + DetailsCard
        ↓
UnifiedMapView Scene bridge
Runtime Marker and view-state providers
        ↓
ThreeDScene runtime
Rendering + Rapier + Character runtime paths
        ↓
Domain orchestration
Character approach + semantic action lifecycle
```

## Dashboard Scene Coordinator owns

- Active Project identity and Project loading lifecycle.
- Cross-panel exclusivity and the active Dashboard operation.
- Selected marker, action target, and controlled Character identity.
- Calls to established Project and marker API routes.
- Placement/update/delete callbacks and client-state reconciliation.
- Composition of `UnifiedMapView`, DetailsCard, and workspace components.

## Workspace components own

- Their visual structure and accessibility attributes.
- Rendering loading, empty, selected, pending, and disabled states supplied by the coordinator.
- Emitting narrowly named user intents such as `onOpen`, `onSelect`, `onPlace`, `onCancel`, and `onSave`.

Workspace components must not fetch Project data, mutate Runtime Markers, write marker snapshots, control Rapier, or manipulate Character animations.

The Project Header menu owns its rendered DOM boundary and outside-pointer dismissal listener. The coordinator owns whether the menu is open and supplies a dismiss intent; it does not inspect header DOM events.

The Project Assets panel owns focus-on-open, its search-input ref, Escape-key dismissal, and listener cleanup. The coordinator owns panel visibility and restores focus to the toolbar trigger after the panel emits its dismiss intent.

The Model, Character, and FarmBot Libraries share one typed, mutually exclusive workspace state. Their existing open/close callbacks are adapters over that state so opening one Library cannot leave another Library active underneath it.

The Bed and Planting placement panels are also presentation-only. Their typed drafts and option lists enter through props, and they emit field, module, begin, cancel, and close intents. The coordinator retains placement activation, Scene-mode changes, API requests, Project marker transactions, and toast outcomes.

The Scene filter panel follows the same boundary. It renders the search, active-only, asset-type, and clear controls from coordinator-owned values and emits filter intents. Marker filtering and user feedback remain coordinator responsibilities. A filter match controls only the marker's outer Three.js presentation group; it must not disable, remove, or recreate its persistent Rapier body. Explicit Scene Layer controls retain physics-participation authority. When a left Scene workspace is open, the filter surface uses the same responsive workspace offset as the Scene and DetailsCard so the controls do not overlap.

Project Assets, Models, Characters, FarmBots, Beds, and Plantings share one visual **left Scene workspace** boundary. Each opens as the same translucent 18rem dock beneath the Project toolbar. While that workspace is open, the Scene and any marker DetailsCard move to its right together. Project Assets remains navigation-only and does not inherit placement behavior.

`useProjectAssetCollection` owns the memoized, read-only Project Assets view derivation: available marker types, per-type counts, text/type matches, and deterministic display sorting. It does not own the Runtime Marker collection, selection, focus, or Scene visibility.

`useThreeDModelLibraryCollection` owns the corresponding read-only Model Library derivation: unique sorted categories, the inspected-model lookup, and the combined category/name search result. Library requests, active filter values, inspection intent, and placement remain coordinator-owned.

`useThreeDPlacedLibraryAssets` memoizes the Character and FarmBot identities already represented by the active Project. It preserves both Project marker records and the established source collections as inputs, and has no authority to place or remove an asset.

`useCombinedMapPanelResize` owns the Combined View divider interaction, including its 20–80% bounds and temporary document listeners. The coordinator retains the resulting panel height and setter integration needed by saved Project view-state capture and restoration.

`useDataFreshness` owns the live-data age display timer and five-minute stale threshold. Project loading, saving, and manual refresh paths remain responsible for recording the actual last-updated timestamp.

## Scene bridge and runtime ownership

- `UnifiedMapView` adapts coordinator state and callbacks to the 2D/3D surfaces and Runtime Marker providers.
- `ThreeDScene` owns the persistent Canvas/Rapier runtime and Sub-Module routing.
- GardenCharacter and EcctrlCharacter remain separate paths selected through the established `isMovable` rule.
- Domain orchestration remains isolated under `src/lib/services/threed/orchestration` and must not migrate into Dashboard panels.

## Project-session loading

`threed-project-session-core.ts` owns the pure conversion of the established `/api/map/threed` response into Dashboard session data: normalized numeric coordinates, Project module summaries, geographic origin, saved view state, Runtime Marker snapshots, counts, and the unified map data shape. It has no React state and does not own Project selection.

`useThreeDProjectSessionLoader` owns request sequence identity, AbortController cancellation, loading/refreshing state, and unmount cleanup. It keeps the loading cover active until the coordinator's outcome handler has committed the completed session. The Dashboard coordinator still owns Project selection, applying saved view state, committing session data, and user-facing error outcomes. An obsolete Project response cannot reach that outcome handler or replace the active Project.

## Refactoring sequence

Continue with one independently verifiable boundary at a time:

1. Keep the extracted Model, Character, FarmBot, Bed, Planting, and Scene filter panels presentation-only.
2. Preserve the established Model, Character, and FarmBot API envelopes through the pure typed Library placement client core.
3. Keep Project-session response normalization in the pure session core and request sequencing in the dedicated loader hook.
4. Keep Project Asset, Model Library, and placement-availability derivation in read-only collection hooks.
5. Keep self-contained Combined View resize mechanics in their UI hook.
6. Keep display-only data freshness timing outside the coordinator.
7. Leave `page.tsx` as the readable composition root and coordinator.

Do not combine these structural steps with marker behavior, Character runtime, physics, schema, or API contract changes.
