const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
const source = fs.readFileSync('src/components/admin/threed/characters/ThreeDCharactersCRUD.tsx', 'utf8');
const ast = ts.createSourceFile('editor.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = new Map();
const effects = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) expressions.set(node.name.text, node.initializer.getText(ast));
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect') effects.push(node.arguments[0].getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
function load(file, mocks = {}, extra = {}) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(file, 'utf8')), { exports, console, URL, URLSearchParams, Number, AbortController, ...extra,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const { validateCharacterDraft } = load('src/components/admin/threed/characters/character-admin-form-core.ts');
// The initializer lives in a destructured useState declaration; inspect that call directly.
let initial;
function findInitial(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === '[formData, setFormData]') initial = node.initializer.arguments[0].getText(ast);
  ts.forEachChild(node, findInitial);
}
findInitial(ast);
const form = { ...vm.runInNewContext(compile('(' + initial + ')')), characterId: 'CHAR-1', name: 'Kate' };
function fn(name, context) { return vm.runInNewContext(compile('(' + expressions.get(name) + ')'), context); }

(async () => {
  validateCharacterDraft(form);
  for (const change of [{ animations: '{}' }, { metadata: '[]' }, { name: ' ' }, { scale: '-1' }, { positionY: 'Infinity' }, { activeStartHour: '24' }, { modelId: '1x' }]) {
    assert.throws(() => validateCharacterDraft({ ...form, ...change }));
  }
  let draft, baseline;
  const loaded = { id: 11, name: 'Kate', characterId: 'CHAR-1', modelId: 88, activeStartHour: 0, activeEndHour: 0, teleportInterval: 0, scale: '2.5', isMovable: true, metadata: { retained: true } };
  fn('openEditDialog', { setEditingCharacter() {}, setFormData: value => { draft = value; }, setBaseline: value => { baseline = value; } })(loaded);
  assert.equal(draft.activeStartHour, '0'); assert.equal(draft.activeEndHour, '0'); assert.equal(draft.teleportInterval, '0');
  assert.equal(draft.modelId, '88'); assert.equal(draft.scale, '2.5'); assert.equal(baseline, JSON.stringify(draft));
  validateCharacterDraft(draft);
  let saved = 0, requests = [], notices = [];
  let releaseFetch;
  const lock = { current: false };
  const context = { formData: draft, editingCharacter: loaded, saveLock: lock, recordLoading: false, recordError: '', validateCharacterDraft,
    showToast: message => notices.push(message), setIsSubmitting() {}, openEditDialog: () => saved++, onModuleUpdate() {}, console: { error() {} },
    fetch: async (url, init) => { requests.push({ url, payload: JSON.parse(init.body) }); return new Promise(resolve => { releaseFetch = resolve; }); } };
  const update = fn('handleUpdate', context);
  const pending = update(); await update(); assert.equal(requests.length, 1, 'duplicate save blocked synchronously');
  assert.equal(requests[0].payload.modelId, 88); assert.equal(requests[0].payload.activeStartHour, 0);
  releaseFetch({ ok: false, json: async () => ({ success: false, error: 'Denied' }) }); await pending;
  assert.equal(saved, 0); assert.equal(lock.current, false); assert.equal(draft.scale, '2.5'); assert.ok(notices.includes('Denied'));
  const success = update(); releaseFetch({ ok: true, json: async () => ({ success: true, data: loaded }) }); await success; assert.equal(saved, 1);
  context.recordError = 'Unavailable'; await update(); assert.equal(requests.length, 2, 'failed reads cannot save');
  let models, urls = [];
  const picker = fn('fetchModels', { AbortController, modelChoicesRequest: { current: null }, setModelsError() {}, setModels: value => { models = value; },
    fetch: async url => { urls.push(url); const offset = Number(new URL('http://local' + url).searchParams.get('offset')); return { ok: true, json: async () => ({ success: true, data: Array.from({ length: offset === 400 ? 1 : 200 }, (_, index) => ({ id: offset + index + 1 })), pagination: { total: 401 } }) }; } });
  await picker(); assert.equal(models.length, 401); assert.equal(urls.length, 3); assert.ok(urls[2].endsWith('offset=400'));
  const modelEffect = effects.find(text => text.includes("'/api/threed/models?id='"));
  let settle, published = [];
  const effect = vm.runInNewContext(compile('(' + modelEffect + ')'), { AbortController, view: 'edit', formData: { modelId: '8' },
    setSelectedModel: value => published.push(value), setModelError() {}, setModelLoading() {},
    fetch: () => new Promise(resolve => { settle = resolve; }) });
  const cleanup = effect(); cleanup(); settle({ ok: true, json: async () => ({ success: true, data: { id: 8 } }) });
  await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(published, [undefined], 'stale selected Model cannot publish');
  // Execute actual navigation guard with mocked DOM, no browser or network.
  const listeners = new Map(); let cleanupGuard, navigated = '', confirmed = false;
  class Anchor { constructor() { this.href = 'http://local/admin/threed/characters'; this.target = ''; } hasAttribute() { return false; } }
  const window = { location: { href: 'http://local/admin/threed/characters/11', assign: url => { navigated = url; } }, confirm: () => confirmed,
    addEventListener: (key, cb) => listeners.set(key, cb), removeEventListener: key => listeners.delete(key) };
  const document = { addEventListener: (key, cb) => listeners.set(key, cb), removeEventListener: key => listeners.delete(key) };
  const { useCharacterPageGuard } = load('src/components/admin/threed/characters/use-character-page-guard.ts', { react: { useRef: value => ({ current: value }), useEffect: cb => { cleanupGuard = cb(); } } }, { window, document, HTMLAnchorElement: Anchor });
  const allow = useCharacterPageGuard(true, true, false);
  let prevented = false;
  const click = () => ({ target: { closest: () => new Anchor() }, button: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
  listeners.get('click')(click()); assert.equal(navigated, ''); assert.equal(prevented, true);
  let unloadPrevented = false; listeners.get('beforeunload')({ preventDefault() { unloadPrevented = true; } }); assert.equal(unloadPrevented, true);
  confirmed = true; listeners.get('click')(click()); assert.equal(navigated, 'http://local/admin/threed/characters');
  allow(); cleanupGuard(); assert.equal(listeners.size, 0);
  useCharacterPageGuard(true, false, true); navigated = ''; listeners.get('click')(click()); assert.equal(navigated, '', 'busy navigation blocked'); cleanupGuard();
  assert.ok(!source.includes('<Dialog')); assert.ok(source.includes('form="character-editor-form"')); assert.ok(source.includes('preserveCameraOnEdit centerAtOrigin'));
  for (const route of ['new/page.tsx', '[id]/page.tsx', '[id]/animations/page.tsx']) assert.ok(fs.existsSync('src/app/admin/threed/characters/' + route));
  console.log('PASS Character editor: actual draft/zero-value loading, validation, duplicate/failed/successful save callbacks, retained Model IDs, complete picker paging, stale Model cancellation and dirty/busy navigation guards (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
