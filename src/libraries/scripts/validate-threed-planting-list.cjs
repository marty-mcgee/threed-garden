const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(path, 'utf8')), {
    exports,
    Buffer,
    URL,
    URLSearchParams,
    console: {
      log() {},
      error: console.error,
    },
    require(name) {
      assert.ok(name in mocks, name);
      return mocks[name];
    },
  });
  return exports;
}
const parser = load('src/libraries/services/threed/plantings/planting-list-query.ts', {});
const schema = Object.fromEntries(['threedPlantings', 'threedPlants', 'threedBeds'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
schema.plantingStatusEnum = { enumValues: ['planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed'] };
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.getTableColumns = table => ({ id: table.id, name: table.name, sortOrder: table.sortOrder });
let queries = [], queue = [], signedIn = true;
function nextResult() {
  assert.ok(queue.length, 'Unexpected database call');
  const value = queue.shift();
  return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
}
const db = {
  select(selection) {
    const query = { selection };
    const chain = { query };
    for (const method of ['from', 'where', 'orderBy', 'limit', 'offset', 'for']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.leftJoin = (...args) => { (query.joins ??= []).push(args); return chain; };
    chain.then = (resolve, reject) => { queries.push(query); return nextResult().then(resolve, reject); };
    return chain;
  },
  transaction: async callback => {
    const result = await callback(db);
    queries.push({ commit: true });
    return result;
  },
  $with: () => ({ as: chain => { queries.push(chain.query); return schema.threedPlantings; } }),
  with: () => db,
  execute: statement => { queries.push({ statement }); return nextResult(); },
};
const mocks = {
  '@/libraries/services/threed/plantings/planting-list-query': parser,
  '@/libraries/services/threed/list-sort-order': load('src/libraries/services/threed/list-sort-order.ts', {}),
  '@/libraries/services/threed/models/model-primary-file': {},
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema, 'drizzle-orm': orm, '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
};
const api = load('src/app/api/threed/plantings/route.ts', mocks);
async function run(query, responses = []) { queries = []; queue = responses; const result = await api.GET({ url: `http://localhost/api/threed/plantings?${query}` }); assert.equal(queue.length, 0); return result; }

async function checkReorder() {
  const reorder = load('src/app/api/threed/plantings/reorder/route.ts', mocks);
  async function move(body, responses = [], search = '') {
    queries = [];
    queue = responses;
    const result = await reorder.POST({
      url: 'http://fixture/api/threed/plantings/reorder' + search,
      text: async () => typeof body === 'string' ? body : JSON.stringify(body),
      json: async () => typeof body === 'string' ? JSON.parse(body) : body,
    });
    assert.equal(queue.length, 0);
    return result;
  }
  const request = { sourceId: 9, targetId: 3, after: false };
  signedIn = false;
  assert.equal((await move(request)).status, 401);
  signedIn = true;
  for (const invalid of [
    'malformed', null, [], {}, { ...request, after: 'true' }, { ...request, targetId: 9 },
    { ...request, sourceId: 0 }, { ...request, targetId: 2147483648 }, { ...request, sourceId: '9' },
    { ...request, userId: 'other' }, { ...request, sortOrder: 999 },
  ]) {
    assert.equal((await move(invalid)).status, 400);
    assert.deepEqual(queries, [], 'Invalid move attempts must not access records');
  }
  assert.equal((await move(request, [], '?projectId=8')).status, 400);
  const rows = [
    { id: 1, sortOrder: 0 },
    { id: 3, sortOrder: 0 },
    { id: 5, sortOrder: 0 },
    { id: 9, sortOrder: 0 },
    { id: 11, sortOrder: 4 },
  ];
  const result = await move(request, [rows, []]);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.updated, 3);
  const [lock, ranked, update, commit] = queries;
  const table = schema.threedPlantings;
  assert.deepEqual(lock.where, [orm.eq(table.userId, 'owner')]);
  assert.deepEqual(lock.orderBy, [orm.asc(table.id)]);
  assert.deepEqual(lock.for, ['update']);
  assert.deepEqual(ranked.orderBy, [orm.asc(table.sortOrder), orm.asc(table.plantingId), orm.asc(table.id)]);
  assert.equal(ranked.limit, undefined, 'Ranks must include records outside the visible page');
  const sql = update.statement;
  assert.match(sql.strings.join(' '), /SET\s+sort_order\s*=\s*ranks\.sort_order\s+FROM\s+jsonb_to_recordset/i);
  assert.equal(sql.args[0], table);
  assert.ok(sql.args.includes(table.id), 'The update must match individual Planting record IDs');
  const payload = sql.args.find(arg => typeof arg === 'string' && arg.startsWith('['));
  assert.deepEqual(JSON.parse(payload), [
    { id: 9, sort_order: 1 },
    { id: 3, sort_order: 2 },
    { id: 5, sort_order: 3 },
  ]);
  assert.deepEqual(commit, { commit: true });
  assert.deepEqual(sql.args.find(arg => arg?.name === 'eq'), orm.eq(table.userId, 'owner'));
  assert.equal((await move({ ...request, sourceId: 5, after: true }, [rows])).body.data.updated, 0);
  assert.ok(!queries.some(query => query.statement), 'An adjacent no-op must not write');
  for (const foreign of [{ sourceId: 88 }, { targetId: 88 }]) {
    assert.equal((await move({ ...request, ...foreign }, [rows])).status, 404);
    assert.ok(!queries.some(query => query.statement || query.commit));
  }
  assert.equal((await move(request, [rows, Error('mock write failure')])).status, 500);
  assert.ok(!queries.some(query => query.commit), 'A failed write must leave the transaction uncommitted');
  const missing = Object.assign(Error('column "sort_order" does not exist'), { code: '42703' });
  assert.equal((await move(request, [missing])).status, 503);
  assert.ok(!queries.some(query => query.statement || query.commit));
}

async function checkNameWrites() {
  const record = { id: 31, plantingId: 'ROW-31', plantId: 7 };
  let writes = 0;
  function persist(values) {
    writes++;
    Object.assign(record, values);
    return [record];
  }
  db.insert = table => {
    assert.equal(table, schema.threedPlantings);
    return { values: values => ({ returning: () => persist(values) }) };
  };
  db.update = table => {
    assert.equal(table, schema.threedPlantings);
    return { set: values => ({ where: scope => {
      assert.deepEqual(scope, orm.and(orm.eq(schema.threedPlantings.id, record.id), orm.eq(schema.threedPlantings.userId, 'owner')));
      return { returning: () => persist(values) };
    } }) };
  };
  async function write(method, fields) {
    const creating = method === 'POST';
    queue = creating ? [[{ id: 7 }], []] : [[{ ...record }]];
    const body = creating ? { plantingId: record.plantingId, plantId: 7, ...fields } : fields;
    return api[method]({
      url: 'http://fixture/api/threed/plantings?id=31',
      json: async () => body,
    });
  }
  assert.equal((await write('POST', {})).status, 200);
  assert.equal(record.name ?? null, null);
  assert.equal((await write('POST', { name: '  North row  ' })).body.data.name, 'North row');
  for (const method of ['PUT', 'PATCH']) {
    assert.equal((await write(method, { name: ' East row ' })).body.data.name, 'East row');
    assert.equal((await write(method, { notes: 'legacy client' })).body.data.name, 'East row');
    for (const empty of ['', '   ', null]) assert.equal((await write(method, { name: empty })).body.data.name, null);
  }
  const longest = 'x'.repeat(255);
  assert.equal((await write('PATCH', { name: longest })).body.data.name, longest);
  const beforeInvalid = writes;
  for (const method of ['POST', 'PUT', 'PATCH']) {
    for (const name of [true, 'x'.repeat(256)]) assert.equal((await write(method, { name })).status, 400);
    for (const field of ['sortOrder', 'sort_order']) {
      assert.equal((await write(method, { [field]: 500 })).status, 400);
    }
  }
  assert.equal(writes, beforeInvalid);
  assert.equal(record.name, longest);
}

function checkNameColumn(source) {
  const elements = [];
  function collect(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) elements.push(node);
    ts.forEachChild(node, collect);
  }
  collect(source);
  const opening = node => ts.isJsxElement(node) ? node.openingElement : node;
  const table = elements.find(node => opening(node).tagName.getText(source) === 'Table');
  function render(node, bindings) {
    const output = ts.transpileModule('(' + node.getText(source) + ')', {
      fileName: 'plantings.tsx',
      compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'element', target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const tags = Object.fromEntries(elements.map(entry => {
      const tag = opening(entry).tagName.getText(source);
      return [tag, tag];
    }));
    return vm.runInNewContext(output, {
      ...tags,
      ...bindings,
      element: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity).filter(child => child !== false) }),
    });
  }
  const plant = { id: 7, commonName: 'Basil' };
  const rows = [
    { id: 31, name: 'North row', plantingId: 'ROW-31', sortOrder: 0, plantId: plant.id, plant, isActive: true },
    { id: 32, name: null, plantingId: 'ROW-32', sortOrder: null, plantId: plant.id, plant, isActive: false },
  ];
  function contents(branch) {
    return branch.children.flatMap(child => {
      if (typeof child === 'string') return [child];
      return child?.children ? contents(child) : [];
    }).join('');
  }
  for (const scrollRecords of [true, false]) {
    let selected = new Set();
    const bindings = {
      scrollRecords, plantings: rows, filteredPlantings: rows, selected,
      loading: false, loadError: '', bulkBusy: false, isSubmitting: false,
      recordsBusy: false, moving: false, dragging: null, dropTarget: null, canReorder: false,
      reorderHelp: '', clearDrag() {}, columnCount: scrollRecords ? 11 : 10,
      setSelected: next => { selected = typeof next === 'function' ? next(selected) : next; },
      heading: (key, title) => ({ key, title }), renderActions: () => null,
      getStatusColor: () => '', getGrowthStageColor: () => '', getOptionLabel: () => '',
      GROWTH_STAGE_OPTIONS: [], PLANTING_STATUS_OPTIONS: [],
    };
    const view = render(table, bindings);
    const [header, body] = view.children;
    const columns = header.children[0].children;
    assert.equal(columns[0].children[0].props['aria-label'], 'Select Plantings on this page');
    assert.equal(columns[1].key, 'name');
    assert.deepEqual(Array.from(columns.slice(1), column => column.title ?? contents(column)), [
      'Title/Name',
      ...(scrollRecords ? ['Sort Order'] : []),
      'Plant',
      'Bed',
      'Planting ID',
      'Position',
      'Growth',
      'Status',
      'Active',
      'Actions',
    ]);
    const plantColumn = columns.findIndex(column => column.key === 'plant');
    const idColumn = columns.findIndex(column => column.key === 'plantingId');
    for (const [index, row] of body.children.entries()) {
      const cells = row.children;
      assert.equal(cells.length, columns.length);
      assert.equal(cells[0].children[0].props.type, 'checkbox');
      const title = cells[1].children[0].children;
      if (scrollRecords) {
        assert.equal(title[0].children[0].props['aria-label'], 'Reorder ' + (rows[index].name || rows[index].plantingId));
        assert.equal(cells[2].children[0], rows[index].sortOrder ?? '—');
      }
      const [icon, name, inactive] = title.slice(scrollRecords ? 1 : 0);
      assert.equal(icon?.type, 'ModuleIcon', 'Title/Name must keep the Plantings icon directly left of the name');
      assert.equal(icon.props.moduleKey, 'plantings');
      assert.equal(contents(name), rows[index].name ?? '—');
      if (rows[index].isActive) {
        assert.ok(!inactive);
      } else {
        assert.equal(inactive.type, 'Badge');
        assert.equal(contents(inactive), 'Inactive');
      }
      assert.equal(contents(cells[idColumn]), rows[index].plantingId);
      assert.equal(cells[plantColumn].children.length, 1);
      const [badge] = cells[plantColumn].children;
      assert.equal(badge.type, 'AdminRelationshipBadge');
      assert.equal(badge.props.kind, 'plant');
      assert.equal(badge.props.id, plant.id);
      assert.equal(badge.props.label, plant.commonName);
      cells[0].children[0].props.onChange({ target: { checked: true } });
    }
    assert.deepEqual([...selected], rows.map(row => row.id));
    for (const state of [{ loading: true }, { loadError: 'Read failed' }, { filteredPlantings: [] }]) {
      const statusRow = render(table, { ...bindings, ...state }).children[1].children[0];
      assert.equal(statusRow.children[0].props.colSpan, columns.length);
    }
  }
  for (const id of ['name', 'edit-name']) {
    const input = elements.find(node => opening(node).attributes.properties.some(prop =>
      prop.name?.getText(source) === 'id' && prop.initializer?.text === id));
    let draft = { name: 'North row', plantingId: 'ROW-31' };
    const field = render(input, { formData: draft, setFormData: next => { draft = next; }, isSubmitting: false });
    assert.equal(field.props.value, 'North row');
    assert.equal(field.props.maxLength, 255);
    assert.ok(!field.props.required);
    field.props.onChange({ target: { value: 'East row' } });
    assert.equal(draft.name, 'East row');
    assert.equal(draft.plantingId, 'ROW-31');
  }
  const formHelpers = source.statements.filter(node => ts.isFunctionDeclaration(node)
    && ['plantingFormValues', 'plantingPayload'].includes(node.name?.text));
  const form = vm.runInNewContext(compile(formHelpers.map(node => node.getText(source)).join('\n')
    + '\n;({ plantingFormValues, plantingPayload })'));
  const initial = form.plantingFormValues(rows[1]);
  assert.equal(initial.name, '');
  assert.equal(form.plantingPayload(initial).name, null);
  const changes = form.plantingPayload({ ...initial, name: ' South row ' }, initial);
  assert.deepEqual({ ...changes }, { name: 'South row' });
}

