import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file: string, dependencies: Record<string, unknown> = {}) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: (name: string) => { assert(name in dependencies); return dependencies[name]; } });
  return exports;
}
const slots = load('src/lib/services/threed/animations/action-slots.ts');
const { getCharacterAnimationAvailability: get, reportCharacterAnimationAvailability: report, subscribeCharacterAnimationAvailability: subscribe, DETAILS_ANIMATION_ACTIONS } =
  load('src/lib/services/threed/animations/runtime-availability.ts', {});
assert(slots.isCustomActionKey('custom_' + 'a'.repeat(32)));
assert(!slots.isCustomActionKey('watering'));
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
