const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx', 'utf8');
const start = source.indexOf('const IMAGE_EXTENSIONS =');
const end = source.indexOf('function formatSize', start);
assert(start >= 0 && end > start, 'Thumbnail predicate must be found');
const compiled = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const isImageRow = new Function(`${compiled}; return isImageRow;`)();
for (const filePath of ['', '   ', null, undefined]) {
  assert.equal(isImageRow({ fileName: 'texture.png', filePath }), false);
}
assert.equal(isImageRow({ fileName: 'texture.PNG', filePath: '/textures/test.png' }), true);
assert.equal(isImageRow({ fileName: 'model.glb', filePath: '/models/test.glb' }), false);
console.log('PASS thumbnail predicate rejects absent/blank URLs and preserves valid image classification');
