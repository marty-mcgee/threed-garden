# ThreeD Garden current context

## Current checkpoint

Package/root lockfile: **0.26.12**, prepared for manual release as **[v0.26.12 - ThreeD Garden: shadcn CLI upgrade](docs/releases/v0.26.12.md)**. **[v0.26.11 - ThreeD Garden: Repository maintenance and Design Properties](docs/releases/v0.26.11.md)** is Developer-confirmed released to production October 17, 2026. Exact deployed commit, subsequent GitHub validation result and independent post-deployment checks are not established. Inspect current Git state before future work; the maintenance baseline e8c83089 is repository history, not deployed provenance.

Developer naming: **ThreeD > Project > Model > DetailsCard**. Use exact App names, verify ownership, state uncertainty and honor corrections. Provide concise commit titles only unless asked for a body; keep responses concise with **Next Steps:**. See [durable working preferences](docs/agents/README.md#developer-preferences) and [AGENTS.md](AGENTS.md).

## Architecture and source locations

- `src/app/dashboard/scene/page.tsx` owns Project session/data, selection, DetailsCard mounting and Save coordination. `src/components/map/UnifiedMapView.tsx` mounts the active `ThreeDScene.tsx` and geographic map, retaining viewport continuity.
- `ThreeDScene.tsx` owns the retained Canvas/Rapier Scene and camera/layer/workspace state. Existing marker components own runtime bodies; GardenCharacter and EcctrlCharacter remain separate.
- `src/components/map/ThreeDDesign.tsx` has no application caller. It is retained Developer work per the [v0.24 handoff](docs/agents/V0.24-HANDOFF.md#preserve-developer-edits), not a future renderer mandate. Leave it unwired and unchanged.
- `src/components/map/details/DetailsCard.tsx` composes the active inspector and existing placement, Sensor and Character sections. Supported headers are available by default; expansion preferences remain.
- `src/components/threed/design` and `src/libraries/services/threed/design` implement architecture editing, geometry, history and validated workspace state. Project config `threeDArchitecture`/`threeDViewState` and the existing snapshot transaction remain authoritative.
- Admin Project configuration uses typed changed-key merges and row-locked conflict stamps; pending/failed drafts and workspace owners are retained. See [configuration authority](docs/plans/project-configuration-authority.md).
- Model/File source, attachments and preview boundaries are documented in [Model administration](docs/developers/THREED_MODEL_ADMIN.md); Character and runtime-marker contracts are in [Characters](docs/developers/THREED_CHARACTERS.md) and [Markers](docs/developers/THREED_MARKERS.md).
- Simulation definitions use canonical Admin Edit routes; legacy detail/View routes redirect. Scenario plans, runtime Actions and immutable captured Results remain distinct. See [Simulations](docs/developers/THREED_SIMULATIONS.md).

## Released v0.26.11 checkpoint

Repository maintenance, Design Properties Status/help and shared App tooltip sizing/spacing are Developer-confirmed released. Final fresh isolated TypeScript, all 79 guarded Linux CI tasks, metadata/link/whitespace checks and the guarded Next.js 16.4.2 build (145/145 pages, exit 0) passed after the final UI changes. Source/input parity passed. Matching previously clean-installed dependencies were reused; no new install is claimed for preparation. Native desktop/narrow help checks and earlier Windows checks are separate evidence. See [release record](docs/releases/v0.26.11.md) for exact gates, changed files and manual limits, and [maintenance record](docs/plans/repository-maintenance-2026-10-17.md) for preserved history/file sizes.

Release confirmation is separate from the prior local checks. The subsequent GitHub result, authenticated acceptance and independent post-deployment verification are not newly confirmed. This documentation update leaves Developer servers/active installation untouched and performs no agent live writes, Git writes or deployment.

## Prepared v0.26.12 checkpoint

shadcn CLI is pinned to 4.22.0; App Zod 3.25.76 is explicit and existing Radix/UI/CSS owners are retained. Developer confirms successful npm ci, npm start and real-App Editor operation/appearance. This is local acceptance, not production confirmation or a claim that every Save/reopen/Character scenario was tested. Upgrade checks and native comparisons passed; final release gates are recorded in [v0.26.12](docs/releases/v0.26.12.md), with implementation detail in [the upgrade plan](docs/plans/shadcn-4-upgrade.md). Developer servers/installation remain agent-untouched. Changes stay unstaged for manual GitHub/Vercel release.

## Acceptance and known limitations

- v0.26.10 pre-release fresh TypeScript and four focused Character/overlay checks passed. The earlier broader overlay suite stopped at Windows tsx userInfo ENOMEM; it is not a complete pass. Maintenance results are recorded separately.
- v0.26.8 SQL application, real top-view PNG upload and Project Save/reopen are Developer-confirmed. Do not reopen these accepted checks based on older pending narration; broader visual/device cases remain separate.
- New v0.26.9 named level-visibility-subset Save/reopen remains separately pending. Existing v0.24.0 authenticated Save/Reload acceptance does not certify later fields. Named-view smoke, narrow-screen/touch and full inspector/menu behavior need scoped manual checks.
- SafeCanvas contains renderer failure; recurring GPU/driver crashes are not diagnosed or certified prevented. Preserve rendering quality and Developer server control; do not reproduce machine crashes.
- Project #17 legacy recovery is complete. Preserve journals and receipts under ignored `reference/legacy-recovery/demo-1`; do not repeat apply. Ordinary architecture JSON import does not restore catalog assets. Legacy apertures, sloped wall tops, floor holes, roof joins and annotations have documented gaps: [capabilities](docs/plans/design-architecture-capabilities.md), [recovery](docs/plans/legacy-design-json-import.md).
- Model #15's explicit PNG texture upload/link and foliage review are not agent-confirmed repaired in production; see [targeted repair](docs/plans/v0.25.2.md#targeted-model-15-leaf-texture-repair).
- Builder authenticated upload/PBR/placement/cleanup acceptance and Stage 3A supporting-image diagnostics remain separately incomplete; restoration testing is paused. See [Builder](docs/plans/v0.24.0-alpha-model-builder.md), [Stage 3A](docs/plans/v0.22.13-stage3a-supporting-image-restore.md).
- Simulation broader Action executors/cross-Project definitions and physical FarmBot commands remain deferred. Sensor observations are not causal or server-execution proof.

## History and future updates

[Release records](docs/releases/README.md) hold version-specific scope, evidence and production confirmations. [Documentation history](docs/releases/history/2026-10-17/README.md) preserves the former entry-point narration and all superseded acceptance/limitation records. [Earlier repository context](docs/archive/CONTEXT.md) is historical source only.

For future releases, update the corresponding release record and this concise current state. README and documentation hubs remain navigation; AGENTS and agent preferences remain durable instructions. Do not prepend another release diary to every document.
