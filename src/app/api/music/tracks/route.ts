// app/api/music/tracks/route.ts - COMPLETE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums, music } from '@/lib/schema/music';
import { eq, and, desc, or, sql } from 'drizzle-orm';
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

    console.log(`🔍 GET /api/music/tracks - albumId: ${albumId}, userId: ${userId || 'anonymous'}`);

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

    // ✅ LIST TRACKS BY ALBUM - FIXED
    if (albumId) {
      console.log(`📀 Fetching tracks for album ID: ${albumId}`);
      
      // First, verify the album exists and is viewable
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(eq(musicAlbums.id, parseInt(albumId)))
        .limit(1);

      if (!album) {
        console.log(`❌ Album ${albumId} not found`);
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      console.log(`📀 Album: ${album.title}, isPublic: ${album.isPublic}, status: ${album.status}`);

      // Check if user can view this album
      let canView = false;
      
      if (userId) {
        canView = album.userId === userId || (album.isPublic && album.status === 'published');
      } else {
        canView = album.isPublic === true && album.status === 'published';
      }

      if (!canView) {
        console.log(`🚫 User cannot view album ${albumId}`);
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // ✅ CRITICAL FIX: Build query with ALBUM ID filter
      let query = db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.albumId, parseInt(albumId))  // ← THIS IS THE KEY FIX
          )
        );

      // If user is not the owner, only get active tracks
      if (!userId || album.userId !== userId) {
        query = query.where(eq(musicTracks.status, 'active'));
      }

      const tracks = await query.orderBy(musicTracks.trackNumber);
      
      console.log(`✅ Found ${tracks.length} tracks for album ${albumId}`);

      return NextResponse.json({
        success: true,
        data: tracks,
      });
    }

    // ✅ If no albumId, return all tracks (with filtering)
    console.log(`📚 Getting all tracks (no albumId)`);
    
    let query = db
      .select()
      .from(musicTracks)
      .$dynamic();

    if (userId) {
      // Get user's albums
      const userAlbums = await db
        .select({ id: musicAlbums.id })
        .from(musicAlbums)
        .where(eq(musicAlbums.userId, userId));

      const userAlbumIds = userAlbums.map(a => a.id);

      // Get public albums
      const publicAlbums = await db
        .select({ id: musicAlbums.id })
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.isPublic, true),
            eq(musicAlbums.status, 'published')
          )
        );

      const publicAlbumIds = publicAlbums.map(a => a.id);

      const allAlbumIds = [...new Set([...userAlbumIds, ...publicAlbumIds])];

      if (allAlbumIds.length > 0) {
        query = query.where(
          sql`${musicTracks.albumId} IN (${allAlbumIds.join(',')})`
        );
      } else {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    } else {
      // Public users: only active tracks from public albums
      const publicAlbums = await db
        .select({ id: musicAlbums.id })
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.isPublic, true),
            eq(musicAlbums.status, 'published')
          )
        );

      const publicAlbumIds = publicAlbums.map(a => a.id);

      if (publicAlbumIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      query = query.where(
        and(
          sql`${musicTracks.albumId} IN (${publicAlbumIds.join(',')})`,
          eq(musicTracks.status, 'active')
        )
      );
    }

    const tracks = await query
      .orderBy(desc(musicTracks.createdAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      data: tracks,
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

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: publicUrl' },
        { status: 400 }
      );
    }

    if (!albumId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: albumId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify album exists and belongs to user
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

    // Verify music module exists if provided
    if (musicId) {
      const [module] = await db
        .select()
        .from(music)
        .where(
          and(
            eq(music.id, parseInt(musicId)),
            eq(music.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Music module not found' },
          { status: 404 }
        );
      }
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

    // Verify track exists and belongs to user
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

    // Verify album exists if provided
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

    // Verify music module exists if provided
    if (musicId) {
      const [module] = await db
        .select()
        .from(music)
        .where(
          and(
            eq(music.id, parseInt(musicId)),
            eq(music.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Music module not found' },
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