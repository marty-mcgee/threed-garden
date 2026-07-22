import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {};
  
  try {
    // Test 1: Direct axios call from your server
    console.log('Test 1: Direct API call from server');
    const response = await axios.get('https://data.ca.gov/api/3/action/datastore_search', {
      params: {
        resource_id: 'b8ce0ca4-b4e9-490d-b4d1-1f4ec48cbefb',
        limit: 5,
        sort: 'Crash Date Time desc'
      },
      headers: { 'User-Agent': 'CHP-Data-Collector/1.0' },
      timeout: 30000
    });
    
    results.direct_call = {
      success: response.data?.success,
      record_count: response.data?.result?.records?.length || 0,
      first_record_date: response.data?.result?.records?.[0]?.['Crash Date Time'],
      error: null
    };
    
    // Test 2: Check what your CHPPoller's fetchCollisionsWithoutDateFilter returns
    const { CHPPoller } = await import('@/lib/services/traffic/CHPPoller');
    const poller = new CHPPoller();
    
    // Try to access the private method via any hack - or we can add a public test method
    results.poller_status = {
      polling_active: poller.isPollingActive(),
      message: 'CHPPoller instance created'
    };
    
    // Test 3: Try a simple fetch with no sort parameter
    console.log('Test 3: Simple fetch with no sort');
    const simpleResponse = await axios.get('https://data.ca.gov/api/3/action/datastore_search', {
      params: {
        resource_id: 'b8ce0ca4-b4e9-490d-b4d1-1f4ec48cbefb',
        limit: 5
      }
    });
    
    results.simple_call = {
      success: simpleResponse.data?.success,
      record_count: simpleResponse.data?.result?.records?.length || 0,
      first_record_date: simpleResponse.data?.result?.records?.[0]?.['Crash Date Time']
    };
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}