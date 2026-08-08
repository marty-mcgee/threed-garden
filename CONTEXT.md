# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 8, 2026 @ 7:15am PST
**Current Version:** v0.16.0-centaur "Polished Details Card"

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
| **v0.16.0-alpha** | **2026-08-07** | **React Three Physics — @react-three/rapier + ecctrl integration** |
| **v0.16.0-beta** | **2026-08-08** | **Keyboard Controls — WASD movement, Take/Release Control in DetailsCard** |
| **v0.16.0-centaur** | **2026-08-08** | **Polished Details Card — KvRow grid, 3D coords, improved buttons** |

---

## 🚀 Latest Release — v0.16.0-centaur "Polished Details Card"

### What's New in v0.16.0

| Feature | Status | Description |
|---------|--------|-------------|
| **@react-three/rapier Physics** | ✅ Complete | `<Physics gravity={[0, -9.81, 0]}>` with fixed ground `<RigidBody>`, gravity, collision |
| **ecctrl Character Controller** | ✅ Complete | Capsule collider character with WASD/Space/Shift keyboard input via `ref.setMovement()` |
| **Take Control / Release Control** | ✅ Complete | Two-tier interaction: click char → DetailsCard → 🎮 Take Control button → WASD active → ⏸️ Release Control |
| **KvRow Metadata Grid** | ✅ Complete | All marker metadata rendered as labeled key-value pairs (Position, Type, Speed, Movement, etc.) |
| **3D Position Coordinates** | ✅ Complete | X/Y/Z position shown for all marker types in DetailsCard |
| **Blue Selection Ring** | ✅ Complete | Controlled ecctrl character shows blue ring on ground |
| **Polished DetailsCard UX** | ✅ Complete | Consistent key-value layout, section dividers, improved button styling, "🔧 Edit in Admin" link |

### Files Created in v0.16.0

| File | Purpose |
|------|---------|
| `src/components/threed/shared/EcctrlCharacter.tsx` | ecctrl-powered character with WASD keyboard controls, physics, GLTF/FBX model loading, click-to-select, blue selection ring |

### Files Modified in v0.16.0

| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | Added `<Physics>` + ground `<RigidBody>`, `controlledCharacterId` prop threading |
| `src/components/map/UnifiedMapView.tsx` | Added `controlledCharacterId` prop |
| `src/app/dashboard/map/page.tsx` | Added `controlledCharacterId` state, `KvRow` component, redesigned `DetailsCard` with metadata grid + character controls + admin edit link |
| `package.json` | Added `@react-three/rapier` (v2.2.0), `ecctrl` (v2.0.0) |

### How to Use Ecctrl Characters

Set `movementType: 'ecctrl'` on a character record in the database. Click the character in the 3D scene → DetailsCard appears with 🎮 Take Control button → click to activate WASD movement → click ground or ✕ to deselect.

### Architecture

```
map/page.tsx
  ├── controlledCharacterId state
  ├── DetailsCard (static overlay with KvRow grid + Take/Release Control)
  └── UnifiedMapView → ThreeDScene → EcctrlCharacter(isControlled)
        └── Physics > RigidBody (ground) > Ecctrl (capsule collider + WASD)
```

### v0.16.0-centaur Changes

- Introduced `KvRow` component for consistent key-value metadata display
- Added 3D position coordinates (`X:`, `Y:`, `Z:`) for all marker types
- Redesigned character controls with clear section dividers and button styling
- Changed admin link from "📝 View Details" to "🔧 Edit in Admin" with subdued styling

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

---

## v0.16.0-alpha "React Three Physics" — Integration Complete

### Packages Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-three/rapier` | 2.2.0 | Physics engine — `<Physics>`, `<RigidBody>`, colliders, gravity |
| `ecctrl` | 2.0.0 | Character controller — `<Ecctrl>`, `<EcctrlAnimationStateController>`, physics-based movement |

### Files Modified

| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | Added `Physics`/`RigidBody` imports; wrapped scene in `<Physics gravity={[0, -9.81, 0]}>` with ground as `type="fixed"` `RigidBody`; added `EcctrlCharacter` import and routing for characters with `movementType: 'ecctrl'` |
| `package.json` | Added `@react-three/rapier` (v2.2.0) and `ecctrl` (v2.0.0) |

