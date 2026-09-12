const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps, extras = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, console, TextDecoder, TextEncoder, File, FormData, Uint8Array, ArrayBuffer, ...extras, require(name) { assert.ok(name in deps, `Unexpected import ${name}`); return deps[name]; } });
  return exports;
}
const root = 'src/lib/services/threed/';
const contracts = load(root + 'animations/contracts.ts', { '@/lib/utils/animation': load('src/lib/utils/animation.ts', {}) });
const glb = load(root + 'models/gltf-runtime-inspection-core.ts', { './environment-collision-core.ts': {} });
const real = require('three');
const inspector = load(root + 'animations/inspect-source.ts', { three: real,
  'three/examples/jsm/loaders/FBXLoader.js': require('three/examples/jsm/loaders/FBXLoader.js'),
  'three/examples/jsm/loaders/GLTFLoader.js': require('three/examples/jsm/loaders/GLTFLoader.js'),
  '@/lib/services/threed/models/gltf-runtime-inspection-core': glb, './contracts': contracts,
});
function makeGlb(external = false, empty = false) {
  const bytes = Buffer.alloc(32); [0, 1, 0, 0, 0, 1, 2, 3].forEach((v, i) => bytes.writeFloatLE(v, i * 4));
  const json = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'MovingPart' }],
    buffers: [{ byteLength: 32, ...(external ? { uri: 'https://must-not-fetch.example/animation.bin' } : {}) }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 8 }, { buffer: 0, byteOffset: 8, byteLength: 24 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] }, { bufferView: 1, componentType: 5126, count: 2, type: 'VEC3' }],
    animations: empty ? [] : [0, 1].map(() => ({ name: 'Duplicate', samplers: [{ input: 0, output: 1 }], channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }] })),
  };
  let text = JSON.stringify(json); while (Buffer.byteLength(text) % 4) text += ' ';
  const buffer = Buffer.alloc(12 + 8 + Buffer.byteLength(text) + 8 + bytes.length);
  buffer.writeUInt32LE(0x46546c67, 0); buffer.writeUInt32LE(2, 4); buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(Buffer.byteLength(text), 12); buffer.writeUInt32LE(0x4e4f534a, 16); buffer.write(text, 20);
  const offset = 20 + Buffer.byteLength(text); buffer.writeUInt32LE(bytes.length, offset); buffer.writeUInt32LE(0x004e4942, offset + 4); bytes.copy(buffer, offset + 8);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length);
}
const paths = load(root + 'models/model-blob-paths.ts', {});
let puts = [], deletes = [], inserts = [], fail = false, committed = false;
const db = { select() { return { from() { return { limit: async () => [], where: async () => committed ? [{ id: 1 }] : [] }; } }; },
  transaction: async fn => { if (fail) throw new Error('Database failure'); return fn({ insert: table => ({ values: values => ({ returning: async () => {
    inserts.push({ table, values }); return Array.isArray(values) ? values.map((v, id) => ({ ...v, id: id + 10 })) : [{ ...values, id: 1 }];
  } }) }) }); },
};
const upload = load(root + 'animations/upload.ts', {
  'node:crypto': require('node:crypto'), '@vercel/blob': { put: async path => { puts.push(path); return { url: 'https://mock.blob.vercel-storage.com/' + path }; }, del: async url => deletes.push(url) },
  'drizzle-orm': { and: (...args) => args, eq: (...args) => args }, '@/lib/db/client': { db },
  '@/lib/schema/threed': { threedAnimationFiles: { id: 'files.id', userId: 'files.owner', filePath: 'files.path' }, threedAnimations: 'clips' },
  '@/lib/services/threed/models/model-blob-paths': paths, './contracts': contracts, './inspect-source': inspector,
});
(async () => {
  const fbx = fs.readFileSync('public/assets/animations/Idle.fbx');
  const clips = await inspector.inspectAnimationSource(fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength), 'fbx');
  assert.ok(clips.length > 0); assert.ok(clips[0].metadata.trackCount > 0);
  const binary = makeGlb(); const glbClips = await inspector.inspectAnimationSource(binary, 'glb');
  assert.deepEqual(Array.from(glbClips, clip => clip.clipIndex), [0, 1]); assert.equal(glbClips[0].duration, 1);
  await assert.rejects(inspector.inspectAnimationSource(makeGlb(true), 'glb'), /self-contained/);
  await assert.rejects(inspector.inspectAnimationSource(makeGlb(false, true), 'glb'), /between 1 and 256/);
  await assert.rejects(inspector.inspectAnimationSource(new ArrayBuffer(4), 'fbx'), /Could not inspect/);
  assert.throws(() => inspector.animationFormat('file.obj', 5)); assert.throws(() => inspector.animationFormat('file.fbx', 5 * 1024 * 1024));
  const form = new FormData(); form.set('file', new File([binary], 'Two Clips.glb'));
  const result = await upload.uploadAnimationSource('owner', form);
  assert.equal(puts.length, 1); assert.ok(puts[0].startsWith('threed/users/owner/animations/Two-Clips--'));
  assert.equal(result.clipCount, 2); assert.equal(inserts[0].values.userId, 'owner');
  assert.ok(inserts[1].values.every(row => row.animationFileId === 1 && row.userId === 'owner'));
  assert.deepEqual(Array.from(result.data, row => row.name), ['Two Clips — Clip 1', 'Two Clips — Clip 2']);
  assert.deepEqual(Array.from(result.data, row => row.clipName), Array.from(glbClips, clip => clip.clipName));
  const bad = new FormData(); bad.set('file', new File([new ArrayBuffer(4)], 'bad.fbx'));
  await assert.rejects(upload.uploadAnimationSource('owner', bad)); assert.equal(puts.length, 1, 'Invalid files never upload');
  form.set('userId', 'attacker'); await assert.rejects(upload.uploadAnimationSource('owner', form)); form.delete('userId');
  const idleForm = new FormData(); idleForm.set('file', new File([fbx], 'Friendly Idle.FBX'));
  const idle = await upload.uploadAnimationSource('owner', idleForm);
  assert.equal(idle.clipCount, 1);
  assert.equal(idle.data[0].name, 'Friendly Idle');
  assert.equal(idle.data[0].clipName, clips[0].clipName);
  fail = true; await assert.rejects(upload.uploadAnimationSource('owner', form)); assert.equal(deletes.length, 1);
  committed = true; await assert.rejects(upload.uploadAnimationSource('owner', form)); assert.equal(deletes.length, 1, 'Ambiguous committed source must retain bytes');
  console.log('PASS: real tracked FBX and synthetic multi-clip GLB inspection, external/empty/invalid rejection, one shared upload, owner-scoped clip registration and commit-aware failure cleanup (mocked storage/database)');
})().catch(error => { console.error(error); process.exitCode = 1; });
