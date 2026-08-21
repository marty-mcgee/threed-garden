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

The user generated and applied the Phase 3F-D schema. Phase 3F-E adds dormant owner-scoped repository writers for the recovery lifecycle. They lock per FarmBot, require exact prior recovery state and RPC correlation, and preserve ordered timestamps. They do not require an active Project assignment after the original dispatch because the Water-off safety outcome must remain auditable. No runtime caller invokes these writers.

The legacy `threed_farmbot_logs` table remains separate because `FarmBotPoller` still references its older sensor/log shape. New MQTT activity must not write to its unrestricted `rawData` field.

The Drizzle declarations are authoritative for exact column names and relationships. Never derive a schema change from this overview alone.
