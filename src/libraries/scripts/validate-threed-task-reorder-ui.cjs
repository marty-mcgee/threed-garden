const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const rows = [
  { id: 1, userId: 'owner', title: 'First', sortOrder: 0, status: 'pending' },
  { id: 2, userId: 'other', title: 'Public', sortOrder: 0, status: 'pending' },
  { id: 3, userId: 'owner', title: 'Last', sortOrder: 0, status: 'pending' },
];
const states = [], effects = [], calls = [], query = {};
const bulkCalls = [];
let cursor, rejectPatch = false, refreshes = 0;
const element = (type, props) => ({ type, props });
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  },
  useRef(initial) { return react.useState({ current: initial })[0]; },
  useEffect(effect) { effects.push(effect); },
};
const modules = {
  react,
  'react/jsx-runtime': { jsx: element, jsxs: element },
  'next-auth/react': { useSession: () => ({ data: { user: { id: 'owner' } } }) },
  '@/components/admin/shared/use-admin-list-query-state': {
    useAdminListQueryState: (_route, key, initial) => [query[key] ?? initial, value => { query[key] = value; }],
  },
  '@/components/ui/toast': { useToast: () => ({ showToast() {} }) },
  '@/libraries/types/threed': {
    TaskPriority: { MEDIUM: 'medium' },
    TaskStatus: { PENDING: 'pending' },
    TASK_TYPE_OPTIONS: [],
    TASK_PRIORITY_OPTIONS: [],
    TASK_STATUS_OPTIONS: [],
  },
};
const exportsObject = {};
function load(file, exports) {
  const source = fs.readFileSync('src/components/admin/threed/tasks/' + file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports, URLSearchParams, AbortSignal,
    require: name => modules[name] ?? new Proxy({}, { get: (_, property) => property }),
    fetch: async (url, init) => {
      if (url === '/api/threed/tasks/bulk') {
        assert.equal(init.method, 'PATCH');
        bulkCalls.push(JSON.parse(init.body));
        return { ok: !rejectPatch, json: async () => ({ success: !rejectPatch, updated: 2, error: 'Could not save' }) };
      }
      if (init?.method === 'PATCH') {
        calls.push(JSON.parse(init.body));
        return { ok: !rejectPatch, json: async () => ({ success: !rejectPatch, changed: true }) };
      }
      assert.match(url, /^\/api\/threed\/tasks\?/);
      refreshes++;
      return { ok: true, json: async () => ({ success: true, data: rows, pagination: { total: rows.length } }) };
    },
  });
}
load('ThreeDTasksCRUD.tsx', exportsObject);

function render(scrollRecords = true) {
  cursor = 0;
  effects.length = 0;
  return exportsObject.ThreeDTasksCRUD({ scrollRecords });
}
function find(node, predicate) {
  if (Array.isArray(node)) {
    return node.map(child => find(child, predicate)).find(Boolean);
  }
  if (node && typeof node === 'object') return predicate(node) ? node : find(node.props?.children, predicate);
}
const grip = (tree, title) => find(tree, node => node.props?.['aria-label'] === 'Reorder ' + title);
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  render();
  effects[1]();
  await flush();
  let tree = render();
  assert(!grip(tree, 'Public'));
  assert(!grip(render(false), 'First'));
  query.search = 'First';
  assert(grip(render(), 'First').props.disabled);
  query.search = '';
  query.direction = 'desc';
  assert(grip(render(), 'First').props.disabled);
  query.direction = 'asc';
  tree = render();
  assert(grip(tree, 'First').props.draggable);
  grip(tree, 'Last').props.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
  grip(tree, 'Last').props.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
  await flush();
  assert.deepEqual(calls, [{ sourceId: 3, targetId: 1, after: false }]);
  assert.equal(refreshes, 2);

  tree = render();
  const dataTransfer = { setData() {} };
  grip(tree, 'First').props.onDragStart({ dataTransfer });
  const destination = tree => find(tree, node => node.type === 'TableRow' && grip(node, 'Last'));
  const drop = {
    dataTransfer, clientY: 20, preventDefault() {},
    currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 30 }) },
  };
  destination(render()).props.onDragOver(drop);
  assert.match(destination(render()).props.className, /border-b-emerald/);
  rejectPatch = true;
  destination(render()).props.onDrop(drop);
  await flush();
  assert.deepEqual(calls[1], { sourceId: 1, targetId: 3, after: true });
  assert.equal(refreshes, 3, 'A failed move reloads the saved order');
  assert(grip(render(), 'First').props.draggable);
  console.log('PASS Tasks reorder UI: drag placement, keyboard moves, owner and sort guards, duplicate submit guard and failure refresh.');

  const bulkButton = tree => find(tree, node => node.type === 'Button' && Array.isArray(node.props.children) && node.props.children.includes('Bulk Edit'));
  tree = render();
  assert(bulkButton(tree).props.disabled);
  assert(find(tree, node => node.props?.['aria-label'] === 'Select Public').props.disabled);
  find(tree, node => node.props?.['aria-label'] === 'Select all editable Tasks on this page').props.onChange({ target: { checked: true } });
  bulkButton(render()).props.onClick();
  const dialog = find(render(), node => node.type === 'BulkTaskEditDialog');
  assert.deepEqual(Array.from(dialog.props.ids), [1, 3]);
  await dialog.props.onSaved(2);
  assert(!find(render(), node => node.type === 'BulkTaskEditDialog'));
  assert(bulkButton(render()).props.disabled);

  states.length = 0;
  modules['@/libraries/services/threed/tasks/bulk-edit'] = { parseBulkTaskEdit: input => input };
  const bulkExports = {};
  load('BulkTaskEditDialog.tsx', bulkExports);
  let saved;
  const form = () => {
    cursor = 0;
    return bulkExports.BulkTaskEditDialog({ ids: [1, 3], onClose() {}, onSaved: count => { saved = count; } });
  };
  const save = tree => find(tree, node => node.type === 'Button' && node.props.children === 'Save Changes');
  assert(save(form()).props.disabled);
  const assignee = find(form(), node => node.type === 'Label' && Array.isArray(node.props.children) && node.props.children.includes('Change Assigned To'));
  find(assignee, node => node.type === 'input').props.onChange({ target: { checked: true } });
  save(form()).props.onClick();
  await flush();
  assert.equal(find(form(), node => node.props?.role === 'alert').props.children, 'Could not save');
  rejectPatch = false;
  save(form()).props.onClick();
  await flush();
  assert.deepEqual(bulkCalls, [
    { ids: [1, 3], changes: { assignedTo: null } },
    { ids: [1, 3], changes: { assignedTo: null } },
  ]);
  assert.equal(saved, 2);
  console.log('PASS Tasks Bulk Edit UI: page-local owner selection, omitted fields, explicit clearing, failure retry and refresh.');
})().catch(error => { console.error(error); process.exitCode = 1; });
