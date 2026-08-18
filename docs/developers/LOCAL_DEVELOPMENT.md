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

The complete policy and manual ThreeD checklist are in [Agent Validation](../agents/VALIDATION.md).
