const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const source = fs.readFileSync('src/components/admin/threed/tasks/ThreeDTasksCRUD.tsx', 'utf8');
const start = source.indexOf('  const deleteSelected = async');
const end = source.indexOf('\n  const handleCreate', start);
const code = ts.transpileModule(source.slice(start, end) + '\ndeleteSelected();', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
(async () => {
 for (const approved of [false, true]) {
  const calls = [], messages = []; let refresh = 0;
  await vm.runInNewContext(code, {
   tasks: [{id:1}, {id:2}], selected: new Set([1,2,99]), confirm: () => approved,
   setBulkBusy: () => {}, setSelected: () => {}, onModuleUpdate: () => {},
   fetchTasks: async () => { refresh++; }, showToast: message => messages.push(message),
   fetch: async url => { calls.push(url); return {ok: !url.endsWith('2'), json: async () => ({success: !url.endsWith('2')})}; }
  });
  assert.equal(calls.length, approved ? 2 : 0);
  assert(!calls.some(url => url.endsWith('99')), 'Off-page IDs must never be deleted');
  assert.equal(refresh, approved ? 1 : 0);
  if (approved) assert.equal(messages[0], '1 deleted; 1 failed');
 }
 console.log('PASS Task bulk confirmation, page-scoped deletion and partial failure reporting');
})().catch(error => {console.error(error); process.exitCode=1;});
