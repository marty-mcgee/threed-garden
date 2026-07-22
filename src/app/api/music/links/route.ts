// app/api/music/links/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicLinks } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/links - List links
// Query Parameters:
//   - id (optional): Get a single link
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

    // ✅ Get a single link by ID
    if (id) {
      const [link] = await db
        .select()
        .from(musicLinks)
        .where(
          and(
            eq(musicLinks.id, parseInt(id)),
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

      return NextResponse.json({
        success: true,
        data: link,
      });
    }

    // ✅ List all links
    const links = await db
      .select()
      .from(musicLinks)
      .where(eq(musicLinks.userId, userId))
      .orderBy(desc(musicLinks.createdAt));

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

    const body = await request.json();
    console.log('📝 POST /api/music/links - Request body:', body);

    const { title, url, type, icon, description, status, displayOrder } = body;

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

    await ensureTableSequence('music_links');

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

    const { title, url, type, icon, description, status, displayOrder } = body;

    const userId = session.user.id;

    // ✅ Verify link exists
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