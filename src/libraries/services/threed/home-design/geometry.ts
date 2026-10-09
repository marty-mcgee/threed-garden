import { BoxGeometry, BufferGeometry, Float32BufferAttribute, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, ShapeUtils, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { distance, entityElevation, entityLevelId, EPS, INCH, polygonIssue, roofOpeningFootprint, roofProfile, signedArea, wallFrame, type DesignDocument, type DesignOpening, type DesignRoof, type DesignRoofOpening, type DesignWall, type PlanPoint } from './document';
/** Same footprint drives SVG and 3D. Two-way corners miter; acute joins cap at 4 half-widths. */
export function wallFootprint(doc: DesignDocument, wall: DesignWall): PlanPoint[] {
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  const a = nodes.get(wall.start)!, b = nodes.get(wall.end)!;
  const span = distance(a, b); if (span < EPS) return [];
  const dx = (b.x - a.x) / span, dz = (b.z - a.z) / span, half = wall.thickness / 2;
  function corner(key: string, p: PlanPoint, side: number) {
    const base = { x: p.x - dz * half * side, z: p.z + dx * half * side };
    const neighbors = doc.walls.filter(other => other.id !== wall.id && other.levelId === wall.levelId && other.elevation === wall.elevation && (other.start === key || other.end === key));
    if (neighbors.length !== 1) return base;
    const other = neighbors[0], q = nodes.get(other.start === key ? other.end : other.start)!;
    const len = distance(p, q); if (len < EPS) return base;
    const ux = (q.x - p.x) / len, uz = (q.z - p.z) / len;
    // Reverse the neighbor side at the wall's end to meet the same physical boundary.
    const sign = key === wall.start ? -side : side;
    const offset = { x: p.x - uz * other.thickness / 2 * sign, z: p.z + ux * other.thickness / 2 * sign };
    const determinant = dx * uz - dz * ux;
    if (Math.abs(determinant) < 1e-4) return base;
    const t = ((offset.x - base.x) * uz - (offset.z - base.z) * ux) / determinant;
    const limit = Math.min(span / 2, 4 * Math.max(half, other.thickness / 2));
    if (Math.abs(t) > limit) return base; // bounded butt/overlap fallback, never a long spike
    return { x: base.x + dx * t, z: base.z + dz * t };
  }
  return [corner(wall.start, a, 1), corner(wall.end, b, 1), corner(wall.end, b, -1), corner(wall.start, a, -1)];
}
export function extrudePlan(points: PlanPoint[], height: number, bottom: number) {
  if (polygonIssue(points)) return null;
  const shape = new Shape(points.map(point => new Vector2(point.x, -point.z)));
  const geometry = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1, curveSegments: 1 });
  geometry.rotateX(-Math.PI / 2); geometry.translate(0, bottom, 0); geometry.computeBoundingBox();
  return geometry;
}
/** Clip the shared miter footprint along the host axis, retaining its actual corner ends. */
function clipFootprint(points: PlanPoint[], project: (point: PlanPoint) => number, boundary: number, above: boolean) {
  const result: PlanPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], da = project(a) - boundary, db = project(b) - boundary;
    const insideA = above ? da >= -EPS : da <= EPS, insideB = above ? db >= -EPS : db <= EPS;
    if (insideA) result.push(a);
    if (insideA !== insideB) { const t = da / (da - db); result.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); }
  }
  return result.filter((point, i) => result.findIndex(other => distance(point, other) < EPS) === i);
}
/** Triangulate before ridge clipping so concave footprints cannot bridge empty space. */
export function roofGeometry(doc: DesignDocument, roof: DesignRoof): BufferGeometry {
  const points = roof.vertices.map(id => doc.nodes.find(node => node.id === id)!);
  const holes = doc.roofOpenings.filter(opening => opening.roofId === roof.id).map(opening => roofOpeningFootprint(doc, opening));
  return roofSolid(points, holes, roofProfile(points, roof), roof.kind === 'gable', entityElevation(doc, roof), roof.thickness);
}
function roofSolid(outer: PlanPoint[], holes: PlanPoint[][], profile: ReturnType<typeof roofProfile>, splitRidge: boolean, base: number, thickness: number): BufferGeometry {
  let points = outer;
  if (signedArea(points) < 0) points = [...points].reverse();
  const rings = [points, ...holes.map(hole => signedArea(hole) > 0 ? [...hole].reverse() : hole)], vertices = rings.flat(), positions: number[] = [];
  const vertex = (point: PlanPoint, top: boolean) => [point.x, base + profile.height(point) + (top ? thickness : 0), point.z];
  const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
  for (const face of ShapeUtils.triangulateShape(rings[0].map(p => new Vector2(p.x, p.z)), rings.slice(1).map(ring => ring.map(p => new Vector2(p.x, p.z))))) {
    const source = face.map(index => vertices[index]);
    const pieces = splitRidge ? [clipFootprint(source, profile.project, profile.ridge, true), clipFootprint(source, profile.project, profile.ridge, false)] : [source];
    for (let piece of pieces) {
      if (piece.length < 3 || Math.abs(signedArea(piece)) < EPS * EPS) continue;
      if (signedArea(piece) < 0) piece = [...piece].reverse();
      for (let i = 1; i < piece.length - 1; i++) {
        triangle(vertex(piece[0], true), vertex(piece[i + 1], true), vertex(piece[i], true));
        triangle(vertex(piece[0], false), vertex(piece[i], false), vertex(piece[i + 1], false));
      }
    }
  }
  for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], da = profile.project(a) - profile.ridge, db = profile.project(b) - profile.ridge;
    const edge: PlanPoint[] = [a];
    if (splitRidge && da * db < 0) { const t = da / (da - db); edge.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); }
    edge.push(b);
    for (let j = 0; j < edge.length - 1; j++) {
      const lowA = vertex(edge[j], false), lowB = vertex(edge[j + 1], false), highA = vertex(edge[j], true), highB = vertex(edge[j + 1], true);
      triangle(lowA, highA, lowB); triangle(lowB, highA, highB);
    }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); return geometry;
}
function skylightGroup(doc: DesignDocument, opening: DesignRoofOpening) {
  const roof = doc.roofs.find(roof => roof.id === opening.roofId)!, points = roof.vertices.map(id => doc.nodes.find(node => node.id === id)!);
  const outer = roofOpeningFootprint(doc, opening), trim = Math.min(INCH, opening.width / 5, opening.length / 5);
  const inner = roofOpeningFootprint(doc, { ...opening, along: opening.along + trim, across: opening.across + trim, width: opening.width - 2 * trim, length: opening.length - 2 * trim });
  const profile = roofProfile(points, roof), base = entityElevation(doc, roof) + roof.thickness;
  const group = new Group(); group.name = opening.id; group.userData.designEntityId = opening.id;
  const rim = new Mesh(roofSolid(outer, [inner], profile, false, base, INCH), new MeshStandardMaterial({ color: '#b5d3e5', roughness: .65 }));
  const glass = new Mesh(roofSolid(inner, [], profile, false, base + INCH / 2, .008), new MeshStandardMaterial({ color: '#8ed8f1', transparent: true, opacity: .28, depthWrite: false, roughness: .1 }));
  // Geometry is world-space so arbitrary host directions and pitch retain exact alignment.
  for (const mesh of [rim, glass]) { mesh.userData.designEntityId = opening.id; group.add(mesh); }
  return group;
}
/** Partition wall solids around rectangular apertures. No CSG or hidden covering planes. */
export function wallGeometry(doc: DesignDocument, wall: DesignWall): BufferGeometry {
  const points = wallFootprint(doc, wall), hosted = doc.openings.filter(o => o.wallId === wall.id);
  const elevation = entityElevation(doc, wall);
  if (!hosted.length) return extrudePlan(points, wall.height, elevation)!;
  const frame = wallFrame(doc, wall), axis = points.map(frame.project);
  const cuts = [...new Set([Math.min(...axis), Math.max(...axis), ...hosted.flatMap(o => [o.offset, o.offset + o.width])])].sort((a, b) => a - b);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const left = cuts[i], right = cuts[i + 1], middle = (left + right) / 2;
    const footprint = clipFootprint(clipFootprint(points, frame.project, left, true), frame.project, right, false);
    const holes = hosted.filter(o => middle > o.offset && middle < o.offset + o.width);
    const heights = [...new Set([0, wall.height, ...holes.flatMap(o => [o.sill, o.sill + o.height])])].sort((a, b) => a - b);
    for (let j = 0; j < heights.length - 1; j++) {
      const low = heights[j], high = heights[j + 1], center = (low + high) / 2;
      if (holes.some(o => center > o.sill && center < o.sill + o.height)) continue;
      const part = extrudePlan(footprint, high - low, elevation + low); if (part) parts.push(part);
    }
  }
  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  if (!merged) throw new Error('Unable to generate the host wall openings.');
  merged.computeBoundingBox(); return merged;
}
function openingGroup(doc: DesignDocument, opening: DesignOpening) {
  const wall = doc.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(doc, wall), start = frame.point(opening.offset);
  const group = new Group(); group.name = opening.id; group.userData.designEntityId = opening.id;
  group.position.set(start.x, entityElevation(doc, wall) + opening.sill, start.z); group.rotation.y = -Math.atan2(frame.dz, frame.dx);
  const trim = Math.min(2 * INCH, opening.width / 5, opening.height / 5), depth = wall.thickness + INCH;
  const material = new MeshStandardMaterial({ color: opening.kind === 'door' ? '#9f7045' : '#b5d3e5', roughness: .65 });
  const box = (width: number, height: number, thickness: number, x: number, y: number, mat = material) => {
    const mesh = new Mesh(new BoxGeometry(width, height, thickness), mat); mesh.position.set(x, y, 0); mesh.userData.designEntityId = opening.id; group.add(mesh); return mesh;
  };
  box(trim, opening.height, depth, trim / 2, opening.height / 2);
  box(trim, opening.height, depth, opening.width - trim / 2, opening.height / 2);
  box(opening.width - 2 * trim, trim, depth, opening.width / 2, opening.height - trim / 2);
  if (opening.kind === 'window') {
    box(opening.width - 2 * trim, trim, depth, opening.width / 2, trim / 2);
    box(opening.width - 2 * trim, opening.height - 2 * trim, .008, opening.width / 2, opening.height / 2,
      new MeshStandardMaterial({ color: '#8ed8f1', transparent: true, opacity: .28, depthWrite: false, roughness: .1 }));
  } else {
    const leaf = box(opening.width - 2 * trim, opening.height - trim, .035, trim, (opening.height - trim) / 2);
    leaf.rotation.y = Math.PI / 2; leaf.position.z = -(opening.width - 2 * trim) / 2;
  }
  return group;
}
function disposeOpening(group: Group) {
  const materials = new Set<MeshStandardMaterial>();
  group.traverse(object => { if (object instanceof Mesh) { object.geometry.dispose(); materials.add(object.material as MeshStandardMaterial); } });
  for (const material of materials) material.dispose();
  group.clear();
}
/** Three raycasts do not inherently exclude invisible ancestors. Keep hidden levels unpickable. */
function respectVisibility(object: Group | Mesh) {
  object.traverse(child => {
    if (!(child instanceof Mesh)) return;
    child.raycast = function (raycaster, intersections) {
      let owner: typeof child | null = this;
      while (owner) { if (!owner.visible) return; owner = owner.parent as typeof child | null; }
      Mesh.prototype.raycast.call(this, raycaster, intersections);
    };
  });
}
/** Retained mesh owners; unchanged signatures keep their geometry and GPU resources. */
export class DesignGeometryCache {
  readonly group = new Group();
  private entries = new Map<string, { signature: string; mesh: Mesh<BufferGeometry, MeshStandardMaterial> }>();
  private openings = new Map<string, { signature: string; group: Group }>();
  private skylights = new Map<string, { signature: string; group: Group }>();
  update(doc: DesignDocument, selected: string | null, visibleLevelId?: string, showRoofs = true) {
    const desired = new Set<string>(), nodes = new Map(doc.nodes.map(node => [node.id, node]));
    const update = (id: string, points: PlanPoint[], height: number, bottom: number, floor: boolean, wall?: DesignWall, roof?: DesignRoof) => {
      if (polygonIssue(points)) return;
      desired.add(id);
      const signature = JSON.stringify([points, height, bottom, wall ? doc.openings.filter(o => o.wallId === id) : [], roof, roof ? doc.roofOpenings.filter(o => o.roofId === id) : []]); let entry = this.entries.get(id);
      if (!entry) {
        const geometry = roof ? roofGeometry(doc, roof) : wall ? wallGeometry(doc, wall) : extrudePlan(points, height, bottom)!;
        const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: roof ? '#927b9f' : floor ? '#536b83' : '#ccd4dd', roughness: .85 }));
        respectVisibility(mesh);
        mesh.name = id; mesh.userData.designEntityId = id;
        entry = { mesh, signature }; this.entries.set(id, entry); this.group.add(mesh);
      } else if (entry.signature !== signature) {
        const next = roof ? roofGeometry(doc, roof) : wall ? wallGeometry(doc, wall) : extrudePlan(points, height, bottom)!; entry.mesh.geometry.dispose(); entry.mesh.geometry = next; entry.signature = signature;
      }
      entry.mesh.material.emissive.set(selected === id ? '#125e69' : '#000000');
    };
    for (const wall of doc.walls) update(wall.id, wallFootprint(doc, wall), wall.height, entityElevation(doc, wall), false, wall);
    for (const floor of doc.floors) update(floor.id, floor.vertices.map(id => nodes.get(id)!), floor.thickness, entityElevation(doc, floor) - floor.thickness, true);
    for (const roof of doc.roofs) update(roof.id, roof.vertices.map(id => nodes.get(id)!), roof.thickness, entityElevation(doc, roof), false, undefined, roof);
    for (const [id, entry] of this.entries) if (!desired.has(id)) { this.group.remove(entry.mesh); entry.mesh.geometry.dispose(); entry.mesh.material.dispose(); this.entries.delete(id); }
    const openingIds = new Set(doc.openings.map(o => o.id));
    for (const opening of doc.openings) {
      const wall = doc.walls.find(w => w.id === opening.wallId)!;
      const signature = JSON.stringify([opening, wall, entityElevation(doc, wall), nodes.get(wall.start), nodes.get(wall.end)]);
      let entry = this.openings.get(opening.id);
      if (entry?.signature !== signature) {
        if (entry) { this.group.remove(entry.group); disposeOpening(entry.group); }
        entry = { signature, group: openingGroup(doc, opening) }; respectVisibility(entry.group); this.openings.set(opening.id, entry); this.group.add(entry.group);
      }
      entry!.group.traverse(object => { if (object instanceof Mesh) (object.material as MeshStandardMaterial).emissive.set(selected === opening.id ? '#125e69' : '#000000'); });
    }
    for (const [id, entry] of this.openings) if (!openingIds.has(id)) { this.group.remove(entry.group); disposeOpening(entry.group); this.openings.delete(id); }
    const skylightIds = new Set<string>();
    for (const opening of doc.roofOpenings.filter(opening => opening.kind === 'skylight')) {
      skylightIds.add(opening.id);
      const roof = doc.roofs.find(roof => roof.id === opening.roofId)!;
      const signature = JSON.stringify([opening, roof, entityElevation(doc, roof), roof.vertices.map(id => nodes.get(id))]);
      let entry = this.skylights.get(opening.id);
      if (entry?.signature !== signature) {
        if (entry) { this.group.remove(entry.group); disposeOpening(entry.group); }
        entry = { signature, group: skylightGroup(doc, opening) }; respectVisibility(entry.group); this.skylights.set(opening.id, entry); this.group.add(entry.group);
      }
      entry!.group.traverse(object => { if (object instanceof Mesh) (object.material as MeshStandardMaterial).emissive.set(selected === opening.id ? '#125e69' : '#000000'); });
    }
    for (const [id, entry] of this.skylights) if (!skylightIds.has(id)) { this.group.remove(entry.group); disposeOpening(entry.group); this.skylights.delete(id); }
    // Visibility is a view choice, not deletion: retain mesh owners and GPU resources.
    const roofIds = new Set([...doc.roofs.map(roof => roof.id), ...doc.roofOpenings.map(opening => opening.id)]);
    for (const child of this.group.children) child.visible = (!visibleLevelId || entityLevelId(doc, child.name) === visibleLevelId) && (showRoofs || !roofIds.has(child.name));
  }
  dispose() { for (const entry of this.entries.values()) { entry.mesh.geometry.dispose(); entry.mesh.material.dispose(); } for (const entry of this.openings.values()) disposeOpening(entry.group); for (const entry of this.skylights.values()) disposeOpening(entry.group); this.skylights.clear(); this.openings.clear(); this.entries.clear(); this.group.clear(); }
}
