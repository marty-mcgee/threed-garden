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
| Current stable version | **v0.18.7a — ThreeD Model Library Project Placements** |
| Current release candidate | **None designated** |
| Current development milestone | **Post-release checkpoint; next milestone requires review** |
| Previous checkpoint | **v0.18.6b — ThreeD Project Marker Snapshots** |
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
- **Runtime Rendering**: Dashboard visualizations (map markers, 3D objects, stats) are generated at runtime. ThreeD Projects may explicitly save their current marker state in `project_threed_markers`; the map load path restores eligible snapshot positions into Runtime Markers and the in-memory registry without writing on every render update.
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
| **v0.18.1a** | **2026-08-20** | **Production release — ThreeD MQTT Module with FarmBot read-only adapter, normalized activity, Admin controls, and project-scoped Dashboard status** |
| **v0.18.1b** | **2026-08-20** | **Production release — provider-neutral ThreeD MQTT control layer, protocol-first service hierarchy, and FarmBot controller integration with read-only behavior preserved** |
| **v0.18.2b** | **2026-08-21** | **Production release — ThreeD MQTT Control Layer Phase 3D–3F command authorization, audit lifecycle, and dormant delivery contracts** |
| **v0.18.3a** | **2026-08-21** | **Production release — Phase 4 command delivery safety foundation through Phase 4L-C** |
| **v0.18.3b** | **2026-08-21** | **Production release — Phase 4L-D–4L-K emergency audit persistence, disabled worker boundary, correlation, and acknowledgement reporting** |
| **v0.18.4a** | **2026-08-21** | **Production release — Admin and Dashboard UI improvements for navigation, project controls, asset tabs, and inline FarmBot management** |
| **v0.18.4b** | **2026-08-21** | **Production release — Dashboard surface cleanup for ThreeD routing, one Music player page, and unified Traffic source layers with linked map/list selection** |
| **v0.18.5a** | **2026-08-22** | **Production release — ThreeD character orchestration simulation with live Ecctrl range gating, target-facing animation sequencing, and client-only lifecycle status** |
| **v0.18.5b** | **2026-08-22** | **Production release — target-relative Ecctrl FarmBot navigation, aligned target focusing, and tested client orchestration lifecycle transitions** |
| **v0.18.6a** | **2026-08-22** | **Production release — ThreeD-owned Action Targets for Plantings, Beds, Characters, FarmBots, and Models with shared navigation, highlighting, lifecycle, and capability-filtered actions** |
| **v0.18.6b** | **2026-08-22** | **Production release — explicit owner-scoped ThreeD Project marker save/restore, Runtime Marker registry integration, Ecctrl live-position capture, and current-position Action Target resolution** |
| **v0.18.7a** | **2026-08-24** | **Production release — general ThreeD Model Library Project placements, owner-scoped CRUD, DRACO rendering, whole-asset collision, persistent Scene authority, and selective Scene Layer physics/debug control** |

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
- The retained in-progress `FarmBotPoller` now fails closed at `sendCommand()` and cannot use its former assumed REST command endpoint. Its read-oriented work remains available, while all physical commands wait for a separately approved command-safety adapter.
- Project-assigned FarmBot runtime markers now support the same DetailsCard **Use as Action Target**, focus, clear, stale-data cleanup, and green scene pulse behavior as Plantings. FarmBot-targeted character actions remain animation-only: existing Water/Harvest persistence still requires a Planting target, and no FarmBot REST/MQTT/peripheral command is enabled.
- While a FarmBot is targeted, the character DetailsCard exposes only the existing Point, Point Gesture, and Talk semantic animations and labels them as animation-only. Clearing that target restores the full palette, while Planting-targeted action and persistence paths remain unchanged.

The repository ignores generated `/drizzle` artifacts and continues to use an explicitly user-run `db:push` workflow. No environment file, ThreeD rendering path, character animation behavior, or World Action timing changed. Physical FarmBot commands remain disabled.

The approved phase sequence is now documented in `docs/developers/FARMBOT_INTEGRATION.md`: Phase 1 secure App foundation; Phase 2 separately run MQTT worker and read-only status; Phase 3 command safety and auditing; Phase 4 one-device Water pilot; and Phase 5 later ThreeD interaction expansion. Each phase requires its own approval. Phases 2A–2D were later approved and released as v0.18.1a; Phase 3 and every physical operation remain separately gated.

GitHub-to-Vercel production deployment and production smoke testing were confirmed on August 19, 2026. v0.18.0 remains the Phase 1 historical checkpoint; v0.18.1a later added read-only MQTT, and v0.18.1b established the provider-neutral MQTT control-layer boundary.

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

Status: Phases 2A–2D were individually approved, implemented, manually verified, and released to production as v0.18.1a. The released boundary is read-only; it does not authorize Phase 3, MQTT publishing, or physical commands.

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

### v0.18.5+ — Phase 5: ThreeD orchestration

- Add character approach and orientation, then use the established semantic animation path before submitting an audited FarmBot action request.
- Preserve FBX loading, semantic Animation Action Mapping, GardenCharacter and EcctrlCharacter separation, task-to-locomotion crossfades, DetailsCard controls, and existing Planting-targeted Water and Pick Fruit behavior.
- Keep MQTT ownership in the worker; ThreeD components display status and request approved semantic operations only.

Phase 5A was released to production as v0.18.5a. It adds an offline provider-independent approach/facing planner, requires Take Control and a live Ecctrl physics position before FarmBot interactions can enter range, keeps approach manual through WASD, and runs Point, Point Gesture, or Talk through the established semantic animation path. A facing tolerance avoids unnecessary turns; larger heading changes select one shortest-direction turn clip and reverse that same clip after the task to restore the prior direction. Browser-only request-ID correlation reports interacting, completed, or cancelled simulation state. No database schema, API route, MQTT publish, worker command, peripheral change, or physical FarmBot behavior is included.

Phase 5B was released to production as v0.18.5b. It moves browser interaction status changes into a tested provider-independent lifecycle policy with request-ID matching, terminal-state protection, idempotent duplicate completion, and timeout cancellation. While a controlled EcctrlCharacter has a FarmBot action target, WASD uses a live world-space character-to-target forward direction instead of the scene camera direction; `W` approaches, `S` retreats, and `A`/`D` strafe consistently across camera modes, orbit angles, perspective, and zoom. Focus Target aligns the stationary camera behind the character. Clearing the target restores ordinary camera-relative WASD. This release adds no schema, API, MQTT publish, worker command, peripheral change, or physical FarmBot behavior.

Phase 5C completed architecture hardening. The provider-independent orchestration core now owns the planar character-to-target distance and normalized world-space forward direction used by the approach planner, Ecctrl target-relative controls, and Focus Target camera placement. Offline validation covers all four cardinal approach directions and coincident planar positions. This step intentionally preserves v0.18.5b behavior and adds no new external or physical operation.

Phase 5D implements the ThreeD Marker Action Target correction. ThreeD—not FarmBot or Planting—owns target identity, navigation eligibility, generic interaction capabilities, highlighting, refresh reconciliation, and lifecycle. The scene produces Runtime Markers for Plantings, Beds, Characters, FarmBots, and Models; the provider-independent target registry recognizes all five and the default scene layers keep all five marker types renderable. Generic Point, Point Gesture, and Talk capabilities are separate from Planting-only farming actions. Capability declarations do not authorize persistence, MQTT publishing, worker commands, or physical operation.

### v0.18.5+ — Phase 6+: Controlled operation expansion

Add one semantic FarmBot operation at a time. Each operation needs separate prerequisites, bounds, server-side command construction, audit and acknowledgement behavior, timeout handling, and manual validation before another operation is introduced.

### Approval boundary

The overall phase sequence is approved, but each phase remains a separate implementation gate. The plan does not authorize database changes, external worker hosting, MQTT connections, MQTT publishing, or physical commands until the applicable phase is reviewed and explicitly approved.

### v0.18.1 Phase 2A design record

The proposed worker architecture is documented in `docs/developers/FARMBOT_MQTT_WORKER.md`. It uses a standalone, separately deployed TypeScript/Node.js service; HMAC-authenticated App-to-worker grants over TLS; in-memory credential and status handling; exact read-only `status` and `from_device` subscriptions; and no publish interface. The App remains responsible for credential decryption, owner checks, readiness, and later Project-asset authorization.

The initial runtime status is intentionally volatile and queried from the worker through a signed internal boundary, avoiding a database change in Phase 2. A local compatibility test must select the MQTT transport before a dependency is installed because FarmBot documents MQTT as the preferred non-browser protocol but does not production-test FarmBotJS in Node.js.

Phase 2A was a design-review checkpoint only and did not create a worker, external host, internal API, environment setting, MQTT socket, schema change, or physical operation. Phase 2B subsequently received separate approval and is recorded below.

### v0.18.1a Phase 2B implementation record

