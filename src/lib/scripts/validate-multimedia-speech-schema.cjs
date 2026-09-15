const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const pg = require('drizzle-orm/pg-core');
const orm = require('drizzle-orm');
const dependencies = {
  'drizzle-orm': orm, 'drizzle-orm/pg-core': pg,
  '../auth': { user: pg.pgTable('user', { id: pg.text('id').primaryKey() }) },
  '../music': { musicTracks: pg.pgTable('music_tracks', { id: pg.serial('id').primaryKey() }) },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/schema/multimedia/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, require: name => { assert.ok(name in dependencies); return dependencies[name]; } });
const speech = pg.getTableConfig(exportsObject.multimediaSpeech);
const versions = pg.getTableConfig(exportsObject.multimediaSpeechVersions);
const dialect = new pg.PgDialect();
const sqlText = value => dialect.sqlToQuery(value).sql;
assert.equal(speech.name, 'multimedia_speech');
assert.equal(versions.name, 'multimedia_speech_versions');
assert.ok(speech.columns.find(c => c.name === 'user_id').notNull);
assert.equal(speech.columns.find(c => c.name === 'model').default, 's2.1-pro-free');
const accepted = speech.foreignKeys.find(key => key.getName() === 'multimedia_speech_accepted_version_fk').reference();
assert.deepEqual(Array.from(accepted.columns, c => c.name), ['id', 'accepted_version_number']);
assert.deepEqual(Array.from(accepted.foreignColumns, c => c.name), ['speech_id', 'version_number']);
assert.equal(accepted.foreignTable, exportsObject.multimediaSpeechVersions);
const parent = versions.foreignKeys.find(key => key.reference().columns[0].name === 'speech_id');
assert.equal(parent.onDelete, 'restrict');
const track = versions.foreignKeys.find(key => key.reference().columns[0].name === 'track_id');
assert.equal(track.onDelete, 'set null');
for (const pair of [['speech_id', 'version_number'], ['speech_id', 'request_id']]) {
  assert.ok(versions.uniqueConstraints.some(c => c.columns.map(c => c.name).join() === pair.join()));
}
const inFlight = versions.indexes.find(index => index.config.name === 'multimedia_speech_one_inflight_idx');
assert.equal(inFlight.config.unique, true);
assert.ok(sqlText(inFlight.config.where).includes("IN ('pending', 'generating')"));
const ready = versions.checks.find(check => check.name === 'multimedia_speech_version_ready_output');
for (const field of ['storage_key', 'file_size', 'file_name', 'mime_type', 'completed_at']) assert.ok(sqlText(ready.value).includes(field));
assert.ok(versions.checks.some(check => check.name === 'multimedia_speech_version_status_valid'));
console.log('PASS: Real Drizzle schema metadata, accepted-version composite FK, history protection, Track unlinking, request/version uniqueness, in-flight constraint and ready-output checks. No database connection.');
