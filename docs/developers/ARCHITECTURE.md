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

See [Data model](DATA_MODEL.md) and [API guide](API_GUIDE.md) for the corresponding persistence and request boundaries.
