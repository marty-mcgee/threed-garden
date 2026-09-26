const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.resolve(__dirname, '../../components/admin/threed/models/model-admin-form-core.ts');
const core = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, {exports: core});
const {createEmptyThreeDModelAdminForm: empty, buildThreeDModelAdminPayload: payload, ThreeDModelFormValidationError: ValidationError} = core;
const form = {...empty(), modelName:' Shoe ', modelType:'gltf', mainModelFileId:'41'};
assert.equal(payload(form, 'edit').mainModelFileId, 41);
assert.equal(payload(form, 'edit').modelName, 'Shoe');
assert.equal(payload(form, 'edit').filePath, '');
assert.throws(() => payload(form), ValidationError, 'Create must still require an uploaded path');
assert.throws(() => payload({...form, mainModelFileId:''}, 'edit'), ValidationError);
for (const mainModelFileId of ['0','-1','1.5','NaN']) {
  assert.throws(() => payload({...form, mainModelFileId}, 'edit'), ValidationError);
}
const upload = {...empty(), modelName:'Replacement', modelType:'glb', filePath:'https://example.com/model.glb'};
assert.equal(payload(upload).filePath, upload.filePath);
assert.equal(payload(upload, 'edit').mainModelFileId, null);
for (const patch of [{modelName:' '}, {modelType:''}, {metadata:'['}, {animations:'{}'}, {lodLevels:'[]'}, {scale:'-1'}, {offsetX:'Infinity'}]) {
  assert.throws(() => payload({...form, ...patch}, 'edit'), ValidationError);
}
console.log('PASS: Edit accepts primary-file IDs without cached URLs; Create and missing/invalid assignments remain guarded; upload and JSON/transform validation preserved');
