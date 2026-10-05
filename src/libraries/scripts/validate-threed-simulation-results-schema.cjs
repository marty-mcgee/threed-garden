const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const pg = require('drizzle-orm/pg-core'), orm = require('drizzle-orm');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');
const user = pg.pgTable('user', { id: pg.text('id').primaryKey() }), project = pg.pgTable('project', { id: pg.serial('id').primaryKey() });
const dependencies = { 'drizzle-orm': orm, 'drizzle-orm/pg-core': pg, '../auth': { user }, '../project': { project } }, schema = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/libraries/schema/threed/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: schema, require(name) { assert(name in dependencies, name); return dependencies[name]; } });
const table = pg.getTableConfig(schema.threedSimulationResults), column = name => table.columns.find(item => item.name === name);
assert.equal(table.name, 'threed_simulation_results');
assert(column('id').primary); assert.equal(column('run_id').getSQLType(), 'uuid'); assert.equal(column('status').default, 'running');
for (const name of ['user_id','project_id','threed_id','run_id','simulation_revision','status','snapshot','client_started_at','created_at','updated_at']) assert(column(name).notNull, name);
for (const name of ['simulation_id','scenario_id','report','client_ended_at']) assert(!column(name).notNull, name);
for (const [name, deletion] of [['user_id','cascade'],['project_id','cascade'],['threed_id','cascade'],['simulation_id','set null'],['scenario_id','set null']]) assert.equal(table.foreignKeys.find(key => key.reference().columns[0].name === name).onDelete, deletion);
assert(table.indexes.some(item => item.config.unique && item.config.columns.map(item => item.name).join(',') === 'user_id,run_id'));
const dialect = new pg.PgDialect(), lifecycle = dialect.sqlToQuery(table.checks.find(item => item.name === 'threed_simulation_results_lifecycle_valid').value).sql;
for (const token of ['IS NOT NULL', 'coalesce(', 'browser-scene', 'client_started_at', 'client_ended_at']) assert(lifecycle.includes(token), token);
(async () => {
  const current = { ...schema, user, project }, previous = { ...current }; delete previous.threedSimulationResults; delete previous.threedSimulationResultsRelations;
  const before = generateDrizzleJson(previous), after = generateDrizzleJson(current, before.id), statements = await generateMigration(before, after);
  assert.equal(Object.keys(after.tables).length, Object.keys(before.tables).length + 1);
  for (const statement of statements) {
    assert(/^CREATE TABLE "threed_simulation_results"|^ALTER TABLE "threed_simulation_results" ADD CONSTRAINT|^CREATE (UNIQUE )?INDEX .* ON "threed_simulation_results"/.test(statement), statement);
    assert(!/\b(DROP|TRUNCATE)\b|^(INSERT|UPDATE|DELETE)\b/.test(statement), statement);
  }
  const file = 'docs/releases/sql/v0.22.27-threed-simulation-results.sql', body = `BEGIN;\n\n${statements.join('\n\n')}\n\nCOMMIT;\n`;
  if (process.argv.includes('--write-sql')) fs.writeFileSync(file, '-- v0.22.27: Simulation result history only. Generated offline from the Drizzle ORM schema by installed Drizzle Kit.\n-- Apply to the intended Neon database before using result-backed Scene runs. Do not rerun v0.22.25 SQL.\n' + body);
  assert.equal(fs.readFileSync(file, 'utf8').replace(/^--.*\r?\n/gm, '').replace(/\r\n/g, '\n'), body, 'Targeted SQL equals the actual Drizzle delta');
  console.log('PASS: real Drizzle result metadata, lifecycle constraints, retained snapshots, owner/run uniqueness and exact additive SQL; no database connection.');
})().catch(e => { console.error(e); process.exitCode = 1; });
