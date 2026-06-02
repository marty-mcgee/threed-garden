// src/app/api/debug/api-structures/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // 1. Caltrans API - Test multiple districts
  results.caltrans = {};
  const districts = [3, 4, 7, 10]; // Test districts that typically have data
  
  for (const district of districts) {
    try {
      const url = `https://cwwp2.dot.ca.gov/data/d${district}/lcs/lcsStatusD${district.toString().padStart(2, '0')}.json`;
      const response = await axios.get(url, { timeout: 10000 });
      const closureCount = response.data?.lcsClosures?.length || 0;
      results.caltrans[`district_${district}`] = {
        url,
        status: response.status,
        closureCount,
        hasData: closureCount > 0,
        sampleKeys: closureCount > 0 ? Object.keys(response.data.lcsClosures[0]) : [],
      };
    } catch (error: any) {
      results.caltrans[`district_${district}`] = { error: error.message };
    }
  }

  // 2. Bay Area 511 API
  try {
    const apiKey = process.env.BAY_AREA_511_API_KEY;
    if (!apiKey) {
      results.bayArea511 = { error: 'BAY_AREA_511_API_KEY not set' };
    } else {
      const response = await axios.get('http://api.511.org/traffic/events', {
        params: { api_key: apiKey, format: 'json' },
        timeout: 10000,
      });
      const events = response.data;
      results.bayArea511 = {
        status: response.status,
        eventCount: Array.isArray(events) ? events.length : 0,
        hasData: Array.isArray(events) && events.length > 0,
        sampleKeys: Array.isArray(events) && events.length > 0 ? Object.keys(events[0]) : [],
        sampleData: Array.isArray(events) && events.length > 0 ? events[0] : null,
      };
    }
  } catch (error: any) {
    results.bayArea511 = { error: error.message };
  }

  // 3. CHP CKAN API - Try multiple resource IDs
  const resourceIds = [
    'b8ce0ca4-b4e9-490d-b4d1-1f4ec48cbefb',  // Original
    // 'eaa313e1-3263-4c7e-a2fc-bac2a417faaa',  // Road Traffic Injuries
    // '611e6c08-7a0a-472d-8cbd-4c97fcabfe0a',  // Another possible ID
  ];
  
  results.chpCkan = {};
  for (const resourceId of resourceIds) {
    try {
      const response = await axios.get('https://data.ca.gov/api/3/action/datastore_search', {
        params: { resource_id: resourceId, limit: 1 },
        timeout: 10000,
      });
      const record = response.data?.result?.records?.[0];
      results.chpCkan[resourceId] = {
        status: response.status,
        success: response.data?.success,
        total: response.data?.result?.total,
        hasData: !!record,
        sampleKeys: record ? Object.keys(record) : [],
      };
    } catch (error: any) {
      results.chpCkan[resourceId] = { error: error.message };
    }
  }

  // 4. Also search for the correct resource ID
  try {
    const searchResult = await axios.get('https://data.ca.gov/api/3/action/package_search', {
      params: { q: 'chp collision' },
      timeout: 10000,
    });
    const packages = searchResult.data?.result?.results || [];
    results.chpSearch = {
      found: packages.length,
      packages: packages.slice(0, 3).map((p: any) => ({
        title: p.title,
        resources: p.resources?.map((r: any) => ({ id: r.id, name: r.name, format: r.format })),
      })),
    };
  } catch (error: any) {
    results.chpSearch = { error: error.message };
  }

  return NextResponse.json({
    success: true,
    message: 'API Structure Debug - Compare these field names with your database schema',
    results,
  });
}