# Project Context — marty-mcgee-neon

> **Purpose:** Primary repository context for developers and Codex/AI coding agents.
> Read this file before making architectural changes. Treat current repository code as the source of truth when this document and implementation disagree.

## 🤖 Codex Working Contract

1. **Inspect before editing.** Read the relevant implementation, imports, types, schema, and API routes before proposing changes.
2. **Preserve working architecture.** Prefer incremental changes over rewrites, especially in ThreeD character animation, physics, camera, selection, and DetailsCard flows.
3. **Do not guess repository APIs.** Verify database-client imports, auth conventions, schema fields, route locations, and component props from the repository.
4. **Keep animation and world state separated.** Character animation code decides *how an action is animated*. API/gameplay code decides *what world-state mutation that action causes*.
5. **One-shot actions complete before persistence.** World mutations triggered by character actions occur only after the corresponding one-shot animation reports completion.
6. **Do not require database access to reason about the app.** Prefer repository files, schema, types, routes, and tests. Never request or expose secrets.
7. **Protect stable behavior.** Existing GardenCharacter wandering, Ecctrl WASD/control, camera modes, selection, DetailsCard, and task→locomotion crossfades are regression-sensitive.
8. **Validate changes.** Run the narrowest relevant TypeScript/build/lint/test checks available after edits and report exactly what was run.
9. **Update this file for release-level architectural changes.** Keep detailed implementation chatter out of this document; use git history/issues for transient debugging notes.

## 📌 Current Checkpoint

| Item | Status |
|---|---|
| Current stable version | **v0.18.0 — ThreeD FarmBot Integration, Phase 1** |
| Current release candidate | **None designated** |
| Current development milestone | **v0.18.1 — Phase 2A MQTT worker design review** |
| Previous checkpoint | **v0.17.3 — Documentation Foundation** |
| Character FBX model loading | ✅ Working |
| External FBX animation files | ✅ Working |
| Semantic action mapping | ✅ Working |
| GardenCharacter autonomous locomotion + tasks | ✅ Working |
| EcctrlCharacter WASD locomotion + tasks | ✅ Working |
| DetailsCard character action controls | ✅ Working |
| Persistent planting action target | ✅ Working |
| Targeted Water world action | ✅ Working |
| Watering persistence after animation completion | ✅ Working |
| Pick Fruit animation | ✅ Working |
| Project-scoped harvest persistence | ✅ Released in v0.17.0 |
| Production animation asset validation | ✅ Released in v0.17.1 |
| GitHub Actions validation | ✅ Released in v0.17.1 |
| Repository TypeScript baseline | ✅ Repaired during v0.17.2 development |

## 🧠 Current Character / World-Action Architecture

```text
Base FBX Character Model
        +
External FBX Animation Files
        ↓
external animation loader / normalized clips
        ↓
semantic CharacterTaskAction / AnimationMap
        ↓
GardenCharacter OR EcctrlCharacter
        ↓
idle / walk / run locomotion
        +
one-shot actions
(watering / pickFruit / plantTree / etc.)
        ↓
animation completion callback
        ↓
optional World Action layer
        ↓
authenticated API mutation
```

### Stable separation of responsibilities

- **Animation layer:** model loading, clips, mixers, semantic action resolution, crossfades, one-shot completion, locomotion recovery.
- **Interaction layer:** marker selection, DetailsCard, Take/Release Control, action buttons, persistent action target.
- **World Action layer:** validates actor/action/target and performs an authenticated server-side mutation.
- **Database/API layer:** still evolving. Do not expand persistence casually from animation code.

### v0.16.6b supported world mutation

```text
Planting → Use as Action Target
         → Farmer → Water
         → watering animation completes
         → POST /api/threed/world-actions
         → auth + ownership validation
         → threed_watering_history
         → locomotion resumes
```

**Scope boundary:** `Pick Fruit → threed_harvests` persistence was explored after the Water workflow, but is intentionally deferred. Do not treat harvest persistence as a requirement or dependency of v0.16.6b.

### v0.16.8 world mutation — released in v0.17.0

```text
Planting → Use as Action Target
         → Farmer → Pick Fruit / Pick Fruit 2 / Pick Fruit 3
         → one-shot animation completes
         → POST /api/threed/world-actions with active project identity
         → auth + project/actor ownership + target assignment validation
         → threed_harvests (1 each)
         → project_assets association to the active ThreeD module
         → locomotion resumes
```

The harvest row and its project association are created transactionally. The server derives the plant and ThreeD module from the validated planting instead of accepting those identities from the browser.

## 🗂️ High-Value Files for Character Work

| File | Responsibility |
|---|---|
| `src/lib/utils/animation.ts` | Core semantic animation mapping/fallback logic |
| `src/lib/utils/externalCharacterAnimations.ts` | Static external FBX action manifest and animation loader |
| `src/lib/scripts/validate-static-assets.mjs` | Validates that every configured production animation exists in a clean checkout |
| `src/components/threed/shared/GardenCharacter.tsx` | Autonomous/non-controlled character locomotion and task actions |
| `src/components/threed/shared/EcctrlCharacter.tsx` | Physics/WASD character locomotion and task actions |
| `src/components/map/ThreeDScene.tsx` | 3D marker routing, physics scene, character request routing |
| `src/components/map/UnifiedMapView.tsx` | Runtime marker/data bridge into ThreeDScene |
| `src/app/dashboard/map/page.tsx` | Selection, DetailsCard, control state, action target, world-action completion handling |
| `src/app/api/threed/world-actions/route.ts` | Authenticated semantic world-action endpoint for targeted Water and Pick Fruit persistence |
| `src/lib/schema/threed/*` | ThreeD Drizzle schema; inspect before any persistence change |

---

## 🧭 Strategic Product Definition — The "Dual-Surface" Platform

`marty-mcgee-neon` is a **Dual-Surface Platform**. Every piece of data in the system has two surfaces: an **Admin Surface** (where it is created, edited, and managed) and a **Public/Dashboard Surface** (where it is visualized, explored, and consumed).

### The Two Surfaces

| Surface | Audience | Purpose | Anchors |
|---------|----------|---------|---------|
| **Admin Surface** | Authenticated users (owners) | Full CRUD management of all data | `/admin/*`, `/api/*` (write operations) |
| **Dashboard Surface** | Any visitor (public or authenticated) | Visualization and exploration of published data | `/dashboard/*`, `/api/*` (read operations) |

### Design Principles

- **Default Data Flow**: Admin → Database → API → Dashboard. Dashboard is primarily a visualization surface. Explicit authenticated interaction endpoints (for example World Actions) may perform narrowly scoped writes when the user intentionally triggers an in-world action.
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
| **Framework** | Next.js 16.3.0 (App Router), TypeScript, React |
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
├── threed/
│   ├── route.ts                # ThreeD module CRUD
│   └── world-actions/route.ts  # POST — semantic world actions; v0.16.6b supports targeted watering
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
| **v0.16.0-delta** | **2026-08-08** | **Camera Follow + Marker Sync — cursor tracking, position sync on click** |
| **v0.16.2-beta** | **2026-08-12** | **Improved Camera Modes, Marker Selection, and Character Animations** |
| **v0.16.2-centaur** | **2026-08-12** | **Minor — Character Marker Hover Titles styled to match other 3D markers** |
| **v0.16.3-alpha** | **2026-08-12** | **Character Interaction Improvements — `isMovable`-driven Ecctrl engagement + auto-disengage on different selection** |
| **v0.16.3-beta** | **2026-08-12** | **Character Model Files — join `threed_models` to characters and load GLB/FBX/OBJ as the 3D Character Marker** |
| **v0.16.3-centaur** | **2026-08-12** | **README Updates — user-friendly app intro focused on React Three Fiber, Drizzle ORM, and Neon Postgres** |
| **v0.16.4-alpha** | **2026-08-12** | **Character Models, Model Files, Model Texture Files + Supportive Media Files — Vercel Blob uploads** |
| **v0.16.4-beta** | **2026-08-12** | **Admin Surface: 3D Models CRUD Forms — full model/files/textures/media management UX** |
| **v0.16.4-centaur** | **2026-08-13** | **Minor — Character grounding (Y=0) + gravity-driven spawn lift** |
| **v0.16.5** | **2026-08-13** | **Character Animations + Actions — animation state machine + shared clip matcher** |
| **v0.16.6a** | **2026-08-16** | **External FBX character animation library + semantic task actions** |
| **v0.16.6b** | **2026-08-16** | **World Actions v2 — persistent planting target + completed Water persistence** |
| **v0.16.7** | **2026-08-16** | **Visual Action Targeting — persistent target pulse, focus controls, and refresh reconciliation** |
| **v0.16.8** | **2026-08-18** | **Project-Scoped Harvest Management — idempotent Pick Fruit persistence and expanded Harvest CRUD** |
| **v0.17.0** | **2026-08-18** | **Production release — project-scoped assets, owner-scoped Music, canonical Track imports, ThreeD/Admin UX, and accumulated v0.16.8 work** |
| **v0.17.1** | **2026-08-18** | **Production release — reproducible production animation assets and GitHub Actions validation** |
| **v0.17.2** | **2026-08-18** | **Production release — API consolidation, current-schema poller alignment, and blocking TypeScript validation** |
| **v0.17.3** | **2026-08-18** | **Production release — documentation foundation for human users, developers, and coding agents** |
| **v0.18.0** | **2026-08-19** | **Production release — ThreeD FarmBot Integration Phase 1 security, identity, configuration, readiness, and animation-only targeting** |

