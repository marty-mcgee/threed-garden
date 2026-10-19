// Executes the actual service, routes and hook. All persistence/provider/auth boundaries are doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, URL, URLSearchParams, AbortController, AbortSignal, Buffer, Date, console,
    require(name) { assert(name in deps, `Unexpected import ${name}`); return deps[name]; }, ...globals });
  return exports;
}
const core = load('src/libraries/services/threed/project-weather-core.ts');
assert.equal(core.projectWeatherLocation(null, 0), null);
for (const value of ['', ' ', true, Infinity, 91]) assert.equal(core.projectWeatherLocation(value, 0), null);
assert.equal(core.projectWeatherLocation(0, 0).latitude, 0);
const observation = { main: { temp: 0, humidity: 0 }, wind: { speed: 0 }, dt: Date.now() / 1000 };
const zero = core.normalizeProjectWeather(observation);
assert.equal(zero.temperature, 0); assert.equal(zero.humidity, 0); assert.equal(zero.windSpeed, 0);
assert.equal(zero.rainfallInches, 0); assert.equal(zero.droughtWarning, false);
assert.throws(() => core.normalizeProjectWeather({ ...observation, main: { temp: 500, humidity: 10 } }));
assert.throws(() => core.normalizeProjectWeather({ ...observation, dt: 0 }));
assert.equal(core.normalizeProjectWeather({ ...observation, rain: { '1h': 25.4 } }).rainfallInches, 1);

function table(name, fields) { return Object.fromEntries([['name', name], ...fields.map(key => [key, { key }])]); }
const project = table('project', ['id', 'userId', 'originLatitude', 'originLongitude', 'metadata']);
const logs = table('logs', ['id', 'userId', 'recordedAt', 'temperature', 'humidity', 'rainfallInches', 'windSpeed', 'soilMoisture', 'sunlightHours', 'frostWarning', 'heatWarning', 'droughtWarning', 'source', 'rawData', 'createdAt', 'updatedAt']);
let projects = [{ id: 17, userId: 'owner', originLatitude: '0', originLongitude: '0' }];
let rows = [], writes = 0, providerCalls = 0, fetchMode = 'ok', session = { user: { id: 'owner' } };
const drizzle = {
  eq: (col, value) => row => row[col.key] === value,
  and: (...tests) => row => tests.every(test => test(row)), desc: col => col,
  sql: (parts, ...values) => {
    const text = parts.join('');
    if (text.includes('COUNT')) return { aggregate: 'count' };
    if (text.includes('AVG')) return { aggregate: 'avg', col: values[0] };
    if (text.includes("'coord' IS NOT NULL")) return row => row.rawData?.coord != null;
    if (text.includes('IS NULL')) return row => row.rawData?.projectWeather === undefined;
    if (text.includes('projectWeather')) return row => JSON.stringify(row.rawData?.projectWeather) === values[1];
    if (text.includes('OR')) return row => values.some(col => row[col.key] === true);
    throw Error('Unexpected SQL fixture: ' + text);
  },
};
function select(columns) {
  let source, predicate = () => true, limit = Infinity, offset = 0, order = [];
  const query = {
    from(value) { source = value; return query; }, where(value) { predicate = value; return query; },
    limit(value) { limit = value; return query; }, offset(value) { offset = value; return query; },
    orderBy(...value) { order = value; return query; }, for() { return query; },
    then(resolve, reject) {
      let found = (source === project ? projects : rows).filter(predicate);
      found = [...found].sort((a, b) => { for (const col of order) { if (a[col.key] < b[col.key]) return 1; if (a[col.key] > b[col.key]) return -1; } return 0; });
      let result;
      if (columns.count?.aggregate) result = [{ count: found.length }];
      else if (columns.avg?.aggregate) result = [{ avg: 0 }];
      else result = found.slice(offset, offset + limit).map(row => Object.fromEntries(Object.entries(columns).map(([key, col]) => [key, row[col.key]])));
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return query;
}
const db = {
  select,
  async transaction(fn) { return fn(db); },
  insert() { return { values(value) {
    const row = { ...value, id: rows.length + 100, createdAt: new Date() };
    const insert = () => { rows.push(row); writes++; return [row]; };
    return { then(resolve, reject) { return Promise.resolve(insert()).then(resolve, reject); }, returning() { return insert(); } };
  } }; },
  update(table) { return { set(value) { return { where(predicate) {
    const apply = () => { const found = (table === project ? projects : rows).filter(predicate); found.forEach(row => Object.assign(row, value)); writes += found.length; return found; };
    return { returning: apply, then(resolve, reject) { return Promise.resolve(apply()).then(resolve, reject); } };
  } }; } }; },
  delete() { return { where(predicate) { return { returning() { const found = rows.filter(predicate); rows = rows.filter(row => !predicate(row)); writes += found.length; return found; } }; } }; },
};
const env = { OPENWEATHER_API_KEY: 'fixture-key-do-not-log' };
const provider = load('src/libraries/services/threed/weather-provider.ts', {
  'server-only': {}, './project-weather-core': core,
}, { process: { env }, fetch: async (url, options) => {
  providerCalls++;
  assert.equal(url.origin, 'https://api.openweathermap.org'); assert.equal(url.searchParams.get('lat'), '0');
  assert.equal(url.searchParams.get('lon'), '0'); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
  if (fetchMode === 'error') throw Error('sensitive URL fixture-key-do-not-log');
  if (fetchMode === 'moved') projects[0].originLatitude = '1';
  return new Response(fetchMode === 'large' ? 'x'.repeat(70000) : JSON.stringify(observation));
} });
const service = load('src/libraries/services/threed/project-weather.ts', {
  'server-only': {}, 'drizzle-orm': drizzle, '@/libraries/db/client': { db },
  '@/libraries/schema/project': { project }, '@/libraries/schema/threed': { threedWeatherLogs: logs },
  './project-weather-core': core,
  './weather-provider': provider,
});
const next = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } };
const auth = { auth: async () => session };
const route = load('src/app/api/project/weather/route.ts', {
  'next/server': next, '@/libraries/auth': auth, '@/libraries/services/threed/project-weather': service,
});
const request = (id = '17', method = 'GET', origin = 'http://localhost:4444') => new Request(`http://localhost:4444/api/project/weather?projectId=${id}`, { method, headers: { origin } });

