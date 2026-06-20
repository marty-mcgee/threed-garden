import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicLinks, musicAlbumLinks, musicAlbums, musicTracks } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { MusicLinkType, MusicLinkStatus } from '@/lib/types/music';

// GET - Fetch links
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const linkId = searchParams.get('id');
    const linkType = searchParams.get('type') as MusicLinkType;
    const albumId = searchParams.get('albumId');
    const trackId = searchParams.get('trackId');
    const independent = searchParams.get('independent') === 'true';
    const status = searchParams.get('status') as MusicLinkStatus;

    // Get single link by ID
    if (linkId) {
      const link = await db.query.musicLinks.findFirst({
        where: and(
          eq(musicLinks.id, parseInt(linkId)),
          eq(musicLinks.userId, session.user.id)
        ),
        with: {
          musicAlbumLinks: {
            with: {
              album: true,
              track: true,
            },
          },
        },
      });

      if (!link) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }

      return NextResponse.json(link);
    }

    // Get links associated with album or track
    if (albumId || trackId) {
      const associations = await db.query.musicAlbumLinks.findMany({
        where: albumId 
          ? eq(musicAlbumLinks.albumId, parseInt(albumId))
          : trackId 
          ? eq(musicAlbumLinks.trackId, parseInt(trackId))
          : undefined,
        with: {
          link: true,
        },
      });
      return NextResponse.json(associations.map(a => a.link));
    }

    // Get all links for user
    const links = await db.query.musicLinks.findMany({
      where: and(
        eq(musicLinks.userId, session.user.id),
        status ? eq(musicLinks.status, status) : undefined,
        linkType ? eq(musicLinks.type, linkType) : undefined
      ),
      with: {
        musicAlbumLinks: {
          with: {
            album: true,
            track: true,
          },
        },
      },
      orderBy: (links, { asc }) => [asc(links.displayOrder)],
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// POST - Create new link
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      url, 
      type, 
      icon, 
      description, 
      albumId, 
      trackId, 
      displayOrder,
      metadata 
    } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Create the link
    const newLink = await db.insert(musicLinks).values({
      userId: session.user.id,
      title,
      url,
      type: type || MusicLinkType.EXTERNAL,
      icon: icon || null,
      description: description || null,
      status: MusicLinkStatus.ACTIVE,
      displayOrder: displayOrder || 0,
      metadata: metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const link = newLink[0];

    // Associate with album or track if specified
    if (albumId) {
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, parseInt(albumId)),
          eq(musicAlbums.userId, session.user.id)
        ),
      });

      if (album) {
        await db.insert(musicAlbumLinks).values({
          albumId: parseInt(albumId),
          linkId: link.id,
          linkType: 'album',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else if (trackId) {
      const track = await db.query.musicTracks.findFirst({
        where: eq(musicTracks.id, parseInt(trackId)),
        with: { album: true },
      });

      if (track && track.album?.userId === session.user.id) {
        await db.insert(musicAlbumLinks).values({
          trackId: parseInt(trackId),
          linkId: link.id,
          linkType: 'track',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

// PUT - Update link
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      title, 
      url, 
      type, 
      icon, 
      description, 
      status, 
      displayOrder, 
      metadata,
      albumId,
      trackId
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingLink = await db.query.musicLinks.findFirst({
      where: and(
        eq(musicLinks.id, parseInt(id)),
        eq(musicLinks.userId, session.user.id)
      ),
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Update the link
    const updatedLink = await db.update(musicLinks)
      .set({
        title: title !== undefined ? title : existingLink.title,
        url: url !== undefined ? url : existingLink.url,
        type: type || existingLink.type,
        icon: icon !== undefined ? icon : existingLink.icon,
        description: description !== undefined ? description : existingLink.description,
        status: status || existingLink.status,
        displayOrder: displayOrder !== undefined ? displayOrder : existingLink.displayOrder,
        metadata: metadata !== undefined ? metadata : existingLink.metadata,
        updatedAt: new Date(),
      })
      .where(eq(musicLinks.id, parseInt(id)))
      .returning();

    // Update association if albumId or trackId provided
    if (albumId !== undefined || trackId !== undefined) {
      // Remove existing associations
      await db.delete(musicAlbumLinks).where(eq(musicAlbumLinks.linkId, parseInt(id)));
      
      // Add new association
      if (albumId) {
        await db.insert(musicAlbumLinks).values({
          albumId: parseInt(albumId),
          linkId: parseInt(id),
          linkType: 'album',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (trackId) {
        await db.insert(musicAlbumLinks).values({
          trackId: parseInt(trackId),
          linkId: parseInt(id),
          linkType: 'track',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json(updatedLink[0]);
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

// DELETE - Delete link
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingLink = await db.query.musicLinks.findFirst({
      where: and(
        eq(musicLinks.id, parseInt(id)),
        eq(musicLinks.userId, session.user.id)
      ),
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Delete associations first
    await db.delete(musicAlbumLinks).where(eq(musicAlbumLinks.linkId, parseInt(id)));
    
    // Delete the link
    await db.delete(musicLinks).where(eq(musicLinks.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}