const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let states = [], cursor = 0, calls = [];
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/animations/AnimationPresets.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: exportsObject, confirm: () => true,
  fetch: async (url, init) => {
    calls.push({ url, ...init });
    return { ok: true, json: async () => ({ success: true, data: url.includes('/apply') ? { reviewToken: 'a'.repeat(64), animations: [], review: [{ actionKey: 'idle', mode: 'disabled', animationId: null, current: null, source: 'unmapped', outcome: 'apply' }] } : [{ id: 1, name: 'Farmer Actions', revision: 1 }] }) };
  }, require: name => name === 'react' ? { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; } } : name === 'react/jsx-runtime' ? { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) } : new Proxy({}, { get: (_, key) => key }),
});
let applied = 0;
const props = { target: 'character', targetId: 2, assignments: [{ actionKey: 'idle', mode: 'disabled', animationId: null }], inherited: [], dirty: false, disabled: false, onBusyChange() {}, onApplied: async () => { applied++; } };
function render() { cursor = 0; return exportsObject.AnimationPresets(props); }
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (!node || typeof node !== 'object') return;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
const button = text => find(render(), n => n.type === 'Button' && n.props.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  button('Animation Mapping Presets').props.onClick(); await flush();
  find(render(), n => n.props?.['aria-label'] === 'Animation preset').props.onChange({ target: { value: '1' } });
  button('Review Apply Preset').props.onClick(); await flush();
  assert.ok(!JSON.parse(calls.at(-1).body).reviewToken, 'Review must not submit an apply token');
  button('Apply reviewed mappings').props.onClick(); await flush();
  assert.equal(JSON.parse(calls.at(-1).body).reviewToken, 'a'.repeat(64)); assert.equal(applied, 1);
  props.dirty = true;
  assert.equal(find(render(), n => n.type === 'fieldset').props.disabled, true, 'Unsaved action edits block presets');
  console.log('PASS: actual preset UI reviews before apply, sends reviewed token, refreshes mappings and blocks dirty drafts.');
})().catch(e => { console.error(e); process.exitCode = 1; });
