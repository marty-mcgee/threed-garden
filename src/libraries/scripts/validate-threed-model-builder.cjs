// Offline geometry and raw-pixel contract. No DOM, network, auth, storage or environment access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const THREE = require('three');
const originalTsLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  assert(filename.includes(`${path.sep}model-builder${path.sep}`), 'Only generator TypeScript is loaded by this offline adapter.');
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, filename);
};
const { createCottage } = require('../services/threed/model-builder/cottage.ts');
const { normalizeCottageParameters, canonicalCottageParameters, COTTAGE_DEFAULTS } = require('../services/threed/model-builder/parameters.ts');
if (originalTsLoader) require.extensions['.ts'] = originalTsLoader; else delete require.extensions['.ts'];

const p = normalizeCottageParameters();
assert.equal(p.door_height, 80); assert.equal(p.door_width, 36);
assert.equal(canonicalCottageParameters(p), canonicalCottageParameters(Object.fromEntries(Object.entries(p).reverse())));
for (const invalid of [null, [], { main_width: NaN }, { seed: 1.5 }, { units: 'metres' }, { unknown: 12 }, { constructor: 'unexpected' }, JSON.parse('{"__proto__":{}}'),
  { texture_resolution: 512 }, { main_depth: 360, front_section_depth: 300 }, { porch_depth: 220 },
  { window_width: 84, front_section_depth: 180 }, { skylight_length: 72 }, { front_glazing_height: 140 },
  { rear_wall_height: 120 }, { wing_width: 240, wing_depth: 180 }, { door_height: 108 }, { main_width: 240, window_width: 84 }, { main_depth: 600 }]) assert.throws(() => normalizeCottageParameters(invalid));
assert.deepEqual(normalizeCottageParameters({}), COTTAGE_DEFAULTS);
console.log('  Passed: finite bounded inputs, units, frame/door/window/hip/skylight fits and canonical parameters.');

const bundle = createCottage({ texture_resolution: 64 });
const meshes = bundle.root.children;
assert(bundle.stats.meshCount > 150); assert(bundle.stats.triangleCount > 10000 && bundle.stats.triangleCount < 50000);
assert(bundle.stats.texturePixels <= 18*256*256);
assert.equal(new Set(bundle.parts.map(p => p.id)).size, bundle.parts.length);
for (const mesh of meshes) {
  assert(mesh instanceof THREE.Mesh); const geometry = mesh.geometry, positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  assert.equal(positions.count,normals.count); assert.equal(positions.count,geometry.getAttribute('uv').count); assert.equal(positions.count,geometry.getAttribute('color').count);
  for (const attribute of Object.values(geometry.attributes)) for (const value of attribute.array) assert(Number.isFinite(value), `${mesh.name} contains a non-finite value`);
  for (let i = 0; i < normals.count; i++) assert(Math.abs(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))-1) < 1e-5, `${mesh.name} has an invalid normal`);
  for (const index of geometry.index.array) assert(index >= 0 && index < positions.count);
  for (let i = 0; i < geometry.index.count; i += 3) {
    const ids = [geometry.index.getX(i),geometry.index.getX(i+1),geometry.index.getX(i+2)], points = ids.map(index => new THREE.Vector3().fromBufferAttribute(positions,index));
    const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    assert(normal.lengthSq() > 1e-14, `${mesh.name} has a degenerate triangle`);
    assert(normal.normalize().dot(new THREE.Vector3().fromBufferAttribute(normals,ids[0])) > .999, `${mesh.name} winding disagrees with its normal`);
  }
}
assert(Math.abs(bundle.bounds.min[1]) < 1e-6);
assert(Math.abs(bundle.bounds.size[0] - (p.main_width+2*p.wing_width+2*p.walkway_width+1.6)*.0254) < 1e-5);
assert(Math.abs(bundle.bounds.size[2] - (p.main_depth+2*p.walkway_width+1.6)*.0254) < 1e-5);
console.log(`  Passed: ${bundle.stats.meshCount} named parts, ${bundle.stats.triangleCount} non-degenerate triangles, finite UV/colors, winding/normals, metre bounds.`);

