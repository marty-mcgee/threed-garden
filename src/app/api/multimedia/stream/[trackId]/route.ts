import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks } from '@/libraries/schema/multimedia';
import { eq } from 'drizzle-orm';
import { canReadTrack, positiveId } from '@/libraries/services/multimedia/access';
import { ownsMediaKey } from '@/libraries/services/multimedia/upload-policy';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  const trackId = positiveId((await params).trackId);
  if (!trackId) return NextResponse.json({ error: 'Invalid Track ID' }, { status: 400, headers });
  try {
    const session = await auth();
    const [result] = await db.select({ track: multimediaTracks, album: multimediaAlbums }).from(multimediaTracks)
      .leftJoin(multimediaAlbums, eq(multimediaTracks.albumId, multimediaAlbums.id))
      .where(eq(multimediaTracks.id, trackId)).limit(1);
    if (!result || !canReadTrack(session?.user?.id, result.track, result.album)) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404, headers });
    }
    const { track } = result;
    if (track.fileUrl.startsWith('/api/multimedia/files?key=')) {
      const key = new URL(track.fileUrl, request.url).searchParams.get('key') || '';
      if (!track.userId || !ownsMediaKey(track.userId, key)) return NextResponse.json({ error: 'File not found' }, { status: 404, headers });
      return NextResponse.redirect(new URL(track.fileUrl, request.url), { headers });
    }
    if (/^https?:\/\//i.test(track.fileUrl)) return NextResponse.redirect(track.fileUrl, { headers });
    if (!process.env.S3_BUCKET_NAME || !track.fileUrl.startsWith(`albums/${track.albumId}/`) || !/^albums\/[a-zA-Z0-9/_ .-]+$/.test(track.fileUrl) || track.fileUrl.split('/').includes('..')) {
      return NextResponse.json({ error: 'File unavailable' }, { status: 404, headers });
    }
    const { getStreamingUrl } = await import('@/libraries/services/multimedia/S3');
    return NextResponse.redirect(await getStreamingUrl(track.fileUrl), { headers });
  } catch {
    return NextResponse.json({ error: 'Unable to stream Track' }, { status: 503, headers });
  }
}
