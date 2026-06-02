import { NextRequest, NextResponse } from 'next/server';
import { musicPoller } from '@/lib/services/music/MusicPoller';
import { getSession } from '@/lib/auth/server';
import { MusicPollingType } from '@/lib/types/music';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, musicLinks } from '@/lib/auth/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await musicPoller.getStats(session.user.id);
        return NextResponse.json(stats);
      
      case 'polling-status':
        const status = musicPoller.getPollingStatus();
        return NextResponse.json(status);
      
      default:
        // Get user's music data
        const albums = await db.query.musicAlbums.findMany({
          where: eq(musicAlbums.userId, session.user.id),
          with: {
            tracks: {
              orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
              limit: 5,
            },
          },
        });
        return NextResponse.json(albums);
    }
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
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