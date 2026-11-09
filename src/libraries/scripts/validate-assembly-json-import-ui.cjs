// Actual dialog handlers/effects with mocked renderer, conversion and save boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const names = new Proxy({}, { get: (_, key) => String(key) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
const document = JSON.parse(fs.readFileSync('public/examples/assembly-groups/template.json', 'utf8'));

function fixture() {
  const slots = [];
  const conversions = [];
  const writes = [];
  const plans = [];
  const saved = [];
  const revoked = [];
  const urls = [];
  let cursor, effects, dirty, body;
  let ownerId = 'owner';
  let mounted = true;
  let releaseSave;
  let failSave = false;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, next => {
        assert(mounted, 'No state writes after unmount');
        const value = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) {
          slots[index].value = value;
          dirty = true;
        }
      }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: fn() };
      });
    },
    useMemo(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() };
      return slots[index].value;
    },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
  };
  const core = {
    MAX_ASSEMBLY_JSON_BYTES: 32 * 1024 * 1024,
    assemblyJsonUnits: ['inches', 'feet', 'millimetres', 'centimetres', 'metres'],
    parseAssemblyJson(value) {
      if (value.format !== 'threed-assembly') throw new Error('Invalid JSON');
      return value;
    },
    async convertAssemblyJson(value, units, signal) {
      conversions.push({ value, units, signal });
      return { parts: value.parts.map(part => ({ label: part.label, bytes: new ArrayBuffer(12), position: [0, 0, 0] })), preview: new ArrayBuffer(16), triangleCount: 24, size: [3, 1, 1] };
    },
  };
  const workflow = {
    createAssemblyModelImportProgress(owner, name, sourceName, parts) {
      const progress = { ownerId: owner, name, sourceName, parts, status: 'Ready' };
      plans.push(progress);
      return progress;
    },
    async saveStlAssemblyImport(progress, boundary) {
      await boundary.fetch('/fixture-save');
      await new Promise(resolve => { releaseSave = resolve; });
      if (boundary.currentOwner() !== progress.ownerId) throw new Error('Account changed');
      if (failSave) throw new Error('Saved Models retained');
      return { id: 'assembly', ownerId: progress.ownerId, components: [] };
    },
    async recoverStlAssemblyImportModel() {},
    stlAssemblyImportReceipt: progress => ({ name: progress.name }),
  };
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': names,
    '@/components/ui/button': names,
    '@/components/admin/threed/models/ModelFieldHelp': names,
    '@/components/ui/input': names,
    '@/components/ui/dialog': names,
    '@/components/admin/threed/models/model-preview-requirements': { modelForPreview: model => model },
    '@/components/admin/threed/models/ThreeDModelAssetPreview': { ThreeDModelAssetPreview: 'Preview', MODEL_WORKSPACE_PERSPECTIVE: 'perspective' },
    '@/libraries/services/threed/models/model-primary-upload-client': { uploadThreeDPrimaryFile: () => assert.fail('Only the explicit save workflow uploads') },
    '@/libraries/services/threed/models/assembly-json-import': core,
    './stl-assembly-import-client': workflow,
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/threed/assemblies/AssemblyJsonImport.tsx', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require: name => { assert(Object.hasOwn(dependencies, name), name); return dependencies[name]; },
    fetch: function (url) {
      'use strict';
      assert.equal(this, undefined, 'Native fetch must be called as a function');
      if (url.startsWith('/examples/')) return Promise.resolve(new Response(JSON.stringify(document)));
      writes.push(url);
      return Promise.resolve(new Response('{}'));
    },
    File,
    Blob,
    Error,
    AbortController,
    URL: {
      createObjectURL() { const url = 'blob:review-' + urls.length; urls.push(url); return url; },
      revokeObjectURL: url => revoked.push(url),
    },
    setTimeout,
    window: { confirm: () => true },
    document: { createElement: () => ({ click() {} }) },
  });
  const onOpenChange = () => {};
  function render() {
    let count = 0;
    do {
      assert(++count < 40, 'Effect loop');
      cursor = 0;
      effects = [];
      dirty = false;
      body = exports.AssemblyJsonImport({ ownerId, disabled: false, beforeOpen: () => true, onOpenChange, onSaved: value => saved.push(value) });
      effects.forEach(effect => effect());
    } while (dirty);
  }
  render();
  return {
    conversions, writes, plans, saved, revoked, urls,
    render,
    nodes: () => nodes(body),
    button: label => nodes(body).find(node => node.type === 'Button' && text(node.props.children).trim() === label),
    field: label => nodes(body).find(node => node.props?.['aria-label'] === label),
    async flush() { for (let i = 0; i < 8; i++) { await new Promise(resolve => setTimeout(resolve, 0)); render(); } },
    release: () => releaseSave(),
    fail: () => { failSave = true; },
    owner: value => { ownerId = value; render(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); mounted = false; },
  };
}

