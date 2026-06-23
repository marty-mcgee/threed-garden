# Project Context – threed-garden-neon

**Last Updated: June 23, 2026 @ 09:30am PST**

## 🧱 Tech Stack

- Framework: Next.js (App Router), TypeScript, React
- Database: Neon Postgres + Drizzle ORM
- UI: shadcn/ui, Tailwind, Three.JS, React Three Fiber, Leaflet (OpenStreetMaps)
- Music Streaming: AWS S3
- Deployment: Vercel
- Package Manager: Bun


## App Modules (Services)
- Traffic
- ThreeD
- Music


## 🗄️ Database Schema (Key Tables for all Modules)

| Table | Purpose |
|-------|---------|
| `api_request_logs` | API monitoring |
| `traffic_chp_cad_incidents` | Live CHP incidents |
| `traffic_chp_cad_centers` | CHP communication centers |
| `traffic_chp_collisions` | Historical collisions |
| `traffic_lane_closures` | Caltrans lane closures |
| `traffic_bay_area_traffic_events` | 511.org events |
| `traffic_cctv_cameras` | Traffic cameras |
| `traffic_calfire_incidents` | Wildfire incidents from CalFire API |
| `music_albums` | Album metadata |
| `music_tracks` | Track metadata |
| `music_links` | Independent links |
| `music_album_links` | Album-track-link associations |
| `music_polling_logs` | Polling service logs |


## 📡 Data Sources

| Source | Type | Method | Status |
|--------|------|--------|--------|
| CHP CAD (Live) | Live dispatcher feed | HTML scraping (Cheerio) | ✅ Working |
| CHP CKAN | Historical collisions | Official JSON API (CKAN) | ✅ Working |
| Caltrans CWWP2 | Real-time lane closures | Official JSON API | ✅ Working |
| Bay Area 511 | Real-time incidents | Official JSON API (511.org) | ✅ Working |
| Caltrans CCTV | Traffic cameras | Official JSON API | ✅ Working |
| CalFire | Wildfire incidents | Official JSON API | ✅ Working |


## 🔧 API Routes

### Utility Endpoints
- `/api/*/poll?action=poll` - Manual trigger polling
- `/api/*/poll?action=stats` - Get poll statistics
- `/api/*/debug` - Debug endpoints for testing
- `/api/*/cron` - CRON endpoints for CRON jobs and Vercel
- `/api/*/seed` - Seed endpoints for populating db initially

### Main Data Endpoints

| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `/api/traffic/bay-area-511` | `?showAll=true` | 511.org events (all Bay Area) |
| `/api/traffic/caltrans/closures/raw` | `?showAll=true` | Lane closures (District 1 by default) |
| `/api/traffic/chp-cad` | - | Live CHP incidents (Ukiah/Humboldt only) |
| `/api/traffic/chp-historical/collisions` | `?showAll=true` | Historical collisions (local counties by default) |
| `/api/traffic/calfire` | `?showAll=true` | Wildfire incidents (active only by default) |

