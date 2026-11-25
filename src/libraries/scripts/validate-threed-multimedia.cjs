// Actual read service, media controller and Simulation lifecycle with offline ports.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');

function load(file, mocks = {}, globals = {}, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    console,
    Error,
    URL,
    URLSearchParams,
    AbortController,
    AbortSignal,
    Response,
    Request,
    Date,
    TextEncoder,
    ...globals,
    require(name) {
      if (name === '@/libraries/utils/input-validation') return require('../utils/input-validation.ts');
      if (name in mocks) return mocks[name];
      if (name === 'server-only') return {};
      if (['drizzle-orm', 'drizzle-orm/pg-core', 'node:crypto'].includes(name)) return require(name);
      assert(!name.includes('/db/') && name !== '@/libraries/auth', `Unmocked live boundary: ${name}`);
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
      assert(target, `Unexpected dependency ${name}`);
      const resolved = [target, target + '.ts', target + '.tsx', path.join(target, 'index.ts')].find(value => fs.existsSync(value) && fs.statSync(value).isFile());
      assert(resolved, name);
      return load(resolved, mocks, globals, cache);
    },
  });
  return exports;
}

const root = 'src/libraries/services/threed/';
const contract = load(root + 'multimedia/scene-multimedia-contract.ts');
const runtime = load(root + 'multimedia/scene-multimedia-player.ts');
const simulationInput = load(root + 'simulations/simulation-input.ts');
const mediaSimulation = load(root + 'simulations/multimedia-simulation.ts');
const simulationRunner = load(root + 'simulations/soccer-simulation-runner.ts');
const schema = load('src/libraries/schema/index.ts');
const dialect = new pg.PgDialect();
const flush = () => new Promise(resolve => setImmediate(resolve));
const clone = value => JSON.parse(JSON.stringify(value));
const baseCommand = {
  projectId: 7,
  markerId: 'radio',
  albumId: 28,
  action: 'playMultimedia',
};
const track = (id, number = id) => ({
  id,
  albumId: 28,
  title: `Track ${id}`,
  fileUrl: `https://media.invalid/${id}.mp3`,
  fileType: 'audio/mpeg',
  duration: 30,
  trackNumber: number,
});
function response(query, tracks = [track(21), track(22)], hasMore = false) {
  return {
    projectId: query.projectId,
    markerId: query.markerId,
    sourceType: 'model',
    sourceId: 5,
    albums: [{ id: 28, title: 'TRADE', artist: 'Example', coverArt: '/art.png' }],
    albumId: query.albumId,
    tracks,
    offset: query.offset,
    hasMore,
  };
}
const markers = [
  { id: 'radio', type: 'models', name: 'Design: Radio', isActive: true, isVisible: true, data: { id: 5, projectMarkerId: 105 } },
  { id: 'kate', type: 'characters', name: 'Farmer Kate', isActive: true, isVisible: true, data: { id: 9, projectMarkerId: 109, isMovable: true } },
  { id: 'other-radio', type: 'models', name: 'Other radio', isActive: true, isVisible: true, data: { id: 6, projectMarkerId: 106 } },
];
function scene() {
  return {
    projectId: 7,
    ready: true,
    allowed: true,
    busy: false,
    markers: clone(markers),
    layers: new Set(['models', 'characters']),
    settledCharacters: new Set(['kate']),
    controlledCharacterId: 9,
    target: { markerId: 'radio', type: 'models', id: 5 },
    groups: [],
    sensorMembers: [],
    position: () => ({ x: 0, y: 0, z: 0 }),
    counts: () => ({}),
  };
}
function playerFixture() {
  let currentScene = scene();
  let projectId = 7;
  let latest, plays = 0, pauses = 0;
  let read = async query => response(query);
  let projectRead = async query => response(query);
  let play = async () => { media.paused = false; plays++; };
  const requests = [];
  const projectRequests = [];
  const media = {
    src: '',
    currentTime: 0,
    paused: true,
    play: () => play(),
    pause() { pauses++; this.paused = true; },
    load() { this.currentTime = 0; },
    removeAttribute() { this.src = ''; },
  };
  const player = new runtime.SceneMultimediaPlayer({
    projectId: () => projectId,
    readProject: (query, signal) => { projectRequests.push({ query, signal }); return projectRead(query, signal); },
    read: (query, signal) => { requests.push({ query, signal }); return read(query, signal); },
    media: () => media,
    scene: () => currentScene,
    update: (state, busy, error) => { latest = { state, busy, error }; },
  });
  return {
    player,
    media,
    requests,
    projectRequests,
    get latest() { return latest; },
    get plays() { return plays; },
    get pauses() { return pauses; },
    setRead(value) { read = value; },
    setProjectRead(value) { projectRead = value; },
    setProjectId(value) { projectId = value; },
    setPlay(value) { play = value; },
    setScene(value) { currentScene = value; },
  };
}

