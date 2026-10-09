# ThreeD Garden

### 🌱 Build your garden. Explore your world. Bring your models to life.

**Turn your assets into an interactive world.** ThreeD Garden brings 3D scenes, geographic maps, animated characters, and multimedia together in one project workspace. Organize your library, compose a scene, and step inside it.

[![Repository validation](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml/badge.svg?branch=main)](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml?query=branch%3Amain)

🟢 **Latest release:** [v0.24.0-alpha — 3D Object Builder + Home Design Tools](docs/releases/v0.24.0-alpha.md), Developer-confirmed in production October 9, 2026.

🛠️ **3D Object Builder:** [Implementation record](docs/plans/v0.24.0-alpha-model-builder.md) · [Builder guide](docs/developers/THREED_MODEL_BUILDER.md)

🏠 **Home Design prototype:** [Live 2D-to-3D planning surface](docs/plans/v0.24.0-alpha-home-design.md) · [Drawing and developer guide](docs/developers/THREED_HOME_DESIGN.md)

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
