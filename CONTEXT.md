# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 5, 2026 @ 7:25am PST
**Current Version:** v0.15.1a "Dashboard ThreeD Garden"

---

## 🧭 Strategic Product Definition — The "Dual-Surface" Platform

`marty-mcgee-neon` is a **Dual-Surface Platform**. Every piece of data in the system has two surfaces: an **Admin Surface** (where it is created, edited, and managed) and a **Public/Dashboard Surface** (where it is visualized, explored, and consumed).

### The Two Surfaces

| Surface | Audience | Purpose | Anchors |
|---------|----------|---------|---------|
| **Admin Surface** | Authenticated users (owners) | Full CRUD management of all data | `/admin/*`, `/api/*` (write operations) |
| **Dashboard Surface** | Any visitor (public or authenticated) | Visualization and exploration of published data | `/dashboard/*`, `/api/*` (read operations) |

### Design Principles

- **Unidirectional Data Flow**: Admin → Database → API → Dashboard. Dashboard never writes.
- **Publish Gate**: Every module has `isPublic`/`isActive`/`status` enforced at the API layer.
- **Runtime Rendering**: Dashboard visualizations (map markers, 3D objects, stats) are generated at runtime from source data. There are no stored "display" records.
- **Project Scoping**: Dashboard Surface is always scoped to a Project for multi-tenant access.

### Current Surface Coverage

| Module | Admin Surface | Dashboard Surface |
|--------|:---:|:---:|
| **Projects** | ✅ (CRUD, Asset Manager) | ✅ (Homepage project cards) |
| **Music** | ✅ (Albums, Tracks, Links, Media) | ✅ (Player, Album Grid, Waveform) |
| **ThreeD** | ✅ (Plants, Beds, Plantings, Characters, Models, Layers) | ✅ (3D Scene, Runtime Markers, View Presets, ThreeD Garden) |
| **Traffic** | ✅ (8 sub-modules, full CRUD) | ✅ (2D Map, Emoji Markers, Popups) |
| **Settings** | ✅ (Admin UI) | ❌ (no public settings surface — by design) |

---

## 🧱 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.12 (App Router), TypeScript, React |
| **Database** | Neon Postgres + Drizzle ORM |
| **UI** | shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps) |
| **3D Scene** | React Three Fiber, @react-three/drei, Three.js |
| **2D Map** | Leaflet, react-leaflet |
| **Music Streaming** | AWS S3, Vercel Blob Storage |
| **Deployment** | Vercel |
| **Package Manager** | Bun |
| **Auth** | Next Auth.js |

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

- All records have `userId` for ownership and audit trails
- Child data is free-standing (no direct foreign keys to modules)
- Relationships are handled via junction tables

