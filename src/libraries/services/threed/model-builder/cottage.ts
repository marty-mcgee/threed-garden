import { Box3, BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3 } from 'three';
import { createCottageMaterials } from './materials';
import { normalizeCottageParameters } from './parameters';
import type { CottageParameters, GeneratedModelBundle } from './types';

type Point = [number, number, number];
type Hole = [number, number, number, number];
type Axis = 'x' | 'z';
interface Part { name: string; material: string; positions: number[]; normals: number[]; uv: number[]; indices: number[] }
interface WallRecord { name: string; axis: Axis; at: number; lo: number; hi: number; bottom: number; top: number; thickness: number; holes: Hole[] }
const ROOF = 'weathered_slate_roof', STONE = 'irregular_fieldstone', SIDING = 'sage_horizontal_siding', WOOD = 'stained_timber';
const DARK = 'dark_structural_timber', GLASS = 'clear_tinted_glass', PAVING = 'jointed_concrete_paving', PLASTER = 'warm_interior_plaster';
const boxFaces = [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]];
const uniqueSorted = (values: number[]) => [...new Set(values)].sort((a,b) => a-b);
const vector = (p: Point) => new Vector3(...p);
const point = (v: Vector3): Point => [v.x, v.y, v.z];
const between = (lo: number, hi: number, step: number): number[] => { const result = []; for (let n = lo; n < hi; n += step) result.push(n); return result; };

