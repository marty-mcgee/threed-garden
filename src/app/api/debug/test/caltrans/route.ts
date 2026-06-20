// app/api/test/caltrans/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {};
  
  // Test District 7 (Los Angeles) - usually has data
  const testDistricts = [1,2,7];
  
  for (const district of testDistricts) {
    try {
      const url = `https://cwwp2.dot.ca.gov/data/d${district}/lcs/lcsStatusD${district.toString().padStart(2, '0')}.json`;
      console.log(`Fetching: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: (status) => status === 200 || status === 404
      });
      
      results[`district_${district}`] = {
        status: response.status,
        has_data: !!response.data?.lcsClosures,
        count: response.data?.lcsClosures?.length || 0,
        sample: response.data?.lcsClosures?.slice(0, 2) || null
      };
      
    } catch (error) {
      results[`district_${district}`] = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return NextResponse.json({
    message: "Testing Caltrans API endpoints",
    results,
    note: "If status is 404, no data for that district. If 200 with data, the poller should work."
  });
}
