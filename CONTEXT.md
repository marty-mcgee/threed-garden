# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 7, 2026 @ 12:30pm PST
**Current Version:** v0.15.12 "Clean UX — No Floating Labels, No Right-Click Zoom, Group-Level Hover"

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

### Complete Table Listing

#### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose | Has Position | Becomes Marker |
|-------|---------|:---:|:---:|
| `threed` | Main ThreeD module configuration | ❌ | ❌ |
| `threed_plants` | Master plant database | ❌ | ❌ (Master data) |
| `threed_models` | GLTF model library | ❌ | ❌ (Library) |
| `threed_beds` | Garden layout with 3D positioning | ✅ | ✅ |
| `threed_plantings` | **Plants in beds with position data → BECOME MARKERS** | ✅ | ✅ (Primary) |
| `threed_characters` | 3D characters and creatures | ✅ | ✅ |
| `threed_farmbots` | FarmBot devices | ✅ | ✅ |

#### Traffic Module (`lib/schema/traffic/`)

| Table | Purpose |
|-------|---------|
| `traffic_chp_cad_incidents` | Live CHP incidents |
| `traffic_chp_centers` | CHP communication centers |
| `traffic_chp_cases` | Historical collisions cases |
| `traffic_caltrans_lane_closures` | Caltrans lane closures |
| `traffic_caltrans_cctv_cameras` | Traffic cameras |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_bay_area_511_events` | 511.org events |
| `traffic_calfire_incidents` | CalFire wildfire incidents |

#### Music Module (`lib/schema/music/`)

| Table | Purpose |
|-------|---------|
| `music` | Main Music module configuration |
| `music_albums` | Album metadata |
| `music_tracks` | Track metadata |
| `music_media` | Album images and media |
| `music_links` | External links (Spotify, social, etc.) |

---

## 🔧 API Architecture

### API Structure

```
api/
├── map/
│   ├── threed/route.ts       # GET — combined ThreeD + Traffic data with position normalization
│   ├── projects/route.ts     # List projects with map data
│   └── asset-type/route.ts   # Get assets by type
├── threed/ (CRUD)
├── traffic/ (8 sub-modules)
├── music/ (albums, tracks, links, media)
├── project/ (CRUD + assets + modules)
└── auth/
```

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

### ThreeD Marker Types

| Type | 3D Component | Source Table | Visual Features |
|------|-------------|-------------|-----------------|
| **Plantings** | `PlantMarker3D` | `threed_plantings` | Growth stage shapes, species name |
| **Beds** | `BedMarker3D` | `threed_beds` | Soil-type colored base, dimensional walls |
| **Characters** | `GardenCharacter` | `threed_characters` | GLTF/FBX model loading, animation state machine, movement |
| **FarmBots** | `FarmBotMarker3D` | `threed_farmbots` | Status-colored body, wheels, name label |

### Overlay Architecture

| Overlay | Source | When |
|---------|--------|------|
| Marker component tooltip | `BedMarker3D` / `PlantMarker3D` / `FarmBotMarker3D` | Hover only |
| DetailsCard | `map/page.tsx` (or `garden/page.tsx`) | Click only — single unified card with rich type-specific metadata |

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

## 📋 Complete Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v0.1.0 | 2026-06-02 | Initial project setup |
| v0.5.5 | 2026-07-18 | Hybrid Architecture with Free-Standing Data |
| v0.6.0 | 2026-07-20 | Project Module Assets — polymorphic junction table |
| v0.10.0 | 2026-07-28 | Traffic Module Complete — 8 sub-modules |
| v0.11.0 | 2026-07-29 | Projects Module + Asset Manager Complete |
| v0.12.0 | 2026-07-31 | Unified Map Module — 2D + 3D combined view |
| v0.12.1 | 2026-08-01 | Runtime Marker Generation |
| v0.13.0-beta | 2026-08-03 | Smart Dashboard — Rich popups, filters, stats |
| v0.14.0 | 2026-08-04 | Surface Bridge — Dashboard Homepage |
| v0.15.0 | 2026-08-04 | Character Animations — State Machine, Follow, Sound |
| v0.15.2-alpha | 2026-08-05 | Traffic Module + 2D Map Improvements |
| v0.15.3 | 2026-08-06 | 100% Width + Rich Markers + UX + Page Unification |
| v0.15.4 | 2026-08-06 | Simplified Static 3D Markers — removed idle animations |
| v0.15.5 | 2026-08-06 | Unified Marker Overlays with Rich Data |
| v0.15.6 | 2026-08-06 | App Layout CSS tightened to maximum density |
| v0.15.7 | 2026-08-06 | Cleaned map page — removed stat cards, viewport-filling height, icon-only header |
| v0.15.8 | 2026-08-06 | ThreeDScene Polish — Dynamic environments, grass texture, header cleanup |
| v0.15.9 | 2026-08-06 | Minor UX improvements |
| v0.15.10 | 2026-08-07 | Shadow-friendly 3D Markers — castShadow on all FarmBot/Character meshes |
| v0.15.11 | 2026-08-07 | Shadow Camera Fix — ShadowLight component with far=5000, all markers cast shadows |
| **v0.15.12** | **2026-08-07** | **Clean UX — Removed floating name labels, right-click zoom, group-level pointer events** |

---

## 🚀 Latest Release — v0.15.12 "Clean UX — Group-Level Hover, No Floating Labels"

### What's New

| Feature | Status | Description |
|---------|--------|-------------|
| **No More Floating Name Labels** | ✅ Complete | Removed always-visible Billboard/Text and Html name labels from BedMarker3D, PlantMarker3D, GardenCharacter, and FarmBots — names appear only in the metadata info box on click |
| **Right-Click No Longer Zooms** | ✅ Complete | Removed `handleGroundRightClick` handler and `onContextMenu` from ground plane — camera stays put on right-click |
| **Group-Level Pointer Events** | ✅ Complete | Moved `onPointerOver`/`onPointerOut` from individual meshes to parent `<group>` in BedMarker3D and PlantMarker3D for cleaner hover detection |

### Files Modified in v0.15.12

| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | Removed `handleGroundRightClick`, ground plane `onContextMenu`, `onRightClick` prop; removed always-visible FarmBot Html name label; removed unused `FarmBotMarker3D` import |
| `src/components/threed/markers/BedMarker3D.tsx` | Removed Billboard+Text name label; moved hover events from bed body Box to parent `<group>` |
| `src/components/threed/markers/PlantMarker3D.tsx` | Removed Billboard+Text name label; moved hover events from stem Cylinder to parent `<group>` |
| `src/components/threed/shared/GardenCharacter.tsx` | Removed always-visible Html name label |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| ThreeD Module | ✅ Working |
| Traffic Module | ✅ Working |
| Music Module | ✅ Working |
| All Pollers | ✅ Working |
| 3D Garden | ✅ Rendering |
| Runtime Markers | ✅ Working |
| View Presets | ✅ Working |
| Unified Details Card | ✅ Working |
| Camera Focus | ✅ Working |
| Combined View | ✅ Working |
| Character Animations | ✅ Working |
| Keyboard Shortcuts | ✅ Working |
| Database | ✅ Connected |