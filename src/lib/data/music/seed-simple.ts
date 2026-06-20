// lib/db/seed-simple.ts
import { db } from '@/lib/db/client';
import { musicAlbums, musicTracks } from '@/lib/schema';
import { AlbumStatus, TrackStatus } from '@/lib/types/music';
import { sql } from 'drizzle-orm';

async function getFirstUserId() {
  const result = await db.execute(sql`SELECT id FROM "user" LIMIT 1`);
  return result.rows[0]?.id;
}

const albumsData = [
  // {
  //   title: "Trouble",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Trouble.jpg",
  //   releaseYear: 2024,
  //   description: "You know your job is divine.. make a speech, bait the hook, and drop the line.",
  //   tracks: [
  //     {
  //       title: "Trouble",
  //       duration: 210,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-trouble.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Decide",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Decide.jpg",
  //   releaseYear: 2024,
  //   description: "You know your job is divine.. make a speech, bait the hook, and drop the line.",
  //   tracks: [
  //     {
  //       title: "Decide",
  //       duration: 210,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-decide.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Selfish Phase",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Selfish-Phase.jpg",
  //   releaseYear: 2020,
  //   description: "First you kill the eyes. Then you kill the smile. You leave the heart to sing. The lyrics that you choose.",
  //   tracks: [
  //     {
  //       title: "nVomitous",
  //       duration: 282,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-nvomitous.mp3"
  //     },
  //     {
  //       title: "New Design",
  //       duration: 272,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-new-design.mp3"
  //     },
  //     {
  //       title: "Conversate",
  //       duration: 294,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-conversate.mp3"
  //     },
  //     {
  //       title: "Womb",
  //       duration: 427,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-womb.mp3"
  //     },
  //     {
  //       title: "Vice Conversion",
  //       duration: 218,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-vice-conversion.mp3"
  //     },
  //     {
  //       title: "Innocent",
  //       duration: 313,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-innocent.mp3"
  //     },
  //     {
  //       title: "This Disease",
  //       duration: 390,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-this-disease.mp3"
  //     },
  //     {
  //       title: "Manhattan",
  //       duration: 328,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-manhattan.mp3"
  //     },
  //     {
  //       title: "Sailing",
  //       duration: 187,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-sailing.mp3"
  //     },
  //     {
  //       title: "Antidote",
  //       duration: 320,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-antidote.mp3"
  //     },
  //     {
  //       title: "Eleven",
  //       duration: 259,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-eleven.mp3"
  //     },
  //   ]
  // },
  // {
  //   title: "Sit Back",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Sit-Back.jpg",
  //   releaseYear: 2007,
  //   description: "Sit back, watch the days go by.. until somebody tells me to see.",
  //   tracks: [
  //     {
  //       title: "Sit Back",
  //       duration: 185,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-sit-back.mp3"
  //     },
  //     {
  //       title: "nVomitous",
  //       duration: 234,
  //       trackNumber: 2,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-nvomitous.mp3"
  //     },
  //     {
  //       title: "New Design",
  //       duration: 245,
  //       trackNumber: 3,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-new-design.mp3"
  //     },
  //     {
  //       title: "Greats",
  //       duration: 198,
  //       trackNumber: 4,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-greats.mp3"
  //     },
  //     {
  //       title: "The Fat",
  //       duration: 240,
  //       trackNumber: 5,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-the-fat.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Neat and Fool",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Neat-and-Fool.jpg",
  //   releaseYear: 2016,
  //   description: "Funky off-beat instrumental chill.",
  //   tracks: [
  //     {
  //       title: "Neat and Fool",
  //       duration: 220,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-neat-and-fool.mp3"
  //     },
  //     {
  //       title: "Tea Among Colleagues",
  //       duration: 300,
  //       trackNumber: 2,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-tea-among-colleagues.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "MesMerized",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-MesMerized.jpg",
  //   releaseYear: 2001,
  //   description: "I'm missing the silent voices of you.",
  //   tracks: [
  //     {
  //       title: "MesMerized",
  //       duration: 210,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-mesmerized.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Salesman",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Salesman.jpg",
  //   releaseYear: 1999,
  //   description: "You know your job is divine.. make a speech, bait the hook, and drop the line.",
  //   tracks: [
  //     {
  //       title: "Salesman",
  //       duration: 210,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-salesman.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Sit Back",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Sit-Back.jpg",
  //   releaseYear: 2007,
  //   description: "Sit back, watch the days go by.. until somebody tells me to see.",
  //   tracks: [
  //     {
  //       title: "Sit Back",
  //       duration: 185,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-sit-back.mp3"
  //     },
  //     {
  //       title: "nVomitous",
  //       duration: 234,
  //       trackNumber: 2,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-nvomitous.mp3"
  //     },
  //     {
  //       title: "New Design",
  //       duration: 245,
  //       trackNumber: 3,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-new-design.mp3"
  //     },
  //     {
  //       title: "Greats",
  //       duration: 198,
  //       trackNumber: 4,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-greats.mp3"
  //     },
  //     {
  //       title: "The Fat",
  //       duration: 240,
  //       trackNumber: 5,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-the-fat.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "Neat and Fool",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-Neat-and-Fool.jpg",
  //   releaseYear: 2016,
  //   description: "Funky off-beat instrumental chill.",
  //   tracks: [
  //     {
  //       title: "Neat and Fool",
  //       duration: 220,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-neat-and-fool.mp3"
  //     },
  //     {
  //       title: "Tea Among Colleagues",
  //       duration: 300,
  //       trackNumber: 2,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-tea-among-colleagues.mp3"
  //     }
  //   ]
  // },
  // {
  //   title: "MesMerized",
  //   artist: "Marty McGee",
  //   coverArt: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/art/Marty-McGee-Music-MesMerized.jpg",
  //   releaseYear: 2001,
  //   description: "I'm missing the silent voices of you.",
  //   tracks: [
  //     {
  //       title: "MesMerized",
  //       duration: 210,
  //       trackNumber: 1,
  //       publicUrl: "https://threedpublic.s3.us-west-2.amazonaws.com/marty-mcgee/music/albums/tracks/mm-mesmerized.mp3"
  //     }
  //   ]
  // },
];

async function seedSimple() {
  console.log('🎵 Starting simple seed...\n');

  const userId = await getFirstUserId();
  if (!userId) {
    console.error('❌ No user found. Please sign up first.');
    process.exit(1);
  }

  // for (const albumData of albumsData) {
  //   const [album] = await db.insert(musicAlbums).values({
  //     userId,
  //     title: albumData.title,
  //     artist: albumData.artist,
  //     coverArt: albumData.coverArt,
  //     releaseYear: albumData.releaseYear,
  //     description: albumData.description,
  //     status: AlbumStatus.PUBLISHED,
  //     isPublic: true,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   }).returning();

  //   console.log(`✅ Album: ${album.title}`);

  //   for (const track of albumData.tracks) {
  //     await db.insert(musicTracks).values({
  //       albumId: album.id,
  //       title: track.title,
  //       duration: track.duration,
  //       trackNumber: track.trackNumber,
  //       publicUrl: track.publicUrl,
  //       status: TrackStatus.ACTIVE,
  //       playCount: 0,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });
  //     console.log(`  🎵 Track: ${track.title}`);
  //   }
  // }

  console.log('\n✨ Seeding complete!');
}

seedSimple();