---

## 📚 Historical Detail — v0.16.0-centaur "Polished Details Card"

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

## v0.16.1-alpha "ThreeD Models" — Complete

### Architecture
```
API (/api/map/threed)
  └── threed_models table fetched via project_assets junction
      ↓
UnifiedMapView — models added to typesToProcess, MARKER_CONFIG
      ↓
ThreeDMarkerComponent — 'model'/'models' type → ModelMarker3D
      ↓
ModelMarker3D — GLTF/FBX loading, shadow, animation playback
```

### Files Created

| File | Purpose |
|------|---------|
| `src/components/threed/markers/ModelMarker3D.tsx` | Renders `threed_models` entries in 3D scene — GLTF/FBX loading from `filePath`, configurable scale/rotation/offset, auto-plays `defaultAnimation`, shadow casting, shared model cache, fallback box shape |

### Files Modified

| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | Added `ModelMarker3D` import + `model`/`models` type routing in `ThreeDMarkerComponent` |
| `src/components/map/UnifiedMapView.tsx` | Added `model`/`models` to `MARKER_CONFIG` and `typesToProcess` array |
| `src/app/api/map/threed/route.ts` | Added `threedModels` import + `threed_models` to typeMap so models are fetched from DB |
| `src/app/dashboard/map/page.tsx` | Added `models` to `visibleAssetTypes`, filters, `threedRaw`, active layers |

### How to Use
1. Upload a GLB/GLTF/FBX model via `/admin/threed/models`
2. Assign it to a project via `project_assets` junction
3. The model renders in the 3D scene at its assigned position with shadows and animation

### Model Display
- Standalone models use their `positionX`/`positionY`/`positionZ` from DB
- Models attached to characters (via `character.modelId`) render through `GardenCharacter`/`EcctrlCharacter`
- Models without position columns default to origin (0, 1.5, 0)

---

## v0.16.1-beta "Character Camera Views" — Implemented

### Architecture

**`CameraController`** replaces the old `CameraFollow` component with a mode-switching architecture that reads the controlled character's `movementPattern` field from the marker data.

### Camera View Modes

| `movementPattern` | Camera Behavior |
|---|---|
| `follow` | Smoothly lerps camera target toward character (previous behavior) |
| `topdown` | Camera positioned 15 units directly above character, looking straight down |
| `firstperson` | Camera at character position +0.5 offset, 1.5 units above ground, looking ahead |
| `orbit` | Camera orbits around character at 8-unit radius, 5 units high, slow rotation |
| `stationary` (default/null) | Camera stays put — free-roaming (no change) |

### How It Works

```
Character Marker (movementPattern: 'topdown')
  ↓
EcctrlCharacter writes currPos each frame → cameraFollowRef
  ↓
CameraController reads movementPattern from visibleMarkers
  ↓
switch(mode): adjusts controls.target + controls.object.position
```

### Files Changed
- `src/components/map/ThreeDScene.tsx`:
  - Replaced `CameraFollow` component with `CameraController` (supports 5 view modes)
  - `CameraController` extracts `movementPattern` from the controlled character's marker data
  - Defaults to `'stationary'` if no pattern set

---

## v0.16.1-centaur "Layout + Buttons" — Implemented

**Dashboard Layout**, **Dashboard Page**, **Admin Layout** tightened up and buttons sized.

---

## v0.16.2-alpha "Physics Boundaries + Camera Modes"

### Features
| Feature | Status | Description |
|---------|--------|-------------|
| **Physics Boundaries** | ✅ Complete | All non-ecctrl markers (beds, plantings, farmbots, non-ecctrl characters, models) wrapped in Rapier `RigidBody type="fixed"` with appropriate colliders — ecctrl character physically collides with all marker types |
| **Camera Mode Selector** | ✅ Complete | Dropdown in DetailsCard controlling section to select camera behavior: Follow, Top-Down, First-Person, Stationary |
| **Follow Mode** | ✅ Complete | Camera tracks character at constant 8-unit radius, target follows at ground level — character stays same visual size |
| **Top-Down Mode** | ✅ Complete | Camera target tracks character, `maxPolarAngle = 0.3` locks camera near-vertical |
| **First-Person Mode** | ✅ Complete | Smooth behind-the-character pivot at 1.2 height, 4-unit behind — shows character, beds, plants, and farmbots |
| **Stationary Mode** | ✅ Complete | No camera tracking, full free-roam OrbitControls with restored defaults |

### Architecture
```
CameraController (ThreeDScene.tsx)
  ├── cameraMode state (follow/topdown/firstperson/stationary)
  │     └── user-selected via DetailsCard dropdown
  ├── prevPos ref → velocity-based facingDir for first-person pivot
  ├── OrbitControls constraints (maxPolarAngle for topdown, enableDamping for first-person)
  └── Constant-radius camera for follow mode (8-unit offset)

ThreeDMarkerComponent
  └── RigidBody type="fixed" wrappers for all non-ecctrl marker types
        ├── Beds: colliders="cuboid"
        ├── Plantings: colliders="cuboid"
        ├── Farmbots: colliders="cuboid"
        ├── Non-ecctrl Characters: colliders="cuboid"
        └── Models: colliders="ball"
```

### Files Modified
| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | CameraController with 4 modes, velocity-based facing direction, constant-radius follow, top-down angle lock, first-person behind-pivot, RigidBody colliders for all marker types |
| `src/app/dashboard/map/page.tsx` | Added `cameraMode` state, camera dropdown in DetailsCard controlling section, removed Orbit option |
| `src/components/map/UnifiedMapView.tsx` | Added `cameraMode` prop threading |

### How to Use
Set `movementType: 'ecctrl'` on a character record in the database. Click character → Take Control → Camera dropdown appears → select Follow/Top-Down/First-Person/Stationary. Character physically collides with all marker types.

---

## v0.16.2-beta "Improved Camera Modes, Marker Selection, and Character Animations"

### 1. Camera Modes

| Feature | Status | Description |
|---------|--------|-------------|
| **Orbit Mode Re-added** | ✅ Complete | `orbit` re-added to `CameraViewMode` union, `validModes`, and the DetailsCard dropdown. Orbits around the character at 8-unit radius, 5 units high, slow rotation (0.3 rad/s) |
| **True Top-Down Mode** | ✅ Complete | `topdown` now positions the camera 15 units directly overhead (`charPos + (0, 15, 0)`), with `maxPolarAngle = 0.1` locking it near-vertical |

### 2. Marker Selection

| Feature | Status | Description |
|---------|--------|-------------|
| **Selection Rings (all types)** | ✅ Complete | Blue ground ring (`#3b82f6`) rendered under selected beds, plantings, farmbots, non-ecctrl characters, and fallback markers |
| **Models Selectable** | ✅ Complete | `model`/`models` markers now wrapped in a clickable `<group>`, surfacing the DetailsCard and a selection ring on click |
| **Live Position Tracking** | ✅ Complete | `EcctrlCharacter` writes its physics position to a shared `livePositionsRef` (keyed by marker id) every frame while controlled, so re-selecting a moved character focuses its current location instead of its DB origin |
| **Opt-in Zoom + Center** | ✅ Complete | Clicking/engaging a marker no longer auto-zooms; a 🎯 Zoom + Center button in the DetailsCard triggers the focus animation on demand |
| **Fading Selection Rings** | ✅ Complete | The blue selection ring holds at full opacity for 5s, then fades out over ~4s on all marker types (beds, plantings, farmbots, models, non-ecctrl characters, fallback, and ecctrl characters) via a shared `FadingRing` component. Controlled characters no longer keep a persistent ring — it fades away too |

