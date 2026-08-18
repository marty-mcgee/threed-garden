// app/api/music/albums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks, musicLinks, musicMedia } from '@/lib/schema/music';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/music/albums - List owner or public albums
// Query Parameters:
//   - id (optional): Get a single album with tracks
//   - includeTracks (optional): Include tracks in response
//   - includeLinks (optional): Include links in response
//   - includeMedia (optional): Include media in response
//   - scope (optional): owner (authenticated default) or public (anonymous default)
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
    const requestedScope = searchParams.get('scope');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (requestedScope && requestedScope !== 'owner' && requestedScope !== 'public') {
      return NextResponse.json(
        { success: false, error: 'Invalid album scope' },
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

    const albumAccessCondition = scope === 'owner'
      ? eq(musicAlbums.userId, userId!)
      : and(
          eq(musicAlbums.isPublic, true),
          eq(musicAlbums.status, 'published')
        );

    console.log('[API] 🔍 Request params:', { id, includeTracks, includeLinks, includeMedia, scope, status, limit, offset });

    // ✅ Get a single album by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid album ID' },
          { status: 400 }
        );
      }

      console.log('[API] 🔍 Fetching album with ID:', parsedId);

      // ✅ Get album by ID
      const albumQuery = db
        .select()
        .from(musicAlbums)
        .where(
          and(
            eq(musicAlbums.id, parsedId),
            albumAccessCondition
          )
        );

      const [album] = await albumQuery;

      if (!album) {
        console.log('[API] ❌ Album not found with ID:', parsedId);
        return NextResponse.json(
          { success: false, error: 'Album not found' },
          { status: 404 }
        );
      }

      console.log('[API] ✅ Found album:', album.id, album.title);

      const response: any = { ...album };

      // ✅ Fetch tracks for this specific album
      if (includeTracks) {
        console.log('[API] 🎵 Fetching tracks for album:', album.id);
        const tracksQuery = db
          .select()
          .from(musicTracks)
          .where(
            and(
              eq(musicTracks.albumId, album.id),
              scope === 'owner'
                ? eq(musicTracks.userId, userId!)
                : eq(musicTracks.status, 'active')
            )
          );

        const tracks = await tracksQuery.orderBy(musicTracks.trackNumber);
        console.log('[API] 🎵 Found', tracks.length, 'tracks for album:', album.id);
        response.tracks = tracks;
      }

      // ✅ Fetch links for this album (now directly on music_links table)
      if (includeLinks) {
        console.log('[API] 🔗 Fetching links for album:', album.id);
        const linksQuery = db
          .select()
          .from(musicLinks)
          .where(
            and(
              eq(musicLinks.albumId, album.id),
              scope === 'owner'
                ? eq(musicLinks.userId, userId!)
                : eq(musicLinks.status, 'active')
            )
          );

        const links = await linksQuery.orderBy(musicLinks.displayOrder);
        console.log('[API] 🔗 Found', links.length, 'links');
        response.links = links;
      }

      // ✅ Fetch media for this album
      if (includeMedia) {
        console.log('[API] 🖼️ Fetching media for album:', album.id);
        const mediaQuery = db
          .select()
          .from(musicMedia)
          .where(
            and(
              eq(musicMedia.albumId, album.id),
              scope === 'owner'
                ? eq(musicMedia.userId, userId!)
                : eq(musicMedia.isPrimary, true)
            )
          );

        const media = await mediaQuery;
        console.log('[API] 🖼️ Found', media.length, 'media items');
        response.media = media;
      }

      return NextResponse.json({
        success: true,
        data: response,
      });
    }

    // ✅ LIST ALL ALBUMS (only when no ID is provided)
    console.log('[API] 📋 Listing all albums');

    const supportedStatuses = ['draft', 'published', 'archived'] as const;
    if (status && !supportedStatuses.includes(status as typeof supportedStatuses[number])) {
      return NextResponse.json(
        { success: false, error: 'Invalid album status' },
        { status: 400 }
      );
    }

    const albumListCondition = and(
      albumAccessCondition,
      status ? eq(musicAlbums.status, status as typeof supportedStatuses[number]) : undefined
    );

    const query = db
      .select()
      .from(musicAlbums)
      .where(albumListCondition);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(musicAlbums)
      .where(albumListCondition);

    const albums = await query
      .orderBy(desc(musicAlbums.createdAt))
      .limit(limit)
      .offset(offset);

    console.log('[API] 📋 Found', albums.length, 'albums');

    // ✅ Fetch tracks, links, and media for each album if requested
    if (includeTracks || includeLinks || includeMedia) {
      const albumsWithData = await Promise.all(
        albums.map(async (album) => {
          const result: any = { ...album };

          // Fetch tracks if requested
          if (includeTracks) {
            const tracksQuery = db
              .select()
              .from(musicTracks)
              .where(
                and(
                  eq(musicTracks.albumId, album.id),
                  scope === 'owner'
                    ? eq(musicTracks.userId, userId!)
                    : eq(musicTracks.status, 'active')
                )
              );

            const tracks = await tracksQuery.orderBy(musicTracks.trackNumber);
            result.tracks = tracks || [];
          }

          // ✅ Fetch links if requested (simplified - direct query)
          if (includeLinks) {
            const linksQuery = db
              .select()
              .from(musicLinks)
              .where(
                and(
                  eq(musicLinks.albumId, album.id),
                  scope === 'owner'
                    ? eq(musicLinks.userId, userId!)
                    : eq(musicLinks.status, 'active')
                )
              );

            const links = await linksQuery.orderBy(musicLinks.displayOrder);
            result.links = links || [];
          }

          // ✅ Fetch media if requested
          if (includeMedia) {
            const mediaQuery = db
              .select()
              .from(musicMedia)
              .where(
                and(
                  eq(musicMedia.albumId, album.id),
                  scope === 'owner'
                    ? eq(musicMedia.userId, userId!)
                    : eq(musicMedia.isPrimary, true)
                )
              );

            const media = await mediaQuery;
            result.media = media || [];
          }

          return result;
        })
      );

      return NextResponse.json({
        success: true,
        data: albumsWithData,
        pagination: { limit, offset, total: countResult[0]?.count || 0 },
      });
    }

    return NextResponse.json({
      success: true,
      data: albums,
      pagination: { limit, offset, total: countResult[0]?.count || 0 },
    });
  } catch (error) {
    console.error('[API] ❌ Error fetching albums:', error);
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
      sortOrder
    } = body;

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

    await ensureTableSequence('music_albums');

    const [newAlbum] = await db
      .insert(musicAlbums)
      .values({
        userId,
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
      sortOrder
    } = body;

    const userId = session.user.id;

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