(async () => {
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'sort=sql', 'direction=sideways', 'isActive=yes', 'status=wrong', 'plantId=0', 'bedId=oops', 'plantId=2147483648', 'limit=2.5', 'offset=Infinity', `search=${'a'.repeat(201)}`]) assert.equal((await run(query)).status, 400);
  signedIn = false; assert.equal((await run('')).status, 401); signedIn = true;
  for (const size of [1, 50, 200]) {
    const rows = Array.from({ length: size }, (_, id) => ({ id }));
    const result = await run(`limit=${size}&offset=200&search=Rose&status=planted&isActive=true&plantId=7&bedId=8&sort=plant&direction=asc`, [[{ count: '452' }], rows]);
    assert.equal(result.body.pagination.total, 452); assert.equal(queries.length, 2);
    assert.equal(queries[1].limit[0], size); assert.equal(queries[1].offset[0], 200);
    assert.deepEqual(queries[0].where, queries[1].where);
    assert.deepEqual(queries[0].joins, queries[1].joins);
    assert.equal(queries[0].joins.length, 2);
    for (const [table, join] of queries[0].joins) { assert.equal(join.name, 'and'); assert.equal(join.args[1].args[0], table.userId); assert.equal(join.args[1].args[1], 'owner'); }
    assert.equal(queries[1].selection.plant, schema.threedPlants); assert.equal(queries[1].selection.bed, schema.threedBeds);
    assert.equal(queries[1].selection.name, schema.threedPlantings.name);
    const where = queries[0].where[0]; assert.equal(where.name, 'and');
    assert.equal(where.args[0].args[0], 'threedPlantings.userId'); assert.equal(where.args[0].args[1], 'owner');
    const search = where.args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    for (const field of [schema.threedPlantings.name, schema.threedPlantings.plantingId, schema.threedPlants.commonName]) assert.ok(search.args.includes(field));
    assert.equal(queries[1].orderBy[1].args[0], 'threedPlantings.id');
  }
  await run('', [[{ count: 0 }], []]); assert.equal(queries[1].limit[0], 50); assert.equal(queries[1].offset[0], 0); assert.equal(queries[1].orderBy[0].name, 'desc'); assert.equal(queries[1].orderBy[0].args[0], 'threedPlantings.createdAt');
  for (const sort of parser.PLANTING_LIST_SORTS) for (const direction of ['asc', 'desc']) {
    await run(`sort=${sort}&direction=${direction}`, [[{ count: 0 }], []]);
    assert.equal(queries[1].orderBy[0].name, direction);
  }
  for (const direction of ['asc', 'desc']) {
    await run(`sort=name&direction=${direction}`, [[{ count: 0 }], []]);
    const [byName, tieBreaker] = queries[1].orderBy;
    assert.equal(byName.name, direction);
    assert.deepEqual(byName.args[0].args, [schema.threedPlantings.name]);
    assert.deepEqual(tieBreaker, orm.asc(schema.threedPlantings.id));
    await run(`sort=sortOrder&direction=${direction}&limit=25&offset=50`, [[{ count: 90 }], []]);
    const table = schema.threedPlantings;
    assert.deepEqual(queries[1].orderBy, [orm[direction](table.sortOrder), orm.asc(table.plantingId), orm.asc(table.id)]);
    assert.equal(queries[1].offset[0], 50);
  }
  const missingRank = Object.assign(Error('column "threed_plantings"."sort_order" does not exist'), { code: '42703' });
  const legacy = [{ id: 31, name: 'North row', sortOrder: null }];
  const fallback = await run('sort=sortOrder&direction=asc', [[{ count: 1 }], Error('Mock Drizzle wrapper', { cause: missingRank }), legacy]);
  assert.equal(fallback.status, 200);
  assert.deepEqual(fallback.body.data, legacy);
  assert.deepEqual(queries[2].selection.sortOrder, orm.sql`null`);
  assert.deepEqual(queries[2].orderBy, [orm.asc(schema.threedPlantings.plantingId), orm.asc(schema.threedPlantings.id)]);
  assert.deepEqual(queries[1].where, queries[2].where);
  assert.equal(parser.isMissingPlantingSortOrder({ code: '42703', message: 'column "name" does not exist' }), false);
  await checkReorder();
  await checkNameWrites();
  // Exercise the real bulk-delete handler with a partial failure and off-page selection.
  const text = fs.readFileSync('src/components/admin/threed/plantings/ThreeDPlantingsCRUD.tsx', 'utf8');
  const ast = ts.createSourceFile('plantings.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  checkNameColumn(ast);
  let handler;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'deleteSelected') handler = node; ts.forEachChild(node, visit); } visit(ast);
  const requests = []; let notice, refreshed = 0;
  const context = { plantings: [{ id: 1, plantingId: 'Rose' }, { id: 2, plantingId: 'Mint' }], selected: new Set([1, 2, 999]), bulkBusy: false, recordsBusy: false, loading: false, isSubmitting: false,
    confirm: () => true, setBulkBusy() {}, setBulkNotice: value => { notice = value; }, setSelected() {}, fetchPlantings: () => refreshed++, onModuleUpdate() {},
    fetch: async url => { requests.push(url); return { ok: !url.endsWith('=1'), json: async () => ({ success: !url.endsWith('=1'), error: 'Protected' }) }; },
  };
  const remove = vm.runInNewContext(compile(`(${handler.getText(ast)})`), context); await remove();
  assert.deepEqual(requests, ['/api/threed/plantings?id=1', '/api/threed/plantings?id=2']); assert.match(notice, /Deleted 1 of 2/); assert.match(notice, /Rose: Protected/); assert.equal(refreshed, 1);
  requests.length = 0; context.confirm = () => false; await remove(); assert.equal(requests.length, 0);
  console.log('PASS: Planting name writes, legacy rows, both host layouts, forms, scoped search, rank ties, pre-migration fallback, atomic owner-scoped reordering, and page-local deletion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
