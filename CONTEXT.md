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

### Auth Module (`lib/schema/auth/`)

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

---

**Version:** v0.4.4 (Projects & Module API Hierarchy for Next.js 16) 🚀

Excellent! Let's apply the same proven pattern to the **ThreeD, Traffic, and Music** modules. We'll build a consistent RESTful API for each module, just like we did for Projects.

## 🎯 The Pattern: One API Structure for All Modules

```
api/[module]/
├── route.ts              # GET (list), POST (create)
└── [id]/
    ├── route.ts          # GET, PATCH, DELETE (single item)
    └── [child]/
        └── route.ts      # GET, POST, DELETE (child items)
```

## 📁 1. ThreeD Module API

### `app/api/threed/route.ts` (List & Create)

```typescript
// app/api/threed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threed } from '@/lib/schema/threed';
import { eq, desc } from 'drizzle-orm';

// GET /api/threed - List all ThreeD modules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db
      .select()
      .from(threed)
      .where(eq(threed.userId, session.user.id))
      .orderBy(desc(threed.createdAt));

    if (projectId) {
      query = db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.userId, session.user.id),
            eq(threed.projectId, parseInt(projectId))
          )
        )
        .orderBy(desc(threed.createdAt));
    }

    const results = await query;
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed - Create a new ThreeD module
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, config } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(threed)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to create ThreeD module' },
      { status: 500 }
    );
  }
}
```

### `app/api/threed/[id]/route.ts` (Get, Update, Delete)

```typescript
// app/api/threed/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threed } from '@/lib/schema/threed';
import { eq, and } from 'drizzle-orm';

// GET /api/threed/1 - Get single ThreeD module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [result] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      );

    if (!result) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/threed/1 - Update a ThreeD module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, config } = body;

    const [existing] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config !== undefined) updateData.config = config;

    const [updated] = await db
      .update(threed)
      .set(updateData)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to update ThreeD module' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/1 - Delete a ThreeD module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ThreeD module' },
      { status: 500 }
    );
  }
}
```

### `app/api/threed/[id]/plants/route.ts` (Child Routes - Example)

```typescript
// app/api/threed/[id]/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threed, threedPlants } from '@/lib/schema/threed';
import { eq, and } from 'drizzle-orm';

// GET /api/threed/1/plants - Get all plants for a ThreeD module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const threedId = parseInt(id);

    if (isNaN(threedId)) {
      return NextResponse.json(
        { error: 'Invalid ThreeD ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [module] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, threedId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const plants = await db
      .select()
      .from(threedPlants)
      .where(eq(threedPlants.threedId, threedId))
      .orderBy(threedPlants.commonName);

    return NextResponse.json({ data: plants });
  } catch (error) {
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/1/plants - Create a new plant for a ThreeD module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const threedId = parseInt(id);

    if (isNaN(threedId)) {
      return NextResponse.json(
        { error: 'Invalid ThreeD ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [module] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, threedId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { commonName, scientificName, type, ...rest } = body;

    if (!commonName) {
      return NextResponse.json(
        { error: 'Missing required field: commonName' },
        { status: 400 }
      );
    }

    const [newPlant] = await db
      .insert(threedPlants)
      .values({
        threedId,
        commonName,
        scientificName: scientificName || '',
        type: type || 'Vegetable',
        ...rest,
      })
      .returning();

    return NextResponse.json({ data: newPlant });
  } catch (error) {
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}
```

## 📁 2. Traffic Module API

### `app/api/traffic/route.ts`

```typescript
// app/api/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { traffic } from '@/lib/schema/traffic';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/traffic - List all Traffic modules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db
      .select()
      .from(traffic)
      .where(eq(traffic.userId, session.user.id))
      .orderBy(desc(traffic.createdAt));

    if (projectId) {
      query = db
        .select()
        .from(traffic)
        .where(
          and(
            eq(traffic.userId, session.user.id),
            eq(traffic.projectId, parseInt(projectId))
          )
        )
        .orderBy(desc(traffic.createdAt));
    }

    const results = await query;
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/traffic - Create a new Traffic module
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, config } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(traffic)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to create Traffic module' },
      { status: 500 }
    );
  }
}
```

### `app/api/traffic/[id]/route.ts`

```typescript
// app/api/traffic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { traffic } from '@/lib/schema/traffic';
import { eq, and } from 'drizzle-orm';

// GET /api/traffic/1 - Get single Traffic module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [result] = await db
      .select()
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      );

    if (!result) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/traffic/1 - Update a Traffic module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, config } = body;

    const [existing] = await db
      .select()
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config !== undefined) updateData.config = config;

    const [updated] = await db
      .update(traffic)
      .set(updateData)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to update Traffic module' },
      { status: 500 }
    );
  }
}

// DELETE /api/traffic/1 - Delete a Traffic module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Traffic module' },
      { status: 500 }
    );
  }
}
```

