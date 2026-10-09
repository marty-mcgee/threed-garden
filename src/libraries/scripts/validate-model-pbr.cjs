// Actual shared PBR adapters and authenticated handler, entirely offline.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const core = require('../services/threed/models/model-material-override-core.ts');
const { bindThreeDModelMaterialTexture, applyThreeDModelMaterialAssignments } = require('../services/threed/models/model-material-texture.ts');
const slot = 'mesh:0:material:0';
const imageUrl = 'https://fixture.invalid/orm.png';
const plain = value => JSON.parse(JSON.stringify(value));

async function bindings() {
  let metadata = { preserve: 'notes' };
  for (const channel of core.THREED_MODEL_MATERIAL_CHANNELS) metadata = core.writeThreeDModelMaterialOverride(metadata, {
    targetKey: slot, channel, textureRelativePath: imageUrl,
  });
  assert.equal(core.readThreeDModelMaterialOverrides(metadata).assignments.length, 6);
  assert.equal(metadata.preserve, 'notes');
  const broad = { materialOverrides: { version: 1, assignments: Array.from({ length: 500 }, (_, index) => ({ targetKey: `mesh:${index}:material:0`, channel: 'baseColor', textureRelativePath: imageUrl })) } };
  const extended = core.writeThreeDModelMaterialOverride(broad, { targetKey: slot, channel: 'normalMap', textureRelativePath: imageUrl });
  assert.equal(core.readThreeDModelMaterialOverrides(extended).assignments.length, 501, 'Multiple channels may cover the full 500-slot inventory');
  assert.equal(core.readThreeDModelMaterialOverrides({ materialOverrides: { version: 1, assignments: [{ targetKey: slot, channel: 'alphaMap', textureRelativePath: imageUrl }] } }).assignments.length, 0);
  const merged = core.mergeThreeDModelMaterialAssignments(metadata, [{ targetKey: slot, channel: 'normalMap', textureUrl: 'https://fixture.invalid/normal.png' }]);
  assert.equal(merged.length, 6, 'A library Normal link never suppresses metadata Base Color/ORM');
  assert.equal(merged.find(x => x.channel === 'normalMap').textureRelativePath, 'https://fixture.invalid/normal.png');

  const authored = new THREE.Texture({ width: 2, height: 2 });
  authored.flipY = false; authored.channel = 1; authored.wrapS = THREE.RepeatWrapping; authored.wrapT = THREE.MirroredRepeatWrapping;
  authored.magFilter = THREE.NearestFilter; authored.minFilter = THREE.LinearFilter; authored.anisotropy = 4;
  authored.offset.set(0.2, 0.3); authored.repeat.set(2, 3); authored.center.set(0.4, 0.5); authored.rotation = 0.7;
  authored.updateMatrix(); authored.matrixAutoUpdate = false;
  const material = new THREE.MeshStandardMaterial({ map: authored, normalMap: authored, aoMap: authored, roughnessMap: authored, metalnessMap: authored,
    color: '#226688', opacity: 0.18, transparent: true, depthWrite: false, side: THREE.DoubleSide, metalness: 0.42, roughness: 0.61, aoMapIntensity: 0.65, normalScale: new THREE.Vector2(0.7, 0.8) });
  const factors = { color: material.color.getHex(), metalness: material.metalness, roughness: material.roughness, ao: material.aoMapIntensity,
    normal: material.normalScale.toArray(), opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite, side: material.side };
  const source = new THREE.Texture({ width: 2, height: 2 });
  const bound = bindThreeDModelMaterialTexture(material.clone(), source, 'baseColor', 'glb');
  assert.equal(bound.source, source.source, 'Binding views reuse decoded image pixels');
  assert.equal(bound.colorSpace, THREE.SRGBColorSpace); assert.equal(source.colorSpace, THREE.NoColorSpace);
  for (const key of ['flipY', 'channel', 'wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'rotation', 'matrixAutoUpdate']) assert.equal(bound[key], authored[key], key);
  for (const key of ['offset', 'repeat', 'center', 'matrix']) assert.deepEqual(bound[key].toArray(), authored[key].toArray(), key);
  const noMap = new THREE.MeshStandardMaterial();
  const gltfView = bindThreeDModelMaterialTexture(noMap, source, 'normalMap', 'glb');
  assert.equal(gltfView.flipY, false, 'New GLB maps follow glTF orientation');
  const fbxView = bindThreeDModelMaterialTexture(new THREE.MeshStandardMaterial(), source, 'normalMap', 'fbx');
  assert.equal(fbxView.flipY, source.flipY, 'FBX orientation remains independent');
  assert.throws(() => bindThreeDModelMaterialTexture(new THREE.MeshBasicMaterial(), source, 'roughness', 'glb'), /does not support/);

  const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  const other = root.clone(); let loads = 0;
  const release = await applyThreeDModelMaterialAssignments(root, 'glb', ['occlusion', 'roughness', 'metallic'].map(channel => ({ targetKey: slot, channel, textureRelativePath: imageUrl })), async () => { loads++; return source; });
  const applied = root.children[0].material;
  assert.equal(loads, 1, 'Packed ORM decodes/uploads as one image, not three');
  assert.notEqual(applied, material); assert.equal(other.children[0].material, material, 'Unrelated instances stay untouched');
  assert.notEqual(applied.aoMap, applied.roughnessMap); assert.equal(applied.aoMap.source, applied.roughnessMap.source);
  for (const map of [applied.aoMap, applied.roughnessMap, applied.metalnessMap]) { assert.equal(map.colorSpace, THREE.NoColorSpace); assert.equal(map.channel, 1); }
  assert.deepEqual({ color: applied.color.getHex(), metalness: applied.metalness, roughness: applied.roughness, ao: applied.aoMapIntensity,
    normal: applied.normalScale.toArray(), opacity: applied.opacity, transparent: applied.transparent, depthWrite: applied.depthWrite, side: applied.side }, factors);
  assert.equal(material.roughnessMap, authored, 'Cached source material remains unchanged');
  release(); assert.equal(root.children[0].material, material, 'Cleanup restores only the instance materials');
  release();
  const bad = await applyThreeDModelMaterialAssignments(root, 'glb', [{ targetKey: 'mesh:0:material:3', channel: 'baseColor', textureRelativePath: imageUrl }], async () => { throw Error('Invalid slot must not load'); }); bad();
  for (const texture of [bound, gltfView, fbxView, authored]) texture.dispose(); material.dispose(); root.children[0].geometry.dispose(); noMap.dispose();
}

async function api() {
  const table = name => new Proxy({ name }, { get: (object, key) => key === 'name' ? name : `${name}.${String(key)}` });
  const schema = new Proxy({}, { get: (_, name) => table(name) });
  let userId = 'owner', queue = [], queries = [], writes = [];
  const orm = Object.fromEntries(['and', 'asc', 'eq'].map(name => [name, (...args) => ({ name, args })]));
  const db = {
    select() { const query = {}; const chain = { from(t) { query.table = t.name; return chain; }, where(value) { query.where = value; return chain; }, limit() { return chain; },
      then(resolve, reject) { queries.push(query); assert(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); } }; return chain; },
    async transaction(fn) { return fn(db); },
    insert(t) { return { values(value) { writes.push({ operation: 'insert', table: t.name, value: plain(value) }); return { async onConflictDoUpdate() {} }; } }; },
    delete(t) { return { async where(value) { writes.push({ operation: 'delete', table: t.name, where: plain(value) }); } }; },
    update(t) { return { set(value) { writes.push({ operation: 'update', table: t.name, value: plain(value) }); return { where() { return { async returning() { return [{ id: 7, metadata: value.metadata }]; } }; } }; } }; },
  };
  const mocks = {
    '@/libraries/services/threed/models/model-primary-file': { modelSelection: () => ({}) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    'drizzle-orm': orm, '@/libraries/auth': { auth: async () => userId ? { user: { id: userId } } : null },
    '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
    '@/libraries/services/threed/models/model-companion-core': {}, '@/libraries/services/threed/models/model-attachment-runtime-core': {},
    '@/libraries/services/threed/models/model-file-integrity': {}, '@/libraries/services/threed/models/model-material-override-core': core,
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/threed/models/files/requirements/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, URL, Date, console, require(name) { assert(name in mocks, name); return mocks[name]; } });
  const request = body => ({ headers: new Headers({ 'content-type': 'application/json' }), json: async () => body });
  for (const channel of core.THREED_MODEL_MATERIAL_CHANNELS) {
    queue = [[{ id: 7, metadata: { keep: true } }], [{ id: 9, filePath: imageUrl }]]; queries = []; writes = [];
    const response = await exports.PATCH(request({ modelId: 7, targetKeys: [slot], channel, textureId: 9 }));
    assert.equal(response.status, 200); assert.equal(queue.length, 0);
    assert.equal(writes[0].value.channel, channel); assert.equal(writes[0].value.textureId, 9);
    assert.equal(writes[1].value.metadata.keep, true); assert.equal(writes[1].value.metadata.materialOverrides.assignments[0].channel, channel);
    assert(JSON.stringify(queries[0].where).includes('owner')); assert(JSON.stringify(queries[1].where).includes('owner'));
    assert(JSON.stringify(queries[1].where).includes('isActive'), 'Disabled library images cannot be newly assigned');
  }
  writes = []; queue = [[{ id: 7, metadata: {} }], [{ id: 3, relativePath: 'normal.png' }]];
  const attached = await exports.PATCH(request({ modelId: 7, targetKeys: [slot], channel: 'normalMap', textureFileId: 3 }));
  assert.equal(attached.status, 200); assert.equal(writes[0].operation, 'delete');
  assert(JSON.stringify(writes[0].where).includes('normalMap'), 'Attachment replacement removes only its same-channel library link');
  writes = []; queue = [];
  for (const body of [{ modelId: 7, targetKeys: [slot], channel: 'unknown', textureId: 9 }, { modelId: 7, targetKeys: [slot], channel: 'normalMap', textureId: 9, textureFileId: 3 }]) assert.equal((await exports.PATCH(request(body))).status, 400);
  assert.equal(writes.length, 0);
  queue = [[{ id: 7, metadata: {} }], []];
  assert.equal((await exports.PATCH(request({ modelId: 7, targetKey: slot, channel: 'occlusion', textureId: 9 }))).status, 404);
  assert.equal(writes.length, 0, 'A missing/cross-owner Texture performs no writes');
  userId = null;
  assert.equal((await exports.PATCH(request({}))).status, 401);
}
(async () => { await bindings(); await api(); console.log('PASS Model PBR: six channels, slot/channel precedence, packed ORM sharing, authored factors/glass, UV/sampler/color space, instance cleanup and owner-scoped actual PATCH'); })().catch(error => { console.error(error); process.exitCode = 1; });
