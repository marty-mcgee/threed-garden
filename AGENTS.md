# Codex Instructions

Read CONTEXT.md before architectural work.

Developer-reported production checkpoint v0.22.20, confirmed October 4, 2026: preserve standalone Character Add/Edit/Animations routing, exact selected-Model reads, guarded drafts/assignment navigation, owner-scoped replacements and Model-based centered previews with camera-only Reset. Clip preview does not certify Scene physics/world actions; preserve Garden/Ecctrl separation and assignment precedence. See [release record](docs/releases/v0.22.20.md). Prior local checks passed; detailed browser verification remains pending, no post-deployment testing is claimed and deployed SHA remains unconfirmed (implementation commit `10dcc13d`). Next-version [v0.22.21 plan](docs/plans/v0.22.21-character-scene-introduction.md) covers placement plus ongoing physics/motion; no runtime or dependency changes are implemented by that planning step. Manual Release Gate applies.

Developer-reported production checkpoint v0.22.19 (released October 4, 2026) — ThreeD App: refine Model Edit Interface: preserve collapsed rounded Categories with draft-assigned names visible, independent parent/child assignments, accessible help Tooltips and editor-scoped compact switches. See [release handoff](docs/releases/v0.22.19.md). Prior local validation is separate from pending detailed browser checks; no post-deployment testing is claimed and deployed SHA remains unconfirmed. Read-only history identifies implementation commit `7093c472`. v0.22.18 is the prior production checkpoint. The Manual Release Gate still applies.

## Required workflow

For each development step, work in this order:

1. **Prove** — inspect the current implementation and record the concrete problem, affected files, and acceptance criteria before editing.
2. **Act** — make the smallest scoped change that satisfies those criteria. Preserve unrelated Developer changes in a dirty worktree.
3. **Document** — run relevant validation, review the diff, and update durable documentation only after the implementation is known. Leave changes unstaged for Developer review and suggest a commit title only. Follow the Manual Release Gate below for every Git write operation and deployment.

Use the checkpoint version and relevant scope title in suggested commit titles (these examples grant no Git or release authorization):
- Release: `v0.22.18 — ThreeD App: solidify foundations and Model editing`
- Docs: `docs: v0.22.18 — ThreeD App: solidify foundations and Model editing`
- Plans: `plans: docs: v0.22.18 — ThreeD App: solidify foundations and Model editing`

Do not combine repository restructuring with feature behavior changes in the same step.

## Manual Release Gate

- Codex may make approved file edits and run local checks.
- Leave changes unstaged for Developer review.
- Do not stage, commit, amend, reset, cherry-pick, merge, rebase, tag, push, or deploy without explicit Developer authorization for that specific action.
- “Proceed,” “implement,” “checks passed,” and “ready for release” do not authorize those actions.
- The Developer controls manual staging, commits, pushes, and production releases.
- Suggest commit titles only; do not execute them.
- Preserve unrelated work and do not repeat completed tasks.

## General rules

- Inspect relevant files before editing.
- Prefer incremental changes over rewrites.
- Do not guess schema fields, API paths, auth patterns, or component props.
- Never expose or request secrets.
- Do not edit .env files unless explicitly requested.
- Do not change database schema unless explicitly approved.
- Keep changes scoped to the requested task.
- Run relevant TypeScript checks after changes. For release preparation, run `npm run build` as the agent-owned npm build gate after focused/CI validation; record its result before any production handoff. Do not use Bun. Production deployment remains a separate approval gate.
- Use `docs/agents/VALIDATION.md` for the repository validation ladder and known baseline limitations.
- Use `docs/agents/README.md` as the documentation index for agent-safe change boundaries and task checklists.

## ThreeD character rules

- Approved v0.22.18 retained-source switching uses Model metadata.activeSource. Explicit Shape switches assigned Characters to procedural visuals while preserving saved rig/files/animation configuration, Garden/Ecctrl ownership and existing physics/control settings. Character restores the saved rig through the established loader. Rigless Shapes have no rig animation/contact-point availability and must not fabricate completion or world actions. Other remains a disabled future option. See docs/plans/character-model-source-conversion.md; local checks passed; production release is Developer-reported October 4, 2026, while detailed browser verification remains pending.

