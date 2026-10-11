## Current production: v0.24.4

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](releases/v0.24.4.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.4`; dependencies and database schema are unchanged. Prior local TypeScript, 71-task offline CI and guarded build (143 pages) are pre-release evidence, not independent post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%; named-view authenticated smoke, physical-device touch and Builder acceptance remain separately documented. This confirmation changes documentation only; leave changes unstaged under the Manual Release Gate. Earlier preparation-only and production-version statements below are historical and superseded by this confirmation.

## Historical local v0.24.4 release checkpoint

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](releases/v0.24.4.md)**. Prepared locally October 11, 2026 on `main`. Package/root lockfile are `0.24.4`; dependencies and database schema are unchanged. Production remains Developer-confirmed v0.24.3. This checkpoint is not yet published or deployed. Earlier local-version statements below are historical; leave changes unstaged under the Manual Release Gate.

## Previous production: v0.24.3

**[v0.24.3 — ThreeD Scene: Saved views and component cleanup](releases/v0.24.3.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.3`; dependencies and database schema are unchanged. Prior local validation is pre-release evidence, not independent post-deployment verification. Exact deployed SHA and authenticated named-view Save/reload smoke checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This records release confirmation only; leave changes unstaged under the Manual Release Gate.

This checkpoint preserves the Developer's manual edits and accepted panel extractions, fixes immediate named-view snapshot capture/hydration and adds Designs layer visibility. ThreeDDesign remains unconnected to callers. Historical version/status records below retain their original evidence; this release confirmation supersedes earlier preparation-only and production-version statements.

Current production: **[v0.24.2 — Workspace Feedback + Responsive Reliability](releases/v0.24.2.md)**. Developer confirmed production release October 10, 2026. Package/root lockfile remain 0.24.2; dependencies and schema are unchanged. Prior local validation is pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. New-feedback authenticated smoke testing, physical-device touch and Builder-specific acceptance remain separately documented. This records release confirmation only; leave changes unstaged under the Manual Release Gate.

# Documentation Hub

Previous production: **[v0.24.1 — ThreeD Scene: UI/UX Improvements: App Layout + Page Headers](releases/v0.24.1.md)**. Developer confirmed production release October 10, 2026. Package and both root lockfile version fields remain 0.24.1; dependencies and schema are unchanged. Prior local CI/build/browser checks are pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This documentation update performs no Git write, deployment or live-system operation; leave changes unstaged.

Previous production: **[v0.24.0 — ThreeD Designs: Project workspace and saved state](releases/v0.24.0.md)**. Developer confirmed final `0.24.0` released to production October 10, 2026, following authenticated Save/Reload checks reported 100% passed. Released package/root lockfile were `0.24.0`; local preparation is now `0.24.1`. This supersedes earlier pending authenticated Save/Reload and RC-versioning statements below. Verification is Developer-reported, separate from agent automated checks. Production release is Developer-confirmed; exact deployed SHA and independent post-deployment checks remain unconfirmed. Leave changes unstaged; no Git write or deployment is authorized.

Historical development: **[v0.24.0-delta — Cleanup toward release candidacy](plans/v0.24.0-delta-cleanup.md)**. Package/root lockfile are `0.24.0-delta`; the delta planning checkpoint was Developer-confirmed released to production October 10, 2026. This is a prerelease planning baseline, not release-candidate acceptance. Delta is for existing bug fixes and acceptance, before a proposed `0.24.0-rc.1` and stable `0.24.0`. No new runtime fix or release readiness is claimed by this preparation. Earlier package/version statements below describe their historical checkpoints.

Previous production: **[v0.24.0-centaur — ThreeD Designs: Workspace tools and state](releases/v0.24.0-centaur.md)**, Developer-confirmed October 10, 2026. Package/root lockfile remain `0.24.0-centaur`. Includes canvas-local tools, staged JSON import, Project workspace snapshot support and compact colored Properties headers. Authenticated Save/reopen, post-deployment verification and exact deployed SHA remain unconfirmed. This records release confirmation only; no Git write or deployment is authorized. Earlier checkpoint statements below are historical.

Previous production: **[v0.24.0-beta — ThreeD Designs: Dashboard workspace](releases/v0.24.0-beta.md)**, Developer-confirmed October 10, 2026. Package/root lockfile remain `0.24.0-beta`. Layout acceptance and prior local checks are separate from still-unverified authenticated architecture Save/reload and post-deployment testing. Exact deployed SHA remains unconfirmed.

Previous production: **[v0.24.0-alpha — ThreeD Designs: Project Scene integration](releases/v0.24.0-alpha-project-design.md)**, Developer-confirmed October 9, 2026. Detailed authenticated App and post-deployment verification remain separate.

**[ThreeD Designs](developers/THREED_DESIGNS.md)** edits the same active Project/Scene through shared drawing tools, linked 2D/3D geometry and the existing Project Save pipeline. The beta's accepted layout has Assets above Properties at the shared left-panel width, Scene above Plan/X/Z rulers on the right, a resizable row divider and one top Project toolbar with icon actions/tooltips. [User instructions](users/DASHBOARD_GUIDE.md#threed-design-beta) · [layout evidence](plans/v0.24.0-alpha-design-mockup-layout.md) · [storage and pipeline](developers/THREED_DESIGNS.md#exact-persistence-mapping). Mocked Save/load passed; authenticated restoration remains unverified. No separate table/migration is required; independent persistence guidance is superseded.

Released v0.24.0-alpha drawing foundations: [Home Design milestones](plans/v0.24.0-alpha-home-design.md) · [Drawing/opening/level/roof contracts](developers/THREED_HOME_DESIGN.md). Shared wall/floor/door/window editing, named levels, Flat/Shed/Gable roofs with rectangular cutouts/skylights and editable version 5 JSON recovery now support the Project integration above. Overhangs/roof joins remain deferred; Project persistence is implemented against mocks but real Save/reload acceptance is pending.

Earlier latest production checkpoint: **[v0.24.0-alpha — 3D Object Builder + Home Design Tools](releases/v0.24.0-alpha.md)**, Developer-confirmed October 9, 2026. Older release statements below are historical.

Released Builder: [v0.24.0-alpha implementation](plans/v0.24.0-alpha-model-builder.md) · [Developer documentation](developers/THREED_MODEL_BUILDER.md). Admin Cottage generation, browser GLB/PNG export, six-role Model Textures, direct Blob primary uploads and explicit new Model registration. Detailed App/live and post-deployment acceptance remain separate from prior local validation.

Historical stable release: **[v0.23.0 — ThreeD Garden](releases/v0.23.0.md)**. Developer authorized stable GitHub publication October 6, 2026; package/root lockfile were 0.23.0 at that checkpoint. GitHub publication and production deployment are distinct.

This directory is the canonical entry point for project documentation. Choose the path that matches what you are trying to do.

Historical production checkpoint **v0.22.27 — ThreeD App: wire Drizzle database commands** was Developer-confirmed October 5, 2026. See the [release record](releases/v0.22.27.md) and [npm database workflow](developers/LOCAL_DEVELOPMENT.md#database-schema-commands). Its validation limits remain recorded separately. The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.

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
