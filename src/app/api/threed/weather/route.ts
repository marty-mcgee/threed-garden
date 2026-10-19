import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedWeatherLogs } from '@/libraries/schema/threed';
import { weatherReadingColumns } from '@/libraries/services/threed/project-weather';

export const dynamic = 'force-dynamic';
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const decimal = (min: number, max: number) => z.union([z.number(), z.string().min(1).transform(Number)]).pipe(z.number().finite().min(min).max(max)).transform(String).nullable().optional();
const fields = z.object({
  temperature: decimal(-150, 160), humidity: decimal(0, 100), rainfallInches: decimal(0, 999.99),
  windSpeed: decimal(0, 500), soilMoisture: decimal(0, 100), sunlightHours: decimal(0, 24),
  recordedAt: z.string().datetime().optional(), frostWarning: z.boolean().optional(),
  heatWarning: z.boolean().optional(), droughtWarning: z.boolean().optional(), source: z.string().min(1).max(50).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ success: false, error: 'Unauthorized' }, 401);
    const params = new URL(request.url).searchParams;
    const limit = Number(params.get('limit') ?? 100), offset = Number(params.get('offset') ?? 0);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return respond({ success: false, error: 'Invalid pagination' }, 400);
    const conditions = [eq(threedWeatherLogs.userId, session.user.id)];
    for (const field of ['startDate', 'endDate'] as const) {
      const value = params.get(field);
      if (!value) continue;
      if (!Number.isFinite(Date.parse(value))) return respond({ success: false, error: 'Invalid date' }, 400);
      conditions.push(field === 'startDate' ? sql`${threedWeatherLogs.recordedAt} >= ${value}` : sql`${threedWeatherLogs.recordedAt} <= ${value}`);
    }
    if (params.get('hasWarnings') === 'true') conditions.push(sql`(${threedWeatherLogs.frostWarning} = true OR ${threedWeatherLogs.heatWarning} = true OR ${threedWeatherLogs.droughtWarning} = true)`);
    const where = and(...conditions);
    const rows = await db.select({ ...weatherReadingColumns, sunlightHours: threedWeatherLogs.sunlightHours, soilMoisture: threedWeatherLogs.soilMoisture }).from(threedWeatherLogs).where(where).orderBy(desc(threedWeatherLogs.recordedAt)).limit(limit).offset(offset);
    const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(threedWeatherLogs).where(where);
    return respond({ success: true, data: rows, count: rows.length, total: Number(total?.count ?? 0) });
  } catch { return respond({ success: false, error: 'Weather logs could not be loaded.' }, 503); }
}

async function mutate(request: Request, method: 'POST' | 'PUT' | 'DELETE') {
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ success: false, error: 'Unauthorized' }, 401);
    const url = new URL(request.url);
    if (request.headers.get('origin') !== url.origin) return respond({ success: false, error: 'Invalid request origin.' }, 403);
    const id = Number(url.searchParams.get('id'));
    if (method !== 'POST' && (!Number.isSafeInteger(id) || id <= 0)) return respond({ success: false, error: 'Invalid Weather log.' }, 400);
    // Project observations are immutable here; only unscoped owned legacy logs support manual CRUD.
    const ownedLegacy = and(eq(threedWeatherLogs.id, id), eq(threedWeatherLogs.userId, session.user.id), sql`${threedWeatherLogs.rawData}->'projectWeather' IS NULL`);
    let rows;
    if (method === 'DELETE') rows = await db.delete(threedWeatherLogs).where(ownedLegacy).returning(weatherReadingColumns);
    else {
      if (Number(request.headers.get('content-length') ?? 0) > 8192) return respond({ success: false, error: 'Request too large.' }, 413);
      const text = await request.text();
      if (text.length > 8192) return respond({ success: false, error: 'Request too large.' }, 413);
      const parsed = fields.safeParse(JSON.parse(text));
      if (!parsed.success || !Object.keys(parsed.data).length) return respond({ success: false, error: 'Invalid Weather fields.' }, 400);
      rows = method === 'POST'
        ? await db.insert(threedWeatherLogs).values({ ...parsed.data, userId: session.user.id }).returning(weatherReadingColumns)
        : await db.update(threedWeatherLogs).set({ ...parsed.data, updatedAt: new Date() }).where(ownedLegacy).returning(weatherReadingColumns);
    }
    return rows[0] ? respond({ success: true, data: rows[0] }) : respond({ success: false, error: 'Weather log not found.' }, 404);
  } catch (error) { return respond({ success: false, error: 'Weather log could not be changed.' }, error instanceof SyntaxError ? 400 : 503); }
}
export const POST = (request: Request) => mutate(request, 'POST');
export const PUT = (request: Request) => mutate(request, 'PUT');
export const DELETE = (request: Request) => mutate(request, 'DELETE');
