// Real configuration/metadata/form paths, mocked persistence/auth; no live writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const pg = require('drizzle-orm/pg-core');
const cache = new Map();
const jsx = (type, props) => ({ type, props });
function load(file, overrides = {}) {
  file = path.resolve(file);
  if (!Object.keys(overrides).length && cache.has(file)) return cache.get(file);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, console: { warn() {} }, URL, Date, TextEncoder, crypto: require('node:crypto').webcrypto,
    require(name) {
      if (name in overrides) return overrides[name];
      if (name.startsWith('.') || name.startsWith('@/')) {
        let target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
        if (!path.extname(target)) target += '.ts';
        return load(target);
      }
      return require(name);
    },
  });
  if (!Object.keys(overrides).length) cache.set(file, exports);
  return exports;
}
const clone = value => JSON.parse(JSON.stringify(value));
const contract = load('src/libraries/config/meta-tags.ts');
const configuration = load('src/libraries/services/project/configuration.ts');
const initial = { unrelated: { preserved: true }, threeDArchitecture: { preserved: true } };
const tags = { ...contract.defaultMetaTags(), enabled: true, tags: [{ name: 'description', content: 'Project garden' }, { name: 'og:description', content: 'Project sharing' }] };
const request = { expected: configuration.projectConfigurationStamp(initial), changes: { metaTags: tags } };
const patch = configuration.projectConfigurationPatch(initial, request);
assert.equal(Object.keys(patch).join(), 'metaTags');
assert(patch.metaTags.revision);
assert.equal(initial.metaTags, undefined);
assert.throws(() => configuration.projectConfigurationPatch({ ...initial, ...patch }, request), configuration.ProjectConfigurationConflict);
const cleared = configuration.projectConfigurationPatch({ ...initial, ...patch }, { ...request, changes: { metaTags: { ...contract.defaultMetaTags(), revision: patch.metaTags.revision } } });
assert.equal(cleared.metaTags.enabled, false);
assert.deepEqual(clone(contract.metaTagsOverrides(cleared.metaTags)), {});
assert.throws(() => configuration.projectConfigurationPatch(initial, { ...request, changes: { metaTags: { ...tags, tags: [{ name: 'script', content: 'bad' }] } } }), configuration.ProjectConfigurationError);

const table = pg.pgTable('project', { id: pg.integer('id'), userId: pg.text('user_id'), isPublic: pg.boolean('is_public'), isActive: pg.boolean('is_active'), config: pg.jsonb('config') });
const dialect = new pg.PgDialect();
let row = { id: 17, userId: 'owner', isPublic: true, isActive: true, config: { ...initial, ...patch } }, queries = 0;
const db = { select(fields) {
  assert.deepEqual(Object.keys(fields), ['config']);
  return { from(selected) { assert.equal(selected, table); return { where(condition) {
    const query = dialect.sqlToQuery(condition);
    assert.match(query.sql, /is_public/);
    assert.match(query.sql, /is_active/);
    const viewer = query.params.find(value => typeof value === 'string');
    if (viewer) assert.match(query.sql, /user_id/);
    return { async limit(count) {
      queries++; assert.equal(count, 1);
      return row && query.params[0] === row.id && (row.isPublic && row.isActive || viewer === row.userId) ? [{ config: row.config }] : [];
    } };
  } }; } };
} };
const service = load('src/libraries/services/project/meta-tags.ts', { 'server-only': {}, '@/libraries/db/client': { db }, '@/libraries/schema/project': { project: table } });
const parent = { description: 'App description', openGraph: { title: 'App title', siteName: 'ThreeD App', description: 'App sharing' }, twitter: { card: 'summary_large_image', title: 'App social title' } };
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join('') : typeof value === 'string' ? value : value && typeof value === 'object' ? text(value.props?.children) : '';
(async () => {
  assert.equal((await service.readProjectHtmlMetadata('17')).description, 'Project garden');
  const inherited = service.inheritProjectMetadata(await service.readProjectHtmlMetadata('17'), parent);
  assert.equal(inherited.openGraph.title, 'App title'); assert.equal(inherited.openGraph.description, 'Project sharing');
  assert.equal(inherited.openGraph.url,'https://threedgarden.com/dashboard/scene?projectId=17');
  assert.equal((await service.readProjectHtmlMetadata('17', undefined, 'https://example.test/learn')).openGraph.url,'https://example.test/dashboard/scene?projectId=17');
  const fb = contract.metaTagsOverrides({...tags,tags:[{name:'fb:app_id',content:'987654321'}]});
  assert.equal(service.inheritProjectMetadata(fb,parent).facebook.appId,'987654321');
  assert.equal(inherited.twitter, undefined, 'Untouched social defaults inherit through Next');
  const social = service.inheritProjectMetadata(contract.metaTagsOverrides({ ...tags, tags: [{ name: 'twitter:description', content: 'Project tweet' }] }), parent);
  assert.equal(social.twitter.card, 'summary_large_image'); assert.equal(social.twitter.title, 'App social title');
  row.isPublic = false;
  assert.deepEqual(clone(await service.readProjectHtmlMetadata('17')), {});
  assert.deepEqual(clone(await service.readProjectHtmlMetadata('17', 'other')), {});
  assert.equal((await service.readProjectHtmlMetadata('17', 'owner')).description, 'Project garden');
  row.isPublic = true; row.isActive = false;
  assert.deepEqual(clone(await service.readProjectHtmlMetadata('17')), {});
  const before = queries;
  for (const id of [undefined, ['17'], '0', '-1', '17bad', '9999999999999999999']) assert.deepEqual(clone(await service.readProjectHtmlMetadata(id)), {});
  assert.equal(queries, before);
  row.isActive = true;
  const route = load('src/app/dashboard/scene/page.tsx', { 'react/jsx-runtime': { jsx, jsxs: jsx }, './SceneWorkspace': { default: 'workspace' }, '@/libraries/auth': { auth: async () => null }, '@/libraries/services/project/meta-tags': service });
  assert.equal((await route.generateMetadata({ searchParams: Promise.resolve({ projectId: '17' }) }, Promise.resolve(parent))).description, 'Project garden');
  row.isPublic = false;
  assert.deepEqual(clone(await route.generateMetadata({ searchParams: Promise.resolve({ projectId: '17' }) }, Promise.resolve(parent))), {});
  assert.equal(route.default().type, 'workspace'); assert.equal(route.default().props.key, undefined);
  let draft = tags;
  const form = load('src/components/admin/projects/ProjectMetaTagsFields.tsx', { 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/components/ui/button': { Button: 'button' } });
  const render = () => nodes(form.ProjectMetaTagsFields({ value: draft, onChange: value => { draft = value; }, disabled: false }));
  render().find(node => node.type === 'input' && node.props['aria-label'] === 'Project content for description').props.onChange({ target: { value: 'Edited Project' } });
  assert.equal(draft.tags[0].content, 'Edited Project');
  render().find(node => node.type === 'button' && text(node) === 'Remove description').props.onClick(); assert.equal(draft.tags.length, 1);
  render().find(node => node.type === 'button' && text(node) === 'Add Project Meta Tag').props.onClick(); assert.equal(draft.tags.length, 2);
  render().find(node => node.type === 'button' && text(node) === 'Clear Project Meta Tags').props.onClick(); assert.equal(draft.tags.length, 0); assert.equal(draft.enabled, false);
  console.log('PASS Project metadata: changed-key/revision checks, inheritance, private/inactive/other-owner denial, strict IDs, server route, stable client boundary and actual CRUD controls (mock DB).');
})().catch(error => { console.error(error); process.exitCode = 1; });
