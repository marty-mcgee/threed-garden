// app/api/music/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
// import { minimalAuth as auth } from "@/lib/auth/minimal-server";
import { db } from '@/lib/db/client';

import { music } from '@/lib/schema/music';
import { musicAlbums, musicTracks, musicLinks } from '@/lib/schema';
import { musicPoller } from '@/lib/services/music/MusicPoller';
import { MusicPollingType } from '@/lib/types/music';

import { eq, and, desc } from 'drizzle-orm';

// Use a hardcoded user ID for testing (replace with your actual user ID from database)
const defaultUserId = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';



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
export async function GETold(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use session user ID if available, otherwise use default for testing
    const userId = session?.user?.id || defaultUserId;

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // In your existing /api/music/route.ts, update the stats action
    if (action === 'stats') {
      const albums = await db.select().from(musicAlbums)
        // .where(eq(musicAlbums.userId, session.user.id));
        .where(eq(musicAlbums.userId, userId));
      const tracks = await db.select().from(musicTracks).innerJoin(
        musicAlbums,
        eq(musicTracks.albumId, musicAlbums.id)
      // ).where(eq(musicAlbums.userId, session.user.id));
      ).where(eq(musicAlbums.userId, userId));

      const links = await db.select().from(musicLinks)
        // .where(eq(musicLinks.userId, session.user.id));
        .where(eq(musicLinks.userId, userId));

      // Calculate total storage from S3 (optional - you'd need to query S3 API)

      return NextResponse.json({
        totalAlbums: albums.length,
        totalTracks: tracks.length,
        totalLinks: links.length,
        totalPlayCount: tracks.reduce((sum, t) => sum + (t.music_tracks.playCount || 0), 0),
        publishedAlbums: albums.filter(a => a.status === 'published').length,
        activeTracks: tracks.filter(t => t.music_tracks.status === 'active').length,
        activeLinks: links.filter(l => l.status === 'active').length,
        recentUploads: tracks.filter(t => {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - 30);
          return new Date(t.music_tracks.createdAt) > daysAgo;
        }).length,
        storageUsed: '0 GB', // You'll need S3 API for this
        lastPollTime: null,
        pollStatus: 'idle',
      });
    }

    // Get all albums for user
    const albums = await db.query.musicAlbums.findMany({
      // where: eq(musicAlbums.userId, session.user.id),
      where: eq(musicAlbums.userId, userId),
      with: {
        tracks: {
          orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
        },
      },
      orderBy: (albums, { asc }) => [asc(albums.sortOrder)],
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
export async function POSTold(request: NextRequest) {
  // try {
  //   // Auth.js: get session
  //   const session = await auth();
    
  //   // Use session user ID, or return 401 if not authenticated
  //   if (!session?.user?.id) {
  //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //   }

  //   const body = await request.json();
  //   const { action, data } = body;

  //   switch (action) {
  //     case 'poll':
  //       if (data?.type === MusicPollingType.METADATA) {
  //         const result = await musicPoller.poll();
  //         return NextResponse.json(result);
  //       }
  //       break;

  //     case 'increment-play':
  //       if (data?.trackId) {
  //         await musicPoller.incrementPlayCount(data.trackId);
  //         return NextResponse.json({ success: true });
  //       }
  //       break;

  //     default:
  //       return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  //   }
  // } catch (error) {
  //   console.error('Music API error:', error);
  //   return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  // }

  
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
        userId: session.user.id, // ✅ Add this!
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

