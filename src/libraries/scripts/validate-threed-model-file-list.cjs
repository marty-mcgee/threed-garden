// Offline fixtures execute the actual query parser, GET handler and client table.
// Every database, authentication and browser network dependency is an explicit double.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const clone = value => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, console, URL, URLSearchParams, AbortController,
    fetch() { throw new Error('Unexpected network access in offline fixture'); },
    ...globals,
    require(name) {
      assert(Object.hasOwn(mocks, name), `Unexpected adapter import (live access forbidden): ${name}`);
      return mocks[name];
    },
  }, { filename: file });
  return exports;
}

const queryModule = load('src/libraries/services/threed/models/model-file-list-query.ts');
const parse = query => clone(queryModule.parseModelFileListQuery(new URLSearchParams(query)));
const column = (table, field) => ({ kind: 'column', table, field });
const schema = Object.fromEntries(['threedModels', 'threedModelFiles'].map(table => [table,
  new Proxy({ table }, { get(target, field) { return field === 'table' ? table : column(table, String(field)); } }),
]));
const op = kind => (...args) => ({ kind, args });
const orm = Object.fromEntries(['eq', 'and', 'or', 'asc', 'desc'].map(kind => [kind, op(kind)]));
orm.sql = (strings, ...args) => ({ kind: 'sql', strings: [...strings], args });

