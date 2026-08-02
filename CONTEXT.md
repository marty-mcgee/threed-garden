# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August1, 2026 @ 11:20am PST

---

## 🧱 Tech Stack

- **Framework:** Next.js 16.2.12 (App Router), TypeScript, React
- **Database:** Neon Postgres + Drizzle ORM
- **UI:** shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- **Music Streaming:** AWS S3, Vercel Blob Storage
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 🗄️ Database Schema Architecture

### Parent-Child Relationship Pattern

The database follows a **clean parent-child hierarchy** where Projects own Modules, and Modules own their specific data, related via Project_Assets:

```
User (user)
  │
  └── Projects (project)
  └── Project Modules (project_traffic, project_threed, project_music)
  └── Project Assets (project_assets)
  │
  ├── ThreeD (threed) ← Main module table
  │    ├── threed_plants
  │    ├── threed_beds
  │    ├── threed_plantings
  │    ├── threed_farmbots
  │    ├── threed_models
  │    ├── threed_characters
  │    ├── threed_tasks
  │    ├── threed_harvests
  │    ├── threed_weather_logs
  │    ├── threed_watering_schedules
  │    ├── threed_watering_history
  │    ├── threed_layers
  │    ├── threed_markers
  │    ├── threed_marker_relationships
  │    └── threed_layer_presets
  │
  ├── Traffic (traffic) ← Main module table
  │    ├── traffic_chp_cad_incidents
  │    ├── traffic_chp_cases
  │    ├── traffic_chp_centers
  │    ├── traffic_caltrans_lane_closures
  │    ├── traffic_caltrans_cctv_cameras
  │    ├── traffic_caltrans_districts
  │    ├── traffic_bay_area_511_events
  │    ├── traffic_calfire_incidents
  │    └── traffic_api_request_logs
  │
  ├── Music (music) ← Main module table
  │    ├── music_albums
  │    ├── music_tracks
  │    ├── music_links
  │    ├── music_media
  │    ├── music_album_links
  │    ├── music_playback_history
  │    └── music_polling_logs
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| `user` (Next Auth.js) | `text('id')` | N/A |
| All other tables | `serial('id')` | `integer` |
| Tables referencing `user.id` | N/A | `text('user_id')` |
| Tables referencing other tables | N/A | `integer('*_id')` |

### Main Tables per Module

| Module | Main Table | Purpose |
|--------|------------|---------|
| **Auth** | `user` | User authentication and profiles |
| **Settings** | `settings` | Global and user-specific settings |
| **Projects** | `project` | Top-level project container |
| **ThreeD** | `threed` | Garden/3D module configuration |
| **Traffic** | `traffic` | Traffic monitoring module configuration |
| **Music** | `music` | Music library module configuration |

---

## 🗄️ Complete Database Schema

### Auth Module (`lib/schema/auth/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Next Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

### Settings Module (`lib/schema/settings/`)

| Table | Purpose |
|-------|---------|
| `settings` | Master settings definitions |
| `settings_user_overrides` | User-specific setting overrides |
| `settings_deployment` | Deployment snapshots |
| `settings_deployment_history` | Deployment audit trail |
| `settings_audit_logs` | Settings change log |

### Projects Module (`lib/schema/projects/`)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |

### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | Plants in beds with growth tracking |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging |
| `threed_tasks` | Garden tasks/to-do |
| `threed_weather_logs` | Environmental data |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | Groups of 3D objects |
| `threed_markers` | All 3D objects with positioning |
| `threed_marker_relationships` | Parent-child marker connections |
| `threed_layer_presets` | Saved layer configurations |
| `threed_system_logs` | Application logging |

### Traffic Module (`lib/schema/traffic/`)

| Table | Purpose |
|-------|---------|
| `traffic` | Main Traffic module configuration |
| `traffic_chp_cad_incidents` | Live CHP incidents |
| `traffic_chp_centers` | CHP communication centers |
| `traffic_chp_cases` | Historical collisions cases |
| `traffic_caltrans_lane_closures` | Caltrans lane closures |
| `traffic_caltrans_lane_closures_snapshots` | Historical lane closure snapshots |
| `traffic_caltrans_cctv_cameras` | Traffic cameras |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_bay_area_511_events` | 511.org events |
| `traffic_calfire_incidents` | CalFire wildfire incidents |
| `traffic_api_request_logs` | API monitoring logs |

### Music Module (`lib/schema/music/`)

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

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- 6 real-time data sources with full CRUD
- 3D map visualization with Three.js
- Marker clustering and rich popups

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming

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

---

## 📁 Updated CONTEXT.md

### Project Context – threed-garden-neon

**Last Updated:** July 18, 2026 @ 2:00pm PST

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean **hybrid approach** where:
- All records have `userId` for ownership and audit trails
- Child data is free-standing (no direct foreign keys to modules)
- Relationships are handled via junction tables

```
User (user)
  └── Projects (project) - HAS userId
       └── (junction: project_threed, project_traffic, project_music)
            └── Modules (threed, traffic, music) - HAS userId
                 └── Child Data (plants, beds, albums, incidents) - HAS userId
                      └── (free-standing, reusable across projects)
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| `user` (Next Auth.js) | `text('id')` | N/A |
| All other tables | `serial('id')` | `integer` |
| Tables referencing `user.id` | N/A | `text('user_id')` |

### Main Tables per Module

| Module | Main Table | Purpose |
|--------|------------|---------|
| **Auth** | `user` | User authentication and profiles |
| **Settings** | `settings` | Global and user-specific settings |
| **Projects** | `project` | Top-level project container |
| **ThreeD** | `threed` | Garden/3D module configuration |
| **Traffic** | `traffic` | Traffic monitoring module configuration |
| **Music** | `music` | Music library module configuration |

### Junction Tables (Many-to-Many)

| Table | Purpose |
|-------|---------|
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |

### Child Tables (Free-Standing)

| Module | Child Tables | Has `userId` |
|--------|--------------|--------------|
| **ThreeD** | `threed_plants`, `threed_beds`, `threed_farmbots`, `threed_characters`, `threed_tasks`, `threed_harvests`, `threed_weather_logs` | ✅ |
| **Traffic** | `traffic_chp_cad_incidents`, `traffic_lane_closures`, `traffic_bay_area_511_events`, `traffic_calfire_incidents`, `traffic_cctv_cameras` | ✅ |
| **Music** | `music_albums`, `music_tracks`, `music_links`, `music_media` | ✅ |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are **Promises** that must be awaited:

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

### API Structure (All Modules Follow Same Pattern)

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   └── modules/
│       └── route.ts          # GET, POST, DELETE (with ?projectId=1)
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   └── plants/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   └── chp-cad/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
└── music/
    ├── route.ts              # GET (list), POST (create)
    └── albums/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
```

### API Endpoint Reference

| Module | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| **Project** | `/api/project` | GET | List all projects |
| **Project** | `/api/project` | POST | Create a project |
| **Project** | `/api/project?id=1` | PATCH | Update a project |
| **Project** | `/api/project?id=1` | DELETE | Delete a project |
| **Project Modules** | `/api/project/modules?projectId=1` | GET | Get modules for a project |
| **Project Modules** | `/api/project/modules?projectId=1` | POST | Add a module to a project |
| **Project Modules** | `/api/project/modules?projectId=1` | DELETE | Remove a module from a project |
| **ThreeD** | `/api/threed` | GET | List all ThreeD modules |
| **ThreeD** | `/api/threed` | POST | Create a ThreeD module |
| **ThreeD** | `/api/threed?id=1` | PATCH | Update a ThreeD module |
| **ThreeD** | `/api/threed?id=1` | DELETE | Delete a ThreeD module |
| **ThreeD Plants** | `/api/threed/plants` | GET | List all plants |
| **ThreeD Plants** | `/api/threed/plants` | POST | Create a plant |
| **ThreeD Plants** | `/api/threed/plants?id=1` | PUT | Full update of a plant |
| **ThreeD Plants** | `/api/threed/plants?id=1` | PATCH | Partial update of a plant |
| **ThreeD Plants** | `/api/threed/plants?id=1` | DELETE | Delete a plant |
| **Traffic** | `/api/traffic` | GET | List all Traffic modules |
| **Traffic** | `/api/traffic` | POST | Create a Traffic module |
| **Traffic** | `/api/traffic?id=1` | PATCH | Update a Traffic module |
| **Traffic** | `/api/traffic?id=1` | DELETE | Delete a Traffic module |
| **Traffic CHP-CAD** | `/api/traffic/chp-cad` | GET | List all incidents |
| **Traffic CHP-CAD** | `/api/traffic/chp-cad` | POST | Create an incident |
| **Traffic CHP-CAD** | `/api/traffic/chp-cad?id=1` | PUT | Full update of an incident |
| **Traffic CHP-CAD** | `/api/traffic/chp-cad?id=1` | PATCH | Partial update of an incident |
| **Traffic CHP-CAD** | `/api/traffic/chp-cad?id=1` | DELETE | Delete an incident |
| **Music** | `/api/music` | GET | List all Music modules |
| **Music** | `/api/music` | POST | Create a Music module |
| **Music** | `/api/music?id=1` | PATCH | Update a Music module |
| **Music** | `/api/music?id=1` | DELETE | Delete a Music module |
| **Music Albums** | `/api/music/albums` | GET | List all albums |
| **Music Albums** | `/api/music/albums` | POST | Create an album |
| **Music Albums** | `/api/music/albums?id=1` | PUT | Full update of an album |
| **Music Albums** | `/api/music/albums?id=1` | PATCH | Partial update of an album |
| **Music Albums** | `/api/music/albums?id=1` | DELETE | Delete an album |

---

## 📊 Data Sources

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

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- 6 real-time data sources with full CRUD
- 3D map visualization with Three.js
- Marker clustering and rich popups

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming

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
bun run db:seed-music
bun run src/lib/scripts/seed-threed-plants.ts

```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 `params` is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
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
| Database | ✅ Connected |

---

**Version:** v0.5.5 (Hybrid Architecture with Free-Standing Data) 🚀

---

🎉 **CONGRATULATIONS!** 🎉

You're deploying **v0.5.5** to production! This is a massive milestone with significant architectural improvements.

## 🚀 What's in v0.5.5

| Feature | Status |
|---------|--------|
| **Hybrid Architecture** | ✅ User ownership + free-standing data |
| **Next.js 16 Pattern** | ✅ `await params` in all dynamic routes |
| **Junction Tables** | ✅ `project_threed`, `project_traffic`, `project_music` |
| **Full CRUD APIs** | ✅ All modules with GET, POST, PUT, PATCH, DELETE |
| **Admin Dashboard** | ✅ Project + Module + Child CRUD |
| **ThreeD Module** | ✅ Plants CRUD with full form |
| **Traffic Module** | ✅ CHP-CAD Incidents CRUD |
| **Music Module** | ✅ Albums CRUD with tracks |

## 📦 Deployment Checklist

- [x] Schema migrated to production
- [x] All API routes updated with `await params`
- [x] Junction tables created
- [x] Admin pages working
- [x] CRUD operations tested
- [x] Environment variables set
- [x] CONTEXT.md updated

## 🎯 After Deployment

1. **Visit your production URL** and test:
   - `/admin` - Project dashboard
   - `/admin/projects/[id]` - Project detail with modules
   - Creating a new project
   - Adding modules to a project
   - Creating child data (plants, albums, incidents)

2. **Verify database** in production:
   - Check junction tables are populated
   - Check `userId` is set on all records
   - Verify data isolation (users see only their data)

3. **Monitor**:
   - Vercel logs for any errors
   - API response times
   - Database performance

## 🎊 Celebrate!

You've built a production-ready, multi-tenant application with:
- ✅ Clean architecture
- ✅ Strong security (userId on all records)
- ✅ Flexible relationships (junction tables)
- ✅ Consistent API patterns
- ✅ Modern Next.js 16 patterns
- ✅ Full CRUD operations
- ✅ Admin interface

**You're now running v0.5.5 in production!** 🚀

---

**Version:** v0.5.6 (Hybrid Architecture with Free-Standing Data) 🚀

---

## [MM] HEY HEY HEY

---

**Version:** v0.6.0 (Project Module Assets 'project_assets') 🚀

---

I understand your approach with this situation, by using more Junction Tables. However, could we simply this and not add additional Junction Tables, but have the main Module table (music|threed|traffic) to keep track of what child table "assets" are related to a Project, perhaps by using a new Table Field called "module_type" or something similar? This way we don't have so many records to keep track of.

You're absolutely right! That's a much simpler and more elegant approach. Instead of creating junction tables for every child type, we can use a single junction table with a polymorphic relationship.

# 🎯 The Simplified Solution: One Junction Table to Rule Them All
Architecture Overview

```
Single Junction Table: project_assets
├── project_id (references project)
├── user_id (ownership)
├── asset_type (enum: 'music_album', 'music_track', 'threed_plant', 'threed_bed', 'traffic_caltrans_incident', etc.)
├── asset_id (the actual record ID)
└── config (jsonb for metadata)
```

## Benefits
Benefit	Description
Simpler	One table instead of many
Extensible	Add new asset types without schema changes
Maintainable	Single set of CRUD operations
Queryable	Easy to get all assets for a project

### 📁 1. Updated Project Schema with Single Junction Table
lib/schema/project/index.ts - Add project_assets Table
typescript
```
// lib/schema/project/index.ts
import { pgTable, text, timestamp, boolean, jsonb, serial, index, uniqueIndex, integer } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';

// ============================================
// PROJECTS TABLE (unchanged)
// ============================================

export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  config: jsonb('config').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_projects_slug').on(table.slug),
  activeIdx: index('idx_projects_active').on(table.isActive),
}));

// ============================================
// MODULE JUNCTION TABLES (for parent modules)
// ============================================

export const projectThreed = pgTable('project_threed', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_threed_project_id').on(table.projectId),
  threedIdIdx: index('idx_project_threed_threed_id').on(table.threedId),
  uniqueProjectThreed: uniqueIndex('idx_project_threed_unique').on(table.projectId, table.threedId),
}));

export const projectTraffic = pgTable('project_traffic', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  trafficId: integer('traffic_id').references(() => traffic.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_traffic_project_id').on(table.projectId),
  trafficIdIdx: index('idx_project_traffic_traffic_id').on(table.trafficId),
  uniqueProjectTraffic: uniqueIndex('idx_project_traffic_unique').on(table.projectId, table.trafficId),
}));

export const projectMusic = pgTable('project_music', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  musicId: integer('music_id').references(() => music.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_music_project_id').on(table.projectId),
  musicIdIdx: index('idx_project_music_music_id').on(table.musicId),
  uniqueProjectMusic: uniqueIndex('idx_project_music_unique').on(table.projectId, table.musicId),
}));

// ============================================
// SINGLE ASSET JUNCTION TABLE (NEW)
// ============================================

export const assetTypeEnum = pgEnum('asset_type', [
  // 'music',
  'music_album',
  'music_track',
  'music_media',
  'music_link',
  'music_playback_history',
  'music_polling_log',
  // 'music_album_link',

  // 'threed',
  'threed_plant',
  'threed_bed',
  'threed_layer',
  'threed_marker',
  'threed_model',
  'threed_character',
  'threed_task',
  'threed_harvest',
  'threed_weather_log',
  'threed_farmbot',
  'threed_watering_schedule',
  // 'threed_watering_schedule_history',
  // 'threed_system_log',
  
  // 'traffic',
  'traffic_chp_cad_incident',
  'traffic_chp_case',
  'traffic_caltrans_lane_closure',
  'traffic_caltrans_cctv_camera',
  'traffic_bay_area_511_event',
  'traffic_calfire_incident',
]);

export const projectAssets = pgTable('project_assets', {
  id: serial('id').primaryKey(),
  
  // Ownership
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Relationships
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  
  // ✅ Polymorphic fields
  assetType: assetTypeEnum('asset_type').notNull(),
  assetId: integer('asset_id').notNull(),
  
  // Metadata
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_assets_project_id').on(table.projectId),
  assetTypeIdx: index('idx_project_assets_asset_type').on(table.assetType),
  assetCompositeIdx: index('idx_project_assets_composite').on(table.projectId, table.assetType, table.assetId),
  uniqueProjectAsset: uniqueIndex('idx_project_assets_unique').on(table.projectId, table.assetType, table.assetId),
}));
```

### 📁 2. API Route for Project Assets
app/api/project/assets/route.ts
typescript