async function checkReferenceMedia() {
  const { DatabaseSync } = require('node:sqlite');
  const { drizzle } = require('drizzle-orm/pg-proxy');
  const memory = new DatabaseSync(':memory:');
  try {
    memory.exec(`
      CREATE TABLE project (id INTEGER PRIMARY KEY, user_id TEXT);
      CREATE TABLE multimedia (id INTEGER PRIMARY KEY, user_id TEXT, is_active INTEGER);
      CREATE TABLE project_multimedia (project_id INTEGER, multimedia_id INTEGER, user_id TEXT, is_active INTEGER);
      CREATE TABLE project_assets (id INTEGER PRIMARY KEY, project_id INTEGER, module_id INTEGER, user_id TEXT,
        module_type TEXT, asset_type TEXT, asset_id INTEGER, is_active INTEGER);
      CREATE TABLE multimedia_media (id INTEGER PRIMARY KEY, user_id TEXT, file_name TEXT, file_url TEXT,
        file_type TEXT, is_active INTEGER);
      CREATE TABLE multimedia_media_projects (project_id INTEGER, media_id INTEGER, UNIQUE(project_id, media_id));
      INSERT INTO project VALUES (18,'marty'),(19,'other');
      INSERT INTO multimedia VALUES (1,'marty',1),(2,'marty',0),(3,'marty',1),(4,'marty',1);
      INSERT INTO project_multimedia VALUES (18,1,'marty',1),(18,2,'marty',1),(18,3,'marty',0),(18,4,'marty',1);
      INSERT INTO multimedia_media VALUES
        (1,'marty','A.png','https://media.invalid/a.png','image/png',1),
        (2,'marty','B.png','https://media.invalid/b.png','image/png',1),
        (3,'marty','C.png','https://media.invalid/c.png','image/png',1),
        (4,'marty','D.png','https://media.invalid/d.png','image/png',1),
        (5,'other','E.png','https://media.invalid/e.png','image/png',1);
      INSERT INTO project_assets VALUES
        (1,18,1,'marty','multimedia','multimedia_media',1,1),
        (2,18,1,'marty','multimedia','multimedia_media',2,1),
        (3,18,1,'marty','multimedia','multimedia_media',5,1),
        (4,18,1,'marty','multimedia','multimedia_media',4,0),
        (5,18,2,'marty','multimedia','multimedia_media',4,1),
        (6,18,3,'marty','multimedia','multimedia_media',4,1),
        (7,18,1,'marty','multimedia','multimedia_albums',4,1),
        (8,18,4,'marty','multimedia','multimedia_media',1,1);
      INSERT INTO multimedia_media_projects VALUES (18,2),(18,3),(19,4);
    `);
    const connection = drizzle(async (sql, params) => {
      // The same SELECTs run in memory. PostgreSQL row locks and ILIKE syntax are adapted here.
      const statement = memory.prepare(sql.replace(/ for (share|update)\b/gi, '').replace(/\bilike\b/gi, 'like'));
      statement.setReturnArrays(true);
      const bindings = Object.fromEntries(params.map((value, i) => ['$' + (i + 1), typeof value === 'boolean' ? Number(value) : value]));
      return { rows: statement.all(bindings) };
    });
    let userId = 'marty';
    const api = load('src/app/api/project/reference-media/route.ts', {
      '@/libraries/auth': { auth: async () => userId ? { user: { id: userId } } : null },
      '@/libraries/db/client': { db: { transaction: work => work(connection) } },
      '@/libraries/schema/project': schema,
      '@/libraries/schema/multimedia': schema,
    });
    const get = query => api.GET(new Request('https://fixture.invalid/api?projectId=18&' + query));
    const assigned = await get('');
    assert.equal(assigned.status, 200);
    assert.equal(assigned.headers.get('cache-control'), 'private, no-store');
    const items = (await assigned.json()).items;
    assert.deepEqual(items.map(item => item.id), [1, 2, 3], 'Admin and direct assignments must share one deduplicated list');
    assert.deepEqual(items.map(item => [item.direct, item.viaModule]), [[false,true],[true,true],[true,false]]);
    assert.equal(items[0].fileUrl, 'https://media.invalid/a.png');
    for (const item of items) {
      assert.deepEqual(await (await get('mediaId=' + item.id)).json(), { items: [item], hasMore: false });
    }
    assert.deepEqual((await (await get('mediaId=4')).json()).items, [], 'Restoring a Project file requires current assignment');
    assert.deepEqual((await (await get('mediaId=5')).json()).items, [], 'A foreign-owned Media file cannot be restored');
    assert.equal((await get('mediaId=invalid')).status, 400);
    assert.deepEqual((await (await get('offset=2')).json()).items.map(item => item.id), [3], 'Page the deduplicated results');
    assert.deepEqual((await (await get('search=a.png')).json()).items.map(item => item.id), [1]);
    const library = (await (await get('library=1')).json()).items;
    assert.deepEqual(library.map(item => [item.id, Boolean(item.assigned)]), [[1,true],[2,true],[3,true],[4,false]]);
    assert.deepEqual((await (await get('mediaId=4&library=1')).json()).items, [library[3]], 'Explicit library previews resolve the owned file without assigning it');
    assert.deepEqual((await (await get('mediaId=5&library=1')).json()).items, [], 'An explicit library preview cannot restore a foreign file');
    const change = (method, id) => api[method](new Request('https://fixture.invalid/api?projectId=18&mediaId=' + id, { method }));
    assert.equal((await change('PUT', 1)).status, 200);
    assert.equal((await change('DELETE', 1)).status, 409, 'A module assignment is managed by its owner');
    assert.equal((await change('DELETE', 2)).status, 200);
    assert.equal((await change('DELETE', 3)).status, 200);
    assert.deepEqual((await (await get('mediaId=3')).json()).items, [], 'A removed assignment cannot reopen a saved viewer');
    assert.equal((await change('PUT', 4)).status, 200);
    assert.equal((await change('PUT', 4)).status, 200, 'Adding the same direct reference twice is safe');
    assert.deepEqual((await (await get('')).json()).items.map(item => item.id), [1, 2, 4]);
    assert.equal((await change('PUT', 5)).status, 404);
    userId = 'other';
    assert.equal((await get('')).status, 404);
    assert.equal((await get('mediaId=1')).status, 404);
    assert.equal((await get('mediaId=5&library=1')).status, 404, 'Library restore still requires ownership of this Project');
    userId = null;
    assert.equal((await get('')).status, 401);
    assert.equal((await get('mediaId=1')).status, 401);
  } finally {
    memory.close();
  }
  console.log('PASS Project reference Media: Admin assignments, direct links, previews, search, library membership and owner isolation (in-memory SQL).');
}

function renderedNodes(node) {
  if (Array.isArray(node)) return node.flatMap(renderedNodes);
  if (!node?.props) return [];
  return [node, ...renderedNodes(node.props.children)];
}

