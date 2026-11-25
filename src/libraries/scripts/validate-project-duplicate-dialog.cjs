// Exercise the dialog's real handlers without starting an App or writing a Project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}
const dialog = compile('src/components/map/panels/ProjectDuplicateDialog.tsx');
const feedback = { exports: {}, require: () => ({}) };
vm.runInNewContext(compile('src/components/map/hooks/useWorkspaceSaveFeedback.ts'), feedback);
const jsx = (type, props) => ({ type, props });
const ui = new Proxy({}, { get: (_, key) => String(key) });
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}

function mount(attempts = new Map()) {
  const slots = [], requests = [], opened = [];
  let cursor = 0, releases = 0, closes = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(effect) { const i = cursor++; slots[i] ??= { clean: effect() }; },
  };
  const exports = {};
  vm.runInNewContext(dialog, {
    exports,
    crypto: require('node:crypto').webcrypto,
    fetch: (url, options) => new Promise((resolve, reject) => {
      assert.equal(url, '/api/project/duplicate');
      assert.equal(options.method, 'POST');
      requests.push({ body: options.body, resolve, reject });
    }),
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name.endsWith('useWorkspaceSaveFeedback')) return feedback.exports;
      return ui;
    },
  });
  const capturedDraft = {};
  const props = {
    sourceProjectId: 18,
    sourceName: 'Home',
    attempts,
    capture: () => ({ capturedDraft, snapshot: { viewState: { savedAt: new Date().toISOString() }, architecture: { wall: 1 } } }),
    begin: () => () => releases++,
    onOpenProject: (id, retired) => { assert.equal(retired, capturedDraft); opened.push(id); return true; },
    onClose: () => closes++,
  };
  function render() {
    cursor = 0;
    return elements(exports.ProjectDuplicateDialog(props));
  }
  function submit() { return render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); }
  function respond(status, data) {
    requests.at(-1).resolve(Response.json(data, { status }));
  }
  function unmount() { slots.forEach(slot => slot?.clean?.()); }
  return { attempts, requests, opened, props, render, submit, respond, unmount, releases: () => releases, closes: () => closes };
}

const receipt = { success: true, data: { projectId: 80, name: 'Home v001' } };
async function main() {
  const first = mount();
  const submitted = first.submit();
  await first.submit();
  assert.equal(first.requests.length, 1, 'Double submit must capture and send once');
  first.respond(201, receipt);
  await submitted;
  assert.deepEqual(first.opened, [80]);
  assert.equal(first.attempts.size, 0);
  assert.equal(first.releases(), 1);

  const uncertain = mount();
  const lost = uncertain.submit();
  uncertain.requests[0].reject(new Error('connection interrupted after send'));
  await lost;
  assert.equal(uncertain.render().find(node => node.type === 'Input').props.disabled, true);
  uncertain.render().find(node => node.type === 'Dialog').props.onOpenChange(false);
  uncertain.unmount();
  const reopened = mount(uncertain.attempts);
  reopened.props.capture = () => ({ capturedDraft: {}, snapshot: { viewState: { savedAt: 'later' }, architecture: { wall: 2 } } });
  const retry = reopened.submit();
  assert.equal(reopened.requests[0].body, uncertain.requests[0].body, 'Retry replays the same request key and captured source bytes');
  assert.equal(JSON.parse(reopened.requests[0].body).snapshot.architecture.wall, 1);
  reopened.respond(200, receipt);
  await retry;
  assert.deepEqual(reopened.opened, [], 'Later edits keep the original editor open');
  assert.equal(reopened.attempts.get(18).createdId, 80);
  reopened.props.onOpenProject = () => false;
  await reopened.submit();
  assert.equal(reopened.closes(), 0, 'A veto must retain the confirmed copy');
  reopened.props.onOpenProject = (id, retired) => { assert.equal(retired, undefined); reopened.opened.push(id); return true; };
  await reopened.submit();
  assert.deepEqual(reopened.opened, [80]);
  assert.equal(reopened.requests.length, 1, 'Opening the confirmed copy never creates another');

  for (const viewState of [
    { threeD: { cameraPosition: { x: 3, y: 4, z: 5 } } },
    { multimedia: { reference: { mediaId: 7, view: { left: 20, zoom: 180 } } } },
  ]) {
    const changedView = mount();
    const capturedDraft = changedView.props.capture().capturedDraft;
    const creating = changedView.submit();
    changedView.props.capture = () => ({ capturedDraft, snapshot: { viewState, architecture: { wall: 1 } } });
    changedView.render();
    changedView.respond(201, receipt);
    await creating;
    assert.deepEqual(changedView.opened, [], 'Camera and reference Media changes following capture must keep the source open');
    assert.equal(changedView.attempts.get(18).createdId, 80);
  }

  const unready = mount();
  unready.props.capture = () => { throw new Error('Workspace is loading'); };
  await unready.submit();
  assert.equal(unready.requests.length, 0);
  assert.equal(unready.attempts.size, 0);

  const stale = mount();
  const pending = stale.submit();
  stale.unmount();
  stale.respond(201, receipt);
  await pending;
  assert.deepEqual(stale.opened, [], 'An old Project response cannot navigate another editor');
  assert.equal(stale.attempts.get(18).createdId, 80);

  const rejected = mount();
  const denied = rejected.submit();
  rejected.respond(409, { success: false, error: 'Project settings changed' });
  await denied;
  assert.equal(rejected.attempts.size, 0);
  assert.equal(rejected.render().find(node => node.type === 'Input').props.disabled, false);
  const invalid = rejected.submit();
  rejected.respond(200, { success: true, data: { projectId: 18, name: 'Home v001' } });
  await invalid;
  assert.deepEqual(rejected.opened, []);
  assert.equal(rejected.attempts.get(18).createdId, undefined);
  console.log('PASS: Project duplicate dialog captures once, verifies destination, replays ambiguous requests across reopen, retains newer edits and respects Project transition guards.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
