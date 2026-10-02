# ThreeD Garden project context

This is the active `marty-mcgee/threed-garden` repository. Read [AGENTS.md](AGENTS.md) for the required Prove → Act → Document workflow and safety boundaries. The implementation and Drizzle schema are authoritative when documentation differs. The older `marty-mcgee-neon` context is retained only in [the archive](docs/archive/CONTEXT.md).

## Current production checkpoint

**v0.22.11 — Fix procedural ball placement in ThreeD Scene** is User-confirmed in production; package `0.22.11`. The earlier **v0.22.10 — ThreeD Playable Soccer** release is User-confirmed in production; release commit `b952b885`. See the [release record](docs/releases/v0.22.10.md), [implementation and validation record](docs/plans/v0.22.10-playable-soccer.md), and [Scenario guide](docs/help/threed-scenarios.md). Production deployment was confirmed by the User; individual browser checks and the inherited v0.22.9 Scenario `setup` database column were not independently verified by the agent.

The released Soccer path uses the built-in Model Action Target to select an exact movable ball. A mapped Character foot-kick applies one bounded Rapier impulse after its one-shot animation completes. Generic Physics Sensors own goal counts, with per-Sensor uni-/bi-directional entry options and explicit Project Save persistence of counts and occupancy. Restored occupancy is reconciled against live Rapier overlap. Ball placement does not reset the camera; selected-ball WASD uses Ecctrl's native camera-relative controls outside explicit Walk to Target. Preserve the persistent Canvas/Rapier world and separate Garden/Ecctrl Character runtimes.

## Current development checkpoint

**v0.22.13 Stage 2 — Unify resource management** is implemented and User-verified as of October 2, 2026. Stage 1 is complete at `fe9940cb`. The [v0.22.13 plan](docs/plans/v0.22.13-model-editor-pages.md) is authoritative for the current Model workspace scope; the [v0.22.12 Model surfaces plan](docs/plans/v0.22.12-threed-model-surfaces.md) retains the reusable Model, Model File, Dashboard Library, and Project-instance relationships.

Local validation: TypeScript, twelve focused validation tasks, diff checks, and the npm production build passed. Offline fixtures used mocked database/network dependencies; the build used an unreachable local `DATABASE_URL` override. No agent live database testing or writes occurred.

Browser verification: the User confirmed all Stage 2 browser acceptance checks passed on October 2, 2026, covering exact Model/File navigation, resource inventory, supported previews, uploads/cancellation/save/reload, File settings and Dashboard/Character regressions. This is User-reported browser acceptance, recorded separately from agent local validation. Stage 2 changes remain uncommitted; production deployment is not claimed.

Stage 3 remains deferred: replacement, missing-file cleanup, changed primary-deletion rules, and storage cleanup. Stage 2 acceptance does not authorize those operations or schema changes.

Preserve Project-scoped ownership, stable Runtime Marker identity, one persistent Canvas/Rapier world, and separate GardenCharacter/EcctrlCharacter paths. Keep Scenario definition, Project view state, and live sensor counts distinct. Do not infer live physics success from readiness checks. New work belongs in this repository; use the [agent documentation index](docs/agents/README.md) and [validation ladder](docs/agents/VALIDATION.md).
