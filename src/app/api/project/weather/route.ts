import { NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { readProjectWeather, updateProjectWeather, ProjectWeatherError } from '@/libraries/services/threed/project-weather';

export const dynamic = 'force-dynamic';
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

async function handle(request: Request, update: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ success: false, error: 'Sign in to view Project Weather.' }, 401);
    const url = new URL(request.url);
    const rawId = url.searchParams.get('projectId');
    if (!rawId || !/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(Number(rawId))
      || url.searchParams.getAll('projectId').length !== 1) return respond({ success: false, error: 'Invalid Project.' }, 400);
    if (update && request.headers.get('origin') !== url.origin) return respond({ success: false, error: 'Invalid request origin.' }, 403);
    const data = await (update ? updateProjectWeather : readProjectWeather)(session.user.id, Number(rawId));
    return respond({ success: true, data });
  } catch (error) {
    return respond({ success: false, error: error instanceof ProjectWeatherError ? error.message : 'Project Weather is temporarily unavailable.' },
      error instanceof ProjectWeatherError ? error.status : 503);
  }
}

export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
