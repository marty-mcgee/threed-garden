// Exercise the actual dialog with offline request/hook doubles. No server or persistence is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const jsx = (type, props, key) => ({ type, props, key });
const components = new Proxy({}, { get: (_, name) => String(name) });
const nodes = value => Array.isArray(value)
  ? value.flatMap(nodes)
  : value && typeof value === 'object'
    ? [value, ...nodes(value.props?.children)]
    : [];
const text = value => Array.isArray(value)
  ? value.map(text).join(' ')
  : value && typeof value === 'object'
    ? text(value.props?.children)
    : typeof value === 'boolean' ? '' : String(value ?? '');
const plain = value => JSON.parse(JSON.stringify(value));
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    console,
    Error,
    AbortController,
    AbortSignal,
    URLSearchParams,
    ...globals,
    require(name) {
      assert(Object.hasOwn(dependencies, name), `Unexpected UI import: ${name}`);
      return dependencies[name];
    },
  }, { filename: file });
  return exports;
}
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function runtime() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let changed = false;
  let mounted = false;
  let body;
  let value;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        assert(mounted, 'An asynchronous operation tried to update an unmounted placement dialog');
        const result = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(result, slots[index].value)) {
          slots[index].value = result;
          changed = true;
        }
      }];
    },
    useRef(initial) {
      return slots[cursor++] ??= { current: initial };
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) {
        effects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { dependencies, cleanup: callback() };
        });
      }
    },
  };
  const render = () => {
    assert(mounted);
    let iterations = 0;
    do {
      assert(++iterations < 40, 'Placement dialog render loop');
      changed = false;
      cursor = 0;
      effects = [];
      value = body();
      effects.forEach(effect => effect());
    } while (changed);
    return value;
  };
  return {
    react,
    render,
    mount(fn) {
      mounted = true;
      body = fn;
      return render();
    },
    get value() { return value; },
    async flush() {
      for (let turn = 0; turn < 8; turn++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (mounted) render();
      }
    },
    unmount() {
      slots.forEach(slot => slot?.cleanup?.());
      mounted = false;
    },
  };
}

