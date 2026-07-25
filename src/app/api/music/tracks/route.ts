// app/api/music/tracks/route.ts - WITH DEBUG LOGGING
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/tracks - List tracks (PUBLIC)
// Query Parameters:
//   - albumId (optional): Filter tracks by album
//   - id (optional): Get a single track
//   - musicId (optional): Filter by music module
//   - status (optional): Filter by status
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
      const [track] = await db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.id, parseInt(id)))
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
      
      const albumIdNum = parseInt(albumId);
      console.log(`📀 Parsed albumId: ${albumIdNum}`);

      if (isNaN(albumIdNum)) {
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
        .where(eq(musicTracks.albumId, albumIdNum))
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
      publicUrl, 
      status, 
      lyrics,
      musicId
    } = body;

    if (!title || !publicUrl || !albumId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, publicUrl, albumId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

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

    await ensureTableSequence('music_tracks');

    const [newTrack] = await db
      .insert(musicTracks)
      .values({
        userId,
        albumId,
        musicId: musicId || null,
        title,
        duration: duration || null,
        trackNumber: trackNumber || null,
        publicUrl,
        status: status || 'active',
        lyrics: lyrics || null,
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

    const body = await request.json();
    console.log('📝 PUT /api/music/tracks - Request body:', body);

    const { 
      title, 
      duration, 
      trackNumber, 
      publicUrl, 
      status, 
      lyrics,
      albumId,
      musicId
    } = body;

    const userId = session.user.id;

    const [existing] = await db
      .select()
      .from(musicTracks)
      .where(
        and(
          eq(musicTracks.id, parseInt(id)),
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

    const [updatedTrack] = await db
      .update(musicTracks)
      .set({
        title: title || existing.title,
        duration: duration !== undefined ? duration : existing.duration,
        trackNumber: trackNumber !== undefined ? trackNumber : existing.trackNumber,
        publicUrl: publicUrl || existing.publicUrl,
        status: status || existing.status,
        lyrics: lyrics !== undefined ? lyrics : existing.lyrics,
        albumId: albumId !== undefined ? albumId : existing.albumId,
        musicId: musicId !== undefined ? musicId : existing.musicId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicTracks.id, parseInt(id)),
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