Phase 2A and Phase 2B were explicitly approved. ThreeD MQTT is a provider-neutral service boundary under `src/lib/services/threed/mqtt`: `core`, `transports`, and `worker` own shared MQTT behavior, while `integrations/farmbot` owns FarmBot grants, identities, topic rules, parsing, session policy, persistence mapping, and its executable entry point. Shared MQTT code does not import or name FarmBot. FarmBot REST/device configuration remains separately under `src/lib/services/threed/farmbot`. Offline validation covers signed request tampering and replay, short-lived identity-bound grants, one owner-bound session per App FarmBot, lifecycle and retry limits, exact read-only topics, bounded position extraction, redacted runtime status, shutdown, and a loopback-only internal HTTP boundary.

At the Phase 2B checkpoint, the executable used an intentionally unavailable transport and added no App route or durable runtime table. It still has no publish interface, MQTT library, deployed host, or live connection. The separately approved persistence step is recorded below; a subscribe-only adapter and any live read-only connection test remain gated.

### v0.18.1a normalized MQTT persistence and Admin activity

The user explicitly approved the empty MQTT tables being generalized as `threed_mqtt_runtime` and `threed_mqtt_events`. They identify their provider record through `integration_type` and `integration_id`; the FarmBot adapter uses `farmbot` and performs owner/FarmBot validation before access. The runtime table holds one current allowlisted snapshot per integration. The event table stores deduplicated lifecycle and normalized adapter events with payload byte counts and SHA-256 fingerprints. Credentials, complete status trees, raw MQTT payloads, arbitrary topics, and CeleryScript are excluded.

The worker batches normalized records to an HMAC-signed internal App endpoint using a separate optional worker-to-App key. The worker never receives Neon credentials. The App verifies FarmBot ID, owner, and canonical broker identity before transactional upsert/insert, limits each batch to 100 events, and removes history older than 30 days during ingestion. Unchanged position history is limited to a 30-second heartbeat and malformed traffic is aggregated. Credential replacement or removal clears current runtime while retaining history.

The FarmBot Admin row now opens **MQTT Activity**, showing current state, last message/status, position, expiry, stale state, counters, filterable cursor-paginated history, refresh, and owner-controlled cleanup. Browser clients cannot create or edit MQTT records. The user successfully generated and applied the approved schema through the reviewed Drizzle workflow.

### v0.18.1a Phase 2C read-only adapter

Phase 2C now includes a provider-neutral MQTT.js adapter behind the shared `MqttReadonlyTransport` interface. The non-browser FarmBot worker derives secure MQTT port 8883 from the validated token `mqtt` host, while retaining the separately validated `mqtt_ws` claim for diagnostics. It requests only the exact `status` and `from_device` topics at QoS 0, requires normal TLS certificate verification, disables MQTT.js reconnect/resubscribe behavior so the FarmBot registry remains the lifecycle authority, and exposes no publish method. Offline validation uses injected fake clients to verify the broker URL, credential handling, exact topic list, message forwarding, safe failure categories, and clean shutdown without contacting FarmBot.

The separately approved live-test boundary adds explicit `disabled`/`mqttjs` worker selection, registry-owned bounded reconnect attempts, a server-only signed App client, an authenticated owner/readiness-checked `mqtt-session` route, and Admin Start/Stop read-only controls. The default remains `disabled`; selecting MQTT.js requires explicit worker environment configuration and a user action. On August 20, 2026, the user confirmed the complete local Phase 2C read-only path after the non-browser adapter was corrected to use token-derived secure MQTT port 8883: broker connection, status timestamps, normalized X/Y/Z position, stale-state recovery, runtime/event persistence, and clean Stop all passed. No MQTT publishing, physical command, ThreeD character change, or World Action change is included.

### v0.18.1a Phase 2D authenticated App status display

The Dashboard FarmBot DetailsCard now reads a limited MQTT runtime summary through the existing authenticated FarmBot runtime route using the selected `projectId`. This mode requires the signed-in owner, owned active Project, active `project_threed` relationship, active `project_assets` FarmBot assignment, and active owned FarmBot to match. It displays connection state, state-change time, last message/status times, normalized device position, token expiry, and stale state. It does not add MQTT data to the public `/api/map/threed` response and does not return broker identity, worker session identity, event history, credentials, session controls, publishing, or physical commands to the Dashboard.

The MQTT/FarmBot separation schema was generated and applied successfully by the user. Shared transport and worker-authentication behavior now has its own provider-neutral `npm run validate:threed-mqtt` check using neutral topics and fabricated credentials. FarmBot grants, topics, parsing, lifecycle, and persistence remain covered separately by the FarmBot adapter validations.

### v0.18.1a production confirmation

The user confirmed the GitHub-to-Vercel production release on August 20, 2026. Its authoritative architecture name is **ThreeD MQTT Module: FarmBot Read-Only Adapter**. ThreeD owns the provider-neutral transport, worker authentication, runtime, and normalized event boundary; FarmBot is its first provider adapter. v0.18.1a is the historical read-only release boundary. At that checkpoint, Phase 3 command dispatch, MQTT publishing, and every physical FarmBot operation remained disabled.

### v0.18.2-alpha Phase 3A semantic command policy

Phase 3 received approval to begin incrementally. Its first isolated step adds a pure server-owned command-intent parser and lifecycle model. The initial semantic allowlist contains only `water`; client intent may provide only policy version, positive Project ID, semantic command, and a UUID v4 idempotency key. Unexpected fields—including pins, durations, coordinates, MQTT topics, CeleryScript, and arbitrary command names—are rejected. Emergency stop deliberately has no normal command-intent representation and remains reserved for an independent future path.

This policy is not connected to a browser route, database table, worker route, MQTT transport, ThreeD action, or FarmBot hardware. The existing command and Water routes continue to return `503`, and the MQTT transport remains read-only with no publish interface. `npm run validate:farmbot-command-policy` proves strict parsing and allowed lifecycle transitions offline. Audit persistence, command authorization, MQTT publishing, acknowledgement correlation, and physical testing remain separate approval gates.

### v0.18.2-alpha Phase 3B dormant command audit schema

The user explicitly approved the additive `threed_farmbot_commands` schema. Its declaration records server-generated command and idempotency UUIDs, owner/Project/FarmBot relationships, policy/action/state, optional server-resolved Water peripheral snapshots, RPC correlation, redacted rejection/fingerprint data, expiry, and lifecycle timestamps. Checks constrain the table to policy version 1, the `water` semantic action, known lifecycle states, bounded structural formats, complete positive Water snapshots, and expiry after request time. Emergency stop and raw MQTT/CeleryScript payloads are intentionally absent.

The table declaration and relations pass TypeScript. The user generated, reviewed, and pushed its additive migration to the intended database. At the Phase 3B checkpoint, no API, repository, worker, or browser path wrote it. Command authorization, dispatch, publishing, acknowledgement-driven state updates, and physical operation remain disabled.

### v0.18.2-alpha Phase 3C dormant request repository

The server-only FarmBot command repository can prepare and insert only the initial `requested` audit state. It re-parses the versioned semantic intent, generates the command UUID server-side, validates request/expiry times, and requires the same owner plus active Project, active ThreeD module relationship, active Project Asset assignment, and active owned FarmBot. Its unique owner/FarmBot/idempotency boundary returns the existing row only when the semantic request details match and otherwise fails closed. Owner-scoped command lookup is available for future internal use.

At the Phase 3C checkpoint, no App route, browser component, MQTT service, worker, World Action, or physical-device path imported this repository. It had no transition, dispatch, publish, peripheral, duration, coordinate, RPC-label, acknowledgement, or emergency-stop writer. The later approved Phase 3D transition is recorded below.

### v0.18.2-alpha Phase 3D dormant command validation policy

Phase 3D adds a pure offline Water validation policy. It accepts only an existing scoped `requested` record plus a server-loaded binding and its separately verified FarmBot REST inventory result. It enforces a 60-second request lifetime, one active command per FarmBot, an active matching Water binding, exact peripheral identity/pin/mode snapshots, output mode 0, a server-owned 5-second Water duration below a 10-second hard maximum, and a SHA-256 command fingerprint.

The approved repository increment can move a scoped request atomically from `requested` to `validated` or `rejected`. Before writing, it verifies the current FarmBot REST peripheral inventory, then rechecks owner/Project/ThreeD/Project Asset scope, binding identity, request state, expiry, and per-FarmBot concurrency inside a transaction protected by a FarmBot-scoped advisory lock. Validation failures store only a bounded rejection code; service or credential failures leave the request unchanged for a later retry.

At the Phase 3D checkpoint, no App route or browser component called this transition. The transition itself does not import ThreeD MQTT, publish a message, construct CeleryScript, allocate an RPC label, deliver work to the worker, acknowledge a command, or operate hardware. The later Phase 3E authorization route is recorded below.

### v0.18.2-alpha Phase 3E command authorization API

The authenticated `POST /api/threed/farmbots/commands` route now accepts a strict, size-limited `{ farmbotId, intent }` request. The nested intent retains the Phase 3A allowlist: policy version 1, positive Project ID, semantic command `water`, and a UUID v4 idempotency key. The route creates or reuses the scoped audit request and invokes Phase 3D validation. Its limited response omits binding IDs, peripheral IDs/pins, command fingerprints, credentials, broker data, and raw provider responses.

A successful response means only that the command reached `validated`; it explicitly returns `deliveryEnabled: false`. The route has no MQTT, worker, publish, RPC-label, CeleryScript, or hardware dependency. Direct FarmBot Water and Move routes remain `503`. Worker delivery, command acknowledgement, emergency stop, and physical testing remain separate approval gates.

