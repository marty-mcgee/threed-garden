/** Recovery holds a session advisory lock across uploads and its database transaction. */
function connection(value: string): URL {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.pathname.slice(1)) throw new Error();
    return url;
  } catch { throw new Error('Recovery requires a valid PostgreSQL connection URL.'); }
}
function neonPooler(url: URL): boolean {
  return url.hostname.endsWith('.neon.tech') && url.hostname.split('.')[0].endsWith('-pooler');
}
function endpoint(url: URL): string {
  return neonPooler(url) ? url.hostname.replace('-pooler.', '.') : url.hostname;
}
export function assertLegacyRecoveryDirectDatabaseUrl(value: string): void {
  if (neonPooler(connection(value))) throw new Error('Recovery requires a direct database connection for its session lock. Set matching DATABASE_URL_UNPOOLED; a Neon pooled URL cannot be used.');
}
/** Prefer an explicitly supplied direct URL only for the same endpoint, database and role. Never rewrite credentials or .env files. */
export function selectLegacyRecoveryDatabaseUrl(databaseUrl: string, unpooledUrl?: string): string {
  const configured = connection(databaseUrl);
  if (!unpooledUrl) { assertLegacyRecoveryDirectDatabaseUrl(databaseUrl); return databaseUrl; }
  const direct = connection(unpooledUrl);
  if (endpoint(configured) !== endpoint(direct) || (configured.port || '5432') !== (direct.port || '5432')
    || decodeURIComponent(configured.pathname) !== decodeURIComponent(direct.pathname)
    || decodeURIComponent(configured.username) !== decodeURIComponent(direct.username)) {
    throw new Error('DATABASE_URL_UNPOOLED must match DATABASE_URL endpoint, database and username. No connection was opened.');
  }
  assertLegacyRecoveryDirectDatabaseUrl(unpooledUrl);
  return unpooledUrl;
}