- Preserve GardenCharacter and EcctrlCharacter as separate runtime paths.
- `isMovable` determines Ecctrl routing.
- Preserve external FBX animation loading and semantic Animation Action Mapping.
- Preserve task → locomotion crossfade behavior.
- Avoid direct animation-mixer manipulation outside the established character action path.
- Character animation and world-state mutation are separate responsibilities.
- World actions occur only after one-shot animation completion, except the Developer-approved movable-ball kick contact path: a correlated active-animation collision point may queue one bounded impulse with the ball owner. Other world actions retain completion gating; animation sampling never writes physics or persistence.
- Do not expand harvest/world persistence without explicit approval.

## Model editor and source rules

- Active geometry selection and saved primary File authority are separate. Preserve retained file/rig/shape/Texture/Animation settings across source switching; metadata.activeSource controls rendering. Do not delete/deactivate attachments as a source-selection side effect.
- Explicit selected-File previews show that File even if the parent uses Shape. Parent and File previews preserve saved scale, center opted-in workspaces at the origin, and Reset only the camera on the retained Canvas. Do not infer Project-instance transforms on standalone File pages.
- Preserve Blueprint/shadcn conventions, draft/save/discard/history/busy guards and owner-scoped API/primary checks. Source changes must reach Admin previews, Library readiness/public serialization and stable runtime owners consistently; never expose private metadata in public Library responses.
- Scene-owned procedural textures must be released only through their committed owner lifecycle. Preserve theme operation when browser persistence is unavailable; do not restore unused incompatible postprocessing or add blanket upgrades.

## Stable checkpoint

Canonical repository: `marty-mcgee/threed-garden`. Current production package version: `0.22.18` — ThreeD App: solidify foundations and Model editing, Developer-reported released October 4, 2026. Foundations, coordinated Model/File workspaces, camera-only Reset and retained source switching are included. Prior local validation and pending browser checks remain separate; no post-deployment testing is claimed. Implementation commit `f3c3c050` is visible in read-only Git history; deployed SHA remains unconfirmed. See [release record](docs/releases/v0.22.18.md) and its linked plans. Earlier Developer-reported production checkpoint: **v0.22.17 — ThreeD Physics: animated action collision points**, released October 3, 2026. Prior local validation is recorded separately in `docs/plans/v0.22.17-action-collision-points.md`; Developer browser verification remains pending, no browser acceptance or post-deployment testing is inferred, and the deployed SHA remains unconfirmed because neither Git history nor the release confirmation establishes it. Earlier Developer-reported production checkpoint: **v0.22.16 — ThreeD Physics: keep balls out of Character ground probes**, release confirmed October 3, 2026. Prior local validation is recorded separately in `docs/plans/v0.22.16-character-ball-contact.md`; Project 16 browser verification remains pending, no post-deployment testing is claimed and the deployed SHA is unconfirmed. Earlier Developer-reported production checkpoint: **v0.22.15 — ThreeD Models: preserve placement at rest**, release confirmed October 3, 2026. Prior local validation is recorded separately in `docs/plans/v0.22.15-model-placement-physics.md`; browser verification remains pending, no post-deployment testing is claimed and the deployed SHA is unconfirmed. Earlier Developer-reported production checkpoint: **v0.22.14 — ThreeD Models: fix search ownership grouping**, released October 3, 2026. Prior agent local validation is separate; Developer browser verification remains pending and no post-deployment testing is claimed. Read-only Git inspection found implementation commit `0ecef786e1816405d9deaa9e6817cc9e6b77e450`; the deployed SHA remains unconfirmed because neither Git history nor the release confirmation establishes it. See `docs/plans/v0.22.14-model-search-ownership.md`. Earlier Developer-confirmed production checkpoint: v0.22.13 including the main Model Files Admin table and embedded Edit Model Details/Files tabs, released October 3, 2026. Earlier Stage 2 resource management was released October 2 at `6d22e20e`. The main Model Files Admin table is Developer-browser-verified; its verification date and environment were not specified in this chat. Embedded Edit Model Details/Files tabs passed Developer browser verification and a local production build October 3; their production release, including the main table, is Developer-confirmed October 3, 2026. No post-deployment testing is claimed. At the earlier release-documentation inspection, HEAD was documentation commit `b6d7a3a5`; the exact deployed SHA cannot be determined from Git history or the confirmation and remains unresolved. Implementation is included in `1e30316e`; `07d2ccca` contains separate manual repository changes and `b8f851f8` records Files embedding verification. Commits or pushes alone do not establish deployment. Stage 3A diagnostics remain partially verified and paused; actual restoration, replacement and cleanup remain deferred. The Models-search ownership grouping fix is Developer-reported released in v0.22.14; its browser verification remains pending. See `CONTEXT.md` and `docs/plans/v0.22.13-model-editor-pages.md`. Historical Soccer production checkpoint: v0.22.10 — ThreeD Playable Soccer, commit `b952b885`, Developer-confirmed. See `docs/releases/v0.22.10.md` and `docs/plans/v0.22.10-playable-soccer.md`. Preserve both imported histories and the legacy archive references. New development belongs in this repository; `marty-mcgee-neon` remains historical source. The historical runtime boundaries below still apply.

