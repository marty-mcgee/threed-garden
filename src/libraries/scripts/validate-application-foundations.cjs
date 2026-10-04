#!/usr/bin/env node

// Offline metadata checks only: never import the application or initialize its renderers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '../../..');
const rootRequire = createRequire(path.join(root, 'package.json'));
const semver = rootRequire('semver');
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const runtimeNames = [
  'react', 'react-dom', 'next', 'three', '@react-three/fiber',
  '@react-three/drei', '@react-three/rapier', 'ecctrl',
];
const toolingNames = ['typescript', '@types/react', '@types/react-dom', '@types/three', '@types/node'];
const singletons = new Set(runtimeNames);

function checkRange(version, range, label) {
  assert.ok(semver.valid(version), `${label}: invalid installed version ${version}`);
  assert.ok(semver.validRange(range), `${label}: invalid declared range ${range}`);
  assert.ok(semver.satisfies(version, range), `${label}: ${version} does not satisfy ${range}`);
}

function declaredDependencies(manifest) {
  return Object.assign({}, ...dependencyFields.map((field) => manifest[field] || {}));
}

function checkRootMetadata(manifest, lock) {
  assert.ok(lock.packages?.[''], 'Lockfile must contain root package metadata');
  for (const field of ['name', 'version']) {
    assert.equal(lock[field], manifest[field], `Lockfile ${field} differs from package.json`);
    assert.equal(lock.packages[''][field], manifest[field], `Lock root ${field} differs from package.json`);
  }
  for (const field of dependencyFields) {
    assert.deepEqual(lock.packages[''][field] || {}, manifest[field] || {}, `Lock root ${field} differs from package.json`);
  }
  assert.deepEqual(lock.packages[''].engines || {}, manifest.engines || {}, 'Lock root engines differ from package.json');
}

function checkInstalled(record, name, lock) {
  assert.ok(record, `Missing installed package: ${name}`);
  assert.equal(record.manifest.name, name, `Resolved package name differs: ${name}`);
  assert.equal(lock.packages[record.location]?.version, record.manifest.version,
    `Installed version differs from lock: ${name} at ${record.location}`);
}

function checkPeers(owner, { lock, resolve, active }, enforceSingletons) {
  for (const [name, range] of Object.entries(owner.manifest.peerDependencies || {})) {
    const peer = resolve(owner, name);
    if (!peer && owner.manifest.peerDependenciesMeta?.[name]?.optional === true) continue;
    checkInstalled(peer, name, lock);
    checkRange(peer.manifest.version, range, `${owner.manifest.name} peer ${name}`);
    if (enforceSingletons && singletons.has(name) && active.has(name)) {
      assert.equal(peer.location, active.get(name).location,
        `${owner.manifest.name} resolves a duplicate active ${name}: ${peer.location}`);
    }
  }
}

function checkFoundation({ manifest, lock, resolve, entries }) {
  checkRootMetadata(manifest, lock);
  const declared = declaredDependencies(manifest);
  const active = new Map();
  for (const name of entries) {
    assert.equal(typeof declared[name], 'string', `Root must declare active package ${name}`);
    const installed = resolve(null, name);
    checkInstalled(installed, name, lock);
    checkRange(installed.manifest.version, declared[name], `Root dependency ${name}`);
    active.set(name, installed);
  }

  const context = { lock, resolve, active };
  const checkedHelpers = new Set();
  for (const owner of active.values()) {
    checkPeers(owner, context, true);
    // Check each active owner's direct dependency peers as well. This catches a
    // wrapper whose own peers pass but whose helper (e.g. postprocessing) fails.
    // Nested helpers may legitimately own other Three/type/physics versions.
    for (const [name, range] of Object.entries(owner.manifest.dependencies || {})) {
      if (owner.manifest.optionalDependencies?.[name]) continue;
      const dependency = resolve(owner, name);
      checkInstalled(dependency, name, lock);
      checkRange(dependency.manifest.version, range, `${owner.manifest.name} dependency ${name}`);
      if (singletons.has(name) && active.has(name)) {
        assert.equal(dependency.location, active.get(name).location,
          `${owner.manifest.name} resolves a duplicate active ${name}: ${dependency.location}`);
      }
      if (!checkedHelpers.has(dependency.location)) {
        checkedHelpers.add(dependency.location);
        checkPeers(dependency, context, false);
      }
    }
  }
  return active;
}

function installedResolver() {
  const records = new Map();
  return (owner, name) => {
    const from = owner ? path.join(root, owner.location, 'package.json') : path.join(root, 'package.json');
    // Resolve metadata through Node's owner-specific search paths without loading
    // package code; package.json need not be exposed by a package's exports map.
    // Include the metadata suffix so browser packages named after Node builtins
    // (for example buffer) still get normal package search paths.
    for (const searchPath of createRequire(from).resolve.paths(`${name}/package.json`) || []) {
      const file = path.join(searchPath, name, 'package.json');
      if (!fs.existsSync(file)) continue;
      const realFile = fs.realpathSync(file);
      const location = path.relative(root, path.dirname(realFile)).split(path.sep).join('/');
      if (!records.has(location)) {
        records.set(location, { location, manifest: JSON.parse(fs.readFileSync(realFile, 'utf8')) });
      }
      return records.get(location);
    }
    return null;
  };
}

