# marty-mcgee-neon (threed-garden-neon)

A **React + React Three Fiber** application for building and exploring interactive 3D gardens, live traffic data, and a music library — backed by **Neon Postgres** and **Drizzle ORM**.

This is a **Dual-Surface Platform**:

- **Admin Surface** (`/admin/*`) — create, edit, and manage your data.
- **Dashboard Surface** (`/dashboard/*`) — explore, visualize, and interact with published data.

> **Current production version:** `v0.18.0 "ThreeD FarmBot Integration — Phase 1"`

## Documentation

Start with the [Documentation Hub](docs/README.md) for audience-specific guides:

- [Human user guides](docs/users/GETTING_STARTED.md)
- [Developer architecture and operations](docs/developers/ARCHITECTURE.md)
- [Coding-agent workflow and safety](docs/agents/README.md)
- [Confirmed production releases](docs/releases/README.md)

---

## Core technologies

| Technology | Why this app uses it |
|------------|----------------------|
| **Neon: Postgres** | A serverless Postgres database that scales to zero and pairs perfectly with Vercel — the source of truth for all module data. |
| **Drizzle ORM** | A lightweight, type-safe TypeScript ORM on top of `pg`. It makes the schema (plants, beds, characters, traffic, music, …) explicit and gives compile-time safety for queries. |
| **React 19** | The component model that powers the entire platform — from admin CRUD forms to the 3D scene. |
| **Next.js 16** | The full-stack React framework providing App Router pages, server components, and API routes. Next Auth.js plugs in here for authentication. |
| **Three.js** | The underlying WebGL engine that renders the 3D garden scene. |
| **React Three Fiber (R3F)** | A declarative React renderer for Three.js — this app writes its 3D scene as regular React components. |
| **@react-three/drei** | A collection of prebuilt R3F/Three.js helpers and components (camera controls, HTML overlays, environments, gizmos) that speed up scene development. |
| **@react-three/rapier (Physics)** | A physics engine binding that exposes Rapier as R3F components — used for gravity, rigid bodies, and collision boundaries. |
| **ecctrl (Character Interactions)** | A physics-based character controller built on Rapier — gives characters WASD movement, running, jumping, and collisions. |
| **Leaflet / react-leaflet (2D Maps)** | Renders the 2D map views (traffic incidents, marker clusters, popups) alongside the 3D scene. |
| **Tailwind CSS + shadcn/ui** | Styling and accessible UI primitives (buttons, cards, dialogs, tables, toasts) used across the Admin and Dashboard surfaces. |

The heart of the app is the **ThreeD Garden**, built as a declarative React Three Fiber scene:

- Components like `BedMarker3D`, `PlantMarker3D`, `FarmBotMarker3D`, and `ModelMarker3D` render garden objects at runtime.
- `EcctrlCharacter` and `GardenCharacter` render animated, interactive 3D characters.
- Physics, shadows, and camera controls are all R3F/Three.js.

---

## What it does

| Module | Admin (manage) | Dashboard (explore) |
|--------|:---:|:---:|
| **Projects** | ✅ Full CRUD + Asset Manager | ✅ Homepage project cards |
| **ThreeD Garden** | ✅ Plants, Beds, Plantings, Characters, Models, Layers | ✅ Interactive 3D scene with physics-based characters |
| **Traffic** | ✅ 8 sub-modules, full CRUD | ✅ 2D map with emoji markers & popups |
| **Music** | ✅ Albums, Tracks, Links, Media | ✅ Player, album grid, waveform visualizer |
| **Settings** | ✅ Admin UI | ❌ (by design) |

### ThreeD Garden highlights

