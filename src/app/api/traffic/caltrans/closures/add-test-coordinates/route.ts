// app/api/caltrans/closures/add-test-coordinates/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    // Get the first closure without coordinates
    const closures = await sql`
      SELECT closure_id, route, district 
      FROM lane_closures 
      WHERE (latitude IS NULL OR longitude IS NULL)
      LIMIT 5
    `;
    
    if (closures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No closures without coordinates found'
      });
    }
    
    // Add test coordinates based on district
    const districtCoordinates: Record<number, [number, number]> = {
      1: [40.789, -124.156],  // Eureka area
      2: [40.586, -122.391],  // Redding area
      3: [38.581, -121.494],  // Sacramento area
      4: [37.804, -122.271],  // Oakland/Bay Area
      5: [35.282, -120.660],  // San Luis Obispo
      6: [36.746, -119.773],  // Fresno area
      7: [34.052, -118.243],  // Los Angeles
      8: [34.108, -117.289],  // San Bernardino
      9: [37.369, -118.394],  // Bishop area
      10: [37.957, -121.290], // Stockton area
      11: [32.715, -117.161], // San Diego
      12: [33.684, -117.826]  // Irvine/Orange County
    };
    
    let updated = 0;
    for (const closure of closures) {
      const coords = districtCoordinates[closure.district] || [36.7783, -119.4179]; // Default to center of CA
      
      await sql`
        UPDATE lane_closures 
        SET latitude = ${coords[0]}, 
            longitude = ${coords[1]}
        WHERE closure_id = ${closure.closure_id}
      `;
      updated++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Added test coordinates to ${updated} closure(s)`,
      updated_closures: closures.map(c => ({
        id: c.closure_id,
        route: c.route,
        district: c.district
      }))
    });
    
  } catch (error) {
    console.error('Add test coordinates error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
