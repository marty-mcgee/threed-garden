const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const slots = [], effects = [], dependencies = [], cleanups = [];
let cursor = 0, dirtyState, root, tree, conflict = false, saves = 0, adds = 0, failProject = true;
const jsx = (type, props) => ({ type, props });
const react = {
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  useEffect(fn, deps) { const index = cursor++; if (!dependencies[index] || deps.some((value, i) => value !== dependencies[index][i])) { dependencies[index] = deps; effects.push(() => { cleanups[index]?.(); cleanups[index] = fn(); }); } },
};
const requests = [];
const fetch = async (url, init = {}) => {
  requests.push({ url, init });
  if (url.includes('/options?')) {
    const params = new URL(url, 'https://app.test').searchParams;
    return Response.json(params.get('scope') === 'projects' ? {items:[{projectId:7,moduleId:9,title:'Garden',moduleName:'Audio'}],hasMore:false} : {items:[{id:1,title:'Kate vocals',status:'draft'},{id:2,title:'Plant noises',status:'published'}],hasMore:false});
  }
  if (url === '/api/project/assets') {
    adds++;
    const body = JSON.parse(init.body);
    assert.equal(body.assetType, 'multimedia_albums'); assert.equal(body.moduleType,'multimedia'); assert.equal(body.projectId,7); assert.equal(body.moduleId,9);
    if (body.assetId === 1) return Response.json({error:'Asset already added to this module'},{status:409});
    return failProject ? Response.json({error:'Failed'},{status:500}) : Response.json({success:true});
  }
  if (init.method === 'PUT') {
    saves++;
    const body = JSON.parse(init.body); assert.equal(body.assignments.length,2);
    if(conflict) return Response.json({error:'Assignments changed. Reload before saving.'},{status:409});
    return Response.json({revision:'b'.repeat(64)});
  }
  return Response.json({assignments:saves && !conflict ? [{albumId:1,sortOrder:0},{albumId:2,sortOrder:0}] : [],revision:saves && !conflict ? 'b'.repeat(64) : 'a'.repeat(64)});
};
const mocks = {
  '@/libraries/services/threed/multimedia/album-labels': {albumModuleLabels:{character:'Characters'}},
  react,
  'react/jsx-runtime': {jsx,jsxs:jsx},
  'next-auth/react': {useSession:()=>({status:'authenticated',data:{user:{id:'owner'}}})},
  '@/components/ui/button': {Button:'button'},
  '@/components/ui/input': {Input:'input'},
  '../characters/use-character-page-guard': {useCharacterPageGuard:(enabled,dirty,busy)=>{dirtyState={dirty,busy};}},
};
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/multimedia/EntityAlbumWorkspace.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:exportsObject,require:name=>{assert(name in mocks,name);return mocks[name];},fetch,AbortController,URLSearchParams,Error,window:{confirm:()=>true}});
root=exportsObject.EntityAlbumWorkspace({moduleType:'character',entityId:12});
function render(){cursor=0;tree=root.type(root.props);while(effects.length)effects.shift()();return tree;}
function nodes(value){if(Array.isArray(value))return value.flatMap(nodes);if(!value||typeof value!=='object')return [];return [value,...nodes(value.props?.children)];}
function text(value){if(Array.isArray(value))return value.map(text).join('');if(value&&typeof value==='object')return text(value.props?.children);return value==null?'':String(value);}
function button(label){const b=nodes(tree).find(n=>n.type==='button'&&text(n)===label);assert(b,label);return b;}
async function flush(){for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));render();}
(async()=>{
 render();await flush();
 for(let i=0;i<2;i++){const b=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='checkbox')[i];b.props.onChange();render();}
 assert(dirtyState.dirty);
 conflict=true;button('Save Album assignments').props.onClick();await flush();
 assert(dirtyState.dirty);assert(text(tree).includes('Assignments changed'));
 conflict=false;button('Save Album assignments').props.onClick();await flush();assert(!dirtyState.dirty);
 nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'7:9'}});render();
 const add=button('Add related Albums to Project');add.props.onClick();add.props.onClick();await flush();
 assert.equal(adds,2,'Duplicate click lock prevents duplicate batches');assert(text(tree).includes('1 already assigned; 1 failed'));
 failProject=false;button('Add related Albums to Project').props.onClick();await flush();
 assert(text(tree).includes('1 added; 1 already assigned; 0 failed'));
 assert(requests.filter(r=>r.url==='/api/project/assets').every(r=>JSON.parse(r.init.body).assetType==='multimedia_albums'));
 for(const cleanup of cleanups)cleanup?.();
 assert(requests.filter(r=>r.init.signal).every(r=>r.init.signal.aborted),'Unmount aborts requests');
 console.log('PASS Album authoring: actual component drafts, conflicts, explicit Save, saved-only Project additions, partial retry, duplicate-click guard and request cleanup (mock session/network).');
})().catch(error=>{console.error(error);process.exitCode=1;});
