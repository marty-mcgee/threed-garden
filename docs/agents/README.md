# Agent documentation

Read [AGENTS.md](../../AGENTS.md) and [CONTEXT.md](../../CONTEXT.md) fully before editing, then inspect current Git state and relevant source. Historical snapshots and plans do not authorize new work.

## Developer preferences

- Use exact established App names and ownership. For this DetailsCard: **ThreeD > Project > Model > DetailsCard**. Preserve **DetailsCard**.
- Verify ownership before release naming. Mount locations, routes, selected entities and removed controls alone do not establish the owner; do not invent a Characters settings panel.
- Honor explicit Developer corrections. Distinguish verified observations from assumptions and state uncertainty instead of offering confident guesses.
- Name the established owner and concrete change in release titles; use the title recorded in the corresponding release record consistently.
- Provide only a concise Git commit title unless a detailed body is requested. Keep responses concise with **Next Steps:**.
- Preserve manual edits and historical evidence. Leave changes unstaged and keep Developer servers/active dependencies untouched.

## Workflow and validation

[Safe change areas](SAFE_CHANGE_AREAS.md) · [Task/contribution checklists](TASK_CHECKLISTS.md) · [Validation ladder](VALIDATION.md)

Inspect scripts before execution. Use Node 24, declared npm 11.6.2 and isolated clean `npm ci` installations. Reconcile intentional dependency changes with matching package/lock metadata; retain lockfile integrity checks. Validate focused areas, TypeScript and applicable CI checks, then run a guarded isolated npm production build for release preparation. Use mocked database/device boundaries and scrubbed credentials; no live writes, migrations, seeds, uploads or device commands as tests. Do not start temporary fixture servers.

## Ownership contracts

- [Application architecture](../developers/ARCHITECTURE.md), [Project configuration](../plans/project-configuration-authority.md) and [Designs](../developers/THREED_DESIGNS.md).
- [Character runtimes](../developers/THREED_CHARACTERS.md), [Runtime Markers/Layers](../developers/THREED_MARKERS.md) and [Simulations](../developers/THREED_SIMULATIONS.md).
- [Model administration](../developers/THREED_MODEL_ADMIN.md), [Builder](../developers/THREED_MODEL_BUILDER.md), [FarmBot security](../developers/FARMBOT_INTEGRATION.md) and [MQTT worker](../developers/FARMBOT_MQTT_WORKER.md).
- [v0.24 retention handoff](V0.24-HANDOFF.md#preserve-developer-edits): ThreeDDesign is unused retained Developer work, not permission for a second renderer or deletion.

Current source/schema establish behavior; Developer instructions establish scope/naming; AGENTS supplies working boundaries; CONTEXT supplies current state. Audience guides and historical snapshots follow. Report local, mocked, browser, Developer acceptance and production evidence separately.

## Documentation responsibilities

README is the public front door; AGENTS contains durable instructions; CONTEXT contains current state; docs/README is audience navigation. [Release records](../releases/README.md) are the single home for version-specific scope, checks, acceptance and production confirmation. Update CONTEXT's concise current status without prepending release diaries elsewhere. [Historical entry-point snapshots](../releases/history/2026-10-17/README.md) retain earlier decisions and limitations; never treat old Git/live-operation authorization as current permission.
