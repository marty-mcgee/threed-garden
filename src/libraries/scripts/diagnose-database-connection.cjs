// Read-only connectivity probe. Never prints URLs, credentials, hosts or SQL data.
const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');
const net = require('node:net');
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
function summarize(error, depth = 0) {
  if (!error || depth > 4) return undefined;
  return {
    code: error.code,
    syscall: error.syscall,
    family: typeof error.address === 'string' ? (error.address.includes(':') ? 'IPv6' : 'IPv4') : undefined,
    attempts: Array.isArray(error.errors) ? error.errors.slice(0, 12).map((item) => summarize(item, depth + 1)) : undefined,
    cause: summarize(error.cause, depth + 1),
  };
}
(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  console.log(JSON.stringify({ runtime: process.version, autoSelectFamily: net.getDefaultAutoSelectFamily?.(), attemptTimeoutMs: net.getDefaultAutoSelectFamilyAttemptTimeout?.() }));
  for (let attempt = 1; attempt <= 3; attempt++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 5000 });
    const started = Date.now();
    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log(JSON.stringify({ attempt, ok: true, durationMs: Date.now() - started }));
    } catch (error) {
      process.exitCode = 1;
      console.log(JSON.stringify({ attempt, ok: false, durationMs: Date.now() - started, error: summarize(error) }));
    } finally { await client.end(); }
  }
})().catch(() => { console.error('Connection probe could not complete. Check local configuration.'); process.exitCode = 1; });