### v0.18.2-alpha Phase 3F-A offline command delivery contract

The FarmBot MQTT adapter now has a pure, offline Water delivery builder based on FarmBot's documented MQTT/CeleryScript protocol. It accepts only a fully resolved, unexpired `validated` Water record. It derives the exact `from_clients` topic from the verified broker device ID, derives the RPC label from the server command UUID, and builds a fixed digital output sequence: Water on, wait exactly 5 seconds, Water off. The adapter also maps only a matching `rpc_ok` or `rpc_error` response to an acknowledgement result.

This contract is test-only preparation. The shared MQTT transport remains read-only, the worker has no command endpoint, worker health still reports `commandsEnabled: false`, and the App authorization response still reports `deliveryEnabled: false`. No repository transition calls the builder, no payload is published, and no real FarmBot operation is authorized by this increment. Timeout/off recovery and durable acknowledgement transitions must be designed before live delivery can be considered.

### v0.18.2-alpha Phase 3F-B offline timeout and Water-off recovery policy

The FarmBot adapter now has a pure acknowledgement-timeout evaluator. A dispatched Water command receives a 15-second acknowledgement window: the fixed 5-second operation plus a 10-second response grace period. Commands that are not in `dispatched` state do not time out through this policy. When a dispatched command reaches its deadline, the policy marks recovery as required.

The adapter can prepare a separate fixed Water-off RPC only for an already dispatched command, proven by a valid `dispatchedAt` timestamp and a state of `dispatched`, `timed_out`, or post-dispatch `rejected`. Its independent RPC label cannot be confused with the original Water request. A matching recovery `rpc_ok` or `rpc_error` is interpreted separately. Recovery deliberately does not depend on the expired request deadline.

At the Phase 3F-B checkpoint, this remained offline preparation with no timeout scheduler, repository transition, transport publish method, worker command route, or physical operation. Recovery-specific schema was not part of that increment. The later dormant lifecycle writers and additive recovery declaration are recorded below.

### v0.18.2-alpha Phase 3F-C dormant durable command lifecycle

The FarmBot command policy now prepares the remaining narrow audit transitions: `validated → accepted`, `accepted → dispatched`, matching `rpc_ok → acknowledged`, matching `rpc_error → rejected`, `acknowledged → completed`, and overdue `dispatched → timed_out`. Each transition validates its prior state and timestamp order. The primary RPC label is derived only from the stored server-generated command UUID.

The server repository exposes matching owner-scoped, transactionally locked methods. Acceptance and dispatch repeat active owner/Project/ThreeD/Project Asset/FarmBot checks before a future device boundary. Acknowledgement, completion, rejection, and timeout remain recordable after later Project deactivation so an already dispatched operation cannot lose its audit outcome. Conditional updates reject stale or repeated transitions.

These methods are dormant. No App route, browser component, worker endpoint, MQTT session, scheduler, or response observer calls them. The command API still stops at `validated`, MQTT remains read-only, and no physical operation is enabled. No schema or environment change is included.

### v0.18.2-alpha Phase 3F-D recovery audit schema declaration

The `threed_farmbot_commands` Drizzle declaration now includes a separate Water-off recovery lifecycle: `required`, `dispatched`, `confirmed`, or `failed`. Each non-null recovery record has a unique recovery RPC label and a required timestamp. Later states require ordered dispatch and resolution timestamps; failed recovery also requires a bounded error code. A database check prevents partial or mismatched recovery fields.

This is schema preparation only. It stores no MQTT topic, CeleryScript, raw payload, credential, or provider response. No repository method writes the new fields, and no scheduler, route, transport, worker, or hardware path consumes them. A generated migration must be reviewed before the user intentionally applies it to the intended database.

The user generated and pushed this additive schema successfully before Phase 3F-E began.

### v0.18.2-alpha Phase 3F-E dormant recovery lifecycle

The FarmBot lifecycle core now owns the deterministic recovery RPC label so the repository and MQTT adapter use the same server-derived identity without making the repository depend on MQTT. Pure transitions enforce `null → required → dispatched → confirmed/failed`, require proof of prior command dispatch, enforce timestamp order, and require an exact recovery RPC-label match for resolution.

The server repository exposes matching owner-scoped, transactionally locked, conditional writers. A recovery can become required only for a timed-out or post-dispatch rejected command. These recovery writes intentionally do not repeat active Project assignment checks: once a physical command has been dispatched, its Water-off safety audit must remain recordable even if the Project is later deactivated.

The recovery methods are dormant. No route, scheduler, worker, MQTT observer, transport, or browser component imports them. The shared transport remains read-only, worker health still reports commands disabled, and no physical command is enabled.

### Phase 4A signed Water worker-request contract

The first Phase 4 increment adds a pure parser for the future signed App-to-worker Water request. It accepts only an exact server-produced semantic snapshot: owner, App FarmBot, verified broker identity, command UUID, `accepted` state, resolved pin, fixed five-second duration, command fingerprint, server-derived RPC label, and expiry. It rejects extra fields including MQTT topics and CeleryScript, arbitrary durations, invalid pins, mismatched labels, and expired commands.

This contract has no server route, worker-client method, registry caller, transport publish method, environment switch, or physical operation. Worker health continues to report `commandsEnabled: false`.

### Phase 4B fail-closed signed worker command endpoint

The FarmBot worker now recognizes signed `POST /internal/v1/farmbots/:id/commands` requests. It applies the Phase 4A size and shape parser, requires the URL and body FarmBot IDs to match, and requires an existing connected, fresh worker session with the same owner and broker identity. Missing, mismatched, disconnected, or stale sessions fail before execution.

The endpoint is injected with `DisabledFarmBotWorkerCommandExecutor` by default and the production worker supplies no alternative. Valid requests therefore return `503`, health continues to report `commandsEnabled: false`, and the MQTT transport still has no publish method. There is no App worker-client caller, API orchestration, environment switch, or physical operation.

### Phase 4C dormant App-to-worker command client

The server-only FarmBot worker client can now prepare a signed `POST` to the Phase 4B endpoint. Before signing, it re-runs the strict Phase 4A parser and requires the function's FarmBot ID to match the request. It sends the normalized semantic snapshot rather than a caller-provided MQTT topic or CeleryScript.

No App route, command repository, coordinator, World Action, browser component, or scheduler calls this client. The worker still uses its disabled executor, health remains command-disabled, and the transport has no publish method.

### Phase 4D worker idempotency and concurrency gate

The worker command endpoint now wraps its injected executor in a process-local command gate. It claims each command UUID before execution, rejects active or changed duplicate requests, and permits only one active command per FarmBot. A completed execution remains claimed. An unknown executor failure also remains claimed because its delivery outcome could be uncertain; only the known disabled-executor failure releases the unused claim.

This gate supplements the database command audit and per-FarmBot locks; it does not replace them or provide durable cross-restart state. No automatic retry exists. The production executor remains disabled, worker health remains command-disabled, and the MQTT transport still exposes no publish method.

### Phase 4E offline acknowledgement correlation

After a future executor reports successful delivery, the worker gate can now retain the exact owner, FarmBot, command UUID, and RPC label as a pending correlation. The existing read-only FarmBot response path forwards normalized `rpc_ok` and `rpc_error` responses to the gate. Only the exact FarmBot and RPC label can settle the pending item, and a label can settle only once.

The correlated result contains only normalized audit fields and is not yet sent to the App or written to the command table. Unknown and unrelated FarmBot responses continue through ordinary MQTT event persistence without changing command state. The production executor remains disabled, so no pending physical command is created in normal runtime; publishing and hardware remain unavailable.

### Phase 4F-A signed acknowledgement ingestion

The App now exposes a worker-only HMAC-protected acknowledgement endpoint with a 1 KiB strict payload limit. It accepts only the normalized Phase 4E identity, acknowledged/rejected state, matching bounded rejection code, and a valid response timestamp that is not materially in the future. It verifies the owner, command UUID, and FarmBot relationship before calling the existing locked acknowledgement repository transition.

Matching acknowledgement retries are idempotent inside the repository transaction. Phase 4I-A later advances a successful acknowledgement to completion. The endpoint returns only command UUID and state. No raw MQTT payload, topic, CeleryScript, credential, or provider response is accepted or returned. The worker has no reporter for this endpoint yet, the executor remains disabled, and no physical command is possible.

### Phase 4F-B queued acknowledgement reporter

The worker correlation gate now sends its normalized one-time result to a dedicated acknowledgement sink. When the existing worker-to-App URL and HMAC key are configured, the HTTP sink signs the strict Phase 4F-A body, queues one result per command UUID, retries failures with bounded exponential backoff, and flushes during worker shutdown. With neither setting configured, a disabled sink preserves the prior behavior; partial configuration fails worker startup.

This reporter reuses the established private worker settings and adds no environment variable. It sends no raw MQTT payload, topic, CeleryScript, credential, or status tree. The production command executor remains disabled, so normal runtime still cannot create an acknowledgement to report, and MQTT publishing remains unavailable.

### Phase 4G-A strict worker acceptance response

