// app/api/music/tracks/route.ts - Complete Fix
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema/music';
import { eq, and, desc, sql } from 'drizzle-orm';
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

      // Check if user can view this track
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(eq(musicAlbums.id, track.albumId || 0))
        .limit(1);

      if (!album) {
        return NextResponse.json(
          { success: false, error: 'Track not found' },
          { status: 404 }
        );
      }

      // If no user, track must be active and album must be public
      if (!userId) {
        if (track.status !== 'active' || !album.isPublic || album.status !== 'published') {
          return NextResponse.json(
            { success: false, error: 'Track not found' },
            { status: 404 }
          );
        }
      } else {
        // For authenticated users, they can see if they own the album OR it's public
        if (album.userId !== userId && (!album.isPublic || album.status !== 'published')) {
          return NextResponse.json(
            { success: false, error: 'Track not found' },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: track,
      });
    }

    // ✅ List tracks by album - THIS IS THE MAIN FIX
    if (albumId) {
      // First, get the album to check permissions
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

      console.log(`📀 Album found: ${album.title}, isPublic: ${album.isPublic}, status: ${album.status}, userId: ${album.userId}`);
      console.log(`👤 Current user: ${userId || 'anonymous'}`);

      // ✅ Check if user can view this album
      let canView = false;
      
      if (userId) {
        // Authenticated users can view if they own it OR it's public
        canView = album.userId === userId || (album.isPublic && album.status === 'published');
        console.log(`🔐 Authenticated user, canView: ${canView}`);
      } else {
        // Public users can only view if it's public and published
        canView = album.isPublic === true && album.status === 'published';
        console.log(`👤 Anonymous user, canView: ${canView}`);
      }

      if (!canView) {
        console.log(`🚫 User cannot view album ${albumId}`);
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // ✅ Build the query - get ALL tracks for this album
      const tracks = await db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.albumId, parseInt(albumId)))
        .orderBy(musicTracks.trackNumber);

      console.log(`✅ Found ${tracks.length} tracks for album ${albumId}`);

      // ✅ If user is not the owner, filter to only active tracks
      let filteredTracks = tracks;
      if (!userId || album.userId !== userId) {
        filteredTracks = tracks.filter(track => track.status === 'active');
        console.log(`🔒 Filtered to ${filteredTracks.length} active tracks`);
      }

      return NextResponse.json({
        success: true,
        data: filteredTracks,
      });
    }

    // List all tracks (no albumId specified)
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

      // Combine
      const allAlbumIds = [...new Set([...userAlbumIds, ...publicAlbumIds])];

      if (allAlbumIds.length > 0) {
        // Show all tracks from user's albums + active tracks from public albums
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

    // ✅ Validate required fields
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

    // ✅ Verify album exists and belongs to user
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

    // ✅ Verify music module exists if provided
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

    // ✅ Verify track exists and belongs to user
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

    // ✅ Verify album exists if provided
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

    // ✅ Verify music module exists if provided
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