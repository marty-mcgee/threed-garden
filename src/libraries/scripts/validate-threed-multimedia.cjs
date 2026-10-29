// Actual read service, media controller and Simulation lifecycle with offline ports.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');

function load(file, mocks = {}, globals = {}, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    console,
    Error,
    URL,
    URLSearchParams,
    AbortController,
    AbortSignal,
    Response,
    Request,
    Date,
    TextEncoder,
    ...globals,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'server-only') return {};
      if (['zod', 'drizzle-orm', 'drizzle-orm/pg-core', 'node:crypto'].includes(name)) return require(name);
      assert(!name.includes('/db/') && name !== '@/libraries/auth', `Unmocked live boundary: ${name}`);
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
      assert(target, `Unexpected dependency ${name}`);
      const resolved = [target, target + '.ts', target + '.tsx', path.join(target, 'index.ts')].find(value => fs.existsSync(value) && fs.statSync(value).isFile());
      assert(resolved, name);
      return load(resolved, mocks, globals, cache);
    },
  });
  return exports;
}

const root = 'src/libraries/services/threed/';
const contract = load(root + 'multimedia/scene-multimedia-contract.ts');
const runtime = load(root + 'multimedia/scene-multimedia-player.ts');
const simulationInput = load(root + 'simulations/simulation-input.ts');
const mediaSimulation = load(root + 'simulations/multimedia-simulation.ts');
const simulationRunner = load(root + 'simulations/soccer-simulation-runner.ts');
const schema = load('src/libraries/schema/index.ts');
const dialect = new pg.PgDialect();
const flush = () => new Promise(resolve => setImmediate(resolve));
const clone = value => JSON.parse(JSON.stringify(value));
const baseCommand = {
  projectId: 7,
  markerId: 'radio',
  albumId: 28,
  action: 'playMultimedia',
};
const track = (id, number = id) => ({
  id,
  albumId: 28,
  title: `Track ${id}`,
  fileUrl: `https://media.invalid/${id}.mp3`,
  fileType: 'audio/mpeg',
  duration: 30,
  trackNumber: number,
});
function response(query, tracks = [track(21), track(22)], hasMore = false) {
  return {
    projectId: query.projectId,
    markerId: query.markerId,
    sourceType: 'model',
    sourceId: 5,
    albums: [{ id: 28, title: 'TRADE', artist: 'Example', coverArt: '/art.png' }],
    albumId: query.albumId,
    tracks,
    offset: query.offset,
    hasMore,
  };
}
const markers = [
  { id: 'radio', type: 'models', name: 'Design: Radio', isActive: true, isVisible: true, data: { id: 5, projectMarkerId: 105 } },
  { id: 'kate', type: 'characters', name: 'Farmer Kate', isActive: true, isVisible: true, data: { id: 9, projectMarkerId: 109, isMovable: true } },
  { id: 'other-radio', type: 'models', name: 'Other radio', isActive: true, isVisible: true, data: { id: 6, projectMarkerId: 106 } },
];
function scene() {
  return {
    projectId: 7,
    ready: true,
    allowed: true,
    busy: false,
    markers: clone(markers),
    layers: new Set(['models', 'characters']),
    settledCharacters: new Set(['kate']),
    controlledCharacterId: 9,
    target: { markerId: 'radio', type: 'models', id: 5 },
    groups: [],
    sensorMembers: [],
    position: () => ({ x: 0, y: 0, z: 0 }),
    counts: () => ({}),
  };
}
function playerFixture() {
  let currentScene = scene();
  let latest, plays = 0, pauses = 0;
  let read = async query => response(query);
  let play = async () => { media.paused = false; plays++; };
  const requests = [];
  const media = {
    src: '',
    currentTime: 0,
    paused: true,
    play: () => play(),
    pause() { pauses++; this.paused = true; },
    load() { this.currentTime = 0; },
    removeAttribute() { this.src = ''; },
  };
  const player = new runtime.SceneMultimediaPlayer({
    read: (query, signal) => { requests.push({ query, signal }); return read(query, signal); },
    media: () => media,
    scene: () => currentScene,
    update: (state, busy, error) => { latest = { state, busy, error }; },
  });
  return {
    player,
    media,
    requests,
    get latest() { return latest; },
    get plays() { return plays; },
    get pauses() { return pauses; },
    setRead(value) { read = value; },
    setPlay(value) { play = value; },
    setScene(value) { currentScene = value; },
  };
}

