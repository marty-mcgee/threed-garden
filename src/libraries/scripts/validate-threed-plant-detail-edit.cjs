// Exercise the real detail page and editor with local hook and network doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

let routeId = '37';
const readResponses = [];
const saveResponses = [];
const writes = [];
const navigation = [];
const plants = new Map([
  [37, {
    id: 37,
    plantId: 'HERB-BASIL',
    commonName: 'Sweet basil',
    type: 'Herb',
    status: 'active',
    sunlight: null,
    waterNeeds: 'Medium',
    perennial: false,
    rawData: { supplier: 'nursery' },
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
  }],
  [42, {
    id: 42,
    plantId: 'HERB-THYME',
    commonName: 'Thyme',
    type: 'Herb',
    status: 'active',
    sunlight: 'Full Sun',
    perennial: true,
  }],
]);

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

async function fetchPlant(url, options = {}) {
  const { pathname, searchParams } = new URL(url, 'https://fixture.invalid');
  if (pathname === '/api/threed/models' && !options.method) {
    return response(200, { success: true, data: [] });
  }
  assert.equal(pathname, '/api/threed/plants');
  const id = Number(searchParams.get('id'));
  assert.ok(id, 'Detail editing must address one Plant directly');
  const plant = plants.get(id);
  if (!plant) return response(404, { success: false, error: 'Plant not found' });
  if (!options.method || options.method === 'GET') {
    return readResponses.shift() ?? response(200, { success: true, data: plant });
  }
  assert.equal(options.method, 'PATCH');
  const changes = JSON.parse(options.body);
  writes.push({ id, changes });
  if (saveResponses.length) return saveResponses.shift();
  const updated = { ...plant, ...changes };
  plants.set(id, updated);
  return response(200, { success: true, data: updated });
}

const instances = new Map();
let active;
let cursor;
let effects;
const hooks = {
  useState(initial) {
    const slots = active;
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => {
      slots[index] = typeof value === 'function' ? value(slots[index]) : value;
    }];
  },
  useRef(initial) {
    return active[cursor++] ??= { current: initial };
  },
  useEffect(effect, dependencies) {
    const slots = active;
    const index = cursor++;
    const previous = slots[index];
    if (previous && dependencies?.every((value, i) => Object.is(value, previous.dependencies?.[i]))) return;
    effects.push(() => {
      previous?.cleanup?.();
      slots[index] = { dependencies, cleanup: effect() };
    });
  },
};
const jsx = (type, props, key) => ({ type, props, key });
const widgets = new Proxy({}, { get: (_, name) => name });
const modules = new Map();
const toast = { showToast() {} };
const router = { push: target => navigation.push(target), replace: target => navigation.push(target) };

