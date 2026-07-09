// app/api/traffic/all/route.ts
import { NextResponse } from 'next/server';
import { fetchTrafficData } from '@/lib/services/traffic/TrafficService';

export async function GET() {
  try {
    const data = await fetchTrafficData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}