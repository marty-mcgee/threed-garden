/** Only draft fields are writable here; output and acceptance have separate lifecycles. */
export function parseSpeechDraft(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Speech draft.');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !['title', 'text', 'voiceId', 'revision', 'archived'].includes(key))) {
    throw new Error('Unsupported Speech field.');
  }
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 255) throw new Error('Enter a title of up to 255 characters.');
  if (typeof body.text !== 'string' || body.text.length > 2000) throw new Error('Speech text must be at most 2,000 characters.');
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : body.voiceId;
  if (voiceId !== undefined && voiceId !== null && voiceId !== '' && (typeof voiceId !== 'string' || !/^[a-f0-9]{32}$/i.test(voiceId))) throw new Error('Enter a valid voice ID or leave it empty.');
  return { title: body.title.trim(), text: body.text, voiceId: voiceId ? String(voiceId) : null };
}

export function positiveSpeechInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > 2147483647) return null;
  return value;
}