async function choose(f, value = document) {
  f.button('Import JSON').props.onClick();
  f.render();
  f.field('Choose Assembly geometry JSON').props.onChange({ target: { files: [new File([JSON.stringify(value)], 'source.json')], value: 'source.json' } });
  await f.flush();
}

async function run() {
  const f = fixture();
  const sections = [
    'Assembly import settings',
    'Assembly import Models',
    'Assembly import preview',
    'Import progress',
  ];
  const layout = () => ({
    sections: sections.map(label => f.nodes().filter(node => node.props?.['aria-label'] === label).length),
    buttons: f.nodes().filter(node => node.type === 'Button').length,
    previews: f.nodes().filter(node => node.type === 'Preview').length,
  });
  const initialLayout = layout();
  assert(initialLayout.sections.every(count => count === 1));
  await choose(f, { ...document, units: null });
  assert.deepEqual(layout(), initialLayout, 'All sections exist even before units/preview are ready');
  assert.equal(f.conversions.length, 0);
  assert.equal(f.writes.length, 0);
  f.field('JSON source units').props.onChange({ target: { value: 'inches' } });
  await f.flush();
  assert.equal(f.conversions.length, 1);
  assert(f.button('Create Models and Assembly').props.disabled, 'No save before real preview readiness');
  f.nodes().find(node => node.type === 'Preview').props.onCaptureReady(true);
  f.render();
  assert(!f.button('Create Models and Assembly').props.disabled);
  f.field('JSON source units').props.onChange({ target: { value: '' } });
  f.render();
  assert(f.button('Create Models and Assembly').props.disabled);
  assert(f.revoked.includes(f.urls[0]));
  f.field('JSON source units').props.onChange({ target: { value: 'feet' } });
  await f.flush();
  f.nodes().find(node => node.type === 'Preview').props.onCaptureReady(true);
  f.render();
  const save = f.button('Create Models and Assembly').props.onClick;
  save(); save();
  await f.flush();
  assert.equal(f.plans.length, 1);
  assert.equal(f.writes.length, 1);
  assert.deepEqual(layout(), initialLayout, 'Import must not add/remove sections, preview or action buttons');
  assert(f.button('Cancel').props.disabled);
  f.fail(); f.release();
  await f.flush();
  assert.deepEqual(layout(), initialLayout, 'Failure messages occupy existing sections');
  f.button('Continue import').props.onClick();
  await f.flush();
  assert.equal(f.plans.length, 1, 'Retry retains the original import plan');
  f.owner('other'); f.release();
  await f.flush();
  assert.equal(f.saved.length, 0);
  f.unmount();
  console.log('PASS JSON units/readiness, unit invalidation, bound fetch, duplicate Save, retained retry and account-change suppression');
  console.log('PASS settings, Models, preview, progress and actions stay mounted throughout import');

  const sample = fixture();
  sample.button('Import JSON').props.onClick(); sample.render();
  sample.button('Load example').props.onClick(); await sample.flush();
  assert.equal(sample.conversions.length, 1);
  assert.equal(sample.writes.length, 0, 'Example review never creates records');
  sample.button('Cancel').props.onClick(); sample.render();
  assert.equal(sample.revoked.length, 1);
  sample.unmount();
  console.log('PASS bundled example loads locally, Cancel disposes preview, no review writes');

  const success = fixture();
  await choose(success);
  success.nodes().find(node => node.type === 'Preview').props.onCaptureReady(true); success.render();
  success.button('Create Models and Assembly').props.onClick(); await success.flush();
  success.release(); await success.flush();
  assert.equal(success.saved.length, 1);
  success.unmount();
  console.log('PASS explicit successful Save returns the saved Assembly to the existing editor');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
