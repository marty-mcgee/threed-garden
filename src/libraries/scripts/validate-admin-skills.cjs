// Exercise the route and its real same-origin/size checks with an in-memory actor and CLI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    exports, Buffer, Request, Response, URL, SyntaxError,
    require: key => { assert(Object.hasOwn(modules, key), key); return modules[key]; },
    ...globals,
  });
  return exports;
}

async function main() {
  let actor;
  let fail = false;
  const calls = [];
  const env = { DATABASE_URL: 'must-not-inherit' };
  class UserAdminError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const admin = {
    UserAdminError,
    requireUsersAdmin: async id => { if (id !== 'admin') throw new UserAdminError(403, 'Forbidden'); },
  };
  const http = load('src/libraries/services/users/http.ts', {
    './admin': admin,
    '@/libraries/utils/input-validation': {},
    '@/libraries/auth/register': {},
    '@/libraries/auth/registration-policy': {},
  });
  const route = load('src/app/api/admin/skills/route.ts', {
    '@/libraries/auth': { auth: async () => actor && { user: { id: actor } } },
    '@/libraries/services/users/admin': admin,
    '@/libraries/services/users/http': http,
    'node:util': require('node:util'),
    'node:child_process': {
      execFile(file, args, options, callback) {
        calls.push({ file, args, options });
        callback(fail ? Error('private command output') : null, '');
      },
    },
  }, { process: { platform: 'win32', env } });
  const input = { skill: 'prepare-threed-app-version', version: '0.35.10' };
  const post = (body = input, origin = 'https://garden.test') => route.POST(new Request('https://garden.test/api/admin/skills', {
    method: 'POST', headers: { origin }, body: JSON.stringify(body),
  }));
  assert.equal((await post()).status, 401);
  actor = 'other';
  assert.equal((await post()).status, 403);
  actor = 'admin';
  assert.equal((await post(input, 'https://elsewhere.test')).status, 403);
  assert.equal((await post({ version: '1'.repeat(100000) })).status, 413);
  for (const body of [{ ...input, thread: 'other' }, { ...input, skill: 'unknown' }, { ...input, version: '0.35.10 --other' }]) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal((await post()).status, 503);
  env.THREED_SKILLS_THREAD_ID = '11111111-2222-4333-8444-555555555555';
  env.THREED_SKILLS_AGENT_URL = 'http://unsupported.test';
  assert.equal((await post()).status, 503);
  assert.equal(calls.length, 0);
  delete env.THREED_SKILLS_AGENT_URL;
  const response = await post();
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: 'queued', ...input });
  assert.equal(calls[0].file, 'codex.exe');
  assert.equal(calls[0].args[2], env.THREED_SKILLS_THREAD_ID);
  assert.match(calls[0].args[5], /\$prepare-threed-app-version for v0\.35\.10/);
  assert.equal(calls[0].options.env.DATABASE_URL, undefined);
  env.THREED_SKILLS_AGENT_URL = 'wss://agent.test';
  env.THREED_SKILLS_AGENT_TOKEN = 'fixture-only';
  fail = true;
  const failed = await post();
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private command output|fixture-only/);
  assert.equal(calls[1].args.at(-1), 'THREED_SKILLS_AGENT_TOKEN');
  assert(!calls[1].args.includes('fixture-only'));
  console.log('PASS: Skill request authorization, same-origin checks, allowlisted arguments, local/remote routing and bounded delivery errors (mock CLI).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
