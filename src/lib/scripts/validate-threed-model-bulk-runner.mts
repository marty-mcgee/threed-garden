import assert from 'node:assert/strict';
import {
  runBulkModel,
  type BulkImportInput,
  type BulkGltfBundleInspector,
// @ts-expect-error Node's native TypeScript validator requires the explicit extension.
} from '../../components/admin/threed/models/model-bulk-import-runner.ts';

const UPLOAD = '/api/threed/models/upload';
const MODELS = '/api/threed/models';
const FILES = '/api/threed/models/files';
const TEXTURES = '/api/threed/model-textures';
const ASSIGN = `${FILES}/requirements`;
const SAVED = `${MODELS}?id=7`;
const AUDIT = `${FILES}/requirements?modelId=7`;
const PRIMARY_URL = 'https://fixture.blob.vercel-storage.com/models/owner/upload/123.fbx';
const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = (name: string) => new File([imageBytes], name, { type: 'image/png' });
const fbx = new File(['fixture FBX'], 'barn.fbx');
const input = (changes: Partial<BulkImportInput> = {}): BulkImportInput => ({
  file: fbx,
  modelName: 'Barn',
  settings: {
    scale: '1', categoryIds: [2], isLibraryItem: true, isPublic: false,
    usedByPlants: false, usedByCharacters: false, isActive: false,
  },
  rotationY: '10', offsetX: '1', offsetY: '2', offsetZ: '3',
  configureLater: false, attachments: [], ...changes,
});
const activeInput = (changes: Partial<BulkImportInput> = {}) => input({
  settings: { ...input().settings, isActive: true }, ...changes,
});
const primary = {
  id: 11, modelId: 7, fileType: 'model', fileName: fbx.name,
  relativePath: fbx.name, filePath: PRIMARY_URL, fileSize: fbx.size,
};
const uploaded = {
  url: PRIMARY_URL, fileName: fbx.name, fileSize: fbx.size, modelType: 'fbx',
  analysis: { status: 'analyzed', meshCount: 1 },
};
const created = { id: 7, mainModelFileId: 11, isActive: false, status: 'pending' };
const saved = (files: unknown[] = []) => ({
  ...created, filePath: PRIMARY_URL, modelType: 'fbx', files: [primary, ...files],
});
const ready = { status: 'analyzed', complete: true, requirements: [] };
const ok = (data: unknown) => Response.json({ success: true, data });
const reject = (status: number) => Response.json({ success: false, error: 'Private server details must not be shown' }, { status });
const lost = () => { throw new Error('Private network details must not be shown'); };
type Call = { url: string; init: RequestInit };
type Step = { url: string; method?: string; reply: () => Response | Promise<Response>; check?: (init: RequestInit) => void };

