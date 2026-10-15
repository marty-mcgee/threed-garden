# Project 17: Designs integration investigation

## Implemented Project Save integration

User approved implementation after the investigation. `project-design-projection.ts` now reads the just-saved, owner-locked Project config and upserts a derived Designs record inside the existing marker/config transaction. A reserved deterministic owner/Project create-key uses the existing unique index; historical records are not adopted. Document validation and returned-content confirmation are required. A failure propagates to the transaction; no second Save endpoint or new schema is introduced. Existing Project loading remains authoritative.

No live initialization was run. Project 17 will gain its derived record on its next successful Project Save using this code. Repeated saves retain the record ID and increment its revision. Projects without architecture do not create a Design record. The Designs table must exist in each deployed database; missing storage causes Save to fail atomically rather than silently omit the record.

Verification: TypeScript passed. The focused mocked test covers creation/update, stable identity, owner rejection, failure propagation, missing architecture and preservation of unrelated config. Actual PostgreSQL upsert/concurrency, full endpoint rollback and authenticated Save/reopen still require integration/manual verification; mocked chain tests do not prove those database behaviors. No live writes, schema changes or server operations were performed.

October 14, 2026. User authorized Neon connection and analysis of Project 17. Live inspection used a PostgreSQL `BEGIN READ ONLY` transaction, a bounded statement timeout and rollback. No records or schema were changed. Neon connector project discovery returned no projects; inspection used the repository-configured connection without printing credentials.

## Confirmed current data

- Project 17: Legacy Plan Demo 1 Recovery.
- Saved document: threed-plan-demo-1, native version 5, 38 walls, 10 floors, four roofs and three levels.
- Existing Project relationships: ThreeD module 11, 28 asset assignments and 53 placements.
- `threed_designs` exists and has zero records globally, including for Project 17.
- Its live foreign keys reference `user.id` and `project.id`; there is no direct module or Model foreign key. Its document constraint requires version 5, metres, the expected format and a matching nonempty name.

## Why the table is empty

This matches current implementation rather than demonstrating lost architecture:

- `src/libraries/schema/threed/index.ts` explicitly describes Designs as legacy candidate records retained for read-only recovery.
- `src/app/api/threed/designs/route.ts` retires POST/PATCH with HTTP 410; current edits use Project Save.
- `src/app/api/project/threed-markers/route.ts` merges `threeDArchitecture` and workspace preferences into Project config inside the existing snapshot transaction, then parses saved architecture for its response.
- `src/libraries/services/threed/design/project-architecture.ts` reads the architecture from Project config.
- `src/libraries/services/threed/design/legacy-recovery-database.ts` originally wrote recovered architecture to that same Project field.

## Recommended focused implementation

Keep Project config authoritative initially. Maintain one explicitly linked Designs projection of that architecture through the existing Project Save transaction, not a second editor/save endpoint. Establish a stable record identity (the existing owner/create-key unique index is available), validate document and owner, and preserve its ID across saves. Treat the projection as derived data, with no independent edits. Verify current live indexes and race behavior before selecting the exact upsert contract.

Project 17 can then receive an idempotent, explicitly authorized initial projection from its saved architecture, with count/content/owner readback. Do not rerun legacy recovery or duplicate Models, placements or files. Do not insert a standalone test row that immediately goes stale.

Relationships to module 11 and assets remain through Project 17's established joins; unrelated ThreeD tables do not need artificial foreign keys. A future move to Designs as the canonical storage would be a separate migration with fallback/backfill and full round-trip tests, not part of this read-only investigation.

Before live initialization, implement and test the same-transaction projection with mocked boundaries: stable identity, repeated/concurrent saves, owner rejection, rollback, unchanged unrelated config/assets and existing Save/load hydration. The live initialization/write is not performed or claimed here. User review of this concrete integration boundary precedes expansion into live writes.
