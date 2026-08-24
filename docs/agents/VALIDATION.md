# Agent Validation Guide

This repository uses a narrow-first validation ladder. Agents should prove the relevant behavior with the smallest useful check before escalating to slower or broader commands.

## Validation order

1. Inspect `git diff --check` for whitespace and patch errors.
2. Run `npm run validate:assets` when character animation assets, their manifest, or the local Three.js DRACO decoder assets change.
3. Run `npm run validate:farmbot-crypto` when FarmBot credential cryptography changes.
4. Run `npm run typecheck`; TypeScript errors are release-blocking.
5. Run `npm run validate:threed-runtime-markers` when ThreeD Marker identity, registry, position resolution, or marker adapters change.
6. Run `npm run validate:threed-orchestration` when ThreeD character approach, arrival, orientation, or interaction orchestration changes.
7. Run `npm run validate:threed-mqtt` when the provider-neutral MQTT transport or worker authentication changes.
8. Run `npm run validate:farmbot-worker` when the FarmBot MQTT adapter, grants, status parsing, persistence mapping, or lifecycle changes.
9. Run `npm run validate:farmbot-mqtt-persistence` when normalized worker events, persistence rules, or MQTT Admin activity changes.
10. Run `npm run validate:farmbot-command-policy` when Phase 3 semantic intent, lifecycle states, idempotency rules, or command safety policy changes.
11. Run a file-scoped lint command only when an ESLint executable/configuration is available.
12. Run targeted tests when a matching test exists.
13. Run `npm run build` only when the change affects bundling, routing, server/client boundaries, or release readiness.
14. Perform the relevant manual regression checklist for interactive ThreeD behavior.

## Commands

```bash
git diff --check
npm run validate:assets
npm run validate:threed-runtime-markers
npm run validate:threed-orchestration
npm run validate:farmbot-crypto
npm run validate:threed-mqtt
npm run validate:farmbot-worker
npm run validate:farmbot-mqtt-persistence
npm run validate:farmbot-command-policy
npm run typecheck
npm run build
```

The ThreeD Runtime Marker validation is offline and provider-independent. It checks supported Sub-Module normalization, canonical identity keys, overlapping numeric IDs across modules, immutable snapshots, saved/asset and live position selection, refresh preservation, removal, atomic duplicate rejection, invalid input, and Project-scoped clearing. The registry is an in-memory mirror; database-driven Project assignments, source assets, Layers, and the explicit `project_threed_markers` saved snapshot remain the Project-session authority. The validator must not access React, Three.js, physics, APIs, persistence, MQTT, workers, FarmBot services, or physical devices.

The ThreeD orchestration validation is offline and provider-independent. It checks the versioned simulation policy, safe planar stopping position, facing rotation, arrival tolerance, lifecycle transitions, target-relative forward direction on every cardinal world axis, coincident positions, the five rendered ThreeD Marker target capabilities, and rejection of invalid positions, unsupported marker types, or unsafe interaction distances. It must not access React, animation mixers, APIs, persistence, MQTT, workers, FarmBot credentials, or physical devices.

For Phase 5A character simulation, confirm GardenCharacter remains on its configured autonomous path and does not automatically approach a FarmBot. Select a movable EcctrlCharacter without taking control and confirm FarmBot actions remain disabled with `Take Control to calculate interaction range`; stored coordinates must not produce an initial `0.0` range. Take Control, allow the first live physics position to arrive, and confirm the range is then calculated. Approach with WASD, verify the displayed distance decreases, and confirm the buttons enable only within interaction range. Stand to each side of the FarmBot and run Point, Point Gesture, and Talk. Confirm Ecctrl selects only the corresponding Left Turn or Right Turn animation, plays it forward while rotating toward the FarmBot, performs the task, plays that same clip backward while restoring the original facing direction, and then returns cleanly to ordinary WASD locomotion. The opposite turn clip must not appear in the same sequence. Retest untargeted and Planting-targeted actions, Garden wandering, Take/Release Control, and both task-to-locomotion crossfades. Confirm the Network panel contains no FarmBot command, MQTT, peripheral, or new world-action request.

During each FarmBot simulation, confirm the DetailsCard reports `Simulation: interacting`, disables the other FarmBot interaction buttons, then reports `Simulation: completed` after the return-turn animation. Changing or clearing the target clears that client-only status. A request that never reports animation completion must become `cancelled` after 30 seconds and must not create a network request.

For the ThreeD Marker Action Target boundary, select one visible Planting, Bed, Character, FarmBot, and Model in turn. Each DetailsCard must offer **Use as Action Target**, and each current target must retain the green pulse when selecting a character actor. Beds, Characters, FarmBots, and Models must expose only Point, Point Gesture, and Talk. Plantings may additionally expose their declared farming and harvesting actions but must not inherit Cow Milking. Verify Focus Target and target-relative Ecctrl navigation for each type, then clear the target and confirm ordinary camera-relative WASD returns. Refresh while the target still exists and confirm it remains; removing it from refreshed project assets must clear it. Retest targeted Water and Pick Fruit persistence and confirm no generic interaction creates a persistence, MQTT, worker, or physical-device request.

For facing tolerance, test once while the character is already aimed approximately toward the FarmBot and once while it is clearly facing away. Within roughly 22.5 degrees, the task should begin without a turn animation or forced heading correction. Outside that tolerance, the normal turn, task, and return-turn sequence should run.

Repository validation scripts print a checkmark after each completed test group and a final group count. If an assertion fails, later groups are not printed, which helps identify the affected section. Validation output must remain limited to group descriptions and counts; it must not log credentials, raw broker payloads, encryption material, or other secrets.

The FarmBot validation also covers strict broker-claim parsing and rejects a refreshed token whose `device_…` broker identity differs from the stored credential. Broker host, secure WebSocket URL, and vhost changes are allowed because FarmBot may move broker sessions while retaining device identity.

The ThreeD MQTT validation is provider-neutral and offline. It checks shared HMAC tamper/replay rejection; timestamped lifecycle transitions; token expiry; reconnect limits and capped backoff; single-session start/stop, normalized and invalid messages, stale callback rejection, and late-connect cleanup; MQTT.js connection options; exact QoS 0 subscriptions; message forwarding; topic-list rejection; safe broker error classification; and cleanup using neutral fabricated integration data. It also scans the generic MQTT service imports and fails if that directory depends on FarmBot or OpenFarm.

