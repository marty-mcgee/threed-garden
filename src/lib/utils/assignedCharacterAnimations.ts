import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { resolveAssignments, type Assignment } from '@/lib/services/threed/animations/contracts';
import { getExternalAnimationSourcesForModel, loadExternalCharacterAnimations } from './externalCharacterAnimations';
import type { AnimationMap } from './animation';

type Clip = { id: number; isActive: boolean; filePath: string; format: string; clipIndex: number };
type Mapping = { assignments: Assignment[]; inherited: Assignment[]; animations: Clip[]; modelId: number | null };
async function mapping(target: string, targetId: number): Promise<Mapping> {
  const response = await fetch(`/api/threed/animation-assignments?target=${target}&targetId=${targetId}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return { assignments: [], inherited: [], animations: [], modelId: null };
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Could not load Character animation assignments');
  return body.data;
}
async function sourceClips(source: Clip) {
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
  const blocked = new Set(effective.filter(row => row.state === 'disabled').map(row => row.actionKey.toLowerCase()));
  const assigned = new Set<string>();
  const sources = new Map<string, Promise<THREE.AnimationClip[]>>();
  const clips: THREE.AnimationClip[] = [];
  for (const row of effective) {
    if (row.state === 'unavailable') throw new Error(`Assigned ${row.actionKey} animation is unavailable. Update the Character's Animations settings.`);
    if (row.state !== 'assigned') continue;
    const source = animations.find(clip => clip.id === row.animationId)!;
    const key = `${source.format}:${source.filePath}`;
    if (!sources.has(key)) sources.set(key, sourceClips(source));
    const original = (await sources.get(key)!)[source.clipIndex];
    if (!original) throw new Error(`Assigned ${row.actionKey} clip was not found in its source file`);
    // Require the authored track targets to exist. This is binding validation, not retargeting.
    if (!original.tracks.length || original.tracks.some(track => !THREE.PropertyBinding.findNode(root, THREE.PropertyBinding.parseTrackName(track.name).nodeName))) {
      throw new Error(`Assigned ${row.actionKey} animation does not match this Character's rig`);
    }
    const clip = original.clone(); clip.name = row.actionKey;
    clips.push(clip); assigned.add(row.actionKey.toLowerCase());
  }
  const legacy = await loadExternalCharacterAnimations(getExternalAnimationSourcesForModel(modelName, filePath).filter(source => !explicit.has(source.action.toLowerCase())));
  return { clips: [...legacy.clips, ...clips], blocked, assigned };
}
