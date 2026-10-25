import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libraries/db/client';
import { PublicLyricsAlbumNotFound, publicLyricsService } from '@/libraries/services/multimedia/public-lyrics';

const service = publicLyricsService(db);
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const search = request.nextUrl.searchParams;
    const rawOffset = search.get('offset') ?? '0';
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647 ||
        !/^\d+$/.test(rawOffset) || Number(rawOffset) > 2147483647 ||
        search.getAll('offset').length > 1 || [...search.keys()].some(key => key !== 'offset')) {
      return reply({ success: false, error: 'Invalid Album Lyrics request.' }, 400);
    }
    return reply({ success: true, ...await service.forAlbum(Number(id), Number(rawOffset)) });
  } catch (error) {
    if (error instanceof PublicLyricsAlbumNotFound) return reply({ success: false, error: 'Album not found.' }, 404);
    return reply({ success: false, error: 'Lyrics could not be loaded. Please try again.' }, 503);
  }
}
