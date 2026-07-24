// app/api/music/links/route.ts - COMPLETE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicLinks, musicAlbumLinks, musicAlbums, music } from '@/lib/schema/music';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/links - List links (PUBLIC)
// Query Parameters:
//   - albumId (optional): Filter links by album
//   - id (optional): Get a single link
//   - musicId (optional): Filter by music module
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const albumId = searchParams.get('albumId');
    const musicId = searchParams.get('musicId');

    // Get a single link by ID
    if (id) {
      let query = db
        .select()
        .from(musicLinks)
        .where(eq(musicLinks.id, parseInt(id)));

      // ✅ If no user, only show active links
      if (!userId) {
        query = query.where(eq(musicLinks.status, 'active'));
      }

      const [link] = await query.limit(1);

      if (!link) {
        return NextResponse.json(
          { success: false, error: 'Link not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: link,
      });
    }

    // List links by album
    if (albumId) {
      let query = db
        .select()
        .from(musicLinks)
        .innerJoin(
          musicAlbumLinks,
          eq(musicAlbumLinks.linkId, musicLinks.id)
        )
        .where(eq(musicAlbumLinks.albumId, parseInt(albumId)));

      // ✅ If no user, only show active links
      if (!userId) {
        query = query.where(eq(musicLinks.status, 'active'));
      }

      const results = await query;
      const links = results.map((row) => row.musicLinks);

      // ✅ If no user, verify the album is public
      if (!userId) {
        const [album] = await db
          .select()
          .from(musicAlbums)
          .where(
            and(
              eq(musicAlbums.id, parseInt(albumId)),
              eq(musicAlbums.isPublic, true),
              eq(musicAlbums.status, 'published')
            )
          )
          .limit(1);

        if (!album) {
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: links,
      });
    }

    // ✅ Build base query with user filtering
    let query = db
      .select()
      .from(musicLinks)
      .$dynamic();

    // ✅ If authenticated user, show their links + public links
    if (userId) {
      query = query.where(
        or(
          eq(musicLinks.userId, userId),
          eq(musicLinks.status, 'active')
        )
      );
    } else {
      // ✅ If no user, only show active links
      query = query.where(eq(musicLinks.status, 'active'));
    }

    // ✅ Filter by music module if provided
    if (musicId) {
      // Join with music module table if needed
      query = query.where(eq(musicLinks.musicId, parseInt(musicId)));
    }

    const links = await query.orderBy(desc(musicLinks.createdAt));

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/links - Create a link (ADMIN ONLY)
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

    const body = await request.json();
    console.log('📝 POST /api/music/links - Request body:', body);

    const { 
      title, 
      url, 
      type, 
      icon, 
      description, 
      status, 
      displayOrder,
      musicId  // ✅ Include music module reference
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

    const userId = session.user.id;

    // ✅ Verify music module exists if provided
    if (musicId) {
      const [module] = await db
        .select()
        .from(music)
        .where(
          and(
            eq(music.id, parseInt(musicId)),
            eq(music.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Music module not found' },
          { status: 404 }
        );
      }
    }

    await ensureTableSequence('music_links');

    const [newLink] = await db
      .insert(musicLinks)
      .values({
        userId,
        musicId: musicId || null,
        title,
        url,
        type: type || 'external',
        icon: icon || null,
        description: description || null,
        status: status || 'active',
        displayOrder: displayOrder || 0,
      })
      .returning();

    console.log('✅ Link created:', newLink);

    return NextResponse.json({
      success: true,
      data: newLink,
      message: 'Link created successfully',
    });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/links - Update a link (ADMIN ONLY)
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 PUT /api/music/links - Request body:', body);

    const { 
      title, 
      url, 
      type, 
      icon, 
      description, 
      status, 
      displayOrder,
      musicId
    } = body;

    const userId = session.user.id;

    // ✅ Verify link exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicLinks)
      .where(
        and(
          eq(musicLinks.id, parseInt(id)),
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

    // ✅ Verify music module exists if provided
    if (musicId) {
      const [module] = await db
        .select()
        .from(music)
        .where(
          and(
            eq(music.id, parseInt(musicId)),
            eq(music.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Music module not found' },
          { status: 404 }
        );
      }
    }

    const [updatedLink] = await db
      .update(musicLinks)
      .set({
        title: title || existing.title,
        url: url || existing.url,
        type: type || existing.type,
        icon: icon !== undefined ? icon : existing.icon,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        musicId: musicId !== undefined ? musicId : existing.musicId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicLinks.id, parseInt(id)),
          eq(musicLinks.userId, userId)
        )
      )
      .returning();

    console.log('✅ Link updated:', updatedLink);

    return NextResponse.json({
      success: true,
      data: updatedLink,
      message: 'Link updated successfully',
    });
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/links - Delete a link (ADMIN ONLY)
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const [deleted] = await db
      .delete(musicLinks)
      .where(
        and(
          eq(musicLinks.id, parseInt(id)),
          eq(musicLinks.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Link deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}