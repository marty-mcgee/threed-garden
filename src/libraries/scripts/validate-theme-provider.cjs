// Offline execution of the actual ThemeProvider with a minimal hook/effect scheduler.
// Browser adapters deliberately reject individual persistence operations; no network/DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const filename = 'src/components/themes/provider.tsx';
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;

function providerFixture(options = {}) {
  const stored = new Map(Object.entries(options.stored ?? {}));
  const storageReads = [], storageWrites = [], cookieWrites = [];
  const listeners = new Set();
  const classes = new Set();
  const style = {};
  const effects = [], states = [];
  let cursor = 0, dirty = false, tree, context;
  let mediaAdds = 0, mediaRemoves = 0;
  const media = {
    matches: options.systemDark ?? true,
    addEventListener(event, handler) {
      assert.equal(event, 'change');
      mediaAdds++;
      listeners.add(handler);
    },
    removeEventListener(event, handler) {
      assert.equal(event, 'change');
      mediaRemoves++;
      assert(listeners.delete(handler), 'Cleanup must remove the registered listener');
    },
  };
  const storage = {
    getItem(key) {
      storageReads.push(key);
      if (options.readFails) throw new Error('Storage read blocked');
      return stored.get(key) ?? null;
    },
    setItem(key, value) {
      storageWrites.push([key, value]);
      if (options.writeFails) throw new Error('Storage write blocked');
      stored.set(key, value);
    },
  };
  const window = {
    get localStorage() {
      if (options.storageGetterFails) throw new Error('Storage access blocked');
      return storage;
    },
    matchMedia(query) {
      assert.equal(query, '(prefers-color-scheme: dark)');
      return media;
    },
  };
  const document = {
    set cookie(value) {
      cookieWrites.push(value);
      if (options.cookieFails) throw new Error('Cookie write blocked');
    },
    documentElement: {
      classList: { toggle(name, present) { if (present) classes.add(name); else classes.delete(name); } },
      style,
    },
  };
  const react = {
    createContext(initial) { context = { current: initial, Provider: {} }; return context; },
    useContext(value) { return value.current; },
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], next => {
        const value = typeof next === 'function' ? next(states[index]) : next;
        if (!Object.is(value, states[index])) { states[index] = value; dirty = true; }
      }];
    },
    useEffect(setup, deps) {
      const index = cursor++;
      const previous = effects[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects[index] = { setup, deps, cleanup: previous?.cleanup, pending: true };
      }
    },
    useMemo(factory) { cursor++; return factory(); },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, window, document,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      throw new Error(`Unexpected provider dependency: ${name}`);
    },
  }, { filename });
  const props = {
    children: null,
    initialTheme: options.initialTheme ?? 'dark',
    initialResolvedTheme: options.initialResolvedTheme ?? 'dark',
  };
  function flush() {
    let turns = 0;
    do {
      assert(++turns < 10, 'Provider must settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = exports.ThemeProvider(props);
      context.current = tree.props.value;
      for (const effect of effects) {
        if (!effect?.pending) continue;
        effect.pending = false;
        effect.cleanup?.();
        effect.cleanup = effect.setup();
      }
    } while (dirty);
  }
  flush();
  return {
    stored, storageReads, storageWrites, cookieWrites, listeners,
    state() { return exports.useTheme(); },
    expect(theme, resolved) {
      assert.equal(context.current.theme, theme);
      assert.equal(context.current.resolvedTheme, resolved);
      assert.equal(style.colorScheme, resolved);
      assert.deepEqual([...classes], [resolved], 'Exactly one DOM theme class must be active');
    },
    select(theme) { context.current.setTheme(theme); flush(); },
    system(dark) { media.matches = dark; for (const listener of listeners) listener(); flush(); },
    replayEffects() {
      for (const effect of effects) if (effect) { effect.cleanup?.(); effect.cleanup = undefined; effect.pending = true; }
      flush();
    },
    unmount() {
      for (const effect of effects) effect?.cleanup?.();
      assert.equal(listeners.size, 0, 'No system-color listener may survive unmount');
      assert.equal(mediaAdds, mediaRemoves, 'Every listener registration must be cleaned up');
    },
  };
}

function assertCookie(value, theme) {
  assert.equal(value, `threed-theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`);
}

