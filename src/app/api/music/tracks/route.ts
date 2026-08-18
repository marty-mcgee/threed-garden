// app/api/music/tracks/route.ts - WITH DEBUG LOGGING
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/tracks - List owner or public tracks
// Query Parameters:
//   - albumId (optional): Filter tracks by album
//   - id (optional): Get a single track
//   - scope (optional): owner (authenticated default) or public (anonymous default)
//   - limit (optional): Number of records to return (default: 100)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const albumId = searchParams.get('albumId');
    const requestedScope = searchParams.get('scope');

    if (requestedScope && requestedScope !== 'owner' && requestedScope !== 'public') {
      return NextResponse.json(
        { success: false, error: 'Invalid track scope' },
        { status: 400 }
      );
    }

    const scope = requestedScope || (userId ? 'owner' : 'public');
    if (scope === 'owner' && !userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const trackAccessCondition = scope === 'owner'
      ? eq(musicTracks.userId, userId!)
      : and(
          eq(musicTracks.status, 'active'),
          sql`EXISTS (
            SELECT 1
            FROM ${musicAlbums}
            WHERE ${musicAlbums.id} = ${musicTracks.albumId}
            AND ${musicAlbums.isPublic} = true
            AND ${musicAlbums.status} = 'published'
          )`
        );

    // ✅ DEBUG: Log everything
    // console.log('========================================');
    // console.log('🔍 GET /api/music/tracks');
    // console.log(`📝 albumId parameter: "${albumId}"`);
    // console.log(`📝 albumId type: ${typeof albumId}`);
    // console.log(`📝 userId: ${userId || 'anonymous'}`);
    // console.log(`📝 Full URL: ${request.url}`);
    // console.log('========================================');

    // Get a single track by ID
    if (id) {
      const parsedId = Number(id);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid track ID' },
          { status: 400 }
        );
      }

      const [track] = await db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.id, parsedId),
            trackAccessCondition
          )
        )
        .limit(1);

      if (!track) {
        return NextResponse.json(
          { success: false, error: 'Track not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: track,
      });
    }

    // ============================================
    // LIST TRACKS BY ALBUM
    // ============================================
    if (albumId) {
      console.log(`📀 Processing albumId: "${albumId}"`);
      
      const albumIdNum = Number(albumId);
      console.log(`📀 Parsed albumId: ${albumIdNum}`);

      if (!Number.isInteger(albumIdNum) || albumIdNum <= 0) {
        console.log(`❌ Invalid albumId: "${albumId}"`);
        return NextResponse.json({
          success: false,
          error: 'Invalid albumId',
        }, { status: 400 });
      }

      // ✅ Build query with albumId filter
      const tracks = await db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.albumId, albumIdNum),
            trackAccessCondition
          )
        )
        .orderBy(musicTracks.trackNumber);

      console.log(`✅ Found ${tracks.length} tracks for album ${albumIdNum}`);
      console.log(`📝 Track album IDs:`, tracks.map(t => `[${t.id}: albumId=${t.albumId}]`).join(', '));

      return NextResponse.json({
        success: true,
        data: tracks,
      });
    }

    // ============================================
    // List ALL tracks (no albumId)
    // ============================================
    console.log(`📚 Getting ALL tracks (no albumId)`);
    
    const allTracks = await db
      .select()
      .from(musicTracks)
      .where(trackAccessCondition)
      .orderBy(desc(musicTracks.createdAt));

    console.log(`📚 Found ${allTracks.length} total tracks`);

    return NextResponse.json({
      success: true,
      data: allTracks,
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/tracks - Create a new track (ADMIN ONLY)
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
    console.log('📝 POST /api/music/tracks - Request body:', body);

    const {
      albumId,
      title,
      duration,
      trackNumber,
      status,
      lyrics,
      fileSize,
      metadata,
    } = body;
    const { fileUrl, fileType = 'audio/mpeg' } = body;

    if (!title || !fileUrl || !albumId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, fileUrl, albumId' },
        { status: 400 }
      );
    }

    const parsedAlbumId = Number(albumId);
    if (!Number.isInteger(parsedAlbumId) || parsedAlbumId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid Album ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const [album] = await db
      .select()
      .from(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parsedAlbumId),
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

    await ensureTableSequence('music_tracks');

    const [newTrack] = await db
      .insert(musicTracks)
      .values({
        userId,
        albumId: parsedAlbumId,
        title,
        duration: duration || null,
        trackNumber: trackNumber || null,
        fileUrl,
        fileType,
        fileSize: fileSize || null,
        status: status || 'active',
        lyrics: lyrics || null,
        metadata: metadata || null,
      })
      .returning();

    console.log('✅ Track created:', newTrack);

    return NextResponse.json({
      success: true,
      data: newTrack,
      message: 'Track created successfully',
    });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create track' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/tracks - Update a track (ADMIN ONLY)
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

    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid Track ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 PUT /api/music/tracks - Request body:', body);

    const {
      title,
      duration,
      trackNumber,
      status,
      lyrics,
      albumId,
      fileSize,
      metadata,
    } = body;
    const { fileUrl, fileType } = body;

    const userId = session.user.id;

    const [existing] = await db
      .select()
      .from(musicTracks)
      .where(
        and(
          eq(musicTracks.id, parsedId),
          eq(musicTracks.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Track not found' },
        { status: 404 }
      );
    }

    let parsedAlbumId: number | undefined;
    if (albumId !== undefined) {
      const requestedAlbumId = Number(albumId);
      if (!Number.isInteger(requestedAlbumId) || requestedAlbumId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid Album ID' },
          { status: 400 }
        );
      }
      parsedAlbumId = requestedAlbumId;

      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.id, parsedAlbumId),
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

    const [updatedTrack] = await db
      .update(musicTracks)
      .set({
        title: title || existing.title,
        duration: duration !== undefined ? duration : existing.duration,
        trackNumber: trackNumber !== undefined ? trackNumber : existing.trackNumber,
        fileUrl: fileUrl || existing.fileUrl,
        fileType: fileType || existing.fileType,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        status: status || existing.status,
        lyrics: lyrics !== undefined ? lyrics : existing.lyrics,
        albumId: parsedAlbumId !== undefined ? parsedAlbumId : existing.albumId,
        metadata: metadata !== undefined ? metadata : existing.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicTracks.id, parsedId),
          eq(musicTracks.userId, userId)
        )
      )
      .returning();

    console.log('✅ Track updated:', updatedTrack);

    return NextResponse.json({
      success: true,
      data: updatedTrack,
      message: 'Track updated successfully',
    });
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update track' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/tracks - Delete a track (ADMIN ONLY)
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
      .delete(musicTracks)
      .where(
        and(
          eq(musicTracks.id, parseInt(id)),
          eq(musicTracks.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Track not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Track deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete track' },
      { status: 500 }
    );
  }
}
