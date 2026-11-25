// Execute the removal service with real Drizzle queries and an isolated transaction.
require('tsx/cjs');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { drizzle } = require('drizzle-orm/pg-proxy');
const { removeProjectGardenPlacement, BedHasProjectPlantings } = require('@/libraries/services/threed/beds/remove-project-garden-placement');

async function main() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    create table project (id integer primary key, user_id text);
    create table threed_beds (id integer primary key, user_id text);
    create table threed_plantings (id integer primary key, user_id text, bed_id integer, is_active integer, updated_at text);
    create table project_threed_markers (id integer primary key, user_id text, project_id integer, threed_id integer, marker_type text, source_asset_id integer, metadata text, data text);
    create table project_assets (id integer primary key, user_id text, project_id integer, module_id integer, module_type text, asset_type text, asset_id integer, is_active integer);
    create table threed_tasks (bed_id integer);
    create table threed_farmbots (bed_id integer);
    create table threed_watering_schedules (bed_id integer);
    insert into project values (18, 'owner'), (19, 'owner');
  `);
  const locks = [];
  const tx = drizzle(async (statement, parameters) => {
    if (statement.endsWith(' for update')) locks.push(statement.match(/from "([^"]+)"/)[1]);
    const query = db.prepare(statement.replace(/ for update$/, '')
      .replace(/("project_threed_markers"\."data") \? 'bedId'/, "json_type($1, '$.bedId') is not null")
      .replace(/("project_threed_markers"\."data"->>'bedId')/, 'cast($1 as text)')
      .replace(/("threed_plantings"\."bed_id")::text/, 'cast($1 as text)'));
    query.setReturnArrays(true);
    const bindings = Object.fromEntries(parameters.map((value, i) => ['$' + (i + 1), typeof value === 'boolean' ? Number(value) : value]));
    return { rows: query.all(bindings) };
  });
  const run = (query, ...args) => db.prepare(query).run(...args);
  const count = (table, where = '1=1') => db.prepare('select count(*) as n from ' + table + ' where ' + where).get().n;
  function placement(type, source, project, { active = 1, marker = true, data = {} } = {}) {
    const assignment = run("insert into project_assets values(null, 'owner', ?, ?, 'threed', ?, ?, ?)", project, project, 'threed_' + type, source, active);
    if (!marker) return null;
    const result = run("insert into project_threed_markers values(null, 'owner', ?, ?, ?, ?, ?, ?)", project, project, type, source,
      JSON.stringify({ placementKind: 'dashboard-created' }), JSON.stringify(data));
    return { id: result.lastInsertRowid, projectId: project, threedId: project, sourceAssetId: source, assignment: assignment.lastInsertRowid };
  }
  async function unlink(type, marker, owner = 'owner') {
    db.exec('begin');
    try {
      const result = await removeProjectGardenPlacement(tx, owner, marker, type);
      db.exec('commit');
      return result;
    } catch (error) {
      db.exec('rollback');
      throw error;
    }
  }
  run("insert into threed_beds values(1, 'owner')");
  const sourceBed = placement('beds', 1, 18);
  const copyBed = placement('beds', 1, 19);
  assert.equal(await unlink('beds', sourceBed, 'other'), null);
  locks.length = 0;
  assert.equal((await unlink('beds', sourceBed)).sourceDeleted, false);
  assert.deepEqual(locks, ['project', 'threed_beds']);
  assert.equal(count('project_threed_markers', 'project_id=19'), 1);
  assert.equal((await unlink('beds', copyBed)).sourceDeleted, true);
  assert.equal(count('threed_beds'), 0);

  run("insert into threed_beds values(8, 'owner')");
  const repeat = placement('beds', 8, 19);
  const sibling = run("insert into project_threed_markers select null, user_id, project_id, threed_id, marker_type, source_asset_id, metadata, data from project_threed_markers where id=?", repeat.id);
  assert.equal((await unlink('beds', repeat)).sourceDeleted, false);
  assert.equal(count('project_assets', 'id=' + repeat.assignment), 1);
  assert.equal((await unlink('beds', { ...repeat, id: sibling.lastInsertRowid })).sourceDeleted, true);

  run("insert into threed_plantings values(1, 'owner', null, 1, null)");
  const original = placement('plantings', 1, 18);
  const copy = placement('plantings', 1, 19, { active: 0 });
  run('delete from project_threed_markers where id=?', copy.id);
  assert.equal((await unlink('plantings', original)).id, 1);
  assert.equal(count('threed_plantings', 'is_active=1'), 1);
  run('delete from project_assets where id=?', copy.assignment);
  const last = placement('plantings', 1, 19);
  assert.equal((await unlink('plantings', last)).id, 1);
  assert.equal(count('threed_plantings', 'is_active=0'), 1);

  run("insert into threed_beds values(2, 'owner'), (3, 'owner')");
  const originalOccupied = placement('beds', 2, 18);
  const copiedOccupied = placement('beds', 2, 19);
  run("insert into threed_plantings values(2, 'owner', 3, 1, null)");
  const plant = placement('plantings', 2, 18, { data: { bedId: 2 } });
  await assert.rejects(unlink('beds', originalOccupied), BedHasProjectPlantings);
  assert.equal(count('project_assets', 'id=' + originalOccupied.assignment), 1);
  assert.equal(count('project_threed_markers', 'id=' + originalOccupied.id), 1);
  assert.equal((await unlink('beds', copiedOccupied)).sourceDeleted, false);
  await assert.rejects(unlink('beds', originalOccupied), BedHasProjectPlantings);
  assert.equal((await unlink('plantings', plant)).id, 2);
  assert.equal((await unlink('beds', originalOccupied)).sourceDeleted, true);

  for (const [id, table] of [[4, 'threed_plantings'], [5, 'threed_tasks'], [6, 'threed_farmbots'], [7, 'threed_watering_schedules']]) {
    run("insert into threed_beds values(?, 'owner')", id);
    if (table === 'threed_plantings') run("insert into threed_plantings values(?, 'owner', ?, 0, null)", id, id);
    else run('insert into ' + table + '(bed_id) values(?)', id);
    const item = placement('beds', id, 18);
    assert.equal((await unlink('beds', item)).sourceDeleted, false, table);
    assert.equal(count('threed_beds', 'id=' + id), 1);
    assert.equal(count(table, 'bed_id=' + id), 1);
  }
  db.close();
  console.log('Bed/Planting Project removal passed: shared catalog, owner locks, inactive assignments, rollback, retained dependents and last-reference cleanup.');
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
