import { Matrix4, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';
import type { CollisionRegion } from './environment-region-selection';
import type { EnvironmentSurfaceCollider } from './environment-surface-collider';
interface Source { mesh: Mesh; transform: Matrix4; }
export interface EnvironmentRegion extends CollisionRegion {
  /** Nearby meshes share a region; positions remain in original geometry. */
  parts: Array<{ source: Source; offsets: Uint32Array }>;
}
export interface EnvironmentRegionIndex { regions: EnvironmentRegion[]; triangleCount: number; referenceBytes: number; }
/** Incremental preparation: caller advances at most one bounded batch per frame. */
export function* indexEnvironmentRegions(root: Object3D, body: Object3D): Generator<void, EnvironmentRegionIndex, void> {
  root.updateWorldMatrix(true,true);
  const inverse = body.matrixWorld.clone().invert();
  const sources: Source[] = [];
  let total = 0;
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const position = object.geometry.getAttribute('position');
    const count = object.geometry.index?.count ?? position?.count ?? 0;
    if (object instanceof SkinnedMesh || !position || count < 3 || count % 3) throw new Error('Unsupported Environment topology');
    total += count / 3;
    sources.push({mesh:object,transform:new Matrix4().multiplyMatrices(inverse,object.matrixWorld)});
  });
  if (!total || total > 3_000_000) throw new Error('Environment index triangle budget exceeded');
  const regions: EnvironmentRegion[] = [];
  const openRegions = new Map<string, EnvironmentRegion>();
  const tileSequence = new Map<string, number>();
  const points = [new Vector3(),new Vector3(),new Vector3()];
  let processed = 0;
  let references = 0;
  for (const source of sources) {
    const geometry = source.mesh.geometry;
    const position = geometry.getAttribute('position');
    const index = geometry.index;
    const count = index?.count ?? position.count;
    const buckets = new Map<string,{ offsets:number[]; min:[number,number,number]; max:[number,number,number] }>();
    for(let offset=0;offset<count;offset+=3) {
      for(let corner=0;corner<3;corner++) {
        const vertex=index ? index.getX(offset+corner) : offset+corner;
        if(!Number.isInteger(vertex)||vertex<0||vertex>=position.count) throw new Error('Invalid Environment index');
        source.mesh.getVertexPosition(vertex,points[corner]);points[corner].applyMatrix4(source.transform);
        if(![points[corner].x,points[corner].y,points[corner].z].every(n=>Number.isFinite(n)&&Math.abs(n)<=1_000_000)) throw new Error('Invalid Environment coordinate');
      }
      // Assign once by centroid; expanded actual bounds preserve spanning faces.
      const x=Math.floor((points[0].x+points[1].x+points[2].x)/3/8);
      const z=Math.floor((points[0].z+points[1].z+points[2].z)/3/8);
      const key=`${x}:${z}`;
      let bucket=buckets.get(key);
      if(!bucket) {
        bucket={offsets:[],min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};buckets.set(key,bucket);
      }
      bucket.offsets.push(offset);
      for(const point of points) for(let axis=0;axis<3;axis++) {
        const value=point.getComponent(axis);bucket.min[axis]=Math.min(bucket.min[axis],value);bucket.max[axis]=Math.max(bucket.max[axis],value);
      }
      if(++processed%2048===0) yield;
    }
    for(const [key,bucket] of buckets) {
      // Pack fragments from different meshes into the same spatial region.
      for(let start=0;start<bucket.offsets.length;) {
        let region = openRegions.get(key);
        if (!region || region.triangleCount === 8192) {
          const sequence = tileSequence.get(key) ?? 0;
          tileSequence.set(key, sequence + 1);
          region = { id: `tile:${key}:${sequence}`, parts: [], min: [Infinity,Infinity,Infinity], max: [-Infinity,-Infinity,-Infinity], triangleCount: 0 };
          openRegions.set(key,region); regions.push(region);
          if(regions.length>50_000) throw new Error('Environment region budget exceeded');
        }
        const length = Math.min(8192-region.triangleCount,bucket.offsets.length-start);
        const offsets = new Uint32Array(bucket.offsets.slice(start,start+length));
        region.parts.push({source,offsets});region.triangleCount+=length;references+=length;start+=length;
        for(let axis=0;axis<3;axis++) {
          (region.min as [number,number,number])[axis]=Math.min(region.min[axis],bucket.min[axis]);
          (region.max as [number,number,number])[axis]=Math.max(region.max[axis],bucket.max[axis]);
        }
      }
    }
    yield;
  }
  return {regions,triangleCount:total,referenceBytes:references*4};
}
/** Allocates triangle buffers only for one selected region. */
export function extractEnvironmentRegion(region: EnvironmentRegion): EnvironmentSurfaceCollider {
  if(region.triangleCount>8192 || region.parts.reduce((n,part)=>n+part.offsets.length,0)!==region.triangleCount) throw new Error('Environment extraction budget exceeded');
  const vertices=new Float32Array(region.triangleCount*9);
  const indices=new Uint32Array(region.triangleCount*3);
  const point=new Vector3();
  let cursor=0;
  for(const part of region.parts) {
  const geometry=part.source.mesh.geometry;
  const position=geometry.getAttribute('position');
  const index=geometry.index;
  for(const offset of part.offsets) for(let corner=0;corner<3;corner++) {
    const vertex=index ? index.getX(offset+corner) : offset+corner;
    if(!Number.isInteger(vertex)||vertex<0||vertex>=position.count) throw new Error('Environment geometry changed');
    part.source.mesh.getVertexPosition(vertex,point);point.applyMatrix4(part.source.transform);
    if(![point.x,point.y,point.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=1_000_000)) throw new Error('Invalid Environment extraction');
    vertices[cursor*3]=point.x;vertices[cursor*3+1]=point.y;vertices[cursor*3+2]=point.z;indices[cursor]=cursor;cursor++;
  }
  }
  return {vertices,indices};
}