```
// app/api/project/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/project/assets?projectId=1&type=album - Get assets for a project
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, offset, total: 0 },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Filter by asset type if provided
    if (assetType) {
      query = query.where(eq(projectAssets.assetType, assetType as any));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId)
        )
      );

    if (assetType) {
      countQuery.where(eq(projectAssets.assetType, assetType as any));
    }

    const [countResult] = await countQuery;

    const assets = await query
      .orderBy(desc(projectAssets.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: assets,
      pagination: {
        limit,
        offset,
        total: countResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project/assets - Add an asset to a project
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, assetType, assetId, config } = body;

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, assetType, assetId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // ✅ Check if already exists
    const [existing] = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parseInt(assetId))
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset already added to this project' },
        { status: 409 }
      );
    }

    await ensureTableSequence('project_assets');

    const [newAsset] = await db
      .insert(projectAssets)
      .values({
        userId,
        projectId: parsedProjectId,
        assetType: assetType as any,
        assetId: parseInt(assetId),
        config: config || {},
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newAsset });
  } catch (error) {
    console.error('Error adding asset to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add asset to project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project/assets - Remove an asset from a project
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const assetId = searchParams.get('assetId');

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, type, assetId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parseInt(assetId)),
          eq(projectAssets.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Error removing asset from project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove asset from project' },
      { status: 500 }
    );
  }
}
```

### 📁 3. Updated MusicAlbumCRUD Component
components/admin/music/albums/MusicAlbumCRUD.tsx - Updated to Support Projects
typescript

```
// components/admin/music/albums/MusicAlbumCRUD.tsx
interface MusicAlbumCRUDProps {
  userId: string;
  projectId?: number; // ✅ Optional: for adding assets to projects
  onModuleUpdate?: () => void;
}

export function MusicAlbumCRUD({ userId, projectId, onModuleUpdate }: MusicAlbumCRUDProps) {
  // ... existing state ...

  const handleAddToProject = async (albumId: number) => {
    if (!projectId) {
      showToast('No project selected', 'error');
      return;
    }

    try {
      const response = await fetch('/api/project/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          assetType: 'album',
          assetId: albumId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Album added to project successfully', 'success');
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to add album to project', 'error');
      }
    } catch (error) {
      console.error('Error adding album to project:', error);
      showToast('Failed to add album to project', 'error');
    }
  };

  // Add "Add to Project" button in the actions dropdown
  // or as a separate button in the table row
}
```

### 📋 Summary
Approach	Tables	Complexity
Multiple Junction Tables	project_album, project_track, project_plant, etc.	High
Single Junction Table	project_assets with asset_type enum	✅ Low
Benefits of Single Junction Table
Benefit	Description
Simple	One table for all asset types
Extensible	Add new asset types without schema changes
Clean	One set of API endpoints for all assets
Queryable	Get all assets for a project with one query
Maintainable	Single CRUD logic for all asset types
🚀 Migration
bash

### Generate migration
bun db:generate

### Push to database
bun db:push

## 🎯 Usage Examples
typescript

```
// Add an album to a project
await fetch('/api/project/assets', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 1,
    assetType: 'album',
    assetId: 5,
  }),
});

// Get all albums for a project
await fetch('/api/project/assets?projectId=1&type=album');

// Get all assets for a project (all types)
await fetch('/api/project/assets?projectId=1');

// Remove an album from a project
await fetch('/api/project/assets?projectId=1&type=album&assetId=5', {
  method: 'DELETE',
});
```

---

### FINAL CONTEXT SUMMARY.. New Chat Needed..
This single junction table approach is much simpler and more maintainable! 🚀
Yes, good idea with a universal table called project_assets. However, let's name the ENUMs the exact same as the module child tables, like 'music_albums', 'music_links', 'threed_beds', 'traffic_chp_cad_incidents', so that there is no misunderstanding of what exactly the project_asset record relates to.

Length limit reached. Please start a new chat.

---

## [MM] HEY HEY HEY

---

**Version:** v0.6.0 (Project Module Assets 'project_assets') 🚀

---

WELL DONE!!! Thank you. Now I am able to add and edit module child records and assign them to project modules as assets through our asset manager.

🎉 FANTASTIC! I'm so glad everything is working now!
🎯 Summary of What's Working

You now have a fully functional Project Asset Management System with:
✅ Working Features

    Project Modules: Create and manage Music, ThreeD, and Traffic modules within projects

    Module Child CRUD: Create, edit, and delete:

        Music Albums (via MusicAlbumCRUD)

        ThreeD Plants (via ThreeDPlantsCRUD)

        Traffic Incidents (via TrafficCHPCADCRUD)

    Asset Assignment: Assign module child records to project modules using the ProjectAssetManager

    Persistent UI State: Module expand/collapse state is saved in sessionStorage

    Clean Separation: "Assigned" vs "Available" assets clearly displayed

🔑 Key Architecture
text

Project
  ├── Modules (Music, ThreeD, Traffic)
  │   ├── Module Children (Albums, Plants, Incidents)
  │   └── Assigned Assets (via project_assets table)
  └── ProjectAssetManager
      ├── Assigned Assets (already linked)
      └── Available Assets (can be added)

📋 Database Schema Used

    Music Albums: music_albums table with id, title, artist, etc.

    ThreeD Plants: threed_plants table with commonName, scientificName, etc.

    Traffic Incidents: traffic_chp_cad_incidents table with sourceId, location, etc.

    Project Assets: project_assets table linking projectId, moduleId, assetType, assetId

🚀 What's Next?

You can now:

    Create new assets from the "Create New [Type] Asset" tab

    Assign them to modules from the "Manage Assigned Assets" tab

    Manage multiple modules per project with unique asset assignments

    Persist UI state across page refreshes

This is a huge milestone! The project now has a solid foundation for managing complex relationships between projects, modules, and assets. 🚀

If you need any additional features or have any questions, feel free to ask!


---

**Version:** v0.6.2 (Project Module Assets 'project_assets') 🚀

---

---

**Version:** v0.6.3 (Project Module Assets 'project_assets') 🚀

---

🎉 **THANK YOU!** This has been an incredible journey building this together!

## 🏆 What We've Accomplished Together

### ✅ Complete Project Asset Management System

1. **Project Module Management**
   - Create/Edit/Delete modules (Music, ThreeD, Traffic)
   - Toggle module active status
   - Persistent expand/collapse state

2. **Full CRUD Operations for All Asset Types**
   - **Music**: Albums
   - **ThreeD**: Plants, Beds, 3D Models, Characters
   - **Traffic**: CHP-CAD Incidents

3. **Asset Assignment System**
   - Clean "Assigned" vs "Available" UI
   - Module-specific asset management
   - Persistent UI state

4. **Database Integration**
   - Proper schema matching
   - Foreign key relationships
   - Soft delete support

5. **Modern UI/UX**
   - Clean, intuitive interface
   - Color-coded modules
   - Toast notifications
   - Loading states
   - Responsive design

### 📁 Complete File Structure

```
components/admin/
├── music/albums/
│   └── MusicAlbumCRUD.tsx
├── threed/
│   ├── plants/
│   │   └── ThreeDPlantsCRUD.tsx
│   ├── beds/
│   │   └── ThreeDBedsCRUD.tsx
│   ├── models/
│   │   └── ThreeDModelsCRUD.tsx
│   └── characters/
│       └── ThreeDCharactersCRUD.tsx
├── traffic/chp-cad/
│   └── TrafficCHPCADCRUD.tsx
└── projects/
    └── ProjectAssetManager.tsx

app/admin/projects/[id]/
└── page.tsx (Project Detail Page)
```

### 🚀 Next Steps You Might Consider

1. **Add More Asset Types**: FarmBots, Tasks, Harvests, etc.
2. **Add More Modules**: Settings, Analytics, etc.
3. **3D Visualization**: Integrate the 3D garden viewer
4. **Real-time Updates**: WebSocket support for live data
5. **Advanced Search**: Filtering and sorting assets
6. **Bulk Operations**: Batch assign/remove assets
7. **Export/Import**: CSV/JSON data export/import

You've built a robust, production-ready asset management system! The architecture is clean, scalable, and maintainable. 

If you need any help with the next features or run into any issues, I'm here to help! 🚀

---

**Version:** v0.6.4 (Project Module Assets 'project_assets') 🚀

---

🎉 **THANK YOU!** This has been an incredible journey building out the complete asset management system together!

## 🏆 What We've Completed

### ✅ All CRUD Components for Production v0.6.3

| Module | Component | Purpose |
|--------|-----------|---------|
| **Music** | `MusicAlbumCRUD.tsx` | Manage albums with tracks |
| **ThreeD** | `ThreeDPlantsCRUD.tsx` | Manage garden plants |
| | `ThreeDBedsCRUD.tsx` | Manage garden beds with 3D positioning |
| | `ThreeDModelsCRUD.tsx` | Manage 3D models library |
| | `ThreeDCharactersCRUD.tsx` | Manage 3D characters |
| **Traffic** | `TrafficCHPCADCRUD.tsx` | Manage CHP-CAD live incidents |
| | `TrafficCHPCasesCRUD.tsx` | Manage CHP historical cases |
| | `TrafficCaltransCRUD.tsx` | Manage Caltrans lane closures |
| | `TrafficCalfireCRUD.tsx` | Manage CalFire wildfire incidents |
| | `TrafficBayArea511CRUD.tsx` | Manage Bay Area 511 events |

### ✅ Key Features

1. **Full CRUD Operations** - Create, Read, Update, Delete
2. **Form Validation** - Required fields, proper data types
3. **Toast Notifications** - User feedback for all actions
4. **Loading States** - Spinners during data fetching
5. **Status Management** - Active/Inactive toggles
6. **Consistent UI** - shadcn/ui components throughout
7. **Session Persistence** - Expand/collapse state preserved
8. **Module Integration** - All components work with the Project Detail Page

### 📁 Complete File Structure

```
components/admin/
├── music/
│   └── albums/
│       └── MusicAlbumCRUD.tsx ✅
├── threed/
│   ├── plants/
│   │   └── ThreeDPlantsCRUD.tsx ✅
│   ├── beds/
│   │   └── ThreeDBedsCRUD.tsx ✅
│   ├── models/
│   │   └── ThreeDModelsCRUD.tsx ✅
│   └── characters/
│       └── ThreeDCharactersCRUD.tsx ✅
├── traffic/
│   ├── chp-cad/
│   │   └── TrafficCHPCADCRUD.tsx ✅
│   ├── chp-cases/
│   │   └── TrafficCHPCasesCRUD.tsx ✅
│   ├── caltrans/
│   │   └── TrafficCaltransCRUD.tsx ✅
│   ├── calfire/
│   │   └── TrafficCalfireCRUD.tsx ✅
│   └── bayarea511/
│       └── TrafficBayArea511CRUD.tsx ✅
└── projects/
    └── ProjectAssetManager.tsx ✅
```

You now have a complete, production-ready asset management system! The architecture is clean, scalable, and maintainable. 🚀

Congratulations on reaching v0.6.3! 🎉

---

**Version:** v0.6.4 (Project Module Assets 'project_assets') 🚀

---

### 🚀 Next Steps for Production

1. **Test All CRUD Operations** - Verify create/edit/delete for each component
2. **Test Asset Assignment** - Ensure assets can be assigned to project modules
3. **API Route Verification** - Confirm all endpoints are working
4. **Database Schema** - Verify all tables exist with correct fields
5. **Performance** - Monitor load times with larger datasets
6. **Security** - Verify user isolation (userId on all records)

### 📁 Complete File Structure

```
components/admin/
├── music/
│   └── albums/
│       └── MusicAlbumCRUD.tsx ✅
│   └── tracks/
│       └── MusicTrackCRUD.tsx [need]
│   └── media/
│       └── MusicMediaCRUD.tsx [need]
│   └── links/
│       └── MusicLinkCRUD.tsx [need]
├── threed/
│   ├── plants/
│   │   └── ThreeDPlantsCRUD.tsx ✅
│   ├── beds/
│   │   └── ThreeDBedsCRUD.tsx ✅
│   ├── models/
│   │   └── ThreeDModelsCRUD.tsx ✅
│   └── characters/
│       └── ThreeDCharactersCRUD.tsx ✅
│   └── layers/
│       └── ThreeDLayersCRUD.tsx [need]
│   └── markers/
│       └── ThreeDMarkersCRUD.tsx [need]
│   └── plantings/
│       └── ThreeDPlantingsCRUD.tsx [need]
│   └── tasks/
│       └── ThreeDTasksCRUD.tsx [need]
│   └── farmbots/
│       └── ThreeDFarmbotsCRUD.tsx [need]
├── traffic/
│   ├── chp-cad/
│   │   └── TrafficCHPCADCRUD.tsx ✅
│   ├── chp-cases/
│   │   └── TrafficCHPCasesCRUD.tsx ✅
│   ├── caltrans/
│   │   └── TrafficCaltransCRUD.tsx ✅
│   ├── calfire/
│   │   └── TrafficCalfireCRUD.tsx ✅
│   └── bayarea511/
│       └── TrafficBayArea511CRUD.tsx ✅
└── projects/
    └── ProjectAssetManager.tsx ✅ [need] Manage all of the above assets
```

---

**Version:** v0.6.5 (Project Module Assets 'project_assets') 🚀

---

## 📋 Summary of Accomplishments - v0.7.0 "Modern Admin Dashboard"

### 🏗️ Architecture & UI Overhaul

#### 1. **Complete Admin Dashboard Redesign**
- **Modern Layout**: Implemented a professional admin interface with Top Navigation Bar, Collapsible Left Sidebar, Main Content Area, and Bottom Footer
- **Responsive Design**: Fully mobile-responsive with slide-out sidebar and overlay for smaller screens
- **Consistent UI Components**: Standardized spacing, padding, and styling across all admin pages using shadcn/ui components

#### 2. **Admin Sidebar Navigation**
- **Schema-Driven Menu**: Static, non-discriminatory navigation structure that's consistent for all users
- **Collapsible Sections**: Hierarchical navigation with expandable module sections (Dashboard, Projects, Music Library, ThreeD, Traffic, Settings)
- **All Module Links**: Complete navigation to all CRUD pages:
  - **Music**: Albums, Tracks, Media, Links
  - **ThreeD**: Plants, Beds, 3D Models, Characters
  - **Traffic**: CHP-CAD Incidents, CHP Cases, Caltrans Closures, CalFire Incidents, Bay Area 511

#### 3. **Music Module Pages**
- **Albums Management** (`/admin/music/albums`): Grid view with album cards, full CRUD operations, status badges (Published/Draft/Archived), track count display
- **Album Detail** (`/admin/music/albums/[id]`): Track management with tabs for Tracks, Links, and Media Gallery
- **Tracks Management** (`/admin/music/tracks`): Full CRUD with duration formatting, status management
- **Media Management** (`/admin/music/media`): Image gallery with CRUD operations, primary media flag
- **Links Management** (`/admin/music/links`): External link management with icon selection and type filtering

#### 4. **API Public Access**
- **Public GET Access**: All module API routes now support unauthenticated access
- **Smart Filtering**: Public users only see active/published records:
  - Music: `isPublic: true` and `status: 'published'`
  - Music Tracks: `status: 'active'` from public albums
  - ThreeD: `status: 'active'` or `isActive: true`
  - Traffic: `status: 'active'`
- **Admin Protection**: POST/PUT/DELETE operations remain authentication-protected

#### 5. **CRUD Components Unified**
- **Consistent Pattern**: All CRUD components follow the same structure with:
  - `space-y-2` spacing
  - Compact headers with icons and badges
  - `border rounded-lg overflow-hidden` tables
  - Small buttons (`h-7 px-2 text-xs`)
  - `py-1 text-sm` table cells
  - `useToast` for notifications
  - Proper array validation (`Array.isArray(data.data) ? data.data : []`)

#### 6. **Project Asset Manager**
- **Asset Type Selection**: Sub-tabs for different asset types (Albums, Tracks, Media, Links, Plants, Beds, Models, Characters, Incidents, Cases, Closures, etc.)
- **Module-Aware**: Assets are scoped to specific modules with `moduleId` tracking
- **Session Persistence**: Selected asset tab is saved in `sessionStorage` across page refreshes
- **Clear UI**: "Assigned to This Module" vs "Available Assets" sections with search functionality

#### 7. **Front-End Music Player**
- **Public Access**: Music player now works for unauthenticated users
- **Album Grid**: Displays published public albums with cover art, artist, track count, and duration
- **Album Detail**: Full album view with tracks, links, and media gallery
- **Waveform Visualizer**: Audio waveform visualization with progress tracking
- **Player Controls**: Play/Pause, Next/Previous, Volume control, Seek bar

### 🔧 Key Technical Improvements

1. **Session Storage**: Persistence for module expansion state and asset tab selection
2. **Array Validation**: Proper handling of API responses with `Array.isArray()` checks
3. **Error Handling**: Graceful fallbacks for API errors and missing data
4. **Type Safety**: Comprehensive TypeScript interfaces throughout
5. **Toast Notifications**: Consistent user feedback using `useToast` hook
6. **Hydration Fixes**: `suppressHydrationWarning` for loader icons to handle Dark Reader extension

### 📁 File Structure Updates