function mediaHookFixture() {
  const slots = [];
  const effects = [];
  let slot = 0;
  const changed = (previous, deps) => !previous || deps.some((dep, i) => dep !== previous.deps[i]);
  const hooks = {
    createContext: () => ({ Provider: 'context-provider' }),
    useId: () => 'media-title',
    useRef: initial => slots[slot++] ??= { current: initial },
    useState(initial) {
      const index = slot++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useCallback(fn, deps) {
      const index = slot++;
      if (changed(slots[index], deps)) slots[index] = { deps, fn };
      return slots[index].fn;
    },
    useEffect(effect, deps) {
      const index = slot++;
      const previous = slots[index];
      if (changed(previous, deps)) effects.push(() => {
        previous?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      });
    },
  };
  hooks.useLayoutEffect = hooks.useEffect;
  return {
    hooks,
    render(component) { slot = 0; return component(); },
    commit() { for (const run of effects.splice(0)) run(); },
    unmount() { for (const entry of slots) entry?.cleanup?.(); },
  };
}

function checkMediaOverlay() {
  const fixture = mediaHookFixture();
  let closed = 0;
  let focused = 0;
  let capture;
  const initialView = { left: 125, top: 70, width: 800, height: 410, zoom: 75 };
  const onRegisterView = read => { capture = read; };
  const document = { body: {} };
  const viewport = { clientWidth: 1280, clientHeight: 800 };
  const listeners = new Map();
  let capturedPointer = null;
  const photoViewport = {
    clientWidth: 640,
    clientHeight: 320,
    scrollWidth: 640,
    scrollHeight: 320,
    scrollLeft: 0,
    scrollTop: 0,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 320 }),
    addEventListener(type, fn, options) {
      if (type === 'wheel') assert.equal(options?.passive, false, 'The photo can consume wheel zoom');
      assert(!listeners.has(type), 'Only one active ' + type + ' listener is needed');
      listeners.set(type, fn);
    },
    removeEventListener(type, fn) {
      assert.equal(listeners.get(type), fn);
      listeners.delete(type);
    },
    setPointerCapture(id) { capturedPointer = id; },
    hasPointerCapture(id) { return capturedPointer === id; },
    releasePointerCapture(id) { assert.equal(capturedPointer, id); capturedPointer = null; },
  };
  const jsx = (type, props) => ({ type, props });
  const { ProjectMediaViewer } = load('src/components/map/panels/ProjectMediaViewer.tsx', {
    react: fixture.hooks,
    'react-dom': { createPortal(content, target) { assert.equal(target, document.body); return content; } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': {},
    '@/components/ui/button': { Button: 'button' },
  }, {
    document,
    ResizeObserver: class { observe() {} disconnect() {} },
    HTMLElement: class {},
  });
  function render(name, kind, presented = true) {
    const src = 'https://media.invalid/' + name;
    const tree = fixture.render(() => ProjectMediaViewer({
      name,
      kind,
      src,
      presented,
      initialView,
      onRegisterView,
      onClose: () => { closed++; },
    }));
    tree.props.ref.current = viewport;
    const nodes = renderedNodes(tree);
    const close = nodes.find(node => node.props['aria-label'] === 'Close Media viewer');
    close.props.ref.current = { focus: () => { focused++; } };
    const region = nodes.find(node => node.props['aria-label'] === 'Photo viewport');
    if (region) region.props.ref.current = photoViewport;
    fixture.commit();
    const dialog = nodes.find(n => n.props.role === 'dialog');
    assert(nodes.some(n => n.props.id === dialog.props['aria-labelledby'] && n.props.children === name));
    return { nodes, dialog, src, portal: tree.props };
  }
  const photo = (presented = true) => render('plan.jpg', 'image', presented);
  function button(view, label) {
    const control = view.nodes.find(node => node.type === 'button' && node.props['aria-label'] === label);
    assert(control, 'Expected a button labelled ' + label);
    return control.props;
  }
  function expectZoom(view, percent) {
    const readout = view.nodes.find(node => node.type === 'output');
    assert.equal([].concat(readout?.props.children).join(''), percent + '%');
    const image = view.nodes.find(node => node.type === 'img');
    assert.equal(image.props.style.width, `min(${percent}cqw, ${percent * 2}cqh)`, 'The rendered image scales from its fitted 2:1 dimensions');
  }
  const loading = photo(false);
  assert(loading.portal.hidden && loading.portal.inert, 'The portalled dialog stays hidden and inactive during Project loading');
  assert.equal(focused, 0, 'Preloading the photo does not take focus');
  const image = loading.nodes.find(node => node.type === 'img' && node.props.alt === 'plan.jpg' && node.props.src === loading.src);
  assert(image, 'The saved image is mounted and can load during Project preparation');
  image.props.onLoad({ currentTarget: { naturalWidth: 1600, naturalHeight: 800 } });
  expectZoom(photo(false), 75);
  assert.deepEqual(clone(capture()), initialView, 'Save preserves geometry and zoom during Project preparation');
  const released = photo();
  assert(!released.portal.hidden && !released.portal.inert, 'The dialog becomes visible and interactive when the Project is presented');
  assert.equal(focused, 1, 'Focus moves to the viewer only when the user can see it');
  expectZoom(released, 75);
  assert.deepEqual(clone(capture()), initialView, 'A fresh viewer restores the saved position, size and zoom');
  button(photo(), 'Fit image').onClick();
  const initial = photo();
  expectZoom(initial, 100);
  button(initial, 'Zoom in').onClick();
  const zoomed = photo();
  expectZoom(zoomed, 125);
  assert.deepEqual(zoomed.dialog.props.style, initial.dialog.props.style, 'Image zoom preserves the viewer frame');
  const resize = button(zoomed, 'Resize Media viewer');
  const keyEvent = key => ({ key, preventDefault() {}, stopPropagation() {} });
  resize.onKeyDown(keyEvent('ArrowRight'));
  const wider = photo();
  assert(wider.dialog.props.style.width > initial.dialog.props.style.width, 'Keyboard resizing changes the rendered width');
  expectZoom(wider, 125);
  assert.deepEqual(clone(capture()), { ...wider.dialog.props.style, zoom: 125 }, 'Save captures the latest resized and zoomed view');
  const pointer = {
    pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0,
    currentTarget: { setPointerCapture(id) { assert.equal(id, 1); } },
  };
  const handle = wider.nodes.find(n => n.props['aria-label'] === 'Resize Media viewer').props;
  handle.onPointerDown(pointer);
  handle.onPointerMove({ ...pointer, clientX: 10000, clientY: 10000 });
  const enlarged = photo().dialog.props.style;
  assert.equal(enlarged.left + enlarged.width, viewport.clientWidth);
  assert.equal(enlarged.top + enlarged.height, viewport.clientHeight);
  for (let percent = 150; percent <= 400; percent += 25) {
    button(photo(), 'Zoom in').onClick();
    expectZoom(photo(), percent);
  }
  assert.equal(button(photo(), 'Zoom in').disabled, true);
  button(photo(), 'Fit image').onClick();
  expectZoom(photo(), 100);
  for (const percent of [75, 50, 25]) {
    button(photo(), 'Zoom out').onClick();
    expectZoom(photo(), percent);
  }
  assert.equal(button(photo(), 'Zoom out').disabled, true);
  function photoEvent(fields) {
    return {
      clientX: 180,
      clientY: 120,
      currentTarget: photoViewport,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      ...fields,
    };
  }
  function wheel(fields) {
    const event = photoEvent({ deltaMode: 0, deltaX: 0, deltaY: 100, ...fields });
    listeners.get('wheel')(event);
    return event;
  }
  const consumed = event => assert(event.defaultPrevented && event.stopped, 'Zoom consumes the photo gesture');
  consumed(wheel({}));
  expectZoom(photo(), 25);
  button(photo(), 'Fit image').onClick();
  photo();
  consumed(wheel({ deltaY: -100 }));
  expectZoom(photo(), 125);
  consumed(wheel({ deltaMode: 1, deltaY: 3 }));
  expectZoom(photo(), 100);
  assert(!wheel({ shiftKey: true }).defaultPrevented);
  assert(!wheel({ deltaX: 100, deltaY: 0 }).defaultPrevented);
  expectZoom(photo(), 100);
  const mouse = {
    pointerId: 23,
    pointerType: 'mouse',
    isPrimary: true,
    button: 1,
    buttons: 4,
  };
  function pointerEvent(handler, overrides = {}) {
    const region = photo().nodes.find(node => node.props['aria-label'] === 'Photo viewport');
    const event = photoEvent({ ...mouse, ...overrides });
    region.props[handler](event);
    return event;
  }
  assert(!pointerEvent('onPointerDown', { button: 0, buttons: 1 }).defaultPrevented);
  assert.equal(capturedPointer, null);
  consumed(pointerEvent('onPointerDown'));
  assert.equal(capturedPointer, mouse.pointerId);
  pointerEvent('onPointerMove', { pointerId: 99, clientY: 96, button: -1 });
  expectZoom(photo(), 100);
  pointerEvent('onPointerMove', { clientY: 96, button: -1 });
  expectZoom(photo(), 125);
  pointerEvent('onPointerMove', { clientY: 120, button: -1 });
  expectZoom(photo(), 100);
  pointerEvent('onPointerUp', { buttons: 0 });
  assert.equal(capturedPointer, null);
  pointerEvent('onPointerMove', { clientY: 96, button: -1 });
  expectZoom(photo(), 100);
  consumed(pointerEvent('onPointerDown'));
  pointerEvent('onPointerCancel');
  pointerEvent('onPointerMove', { clientY: 96, button: -1 });
  expectZoom(photo(), 100);
  const movie = render('walkthrough.mp4', 'video');
  assert(!listeners.has('wheel'), 'Closing the photo removes its wheel listener');
  assert(movie.nodes.some(n => n.type === 'video' && n.props.src === movie.src && n.props.controls && n.props.playsInline));
  assert(!movie.nodes.some(node => ['Zoom in', 'Zoom out', 'Fit image'].includes(node.props['aria-label'])), 'Zoom is specific to photos');
  movie.nodes.find(n => n.props['aria-label'] === 'Close Media viewer').props.onClick();
  movie.dialog.props.onKeyDown(keyEvent('Escape'));
  assert.equal(closed, 2);
  console.log('PASS Project Media viewer: hidden and inert preload, deferred focus, saved frame, wheel and middle-button zoom, viewer resizing, native video controls, Close and Escape (offline React fixture).');
}

