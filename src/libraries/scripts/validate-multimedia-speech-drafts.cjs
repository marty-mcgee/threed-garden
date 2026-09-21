const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, require) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require, Date });
  return exports;
}
const contract = load('src/libraries/services/multimedia/speech-draft.ts', () => { throw Error('Unexpected import'); });
const valid = { title: ' Welcome ', text: '', voiceId: '' };
assert.equal(contract.parseSpeechDraft(valid).title, 'Welcome');
assert.equal(contract.parseSpeechDraft(valid).voiceId, null);
for (const value of [null, [], {}, {...valid,title:''}, {...valid,text:'x'.repeat(2001)}, {...valid,voiceId:'invalid'}, {...valid,acceptedVersionNumber:1}, {...valid,userId:'other'}]) assert.throws(() => contract.parseSpeechDraft(value));
let session = null, returned = [], found = [], writes = [], conditions = [];
const speech = Object.fromEntries(['id','userId','revision','updatedAt'].map(key => [key,key]));
const db = {
  update: () => ({ set: value => { writes.push(value); return { where: condition => { conditions.push(condition); return { returning: async () => returned }; } }; } }),
  select: () => ({ from: () => ({ where: condition => { conditions.push(condition); return { limit: async () => found }; } }) }),
};
const route = load('src/app/api/multimedia/speech/[id]/route.ts', name => {
  if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
  if (name === '@/libraries/auth') return { auth: async () => session };
  if (name === '@/libraries/db/client') return { db };
  if (name === '@/libraries/schema/multimedia') return { multimediaSpeech: speech };
  if (name === '@/libraries/services/multimedia/speech-draft') return contract;
  if (name === 'drizzle-orm') return { eq: (...args) => ['eq',...args], and: (...args) => ['and',...args], sql: (parts,...values) => ({ parts, values }) };
  throw Error(name);
});
const context = { params: Promise.resolve({ id:'5' }) };
const patch = body => route.PATCH({ json: async () => body }, context);
(async () => {
  assert.equal((await patch(valid)).status,401);
  session = { user:{ id:'owner' } };
  assert.equal((await patch(valid)).status,400);
  assert.equal((await patch({...valid,revision:1,acceptedVersionNumber:2})).status,400);
  assert.equal(writes.length,0);
  returned = [{id:5,revision:2}];
  assert.equal((await patch({...valid,revision:1})).status,200);
  assert.ok(JSON.stringify(conditions[0]).includes('["eq","userId","owner"]'));
  assert.ok(JSON.stringify(conditions[0]).includes('["eq","revision",1]'));
  assert.ok(!('acceptedVersionNumber' in writes[0]));
  assert.equal((await patch({revision:2,archived:true})).status,200);
  assert.ok(writes[1].archivedAt instanceof Date);
  assert.equal((await patch({revision:3,archived:false})).status,200);
  assert.equal(writes[2].archivedAt,null);
  returned = []; found = [{id:5}];
  assert.equal((await patch({...valid,revision:1})).status,409);
  found = [];
  assert.equal((await patch({...valid,revision:1})).status,404);
  assert.equal((await route.GET({}, {params:Promise.resolve({id:'5junk'})})).status,400);
  console.log('PASS: draft validation, auth, owner/revision write scopes, archive/restore, conflicts and missing records (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