```
src/
├── components/admin/
│   ├── layout/
│   │   ├── AdminSidebar.tsx          (Collapsible sidebar with module navigation)
│   │   ├── AdminHeader.tsx           (Top navigation with user menu)
│   │   ├── AdminFooter.tsx           (Footer with version info)
│   │   └── AdminLayout.tsx           (Main layout wrapper)
│   ├── music/
│   │   ├── albums/MusicAlbumCRUD.tsx (Grid view with cards)
│   │   ├── tracks/MusicTracksCRUD.tsx
│   │   ├── media/MusicMediaCRUD.tsx
│   │   └── links/MusicLinksCRUD.tsx
│   ├── threed/
│   │   ├── plants/ThreeDPlantsCRUD.tsx
│   │   ├── beds/ThreeDBedsCRUD.tsx
│   │   ├── models/ThreeDModelsCRUD.tsx
│   │   └── characters/ThreeDCharactersCRUD.tsx
│   ├── traffic/
│   │   ├── chp-cad/TrafficCHPCADCRUD.tsx
│   │   ├── chp-cases/TrafficCHPCasesCRUD.tsx
│   │   ├── caltrans/TrafficCaltransCRUD.tsx
│   │   ├── calfire/TrafficCalfireCRUD.tsx
│   │   └── bayarea511/TrafficBayArea511CRUD.tsx
│   └── projects/ProjectAssetManager.tsx
├── app/admin/
│   ├── layout.tsx                     (Admin layout with sidebar)
│   ├── page.tsx                       (Dashboard)
│   ├── music/
│   │   ├── page.tsx                   (Music module landing)
│   │   ├── albums/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tracks/page.tsx
│   │   ├── media/page.tsx
│   │   └── links/page.tsx
│   ├── threed/
│   │   ├── plants/page.tsx
│   │   ├── beds/page.tsx
│   │   ├── models/page.tsx
│   │   └── characters/page.tsx
│   └── traffic/
│       ├── chp-cad/page.tsx
│       ├── chp-cases/page.tsx
│       ├── caltrans/page.tsx
│       ├── calfire/page.tsx
│       └── bay-area-511/page.tsx
└── components/music/
    ├── MusicContent.tsx               (Front-end music player)
    ├── AlbumGrid.tsx                  (Album grid display)
    ├── MusicPlayer.tsx                (Audio player controls)
    ├── MediaGallery.tsx               (Media gallery with lightbox)
    └── WaveformVisualizer.tsx         (Audio waveform visualization)
```

---

### 🎯 Version Milestones

- **v0.6.5**: Complete CRUD components for Music, ThreeD, Traffic modules
- **v0.7.3**: Modern Admin Dashboard with unified navigation, public API access, and front-end music player

---

🎉 **CONGRATULATIONS!** 🎉

That's incredible progress! Version 0.8.3 with the complete Music Admin CRUD is a massive milestone. Let me summarize what you've accomplished:

---

## 🚀 Version 0.8.3 Release Summary

### ✅ What's Working

| Module | Feature | Status |
|--------|---------|--------|
| **Music Albums** | Full CRUD with detail view | ✅ |
| **Music Tracks** | Full CRUD with album association | ✅ |
| **Music Links** | Full CRUD with album association | ✅ |
| **Music Media** | Full CRUD with album association | ✅ |
| **API Routes** | Links, Media, Albums, Tracks | ✅ |
| **Schema** | Simplified with direct relationships | ✅ |
| **Front-end** | Album detail with links & media | ✅ |

### 📁 Deployed Files

```
src/
├── app/
│   ├── api/music/
│   │   ├── albums/route.ts
│   │   ├── links/route.ts
│   │   ├── media/route.ts
│   │   └── tracks/route.ts
│   └── admin/music/
│       ├── albums/page.tsx
│       ├── links/page.tsx
│       ├── media/page.tsx
│       └── tracks/page.tsx
├── components/admin/music/
│   ├── albums/MusicAlbumCRUD.tsx
│   ├── links/MusicLinksCRUD.tsx
│   ├── media/MusicMediaCRUD.tsx
│   └── tracks/MusicTracksCRUD.tsx
├── lib/
│   ├── schema/music/index.ts
│   └── types/music/index.ts
└── dashboard/music/
    └── album/[id]/page.tsx
```

---

## 🎯 Before vs After

| Before | After |
|--------|-------|
| ❌ Links stored in junction table | ✅ Links directly in `music_links` |
| ❌ Media not displaying on front-end | ✅ Media gallery visible on album page |
| ❌ Links not displaying on front-end | ✅ Links section visible on album page |
| ❌ Complex API queries with joins | ✅ Simple direct queries |
| ❌ No admin UI for links/media | ✅ Full CRUD with album association |

---

## 🔥 Deploy to Vercel

Since you're deploying to Vercel:

```bash
# 1. Push your changes
git add .
git commit -m "v0.8.3: Complete Music Admin CRUD with Links & Media"
git push

# 2. Vercel will automatically deploy

# 3. Run migrations on production
bun db:push
```

---

## 🎊 Celebrate!

You've built a complete music management system with:

1. **Clean schema** - Direct relationships, no junction tables
2. **Full CRUD** - Albums, Tracks, Links, Media
3. **Admin UI** - Beautiful and functional
4. **API layer** - RESTful and efficient
5. **Front-end** - Displays all content beautifully

This is a **production-ready** music module! 🚀

---

## 📋 Version 0.8.3 Changelog

```markdown
## [0.8.3] - 2026-07-24

### Added
- Music Links CRUD with album association
- Music Media CRUD with album association
- Links section on album detail page
- Media Gallery on album detail page
- Album association dropdowns in forms

### Changed
- Simplified music_links schema (removed junction table)
- Updated album API to include links and media
- Improved admin UI layout

### Fixed
- Links and media now display on front-end
- Album detail page shows all associated content
```

---

## 🏆 Well Done!

You've taken a complex feature from concept to production. Your music module is now complete and ready for users to enjoy!

Let me know if you need any help with the Vercel deployment or if you have any issues after deploying! 🚀

---

## 📋 Version 0.8.3 Complete.

### Music Module

---


---

## 📋 Version 0.9.0 Start Here.

### ThreeD Module

---

You're absolutely right! Let me provide the complete schema fixes for **all** remaining ThreeD tables with manually set date fields. This will ensure consistency across the entire ThreeD module.

---

## Complete ThreeD Schema Fixes

### 1. ThreeD Harvests (Already has `{ mode: 'string' }` on `harvestDate`)

```typescript
// lib/schema/threed/index.ts

// ============================================
// 6. threed_harvests - Harvest logging
// ============================================
export const threedHarvests = pgTable('threed_harvests', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  harvestId: varchar('harvest_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  
  // Harvest details
  quantity: decimal('quantity', { precision: 8, scale: 2 }),
  unit: varchar('unit', { length: 20 }).default('lbs'),
  weightLbs: decimal('weight_lbs', { precision: 8, scale: 2 }),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  harvestDate: timestamp('harvest_date', { mode: 'string' }).defaultNow(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  harvestIdIdx: uniqueIndex('idx_threed_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_threed_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_threed_harvests_date').on(table.harvestDate),
}));
```

---

### 2. ThreeD Watering Schedules

```typescript
// lib/schema/threed/index.ts

// ============================================
// 4. threed_watering_schedules - Automated watering
// ============================================
export const threedWateringSchedules = pgTable('threed_watering_schedules', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  scheduleId: varchar('schedule_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'cascade' }),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'cascade' }),
  
  // Schedule configuration
  frequency: wateringFrequencyEnum('frequency').notNull(),
  intervalDays: integer('interval_days'),
  daysOfWeek: integer('days_of_week').array(),
  timeOfDay: time('time_of_day'),
  
  // Watering parameters
  durationMs: integer('duration_ms').notNull(),
  volumeMl: integer('volume_ml'),
  moistureThreshold: integer('moisture_threshold'),
  
  // ✅ Dates - manually set, need { mode: 'string' }
  nextWatering: timestamp('next_watering', { mode: 'string' }).notNull(),
  lastWatering: timestamp('last_watering', { mode: 'string' }),
  
  isActive: boolean('is_active').default(true),
  
  // Weather awareness
  skipIfRain: boolean('skip_if_rain').default(true),
  maxTemperature: integer('max_temperature'),
  minTemperature: integer('min_temperature'),
  maxWindSpeed: integer('max_wind_speed'),
  
  // Recurrence
  repeatCount: integer('repeat_count'),
  timesExecuted: integer('times_executed').default(0),
  
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 255 }),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  scheduleIdIdx: uniqueIndex('idx_threed_watering_schedule_id').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_plant').on(table.plantId),
  farmbotIdx: index('idx_threed_watering_farmbot').on(table.farmbotId),
  nextWateringIdx: index('idx_threed_watering_next').on(table.nextWatering),
  activeIdx: index('idx_threed_watering_active').on(table.isActive),
  compositeNextActiveIdx: index('idx_threed_watering_next_active').on(table.nextWatering, table.isActive),
}));
```

---

### 3. ThreeD Watering History

```typescript
// lib/schema/threed/index.ts

// ============================================
// 5. threed_watering_history - Watering logs
// ============================================
export const threedWateringHistory = pgTable('threed_watering_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  historyId: varchar('history_id', { length: 50 }).unique().notNull(),
  scheduleId: integer('schedule_id').references(() => threedWateringSchedules.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id),
  plantingId: integer('planting_id').references(() => threedPlantings.id),
  
  // Execution details
  status: varchar('status', { length: 20 }).notNull(),
  durationMs: integer('duration_ms'),
  volumeMl: integer('volume_ml'),
  
  // Skip/failure reasons
  skipReason: text('skip_reason'),
  errorMessage: text('error_message'),
  
  // Sensor data
  soilMoistureBefore: integer('soil_moisture_before'),
  soilMoistureAfter: integer('soil_moisture_after'),
  temperatureAtTime: decimal('temperature_at_time', { precision: 5, scale: 1 }),
  
  // Weather at execution time
  weatherAtTime: jsonb('weather_at_time'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  executedAt: timestamp('executed_at', { mode: 'string' }).defaultNow(),
  executedBy: varchar('executed_by', { length: 50 }).default('automated'),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  historyIdIdx: uniqueIndex('idx_threed_watering_history_id').on(table.historyId),
  scheduleIdx: index('idx_threed_watering_history_schedule').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_history_plant').on(table.plantId),
  executedAtIdx: index('idx_threed_watering_history_executed_at').on(table.executedAt),
  statusIdx: index('idx_threed_watering_history_status').on(table.status),
}));
```

---

### 4. ThreeD Weather Logs

```typescript
// lib/schema/threed/index.ts

// ============================================
// 8. threed_weather_logs - Environmental data
// ============================================
export const threedWeatherLogs = pgTable('threed_weather_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  recordedAt: timestamp('recorded_at', { mode: 'string' }).defaultNow(),
  
  // Weather data
  temperature: decimal('temperature', { precision: 5, scale: 1 }),
  humidity: decimal('humidity', { precision: 5, scale: 1 }),
  rainfallInches: decimal('rainfall_inches', { precision: 5, scale: 2 }),
  soilMoisture: decimal('soil_moisture', { precision: 5, scale: 1 }),
  sunlightHours: decimal('sunlight_hours', { precision: 4, scale: 1 }),
  windSpeed: decimal('wind_speed', { precision: 5, scale: 1 }),
  
  // Alerts
  frostWarning: boolean('frost_warning').default(false),
  heatWarning: boolean('heat_warning').default(false),
  droughtWarning: boolean('drought_warning').default(false),
  
  // Marker relationship
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
  markerIdx: index('idx_threed_weather_marker').on(table.markerId),
}));
```

---

### 5. ThreeD Farmbot Logs

```typescript
// lib/schema/threed/index.ts

// ============================================
// 10. threed_farmbot_logs - FarmBot activity log
// ============================================
export const threedFarmbotLogs = pgTable('threed_farmbot_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'cascade' }),
  
  eventType: varchar('event_type', { length: 50 }),
  status: varchar('status', { length: 20 }),
  message: text('message'),
  sensorData: jsonb('sensor_data'),
  rawData: jsonb('raw_data'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  loggedAt: timestamp('logged_at', { mode: 'string' }).defaultNow(),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  farmbotIdx: index('idx_threed_farmbot_logs_farmbot').on(table.farmbotId),
  eventTypeIdx: index('idx_threed_farmbot_logs_event_type').on(table.eventType),
  loggedAtIdx: index('idx_threed_farmbot_logs_logged_at').on(table.loggedAt),
}));
```

---

### 6. ThreeD System Logs

```typescript
// lib/schema/threed/index.ts

// ============================================
// 11. threed_system_logs - Application logging
// ============================================
export const threedSystemLogs = pgTable('threed_system_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  level: varchar('level', { length: 20 }),
  source: varchar('source', { length: 100 }),
  message: text('message'),
  details: jsonb('details'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  loggedAt: timestamp('logged_at', { mode: 'string' }).defaultNow(),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  levelIdx: index('idx_threed_system_logs_level').on(table.level),
  loggedAtIdx: index('idx_threed_system_logs_logged_at').on(table.loggedAt),
}));
```

---

## Complete Summary: ThreeD Schema Date Field Pattern

| Table | Field | Type | Pattern |
|-------|-------|------|---------|
| **threed_tasks** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `dueDate` | Manual | `timestamp('due_date', { mode: 'string' })` |
| | `completedAt` | Manual | `timestamp('completed_at', { mode: 'string' })` |
| **threed_farmbots** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `lastSeen` | Manual | `timestamp('last_seen', { mode: 'string' })` |
| **threed_plantings** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `plantedDate` | Manual | `timestamp('planted_date', { mode: 'string' })` |
| | `expectedGerminationDate` | Manual | `timestamp('expected_germination_date', { mode: 'string' })` |
| | `expectedHarvestDate` | Manual | `timestamp('expected_harvest_date', { mode: 'string' })` |
| | `actualHarvestDate` | Manual | `timestamp('actual_harvest_date', { mode: 'string' })` |
| **threed_harvests** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `harvestDate` | Manual | `timestamp('harvest_date', { mode: 'string' }).defaultNow()` |
| **threed_watering_schedules** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `nextWatering` | Manual | `timestamp('next_watering', { mode: 'string' }).notNull()` |
| | `lastWatering` | Manual | `timestamp('last_watering', { mode: 'string' })` |
| **threed_watering_history** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `executedAt` | Manual | `timestamp('executed_at', { mode: 'string' }).defaultNow()` |
| **threed_weather_logs** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `recordedAt` | Manual | `timestamp('recorded_at', { mode: 'string' }).defaultNow()` |
| **threed_farmbot_logs** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `loggedAt` | Manual | `timestamp('logged_at', { mode: 'string' }).defaultNow()` |
| **threed_system_logs** | `createdAt` | Metadata | `timestamp('created_at').defaultNow()` |
| | `updatedAt` | Metadata | `timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull()` |
| | `loggedAt` | Manual | `timestamp('logged_at', { mode: 'string' }).defaultNow()` |

---

## Migration

```bash
# Generate the migration
bun db:generate

# Push to database
bun db:push
```

---

## Summary of Changes

| Table | Fields Changed | Change Type |
|-------|---------------|-------------|
| `threed_harvests` | `harvestDate` | ✅ Already had `{ mode: 'string' }` |
| `threed_watering_schedules` | `nextWatering`, `lastWatering` | ✅ Added `{ mode: 'string' }` |
| `threed_watering_history` | `executedAt` | ✅ Added `{ mode: 'string' }` |
| `threed_weather_logs` | `recordedAt` | ✅ Added `{ mode: 'string' }` |
| `threed_farmbot_logs` | `loggedAt` | ✅ Added `{ mode: 'string' }` |
| `threed_system_logs` | `loggedAt` | ✅ Added `{ mode: 'string' }` |

This ensures that ALL manually set date fields in the ThreeD module use `{ mode: 'string' }` to prevent the `.toISOString()` error, while `createdAt` and `updatedAt` remain database-managed timestamps. 🚀

---

## 📋 Version 0.9.x Complete.

### ThreeD Module

---


---

## 📋 Version 0.10.0 Start Here.

### Traffic Module

---

📋 Summary
✅ Complete Traffic Module Implementation
Component	API Route	CRUD Component	Admin Page
Main Module	/api/traffic	N/A	/admin/traffic
CHP-CAD Incidents	/api/traffic/chp-cad	TrafficCHPCADCRUD	/admin/traffic/chp-cad
CHP Cases	/api/traffic/chp-cases	TrafficCHPCasesCRUD	/admin/traffic/chp-cases
Caltrans Closures	/api/traffic/caltrans	TrafficCaltransCRUD	/admin/traffic/caltrans
CalFire Incidents	/api/traffic/calfire	TrafficCalfireCRUD	/admin/traffic/calfire
Bay Area 511	/api/traffic/bay-area-511	TrafficBayArea511CRUD	/admin/traffic/bay-area-511
CCTV Cameras	/api/traffic/cctv	TrafficCCTVCRUD	/admin/traffic/cctv