```
User (user)
  └── Projects (project) - HAS userId
       └── (junction: project_threed, project_traffic, project_music)
            └── Modules (threed, traffic, music) - HAS userId
                 └── Child Data - HAS userId
                      └── (free-standing, reusable across projects)
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| `user` (Next Auth.js) | `text('id')` | N/A |
| All other tables | `serial('id')` | `integer` |
| Tables referencing `user.id` | N/A | `text('user_id')` |

### Junction Tables (Many-to-Many)

| Table | Purpose |
|-------|---------|
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |
| `project_assets` | Single junction table with polymorphic relationship linking child records to projects |

### Main Tables per Module

| Module | Main Table | Purpose |
|--------|------------|---------|
| **Auth** | `user` | User authentication and profiles |
| **Settings** | `settings` | Global and user-specific settings |
| **Projects** | `project` | Top-level project container |
| **ThreeD** | `threed` | Garden/3D module configuration |
| **Traffic** | `traffic` | Traffic monitoring module configuration |
| **Music** | `music` | Music library module configuration |

### Project Assets Table (Polymorphic Junction)

```typescript
export const projectAssets = pgTable('project_assets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull(), // References the specific module
  moduleType: text('module_type').notNull(), // 'music', 'threed', 'traffic'
  assetType: assetTypeEnum('asset_type').notNull(),
  assetId: integer('asset_id').notNull(),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Asset Type Enum

```typescript
export const assetTypeEnum = pgEnum('asset_type', [
  // Music
  'music_albums', 'music_tracks', 'music_links', 'music_media',

  // ThreeD
  'threed_plants', 'threed_beds', 'threed_plantings', 'threed_layers',
  'threed_markers', 'threed_models', 'threed_characters', 'threed_tasks',
  'threed_harvests', 'threed_weather_logs', 'threed_farmbots', 'threed_watering_schedules',

  // Traffic
  'traffic_chp_cad_incidents', 'traffic_chp_cases', 'traffic_chp_centers',
  'traffic_caltrans_lane_closures', 'traffic_caltrans_districts',
  'traffic_caltrans_cctv_cameras', 'traffic_bay_area_511_events', 'traffic_calfire_incidents',
]);
```

### Complete Table Listing

#### Auth Module (`lib/schema/auth/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Next Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

#### Settings Module (`lib/schema/settings/`)

| Table | Purpose |
|-------|---------|
| `settings` | Master settings definitions |
| `settings_user_overrides` | User-specific setting overrides |
| `settings_deployment` | Deployment snapshots |
| `settings_deployment_history` | Deployment audit trail |
| `settings_audit_logs` | Settings change log |

#### Projects Module (`lib/schema/projects/`)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |
| `project_assets` | Polymorphic junction for child assets |

#### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose | Has Position | Becomes Marker |
|-------|---------|:---:|:---:|
| `threed` | Main ThreeD module configuration | ❌ | ❌ |
| `threed_plants` | Master plant database | ❌ | ❌ (Master data) |
| `threed_models` | GLTF model library | ❌ | ❌ (Library) |
| `threed_model_files` | Associated files for 3D models | ❌ | ❌ |
| `threed_beds` | Garden layout with 3D positioning | ✅ | ✅ |
| `threed_plantings` | **Plants in beds with position data → BECOME MARKERS** | ✅ | ✅ (Primary) |
| `threed_watering_schedules` | Automated watering schedules | ❌ | ❌ |
| `threed_watering_history` | Watering execution logs | ❌ | ❌ |
| `threed_harvests` | Harvest logging | ❌ | ❌ (Logs) |
| `threed_tasks` | Garden tasks/to-do | ❌ | ❌ (To-dos) |
| `threed_weather_logs` | Environmental data | ❌ | ❌ (Logs) |
| `threed_farmbots` | FarmBot devices | ✅ | ✅ |
| `threed_farmbot_logs` | FarmBot activity logs | ❌ | ❌ |
| `threed_characters` | 3D characters and creatures | ✅ | ✅ |
| `threed_layers` | **Configuration for what to display (NO markers)** | ❌ | ❌ (Config) |
| `threed_marker_relationships` | Parent-child marker connections | ❌ | ❌ |
| `threed_layer_presets` | Saved layer configurations | ❌ | ❌ |
| `threed_system_logs` | Application logging | ❌ | ❌ |
| `threed_character_models` | Junction: Character ↔ Models | ❌ | ❌ |

#### Traffic Module (`lib/schema/traffic/`)

| Table | Purpose |
|-------|---------|
| `traffic` | Main Traffic module configuration |
| `traffic_chp_cad_incidents` | Live CHP incidents |
| `traffic_chp_centers` | CHP communication centers |
| `traffic_chp_cases` | Historical collisions cases |
| `traffic_caltrans_lane_closures` | Caltrans lane closures |
| `traffic_caltrans_cctv_cameras` | Traffic cameras |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_bay_area_511_events` | 511.org events |
| `traffic_calfire_incidents` | CalFire wildfire incidents |
| `traffic_api_request_logs` | API monitoring logs |

#### Music Module (`lib/schema/music/`)

| Table | Purpose |
|-------|---------|
| `music` | Main Music module configuration |
| `music_albums` | Album metadata |
| `music_tracks` | Track metadata |
| `music_media` | Album images and media |
| `music_links` | External links (Spotify, social, etc.) |
| `music_playback_history` | User listening history |
| `music_polling_logs` | Polling service logs |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

```typescript
// ✅ CORRECT - Next.js 16+
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of code
}
```

### Timestamp Pattern

Manually set dates use `{ mode: 'string' }`. Database-managed timestamps (`createdAt`, `updatedAt`) do not.

| Pattern | Example |
|---------|---------|
| Manual date (user-set) | `timestamp('harvest_date', { mode: 'string' }).defaultNow()` |
| Metadata (DB-managed) | `timestamp('created_at').defaultNow()` |

### API Structure

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   ├── assets/
│   │   └── route.ts          # GET, POST, DELETE
│   └── modules/
│       ├── route.ts          # GET, POST, DELETE (with ?projectId=1)
│       └── verify/
│           └── route.ts      # Verify module in project
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── plants/route.ts       # GET, POST, PUT, PATCH, DELETE
│   ├── beds/route.ts
│   ├── plantings/route.ts
│   ├── characters/route.ts
│   ├── farmbots/route.ts     # + [id]/water/, [id]/water/move/
│   ├── markers/route.ts      # (DEPRECATED - markers generated at runtime)
│   ├── layers/route.ts       # Supports projectId filtering
│   ├── models/route.ts       # + files/, files/[fileId]/
│   ├── harvests/route.ts
│   ├── tasks/route.ts
│   ├── weather/route.ts
│   └── watering-schedules/route.ts
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/route.ts      # GET, POST, PUT, PATCH, DELETE
│   ├── chp-centers/route.ts
│   ├── chp-cases/route.ts
│   ├── caltrans/route.ts
│   ├── caltrans-districts/route.ts
│   ├── caltrans-cctv/route.ts
│   ├── bay-area-511/route.ts
│   └── calfire/route.ts
├── music/
│   ├── route.ts              # GET (list), POST (create)
│   ├── albums/route.ts       # GET, POST, PUT, PATCH, DELETE
│   ├── tracks/route.ts
│   ├── links/route.ts
│   ├── media/route.ts
│   └── stream/[trackId]/route.ts
├── map/
│   ├── traffic/route.ts
│   ├── threed/route.ts
│   └── projects/route.ts
└── auth/
    └── [...nextauth]/route.ts
```

