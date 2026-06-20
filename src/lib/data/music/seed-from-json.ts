import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks } from '@/lib/schema';
import { AlbumStatus, TrackStatus } from '@/lib/types/music';
import seedData from './seed-data.json';
import { sql } from 'drizzle-orm';

async function getFirstUserId() {
  const result = await db.execute(sql`SELECT id FROM "user" LIMIT 1`);
  return result.rows[0]?.id;
}

async function seedFromJSON() {
  console.log('🎵 Starting JSON seed...\n');

  // Get the first user ID
  const userId = await getFirstUserId();
  
  if (!userId) {
    console.error('❌ No users found. Please create a user first via sign-up.');
    console.log('💡 Visit: http://localhost:3000/sign-up to create an account');
    process.exit(1);
  }

  console.log(`✅ Found user: ${userId}`);
  console.log(`📀 Loading ${seedData.albums.length} albums from JSON...\n`);

  let totalAlbums = 0;
  let totalTracks = 0;

  for (const albumData of seedData.albums) {
    console.log(`Processing album: ${albumData.title}`);

    // Insert album
    const [album] = await db.insert(musicAlbums).values({
      userId,
      title: albumData.title,
      artist: albumData.artist,
      coverArt: albumData.coverArt,
      releaseYear: albumData.releaseYear,
      description: albumData.description,
      status: albumData.status as AlbumStatus,
      isPublic: albumData.isPublic,
      metadata: albumData.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    totalAlbums++;
    console.log(`  ✅ Album created with ID: ${album.id}`);

    // Insert tracks for this album
    if (albumData.tracks && albumData.tracks.length > 0) {
      const tracksToInsert = albumData.tracks.map(track => ({
        albumId: album.id,
        title: track.title,
        duration: track.duration,
        trackNumber: track.trackNumber,
        publicUrl: track.publicUrl,
        status: TrackStatus.ACTIVE,
        lyrics: track.lyrics || null,
        metadata: track.metadata || null,
        playCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const insertedTracks = await db.insert(musicTracks).values(tracksToInsert).returning();
      totalTracks += insertedTracks.length;
      console.log(`  ✅ Added ${insertedTracks.length} tracks`);
    }
    console.log('');
  }

  console.log('✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  • ${totalAlbums} albums created`);
  console.log(`  • ${totalTracks} tracks created`);
  console.log('\n💡 Next steps:');
  console.log('  1. Visit: http://localhost:3000/dashboard/music');
  console.log('  2. Your albums should now appear in the music library');
  console.log('  3. Click play to test audio playback');
}

// Run the seed function
seedFromJSON().catch((error) => {
  console.error('\n❌ Seeding failed:', error);
  process.exit(1);
});