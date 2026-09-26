'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { TrimeshCollider, useRapier } from '@react-three/rapier';
import { Euler, Quaternion, Vector3 } from 'three';
import { extractEnvironmentRegion, type EnvironmentRegionIndex } from '@/libraries/services/threed/models/environment-region-index';
import { selectEnvironmentCollisionRegions, type CollisionActor } from '@/libraries/services/threed/models/environment-region-selection';
import type { EnvironmentSurfaceCollider } from '@/libraries/services/threed/models/environment-surface-collider';

/** Geometry belongs to the existing fixed Environment body; no additional bodies. */
export function EnvironmentRegionColliders({ index, enabled, physicsDebug, markerId, position, rotation, onReady }: {
 index: EnvironmentRegionIndex; enabled: boolean; physicsDebug: boolean; markerId: string;
 onReady: (ready: boolean) => void;
 position: [number,number,number]; rotation: [number,number,number];
}) {
 const {world}=useRapier();
 const [active,setActive]=useState<Map<string,EnvironmentSurfaceCollider>>(new Map());
 const [complete,setComplete]=useState(false);
 useEffect(()=>{onReady(complete && active.size>0);},[active,complete,onReady]);
 const cache=useRef(new Map<string,EnvironmentSurfaceCollider>());
 const elapsed=useRef(1);
 const previous=useRef(new Set<string>());
 const inverse=useMemo(()=>new Quaternion().setFromEuler(new Euler(...rotation)).invert(),[rotation[0],rotation[1],rotation[2]]);
 const byId=useMemo(()=>new Map(index.regions.map(region=>[region.id,region])),[index]);
 const lastDeferred=useRef(0);
 const reportPending=useRef(true);
 useEffect(()=>{reportPending.current=true;},[physicsDebug]);
 useEffect(()=>{cache.current.clear();previous.current.clear();setActive(new Map());setComplete(false);elapsed.current=1;},[index]);
 useFrame((_,delta)=>{
  if(!enabled)return;
  elapsed.current+=delta;if(elapsed.current<0.2)return;elapsed.current=0;
  const actors:CollisionActor[]=[];
  world.forEachRigidBody(body=>{
   if(!body.isEnabled() || (!body.isDynamic() && !body.isKinematic()))return;
   const p=body.translation();const v=body.linvel();
   const local=new Vector3(p.x-position[0],p.y-position[1],p.z-position[2]).applyQuaternion(inverse);
   actors.push({position:[local.x,local.y,local.z],speed:Math.hypot(v.x,v.y,v.z)});
  });
  const selection=selectEnvironmentCollisionRegions(index.regions,actors,previous.current);
  setComplete(selection.deferredIds.length===0);
  const next=new Map<string,EnvironmentSurfaceCollider>();
  try {
  for(const id of selection.activeIds){
   let geometry=cache.current.get(id);
   if(!geometry){const region=byId.get(id);if(!region)continue;geometry=extractEnvironmentRegion(region);}
   next.set(id,geometry);
  }
  } catch {setComplete(false);onReady(false);return;}
  // Only active regions own buffers: don't retain a full-map visited-region cache.
  cache.current=next;
  const changed=next.size!==previous.current.size || [...next.keys()].some(id=>!previous.current.has(id));
  previous.current=new Set(next.keys());if(changed)setActive(next);
  if(physicsDebug && (changed || reportPending.current || selection.deferredIds.length!==lastDeferred.current))console.debug('[ThreeD Environment Regions]',{markerId,collisionMode:'triangle-regions',regionCount:next.size,activeTriangles:selection.triangleCount,deferredRegions:selection.deferredIds.length,referenceBytes:index.referenceBytes,actorCount:actors.length,fallbackRequired:selection.deferredIds.length>0});
  reportPending.current=false;
  if(selection.deferredIds.length && selection.deferredIds.length!==lastDeferred.current)console.warn('[ThreeD Environment Regions] Nearby triangle budget exceeded',{markerId,deferredRegions:selection.deferredIds.length});
  lastDeferred.current=selection.deferredIds.length;
 });
 return <>{[...active].map(([id,geometry])=><TrimeshCollider key={id} args={[geometry.vertices,geometry.indices]} />)}</>;
}
