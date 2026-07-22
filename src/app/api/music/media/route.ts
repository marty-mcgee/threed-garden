// app/api/music/media/route.ts - Fixed

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicMedia, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/media - List media
// Query Parameters:
//   - albumId (optional): Filter media by album
//   - id (optional): Get a single media item
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

    // ✅ Get a single media item by ID
    if (id) {
      const [media] = await db
        .select()
        .from(musicMedia)
        .where(
          and(
            eq(musicMedia.id, parseInt(id)),
            eq(musicMedia.userId, userId)
          )
        )
        .limit(1);

      if (!media) {
        return NextResponse.json(
          { success: false, error: 'Media not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: media,
      });
    }

    // ✅ List media (optionally filtered by album)
    let query = db
      .select()
      .from(musicMedia)
      .where(eq(musicMedia.userId, userId));

    // ✅ albumId is optional - don't require it
    if (albumId) {
      query = query.where(eq(musicMedia.albumId, parseInt(albumId)));
    }

    const mediaList = await query.orderBy(desc(musicMedia.createdAt));

    return NextResponse.json({
      success: true,
      data: mediaList,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/media - Create new media
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
    console.log('📝 POST /api/music/media - Request body:', body);

    const { fileName, fileUrl, fileType, fileSize, isPrimary, albumId } = body;

    // ✅ Validate required fields
    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: fileName' },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: fileUrl' },
        { status: 400 }
      );
    }

    if (!fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: fileType' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ If albumId is provided, verify album exists
    if (albumId) {
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.id, albumId),
            eq(musicAlbums.userId, userId)
          )
        )
        .limit(1);

      if (!album) {
        return NextResponse.json(
          { success: false, error: 'Album not found' },
          { status: 404 }
        );
      }
    }

    await ensureTableSequence('music_media');

    // ✅ If this media is primary, unset any existing primary for this album
    if (isPrimary && albumId) {
      await db
        .update(musicMedia)
        .set({ isPrimary: false })
        .where(
          and(
            eq(musicMedia.albumId, albumId),
            eq(musicMedia.userId, userId)
          )
        );
    }

    const [newMedia] = await db
      .insert(musicMedia)
      .values({
        userId,
        albumId: albumId || null,
        fileName,
        fileUrl,
        fileType,
        fileSize: fileSize || null,
        isPrimary: isPrimary || false,
      })
      .returning();

    console.log('✅ Media created:', newMedia);

    return NextResponse.json({
      success: true,
      data: newMedia,
      message: 'Media created successfully',
    });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create media' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/media - Update media
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
    console.log('📝 PUT /api/music/media - Request body:', body);

    const { fileName, fileUrl, fileType, fileSize, isPrimary, albumId } = body;

    const userId = session.user.id;

    // ✅ Verify media exists
    const [existing] = await db
      .select()
      .from(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parseInt(id)),
          eq(musicMedia.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // ✅ If albumId is provided, verify album exists
    if (albumId) {
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.id, albumId),
            eq(musicAlbums.userId, userId)
          )
        )
        .limit(1);

      if (!album) {
        return NextResponse.json(
          { success: false, error: 'Album not found' },
          { status: 404 }
        );
      }
    }

    // ✅ If this media is primary, unset any existing primary for this album
    if (isPrimary && albumId) {
      await db
        .update(musicMedia)
        .set({ isPrimary: false })
        .where(
          and(
            eq(musicMedia.albumId, albumId),
            eq(musicMedia.userId, userId),
            eq(musicMedia.isPrimary, true)
          )
        );
    }

    const [updatedMedia] = await db
      .update(musicMedia)
      .set({
        fileName: fileName || existing.fileName,
        fileUrl: fileUrl || existing.fileUrl,
        fileType: fileType || existing.fileType,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
        albumId: albumId !== undefined ? albumId : existing.albumId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicMedia.id, parseInt(id)),
          eq(musicMedia.userId, userId)
        )
      )
      .returning();

    console.log('✅ Media updated:', updatedMedia);

    return NextResponse.json({
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully',
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/media - Delete media
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
      .delete(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parseInt(id)),
          eq(musicMedia.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}