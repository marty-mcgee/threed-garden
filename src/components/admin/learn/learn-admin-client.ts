export class LearnAdminError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Read the shared API envelope without replacing a useful server validation error. */
export async function learnAdminResponse<T>(response: Response, fallback: string): Promise<T> {
  let payload: { success?: boolean; error?: string };
  try { payload = await response.json(); } catch { throw new LearnAdminError(fallback, response.status); }
  if (!payload || typeof payload !== 'object' || !response.ok || payload.success !== true) {
    throw new LearnAdminError(payload && typeof payload.error === 'string' ? payload.error : fallback, response.status);
  }
  return payload as T;
}

export const learnAdminActionClass = 'h-7 gap-1.5 px-2 text-xs [@media(pointer:coarse)]:min-h-11';
export const learnAdminSelectClass = 'h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11';