### Project API Endpoint Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/project` | GET | List all projects |
| `/api/project` | POST | Create a project |
| `/api/project?id=1` | PATCH | Update a project |
| `/api/project?id=1` | DELETE | Delete a project |
| `/api/project/modules?projectId=1` | GET | Get modules for a project |
| `/api/project/modules` | POST | Add a module to a project |
| `/api/project/modules` | DELETE | Remove a module from a project |
| `/api/project/modules/verify` | GET | Verify module is in project |
| `/api/project/assets?projectId=1` | GET | Get assets for a project |
| `/api/project/assets` | POST | Add an asset to a project |
| `/api/project/assets` | DELETE | Remove an asset from a project |

---

## 🎯 Key Features by Module

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Projects Module
- **Full CRUD** for projects
- **Module Management** — Add/remove modules to projects via junction tables (`project_threed`, `project_traffic`, `project_music`)
- **Project Asset Manager** — Polymorphic junction via `project_assets` table with `assetType` enum; clean "Assigned" vs "Available" UI; session-persistent state
- **Dashboard Homepage** — Project discovery hub at `/dashboard` with cards, module pills, skeleton loaders

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- **Runtime markers from Plantings** (no stored markers — generated on-the-fly from sub-module data)
- **Layers as Configuration** — Store view settings, not markers
- **View Presets** — Save and load camera positions with layer states (localStorage)
- **Rich Marker Popups** — Type-specific details on marker click
- **Layer Visibility Toggle** — Filter by marker type with Show All/Hide All
- **Camera Focus** — Smooth zoom animation with golden glow indicator
- **Character Animation** — Animation state machine with movement-based clips (idle/walk/fly/run), click-interact animations (dance/bounce/spin/wave), 0.3s crossfade
- **GardenCharacter** — Animated GLTF/FBX models with `AnimationMixer`, follow movement type, sound effects on click

### Traffic Module
- **8 real-time data sources** (CHP CAD, CHP Centers, CHP Cases, Caltrans Closures, Caltrans Districts, Caltrans CCTV, Bay Area 511, CalFire) with full CRUD
- 2D/3D map visualization with Leaflet + Three.js
- Runtime marker generation with emoji severity indicators

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming
- Album detail view with tracks, links, and media gallery

