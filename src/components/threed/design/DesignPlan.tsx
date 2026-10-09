'use client';

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import { distance, formatLength, insidePolygon, roofFrame, roofOpeningFootprint, INCH, levelDocument, mergeNodes, moveNodes, openingFootprint, openingMargin, roundMetres, screenToPlan, snapPoint, validateDesign, wallFrame,
  type DesignDocument, type PlanPoint, type PlanView } from '@/libraries/services/threed/design/document';
import { wallFootprint } from '@/libraries/services/threed/design/geometry';

export type DesignTool = 'select' | 'wall' | 'floor' | 'roof' | 'door' | 'window' | 'cutout' | 'skylight' | 'pan';
type DrawPoint = PlanPoint & { nodeId?: string };
interface Props { document: DesignDocument; displayDocument?: DesignDocument; activeLevelId: string; selected: string | null; tool: DesignTool; gridSnap: boolean;
  onSelect: (id: string | null) => void; onCommit: (doc: DesignDocument) => void;
  onPreview: (doc: DesignDocument | null) => void; onMessage: (text: string) => void;
  onDrawComplete: (id: string) => void; cancelToken: number }
interface Gesture { pointerId: number; base: DesignDocument; point: PlanPoint; screenStart?: { x: number; y: number }; view: PlanView; nodes: string[]; pan: boolean; node?: string; opening?: string; roofOpening?: string; merge?: string; latest: DesignDocument }
const makeId = () => crypto.randomUUID();

function addShape(doc: DesignDocument, points: DrawPoint[], tool: 'wall' | 'floor' | 'roof', levelId: string, draft = false): DesignDocument {
  const nodes = [...doc.nodes];
  const levelNodes = new Set(levelDocument(doc, levelId).nodes.map(node => node.id));
  const used = new Set([...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings].map(entity => entity.id));
  const allocate = (prefix: string) => { let candidate = draft ? prefix : makeId(), suffix = 0; while (used.has(candidate)) candidate = draft ? `${prefix}-${++suffix}` : makeId(); used.add(candidate); return candidate; };
  const ids = points.map((point, index) => {
    const existing = point.nodeId ?? nodes.find(node => levelNodes.has(node.id) && distance(node, point) < .000001)?.id;
    if (existing) return existing;
    const id = allocate(`preview-node-${index}`); nodes.push({ id, x: point.x, z: point.z }); return id;
  });
  const id = allocate('preview-entity');
  return { ...doc, nodes, walls: tool === 'wall' ? [...doc.walls, { id, levelId, start: ids[0], end: ids[1], height: doc.defaults.wallHeight, thickness: doc.defaults.wallThickness, elevation: 0 }] : doc.walls,
    floors: tool === 'floor' ? [...doc.floors, { id, levelId, vertices: ids, thickness: doc.defaults.floorThickness, elevation: 0 }] : doc.floors, roofs: tool === 'roof' ? [...doc.roofs, { id, levelId, vertices: ids, kind: 'gable', pitch: 6, direction: 0, thickness: 6 * INCH, elevation: doc.defaults.wallHeight }] : doc.roofs };
}