function mock(steps: Step[]) {
  const calls: Call[] = [];
  let active = false;
  let violation = false;
  const request: typeof fetch = async (url, init = {}) => {
    if (active) violation = true;
    assert.equal(active, false, 'requests must stay sequential');
    active = true;
    try {
      const step = steps[calls.length];
      calls.push({ url: String(url), init });
      assert.ok(step, 'no extra request or retry');
      assert.equal(String(url), step.url);
      assert.equal(init.method ?? 'GET', step.method ?? 'GET');
      assert.equal(init.cache, 'no-store');
      assert.ok(init.signal);
      step.check?.(init);
      await Promise.resolve();
      return await step.reply();
    } catch (error) {
      if (error instanceof assert.AssertionError) violation = true;
      throw error;
    } finally { active = false; }
  };
  return { calls, request, done() {
    assert.equal(violation, false, 'mock request contract failed');
    assert.equal(calls.length, steps.length, 'every expected request must run');
  } };
}
const uploadStep = (reply = () => ok(uploaded)): Step => ({ url: UPLOAD, method: 'POST', reply });
const createStep = (reply = () => ok(created)): Step => ({ url: MODELS, method: 'POST', reply });
const savedStep = (record: unknown = saved()): Step => ({ url: SAVED, reply: () => ok(record) });
const auditStep = (record: unknown = ready): Step => ({ url: AUDIT, reply: () => ok(record) });
const cleanupStep = (reply = () => Response.json({ success: true })): Step => ({
  url: UPLOAD, method: 'DELETE', reply,
  check(init) { assert.deepEqual(JSON.parse(String(init.body)), { url: PRIMARY_URL }); },
});
const targetKeys = ['mesh:0:material:0', 'mesh:1:material:0'];
const textureInput = (textureId = 21, changes: Partial<BulkImportInput> = {}) => input({
  ...changes,
  settings: { ...input().settings, ...changes.settings, existingTextureId: textureId },
});
const catalogStep = (textureId = 21): Step => ({ url: TEXTURES, reply: () => ok([{ id: textureId, isActive: true }]) });
const targetsUploadStep = (keys = targetKeys): Step => uploadStep(() => ok({
  ...uploaded,
  analysis: { ...uploaded.analysis, materialTargets: { targetKeys: keys, materialSlotCount: keys.length, omittedSlotCount: 0 } },
}));
const assignmentsSaved = (keys = targetKeys, textureId = 21) => ({
  ...saved(),
  materialAssignments: keys.map((targetKey) => ({ targetKey, channel: 'baseColor', textureId })),
});
const assignStep = (keys = targetKeys, textureId = 21, reply = () => ok({ id: 7, metadata: {} })): Step => ({
  url: ASSIGN, method: 'PATCH', reply,
  check(init) {
    const body = String(init.body);
    assert.ok(new TextEncoder().encode(body).byteLength <= 2_048);
    assert.ok(keys.length > 0 && keys.length <= 40);
    assert.deepEqual(JSON.parse(body), { modelId: 7, targetKeys: keys, channel: 'baseColor', textureId });
  },
});
const localInventory = { targetKeys, materialSlotCount: targetKeys.length, omittedSlotCount: 0 };
function formatFixture(modelType: 'glb' | 'gltf', upperCase = false) {
  // The injected inspector below proves orchestration; actual loader fixtures have their own validator.
  const file = new File([`local ${modelType} fixture bytes`], `barn.${upperCase ? modelType.toUpperCase() : modelType}`);
  const url = PRIMARY_URL.replace(/fbx$/, modelType);
  const primaryFile = { ...primary, fileName: file.name, relativePath: file.name, filePath: url, fileSize: file.size };
  const model = (files: unknown[] = []) => ({ ...saved(), modelType, filePath: url, files: [primaryFile, ...files] });
  const upload = uploadStep(() => ok({ ...uploaded, fileName: file.name, fileSize: file.size, modelType, url }));
  const create = createStep();
  create.check = (init) => {
    const payload = JSON.parse(String(init.body));
    assert.equal(payload.modelType, modelType);
    assert.equal(payload.filePath, url);
    assert.deepEqual(payload.primaryFile, { fileName: file.name, filePath: url, fileSize: file.size, modelType });
  };
  return { file, url, modelType, model, upload, create };
}

