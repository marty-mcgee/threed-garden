'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { CircleMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cutoutBounds, distance, nearestRoofEdge, validateDesign, wallHeightAt, wallOpeningFace, type DesignDocument, type DesignOpening, type DesignWall, type PlanPoint } from '@/libraries/services/threed/design/document';
import { formatPlanLength } from '@/libraries/services/threed/design/plan-navigation';

interface Props {
  doc: DesignDocument;
  wall: DesignWall;
  opening?: DesignOpening;
  units: 'imperial' | 'metric';
  onFinish: (doc: DesignDocument, id: string) => void;
  onCancel: () => void;
}

export function WallCutoutEditor({ doc, wall, opening, units, onFinish, onCancel }: Props) {
  const [corners, setCorners] = useState<PlanPoint[]>(() => opening ? wallOpeningFace(opening) : []);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [error, setError] = useState('');
  const drag = useRef<{ pointer: number; index: number; original: PlanPoint[] } | null>(null);
  const start = doc.nodes.find(n => n.id === wall.start)!, end = doc.nodes.find(n => n.id === wall.end)!;
  const length = distance(start, end), endHeight = wall.endHeight ?? wall.height;
  const height = Math.max(wall.height, endHeight);
  const scale = Math.min(560 / length, 210 / height);
  const outline = [{x:0,z:0},{x:length,z:0},{x:length,z:endHeight},{x:0,z:wall.height}];
  const screenX = (x: number) => 20 + x * scale;
  const screenY = (z: number) => 230 - z * scale;
  const polygon = (ring: PlanPoint[]) => ring.map(p => screenX(p.x) + ',' + screenY(p.z)).join(' ');
  function point(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM()!;
    const p = new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    const x = Math.max(0,Math.min(length,(p.x-20)/scale));
    const candidate = { x, z:Math.max(0,Math.min(wallHeightAt(wall,x,length),(230-p.y)/scale)) };
    const edge = nearestRoofEdge(candidate,outline);
    return edge.gap * scale < 5 ? edge.point : candidate;
  }
  function removePoint(index: number) {
    if (opening && corners.length <= 3) { setError('Keep at least three corners.'); return; }
    setError('');
    setActivePoint(null);
    setCorners(corners.filter((_, i) => i !== index));
  }
  function finish() {
    try {
      const {along,across,width,length:cutHeight,outline:shape} = cutoutBounds(corners.map(p=>({along:p.x,across:p.z})));
      const cut: DesignOpening = {
        id: opening?.id ?? crypto.randomUUID(),
        wallId: wall.id,
        kind: 'wall-cutout',
        outline: shape,
        offset: along,
        sill: across,
        width,
        height: cutHeight,
      };
      const openings = opening ? doc.openings.map(o=>o.id===opening.id ? cut : o) : [...doc.openings,cut];
      onFinish(validateDesign({...doc,version:8,openings}),cut.id);
    } catch (cause) { setError((cause as Error).message); }
  }
  return <section aria-label="Wall Cutout elevation editor" className="absolute inset-2 z-20 m-auto h-fit max-h-full max-w-xl overflow-auto rounded-lg border bg-background p-3 text-foreground shadow-xl" onKeyDown={event=>{
    event.stopPropagation();
    if(event.key==='Escape') onCancel();
    if(event.key==='Enter' && event.target===event.currentTarget.querySelector('svg') && corners.length>=3) finish();
  }}>
    <strong>Wall Cutout</strong>
    <p className="text-xs">Face view from wall start to end. Click corners, drag a point to reshape, use + to add a point, or right-click a corner and choose Remove Point.</p>
    <svg aria-label="Draw on wall face" tabIndex={0} viewBox="0 0 600 250" className="w-full touch-none rounded bg-slate-950" onPointerDown={event=>{
      if(event.button!==0 || drag.current || !event.currentTarget.contains(event.target as Node)) return;
      event.currentTarget.focus();
      setError('');
      const target = (event.target as Element).closest('[data-index]');
      if (!target && (opening || event.shiftKey)) return;
      const index = target ? Number(target.getAttribute('data-index')) : corners.length;
      if (!target && !opening && corners.length>=3 && distance(point(event),corners[0])*scale<5) { finish(); return; }
      const insert = target?.hasAttribute('data-insert');
      if (event.shiftKey) {
        if (insert) return;
        removePoint(index);
        return;
      }
      if ((!target || insert) && corners.length>=64) { setError('A Wall Cutout supports up to 64 corners.'); return; }
      const next = [...corners];
      if (insert) {
        const a=corners[index], b=corners[(index+1)%corners.length];
        next.splice(index+1,0,{x:(a.x+b.x)/2,z:(a.z+b.z)/2});
      } else if (!target) next.push(point(event));
      setActivePoint(insert ? index + 1 : index);
      drag.current = {pointer:event.pointerId,index:insert ? index+1 : index,original:corners};
      event.currentTarget.setPointerCapture(event.pointerId);
      setCorners(next);
    }} onPointerMove={event=>{
      const current=drag.current;
      if(current?.pointer!==event.pointerId) return;
      const position=point(event);
      setCorners(ring=>ring.map((p,i)=>i===current.index ? position : p));
    }} onPointerUp={event=>{if(drag.current?.pointer===event.pointerId) drag.current=null;}}
    onLostPointerCapture={()=>{if(drag.current) {setCorners(drag.current.original);drag.current=null;}}}>
      <polygon points={polygon(outline)} fill="#475569" stroke="#cbd5e1" />
      {doc.openings.filter(o=>o.wallId===wall.id && o.id!==opening?.id).map(o=><polygon key={o.id} points={polygon(wallOpeningFace(o))} fill="#0f172a" stroke="#94a3b8"><title>{o.kind}</title></polygon>)}
      <polygon points={polygon(corners)} fill="#155e75" stroke="#22d3ee" />
      {corners.map((p,i)=>{
        const b=corners[(i+1)%corners.length];
        return corners.length>=3 && <g key={i} data-index={i} data-insert="" transform={`translate(${screenX((p.x+b.x)/2)} ${screenY((p.z+b.z)/2)})`} style={{cursor:'crosshair'}}>
            <title>Add cutout corner</title><circle r="6" fill="#172033" stroke="#67e8f9"/><path d="M-3 0h6 M0 -3v6" stroke="#67e8f9"/>
          </g>;
      })}
      {corners.map((p,i) => <ContextMenu key={i}><ContextMenuTrigger asChild><g data-index={i}><circle r="9" fill="transparent" cx={screenX(p.x)} cy={screenY(p.z)} onContextMenuCapture={() => setActivePoint(i)} /><circle cx={screenX(p.x)} cy={screenY(p.z)} r={activePoint === i ? 6 : 5} fill={activePoint === i ? "#f472b6" : "#facc15"} onContextMenuCapture={() => setActivePoint(i)} style={{cursor:'move'}}><title>Drag to move. Shift-click to remove this corner.</title></circle></g></ContextMenuTrigger><ContextMenuContent className="z-[5000]" onPointerDown={event => event.stopPropagation()}><ContextMenuItem disabled={Boolean(opening && corners.length <= 3)} onSelect={() => removePoint(i)}><CircleMinus className="size-3.5" aria-hidden="true" />Remove Point</ContextMenuItem></ContextMenuContent></ContextMenu>)}
    </svg>
    <p className="text-xs">Length {formatPlanLength(length,units)} · Start height {formatPlanLength(wall.height,units)} · End height {formatPlanLength(endHeight,units)}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="outline" disabled={activePoint === null || !corners[activePoint] || Boolean(opening && corners.length <= 3)} onClick={() => activePoint !== null && removePoint(activePoint)}><CircleMinus aria-hidden="true" />Remove Point</Button><Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button><Button size="sm" onClick={finish} disabled={corners.length<3}>Finish Cutout</Button></div>
  </section>;
}
