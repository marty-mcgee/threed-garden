// app/api/cctv/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { cctvCameras } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const route = searchParams.get('route');
  
  let query = db.select().from(cctvCameras).where(eq(cctvCameras.inService, true));
  
  if (district) {
    query = query.where(eq(cctvCameras.district, parseInt(district)));
  }
  if (route) {
    query = query.where(eq(cctvCameras.route, route));
  }
  
  const cameras = await query;
  return NextResponse.json({ success: true, count: cameras.length, data: cameras });
}
