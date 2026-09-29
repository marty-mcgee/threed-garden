# ThreeD Garden project context

This is the active `marty-mcgee/threed-garden` repository. Read [AGENTS.md](AGENTS.md) for the required Prove → Act → Document workflow and safety boundaries. The implementation and Drizzle schema are authoritative when documentation differs. The older `marty-mcgee-neon` context is retained only in [the archive](docs/archive/CONTEXT.md).

## Current production checkpoint

**v0.22.9 — ThreeD Scenario Setup and Start** is User-confirmed in production; release commit `fcbab81c`, package `0.22.9`. See the [release record](docs/releases/v0.22.9.md), [implementation and validation record](docs/plans/v0.22.9-scenario-release.md), and [Scenario guide](docs/help/threed-scenarios.md). Production deployment was confirmed by the User; individual browser checks and production database migration state were not independently verified by the agent.

The Admin Scenario form saves a versioned setup for a Project's Scenario definition. In the Dashboard Scene, **Templates (Choose a Scenario)** loads an existing active Scenario into the Setup Guide. **Start Scenario** shows an instruction card and, for Soccer, the selected Physics Sensor group. Project Save stores the selected Scenario, Guide choices, started state, and relevant panel visibility in versioned Project view state. Sensor counts remain session-only. Physics Debug uses Rapier's active collider wireframes. The additive nullable `threed_scenarios.setup` JSONB migration is in [release SQL](docs/releases/sql/threed-scenario-setup.sql); do not assume its production application merely from the deployment confirmation.

Preserve Project-scoped ownership, stable Runtime Marker identity, one persistent Canvas/Rapier world, and separate GardenCharacter/EcctrlCharacter paths. Keep Scenario definition, Project view state, and live sensor counts distinct. Do not infer live physics success from readiness checks. New work belongs in this repository; use the [agent documentation index](docs/agents/README.md) and [validation ladder](docs/agents/VALIDATION.md).