async function checkSavedReferenceViewer() {
  const fixture = mediaHookFixture();
  const jsx = (type, props) => ({ type, props });
  let capture;
  let presentationReleased = true;
  let session = { status: 'authenticated', data: { user: { id: 'marty' } } };
  let props = { projectId: 18, onRegisterWorkspace: read => { capture = read; } };
  const requests = [];
  const { SceneMultimediaProvider } = load('src/components/map/multimedia/SceneMultimediaProvider.tsx', {
    react: fixture.hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next-auth/react': { useSession: () => session },
    'react-dom': {},
    'lucide-react': {},
    '@/components/ui/slider': {},
    '@/components/ui/button': { Button: 'button' },
    '../panels/ProjectMediaViewer': { ProjectMediaViewer: 'reference-viewer' },
    '../presentation/ProjectPresentationBoundary': { useProjectPresentationReleased: () => presentationReleased },
  }, {
    window: Object.assign(new EventTarget(), { location: { origin: 'https://fixture.invalid' } }),
    crypto: require('node:crypto').webcrypto,
    setInterval: () => 1,
    clearInterval() {},
    fetch(url, init) {
      return new Promise(resolve => requests.push({ url: new URL(url, 'https://fixture.invalid'), init, resolve }));
    },
  });
  function render() {
    const tree = fixture.render(() => SceneMultimediaProvider(props));
    fixture.commit();
    return {
      actions: tree.props.value,
      viewer: renderedNodes(tree).find(node => node.type === 'reference-viewer')?.props,
      alert: renderedNodes(tree).find(node => node.props.role === 'alert'),
    };
  }
  const first = { id: 3, name: 'Plan.jpg', kind: 'image', src: 'https://media.invalid/plan.jpg' };
  const movie = { id: 4, name: 'Walkthrough.mp4', kind: 'video', src: 'https://media.invalid/tour.mp4' };
  const view = { left: 125, top: 70, width: 800, height: 410, zoom: 125 };
  render().actions.openReference(first);
  const photo = render().viewer;
  assert.equal(photo.src, first.src);
  photo.onRegisterView(() => view);
  const selection = clone(capture());
  assert.deepEqual(selection.reference, { mediaId: first.id, view }, 'Capture includes only the stable Media ID and presentation');
  photo.onClose();
  assert.equal(render().viewer, undefined);
  assert.equal(capture().reference, undefined, 'Saving a closed file clears the file overlay');

  const saved = { open: false, ...selection };
  function reopen(projectId, workspace = saved) {
    props = { ...props, projectId, initialWorkspace: workspace, workspaceSavedAt: 'fixture-save' };
    render();
    return render();
  }
  function lookup(projectId, mediaId) {
    const request = requests.shift();
    assert(request, 'Expected the saved Media lookup');
    assert.equal(request.url.pathname, '/api/project/reference-media');
    assert.equal(request.url.searchParams.get('projectId'), String(projectId));
    assert.equal(request.url.searchParams.get('mediaId'), String(mediaId));
    return request;
  }
  const respond = (request, items) => request.resolve(Response.json({ items, hasMore: false }));
  const item = { id: first.id, fileName: 'Renamed plan.jpg', fileType: 'image/jpeg', fileUrl: 'https://media.invalid/new-plan.jpg', assigned: 18, direct: true, viaModule: false };
  reopen(19, { open: false, albumId: null, trackId: null });
  assert.equal(requests.length, 0, 'A legacy snapshot opens no reference file');
  presentationReleased = false;
  reopen(18);
  const restore = lookup(18, first.id);
  assert.deepEqual(clone(capture().reference), selection.reference, 'Saving during the lookup preserves the pending reference');
  respond(restore, [item]);
  await flush();
  const preloaded = render().viewer;
  assert.equal(preloaded.src, item.fileUrl, 'The file can start loading while the Project assets are pending');
  assert.equal(preloaded.presented, false, 'An early lookup cannot present the restored photo');
  assert.deepEqual(clone(capture().reference), selection.reference);
  presentationReleased = true;
  const restored = render().viewer;
  assert.equal(restored.presented, true);
  assert.equal(restored.name, item.fileName);
  assert.equal(restored.src, item.fileUrl, 'The restored file URL comes from the current Project response');
  assert.deepEqual(clone(restored.initialView), view);

  presentationReleased = false;
  const secondProject = reopen(19);
  assert(!secondProject.viewer, 'Switching Projects clears the previous photo immediately');
  const late = lookup(19, first.id);
  presentationReleased = true;
  assert(!render().viewer, 'Project readiness alone cannot reveal the previous file while the new lookup is pending');
  secondProject.actions.openReference(movie);
  render();
  respond(late, [item]);
  await flush();
  assert.equal(render().viewer.kind, 'video', 'Delayed restoration cannot replace a manually chosen video');
  assert.equal(capture().reference.mediaId, movie.id);
  reopen(20);
  const previousProject = lookup(20, first.id);
  reopen(21);
  const removed = lookup(21, first.id);
  respond(previousProject, [item]);
  respond(removed, []);
  await flush();
  assert(!render().viewer, 'An unavailable Media record or stale reply cannot open a file in the new Project');
  assert.equal(capture().reference, undefined);
  presentationReleased = false;
  reopen(18, { ...saved, reference: { mediaId: movie.id, library: true } });
  const library = lookup(18, movie.id);
  assert.equal(library.url.searchParams.get('library'), '1');
  presentationReleased = true;
  assert(!render().viewer);
  respond(library, [{ id: movie.id, fileName: movie.name, fileType: 'video/mp4', fileUrl: movie.src, assigned: null, direct: false, viaModule: false }]);
  await flush();
  const restoredVideo = render().viewer;
  assert.equal(restoredVideo.kind, 'video', 'An owner library video is restored as a video');
  assert.equal(restoredVideo.presented, true, 'A late video lookup can present after Project readiness');
  render().viewer.onClose();
  render();
  const closed = { open: false, ...clone(capture()) };
  assert(!closed.reference);
  reopen(19, closed);
  reopen(18, closed);
  assert(!render().viewer);
  assert.equal(requests.length, 0, 'Reopening a Project saved after closing the file skips the lookup');
  presentationReleased = false;
  reopen(19);
  lookup(19, first.id).resolve(Response.json({}, { status: 503 }));
  await flush();
  assert(!render().alert, 'A transient lookup failure does not cover the Project loading presentation');
  presentationReleased = true;
  const failed = render();
  assert(failed.alert);
  assert(!failed.viewer);
  assert.deepEqual(clone(capture().reference), selection.reference, 'Transient read failure retains the saved reference');
  const retry = renderedNodes(failed.alert).find(node => node.type === 'button' && node.props.children === 'Retry');
  retry.props.onClick();
  render();
  respond(lookup(19, first.id), [item]);
  await flush();
  assert.equal(render().viewer.src, item.fileUrl, 'Retry can open the previously unavailable reference');
  session = { status: 'unauthenticated', data: null };
  assert(!render().viewer, 'Signing out immediately hides the owner’s file');
  assert(!capture().reference);
  assert.equal(requests.length, 0);
  fixture.unmount();
  assert.equal(capture, null);
  console.log('PASS Project reference overlay: both orders of lookup and Project readiness, scoped restore, capture, close, removed assignments, deferred retry and stale replies (offline provider fixture).');
}

