# Architecture

The application is a Next.js App Router project with two surfaces:

- `src/app/admin` provides authenticated CRUD and project-assignment workflows.
- `src/app/dashboard` provides project-scoped visualization and interaction.

The normal data flow is:

```text
Admin -> Database -> API -> Dashboard
```

The Dashboard is mostly read-oriented. Explicit world-action routes are the exception and may persist authenticated, project-scoped outcomes after animation completion.

## Application foundation

The root manifest and lockfile define the supported application stack. The v0.22.18 foundation retains React/React DOM 19.2.8, Next 16.3.6, TypeScript 5.9.3, Three.js 0.185.1, Fiber 9.7.0, Drei 10.7.7, React Three Rapier 2.2.0 and Ecctrl 2.0.0. Runtime Rapier 0.19.2 resolves from its React Three Rapier owner. These are audited installed versions, not recommendations to upgrade independently. The unused postprocessing wrapper and orphan dependencies were removed because their Three peer range excluded the installed version.

| Layer | Owner and responsibility |
|---|---|
| Server document | `src/app/layout.tsx`: document shell, metadata, fonts and theme-cookie seed. Server API handlers enforce authentication/ownership; client session checks provide presentation only. |
| Client providers | `src/app/providers.tsx`: Theme → Session → WorkspaceSettings → PanelAppearance. Theme browser persistence is optional; rejected reads retain the server seed, and independent best-effort storage/cookie writes cannot prevent current-session theme selection or system-color subscriptions. Account preference precedence is unchanged. |
| Project session | Dashboard Scene Coordinator and `useThreeDProjectSessionLoader`: selected Project, load sequencing/abort, explicit mutations, control and target identity. |
| Runtime bridge | `UnifiedMapView`: Runtime Marker/view-state bridge and browser-only dynamic ThreeDScene import (`ssr: false`). |
| Rendering | ThreeDScene's Canvas: Fiber owns React reconciliation, frame subscriptions and renderer lifetime; Three.js owns scene objects/loaders/mixers and WebGL rendering/context handling. Drei supplies controls, environment and cached loader helpers. |
| Simulation | The existing React Three Rapier Physics provider owns one world, default fixed 1/60 stepping following the R3F loop, and world disposal. Marker owners apply queued explicit placement/kick writes at the existing before-step boundary. No second frame loop or simulation authority is needed. |
| Character/asset behavior | Stable marker owners render Models, GardenCharacter or EcctrlCharacter and sensors. `isMovable` chooses Ecctrl; its controller owns controlled movement/grounding. Garden remains separate. |

One Canvas/Rapier world persists during active Scene editing, selection, panels and Layer participation changes. Stable `marker_id` keys preserve owner identity. Leaving the 3D view and closing an independent preview have intentional teardown lifecycles; this guarantee does not mean a global Canvas shared across every route.

Animated collision points observe the active Character action; the exact targeted ball owner validates swept contact and queues one bounded impulse. That v0.22.17 contact-time exception does not authorize persistence or other world actions. Assisted kicks retain their completion path, and other world mutations keep their established completion gates. See [Character runtimes](THREED_CHARACTERS.md), [Markers](THREED_MARKERS.md) and [Dashboard coordinator](THREED_DASHBOARD_COORDINATOR.md).

### Procedural resource ownership

R3F disposes reconciled objects, but a material's `map` and an imperative `scene.background` do not automatically own their referenced textures. `ProceduralDaylightBackground` and `InteractiveGround` acquire their own procedural textures during committed layout-effect setup and dispose them during replacement/unmount cleanup. Grass is bound through its existing material ref; hidden visual ground owns no grass map. Replay acquires fresh usable textures instead of reusing a disposed memoized resource. Background cleanup restores only its own assignment and must not restore a predecessor disposed while superseded or overwrite a successor.

This rule is narrow: shared Drei/useTexture assets, imported Model graph caches and the DRACO pool retain their existing owners. Do not traverse cloned graphs and dispose shared resources or introduce global cache eviction without a separate ownership design. Rendering colors, repeat, ground dimensions, physics stepping and collision behavior are unchanged.

### Configuration and validation policy

Node 24 and the declared npm 11 version own installation/build. TypeScript uses strict checking, no emit, bundler resolution, generated Next types and `@/*` aliases. Next enables React Compiler and retains its existing disabled Strict Mode setting; builds do not bypass TypeScript errors. `npm start` is intentionally the dev-server alias on port 4444; production serving uses `npm run next:start`. No ESLint executable/configuration is installed. None of these settings need a new abstraction or a blanket upgrade for the foundation repairs.

