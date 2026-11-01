import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { AssemblyContractError } from '@/libraries/services/threed/models/assembly-group-core';
import { AssemblyWorkspaceError, assemblyId, assemblyListQuery, deleteAssembly, listAssemblies, readAssembly, saveAssembly } from '@/libraries/services/threed/models/assembly-workspace-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function respond(operation: (ownerId: string) => Promise<unknown>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true, data: await operation(session.user.id) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof AssemblyWorkspaceError || error instanceof AssemblyContractError) return NextResponse.json({ success: false, error: error.message }, { status: error instanceof AssemblyWorkspaceError ? error.status : 400 });
    let cause: unknown = error;
    for (let depth = 0; cause && depth < 5; depth++) {
      const current = cause as { code?: string; cause?: unknown };
      if (current.code === '42P01' || current.code === '42703') return NextResponse.json({ success: false, error: 'Assembly database setup is incomplete. Your draft is retained; export a copy before leaving.' }, { status: 503 });
      if (current.code === '23505' || current.code === '23503') return NextResponse.json({ success: false, error: 'Assembly references changed. Your draft is retained; export it before reopening the saved Assembly.' }, { status: 409 });
      cause = current.cause;
    }
    return NextResponse.json({ success: false, error: 'Could not access Assembly Groups. Your draft is retained. Please retry.' }, { status: 500 });
  }
}

export function GET(request: NextRequest) {
  return respond(ownerId => {
    const id = request.nextUrl.searchParams.get('id');
    return id ? readAssembly(db, ownerId, assemblyId(id)) : listAssemblies(db, ownerId, assemblyListQuery(request.nextUrl.searchParams));
  });
}

export function DELETE(request: NextRequest) {
  return respond(ownerId => {
    const revision = request.nextUrl.searchParams.get('revision');
    if (revision === null || !/^\d+$/.test(revision)) throw new AssemblyWorkspaceError('Invalid saved revision.');
    return deleteAssembly(db, ownerId, assemblyId(request.nextUrl.searchParams.get('id')), Number(revision));
  });
}

export function POST(request: NextRequest) {
  return respond(async ownerId => {
    const text = await request.text();
    if (text.length > 1024 * 1024) throw new AssemblyWorkspaceError('Choose an Assembly smaller than 1 MiB.');
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw new AssemblyWorkspaceError('Invalid Assembly save.'); }
    return saveAssembly(db, ownerId, input);
  });
}
