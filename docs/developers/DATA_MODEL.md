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

The Drizzle declarations are authoritative for exact column names and relationships. Never derive a schema change from this overview alone.
