import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { workspaceSnapshotSchema } from '@/lib/config/workspace-settings';
import { readWorkspaceSettings, saveWorkspaceSettings, WorkspaceSettingsConflict } from '@/lib/services/settings/workspace';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ error: 'Sign in to load your Settings.' }, 401);
    return respond(await readWorkspaceSettings(session.user.id));
  } catch {
    return respond({ error: 'Settings could not be loaded. Please retry.' }, 503);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return respond({ error: 'Sign in to save your Settings.' }, 401);
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return respond({ error: 'Invalid request origin.' }, 403);
    const parsed = workspaceSnapshotSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return respond({ error: 'Invalid Settings. Refresh and try again.' }, 400);
    return respond(await saveWorkspaceSettings(session.user.id, parsed.data));
  } catch (error) {
    if (error instanceof WorkspaceSettingsConflict) return respond({ error: 'Settings changed in another window. Refresh before saving again.' }, 409);
    return respond({ error: 'Settings could not be saved. Your changes are still available to retry.' }, 503);
  }
}
