# ThreeD Garden working instructions

Read this file and [CONTEXT.md](CONTEXT.md) fully before editing. Inspect the current branch, HEAD, version and Git diff; preserve all manual edits. Current source and Drizzle schemas establish implementation facts. Developer instructions and corrections establish authorized scope and naming. Historical records are reference material, not fresh authorization.

## Developer preferences

- Use exact existing App names. The Developer-established hierarchy for this DetailsCard is **ThreeD > Project > Model > DetailsCard**. Keep the name **DetailsCard**.
- Verify terminology and ownership before proposing release titles. Mount location, route, selected entity and button labels alone do not establish App ownership. Do not invent a Characters settings panel.
- Treat explicit naming corrections as authoritative. State uncertainty and distinguish observations from assumptions; do not cycle through confident guesses.
- Keep responses concise with **Next Steps:**. Suggest a concise Git commit title only, unless a detailed body is explicitly requested.
- Preserve manual labels/order and user-scoped Admin sidebar preferences. Do not replace the accepted entity-focused taxonomy with new groups without a request.

## Prove, act, document

1. Inspect relevant source, callers, hooks, types, schemas and existing checks. Record the concrete problem and acceptance criteria before edits.
2. Make focused, incremental changes. Reuse existing owners and typed boundaries; avoid unrelated restructuring, dependency upgrades or feature behavior changes.
3. Run the applicable narrow checks, review the diff and update current documentation accurately. Distinguish mocked/offline results, observed browser behavior, Developer acceptance and production evidence.

Use [agent guidance](docs/agents/README.md), [safe change areas](docs/agents/SAFE_CHANGE_AREAS.md), [task checklists](docs/agents/TASK_CHECKLISTS.md) and [validation](docs/agents/VALIDATION.md).

## Manual release and live-system boundaries

- Leave changes unstaged. Do not stage, commit, amend, reset, cherry-pick, merge, rebase, tag, push, publish or deploy without explicit authorization for that action. Implement/proceed/checks-passed/ready-for-release do not grant it.
- Local servers belong to the Developer. Do not start or stop them, including temporary HTTP fixture servers or background helpers. Never kill unidentified processes. Use isolated installs/build outputs; do not alter the active dependency installation.
- Do not connect directly to live Neon/Postgres, execute live migrations/seeds, upload storage objects or issue device commands as validation. Use mocked persistence/device boundaries. Completed legacy recovery must not be rerun; preserve ignored journals/receipts and original references.
- Never expose/request secrets or edit environment files without an explicit request. Schema changes and persistence expansion need explicit approval. Do not guess schema fields, API paths, auth patterns or props.
- Production confirmation does not identify an exact deployed commit or establish new post-deployment/browser acceptance. Preserve pending and failed evidence honestly.

## Project, Scene and renderer ownership

- Preserve Project-scoped authorization and existing Project content, assets, selection, history and explicit Save/load. Architecture uses `project.config.threeDArchitecture`; workspace uses `threeDViewState` through the existing snapshot transaction. Do not add independent Design saves or fabricate snapshots for new Projects.
- Preserve typed allowlists, changed-key configuration merges, row-locked conflict stamps, pending/failed drafts and Scene restoration. Setup/Modules tab changes retain drafts; no broad raw-config writes or separate defaults store.
- Keep one persistent Canvas/Rapier world, stable Runtime Marker `marker_id` keys and Sub-Module-owned bodies/resources. Marker CRUD patches the affected instance without reloading the Project or remounting unrelated markers.
- Layers suspend the matching owner's presentation/input/physics/debug participation; do not filter persistent markers, rebuild colliders or change bounds. Architecture level visibility retains its existing collider behavior.
- Preserve SafeCanvas document-local deferred/latched failure handling, original rendering quality and 4096 Scene shadows. No automatic retry or claimed GPU-crash prevention. Keep R3F consumers inside Canvas.
- Preserve explicit mode order 3d, design, 2d, combined. Viewport-requiring placement/actions retain Design/Combined/3D and switch only from 2D-only mode. Retain Design Assets docking, overlay positioning and existing App CSS.
- ThreeDDesign has no active caller and is retained Developer work, not an approved replacement renderer. Do not wire it into routing, create another Scene copy or remove it without reviewing the retention record and obtaining applicable authorization.
- Design edits preserve stable IDs, metre/Scene conversions, strict versioned imports, staged omission review, fresh imported IDs, atomic Undo transactions and geometry/resource owners. Catalog Models and native hosted openings remain distinct.