The dormant App-to-worker Water client now treats a successful HTTP status as insufficient proof of worker acceptance. It requires an exact success envelope containing the same command UUID and server-derived RPC label that were submitted, plus a valid worker acceptance timestamp. Extra fields, identity mismatches, malformed timestamps, and timestamps more than 60 seconds from the App clock fail closed.

This response boundary is preparation for later delivery coordination only. No route, repository transition, browser component, World Action, or scheduler calls the command client. The production executor remains disabled, worker health continues to report commands disabled, and the MQTT transport still exposes no publish method.

### Phase 4G-B accepted-record worker mapper

A pure FarmBot MQTT adapter mapper now converts an accepted database command snapshot and separately verified broker identity into the strict Phase 4A worker request. It selects only the fields needed by the worker and reuses the strict parser to enforce policy version 1, accepted lifecycle state, fixed Water duration, resolved pin, command fingerprint, derived RPC label, valid acceptance/expiry times, owner identity, and broker identity.

The mapper does not query or mutate the database and has no route or coordinator caller. It does not accept a browser payload, transition a command, contact the worker, publish MQTT, or operate hardware.

### Phase 4G-C dormant delivery-context read

The FarmBot command repository can now load an accepted command together with its canonical broker identity for later delivery preparation. The owner-scoped read uses the existing per-FarmBot advisory lock, rechecks the active Project, ThreeD module, Project Asset, and FarmBot relationship, and requires policy version 1, Water semantics, accepted state, a valid acceptance timestamp, an unexpired request, and a valid stored broker device identity.

This read does not transition the audit record or contact the worker. No route, coordinator, World Action, component, or scheduler calls it, and it adds no schema, MQTT publish method, or physical behavior.

### Phase 4G-D dormant worker handoff

A server-only FarmBot MQTT handoff now composes the owner-scoped delivery-context read, accepted-record mapper, signed worker client, and strict worker acceptance response. Its testable core rejects a context whose owner or command identity differs from the requested audit record and rechecks the returned command, RPC label, and worker timestamp. Its limited result means only that the worker accepted the request; it does not mean MQTT dispatch, device acknowledgement, Water completion, or success.

No route, command API, World Action, component, or scheduler calls this handoff. It does not update the audit record to `dispatched`. The production worker executor remains disabled, so the handoff cannot reach MQTT publishing or hardware in normal runtime.

### Phase 4G-E recoverable worker receipt

The process-local command gate now retains the normalized three-field receipt after a successful executor result. If the App loses the HTTP response, an exact retry of the complete signed command snapshot returns that original receipt without invoking the executor again. Active retries, changed requests using the same command UUID, and retries after uncertain failures remain conflicts. Disabled-executor failures still release their unused claim.

This recovery is process-local and does not survive worker restart. It adds no automatic retry or durable worker database. The production executor remains disabled, no caller invokes the dormant handoff, and no MQTT publish method or physical operation is enabled.

### Phase 4G-F dormant worker-dispatch audit writer

The command repository now has a separate owner-scoped writer for recording a verified worker handoff receipt as `dispatched`. It requires the exact stored RPC label and uses the worker acceptance timestamp as the dispatch audit time under the existing per-FarmBot advisory lock and conditional state update. An exact retry may return an already dispatched or later post-dispatch record, while a changed label or timestamp fails.

Active Project assignment is intentionally checked by acceptance and the delivery-context read before the external handoff, not again by this post-handoff audit writer. Once the worker may have acted, Project deactivation must not prevent recording what happened. The writer has no caller and does not contact the worker, publish MQTT, enable commands, or operate hardware.

### Phase 4G-G dormant dispatch coordinator

A server-only coordinator now sequences the dormant worker handoff before the worker-dispatch audit writer. It independently verifies the requested owner and command UUID, the server-derived RPC label, the worker timestamp, and the returned audit identity, timestamp, and post-dispatch state. An invalid handoff receipt is rejected before the writer is called. Its result reports the persisted dispatch audit state, not device acknowledgement or operation success.

The coordinator accepts only an already accepted command and has no route, command API, World Action, component, or scheduler caller. The production worker executor remains disabled, so this dormant composition cannot publish MQTT or operate hardware.

### Phase 4G-H dormant validated-to-dispatch pilot

A higher-level server-only pilot coordinator now sequences the existing `validated → accepted` repository transition before the dormant dispatch coordinator. It takes only owner and command UUID, verifies the returned policy version, Water semantics, accepted state, derived RPC label, acceptance/expiry times, and final post-dispatch identity/state/timestamp before returning a limited audit result.

The pilot has no route, command API, World Action, component, or scheduler caller. A failed worker handoff may leave the durable command in `accepted`, which is intentional and prevents the App from claiming dispatch without a verified worker receipt. The production executor remains disabled, so this path cannot publish MQTT or operate hardware.

### Phase 4I-A acknowledgement completion coordination

The authenticated worker acknowledgement endpoint now uses a strict coordinator after its existing HMAC, nonce, owner, and FarmBot checks. A matching `rpc_ok` first records `acknowledged` and then records `completed` at the same verified response time because FarmBot's response covers the complete fixed Water on/wait/off request. A matching `rpc_error` records `rejected` and never calls completion. Exact completed or rejected retries are idempotent.

The endpoint still accepts only normalized acknowledgement data and returns only command UUID and final state. Commands and MQTT publishing remain disabled, so this lifecycle completion cannot be reached from a physical operation in normal runtime yet.

### Phase 4I-B dormant timeout/recovery requirement

A server-only timeout coordinator now sequences the existing acknowledgement deadline transition before marking Water-off recovery as required. It verifies owner and command identity, `timed_out` plus `ack_timeout`, the original dispatch time, the 15-second deadline, terminal time, deterministic recovery RPC label, and recovery-required time. Invalid timeout output cannot reach the recovery writer.

The timeout and recovery-required repository transitions now support exact continuation after a partial coordinator failure. No scheduler, route, worker call, recovery handoff, MQTT publish, or hardware action invokes this coordinator. `recoveryState: required` remains an audit/safety obligation only; it does not claim that Water-off was sent.

### Phase 4I-C Water-off recovery request contract

A pure FarmBot MQTT adapter contract now maps a required recovery audit record into a strict worker-safe Water-off request. It requires the original policy-version-1 Water command, timed-out or post-dispatch rejected state, resolved fixed-duration snapshot, original dispatch time, `recoveryState: required`, deterministic recovery RPC label, and ordered recovery-required time. The request contains only owner/device/command identity, fixed output pin, command fingerprint, recovery state/label, and required time.

The recovery request deliberately has no expiry because a recorded safety obligation must remain actionable until resolved; its required time cannot be materially in the future. It contains no MQTT topic, CeleryScript, duration, pin value, mode, arbitrary command, or browser field. No route, worker endpoint, client, repository caller, publisher, or hardware behavior uses it yet.

### Phase 4I-D disabled Water-off recovery endpoint

The signed FarmBot worker server now exposes a separate `POST /internal/v1/farmbots/:id/recoveries` boundary for the strict Phase 4I-C request. It requires the exact JSON contract, matching path and body FarmBot identity, and the existing connected, fresh owner/broker-scoped session before invoking an injected recovery executor.

Production injects only `DisabledFarmBotWorkerRecoveryExecutor`, so a valid request returns `503` and cannot reach MQTT or hardware. Recovery is intentionally separate from the normal command execution gate and acknowledgement tracker. There is no App recovery client or coordinator caller, worker health remains `commandsEnabled: false`, and the transport still exposes no publish method.

### Phase 4I-E dormant Water-off recovery client

The server-only FarmBot worker client can now prepare and sign a strict request to the Phase 4I-D `/recoveries` endpoint. Its submission builder requires the path FarmBot ID to match the body, re-runs the Phase 4I-C parser, and sends only the normalized Water-off recovery snapshot. A strict response parser accepts only the matching command UUID, recovery RPC label, and a worker acceptance timestamp within the allowed clock window.

No route, scheduler, repository workflow, timeout coordinator, World Action, or browser component calls this client. The worker recovery executor remains disabled and returns `503`, worker health reports `commandsEnabled: false`, and the transport has no publish method.

### Phase 4I-F dormant recovery delivery context

The FarmBot command repository can now load a required Water-off recovery audit together with its canonical broker identity under the existing owner scope, transaction, and per-FarmBot advisory lock. It requires policy version 1, original Water semantics, proof of dispatch, timed-out or post-dispatch rejected state, exact deterministic recovery label, `recoveryState: required`, and ordered recovery time.

This post-dispatch safety read deliberately does not require an active Project Asset assignment or an active FarmBot row. Deactivation must not erase or block an already recorded Water-off obligation. The FarmBot record must still exist under the same owner and retain a valid broker identity. No coordinator, client, route, scheduler, publisher, or hardware path calls this repository read yet.

### Phase 4I-G dormant recovery handoff

A server-only recovery handoff now composes the Phase 4I-F owner-scoped context read, Phase 4I-C strict required-record mapper, Phase 4I-E signed worker client, and strict recovery receipt. Its pure coordinator normalizes owner and command identity, rejects a mismatched context before any worker call, and verifies the returned command UUID, deterministic recovery RPC label, and bounded worker timestamp.