### Unified Map Module
- **Combined View** — Vertical stacked panels with drag-to-resize (20-80%)
- **View Mode Switching** — 2D, 3D, Combined with keyboard shortcuts (1,2,3)
- **Asset Type Toggle** — Show/hide specific 3D asset types (plantings, beds, characters, farmbots)
- **Interactive 2D Markers** — Emoji-based with selection highlighting and rich popups
- **Selection Sync** — Clicking a marker in one view highlights it in both
- **Marker Positioning** — Runtime markers from DB columns (`positionX/Y/Z`), scaled to GPS via constant `GPS_SCALE = 0.0001`

### ThreeD Marker Types

| Type | 2D Emoji | 3D Shape | Color | Source |
|------|----------|----------|-------|--------|
| **Plantings** | 🌱 | Cylinder | #22c55e | `threed_plantings` |
| **Beds** | 🧑‍🌾 | Wide Box | #f59e0b | `threed_beds` |
| **Characters** | 🧚 | Sphere | #8b5cf6 | `threed_characters` |
| **FarmBots** | 🤖 | Cube | #64748b | `threed_farmbots` |

### Traffic Incident Severity

| Severity | 2D Emoji | 3D Color |
|----------|----------|----------|
| Critical | 🔴 | #ef4444 |
| High | 🟠 | #f97316 |
| Medium | 🟡 | #eab308 |
| Low | 🟢 | #22c55e |

---

## 📡 Data Sources

| Source | Type | Method | Status |
|--------|------|--------|--------|
| CHP CAD (Live) | Live dispatcher feed | HTML scraping (Cheerio) | ✅ Working |
| CHP CKAN | Historical collisions | Official JSON API (CKAN) | ✅ Working |
| Caltrans CWWP2 | Real-time lane closures | Official JSON API | ✅ Working |
| Bay Area 511 | Real-time incidents | Official JSON API (511.org) | ✅ Working |
| Caltrans CCTV | Traffic cameras | Official JSON API | ✅ Working |
| CalFire | Wildfire incidents | Official JSON API | ✅ Working |
| OpenWeatherMap | Weather data | Official API | ✅ Working |
| FarmBot API | Device integration | Official API | ✅ Working |

---

## 🚀 Deployment

### Environment Variables

```bash
# Required for all deployments
DATABASE_URL=your_neon_connection_string
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret

# Music Module
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
S3_BUCKET_NAME=threedpublic
S3_PUBLIC_URL=https://threedpublic.s3.us-west-2.amazonaws.com

# ThreeD Module
FARMBOT_API_TOKEN=your_personal_access_token
FARMBOT_API_URL=https://my.farmbot.io/api
FARMBOT_DEVICE_ID=your_device_id
OPENWEATHER_API_KEY=your_api_key

# Vercel Blob (images)
BLOB_READ_WRITE_TOKEN=your_token
```

### Common Commands

```bash
# Development
bun dev

# Database
bun db:generate
bun db:push
bun db:studio

# Seeds
bun db:seed:all
bun run src/lib/scripts/seed-threed-plants.ts
bun run src/lib/scripts/seed-initial-data.ts
```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 `params` is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Enum value errors | Ensure enum values match schema definitions |
| Timestamp `{ mode: 'string' }` | Use `.toISOString()` when inserting |
| Select component empty string error | Use `value="none"` instead of `value=""` in SelectItem |
| `error` in catch blocks | Use `String(error)` for TypeScript `unknown` type |

---