async function serverChecks() {
  session = null; assert.equal((await route.GET(request())).status, 401);
  session = { user: { id: 'stranger' } }; assert.equal((await route.GET(request())).status, 404);
  assert.equal((await route.POST(request('17', 'POST'))).status, 404);
  session = { user: { id: 'owner' } };
  for (const id of ['0', 'NaN', '17&projectId=18', '9007199254740992']) assert.equal((await route.GET(request(id))).status, 400);
  assert.equal((await route.POST(request('17', 'POST', 'https://foreign.example'))).status, 403);
  projects[0].originLatitude = null;
  assert.equal((await route.GET(request())).body.data.location.latitude, 39.3);
  assert.equal((await route.GET(request())).body.data.location.longitude, -123.5);
  assert.equal((await route.GET(request())).body.data.locationSource, 'module');
  assert.equal(providerCalls, 0); assert.equal(writes, 0); projects[0].originLatitude = '0';
  rows = [
    { id: 1, userId: null }, { id: 2, userId: 'stranger' }, { id: 3, userId: 'owner' },
    { id: 4, userId: 'owner', rawData: { projectWeather: { version: 1, projectId: 18, latitude: 0, longitude: 0 } } },
  ];
  assert.equal((await route.GET(request())).body.data.readings.length, 0);
  assert.equal(providerCalls, 0); assert.equal(writes, 0);
  env.OPENWEATHER_API_KEY = ''; assert.equal((await route.POST(request('17', 'POST'))).status, 503);
  env.OPENWEATHER_API_KEY = 'fixture-key-do-not-log';
  const result = await route.POST(request('17', 'POST'));
  assert.equal(result.status, 200); assert.equal(result.body.data.readings.length, 1);
  assert.equal(result.body.data.readings[0].temperature, 0); assert.equal(writes, 1);
  assert.equal(rows.at(-1).userId, 'owner'); assert.equal(rows.at(-1).rawData.projectWeather.projectId, 17);
  assert(!JSON.stringify(result).includes('fixture-key')); assert(!('rawData' in result.body.data.readings[0]));
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
  await route.POST(request('17', 'POST')); assert.equal(writes, 1); assert.equal(providerCalls, 1);
  rows.at(-1).createdAt = new Date(0);
  fetchMode = 'error'; const failed = await route.POST(request('17', 'POST'));
  assert.equal(failed.status, 502); assert(!JSON.stringify(failed).includes('fixture-key')); assert.equal(writes, 1);
  fetchMode = 'large'; assert.equal((await route.POST(request('17', 'POST'))).status, 502); assert.equal(writes, 1);
  fetchMode = 'moved'; assert.equal((await route.POST(request('17', 'POST'))).status, 409); assert.equal(writes, 1);
  assert.equal((await route.GET(request())).body.data.readings.length, 0); projects[0].originLatitude = '0';

  const legacyDeps = { 'next/server': next, 'drizzle-orm': drizzle, zod: require('zod'), '@/libraries/auth': auth,
    '@/libraries/db/client': { db }, '@/libraries/schema/threed': { threedWeatherLogs: logs },
    '@/libraries/schema': { threedWeatherLogs: logs }, '@/libraries/services/threed/project-weather': service };
  const legacy = load('src/app/api/threed/weather/route.ts', legacyDeps);
  const stats = load('src/app/api/threed/weather/stats/route.ts', legacyDeps);
  const retired = load('src/app/api/threed/weather/poll/route.ts', { 'next/server': next });
  assert.equal(retired.GET().status, 405); assert.equal(retired.POST().status, 405);
  session = null; assert.equal((await legacy.GET(request())).status, 401); assert.equal((await stats.GET()).status, 401);
  session = { user: { id: 'owner' } };
  const history = await legacy.GET(request()); assert.equal(history.status, 200);
  assert.equal(history.body.data.length, 3); assert(history.body.data.every(row => !('rawData' in row) && !('userId' in row)));
  assert.equal((await stats.GET()).body.data.total, 3);
  const edit = (id, body) => new Request(`http://localhost:4444/api/threed/weather?id=${id}`, { method: 'PUT', headers: { origin: 'http://localhost:4444' }, body: JSON.stringify(body) });
  assert.equal((await legacy.PUT(edit(2, { temperature: 10 }))).status, 404);
  assert.equal((await legacy.PUT(edit(rows.at(-1).id, { temperature: 10 }))).status, 404);
  assert.equal((await legacy.POST(edit(3, { userId: 'stranger', temperature: 10 }))).status, 400);
  assert.equal(writes, 1);
  fetchMode = 'ok';
  const poller = load('src/libraries/services/threed/WeatherPoller.ts', {
    './weather-provider': provider, './project-weather-core': core, '@/libraries/db/client': { db },
    '@/libraries/schema': { threedWeatherLogs: logs }, 'drizzle-orm': drizzle,
  }, { process: { env } });
  const current = await new poller.WeatherPoller().fetchCurrentWeather(0, 0);
  assert.equal(current.temperature, 0); assert.equal(current.rawData.main.temp, 0);
  assert.equal(current.source, 'openweathermap'); assert.equal(writes, 1);
  console.log('PASS: existing WeatherPoller and Project Weather call the same bounded server-only provider adapter; raw responses remain server-side and fetching alone does not persist.');

  const settings = load('src/app/api/project/weather/settings/route.ts', {
    '@/libraries/db/connection-diagnostics': { databaseConnectionDiagnostic: () => ({ code: 'MOCK' }) },
    'next/server': next, '@/libraries/auth': auth, '@/libraries/services/threed/project-weather': service,
  });
  const settingRequest = (body, origin = 'http://localhost:4444') => new Request('http://localhost:4444/api/project/weather/settings?projectId=17', {
    method: 'PATCH', headers: { origin }, body: JSON.stringify(body),
  });
  projects[0].metadata = { untouched: { physics: true } }; projects[0].originLatitude = null;
  const savedSetting = { version: 1, latitude: 0, longitude: 0 };
  session = null; assert.equal((await settings.GET(request())).status, 401);
  session = { user: { id: 'stranger' } }; assert.equal((await settings.PATCH(settingRequest({ expected: null, location: savedSetting }))).status, 404);
  session = { user: { id: 'owner' } };
  assert.equal((await settings.PATCH(settingRequest({ expected: null, location: savedSetting }, 'https://foreign.example'))).status, 403);
  assert.equal((await settings.PATCH(settingRequest({ expected: null, location: { ...savedSetting, latitude: 91 } }))).status, 400);
  assert.equal((await settings.PATCH(settingRequest({ expected: null, location: savedSetting, config: {} }))).status, 400);
  assert.equal((await settings.GET(request())).body.data.location.latitude, 39.3);
  const accepted = await settings.PATCH(settingRequest({ expected: null, location: savedSetting }));
  assert.equal(accepted.status, 200); assert.equal(accepted.body.data.locationSource, 'weather');
  assert.equal(projects[0].originLatitude, null); assert.equal(projects[0].originLongitude, '0');
  assert.equal(projects[0].metadata.untouched.physics, true);
  assert.equal((await settings.PATCH(settingRequest({ expected: null, location: { ...savedSetting, latitude: 2 } }))).status, 409);
  const weatherNow = await route.POST(request('17', 'POST')); assert.equal(weatherNow.status, 200);
  assert.equal(weatherNow.body.data.locationSource, 'weather');
  const cleared = await settings.PATCH(settingRequest({ expected: savedSetting, location: null }));
  assert.equal(cleared.status, 200); assert.equal(cleared.body.data.location.latitude, 39.3);
  assert.equal(projects[0].metadata.untouched.physics, true);
  const writesBeforeInheritance = writes;
  rows.push({ id: 900, userId: 'owner', source: 'openweathermap', recordedAt: new Date().toISOString(), rawData: { coord: { lat: 41, lon: -122 } } });
  rows.push({ id: 901, userId: 'stranger', source: 'openweathermap', recordedAt: new Date().toISOString(), rawData: { coord: { lat: 88, lon: 99 } } });
  const inherited = await settings.GET(request());
  assert.equal(inherited.body.data.location.latitude, 41); assert.equal(inherited.body.data.location.longitude, -122);
  assert.equal((await route.GET(request())).body.data.location.latitude, 41);
  assert.equal(writes, writesBeforeInheritance, 'Automatic population never saves settings or claims legacy logs');
  projects[0].metadata.weatherLocation = { version: 1, latitude: 7, longitude: 8 };
  assert.equal((await settings.GET(request())).body.data.location.latitude, 7, 'Explicit Project overrides remain authoritative');
  console.log('PASS: Settings and overlay automatically inherit existing owned Weather source coordinates, fall back to the shared 39.3/-123.5 module location, reject foreign sources and preserve explicit overrides without writes.');
  console.log('PASS: approved Weather Settings allow a separate location without Scene calibration, preserve unrelated metadata/origin, reject foreign/stale/invalid writes, enable provider updates and support explicit fallback.');
  console.log('PASS: actual Weather routes/service enforce owner, Project/location, read-only GET, same-origin POST, immutable scope, bounded provider responses, zero values, cooldown, stale-origin refusal and sanitized failures. Mock persistence/provider only.');
}

