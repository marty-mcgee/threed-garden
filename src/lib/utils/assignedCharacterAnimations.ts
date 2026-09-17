import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { resolveAssignments, type Assignment } from '@/lib/services/threed/animations/contracts';
import { getExternalAnimationSourcesForModel, loadExternalCharacterAnimations } from './externalCharacterAnimations';
import type { AnimationMap } from './animation';

export type AssignedAnimationClip = { id: number; isActive: boolean; filePath: string; format: string; clipIndex: number };
type Mapping = { assignments: Assignment[]; inherited: Assignment[]; animations: AssignedAnimationClip[]; modelId: number | null; slots?: { actionKey: string; isActive: boolean }[] };
async function mapping(target: string, targetId: number): Promise<Mapping> {
  const response = await fetch(`/api/threed/animation-assignments?target=${target}&targetId=${targetId}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return { assignments: [], inherited: [], animations: [], modelId: null };
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Could not load Character animation assignments');
  return body.data;
}
async function sourceClips(source: AssignedAnimationClip) {
  const response = await fetch(source.filePath, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Assigned animation source is inaccessible');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 4 * 1024 * 1024) throw new Error('Assigned animation source exceeds 4 MiB');
  const manager = new THREE.LoadingManager();
  manager.addHandler(/.*/, { load: () => new THREE.Texture() } as unknown as THREE.Loader);
  let object: THREE.Object3D;
  let clips: THREE.AnimationClip[];
  if (source.format === 'fbx') {
    object = new FBXLoader(manager).parse(bytes, ''); clips = object.animations;
  } else if (source.format === 'glb') {
    const loader = new GLTFLoader(manager);
    loader.register(() => ({ name: 'THREED_ANIMATION_TEXTURES', loadTexture: async () => new THREE.Texture() }));
    const gltf = await loader.parseAsync(bytes, ''); object = gltf.scene; clips = gltf.animations;
  } else throw new Error('Unsupported assigned animation format');
  const result = clips.map(clip => clip.clone());
  object.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry?.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });
  return result;
}

// Preview deliberately loads only the requested draft clip and performs the same binding check.
export async function loadCharacterPreviewAnimation(source: AssignedAnimationClip, root: THREE.Object3D) {
  if (!source.isActive || !source.filePath.trim()) throw new Error('Selected animation is unavailable');
  const original = (await sourceClips(source))[source.clipIndex];
  if (!original?.tracks.length || original.tracks.some(track => !THREE.PropertyBinding.findNode(root, THREE.PropertyBinding.parseTrackName(track.name).nodeName))) {
    throw new Error('Selected animation does not match this Character rig');
  }
  const clip = original.clone();
  // The existing stationary initial-action path poses and plays the preview.
  clip.name = 'idle';
  return { clips: [clip], blocked: new Set<string>(), assigned: new Set(['idle']) };
}

export function assignedAnimationMap(base: AnimationMap, blocked: Set<string>, assigned: Set<string>): AnimationMap {
  return { ...base, blockedActions: blocked, resolve: action => blocked.has(action.toLowerCase()) ? null : assigned.has(action.toLowerCase()) ? base.clipNames.find(name => name.toLowerCase() === action.toLowerCase()) ?? null : base.resolve(action) };
}

export async function loadAssignedCharacterAnimations(characterId: number, modelId: number, modelName: string, filePath: string, root: THREE.Object3D) {
  const own = await mapping('character', characterId);
  // Project instances may use a different Model from the reusable Character's default.
  const model = own.modelId === modelId ? null : await mapping('model', modelId);
  const animations = model ? [...own.animations, ...model.animations] : own.animations;
  const effective = resolveAssignments(model?.assignments ?? own.inherited, own.assignments, animations);
  const explicit = new Set(effective.filter(row => row.state !== 'legacy').map(row => row.actionKey.toLowerCase()));
  const inactive = new Set((own.slots ?? []).filter(row => !row.isActive).map(row => row.actionKey));
  const blocked = new Set(effective.filter(row => row.state === 'disabled').map(row => row.actionKey.toLowerCase()));
  inactive.forEach(key => blocked.add(key.toLowerCase()));
  const assigned = new Set<string>();
  const sources = new Map<string, Promise<THREE.AnimationClip[]>>();
  const clips: THREE.AnimationClip[] = [];
  for (const row of effective) {
    if (row.state === 'legacy' || row.state === 'disabled' || blocked.has(row.actionKey.toLowerCase())) continue;
    const owner = row.source === 'character' ? `Character #${characterId} override` : `Model #${modelId} default`;
    const location = row.source === 'character'
      ? 'Admin → ThreeD → Characters → Animations & Preview'
      : 'Admin → ThreeD → Models → Animation defaults';
    const action = row.actionKey.replace(/([a-z])([A-Z])/g, '$1 $2');
    try {
      if (row.state === 'unavailable') throw new Error('Assigned animation is unavailable');
      const source = animations.find(clip => clip.id === row.animationId)!;
      const key = `${source.format}:${source.filePath}`;
      if (!sources.has(key)) sources.set(key, sourceClips(source));
      const original = (await sources.get(key)!)[source.clipIndex];
      if (!original) throw new Error('Assigned clip was not found in its source file');
      // Require the authored track targets to exist. This is binding validation, not retargeting.
      if (!original.tracks.length || original.tracks.some(track => !THREE.PropertyBinding.findNode(root, THREE.PropertyBinding.parseTrackName(track.name).nodeName))) {
        throw new Error("Assigned animation does not match this Character's rig");
      }
      const clip = original.clone(); clip.name = row.actionKey;
      clips.push(clip); assigned.add(row.actionKey.toLowerCase());
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Animation could not load';
      throw new Error(`${action} — ${owner}, animation #${row.animationId}: ${reason}. Check ${location}.`, { cause });
    }
  }
  const legacy = await loadExternalCharacterAnimations(getExternalAnimationSourcesForModel(modelName, filePath).filter(source => !explicit.has(source.action.toLowerCase())));
  return { clips: [...legacy.clips, ...clips], blocked, assigned };
}
