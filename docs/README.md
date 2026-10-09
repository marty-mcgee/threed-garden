# Documentation Hub

Prepared checkpoint: **[v0.24.0-alpha - ThreeD Designs: Project Scene integration](releases/v0.24.0-alpha-project-design.md)**. Same package version; manual release and authenticated App acceptance pending.

Local continuation: **[ThreeD Designs](developers/THREED_DESIGNS.md)** - [Project Scene integration](plans/v0.24.0-alpha-designs-persistence.md). Design edits the same Project/Scene, saving architecture and existing Models through Project Save. No separate table/migration is required; authenticated App acceptance and the next release remain pending. Earlier independent persistence instructions are superseded.

Released v0.24.0-alpha tools: [Home Design live planning milestones](plans/v0.24.0-alpha-home-design.md) · [Drawing/opening/level/roof contracts and remaining stages](developers/THREED_HOME_DESIGN.md). Local wall/floor/door/window editing, named levels, Flat/Shed/Gable roofs with rectangular cutouts/skylights and editable version 5 JSON recovery. Overhangs/roof joins and Project persistence remain future work.

Latest production checkpoint: **[v0.24.0-alpha — 3D Object Builder + Home Design Tools](releases/v0.24.0-alpha.md)**, Developer-confirmed October 9, 2026. Older release statements below are historical.

Released Builder: [v0.24.0-alpha implementation](plans/v0.24.0-alpha-model-builder.md) · [Developer documentation](developers/THREED_MODEL_BUILDER.md). Admin Cottage generation, browser GLB/PNG export, six-role Model Textures, direct Blob primary uploads and explicit new Model registration. Detailed App/live and post-deployment acceptance remain separate from prior local validation.

Current release: **[v0.23.0 — ThreeD Garden](releases/v0.23.0.md)**. Developer authorized stable GitHub publication of the existing code October 6, 2026. Package/root lockfile are 0.23.0; older checkpoint sections describe history. Preserve existing runtime and schema boundaries. GitHub publication and production deployment are distinct.

This directory is the canonical entry point for project documentation. Choose the path that matches what you are trying to do.

Current production is **v0.22.27 — ThreeD App: wire Drizzle database commands**, Developer-confirmed October 5, 2026. See the [release record](releases/v0.22.27.md) and [npm database workflow](developers/LOCAL_DEVELOPMENT.md#database-schema-commands). Database push completion and live acceptance remain separately unconfirmed. The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.

The completed v0.20.0 infrastructure record is available in the [development plan](plans/v0.20.0.md).

Completed release: [v0.19.12 release handoff](plans/v0.19.12-release.md). Future page work follows the [Admin ThreeD workspace blueprint](plans/admin-threed-workspace-blueprint.md).

Read the [App overview analysis at v0.19.11](plans/app-overview-v0.19.11.md) for current functionality, verified issues, validation results and prioritized next work. The older checkpoint paragraphs below are historical summaries.

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
- [ThreeD Ground Maps](users/THREED_GROUND_MAPS.md) — upload a map image, align the Scene ground, preserve attribution, and save the Project.

## Developers

- [Architecture](developers/ARCHITECTURE.md) — surfaces, request flow, ownership, and runtime boundaries.
- [ThreeD character runtimes](developers/THREED_CHARACTERS.md) — GardenCharacter and EcctrlCharacter roles, shared systems, and movement boundaries.
- [ThreeD Marker architecture](developers/THREED_MARKERS.md) — Project asset sources, Runtime Markers, layers, identity, and Action Target boundaries.
- [ThreeD Model runtime API](developers/THREED_MODEL_RUNTIME_API.md) — authenticated Model Library JSON and read-only runtime-structure inspection contracts.
- [ThreeD Model Administration](developers/THREED_MODEL_ADMIN.md) — production FBX bulk importer, beta GLB/GLTF support, reusable Texture assignments and the single-Model/Model Files workflows.
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

## Development plans

**v0.19.11 — ThreeD Model Management** is released. FBX/GLB/GLTF and OBJ/MTL support are included. **v0.19.12 — ThreeD Admin Model Workspace** is now User-confirmed in production. Development is now **v0.19.13 — ThreeD Admin Sub-Module Workspace UI/UX Updates**; see [the plan](plans/v0.19.13.md).

- [App overview and prioritized follow-up](plans/app-overview-v0.19.11.md) — baseline findings with local A05/A06 fixes and User-deferred areas.
- [v0.19.11 completed release handoff](plans/v0.19.11-release.md) — scope, validation, deployment and compatibility.
- [v0.19.10c — OBJ/MTL](plans/v0.19.10c.md) — released centaur implementation.

- [v0.19.10a — ThreeD Model Bulk Importing](plans/v0.19.10a.md) — released FBX/Texture alpha boundary.
- [Alpha deployment preparation record](plans/v0.19.10a-release.md) — release scope, validation and deployment confirmation.
- [v0.19.10b — GLB/GLTF bulk importing](plans/v0.19.10b.md) — beta design and acceptance criteria.
- [Beta production handoff](plans/v0.19.10b-release.md) — completed deployment, manual acceptance and validation evidence.
- [Beta implementation and verification](plans/v0.19.10b-implementation.md) — supported resources, local inspection, automated results and remaining release checks.

- [plans: docs: v0.19.9 — Guided ThreeD Project Creation and First-Run Experience](plans/v0.19.9.md) — completed production plan for focused Project Tour progression, with later guidance ideas deferred.
- [plans: docs: v0.19.8d — ThreeD Model Library Import and Scene Presentation](plans/v0.19.8d.md) — completed five-stage progression that brought configured reusable Models into the Dashboard Library and Scene.

## Releases

- [Release index](releases/README.md)
- [v0.19.11 production checkpoint](releases/v0.19.11.md)
- [v0.19.10c production checkpoint](releases/v0.19.10c.md)
- [v0.19.10b production checkpoint](releases/v0.19.10b.md)
- [v0.19.10a production checkpoint](releases/v0.19.10a.md)
- [v0.19.9 production checkpoint](releases/v0.19.9.md)
- [v0.19.8d production checkpoint](releases/v0.19.8d.md)
- [v0.19.8c production checkpoint](releases/v0.19.8c.md)
- [v0.19.8b production checkpoint](releases/v0.19.8b.md)
- [v0.19.8a production checkpoint](releases/v0.19.8a.md)
- [v0.19.7b production checkpoint](releases/v0.19.7b.md)
- [v0.19.7a production checkpoint](releases/v0.19.7a.md)
- [v0.19.7 production checkpoint](releases/v0.19.7.md)
- [v0.19.6 production checkpoint](releases/v0.19.6.md)
- [v0.19.5c production checkpoint](releases/v0.19.5c.md)
- [v0.19.5b production checkpoint](releases/v0.19.5b.md)
- [v0.19.2a production checkpoint](releases/v0.19.2a.md)
- [v0.19.1e production checkpoint](releases/v0.19.1e.md)
- [v0.19.1d production checkpoint](releases/v0.19.1d.md)
- [v0.19.1c production checkpoint](releases/v0.19.1c.md)
- [v0.19.1a production checkpoint](releases/v0.19.1a.md)
- [v0.19.0d production checkpoint](releases/v0.19.0d.md)
- [v0.19.0c production checkpoint](releases/v0.19.0c.md)
- [v0.19.0b production checkpoint](releases/v0.19.0b.md)
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