function fixture() {
  const manifest = {
    name: 'foundation-fixture', version: '1.0.0', engines: { node: '>=20' },
    dependencies: { react: '^19.0.0', three: '^0.185.0', '@react-three/fiber': '^9.0.0' },
  };
  const records = new Map();
  const routes = new Map();
  const add = (location, data) => {
    const record = { location, manifest: data };
    records.set(location, record);
    return record;
  };
  const react = add('node_modules/react', { name: 'react', version: '19.2.8' });
  const three = add('node_modules/three', { name: 'three', version: '0.185.1' });
  const fiber = add('node_modules/@react-three/fiber', {
    name: '@react-three/fiber', version: '9.7.0',
    peerDependencies: { react: '>=19 <19.3', three: '>=0.156', 'optional-native-renderer': '^1.0.0' },
    peerDependenciesMeta: { 'optional-native-renderer': { optional: true } },
    dependencies: { 'stats-helper': '^1.0.0' },
  });
  const helper = add(`${fiber.location}/node_modules/stats-helper`, {
    name: 'stats-helper', version: '1.0.0', peerDependencies: { three: '^0.170.0' },
  });
  const helperThree = add(`${helper.location}/node_modules/three`, { name: 'three', version: '0.170.0' });
  routes.set(`${fiber.location}:stats-helper`, helper);
  routes.set(`${helper.location}:three`, helperThree);
  // This unrelated type dependency must not be mistaken for the active world.
  add('node_modules/@types/three/node_modules/@dimforge/rapier3d-compat', {
    name: '@dimforge/rapier3d-compat', version: '0.12.0',
  });
  const lock = {
    name: manifest.name, version: manifest.version,
    packages: { '': structuredClone(manifest) },
  };
  const syncLock = () => {
    for (const [location, record] of records) lock.packages[location] = structuredClone(record.manifest);
  };
  syncLock();
  const resolve = (owner, name) => routes.get(`${owner?.location}:${name}`) || records.get(`node_modules/${name}`) || null;
  return { manifest, lock, entries: Object.keys(manifest.dependencies), resolve, records, routes, add, syncLock, react, three, fiber, helper };
}

function checkNegativeFixtures() {
  checkFoundation(fixture());
  const rejects = (change, expected) => {
    const data = fixture();
    change(data);
    assert.throws(() => checkFoundation(data), expected);
  };
  rejects(({ lock }) => { lock.version = '1.0.1'; }, /Lockfile version differs/);
  rejects(({ lock }) => { lock.packages[''].version = '1.0.1'; }, /Lock root version differs/);
  rejects(({ lock }) => { lock.packages[''].dependencies.three = '^0.184.0'; }, /Lock root dependencies differs/);
  rejects(({ lock }) => { lock.packages['node_modules/three'].version = '0.185.2'; }, /Installed version differs from lock/);
  rejects(({ records }) => { records.delete('node_modules/react'); }, /Missing installed package: react/);
  rejects(({ fiber, syncLock }) => {
    fiber.manifest.peerDependencies.react = '^18.0.0';
    syncLock();
  }, /fiber peer react: 19.2.8 does not satisfy/);
  rejects(({ add, routes, fiber, syncLock }) => {
    const duplicate = add(`${fiber.location}/node_modules/react`, { name: 'react', version: '19.2.8' });
    routes.set(`${fiber.location}:react`, duplicate);
    syncLock();
  }, /duplicate active react/);
  rejects(({ fiber, syncLock }) => {
    delete fiber.manifest.peerDependenciesMeta;
    syncLock();
  }, /Missing installed package: optional-native-renderer/);
  rejects(({ add, syncLock }) => {
    add('node_modules/optional-native-renderer', { name: 'optional-native-renderer', version: '2.0.0' });
    syncLock();
  }, /optional-native-renderer: 2.0.0 does not satisfy/);
  rejects(({ helper, syncLock }) => {
    helper.manifest.peerDependencies.three = '^0.180.0';
    syncLock();
  }, /stats-helper peer three: 0.170.0 does not satisfy/);

  // Reproduce the audited wrapper/helper conflict, using the same evaluator as
  // the installed graph. The wrapper's broad range alone cannot establish safety.
  rejects(({ manifest, lock, entries, add, routes, syncLock }) => {
    manifest.dependencies['@react-three/postprocessing'] = '^3.0.4';
    lock.packages[''] = structuredClone(manifest);
    entries.push('@react-three/postprocessing');
    const wrapper = add('node_modules/@react-three/postprocessing', {
      name: '@react-three/postprocessing', version: '3.0.4',
      peerDependencies: { three: '>=0.156.0' }, dependencies: { postprocessing: '^6.39.1' },
    });
    const helper = add('node_modules/postprocessing', {
      name: 'postprocessing', version: '6.39.1', peerDependencies: { three: '>=0.168.0 <0.185.0' },
    });
    routes.set(`${wrapper.location}:postprocessing`, helper);
    syncLock();
  }, /postprocessing peer three: 0.185.1 does not satisfy/);
}

checkNegativeFixtures();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const entries = [...new Set([
  ...runtimeNames, ...toolingNames,
  ...Object.keys(declaredDependencies(manifest)).filter((name) => name.startsWith('@react-three/')),
])];
const active = checkFoundation({ manifest, lock, resolve: installedResolver(), entries });
checkRange(process.versions.node, manifest.engines.node, 'Node runtime');
const rapierOwner = active.get('@react-three/rapier');
const physics = installedResolver()(rapierOwner, '@dimforge/rapier3d-compat');
checkInstalled(physics, '@dimforge/rapier3d-compat', lock);
checkRange(physics.manifest.version, rapierOwner.manifest.dependencies['@dimforge/rapier3d-compat'], 'Scene Rapier runtime');

console.log('PASS: root/lock metadata and installed active-stack versions agree.');
console.log('PASS: active entry points and their direct helpers satisfy declared peers; active singletons share resolution.');
console.log('PASS: metadata/peer/duplicate-resolution regressions fail; optional peers and independently owned helper versions are handled.');
console.log(`PASS: Scene Rapier resolves from its owner to ${physics.location} (${physics.manifest.version}).`);
