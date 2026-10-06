'use client';

import { Component, Suspense, useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, Grid, Html, Line, OrbitControls, useBounds } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import { ModelMarker3D } from '@/components/threed/markers/ModelMarker3D';
import { readModelSource } from '@/libraries/services/threed/models/model-source-core';
import type { CharacterPreviewAction, CharacterPreviewClip } from '@/libraries/utils/character-preview-action';
import { modelPreviewEvents } from '../models/model-preview-events';
import type { SimulationPreviewAsset } from './simulation-preview-data';
import { sweptPointHitsSphere, type ThreeDActionCollisionSample } from '@/libraries/services/threed/physics/action-collision-core';

type PreviewOwner = { body: Group; visual: Group; velocity: Vector3; remaining: { current: number } };

export type SimulationPreviewCameraTools = { fit: () => void; reset: () => void };
export function SimulationPreviewCamera({ tools, framingKey }: { tools: RefObject<SimulationPreviewCameraTools | null>; framingKey: string }) {
  const bounds = useBounds(), { camera, invalidate } = useThree(), controls = useRef<OrbitControlsImpl>(null);
  const initialized = useRef('');
  useEffect(() => {
    const reset = () => {
      if (!controls.current) return;
      bounds.refresh().clip();
      const { center, distance } = bounds.getSize();
      camera.position.copy(center).addScaledVector(new Vector3(4, 2, 6).normalize(), Math.max(distance, 3));
      controls.current.target.copy(center); camera.lookAt(center); controls.current.update(); invalidate();
    };
    tools.current = { fit: () => { bounds.refresh().clip().fit(); invalidate(); }, reset };
    if (framingKey && initialized.current !== framingKey) {
      const frame = requestAnimationFrame(() => { reset(); initialized.current = framingKey; });
      return () => { cancelAnimationFrame(frame); tools.current = null; };
    }
    return () => { tools.current = null; };
  }, [bounds, camera, invalidate, framingKey, tools]);
  return <OrbitControls ref={controls} makeDefault enableDamping={false} />;
}

