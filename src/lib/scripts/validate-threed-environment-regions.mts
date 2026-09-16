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
console.log('PASS: bounds proximity, multiple actors, speed prediction, retention and capacity');
