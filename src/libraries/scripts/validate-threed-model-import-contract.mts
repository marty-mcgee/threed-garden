import assert from 'node:assert/strict';
import {
  parseThreeDModelImportManifest,
  ThreeDModelImportManifestError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-import-manifest-core.ts';
import {
  inspectThreeDModelMaterial,
  inspectThreeDModelPrimary,
  isThreeDModelRequirementSatisfied,
  normalizeThreeDModelRelativePath,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-companion-core.ts';

let groups = 0;
function group(label: string, run: () => void) {
  run();
  groups += 1;
  console.log(`  ✓ ${label}`);
}

function expectInvalid(value: unknown, issue: string) {
  assert.throws(
    () => parseThreeDModelImportManifest(value),
    (error) => error instanceof ThreeDModelImportManifestError
      && error.issues.some((candidate) => candidate.includes(issue)),
  );
}

const validModel = {
  importKey: 'garden/tomato-v1',
  modelName: 'Tomato',
  modelType: 'glb',
  sourceFile: './models/tomato.glb',
  thumbnailFile: './previews/tomato.webp',
  supportingFiles: ['./models/tomato.mtl', './models/tomato-texture.png'],
  categories: ['plants', 'vegetables'],
  metadata: { license: 'CC0' },
};

console.log('\nThreeD Model import contract validation');
console.log('─'.repeat(44));

group('valid manifests inherit bounded defaults without persistence dependencies', () => {
  const plan = parseThreeDModelImportManifest({ version: 1, models: [validModel] });
  assert.equal(plan.models.length, 1);
  assert.equal(plan.models[0].isLibraryItem, true);
  assert.equal(plan.models[0].isPublic, false);
  assert.equal(plan.models[0].scale, 1);
});

group('unknown fields and unsupported versions fail closed', () => {
  expectInvalid({ version: 2, models: [validModel] }, 'version must be 1');
  expectInvalid({ version: 1, models: [{ ...validModel, databaseId: 4 }] }, 'databaseId is not supported');
});

group('import identities are unique and normalized', () => {
  expectInvalid({ version: 1, models: [validModel, validModel] }, 'duplicates garden/tomato-v1');
  expectInvalid({ version: 1, models: [{ ...validModel, importKey: 'Garden Tomato' }] }, 'importKey may contain');
});

group('file references remain relative and use supported extensions', () => {
  expectInvalid({ version: 1, models: [{ ...validModel, sourceFile: '../tomato.glb' }] }, 'contained by the manifest directory');
  expectInvalid({ version: 1, models: [{ ...validModel, sourceFile: './tomato.exe' }] }, 'must end in');
  expectInvalid({ version: 1, models: [{ ...validModel, thumbnailFile: './tomato.svg' }] }, 'must end in');
  expectInvalid({ version: 1, models: [{ ...validModel, supportingFiles: ['../texture.png'] }] }, 'contained by the manifest directory');
  expectInvalid({ version: 1, models: [{ ...validModel, supportingFiles: ['./texture.exe'] }] }, 'must end in');
});

group('model type, taxonomy, transforms, and metadata remain bounded', () => {
  expectInvalid({ version: 1, models: [{ ...validModel, modelType: 'exe' }] }, 'modelType must be one of');
  expectInvalid({ version: 1, models: [{ ...validModel, categories: ['Not Normalized'] }] }, 'must be a normalized slug');
  expectInvalid({ version: 1, models: [{ ...validModel, scale: 0 }] }, 'scale must be a finite number');
  expectInvalid({ version: 1, models: [{ ...validModel, metadata: 'raw' }] }, 'metadata must be an object');
});

group('OBJ and MTL companion references resolve by exact filename', () => {
  const obj = inspectThreeDModelPrimary('chair.obj', new TextEncoder().encode('mtllib materials/chair.mtl\nv 0 0 0'));
  assert.deepEqual(obj, [{ fileName: 'chair.mtl', kind: 'material', relativePath: 'materials/chair.mtl', referencedBy: 'chair.obj' }]);
  const mtl = inspectThreeDModelMaterial(
    'chair.mtl',
    'map_Kd textures/chair.png\nmap_Bump -bm 0.5 chair-normal.jpg',
    'materials/chair.mtl',
  );
  assert.deepEqual(mtl.map((entry) => entry.relativePath), ['materials/textures/chair.png', 'materials/chair-normal.jpg']);
  assert.equal(isThreeDModelRequirementSatisfied(obj[0], ['MATERIALS/CHAIR.MTL']), true);
});

group('GLTF and FBX external companion references are discovered without fetching', () => {
  const gltf = inspectThreeDModelPrimary('plant.gltf', new TextEncoder().encode(JSON.stringify({
    buffers: [{ uri: 'plant.bin' }],
    images: [{ uri: 'textures/leaf.webp' }, { uri: 'data:image/png;base64,AA==' }],
  })));
  assert.deepEqual(gltf.map((entry) => [entry.kind, entry.relativePath]), [['buffer', 'plant.bin'], ['texture', 'textures/leaf.webp']]);
  const fbx = inspectThreeDModelPrimary('farmer.fbx', new TextEncoder().encode('RelativeFilename: "textures\\farmer_diffuse.png"'));
  assert.equal(fbx.some((entry) => entry.fileName === 'farmer_diffuse.png'), true);
});

group('attachment paths preserve safe directories and reject storage escapes', () => {
  assert.equal(normalizeThreeDModelRelativePath('textures\\plants/leaf.png'), 'textures/plants/leaf.png');
  assert.equal(normalizeThreeDModelRelativePath('/etc/passwd'), null);
  assert.equal(normalizeThreeDModelRelativePath('../outside.bin'), null);
  const mtl = inspectThreeDModelMaterial('chair.mtl', 'map_Kd ../textures/chair.png', 'materials/chair.mtl');
  assert.equal(mtl[0].relativePath, 'textures/chair.png');
});

console.log('─'.repeat(44));
console.log(`PASS  ${groups} validation groups completed`);
