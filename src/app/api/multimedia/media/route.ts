import { ownsFileReference, positiveId } from '@/libraries/services/multimedia/access';
// app/api/multimedia/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db, type Transaction } from '@/libraries/db/client';
import { multimediaAlbums, multimediaMedia } from '@/libraries/schema/multimedia';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { ensureTableSequence } from '@/libraries/db/sequence';

// Serialize all primary writers on their owned Album rows before locking Media.
// Sorting both parent IDs also gives opposite-direction moves the same lock order.
async function lockMediaAlbums(tx: Transaction, userId: string, ids: number[]) {
  const uniqueIds = [...new Set(ids)].sort((a, b) => a - b);
  const rows = await tx.select({ id: multimediaAlbums.id }).from(multimediaAlbums)
    .where(and(inArray(multimediaAlbums.id, uniqueIds), eq(multimediaAlbums.userId, userId)))
    .orderBy(asc(multimediaAlbums.id)).for('update');
  return rows.length === uniqueIds.length;
}

type MediaChanges = Partial<Pick<typeof multimediaMedia.$inferInsert,
  'fileName' | 'fileUrl' | 'fileType' | 'fileSize' | 'isPrimary' | 'albumId'>>;

async function updateOwnedMedia(userId: string, id: number, changes: MediaChanges) {
  if (changes.isPrimary !== undefined && typeof changes.isPrimary !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Primary Media must be true or false' }, { status: 400 });
  }
  const targetId = changes.albumId === undefined ? undefined : positiveId(changes.albumId);
  if (targetId === null) return NextResponse.json({ success: false, error: 'Invalid album ID' }, { status: 400 });
  const [snapshot] = await db.select().from(multimediaMedia)
    .where(and(eq(multimediaMedia.id, id), eq(multimediaMedia.userId, userId))).limit(1);
  if (!snapshot) return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });

  return db.transaction(async (tx) => {
    if (!await lockMediaAlbums(tx, userId, [snapshot.albumId, targetId ?? snapshot.albumId])) {
      return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
    }
    const [existing] = await tx.select().from(multimediaMedia)
      .where(and(eq(multimediaMedia.id, id), eq(multimediaMedia.userId, userId)))
      .limit(1).for('update');
    if (!existing) return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
    if (existing.albumId !== snapshot.albumId) {
      return NextResponse.json({ success: false, error: 'This Media moved to another Album. Reload before saving.' }, { status: 409 });
    }
    const albumId = targetId ?? existing.albumId;
    const isPrimary = changes.isPrimary === undefined ? existing.isPrimary : changes.isPrimary;
    if (isPrimary && (changes.isPrimary === true || albumId !== existing.albumId)) {
      await tx.update(multimediaMedia).set({ isPrimary: false })
        .where(and(eq(multimediaMedia.albumId, albumId), eq(multimediaMedia.userId, userId), eq(multimediaMedia.isPrimary, true)));
    }
    const [updated] = await tx.update(multimediaMedia).set({
      fileName: changes.fileName || existing.fileName,
      fileUrl: changes.fileUrl || existing.fileUrl,
      fileType: changes.fileType || existing.fileType,
      fileSize: changes.fileSize === undefined ? existing.fileSize : changes.fileSize,
      isPrimary, albumId, updatedAt: new Date(),
    }).where(and(eq(multimediaMedia.id, id), eq(multimediaMedia.userId, userId))).returning();
    if (!updated) throw new Error('Media update did not return a record');
    return NextResponse.json({ success: true, data: updated, message: 'Media updated successfully' });
  });
}

// ============================================
// GET /api/multimedia/media
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
        .from(multimediaMedia)
        .where(
          and(
            eq(multimediaMedia.id, parsedId),
            eq(multimediaMedia.userId, userId)
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
        .from(multimediaMedia)
        .where(
          and(
            eq(multimediaMedia.albumId, parsedAlbumId),
            eq(multimediaMedia.userId, userId)
          )
        )
        .orderBy(desc(multimediaMedia.isPrimary), desc(multimediaMedia.createdAt));

      return NextResponse.json({
        success: true,
        data: media,
        count: media.length,
      });
    }

    // ✅ Get all media for the user
    const media = await db
      .select()
      .from(multimediaMedia)
      .where(eq(multimediaMedia.userId, userId))
      .orderBy(desc(multimediaMedia.createdAt));

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
// POST /api/multimedia/media - Create new media
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
    if (body?.fileUrl !== undefined && !ownsFileReference(session.user.id, body.fileUrl)) return NextResponse.json({ success: false, error: 'File reference is not owned by this User' }, { status: 400 });

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

    if (!albumId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: albumId' },
        { status: 400 }
      );
    }

    const parsedAlbumId = positiveId(albumId);
    if (!parsedAlbumId) {
      return NextResponse.json(
        { success: false, error: 'Invalid album ID' },
        { status: 400 }
      );
    }

    if (isPrimary !== undefined && typeof isPrimary !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Primary Media must be true or false' }, { status: 400 });
    }
    return await db.transaction(async (tx) => {
      if (!await lockMediaAlbums(tx, userId, [parsedAlbumId])) {
        return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
      }
      await ensureTableSequence('multimedia_media');

      // ✅ If this media is set as primary, unset other primary media for this album
      if (isPrimary) {
        await tx
          .update(multimediaMedia)
          .set({ isPrimary: false })
          .where(
            and(
              eq(multimediaMedia.albumId, parsedAlbumId),
              eq(multimediaMedia.userId, userId)
            )
          );
      }

      // ✅ Create the media
      const [newMedia] = await tx
        .insert(multimediaMedia)
        .values({
          userId,
          fileName,
          fileUrl,
          fileType,
          fileSize: fileSize || null,
          isPrimary: isPrimary ?? false,
          albumId: parsedAlbumId,
          metadata: {},
        })
        .returning();

      console.log('[Media] Created media:', newMedia.id, newMedia.fileName);

      return NextResponse.json({
        success: true,
        data: newMedia,
        message: 'Media created successfully',
      });
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
// PUT /api/multimedia/media - Update media
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
    if (body?.fileUrl !== undefined && !ownsFileReference(session.user.id, body.fileUrl)) return NextResponse.json({ success: false, error: 'File reference is not owned by this User' }, { status: 400 });
    const { fileName, fileUrl, fileType, fileSize, isPrimary, albumId } = body;
    return await updateOwnedMedia(userId, parsedId, { fileName, fileUrl, fileType, fileSize, isPrimary, albumId });
  } catch (error) {
    console.error('[Media] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/multimedia/media - Delete media
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
      .from(multimediaMedia)
      .where(
        and(
          eq(multimediaMedia.id, parsedId),
          eq(multimediaMedia.userId, userId)
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
      .delete(multimediaMedia)
      .where(
        and(
          eq(multimediaMedia.id, parsedId),
          eq(multimediaMedia.userId, userId)
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
// PATCH /api/multimedia/media/:id/primary - Set as primary
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
    const id = segments[segments.length - 2]; // /api/multimedia/media/:id/primary

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
    return await updateOwnedMedia(userId, parsedId, { isPrimary: true });
  } catch (error) {
    console.error('[Media] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update primary media' },
      { status: 500 }
    );
  }
}
