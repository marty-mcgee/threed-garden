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

The legacy `threed_farmbot_logs` table remains separate because `FarmBotPoller` still references its older sensor/log shape. New MQTT activity must not write to its unrestricted `rawData` field.

The Drizzle declarations are authoritative for exact column names and relationships. Never derive a schema change from this overview alone.