async function checkReadBoundary() {
  let accessible = true, ownSource = true, owner = true, hasMarker = true, hasAlbum = true, rank = 50;
  const queries = [];
  const db = {
    select: fields => chain(fields),
    selectDistinct: fields => chain(fields),
    async execute(value) {
      const query = dialect.sqlToQuery(value);
      queries.push({ table: 'raw', ...query });
      assert(query.params.includes('owner'));
      if (!query.sql.includes('ranked')) assert(query.sql.includes('is_active = true'), 'Disabled source records are unavailable');
      return { rows: query.sql.includes('ranked') ? [{ position: rank }] : ownSource ? [{ id: 5 }] : [] };
    },
  };
  function chain(fields) {
    const record = { fields, joins: [], offset: 0 };
    const builder = {
      from(table) { record.table = orm.getTableName(table); return this; },
      innerJoin(table, condition) { record.joins.push({ table: orm.getTableName(table), ...dialect.sqlToQuery(condition) }); return this; },
      where(condition) { Object.assign(record, dialect.sqlToQuery(condition)); return this; },
      limit(value) { record.limit = value; return this; },
      offset(value) { record.offset = value; return this; },
      orderBy() { return this; },
      then(resolve, reject) {
        queries.push(record);
        let rows;
        if (record.table === 'project_threed_markers') rows = !hasMarker ? [] : [{ markerType: record.params.includes('kate') ? 'characters' : 'models', sourceAssetId: record.params.includes('kate') ? 9 : 5, threedId: 3, data: { isMovable: true } }];
        else if (record.table === 'threed_multimedia_albums') rows = hasAlbum ? [{ id: 28, title: 'TRADE', artist: 'Example', userId: 'owner', coverArt: '/cover.png', metadata: { secret: 'never serialized' } }] : [];
        else if (record.table === 'multimedia_tracks') rows = [{ ...track(record.offset ? 71 : 21), userId: 'owner', metadata: { secret: true }, lyrics: 'not selected' }];
        else throw Error('Unexpected table: ' + record.table);
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return builder;
  }
  const reader = load(root + 'multimedia/scene-multimedia-read.ts', {
    '@/libraries/db/client': { db },
    '@/libraries/services/project/read-access': { readableProject: async (id, viewer) => accessible ? { id, userId: 'owner' } : null },
    '@/libraries/schema/project': schema,
    '@/libraries/schema/threed': schema,
    '@/libraries/schema/multimedia': schema,
    '@/libraries/schema/threed/album-associations': schema,
  });
  const query = { projectId: 7, markerId: 'radio', actorMarkerId: 'kate', albumId: 28, trackId: null, offset: 0 };
  let result = await reader.readSceneMultimedia(query, 'guest');
  assert.equal(result.tracks[0].id, 21);
  assert.deepEqual(Object.keys(result.albums[0]).sort(), ['artist', 'coverArt', 'id', 'title']);
  assert.deepEqual(Object.keys(result.tracks[0]).sort(), ['albumId', 'duration', 'fileType', 'fileUrl', 'id', 'title', 'trackNumber']);
  const albumQuery = queries.find(query => query.table === 'threed_multimedia_albums');
  assert(albumQuery.params.includes('published') && albumQuery.params.includes(true), 'Visitors require public/published Albums');
  assert(albumQuery.params.includes('model') && albumQuery.params.includes('5'), 'Saved source identity scopes the relationship');
  assert(albumQuery.joins.some(join => join.table === 'project_assets' && join.params.includes('multimedia_albums') && join.params.includes(7) && join.params.includes(true)));
  for (const name of ['project_multimedia', 'multimedia']) assert(albumQuery.joins.some(join => join.table === name && join.params.includes('owner') && join.params.includes(true)));
  const markerQuery = queries.find(query => query.table === 'project_threed_markers');
  assert(markerQuery.params.includes('owner') && markerQuery.params.includes(7) && markerQuery.params.includes('radio'));
  assert(markerQuery.joins.some(join => join.table === 'project_threed' && join.params.includes('owner') && join.params.includes(true)));
  assert(markerQuery.joins.some(join => join.table === 'project_assets' && join.params.includes('threed') && join.params.includes('threed_models')));
  const tracksQuery = queries.find(query => query.table === 'multimedia_tracks');
  assert(tracksQuery.params.includes(28) && tracksQuery.params.includes('owner') && tracksQuery.params.includes('active'));
  queries.length = 0;
  result = await reader.readSceneMultimedia({ ...query, trackId: 71 }, 'owner');
  assert.equal(result.offset, 50);
  assert.equal(result.tracks[0].id, 71);
  assert(!queries.find(query => query.table === 'threed_multimedia_albums').params.includes('published'), 'Owner can see assigned draft Albums');
  accessible = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  accessible = true; hasMarker = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  hasMarker = true; ownSource = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  ownSource = true; hasAlbum = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  hasAlbum = true; rank = NaN;
  await assert.rejects(reader.readSceneMultimedia({ ...query, trackId: 71 }), error => error.status === 404);
  const api = load('src/app/api/project/multimedia-playback/route.ts', {
    '@/libraries/auth': { auth: async () => null },
    '@/libraries/services/threed/multimedia/scene-multimedia-read': reader,
  });
  assert.equal((await api.GET(new Request('https://app.invalid/api?projectId=-1&markerId=radio'))).status, 400);
  accessible = false;
  const denied = await api.GET(new Request('https://app.invalid/api?projectId=7&markerId=radio'));
  assert.equal(denied.status, 404);
  assert.equal(denied.headers.get('Cache-Control'), 'private, no-store');
  console.log('PASS Scene Multimedia reads: exact saved source/Project joins, owner/public gates, active Tracks, rank paging, safe DTOs and denied forged/unavailable references (mock DB).');
}

async function checkPlayer() {
  const fixture = playerFixture();
  await fixture.player.execute(baseCommand, 'play');
  assert.equal(fixture.latest.state.track.id, 21);
  assert(fixture.latest.state.playing);
  await fixture.player.execute({ ...baseCommand, action: 'pauseMultimedia' }, 'pause');
  assert(fixture.media.paused);
  await fixture.player.execute(baseCommand, 'resume');
  fixture.media.currentTime = 12;
  await fixture.player.execute({ ...baseCommand, action: 'rewindMultimedia' }, 'rewind');
  assert.equal(fixture.media.currentTime, 0);
  assert(!fixture.media.paused);
  await fixture.player.execute({ ...baseCommand, action: 'nextTrack' }, 'next');
  assert.equal(fixture.latest.state.track.id, 22);
  await fixture.player.execute({ ...baseCommand, action: 'stopMultimedia' }, 'stop');
  assert.equal(fixture.media.currentTime, 0);
  assert(fixture.media.paused);
  await fixture.player.execute(baseCommand, 'replay');
  const before = fixture.pauses;
  await assert.rejects(fixture.player.execute({ ...baseCommand, markerId: 'other-radio', action: 'stopMultimedia' }, 'wrong-target'));
  assert.equal(fixture.pauses, before, 'A differently bound target cannot pause this player');
  fixture.setRead(async query => query.offset === 50 ? response(query, [track(71)]) : response(query, [track(21), track(22)], true));
  await fixture.player.execute({ ...baseCommand, trackId: 22 }, 'last-on-page');
  await fixture.player.execute({ ...baseCommand, action: 'nextTrack' }, 'next-page');
  assert.equal(fixture.latest.state.track.id, 71);
  assert.equal(fixture.latest.state.offset, 50);
  const notAllowed = new Error('Autoplay blocked'); notAllowed.name = 'NotAllowedError';
  fixture.setPlay(async () => { throw notAllowed; });
  await assert.rejects(fixture.player.execute(baseCommand, 'blocked'));
  assert.match(fixture.latest.error, /Click Play/);
  assert(!fixture.latest.state.playing);
  const stale = playerFixture();
  let resolve;
  stale.setRead(query => new Promise(done => { resolve = () => done(response(query)); }));
  const pending = stale.player.execute(baseCommand, 'stale');
  stale.player.clear(); resolve();
  await assert.rejects(pending);
  assert.equal(stale.plays, 0, 'A late read after clear cannot start audio');
  const cancelled = playerFixture();
  const controller = new AbortController();
  const operation = cancelled.player.execute(baseCommand, 'cancelled', controller.signal);
  controller.abort(); await assert.rejects(operation);
  assert.equal(cancelled.plays, 0);
  const layers = scene(); layers.layers.delete('models');
  fixture.setScene(layers); fixture.player.checkScene();
  assert.equal(fixture.latest.state, null);
  const actor = playerFixture();
  const away = scene(); away.position = marker => ({ x: marker === 'radio' ? 100 : 0, y: 0, z: 0 });
  actor.setScene(away);
  await assert.rejects(actor.player.execute({ ...baseCommand, actorMarkerId: 'kate' }, 'far'), /range/);
  const noControl = scene(); noControl.controlledCharacterId = 99; actor.setScene(noControl);
  await assert.rejects(actor.player.execute({ ...baseCommand, actorMarkerId: 'kate' }, 'wrong-actor'), /Take Control/);
  console.log('PASS Scene player: actual Play/Pause/Stop/Rewind/Next, page transition, exact target binding, autoplay denial, abort/late replies, hidden Layers and controlled-Character/range gates (mock media).');
}

async function checkCollision() {
  const fixture = playerFixture();
  fixture.player.armCollision({ ...baseCommand, actorMarkerId: 'kate' }, 'radio');
  const event = {
    version: 1,
    projectId: 7,
    sceneEventId: 'entry-1',
    kind: 'sensor-enter',
    source: { moduleType: 'models', assetId: 5 },
    sourceMarkerId: 105,
    target: { moduleType: 'characters', assetId: 9 },
    sensor: { ownerMarkerId: 105, id: 'radio-trigger' },
    occurredAt: new Date().toISOString(),
  };
  fixture.player.observe(event);
  fixture.player.observe(event);
  fixture.player.observe({ ...event, sceneEventId: 'duplicate-entry' });
  await flush();
  assert.equal(fixture.plays, 1, 'Duplicate/occupied sensor entries dispatch once');
  fixture.player.observe({ ...event, projectId: 99, sceneEventId: 'wrong-project' });
  await flush(); assert.equal(fixture.plays, 1);
  fixture.player.clear();
  assert(!fixture.player.isCollisionArmed('radio'));
  const duplicate = playerFixture();
  const doubled = scene(); doubled.markers.push({ ...doubled.markers[1], id: 'other-kate' }); duplicate.setScene(doubled);
  assert.throws(() => duplicate.player.armCollision({ ...baseCommand, actorMarkerId: 'kate' }, 'radio'), /one|Control/);
  console.log('PASS collision boundary: exact Project/instance/actor, duplicate and occupancy suppression, ambiguous instances rejected and Project-session clear (synthetic accepted physics events).');
}

function checkSimulation() {
  const definition = {
    version: 1,
    steps: [
      { id: 'play', action: 'playMultimedia', actorMarkerId: 'kate', targetMarkerId: 'radio', timeoutMs: 1000, onFailure: 'stop', multimedia: { albumId: 28, trackId: 21 } },
      { id: 'pause', action: 'pauseMultimedia', actorMarkerId: 'kate', targetMarkerId: 'radio', timeoutMs: 1000, onFailure: 'stop', multimedia: { albumId: 28 } },
    ],
    observations: [],
  };
  const simulation = { id: 12, revision: 1, name: 'Radio', projectId: 7, threedId: 3, isActive: true, definition };
  const captured = mediaSimulation.captureMultimediaSimulation(simulation, simulation);
  definition.steps[0].multimedia.albumId = 99;
  assert.equal(captured.definition.steps[0].multimedia.albumId, 28, 'Capture owns an independent command payload');
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[0], multimedia: { albumId: 0 } }] }));
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[0], multimedia: { albumId: 28, url: 'arbitrary' } }] }));
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[1], multimedia: { albumId: 28, trackId: 21 } }] }));
  assert.throws(() => mediaSimulation.captureMultimediaSimulation({ ...captured, definition: { ...captured.definition, steps: [...captured.definition.steps, { ...captured.definition.steps[0], id: 'kick', action: 'kickBall', multimedia: undefined }] } }, simulation));
  let receive, serial = 0;
  const dispatched = [], cancelled = [], timers = new Map(), updates = [];
  const runner = new simulationRunner.SoccerSimulationRunner({
    capture: mediaSimulation.captureMultimediaSimulation,
    requestId: () => `request-${++serial}`,
    now: () => 1000 + serial,
    schedule: callback => { timers.set(serial, callback); return serial; },
    clear: id => timers.delete(id),
    subscribe: callback => { receive = callback; return () => { receive = null; }; },
    validate: () => null,
    dispatch: (step, requestId) => dispatched.push({ step, requestId }),
    cancel: (step, requestId) => cancelled.push({ step, requestId }),
    update: state => updates.push(clone(state)),
  });
  runner.start(captured, 'run');
  const first = dispatched[0];
  receive({ requestId: first.requestId, projectId: 99, actorMarkerId: 'kate', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched.length, 1);
  receive({ requestId: first.requestId, projectId: 7, actorMarkerId: 'other', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched.length, 1);
  receive({ requestId: first.requestId, projectId: 7, actorMarkerId: 'kate', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched[1].step.action, 'pauseMultimedia');
  runner.stop();
  assert.equal(cancelled.length, 1);
  assert.equal(updates.at(-1).phase, 'cancelled');
  assert.equal(timers.size, 0);
  assert.equal(receive, null);
  assert.equal(mediaSimulation.multimediaSimulationReadiness(captured, scene()), null);
  const participants = mediaSimulation.multimediaSimulationParticipants(captured, scene());
  assert.equal(participants.target.markerId, 'radio');
  assert.equal(participants.target.type, 'models');
  console.log('PASS Multimedia Simulation: strict backwards-compatible payloads, immutable captures, real correlated runner dispatch/Stop/cleanup, wrong Project/actor replies rejected and exact Radio participants.');
}

(async () => {
  assert.equal(contract.sceneMultimediaQuery(new URLSearchParams('projectId=7&markerId=radio')).projectId, 7);
  assert.throws(() => contract.sceneMultimediaQuery(new URLSearchParams('projectId=0&markerId=radio')));
  assert.throws(() => contract.sceneMultimediaQuery(new URLSearchParams('projectId=7&markerId=radio&offset=-1')));
  assert.throws(() => contract.sceneMultimediaCommandSchema.parse({ ...baseCommand, url: 'arbitrary' }));
  await checkReadBoundary();
  await checkPlayer();
  await checkCollision();
  checkSimulation();
  assert.equal(pg.getTableConfig(schema.threedMultimediaAlbums).columns.find(column => column.name === 'entity_id').getSQLType(), 'text');
  const followUp = fs.readFileSync('docs/developers/sql/threed-albums-entity-identity.sql', 'utf8');
  assert(followUp.includes('USING entity_id::text') && followUp.includes('entity_id = OLD.id::text'));
  assert(!/DELETE FROM threed_multimedia_albums|DROP TABLE|TRUNCATE/i.test(followUp));
  console.log('PASS entity identity proposal: text schema and kind-specific ID validation; preservation/cleanup SQL inspected only, never executed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
