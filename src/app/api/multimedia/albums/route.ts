// app/api/multimedia/albums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaLinks, multimediaMedia } from '@/libraries/schema/multimedia';
import { eq, and, asc, sql, or, ne, isNull } from 'drizzle-orm';
import { publicRecord, ownsFileReference, positiveId } from '@/libraries/services/multimedia/access';
import { publicAlbumScope, publicTrackScope, publicMediaScope } from '@/libraries/services/multimedia/authority';
import { ensureTableSequence } from '@/libraries/db/sequence';

// ============================================
// GET /api/multimedia/albums - List owner or public albums
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
      ? eq(multimediaAlbums.userId, userId!)
      : publicAlbumScope();

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
        .from(multimediaAlbums)
        .where(
          and(
            eq(multimediaAlbums.id, parsedId),
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
          .from(multimediaTracks)
          .where(
            and(
              eq(multimediaTracks.albumId, album.id),
              scope === 'owner'
                ? eq(multimediaTracks.userId, userId!)
                : and(eq(multimediaTracks.userId, album.userId!), publicTrackScope())
            )
          );

        const tracks = await tracksQuery.orderBy(sql`${multimediaTracks.trackNumber} ASC NULLS LAST`, asc(multimediaTracks.id));
        console.log('[API] 🎵 Found', tracks.length, 'tracks for album:', album.id);
        response.tracks = tracks;
      }

      // ✅ Fetch links for this album (now directly on multimedia_links table)
      if (includeLinks) {
        console.log('[API] 🔗 Fetching links for album:', album.id);
        const linksQuery = db
          .select()
          .from(multimediaLinks)
          .where(
            and(
              eq(multimediaLinks.albumId, album.id),
              scope === 'owner'
                ? eq(multimediaLinks.userId, userId!)
                : and(eq(multimediaLinks.userId, album.userId!), eq(multimediaLinks.status, 'active'), sql`(${multimediaLinks.trackId} IS NULL OR EXISTS (SELECT 1 FROM ${multimediaTracks} WHERE ${multimediaTracks.id} = ${multimediaLinks.trackId} AND ${multimediaTracks.albumId} = ${multimediaLinks.albumId} AND ${multimediaTracks.userId} = ${multimediaLinks.userId} AND ${multimediaTracks.status} = 'active'))`)
            )
          );

        const links = await linksQuery.orderBy(sql`${multimediaLinks.displayOrder} ASC NULLS LAST`, asc(multimediaLinks.id));
        console.log('[API] 🔗 Found', links.length, 'links');
        response.links = links;
      }

      // ✅ Fetch media for this album
      if (includeMedia) {
        console.log('[API] 🖼️ Fetching media for album:', album.id);
        const mediaQuery = db
          .select()
          .from(multimediaMedia)
          .where(
            and(
              eq(multimediaMedia.albumId, album.id),
              scope === 'owner'
                ? eq(multimediaMedia.userId, userId!)
                : and(eq(multimediaMedia.userId, album.userId!), publicMediaScope())
            )
          );

        const media = await mediaQuery.orderBy(sql`${multimediaMedia.sortOrder} ASC NULLS LAST`, asc(multimediaMedia.id));
        console.log('[API] 🖼️ Found', media.length, 'media items');
        response.media = media;
      }

      return NextResponse.json({
        success: true,
        data: scope === 'public' ? publicRecord('album', response) : response,
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
      status ? eq(multimediaAlbums.status, status as typeof supportedStatuses[number]) : undefined
    );

    const query = db
      .select()
      .from(multimediaAlbums)
      .where(albumListCondition);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(multimediaAlbums)
      .where(albumListCondition);

    // Dashboard grid and next-Album playback consume this public response order.
    const albumOrder = [sql`${multimediaAlbums.sortOrder} ASC NULLS LAST`, asc(multimediaAlbums.id)];

    const albums = await query
      .orderBy(...albumOrder)
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
              .from(multimediaTracks)
              .where(
                and(
                  eq(multimediaTracks.albumId, album.id),
                  scope === 'owner'
                    ? eq(multimediaTracks.userId, userId!)
                    : and(eq(multimediaTracks.userId, album.userId!), publicTrackScope())
                )
              );

            const tracks = await tracksQuery.orderBy(sql`${multimediaTracks.trackNumber} ASC NULLS LAST`, asc(multimediaTracks.id));
            result.tracks = tracks || [];
          }

          // ✅ Fetch links if requested (simplified - direct query)
          if (includeLinks) {
            const linksQuery = db
              .select()
              .from(multimediaLinks)
              .where(
                and(
                  eq(multimediaLinks.albumId, album.id),
                  scope === 'owner'
                    ? eq(multimediaLinks.userId, userId!)
                    : and(eq(multimediaLinks.userId, album.userId!), eq(multimediaLinks.status, 'active'), sql`(${multimediaLinks.trackId} IS NULL OR EXISTS (SELECT 1 FROM ${multimediaTracks} WHERE ${multimediaTracks.id} = ${multimediaLinks.trackId} AND ${multimediaTracks.albumId} = ${multimediaLinks.albumId} AND ${multimediaTracks.userId} = ${multimediaLinks.userId} AND ${multimediaTracks.status} = 'active'))`)
                )
              );

            const links = await linksQuery.orderBy(sql`${multimediaLinks.displayOrder} ASC NULLS LAST`, asc(multimediaLinks.id));
            result.links = links || [];
          }

          // ✅ Fetch media if requested
          if (includeMedia) {
            const mediaQuery = db
              .select()
              .from(multimediaMedia)
              .where(
                and(
                  eq(multimediaMedia.albumId, album.id),
                  scope === 'owner'
                    ? eq(multimediaMedia.userId, userId!)
                    : and(eq(multimediaMedia.userId, album.userId!), publicMediaScope())
                )
              );

            const media = await mediaQuery.orderBy(sql`${multimediaMedia.sortOrder} ASC NULLS LAST`, asc(multimediaMedia.id));
            result.media = media || [];
          }

          return result;
        })
      );

      return NextResponse.json({
        success: true,
        data: scope === 'public' ? albumsWithData.map(album => publicRecord('album', album)) : albumsWithData,
        pagination: { limit, offset, total: countResult[0]?.count || 0 },
      });
    }

    return NextResponse.json({
      success: true,
      data: scope === 'public' ? albums.map(album => publicRecord('album', album)) : albums,
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
// POST /api/multimedia/albums - Create a new album (ADMIN ONLY)
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
    if (body.sortOrder != null && (!Number.isInteger(body.sortOrder) || body.sortOrder < -10000 || body.sortOrder > 10000)) {
      return NextResponse.json({ success: false, error: 'Sort Order must be an integer from -10000 to 10000.' }, { status: 400 });
    }
    if (body?.coverArt !== undefined && !ownsFileReference(session.user.id, body.coverArt)) return NextResponse.json({ success: false, error: 'File reference is not owned by this User' }, { status: 400 });
    console.log('📝 POST /api/multimedia/albums - Request body:', body);

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

    await ensureTableSequence('multimedia_albums');

    const [newAlbum] = await db
      .insert(multimediaAlbums)
      .values({
        userId,
        title,
        artist,
        coverArt,
        releaseYear: releaseYear || null,
        description: description || null,
        status: status || 'draft',
        isPublic: isPublic || false,
        sortOrder: sortOrder ?? 0,
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
// PUT /api/multimedia/albums - Update an album (ADMIN ONLY)
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
    if (body.sortOrder != null && (!Number.isInteger(body.sortOrder) || body.sortOrder < -10000 || body.sortOrder > 10000)) {
      return NextResponse.json({ success: false, error: 'Sort Order must be an integer from -10000 to 10000.' }, { status: 400 });
    }
    if (body?.coverArt !== undefined && !ownsFileReference(session.user.id, body.coverArt)) return NextResponse.json({ success: false, error: 'File reference is not owned by this User' }, { status: 400 });
    console.log('📝 PUT /api/multimedia/albums - Request body:', body);

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
      .from(multimediaAlbums)
      .where(
        and(
          eq(multimediaAlbums.id, parseInt(id)),
          eq(multimediaAlbums.userId, userId)
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
      .update(multimediaAlbums)
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
          eq(multimediaAlbums.id, parseInt(id)),
          eq(multimediaAlbums.userId, userId)
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
// DELETE /api/multimedia/albums - Delete an album (ADMIN ONLY)
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

    const albumId = positiveId(id);
    if (!albumId) return NextResponse.json({ success: false, error: 'Invalid Album ID' }, { status: 400 });
    const outcome = await db.transaction(async tx => {
      const [album] = await tx.select().from(multimediaAlbums)
        .where(and(eq(multimediaAlbums.id, albumId), eq(multimediaAlbums.userId, userId))).for('update');
      if (!album) return { deleted: null, conflict: false };
      for (const child of [multimediaTracks, multimediaMedia, multimediaLinks]) {
        const [foreign] = await tx.select({ id: child.id }).from(child)
          .where(and(eq(child.albumId, albumId), or(isNull(child.userId), ne(child.userId, userId)))).limit(1);
        if (foreign) return { deleted: null, conflict: true };
      }
      const [foreignTrackLink] = await tx.select({ id: multimediaLinks.id }).from(multimediaLinks)
        .where(and(or(isNull(multimediaLinks.userId), ne(multimediaLinks.userId, userId)), sql`EXISTS (
          SELECT 1 FROM ${multimediaTracks} WHERE ${multimediaTracks.id} = ${multimediaLinks.trackId}
          AND ${multimediaTracks.albumId} = ${albumId})`)).limit(1);
      if (foreignTrackLink) return { deleted: null, conflict: true };
      const [deleted] = await tx.delete(multimediaAlbums).where(and(eq(multimediaAlbums.id, albumId), eq(multimediaAlbums.userId, userId))).returning();
      return { deleted, conflict: false };
    });
    if (outcome.conflict) return NextResponse.json({ success: false, error: 'Album contains content with unresolved ownership. No records deleted.' }, { status: 409 });
    const { deleted } = outcome;

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
