import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';

export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to create speech.' }, { status: 401, headers });
  return NextResponse.json({ configured: Boolean(process.env.FISH_AUDIO_API_KEY) }, { headers });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to create speech.' }, { status: 401, headers });
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  let body;
  try { body = await request.json(); } catch { return fail('Invalid speech request.', 400); }
  if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000 ||
      typeof body.voiceId !== 'string' || !/^[a-f\d]{32}$/i.test(body.voiceId)) {
    return fail('Enter speech text (up to 2,000 characters) and a valid Fish Audio voice ID.', 400);
  }
  const key = process.env.FISH_AUDIO_API_KEY;
  if (!key) return fail('Fish Audio is not configured on the server.', 503);
  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', model: 's2.1-pro-free' },
      body: JSON.stringify({ text: body.text.trim(), reference_id: body.voiceId, format: 'mp3' }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      const messages: Record<number, string> = {
        400: 'Fish Audio rejected the speech request. Check the voice and text.',
        401: 'Fish Audio authentication failed. Check the server API key.',
        402: 'Fish Audio requires payment or API credits. Check your Fish Audio API balance.',
        403: 'Fish Audio denied access. Check API key permissions and access to this voice.',
        404: 'Fish Audio could not find the requested resource. Check the voice ID.',
        422: 'Fish Audio could not validate this request. Check voice compatibility and speech settings.',
        429: 'Fish Audio rate or usage limit reached. Wait before trying again.',
      };
      return NextResponse.json({
        error: `${messages[response.status] || 'Fish Audio service could not complete generation.'} (Fish Audio HTTP ${response.status})`,
        providerStatus: response.status,
      }, { status: 502, headers });
    }
    if (!response.body) return fail('Fish Audio returned no audio.', 502);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10 * 1024 * 1024) { await reader.cancel(); return fail('Generated audio exceeded the preview size limit.', 502); }
      chunks.push(value);
    }
    if (!size) return fail('Fish Audio returned no audio.', 502);
    return new NextResponse(Buffer.concat(chunks), { headers: { ...headers, 'Content-Type': 'audio/mpeg' } });
  } catch {
    return fail('Speech generation stopped or timed out. Please try again.', 502);
  }
}
