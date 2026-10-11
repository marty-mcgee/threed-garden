## Current production: v0.24.4

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](docs/releases/v0.24.4.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.4`; dependencies and database schema are unchanged. Prior local TypeScript, 71-task offline CI and guarded build (143 pages) are pre-release evidence, not independent post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%; named-view authenticated smoke, physical-device touch and Builder acceptance remain separately documented. This confirmation changes documentation only; leave changes unstaged under the Manual Release Gate. Earlier preparation-only and production-version statements below are historical and superseded by this confirmation.

## Historical local v0.24.4 release checkpoint

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](docs/releases/v0.24.4.md)**. Prepared locally October 11, 2026 on `main`. Package/root lockfile are `0.24.4`; dependencies and database schema are unchanged. Production remains Developer-confirmed v0.24.3. This checkpoint is not yet published or deployed. Earlier local-version statements below are historical; leave changes unstaged under the Manual Release Gate.

## Previous production: v0.24.3

**[v0.24.3 — ThreeD Scene: Saved views and component cleanup](docs/releases/v0.24.3.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.3`; dependencies and database schema are unchanged. Prior local validation is pre-release evidence, not independent post-deployment verification. Exact deployed SHA and authenticated named-view Save/reload smoke checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This records release confirmation only; leave changes unstaged under the Manual Release Gate.

This checkpoint preserves the Developer's manual edits and accepted panel extractions, fixes immediate named-view snapshot capture/hydration and adds Designs layer visibility. ThreeDDesign remains unconnected to callers. Historical version/status records below retain their original evidence; this release confirmation supersedes earlier preparation-only and production-version statements.

# ThreeD Garden

Current production: **[v0.24.2 — Workspace Feedback + Responsive Reliability](docs/releases/v0.24.2.md)**. Developer confirmed production release October 10, 2026. Package/root lockfile remain 0.24.2; dependencies and schema are unchanged. Prior local validation is pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. New-feedback authenticated smoke testing, physical-device touch and Builder-specific acceptance remain separately documented. This records release confirmation only; leave changes unstaged under the Manual Release Gate.


Previous production: **[v0.24.1 — ThreeD Scene: UI/UX Improvements: App Layout + Page Headers](docs/releases/v0.24.1.md)**. Developer confirmed production release October 10, 2026. Package and both root lockfile version fields remain 0.24.1; dependencies and schema are unchanged. Prior local CI/build/browser checks are pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This documentation update performs no Git write, deployment or live-system operation; leave changes unstaged.

Previous production: **[v0.24.0 — ThreeD Designs: Project workspace and saved state](docs/releases/v0.24.0.md)**. Developer confirmed final `0.24.0` released to production October 10, 2026, following authenticated Save/Reload checks reported 100% passed. Released package/root lockfile were `0.24.0`; local preparation is now `0.24.1`. This supersedes earlier pending authenticated Save/Reload and RC-versioning statements below. Verification is Developer-reported, separate from agent automated checks. Production release is Developer-confirmed; exact deployed SHA and independent post-deployment checks remain unconfirmed. Leave changes unstaged; no Git write or deployment is authorized.

Historical development: **[v0.24.0-delta — Cleanup toward release candidacy](docs/plans/v0.24.0-delta-cleanup.md)**. Package/root lockfile are `0.24.0-delta`; the delta planning checkpoint was Developer-confirmed released to production October 10, 2026. This is a prerelease planning baseline, not release-candidate acceptance. Delta is for existing bug fixes and acceptance, before a proposed `0.24.0-rc.1` and stable `0.24.0`. No new runtime fix or release readiness is claimed by this preparation. Earlier package/version statements below describe their historical checkpoints.

Previous production: **[v0.24.0-centaur — ThreeD Designs: Workspace tools and state](docs/releases/v0.24.0-centaur.md)**, Developer-confirmed October 10, 2026. Package/root lockfile remain `0.24.0-centaur`. Includes canvas-local tools, staged JSON import, Project workspace snapshot support and compact colored Properties headers. Authenticated Save/reopen, post-deployment verification and exact deployed SHA remain unconfirmed. This records release confirmation only; no Git write or deployment is authorized. Earlier checkpoint statements below are historical.

Previous production: **[v0.24.0-beta — ThreeD Designs: Dashboard workspace](docs/releases/v0.24.0-beta.md)**, Developer-confirmed October 10, 2026. Production was released at 0.24.0-beta; local package/root lockfile are now 0.24.0-centaur. The revised Design layout is accepted; authenticated architecture Save/reload and post-deployment verification remain unverified. Exact deployed SHA is unconfirmed.

Previous production: **[v0.24.0-alpha — ThreeD Designs: Project Scene integration](docs/releases/v0.24.0-alpha-project-design.md)**, Developer-confirmed October 9, 2026. Detailed authenticated App and post-deployment verification remain separate.

### 🌱 Build your garden. Explore your world. Bring your models to life.

**Turn your assets into an interactive world.** ThreeD Garden brings 3D scenes, geographic maps, animated characters, and multimedia together in one project workspace. Organize your library, compose a scene, and step inside it.

[![Repository validation](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml/badge.svg?branch=main)](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml?query=branch%3Amain)

🟢 **Earlier production release:** [v0.24.0-alpha — 3D Object Builder + Home Design Tools](docs/releases/v0.24.0-alpha.md), Developer-confirmed in production October 9, 2026.

🛠️ **3D Object Builder:** [Implementation record](docs/plans/v0.24.0-alpha-model-builder.md) · [Builder guide](docs/developers/THREED_MODEL_BUILDER.md)

**ThreeD Designs:** Edit the active Project/Scene in `design` View Mode using linked 2D/3D walls, floors, doors/windows, levels and roofs with cutouts/skylights. The accepted layout places Assets above Properties on the left and the Scene above the ruled Plan on the right, beneath one shared Project toolbar. Resize the rows, edit Imperial properties, use icon actions/tooltips, snap/pan/zoom, Undo/Redo and validated JSON merge or architecture-only replacement. [ThreeD Designs guide](docs/developers/THREED_DESIGNS.md) · [Dashboard instructions](docs/users/DASHBOARD_GUIDE.md#threed-design-beta).

Architecture uses the existing `project.config.threeDArchitecture` JSONB content and Project snapshot Save/load; no separate table/migration is required. The Developer confirmed authenticated Save/Reload passed 100% for v0.24.0, superseding historical pending beta entries. See [released acceptance](docs/releases/v0.24.0.md).

**Released v0.24.1:** Dashboard/Admin beside the App title, a simpler Admin header, right-aligned Dashboard credits and immediate DetailsCard position restoration. [Release notes](docs/releases/v0.24.1.md). Builder upload/PBR/placement acceptance and broader mobile/touch coverage remain separate; see [Builder acceptance](docs/plans/v0.24.0-alpha-model-builder.md#9-pending-acceptance-and-retained-exclusions).

[🚀 Get started](docs/users/GETTING_STARTED.md) · [🎮 Explore the controls](docs/users/THREED_CONTROLS.md) · [📚 Browse the docs](docs/README.md) · [🛠️ Run locally](#run-it-locally)

## Create, organize, explore

- 🌍 **Your project, in 2D and 3D.** Connect geographic maps with interactive scenes. Arrange Models, Beds, Plantings, Characters, and FarmBots; organize visibility with Layers and save supported Project state through snapshots. [Explore Ground Maps](docs/users/THREED_GROUND_MAPS.md).
- 🧩 **A library for your 3D assets.** Bulk import **FBX, GLB, GLTF, and OBJ**, inspect supported dependencies, reuse textures, and manage Model Files. Centered Canvas previews, camera Fit/Reset, and transparent PNG exports make assets easier to review and present. [Discover Model management](docs/developers/THREED_MODEL_ADMIN.md).
- 🟣 **Categories that scale with your collection.** Browse expandable parent–child trees, drag siblings to save their Order, and select Models to **Add, Remove, or Replace Categories in bulk**. Model Add/Edit forms use the same hierarchy with independent assignments. [See the latest milestone](docs/releases/v0.22.23.md).
- 🎮 **Characters that bring scenes to life.** Add and edit Characters on dedicated Admin pages, preview their Models, and map animation actions. Take control with WASD or let autonomous Characters move through the garden. Physics readiness, moving colliders, and loading feedback support their introduction to the Scene. [Meet the Character runtimes](docs/developers/THREED_CHARACTERS.md) · [Read the Scene improvements](docs/releases/v0.22.21.md).
- ⚽ **Play and interact.** Explore playable soccer, select scene objects, and perform supported actions such as watering and picking fruit. [Explore ThreeD Soccer](docs/releases/v0.22.10.md) · [Learn the controls](docs/users/THREED_CONTROLS.md).
- 🔵 **A cleaner creative workspace.** Admin organizes reusable content; Dashboard brings it into your Projects. Consistent shadcn/ui forms, transparent rounded panels, title help, clear Save controls, and Toast feedback keep editing focused. [See the Admin Blueprint](docs/plans/admin-threed-workspace-blueprint.md).
- 🎵 **More than a scene editor.** Bring Albums, Tracks, Links, Media, and Speech into your workflow, with Dashboard playback and waveform visualization. Explore traffic and geographic views alongside your Projects. [Open the Admin guide](docs/users/ADMIN_GUIDE.md).

### 🤖 FarmBot, from assets to assembly drafts

Use FarmBot component Models in the shared library and compose local Assembly drafts with relative transforms, repeated components, and JSON import/export. The device integration provides owner-scoped configuration and read-only status; physical commands remain disabled. [Assembly foundations](docs/releases/v0.20.12.md) · [FarmBot integration](docs/developers/FARMBOT_INTEGRATION.md).

## Built for interactive worlds

| | Technology |
| --- | --- |
| 🟦 App | Next.js 16 · React 19 · TypeScript |
| 🟪 3D | Three.js · React Three Fiber · Drei |
| 🟧 Motion | Rapier Physics · Ecctrl |
| 🟩 Maps & data | Leaflet · Neon Postgres · Drizzle ORM |
| 🔐 Workspace | Auth.js · Tailwind CSS · shadcn/ui · Radix UI |
| ☁️ Assets | Vercel Blob · AWS S3 integrations |

[🏗️ Architecture](docs/developers/ARCHITECTURE.md) · [🗃️ Data model](docs/developers/DATA_MODEL.md) · [🔌 API guide](docs/developers/API_GUIDE.md)

## Run it locally

Use **Node.js 24 + npm 11**. Install dependencies, configure your development environment and database using the [Local Development guide](docs/developers/LOCAL_DEVELOPMENT.md), then start the app:

```bash
npm install
npm run dev
```

Open [🌐 localhost:4444](http://localhost:4444). The interactive Scene lives at `/dashboard/scene`.

For Drizzle schema updates:

```bash
npm run db:generate
npm run db:push
```

Generation writes local SQL; push shows the database changes for confirmation. [🗃️ Database workflow](docs/developers/LOCAL_DEVELOPMENT.md#database-schema-commands).

For checks and a production build:

```bash
npm run typecheck
npm run validate -- ci
npm run build
npm run next:start
```

[✅ Validation guide](docs/agents/VALIDATION.md) · [🚢 Deployment guide](docs/developers/DEPLOYMENT.md)

## Keep exploring

[📖 Documentation hub](docs/README.md) · [🆕 Release history](docs/releases/README.md) · [💻 GitHub repository](https://github.com/marty-mcgee/threed-garden) · [🤝 Agent guide](docs/agents/README.md)

The original app and its history remain available on [📦 legacy-v0.17](https://github.com/marty-mcgee/threed-garden/tree/legacy-v0.17). See the [repository migration record](docs/plans/threed-garden-repository-migration.md) for provenance.

[⚖️ MIT License](LICENSE)