// Server seed remains authoritative when there is no valid browser preference.
for (const options of [
  {},
  { stored: { 'threed-theme': 'invalid' } },
  { stored: { theme: 'invalid' } },
  // Preserve existing nullish-fallback precedence: an invalid current key does not
  // resurrect an older, potentially stale legacy value.
  { stored: { 'threed-theme': 'invalid', theme: 'dark' } },
  { storageGetterFails: true },
  { readFails: true, stored: { 'threed-theme': 'dark' } },
]) {
  const fixture = providerFixture({ initialTheme: 'light', initialResolvedTheme: 'light', ...options });
  fixture.expect('light', 'light');
  assert.equal(fixture.storageWrites.length, 0, 'A failed/invalid read must not overwrite browser preferences');
  assert.equal(fixture.cookieWrites.length, 0);
  assert.equal(fixture.listeners.size, 1, 'Read failure must not prevent system-color subscription');
  fixture.unmount();
}

// Valid current preferences win; absent current preferences migrate the legacy key.
for (const stored of [{ 'threed-theme': 'light', theme: 'dark' }, { theme: 'light' }]) {
  const fixture = providerFixture({ stored });
  fixture.expect('light', 'light');
  assert.equal(fixture.stored.get('threed-theme'), 'light');
  assertCookie(fixture.cookieWrites[0], 'light');
  assert.deepEqual(fixture.storageReads, stored['threed-theme'] ? ['threed-theme'] : ['threed-theme', 'theme']);
  fixture.unmount();
}

// Each failed operation is independent; explicit choices always update memory/DOM.
for (const options of [
  {}, { storageGetterFails: true }, { readFails: true }, { writeFails: true },
  { cookieFails: true }, { writeFails: true, cookieFails: true },
  { storageGetterFails: true, cookieFails: true },
]) {
  const fixture = providerFixture(options);
  fixture.expect('dark', 'dark');
  fixture.select('light');
  fixture.expect('light', 'light');
  assertCookie(fixture.cookieWrites.at(-1), 'light');
  if (!options.storageGetterFails) {
    assert.deepEqual(fixture.storageWrites.at(-1), ['threed-theme', 'light']);
    if (!options.writeFails) assert.equal(fixture.stored.get('threed-theme'), 'light');
  }
  fixture.select('system');
  fixture.expect('system', 'dark');
  fixture.system(false);
  fixture.expect('system', 'light');
  fixture.select('dark');
  fixture.expect('dark', 'dark');
  fixture.system(true);
  fixture.system(false);
  fixture.expect('dark', 'dark');
  fixture.select('system');
  fixture.expect('system', 'light');
  fixture.unmount();
}

// Migration must still select the saved theme and subscribe when either write fails.
for (const options of [{ writeFails: true }, { cookieFails: true }, { writeFails: true, cookieFails: true }]) {
  const fixture = providerFixture({ stored: { theme: 'system' }, systemDark: false, ...options });
  fixture.expect('system', 'light');
  assert.deepEqual(fixture.storageWrites[0], ['threed-theme', 'system']);
  assertCookie(fixture.cookieWrites[0], 'system');
  fixture.system(true);
  fixture.expect('system', 'dark');
  fixture.unmount();
}

// Cookie-seeded system mode synchronizes with media even when all persistence fails.
const restricted = providerFixture({
  initialTheme: 'system', initialResolvedTheme: 'dark', systemDark: false,
  storageGetterFails: true, cookieFails: true,
});
restricted.expect('system', 'light');
restricted.replayEffects();
assert.equal(restricted.listeners.size, 1, 'Effect replay must not duplicate media listeners');
restricted.system(true);
restricted.expect('system', 'dark');
restricted.unmount();

// The same public setter used by WorkspaceSettings keeps sequential account-theme
// application/restoration working; provider initialization must not replay on each choice.
const account = providerFixture({ stored: { 'threed-theme': 'light' }, writeFails: true, cookieFails: true });
const browserTheme = account.state().theme;
account.select('dark');
account.expect('dark', 'dark');
account.select(browserTheme);
account.expect('light', 'light');
assert.deepEqual(account.storageReads, ['threed-theme'], 'State changes must not reread and override the current choice');
account.unmount();

console.log('PASS ThemeProvider: actual provider handles restricted reads/writes independently, server fallback, current/legacy precedence, in-memory choices, system synchronization and listener cleanup (offline).');