### 3. Character Animations

| Feature | Status | Description |
|---------|--------|-------------|
| **AnimationMixer Playback** | ✅ Complete | `EcctrlCharacter` now builds a `THREE.AnimationMixer` from the loaded model and plays clips via crossfade instead of only resolving state names |
| **State → Clip Mapping** | ✅ Complete | `STATE_CLIPS` maps each `EcctrlAnimationState` to ordered clip-name candidates (case-insensitive, with fallbacks) |
| **Idle on Load** | ✅ Complete | Default/idle animation begins as soon as the model loads |
| **Mixer Advance** | ✅ Complete | `mixer.update(delta)` runs each frame, even when not controlled |

### Architecture

```
EcctrlCharacter
  ├── useCharacterModel → mixerRef + actionsRef (clip-name lookup)
  ├── EcctrlAnimationStateController (resolver maps physics → IDLE/WALK/RUN/JUMP_*)
  │     └── onChange → playAnimation(state)
  │           └── STATE_CLIPS lookup → crossFadeTo(action, 0.2s)
  └── useFrame → mixer.update(delta)
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/threed/shared/EcctrlCharacter.tsx` | Added `AnimationMixer` playback, `STATE_CLIPS` mapping, crossfade, mixer update loop, idle-on-load; writes live physics position to shared `livePositionsRef`; added fading selection ring (`isSelected` + `FadingRing`) |
| `src/components/map/ThreeDScene.tsx` | Re-added `orbit` mode; true `topdown` overhead; selection rings for all marker types; models clickable; `livePositionsRef` store used to focus moved characters correctly; removed auto-zoom on select; `focusRequest` prop for manual zoom |
| `src/components/threed/shared/GardenCharacter.tsx` | Added `positionedByParent` prop so non-ecctrl characters wrapped in a `RigidBody` are rendered in local space (prevents position being applied twice); world-space follow registry |
| `src/components/threed/shared/FadingRing.tsx` | (new) Shared selection ring that holds 5s, fades to invisible over ~4s, and resets on deselect/reselect |
| `src/components/map/UnifiedMapView.tsx` | Threaded `focusRequest` prop |
| `src/app/dashboard/map/page.tsx` | Added Orbit option to camera dropdown; generic `normalizePositions`; 🎯 Zoom + Center button in DetailsCard wired to `focusRequest` |
| `CONTEXT.md` | Documented v0.16.2-beta |
| `package.json` | Bumped version to `0.16.2-beta` |

---

## ✅ v0.16.2-beta — Released to Production (August 12, 2026)

**Release note:** v0.16.2-beta "Improved Camera Modes, Marker Selection, and Character Animations" is shipped to production. All features in the section above are live and verified:

- **Camera Modes**: re-added Orbit, true Top-Down overhead.
- **Marker Selection**: selection rings on all marker types, selectable models, live position tracking, opt-in Zoom + Center, fading selection rings.
- **Character Animations**: AnimationMixer playback with state→clip mapping, idle-on-load, and mixer advance.

`package.json` version is `0.16.2-beta`.

---

## ✅ v0.16.2-centaur — Released (minor, August 12, 2026)

### Minor Changes
| Change | Status | Description |
|--------|--------|-------------|
| **Character Marker Hover Title** | ✅ Complete | `GardenCharacter` and `EcctrlCharacter` hover tooltips now match the other 3D marker title style — consistent sizing (`text-xs`, `px-2 py-1`, `rounded`), screen-facing `Html` with `distanceFactor={10}` (not marker-attached), and positioned closer to the marker at `[0, 1.2, 0]`. Displays the character name (title) instead of "Click to interact…" |

---

## ✅ v0.16.3-alpha "Character Interaction Improvements + Character Model Files" — Released to Production

### Goals
- Treat all ThreeD Characters as animated Ecctrl Characters by default, engaging physics/collision interaction for every character that is marked movable.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **`isMovable` as Ecctrl trigger** | ✅ Complete | Replaced the `movementType === 'ecctrl'` trigger with the `isMovable === true` boolean. Movable characters route to the physics-based `EcctrlCharacter`; non-movable characters continue using `GardenCharacter`. |
| **Disengage on different selection** | ✅ Complete | Selecting/engaging a different marker, incident, or non-controlled character clears the active `controlledCharacterId`, so the previously moved character disengages and only the newly engaged entity is focused. |

### Files Modified
| File | Change |
|------|--------|
| `src/components/map/ThreeDScene.tsx` | Character routing now keys off `marker.data?.isMovable === true` instead of `movementType === 'ecctrl'` |
| `src/app/dashboard/map/page.tsx` | DetailsCard character controls now show when `d.isMovable === true`; added effect to disengage the controlled character when a different marker/incident is selected |
| `package.json` | Bumped version to `0.16.3-alpha` |

---

## ✅ v0.16.3-beta "Character Model Files (GLB/FBX/OBJ)" — Released to Production

### Goal
When a Character's `model_id` points to a `threed_models` record, load that model file (GLB/GLTF/FBX/OBJ, hosted on S3 or Vercel Blob) as the actual 3D Character Marker — replacing the rudimentary `<group>`/`<mesh>`/`<cylinder>` fallback shape.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **Character → model join** | ✅ Complete | `/api/map/threed` now attaches the referenced `threed_models` record to each character via `character.model`, so the 3D scene has the model `filePath`/`modelType`/`scale` it needs |
| **GLB/GLTF loading** | ✅ Complete | `GardenCharacter` and `EcctrlCharacter` load `.glb`/`.gltf` via `GLTFLoader` (fallback shape only when the model is missing/errored) |
| **FBX loading** | ✅ Complete | `.fbx` models load via `FBXLoader` |
| **OBJ loading** | ✅ Complete (new) | `.obj` models load via the new `OBJLoader` path in `GardenCharacter`, `EcctrlCharacter`, and `ModelMarker3D` |

### Files Modified
| File | Change |
|------|--------|
| `src/app/api/map/threed/route.ts` | Attaches each character's `threed_models` row as `character.model` when `modelId` is set |
| `src/components/threed/shared/EcctrlCharacter.tsx` | Added `OBJLoader`; routes `fbx`/`obj`/`glb` to the correct loader |
| `src/components/threed/shared/GardenCharacter.tsx` | Added `OBJLoader`; routes `fbx`/`obj`/`glb` to the correct loader |
| `src/components/threed/markers/ModelMarker3D.tsx` | Added `OBJLoader` support for standalone models |
| `package.json` | Bumped version to `0.16.3-beta` |

---

## ✅ v0.16.3-centaur "README Updates" — Released to Production

### Changes
| Change | Status | Description |
|--------|--------|-------------|
| **New README.md** | ✅ Complete | Replaced the generic Neon marketplace template with a user-friendly app introduction — a Dual-Surface Platform overview, a re-ordered "Core technologies" table with a brief rationale per technology, getting started, database/architecture notes, ThreeD characters, structure, and commands. |

### Files Modified
| File | Change |
|------|--------|
| `README.md` | Rewrote for project-specific, user-friendly documentation |
| `package.json` | Bumped version to `0.16.3-centaur` |

---

## ✅ v0.16.4-alpha "Character Models, Model Files, Model Texture Files + Supportive Media Files" — Released to Production

### Focus
- **Character models** — the GLB/GLTF/FBX/OBJ models rendered as characters.
- **Model files** — the primary model files (and associated binary buffers).
- **Model texture files** — baseColor/normal/roughness/metallic/emissive/occlusion maps.
- **Supportive media files** — thumbnails, previews, and auxiliary assets.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **Reusable model upload helper** | ✅ Complete | `src/lib/utils/modelUpload.ts` with `uploadModelFile` / `uploadModelTexture` / `uploadModelMedia` built on the same `@vercel/blob` `put()` pattern used for Music media |
| **Primary model file upload endpoint** | ✅ Complete | `POST /api/threed/models/upload` — uploads a GLB/GLTF/FBX/OBJ/USDZ file and returns its public URL + inferred `modelType`/`fileSize` |
| **Per-model files endpoint (fixed + extended)** | ✅ Complete | `POST /api/threed/models/files` now reads `modelId` from multipart form data (was broken: expected an `[id]` segment), and auto-classifies model/texture/binary/media by extension + persists to `threed_model_files` and updates `mainModelFileId`/`textureCount`/`hasExternalFiles` |
| **Model file delete route signature fixed** | ✅ Complete | `DELETE /api/threed/models/files/[fileId]` no longer expects a non-existent `[id]` param; derives the model id from the file record (with null guard) |
| **Admin model upload UI** | ✅ Complete | `ThreeDModelsCRUD` gains "Upload Model File" (create dialog) and "Upload Model Files / Textures" (files dialog) wired to the new endpoints |

