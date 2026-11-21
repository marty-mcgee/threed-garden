const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/components/admin/threed/plantings/ThreeDPlantingsCRUD.tsx', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const first = { id: 31, plantingId: 'ROW-31', name: 'North row', sortOrder: 0, isActive: true };
const last = { id: 32, plantingId: 'ROW-32', name: null, sortOrder: 1, isActive: true };
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture({ scrollRecords = true, rows = [first, last], query = {} } = {}) {
  const slots = [], pending = [], lists = [], moves = [], notices = [];
  let cursor = 0;
  let saved = rows;
  let moveResponse = { success: true, data: { updated: 2 } };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef: initial => react.useState({ current: initial })[0],
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      slots[index] = { deps };
      pending.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    AbortController,
    AbortSignal,
    setTimeout: action => action(),
    clearTimeout() {},
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name.endsWith('/toast')) return { useToast: () => ({ showToast: message => notices.push(message) }) };
      if (name.endsWith('/use-admin-list-query-state')) {
        return { useAdminListQueryState: (_path, key, initial) => react.useState(query[key] ?? initial) };
      }
      return new Proxy({}, { get: (_target, key) => key });
    },
    fetch: async (url, init = {}) => {
      if (url === '/api/threed/plantings/reorder') {
        assert.equal(init.method, 'POST');
        moves.push(JSON.parse(init.body));
        const result = moveResponse;
        return { ok: result.success, json: async () => result };
      }
      if (url.startsWith('/api/threed/plantings?')) {
        lists.push(new URL(url, 'http://fixture').searchParams);
        return { ok: true, json: async () => ({ success: true, data: saved, pagination: { total: saved.length } }) };
      }
      assert.match(url, /^\/api\/threed\/(plants|beds|models)\?/);
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    },
  });
  function render() {
    cursor = 0;
    const tree = exports.ThreeDPlantingsCRUD({ scrollRecords });
    for (const run of pending.splice(0)) run();
    return tree;
  }
  async function settle() {
    await flush();
    render();
    await flush();
    return render();
  }
  return {
    render,
    settle,
    lists,
    moves,
    notices,
    respond: (result, records = saved) => { moveResponse = result; saved = records; },
  };
}

function find(tree, predicate) {
  if (Array.isArray(tree)) return tree.map(child => find(child, predicate)).find(Boolean);
  if (tree && typeof tree === 'object') return predicate(tree) ? tree : find(tree.props.children, predicate);
}
const grip = (tree, record) => find(tree, node => node.props['aria-label'] === 'Reorder ' + (record.name || record.plantingId));
const row = (tree, record) => find(tree, node => node.type === 'TableRow' && grip(node, record));
const reorderButton = tree => find(tree, node => node.type === 'Button' && [node.props.children].flat().includes('Reorder'));

(async () => {
  const admin = fixture();
  admin.render();
  let tree = await admin.settle();
  const header = find(tree, node => node.type === 'AdminWorkspaceHeader');
  assert.equal(header.props.showModuleAlbums, false, 'Standalone Plantings must omit the Multimedia Albums shortcut');
  assert.equal(admin.lists[0].get('sort'), 'sortOrder');
  assert.equal(admin.lists[0].get('direction'), 'asc');
  assert.equal(grip(tree, first).props.draggable, true);
  const key = { key: 'ArrowUp', preventDefault() {} };
  grip(tree, first).props.onKeyDown(key);
  assert.equal(admin.moves.length, 0, 'ArrowUp on the first visible row stays on the page');
  admin.respond({ success: true, data: { updated: 2 } }, [{ ...last, sortOrder: 0 }, { ...first, sortOrder: 1 }]);
  grip(tree, last).props.onKeyDown(key);
  grip(tree, last).props.onKeyDown(key);
  tree = await admin.settle();
  assert.deepEqual(admin.moves, [{ sourceId: last.id, targetId: first.id, after: false }]);
  assert.equal(admin.lists.length, 2, 'A successful keyboard move reloads the saved sequence');
  const body = find(tree, node => node.type === 'TableBody');
  assert.ok(grip(body.props.children[0], last), 'The refreshed first row is the moved Planting');
  let focused = 0;
  const button = { focus() { focused++; } };
  grip(tree, first).props.ref(button);
  assert.equal(focused, 0);
  grip(tree, last).props.ref(button);
  grip(tree, last).props.ref(button);
  assert.equal(focused, 1, 'Keyboard focus returns once to the moved record');

  admin.respond({ success: false, error: 'Order changed' });
  const dataTransfer = { setData() {} };
  grip(tree, last).props.onDragStart({ dataTransfer });
  const drop = {
    dataTransfer,
    preventDefault() {},
    clientY: 25,
    currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 30 }) },
  };
  row(admin.render(), first).props.onDragOver(drop);
  assert.equal(dataTransfer.dropEffect, 'move');
  assert.match(row(admin.render(), first).props.className, /border-b-/);
  row(admin.render(), first).props.onDrop(drop);
  tree = await admin.settle();
  assert.deepEqual(admin.moves[1], { sourceId: last.id, targetId: first.id, after: true });
  assert.equal(admin.lists.length, 3, 'A failed move reloads the saved sequence');
  assert.ok(admin.notices.includes('Order changed'));
  assert.equal(grip(tree, last).props.draggable, true);
  for (const updated of [undefined, -1]) {
    admin.respond({ success: true, data: { updated } });
    grip(tree, last).props.onKeyDown({ key: 'ArrowDown', preventDefault() {} });
    tree = await admin.settle();
    assert.match(admin.notices.at(-1), /failed to save/i);
    assert.ok(grip(find(tree, node => node.type === 'TableBody').props.children[0], last));
  }

  find(tree, node => node.props['aria-label'] === 'Edit ' + first.plantingId).props.onClick();
  const albums = find(admin.render(), node => node.type === 'EntityAlbumsSection');
  assert.equal(albums.props.moduleType, 'planting');
  assert.equal(albums.props.entityId, first.id, 'Edit Planting opens Album assignments for the selected record');

  for (const query of [{ search: 'row' }, { sort: { key: 'name', direction: 'asc' } }, { sort: { key: 'sortOrder', direction: 'desc' } }]) {
    const filtered = fixture({ query });
    filtered.render();
    tree = await filtered.settle();
    assert.equal(grip(tree, first).props.disabled, true);
    assert.equal(grip(tree, first).props.draggable, false);
    reorderButton(tree).props.onClick();
    tree = await filtered.settle();
    assert.equal(filtered.lists.at(-1).get('search'), '');
    assert.equal(filtered.lists.at(-1).get('sort'), 'sortOrder');
    assert.equal(filtered.lists.at(-1).get('direction'), 'asc');
    assert.equal(grip(tree, first).props.disabled, false);
  }
  for (const rows of [[first], [first, { ...last, sortOrder: null }]]) {
    const incomplete = fixture({ rows });
    incomplete.render();
    assert.equal(grip(await incomplete.settle(), first).props.disabled, true);
  }
  const embedded = fixture({ scrollRecords: false });
  embedded.render();
  tree = await embedded.settle();
  assert.equal(embedded.lists[0].get('sort'), 'plantingId');
  assert.equal(grip(tree, first), undefined);
  assert.equal(reorderButton(tree), undefined);
  console.log('PASS: Plantings pointer and keyboard placement, refresh after success/failure, duplicate and filter guards, Reorder control, and embedded host.');
})().catch(error => { console.error(error); process.exitCode = 1; });
