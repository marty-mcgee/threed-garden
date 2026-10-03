import * as THREE from 'three';
import {
  validThreeDActionCollisionSample,
  type ThreeDActionCollisionContext,
  type ThreeDActionCollisionPointId,
  type ThreeDActionCollisionSample,
} from './action-collision-core';
export { defaultKickCollisionPoints, type ThreeDActionCollisionPointId } from './action-collision-core';

function boneName(name: string): string {
  return name.split(/[:|]/).at(-1)!.replace(/^mixamorig\d*/i, '').replace(/[^a-z]/gi, '').toLowerCase();
}

function resolveFoot(model: THREE.Object3D, pointId: ThreeDActionCollisionPointId):
  { node: THREE.Bone; foot: THREE.Bone | null } | null {
  const side = pointId === 'left-foot' ? 'left' : 'right';
  const suffix = side[0];
  const toes = new Set([`${side}toebase`, `${side}toe`, `${side}toes`,
    `toebase${suffix}`, `toe${suffix}`, `toes${suffix}`, `toe${side}`, `toes${side}`]);
  const feet = new Set([`${side}foot`, `foot${suffix}`, `foot${side}`]);
  const toeNodes: THREE.Bone[] = [];
  const footNodes: THREE.Bone[] = [];
  model.traverse(node => {
    if (!(node as THREE.Bone).isBone) return;
    const name = boneName(node.name);
    if (toes.has(name)) toeNodes.push(node as THREE.Bone);
    else if (feet.has(name)) footNodes.push(node as THREE.Bone);
  });
  // Prefer a toe contact point over an ankle pivot. Duplicate rigs are ambiguous.
  const candidates = toeNodes.length > 0 ? toeNodes : footNodes;
  return candidates.length === 1 ? { node: candidates[0],
    foot: toeNodes.length === 1 && footNodes.length === 1 ? footNodes[0] : null } : null;
}

export type ThreeDActionCollisionSampler = Readonly<{
  pointIds: readonly ThreeDActionCollisionPointId[];
  sample: (delta?: number) => ThreeDActionCollisionSample[];
  reset: () => void;
}>;

function clipMovesPoint(clip: THREE.AnimationClip, node: THREE.Bone, model: THREE.Object3D): boolean {
  const ancestors: THREE.Object3D[] = [];
  for (let current: THREE.Object3D | null = node; current && current !== model; current = current.parent) {
    if ((current as THREE.Bone).isBone) ancestors.push(current);
  }
  return clip.tracks.some(track => {
    try {
      const parsed = THREE.PropertyBinding.parseTrackName(track.name);
      if (!['position', 'quaternion', 'rotation', 'scale'].includes(parsed.propertyName)
        || (parsed.objectName && parsed.objectName !== 'bones')) return false;
      const targetName = parsed.objectName === 'bones' ? parsed.objectIndex : parsed.nodeName;
      if (!ancestors.some(ancestor => ancestor.name === targetName || ancestor.uuid === targetName)
        || track.times.length < 2) return false;
      const stride = track.getValueSize();
      return Array.from(track.values).some((value, index, values) => index >= stride
        && value !== values[index % stride]);
    } catch { return false; }
  });
}

/** Reads the active clip's rendered rig; never advances a mixer or writes physics. */
export function createActionCollisionSampler(input: {
  model: THREE.Object3D;
  pointIds: readonly ThreeDActionCollisionPointId[];
  context: ThreeDActionCollisionContext;
  clip: THREE.AnimationAction;
}): ThreeDActionCollisionSampler | null {
  const pointIds = [...new Set(input.pointIds)];
  if (pointIds.length === 0 || pointIds.some(id => id !== 'left-foot' && id !== 'right-foot')) return null;
  const points = pointIds.map(pointId => ({ pointId, resolved: resolveFoot(input.model, pointId) }));
  if (points.some(point => !point.resolved
    || !clipMovesPoint(input.clip.getClip(), point.resolved.node, input.model))) return null;
  let previousTime: number | null = null;
  const previous = new Map<ThreeDActionCollisionPointId, THREE.Vector3>();
  const reset = () => { previousTime = null; previous.clear(); };
  return {
    pointIds,
    reset,
    sample(delta?: number) {
      // A stalled frame cannot establish the path between two distant poses.
      if (delta !== undefined && (!Number.isFinite(delta) || delta <= 0 || delta > 0.1)) {
        reset(); return [];
      }
      if (!input.clip.enabled || !input.clip.isRunning()) { reset(); return []; }
      const time = input.clip.time;
      if (!Number.isFinite(time) || (previousTime !== null && time < previousTime)) reset();
      if (!Number.isFinite(time) || time === previousTime) return [];
      input.model.updateWorldMatrix(true, true);
      const samples: ThreeDActionCollisionSample[] = [];
      for (const { pointId, resolved } of points) {
        const { node, foot } = resolved!;
        const current = node.getWorldPosition(new THREE.Vector3());
        const last = previous.get(pointId);
        if (last && current.distanceToSquared(last) > 0.00000001) {
          const sample: ThreeDActionCollisionSample = {
            ...input.context, version: 1, pointId, sourceNode: node.name,
            clipName: input.clip.getClip().name,
            from: { x: last.x, y: last.y, z: last.z },
            to: { x: current.x, y: current.y, z: current.z },
            // Follow rendered foot size, with bounded tolerance in Scene feet.
            radius: foot ? THREE.MathUtils.clamp(
              current.distanceTo(foot.getWorldPosition(new THREE.Vector3())) * 0.45, 0.05, 0.3,
            ) : 0.15,
          };
          if (validThreeDActionCollisionSample(sample)) samples.push(sample);
        }
        if ([current.x, current.y, current.z].every(Number.isFinite)) previous.set(pointId, current);
        else previous.delete(pointId);
      }
      previousTime = time;
      return samples;
    },
  };
}
