import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicPlaybackHistory } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, albumId, playDuration, completed, source } = body;

    await db.insert(musicPlaybackHistory).values({
      userId: session.user.id,
      trackId,
      albumId,
      playedAt: new Date(),
      playDuration: playDuration || null,
      completed: completed || false,
      source: source || 'music_player',
    });

    // Also increment track play count
    await db.execute(
      sql`UPDATE music_tracks SET play_count = play_count + 1 WHERE id = ${trackId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking playback:', error);
    return NextResponse.json({ error: 'Failed to track playback' }, { status: 500 });
  }
}