// Interpret the small SQL-expression vocabulary used by the actual handler over
// seeded records. Refuse unexpected expressions instead of importing Drizzle/DB.
function sqlPattern(value) { return value.strings.join('?').replace(/\s+/g, ' ').trim(); }
function like(value, pattern) {
  if (value == null) return false;
  let expression = '^';
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    if (character === '\\' && index + 1 < pattern.length) {
      expression += pattern[++index].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } else if (character === '%') expression += '.*';
    else if (character === '_') expression += '.';
    else expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${expression}$`, 'isu').test(String(value));
}
function evaluate(expression, row) {
  if (!expression || typeof expression !== 'object') return expression;
  const args = expression.args ?? [];
  if (expression.kind === 'column') return row[expression.table]?.[expression.field];
  if (expression.kind === 'eq') {
    const left = evaluate(args[0], row), right = evaluate(args[1], row);
    return left != null && right != null && left === right;
  }
  if (expression.kind === 'and') return args.every(item => evaluate(item, row));
  if (expression.kind === 'or') return args.some(item => evaluate(item, row));
  assert.equal(expression.kind, 'sql', 'Unsupported SQL fixture expression');
  const pattern = sqlPattern(expression);
  if (pattern === "case when ? then 'primary' else 'supporting' end") return evaluate(args[0], row) ? 'primary' : 'supporting';
  if (pattern === '? = ?') return evaluate(args[0], row) === evaluate(args[1], row);
  if (pattern === '? ILIKE ?') return like(evaluate(args[0], row), evaluate(args[1], row));
  if (pattern === 'lower(?)') return evaluate(args[0], row)?.toLowerCase() ?? null;
  if (pattern === "lower(coalesce(nullif(?, ''), ?))") {
    const value = evaluate(args[0], row);
    return (value == null || value === '' ? evaluate(args[1], row) : value)?.toLowerCase() ?? null;
  }
  throw new Error(`Unsupported SQL fixture pattern: ${pattern}`);
}
function compareOrdering(order, left, right) {
  const nullsLast = order.kind === 'sql' && sqlPattern(order) === '? nulls last';
  if (nullsLast) order = order.args[0];
  assert(['asc', 'desc'].includes(order.kind), 'Unexpected ordering expression');
  const a = evaluate(order.args[0], left), b = evaluate(order.args[0], right);
  if (a == null || b == null) return a == null && b == null ? 0 : a == null ? 1 : -1;
  const comparison = a < b ? -1 : a > b ? 1 : 0;
  return order.kind === 'desc' ? -comparison : comparison;
}

const models = [
  { id: 7, userId: 'owner', modelName: 'Tree', modelType: 'gltf', mainModelFileId: 10, isActive: true },
  { id: 8, userId: 'owner', modelName: 'Inactive Bridge', modelType: 'fbx', mainModelFileId: 15, isActive: false },
  { id: 9, userId: 'foreign', modelName: 'Tree foreign', modelType: 'gltf', mainModelFileId: 17, isActive: true },
  { id: 10, userId: 'owner', modelName: 'Wrong assignment', modelType: 'procedural', mainModelFileId: 23, isActive: false },
  { id: 11, userId: 'owner', modelName: 'Cross Model primary pointer', modelType: 'gltf', mainModelFileId: 10, isActive: true },
  { id: 12, userId: 'owner', modelName: 'No saved Files', modelType: 'procedural', mainModelFileId: null, isActive: false },
];
const file = (id, modelId, fileName, fileType, fields = {}) => ({
  id, modelId, userId: 'owner', fileName, relativePath: `resources/${fileName}`, fileType,
  textureType: null, fileSize: id * 10, loadOrder: 0, filePath: 'private-storage-url', metadata: { private: true }, ...fields,
});
const files = [
  file(10, 7, 'Main.gltf', 'model'), file(11, 7, 'Leaf.png', 'texture', { textureType: 'baseColor' }),
  file(12, 7, 'Mesh.bin', 'binary'), file(13, 7, 'Material.mtl', 'other'), file(14, 7, 'Walk.fbx', 'animation'),
  file(15, 8, 'Main.fbx', 'model'), file(16, 8, 'Leaf.png', 'texture'),
  file(17, 9, 'foreign-owner-tree.png', 'texture'), file(18, 7, 'foreign-file-tree.png', 'texture', { userId: 'foreign' }),
  file(19, 999, 'orphan-tree.png', 'texture'), file(20, 7, 'null-owner-tree.png', 'texture', { userId: null }),
  file(21, 7, 'legacy.png', 'texture', { relativePath: null, fileSize: null, loadOrder: null }),
  file(22, 7, 'empty-path.png', 'texture', { relativePath: '' }),
  file(23, 10, 'wrong-type.png', 'texture'), file(24, 11, 'retained.gltf', 'model'),
  file(25, 7, '100%_\\literal.png', 'texture'), file(26, 7, '100abXliteral.png', 'texture'),
];
let signedIn = true, authFailure = false, queryFailure = false, invalidCount = false, queries = [];
const db = {
  select(selection) {
    const query = { selection }, chain = {};
    for (const method of ['from', 'innerJoin', 'where', 'orderBy', 'limit', 'offset']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.then = (resolve, reject) => Promise.resolve().then(() => {
      queries.push(query);
      if (queryFailure) throw new Error('Private database detail must not leak');
      const table = query.from[0].table;
      let rows;
      if (table === 'threedModels') rows = models.map(model => ({ threedModels: model }));
      else {
        assert.equal(table, 'threedModelFiles');
        assert.equal(query.innerJoin[0].table, 'threedModels', 'Only complete owned parent joins are supported');
        rows = files.flatMap(candidate => models.map(model => ({ threedModelFiles: candidate, threedModels: model })))
          .filter(row => evaluate(query.innerJoin[1], row));
      }
      rows = rows.filter(row => evaluate(query.where[0], row));
      if (Object.hasOwn(selection, 'count')) return [{ count: invalidCount ? -1 : String(rows.length) }];
      if (query.orderBy) rows.sort((a, b) => {
        for (const order of query.orderBy) { const result = compareOrdering(order, a, b); if (result) return result; }
        return 0;
      });
      const offset = query.offset?.[0] ?? 0, limit = query.limit?.[0] ?? rows.length;
      return rows.slice(offset, offset + limit).map(row => Object.fromEntries(
        Object.entries(selection).map(([field, value]) => [field, evaluate(value, row)]),
      ));
    }).then(resolve, reject);
    return chain;
  },
};
const route = load('src/app/api/threed/models/files/list/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200, headers: options?.headers }) } },
  'drizzle-orm': orm, '@/libraries/schema/threed': schema, '@/libraries/db/client': { db },
  '@/libraries/auth': { auth: async () => { if (authFailure) throw new Error('Private auth detail'); return signedIn ? { user: { id: 'owner' } } : null; } },
  '@/libraries/services/threed/models/model-file-list-query': queryModule,
});
async function get(query = '') {
  queries = [];
  const result = clone(await route.GET({ url: `http://fixture.invalid/api/threed/models/files/list?${query}` }));
  assert.equal(result.headers?.['Cache-Control'], 'private, no-store', 'Every response must prevent shared caching');
  return result;
}
const ids = result => result.body.data.map(row => row.id);
function sameCountAndPage() {
  const [count, page] = queries.slice(-2);
  assert.equal(count.where[0], page.where[0], 'Count and page must use the identical predicate');
  assert.equal(count.innerJoin[1], page.innerJoin[1], 'Count and page must use the identical parent join');
  assert.deepEqual(clone(page.orderBy.at(-1)), { kind: 'asc', args: [column('threedModelFiles', 'id')] }, 'Every sort must have a stable ID tie-breaker');
}
async function verifyParserAndAPI() {
  assert.deepEqual(parse(''), { search: '', modelId: null, fileType: null, role: null, limit: 50, offset: 0, sort: 'name', direction: 'asc' });
  for (const type of ['model', 'texture', 'binary', 'other', 'animation']) assert.equal(parse(`fileType=${type}`).fileType, type);
  for (const sort of ['name', 'path', 'model', 'type', 'role', 'size', 'loadOrder']) assert.equal(parse(`sort=${sort}`).sort, sort);
  assert.equal(parse('search=%20Leaf%20').search, 'Leaf');
  assert.equal(parse('limit=200&offset=2147483647&modelId=2147483647&direction=desc').modelId, 2147483647);
  const badQueries = [
    'unknown=x', 'scope=library', 'fileId=11', 'limit=1&limit=2', 'search=a&search=b', 'modelId=7&modelId=8',
    'limit=', 'limit=0', 'limit=201', 'limit=1.5', 'limit=-1', 'limit=1e2', 'offset=', 'offset=-1', 'offset=2147483648',
    'modelId=', 'modelId=0', 'modelId=07', 'modelId=-1', 'modelId=7x', 'modelId=2147483648', 'modelId=9007199254740992',
    'fileType=', 'fileType=image', 'role=', 'role=missing', 'sort=', 'sort=filePath', 'direction=', 'direction=ASC',
    `search=${'x'.repeat(201)}`, 'search=%00', 'sort=name%3BDROP%20TABLE',
  ];
  for (const query of badQueries) {
    assert.throws(() => parse(query), undefined, query);
    assert.equal((await get(query)).status, 400, query);
    assert.equal(queries.length, 0, 'Invalid queries must not read the database');
  }
  for (const key of ['search', 'modelId', 'fileType', 'role', 'limit', 'offset', 'sort', 'direction']) {
    assert.throws(() => parse(`${key}=x&${key}=x`), undefined, `Duplicate ${key}`);
  }
  signedIn = false;
  assert.equal((await get()).status, 401); assert.equal(queries.length, 0);
  assert.equal((await get('unknown=x')).status, 401, 'Authenticate before revealing query validation');
  signedIn = true;
  const all = await get();
  assert.equal(all.status, 200); sameCountAndPage();
  assert.equal(all.body.pagination.total, 13);
  assert.equal(queries.length, 2, 'List query count must stay constant');
  assert(!ids(all).some(id => [17, 18, 19, 20].includes(id)), 'Both File and parent Model must belong to the authenticated owner');
  assert(ids(all).includes(15), 'Inactive Models remain manageable');
  for (const row of all.body.data) assert.deepEqual(Object.keys(row).sort(), [
    'id', 'modelId', 'modelName', 'modelType', 'fileName', 'relativePath', 'fileType', 'textureType', 'fileSize', 'loadOrder', 'role',
  ].sort(), 'Expose only the table DTO, without saved URL, metadata or owner fields');
  assert.equal(all.body.data.find(row => row.id === 21).relativePath, null, 'Legacy null dependency paths remain explicit');
  assert.deepEqual(ids(await get('role=primary&sort=size')), [10, 15]); sameCountAndPage();
  assert.deepEqual(ids(await get('fileType=model&role=supporting')), [24], 'Retained geometry must not become primary by order or a cross-Model pointer');
  assert.equal((await get('modelId=10')).body.data[0].role, 'supporting', 'An assigned image cannot claim primary geometry authority');
  const absent = await get('modelId=999'), foreign = await get('modelId=9');
  assert.equal(absent.status, 404); assert.deepEqual(absent, foreign, 'Missing and foreign Model contexts must be indistinguishable');
  assert.equal(queries.length, 1);
  const emptyModel = await get('modelId=12');
  assert.equal(emptyModel.status, 200); assert.deepEqual(emptyModel.body.data, []); assert.equal(emptyModel.body.pagination.total, 0);
  assert.equal(queries.length, 3, 'Owned empty Models must remain a valid context');
  const scoped = await get('modelId=7&fileType=texture&search=Tree');
  assert.equal(scoped.status, 200); assert.equal(scoped.body.pagination.total, 5); sameCountAndPage();
  assert(scoped.body.data.every(row => row.modelId === 7 && row.fileType === 'texture'));
  assert.deepEqual(ids(await get('search=Material')), [13], 'Search must include File name');
  assert.deepEqual(ids(await get('search=resources%2FMesh')), [12], 'Search must include relative dependency path');
  assert.deepEqual(ids(await get('search=Inactive')), [16, 15], 'Search must include parent Model identity');
  assert.deepEqual(ids(await get('fileType=other&search=Tree')), [13], 'Grouped OR search must remain inside owners and type filtering');
  assert.deepEqual(ids(await get(`search=${encodeURIComponent('%_\\')}`)), [25], 'SQL wildcard characters must be searched literally');
  const tie = await get('fileType=texture&search=Leaf&sort=name&direction=desc');
  assert.deepEqual(ids(tie), [11, 16], 'Case-insensitive sort ties must retain ascending File identity');
  for (const sort of ['name', 'path', 'model', 'type', 'role', 'size', 'loadOrder']) {
    for (const direction of ['asc', 'desc']) {
      const result = await get(`sort=${sort}&direction=${direction}&limit=2&offset=1`);
      assert.equal(result.status, 200); assert.equal(result.body.data.length, 2); sameCountAndPage();
      assert.deepEqual(result.body.pagination, { limit: 2, offset: 1, total: 13 });
    }
  }
  for (const direction of ['asc', 'desc']) assert.equal(ids(await get(`sort=size&direction=${direction}`)).at(-1), 21, 'Null sizes stay last in both directions');
  const pageA = await get('sort=name&limit=2'), pageB = await get('sort=name&limit=2&offset=2');
  assert.equal(new Set([...ids(pageA), ...ids(pageB)]).size, 4, 'Adjacent stable pages must not overlap');
  const beyond = await get('offset=2147483647'); assert.deepEqual(beyond.body.data, []); assert.equal(beyond.body.pagination.total, 13);
  const noMatch = await get('search=no-fixture-match'); assert.deepEqual(noMatch.body.data, []); assert.equal(noMatch.body.pagination.total, 0);
  queryFailure = true; const failed = await get(); queryFailure = false;
  assert.equal(failed.status, 500); assert.equal(failed.body.error, 'Failed to fetch Model Files');
  invalidCount = true; assert.equal((await get()).status, 500); invalidCount = false;
  authFailure = true; assert.equal((await get()).status, 500); assert.equal(queries.length, 0); authFailure = false;
}

