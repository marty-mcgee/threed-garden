# ThreeD Scenarios and future Simulations

October 5, 2026: the Developer approved implementation of the first concrete Scenario/Simulation milestone for v0.22.26: ThreeD Soccer → Practice Soccer → Farmer Kate → Run to target ball then kick the ball. The [milestone development record](v0.22.26-soccer-scenario-simulation.md) now records the local two-Action Soccer runner, exact bindings, dedicated Admin recipe, explicit Run/Stop, correlated outcomes and bounded Sensor Group summaries. Focused checks, TypeScript, 62-task CI and guarded npm build passed; named-Project browser verification and release remain pending. General Action execution, result persistence, broader metadata collectors and cross-Project reuse remain future design. No migration or live data mutation was performed by the agent.

Developer definition, October 4, 2026: Scenarios are simple structures interchangeable among authorized Projects. Simulations are sets of Actions that run and collect responses using Sensors and other metadata. v0.22.24 implements Scenario Admin improvements; this document defines future extension points, not a Simulation runner or approved database migration.

v0.22.25 explicitly authorizes the [Simulation schema foundation](v0.22.25-threed-simulations-schema.md): Project-owned definitions with an optional Scenario link and a versioned JSON envelope. That implementation supersedes the earlier schema-deferred statement for the definition table only. CRUD, nested input parsing, execution/run history, observations collection and cross-Project reuse remain future work.

## Responsibilities

Developer confirmed the definition-table migration in the production database October 4, 2026 and requested implementation. The [v0.22.25 Admin pages](v0.22.25-simulation-admin.md) implement definition CRUD and a strict bounded Action/Sensor Group input contract. Earlier statements deferring CRUD/parser are superseded by this step; Scene execution, live observation collection, run/result persistence and cross-Project reuse remain future work.

| Concept | Responsibility | Existing or future |
| --- | --- | --- |
| Scenario structure | Name, purpose, setup kind and intended asset roles | Existing outline/setup; reusable role vocabulary can be added in a later approved step |
| Project binding | Concrete authorized Project/ThreeD module, Model marker and Sensor Group | Existing Project-owned Scenario row/setup |
| Simulation definition | Ordered Actions, actor/target identities, timeout/failure policy and Sensor Group choices | v0.22.25 schema/Admin CRUD; v0.22.26 local Run-to-ball/contact-kick vocabulary |
| Simulation run | One definition executed against one authorized Project binding, with run/step identities and results | v0.22.26 local Soccer runner and transient outcomes; broader execution/persistence remains future |
| Observation | Sensor event, counter delta or other explicit metadata captured during the run | v0.22.26 bounded run-window Sensor Group summaries; causal correlation and broader collectors remain future |

Scenario saving/loading does not execute Actions or mutate Scene assets. Scenario setup readiness is an assignment check; it does not prove successful execution or sensor contact. A Simulation orchestrates existing owner-controlled Actions and reads observations; it must not take ownership of physics, animation mixers or reusable Model records.

## Portability without a schema change

Current storage requires projectId/threedId, with a slug unique within that binding. v0.22.24 retains those existing bindings and ships no cross-Project copy, transfer or apply functionality. Interchangeability is a theoretical architectural goal only. Current authorization is ownership, not a newly invented sharing policy.

Later portability can split a reusable definition from its Project bindings after explicit feature and schema approval. Proposed roles such as environment, actor, action target and observation group must bind to actual authorized instances; names alone cannot establish identity. Missing or inactive bindings should block run start with a specific reason. Concrete reuse/sharing semantics remain future decisions; no demo action is included.

## Proposed execution contract

These are design fields, not current schema columns or API routes:

- Definition: version, stable definition identity, Scenario structure reference, ordered step identities, supported Action identifier, actor/target roles, timeout and failure policy.
- Run context: unique runId, authorized projectId/threedId, resolved binding snapshot and definition version, start time, status and cancellation generation.
- Step outcome: runId/stepId/requestId correlation, attempted/started/completed times, completed/failed/cancelled/timed-out status, confirmed Action response and bounded observation samples. Unknown or unconfirmed writes must be reported explicitly.
- Observations: source identity, projectId, sceneEventId, sensor owner/id or selected metadata key, occurrence time and receipt time. Deduplicate events and reject different-Project, different-session and stale-generation samples.

Initial future runner should execute one step at a time. Observe after subscription setup and record a baseline; evaluate deltas without resetting global Sensor counters. Do not treat unrelated simultaneous events as a step response. Events without reliable Action correlation can be labelled time-window observations, not proof that an Action caused them. Sensor collection alone must not trigger world persistence.

Cancellation, Project switches, missing targets, hidden Layers and timeouts must stop dispatching further steps, unsubscribe collectors and preserve honest terminal outcomes. Use bounded sample counts, metadata allowlists and export limits. Store results only through an explicitly approved owner-scoped persistence design; do not write on render/movement or capture private credentials.

## Integration points

| Existing boundary | Future adapter responsibility |
| --- | --- |
| `src/libraries/services/threed/scenarios/scenario-input.ts` | Keep Scenario structure/setup parsing separate from Simulation definitions |
| `src/libraries/services/threed/orchestration/interaction-core.ts` and existing action path | Dispatch only supported semantic Actions; correlate lifecycle responses |
| `src/libraries/services/threed/physics/physics-event-core.ts` | Consume provider-neutral Project/marker/sensor events; preserve event identity |
| Project Scene session and Runtime Marker ownership | Resolve current instances; cancel stale runs; retain persistent Canvas/Rapier world |
| Existing Sensor Groups and Project snapshot state | Read selected group observations without globally resetting or rewriting sensors |

Preserve Garden/Ecctrl separation, isMovable routing, external animation/action mappings and task-to-locomotion crossfades. World actions retain one-shot completion gating, with only the already approved bounded movable-ball kick contact exception. The Simulation layer cannot grant new harvest/persistence, MQTT, FarmBot command or physical-device permissions.

## Future implementation stages

1. Definition parser and binding validation, with a standalone Admin form and offline fixtures; no execution or schema change.
2. Explicitly approved local dry-run adapter using bounded mocked responses; demonstrate cancellation, identity isolation and deduplication.
3. Explicitly approved Scene runner for supported Actions and read-only observation collection; verify browser timing and Project session isolation.
4. Separately approved run/result persistence and sharing design, then export/replay policy. Replay must distinguish visual playback from redispatching world actions.

No new Simulations menu entry or placeholder operational button is shipped in v0.22.24. Future acceptance must test cancellation during each lifecycle phase, failed Actions, stale/duplicate events, missing bindings, unrelated sensor activity, completion/contact boundaries and authorized Project switching before production claims.
