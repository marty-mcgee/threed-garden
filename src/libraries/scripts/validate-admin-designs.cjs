// Compile the actual owner-scoped list queries without a database connection.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const { pgTable, serial, text, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/pg-proxy');
const project = pgTable('project', { id: serial('id'), userId: text('user_id'), name: text('name'), isActive: boolean('is_active'), isPublic: boolean('is_public'), updatedAt: timestamp('updated_at'), config: jsonb('config') });
let owner = 'owner-a', queries = [];
const db = drizzle(async (query, params) => { queries.push({ query, params }); return { rows: query.includes('count(*)') ? [[51]] : [] }; });
const deps = { 'drizzle-orm': require('drizzle-orm'), 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } }, '@/libraries/auth': { auth: async () => owner ? { user: { id: owner } } : null }, '@/libraries/db/client': { db }, '@/libraries/schema/project': { project } };
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/admin/designs/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: api, require: name => { assert(name in deps, name); return deps[name]; } });
const get = query => api.GET({ nextUrl: new URL('https://fixture/api/admin/designs?' + query) });
(async () => {
  const response = await get('search=Table%25_&content=saved&active=inactive&visibility=private&sort=name&direction=asc&offset=999');
  assert.equal(response.status, 200); assert.equal(response.body.offset, 50);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.equal(queries.length, 2);
  for (const q of queries) { assert(q.params.includes('owner-a')); assert(q.params.includes('%Table\\%\\_%')); assert(q.query.includes('"project"."user_id"')); assert(q.query.includes('is not true')); assert(q.query.includes('jsonb_typeof')); }
  assert(queries[1].query.includes('order by "project"."name" asc, "project"."id" asc'));
  assert(!queries[1].query.includes('select *')); assert(!queries[1].query.includes('threed_designs'));
  for (const query of ['sort=config', 'direction=invalid', 'offset=-1', 'offset=1e2', 'active=bogus', 'visibility=bogus', 'content=bogus', 'search=' + 'x'.repeat(201)]) {
    queries = []; assert.equal((await get(query)).status, 400); assert.equal(queries.length, 0);
  }
  owner = null; queries = []; assert.equal((await get('')).status, 401); assert.equal(queries.length, 0);
  console.log('PASS Designs owner scope, bounded pagination, filter/sort SQL, literal search, private caching and unauthorized/invalid zero-query guards (mocked; no live database).');
})().catch(error => { console.error(error); process.exitCode = 1; });