type Props = {
  assets: SimulationPreviewAsset[]; actorId?: string; targetId?: string; request?: CharacterPreviewAction | null;
  tools: RefObject<SimulationPreviewCameraTools | null>; framingKey: string;
  onState: (markerId: string, error: string | null) => void;
  onClips: (markerId: string, clips: CharacterPreviewClip[]) => void;
  onFinished: (id: string) => void;
  onResourceIssue: (markerId: string, url: string, message: string) => void;
  resetKey: string; onContact: (id: string) => void;
};
function PreviewAsset({ asset, request, target, selected, onState, onClips, onFinished, onResourceIssue, resetKey, owners, sampleContact }: {
  asset: SimulationPreviewAsset; request?: CharacterPreviewAction | null; selected: boolean;
  target?: [number, number, number];
  onState: Props['onState']; onClips: Props['onClips']; onFinished: Props['onFinished'];
  onResourceIssue: Props['onResourceIssue'];
  resetKey: string; owners: RefObject<Map<string, PreviewOwner>>; sampleContact: (sample: ThreeDActionCollisionSample) => void;
}) {
  const { marker, model, character } = asset, pose = marker.preview!;
  const owner = useRef<Group>(null), completed = useRef('');
  const visual = useRef<Group>(null), velocity = useRef(new Vector3()), remaining = useRef(0);
  useEffect(() => {
    if (!owner.current || !visual.current) return;
    owners.current.set(marker.markerId, { body: owner.current, visual: visual.current, velocity: velocity.current, remaining });
    return () => { owners.current.delete(marker.markerId); };
  }, [marker.markerId, owners]);
  useEffect(() => {
    completed.current = '';
    velocity.current.set(0, 0, 0); remaining.current = 0;
    if (owner.current) {
      owner.current.position.set(...pose.position);
      owner.current.rotation.set(character ? 0 : pose.rotation[0], character ? 0 : pose.rotation[1], character ? 0 : pose.rotation[2]);
      visual.current?.rotation.set(0, 0, 0);
    }
  }, [resetKey, pose.position, pose.rotation, character]);
  useFrame((_, delta) => {
    if (owner.current && remaining.current > 0 && velocity.current.lengthSq() > 0.0001) {
      const dt = Math.min(Math.max(0, delta), 0.1);
      const travel = Math.min(remaining.current, velocity.current.length() * dt);
      owner.current.position.addScaledVector(velocity.current.clone().normalize(), travel);
      remaining.current -= travel; velocity.current.multiplyScalar(Math.exp(-1.2 * dt));
      if (visual.current) { visual.current.rotation.x += velocity.current.z * dt; visual.current.rotation.z -= velocity.current.x * dt; }
    }
    if (!request?.approach || !target || !owner.current || completed.current === request.id) return;
    const body = owner.current;
    const dx = target[0] - body.position.x, dz = target[2] - body.position.z;
    const distance = Math.hypot(dx, dz), clearance = 0.8;
    if (distance <= clearance + 0.001) { completed.current = request.id; onFinished(request.id); return; }
    const speed = request.action.toLowerCase().includes('walk') ? 2 : 3.5;
    const stride = Math.min(Math.max(0, delta), 0.1) * speed;
    const travel = Math.min(stride, distance - clearance);
    body.position.x += dx / distance * travel; body.position.z += dz / distance * travel;
    body.rotation.y = Math.atan2(dx, dz) - (character?.rotation ?? 0) * Math.PI / 180;
  });
  const settled = useCallback((error: string | null) => onState(marker.markerId, error), [marker.markerId, onState]);
  const clips = useCallback((value: CharacterPreviewClip[]) => onClips(marker.markerId, value), [marker.markerId, onClips]);
  const resourceIssue = useCallback((url: string, message: string) => onResourceIssue(marker.markerId, url, message), [marker.markerId, onResourceIssue]);
  const loaded = useCallback(() => settled(null), [settled]);
  const failed = useCallback((error: string | null) => { if (error) settled(error); }, [settled]);
  const rig = character && model && readModelSource(model) !== 'shape';
  // Character yaw belongs to Garden's established visual path. Model instance rotation is radians.
  return <group ref={owner} position={pose.position} rotation={character ? [0, 0, 0] : pose.rotation}>
    <group ref={visual}>
    {character && rig ? <GardenCharacter character={character} previewMode previewActions previewAction={request}
      positionedByParent onPreviewState={settled} onPreviewActions={clips} onPreviewActionFinished={onFinished} onPreviewResourceIssue={resourceIssue} onPreviewContact={sampleContact} />
      : model ? <ModelMarker3D model={character ? { ...model, scale: Number(model.scale ?? 1) * character.scale,
        rotationY: Number(model.rotationY ?? 0) + character.rotation } : model} position={[0, 0, 0]} animationSpeed={0}
        onRuntimeSettled={loaded} onRuntimeError={failed} />
      : <mesh position={[0, 0.3, 0]}><octahedronGeometry args={[0.3]} /><meshStandardMaterial color="#38bdf8" wireframe /></mesh>}
    </group>
    {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><ringGeometry args={[0.65, 0.75, 32]} /><meshBasicMaterial color="#34d399" /></mesh>}
    <Html position={[0, -0.1, 0]} center style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-[10px] text-white">{marker.name}{!model ? ' · Target marker' : ''}</span></Html>
  </group>;
}
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert" className="p-3 text-xs text-destructive">Canvas unavailable. Retry with WebGL enabled.</p> : this.props.children; }
}
export default function SimulationPreviewCanvas({ assets, actorId, targetId, request, tools, framingKey, onState, onClips, onFinished, onResourceIssue, resetKey, onContact }: Props) {
  const owners = useRef(new Map<string, PreviewOwner>()), kicked = useRef(new Set<string>());
  const active = useRef(request); active.current = request;
  useEffect(() => { kicked.current.clear(); }, [resetKey]);
  const sampleContact = useCallback((sample: ThreeDActionCollisionSample) => {
    const kick = active.current?.kick;
    if (!kick || sample.requestId !== active.current?.id || sample.projectId !== kick.context.projectId || sample.action !== kick.context.action || !kick.pointIds.some(point => point === sample.pointId) || sample.actorMarkerId !== kick.context.actorMarkerId || sample.targetMarkerId !== kick.context.targetMarkerId || kicked.current.has(sample.requestId)) return;
    const ball = owners.current.get(sample.targetMarkerId), actor = owners.current.get(sample.actorMarkerId);
    if (!ball || !actor) return;
    ball.body.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(ball.visual), center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3()), radius = Math.max(size.x, size.y, size.z) / 2;
    if (!sweptPointHitsSphere(sample, center, radius)) return;
    const direction = ball.body.position.clone().sub(actor.body.position); direction.y = 0;
    if (direction.lengthSq() < 0.0001) return;
    kicked.current.add(sample.requestId); ball.velocity.copy(direction.normalize().multiplyScalar(4.5)); ball.remaining.current = 8;
    onContact(sample.requestId);
  }, [onContact]);
  const visible = assets.filter(asset => !asset.error && asset.marker.preview?.visible);
  const actor = visible.find(asset => asset.marker.markerId === actorId)?.marker.preview;
  const target = visible.find(asset => asset.marker.markerId === targetId)?.marker.preview;
  return <PreviewBoundary><Canvas events={modelPreviewEvents} camera={{ position: [4, 3, 6], fov: 45 }} dpr={[1, 1.5]}>
    <color attach="background" args={['#071426']} /><ambientLight intensity={1.4} />
    <directionalLight position={[4, 8, 6]} intensity={2.4} /><directionalLight position={[-4, 3, -2]} intensity={1} color="#b9d7ff" />
    <Grid position={[0, -0.02, 0]} args={[100, 100]} infiniteGrid cellSize={1} sectionSize={5} cellColor="#17334b" sectionColor="#246580" fadeDistance={200} />
    <Suspense fallback={null}><Bounds margin={1.3}>
      {visible.map(asset => <PreviewAsset key={asset.marker.markerId} asset={asset} request={asset.marker.markerId === actorId ? request : null}
        target={target?.position}
        resetKey={resetKey} owners={owners} sampleContact={sampleContact}
        selected={asset.marker.markerId === actorId || asset.marker.markerId === targetId} onState={onState} onClips={onClips} onFinished={onFinished} onResourceIssue={onResourceIssue} />)}
      {actor && target && <Line points={[actor.position, target.position]} color="#34d399" lineWidth={2} dashed dashSize={0.4} gapSize={0.2} />}
      <SimulationPreviewCamera tools={tools} framingKey={framingKey} />
    </Bounds></Suspense>
  </Canvas></PreviewBoundary>;
}
