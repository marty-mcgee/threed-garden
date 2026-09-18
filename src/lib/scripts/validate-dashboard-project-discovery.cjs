const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const core = {};
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/lib/services/dashboard/project-discovery.ts'), 'utf8')), { exports: core });
const project = { id: 5, name: 'Demo Farm', description: 'Garden', slug: 'farm', isPublic: false, assetCount: '2', sceneAssetCount: '4', moduleCounts: { threed: 1, music: 0, traffic: 0 } };
const page = (projects = [project], offset = 0, total = 30) => ({ success: true, projects, pagination: { offset, limit: 24, total } });
const parsed = core.readDashboardProjectPage(page(), 0);
assert.equal(parsed.projects[0].assetCount, 2);
assert.equal(parsed.projects[0].sceneAssetCount, 4);
assert.equal(parsed.hasMore, true);
assert.equal(parsed.nextOffset, 1);
assert.equal(core.readDashboardProjectPage(page([], 0, 0), 0).hasMore, false);
for (const invalid of [{success: false}, page([{...project,id:0}]), page([{...project,moduleCounts:null}]), page([project], 24)]) assert.throws(() => core.readDashboardProjectPage(invalid, 0));
assert.equal(core.mergeDashboardProjects(parsed.projects, parsed.projects).length, 1);
assert.equal(core.filterDashboardProjects(parsed.projects, ' FARM ', 'threed').length, 1);
assert.equal(core.filterDashboardProjects(parsed.projects, '', 'music').length, 0);
const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(root, 'src/app/dashboard/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
(function find(node) {
 if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes('AbortController')) effect = node.arguments[0];
 ts.forEachChild(node, find);
})(source);
assert.ok(effect);
const drain = () => new Promise(resolve => setImmediate(resolve));
function run(fetch, offset = 0, current = []) {
 const state = { projects: current, commits: 0 };
 const context = { ...core, AbortController, fetch, offset };
 for (const [setter, key] of [['setProjects','projects'],['setError','error'],['setLoading','loading'],['setTotal','total'],['setNextOffset','nextOffset'],['setHasMore','hasMore']]) context[setter] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; state.commits++; };
 const load = vm.runInNewContext(compile(`const effect = ${effect.getText(source)}; effect;`), context);
 return { state, cleanup: load() };
}
(async () => {
 const success = run(async () => ({ ok: true, json: async () => page() })); await drain();
 assert.equal(success.state.projects.length, 1); assert.equal(success.state.loading, false);
 const failed = run(async () => ({ ok: false, json: () => { throw new Error('Must not parse failed response'); } })); await drain();
 assert.ok(failed.state.error); assert.equal(failed.state.projects.length, 0);
 const retry = run(async () => ({ ok: true, json: async () => page([], 0, 0) })); await drain();
 assert.equal(retry.state.error, null); assert.equal(retry.state.projects.length, 0);
 const more = run(async () => { throw new Error('offline'); }, 24, parsed.projects); await drain();
 assert.equal(more.state.projects.length, 1); assert.ok(more.state.error);
 let resolve;
 const cancelled = run(() => new Promise(r => { resolve = r; }));
 cancelled.cleanup(); const before = cancelled.state.commits;
 resolve({ok:true,json:async()=>page()}); await drain();
 assert.equal(cancelled.state.commits, before, 'Cancelled request cannot commit or clear newer loading state');
 console.log('PASS Dashboard discovery: response validation, paging, merge/filter, HTTP errors, retry, retained cards and cancellation');
})().catch(error => { console.error(error); process.exitCode = 1; });

// Compile the real route count expressions with installed Drizzle, without a database.
const { pgTable, integer, text, boolean } = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/node-postgres');
const { sql, getTableName } = require('drizzle-orm');
const projectTable = pgTable('project', { id: integer('id'), userId: text('user_id') });
const assetsTable = pgTable('project_assets', { id: integer('id'), projectId: integer('project_id'), userId: text('user_id'), isActive: boolean('is_active') });
const markersTable = pgTable('project_threed_markers', { id: integer('id'), projectId: integer('project_id'), userId: text('user_id'), isActive: boolean('is_active') });
const routeSource = ts.createSourceFile('route.ts', fs.readFileSync(path.join(root, 'src/app/api/map/projects/route.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const queryContext = { sql, getTableName, project: projectTable, projectAssets: assetsTable, projectThreedMarkers: markersTable };
(function findOuter(node) {
 if (ts.isVariableDeclaration(node) && ['outerProjectId','outerProjectOwner'].includes(node.name.getText(routeSource))) queryContext[node.name.getText(routeSource)] = vm.runInNewContext(compile(`(() => ${node.initializer.getText(routeSource)})()` ), queryContext);
 ts.forEachChild(node, findOuter);
})(routeSource);
let countChecks = 0;
(function findCount(node) {
 if (ts.isPropertyAssignment(node) && ['sceneAssetCount','assetCount'].includes(node.name.getText(routeSource)) && ts.isCallExpression(node.initializer) && ts.isPropertyAccessExpression(node.initializer.expression) && ts.isTaggedTemplateExpression(node.initializer.expression.expression)) {
  countChecks++;
  const expression = vm.runInNewContext(compile(`(() => ${node.initializer.getText(routeSource)})()` ), queryContext);
  const query = drizzle({}).select({ count: expression }).from(projectTable).toSQL().sql;
  assert.match(query, /"project_id" = "project"\."id"/);
  assert.match(query, /"user_id" = "project"\."user_id"/);
  assert.match(query, /"is_active" = true/);
 }
 ts.forEachChild(node, findCount);
})(routeSource);
assert.equal(countChecks, 2, 'Both real route count expressions must be checked');
console.log('PASS Project count SQL retains outer Project identity, owner correlation and active filter');
