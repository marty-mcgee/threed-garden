import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { musicMedia, musicAlbums } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET - Fetch media for an album
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const albumId = searchParams.get('albumId');
    const mediaId = searchParams.get('id');

    if (mediaId) {
      const media = await db.query.musicMedia.findFirst({
        where: eq(musicMedia.id, parseInt(mediaId)),
        with: { album: true },
      });

      if (!media) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      }

      // Verify ownership through album
      const album = await db.query.musicAlbums.findFirst({
        where: and(
          eq(musicAlbums.id, media.albumId),
          eq(musicAlbums.userId, session.user.id)
        ),
      });

      if (!album) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json(media);
    }

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    // Verify album ownership
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, parseInt(albumId)),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const media = await db.query.musicMedia.findMany({
      where: eq(musicMedia.albumId, parseInt(albumId)),
      orderBy: (media, { desc }) => [desc(media.isPrimary), desc(media.createdAt)],
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// POST - Create media (with file upload)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const albumId = formData.get('albumId') as string;
    const isPrimary = formData.get('isPrimary') === 'true';
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    // Verify album ownership
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, parseInt(albumId)),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found or unauthorized' }, { status: 404 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // If this is primary, unset other primary media for this album
    if (isPrimary) {
      await db.update(musicMedia)
        .set({ isPrimary: false })
        .where(eq(musicMedia.albumId, parseInt(albumId)));
    }

    // Here you would upload to Vercel Blob or S3
    // For now, we'll use a placeholder - you'll need to implement actual upload
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileUrl = `/uploads/${albumId}/${timestamp}.${extension}`; // Placeholder

    const newMedia = await db.insert(musicMedia).values({
      albumId: parseInt(albumId),
      fileName: file.name,
      fileUrl: fileUrl,
      fileType: file.type,
      fileSize: file.size,
      isPrimary: isPrimary,
      metadata: metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newMedia[0], { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
  }
}

// PUT - Update media
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, fileName, fileUrl, fileType, fileSize, isPrimary, metadata } = body;

    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    // Get existing media
    const existingMedia = await db.query.musicMedia.findFirst({
      where: eq(musicMedia.id, id),
      with: { album: true },
    });

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Verify ownership through album
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, existingMedia.albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If setting as primary, unset other primary media for this album
    if (isPrimary && !existingMedia.isPrimary) {
      await db.update(musicMedia)
        .set({ isPrimary: false })
        .where(eq(musicMedia.albumId, existingMedia.albumId));
    }

    const updatedMedia = await db.update(musicMedia)
      .set({
        fileName: fileName || existingMedia.fileName,
        fileUrl: fileUrl || existingMedia.fileUrl,
        fileType: fileType || existingMedia.fileType,
        fileSize: fileSize !== undefined ? fileSize : existingMedia.fileSize,
        isPrimary: isPrimary !== undefined ? isPrimary : existingMedia.isPrimary,
        metadata: metadata || existingMedia.metadata,
        updatedAt: new Date(),
      })
      .where(eq(musicMedia.id, id))
      .returning();

    return NextResponse.json(updatedMedia[0]);
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

// DELETE - Delete media
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    // Get existing media
    const existingMedia = await db.query.musicMedia.findFirst({
      where: eq(musicMedia.id, parseInt(id)),
      with: { album: true },
    });

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Verify ownership through album
    const album = await db.query.musicAlbums.findFirst({
      where: and(
        eq(musicAlbums.id, existingMedia.albumId),
        eq(musicAlbums.userId, session.user.id)
      ),
    });

    if (!album) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(musicMedia).where(eq(musicMedia.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}