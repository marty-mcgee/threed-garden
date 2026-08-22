# ThreeD Character Runtime Architecture

ThreeD characters share records, models, semantic animations, action events, and completion reporting, but they do not share one movement runtime. The `isMovable` field selects the runtime:

| Concern | GardenCharacter | EcctrlCharacter |
|---|---|---|
| Routing | `isMovable !== true` | `isMovable === true` |
| Primary role | Autonomous or NPC character | User-controlled physics character |
| Movement authority | Internal Three.js group behavior | Ecctrl and Rapier physics body |
| Supported movement | Wander, patrol, circle, follow, teleport, stationary | WASD, running, jumping, collision movement |
| Physics relationship | Rendered under an existing fixed parent body | Moving character controller owns the physical position |
| User controls | No Take/Release Control | Take Control, Release Control, WASD |
| Live position | Three.js world position registry | Physics position and live marker-position registry |

Both runtimes preserve:

- external FBX animation loading;
- semantic Animation Action Mapping;
- idle, walk, run, and one-shot task actions where available;
- task locking while a one-shot animation runs;
- task-to-locomotion crossfades;
- the `garden-character-action-complete` event used by the page-level world-action layer.

## Why the runtime files remain separate

GardenCharacter and EcctrlCharacter have incompatible position authorities. Combining them into one large component would mix internal Three.js movement with Rapier/Ecctrl movement and increase regression risk for collisions, WASD, autonomous movement, camera tracking, and action recovery.

The safe direction is a small router with separate runtime adapters and shared character systems:

```text
ThreeD character routing (`isMovable`)
├── GardenCharacter
│   └── autonomous movement authority
├── EcctrlCharacter
│   └── physics and user-control authority
└── shared systems
    ├── model and external animation loading
    ├── semantic action resolution
    ├── one-shot task lifecycle
    ├── completion-event construction
    └── provider-independent orchestration contracts
```

Shared behavior must be extracted incrementally without merging movement loops or directly manipulating an animation mixer outside the established character action path.

## Phase 5 orchestration boundary

The initial Phase 5 simulation must not automatically move GardenCharacter toward a target while it remains inside a fixed physics parent: doing so can move the visible model while leaving its collider at the original position.

The safe initial FarmBot interaction is:

1. Use a movable EcctrlCharacter.
2. Take control and approach the FarmBot with WASD.
3. Let the DetailsCard verify proximity from the current live physics position; interaction buttons remain disabled while out of range.
4. Face the FarmBot through the Ecctrl physics body for the duration of the semantic task.
5. Play the existing semantic one-shot animation.
6. Keep completion, API authorization, MQTT delivery, and physical-device state as separate layers.

GardenCharacter remains autonomous and animation-only for FarmBot interactions until it has an explicitly designed moving-physics representation. Automatic Ecctrl approach is also a separate future decision; it must not bypass Take/Release Control or normal physics ownership.

FarmBot interaction controls fail closed until the selected EcctrlCharacter is under Take Control and has reported its first live physics position. Stored marker coordinates are not treated as sufficient range proof. The Dashboard retains that report in dedicated state scoped to the controlled character ID and uses it directly for range planning; the general selected-marker object is not the range authority. The same live report also refreshes the selected marker display at a limited update rate. This keeps the DetailsCard proximity state responsive without causing a React update on every rendered frame. The ThreeD scene keeps the callback stable so ordinary parent renders do not restart the control-state synchronization effect.

An in-range FarmBot interaction uses the planner's facing angle immediately before the existing Ecctrl task action. A 22.5-degree tolerance treats a character as already facing the FarmBot, avoiding unnecessary turns and forced rotation for small heading differences. Outside that tolerance, the verified Farmer animation library selects exactly one Left Turn or Right Turn clip from the shortest signed angle. It plays that clip forward while smoothly rotating toward the FarmBot, runs the requested semantic task, then plays the same turn clip backward while restoring the original facing direction. The opposite turn clip does not participate in that sequence. The task lock keeps the body stationary throughout. After the return turn, ordinary Ecctrl locomotion regains authority and the established action-completion event is emitted. Invalid or out-of-range FarmBot targets do not start the task.

The Dashboard correlates this animation-only simulation with the request UUID carried as `actionRequestId`. Its local status becomes `interacting` when the request enters the compatibility bridge and `completed` only when the matching animation-completion event returns. A 30-second missing-completion timeout changes it to `cancelled`, and duplicate FarmBot interaction buttons remain disabled while it is active. This status is client-only: it is not a command audit, device acknowledgement, persistence record, or proof of physical completion.
