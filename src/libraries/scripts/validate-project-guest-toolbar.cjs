// Render the actual toolbar with offline UI boundaries and invoke its handlers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props: props || {} });
const exportsValue = {};
const events = [];
const source = fs.readFileSync('src/components/map/header/ProjectSceneToolbar.tsx', 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText, {
  exports: exportsValue,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    return new Proxy({}, { get: (_, key) => key });
  },
  window: { dispatchEvent: event => events.push(event) },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
});
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  return value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
}
function text(value) {
  if (Array.isArray(value)) return value.map(text).join('');
  return typeof value === 'string' ? value : value && typeof value === 'object' ? text(value.props?.children) : '';
}
const calls = [];
const base = {
  selectedProjectId: '17',
  viewMode: '3d',
  presentationComplete: true,
  hasThreeDModule: true,
  projectAssetCount: 7,
  onViewModeChange: mode => calls.push(mode),
  onToggleProjectAssets: () => calls.push('assets'),
  onToggleMultimedia: () => calls.push('multimedia'),
  onToggleWeather: () => calls.push('weather'),
  sceneAddMenuOpen: true,
};
for (const mode of ['design', '3d', '2d', 'combined']) {
  const guest = nodes(exportsValue.ProjectSceneToolbar({ ...base, canEditProject: false, viewMode: mode }));
  for (const restricted of ['Project Tour', 'Scenarios', 'Assembly Groups', 'Weather', ...(mode === '2d' ? ['Add Model'] : ['Shapes', 'Models', 'Characters', 'FarmBots', 'Beds', 'Plantings'])]) {
    const action = guest.find(node => ['Button', 'DropdownMenuItem'].includes(node.type) && text(node).trim() === restricted);
    assert(action, `Guest can discover ${restricted}`);
    assert.equal(action.props.disabled, true, `${restricted} requires edit access`);
    assert.equal(action.props.onClick, undefined);
    assert.equal(action.props.onSelect, undefined);
  }
  const save = guest.find(node => node.props['aria-label'] === 'Save ThreeD Project');
  assert.equal(save.props.disabled, true);
  assert.equal(save.props.onClick, undefined);
  assert(!guest.some(node => node.type === 'a' && node.props.href?.startsWith('/admin')));
  assert(guest.some(node => node.props.id === 'project-environment-controls-host'));
  assert(guest.find(node => node.props['data-testid'] === 'project-design-history').props.hidden);
  const views = guest.filter(node => node.type === 'Button' && node.props.title?.endsWith('View'));
  views.forEach(node => node.props.onClick());
  assert.deepEqual(calls.splice(0), ['design', '3d', '2d', 'combined']);
  guest.find(node => node.props['aria-label'] === 'Project Assets').props.onClick();
  guest.find(node => node.type === 'ProjectMultimediaToolbarButton').props.onClick();
  assert.deepEqual(calls.splice(0), ['assets', 'multimedia']);
  guest.find(node => node.type === 'DropdownMenuItem' && text(node).trim() === 'Simulations').props.onSelect();
  assert.equal(events.at(-1).type, 'threed:simulation-panel');
  assert.equal(events.at(-1).detail.projectId, 17);
}
const owner = nodes(exportsValue.ProjectSceneToolbar({ ...base, canEditProject: true }));
for (const label of ['Add', 'Tools', 'Project Tour', 'Scenarios', 'Assembly Groups', 'Weather']) {
  assert(owner.some(node => ['Button', 'DropdownMenuItem'].includes(node.type) && text(node).trim() === label), label);
}
assert(owner.some(node => node.props['aria-label'] === 'Save ThreeD Project'));
const headerExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/header/ProjectHeaderMenu.tsx', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText, {
  exports: headerExports,
  require(name) {
    if (name === 'react') return { useEffect() {}, useRef: () => ({ current: null }) };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    return new Proxy({}, { get: (_, key) => key });
  },
});
const header = nodes(headerExports.ProjectHeaderMenu({
  ...base,
  canEditProject: false,
  isOpen: true,
  environments: [{ id: 'model-1', name: 'Garden' }],
  onOpenProjectAssets: () => calls.push('header-assets'),
}));
for (const label of ['Choose Project', 'New Project', 'Save ThreeD Project', 'Project Tour', 'Environment Details', 'Project Settings & Admin']) {
  const action = header.find(node => node.type === 'Button' && text(node).trim() === label);
  assert(action, label);
  assert.equal(action.props.disabled, true);
  assert.equal(action.props.onClick, undefined);
}
header.find(node => node.type === 'Button' && text(node).includes('Project Assets')).props.onClick();
assert.deepEqual(calls.splice(0), ['header-assets']);
const page = fs.readFileSync('src/app/dashboard/scene/page.tsx', 'utf8');
assert(page.includes('canSave={canEditProject && !loading}'));
assert(page.includes('saveSimulationResults={canEditProject}'));
assert(page.includes('if (!selectedProjectId || !canEditProject || savingProjectMarkers'));
assert(page.includes('if (!canEditProject || !selectedProjectId || loading) return;'));
const map = fs.readFileSync('src/components/map/UnifiedMapView.tsx', 'utf8');
assert(map.includes('onModelMove={canEditProject ? handleMapModelMove : undefined}'), 'Guest map does not enable draggable Models');
console.log('Project guest/owner toolbar rendering, view order, callbacks and retained write guards passed (offline).');
