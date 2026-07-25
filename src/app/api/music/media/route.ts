// app/api/music/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicMedia } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/media
// Query Parameters:
//   - id (optional): Get a single media item
//   - albumId (optional): Get media for a specific album
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
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid media ID' },
          { status: 400 }
        );
      }

      const [media] = await db
        .select()
        .from(musicMedia)
        .where(
          and(
            eq(musicMedia.id, parsedId),
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

      return NextResponse.json({ success: true, data: media });
    }

    // ✅ Get media for an album
    if (albumId) {
      const parsedAlbumId = parseInt(albumId);
      if (isNaN(parsedAlbumId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid album ID' },
          { status: 400 }
        );
      }

      const media = await db
        .select()
        .from(musicMedia)
        .where(
          and(
            eq(musicMedia.albumId, parsedAlbumId),
            eq(musicMedia.userId, userId)
          )
        )
        .orderBy(desc(musicMedia.isPrimary), desc(musicMedia.createdAt));

      return NextResponse.json({
        success: true,
        data: media,
        count: media.length,
      });
    }

    // ✅ Get all media for the user
    const media = await db
      .select()
      .from(musicMedia)
      .where(eq(musicMedia.userId, userId))
      .orderBy(desc(musicMedia.createdAt));

    return NextResponse.json({
      success: true,
      data: media,
      count: media.length,
    });
  } catch (error) {
    console.error('[Media] GET error:', error);
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

    const userId = session.user.id;
    const body = await request.json();

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

    // ✅ Ensure sequence
    await ensureTableSequence('music_media');

    // ✅ If this media is set as primary, unset other primary media for this album
    if (isPrimary && albumId) {
      await db
        .update(musicMedia)
        .set({ isPrimary: false })
        .where(
          and(
            eq(musicMedia.albumId, parseInt(albumId)),
            eq(musicMedia.userId, userId)
          )
        );
    }

    // ✅ Create the media
    const [newMedia] = await db
      .insert(musicMedia)
      .values({
        userId,
        fileName,
        fileUrl,
        fileType,
        fileSize: fileSize || null,
        isPrimary: isPrimary || false,
        albumId: albumId ? parseInt(albumId) : null,
        metadata: {},
      })
      .returning();

    console.log('[Media] Created media:', newMedia.id, newMedia.fileName);

    return NextResponse.json({
      success: true,
      data: newMedia,
      message: 'Media created successfully',
    });
  } catch (error) {
    console.error('[Media] POST error:', error);
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing media ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { fileName, fileUrl, fileType, fileSize, isPrimary, albumId } = body;

    // ✅ Check if media exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parsedId),
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

    // ✅ If this media is set as primary, unset other primary media for this album
    if (isPrimary && albumId) {
      await db
        .update(musicMedia)
        .set({ isPrimary: false })
        .where(
          and(
            eq(musicMedia.albumId, parseInt(albumId)),
            eq(musicMedia.userId, userId),
            eq(musicMedia.isPrimary, true)
          )
        );
    }

    // ✅ Update the media
    const [updated] = await db
      .update(musicMedia)
      .set({
        fileName: fileName || existing.fileName,
        fileUrl: fileUrl || existing.fileUrl,
        fileType: fileType || existing.fileType,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
        albumId: albumId !== undefined ? (albumId ? parseInt(albumId) : null) : existing.albumId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicMedia.id, parsedId),
          eq(musicMedia.userId, userId)
        )
      )
      .returning();

    console.log('[Media] Updated media:', updated.id, updated.fileName);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Media updated successfully',
    });
  } catch (error) {
    console.error('[Media] PUT error:', error);
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing media ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    // ✅ Check if media exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parsedId),
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

    // ✅ Delete the media
    const [deleted] = await db
      .delete(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parsedId),
          eq(musicMedia.userId, userId)
        )
      )
      .returning();

    console.log('[Media] Deleted media:', deleted.id, deleted.fileName);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('[Media] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/music/media/:id/primary - Set as primary
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    const id = segments[segments.length - 2]; // /api/music/media/:id/primary

    if (!id || id === 'media') {
      return NextResponse.json(
        { success: false, error: 'Missing media ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    // ✅ Check if media exists and belongs to user
    const [media] = await db
      .select()
      .from(musicMedia)
      .where(
        and(
          eq(musicMedia.id, parsedId),
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

    // ✅ If media doesn't have an album, can't set as primary
    if (!media.albumId) {
      return NextResponse.json(
        { success: false, error: 'Media must be linked to an album to be primary' },
        { status: 400 }
      );
    }

    // ✅ Unset all primary media for this album
    await db
      .update(musicMedia)
      .set({ isPrimary: false })
      .where(
        and(
          eq(musicMedia.albumId, media.albumId),
          eq(musicMedia.userId, userId),
          eq(musicMedia.isPrimary, true)
        )
      );

    // ✅ Set this media as primary
    const [updated] = await db
      .update(musicMedia)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(
        and(
          eq(musicMedia.id, parsedId),
          eq(musicMedia.userId, userId)
        )
      )
      .returning();

    console.log('[Media] Set primary media:', updated.id, updated.fileName);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Primary media updated successfully',
    });
  } catch (error) {
    console.error('[Media] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update primary media' },
      { status: 500 }
    );
  }
}