The FarmBot worker validation is also offline. It checks the shared read-only adapter and controller integration, FarmBot identity and exact connection mapping, accepted-topic enforcement, normalized status messages, connection-grant identity and expiry rules, owner-bound single-session behavior, the established lifecycle record sequence, retry limits, message timestamps and invalid counts, bounded position parsing, credential-redacted status, persistence behavior, and the loopback internal HTTP boundary. It does not load a stored credential, connect to Neon or FarmBot, open MQTT, or operate hardware.

For the separately approved local live read-only test, start the App and worker in separate terminals, verify worker health reports `mqttTransport: mqttjs` and `commandsEnabled: false`, then use Admin **MQTT Activity → Start read-only**. Confirm current status and position records appear, raw payloads and credentials do not appear, and **Stop** closes the session. Do not proceed if the worker reports any publish or command capability.

For the Phase 2D Dashboard display, sign in as the Project owner, open a Project with an actively assigned FarmBot, select its marker, and confirm the DetailsCard shows MQTT connection state, freshness, last message/status times, device position, and token expiry. Confirm a stopped/stale session is labeled stale. In the Network panel, verify the runtime request includes the selected `projectId` and its response omits broker identity, worker session ID, credentials, and event history. An unassigned FarmBot ID, another owner's Project ID, or an inactive Project Asset/module relationship must return not found. Confirm the public `/api/map/threed` response still contains no MQTT runtime data.

The MQTT persistence validation is also offline. It checks batch limits, UUIDs, owner/broker scope fields, normalized lifecycle and position events, payload fingerprints, and rejection of raw or invalid shapes. After the approved schema is applied, open **MQTT Activity** for an owned FarmBot and verify empty state, current runtime, filters, pagination, refresh, and history cleanup. Confirm another user receives no runtime or history, and confirm general FarmBot/map responses do not include these records.

The Phase 3 command-policy validation is offline and has no database, MQTT connection, or hardware access. It requires a versioned `water` semantic intent with a positive Project ID and UUID v4 idempotency key; rejects emergency stop on the normal path plus raw command names, pins, durations, topics, and CeleryScript; verifies that lifecycle states cannot skip dispatch acknowledgement or leave a terminal state; and checks the Phase 3C requested-record mapper, UUID/time validation, owner normalization, and idempotency matching. Phase 3D coverage additionally verifies the 60-second request lifetime, active-command exclusion, current Water binding requirement, exact peripheral snapshots, output mode 0, server-owned 5-second duration, 10-second hard maximum, and SHA-256 fingerprint preparation.

For Phase 3D, confirm `command-validation-core` has no database, route, MQTT, worker, credential, network, publish, CeleryScript, RPC-label, or hardware dependency. The server repository may use the existing FarmBot REST peripheral validator and atomically transition an already scoped `requested` row to `validated` or `rejected`. It must recheck scope, request state, binding, expiry, and per-FarmBot concurrency under a transaction lock. FarmBot REST/service failures must leave the request unchanged. Only the Phase 3E generic authorization route may call this transition; direct Water and Move routes must continue returning `503`.

For Phase 3E, `POST /api/threed/farmbots/commands` may create/reuse and validate only a strict semantic Water audit request for the authenticated owner. Confirm malformed, oversized, extra-field, unassigned, and idempotency-conflict requests fail closed. A successful response must say `deliveryEnabled: false` and must omit binding/peripheral identity, pins, fingerprints, credentials, broker data, and provider responses. Confirm the route has no MQTT/worker/publish/RPC/CeleryScript dependency and the direct Water and Move routes still return `503`.

For Phase 3F-A, `npm run validate:farmbot-worker` checks the offline FarmBot Water delivery envelope and RPC acknowledgement mapping. Confirm it derives only `bot/device_<ID>/from_clients`, uses a server-derived RPC label, and produces exactly `write_pin(1) → wait(5000) → write_pin(0)` for the validated pin in digital mode. Invalid duration, identity, expiry, command state, fingerprint, or response label must fail. Also confirm the shared transport still exposes no publish method, worker health reports `commandsEnabled: false`, the worker server has no command route, and the App response remains `deliveryEnabled: false`.

Phase 3F-B coverage checks the 15-second acknowledgement deadline, no timeout evaluation outside `dispatched`, and the independent Water-off recovery envelope. Recovery must require a valid `dispatchedAt`, a post-dispatch/uncertain state, the validated pin snapshot, and a distinct server-derived RPC label. Its body must contain only digital `write_pin(0)`. Matching recovery success/failure responses are interpreted separately. Confirm there is still no scheduler, publish method, or worker caller; Phase 3F-C owns the later dormant database transitions.

Phase 3F-C policy coverage checks exact accepted, dispatched, acknowledged/rejected, completed, and timed-out transitions; timestamp ordering; acknowledgement deadlines; and exact RPC-label correlation. Repository review must confirm owner-scoped conditional updates and per-FarmBot transaction locks. Acceptance and dispatch must repeat active Project assignment checks, while outcomes for already dispatched commands remain recordable. Confirm no App/worker caller imports the lifecycle methods and the command API still returns only `validated` with `deliveryEnabled: false`.

For Phase 3F-D, inspect the generated Drizzle migration before applying it. It should only add the nullable recovery state, recovery RPC label, bounded error code, required/dispatched/resolved timestamps, the unique recovery-label index, and recovery checks to `threed_farmbot_commands`. It must not drop, rename, or rewrite existing command or MQTT data. Confirm the checks require a complete ordered lifecycle for `required`, `dispatched`, `confirmed`, and `failed`, while existing rows with all recovery fields null remain valid. Confirm no raw payload, topic, credential, CeleryScript, or provider response field is added. Run `db:push` only against the intended development database after reviewing the generated SQL.

Phase 3F-E policy coverage checks deterministic recovery-label derivation, proof of original dispatch, `required → dispatched → confirmed/failed`, timestamp order, and exact acknowledgement-label matching. Repository review must confirm owner scope, per-FarmBot locks, and conditional recovery-state updates. Recovery after original dispatch must remain recordable without an active Project assignment. Confirm no route, scheduler, worker, MQTT observer, transport, or browser caller imports the recovery writers and that MQTT publishing remains unavailable.

