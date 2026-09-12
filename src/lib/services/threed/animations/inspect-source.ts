import { LoadingManager, Loader, Texture, Mesh, type AnimationClip, type Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { parseThreeDGlbJsonChunk } from '@/lib/services/threed/models/gltf-runtime-inspection-core';
import { AnimationLibraryError } from './contracts';

export const MAX_ANIMATION_BYTES = 4 * 1024 * 1024;
class InertTextures {
  setPath() { return this; }
  setCrossOrigin() { return this; }
  load(_url: string, done?: (texture: Texture) => void) { const texture = new Texture(); done?.(texture); return texture; }
}
export function animationFormat(name: string, size: number): 'fbx' | 'glb' {
  const format = name.split('.').at(-1)?.toLowerCase();
  if (format !== 'fbx' && format !== 'glb') throw new AnimationLibraryError(400, 'Choose an FBX or self-contained GLB animation source');
  if (!size || size > MAX_ANIMATION_BYTES || name.length > 255) throw new AnimationLibraryError(400, 'Animation sources must be nonempty and no larger than 4 MiB');
  return format;
}
export function describeClips(clips: AnimationClip[]) {
  if (!clips.length || clips.length > 256) throw new AnimationLibraryError(400, 'Source must contain between 1 and 256 animation clips');
  return clips.map((clip, clipIndex) => {
    if (!Number.isFinite(clip.duration) || clip.duration < 0 || !clip.tracks.length || clip.tracks.length > 4096) throw new AnimationLibraryError(400, 'Invalid animation duration or track count');
    for (const track of clip.tracks) {
      if (!track.times.length || !track.values.length || !Array.from(track.times).every(Number.isFinite) || !Array.from(track.values).every(value => typeof value !== 'number' || Number.isFinite(value))) throw new AnimationLibraryError(400, 'Animation contains empty or non-finite keyframes');
    }
    return { clipIndex, clipName: clip.name, name: (clip.name.trim() || `Clip ${clipIndex + 1}`).slice(0, 255), duration: clip.duration,
      metadata: { trackCount: clip.tracks.length, trackTargets: clip.tracks.map(track => track.name).slice(0, 256), omittedTrackTargets: Math.max(0, clip.tracks.length - 256) } };
  });
}
export async function inspectAnimationSource(bytes: ArrayBuffer, format: 'fbx' | 'glb') {
  let roots: Object3D[] = [];
  try {
    if (format === 'fbx') {
      const manager = new LoadingManager();
      manager.addHandler(/.*/, new InertTextures() as unknown as Loader);
      const root = new FBXLoader(manager).parse(bytes, ''); roots = [root];
      return describeClips(root.animations);
    }
    const json = parseThreeDGlbJsonChunk(new Uint8Array(bytes)) as { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
    for (const dependency of [...(json.buffers ?? []), ...(json.images ?? [])]) {
      if (dependency.uri && !dependency.uri.startsWith('data:')) throw new AnimationLibraryError(400, 'GLB must be self-contained; external files are not supported for animation upload');
    }
    const loader = new GLTFLoader();
    // Material images are irrelevant to clip inspection; do not create DOM textures or fetch images.
    loader.register(() => ({ name: 'THREED_ANIMATION_INSPECTION', loadTexture: async () => new Texture() }));
    const result = await loader.parseAsync(bytes, ''); roots = result.scenes;
    return describeClips(result.animations);
  } catch (error) {
    if (error instanceof AnimationLibraryError) throw error;
    throw new AnimationLibraryError(400, 'Could not inspect animation source. Use a valid FBX or self-contained, uncompressed GLB with animation clips.');
  } finally {
    const textures = new Set<Texture>();
    roots.forEach(root => root.traverse(node => {
      if (!(node instanceof Mesh)) return;
      node.geometry?.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); }); material.dispose();
      }
    })); textures.forEach(texture => texture.dispose());
  }
}