Historical physics checkpoint: v0.20.1 "ThreeD Physics" (package `0.20.1`). Production deployment, browser acceptance and build success are Developer-confirmed. See `docs/releases/v0.20.1.md` and `docs/plans/v0.20.1-release.md`. Preserve generic Physics Sensors, Project-owned Sensor Groups, sensor TransformControls, optional Sensors panel and read-only FarmBot presentation. Whole-Model TransformControls and further FarmBot expansion remain deferred. Preserve the `src/libraries` source boundary, Multimedia module identity, canonical `/dashboard/scene` route, shadcn/ui component boundary, shared animation references, Character assignments, runtime precedence and first-pose gating.

Preserve the released alpha scope: FBX bulk importing, shared local textures, existing reusable Texture assignments, primary registration, verified inactive creation and guarded recovery.

Released beta: v0.19.10b (`0.19.10-beta`) implements mixed FBX/GLB/GLTF bulk importing, embedded resources, typed external dependencies and reusable Texture assignments. GLB/GLTF imports must pass bounded local GLTFLoader inspection before uploading; missing geometry cannot be deferred. See `docs/plans/v0.19.10b-implementation.md`. The Developer manually tested and accepted the local checkpoint and its build gate on September 9, 2026. See `docs/plans/v0.19.10b-release.md` for the completed deployment handoff and retained live regression checklist. Production deployment is Developer-confirmed. The prior acceptance applies to beta.

Released centaur: v0.19.10c (`0.19.10-centaur`) adds OBJ bulk importing, required MTL libraries, referenced images and shared local/saved OBJ material rendering. Preserve mandatory MTL checks, inactive image deferral, MTL classification as `other` (never a thumbnail), and the staged single-Model geometry preview. Run `npm run validate -- threed-obj-bundle` with the existing importer checks. See `docs/plans/v0.19.10c.md`; production deployment of `a618a66` is Developer-confirmed. See the completed handoff in `docs/plans/v0.19.10c-release.md`. Released **v0.19.11 — ThreeD Model Management**, package `0.19.11`, commit `9cdc78e`, is Developer-confirmed in production. v0.19.12 (package `0.19.12`, commit `80c6a1d`) is Developer-confirmed in production; v0.19.13 "ThreeD Admin Sub-Module Workspace UI/UX Updates" is Developer-confirmed in production (package `0.19.13`, commit `c976c77`, release `docs/releases/v0.19.13.md`); see `docs/plans/v0.19.12-release.md`. Admin Models is the design blueprint for future sub-module pages (`docs/plans/admin-threed-workspace-blueprint.md`); do not apply its viewport constraints globally without reviewing each host. See `docs/plans/v0.19.11-release.md`. Preserve primary File authority, shared Texture URL reuse, refreshed Character position responses, and the original Character cylinders; generic fallback errors belong in DetailsCard.

v0.19.0b preserves the authenticated `project_threed_markers` create/update paths, stable Runtime Marker ownership, persistent Canvas/Rapier world, synchronized Model visuals and fixed colliders, and Character runtime separation. Existing Project Models may be repositioned through the Leaflet 2D Map or explicit ThreeD Scene Move Model mode; this does not authorize free-form R3F dragging or other Sub-Module movement changes. The developer-local `reference/` directory remains ignored and is not production source or a deployed asset path.

