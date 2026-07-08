Absolutely! Here's your updated `CONTEXT.md` with all the new schema changes documented:

---

# Project Context – threed-garden-neon

**Last Updated:** July 8, 2026 @ 10:30am PST

---

## 🧱 Tech Stack

- **Framework:** Next.js 16.2.7 (App Router), TypeScript, React
- **Database:** Neon Postgres + Drizzle ORM
- **UI:** shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- **Music Streaming:** AWS S3
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 🗄️ Database Schema Architecture

### Parent-Child Relationship Pattern

The database follows a **clean parent-child hierarchy** where Projects own Modules, and Modules own their specific data:

```
User (user)
  └── Projects (project)
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
       │    ├── traffic_chp_collisions
       │    ├── traffic_lane_closures
       │    ├── traffic_bay_area_511_events
       │    ├── traffic_calfire_incidents
       │    ├── traffic_cctv_cameras
       │    ├── traffic_chp_cad_centers
       │    ├── traffic_caltrans_districts
       │    └── traffic_api_request_logs
       │
       └── Music (music) ← Main module table
            ├── music_albums
            ├── music_tracks
            ├── music_links
            ├── music_media
            ├── music_album_links
            ├── music_playback_history
            └── music_polling_logs
```

### Key ID Patterns

| Table Type | ID Type | Foreign Key Type |
|------------|---------|------------------|
| `user` (Better Auth) | `text('id')` | N/A |
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

### Auth Module (`lib/schema/user/`)

| Table | Purpose |
|-------|---------|
| `user` | Main user table (Better Auth) |
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
| `traffic_chp_cad_centers` | CHP communication centers |
| `traffic_chp_collisions` | Historical collisions |
| `traffic_lane_closures` | Caltrans lane closures |
| `traffic_lane_closures_snapshots` | Historical lane closure snapshots |
| `traffic_bay_area_511_events` | 511.org events |
| `traffic_cctv_cameras` | Traffic cameras |
| `traffic_calfire_incidents` | CalFire wildfire incidents |
| `traffic_caltrans_districts` | Caltrans districts |
| `traffic_api_request_logs` | API monitoring logs |

### Music Module (`lib/schema/music/`)

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

### Common Commands

```bash
# Development
bun dev

# Database
bun db:generate
bun db:migrate
bun db:push
bun db:studio

# Seeds
bun run db:seed-music
bun run src/lib/scripts/seed-threed-plants.ts

# Manual Polling
curl "http://localhost:4444/api/traffic/chp-cad/poll?action=poll"
curl "http://localhost:4444/api/music/poll"
curl "http://localhost:4444/api/threed/weather/poll"

# Settings Management
bun run settings:show
bun run settings:edit
```

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 502 errors on external APIs | Use native fetch instead of axios |
| CKAN date filtering not supported | Fetch all records, filter client-side |
| CHP CAD has no coordinates | City-level geocoding as fallback |
| 511.org coordinates nested | Extract from geography.coordinates |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Duplicate key errors | Use regular indexes, not unique indexes |
| Next.js 15 params async | Use await params in dynamic routes |
| DNS module error in client | Use client-safe settings loader |

---

## 🚦 Production Status

| Component | Status |
|-----------|--------|
| Settings System | ✅ Working |
| Dynamic Navigation | ✅ Working |
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

## 📁 App File Structure

```
src/
├── app/
│   ├── admin/settings/        # Settings admin UI
│   ├── api/                   # All API routes
│   ├── dashboard/             # Dashboard pages
│   │   ├── layout.tsx         # Client layout with NavDropdown
│   │   ├── music/             # Music module pages
│   │   ├── threed/            # ThreeD module pages
│   │   └── traffic/           # Traffic module pages
│   └── (auth pages)           # sign-in, sign-up
├── components/
│   ├── admin/                 # Admin components
│   │   └── SettingsManager.tsx
│   ├── navigation/            # Navigation components
│   │   └── NavDropdown.tsx
│   ├── music/                 # Music components
│   ├── threed/                # ThreeD components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── config/                # Configuration
│   │   ├── settings.json
│   │   ├── settings.ts
│   │   ├── settings.client.ts
│   │   └── navigation.client.ts
│   ├── schema/                # Database schemas
│   │   ├── user/
│   │   ├── settings/
│   │   ├── project/
│   │   ├── threed/
│   │   ├── traffic/
│   │   └── music/
│   ├── services/              # Polling services
│   └── types/                 # Type definitions
└── middleware.ts              # Route protection
```

---

**Version:** v0.4.0 (Projects & Module Hierarchy) 🚀