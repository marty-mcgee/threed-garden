// Offline: real contracts, service, routes and navigation; in-memory DB/HTTP adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
function load(file, modules, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in modules ? modules[name] : require(name), console, Request, Response, URL, ...globals });
  return exports;
}
const contract = load('src/libraries/config/workspace-settings.ts', {});
const schema = load('src/libraries/schema/settings/index.ts', { '../auth': { user: pg.pgTable('user', { id: pg.text('id') }) } });
const { settings, settingsUserOverrides: overrides, settingsAuditLogs: audits } = schema;
const dialect = new pg.PgDialect();
let data = { definitions: [], overrides: [], audits: [] }, failAudit = false, transactions = 0, locks = 0;
let queue = Promise.resolve();
const statements = [];
const clone = value => JSON.parse(JSON.stringify(value));
function select() {
  let table, joined = false, condition;
  const run = () => {
    const query = dialect.sqlToQuery(condition);
    statements.push(query);
    if (table === settings) return data.definitions.filter(row => row.key === query.params[0]).map(row => ({ ...row, sensitive: row.isSensitive }));
    assert.equal(table, overrides);
    if (joined) {
      assert(query.sql.includes('"settings_user_overrides"."user_id"'), 'Reads must include owner predicate');
      const [key, scope, userId] = query.params;
      return data.overrides.filter(row => row.userId === userId && data.definitions.some(def => def.id === row.settingId && def.key === key && def.scope === scope));
    }
    const [settingId, userId] = query.params;
    assert(query.sql.includes('"settings_user_overrides"."user_id"'), 'Writes must read the current owner only');
    return data.overrides.filter(row => row.settingId === settingId && row.userId === userId);
  };
  const chain = {
    from(value) { table = value; return chain; },
    innerJoin() { joined = true; return chain; },
    where(value) { condition = value; return chain; },
    for(value) { assert.equal(value, 'update'); locks++; return chain; },
    then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); },
  };
  return chain;
}
function insert(table) {
  let value, update;
  const run = () => {
    if (table === settings) { if (!data.definitions.length) data.definitions.push({ ...value, id: 1 }); }
    else if (table === overrides) {
      const existing = data.overrides.find(row => row.userId === value.userId && row.settingId === value.settingId);
      if (existing) Object.assign(existing, update); else data.overrides.push(value);
    } else { assert.equal(table, audits); if (failAudit) throw new Error('Mock audit failure'); data.audits.push(value); }
  };
  const chain = {
    values(row) { value = clone(row); return chain; },
    onConflictDoNothing() { return chain; },
    onConflictDoUpdate(options) { assert.equal(options.target[0], overrides.userId); assert.equal(options.target[1], overrides.settingId); update = clone(options.set); return chain; },
    then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); },
  };
  return chain;
}
const db = { select, insert, transaction(operation) {
  transactions++;
  const run = queue.then(async () => {
    const before = clone(data);
    try { return await operation({ select, insert }); } catch (error) { data = before; throw error; }
  });
  queue = run.catch(() => {});
  return run;
} };
const service = load('src/libraries/services/settings/workspace.ts', {
  'server-only': {}, '@/libraries/db/client': { db }, '@/libraries/schema/settings': schema, '@/libraries/config/workspace-settings': contract,
});
let session = null;
const route = load('src/app/api/settings/workspace/route.ts', {
  'next/server': { NextResponse: Response }, '@/libraries/auth': { auth: async () => session },
  '@/libraries/config/workspace-settings': contract, '@/libraries/services/settings/workspace': service,
});
const navigation = load('src/libraries/config/navigation.client.ts', {
  './workspace-settings': contract, 'lucide-react': new Proxy({}, { get: (_, key) => key }),
});
const request = (body, origin = 'https://example.test') => new Request('https://example.test/api/settings/workspace', {
  method: 'PUT', headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body),
});
(async () => {
  const defaults = contract.defaultWorkspaceSettings();
  for (const invalid of [null, { ...defaults, userId: 'other' }, { ...defaults, theme: 'invisible' }, { ...defaults, modules: { ...defaults.modules, traffic: 'false' } }, { ...defaults, links: { ...defaults.links, cron: true } }]) assert.equal(contract.workspaceSettingsSchema.safeParse(invalid).success, false);
  const changed = contract.defaultWorkspaceSettings(); changed.modules.traffic = false; changed.links.weather = false;
  const visible = navigation.buildNavigationClient(changed);
  assert(!visible.some(row => row.module === 'traffic'));
  assert(!visible.flatMap(row => row.items).some(row => row.service === 'weather'));
  assert(visible.flatMap(row => row.items).some(row => row.path === '/dashboard/scene'));
  assert.equal(contract.defaultWorkspaceSettings().modules.traffic, true, 'Defaults must not be mutated');
  assert.equal((await route.GET()).status, 401);
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null }))).status, 401);
  assert.equal(transactions, 0);
  session = { user: { id: 'alice' } };
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null }, 'https://evil.test'))).status, 403);
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null }, null))).status, 403);
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null, userId: 'bob' }))).status, 400);
  assert.equal(transactions, 0);
  const initial = await route.GET();
  assert.match(initial.headers.get('cache-control'), /no-store/);
  assert.equal((await initial.json()).revision, null);
  const savedResponse = await route.PUT(request({ preferences: changed, revision: null }));
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  assert(saved.revision); assert.equal(locks, 1); assert.equal(data.audits.length, 1);
  assert.equal((await (await route.GET()).json()).preferences.modules.traffic, false);
  session = { user: { id: 'bob' } };
  assert.equal((await (await route.GET()).json()).preferences.modules.traffic, true, 'No cross-user cache/override');
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null }))).status, 200);
  assert.equal(data.overrides.length, 2);
  session = { user: { id: 'alice' } };
  assert.equal((await route.PUT(request({ preferences: defaults, revision: null }))).status, 409);
  const concurrent = await Promise.all([
    service.saveWorkspaceSettings('alice', { preferences: defaults, revision: saved.revision }).then(() => 'saved', () => 'conflict'),
    service.saveWorkspaceSettings('alice', { preferences: changed, revision: saved.revision }).then(() => 'saved', () => 'conflict'),
  ]);
  assert.deepEqual(concurrent, ['saved', 'conflict']);
  const beforeFailure = await service.readWorkspaceSettings('alice');
  failAudit = true;
  const failed = await route.PUT(request({ ...beforeFailure, preferences: changed }));
  assert.equal(failed.status, 503);
  assert.equal((await service.readWorkspaceSettings('alice')).revision, beforeFailure.revision, 'Audit failure rolls back override');
  assert(!JSON.stringify(await failed.json()).includes('Mock audit'));
  failAudit = false;
  data.overrides.find(row => row.userId === 'alice').value = { secret: 'do not expose', preferences: null };
  const corrupt = await route.GET();
  assert.equal(corrupt.status, 503); assert(!JSON.stringify(await corrupt.json()).includes('secret'));
  console.log('PASS Workspace Settings: strict contract, navigation consumers, auth/origin, owner isolation, conflict handling, transactional audit rollback and sanitized errors (mock DB, no live writes).');
})().catch(error => { console.error(error); process.exitCode = 1; });
