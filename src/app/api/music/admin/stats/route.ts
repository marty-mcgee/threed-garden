import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, musicLinks, musicPlaybackHistory } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // const session = await auth.api.getSession({ headers: request.headers });
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    const session = {
      user: {
        id: 'XMrgpabACyfUCkn6yZ9XoF0jFIuAf1PN',
      }
    }

    // Get album stats
    const albumStats = await db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)`,
      archived: sql<number>`sum(case when status = 'archived' then 1 else 0 end)`,
    }).from(musicAlbums).where(eq(musicAlbums.userId, session.user.id));

    // Get track stats
    const trackStats = await db.select({
      total: sql<number>`count(*)`,
      totalPlays: sql<number>`sum(play_count)`,
      avgDuration: sql<number>`avg(duration)`,
    }).from(musicTracks).innerJoin(
      musicAlbums,
      eq(musicTracks.albumId, musicAlbums.id)
    ).where(eq(musicAlbums.userId, session.user.id));

    // Get link stats
    const linkStats = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when status = 'active' then 1 else 0 end)`,
    }).from(musicLinks).where(eq(musicLinks.userId, session.user.id));

    // Get recent activity (last 7 days)
    const recentActivity = await db.select({
      trackTitle: musicTracks.title,
      albumTitle: musicAlbums.title,
      playedAt: musicPlaybackHistory.playedAt,
      completed: musicPlaybackHistory.completed,
      playDuration: musicPlaybackHistory.playDuration,
    })
    .from(musicPlaybackHistory)
    .innerJoin(musicTracks, eq(musicPlaybackHistory.trackId, musicTracks.id))
    .innerJoin(musicAlbums, eq(musicPlaybackHistory.albumId, musicAlbums.id))
    .where(eq(musicPlaybackHistory.userId, session.user.id))
    .orderBy(desc(musicPlaybackHistory.playedAt))
    .limit(10);

    // Get top tracks (most played)
    const topTracks = await db.select({
      id: musicTracks.id,
      title: musicTracks.title,
      playCount: musicTracks.playCount,
      albumTitle: musicAlbums.title,
    })
    .from(musicTracks)
    .innerJoin(musicAlbums, eq(musicTracks.albumId, musicAlbums.id))
    .where(eq(musicAlbums.userId, session.user.id))
    .orderBy(desc(musicTracks.playCount))
    .limit(5);

    // Calculate total listening time (hours)
    const totalListeningTime = await db.select({
      totalSeconds: sql<number>`sum(play_duration)`,
    }).from(musicPlaybackHistory)
      .where(eq(musicPlaybackHistory.userId, session.user.id));

    const listeningHours = Math.floor((totalListeningTime[0]?.totalSeconds || 0) / 3600);

    return NextResponse.json({
      albums: {
        total: albumStats[0]?.total || 0,
        published: albumStats[0]?.published || 0,
        draft: albumStats[0]?.draft || 0,
        archived: albumStats[0]?.archived || 0,
      },
      tracks: {
        total: trackStats[0]?.total || 0,
        totalPlays: trackStats[0]?.totalPlays || 0,
        avgDuration: Math.floor(trackStats[0]?.avgDuration || 0),
      },
      links: {
        total: linkStats[0]?.total || 0,
        active: linkStats[0]?.active || 0,
      },
      listeningHours,
      recentActivity,
      topTracks,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}