For Phase 4A, `npm run validate:farmbot-worker` checks the strict signed-worker Water request parser. It must accept only an `accepted`, unexpired, server-resolved Water snapshot with the fixed five-second duration and exact server-derived RPC label. Extra fields, topics, CeleryScript, arbitrary durations, invalid pins, mismatched labels, and expired commands must fail. Confirm the parser has no server route, worker-client caller, registry dependency, transport publish method, or environment switch and worker health still reports `commandsEnabled: false`.

For Phase 4B, the same offline worker validator checks command-session scope and the fail-closed signed endpoint. A command session requires the same FarmBot, owner, and broker identity plus a connected, non-stale status. Missing, mismatched, disconnected, and stale sessions must fail. The default executor must throw commands-disabled, the signed endpoint must not return success, the App worker client must have no command caller, the transport must expose no publish method, and worker health must remain `commandsEnabled: false`.

For Phase 4C, confirm the server-only FarmBot worker client re-parses the strict Water request, rejects a FarmBot path/body mismatch, and uses the signed generic worker client for `POST`. It must send no browser-provided topic or CeleryScript. Confirm no App route, repository, coordinator, World Action, component, or scheduler imports `submitFarmBotWorkerWaterCommand`; the worker executor remains disabled and the MQTT transport remains read-only.

For Phase 4D, offline worker coverage must reject an active duplicate command UUID and a second concurrent command for the same FarmBot. A completed or uncertain execution must retain its command claim; only the known disabled-executor failure may release a claim. Confirm this gate remains process-local, no automatic retry is added, the database remains the durable audit source, the production executor remains disabled, and no MQTT publish method exists. Phase 4G-E later permits only an exact completed retry to recover its original receipt.

For Phase 4E, offline worker coverage must register only a successful executor result whose command UUID, RPC label, and timestamp are valid. A normalized response may settle it only when both FarmBot and RPC label match, and a repeated response must not settle twice. Unknown responses must remain ordinary read-only events. Confirm acknowledgement results have no App reporter or database writer yet, the production executor remains disabled, and no MQTT publish method exists.

For Phase 4F-A, verify the App acknowledgement endpoint requires the worker-to-App HMAC, replay protection, exact JSON content type, and at most 1 KiB. The payload must reject extra fields, invalid owner/FarmBot/UUID/RPC identities, mismatched state/error combinations, malformed dates, and materially future timestamps. The route must verify the stored command belongs to the supplied owner and FarmBot before the locked acknowledgement transition. Matching retries may return the existing result; conflicting state or label must fail. Confirm the worker has no acknowledgement reporter yet and commands remain disabled.

For Phase 4F-B, offline worker coverage must confirm a correlated result is queued once, contains only the normalized acknowledgement fields, uses the existing worker-to-App URL and HMAC signature, survives a failed HTTP attempt, retries with bounded backoff, and flushes on shutdown. Missing both settings must select the disabled sink; partial configuration must fail. Confirm the command executor remains disabled and the MQTT transport exposes no publish method.

For Phase 4G-A, offline worker coverage must require an exact worker success envelope with the submitted command UUID, submitted server-derived RPC label, and a valid acceptance timestamp. Extra envelope or data fields, false success, identity mismatches, malformed timestamps, and timestamps more than 60 seconds from the App clock must fail. Confirm no route, repository, coordinator, World Action, component, or scheduler imports `submitFarmBotWorkerWaterCommand`; the executor remains disabled and no MQTT publish method exists.

For Phase 4G-B, offline worker coverage must map only an accepted policy-version-1 database command and separately verified broker identity into the strict worker request. Valid acceptance and expiry times, owner/FarmBot identity, Water action, fixed duration, pin, fingerprint, and derived RPC label are required. Validated state, missing resolved fields, wrong duration, invalid dates, or future acceptance must fail. Confirm the mapper has no database, route, coordinator, worker-client, component, or scheduler caller and adds no publish method.

For Phase 4G-C, repository review must confirm the delivery-context read is owner-scoped, protected by the existing per-FarmBot advisory lock, and repeats the active Project, ThreeD module, Project Asset, and FarmBot assignment checks. It must require an accepted, unexpired policy-version-1 Water record and a valid canonical broker identity. Confirm it performs no update and has no route, coordinator, worker-client, World Action, component, or scheduler caller.

For Phase 4G-D, offline handoff coverage must load a normalized owner/command delivery context, reject mismatched returned identity before submission, build the strict accepted-record request, submit only that request to the matching FarmBot worker path, and require the matching command UUID, RPC label, and valid worker timestamp in return. Its result must be described only as worker acceptance. Confirm no route, command API, World Action, component, or scheduler calls the handoff, it does not write `dispatched`, the executor remains disabled, and no MQTT publish method exists.

For Phase 4G-E, offline gate coverage must return the original normalized receipt for an exact retry after successful execution without invoking the executor twice. An active retry, any changed request field using the same UUID, and a retry after an uncertain failure must remain conflicts. A disabled-executor failure must still release its claim. Confirm the receipt contains only command UUID, RPC label, and acceptance timestamp; storage remains process-local and commands remain disabled.

For Phase 4G-F, repository review must confirm the worker-dispatch writer is owner-scoped, uses the existing per-FarmBot advisory lock, requires the exact stored RPC label, derives `dispatchedAt` from the validated worker receipt, and conditionally updates only `accepted`. Exact retries may return the matching post-dispatch record. It must not repeat active Project assignment checks after the external handoff, because audit outcomes remain recordable after deactivation. Confirm the writer has no caller and performs no worker request or MQTT publish.

For Phase 4G-G, offline coordinator coverage must prove handoff occurs before dispatch recording, only the normalized receipt fields reach the writer, and invalid command identity, derived RPC label, timestamp, audit identity, audit timestamp, or post-dispatch state fails. An invalid handoff receipt must not invoke the writer. Confirm the coordinator requires an already accepted command, has no route or UI caller, does not infer acknowledgement or completion, and remains blocked by the disabled executor.

