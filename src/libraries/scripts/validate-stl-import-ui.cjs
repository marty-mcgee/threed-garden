// Execute the actual import component's handlers/effects with offline boundary doubles.
// This portable fixture does not claim browser rendering, storage or database acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const jsx = (type, props, key) => ({ type, props, key });
const componentNames = new Proxy({}, { get: (_, name) => String(name) });
const nodes = value => Array.isArray(value)
  ? value.flatMap(nodes)
  : value && typeof value === 'object'
    ? [value, ...nodes(value.props?.children)]
    : [];
const text = value => Array.isArray(value)
  ? value.map(text).join(' ')
  : value && typeof value === 'object'
    ? text(value.props?.children)
    : String(value ?? '');

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
    ArrayBuffer,
    File,
    Blob,
    setTimeout,
    clearTimeout,
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
        assert(mounted, 'An asynchronous operation tried to update an unmounted import dialog');
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
    useId() {
      const index = cursor++;
      return (slots[index] ??= { value: `fixture-${index}` }).value;
    },
    useMemo(factory, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) {
        slots[index] = { dependencies, value: factory() };
      }
      return slots[index].value;
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
    assert(mounted, 'Cannot render an unmounted fixture');
    let iterations = 0;
    do {
      assert(++iterations < 40, 'Import dialog render loop');
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
      for (let turn = 0; turn < 4; turn++) {
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

const uploadPolicy = load('src/libraries/services/threed/models/model-upload-policy-core.ts');

function fixture() {
  const rt = runtime();
  const inspected = [];
  const conversions = [];
  const uploads = [];
  const created = [];
  const revoked = [];
  const busy = [];
  let heldConversion;
  let heldUpload;
  let uploadResult = true;
  let uploadError;
  let conversionError;
  let cancelledUploads = 0;
  const inspection = {
    format: 'ascii',
    triangleCount: 1574,
    hasColors: false,
    bounds: {
      min: [-0.375, -0.375, -3],
      max: [48.375, 96.5, 30.1875],
      size: [48.75, 96.875, 33.1875],
    },
  };
  const importer = {
    inspectStlImport(bytes, signal) {
      signal?.throwIfAborted();
      inspected.push(bytes);
      return inspection;
    },
    async convertStlImport(bytes, options, signal) {
      const hold = heldConversion;
      heldConversion = undefined;
      conversions.push({ bytes, options, signal });
      if (hold) await hold.promise;
      // Intentionally complete stale conversions: the UI must reject them even
      // if an asynchronous dependency cannot abort its own ongoing work.
      if (conversionError) throw new Error(conversionError);
      const sceneSize = [4.0625, 2.765625, 8.0729166667];
      return {
        ...options,
        bytes: new TextEncoder().encode(JSON.stringify(options)).buffer,
        source: inspection,
        bounds: { min: [0, 0, 0], max: sceneSize, size: sceneSize },
        sceneSize,
        metresSize: sceneSize.map(value => value * 0.3048),
      };
    },
  };
  const dependencies = {
    react: rt.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': componentNames,
    '@/components/ui/button': componentNames,
    '@/components/ui/dialog': componentNames,
    '@/components/ui/label': componentNames,
    '@/libraries/services/threed/models/model-upload-policy-core': uploadPolicy,
    '@/libraries/services/threed/models/stl-import': importer,
    './model-preview-requirements': { modelForPreview: model => model },
    './ThreeDModelAssetPreview': {
      ThreeDModelAssetPreview: 'ThreeDModelAssetPreview',
      MODEL_WORKSPACE_PERSPECTIVE: 'perspective',
    },
  };
  const component = load('src/components/admin/threed/models/ModelStlImport.tsx', dependencies, {
    fetch() { assert.fail('Local STL review must not perform network requests'); },
    URL: {
      createObjectURL(file) {
        const url = `blob:stl-fixture-${created.length + 1}`;
        created.push({ url, file });
        return url;
      },
      revokeObjectURL(url) { revoked.push(url); },
    },
  });
  const props = {
    disabled: false,
    uploadNotice: '',
    canCancelUpload: true,
    onCancelUpload() { cancelledUploads++; },
    onBusyChange(value) { busy.push(value); },
    async onUseFile(file) {
      uploads.push(file);
      const hold = heldUpload;
      heldUpload = undefined;
      if (hold) await hold.promise;
      if (uploadError) throw new Error(uploadError);
      return uploadResult;
    },
  };
  rt.mount(() => component.ModelStlImport(props));
  return {
    rt,
    inspected,
    conversions,
    uploads,
    created,
    revoked,
    busy,
    props,
    find(predicate) { return nodes(rt.value).find(predicate); },
    holdConversion() { return heldConversion = deferred(); },
    holdUpload() { return heldUpload = deferred(); },
    setUploadResult(result) { uploadResult = result; },
    setUploadError(message) { uploadError = message; },
    setConversionError(message) { conversionError = message; },
    get cancelledUploads() { return cancelledUploads; },
  };
}

const button = (f, label) => {
  const node = f.find(item => item.type === 'Button' && text(item.props.children).trim() === label);
  assert(node, `Missing button: ${label}`);
  return node;
};
const field = (f, label) => {
  const node = f.find(item => item.props?.['aria-label'] === label);
  assert(node, `Missing field: ${label}`);
  return node;
};
const dialog = f => f.find(item => item.type === 'Dialog');
const preview = f => f.find(item => item.type === 'ThreeDModelAssetPreview');
const errorText = f => text(f.find(item => item.props?.role === 'alert'));
async function choose(f, file = new File(['example STL bytes'], 'example.stl')) {
  field(f, 'Choose STL file').props.onChange({ target: { files: [file], value: 'example.stl' } });
  f.rt.render();
  await f.rt.flush();
}
async function change(f, label, value) {
  field(f, label).props.onChange({ target: { value } });
  f.rt.render();
  await f.rt.flush();
}
async function prepare(f) {
  await choose(f);
  await change(f, 'STL source units', 'inches');
  assert(preview(f), 'An explicit unit choice should produce a local preview');
  assert(button(f, 'Upload converted Model').props.disabled, 'Conversion alone does not establish a successful rendered preview');
  button(f, 'Upload converted Model').props.onClick();
  await f.rt.flush();
  assert.equal(f.uploads.length, 0, 'The upload handler requires successful preview readiness');
  preview(f).props.onCaptureReady(true);
  f.rt.render();
}

(async () => {
  const required = fixture();
  await choose(required);
  assert.equal(dialog(required).props.open, true);
  assert.equal(required.busy.at(-1), true);
  assert.equal(field(required, 'STL source units').props.value, '');
  assert.equal(required.inspected.length, 1);
  assert.equal(required.conversions.length, 0, 'STL has no implicit source units');
  assert(button(required, 'Upload converted Model').props.disabled);
  button(required, 'Upload converted Model').props.onClick();
  await required.rt.flush();
  assert.equal(required.uploads.length, 0, 'Confirmation also guards missing units inside the handler');
  await change(required, 'STL source units', 'inches');
  assert.equal(required.conversions[0].options.units, 'inches');
  assert.equal(required.conversions[0].options.upAxis, 'z');
  assert.equal(required.uploads.length, 0, 'Review alone never uploads');
  assert.equal(preview(required).props.model.scale, 1);
  assert.equal(preview(required).props.transientResources, true, 'Local preview resources must not enter the persistent Model cache');
  assert(button(required, 'Upload converted Model').props.disabled);
  preview(required).props.onCaptureReady(true);
  required.rt.render();
  assert.equal(button(required, 'Upload converted Model').props.disabled, false);
  preview(required).props.onCaptureReady(false);
  required.rt.render();
  button(required, 'Upload converted Model').props.onClick();
  await required.rt.flush();
  assert.equal(required.uploads.length, 0, 'A preview loading/error report revokes the upload capability');
  preview(required).props.onCaptureReady(true);
  required.rt.render();
  const firstUrl = preview(required).props.model.filePath;
  const heldUnits = required.holdConversion();
  await change(required, 'STL source units', 'millimetres');
  assert(!preview(required), 'Changed units invalidate the previous preview immediately');
  assert(button(required, 'Upload converted Model').props.disabled);
  assert(required.revoked.includes(firstUrl));
  button(required, 'Upload converted Model').props.onClick();
  assert.equal(required.uploads.length, 0, 'A stale conversion cannot be uploaded');
  heldUnits.resolve();
  await required.rt.flush();
  assert(button(required, 'Upload converted Model').props.disabled, 'Readiness from the old units cannot authorize the new preview');
  preview(required).props.onCaptureReady(true);
  required.rt.render();
  const secondUrl = preview(required).props.model.filePath;
  const heldAxis = required.holdConversion();
  await change(required, 'STL source up axis', 'y');
  assert(!preview(required), 'Changed orientation invalidates the previous preview');
  assert(required.revoked.includes(secondUrl));
  heldAxis.resolve();
  await required.rt.flush();
  assert.equal(required.conversions.at(-1).options.upAxis, 'y');
  const finalPreviewUrl = preview(required).props.model.filePath;
  button(required, 'Cancel').props.onClick();
  required.rt.render();
  assert.equal(dialog(required).props.open, false);
  assert.equal(required.busy.at(-1), false);
  assert(required.revoked.includes(finalPreviewUrl));
  assert.equal(required.uploads.length, 0);
  required.rt.unmount();
  console.log('  Passed: explicit units, local-only review, rendered-preview readiness, unit/orientation invalidation, disabled stale confirmation and preview URL cleanup.');

  const confirmed = fixture();
  await prepare(confirmed);
  const heldUpload = confirmed.holdUpload();
  const confirm = button(confirmed, 'Upload converted Model').props.onClick;
  confirm();
  confirm();
  confirmed.rt.render();
  await confirmed.rt.flush();
  assert.equal(confirmed.uploads.length, 1, 'Rapid confirmation cannot duplicate the staged upload');
  assert.equal(confirmed.uploads[0].name, 'example.glb');
  assert.equal(confirmed.uploads[0].type, 'model/gltf-binary');
  assert(button(confirmed, 'Cancel').props.disabled);
  dialog(confirmed).props.onOpenChange(false);
  confirmed.rt.render();
  assert.equal(dialog(confirmed).props.open, true, 'An active upload cannot be dismissed and orphaned');
  let escapePrevented = false;
  confirmed.find(item => item.type === 'DialogContent').props.onEscapeKeyDown({ preventDefault() { escapePrevented = true; } });
  assert(escapePrevented);
  button(confirmed, 'Cancel upload').props.onClick();
  assert.equal(confirmed.cancelledUploads, 1, 'Upload cancellation delegates to the existing upload owner');
  heldUpload.resolve();
  await confirmed.rt.flush();
  assert.equal(dialog(confirmed).props.open, false);
  assert.equal(confirmed.busy.at(-1), false);
  assert.equal(confirmed.revoked.length, 1);
  confirmed.rt.unmount();

  const retry = fixture();
  await prepare(retry);
  const retainedUrl = preview(retry).props.model.filePath;
  retry.setUploadResult(false);
  button(retry, 'Upload converted Model').props.onClick();
  await retry.rt.flush();
  assert.equal(dialog(retry).props.open, true);
  assert.equal(preview(retry).props.model.filePath, retainedUrl);
  assert.equal(retry.revoked.length, 0);
  assert.match(errorText(retry), /not completed/i);
  assert.equal(button(retry, 'Upload converted Model').props.disabled, false);
  retry.setUploadResult(true);
  retry.setUploadError('Storage verification failed');
  button(retry, 'Upload converted Model').props.onClick();
  await retry.rt.flush();
  assert.match(errorText(retry), /Storage verification failed/);
  assert.equal(preview(retry).props.model.filePath, retainedUrl);
  retry.setUploadError(undefined);
  button(retry, 'Upload converted Model').props.onClick();
  await retry.rt.flush();
  assert.equal(retry.uploads.length, 3);
  assert(retry.uploads.every(file => file === retry.uploads[0]), 'Retry uses the exact reviewed GLB');
  assert.equal(retry.conversions.length, 1);
  assert.equal(dialog(retry).props.open, false);
  assert.equal(retry.busy.at(-1), false);
  retry.rt.unmount();
  console.log('  Passed: one explicit upload, busy dismissal/Escape protection, cancellation delegation and retained retry after false/rejected uploads.');

  const stale = fixture();
  await prepare(stale);
  const staleUrl = preview(stale).props.model.filePath;
  const pendingConversion = stale.holdConversion();
  await change(stale, 'STL source units', 'centimetres');
  button(stale, 'Cancel').props.onClick();
  stale.rt.render();
  assert(stale.conversions.at(-1).signal.aborted);
  pendingConversion.resolve();
  await stale.rt.flush();
  assert.equal(dialog(stale).props.open, false);
  assert.equal(stale.created.length, 1, 'Closing during conversion cannot publish a late object URL');
  assert(stale.revoked.includes(staleUrl));
  assert.equal(stale.busy.at(-1), false);
  assert.equal(stale.uploads.length, 0);
  stale.rt.unmount();

  const replacing = fixture();
  await choose(replacing);
  const olderConversion = replacing.holdConversion();
  await change(replacing, 'STL source units', 'inches');
  await change(replacing, 'STL source units', 'metres');
  const currentUrl = preview(replacing).props.model.filePath;
  olderConversion.resolve();
  await replacing.rt.flush();
  assert.equal(preview(replacing).props.model.filePath, currentUrl, 'A slower old conversion cannot replace the selected unit result');
  assert.equal(replacing.created.length, 1);
  replacing.rt.unmount();
  assert.equal(replacing.busy.at(-1), false);
  assert(replacing.revoked.includes(currentUrl));

  const unmounted = fixture();
  await choose(unmounted);
  const lateConversion = unmounted.holdConversion();
  await change(unmounted, 'STL source units', 'inches');
  unmounted.rt.unmount();
  lateConversion.resolve();
  await unmounted.rt.flush();
  assert.equal(unmounted.created.length, 0);
  assert.equal(unmounted.uploads.length, 0);
  assert.equal(unmounted.busy.at(-1), false);

  const invalid = fixture();
  await choose(invalid, new File(['not STL'], 'example.obj'));
  assert.match(errorText(invalid), /STL file/);
  assert.equal(invalid.inspected.length, 0);
  assert.equal(invalid.uploads.length, 0);
  await choose(invalid, { name: 'oversized.stl', size: 32 * 1024 * 1024 + 1, arrayBuffer() { assert.fail('Oversized STL bytes must not be read'); } });
  assert.match(errorText(invalid), /32 MiB/);
  await prepare(invalid);
  invalid.setConversionError('Invalid triangle data');
  await change(invalid, 'STL source up axis', 'y');
  assert.match(errorText(invalid), /Invalid triangle data/);
  assert(!preview(invalid));
  assert(button(invalid, 'Upload converted Model').props.disabled);
  assert.equal(invalid.uploads.length, 0);
  invalid.rt.unmount();
  assert.equal(invalid.busy.at(-1), false);
  console.log('  Passed: stale conversion/close/unmount isolation, newest-result ownership, size/name rejection, conversion errors and parent busy release.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
