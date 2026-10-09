import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { designService } from '@/libraries/services/threed/design/persistence-service';
import { designId, DesignRequestError } from '@/libraries/services/threed/design/persistence-contract';

const service = designService(db);
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
function failure(error: unknown) {
  if (error instanceof DesignRequestError) return reply({ success: false, error: error.message }, error.status);
  if (error instanceof SyntaxError) return reply({ success: false, error: 'Invalid JSON body.' }, 400);
  // Drizzle may wrap the PostgreSQL error. Never expose its query, parameters or connection details.
  let cause: unknown = error;
  for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
    const current = cause as { code?: string; cause?: unknown };
    if (current.code === '42P01' || current.code === '42703') return reply({
      success: false, code: 'DESIGN_SCHEMA_NOT_READY',
      error: 'Legacy Design records are unavailable in this database. Current architectural edits use the Project Scene and Project Save; no separate Designs table is required.',
    }, 503);
    cause = current.cause;
  }
  return reply({ success: false, code: 'DESIGN_STORAGE_UNAVAILABLE', error: 'Legacy Design records are temporarily unavailable. Current architectural edits use Project Save.' }, 500);
}
export async function GET(request: NextRequest) {
  const session = await auth(); if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const query = new URL(request.url).searchParams;
    if (query.get('options') === 'projects' && query.size === 1) return reply({ success: true, data: await service.projects(session.user.id) });
    if ([...query.keys()].some(key => !['id', 'projectId', 'offset'].includes(key))) throw new DesignRequestError('Unsupported ThreeD Design query.');
    if (query.has('id')) return reply({ success: true, data: await service.get(session.user.id, designId(query.get('id'))) });
    const offset = Number(query.get('offset') ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new DesignRequestError('Invalid list offset.');
    return reply({ success: true, data: await service.list(session.user.id, query.has('projectId') ? designId(query.get('projectId')) : null, offset) });
  } catch (error) { return failure(error); }
}
/** Legacy records remain readable for manual JSON recovery. New edits use Project Save. */
async function retiredWrite() {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  return reply({ success: false, error: 'Architectural edits now belong to the active Project Scene. Use Project Save.' }, 410);
}
export const POST = retiredWrite;
export const PATCH = retiredWrite;
