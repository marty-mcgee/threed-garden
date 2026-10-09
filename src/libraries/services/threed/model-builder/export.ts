import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { inspectThreeDGltfBundle } from '../models/model-gltf-bundle-core';
import { canonicalCottageParameters } from './parameters';
import type { GeneratedModelBundle, ModelGenerationManifest, TextureArtifact } from './types';

export interface EncodedCottageImage { artifact: TextureArtifact; file: File; sha256: string }
export interface BrowserCottageExport {
  file: File; sha256: string; inputSha256: string; manifest: ModelGenerationManifest;
  images: EncodedCottageImage[];
}
export async function builderSha256(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = bytes instanceof Uint8Array ? new Uint8Array(bytes).buffer : bytes;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Encode the same RGBA rows embedded by GLTFExporter; no global Node/DOM shims. */
export async function encodeCottageImage(artifact: TextureArtifact): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = artifact.width; canvas.height = artifact.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export needs a browser with Canvas support.');
  context.putImageData(new ImageData(new Uint8ClampedArray(artifact.pixels), artifact.width, artifact.height), 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
  canvas.width = canvas.height = 0;
  return new File([blob], `${artifact.id}.png`, { type: 'image/png' });
}

/** Export the complete generated asset; preview visibility never changes the saved geometry. */
export async function exportCottageGlb(bundle: GeneratedModelBundle, signal?: AbortSignal): Promise<BrowserCottageExport> {
  signal?.throwIfAborted();
  const result = await new GLTFExporter().parseAsync(bundle.root, {
    binary: true, onlyVisible: false, maxTextureSize: bundle.parameters.texture_resolution,
  });
  signal?.throwIfAborted();
  if (!(result instanceof ArrayBuffer)) throw new Error('The exporter did not return a binary GLB.');
  const bytes = new Uint8Array(result);
  const inspection = inspectThreeDGltfBundle('cottage.glb', bytes);
  if (inspection.requirements.length) throw new Error('Generated GLB contains unresolved external files.');
  const [sha256, inputSha256] = await Promise.all([
    builderSha256(bytes), builderSha256(new TextEncoder().encode(canonicalCottageParameters(bundle.parameters))),
  ]);
  const file = new File([result], `cottage-${sha256.slice(0, 12)}.glb`, { type: 'model/gltf-binary' });
  const images: EncodedCottageImage[] = [];
  for (const artifact of bundle.textures) {
    signal?.throwIfAborted();
    const image = await encodeCottageImage(artifact);
    images.push({ artifact, file: image, sha256: await builderSha256(await image.arrayBuffer()) });
  }
  signal?.throwIfAborted();
  const manifest: ModelGenerationManifest = {
    manifestVersion: 1, generator: bundle.identity, parameters: bundle.parameters,
    geometry: bundle.stats, bounds: bundle.bounds,
    artifacts: [{ path: file.name, mimeType: file.type, bytes: file.size, sha256 }, ...images.map(image => ({
      path: image.artifact.relativePath, mimeType: image.file.type, bytes: image.file.size, sha256: image.sha256,
    }))],
    materials: bundle.materials.map(({ id, name, textureBindings, baseColor, roughness, metalness, opacity, doubleSided, normalScale, aoStrength }) => ({
      id, name, textureBindings, baseColor, roughness, metalness, opacity, doubleSided, normalScale, aoStrength,
      textureSampling: Object.fromEntries(Object.entries(textureBindings).map(([role, textureId]) => {
        const artifact = bundle.textures.find(artifact => artifact.id === textureId)!;
        const texture = artifact.texture;
        return [role, { textureId, uvChannel: texture.channel, repeat: texture.repeat.toArray() as [number, number],
          offset: texture.offset.toArray() as [number, number], rotation: texture.rotation,
          wrapS: texture.wrapS, wrapT: texture.wrapT, flipY: texture.flipY, colorSpace: artifact.colorSpace }];
      })),
    })),
  };
  return { file, sha256, inputSha256, manifest, images };
}
