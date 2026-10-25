const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Actual components with deferred fetch, keyed React lifetimes and audio doubles.
// No browser, HTTP server, database, session service or storage is contacted.
const jsx = (type, props, key) => ({ type, props: props || {}, key });
const icons = new Proxy({}, { get: (_, name) => name });
const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };

function fixture() {
  const instances = new Map(), requests = [], writes = [];
  let current, pending = [], dirty = false, root, rootProps, tree;
  const changed = (old, deps) => !old || old.deps.length !== deps.length || deps.some((value, index) => !Object.is(value, old.deps[index]));
  const react = {
    useState(initial) {
      const instance = current, index = instance.cursor++;
      if (!(index in instance.slots)) instance.slots[index] = typeof initial === 'function' ? initial() : initial;
      return [instance.slots[index], value => {
        writes.push({ mounted: instance.mounted, path: instance.path });
        const next = typeof value === 'function' ? value(instance.slots[index]) : value;
        if (instance.mounted && !Object.is(next, instance.slots[index])) { instance.slots[index] = next; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const instance = current, index = instance.cursor++, old = instance.slots[index];
      if (changed(old, deps)) {
        pending.push(() => {
          old?.cleanup?.();
          instance.slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  function dispose(instance) {
    instance.mounted = false;
    for (const slot of instance.slots) slot?.cleanup?.();
  }
  function resolve(node, path, visited) {
    if (Array.isArray(node)) return node.map((child, index) => resolve(child, `${path}/${child?.key ?? index}`, visited));
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') {
      const identity = `${path}:${node.key ?? ''}`;
      let instance = instances.get(identity);
      if (instance && instance.type !== node.type) { dispose(instance); instances.delete(identity); instance = null; }
      if (!instance) { instance = { slots: [], mounted: true, type: node.type, path: identity }; instances.set(identity, instance); }
      visited.add(identity);
      instance.cursor = 0; current = instance;
      const rendered = node.type(node.props);
      current = null;
      return resolve(rendered, `${identity}/rendered`, visited);
    }
    return { ...node, props: { ...node.props, children: resolve(node.props.children, `${path}/children`, visited) } };
  }
  function render() {
    let remaining = 20;
    do {
      dirty = false;
      const visited = new Set();
      tree = resolve(jsx(root, rootProps), 'root', visited);
      for (const [key, instance] of instances) if (!visited.has(key)) { dispose(instance); instances.delete(key); }
      const effects = pending; pending = []; effects.forEach(effect => effect());
    } while (dirty && --remaining);
    assert.ok(remaining, 'actual component effects settle');
  }
  const api = {
    react, requests, writes,
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
    mount(Component, props = {}) { root = Component; rootProps = props; render(); },
    update(props) { rootProps = props; render(); },
    render,
    async settle() { await new Promise(resolve => setImmediate(resolve)); if (root) render(); },
    async respond(request, data, hasMore = false, ok = true) {
      request.resolve({ ok, json: async () => ({ success: ok, data, hasMore }) }); await api.settle();
    },
    unmount() { for (const instance of instances.values()) dispose(instance); instances.clear(); root = null; tree = null; },
    get tree() { return tree; },
  };
  return api;
}

function load(file, test, imports, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, AbortController, console, fetch: test.fetch, ...globals,
    require(name) {
      if (name === 'react') return test.react;
      if (name === 'react/jsx-runtime') return runtime;
      if (name === 'lucide-react') return icons;
      if (name in imports) return imports[name];
      throw new Error(`Unexpected component dependency: ${name}`);
    },
  }, { filename: file });
  return exports;
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node === false || node == null) return '';
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
const get = (test, type) => nodes(test.tree).find(node => node.type === type);
const button = (test, label) => nodes(test.tree).find(node => node.type === 'Button' && text(node) === label);
const loading = test => nodes(test.tree).some(node => node.props.role === 'status' && node.props['aria-label'] === 'Loading Lyrics');
const row = (id, content = `Text ${id}`) => ({ id, title: `Lyrics ${id}`, content });

function loadLyricsPanel(test) {
  return load('src/components/multimedia/LyricsPanel.tsx', test, {
    '@/components/ui/badge': { Badge: 'Badge' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/scroll-area': { ScrollArea: 'ScrollArea' },
    '@/components/ui/skeleton': { Skeleton: 'Skeleton' },
  }).LyricsPanel;
}

async function checkLyrics() {
  const test = fixture();
  let session = { status: 'loading', data: null };
  const TrackLyrics = load('src/components/admin/multimedia/lyrics/TrackLyrics.tsx', test, {
    'next-auth/react': { useSession: () => session },
    '@/components/multimedia/LyricsPanel': { LyricsPanel: loadLyricsPanel(test) },
  }).TrackLyrics;
  let props = { trackId: 82, trackTitle: 'Innocent' };
  test.mount(TrackLyrics, props);
  assert.equal(test.requests.length, 0, 'unresolved session never reads private Lyrics');
  session = { status: 'unauthenticated', data: null }; test.render();
  assert.match(text(test.tree), /Sign in to view your Lyrics/);
  assert.equal(test.requests.length, 0);
  session = { status: 'authenticated', data: { user: { id: 'owner-a' } } }; test.render();
  assert.equal(test.requests.length, 1); assert.equal(loading(test), true);
  assert.equal(test.requests[0].url, '/api/multimedia/lyrics?trackId=82&offset=0');
  assert.equal(test.requests[0].options.cache, 'no-store');
  assert.match(text(test.tree), /Innocent/);

  const literal = '<img src=x onerror="alert(1)">\nVerse two\n\nChorus';
  const firstPage = Array.from({ length: 10 }, (_, index) => row(index + 1));
  firstPage[0] = { id: 1, title: '<script>title</script>', content: literal };
  firstPage[1] = row(2, '');
  await test.respond(test.requests[0], firstPage, true);
  assert.equal(loading(test), false);
  assert.equal(nodes(test.tree).filter(node => node.type === 'article').length, 10);
  const paragraph = nodes(test.tree).find(node => node.type === 'p' && node.props.children === literal);
  assert.ok(paragraph, 'Lyrics content remains a text child, including line breaks and HTML-like text');
  assert.match(paragraph.props.className, /whitespace-pre-wrap/);
  assert.ok(nodes(test.tree).some(node => node.type === 'h4' && node.props.children === '<script>title</script>'));
  assert.ok(nodes(test.tree).every(node => !node.props.dangerouslySetInnerHTML));
  assert.match(text(test.tree), /No Lyrics text added yet/);
  assert.equal(button(test, 'Previous Lyrics').props.disabled, true);
  assert.equal(button(test, 'Next Lyrics').props.disabled, false);

  button(test, 'Next Lyrics').props.onClick(); test.render();
  assert.equal(loading(test), true, 'changing page removes old Lyrics immediately');
  assert.equal(nodes(test.tree).filter(node => node.type === 'article').length, 0);
  assert.equal(test.requests.at(-1).url, '/api/multimedia/lyrics?trackId=82&offset=10');
  assert.equal(test.requests[0].options.signal.aborted, true);
  await test.respond(test.requests.at(-1), [row(11)]);
  assert.equal(button(test, 'Next Lyrics').props.disabled, true);
  assert.equal(button(test, 'Previous Lyrics').props.disabled, false);
  assert.match(text(test.tree), /Page 2/);
  button(test, 'Previous Lyrics').props.onClick(); test.render();
  assert.match(test.requests.at(-1).url, /offset=0$/);
  await test.respond(test.requests.at(-1), []);
  assert.match(text(test.tree), /No active Lyrics assigned to this Track/);
  assert.equal(button(test, 'Next Lyrics'), undefined);

  // Failed responses and network rejection share an explicit retry, without an automatic request loop.
  props = { trackId: 83, trackTitle: 'Manhattan' }; test.update(props);
  let failed = test.requests.at(-1);
  await test.respond(failed, [], false, false);
  assert.ok(nodes(test.tree).some(node => node.props.role === 'alert'));
  assert.ok(button(test, 'Retry Lyrics'));
  const count = test.requests.length; test.render(); assert.equal(test.requests.length, count);
  button(test, 'Retry Lyrics').props.onClick(); test.render();
  assert.equal(loading(test), true); assert.equal(failed.options.signal.aborted, true);
  failed = test.requests.at(-1); failed.reject(new Error('offline fixture')); await test.settle();
  assert.ok(button(test, 'Retry Lyrics'));
  button(test, 'Retry Lyrics').props.onClick(); test.render();
  await test.respond(test.requests.at(-1), [row(83, 'Current Track')]);
  assert.match(text(test.tree), /Current Track/);

  // Start a page request, then change Tracks twice. Resolve aborted requests anyway to prove stale guards.
  props = { trackId: 84, trackTitle: 'Other Track' }; test.update(props);
  const abandoned = test.requests.at(-1);
  props = { trackId: 85, trackTitle: 'Newest Track' }; test.update(props);
  const newest = test.requests.at(-1);
  assert.equal(abandoned.options.signal.aborted, true);
  assert.equal(loading(test), true); assert.doesNotMatch(text(test.tree), /Current Track/);
  await test.respond(newest, [row(85, 'Newest Lyrics')], true);
  const writesBeforeStale = test.writes.length;
  await test.respond(abandoned, [row(84, 'STALE TRACK TEXT')]);
  assert.equal(test.writes.length, writesBeforeStale, 'cancelled Track request does not set state');
  assert.match(text(test.tree), /Newest Lyrics/); assert.doesNotMatch(text(test.tree), /STALE TRACK TEXT/);
  button(test, 'Next Lyrics').props.onClick(); test.render();
  const oldTrackPage = test.requests.at(-1);
  props = { trackId: 86, trackTitle: 'Another Track' }; test.update(props);
  assert.equal(oldTrackPage.options.signal.aborted, true);
  assert.equal(test.requests.at(-1).url, '/api/multimedia/lyrics?trackId=86&offset=0', 'new Track resets the page offset');
  await test.respond(test.requests.at(-1), [row(86, 'Another Track Lyrics')], true);
  await test.respond(oldTrackPage, [row(89, 'STALE TRACK PAGE')]);
  assert.doesNotMatch(text(test.tree), /STALE TRACK PAGE/);
  button(test, 'Next Lyrics').props.onClick(); test.render();
  const oldAccount = test.requests.at(-1);
  assert.match(oldAccount.url, /offset=10$/);
  session = { status: 'authenticated', data: { user: { id: 'owner-b' } } }; test.render();
  assert.equal(oldAccount.options.signal.aborted, true);
  assert.equal(loading(test), true);
  assert.equal(test.requests.at(-1).url, '/api/multimedia/lyrics?trackId=86&offset=0', 'new account gets a fresh first page');
  assert.doesNotMatch(text(test.tree), /Another Track Lyrics/);
  await test.respond(test.requests.at(-1), [row(86, 'Owner B Lyrics')]);
  await test.respond(oldAccount, [row(87, 'OTHER OWNER TEXT')]);
  assert.match(text(test.tree), /Owner B Lyrics/); assert.doesNotMatch(text(test.tree), /OTHER OWNER TEXT/);

  props = { trackId: 87, trackTitle: 'Pending Track' }; test.update(props);
  const signedOutRequest = test.requests.at(-1);
  session = { status: 'unauthenticated', data: null }; test.render();
  assert.equal(signedOutRequest.options.signal.aborted, true);
  const writesBeforeSignOut = test.writes.length;
  await test.respond(signedOutRequest, [row(88, 'SIGNED OUT TEXT')]);
  assert.equal(test.writes.length, writesBeforeSignOut);
  assert.match(text(test.tree), /Sign in/); assert.doesNotMatch(text(test.tree), /SIGNED OUT TEXT/);
  session = { status: 'authenticated', data: { user: { id: 'owner-b' } } }; test.render();
  const unmountedRequest = test.requests.at(-1);
  test.unmount(); assert.equal(unmountedRequest.options.signal.aborted, true);
  const writesBeforeUnmount = test.writes.length;
  unmountedRequest.reject(new Error('late unmount failure')); await test.settle();
  assert.equal(test.writes.length, writesBeforeUnmount, 'unmounted failure does not set error state');
  assert.ok(test.writes.every(write => write.mounted), 'no stale setter ran after a keyed child was unmounted');
  assert.ok(test.requests.every(request => request.url.startsWith('/api/multimedia/lyrics?trackId=')), 'private Track wrapper retains the owner-only endpoint');
}

async function checkPublicAlbumLyrics() {
  const test = fixture();
  // No auth dependency exists in this fixture: adding a session requirement would fail the import.
  const AlbumLyrics = load('src/components/multimedia/AlbumLyrics.tsx', test, {
    './LyricsPanel': { LyricsPanel: loadLyricsPanel(test) },
  }).AlbumLyrics;
  let props = { albumId: 28, albumTitle: 'TRADE' };
  test.mount(AlbumLyrics, props);
  assert.equal(test.requests.length, 1, 'anonymous Album visitor can load published Lyrics');
  assert.equal(test.requests[0].url, '/api/multimedia/albums/28/lyrics?offset=0');
  assert.equal(test.requests[0].options.cache, 'no-store');
  assert.equal(loading(test), true);
  assert.match(text(test.tree), /TRADE/);
  const literal = 'Verse one\n<em>Literal text</em>\n\nChorus';
  const shared = {
    ...row(100, literal), title: 'Shared Lyrics', assignedToAlbum: true,
    tracks: [{ id: 82, title: 'Innocent' }, { id: 83, title: '<script>Track title</script>' }],
  };
  const data = [shared, ...Array.from({ length: 9 }, (_, index) => ({ ...row(index + 101), assignedToAlbum: false, tracks: [] }))];
  await test.respond(test.requests[0], data, true);
  assert.equal(nodes(test.tree).filter(node => node.type === 'article').length, 10);
  assert.equal(nodes(test.tree).filter(node => node.type === 'h4' && text(node) === 'Shared Lyrics').length, 1,
    'one record linked to Album and multiple Tracks renders once');
  assert.deepEqual(nodes(test.tree).filter(node => node.type === 'Badge').map(text), ['Album', 'Track: Innocent', 'Track: <script>Track title</script>']);
  const content = nodes(test.tree).find(node => node.type === 'p' && node.props.children === literal);
  assert.ok(content); assert.match(content.props.className, /whitespace-pre-wrap/);
  assert.ok(nodes(test.tree).every(node => !node.props.dangerouslySetInnerHTML));
  button(test, 'Next Lyrics').props.onClick(); test.render();
  const oldPage = test.requests.at(-1);
  assert.equal(oldPage.url, '/api/multimedia/albums/28/lyrics?offset=10');
  props = { albumId: 29, albumTitle: 'Next Album' }; test.update(props);
  assert.equal(oldPage.options.signal.aborted, true);
  assert.equal(loading(test), true);
  assert.doesNotMatch(text(test.tree), /Shared Lyrics/);
  assert.equal(test.requests.at(-1).url, '/api/multimedia/albums/29/lyrics?offset=0', 'Album switch starts at page one');
  await test.respond(test.requests.at(-1), []);
  assert.match(text(test.tree), /No Lyrics available for this Album/);
  const writesBeforeOldPage = test.writes.length;
  await test.respond(oldPage, [row(110, 'STALE ALBUM TEXT')]);
  assert.equal(test.writes.length, writesBeforeOldPage);
  assert.doesNotMatch(text(test.tree), /STALE ALBUM TEXT/);

  props = { albumId: 30, albumTitle: 'Unavailable Album' }; test.update(props);
  await test.respond(test.requests.at(-1), [], false, false);
  assert.ok(button(test, 'Retry Lyrics'));
  button(test, 'Retry Lyrics').props.onClick(); test.render();
  assert.equal(loading(test), true);
  await test.respond(test.requests.at(-1), { unexpected: 'not an array' });
  assert.ok(button(test, 'Retry Lyrics'), 'invalid response shape shows retry instead of crashing');
  button(test, 'Retry Lyrics').props.onClick(); test.render();
  await test.respond(test.requests.at(-1), [{ ...row(111, ''), assignedToAlbum: false, tracks: [{ id: 84, title: 'Track Only' }] }]);
  assert.match(text(test.tree), /No Lyrics text added yet/);
  assert.deepEqual(nodes(test.tree).filter(node => node.type === 'Badge').map(text), ['Track: Track Only']);
  props = { albumId: 31, albumTitle: 'Pending Album' }; test.update(props);
  const pending = test.requests.at(-1);
  test.unmount(); assert.equal(pending.options.signal.aborted, true);
  const writesBeforeUnmount = test.writes.length;
  await test.respond(pending, [row(112)]);
  assert.equal(test.writes.length, writesBeforeUnmount);
  assert.ok(test.requests.every(request => /^\/api\/multimedia\/albums\/\d+\/lyrics\?offset=\d+$/.test(request.url)),
    'anonymous reads use only the public Album endpoint, never owner Lyrics CRUD');
}

function checkSharedPlayer() {
  const test = fixture();
  const Player = load('src/components/multimedia/MultimediaPlayer.tsx', test, {
    '@/components/ui/slider': { Slider: 'Slider' },
    '@/components/ui/scroll-area': { ScrollArea: 'ScrollArea' },
    '@/components/ui/badge': { Badge: 'Badge' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/tabs': Object.fromEntries(['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'].map(name => [name, name])),
    './WaveformVisualizer': { WaveformVisualizer: 'WaveformVisualizer' },
    './MediaGallery': { MediaGallery: 'MediaGallery' },
    '@/libraries/utils': { cn: (...parts) => parts.filter(Boolean).join(' ') },
  }).MultimediaPlayer;
  const track = { id: 82, title: 'Innocent', duration: 300, trackNumber: 3, fileUrl: '/fixture.mp3' };
  let props = { track, album: { id: 28, title: 'TRADE', artist: 'Artist', coverArt: '' }, tracks: [track], currentTime: 0, duration: 300, volume: 0.7, isMuted: false, isPlaying: false, formatTime: String };
  test.mount(Player, props);
  assert.deepEqual(nodes(test.tree).filter(node => node.type === 'TabsTrigger').map(node => node.props.value), ['tracks', 'links', 'media']);
  assert.ok(!nodes(test.tree).some(node => node.type === 'TabsContent' && node.props.value === 'lyrics'), 'existing public player has no private Lyrics panel');
  const panel = jsx('FixtureLyrics', { children: 'Owned text' });
  props = { ...props, lyricsPanel: panel }; test.update(props);
  assert.deepEqual(nodes(test.tree).filter(node => node.type === 'TabsTrigger').map(node => node.props.value), ['tracks', 'links', 'media', 'lyrics']);
  const content = nodes(test.tree).find(node => node.type === 'TabsContent' && node.props.value === 'lyrics');
  assert.equal(content.props.children.type, 'FixtureLyrics');
  assert.match(get(test, 'TabsList').props.className, /grid-cols-2 sm:grid-cols-4/);
  get(test, 'Tabs').props.onValueChange('lyrics'); test.render();
  props = { ...props, track: { ...track, id: 83, title: 'Manhattan' } }; test.update(props);
  assert.equal(get(test, 'Tabs').props.value, 'lyrics', 'switching Tracks retains the open Lyrics tab');
  props = { ...props, album: { ...props.album, id: 29 } }; test.update(props);
  assert.equal(get(test, 'Tabs').props.value, 'tracks', 'existing Album-change tab reset remains intact');
  assert.equal(test.requests.length, 0, 'shared player does not load owner-only Lyrics itself');
  test.unmount();
}

async function checkLegacyWiring() {
  const test = fixture();
  class AudioMock {
    constructor() { this.events = {}; this.src = ''; this.currentTime = 0; this.duration = 300; }
    pause() {} play() { return Promise.resolve(); } load() {}
    addEventListener(name, handler) { this.events[name] = handler; }
    removeEventListener(name) { delete this.events[name]; }
  }
  const Player = load('src/components/admin/multimedia/tracks/LegacyTrackPlayer.tsx', test, {
    'next/navigation': { useParams: () => ({ id: '82' }) },
    'next/link': { default: 'Link' },
    '@/components/multimedia/MultimediaPlayer': { MultimediaPlayer: 'MultimediaPlayer' },
    '@/components/admin/multimedia/lyrics/TrackLyrics': { TrackLyrics: 'TrackLyrics' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/card': { Card: 'Card', CardContent: 'CardContent' },
  }, { Audio: AudioMock }).default;
  test.mount(Player);
  assert.equal(test.requests[0].url, '/api/multimedia/tracks?scope=owner&id=82');
  const tracks = [81, 82, 83].map(id => ({ id, title: `Track ${id}`, albumId: 28, fileUrl: `/${id}.mp3` }));
  await test.respond(test.requests[0], tracks[1]);
  assert.match(test.requests[1].url, /albums\?scope=owner&id=28/);
  await test.respond(test.requests[1], { id: 28, title: 'TRADE', artist: 'Artist', tracks });
  function selected(id) {
    const player = get(test, 'MultimediaPlayer');
    assert.equal(player.props.track.id, id);
    assert.equal(player.props.lyricsPanel.type, 'TrackLyrics');
    assert.equal(player.props.lyricsPanel.props.trackId, id);
    assert.equal(player.props.lyricsPanel.props.trackTitle, `Track ${id}`);
    return player;
  }
  selected(82).props.onTrackSelect(0); test.render(); selected(81);
  selected(81).props.onNext(); test.render(); selected(82);
  selected(82).props.onNext(); test.render(); selected(83);
  selected(83).props.onPrevious(); test.render(); selected(82);
  assert.equal(test.requests.length, 2, 'selection reuses the existing Album Tracks without reloading the page');
  test.unmount();
}

(async () => {
  await checkLyrics();
  await checkPublicAlbumLyrics();
  checkSharedPlayer();
  await checkLegacyWiring();
  console.log('PASS: actual private Track and anonymous public Album Lyrics loading/error/retry, paging, escaped text and assignment labels, endpoint separation, Track/account/Album switch and unmount cancellation; conditional Lyrics tab and selected-Track legacy wiring (mocked React/fetch/audio; no browser or live persistence).');
})().catch(error => { console.error(error); process.exitCode = 1; });