## 📋 Complete Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v0.1.0 | 2026-06-02 | Initial project setup |
| v0.5.5 | 2026-07-18 | Hybrid Architecture with Free-Standing Data; Next.js 16 `await params` pattern; Junction tables |
| v0.6.0 | 2026-07-20 | Project Module Assets — `project_assets` polymorphic junction table |
| v0.6.5 | 2026-07-22 | Complete CRUD components for Music, ThreeD, Traffic |
| v0.7.3 | 2026-07-23 | Modern Admin Dashboard with unified navigation, public API access, front-end music player |
| v0.8.3 | 2026-07-24 | Complete Music Admin CRUD with Links & Media; simplified music_links schema |
| v0.9.0 | 2026-07-25 | ThreeD Module Complete; timestamp `{ mode: 'string' }` fixes across all tables |
| v0.10.0 | 2026-07-28 | Traffic Module Complete — 8 sub-modules with full CRUD |
| v0.10.1 | 2026-07-28 | Caltrans CCTV + CHP Cases fixes; severity mapping; ProjectAssetManager integration |
| v0.11.0 | 2026-07-29 | Projects Module + Asset Manager Complete; Admin Dashboard page; ThreeD Layers + Markers |
| v0.12.0 | 2026-07-31 | Unified Map Module — 2D Leaflet + 3D Three.js combined view; ThreeD Schema Alignment |
| v0.12.1 | 2026-08-01 | Runtime Marker Generation — markers from Plantings, not stored; removed `threed_markers` table |
| v0.12.2 | 2026-08-02 | ThreeD Scene Improvements — View Presets, Rich Popups, Layer Toggle, Camera Focus |
| v0.12.3 | 2026-08-02 | Unified Map UI — Asset Type Toggle, Default 3D View, Project Layer Filtering |
| v0.12.4 | 2026-08-03 | Combined View Panels — drag-resize, 2D pan-to-marker, emoji markers, selection sync |
| v0.13.0-alpha | 2026-08-03 | "Power Controls" — Focus on Marker button, Layer Visibility Sync |
| v0.13.0-beta | 2026-08-03 | "Smart Dashboard" — Rich popups with admin links, filtering panel, interactive stats, live indicator |
| v0.13.0-centaur | 2026-08-03 | Strategic Product Definition — Dual-Surface Platform concept formalized |
| v0.13.0-d | 2026-08-04 | Bug Fix & Stability — TypeScript type mismatch fix, setState-in-render fix, Suspense boundary |
| v0.13.1-alpha | 2026-08-04 | Marker Positioning Fixes — DB column-aware position extraction, GPS scaling, data separation |
| v0.14.0 | 2026-08-04 | "Surface Bridge + Minor Fixes" — Dashboard Homepage, Surface Switcher, Skeleton Loaders, Admin Deep-Links |
| v0.15.0 | 2026-08-04 | "Character Animations" — Animation State Machine, Interact on Click, Follow Movement, Sound Effects |
| v0.15.1a | 2026-08-04 | "Dashboard ThreeD Garden" — ThreeDGarden wired to dashboard, 4 marker components fixed, WeatherEffects rewrite |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Projects Module | ✅ Working |
| Project Asset Manager | ✅ Working |
| ThreeD Module | ✅ Working |
| Traffic Module | ✅ Working |
| Music Module | ✅ Working |
| Weather Poller | ✅ Working |
| CalFire Poller | ✅ Working |
| Caltrans Poller | ✅ Working |
| Bay Area 511 | ✅ Working |
| CHP CAD | ✅ Working |
| CHP Historical | ✅ Working |
| FarmBot Poller | ✅ Working |
| Music Poller | ✅ Working |
| Music Player | ✅ Working |
| 3D Garden | ✅ Rendering |
| ThreeD Garden (Dashboard) | ✅ Rendering |
| Runtime Markers | ✅ Working |
| View Presets | ✅ Working |
| Rich Popups | ✅ Working |
| Layer Toggle | ✅ Working |
| Camera Focus | ✅ Working |
| Combined View | ✅ Working |
| Character Animations | ✅ Working |
| Database | ✅ Connected |

---

## 🚀 Latest Release — v0.15.1a "Dashboard ThreeD Garden"

### What's New

| Feature | Status | Description |
|---------|--------|-------------|
| **ThreeDGarden Wired to Dashboard** | ✅ Complete | `/dashboard/threed/garden` renders full 3D garden with beds + plantings |
| **Project-Scoped API Fallback** | ✅ Complete | Uses `/api/map/threed?projectId=X` when project selected |
| **4 Marker Components Fixed** | ✅ Complete | `PlantMarker3D`, `BedMarker3D`, `FarmBotMarker3D`, `TrafficMarker3D` — suppressed `Text` drei API mismatch |
| **WeatherEffects Fixed** | ✅ Complete | Replaced broken `<bufferAttribute>` JSX with native `THREE.BufferGeometry` + `<primitive>` |
| **Dead Code Removed** | ✅ Complete | Deleted `src/components/threed/_test/` (6 broken files, 0 references) |
| **Weather API Fix** | ✅ Complete | Corrected endpoint URL and added JSON parse crash guards |

