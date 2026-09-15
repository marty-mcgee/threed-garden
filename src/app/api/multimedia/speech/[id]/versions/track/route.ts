import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { multimediaSpeech as speech, multimediaSpeechVersions as versions } from '@/lib/schema/multimedia';
import { musicAlbums, musicTracks } from '@/lib/schema/music';
import { and, eq } from 'drizzle-orm';
import { positiveSpeechInteger } from '@/lib/services/multimedia/speech-draft';
import { ownsMediaKey } from '@/lib/services/music/upload-policy';

class Failure extends Error { constructor(message: string, readonly status: number) { super(message); } }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const raw = (await context.params).id;
    const id = /^\d+$/.test(raw) ? positiveSpeechInteger(Number(raw)) : null;
    const body = await request.json().catch(() => null);
    if (!id || !body || Object.keys(body).some(key => !['versionNumber', 'albumId', 'title'].includes(key)) || !positiveSpeechInteger(body.versionNumber) || !positiveSpeechInteger(body.albumId) || typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 255) throw new Failure('Choose a version, Album and Track title.', 400);
    const result = await db.transaction(async tx => {
      const [record] = await tx.select().from(speech).where(and(eq(speech.id, id), eq(speech.userId, userId))).for('update');
      if (!record) throw new Failure('Speech not found.', 404);
      const [version] = await tx.select().from(versions).where(and(eq(versions.speechId, id), eq(versions.versionNumber, body.versionNumber))).for('update');
      if (!version || version.status !== 'ready' || !version.storageKey || !ownsMediaKey(userId, version.storageKey) || !version.fileSize || !version.mimeType) throw new Failure('Choose a ready Speech version.', 409);
      if (version.trackId) {
        const [track] = await tx.select().from(musicTracks).where(and(eq(musicTracks.id, version.trackId), eq(musicTracks.userId, userId))).limit(1);
        if (!track) throw new Failure('Linked Track is unavailable. Refresh history.', 409);
        return { trackId: track.id, reused: true };
      }
      if (record.archivedAt) throw new Failure('Restore Speech before creating a Track.', 409);
      const [album] = await tx.select().from(musicAlbums).where(and(eq(musicAlbums.id, body.albumId), eq(musicAlbums.userId, userId))).for('share');
      if (!album) throw new Failure('Album not found.', 404);
      const [track] = await tx.insert(musicTracks).values({ userId, albumId: album.id, title: body.title.trim(), fileUrl: `/api/music/files?key=${encodeURIComponent(version.storageKey)}`, fileType: version.mimeType, fileSize: version.fileSize, status: 'active', lyrics: version.text, metadata: { source: 'fish-audio', speechId: id, speechVersionNumber: version.versionNumber, voiceId: version.voiceId, model: version.model } }).returning({ id: musicTracks.id });
      await tx.update(versions).set({ trackId: track.id }).where(eq(versions.id, version.id));
      return { trackId: track.id, reused: false };
    });
    return NextResponse.json({ success: true, ...result }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Failure ? error.message : 'Could not save Track. Retrying this version will reuse a Track already saved.' }, { status: error instanceof Failure ? error.status : 503 });
  }
}