### Reuse: Vercel Blob Storage upload (from existing Music/ThreeD code)
The app already has a working Vercel Blob upload pattern we will reuse for model files, instead of building a new upload path:

| Component | Location | Purpose |
|-----------|----------|---------|
| `@vercel/blob` `put()` / `del()` | `src/lib/utils/upload.ts`, `src/app/api/threed/models/files/route.ts`, `src/app/api/threed/models/files/[fileId]/route.ts` | Upload/delete files to Vercel Blob |
| `uploadImage()` helper | `src/lib/utils/upload.ts` | Music media upload via `put(filename, file, { access: 'public', addRandomSuffix: false })` |
| Model file upload route | `src/app/api/threed/models/files/route.ts` | Already uploads model textures (`models/{id}/textures/...`) and binaries (`models/{id}/bin/...`) — the baseline to extend for the full model/texture/media workflow |
| Env credentials | `.env.local` (`BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN`) | Vercel Blob access keys (already configured) |

### Key reference flow (from Music Tracks → Blob)
1. Client reads a local `File`.
2. `put(path, file, { access: 'public' })` uploads it to Vercel Blob and returns `blob.url`.
3. The returned `url` is persisted to the DB (`filePath`).

### Files Modified
| File | Change |
|------|--------|
| `src/lib/utils/modelUpload.ts` | (new) Reusable Vercel Blob model/texture/media upload helpers |
| `src/app/api/threed/models/upload/route.ts` | (new) Standalone primary model file upload endpoint |
| `src/app/api/threed/models/files/route.ts` | Fixed `modelId` read from form data; extended to auto-classify model/texture/binary/media |
| `src/app/api/threed/models/files/[fileId]/route.ts` | Fixed DELETE signature + null-guard on derived `modelId` |
| `src/components/admin/threed/models/ThreeDModelsCRUD.tsx` | Added upload handlers + file inputs for primary model & files/textures |
| `package.json` | Bumped version to `0.16.4-alpha` |

---

## ✅ v0.16.4-beta "Admin Surface: 3D Models CRUD Forms" — Released to Production

### Focus
- Improve the Admin 3D Models **Add/Edit dialog forms** for full UX around model files, texture files, and supportive media files — with pre-queried DB relationships and React dropdowns.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **Add/Edit forms restructured** | ✅ Complete | `ThreeDModelsCRUD` forms reorganized into labeled sections (Basic Info, Model File, Related Files/Textures, Transform, LOD & Animation, Status & Flags) |
| **Primary model file dropdown** | ✅ Complete | `mainModelFileId` is now a React `<Select>` populated from the model's associated `model`-type `threed_model_files` (pre-queried via `/api/threed/models?id=`) |
| **File category upload + management** | ✅ Complete | Files dialog gains a category `<Select>` (Auto-detect / Model / Texture / Binary / Supportive Media) and grouped file lists with inline delete |
| **Derived texture count** | ✅ Complete | Textures count is derived from associated files (read-only badge) instead of a free-text field |
| **Supportive media → `other`** | ✅ Complete | Backend auto-classifies unrecognized/auxiliary uploads as `fileType: 'other'` (aligning with `threed_model_files.fileType` values) |
| **All CRUD forms surface model files** | ✅ Complete | `ModelFileList` (shared component) now renders the selected model's files/textures/media inside every model-referencing CRUD form: Models (main file select + files dialog), Characters (create/edit), Plants (create/edit), and Plantings (create/edit) |
| **Dedicated Model Files CRUD page** | ✅ Complete | New admin page (`/admin/threed/model-files`) with `ThreeDModelFilesCRUD` — full-featured UX: model selector, file-category auto-detect, drag-and-drop + click-to-upload with per-file progress, list/grid views, search + sort, grouped by type, texture thumbnails, copy URL, open-in-new-tab, set-as-primary model file, delete with confirmation, plus summary stats and skeleton/empty/error states. Linked from the 3D Models page |

### Files Modified
| File | Change |
|------|--------|
| `src/components/admin/threed/models/ThreeDModelsCRUD.tsx` | Rebuilt forms into sections; `mainModelFileId` dropdown; category upload; grouped file management; derived texture count |
| `src/app/api/threed/models/files/route.ts` | Supportive/other media now persists `fileType: 'other'` (was `'media'`) |
| `src/components/admin/threed/models/ModelFileList.tsx` | (new) Shared component rendering a model's grouped files (model / texture / binary / other) with icons, texture badge, and size |
| `src/components/admin/threed/characters/ThreeDCharactersCRUD.tsx` | Renders `ModelFileList` for the selected model (create + edit) |
| `src/components/admin/threed/plants/ThreeDPlantsCRUD.tsx` | Renders `ModelFileList` for the selected model (create + edit) |
| `src/components/admin/threed/plantings/ThreeDPlantingsCRUD.tsx` | Renders `ModelFileList` for the selected custom model (create + edit) |
| `src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx` | (new) Dedicated Model Files CRUD — model selector, category upload, search/filter, grouped list, inline delete |
| `src/app/admin/threed/model-files/page.tsx` | (new) Admin page for Model Files (reads optional `?modelId=` to preselect) |
| `src/app/admin/threed/models/page.tsx` | Added "Model Files" link to the dedicated page |
| `package.json` | Bumped version to `0.16.4-beta` |

---

## ✅ v0.16.4-centaur "Character Grounding + Gravity Spawn" — Released (minor, August 13, 2026)

### Changes
| Change | Status | Description |
|--------|--------|-------------|
| **Ecctrl characters grounded** | ✅ Complete | `<Ecctrl>` models shifted down by `GROUND_OFFSET` (1.2 = capsuleHalfHeight + capsuleRadius + floatHeight), so a character at `positionY=0` stands on the ground instead of floating |
| **Non-ecctrl characters grounded** | ✅ Complete | `GardenCharacter` shifts loaded models down by their bounding-box `min.y`, grounding all GLB/FBX/OBJ characters model-agnostically |
| **Gravity-driven spawn lift** | ✅ Complete | Ecctrl characters spawn above their rest height (`+ SPAWN_LIFT = 0.75`) and settle onto the ground/colliders under gravity, avoiding first-frame interpenetration |

### Files Modified
| File | Change |
|------|--------|
| `src/components/threed/shared/EcctrlCharacter.tsx` | Grounded model via `GROUND_OFFSET`; spawn lift via `SPAWN_LIFT`; named capsule constants |
| `src/components/threed/shared/GardenCharacter.tsx` | Grounded model via bounding-box `min.y` |
| `package.json` | Bumped version to `0.16.4-centaur` |

---

## 🚧 Next Release — v0.16.5 "Character Animations + Actions"

