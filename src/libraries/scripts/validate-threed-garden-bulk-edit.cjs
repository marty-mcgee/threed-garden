const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run each actual toolbar expression with the rows and state supplied by its list.
const resources = [
  ['plants', 'Plants', 'Plant', 'bulkBusy'],
  ['plantings', 'Plantings', 'Planting', 'recordsBusy'],
  ['beds', 'Beds', 'Bed', 'bulkBusy'],
  ['farmbots', 'Farmbots', 'Farmbot', 'listBusy'],
  ['layers', 'Layers', 'Layer', 'bulkBusy'],
];

for (const [resource, componentName, recordName, busyFlag] of resources) {
  const filename = `src/components/admin/threed/${resource}/ThreeD${componentName}CRUD.tsx`;
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const controls = [];
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'CatalogBulkEditButton') {
      controls.push(node.parent);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(controls.length, 1, `${resource} has a single bulk editor in the list toolbar`);
  const { outputText } = ts.transpileModule('(' + controls[0].getText(source) + ')', {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: 'element',
      target: ts.ScriptTarget.ES2022,
    },
    fileName: 'toolbar.tsx',
  });
  const pageRows = [
    { id: 9, updatedAt: '2026-11-20T09:00:00.000Z' },
    { id: 5, updatedAt: '2026-11-20T10:00:00.000Z' },
    { id: 7, updatedAt: '2026-11-20T11:00:00.000Z' },
  ];
  if (resource === 'plantings') pageRows.forEach((row, index) => { row.sortOrder = index; });
  let selected = new Set([5, 9, 10]);
  let loading = false;
  let refreshed = 0;
  let notice;
  function render(overrides = {}) {
    return vm.runInNewContext(outputText, {
      CatalogBulkEditButton: 'CatalogBulkEditButton',
      element: (_tag, props) => props,
      scrollRecords: true,
      selected,
      loading,
      loadError: '',
      isSubmitting: false,
      showCreateDialog: false,
      [resource]: pageRows,
      [busyFlag]: false,
      ['editing' + recordName]: null,
      setSelected: value => { selected = value; },
      setLoading: value => { loading = value; },
      setBulkNotice: value => { notice = value; },
      ['fetch' + componentName]: () => { refreshed++; },
      ...overrides,
    });
  }
  const toolbar = render();
  assert.equal(toolbar.resource, resource);
  assert.deepEqual(toolbar.rows, pageRows.slice(0, 2), 'Only selected visible records, with their loaded versions, reach the dialog');
  assert.equal(toolbar.disabled, false);
  assert.equal(render({ scrollRecords: false }), false, 'Embedded Project lists retain their host workflow');
  assert.deepEqual(render({ selected: new Set([10]) }).rows, []);
  for (const state of [
    { loading: true },
    { loadError: 'Read failed' },
    { isSubmitting: true },
    { showCreateDialog: true },
    { ['editing' + recordName]: pageRows[0] },
    { [busyFlag]: true },
  ]) {
    assert.equal(render(state).disabled, true);
  }
  toolbar.onSaved();
  assert.equal(selected.size, 0);
  assert.equal(loading, true);
  assert.equal(refreshed, 1);
  assert.match(notice, /updated/i);
}

console.log('PASS: All five garden Bulk Edit toolbars select visible rows, retain stamps, guard busy states, and refresh after save.');
