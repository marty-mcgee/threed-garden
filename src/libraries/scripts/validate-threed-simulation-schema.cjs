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
assert.equal(column('scenario_id'), undefined);
assert(!table.foreignKeys.some(key => key.reference().foreignTable === schema.threedScenarios));
assert(!table.indexes.some(item => /scenario/.test(item.config.name)));
const relational = orm.extractTablesRelationalConfig({ ...schema, user, project }, orm.createTableRelationsHelpers);
for (const name of ['threedSimulations', 'threedSimulationResults']) {
  assert(!Object.values(relational.tables[name].relations).some(relation => relation.referencedTable === schema.threedScenarios), 'No Drizzle relation to Scenarios');
}
assert.equal(column('is_active').default, false, 'Empty definitions start inactive');
assert.equal(column('revision').default, 1);
assert.equal(JSON.stringify(column('definition').default), JSON.stringify({ version: 1, steps: [], observations: [] }));
for (const [name, parent, deletion] of [
  ['user_id', user, 'cascade'], ['project_id', project, 'cascade'],
  ['threed_id', schema.threed, 'cascade'],
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
  // Historical SQL is checked against its frozen historical snapshot, never regenerated from today's table.
  const frozen = JSON.parse(fs.readFileSync('src/libraries/scripts/fixtures/threed-simulations-v02227.json','utf8'));
  const current = JSON.parse(JSON.stringify(generateDrizzleJson({ ...schema, user, project })));
  const after = structuredClone(current); delete after.tables['public.threed_simulation_results'];
  after.tables['public.threed_simulations'] = frozen['public.threed_simulations'];
  const before = structuredClone(after); delete before.tables['public.threed_simulations'];
  const statements = await generateMigration(before, after);
  assert.equal(Object.keys(after.tables).length, Object.keys(before.tables).length + 1);
  assert(statements.length > 0);
  for (const statement of statements) {
    assert(/^CREATE TABLE "threed_simulations"|^ALTER TABLE "threed_simulations" ADD CONSTRAINT|^CREATE (UNIQUE )?INDEX .* ON "threed_simulations"/.test(statement), statement);
    assert(!/\b(DROP|TRUNCATE)\b|^(DELETE|UPDATE|INSERT)\b/.test(statement), statement);
  }
  const filename = 'docs/releases/sql/v0.22.25-threed-simulations.sql';
  const body = `BEGIN;\n\n${statements.join('\n\n')}\n\nCOMMIT;\n`;
  const saved = fs.readFileSync(filename, 'utf8').replace(/^--.*\r?\n/gm, '').replace(/\r\n/g, '\n');
  assert.equal(saved, body, 'Historical additive migration matches its frozen Drizzle snapshot');
  const previous = structuredClone(current); Object.assign(previous.tables, frozen);
  const next = current;
  const delta = await generateMigration(previous, next);
  assert.equal(delta.length, 6, 'Only two columns, two foreign keys and two indexes are removed');
  for (const statement of delta) assert(/^(ALTER TABLE "threed_simulation(?:s|_results)" DROP (?:CONSTRAINT .*scenario.*|COLUMN "scenario_id")|DROP INDEX "idx_threed_simulation(?:s|_results)_scenario(?:_id)?")/.test(statement), statement);
  const normalize = value => value.replace(/--> statement-breakpoint/g, '').split(';').map(item => item.replace(/\s+/g, ' ').trim()).filter(Boolean).sort();
  const generated = 'drizzle/0002_threed_simulations_remove_scenarios.sql';
  if (fs.existsSync(generated)) assert.deepEqual(normalize(fs.readFileSync(generated, 'utf8')), normalize(delta.join('\n')), 'Native local migration matches the reviewed six-statement schema delta');
  assert.equal(Object.keys(previous.tables).length, Object.keys(next.tables).length, 'No tables removed');
  console.log('PASS: Simulation defaults, no Scenario relationship, scoped indexes/checks and exact additive Drizzle SQL; no database connection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
