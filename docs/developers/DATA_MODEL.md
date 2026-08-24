# Data Model

Schemas are grouped by domain under `src/lib/schema`: auth, project, settings, music, ThreeD, and traffic.

## Ownership and project scope

Domain records carry a `userId` for ownership. Modules and their child records remain independently manageable, while project membership is expressed through junction data:

- `project_threed`
- `project_traffic`
- `project_music`
- polymorphic `project_assets`

A record normally must be owned/accessible, active, and explicitly assigned before it is returned as a project asset. Do not infer assignment from `isActive` alone.

## ThreeD runtime data

Beds, plantings, characters, FarmBots, and models become runtime markers from project assets. There is no current persisted `threed_markers` table. `threed_weather_logs` is deferred and should not be expanded without a separate approved milestone.

### ThreeD Model Library visibility

The current development schema adds `threed_models.is_public` and `threed_models.is_library_item`, both defaulting to false. Ownership remains on `user_id`: these flags allow an active model to appear in the shared read-only ThreeD Model Library but never grant update, upload, file deletion, or model deletion authority. Shared-library reads require both flags plus active model status and exclude `used_by_characters = true`. Character models must enter the Scene through the separate Character architecture. Owner-scoped Admin reads retain the complete management record; shared reads expose only rendering and associated-file fields.

Admin Model CRUD persists the existing `used_by_plants` and `used_by_characters` flags on create and update. These fields classify reuse; they do not replace `model_type`, which describes the asset file/loader format.

Library records are reusable assets rather than Project placements. Each placed Model receives its own Project-scoped marker identity and transform, so one Library model can be instantiated more than once. Existing Bed, Planting, Character, and FarmBot visuals are not replaced by Library selections.

### Project ThreeD Model markers

`project_threed_markers` is the Project Scene-placement authority. A Model placement uses `marker_type = 'models'`, references its reusable `threed_models` asset through `source_asset_id`, and has a unique `marker_id`. Many marker rows may reference the same Model within one Project.

The marker stores its display name, position, visibility, active state, and placement data such as rotation and scale multiplier. The Model record continues to own the file URL and base scale/rotation/offset.

Placement CRUD is exposed through `/api/project/threed-markers`. Creation requires an owned Project, an active Project-to-ThreeD assignment, and an eligible non-Character Model. It creates or reactivates the corresponding `project_assets` assignment. `PATCH` and `DELETE` use `?id=X`; snapshot `PUT` remains the explicit whole-Project Save path when no ID is supplied.

The map payload joins saved Model markers to reusable Model render data and returns them through `projectThreedMarkers`; there is no separate Model-instance runtime feed.

Dashboard placement is an explicit user action rather than a render-frame writer. Selecting a Library item and clicking the Scene ground creates one `project_threed_markers` row. Ordinary rendering, pointer movement, camera movement, and Character movement do not create placement rows.

The placement `scaleMultiplier` is relative to the reusable Model's stored `scale`; rendering multiplies both values once.

The model and supporting-file records continue to point to their existing Vercel Blob or Amazon S3 URLs. No second model catalog, placement table, or storage manifest is introduced.

### ThreeD FarmBot identity and security data

`threed_farmbots.id` is the App database primary key used by child records and Project asset relationships. The three external-facing identity fields have separate purposes:

- `asset_code` is the user-managed App label, such as `FARMBOT-003`.
- `farmbot_device_id` is the verified numeric ID returned by the FarmBot REST API.
- `broker_device_id` is the verified MQTT identity, such as `device_15297`.

`threed_farmbot_peripheral_bindings` stores owner-approved semantic peripheral assignments. `threed_farmbot_broker_metadata` stores one redacted token-derived broker snapshot for diagnostics and readiness checks. Encrypted credential envelope columns remain on `threed_farmbots`; they are server-only and must not appear in general CRUD or map payloads. See the [ThreeD FarmBot Integration Plan](FARMBOT_INTEGRATION.md) before changing these fields or relationships.

`threed_mqtt_runtime` stores one current allowlisted worker snapshot per MQTT integration, identified by `integration_type` and `integration_id`. `threed_mqtt_events` stores normalized MQTT lifecycle and adapter-produced event history with event IDs, payload size, and SHA-256 fingerprints. The current FarmBot adapter uses `integration_type = 'farmbot'` and verifies the referenced FarmBot and owner before every write or read. Neither table stores credentials, complete status trees, raw MQTT payloads, or arbitrary CeleryScript. Event history uses a 30-day ingestion-time retention window and owner-controlled cleanup.

These MQTT tables belong to ThreeD, not FarmBot. Their polymorphic integration identity permits later ThreeD MQTT adapters without inheriting FarmBot credentials, peripherals, commands, or schemas. Provider-specific records remain in provider-specific tables.

