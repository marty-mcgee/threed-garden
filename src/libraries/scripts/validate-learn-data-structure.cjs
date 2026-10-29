// Offline actual-component handlers and generator checks. No HTTP or database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const schema = require('../../../docs/developers/app-data-structure.json');

function load(file, modules, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    URLSearchParams,
    ...globals,
    require(name) {
      assert(Object.hasOwn(modules, name), `Unexpected runtime dependency: ${name}`);
      return modules[name];
    },
  });
  return exports;
}

const helpers = load('src/components/learn/data-structure/schema-explorer.ts', {});
assert.equal(helpers.tableFromHash('#table=project_assets', schema.tables).name, 'project_assets');
assert.equal(helpers.tableFromHash('#table=not-a-table', schema.tables), null);
assert.equal(helpers.tableFromHash('#table=%E0%A4%A', schema.tables), null);
assert.equal(helpers.filterTables(schema.tables, 'learn', '').length, 1);
assert(helpers.filterTables(schema.tables, 'all', ' ALBUM_ID ').some(table => table.id === 'multimedia_tracks'));
assert.equal(helpers.filterTables(schema.tables, 'traffic', 'album_id').length, 0);
assert(helpers.schemaSourceUrl('src/libraries/schema/project/index.ts', 141).endsWith('/src/libraries/schema/project/index.ts#L141'));
const speech = helpers.visibleRelationships(schema.edges, 'multimedia_speech', ['foreign-key']);
assert(speech.some(edge => edge.fromColumns.join(',') === 'id,accepted_version_number'));
assert.equal(helpers.visibleRelationships(schema.edges, 'project_assets', []).length, 0);

const jsx = (type, props) => ({ type, props: props ?? {} });
const runtime = { jsx, jsxs: jsx };
const text = node => Array.isArray(node) ? node.map(text).join(' ') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
function all(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => all(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...predicate(node) ? [node] : [], ...all(node.props?.children, predicate)];
}
function one(node, predicate) {
  const matches = all(node, predicate);
  assert.equal(matches.length, 1);
  return matches[0];
}
function harness() {
  const slots = [];
  const jobs = [];
  let cursor = 0;
  let dirty = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) {
          slots[index].value = next;
          dirty = true;
        }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useId() { return 'offline-graph'; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) jobs.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      });
    },
  };
  return {
    react,
    render(component) {
      for (let pass = 0; pass < 20; pass++) {
        cursor = 0;
        dirty = false;
        const tree = component();
        jobs.splice(0).forEach(job => job());
        if (!dirty) return tree;
      }
      throw new Error('Render loop');
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

const state = harness();
const listeners = new Map();
const browser = {
  location: { hash: '#table=project_assets' },
  addEventListener: (name, callback) => listeners.set(name, callback),
  removeEventListener: name => listeners.delete(name),
};
const component = load('src/components/learn/data-structure/SchemaExplorer.tsx', {
  react: state.react,
  'react/jsx-runtime': runtime,
  '@/components/ui/button': { Button: 'button' },
  '@/components/ui/input': { Input: 'input' },
  '@/components/ui/select': {
    Select: 'select',
    SelectContent: 'options',
    SelectItem: 'option',
    SelectTrigger: 'trigger',
    SelectValue: 'value',
  },
  './schema-explorer': helpers,
  './SchemaTableDetails': { SchemaTableDetails: 'details-component' },
}, { window: browser });
const draw = () => state.render(() => component.SchemaExplorer({ schema }));
let tree = draw();
assert.equal(one(tree, node => node.type === 'details-component').props.table.id, 'project_assets');
assert(one(tree, node => node.type === 'details-component').props.edges.every(edge => edge.kind === 'foreign-key'));
const checkboxes = all(tree, node => node.type === 'input' && node.props.type === 'checkbox');
checkboxes[1].props.onChange();
tree = draw();
assert(one(tree, node => node.type === 'details-component').props.edges.some(edge => edge.kind === 'application'));
browser.location.hash = '#table=threed_multimedia_albums';
listeners.get('hashchange')();
tree = draw();
const albumEdges = one(tree, node => node.type === 'details-component').props.edges;
assert(albumEdges.some(edge => edge.status === 'pending'));
assert(albumEdges.some(edge => edge.to === 'threed_assembly' && edge.status === 'pending'));
assert(!albumEdges.some(edge => edge.to === 'learn_guides')); 
browser.location.hash = '#table=not-a-table';
listeners.get('hashchange')();
tree = draw();
assert.equal(all(tree, node => node.type === 'details-component').length, 0);
one(tree, node => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: 'no-such-table-xyz' } });
tree = draw();
assert.match(text(tree), /No matching tables/);
one(tree, node => node.type === 'button' && text(node).startsWith('Learn')).props.onClick();
tree = draw();
assert.match(text(tree), /1\s+of\s+86\s+tables/);
one(tree, node => node.type === 'button' && text(node) === 'Reset filters').props.onClick();
assert.match(text(draw()), /86\s+of\s+86\s+tables/);
state.unmount();
assert.equal(listeners.size, 0, 'Hash listener cleans up');

