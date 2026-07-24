// app/api/music/tracks/route.ts - SIMPLIFIED WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/tracks - List tracks (PUBLIC)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const albumId = searchParams.get('albumId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`🔍 GET /api/music/tracks - albumId: ${albumId}`);

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
    // LIST TRACKS BY ALBUM - SIMPLIFIED
    // ============================================
    if (albumId) {
      console.log(`📀 Fetching tracks for album ID: ${albumId}`);
      
      // Convert albumId to number
      const albumIdNum = parseInt(albumId);
      
      // ✅ SIMPLE QUERY - JUST FILTER BY ALBUM ID
      const tracks = await db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.albumId, albumIdNum)
          )
        )
        .orderBy(musicTracks.trackNumber);

      console.log(`✅ Found ${tracks.length} tracks for album ${albumIdNum}`);
      
      // Log the album IDs of the returned tracks to verify
      console.log(`📝 Album IDs in result:`, tracks.map(t => t.albumId));

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
      .orderBy(desc(musicTracks.createdAt))
      .limit(limit)
      .offset(offset);

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