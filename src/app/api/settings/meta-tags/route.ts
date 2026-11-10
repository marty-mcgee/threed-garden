import { auth } from '@/libraries/auth';
import { parseMetaTags } from '@/libraries/config/meta-tags';
import { tryParseInput } from '@/libraries/utils/input-validation';
import { canManageMetaTags, readMetaTags, saveMetaTags, MetaTagsConflict, MetaTagsForbidden } from '@/libraries/services/settings/meta-tags';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (value: unknown, status = 200) => Response.json(value, {
  status,
  headers: { 'Cache-Control': 'private, no-store' },
});
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return json({ error: 'Sign in required.' }, 401);
    if (!await canManageMetaTags(session.user.id)) return json({ error: 'An active Super Admin account is required.' }, 403);
    return json(await readMetaTags());
  } catch { return json({ error: 'Meta tags could not be loaded.' }, 503); }
}
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return json({ error: 'Sign in required.' }, 401);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Invalid request origin.' }, 403);
  let value: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 32768) return json({ error: 'Meta tags exceed the 32 KiB limit.' }, 413);
    value = JSON.parse(text);
  } catch { return json({ error: 'Invalid meta tags.' }, 400); }
  const parsed = tryParseInput(parseMetaTags, value);
  if (!parsed.success) return json({ error: parsed.error.message }, 400);
  try { return json(await saveMetaTags(session.user.id, parsed.data)); }
  catch (error) {
    if (error instanceof MetaTagsForbidden) return json({ error: 'An active Super Admin account is required.' }, 403);
    if (error instanceof MetaTagsConflict) return json({ error: 'Meta tags changed elsewhere. Reload before saving again.' }, 409);
    return json({ error: 'Meta tags could not be saved. Your draft is retained.' }, 503);
  }
}
