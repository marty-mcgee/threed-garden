const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the actual Dashboard component/effects with deferred network and audio.
// This is an offline lifecycle fixture, not a browser or database test.
let requests = [], slots = [], cursor = 0, effects = [], dirty = false, tree;
const react = {
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; dirty = true; }];
  },
  useCallback(fn, deps) {
    const i = cursor++, old = slots[i];
    if (!old || deps.some((d, j) => !Object.is(d, old.deps[j]))) slots[i] = { deps, fn };
    return slots[i].fn;
  },
  useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
  useEffect(fn, deps) {
    const i = cursor++, old = slots[i];
    if (!old || deps.some((d, j) => !Object.is(d, old.deps[j]))) {
      effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    }
  },
};
const jsx = (type, props, key) => ({ type, props, key });
class AudioMock {
  static instance;
  constructor() { AudioMock.instance = this; this.tagName = 'AUDIO'; this.events = {}; this.src = ''; this.currentTime = 0; }
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
  load() {}
  addEventListener(name, fn) { this.events[name] = fn; }
  removeEventListener(name) { delete this.events[name]; }
}
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (name in imports) return imports[name];
    throw new Error(`Unexpected dependency ${name}`);
  }, AbortController, Audio: AudioMock, window: { scrollTo() {}, addEventListener() {}, removeEventListener() {} }, console,
  fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  });
  return exports;
}
const service = load('src/libraries/services/multimedia/dashboard.ts', {});
let Component = load('src/components/multimedia/MultimediaContent.tsx', {
  react, 'react/jsx-runtime': { jsx, jsxs: jsx },
  '@/components/multimedia/AlbumGrid': { AlbumGrid: 'AlbumGrid' },
  '@/components/multimedia/MultimediaPlayer': { MultimediaPlayer: 'MultimediaPlayer' },
  '@/components/ui/button': { Button: 'Button' }, './MediaGallery': { MediaGallery: 'MediaGallery' },
  '@/libraries/services/multimedia/dashboard': service,
}).default;
function render() {
  let limit = 20;
  do { dirty = false; cursor = 0; tree = Component(); const pending = effects; effects = []; pending.forEach(fn => fn()); } while (dirty && --limit);
  assert.ok(limit, 'effects settle');
}
async function settle() { await new Promise(resolve => setImmediate(resolve)); render(); }
function nodes(node = tree) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(item => nodes(item ?? null));
  return [node, ...nodes(node.props?.children ?? null)];
}
const get = type => nodes().find(node => node.type === type);
const button = text => nodes().find(node => node.type === 'Button' && node.props.children === text);
const album = id => ({ id, title: `Album ${id}`, artist: 'Artist', coverArt: '', releaseYear: null, description: null, tracks: [] });
const details = id => ({ ...album(id), tracks: [{ id: id * 10, title: 'Track', trackNumber: 0, fileUrl: `/${id}.mp3` }], links: [{ id, title: 'Link', url: 'https://example.invalid' }], media: [{ id, fileName: 'Cover', fileType: 'image/png', fileUrl: '/cover.png', isPrimary: true }] });
async function respond(request, data, pagination) { request.resolve({ ok: true, json: async () => ({ success: true, data, pagination }) }); await settle(); }
(async () => {
  render(); assert.equal(requests.length, 1);
  assert.match(requests[0].url, /scope=public.*limit=50&offset=0/);
  await respond(requests[0], Array.from({ length: 50 }, (_, i) => album(i + 1)), { total: 52 });
  assert.equal(get('AlbumGrid').props.albums.length, 50);
  assert.equal(requests.length, 2, 'one selected-detail request, no client Track fan-out');
  assert.match(requests[1].url, /includeTracks=true&includeLinks=true&includeMedia=true/);
  await respond(requests[1], details(1));
  assert.equal(get('MultimediaPlayer').props.album.links.length, 1);
  assert.equal(get('MultimediaPlayer').props.album.media.length, 1);
  assert.equal(get('MultimediaPlayer').props.tracks[0].trackNumber, 0);
  get('AlbumGrid').props.onPlayAlbum(2); render(); const old = requests.at(-1);
  assert.equal(AudioMock.instance.src, ''); assert.equal(get('MultimediaPlayer'), undefined);
  get('AlbumGrid').props.onSelectAlbum(3); render(); const latest = requests.at(-1);
  assert.equal(old.options.signal.aborted, true);
  await respond(latest, details(3)); await respond(old, details(2));
  assert.equal(get('MultimediaPlayer').props.album.id, 3); assert.equal(get('MultimediaPlayer').props.isPlaying, false);
  button('Load more Albums').props.onClick(); render();
  assert.match(requests.at(-1).url, /offset=50$/);
  requests.at(-1).reject(new Error('offline failure')); await settle();
  assert.equal(get('AlbumGrid').props.albums.length, 50);
  button('Retry Albums').props.onClick(); render();
  await respond(requests.at(-1), [album(51), album(52)], { total: 52 });
  assert.equal(get('AlbumGrid').props.albums.length, 52); assert.equal(button('Load more Albums'), undefined);
  assert.equal(get('MultimediaPlayer').props.album.id, 3, 'paging must not reset selection');
  get('AlbumGrid').props.onSelectAlbum(52); render();
  requests.at(-1).resolve({ ok: false }); await settle();
  assert.ok(button('Retry Album')); assert.equal(get('MultimediaPlayer'), undefined);
  button('Retry Album').props.onClick(); render();
  await respond(requests.at(-1), { ...details(52), tracks: [] });
  assert.equal(get('MediaGallery').props.media.length, 1, 'Trackless Album still exposes eligible Media');
  assert.ok(nodes().some(n => n.type === 'a' && n.props.children === 'Link'));
  const oldAudio = AudioMock.instance;
  get('AlbumGrid').props.onSelectAlbum(2); render();
  await respond(requests.at(-1), { ...details(2), tracks: [{ ...details(2).tracks[0], fileType: 'video/mp4' }] });
  assert.notEqual(oldAudio.src, '/2.mp3', 'video never loads into the stale audio element');
  const video = new AudioMock(); video.tagName = 'VIDEO';
  get('MultimediaPlayer').props.mediaPreview.props.ref(video); render();
  assert.equal(video.src, '/2.mp3');
  video.events.play(); render(); assert.equal(get('MultimediaPlayer').props.isPlaying, true);
  video.currentTime = 7; video.duration = 20; video.events.timeupdate(); video.events.durationchange(); render();
  assert.equal(get('MultimediaPlayer').props.currentTime, 7); assert.equal(get('MultimediaPlayer').props.duration, 20);
  video.volume = 0.4; video.muted = true; video.events.volumechange(); render();
  assert.equal(get('MultimediaPlayer').props.volume, 0.4); assert.equal(get('MultimediaPlayer').props.isMuted, true);
  get('MultimediaPlayer').props.onToggleMute(); render(); assert.equal(video.muted, false);
  const preview = new AudioMock(); get('MultimediaPlayer').props.onMediaPlay(preview);
  assert.equal(video.paused, true, 'Album Media pauses the Track');
  video.events.pause(); render(); assert.equal(get('MultimediaPlayer').props.isPlaying, false);
  video.events.play(); render(); assert.equal(preview.paused, true, 'Track pauses Album Media');
  video.events.error(); render(); assert.ok(nodes().some(n => n.props?.role === 'alert'));
  get('AlbumGrid').props.onSelectAlbum(3); render(); assert.equal(video.paused, true);
  await respond(requests.at(-1), details(3));
  assert.equal(get('MultimediaPlayer').props.mediaPreview, undefined);
  assert.equal(AudioMock.instance.src, '/3.mp3');
  get('AlbumGrid').props.onPlayAlbum(4); render();
  await respond(requests.at(-1), { ...details(4), tracks: [{ ...details(4).tracks[0], fileUrl: null }] });
  assert.equal(AudioMock.instance.src, ''); assert.equal(get('MultimediaPlayer').props.isPlaying, false);
  assert.ok(nodes().some(n => n.props?.role === 'alert'), 'unavailable file cannot replay the previous Track');
  get('AlbumGrid').props.onPlayAlbum(1); render(); const pending = requests.at(-1);
  for (const slot of slots) slot?.cleanup?.();
  assert.equal(pending.options.signal.aborted, true); dirty = false;
  pending.resolve({ ok: true, json: async () => ({ success: true, data: details(1) }) });
  for (let i = 0; i < 8; i++) await Promise.resolve();
  assert.equal(dirty, false, 'unmounted requests cannot update state');
  slots = []; effects = []; dirty = false;
  const Gallery = load('src/components/multimedia/MediaGallery.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/dialog': { Dialog: 'Dialog', DialogContent: 'DialogContent', DialogTitle: 'DialogTitle' },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '@/libraries/utils': { cn: (...items) => items.filter(Boolean).join(' ') },
  }).MediaGallery;
  let media = [];
  Component = () => Gallery({ media }); render(); const hookCount = cursor;
  media = Array.from({ length: 14 }, (_, id) => ({ id, fileName: 'Image ' + id, fileUrl: '/' + id + '.png', fileType: 'image/png', isPrimary: id === 13 }));
  render(); assert.equal(cursor, hookCount, 'empty/nonempty Gallery uses the same hooks');
  const thumbnail = nodes().find(n => n.type === 'div' && n.props.onClick);
  thumbnail.props.onClick(); render();
  const dialog = get('DialogContent');
  assert.equal(nodes(dialog).find(n => n.type === 'img').props.src, '/13.png', 'primary thumbnail opens the matching sorted image');
  nodes().find(n => n.type === 'button').props.onClick(); render();
  assert.equal(nodes(get('DialogContent')).find(n => n.type === 'img').props.src, '/11.png', 'more button opens the first image after the preview');
  media = []; render(); assert.equal(tree, null); assert.equal(cursor, hookCount);
  media = [{ id: 4, fileName: 'Video', fileType: 'video/mp4', fileUrl: '/video.mp4', isPrimary: true }]; render();
  const previewNode = nodes().find(n => typeof n.type === 'function'); assert.ok(previewNode);
  const Preview = previewNode.type; let previewItem = media[0], played;
  slots = []; effects = []; Component = () => Preview({ item: previewItem, onMediaPlay: element => { played = element; } }); render();
  const previewElement = new AudioMock(); get('video').props.ref(previewElement);
  get('video').props.onPlay({ currentTarget: previewElement }); assert.equal(played, previewElement);
  assert.equal(get('video').props.controls, true); assert.equal(get('video').props.src, '/video.mp4');
  get('video').props.onError(); render(); assert.ok(nodes().some(n => n.props?.role === 'alert'));
  previewItem = { ...previewItem, fileType: 'audio/mpeg', fileUrl: '/audio.mp3' }; render();
  assert.equal(get('audio').props.src, '/audio.mp3');
  assert.ok(!nodes().some(n => n.props?.role === 'alert'), 'new Media resets the previous error');
  console.log('PASS: actual Dashboard paging beyond 50, Album Links/Media, Trackless details, failure/retry, selection races, playback reset and unmount cancellation, gallery hook/index consistency, video transitions/native events and exclusive playback (mocked fetch/audio/React effects).');
})().catch(error => { console.error(error); process.exitCode = 1; });
