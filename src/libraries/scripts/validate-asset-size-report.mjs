import assert from 'node:assert/strict';
import { assetSizeReport } from './asset-size-report.mjs';

for (const unit of [1, 0.3048, 0.01]) {
  const report = assetSizeReport(180, 0.02, unit, 1.7);
  assert.ok(Math.abs(report.heightInSceneUnits * report.proposedInstanceMultiplier * unit - 1.7) < 1e-12);
  assert.deepEqual(report, assetSizeReport(180, 0.02, unit, 1.7), 'Repeated proposals must not compound.');
}
assert.equal(assetSizeReport(100, .01, 1).heightMetres, 1);
assert.equal('proposedInstanceMultiplier' in assetSizeReport(100, .01, 1), false);
for (const invalid of [0, -1, NaN, Infinity, undefined]) {
  for (const index of [0, 1, 2]) {
    const args = [100, .01, 1]; args[index] = invalid;
    assert.throws(() => assetSizeReport(...args));
  }
}
assert.throws(() => assetSizeReport(100, .01, 1, 0));
assert.throws(() => assetSizeReport(Number.MAX_VALUE, 2, 1));
assert.throws(() => assetSizeReport(Number.MIN_VALUE, .01, 1));
console.log('PASS: explicit asset sizing, metre/foot/centimetre Projects, optional target, repeatability, invalid/overflow/underflow rejection.');
