// Offline geometry/placement checks. Optional --fixture reads only the supplied local legacy assets.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const plain = value => JSON.parse(JSON.stringify(value));
const close = (a, b, label) => assert(Math.abs(a - b) < 1e-6, `${label}: ${a} != ${b}`);
async function main() {
  const three = await import('three'), obj = await import('three/examples/jsm/loaders/OBJLoader.js');
  const modules = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (modules.has(file)) return modules.get(file);
    const exports = {}; modules.set(file, exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
      exports, Error, TextEncoder, structuredClone, crypto: require('node:crypto').webcrypto,
      require: id => id === 'three' ? three : id === 'three/examples/jsm/loaders/OBJLoader.js' ? obj : id.startsWith('.') ? load(path.resolve(path.dirname(file), id.replace(/\.ts$/, '') + '.ts')) : require(id),
    }, { filename: file });
    return exports;
  }
  const core = load('src/libraries/services/threed/design/legacy-recovery-geometry.ts');
  const design = load('src/libraries/services/threed/design/document.ts');
  const source = 'mtllib box.mtl\no Box\ng first\nv 10 30 -15\nv 210 30 -15\nv 210 230 -15\nv 10 230 -15\nv 10 30 5\nv 210 30 5\nv 210 230 5\nv 10 230 5\nvt 0 0\nvt 1 0\nvt 1 1\nvt 0 1\nvn 1 1 1\nusemtl Material\nf 1/1/1 2/2/1 3/3/1 4/4/1\nf 5/1/1 8/4/1 7/3/1 6/2/1\nf 1 5 6 2\nf 4 3 7 8\nf 1 4 8 5\nf 2 6 7 3';
  const placement = (id, overrides = {}) => ({ id, name: 'window2x3', level: '0', position: { x: 250, y: 50, z: 0 }, rotation: { _x: 0, _y: 0, _z: 0, _order: 'XYZ' }, scale: { x: 1, y: 1, z: 1 }, flipX: 1, flipZ: 1, angle: 0, ...overrides });
  const plan = (...items) => ({ levels: { 0: { id: 0, height: 0 } }, threed: Object.fromEntries(items.map(item => [item.id, item])) });
  const catalog = { window2x3: { useMask: true }, frontDoor: { useMask: true }, skyLight: { useMask: true } };
  const doc = design.validateDesign({ ...design.newDesign(), levels: [{ id: 'legacy-level-0', name: 'Ground', elevation: 0 }], nodes: [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 5, z: 0 }], walls: [{ id: 'wall', levelId: 'legacy-level-0', start: 'a', end: 'b', height: 3, thickness: .15, elevation: 0 }] });

  const skew = placement(1, { scale: { x: -2, y: 3, z: .5 }, flipX: -1, position: { x: 1000, y: 400, z: 500 }, rotation: { _x: .2, _y: .3, _z: .4, _order: 'XYZ' } });
  const input = plan(skew, placement(2, { ...skew, id: 2 })), before = JSON.stringify(input);
  let reads = 0;
  const prepared = await core.prepareLegacyRecoveryGeometry(input, catalog, async name => { assert.equal(name, 'window2x3'); reads++; return source; });
  assert.equal(JSON.stringify(input), before, 'Source records are unchanged');
  assert.equal(reads, 1); assert.equal(prepared.variants.length, 1); assert.equal(prepared.placements.length, 2);
  const variant = prepared.variants[0];
  assert.match(variant.key, /^window2x3-[0-9a-f]{16}$/);
  assert.deepEqual(plain(variant.scale), [-2, 3, .5]); assert.deepEqual(plain(variant.maskSize), [4, 6, .1]);
  assert.deepEqual(plain(prepared.placements[0].position), { x: 10, y: 4, z: 5 });
  assert(variant.objText.includes('mtllib box.mtl\no Box\ng first')); assert(variant.objText.includes('vt 0 0\nvt 1 0\nvt 1 1\nvt 0 1'));
  assert(variant.objText.includes('f 1/1/1 4/4/1 3/3/1 2/2/1'), 'Mirrored face winding reverses around the original fan anchor');
  const normal = variant.objText.split('\n').find(line => line.startsWith('vn ')).split(/\s+/).slice(1).map(Number), expectedNormal = new three.Vector3(-.5, 1 / 3, 2).normalize();
  normal.forEach((value, index) => close(value, expectedNormal.toArray()[index], 'Inverse transpose normal'));
  const positions = variant.objText.split('\n').filter(line => line.startsWith('v ')).map(line => line.split(/\s+/).slice(1, 4).map(Number));
  const original = source.split('\n').filter(line => line.startsWith('v ')).map(line => line.split(/\s+/).slice(1, 4).map(Number));
  const quaternion = new three.Quaternion().setFromEuler(new three.Euler(.2, .3, .4, 'XYZ'));
  positions.forEach((vertex, index) => {
    const expected = new three.Vector3(...original[index]).sub(new three.Vector3(110, 30, -5)).multiply(new three.Vector3(-2, 3, .5)).applyQuaternion(quaternion).multiplyScalar(.01).add(new three.Vector3(10, 4, 5));
    const actual = new three.Vector3(...vertex).applyQuaternion(quaternion).add(new three.Vector3(10, 4, 5));
    close(actual.distanceTo(expected), 0, 'Recorded world pose preserved');
  });
  assert(prepared.warnings.some(warning => warning.includes('recorded XYZ rotation differs')));
  const raisedLevel = plan(placement(1, { level: '1', position: { x: 0, y: 290, z: 0 } })); raisedLevel.levels[1] = { id: 1, height: 265 };
  assert.equal((await core.prepareLegacyRecoveryGeometry(raisedLevel, catalog, async () => source)).placements[0].position.y, 2.9, 'Saved position already includes level elevation');
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { name: '../escape' })), catalog, async () => source), /Invalid legacy catalog name/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { scale: { x: 0, y: 1, z: 1 } })), catalog, async () => source), /tiny scale/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { scale: { x: 1, y: -1, z: 1 } })), catalog, async () => source), /grounding/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { flipX: -1 })), catalog, async () => source), /disagrees/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1)), {}, async () => source), /Missing legacy catalog/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1)), catalog, async () => { throw Error('Missing local OBJ'); }), /Missing local OBJ/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1)), catalog, async () => 'v 0 0 0\nf 1 2 3'), /outside its declared geometry/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { rotation: { _x: 0, _y: 0, _z: 0, _order: 'ZYX' } })), catalog, async () => source), /XYZ/);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(placement(1, { position: { x: NaN, y: 0, z: 0 } })), catalog, async () => source), /Invalid position/);
  const variantLimitItems = Array.from({ length: 501 }, (_, index) => placement(index + 1, { scale: { x: index + 1, y: 1, z: 1 } }));
  const atVariantLimit = await core.prepareLegacyRecoveryGeometry(plan(...variantLimitItems.slice(0, 500)), catalog, async () => source);
  assert.equal(atVariantLimit.variants.length, 500);
  await assert.rejects(core.prepareLegacyRecoveryGeometry(plan(...variantLimitItems), catalog, async () => source), /at most 500 geometry variants/);
  const sharedGeometryItems = Array.from({ length: 501 }, (_, index) => placement(index + 1));
  assert.equal((await core.prepareLegacyRecoveryGeometry(plan(...sharedGeometryItems), catalog, async () => source)).variants.length, 1, 'Repeated placements do not consume additional variant budget');

  async function recover(items, target = doc) {
    const data = plan(...items), geometry = await core.prepareLegacyRecoveryGeometry(data, catalog, async () => source);
    return core.reconstructLegacyOpenings(target, data, catalog, geometry);
  }
  const unchanged = JSON.stringify(doc), recovered = await recover([placement(1)]);
  assert.equal(JSON.stringify(doc), unchanged, 'Reconstruction leaves input document unchanged');
  assert.deepEqual(plain(recovered.convertedLegacyIds), ['1']);
  assert.deepEqual(plain(recovered.document.openings[0]), { id: 'legacy-opening-1', wallId: 'wall', kind: 'window', offset: 1.5, width: 2, height: 2, sill: .5 });
  assert(recovered.warnings.some(warning => warning.includes('replaces the converted catalog')));
  const nativeDoor = await recover([placement(1, { name: 'frontDoor', position: { x: 250, y: .00001, z: 0 } })]);
  assert.equal(nativeDoor.document.openings[0].kind, 'door'); assert.equal(nativeDoor.document.openings[0].sill, 0);
  const sillDoor = await recover([placement(1, { name: 'frontDoor', position: { x: 250, y: 25.1, z: 0 } })]);
  assert.equal(sillDoor.document.openings.length, 0); assert(sillDoor.warnings.some(warning => warning.includes('Door sill')));
  const angled = await recover([placement(1, { rotation: { _x: 0, _y: .01, _z: 0, _order: 'XYZ' } })]);
  assert.equal(angled.document.openings.length, 0); assert(angled.warnings.some(warning => warning.includes('0 exact rectangular')));
  const thin = await recover([placement(1, { scale: { x: 1, y: 1, z: .1 } })]);
  assert.equal(thin.document.openings.length, 0);
  const corner = await recover([placement(1, { position: { x: 105, y: 50, z: 0 } })]);
  assert.equal(corner.document.openings.length, 0); assert(corner.warnings.some(warning => warning.includes('does not fit')));
  const overlap = await recover([placement(1), placement(2)]);
  assert.equal(overlap.document.openings.length, 1); assert.deepEqual(plain(overlap.convertedLegacyIds), ['1']); assert(overlap.warnings.some(warning => warning.includes('must not overlap')));
  const twoHosts = { ...doc, nodes: [...doc.nodes, { id: 'c', x: 0, z: .01 }, { id: 'd', x: 5, z: .01 }], walls: [...doc.walls, { ...doc.walls[0], id: 'wall-2', start: 'c', end: 'd' }] };
  const ambiguous = await recover([placement(1)], twoHosts);
  assert.equal(ambiguous.document.openings.length, 0); assert(ambiguous.warnings.some(warning => warning.includes('intersects 2 walls')));
  const skylight = await recover([placement(1, { name: 'skyLight' })]);
  assert.equal(skylight.document.roofOpenings.length, 0); assert(skylight.warnings.some(warning => warning.includes('floor/roof CSG')));
  const floorMask = await recover([placement(1)], {
    ...doc,
    nodes: [...doc.nodes, { id: 'p1', x: 1, z: -1 }, { id: 'p2', x: 4, z: -1 }, { id: 'p3', x: 4, z: 1 }, { id: 'p4', x: 1, z: 1 }],
    floors: [{ id: 'floor', levelId: 'legacy-level-0', vertices: ['p1', 'p2', 'p3', 'p4'], elevation: 1, thickness: .25 }],
  });
  assert.equal(floorMask.document.openings.length, 0); assert(floorMask.warnings.some(warning => warning.includes('floor/roof bounds')));
  const noLevel = await recover([placement(1)], { ...doc, levels: [{ ...doc.levels[0], elevation: 1 }] });
  assert(noLevel.warnings.some(warning => warning.includes('matching imported level')));
  console.log('PASS legacy recovery geometry: transforms, reflected winding/normals, variant reuse, validation, exact opening hosts and unsupported-mask reporting.');

  if (process.argv.includes('--fixture')) {
    const file = path.join(root, 'public/home-design/api/threed-plan-demo-1.json'), content = JSON.parse(fs.readFileSync(file, 'utf8'));
    const suppliedCatalog = JSON.parse(fs.readFileSync(path.join(root, 'public/home-design/api/objects.json'), 'utf8'));
    const prepared = await core.prepareLegacyRecoveryGeometry(content, suppliedCatalog, async name => fs.readFileSync(path.join(root, 'public/home-design/objects', name + '.obj'), 'utf8'));
    assert.equal(prepared.placements.length, 53); assert.equal(prepared.variants.length, 28);
    assert.equal(new Set(prepared.variants.map(variant => variant.name)).size, 19);
    const parser = load('src/libraries/services/threed/design/design-import.ts');
    const architecture = parser.parseDesignImport(JSON.stringify(content), path.basename(file)).document;
    const openings = core.reconstructLegacyOpenings(architecture, content, suppliedCatalog, prepared);
    assert.equal(openings.document.walls.length, 38); assert.equal(openings.document.floors.length, 10); assert.equal(openings.document.roofs.length, 4);
    assert.deepEqual(plain(openings.convertedLegacyIds), ['53', '85']);
    console.log(JSON.stringify({ placements: prepared.placements.length, variants: prepared.variants.length, recordedPoseWarnings: prepared.warnings, convertedLegacyIds: openings.convertedLegacyIds, openingWarnings: openings.warnings }, null, 2));
    console.log('PASS supplied legacy fixture; local geometry reads only, no Model registration or Project write.');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
