// Offline execution of the real connection module and map GET with controlled doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const code = (file) => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let created = 0, attached = 0;
const sharedGlobal = {};
class Pool {
  constructor() { created++; }
  on(event, handler) { assert.equal(event, 'error'); this.handler = handler; }
}
function evaluatePool(mode) {
  const exports = {};
  vm.runInNewContext(code('src/lib/db/client.ts'), {
    exports, globalThis: sharedGlobal, process: { env: { NODE_ENV: mode } }, console,
    require(name) {
      if (name === 'pg') return { Pool };
      if (name === '@vercel/functions') return { attachDatabasePool: () => attached++ };
      if (name === 'drizzle-orm/node-postgres') return { drizzle: (pool) => pool };
      if (name === '@/lib/schema') return {};
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports.db;
}
assert.equal(evaluatePool('development'), evaluatePool('development'));
assert.equal(created, 1);
assert.equal(attached, 1);
assert.notEqual(evaluatePool('production'), sharedGlobal.threeDDatabasePool);
assert.equal(attached, 2);
const schema = new Proxy({}, { get: (_, table) => new Proxy({}, { get: (_, column) => `${table}.${String(column)}` }) });
const orm = { getTableColumns: () => ({}), sql: () => ({}) };
for (const name of ['eq', 'and', 'desc', 'inArray']) orm[name] = (...args) => args;
let queue = [];
const db = { select() {
  const chain = {};
  for (const method of ['from', 'where', 'innerJoin', 'orderBy', 'limit']) chain[method] = () => chain;
  chain.then = (resolve, reject) => {
    assert.ok(queue.length, 'Unexpected query');
    const next = queue.shift();
    return (next instanceof Error ? Promise.reject(next) : Promise.resolve(next)).then(resolve, reject);
  };
  return chain;
} };
const api = {};
vm.runInNewContext(code('src/app/api/map/threed/route.ts'), {
  exports: api, URL, console: { error() {} },
  require(name) {
    if (name === '@/lib/db/connection-diagnostics') return { databaseConnectionDiagnostic: () => ({}) };
    if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
    if (name === '@/lib/auth') return { auth: async () => ({ user: { id: 'owner' } }) };
    if (name === '@/lib/db/client') return { db };
    if (name.startsWith('@/lib/schema/')) return schema;
    if (name === 'drizzle-orm') return orm;
    if (name.endsWith('/model-primary-file')) return { modelSelection: () => ({}) };
    if (name.endsWith('/project-view-state-core')) return { readThreeDProjectViewStateFromConfig: () => null };
    if (name.endsWith('/model-snapshot-assets') || name.endsWith('/sanitize')) return {};
    throw new Error(`Unexpected import ${name}`);
  },
});
(async () => {
  const prefix = () => [[{ id: 5 }], [{ threedId: 1, name: 'Garden' }], [], [{ moduleId: 1, assetType: 'threed_plantings', assetId: 1 }]];
  queue = [...prefix(), Object.assign(new Error('Connection timed out'), { code: 'ETIMEDOUT' })];
  const failed = await api.GET({ url: 'http://localhost/api/map/threed?projectId=5' });
  assert.equal(failed.status, 500);
  assert.equal(failed.body.success, false);
  assert.equal(failed.body.data, undefined);
  assert.equal(queue.length, 0);
  queue = [...prefix(), [], []];
  const empty = await api.GET({ url: 'http://localhost/api/map/threed?projectId=5' });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.success, true);
  assert.equal(empty.body.data.plantings.length, 0);
  assert.equal(queue.length, 0);
  console.log('PASS: development reloads reuse one attached pool; production creates its own; map read failure returns 500 while a valid empty result remains 200');
})().catch((error) => { console.error(error); process.exitCode = 1; });

const diagnostics = {};
vm.runInNewContext(code('src/lib/db/connection-diagnostics.ts'), { exports: diagnostics });
const wrapped = { message: 'SECRET', query: 'SECRET', cause: { code: 'ETIMEDOUT', errors: [
  { code: 'ETIMEDOUT', syscall: 'connect', address: '192.0.2.1', message: 'SECRET' },
  { code: 'ENETUNREACH', syscall: 'connect', address: '2001:db8::1' },
] } };
const summary = JSON.stringify(diagnostics.databaseConnectionDiagnostic(wrapped));
assert.ok(summary.includes('IPv4') && summary.includes('IPv6') && summary.includes('ENETUNREACH'));
assert.ok(!summary.includes('SECRET') && !summary.includes('192.0.2.1') && !summary.includes('2001:db8'));
const cycle = {}; cycle.cause = cycle;
assert.doesNotThrow(() => JSON.stringify(diagnostics.databaseConnectionDiagnostic(cycle)));