The v0.18.7c candidate defines ThreeD Layers as the Scene transaction boundary. Layer operations must preserve one persistent Canvas and Rapier world, stable `marker_id` identity, saved transforms, and Sub-Module-owned rendering and physics. They must not remount unrelated markers or issue duplicate imperative Rapier initialization writes. The Rapier frame-error circuit is containment only; activation is release-blocking.

v0.18.7c remains the ThreeD Layers Scene safety boundary. Treat future uncommitted work as Developer-owned and do not overwrite or fold it into unrelated changes.

The v0.18.7b release adds manually verified rectangular Bed creation plus Project-instance editing for width, length, height, X/Y/Z position, and degree-based Y rotation. `project_threed_markers` is authoritative after creation; edits must not mutate the reusable `threed_beds` source or reload the Project. Fixed marker bodies synchronize translation and rotation through their existing Rapier refs so visuals and colliders remain aligned.

The v0.18.7a release adds the general non-Character Model Library placement path: public/library classification, owner-scoped Project Model marker CRUD, one-shot Scene placement, local DRACO decoding, scale composition, grounding, DetailsCard editing/deletion, and whole-rendered-asset fixed collision bounds. Model CRUD patches only the affected `project_threed_markers` entry; it must not reload the Project or remount unrelated markers. The Canvas and Rapier Physics world remain persistent, the marker collection is keyed by stable `marker_id`, and each marker retains its Sub-Module-owned runtime/RigidBody path. Scene Layer visibility must suspend only the matching marker owners' visuals, pointer input, physics participation, and debug outlines; it must not filter the persistent marker collection, rebuild colliders, or change Scene bounds. Models classified for Characters remain excluded because they require GardenCharacter or EcctrlCharacter runtime rules. Preserve Character selection, Take/Release Control, WASD, collision, and animation behavior when reviewing shared Scene changes.

The v0.18.5a release is simulation-only. It adds no database schema, FarmBot command delivery, MQTT publishing, peripheral operation, or physical-device behavior.

The v0.18.5b release centralizes the client-only orchestration lifecycle and makes controlled Ecctrl FarmBot approach movement target-relative, independent of camera mode, perspective, orbit, and zoom. It preserves ordinary camera-relative WASD when no FarmBot action target is active and does not expand the v0.18.5a physical-operation boundary.

The v0.18.6a release establishes ThreeD ownership of marker targeting. Plantings, Beds, Characters, FarmBots, and Models share target identity, focus, highlighting, navigation, lifecycle, and generic semantic interactions. Module-specific effects remain separately gated; the release adds no schema, MQTT publishing, worker command, or physical-device behavior.

The v0.18.6b release adds explicit owner-scoped ThreeD Project marker snapshots, manual Save and eligible snapshot restoration, Runtime Marker registry synchronization, Ecctrl live-position capture, and on-demand Action Target position resolution. It does not write on render or movement, replace GardenCharacter/Ecctrl runtime separation, publish MQTT, invoke a worker, or authorize physical-device behavior.

Production character animations are Git-tracked under `public/assets/animations`. When the external animation manifest or those files change, run `npm run validate -- assets`. The GitHub workflow treats missing production animation assets and TypeScript diagnostics as blocking failures. Vercel remains the production-build gate.

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

- Historical App checkpoint: v0.19.13 "ThreeD Admin Sub-Module Workspace UI/UX Updates". The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K.
- ThreeD owns the provider-neutral MQTT service. FarmBot and future integrations such as OpenFarm may depend on ThreeD services; `src/libraries/services/threed/mqtt` must never import provider adapters.
- Treat each documented FarmBot phase as a separate approval gate; approval of one phase does not authorize the next phase, new external resources, schema changes, MQTT connections, or physical commands.
- FarmBot credentials are server-only and must never enter client state, API/map responses, logs, or public environment variables.
- Resolve every FarmBot operation through the authenticated owner and, for project interactions, its active Project asset assignment.
- Keep physical commands disabled until the server-side adapter has an allowlist, coordinate bounds, concurrency protection, audit records, and acknowledgement handling.
- Do not send arbitrary CeleryScript, raw command names, coordinates, or pin operations supplied by a browser.
- Emergency stop must not depend on character animation or the normal action-completion path.
