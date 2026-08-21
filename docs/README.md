# Documentation Hub

This directory is the canonical entry point for project documentation. Choose the path that matches what you are trying to do.

Current production is v0.18.4a **Admin and Dashboard UI Improvements**. v0.18.4b **Dashboard Surface Cleanup** is the current release candidate. The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.

## Human users

- [Getting started](users/GETTING_STARTED.md) — sign in, choose a project, and understand the two application surfaces.
- [Admin guide](users/ADMIN_GUIDE.md) — manage modules, assets, and project assignments.
- [Dashboard guide](users/DASHBOARD_GUIDE.md) — explore project-scoped data.
- [ThreeD controls](users/THREED_CONTROLS.md) — characters, camera controls, and targeted world actions.

## Developers

- [Architecture](developers/ARCHITECTURE.md) — surfaces, request flow, ownership, and runtime boundaries.
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

## Releases

- [Release index](releases/README.md)
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