For Phase 4G-H, offline pilot coverage must prove the validated command is accepted before dispatch coordination and that an invalid accepted record never reaches dispatch. The accepted audit must match owner, command UUID, policy version 1, Water semantics, accepted state, derived RPC label, valid acceptance time, and unexpired lifetime. The final audit must match identity and a recognized post-dispatch state/timestamp. Confirm the pilot accepts no browser intent, has no caller, and remains blocked by the disabled executor.

For Phase 4I-A, offline completion coverage must prove `rpc_ok` records acknowledgement before completion at the same verified response time, while `rpc_error` records only `rejected`. Command UUID and server-derived RPC identity, acknowledgement/rejection state, rejection code, and timestamps must match exactly. Completed and rejected retries must be idempotent. Confirm the route retains worker HMAC, nonce replay protection, owner/FarmBot scope, strict body limits, and limited response fields; commands remain disabled.

For Phase 4I-B, offline timeout coverage must record `timed_out` before requiring recovery and must not call recovery for invalid timeout output. It must verify owner/command identity, `ack_timeout`, the original dispatch timestamp, the full 15-second deadline, terminal ordering, deterministic recovery label, and recovery-required time. Repository timeout and recovery-required retries must be idempotent only for matching states. Confirm no scheduler, route, recovery worker request, or MQTT publish calls the coordinator.

For Phase 4I-C, offline worker coverage must map only a policy-version-1 Water command in timed-out or post-dispatch rejected state with a valid resolved snapshot and `recoveryState: required`. The strict request must contain only owner/FarmBot/broker/command identity, `water_off`, required state, fixed pin, fingerprint, deterministic recovery label, and required timestamp. Topics, CeleryScript, durations, pin values/modes, extra fields, wrong labels/states, and materially future timestamps must fail. Confirm the contract has no route, endpoint, client, repository caller, publisher, or hardware path.

For Phase 4I-D, offline worker coverage must send the strict Water-off recovery request through the separately signed `/recoveries` endpoint with a matching fresh owner/broker-scoped session and receive `503` from the default disabled recovery executor. Invalid content type, oversized or extra-field payloads, path/body identity mismatch, and unavailable or stale sessions must fail before execution. Confirm recovery does not enter the normal command gate, production injects no enabled recovery executor, health reports `commandsEnabled: false`, no App client calls the endpoint, and no MQTT publish method exists.

For Phase 4I-E, offline worker coverage must verify the recovery submission builder re-runs the strict parser, derives only `/internal/v1/farmbots/:id/recoveries`, and rejects path/body identity mismatch. The client response parser must require an exact success envelope with the matching command UUID, deterministic recovery RPC label, and a valid acceptance timestamp within 60 seconds. Extra fields, changed identities, malformed dates, and excessive clock skew must fail. Confirm the client has no production caller, the endpoint still uses the disabled executor, and MQTT publishing remains unavailable.

For Phase 4I-F, repository review must confirm the recovery delivery-context read is owner-scoped, transactionally locked per FarmBot, and requires policy-version-1 Water, proof of original dispatch, timed-out or post-dispatch rejected state, `recoveryState: required`, the deterministic recovery label, ordered timestamps, and canonical broker identity. It must not require active Project assignment or FarmBot activation because those may change after dispatch. Confirm the read has no caller and does not transition recovery, contact the worker, publish MQTT, or operate hardware.

For Phase 4I-G, offline worker coverage must compose the recovery context, strict required-record mapper, signed client boundary, and strict receipt without widening the payload. A context owner or command mismatch must prevent worker submission. A receipt with the wrong command, recovery label, invalid date, or excessive clock skew must fail. Confirm the handoff result represents worker acceptance only, the server wrapper has no caller, recovery is not marked dispatched, the worker executor remains disabled, and MQTT publishing remains unavailable.

For Phase 4I-H, repository review must confirm recovery dispatch requires owner, command UUID, exact stored recovery RPC label, and worker acceptance timestamp under the per-FarmBot lock. Only `required → dispatched` may be written; exact retries may return dispatched or resolved recovery records, while changed labels or timestamps must fail. Confirm the older time-only writer is absent, no active Project/FarmBot check blocks post-handoff audit continuity, the writer has no caller, and it performs no network, MQTT, or hardware action.

For Phase 4I-I, offline worker coverage must reject an invalid handoff receipt before calling the recovery dispatch writer and reject an audit whose command, recovery label, state, or dispatch timestamp differs from the verified receipt. The valid sequence must call handoff before audit and return only the persisted recovery dispatch fields. Confirm the server wrapper has no external caller, the result does not claim broker/device acknowledgement, the worker executor remains disabled, and no MQTT publish method exists.

For Phase 4I-J, offline worker coverage must validate recovery executor results before the worker endpoint returns success. Only the exact command UUID, deterministic recovery label, and ISO acceptance timestamp within 60 seconds are allowed. Extra fields, identity changes, malformed dates, and clock skew must fail, and the endpoint must return a limited `502` for an invalid injected result. Confirm production still injects the disabled recovery executor and no gate, publisher, physical operation, schema, environment switch, or App caller is added.

For Phase 4I-K, offline worker coverage must reject an active duplicate recovery UUID and a second concurrent recovery for the same FarmBot. An exact completed retry must reuse its original validated receipt without another executor call; a changed request and an uncertain invalid result must remain claimed. Only the known disabled-executor failure may release its unused claim. Confirm the gate is process-local, production remains disabled, and shared normal-command/recovery arbitration is still required before enabling execution.

For Phase 4I-L, offline worker coverage must inject one shared device arbiter into the normal command and recovery gates. An active Water command must block recovery for the same FarmBot, and an active recovery must block a normal Water command. Each completed operation must release the shared device claim. Confirm the arbiter remains process-local, does not replace database locks or audit state, both executors remain disabled, and no MQTT publisher exists.

For Phase 4I-M, offline worker coverage must register recovery correlation only after a valid executor receipt and settle it only for the exact FarmBot and deterministic recovery RPC label. `rpc_ok` must normalize to confirmed, `rpc_error` to failed with the bounded recovery error, unknown labels must remain untouched, and a repeated response must not settle twice. Confirm the registry continues to persist every normalized RPC event, recovery results have no App reporter or database writer yet, both executors remain disabled, and no publish method exists.