### Polling Endpoints

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/traffic/bay-area-511/cron` | Every 30 min | Polls 511.org API |
| `/api/traffic/caltrans/cron` | Every 30 min | Polls Caltrans CWWP2 API |
| `/api/traffic/chp-cad/cron` | Every 5 min | Scrapes CHP CAD page |
| `/api/traffic/chp-historical/cron` | Once daily | Polls CKAN API |
| `/api/traffic/calfire/cron` | Every 30 min | Polls CalFire API (active only) |



## 🎵 Music Module

### Overview
Complete music streaming and library management system with prominent media player, album/track CRUD, and AWS S3 integration.

### Tech Stack (Music Specific)
- **Storage:** AWS S3 (public bucket for MP3|WAV|PNG|JPG|GLB|FBX|OBJ files)
- **Storage:** Vercel Blob (public blobs for any media files)
- **Authentication:** Better Auth (existing user sessions)
- **UI:** shadcn/ui (Slider, Progress, Dialog, Tabs, Cards, ...)

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

### Music Dashboard + Admin Pages

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
| 511.org | `/dashboard/traffic/511org` | Mendocino filter, expandable rows, map view |
| Caltrans | `/dashboard/traffic/caltrans` | District filter, closure details, map view |
| CHP Live | `/dashboard/traffic/chp-live` | Type filter, incident details, map view |
| CHP Historical | `/dashboard/traffic/chp-historical` | Severity/year filters, collision stats, map view |
| CalFire | `/dashboard/traffic/calfire` | County/status filters, fire stats, map view, pagination, show inactive toggle |

### Common Dashboard Patterns
- Expandable table rows - click row to see full details
- Toast notifications for poll results and errors
- Theme-aware styling (light/dark mode support)
- Responsive design with Tailwind CSS
- Consistent card layouts using shadcn/ui components










































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

Features Added:
Music Media Table:

    albumId - Foreign key to music_albums

    fileName - Original filename

    fileUrl - URL to the image (can be external or uploaded)

    fileType - MIME type for proper rendering

    fileSize - Size in bytes

    isPrimary - Flag for primary album cover

    metadata - JSON for additional data

CRUD Operations:

    GET - Fetch media by album ID or single media by ID

    POST - Create new media entry

    PUT - Update media (including setting as primary)

    DELETE - Remove media

UI Features:

    Primary cover display - Shows main album art prominently

    Gallery view - Grid of additional images

    Set as primary - Button to change which image is the album cover

    External links - View full-size images in new tab

This gives you complete control over album artwork without complex upload logic - just provide URLs to your images!

---

## 🎵 Music Module (Complete - June 2026)

### Overview
Full-featured music streaming platform with album management, track playback, link integration, and media gallery. Features a prominent music player with waveform visualization, tabbed interface for track list, external links, and photo gallery.

### Tech Stack (Music Specific)
- **Storage:** AWS S3 (audio files), Vercel Blob (images)
- **Database:** Neon Postgres + Drizzle ORM (music_* tables)
- **Authentication:** Better Auth (admin panel only)
- **Audio Analysis:** Web Audio API for waveform visualization
- **UI:** shadcn/ui components (Slider, Tabs, Dialog, ScrollArea)

### Music Database Schema

| Table | Purpose |
|-------|---------|
| `music_albums` | Album metadata (title, artist, coverArt, releaseYear, sortOrder, isPublic) |
| `music_tracks` | Track metadata (title, duration, trackNumber, publicUrl, playCount) |
| `music_links` | External links (Spotify, social, buy, stream, video) |
| `music_album_links` | Junction table linking albums/tracks to links |
| `music_media` | Album images (fileName, fileUrl, fileType, isPrimary) |
| `music_polling_logs` | Sync service logs |
| `music_playback_history` | User listening history (trackId, albumId, playDuration, completed) |

### Music Enums

| Enum | Values |
|------|--------|
| `album_status` | draft, published, archived |
| `track_status` | active, inactive, processing |
| `music_link_type` | external, social, buy, stream, video |
| `music_link_status` | active, inactive, pending, expired |

### Music Dashboard Pages

| Page | Route | Features |
|------|-------|----------|
| **Music Library** | `/dashboard/music` | Prominent player, album grid |
| **Admin - Albums** | `/dashboard/music/admin/albums` | Full CRUD, sort order, track management |
| **Admin - Tracks** | `/dashboard/music/admin/tracks` | Cross-album track management |
| **Admin - Links** | `/dashboard/music/admin/links` | Link CRUD with album association |
| **Admin - Media** | `/dashboard/music/admin/media` | Image management across albums |
| **Album Detail** | `/dashboard/music/admin/albums/[id]` | Tracks, links, media per album |

### MusicPlayer Components

#### Left Column
- **Album Art** - Large square artwork (w-64 h-64)
- **Now Playing Info** - Track title, album, artist, release year
- **Playback Controls** - Play/Pause, Previous, Next
- **Progress Bar** - Seekable timeline with time display
- **Volume Control** - Slider with mute toggle

#### Right Column
- **Waveform Visualizer** - Real-time audio waveform with purple gradient
- **Tabbed Interface** - Track List | Links | Media Gallery

#### Track List Tab
- Scrollable track list with numbers and durations
- Current track highlighted with left border
- Animated equalizer bars for playing track
- Click to select and play any track

#### Links Tab
- External link cards with type-specific icons
- Opens in new tab with external link indicator
- Shows title and optional description

#### Media Gallery Tab
- Responsive image grid (3-6 columns)
- Lightbox carousel on image click
- Keyboard navigation (arrow keys, escape)
- Zoom in/out functionality
- Primary badge on main album image

### Music API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/music/albums` | Album CRUD + links + media |
| `/api/music/tracks` | Track CRUD + filtering |
| `/api/music/links` | Link CRUD + album associations |
| `/api/music/media` | Image upload + CRUD |
| `/api/music/stream/[trackId]` | Returns public URL for streaming |
| `/api/music/photos` | Photo upload (deprecated - use media) |

### Waveform Visualizer

