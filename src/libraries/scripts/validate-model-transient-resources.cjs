// Offline lifecycle fixture: actual loader hook, real Three resources, mocked IO.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

function moduleSource(path, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText, {
    exports,
    require(name) {
      assert(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}
const resources = moduleSource('src/libraries/services/threed/models/model-transient-resources.ts', { three: THREE });
const lighting = moduleSource('src/libraries/services/threed/models/model-lighting-material.ts', { three: THREE });
const markerSource = fs.readFileSync('src/components/threed/markers/ModelMarker3D.tsx', 'utf8');
const parsed = ts.createSourceFile('marker.tsx', markerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const hook = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'useModelLoad');
assert(hook, 'Loader hook must exist');

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function counted(resource, label, counts) {
  counts.set(label, 0);
  resource.addEventListener('dispose', () => counts.set(label, counts.get(label) + 1));
  return resource;
}
function loadedFixture() {
  const counts = new Map();
  const root = new THREE.Group();
  const geometry = counted(new THREE.BoxGeometry(), 'geometry', counts);
  const texture = counted(new THREE.Texture(), 'texture', counts);
  const material = counted(new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture }), 'material', counts);
  const mesh = new THREE.Mesh(geometry, material);
  root.add(mesh, new THREE.Mesh(geometry, material));
  const skinned = new THREE.SkinnedMesh(geometry, material);
  geometry.computeBoundingBox();
  skinned.boundingBox = geometry.boundingBox.clone();
  const bone = new THREE.Bone();
  const skeleton = new THREE.Skeleton([bone]);
  skeleton.computeBoneTexture();
  counted(skeleton.boneTexture, 'boneTexture', counts);
  skinned.bind(skeleton);
  root.add(skinned);
  return { root, mesh, material, texture, counts };
}
const once = fixture => {
  for (const [label, count] of fixture.counts) assert.equal(count, 1, `${label} must be disposed exactly once`);
};

function harness() {
  const states = [];
  const modelCache = new Map();
  const loadQueue = [];
  const results = [];
  let cursor = 0;
  let cleanup;
  let loadCount = 0;
  let assignmentWait;
  let failCompletion = false;
  const context = {
    THREE,
    modelCache,
    ...resources,
    ...lighting,
    useSceneResourceIssueReporter: () => undefined,
    useState(initial) {
      const index = cursor++;
      if (states.length <= index) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect(run) { cleanup = run(); },
    loadModelAttachments: async () => [],
    modelLoadCompletion: () => async () => {
      if (failCompletion) throw new Error('Resource completion failed');
      return true;
    },
    resolveThreeDModelAttachmentUrl: value => value,
    dracoLoader: {},
    GLTFLoader: class {
      setDRACOLoader() {}
      async loadAsync() {
        loadCount++;
        const entry = loadQueue.shift();
        assert(entry, 'Unexpected loader request');
        const scene = await entry;
        return { scene, animations: [] };
      }
    },
    mergeThreeDModelMaterialAssignments: (_, assignments) => assignments ?? [],
    async applyThreeDModelMaterialAssignments(root, _format, assignments) {
      if (!assignments.length) return () => {};
      const mesh = root.children[0];
      const original = mesh.material;
      const assignment = original.clone();
      const texture = new THREE.Texture();
      assignment.map = texture;
      let releases = 0;
      assignment.addEventListener('dispose', () => { assignment.disposals = (assignment.disposals ?? 0) + 1; });
      texture.addEventListener('dispose', () => { texture.disposals = (texture.disposals ?? 0) + 1; });
      results.push({ assignment, texture, get releases() { return releases; } });
      if (assignmentWait) await assignmentWait.promise;
      mesh.material = assignment;
      return () => {
        releases++;
        mesh.material = original;
        assignment.dispose();
        texture.dispose();
      };
    },
    readModelLightBoost: () => 0,
    calculateThreeDModelGroundedY: (min, offset) => offset - min,
    assertModelTexturesReady: () => {},
    console: { error() {} },
  };
  vm.runInNewContext(ts.transpileModule(`${hook.getText(parsed)}\nglobalThis.runHook = useModelLoad;`, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText, context);
  return {
    modelCache,
    loadQueue,
    results,
    states,
    set assignmentWait(value) { assignmentWait = value; },
    set failCompletion(value) { failCompletion = value; },
    get loadCount() { return loadCount; },
    run(url, transientResources, modelOptions = {}) {
      cursor = 0;
      context.runHook({ id: 0, modelName: 'Preview', modelType: 'glb', filePath: url, scale: 1, ...modelOptions }, undefined, true, transientResources);
    },
    close() { cleanup?.(); },
    async flush() { for (let turn = 0; turn < 8; turn++) await new Promise(resolve => setTimeout(resolve, 0)); },
  };
}

(async () => {
  const normal = harness();
  const cached = loadedFixture();
  normal.loadQueue.push(cached.root);
  normal.run('https://example.invalid/existing.glb', false);
  await normal.flush();
  normal.close();
  normal.run('https://example.invalid/existing.glb', false);
  await normal.flush();
  normal.close();
  assert.equal(normal.loadCount, 1, 'Default loads continue to reuse their cache');
  assert.equal(normal.modelCache.size, 1);
  assert([...cached.counts.values()].every(count => count === 0), 'Default shared resources must not be disposed');

  const independent = loadedFixture();
  normal.loadQueue.push(independent.root);
  normal.run('https://example.invalid/existing.glb', true);
  await normal.flush();
  assert.equal(normal.states[0], independent.root, 'A transient load must bypass an existing shared cache entry');
  normal.close();
  once(independent);
  normal.run('https://example.invalid/existing.glb', false);
  await normal.flush();
  normal.close();
  assert.equal(normal.loadCount, 2, 'Transient previews cannot replace the default cached source');
  assert.equal(normal.modelCache.size, 1);
  assert([...cached.counts.values()].every(count => count === 0), 'Transient cleanup must retain existing cached resources');

  const transient = harness();
  for (let revision = 0; revision < 3; revision++) {
    const current = loadedFixture();
    transient.loadQueue.push(current.root);
    transient.run('blob:repeated-preview', true);
    await transient.flush();
    assert(transient.states[0] === current.root, `Preview failed: ${transient.states[2]}`);
    transient.close();
    transient.close();
    once(current);
  }
  assert.equal(transient.loadCount, 3);
  assert.equal(transient.modelCache.size, 0, 'Temporary previews cannot accumulate in the shared cache');

  const late = harness();
  const pending = deferred();
  const lateResource = loadedFixture();
  late.loadQueue.push(pending.promise);
  late.run('blob:late-preview', true);
  await late.flush();
  late.close();
  pending.resolve(lateResource.root);
  await late.flush();
  once(lateResource);
  assert.equal(late.states[0], null, 'A cancelled load cannot publish its disposed geometry');
  assert.equal(late.modelCache.size, 0);

  const assigned = harness();
  const withAssignment = loadedFixture();
  const pendingAssignment = deferred();
  assigned.assignmentWait = pendingAssignment;
  assigned.loadQueue.push(withAssignment.root);
  assigned.run('blob:assigned-preview', true, { materialAssignments: [{}] });
  await assigned.flush();
  assigned.close();
  assert([...withAssignment.counts.values()].every(count => count === 0), 'An in-flight assignment must settle before its base resources are disposed');
  pendingAssignment.resolve();
  await assigned.flush();
  assigned.close();
  once(withAssignment);
  assert.equal(assigned.results[0].releases, 1);
  assert.equal(assigned.results[0].assignment.disposals, 1);
  assert.equal(assigned.results[0].texture.disposals, 1);
  assert.equal(withAssignment.mesh.material, withAssignment.material);

  const failed = harness();
  const failedResource = loadedFixture();
  failed.failCompletion = true;
  failed.loadQueue.push(failedResource.root);
  failed.run('blob:failed-preview', true);
  await failed.flush();
  failed.close();
  once(failedResource);
  assert.match(failed.states[2], /Resource completion failed/);

  const bright = harness();
  const brightResource = loadedFixture();
  bright.loadQueue.push(brightResource.root);
  bright.run('blob:bright-preview', true, { modelLightBoost: 0.5, materialAssignments: [{}] });
  await bright.flush();
  const litMaterials = [...resources.modelMaterials(brightResource.root)];
  assert(litMaterials.every(material => material !== brightResource.material));
  let lightDisposals = 0;
  litMaterials.forEach(material => material.addEventListener('dispose', () => { lightDisposals++; }));
  bright.close();
  once(brightResource);
  assert.equal(lightDisposals, litMaterials.length, 'Light-boost clones have their own disposal ownership');
  assert.equal(bright.results[0].assignment.disposals, 1);
  assert.equal(bright.results[0].texture.disposals, 1);
  console.log('PASS transient Model previews: cache isolation, default cache preservation, deduplicated resource disposal, late cancellation, assignment ownership, failure and lighting clones.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