For Phase 4I-N, verify the App recovery acknowledgement endpoint requires the worker-to-App HMAC, replay protection, exact JSON content type, and at most 1 KiB. The strict payload must reject extra fields, invalid owner/FarmBot/UUID identity, a non-deterministic recovery label, mismatched confirmed/failed error fields, malformed dates, and materially future timestamps. The route must verify owner and FarmBot scope before the locked recovery writer. Matching resolved retries must be idempotent. Confirm the worker has no recovery reporter yet and no raw broker data, publisher, or physical action is added.

For Phase 4I-O, verify the recovery gate reports exactly one result only after matching the FarmBot and deterministic recovery RPC label. Confirm the separate HTTP reporter signs the strict recovery payload, retains a failed delivery, succeeds on retry, and is flushed during worker shutdown. With neither App reporting setting present it must remain disabled; configuring only the App base URL or only the worker-to-App HMAC key must fail startup. Confirm both production executors remain disabled and no MQTT publisher or hardware action is introduced.

For Phase 4I-P, verify the recovery reporter accepts only the exact App success envelope containing the queued command UUID and matching confirmed/failed recovery state. Extra fields, false success, malformed data, changed command identity, or changed state must fail. Confirm an HTTP `202` with a mismatched receipt remains queued and succeeds only after a later matching retry. This receipt must not be described as broker delivery or physical recovery; both executors remain disabled and no publish method is introduced.

For Phase 4J, verify the normal acknowledgement reporter accepts only an exact App success envelope with the queued command UUID. An acknowledged RPC must return final state `completed`; a rejected RPC must return `rejected`. Extra fields, false success, malformed data, changed identity, or changed state must fail, and a mismatched HTTP `202` must remain queued for retry. Confirm both executors remain disabled and no timeout runner, MQTT publisher, or physical operation is introduced.

For Phase 4K-A, verify the strict timeout report accepts only version, owner/FarmBot/command identity, the derived primary RPC label, worker acceptance time, timeout-observation time, and fixed `ack_timeout` reason. It must reject extra fields, invalid identity, changed labels, malformed dates, observations earlier than the 15-second acknowledgement deadline, and materially future times. Confirm it has no gate, timer, reporter, route, repository caller, recovery trigger, MQTT publisher, or physical behavior.

For Phase 4K-B, verify the private timeout endpoint requires worker-to-App HMAC authentication, replay protection, exact JSON content type, and at most 1 KiB. The ingestion coordinator must match the stored owner, FarmBot, primary RPC label, and dispatched time to the report and allow only dispatched or exact already-timed-out state before calling the timeout/recovery writer. Invalid audit identity or completed, acknowledged, and rejected commands must not reach the writer. Confirm there is no worker timeout reporter, deadline timer, scheduler, automatic recovery handoff, publisher, or physical action.

For Phase 4K-C, verify the separate timeout sink signs and queues the strict report, retains it after a failed request, and accepts only an exact App receipt with matching command UUID, `timed_out` state, deterministic recovery label, and allowed recovery lifecycle state. A mismatched successful HTTP response must remain queued for retry. Missing both reporting settings must select the disabled sink and partial configuration must fail. Confirm no gate calls the sink, no deadline timer exists, and automatic recovery, MQTT publishing, and physical behavior remain disabled.

For Phase 4K-D, verify a validated executor receipt registers its deadline from `acceptedAt`, an exact RPC response cancels it, and a deadline firing first removes correlation and queues one timeout report. A late RPC must not settle the timed-out command, and an early timer wakeup must re-arm. Shutdown must cancel pending timers and flush timeout and acknowledgement sinks. Confirm the monitor is process-local, restart reconciliation remains absent, the production executor remains disabled, and no automatic recovery, publisher, or physical action is introduced.

For Phase 4K-E, verify the repository loads at most 100 oldest dispatched commands at or beyond the 15-second deadline. The reconciliation core must validate owner, FarmBot, UUID, primary RPC label, dispatched state, and timestamp before invoking the timeout transition. It must reject malformed candidates, validate the resulting deterministic recovery identity, and count an acknowledgement race as skipped without aborting the batch. Confirm the reconciler has no route, startup hook, interval, or worker caller and introduces no schema, publisher, automatic recovery, or physical action.

For Phase 4K-F, verify the private reconciliation endpoint requires worker HMAC authentication, replay protection, exact JSON, and a request limit from 1 through 100. The worker runner must make one startup request, use production limit 50, avoid overlapping interval calls, stop its interval, and await active work during shutdown. Its strict response must require consistent nonnegative aggregate counts. Confirm no command rows or database credentials reach the worker and that reconciliation performs no recovery handoff, MQTT publish, or physical action.

For Phase 4L-A, verify the strict emergency Water-off request contains only version, owner/FarmBot/broker identity, server-generated emergency UUID, `emergency_water_off`, server-resolved pin, deterministic emergency RPC label, request time, and exact 60-second expiry. Reject extra fields, invalid identity, arbitrary semantics, invalid pins, changed labels or lifetimes, and expired requests. Confirm the parser has no route, repository, executor, gate, client, publisher, UI caller, or physical behavior. Do not add emergency audit schema without separate approval.

For Phase 4L-B, inspect generated SQL before applying it. It must only create `threed_farmbot_emergency_actions` with its indexes, checks, and foreign keys. Confirm there is no drop, rename, truncation, rewrite, or alteration of an existing table. The table must have no Project dependency, normal command dependency, credential, MQTT topic/payload, CeleryScript, arbitrary JSON, or browser operation field. Verify binding deletion sets the reference to null without clearing immutable snapshots, lifecycle checks require fixed mode-0 Water resolution for execution states, and expiry is exactly 60 seconds. Do not run `db:push` until the generated proposal matches this declaration.

For Phase 4L-C, run `npm run validate:farmbot-command-policy` and confirm six groups pass. The emergency lifecycle must derive its RPC label and exact 60-second expiry, require an active owner/FarmBot-matched Water binding in mode 0, prevent state skipping, allow rejection or expiry only before acceptance, and require exact RPC correlation for acknowledged/failed outcomes. Confirm the module has no database import, repository writer, route, worker client, MQTT publisher, UI caller, or hardware behavior.

