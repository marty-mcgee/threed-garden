const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/libraries/services/threed/model-builder/registration.ts','utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,{ exports: exportsObject });
const { newBuilderRegistration, registerBuilderModel, BuilderUnconfirmedWriteError } = exportsObject;
const file = new File(['glb'],'cottage.glb',{ type: 'model/gltf-binary' });
const image = new File(['rgba'],'roof.png',{ type: 'image/png' });
const input = { file, outputSha256: 'a'.repeat(64), metadata: { activeSource: 'file', modelBuilder: { generator: 'threed-cottage-ts' } }, images: [
  { id: 'roof_orm', digest: 'b'.repeat(64), file: image, bindings: [
    { channel: 'roughness', targetKeys: Array.from({ length: 65 },(_,i) => `mesh:${i}:material:0`) },
    { channel: 'metallic', targetKeys: ['mesh:0:material:0'] }, { channel: 'occlusion', targetKeys: ['mesh:0:material:0'] },
  ] },
  { id: 'same_image_alias', digest: 'b'.repeat(64), file: image, bindings: [{ channel: 'occlusion', targetKeys: ['mesh:1:material:0'] }] },
] };
function fake() {
  const calls = { upload: [], model: [], texture: [], assign: [] };
  return { calls, adapters: {
    upload: async f => { calls.upload.push(f); return { url: 'https://example.public.blob.vercel-storage.com/new.glb', fileName: 'cottage.glb', fileSize: f.size, modelType: 'glb' }; },
    createModel: async body => { calls.model.push(body); return { id: 123, mainModelFileId: 456 }; },
    createTexture: async (f,name) => { calls.texture.push({ f,name }); return 789; },
    assign: async body => { calls.assign.push(body); },
  } };
}
(async () => {
  const state = newBuilderRegistration(input.outputSha256), first = fake();
  let assignments = 0; const assign = first.adapters.assign;
  first.adapters.assign = async body => { if (++assignments === 3) throw new Error('Confirmed assignment rejection'); await assign(body); };
  await assert.rejects(registerBuilderModel(input,' Cottage ',state,first.adapters),/assignment rejection/);
  assert.equal(state.modelId,123); assert.equal(state.primaryModelFileId,456); assert.equal(state.complete,false); assert.equal(state.assigned.length,2);
  const body = first.calls.model[0];
  for (const key of ['isActive','isPublic','isDefault','usedByCharacters','usedByPlants']) assert.equal(body[key],false);
  assert.equal(body.status,'pending'); assert.equal(body.modelName,'Cottage'); assert.equal(body.modelType,'glb');
  assert.equal(body.primaryFile.filePath,body.filePath); assert.equal(body.primaryFile.fileSize,file.size);
  first.adapters.assign = assign; await registerBuilderModel(input,'Cottage',state,first.adapters);
  assert.equal(state.complete,true); assert.equal(first.calls.upload.length,1); assert.equal(first.calls.model.length,1);
  assert.equal(first.calls.texture.length,1,'One byte-identical ORM image reused for every channel and alias');
  assert.equal(first.calls.assign.length,6); assert(first.calls.assign.every(body => body.modelId === 123 && body.textureId === 789 && body.targetKeys.length <= 30));
  await registerBuilderModel(input,'Cottage',state,first.adapters); assert.equal(first.calls.assign.length,6);
  console.log('  Passed: new private/inactive Model with primary File, one ORM Texture reused across channels, bounded assignment batches and exact confirmed resume.');

  const changed = fake(); await assert.rejects(registerBuilderModel({ ...input, outputSha256: 'c'.repeat(64) },'Cottage',state,changed.adapters),/changed Model/);
  assert.equal(changed.calls.upload.length,0);
  const aborted = fake(), signal = AbortSignal.abort(); await assert.rejects(registerBuilderModel(input,'Cottage',newBuilderRegistration(input.outputSha256),aborted.adapters,{ signal })); assert.equal(aborted.calls.upload.length,0);
  const modelUncertain = fake(), modelProgress = newBuilderRegistration(input.outputSha256);
  modelUncertain.adapters.createModel = async () => { throw new BuilderUnconfirmedWriteError('Response lost'); };
  await assert.rejects(registerBuilderModel(input,'Cottage',modelProgress,modelUncertain.adapters)); assert(modelProgress.uncertain);
  const retryModel = fake(); await assert.rejects(registerBuilderModel(input,'Cottage',modelProgress,retryModel.adapters)); assert.equal(retryModel.calls.model.length,0);
  const textureUncertain = fake(), textureProgress = newBuilderRegistration(input.outputSha256);
  textureUncertain.adapters.createTexture = async () => { throw new BuilderUnconfirmedWriteError('Response lost'); };
  await assert.rejects(registerBuilderModel(input,'Cottage',textureProgress,textureUncertain.adapters)); assert(textureProgress.uncertain); assert.equal(textureProgress.modelId,123);
  const retryTexture = fake(); await assert.rejects(registerBuilderModel(input,'Cottage',textureProgress,retryTexture.adapters)); assert.equal(retryTexture.calls.texture.length,0);
  const badIdentity = fake(), badProgress = newBuilderRegistration(input.outputSha256);
  badIdentity.adapters.createModel = async () => ({ id: 1, mainModelFileId: 0 });
  await assert.rejects(registerBuilderModel(input,'Cottage',badProgress,badIdentity.adapters)); assert(badProgress.uncertain);
  for (const malformed200Data of [undefined, null, {}, [], 'saved', 123, true, { id: 123 }]) {
    const malformed = fake(), progress = newBuilderRegistration(input.outputSha256);
    malformed.adapters.createModel = async body => { malformed.calls.model.push(body); return malformed200Data; };
    await assert.rejects(registerBuilderModel(input,'Cottage',progress,malformed.adapters), /no confirmed primary File/);
    assert(progress.uncertain); assert.equal(progress.modelId, undefined); assert.equal(progress.complete, false);
    assert.equal(malformed.calls.model.length, 1);
    await assert.rejects(registerBuilderModel(input,'Cottage',progress,malformed.adapters), /not confirmed/);
    assert.equal(malformed.calls.model.length, 1, 'A malformed successful response must not replay Model creation');
    assert.equal(malformed.calls.texture.length, 0);
  }
  const mismatch = fake(), mismatchProgress = newBuilderRegistration(input.outputSha256);
  mismatch.adapters.upload = async () => ({ url: 'https://example.public.blob.vercel-storage.com/wrong.glb', fileName: 'wrong.glb', fileSize: file.size+1, modelType: 'glb' });
  await assert.rejects(registerBuilderModel(input,'Cottage',mismatchProgress,mismatch.adapters),/does not match/); assert.equal(mismatch.calls.model.length,0);
  const concurrent = fake(), concurrentProgress = newBuilderRegistration(input.outputSha256); let resolveUpload;
  const pendingUpload = new Promise(resolve => { resolveUpload = resolve; }); concurrent.adapters.upload = async () => pendingUpload;
  const pending = registerBuilderModel(input,'Cottage',concurrentProgress,concurrent.adapters);
  await assert.rejects(registerBuilderModel(input,'Cottage',concurrentProgress,concurrent.adapters),/already being saved/);
  resolveUpload({ url: 'https://example.public.blob.vercel-storage.com/new.glb', fileName: file.name, fileSize: file.size, modelType: 'glb' });
  await pending; assert.equal(concurrent.calls.model.length,1);
  await registerBuilderModel(input,'Cottage',concurrentProgress,concurrent.adapters); assert.equal(concurrent.calls.model.length,1);
  console.log('  Passed: changed-generation and abort guards; unconfirmed Model/Texture/primary identity blocks creation replay.');
  console.log('  Passed: mismatched verified-upload rejection and concurrent-save lock without duplicate Model creation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
