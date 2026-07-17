// app/api/music/albums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, music } from '@/lib/schema/music';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ✅ Helper function to ensure the sequence is in sync
async function ensureSequenceSync() {
  try {
    // Get the current max id in the table
    const [maxResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(id), 0)` })
      .from(musicAlbums);
    
    const maxId = maxResult?.maxId || 0;
    
    // Reset the sequence to max_id + 1
    await db.execute(sql`
      SELECT setval('music_albums_id_seq', ${maxId + 1})
    `);
    
    return maxId;
  } catch (error) {
    console.error('Error syncing sequence:', error);
    return 0;
  }
}

// ============================================
// GET /api/music/albums - List all albums for a Music module
// GET /api/music/albums?id=1 - Get a single album
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeTracks = searchParams.get('includeTracks') !== 'false';

    // ✅ Get single album (no musicId needed)
    if (id) {
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.id, parseInt(id)),
            eq(musicAlbums.userId, session.user.id)
          )
        )
        .limit(1);

      if (!album) {
        return NextResponse.json(
          { success: false, error: 'Album not found' },
          { status: 404 }
        );
      }

      const tracks = await db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.albumId, parseInt(id)))
        .orderBy(musicTracks.trackNumber);

      return NextResponse.json({
        success: true,
        data: {
          ...album,
          tracks,
        },
      });
    }

    // ✅ List all albums for the user (no musicId needed)
    let query = db
      .select()
      .from(musicAlbums)
      .where(eq(musicAlbums.userId, session.user.id));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(musicAlbums)
      .where(eq(musicAlbums.userId, session.user.id));

    const albums = await query
      .orderBy(desc(musicAlbums.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: albums,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Music albums API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/albums - Create a new album
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, artist, coverArt, releaseYear, description, status, isPublic, sortOrder, tracks } = body;

    if (!title || !artist) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, artist' },
        { status: 400 }
      );
    }

    // ✅ Ensure the sequence is in sync before inserting
    // await ensureSequenceSync();
    await ensureTableSequence('music_albums');

    // ✅ Create album - only linked by userId, no musicId
    const [newAlbum] = await db
      .insert(musicAlbums)
      .values({
        userId: session.user.id,
        title,
        artist,
        coverArt: coverArt || '',
        releaseYear: releaseYear || new Date().getFullYear(),
        description: description || '',
        status: status || 'draft',
        isPublic: isPublic || false,
        sortOrder: sortOrder || 0,
      })
      .returning();

    // Add tracks if provided
    if (tracks && Array.isArray(tracks) && tracks.length > 0) {
      for (const track of tracks) {
        await db.insert(musicTracks).values({
          albumId: newAlbum.id,
          userId: session.user.id,
          title: track.title,
          duration: track.duration || 0,
          trackNumber: track.trackNumber || 0,
          publicUrl: track.publicUrl || '',
          status: track.status || 'active',
          playCount: 0,
        });
      }
    }

    return NextResponse.json({ success: true, data: newAlbum });
  } catch (error) {
    console.error('Music albums API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create album' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/albums?id=1 - Full update of an album
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing album ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, artist, coverArt, releaseYear, description, status, isPublic, sortOrder } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(musicAlbums)
      .set({
        title: title || existing.title,
        artist: artist || existing.artist,
        coverArt: coverArt !== undefined ? coverArt : existing.coverArt,
        releaseYear: releaseYear || existing.releaseYear,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Music albums API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/music/albums?id=1 - Partial update of an album
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing album ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, artist, coverArt, releaseYear, description, status, isPublic, sortOrder } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (artist !== undefined) updateData.artist = artist;
    if (coverArt !== undefined) updateData.coverArt = coverArt;
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updated] = await db
      .update(musicAlbums)
      .set(updateData)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Music albums API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/albums?id=1 - Delete an album
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing album ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    // Delete tracks first (cascade will handle this if set)
    await db
      .delete(musicTracks)
      .where(eq(musicTracks.albumId, parseInt(id)));

    const [deleted] = await db
      .delete(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Music albums API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}