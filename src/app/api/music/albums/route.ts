import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks } from '@/lib/auth/schema';
import { eq, and } from 'drizzle-orm';
import { AlbumStatus } from '@/lib/types/music';

// GET - Fetch albums (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const albumId = searchParams.get('id');
    const status = searchParams.get('status') as AlbumStatus;
    const includeTracks = searchParams.get('includeTracks') === 'true';

    if (albumId) {
      // Get single album
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, parseInt(albumId)),
          eq(musicAlbums.userId, session.user.id)
        ),
        with: includeTracks ? {
          tracks: {
            orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
          },
          musicAlbumLinks: {
            with: { link: true },
          },
        } : undefined,
      });

      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      return NextResponse.json(album);
    }

    // Get all albums for user
    const albums = await db.query.musicAlbums.findMany({
      where: and(
        eq(musicAlbums.userId, session.user.id),
        status ? eq(musicAlbums.status, status) : undefined
      ),
      with: includeTracks ? {
        tracks: {
          orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
          limit: 5,
        },
      } : undefined,
      orderBy: (albums, { desc }) => [desc(albums.createdAt)],
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// POST - Create new album
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, artist, coverArt, releaseYear, description, status, isPublic, metadata } = body;

    // Validate required fields
    if (!title || !artist || !coverArt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newAlbum = await db.insert(musicAlbums).values({
      userId: session.user.id,
      title,
      artist,
      coverArt,
      releaseYear: releaseYear || null,
      description: description || null,
      status: status || AlbumStatus.DRAFT,
      isPublic: isPublic || false,
      metadata: metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newAlbum[0], { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}

// PUT - Update album
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, artist, coverArt, releaseYear, description, status, isPublic, metadata } = body;

    if (!id) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingAlbum = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, id),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!existingAlbum) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const updatedAlbum = await db.update(musicAlbums)
      .set({
        title: title || existingAlbum.title,
        artist: artist || existingAlbum.artist,
        coverArt: coverArt || existingAlbum.coverArt,
        releaseYear: releaseYear !== undefined ? releaseYear : existingAlbum.releaseYear,
        description: description !== undefined ? description : existingAlbum.description,
        status: status || existingAlbum.status,
        isPublic: isPublic !== undefined ? isPublic : existingAlbum.isPublic,
        metadata: metadata || existingAlbum.metadata,
        updatedAt: new Date(),
      })
      .where(eq(musicAlbums.id, id))
      .returning();

    return NextResponse.json(updatedAlbum[0]);
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// DELETE - Delete album
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingAlbum = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, parseInt(id)),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!existingAlbum) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    await db.delete(musicAlbums).where(eq(musicAlbums.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}