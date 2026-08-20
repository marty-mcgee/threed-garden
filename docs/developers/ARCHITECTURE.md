# Architecture

The application is a Next.js App Router project with two surfaces:

- `src/app/admin` provides authenticated CRUD and project-assignment workflows.
- `src/app/dashboard` provides project-scoped visualization and interaction.

The normal data flow is:

```text
Admin -> Database -> API -> Dashboard
```

The Dashboard is mostly read-oriented. Explicit world-action routes are the exception and may persist authenticated, project-scoped outcomes after animation completion.

## Runtime boundaries

- Drizzle schemas under `src/lib/schema` are the database source of truth.
- API routes enforce authentication, ownership, activation, and project assignment.
- Dashboard loaders must not substitute global `isActive` queries for project-scoped junction queries.
- ThreeD display markers are generated at runtime; the legacy `threed_markers` table is not part of the current data model.
- `GardenCharacter` and `EcctrlCharacter` are separate runtime paths, selected by `isMovable`.
- Character animation and world-state mutation remain separate responsibilities.
- FarmBot REST authentication and configuration run through owner-scoped Vercel request handlers under `src/lib/services/threed/farmbot`. Read-only MQTT sessions run in a separate long-running worker under `src/lib/services/threed/mqtt/integrations/farmbot`; provider-neutral transport and worker authentication live under the same MQTT parent.
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

The dependency direction is `FarmBot/OpenFarm -> ThreeD services`. Code under `src/lib/services/threed/mqtt` cannot import provider adapters. FarmBot command policy and `threed_farmbot_commands` remain FarmBot-specific because device commands are not generic MQTT behavior. OpenFarm must remain independent of both MQTT and FarmBot and may only create or update owned local ThreeD records through an explicitly approved import workflow.

The shared MQTT service defines `MqttReadonlyIntegrationAdapter`, which owns the provider-neutral integration identity, declared read capabilities, connection request, accepted-topic test, and normalized-message boundary. It also owns the pure read-only lifecycle policy for connection states, expiry, retry limits, and capped backoff. `MqttReadonlySessionController` composes those boundaries with transport callbacks and observer hooks. FarmBot supplies the first adapter under `src/lib/services/threed/mqtt/integrations/farmbot/adapter.ts`; its registry uses the shared controller while retaining provider-specific grant/session ownership, normalized event mapping, position throttling, persistence records, and credential cleanup.

See [Data model](DATA_MODEL.md), [API guide](API_GUIDE.md), and the [ThreeD FarmBot Integration Plan](FARMBOT_INTEGRATION.md) for the corresponding persistence, request, and hardware boundaries.
