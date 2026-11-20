import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getTableName, sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { listAssemblies, readAssembly, saveAssembly, deleteAssembly, assemblyListQuery, AssemblyWorkspaceError, assemblyId, isMissingAssemblyColumn, updateAssemblyList } from '../services/threed/models/assembly-workspace-server';
import { AssemblyContractError } from '../services/threed/models/assembly-group-core';
import { threedAssembly } from '../schema/threed';
import type { db } from '../db/client';

const id = '05b3b80c-0ed3-4123-8bc0-bf388e45cbef';
const owner = 'owner-fixture';
const definition = {
  formatVersion: 1,
  id,
  ownerId: owner,
  name: 'FarmBot Assembly',
  revision: 1,
  components: ['left', 'right'].map((key, index) => ({
    id: key,
    modelId: 12,
    label: key,
    transform: {
      position: { x: index, y: 2, z: 3 },
      rotation: { x: 0, y: 0.5, z: 0 },
      scale: 1,
    },
  })),
};
const dialect = new PgDialect();
function fixture(reads: (unknown[] | Error)[], options: { conflict?: boolean; failComponents?: boolean; failOrder?: boolean } = {}) {
  const writes: Array<{ table: string; action: string; values: any }> = [];
  const predicates: Array<{ sql: string; params: unknown[] }> = [];
  const locks: string[] = [];
  const ordering: string[][] = [];
  const rankUpdates: Array<{ sql: string; params: unknown[] }> = [];
  let committed = false;
  function query(rows: unknown[] | Error) {
    const q: any = {
      from: () => q,
      where: (condition: any) => { predicates.push(dialect.sqlToQuery(condition)); return q; },
      orderBy: (...order: any[]) => { ordering.push(order.map(column => dialect.sqlToQuery(sql`${column}`).sql)); return q; },
      limit: () => q,
      offset: () => q,
      for: (kind: string) => { locks.push(kind); return q; },
      onConflictDoNothing: () => q,
      returning: () => q,
      then: (resolve: any, reject: any) => (rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows)).then(resolve, reject),
    };
    return q;
  }
  const tx: any = {
    select: () => { assert(reads.length, 'Unexpected read'); return query(reads.shift()!); },
    insert: (table: any) => ({ values: (values: any) => {
      const name = getTableName(table);
      if (name === 'threed_assembly_components' && options.failComponents) throw Error('mock write failure');
      writes.push({ table: name, action: 'insert', values });
      return query(name === 'threed_assembly' && !options.conflict ? [{ id }] : []);
    } }),
    update: (table: any) => ({ set: (values: any) => { writes.push({ table: getTableName(table), action: 'update', values }); return query([]); } }),
    delete: (table: any) => { writes.push({ table: getTableName(table), action: 'delete', values: null }); return query([]); },
    execute: async (statement: any) => {
      rankUpdates.push(dialect.sqlToQuery(statement));
      if (options.failOrder) throw Error('mock rank write failure');
    },
    $with: () => ({ as: () => ({ id: threedAssembly.id, name: threedAssembly.name, sortOrder: threedAssembly.sortOrder }) }),
    with: () => tx,
  };
  const database = {
    ...tx,
    transaction: async (callback: any) => { const result = await callback(tx); committed = true; return result; },
  } as typeof db;
  return { database, writes, predicates, locks, ordering, rankUpdates, committed: () => committed, done: () => assert.equal(reads.length, 0) };
}
const first = fixture([[], [{ id: 12 }]]);
const saved = await saveAssembly(first.database, owner, { definition, expectedRevision: 0 });
first.done();
assert.equal(saved.revision, 1);
assert.equal(first.committed(), true);
assert.deepEqual(first.locks, ['update', 'share']);
assert.equal(first.writes[0].values.userId, owner);
assert.equal(first.writes[1].values.length, 1, 'Repeated Model needs one assignment');
assert.equal(first.writes[3].values.length, 2, 'Repeated Model retains independent occurrences');
assert.deepEqual(first.writes[3].values.map((row: { componentId: string }) => row.componentId), ['left', 'right']);
assert(first.predicates[0].params.includes(owner));
assert(first.predicates[1].sql.includes('is_public') && first.predicates[1].sql.includes('is_library_item'));
assert(first.predicates[1].sql.includes('used_by_characters'));
const update = fixture([[{ id }], [{ revision: 1 }], [{ id: 12 }]]);
assert.equal((await saveAssembly(update.database, owner, { definition, expectedRevision: 1 })).revision, 2);
update.done();
assert.equal(update.writes.find(write => write.table === 'threed_assembly_revisions')?.values.revision, 2);
assert(update.writes.every(write => write.action !== 'delete'), 'Prior revisions and assignments remain intact');
for (const [reads, expectedRevision, message] of [
  [[[{ id }], [{ revision: 2 }]], 1, /changed elsewhere/],
  [[[]], 1, /not found/],
  [[[{ id }]], 0, /already exists/],
  [[[], []], 0, /unavailable/],
] as const) {
  const failure = fixture(reads.map(rows => [...rows]));
  await assert.rejects(saveAssembly(failure.database, owner, { definition, expectedRevision }), message);
  assert.equal(failure.writes.length, 0);
  assert.equal(failure.committed(), false);
  failure.done();
}
const rollback = fixture([[], [{ id: 12 }]], { failComponents: true });
await assert.rejects(saveAssembly(rollback.database, owner, { definition, expectedRevision: 0 }), /mock write failure/);
assert.equal(rollback.committed(), false, 'Transaction cannot commit partial root/revision writes');
const conflict = fixture([[], [{ id: 12 }]], { conflict: true });
await assert.rejects(saveAssembly(conflict.database, owner, { definition, expectedRevision: 0 }), /identity conflict/);
assert.equal(conflict.committed(), false);
for (const input of [
  { definition: { ...definition, ownerId: 'foreign' }, expectedRevision: 0 },
  { definition, expectedRevision: '0' },
  { definition: { ...definition, revision: 2 }, expectedRevision: 1 },
  { definition, expectedRevision: 0, extra: true },
]) {
  const invalid = fixture([]);
  await assert.rejects(saveAssembly(invalid.database, owner, input));
  assert.equal(invalid.writes.length, 0);
}
assert.throws(() => assemblyId('../foreign'), /Invalid/);
const reopen = fixture([[{ id }], [{ revision: 1, formatVersion: 1, name: definition.name }], first.writes[3].values]);
assert.deepEqual(await readAssembly(reopen.database, owner, id), saved);
reopen.done();
assert.deepEqual(reopen.locks, ['share']);
const foreignRead = fixture([[]]);
await assert.rejects(readAssembly(foreignRead.database, 'foreign', id), /not found/);
assert(foreignRead.predicates[0].params.includes('foreign'));
const list = fixture([[{ id, name: definition.name }], [{ total: 1 }]]);
assert.equal((await listAssemblies(list.database, owner)).items.length, 1);
assert(list.predicates[0].params.includes(owner));
assert.match(list.ordering[0][0], /updated_at.*desc/);
assert.equal(assemblyListQuery(new URLSearchParams('offset=100&limit=50&search=FarmBot')).offset, 100);
for (const value of ['offset=-1', 'limit=1000', 'offset=1.5', 'sort=owner', 'direction=early', 'search=' + 'x'.repeat(121)]) assert.throws(() => assemblyListQuery(new URLSearchParams(value)));
const sortQuery = assemblyListQuery(new URLSearchParams('sort=sortOrder&direction=asc&offset=25'));
const sortList = fixture([[{ id, name: definition.name, sortOrder: -2 }], [{ total: 35 }]]);
assert.equal((await listAssemblies(sortList.database, owner, sortQuery)).items[0].sortOrder, -2);
assert.match(sortList.ordering[0][0], /sort_order.*asc/);
assert.match(sortList.ordering[0][1], /name.*asc/);
const missingRank = Object.assign(Error('column threed_assembly.sort_order does not exist'), { code: '42703' });
const legacyList = fixture([missingRank, [{ id, sortOrder: null }], [{ total: 1 }]]);
assert.equal((await listAssemblies(legacyList.database, owner, sortQuery)).items[0].sortOrder, null);
assert.match(legacyList.ordering[1][0], /name.*asc/);
const activityQuery = assemblyListQuery(new URLSearchParams('sort=isActive&direction=desc'));
const activityList = fixture([[{ id, sortOrder: -2, isActive: false }], [{ total: 1 }]]);
assert.equal((await listAssemblies(activityList.database, owner, activityQuery)).items[0].isActive, false);
assert.match(activityList.ordering[0][0], /is_active.*desc/);
const missingActivity = Object.assign(Error('column threed_assembly.is_active does not exist'), { code: '42703' });
const legacyActivity = fixture([missingActivity, [{ id, sortOrder: -2, isActive: null }], [{ total: 1 }]]);
assert.equal((await listAssemblies(legacyActivity.database, owner, activityQuery)).items[0].isActive, null);
assert.match(legacyActivity.ordering[1][0], /name.*asc/);
const legacyBoth = fixture([missingActivity, missingRank, [{ id, sortOrder: null, isActive: null }], [{ total: 1 }]]);
assert.deepEqual((await listAssemblies(legacyBoth.database, owner, sortQuery)).items[0], { id, sortOrder: null, isActive: null });
assert.match(legacyBoth.ordering[2][0], /name.*asc/);
assert.equal(isMissingAssemblyColumn({ cause: missingActivity }, 'is_active'), true);
assert.equal(isMissingAssemblyColumn(missingActivity, 'sort_order'), false);
assert.equal(threedAssembly.isActive.default, true);
const second = '3f19863a-b106-42da-8c4d-717cdc7bb21c';
const setRanks = { action: 'set', ids: [id, second], sortOrder: -2 };
const bulk = fixture([[{ id }, { id: second }]]);
assert.deepEqual(await updateAssemblyList(bulk.database, owner, setRanks), { updated: 2 });
assert.deepEqual(bulk.locks, ['update']);
assert.deepEqual(bulk.writes, [{ action: 'update', table: 'threed_assembly', values: { sortOrder: -2 } }]);
assert(bulk.predicates.every(predicate => predicate.params.includes(owner)));
const setActivity = { action: 'set', ids: [id, second], isActive: false };
const bulkActivity = fixture([[{ id }, { id: second }]]);
assert.deepEqual(await updateAssemblyList(bulkActivity.database, owner, setActivity), { updated: 2 });
assert.deepEqual(bulkActivity.writes, [{ action: 'update', table: 'threed_assembly', values: { isActive: false } }]);
assert(bulkActivity.predicates.every(predicate => predicate.params.includes(owner)));
const bulkBoth = fixture([[{ id }, { id: second }]]);
assert.deepEqual(await updateAssemblyList(bulkBoth.database, owner, { ...setActivity, isActive: true, sortOrder: -3 }), { updated: 2 });
assert.deepEqual(bulkBoth.writes[0].values, { isActive: true, sortOrder: -3 });
const foreignActivity = fixture([[{ id }]]);
await assert.rejects(updateAssemblyList(foreignActivity.database, owner, setActivity), /unavailable/);
assert.equal(foreignActivity.writes.length, 0);
assert.equal(foreignActivity.committed(), false);
await assert.rejects(updateAssemblyList(fixture([]).database, owner, { ...setActivity, isActive: 'false' }), /Active or Inactive/);
await assert.rejects(updateAssemblyList(fixture([]).database, owner, { action: 'set', ids: [id] }), /Choose a field/);
const missing = fixture([[{ id }]]);
await assert.rejects(updateAssemblyList(missing.database, owner, setRanks), /unavailable/);
assert.equal(missing.writes.length, 0);
const invalidRank = fixture([]);
await assert.rejects(updateAssemblyList(invalidRank.database, owner, { ...setRanks, sortOrder: 1.5 }), /whole number/);
const groups = [{ id, sortOrder: 0 }, { id: second, sortOrder: 0 }];
const move = { action: 'move', sourceId: second, targetId: id, after: false };
const reorder = fixture([[], groups]);
assert.deepEqual(await updateAssemblyList(reorder.database, owner, move), { updated: 1 });
assert.deepEqual(reorder.locks, ['update']);
assert.deepEqual(JSON.parse(String(reorder.rankUpdates[0].params[0])), [{ id, sort_order: 1 }]);
assert(reorder.rankUpdates[0].params.includes(owner));
assert.match(reorder.rankUpdates[0].sql, /SET sort_order/);
const noOp = fixture([[], groups]);
assert.deepEqual(await updateAssemblyList(noOp.database, owner, { ...move, after: true }), { updated: 0 });
assert.equal(noOp.rankUpdates.length, 0);
const badMove = fixture([[], [groups[0]]]);
await assert.rejects(updateAssemblyList(badMove.database, owner, move), /not found/);
assert.equal(badMove.rankUpdates.length, 0);
const failedMove = fixture([[], groups], { failOrder: true });
await assert.rejects(updateAssemblyList(failedMove.database, owner, move), /mock rank write failure/);
assert.equal(failedMove.committed(), false);
const deleted = fixture([[{ id }], [{ revision: 2 }]]);
assert.deepEqual(await deleteAssembly(deleted.database, owner, id, 2), { id });
assert.deepEqual(deleted.writes.map(row => row.table), ['threed_assembly_components', 'threed_assembly_revisions', 'threed_assembly_model_assignments', 'threed_assembly']);
assert(deleted.predicates[0].params.includes(owner));
assert.deepEqual(deleted.locks, ['update']);
for (const rows of [[[]], [[{ id }], [{ revision: 3 }]]]) {
  const failure = fixture(rows);
  await assert.rejects(deleteAssembly(failure.database, owner, id, 2));
  assert.equal(failure.writes.length, 0);
}