`threed_farmbot_commands` is the approved and applied Phase 3B semantic command audit/request-state table. It relates each command to its owner, Project, and App FarmBot; enforces an owner/FarmBot idempotency UUID; and records policy version, semantic action, lifecycle state/timestamps, optional server-resolved Water peripheral snapshots, RPC label, redacted rejection code, and command fingerprint. It has no arbitrary JSON, raw MQTT topic, CeleryScript, credential, or emergency-stop record. Phase 3C adds scoped `requested` persistence, and Phase 3D adds bounded Water validation plus atomic `validated`/`rejected` transitions. Phase 3E exposes only authenticated request-and-validation orchestration; it has no dispatch writer. The table can now receive audit authorization records, but no record is delivered to MQTT, a worker, or hardware.

Phase 3F-A adds only an in-memory FarmBot adapter delivery envelope and acknowledgement mapper. It does not change the schema or persist `accepted`, `dispatched`, `acknowledged`, or `completed` states. Raw CeleryScript remains excluded from the database.

Phase 3F-B adds only in-memory timeout and Water-off recovery preparation. The existing `dispatchedAt` value is required as proof that recovery could be relevant. At that checkpoint, recovery payloads and labels were not stored.

Phase 3F-C adds dormant repository writers for the existing `acceptedAt`, `dispatchedAt`, `rpcLabel`, `acknowledgedAt`, `completedAt`, `terminalAt`, state, and bounded rejection fields. They enforce exact prior states, time ordering, owner scope, transaction locks, and conditional updates. No schema field was added. Because nothing calls these writers, current command API records still stop at `validated`.

Phase 3F-D declares an additive Water-off recovery audit lifecycle on the same command row. `recoveryState` is limited to `required`, `dispatched`, `confirmed`, or `failed`; a separate unique recovery RPC label correlates the safety operation; bounded error codes and required/dispatched/resolved timestamps record its outcome. Database checks require complete, ordered fields for each recovery state. The declaration stores no recovery payload, topic, credential, or arbitrary provider response. It does not itself enable a writer, scheduler, MQTT publish method, worker route, or physical operation, and must not be treated as applied until its generated migration is reviewed and pushed.

Phase 4L-B adds the approved and applied `threed_farmbot_emergency_actions` audit for independent Water-off safety requests. It does not use `project_id` or a normal command foreign key because emergency control cannot depend on Project or animation state. It stores owner/FarmBot identity, policy/action/state, an optional binding reference, immutable resolved peripheral snapshots, deterministic emergency RPC identity, bounded outcome code, exact 60-second lifetime, and ordered lifecycle timestamps. Binding deletion may clear the foreign key without erasing snapshots. Credentials, MQTT topics/payloads, CeleryScript, arbitrary JSON, and browser-provided operations are excluded. Phase 4L-C adds a pure policy for valid lifecycle transition records but no database writer.

Phase 4L-D adds dormant owner-scoped repository access for this table. Creation verifies FarmBot ownership; validation snapshots the current active Water binding; and all mutations use a shared per-FarmBot transaction lock plus exact prior-state conditions. The repository deliberately has no Project relationship and no runtime caller.

Phase 4L-E adds a read-only delivery-context query for an accepted, unexpired row and its owned FarmBot's canonical broker identity. The context is not a new table or persisted shape and does not alter the schema.

Phase 4L-F adds no data-model change. Its strict worker acceptance receipt remains in memory and cannot be produced in normal runtime because the worker has no emergency endpoint and the App client has no caller.

Phase 4L-G adds no data-model change. The disabled worker endpoint returns no acceptance receipt in production and does not invoke the emergency repository.

Phase 4L-H adds no data-model change. Its emergency UUID claims and completed receipt cache are process-local worker memory and do not replace `threed_farmbot_emergency_actions`.

Phase 4L-I adds no data-model change. Its pending RPC correlation and normalized acknowledged/failed result remain worker memory and are not yet written to the emergency audit table.

Phase 4L-J adds no data-model change. Its authenticated App endpoint may update an existing dispatched `threed_farmbot_emergency_actions` row to acknowledged or failed through the established owner-scoped repository writer, but no worker reporter calls the endpoint yet.

Phase 4L-K adds no data-model change. Pending emergency acknowledgement deliveries live only in the worker process until the App returns an exact persistence receipt; the disabled production emergency executor prevents this queue from receiving normal runtime entries.

The user generated and applied the Phase 3F-D schema. Phase 3F-E adds dormant owner-scoped repository writers for the recovery lifecycle. They lock per FarmBot, require exact prior recovery state and RPC correlation, and preserve ordered timestamps. They do not require an active Project assignment after the original dispatch because the Water-off safety outcome must remain auditable. No runtime caller invokes these writers.

The legacy `threed_farmbot_logs` table remains separate because `FarmBotPoller` still references its older sensor/log shape. New MQTT activity must not write to its unrestricted `rawData` field.

The Drizzle declarations are authoritative for exact column names and relationships. Never derive a schema change from this overview alone.