The limited result means only that the worker accepted the Water-off recovery request. It does not mean recovery was published, dispatched, acknowledged, confirmed, or completed. No route, scheduler, timeout workflow, World Action, or browser component calls this handoff. The worker recovery executor remains disabled and no MQTT publish method exists.

### Phase 4I-H recovery dispatch audit writer

The dormant recovery dispatch repository writer now accepts only a verified worker receipt: owner, command UUID, exact stored recovery RPC label, and worker acceptance timestamp. Under the existing per-FarmBot lock, it records `required → dispatched` using that worker timestamp. An exact retry may return an already dispatched, confirmed, or failed recovery; a changed label or timestamp fails.

The earlier permissive time-only writer interface was removed before it gained a caller. This post-handoff audit remains recordable after Project or FarmBot deactivation because it records an external attempt that may already have occurred. No coordinator calls the writer yet, and it does not contact the worker, publish MQTT, or operate hardware.

### Phase 4I-I dormant recovery dispatch coordinator

A server-only coordinator now sequences the dormant Water-off recovery handoff before the verified recovery dispatch audit writer. It validates owner and command identity, the deterministic recovery label, and bounded worker timestamp before allowing the write. It then requires the persisted audit to retain the same command, label, timestamp, and a dispatched or resolved recovery state.

The coordinator result represents a recorded worker-acceptance audit only; it does not prove MQTT publication, FarmBot receipt, Water-off acknowledgement, or recovery resolution. Its server wrapper has no route, scheduler, timeout workflow, World Action, or browser caller. The worker recovery executor remains disabled and no publish method exists.

### Phase 4I-J recovery executor receipt validation

The worker recovery endpoint now validates an injected executor result before returning `202`. The result must contain exactly the original command UUID, deterministic recovery RPC label, and an ISO acceptance timestamp within 60 seconds of the worker clock. Extra fields, changed identities, malformed dates, and excessive clock skew fail closed with a limited `502` response.

This is defense at the worker boundary in addition to the App client's strict receipt parser. Production still injects only the disabled recovery executor, so the validation cannot receive a successful runtime result. This step adds no execution gate, MQTT publisher, physical command, App caller, schema, or environment switch.

### Phase 4I-K recovery idempotency/concurrency gate

The worker recovery endpoint now wraps its injected executor in a process-local recovery gate. It claims the command UUID before execution, permits only one active recovery per FarmBot, rejects active or changed duplicates, and retains uncertain failures. After a successful validated result, an exact retry returns the original normalized receipt without invoking the executor again. The known disabled-executor failure releases its unused claim because no delivery occurred.

The gate is process-local and does not survive worker restart. It currently arbitrates recovery requests only; shared arbitration between normal Water and Water-off recovery remains required before either executor may be enabled. Production still injects disabled command and recovery executors, health remains command-disabled, and no MQTT publish method or physical operation exists.

### Phase 4I-L shared worker device arbiter

The normal Water command gate and Water-off recovery gate now share one process-local per-FarmBot execution arbiter inside the worker server. While either flow is active for a FarmBot, the other fails before reaching its executor. Each gate retains its own command/recovery identity, receipt, retry, and uncertain-outcome rules, while the shared arbiter owns only device-level mutual exclusion.

The arbiter does not survive worker restart and does not replace the database advisory lock or durable command audit. Both production executors remain disabled, worker health remains command-disabled, and the transport still has no publish method or physical operation.

### Phase 4I-M recovery RPC correlation

After a future recovery executor returns a valid receipt, the recovery gate now tracks the exact owner, FarmBot, command UUID, and deterministic recovery RPC label. The existing normalized FarmBot response path offers each `rpc_ok` or `rpc_error` to both the normal-command and recovery observers. Only the matching FarmBot and recovery label can settle the recovery, and settlement occurs once.

A matching `rpc_ok` produces a normalized `confirmed` recovery result; `rpc_error` produces `failed` with the bounded recovery error code. Unknown labels remain ordinary read-only MQTT events. Recovery results are not yet reported to the App or written to the database. Both executors remain disabled and no MQTT publish or physical operation exists.

### Phase 4I-N signed recovery acknowledgement ingestion

The App now exposes a separate worker-only HMAC-protected recovery acknowledgement endpoint with a strict 1 KiB payload limit. It accepts only owner/FarmBot/command identity, the deterministic recovery RPC label, confirmed/failed state with the matching bounded error code, and a valid response timestamp. It verifies command ownership and FarmBot scope before calling the existing locked recovery acknowledgement writer.

Matching confirmed or failed retries are idempotent inside the repository transaction. The endpoint returns only command UUID and recovery state. The worker has no recovery acknowledgement sink or caller for this endpoint yet. Both executors remain disabled, and no raw MQTT payload, topic, credential, publish method, or physical operation is involved.

### Phase 4I-O queued recovery acknowledgement reporting

The worker now has a separate recovery acknowledgement reporter for the Phase 4I-N App endpoint. After the recovery gate correlates one exact `rpc_ok` or `rpc_error`, it queues the normalized owner/FarmBot/command identity, deterministic recovery RPC label, resolved state, bounded error code, and response time. The reporter signs each request with the existing worker-to-App HMAC boundary, retains failed deliveries for bounded retry, and is flushed with the normal command acknowledgement queue during worker shutdown.

The recovery reporter reuses `THREED_MQTT_APP_BASE_URL` and `THREED_MQTT_WORKER_TO_APP_HMAC_KEY`; partial configuration fails worker startup. Recovery data remains separate from normal command acknowledgements and contains no raw MQTT payload, topic, credential, or browser field. Production still injects disabled command and recovery executors, worker health remains command-disabled, and no MQTT publisher or physical operation exists.

### Phase 4I-P strict recovery persistence receipt

The recovery reporter now removes a queued result only after the App returns the exact success envelope, matching command UUID, and matching confirmed/failed recovery state. An HTTP success with malformed, extra, or mismatched data is treated as an unsuccessful delivery and retained for bounded retry, just like a non-success status or network failure.

This receipt confirms only that the normalized recovery result reached the App persistence boundary. It does not prove MQTT publication, FarmBot receipt, or a physical Water-off operation. Both production executors remain disabled, worker health remains command-disabled, and no MQTT publisher or hardware behavior is added.

### Phase 4J strict command persistence receipt

The normal command acknowledgement reporter now requires the exact App persistence response before removing a queued result. A normalized `acknowledged` RPC must return the matching command UUID in final `completed` state, while a normalized `rejected` RPC must return the matching UUID in `rejected` state. Malformed, extra, false-success, changed-identity, or changed-state responses remain queued for bounded retry even when the HTTP status is successful.

This closes the reporting-reliability difference between normal command and recovery acknowledgements. It does not enable command execution, MQTT publishing, timeout scheduling, or physical behavior. Both production executors remain disabled and worker health remains command-disabled.

### Phase 4K-A strict worker timeout report contract

A pure FarmBot adapter contract now defines the only timeout report a future worker deadline monitor may send to the App. It contains only version, owner/FarmBot/command identity, the server-derived primary RPC label, worker acceptance time, observed timeout time, and fixed `ack_timeout` reason. The observed time must be at least the established 15-second Water acknowledgement window after acceptance and cannot be materially in the future.

The 1 KiB contract excludes MQTT topics, payloads, CeleryScript, credentials, pins, duration input, recovery instructions, and browser fields. No gate, timer, reporter, route, repository writer, scheduler, or recovery handoff consumes it yet. Both executors remain disabled and no MQTT publisher or physical operation exists.

### Phase 4K-B authenticated timeout ingestion

The App now exposes a worker-only HMAC-protected timeout endpoint with the Phase 4K-A 1 KiB body limit. Before recording anything, a pure ingestion coordinator loads the owner-scoped command and requires the exact FarmBot, primary RPC label, worker acceptance/dispatched time, and a state of dispatched or already timed out. It then invokes the established timeout coordinator, which durably records `timed_out` and makes Water-off recovery required with the deterministic recovery label.

The endpoint supports safe continuation after a partial or repeated write and returns only command and recovery lifecycle identity. Completed, acknowledged, rejected, wrong-device, wrong-label, and wrong-time reports fail before the writer. No worker reporter, deadline timer, scheduler, automatic recovery handoff, MQTT publisher, or physical operation calls this endpoint yet; both production executors remain disabled.

### Phase 4K-C queued timeout reporting

A separate dormant worker timeout sink now signs the strict Phase 4K-A report for the Phase 4K-B App endpoint. It queues by command UUID, retains failed deliveries with bounded retry, and requires an exact App receipt before removal: matching command UUID, `timed_out` command state, deterministic recovery RPC label, and an allowed required/dispatched/confirmed/failed recovery state. A malformed or mismatched successful HTTP response remains queued.

The sink reuses the existing App base URL and worker-to-App HMAC key, remains disabled when neither is configured, and fails on partial configuration. No execution gate calls it and no deadline timer or scheduler exists yet. Both executors remain disabled; this adds no automatic recovery handoff, MQTT publisher, or physical operation.

### Phase 4K-D process-local acknowledgement deadline

