// The real POST handler and Drizzle copy queries run against an in-memory transaction.
// PostgreSQL lock scheduling, Blob storage and authentication are external boundaries.
require('tsx/cjs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { getTableColumns, getTableName } = require('drizzle-orm');
const { drizzle } = require('drizzle-orm/pg-proxy');
const schema = require('@/libraries/schema');
const groups = require('@/libraries/schema/threed/groups');
const { newDesign } = require('@/libraries/services/threed/design/document');

async function main() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('pragma foreign_keys = on');
  const tables = [
    'project', 'threed', 'projectThreed', 'projectMultimedia', 'projectTraffic', 'multimedia', 'traffic',
    'threedModels', 'threedLayers', 'threedWeatherLogs', 'trafficChpCases',
    'projectAssets', 'projectThreedMarkers', 'threedGroups', 'threedGroupDesignMembers', 'threedGroupModelMembers',
    'projectTerrainPlacements', 'threedTerrains', 'threedTerrainRevisions', 'threedGroundMaps',
    'threedDesigns', 'threedScenarios', 'threedSimulations', 'threedSimulationResults',
    'multimediaMedia', 'multimediaMediaProjects', 'multimediaLyrics', 'multimediaLyricsProjects', 'multimediaAlbums', 'threedMultimediaAlbums',
  ];
  for (const key of tables) {
    const table = schema[key] ?? groups[key] ?? require('@/libraries/schema/threed/album-associations')[key];
    const tableName = getTableName(table);
    const columns = Object.values(getTableColumns(table)).map(column => {
      const numericId = column.name === 'id' && column.primary && /serial|integer/i.test(column.getSQLType());
      let relation = '';
      if (column.name === 'source_project_id') relation = ' references project(id) on delete set null';
      if (column.name === 'project_id') relation = ' references project(id) on delete ' + (tableName === 'threed_designs' ? 'set null' : 'cascade');
      if (column.name === 'threed_id') relation = ' references threed(id) on delete cascade';
      return '"' + column.name + '" ' + (numericId ? 'integer primary key' : '') + relation;
    });
    sql.exec('create table "' + getTableName(table) + '" (' + columns.join(',') + ')');
  }
  sql.exec(`create unique index receipts on project(user_id, duplicate_request_key);
    create unique index projection on threed_designs(user_id,create_key);
    create trigger placement_id after insert on project_terrain_placements when new.id is null
    begin update project_terrain_placements set id=lower(hex(randomblob(16))) where rowid=new.rowid; end;`);
  let actor = 'owner';
  let injectFailure = false;
  let interruptBeforeCommit = false;
  let loseCommitReceipt = false;
  const driver = drizzle(async (statement, parameters) => {
    const query = sql.prepare(statement.replace(/ for (share|update)$/i, '').replace(/\bdefault\b/gi, 'NULL'));
    query.setReturnArrays(true);
    const values = Object.fromEntries(parameters.map((v, i) => ['$' + (i + 1), typeof v === 'boolean' ? Number(v) : v]));
    const columns = query.columns();
    const rows = query.all(values).map(row => row.map((value, i) =>
      value !== null && columns[i].name.startsWith('is_') ? Boolean(value) : value));
    if (injectFailure && statement.startsWith('insert into "threed_designs"')) throw Error('fixture projection failure');
    return { rows };
  });
  driver.transaction = async (operation, config) => {
    assert.equal(config.isolationLevel, 'repeatable read');
    sql.exec('BEGIN');
    let result;
    try {
      result = await operation(driver);
      if (interruptBeforeCommit) {
        interruptBeforeCommit = false;
        throw Object.assign(new Error('fixture serialization conflict'), { code: '40001' });
      }
      sql.exec('COMMIT');
    } catch (error) {
      sql.exec('ROLLBACK');
      if (!injectFailure && !error.status && !error.code && error.constructor.name !== 'ProjectConfigurationConflict') console.error(error);
      throw error;
    }
    if (loseCommitReceipt) {
      loseCommitReceipt = false;
      throw new Error('fixture connection lost after commit');
    }
    return result;
  };
  function mock(specifier, exports) {
    const id = require.resolve(specifier);
    require.cache[id] = { id, loaded: true, exports };
  }
  mock('@/libraries/db/client', { db: driver });
  mock('@/libraries/auth', { auth: async () => actor ? { user: { id: actor } } : null });
  // Next supplies the server-only import marker in the deployed route.
  const NodeModule = require('node:module');
  const load = NodeModule._load;
  let POST;
  try {
    NodeModule._load = function(specifier, ...rest) {
      return specifier === 'server-only' ? {} : load.call(this, specifier, ...rest);
    };
    ({ POST } = require('@/app/api/project/duplicate/route'));
  } finally {
    NodeModule._load = load;
  }
  const send = value => POST(new Request('http://fixture/api/project/duplicate', { method: 'POST', body: JSON.stringify(value) }));
  const row = (query, ...params) => sql.prepare(query).get(...params);
  function seed(table, object) {
    const keys = Object.keys(object);
    const values = Object.values(object).map(value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
    sql.prepare('insert into ' + table + '(' + keys.join(',') + ') values (' + keys.map(() => '?').join(',') + ')').run(...values);
  }
  const base = newDesign();
  base.nodes = [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 3, z: 0 }, { id: 'c', x: 3, z: 3 }];
  base.walls = [{ id: 'wall', start: 'a', end: 'b', height: 2.4, thickness: 0.1, elevation: 0, levelId: 'ground' }];
  const sourceConfig = { measurementUnits: 'metric', threeDArchitecture: { version: 1, document: base } };
  seed('project', { id: 18, name: 'House', user_id: 'owner', is_public: 1, is_active: 1, config: sourceConfig, meters_per_scene_unit: '1', metadata: { featured_image: '/house.png' } });
  seed('threed', { id: 3, user_id: 'owner', project_id: 18, name: 'House module', is_active: 1 });
  seed('project_threed', { project_id: 18, user_id: 'owner', threed_id: 3, is_active: 1 });
  seed('threed_models', { id: 52, user_id: 'library-owner', is_active: 1, is_public: 1, is_library_item: 1, status: 'active' });
  seed('project_assets', { project_id: 18, user_id: 'owner', module_id: 3, module_type: 'threed', asset_type: 'threed_models', asset_id: 52, is_active: 1 });
  seed('project_threed_markers', { id: 74, marker_id: 'house-model', project_id: 18, user_id: 'owner', threed_id: 3, marker_type: 'models', source_asset_id: 52, position_x: '1.000', position_y: '0.000', position_z: '0.000', metadata: {}, data: {} });
  seed('threed_models', { id: 53, user_id: 'library-owner', is_active: 1, is_public: 1, is_library_item: 1, status: 'active' });
  seed('project_threed_markers', { id: 75, marker_id: 'legacy-marker-only', project_id: 18, user_id: 'owner', threed_id: 3, marker_type: 'models', source_asset_id: 53, metadata: {}, data: {} });
  seed('threed_ground_maps', { id: 2, project_id: 18, user_id: 'owner', file_path: 'fixture-ground.png' });
  seed('threed_terrains', { id: 4, name: 'Site', user_id: 'owner' });
  seed('threed_terrain_revisions', { terrain_id: 4, revision: 2 });
  seed('project_assets', { project_id: 18, user_id: 'owner', module_id: 3, module_type: 'threed', asset_type: 'threed_terrains', asset_id: 4, is_active: 1 });
  const placementId = randomUUID();
  seed('project_terrain_placements', { id: placementId, user_id: 'owner', project_id: 18, threed_id: 3, terrain_id: 4, terrain_revision: 2, center_x_m: 1, center_z_m: 2, rotation_y_deg: 0, scale: 1 });
  seed('multimedia_media', { id: 8, user_id: 'owner' });
  seed('multimedia_media_projects', { project_id: 18, media_id: 8 });
  seed('multimedia', { id: 5, user_id: 'owner', name: 'Reference library' });
  seed('project_multimedia', { project_id: 18, multimedia_id: 5, user_id: 'owner', is_active: 0 });
  for (const module_id of [5, 99]) {
    seed('project_assets', { project_id: 18, user_id: 'owner', module_type: 'multimedia', module_id, asset_type: 'multimedia_media', asset_id: 8, is_active: 1 });
  }
  seed('traffic', { id: 6, user_id: 'owner' });
  seed('project_traffic', { project_id: 18, traffic_id: 6, user_id: 'owner', is_active: 1 });
  seed('traffic_chp_cases', { id: 101, user_id: 'traffic-owner', is_active: 1, is_public: 1 });
  seed('traffic_chp_cases', { id: 102, user_id: 'owner', is_active: 0, is_public: 0 });
  for (const [asset_id, is_active] of [[101, 1], [102, 0]]) {
    seed('project_assets', { project_id: 18, user_id: 'owner', module_type: 'traffic', module_id: 6, asset_type: 'traffic_chp_cases', asset_id, is_active });
  }
  seed('threed_layers', { id: 27, user_id: 'owner' });
  seed('threed_weather_logs', { id: 44, user_id: 'owner' });
  for (const [asset_type, asset_id] of [['threed_layers', 27], ['threed_weather_logs', 44], ['threed_markers', 15]]) {
    seed('project_assets', { project_id: 18, user_id: 'owner', module_type: 'threed', module_id: 3, asset_type, asset_id, is_active: 0 });
  }
  seed('multimedia_lyrics', { id: 20, user_id: 'owner' });
  seed('multimedia_lyrics_projects', { project_id: 18, lyrics_id: 20 });
  seed('multimedia_albums', { id: 3, user_id: 'owner' });
  seed('threed_scenarios', { id: 2, project_id: 18, threed_id: 3, name: 'Study', user_id: 'owner' });
  seed('threed_multimedia_albums', { album_id: 3, entity_id: '2', module_type: 'scenario', sort_order: 1 });
  const definition = { version: 1, steps: [], observations: [] };
  seed('threed_simulations', { id: 3, project_id: 18, threed_id: 3, user_id: 'owner', definition });
  seed('threed_simulation_results', { project_id: 18, user_id: 'owner' });
  const edited = structuredClone(base);
  edited.nodes[1].x = 6;
  edited.version = 13;
  edited.stairs = [{ id: 'stairs', levelId: 'ground', anchor: 'c', direction: 90, startY: 0, endY: 1, width: 1, stepHeight: 0.2, stepLength: 0.3 }];
  const groupId = randomUUID();
  const input = {
    sourceProjectId: 18,
    name: "Marty's Project 18 v001",
    requestKey: randomUUID(),
    snapshot: {
      architecture: { version: 1, document: edited },
      markers: [{ markerId: 'house-model', moduleType: 'models', assetId: 52, name: 'House', label: 'House', icon: 'box', color: '#fff', position: { x: 6, y: 0, z: 0 }, isActive: true, isVisible: true, metadata: {}, data: {} }],
      viewState: { version: 1, savedAt: new Date().toISOString(), viewMode: 'design', panelHeight: 50, cameraMode: 'orbit', multimedia: { open: true, albumId: null, trackId: null, reference: { mediaId: 8 } } },
      groups: [{ id: groupId, name: 'Entrance', entityIds: ['wall', 'stairs'], markerIds: ['house-model'] }],
      terrain: { id: placementId, threedId: 3, terrainId: 4, terrainRevision: 2, centerXM: 9, centerZM: 2, rotationYDeg: 0, scale: 1 },
      expectedConfiguration: { savedAt: null, measurementUnits: 'metric' },
    },
  };
  interruptBeforeCommit = true;
  const res = await send(input);
  const receipt = await res.json();
  assert.equal(res.status, 201, JSON.stringify(receipt));
  const id = receipt.data.projectId;
  assert.notEqual(id, 18);
  const copy = row('select * from project where id=?', id);
  assert.equal(copy.name, input.name);
  assert.equal(copy.is_public, 0);
  assert.equal(copy.source_project_id, 18);
  const settings = JSON.parse(copy.config);
  assert.equal(settings.threeDArchitecture.document.nodes[1].x, 6);
  assert.equal(settings.threeDArchitecture.document.stairs.length, 1);
  assert.equal(settings.threeDViewState.multimedia.reference.mediaId, 8);
  assert.equal(row('select media_id from multimedia_media_projects where project_id=?', id).media_id, 8);
  assert.equal(row('select is_active from project_multimedia where project_id=?', id).is_active, 0);
  assert.equal(row('select traffic_id from project_traffic where project_id=?', id).traffic_id, 6);
  assert.equal(row("select is_active from project_assets where project_id=? and asset_type='traffic_chp_cases' and asset_id=101", id).is_active, 1);
  assert.equal(row("select is_active from project_assets where project_id=? and asset_type='traffic_chp_cases' and asset_id=102", id).is_active, 0);
  assert.equal(row("select count(*) as n from project_assets where project_id=? and asset_type in ('threed_layers','threed_weather_logs')", id).n, 2);
  assert.equal(row("select count(*) as n from project_assets where project_id=? and asset_type='threed_markers'", id).n, 0);
  assert.equal(row("select count(*) as n from project_assets where project_id=? and module_type='multimedia' and module_id=5", id).n, 1);
  assert.equal(row("select count(*) as n from project_assets where project_id=? and module_type='multimedia' and module_id=99", id).n, 0);
  assert.equal(row("select source_asset_id from project_threed_markers where project_id=? and marker_id='legacy-marker-only'", id).source_asset_id, 53);
  assert.equal(row('select lyrics_id from multimedia_lyrics_projects where project_id=?', id).lyrics_id, 20);
  const scenario = row('select id from threed_scenarios where project_id=?', id);
  assert.notEqual(scenario.id, 2);
  assert.equal(row("select album_id from threed_multimedia_albums where entity_id=? and module_type='scenario'", String(scenario.id)).album_id, 3);
  assert.deepEqual(JSON.parse(row('select definition from threed_simulations where project_id=?', id).definition), definition);
  assert.equal(row('select count(*) as n from threed_group_design_members where project_id=?', id).n, 2);
  assert.equal(row('select marker_id from threed_group_model_members where project_id=?', id).marker_id, 'house-model');
  const marker = row("select * from project_threed_markers where project_id=? and marker_id='house-model'", id);
  assert.notEqual(marker.threed_id, 3);
  assert.notEqual(marker.id, 74);
  assert.equal(marker.source_asset_id, 52);
  assert.equal(Number(marker.position_x), 6);
  const terrain = row('select * from project_terrain_placements where project_id=?', id);
  assert.notEqual(terrain.id, placementId);
  assert.equal(terrain.terrain_revision, 2);
  assert.equal(terrain.center_x_m, 9);
  assert.equal(row('select file_path from threed_ground_maps where project_id=?', id).file_path, 'fixture-ground.png');
  assert.equal(row('select count(*) as n from threed_simulation_results where project_id=?', id).n, 0);
  assert.equal(JSON.parse(row('select document from threed_designs where project_id=?', id).document).nodes[1].x, 6);
  assert.deepEqual(JSON.parse(row('select config from project where id=18').config), sourceConfig);
  assert.equal(row('select position_x from project_threed_markers where id=74').position_x, '1.000');
  sql.prepare("update project set name='Later rename' where id=?").run(id);
  const replay = await send(input);
  assert.equal(replay.status, 200);
  assert.deepEqual((await replay.json()).data, receipt.data);
  assert.equal((await send({ ...input, name: 'Different' })).status, 409);
  const stale = structuredClone(input);
  stale.requestKey = randomUUID();
  stale.snapshot.expectedConfiguration.measurementUnits = 'imperial';
  assert.equal((await send(stale)).status, 409);
  // A foreign public asset can change access after its assignment. A version
  // must recheck availability, expose no catalog details and roll back cleanly.
  for (const [table, field, id] of [
    ['traffic_chp_cases', 'is_public', 101],
    ['traffic_chp_cases', 'is_active', 101],
    ['threed_models', 'is_library_item', 52],
    ['threed_models', 'is_public', 53],
  ]) {
    sql.prepare(`update ${table} set ${field}=0 where id=?`).run(id);
    const rejected = await send({ ...input, requestKey: randomUUID() });
    assert.equal(rejected.status, 409);
    assert.match((await rejected.json()).error, /^A source Project asset is unavailable for copying\./);
    sql.prepare(`update ${table} set ${field}=1 where id=?`).run(id);
  }
  sql.exec("update multimedia set user_id='other' where id=5");
  const inaccessibleModule = await send({ ...input, requestKey: randomUUID() });
  assert.equal(inaccessibleModule.status, 409);
  assert.match((await inaccessibleModule.json()).error, /source Project Module is unavailable/);
  sql.exec("update multimedia set user_id='owner' where id=5");
  injectFailure = true;
  assert.equal((await send({ ...input, requestKey: randomUUID() })).status, 500);
  injectFailure = false;
  assert.equal(row('select count(*) as n from project').n, 2);
  assert.equal(row('select count(*) as n from project_threed_markers').n, 4);
  actor = 'visitor';
  assert.equal((await send(input)).status, 404);
  actor = null;
  assert.equal((await send(input)).status, 401);
  actor = 'owner';
  seed('project', { id: 30, user_id: 'owner', config: { projectSetup: { viewMode: 'design' } } });
  const blankRequest = { sourceProjectId: 30, name: 'Blank copy', requestKey: randomUUID() };
  loseCommitReceipt = true;
  assert.equal((await send(blankRequest)).status, 500);
  const empty = await send(blankRequest);
  assert.equal(empty.status, 200);
  assert.equal(row('select count(*) as n from project where source_project_id=30').n, 1);
  const emptyId = (await empty.json()).data.projectId;
  assert.deepEqual(JSON.parse(row('select config from project where id=?', emptyId).config), { projectSetup: { viewMode: 'design' } });
  sql.exec('delete from project where id=18');
  assert.equal(row('select source_project_id from project where id=?', id).source_project_id, null);
  assert.equal(row('select name from threed where id=?', marker.threed_id).name, 'House module');
  assert.equal(row("select count(*) as n from project_threed_markers where project_id=? and marker_id='house-model'", id).n, 1);
  assert.equal(row('select file_path from threed_ground_maps where project_id=?', id).file_path, 'fixture-ground.png');
  sql.close();
  console.log('PASS: Project duplication POST, captured Design and Model, Group, pinned Terrain, Media, Ground Map, projection, source isolation, rollback, retry, access and setup-only copy (offline SQLite fixture).');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
