import { moveNodes, openingFootprint, roofFrame, roofOpeningFootprint, validateDesign, type DesignDocument, type PlanPoint } from './document';

export function entityPoints(doc: DesignDocument, id: string | null): PlanPoint[] {
  const wall = doc.walls.find(e => e.id === id), polygon = doc.floors.find(e => e.id === id) ?? doc.roofs.find(e => e.id === id);
  const opening = doc.openings.find(e => e.id === id), roofOpening = doc.roofOpenings.find(e => e.id === id);
  if (opening) return openingFootprint(doc, opening);
  if (roofOpening) return roofOpeningFootprint(doc, roofOpening);
  return (wall ? [wall.start, wall.end] : polygon?.vertices ?? []).map(key => doc.nodes.find(node => node.id === key)!);
}
export function objectProperties(doc: DesignDocument, id: string | null) {
  const points = entityPoints(doc, id); if (!points.length) return null;
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x)), minZ = Math.min(...points.map(p => p.z)), maxZ = Math.max(...points.map(p => p.z));
  const a = points[0], b = points[1];
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, width: maxX - minX, depth: maxZ - minZ, rotation: (Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI + 360) % 360 };
}
export type ObjectEdit = { field: 'x' | 'z' | 'width' | 'depth' | 'rotation' | 'length'; value: number } | { field: 'flipX' | 'flipZ' };
/** Transform authoritative shared corners, never a generated mesh or reusable Model. */
export function editObject(doc: DesignDocument, id: string, edit: ObjectEdit): DesignDocument {
  const wall = doc.walls.find(e => e.id === id), polygon = doc.floors.find(e => e.id === id) ?? doc.roofs.find(e => e.id === id);
  const props = objectProperties(doc, id);
  if (!props || (!wall && !polygon)) throw new Error('Use the hosted opening offsets to move this object.');
  const keys = wall ? [wall.start, wall.end] : polygon!.vertices;
  const roof = doc.roofs.find(e => e.id === id), holes = doc.roofOpenings.filter(e => e.roofId === id);
  if (holes.length && (edit.field === 'width' || edit.field === 'depth')) throw new Error('Resize roof corners individually while it has openings. Roof-frame rectangles cannot be stretched on world axes.');
  let sx = 1, sz = 1, angle = 0, dx = 0, dz = 0;
  if (edit.field === 'x') dx = edit.value - props.x;
  if (edit.field === 'z') dz = edit.value - props.z;
  if (edit.field === 'rotation') angle = (edit.value - props.rotation) * Math.PI / 180;
  if (edit.field === 'flipX') sx = -1;
  if (edit.field === 'flipZ') sz = -1;
  if (edit.field === 'width' || edit.field === 'depth') {
    const current = props[edit.field]; if (current < .000001 || edit.value <= 0) throw new Error('This extent cannot be resized.');
    if (edit.field === 'width') sx = edit.value / current; else sz = edit.value / current;
  }
  if (edit.field === 'length' && wall) {
    const a = doc.nodes.find(n => n.id === wall.start)!, b = doc.nodes.find(n => n.id === wall.end)!, length = Math.hypot(b.x - a.x, b.z - a.z);
    sx = sz = edit.value / length;
  }
  const transform = (p: PlanPoint) => { const x = (p.x - props.x) * sx, z = (p.z - props.z) * sz; return { x: props.x + x * Math.cos(angle) - z * Math.sin(angle) + dx, z: props.z + x * Math.sin(angle) + z * Math.cos(angle) + dz }; };
  let next = moveNodes(doc, new Map(keys.map(key => [key, transform(doc.nodes.find(n => n.id === key)!)])));
  if (roof) {
    const direction = roof.direction * Math.PI / 180, x = Math.cos(direction) * sx, z = Math.sin(direction) * sz;
    const degrees = ((Math.atan2(z, x) + angle) * 180 / Math.PI + 360) % 360;
    const updated = { ...roof, direction: degrees };
    next = { ...next, roofs: next.roofs.map(r => r.id === id ? updated : r) };
    const frame = roofFrame(next, updated);
    next = { ...next, roofOpenings: next.roofOpenings.map(hole => {
      if (hole.roofId !== id) return hole;
      const corners = roofOpeningFootprint(doc, hole).map(transform).map(frame.local);
      return { ...hole, along: Math.min(...corners.map(p => p.along)), across: Math.min(...corners.map(p => p.across)) };
    }) };
  }
  return validateDesign(next);
}
