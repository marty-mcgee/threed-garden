# Project Context – threed-garden-neon

**Last Updated: June 3, 2026 @ 10:30am PST**

## 🧱 Tech Stack

- Framework: Next.js (App Router), TypeScript, React
- Database: Neon Postgres + Drizzle ORM
- UI: shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- Music Streaming: AWS S3
- Deployment: Vercel
- Package Manager: Bun

## 📡 Data Sources

| Source | Type | Method | Status |
|--------|------|--------|--------|
| CHP CAD (Live) | Live dispatcher feed | HTML scraping (Cheerio) | ✅ Working |
| CHP CKAN | Historical collisions | Official JSON API (CKAN) | ✅ Working |
| Caltrans CWWP2 | Real-time lane closures | Official JSON API | ✅ Working |
| Bay Area 511 | Real-time incidents | Official JSON API (511.org) | ✅ Working |
| Caltrans CCTV | Traffic cameras | Official JSON API | ✅ Working |
| CalFire | Wildfire incidents | Official JSON API | ✅ Working |

## 🎵 Music Module

### Overview
Complete music streaming and library management system with prominent media player, album/track CRUD, and AWS S3 integration.

### Tech Stack (Music Specific)
- **Storage:** AWS S3 (public bucket for MP3 files)
- **Authentication:** Better Auth (existing user sessions)
- **UI:** shadcn/ui (Slider, Progress, Dialog, Tabs)

### Music Database Schema

| Table | Purpose |
|-------|---------|
| `music_albums` | Album metadata (title, artist, cover art, release year, status) |
| `music_tracks` | Track metadata (title, duration, track number, publicUrl, lyrics) |
| `music_links` | Independent links (Spotify, social media, buy links) |
| `music_album_links` | Junction table linking albums/tracks to links |
| `music_polling_logs` | Polling service logs for S3 metadata sync |

### Music Enums
- `album_status`: draft, published, archived
- `track_status`: active, inactive, processing
- `music_link_type`: external, social, buy, stream, video
- `music_link_status`: active, inactive, pending, expired
- `music_polling_type`: metadata, stats, sync

### Music Dashboard Pages

| Page | Route | Features |
|------|-------|----------|
| **Music Dashboard** | `/dashboard/music` | Prominent media player, album grid, stats cards, links manager |
| **Admin - Albums** | `/dashboard/music/admin/albums` | Full CRUD, album management |
| **Admin - Tracks** | `/dashboard/music/admin/tracks` | Full CRUD per album |
| **Admin - Links** | `/dashboard/music/admin/links` | Independent link management |
| **Album Detail** | `/dashboard/music/admin/albums/[id]` | Album-specific track management |

### Music API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/music/albums` | Album CRUD + stats |
| `/api/music/tracks` | Track CRUD + filtering |
| `/api/music/links` | Link CRUD + associations |
| `/api/music/album-links` | Album-track-link associations |
| `/api/music/stream/[trackId]` | Returns public URL for streaming |
| `/api/music/poll` | Manual sync (GET) and control (POST) |
| `/api/music/stats` | Poller statistics |
| `/api/music/cron` | Automated sync endpoint |
| `/api/music/tracks/bulk` | Bulk track upload with metadata extraction |
| `/api/music/dashboard/stats` | Dashboard statistics |

### Prominent Media Player Features

| Feature | Description |
|---------|-------------|
| **Playback Controls** | Play/Pause, Previous/Next, Seek, Volume |
| **Keyboard Shortcuts** | Space (play/pause), ← → (seek), ↑ ↓ (volume), N/P (next/previous) |
| **Queue System** | "Play Next" functionality |
| **Recently Played** | Track history (localStorage) |
| **Favorites** | Heart/like system (localStorage) |
| **Playlist View** | Expandable track list |
| **Auto-play** | Automatically plays first track when album selected |

### Music Poller Service

| Method | Description |
|--------|-------------|
| `poll()` | Main sync operation from S3 |
| `getStats()` | Returns library statistics |
| `startPolling()` | Begin auto-sync |
| `stopPolling()` | Stop auto-sync |
| `incrementPlayCount()` | Track play analytics |