## Models, Characters and Simulations

- Primary File authority and active geometry source are distinct. `metadata.activeSource` selects retained Model/Shape/Character rendering without deleting attachments, rig, Texture or Animation configuration. Explicit File previews show that File; standalone previews retain saved scale and camera-only Reset.
- Preserve owner-scoped Model/File reads, public Library serialization, draft/save/discard/history/busy guards and exact parent navigation. Do not expose private metadata. OBJ/MTL and supported texture aliases retain loader validation; readiness metadata is not proof of successful loading.
- Preserve separate GardenCharacter and EcctrlCharacter paths; `isMovable` determines routing. Keep first-pose/fallback readiness, Garden proxy motion, replacement-body synchronization, spawn clearance, external FBX animations, semantic mappings and task-to-locomotion crossfades.
- Do not manipulate mixers outside the established action path. Animation sampling never writes physics/persistence. World actions follow completion gating except the approved correlated contact-time ball kick; retain exact target/cancellation/one-impulse guards. Do not fabricate success for rigless Shapes or expand harvest/world writes implicitly.
- Scenario means plan/Open Scenario; Simulation means Actions/Results/Run Simulation. No Scenario prerequisite or obsolete filters. Admin Simulation definitions use canonical Edit routes; legacy detail/view routes redirect. Captured Results remain separate, immutable and read-only.
- Preserve owner/revision/reference checks, capture-before-dispatch, terminal finalization, save-only retry, public local runs/private owner Results, persistent runtime owners and cancellation. Broader Action executors and cross-Project bindings remain deferred.
- FBX/assets, idle/walk/run, Garden motion, Ecctrl WASD, DetailsCard, Take/Release Control and supported targeted Water/Pick Fruit regressions are release-blocking.

## FarmBot and source boundaries

- `src/libraries` is the canonical library boundary; `reference/` is ignored developer material, not production source. Keep canonical `/dashboard/scene`, Multimedia identity and shadcn/ui ownership.
- ThreeD MQTT services stay provider-neutral; core services never import provider adapters. Preserve the existing FarmBot live-state subscription owner and read-only presentation.
- Each FarmBot phase requires separate authorization. Keep credentials server-only, owner/Project assignment checks, bounded allowlists/concurrency/audit/acknowledgments and physical commands disabled. Emergency stop must not depend on animation. No arbitrary browser CeleryScript or implicit worker/MQTT operations.

## Commands and documentation

Use Node 24 and declared npm 11.6.2. Clean installs use `npm ci`; deliberate dependency changes use the matching npm version to reconcile package/lock together. Retain lockfile integrity checks. Inspect scripts before running them.

- `npm run typecheck` (fresh gate: `tsc --noEmit --incremental false`).
- `npm run validate -- <focused-task>`, then `npm run validate -- ci` as applicable.
- Guarded isolated `npm run build` after validation for release preparation; do not use Bun. Never overwrite Developer build/dev output.
- `npm run validate -- assets` when production Animation files/manifest change.
- Credential-free `npm run db:generate` is local SQL generation; `npm run db:push` is a live operation, never a validation step. See [database workflow](docs/developers/LOCAL_DEVELOPMENT.md#database-schema-commands).

Future release scope, checks, acceptance and deployment confirmations have one home: the matching file in [docs/releases](docs/releases/README.md). Update the concise current state in CONTEXT.md; do not prepend release diaries to README, AGENTS or documentation hubs. Specialized contracts are linked from [docs/agents](docs/agents/README.md). Prior narration and evidence are preserved in [documentation history](docs/releases/history/2026-10-17/README.md).
