import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { multimediaSpeech as speech } from '@/lib/schema/multimedia';
import { and, eq, sql } from 'drizzle-orm';
import { parseSpeechDraft, positiveSpeechInteger } from '@/lib/services/multimedia/speech-draft';

type Context = { params: Promise<{ id: string }> };
async function identity(context: Context) {
  const raw = (await context.params).id;
  return /^\d+$/.test(raw) ? positiveSpeechInteger(Number(raw)) : null;
}
export async function GET(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = await identity(context);
  if (!id) return NextResponse.json({ error: 'Invalid Speech ID.' }, { status: 400 });
  try {
    const [data] = await db.select().from(speech).where(and(eq(speech.id, id), eq(speech.userId, session.user.id))).limit(1);
    return data ? NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store' } }) : NextResponse.json({ error: 'Speech not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Could not load Speech. Please retry.' }, { status: 503 });
  }
}
export async function PATCH(request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = await identity(context);
  if (!id) return NextResponse.json({ error: 'Invalid Speech ID.' }, { status: 400 });
  let changes;
  let revision: number;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || !positiveSpeechInteger(body.revision)) throw new Error('A valid draft revision is required.');
    revision = body.revision;
    if ('archived' in body) {
      if (typeof body.archived !== 'boolean' || Object.keys(body).some(key => !['revision', 'archived'].includes(key))) throw new Error('Archive must be a separate action.');
      changes = { archivedAt: body.archived ? new Date() : null };
    } else {
      changes = parseSpeechDraft(body);
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid draft.' }, { status: 400 });
  }
  const scope = and(eq(speech.id, id), eq(speech.userId, session.user.id));
  try {
    const [data] = await db.update(speech).set({ ...changes, revision: sql`${speech.revision} + 1`, updatedAt: new Date() }).where(and(scope, eq(speech.revision, revision))).returning();
    if (data) return NextResponse.json({ success: true, data });
    const [exists] = await db.select({ id: speech.id }).from(speech).where(scope).limit(1);
    return exists ? NextResponse.json({ error: 'Speech changed in another session. Reload the saved draft before trying again.' }, { status: 409 }) : NextResponse.json({ error: 'Speech not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Could not update Speech. Reload to check its saved state.' }, { status: 503 });
  }
}
