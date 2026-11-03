// Real native parsers, no network/persistence or validation-library dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const helpers = require('../utils/input-validation.ts');
const cache = new Map();
function load(relative) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText, {
    exports,
    TextEncoder,
    URLSearchParams,
    require(name) {
      if (name === '@/libraries/utils/input-validation') return helpers;
      if (name === 'node:crypto') return require(name);
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      assert(target.startsWith(path.resolve('src/libraries') + path.sep));
      return load(target + '.ts');
    },
  });
  return exports;
}
const root = 'src/libraries/';
const signup = load(root + 'auth/signup-contract.ts');
const users = load(root + 'services/users/contracts.ts');
const workspace = load(root + 'config/workspace-settings.ts');
const appearance = load(root + 'config/module-appearance.ts');
const learn = load(root + 'services/learn/input.ts');
const albums = load(root + 'services/threed/multimedia/album-association-contract.ts');
const scene = load(root + 'services/threed/multimedia/scene-multimedia-contract.ts');
const project = load(root + 'services/project/multimedia-preview-contract.ts');
const weather = load(root + 'services/threed/weather-log-input.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const reject = (parse, value) => assert.throws(() => parse(value), helpers.InputValidationError);
const account = {
  name: ' Developer ',
  email: 'DEV@example.test ',
  password: 'abcdefgh',
};
assert.deepEqual(plain(signup.parseSignupInput(account)), {
  name: 'Developer',
  email: 'dev@example.test',
  password: 'abcdefgh',
});
for (const password of ['short', 'x'.repeat(73), '\u00e9'.repeat(37), '\ud83c\udf31'.repeat(19)]) reject(signup.parseSignupInput, { ...account, password });
for (const password of ['x'.repeat(72), '\u00e9'.repeat(36), '\ud83c\udf31'.repeat(18)]) signup.parseSignupInput({ ...account, password });
for (const email of ['bad', '.dev@example.test', 'de..v@example.test', 'dev@localhost', 'dev@example.1']) reject(signup.parseSignupInput, { ...account, email });
reject(signup.parseSignupInput, { ...account, role: 'super_admin' });
for (const value of [null, [], 1, 'input', new Date()]) reject(signup.parseSignupInput, value);
assert.deepEqual(plain(users.parseUserListQuery({ page: '2', search: ' test ' })), {
  search: 'test',
  page: 2,
  role: 'all',
  status: 'current',
});
for (const page of [0, -1, 1.5, 10001, NaN, Infinity]) reject(users.parseUserListQuery, { page });
reject(users.parseUserRoleUpdate, { role: 'user', revision: 'a'.repeat(64) });
users.parseUserProfileUpdate({ name: 'Name', email: 'DEV@example.test', role: 'user', revision: 'a'.repeat(64) });
const nil = '00000000-0000-0000-0000-000000000000';
workspace.parseWorkspaceSnapshot({ preferences: workspace.defaultWorkspaceSettings(), revision: nil });
const stored = appearance.defaultModuleAppearance();
stored.revision = nil;
delete stored.styles.learn;
delete stored.styles.dashboard;
delete stored.styles.admin;
assert.equal(appearance.readStoredModuleAppearance(stored).styles.learn.icon, 'BookOpen');
reject(appearance.parseModuleAppearanceSnapshot, stored);
reject(workspace.parseWorkspaceSettings, { ...workspace.defaultWorkspaceSettings(), userId: 'foreign' });
assert.deepEqual(plain(learn.parseLearnGuideInput({ title: ' Guide ', slug: ' guide ' })), {
  title: 'Guide',
  slug: 'guide',
  summary: '',
  content: '',
  sortOrder: 0,
  isActive: true,
  isPublished: false,
});
reject(learn.parseLearnGuideInput, { title: 'Guide', slug: 'UPPER' });
reject(learn.parseLearnImport, { overwrite: true });
const replacement = {
  expectedRevision: 'a'.repeat(64),
  assignments: [{ albumId: 1 }],
};
assert.equal(albums.parseAlbumReplacement(replacement).assignments[0].sortOrder, 0);
reject(albums.parseAlbumReplacement, { ...replacement, assignments: [{ albumId: 1 }, { albumId: 1 }] });
reject(albums.parseAlbumReplacement, { ...replacement, assignments: Array.from({ length: 101 }, (_, i) => ({ albumId: i + 1 })) });
for (const albumId of [0, -1, 1.5, 2147483648, '1']) reject(scene.parseMultimediaSelection, { albumId });
for (const action of scene.multimediaActions) {
  const command = { albumId: 1, projectId: 17, action };
  project.parseProjectMultimediaCommand(command);
  if (action !== 'playMultimedia') reject(project.parseProjectMultimediaCommand, { ...command, trackId: 2 });
}
const preview = {
  projectId: 17,
  albums: [{ id: 1, title: 'Album', artist: 'Artist', coverArt: null, userId: 'private' }],
  tracks: [{ id: 2, albumId: 1, title: 'Track', fileUrl: '/track.mp3', fileType: 'audio', duration: null, trackNumber: null, metadata: 'private' }],
  albumId: 1,
  offset: 0,
  hasMore: false,
  privateMetadata: 'private',
};
const response = project.parseProjectMultimediaPreview(preview);
assert(!Object.hasOwn(response, 'privateMetadata'));
assert(!Object.hasOwn(response.albums[0], 'userId'));
assert(!Object.hasOwn(response.tracks[0], 'metadata'));
reject(project.parseProjectMultimediaPreview, { ...preview, tracks: Array(51).fill(preview.tracks[0]) });
assert.deepEqual(plain(weather.parseWeatherLogInput({ temperature: '0', humidity: null, recordedAt: '2024-02-29T23:59Z', heatWarning: false })), {
  temperature: '0',
  humidity: null,
  heatWarning: false,
  recordedAt: '2024-02-29T23:59Z',
});
for (const recordedAt of ['2026-02-29T00:00Z', '2026-11-02T24:00Z', '2026-11-02T00:00:00+00:00']) reject(weather.parseWeatherLogInput, { recordedAt });
for (const temperature of [true, '', Infinity, -151, 161]) reject(weather.parseWeatherLogInput, { temperature });
reject(weather.parseWeatherLogInput, { userId: 'foreign', temperature: 10 });
assert.equal(helpers.tryParseInput(signup.parseSignupInput, null).success, false);
const internal = new Error('internal failure');
assert.throws(() => helpers.tryParseInput(() => { throw internal; }, {}), error => error === internal);
console.log('PASS native input contracts: normalization, UTF-8 limits, strict fields, saved revisions/legacy appearance, Album bounds, command restrictions, response stripping, Weather dates/numbers and internal-error propagation.');