### Music Database Index Strategy
**Important:** All indexes are regular (non-unique) to allow multiple records:
- `music_albums_user_id_idx` (allow multiple albums per user)
- `music_albums_status_idx` (allow multiple albums with same status)
- `music_tracks_album_id_idx` (allow multiple tracks per album)
- `music_links_user_id_idx` (allow multiple links per user)

## 🗺️ Main Dashboard (/dashboard)

### Layer Toggle Cards

The main dashboard features color-coded layer toggle cards that control map marker visibility:

| Layer | Color | Icon | Function |
|-------|-------|------|----------|
| Caltrans | Blue | 🚧 Car | Show/hide lane closures |
| 511.org | Emerald | 📻 Radio | Show/hide traffic events |
| CHP Live | Red | 🚨 AlertTriangle | Show/hide live incidents |
| CHP Historical | Purple | 📅 Calendar | Show/hide historical collisions |

### Card Features
- Click toggles layer visibility on the map (no page navigation)
- Eye/EyeOff icons indicate current visibility status
- Record counts display number of items per source
- Active state styling (colored backgrounds, borders) when visible
- Show All / Hide All button for bulk layer control

### Map Features
- Dynamic legend - only shows currently enabled layers
- Marker clicks navigate to service-specific detail pages
- Filter panel for source and date range filtering
- Local Only / All Regions toggle for geographic filtering
- Historical data toggle (off by default for performance)
- Auto-refresh (60 seconds, toggle on/off)

## 📁 Service Dashboard Pages

| Page | Route | Features |
|------|-------|----------|
| 511.org | `/dashboard/511org` | Mendocino filter, expandable rows, map view |
| Caltrans | `/dashboard/caltrans` | District filter, closure details, map view |
| CHP Live | `/dashboard/chp-live` | Type filter, incident details, map view |
| CHP Historical | `/dashboard/chp-historical` | Severity/year filters, collision stats, map view |
| CalFire | `/dashboard/calfire` | County/status filters, fire stats, map view, pagination, show inactive toggle |

### Common Dashboard Patterns
- Expandable table rows - click row to see full details
- Toast notifications for poll results and errors
- Theme-aware styling (light/dark mode support)
- Responsive design with Tailwind CSS
- Consistent card layouts using shadcn/ui components

## 🔧 API Routes

### Main Data Endpoints

| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `/api/caltrans/closures/raw` | `?showAll=true` | Lane closures (District 1 by default) |
| `/api/bay-area-511` | `?showAll=true` | 511.org events (all Bay Area) |
| `/api/chp-cad` | - | Live CHP incidents (Ukiah/Humboldt only) |
| `/api/chp-historical/collisions` | `?showAll=true` | Historical collisions (local counties by default) |
| `/api/dashboard` | `?showAll=true&historical=true` | Unified endpoint for main dashboard |
| `/api/calfire` | `?showAll=true` | Wildfire incidents (active only by default) |