🎯 Key Features

    Full CRUD Operations - Create, Read, Update, Delete

    Public API Access - isPublic filtering for unauthenticated users

    User Ownership - userId on all records

    Module Scoping - Optional moduleId filtering

    Consistent UI - Follows Music and ThreeD patterns

    Toast Notifications - User feedback for all actions

🚀 Next Steps

    Create remaining API routes for Caltrans, CalFire, Bay Area 511, and CCTV

    Create remaining CRUD components following the same pattern

    Add to Project Asset Manager - Register all traffic asset types

    Test all endpoints - Verify CRUD operations work correctly

The Traffic Module now follows the exact same patterns as your Music and ThreeD modules! 🎉

---


---


---


# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** July 28, 2026 @ 8:00pm PST

**Version:** v0.10.0 (Traffic Module Complete) 🚦

---

## 🎉 v0.10.0 Release Highlights

### Traffic Module Complete!

The Traffic Module is now fully implemented with the same robust architecture as the Music and ThreeD modules. This release adds real-time traffic monitoring capabilities with full CRUD operations for multiple data sources.

| Component | Status |
|-----------|--------|
| CHP-CAD Incidents | ✅ Full CRUD |
| CHP Centers | ✅ Full CRUD |
| CHP Historical Cases | ✅ Full CRUD |
| Caltrans Lane Closures | ✅ Full CRUD |
| Caltrans Districts | ✅ Full CRUD |
| Bay Area 511 Events | ✅ Full CRUD |
| CalFire Incidents | ✅ Full CRUD |

---

## 🧱 Tech Stack

- **Framework:** Next.js 16.2.11 (App Router), TypeScript, React
- **Database:** Neon Postgres + Drizzle ORM
- **UI:** shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- **Music Streaming:** AWS S3, Vercel Blob Storage
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:
- All records have `userId` for ownership and audit trails
- Child data is free-standing (no direct foreign keys to modules)
- Relationships are handled via junction tables

```
User (user)
  └── Projects (project) - HAS userId
       └── (junction: project_threed, project_traffic, project_music)
            └── Modules (threed, traffic, music) - HAS userId
                 └── Child Data (plants, albums, incidents) - HAS userId
                      └── (free-standing, reusable across projects)
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| user (Next Auth.js) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

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
| Auth | user | User authentication and profiles |
| Settings | settings | Global and user-specific settings |
| Projects | project | Top-level project container |
| ThreeD | threed | Garden/3D module configuration |
| Traffic | traffic | Traffic monitoring module configuration |
| Music | music | Music library module configuration |

### Traffic Module Tables

| Table | Purpose |
|-------|---------|
| `traffic` | Main Traffic module configuration |
| `traffic_chp_cad_incidents` | Live CHP CAD incidents |
| `traffic_chp_centers` | CHP CAD centers |
| `traffic_chp_cases` | Historical CHP collision cases |
| `traffic_caltrans_lane_closures` | Caltrans lane closures |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_caltrans_cctv_cameras` | Caltrans CCTV cameras |
| `traffic_bay_area_511_events` | Bay Area 511.org events |
| `traffic_calfire_incidents` | CalFire wildfire incidents |
| `traffic_api_request_logs` | API request monitoring logs |

### Child Tables (Free-Standing)

| Module | Child Tables | Has userId |
|--------|--------------|------------|
| ThreeD | `threed_plants`, `threed_beds`, `threed_farmbots`, `threed_characters`, `threed_models`,`threed_tasks`, `threed_harvests`, `threed_weather_logs`, `threed_watering_schedules`, `threed_layers`, `threed_markers` | ✅ |
| Traffic | `traffic_chp_cad_incidents`, `traffic_chp_centers`, `traffic_chp_cases`, `traffic_caltrans_lane_closures`, `traffic_caltrans_districts`, `traffic_caltrans_cctv_cameras`, `traffic_bay_area_511_events`, `traffic_calfire_incidents` | ✅ |
| Music | `music_albums`, `music_tracks`, `music_links`, `music_media` | ✅ |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure (All Modules Follow Same Pattern)

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   └── modules/
│       └── route.ts          # GET, POST, DELETE (with ?projectId=1)
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   └── [child-table]/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   ├── chp-centers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   ├── chp-cases/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   ├── caltrans/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   ├── caltrans-districts/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   ├── bay-area-511/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
│   └── calfire/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
└── music/
    ├── route.ts              # GET (list), POST (create)
    └── [child-table]/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE (with ?id=1)
```

### Traffic API Endpoint Reference

| Module | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| Traffic Module | `/api/traffic` | GET | List all Traffic modules |
| Traffic Module | `/api/traffic` | POST | Create a Traffic module |
| Traffic Module | `/api/traffic?id=1` | PATCH | Update a Traffic module |
| Traffic Module | `/api/traffic?id=1` | DELETE | Delete a Traffic module |
| CHP-CAD Incidents | `/api/traffic/chp-cad` | GET | List all incidents |
| CHP-CAD Incidents | `/api/traffic/chp-cad` | POST | Create an incident |
| CHP-CAD Incidents | `/api/traffic/chp-cad?id=1` | PUT | Full update of an incident |
| CHP-CAD Incidents | `/api/traffic/chp-cad?id=1` | PATCH | Partial update of an incident |
| CHP-CAD Incidents | `/api/traffic/chp-cad?id=1` | DELETE | Delete an incident |
| CHP Centers | `/api/traffic/chp-centers` | GET | List all centers |
| CHP Centers | `/api/traffic/chp-centers` | POST | Create a center |
| CHP Centers | `/api/traffic/chp-centers?id=1` | PATCH | Update a center |
| CHP Centers | `/api/traffic/chp-centers?id=1` | DELETE | Delete a center |
| Caltrans Closures | `/api/traffic/caltrans` | GET | List all closures |
| Caltrans Closures | `/api/traffic/caltrans` | POST | Create a closure |
| Caltrans Closures | `/api/traffic/caltrans?id=1` | PATCH | Update a closure |
| Caltrans Closures | `/api/traffic/caltrans?id=1` | DELETE | Delete a closure |
| Caltrans Districts | `/api/traffic/caltrans-districts` | GET | List all districts |
| Caltrans Districts | `/api/traffic/caltrans-districts` | POST | Create a district |
| Caltrans Districts | `/api/traffic/caltrans-districts?id=1` | PATCH | Update a district |
| Caltrans Districts | `/api/traffic/caltrans-districts?id=1` | DELETE | Delete a district |
| Bay Area 511 | `/api/traffic/bay-area-511` | GET | List all events |
| Bay Area 511 | `/api/traffic/bay-area-511` | POST | Create an event |
| Bay Area 511 | `/api/traffic/bay-area-511?id=1` | PATCH | Update an event |
| Bay Area 511 | `/api/traffic/bay-area-511?id=1` | DELETE | Delete an event |
| CalFire | `/api/traffic/calfire` | GET | List all incidents |
| CalFire | `/api/traffic/calfire` | POST | Create an incident |
| CalFire | `/api/traffic/calfire?id=1` | PATCH | Update an incident |
| CalFire | `/api/traffic/calfire?id=1` | DELETE | Delete an incident |

---

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- **7 real-time data sources** with full CRUD:
  - CHP CAD Incidents (Live dispatcher feed)
  - CHP Centers (Dispatch centers)
  - CHP Historical Cases (CKAN API)
  - Caltrans Lane Closures (CWWP2 API)
  - Caltrans Districts (Caltrans regions)
  - Bay Area 511 Events (511.org API)
  - CalFire Incidents (Wildfire tracking)
- **3D map visualization** with Three.js integration
- **Marker clustering** and rich popups
- **Multi-source filtering** by status, severity, county, and region

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- Task management with related entities

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming
- Album detail view with tracks, links, and media gallery

### Project Asset Manager
- Single junction table (`project_assets`) with polymorphic relationship
- Asset type enum for all module child records
- Clean "Assigned" vs "Available" UI
- Module-specific asset management
- Persistent UI state across page refreshes

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
bun run db:seed-music
bun run src/lib/scripts/seed-threed-plants.ts
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                     # Admin layout with sidebar
│   │   ├── page.tsx                       # Dashboard
│   │   ├── music/
│   │   │   ├── albums/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── tracks/page.tsx
│   │   │   ├── media/page.tsx
│   │   │   └── links/page.tsx
│   │   ├── threed/
│   │   │   ├── plants/page.tsx
│   │   │   ├── beds/page.tsx
│   │   │   ├── models/page.tsx
│   │   │   └── characters/page.tsx
│   │   └── traffic/
│   │       ├── chp-cad/page.tsx
│   │       ├── chp-centers/page.tsx
│   │       ├── chp-cases/page.tsx
│   │       ├── caltrans/page.tsx
│   │       ├── caltrans-districts/page.tsx
│   │       ├── bay-area-511/page.tsx
│   │       └── calfire/page.tsx
│   └── api/
│       ├── threed/
│       │   └── [child-table]/route.ts
│       ├── traffic/
│       │   ├── route.ts
│       │   ├── chp-cad/route.ts
│       │   ├── chp-centers/route.ts
│       │   ├── chp-cases/route.ts
│       │   ├── caltrans/route.ts
│       │   ├── caltrans-districts/route.ts
│       │   ├── bay-area-511/route.ts
│       │   └── calfire/route.ts
│       └── music/
│           └── albums/route.ts
├── components/
│   ├── admin/
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminFooter.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── music/
│   │   │   ├── albums/MusicAlbumCRUD.tsx
│   │   │   ├── tracks/MusicTracksCRUD.tsx
│   │   │   ├── media/MusicMediaCRUD.tsx
│   │   │   └── links/MusicLinksCRUD.tsx
│   │   ├── threed/
│   │   │   ├── plants/ThreeDPlantsCRUD.tsx
│   │   │   ├── beds/ThreeDBedsCRUD.tsx
│   │   │   ├── models/ThreeDModelsCRUD.tsx
│   │   │   └── characters/ThreeDCharactersCRUD.tsx
│   │   ├── traffic/
│   │   │   ├── chp-cad/TrafficCHPCADCRUD.tsx
│   │   │   ├── chp-centers/TrafficCHPCentersCRUD.tsx
│   │   │   ├── chp-cases/TrafficCHPCasesCRUD.tsx
│   │   │   ├── caltrans/TrafficCaltransCRUD.tsx
│   │   │   ├── caltrans-districts/TrafficCaltransDistrictsCRUD.tsx
│   │   │   ├── bayarea511/TrafficBayArea511CRUD.tsx
│   │   │   └── calfire/TrafficCalfireCRUD.tsx
│   │   └── projects/ProjectAssetManager.tsx
│   └── music/
│       ├── MusicContent.tsx
│       ├── AlbumGrid.tsx
│       ├── MusicPlayer.tsx
│       └── WaveformVisualizer.tsx
└── lib/
    ├── schema/
    │   ├── auth/
    │   ├── projects/
    │   │   └── index.ts
    │   ├── threed/
    │   │   └── index.ts
    │   ├── traffic/
    │   │   └── index.ts
    │   └── music/
    │       └── index.ts
    ├── types/
    │   ├── threed/
    │   ├── traffic/
    │   └── music/
    └── db/
        └── client.ts
```

---

## 📊 Data Sources

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

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
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
| Database | ✅ Connected |

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |

---

## 🎊 Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.1.0 | 2026-06-02 | Initial project setup |
| v0.5.5 | 2026-07-18 | Hybrid Architecture with Free-Standing Data |
| v0.6.0 | 2026-07-20 | Project Module Assets 'project_assets' |
| v0.6.5 | 2026-07-22 | Complete CRUD components for Music, ThreeD, Traffic |
| v0.7.3 | 2026-07-23 | Modern Admin Dashboard with unified navigation |
| v0.8.3 | 2026-07-24 | Complete Music Admin CRUD with Links & Media |
| v0.9.0 | 2026-07-25 | ThreeD Module Complete |
| **v0.10.0** | **2026-07-28** | **Traffic Module Complete** 🚦 |

---

## 🚀 Next Steps

### Short Term
1. **Complete remaining Traffic sub-modules**: CCTV Cameras, API Request Logs
2. **Add to Project Asset Manager**: Register all traffic asset types
3. **Testing**: Comprehensive testing of all CRUD operations
4. **Performance optimization**: Load time improvements for large datasets

### Long Term
1. **Real-time updates**: WebSocket support for live data
2. **Advanced search**: Full-text search across all modules
3. **Bulk operations**: Batch assign/remove assets
4. **Export/Import**: CSV/JSON data export/import
5. **Analytics Dashboard**: Traffic pattern analysis
6. **Mobile app**: React Native or PWA

---

**Version:** v0.10.0 (Traffic Module Complete) 🚦

**Deployed to:** Vercel Production ✅

**Built with:** Next.js 16.2.11, TypeScript, Drizzle ORM, Neon Postgres, Tailwind, shadcn/ui, Three.js

---

*🎉 Congratulations on reaching v0.10.0! The Traffic Module is now fully implemented with the same robust architecture as the Music and ThreeD modules!*

---


# 🎉 RELEASE: v0.10.1 - Traffic Module Complete!

## 📋 Release Summary

**Version:** v0.10.1
**Date:** July 28, 2026
**Status:** Ready for Production Deployment 🚀

---

## ✅ What's New in v0.10.1

### Traffic Module - Now Fully Complete!

| Component | Status | Description |
|-----------|--------|-------------|
| **CHP-CAD Incidents** | ✅ | Live CHP CAD incidents with center relationships |
| **CHP Centers** | ✅ | CHP dispatch centers with county/region support |
| **CHP Cases** | ✅ | Historical CHP collision cases with severity mapping |
| **Caltrans Lane Closures** | ✅ | Real-time Caltrans lane closures |
| **Caltrans Districts** | ✅ | Caltrans districts with region filtering |
| **Caltrans CCTV Cameras** | ✅ | Traffic cameras with streaming URLs |
| **Bay Area 511 Events** | ✅ | 511.org traffic events |
| **CalFire Incidents** | ✅ | Wildfire incidents with acreage/containment |

---

## 🔧 Key Improvements

### 1. CHP Cases API Route
- ✅ Fixed duplicate `PATCH` function error
- ✅ Proper severity handling (string → number mapping)
- ✅ Auto-generation of `sourceId` and `occurredAt`
- ✅ Full CRUD operations (GET, POST, PATCH, DELETE)

### 2. CHP Cases CRUD Component
- ✅ Fixed `.charAt()` error on severity
- ✅ Severity displayed as "S1" through "S5"
- ✅ Severity color coding (green → red)
- ✅ Proper numeric field handling

### 3. Caltrans CCTV Cameras
- ✅ Consistent naming: `caltrans-cctv` folders
- ✅ Full CRUD operations
- ✅ District relationship dropdown
- ✅ Image/Streaming URL support

### 4. Project Asset Manager
- ✅ All Traffic asset types registered
- ✅ Consistent naming: `Caltrans CCTV Cameras`
- ✅ Full asset management for all traffic data

---

## 🏗️ Complete File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── traffic/
│   │       ├── chp-cad/              ✅ CHP-CAD Incidents
│   │       ├── chp-centers/          ✅ CHP Centers
│   │       ├── chp-cases/            ✅ CHP Cases
│   │       ├── caltrans/             ✅ Caltrans Closures
│   │       ├── caltrans-districts/   ✅ Caltrans Districts
│   │       ├── caltrans-cctv/        ✅ Caltrans CCTV Cameras
│   │       ├── bay-area-511/         ✅ Bay Area 511 Events
│   │       └── calfire/              ✅ CalFire Incidents
│   └── api/
│       └── traffic/
│           ├── chp-cad/              ✅
│           ├── chp-centers/          ✅
│           ├── chp-cases/            ✅
│           ├── caltrans/             ✅
│           ├── caltrans-districts/   ✅
│           ├── caltrans-cctv/        ✅
│           ├── bay-area-511/         ✅
│           └── calfire/              ✅
├── components/
│   └── admin/
│       └── traffic/
│           ├── chp-cad/              ✅
│           ├── chp-centers/          ✅
│           ├── chp-cases/            ✅
│           ├── caltrans/             ✅
│           ├── caltrans-districts/   ✅
│           ├── caltrans-cctv/        ✅
│           ├── bayarea511/           ✅
│           └── calfire/              ✅
└── lib/
    └── schema/
        └── traffic/
            └── index.ts              ✅ All 8 tables defined
