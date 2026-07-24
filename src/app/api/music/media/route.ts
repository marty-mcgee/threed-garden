// app/api/music/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicMedia, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/media - List media (PUBLIC)
// Query Parameters:
//   - albumId (optional): Filter media by album
//   - id (optional): Get a single media item
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const albumId = searchParams.get('albumId');

    // Get a single media item by ID
    if (id) {
      const [media] = await db
        .select()
        .from(musicMedia)
        .where(eq(musicMedia.id, parseInt(id)))
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

    // List media by album
    if (albumId) {
      let query = db
        .select()
        .from(musicMedia)
        .where(eq(musicMedia.albumId, parseInt(albumId)));

      const media = await query.orderBy(desc(musicMedia.createdAt));

      // Verify album is public if no user
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
        data: media,
      });
    }

    // List all media
    const media = await db
      .select()
      .from(musicMedia)
      .orderBy(desc(musicMedia.createdAt));

    return NextResponse.json({
      success: true,
      data: media,
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
// POST /api/music/media - Create media (ADMIN ONLY)
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
    const { albumId, fileName, fileUrl, fileType, fileSize, isPrimary } = body;

    if (!fileName || !fileUrl || !fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fileName, fileUrl, fileType' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify album belongs to user
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
// PUT /api/music/media - Update media (ADMIN ONLY)
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
    const { fileName, fileUrl, fileType, fileSize, isPrimary, albumId } = body;

    const userId = session.user.id;

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
// DELETE /api/music/media - Delete media (ADMIN ONLY)
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