let authenticated: string | null = owner;
let calledOwner = '';
let updateFailure: unknown;
const route: any = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/threed/assembly-groups/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: route,
  require(name: string) {
    if (name === 'next/server') return { NextResponse: { json: (body: unknown, options: any = {}) => ({ body, status: options.status ?? 200 }) } };
    if (name === '@/libraries/auth') return { auth: async () => authenticated ? { user: { id: authenticated } } : null };
    if (name === '@/libraries/db/client') return { db: {} };
    if (name.endsWith('/assembly-group-core')) return { AssemblyContractError };
    if (name.endsWith('/assembly-workspace-server')) return {
      AssemblyWorkspaceError,
      assemblyId,
      isMissingAssemblyColumn,
      updateAssemblyList: async (_db: unknown, userId: string) => {
        if (updateFailure) throw updateFailure;
        calledOwner = userId;
        return { updated: 2 };
      },
      saveAssembly: async (_db: unknown, userId: string) => { calledOwner = userId; return saved; },
    };
    throw Error(name);
  },
});
authenticated = null;
assert.equal((await route.POST({ text: () => { throw Error('must not read unauthenticated body'); } })).status, 401);
assert.equal((await route.PATCH({ text: () => { throw Error('must not read unauthenticated body'); } })).status, 401);
authenticated = owner;
assert.equal((await route.POST({ text: async () => JSON.stringify({ definition, expectedRevision: 0 }) })).status, 200);
assert.equal(calledOwner, owner);
assert.equal((await route.POST({ text: async () => '{bad' })).status, 400);
assert.equal((await route.PATCH({ text: async () => JSON.stringify(setRanks) })).status, 200);
assert.equal(calledOwner, owner);
assert.equal((await route.PATCH({ text: async () => '{bad' })).status, 400);
updateFailure = { cause: missingActivity };
const missingActivityResponse = await route.PATCH({ text: async () => JSON.stringify(setActivity) });
assert.equal(missingActivityResponse.status, 503);
assert.match(missingActivityResponse.body.error, /Active status requires the database migration/);
function editorPage(file: string) {
  const page: any = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports: page,
    require(name: string) {
      if (name === 'next/navigation') return { notFound() { throw Error('not-found'); } };
      if (name === 'react/jsx-runtime') return { jsx: (type: string, props: object) => ({ type, props }) };
      if (name === '@/components/threed/assemblies/AssemblyCompositionWorkspace') return { AssemblyCompositionWorkspace: 'Editor' };
      throw Error(name);
    },
  });
  return page.default;
}
assert.equal(editorPage('src/app/admin/threed/assembly-groups/new/page.tsx')().type, 'Editor');
const editPage = editorPage('src/app/admin/threed/assembly-groups/[id]/page.tsx');
assert.equal((await editPage({ params: Promise.resolve({ id }) })).props.recordId, id);
await assert.rejects(editPage({ params: Promise.resolve({ id: 'invalid' }) }), /not-found/);
console.log('PASS: actual Assembly Save/reopen/list, row locks, owner/Library boundaries, repeated occurrences, immutable revisions, stale/invalid/conflict guards, rollback and authenticated route handling (mock database only)');
console.log('PASS: Assembly Groups list sorting, pre-migration compatibility, owner-only rank and activity updates, drag ordering and rollback.');
