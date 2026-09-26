import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaSpeech as speech } from '@/libraries/schema/multimedia';
import { and, eq, asc, desc, ilike, isNull, isNotNull, count } from 'drizzle-orm';
import { speechReadError } from '@/libraries/services/multimedia/speech-errors';
import { parseSpeechDraft } from '@/libraries/services/multimedia/speech-draft';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const limit = Number(params.get('limit') ?? 25);
  const offset = Number(params.get('offset') ?? 0);
  const search = (params.get('search') ?? '').trim();
  const archived = params.get('archived') ?? 'false';
  const fields = { title: speech.title, id: speech.id, acceptedVersionNumber: speech.acceptedVersionNumber, updatedAt: speech.updatedAt };
  const sort = params.get('sort') ?? 'updatedAt';
  const direction = params.get('direction') ?? 'desc';
  if (!Object.prototype.hasOwnProperty.call(fields, sort) || !['asc', 'desc'].includes(direction)) return NextResponse.json({ error: 'Invalid sort options.' }, { status: 400 });
  const order = direction === 'asc' ? asc(fields[sort as keyof typeof fields]) : desc(fields[sort as keyof typeof fields]);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647 || search.length > 255 || !['true', 'false'].includes(archived)) {
    return NextResponse.json({ error: 'Invalid list options.' }, { status: 400 });
  }
  const scope = and(eq(speech.userId, session.user.id), archived === 'true' ? isNotNull(speech.archivedAt) : isNull(speech.archivedAt), search ? ilike(speech.title, `%${search.replace(/[\\%_]/g, '\\$&')}%`) : undefined);
  try {
    const [data, totals] = await Promise.all([
      db.select({ id: speech.id, title: speech.title, revision: speech.revision, acceptedVersionNumber: speech.acceptedVersionNumber, archivedAt: speech.archivedAt, updatedAt: speech.updatedAt }).from(speech).where(scope).orderBy(order, desc(speech.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(speech).where(scope),
    ]);
    return NextResponse.json({ success: true, data, pagination: { limit, offset, total: totals[0].total } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json(speechReadError(error), { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let draft;
  try {
    const body = await request.json();
    draft = parseSpeechDraft(body);
    if ('revision' in body || 'archived' in body) throw new Error('New Speech must start as an active draft.');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid draft.' }, { status: 400 });
  }
  try {
    const [data] = await db.insert(speech).values({ ...draft, userId: session.user.id }).returning();
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save Speech. Please check the list before retrying.' }, { status: 503 });
  }
}