function load(file) {
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  vm.runInNewContext(compiled.outputText, {
    exports,
    console,
    AbortController,
    AbortSignal,
    fetch: fetchPlant,
    require(specifier) {
      if (specifier === 'react') return hooks;
      if (specifier === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (specifier === 'next/navigation') return { useParams: () => ({ id: routeId }), useRouter: () => router };
      if (specifier === '@/components/ui/toast') return { useToast: () => toast };
      if (specifier.startsWith('.') || specifier.startsWith('@/components/admin/threed/plants/')) {
        const local = specifier.startsWith('@/') ? path.resolve('src', specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
        if (path.dirname(local) === path.resolve('src/components/admin/threed/plants')) {
          return load(fs.existsSync(local + '.tsx') ? local + '.tsx' : local + '.ts');
        }
      }
      return widgets;
    },
  }, { filename: file });
  return exports;
}

const page = load('src/app/admin/threed/plants/[id]/page.tsx').default;
function render() {
  const mounted = new Set();
  const elements = [];
  effects = [];
  function visit(node, location) {
    if (Array.isArray(node)) return node.forEach((child, index) => visit(child, location + '/' + index));
    if (!node || typeof node !== 'object') return;
    if (typeof node.type === 'function') {
      const key = location + '/' + node.type.name + '/' + (node.key ?? '');
      mounted.add(key);
      if (!instances.has(key)) instances.set(key, []);
      active = instances.get(key);
      cursor = 0;
      return visit(node.type(node.props), key);
    }
    elements.push(node);
    visit(node.props.children, location + '/children');
  }
  visit(jsx(page, {}), 'root');
  for (const [key, slots] of instances) {
    if (mounted.has(key)) continue;
    for (const state of slots) state?.cleanup?.();
    instances.delete(key);
  }
  for (const run of effects) run();
  return elements;
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join('').trim();
  if (node && typeof node === 'object') return text(node.props.children);
  return String(node ?? '').trim();
}

let elements;
async function settle() {
  elements = render();
  await new Promise(resolve => setImmediate(resolve));
  elements = render();
}
function button(label) {
  const match = findButton(label);
  assert.ok(match, 'Missing button ' + label);
  return match.props;
}
function findButton(label) {
  return elements.find(node => node.type === 'Button' && text(node) === label);
}
function nameField() {
  return elements.find(node => node.props.id === 'edit-commonName')?.props;
}
function heading() {
  return text(elements.find(node => node.type === 'h1'));
}
function changeName(value) {
  nameField().onChange({ target: { value } });
  elements = render();
}

async function run() {
  await settle();
  assert.equal(heading(), 'Sweet basil');
  button('Edit').onClick();
  await settle();
  assert.equal(nameField().value, 'Sweet basil');
  changeName('Uncommitted name');
  button('Cancel').onClick();
  await settle();
  assert.equal(heading(), 'Sweet basil');
  assert.equal(nameField(), undefined);
  assert.equal(writes.length, 0);

  button('Edit').onClick();
  await settle();
  assert.equal(nameField().value, 'Sweet basil');
  changeName('Genovese basil');
  saveResponses.push(response(409, { success: false, error: 'Could not save this Plant' }));
  await button('Save Changes').onClick();
  await settle();
  assert.equal(nameField().value, 'Genovese basil');
  assert.equal(heading(), 'Sweet basil');
  assert.equal(text(elements.find(node => node.props.role === 'alert')), 'Could not save this Plant');
  assert.equal(writes.length, 1);
  saveResponses.push(response(200, { success: true, data: plants.get(42) }));
  await button('Save Changes').onClick();
  await settle();
  assert.equal(nameField().value, 'Genovese basil');
  assert.equal(heading(), 'Sweet basil');
  assert.match(text(elements.find(node => node.props.role === 'alert')), /could not confirm/i);
  const retry = button('Save Changes').onClick;
  await Promise.all([retry(), retry()]);
  await settle();
  assert.equal(writes.length, 3);
  for (const { id, changes } of writes) {
    assert.equal(id, 37);
    assert.deepEqual(changes, { commonName: 'Genovese basil' });
  }
  assert.equal(heading(), 'Genovese basil');
  assert.equal(nameField(), undefined);
  assert.deepEqual(navigation, []);

  routeId = '42';
  readResponses.push(response(503, { success: false, error: 'Plants unavailable' }));
  await settle();
  assert.equal(text(elements.find(node => node.props.role === 'alert')), 'Plants unavailable');
  assert.equal(findButton('Edit'), undefined);
  button('Retry').onClick();
  await settle();
  assert.equal(heading(), 'Thyme');
  button('Edit').onClick();
  await settle();
  assert.equal(nameField().value, 'Thyme');
  assert.equal(writes.length, 3);

  // Navigate with the editor open, then deliver the abandoned request after the next route loads.
  const lateRead = Promise.withResolvers();
  readResponses.push(lateRead.promise);
  routeId = '37';
  await settle();
  assert.equal(heading(), '');
  assert.equal(findButton('Edit'), undefined);
  assert.equal(nameField(), undefined);
  routeId = '42';
  await settle();
  assert.equal(heading(), 'Thyme');
  lateRead.resolve(response(200, { success: true, data: plants.get(37) }));
  await settle();
  assert.equal(heading(), 'Thyme');
  button('Edit').onClick();
  await settle();
  assert.equal(nameField().value, 'Thyme');

  routeId = '999';
  await settle();
  assert.ok(elements.some(node => node.type === 'p' && text(node) === 'Plant not found'));
  assert.equal(findButton('Edit'), undefined);
  assert.equal(findButton('Retry'), undefined);
  assert.equal(nameField(), undefined);
  console.log('PASS: Plant detail Edit/Cancel, confirmed Save, failure/retry, missing Plant and stale route responses (mocked)');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
