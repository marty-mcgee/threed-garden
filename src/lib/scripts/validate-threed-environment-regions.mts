import assert from 'node:assert/strict';
// @ts-ignore Native Node source extension.
import { selectEnvironmentCollisionRegions } from '../services/threed/models/environment-region-selection.ts';
const regions = [
 {id:'floor',min:[-100,0,-100],max:[100,0,100],triangleCount:2},
 {id:'wall',min:[10,0,0],max:[11,5,1],triangleCount:20},
 {id:'remote',min:[100,0,0],max:[110,5,1],triangleCount:20},
] as const;
const actor={position:[0,1,0],speed:0} as const;
assert.deepEqual(selectEnvironmentCollisionRegions(regions,[actor],new Set()).activeIds,['floor','wall']);
assert(selectEnvironmentCollisionRegions(regions,[{position:[90,1,0],speed:0}],new Set()).activeIds.includes('remote'),'Uncontrolled actors participate equally');
assert(selectEnvironmentCollisionRegions(regions,[{position:[25,1,0],speed:5}],new Set()).activeIds.includes('wall'),'Speed preloads nearby region');
assert(selectEnvironmentCollisionRegions(regions,[{position:[25,1,0],speed:0}],new Set(['wall'])).activeIds.includes('wall'),'Retention margin avoids boundary churn');
const bounded=selectEnvironmentCollisionRegions(regions,[actor],new Set(),{radius:12,retentionMargin:6,predictionSeconds:1,maxTriangles:2,maxRegions:1});
assert.deepEqual(bounded.activeIds,['floor']);assert.deepEqual(bounded.deferredIds,['wall']);
assert.deepEqual(selectEnvironmentCollisionRegions(regions,[],new Set()).activeIds,[]);
// A Character and two balls must contribute independently, without charging
// shared geometry more than once or retaining regions after every actor leaves.
const distributedRegions = [0, 100, 200].map((x, i) => ({
 id: `contact-${i}`, min: [x, 0, 0] as [number,number,number],
 max: [x+2, 2, 2] as [number,number,number], triangleCount: 10,
}));
const actors = [0, 100, 200].map(x => ({position: [x+1, 1, 1] as [number,number,number], speed: 0}));
const shared = selectEnvironmentCollisionRegions(distributedRegions, [...actors, actors[0]], new Set());
assert.deepEqual(shared.activeIds, ['contact-0','contact-1','contact-2']);
assert.equal(shared.triangleCount, 30, 'Shared contact regions count once');
assert.deepEqual(shared.deferredIds, []);
const moved = selectEnvironmentCollisionRegions(distributedRegions, [actors[0], actors[1], {position: [400,1,1], speed: 0}], new Set(shared.activeIds));
assert.deepEqual(moved.activeIds, ['contact-0','contact-1'], 'Departed ball releases distant regions while other actors retain contact');
const capacity = selectEnvironmentCollisionRegions(distributedRegions, actors, new Set(), {radius:12,retentionMargin:6,predictionSeconds:1,maxTriangles:20,maxRegions:2});
assert.equal(capacity.triangleCount, 20);
assert.equal(capacity.activeIds.length, 2);
assert.equal(capacity.deferredIds.length, 1, 'Capacity reports uncovered nearby contact');
assert.deepEqual(new Set([...capacity.activeIds,...capacity.deferredIds]), new Set(shared.activeIds));
console.log('PASS: bounds proximity, multiple actors, speed prediction, retention and capacity');
