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
- FarmBot REST authentication and configuration run through owner-scoped Vercel request handlers. Read-only MQTT sessions run in a separate long-running worker under `src/lib/services/threed/farmbot/mqtt`; provider-neutral transport and worker authentication live under `src/lib/services/threed/mqtt`.
- The worker sends bounded normalized runtime/events through a signed internal App route. It has exact read-only subscriptions and no publish interface.
- v0.18.1a enables read-only MQTT status only. Physical FarmBot commands remain disabled, and FarmBot-targeted character actions remain animation-only.

See [Data model](DATA_MODEL.md), [API guide](API_GUIDE.md), and the [ThreeD FarmBot Integration Plan](FARMBOT_INTEGRATION.md) for the corresponding persistence, request, and hardware boundaries.