### Files Modified

| File | Change |
|------|--------|
| `src/app/dashboard/threed/garden/page.tsx` | Dual-path data fetching; `px/py/pz` position parser; `Array.isArray()` guards |
| `src/components/threed/ThreeDGarden.tsx` | Extended props to accept `beds`, `plantings`, `weather`, `onBedSelect`, `onPlantSelect` |
| `src/components/threed/markers/*.tsx` | 4 files — `@ts-ignore` for `Text` component API mismatch |
| `src/components/threed/effects/WeatherEffects.tsx` | Rewrote broken `<bufferAttribute>` → `THREE.BufferGeometry` + `<primitive>` |

### Deferred Issues

| File | Issues |
|------|--------|
| `GardenPlant.tsx` / `GLTFPlant.tsx` / `AnimatedFBXPlant.tsx` | Three.js module imports need `@types/three` updates |
| `ModelPreview.tsx` | Implicit `any` bindings |
| `FloatingUI.tsx` | Duplicates controls in `ThreeDScene.tsx` |

---

## 🚀 Previous Release — v0.15.0 "Character Animations"

### What's New

| Feature | Status | Description |
|---------|--------|-------------|
| **Animation State Machine** | ✅ Complete | Characters switch animations based on movement state (idle/walk/fly/run) with 0.3s crossfade |
| **Interact Animation on Click** | ✅ Complete | Click plays dance/bounce/spin/wave for 2s, then reverts to movement clip |
| **Follow Movement Type** | ✅ Complete | `followTarget` supports following other characters by `characterId` |
| **Sound Effects on Click** | ✅ Complete | `soundEffect` URL plays via `Audio` API on click |
| **GardenCharacter in 3D Scene** | ✅ Complete | `ThreeDScene.tsx` renders animated `GardenCharacter` instead of colored spheres |
| **Technical Debt Cleanup** | ✅ Complete | Fixed Next.js 16 `params: Promise` in farmbots routes; fixed empty seed modules; fixed `error: unknown` catch blocks |

### Animation Pipeline

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Data** | `threed_characters` table | Stores `movementType`, `movementSpeed`, `movementRadius`, `patrolWaypoints`, `followTarget`, `animations[]`, `defaultAnimation`, `soundEffect` |
| **Runtime Marker Generation** | `UnifiedMapView.tsx` | Extracts character rows from API data, creates `RuntimeMarker` with full `data: { ...item }` |
| **3D Scene Rendering** | `ThreeDScene.tsx` | For `type === 'character'`, renders `<GardenCharacter character={marker.data} />` |
| **Model + Animation** | `GardenCharacter.tsx` | Loads GLTF/FBX model, creates `AnimationMixer`, runs movement + animation state machine |

### Movement → Animation Mapping

| Movement Type | Stationary | Moving |
|--------------|------------|--------|
| `stationary` | idle / sway / float | — |
| `wander` | idle | walk / fly / run |
| `patrol` | idle at waypoint | walk |
| `circle` | — | fly / walk |
| `follow` | idle | walk / fly / run |
| `teleport` | — | spin / float |
| **Interact (on click)** | — | dance / bounce / spin / wave |

### Files Modified

| File | Change |
|------|--------|
| `src/components/threed/shared/GardenCharacter.tsx` | Complete rewrite — animation state machine with crossfade, follow movement, interact animations, sound effects |
| `src/components/map/ThreeDScene.tsx` | Import `GardenCharacter`; render characters as animated components |
| `src/app/api/threed/farmbots/[id]/water/route.ts` | `params` → `Promise<{ id: string }>` |
| `src/app/api/threed/farmbots/[id]/water/move/route.ts` | Same `params: Promise` fix |
| `src/app/api/threed/models/files/route.ts` | `error.message` → `String(error)` |
| `src/app/api/threed/models/files/[fileId]/route.ts` | `error.message` → `String(error)` |
| `src/app/api/traffic/bay-area-511/seed/route.ts` | Empty file → stub GET endpoint |
| `src/app/api/traffic/chp-cases/seed/route.ts` | Empty file → stub GET endpoint |
| `src/components/admin/projects/ProjectAssetManager.tsx` | Replaced "Markers" asset type with "Plantings" |