### Files Created

| File | Purpose |
|------|---------|
| `src/components/threed/shared/EcctrlCharacter.tsx` (343 lines) | Physics-based character controller wrapping `<Ecctrl>`. Features: capsule collider, `EcctrlAnimationStateController` with custom resolver mapping WALK/RUN/IDLE/JUMP to model animation clips, AI wandering via `setMovement` joystick API, GLTF/FBX model loading with cache, interaction (click, emotes, speech bubbles, sound), fallback shape for characters without models |

### Architecture Overview

```
<Canvas>
  <Environment />
  <lights />
  <OrbitControls />
  
  <Physics gravity={[0, -9.81, 0]}>          ← @react-three/rapier
    <RigidBody type="fixed" colliders="cuboid">  ← Ground
      <InteractiveGround />
    </RigidBody>
    
    <ThreeDMarkerComponent>                  ← Per-marker routing
      if (movementType === 'ecctrl') →
        <EcctrlCharacter />                  ← ecctrl physics character
      else →
        <GardenCharacter />                  ← legacy AI-driven character
    </ThreeDMarkerComponent>
  </Physics>
</Canvas>
```

### How to Use

Set `movementType: 'ecctrl'` on a character record in the database to route it through the physics-based `EcctrlCharacter`. Characters with other movement types (`wander`, `patrol`, `follow`, `teleport`, `stationary`) continue using the existing `GardenCharacter`.

---

## v0.16.0-beta "React Three Physics" — Delivered

### Packages Introduced
| Package | Version | Purpose |
|---------|---------|---------|
| `@react-three/rapier` | 2.2.0 | Physics engine — gravity, colliders, rigid bodies |
| `ecctrl` | 2.0.0 | Character controller — capsule collider, WASD movement, animation states |

### Files Created
- `src/components/threed/shared/EcctrlCharacter.tsx` (~270 lines) — ecctrl-powered character with keyboard controls, physics, model loading

### Files Modified
- `src/components/map/ThreeDScene.tsx` — `<Physics>` + `<RigidBody>` ground, `controlledCharacterId` threading
- `src/components/map/UnifiedMapView.tsx` — `controlledCharacterId` prop
- `src/app/dashboard/map/page.tsx` — `controlledCharacterId` state, enhanced `DetailsCard` with Take/Release Control

### Architecture
```
<Canvas>
  <Physics gravity={[0, -9.81, 0]}>
    <RigidBody type="fixed" colliders="cuboid">  ← Ground
    <EcctrlCharacter isControlled={idMatches} />  ← Player-controlled
  </Physics>
</Canvas>
```

### UX Flow
1. Click ecctrl character → `DetailsCard` appears with **🎮 Take Control**
2. Click Take Control → WASD/Space/Shift active → blue ring on character → card shows controlling status
3. Release Control / ✕ → keyboard input stops → character stationary

---
## v0.16.0-delta "Camera Follow + Marker Sync"

### Features
| Feature | Status | Description |
|---------|--------|-------------|
| **Camera Follow** | ✅ Complete | `CameraFollow` component lerps `OrbitControls.target` to controlled character via shared `MutableRefObject` — zero React state overhead |
| **Click Position Sync** | ✅ Complete | Clicking a moved ecctrl character syncs `selectedMarker.position` to current physics position before focus/zoom |
| **Movement Pattern** | ✅ Complete | `movementPattern: 'follow'` enables auto camera tracking; `stationary` keeps free-roaming camera |

### Architecture
```
EcctrlCharacter (useFrame)
  └── cameraFollowRef.current = currPos
        ↓
CameraFollow (useFrame, single lerp)
  └── controls.target.lerp(characterPos, 0.08)
```

### Files Modified
| File | Change |
|------|--------|
| `src/components/threed/shared/EcctrlCharacter.tsx` | Added `cameraFollowRef` prop, `movementPattern` field, position sync on click |
| `src/components/map/ThreeDScene.tsx` | Added `CameraFollow` + `performLerp`, threaded `cameraFollowRef` |
| `src/app/dashboard/map/page.tsx` | `handleControlChange` syncs `selectedMarker.position` on control state change |

---