After a future command executor returns a validated receipt, the worker command gate now registers the established 15-second acknowledgement deadline using the worker acceptance time. The exact matching RPC response cancels the deadline before normal acknowledgement reporting. If the deadline wins, the monitor removes that RPC correlation and queues one normalized timeout report; a later RPC response remains an ordinary event and cannot complete the timed-out command. Early timer wakeups re-arm for the remaining interval.

Production composes the monitor with the Phase 4K-C sink and flushes the timeout and acknowledgement queues during shutdown. The timer is process-local and pending deadlines do not survive worker restart; durable restart reconciliation remains required before live execution. Because the production command executor is still disabled, no deadline can currently be registered. No automatic recovery handoff, MQTT publisher, or physical operation is enabled.

### Phase 4K-E dormant durable timeout reconciliation

The App repository can now load at most 100 dispatched commands whose stored dispatch time has passed the established 15-second acknowledgement deadline, ordered oldest first. A server-only reconciliation coordinator validates every candidate's owner, FarmBot, UUID, derived primary RPC label, dispatched state, and deadline before invoking the existing timeout-and-recovery-required transition. A command that acknowledges between the read and locked transition is safely counted as skipped so one race does not abort the bounded batch.

This closes the data design needed to recover deadlines after a worker restart without giving the worker database access. The existing `(farmbot_id, state)` index supports the early-stage bounded query; a dedicated state/time index may be considered only if command volume later warrants it. The reconciler has no route, startup hook, interval, or worker caller yet. Both executors remain disabled, and no automatic recovery handoff, MQTT publisher, schema change, or physical operation is introduced.

### Phase 4K-F worker-triggered timeout reconciliation

A private worker-to-App HMAC endpoint now accepts only an exact versioned reconciliation request with a limit from 1 through 100. The worker runner makes one startup request and then checks every 30 seconds with production limit 50. Calls never overlap, failures wait for the next interval, and shutdown stops the interval and waits for the active request. The strict response requires nonnegative examined/reconciled/skipped counts whose sum is consistent.

The App, not the worker, performs the bounded database query and lifecycle transitions; the worker receives only aggregate counts and no command rows or database access. This trigger may update overdue dispatched audits to timed out with recovery required, but it does not hand off recovery, publish MQTT, or operate hardware. Both executors remain disabled. It reuses the existing App URL and worker-to-App HMAC key and adds no schema or environment setting.

### Phase 4L-A emergency Water-off request contract

A pure FarmBot worker contract now defines a separate `emergency_water_off` request that does not depend on a normal command UUID, recovery state, Project World Action, character animation, or action completion. It carries only owner/FarmBot/broker identity, a server-generated emergency UUID, server-resolved Water peripheral pin, deterministic emergency RPC label, request time, and an exact 60-second lifetime. The strict 1 KiB parser rejects extra fields, changed identity, arbitrary semantics, invalid pins, changed lifetimes, and expired requests.

The request includes no MQTT topic, payload, CeleryScript, pin value/mode, duration, coordinates, credential, or browser field. It has no route, repository, executor, gate, worker client, publisher, or UI caller. Recording every emergency request and outcome will require a durable audit design; because the existing command table intentionally allows only normal Water commands, any new emergency audit table or fields require separate schema approval before implementation.

### Phase 4L-B emergency audit schema declaration

The user explicitly approved the additive `threed_farmbot_emergency_actions` declaration. It is independent from Project and normal command records and stores only emergency UUID, owner/FarmBot identity, policy/action/state, optional saved-binding reference with immutable peripheral snapshots, deterministic emergency RPC label, bounded outcome code, exact 60-second expiry, and ordered lifecycle timestamps. States are limited to requested, validated, accepted, dispatched, acknowledged, failed, rejected, or expired.

Database checks require complete Water-output snapshots for validated and later execution states, fixed mode 0, valid UUID/RPC/error formats, exact expiry, and state-consistent timestamps. Removing a saved binding sets only the foreign key to null while preserving audit snapshots. No credential, broker topic, payload, CeleryScript, arbitrary JSON, Project dependency, or browser instruction is stored. The user reviewed, generated, and pushed the additive database change successfully.

### Phase 4L-C emergency audit lifecycle policy

A standalone pure policy module now prepares the ordered emergency audit transitions: requested, validated, accepted, dispatched, and acknowledged or failed. Rejected and expired remain separate terminal paths available only before acceptance. Request identity is server-owned, RPC identity is derived from the emergency UUID, expiry is fixed at 60 seconds, and validation requires an active owner/FarmBot-matched Water binding with immutable positive peripheral snapshots and output mode 0.

Acknowledgement requires the exact derived RPC label; an error outcome becomes failed with a bounded error code rather than a successful result. This step has no repository writer, route, worker handoff, MQTT publisher, UI control, or hardware behavior. Those remain later approval boundaries.

### Phase 4L-D dormant emergency audit repository

A server-only repository now persists the independent emergency lifecycle without adding a runtime caller. It generates the emergency UUID on the server, creates a requested record only for an owned FarmBot, loads records only through owner and emergency identity, resolves the current owner/FarmBot Water binding into immutable mode-0 snapshots, and records rejected or expired validation outcomes.

Accepted, dispatched, acknowledged, and failed transitions reuse the pure Phase 4L-C policy. Every mutation runs under the same per-FarmBot advisory transaction lock used by normal command audits, includes owner and exact prior-state conditions, and permits only exact idempotent retries. Project assignment is deliberately absent so a safety audit cannot be interrupted by animation, World Action, or later Project deactivation. The repository has no route, worker handoff, MQTT publisher, UI caller, or physical behavior.

### Phase 4L-E dormant emergency delivery context and mapper

The repository can now read an accepted emergency audit under its owner and shared per-FarmBot transaction lock, require complete mode-0 Water snapshots and an unexpired acceptance, and return the canonical verified broker identity from the owned FarmBot. It deliberately does not require active Project assignment or FarmBot activation after the emergency audit has been accepted.

A pure FarmBot adapter mapper converts only that accepted audit and broker identity into the existing strict emergency worker request. It rechecks policy/action/state, timestamps, mode 0, server-derived RPC identity, exact 60-second expiry, pin shape, and `device_<number>` broker identity through the strict parser. No handoff, signed client call, worker endpoint caller, dispatch write, MQTT publisher, UI control, or physical behavior is added.

### Phase 4L-F dormant signed emergency worker client

The strict emergency request now has a path/body submission builder for `POST /internal/v1/farmbots/:id/emergencies`, and the server-only FarmBot worker client can sign that normalized request through the existing ThreeD MQTT worker HMAC boundary. A separate strict response parser accepts only success plus the exact emergency UUID, deterministic emergency RPC label, and an ISO worker acceptance timestamp within 60 seconds of the App clock.

The worker server does not expose the emergency path, and no handoff, repository coordinator, route, scheduler, World Action, or component calls the submit function. The client therefore cannot run in production. Dispatch is not recorded, both existing executors remain disabled, worker health remains command-disabled, and no MQTT publisher or physical action is introduced.

### Phase 4L-G disabled signed emergency worker endpoint

The FarmBot worker now recognizes authenticated `POST /internal/v1/farmbots/:id/emergencies` requests. It requires exact JSON content type, the 1 KiB Phase 4L-A payload limit, strict request parsing, matching path/body FarmBot identity, and the existing connected, fresh owner/broker-scoped command session before invoking a dedicated emergency executor.

Production injects only `DisabledFarmBotWorkerEmergencyWaterOffExecutor`, so a valid request returns `503` and cannot reach MQTT or hardware. Even an injected test executor must return only the matching emergency UUID, deterministic RPC label, and bounded ISO acceptance time or the endpoint fails with `502`. No execution gate, publisher, dispatch coordinator, App handoff caller, UI control, schema change, or physical action is added, and worker health remains `commandsEnabled: false`.

### Phase 4L-H emergency idempotency and shared arbitration

A process-local emergency execution gate now claims each emergency UUID before executor entry and joins the same per-FarmBot arbiter used by normal Water and recovery. An active emergency blocks normal and recovery execution for that FarmBot, while an active normal command blocks emergency execution. An exact completed emergency retry reuses its original validated worker receipt; a changed duplicate or second active operation is rejected.

Only the known disabled-executor error releases an unused emergency claim because it proves no delivery attempt occurred. Invalid or uncertain executor outcomes remain claimed. This memory-only defense does not survive worker restart and does not replace the durable emergency audit or database locks. Production still injects the disabled executor, worker health remains command-disabled, and there is no acknowledgement observer, MQTT publisher, App handoff caller, UI control, or physical behavior.

### Phase 4L-I emergency RPC acknowledgement correlation

After a future emergency executor returns a valid receipt, the emergency gate now tracks the exact owner, FarmBot, emergency UUID, and deterministic RPC label in worker memory. The existing normalized FarmBot response stream offers each RPC response to the emergency gate after continuing its established event persistence. Only the matching FarmBot and RPC label can settle the pending emergency, and malformed response times are ignored without clearing it.

One matching `rpc_ok` becomes an in-memory acknowledged result with no error; one matching `rpc_error` becomes failed with the bounded `farmbot_emergency_rpc_error`. The tracked label is removed after the first result, so repeated responses cannot settle twice. No acknowledgement sink, App endpoint, repository outcome caller, MQTT publisher, UI control, or physical behavior is added. Production execution remains disabled, so normal runtime cannot create a pending emergency correlation.

