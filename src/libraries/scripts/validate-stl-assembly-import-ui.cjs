// Execute the actual dialog handlers/effects with local converter and transport doubles.
// This is interaction/state evidence, not a browser, storage or database smoke check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props, key) => ({ type, props, key });
const names = new Proxy({}, { get: (_, key) => String(key) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function runtime() {
  const slots = [];
  let cursor = 0, effects = [], dirty = false, mounted = false, body, value;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        assert(mounted, 'State update after dialog unmount');
        const result = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(result, slots[index].value)) {
          slots[index].value = result;
          dirty = true;
        }
      }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useId() { const index = cursor++; return (slots[index] ??= { value: `fixture-${index}` }).value; },
    useMemo(factory, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) slots[index] = { dependencies, value: factory() };
      return slots[index].value;
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { dependencies, cleanup: callback() };
      });
    },
  };
  function render() {
    assert(mounted);
    let count = 0;
    do {
      assert(++count < 40, 'Dialog effect loop');
      dirty = false;
      cursor = 0;
      effects = [];
      value = body();
      effects.forEach(effect => effect());
    } while (dirty);
    return value;
  }
  return {
    react,
    render,
    mount(fn) { mounted = true; body = fn; return render(); },
    get value() { return value; },
    async flush() { for (let index = 0; index < 8; index++) { await new Promise(resolve => setTimeout(resolve, 0)); if (mounted) render(); } },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); mounted = false; },
  };
}

function fixture() {
  const rt = runtime();
  const inspections = [], conversions = [], exports = [], plans = [], saves = [], completed = [], opened = [], created = [], revoked = [], prompts = [];
  let inspectHold, conversionHold, exportHold, saveHold, saveError;
  const bounds = { min: [0, 0, 0], max: [4, 3, 8], size: [4, 3, 8] };
  const sourceInspection = { format: 'binary', triangleCount: 30, bounds, hasColors: false };
  const parts = {
    async inspectStlParts(bytes, options, signal) {
      inspections.push({ bytes, options, signal });
      const hold = inspectHold;
      inspectHold = undefined;
      if (hold) await hold.promise;
      return { ...options, source: sourceInspection, bounds, islands: [1, 2, 3].map(index => ({ id: `island-${index}`, triangleCount: 10, bounds, sourceBounds: bounds })) };
    },
    async convertStlParts(bytes, options, groups, signal) {
      exports.push({ bytes, options, groups, signal });
      const hold = exportHold;
      exportHold = undefined;
      if (hold) await hold.promise;
      return { ...options, omittedIslandIds: [], parts: groups.map(group => ({ ...group, bytes: new Uint8Array([1, 2, 3]).buffer, position: [1, 0, 2] })) };
    },
  };
  const importer = {
    async convertStlImport(bytes, options, signal) {
      conversions.push({ bytes, options, signal });
      const hold = conversionHold;
      conversionHold = undefined;
      if (hold) await hold.promise;
      return { ...options, bytes: new Uint8Array([1, 2, 3]).buffer, bounds, source: sourceInspection };
    },
  };
  const workflow = {
    createStlAssemblyImportProgress(ownerId, name, sourceName, conversion) {
      const value = { id: 'new-assembly', ownerId, name, sourceName, parts: conversion.parts, status: 'Prepared', running: false };
      plans.push(value);
      return value;
    },
    async saveStlAssemblyImport(progress, boundary) {
      assert.equal(boundary.currentOwner(), progress.ownerId);
      await boundary.fetch('/fixture/transport-binding');
      saves.push(progress);
      const hold = saveHold;
      saveHold = undefined;
      if (hold) await hold.promise;
      if (boundary.currentOwner() !== progress.ownerId) throw new Error('Account changed');
      if (saveError) {
        progress.parts[0].modelId = 7;
        throw new Error(saveError);
      }
      return { id: 'new-assembly', ownerId: progress.ownerId, name: progress.name, components: [{ id: 'part', modelId: 7 }] };
    },
    recoverStlAssemblyImportModel() { assert.fail('Recovery covered by real client workflow fixture'); },
    stlAssemblyImportReceipt(progress) { return { id: progress.id }; },
  };
  const dependencies = {
    react: rt.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': names,
    '@/components/ui/button': names,
    '@/components/ui/input': names,
    '@/components/ui/dialog': names,
    '@/components/admin/threed/models/model-preview-requirements': { modelForPreview: value => value },
    '@/components/admin/threed/models/ThreeDModelAssetPreview': { ThreeDModelAssetPreview: 'ThreeDModelAssetPreview', MODEL_WORKSPACE_PERSPECTIVE: 'perspective' },
    '@/libraries/services/threed/models/model-primary-upload-client': { uploadThreeDPrimaryFile() { assert.fail('Transport must be called only by the explicit workflow'); } },
    '@/libraries/services/threed/models/model-upload-policy-core': { MAX_THREED_DIRECT_MODEL_BYTES: 32 * 1024 * 1024, threeDModelUploadPolicy(name, size) { assert(/\.glb$/.test(name) && size > 0); } },
    '@/libraries/services/threed/models/assembly-group-core': { MAX_ASSEMBLY_COMPONENTS: 100 },
    '@/libraries/services/threed/models/stl-parts-import': parts,
    '@/libraries/services/threed/models/stl-import': importer,
    './stl-assembly-import-client': workflow,
  };
  const moduleExports = {};
  const file = 'src/components/threed/assemblies/AssemblyStlImport.tsx';
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports: moduleExports,
    require(name) { assert(Object.hasOwn(dependencies, name), `Unexpected dialog import ${name}`); return dependencies[name]; },
    File,
    Blob,
    Error,
    AbortController,
    setTimeout,
    fetch(url) {
      'use strict';
      assert.equal(this, undefined, 'Native fetch must not receive the workflow boundary as its receiver');
      assert.equal(url, '/fixture/transport-binding');
      return Promise.resolve({ ok: true });
    },
    window: { confirm(message) { prompts.push(message); return true; }, addEventListener() {}, removeEventListener() {} },
    URL: {
      createObjectURL() { const url = `blob:assembly-${created.length}`; created.push(url); return url; },
      revokeObjectURL(url) { revoked.push(url); },
    },
  }, { filename: file });
  const props = {
    ownerId: 'owner-1',
    beforeOpen: () => true,
    onOpenChange(value) { opened.push(value); },
    onSaved(value) { completed.push(value); },
  };
  rt.mount(() => moduleExports.AssemblyStlImport(props));
  return {
    rt, props, inspections, conversions, exports, plans, saves, completed, opened, created, revoked, prompts,
    find: predicate => nodes(rt.value).find(predicate),
    holdInspection: () => inspectHold = deferred(),
    holdConversion: () => conversionHold = deferred(),
    holdExport: () => exportHold = deferred(),
    holdSave: () => saveHold = deferred(),
    set saveError(value) { saveError = value; },
  };
}

