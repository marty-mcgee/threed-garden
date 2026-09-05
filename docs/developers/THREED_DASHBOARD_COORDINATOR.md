# ThreeD Dashboard Scene Coordinator

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

The Model, Character, and FarmBot Libraries share one typed, mutually exclusive workspace state. Their existing open/close callbacks are adapters over that state so opening one Library cannot leave another Library active underneath it.

Project Assets, Models, Characters, FarmBots, Beds, and Plantings share one visual **left Scene workspace** boundary. Each opens as the same translucent 18rem dock beneath the Project toolbar. While that workspace is open, the Scene and any marker DetailsCard move to its right together. Project Assets remains navigation-only and does not inherit placement behavior.

## Scene bridge and runtime ownership

- `UnifiedMapView` adapts coordinator state and callbacks to the 2D/3D surfaces and Runtime Marker providers.
- `ThreeDScene` owns the persistent Canvas/Rapier runtime and Sub-Module routing.
- GardenCharacter and EcctrlCharacter remain separate paths selected through the established `isMovable` rule.
- Domain orchestration remains isolated under `src/lib/services/threed/orchestration` and must not migrate into Dashboard panels.

## Refactoring sequence

Continue with one independently verifiable boundary at a time:

1. Keep the extracted Model, Character, and FarmBot Library panels presentation-only.
2. Route their established API envelopes through the pure typed Library placement client core before introducing stateful controllers.
3. Isolate Project-session loading only after placement behavior is independently represented.
4. Leave `page.tsx` as the readable composition root and coordinator.

Do not combine these structural steps with marker behavior, Character runtime, physics, schema, or API contract changes.
