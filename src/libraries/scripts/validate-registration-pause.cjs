// Actual registration policy and creation boundaries; no live auth/database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
const calls = {
  database: 0,
  hash: 0,
  adapter: 0,
};
let session = { user: { id: 'existing-super-admin' } };
const unexpectedDatabase = () => {
  calls.database++;
  throw new Error('Registration pause reached the database');
};
const mocks = {
  'server-only': {},
  '@/libraries/db/client': { db: { select: unexpectedDatabase, transaction: unexpectedDatabase } },
  '@/libraries/auth': { auth: async () => session },
  '@/libraries/services/users/content': { findUserContent: async () => null },
  bcryptjs: { default: { hash: async () => { calls.hash++; throw new Error('Unexpected hash'); } } },
};
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const resolve = name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.') || name.startsWith('@/')) {
      let resolved = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(filename), name);
      if (resolved === path.resolve('src/libraries/services/users/content')) return mocks['@/libraries/services/users/content'];
      resolved = fs.existsSync(resolved + '.ts') ? resolved + '.ts' : path.join(resolved, 'index.ts');
      return load(resolved);
    }
    return require(name);
  };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  vm.runInNewContext(code, { exports, require: resolve, console, Request, Response, URL, TextEncoder, Buffer });
  return exports;
}

(async () => {
  const policy = load('src/libraries/auth/registration-policy.ts');
  assert.equal(policy.registrationEnabled, false, 'The shipped checkpoint must pause registration');
  const registration = load('src/libraries/auth/register.ts');
  const route = load('src/app/api/auth/register/route.ts');
  const users = load('src/libraries/services/users/admin.ts');
  const adminRoute = load('src/app/api/admin/users/route.ts');
  const defaults = load('src/libraries/auth/account-defaults.ts');
  const input = {
    name: 'Robot',
    email: 'robot@example.test',
    password: 'password123',
  };
  for (const body of [input, { ...input, role: 'super_admin' }, null, { name: 'x'.repeat(5000) }]) {
    const request = new Request('https://example.test/api/auth/register', {
      method: 'POST',
      headers: { origin: 'https://example.test' },
      body: JSON.stringify(body),
    });
    const result = await route.POST(request);
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal((await result.json()).error, policy.registrationPausedMessage);
    assert.equal(request.bodyUsed, false);
  }
  // A stale form or direct caller must be rejected before touching the body.
  const unreadable = { get body() { throw new Error('Body must not be read'); } };
  assert.equal((await route.POST(unreadable)).status, 403);
  await assert.rejects(() => registration.registerAccount(input), policy.RegistrationPaused);
  await assert.rejects(() => registration.insertCredentialsAccount({}, input, 'unused'), policy.RegistrationPaused);
  await assert.rejects(() => users.createAdminUser('existing-super-admin', input), policy.RegistrationPaused);
  const adminResult = await adminRoute.POST(unreadable);
  assert.equal(adminResult.status, 403);
  assert.match(adminResult.headers.get('cache-control'), /no-store/);
  assert.equal((await adminResult.json()).error, policy.registrationPausedMessage);
  session = null;
  assert.equal((await adminRoute.POST(unreadable)).status, 401);
  const getUser = async id => ({ id, email: 'existing@example.test' });
  const adapter = defaults.withAccountDefaults({
    createUser() { calls.adapter++; throw new Error('Unexpected adapter write'); },
    getUser,
  });
  assert.throws(() => adapter.createUser(input), policy.RegistrationPaused);
  assert.equal(adapter.getUser, getUser);
  assert.equal((await adapter.getUser('existing')).id, 'existing');
  assert.deepEqual(calls, { database: 0, hash: 0, adapter: 0 });
  console.log('PASS registration pause: public/Admin endpoints, both credential service boundaries and adapter reject new Users with no body reads, hashing or persistence; existing adapter reads remain available.');
})().catch(error => { console.error(error); process.exitCode = 1; });