function hookChecks() {
  let slots = [], cursor = 0, effects = [], requests = [];
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) { const i = cursor++; slots[i] ??= value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useCallback(fn) { return fn; }, useEffect(fn) { effects.push(fn); },
  };
  const hook = load('src/components/map/hooks/useProjectWeather.ts', { react }, { fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })) });
  const render = id => { cursor = 0; effects = []; return hook.useProjectWeather(id); };
  const drain = () => new Promise(resolve => setImmediate(resolve));
  return (async () => {
    let state = render('17'); const cleanup = effects[0](); assert.equal(requests[0].options.method, 'GET');
    requests[0].resolve({ ok: true, json: async () => ({ success: true, data: { projectId: 17, readings: [zero] } }) }); await drain();
    state = render('17'); assert.equal(state.snapshot.projectId, 17);
    const update = state.update(); assert.equal(requests[1].options.method, 'POST');
    requests[1].resolve({ ok: false, json: async () => ({ error: 'Provider failed' }) }); await update;
    state = render('17'); assert.equal(state.snapshot.projectId, 17); assert.equal(state.error, 'Provider failed');
    void state.reload(); cleanup(); assert(requests[2].options.signal.aborted);
    state = render('18'); effects[0](); assert.equal(requests[3].options.method, 'GET');
    requests[3].resolve({ ok: true, json: async () => ({ success: true, data: { projectId: 18, readings: [] } }) }); await drain();
    requests[2].resolve({ ok: true, json: async () => ({ success: true, data: { projectId: 17, readings: [] } }) }); await drain();
    state = render('18'); assert.equal(state.snapshot.projectId, 18);
    console.log('PASS: actual Weather hook opens read-only, updates explicitly, preserves last reading on failure and rejects stale responses after close/Project switch.');
  })();
}
function overlayChecks() {
  const jsx = (type, props) => ({ type, props });
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  let updates = 0, closed = 0;
  const overlay = load('src/components/map/panels/ProjectWeatherOverlay.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': { CloudSun: 'icon', RefreshCw: 'icon', X: 'icon' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/map/hooks/useProjectWeather': { useProjectWeather: () => ({
      snapshot: { location: null, readings: [], providerConfigured: false }, busy: false, error: null,
      reload() {}, update() { updates++; },
    }) },
  });
  const tree = overlay.ProjectWeatherOverlay({ projectId: '17', onClose() { closed++; } });
  assert.equal(tree.props.id, 'project-weather-overlay');
  assert(nodes(tree).some(node => node.props?.href === '/admin/projects/17#weather-settings'));
  assert.equal(nodes(tree).find(node => node.props?.children === 'Update Weather').props.disabled, true);
  nodes(tree).find(node => node.props?.['aria-label'] === 'Close Project Weather').props.onClick();
  tree.props.onKeyDown({ key: 'Escape', stopPropagation() {} });
  assert.equal(closed, 2); assert.equal(updates, 0);
  const page = fs.readFileSync('src/app/dashboard/scene/page.tsx', 'utf8');
  assert(page.includes('canEditProject && !loading && selectedProjectId && weatherProjectId === selectedProjectId'));
  assert(page.includes('<ProjectWeatherOverlay key={selectedProjectId}'));
  console.log('PASS: actual overlay exposes missing-location guidance, disables provider updates when unavailable, supports Close/Escape and mounts only for the selected owned Project. Mocked UI.');
}
async function settingsFormChecks() {
  let slots = [], cursor = 0, effects = [], requests = [], navigation;
  const jsx = (type, props) => ({ type, props });
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  const react = {
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useEffect(fn, deps) { const i = cursor++, before = slots[i]; if (!before || deps.some((v, index) => v !== before.deps[index])) effects.push(() => { before?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  class Anchor { constructor() { this.pathname = '/admin/projects'; this.search = ''; this.target = ''; } hasAttribute() { return false; } }
  const editor = load('src/components/admin/projects/ProjectWeatherSettings.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': { CloudSun: 'icon' },
    '@/components/ui/button': { Button: 'Button' }, '@/components/ui/input': { Input: 'Input' },
    '@/libraries/services/threed/project-weather-core': core,
  }, {
    HTMLAnchorElement: Anchor,
    window: { location: { hash: '', pathname: '/admin/projects/17', search: '' }, confirm: () => false, addEventListener() {}, removeEventListener() {} },
    document: { addEventListener(type, fn) { if (type === 'click') navigation = fn; }, removeEventListener() {}, getElementById() { return null; } },
    fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })),
  });
  const render = () => { cursor = 0; effects = []; const tree = editor.ProjectWeatherSettings({ projectId: 17 }); effects.forEach(fn => fn()); return nodes(tree); };
  const drain = () => new Promise(resolve => setImmediate(resolve));
  let tree = render(); assert.equal(requests.length, 1); assert.equal(requests[0].options.method, 'GET');
  const baseline = { projectId: 17, setting: null, location: { latitude: 39.3, longitude: -123.5 }, locationSource: 'module', providerConfigured: true };
  requests[0].resolve({ ok: true, json: async () => ({ success: true, data: baseline }) }); await drain();
  tree = render(); assert.equal(tree.find(n => n.props?.['aria-label'] === 'Weather latitude').props.value, '39.3'); assert.equal(tree.find(n => n.props?.['aria-label'] === 'Weather longitude').props.value, '-123.5'); tree.find(n => n.props?.['aria-label'] === 'Weather latitude').props.onChange({ target: { value: '0' } });
  tree = render(); tree.find(n => n.props?.['aria-label'] === 'Weather longitude').props.onChange({ target: { value: '0' } });
  tree = render(); assert.equal(requests.length, 1, 'Edits never auto-save or fetch Weather');
  let prevented = false; navigation({ target: { closest: () => new Anchor() }, button: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
  assert.equal(prevented, true, 'Dirty form can cancel internal navigation');
  const save = tree.find(n => n.props?.children === 'Save Weather Settings'); assert.equal(save.props.disabled, false); save.props.onClick();
  assert.equal(requests[1].options.method, 'PATCH'); const body = JSON.parse(requests[1].options.body);
  assert.equal(body.expected, null); assert.equal(body.location.latitude, 0); assert.equal(body.location.longitude, 0);
  requests[1].resolve({ ok: false, json: async () => ({ error: 'Conflict' }) }); await drain();
  tree = render(); assert.equal(tree.find(n => n.props?.['aria-label'] === 'Weather latitude').props.value, '0');
  assert(tree.some(n => n.props?.role === 'alert' && n.props.children === 'Conflict'));
  tree.find(n => n.props?.children === 'Discard').props.onClick(); tree = render();
  assert.equal(tree.find(n => n.props?.['aria-label'] === 'Weather latitude').props.value, '39.3');
  assert.equal(tree.find(n => n.props?.children === 'Save Weather Settings').props.disabled, true);
  console.log('PASS: actual Admin Weather Settings form loads without writes, saves explicitly with an expected baseline, retains failed drafts, guards navigation and supports Discard. Mocked UI/network.');
}
serverChecks().then(hookChecks).then(overlayChecks).then(settingsFormChecks).catch(error => { console.error(error); process.exitCode = 1; });
