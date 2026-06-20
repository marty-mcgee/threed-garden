import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get track with album info
    const track = await db.query.musicTracks.findFirst({
      where: eq(musicTracks.id, trackId),
      with: {
        album: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Verify ownership through album
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, track.albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album && !track.album?.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Increment play count
    await db.update(musicTracks)
      .set({ playCount: (track.playCount || 0) + 1 })
      .where(eq(musicTracks.id, trackId));

    // For testing without S3, return a sample audio URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && !process.env.S3_BUCKET_NAME) {
      // Return a sample MP3 for testing
      return NextResponse.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    }

    // If you have S3 configured, use it
    if (process.env.S3_BUCKET_NAME) {
      const { getStreamingUrl } = await import('@/lib/services/music/S3');
      const streamingUrl = await getStreamingUrl(track.publicUrl);
      return NextResponse.redirect(streamingUrl);
    }

    // Fallback: return a sample audio
    return NextResponse.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    
  } catch (error) {
    console.error('Error streaming track:', error);
    return NextResponse.json({ error: 'Failed to stream track' }, { status: 500 });
  }
}