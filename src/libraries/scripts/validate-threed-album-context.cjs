// Actual contextual dialog callbacks; no browser, server or persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const slots = [];
let cursor = 0;
let confirmed = false;
const jsx = (type, props) => ({ type, props });
const mocks = {
  react: {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
  },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  '@/components/ui/button': { Button: 'Button' },
  '@/components/ui/dialog': new Proxy({}, { get: (_, key) => key }),
  './EntityAlbumWorkspace': { EntityAlbumWorkspace: 'Workspace' },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/multimedia/EntityAlbumsSection.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsObject,
  require: name => { assert(name in mocks, name); return mocks[name]; },
  window: { confirm: () => confirmed },
});
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
let tree;
function render() {
  cursor = 0;
  tree = exportsObject.EntityAlbumsSection({ moduleType: 'farmbot', entityId: 19, entityName: 'Garden FarmBot' });
}
const node = type => nodes(tree).find(item => item.type === type);
render();
assert(!node('Workspace'), 'Opening the parent editor does not fetch Albums');
node('Button').props.onClick(); render();
assert.equal(node('Workspace').props.entityId, 19);
assert.equal(node('Workspace').props.moduleType, 'farmbot');
assert.equal(node('Workspace').props.entityName, 'Garden FarmBot');
node('Workspace').props.onStateChange({ dirty: true, busy: false }); render();
node('Dialog').props.onOpenChange(false); render();
assert(node('Dialog').props.open, 'Cancelled discard retains the editor');
let prevented = false;
node('DialogContent').props.onInteractOutside({ preventDefault() { prevented = true; } });
assert(prevented, 'Outside click cannot silently lose a draft');
confirmed = true;
node('Workspace').props.onStateChange({ dirty: false, busy: true }); render();
node('Dialog').props.onOpenChange(false); render();
assert(node('Dialog').props.open, 'Saving prevents close');
node('Workspace').props.onStateChange({ dirty: true, busy: false }); render();
node('Dialog').props.onOpenChange(false); render();
assert(!node('Workspace'), 'Confirmed discard closes and unmounts the editor');
node('Button').props.onClick(); render();
node('Dialog').props.onOpenChange(false); render();
assert(!node('Dialog').props.open, 'Reopening does not inherit the discarded dirty state');
console.log('PASS contextual Albums: exact saved identity, lazy mounting, cancelled discard, busy/overlay guards and clean reopen (mock React).');
