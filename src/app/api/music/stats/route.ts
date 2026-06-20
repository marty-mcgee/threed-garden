import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Public stats - no authentication needed
    const albumStats = await db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
    }).from(musicAlbums).where(eq(musicAlbums.isPublic, true));

    const trackStats = await db.select({
      total: sql<number>`count(*)`,
      totalPlays: sql<number>`sum(play_count)`,
    }).from(musicTracks).innerJoin(
      musicAlbums,
      eq(musicTracks.albumId, musicAlbums.id)
    ).where(eq(musicAlbums.isPublic, true));

    return NextResponse.json({
      totalAlbums: Number(albumStats[0]?.total || 0),
      totalTracks: Number(trackStats[0]?.total || 0),
      totalPlays: Number(trackStats[0]?.totalPlays || 0),
      publishedAlbums: Number(albumStats[0]?.published || 0),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}