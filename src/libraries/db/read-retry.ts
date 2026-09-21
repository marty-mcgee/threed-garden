/** Identify transport disconnects through bounded Drizzle/pg error causes. */
export function isDatabaseDisconnect(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const item = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (['ECONNRESET', 'EPIPE', '08003', '08006', '57P01'].includes(String(item.code))
      || item.message === 'Connection terminated unexpectedly'
      || item.message === 'Connection terminated') return true;
    current = item.cause;
  }
  return false;
}

/** Opt-in read-only recovery; never use for writes or transaction callbacks. */
export async function retryDisconnectedRead<T>(read: () => Promise<T>): Promise<T> {
  try { return await read(); }
  catch (error) {
    if (!isDatabaseDisconnect(error)) throw error;
    return await read();
  }
}