## 📁 3. Music Module API

### `app/api/music/route.ts`

```typescript
// app/api/music/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { music } from '@/lib/schema/music';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/music - List all Music modules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db
      .select()
      .from(music)
      .where(eq(music.userId, session.user.id))
      .orderBy(desc(music.createdAt));

    if (projectId) {
      query = db
        .select()
        .from(music)
        .where(
          and(
            eq(music.userId, session.user.id),
            eq(music.projectId, parseInt(projectId))
          )
        )
        .orderBy(desc(music.createdAt));
    }

    const results = await query;
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/music - Create a new Music module
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, config } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(music)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Failed to create Music module' },
      { status: 500 }
    );
  }
}
```

### `app/api/music/[id]/route.ts`

```typescript
// app/api/music/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { music } from '@/lib/schema/music';
import { eq, and } from 'drizzle-orm';

// GET /api/music/1 - Get single Music module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [result] = await db
      .select()
      .from(music)
      .where(
        and(
          eq(music.id, moduleId),
          eq(music.userId, userId)
        )
      );

    if (!result) {
      return NextResponse.json(
        { error: 'Music module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/music/1 - Update a Music module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, config } = body;

    const [existing] = await db
      .select()
      .from(music)
      .where(
        and(
          eq(music.id, moduleId),
          eq(music.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Music module not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config !== undefined) updateData.config = config;

    const [updated] = await db
      .update(music)
      .set(updateData)
      .where(
        and(
          eq(music.id, moduleId),
          eq(music.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Failed to update Music module' },
      { status: 500 }
    );
  }
}

// DELETE /api/music/1 - Delete a Music module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(music)
      .where(
        and(
          eq(music.id, moduleId),
          eq(music.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Music module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(music)
      .where(
        and(
          eq(music.id, moduleId),
          eq(music.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Music module' },
      { status: 500 }
    );
  }
}
```

## 📁 4. Nested Child Routes Template

For any child routes (like plants, beds, albums, tracks, incidents), use this pattern:

### `app/api/[module]/[id]/[child]/route.ts`

```typescript
// app/api/[module]/[id]/[child]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { [module] } from '@/lib/schema/[module]';
import { [child] } from '@/lib/schema/[module]';
import { eq, and } from 'drizzle-orm';

// GET /api/[module]/1/[child] - List all child items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [module] = await db
      .select()
      .from([module])
      .where(
        and(
          eq([module].id, moduleId),
          eq([module].userId, userId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from([child])
      .where(eq([child].moduleId, moduleId))
      .orderBy([child].createdAt);

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error(`[Module] ${child} API error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/[module]/1/[child] - Create a new child item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [module] = await db
      .select()
      .from([module])
      .where(
        and(
          eq([module].id, moduleId),
          eq([module].userId, userId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    // Validation for required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert([child])
      .values({
        moduleId,
        ...body,
      })
      .returning();

    return NextResponse.json({ data: newItem });
  } catch (error) {
    console.error(`[Module] ${child} API error:`, error);
    return NextResponse.json(
      { error: `Failed to create ${child}` },
      { status: 500 }
    );
  }
}

// DELETE /api/[module]/1/[child] - Delete a child item (requires itemId in body)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [module] = await db
      .select()
      .from([module])
      .where(
        and(
          eq([module].id, moduleId),
          eq([module].userId, userId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing required field: itemId' },
        { status: 400 }
      );
    }

    // Verify item belongs to module
    const [item] = await db
      .select()
      .from([child])
      .where(
        and(
          eq([child].id, parseInt(itemId)),
          eq([child].moduleId, moduleId)
        )
      )
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in this module' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete([child])
      .where(eq([child].id, parseInt(itemId)))
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error(`[Module] ${child} API error:`, error);
    return NextResponse.json(
      { error: `Failed to delete ${child}` },
      { status: 500 }
    );
  }
}
```

## 📊 API Structure Summary (PROPOSED)

api/
├── project/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       └── modules/
│           └── route.ts      # GET, POST, DELETE
├── threed/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       ├── plants/
│       │   └── route.ts      # GET, POST, DELETE
│       ├── beds/
│       │   └── route.ts      # GET, POST, DELETE
│       └── farmbots/
│           └── route.ts      # GET, POST, DELETE
├── traffic/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       ├── incidents/
│       │   └── route.ts      # GET, POST, DELETE
│       └── closures/
│           └── route.ts      # GET, POST, DELETE
└── music/
    ├── route.ts              # GET (list), POST (create)
    └── [id]/
        ├── route.ts          # GET, PATCH, DELETE
        ├── albums/
        │   └── route.ts      # GET, POST, DELETE
        └── tracks/
            └── route.ts      # GET, POST, DELETE

---

**Version:** v0.4.4 (Projects & Module API Hierarchy for Next.js 16) 🚀

---