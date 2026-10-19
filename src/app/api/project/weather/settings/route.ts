import { NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { readProjectWeatherSettings, saveProjectWeatherSettings, ProjectWeatherError } from '@/libraries/services/threed/project-weather';
import { databaseConnectionDiagnostic } from '@/libraries/db/connection-diagnostics';

export const dynamic = 'force-dynamic';
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function handle(request: Request, write: boolean) {
  let stage = 'session';
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ success: false, error: 'Unauthorized' }, 401);
    const url = new URL(request.url), id = url.searchParams.get('projectId');
    if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || url.searchParams.getAll('projectId').length !== 1) return respond({ success: false, error: 'Invalid Project.' }, 400);
    if (!write) { stage = 'read'; return respond({ success: true, data: await readProjectWeatherSettings(session.user.id, Number(id)) }); }
    if (request.headers.get('origin') !== url.origin) return respond({ success: false, error: 'Invalid request origin.' }, 403);
    if (Number(request.headers.get('content-length') ?? 0) > 1024) return respond({ success: false, error: 'Request too large.' }, 413);
    const text = await request.text();
    if (text.length > 1024) return respond({ success: false, error: 'Request too large.' }, 413);
    stage = 'save';
    return respond({ success: true, data: await saveProjectWeatherSettings(session.user.id, Number(id), JSON.parse(text)) });
  } catch (error) {
    if (!(error instanceof ProjectWeatherError) && !(error instanceof SyntaxError)) {
      // Deliberately omit SQL, parameters, URLs, messages and credentials.
      console.error('Project Weather Settings failure', { stage,
        kind: error instanceof Error ? error.name : 'UnknownError', database: databaseConnectionDiagnostic(error) });
    }
    return respond({ success: false, error: error instanceof ProjectWeatherError ? error.message : 'Weather Settings could not be loaded or saved.' },
      error instanceof ProjectWeatherError ? error.status : error instanceof SyntaxError ? 400 : 503);
  }
}
export const GET = (request: Request) => handle(request, false);
export const PATCH = (request: Request) => handle(request, true);
