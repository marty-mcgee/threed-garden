import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks } from '@/libraries/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    // Await the params Promise to get the trackId
    const { trackId: trackIdParam } = await params;
    const trackId = parseInt(trackIdParam);
    
    // Validate trackId is a valid number
    if (isNaN(trackId)) {
      console.error('Invalid trackId:', trackIdParam);
      return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 });
    }

    // Get session to verify user
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the track and the album fields needed for access control.
    const [result] = await db
      .select({
        track: multimediaTracks,
        albumUserId: multimediaAlbums.userId,
        albumIsPublic: multimediaAlbums.isPublic,
      })
      .from(multimediaTracks)
      .leftJoin(multimediaAlbums, eq(multimediaTracks.albumId, multimediaAlbums.id))
      .where(eq(multimediaTracks.id, trackId))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const { track, albumUserId, albumIsPublic } = result;
    const isOwner = track.userId === session.user.id || albumUserId === session.user.id;
    if (!isOwner && !albumIsPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // New private Multimedia files resolve through their authenticated owner endpoint.
    if (track.fileUrl.startsWith('/api/multimedia/files?key=')) {
      return NextResponse.redirect(new URL(track.fileUrl, request.url), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    // Increment play count
    await db.update(multimediaTracks)
      .set({ playCount: (track.playCount || 0) + 1 })
      .where(eq(multimediaTracks.id, trackId));

    // For testing without S3, return a sample audio URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && !process.env.S3_BUCKET_NAME) {
      // Return a sample MP3 for testing
      return NextResponse.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    }

    // If you have S3 configured, use it
    if (process.env.S3_BUCKET_NAME) {
      const { getStreamingUrl } = await import('@/libraries/services/multimedia/S3');
      const streamingUrl = await getStreamingUrl(track.fileUrl);
      return NextResponse.redirect(streamingUrl);
    }

    // Fallback: return a sample audio
    return NextResponse.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    
  } catch (error) {
    console.error('Error streaming track:', error);
    return NextResponse.json({ error: 'Failed to stream track' }, { status: 500 });
  }
}
