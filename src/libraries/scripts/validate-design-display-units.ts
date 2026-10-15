import assert from 'node:assert/strict';
import { defaultDesignWorkspace, parseDesignWorkspace } from '../services/threed/design/workspace-state';
import { rulerTicks } from '../services/threed/design/plan-navigation';

const original = defaultDesignWorkspace();
assert.equal(parseDesignWorkspace(original).measurementUnits, 'imperial');
const metric = parseDesignWorkspace(JSON.parse(JSON.stringify({ ...original, measurementUnits: 'metric' })));
assert.equal(metric.measurementUnits, 'metric');
assert.deepEqual(metric.plan, original.plan);
assert.throws(() => parseDesignWorkspace({ ...original, measurementUnits: 'unknown' }));
for (const scale of [.1, 45, 300]) {
  const imperial = rulerTicks(73, scale, 800), metric = rulerTicks(73, scale, 800, 'metric');
  assert.deepEqual(metric.map(({ label, ...tick }) => tick), imperial.map(({ label, ...tick }) => tick));
  assert.ok(metric.every(tick => tick.label.endsWith(' m')));
}
console.log('PASS: legacy default, metric JSON round-trip, invalid preference rejection, unchanged ruler coordinates across zoom levels.');