### Focus
- **Two character components kept simple** — `EcctrlCharacter` (physics/WASD) and `GardenCharacter` (autonomous AI) remain separate files; the `isMovable` boolean chooses between them.
- **Improved animation state machine** — canonical idle/walk/run/jump/land transitions with consistent crossfade.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **Character routing kept simple** | ✅ Complete | `ThreeDScene` selects `EcctrlCharacter` when `isMovable === true` and `GardenCharacter` otherwise; `CharacterLayer` uses `GardenCharacter` directly |
| **Ecctrl animation resolver** | ✅ Complete | `createAnimationResolver` now uses ecctrl's canonical `wasOnGround` sequence (JUMP_START → JUMP_IDLE/JUMP_FALL → JUMP_LAND → IDLE/WALK/RUN) |
| **Consistent crossfade** | ✅ Complete | `CROSSFADE_DURATION = 0.25` replaces the magic `0.2`/`0.3` in `EcctrlCharacter` and `GardenCharacter` |
| **Garden (autonomous) clip matching** | ✅ Complete | Case-insensitive `findClip()` helper for model clip lookup (handles varying capitalization) in `GardenCharacter` (default, movement, and interaction animations) |
| **Shared fuzzy clip matcher** | ✅ Complete | `src/lib/utils/animation.ts` `matchClipName()` — matches logical actions (idle/walk/run/jump/dance/…) to a file's embedded clip names (case-insensitive + substring fallback) |
| **Primary animation mapping entry point (v0.16.5b)** | ✅ Complete | `animation.ts` is the single entry/return point for ThreeD Animation Mapping. `buildAnimationMap(clipNames)` takes the file's clip names (entry data) and exposes `resolve(action) → clipName` (exit data) for every consumer. |
| **Canonical Action Catalog (v0.16.5b)** | ✅ Complete | `ACTION_CANDIDATES: Record<AnimationAction, string[]>` — the approved catalog covering the DB enum (`idle, walk, run, fly, dance, sway, float, spin, bounce`), ecctrl jump states (`jump_start, jump_idle, jump_fall, jump_land`), and interaction (`wave`); each action maps to ordered clip-name matchers (name-match first, positional fallback for generic `Anim_N`/`Take_N`/`Action.N`). `take 001`/`take_001` are `idle` candidates so single-clip Synty exports at least play. |
| **Centralized action fallback chain (v0.16.5b)** | ✅ Complete | `ACTION_FALLBACK` — when an action's exact clip is absent, `resolve` walks a sensible fallback (`run→walk→idle`, `jump_*→…→idle`, all → `idle`). Single-clip models now always return a real clip instead of `null`, so characters keep animating while their physics body moves. |
| **Per-model animation overrides (v0.16.5b)** | ✅ Complete | `buildAnimationMap(clipNames, overrides?)` accepts `overrides` (`action→clipName`), which win over name/positional matching. Both characters pass `character.model.metadata.animationMap`. This makes the mapping user-editable (since clip variable names in GLBs are unknowable). |
| **Model Animations admin CRUD page (v0.16.5b)** | ✅ Complete | New `/admin/threed/model-animations` page (`ThreeDModelAnimations`) — selects a model, discovers its embedded animation clips client-side via GLTF/FBX loaders, and maps each clip → an App Action (or Auto-detect/None), saving to `threed_models.metadata.animationMap`. Linked from the 3D Models page. |
| **GLB audit (informational)** | ✅ Complete | Audited all 7 models: the two character GLBs contain only one clip (`"Take 001"`). This does not change the approved Option 1 mapping — it simply means characters will favor the first available clip until a model with more clips is provided. |

### Notes
- The animation mapping is intentionally simple (Option 1): a hardcoded default constant, internal only, no UI. Per-model config or an inspector UI can be added later if needed.
- When a character model does contain multiple clips, `buildAnimationMap` will map them automatically (name-match first, positional fallback for generic `Anim_N`/`Take_N`/`Action.N` names).

### Where Animations Come From (model-file guidance)
- **GLB / GLTF** — animations are **embedded in the file**, exposed by the loaders as `object.animations` (`THREE.AnimationClip[]`). ✅ Recommended for characters.
- **FBX** — animations + skeletons are embedded too (`object.animations`), but it's an older exchange format and heavier to load. Works, but prefer GLB/GLTF.
- **OBJ** — **no animation support** (geometry + materials only). Do not use for characters that need actions/animations.
- A character's `animations[]`, `defaultAnimation`, `defaultEmote`, and `soundEffect` DB columns are **logical references**, not the clips themselves. The actual clips live inside the model file; `matchClipName()` connects the logical references to the file's real clip names.

### Files Modified
| File | Change |
|------|--------|
| `src/components/threed/shared/EcctrlCharacter.tsx` | Canonical `wasOnGround` resolver + `CROSSFADE_DURATION` constant |
| `src/components/threed/shared/GardenCharacter.tsx` | Consistent crossfade + `findClip()` now resolves through `buildAnimationMap` |
| `src/components/threed/shared/EcctrlCharacter.tsx` | `playAnimation` resolves states through `buildAnimationMap` (primary entry point) |
| `src/lib/utils/animation.ts` | (new) `matchClipName` + `ACTION_CANDIDATES` (canonical catalog) + `ANIMATION_ORDER` + `ACTION_FALLBACK` + `buildAnimationMap(clipNames, overrides?)` (primary mapping entry/return point) |
| `src/components/admin/threed/models/ThreeDModelAnimations.tsx` | (new) Model Animations admin UI (map model clips → App Actions) |
| `src/app/admin/threed/model-animations/page.tsx` | (new) Admin page for Model Animations |
| `src/app/admin/threed/models/page.tsx` | Added "Model Animations" link |
| `src/components/map/ThreeDScene.tsx` | Kept direct `EcctrlCharacter`/`GardenCharacter` routing (no wrapper) |
| `src/components/threed/layers/CharacterLayer.tsx` | Kept direct `GardenCharacter` usage |


---

## ✅ v0.16.5-beta "v0.16.5b: Character Animations + Actions => Animation Action Mapping" — Released

### Overview
Character animations are driven by a **primary entry/return point** (`src/lib/utils/animation.ts`) and made **user-editable per model** because GLB/FBX clip names (e.g. `Anim_0`, `Anim_1`, `Take 001`, `mixamo.com|Armature|Walk`) cannot be known in advance.

### Changes Implemented
| Change | Status | Description |
|--------|--------|-------------|
| **Canonical Action Catalog** | ✅ Complete | `ANIMATION_ACTIONS` + `ACTION_CANDIDATES` — 14 logical actions (DB enum `idle/walk/run/fly/dance/sway/float/spin/bounce` + ecctrl `jump_*` states + interaction `wave`), each with ordered clip-name matchers |
| **Primary mapping entry/return point** | ✅ Complete | `buildAnimationMap(clipNames, overrides?)` — strategy: per-model overrides → name-match → positional fallback (for generic `Anim_N`/`Take_N`/`Action.N`), then `resolve(action) → clipName` |
| **Centralized fallback chain** | ✅ Complete | `ACTION_FALLBACK` ensures every action resolves to a real clip (`run→walk→idle`, `jump_*→…→idle`), so characters never freeze while moving |
| **Per-model overrides in characters** | ✅ Complete | `EcctrlCharacter` + `GardenCharacter` pass `character.model.metadata.animationMap` into `buildAnimationMap` |
| **Model Animations admin CRUD page** | ✅ Complete | `/admin/threed/model-animations` (`ThreeDModelAnimations`) — discovers embedded clips client-side (GLTF/FBX loaders), maps each clip → App Action, saves to `threed_models.metadata.animationMap`; linked from 3D Models page |

### Files Modified
| File | Change |
|------|--------|
| `src/lib/utils/animation.ts` | `matchClipName` + `ACTION_CANDIDATES` + `ANIMATION_ORDER` + `ACTION_FALLBACK` + `buildAnimationMap(clipNames, overrides?)` |
| `src/components/threed/shared/EcctrlCharacter.tsx` | Resolves states through `buildAnimationMap` + passes model overrides |
| `src/components/threed/shared/GardenCharacter.tsx` | Resolves movement/interaction clips through `buildAnimationMap` + passes model overrides |
| `src/components/admin/threed/models/ThreeDModelAnimations.tsx` | (new) Admin mapping UI |
| `src/app/admin/threed/model-animations/page.tsx` | (new) Admin page |
| `src/app/admin/threed/models/page.tsx` | Added "Model Animations" link |

### User Flow
1. Upload a character GLB (may contain many `Anim_N` clips).
2. **Admin → 3D Models → Model Animations** → map clips to App Actions.
3. Save → dashboard 3D map uses the saved mapping automatically — no code changes or guessing required.

### Notes
- GLB / GLTF embed animation clips (`object.animations`); FBX embeds them too. OBJ has **no** animation support.
- DB columns `animations[]`, `defaultAnimation`, `defaultEmote`, `soundEffect` are logical references; the real clips live inside the model file and are connected via `buildAnimationMap`.

---
---

## ✅ v0.16.6a — Character Animations + Actions / Animation Action Mapping

### Stable result

The app can use the original FBX character model with separate FBX animation files and expose those clips through semantic application actions. The character runtime no longer depends on converting the animation library into a single GLB as the primary workflow.

Verified behavior includes:

- `idle`, `walk`, and `run` locomotion.
- Autonomous `GardenCharacter` wandering with walk animation.
- `EcctrlCharacter` player control with task-action interruption and recovery.
- Semantic one-shot actions including watering, planting, harvesting, animal-care, and interaction animations.
- Repeated task actions.
- Clean crossfade back to locomotion without the brief FBX bind/T-pose flash.
- DetailsCard action buttons while retaining Take Control / Release Control.

## ✅ v0.16.6b — World Actions v2

### Stable result

