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

The Node/npm equivalents of the historical Bun commands are already defined in `package.json`:

```bash
npm run db:generate
npm run db:push
```

Both use the installed Drizzle Kit CLI and `drizzle.config.ts`. That config loads `.env.local` (then `.env` as a fallback) and uses `DATABASE_URL`; the commands target the database named by that URL, not a database selected by the Git branch. `db:generate` writes SQL and schema snapshots under the ignored `drizzle/` directory for review. It does not apply the SQL. `db:push` compares the **whole current Drizzle schema** with the connected database and applies its proposed changes after the script's `--strict` confirmation. It does not replay the file from `db:generate`.

Before a push, verify the intended Neon project, branch and database behind `DATABASE_URL`, then review every proposed statement. The User confirmed that this checkout and Vercel Production use the same Neon `DATABASE_URL`; a local `db:push` therefore changes the live database. Verify the actual connection before accepting any proposal. The seed script's `--confirm-development` flag does not establish branch isolation. For v0.22.4, [the release handoff](../releases/v0.22.4.md) records the shared-database comparison. The Scenario table already exists; the broader Drizzle proposal remains unaccepted. Apply schema changes only when that specific change and target have been authorized.

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
