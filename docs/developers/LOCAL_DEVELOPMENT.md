# Local Development

## Setup

```bash
bun install
cp .env.example .env.local
bun dev
```

Open `http://localhost:4444`. Populate `.env.local` with your own development values and never commit it.

Database schema commands such as `bun db:push` should be run only when a schema change is explicitly approved and the target database is understood.

## Validation

Use the repository's narrow-first ladder:

```bash
git diff --check
npm run typecheck
```

Run `npm run validate:assets` when the external animation manifest or production animation files change. Run `npm run build` for routing, bundling, server/client boundary, or release-readiness changes.

Run `npm run validate:farmbot-crypto` for FarmBot credential/configuration work. For read-only MQTT work, also run `npm run validate:threed-mqtt`, `npm run validate:farmbot-worker`, and `npm run validate:farmbot-mqtt-persistence` as applicable. Local FarmBot credentials require server-only `FARMBOT_CREDENTIAL_KEY_VERSION` and matching `FARMBOT_CREDENTIAL_KEY_V<n>` configuration. Never commit key values or JWTs.

The read-only worker runs separately with `npm run farmbot:mqtt-worker`. Its private `THREED_MQTT_*` configuration is documented in [FarmBot Adapter for ThreeD MQTT Services](FARMBOT_MQTT_WORKER.md). Use distinct App-to-worker and worker-to-App signing keys. The old global FarmBot environment-token workflow is not the v0.18.1a integration path.

The complete policy and manual ThreeD checklist are in [Agent Validation](../agents/VALIDATION.md).
