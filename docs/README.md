# Documentation Hub

This directory is the canonical entry point for project documentation. Choose the path that matches what you are trying to do.

Current production is v0.19.0a **Shared ThreeD Model Library Placement**, using package version `0.19.0-alpha`. Its 2D Map, ThreeD Scene, Combined View, cancellation, invalid-drop, build, deployment, and production checks passed. The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.

The v0.18.9a production release adds authenticated Character Library placement and Project-instance editing while keeping GardenCharacter and EcctrlCharacter as separate runtimes. Explicit Project saves preserve marker database IDs, uncontrolled Ecctrl mounts cannot publish temporary positions, overlapping capsule spawn areas are rejected before Rapier, and rejected Character snapshots can be restored to source positions without deleting their source assets.

The v0.18.7d production release prevents multiple movable Characters at one XYZ spawn from entering Rapier as overlapping Ecctrl bodies. Unsafe Characters are listed in a bounded Scene warning and remain editable through the existing Admin Character CRUD.

The v0.18.7c production release defines ThreeD Layers as the transaction boundary between `project_threed_markers` and the persistent R3F/Rapier Scene. Layer changes preserve stable marker identity and Sub-Module ownership and must not reload the Canvas, rebuild Physics, or remount unrelated markers.

The v0.18.7b production release has manually verified new rectangular Bed placement and Project-instance editing for dimensions, X/Y/Z position, and degree-based Y rotation. These edits patch only the selected `project_threed_markers` instance and its existing Rapier body; the source Bed and unrelated Scene markers remain unchanged.

The v0.18.7a production release provides a non-Character ThreeD Model Library path from Admin Vercel Blob GLB upload through Project Model marker CRUD, DRACO-capable Scene rendering, grounding, and whole-rendered-asset collision. It preserves one persistent Canvas/Physics world and unrelated Character/Ecctrl state when a Model marker changes. Scene Layer controls suspend only the selected layer's presentation, input, physics participation, and Physics Debug outlines without remounting retained markers or changing their positions. See [ThreeD Marker architecture](developers/THREED_MARKERS.md) for its boundary.

## Human users

- [Getting started](users/GETTING_STARTED.md) — sign in, choose a project, and understand the two application surfaces.
- [Admin guide](users/ADMIN_GUIDE.md) — manage modules, assets, and project assignments.
- [Dashboard guide](users/DASHBOARD_GUIDE.md) — explore project-scoped data.
- [ThreeD controls](users/THREED_CONTROLS.md) — characters, camera controls, and targeted world actions.

## Developers

- [Architecture](developers/ARCHITECTURE.md) — surfaces, request flow, ownership, and runtime boundaries.
- [ThreeD character runtimes](developers/THREED_CHARACTERS.md) — GardenCharacter and EcctrlCharacter roles, shared systems, and movement boundaries.
- [ThreeD Marker architecture](developers/THREED_MARKERS.md) — Project asset sources, Runtime Markers, layers, identity, and Action Target boundaries.
- [Data model](developers/DATA_MODEL.md) — modules, project junctions, assets, and runtime records.
- [API guide](developers/API_GUIDE.md) — route families and access conventions.
- [ThreeD FarmBot Integration Plan](developers/FARMBOT_INTEGRATION.md) — hardware security and connection boundaries.
- [FarmBot adapter for ThreeD MQTT services](developers/FARMBOT_MQTT_WORKER.md) — released Phase 2A–2D runtime, security, persistence, and read-only status behavior.
- [Local development](developers/LOCAL_DEVELOPMENT.md) — setup and validation.
- [Deployment](developers/DEPLOYMENT.md) — release checks and production verification.

## Coding agents

- [Agent documentation](agents/README.md) — required context and source-of-truth order.
- [Safe change areas](agents/SAFE_CHANGE_AREAS.md) — boundaries and approval gates.
- [Task checklists](agents/TASK_CHECKLISTS.md) — prove, act, and document workflow.
- [Validation](agents/VALIDATION.md) — narrow-first repository validation.

## v0.19.0 development

- [Legacy ThreeD integration assessment](developers/LEGACY_THREED_INTEGRATION.md) — legacy possibility inventory and the current-App shared Model Library placement contract.

## Releases

- [Release index](releases/README.md)
- [v0.19.0a production checkpoint](releases/v0.19.0a.md)
- [v0.18.9d production checkpoint](releases/v0.18.9d.md)
- [v0.18.9c production checkpoint](releases/v0.18.9c.md)
- [v0.18.9b production checkpoint](releases/v0.18.9b.md)
- [v0.18.9a production checkpoint](releases/v0.18.9a.md)
- [v0.18.7c production checkpoint](releases/v0.18.7c.md)
- [v0.18.7d production checkpoint](releases/v0.18.7d.md)
- [v0.18.7b production checkpoint](releases/v0.18.7b.md)
- [v0.18.7a production checkpoint](releases/v0.18.7a.md)
- [v0.18.6b production checkpoint](releases/v0.18.6b.md)
- [v0.18.6a production checkpoint](releases/v0.18.6a.md)
- [v0.18.5b production checkpoint](releases/v0.18.5b.md)
- [v0.18.5a production checkpoint](releases/v0.18.5a.md)
- [v0.18.4b production checkpoint](releases/v0.18.4b.md)
- [v0.18.4a production checkpoint](releases/v0.18.4a.md)
- [v0.18.3b production checkpoint](releases/v0.18.3b.md)
- [v0.18.3a production checkpoint](releases/v0.18.3a.md)
- [v0.18.2b production checkpoint](releases/v0.18.2b.md)
- [v0.18.1b production checkpoint](releases/v0.18.1b.md)
- [v0.18.1a production checkpoint](releases/v0.18.1a.md)
- [v0.18.0 production checkpoint](releases/v0.18.0.md)
- [v0.17.3 production checkpoint](releases/v0.17.3.md)
- [v0.17.2 production checkpoint](releases/v0.17.2.md)

When documentation and implementation disagree, the current code and schema are authoritative. Correct the documentation as part of the same scoped change.
