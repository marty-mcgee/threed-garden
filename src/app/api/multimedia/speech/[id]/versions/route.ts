import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { multimediaSpeech as speech, multimediaSpeechVersions as versions } from '@/lib/schema/multimedia';
import { and, eq, desc, inArray, sql } from 'drizzle-orm';
import { positiveSpeechInteger } from '@/lib/services/multimedia/speech-draft';
import { ownerPrefix } from '@/lib/services/music/upload-policy';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { POST as generatePreview } from '@/app/api/music/audio/generate/route';

export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };
type Context = { params: Promise<{ id: string }> };
class RequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function owner(context: Context) {
  const session = await auth();
  if (!session?.user?.id) throw new RequestError('Unauthorized', 401);
  const raw = (await context.params).id;
  const id = /^\d+$/.test(raw) ? positiveSpeechInteger(Number(raw)) : null;
  if (!id) throw new RequestError('Invalid Speech ID.', 400);
  return { id, userId: session.user.id };
}
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof RequestError ? error.message : 'Speech history is unavailable. Refresh to check its saved state.' }, { status: error instanceof RequestError ? error.status : 503, headers });
}
const summary = {
  id: versions.id, versionNumber: versions.versionNumber, draftRevision: versions.draftRevision,
  status: versions.status, fileName: versions.fileName, storageKey: versions.storageKey,
  createdAt: versions.createdAt, completedAt: versions.completedAt, errorCode: versions.errorCode,
  providerStatus: versions.providerStatus,
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id, userId } = await owner(context);
    const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647) throw new RequestError('Invalid history page.', 400);
    const [record] = await db.select().from(speech).where(and(eq(speech.id, id), eq(speech.userId, userId))).limit(1);
    if (!record) throw new RequestError('Speech not found.', 404);
    const data = await db.select(summary).from(versions).where(eq(versions.speechId, id)).orderBy(desc(versions.versionNumber)).limit(26).offset(offset);
    return NextResponse.json({ data: data.slice(0, 25), hasMore: data.length > 25, speech: { title: record.title, revision: record.revision, archivedAt: record.archivedAt, acceptedVersionNumber: record.acceptedVersionNumber } }, { headers });
  } catch (error) { return failure(error); }
}

