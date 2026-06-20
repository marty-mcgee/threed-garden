import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { AlbumStatus } from '@/lib/types/music';

// GET - Fetch albums (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const albumId = searchParams.get('id');
    const includeTracks = searchParams.get('includeTracks') === 'true';

    if (albumId) {
      // Get single album - public access with links
      const album = await db.query.musicAlbums.findFirst({
        where: eq(musicAlbums.id, parseInt(albumId)),
        with: {
          tracks: {
            orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)],
          },
          musicAlbumLinks: {
            with: {
              link: true,
            },
          },
          media: {  // Add this - includes photos
            orderBy: (media, { asc }) => [asc(media.createdAt)],
          },
        },
      });

      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      // Transform the response to include links directly
      const albumWithLinks = {
        ...album,
        links: album.musicAlbumLinks
          ?.map(albumLink => albumLink.link)
          .filter(link => link?.status === 'active') || [],
        musicAlbumLinks: undefined, // Remove the raw relation data
      };

      return NextResponse.json(albumWithLinks);
    }

    // Get all public albums (no authentication needed)
    const albums = await db.query.musicAlbums.findMany({
      where: eq(musicAlbums.isPublic, true),
      with: includeTracks ? {
        tracks: {
          orderBy: (tracks, { asc }) => [asc(tracks.trackNumber)]
        },
      } : undefined,
      orderBy: (albums, { asc }) => [asc(albums.sortOrder)],
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
    // Get session with headers
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, artist, coverArt, releaseYear, description, status, isPublic, sortOrder, metadata } = body;

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
      sortOrder: sortOrder !== undefined ? sortOrder : 0,
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
    const { id, title, artist, coverArt, releaseYear, description, status, isPublic, metadata, sortOrder } = body;

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
        title: title !== undefined ? title : existingAlbum.title,
        artist: artist !== undefined ? artist : existingAlbum.artist,
        coverArt: coverArt !== undefined ? coverArt : existingAlbum.coverArt,
        releaseYear: releaseYear !== undefined ? releaseYear : existingAlbum.releaseYear,
        description: description !== undefined ? description : existingAlbum.description,
        status: status || existingAlbum.status,
        isPublic: isPublic !== undefined ? isPublic : existingAlbum.isPublic,
        sortOrder: sortOrder !== undefined ? sortOrder : existingAlbum.sortOrder,
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

// PATCH - Bulk update sort orders
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orders } = body; // Expects [{ id: 1, sortOrder: 0 }, ...]

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: 'Invalid orders array' }, { status: 400 });
    }

    // Update each album's sort order
    for (const item of orders) {
      // Verify ownership
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, item.id),
          eq(musicAlbums.userId, session.user.id)
        ),
      });

      if (album) {
        await db.update(musicAlbums)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(musicAlbums.id, item.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sort orders:', error);
    return NextResponse.json({ error: 'Failed to update sort orders' }, { status: 500 });
  }
}