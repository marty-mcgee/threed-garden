import { NextRequest, NextResponse } from 'next/server';
import { musicPoller } from '@/lib/services/music/MusicPoller';
// import { auth } from '@/lib/auth/server';
import { minimalAuth as auth } from "@/lib/auth/minimal-server";
import { MusicPollingType } from '@/lib/types/music';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, musicLinks } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // // Get session with headers
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Use a hardcoded user ID for testing (replace with your actual user ID from database)
    const defaultUserId = 'XMrgpabACyfUCkn6yZ9XoF0jFIuAf1PN';

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // In your existing /api/music/route.ts, update the stats action
    if (action === 'stats') {
      const albums = await db.select().from(musicAlbums)
        // .where(eq(musicAlbums.userId, session.user.id));
        .where(eq(musicAlbums.userId, defaultUserId));
      const tracks = await db.select().from(musicTracks).innerJoin(
        musicAlbums,
        eq(musicTracks.albumId, musicAlbums.id)
      // ).where(eq(musicAlbums.userId, session.user.id));
      ).where(eq(musicAlbums.userId, defaultUserId));

      const links = await db.select().from(musicLinks)
        // .where(eq(musicLinks.userId, session.user.id));
        .where(eq(musicLinks.userId, defaultUserId));

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
      where: eq(musicAlbums.userId, defaultUserId),
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'poll':
        if (data?.type === MusicPollingType.METADATA) {
          const result = await musicPoller.poll();
          return NextResponse.json(result);
        }
        break;

      case 'increment-play':
        if (data?.trackId) {
          await musicPoller.incrementPlayCount(data.trackId);
          return NextResponse.json({ success: true });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update sort order (for reordering)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orders } = body; // Expects [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }, ...]

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: 'Invalid orders array' }, { status: 400 });
    }

    // Update each album's sort order
    for (const item of orders) {
      // Verify ownership
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, item.id),
          eq(musicAlbums.userId, session.user.id)
        ),
      });

      if (album) {
        await db.update(musicAlbums)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(musicAlbums.id, item.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sort order:', error);
    return NextResponse.json({ error: 'Failed to update sort order' }, { status: 500 });
  }
}