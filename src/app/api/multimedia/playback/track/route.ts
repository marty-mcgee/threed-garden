import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums as albums, multimediaTracks as tracks, multimediaPlaybackHistory as history } from '@/libraries/schema/multimedia';
import { canReadTrack, positiveId } from '@/libraries/services/multimedia/access';

const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const userId = session.user.id;
  try {
    const body = await request.json();
    const trackId = positiveId(body?.trackId), albumId = positiveId(body?.albumId);
    if (!trackId || !albumId || (body.playDuration !== undefined && (!Number.isSafeInteger(body.playDuration) || body.playDuration < 0)) ||
        (body.completed !== undefined && typeof body.completed !== 'boolean') ||
        (body.source !== undefined && (typeof body.source !== 'string' || body.source.length > 100))) {
      return NextResponse.json({ error: 'Invalid playback report' }, { status: 400, headers });
    }
    const saved = await db.transaction(async tx => {
      const [album] = await tx.select().from(albums).where(eq(albums.id, albumId)).for('share');
      const [track] = await tx.select().from(tracks).where(and(eq(tracks.id, trackId), eq(tracks.albumId, albumId))).for('update');
      if (!album || !track || !canReadTrack(userId, track, album)) return false;
      await tx.insert(history).values({ userId, trackId, albumId, playedAt: new Date(),
        playDuration: body.playDuration ?? null, completed: body.completed ?? false, source: body.source ?? 'multimedia_player' });
      await tx.update(tracks).set({ playCount: sql`coalesce(${tracks.playCount}, 0) + 1` }).where(eq(tracks.id, trackId));
      return true;
    });
    return NextResponse.json(saved ? { success: true } : { error: 'Track not found' }, { status: saved ? 200 : 404, headers });
  } catch {
    return NextResponse.json({ error: 'Unable to record playback' }, { status: 400, headers });
  }
}
