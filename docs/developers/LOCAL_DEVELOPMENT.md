# Local Development

## Setup

Use Node.js 24.x and the npm version declared by `packageManager` in `package.json` (currently 11.6.2). `.nvmrc` selects Node 24; `package-lock.json` is the dependency lockfile and must be committed with dependency changes. Use `npm install` locally and in CI. CI explicitly installs the declared npm version before `npm install`, then checks that installation leaves the committed lockfile unchanged. Different npm versions can rewrite lockfile metadata even when installation succeeds.

```bash
npm install
npm run dev
```

`npm start` is a shortcut for the same development server. `npm run build` creates a production build and `npm run next:start` serves it.

Open `http://localhost:4444`. Create an untracked `.env.local` in the project root and populate it with your own development values and never commit it.

## Database schema commands

Use the native Drizzle Kit commands defined in `package.json`:

```bash
npm run db:generate
npm run db:push
```

Both use the installed Drizzle Kit CLI and the central `src/libraries/schema/index.ts`, which exports the authoritative ThreeD schema at `src/libraries/schema/threed/index.ts`.

`db:generate` selects `drizzle.generate.config.ts`. It needs no database credentials or connection and writes SQL/snapshots under the existing ignored `drizzle/` directory. It compares the current schema with the latest local snapshot; a fresh checkout without snapshots generates an initial baseline. In this checkout, the existing v0.22.25 baseline produced `drizzle/0001_threed_simulation_results.sql`, containing only the v0.22.27 result table, constraints and indexes. Generation does not apply SQL.

`db:push` selects `drizzle.config.ts`, which reuses the same schema settings and loads `.env.local`, then `.env` as a fallback. An already supplied process `DATABASE_URL` takes precedence. Push prints its proposed SQL and requires native strict confirmation. It compares the **whole current Drizzle schema** with the connected database; it does not replay files from `db:generate`. No SQL Editor or third-party application is required. The database is selected by `DATABASE_URL`, not by the Git branch. See the official [generate](https://orm.drizzle.team/docs/drizzle-kit-generate) and [push](https://orm.drizzle.team/docs/drizzle-kit-push) references.

Before a push, verify the intended Neon project, branch and database behind `DATABASE_URL`, then review every proposed statement. The User confirmed that this checkout and Vercel Production use the same Neon `DATABASE_URL`; a local `db:push` therefore changes the live database. Verify the actual connection before accepting any proposal. The seed script's `--confirm-development` flag does not establish branch isolation. For v0.22.4, [the release handoff](../releases/v0.22.4.md) records the shared-database comparison. The Scenario table already exists; the broader Drizzle proposal remains unaccepted. Apply schema changes only when that specific change and target have been authorized.

Subsequent evidence, October 5: the Developer supplied successful v0.22.27 and v0.22.28 native pushes. The earlier unaccepted-proposal status above is historical. The pushes included Results/Assembly schema creation, Scenario-link removal and other App-schema reconciliation. See the [v0.22.28 handoff](../plans/v0.22.28-release-handoff.md) for exact evidence and limits. Generation remains a local snapshot comparison; push remains a whole-App live comparison. The agent did not execute or independently inspect those live pushes.

October 5, 2026: the Developer requested this native npm workflow for v0.22.27, replacing the earlier manual SQL Editor recommendation. The agent validated actual offline generation, matching result SQL, shared config/connection precedence, TypeScript, 64-task CI and a guarded npm build (135 pages). No live push or database comparison was executed. The generated files remain locally ignored under the existing repository policy; retain snapshots for incremental generation. Do not use the historical initial baseline through a migration runner against an existing database; `db:migrate` remains the existing informational script.

## Multimedia seed import

`npm run multimedia:import -- --user-id=<existing-user-id> --file src/libraries/data/multimedia/seed-data.json` validates the JSON and previews album/track counts without opening a database connection. Add `--commit` only after confirming the target user and database; the standalone write path loads `.env.local` before opening the shared database client. The importer creates missing albums and tracks by owner-scoped natural keys and skips existing matches on rerun. This checkout's database is also used by Vercel Production, so a committed import writes live data.

## Traffic module import

`npm run traffic:import -- --user-id=<existing-user-id>` validates `src/libraries/data/traffic/seed-data.json` and previews its module and Project-assignment counts without opening a database connection. An optional `--file <path>` selects another version-1 JSON file. Add `--commit` to create missing Traffic modules and their explicitly listed `projectIds` in one database transaction. Every requested Project must belong to the target user. Existing modules and assignments are preserved on rerun; an existing slug owned by another user causes the import to fail. The included seed creates the private, active `ThreeD Traffic` module with no Project assignments. The checkout's database is shared with Vercel Production, so `--commit` writes live data.

## Validation

Use the repository's narrow-first ladder:

```bash
git diff --check
npm run typecheck
```

Run `npm run validate -- assets` when the external animation manifest or production animation files change. Run `npm run build` for routing, bundling, server/client boundary, or release-readiness changes.

Run `npm run validate -- farmbot-crypto` for FarmBot credential/configuration work. For read-only MQTT work, also run `npm run validate -- threed-mqtt`, `npm run validate -- farmbot-worker`, and `npm run validate -- farmbot-mqtt-persistence` as applicable. Local FarmBot credentials require server-only `FARMBOT_CREDENTIAL_KEY_VERSION` and matching `FARMBOT_CREDENTIAL_KEY_V<n>` configuration. Never commit key values or JWTs.

Run `npm run validate -- farmbot-command-policy` for Phase 3 semantic intent or lifecycle-policy work. This check is offline and must remain free of database, broker, and hardware access.

The read-only worker runs separately with `npm run farmbot:mqtt-worker`. Its private `THREED_MQTT_*` configuration is documented in [FarmBot Adapter for ThreeD MQTT Services](FARMBOT_MQTT_WORKER.md). Use distinct App-to-worker and worker-to-App signing keys. The old global FarmBot environment-token workflow is not the v0.18.1b integration path.

The complete policy and manual ThreeD checklist are in [Agent Validation](../agents/VALIDATION.md).
