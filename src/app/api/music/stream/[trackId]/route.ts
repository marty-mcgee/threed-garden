import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks } from '@/lib/schema';
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

    const isOwner = track.userId === session.user.id || track.album?.userId === session.user.id;
    if (!isOwner && !track.album?.isPublic) {
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