let groups = 0;
async function group(label: string, run: () => Promise<void>) {
  await run();
  groups += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD Model bulk runner validation (mock requests only)');
console.log('─'.repeat(54));

await group('primary upload metadata is registered transactionally in an inactive Model', async () => {
  const steps = [uploadStep(), createStep(), savedStep(), auditStep()];
  steps[1].check = (init) => {
    const payload = JSON.parse(String(init.body));
    assert.deepEqual(payload.primaryFile, {
      fileName: fbx.name, filePath: PRIMARY_URL, fileSize: fbx.size, modelType: 'fbx',
    });
    assert.equal(payload.filePath, PRIMARY_URL);
    assert.equal(payload.isActive, false);
    assert.equal(payload.status, 'pending');
    assert.equal(payload.rotationY, '10');
    assert.equal(payload.offsetX, '1');
    assert.deepEqual(payload.categoryIds, [2]);
    assert.deepEqual(payload.metadata, {});
  };
  const client = mock(steps);
  const outcome = await runBulkModel(input(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.equal(outcome.modelId, 7);
  assert.equal(outcome.canRetry, false);
  assert.equal(outcome.stagedUrl, undefined);
  assert.deepEqual(outcome.analysis, uploaded.analysis);
});

await group('attachments and owned preview persist serially before readback, audit, and opt-in activation', async () => {
  const texture = png('wall.png');
  const preview = png('barn-preview.png');
  const textureRow = {
    id: 12, fileName: texture.name, fileType: 'texture', fileSize: texture.size,
    relativePath: 'textures/wall.png', filePath: 'https://fixture.blob.vercel-storage.com/wall.png',
  };
  const previewRow = {
    id: 13, fileName: preview.name, fileType: 'other', fileSize: preview.size,
    relativePath: 'previews/barn-preview.png', filePath: 'https://fixture.blob.vercel-storage.com/barn-preview.png',
  };
  const client = mock([
    uploadStep(), createStep(),
    ...[textureRow, previewRow].map((row): Step => ({
      url: FILES, method: 'POST', reply: () => ok([row]),
      check(init) {
        const body = init.body as FormData;
        assert.equal(body.get('modelId'), '7');
        assert.equal(body.get('relativePaths'), row.relativePath);
        assert.equal(body.get('category'), row.fileType);
        assert.equal(body.getAll('files').length, 1);
      },
    })),
    savedStep(saved([textureRow, previewRow])),
    { url: SAVED, method: 'PATCH', reply: () => ok({ ...created, thumbnailUrl: previewRow.filePath }),
      check(init) { assert.deepEqual(JSON.parse(String(init.body)), { thumbnailUrl: previewRow.filePath }); } },
    auditStep({ ...ready, requirements: [{ satisfied: true }] }),
    { url: SAVED, method: 'PATCH', reply: () => ok({ id: 7, isActive: true, status: 'active' }),
      check(init) { assert.deepEqual(JSON.parse(String(init.body)), { isActive: true, status: 'active' }); } },
  ]);
  const progress: string[] = [];
  const outcome = await runBulkModel(activeInput({
    attachments: [{ file: texture, relativePath: 'textures/wall.png' }], previewFile: preview,
  }), (label) => progress.push(label), client.request);
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.match(outcome.message, /activated/);
  assert.equal(progress.at(-1), 'Activating reviewed Model');
});

await group('deferred, incomplete, malformed, and unavailable audits never activate', async () => {
  for (const audit of [ready, { ...ready, complete: false }, { ...ready, requirements: [{}] }, null]) {
    const client = mock([uploadStep(), createStep(), savedStep(), auditStep(audit)]);
    const outcome = await runBulkModel(activeInput({ configureLater: audit === ready }), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'imported');
    assert.match(outcome.message, /inactive\/pending/);
  }
  const client = mock([uploadStep(), createStep(), savedStep(), { url: AUDIT, reply: lost }]);
  const outcome = await runBulkModel(activeInput(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.match(outcome.message, /inactive\/pending/);
});

await group('definitive create rejection cleans its primary before allowing an explicit retry', async () => {
  const client = mock([uploadStep(), createStep(() => reject(400)), cleanupStep()]);
  const outcome = await runBulkModel(input(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.canRetry, true);
  assert.equal(outcome.modelId, undefined);
  assert.equal(outcome.stagedUrl, undefined);
  assert.doesNotMatch(outcome.message, /Private/);
});

await group('unconfirmed staged cleanup prevents a fresh retry', async () => {
  for (const reply of [lost, () => reject(500)]) {
    const client = mock([uploadStep(), createStep(() => reject(400)), cleanupStep(reply)]);
    const outcome = await runBulkModel(input(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'unknown');
    assert.equal(outcome.canRetry, false);
    assert.equal(outcome.stagedUrl, PRIMARY_URL);
  }
});

await group('lost, server-error, malformed, and oversized create responses never retry or delete', async () => {
  const replies = [lost, () => reject(500), () => new Response('<html>error</html>'),
    () => ok({ id: '7' }), () => new Response('x'.repeat(1024 * 1024 + 1))];
  for (const reply of replies) {
    const client = mock([uploadStep(), createStep(reply)]);
    const outcome = await runBulkModel(input(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'unknown');
    assert.equal(outcome.canRetry, false);
    assert.equal(outcome.stagedUrl, PRIMARY_URL);
    assert.equal(client.calls.filter((call) => call.url === MODELS).length, 1);
    assert.doesNotMatch(outcome.message, /Private/);
  }
});

await group('upload rejections are retryable while lost upload outcomes remain unconfirmed', async () => {
  for (const reply of [() => reject(422), () => new Response('Too large', { status: 413 })]) {
    const client = mock([uploadStep(reply)]);
    const outcome = await runBulkModel(input(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.canRetry, true);
  }
  for (const reply of [lost, () => reject(500), () => ok({})]) {
    const client = mock([uploadStep(reply)]);
    const outcome = await runBulkModel(input(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'unknown');
    assert.equal(outcome.canRetry, false);
  }
});

await group('inconsistent upload metadata is discarded without creating a Model', async () => {
  const client = mock([uploadStep(() => ok({ ...uploaded, fileSize: fbx.size + 1 })), cleanupStep()]);
  const outcome = await runBulkModel(input(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.canRetry, true);
});

await group('invalid fields, destinations, previews, and files above 4 MiB make zero requests', async () => {
  const oversized = new Uint8Array(4 * 1024 * 1024 + 1);
  const texture = png('wall.png');
  const invalid = [
    input({ modelName: ' ' }), input({ offsetZ: 'Infinity' }), input({ rotationY: '' }),
    input({ settings: { ...input().settings, scale: '0.001' } }),
    input({ file: new File([oversized], 'large.fbx') }),
    input({ file: new File([], 'empty.fbx') }),
    input({ file: new File(['obj'], 'model.obj') }),
    input({ attachments: [{ file: texture, relativePath: 'wall.png' }] }),
    input({ attachments: [{ file: texture, relativePath: '../wall.png' }] }),
    input({ attachments: [{ file: new File([oversized], 'large.png'), relativePath: 'textures/large.png' }] }),
    input({ previewFile: new File(['bad image'], 'preview.png', { type: 'image/png' }) }),
    input({ previewFile: new File([oversized], 'preview.png', { type: 'image/png' }) }),
    input({ previewFile: texture, attachments: [{ file: texture, relativePath: 'textures/wall.png' }] }),
    input({ attachments: [{ file: texture, relativePath: 'textures/wall.png' }, { file: texture, relativePath: 'TEXTURES/WALL.png' }] }),
  ];
  for (const row of invalid) {
    const client = mock([]);
    const outcome = await runBulkModel(row, () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, undefined);
  }
});

await group('attachment failures preserve known Model IDs without create retries or deletion', async () => {
  for (const reply of [lost, () => reject(500)]) {
    const client = mock([uploadStep(), createStep(), { url: FILES, method: 'POST', reply }]);
    const outcome = await runBulkModel(activeInput({
      attachments: [{ file: png('wall.png'), relativePath: 'textures/wall.png' }],
    }), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, 7);
    assert.equal(outcome.canRetry, false);
    assert.equal(outcome.stagedUrl, undefined);
  }
});

await group('primary and attachment readback must match before reporting completion or activating', async () => {
  const invalidSaved = [
    { ...saved(), mainModelFileId: null }, { ...saved(), files: [] },
    { ...saved(), files: [{ ...primary, filePath: 'https://wrong.invalid/model.fbx' }] },
    { ...saved(), isActive: true }, { ...saved(), files: [{ ...primary, fileSize: 0 }] },
  ];
  for (const record of invalidSaved) {
    const client = mock([uploadStep(), createStep(), savedStep(record)]);
    const outcome = await runBulkModel(activeInput(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, 7);
    assert.equal(outcome.canRetry, false);
  }
  const client = mock([uploadStep(), createStep(),
    { url: FILES, method: 'POST', reply: () => ok([]) }, savedStep()]);
  const outcome = await runBulkModel(activeInput({
    attachments: [{ file: png('wall.png'), relativePath: 'textures/wall.png' }],
  }), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'failed');
});

await group('lost activation responses preserve the Model and do not claim its active state', async () => {
  const client = mock([uploadStep(), createStep(), savedStep(), auditStep(),
    { url: SAVED, method: 'PATCH', reply: lost }]);
  const outcome = await runBulkModel(activeInput(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'unknown');
  assert.equal(outcome.modelId, 7);
  assert.equal(outcome.canRetry, false);
  assert.doesNotMatch(outcome.message, /inactive/);
});

await group('an explicit empty existing Texture selection preserves the original request sequence', async () => {
  const client = mock([uploadStep(), createStep(), savedStep(), auditStep()]);
  const outcome = await runBulkModel(input({ settings: { ...input().settings, existingTextureId: null } }), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.doesNotMatch(outcome.message, /Existing Texture assigned/);
});

await group('selected existing Texture IDs assign every verified material slot without uploading texture files', async () => {
  for (const textureId of [21, 34]) {
    const create = createStep();
    create.check = (init) => assert.equal(Object.hasOwn(JSON.parse(String(init.body)), 'existingTextureId'), false);
    const client = mock([catalogStep(textureId), targetsUploadStep(), create, savedStep(),
      assignStep(targetKeys, textureId), savedStep(assignmentsSaved(targetKeys, textureId)), auditStep()]);
    const outcome = await runBulkModel(textureInput(textureId), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'imported');
    assert.equal(outcome.modelId, 7);
    assert.equal(outcome.canRetry, false);
    assert.match(outcome.message, /Existing Texture assigned to 2 material slots/);
    assert.equal(client.calls.filter((call) => call.init.method === 'POST').length, 2);
    assert.equal(client.calls.filter((call) => call.url === TEXTURES && call.init.method === 'POST').length, 0);
    assert.equal(client.calls.filter((call) => call.url === FILES).length, 0);
  }
});

await group('500 derived target keys use serial byte-bounded chunks and full readback before activation', async () => {
  const keys = Array.from({ length: 500 }, (_, index) => `mesh:${100_000 + index}:material:9999`);
  const chunks = Array.from({ length: Math.ceil(keys.length / 40) }, (_, index) => keys.slice(index * 40, (index + 1) * 40));
  const client = mock([catalogStep(), targetsUploadStep(keys), createStep(), savedStep(),
    ...chunks.map((chunk) => assignStep(chunk)), savedStep(assignmentsSaved(keys)), auditStep(),
    { url: SAVED, method: 'PATCH', reply: () => ok({ id: 7, isActive: true, status: 'active' }) }]);
  const outcome = await runBulkModel(textureInput(21, { settings: activeInput().settings }), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.match(outcome.message, /activated/);
  assert.match(outcome.message, /500 material slots/);
  const requestedKeys = client.calls.filter((call) => call.url === ASSIGN)
    .flatMap((call) => JSON.parse(String(call.init.body)).targetKeys);
  assert.deepEqual(requestedKeys, keys);
  assert.equal(chunks.length, 13);
});

await group('missing, empty, truncated, duplicated, and invalid inventories clean up before Model creation', async () => {
  const inventory = { targetKeys, materialSlotCount: 2, omittedSlotCount: 0 };
  const invalid = [
    undefined, null, {}, { ...inventory, targetKeys: [], materialSlotCount: 0 },
    { ...inventory, omittedSlotCount: 1 }, { ...inventory, materialSlotCount: 3 },
    { ...inventory, materialSlotCount: '2' }, { ...inventory, omittedSlotCount: '0' },
    { ...inventory, targetKeys: [targetKeys[0], targetKeys[0]] },
    { ...inventory, targetKeys: [targetKeys[0], 'mesh:01:material:0'] },
    { ...inventory, targetKeys: Array.from({ length: 501 }, (_, index) => `mesh:${index}:material:0`), materialSlotCount: 501 },
  ];
  for (const materialTargets of invalid) {
    const client = mock([catalogStep(), uploadStep(() => ok({
      ...uploaded, analysis: { ...uploaded.analysis, materialTargets },
    })), cleanupStep()]);
    const outcome = await runBulkModel(textureInput(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, undefined);
    assert.equal(outcome.canRetry, true);
    assert.equal(outcome.stagedUrl, undefined);
    assert.match(outcome.message, /Remove the existing Texture selection/);
  }
});

await group('inactive, removed, or unavailable existing Textures are rejected before any upload', async () => {
  const replies = [() => ok([{ id: 21, isActive: false }]), () => ok([{ id: 34, isActive: true }]),
    () => ok([]), () => reject(401), () => new Response('Unavailable'), lost];
  for (const reply of replies) {
    const client = mock([{ url: TEXTURES, reply }]);
    const outcome = await runBulkModel(textureInput(), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, undefined);
    assert.equal(outcome.canRetry, true);
    assert.equal(client.calls.every((call) => !call.init.method), true);
    assert.doesNotMatch(outcome.message, /Private/);
  }
});

await group('partial, lost, and rejected assignment requests keep the existing inactive Model for review', async () => {
  const keys = Array.from({ length: 41 }, (_, index) => `mesh:${index}:material:0`);
  for (const reply of [lost, () => reject(404), () => reject(500), () => ok({ id: 8 })]) {
    const client = mock([catalogStep(), targetsUploadStep(keys), createStep(), savedStep(),
      assignStep(keys.slice(0, 40)), assignStep(keys.slice(40), 21, reply)]);
    const outcome = await runBulkModel(textureInput(21, { settings: activeInput().settings }), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, 7);
    assert.equal(outcome.canRetry, false);
    assert.equal(outcome.stagedUrl, undefined);
    assert.match(outcome.message, /inactive/);
    assert.doesNotMatch(outcome.message, /Private/);
  }
});

await group('assignment readback verifies target identity, base-color channel, selected Texture, and inactive state', async () => {
  const correct = assignmentsSaved();
  const first = correct.materialAssignments[0];
  const invalid = [
    { ...correct, materialAssignments: undefined },
    { ...correct, materialAssignments: [first] },
    { ...correct, materialAssignments: [first, first] },
    { ...correct, materialAssignments: correct.materialAssignments.map((row) => ({ ...row, textureId: 34 })) },
    { ...correct, materialAssignments: correct.materialAssignments.map((row) => ({ ...row, channel: 'normal' })) },
    { ...correct, materialAssignments: correct.materialAssignments.map((row) => ({ ...row, targetKey: 'mesh:9:material:0' })) },
    { ...correct, isActive: true, status: 'active' },
  ];
  for (const record of invalid) {
    const client = mock([catalogStep(), targetsUploadStep(), createStep(), savedStep(), assignStep(), savedStep(record)]);
    const outcome = await runBulkModel(textureInput(21, { settings: activeInput().settings }), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, 7);
    assert.equal(outcome.canRetry, false);
  }
  const client = mock([catalogStep(), targetsUploadStep(), createStep(), savedStep(), assignStep(), { url: SAVED, reply: lost }]);
  const outcome = await runBulkModel(textureInput(), () => {}, client.request);
  client.done();
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.modelId, 7);
});

await group('explicit deferred assignment still runs while unresolved named dependencies independently prevent activation', async () => {
  for (const configureLater of [true, false]) {
    const audit = configureLater ? ready : { ...ready, complete: false, requirements: [{ satisfied: false }] };
    const client = mock([catalogStep(), targetsUploadStep(), createStep(), savedStep(), assignStep(),
      savedStep(assignmentsSaved()), auditStep(audit)]);
    const outcome = await runBulkModel(textureInput(21, {
      settings: activeInput().settings, configureLater,
    }), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'imported');
    assert.match(outcome.message, /inactive\/pending/);
    assert.match(outcome.message, /Existing Texture assigned/);
  }
});

await group('invalid existing Texture identities are blocked locally without requests', async () => {
  for (const textureId of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
    const client = mock([]);
    const outcome = await runBulkModel(textureInput(textureId), () => {}, client.request);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.modelId, undefined);
  }
});

await group('GLB and GLTF always inspect the same primary File before requests without Texture selection', async () => {
  for (const modelType of ['glb', 'gltf'] as const) {
    const fixture = formatFixture(modelType, true);
    const row = input({ file: fixture.file });
    const client = mock([fixture.upload, fixture.create, savedStep(fixture.model()), auditStep()]);
    let inspections = 0;
    const inspector: BulkGltfBundleInspector = async (file, attachments, deferred) => {
      inspections += 1;
      assert.equal(client.calls.length, 0);
      assert.equal(file, fixture.file);
      assert.deepEqual(attachments, []);
      assert.equal(deferred, false);
      row.file = fbx; // A later caller mutation must not change the File that was inspected.
      return localInventory;
    };
    fixture.upload.check = (init) => assert.equal((init.body as FormData).get('file'), fixture.file);
    const outcome = await runBulkModel(row, () => {}, client.request, inspector);
    client.done();
    assert.equal(inspections, 1);
    assert.equal(outcome.status, 'imported');
    assert.equal(client.calls.some((call) => call.url === FILES), false);
  }
});

await group('GLTF binary and image attachments retain classifications and saved buffer identity', async () => {
  const fixture = formatFixture('gltf');
  const binary = new File([new Uint8Array(12)], 'mesh.bin');
  const texture = png('albedo.png');
  const rows = [
    { id: 12, fileName: binary.name, fileSize: binary.size, relativePath: 'buffers/mesh.bin', fileType: 'binary',
      isBinaryBuffer: true, filePath: 'https://fixture.blob.vercel-storage.com/mesh.bin' },
    { id: 13, fileName: texture.name, fileSize: texture.size, relativePath: 'textures/albedo.png', fileType: 'texture',
      isBinaryBuffer: false, filePath: 'https://fixture.blob.vercel-storage.com/albedo.png' },
  ];
  const client = mock([fixture.upload, fixture.create,
    ...rows.map((row): Step => ({ url: FILES, method: 'POST', reply: () => ok([row]), check(init) {
      const body = init.body as FormData;
      assert.equal(body.get('category'), row.fileType);
      assert.equal(body.get('relativePaths'), row.relativePath);
      assert.equal((body.get('files') as File).name, row.fileName);
    } })), savedStep(fixture.model(rows)),
    auditStep({ ...ready, requirements: [{ kind: 'buffer', satisfied: true }, { kind: 'texture', satisfied: true }] }),
  ]);
  const inspector: BulkGltfBundleInspector = async (file, attachments) => {
    assert.equal(file, fixture.file);
    assert.equal(client.calls.length, 0);
    assert.deepEqual(attachments.map(({ relativePath, fileType }) => ({ relativePath, fileType })), [
      { relativePath: 'buffers/mesh.bin', fileType: 'binary' },
      { relativePath: 'textures/albedo.png', fileType: 'texture' },
    ]);
    return localInventory;
  };
  const outcome = await runBulkModel(input({ file: fixture.file, attachments: [
    { file: binary, relativePath: 'buffers\\mesh.bin', fileType: 'binary' },
    { file: texture, relativePath: 'textures/albedo.png' },
  ] }), () => {}, client.request, inspector);
  client.done();
  assert.equal(outcome.status, 'imported');
});

await group('malformed or missing local GLTF geometry rejects every import mode before mutation', async () => {
  for (const modelType of ['glb', 'gltf'] as const) {
    for (const configureLater of [false, true]) {
      for (const existingTextureId of [null, 21]) {
        const fixture = formatFixture(modelType);
        const client = mock([]);
        const outcome = await runBulkModel(input({ file: fixture.file, configureLater,
          settings: { ...input().settings, existingTextureId },
        }), () => {}, client.request, async () => { throw new Error('Required binary buffer buffers/mesh.bin is missing.'); });
        client.done();
        assert.equal(outcome.status, 'failed');
        assert.equal(outcome.canRetry, true);
        assert.equal(outcome.modelId, undefined);
        assert.match(outcome.message, /Missing geometry cannot be deferred/);
        assert.match(outcome.message, /buffers\/mesh\.bin is missing/);
      }
    }
  }
});

await group('GLB and GLTF assignments use actual local target discovery instead of server JSON guesses', async () => {
  for (const modelType of ['glb', 'gltf'] as const) {
    const fixture = formatFixture(modelType);
    fixture.upload.reply = () => ok({ ...uploaded, modelType, fileName: fixture.file.name,
      fileSize: fixture.file.size, url: fixture.url,
      analysis: { ...uploaded.analysis, materialTargets: {
        targetKeys: ['mesh:99:material:9'], materialSlotCount: 1, omittedSlotCount: 0,
      } },
    });
    const client = mock([catalogStep(), fixture.upload, fixture.create, savedStep(fixture.model()),
      assignStep(), savedStep({ ...fixture.model(), materialAssignments: assignmentsSaved().materialAssignments }), auditStep()]);
    let inspections = 0;
    const outcome = await runBulkModel(textureInput(21, { file: fixture.file }), () => {}, client.request, async () => {
      inspections += 1;
      assert.equal(client.calls.length, 0);
      return localInventory;
    });
    client.done();
    assert.equal(inspections, 1);
    assert.equal(outcome.status, 'imported');
    assert.match(outcome.message, /Existing Texture assigned to 2 material slots/);
  }
});

await group('incomplete local GLTF material targets block selected Texture imports without staged uploads', async () => {
  for (const inventory of [
    { targetKeys: [], materialSlotCount: 0, omittedSlotCount: 0 },
    { ...localInventory, omittedSlotCount: 1 },
    { ...localInventory, materialSlotCount: 3 },
    { ...localInventory, targetKeys: [targetKeys[0], targetKeys[0]] },
  ]) {
    const fixture = formatFixture('gltf');
    const client = mock([]);
    const outcome = await runBulkModel(textureInput(21, { file: fixture.file }), () => {}, client.request, async () => inventory);
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.canRetry, true);
    assert.equal(outcome.stagedUrl, undefined);
    assert.equal(outcome.modelId, undefined);
  }
});

await group('missing saved binary flags and missing or unavailable geometry audits never report import success', async () => {
  const fixture = formatFixture('gltf');
  const binary = new File([new Uint8Array(12)], 'mesh.bin');
  const binaryRow = { id: 12, fileName: binary.name, fileSize: binary.size, relativePath: 'buffers/mesh.bin',
    fileType: 'binary', isBinaryBuffer: false, filePath: 'https://fixture.blob.vercel-storage.com/mesh.bin' };
  const client = mock([fixture.upload, fixture.create, { url: FILES, method: 'POST', reply: () => ok([binaryRow]) },
    savedStep(fixture.model([binaryRow]))]);
  const outcome = await runBulkModel(input({ file: fixture.file, configureLater: true,
    attachments: [{ file: binary, relativePath: 'buffers/mesh.bin', fileType: 'binary' }],
  }), () => {}, client.request, async () => localInventory);
  client.done();
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.modelId, 7);
  assert.equal(outcome.canRetry, false);
  for (const audit of [null, { ...ready, complete: false, requirements: [{ kind: 'buffer', satisfied: false }] },
    { ...ready, requirements: [{ satisfied: true }] }]) {
    const inspected = mock([fixture.upload, fixture.create, savedStep(fixture.model()), auditStep(audit)]);
    const result = await runBulkModel(input({ file: fixture.file, configureLater: true }), () => {}, inspected.request,
      async () => localInventory);
    inspected.done();
    assert.equal(result.status, 'failed');
    assert.equal(result.modelId, 7);
    assert.equal(result.canRetry, false);
    assert.match(result.message, /Missing geometry cannot be deferred/);
  }
});

await group('GLTF image deferral remains inactive after valid geometry and does not waive filename requirements', async () => {
  const fixture = formatFixture('gltf');
  const client = mock([fixture.upload, fixture.create, savedStep(fixture.model()),
    auditStep({ ...ready, complete: false, requirements: [{ kind: 'texture', satisfied: false }] })]);
  const outcome = await runBulkModel(activeInput({ file: fixture.file, configureLater: true }), () => {}, client.request,
    async (_file, _attachments, deferred) => { assert.equal(deferred, true); return localInventory; });
  client.done();
  assert.equal(outcome.status, 'imported');
  assert.match(outcome.message, /inactive\/pending/);
});

await group('unsupported primaries and mistyped binary attachments fail before local loader or mutation', async () => {
  for (const row of [
    input({ file: new File(['obj'], 'model.obj') }), input({ file: new File(['usdz'], 'model.usdz') }),
    input({ file: formatFixture('gltf').file, attachments: [{ file: png('buffer.png'), relativePath: 'buffers/buffer.png', fileType: 'binary' }] }),
    input({ file: formatFixture('gltf').file, attachments: [{ file: new File(['bin'], 'mesh.bin'), relativePath: 'buffers/mesh.bin', fileType: 'texture' }] }),
  ]) {
    const client = mock([]);
    let inspected = false;
    const outcome = await runBulkModel(row, () => {}, client.request, async () => { inspected = true; return localInventory; });
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(inspected, false);
  }
});

await group('GLTF upload type mismatches clean staged files while lost creation retains its outcome boundary', async () => {
  const fixture = formatFixture('gltf');
  const client = mock([uploadStep(() => ok({ ...uploaded, fileName: fixture.file.name,
    fileSize: fixture.file.size, url: fixture.url, modelType: 'fbx' })),
  { url: UPLOAD, method: 'DELETE', reply: () => Response.json({ success: true }),
    check(init) { assert.deepEqual(JSON.parse(String(init.body)), { url: fixture.url }); } }]);
  const outcome = await runBulkModel(input({ file: fixture.file }), () => {}, client.request, async () => localInventory);
  client.done();
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.canRetry, true);
  assert.equal(outcome.stagedUrl, undefined);
  for (const modelType of ['glb', 'gltf'] as const) {
    const row = formatFixture(modelType);
    const failed = mock([row.upload, createStep(lost)]);
    const result = await runBulkModel(input({ file: row.file }), () => {}, failed.request, async () => localInventory);
    failed.done();
    assert.equal(result.status, 'unknown');
    assert.equal(result.canRetry, false);
    assert.equal(result.modelId, undefined);
    assert.equal(result.stagedUrl, row.url);
  }
});

await group('local GLTF diagnostics identify the failed resource with bounded text and a safe fallback', async () => {
  const fixture = formatFixture('gltf');
  for (const error of [new Error(`Image textures/albedo.png could not be decoded. ${'x'.repeat(1_000)}`), 'unexpected failure']) {
    const client = mock([]);
    const outcome = await runBulkModel(input({ file: fixture.file }), () => {}, client.request, async () => { throw error; });
    client.done();
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.canRetry, true);
    assert.ok(outcome.message.length < 550);
    if (error instanceof Error) assert.match(outcome.message, /textures\/albedo\.png could not be decoded/);
    else assert.match(outcome.message, /bundle could not be validated/);
  }
});

console.log('─'.repeat(54));
console.log(`PASS  ${groups} validation groups completed`);
