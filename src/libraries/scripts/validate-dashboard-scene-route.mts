import assert from 'node:assert/strict';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { buildDashboardSceneUrl } from '../services/map/dashboard-scene-route.ts';

assert.equal(buildDashboardSceneUrl(), '/dashboard/scene');
assert.equal(
  buildDashboardSceneUrl({ projectId: '5' }),
  '/dashboard/scene?projectId=5',
);
assert.equal(
  buildDashboardSceneUrl({ projectId: '5', panel: ['assets', 'details'], omitted: undefined }),
  '/dashboard/scene?projectId=5&panel=assets&panel=details',
);
assert.equal(
  buildDashboardSceneUrl({ returnTo: '/dashboard?module=threed' }),
  '/dashboard/scene?returnTo=%2Fdashboard%3Fmodule%3Dthreed',
);

console.log('PASS Dashboard Scene route: canonical path and legacy query preservation.');
