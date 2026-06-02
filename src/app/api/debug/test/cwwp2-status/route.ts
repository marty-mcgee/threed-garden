// app/api/test/cwwp2-status/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    districts: {}
  };
  
  // Test all 12 districts for Lane Closure data
  for (let district = 1; district <= 12; district++) {
    try {
      const url = `https://cwwp2.dot.ca.gov/data/d${district}/lcs/lcsStatusD${district.toString().padStart(2, '0')}.json`;
      const startTime = Date.now();
      
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: (status) => status === 200 || status === 404
      });
      
      const responseTime = Date.now() - startTime;
      const hasData = response.status === 200 && response.data?.lcsClosures?.length > 0;
      
      results.districts[district] = {
        status: response.status,
        hasData: hasData,
        recordCount: response.data?.lcsClosures?.length || 0,
        responseTimeMs: responseTime,
        url: url
      };
      
      // If has data, capture a sample
      if (hasData && response.data?.lcsClosures?.length > 0) {
        results.districts[district].sample = response.data.lcsClosures.slice(0, 2);
      }
      
    } catch (error) {
      results.districts[district] = {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      };
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Add summary
  const districtsWithData = Object.entries(results.districts)
    .filter(([_, d]: [string, any]) => d.hasData === true)
    .map(([id]) => parseInt(id));
  
  results.summary = {
    totalDistricts: 12,
    districtsWithData: districtsWithData,
    countWithData: districtsWithData.length,
    message: districtsWithData.length === 0 
      ? "No districts have active lane closures right now. Try running during daytime hours (9 AM - 5 PM PT) when construction is active."
      : `Found data in districts: ${districtsWithData.join(', ')}`
  };
  
  return NextResponse.json(results);
}
