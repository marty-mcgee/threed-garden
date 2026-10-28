import { signupSchema } from '@/libraries/auth/signup-contract';
import { registerAccount, RegistrationConflict } from '@/libraries/auth/register';

export const runtime = 'nodejs';
const json = (body: unknown, status: number) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  // Bound the actual streamed body, not only its optional Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Invalid signup details.' }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) { await reader.cancel(); return json({ error: 'Signup details are too large.' }, 413); }
      chunks.push(value);
    }
    const parsed = signupSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!parsed.success) return json({ error: 'Enter a name, valid email, and password of at least 8 characters (maximum 72 UTF-8 bytes).' }, 400);
    await registerAccount(parsed.data);
    return json({ created: true }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Invalid signup details.' }, 400);
    if (error instanceof RegistrationConflict) return json({ error: 'Unable to create this account. Try signing in or use another email.' }, 409);
    return json({ error: 'Account creation could not be completed. Please try again.' }, 503);
  } finally { reader.releaseLock(); }
}