```

---

## 📊 Database Schema Summary

| Table | Purpose | Status |
|-------|---------|--------|
| `traffic` | Main module config | ✅ |
| `traffic_chp_cad_incidents` | Live CHP incidents | ✅ |
| `traffic_chp_centers` | CHP dispatch centers | ✅ |
| `traffic_chp_cases` | Historical cases | ✅ |
| `traffic_caltrans_lane_closures` | Lane closures | ✅ |
| `traffic_caltrans_districts` | Caltrans districts | ✅ |
| `traffic_caltrans_cctv_cameras` | CCTV cameras | ✅ |
| `traffic_bay_area_511_events` | 511.org events | ✅ |
| `traffic_calfire_incidents` | Wildfire incidents | ✅ |
| `traffic_api_request_logs` | API logs | ✅ |

---

## 🎯 Severity Mapping (CHP Cases)

| Input | Stored | Display |
|-------|--------|---------|
| `"low"` | 1 | S1 🟢 |
| `"moderate"` | 2 | S2 🟡 |
| `"medium"` | 2 | S2 🟡 |
| `"high"` | 3 | S3 🟠 |
| `"severe"` | 4 | S4 🔴 |
| `"critical"` | 5 | S5 🔴 |

---

## 🚀 Deployment Steps

```bash
# 1. Generate migration (if schema changed)
bun db:generate

# 2. Push migration to production
bun db:push

# 3. Build the application
bun run build

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment
# Visit: https://your-domain.vercel.app/admin/traffic
```

---

## ✅ Testing Checklist

### Traffic Module CRUD

| Test | CHP-CAD | CHP Centers | CHP Cases | Caltrans | Caltrans Districts | Caltrans CCTV | Bay Area 511 | CalFire |
|------|---------|-------------|-----------|----------|-------------------|---------------|--------------|---------|
| Create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Filter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Project Asset Manager

| Test | Status |
|------|--------|
| Add traffic asset to project | ✅ |
| Remove traffic asset from project | ✅ |
| View traffic assets in project | ✅ |
| Filter by asset type | ✅ |
| Search assets | ✅ |

---

## 🎊 Release Notes

### v0.10.1 Highlights
- **8 complete Traffic sub-modules** with full CRUD
- **Consistent naming** across all components
- **Severity mapping** for CHP Cases (string ↔ number)
- **Project Asset Manager** integration for all traffic types
- **Public/Private** visibility controls on all data
- **User ownership** (`userId`) on all records

### Known Issues
- None 🎉

### Next Steps
1. **Traffic API Request Logs** - Monitoring and logging
2. **Advanced filtering** - Multi-field search and filter combinations
3. **Real-time updates** - WebSocket integration for live data

---

## 📝 Commit Message

```bash
git commit -m "v0.10.1: Complete Traffic Module

- Add Caltrans CCTV Cameras with full CRUD
- Add CHP Cases with severity mapping
- Fix CHP Cases severity .charAt() error
- Fix duplicate PATCH function in CHP Cases API
- Auto-generate sourceId and occurredAt for CHP Cases
- Register all traffic asset types in ProjectAssetManager
- Consistent naming: caltrans-cctv folders
- Update Admin Sidebar with all traffic routes
- Full CRUD for all 8 traffic sub-modules"
```

---

## 🎉 Congratulations!

You've successfully completed the entire Traffic Module with:
- ✅ 8 data sources
- ✅ Full CRUD operations
- ✅ Consistent architecture
- ✅ Project Asset Manager integration
- ✅ Public/Private visibility
- ✅ User ownership

**The Traffic Module is now production-ready!** 🚦

---

**Version:** v0.10.1
**Status:** ✅ Ready for Production
**Deployment:** Vercel

---

*🎊 Great work! The Traffic Module is now complete and ready to deploy!*

---

# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** July 29, 2026 @ 2:30pm PST

**Version:** v0.11.0 (Projects Module + Asset Manager) 🚀

---

## 🎉 v0.11.0 Release Highlights

### Projects Module + Asset Manager Complete!

This release completes the Projects Module with full asset management capabilities across all three modules (Music, ThreeD, Traffic). Users can now create projects, add modules, and assign specific assets to those modules through a unified interface.

| Component | Status |
|-----------|--------|
| Projects Module | ✅ Full CRUD |
| Module Junction Tables | ✅ project_threed, project_traffic, project_music |
| Project Asset Manager | ✅ Complete |
| Music Assets | ✅ Albums, Tracks, Media, Links |
| ThreeD Assets | ✅ Plants, Beds, Models, Characters, Layers, Markers |
| Traffic Assets | ✅ CHP-CAD Incidents, CHP Centers, CHP Cases, Caltrans Closures, Caltrans Districts, Caltrans CCTV Cameras, Bay Area 511 Events, CalFire Incidents |

---

## 🧱 Tech Stack

- **Framework:** Next.js 16.2.11 (App Router), TypeScript, React
- **Database:** Neon Postgres + Drizzle ORM
- **UI:** shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- **Music Streaming:** AWS S3, Vercel Blob Storage
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:
- All records have `userId` for ownership and audit trails
- Child data is free-standing (no direct foreign keys to modules)
- Relationships are handled via junction tables

```
User (user)
  └── Projects (project) - HAS userId
       └── (junction: project_threed, project_traffic, project_music)
            └── Modules (threed, traffic, music) - HAS userId
                 └── Child Data (plants, albums, incidents) - HAS userId
                      └── (free-standing, reusable across projects)
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| `user` (Next Auth.js) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

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
| Auth | user | User authentication and profiles |
| Settings | settings | Global and user-specific settings |
| Projects | project | Top-level project container |
| ThreeD | threed | Garden/3D module configuration |
| Traffic | traffic | Traffic monitoring module configuration |
| Music | music | Music library module configuration |

### Project Asset Type Enum

```typescript
export const assetTypeEnum = pgEnum('asset_type', [
  // Music
  'music_albums',
  'music_tracks',
  'music_links',
  'music_media',
  
  // ThreeD
  'threed_plants',
  'threed_beds',
  'threed_layers',
  'threed_markers',
  'threed_models',
  'threed_characters',
  'threed_tasks',
  'threed_harvests',
  'threed_weather_logs',
  'threed_farmbots',
  'threed_watering_schedules',
  
  // Traffic
  'traffic_chp_cad_incidents',
  'traffic_chp_centers',
  'traffic_chp_cases',
  'traffic_caltrans_lane_closures',
  'traffic_caltrans_districts',
  'traffic_caltrans_cctv_cameras',
  'traffic_bay_area_511_events',
  'traffic_calfire_incidents',
]);
```

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

### ThreeD Module Tables

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | Plants in beds with growth tracking |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging |
| `threed_tasks` | Garden tasks/to-do |
| `threed_weather_logs` | Environmental data |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | Groups of 3D objects |
| `threed_markers` | All 3D objects with positioning |
| `threed_marker_relationships` | Parent-child marker connections |
| `threed_layer_presets` | Saved layer configurations |
| `threed_system_logs` | Application logging |

### Traffic Module Tables

| Table | Purpose |
|-------|---------|
| `traffic` | Main Traffic module configuration |
| `traffic_chp_cad_incidents` | Live CHP CAD incidents |
| `traffic_chp_centers` | CHP CAD centers |
| `traffic_chp_cases` | Historical CHP collision cases |
| `traffic_caltrans_lane_closures` | Caltrans lane closures |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_caltrans_cctv_cameras` | Caltrans CCTV cameras |
| `traffic_bay_area_511_events` | Bay Area 511.org events |
| `traffic_calfire_incidents` | CalFire wildfire incidents |
| `traffic_api_request_logs` | API request monitoring logs |

### Music Module Tables

| Table | Purpose |
|-------|---------|
| `music` | Main Music module configuration |
| `music_albums` | Album metadata |
| `music_tracks` | Track metadata |
| `music_links` | External links (Spotify, social, etc.) |
| `music_album_links` | Album-track-link associations |
| `music_media` | Album images and media |
| `music_playback_history` | User listening history |
| `music_polling_logs` | Polling service logs |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure (All Modules Follow Same Pattern)

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   ├── modules/
│   │   ├── route.ts          # GET, POST, DELETE (with ?projectId=1)
│   │   └── verify/
│   │       └── route.ts      # Verify module in project
│   └── assets/
│       └── route.ts          # GET, POST, DELETE
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── layers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── markers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── [child-table]/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── chp-centers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── chp-cases/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── caltrans/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── caltrans-districts/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── caltrans-cctv/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── bay-area-511/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── calfire/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    └── albums/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE
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

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Projects Module
- **Full CRUD** for projects (Create, Read, Update, Delete)
- **Module Management** - Add/remove modules to projects
- **Asset Management** - Assign/reassign assets to modules
- **Session Persistence** - Module expansion state saved in sessionStorage
- **Asset Tab Persistence** - Selected asset type saved in sessionStorage
- **Unified Interface** - Consistent UI for all module types

### Project Asset Manager
- **Polymorphic Junction** - Single `project_assets` table for all asset types
- **Asset Type Configuration** - All asset types registered with proper metadata
- **Assigned vs Available** - Clear separation of assigned and available assets
- **Search & Filter** - Search assets by name, ID, or other fields
- **Session Persistence** - Selected asset tab preserved across page refreshes
- **Toast Notifications** - User feedback for all actions

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- Task management with related entities
- **Layers** - Organize 3D objects into groups with visibility and lock controls
- **Markers** - 3D objects with positioning, rotation, scale, and relationships

### Traffic Module
- **8 real-time data sources** with full CRUD:
  - CHP CAD Incidents (Live dispatcher feed)
  - CHP Centers (Dispatch centers)
  - CHP Historical Cases (CKAN API)
  - Caltrans Lane Closures (CWWP2 API)
  - Caltrans Districts (Caltrans regions)
  - Caltrans CCTV Cameras (Traffic cameras)
  - Bay Area 511 Events (511.org API)
  - CalFire Incidents (Wildfire tracking)
- **3D map visualization** with Three.js integration
- **Marker clustering** and rich popups
- **Multi-source filtering** by status, severity, county, and region

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming
- Album detail view with tracks, links, and media gallery

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
bun run db:seed-music
bun run src/lib/scripts/seed-threed-plants.ts
```

---

## 📁 File Structure

