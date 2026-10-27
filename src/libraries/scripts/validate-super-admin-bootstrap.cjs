const assert=require('node:assert/strict');
const {bootstrap,parseArguments}=require('./bootstrap-super-admin.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
let rows,audits,failAudit,tail;
function reset(){rows=[{id:'a',role:'admin',is_active:true},{id:'b',role:'user',is_active:true}];audits=[];failAudit=false;tail=Promise.resolve();}
function client(){let before,release,readonly=false;return {async query(sql,params=[]){
 if(sql.startsWith('BEGIN')){readonly=sql.includes('READ ONLY');return {};}
 if(sql.includes('lock_timeout'))return {};
 if(sql.includes('pg_advisory_xact_lock')){const previous=tail;tail=new Promise(resolve=>release=resolve);await previous;before={rows:clone(rows),audits:clone(audits)};return {};}
 if(sql==='COMMIT'||sql==='ROLLBACK'){if(sql==='ROLLBACK'&&before){rows=before.rows;audits=before.audits;}release?.();return {};}
 if(sql.includes("WHERE role = 'super_admin'"))return {rows:rows.filter(row=>row.role==='super_admin')};
 if(sql.startsWith('SELECT id, role'))return {rows:rows.filter(row=>row.id===params[0]).map(row=>({...row}))};
 assert(!readonly,'Read-only mode must never write');
 if(sql.startsWith('UPDATE')){const row=rows.find(row=>row.id===params[1]);row.role=params[0];return {};}
 if(sql.startsWith('INSERT')){if(failAudit)throw Error('audit unavailable');audits.push(params);return {};}
 throw Error('Unexpected SQL: '+sql);
 }};}
(async()=>{
 assert.deepEqual(parseArguments(['--user-id','a']),{userId:'a',apply:false});
 assert.equal(parseArguments(['--user-id','a','--apply']).apply,true);
 for(const args of [[],['--apply'],['--user-id','a','--force'],['--user-id','']])assert.throws(()=>parseArguments(args));
 reset();await bootstrap(client(),'a');assert.equal(rows[0].role,'admin');assert.equal(audits.length,0);
 await assert.rejects(()=>bootstrap(client(),'missing',true),/No User/);
 rows[0].is_active=false;await assert.rejects(()=>bootstrap(client(),'a',true),/active/);rows[0].is_active=true;
 rows[0].role=null;await assert.rejects(()=>bootstrap(client(),'a',true),/unrecognized/);rows[0].role='admin';
 failAudit=true;await assert.rejects(()=>bootstrap(client(),'a',true),/audit unavailable/);assert.equal(rows[0].role,'admin');assert.equal(audits.length,0);failAudit=false;
 const results=await Promise.allSettled([bootstrap(client(),'a',true),bootstrap(client(),'b',true)]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(rows.filter(row=>row.role==='super_admin').length,1);assert.equal(audits.length,1);assert.deepEqual(audits[0],['a','admin','super_admin']);
 rows[0].is_active=false;await assert.rejects(()=>bootstrap(client(),'b',true),/already exists/);
 console.log('PASS bootstrap: explicit apply, read-only default, existing active identity, unknown-role denial, serialized first promotion, repeat denial and atomic rollback (mock SQL).');
})().catch(error=>{console.error(error);process.exitCode=1});
