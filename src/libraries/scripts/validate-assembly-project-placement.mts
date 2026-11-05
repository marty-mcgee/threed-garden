import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import type { db } from '../db/client';
import { InputValidationError } from '../utils/input-validation';
import { AssemblyContractError } from '../services/threed/models/assembly-group-core';
import { AssemblyProjectPlacementError, parseAssemblyProjectPlacement, placeAssemblyInProject } from '../services/threed/models/assembly-project-placement';
import { calculateThreeDModelGroundedY, calculateThreeDModelInstanceScale } from '../services/threed/markers/model-visual-fit-core';
import { resolveActiveModelGeometry } from '../services/threed/models/model-source-core';
import { parseProjectThreeDMarkerSnapshot } from '../services/threed/markers/project-marker-snapshot-core';
import { modelMarkerSnapshotData, refreshModelMarkerData } from '../services/threed/models/model-snapshot-assets';
import { buildThreeDRuntimeMarkerResult } from '../services/threed/markers/runtime-marker-builder';

const owner = 'assembly-placement-owner';
const assemblyId = '05b3b80c-0ed3-4123-8bc0-bf388e45cbef';
const requestId = '811195cb-d543-459e-81e4-e26ac7512bcc';
const input = {
  projectId: 17,
  threedId: 6,
  assemblyId,
  assemblyRevision: 3,
  requestId,
  transform: {
    position: {
      x: 10,
      y: 2,
      z: -5,
    },
    rotation: {
      x: 0.2,
      y: Math.PI / 2,
      z: -0.1,
    },
    scale: 2,
  },
};
const components = ['left', 'right'].map((componentId, index) => ({
  componentId,
  modelId: 12,
  label: `Part ${componentId}`,
  positionX: index + 1,
  positionY: 0.25,
  positionZ: -2,
  rotationX: 0.3,
  rotationY: -0.4,
  rotationZ: 0.5,
  scale: 0.5,
}));
const ownedProject = {
  id: 17,
  originLatitude: null,
  originLongitude: null,
  originAltitude: '0',
  headingDegrees: '0',
  metersPerSceneUnit: '0.3048',
};
const revision = {
  formatVersion: 1,
  revision: 3,
  name: 'Two reusable parts',
};
const model = {
  id: 12,
  filePath: '/fixture.glb',
  modelType: 'model',
  scale: 0.01,
};
function freshReads() {
  return [[ownedProject], [{ id: 8 }], [{ id: assemblyId }], [], [revision], components, [model], [], [{ total: 4 }]];
}
const dialect = new PgDialect();
const sqlBuilder = drizzle.mock();
function fixture(reads: unknown[][], options: { failMarkers?: boolean; incompleteReturn?: boolean; existingAsset?: boolean } = {}) {
  const writes: Array<{ table: string; values: any; conflict?: any }> = [];
  const predicates: Array<{ sql: string; params: unknown[] }> = [];
  const locks: string[] = [];
  const commands: Array<{ sql: string; params: unknown[] }> = [];
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  let committed = false;
  let selected = 0;
  const tx: any = {
    execute: async (command: any) => commands.push(dialect.sqlToQuery(command)),
    select: (fields: any) => {
      assert(reads.length, 'Unexpected database read');
      selected += 1;
      const rows = reads.shift()!;
      let builder: any = fields ? sqlBuilder.select(fields) : sqlBuilder.select();
      const q: any = {
        from: (table: any) => {
          builder = builder.from(table);
          return q;
        },
        innerJoin: (table: any, condition: any) => {
          predicates.push(dialect.sqlToQuery(condition));
          builder = builder.innerJoin(table, condition);
          return q;
        },
        where: (condition: any) => {
          predicates.push(dialect.sqlToQuery(condition));
          builder = builder.where(condition);
          return q;
        },
        orderBy: (...columns: any[]) => {
          builder = builder.orderBy(...columns);
          return q;
        },
        limit: (count: number) => {
          builder = builder.limit(count);
          return q;
        },
        for: (lock: string) => {
          locks.push(lock);
          builder = builder.for(lock);
          return q;
        },
        then: (resolve: any, reject: any) => {
          queries.push(builder.toSQL());
          return Promise.resolve(rows).then(resolve, reject);
        },
      };
      return q;
    },
    update: (table: any) => ({
      set: (values: any) => ({
        where: (condition: any) => ({
          returning: async () => {
            assert.equal(getTableName(table), 'project_assets');
            assert.equal(values.isActive, true);
            assert(!('config' in values), 'Retain existing asset configuration');
            assert(!('userId' in values), 'Do not transfer ownership');
            predicates.push(dialect.sqlToQuery(condition));
            return options.existingAsset ? [{ id: 77 }] : [];
          },
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (values: any) => {
        const name = getTableName(table);
        if (name === 'project_threed_markers' && options.failMarkers) throw Error('mock marker insert failed');
        const write: { table: string; values: any; conflict?: any } = {
          table: name,
          values,
        };
        writes.push(write);
        return {
          onConflictDoUpdate: async () => { assert.fail('Do not require an undeployed conflict constraint'); },
          returning: async () => options.incompleteReturn ? [] : values.map((row: any, index: number) => ({
            ...row,
            id: index + 101,
          })),
        };
      },
    }),
  };
  const database = {
    transaction: async (callback: any) => {
      const result = await callback(tx);
      committed = true;
      return result;
    },
  } as typeof db;
  return {
    database,
    writes,
    predicates,
    locks,
    commands,
    queries,
    committed: () => committed,
    selected: () => selected,
    done: () => assert.equal(reads.length, 0),
  };
}

for (const invalid of [
  { ...input, ownerId: 'forged' },
  { ...input, projectId: '17' },
  { ...input, threedId: 0 },
  { ...input, assemblyRevision: 0 },
  { ...input, assemblyId: '../foreign' },
  { ...input, requestId: 'not-a-uuid' },
  { ...input, transform: undefined },
  { ...input, transform: { ...input.transform, scale: 0 } },
  { ...input, transform: { ...input.transform, rotation: { x: Infinity, y: 0, z: 0 } } },
]) {
  const invalidFixture = fixture([]);
  await assert.rejects(placeAssemblyInProject(invalidFixture.database, owner, invalid));
  assert.equal(invalidFixture.commands.length, 0, 'Malformed input must fail before transaction/database access');
}
assert.equal(parseAssemblyProjectPlacement({ ...input, assemblyId: assemblyId.toUpperCase() }).assemblyId, assemblyId);

const first = fixture(freshReads());
const placed = await placeAssemblyInProject(first.database, owner, input);
first.done();
assert.equal(first.committed(), true);
assert.equal(placed.replayed, false);
assert.equal(placed.placementId, requestId);
assert.equal(placed.markers.length, 2);
assert.equal(new Set(placed.markers.map(row => row.markerId)).size, 2, 'Repeated Model occurrences need independent stable marker identities');
assert.deepEqual(first.writes.map(write => write.table), ['project_assets', 'project_threed_markers']);
assert.equal(first.writes[0].values.length, 1, 'One asset assignment per unique Model');
assert.equal(first.writes[0].values[0].moduleId, 6);
assert.equal(first.writes[0].values[0].assetType, 'threed_models');
const reused = fixture(freshReads(), { existingAsset: true });
await placeAssemblyInProject(reused.database, owner, input);
assert.deepEqual(reused.writes.map(write => write.table), ['project_threed_markers']);
assert.equal(first.commands.length, 1);
assert(first.commands[0].sql.includes('pg_advisory_xact_lock'));
assert(first.commands[0].params.includes('project-threed-markers:17'));
assert.deepEqual(first.locks, ['update', 'share', 'share', 'update', 'share', 'share']);
assert.equal(first.queries.length, 9, 'Every actual Drizzle select must compile without any connection');
assert(first.queries.filter(query => query.sql.includes('for share')).every(query => !/left join|right join|full join|group by|distinct/i.test(query.sql)), 'Row locks must not target nullable joins or grouped relations');
assert(first.queries[1].sql.includes('inner join "threed"') && first.queries[1].sql.endsWith('for share'));
assert(first.queries[6].sql.includes('select f.file_path') && first.queries[6].sql.endsWith('for share'));
assert(first.predicates.some(predicate => predicate.sql.includes('"project"."user_id"') && predicate.params.includes(owner)));
assert(first.predicates.some(predicate => predicate.sql.includes('"threed_assembly"."user_id"') && predicate.params.includes(owner)));
assert(first.predicates.some(predicate => predicate.sql.includes('is_public') && predicate.sql.includes('is_library_item') && predicate.sql.includes('used_by_characters') && predicate.params.includes(owner)));
assert(first.predicates.some(predicate => predicate.sql.includes('"project_threed"."is_active"') && predicate.params.includes(true)));

function matrix(position: Vector3, rotation: Euler, scale: number) {
  return new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scale, scale, scale));
}
const placementMatrix = matrix(
  new Vector3(10, 2, -5),
  new Euler(0.2, Math.PI / 2, -0.1, 'XYZ'),
  2,
);
for (const [index, marker] of placed.markers.entries()) {
  const expected = placementMatrix.clone().multiply(matrix(new Vector3(index + 1, 0.25, -2), new Euler(0.3, -0.4, 0.5, 'XYZ'), 0.5));
  const data = marker.data as Record<string, number>;
  const actual = matrix(
    new Vector3(Number(marker.positionX), Number(marker.positionY), Number(marker.positionZ)),
    new Euler(data.rotationX, data.rotationYInstance, data.rotationZ, 'XYZ'),
    data.scaleMultiplier,
  );
  assert(actual.elements.every((value, element) => Math.abs(value - expected.elements[element]) < 0.00051), 'World pose must preserve XYZ component rotation, global transform and position precision');
  assert.equal(marker.userId, owner);
  assert.equal(marker.latitude, null);
  assert.equal(marker.sourceAssetId, 12);
  assert.equal(data.scaleMultiplier, 1, 'Source Model base scale must not be applied again');
  assert.equal((marker.metadata as any).assemblyPlacement.componentCount, 2);
  assert.equal((marker.metadata as any).placementRole, 'object');
}

const geographicReads = freshReads();
geographicReads[0] = [{ ...ownedProject, originLatitude: '39.3', originLongitude: '-123.5' }] as any;
const geographicFixture = fixture(geographicReads);
const geographic = await placeAssemblyInProject(geographicFixture.database, owner, input);
assert(geographic.markers.every(marker => Number.isFinite(Number(marker.latitude)) && marker.latitude !== null));

// Compare the actual AssemblyCanvas and Scene transform conventions. Source
// geometry itself remains loader-owned; a representative rotated geometry minY
// is enough to prove both grounding expressions cancel identically.
for (const configuredModel of [
  { ...model, scale: 0.1, offsetX: '2', offsetY: '4', offsetZ: '-3', rotationY: '35' },
  { ...model, scale: 4, offsetX: '-2', offsetY: '-5', offsetZ: '3', rotationY: '-25' },
  { ...model, modelType: 'procedural', filePath: '', scale: 0.001, offsetX: '2', offsetY: '-4', offsetZ: '-3', rotationY: '35' },
  { ...model, scale: 0.01, offsetX: '2', offsetY: '4', offsetZ: '-3', rotationY: '35', metadata: { activeSource: 'shape' } },
]) {
  const reads = freshReads();
  reads[6] = [configuredModel];
  const configuredFixture = fixture(reads);
  const configuredPlacement = await placeAssemblyInProject(configuredFixture.database, owner, input);
  const geometry = resolveActiveModelGeometry(configuredModel);
  const baseScale = calculateThreeDModelInstanceScale(configuredModel.scale, 1);
  const offsets = new Vector3(Number(configuredModel.offsetX), Number(configuredModel.offsetY), Number(configuredModel.offsetZ));
  const catalogRotation = new Euler(0, Number(configuredModel.rotationY) * Math.PI / 180, 0, 'XYZ');
  const rotatedMinimumY = -3;
  for (const [index, marker] of configuredPlacement.markers.entries()) {
    const componentMatrix = placementMatrix.clone().multiply(matrix(new Vector3(index + 1, 0.25, -2), new Euler(0.3, -0.4, 0.5, 'XYZ'), 0.5));
    let assemblyVisual = new Matrix4();
    let sceneVisual = new Matrix4().makeScale(baseScale, baseScale, baseScale);
    if (geometry.filePath) {
      assemblyVisual = matrix(new Vector3(offsets.x, calculateThreeDModelGroundedY(rotatedMinimumY * baseScale, offsets.y), offsets.z), catalogRotation, baseScale);
      sceneVisual.multiply(matrix(new Vector3(offsets.x, calculateThreeDModelGroundedY(rotatedMinimumY, offsets.y), offsets.z), catalogRotation, 1));
    } else if (configuredModel.modelType === 'procedural' && !configuredModel.filePath) {
      assemblyVisual = matrix(offsets, catalogRotation, Math.max(0.01, configuredModel.scale));
    }
    const expected = componentMatrix.multiply(assemblyVisual);
    const data = marker.data as Record<string, number>;
    const actual = matrix(
      new Vector3(Number(marker.positionX), Number(marker.positionY), Number(marker.positionZ)),
      new Euler(data.rotationX, data.rotationYInstance, data.rotationZ, 'XYZ'),
      data.scaleMultiplier,
    ).multiply(sceneVisual);
    assert(actual.elements.every((value, element) => Math.abs(value - expected.elements[element]) < 0.00051), 'Catalog scale, XYZ offset, grounded Y, catalog rotation and inactive Files must preserve the Assembly visual pose');
    const hydrated = refreshModelMarkerData(marker.data as Record<string, unknown>, 12, configuredModel);
    const [snapshot] = parseProjectThreeDMarkerSnapshot([{
      ...marker,
      moduleType: 'models',
      assetId: 12,
      position: {
        x: Number(marker.positionX),
        y: Number(marker.positionY),
        z: Number(marker.positionZ),
      },
      data: modelMarkerSnapshotData(hydrated),
    }]);
    const reopened = refreshModelMarkerData(snapshot.data, 12, configuredModel);
    for (const key of ['rotationX', 'rotationYInstance', 'rotationZ', 'scaleMultiplier']) {
      assert.equal(reopened[key], data[key], 'Project snapshot/hydration must retain the compensated transform');
    }
    assert.deepEqual(snapshot.metadata, marker.metadata, 'Existing snapshot preserves the retry receipt');
  }
}
const longLabelReads = freshReads();
longLabelReads[5] = [{ ...components[0], label: 'L'.repeat(255) }];
const longLabelFixture = fixture(longLabelReads);
assert.equal((await placeAssemblyInProject(longLabelFixture.database, owner, input)).markers[0].label!.length, 250);

const largeScaleReads = freshReads();
largeScaleReads[5] = components.map(component => ({ ...component, scale: 20 }));
const largeScaleFixture = fixture(largeScaleReads);
await assert.rejects(placeAssemblyInProject(largeScaleFixture.database, owner, {
  ...input,
  transform: { ...input.transform, scale: 100 },
}), /scaleMultiplier exceeds the supported limit/);
assert.equal(largeScaleFixture.writes.length, 0, 'Composed scale rejected by Project runtime must not create invisible persisted markers');
const boundaryScaleReads = freshReads();
boundaryScaleReads[5] = components.map(component => ({ ...component, scale: 10 }));
const boundaryScaleFixture = fixture(boundaryScaleReads);
const boundaryScale = await placeAssemblyInProject(boundaryScaleFixture.database, owner, {
  ...input,
  transform: { ...input.transform, scale: 100 },
});
assert(boundaryScale.markers.every(marker => (marker.data as any).scaleMultiplier === 1000));
const boundaryRuntime = buildThreeDRuntimeMarkerResult({
  plants: [],
  beds: [],
  characters: [],
  layers: [],
  farmbots: [],
  models: [],
  plantings: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: boundaryScale.markers as any,
});
assert.equal(boundaryRuntime.markers.length, 2);
assert.equal(boundaryRuntime.issues.length, 0);
for (const catalogPatch of [{ scale: 1001 }, { width: 100001 }]) {
  const reads = freshReads();
  reads[6] = [{ ...model, ...catalogPatch }];
  const invalidCatalog = fixture(reads);
  await assert.rejects(placeAssemblyInProject(invalidCatalog.database, owner, input), /exceeds the supported limit/);
  assert.equal(invalidCatalog.writes.length, 0, 'Catalog hydration must not create a marker the runtime skips');
}

// Retry resolves the same persisted components, including edits made since the
// initial request, without reading a newer Assembly revision or moving markers.
const edited = placed.markers.map(row => ({ ...row, positionX: '77.000' }));
const retry = fixture([[ownedProject], [{ id: 8 }], [{ id: assemblyId }], edited]);
const repeated = await placeAssemblyInProject(retry.database, owner, input);
retry.done();
assert.equal(repeated.replayed, true);
assert.deepEqual(repeated.markers, edited);
assert.equal(retry.writes.length, 0);
assert.equal(retry.selected(), 4);
// No new schema/ledger is used: after ALL component marker rows are physically
// removed there is no stored receipt. A subsequent request can place them again.
const removedReceipt = fixture(freshReads());
assert.equal((await placeAssemblyInProject(removedReceipt.database, owner, input)).replayed, false);
for (const [existing, changedInput] of [
  [edited.slice(0, 1), input],
  [edited, { ...input, transform: { ...input.transform, scale: 3 } }],
] as const) {
  const conflict = fixture([[ownedProject], [{ id: 8 }], [{ id: assemblyId }], [...existing]]);
  await assert.rejects(placeAssemblyInProject(conflict.database, owner, changedInput), (error: unknown) => error instanceof AssemblyProjectPlacementError && error.status === 409);
  assert.equal(conflict.writes.length, 0);
  assert.equal(conflict.committed(), false);
}

for (const [readIndex, replacement, message] of [
  [0, [], /Project not found/],
  [1, [], /assignment not found/],
  [2, [], /Assembly not found/],
  [4, [{ ...revision, revision: 4 }], /changed elsewhere/],
  [5, [], /Invalid assembly components/],
  [6, [], /unavailable/],
  [6, [{ ...model, filePath: null }], /unavailable/],
  [7, [{ moduleId: 99 }], /another active ThreeD/],
  [8, [{ total: 999 }], /marker limit/],
] as const) {
  const reads = freshReads().slice(0, readIndex + 1);
  reads[readIndex] = [...replacement] as any;
  const failure = fixture(reads);
  await assert.rejects(placeAssemblyInProject(failure.database, owner, input), message);
  failure.done();
  assert.equal(failure.writes.length, 0);
  assert.equal(failure.committed(), false);
}
const overflow = fixture(freshReads());
await assert.rejects(placeAssemblyInProject(overflow.database, owner, {
  ...input,
  transform: {
    ...input.transform,
    position: { x: 1_000_000, y: 1_000_000, z: 1_000_000 },
    rotation: { x: 0, y: 0, z: 0 },
  },
}), /Invalid assembly position/);
assert.equal(overflow.writes.length, 0);
for (const options of [{ failMarkers: true }, { incompleteReturn: true }]) {
  const rollback = fixture(freshReads(), options);
  await assert.rejects(placeAssemblyInProject(rollback.database, owner, input));
  assert.equal(rollback.committed(), false, 'Asset assignments and all component placements must commit atomically');
}

let authenticated: string | null = owner;
let calledOwner = '';
let routeResult = placed;
let routeError: Error | null = null;
const route: any = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/project/assembly-placements/route.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText, {
  exports: route,
  Buffer,
  require(name: string) {
    if (name === 'next/server') return { NextResponse: { json: (body: unknown, options: any = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } };
    if (name === '@/libraries/auth') return { auth: async () => authenticated ? { user: { id: authenticated } } : null };
    if (name === '@/libraries/db/client') return { db: {} };
    if (name.endsWith('/input-validation')) return { InputValidationError };
    if (name.endsWith('/assembly-group-core')) return { AssemblyContractError };
    if (name.endsWith('/assembly-project-placement')) return {
      AssemblyProjectPlacementError,
      placeAssemblyInProject: async (_database: unknown, userId: string, value: unknown) => {
        calledOwner = userId;
        parseAssemblyProjectPlacement(value);
        if (routeError) throw routeError;
        return routeResult;
      },
    };
    throw Error(name);
  },
});
const request = (body: string) => ({ text: async () => body });
authenticated = null;
assert.equal((await route.POST({ text: () => { throw Error('unauthenticated body must not be read'); } })).status, 401);
authenticated = owner;
assert.equal((await route.POST(request('{bad'))).status, 400);
assert.equal((await route.POST(request(' '.repeat(8193)))).status, 413);
assert.equal((await route.POST(request(JSON.stringify({ ...input, projectId: '17' })))).status, 400);
const createdResponse = await route.POST(request(JSON.stringify(input)));
assert.equal(createdResponse.status, 201);
assert.equal(createdResponse.headers['Cache-Control'], 'private, no-store');
assert.equal(calledOwner, owner);
routeResult = repeated;
assert.equal((await route.POST(request(JSON.stringify(input)))).status, 200);
routeError = new AssemblyProjectPlacementError('Revision changed', 409);
assert.equal((await route.POST(request(JSON.stringify(input)))).status, 409);
routeError = Error('secret database detail');
const failureResponse = await route.POST(request(JSON.stringify(input)));
assert.equal(failureResponse.status, 500);
assert(!JSON.stringify(failureResponse.body).includes('secret database'));
console.log('PASS: authorized Assembly batch placement, full XYZ transforms, marker/asset ownership, revision and capacity guards, transaction rollback, retry preservation and authenticated bounded route (mock persistence only)');