/** Pure, bounded geometry/pixel generation. No browser, storage, database or process-global state. */
export function createCottage(input: Partial<CottageParameters> = {}): GeneratedModelBundle {
  const p = normalizeCottageParameters(input), materialSet = createCottageMaterials(p), parts = new Map<string, Part>();
  const wallRecords: WallRecord[] = [];
  function mesh(name: string, vertices: Point[], faces: number[][], material: string) {
    const key = `${name}:${material}`;
    let target = parts.get(key);
    if (!target) { target = { name, material, positions: [], normals: [], uv: [], indices: [] }; parts.set(key, target); }
    for (const face of faces) {
      const clean = face.map(index => vertices[index]).filter((v, i, all) => !i || v.some((n, j) => Math.abs(n - all[i-1][j]) > 1e-9));
      if (clean.length > 2 && clean[0].every((v, i) => Math.abs(v - clean[clean.length - 1][i]) < 1e-9)) clean.pop();
      if (clean.length < 3) continue;
      const normal = vector(clean[1]).sub(vector(clean[0])).cross(vector(clean[2]).sub(vector(clean[0])));
      if (normal.lengthSq() < 1e-12) continue;
      normal.normalize(); const drop = Math.abs(normal.x) > Math.abs(normal.z) ? 0 : 2, start = target.positions.length / 3;
      for (const v of clean) {
        target.positions.push(...v); target.normals.push(normal.x, normal.y, normal.z);
        target.uv.push(Math.abs(normal.y) < .5 ? v[drop === 0 ? 2 : 0] / 96 : v[0] / 96, Math.abs(normal.y) < .5 ? v[1] / 96 : v[2] / 96);
      }
      for (let j = 1; j < clean.length - 1; j++) target.indices.push(start, start+j, start+j+1);
    }
  }
  function plane(name: string, vertices: Point[], material: string) { mesh(name, vertices, [vertices.map((_,i) => i)], material); }
  function box(name: string, center: Point, size: Point, material: string) {
    if (size.some(n => n <= 0)) throw new Error(`Invalid dimensions for ${name}.`);
    const [x,y,z] = center, [w,h,l] = size.map(n => n/2);
    mesh(name, [[x-w,y-h,z-l],[x+w,y-h,z-l],[x+w,y+h,z-l],[x-w,y+h,z-l],[x-w,y-h,z+l],[x+w,y-h,z+l],[x+w,y+h,z+l],[x-w,y+h,z+l]], boxFaces, material);
  }
  function basis(a: Point, b: Point) {
    const axis = vector(b).sub(vector(a)).normalize(); let r = axis.clone().cross(new Vector3(0,1,0));
    if (r.length() < .01) r = axis.clone().cross(new Vector3(1,0,0)); r.normalize();
    return { r, q: axis.clone().cross(r).normalize() };
  }
  function beam(name: string, a: Point, b: Point, size: number, material: string) {
    if (vector(a).distanceToSquared(vector(b)) < 1e-12) return;
    const { r, q } = basis(a,b); r.multiplyScalar(size/2); q.multiplyScalar(size/2);
    const vertices = [a,b].flatMap(c => [point(vector(c).sub(r).sub(q)), point(vector(c).add(r).sub(q)), point(vector(c).add(r).add(q)), point(vector(c).sub(r).add(q))]);
    mesh(name, vertices, boxFaces, material);
  }
  function cylinder(name: string, a: Point, b: Point, radius: number, material: string, segments = 10) {
    const { r, q } = basis(a,b), vertices = [a,b].flatMap(c => Array.from({ length: segments }, (_,i) => point(vector(c).addScaledVector(r, radius*Math.cos(2*Math.PI*i/segments)).addScaledVector(q, radius*Math.sin(2*Math.PI*i/segments)))));
    const faces = [Array.from({ length: segments }, (_,i) => segments-1-i), Array.from({ length: segments }, (_,i) => segments+i)];
    for (let i = 0; i < segments; i++) faces.push([i,(i+1)%segments,(i+1)%segments+segments,i+segments]);
    mesh(name,vertices,faces,material);
  }
  function wall(name: string, axis: Axis, at: number, lo: number, hi: number, bottom: number, top: number, thickness: number, holes: Hole[], material: string) {
    if (material === SIDING || material === STONE) wallRecords.push({ name, axis, at, lo, hi, bottom, top, thickness, holes });
    const us = uniqueSorted([lo,hi,...holes.flatMap(h => h.slice(0,2))]).filter(u => u >= lo && u <= hi);
    const ys = uniqueSorted([bottom,top,...holes.flatMap(h => h.slice(2))]).filter(y => y >= bottom && y <= top);
    for (let i = 0; i < us.length-1; i++) for (let j = 0; j < ys.length-1; j++) {
      const u = (us[i]+us[i+1])/2, y = (ys[j]+ys[j+1])/2;
      if (holes.some(h => h[0] < u && u < h[1] && h[2] < y && y < h[3])) continue;
      box(name, axis === 'x' ? [u,y,at] : [at,y,u], axis === 'x' ? [us[i+1]-us[i],ys[j+1]-ys[j],thickness] : [thickness,ys[j+1]-ys[j],us[i+1]-us[i]], material);
    }
  }
  function roofPanel(name: string, vertices: Point[], holes: Hole[] = [], topMaterial = ROOF, bottomMaterial = WOOD, thickness = p.roof_thickness) {
    if (holes.length) {
      const x0 = Math.min(...vertices.map(v => v[0])), x1 = Math.max(...vertices.map(v => v[0]));
      const z0 = Math.min(...vertices.map(v => v[2])), z1 = Math.max(...vertices.map(v => v[2]));
      const n = vector(vertices[1]).sub(vector(vertices[0])).cross(vector(vertices[2]).sub(vector(vertices[0]))), a = vertices[0];
      const onPlane = (x: number,z: number): Point => [x,a[1]-(n.x*(x-a[0])+n.z*(z-a[2]))/n.y,z];
      const xs = uniqueSorted([x0,x1,...holes.flatMap(h => h.slice(0,2)).filter(x => x > x0 && x < x1)]);
      const zs = uniqueSorted([z0,z1,...holes.flatMap(h => h.slice(2)).filter(z => z > z0 && z < z1)]);
      for (let i = 0; i < xs.length-1; i++) for (let j = 0; j < zs.length-1; j++) {
        const x = (xs[i]+xs[i+1])/2, z = (zs[j]+zs[j+1])/2;
        if (holes.some(h => h[0] < x && x < h[1] && h[2] < z && z < h[3])) continue;
        const top = [onPlane(xs[i],zs[j]),onPlane(xs[i],zs[j+1]),onPlane(xs[i+1],zs[j+1]),onPlane(xs[i+1],zs[j])];
        plane(name,top,topMaterial); plane(`${name}_soffit`,top.map(([x,y,z]): Point => [x,y-thickness,z]).reverse(),bottomMaterial);
      }
      for (const h of holes) {
        const corners = [onPlane(h[0],h[2]),onPlane(h[1],h[2]),onPlane(h[1],h[3]),onPlane(h[0],h[3])];
        for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i+1)%4]; plane(`${name}_opening_reveal`,[b,a,[a[0],a[1]-thickness,a[2]],[b[0],b[1]-thickness,b[2]]],bottomMaterial); }
      }
    } else {
      plane(name,vertices,topMaterial); plane(`${name}_soffit`,vertices.map(([x,y,z]): Point => [x,y-thickness,z]).reverse(),bottomMaterial);
    }
    for (let i = 0; i < vertices.length; i++) { const a = vertices[i], b = vertices[(i+1)%vertices.length]; plane(`${name}_edge`,[b,a,[a[0],a[1]-thickness,a[2]],[b[0],b[1]-thickness,b[2]]],bottomMaterial); }
  }
  function opening(name: string, axis: Axis, at: number, u: number, y: number, width: number, height: number, door = false) {
    const verts: Point[] = axis === 'x' ? [[u-width/2,y,at],[u-width/2,y+height,at],[u+width/2,y+height,at],[u+width/2,y,at]] : [[at,y,u-width/2],[at,y+height,u-width/2],[at,y+height,u+width/2],[at,y,u+width/2]];
    plane(`${name}_glass`,verts,GLASS);
    function piece(suffix: string, uu: number, yy: number, w: number, h: number, depth: number, mat = WOOD) { box(`${name}_${suffix}`,axis === 'x' ? [uu,yy,at] : [at,yy,uu],axis === 'x' ? [w,h,depth] : [depth,h,w],mat); }
    for (const off of [-width/2,width/2]) { piece('outer_rebate',u+off,y+height/2,p.frame_width+2,height+p.frame_width+2,3,DARK); piece('jamb',u+off,y+height/2,p.frame_width,height+p.frame_width,5); }
    for (const off of [0,height]) piece('rail',u,y+off,width+p.frame_width,p.frame_width,5);
    if (door) {
      for (const off of [-width*.32,width*.32]) piece('stile',u+off,y+height/2,1.5,height,3,DARK);
      piece('handle',u+width*.30,y+38,1,6,7,DARK); piece('threshold',u,y+1,width,2,8,DARK);
    } else if (name.startsWith('front_glazing')) {
      for (const off of [-width*.32,width*.32]) piece('mullion',u+off,y+height/2,2,height,3,DARK);
      for (const edge of [-1,1]) for (const frac of [.25,.5,.75]) piece('sidelight_rail',u+edge*width*.41,y+height*frac,width*.18,1.4,3,DARK);
    } else {
      for (const off of [-width/4,0,width/4]) piece('mullion',u+off,y+height/2,1.2,height,2,DARK);
      for (const off of [height/3,2*height/3]) piece('muntin',u,y+off,width,1.2,2,DARK);
    }
    if (!door) piece('sill',u,y-2,width+8,2.5,8);
  }
  const W = p.main_width, D = p.main_depth, H = W/2, front = -D/2, back = D/2, join = front+p.front_section_depth;
  const floor = p.floor_elevation, fh = floor+p.front_wall_height, rh = floor+p.rear_wall_height, th = p.wall_thickness, ov = p.roof_overhang;
  const fp = p.front_roof_pitch_rise_per_12/12, rp = p.rear_roof_pitch_rise_per_12/12, ridge = fh+H*fp;
  const dw = p.door_width, dh = p.door_height, ww = p.window_width, wh = p.window_height, sy = floor+p.window_sill_height;
  const skylights = new Map<number,Hole[]>();
  function gableRoof(name: string, z0: number, z1: number, eave: number, pitch: number) {
    const peak = eave+H*pitch, xe = H+ov, ye = eave-ov*pitch;
    for (const side of [-1,1]) {
      const x = side*xe, verts: Point[] = [[0,peak,z0-ov],[x,ye,z0-ov],[x,ye,z1+ov],[0,peak,z1+ov]];
      if (side > 0) verts.reverse(); roofPanel(`${name}_${side < 0 ? 'left' : 'right'}`,verts,name === 'front_gable_roof' ? skylights.get(side) : []);
      beam(`${name}_fascia`,[x,ye-1,z0-ov],[x,ye-1,z1+ov],4,DARK); cylinder(`${name}_gutter`,[x,ye-2,z0-ov],[x,ye-2,z1+ov],1.6,DARK);
      for (const z of [z0-ov,z1+ov]) beam(`${name}_barge`,[0,peak,z],[x,ye,z],5,WOOD);
      for (const z of between(z0,z1+1,32)) {
        // The reference's decorative rafters crossed its skylights. Stop them at the real aperture.
        const cuts = (name === 'front_gable_roof' ? skylights.get(side) ?? [] : []).filter(h => z > h[2]-2 && z < h[3]+2)
          .map(h => [Math.max(0,Math.min(Math.abs(h[0]),Math.abs(h[1]))-3),Math.min(xe,Math.max(Math.abs(h[0]),Math.abs(h[1]))+3)]);
        const ends = uniqueSorted([0,xe,...cuts.flat()]);
        for (let i = 0; i < ends.length-1; i++) {
          const a = ends[i], b = ends[i+1]; if (cuts.some(([lo,hi]) => lo < (a+b)/2 && (a+b)/2 < hi)) continue;
          beam(`${name}_rafter`,[side*a,peak-5-a*pitch,z],[side*b,peak-5-b*pitch,z],3,WOOD);
        }
      }
    }
    for (const z of between(z0-ov,z1+ov,12)) cylinder(`${name}_ridge_cap`,[0,peak,z],[0,peak,Math.min(z+11.6,z1+ov)],2.5,ROOF);
  }
  function hipRoof(name: string, x0: number, x1: number, z0: number, z1: number, eave: number, pitch: number) {
    const xm = (x0+x1)/2, run = (x1-x0)/2, peak = eave+run*pitch;
    const vertices: Point[] = [[x0,eave,z0],[x1,eave,z0],[x1,eave,z1],[x0,eave,z1],[xm,peak,z0+run],[xm,peak,z1-run]];
    [[0,4,1],[1,4,5,2],[2,5,3],[3,5,4,0]].forEach((face,i) => roofPanel(`${name}_slope_${i}`,face.map(j => vertices[j])));
    for (const [a,b] of [[0,1],[1,2],[2,3],[3,0]]) cylinder(`${name}_gutter`,vertices[a],vertices[b],1.4,DARK);
    for (const [a,b] of [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,5],[3,5],[4,5]]) beam(`${name}_trim`,vertices[a],vertices[b],3,DARK);
  }

  box('main_floor_slab',[0,floor/2,0],[W,floor,D],STONE);
  for (const side of [-1,1]) box('side_walkway',[side*(H+p.walkway_width/2),2,0],[p.walkway_width,4,D+2*p.walkway_width],PAVING);
  for (const z of [front-p.walkway_width/2,back+p.walkway_width/2]) box('end_walkway',[0,2,z],[W,4,p.walkway_width],PAVING);
  const gw = (W-p.chimney_width-72)/2, gy = floor+6, gh = p.front_glazing_height;
  const centers = [-1,1].map(s => s*(p.chimney_width/2+18+gw/2));
  wall('front_wall','x',front,-H,H,floor,fh,th,centers.map(x => [x-gw/2,x+gw/2,gy,gy+gh]),SIDING);
  centers.forEach((x,i) => opening(`front_glazing_${i}`,'x',front-4,x,gy,gw,gh));
  for (const s of [-1,1]) {
    const postX = s*(p.chimney_width/2+6); beam('front_chimney_post',[postX,floor,front-6],[postX,ridge-Math.abs(postX)*fp,front-6],6,DARK);
    const inner = p.chimney_width/2+14, outer = H-42, yb = fh+4, yi = ridge-inner*fp-8, yo = ridge-outer*fp-8;
    for (const [a,b] of [[0,inner],[outer,H]]) {
      const vertices: Point[] = [[s*a,fh,front],[s*b,fh,front],[s*b,ridge-b*fp,front],[s*a,ridge-a*fp,front]];
      if (s > 0) vertices.reverse(); plane('gable_side_panel',vertices,SIDING);
    }
    for (const vertices of [ [[s*inner,fh,front],[s*outer,fh,front],[s*outer,fh+4,front],[s*inner,fh+4,front]], [[s*inner,yi,front],[s*outer,yo,front],[s*outer,yo+8,front],[s*inner,yi+8,front]] ] as Point[][]) {
      if (s > 0) vertices.reverse(); plane('gable_glazing_surround',vertices,SIDING);
    }
    const z = front-5, vertices: Point[] = [[s*inner,yb,z],[s*outer,yb,z],[s*outer,yo,z],[s*inner,yi,z]];
    if (s > 0) vertices.reverse(); plane(`front_clerestory_${s}`,vertices,GLASS);
    for (let k = 0; k < 4; k++) beam('clerestory_frame',vertices[k],vertices[(k+1)%4],p.frame_width,WOOD);
    for (let k = 1; k < 5; k++) { const x = inner+(outer-inner)*k/5; beam('clerestory_mullion',[s*x,yb,z-1],[s*x,ridge-x*fp-8,z-1],1.3,DARK); }
    const railY = yb+Math.max(2,(yo-yb)*.45); beam('clerestory_horizontal',[s*inner,railY,z-1],[s*outer,railY,z-1],1.3,DARK);
    beam('front_crossbeam',[s*inner,fh-2,z-2],[s*outer,fh-2,z-2],7,DARK);
  }
  const rearCenters = [-W*.29,W*.29];
  wall('rear_wall','x',back,-H,H,floor,rh,th,[[-dw/2,dw/2,floor,floor+dh],...rearCenters.map((x): Hole => [x-ww/2,x+ww/2,sy,sy+wh])],SIDING);
  opening('rear_door','x',back+4,0,floor,dw,dh,true); rearCenters.forEach((x,i) => opening(`rear_window_${i}`,'x',back+4,x,sy,ww,wh));
  plane('rear_gable',[[-H,rh,back],[H,rh,back],[0,rh+H*rp,back]],SIDING);
  for (const s of [-1,1]) {
    for (const [section,z0,z1,top] of [['front',front,join,fh],['rear',join,back,rh]] as const) {
      const u = (z0+z1)/2, holes: Hole[] = [[u-ww/2,u+ww/2,sy,sy+wh]];
      if (section === 'front') { const passage = join-36; holes.push([passage-dw/2,passage+dw/2,floor,floor+dh]); }
      wall(`main_side_${s}_${section}`,'z',s*H,z0,z1,floor,top,th,holes,SIDING); opening(`main_side_window_${s}_${section}`,'z',s*(H+4),u,sy,ww,wh);
    }
    for (const z of [front,join,back]) beam('main_corner_post',[s*(H+2),floor,z],[s*(H+2),z >= join ? rh : fh,z],5,DARK);
  }
  wall('roof_step','x',join,-H,H,fh,rh,th,[],SIDING); plane('step_gable',[[-H,rh,join],[0,rh+H*rp,join],[H,rh,join]],SIDING);
  for (const side of [-1,1]) {
    const x = side*H*.55;
    skylights.set(side,[.28,.73].map(fraction => { const z = front+(join-front)*fraction; return [x-p.skylight_width/2+1,x+p.skylight_width/2-1,z-p.skylight_length/2+1,z+p.skylight_length/2-1]; }));
  }
  gableRoof('front_gable_roof',front,join,fh,fp); gableRoof('rear_gable_roof',join,back,rh,rp);
  const cy = ridge+p.chimney_above_ridge;
  box('front_stone_chimney',[0,(floor+cy)/2,front-p.chimney_depth/2],[p.chimney_width,cy-floor,p.chimney_depth],STONE);
  box('chimney_cap',[0,cy+2,front-p.chimney_depth/2],[p.chimney_width+6,4,p.chimney_depth+6],DARK);
  for (const side of [-1,1]) for (const [j,fraction] of [.28,.73].entries()) {
    const x = side*H*.55, z = front+(join-front)*fraction, sw = p.skylight_width, sl = p.skylight_length;
    const corners: Point[] = [[x-sw/2,z-sl/2],[x+sw/2,z-sl/2],[x+sw/2,z+sl/2],[x-sw/2,z+sl/2]].map(([xx,zz]) => [xx,ridge-Math.abs(xx)*fp+3,zz]);
    corners.reverse(); plane(`skylight_${side}_${j}`,corners,GLASS);
    for (let k = 0; k < 4; k++) { const a = corners[k], b = corners[(k+1)%4]; beam('skylight_frame',a,b,3,DARK); plane('skylight_curb',[a,b,[b[0],b[1]-p.roof_thickness-4,b[2]],[a[0],a[1]-p.roof_thickness-4,a[2]]],DARK); }
  }
  const wd = p.wing_depth, wingWidth = p.wing_width, wz0 = -wd/2, wz1 = wd/2, split = wz0+p.porch_depth, wt = floor+p.wing_wall_height;
  for (const s of [-1,1]) {
    const x0 = s > 0 ? H : -H-wingWidth, x1 = s > 0 ? H+wingWidth : -H, xc = (x0+x1)/2, outer = s*(H+wingWidth);
    box(`wing_floor_${s}`,[xc,floor/2,0],[wingWidth,floor,wd],STONE);
    for (const x of between(x0,x1,6)) { const width = Math.min(5.8,x1-x); box(`porch_deck_${s}`,[x+width/2,floor+1,(wz0+split)/2],[width,2,p.porch_depth],'porch_deck'); }
    box(`porch_step_${s}`,[xc,floor/2,wz0-6],[wingWidth,6,12],STONE);
    const wingWW = Math.min(48,ww), wingSY = floor+44, wingWH = 24, uz = (split+wz1)/2;
    wall(`wing_outer_${s}`,'z',outer,split,wz1,floor,wt,th,[[uz-wingWW/2,uz+wingWW/2,wingSY,wingSY+wingWH]],STONE);
    opening(`wing_outer_window_${s}`,'z',outer+s*4,uz,wingSY,wingWW,wingWH);
    wall(`wing_back_${s}`,'x',wz1,x0,x1,floor,wt,th,[[xc-18,xc+18,sy,sy+36]],STONE); opening(`wing_back_window_${s}`,'x',wz1+4,xc,sy,36,36);
    wall(`wing_entry_${s}`,'x',split,x0,x1,floor,wt,th,[[xc-dw/2,xc+dw/2,floor,floor+dh]],STONE); opening(`wing_entry_door_${s}`,'x',split-4,xc,floor,dw,dh,true);
    hipRoof(`wing_hip_roof_${s}`,x0-ov,x1+ov,wz0-ov,wz1+ov,wt,p.wing_roof_pitch_rise_per_12/12);
    for (const z of [wz0-ov+3,wz1+ov-3]) { const gx = outer+s*(ov-3); cylinder(`wing_downspout_${s}`,[gx,wt-1,z],[gx,8,z],1.3,DARK); cylinder(`wing_downspout_elbow_${s}`,[gx,8,z],[gx+s*8,4,z],1.3,DARK); }
    for (const z of [wz0+4,split,wz1-4]) { beam('porch_post',[outer,floor,z],[outer,wt,z],5,DARK); beam('porch_brace',[outer,wt-24,z],[outer,wt,z+20],3,DARK); box('porch_post_foot_shoe',[outer,floor+2,z],[6.2,4,6.2],DARK); }
    box('wing_outer_paving',[s*(H+wingWidth+p.walkway_width/2),2,0],[p.walkway_width,4,wd+60],PAVING);
    for (const z of [wz0-15,wz1+15]) box('wing_end_paving',[xc,2,z],[wingWidth,4,30],PAVING);
  }
  for (const x of [-H,-W*.15,W*.15,H]) beam('rear_vertical_timber',[x,floor,back+5],[x,rh,back+5],4,DARK);
  for (const s of [-1,1]) { beam('rear_diagonal',[s*W*.15,floor+18,back+5],[s*W*.25,rh-10,back+5],2,DARK); beam('rear_diagonal',[s*W*.25,floor+18,back+5],[s*W*.15,rh-10,back+5],2,DARK); }
  const pw = p.walkway_width, mx = H+pw, wx = H+wingWidth+pw, mz = D/2+pw, wz = wd/2+pw;
  const border = [[-mx,-mz],[mx,-mz],[mx,-wz],[wx,-wz],[wx,wz],[mx,wz],[mx,mz],[-mx,mz],[-mx,wz],[-wx,wz],[-wx,-wz],[-mx,-wz]];
  border.forEach(([x,z],i) => { const [nx,nz] = border[(i+1)%border.length]; beam('paving_perimeter_edging',[x,4.6,z],[nx,4.6,nz],1.6,WOOD); });

  if (p.interior_enabled) {
    const lining = p.interior_lining_thickness, pt = p.partition_thickness, hall = p.hall_width;
    function inward(record: WallRecord) {
      if (record.name === 'front_wall' || record.name === 'roof_step' || record.name.startsWith('wing_entry')) return 1;
      if (record.name === 'rear_wall' || record.name.startsWith('wing_back')) return -1;
      return record.at > 0 ? -1 : 1;
    }
    for (const w of wallRecords) wall(`interior_${w.name}`,w.axis,w.at+inward(w)*(w.thickness/2+lining/2),w.lo,w.hi,w.bottom,w.top,lining,w.holes,PLASTER);
    // Interior finishes mirror exterior gables and retain the upper-glazing apertures.
    for (const original of [...parts.values()].filter(m => ['gable_side_panel','gable_glazing_surround','rear_gable','step_gable'].includes(m.name))) {
      const copy: Part = { ...original, name: `interior_${original.name}`, material: PLASTER, positions: [...original.positions], normals: original.normals.map(n => -n), uv: [...original.uv], indices: [] };
      for (let i = 2; i < copy.positions.length; i += 3) copy.positions[i] += (original.name === 'rear_gable' ? -1 : 1)*(th/2+lining);
      for (let i = 0; i < original.indices.length; i += 3) copy.indices.push(original.indices[i],original.indices[i+2],original.indices[i+1]);
      parts.set(`${copy.name}:${PLASTER}`,copy);
    }
    box('interior_main_finished_floor',[0,floor+.375,0],[W-th-2*lining,.75,D-th-2*lining],'interior_oak_floor');
    for (const side of [-1,1]) {
      const xc = side*(H+wingWidth/2); box(`interior_wing_floor_${side}`,[xc,floor+.4,(split+wz1)/2],[wingWidth-th-2*lining,.8,wz1-split-th-2*lining],'wing_interior_tile');
      box(`interior_wing_ceiling_${side}`,[xc,wt-1,(split+wz1)/2],[wingWidth-th-2*lining,1,wz1-split-th-2*lining],PLASTER);
    }
    for (const [section,z0,z1,eave,pitch] of [['front',front+th/2,join,fh,fp],['rear',join,back-th/2,rh,rp]] as const) {
      const ceilingRidge = eave+H*pitch-p.roof_thickness-2, half = H-th/2-lining;
      for (const side of [-1,1]) {
        const x = side*half, vertices: Point[] = [[0,ceilingRidge,z0],[x,ceilingRidge-half*pitch,z0],[x,ceilingRidge-half*pitch,z1],[0,ceilingRidge,z1]];
        if (side > 0) vertices.reverse(); roofPanel(`interior_vaulted_ceiling_${section}_${side}`,vertices,section === 'front' ? skylights.get(side) : [],PLASTER,PLASTER,.5);
      }
    }
    const rearPartition = join+12, doorBottom = floor+.8, doorTop = doorBottom+dh, roomDoor = (rearPartition+back-th)/2;
    wall('interior_living_rear_partition','x',rearPartition,-H+th/2,H-th/2,doorBottom,floor+p.partition_height,pt,[[-hall/2,hall/2,doorBottom,doorTop]],PLASTER);
    for (const side of [-1,1]) {
      wall(`interior_hall_wall_${side}`,'z',side*hall/2,rearPartition,back-th/2,doorBottom,floor+p.partition_height,pt,[[roomDoor-dw/2,roomDoor+dw/2,doorBottom,doorTop]],PLASTER);
      for (const dz of [-dw/2,dw/2]) box('interior_hall_door_trim',[side*hall/2,doorBottom+dh/2,roomDoor+dz],[pt+2,dh,2.5],WOOD);
      box('interior_hall_door_trim',[side*hall/2,doorTop,roomDoor],[pt+2,2.5,dw+2.5],WOOD);
    }
    for (const x of [-hall/2,hall/2]) box('interior_living_opening_trim',[x,doorBottom+dh/2,rearPartition],[2.5,dh,pt+2],WOOD);
    box('interior_living_opening_trim',[0,doorTop,rearPartition],[hall+2.5,2.5,pt+2],WOOD);
    for (const w of wallRecords) {
      if (w.name === 'roof_step') continue;
      const coord = w.at+inward(w)*(w.thickness/2+lining+.4), cuts = uniqueSorted([w.lo,w.hi,...w.holes.filter(h => h[2] <= floor+1).flatMap(h => h.slice(0,2))]);
      for (let i = 0; i < cuts.length-1; i++) {
        const a = cuts[i], b = cuts[i+1]; if (w.holes.some(h => h[0] < (a+b)/2 && (a+b)/2 < h[1] && h[2] <= floor+1)) continue;
        box('interior_baseboard',w.axis === 'x' ? [(a+b)/2,floor+3,coord] : [coord,floor+3,(a+b)/2],w.axis === 'x' ? [b-a,4,.6] : [.6,4,b-a],WOOD);
      }
    }
  }

  const root = new Group(); root.name = 'cottage_draft';
  const scale = .0254*p.overall_scale;
  const summary: GeneratedModelBundle['parts'] = []; let vertexCount = 0, triangleCount = 0;
  for (const part of parts.values()) {
    if (!part.indices.length) continue;
    const geometry = new BufferGeometry(), colors: number[] = [];
    let woodAxis = 1, woodUAxis = 2;
    if (part.material === WOOD || part.name.startsWith('porch_deck')) {
      const span = [0,1,2].map(axis => { const values = part.positions.filter((_,i) => i%3 === axis); return Math.max(...values)-Math.min(...values); });
      woodAxis = span.indexOf(Math.max(...span)); woodUAxis = (woodAxis+1)%3;
    }
    for (let i = 0; i < part.positions.length; i += 3) {
      const [x,y,z] = part.positions.slice(i,i+3), vertical = Math.abs(part.normals[i+1]) < .5;
      let shade = 0;
      if (!part.name.startsWith('interior_') && part.material !== GLASS) {
        let roofHeight = z < join ? fh+(H-Math.abs(x))*fp : rh+(H-Math.abs(x))*rp;
        if (Math.abs(x) > H+3 && Math.abs(z) < wd/2+ov) roofHeight = wt+Math.max(0,Math.min(H+wingWidth+ov-Math.abs(x),wd/2+ov-Math.abs(z)))*p.wing_roof_pitch_rise_per_12/12;
        if (vertical) shade = .55*Math.exp(-Math.max(roofHeight-y,0)/20)+.14*Math.exp(-Math.max(y-floor,0)/8);
        if (part.name.startsWith('porch_deck')) shade += .25;
        if (part.name.includes('rebate') || part.name.includes('opening_reveal')) shade += .15;
        if (part.name.startsWith('front_gable_roof') && !['_soffit','_edge','_rafter'].some(suffix => part.name.includes(suffix))) shade += .35*Math.exp(-Math.abs(z-(join-ov))/14);
      }
      const c = Math.max(.65,Math.min(1,1-p.contact_shading_strength*shade)); colors.push(c,c,c);
      if (part.material === WOOD || part.name.startsWith('porch_deck')) { part.uv[i/3*2] = part.positions[i+woodUAxis]/96; part.uv[i/3*2+1] = part.positions[i+woodAxis]/96; }
    }
    geometry.setAttribute('position',new Float32BufferAttribute(part.positions.map(n => n*scale),3));
    geometry.setAttribute('normal',new Float32BufferAttribute(part.normals,3)); geometry.setAttribute('uv',new Float32BufferAttribute(part.uv,2));
    geometry.setAttribute('color',new Float32BufferAttribute(colors,3)); geometry.setIndex(part.indices); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const node = new Mesh(geometry,materialSet.byId[part.material]); node.name = part.name;
    node.userData = { builderPartId: part.name, builderMaterialId: part.material, provisionalInterior: part.name.startsWith('interior_') };
    node.castShadow = part.material !== GLASS; node.receiveShadow = part.material !== GLASS; root.add(node);
    const count = part.positions.length/3, triangles = part.indices.length/3; vertexCount += count; triangleCount += triangles;
    summary.push({ id: part.name, name: part.name, materialId: part.material, vertexCount: count, triangleCount: triangles });
  }
  const bounds = new Box3().setFromObject(root), size = bounds.getSize(new Vector3()); let disposed = false;
  const identity: GeneratedModelBundle['identity'] = { id: 'threed-cottage-ts', version: '0.24.0-alpha.1', rng: 'mulberry32-v1', seed: p.seed, sourceUnits: 'inches', outputUnits: 'metres', draft: true };
  root.userData = { generator: identity, parameters: p, front: 'negative Z', interior: 'provisional ground-floor shell', glassMode: 'single alpha-blended double-sided panes', shading: 'non-directional contact only' };
  return {
    root, parameters: p, identity, materials: materialSet.recipes, textures: materialSet.textures, parts: summary,
    bounds: { min: point(bounds.min), max: point(bounds.max), size: point(size) },
    stats: { meshCount: summary.length, vertexCount, triangleCount, texturePixels: materialSet.textures.reduce((sum,t) => sum+t.width*t.height,0) },
    dispose() { if (disposed) return; disposed = true; root.traverse(node => { if (node instanceof Mesh) node.geometry.dispose(); }); materialSet.dispose(); root.clear(); },
  };
}
