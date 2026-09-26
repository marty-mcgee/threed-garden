import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaLinks, multimediaPollingLogs } from '@/libraries/schema';
import { 
  MusicAlbum, 
  MusicTrack, 
  MusicLink, 
  MusicPollStats, 
  MusicMetadataSyncResult,
  MultimediaPollerConfig,
  MusicPollingType,
  AlbumStatus,
  TrackStatus,
  MusicLinkStatus 
} from '@/libraries/types/multimedia';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class MultimediaPoller {
  private static instance: MultimediaPoller;
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private config: MultimediaPollerConfig;
  private s3Client: S3Client;

  private constructor() {
    this.config = {
      pollInterval: parseInt(process.env.MUSIC_POLL_INTERVAL || '300000'), // 5 minutes
      autoSyncMetadata: process.env.MUSIC_AUTO_SYNC_METADATA === 'true',
      metadataSyncInterval: parseInt(process.env.MUSIC_METADATA_SYNC_INTERVAL || '3600000'), // 1 hour
      maxRetries: 3,
      retryDelay: 5000,
      s3Bucket: process.env.S3_BUCKET_NAME || '',
      s3Region: process.env.AWS_REGION || 'us-east-1',
    };

    this.s3Client = new S3Client({
      region: this.config.s3Region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  public static getInstance(): MultimediaPoller {
    if (!MultimediaPoller.instance) {
      MultimediaPoller.instance = new MultimediaPoller();
    }
    return MultimediaPoller.instance;
  }

  // Main poll method - syncs music metadata from S3
  public async poll(): Promise<MusicMetadataSyncResult> {
    if (this.isPolling) {
      throw new Error('Music poller is already running');
    }

    this.isPolling = true;
    const startTime = new Date();
    const result: MusicMetadataSyncResult = {
      syncedAlbums: 0,
      syncedTracks: 0,
      errors: [],
      timestamp: startTime,
    };

    try {
      await this.logPollStart(MusicPollingType.METADATA);

      // Sync albums and tracks from S3
      const syncResult = await this.syncMetadataFromS3();
      result.syncedAlbums = syncResult.syncedAlbums;
      result.syncedTracks = syncResult.syncedTracks;
      result.errors = syncResult.errors;

      // Update play counts and statistics
      await this.updateStatistics();

      await this.logPollComplete(MusicPollingType.METADATA, 'success', {
        syncedAlbums: result.syncedAlbums,
        syncedTracks: result.syncedTracks,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      
      await this.logPollComplete(MusicPollingType.METADATA, 'error', undefined, errorMessage);
      throw error;
    } finally {
      this.isPolling = false;
    }

    return result;
  }

  // Get statistics about the music library
  public async getStats(userId?: string): Promise<MusicPollStats> {
    try {
      const albumConditions = userId ? eq(multimediaAlbums.userId, userId) : undefined;
      const trackConditions = userId 
        ? sql`${multimediaTracks.albumId} IN (SELECT id FROM ${multimediaAlbums} WHERE ${eq(multimediaAlbums.userId, userId)})`
        : undefined;

      const [albumStats, trackStats, linkStats, playStats] = await Promise.all([
        // Album statistics
        db.select({
          total: count(),
          published: sql<number>`SUM(CASE WHEN ${multimediaAlbums.status} = 'published' THEN 1 ELSE 0 END)`,
          draft: sql<number>`SUM(CASE WHEN ${multimediaAlbums.status} = 'draft' THEN 1 ELSE 0 END)`,
          archived: sql<number>`SUM(CASE WHEN ${multimediaAlbums.status} = 'archived' THEN 1 ELSE 0 END)`,
        }).from(multimediaAlbums).where(albumConditions || sql`1=1`),
        
        // Track statistics
        db.select({
          total: count(),
          active: sql<number>`SUM(CASE WHEN ${multimediaTracks.status} = 'active' THEN 1 ELSE 0 END)`,
          inactive: sql<number>`SUM(CASE WHEN ${multimediaTracks.status} = 'inactive' THEN 1 ELSE 0 END)`,
        }).from(multimediaTracks).where(trackConditions || sql`1=1`),
        
        // Link statistics
        db.select({
          total: count(),
          active: sql<number>`SUM(CASE WHEN ${multimediaLinks.status} = 'active' THEN 1 ELSE 0 END)`,
        }).from(multimediaLinks).where(userId ? eq(multimediaLinks.userId, userId) : undefined),
        
        // Total play count
        db.select({
          totalPlays: sql<number>`SUM(${multimediaTracks.playCount})`,
        }).from(multimediaTracks).where(trackConditions || sql`1=1`),
      ]);

      const lastPoll = await db.select()
        .from(multimediaPollingLogs)
        .where(eq(multimediaPollingLogs.pollType, MusicPollingType.METADATA))
        .orderBy(desc(multimediaPollingLogs.startedAt))
        .limit(1);

      return {
        totalAlbums: Number(albumStats[0]?.total || 0),
        totalTracks: Number(trackStats[0]?.total || 0),
        totalLinks: Number(linkStats[0]?.total || 0),
        totalPlayCount: Number(playStats[0]?.totalPlays || 0),
        publishedAlbums: Number(albumStats[0]?.published || 0),
        draftAlbums: Number(albumStats[0]?.draft || 0),
        activeTracks: Number(trackStats[0]?.active || 0),
        activeLinks: Number(linkStats[0]?.active || 0),
        recentUploads: await this.getRecentUploadsCount(),
        storageUsed: await this.calculateStorageUsed(),
        lastPollTime: lastPoll[0]?.completedAt || null,
        pollStatus: this.isPolling ? 'polling' : 'idle',
      };
    } catch (error) {
      console.error('Error getting music stats:', error);
      throw error;
    }
  }

  // Sync metadata from S3 bucket
  private async syncMetadataFromS3(): Promise<MusicMetadataSyncResult> {
    const result: MusicMetadataSyncResult = {
      syncedAlbums: 0,
      syncedTracks: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      // List all MP3 files in S3
      const command = new ListObjectsV2Command({
        Bucket: this.config.s3Bucket,
        Prefix: 'albums/',
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return result;
      }

      // Group files by album
      const albumMap = new Map<string, string[]>();
      
      for (const obj of response.Contents) {
        if (obj.Key && obj.Key.endsWith('.mp3')) {
          const parts = obj.Key.split('/');
          if (parts.length >= 3) {
            const albumKey = `${parts[0]}/${parts[1]}`;
            if (!albumMap.has(albumKey)) {
              albumMap.set(albumKey, []);
            }
            albumMap.get(albumKey)!.push(obj.Key);
          }
        }
      }

      // Sync each album
      for (const [albumKey, trackKeys] of albumMap.entries()) {
        try {
          await this.syncAlbumFromS3(albumKey, trackKeys);
          result.syncedAlbums++;
          result.syncedTracks += trackKeys.length;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync album ${albumKey}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`S3 sync failed: ${errorMessage}`);
    }

    return result;
  }

  // Sync individual album from S3
  private async syncAlbumFromS3(albumKey: string, trackKeys: string[]): Promise<void> {
    const parts = albumKey.split('/');
    const albumId = parts[1];
    
    // Check if album exists
    const existingAlbum = await db.select()
      .from(multimediaAlbums)
      .where(eq(multimediaAlbums.id, parseInt(albumId)))
      .limit(1);

    if (existingAlbum.length === 0) {
      // Create album if it doesn't exist
      await db.insert(multimediaAlbums).values({
        title: `Album ${albumId}`,
        artist: 'Unknown Artist',
        coverArt: `/default-album-art.jpg`,
        status: 'draft',
        isPublic: false,
      });
    }

    // Sync tracks
    for (let i = 0; i < trackKeys.length; i++) {
      const trackKey = trackKeys[i];
      const trackNumber = i + 1;
      
      const existingTrack = await db.select()
        .from(multimediaTracks)
        .where(eq(multimediaTracks.fileUrl, trackKey))
        .limit(1);

      if (existingTrack.length === 0) {
        // Get track metadata from S3
        const headCommand = new HeadObjectCommand({
          Bucket: this.config.s3Bucket,
          Key: trackKey,
        });
        
        const metadata = await this.s3Client.send(headCommand);
        
        await db.insert(multimediaTracks).values({
          albumId: parseInt(albumId),
          title: `Track ${trackNumber}`,
          trackNumber,
          fileUrl: trackKey,
          fileType: metadata.ContentType || 'audio/mpeg',
          duration: metadata.ContentLength ? Math.floor(metadata.ContentLength / 1000) : null,
          status: 'active',
        });
      }
    }
  }

  // Update statistics
  private async updateStatistics(): Promise<void> {
    // Update play counts and other analytics
    await db.execute(sql`
      UPDATE ${multimediaTracks}
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{lastUpdated}',
        to_jsonb(NOW())
      )
      WHERE ${multimediaTracks.status} = 'active'
    `);
  }

  // Get recent uploads count (last 30 days)
  private async getRecentUploadsCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.select({
      count: count(),
    }).from(multimediaTracks)
      .where(sql`${multimediaTracks.createdAt} >= ${thirtyDaysAgo}`);

    return Number(result[0]?.count || 0);
  }

  // Calculate storage used
  private async calculateStorageUsed(): Promise<string> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.s3Bucket,
        Prefix: 'albums/',
      });

      const response = await this.s3Client.send(command);
      let totalBytes = 0;

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Key.endsWith('.mp3')) {
            totalBytes += obj.Size || 0;
          }
        }
      }

      // Convert to human-readable format
      const gb = totalBytes / (1024 * 1024 * 1024);
      return `${gb.toFixed(2)} GB`;
    } catch (error) {
      console.error('Error calculating storage used:', error);
      return '0 GB';
    }
  }

  // Log poll start
  private async logPollStart(pollType: MusicPollingType): Promise<void> {
  try {
    await db.insert(multimediaPollingLogs).values({
      pollType,
      status: 'in_progress',
      startedAt: new Date(),
      message: 'Poll started',
    });
  } catch (error) {
    console.error('Failed to log poll start:', error);
    // Don't throw - polling should continue even if logging fails
  }
}
  // Log poll completion
  private async logPollComplete(
  pollType: MusicPollingType,
  status: 'success' | 'error',
  metadata?: any,
  error?: string
): Promise<void> {
  try {
    await db.insert(multimediaPollingLogs).values({
      pollType,
      status,
      message: status === 'success' ? 'Poll completed successfully' : 'Poll failed',
      metadata: metadata || null,
      completedAt: new Date(),
      error: error || null,
    });
  } catch (error) {
    console.error('Failed to log poll completion:', error);
    // Don't throw - polling should continue even if logging fails
  }
}

  // Start automatic polling
  public startPolling(): void {
    if (this.pollInterval) {
      return;
    }

    this.pollInterval = setInterval(async () => {
      try {
        await this.poll();
      } catch (error) {
        console.error('Auto-poll error:', error);
      }
    }, this.config.pollInterval);
  }

  // Stop automatic polling
  public stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Get polling status
  public getPollingStatus(): { isPolling: boolean; config: MultimediaPollerConfig } {
    return {
      isPolling: this.isPolling,
      config: this.config,
    };
  }

  // Increment track play count
  public async incrementPlayCount(trackId: number): Promise<void> {
    await db.update(multimediaTracks)
      .set({
        playCount: sql`${multimediaTracks.playCount} + 1`,
      })
      .where(eq(multimediaTracks.id, trackId));
  }
}

// Export singleton instance
export const multimediaPoller = MultimediaPoller.getInstance();