async function checkReferenceViewer() {
  const states = [], effects = [];
  let slot = 0;
  const jsx = (type, props) => ({ type, props });
  const items = ['first.jpg', 'second.jpg', 'third.jpg'].map((fileName, i) => ({
    id: i + 1, fileName, fileType: 'image/jpeg', fileUrl: 'https://media.invalid/' + fileName,
    direct: i === 1, viaModule: i !== 1, assigned: 18,
  }));
  const photos = [...items];
  items.push({
    id: 4, fileName: 'walkthrough.mp4', fileType: 'video/mp4', fileUrl: 'https://media.invalid/walkthrough.mp4',
    direct: true, viaModule: false, assigned: 18,
  });
  const opened = [];
  const viewer = load('src/components/map/panels/ProjectReferenceMedia.tsx', {
    '../multimedia/SceneMultimediaProvider': { useSceneMultimedia: () => ({ projectId: 18, openReference: item => opened.push(item) }) },
    react: {
      useState(initial) {
        const index = slot++;
        if (!(index in states)) states[index] = initial;
        return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
      },
      useEffect: fn => effects.push(fn),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
  }, {
    fetch: async () => Response.json({ items, hasMore: false }),
    window: Object.assign(new EventTarget(), { location: { origin: 'https://fixture.invalid' } }),
  });
  function render(manage) {
    slot = 0;
    const tree = viewer.ProjectReferenceMedia({ projectId: '18', search: '', manage });
    return renderedNodes(tree);
  }
  render(false);
  const cleanup = effects.map(effect => effect());
  await flush();
  const overlay = render(false);
  assert.deepEqual(overlay.filter(n => n.type === 'img').map(n => n.props.src), photos.map(i => i.fileUrl));
  assert(!overlay.some(n => n.props.children === 'Add Media' || n.props.children === 'Remove'));
  function openItem(nodes, item, kind) {
    const trigger = nodes.find(n => n.type === 'button' && Array.isArray(n.props.children) &&
      n.props.children.some(child => child?.props?.children === item.fileName));
    assert(trigger, 'A named button opens ' + item.fileName);
    trigger.props.onClick({ currentTarget: { focus() {} } });
    assert.deepEqual(clone(opened.at(-1)), { id: item.id, name: item.fileName, src: item.fileUrl, kind });
  }
  openItem(overlay, photos[0], 'image');
  const assets = render(true);
  openItem(assets, items[3], 'video');
  assert(!assets.some(n => n.type === 'a' && n.props.href === items[3].fileUrl));
  assert(assets.some(n => n.props['aria-label'] === 'Remove: second.jpg'));
  assert.equal(assets.filter(n => n.props.children === 'Assigned in Admin').length, 2);
  cleanup.forEach(fn => fn?.());
  console.log('PASS: assigned photos retain thumbnails and controls; photo and video buttons open the shared Project Media viewer (offline React fixture).');
}

async function checkProjectPreview() {
  let accessible = true, assigned = true, rank = 50;
  const queries = [];
  const db = {
    select: fields => chain(fields),
    selectDistinct: fields => chain(fields),
    async execute(value) {
      const query = dialect.sqlToQuery(value);
      queries.push({ table: 'rank', ...query });
      assert(query.params.includes('owner') && query.params.includes(28));
      return { rows: [{ position: rank }] };
    },
  };
  function chain(fields) {
    const record = { fields, joins: [], offset: 0 };
    const builder = {
      from(table) { record.table = orm.getTableName(table); return this; },
      innerJoin(table, condition) { record.joins.push({ table: orm.getTableName(table), ...dialect.sqlToQuery(condition) }); return this; },
      where(condition) { Object.assign(record, dialect.sqlToQuery(condition)); return this; },
      limit(value) { record.limit = value; return this; },
      offset(value) { record.offset = value; return this; },
      orderBy() { return this; },
      then(resolve, reject) {
        queries.push(record);
        assert(['project_assets', 'multimedia_tracks'].includes(record.table), 'Project preview must not consult Model associations or markers');
        const rows = record.table === 'project_assets' ? assigned ? [{ id: 28, title: 'TRADE', artist: 'Example', coverArt: '/art.png', userId: 'owner', metadata: { secret: true } }] : []
          : [{ ...track(record.offset ? 71 : 21), userId: 'owner', metadata: { secret: true } }];
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return builder;
  }
  const reader = load('src/libraries/services/project/multimedia-preview.ts', {
    '@/libraries/db/client': { db },
    './read-access': { readableProject: async id => accessible ? { id, userId: 'owner' } : null },
    '@/libraries/schema/project': schema,
    '@/libraries/schema/multimedia': schema,
  });
  const query = { projectId: 7, albumId: 28, trackId: null, offset: 0 };
  const result = await reader.readProjectMultimediaPreview(query, 'guest');
  assert.equal(result.tracks[0].id, 21);
  assert(!('markerId' in result));
  assert(!JSON.stringify(result).includes('secret') && !JSON.stringify(result).includes('userId'));
  const album = queries.find(item => item.table === 'project_assets');
  for (const value of [7, 'owner', 'multimedia', 'multimedia_albums', true, 28, 'published']) assert(album.params.includes(value), 'Missing Project/public Album predicate: ' + value);
  for (const name of ['project_multimedia', 'multimedia']) assert(album.joins.some(join => join.table === name && join.params.includes(true) && join.params.includes('owner')));
  const tracks = queries.find(item => item.table === 'multimedia_tracks');
  assert(tracks.params.includes(28) && tracks.params.includes('owner') && tracks.params.includes('active'));
  queries.length = 0;
  const page = await reader.readProjectMultimediaPreview({ ...query, trackId: 71 }, 'owner');
  assert.equal(page.offset, 50);
  assert(!queries.find(item => item.table === 'project_assets').params.includes('published'), 'Owner may preview assigned draft Albums');
  assigned = false;
  await assert.rejects(reader.readProjectMultimediaPreview(query), error => error.status === 404);
  assigned = true; accessible = false;
  await assert.rejects(reader.readProjectMultimediaPreview(query), error => error.status === 404);
  accessible = true; rank = NaN;
  await assert.rejects(reader.readProjectMultimediaPreview({ ...query, trackId: 71 }), error => error.status === 404);
  const api = load('src/app/api/project/multimedia-preview/route.ts', {
    '@/libraries/auth': { auth: async () => null },
    '@/libraries/services/project/multimedia-preview': reader,
  });
  assert.equal((await api.GET(new Request('https://fixture.invalid/api?projectId=7&albumId=-1'))).status, 400);
  assigned = false;
  const denied = await api.GET(new Request('https://fixture.invalid/api?projectId=7&albumId=28'));
  assert.equal(denied.status, 404);
  assert.equal(denied.headers.get('Cache-Control'), 'private, no-store');

  const fixture = playerFixture();
  fixture.setScene(null);
  fixture.setProjectRead(query => query.trackId === 71 ? response({ ...query, offset: 50 }, [track(71)]) : response(query));
  await fixture.player.restoreProject({ ...baseCommandWithoutMarker(), trackId: 71 }, 'restore-later-page');
  assert.equal(fixture.latest.state.offset, 50, 'Saved Track restoration uses its revalidated page');
  assert.equal(fixture.latest.state.track.id, 71);
  assert.equal(fixture.plays, 0);
  fixture.player.clear();
  await fixture.player.restoreProject({ ...baseCommandWithoutMarker(), trackId: 22 }, 'restore-paused');
  assert.equal(fixture.plays, 0, 'Restoration cannot autoplay');
  assert.equal(fixture.latest.state.track.id, 22);
  assert.equal(fixture.latest.state.status, 'paused');
  await fixture.player.executeProject(baseCommandWithoutMarker(), 'project-play');
  assert.equal(fixture.latest.state.markerId, null);
  assert(fixture.latest.state.playing);
  assert.equal(fixture.requests.length, 0, 'Project preview never reads object authority');
  fixture.player.checkScene();
  assert(fixture.latest.state.playing, 'Project preview is independent of Scene readiness/Layers');
  await fixture.player.executeProject({ ...baseCommandWithoutMarker(), action: 'pauseMultimedia' }, 'project-pause');
  assert(fixture.media.paused);
  await assert.rejects(fixture.player.executeProject({ ...baseCommandWithoutMarker(), markerId: 'radio' }, 'forged-marker'));
  fixture.setScene(scene());
  await fixture.player.execute(baseCommand, 'object-play');
  assert.equal(fixture.latest.state.markerId, 'radio');
  await assert.rejects(fixture.player.executeProject({ ...baseCommandWithoutMarker(), action: 'stopMultimedia' }, 'wrong-binding'));
  await fixture.player.executeProject(baseCommandWithoutMarker(), 'project-replace');
  assert.equal(fixture.latest.state.markerId, null);
  let resolve;
  fixture.setProjectRead(query => new Promise(done => { resolve = () => done(response(query)); }));
  const before = fixture.plays;
  const pending = fixture.player.executeProject(baseCommandWithoutMarker(), 'stale-project');
  fixture.setProjectId(8); resolve();
  await assert.rejects(pending, /Project changed/);
  assert.equal(fixture.plays, before, 'Late replies after a Project change cannot start playback');
  console.log('PASS Project preview: saved Project Album authority/public gates without Model associations, safe DTOs/rank paging, single-engine object/Project switching and stale Project rejection (mock DB/media).');
}
function baseCommandWithoutMarker() {
  return { projectId: 7, albumId: 28, action: 'playMultimedia' };
}

async function checkReadBoundary() {
  let accessible = true, ownSource = true, owner = true, hasMarker = true, hasAlbum = true, rank = 50;
  const queries = [];
  const db = {
    select: fields => chain(fields),
    selectDistinct: fields => chain(fields),
    async execute(value) {
      const query = dialect.sqlToQuery(value);
      queries.push({ table: 'raw', ...query });
      assert(query.params.includes('owner'));
      if (!query.sql.includes('ranked')) assert(query.sql.includes('is_active = true'), 'Disabled source records are unavailable');
      return { rows: query.sql.includes('ranked') ? [{ position: rank }] : ownSource ? [{ id: 5 }] : [] };
    },
  };
  function chain(fields) {
    const record = { fields, joins: [], offset: 0 };
    const builder = {
      from(table) { record.table = orm.getTableName(table); return this; },
      innerJoin(table, condition) { record.joins.push({ table: orm.getTableName(table), ...dialect.sqlToQuery(condition) }); return this; },
      where(condition) { Object.assign(record, dialect.sqlToQuery(condition)); return this; },
      limit(value) { record.limit = value; return this; },
      offset(value) { record.offset = value; return this; },
      orderBy() { return this; },
      then(resolve, reject) {
        queries.push(record);
        let rows;
        if (record.table === 'project_threed_markers') rows = !hasMarker ? [] : [{ markerType: record.params.includes('kate') ? 'characters' : 'models', sourceAssetId: record.params.includes('kate') ? 9 : 5, threedId: 3, data: { isMovable: true } }];
        else if (record.table === 'threed_multimedia_albums') rows = hasAlbum ? [{ id: 28, title: 'TRADE', artist: 'Example', userId: 'owner', coverArt: '/cover.png', metadata: { secret: 'never serialized' } }] : [];
        else if (record.table === 'multimedia_tracks') rows = [{ ...track(record.offset ? 71 : 21), userId: 'owner', metadata: { secret: true }, lyrics: 'not selected' }];
        else throw Error('Unexpected table: ' + record.table);
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return builder;
  }
  const reader = load(root + 'multimedia/scene-multimedia-read.ts', {
    '@/libraries/db/client': { db },
    '@/libraries/services/project/read-access': { readableProject: async (id, viewer) => accessible ? { id, userId: 'owner' } : null },
    '@/libraries/schema/project': schema,
    '@/libraries/schema/threed': schema,
    '@/libraries/schema/multimedia': schema,
    '@/libraries/schema/threed/album-associations': schema,
  });
  const query = { projectId: 7, markerId: 'radio', actorMarkerId: 'kate', albumId: 28, trackId: null, offset: 0 };
  let result = await reader.readSceneMultimedia(query, 'guest');
  assert.equal(result.tracks[0].id, 21);
  assert.deepEqual(Object.keys(result.albums[0]).sort(), ['artist', 'coverArt', 'id', 'title']);
  assert.deepEqual(Object.keys(result.tracks[0]).sort(), ['albumId', 'duration', 'fileType', 'fileUrl', 'id', 'title', 'trackNumber']);
  const albumQuery = queries.find(query => query.table === 'threed_multimedia_albums');
  assert(albumQuery.params.includes('published') && albumQuery.params.includes(true), 'Visitors require public/published Albums');
  assert(albumQuery.params.includes('model') && albumQuery.params.includes('5'), 'Saved source identity scopes the relationship');
  assert(albumQuery.joins.some(join => join.table === 'project_assets' && join.params.includes('multimedia_albums') && join.params.includes(7) && join.params.includes(true)));
  for (const name of ['project_multimedia', 'multimedia']) assert(albumQuery.joins.some(join => join.table === name && join.params.includes('owner') && join.params.includes(true)));
  const markerQuery = queries.find(query => query.table === 'project_threed_markers');
  assert(markerQuery.params.includes('owner') && markerQuery.params.includes(7) && markerQuery.params.includes('radio'));
  assert(markerQuery.joins.some(join => join.table === 'project_threed' && join.params.includes('owner') && join.params.includes(true)));
  assert(markerQuery.joins.some(join => join.table === 'project_assets' && join.params.includes('threed') && join.params.includes('threed_models')));
  const tracksQuery = queries.find(query => query.table === 'multimedia_tracks');
  assert(tracksQuery.params.includes(28) && tracksQuery.params.includes('owner') && tracksQuery.params.includes('active'));
  queries.length = 0;
  result = await reader.readSceneMultimedia({ ...query, trackId: 71 }, 'owner');
  assert.equal(result.offset, 50);
  assert.equal(result.tracks[0].id, 71);
  assert(!queries.find(query => query.table === 'threed_multimedia_albums').params.includes('published'), 'Owner can see assigned draft Albums');
  accessible = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  accessible = true; hasMarker = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  hasMarker = true; ownSource = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  ownSource = true; hasAlbum = false;
  await assert.rejects(reader.readSceneMultimedia(query), error => error.status === 404);
  hasAlbum = true; rank = NaN;
  await assert.rejects(reader.readSceneMultimedia({ ...query, trackId: 71 }), error => error.status === 404);
  const api = load('src/app/api/project/multimedia-playback/route.ts', {
    '@/libraries/auth': { auth: async () => null },
    '@/libraries/services/threed/multimedia/scene-multimedia-read': reader,
  });
  assert.equal((await api.GET(new Request('https://app.invalid/api?projectId=-1&markerId=radio'))).status, 400);
  accessible = false;
  const denied = await api.GET(new Request('https://app.invalid/api?projectId=7&markerId=radio'));
  assert.equal(denied.status, 404);
  assert.equal(denied.headers.get('Cache-Control'), 'private, no-store');
  console.log('PASS Scene Multimedia reads: exact saved source/Project joins, owner/public gates, active Tracks, rank paging, safe DTOs and denied forged/unavailable references (mock DB).');
}

async function checkPlayer() {
  const fixture = playerFixture();
  await fixture.player.execute(baseCommand, 'play');
  assert.equal(fixture.latest.state.track.id, 21);
  assert(fixture.latest.state.playing);
  await fixture.player.execute({ ...baseCommand, action: 'pauseMultimedia' }, 'pause');
  assert(fixture.media.paused);
  assert.equal(fixture.latest.state.status, 'paused');
  await fixture.player.execute(baseCommand, 'resume');
  fixture.media.currentTime = 12;
  await fixture.player.execute({ ...baseCommand, action: 'rewindMultimedia' }, 'rewind');
  assert.equal(fixture.media.currentTime, 0);
  assert(!fixture.media.paused);
  await fixture.player.execute({ ...baseCommand, action: 'nextTrack' }, 'next');
  assert.equal(fixture.latest.state.track.id, 22);
  await fixture.player.execute({ ...baseCommand, action: 'stopMultimedia' }, 'stop');
  assert.equal(fixture.media.currentTime, 0);
  assert(fixture.media.paused);
  assert.equal(fixture.latest.state.status, 'stopped');
  fixture.player.mediaChanged();
  assert.equal(fixture.latest.state.status, 'stopped', 'Queued pause events preserve explicit Stop status');
  await fixture.player.execute(baseCommand, 'replay');
  const before = fixture.pauses;
  await assert.rejects(fixture.player.execute({ ...baseCommand, markerId: 'other-radio', action: 'stopMultimedia' }, 'wrong-target'));
  assert.equal(fixture.pauses, before, 'A differently bound target cannot pause this player');
  fixture.setRead(async query => query.offset === 50 ? response(query, [track(71)]) : response(query, [track(21), track(22)], true));
  await fixture.player.execute({ ...baseCommand, trackId: 22 }, 'last-on-page');
  await fixture.player.execute({ ...baseCommand, action: 'nextTrack' }, 'next-page');
  assert.equal(fixture.latest.state.track.id, 71);
  assert.equal(fixture.latest.state.offset, 50);
  const notAllowed = new Error('Autoplay blocked'); notAllowed.name = 'NotAllowedError';
  fixture.setPlay(async () => { throw notAllowed; });
  await assert.rejects(fixture.player.execute(baseCommand, 'blocked'));
  assert.match(fixture.latest.error, /Click Play/);
  assert(!fixture.latest.state.playing);
  assert.equal(fixture.latest.state.status, 'error');
  const retry = playerFixture();
  await retry.player.execute(baseCommand, 'first');
  retry.setPlay(async () => { throw notAllowed; });
  await assert.rejects(retry.player.execute({ ...baseCommand, trackId: 22 }, 'denied-switch'));
  assert.equal(retry.latest.state.track.id, 22, 'Denied Track switch retains the requested Track for retry');
  assert.equal(retry.latest.state.status, 'error');
  assert.equal(retry.media.src, track(22).fileUrl);
  retry.setPlay(async () => { retry.media.paused = false; });
  await retry.player.execute(baseCommand, 'retry');
  assert.equal(retry.requests.at(-1).query.trackId, 22, 'Play retries the displayed Track after a fresh authority read');
  assert.equal(retry.latest.state.status, 'playing');
  retry.media.paused = true;
  retry.player.mediaChanged('', true);
  assert.equal(retry.latest.state.status, 'ended');
  assert.equal(retry.latest.state.playing, false);
  retry.player.mediaChanged('File failed');
  retry.media.currentTime = 17;
  await retry.player.execute(baseCommand, 'reload-failed-file');
  assert.equal(retry.media.currentTime, 0, 'Explicit retry reloads an errored media source even if its URL is unchanged');
  const stale = playerFixture();
  let resolve;
  stale.setRead(query => new Promise(done => { resolve = () => done(response(query)); }));
  const pending = stale.player.execute(baseCommand, 'stale');
  stale.player.clear(); resolve();
  await assert.rejects(pending);
  assert.equal(stale.plays, 0, 'A late read after clear cannot start audio');
  const cancelled = playerFixture();
  const controller = new AbortController();
  const operation = cancelled.player.execute(baseCommand, 'cancelled', controller.signal);
  controller.abort(); await assert.rejects(operation);
  assert.equal(cancelled.plays, 0);
  const layers = scene(); layers.layers.delete('models');
  fixture.setScene(layers); fixture.player.checkScene();
  assert.equal(fixture.latest.state, null);
  const actor = playerFixture();
  const away = scene(); away.position = marker => ({ x: marker === 'radio' ? 100 : 0, y: 0, z: 0 });
  actor.setScene(away);
  await assert.rejects(actor.player.execute({ ...baseCommand, actorMarkerId: 'kate' }, 'far'), /range/);
  const noControl = scene(); noControl.controlledCharacterId = 99; actor.setScene(noControl);
  await assert.rejects(actor.player.execute({ ...baseCommand, actorMarkerId: 'kate' }, 'wrong-actor'), /Take Control/);
  console.log('PASS Scene player: actual Play/Pause/Stop/Rewind/Next, page transition, exact target binding, autoplay denial, abort/late replies, hidden Layers and controlled-Character/range gates (mock media).');
}

async function checkCollision() {
  const fixture = playerFixture();
  fixture.player.armCollision({ ...baseCommand, actorMarkerId: 'kate' }, 'radio');
  const event = {
    version: 1,
    projectId: 7,
    sceneEventId: 'entry-1',
    kind: 'sensor-enter',
    source: { moduleType: 'models', assetId: 5 },
    sourceMarkerId: 105,
    target: { moduleType: 'characters', assetId: 9 },
    sensor: { ownerMarkerId: 105, id: 'radio-trigger' },
    occurredAt: new Date().toISOString(),
  };
  fixture.player.observe(event);
  fixture.player.observe(event);
  fixture.player.observe({ ...event, sceneEventId: 'duplicate-entry' });
  await flush();
  assert.equal(fixture.plays, 1, 'Duplicate/occupied sensor entries dispatch once');
  fixture.player.observe({ ...event, projectId: 99, sceneEventId: 'wrong-project' });
  await flush(); assert.equal(fixture.plays, 1);
  fixture.player.clear();
  assert(!fixture.player.isCollisionArmed('radio'));
  const duplicate = playerFixture();
  const doubled = scene(); doubled.markers.push({ ...doubled.markers[1], id: 'other-kate' }); duplicate.setScene(doubled);
  assert.throws(() => duplicate.player.armCollision({ ...baseCommand, actorMarkerId: 'kate' }, 'radio'), /one|Control/);
  console.log('PASS collision boundary: exact Project/instance/actor, duplicate and occupancy suppression, ambiguous instances rejected and Project-session clear (synthetic accepted physics events).');
}

function checkSimulation() {
  const definition = {
    version: 1,
    steps: [
      { id: 'play', action: 'playMultimedia', actorMarkerId: 'kate', targetMarkerId: 'radio', timeoutMs: 1000, onFailure: 'stop', multimedia: { albumId: 28, trackId: 21 } },
      { id: 'pause', action: 'pauseMultimedia', actorMarkerId: 'kate', targetMarkerId: 'radio', timeoutMs: 1000, onFailure: 'stop', multimedia: { albumId: 28 } },
    ],
    observations: [],
  };
  const simulation = { id: 12, revision: 1, name: 'Radio', projectId: 7, threedId: 3, isActive: true, definition };
  const captured = mediaSimulation.captureMultimediaSimulation(simulation, simulation);
  definition.steps[0].multimedia.albumId = 99;
  assert.equal(captured.definition.steps[0].multimedia.albumId, 28, 'Capture owns an independent command payload');
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[0], multimedia: { albumId: 0 } }] }));
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[0], multimedia: { albumId: 28, url: 'arbitrary' } }] }));
  assert.throws(() => simulationInput.parseSimulationDefinition({ ...definition, steps: [{ ...definition.steps[1], multimedia: { albumId: 28, trackId: 21 } }] }));
  assert.throws(() => mediaSimulation.captureMultimediaSimulation({ ...captured, definition: { ...captured.definition, steps: [...captured.definition.steps, { ...captured.definition.steps[0], id: 'kick', action: 'kickBall', multimedia: undefined }] } }, simulation));
  let receive, serial = 0;
  const dispatched = [], cancelled = [], timers = new Map(), updates = [];
  const runner = new simulationRunner.SoccerSimulationRunner({
    capture: mediaSimulation.captureMultimediaSimulation,
    requestId: () => `request-${++serial}`,
    now: () => 1000 + serial,
    schedule: callback => { timers.set(serial, callback); return serial; },
    clear: id => timers.delete(id),
    subscribe: callback => { receive = callback; return () => { receive = null; }; },
    validate: () => null,
    dispatch: (step, requestId) => dispatched.push({ step, requestId }),
    cancel: (step, requestId) => cancelled.push({ step, requestId }),
    update: state => updates.push(clone(state)),
  });
  runner.start(captured, 'run');
  const first = dispatched[0];
  receive({ requestId: first.requestId, projectId: 99, actorMarkerId: 'kate', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched.length, 1);
  receive({ requestId: first.requestId, projectId: 7, actorMarkerId: 'other', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched.length, 1);
  receive({ requestId: first.requestId, projectId: 7, actorMarkerId: 'kate', targetMarkerId: 'radio', kind: 'multimedia', success: true });
  assert.equal(dispatched[1].step.action, 'pauseMultimedia');
  runner.stop();
  assert.equal(cancelled.length, 1);
  assert.equal(updates.at(-1).phase, 'cancelled');
  assert.equal(timers.size, 0);
  assert.equal(receive, null);
  assert.equal(mediaSimulation.multimediaSimulationReadiness(captured, scene()), null);
  const participants = mediaSimulation.multimediaSimulationParticipants(captured, scene());
  assert.equal(participants.target.markerId, 'radio');
  assert.equal(participants.target.type, 'models');
  const controlsFile = 'src/components/map/multimedia/MultimediaSimulationControls.tsx';
  const controls = ts.createSourceFile(controlsFile, fs.readFileSync(controlsFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let onCommand;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(controls) === 'player.subscribeCommands') onCommand = node.arguments[0].getText(controls);
    ts.forEachChild(node, visit);
  }
  visit(controls);
  assert(onCommand);
  const interruptions = [];
  const interrupt = vm.runInNewContext('(' + onCommand + ')', {
    first: { targetMarkerId: 'radio' },
    requestId: 'simulation-request',
    instance: { stop: reason => interruptions.push(reason) },
  });
  interrupt({ markerId: 'radio' }, 'simulation-request');
  interrupt({ markerId: 'other-radio' }, 'other-request');
  assert.equal(interruptions.length, 0);
  interrupt({ markerId: null }, 'project-preview');
  assert.equal(interruptions.length, 1, 'Manual Project preview interrupts the Simulation before taking over the shared engine');
  console.log('PASS Multimedia Simulation: strict backwards-compatible payloads, immutable captures, real correlated runner dispatch/Stop/cleanup, wrong Project/actor replies rejected and exact Radio participants.');
}

(async () => {
  assert.equal(contract.sceneMultimediaQuery(new URLSearchParams('projectId=7&markerId=radio')).projectId, 7);
  assert.throws(() => contract.sceneMultimediaQuery(new URLSearchParams('projectId=0&markerId=radio')));
  assert.throws(() => contract.sceneMultimediaQuery(new URLSearchParams('projectId=7&markerId=radio&offset=-1')));
  assert.throws(() => contract.parseSceneMultimediaCommand({ ...baseCommand, url: 'arbitrary' }));
  await checkReadBoundary();
  await checkProjectPreview();
  await checkReferenceViewer();
  checkMediaOverlay();
  await checkSavedReferenceViewer();
  await checkReferenceMedia();
  await checkPlayer();
  await checkCollision();
  checkSimulation();
  assert.equal(pg.getTableConfig(schema.threedMultimediaAlbums).columns.find(column => column.name === 'entity_id').getSQLType(), 'text');
  const followUp = fs.readFileSync('docs/developers/sql/threed-albums-entity-identity.sql', 'utf8');
  assert(followUp.includes('USING entity_id::text') && followUp.includes('entity_id = OLD.id::text'));
  assert(!/DELETE FROM threed_multimedia_albums|DROP TABLE|TRUNCATE/i.test(followUp));
  console.log('PASS entity identity proposal: text schema and kind-specific ID validation; preservation/cleanup SQL inspected only, never executed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
