// app/api/music/albums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, musicLinks, musicAlbumLinks, musicMedia, music } from '@/lib/schema/music';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/albums - List albums (PUBLIC)
// Query Parameters:
//   - id (optional): Get a single album with tracks
//   - includeTracks (optional): Include tracks in response
//   - includeLinks (optional): Include links in response
//   - includeMedia (optional): Include media in response
//   - musicId (optional): Filter by music module
//   - status (optional): Filter by status
//   - limit (optional): Number of records to return (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includeTracks = searchParams.get('includeTracks') === 'true';
    const includeLinks = searchParams.get('includeLinks') === 'true';
    const includeMedia = searchParams.get('includeMedia') === 'true';
    const musicId = searchParams.get('musicId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single album by ID
    if (id) {
      // ✅ Build query with user filtering
      let query = db
        .select()
        .from(musicAlbums)
        .where(eq(musicAlbums.id, parseInt(id)));

      // ✅ If no user, only show public published albums
      if (!userId) {
        query = query.where(
          and(
            eq(musicAlbums.isPublic, true),
            eq(musicAlbums.status, 'published')
          )
        );
      } else {
        // ✅ If user, show their albums OR public albums
        query = query.where(
          or(
            eq(musicAlbums.userId, userId),
            and(
              eq(musicAlbums.isPublic, true),
              eq(musicAlbums.status, 'published')
            )
          )
        );
      }

      // ✅ Filter by music module if provided
      if (musicId) {
        query = query.where(eq(musicAlbums.musicId, parseInt(musicId)));
      }

      const [album] = await query.limit(1);

      if (!album) {
        return NextResponse.json(
          { success: false, error: 'Album not found' },
          { status: 404 }
        );
      }

      // ✅ Build response with optional includes
      const response: any = { ...album };

      if (includeTracks) {
        let tracksQuery = db
          .select()
          .from(musicTracks)
          .where(eq(musicTracks.albumId, album.id));

        // ✅ Only show active tracks to public users
        if (!userId) {
          tracksQuery = tracksQuery.where(eq(musicTracks.status, 'active'));
        }

        const tracks = await tracksQuery.orderBy(musicTracks.trackNumber);
        response.tracks = tracks;
      }

      if (includeLinks) {
        let linksQuery = db
          .select()
          .from(musicLinks)
          .innerJoin(
            musicAlbumLinks,
            eq(musicAlbumLinks.linkId, musicLinks.id)
          )
          .where(eq(musicAlbumLinks.albumId, album.id));

        // ✅ Only show active links to public users
        if (!userId) {
          linksQuery = linksQuery.where(eq(musicLinks.status, 'active'));
        }

        const results = await linksQuery;
        response.links = results.map((row) => row.musicLinks);
      }

      if (includeMedia) {
        const media = await db
          .select()
          .from(musicMedia)
          .where(eq(musicMedia.albumId, album.id));
        response.media = media;
      }

      return NextResponse.json({
        success: true,
        data: response,
      });
    }

    // ✅ Build base query with user filtering
    let query = db
      .select()
      .from(musicAlbums)
      .$dynamic();

    // ✅ If no user, only show public published albums
    if (!userId) {
      query = query.where(
        and(
          eq(musicAlbums.isPublic, true),
          eq(musicAlbums.status, 'published')
        )
      );
    } else {
      // ✅ If user, show their albums OR public albums
      query = query.where(
        or(
          eq(musicAlbums.userId, userId),
          and(
            eq(musicAlbums.isPublic, true),
            eq(musicAlbums.status, 'published')
          )
        )
      );
    }

    // ✅ Filter by music module if provided
    if (musicId) {
      query = query.where(eq(musicAlbums.musicId, parseInt(musicId)));
    }

    // ✅ Filter by status if provided
    if (status) {
      query = query.where(eq(musicAlbums.status, status));
    }

    // ✅ Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(musicAlbums)
      .where(query._where);

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const albums = await query
      .orderBy(desc(musicAlbums.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ If includeTracks is true, fetch tracks for each album
    if (includeTracks) {
      const albumsWithTracks = await Promise.all(
        albums.map(async (album) => {
          let tracksQuery = db
            .select()
            .from(musicTracks)
            .where(eq(musicTracks.albumId, album.id));

          // ✅ Only show active tracks to public users
          if (!userId) {
            tracksQuery = tracksQuery.where(eq(musicTracks.status, 'active'));
          }

          const tracks = await tracksQuery.orderBy(musicTracks.trackNumber);
          return {
            ...album,
            tracks,
          };
        })
      );

      // ✅ Include links if requested
      if (includeLinks) {
        const albumsWithLinks = await Promise.all(
          albumsWithTracks.map(async (album) => {
            let linksQuery = db
              .select()
              .from(musicLinks)
              .innerJoin(
                musicAlbumLinks,
                eq(musicAlbumLinks.linkId, musicLinks.id)
              )
              .where(eq(musicAlbumLinks.albumId, album.id));

            if (!userId) {
              linksQuery = linksQuery.where(eq(musicLinks.status, 'active'));
            }

            const results = await linksQuery;
            const links = results.map((row) => row.musicLinks);
            return {
              ...album,
              links,
            };
          })
        );

        return NextResponse.json({
          success: true,
          data: albumsWithLinks,
          pagination: { limit, offset, total },
        });
      }

      return NextResponse.json({
        success: true,
        data: albumsWithTracks,
        pagination: { limit, offset, total },
      });
    }

    return NextResponse.json({
      success: true,
      data: albums,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/music/albums - Create a new album (ADMIN ONLY)
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
    console.log('📝 POST /api/music/albums - Request body:', body);

    const { 
      title, 
      artist, 
      coverArt, 
      releaseYear, 
      description, 
      status, 
      isPublic, 
      sortOrder,
      musicId  // ✅ Include music module reference
    } = body;

    // ✅ Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: artist' },
        { status: 400 }
      );
    }

    if (!coverArt) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: coverArt' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

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

    await ensureTableSequence('music_albums');

    const [newAlbum] = await db
      .insert(musicAlbums)
      .values({
        userId,
        musicId: musicId || null,
        title,
        artist,
        coverArt,
        releaseYear: releaseYear || null,
        description: description || null,
        status: status || 'draft',
        isPublic: isPublic || false,
        sortOrder: sortOrder || 0,
      })
      .returning();

    console.log('✅ Album created:', newAlbum);

    return NextResponse.json({
      success: true,
      data: newAlbum,
      message: 'Album created successfully',
    });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create album' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/music/albums - Update an album (ADMIN ONLY)
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
    console.log('📝 PUT /api/music/albums - Request body:', body);

    const { 
      title, 
      artist, 
      coverArt, 
      releaseYear, 
      description, 
      status, 
      isPublic, 
      sortOrder,
      musicId
    } = body;

    const userId = session.user.id;

    // ✅ Verify album exists and belongs to user
    const [existing] = await db
      .select()
      .from(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
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

    const [updatedAlbum] = await db
      .update(musicAlbums)
      .set({
        title: title || existing.title,
        artist: artist || existing.artist,
        coverArt: coverArt || existing.coverArt,
        releaseYear: releaseYear !== undefined ? releaseYear : existing.releaseYear,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        musicId: musicId !== undefined ? musicId : existing.musicId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, userId)
        )
      )
      .returning();

    console.log('✅ Album updated:', updatedAlbum);

    return NextResponse.json({
      success: true,
      data: updatedAlbum,
      message: 'Album updated successfully',
    });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/music/albums - Delete an album (ADMIN ONLY)
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
      .delete(musicAlbums)
      .where(
        and(
          eq(musicAlbums.id, parseInt(id)),
          eq(musicAlbums.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Album deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}