// app/api/music/links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicLinks } from '@/lib/schema/music';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/links
// Query Parameters:
//   - id (optional): Get a single link
//   - albumId (optional): Get links for a specific album
//   - trackId (optional): Get links for a specific track
//   - independent (optional): Get links not linked to any album or track
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const albumId = searchParams.get('albumId');
    const trackId = searchParams.get('trackId');
    const independent = searchParams.get('independent') === 'true';

    // ✅ Get a single link by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid link ID' },
          { status: 400 }
        );
      }

      const [link] = await db
        .select()
        .from(musicLinks)
        .where(
          and(
            eq(musicLinks.id, parsedId),
            eq(musicLinks.userId, userId)
          )
        )
        .limit(1);

      if (!link) {
        return NextResponse.json(
          { success: false, error: 'Link not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: link });
    }

    let parsedAlbumId: number | null = null;
    if (albumId) {
      parsedAlbumId = Number(albumId);
      if (!Number.isInteger(parsedAlbumId) || parsedAlbumId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid album ID' },
          { status: 400 }
        );
      }
    }

    let parsedTrackId: number | null = null;
    if (trackId) {
      parsedTrackId = Number(trackId);
      if (!Number.isInteger(parsedTrackId) || parsedTrackId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid track ID' },
          { status: 400 }
        );
      }
    }

    const linkScope = and(
      eq(musicLinks.userId, userId),
      parsedAlbumId ? eq(musicLinks.albumId, parsedAlbumId) : undefined,
      parsedTrackId ? eq(musicLinks.trackId, parsedTrackId) : undefined,
      independent
        ? and(
            sql`${musicLinks.albumId} IS NULL`,
            sql`${musicLinks.trackId} IS NULL`
          )
        : undefined
    );

    const query = db
      .select()
      .from(musicLinks)
      .where(linkScope);

    // ✅ Order by display order
    const links = await query.orderBy(
      desc(musicLinks.displayOrder),
      desc(musicLinks.createdAt)
    );

    return NextResponse.json({
      success: true,
      data: links,
      count: links.length,
    });
  } catch (error) {
    console.error('[Links] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/links - Create a new link
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      title,
      url,
      type,
      icon,
      description,
      status,
      displayOrder,
      albumId,
      trackId,
    } = body;

    // ✅ Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // ✅ Ensure sequence
    await ensureTableSequence('music_links');

    // ✅ Create the link
    const [newLink] = await db
      .insert(musicLinks)
      .values({
        userId,
        title,
        url,
        type: type || 'external',
        icon: icon || null,
        description: description || null,
        status: status || 'active',
        displayOrder: displayOrder || 0,
        albumId: albumId ? parseInt(albumId) : null,
        trackId: trackId ? parseInt(trackId) : null,
        metadata: {},
      })
      .returning();

    console.log('[Links] Created link:', newLink.id, newLink.title);

    return NextResponse.json({
      success: true,
      data: newLink,
      message: 'Link created successfully',
    });
  } catch (error) {
    console.error('[Links] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/links - Update a link
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing link ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, url, type, icon, description, status, displayOrder, albumId, trackId } = body;

    // ✅ Check if link exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicLinks)
      .where(
        and(
          eq(musicLinks.id, parsedId),
          eq(musicLinks.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    // ✅ Update the link
    const [updated] = await db
      .update(musicLinks)
      .set({
        title: title || existing.title,
        url: url || existing.url,
        type: type || existing.type,
        icon: icon !== undefined ? icon : existing.icon,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        albumId: albumId !== undefined ? (albumId ? parseInt(albumId) : null) : existing.albumId,
        trackId: trackId !== undefined ? (trackId ? parseInt(trackId) : null) : existing.trackId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicLinks.id, parsedId),
          eq(musicLinks.userId, userId)
        )
      )
      .returning();

    console.log('[Links] Updated link:', updated.id, updated.title);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Link updated successfully',
    });
  } catch (error) {
    console.error('[Links] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/links - Delete a link
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing link ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid link ID' },
        { status: 400 }
      );
    }

    // ✅ Check if link exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicLinks)
      .where(
        and(
          eq(musicLinks.id, parsedId),
          eq(musicLinks.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    // ✅ Delete the link
    const [deleted] = await db
      .delete(musicLinks)
      .where(
        and(
          eq(musicLinks.id, parsedId),
          eq(musicLinks.userId, userId)
        )
      )
      .returning();

    console.log('[Links] Deleted link:', deleted.id, deleted.title);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Link deleted successfully',
    });
  } catch (error) {
    console.error('[Links] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}
