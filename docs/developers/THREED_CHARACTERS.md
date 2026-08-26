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

## v0.18.8a Ecctrl position authority

The Runtime Marker layer resolves the Project-specific Character position before runtime routing. `ThreeDScene` passes that position explicitly to `EcctrlCharacter`, and Ecctrl uses it to initialize the Rapier body. Ecctrl does not independently fall back to the reusable Character row's XYZ fields, so the Character model, capsule, selection halo, camera tracking, and live-position reporting share one physical owner.

Only one movable Character may mount an Ecctrl body at a given XYZ spawn. The stable first marker owns that spawn; later overlapping movable Characters are skipped and reported before Rapier mounting. This keeps one Character selectable for recovery and prevents overlapping Ecctrl bodies without moving, deleting, or rewriting saved data. GardenCharacter routing remains separate and unchanged.

## v0.18.9a Character Library and snapshot recovery

The Dashboard Character Library exposes only active Character records whose related models are eligible for Character use. Placement creates an owner-scoped Character Project Asset and `project_threed_markers` instance through the authenticated API. `isMovable` continues to choose Ecctrl or Garden runtime rules; a Character model is never routed through the generic Model placement runtime.

Character position editing patches only the selected Project marker and synchronizes its existing runtime owner. Planting or Character CRUD updates the matching client records without reloading the Project, replacing the persistent Canvas, or remounting unrelated marker owners.

Ecctrl publishes live position only while the Character is under **Take Control**. Mounting, selecting, or clicking an uncontrolled Character cannot promote Ecctrl's temporary initialization coordinate into Runtime Marker state. Every reported position must contain finite X/Y/Z values before it can update camera tracking, the Scene live-position map, or the Runtime Marker registry.

Spawn safety uses the Ecctrl capsule area rather than exact XYZ string equality. A later movable Character within the protected horizontal and vertical spawn range is rejected before Rapier mounts it. The bounded warning identifies the saved Project marker and offers **Restore Source Position**, which patches only that snapshot to the reusable Character's stored XYZ position. It does not delete or rewrite the source Character.

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

Ecctrl normally interprets WASD relative to the active scene camera. While a controlled EcctrlCharacter has a FarmBot action target, the runtime instead supplies Ecctrl with a world-space forward vector from the live character position to that target. In this target-approach mode, `W` moves toward the FarmBot, `S` moves away, and `A`/`D` strafe relative to that path regardless of camera mode, orbit angle, perspective, or zoom. Clearing the FarmBot target restores ordinary camera-relative WASD. Focus Target also positions its stationary view behind the live character so the visual viewpoint agrees with the target-relative controls.

An in-range FarmBot interaction uses the planner's facing angle immediately before the existing Ecctrl task action. A 22.5-degree tolerance treats a character as already facing the FarmBot, avoiding unnecessary turns and forced rotation for small heading differences. Outside that tolerance, the verified Farmer animation library selects exactly one Left Turn or Right Turn clip from the shortest signed angle. It plays that clip forward while smoothly rotating toward the FarmBot, runs the requested semantic task, then plays the same turn clip backward while restoring the original facing direction. The opposite turn clip does not participate in that sequence. The task lock keeps the body stationary throughout. After the return turn, ordinary Ecctrl locomotion regains authority and the established action-completion event is emitted. Invalid or out-of-range FarmBot targets do not start the task.

The Dashboard correlates this animation-only simulation with the request UUID carried as `actionRequestId`. Its local status becomes `interacting` when the request enters the compatibility bridge and `completed` only when the matching animation-completion event returns. A 30-second missing-completion timeout changes it to `cancelled`, and duplicate FarmBot interaction buttons remain disabled while it is active. This status is client-only: it is not a command audit, device acknowledgement, persistence record, or proof of physical completion.

Phase 5B centralizes those browser lifecycle rules in the provider-independent orchestration core. Only the matching request UUID may leave `interacting`; it may become either `completed` or `cancelled`. A terminal state cannot be replaced by a conflicting result, while receiving the same terminal result again is harmless. The Dashboard ignores late completion or timeout callbacks after a request is already terminal. These rules do not call an API, publish MQTT, operate a worker, or authorize a physical device action.

Phase 5C centralizes planar target navigation in that same provider-independent core. The approach planner, Ecctrl target-relative movement, and Focus Target camera placement consume one normalized world-space forward direction and one distance result. Camera properties are not inputs to this plan. Coincident X/Z positions return no direction instead of inventing one, and invalid positions fail closed.

## ThreeD Marker Action Target authority

Action Target is a ThreeD Scene capability, not a FarmBot capability. Every project-assigned Sub-Module asset that produces a visible Runtime Marker must be eligible for ThreeD target identity, focus, highlighting, navigation, and generic semantic interaction. The current marker-producing types are Plantings, Beds, Characters, FarmBots, and Models.

The provider-independent capability registry gives each of those marker types Point, Point Gesture, and Talk. Planting farming actions remain a separate module capability. Target eligibility alone never grants database persistence, MQTT publishing, worker access, or physical operation; those effects remain behind their existing action-specific authorization paths.

The Dashboard uses the same plural marker type identity from Runtime Marker creation through target selection and refresh reconciliation. Every supported target receives the persistent green pulse and target-relative focus/navigation behavior. Targeted menus are filtered through the capability registry: Beds, Characters, FarmBots, and Models receive only generic interactions, while Plantings additionally receive their farming and harvesting actions. The untargeted character animation palette remains available without granting target-specific effects.

Phase 5E adds one provider-independent constructor at the Runtime Marker-to-Action Target boundary. It normalizes the supported singular/plural marker aliases and requires a non-empty runtime marker identity, a positive safe asset ID, a non-empty display name, and finite ThreeD scene coordinates. The resulting target and position are immutable. Invalid or unsupported marker data fails before entering orchestration state; this adds no API call, persistence, MQTT behavior, or physical-device authority.

Phase 5F uses one shared identity matcher in the DetailsCard, refreshed-project reconciliation, and ThreeD scene highlighting. It normalizes singular/plural marker aliases and requires the same supported marker module and positive asset ID. The derived runtime marker string is display and scene metadata rather than source identity. This prevents the UI, refresh lifecycle, and scene from applying different target rules. Unsupported modules and mismatched asset identities fail closed.