const contract = load('src/libraries/services/threed/models/assembly-group-core.ts', { three: require('three') });
function scenePlacementCallback(globals) {
  const path = 'src/app/dashboard/scene/SceneWorkspace.tsx';
  const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const callbacks = [];
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'AssemblyPlacementDialog') {
      const attribute = node.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.text === 'onPlaced');
      assert(attribute?.initializer && ts.isJsxExpression(attribute.initializer));
      callbacks.push(attribute.initializer.expression.getText(source));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(callbacks.length, 1, 'Validate the actual single Scene placement callback');
  const compiled = ts.transpileModule(`export const callback = ${callbacks[0]};`, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, ...globals }, { filename: path });
  return exports.callback;
}
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return data; },
});
function fixture(componentCount = 2, duplicateModel = false) {
  const rt = runtime();
  const requests = [];
  const posts = [];
  const placements = [];
  const modelHolds = new Map();
  const modelFailures = new Map();
  const selectionHolds = new Map();
  let holdPost;
  let postMode;
  let activeModels = 0;
  let maxActiveModels = 0;
  let generatedIds = 0;
  const definition = {
    formatVersion: 1,
    id: 'reviewed-assembly',
    ownerId: 'fixture-owner',
    name: 'Reviewed pieces',
    revision: 3,
    components: Array.from({ length: componentCount }, (_, index) => ({
      id: `part-${index + 1}`,
      modelId: duplicateModel && index === componentCount - 1 ? 1 : index + 1,
      label: `Piece ${index + 1}`,
      transform: {
        position: { x: index, y: index / 2, z: -index },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
      },
    })),
  };
  const props = {
    open: true,
    projectId: 17,
    modules: [{ id: 8, name: 'Project ThreeD' }],
    initialModuleId: 8,
    onOpenChange(open) { props.open = open; },
    onPlaced(markers, name) { placements.push({ markers: plain(markers), name }); },
  };
  const component = load('src/components/map/panels/AssemblyPlacementDialog.tsx', {
    react: rt.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': components,
    '@/components/ui/button': components,
    '@/components/ui/dialog': components,
    '@/components/ui/input': components,
    '@/components/ui/label': components,
    '@/libraries/services/threed/models/assembly-group-core': contract,
  }, {
    crypto: { randomUUID() { return `placement-request-${++generatedIds}`; } },
    async fetch(url, options = {}) {
      requests.push({ url, options });
      if (url.startsWith('/api/threed/assembly-groups?')) {
        const query = new URLSearchParams(url.split('?')[1]);
        if (query.has('id')) {
          const hold = selectionHolds.get(query.get('id'));
          if (hold) await hold.promise;
          return response({ success: true, data: { ...definition, id: query.get('id') } });
        }
        assert.equal(query.get('limit'), '25');
        return response({ success: true, data: { items: [definition], total: 1 } });
      }
      if (url.startsWith('/api/threed/models?id=')) {
        const id = Number(url.split('=')[1]);
        assert(options.signal, 'Authorized Model hydration must have a timeout/cancellation signal');
        assert.equal(options.cache, 'no-store');
        activeModels++;
        maxActiveModels = Math.max(maxActiveModels, activeModels);
        try {
          const hold = modelHolds.get(id);
          if (hold) await hold.promise;
          else await new Promise(resolve => setTimeout(resolve, 0));
          const fail = modelFailures.get(id);
          if (fail === 'throw') throw new Error('Model network failure');
          if (fail === 'wrong-id') return response({ success: true, data: { id: id + 100, modelName: 'Different Model' } });
          if (fail) return response({ success: false, error: 'Model unavailable' }, fail);
          return response({
            success: true,
            data: {
              id,
              modelName: `Catalog Model ${id}`,
              filePath: `/owned-model-${id}.glb`,
              modelType: 'glb',
              scale: '0.5',
              metadata: { activeSource: 'model' },
              primaryModelFile: { id: id + 1000 },
            },
          });
        } finally {
          activeModels--;
        }
      }
      assert.equal(url, '/api/project/assembly-placements', 'No whole-Project reload or alternative write path');
      assert.equal(options.method, 'POST');
      const request = JSON.parse(options.body);
      posts.push(request);
      if (holdPost) {
        const hold = holdPost;
        holdPost = undefined;
        await hold.promise;
      }
      if (postMode === 'lost') throw new Error('Response lost after commit');
      if (postMode === '403') return response({ success: false, error: 'Project access denied' }, 403);
      if (postMode === '409') return response({ success: false, error: 'Assembly revision changed' }, 409);
      if (postMode === '500') return response({ success: false, error: 'Temporary server failure' }, 500);
      const markers = definition.components.map((part, index) => ({
        id: index + 200,
        markerId: `model-marker-${index + 1}`,
        markerType: 'models',
        threedId: request.threedId,
        sourceAssetId: part.modelId,
        data: {
          instanceName: `Placed ${part.label}`,
          instanceScale: 2,
          instancePosition: { x: index + 4, y: index / 2, z: -index },
        },
      }));
      if (postMode === 'unknown-model') markers[0].sourceAssetId = 9999;
      if (postMode === 'duplicate-marker') markers[1].markerId = markers[0].markerId;
      if (postMode === 'missing-marker') markers.pop();
      if (postMode === 'wrong-module') markers[0].threedId++;
      return response({ success: true, data: { placementId: request.requestId, markers } });
    },
  });
  rt.mount(() => component.AssemblyPlacementDialog(props));
  return {
    rt,
    props,
    definition,
    requests,
    posts,
    placements,
    find(predicate) { return nodes(rt.value).find(predicate); },
    holdModel(id) { const hold = deferred(); modelHolds.set(id, hold); return hold; },
    holdSelection(id) { const hold = deferred(); selectionHolds.set(id, hold); return hold; },
    failModel(id, failure) { if (failure) modelFailures.set(id, failure); else modelFailures.delete(id); },
    setPostMode(mode) { postMode = mode; },
    holdPost() { return holdPost = deferred(); },
    get maxActiveModels() { return maxActiveModels; },
    get activeModels() { return activeModels; },
    get generatedIds() { return generatedIds; },
  };
}
function button(f, label) {
  const result = f.find(node => node.type === 'Button' && text(node.props.children).trim() === label);
  assert(result, `Missing button: ${label}`);
  return result;
}
function field(f, id) {
  const result = f.find(node => node.props?.id === id);
  assert(result, `Missing field: ${id}`);
  return result;
}
const submit = f => f.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
const errorText = f => text(f.find(node => node.props?.role === 'alert'));
async function prepare(f) {
  await f.rt.flush();
  button(f, 'Reviewed pieces').props.onClick();
  await f.rt.flush();
  assert.equal(button(f, 'Place Assembly').props.disabled, false);
}
let count = 0;
let failed = 0;
async function check(label, action) {
  try {
    await action();
    count++;
    console.log(`PASS ${label}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${label}`, error);
  }
}