World Actions v2 adds a persistent planting target and proves one end-to-end semantic world action: **Water**.

The action target persists while the user changes selection from the planting to the Farmer. Watering is persisted only after the watering animation completes. The server authenticates the request and validates ownership before writing watering history.

### Intentional pause point

The ThreeD animation architecture is considered a successful, stable milestone. Broader world-state mutations, harvest persistence, inventory, plant lifecycle, and task execution should be developed later as the API/schema design matures.

Do not refactor the proven animation system merely to support unfinished persistence features.

## ✅ v0.16.7 — Visual Action Targeting

### Released to production — stable checkpoint

The persistent planting action target now has a distinct emerald pulse in the 3D scene. Character DetailsCard controls can focus the camera on the target or clear it without changing the selected character.

This release remains a client-side ThreeD UX milestone:

- Target identity and position use a shared `ThreeDActionTarget` runtime type.
- Target state is threaded through `UnifiedMapView` into `ThreeDScene`.
- The existing scene focus animation is reused; no second camera system was introduced.
- Selection remains a temporary blue ring while the action target uses a persistent emerald pulse.
- Targets survive selection and filtering changes, clear on project changes, and reconcile against refreshed planting data.

## ✅ v0.16.8 — Project-Scoped Harvest Management (released with v0.17.0)

Targeted `pickFruit`, `pickFruit2`, and `pickFruit3` actions now enter the World Action persistence path after their one-shot animation completes. The authenticated server validates project, character, and planting ownership plus the planting's active project assignment, creates a `threed_harvests` record with a default quantity of `1 each`, and links that record to the planting's ThreeD module through `project_assets` in the same database transaction.

This addition does not change the database schema, external FBX loading, semantic task dispatch, task-to-locomotion crossfades, or the existing targeted Water behavior.

The Harvest CRUD/API surfaces now share the same ownership and project-association rules:

- `GET /api/threed/harvests` supports explicit `projectId` and `moduleId` scoping and returns plant, planting, bed, project-association, and source information.
- Manual project-scoped creation derives the plant and ThreeD module from an owned planting and creates the harvest/project association transactionally.
- Admin create/edit forms validate quantity, clear optional Select sentinels correctly, filter by project/status, and distinguish manual records from World Action records.
- Dashboard Harvests consumes the enriched flat API contract and labels World Action records.
- Pick Fruit requests carry a per-button-press UUID through animation completion. The server uses that token with a transaction-scoped advisory lock and the existing unique `harvest_id` to make retries idempotent without a schema migration.
- Harvest `PATCH` now follows the same update implementation as `PUT`, matching the existing Admin client.

This work passed its manual regression checks and shipped as part of the v0.17.0 production release.

- The v0.16.6b targeted Water completion and persistence flow is unchanged.
- No database schema or API behavior changed.

v0.17.0 is the production boundary for the ThreeD character, animation, control, selection, targeted Water, and project-scoped Pick Fruit persistence delivered through this checkpoint.

### Files changed

| File | Change |
|---|---|
| `src/lib/types/map.ts` | Shared planting action-target identity and position type |
| `src/app/dashboard/map/page.tsx` | Target controls, focus request, project scoping, and refresh reconciliation |
| `src/components/map/UnifiedMapView.tsx` | Target state bridge into the 3D scene |
| `src/components/map/ThreeDScene.tsx` | Persistent target pulse and target camera focus |
| `package.json` | Version bumped to `0.16.7` |

## ✅ v0.17.0 — App Structure, Ownership, and Admin Improvements (released to production)

The v0.17.0 production release includes the accumulated v0.16.8 Harvest work plus incremental structural, API-scoping, Music, and Admin improvements. Its agent-oriented repository workflow establishes:

- `AGENTS.md` requires prove → act → document sequencing and protects dirty-worktree release-candidate changes.
- `docs/agents/VALIDATION.md` defines the narrow-first validation ladder, known TypeScript baseline, and ThreeD regression gates.
- `npm run typecheck` is the canonical discoverable TypeScript command.

Future v0.17 changes should remain independently reviewable and must not combine file moves or architectural cleanup with feature behavior changes.

### Project asset-scoping correction

Dashboard Map API reads now preserve the `project_assets` ID restriction when applying an asset's `isActive` filter. Active records that are not assigned to the selected Project therefore no longer replace the assigned result set. ThreeD and Traffic assets are also intersected with active module assignments from `project_threed` and `project_traffic`.

The general `GET /api/project/assets` query now composes its Project, owner, active-state, module, and asset-type predicates in one Drizzle `where` expression so optional filters cannot replace Project scoping. Response shapes, ProjectAssetManager write behavior, database schema, and ThreeD runtime behavior are unchanged.

### Project discovery and module eligibility

`GET /api/map/projects` now applies ownership/public access, Project active state, and the existence of an active Project asset as one reusable query predicate. Asset totals exclude inactive assignments, and active ThreeD, Traffic, and Music module counts are returned in `moduleCounts` while the existing presence booleans remain available.

`GET /api/project/modules` now returns only active junction assignments whose underlying module is also active. Module POST/DELETE behavior, database schema, and existing response fields are unchanged.

### Project asset assignment lifecycle integrity

`POST /api/project/assets` now validates positive integer IDs, supported module and asset types, Project ownership, and an active Project/module junction whose underlying module is active. Cross-module combinations such as a ThreeD module with a Music asset type are rejected before persistence.

Because Project asset removal is a soft delete and the unique index does not include `isActive`, assigning a previously removed asset now reactivates its existing `project_assets` row instead of attempting a conflicting insert. The ProjectAssetManager response contract and database schema are unchanged.

### Assignable Project asset registry

Project asset creation now resolves child records through a server-only registry covering the 22 asset types exposed by ProjectAssetManager. Music and ThreeD assets require ownership; Traffic types that support public visibility allow either ownership or an active public record. Traffic centers and districts remain owner-only.

The API verifies that the child record exists and satisfies its assignment policy before creating or reactivating a `project_assets` row. Legacy `threed_markers` is intentionally unsupported because markers are generated at runtime, and `threed_weather_logs` remains deferred. Their enum values remain unchanged for compatibility.

### Music album read scopes

`GET /api/music/albums` now has explicit `owner` and `public` read scopes. Authenticated requests default to owner-only results, while anonymous requests default to published public albums. Public Dashboard and homepage callers request `scope=public` explicitly so logged-in state does not change the public catalog.

Single-album reads and optional track, link, and media enrichment use the same scope. Their access predicates are composed once so later filters cannot replace ownership or publication rules. The stale GET-side `musicId` filter was removed because Music albums are free-standing assets associated through `project_assets`, not a `music_id` column.

### Music track and link read scopes

`GET /api/music/tracks` now mirrors the Album API's explicit `owner` and `public` scopes. Authenticated requests default to owner-only tracks; anonymous requests default to active tracks whose parent Album is both published and public. Public homepage and Music content callers request `scope=public` explicitly so authentication state cannot expose an owner's private catalog or hide the intended public catalog.

Track ID and Album filters are composed with the selected access predicate. `GET /api/music/links` likewise composes owner, Album, Track, and independent-link filters in one predicate so optional filters cannot replace ownership. Music Media reads were inspected and already preserve ownership. Write behavior, response shapes, and database schema are unchanged.

### Music admin analytics ownership

`GET /api/music/admin/stats` now resolves the authenticated Auth.js session instead of using a hard-coded user identity. Unauthenticated requests receive `401`, and Album, Track, Link, playback-history, listening-time, and top-track statistics retain their existing response shape while remaining scoped to the signed-in user. Public Music statistics and database schema are unchanged.

### Music module list scope

`GET /api/music` now composes module ownership, active-state, and optional Project assignment into one predicate shared by its result and pagination-count queries. Project filtering resolves through an active, owner-matching `project_music` junction instead of the nonexistent legacy `music.projectId` field. Invalid IDs and pagination values return `400`; the response shape and Music module write paths are unchanged.

`PUT /api/music` no longer accepts or writes the same obsolete direct `projectId` field. It continues to update owned Music module properties with its existing response contract; Project membership remains exclusively managed through `/api/project/modules` and the `project_music` junction.

### ThreeD Admin landing surface

`/admin/threed` now provides a server-rendered navigation hub for the existing Plants, Plantings, Beds, Characters, Tasks, Watering Schedules, Harvests, FarmBots, Models, Model Files, Model Animations, and Layers admin pages. It uses the existing authenticated Admin layout and introduces no data query or runtime dependency. Legacy stored Markers are intentionally excluded because Project map markers are generated at runtime.

