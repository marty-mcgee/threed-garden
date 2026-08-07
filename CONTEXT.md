# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 6, 2026 @ 9:30pm PST
**Current Version:** v0.15.3 "Dashboard ThreeD Garden — 100% Width + Rich Markers + UX + Page Unification"

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
| **ThreeD** | ✅ (Plants, Beds, Plantings, Characters, Models, Layers) | ✅ (3D Scene, Runtime Markers, View Presets, Garden Explorer) |
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
  moduleId: integer('module_id').notNull(),
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
│   ├── threed/route.ts       # GET — combined ThreeD + Traffic data with position normalization
│   ├── projects/route.ts
│   └── asset-type/route.ts
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

## 🎯 ThreeD Marker Architecture (Runtime Generation)

### Data Pipeline

```
API (/api/map/threed)
  → Position normalization (string→Number, _hasPosition metadata)
  → Page (map/page.tsx, garden/page.tsx)
    → normalizePositions() second pass
    → UnifiedMapData construction
  → UnifiedMapView
    → extractPosition() — DB column fallback chain
    → extractName() — plant reference lookup
    → RuntimeMarker generation
  → ThreeDScene
    → normalizeType() — singular/plural mapping
    → activeLayers filtering
    → Rich marker components (BedMarker3D, PlantMarker3D, FarmBotMarker3D, GardenCharacter)
```

### ThreeD Marker Types — Rich Visual Components

| Type | 2D Emoji | 3D Component | Source Table | Visual Features |
|------|----------|-------------|-------------|-----------------|
| **Plantings** | 🌱 | `PlantMarker3D` | `threed_plantings` | 7 growth stage shapes, health ring, sway animation, species name, days-since-planted |
| **Beds** | 🧑‍🌾 | `BedMarker3D` | `threed_beds` | Soil-type colored base, plant occupancy dots, sun exposure badge, hover glow ring |
| **Characters** | 🧚 | `GardenCharacter` | `threed_characters` | GLTF/FBX model loading, animation state machine, movement types, emotes, interaction |
| **FarmBots** | 🤖 | `FarmBotMarker3D` | `threed_farmbots` | Status ring animation, battery bar, floating hover, device ID, last-seen time |

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
| v0.15.2-alpha | 2026-08-05 | "Traffic Module + 2D Map Improvements" — GPS column normalization, auto-refresh polling |
| **v0.15.3** | **2026-08-06** | **"Dashboard ThreeD Garden — 100% Width + Rich Markers + UX + Page Unification"** |

---

## 🚀 Latest Release — v0.15.3 "ThreeDScene in Dashboard Map and Dashboard ThreeD Garden"

### What's New

| Feature | Status | Description |
|---------|--------|-------------|
| **100% Width UI** | ✅ Complete | All 12 front-end pages converted from `max-w-7xl`/`container mx-auto` to `w-full` |
| **API Position Normalization** | ✅ Complete | `/api/map/threed` normalizes `positionX/Y/Z` and `latitude/longitude` from string→Number; adds `_hasPosition` metadata |
| **Page-Level Position Normalization** | ✅ Complete | `normalizePositions()` function in map and garden pages ensures all GPS and 3D coordinates are Number type |
| **Accurate Runtime Markers** | ✅ Complete | NaN-tolerant position extraction; 3D markers use raw DB positions (not spread); singular/plural type normalization; stable React keys |
| **Rich 3D Marker Components** | ✅ Complete | `BedMarker3D` (soil colors, dimensions, plant dots, sun badge), `PlantMarker3D` (7 growth stages, health ring, sway animation), `FarmBotMarker3D` (battery bar, status animations) |
| **3D Scene Visual Enhancements** | ✅ Complete | Fog, ACES tone mapping, hemisphere lighting, shadow-catching ground, PulseRing animation, stats overlay bar |
| **Keyboard Shortcuts** | ✅ Complete | ESC=deselect, R=reset view, G=toggle grid, F=focus selected |
| **Left-Click Ground Deselect** | ✅ Complete | Clicking empty ground deselects current marker |
| **Garden Page Unification** | ✅ Complete | `/dashboard/threed/garden` now uses same `UnifiedMapView→ThreeDScene` engine, supports all 4 marker types |

### Architecture — Single 3D Engine

```
map/page.tsx ────┐
                 ├── UnifiedMapView ── ThreeDScene ── Rich Markers
garden/page.tsx ─┘                    (fog, shadows, pulse rings,
                                       keyboard shortcuts, stats overlay)
```

### Files Modified

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | `max-w-7xl` → `w-full` |
| `src/app/page.tsx` | 8× `container mx-auto` → `w-full` |
| `src/app/dashboard/traffic/caltrans/closure/[id]/page.tsx` | 2× `max-w-7xl` → `w-full` |
| `src/components/music/MusicContent.tsx` | `container mx-auto` → `w-full` |
| `src/components/music/NowPlayingBar.tsx` | 2× `container max-w-7xl` → `w-full` |
| `src/app/admin/settings/page.tsx` | `container mx-auto` → `w-full` |
| `src/app/admin/music/tracks/[id]/page.tsx` | `container mx-auto` → `w-full` |
| `src/app/admin/threed/*/page.tsx` | 5 files: `container mx-auto` → `w-full` |
| `src/app/api/map/threed/route.ts` | Position normalization + `_hasPosition` metadata |
| `src/app/dashboard/map/page.tsx` | `normalizePositions()` pre-processing |
| `src/app/dashboard/threed/garden/page.tsx` | Complete rewrite — UnifiedMapView integration |
| `src/components/map/UnifiedMapView.tsx` | NaN-tolerant position extraction; raw positions for 3D |
| `src/components/map/ThreeDScene.tsx` | Type normalization, fog, tone mapping, hemisphere light, shadow ground, PulseRing, keyboard shortcuts, ground click deselect |
| `src/components/threed/markers/BedMarker3D.tsx` | Complete rewrite — soil colors, dimensions, plant dots, sun badge, hover ring |
| `src/components/threed/markers/PlantMarker3D.tsx` | Complete rewrite — 7 growth stages, health ring, sway, days-since-planted |
| `src/components/threed/markers/FarmBotMarker3D.tsx` | Complete rewrite — battery bar, status animations, last-seen time |

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
| Rich 3D Markers | ✅ Working |
| Runtime Markers | ✅ Working |
| View Presets | ✅ Working |
| Rich Popups | ✅ Working |
| Layer Toggle | ✅ Working |
| Camera Focus | ✅ Working |
| Combined View | ✅ Working |
| Character Animations | ✅ Working |
| Keyboard Shortcuts | ✅ Working |
| Garden Page (Unified) | ✅ Working |
| Database | ✅ Connected |