- **Runtime marker generation** — beds, plantings, characters, farmbots, and models are generated at runtime from source data (no stored "display" records).
- **Physics-based characters** — powered by `@react-three/rapier` + `ecctrl`. Movable characters can be "taken control of" with `WASD`, run, jump, and collide with the world.
- **Camera modes** — Follow, Top-Down, First-Person, Orbit, and Stationary.
- **Real model files** — characters load GLB/GLTF/FBX/OBJ files (hosted on S3 or Vercel Blob) as their 3D bodies.
- **FarmBot connection foundation** — encrypted per-device credentials, verified REST/MQTT identity, peripheral discovery and Water assignment, MQTT readiness diagnostics, and animation-only FarmBot action targeting. Physical commands remain disabled.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (or npm/yarn/pnpm)
- A [Neon Postgres](https://neon.tech) database

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if a template is present, otherwise create .env manually
```

At minimum you need:

```dotenv
DATABASE_URL=postgres://user:password@host/db
NEXTAUTH_URL=http://localhost:4444
NEXTAUTH_SECRET=<generated-secret>
```

Generate a secret with:

```bash
openssl rand -base64 32
```

### 3. Push the database schema

```bash
bun db:push
```

### 4. Start the development server

```bash
bun dev
```

Open [http://localhost:4444](http://localhost:4444) in your browser.

---

## Drizzle ORM + Neon Postgres

The app uses **Drizzle ORM** for type-safe database operations against **Neon Postgres**, with a **hybrid ownership model**:

- Every record has a `userId` for ownership and audit trails.
- Child data is free-standing (no direct foreign keys to modules).
- Relationships are handled via junction tables (`project_threed`, `project_traffic`, `project_music`, and a polymorphic `project_assets` table).

### Schema scripts

| Command | Description |
|---------|-------------|
| `bun db:push` | Push the current schema to the database |
| `bun db:generate` | Generate migration files from the schema |
| `bun db:studio` | Open Drizzle Studio (visual DB browser) |

Schemas are co-located under `src/lib/schema/` (`auth`, `music`, `project`, `settings`, `threed`, `traffic`).

---

## Architecture

Data flows in one direction:

```
Admin → Database → API → Dashboard
```

The Dashboard primarily visualizes published data at runtime. Authenticated ThreeD world actions are an intentional write path: supported results persist only after their one-shot animation completes.

```
API (/api/map/threed)
  → position normalization
  → UnifiedMapView (runtime marker generation)
  → ThreeDScene (React Three Fiber 3D rendering)
        ├── BedMarker3D
        ├── PlantMarker3D
        ├── FarmBotMarker3D
        ├── ModelMarker3D
        └── EcctrlCharacter / GardenCharacter
```

---

## ThreeD characters

Characters are driven by their database record:

- `isMovable` — when `true`, the character uses the physics-based `EcctrlCharacter` (WASD control, collisions, camera follow).
- `model_id` — points to a `threed_models` record whose `filePath` is a publicly-hosted **GLB/GLTF/FBX/OBJ** file rendered as the character's 3D body.
- `movementType` / `movementPattern` / `movementRadius` — further shape character behavior.

**To add a test character:**

1. Upload a GLB (or FBX/OBJ) model via `/admin/threed/models`.
2. Create a character that references that model via its `model_id`.
3. Mark it `isMovable = true` if you want physics + WASD control.
4. Assign the character to your project via the `project_assets` junction.

---

## Environment variables

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXTAUTH_URL` | Base URL for auth |
| `NEXTAUTH_SECRET` | Auth session secret |
| `AWS_ACCESS_KEY_ID` | AWS S3 (music streaming) |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 (music streaming) |
| `AWS_REGION` | AWS S3 region |
| `S3_BUCKET_NAME` | S3 bucket for audio |
| `S3_PUBLIC_URL` | Public base URL for S3 objects |
| `FARMBOT_CREDENTIAL_KEY_VERSION` | Current positive FarmBot credential-encryption key version |
| `FARMBOT_CREDENTIAL_KEY_V<n>` | Retained 32-byte base64 encryption key for version `<n>`; server-only |
| `OPENWEATHER_API_KEY` | OpenWeatherMap weather data |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage (images/models) |

---

## Project structure

```
src/
├── app/
│   ├── admin/          # Admin Surface (CRUD)
│   ├── dashboard/      # Dashboard Surface (visualization)
│   └── api/            # API routes (read + write)
├── components/
│   ├── map/            # ThreeDScene (R3F) + UnifiedMapView
│   ├── threed/         # 3D markers, effects, layers, shared characters
│   ├── music/          # Music player & UI
│   ├── traffic/        # Traffic dashboard & map
│   └── ui/             # shadcn/ui components
└── lib/
    ├── schema/         # Drizzle ORM schemas (auth, music, project, settings, threed, traffic)
    ├── db/             # Database client
    ├── services/       # Data-fetching & domain logic
    └── types/          # Shared TypeScript types
```

---

## Useful commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start the dev server on port 4444 |
| `bun build` | Production build |
| `bun start` | Start production server |
| `bun db:push` | Push schema to the database |
| `bun db:generate` | Generate migrations |
| `bun db:studio` | Open Drizzle Studio |

---

## Learn more

- [React](https://react.dev)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Drei](https://github.com/pmndrs/drei)
- [@react-three/rapier](https://github.com/pmndrs/react-three-rapier)
- [ecctrl](https://github.com/pmndrs/ecctrl)
- [Drizzle ORM](https://orm.drizzle.team)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

## License

Private project — see `package.json` and the repository settings for licensing details.