function hits(names, originInches, direction) {
  bundle.root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(...originInches).multiplyScalar(.0254),new THREE.Vector3(...direction).normalize());
  return ray.intersectObjects(meshes.filter(mesh => names.includes(mesh.name)),false);
}
const front = -p.main_depth/2, back = p.main_depth/2, floor = p.floor_elevation, join = front+p.front_section_depth, half = p.main_width/2;
assert.equal(hits(['rear_wall'],[0,floor+p.door_height/2,back+20],[0,0,-1]).length,0,'Rear door is a real wall aperture');
assert(hits(['rear_wall'],[p.door_width/2+12,floor+p.door_height/2,back+20],[0,0,-1]).length > 0,'Wall remains beside the door');
assert.equal(hits(['rear_wall'],[-p.main_width*.29,floor+p.window_sill_height+p.window_height/2,back+20],[0,0,-1]).length,0);
const gw = (p.main_width-p.chimney_width-72)/2, glassCenter = p.chimney_width/2+18+gw/2;
assert.equal(hits(['front_wall'],[glassCenter,floor+6+p.front_glazing_height/2,front-20],[0,0,1]).length,0);
const cx = (p.chimney_width/2+14+half-42)/2, cy = floor+p.front_wall_height+10;
assert.equal(hits(['gable_side_panel','gable_glazing_surround'],[cx,cy,front-20],[0,0,1]).length,0,'Clerestories have real gable apertures');
for (const side of [-1,1]) for (const fraction of [.28,.73]) {
  const x = side*half*.55, z = front+p.front_section_depth*fraction;
  for (const dx of [0,-p.skylight_width/2+2,p.skylight_width/2-2]) for (const dz of [0,-p.skylight_length/2+2,p.skylight_length/2-2]) {
    assert.equal(hits([`front_gable_roof_${side < 0 ? 'left' : 'right'}`,`front_gable_roof_${side < 0 ? 'left' : 'right'}_soffit`],[x+dx,600,z+dz],[0,-1,0]).length,0,'Complete skylight rectangle passes through both roof surfaces');
    assert.equal(hits([`interior_vaulted_ceiling_front_${side}`,`interior_vaulted_ceiling_front_${side}_soffit`],[x+dx,600,z+dz],[0,-1,0]).length,0,'Complete skylight rectangle passes through both ceiling surfaces');
  }
  assert(hits([`front_gable_roof_${side < 0 ? 'left' : 'right'}`],[x,600,z+p.skylight_length],[0,-1,0]).length > 0,'Roof remains beside skylight');
  for (const rafterZ of Array.from({ length: Math.ceil(p.front_section_depth/32) },(_,i) => front+i*32).filter(value => Math.abs(value-z) < p.skylight_length/2-4)) {
    assert.equal(hits(['front_gable_roof_rafter'],[x,600,rafterZ],[0,-1,0]).length,0,'Decorative rafters do not cross actual skylight openings');
  }
}
assert.equal(hits(['interior_living_rear_partition'],[0,floor+40,join],[0,0,1]).length,0);
assert(hits(['interior_living_rear_partition'],[p.hall_width/2+20,floor+40,join],[0,0,1]).length > 0);
for (const s of [-1,1]) for (let i = 0; i < 4; i++) assert(meshes.some(m => m.name === `wing_hip_roof_${s}_slope_${i}`));
for (const mesh of meshes.filter(m => /^(front_gable_roof_(left|right)|rear_gable_roof_(left|right)|wing_hip_roof_-?1_slope_[0-3])$/.test(m.name))) {
  const normals = mesh.geometry.getAttribute('normal'); for (let i = 0; i < normals.count; i++) assert(normals.getY(i) > 0,'Every external roof slope faces upward');
}
for (const name of ['gable_side_panel','gable_glazing_surround','step_gable','rear_gable']) {
  const normals = meshes.find(mesh => mesh.name === name).geometry.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) assert(normals.getZ(i)*(name === 'rear_gable' ? 1 : -1) > .99,'Gable normals face the exterior');
}
for (const mesh of meshes.filter(m => m.material.name === 'clear_tinted_glass')) {
  assert.equal(mesh.geometry.index.count,6,'Each glazing aperture uses a single two-triangle pane');
  assert.equal(mesh.material.side,THREE.DoubleSide); assert.equal(mesh.material.opacity,p.glass_opacity); assert.equal(mesh.material.transparent,true);
}
console.log('  Passed: ray-tested wall/clerestory/skylight/ceiling/interior-door apertures; four-slope wing roofs and single double-sided glass panes.');

