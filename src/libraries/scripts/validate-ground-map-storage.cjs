// Run the upload, removal and Project deletion paths without a database or Blob account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function table(...columns) {
  return Object.fromEntries(columns.map(column => [column, column]));
}
const project = table('id', 'userId');
const maps = table('id', 'projectId', 'userId', 'filePath');
const initialImage = 'https://fixture.invalid/original.png';
const replacement = 'https://fixture.invalid/replacement.png';
const records = new Map([
  [project, [{ id: 18, userId: 'owner' }, { id: 19, userId: 'owner' }]],
  [maps, [18, 19].map(projectId => ({ id: projectId + 10, projectId, userId: 'owner', filePath: initialImage }))],
]);
const removedImages = [];
let actor = 'owner';
let loseResponseAfterUpload = false;
let writingUpload = false;
let locks = 0;
const db = {
  async transaction(operation) {
    const result = await operation(db);
    if (writingUpload) {
      writingUpload = false;
      if (loseResponseAfterUpload) {
        loseResponseAfterUpload = false;
        throw new Error('Simulated lost commit confirmation');
      }
    }
    return result;
  },
  select() {
    return { from: target => ({ where: matches => ({ limit: count => {
      const result = records.get(target).filter(matches).slice(0, count);
      result.for = async mode => {
        assert.equal(target, project);
        assert.equal(mode, 'update');
        locks++;
        return result;
      };
      return result;
    } }) }) };
  },
  insert(target) {
    assert.equal(target, maps);
    return { values: fields => ({ onConflictDoUpdate: ({ set }) => ({ returning: async () => {
      const previous = records.get(target).find(row => row.projectId === fields.projectId);
      const next = previous ? { ...previous, ...set } : { id: 99, ...fields };
      records.set(target, [...records.get(target).filter(row => row !== previous), next]);
      writingUpload = true;
      return [next];
    } }) }) };
  },
  delete(target) {
    return { where: matches => ({ returning: async () => {
      const values = records.get(target);
      records.set(target, values.filter(row => !matches(row)));
      return values.filter(matches);
    } }) };
  },
};

const storageModule = '@/libraries/services/threed/ground-maps/project-ground-map-storage';
const libraries = {
  '@/libraries/services/project/read-access': {},
  '@/libraries/services/project/featured-image': {},
  '@/libraries/services/project/measurement-units': {},
  '@/libraries/services/project/configuration': {},
  '@/libraries/services/threed/markers/map-coordinate-core': {},
  '@/libraries/services/threed/models/model-image-limits-core': { getBulkLocalImageDimensions: () => ({ width: 8, height: 8 }) },
  '@/libraries/services/threed/models/model-blob-paths': { createThreeDBlobPath: () => 'new-key' },
  '@/libraries/db/client': { db },
  '@/libraries/schema/project': { project },
  '@/libraries/schema/threed': { threedGroundMaps: maps },
  '@/libraries/auth': { auth: async () => ({ user: { id: actor } }) },
  '@vercel/blob': { del: async uri => { removedImages.push(uri); }, put: async () => ({ url: replacement }) },
  'next/server': { NextResponse: { json: (data, init = {}) => ({ status: init.status ?? 200, data }) } },
  'drizzle-orm': {
    eq: (column, value) => row => row[column] === value,
    and: (...checks) => row => checks.every(check => check(row)),
  },
};
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, URL, File, crypto, console,
    require(name) {
      assert.ok(Object.hasOwn(libraries, name), 'Missing mock for ' + name);
      return libraries[name];
    },
  }, { filename: file });
  return exports;
}
libraries[storageModule] = load('src/libraries/services/threed/ground-maps/project-ground-map-storage.ts');
const ground = load('src/app/api/threed/ground-maps/route.ts');
const projects = load('src/app/api/project/route.ts');
const upload = {
  formData: () => new Map([
    ['projectId', '19'],
    ['file', new File(['test image'], 'replacement.png', { type: 'image/png' })],
  ]),
};

(async () => {
  const source = { url: 'https://fixture.invalid/?id=18' };
  actor = 'other';
  assert.equal((await projects.DELETE(source)).status, 404);
  actor = 'owner';
  loseResponseAfterUpload = true;
  await assert.rejects(() => ground.POST(upload), /lost commit confirmation/);
  assert.equal(records.get(maps).find(row => row.projectId === 19).filePath, replacement);
  assert.deepEqual(removedImages, [], 'A lost commit acknowledgement retains the committed upload');
  assert.equal((await projects.DELETE(source)).status, 200);
  assert.deepEqual(removedImages, [initialImage], 'Deleting last Project reference releases original file');
  const copy = { url: 'https://fixture.invalid/?projectId=19' };
  assert.equal((await ground.DELETE(copy)).status, 200);
  assert.deepEqual(removedImages, [initialImage, replacement]);
  assert.equal((await ground.DELETE(copy)).status, 404);

  records.get(project).push({ id: 18, userId: 'owner' });
  for (const projectId of [18, 19]) records.get(maps).push({ id: projectId, projectId, userId: actor, filePath: initialImage });
  removedImages.length = 0;
  assert.equal((await ground.POST(upload)).status, 200);
  assert.deepEqual(removedImages, [], 'Replacing the copy preserves the original file');
  records.get(maps).find(row => row.projectId === 19).filePath = initialImage;
  assert.equal((await projects.DELETE(source)).status, 200);
  assert.deepEqual(removedImages, [], 'Deleting the source preserves the copy file');
  assert.equal((await ground.DELETE(copy)).status, 200);
  assert.deepEqual(removedImages, [initialImage]);
  assert.ok(locks > 0);
  console.log('PASS: shared Ground Map replacement and deletion, Project removal, owner isolation and lost commit response (mock DB and Blob).');
})().catch(error => { console.error(error); process.exitCode = 1; });
