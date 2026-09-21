/** Synthetic triangle and 1x1 PNG fixtures; no external asset or renderer dependency. */
export function triangleGltfFixture() {
  const geometry = new Uint8Array(42);
  new Float32Array(geometry.buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Uint16Array(geometry.buffer, 36, 3).set([0, 1, 2]);
  const image = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='), (character) => character.charCodeAt(0));
  const document = {
    asset: { version: '2.0' }, scene: 0,
    scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 6 }],
    buffers: [{ uri: 'buffers/triangle.bin', byteLength: 42 }],
    images: [{ uri: 'textures/pixel.png' }], textures: [{ source: 0 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0 } }],
  };
  return {
    document, geometry, image,
    resources: [{ relativePath: 'buffers/triangle.bin', bytes: geometry }, { relativePath: 'textures/pixel.png', bytes: image }],
  };
}

export function encodeGltf(document: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(document));
}

export function encodeGlb(document: object, bin?: Uint8Array): Uint8Array {
  const json = encodeGltf(document);
  const jsonLength = Math.ceil(json.byteLength / 4) * 4;
  const binLength = bin ? Math.ceil(bin.byteLength / 4) * 4 : 0;
  const result = new Uint8Array(20 + jsonLength + (bin ? 8 + binLength : 0));
  const view = new DataView(result.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, result.byteLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  result.fill(0x20, 20, 20 + jsonLength);
  result.set(json, 20);
  if (bin) {
    view.setUint32(20 + jsonLength, binLength, true);
    view.setUint32(24 + jsonLength, 0x004e4942, true);
    result.set(bin, 28 + jsonLength);
  }
  return result;
}