### Polling Endpoints

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/bay-area-511/cron` | Once daily | Polls 511.org API |
| `/api/caltrans/cron` | Once daily | Polls Caltrans CWWP2 API |
| `/api/chp-cad/cron` | Once daily | Scrapes CHP CAD page |
| `/api/chp-historical/cron` | Once daily | Polls CKAN API |
| `/api/calfire/cron` | Every 30 min | Polls CalFire API (active only) |

### Utility Endpoints
- `/api/*/poll?action=poll` - Manual trigger polling
- `/api/*/poll?action=stats` - Get poll statistics
- `/api/*/debug` - Debug endpoints for testing
- `/api/*/cron` - CRON endpoints for CRON jobs and Vercel
- `/api/*/seed` - Seed endpoints for populating db initially

## 🗄️ Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `chp_cad_incidents` | Live CHP incidents |
| `chp_cad_centers` | CHP communication centers |
| `chp_collisions` | Historical collisions |
| `lane_closures` | Caltrans lane closures |
| `bay_area_traffic_events` | 511.org events |
| `cctv_cameras` | Traffic cameras |
| `api_request_logs` | API monitoring |
| `calfire_incidents` | Wildfire incidents from CalFire API |
| `music_albums` | Album metadata |
| `music_tracks` | Track metadata |
| `music_links` | Independent links |
| `music_album_links` | Album-track-link associations |
| `music_polling_logs` | Polling service logs |

## 🎨 UI Components (shadcn/ui)

| Component | Usage |
|-----------|-------|
| Card, CardContent | Stats cards, filter panels |
| Button | Actions (variant: default, outline, secondary, ghost) |
| Badge | Status indicators, counts |
| Toast | Notification system |
| Dialog | Modal dialogs |
| Table | Data display in service dashboards |
| Slider | Volume and progress controls (Music Player) |
| Tabs | Music dashboard organization |

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Next.js 502 errors on external APIs | Use native fetch instead of axios |
| CKAN date filtering not supported | Fetch all records, filter client-side |
| CHP CAD has no coordinates | City-level geocoding as fallback |
| 511.org coordinates nested | Extract from geography.coordinates |
| Audio CORS errors | Configure S3 bucket CORS for your domain |
| Empty publicUrl in tracks | Ensure `public_url` has NOT NULL constraint |
| Duplicate key errors | Use regular indexes, not unique indexes |
| Next.js 15 params async | Use `await params` in dynamic routes |

## 🌱 ThreeD Garden Module

### Overview
ThreeD Garden is a comprehensive garden management system integrated with the traffic monitoring platform. It provides tools for tracking plants, garden beds, plantings, tasks, harvests, weather, and FarmBot robots.

### Tech Stack (ThreeD Specific)
- **3D Visualization:** Three.js + React Three Fiber (@react-three/fiber, @react-three/drei)
- **Database:** Neon Postgres + Drizzle ORM (threed_* tables)
- **External APIs:** OpenWeatherMap, FarmBot API

### ThreeD Database Schema

| Table | Purpose |
|-------|---------|
| `threed_plants` | Master plant database (common name, scientific name, type, growth parameters) |
| `threed_beds` | Garden layout with 3D positioning (x, y, z, rotation, scale) |
| `threed_plantings` | Plants placed in specific beds with growth stage tracking |
| `threed_tasks` | Garden task management (watering, fertilizing, pruning, harvesting) |
| `threed_harvests` | Yield tracking (quantity, weight, harvest date) |
| `threed_weather_logs` | Environmental data (temperature, humidity, rainfall, wind) |
| `threed_farmbots` | FarmBot device management (status, battery, firmware) |
| `threed_farmbot_logs` | FarmBot activity and sensor logs |
| `threed_system_logs` | Application logging |
| `threed_models` | Shared 3D assets (GLTF, GLB, FBX, OBJ) |
| `threed_characters` | Independent entities with animations and movement |

### ThreeD Dashboard Pages

| Page | Route | Features |
|------|-------|----------|
| **Master Dashboard** | `/dashboard/threed` | Unified view with 3D garden, stats cards, quick actions |
| **Plants** | `/dashboard/threed/plants` | Plant database with CRUD, pagination, filters |
| **Beds** | `/dashboard/threed/beds` | Garden layout with 3D positioning |
| **Plantings** | `/dashboard/threed/plantings` | Track plants in beds with growth stages |
| **Tasks** | `/dashboard/threed/tasks` | Garden to-do with priorities and due dates |
| **Harvests** | `/dashboard/threed/harvests` | Yield tracking with analytics |
| **Weather** | `/dashboard/threed/weather` | Current conditions and history |
| **FarmBots** | `/dashboard/threed/farmbots` | Device status and control |
| **3D Garden** | `/dashboard/threed/garden` | Interactive 3D visualization |
| **Analytics** | `/dashboard/threed/garden/analytics` | Harvest trends and statistics |

### ThreeD API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/threed/plants` | Plant CRUD + stats |
| `/api/threed/beds` | Bed CRUD + stats |
| `/api/threed/plantings` | Planting CRUD + stats |
| `/api/threed/tasks` | Task CRUD + stats + complete action |
| `/api/threed/harvests` | Harvest CRUD + stats |
| `/api/threed/weather` | Weather logs + stats + poll |
| `/api/threed/farmbots` | FarmBot CRUD + stats + poll + commands |
| `/api/threed/analytics` | Garden performance analytics |

### FarmBot Commands

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/threed/farmbots/[id]/water` | POST | Start watering (duration in ms) |
| `/api/threed/farmbots/[id]/move` | POST | Move to absolute/relative position |
| `/api/threed/farmbots/commands` | POST | Send custom FarmBot command |

### Polling Services

| Service | Endpoint | Schedule |
|---------|----------|----------|
| Weather | `/api/threed/weather/poll` | On-demand (cron: every 30 min) |
| FarmBot | `/api/threed/farmbots/poll` | On-demand (cron: every 15 min) |
| Plants | `/api/threed/plants/poll` | On-demand (seed data import) |

### 3D Visualization Features

#### Components
- `ThreeDGarden` - Main 3D scene with lighting, camera controls, and post-processing
- `GardenBed` - 3D bed model with hover effects and labels
- `GardenPlant` - Plant model with growth stage visualization
- `GardenGround` - Ground plane with grid reference
- `WeatherEffects` - Dynamic sun/rain effects based on current weather
- `FloatingUI` - In-canvas stats overlay

#### Controls
- **Drag to rotate** - Orbit around the garden
- **Right-click + drag** - Pan the view
- **Scroll** - Zoom in/out
- **Auto-rotate** - Toggle from controls panel
- **Click objects** - Select beds/plants for details

#### Growth Stage Visualization

| Stage | Color | Height |
|-------|-------|--------|
| Seed | Brown | 0.1 units |
| Seedling | Light Green | 0.3 units |
| Vegetative | Bright Green | 0.6 units |
| Flowering | Pink | 0.8 units |
| Fruiting | Orange/Red | 1.0 units |
| Mature | Dark Green | 1.2 units |

### FarmBot Integration

**Features:**
- Device Sync - Pull device info, status, last seen
- Sensor Data - Soil moisture, temperature, light levels
- Log Management - Captures all FarmBot activity
- Plant Sync - Imports plants from FarmBot points
- Command Execution - Water, move, emergency stop, photo capture

### Environment Variables Required

```bash
FARMBOT_API_TOKEN=your_personal_access_token
FARMBOT_API_URL=https://my.farmbot.io/api
FARMBOT_DEVICE_ID=your_device_id
OPENWEATHER_API_KEY=your_api_key

# Music Module
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
S3_BUCKET_NAME=threedpublic
S3_PUBLIC_URL=https://threedpublic.s3.us-west-2.amazonaws.com
MUSIC_POLL_INTERVAL=300000
MUSIC_AUTO_SYNC_METADATA=true

---

src/
├── app/
│   ├── api/
│   │   ├── music/           # Music API routes (10+ endpoints)
│   │   └── threed/          # ThreeD API routes (8 services + analytics)
│   ├── dashboard/
│   │   ├── music/           # Music dashboard + admin pages
│   │   └── threed/          # ThreeD dashboard (9 pages)
│   └── (auth pages)         # sign-in, sign-up
├── components/
│   ├── music/               # MusicPlayer, AlbumGrid, LinksManager, MusicStats, BulkTrackUpload
│   ├── threed/              # 3D components (GardenBed, GardenPlant, ThreeDGarden, etc.)
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth/                # Better Auth configuration
│   ├── db/                  # Database client and seeds
│   ├── services/
│   │   ├── music/           # MusicPoller service
│   │   └── threed/          # Pollers (WeatherPoller, FarmBotPoller, PlantDataPoller)
│   ├── types/
│   │   ├── music.ts         # Music interfaces and enums
│   │   └── threed.ts        # ThreeD types
│   └── scripts/             # Backfill and maintenance scripts

---

🔧 Common Commands
Development
bash

bun dev

Database
bash

bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio

# Music seeds
bun run db:seed-music
bun run db:seed-json
bun run db:seed-simple

# ThreeD seed
bun run src/lib/scripts/seed-threed-plants.ts

Manual Polling - Traffic Services
bash

curl "http://localhost:3333/api/chp-cad/poll?action=poll"
curl "http://localhost:3333/api/chp-historical/poll?action=poll&limit=500&startDate=2026-01-01"
curl "http://localhost:3333/api/bay-area-511/poll?action=poll"
curl "http://localhost:3333/api/caltrans/poll"
curl "http://localhost:3333/api/calfire/poll?action=poll"

Manual Polling - ThreeD Services
bash

curl "http://localhost:3333/api/threed/weather/poll"
curl "http://localhost:3333/api/threed/farmbots/poll"

Manual Polling - Music Service
bash

curl "http://localhost:3333/api/music/poll"
curl "http://localhost:3333/api/music?action=stats"

Music API Testing
bash

# Get all albums
curl "http://localhost:3333/api/music/albums"

# Get tracks for album
curl "http://localhost:3333/api/music/tracks?albumId=1"

# Test stream endpoint
curl "http://localhost:3333/api/music/stream/1"

# Get dashboard stats
curl "http://localhost:3333/api/music/dashboard/stats"

FarmBot Commands
bash

# Water (replace 1 with device ID)
curl -X POST "http://localhost:3333/api/threed/farmbots/1/water" \
  -H "Content-Type: application/json" \
  -d `{"durationMs": 30000}`

# Move
curl -X POST "http://localhost:3333/api/threed/farmbots/1/move" \
  -H "Content-Type: application/json" \
  -d `{"x": 0, "y": 0, "z": 0}`

Test Cron Jobs Locally
bash

curl "http://localhost:3333/api/bay-area-511/cron"
curl "http://localhost:3333/api/caltrans/cron"
curl "http://localhost:3333/api/chp-cad/cron"
curl "http://localhost:3333/api/chp-historical/cron"
curl "http://localhost:3333/api/calfire/cron"
curl "http://localhost:3333/api/music/cron"

Production Health Checks
bash

curl "https://threed-garden-neon.vercel.app/api/threed/weather/poll"
curl "https://threed-garden-neon.vercel.app/api/calfire/poll?action=stats"
curl "https://threed-garden-neon.vercel.app/api/music?action=stats"
curl "https://threed-garden-neon.vercel.app/api/debug/db-test"

✅ Production Status Summary
Service	Status
Weather Poller	✅ Working
CalFire Poller	✅ Working
Caltrans Poller	✅ Working
Bay Area 511	✅ Working
CHP CAD	✅ Working
CHP Historical	✅ Working
FarmBot Poller	✅ Working
Music Poller	✅ Working
Music Player	✅ Working
3D Garden	✅ Rendering
Database	✅ Connected
🎯 What You`ve Built
📊 Data Management

    8 traffic services with full CRUD

    5 music services with full CRUD

    Real-time polling for external APIs

    PostgreSQL database with Neon

    Drizzle ORM for type-safe queries

🎨 User Interface

    9 ThreeD dashboard pages with pagination

    4 Music dashboard pages with prominent player

    Dual pagination controls (top and bottom)

    Expandable table rows with details

    Add/Edit/Delete modals with forms

    Toast notifications

    Theme-aware styling (light/dark mode)

🎮 3D Visualization

    Interactive R3F garden scene

    Growth-stage based plant models

    Dynamic lighting (time of day)

    Decorative elements (trees, water, flowers)

    Auto-rotate camera controls

    Bloom and vignette effects

🎵 Music Streaming

    Prominent media player

    Album and track management

    S3 integration for audio files

    Keyboard shortcuts and queue system

    Favorites and recently played

    Bulk track upload with metadata extraction

🤖 Integrations

    OpenWeatherMap API

    FarmBot API

    Caltrans CWWP2

    CHP CAD scraping

    511.org API

    CalFire API

    AWS S3

🚀 Ready for Production

Your platform is complete and production-ready, featuring:

    ✅ Traffic Monitoring - 6 real-time data sources

    ✅ 3D Garden - Full garden management with FarmBot integration

    ✅ Music Streaming - Complete library management with S3

    ✅ Authentication - Better Auth with email/password

    ✅ Responsive Design - Mobile-friendly with theme support

Last Updated: June 3, 2026 @ 10:30am PST
Version: v0.2.0
text


This updated CONTEXT.md now fully documents all three major modules of your platform: Traffic Monitoring, ThreeD Garden, and Music Streaming. The documentation is comprehensive, well-organized, and ready for any future AI session or new developer to understand your complete application architecture.

---