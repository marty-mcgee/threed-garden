const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD.tsx', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
});

function fixture(view, query = {}) {
  const exports = {}, requests = [], effects = [], states = [];
  let cursor = 0;
  function useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  }
  const jsx = (type, props) => ({ type, props });
  const records = [1, 2].map(id => ({ id, sortOrder: id, updatedAt: '2026-11-20T10:00:00.000Z',
    ...(view === 'history' ? { historyId: `Record ${id}`, status: 'success' } : { scheduleId: `Record ${id}`, frequency: 'daily' }),
  }));
  vm.runInNewContext(outputText, {
    exports, URLSearchParams, AbortController, AbortSignal,
    setTimeout: run => run(), clearTimeout() {},
    require(name) {
      if (name === 'react') return { useState, useRef: current => useState({ current })[0], useEffect: effect => effects.push(effect) };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name.endsWith('use-admin-list-query-state')) {
        return { useAdminListQueryState: (_route, key, initial) => [query[key] ?? (key === 'view' ? view : initial), value => { query[key] = value; }] };
      }
      if (name.endsWith('watering-list-query')) return { wateringScheduleSortFields: ['sortOrder', 'nextWatering'], wateringHistorySortFields: ['sortOrder', 'executedAt'] };
      return new Proxy({}, { get: (_, key) => key });
    },
    fetch: async (url, options) => {
      requests.push({ url, body: options.body && JSON.parse(options.body) });
      const payload = options.method === 'PATCH' ? { data: { updated: 2 } } : { data: records, pagination: { total: records.length } };
      return { ok: true, json: async () => ({ success: true, ...payload }) };
    },
  });
  const render = (props = { manageSchedules: true }) => {
    cursor = 0;
    effects.length = 0;
    return exports.ThreeDWateringSchedulesCRUD(props);
  };
  return { render, requests, read: () => effects[0]() };
}

function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (node && typeof node === 'object') return predicate(node) ? node : find(node.props.children, predicate);
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const grip = (tree, id) => find(tree, node => node.props['aria-label'] === `Reorder Record ${id}`);
const reorder = tree => find(tree, node => node.type === 'Button' && Array.isArray(node.props.children) && node.props.children.includes('Reorder'));

(async () => {
  for (const view of ['schedules', 'history']) {
    const admin = fixture(view);
    admin.render(); admin.read(); await flush();
    assert.match(admin.requests[0].url, /sortBy=sortOrder&sortDir=asc$/);
    const tree = admin.render();
    assert.equal(grip(tree, 2).props.disabled, false);
    assert.equal(grip(tree, 2).props.draggable, true);
    grip(tree, 2).props.onDragStart({ dataTransfer: { setData() {} } });
    const destination = find(tree, node => node.type === 'TableRow' && grip(node, 1));
    const event = { preventDefault() {}, clientY: 10, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 30 }) }, dataTransfer: {} };
    destination.props.onDragOver(event);
    assert.equal(event.dataTransfer.dropEffect, 'move');
    destination.props.onDrop(event);
    await flush();
    assert.deepEqual(admin.requests[1], { url: '/api/threed/waterings/manage?view=' + view, body: { action: 'move', sourceId: 2, targetId: 1, after: false } });

    const filtered = fixture(view, { search: 'Record' });
    filtered.render(); filtered.read(); await flush();
    assert.equal(grip(filtered.render(), 2).props.disabled, true);
    reorder(filtered.render()).props.onClick();
    filtered.render(); filtered.read(); await flush();
    assert.match(filtered.requests[1].url, /search=&sortBy=sortOrder&sortDir=asc$/);
    assert.equal(grip(filtered.render(), 2).props.draggable, true);

    const project = fixture(view);
    project.render({ threedId: 9 }); project.read(); await flush();
    assert.match(project.requests[0].url, view === 'history' ? /sortBy=executedAt&sortDir=desc$/ : /sortBy=nextWatering&sortDir=desc$/);
    assert.equal(grip(project.render({ threedId: 9 }), 2), undefined);
  }
  console.log('PASS: Both standalone Waterings lists accept drag-and-drop on initial load and Reorder restores grips after search.');
})().catch(error => { console.error(error); process.exitCode = 1; });