export function DesignPlan({ document: doc, displayDocument = doc, activeLevelId, selected, tool, gridSnap, onSelect, onCommit, onPreview, onMessage, onDrawComplete, cancelToken }: Props) {
  const visible = levelDocument(displayDocument, activeLevelId), active = levelDocument(doc, activeLevelId);
  const svg = useRef<SVGSVGElement>(null), patternId = useId();
  const [view, setView] = useState<PlanView>({ x: 80, y: 80, scale: 45 });
  const [size, setSize] = useState({ width: 600, height: 280 });
  const [points, setPoints] = useState<DrawPoint[]>([]), [hover, setHover] = useState<DrawPoint | null>(null);
  const [draftOpeningId] = useState(makeId);
  const gesture = useRef<Gesture | null>(null);
  const nodes = new Map(visible.nodes.map(node => [node.id, node]));
  const wall = doc.walls.find(entity => entity.id === selected), floor = doc.floors.find(entity => entity.id === selected);
  const handles = wall ? [wall.start, wall.end] : floor?.vertices ?? doc.roofs.find(entity => entity.id === selected)?.vertices ?? [];
  useEffect(() => { const element = svg.current; if (!element) return; const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(element); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const element = svg.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      const rect = element.getBoundingClientRect(), p = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const world = screenToPlan(p, view), scale = Math.min(300, Math.max(.05, view.scale * Math.exp(-event.deltaY * .001)));
      setView({ x: p.x - world.x * scale, y: p.y - world.z * scale, scale });
    };
    element.addEventListener('wheel', wheel, { passive: false }); return () => element.removeEventListener('wheel', wheel);
  }, [view]);
  useEffect(() => {
    const active = gesture.current; gesture.current = null; setPoints([]); setHover(null); onPreview(null);
    const element = svg.current;
    if (active && element?.hasPointerCapture(active.pointerId)) element.releasePointerCapture(active.pointerId);
  }, [cancelToken, tool, activeLevelId, onPreview]);
  useEffect(() => {
    if ((tool !== 'wall' && tool !== 'floor' && tool !== 'roof') || !points.length || !hover) { onPreview(null); return; }
    const draft = [...points, hover];
    try { onPreview(validateDesign(addShape(doc, draft, tool, activeLevelId, true))); } catch { onPreview(null); }
  }, [points, hover, tool, doc, activeLevelId, onPreview]);
  const local = (event: { clientX: number; clientY: number }) => { const rect = svg.current!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const pointer = (event: { clientX: number; clientY: number }) => screenToPlan(local(event), view);
  function snapped(point: PlanPoint, exclude: string[] = []): DrawPoint {
    const result = snapPoint(point, [...active.nodes, ...points.map((point, index) => ({ ...point, id: point.nodeId ?? `drawing-${index}` }))], view.scale, gridSnap, exclude);
    return { ...result.point, nodeId: doc.nodes.some(node => node.id === result.nodeId) ? result.nodeId : undefined };
  }
  function finishPolygon() {
    if (tool !== 'floor' && tool !== 'roof') return;
    try { const next = validateDesign(addShape(doc, points, tool, activeLevelId)); const entities = tool === 'roof' ? next.roofs : next.floors; onCommit(next); setPoints([]); setHover(null); onPreview(null); onDrawComplete(entities[entities.length - 1].id); onMessage(`${tool === 'roof' ? 'Roof' : 'Floor'} finished and selected. Drag a corner or edit its properties.`); }
    catch (error) { onMessage((error as Error).message); }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || (tool !== 'floor' && tool !== 'roof') || points.length < 3 || event.repeat
        || (event.target as Element)?.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
      event.preventDefault(); finishPolygon();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  function placeOpening(point: PlanPoint, draft: boolean) {
    if (tool !== 'door' && tool !== 'window') return null;
    const hosts = active.walls.map(wall => {
      const frame = wallFrame(doc, wall), offset = frame.project(point), closest = frame.point(Math.max(0, Math.min(frame.length, offset)));
      return { wall, frame, offset, distance: distance(point, closest) };
    }).filter(hit => hit.distance <= Math.max(hit.wall.thickness / 2, 12 / view.scale)).sort((a, b) => a.distance - b.distance);
    if (!hosts.length) return null;
    const { wall, frame, offset } = hosts[0], width = tool === 'door' ? doc.defaults.doorWidth : doc.defaults.windowWidth;
    const margin = openingMargin(wall), raw = offset - width / 2, snapped = gridSnap ? Math.round(raw / (6 * INCH)) * 6 * INCH : raw;
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), kind: tool, wallId: wall.id,
      offset: roundMetres(Math.max(margin, Math.min(frame.length - margin - width, snapped))), width,
      height: tool === 'door' ? doc.defaults.doorHeight : doc.defaults.windowHeight, sill: tool === 'door' ? 0 : doc.defaults.windowSill };
    return { next: validateDesign({ ...doc, openings: [...doc.openings, opening] }), id: opening.id };
  }
  function placeRoofOpening(point: PlanPoint, draft: boolean) {
    if (tool !== 'cutout' && tool !== 'skylight') return null;
    const selectedRoof = doc.roofOpenings.find(opening => opening.id === selected)?.roofId ?? selected;
    const roof = active.roofs.find(roof => roof.id === selectedRoof) ?? [...active.roofs].reverse().find(roof => insidePolygon(point, roof.vertices.map(id => doc.nodes.find(node => node.id === id)!)));
    if (!roof) return null;
    const frame = roofFrame(doc, roof), local = frame.local(point), step = 6 * INCH, width = 24 * INCH, length = 36 * INCH;
    const snap = (value: number) => roundMetres(gridSnap ? Math.round(value / step) * step : value);
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), roofId: roof.id, kind: tool, along: snap(local.along - width / 2), across: snap(local.across - length / 2), width, length };
    return { next: validateDesign({ ...doc, roofOpenings: [...doc.roofOpenings, opening] }), id: opening.id };
  }
  function down(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault(); svg.current?.focus();
    const point = pointer(event), target = (event.target as Element).closest('[data-entity]'), entityId = target?.getAttribute('data-entity') ?? null;
    const nodeId = (event.target as Element).getAttribute('data-node');
    if (tool === 'pan' || event.button === 1 || event.altKey) {
      gesture.current = { pointerId: event.pointerId, base: doc, latest: doc, point, screenStart: local(event), view, nodes: [], pan: true };
      svg.current!.setPointerCapture(event.pointerId); return;
    }
    if (tool === 'door' || tool === 'window') {
      try { const placed = placeOpening(point, false); if (!placed) { onMessage('Choose a host wall in the plan.'); return; } onCommit(placed.next); onDrawComplete(placed.id); onMessage(`${tool === 'door' ? 'Door' : 'Window'} placed and selected. Drag along its wall or edit its dimensions.`); }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (tool === 'cutout' || tool === 'skylight') {
      try { const placed = placeRoofOpening(point, false); if (!placed) { onMessage('Choose a host roof in the active plan. Draw Roof first if needed.'); return; } onCommit(placed.next); onDrawComplete(placed.id); onMessage('Roof opening placed and selected. Drag within its roof or edit its dimensions.'); }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (tool === 'wall' || tool === 'floor' || tool === 'roof') {
      const hit = snapped(point);
      if ((tool === 'floor' || tool === 'roof') && points.length >= 3 && distance(hit, points[0]) < 10 / view.scale) { finishPolygon(); return; }
      if (tool === 'wall' && points.length) {
        try { const next = validateDesign(addShape(doc, [points[0], hit], 'wall', activeLevelId)); onCommit(next); setPoints([{ ...hit, nodeId: next.walls[next.walls.length - 1].end }]); setHover(null); onPreview(null); onMessage('Wall added. Click the next endpoint, or Escape to finish.'); }
        catch (error) { onMessage((error as Error).message); }
      } else if (!points.some(existing => distance(existing, hit) < .000001)) { setPoints([...points, hit]); setHover(hit); onMessage(tool !== 'wall' ? 'Click corners, then Finish, Enter, or the first corner to save. Escape cancels the draft.' : 'Click an endpoint. Escape cancels.'); }
      return;
    }
    if (nodeId || entityId) {
      if (entityId) onSelect(entityId);
      const entity = doc.walls.find(wall => wall.id === entityId) ?? doc.floors.find(floor => floor.id === entityId) ?? doc.roofs.find(roof => roof.id === entityId);
      const keys = nodeId ? [nodeId] : entity ? 'vertices' in entity ? entity.vertices : [entity.start, entity.end] : [];
      gesture.current = { pointerId: event.pointerId, base: doc, latest: doc, point, view, nodes: keys, pan: false, node: nodeId ?? undefined, opening: doc.openings.some(o => o.id === entityId) ? entityId! : undefined, roofOpening: doc.roofOpenings.some(o => o.id === entityId) ? entityId! : undefined };
      svg.current!.setPointerCapture(event.pointerId);
    } else onSelect(null);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const active = gesture.current;
    if (!active) {
      if ((tool === 'wall' || tool === 'floor' || tool === 'roof') && points.length) setHover(snapped(pointer(event)));
      if (tool === 'cutout' || tool === 'skylight') { try { onPreview(placeRoofOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      if (tool === 'door' || tool === 'window') { try { onPreview(placeOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      return;
    }
    if (event.pointerId !== active.pointerId) return;
    if (active.pan) { const here = local(event), start = active.screenStart!; setView({ ...active.view, x: active.view.x + here.x - start.x, y: active.view.y + here.y - start.y }); return; }
    const p = screenToPlan(local(event), active.view), baseNodes = new Map(active.base.nodes.map(node => [node.id, node]));
    if (active.roofOpening) {
      const opening = active.base.roofOpenings.find(opening => opening.id === active.roofOpening)!, roof = active.base.roofs.find(roof => roof.id === opening.roofId)!, frame = roofFrame(active.base, roof);
      const start = frame.local(active.point), here = frame.local(p), step = 6 * INCH;
      const snap = (value: number) => roundMetres(gridSnap ? Math.round(value / step) * step : value);
      const along = snap(opening.along + here.along - start.along), across = snap(opening.across + here.across - start.across);
      try { active.latest = validateDesign({ ...active.base, roofOpenings: active.base.roofOpenings.map(item => item.id === opening.id ? { ...item, along, across } : item) }); onPreview(active.latest); onMessage('Moving roof opening. Release to commit; Escape cancels.'); }
      catch (error) { onMessage((error as Error).message); }
      return;
    }
    if (active.opening) {
      const opening = active.base.openings.find(o => o.id === active.opening)!, wall = active.base.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(active.base, wall);
      const raw = opening.offset + frame.project(p) - frame.project(active.point), offset = roundMetres(gridSnap ? Math.round(raw / (6 * INCH)) * 6 * INCH : raw);
      try { active.latest = validateDesign({ ...active.base, openings: active.base.openings.map(o => o.id === opening.id ? { ...o, offset } : o) }); onPreview(active.latest); onMessage('Moving opening along its host wall. Release to commit; Escape cancels.'); }
      catch (error) { onMessage((error as Error).message); }
      return;
    }
    let dx = p.x - active.point.x, dz = p.z - active.point.z;
    const positions = new Map<string, PlanPoint>();
    if (active.node) {
      const snap = snapPoint(p, levelDocument(active.base, activeLevelId).nodes, active.view.scale, gridSnap, active.nodes); active.merge = snap.nodeId;
      positions.set(active.node, snap.point);
    } else {
      if (gridSnap) { dx = Math.round(dx / (6 * INCH)) * 6 * INCH; dz = Math.round(dz / (6 * INCH)) * 6 * INCH; }
      for (const key of active.nodes) { const n = baseNodes.get(key)!; positions.set(key, { x: n.x + dx, z: n.z + dz }); }
    }
    try { active.latest = validateDesign(moveNodes(active.base, positions)); onPreview(active.latest); onMessage('Moving connected geometry. Release to commit; Escape cancels.'); }
    catch (error) { active.merge = undefined; onMessage((error as Error).message); }
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const active = gesture.current; if (!active || event.pointerId !== active.pointerId) return;
    gesture.current = null;
    try { if (!active.pan) onCommit(active.node && active.merge ? mergeNodes(active.latest, active.node, active.merge) : active.latest); }
    catch (error) { onMessage((error as Error).message); }
    onPreview(null); if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
  }
  const polygon = (points: PlanPoint[]) => points.map(point => `${point.x},${point.z}`).join(' ');
  const gridFeet = 2 ** Math.max(0, Math.ceil(Math.log2(12 / (12 * INCH * view.scale))));
  const grid = gridFeet * 12 * INCH * view.scale;
  function fitPlan() {
    if (!active.nodes.length) return;
    const minX = Math.min(...active.nodes.map(node => node.x)) - .3, maxX = Math.max(...active.nodes.map(node => node.x)) + .3;
    const minZ = Math.min(...active.nodes.map(node => node.z)) - .3, maxZ = Math.max(...active.nodes.map(node => node.z)) + .3;
    const scale = Math.max(.05, Math.min(300, (size.width - 40) / (maxX - minX), (size.height - 40) / (maxZ - minZ)));
    setView({ x: size.width / 2 - (minX + maxX) / 2 * scale, y: size.height / 2 - (minZ + maxZ) / 2 * scale, scale });
  }
  return <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#091423]">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs">
      <span className="font-semibold">2D Plan · {doc.levels.find(level => level.id === activeLevelId)?.name} · X / Z · {gridFeet} ft grid</span>
      <div className="flex items-center gap-2"><span>{Number(view.scale.toFixed(2))} px/m</span><Button size="sm" variant="outline" disabled={!active.nodes.length} onClick={fitPlan}>Fit Plan</Button><Button size="sm" variant="outline" onClick={() => setView({ x: 80, y: 80, scale: 45 })}>Reset View</Button></div>
    </div>
    <svg ref={svg} data-testid="home-plan" aria-label="ThreeD Design 2D plan" tabIndex={0} width="100%" height="100%" className="block min-h-0 w-full flex-1 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
      onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { gesture.current = null; setPoints([]); setHover(null); onPreview(null); onMessage('Gesture cancelled.'); }}
      onLostPointerCapture={() => { if (gesture.current) { gesture.current = null; onPreview(null); } }}
      onPointerLeave={() => { if (!gesture.current && (tool === 'door' || tool === 'window' || tool === 'cutout' || tool === 'skylight')) onPreview(null); }}
      onContextMenu={event => event.preventDefault()}>
      <defs><pattern id={patternId} width={grid} height={grid} patternUnits="userSpaceOnUse" x={view.x % grid} y={view.y % grid}><path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="#204259" strokeWidth=".7" /></pattern></defs>
      <rect width={size.width} height={size.height} fill={`url(#${patternId})`} />
      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {visible.floors.map(floor => <polygon key={floor.id} data-entity={floor.id} points={polygon(floor.vertices.map(id => nodes.get(id)!))} fill={selected === floor.id ? '#177986' : '#405a76'} fillOpacity=".55" stroke="#7694b8" strokeWidth={1 / view.scale} />)}
        {visible.roofs.map(roof => { const points = roof.vertices.map(id => nodes.get(id)!); const center = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, z: sum.z + point.z / points.length }), { x: 0, z: 0 }); return <g key={roof.id} data-entity={roof.id} data-roof={roof.kind}><polygon points={polygon(points)} fill="#c084fc" fillOpacity={selected === roof.id ? .18 : .06} stroke="#c084fc" strokeWidth={3 / view.scale} pointerEvents="stroke" /><text x={center.x} y={center.z} fill="#e9d5ff" fontSize={12 / view.scale} textAnchor="middle" className="cursor-move">{roof.kind} roof</text></g>; })}
        {visible.walls.map(wall => <g key={wall.id}><polygon data-entity={wall.id} points={polygon(wallFootprint(displayDocument, wall))} fill={selected === wall.id ? '#36b8c8' : '#b4c8df'} stroke="#5b8baf" strokeWidth={1 / view.scale} /><line data-entity={wall.id} x1={nodes.get(wall.start)!.x} y1={nodes.get(wall.start)!.z} x2={nodes.get(wall.end)!.x} y2={nodes.get(wall.end)!.z} stroke="transparent" strokeWidth={Math.max(wall.thickness, 10 / view.scale)} /><text x={(nodes.get(wall.start)!.x + nodes.get(wall.end)!.x) / 2} y={(nodes.get(wall.start)!.z + nodes.get(wall.end)!.z) / 2 - .2} fill="#dde8f6" fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{formatLength(distance(nodes.get(wall.start)!, nodes.get(wall.end)!))}</text></g>)}
        {visible.openings.map(opening => {
          const footprint = openingFootprint(displayDocument, opening), host = displayDocument.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(displayDocument, host);
          const a = frame.point(opening.offset), b = frame.point(opening.offset + opening.width), color = selected === opening.id ? '#facc15' : opening.kind === 'door' ? '#f0ab65' : '#67e8f9';
          return <g key={opening.id} data-entity={opening.id} data-opening={opening.kind}><polygon points={polygon(footprint)} fill="#091423" stroke={color} strokeWidth={1.5 / view.scale} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke={color} strokeWidth={3 / view.scale} strokeDasharray={opening.kind === 'door' ? `${5 / view.scale} ${3 / view.scale}` : undefined} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke="transparent" strokeWidth={Math.max(host.thickness, 12 / view.scale)} /><text x={(a.x + b.x) / 2} y={(a.z + b.z) / 2 + .35} fill={color} fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{opening.kind === 'door' ? 'Door' : 'Window'}</text></g>;
        })}
        {visible.roofOpenings.map(opening => { const points = roofOpeningFootprint(displayDocument, opening), center = points.reduce((sum, p) => ({ x: sum.x + p.x / 4, z: sum.z + p.z / 4 }), { x: 0, z: 0 }); const color = selected === opening.id ? '#facc15' : opening.kind === 'skylight' ? '#67e8f9' : '#fb923c'; return <g key={opening.id} data-entity={opening.id} data-roof-opening={opening.kind}><polygon points={polygon(points)} fill={opening.kind === 'skylight' ? '#164e63' : '#091423'} fillOpacity={opening.kind === 'skylight' ? .65 : .9} stroke={color} strokeWidth={2 / view.scale} /><text x={center.x} y={center.z} fill={color} fontSize={10 / view.scale} textAnchor="middle" pointerEvents="none">{opening.kind === 'skylight' ? 'Skylight' : 'Cutout'}</text></g>; })}
        {handles.map(key => <circle key={key} data-node={key} cx={nodes.get(key)!.x} cy={nodes.get(key)!.z} r={6 / view.scale} fill="#facc15" stroke="#101827" strokeWidth={1 / view.scale} />)}
        {!!points.length && <><polyline points={polygon(hover ? [...points, hover] : points)} fill={tool !== 'wall' ? '#15b8a633' : 'none'} stroke="#2dd4bf" strokeWidth={2 / view.scale} strokeDasharray={`${6 / view.scale} ${4 / view.scale}`} pointerEvents="none" />{points.map((p, index) => <circle key={index} cx={p.x} cy={p.z} r={4 / view.scale} fill="#2dd4bf" pointerEvents="none" />)}{hover && <circle cx={hover.x} cy={hover.z} r={6 / view.scale} fill="none" stroke={hover.nodeId ? '#facc15' : '#2dd4bf'} strokeWidth={2 / view.scale} pointerEvents="none" />}</>}
      </g>
    </svg>
    {(tool === 'floor' || tool === 'roof') && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#111a28] px-3 py-2 text-xs" data-testid={`home-${tool}-draft`}>
      <span>{points.length} corners. Choose at least 3; Enter or the first corner finishes. Escape cancels.</span>
      <div className="flex gap-2"><Button size="sm" variant="outline" disabled={!points.length} onClick={() => { setPoints([]); setHover(null); onPreview(null); onMessage('Draft cancelled. Completed geometry is retained.'); }}>Cancel Draft</Button><Button size="sm" disabled={points.length < 3} onClick={finishPolygon}>Finish {tool === 'roof' ? 'Roof' : 'Floor'}</Button></div>
    </div>}
  </section>;
}
