import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LoadingManager, Texture, TextureLoader, Mesh } from 'three';
import { BrowserFBXLoader } from '../services/threed/models/browser-fbx-loader';
import { modelLoadCompletion, assertModelTexturesReady } from '../services/threed/models/model-load-completion';
import { resolveThreeDModelAttachmentUrl } from '../services/threed/models/model-attachment-runtime-core';

// Minimal real FBX with a triangle, a material and an authored texture reference.
function fixture(extension: string, embedded = false) {
  return new TextEncoder().encode(`; FBX 7.4.0 project file
FBXHeaderExtension:  {
\tFBXVersion: 7400
}
Objects:  {
\tGeometry: 1, "Geometry::Triangle", "Mesh" {
\t\tVertices: *9 {
\t\t\ta: 0,0,0,1,0,0,0,1,0
\t\t}
\t\tPolygonVertexIndex: *3 {
\t\t\ta: 0,1,-3
\t\t}
\t}
\tModel: 2, "Model::Triangle", "Mesh" {
\t}
\tMaterial: 3, "Material::Paint", "" {
\t\tShadingModel: "phong"
\t}
\tTexture: 4, "Texture::Paint", "" {
\t\tFileName: "paint.${extension}"
\t}
\tVideo: 5, "Video::Paint", "Clip" {
\t\tRelativeFilename: "paint.${extension}"
${embedded ? '\t\tContent: "AA=="\n' : ''}\t}
}
Connections:  {
\tC: "OO",1,2
\tC: "OO",3,2
\tC: "OP",4,3,"DiffuseColor"
\tC: "OO",5,4
}
`).buffer;
}
const requests: string[] = [];
const originalDocument = globalThis.document;
// Exercise Three's actual ImageLoader without network or a browser.
globalThis.document = { createElementNS() {
  const listeners = new Map<string, () => void>();
  return { width: 1, height: 1, naturalWidth: 1, naturalHeight: 1,
    addEventListener(name: string, fn: () => void) { listeners.set(name, fn); },
    removeEventListener(name: string) { listeners.delete(name); },
    set src(url: string) { requests.push(url); queueMicrotask(() => listeners.get(url.includes('missing') ? 'error' : 'load')?.call(this)); },
  };
} } as unknown as Document;
const material = (root: ReturnType<BrowserFBXLoader['parse']>) => {
  const mesh = root.children.find(object => (object as Mesh).isMesh) as Mesh;
  assert(mesh?.geometry.getAttribute('position').count === 3, 'Geometry survives ignored textures');
  return (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as typeof mesh.material & { map: Texture | null };
};
try {
  for (const ext of ['psd', 'PSB', 'tif', 'TIFF', 'tga', 'dds', 'exr', 'hdr', 'ktx', 'ktx2']) {
    const manager = new LoadingManager();
    const issues: string[] = [];
    const wait = modelLoadCompletion(manager, url => issues.push(url));
    const root = new BrowserFBXLoader(manager).parse(fixture(ext), 'https://assets.invalid/');
    assert.equal(material(root).map, null);
    assertModelTexturesReady(root);
    assert.equal(await wait(), true);
    assert.deepEqual(issues, []);
  }
  assert.deepEqual(requests, [], 'Unsupported references must never reach ImageLoader');
  const embedded = new BrowserFBXLoader().parse(fixture('tif', true), '');
  assert.equal(material(embedded).map, null, 'Embedded TIFF data must also be skipped');
  assert.deepEqual(requests, []);

  const manager = new LoadingManager();
  const wait = modelLoadCompletion(manager);
  manager.setURLModifier(url => resolveThreeDModelAttachmentUrl(url, [{ fileName: 'paint.psd', relativePath: 'paint.psd', filePath: 'https://assets.invalid/replacement.png', fileType: 'texture' }]));
  const replacement = new BrowserFBXLoader(manager).parse(fixture('psd'), 'https://assets.invalid/');
  await wait();
  assert.deepEqual(requests, ['https://assets.invalid/replacement.png']);
  assert(material(replacement).map?.isTexture);
  assertModelTexturesReady(replacement);

  const supportedManager = new LoadingManager();
  const supportedWait = modelLoadCompletion(supportedManager);
  const supported = new BrowserFBXLoader(supportedManager).parse(fixture('png'), 'https://assets.invalid/');
  await supportedWait();
  assertModelTexturesReady(supported);
  assert.equal(requests.at(-1), 'https://assets.invalid/paint.png');
  const missingManager = new LoadingManager();
  const missingWait = modelLoadCompletion(missingManager);
  missingManager.setURLModifier(() => 'https://assets.invalid/missing.png');
  new BrowserFBXLoader(missingManager).parse(fixture('png'), '');
  await assert.rejects(missingWait(), /resources failed/);

  const customManager = new LoadingManager();
  const decoder = new TextureLoader(customManager);
  let decoded = 0;
  decoder.load = () => { decoded++; return new Texture({ width: 1, height: 1 } as HTMLImageElement); };
  customManager.addHandler(/\.tga$/i, decoder);
  const custom = new BrowserFBXLoader(customManager).parse(fixture('tga'), '');
  assert.equal(decoded, 1, 'A registered format decoder remains authoritative');
  assert(material(custom).map?.isTexture);
  assertModelTexturesReady(custom);
  for (const file of ['src/components/threed/markers/ModelMarker3D.tsx', 'src/components/threed/shared/GardenCharacter.tsx', 'src/components/threed/shared/EcctrlCharacter.tsx', 'src/components/admin/threed/models/ThreeDModelAnimations.tsx']) {
    assert(readFileSync(file, 'utf8').includes('BrowserFBXLoader as FBXLoader'), `${file} consumes the shared browser policy`);
  }
  console.log('PASS actual FBX parsing: unsupported external/embedded textures issue no image requests or warnings; geometry, replacement PNGs, supported failures and registered decoders are preserved');
} finally { globalThis.document = originalDocument; }