### Music Track file contract

Music Track APIs, Admin editors, public players, streaming, polling, shared types, and seed helpers use the schema-native `fileUrl` and `fileType` contract exclusively. Track writes validate Track and Album IDs and continue verifying Album ownership. No compatibility aliases are retained because Track data will be imported into the canonical shape before production use.

### Music JSON importer

`npm run music:import -- --user-id <id>` validates the Music JSON without connecting to the database or writing records. The importer requires an explicit target owner, validates Album/Track relationships and canonical file URLs, infers supported audio MIME types, and ignores source database IDs when creating records.

Adding `--commit` verifies that the target User exists and imports through one transaction. Albums map by normalized artist/title and Tracks map by resulting Album ID plus file URL, making reruns skip previously imported records without preventing the same audio file from belonging to multiple Albums. A different JSON path may be provided with `--file <path>`. No schema or environment change is required.

Dry runs report duplicate Track mappings found inside the JSON. Commit summaries list each skipped Track with its source ID, title, Album, URL, and whether it was duplicated in the import file or already existed in the database.

The import JSON contract is versioned with top-level `version: 1` and uses application-level camelCase consistently. Albums use `sourceId`, `coverArt`, `releaseYear`, `sortOrder`, and `isPublic`; Tracks use `sourceId`, `albumSourceId`, `trackNumber`, `fileUrl`, `fileType`, and `playCount`. Source IDs exist only to map nested records and are never inserted as database primary keys. Ownership is supplied only through `--user-id`, while database timestamps use schema defaults.

### Music Admin cover fallback

Music Admin Album grids, Album details, and Track details render a neutral placeholder when an Album has a missing or whitespace-only cover URL. The Album grid also switches to the placeholder when a non-empty cover URL fails to load. Valid cover URLs retain their existing rendering, while empty values are never passed to an image `src` attribute. Album cards request owner-scoped Track enrichment so their Track counts reflect the records assigned to each Album.

## ✅ v0.17.1 — Production Asset Validation (released to production)

The external character animation library is now reproducible from a clean Git checkout instead of depending on ignored local files:

- Production FBX files are Git-tracked under `public/assets/animations`; only the separate `public/assets-archive` directory remains ignored.
- `src/lib/utils/externalCharacterAnimations.ts` remains the single static manifest used by both character runtime paths.
- `npm run validate:assets` verifies that all 35 animation files referenced by the manifest exist under `public/`.
- The tracked animation library currently contains 48 FBX files totaling approximately 25.86 MiB. Windows `Zone.Identifier` artifacts are excluded from the animation set.
- `.github/workflows/validation.yml` runs on pull requests and pushes to `main`. Asset validation is blocking after `actions/checkout`, which also proves the required files are committed.
- The workflow installs the locked Bun dependencies and validates the production animation assets from a clean checkout.
- Vercel remains the production-build gate because it owns the configured deployment environment.

This release changes validation and delivery safeguards only. It does not change animation URLs, loaders, mixers, semantic action mapping, character routing, crossfades, World Action timing, database schema, or API behavior.

## ✅ v0.17.2 — API and Type Safety Cleanup (released to production)

The production release consolidates legacy API/service code around the schema and active route architecture established in v0.17.0. Obsolete duplicate routes and unused services are removed only after reference analysis, while retained Traffic and FarmBot pollers are mapped to current schema fields.

The pre-existing TypeScript baseline is repaired: `npm run typecheck`, `npm run validate:assets`, and `npm run build` all complete successfully with the current validation configuration. GitHub Actions now treats TypeScript errors as blocking, and Next.js production builds no longer use `typescript.ignoreBuildErrors`.

This checkpoint does not change the database schema, environment contract, external FBX manifest, character runtime routing, task-to-locomotion crossfades, DetailsCard behavior, or World Action persistence timing.

GitHub `main` and Vercel production successfully passed the blocking TypeScript build gate for this release.

## ✅ v0.17.3 — Documentation Foundation (released to production)

The v0.17.3 production release introduces a repository documentation hub for human users, developers, and coding agents without changing application behavior:

- `docs/README.md` is the canonical audience router.
- `docs/users` explains Admin, Dashboard, project assignment, ThreeD controls, and World Action behavior.
- `docs/developers` documents the dual-surface architecture, project-scoped data model, API policies, local setup, and deployment checks.
- `docs/agents` connects the root working contract to safe-change boundaries, task checklists, and the existing validation ladder.
- `docs/releases` records confirmed production checkpoints separately from in-progress work.
- `public/llms.txt` provides a compact discovery index for automated readers; it does not replace the source code, schema, `AGENTS.md`, or `CONTEXT.md`.

The root README links to the documentation hub and accurately describes authenticated ThreeD World Actions as the intentional exception to the Dashboard's primarily read-oriented role. Package and Admin footer metadata identified v0.17.3 for that release. GitHub and Vercel production deployment were confirmed.

## ✅ v0.18.0 — ThreeD FarmBot Integration (Phase 1 released to production)

The first Phase 1 increment establishes a fail-closed security boundary around the preliminary FarmBot implementation before any real hardware is connected:

- General FarmBot CRUD no longer accepts or returns the legacy `apiToken` field and no longer logs request bodies or complete FarmBot records.
- The Admin FarmBot form no longer stores or edits credentials in browser state.
- The project-scoped map loader removes FarmBot credentials before returning runtime marker data.
- FarmBot statistics require authentication and are scoped to the signed-in owner.
- Preliminary generic command, polling, watering, and movement routes authenticate and return `503` without invoking the legacy global-environment client.
- The legacy nullable `api_token` column remains quarantined for compatibility, while active credentials use the implemented encrypted per-device envelope and server-only key management.
- A server-only, versioned AES-256-GCM credential primitive now binds ciphertext to its owner and FarmBot record through authenticated context. Its validation covers round-trip behavior, random IVs, tampering, wrong keys, cross-record use, and invalid inputs.
- The Drizzle schema now declares a nullable encrypted credential envelope with an all-or-none constraint. Shared server-only sanitization strips legacy and encrypted credential fields from CRUD and map responses, and general CRUD rejects attempts to write them.
- The encrypted-envelope schema was applied successfully to the approved Neon environments and is active in production.
- A server-only versioned key provider resolves retained keys for decryption and a separately selected current key for new encryption. Rotation is decrypt-with-recorded-version, then encrypt-with-current-version; old keys remain configured until no stored envelope references them.
- A server-only credential repository provides owner-scoped status, atomic save/replace, load, clear, and compare-and-swap rotation. Only its redacted status, save/replace, and clear operations are exposed through the dedicated credential API.
- A dedicated authenticated `/api/threed/farmbots/:id/credential` endpoint now exposes redacted status, encrypted save/replace, and clear operations. It never echoes a token and does not test connectivity or invoke hardware.
- FarmBot Admin rows expose only a safe credential-configured flag. A dedicated connection dialog can store, replace, or disconnect encrypted credentials; it never retrieves an existing credential, and clearly distinguishes stored configuration from a verified live connection.
- The connection dialog can generate a FarmBot JWT from transient account email/password input through an authenticated, owner-scoped server route. The route uses the fixed hosted FarmBot token endpoint, a bounded request and timeout, redacted errors, and best-effort process-local throttling; it stores the resulting token directly through the encrypted repository and never returns it to the browser.
- An authenticated, owner-scoped connection test decrypts the JWT server-side and performs only the documented `GET /api/device` request against the fixed FarmBot host. Its response exposes a small allowlisted device summary and explicitly distinguishes REST authentication from physical-device connectivity; it makes no database or FarmBot mutation.
- After successful REST authentication, the connection summary also exposes only the JWT broker-device identity and expiration claim. The local `assetCode` remains a user-defined App label and is not silently reinterpreted or enforced as an upstream FarmBot identifier.
- Owner-scoped read-only peripheral discovery retrieves only the official FarmBot peripheral ID, label, pin, and mode fields, caps the displayed inventory, and persists nothing. No peripheral is inferred or selected for Water, and no pin state is read or changed.
- The approved `threed_farmbot_peripheral_bindings` schema stores one explicit owner-scoped binding per FarmBot/semantic action. The initial API allows only `water`, refetches authoritative peripheral metadata before assignment, and deletes bindings transactionally whenever credentials are replaced or cleared. Admin assignment changes configuration only; physical commands remain disabled.
- A reusable owner-scoped binding preflight refetches FarmBot peripherals and fails closed when the Water binding is inactive, missing upstream, or differs in label, pin, or mode. Admin validation displays this status without authorizing or executing hardware behavior.
- The binding table is active in production. During development, the approved `db:push` also reconciled pre-existing database drift in three foreign-key constraint names plus existing character-animation and layer-default definitions.
- The approved one-to-one FarmBot broker-metadata schema tracks the current MQTT host, secure WebSocket URL, broker identity, vhost, token dates, observation time, and REST-verification time. Values are derived strictly from the encrypted JWT, atomically replaced or cleared with credentials, excluded from general APIs/map payloads, and displayed only through an owner-scoped Admin diagnostic.
- An explicit owner-scoped broker refresh uses the stored JWT with FarmBot's authenticated token endpoint, requires the refreshed token to retain the same broker-device identity, and atomically replaces the encrypted token and metadata snapshot with compare-and-swap protection. It preserves peripheral bindings, records REST verification, and does not extend expiration, open MQTT, or issue a hardware command.
- FarmBot identity is normalized on the parent record: the former user-entered `device_id` becomes `asset_code`, while nullable `farmbot_device_id` and `broker_device_id` hold the verified REST and MQTT identities. The connection test requires `device_<REST ID>` equality before transactionally binding them; generic CRUD cannot write these canonical fields, and later credentials for another bound device are rejected.
- The metadata table retains its token-observed broker identity during a safe two-phase migration, while the verified canonical identity also lives on the parent. The approved development `db:push` preserved all three existing local identifiers through the `device_id` → `asset_code` rename, added both nullable parent identities, and did not truncate rows or drop snapshot identity data. It repeated known constraint-name/default reconciliation. Removing the redundant snapshot field is deferred until parent backfill is proven.
- The broker snapshot and parent-identity revisions are active in production. Development schema application also reconciled known foreign-key-name and existing default/type drift.
- Persistent MQTT/FarmBotJS sessions are explicitly outside Vercel request handlers. A future long-running worker must own subscriptions, reconnects, state updates, acknowledgements, and allowlisted commands; no MQTT connection or hardware command is enabled yet.
- An owner-scoped MQTT readiness preflight now decrypts the credential server-side and compares current token claims with the canonical parent identity and broker snapshot. It reports explicit fail-closed configuration issues without returning the token, contacting FarmBot, opening MQTT, or authorizing hardware. Admin displays this as configuration readiness for a future worker only.
- The retained in-progress `FarmBotPoller` now fails closed at `sendCommand()` and cannot use its former assumed REST command endpoint. Its read-oriented work remains available, while all physical commands wait for the future MQTT worker.
- Project-assigned FarmBot runtime markers now support the same DetailsCard **Use as Action Target**, focus, clear, stale-data cleanup, and green scene pulse behavior as Plantings. FarmBot-targeted character actions remain animation-only: existing Water/Harvest persistence still requires a Planting target, and no FarmBot REST/MQTT/peripheral command is enabled.
- While a FarmBot is targeted, the character DetailsCard exposes only the existing Point, Point Gesture, and Talk semantic animations and labels them as animation-only. Clearing that target restores the full palette, while Planting-targeted action and persistence paths remain unchanged.