For Phase 4L-D, review `emergency-action-repository.ts` and confirm every lookup and mutation is owner-scoped, each mutation takes the shared `farmbot-command:<id>` advisory transaction lock, and writes require the exact prior lifecycle state. Creation must generate the UUID server-side and require an owned FarmBot. Validation must read only the owner's saved Water binding and persist immutable mode-0 snapshots or a bounded rejected/expired result. Confirm no file outside the repository imports it and that it has no Project dependency, route, worker client, MQTT publisher, UI caller, or physical behavior.

For Phase 4L-E, verify the accepted emergency context read requires owner scope, the shared per-FarmBot lock, policy version 1, `emergency_water_off`, accepted and unexpired state, complete mode-0 Water snapshots, and a canonical `device_<number>` broker identity. The pure mapper must reject changed state, policy, action, mode, pin, RPC label, expiry, or broker identity and must return only the strict Phase 4L-A request fields. Confirm there is no handoff/client call, worker endpoint caller, dispatch writer invocation, publisher, UI control, or physical behavior.

For Phase 4L-F, verify the emergency submission builder accepts only a matching positive FarmBot path/body identity and returns exactly `/internal/v1/farmbots/:id/emergencies` plus the normalized strict request. The acceptance parser must reject extra fields, false success, changed emergency UUID or RPC label, malformed timestamps, and clock skew beyond 60 seconds. Confirm the server has no `/emergencies` handler and no production file calls `submitFarmBotWorkerEmergencyWaterOff`; both executors must remain disabled and MQTT publishing unavailable.

For Phase 4L-G, verify the signed worker `/emergencies` endpoint requires HMAC/replay checks, exact JSON, at most 1 KiB, matching path/body FarmBot identity, and a connected fresh owner/broker-scoped session. The default dedicated emergency executor must return `503`; an injected result with extra fields, changed emergency UUID/RPC label, malformed time, or clock skew must fail validation. Confirm production injects only the disabled executor, health remains `commandsEnabled: false`, the App submit client still has no caller, and there is no execution gate, MQTT publisher, UI control, dispatch write, or physical behavior.

For Phase 4L-H, verify the emergency gate claims by emergency UUID, reuses only an exact completed receipt, rejects changed duplicates, releases a claim only for the known disabled-executor failure, and retains a claim after an invalid or uncertain result. Using one shared arbiter, prove an active emergency blocks normal Water and recovery and an active normal command blocks emergency execution for the same FarmBot. Confirm the gate is process-local, production remains disabled, health remains command-disabled, and no acknowledgement observer, publisher, App handoff caller, UI control, or physical behavior exists.

For Phase 4L-I, verify emergency correlation is registered only after a valid executor receipt and requires the exact FarmBot plus emergency RPC label. Wrong FarmBot, unknown label, malformed response time, and repeated response must return no result without settling incorrectly. Confirm `rpc_ok` normalizes to acknowledged with no error and `rpc_error` to failed with `farmbot_emergency_rpc_error`. The registry must continue normal event persistence, while the emergency result has no sink, App endpoint, repository caller, publisher, UI control, or physical behavior.

For Phase 4L-J, verify the private emergency acknowledgement endpoint requires worker-to-App HMAC authentication, nonce replay protection, exact JSON, and at most 1 KiB. Its strict parser must reject extra fields, invalid owner/FarmBot/emergency identity, a non-derived RPC label, inconsistent acknowledged/failed error fields, malformed time, and receive times more than 60 seconds in the future. The route must verify owner and FarmBot scope before using the existing emergency outcome writer and return only the emergency UUID and stored terminal state. Confirm there is still no worker emergency acknowledgement sink or reporter, no endpoint caller, no MQTT publisher, no UI control, no schema change, and no physical behavior.

For Phase 4L-K, verify the emergency gate records only its exact one-time correlated result into the dedicated sink and exposes shutdown flushing. The HTTP sink must sign the strict payload, queue by emergency UUID, retry failed requests with bounded backoff, and retain an item after malformed, extra, false-success, changed-emergency, or changed-state receipts. Missing App URL and HMAC configuration must select the disabled sink; partial configuration must fail. Confirm the queue is process-local, production still injects the disabled emergency executor, health remains command-disabled, and no MQTT publisher, UI control, schema change, or physical operation exists.

For Phase 3C, confirm `command-repository` has no imports from App routes, browser components, ThreeD MQTT, or worker code. The repository may create only `requested` records after active owner/Project/module/asset/FarmBot scope checks and may perform owner-scoped lookup. It must expose no transition, dispatch, publish, peripheral, duration, coordinate, RPC, acknowledgement, or emergency-stop writer. The existing FarmBot command and Water routes must continue returning `503`.

For the Phase 3B command-audit schema, inspect the `db:generate` output before applying it. The proposal should only create `threed_farmbot_commands` with its indexes, checks, and foreign keys. It must not drop, rename, truncate, or rewrite existing FarmBot/MQTT tables. Confirm the table has no credential, raw MQTT topic/payload, CeleryScript, arbitrary JSON, or emergency-stop field. Run `db:push` only against the intended development database after that review.

It also covers the pure MQTT readiness evaluator. A ready result requires a configured non-expired credential, verified `REST ID ↔ device_<ID>` parent identity, an exact token/snapshot match, and a REST-verification timestamp.

For the Admin refresh workflow, manually open **FarmBot Connection**, note the broker snapshot, select **Refresh**, and confirm the observation/REST-verification times update without changing the saved Water assignment. Confirm the displayed expiration is not extended. This is a REST-only check; it does not establish MQTT or physical-device connectivity.

Select **Readiness** and confirm a verified current configuration reports **Ready**. Replacing a credential should clear the displayed result until it is checked again; an untested replacement should report REST verification as required. This check is local and must not produce a FarmBot network request, MQTT connection, or hardware action.

For FarmBot World Action targeting, load a project with an assigned active FarmBot and character. Select the FarmBot, choose **Use as Action Target**, and verify the current-target label, green scene pulse, Focus Target, and Clear Target behavior. Run a character action and confirm the completion toast identifies the FarmBot as an animation-only target. In the Network panel, confirm this does not call `/api/threed/world-actions`, a FarmBot command route, MQTT, or a peripheral endpoint. Then retest a Planting-targeted Water action to ensure its established post-animation persistence still works.

