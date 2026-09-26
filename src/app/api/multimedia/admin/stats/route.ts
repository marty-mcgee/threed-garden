import { NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaLinks, multimediaPlaybackHistory } from '@/libraries/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get album stats
    const albumStats = await db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)`,
      archived: sql<number>`sum(case when status = 'archived' then 1 else 0 end)`,
    }).from(multimediaAlbums).where(eq(multimediaAlbums.userId, session.user.id));

    // Get track stats
    const trackStats = await db.select({
      total: sql<number>`count(*)`,
      totalPlays: sql<number>`sum(play_count)`,
      avgDuration: sql<number>`avg(duration)`,
    }).from(multimediaTracks).innerJoin(
      multimediaAlbums,
      eq(multimediaTracks.albumId, multimediaAlbums.id)
    ).where(eq(multimediaAlbums.userId, session.user.id));

    // Get link stats
    const linkStats = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when status = 'active' then 1 else 0 end)`,
    }).from(multimediaLinks).where(eq(multimediaLinks.userId, session.user.id));

    // Get recent activity (last 7 days)
    const recentActivity = await db.select({
      trackTitle: multimediaTracks.title,
      albumTitle: multimediaAlbums.title,
      playedAt: multimediaPlaybackHistory.playedAt,
      completed: multimediaPlaybackHistory.completed,
      playDuration: multimediaPlaybackHistory.playDuration,
    })
    .from(multimediaPlaybackHistory)
    .innerJoin(multimediaTracks, eq(multimediaPlaybackHistory.trackId, multimediaTracks.id))
    .innerJoin(multimediaAlbums, eq(multimediaPlaybackHistory.albumId, multimediaAlbums.id))
    .where(eq(multimediaPlaybackHistory.userId, session.user.id))
    .orderBy(desc(multimediaPlaybackHistory.playedAt))
    .limit(10);

    // Get top tracks (most played)
    const topTracks = await db.select({
      id: multimediaTracks.id,
      title: multimediaTracks.title,
      playCount: multimediaTracks.playCount,
      albumTitle: multimediaAlbums.title,
    })
    .from(multimediaTracks)
    .innerJoin(multimediaAlbums, eq(multimediaTracks.albumId, multimediaAlbums.id))
    .where(eq(multimediaAlbums.userId, session.user.id))
    .orderBy(desc(multimediaTracks.playCount))
    .limit(5);

    // Calculate total listening time (hours)
    const totalListeningTime = await db.select({
      totalSeconds: sql<number>`sum(play_duration)`,
    }).from(multimediaPlaybackHistory)
      .where(eq(multimediaPlaybackHistory.userId, session.user.id));

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
