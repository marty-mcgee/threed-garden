// src/app/api/chp-cad/seed/chp-cad-centers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { chpCadCenters } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// All CHP Communications Centers with correct codes from the HTML dropdown
const ALL_CENTERS = [
  // Northern Region
  { centerCode: 'SACC', centerName: 'Sacramento', county: 'Sacramento', region: 'Northern' },
  { centerCode: 'CHCC', centerName: 'Chico', county: 'Butte', region: 'Northern' },
  { centerCode: 'HMCC', centerName: 'Humboldt', county: 'Humboldt', region: 'Northern' },
  { centerCode: 'RDCC', centerName: 'Redding', county: 'Shasta', region: 'Northern' },
  { centerCode: 'SUCC', centerName: 'Susanville', county: 'Lassen', region: 'Northern' },
  { centerCode: 'TKCC', centerName: 'Truckee', county: 'Nevada', region: 'Northern' },
  { centerCode: 'UKCC', centerName: 'Ukiah', county: 'Mendocino', region: 'Northern' },
  { centerCode: 'YKCC', centerName: 'Yreka', county: 'Siskiyou', region: 'Northern' },
  
  // Bay Area Region
  { centerCode: 'CCCC', centerName: 'Capitol', county: 'Sacramento', region: 'Bay Area' },
  { centerCode: 'GGCC', centerName: 'Golden Gate', county: 'San Francisco', region: 'Bay Area' },
  { centerCode: 'MYCC', centerName: 'Monterey', county: 'Monterey', region: 'Bay Area' },
  { centerCode: 'SLCC', centerName: 'San Luis Obispo', county: 'San Luis Obispo', region: 'Bay Area' },
  { centerCode: 'SKCCSTCC', centerName: 'Stockton', county: 'San Joaquin', region: 'Bay Area' },
  
  // Central Region
  { centerCode: 'BFCC', centerName: 'Bakersfield', county: 'Kern', region: 'Central' },
  { centerCode: 'FRCC', centerName: 'Fresno', county: 'Fresno', region: 'Central' },
  { centerCode: 'MRCC', centerName: 'Merced', county: 'Merced', region: 'Central' },
  
  // Southern Region
  { centerCode: 'BSCC', centerName: 'Barstow', county: 'San Bernardino', region: 'Southern' },
  { centerCode: 'BICC', centerName: 'Bishop', county: 'Inyo', region: 'Southern' },
  { centerCode: 'BCCC', centerName: 'Border', county: 'San Diego', region: 'Southern' },
  { centerCode: 'ECCC', centerName: 'El Centro', county: 'Imperial', region: 'Southern' },
  { centerCode: 'ICCC', centerName: 'Indio', county: 'Riverside', region: 'Southern' },
  { centerCode: 'INCC', centerName: 'Inland', county: 'San Bernardino', region: 'Southern' },
  { centerCode: 'LACC', centerName: 'Los Angeles', county: 'Los Angeles', region: 'Southern' },
  { centerCode: 'OCCC', centerName: 'Orange', county: 'Orange', region: 'Southern' },
  { centerCode: 'VTCC', centerName: 'Ventura', county: 'Ventura', region: 'Southern' },
];

export async function GET() {
  try {
    let inserted = 0;
    let skipped = 0;
    
    for (const center of ALL_CENTERS) {
      // Check if center already exists
      const conditions = [eq(chpCadCenters.centerCode, center.centerCode)];
      const whereClause = and(...conditions);
      
      const existing = await db
        .select()
        .from(chpCadCenters)
        .where(whereClause)
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(chpCadCenters).values({
          centerCode: center.centerCode,
          centerName: center.centerName,
          county: center.county,
          region: center.region,
          isActive: true,
        });
        inserted++;
        console.log(`  ✓ Inserted ${center.centerName} (${center.centerCode})`);
      } else {
        skipped++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'CHP CAD Centers seeded successfully',
      stats: { 
        inserted, 
        skipped, 
        total: ALL_CENTERS.length,
        centers: ALL_CENTERS.map(c => ({ code: c.centerCode, name: c.centerName }))
      }
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}