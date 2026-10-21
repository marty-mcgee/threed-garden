const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');
const { renderToStaticMarkup } = require('react-dom/server');
const { load: parseHtml } = require('cheerio');

// Render the actual Dashboard components with React. UI wrappers/visualizers are
// inert; AlbumGrid's initial hover is seeded because SSR cannot dispatch a hover.
// No network, storage, browser, server or persistence is used by this fixture.
function component(file, hoveredAlbumId) {
  const exports = {};
  const elements = [];
  const primitive = ({ children, className }) => React.createElement('div', { className }, children);
  const wrappers = new Proxy({}, { get: () => primitive });
  const empty = new Proxy({}, { get: () => () => null });
  const runtime = { ...jsx };
  for (const key of ['jsx', 'jsxs']) runtime[key] = (...args) => {
    const element = jsx[key](...args);
    elements.push(element);
    return element;
  };
  const requireMock = (name) => {
    if (name === 'react') return hoveredAlbumId === undefined ? React : {
      ...React,
      useState: (initial) => React.useState(initial === null ? hoveredAlbumId : initial),
    };
    if (name === 'react/jsx-runtime') return runtime;
    if (name.startsWith('@/components/ui/')) return wrappers;
    if (name === '@/libraries/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
    if (['lucide-react', './WaveformVisualizer', './MediaGallery'].includes(name)) return empty;
    throw new Error(`Unexpected component dependency: ${name}`);
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: requireMock }, { filename: file });
  return { exports, elements };
}

const tracks = [-10000, 0, 0, 10000, null].map((trackNumber, index) => ({
  id: 40 - index,
  title: `Track ${index}`,
  trackNumber,
  duration: 60,
  fileUrl: `https://example.invalid/track-${index}.mp3`,
}));
const album = {
  id: 8, title: 'First Album', artist: 'Artist', coverArt: 'https://example.invalid/cover.jpg',
  releaseYear: null, description: null,
};
const rankText = (track) => track.trackNumber === null ? '—' : String(track.trackNumber);
const noop = () => {};

for (const sequence of [tracks, [...tracks].reverse()]) {
  const { exports, elements } = component('src/components/multimedia/MultimediaPlayer.tsx');
  const selections = [];
  const html = renderToStaticMarkup(React.createElement(exports.MultimediaPlayer, {
    album, tracks: sequence, track: sequence[1], isPlaying: false,
    currentTime: 0, duration: 60, volume: 1, isMuted: false, formatTime: () => '1:00',
    onPlayPause: noop, onNext: noop, onPrevious: noop, onSeek: noop,
    onVolumeChange: noop, onToggleMute: noop, onTrackSelect: (index) => selections.push(index),
  }));
  const $ = parseHtml(html);
  assert.deepEqual($('span.font-mono').map((_, element) => $(element).text()).get(), sequence.map(rankText));
  assert.deepEqual($('.group p.truncate.text-sm').map((_, element) => $(element).text()).get(), sequence.map((track) => track.title));
  const rows = elements.filter((element) => element.type === 'div' &&
    element.props.className?.includes('cursor-pointer transition-all group'));
  assert.deepEqual(rows.map((row) => row.key), sequence.map((track) => String(track.id)));
  rows.forEach((row) => row.props.onClick());
  assert.deepEqual(selections, sequence.map((_, index) => index), 'Playback selects array positions, independently of signed rank or ID');
}

for (const sequence of [tracks, [...tracks].reverse()]) {
  const { exports, elements } = component('src/components/multimedia/AlbumGrid.tsx', album.id);
  const selections = [];
  const albums = [{ ...album, tracks: sequence }, { ...album, id: 2, title: 'Second Album', tracks }];
  const html = renderToStaticMarkup(React.createElement(exports.AlbumGrid, {
    albums, onSelectAlbum: (id) => selections.push(id),
  }));
  const $ = parseHtml(html);
  assert.deepEqual($('h3').map((_, element) => $(element).text()).get(), albums.map((item) => item.title));
  assert.deepEqual($('span.font-mono').map((_, element) => $(element).text()).get(), sequence.slice(0, 3).map(rankText));
  assert.deepEqual($('span.truncate').map((_, element) => $(element).text()).get(), sequence.slice(0, 3).map((track) => track.title));
  assert.ok($.text().includes('+2 more tracks'), 'Preview retains its existing three-item limit');
  const cards = elements.filter((element) => typeof element.props.onMouseEnter === 'function');
  assert.deepEqual(cards.map((card) => card.key), albums.map((item) => String(item.id)));
  cards.forEach((card) => card.props.onClick());
  assert.deepEqual(selections, albums.map((item) => item.id));
}

console.log('PASS: actual Dashboard Player and Album preview rendering preserves negative/zero/positive/null Sort Order, supplied sequence, ID keys and playback selection (offline React rendering, mocked UI/hover).');

// Render the actual gallery: Primary is a badge, never a rank override.
{
 const {exports}=component('src/components/multimedia/MediaGallery.tsx');
 const items=[{id:5,sortOrder:null,isPrimary:true},{id:4,sortOrder:10000},{id:3,sortOrder:0},{id:2,sortOrder:0},{id:1,sortOrder:-10000}].map(m=>({...m,fileName:'Image '+m.id,fileType:'image/png',fileUrl:'https://example.invalid/'+m.id+'.png'}));
 const original=JSON.stringify(items);
 const $=parseHtml(renderToStaticMarkup(React.createElement(exports.MediaGallery,{media:items})));
 assert.deepEqual($('[role="button"]').map((_,e)=>$(e).attr('aria-label')).get(),[1,2,3,4,5].map(id=>'Open Image '+id));
 assert.equal(JSON.stringify(items),original);
 const rendered=component('src/components/multimedia/MultimediaPlayer.tsx');
 const links=[{id:2,title:'First link',url:'https://example.invalid/first',displayOrder:-1},{id:1,title:'Second link',url:'https://example.invalid/second',displayOrder:0}];
 const html=renderToStaticMarkup(React.createElement(rendered.exports.MultimediaPlayer,{album:{...album,links},track:tracks[0],tracks,isPlaying:false,currentTime:0,duration:60,volume:1,isMuted:false,formatTime:()=> '1:00',onPlayPause:noop,onNext:noop,onPrevious:noop,onSeek:noop,onVolumeChange:noop,onToggleMute:noop,onTrackSelect:noop}));
 assert(html.indexOf('First link')<html.indexOf('Second link'));
 console.log('PASS: Media gallery ranks -10000/0/10000/null, ID ties, Primary badge independence and supplied Link order (offline React).');
}
