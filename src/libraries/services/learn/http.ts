import { ZodError } from 'zod';
import { LearnError } from './input';

export const learnResponse = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export const learnUnauthorized = () => learnResponse({ success: false, error: 'Sign in required.' }, 401);
function duplicateSlug(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && error.cause !== error && duplicateSlug(error.cause);
}
export function learnFailure(error: unknown) {
  if (error instanceof LearnError) return learnResponse({ success: false, error: error.message }, error.status);
  if (error instanceof ZodError || error instanceof SyntaxError) return learnResponse({ success: false, error: 'Invalid Learn guide request.' }, 400);
  if (duplicateSlug(error)) return learnResponse({ success: false, error: 'A Learn guide already uses this slug.' }, 409);
  return learnResponse({ success: false, error: 'Learn guides are unavailable. Check the Learn schema prerequisite, then retry.' }, 503);
}
export function requireLearnOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new LearnError(403, 'Invalid request origin.');
}
export async function readLearnBody(request: Request): Promise<unknown> {
  requireLearnOrigin(request);
  const reader = request.body?.getReader();
  if (!reader) throw new LearnError(400, 'A JSON request body is required.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1_048_576) { await reader.cancel(); throw new LearnError(413, 'Learn request is too large.'); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally { reader.releaseLock(); }
}
