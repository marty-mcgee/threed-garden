// src/app/api/bay-area-511/debug/route.ts
import { NextResponse } from 'next/server';
import { BayArea511Poller } from '@/lib/services/traffic/BayArea511Poller';

export const dynamic = 'force-dynamic';

export async function GET() {
  const poller = new BayArea511Poller();
  
  const results: any = {};
  
  // Test 1: Check API key
  results.apiKey = {
    exists: !!process.env.BAY_AREA_511_API_KEY,
    length: process.env.BAY_AREA_511_API_KEY?.length || 0
  };
  
  // Test 2: Direct API call
  try {
    const response = await fetch(
      `http://api.511.org/traffic/events?api_key=${process.env.BAY_AREA_511_API_KEY}&format=json`
    );
    const data = await response.json();
    // Return a sample of the first event with all its fields
    const sample = Array.isArray(data) ? data[0] : (data.events?.[0] || null);

    results.directApi = {
      status: response.status,
      isArray: Array.isArray(data),
      // count: Array.isArray(data) ? data.length : 0,
      // sample: Array.isArray(data) && data.length > 0 ? data[0] : data,
      // new
      totalEvents: Array.isArray(data) ? data.length : (data.events?.length || 0),
      sampleEvent: sample,
      allFields: sample ? Object.keys(sample) : []
    };
  } catch (error) {
    results.directApi = { error: String(error) };
  }
  
  // Test 3: Poller fetch
  try {
    const events = await poller.fetchEvents();
    results.pollerFetch = {
      success: true,
      count: events.length,
      sample: events.length > 0 ? events[0] : null
    };
  } catch (error) {
    results.pollerFetch = { error: String(error) };
  }
  
  return NextResponse.json(results);
}