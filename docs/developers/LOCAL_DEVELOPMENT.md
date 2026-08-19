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

Run `npm run validate:farmbot-crypto` for v0.18.0 FarmBot work. Local FarmBot credentials require server-only `FARMBOT_CREDENTIAL_KEY_VERSION` and matching `FARMBOT_CREDENTIAL_KEY_V<n>` configuration. Never commit key values or JWTs. The Admin connection workflow stores per-device credentials; the old global FarmBot environment-token workflow is not the v0.18.0 integration path.

The complete policy and manual ThreeD checklist are in [Agent Validation](../agents/VALIDATION.md).
