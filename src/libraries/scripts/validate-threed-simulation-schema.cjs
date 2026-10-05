const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const pg = require('drizzle-orm/pg-core');
const orm = require('drizzle-orm');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');

// Real Drizzle metadata and offline SQL generation; no database/config/env imports.
const user = pg.pgTable('user', { id: pg.text('id').primaryKey() });
const project = pg.pgTable('project', { id: pg.serial('id').primaryKey() });
const dependencies = { 'drizzle-orm': orm, 'drizzle-orm/pg-core': pg, '../auth': { user }, '../project': { project } };
const schema = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/libraries/schema/threed/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: schema, require(name) { assert(name in dependencies, name); return dependencies[name]; } });
const table = pg.getTableConfig(schema.threedSimulations);
const column = name => table.columns.find(item => item.name === name);
const dialect = new pg.PgDialect();
const sqlText = value => dialect.sqlToQuery(value).sql;
assert.equal(table.name, 'threed_simulations');
assert(column('id').primary);
for (const name of ['user_id', 'project_id', 'threed_id', 'name', 'slug', 'definition', 'revision', 'is_active', 'created_at', 'updated_at']) assert(column(name).notNull, name);
assert.equal(column('scenario_id').notNull, false);
assert.equal(column('is_active').default, false, 'Empty definitions start inactive');
assert.equal(column('revision').default, 1);
assert.equal(JSON.stringify(column('definition').default), JSON.stringify({ version: 1, steps: [], observations: [] }));
for (const [name, parent, deletion] of [
  ['user_id', user, 'cascade'], ['project_id', project, 'cascade'],
  ['threed_id', schema.threed, 'cascade'], ['scenario_id', schema.threedScenarios, 'set null'],
]) {
  const key = table.foreignKeys.find(item => item.reference().columns[0].name === name);
  assert.equal(key.reference().foreignTable, parent);
  assert.equal(key.onDelete, deletion);
}
const slugIndex = table.indexes.find(item => item.config.name === 'idx_threed_simulations_project_threed_slug');
assert.equal(slugIndex.config.unique, true);
assert.equal(slugIndex.config.columns.map(item => item.name).join(','), 'project_id,threed_id,slug');
assert(table.indexes.some(item => item.config.columns.map(item => item.name).join(',') === 'user_id,project_id'));
const definitionCheck = sqlText(table.checks.find(item => item.name === 'threed_simulations_definition_valid').value);
for (const token of ['coalesce(', "'object'", "'version'", "'1'::jsonb", "'steps'", "'observations'", "'array'", 'false']) assert(definitionCheck.includes(token), token);
assert(table.checks.some(item => item.name === 'threed_simulations_revision_positive'));
assert(table.checks.some(item => item.name === 'threed_simulations_name_valid'));
assert(table.checks.some(item => item.name === 'threed_simulations_slug_valid'));
assert(!table.columns.some(item => /run_id|result|response|started_at|completed_at/.test(item.name)), 'Definition table has no execution history');
assert(fs.readFileSync('src/libraries/schema/index.ts', 'utf8').includes("export * from './threed'"));

(async () => {
  const current = { ...schema, user, project };
  const previous = { ...current }; delete previous.threedSimulations;
  const before = generateDrizzleJson(previous);
  const after = generateDrizzleJson(current, before.id);
  const statements = await generateMigration(before, after);
  assert.equal(Object.keys(after.tables).length, Object.keys(before.tables).length + 1);
  assert(statements.length > 0);
  for (const statement of statements) {
    assert(/^CREATE TABLE "threed_simulations"|^ALTER TABLE "threed_simulations" ADD CONSTRAINT|^CREATE (UNIQUE )?INDEX .* ON "threed_simulations"/.test(statement), statement);
    assert(!/\b(DROP|TRUNCATE)\b|^(DELETE|UPDATE|INSERT)\b/.test(statement), statement);
  }
  const filename = 'docs/releases/sql/v0.22.25-threed-simulations.sql';
  const body = `BEGIN;\n\n${statements.join('\n\n')}\n\nCOMMIT;\n`;
  if (process.argv.includes('--write-sql')) fs.writeFileSync(filename,
    '-- v0.22.25: ThreeD Simulations definition table only. Generated offline by installed Drizzle Kit.\n' +
    '-- Review against the intended database before execution. No runner or run/results tables.\n' + body);
  const saved = fs.readFileSync(filename, 'utf8').replace(/^--.*\r?\n/gm, '').replace(/\r\n/g, '\n');
  assert.equal(saved, body, 'Tracked additive migration matches the actual Drizzle schema delta');
  console.log('PASS: Simulation defaults, optional Scenario unlink, scoped indexes/checks and exact additive Drizzle SQL; no database connection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