for (const recipe of bundle.materials) {
  if (!recipe.textureBindings.baseColor) continue;
  assert.equal(recipe.textureBindings.occlusion,recipe.textureBindings.roughness); assert.equal(recipe.textureBindings.roughness,recipe.textureBindings.metallic);
  assert.equal(recipe.material.aoMap,recipe.material.roughnessMap); assert.equal(recipe.material.roughnessMap,recipe.material.metalnessMap);
  assert.equal(recipe.material.map.colorSpace,THREE.SRGBColorSpace); assert.equal(recipe.material.normalMap.colorSpace,THREE.NoColorSpace);
  assert.equal(recipe.material.normalScale.x,.7); assert.equal(recipe.material.normalScale.y,-.7,'Tangentless Three/glTF convention must retain raw normal pixels during export');
}
for (const texture of bundle.textures) {
  assert.equal(texture.pixels.length,texture.width*texture.height*4); assert.equal(texture.texture.flipY,false); assert.equal(texture.texture.wrapS,THREE.RepeatWrapping);
  assert.equal(texture.texture.magFilter,THREE.LinearFilter); assert.equal(texture.texture.minFilter,THREE.LinearMipmapLinearFilter); assert.equal(texture.texture.generateMipmaps,true);
  if (texture.role === 'packedORM') for (let i = 0; i < texture.pixels.length; i += 4) {
    assert(texture.pixels[i] >= 158 && texture.pixels[i] <= 255); assert(texture.pixels[i+1] >= 100); assert.equal(texture.pixels[i+2],0); assert.equal(texture.pixels[i+3],255);
  }
  if (texture.role === 'normal') for (let i = 0; i < texture.pixels.length; i += 4) {
    const length = Math.hypot(...[0,1,2].map(c => texture.pixels[i+c]/255*2-1)); assert(Math.abs(length-1) < .015); assert(texture.pixels[i+2] >= 128);
  }
}
console.log('  Passed: color/data spaces, repeat/orientation, tangent normals and shared R-occlusion/G-roughness/B-metallic packing.');