While that FarmBot remains targeted, confirm the character card shows only the **FarmBot Interaction** group with **Point**, **Point Gesture**, and **Talk**. Confirm Planting, Harvesting, and Animal Care groups are hidden. Clear the target and verify the full action palette returns, then select a Planting target and verify its action palette and established Water persistence remain unchanged.

For the FarmBot parent-identity schema revision, inspect the `db:push` proposal before accepting it. Confirm `threed_farmbots.device_id` is renamed to `asset_code`, existing asset-code values are preserved, nullable `farmbot_device_id` and `broker_device_id` are added to `threed_farmbots`, and the existing snapshot-owned broker column is retained during backfill. Afterward, use **Test** and verify the parent row stores the REST ID and exactly `device_<REST ID>`. Reopen the dialog and confirm the verified identity is displayed and the Water assignment remains intact.

`npm run typecheck` is the canonical full TypeScript command and expands to `tsc --noEmit --pretty false`.

## v0.18.6b release-candidate checks

- Run `npm run validate:threed-runtime-markers` and confirm all registry, builder, snapshot validation, and saved-position merge groups pass.
- Run `npm run validate:threed-orchestration` and confirm all Action Target identity, capability, range, lifecycle, and direction groups pass.
- Run `npm run typecheck` and `git diff --check`.
- Manually confirm movement does not write `project_threed_markers`; **Save ThreeD Project** writes the complete unfiltered snapshot; refresh restores saved Ecctrl coordinates; and removed or inactive Project assignments do not restore stale markers.
- Manually recheck selection, layers, DetailsCard, Take/Release Control, camera modes, Action Target range and generic interactions, GardenCharacter wandering, targeted Water, Pick Fruit persistence, and task-to-locomotion crossfades.
- Confirm no marker snapshot path exposes credentials, publishes MQTT, invokes the worker, or authorizes a physical operation.
- Run the production build from the client environment and use Vercel as the deployment build gate.

## v0.18.7a pre-release checks

- Run `npm run validate:assets`, `npm run validate:threed-runtime-markers`, `npm run validate:threed-orchestration`, `npm run typecheck`, and `git diff --check`.
- Upload or select an active, public, non-Character Library model and place it once in the 3D Scene. Confirm one `project_threed_markers` row is created and no write occurs during hover or render frames.
- Select the placed Model and verify instance name, scale multiplier, and Y rotation update only that marker. Delete a disposable placement and confirm the reusable `threed_models` row and stored file remain.
- Confirm Model create/update/delete does not visibly reload the Canvas or reset unrelated markers.
- Open the Map Controls and enable **Physics Debug**; confirm each placed general Model has one fixed collider enclosing the whole visible asset. Toggle it off and on without reloading the Scene, take control of an Ecctrl Character, and confirm it cannot walk through the Model. Change instance scale and verify the collider follows the resized asset boundary. `physicsDebug=1` may be used when the debug view must start enabled.
- With Physics Debug enabled, hide each Scene Layer individually. Confirm its visuals and collider outlines disappear, hidden Character movement input stops, and the enabled layers retain their own Physics Debug outlines without moving the ground, camera center, or any marker. Show the layer again and confirm the same retained marker instances and collider outlines return at their prior runtime positions without requiring Take Control again.
- Regression sequence: edit a Model scale, select a movable Character, choose **Take Control**, use WASD, and confirm the Character model, Ecctrl physics body, and blue halo move together. Repeat **Release Control**. A hard refresh must not be required to recover control.
- Refresh explicitly and verify the Model placement, composed scale, rotation, and grounded Y position restore from `project_threed_markers`.
- Recheck GardenCharacter wandering, external FBX animations, idle/walk/run, task-to-locomotion crossfades, DetailsCard, Action Targets, targeted Water, and Pick Fruit persistence.
- Run `npm run build` manually in the client environment and use Vercel as the deployment build gate.

### v0.18.7b Bed placement and editing check

- Open an owned Project with an active ThreeD module, open the Project menu, and choose **Add Bed**.
- Enter a unique name and visible width, length, height, color, rotation, and scale values. Choose **Place Bed**, then click the Scene ground once.
- Confirm one success toast, one new `threed_beds` row, one active `project_assets` assignment with `asset_type = 'threed_beds'`, and one `project_threed_markers` row with `marker_type = 'beds'` and `marker_id = beds-{bed.id}`.
- Confirm the new Bed appears immediately without a Project reload, uses the entered dimensions/color/rotation/scale, participates in collision and Physics Debug, and remains at the selected position after refresh.
- Confirm rapid or repeated ground clicks do not create duplicate Beds, and cancelling before ground click creates no database rows.
- Select the placed Bed and edit its width, length, height, X/Y/Z position, and Y rotation in DetailsCard. Save and confirm the visual plus Physics Debug collider update immediately without a Project reload.
- Confirm Y rotation is entered and stored in degrees. The Scene alone converts it to radians for Three.js and Rapier.
- Confirm the edited `project_threed_markers` row contains the new instance values, while its source `threed_beds` row remains unchanged.
- Refresh and confirm the edited Project instance restores. Then change the source Bed and refresh again; the saved Project instance must not drift to the source values.
- After editing the Bed, Take Control of an EcctrlCharacter and confirm the Character, collider, and selection halo still move together with WASD.

### Post-v0.18.7b Planting placement and editing check

