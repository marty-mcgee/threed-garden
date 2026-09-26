# ThreeD Garden

[![Repository validation](https://github.com/marty-mcgee/marty-mcgee-neon/actions/workflows/validation.yml/badge.svg?branch=main)](https://github.com/marty-mcgee/marty-mcgee-neon/actions/workflows/validation.yml?query=branch%3Amain)

### Build your garden. Explore your world. Bring your models to life.

**ThreeD Garden brings interactive 3D scenes, geographic maps, animated characters, and multimedia into one project workspace.** Arrange garden beds and plantings, place models from your library, take control of a character, and explore your project from the ground or above.

Built with **Next.js 16, React 19, TypeScript, Three.js, and React Three Fiber**, with **Rapier physics**, **Neon Postgres**, and **Drizzle ORM** behind the experience. **Node.js 24 + npm 11** provide a consistent development and build workflow.

**Current production release:** [v0.21.1 — ThreeD Documentation + CI Reliability](docs/releases/v0.21.1.md)

[Explore the features](#what-you-can-build) · [Meet the stack](#the-technology-behind-threed) · [Run locally](#developer-quick-start) · [Read the docs](docs/README.md)

## What you can build

### 🌱 An interactive garden, from map to model

Create Projects with Beds, Plantings, Characters, FarmBots, and reusable Models. Move between a Leaflet 2D map and a ThreeD Scene, use ground maps to give your project geographic context, and adjust Project-instance positions, dimensions, and rotation through the Scene's controls.

Layers organize what you see and interact with. Project snapshots let you explicitly save and restore supported Scene state, while the guided Project Tour helps you establish your Environment, Models, and Characters.

### 🧩 A model library built around your assets

Import **FBX, GLB, GLTF, and OBJ** models with their supported materials and dependencies. The Bulk Import Tool combines file inspection, previews, reusable texture assignments, batch naming prefixes, Title Case, and recovery controls in one workflow.

Manage primary model files, textures, categories, and animation assignments in Admin. Place eligible library models into Projects, adjust their instance transforms, and export **transparent PNG previews** for library presentation.

### 🎮 Characters you can explore with

Take control of a movable character with **WASD**, run, jump, and navigate a world with physics and collisions. Switch between camera perspectives, select objects for details, and use supported character actions such as watering and picking fruit.

Autonomous garden characters and player-controlled characters have separate runtime paths. Shared animation assets and action mappings let models reuse animation behavior while supported world actions persist their results after the animation completes.

### 🗺️ Maps, traffic, and multimedia in the same app

Explore geographic data through traffic maps and source-specific views. Build a Multimedia collection with Albums, Tracks, Links, Media, and Speech tools, then listen through the Dashboard player and waveform visualizer.

Projects connect assets across modules, giving you a common workspace for spatial scenes, data, and media.

### 🛠️ Tools for both creators and administrators

The **Dashboard** is where you explore and interact with Projects. The **Admin workspace** is where you organize reusable assets, edit records, assign project content, and configure the app. Shared UI components keep forms, dialogs, tables, and controls consistent across both.

### FarmBot models and Assembly foundations

FarmBot component files use the same ThreeD Model library as other assets. The Front-End Assembly workspace supports **local composition drafts** with model selection, relative transforms, repeated components, and JSON import/export.

Database schema and ORM service foundations are present; database-backed save/load UI, live 3D assembly construction, and Project assembly placement remain future work. These model workflows do not require a FarmBot device connection.

Separately, the existing FarmBot integration provides owner-scoped configuration and **read-only device status** through ThreeD's MQTT services. Physical commands and MQTT publishing remain disabled. See the [Assembly checkpoint](docs/releases/v0.20.12.md) and [FarmBot integration guide](docs/developers/FARMBOT_INTEGRATION.md) for the current boundaries.

## The technology behind ThreeD

| Technology | What it brings to the app |
| --- | --- |
| **Next.js 16 + React 19 + TypeScript** | App Router pages, API routes, reusable components, and typed application code. |
| **Three.js + React Three Fiber + Drei** | Interactive 3D rendering, scene composition, cameras, environments, and visual controls. |
| **Rapier + ecctrl** | Rigid-body physics, collisions, and controllable characters. |
| **Leaflet + React Leaflet** | Geographic maps, markers, and project/map navigation alongside 3D views. |
| **Neon Postgres + Drizzle ORM** | Persistent project and module data with TypeScript schema definitions and queries. |
| **Auth.js** | Authentication and session handling for protected application workflows. |
| **Tailwind CSS + shadcn/ui + Radix UI** | Shared styling and UI primitives across Admin and Dashboard. |
| **Vercel Blob + AWS S3** | Storage integrations for uploaded model, image, and multimedia assets. |
| **Node.js 24 + npm 11** | Dependency installation, development, production builds, scripts, and validation. |

## Developer quick start

Repository: `marty-mcgee/marty-mcgee-neon`. Application package: `marty-mcgee-neon`.

### 1. Install dependencies

Use **Node.js 24.x** and **npm 11.x**. If you use nvm, `.nvmrc` selects the Node version:

```bash
nvm use
npm install
```

Without nvm, install the matching Node.js version and run `npm install` directly. Commit `package-lock.json` with dependency changes; it is the project's dependency lockfile. Bun is no longer required.

### 2. Configure your local environment

Copy the environment template to an untracked local file:

```bash
cp .env.example .env.local
```

Configure your own development values. The core database and authentication settings are:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE
NEXTAUTH_URL=http://localhost:4444
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET
```

Generate a local authentication secret with:

```bash
openssl rand -base64 32
```

Storage, weather, and device integrations need additional configuration only when you use those features. Keep credentials server-side and out of committed files. See [Local Development](docs/developers/LOCAL_DEVELOPMENT.md) for setup details and [the FarmBot worker guide](docs/developers/FARMBOT_MQTT_WORKER.md) for its separate configuration.

### 3. Prepare your development database

Drizzle schemas are the source of truth under [`src/libraries/schema/`](src/libraries/schema/). For a database you intend to initialize or update, review the proposed changes with:

```bash
npm run db:push
```

This command uses strict confirmation. Check the target database and proposed statements before applying them. An existing configured database does not need a schema push simply to start the app.

### 4. Start ThreeD

```bash
npm start
```

Open [localhost:4444](http://localhost:4444). `npm run dev` starts the same development server.

For a production build and local production server:

```bash
npm run build
npm run next:start
```

`npm start` is intentionally the development shortcut in this repository; `npm run next:start` serves the production build.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies from the manifest and npm lockfile. |
| `npm start` / `npm run dev` | Start development on port 4444. |
| `npm run build` | Create a production build. |
| `npm run next:start` | Serve the production build on port 4444. |
| `npm run typecheck` | Check TypeScript without emitting application code. |
| `npm run validate -- ci` | Run the maintained CI validation group. |
| `npm run validate -- --list` | List validation tasks and groups. |
| `npm run validate -- <name...>` | Run selected validation tasks or groups. |
| `npm run validate:all` | Run every registered validation task. |
| `npm run db:generate` | Generate migration files from the Drizzle schema. |
| `npm run db:push` | Review and apply schema changes with strict confirmation. |
| `npm run db:studio` | Open Drizzle Studio. |

CI uses `npm install`, checks that the committed lockfile remains unchanged, and runs TypeScript and the CI validation group. Follow the [validation guide](docs/agents/VALIDATION.md) for targeted checks and manual Scene regression coverage.

Additional scripts support ThreeD model import, Multimedia import, and the separately hosted FarmBot worker. Consult their [Model Admin](docs/developers/THREED_MODEL_ADMIN.md), [Multimedia](docs/users/ADMIN_GUIDE.md), and [worker](docs/developers/FARMBOT_MQTT_WORKER.md) guides before running import or integration operations.

## How the application fits together

**Admin manages reusable content; Dashboard brings Project content into interactive views.** Both use authenticated API routes and shared services backed by Drizzle and Postgres. Dashboard interactions also write supported Project changes, including marker edits, explicit saves, and completed world actions.

The canonical Scene route is `/dashboard/scene`. Reusable Model assets and their Project placements have separate responsibilities: editing an instance's transform should not change the source Model. The Scene preserves stable marker identities and a persistent Canvas/physics world while individual assets change.

Character routing follows `isMovable`: movable characters use `EcctrlCharacter`, while garden characters retain the separate `GardenCharacter` path. Animation orchestration and world-state persistence remain separate concerns.

```text
src/
├── app/
│   ├── admin/                 # Asset management and configuration
│   ├── dashboard/             # Projects, Scene, maps, and multimedia
│   └── api/                   # Authenticated data and action endpoints
├── components/
│   ├── map/                   # Unified map and ThreeD Scene
│   ├── threed/                # Models, markers, characters, and controls
│   ├── multimedia/            # Player, albums, gallery, and visualizers
│   ├── traffic/               # Traffic views
│   └── ui/                    # Application-owned shadcn/ui components
└── libraries/
    ├── schema/                # Auth, Multimedia, Project, Settings, ThreeD, Traffic
    ├── db/                    # Database client and helpers
    ├── services/              # Domain logic and integrations
    └── types/                 # Shared TypeScript types
```

The ThreeD schema lives in [`src/libraries/schema/threed/index.ts`](src/libraries/schema/threed/index.ts). Start with [Architecture](docs/developers/ARCHITECTURE.md), [Data Model](docs/developers/DATA_MODEL.md), and [API Guide](docs/developers/API_GUIDE.md) for deeper implementation details.

## Documentation and release history

| Start here | Find |
| --- | --- |
| [Documentation Hub](docs/README.md) | Guides organized by audience. |
| [Getting Started](docs/users/GETTING_STARTED.md) | The user workflow through Admin and Dashboard. |
| [ThreeD Controls](docs/users/THREED_CONTROLS.md) | Scene navigation and interaction. |
| [Ground Maps](docs/users/THREED_GROUND_MAPS.md) | Geographic context for ThreeD Projects. |
| [Model Management](docs/developers/THREED_MODEL_ADMIN.md) | Files, materials, previews, importing, and library behavior. |
| [Character Runtimes](docs/developers/THREED_CHARACTERS.md) | Animation, movement, and interaction boundaries. |
| [Local Development](docs/developers/LOCAL_DEVELOPMENT.md) | Environment setup and validation workflow. |
| [Deployment](docs/developers/DEPLOYMENT.md) | Deployment notes and operational context. |
| [Release History](docs/releases/README.md) | Production checkpoints and release details. |
| [v0.21.0 Release Notes](docs/releases/v0.21.0.md) | The npm migration, verification, and known dependency findings. |
| [Agent Guide](docs/agents/README.md) | Repository conventions and change boundaries for coding agents. |

Detailed release timelines and FarmBot phase plans live in the documentation so this README can stay focused on the product and getting started.
