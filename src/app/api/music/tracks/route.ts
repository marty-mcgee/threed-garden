// app/api/music/tracks/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicTracks, musicAlbums } from '@/lib/schema/music';
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
    const musicId = searchParams.get('musicId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single track by ID
    if (id) {
      let query = db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.id, parseInt(id)));

      // ✅ If no user, only show active tracks
      if (!userId) {
        query = query.where(eq(musicTracks.status, 'active'));
      }

      const [track] = await query.limit(1);

      if (!track) {
        return NextResponse.json(
          { success: false, error: 'Track not found' },
          { status: 404 }
        );
      }

      // ✅ If no user, verify the track's album is public
      if (!userId && track.albumId) {
        const [album] = await db
          .select()
          .from(musicAlbums)
          .where(
            and(
              eq(musicAlbums.id, track.albumId),
              eq(musicAlbums.isPublic, true),
              eq(musicAlbums.status, 'published')
            )
          )
          .limit(1);

        if (!album) {
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

    // ✅ List tracks by album
    if (albumId) {
      // ✅ First, get the album to check if it's public or owned by the user
      const [album] = await db
        .select()
        .from(musicAlbums)
        .where(eq(musicAlbums.id, parseInt(albumId)))
        .limit(1);

      if (!album) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // ✅ Determine if the user can see all tracks or only active ones
      const canSeeAllTracks = userId && (
        album.userId === userId || // User owns the album
        (album.isPublic && album.status === 'published') // Album is public
      );

      // ✅ Build the query
      let query = db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.albumId, parseInt(albumId)));

      // ✅ If user can't see all tracks, only show active tracks
      if (!canSeeAllTracks) {
        query = query.where(eq(musicTracks.status, 'active'));
      }

      // ✅ Filter by status if provided and user has permissions
      if (status && canSeeAllTracks) {
        query = query.where(eq(musicTracks.status, status));
      }

      // ✅ Order by track number
      const tracks = await query.orderBy(musicTracks.trackNumber);

      return NextResponse.json({
        success: true,
        data: tracks,
      });
    }

    // ✅ List all tracks (for global view)
    let query = db
      .select()
      .from(musicTracks)
      .$dynamic();

    // ✅ For authenticated users, show all their tracks + active public tracks
    if (userId) {
      // Get user's album IDs
      const userAlbums = await db
        .select({ id: musicAlbums.id })
        .from(musicAlbums)
        .where(eq(musicAlbums.userId, userId));

      const userAlbumIds = userAlbums.map(a => a.id);

      // Get public album IDs
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

      // Combine: user's albums OR public albums
      const allAlbumIds = [...new Set([...userAlbumIds, ...publicAlbumIds])];

      if (allAlbumIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // ✅ Show tracks from user's albums (all) + public albums (active only)
      // We need to handle this with a more complex query
      // For simplicity, we'll use a union approach with raw SQL or multiple queries
      // Let's use a combination of conditions
      query = query.where(
        or(
          // User's own albums - all tracks
          sql`${musicTracks.albumId} IN (${userAlbumIds.join(',')})`,
          // Public albums - only active tracks
          and(
            sql`${musicTracks.albumId} IN (${publicAlbumIds.join(',')})`,
            eq(musicTracks.status, 'active')
          )
        )
      );
    } else {
      // ✅ Public users: only active tracks from public albums
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

    // ✅ Filter by music module if provided
    if (musicId) {
      query = query.where(eq(musicTracks.musicId, parseInt(musicId)));
    }

    // ✅ Filter by status if provided (for authenticated users)
    if (status && userId) {
      query = query.where(eq(musicTracks.status, status));
    }

    // ✅ Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(musicTracks)
      .where(query._where);

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const tracks = await query
      .orderBy(desc(musicTracks.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: tracks,
      pagination: { limit, offset, total },
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