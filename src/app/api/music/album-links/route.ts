import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicAlbumLinks, musicAlbums, musicTracks, musicLinks } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET - Get associations for an album or track
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const albumId = searchParams.get('albumId');
    const trackId = searchParams.get('trackId');

    if (!albumId && !trackId) {
      return NextResponse.json({ error: 'Album ID or Track ID required' }, { status: 400 });
    }

    const associations = await db.query.musicAlbumLinks.findMany({
      where: albumId 
        ? eq(musicAlbumLinks.albumId, parseInt(albumId))
        : eq(musicAlbumLinks.trackId, parseInt(trackId!)),
      with: {
        link: true,
        album: true,
        track: true,
      },
    });

    return NextResponse.json(associations);
  } catch (error) {
    console.error('Error fetching associations:', error);
    return NextResponse.json({ error: 'Failed to fetch associations' }, { status: 500 });
  }
}

// POST - Create association (link album/track to link)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { albumId, trackId, linkId, linkType } = body;

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    }

    if (!albumId && !trackId) {
      return NextResponse.json({ error: 'Album ID or Track ID required' }, { status: 400 });
    }

    // Verify link ownership
    const link = await db.query.musicLinks.findFirst({
      where: and(
        eq(musicLinks.id, linkId),
        eq(musicLinks.userId, session.user.id)
      ),
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    // Verify album/track ownership if specified
    if (albumId) {
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, albumId),
          eq(musicAlbums.userId, session.user.id)
        ),
      });

      if (!album) {
        return NextResponse.json({ error: 'Album not found or unauthorized' }, { status: 404 });
      }
    }

    if (trackId) {
      const track = await db.query.musicTracks.findFirst({
        where: eq(musicTracks.id, trackId),
        with: { album: true },
      });

      if (!track || track.album?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Track not found or unauthorized' }, { status: 404 });
      }
    }

    // Check if association already exists
    const existingAssociation = await db.query.musicAlbumLinks.findFirst({
      where: and(
        albumId ? eq(musicAlbumLinks.albumId, albumId) : undefined,
        trackId ? eq(musicAlbumLinks.trackId, trackId) : undefined,
        eq(musicAlbumLinks.linkId, linkId)
      ),
    });

    if (existingAssociation) {
      return NextResponse.json({ error: 'Association already exists' }, { status: 409 });
    }

    const newAssociation = await db.insert(musicAlbumLinks).values({
      albumId: albumId || null,
      trackId: trackId || null,
      linkId,
      linkType: linkType || (albumId ? 'album' : 'track'),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newAssociation[0], { status: 201 });
  } catch (error) {
    console.error('Error creating association:', error);
    return NextResponse.json({ error: 'Failed to create association' }, { status: 500 });
  }
}

// DELETE - Remove association
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const associationId = searchParams.get('id');
    const albumId = searchParams.get('albumId');
    const trackId = searchParams.get('trackId');
    const linkId = searchParams.get('linkId');

    if (associationId) {
      // Delete by association ID
      const association = await db.query.musicAlbumLinks.findFirst({
        where: eq(musicAlbumLinks.id, parseInt(associationId)),
        with: {
          link: true,
          album: true,
          track: true,
        },
      });

      if (!association) {
        return NextResponse.json({ error: 'Association not found' }, { status: 404 });
      }

      // Verify ownership through link or album
      if (association.link?.userId !== session.user.id &&
          association.album?.userId !== session.user.id &&
          association.track?.album?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await db.delete(musicAlbumLinks).where(eq(musicAlbumLinks.id, parseInt(associationId)));
    } else if (albumId && linkId) {
      // Delete by album and link IDs
      await db.delete(musicAlbumLinks).where(
        and(
          eq(musicAlbumLinks.albumId, parseInt(albumId)),
          eq(musicAlbumLinks.linkId, parseInt(linkId))
        )
      );
    } else if (trackId && linkId) {
      // Delete by track and link IDs
      await db.delete(musicAlbumLinks).where(
        and(
          eq(musicAlbumLinks.trackId, parseInt(trackId)),
          eq(musicAlbumLinks.linkId, parseInt(linkId))
        )
      );
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Association removed successfully' });
  } catch (error) {
    console.error('Error deleting association:', error);
    return NextResponse.json({ error: 'Failed to delete association' }, { status: 500 });
  }
}