#### Features
- **Deterministic generation** - Consistent waveform per track based on URL hash
- **Real progress tracking** - Purple gradient for played portion
- **Rounded bars** - Modern pill-shaped bars
- **Edge-to-edge fit** - No left/right padding
- **Loading states** - Animated bouncing bars during analysis
- **Error handling** - Graceful fallback messages

### Playback Logic

| Scenario | Behavior |
|----------|----------|
| **Page loads** | First album loaded, PAUSED (no autoplay error) |
| **User clicks album card** | Album loads, PAUSED |
| **User clicks Play Album button** | Album loads, PAUSED |
| **User clicks Play button** | Starts playing current track |
| **Track ends (not last)** | Auto-plays next track in same album |
| **Last track ends** | Auto-loads next album, auto-plays first track |
| **End of library** | Playback stops |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Seek backward 5 seconds |
| `→` | Seek forward 5 seconds |
| `↑` | Volume up |
| `↓` | Volume down |
| `N` | Next track |
| `P` | Previous track |

### Admin Features

#### Album Management
- Create/Edit/Delete albums
- Sort order control (lower numbers appear first)
- Public/private visibility toggle
- Drag-and-drop image upload for cover art
- Auto-extract release year from metadata

#### Track Management
- Upload MP3 files to S3
- Auto-extract duration from audio
- Bulk upload with metadata extraction
- Track number ordering per album

#### Link Management
- Associate links with specific albums
- Type classification (Spotify, Bandcamp, YouTube, Instagram, etc.)
- Display order control
- Active/inactive status

#### Media Management
- Upload images to Vercel Blob
- Set primary album cover
- Delete images
- Gallery view with hover actions

### Environment Variables

