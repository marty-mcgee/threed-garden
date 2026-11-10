const { tryParseInput } = require('../utils/input-validation.ts');
// Offline: real contracts, service, routes and navigation; in-memory DB/HTTP adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
function load(file, modules, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name === '@/libraries/utils/input-validation' ? require('../utils/input-validation.ts') : name in modules ? modules[name] : require(name), console, Request, Response, URL, TextEncoder, ...globals });
  return exports;
}

const contract=load('src/libraries/config/meta-tags.ts',{});
const authSchema=load('src/libraries/schema/auth/index.ts',{});
const schema=load('src/libraries/schema/settings/index.ts',{'../auth':authSchema});
const {settings,settingsAuditLogs:audits}=schema;
const {User}=authSchema;
const dialect=new pg.PgDialect();
let data={row:null,audits:[]},actor={role:'super_admin',active:true,deleted:false},failAudit=false,session=null,queue=Promise.resolve(),locks=0;
const clone=v=>JSON.parse(JSON.stringify(v));
function select(){let table,condition;const chain={from(t){table=t;return chain;},where(c){condition=c;return chain;},for(kind){assert(['share','update'].includes(kind));locks++;return chain;},then(resolve,reject){return Promise.resolve().then(()=>{const query=dialect.sqlToQuery(condition);if(table===User){assert.equal(query.params[0],'admin-id');return actor?[actor]:[];}assert.equal(table,settings);assert.equal(query.params[0],'app.meta-tags.v1');return data.row?[data.row]:[];}).then(resolve,reject);}};return chain;}
function insert(table){let value;const chain={values(v){value=clone(v);return chain;},onConflictDoNothing(){return chain;},then(resolve,reject){return Promise.resolve().then(()=>{if(table===settings){data.row??={id:1,...value};}else{assert.equal(table,audits);if(failAudit)throw Error('private diagnostic');data.audits.push(value);}}).then(resolve,reject);}};return chain;}
function update(table){assert.equal(table,settings);return {set(value){return {async where(condition){assert.equal(dialect.sqlToQuery(condition).params[0],1);Object.assign(data.row,clone(value));}};}};}
const db={select,transaction(fn){const run=queue.then(async()=>{const before=clone(data);try{return await fn({select,insert,update});}catch(e){data=before;throw e;}});queue=run.catch(()=>{});return run;}};
const service=load('src/libraries/services/settings/meta-tags.ts',{'server-only':{},'@/libraries/db/client':{db},'@/libraries/schema/auth':authSchema,'@/libraries/schema/settings':schema,'@/libraries/config/meta-tags':contract});
const route=load('src/app/api/settings/meta-tags/route.ts',{'@/libraries/auth':{auth:async()=>session},'@/libraries/config/meta-tags':contract,'@/libraries/services/settings/meta-tags':service});
const request=(body,origin='https://example.test')=>new Request('https://example.test/api/settings/meta-tags',{method:'PUT',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 const initial=contract.defaultMetaTags();
 assert.deepEqual(clone(contract.metaTagsMetadata(initial)),{description:contract.defaultDescription});
 const input={...initial,enabled:true,tags:[{name:'description',content:'Garden & "design" <script>'},{name:'og:title',content:'Garden'},{name:'og:image',content:'https://example.test/image.png'},{name:'robots',content:'noindex, follow'},{name:'twitter:card',content:'summary_large_image'}]};
 const metadata=contract.metaTagsMetadata(contract.parseMetaTags(input));
 assert.equal(metadata.description,input.tags[0].content);assert.equal(metadata.openGraph.title,'Garden');assert.equal(metadata.twitter.card,'summary_large_image');assert.equal(metadata.robots,'noindex, follow');assert.equal(metadata.title,undefined);
 for(const bad of [null,{...initial,unknown:1},{...initial,revision:'bad'},{...input,tags:[{name:'http-equiv',content:'refresh'}]},{...input,tags:[{name:'og:image',content:'javascript:alert(1)'}]},{...input,tags:[{name:'robots',content:'bad'}]},{...input,tags:[input.tags[0],input.tags[0]]}])assert(!tryParseInput(contract.parseMetaTags,bad).success);
 assert.equal((await route.GET()).status,401);assert.equal((await route.PUT(request(input))).status,401);
 session={user:{id:'admin-id'}};actor.role='user';assert.equal((await route.GET()).status,403);assert.equal((await route.PUT(request(input))).status,403);assert.equal(data.row,null);
 actor.role='super_admin';actor.deleted=true;assert.equal((await route.PUT(request(input))).status,403);actor.deleted=false;
 assert.equal((await route.PUT(request(input,'https://wrong.test'))).status,403);
 assert.equal((await route.PUT(request({...input,tags:[{name:'viewport',content:'bad'}]}))).status,400);
 assert.equal((await route.PUT(request({...input,extra:'x'.repeat(33000)}))).status,413);
 assert.deepEqual(clone(await service.readMetaTags()),clone(initial));
 const savedResponse=await route.PUT(request(input));assert.equal(savedResponse.status,200);const saved=await savedResponse.json();assert(saved.revision);assert.equal(data.audits.length,1);assert(locks>=2);
 assert.equal((await route.PUT(request(input))).status,409);assert.equal(data.audits.length,1);
 const deletion={...saved,tags:[],enabled:false};failAudit=true;assert.equal((await route.PUT(request(deletion))).status,503);assert.deepEqual(clone(await service.readMetaTags()),saved);failAudit=false;
 assert.equal((await route.PUT(request(deletion))).status,200);assert.deepEqual(clone(contract.metaTagsMetadata(await service.readMetaTags())),{description:contract.defaultDescription});
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');const html=renderToStaticMarkup(React.createElement('meta',{name:'description',content:input.tags[0].content}));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));
 let draft=clone(initial);const jsx=(type,props)=>({type,props});const ui=load('src/components/settings/MetaTagsSettings.tsx',{'react/jsx-runtime':{jsx,jsxs:jsx},react:{},'lucide-react':new Proxy({},{get:(_,k)=>k}),'@/components/ui/button':{Button:'button'},'./SettingsSection':{SettingsSection:'section'},'@/libraries/config/meta-tags':contract});
 const editor={allowed:true,draft,disabled:false,dirty:true,setDraft:v=>{draft=v},snapshot:initial};const nodes=v=>Array.isArray(v)?v.flatMap(nodes):v&&typeof v==='object'?[v,...nodes(v.props?.children)]:[];const text=v=>Array.isArray(v)?v.map(text).join(''):typeof v==='string'?v:text(v?.props?.children??[]);
 let tree=nodes(ui.MetaTagsSettings({editor}));tree.find(n=>n.type==='button'&&text(n)==='Add Meta Tag').props.onClick();assert.equal(draft.tags.length,1);editor.draft=draft;tree=nodes(ui.MetaTagsSettings({editor}));tree.find(n=>n.props?.['aria-label']==='Content for description').props.onChange({target:{value:'New description'}});assert.equal(draft.tags[0].content,'New description');editor.draft=draft;tree=nodes(ui.MetaTagsSettings({editor}));tree.find(n=>n.props?.['aria-label']==='Remove description').props.onClick();assert.equal(draft.tags.length,0);
 console.log('PASS meta-tag contracts, metadata mapping/escaping, actual CRUD controls, owner gates, origin/size bounds, audited save/removal, stale revisions and audit rollback (mock DB).');
})().catch(error=>{console.error(error);process.exitCode=1});
