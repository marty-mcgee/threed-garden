// app/api/multimedia/tracks/route.ts - WITH DEBUG LOGGING
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaTracks, multimediaAlbums, multimediaMedia } from '@/libraries/schema/multimedia';
import { multimediaSpeechVersions } from '@/libraries/schema/multimedia';
import { eq, ne, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/libraries/db/sequence';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ownsMediaKey } from '@/libraries/services/multimedia/upload-policy';

// ============================================
// GET /api/multimedia/tracks - List owner or public tracks
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
      ? eq(multimediaTracks.userId, userId!)
      : and(
          eq(multimediaTracks.status, 'active'),
          sql`EXISTS (
            SELECT 1
            FROM ${multimediaAlbums}
            WHERE ${multimediaAlbums.id} = ${multimediaTracks.albumId}
            AND ${multimediaAlbums.isPublic} = true
            AND ${multimediaAlbums.status} = 'published'
          )`
        );

    // ✅ DEBUG: Log everything
    // console.log('========================================');
    // console.log('🔍 GET /api/multimedia/tracks');
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
        .from(multimediaTracks)
        .where(
          and(
            eq(multimediaTracks.id, parsedId),
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
        .from(multimediaTracks)
        .where(
          and(
            eq(multimediaTracks.albumId, albumIdNum),
            trackAccessCondition
          )
        )
        .orderBy(multimediaTracks.trackNumber);

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
      .from(multimediaTracks)
      .where(trackAccessCondition)
      .orderBy(desc(multimediaTracks.createdAt));

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
// POST /api/multimedia/tracks - Create a new track (ADMIN ONLY)
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
    console.log('📝 POST /api/multimedia/tracks - Request body:', body);

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
      .from(multimediaAlbums)
      .where(
        and(
          eq(multimediaAlbums.id, parsedAlbumId),
          eq(multimediaAlbums.userId, userId)
        )
      )
      .limit(1);

    if (!album) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    await ensureTableSequence('multimedia_tracks');

    const [newTrack] = await db
      .insert(multimediaTracks)
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
// PUT /api/multimedia/tracks - Update a track (ADMIN ONLY)
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
    console.log('📝 PUT /api/multimedia/tracks - Request body:', body);

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
      .from(multimediaTracks)
      .where(
        and(
          eq(multimediaTracks.id, parsedId),
          eq(multimediaTracks.userId, userId)
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
        .from(multimediaAlbums)
        .where(
          and(
            eq(multimediaAlbums.id, parsedAlbumId),
            eq(multimediaAlbums.userId, userId)
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
      .update(multimediaTracks)
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
          eq(multimediaTracks.id, parsedId),
          eq(multimediaTracks.userId, userId)
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
// DELETE /api/multimedia/tracks - Delete a track (ADMIN ONLY)
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

    if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const trackId = Number(id);
    const [track] = await db.select().from(multimediaTracks)
      .where(and(eq(multimediaTracks.id, trackId), eq(multimediaTracks.userId, userId))).limit(1);
    if (!track) return NextResponse.json({ success: false, error: 'Track not found' }, { status: 404 });

    let fileCleanup = 'unmanaged';
    if (track.fileUrl.startsWith('/api/multimedia/files?key=')) {
      const key = new URL(track.fileUrl, 'https://local.invalid').searchParams.get('key') || '';
      if (!ownsMediaKey(userId, key)) {
        return NextResponse.json({ success: false, error: 'File ownership could not be verified. Track was not deleted.' }, { status: 409 });
      }
      const [otherTracks, media, covers, speechHistory] = await Promise.all([
        db.select({ id: multimediaTracks.id }).from(multimediaTracks).where(and(eq(multimediaTracks.fileUrl, track.fileUrl), ne(multimediaTracks.id, trackId))).limit(1),
        db.select({ id: multimediaMedia.id }).from(multimediaMedia).where(eq(multimediaMedia.fileUrl, track.fileUrl)).limit(1),
        db.select({ id: multimediaAlbums.id }).from(multimediaAlbums).where(eq(multimediaAlbums.coverArt, track.fileUrl)).limit(1),
        db.select({ id: multimediaSpeechVersions.id }).from(multimediaSpeechVersions).where(eq(multimediaSpeechVersions.storageKey, key)).limit(1),
      ]);
      if (otherTracks.length || media.length || covers.length || speechHistory.length) {
        fileCleanup = 'shared';
      } else {
        try {
          if (!process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) throw Error('Storage unavailable');
          await new S3Client({ region: process.env.AWS_REGION }).send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key }));
          fileCleanup = 'deleted';
        } catch {
          return NextResponse.json({ success: false, error: 'S3 file deletion failed. Track was kept so you can retry. Check DeleteObject permission.' }, { status: 502 });
        }
      }
    }

    const [deleted] = await db
      .delete(multimediaTracks)
      .where(
        and(
          eq(multimediaTracks.id, parseInt(id)),
          eq(multimediaTracks.userId, userId)
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
      fileCleanup,
      message: fileCleanup === 'deleted' ? 'Track and S3 file deleted' : fileCleanup === 'shared' ? 'Track deleted; shared file retained' : 'Track deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete track' },
      { status: 500 }
    );
  }
}
