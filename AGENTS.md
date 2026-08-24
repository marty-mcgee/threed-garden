# Codex Instructions

Read CONTEXT.md before architectural work.

## Required workflow

For each development step, work in this order:

1. **Prove** — inspect the current implementation and record the concrete problem, affected files, and acceptance criteria before editing.
2. **Act** — make the smallest scoped change that satisfies those criteria. Preserve unrelated user changes in a dirty worktree.
3. **Document** — run relevant validation, review the diff, and update durable documentation only after the implementation is known.

Do not combine repository restructuring with feature behavior changes in the same step.

## General rules

- Inspect relevant files before editing.
- Prefer incremental changes over rewrites.
- Do not guess schema fields, API paths, auth patterns, or component props.
- Never expose or request secrets.
- Do not edit .env files unless explicitly requested.
- Do not change database schema unless explicitly approved.
- Keep changes scoped to the requested task.
- Run relevant TypeScript/build checks after changes.
- Use `docs/agents/VALIDATION.md` for the repository validation ladder and known baseline limitations.
- Use `docs/agents/README.md` as the documentation index for agent-safe change boundaries and task checklists.

## ThreeD character rules

- Preserve GardenCharacter and EcctrlCharacter as separate runtime paths.
- `isMovable` determines Ecctrl routing.
- Preserve external FBX animation loading and semantic Animation Action Mapping.
- Preserve task → locomotion crossfade behavior.
- Avoid direct animation-mixer manipulation outside the established character action path.
- Character animation and world-state mutation are separate responsibilities.
- World actions occur only after one-shot animation completion.
- Do not expand harvest/world persistence without explicit approval.

## Stable checkpoint

Current production version: v0.18.7b "ThreeD Bed Project Placement and Editing".

No later release candidate is currently designated.

v0.18.7b is the production boundary. Treat future uncommitted work as user-owned and do not overwrite or fold it into unrelated changes.

The v0.18.7b release adds manually verified rectangular Bed creation plus Project-instance editing for width, length, height, X/Y/Z position, and degree-based Y rotation. `project_threed_markers` is authoritative after creation; edits must not mutate the reusable `threed_beds` source or reload the Project. Fixed marker bodies synchronize translation and rotation through their existing Rapier refs so visuals and colliders remain aligned.

The v0.18.7a release adds the general non-Character Model Library placement path: public/library classification, owner-scoped Project Model marker CRUD, one-shot Scene placement, local DRACO decoding, scale composition, grounding, DetailsCard editing/deletion, and whole-rendered-asset fixed collision bounds. Model CRUD patches only the affected `project_threed_markers` entry; it must not reload the Project or remount unrelated markers. The Canvas and Rapier Physics world remain persistent, the marker collection is keyed by stable `marker_id`, and each marker retains its Sub-Module-owned runtime/RigidBody path. Scene Layer visibility must suspend only the matching marker owners' visuals, pointer input, physics participation, and debug outlines; it must not filter the persistent marker collection, rebuild colliders, or change Scene bounds. Models classified for Characters remain excluded because they require GardenCharacter or EcctrlCharacter runtime rules. Preserve Character selection, Take/Release Control, WASD, collision, and animation behavior when reviewing shared Scene changes.

The v0.18.5a release is simulation-only. It adds no database schema, FarmBot command delivery, MQTT publishing, peripheral operation, or physical-device behavior.

The v0.18.5b release centralizes the client-only orchestration lifecycle and makes controlled Ecctrl FarmBot approach movement target-relative, independent of camera mode, perspective, orbit, and zoom. It preserves ordinary camera-relative WASD when no FarmBot action target is active and does not expand the v0.18.5a physical-operation boundary.

The v0.18.6a release establishes ThreeD ownership of marker targeting. Plantings, Beds, Characters, FarmBots, and Models share target identity, focus, highlighting, navigation, lifecycle, and generic semantic interactions. Module-specific effects remain separately gated; the release adds no schema, MQTT publishing, worker command, or physical-device behavior.

The v0.18.6b release adds explicit owner-scoped ThreeD Project marker snapshots, manual Save and eligible snapshot restoration, Runtime Marker registry synchronization, Ecctrl live-position capture, and on-demand Action Target position resolution. It does not write on render or movement, replace GardenCharacter/Ecctrl runtime separation, publish MQTT, invoke a worker, or authorize physical-device behavior.

Production character animations are Git-tracked under `public/assets/animations`. When the external animation manifest or those files change, run `npm run validate:assets`. The GitHub workflow treats missing production animation assets and TypeScript diagnostics as blocking failures. Vercel remains the production-build gate.

Treat regressions in:
- FBX loading
- external animation asset availability
- idle/walk/run
- Garden wander
- Ecctrl WASD
- DetailsCard
- Take/Release Control
- targeted Water
- targeted Pick Fruit and project-scoped harvest persistence
as release-blocking.

## ThreeD FarmBot Integration Plan rules

- Current production checkpoint: v0.18.7b "ThreeD Bed Project Placement and Editing". The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.
- ThreeD owns the provider-neutral MQTT service. FarmBot and future integrations such as OpenFarm may depend on ThreeD services; `src/lib/services/threed/mqtt` must never import provider adapters.
- Treat each documented FarmBot phase as a separate approval gate; approval of one phase does not authorize the next phase, new external resources, schema changes, MQTT connections, or physical commands.
- FarmBot credentials are server-only and must never enter client state, API/map responses, logs, or public environment variables.
- Resolve every FarmBot operation through the authenticated owner and, for project interactions, its active Project asset assignment.
- Keep physical commands disabled until the server-side adapter has an allowlist, coordinate bounds, concurrency protection, audit records, and acknowledgement handling.
- Do not send arbitrary CeleryScript, raw command names, coordinates, or pin operations supplied by a browser.
- Emergency stop must not depend on character animation or the normal action-completion path.