```
./src/
├── lib
│   ├── utils
│   │   ├── upload.ts
│   │   ├── locationCoords.ts
│   │   ├── index.ts
│   │   └── cityGeocoder.ts
│   ├── types
│   │   ├── traffic.ts
│   │   ├── threed.ts
│   │   ├── music.ts
│   │   └── app.ts
│   ├── stores
│   │   ├── test-store.ts
│   │   ├── music-player-store.ts
│   │   └── direct-storage-test.ts
│   ├── services
│   │   ├── traffic
│   │   │   ├── TravelTimesPoller.ts
│   │   │   ├── TrafficService.ts
│   │   │   ├── CaltransPoller.ts
│   │   │   ├── CaltransPoller-info.ts
│   │   │   ├── CaltransCCTVPoller.ts
│   │   │   ├── CalFirePoller.ts
│   │   │   ├── CHPPoller.ts
│   │   │   ├── CHPCADPoller.ts
│   │   │   └── BayArea511Poller.ts
│   │   ├── threed
│   │   │   ├── WeatherPoller.ts
│   │   │   ├── PlantModelMapping.ts
│   │   │   ├── PlantDataPoller.ts
│   │   │   ├── MarkerService.ts
│   │   │   ├── FarmBotPoller.ts
│   │   │   └── DataService.ts
│   │   ├── music
│   │   │   ├── S3.ts
│   │   │   └── MusicPoller.ts
│   │   ├── index.ts
│   │   └── app
│   │       └── MasterDataService.ts
│   ├── scripts
│   │   ├── sync-sequences.ts
│   │   ├── migrate-project-module-relationships.ts
│   │   └── migrate-project-assets-add-module.ts
│   ├── schema
│   │   ├── traffic
│   │   │   ├── index.ts
│   │   │   ├── index-090.ts
│   │   │   └── index-080.ts
│   │   ├── threed
│   │   │   ├── index.ts
│   │   │   └── index-v080.ts
│   │   ├── settings
│   │   │   └── index.ts
│   │   ├── project
│   │   │   └── index.ts
│   │   ├── music
│   │   │   └── index.ts
│   │   ├── index.ts
│   │   └── auth
│   │       └── index.ts
│   ├── db
│   │   ├── sequence.ts
│   │   └── client.ts
│   ├── data
│   │   ├── traffic
│   │   │   └── seed.ts
│   │   ├── threed
│   │   │   ├── seed-layers.ts
│   │   │   └── plants.ts
│   │   ├── settings
│   │   │   └── seed.ts
│   │   └── music
│   │       ├── seed.ts
│   │       ├── seed-simple.ts
│   │       └── seed-data.json
│   ├── config
│   │   ├── settings.ts
│   │   ├── settings.server.ts
│   │   ├── settings.json
│   │   ├── settings.client.ts
│   │   ├── navigation.ts
│   │   ├── navigation.server.ts
│   │   ├── navigation.client.ts
│   │   ├── constants.ts
│   │   └── _test
│   │       ├── settings.client.ts
│   │       ├── service-registry.ts
│   │       ├── navigation.client.ts
│   │       └── deployments.ts
│   └── auth
│       ├── index.ts
│       └── index-maybe.ts
├── components
│   ├── ui
│   │   ├── toast.tsx
│   │   ├── textarea.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   ├── switch.tsx
│   │   ├── slider.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── select.tsx
│   │   ├── scroll-area.tsx
│   │   ├── progress.tsx
│   │   ├── navbar.tsx
│   │   ├── modal.tsx
│   │   ├── modal-confirm.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── label.tsx
│   │   ├── input.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   └── badge.tsx
│   ├── traffic
│   │   ├── map
│   │   │   ├── simpleMap.tsx
│   │   │   ├── masterMap.tsx
│   │   │   ├── leafletMap.tsx
│   │   │   ├── ThreeDMap.tsx
│   │   │   ├── ThreeDMap-intro.tsx
│   │   │   └── EnhancedLeafletMap.tsx
│   │   └── dashboard
│   │       ├── TrafficStats.tsx
│   │       ├── TrafficMapDashboard.tsx
│   │       ├── CaltransClosures.tsx
│   │       ├── CHPLiveIncidents.tsx
│   │       ├── CHPHistorical.tsx
│   │       └── BayArea511.tsx
│   ├── threed
│   │   ├── shared
│   │   │   ├── WeatherEffects.tsx
│   │   │   ├── UnifiedMap.tsx
│   │   │   ├── PlantModels.tsx
│   │   │   ├── PlantModels-working.tsx
│   │   │   ├── ModelPreview.tsx
│   │   │   ├── GardenViewer.tsx
│   │   │   ├── GardenPlant.tsx
│   │   │   ├── GardenPlant-working.tsx
│   │   │   ├── GardenPlant-original.tsx
│   │   │   ├── GardenGround.tsx
│   │   │   ├── GardenCharacter.tsx
│   │   │   ├── GardenBed.tsx
│   │   │   ├── GLTFPlant.tsx
│   │   │   ├── FloatingUI.tsx
│   │   │   └── AnimatedFBXPlant.tsx
│   │   ├── markers
│   │   │   ├── TrafficMarker3D.tsx
│   │   │   ├── PlantMarker3D.tsx
│   │   │   ├── FarmBotMarker3D.tsx
│   │   │   └── BedMarker3D.tsx
│   │   ├── map
│   │   ├── layers
│   │   │   ├── WeatherLayer.tsx
│   │   │   ├── TrafficLayer.tsx
│   │   │   ├── GardenLayer.tsx
│   │   │   └── FarmBotLayer.tsx
│   │   ├── effects
│   │   │   └── WeatherEffects.tsx
│   │   ├── controls
│   │   │   ├── Legend3D.tsx
│   │   │   └── LayerToggles.tsx
│   │   ├── _test
│   │   │   ├── Unified3DMap.tsx
│   │   │   ├── ThreeDGarden.tsx
│   │   │   ├── ThreeDGarden-working.tsx
│   │   │   ├── ThreeDGarden-working-3-base.tsx
│   │   │   ├── ThreeDGarden-working-2.tsx
│   │   │   └── FloatingUI copy.tsx
│   │   ├── ThreeDGarden.tsx
│   │   └── ThreeDGarden-maybe.tsx
│   ├── themes
│   │   ├── selector.tsx
│   │   └── provider.tsx
│   ├── test
│   │   ├── TestLocalStorage.tsx
│   │   └── DirectStorageTest.tsx
│   ├── navigation
│   │   ├── NavMenu.tsx
│   │   └── NavDropdown.tsx
│   ├── music
│   │   ├── WaveformVisualizer1.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   ├── WaveformVisualizer-testing.tsx
│   │   ├── NowPlayingBar.tsx
│   │   ├── MusicStats.tsx
│   │   ├── MusicPlayer.tsx
│   │   ├── MusicContent.tsx
│   │   ├── MusicContent-close.tsx
│   │   ├── MediaGallery.tsx
│   │   └── AlbumGrid.tsx
│   ├── auth
│   │   └── SignOutButton.tsx
│   └── admin
│       ├── traffic
│       │   ├── chp-centers
│       │   │   └── TrafficCHPCentersCRUD.tsx
│       │   ├── chp-cases
│       │   │   ├── TrafficCHPCasesCRUD.tsx
│       │   │   └── TrafficCHPCasesCRUD-080.tsx
│       │   ├── chp-cad
│       │   │   ├── TrafficCHPCADCRUD.tsx
│       │   │   └── TrafficCHPCADCRUD-080.tsx
│       │   ├── caltrans-districts
│       │   │   └── TrafficCaltransDistrictsCRUD.tsx
│       │   ├── caltrans-cctv
│       │   │   └── TrafficCaltransCctvCRUD.tsx
│       │   ├── caltrans
│       │   │   ├── TrafficCaltransCRUD.tsx
│       │   │   └── TrafficCaltransCRUD-080.tsx
│       │   ├── calfire
│       │   │   ├── TrafficCalfireCRUD.tsx
│       │   │   └── TrafficCalfireCRUD-080.tsx
│       │   └── bay-area-511
│       │       ├── TrafficBayArea511CRUD.tsx
│       │       └── TrafficBayArea511CRUD-080.tsx
│       ├── threed
│       │   ├── watering-schedules
│       │   │   └── ThreeDWateringSchedulesCRUD.tsx
│       │   ├── tasks
│       │   │   └── ThreeDTasksCRUD.tsx
│       │   ├── plants
│       │   │   └── ThreeDPlantsCRUD.tsx
│       │   ├── plantings
│       │   │   └── ThreeDPlantingsCRUD.tsx
│       │   ├── models
│       │   │   ├── ThreeDModelsCRUD.tsx
│       │   │   └── ThreeDModelsCRUD-v080.tsx
│       │   ├── markers
│       │   │   └── ThreeDMarkersCRUD.tsx
│       │   ├── layers
│       │   │   └── ThreeDLayersCRUD.tsx
│       │   ├── harvests
│       │   │   └── ThreeDHarvestsCRUD.tsx
│       │   ├── farmbots
│       │   │   └── ThreeDFarmbotsCRUD.tsx
│       │   ├── characters
│       │   │   ├── ThreeDCharactersCRUD.tsx
│       │   │   └── ThreeDCharactersCRUD-070.tsx
│       │   └── beds
│       │       └── ThreeDBedsCRUD.tsx
│       ├── settings
│       │   └── SettingsManager.tsx
│       ├── projects
│       │   ├── ProjectAssetManager.tsx
│       │   └── ProjectAssetManager-090.tsx
│       ├── music
│       │   ├── tracks
│       │   │   └── MusicTracksCRUD.tsx
│       │   ├── media
│       │   │   ├── MusicMediaCRUD.tsx
│       │   │   ├── MediaManager.tsx
│       │   │   └── MediaForm.tsx
│       │   ├── links
│       │   │   ├── MusicLinksCRUD.tsx
│       │   │   ├── LinksManager.tsx
│       │   │   └── LinkForm.tsx
│       │   ├── albums
│       │   │   └── MusicAlbumCRUD.tsx
│       │   └── AdminMusicManager.tsx
│       ├── layout
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminLayout.tsx
│       │   ├── AdminHeader.tsx
│       │   └── AdminFooter.tsx
│       └── dashboard
│           └── AdminDashboard.tsx
└── app
    ├── providers.tsx
    ├── page.tsx
    ├── layout.tsx
    ├── globals.css
    ├── fonts.js
    ├── favicon.ico
    ├── dashboard
    │   ├── traffic
    │   │   ├── page.tsx
    │   │   ├── chp-live
    │   │   │   ├── page.tsx
    │   │   │   └── chpLiveContent.tsx
    │   │   ├── chp-historical
    │   │   │   ├── page.tsx
    │   │   │   └── chpHistoricalContent.tsx
    │   │   ├── caltrans
    │   │   │   ├── page.tsx
    │   │   │   ├── closure
    │   │   │   │   └── [id]
    │   │   │   │       └── page.tsx
    │   │   │   └── caltransContent.tsx
    │   │   ├── calfire
    │   │   │   ├── page.tsx
    │   │   │   └── calfireContent.tsx
    │   │   └── 511org
    │   │       ├── page.tsx
    │   │       └── 511orgContent.tsx
    │   ├── threed
    │   │   ├── weather
    │   │   │   ├── weatherContent.tsx
    │   │   │   └── page.tsx
    │   │   ├── tasks
    │   │   │   ├── tasksContent.tsx
    │   │   │   └── page.tsx
    │   │   ├── plants
    │   │   │   ├── plantsContent.tsx
    │   │   │   └── page.tsx
    │   │   ├── plantings
    │   │   │   ├── plantingsContent.tsx
    │   │   │   └── page.tsx
    │   │   ├── plant-models
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   ├── page-working.tsx
    │   │   ├── models
    │   │   │   ├── page.tsx
    │   │   │   └── modelsContent.tsx
    │   │   ├── logs
    │   │   │   ├── page.tsx
    │   │   │   └── logsContent.tsx
    │   │   ├── harvests
    │   │   │   ├── page.tsx
    │   │   │   └── harvestsContent.tsx
    │   │   ├── garden
    │   │   │   ├── page.tsx
    │   │   │   ├── page-working.tsx
    │   │   │   └── analytics
    │   │   │       └── page.tsx
    │   │   ├── farmbots
    │   │   │   ├── page.tsx
    │   │   │   └── farmbotsContent.tsx
    │   │   ├── characters
    │   │   │   ├── page.tsx
    │   │   │   └── charactersContent.tsx
    │   │   └── beds
    │   │       ├── page.tsx
    │   │       └── bedsContent.tsx
    │   ├── page.tsx
    │   ├── music
    │   │   ├── player
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   ├── layout-potential.tsx
    │   │   └── album
    │   │       └── [id]
    │   │           └── page.tsx
    │   └── layout.tsx
    ├── auth
    │   ├── sign-up
    │   │   └── page.tsx
    │   ├── sign-out
    │   │   └── page.tsx
    │   ├── sign-in
    │   │   └── page.tsx
    │   └── error
    │       └── page.tsx
    ├── api
    │   ├── traffic
    │   │   ├── stats
    │   │   │   ├── route.ts
    │   │   │   └── route-040.ts
    │   │   ├── route.ts
    │   │   ├── route-080.ts
    │   │   ├── master-data
    │   │   │   └── route.ts
    │   │   ├── dashboard
    │   │   │   └── route.ts
    │   │   ├── chp-centers
    │   │   │   └── route.ts
    │   │   ├── chp-cases
    │   │   │   ├── seed
    │   │   │   │   └── route.ts
    │   │   │   ├── route.ts
    │   │   │   ├── route-040.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── debug
    │   │   │   │   └── route.ts
    │   │   │   ├── cron
    │   │   │   │   └── route.ts
    │   │   │   └── collisions
    │   │   │       ├── stats
    │   │   │       │   └── route.ts
    │   │   │       └── route.ts
    │   │   ├── chp-cad
    │   │   │   ├── seed
    │   │   │   │   └── chp-cad-centers
    │   │   │   │       ├── route.ts
    │   │   │   │       └── data
    │   │   │   │           └── chpCadCenters.ts
    │   │   │   ├── route.ts
    │   │   │   ├── route-040.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── cron
    │   │   │   │   └── route.ts
    │   │   │   └── chp-cad-centers
    │   │   │       └── route.ts
    │   │   ├── caltrans-districts
    │   │   │   └── route.ts
    │   │   ├── caltrans-cctv
    │   │   │   └── route.ts
    │   │   ├── caltrans
    │   │   │   ├── seed
    │   │   │   │   └── route.ts
    │   │   │   ├── route.ts
    │   │   │   ├── route-040.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── cron
    │   │   │   │   └── route.ts
    │   │   │   ├── closures
    │   │   │   │   ├── update-coordinates
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── summary
    │   │   │   │   │   ├── route.ts
    │   │   │   │   │   └── debug
    │   │   │   │   │       └── route.ts
    │   │   │   │   ├── stats
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── simple
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── search
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── route.ts
    │   │   │   │   ├── raw
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── export
    │   │   │   │   │   └── route.ts
    │   │   │   │   ├── add-test-coordinates
    │   │   │   │   │   └── route.ts
    │   │   │   │   └── [id]
    │   │   │   │       └── route.ts
    │   │   │   └── cctv
    │   │   │       ├── seed
    │   │   │       ├── route.ts
    │   │   │       ├── poll
    │   │   │       ├── debug
    │   │   │       └── cron
    │   │   ├── calfire
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── route-040.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   │       └── route.ts
    │   │   └── bay-area-511
    │   │       ├── seed
    │   │       │   └── route.ts
    │   │       ├── route.ts
    │   │       ├── route-040.ts
    │   │       ├── poll
    │   │       │   └── route.ts
    │   │       ├── debug
    │   │       │   └── route.ts
    │   │       └── cron
    │   │           └── route.ts
    │   ├── threed
    │   │   ├── weather
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── watering-schedules
    │   │   │   └── route.ts
    │   │   ├── tasks
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── route-070.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── route.ts
    │   │   ├── plants
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── plantings
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── route-070.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── models
    │   │   │   ├── route.ts
    │   │   │   ├── route-v080.ts
    │   │   │   ├── files
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [fileId]
    │   │   │   │       └── route.ts
    │   │   │   └── [id]
    │   │   │       └── route-v070.ts
    │   │   ├── markers
    │   │   │   └── route.ts
    │   │   ├── logs
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   └── route.ts
    │   │   ├── layers
    │   │   │   └── route.ts
    │   │   ├── harvests
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── route-070.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── farmbots
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── route-070.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── debug
    │   │   │   ├── cron
    │   │   │   ├── commands
    │   │   │   │   └── route.ts
    │   │   │   └── [id]
    │   │   │       └── water
    │   │   │           ├── route.ts
    │   │   │           └── move
    │   │   │               └── route.ts
    │   │   ├── characters
    │   │   │   ├── stats
    │   │   │   ├── route.ts
    │   │   │   ├── route-v070.ts
    │   │   │   ├── poll
    │   │   │   └── [id]
    │   │   │       └── route.ts
    │   │   ├── beds
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   └── analytics
    │   │       └── route.ts
    │   ├── project
    │   │   ├── route.ts
    │   │   ├── modules
    │   │   │   └── route.ts
    │   │   └── assets
    │   │       └── route.ts
    │   ├── music
    │   │   ├── tracks
    │   │   │   └── route.ts
    │   │   ├── stream
    │   │   │   └── [trackId]
    │   │   │       └── route.ts
    │   │   ├── stats
    │   │   │   └── route.ts
    │   │   ├── seed
    │   │   │   └── route.ts
    │   │   ├── route.ts
    │   │   ├── poll
    │   │   │   └── route.ts
    │   │   ├── playback
    │   │   │   └── track
    │   │   │       └── route.ts
    │   │   ├── media
    │   │   │   └── route.ts
    │   │   ├── links
    │   │   │   └── route.ts
    │   │   ├── cron
    │   │   │   └── route.ts
    │   │   ├── albums
    │   │   │   └── route.ts
    │   │   └── admin
    │   │       └── stats
    │   │           └── route.ts
    │   ├── auth
    │   │   ├── debug
    │   │   │   └── route.ts
    │   │   └── [...nextauth]
    │   │       └── route.ts
    │   └── admin
    │       └── dashboard
    │           └── route.ts
    └── admin
        ├── traffic
        │   ├── page.tsx
        │   ├── chp-centers
        │   │   └── page.tsx
        │   ├── chp-cases
        │   │   └── page.tsx
        │   ├── chp-cad
        │   │   └── page.tsx
        │   ├── caltrans-districts
        │   │   └── page.tsx
        │   ├── caltrans-cctv
        │   │   └── page.tsx
        │   ├── caltrans
        │   │   └── page.tsx
        │   ├── calfire
        │   │   └── page.tsx
        │   └── bay-area-511
        │       └── page.tsx
        ├── threed
        │   ├── watering-schedules
        │   │   └── page.tsx
        │   ├── tasks
        │   │   └── page.tsx
        │   ├── plants
        │   │   ├── page.tsx
        │   │   └── [id]
        │   │       └── page.tsx
        │   ├── plantings
        │   │   └── page.tsx
        │   ├── models
        │   │   └── page.tsx
        │   ├── markers
        │   │   └── page.tsx
        │   ├── layers
        │   │   └── page.tsx
        │   ├── harvests
        │   │   └── page.tsx
        │   ├── farmbots
        │   │   └── page.tsx
        │   ├── characters
        │   │   └── page.tsx
        │   └── beds
        │       └── page.tsx
        ├── settings
        │   └── page.tsx
        ├── projects
        │   ├── page.tsx
        │   ├── new
        │   │   └── page.tsx
        │   └── [id]
        │       └── page.tsx
        ├── page.tsx
        ├── music
        │   ├── tracks
        │   │   ├── page.tsx
        │   │   └── [id]
        │   │       └── page.tsx
        │   ├── page.tsx
        │   ├── media
        │   │   └── page.tsx
        │   ├── links
        │   │   └── page.tsx
        │   ├── layout-legacy.tsx
        │   └── albums
        │       ├── page.tsx
        │       └── [id]
        │           └── page.tsx
        ├── layout.tsx
        └── _coordinates
            └── page.tsx
```

---

## 📊 Data Sources

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

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Projects Module | ✅ Working |
| Project Asset Manager | ✅ Working |
| ThreeD Module | ✅ Working |
| ThreeD Layers | ✅ Working |
| ThreeD Markers | ✅ Working |
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
| Database | ✅ Connected |

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Severity as string error | Parse severity to integer with mapping |

---

## 🎊 Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.1.0 | 2026-06-02 | Initial project setup |
| v0.5.5 | 2026-07-18 | Hybrid Architecture with Free-Standing Data |
| v0.6.0 | 2026-07-20 | Project Module Assets 'project_assets' |
| v0.6.5 | 2026-07-22 | Complete CRUD components for Music, ThreeD, Traffic |
| v0.7.3 | 2026-07-23 | Modern Admin Dashboard with unified navigation |
| v0.8.3 | 2026-07-24 | Complete Music Admin CRUD with Links & Media |
| v0.9.0 | 2026-07-25 | ThreeD Module Complete |
| v0.10.0 | 2026-07-28 | Traffic Module Complete |
| v0.10.1 | 2026-07-28 | Caltrans CCTV + CHP Cases Fixes |
| **v0.11.0** | **2026-07-29** | **Projects Module + Asset Manager Complete** 🚀 |

---

## 🚀 Next Steps

### Short Term
1. **Project Detail Page improvements** - Enhanced UI/UX for module management
2. **Asset preview** - Preview assets before assigning to projects
3. **Bulk operations** - Add/remove multiple assets at once
4. **Advanced filtering** - Multi-field search and filter combinations

### Long Term
1. **Real-time updates** - WebSocket integration for live data
2. **Analytics Dashboard** - Traffic pattern analysis and metrics
3. **Mobile app** - React Native or PWA
4. **API documentation** - OpenAPI/Swagger documentation
5. **Testing suite** - Comprehensive unit and integration tests

---

**Version:** v0.11.0 (Projects Module + Asset Manager Complete) 🚀

**Deployed to:** Vercel Production ✅

**Built with:** Next.js 16.2.11, TypeScript, Drizzle ORM, Neon Postgres, Tailwind, shadcn/ui, Three.js

---

*🎉 Congratulations on reaching v0.11.0! The Projects Module with Asset Manager is now fully complete, providing a unified interface for managing projects, modules, and assets across all three modules!*

---

## v0.11.0 In Progress

---

📋 Complete v0.11.0 File Checklist

Here's a summary of all the files we've created/modified for v0.11.0:
New Files Created
text

app/
├── admin/
│   ├── page.tsx                          # ✅ New Dashboard
│   └── projects/
│       └── page.tsx                      # ✅ Moved from /admin/page.tsx
├── api/
│   └── admin/
│       └── dashboard/
│           └── route.ts                  # ✅ New Dashboard API
└── components/
    └── admin/
        └── dashboard/
            └── AdminDashboard.tsx        # ✅ New Dashboard Component

Updated Files
text

components/admin/layout/AdminSidebar.tsx   # ✅ Added Dashboard link

🎯 What's Working
Feature	Status
Dashboard Overview	✅
Stats Cards	✅
Quick Actions	✅
Module Overview	✅
Recent Projects	✅
Client-side Auth	✅
API Route for Data	✅

- Add Admin Dashboard with stats and quick actions
- Move Projects page to /admin/projects
- Add Dashboard API route for client-side data fetching
- Add ThreeD Layers and Markers sub-modules
- Full Project Asset Manager integration
- Consistent client-side auth pattern"