(async () => {
  await check('authorized hydration is deduplicated/bounded and returned placements render immediately', async () => {
    const f = fixture(8, true);
    await prepare(f);
    await submit(f);
    await f.rt.flush();
    assert.equal(f.maxActiveModels, 4);
    const reads = f.requests.filter(request => request.url.startsWith('/api/threed/models?id='));
    assert.equal(reads.length, 7);
    assert.equal(new Set(reads.map(request => request.url)).size, 7);
    assert.equal(f.posts.length, 1);
    assert.equal(f.posts[0].projectId, 17);
    assert.equal(f.posts[0].threedId, 8);
    assert.equal(f.posts[0].assemblyRevision, 3);
    assert.equal(f.placements.length, 1);
    assert.equal(f.placements[0].markers.length, 8);
    for (const marker of f.placements[0].markers) {
      assert.equal(marker.data.filePath, `/owned-model-${marker.sourceAssetId}.glb`);
      assert.equal(marker.data.modelId, marker.sourceAssetId);
      assert.equal(marker.data.renderingAssetsResolved, true);
      assert.equal(marker.data.primaryModelFile.id, marker.sourceAssetId + 1000);
      assert.equal(marker.data.instanceScale, 2);
      assert.equal(marker.data.scale, '0.5', 'Catalog scale and placement scale remain distinct');
    }
    assert.equal(f.props.open, false);
    f.rt.unmount();
  });

  await check('lost POST response retries identical request identity and preserves corrected transform once', async () => {
    const f = fixture();
    await prepare(f);
    field(f, 'assembly-position-x').props.onChange({ target: { value: '12.5' } });
    field(f, 'assembly-rotation').props.onChange({ target: { value: '90' } });
    f.rt.render();
    f.setPostMode('lost');
    await submit(f);
    await f.rt.flush();
    assert.match(errorText(f), /Response lost/);
    assert.equal(field(f, 'assembly-position-x').props.disabled, true);
    assert.equal(f.placements.length, 0);
    assert.equal(f.posts[0].transform.position.x, 12.5);
    assert.equal(f.posts[0].transform.rotation.y, Math.PI / 2);
    button(f, 'Close').props.onClick();
    f.rt.render();
    f.props.open = true;
    f.rt.render();
    f.setPostMode(undefined);
    await submit(f);
    await f.rt.flush();
    assert.deepEqual(f.posts[1], f.posts[0]);
    assert.equal(f.generatedIds, 1);
    assert.equal(f.placements.length, 1);
    f.rt.unmount();
  });

  await check('pre-POST Model rejection leaves fields editable and issues no placement write', async () => {
    for (const failure of [403, 'throw', 'wrong-id']) {
      const f = fixture(8);
      await prepare(f);
      f.failModel(1, failure);
      await submit(f);
      await f.rt.flush();
      assert.match(errorText(f), /Model/);
      assert.equal(f.posts.length, 0);
      assert.equal(f.activeModels, 0, 'All bounded hydration workers settle before another attempt can start');
      assert.equal(field(f, 'assembly-position-x').props.disabled, false);
      assert.equal(button(f, 'Place Assembly').props.disabled, false);
      f.failModel(1, undefined);
      await submit(f);
      await f.rt.flush();
      assert.equal(f.posts.length, 1);
      assert.equal(f.placements.length, 1);
      f.rt.unmount();
    }
  });

  await check('4xx rejects unlock corrections while server ambiguity retains the original request', async () => {
    for (const mode of ['403', '409', '500']) {
      const f = fixture();
      await prepare(f);
      f.setPostMode(mode);
      await submit(f);
      await f.rt.flush();
      assert.equal(f.placements.length, 0);
      assert.equal(field(f, 'assembly-position-x').props.disabled, mode === '500');
      f.setPostMode(undefined);
      await submit(f);
      await f.rt.flush();
      assert.equal(f.posts[0].requestId === f.posts[1].requestId, mode === '500');
      assert.equal(f.placements.length, 1);
      f.rt.unmount();
    }
  });

  await check('incomplete or unrelated placement responses cannot patch the active Project', async () => {
    for (const mode of ['unknown-model', 'duplicate-marker', 'missing-marker', 'wrong-module']) {
      const f = fixture();
      await prepare(f);
      f.setPostMode(mode);
      await submit(f);
      await f.rt.flush();
      assert.equal(f.placements.length, 0);
      assert.match(errorText(f), /incomplete/);
      assert.equal(field(f, 'assembly-position-x').props.disabled, true);
      f.setPostMode(undefined);
      await submit(f);
      await f.rt.flush();
      assert.equal(f.posts[0].requestId, f.posts[1].requestId);
      assert.equal(f.placements.length, 1);
      f.rt.unmount();
    }
  });

  await check('double submit, invalid input and stale unmount cannot write or patch another Project', async () => {
    const busy = fixture();
    await prepare(busy);
    const held = busy.holdPost();
    const first = submit(busy);
    const second = submit(busy);
    await busy.rt.flush();
    assert.equal(busy.posts.length, 1);
    assert.equal(button(busy, 'Close').props.disabled, true);
    busy.find(node => node.type === 'Dialog').props.onOpenChange(false);
    assert.equal(busy.props.open, true);
    busy.rt.unmount();
    held.resolve();
    await Promise.all([first, second]);
    assert.equal(busy.placements.length, 0);

    const reading = fixture();
    await prepare(reading);
    const model = reading.holdModel(1);
    const pending = submit(reading);
    await reading.rt.flush();
    reading.rt.unmount();
    model.resolve();
    await pending;
    assert.equal(reading.posts.length, 0);
    assert.equal(reading.placements.length, 0);

    const invalid = fixture();
    await prepare(invalid);
    field(invalid, 'assembly-scale').props.onChange({ target: { value: '0' } });
    invalid.rt.render();
    await submit(invalid);
    await invalid.rt.flush();
    assert.match(errorText(invalid), /valid coordinates/);
    assert.equal(invalid.posts.length, 0);
    assert.equal(invalid.requests.filter(request => request.url.startsWith('/api/threed/models')).length, 0);
    assert.equal(field(invalid, 'assembly-scale').props.disabled, false);
    invalid.rt.unmount();
  });

  await check('placement scale rejects values beyond the Scene boundary before Model reads or writes', async () => {
    const f = fixture();
    await prepare(f);
    for (const value of ['1000.0001', '10000']) {
      field(f, 'assembly-scale').props.onChange({ target: { value } });
      f.rt.render();
      await submit(f);
      await f.rt.flush();
      assert.match(errorText(f), /valid coordinates/);
      assert.equal(f.posts.length, 0);
      assert.equal(f.requests.filter(request => request.url.startsWith('/api/threed/models')).length, 0);
      assert.equal(field(f, 'assembly-scale').props.disabled, false);
    }
    field(f, 'assembly-scale').props.onChange({ target: { value: '1000' } });
    f.rt.render();
    await submit(f);
    await f.rt.flush();
    assert.equal(f.posts[0].transform.scale, 1000);
    assert.equal(f.placements.length, 1);
    f.rt.unmount();
  });

  await check('actual Scene callback selects the new Model in a mixed Project and ignores a stale Project scope', () => {
    const dimensions = load('src/libraries/services/threed/characters/character-controller-dimensions.ts');
    const overlap = load('src/libraries/services/threed/markers/character-spawn-overlap.ts', {
      '../characters/character-controller-dimensions.ts': dimensions,
    });
    const beds = load('src/libraries/services/threed/beds/bed-planting-bounds.ts');
    const { buildThreeDRuntimeMarkerResult } = load('src/libraries/services/threed/markers/runtime-marker-builder.ts', {
      '../beds/bed-planting-bounds.ts': beds,
      './character-spawn-overlap.ts': overlap,
    });
    const { applyThreeDProjectClientTransaction } = load('src/libraries/services/threed/markers/project-marker-client-state-core.ts');
    const model = (id, markerId, sourceAssetId) => ({
      id,
      markerId,
      markerType: 'models',
      sourceAssetId,
      threedId: 8,
      positionX: 4,
      positionY: 0.5,
      positionZ: -3,
      name: `Part ${sourceAssetId}`,
      data: {
        modelId: sourceAssetId,
        modelName: `Catalog ${sourceAssetId}`,
        filePath: `/part-${sourceAssetId}.glb`,
        modelType: 'glb',
        scale: 1,
        scaleMultiplier: 2,
        metadata: { activeSource: 'model' },
      },
    });
    const oldModel = model(99, 'existing-model', 9);
    const placed = [model(101, 'new-assembly-model-1', 10), model(102, 'new-assembly-model-2', 11)];
    const raw = {
      plantings: [],
      beds: [{
        id: 6,
        name: 'Existing Bed',
        positionX: 20,
        positionY: 0,
        positionZ: 10,
      }],
      characters: [{
        id: 7,
        name: 'Existing Character',
        positionX: -2,
        positionY: 0,
        positionZ: 3,
        isMovable: false,
      }],
      farmbots: [],
      models: [],
      projectThreedMarkers: [oldModel],
    };
    const data = {
      threed: {
        raw,
        markersCount: 1,
      },
      traffic: { retained: true },
    };
    const sourceBefore = plain(data);
    const beforeResult = buildThreeDRuntimeMarkerResult({ ...raw, projectThreedMarkers: placed });
    assert.equal(beforeResult.issues.length, 0);
    assert.equal(beforeResult.markers[0].type, 'beds', 'The fixture must expose source markers preceding the new Model');
    const assemblyProjectScope = { current: 17 };
    const effects = [];
    let current = data;
    let selected;
    const callback = scenePlacementCallback({
      assemblyProjectScope,
      selectedProjectId: 17,
      data,
      buildThreeDRuntimeMarkerResult,
      applyThreeDProjectClientTransaction,
      setData(update) { current = update(current); effects.push('patch'); },
      selectArchitecture(value) { effects.push(['architecture', value]); },
      groundMapInspector: { setOpen(value) { effects.push(['ground', value]); } },
      setSensorInspector(value) { effects.push(['sensor', value]); },
      setGroupInspector(value) { effects.push(['group', value]); },
      setSelectedIncident(value) { effects.push(['incident', value]); },
      setSelectedMarker(value) { selected = value; },
      setIsModelLibraryOpen(value) { effects.push(['library', value]); },
      setIsProjectAssetsOpen(value) { effects.push(['assets', value]); },
      showToastRef: { current(message, kind) { effects.push(['toast', message, kind]); } },
    });
    callback(placed, 'Reviewed pieces');
    assert.equal(selected.id, placed[0].markerId);
    assert.equal(selected.type, 'models');
    assert.equal(selected.data.modelId, placed[0].sourceAssetId);
    assert.equal(selected.data.filePath, '/part-10.glb');
    assert.deepEqual(plain(selected.position), { x: 4, y: 0.5, z: -3 });
    assert.deepEqual(plain(current.threed.raw.projectThreedMarkers), [oldModel, ...placed]);
    assert.equal(current.threed.raw.characters, raw.characters);
    assert.equal(current.threed.raw.beds, raw.beds);
    assert.equal(current.traffic, data.traffic);
    assert.deepEqual(plain(data), sourceBefore, 'Placement never mutates the captured source payload');
    const after = current;
    const effectCount = effects.length;
    assemblyProjectScope.current = 18;
    callback([model(103, 'stale-assembly-model', 12)], 'Stale Assembly');
    assert.equal(current, after);
    assert.equal(selected.id, placed[0].markerId);
    assert.equal(effects.length, effectCount, 'A stale completion cannot change Project selection, overlays or feedback');
  });
  console.log(`Assembly placement dialog: ${count} offline checks passed; ${failed} failed.`);
  if (failed) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