async function verifyCompiledOwnershipSQL() {
  // The installed query builder only compiles SQL here; no driver/client is loaded.
  const actualORM = require('drizzle-orm');
  const { pgTable, integer, text: pgText, PgDialect } = require('drizzle-orm/pg-core');
  const actualSchema = {
    threedModels: pgTable('fixture_models', {
      id: integer('id'), userId: pgText('user_id'), modelName: pgText('model_name'),
      modelType: pgText('model_type'), mainModelFileId: integer('main_model_file_id'),
    }),
    threedModelFiles: pgTable('fixture_files', {
      id: integer('id'), userId: pgText('user_id'), modelId: integer('model_id'), fileName: pgText('file_name'),
      relativePath: pgText('relative_path'), fileType: pgText('file_type'), textureType: pgText('texture_type'),
      fileSize: integer('file_size'), loadOrder: integer('load_order'),
    }),
  };
  const captures = [];
  const compilerDB = { select(selection) {
    const query = { selection }, chain = {};
    for (const method of ['from', 'innerJoin', 'where', 'orderBy', 'limit', 'offset']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.then = (resolve, reject) => {
      captures.push(query);
      return Promise.resolve(Object.hasOwn(selection, 'count') ? [{ count: 0 }] : []).then(resolve, reject);
    };
    return chain;
  } };
  const compiledRoute = load('src/app/api/threed/models/files/list/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    'drizzle-orm': actualORM, '@/libraries/schema/threed': actualSchema, '@/libraries/db/client': { db: compilerDB },
    '@/libraries/auth': { auth: async () => ({ user: { id: 'owner' } }) },
    '@/libraries/services/threed/models/model-file-list-query': queryModule,
  });
  const result = await compiledRoute.GET({ url: 'http://fixture.invalid/api/threed/models/files/list?fileType=texture&search=Tree%25_' });
  assert.equal(result.status, 200);
  assert.equal(captures.length, 2);
  assert.equal(captures[0].where[0], captures[1].where[0]);
  const compiled = new PgDialect().sqlToQuery(captures[0].where[0]);
  assert.deepEqual(compiled.params, ['owner', 'owner', 'texture', '%Tree\\%\\_%', '%Tree\\%\\_%', '%Tree\\%\\_%']);
  assert.match(compiled.sql, /^\("fixture_files"\."user_id" = \$1 and "fixture_models"\."user_id" = \$2 and "fixture_files"\."file_type" = \$3 and \(/);
  assert.match(compiled.sql, /"fixture_files"\."file_name" ILIKE \$4 or "fixture_files"\."relative_path" ILIKE \$5 or "fixture_models"\."model_name" ILIKE \$6\)\)$/);
}