function digest(b) {
  const hash = crypto.createHash('sha256'); hash.update(canonicalCottageParameters(b.parameters));
  for (const mesh of b.root.children) { hash.update(mesh.name); for (const attribute of Object.values(mesh.geometry.attributes)) hash.update(Buffer.from(attribute.array.buffer)); hash.update(Buffer.from(mesh.geometry.index.array.buffer)); }
  for (const texture of b.textures) hash.update(texture.pixels);
  return hash.digest('hex');
}
const repeat = createCottage({ texture_resolution: 64 }); assert.equal(digest(bundle),digest(repeat));
const reseeded = createCottage({ texture_resolution: 64, seed: 1118 }); assert.notEqual(digest(bundle),digest(reseeded));
const scaled = createCottage({ texture_resolution: 64, overall_scale: 2 });
for (let i = 0; i < meshes.length; i++) {
  const a = meshes[i].geometry.getAttribute('position').array, b = scaled.root.children[i].geometry.getAttribute('position').array;
  assert.equal(a.length,b.length); for (let j = 0; j < a.length; j++) assert.equal(b[j],a[j]*2,'Overall scale is applied exactly once');
}
const shell = createCottage({ texture_resolution: 64, interior_enabled: false }); assert(shell.parts.every(part => !part.id.startsWith('interior_')));
let geometryDisposals = 0, materialDisposals = 0, textureDisposals = 0;
bundle.root.children.forEach(mesh => mesh.geometry.addEventListener('dispose',() => geometryDisposals++));
bundle.materials.forEach(r => r.material.addEventListener('dispose',() => materialDisposals++));
bundle.textures.forEach(t => t.texture.addEventListener('dispose',() => textureDisposals++));
const meshCount = bundle.stats.meshCount; bundle.dispose(); bundle.dispose();
assert.equal(geometryDisposals,meshCount); assert.equal(materialDisposals,bundle.materials.length); assert.equal(textureDisposals,bundle.textures.length); assert.equal(bundle.root.children.length,0);
[repeat,reseeded,scaled,shell].forEach(b => b.dispose());
console.log('  Passed: deterministic seed/input reproduction, single scale conversion, optional interior and idempotent complete resource disposal.');

// Exercise the actual CLI with a process-local TypeScript adapter (tsx needs an OS-user API unavailable in some sandboxes).
const os = require('node:os'), { spawnSync } = require('node:child_process');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'threed-cottage-'));
try {
  const root = path.resolve(__dirname,'../../..'), cli = path.join(__dirname,'build-threed-cottage.ts');
  const bootstrap = path.join(temporary,'offline-loader.cjs'), config = path.join(temporary,'dimensions.json');
  fs.writeFileSync(bootstrap,`const fs=require('node:fs'),ts=require(${JSON.stringify(require.resolve('typescript'))});require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,filename);`);
  fs.writeFileSync(config,JSON.stringify({ texture_resolution: 64 }));
  const run = directory => spawnSync(process.execPath,['--require',bootstrap,cli,'--input',config,'--output',directory],{ cwd: root, encoding: 'utf8', timeout: 30000 });
  const outputA = path.join(temporary,'first'), outputB = path.join(temporary,'second');
  const first = run(outputA), second = run(outputB); assert.equal(first.status,0,first.stderr); assert.equal(second.status,0,second.stderr);
  const reportA = fs.readFileSync(path.join(outputA,'generation-report.json')), reportB = fs.readFileSync(path.join(outputB,'generation-report.json')); assert(reportA.equals(reportB));
  const report = JSON.parse(reportA); assert.equal(report.artifacts.length,19); assert.equal(report.geometry.triangleCount,bundle.stats.triangleCount); assert.equal(report.generator.outputUnits,'metres');
  for (const artifact of report.artifacts) { const data = fs.readFileSync(path.join(outputA,artifact.path)); assert.equal(data.length,artifact.bytes); assert.equal(crypto.createHash('sha256').update(data).digest('hex'),artifact.sha256); }
  assert(report.textures.every(t => t.format === 'RGBA8' && t.path.endsWith('.rgba'))); assert(!fs.existsSync(path.join(outputA,'cottage.glb')));
  assert.equal(run(outputA).status,1,'Existing artifacts cannot be overwritten'); assert(fs.readFileSync(path.join(outputA,'generation-report.json')).equals(reportA));
  console.log('  Passed: actual offline CLI produces reproducible geometry/raw-RGBA reports with verified SHA-256 and refuses artifact replacement.');
} finally {
  const resolved = path.resolve(temporary), intendedParent = path.resolve(os.tmpdir())+path.sep;
  assert(resolved.startsWith(intendedParent) && path.basename(resolved).startsWith('threed-cottage-'));
  fs.rmSync(resolved,{ recursive: true, force: true });
}
