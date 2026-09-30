# ThreeD Garden project context

This is the active `marty-mcgee/threed-garden` repository. Read [AGENTS.md](AGENTS.md) for the required Prove → Act → Document workflow and safety boundaries. The implementation and Drizzle schema are authoritative when documentation differs. The older `marty-mcgee-neon` context is retained only in [the archive](docs/archive/CONTEXT.md).

## Current production checkpoint

**v0.22.10 — ThreeD Playable Soccer** is User-confirmed in production; release commit `b952b885`, package `0.22.10`. See the [release record](docs/releases/v0.22.10.md), [implementation and validation record](docs/plans/v0.22.10-playable-soccer.md), and [Scenario guide](docs/help/threed-scenarios.md). Production deployment was confirmed by the User; individual browser checks and the inherited v0.22.9 Scenario `setup` database column were not independently verified by the agent.

The released Soccer path uses the built-in Model Action Target to select an exact movable ball. A mapped Character foot-kick applies one bounded Rapier impulse after its one-shot animation completes. Generic Physics Sensors own goal counts, with per-Sensor uni-/bi-directional entry options and explicit Project Save persistence of counts and occupancy. Restored occupancy is reconciled against live Rapier overlap. Ball placement does not reset the camera; selected-ball WASD uses Ecctrl's native camera-relative controls outside explicit Walk to Target. Preserve the persistent Canvas/Rapier world and separate Garden/Ecctrl Character runtimes.

Preserve Project-scoped ownership, stable Runtime Marker identity, one persistent Canvas/Rapier world, and separate GardenCharacter/EcctrlCharacter paths. Keep Scenario definition, Project view state, and live sensor counts distinct. Do not infer live physics success from readiness checks. New work belongs in this repository; use the [agent documentation index](docs/agents/README.md) and [validation ladder](docs/agents/VALIDATION.md).
