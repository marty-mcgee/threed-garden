import assert from 'node:assert/strict';
import {
  runBulkModel,
  type BulkImportInput,
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

console.log('─'.repeat(54));
console.log(`PASS  ${groups} validation groups completed`);
