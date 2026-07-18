You're absolutely right! Let me correct the API structure and provide comprehensive CONTEXT.md documentation.

## ✅ Correct API Structure

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

### Project Module (Following Same Pattern)

```typescript
// api/project/route.ts
GET    /api/project           # List all projects (filtered by userId)
POST   /api/project           # Create a new project
PATCH  /api/project?id=1      # Update a project
DELETE /api/project?id=1      # Delete a project

// api/project/modules/route.ts
GET    /api/project/modules?projectId=1   # Get modules for a project
POST   /api/project/modules?projectId=1   # Add a module to a project
DELETE /api/project/modules?projectId=1   # Remove a module from a project
```

### ThreeD Module (Same Pattern)

```typescript
// api/threed/route.ts
GET    /api/threed             # List all threed modules (filtered by userId)
POST   /api/threed             # Create a new threed module
PATCH  /api/threed?id=1        # Update a threed module
DELETE /api/threed?id=1        # Delete a threed module

// api/threed/plants/route.ts
GET    /api/threed/plants      # List all plants (filtered by userId)
GET    /api/threed/plants?id=1 # Get a single plant
POST   /api/threed/plants      # Create a new plant
PUT    /api/threed/plants?id=1 # Full update of a plant
PATCH  /api/threed/plants?id=1 # Partial update of a plant
DELETE /api/threed/plants?id=1 # Delete a plant
```

### Traffic Module (Same Pattern)

```typescript
// api/traffic/route.ts
GET    /api/traffic             # List all traffic modules (filtered by userId)
POST   /api/traffic             # Create a new traffic module
PATCH  /api/traffic?id=1        # Update a traffic module
DELETE /api/traffic?id=1        # Delete a traffic module

// api/traffic/chp-cad/route.ts
GET    /api/traffic/chp-cad      # List all incidents (filtered by userId)
GET    /api/traffic/chp-cad?id=1 # Get a single incident
POST   /api/traffic/chp-cad      # Create a new incident
PUT    /api/traffic/chp-cad?id=1 # Full update of an incident
PATCH  /api/traffic/chp-cad?id=1 # Partial update of an incident
DELETE /api/traffic/chp-cad?id=1 # Delete an incident
```

### Music Module (Same Pattern)

```typescript
// api/music/route.ts
GET    /api/music               # List all music modules (filtered by userId)
POST   /api/music               # Create a new music module
PATCH  /api/music?id=1          # Update a music module
DELETE /api/music?id=1          # Delete a music module

// api/music/albums/route.ts
GET    /api/music/albums        # List all albums (filtered by userId)
GET    /api/music/albums?id=1   # Get a single album
POST   /api/music/albums        # Create a new album
PUT    /api/music/albums?id=1   # Full update of an album
PATCH  /api/music/albums?id=1   # Partial update of an album
DELETE /api/music/albums?id=1   # Delete an album
```

---

## 📁 Updated CONTEXT.md

### Project Context – threed-garden-neon

**Last Updated:** July 18, 2026 @ 2:00pm PST

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
| `user` (Auth.js) | `text('id')` | N/A |
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

## 📁 App File Structure

```
src/
├── app/
│   ├── auth/                       # Auth pages
│   │   ├── sign-in/                # Auth sign in (existing user)
│   │   ├── sign-out/               # Auth sign out (clean logout, clear cookies/storage)
│   │   ├── sign-up/                # Auth sign up (new user)
│   │   ├── error/                  # Auth error page (custom error output)
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard (for auth users)
│   │   └── projects/
│   │       ├── new/
│   │       │   └── page.tsx        # Create new project
│   │       └── [id]/
│   │           └── page.tsx        # Project detail with module CRUD
│   ├── api/
│   │   ├── project/
│   │   │   ├── route.ts            # Project CRUD
│   │   │   └── modules/
│   │   │       └── route.ts        # Project-module management
│   │   ├── threed/
│   │   │   ├── route.ts            # ThreeD module CRUD
│   │   │   └── plants/
│   │   │       └── route.ts        # Plant CRUD
│   │   ├── traffic/
│   │   │   ├── route.ts            # Traffic module CRUD
│   │   │   └── chp-cad/
│   │   │       └── route.ts        # CHP-CAD incident CRUD
│   │   └── music/
│   │       ├── route.ts            # Music module CRUD
│   │       └── albums/
│   │           └── route.ts        # Album CRUD
│   ├── dashboard/
│   │   ├── traffic/                # Traffic dashboard pages
│   │   ├── threed/                 # ThreeD dashboard pages
│   │   └── music/                  # Music dashboard pages
├── components/
│   ├── admin/
│   │   ├── music/
│   │   │   └── albums/
│   │   │       └── MusicAlbumCRUD.tsx
│   │   ├── threed/
│   │   │   └── plants/
│   │   │       └── ThreeDPlantsCRUD.tsx
│   │   └── traffic/
│   │       └── chp-cad/
│   │           └── TrafficCHPCADCRUD.tsx
│   ├── ui/                         # shadcn/ui components
│   └── navigation/
├── lib/
│   ├── schema/
│   │   ├── auth/                   # Auth.js schema (Next Auth.js compatible)
│   │   ├── settings/               # Settings schema (App Configuration Settings)
│   │   ├── project/                # Project schema + junction tables (Relate to Module Objects)
│   │   ├── threed/                 # ThreeD schema
│   │   ├── traffic/                # Traffic schema
│   │   └── music/                  # Music schema
│   ├── services/                   # Polling services for installed modules
│   ├── config/                     # Configuration of app
│   ├── db/                         # Database client
│   └── auth/                       # Auth.js configuration
└── middleware.ts
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

Let me know how the deployment goes and if you need any help! 🙌

---