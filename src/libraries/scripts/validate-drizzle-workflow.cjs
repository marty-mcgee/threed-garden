const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { defineConfig } = require('drizzle-kit');

function config(file, deps = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, process: { env }, require(name) {
    if (name === 'drizzle-kit') return { defineConfig };
    assert(name in deps, `Unexpected config dependency: ${name}`); return deps[name];
  } });
  return exports.default;
}
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const configFile = command => {
  const match = command.match(/--config=([^\s]+)/); assert(match, 'npm command selects an explicit config'); return match[1];
};
const generate = config(configFile(manifest.scripts['db:generate']));
assert.equal(generate.schema, './src/libraries/schema/index.ts');
assert.equal(generate.dialect, 'postgresql'); assert.equal(generate.out, './drizzle');
assert.equal(generate.dbCredentials, undefined, 'Offline generation needs neither credentials nor dotenv');
assert(fs.readFileSync(generate.schema, 'utf8').includes("export * from './threed'"));

function push(inherited, local, fallback) {
  const env = { ...inherited }, calls = [];
  const result = config(configFile(manifest.scripts['db:push']), {
    './drizzle.generate.config': { default: generate },
    dotenv: { config(options) {
      calls.push(options?.path ?? '.env');
      const supplied = options?.path === '.env.local' ? local : fallback;
      if (!env.DATABASE_URL && supplied) env.DATABASE_URL = supplied;
    } },
  }, env);
  assert.deepEqual(calls, ['.env.local', '.env']);
  assert.equal(result.schema, generate.schema); assert.equal(result.dialect, generate.dialect);
  assert.equal(result.strict, true); assert.equal(result.verbose, true);
  return result;
}
assert.equal(push({ DATABASE_URL: 'process-fixture' }, 'local-fixture', 'fallback-fixture').dbCredentials.url, 'process-fixture');
assert.equal(push({}, 'local-fixture', 'fallback-fixture').dbCredentials.url, 'local-fixture');
assert.equal(push({}, undefined, 'fallback-fixture').dbCredentials.url, 'fallback-fixture');
assert.throws(() => push({}, undefined, undefined), /DATABASE_URL is not set/);
assert(!/--force\b|migrate\b/.test(manifest.scripts['db:push']), 'Push retains native review/confirmation semantics');

// The Developer's existing local baseline is ignored. Compare its actual incremental output when present.
const generatedFile = 'drizzle/0001_threed_simulation_results.sql';
if (fs.existsSync(generatedFile)) {
  const normalize = text => text.replace(/--> statement-breakpoint/g, '').replace(/^--.*$/gm, '').replace(/^BEGIN;|^COMMIT;/gm, '').replace(/\s+/g, ' ').trim();
  assert.equal(normalize(fs.readFileSync(generatedFile, 'utf8')), normalize(fs.readFileSync('docs/releases/sql/v0.22.27-threed-simulation-results.sql', 'utf8')));
}
console.log('PASS: actual Drizzle configs support credential-free generation, shared schema, connection precedence and native push confirmation; local result migration matches when present. No database connection.');
