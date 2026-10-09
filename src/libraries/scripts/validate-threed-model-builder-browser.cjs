// Optional real-browser proof. No application server, credentials, storage or database access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '../../..');
const browser = process.env.THREED_TEST_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(file => fs.existsSync(file));
if (!browser) throw new Error('Set THREED_TEST_BROWSER to an installed Chromium/Edge executable for the browser export proof.');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-builder-browser-'));
const source = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCottage } from './src/libraries/services/threed/model-builder/cottage';
import { exportCottageGlb, builderSha256 } from './src/libraries/services/threed/model-builder/export';
import { inspectThreeDGltfBundle, validateThreeDGltfBundleResources } from './src/libraries/services/threed/models/model-gltf-bundle-core';
import { bindThreeDModelMaterialTexture } from './src/libraries/services/threed/models/model-material-texture';
const check = (condition, message) => { if (!condition) throw new Error(message); };
const close = (a,b) => Math.abs(a-b) < 0.00001;
const pixels = image => {
  const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext('2d'); context.drawImage(image,0,0);
  return new Uint8Array(context.getImageData(0,0,canvas.width,canvas.height).data);
};
async function run() {
  const start = performance.now(), bundle = createCottage();
  const exported = await exportCottageGlb(bundle);
  const second = await exportCottageGlb(bundle);
  check(exported.sha256 === second.sha256, 'Same-browser GLB reproduction changed bytes');
  check(exported.images.every((image,i) => image.sha256 === second.images[i].sha256), 'PNG reproduction changed bytes');
  const bytes = new Uint8Array(await exported.file.arrayBuffer());
  const inspection = inspectThreeDGltfBundle(exported.file.name,bytes);
  check(!inspection.requirements.length, 'Unexpected external GLB dependency');
  check(!validateThreeDGltfBundleResources(inspection,[],false).length, 'Exported GLB failed resource/accessor checks');
  const loaded = await new GLTFLoader().parseAsync(bytes.buffer,'');
  const meshes = []; loaded.scene.traverse(node => { if (node.isMesh) meshes.push(node); });
  check(meshes.length === bundle.stats.meshCount, 'Part count changed after GLTFLoader decoding');
  check(new Set(meshes.map(mesh => mesh.name)).size === meshes.length, 'Part names are not unique');
  const bounds = new THREE.Box3().setFromObject(loaded.scene);
  check(bounds.min.toArray().every((value,i) => close(value,bundle.bounds.min[i])) && bounds.max.toArray().every((value,i) => close(value,bundle.bounds.max[i])), 'Metre bounds changed in export/import');
  const roles = { baseColor: 'map',normal: 'normalMap',occlusion: 'aoMap',roughness: 'roughnessMap',metallic: 'metalnessMap' };
  let verifiedRoles = 0;
  for (const recipe of bundle.materials) {
    const material = meshes.find(mesh => mesh.material.name === recipe.name)?.material;
    check(material, 'Missing imported material: ' + recipe.name);
    check(close(material.opacity,recipe.opacity) && close(material.roughness,recipe.roughness) && close(material.metalness,recipe.metalness), 'Authored factors changed: ' + recipe.name);
    check(material.color.toArray().every((value,i) => close(value,recipe.baseColor[i])), 'Material tint changed');
    if (recipe.doubleSided) check(material.side === THREE.DoubleSide && material.transparent, 'Glass lost blend/double-side state');
    for (const [role,id] of Object.entries(recipe.textureBindings)) {
      const texture = material[roles[role]], artifact = exported.images.find(image => image.artifact.id === id);
      check(texture && artifact, 'Missing PBR map: ' + role);
      check(texture.flipY === false && texture.channel === 0 && texture.wrapS === THREE.RepeatWrapping && texture.wrapT === THREE.RepeatWrapping, 'Sampler/orientation changed');
      check(texture.colorSpace === (role === 'baseColor' ? THREE.SRGBColorSpace : THREE.NoColorSpace), 'Incorrect color/data role');
      const managedImage = await createImageBitmap(artifact.file, { premultiplyAlpha: 'none',colorSpaceConversion: 'none' });
      check(await builderSha256(pixels(texture.image)) === await builderSha256(pixels(managedImage)), 'Managed PNG differs from embedded pixels: ' + id);
      const view = bindThreeDModelMaterialTexture(material,new THREE.Texture(managedImage),role === 'normal' ? 'normalMap' : role,'glb');
      check(view.flipY === false && view.wrapS === texture.wrapS && view.colorSpace === texture.colorSpace, 'Managed binding changed sampler/color');
      verifiedRoles++;
    }
    if (material.normalMap) check(close(material.normalScale.x,recipe.normalScale[0]) && close(material.normalScale.y,recipe.normalScale[1]), 'Tangentless normal convention changed');
  }
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#b8cbd5'); scene.add(loaded.scene);
  scene.add(new THREE.HemisphereLight(0xffffff,0x647361,2));
  const sun = new THREE.DirectionalLight(0xfff4df,3); sun.position.set(-15,22,-15); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(42,960/680,.1,200);
  camera.position.set(19,13,-22); camera.lookAt(0,2,0);
  const renderer = new THREE.WebGLRenderer({ antialias: true,preserveDrawingBuffer: true });
  renderer.setSize(960,680); renderer.setPixelRatio(1); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  document.body.append(renderer.domElement); renderer.render(scene,camera);
  check(renderer.info.render.triangles >= bundle.stats.triangleCount, 'WebGL did not render the generated geometry');
  const png = await new Promise(resolve => renderer.domElement.toBlob(resolve,'image/png'));
  check(png,'WebGL capture failed'); await fetch('/capture', { method: 'POST',body: png });
  const result = { ok: true,bytes: exported.file.size,sha256: exported.sha256,meshes: meshes.length,triangles: bundle.stats.triangleCount,
    images: exported.images.length,verifiedRoles,bounds: { min: bounds.min.toArray(),max: bounds.max.toArray() },elapsedMs: Math.round(performance.now()-start) };
  renderer.dispose(); bundle.dispose();
  return result;
}
run().then(result => fetch('/result',{ method: 'POST',headers: { 'Content-Type': 'application/json' },body: JSON.stringify(result) }))
  .catch(error => fetch('/result',{ method: 'POST',headers: { 'Content-Type': 'application/json' },body: JSON.stringify({ ok: false,error: error.stack || error.message }) }));
