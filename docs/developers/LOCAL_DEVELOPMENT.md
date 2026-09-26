# Local Development

## Setup

Use Node.js 24.x and npm 11.x. `.nvmrc` selects Node 24; `package-lock.json` is the dependency lockfile and must be committed with dependency changes. Use `npm install` locally and in CI. CI checks that installation leaves the committed lockfile unchanged.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm start` is a shortcut for the same development server. `npm run build` creates a production build and `npm run next:start` serves it.

Open `http://localhost:4444`. Populate `.env.local` with your own development values and never commit it.

Database schema commands such as `npm run db:push` should be run only when a schema change is explicitly approved and the target database is understood.

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
