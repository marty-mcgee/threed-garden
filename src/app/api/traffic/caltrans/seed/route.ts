// app/api/caltrans/seed/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { caltransDistricts } from '@/lib/schema';

export const dynamic = 'force-dynamic';

// Add security for production
const SEED_SECRET = process.env.SEED_SECRET || 'seed-secret-key';

export async function GET(request: Request) {
  // Verify authorization (optional - remove for development)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${SEED_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  const db = drizzle(sql);
  
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
  
  try {
    let inserted = 0;
    let skipped = 0;
    
    for (const district of districtsData) {
      const result = await db.insert(caltransDistricts).values(district).onConflictDoNothing();
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
        console.debug(`✓ Inserted district ${district.districtId}: ${district.districtName}`);
      } else {
        skipped++;
        console.debug(`○ Skipped district ${district.districtId}: already exists`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeding completed',
      stats: { inserted, skipped, total: districtsData.length }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Seeding failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
