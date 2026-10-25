import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { lyricsId, LyricsInputError, parseLyricsInput } from '@/libraries/services/multimedia/lyrics-input';
import { lyricsService, LyricsNotFound } from '@/libraries/services/multimedia/lyrics-service';

const service = lyricsService(db);
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
function failure(error: unknown) {
  if (error instanceof LyricsNotFound) return reply({ success: false, error: 'Lyrics not found.' }, 404);
  if (error instanceof LyricsInputError || error instanceof SyntaxError) return reply({ success: false, error: error instanceof LyricsInputError ? error.message : 'Invalid JSON.' }, 400);
  return reply({ success: false, error: 'Lyrics are unavailable. Ensure the Lyrics schema is applied, then retry.' }, 503);
}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const params = request.nextUrl.searchParams;
    const options = params.get('options');
    if (options !== null) {
      const search = params.get('search') ?? '', rawOffset = params.get('offset') ?? '0';
      if (!['projects', 'albums', 'tracks'].includes(options) || search.length > 255 || !/^\d+$/.test(rawOffset) || Number(rawOffset) > 2147483647) throw new LyricsInputError('Invalid assignment search.');
      return reply({ success: true, ...await service.options(session.user.id, options, search, Number(rawOffset)) });
    }
    const trackId = params.get('trackId');
    if (trackId !== null) {
      const rawOffset = params.get('offset') ?? '0';
      if (!/^\d+$/.test(rawOffset) || Number(rawOffset) > 2147483647) throw new LyricsInputError('Invalid Lyrics page.');
      return reply({ success: true, ...await service.forTrack(session.user.id, lyricsId(trackId), Number(rawOffset)) });
    }
    return reply({ success: true, data: await service.get(session.user.id, lyricsId(params.get('id'))) });
  } catch (error) { return failure(error); }
}
async function write(request: NextRequest, update: boolean) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > 1_048_576) return reply({ success: false, error: 'Lyrics request is too large.' }, 413);
    const body: unknown = JSON.parse(raw);
    const input = parseLyricsInput(body);
    const id = update ? lyricsId((body as { id?: unknown }).id) : undefined;
    if (!update && (body as { id?: unknown }).id !== undefined) throw new LyricsInputError('A new Lyrics record cannot specify an ID.');
    return reply({ success: true, data: await service.save(session.user.id, input, id) }, update ? 200 : 201);
  } catch (error) { return failure(error); }
}
export const POST = (request: NextRequest) => write(request, false);
export const PUT = (request: NextRequest) => write(request, true);
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try { return reply({ success: true, data: await service.remove(session.user.id, lyricsId(request.nextUrl.searchParams.get('id'))) }); }
  catch (error) { return failure(error); }
}
