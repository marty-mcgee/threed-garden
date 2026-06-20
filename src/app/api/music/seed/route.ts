import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
// import { auth } from '@/lib/auth/server';
import { minimalAuth as auth } from "@/lib/auth/minimal-server";
import { musicAlbums, musicTracks, musicLinks } from '@/lib/schema';
import { MusicLinkType, AlbumStatus, TrackStatus } from '@/lib/types/music';

export async function POST(request: NextRequest) {
  try {
    // Get session using Better Auth server API
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sampleData = true } = await request.json();

    if (!sampleData) {
      return NextResponse.json({ error: 'No seed data specified' }, { status: 400 });
    }

    // Seed sample albums
    const albums = await db.insert(musicAlbums).values([
      {
        userId: session.user.id,
        title: 'Midnight Dreams',
        artist: session.user.email?.split('@')[0] || 'Artist',
        coverArt: 'https://picsum.photos/400/400?random=1',
        releaseYear: 2024,
        description: 'A journey through ambient electronic landscapes',
        status: AlbumStatus.PUBLISHED,
        isPublic: true,
      },
      {
        userId: session.user.id,
        title: 'Urban Echoes',
        artist: session.user.email?.split('@')[0] || 'Artist',
        coverArt: 'https://picsum.photos/400/400?random=2',
        releaseYear: 2023,
        description: 'City-inspired beats and melodies',
        status: AlbumStatus.PUBLISHED,
        isPublic: true,
      },
      {
        userId: session.user.id,
        title: 'Acoustic Sessions',
        artist: session.user.email?.split('@')[0] || 'Artist',
        coverArt: 'https://picsum.photos/400/400?random=3',
        releaseYear: 2024,
        description: 'Raw and intimate acoustic performances',
        status: AlbumStatus.PUBLISHED,
        isPublic: true,
      },
    ]).returning();

    // Seed tracks for each album
    for (const album of albums) {
      const trackCount = album.id === albums[0].id ? 10 : album.id === albums[1].id ? 8 : 6;
      
      for (let i = 1; i <= trackCount; i++) {
        await db.insert(musicTracks).values({
          albumId: album.id,
          title: `Track ${i}`,
          duration: 180 + (i * 10),
          trackNumber: i,
          publicUrl: `albums/${album.id}/track${i}.mp3`,
          status: TrackStatus.ACTIVE,
        });
      }
    }

    // Seed independent links
    await db.insert(musicLinks).values([
      {
        userId: session.user.id,
        title: 'Spotify',
        url: 'https://spotify.com',
        type: MusicLinkType.STREAM,
        description: 'Listen on Spotify',
        displayOrder: 1,
      },
      {
        userId: session.user.id,
        title: 'Instagram',
        url: 'https://instagram.com',
        type: MusicLinkType.SOCIAL,
        description: 'Follow on Instagram',
        displayOrder: 2,
      },
      {
        userId: session.user.id,
        title: 'Bandcamp',
        url: 'https://bandcamp.com',
        type: MusicLinkType.BUY,
        description: 'Buy music on Bandcamp',
        displayOrder: 3,
      },
      {
        userId: session.user.id,
        title: 'YouTube',
        url: 'https://youtube.com',
        type: MusicLinkType.VIDEO,
        description: 'Watch music videos',
        displayOrder: 4,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `Seeded ${albums.length} albums with tracks and links`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}