### Phase 4L-J authenticated emergency acknowledgement ingestion

The App now has a private worker-to-App endpoint for a future normalized emergency result. It requires the existing ThreeD MQTT worker HMAC signature and replay protection, exact JSON, a 1 KiB body limit, a server-derived emergency RPC label, consistent acknowledged/failed error fields, an ISO receive time no more than 60 seconds in the future, and owner/FarmBot/emergency scope before invoking the established emergency audit outcome writer.

Successful ingestion returns only the emergency UUID and stored terminal state. The worker has no emergency acknowledgement reporter or sink and does not call this endpoint; its current in-memory result is still discarded after observation. Production emergency execution remains disabled, worker health remains command-disabled, and this step adds no MQTT publisher, UI control, schema change, or physical operation.

### Phase 4L-K queued emergency acknowledgement reporting

The worker now gives an exactly correlated emergency RPC result to a dedicated process-local acknowledgement sink. The HTTP implementation signs the strict Phase 4L-J payload, queues by emergency UUID, retries failed delivery with bounded backoff, and removes an item only after the App returns the exact emergency UUID and matching acknowledged/failed terminal state. Malformed, extra, false-success, changed-identity, or changed-state receipts remain queued.

Production creates this sink from the existing App URL and worker-to-App HMAC settings and flushes it during shutdown. The production emergency executor remains disabled, so normal runtime cannot create a report. The queue is process-local and does not survive worker restart. This step adds no schema, MQTT publisher, UI control, enabled executor, or physical operation, and worker health remains command-disabled.

### ThreeD MQTT module authority

ThreeD is the parent application module. `src/lib/services/threed/mqtt` and the generic `threed_mqtt_runtime`/`threed_mqtt_events` tables are provider-neutral. FarmBot depends on that service through its adapter; the MQTT service does not import FarmBot. A future OpenFarm service belongs beside FarmBot under ThreeD and must map external crop data into owned local ThreeD records without becoming an MQTT or FarmBot dependency. `npm run validate:threed-mqtt` now enforces the provider-import direction for the generic MQTT directory.

The first approved ThreeD MQTT control-layer increment adds the provider-neutral `MqttReadonlyIntegrationAdapter`. It defines integration identity, declared read-only capabilities, transport connection configuration, exact accepted-topic recognition, and normalized inbound messages. FarmBot implements that contract in its own service directory and its existing session registry delegates provider-specific connection/topic/parsing rules to it.

The next isolated control-layer increment adds a pure provider-neutral read-only session lifecycle core. ThreeD MQTT now owns the shared connection-state vocabulary, timestamped transitions, token-expiry checks, reconnect limits, error fallback, and capped exponential backoff decisions. The FarmBot registry consumes this policy while retaining its FarmBot grant scope, in-memory session ownership, event and position mapping, persistence records, and external API/worker behavior. No route, persistence shape, publish method, physical command, schema, or environment change is part of these control-layer increments.

A subsequent increment adds `MqttReadonlySessionController`. It composes one injected provider grant, adapter, read-only transport, expiry accessor, clock, retry policy, and observer hooks. Its neutral tests cover start/stop, accepted and rejected messages, malformed approved-topic payloads, reconnect, already-expired grants, stale callback rejection, and closing a transport that finishes connecting after the session was stopped. After the structure milestone, the FarmBot registry was moved onto this controller through provider-owned observer hooks. FarmBot still owns grant replacement, owner scope, worker session IDs, position freshness, normalized event mapping, persistence, and credential clearing. Parity validation asserts the established lifecycle record sequence, reconnect behavior, message timestamps, invalid counts, position/RPC records, and cleanup. This adds no route, worker endpoint, MQTT publish method, command, schema, or environment behavior.

Feature development then paused for an approved structure-only milestone. The mixed flat/provider-first MQTT files were reorganized under one protocol-first parent: `mqtt/core`, `mqtt/transports`, `mqtt/worker`, and `mqtt/integrations/farmbot`. FarmBot REST credentials, token, connection, peripheral, readiness, and command-policy services remain under `threed/farmbot` because they are not MQTT infrastructure. Package scripts and App/API imports now target the new paths. The structure step changes no route URL, schema, persistence shape, MQTT topic, runtime behavior, publish capability, command behavior, or environment setting. The older flat `DataService` and poller files remain unchanged for a later milestone.

### v0.18.1b production confirmation

The user confirmed the GitHub-to-Vercel production release and successful validation of **v0.18.1b — ThreeD MQTT Control Layer** on August 20, 2026. The release places shared MQTT contracts, lifecycle, controller, transport, and worker boundaries under `src/lib/services/threed/mqtt`, with FarmBot as the first integration under `mqtt/integrations/farmbot`. The FarmBot registry uses the shared controller while preserving read-only topics, runtime/event persistence, Admin controls, Dashboard status, retries, cleanup, and credential safety. MQTT publishing and physical FarmBot commands remain disabled.

## ✅ v0.18.4a — Admin and Dashboard UI Improvements (released to production)

The August 21, 2026 production release improves the two application surfaces without changing database schema, API contracts, ThreeD animation behavior, MQTT safety boundaries, or physical-command availability:

- FarmBot Connection and MQTT Activity use full-width inline expansion sections beneath their Admin record, with consistent controls and clearer action buttons.
- The Dashboard Map uses a compact Project control whose metadata and actions open in an overlay without resizing the ThreeD scene; Admin Details opens separately.
- Project detail and creation pages use cleaner headers, and assigned/create asset tabs share one neutral style and sub-module order, including Layers.
- The Admin sidebar selects only the single best route match, so module Overview and child items are never highlighted together.
- The Admin header removes duplicate navigation controls, centers the same Dashboard/Admin surface selector used by the Dashboard header, and retains a smaller left-aligned search field.

The user manually verified the requested Admin and Dashboard behavior, `npm run build` passed, and the GitHub-to-Vercel production deployment was confirmed. The latest ThreeD MQTT safety boundary remains v0.18.3b through Phase 4L-K; all production executors and MQTT publishing remain disabled.

## Phase 5E — Runtime Marker Action Target construction

After the v0.18.6a production checkpoint, target construction was moved from the Dashboard component into the provider-independent ThreeD orchestration service. The shared constructor normalizes supported marker aliases and validates runtime marker identity, positive asset identity, display name, and finite scene coordinates before creating an immutable Action Target. The Dashboard keeps the same visible selection behavior, while invalid or unsupported marker data now fails before it can enter orchestration state.

This is a simulation-only architecture step. It changes no schema, API contract, persistence behavior, MQTT path, worker behavior, FarmBot command boundary, animation mixer path, or physical operation.

## Phase 5F — Shared Action Target identity matching

The DetailsCard, refreshed-project reconciliation, and ThreeD scene marker highlighting now use one provider-independent Action Target identity matcher. The matcher normalizes supported singular/plural Runtime Marker types and requires the same ThreeD marker module and positive asset identity. This removes separate component-level matching rules while preserving existing selection, refresh clearing, and persistent target highlighting behavior.

This step adds no target type, action, API behavior, persistence, MQTT operation, worker capability, animation change, or physical command authority.

## Phase 5G — Provider-neutral Runtime Marker registry core

ThreeD now owns a dormant in-memory registry core under `src/lib/services/threed/markers`. It normalizes the five supported marker-producing Sub-Modules, derives canonical source keys and scene marker IDs, separates database-backed and live positions, resolves the current position, preserves matching live overrides during an atomic asset refresh, and fails closed for invalid, unknown, or duplicate marker identities.

Database-driven, Project-assigned ThreeD data is the authority for the current Project session. Persisted marker-producing Sub-Module assets and Project assignments determine eligibility, persisted `threed_layers` records determine the available Layers, and an explicit Project save records the current marker snapshot in `project_threed_markers`. The Runtime Marker registry remains the in-memory bridge between saved Project state and visible Runtime Markers; it does not create ownership, Project assignments, or Layer records.

Action Target normalization now consumes ThreeD Marker normalization rather than defining its own marker aliases. The registry has no React or scene caller yet and changes no rendered marker, layer, selection, navigation, API, schema, persistence, MQTT, worker, animation, or physical behavior. `npm run validate:threed-runtime-markers` provides offline coverage for this boundary.

## Phase 5H — Provider-neutral Runtime Marker builder extraction

The existing Project Sub-Module-to-Runtime Marker transformation now lives under `src/lib/services/threed/markers` instead of inside `UnifiedMapView`. The extracted builder preserves the established Planting, Bed, Character, FarmBot, and Model marker order and the current position, naming, color, icon, visibility, activity, raw-data, and metadata behavior. `UnifiedMapView` continues to memoize that output and retains all layer and UI filtering responsibilities.

This extraction does not connect the Phase 5G registry, change Runtime Marker eligibility, modify a route or schema, or add persistence, MQTT, worker, animation, or physical behavior. Offline marker validation now covers both registry rules and builder compatibility.

## Phase 5I — Unfiltered Runtime Marker registry synchronization