🎊 Version v0.11.0 Complete!
Module	Status
Projects Module	✅ Complete
Project Asset Manager	✅ Complete
ThreeD Layers	✅ Complete
ThreeD Markers	✅ Complete
Admin Dashboard	✅ Complete
Client-side Auth	✅ Consistent

The Projects Module with Asset Manager is now fully complete and production-ready! 🚀

---

## v0.11.0 Complete.

---

---

## v0.12.0 Start Here.

---

# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** July 31, 2026 @ 4:30pm PST

**Version:** v0.12.0 (Unified Map Module + ThreeD Schema Alignment) 🗺️

---

## 🎉 v0.12.0 Release Highlights

### Unified Map Module Complete!

The Unified Map Module is now fully functional, providing a comprehensive 2D and 3D visualization experience that brings together Traffic and ThreeD data in a single, unified interface.

| Component | Status |
|-----------|--------|
| 2D Map (Leaflet) | ✅ Complete |
| 3D Scene (Three.js) | ✅ Complete |
| Combined View | ✅ Complete |
| Project Selection | ✅ Complete |
| Layer Controls | ✅ Complete |
| Marker Interactions | ✅ Complete |
| ThreeD Schema Alignment | ✅ Complete |

---

## 🧱 Tech Stack

- **Framework:** Next.js 16.2.11 (App Router), TypeScript, React
- **Database:** Neon Postgres + Drizzle ORM
- **UI:** shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- **Music Streaming:** AWS S3, Vercel Blob Storage
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:
- All records have `userId` for ownership and audit trails
- Child data is free-standing (no direct foreign keys to modules)
- Relationships are handled via junction tables

```
User (user)
  └── Projects (project) - HAS userId
       └── (junction: project_threed, project_traffic, project_music)
            └── Modules (threed, traffic, music) - HAS userId
                 └── Child Data (plants, beds, albums, incidents) - HAS userId
                      └── (free-standing, reusable across projects)
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| user (Better Auth) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

### Junction Tables (Many-to-Many)

| Table | Purpose |
|-------|---------|
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |
| `project_assets` | Single junction table with polymorphic relationship linking child records to projects |

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
  'music_albums',
  'music_tracks',
  'music_links',
  'music_media',
  
  // ThreeD
  'threed_plants',
  'threed_beds',
  'threed_plantings',
  'threed_layers',
  'threed_markers',
  'threed_models',
  'threed_characters',
  'threed_tasks',
  'threed_harvests',
  'threed_weather_logs',
  'threed_farmbots',
  'threed_watering_schedules',
  
  // Traffic
  'traffic_chp_cad_incidents',
  'traffic_chp_cases',
  'traffic_chp_centers',
  'traffic_caltrans_lane_closures',
  'traffic_caltrans_districts',
  'traffic_caltrans_cctv_cameras',
  'traffic_bay_area_511_events',
  'traffic_calfire_incidents',
]);
```

---

## 🗄️ Complete Database Schema

### Auth Module (lib/schema/auth/)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Better Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

### Settings Module (lib/schema/settings/)

| Table | Purpose |
|-------|---------|
| `settings` | Master settings definitions |
| `settings_user_overrides` | User-specific setting overrides |
| `settings_deployment` | Deployment snapshots |
| `settings_deployment_history` | Deployment audit trail |
| `settings_audit_logs` | Settings change log |

### Projects Module (lib/schema/projects/)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |
| `project_assets` | Polymorphic junction for child assets |

### ThreeD Module (lib/schema/threed/)

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | Plants in beds with position and growth tracking |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging |
| `threed_tasks` | Garden tasks/to-do |
| `threed_weather_logs` | Environmental data |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | Groups of 3D objects |
| `threed_markers` | All 3D objects with positioning |
| `threed_marker_relationships` | Parent-child marker connections |
| `threed_system_logs` | Application logging |

### Traffic Module (lib/schema/traffic/)

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

### Music Module (lib/schema/music/)

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

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure (All Modules Follow Same Pattern)

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   └── modules/
│       └── route.ts          # GET, POST, DELETE (with ?projectId=1)
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── plants/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── plantings/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── beds/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── characters/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── farmbots/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── markers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── layers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── models/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── [child-table]/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── [child-table]/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    └── albums/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE
```

---

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Unified Map Module (NEW)
- **2D Map (Leaflet)** - Full map with traffic incidents and 3D markers
- **3D Scene (Three.js)** - Immersive 3D view with markers, shapes, and interactions
- **Combined View** - 2D base with 3D overlay
- **Project Selection** - Choose which project to visualize
- **Layer Controls** - Toggle Traffic and ThreeD layers on/off
- **Marker Interactions** - Click to select, zoom, and view details
- **Right-click to Jump** - Navigate the 3D scene easily
- **Controls Panel** - Auto-rotate, grid, legend toggles
- **Session Persistence** - View mode and layer states saved

### ThreeD Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- Task management with related entities
- **Layers** - Organize 3D objects into groups
- **Markers** - 3D objects with positioning, rotation, scale
- **Plantings** - Actual planted instances with position coordinates

### Traffic Module
- **8 real-time data sources** with full CRUD:
  - CHP CAD Incidents (Live dispatcher feed)
  - CHP Centers (Dispatch centers)
  - CHP Historical Cases (CKAN API)
  - Caltrans Lane Closures (CWWP2 API)
  - Caltrans Districts (Caltrans regions)
  - Caltrans CCTV Cameras (Traffic cameras)
  - Bay Area 511 Events (511.org API)
  - CalFire Incidents (Wildfire tracking)
- 3D map visualization with Three.js
- Marker clustering and rich popups
- Multi-source filtering by status, severity, county, and region

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming
- Album detail view with tracks, links, and media gallery

### Project Asset Manager
- Single junction table (`project_assets`) with polymorphic relationship
- Asset type enum for all module child records
- Clean "Assigned" vs "Available" UI
- Module-specific asset management
- Persistent UI state across page refreshes

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
bun run db:seed-music
bun run src/lib/scripts/seed-threed-plants.ts
bun run src/lib/scripts/seed-initial-data.ts
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                     # Admin layout with sidebar
│   │   ├── page.tsx                       # Dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx                   # Projects list
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Project detail with modules
│   │   ├── music/
│   │   │   ├── albums/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── tracks/page.tsx
│   │   │   ├── media/page.tsx
│   │   │   └── links/page.tsx
│   │   ├── threed/
│   │   │   ├── plants/page.tsx
│   │   │   ├── plantings/page.tsx
│   │   │   ├── beds/page.tsx
│   │   │   ├── models/page.tsx
│   │   │   ├── characters/page.tsx
│   │   │   ├── layers/page.tsx
│   │   │   └── markers/page.tsx
│   │   └── traffic/
│   │       ├── chp-cad/page.tsx
│   │       ├── chp-centers/page.tsx
│   │       ├── chp-cases/page.tsx
│   │       ├── caltrans/page.tsx
│   │       ├── caltrans-districts/page.tsx
│   │       ├── caltrans-cctv/page.tsx
│   │       ├── bay-area-511/page.tsx
│   │       └── calfire/page.tsx
│   ├── dashboard/
│   │   └── map/
│   │       └── page.tsx                   # Unified Map Page
│   └── api/
│       ├── project/
│       │   ├── route.ts
│       │   ├── modules/
│       │   │   ├── route.ts
│       │   │   └── verify/
│       │   │       └── route.ts
│       │   └── assets/
│       │       └── route.ts
│       ├── threed/
│       │   ├── route.ts
│       │   └── [child-table]/route.ts
│       ├── traffic/
│       │   ├── route.ts
│       │   └── [child-table]/route.ts
│       ├── music/
│       │   └── albums/route.ts
│       └── map/
│           ├── traffic/route.ts
│           ├── threed/route.ts
│           └── projects/route.ts
├── components/
│   ├── admin/
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminFooter.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── projects/
│   │   │   ├── ProjectAssetManager.tsx
│   │   │   └── ProjectDetailClient.tsx
│   │   ├── music/
│   │   │   ├── albums/MusicAlbumCRUD.tsx
│   │   │   ├── tracks/MusicTracksCRUD.tsx
│   │   │   ├── media/MusicMediaCRUD.tsx
│   │   │   └── links/MusicLinksCRUD.tsx
│   │   ├── threed/
│   │   │   ├── plants/ThreeDPlantsCRUD.tsx
│   │   │   ├── plantings/ThreeDPlantingsCRUD.tsx
│   │   │   ├── beds/ThreeDBedsCRUD.tsx
│   │   │   ├── models/ThreeDModelsCRUD.tsx
│   │   │   ├── characters/ThreeDCharactersCRUD.tsx
│   │   │   ├── layers/ThreeDLayersCRUD.tsx
│   │   │   └── markers/ThreeDMarkersCRUD.tsx
│   │   └── traffic/
│   │       ├── chp-cad/TrafficCHPCADCRUD.tsx
│   │       ├── chp-centers/TrafficCHPCentersCRUD.tsx
│   │       ├── chp-cases/TrafficCHPCasesCRUD.tsx
│   │       ├── caltrans/TrafficCaltransCRUD.tsx
│   │       ├── caltrans-districts/TrafficCaltransDistrictsCRUD.tsx
│   │       ├── caltrans-cctv/TrafficCaltransCctvCRUD.tsx
│   │       ├── bayarea511/TrafficBayArea511CRUD.tsx
│   │       └── calfire/TrafficCalfireCRUD.tsx
│   └── map/
│       ├── UnifiedMapView.tsx              # Main map container
│       ├── LeafletMap.tsx                 # 2D Leaflet implementation
│       ├── ThreeDScene.tsx                # 3D Three.js implementation
│       ├── MapDataService.ts              # Data fetching service
│       └── DefaultMapData.ts              # Default/empty state data
└── lib/
    ├── schema/
    ├── types/
    │   └── map/
    │       └── index.ts                   # Map types
    └── services/
        └── map/
            └── MapDataService.ts          # Map data service
```

---

## 📊 Data Sources

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

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
| Project Asset Manager | ✅ Working |
| ThreeD Module | ✅ Working |
| Traffic Module | ✅ Working |
| Music Module | ✅ Working |
| **Unified Map Module** | ✅ **Working** |
| **2D Map (Leaflet)** | ✅ **Working** |
| **3D Scene (Three.js)** | ✅ **Working** |
| **Combined View** | ✅ **Working** |
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
| Database | ✅ Connected |

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Select component empty string error | Use `value="none"` instead of `value=""` in SelectItem |

---

## 🎊 Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.1.0 | 2026-06-02 | Initial project setup |
| v0.5.5 | 2026-07-18 | Hybrid Architecture with Free-Standing Data |
| v0.6.0 | 2026-07-20 | Project Module Assets 'project_assets' |
| v0.6.5 | 2026-07-22 | Complete CRUD components for Music, ThreeD, Traffic |
| v0.7.3 | 2026-07-23 | Modern Admin Dashboard with unified navigation |
| v0.8.3 | 2026-07-24 | Complete Music Admin CRUD with Links & Media |
| v0.9.0 | 2026-07-25 | ThreeD Module Complete |
| v0.10.0 | 2026-07-28 | Traffic Module Complete |
| v0.10.1 | 2026-07-28 | Caltrans CCTV + CHP Cases Fixes |
| v0.11.0 | 2026-07-29 | Projects Module + Asset Manager Complete |
| **v0.12.0** | **2026-07-31** | **Unified Map Module + ThreeD Schema Alignment** 🗺️ |

---

## 🚀 Next Steps

### Short Term (v0.12.1)
1. **Add more marker types** - Support for all ThreeD sub-modules
2. **Enhanced popups** - Richer details in 3D scene
3. **Filter by asset type** in 3D view
4. **Performance optimization** - LOD for large datasets

### Medium Term
1. **Animation** - Animated markers or transitions
2. **Real-time updates** - WebSocket for live data
3. **Export scene** - Screenshot or shareable links
4. **Time-based filtering** - Filter by date/time range

### Long Term
1. **Mobile optimization** - Touch-friendly controls
2. **Analytics Dashboard** - Traffic pattern analysis
3. **Heatmap Overlay** - Show density of incidents
4. **API documentation** - OpenAPI/Swagger

---

**Version:** v0.12.0 (Unified Map Module + ThreeD Schema Alignment) 🗺️

**Deployed to:** Vercel Production ✅

**Built with:** Next.js 16.2.12, TypeScript, Drizzle ORM, Neon Postgres, Tailwind, shadcn/ui, Three.js, React Three Fiber, Leaflet

---

*🎉 Congratulations on reaching v0.12.0! The Unified Map Module is now fully complete, providing a seamless 2D and 3D visualization experience for all your Traffic and ThreeD data!*

---

Here's the complete `CONTEXT.md` for your application:

```markdown
# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 1, 2026 @ 06:15pm PST

---

## 🚀 Version v0.12.1 "Runtime Marker Generation"

### 🎯 What's New in v0.12.1

| Feature | Status | Description |
|---------|--------|-------------|
| **Runtime Marker Generation** | ✅ Complete | Markers generated on-the-fly from sub-module data |
| **ThreeD Markers Removed** | ✅ Complete | No database markers - markers are dispensable |
| **Plantings as Markers** | ✅ Complete | Plantings (instances) drive markers, not Plants (master data) |
| **Layers as Config** | ✅ Complete | Layers store view configurations, not markers |
| **Full Precision GPS** | ✅ Complete | 7 decimal places for all coordinates |
| **Seed Data Complete** | ✅ Complete | All tables seeded with realistic test data |
| **2D/3D Map Views** | ✅ Working | Both views render correctly |

---

## 🧱 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.12 (App Router), TypeScript, React |
| **Database** | Neon Postgres + Drizzle ORM |
| **UI** | shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps) |
| **Music Streaming** | AWS S3, Vercel Blob Storage |
| **Deployment** | Vercel |
| **Package Manager** | Bun |

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:

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
| user (Next Auth.js) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

---

## 📁 Complete Database Schema

### Auth Module (`lib/schema/auth/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Next Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

### Projects Module (`lib/schema/projects/`)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |
| `project_assets` | Single junction table for all asset types |
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |

### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database (NO markers) |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | **Plants in beds with position data → BECOME MARKERS** |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging (NO markers) |
| `threed_tasks` | Garden tasks/to-do (NO markers) |
| `threed_weather_logs` | Environmental data (NO markers) |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | **Configuration for what to display (NO markers)** |
| `threed_system_logs` | Application logging |
| `threed_character_models` | Junction: Character ↔ Models |

### Traffic Module (`lib/schema/traffic/`)

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

### Music Module (`lib/schema/music/`)

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

## 🎯 Key Features

### Runtime Marker Generation (NEW in v0.12.1)
- ✅ Markers generated on-the-fly from Plantings (not stored in database)
- ✅ Plantings (instances) drive markers, Plants (master data) do not
- ✅ Full precision GPS coordinates (7 decimal places)
- ✅ Markers are dispensable - can be regenerated anytime

### Layers System (NEW in v0.12.1)
- ✅ Layers store view configurations (what to display)
- ✅ Layers have NO markers - purely configuration
- ✅ Include types: plants, beds, characters, farmbots, plantings, tasks, harvests, weatherLogs
- ✅ Visual settings: color, opacity, visibility

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- 6 real-time data sources with full CRUD
- 2D/3D map visualization with Leaflet + Three.js
- Runtime marker generation for traffic incidents

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- **Runtime markers from Plantings**

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming

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
```

---

## 📋 Project Asset Types

### ThreeD Asset Types

| Asset Type | Table | Has Position | Becomes Marker |
|------------|-------|--------------|----------------|
| `threed_plants` | `threed_plants` | ❌ | ❌ (Master data) |
| `threed_beds` | `threed_beds` | ✅ | ✅ |
| `threed_plantings` | `threed_plantings` | ✅ | ✅ (Primary) |
| `threed_characters` | `threed_characters` | ✅ | ✅ |
| `threed_farmbots` | `threed_farmbots` | ✅ | ✅ |
| `threed_layers` | `threed_layers` | ❌ | ❌ (Config) |
| `threed_tasks` | `threed_tasks` | ❌ | ❌ (To-dos) |
| `threed_harvests` | `threed_harvests` | ❌ | ❌ (Logs) |
| `threed_weather_logs` | `threed_weather_logs` | ❌ | ❌ (Logs) |
| `threed_models` | `threed_models` | ❌ | ❌ (Library) |

### Traffic Asset Types

| Asset Type | Table |
|------------|-------|
| `traffic_chp_cad_incidents` | `traffic_chp_cad_incidents` |
| `traffic_chp_cases` | `traffic_chp_cases` |
| `traffic_chp_centers` | `traffic_chp_centers` |
| `traffic_caltrans_lane_closures` | `traffic_caltrans_lane_closures` |
| `traffic_caltrans_cctv_cameras` | `traffic_caltrans_cctv_cameras` |
| `traffic_caltrans_districts` | `traffic_caltrans_districts` |
| `traffic_bay_area_511_events` | `traffic_bay_area_511_events` |
| `traffic_calfire_incidents` | `traffic_calfire_incidents` |

### Music Asset Types

| Asset Type | Table |
|------------|-------|
| `music_albums` | `music_albums` |
| `music_tracks` | `music_tracks` |
| `music_links` | `music_links` |
| `music_media` | `music_media` |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   ├── assets/
│   │   └── route.ts          # GET, POST, DELETE
│   └── modules/
│       └── route.ts          # GET, POST, DELETE
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── plants/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── beds/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── plantings/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── layers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── markers/
│       └── route.ts          # (DEPRECATED - markers generated at runtime)
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── caltrans/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    ├── albums/
    │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
    └── tracks/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE
```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Enum value errors | Ensure enum values match schema definitions |
| Timestamp `{ mode: 'string' }` | Use `.toISOString()` when inserting |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
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
| 2D Map | ✅ Rendering |
| Runtime Markers | ✅ Working |
| Database | ✅ Connected |
| Seed Data | ✅ Complete |

