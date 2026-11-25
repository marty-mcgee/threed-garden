const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const element = (type, props) => ({ type, props });
function load(file, modules, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, ...globals, require(name) {
    assert(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  return exports;
}
function harness() {
  const slots = [], effects = [];
  let index, dirty, component, tree;
  const react = {
    useState(initial) {
      const i = index++;
      slots[i] ??= { value: initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || deps.some((v, j) => !Object.is(v, slots[i].deps[j]))) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    },
  };
  return {
    react,
    render(fn = component) {
      component = fn;
      for (let pass = 0; pass < 30; pass++) {
        dirty = false; index = 0; tree = component(); effects.splice(0).forEach(fn => fn());
        if (!dirty) return tree;
      }
      throw Error('Render loop');
    },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
  };
}
const find = (node, predicate) => Array.isArray(node) ? node.map(n => find(n, predicate)).find(Boolean) : node && typeof node === 'object' ? predicate(node) ? node : find(node.props?.children, predicate) : undefined;
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' ? node : '';
const flush = () => new Promise(resolve => setImmediate(resolve));

async function main() {
  const h = harness(), requests = [];
  let audio;
  class Audio {
    constructor() { audio = this; this.events = {}; this.src = ''; this.plays = 0; }
    pause() {}
    load() {}
    removeAttribute() { this.src = ''; }
    getAttribute() { return this.src; }
    addEventListener(name, fn) { this.events[name] = fn; }
    removeEventListener(name) { delete this.events[name]; }
    play() { this.plays++; return this.rejectPlay ? Promise.reject(Error('blocked')) : Promise.resolve(); }
  }
  const { HomeMultimedia } = load('src/components/home/HomeMultimedia.tsx', {
    react: h.react,
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'next/link': { default: 'a' },
    '@/components/multimedia/MultimediaPlayer': { MultimediaPlayer: 'Player' },
    '@/components/multimedia/AlbumLyrics': { AlbumLyrics: 'Lyrics' },
    '@/components/ui/button': { Button: 'button' },
  }, { Audio, AbortController, fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })) });
  let tree = h.render(HomeMultimedia);
  assert.match(text(tree), /Loading featured/);
  requests.shift().resolve({ ok: false }); await flush(); tree = h.render();
  assert.match(text(tree), /could not be loaded/);
  find(tree, n => n.type === 'button').props.onClick(); tree = h.render();
  const albums = requests.shift(); assert.match(albums.url, /scope=public/);
  albums.resolve({ ok: true, json: async () => ({ success: true, data: [{ id: 28, title: 'Album', artist: 'Artist' }] }) });
  await flush(); assert.match(requests[0].url, /scope=public&albumId=28/);
  requests.shift().resolve({ ok: true, json: async () => ({ success: true, data: [{ id: 1, title: 'Track', fileUrl: '/audio' }] }) });
  await flush(); tree = h.render();
  assert.equal(audio.plays, 0, 'Loading never autoplays');
  let player = find(tree, n => n.type === 'Player'); assert(player);
  audio.rejectPlay = true; player.props.onPlayPause(); h.render(); await flush(); tree = h.render();
  assert.match(text(tree), /Playback could not start/);
  assert.equal(find(tree, n => n.type === 'Player').props.isPlaying, false);
  audio.rejectPlay = false; find(tree, n => n.type === 'Player').props.onPlayPause(); h.render(); await flush();
  audio.events.error(); tree = h.render(); assert.match(text(tree), /could not be played/);
  find(tree, n => n.type === 'button').props.onClick(); h.render();
  requests.shift().resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
  await flush(); tree = h.render(); assert.match(text(tree), /No featured Tracks/);
  find(tree, n => n.type === 'button').props.onClick(); h.render();
  const pending = requests.shift(); h.unmount(); assert(pending.options.signal.aborted);
  assert.equal(audio.src, ''); assert.equal(Object.keys(audio.events).length, 0);

  const link = ({ children, ...props }) => React.createElement('a', props, children);
  const modules = {
    '@/libraries/config/project-showcase': load('src/libraries/config/project-showcase.ts', {}),
    '@/libraries/config/app-links': load('src/libraries/config/app-links.ts', {}),
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: link },
    'next/image': { default: ({ sizes, ...props }) => React.createElement('img', props) },
    'lucide-react': { ArrowRight: () => null },
    '@/components/ui/button': { Button: ({ children }) => children },
    '@/components/layout/AppHeader': { AppHeader: () => null },
    '@/components/home/GardenHero': { default: () => null },
    '@/components/settings/ModuleAppearanceProvider': { ModuleIcon: () => null },
    '@/components/home/HomeMultimedia': { HomeMultimedia: () => null },
  };
  const imageHooks = harness();
  const { ProjectFeaturedImage } = load('src/components/home/ProjectFeaturedImage.tsx', {
    ...modules,
    react: imageHooks.react,
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'lucide-react': { ImageIcon: 'icon' },
  });
  let imageTree = imageHooks.render(() => ProjectFeaturedImage({ projectId: 17 }));
  const imageNode = find(imageTree, node => Boolean(node.props?.src));
  assert.equal(imageNode.props.src, '/home/showcase/project-design.png');
  imageNode.props.onError();
  assert(text(imageHooks.render()).includes('image unavailable'));
  imageTree = imageHooks.render(() => ProjectFeaturedImage({ projectId: 17, featured_image: 'https://example.com/replacement.png' }));
  assert.equal(find(imageTree, node => Boolean(node.props?.src)).props.src, 'https://example.com/replacement.png');
  assert(text(imageHooks.render(() => ProjectFeaturedImage({ projectId: 17, featured_image: null }))).includes('No featured image'));
  assert(text(imageHooks.render(() => ProjectFeaturedImage({ projectId: 999 }))).includes('No featured image'));
  for (const featured_image of [null, undefined, '/custom.png']) {
    const card = imageHooks.render(() => ProjectFeaturedImage({ projectId: 18, featured_image }));
    assert.equal(find(card, node => Boolean(node.props?.src)).props.src,
      featured_image ?? '/learn/screenshots/inglenook-home-design-project-20.webp');
  }
  const intro = load('src/components/home/HomeIntroduction.tsx', modules);
  const html = renderToStaticMarkup(React.createElement(load('src/app/page.tsx', { ...modules, '@/components/home/HomeIntroduction': intro }).default));
  for (const phrase of ['Plan your space.', 'Real Projects.', 'A simple place to start.', 'Before you get started.']) assert(html.includes(phrase), 'Initial HTML includes '+phrase);
  assert.equal((html.match(/<details/g) || []).length, 4);
  for (const id of [5, 15, 17]) assert(html.includes(`projectId=${id}&amp;view=design`));
  for (const name of ['garden-project', 'project-design', 'soccer-project']) assert(fs.existsSync(`public/home/showcase/${name}.png`));
  console.log('PASS Home: initial HTML, actual capture links, FAQ, public API envelopes, loading/error/retry/empty, rejected playback, media errors, no autoplay and cleanup (mock boundaries).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