`;
(async () => {
  const compiled = await esbuild.build({ stdin: { contents: source,resolveDir: root,sourcefile: 'browser-builder-proof.ts' },bundle: true,write: false,platform: 'browser',format: 'iife' });
  let resolveResult;
  const result = new Promise(resolve => { resolveResult = resolve; });
  const server = http.createServer((request,response) => {
    if (request.method === 'GET') {
      response.setHeader('Content-Type',request.url === '/fixture.js' ? 'application/javascript' : 'text/html');
      response.end(request.url === '/fixture.js' ? compiled.outputFiles[0].contents : '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="/fixture.js"></script></body></html>'); return;
    }
    const chunks = []; let length = 0;
    request.on('data',chunk => { length += chunk.length; if (length > 8*1024*1024) request.destroy(); else chunks.push(chunk); });
    request.on('end',() => {
      const bytes = Buffer.concat(chunks);
      if (request.url === '/capture') fs.writeFileSync(path.join(temporary,'cottage.png'),bytes);
      else if (request.url === '/result') { try { resolveResult(JSON.parse(bytes.toString())); } catch (error) { resolveResult({ ok: false,error: error.message }); } }
      response.end('OK');
    });
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const processHandle = spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check',`--user-data-dir=${path.join(temporary,'profile')}`,
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--in-process-gpu',`http://127.0.0.1:${server.address().port}`],{ windowsHide: true,stdio: ['ignore','ignore','pipe'] });
  let browserErrors = ''; processHandle.stderr.on('data',chunk => { browserErrors = (browserErrors + chunk).slice(-2000); });
  processHandle.on('error',error => resolveResult({ ok: false,error: error.message }));
  processHandle.on('exit',code => resolveResult({ ok: false,error: `Browser exited (${code}) before returning a result. ${browserErrors}` }));
  const timer = setTimeout(() => resolveResult({ ok: false,error: 'Browser export timed out. ' + browserErrors }),55_000);
  try {
    const report = await result;
    assert(report.ok,report.error);
    console.log('PASS real Chromium browser: Canvas PNG encoding, deterministic GLTFExporter, structural checks, GLTFLoader, PBR pixel/sampler/factor parity, managed bindings and WebGL render.');
    console.log(JSON.stringify(report));
    console.log(`Preview capture: ${path.join(temporary,'cottage.png')}`);
  } finally { clearTimeout(timer); processHandle.kill(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