---

## 🎉 v0.12.1 "Runtime Marker Generation"

### What Changed

1. **Removed `threed_markers` table** - No database markers
2. **Runtime markers generated from Plantings** - Plantings (instances) drive markers
3. **Plants are master data** - No markers from Plants
4. **Layers are configuration** - Store view settings, not markers
5. **Full precision GPS** - 7 decimal places for all coordinates
6. **Comprehensive seed data** - All tables seeded with realistic data

### Benefits

- ✅ Markers are always in sync with data
- ✅ No database marker maintenance
- ✅ Markers are dispensable (regenerate anytime)
- ✅ Cleaner architecture
- ✅ Better performance

---

**Version:** v0.12.1 "Runtime Marker Generation" 🚀

---

**File:** `CONTEXT.md` (Updated for v0.12.2)

```markdown
# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 2, 2026 @ 04:30pm PST

---

## 🚀 Version v0.12.2 "ThreeD Scene Improvements"

### 🎯 What's New in v0.12.2

| Feature | Status | Description |
|---------|--------|-------------|
| **View Presets** | ✅ Complete | Save and load camera positions with layer states |
| **Rich Marker Popups** | ✅ Complete | Type-specific detailed information on marker click |
| **Layer Visibility Toggle** | ✅ Complete | Filter markers by type with Show All/Hide All |
| **Camera Focus** | ✅ Complete | Smooth zoom animation with golden glow indicator |
| **Enhanced Controls Panel** | ✅ Complete | Unified UI for all scene controls |
| **Performance Optimizations** | ✅ Complete | Memoized components and filtered rendering |
| **Persistent Storage** | ✅ Complete | View presets saved to localStorage |

---

## 🧱 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.12 (App Router), TypeScript, React |
| **Database** | Neon Postgres + Drizzle ORM |
| **UI** | shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps) |
| **3D Scene** | React Three Fiber, @react-three/drei, Three.js |
| **Music Streaming** | AWS S3, Vercel Blob Storage |
| **Deployment** | Vercel |
| **Package Manager** | Bun |

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:

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
| user (Next Auth.js) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

---

## 📁 Complete Database Schema

### Auth Module (`lib/schema/auth/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Next Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

### Projects Module (`lib/schema/projects/`)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |
| `project_assets` | Single junction table for all asset types |
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |

### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database (NO markers) |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | **Plants in beds with position data → BECOME MARKERS** |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging (NO markers) |
| `threed_tasks` | Garden tasks/to-do (NO markers) |
| `threed_weather_logs` | Environmental data (NO markers) |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | **Configuration for what to display (NO markers)** |
| `threed_system_logs` | Application logging |
| `threed_character_models` | Junction: Character ↔ Models |

### Traffic Module (`lib/schema/traffic/`)

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

### Music Module (`lib/schema/music/`)

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

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- 6 real-time data sources with full CRUD
- 2D/3D map visualization with Leaflet + Three.js
- Runtime marker generation for traffic incidents

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- **Runtime markers from Plantings**
- **View Presets** - Save and load camera positions
- **Rich Marker Popups** - Type-specific details
- **Layer Visibility Toggle** - Filter by marker type
- **Camera Focus** - Smooth zoom animation

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming

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
```

---

## 📋 ThreeD Marker Types

### What Gets Markers (Has Position Data):

| Type | Shape | Color | Source |
|------|-------|-------|--------|
| **Plantings** | Cylinder | #22c55e | `threed_plantings` |
| **Beds** | Wide Box | #f59e0b | `threed_beds` |
| **Characters** | Sphere | #8b5cf6 | `threed_characters` |
| **FarmBots** | Cube | #64748b | `threed_farmbots` |
| **Layers** | Thin Box | #06b6d4 | `threed_layers` |

### ❌ NOT Generated as Markers:

| Type | Reason |
|------|--------|
| **Plants** | Master data, not instances |
| **Tasks** | Simple to-dos |
| **Harvests** | Simple logs |
| **WeatherLogs** | Simple logs |

---

## 🎮 ThreeD Scene Controls

| Control | Function |
|---------|----------|
| **Auto-Rotate** | Toggle automatic scene rotation |
| **Grid** | Toggle spatial reference grid |
| **Legend** | Toggle marker count legend |
| **Layers** | Show/Hide marker types |
| **Center View** | Reset camera to center |
| **Save Current View** | Save camera position + layers |
| **Saved Views** | Load previously saved views |
| **Focus** | Zoom to selected marker |
| **Rich Popups** | Click marker for details |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   ├── assets/
│   │   └── route.ts          # GET, POST, DELETE
│   └── modules/
│       └── route.ts          # GET, POST, DELETE
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── plants/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── beds/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── plantings/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── layers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── markers/
│       └── route.ts          # (DEPRECATED - markers generated at runtime)
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── caltrans/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    ├── albums/
    │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
    └── tracks/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE
```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Enum value errors | Ensure enum values match schema definitions |
| Timestamp `{ mode: 'string' }` | Use `.toISOString()` when inserting |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
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
| **3D Scene** | ✅ **Enhanced** |
| **Runtime Markers** | ✅ **Working** |
| **View Presets** | ✅ **New** |
| **Rich Popups** | ✅ **New** |
| **Layer Toggle** | ✅ **New** |
| **Camera Focus** | ✅ **New** |
| Database | ✅ Connected |
| Seed Data | ✅ Complete |

---

## 🎉 v0.12.2 "ThreeD Scene Improvements"

### What Changed

1. **View Presets** - Save and load camera positions with layer states (localStorage)
2. **Rich Marker Popups** - Type-specific detailed information on marker click
3. **Layer Visibility Toggle** - Filter markers by type with Show All/Hide All
4. **Camera Focus** - Smooth zoom animation with golden glow indicator
5. **Enhanced Controls Panel** - Unified UI for all scene controls
6. **Performance Optimizations** - Memoized components and filtered rendering

### Benefits

- ✅ Users can save and recall specific viewpoints
- ✅ Rich information at a glance when clicking markers
- ✅ Cleaner scene with layer filtering
- ✅ Smooth, professional camera animations
- ✅ All controls in one intuitive panel
- ✅ Faster rendering with optimized components

---

**Version:** v0.12.2 "ThreeD Scene Improvements" 🚀

---

**File:** `CONTEXT.md` (Updated for v0.12.3)

```markdown
# Project Context – threed-garden-neon, marty-mcgee-neon

**Last Updated:** August 2, 2026 @ 07:30pm PST

---

## 🚀 Version v0.12.3 "Unified Map UI & Layer Management"

### 🎯 What's New in v0.12.3

| Feature | Status | Description |
|---------|--------|-------------|
| **Asset Type Toggle** | ✅ Complete | Show/hide specific 3D asset types from dashboard |
| **Default 3D View** | ✅ Complete | Page loads 3D scene by default instead of combined |
| **Project Layer Filtering** | ✅ Complete | Layers filtered by project via project_assets |
| **Simplified Layer Controls** | ✅ Complete | Removed redundant Eye icons, cleaner UI |
| **Module Visibility State** | ✅ Complete | Auto-sync between layer toggles and module visibility |
| **Layer API Enhancement** | ✅ Complete | Project-specific layer fetching via junction table |

---

## 🧱 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.12 (App Router), TypeScript, React |
| **Database** | Neon Postgres + Drizzle ORM |
| **UI** | shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps) |
| **3D Scene** | React Three Fiber, @react-three/drei, Three.js |
| **Music Streaming** | AWS S3, Vercel Blob Storage |
| **Deployment** | Vercel |
| **Package Manager** | Bun |

---

## 🗄️ Database Schema Architecture

### Hybrid Approach: Data Ownership + Free-Standing Data

The database follows a clean hybrid approach where:

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
| user (Next Auth.js) | text('id') | N/A |
| All other tables | serial('id') | integer |
| Tables referencing user.id | N/A | text('user_id') |

---

## 📁 Complete Database Schema

### Auth Module (`lib/schema/auth/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Next Auth) |
| `user_accounts` | OAuth/Provider accounts |
| `user_sessions` | User sessions |
| `user_verifications` | Email/Phone verification |
| `user_settings_overrides` | User-specific settings |
| `user_api_keys` | API keys for programmatic access |
| `user_audit_logs` | User activity audit trail |

### Projects Module (`lib/schema/projects/`)

| Table | Purpose |
|-------|---------|
| `project` | Main project container |
| `project_assets` | Single junction table for all asset types |
| `project_threed` | Links Projects to ThreeD modules |
| `project_traffic` | Links Projects to Traffic modules |
| `project_music` | Links Projects to Music modules |

### ThreeD Module (`lib/schema/threed/`)

| Table | Purpose |
|-------|---------|
| `threed` | Main ThreeD module configuration |
| `threed_plants` | Master plant database (NO markers) |
| `threed_models` | GLTF model library |
| `threed_model_files` | Associated files for 3D models |
| `threed_beds` | Garden layout with 3D positioning |
| `threed_plantings` | **Plants in beds with position data → BECOME MARKERS** |
| `threed_watering_schedules` | Automated watering schedules |
| `threed_watering_history` | Watering execution logs |
| `threed_harvests` | Harvest logging (NO markers) |
| `threed_tasks` | Garden tasks/to-do (NO markers) |
| `threed_weather_logs` | Environmental data (NO markers) |
| `threed_farmbots` | FarmBot devices |
| `threed_farmbot_logs` | FarmBot activity logs |
| `threed_characters` | 3D characters and creatures |
| `threed_layers` | **Configuration for what to display (NO markers)** |
| `threed_system_logs` | Application logging |
| `threed_character_models` | Junction: Character ↔ Models |

### Traffic Module (`lib/schema/traffic/`)

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

### Music Module (`lib/schema/music/`)

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

## 🎯 Key Features

### Settings System
- Centralized JSON configuration with admin UI
- User-specific overrides via database
- Deployment snapshots and rollback support

### Dynamic Navigation
- Auto-builds menu from settings
- Client-side rendering with no server dependencies
- Loading states and active page highlighting

### Traffic Module
- 6 real-time data sources with full CRUD
- 2D/3D map visualization with Leaflet + Three.js
- Runtime marker generation for traffic incidents

### ThreeD Garden Module
- Interactive 3D visualization with Three.js + React Three Fiber
- Plant database with growth stage tracking
- FarmBot integration and control
- Weather effects and logging
- **Runtime markers from Plantings**
- **View Presets** - Save and load camera positions
- **Rich Marker Popups** - Type-specific details
- **Layer Visibility Toggle** - Filter by marker type
- **Camera Focus** - Smooth zoom animation

### Unified Map Dashboard
- **Asset Type Toggle** - Show/hide specific 3D asset types (plantings, beds, characters, farmbots)
- **Default 3D View** - Page loads 3D scene by default
- **Project Layer Filtering** - Layers filtered by project via project_assets
- **Simplified Layer Controls** - Cleaner UI with auto-sync between layer toggles and module visibility
- **3D Scene Controls** - Auto-rotate, grid toggle, legend, center view
- **View Mode Switching** - 2D, 3D, and Combined views with keyboard shortcuts (1,2,3)

### Music Module
- Prominent media player with waveform visualization
- Full CRUD for albums, tracks, links, and media
- S3 integration for audio streaming

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
```

---

## 📋 ThreeD Marker Types

### What Gets Markers (Has Position Data):

| Type | Shape | Color | Source |
|------|-------|-------|--------|
| **Plantings** | Cylinder | #22c55e | `threed_plantings` |
| **Beds** | Wide Box | #f59e0b | `threed_beds` |
| **Characters** | Sphere | #8b5cf6 | `threed_characters` |
| **FarmBots** | Cube | #64748b | `threed_farmbots` |

### ❌ NOT Generated as Markers:

| Type | Reason |
|------|--------|
| **Plants** | Master data, not instances |
| **Tasks** | Simple to-dos |
| **Harvests** | Simple logs |
| **WeatherLogs** | Simple logs |
| **Layers** | Configuration, not instances |

---

## 🎮 ThreeD Scene Controls

| Control | Function |
|---------|----------|
| **Auto-Rotate** | Toggle automatic scene rotation |
| **Grid** | Toggle spatial reference grid |
| **Legend** | Toggle marker count legend |
| **Layers** | Show/Hide marker types |
| **Center View** | Reset camera to center |
| **Save Current View** | Save camera position + layers |
| **Saved Views** | Load previously saved views |
| **Focus** | Zoom to selected marker |
| **Rich Popups** | Click marker for details |

---

## 🖥️ Dashboard Map Page Controls

| Control | Function |
|---------|----------|
| **View Mode** | Switch between 2D, 3D, Combined (default: 3D) |
| **Asset Types** | Show/hide specific asset types (plantings, beds, characters, farmbots) |
| **Traffic Layers** | Toggle individual traffic data sources |
| **ThreeD Layers** | Toggle individual 3D layer types |
| **Fullscreen** | Enter/exit fullscreen mode |
| **Refresh** | Reload map data |
| **Project Selector** | Switch between projects |

---

## 🔧 API Architecture (Next.js 16)

### Key Pattern: `params` is a Promise

In Next.js 16+, dynamic route parameters are Promises that must be awaited:

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

### API Structure

```
api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   ├── assets/
│   │   └── route.ts          # GET, POST, DELETE
│   └── modules/
│       └── route.ts          # GET, POST, DELETE
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   ├── plants/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── beds/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── plantings/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   ├── layers/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE (supports projectId filtering)
│   └── markers/
│       └── route.ts          # (DEPRECATED - markers generated at runtime)
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   ├── chp-cad/
│   │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
│   └── caltrans/
│       └── route.ts          # GET, POST, PUT, PATCH, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    ├── albums/
    │   └── route.ts          # GET, POST, PUT, PATCH, DELETE
    └── tracks/
        └── route.ts          # GET, POST, PUT, PATCH, DELETE
```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 16 params is a Promise | Use `await params` in dynamic routes |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| DNS module error in client | Use client-safe settings loader |
| Enum value errors | Ensure enum values match schema definitions |
| Timestamp `{ mode: 'string' }` | Use `.toISOString()` when inserting |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
| Project Module | ✅ Working |
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
| **3D Scene** | ✅ **Enhanced** |
| **Runtime Markers** | ✅ **Working** |
| **View Presets** | ✅ **Working** |
| **Rich Popups** | ✅ **Working** |
| **Layer Toggle** | ✅ **Working** |
| **Asset Type Toggle** | ✅ **New** |
| **Camera Focus** | ✅ **Working** |
| **Dashboard Map UI** | ✅ **Enhanced** |
| Database | ✅ Connected |
| Seed Data | ✅ Complete |

---

## 🎉 v0.12.3 "Unified Map UI & Layer Management"

### What Changed

1. **Asset Type Toggle** - Show/hide specific 3D asset types (plantings, beds, characters, farmbots) directly from the dashboard
2. **Default 3D View** - Page now loads 3D scene by default instead of combined view
3. **Project Layer Filtering** - Layers API now filters layers by project via the `project_assets` junction table
4. **Simplified Layer Controls** - Removed redundant Eye icons, cleaner UI with auto-sync between layer toggles and module visibility
5. **Module Visibility State** - Auto-sync: toggling all layers off turns the module off; turning module on restores layers
6. **Layer API Enhancement** - GET handler uses `project_assets` to find layers linked to a project

### Benefits

- ✅ Users can quickly filter which asset types appear on the map
- ✅ Cleaner, more intuitive UI with less clutter
- ✅ Layers properly scoped to projects via junction table
- ✅ Auto-sync between layer toggles and module visibility
- ✅ 3D scene loads by default for better first impression

---

**Version:** v0.12.3 "Unified Map UI & Layer Management" 🚀

---
