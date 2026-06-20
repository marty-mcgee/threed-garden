// ./src/app/api/music/tracks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { TrackStatus } from '@/lib/types/music';

// GET - Fetch tracks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get('id');
    const albumId = searchParams.get('albumId');

    if (trackId) {
      // Get single track - public if album is public
      const track = await db.query.musicTracks.findFirst({
        where: eq(musicTracks.id, parseInt(trackId)),
        with: { album: true },
      });

      if (!track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      // Only return if album is public
      if (!track.album?.isPublic) {
        return NextResponse.json({ error: 'Track not available' }, { status: 403 });
      }

      return NextResponse.json(track);
    }

    if (albumId) {
      // Get tracks for album - only if album is public
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, parseInt(albumId)),
          eq(musicAlbums.isPublic, true)
        ),
      });

      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      const tracks = await db.query.musicTracks.findMany({
        where: eq(musicTracks.albumId, parseInt(albumId)),
        orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
      });

      return NextResponse.json(tracks);
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}

// POST - Create new track
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { albumId, title, duration, trackNumber, publicUrl, lyrics, metadata } = body;

    // Validate required fields
    if (!albumId || !title || !publicUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: albumId, title, and publicUrl are required' 
      }, { status: 400 });
    }

    // Verify album ownership
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found or unauthorized' }, { status: 404 });
    }

    const newTrack = await db.insert(musicTracks).values({
      albumId,
      title,
      duration: duration || null,
      trackNumber: trackNumber || null,
      publicUrl, // This is required!
      status: TrackStatus.ACTIVE,
      lyrics: lyrics || null,
      metadata: metadata || null,
      playCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newTrack[0], { status: 201 });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
  }
}

// PUT - Update track
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, duration, trackNumber, publicUrl, lyrics, status, metadata } = body;

    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    // Get track and verify ownership
    const existingTrack = await db.query.musicTracks.findFirst({
      where: eq(musicTracks.id, id),
      with: { album: true },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Verify album ownership
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, existingTrack.albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedTrack = await db.update(musicTracks)
      .set({
        title: title || existingTrack.title,
        duration: duration !== undefined ? duration : existingTrack.duration,
        trackNumber: trackNumber !== undefined ? trackNumber : existingTrack.trackNumber,
        publicUrl: publicUrl || existingTrack.publicUrl, // Update if provided
        lyrics: lyrics !== undefined ? lyrics : existingTrack.lyrics,
        status: status || existingTrack.status,
        metadata: metadata || existingTrack.metadata,
        updatedAt: new Date(),
      })
      .where(eq(musicTracks.id, id))
      .returning();

    return NextResponse.json(updatedTrack[0]);
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
  }
}

// DELETE - Delete track
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    // Get track and verify ownership
    const existingTrack = await db.query.musicTracks.findFirst({
      where: eq(musicTracks.id, parseInt(id)),
      with: { album: true },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Verify album ownership
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, existingTrack.albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(musicTracks).where(eq(musicTracks.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
  }
}