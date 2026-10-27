import { auth } from '@/libraries/auth';
import { moduleAppearanceSnapshotSchema } from '@/libraries/config/module-appearance';
import { canManageModuleAppearance, readModuleAppearance, saveModuleAppearance, ModuleAppearanceConflict, ModuleAppearanceForbidden } from '@/libraries/services/settings/module-appearance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (value: unknown, status = 200) => Response.json(value, {status,headers:{'Cache-Control':'private, no-store'}});

export async function GET() {
  try {
    const session = await auth();
    const snapshot = await readModuleAppearance();
    const canEdit = session?.user?.id ? await canManageModuleAppearance(session.user.id) : false;
    return json({snapshot,canEdit});
  } catch { return json({error:'Module appearance could not be loaded.'},503); }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return json({error:'Sign in required.'},401);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({error:'Invalid request origin.'},403);
  let input: unknown;
  try { input = await request.json(); } catch { return json({error:'Invalid settings.'},400); }
  const parsed = moduleAppearanceSnapshotSchema.safeParse(input);
  if (!parsed.success) return json({error:'Invalid Module color or icon settings.'},400);
  try { return json(await saveModuleAppearance(session.user.id,parsed.data)); }
  catch (error) {
    if (error instanceof ModuleAppearanceForbidden) return json({error:'An active Super Admin account is required.'},403);
    if (error instanceof ModuleAppearanceConflict) return json({error:'Settings changed elsewhere. Reload before saving again.'},409);
    return json({error:'Module appearance could not be saved. Your draft is retained.'},503);
  }
}