const graphState = harness();
const graph = load('src/components/learn/data-structure/SchemaRelationshipGraph.tsx', {
  react: graphState.react,
  'react/jsx-runtime': runtime,
  '@/components/ui/button': { Button: 'button' },
  './schema-explorer': helpers,
});
const user = schema.tables.find(table => table.id === 'user');
const userEdges = helpers.visibleRelationships(schema.edges, user.id, ['foreign-key']);
const graphDraw = () => graphState.render(() => graph.SchemaRelationshipGraph({ table: user, tables: schema.tables, edges: userEdges }));
tree = graphDraw();
const before = all(tree, node => node.type === 'a').map(node => node.props.href).join(',');
one(tree, node => node.type === 'button' && text(node) === 'Next neighbors').props.onClick();
tree = graphDraw();
assert.notEqual(all(tree, node => node.type === 'a').map(node => node.props.href).join(','), before);
assert.equal(all(tree, node => node.type === 'a').length <= 11, true, 'Graph pages dense connections');

const detail = load('src/components/learn/data-structure/SchemaTableDetails.tsx', {
  'react/jsx-runtime': runtime,
  '@/components/ui/table': Object.fromEntries(['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'].map(name => [name, name])),
  './SchemaRelationshipGraph': { SchemaRelationshipGraph: 'graph' },
  './schema-explorer': helpers,
});
const albumTable = schema.tables.find(table => table.id === 'threed_multimedia_albums');
tree = detail.SchemaTableDetails({ table: albumTable, tables: schema.tables, edges: [], allEdges: schema.edges });
assert.match(text(tree), /FK/, 'Column FK badges remain even if relationship layers are hidden');
assert.equal(all(tree, node => node.type === 'TableRow').length, albumTable.columns.length + 1);
assert.equal(all(tree, node => node.type === 'iframe' || node.props.dangerouslySetInnerHTML).length, 0);

// Freshness must survive checkout metadata/line endings, but reject stale schemas.
const generatorPath = path.resolve('src/libraries/scripts/generate-schema-visualization.cjs');
const generator = fs.readFileSync(generatorPath, 'utf8');
function checkGenerator(stale) {
  const fakeFs = Object.create(fs);
  fakeFs.readFileSync = (file, encoding) => {
    let value = fs.readFileSync(file, encoding);
    if (typeof value === 'string') value = value.replace(/\r?\n/g, '\r\n');
    if (stale && String(file).endsWith('schema/learn/index.ts'.replaceAll('/', path.sep))) value += '\r\n// A new schema edit\r\n';
    return value;
  };
  vm.runInNewContext(generator, {
    __dirname: path.dirname(generatorPath),
    process: { argv: ['node', generatorPath, '--check'] },
    console: { log() {} },
    require(name) {
      if (name === 'node:fs') return fakeFs;
      if (name === 'node:child_process') return { execFileSync() { throw new Error('Freshness must not require current Git provenance'); } };
      return require(name);
    },
  });
}
checkGenerator(false);
assert.throws(() => checkGenerator(true), /stale/);
console.log('PASS Learn data structure: actual filtering/hash/layer/reset handlers, listener cleanup, graph paging, column keys, schema freshness across checkouts and stale-source rejection. Offline; no database or server.');
