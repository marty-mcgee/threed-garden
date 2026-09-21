/** Codes and address families only: never log credentials, SQL, URLs or messages. */
export function databaseConnectionDiagnostic(error: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object' || depth > 4) return undefined;
  const item = error as Record<string, unknown>;
  const code = typeof item.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(item.code) ? item.code : undefined;
  const syscall = typeof item.syscall === 'string' && /^[a-zA-Z]{1,40}$/.test(item.syscall) ? item.syscall : undefined;
  return {
    code,
    syscall,
    family: typeof item.address === 'string' ? (item.address.includes(':') ? 'IPv6' : 'IPv4') : undefined,
    attempts: Array.isArray(item.errors) ? item.errors.slice(0, 12).map((nested) => databaseConnectionDiagnostic(nested, depth + 1)) : undefined,
    cause: databaseConnectionDiagnostic(item.cause, depth + 1),
  };
}