- Open an owned Project with an active ThreeD module, open the Project menu, and choose **Add Planting**.
- Confirm the panel lists only the authenticated user's active Plants. Select a Plant and optionally a Bed already assigned to the current Project and ThreeD module.
- Set quantity, optional spacing, and model scale. Choose **Place Planting**, click the Scene ground once, and confirm one `threed_plantings`, one active `project_assets`, and one `project_threed_markers` row are created together.
- Set quantity to 4 and confirm the Scene renders four independently selectable Plantings in a centered layout. Confirm four `threed_plantings`, four `project_assets`, and four `project_threed_markers` rows were created, each source has `quantity = 1`, and spacing controls their separate XYZ positions.
- While placement is active, hover and click the top of an assigned Bed. Confirm the preview follows the Bed surface, the Bed is not selected, and the saved Planting Y position uses the clicked Bed surface rather than ground Y=0.
- Confirm an optional Bed assignment is accepted only when that Bed belongs to the same Project and ThreeD module. Spatial restriction to the Bed boundary is deferred; assigned and unassigned Plantings currently retain their requested XYZ positions.
- Confirm the Planting appears immediately without a Project reload. If its Plant has a model, confirm that model renders; otherwise confirm the procedural Plant marker renders.
- Select one Planting and confirm its editor has no quantity or spacing fields. Edit model scale and X/Y/Z position, then save. Confirm only that visual and collider update immediately.
- Click **Delete Planting**, confirm the prompt, and verify only the selected marker, its `project_assets` assignment, and its dedicated `threed_plantings` source are removed. Sibling Plantings must remain visible and stored.
- Confirm only `project_threed_markers` changes during instance editing. The source Planting, Plant, optional Bed, and Model must remain unchanged.
- Refresh and confirm the Planting restores its saved Project-instance values. Confirm cancelling before ground click creates no records and repeated clicks cannot create duplicates.
- Recheck Planting Action Target behavior, targeted Water/Pick Fruit, layer visibility, Physics Debug, and Ecctrl Take/Release Control plus WASD after Planting creation and editing.
- Select an Ecctrl Character after placement and confirm Take Control, WASD, the Character model, and its selection halo still move together.

`npm run validate:assets` verifies that every file in the external character animation manifest and every required local Three.js DRACO decoder file exists under `public/`. It must pass in a clean Git checkout before deployment; in CI, successful validation after `actions/checkout` also proves the required assets are tracked by Git.

`npm run validate:farmbot-crypto` exercises the server-side FarmBot credential envelope, persistence conversion, versioned key-provider policy, token-response validation, limited JWT metadata decoding, strict broker-metadata validation, allowlisted read-only device/peripheral parsing, and fail-closed peripheral-binding snapshot validation without using a real credential, database, network connection, or hardware device.

After applying the broker-metadata schema to an approved development database, run the REST connection test and verify that the Admin snapshot and database row show current MQTT/MQTT-WebSocket metadata with a new `restVerifiedAt`. Confirm that general FarmBot and map responses still omit this data.

After applying the FarmBot peripheral-binding schema to an approved development database, manually verify assignment, reassignment, removal, and automatic invalidation after credential replacement. Assignment must not invoke a hardware route or change a FarmBot pin.

## v0.18.1b production regression checks

- Verify credential login/store/replace/clear never returns the JWT or encrypted envelope to the browser.
- Run **Test**, **Discover**, Water assignment, **Validate**, broker **Refresh**, and **Readiness** against an owned FarmBot.
- Confirm a different user cannot read or modify that FarmBot's credential, peripheral assignment, broker metadata, or readiness result.
- Confirm general FarmBot CRUD and `/api/map/threed` responses omit credential and broker metadata fields.
- Confirm authenticated command, polling, Water, and movement routes return `503` and the retained poller command boundary rejects before making a request.
- Confirm FarmBot targeting remains animation-only and Planting-targeted Water and Pick Fruit behavior remain unchanged.
- Confirm the read-only worker connects only after an explicit Start request, subscribes only to `status` and `from_device`, and stops cleanly.
- Confirm Admin and Dashboard show current normalized status while raw payloads, credentials, broker/session identities, and private worker configuration remain hidden from general browser responses.
- Confirm no MQTT publish interface or physical command is present in the v0.18.1b release.

## GitHub Actions

`.github/workflows/validation.yml` runs for pull requests and pushes to `main`.

- Production animation asset validation is a blocking check.
- TypeScript type checking is a blocking validation step.
- Vercel remains the production-build gate because its build uses the configured deployment environment.

## TypeScript baseline

The pre-existing v0.17.0 TypeScript baseline was repaired and released in v0.17.2. A successful change now requires:

- `npm run typecheck` exits successfully with no diagnostics; and
- the production build remains successful when the validation ladder calls for it.

Do not suppress new diagnostics or make TypeScript non-blocking to land unrelated work.

## ThreeD release-blocking manual checks

- Farmer FBX model renders.
- After shared ThreeD Scene or Model renderer changes, Character selection and Ecctrl Take Control / WASD / Release Control work before and after a hard browser refresh. Report any hot-reload-only loss of controls as a regression watch even when refresh restores operation.
- With several independent Planting RigidBodies loaded, toggle Physics Debug on and off and confirm collider outlines update without a Rapier `recursive use of an object` error or Canvas error loop.
- Repeat the same check with several Plantings that share one asynchronously loaded GLB/FBX Plant model. Confirm each receives its own explicit collider and the Canvas remains mounted while the model bounds finish loading.
- External FBX animations load.
- Idle, walk, and run work.
- `GardenCharacter` autonomous movement works.
- `EcctrlCharacter` Take/Release Control and WASD work.
- Task animations return cleanly to locomotion.
- DetailsCard opens and targeting controls work.
- Targeted Water persists after animation completion.
- Targeted Pick Fruit creates one project-scoped harvest record.

## v0.18.7c ThreeD Layers Scene contract checks

- Open a normal owned Project without `physicsIsolation` or `physicsDebug` URL parameters. Confirm the persistent Canvas mounts once and contains an Ecctrl Character together with fixed Beds, Plantings, Models, and FarmBots.
- Confirm the browser and development-server consoles contain no `unreachable executed`, `attempted to take ownership of Rust value while it was borrowed`, or `recursive use of an object detected which would lead to unsafe aliasing in rust` errors.
- Hide and show each ThreeD Layer. Confirm only that Layer's visuals, pointer behavior, input, collision participation, and Physics Debug output change. Marker positions and unrelated runtime state must remain unchanged.
- Edit one Bed or Planting instance. Confirm only its stable `marker_id` transaction changes and the Canvas, Physics world, Character, and unrelated markers are not remounted.
- Select a movable Character, Take Control, use WASD, and confirm the Character model, Ecctrl body, and selection halo move together before and after another marker transaction.
- Treat activation of the Canvas Rapier failure circuit as failed validation. Containing the error is not a passing physics result.
- Run `npm run validate:threed-runtime-markers`, `npm run typecheck`, and `git diff --check`. Run `npm run build` manually in the client environment before deployment.

## Reporting

Every completed change should report:

- files changed and responsibility of each change;
- commands run and exact outcomes;
- unrelated worktree changes observed but not modified;
- assumptions, remaining risks, and manual checks still required.
