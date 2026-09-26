import assert from 'node:assert/strict';
import { getTableName } from 'drizzle-orm';
import { PgDialect, getTableConfig } from 'drizzle-orm/pg-core';
import { createFarmBotAssemblyDemo, deleteFarmBotAssemblyDemo } from '../services/threed/models/assembly-demo-server';
import { threedAssemblyComponents } from '../schema/threed';
import type { db } from '../db/client';
const dialect = new PgDialect();
const models = ['Box', 'Farmduino', 'Belt Clip'].map((name, i) => ({ id: i + 10, name: `FarmBot: ${name}`, active: true, status: 'active', type: 'glb', character: false }));
function fixture(reads: unknown[][]) {
  const writes: Array<{ action: string; table: string; values?: any }> = [];
  const predicates: Array<{ sql: string; params: unknown[] }> = [];
  let transactions = 0;
  function query(result: unknown[]) {
    const q: any = { from: () => q, where: (condition: any) => { predicates.push(dialect.sqlToQuery(condition)); return q; }, orderBy: () => q, for: () => q, returning: () => q, then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
    return q;
  }
  const tx: any = {
    select: () => { assert.ok(reads.length, 'unexpected read'); return query(reads.shift()!); },
    insert: (table: any) => ({ values: (values: any) => { const name = getTableName(table); writes.push({ action: 'insert', table: name, values }); return query(name === 'threed_assembly' ? [{ id: 'demo-id' }] : []); } }),
    delete: (table: any) => { writes.push({ action: 'delete', table: getTableName(table) }); return query([]); },
  };
  return { database: { transaction: async (callback: any) => { transactions++; return callback(tx); } } as unknown as typeof db, writes, predicates, transactions: () => transactions, done: () => assert.equal(reads.length, 0) };
}
const created = fixture([models, [], [{}, {}, {}, {}]]);
await createFarmBotAssemblyDemo(created.database, 'owner-fixture'); created.done();
assert.equal(created.transactions(), 1);
assert.deepEqual(created.writes.map(w => w.table), ['threed_assembly', 'threed_assembly_model_assignments', 'threed_assembly_revisions', 'threed_assembly_components']);
assert.equal(created.writes[0].values.userId, 'owner-fixture');
const components = created.writes[3].values;
assert.equal(components.length, 4); assert.equal(components[2].modelId, components[3].modelId);
assert.notEqual(components[2].componentId, components[3].componentId);
assert.equal(components[3].rotationY, Math.PI);
assert.ok(created.predicates[0].params.includes('owner-fixture'));
console.log('✓ Demo creates four occurrences from three owned Models in one transaction');
for (const invalidModels of [models.slice(0, 2), [...models, models[0]], models.map(m => ({ ...m, active: false }))]) {
  const invalid = fixture([invalidModels]); await assert.rejects(createFarmBotAssemblyDemo(invalid.database, 'owner-fixture'));
  assert.equal(invalid.writes.length, 0); invalid.done();
}
const existing = fixture([models, [{ id: 'existing' }]]);
await assert.rejects(createFarmBotAssemblyDemo(existing.database, 'owner-fixture'), /already exists/);
assert.equal(existing.writes.length, 0);
console.log('✓ Missing, ambiguous, inactive and duplicate demos never overwrite records');
const missing = fixture([[]]); await assert.rejects(deleteFarmBotAssemblyDemo(missing.database, 'other-owner', 'demo-id'));
assert.equal(missing.writes.length, 0);
assert.ok(missing.predicates[0].params.includes('other-owner'));
const cleanup = fixture([[{ id: 'demo-id' }]]);
await deleteFarmBotAssemblyDemo(cleanup.database, 'owner-fixture', 'demo-id');
assert.deepEqual(cleanup.writes.map(w => w.table), ['threed_assembly_components', 'threed_assembly_revisions', 'threed_assembly_model_assignments', 'threed_assembly']);
assert.ok(cleanup.predicates[0].params.includes('farmbot-persistence-demo-v1'));
console.log('✓ Cleanup is owner/demo scoped and never deletes source Model tables');
const config = getTableConfig(threedAssemblyComponents);
assert.equal(config.foreignKeys.length, 2); assert.equal(config.primaryKeys.length, 1);
assert.equal(config.uniqueConstraints.length, 1); assert.equal(config.checks.length, 10);
console.log('✓ Drizzle component schema retains composite references, identity and numeric checks');
console.log('PASS: ORM query-contract tests; no live database constraints or rollback execution tested');