Run `npm run validate -- application-foundations theme-provider threed-scene-resources` for the offline dependency, actual-provider and actual-resource lifecycle gates. All three are in the maintained `ci` group. Dependency checks compare manifest/lock/installed metadata and owner-resolved peers, distinguish active singleton identity from independently owned helper/type dependencies, and exercise deliberate failure fixtures. They do not require every optional platform package in a full-tree npm inventory to be installed. Browser appearance and actual GPU behavior remain separate acceptance checks in the [v0.22.18 plan](../plans/v0.22.18-application-foundations.md).

Admin workspace layout remains host-specific under the [Admin Blueprint](../plans/admin-threed-workspace-blueprint.md). Product UI consumes the repository's shadcn/ui boundary and global CSS variables; foundation maintenance does not apply Admin viewport constraints globally.

## Runtime boundaries

- Drizzle schemas under `src/libraries/schema` are the database source of truth.
- API routes enforce authentication, ownership, activation, and project assignment.
- Dashboard loaders must not substitute global `isActive` queries for project-scoped junction queries.
- ThreeD display markers are generated at runtime; the legacy `threed_markers` table is not part of the current data model.
- `GardenCharacter` and `EcctrlCharacter` are separate runtime paths, selected by `isMovable`.
- ThreeD character interaction orchestration begins with the provider-independent pure planner under `src/libraries/services/threed/orchestration`. It calculates approach destination, arrival, and facing only; each character runtime remains responsible for its own movement implementation.
- FarmBot interaction buttons emit the versioned `threed-character-orchestration-request` browser event. For EcctrlCharacter, the DetailsCard uses its live physics position and the shared planner to keep those buttons disabled until it is within interaction range; movement remains manual through Take Control and WASD. The compatibility bridge then forwards an allowed request to the established animation event without changing either movement runtime. See [ThreeD character runtimes](THREED_CHARACTERS.md).
- Character animation and world-state mutation remain separate responsibilities.
- FarmBot REST authentication and configuration run through owner-scoped Vercel request handlers under `src/libraries/services/threed/farmbot`. Read-only MQTT sessions run in a separate long-running worker under `src/libraries/services/threed/mqtt/integrations/farmbot`; provider-neutral transport and worker authentication live under the same MQTT parent.
- The worker sends bounded normalized runtime/events through a signed internal App route. It has exact read-only subscriptions and no publish interface.
- v0.18.1b enables read-only MQTT status through the shared ThreeD MQTT control layer. Physical FarmBot commands remain disabled, and FarmBot-targeted character actions remain animation-only.

## ThreeD service authority

ThreeD owns shared protocol and data-service boundaries. Provider integrations consume those services without redefining them:

```text
ThreeD
├── mqtt/
│   ├── core/              provider-neutral contracts and session control
│   ├── transports/        protocol transport implementations
│   ├── worker/            shared worker authentication and client boundary
│   └── integrations/
│       └── farmbot/       FarmBot MQTT adapter, worker, and persistence mapping
├── farmbot/               FarmBot REST, credentials, peripherals, and device policy
└── openfarm/              future crop API adapter and ThreeD Plant mapping
```

The dependency direction is `FarmBot/OpenFarm -> ThreeD services`. Code under `src/libraries/services/threed/mqtt` cannot import provider adapters. FarmBot command policy and `threed_farmbot_commands` remain FarmBot-specific because device commands are not generic MQTT behavior. OpenFarm must remain independent of both MQTT and FarmBot and may only create or update owned local ThreeD records through an explicitly approved import workflow.

The shared MQTT service defines `MqttReadonlyIntegrationAdapter`, which owns the provider-neutral integration identity, declared read capabilities, connection request, accepted-topic test, and normalized-message boundary. It also owns the pure read-only lifecycle policy for connection states, expiry, retry limits, and capped backoff. `MqttReadonlySessionController` composes those boundaries with transport callbacks and observer hooks. FarmBot supplies the first adapter under `src/libraries/services/threed/mqtt/integrations/farmbot/adapter.ts`; its registry uses the shared controller while retaining provider-specific grant/session ownership, normalized event mapping, position throttling, persistence records, and credential cleanup.

See [Data model](DATA_MODEL.md), [API guide](API_GUIDE.md), and the [ThreeD FarmBot Integration Plan](FARMBOT_INTEGRATION.md) for the corresponding persistence, request, and hardware boundaries.