The repository ignores generated `/drizzle` artifacts and continues to use an explicitly user-run `db:push` workflow. No environment file, ThreeD rendering path, character animation behavior, or World Action timing changed. Physical FarmBot commands remain disabled.

The approved phase sequence is now documented in `docs/developers/FARMBOT_INTEGRATION.md`: Phase 1 secure App foundation; Phase 2 separately deployed MQTT worker and read-only status; Phase 3 command safety and auditing; Phase 4 one-device Water pilot; and Phase 5 later ThreeD interaction expansion. Each phase requires its own approval. Phase 2 begins with design review only, and no worker, MQTT socket, new external resource, or physical operation is authorized by this sequence.

GitHub-to-Vercel production deployment and production smoke testing were confirmed on August 19, 2026. v0.18.0 is the production boundary; later phases remain unapproved and physical FarmBot commands remain disabled.

## Current Phase Plan for v0.18.0+

The following **ThreeD FarmBot Integration Plan** is approved as the development sequence after the v0.18.0 production release. Approval of the sequence is not authorization to start every phase at once.

### v0.18.0 — Phase 1: Secure App foundation (production)

- Keep encrypted FarmBot credentials and canonical REST/MQTT identity server-only and owner-scoped.
- Keep peripheral discovery, explicit Water binding, broker metadata, readiness checks, and ThreeD FarmBot targeting in their current safe form.
- FarmBot-targeted character actions remain animation-only. MQTT connections, MQTT publishing, and physical commands remain disabled.

### v0.18.1 — Phase 2: MQTT worker and read-only status

1. **Phase 2A — Worker design:** choose a separately deployed long-running runtime; define App-to-worker authentication, signed/replay-protected requests, credential handoff, device identity checks, reconnect policy, and the runtime-status boundary.
2. **Phase 2B — Worker skeleton:** implement one managed connection per FarmBot with `disconnected`, `connecting`, `connected`, `reconnecting`, `expired`, and `error` states; use redacted logs, bounded reconnects, graceful shutdown, and a health endpoint. Commands remain disabled.
3. **Phase 2C — Read-only subscriptions:** subscribe only to approved device-status and response topics, parse allowlisted fields, and avoid storing or exposing the complete FarmBot state tree.
4. **Phase 2D — App status display:** show connection state, last message time, last known position, token expiry, and stale-state warnings through authenticated owner- and project-scoped paths.

Phase 2 begins with Phase 2A design review. Creating the worker host, opening an MQTT connection, or adding runtime-status persistence requires its own approval when the design identifies the exact resources and files.

### v0.18.2 — Phase 3: Command safety and audit

- Introduce only server-built semantic commands; never accept arbitrary CeleryScript, MQTT topics, command names, coordinates, or pin operations from the browser.
- Require operation allowlists, coordinate and duration bounds, idempotency, per-device concurrency protection, request-state tracking, RPC-label acknowledgement correlation, and audit records.
- Provide an emergency-stop path that does not depend on character animation or the normal World Action completion path.
- Any new tables or schema fields require explicit approval before implementation.

### v0.18.3 — Phase 4: Single-device Water pilot

- Limit the first physical test to one verified, actively project-assigned FarmBot with a current Water peripheral binding and a healthy worker.
- Use a server-defined maximum duration and require acknowledgement and audit completion.
- Treat character animation completion, command acceptance, device acknowledgement, and physical completion as separate states.
- Starting this pilot requires explicit approval to operate the physical FarmBot.

### v0.18.4 — Phase 5: ThreeD orchestration

- Add character approach and orientation, then use the established semantic animation path before submitting an audited FarmBot action request.
- Preserve FBX loading, semantic Animation Action Mapping, GardenCharacter and EcctrlCharacter separation, task-to-locomotion crossfades, DetailsCard controls, and existing Planting-targeted Water and Pick Fruit behavior.
- Keep MQTT ownership in the worker; ThreeD components display status and request approved semantic operations only.

### v0.18.5+ — Phase 6+: Controlled operation expansion

Add one semantic FarmBot operation at a time. Each operation needs separate prerequisites, bounds, server-side command construction, audit and acknowledgement behavior, timeout handling, and manual validation before another operation is introduced.

### Approval boundary

The overall phase sequence is approved, but each phase remains a separate implementation gate. The plan does not authorize database changes, external worker hosting, MQTT connections, MQTT publishing, or physical commands until the applicable phase is reviewed and explicitly approved.

### v0.18.1 Phase 2A design record

The proposed worker architecture is documented in `docs/developers/FARMBOT_MQTT_WORKER.md`. It uses a standalone, separately deployed TypeScript/Node.js service; HMAC-authenticated App-to-worker grants over TLS; in-memory credential and status handling; exact read-only `status` and `from_device` subscriptions; and no publish interface. The App remains responsible for credential decryption, owner checks, readiness, and later Project-asset authorization.

The initial runtime status is intentionally volatile and queried from the worker through a signed internal boundary, avoiding a database change in Phase 2. A local compatibility test must select the MQTT transport before a dependency is installed because FarmBot documents MQTT as the preferred non-browser protocol but does not production-test FarmBotJS in Node.js.

This is a design-review checkpoint only. `package.json` remains at the production version, no release candidate is designated, and no worker, external host, internal API, environment setting, MQTT socket, schema change, or physical operation has been created. Phase 2B requires separate approval after review of the design.
