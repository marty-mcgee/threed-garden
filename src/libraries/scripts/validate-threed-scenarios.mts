import assert from 'node:assert/strict';
// @ts-expect-error Native Node TypeScript imports use explicit extensions.
import { evaluateScenario, type ScenarioAsset } from '../services/threed/scenario-core.ts';
const sensor = { id: 'sensor_1', behavior: 'counter', detection: 'movable-ball', groupId: 'group_1' };
const assets: ScenarioAsset[] = [
  { id: 'models:1', type: 'models', active: true, ball: false, sensors: [sensor] },
  { id: 'beds:1', type: 'beds', active: true, ball: false, sensors: [sensor] },
  { id: 'models:2', type: 'models', active: true, ball: true, sensors: [] },
];
const input = { kind: 'soccer' as const, assets, environmentId: 'models:1', groupId: 'group_1', groupIds: ['group_1'] };
const snapshot = JSON.stringify(input);
assert(evaluateScenario(input).every(check => check.complete));
assert.equal(JSON.stringify(input), snapshot, 'Evaluation cannot mutate assets');
assert.equal(evaluateScenario({ ...input, environmentId: 'beds:1' })[0].complete, false);
assert.equal(evaluateScenario({ ...input, groupIds: [] }).find(check => check.id === 'counters')?.complete, false);
assert.equal(evaluateScenario({ ...input, assets: [assets[0], assets[0], assets[2]] }).find(check => check.id === 'counters')?.complete, false, 'Repeated owner/sensor pair is one counter');
assert.equal(evaluateScenario({ ...input, assets: assets.map(asset => ({ ...asset, active: false })) }).filter(check => check.id !== 'group').some(check => check.complete), false);
assert.equal(evaluateScenario({ ...input, assets: [] }).filter(check => check.id !== 'group').some(check => check.complete), false);
const farming = evaluateScenario({ ...input, kind: 'farming' });
assert.equal(farming.find(check => check.id === 'beds')?.complete, true);
assert.equal(farming.find(check => check.id === 'farmbots')?.complete, false);
assert.equal(farming.find(check => check.id === 'plantings')?.complete, false);
console.log('PASS: Scenario eligibility, compound identity, missing/inactive assets, missing groups and immutable snapshots.');