const button = (f, label) => {
  const found = f.find(node => node.type === 'Button' && text(node.props.children).trim() === label);
  assert(found, `Missing button ${label}`);
  return found;
};
const field = (f, label) => {
  const found = f.find(node => node.props?.['aria-label'] === label);
  assert(found, `Missing field ${label}`);
  return found;
};
const select = (f, suffix) => f.find(node => node.type === 'select' && node.props.id.endsWith(suffix));
const preview = f => f.find(node => node.type === 'ThreeDModelAssetPreview');
const dialog = f => f.find(node => node.type === 'Dialog');
async function choose(f) {
  field(f, 'Choose Assembly STL file').props.onChange({ target: { files: [new File(['STL'], 'parts.stl')], value: 'parts.stl' } });
  f.rt.render();
  await f.rt.flush();
}
async function change(f, suffix, value) {
  select(f, suffix).props.onChange({ target: { value } });
  f.rt.render();
  await f.rt.flush();
}
async function prepare(f) {
  await choose(f);
  await change(f, '-units', 'inches');
  assert(preview(f));
  assert(button(f, 'Create Models and Assembly').props.disabled);
  preview(f).props.onCaptureReady(true);
  f.rt.render();
}

(async () => {
  const f = fixture();
  await choose(f);
  assert.equal(select(f, '-units').props.value, '');
  assert.equal(select(f, '-axis').props.value, 'z');
  assert.equal(f.inspections.length, 0);
  assert.equal(f.saves.length, 0);
  button(f, 'Create Models and Assembly').props.onClick();
  await f.rt.flush();
  assert.equal(f.plans.length, 0);
  await change(f, '-units', 'inches');
  assert.equal(preview(f).props.transientResources, true);
  button(f, 'Create Models and Assembly').props.onClick();
  await f.rt.flush();
  assert.equal(f.saves.length, 0, 'Actual rendered-preview readiness is required');
  preview(f).props.onCaptureReady(true);
  f.rt.render();
  field(f, 'Select part 1 for combining').props.onChange({ target: { checked: true } });
  field(f, 'Select part 2 for combining').props.onChange({ target: { checked: true } });
  f.rt.render();
  button(f, 'Combine selected').props.onClick();
  f.rt.render();
  assert(!f.find(node => node.props?.['aria-label'] === 'Part 3 name'));
  field(f, 'Part 1 name').props.onChange({ target: { value: 'Named combined part' } });
  f.rt.render();
  field(f, 'Preview part 1').props.onClick();
  f.rt.render();
  await f.rt.flush();
  assert.equal(f.exports.at(-1).groups[0].islandIds.join(','), 'island-1,island-2');
  assert.equal(f.exports.at(-1).groups[0].label, 'Named combined part');
  assert(button(f, 'Create Models and Assembly').props.disabled, 'Part preview readiness does not inherit whole-preview readiness');
  preview(f).props.onCaptureReady(true);
  f.rt.render();
  const beforeUnits = preview(f).props.model.filePath;
  const held = f.holdConversion();
  await change(f, '-units', 'metres');
  assert(!preview(f));
  assert(f.revoked.includes(beforeUnits));
  button(f, 'Create Models and Assembly').props.onClick();
  assert.equal(f.saves.length, 0);
  held.resolve();
  await f.rt.flush();
  assert(button(f, 'Create Models and Assembly').props.disabled);
  preview(f).props.onCaptureReady(true);
  f.rt.render();
  const holdAxis = f.holdConversion();
  await change(f, '-axis', 'y');
  assert(!preview(f));
  holdAxis.resolve();
  await f.rt.flush();
  assert.equal(f.conversions.at(-1).options.upAxis, 'y');
  button(f, 'Cancel').props.onClick();
  f.rt.render();
  assert.equal(dialog(f).props.open, false);
  assert.equal(f.opened.at(-1), false);
  assert.equal(f.created.length, f.revoked.length);
  f.rt.unmount();
  console.log('PASS units, grouping/naming, real-preview gate, unit/axis invalidation and URL disposal');

  const saved = fixture();
  await prepare(saved);
  const holdSave = saved.holdSave();
  const click = button(saved, 'Create Models and Assembly').props.onClick;
  click();
  click();
  saved.rt.render();
  await saved.rt.flush();
  assert.equal(saved.saves.length, 1);
  assert(button(saved, 'Cancel').props.disabled);
  dialog(saved).props.onOpenChange(false);
  saved.rt.render();
  assert.equal(dialog(saved).props.open, true);
  let prevented = false;
  saved.find(node => node.type === 'DialogContent').props.onEscapeKeyDown({ preventDefault() { prevented = true; } });
  assert(prevented);
  holdSave.resolve();
  await saved.rt.flush();
  assert.equal(saved.completed.length, 1);
  assert.equal(dialog(saved).props.open, false);
  assert.equal(saved.opened.at(-1), false);
  saved.rt.unmount();
  console.log('PASS explicit confirmation, duplicate-click guard, busy dismissal/Escape and saved navigation callback');

  const retry = fixture();
  await prepare(retry);
  retry.saveError = 'Second part failed';
  button(retry, 'Create Models and Assembly').props.onClick();
  await retry.rt.flush();
  assert(text(retry.find(node => node.props?.role === 'alert')).includes('Second part failed'));
  assert.equal(dialog(retry).props.open, true);
  const state = retry.plans[0];
  assert.equal(state.parts[0].modelId, 7);
  assert(field(retry, 'Part 1 name').props.disabled, 'A partial import cannot change its source plan');
  retry.saveError = undefined;
  button(retry, 'Continue import').props.onClick();
  await retry.rt.flush();
  assert.equal(retry.plans.length, 1);
  assert(retry.saves.every(value => value === state));
  assert.equal(retry.completed.length, 1);
  retry.rt.unmount();
  console.log('PASS partial-progress retention and retry of the same reviewed plan');

  const stale = fixture();
  await choose(stale);
  const staleHold = stale.holdConversion();
  await change(stale, '-units', 'inches');
  await change(stale, '-units', 'centimetres');
  const url = preview(stale).props.model.filePath;
  staleHold.resolve();
  await stale.rt.flush();
  assert.equal(preview(stale).props.model.filePath, url);
  assert.equal(stale.created.length, 1);
  stale.rt.unmount();
  assert.equal(stale.created.length, stale.revoked.length);

  const gone = fixture();
  await choose(gone);
  const goneHold = gone.holdConversion();
  await change(gone, '-units', 'inches');
  gone.rt.unmount();
  goneHold.resolve();
  await gone.rt.flush();
  assert.equal(gone.created.length, 0);
  assert.equal(gone.opened.at(-1), false);

  const account = fixture();
  await prepare(account);
  const exportHold = account.holdExport();
  button(account, 'Create Models and Assembly').props.onClick();
  await account.rt.flush();
  account.props.ownerId = 'owner-2';
  account.rt.render();
  exportHold.resolve();
  await account.rt.flush();
  assert.equal(account.plans.length, 0);
  assert.equal(account.saves.length, 0);
  account.rt.unmount();
  console.log('PASS stale conversion, unmount and account-change suppression before writes');
  console.log('STL Assembly import dialog: offline interaction checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