/** Explicit acceptance is revision checked and never writes a version's snapshot/output. */
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id, userId } = await owner(context);
    const body = await request.json().catch(() => null);
    if (!body || Object.keys(body).some(key => !['revision', 'versionNumber'].includes(key)) || !positiveSpeechInteger(body.revision) || !positiveSpeechInteger(body.versionNumber)) throw new RequestError('Choose a saved version and current draft revision.', 400);
    const data = await db.transaction(async tx => {
      const [record] = await tx.select().from(speech).where(and(eq(speech.id, id), eq(speech.userId, userId))).for('update');
      if (!record) throw new RequestError('Speech not found.', 404);
      if (record.revision !== body.revision) throw new RequestError('Speech changed. Refresh history before accepting a version.', 409);
      if (record.archivedAt) throw new RequestError('Restore this Speech before accepting a version.', 409);
      const [version] = await tx.select().from(versions).where(and(eq(versions.speechId, id), eq(versions.versionNumber, body.versionNumber), eq(versions.status, 'ready'))).limit(1);
      if (!version) throw new RequestError('Only a ready version of this Speech can be accepted.', 409);
      const [updated] = await tx.update(speech).set({ acceptedVersionNumber: version.versionNumber, revision: sql`${speech.revision} + 1`, updatedAt: new Date() }).where(eq(speech.id, id)).returning();
      return updated;
    });
    return NextResponse.json({ success: true, data }, { headers });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id, userId } = await owner(context);
    const body = await request.json().catch(() => null);
    if (!body || Object.keys(body).some(key => !['revision', 'requestId'].includes(key)) || !positiveSpeechInteger(body.revision) || typeof body.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId)) throw new RequestError('A draft revision and unique generation request are required.', 400);
    // Reserve before external I/O. A repeated request only returns its recorded attempt.
    const reservation = await db.transaction(async tx => {
      const [record] = await tx.select().from(speech).where(and(eq(speech.id, id), eq(speech.userId, userId))).for('update');
      if (!record) throw new RequestError('Speech not found.', 404);
      const [existing] = await tx.select().from(versions).where(and(eq(versions.speechId, id), eq(versions.requestId, body.requestId))).limit(1);
      if (existing) return { version: existing, fresh: false };
      if (record.archivedAt) throw new RequestError('Restore this Speech before generating.', 409);
      if (record.revision !== body.revision) throw new RequestError('Speech changed. Refresh before generating.', 409);
      if (!record.text.trim() || record.text.length > 2000 || !record.voiceId || !/^[a-f0-9]{32}$/i.test(record.voiceId)) throw new RequestError('Save speech text and a valid voice ID first.', 400);
      if (record.provider !== 'fish-audio' || record.model !== 's2.1-pro-free' || Object.keys(record.settings).length) throw new RequestError('This draft uses unsupported generation settings.', 400);
      if (!process.env.FISH_AUDIO_API_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) throw new RequestError('Speech generation or storage is not configured.', 503);
      const inflight = await tx.select().from(versions).where(and(eq(versions.speechId, id), inArray(versions.status, ['pending', 'generating'])));
      for (const attempt of inflight) {
        if (Date.now() - attempt.createdAt.getTime() < 10 * 60 * 1000) throw new RequestError('A generation is already running. Refresh history shortly.', 409);
        // A server request has a 60-second ceiling; unknown older attempts are never replayed.
        await tx.update(versions).set({ status: 'interrupted', errorCode: 'INTERRUPTED', completedAt: new Date() }).where(eq(versions.id, attempt.id));
      }
      const [last] = await tx.select({ number: versions.versionNumber }).from(versions).where(eq(versions.speechId, id)).orderBy(desc(versions.versionNumber)).limit(1);
      const versionNumber = (last?.number ?? 0) + 1;
      const fileName = `speech-${id}-v${versionNumber}.mp3`;
      const [version] = await tx.insert(versions).values({ speechId: id, versionNumber, requestId: body.requestId, draftRevision: record.revision, text: record.text, voiceId: record.voiceId, provider: record.provider, model: record.model, settings: record.settings, status: 'generating', storageKey: `${ownerPrefix(userId)}${body.requestId}/${fileName}`, fileName }).returning();
      return { version, fresh: true };
    });
    if (!reservation.fresh) return NextResponse.json({ data: reservation.version, reused: true }, { headers });
    const version = reservation.version;
    let phase = 'GENERATION_FAILED';
    let providerStatus: number | null = null;
    try {
      // Reuse the proven free-model request, limits and safe provider diagnostics.
      const response = await generatePreview(new NextRequest(request.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: version.text, voiceId: version.voiceId }), signal: request.signal }));
      if (!response.ok) {
        const detail = await response.json();
        providerStatus = typeof detail.providerStatus === 'number' ? detail.providerStatus : null;
        throw new Error('Generation failed');
      }
      const audio = Buffer.from(await response.arrayBuffer());
      phase = 'STORAGE_FAILED';
      const client = new S3Client({ region: process.env.AWS_REGION, requestChecksumCalculation: 'WHEN_REQUIRED' });
      const location = { Bucket: process.env.S3_BUCKET_NAME!, Key: version.storageKey! };
      await client.send(new PutObjectCommand({ ...location, Body: audio, ContentLength: audio.length, ContentType: 'audio/mpeg', ContentDisposition: 'inline' }), { abortSignal: AbortSignal.timeout(8000) });
      const stored = await client.send(new HeadObjectCommand(location), { abortSignal: AbortSignal.timeout(3000) });
      if (stored.ContentLength !== audio.length || stored.ContentType !== 'audio/mpeg') throw new Error('Storage verification failed');
      phase = 'REGISTRATION_FAILED';
      const [ready] = await db.update(versions).set({ status: 'ready', fileSize: audio.length, mimeType: 'audio/mpeg', completedAt: new Date() }).where(and(eq(versions.id, version.id), eq(versions.status, 'generating'))).returning();
      if (!ready) throw new Error('Attempt state changed');
      return NextResponse.json({ data: ready }, { status: 201, headers });
    } catch {
      // Keep the reserved key for diagnosis/recovery if S3 succeeded before DB failure.
      await db.update(versions).set({ status: 'failed', errorCode: phase, providerStatus, completedAt: new Date() }).where(and(eq(versions.id, version.id), eq(versions.status, 'generating')));
      return NextResponse.json({ error: `Version ${version.versionNumber} could not complete. Check its history before generating again.`, providerStatus }, { status: 502, headers });
    }
  } catch (error) { return failure(error); }
}
