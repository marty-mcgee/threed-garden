// Offline recovery artifact/CLI checks. All files are synthetic and all live imports are blocked.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createHash } = require('node:crypto');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const serviceRoot = path.resolve(__dirname, '../services/threed/design');

async function main() {
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
  const cache = new Map(), logs = [];
  let liveImports = 0;
  const fakeProcess = { argv: ['node', __filename], env: {}, exitCode: undefined };
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    assert(!filename.includes('legacy-recovery-database'), 'Live persistence must not be imported by offline commands.');
    const exports = {}; cache.set(filename, exports);
    const code = ts.transpileModule(syncFs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, {
      exports, Buffer, Error, URL, TextEncoder, TextDecoder, process: fakeProcess,
      console: { log: (...args) => logs.push(args.join(' ')), warn: (...args) => logs.push(args.join(' ')), error: (...args) => logs.push(args.join(' ')) },
      require(name) {
        if (name.includes('legacy-recovery-database')) { liveImports++; throw new Error('Live database imports are blocked by this offline test.'); }
        if (name === 'three/examples/jsm/loaders/OBJLoader.js') return { OBJLoader };
        if (name === 'three' || ['node:buffer', 'node:crypto', 'node:fs/promises', 'node:path'].includes(name)) return require(name);
        assert(name.startsWith('.'), `Unexpected recovery dependency: ${name}`);
        return load(path.resolve(path.dirname(filename), name + '.ts'));
      },
    }, { filename });
    return exports;
  }
  const api = load(path.join(serviceRoot, 'legacy-recovery-files.ts'));
  const cli = load(path.join(__dirname, 'recover-legacy-design.ts'));
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'threed-recovery-files-test-'));
  const source = path.join(temp, 'source'), objects = path.join(source, 'objects'), planPath = path.join(source, 'plan.json');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNBkAAAAASUVORK5CYII=', 'base64');
  const obj = ['mtllib Cube.mtl', 'v 0 0 0', 'v 100 0 0', 'v 0 100 100', 'vt 0 0', 'vt 1 0', 'vt 0 1', 'usemtl Paint', 'f 1/1 2/2 3/3'].join('\n');
  const mtl = 'newmtl Paint\nKd 1 1 1\nmap_Kd diffuse.png\n';
  const plan = {
    levels: { 0: { id: 0, height: 0 } },
    walls: { 1: { id: 1, wallPath: ['Path', { applyMatrix: true, data: { id: 1, type: 'wallPath', level: '0', height: [250, 250], thickness: 20 }, segments: [[0, 0], [500, 0]] }] } },
    floors: {}, roofs: {}, dimensions: {}, texts: {}, verticalGuides: {}, horizontalGuides: {},
    threed: { 1: { id: 1, name: 'Cube', level: '0', position: { x: 100, y: 25, z: 200 }, rotation: { _x: 0, _y: 0, _z: 0, _order: 'XYZ' }, scale: { x: 1, y: 1, z: 1 } } },
  };
  const catalog = { Cube: { author: 'Synthetic test author', license: 'Synthetic test fixture', useMask: false } };
  const options = out => ({ source, plan: planPath, out: path.join(temp, out), openings: 'report' });
  async function snapshot(dir) {
    const result = {};
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      if (item.isDirectory()) for (const [relative, hash] of Object.entries(await snapshot(path.join(dir, item.name)))) result[item.name + '/' + relative] = hash;
      else if (item.isFile()) result[item.name] = sha(await fs.readFile(path.join(dir, item.name)));
    }
    return result;
  }
  function signed(mutator) {
    const value = copy(prepared); mutator(value);
    const { fingerprint, ...content } = value;
    value.fingerprint = api.legacyRecoveryFingerprint(content);
    return value;
  }
  function invalid(mutator, pattern) { assert.throws(() => api.validateLegacyRecoveryPackage(signed(mutator)), pattern); }
  let prepared;
  try {
    await fs.mkdir(objects, { recursive: true }); await fs.mkdir(path.join(source, 'api'));
    await fs.writeFile(planPath, JSON.stringify(plan)); await fs.writeFile(path.join(source, 'api/objects.json'), JSON.stringify(catalog));
    await fs.writeFile(path.join(objects, 'Cube.obj'), obj); await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl); await fs.writeFile(path.join(objects, 'diffuse.png'), png);
    const original = await snapshot(source);
    prepared = await api.prepareLegacyRecovery(options('prepared'));
    assert.deepEqual(await snapshot(source), original, 'Preparation must retain every original source byte.');
    assert.equal(prepared.assets.length, 1); assert.equal(prepared.placements.length, 1); assert.equal(prepared.architecture.walls.length, 1);
    assert.equal(prepared.placements[0].levelId, prepared.architecture.levels[0].id, 'Placement binding must resolve to the converted architecture level.');
    assert.equal(prepared.placements[0].position.x, 1); assert.equal(prepared.placements[0].position.y, .25); assert.equal(prepared.placements[0].position.z, 2);
    assert.deepEqual(copy(await api.verifyLegacyRecoveryPackage(options('prepared').out)), copy(prepared));
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(options('prepared').out, 'architecture.json'), 'utf8')), copy(prepared.architecture));
    assert.match(await fs.readFile(path.join(options('prepared').out, 'review.txt'), 'utf8'), /NEW private Project/);
    for (const file of prepared.assets[0].files) {
      const bytes = await fs.readFile(path.join(options('prepared').out, file.path));
      assert.equal(bytes.length, file.bytes); assert.equal(sha(bytes), file.sha256);
    }
    const artifactBefore = await snapshot(options('prepared').out);
    await assert.rejects(api.prepareLegacyRecovery(options('prepared')), /exist/i);
    assert.deepEqual(await snapshot(options('prepared').out), artifactBefore, 'A repeated preparation must not overwrite an existing artifact.');

    invalid(value => { value.ownerId = 'untrusted'; }, /Unsupported/);
    invalid(value => { value.assets[0].projectId = 99; }, /Unsupported/);
    invalid(value => { value.assets[0].files[0].ownerId = 'untrusted'; }, /Unsupported/);
    invalid(value => { value.placements[0].modelId = 99; }, /Unsupported/);
    invalid(value => { value.assets.push(copy(value.assets[0])); }, /duplicate/);
    invalid(value => { value.placements.push(copy(value.placements[0])); }, /identity/);
    invalid(value => { value.placements[0].variantKey = 'missing'; }, /asset/);
    invalid(value => { value.placements[0].levelId = 'missing'; }, /level/);
    invalid(value => { value.assets[0].files[0].bytes = 0; }, /size/);
    invalid(value => { value.assets[0].files[0].bytes = 32 * 1024 * 1024 + 1; }, /size/);
    invalid(value => { value.assets[0].files[0].sha256 = 'invalid'; }, /hash/);
    for (const badPath of ['../outside.obj', '/outside.obj', 'C:/outside.obj', 'https://example.test/model.obj', prepared.assets[0].key + '/%2e%2e/outside.obj']) {
      invalid(value => { value.assets[0].files[0].path = badPath; }, /path|escape|relative|encoding/i);
    }
    invalid(value => { value.assets[0].files.push(copy(value.assets[0].files[0])); }, /duplicate/);
    invalid(value => { value.warnings = ['x'.repeat(4 * 1024 * 1024)]; }, /4 MiB/);
    invalid(value => { value.assets = Array.from({ length: 9 }, (_, index) => ({ ...copy(value.assets[0]), key: 'asset' + index, files: [{ path: `asset${index}/Cube.obj`, bytes: 32 * 1024 * 1024, sha256: 'a'.repeat(64), role: 'model' }] })); }, /256 MiB/);
    assert.throws(() => api.validateLegacyRecoveryPackage({ ...prepared, fingerprint: 'a'.repeat(64) }), /fingerprint/);

    const stagedObj = path.join(options('prepared').out, prepared.assets[0].files.find(file => file.role === 'model').path);
    const originalObj = await fs.readFile(stagedObj);
    await fs.appendFile(stagedObj, '\n# changed');
    await assert.rejects(api.verifyLegacyRecoveryPackage(options('prepared').out), /changed/);
    await fs.writeFile(stagedObj, originalObj);
    const retainedPlan = path.join(options('prepared').out, 'source-plan.json');
    const retainedText = await fs.readFile(retainedPlan); await fs.appendFile(retainedPlan, '\n');
    await assert.rejects(api.verifyLegacyRecoveryPackage(options('prepared').out), /source plan changed/);
    await fs.writeFile(retainedPlan, retainedText);
    await api.verifyLegacyRecoveryPackage(options('prepared').out);

    await fs.writeFile(path.join(objects, 'Cube.obj'), obj.replace('Cube.mtl', 'old-staircase-name.mtl'));
    const alias = await api.prepareLegacyRecovery(options('alias'));
    assert(alias.assets[0].files.some(file => file.path.endsWith('/old-staircase-name.mtl')));
    assert(alias.warnings.some(warning => /staged Cube\.mtl/.test(warning)));
    assert.equal(await fs.readFile(path.join(objects, 'Cube.obj'), 'utf8'), obj.replace('Cube.mtl', 'old-staircase-name.mtl'));
    await api.verifyLegacyRecoveryPackage(options('alias').out);
    await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl.replace('Paint', 'Other'));
    await assert.rejects(api.prepareLegacyRecovery(options('bad-alias')), /every referenced material/);
    assert.equal(syncFs.existsSync(options('bad-alias').out), false);
    await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl);
    await fs.writeFile(path.join(objects, 'Cube.obj'), obj.replace('Cube.mtl', 'one.mtl two.mtl'));
    await assert.rejects(api.prepareLegacyRecovery(options('multiple-missing')), /ENOENT/);
    await fs.writeFile(path.join(objects, 'Cube.obj'), obj);
    await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl.replace('diffuse.png', '../../outside.png'));
    await assert.rejects(api.prepareLegacyRecovery(options('traversal')), /escape/);
    await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl);
    await assert.rejects(api.prepareLegacyRecovery({ ...options('inside'), out: path.join(source, 'staged') }), /outside|source/);
    assert.equal(syncFs.existsSync(path.join(source, 'staged')), false);
    await assert.rejects(api.prepareLegacyRecovery({ ...options('ancestor'), out: temp }), /outside|source/);
    const largePlan = path.join(temp, 'oversize-plan.json'); await fs.writeFile(largePlan, ' '.repeat(1_048_577));
    await assert.rejects(api.prepareLegacyRecovery({ ...options('large-plan'), plan: largePlan }), /file size/);
    const originalCatalog = await fs.readFile(path.join(source, 'api/objects.json'));
    await fs.writeFile(path.join(source, 'api/objects.json'), ' '.repeat(2 * 1024 * 1024 + 1));
    await assert.rejects(api.prepareLegacyRecovery(options('large-catalog')), /file size/);
    await fs.writeFile(path.join(source, 'api/objects.json'), originalCatalog);
    const largeObj = await fs.open(path.join(objects, 'Cube.obj'), 'w');
    try { await largeObj.truncate(32 * 1024 * 1024 + 1); } finally { await largeObj.close(); }
    await assert.rejects(api.prepareLegacyRecovery(options('large-obj')), /file size/);
    await fs.writeFile(path.join(objects, 'Cube.obj'), obj);

    const external = path.join(temp, 'external'); await fs.mkdir(external); await fs.writeFile(path.join(external, 'diffuse.png'), png);
    let linksAvailable = true;
    try { await fs.symlink(external, path.join(objects, 'textures'), process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (error) { if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) throw error; linksAvailable = false; }
    if (linksAvailable) {
      await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl.replace('diffuse.png', 'textures/diffuse.png'));
      await assert.rejects(api.prepareLegacyRecovery(options('escaped-symlink')), /escapes/);
      await fs.writeFile(path.join(objects, 'Cube.mtl'), mtl);
      const linkedParent = path.join(temp, 'source-alias');
      await fs.symlink(source, linkedParent, process.platform === 'win32' ? 'junction' : 'dir');
      await assert.rejects(api.prepareLegacyRecovery({ ...options('nested-link'), out: path.join(linkedParent, 'must-not-create', 'output') }), /source|outside/);
      assert.equal(syncFs.existsSync(path.join(source, 'must-not-create')), false, 'Reject a source-escaping output ancestor before mkdir changes original sources.');
      const stagedFolder = path.join(options('prepared').out, prepared.assets[0].key), escapedFolder = path.join(temp, 'escaped-staged-files');
      await fs.rename(stagedFolder, escapedFolder);
      await fs.symlink(escapedFolder, stagedFolder, process.platform === 'win32' ? 'junction' : 'dir');
      await assert.rejects(api.verifyLegacyRecoveryPackage(options('prepared').out), /escapes/);
      await fs.unlink(stagedFolder); await fs.rename(escapedFolder, stagedFolder);
    }

    const parse = cli.parseLegacyRecoveryArguments;
    assert.equal(parse([]).command, 'help'); assert.equal(parse(['--help']).command, 'help');
    assert.equal(parse(['prepare', '--source', source, '--plan', planPath, '--out', options('cli').out]).command, 'prepare');
    assert.equal(parse(['verify', '--bundle', options('prepared').out]).command, 'verify');
    const apply = ['apply', '--bundle', options('prepared').out, '--user-id', 'synthetic-user', '--project-name', 'Synthetic recovery'];
    assert.throws(() => parse(apply), /accept-warnings/);
    assert.throws(() => parse([...apply, '--accept-warnings']), /--apply/);
    assert.throws(() => parse([...apply, '--apply']), /accept-warnings/);
    assert.equal(parse([...apply, '--accept-warnings', '--apply']).command, 'apply');
    assert.throws(() => parse([...apply, '--accept-warnings', '--apply', '--project-id', '5']), /Unknown/);
    assert.throws(() => parse(['prepare', '--source', source, '--plan', planPath, '--out', options('cli').out, '--apply']), /Unknown/);
    for (const args of [['verify', '--bundle', 'one', '--bundle', 'two'], ['verify', '--project-id', '5'], ['prepare', '--source'], ['prepare', '--source', source, '--plan', planPath, '--out', 'out', '--openings', 'guess'], ['verify', '--bundle=one']]) assert.throws(() => parse(args));
    await cli.runLegacyRecovery(['--help']);
    await cli.runLegacyRecovery(['verify', '--bundle', options('prepared').out]);
    await cli.runLegacyRecovery(['prepare', '--source', source, '--plan', planPath, '--out', options('cli').out]);
    await assert.rejects(cli.runLegacyRecovery(apply), /accept-warnings/);
    await assert.rejects(cli.runLegacyRecovery([...apply, '--accept-warnings', '--apply']), /environment/);
    fakeProcess.env = { DATABASE_URL: 'postgresql://fixture:placeholder@ep-fixture-pooler.us-east-2.aws.neon.tech/app', BLOB_READ_WRITE_TOKEN: 'synthetic-never-upload' };
    await assert.rejects(cli.runLegacyRecovery([...apply, '--accept-warnings', '--apply']), /direct database connection/);
    fakeProcess.env.DATABASE_URL_UNPOOLED = 'postgresql://fixture:placeholder@ep-other.us-east-2.aws.neon.tech/app';
    await assert.rejects(cli.runLegacyRecovery([...apply, '--accept-warnings', '--apply']), /must match/);
    fakeProcess.env = { DATABASE_URL: 'synthetic://never-connect', BLOB_READ_WRITE_TOKEN: 'synthetic-never-upload' };
    await fs.appendFile(stagedObj, '\n# corrupt');
    await assert.rejects(cli.runLegacyRecovery([...apply, '--accept-warnings', '--apply']), /changed/);
    await assert.rejects(cli.runLegacyRecovery(['verify', '--bundle', options('prepared').out]), /changed/);
    assert.equal(liveImports, 0, 'Help, preparation, verification, missing flags/env, and corrupt packages must not even import live clients.');
    assert(logs.some(value => value.includes('No uploads or database writes')));
    console.log(`Legacy recovery files/CLI: hashes, strict package references, bounded reads, original preservation, MTL alias, no overwrite, traversal${linksAvailable ? '/symlink' : ' (symlink creation unavailable)'}, and offline command boundaries passed.`);
  } finally {
    const resolved = path.resolve(temp), relative = path.relative(os.tmpdir(), resolved);
    assert(relative && !relative.startsWith('..') && path.basename(resolved).startsWith('threed-recovery-files-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
