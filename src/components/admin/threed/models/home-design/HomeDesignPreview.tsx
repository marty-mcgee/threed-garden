'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { Box3, Group, Object3D, Vector3, type PerspectiveCamera } from 'three';
import { Button } from '@/components/ui/button';
import { entityElevation, levelDocument, pruneNodes, roofProfile, type DesignDocument } from '@/libraries/services/threed/home-design/document';
import { DesignGeometryCache } from '@/libraries/services/threed/home-design/geometry';

function Geometry({ document, selected, onSelect, visibleLevelId, showRoofs = true }: { document: DesignDocument; selected: string | null; onSelect: (id: string) => void; visibleLevelId?: string; showRoofs?: boolean }) {
  const host = useRef<Group>(null), cache = useRef<DesignGeometryCache | null>(null);
  useLayoutEffect(() => { const owner = new DesignGeometryCache(); cache.current = owner; host.current!.add(owner.group); return () => { host.current?.remove(owner.group); owner.dispose(); cache.current = null; }; }, []);
  useLayoutEffect(() => { cache.current?.update(document, selected, visibleLevelId, showRoofs); }, [document, selected, visibleLevelId, showRoofs]);
  const click = (event: ThreeEvent<MouseEvent>) => { const id = (event.object as Object3D).userData.designEntityId; if (typeof id === 'string') { event.stopPropagation(); onSelect(id); } };
  return <group ref={host} onClick={click} />;
}
function FitCamera({ document, request, controls }: { document: DesignDocument; request: number; controls: React.RefObject<React.ComponentRef<typeof OrbitControls> | null> }) {
  const { camera, size } = useThree();
  const latest = useRef(document); latest.current = document;
  useLayoutEffect(() => {
    if (!request || !controls.current || !latest.current.nodes.length) return;
    const doc = latest.current, bounds = new Box3();
    const low = Math.min(...doc.walls.map(wall => entityElevation(doc, wall)), ...doc.floors.map(floor => entityElevation(doc, floor) - floor.thickness), ...doc.roofs.map(roof => entityElevation(doc, roof)));
    const high = Math.max(...doc.walls.map(wall => entityElevation(doc, wall) + wall.height), ...doc.floors.map(floor => entityElevation(doc, floor)), ...doc.roofs.map(roof => entityElevation(doc, roof) + roofProfile(roof.vertices.map(id => doc.nodes.find(node => node.id === id)!), roof).rise + roof.thickness + (doc.roofOpenings.some(opening => opening.roofId === roof.id && opening.kind === 'skylight') ? .0254 : 0)));
    if (!Number.isFinite(low) || !Number.isFinite(high)) return;
    const margin = Math.max(.15, ...doc.walls.map(wall => wall.thickness));
    for (const node of doc.nodes) { bounds.expandByPoint(new Vector3(node.x - margin, low, node.z - margin)); bounds.expandByPoint(new Vector3(node.x + margin, high, node.z + margin)); }
    const center = bounds.getCenter(new Vector3()), span = bounds.getSize(new Vector3()).length();
    const perspective = camera as PerspectiveCamera, fov = perspective.fov * Math.PI / 180;
    const angle = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * size.width / size.height));
    const distance = span / (2 * Math.sin(angle / 2)) * 1.15;
    controls.current.target.copy(center); camera.position.copy(center).add(new Vector3(1, 1, 1).normalize().multiplyScalar(distance));
    camera.far = Math.max(4000, distance * 3); camera.updateProjectionMatrix(); controls.current.update();
  }, [request, camera, controls, size.width, size.height]);
  return null;
}
export function HomeDesignPreview({ document, selected, onSelect, visibleLevelId, showRoofs = true }: { document: DesignDocument; selected: string | null; onSelect: (id: string) => void; visibleLevelId?: string; showRoofs?: boolean }) {
  const levelVisible = visibleLevelId ? levelDocument(document, visibleLevelId) : document;
  const visible = showRoofs ? levelVisible : pruneNodes({ ...levelVisible, roofs: [], roofOpenings: [] });
  const [reset, setReset] = useState(0);
  const [fit, setFit] = useState(0);
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  // Reset controls only. Canvas and generated mesh owners retain their lifetimes.
  useLayoutEffect(() => { controls.current?.reset(); }, [reset]);
  return <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#091423]">
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2 text-xs"><span className="font-semibold">Live 3D · {visibleLevelId ? document.levels.find(level => level.id === visibleLevelId)?.name : 'All levels'} · metres · Y up</span><div className="flex gap-1"><Button variant="outline" size="sm" disabled={!visible.nodes.length} onClick={() => setFit(value => value + 1)}>Fit</Button><Button variant="outline" size="sm" onClick={() => setReset(value => value + 1)}>Reset Camera</Button></div></div>
    <div className="min-h-0 flex-1" data-testid="home-preview"><Canvas camera={{ position: [7, 7, 8], fov: 45, near: .01, far: 4000 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#091423']} /><ambientLight intensity={1.4} /><directionalLight position={[8, 15, 10]} intensity={2} />
      <Grid infiniteGrid cellSize={.3048} sectionSize={3.048} cellColor="#23485c" sectionColor="#34738c" fadeDistance={80} position={[0, (visibleLevelId ? document.levels.find(level => level.id === visibleLevelId)!.elevation : 0) - .16, 0]} />
      <Geometry document={document} selected={selected} onSelect={onSelect} visibleLevelId={visibleLevelId} showRoofs={showRoofs} /><OrbitControls ref={controls} makeDefault target={[1.5, 0, 1.5]} maxPolarAngle={Math.PI / 2 - .02} /><FitCamera document={visible} request={fit} controls={controls} />
    </Canvas></div>
  </section>;
}
