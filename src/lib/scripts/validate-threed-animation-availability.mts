import assert from 'node:assert/strict';
// @ts-ignore Native source extension.
import { getCharacterAnimationAvailability as get, reportCharacterAnimationAvailability as report, subscribeCharacterAnimationAvailability as subscribe } from '../services/threed/animations/runtime-availability.ts';
let notifications=0;
const unsubscribe=subscribe(()=>notifications++);
assert.equal(get(1,'/kate.glb'),null);
const release=report(1,'/kate.glb',['Watering','talk']);
assert(get(1,'/kate.glb')?.has('watering'));
assert(!get(1,'/kate.glb')?.has('pickfruit'));
assert.equal(get(2,'/kate.glb'),null);
assert.equal(get(1,'/replacement.glb'),null);
const snapshot=get(1,'/kate.glb');assert.equal(get(1,'/kate.glb'),snapshot,'Snapshot identity is stable');
const replacement=report(1,'/kate.glb',['point']);
release();assert(get(1,'/kate.glb')?.has('point'),'Old runtime cleanup preserves replacement');
release();replacement();assert.equal(get(1,'/kate.glb'),null);
assert.equal(notifications,4);unsubscribe();
console.log('PASS: availability, unavailable actions, Character/asset isolation, stable snapshot and lifecycle cleanup');
