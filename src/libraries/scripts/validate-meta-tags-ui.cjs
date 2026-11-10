// Actual provider and Settings form with a small hook harness. No browser/database.
const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm');
const element = (type, props) => ({ type, props });
function load(file, modules, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8');
  const compiled = file.endsWith('MetaTagsSettings.tsx') ? require('next/dist/compiled/babel/core').transformSync(source, { filename: file, configFile: false, babelrc: false, parserOpts: { plugins: ['typescript', 'jsx'] }, plugins: [['babel-plugin-react-compiler', {}]] }).code : source;
  vm.runInNewContext(ts.transpileModule(compiled, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, Error, require: key => key === '@/libraries/utils/input-validation' ? require('../utils/input-validation.ts') : key === '@/components/settings/SettingsSection' ? {SettingsSection:'settings-section'} : modules[key] ?? require(key), ...globals,
  });
  return exports;
}
const contract = load('src/libraries/config/meta-tags.ts', {}, {URL});
function harness() {
  const slots = []; let index = 0, dirty = false, component, tree;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const effects = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext: () => null,
    useState(initial) {
      const i = index++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i]; },
    useCallback(fn, deps) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) { effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); }
    },
  };
  return { react, render(fn = component) {
    component = fn;
    for (let pass = 0; pass < 20; pass++) {
      dirty = false; index = 0; tree = component();
      const jobs = effects.splice(0); jobs.forEach(job => job());
      if (!dirty) return tree;
    }
    throw new Error('Render loop');
  } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const find = (node, predicate) => {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } }
  else if (node && typeof node === 'object') return predicate(node) ? node : find(node.props?.children, predicate);
};
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' ? node : '';
(async()=>{
 const uiHarness = harness();
 const loadingUi = load('src/components/settings/MetaTagsSettings.tsx', { react: uiHarness.react, 'react/compiler-runtime': { c: size => Array(size).fill(Symbol.for('react.memo_cache_sentinel')) }, 'react/jsx-runtime': { jsx: element, jsxs: element }, 'lucide-react': {}, '@/components/ui/button': { Button: 'Button' }, './SettingsSection': { SettingsSection: 'section' }, '@/libraries/config/meta-tags': contract });
 const loadingEditor = { allowed: true, snapshot: null, draft: null, disabled: true, busy: true, setDraft() { throw Error('Loading state cannot clear'); } };
 const loadingTree = loadingUi.MetaTagsSettings({ editor: loadingEditor });
 const clear = find(loadingTree, node => node.type === 'Button' && text(node) === 'Clear Meta Tags');
 assert(clear.props.disabled);
 clear.props.onClick();
 let cleared;
 const savedEditor = { ...loadingEditor, busy: false, disabled: false, snapshot: { ...contract.defaultMetaTags(), revision: '12345678-1234-1234-1234-123456789abc' }, setDraft: value => { cleared = value; } };
 find(loadingUi.MetaTagsSettings({ editor: savedEditor }), node => node.type === 'Button' && text(node) === 'Clear Meta Tags').props.onClick();
 assert.equal(cleared.revision, savedEditor.snapshot.revision);
 assert.equal(cleared.enabled, false);
 const h=harness();let status=200,stored=contract.defaultMetaTags(),fail=false;
 const ui=load('src/components/settings/MetaTagsSettings.tsx',{react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'lucide-react':{},'@/components/ui/button':{Button:'Button'},'./SettingsSection':{SettingsSection:'section'},'@/libraries/config/meta-tags':contract},{fetch:async(url,options)=>{assert.equal(url,'/api/settings/meta-tags');if(options?.method==='PUT'){if(fail)return {ok:false,json:async()=>({error:'Conflict. Draft retained.'})};stored={...JSON.parse(options.body),revision:'12345678-1234-1234-1234-123456789abc'}}return {status,ok:status===200,json:async()=>stored}}});
 let editor=h.render(()=>ui.useMetaTagsEditor());await flush();editor=h.render();assert(editor.allowed);assert(!editor.dirty);
 editor.setDraft({...editor.draft,enabled:true,tags:[{name:'author',content:'Developer'}]});editor=h.render();assert(editor.dirty);fail=true;await assert.rejects(editor.save());editor=h.render();assert(editor.dirty);assert.equal(editor.draft.tags[0].content,'Developer');
 fail=false;await editor.save();editor=h.render();assert(!editor.dirty);assert(editor.snapshot.revision);editor.setDraft({...editor.draft,tags:[]});editor=h.render();editor.discard();editor=h.render();assert.equal(editor.draft.tags.length,1);
 status=403;await editor.reload();editor=h.render();assert(!editor.allowed);assert(editor.disabled);
 const rootSource=fs.readFileSync('src/app/layout.tsx','utf8');let unavailable=false;
 const root=load('src/app/layout.tsx',{'next/headers':{},'./providers':{},'./globals.css':{},'./fonts':{},'@/components/layout/AppPageTitle':{},'react/jsx-runtime':{jsx:element,jsxs:element},'@/libraries/services/settings/meta-tags':{readMetaTags:async()=>{if(unavailable)throw Error('offline');return stored}},'@/libraries/config/meta-tags':contract},{console:{warn(){}}});
 assert.equal((await root.generateMetadata()).authors[0].name,'Developer');unavailable=true;assert.equal((await root.generateMetadata()).description,contract.defaultDescription);assert(!rootSource.includes('dangerouslySetInnerHTML'));
 const nextConfig = load('next.config.ts', {}).default;
 for (const agent of ['Mozilla/5.0', 'Twitterbot', 'Googlebot', '']) assert(nextConfig.htmlLimitedBots.test(agent), 'Every client receives blocking head metadata');
 console.log('PASS actual meta-tag editor load/save/failure/discard/permission handling and server generateMetadata defaults/failure fallback (mock HTTP/DB).');
})().catch(error=>{console.error(error);process.exitCode=1});
