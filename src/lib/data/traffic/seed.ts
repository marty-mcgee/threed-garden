// @/lib/db/seed.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { caltransDistricts } from '@/lib/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const districtsData = [
  { districtId: 1, districtName: 'Eureka', region: 'North', counties: ['Del Norte', 'Humboldt', 'Lake', 'Mendocino', 'Sonoma'] },
  { districtId: 2, districtName: 'Redding', region: 'North', counties: ['Lassen', 'Modoc', 'Plumas', 'Shasta', 'Sierra', 'Siskiyou', 'Tehama', 'Trinity'] },
  { districtId: 3, districtName: 'Marysville', region: 'North Central', counties: ['Butte', 'Colusa', 'El Dorado', 'Glenn', 'Nevada', 'Placer', 'Sacramento', 'Sutter', 'Yolo', 'Yuba'] },
  { districtId: 4, districtName: 'Oakland', region: 'Bay Area', counties: ['Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano'] },
  { districtId: 5, districtName: 'San Luis Obispo', region: 'Central', counties: ['Monterey', 'San Benito', 'San Luis Obispo', 'Santa Barbara', 'Santa Cruz'] },
  { districtId: 6, districtName: 'Fresno', region: 'Central', counties: ['Fresno', 'Kern', 'Kings', 'Madera', 'Mariposa', 'Merced', 'Tulare'] },
  { districtId: 7, districtName: 'Los Angeles', region: 'South', counties: ['Los Angeles', 'Ventura'] },
  { districtId: 8, districtName: 'San Bernardino', region: 'South', counties: ['Inyo', 'Mono', 'Riverside', 'San Bernardino'] },
  { districtId: 9, districtName: 'Bishop', region: 'South', counties: ['Inyo', 'Mono'] },
  { districtId: 10, districtName: 'Stockton', region: 'Central', counties: ['Alpine', 'Amador', 'Calaveras', 'Mono', 'San Joaquin', 'Stanislaus', 'Tuolumne'] },
  { districtId: 11, districtName: 'San Diego', region: 'South', counties: ['Imperial', 'San Diego'] },
  { districtId: 12, districtName: 'Irvine', region: 'South', counties: ['Orange'] },
];

async function seed() {
  console.log('🌱 Seeding database...');
  
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  const db = drizzle(sql);
  
  try {
    for (const district of districtsData) {
      await db.insert(caltransDistricts).values(district).onConflictDoNothing();
      console.log(`✓ Inserted district ${district.districtId}: ${district.districtName}`);
    }
    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
