/** Read only PostgreSQL codes; never send query text, parameters or raw errors to clients. */
export function speechReadError(error: unknown) {
  let current = error;
  const seen = new Set<unknown>();
  for (let depth = 0; depth < 5 && current && typeof current === 'object' && !seen.has(current); depth++) {
    seen.add(current);
    const detail = current as { code?: unknown; cause?: unknown };
    if (detail.code === '42P01') return {
      code: 'SPEECH_SCHEMA_MISSING',
      error: 'Speech database setup is pending. Apply the approved v0.19.24 database schema, then refresh this page.',
    };
    if (detail.code === '42703') return {
      code: 'SPEECH_SCHEMA_OUTDATED',
      error: 'Speech database setup is incomplete. Update the database to the approved v0.19.24 schema, then refresh this page.',
    };
    current = detail.cause;
  }
  return { code: 'SPEECH_READ_UNAVAILABLE', error: 'Speech records could not be loaded. Please retry. If this continues, check the database connection.' };
}
