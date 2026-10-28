// Actual Markdown renderer and public hooks/components with deferred offline HTTP boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, modules, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, AbortController, ...globals, require(name) {
    assert(Object.hasOwn(modules, name), `Unexpected dependency ${name} in ${file}`);
    return modules[name];
  } });
  return exports;
}
const jsx = (type, props) => ({ type, props: props ?? {} });
const runtime = { jsx, jsxs: jsx };
const icons = new Proxy({}, { get: (_, key) => key });
const text = node => Array.isArray(node) ? node.map(text).join(' ') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
function all(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => all(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
const one = (node, predicate) => { const matches = all(node, predicate); assert.equal(matches.length, 1); return matches[0]; };
const button = (node, label) => one(node, item => item.type === 'button' && text(item).trim() === label);
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness() {
  const slots = []; let cursor = 0, dirty = false, component, tree;
  const jobs = [];
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const react = {
    useState(initial) { const index = cursor++; slots[index] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, value => {
      const next = typeof value === 'function' ? value(slots[index].value) : value;
      if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
    }]; },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useEffect(effect, deps) { const index = cursor++; if (!slots[index] || changed(slots[index].deps, deps)) jobs.push(() => {
      slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: effect() };
    }); },
  };
  const requests = [];
  const fetch = (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
  const hook = load('src/components/learn/use-public-learn.ts', { react }, { fetch });
  return { react, hook, requests,
    render(fn = component) { component = fn; for (let pass = 0; pass < 30; pass++) {
      dirty = false; cursor = 0; tree = component(); jobs.splice(0).forEach(job => job()); if (!dirty) return tree;
    } throw Error('Render loop'); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

const contracts = load('src/components/learn/learn-public-data.ts', {});
const row = slug => ({ slug, title: `Guide ${slug}`, summary: `Summary ${slug}`, updatedAt: '2026-10-27T00:00:00.000Z' });
const page = (slugs, total = slugs.length, offset = 0) => ({ success: true, data: slugs.map(row), pagination: { total, limit: 12, offset } });
const detail = slug => ({ success: true, data: { ...row(slug), content: `Private-to-response body ${slug}` } });
const respond = (request, body, status = 200) => request.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

(async () => {
  const markdownLibrary = await import('react-markdown');
  const gfm = await import('remark-gfm');
  const markdown = load('src/components/learn/LearnMarkdown.tsx', {
    'react-markdown': { default: markdownLibrary.default }, 'remark-gfm': { default: gfm.default }, 'react/jsx-runtime': require('react/jsx-runtime'),
  });
  const content = '# Heading\n\nOrdinary **strong** text.\n\n1. First\n2. Second\n\n- [x] Done\n\n| Name | Value |\n| --- | --- |\n| Safe | Yes |\n\n```html\n<script>literal code</script>\n```\n\n'
    + '<script>alert("executed")</script>\n\n<img src="x" onerror="alert(1)">\n\n'
    + '[Script](javascript:alert%281%29) [Encoded](jav&#x61;script:alert%281%29) [Data](data:text/html,evil) [File](file:///private) [Network](//evil.example/path)\n\n'
    + '[Guide](/learn/guides/draw-room) [Web](https://example.test/guide) [Mail](mailto:reader@example.test)\n\n'
    + '![Unsafe image](data:image/svg+xml;base64,PHN2Zz4=) ![Preview](/images/preview.png)';
  const html = renderToStaticMarkup(React.createElement(markdown.LearnMarkdown, { content }));
  assert.match(html, /<strong>strong<\/strong>/); assert.match(html, /<ol>/); assert.match(html, /<table/); assert.match(html, /<input[^>]*type="checkbox"/);
  assert.match(html, /&lt;script&gt;literal code&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script|onerror=|href="(?:javascript|data|file|\/\/)|src="data:|alert\(&quot;executed/);
  for (const href of ['/learn/guides/draw-room', 'https://example.test/guide', 'mailto:reader@example.test']) assert(html.includes(`href="${href}"`));
  assert.match(html, /src="\/images\/preview\.png"/);
  for (const url of ['javascript:alert(1)', 'java\nscript:alert(1)', '\\evil.example', '//evil.example', 'data:text/html,evil', 'vbscript:evil']) assert.equal(markdown.safeLearnUrl(url), undefined);
  assert.equal(markdown.safeLearnUrl('mailto:reader@example.test', 'src'), undefined);

  const starters = load('src/libraries/data/learn/starter-guides.ts', {}).starterLearnGuides;
  assert.equal(starters.length, 14); assert.equal(new Set(starters.map(guide => guide.slug)).size, 14);
  for (const [index, guide] of starters.entries()) {
    assert(contracts.isLearnGuideSlug(guide.slug)); assert(guide.summary.length <= 500); assert(guide.content.includes('## Expected result'));
    assert(guide.content.includes('https://github.com/marty-mcgee/threed-garden/blob/main/docs/')); assert.equal(guide.sortOrder, (index + 1) * 10);
    assert.equal(guide.isActive, true); assert.equal(guide.isPublished, true);
    assert(renderToStaticMarkup(React.createElement(markdown.LearnMarkdown, { content: guide.content })).includes('<ol>'));
  }
  assert(starters.find(guide => guide.slug === 'design-json').content.includes('Replacement replaces architectural content only'));
  const projected = contracts.readPublicLearnPage({ ...page(['public']), data: [{ ...row('public'), content: 'not a list field', createdBy: 'private attribution' }] });
  assert.deepEqual(Object.keys(projected.data[0]).sort(), ['slug', 'summary', 'title', 'updatedAt']);

  // Exercise the actual request hook, including old completions that ignore abort.
  const h = harness(); let url = '/api/learn/public/guides?search=old';
  const render = () => h.render(() => h.hook.usePublicLearn(url, contracts.readPublicLearnPage));
  assert.equal(render().status, 'loading'); const old = h.requests.shift(); assert.equal(old.options.cache, 'no-store');
  url = '/api/learn/public/guides?search=new'; render(); const latest = h.requests.shift(); assert(old.options.signal.aborted);
  respond(latest, page(['new'])); await flush(); assert.equal(render().data.data[0].slug, 'new');
  respond(old, page(['old'])); await flush(); assert.equal(render().data.data[0].slug, 'new');
  render().retry(); assert.equal(render().data, null); const failed = h.requests.shift(); failed.reject(Error('private diagnostic')); await flush();
  assert.equal(render().status, 'error'); assert.equal(render().data, null);
  render().retry(); render(); respond(h.requests.shift(), { success: true, data: 'bad' }); await flush(); assert.equal(render().status, 'error');
  render().retry(); render(); respond(h.requests.shift(), page([])); await flush(); assert.equal(render().status, 'success'); assert.equal(render().data.data.length, 0);
  url = null; assert.equal(render().status, 'idle'); assert.equal(render().data, null); assert.equal(h.requests.length, 0);
  url = '/api/learn/public/guides?search=unmounted'; render(); const cancelled = h.requests.shift(); h.unmount(); assert(cancelled.options.signal.aborted);

  // Render the real public library with mocked icons/UI and the real request hook.
  const libraryHarness = harness(), listeners = new Map();
  const browser = { location: { hash: '#draw-room' }, addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) };
  const library = load('src/components/learn/LearnGuideLibrary.tsx', {
    react: libraryHarness.react, 'react/jsx-runtime': runtime, 'next/link': { default: 'link' }, 'lucide-react': icons,
    '@/components/settings/ModuleAppearanceProvider': { ModuleIcon: 'module-icon' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/card': { Card: 'card', CardContent: 'content' },
    './LearnGuideReader': { LearnGuideReader: 'reader' }, './learn-public-data': contracts, './use-public-learn': libraryHarness.hook,
  }, { window: browser });
  const draw = () => libraryHarness.render(() => library.LearnGuideLibrary());
  let tree = draw(); assert.match(text(tree), /Loading Learn guides/); assert.equal(one(tree, node => node.type === 'reader').props.slug, 'draw-room');
  assert.equal(libraryHarness.requests.length, 1, 'The list request never fetches every guide body');
  respond(libraryHarness.requests.shift(), page(['draw-room', 'second', 'how-to'], 25)); await flush(); tree = draw();
  assert.equal(one(tree, node => node.type === 'link' && node.props.href === '/learn/guides/draw-room').props['aria-label'], 'Read Guide draw-room');
  assert.equal(all(tree, node => node.props.id === 'draw-room').length, 0, 'Legacy reader owns its anchor without a duplicate card ID');
  assert.equal(all(tree, node => node.props.id === 'how-to').length, 0, 'A custom guide slug must not duplicate a static landing-section anchor');
  button(tree, 'Next').props.onClick(); tree = draw(); const secondPage = libraryHarness.requests.shift(); assert.match(secondPage.url, /offset=12/);
  one(tree, node => node.type === 'input').props.onChange({ target: { value: 'walls' } }); tree = draw();
  one(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }); tree = draw(); const searched = libraryHarness.requests.shift();
  assert.match(searched.url, /search=walls/); assert.match(searched.url, /offset=0/); assert(secondPage.options.signal.aborted);
  respond(searched, page(['walls'])); await flush(); respond(secondPage, page(['stale-page'], 25, 12)); await flush(); tree = draw();
  assert.match(text(tree), /Guide walls/); assert.doesNotMatch(text(tree), /stale-page/);
  button(tree, 'Clear').props.onClick(); draw(); respond(libraryHarness.requests.shift(), { error: 'private storage error' }, 503); await flush(); tree = draw();
  assert.match(text(tree), /could not be loaded/); assert.doesNotMatch(text(tree), /private storage error|Guide walls/);
  button(tree, 'Retry guides').props.onClick(); draw(); respond(libraryHarness.requests.shift(), page([])); await flush(); tree = draw();
  assert.match(text(tree), /awaiting publication/); assert.doesNotMatch(text(tree), /Prepare Model Files/);
  browser.location.hash = '#how-to'; listeners.get('hashchange')(); tree = draw(); assert.equal(all(tree, node => node.type === 'reader').length, 0);
  libraryHarness.unmount(); assert.equal(listeners.size, 0);

  const readerHarness = harness(); let slug = 'published';
  const reader = load('src/components/learn/LearnGuideReader.tsx', {
    react: readerHarness.react, 'react/jsx-runtime': runtime, 'next/link': { default: 'link' }, 'lucide-react': icons,
    '@/components/settings/ModuleAppearanceProvider': { ModuleIcon: 'module-icon' }, '@/components/ui/button': { Button: 'button' },
    './LearnMarkdown': { LearnMarkdown: 'markdown' }, './learn-public-data': contracts, './use-public-learn': readerHarness.hook,
  });
  const read = () => readerHarness.render(() => reader.LearnGuideReader({ slug }));
  assert.match(text(read()), /Loading guide/); respond(readerHarness.requests.shift(), detail('published')); await flush();
  tree = read(); assert.equal(one(tree, node => node.type === 'markdown').props.content, 'Private-to-response body published');
  slug = 'unpublished'; tree = read(); assert.equal(all(tree, node => node.type === 'markdown').length, 0);
  respond(readerHarness.requests.shift(), { success: false, error: 'Guide not found.' }, 404); await flush(); tree = read();
  assert.match(text(tree), /Guide not found/); assert.equal(all(tree, node => node.type === 'markdown').length, 0);
  slug = 'temporary-error'; read(); respond(readerHarness.requests.shift(), null, 503); await flush(); tree = read(); assert.match(text(tree), /could not be loaded/);
  button(tree, 'Retry guide').props.onClick(); read(); respond(readerHarness.requests.shift(), detail('temporary-error')); await flush(); assert.equal(all(read(), node => node.type === 'markdown').length, 1);
  slug = '../invalid'; assert.match(text(read()), /Guide not found/); assert.equal(readerHarness.requests.length, 0); readerHarness.unmount();
  console.log('PASS Learn public: real safe GFM rendering, fourteen explicit starter guides, summary paging/search, legacy anchors, aborted/stale loads, retry/empty/error states and unpublished 404 handling (mock HTTP; no server).');
})().catch(error => { console.error(error); process.exitCode = 1; });