const jsx = (type, props) => ({ type, props });
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || value.type === 'dialog' && !value.props.open) return [];
  return [value, ...nodes(value.props?.children)];
}
function visibleText(value) {
  if (Array.isArray(value)) return value.map(visibleText).join(' ');
  return value && typeof value === 'object' ? value.type === 'dialog' && !value.props.open ? '' : visibleText(value.props?.children) : String(value ?? '');
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function tableHarness(initialLocation = '') {
  let slots = [], cursor = 0, dirty = true, tree, location = new URLSearchParams(initialLocation), timerId = 0;
  let deferNavigation = false, pendingHref = null;
  const timers = new Map(), requests = [], navigation = [], pendingEffects = [];
  const events = new Map();
  const applyLocation = href => { location = new URL(href, 'http://fixture.invalid').searchParams; dirty = true; };
  const browserWindow = {
    get location() { return { search: `?${location.toString()}` }; },
    addEventListener(event, listener) { if (!events.has(event)) events.set(event, new Set()); events.get(event).add(listener); },
    removeEventListener(event, listener) { events.get(event)?.delete(listener); },
  };
  const sameDependencies = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const router = {
    replace(href) { navigation.push({ action: 'replace', href }); if (deferNavigation) pendingHref = href; else applyLocation(href); },
    push(href) { navigation.push({ action: 'push', href }); if (deferNavigation) pendingHref = href; else applyLocation(href); },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(slots[index].value, next)) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useMemo(calculate, dependencies) {
      const index = cursor++;
      if (!(index in slots) || !sameDependencies(slots[index].dependencies, dependencies)) slots[index] = { value: calculate(), dependencies };
      return slots[index].value;
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!(index in slots) || !sameDependencies(slots[index].dependencies, dependencies)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { dependencies };
        pendingEffects.push(() => { cleanup?.(); slots[index].cleanup = callback(); });
      }
    },
  };
  const choices = Array.from({ length: 200 }, (_, index) => ({
    id: index + 1, modelName: index === 6 ? 'Tree' : index === 7 ? 'Inactive Bridge' : `Model ${index + 1}`, modelType: 'gltf',
  }));
  const fetch = (url, options) => {
    assert.equal(options?.method ?? 'GET', 'GET', 'The list and Add chooser must never upload or mutate');
    assert.equal(options.cache, 'no-store'); assert(options.signal instanceof AbortSignal);
    let resolve;
    const promise = new Promise(next => { resolve = next; });
    const request = { url, options, answer(body, status = 200) { resolve({ ok: status >= 200 && status < 300, status, json: async () => body }); } };
    requests.push(request);
    if (url.startsWith('/api/threed/models?')) {
      const params = new URL(url, 'http://fixture.invalid').searchParams;
      assert.equal(params.get('view'), 'selector'); assert.equal(params.get('limit'), '200');
      assert.equal(params.has('isActive'), false, 'Inactive parents must be available in Add/filter choices');
      const offset = Number(params.get('offset'));
      assert([0, 200].includes(offset), 'Unexpected selector pagination');
      request.answer({ success: true, data: offset ? [{ id: 201, modelName: 'Beyond first page', modelType: 'fbx' }] : choices, pagination: { total: 201 } });
    } else assert(url.startsWith('/api/threed/models/files/list?'), `Unexpected browser request: ${url}`);
    return promise;
  };
  const module = load('src/components/admin/threed/models/ThreeDModelFilesTable.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' },
    'next/navigation': { useRouter: () => router, useSearchParams: () => location },
    'lucide-react': new Proxy({}, { get: (_, field) => `icon-${String(field)}` }),
    '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'workspace-header', AdminWorkspaceLink: 'link' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' }, '@/components/ui/label': { Label: 'label' },
    '@/components/ui/badge': { Badge: 'badge' },
    '@/components/ui/select': Object.fromEntries(['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem'].map(name => [name, name])),
    '@/components/ui/dialog': Object.fromEntries(['Dialog', 'DialogContent', 'DialogDescription', 'DialogFooter', 'DialogHeader', 'DialogTitle'].map(name => [name, name === 'Dialog' ? 'dialog' : name])),
    '@/components/ui/table': Object.fromEntries(['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'].map(name => [name, name])),
    '@/libraries/services/threed/models/model-file-list-query': queryModule,
  }, {
    fetch, window: browserWindow,
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); },
  });
  function render() {
    let passes = 0;
    do {
      assert(++passes < 30, 'Unexpected React render loop');
      dirty = false; cursor = 0; tree = module.ThreeDModelFilesTable();
      while (pendingEffects.length) pendingEffects.shift()();
    } while (dirty);
    return tree;
  }
  const find = predicate => { const node = nodes(render()).find(predicate); assert(node, 'Expected visible table control'); return node; };
  return {
    requests, navigation, render, text: () => visibleText(render()), find,
    button: label => find(node => node.type === 'button' && visibleText(node).trim() === label),
    control: label => {
      const entries = nodes(render());
      const trigger = entries.find(node => node.props?.['aria-label'] === label);
      assert(trigger, 'Expected labeled table control');
      return entries.find(node => node.type === 'Select' && nodes(node.props.children).includes(trigger)) ?? trigger;
    },
    async flush() { await settle(); render(); },
    runTimers() { render(); const active = [...timers.values()]; timers.clear(); for (const callback of active) callback(); },
    listRequests: () => requests.filter(request => request.url.startsWith('/api/threed/models/files/list?')),
    deferNavigation(value = true) { deferNavigation = value; },
    acknowledgeNavigation() { assert(pendingHref, 'Expected delayed URL acknowledgment'); applyLocation(pendingHref); pendingHref = null; render(); },
    externalLocation(value, popstate = false) {
      location = new URLSearchParams(value); dirty = true;
      if (popstate) for (const listener of events.get('popstate') ?? []) listener();
      render();
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); assert.equal(events.get('popstate')?.size ?? 0, 0, 'History listener must be released on unmount'); },
  };
}
const tableRows = [
  { id: 11, modelId: 7, modelName: 'Tree', modelType: 'gltf', fileName: 'Leaf.png', relativePath: 'textures/Leaf.png', fileType: 'texture', textureType: 'baseColor', fileSize: 1024, loadOrder: 2, role: 'supporting' },
  { id: 15, modelId: 8, modelName: 'Inactive Bridge', modelType: 'fbx', fileName: 'Main.fbx', relativePath: null, fileType: 'model', textureType: null, fileSize: null, loadOrder: null, role: 'primary' },
];
const listBody = (data = tableRows, total = data.length) => ({ success: true, data, pagination: { limit: 50, offset: 0, total } });
async function verifyTable() {
  const table = tableHarness(); table.render(); await table.flush();
  assert.equal(table.requests.filter(request => request.url.startsWith('/api/threed/models?')).length, 2, 'Parent choices must load beyond the first 200 Models');
  assert.equal(table.control('Parent Model').props.value, 'all', 'All Models must remain unscoped at first load');
  assert.equal(table.control('Search Model Files').props.placeholder, 'Search Model, filename or path…', 'Search instructions must match the API search fields');
  assert.equal(table.listRequests().length, 0, 'The table request must respect its debounce');
  table.runTimers(); assert.equal(table.listRequests().length, 1);
  table.listRequests()[0].answer(listBody()); await table.flush();
  assert(table.text().includes('Leaf.png')); assert(table.text().includes('No dependency path saved'));
  assert(table.text().includes('Primary')); assert(table.text().includes('Supporting')); assert(table.text().includes('baseColor'));
  const edit = table.find(node => node.type === 'link' && node.props?.['aria-label'] === 'Edit File #11 Leaf.png');
  assert.equal(edit.props.href, '/admin/threed/models/7/files/11');
  assert.equal(table.find(node => node.type === 'link' && node.props?.['aria-label'] === 'Model Files for Inactive Bridge #8').props.href, '/admin/threed/models/8?tab=files');
  assert.equal(table.button('Next').props.disabled, true, 'A single page must not offer false paging');
  table.button('Add File').props.onClick();
  assert(table.text().includes('Choose parent Model'));
  assert.equal(table.control('Parent Model for new File').props.value, '');
  assert.equal(table.button('Continue').props.disabled, true, 'Add must require an explicit parent rather than selecting the first record');
  const beforeCancel = table.requests.length;
  table.button('Cancel').props.onClick(); assert(!table.text().includes('Choose parent Model'));
  assert.equal(table.requests.length, beforeCancel); assert.equal(table.navigation.length, 0, 'Cancel must neither upload nor navigate');
  table.button('Add File').props.onClick();
  table.control('Parent Model for new File').props.onValueChange('201');
  assert.equal(table.button('Continue').props.disabled, false);
  table.control('Parent Model for new File').props.onValueChange('none');
  assert.equal(table.button('Continue').props.disabled, true, 'Clearing the parent must retain the explicit-choice requirement');
  table.control('Parent Model for new File').props.onValueChange('201');
  assert.equal(table.button('Continue').props.disabled, false);
  table.button('Continue').props.onClick(); assert.equal(table.navigation.at(-1).href, '/admin/threed/models/201/files/new');
  table.unmount();

  const filtered = tableHarness('parentModelId=7&fileType=texture&role=supporting&search=Leaf&limit=25&offset=25&sort=path&direction=desc');
  filtered.render(); await filtered.flush(); filtered.runTimers();
  const first = filtered.listRequests()[0], firstParams = new URL(first.url, 'http://fixture.invalid').searchParams;
  assert.deepEqual(parse(firstParams), { search: 'Leaf', modelId: 7, fileType: 'texture', role: 'supporting', limit: 25, offset: 25, sort: 'path', direction: 'desc' });
  first.answer(listBody([tableRows[0]], 80)); await filtered.flush();
  assert.equal(filtered.button('Next').props.disabled, false); filtered.button('Next').props.onClick(); filtered.render();
  assert.equal(new URL(filtered.navigation.at(-1).href, 'http://fixture.invalid').searchParams.get('offset'), '50');
  assert.equal(new URL(filtered.navigation.at(-1).href, 'http://fixture.invalid').searchParams.get('parentModelId'), '7');
  filtered.runTimers();
  const second = filtered.listRequests().at(-1);
  filtered.control('Search Model Files').props.onChange({ target: { value: 'latest' } }); filtered.render();
  assert.equal(second.options.signal.aborted, true, 'Changing filters must immediately abort the old request');
  filtered.runTimers(); const latest = filtered.listRequests().at(-1);
  latest.answer(listBody([{ ...tableRows[0], fileName: 'Latest.png' }], 1)); await filtered.flush();
  second.answer(listBody([{ ...tableRows[0], fileName: 'Stale.png' }], 999)); await filtered.flush();
  assert(filtered.text().includes('Latest.png')); assert(!filtered.text().includes('Stale.png'), 'Late responses must not overwrite the current filter context');
  assert(!filtered.text().includes('999 Files'));
  const currentLocation = new URL(filtered.navigation.at(-1).href, 'http://fixture.invalid').searchParams;
  assert.equal(currentLocation.get('offset'), '0', 'Search resets the page'); assert.equal(currentLocation.get('parentModelId'), '7');
  assert.equal(currentLocation.get('fileType'), 'texture'); assert.equal(currentLocation.get('role'), 'supporting');
  filtered.control('Rows per page').props.onValueChange('100'); filtered.render(); filtered.runTimers();
  assert.equal(new URL(filtered.listRequests().at(-1).url, 'http://fixture.invalid').searchParams.get('limit'), '100');
  filtered.listRequests().at(-1).answer({ success: false, error: 'Private provider error' }, 500); await filtered.flush();
  assert(filtered.text().includes('Model Files could not be loaded')); assert(!filtered.text().includes('Private provider error'));
  assert.equal(filtered.button('Next').props.disabled, true); filtered.button('Retry').props.onClick(); filtered.render(); filtered.runTimers();
  filtered.listRequests().at(-1).answer(listBody([], 0)); await filtered.flush();
  assert(filtered.text().includes('No saved Model File attachments found.'));
  filtered.externalLocation('parentModelId=8&sort=size&direction=desc'); filtered.runTimers();
  assert.equal(new URL(filtered.listRequests().at(-1).url, 'http://fixture.invalid').searchParams.get('modelId'), '8', 'Back/forward location changes must reload the exact Model context');
  filtered.unmount(); assert.equal(filtered.listRequests().at(-1).options.signal.aborted, true);

  const invalid = tableHarness('parentModelId=7&parentModelId=8'); invalid.render(); await invalid.flush(); invalid.runTimers();
  assert.equal(invalid.listRequests().length, 0, 'Ambiguous Model filters must not silently fetch a default context');
  assert(invalid.text().includes('Invalid Model Files list address'));
  invalid.button('Reset list filters').props.onClick(); invalid.render(); invalid.runTimers();
  assert.equal(new URL(invalid.listRequests().at(-1).url, 'http://fixture.invalid').searchParams.has('modelId'), false);
  invalid.unmount();

  const delayed = tableHarness('parentModelId=7&search=leaf'); delayed.render(); await delayed.flush(); delayed.runTimers();
  delayed.listRequests()[0].answer(listBody([tableRows[0]], 1)); await delayed.flush();
  const stableRequest = delayed.listRequests()[0];
  delayed.control('Search Model Files').props.onChange({ target: { value: 'leaf ' } }); delayed.render(); delayed.runTimers();
  delayed.control('Parent Model').props.onValueChange('7'); delayed.render(); delayed.runTimers();
  assert.equal(delayed.listRequests().length, 1, 'Canonical-equivalent edits must not start or strand a list request');
  assert.equal(stableRequest.options.signal.aborted, false); assert(delayed.text().includes('Leaf.png'));
  assert.equal(delayed.button('Refresh').props.disabled, false, 'Equivalent filters must preserve loaded state');
  delayed.deferNavigation();
  delayed.control('File type').props.onValueChange('texture'); delayed.render(); delayed.runTimers();
  const beforeAck = delayed.listRequests().at(-1);
  beforeAck.answer(listBody([{ ...tableRows[0], fileName: 'Acknowledged.png' }], 1)); await delayed.flush();
  delayed.acknowledgeNavigation();
  assert.equal(beforeAck.options.signal.aborted, false, 'Acknowledging the same canonical URL must preserve its completed request');
  assert(delayed.text().includes('Acknowledged.png')); assert.equal(delayed.button('Refresh').props.disabled, false);
  delayed.control('Search Model Files').props.onChange({ target: { value: 'pending' } }); delayed.render(); delayed.runTimers();
  const abandoned = delayed.listRequests().at(-1);
  delayed.externalLocation('parentModelId=8&search=history', true); delayed.runTimers();
  assert.equal(abandoned.options.signal.aborted, true);
  const historyRequest = delayed.listRequests().at(-1), historyParams = new URL(historyRequest.url, 'http://fixture.invalid').searchParams;
  assert.equal(historyParams.get('modelId'), '8'); assert.equal(historyParams.get('search'), 'history', 'Browser history must override a pending local navigation');
  historyRequest.answer(listBody([{ ...tableRows[1], fileName: 'History.fbx' }], 1)); await delayed.flush();
  abandoned.answer(listBody([{ ...tableRows[0], fileName: 'Abandoned.png' }], 1)); await delayed.flush();
  assert(delayed.text().includes('History.fbx')); assert(!delayed.text().includes('Abandoned.png'));
  delayed.unmount();
}

async function main() {
  await verifyParserAndAPI();
  await verifyCompiledOwnershipSQL();
  await verifyTable();
  console.log('PASS Model File list: actual strict parser/private GET and installed Drizzle SQL ownership proof; complete owner joins, grouped literal search, exact primary authority, inactive/legacy rows, stable sorting/pagination and safe failures; actual React table explicit-parent Add/cancel/scoped Edit, complete selector paging, filters/navigation and stale-response protection, all offline');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