```bash
# AWS S3 (audio files)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
S3_BUCKET_NAME=threedpublic
S3_PUBLIC_URL=https://threedpublic.s3.us-west-2.amazonaws.com

# Vercel Blob (images)
BLOB_READ_WRITE_TOKEN=your_token

# Authentication (admin only)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret

# Database
DATABASE_URL=your_neon_connection_string

Database Indexes
Table	Index	Type
music_albums	user_id, status, sortOrder	Regular (non-unique)
music_tracks	album_id, status	Regular (non-unique)
music_links	user_id, type	Regular (non-unique)
music_media	user_id, album_id, isPrimary	Regular (non-unique)
music_album_links	album_id+link_id, track_id+link_id	Regular (non-unique)
File Structure
text

src/
├── app/
│   ├── api/music/
│   │   ├── albums/route.ts
│   │   ├── tracks/route.ts
│   │   ├── links/route.ts
│   │   ├── media/route.ts
│   │   ├── stream/[trackId]/route.ts
│   │   └── upload/route.ts
│   └── dashboard/music/
│       ├── page.tsx (musicContent.tsx)
│       └── admin/
│           ├── albums/page.tsx
│           ├── tracks/page.tsx
│           ├── links/page.tsx
│           └── media/page.tsx
├── components/music/
│   ├── MusicPlayer.tsx
│   ├── AlbumGrid.tsx
│   ├── MusicStats.tsx
│   ├── LinksManager.tsx
│   ├── MediaManager.tsx
│   ├── MediaGallery.tsx
│   ├── WaveformVisualizer.tsx
│   └── BulkTrackUpload.tsx
└── lib/
    ├── auth/schema.ts (music_* tables)
    ├── types/music.ts
    └── services/music/MusicPoller.ts

Common Commands
bash

# Database
bun db:generate
bun db:push
bun db:studio

# Seed data
bun db:seed-music

# Manual sync
curl "http://localhost:4444/api/music/poll"

# API Testing
curl "http://localhost:4444/api/music/albums"
curl "http://localhost:4444/api/music/tracks?albumId=1"

Known Issues & Solutions
Issue	Solution
Waveform not showing	Configure S3 CORS headers
Autoplay blocked	User must initiate first play
Image upload fails	Check Vercel Blob token
Audio CORS errors	Add allowed origins to S3 bucket
Production Status
Component	Status
Album CRUD	✅ Working
Track CRUD	✅ Working
Link CRUD	✅ Working
Media CRUD	✅ Working
Music Player	✅ Working
Waveform	✅ Working
Auto-play logic	✅ Working
Lightbox Gallery	✅ Working
S3 Streaming	✅ Working

Last Updated: June 6, 2026
Version: Music Module v1.0
text


This CONTEXT.md section provides comprehensive documentation for your Music Module, making it easy for any developer (or future AI) to understand the complete architecture, features, and setup! 🎵

---

our Complete Music Platform - Final Summary
✅ Fully Functional Features:
Player

    Prominent 2-column layout with large album art
    Real waveform visualization with purple gradient progress
    Tabbed interface: Track List | Links | Media Gallery
    Smart auto-play logic (no autoplay on load, auto-next track/album)
    Keyboard shortcuts (Space, arrows, N/P)
    Volume control with mute toggle

Admin

    Albums - CRUD with sort order, public/private toggle
    Tracks - MP3 upload, duration extraction, bulk upload
    Links - Associate with albums, type classification
    Media - Image upload to Vercel Blob, primary flag, lightbox gallery

Data Flow

    Albums load with all relations (tracks, links, media)
    First album loads but stays paused
    User clicks play to start listening
    Seamless auto-advance through tracks and albums

What You've Built

You now have a professional-grade music streaming platform that would be perfect for independent musicians, labels, or personal collections. The combination of beautiful UI, smart playback logic, and comprehensive admin tools makes it production-ready!

Is there anything else you'd like to add or refine? Some possibilities:

    Playlist creation for users
    Search functionality across albums/tracks
    Social sharing features
    Download options for purchased music
    Lyrics display synchronized with playback

Great work on this entire project! 🚀🎵

---

## Current App File Structure

marty@NucBoxK10:~/marty-mcgee-neon$ tree -r ./src
./src
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
│   ├── services
│   │   ├── traffic
│   │   │   ├── TravelTimesPoller.ts
│   │   │   ├── CaltransPoller.ts
│   │   │   ├── CaltransPoller-info.ts
│   │   │   ├── CalFirePoller.ts
│   │   │   ├── CHPPoller.ts
│   │   │   ├── CHPCADPoller.ts
│   │   │   ├── CCTVPoller.ts
│   │   │   └── BayArea511Poller.ts
│   │   ├── threed
│   │   │   ├── WeatherPoller.ts
│   │   │   ├── PlantModelMapping.ts
│   │   │   ├── PlantDataPoller.ts
│   │   │   └── FarmBotPoller.ts
│   │   ├── music
│   │   │   ├── S3.ts
│   │   │   └── MusicPoller.ts
│   │   ├── index.ts
│   │   └── app
│   │       └── MasterDataService.ts
│   ├── scripts
│   ├── schema
│   │   ├── traffic
│   │   ├── threed
│   │   ├── music
│   │   └── index.ts
│   ├── db
│   │   └── client.ts
│   ├── data
│   │   ├── traffic
│   │   │   └── seed.ts
│   │   ├── threed
│   │   │   └── plants.ts
│   │   └── music
│   │       ├── seed.ts
│   │       ├── seed-simple.ts
│   │       ├── seed-from-json.ts
│   │       ├── seed-data.json
│   │       └── music.ts
│   └── auth
│       ├── server.ts
│       ├── minimal-server.ts
│       └── client.ts
├── components
│   ├── ui
│   │   ├── toast.tsx
│   │   ├── textarea.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
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
│   │   │   └── leafletMap.tsx
│   │   └── dashboard
│   │       ├── CaltransClosures.tsx
│   │       ├── CHPLiveIncidents.tsx
│   │       ├── CHPHistorical.tsx
│   │       └── BayArea511.tsx
│   ├── threed
│   │   ├── WeatherEffects.tsx
│   │   ├── ThreeDGarden.tsx
│   │   ├── ThreeDGarden-working.tsx
│   │   ├── ThreeDGarden-working-3-base.tsx
│   │   ├── ThreeDGarden-working-2.tsx
│   │   ├── PlantModels.tsx
│   │   ├── PlantModels-working.tsx
│   │   ├── ModelPreview.tsx
│   │   ├── GardenViewer.tsx
│   │   ├── GardenPlant.tsx
│   │   ├── GardenPlant-working.tsx
│   │   ├── GardenPlant-original.tsx
│   │   ├── GardenGround.tsx
│   │   ├── GardenCharacter.tsx
│   │   ├── GardenBed.tsx
│   │   ├── GLTFPlant.tsx
│   │   ├── FloatingUI.tsx
│   │   ├── FloatingUI copy.tsx
│   │   └── AnimatedFBXPlant.tsx
│   ├── themes
│   │   ├── selector.tsx
│   │   └── provider.tsx
│   └── music
│       ├── WaveformVisualizer.tsx
│       ├── MusicStats.tsx
│       ├── MusicPlayer.tsx
│       ├── MediaManager.tsx
│       ├── MediaGallery.tsx
│       ├── LinksManager.tsx
│       ├── AlbumGrid.tsx
│       └── AdminMusicManager.tsx
└── app
    ├── sign-up
    │   └── page.tsx
    ├── sign-in
    │   └── page.tsx
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
    │   │   ├── page.tsx
    │   │   ├── musicContent.tsx
    │   │   ├── layout-potential.tsx
    │   │   ├── album
    │   │   │   └── [id]
    │   │   │       └── page.tsx
    │   │   └── admin
    │   │       ├── tracks
    │   │       │   ├── page.tsx
    │   │       │   └── [id]
    │   │       │       └── page.tsx
    │   │       ├── page.tsx
    │   │       ├── media
    │   │       │   └── page.tsx
    │   │       ├── links
    │   │       │   └── page.tsx
    │   │       ├── layout.tsx
    │   │       └── albums
    │   │           ├── page.tsx
    │   │           └── [id]
    │   │               └── page.tsx
    │   └── layout.tsx
    ├── api
    │   ├── traffic
    │   │   ├── chp-historical
    │   │   │   ├── seed
    │   │   │   │   └── route.ts
    │   │   │   ├── route.ts
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
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── cron
    │   │   │   │   └── route.ts
    │   │   │   └── chp-cad-centers
    │   │   │       └── route.ts
    │   │   ├── cctv
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── caltrans
    │   │   │   ├── seed
    │   │   │   │   └── route.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── cron
    │   │   │   │   └── route.ts
    │   │   │   └── closures
    │   │   │       ├── update-coordinates
    │   │   │       │   └── route.ts
    │   │   │       ├── summary
    │   │   │       │   ├── route.ts
    │   │   │       │   └── debug
    │   │   │       │       └── route.ts
    │   │   │       ├── stats
    │   │   │       │   └── route.ts
    │   │   │       ├── simple
    │   │   │       │   └── route.ts
    │   │   │       ├── search
    │   │   │       │   └── route.ts
    │   │   │       ├── route.ts
    │   │   │       ├── raw
    │   │   │       │   └── route.ts
    │   │   │       ├── export
    │   │   │       │   └── route.ts
    │   │   │       ├── add-test-coordinates
    │   │   │       │   └── route.ts
    │   │   │       └── [id]
    │   │   │           └── route.ts
    │   │   ├── calfire
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   │   └── route.ts
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   │       └── route.ts
    │   │   └── bay-area-511
    │   │       ├── seed
    │   │       │   └── route.ts
    │   │       ├── route.ts
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
    │   │   ├── tasks
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
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
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── models
    │   │   │   ├── route.ts
    │   │   │   └── [id]
    │   │   │       ├── route.ts
    │   │   │       └── files
    │   │   │           ├── route.ts
    │   │   │           └── [fileId]
    │   │   │               └── route.ts
    │   │   ├── logs
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   └── route.ts
    │   │   ├── harvests
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
    │   │   │   ├── poll
    │   │   │   ├── debug
    │   │   │   └── cron
    │   │   ├── farmbots
    │   │   │   ├── stats
    │   │   │   │   └── route.ts
    │   │   │   ├── seed
    │   │   │   ├── route.ts
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
    │   │   ├── album-links
    │   │   │   └── route.ts
    │   │   └── admin
    │   │       └── stats
    │   │           └── route.ts
    │   ├── debug
    │   │   ├── test
    │   │   │   ├── verify
    │   │   │   │   └── route.ts
    │   │   │   ├── route.ts
    │   │   │   ├── populate
    │   │   │   │   └── route.ts
    │   │   │   ├── cwwp2-status
    │   │   │   │   └── route.ts
    │   │   │   ├── caltrans
    │   │   │   │   └── route.ts
    │   │   │   └── add-more
    │   │   │       └── route.ts
    │   │   ├── schema-check
    │   │   │   └── route.ts
    │   │   ├── route.ts
    │   │   ├── ids
    │   │   │   └── route.ts
    │   │   ├── full
    │   │   │   └── route.ts
    │   │   ├── database
    │   │   │   └── route.ts
    │   │   ├── compare
    │   │   │   └── route.ts
    │   │   └── api-structures
    │   │       └── route.ts
    │   ├── dashboard
    │   │   ├── stats
    │   │   │   └── route.ts
    │   │   └── route.ts
    │   ├── auth
    │   │   ├── debug
    │   │   │   └── route.ts
    │   │   └── [...all]
    │   │       └── route.ts
    │   └── app
    │       └── master-data
    │           └── route.ts
    └── admin
        └── coordinates
            └── page.tsx

206 directories, 247 files

---

**Last Updated: June 23, 2026 @ 10:00am PST**