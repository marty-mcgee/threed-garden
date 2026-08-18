// lib/scripts/sync-sequences.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

// List of all tables with serial sequences
const TABLES = [
  'music_albums',
  'music_tracks',
  'music_links',
  'music_media',
  'music_album_links',
  'music_polling_logs',
  'music_playback_history',
  'threed_plants',
  'threed_beds',
  'threed_plantings',
  'threed_farmbots',
  'threed_models',
  'threed_characters',
  'threed_tasks',
  'threed_harvests',
  'threed_weather_logs',
  'threed_watering_schedules',
  'threed_watering_history',
  'threed_layers',
  'threed_markers',
  'threed_marker_relationships',
  'threed_layer_presets',
  'traffic_chp_cad_incidents',
  'traffic_chp_collisions',
  'traffic_lane_closures',
  'traffic_bay_area_511_events',
  'traffic_calfire_incidents',
  'traffic_cctv_cameras',
  'traffic_api_request_logs',
];

async function syncAllSequences() {
  console.log('🔄 Syncing all sequences...');
  
  for (const table of TABLES) {
    try {
      const [maxResult] = await db
        .select({ maxId: sql<number>`COALESCE(MAX(id), 0)` })
        .from(sql`${sql.identifier(table)}`);
      
      const maxId = maxResult?.maxId || 0;
      const nextVal = maxId + 1;
      
      await db.execute(sql`
        SELECT setval(${table + '_id_seq'}, ${nextVal})
      `);
      
      console.log(`✅ ${table}: sequence set to ${nextVal} (max id: ${maxId})`);
    } catch (error) {
      console.error(`❌ Error syncing ${table}:`, error);
    }
  }
  
  console.log('✅ All sequences synced!');
}

// Run if this file is executed directly
if (require.main === module) {
  syncAllSequences()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { syncAllSequences };