`UnifiedMapView` now owns one stable in-memory registry and replaces its Project-scoped asset marker set from the complete Phase 5H builder output. Synchronization occurs independently of layer, search, active-only, and asset-type filters, and registry state is cleared on an invalid replacement or component unmount. The existing rendered `RuntimeMarker[]` remains the presentation path.

No component reads the registry yet, and Ecctrl live positions remain in their established scene/page paths. This step changes no visible marker, layer, selection, Action Target position, API, schema, persistence, MQTT, worker, animation, or physical behavior. Offline validation now proves the five unfiltered builder marker types map to distinct registry identities.

## Phase 5J — Transitional Ecctrl live-position registry writes

Ecctrl live physics reports now also update the matching Runtime Marker registry entry using explicit ThreeD Sub-Module type and asset ID. The existing `ThreeDScene` marker-ID position map and unchanged throttled Dashboard callback remain active and retain their current ordering and behavior. The registry update returns only a success flag so frequent movement reports do not allocate unused immutable snapshots.

No registry position reader is active yet. Camera focus, range calculations, target-relative movement, Action Target request snapshots, GardenCharacter behavior, APIs, schema, persistence, MQTT, workers, animations, and physical operations remain unchanged.

## Saved ThreeD Project marker snapshot

The Project Drizzle schema now declares `project_threed_markers`. It stores one current saved marker row per Project, ThreeD module, marker Sub-Module, and source asset, including the current saved position and presentation snapshots. This is an explicit ThreeD Project save boundary: render frames, physics position reports, MQTT messages, camera changes, and filter changes do not write to the table automatically.

`GET` and `PUT /api/project/threed-markers` now provide the authenticated persistence boundary. The server derives ThreeD module identity from active Project assignments, rejects missing or ambiguous marker assignments, limits snapshot size, rejects credential-like JSON keys, and transactionally replaces the current Project marker snapshot under a Project-scoped lock.

The Dashboard Project dropdown now exposes **Save ThreeD Project**. It requests the complete unfiltered Runtime Marker registry only on click, so current Ecctrl positions are saved without adding movement-triggered database writes. The map loader returns saved rows separately and only when their source assets remain actively assigned through the saved ThreeD module. The marker builder restores valid saved rows and falls back to the established source-asset path for Projects without a snapshot.

## Phase 5L — On-demand Runtime Marker position resolution

`UnifiedMapView` now exposes a stable on-demand reader for the registry's current position without copying registry state into React or causing render-frame writes. The Dashboard uses it when a Runtime Marker becomes an Action Target, when DetailsCard calculates interaction range, and immediately before a generic target interaction request is dispatched. A registry miss preserves the established selected-marker or Action Target position fallback.

This step does not replace `ThreeDScene`'s established camera-focus position map, report autonomous GardenCharacter movement, change marker eligibility, add persistence, alter animation paths, publish MQTT, invoke a worker, or authorize physical behavior.

Saved marker restoration updates both the outer Runtime Marker position and its embedded `data.positionX/Y/Z`. This preserves one saved location across static marker placement and the Ecctrl physics-body spawn path without changing the character components or their locomotion behavior.

## ThreeD Model Library — Step 1

The approved minimal Model Library milestone reuses `threed_models` and `threed_model_files`; it introduces no second catalog or storage manifest. The development schema adds `is_public` and `is_library_item`, both private by default. Authenticated `scope=library` reads require both flags plus active status and return a limited rendering-safe shape. Owner CRUD remains owner-scoped, and model-file upload/deletion plus parent deletion now establish model ownership before changing database or Blob state.

## ThreeD Model Library — approved placement direction

The runtime visual-swapping experiment was removed before release. Beds, Plantings, Characters, and FarmBots retain their established visuals, and GardenCharacter/EcctrlCharacter remain on their saved model and animation paths.

The approved direction is a Library-to-Scene placement workflow built on the existing Project hierarchy. `threed_models` remains the reusable owned/public asset catalog, `project_assets` authorizes the source Model for a ThreeD module, and `project_threed_markers` owns every Project placement. Multiple marker rows may reference the same Model, while each row has a unique `marker_id` and its own transform.

The authenticated `/api/project/threed-markers` route owns Model placement creation, update, deletion, snapshot save, and Project marker reads. Model creation verifies the owned Project and active ThreeD assignment, verifies Model eligibility, creates or reactivates the required Project Asset assignment, and inserts a `models` marker. `PATCH` and `DELETE` address the marker row through `?id=X`. No separate Model-instance API or runtime population feed remains active.

The map read path restores Model placements directly from `project_threed_markers` and joins their referenced `threed_models` render data. The Runtime Marker builder adds those saved Model markers to the Scene while preserving the established Sub-Module paths for Beds, Plantings, Characters, and FarmBots.

The Dashboard Project menu now opens a ThreeD Model Library panel. It loads active shared Library models, selects the active ThreeD module explicitly when a Project has more than one, and starts a one-shot click-to-place mode. Ground hover shows a cyan placement guide; ground click posts one Project model instance, inserts only the returned marker into client state, and exits placement mode. A local request lock prevents duplicate placement from rapid clicks. Closing or cancelling the panel writes nothing. Existing ground-click deselection remains unchanged outside placement mode.

Placed-model rendering composes `threed_models.scale` with the instance `scale_multiplier` and applies the result at the outer React Three Fiber group. The loaded FBX/GLB/OBJ object therefore cannot discard the reusable model's base scale during loading or cloning. A model scale of `0.02` with the default instance multiplier `1.00` renders at `0.02`; the database multiplier remains an instance adjustment rather than a duplicate of base scale.

## v0.18.7a production checkpoint — ThreeD Model Library placement

On August 23, 2026, the user manually verified the first complete general-model placement path. A Tomato Plant GLB uploaded through Admin Model CRUD to Vercel Blob appears in the authenticated non-Character ThreeD Model Library, creates a Project-owned marker through one-shot Dashboard ground placement, and reloads as a visible `models` Runtime Marker in the ThreeD Scene. The corrected hierarchy stores that placement in `project_threed_markers`.

The verified GLB uses DRACO-compressed geometry. `ModelMarker3D` attaches one reused `DRACOLoader` to its GLTF/GLB loader and serves matching Three.js decoder files locally from `public/assets/draco`, avoiding a runtime dependency on an external decoder CDN. `npm run validate:assets` now checks these production files together with the established external animation assets.

This checkpoint applies only to general Model instances. Models marked `used_by_characters = true` are excluded from the direct Library query and rejected by direct placement creation because Character assets require GardenCharacter or EcctrlCharacter rules. Admin Model CRUD now manages the existing `used_by_plants` and `used_by_characters` classifications and can upload a replacement primary model file during Edit. No Character Library or Character placement workflow is implemented yet.

The Dashboard now exposes the basic placement CRUD lifecycle: create by one-shot Library ground placement, read through Project map loading and DetailsCard, update instance name/scale/Y rotation through the owner-scoped PATCH route, and delete only the selected Project instance after confirmation. These controls never update or delete the reusable Model or its Blob file. Position dragging remains outside this checkpoint.

Manual testing exposed a scene-authority regression: saving a Model placement reloaded the complete Project data, reconstructed unrelated Character marker data, and allowed the Ecctrl selection halo to move while the visible Character remained stationary. Marker create/update/delete now patch only the affected `project_threed_markers` entry. `UnifiedMapView` reconciles the complete marker collection by stable `marker_id` and passes unchanged marker objects directly into the persistent ThreeD Scene. The user verified that editing a Model no longer breaks Character Take Control or WASD and that the Character plus halo move together.

The v0.18.7a scene hierarchy is: one persistent Canvas, one persistent Rapier Physics world, one stable Project marker collection keyed by `marker_id`, and one Sub-Module-owned runtime/RigidBody path per marker. Explicit Refresh or Project switching may reload data; ordinary marker CRUD must not reload or remount unrelated Scene objects.

Project Model collision is derived from the whole final rendered asset boundary rather than import-time model bounds. R3F first attaches the asynchronously loaded and composed Model group; after render, the Model path measures its complete world bounds, converts them into its marker-owned fixed RigidBody coordinates, and creates one explicit cuboid collider. This includes instance scale, grounding, nested objects, and skinned geometry and prevents Ecctrl Characters from passing through general Library Model placements. The ThreeD Scene Controls panel owns the primary **Show/Hide Physics Debug** control for Rapier outlines and debug-only Model-bound reporting. `physicsDebug=1` remains available only to start a Map session with debugging enabled.

ThreeD Scene Layer state controls visual, pointer, input, and physics participation without controlling marker lifecycle. The complete marker collection remains mounted inside the persistent Physics world and continues to determine Scene bounds and the ground coordinate frame. Hiding a Scene Layer disables its existing module-owned RigidBody and suspends Ecctrl input without removing, rebuilding, or changing the collider structure of the marker owner. The Scene-level Physics Debug renderer filters Rapier's disabled-collider line segments, so a hidden layer loses only its own diagnostic outlines while enabled layers remain visible in the debug view. This preserves every retained instance and runtime transform.

This development was released to production as **v0.18.7a — ThreeD Model Library Project Placements** on August 24, 2026. The user confirmed the manual build and production deployment.
