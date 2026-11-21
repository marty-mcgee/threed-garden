// Render the real Bulk Edit button, dialog and request handlers with local hook and network doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

let props;
let instances;
let activeSlots;
let cursor;
let layoutEffects;
let response;
let saved;
const writes = [];
const modules = new Map();
const jsx = (type, props, key) => ({ type, props, key });
const widgets = new Proxy({}, { get: (_target, key) => key });
const hooks = {
  useState(initial) {
    const slots = activeSlots;
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === 'function' ? update(slots[index]) : update; }];
  },
  useRef(initial) {
    return activeSlots[cursor++] ??= { current: initial };
  },
  useLayoutEffect(run, deps) {
    const slots = activeSlots;
    const index = cursor++;
    const previous = slots[index];
    if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
    layoutEffects.push(() => {
      previous?.cleanup?.();
      slots[index] = { deps, cleanup: run() };
    });
  },
};

function load(file) {
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  modules.set(file, exports);
  vm.runInNewContext(outputText, {
    exports, Date, Error, URLSearchParams, AbortSignal,
    async fetch(url, options) {
      writes.push({ url, method: options.method, body: JSON.parse(options.body) });
      return response;
    },
    require(specifier) {
      if (specifier === 'react') return hooks;
      if (specifier === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (specifier === 'lucide-react' || specifier.startsWith('@/components/ui/')) return widgets;
      const local = specifier.startsWith('@/')
        ? path.resolve('src', specifier.slice(2))
        : path.resolve(path.dirname(file), specifier);
      const target = [local, local + '.tsx', local + '.ts'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      assert.ok(target, 'Unsupported test dependency ' + specifier);
      return load(target);
    },
  }, { filename: file });
  return exports;
}

const { CatalogBulkEditButton } = load(path.resolve('src/components/admin/threed/CatalogBulkEditButton.tsx'));
let elements;
function render() {
  const mounted = new Set();
  layoutEffects = [];
  elements = [];
  function visit(node, position) {
    if (Array.isArray(node)) return node.forEach((child, index) => visit(child, position + '/' + index));
    if (!node || typeof node !== 'object') return;
    if (typeof node.type === 'function') {
      const id = position + '/' + node.type.name + '/' + (node.key ?? '');
      mounted.add(id);
      if (!instances.has(id)) instances.set(id, []);
      activeSlots = instances.get(id);
      cursor = 0;
      visit(node.type(node.props), id);
    } else {
      elements.push(node);
      visit(node.props.children, position + '/children');
    }
  }
  visit(jsx(CatalogBulkEditButton, props), 'toolbar');
  for (const [id, slots] of instances) {
    if (mounted.has(id)) continue;
    for (const slot of slots) slot?.cleanup?.();
    instances.delete(id);
  }
  for (const run of layoutEffects) run();
}

const first = { id: 2, name: 'North', updatedAt: '2026-11-19T10:00:00.000Z' };
const second = { id: 7, name: 'South', updatedAt: '2026-11-19T11:00:00.000Z' };
function start(resource, rows = [first, second], extra = {}) {
  writes.length = 0;
  instances = new Map();
  saved = 0;
  props = { resource, rows, onSaved: () => { saved++; }, ...extra };
  render();
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node && typeof node === 'object') return text(node.props.children);
  return String(node ?? '');
}
function button(label) {
  return elements.find(node => node.type === 'Button' && text(node).trim() === label)?.props;
}
function open() {
  const trigger = button('Bulk Edit');
  assert.ok(trigger && !trigger.disabled);
  trigger.onClick();
  render();
  assert.ok(button('Save Changes').disabled);
}

function changeChoice(label, value) {
  const group = elements.find(node => node.type === 'label' && text(node.props.children[0]) === label);
  const select = group.props.children.find(node => node.type === 'select');
  select.props.onChange({ target: { value } });
  render();
}
function changeInput(label, value) {
  const entry = elements.find(node => node.props['aria-label'] === label);
  entry.props.onChange({ target: { value } });
  render();
}
function optionalFieldToggle(label) {
  const group = elements.find(node => node.type === 'label' && text(node).trim() === 'Change ' + label);
  return group.props.children[0].props;
}
function enableOptionalField(label) {
  const toggle = optionalFieldToggle(label);
  assert.ok(!toggle.disabled);
  toggle.onChange({ target: { checked: true } });
  render();
}
function rename(name, value) {
  const group = elements.find(node => node.type === 'label' && text(node).startsWith(name + ' (#'));
  group.props.children.find(node => node.type === 'Input').props.onChange({ target: { value } });
  render();
}
function submit() {
  return elements.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
}
function success(count) {
  return Response.json({ success: true, data: { updated: count } });
}

(async () => {
  start('plantings', []);
  assert.ok(button('Bulk Edit').disabled, 'Select records to open the editor');
  start('plantings', [{ ...first, updatedAt: 'unknown' }]);
  assert.ok(button('Bulk Edit').disabled, 'An unreadable timestamp cannot be captured');
  start('beds', Array.from({ length: 201 }, (_, index) => ({ ...first, id: index + 1 })));
  assert.ok(button('Bulk Edit').disabled);
  start('model-files', [{ ...first, modelId: null }]);
  assert.ok(button('Bulk Edit').disabled, 'A File requires its parent Model');
  start('beds');
  open();
  changeChoice('Status', 'maintenance');
  button('Cancel').onClick();
  render();
  assert.equal(writes.length, 0, 'Cancel discards a draft without a write');
  open();

  start('plantings', [first, { ...second, updatedAt: null }]);
  open();
  assert.ok(optionalFieldToggle('Sort Order').disabled, 'Records missing saved ranks still allow other fields');
  changeChoice('Active', 'false');
  changeChoice('Status', 'growing');
  changeChoice('Status', '');
  props = { ...props, rows: [{ ...first, updatedAt: '2026-11-20T10:00:00.000Z' }, second] };
  render();
  response = Response.json({ success: false, error: 'A selected record changed.' }, { status: 409 });
  await submit();
  render();
  assert.equal(saved, 0);
  assert.equal(text(elements.find(node => node.props.role === 'alert')), 'A selected record changed.');
  assert.deepEqual(writes[0], {
    method: 'PATCH',
    url: '/api/threed/bulk-edit/plantings',
    body: {
      action: 'set',
      selection: [
        { id: first.id, expectedUpdatedAt: first.updatedAt },
        { id: second.id, expectedUpdatedAt: null },
      ],
      changes: { isActive: false },
    },
  });
  response = success(1);
  await submit();
  render();
  assert.deepEqual(writes[1], writes[0], 'Failure retains the opted-in field and the captured record versions');
  assert.equal(saved, 0, 'A partial acknowledgement cannot close a bulk save');
  let finishSave;
  response = new Promise(resolve => { finishSave = resolve; });
  const saving = submit();
  await submit();
  render();
  assert.equal(writes.length, 3, 'Only one save may be in flight');
  assert.ok(button('Saving…').disabled);
  elements.find(node => node.type === 'Dialog').props.onOpenChange(false);
  render();
  assert.ok(button('Saving…'), 'The dialog stays open while saving');
  finishSave(success(2));
  await saving;
  render();
  assert.equal(saved, 1);
  assert.equal(button('Save Changes'), undefined);

  start('scenarios', [first], { scope: { projectId: 15 } });
  open();
  changeChoice('Active', 'false');
  response = new Promise(resolve => { finishSave = resolve; });
  const previousProjectSave = submit();
  const refreshes = [];
  props = { ...props, scope: { projectId: 16 }, rows: [second], onSaved: () => refreshes.push('initial callback') };
  render();
  open();
  changeChoice('Active', 'true');
  finishSave(success(1));
  await previousProjectSave;
  render();
  assert.equal(saved, 0, 'A delayed save must not refresh its unmounted Project list');
  assert.deepEqual(refreshes, [], 'A prior save must not clear the new selection');
  assert.equal(button('Save Changes').disabled, false, 'The new Project keeps its own draft');

  response = new Promise(resolve => { finishSave = resolve; });
  const currentProjectSave = submit();
  props = { ...props, onSaved: () => refreshes.push('current callback') };
  render();
  finishSave(success(1));
  await currentProjectSave;
  render();
  assert.deepEqual(refreshes, ['current callback'], 'A confirmed save refreshes the currently mounted scope once');

  for (const target of [-3, 0]) {
    start('plantings', [{ ...first, sortOrder: 0 }, { ...second, sortOrder: -1 }]);
    open();
    enableOptionalField('Sort Order');
    changeInput('Sort Order', String(target));
    props = { ...props, rows: [{ ...first, sortOrder: 8 }, { ...second, sortOrder: -1 }] };
    render();
    response = success(2);
    await submit();
    render();
    assert.equal(saved, 1);
    assert.deepEqual(writes[0].body.changes, { sortOrder: target });
    assert.deepEqual(writes[0].body.selection.map(row => row.expectedSortOrder), [0, -1],
      'A later list refresh must not replace the captured pre-drag ranks');
  }

  start('model-files', [{ ...first, modelId: 17 }], { scope: { modelId: 17 } });
  open();
  enableOptionalField('Load Order');
  await submit();
  render();
  assert.equal(writes.length, 0, 'An empty number field cannot silently become zero');
  changeInput('Load Order', '0');
  response = success(1);
  await submit();
  render();
  assert.equal(writes[0].url, '/api/threed/bulk-edit/model-files?modelId=17');
  assert.deepEqual(writes[0].body.changes, { loadOrder: 0 });
  assert.deepEqual(writes[0].body.selection, [{ id: first.id, modelId: 17, expectedUpdatedAt: first.updatedAt }]);
  assert.equal(saved, 1);

  start('simulations', [{ ...first, revision: 6 }], { scope: { projectId: 15 } });
  open();
  enableOptionalField('Description');
  props = { ...props, scope: { projectId: 16 } };
  render();
  assert.equal(button('Save Changes'), undefined, 'Changing Project scope discards an open draft');
  open();
  enableOptionalField('Description');
  response = success(1);
  await submit();
  render();
  assert.deepEqual(writes[0].body.changes, { description: null }, 'Opting into blank Description explicitly clears it');
  assert.equal(writes[0].body.selection[0].revision, 6);
  assert.equal(writes[0].url, '/api/threed/bulk-edit/simulations?projectId=16');

  start('animation-categories');
  open();
  rename('North', 'Summer');
  rename('North', 'North');
  assert.ok(button('Save Changes').disabled, 'Restoring a Category name removes its edit');
  rename('South', 'Late season');
  props = { ...props, rows: [first] };
  render();
  assert.equal(button('Save Changes'), undefined, 'A new selection cannot inherit the Category names draft');
  props = { ...props, rows: [first, second] };
  render();
  open();
  rename('South', 'Late season');
  response = success(2);
  await submit();
  render();
  assert.equal(saved, 1);
  assert.deepEqual(writes[0].body.changes, { names: { [second.id]: 'Late season' } });
  assert.equal(writes[0].body.selection.length, 2);
  console.log('PASS: Catalog Bulk Edit selected fields, captured scope and versions, draft retention, duplicate saves, numeric zero, explicit clears, and per-Category names.');
})().catch(error => { console.error(error); process.exitCode = 1; });
