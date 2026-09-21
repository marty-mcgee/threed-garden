import assert from 'node:assert/strict';
// @ts-ignore Native TypeScript source extension.
import { bedPlantingGeometry, bedLocalPoint, containBedPlantings, assignedBedPlantings, resolvePlantingBedId } from '../services/threed/beds/bed-planting-bounds.ts';
const bed = bedPlantingGeometry({x:10,y:2,z:-4}, {widthFeet:4,lengthFeet:8,heightFeet:1,scale:2,rotation:90});
const placed = containBedPlantings(bed,[{x:100,y:-20,z:100},{x:101,y:-20,z:100}]);
assert.equal(placed[0].y,4.01);
for (const point of placed) {
  const local = bedLocalPoint(bed,point);
  assert(Math.abs(local.x)<=3.99+1e-8);
  assert(Math.abs(local.z)<=7.99+1e-8);
}
assert(Math.abs(Math.hypot(placed[1].x-placed[0].x,placed[1].z-placed[0].z)-1)<1e-8);
assert.throws(()=>containBedPlantings(bed,[{x:0,y:0,z:0},{x:100,y:0,z:100}]),/does not fit/);
assert.throws(()=>containBedPlantings(bed,[{x:NaN,y:0,z:0}]),/Invalid/);
const resting = containBedPlantings(bed,placed);
assert.deepEqual(resting,placed);
assert.deepEqual(containBedPlantings(bed,[]),[]);
console.log('PASS: Rotated/scaled Bed containment, top surface, preserved spacing, overflow, invalid positions and repeat placement');

const collection = [{type:'plantings',data:{bedId:2},isActive:true},{type:'plantings',data:{bedId:2},isActive:false},{type:'plantings',data:{bedId:3},isActive:true},{type:'beds',data:{id:2}}];
assert.deepEqual(assignedBedPlantings(2,collection),[collection[0]]);
assert.deepEqual(assignedBedPlantings(undefined,collection),[]);
// @ts-ignore Native TypeScript source extension.
const {buildThreeDRuntimeMarkerResult} = await import('../services/threed/markers/runtime-marker-builder.ts');
const raw = {plants:[],characters:[],layers:[],farmbots:[],models:[],tasks:[],harvests:[],weatherLogs:[],beds:[{id:2,name:'Raised Bed',widthFeet:4,lengthFeet:8,heightFeet:1,positionX:10,positionY:2,positionZ:-4}],plantings:[{id:7,name:'Carrot',bedId:2,positionX:10,positionY:0,positionZ:-4},{id:8,name:'Unassigned',positionX:20,positionY:0,positionZ:0}]};
const result=buildThreeDRuntimeMarkerResult(raw);
assert.equal(result.markers.find(marker=>marker.id==='plantings-7')?.position.y,3.01);
assert.equal(result.markers.find(marker=>marker.id==='plantings-8')?.position.y,0);
assert(result.issues.some(issue=>issue.markerId==='plantings-7' && issue.outcome==='recovered'));
console.log('PASS: Active assignment identity/count, runtime legacy-height recovery and unchanged unassigned Plantings');

// Bed edits preserve local root offsets through translation, elevation and rotation.
// @ts-ignore Native TypeScript source extension.
const {bedWorldPoint} = await import('../services/threed/beds/bed-planting-bounds.ts');
const movedBed=bedPlantingGeometry({x:-20,y:7,z:30},{widthFeet:4,lengthFeet:8,heightFeet:2,scale:2,rotation:180});
const carried=placed.map(point=>bedWorldPoint(movedBed,bedLocalPoint(bed,point)));
const moved=containBedPlantings(movedBed,carried);
for (let index=0;index<moved.length;index++) {
  const before=bedLocalPoint(bed,placed[index]),after=bedLocalPoint(movedBed,moved[index]);
  assert(Math.abs(before.x-after.x)<1e-8 && Math.abs(before.z-after.z)<1e-8);
  assert.equal(moved[index].y,11.01);
}
const smaller=bedPlantingGeometry({x:0,y:0,z:0},{widthFeet:0.5,lengthFeet:0.5,heightFeet:0.3});
assert.throws(()=>containBedPlantings(smaller,carried),/does not fit/);
console.log('PASS: Bed movement carries local offsets, sets new top height and rejects incompatible resize');
const overflowRaw = {...raw,plantings:[{id:7,bedId:2,positionX:-100,positionY:0,positionZ:0},{id:9,bedId:2,positionX:100,positionY:0,positionZ:0}]};
const overflowResult=buildThreeDRuntimeMarkerResult(overflowRaw);
assert(overflowResult.issues.some(issue=>issue.outcome==='review'));
const roots=overflowResult.markers.filter(marker=>marker.type==='plantings');
assert.equal(roots[0].position.y,3.01);
assert(Math.abs(roots[0].position.x-8.01)<1e-8);
assert(Math.abs(roots[1].position.x-11.99)<1e-8);
console.log('PASS: Oversized legacy layout contains individual roots and requests review');

// @ts-ignore Native TypeScript source extension.
import { parseUpdateProjectPlantingPlacement } from '../services/threed/plantings/project-planting-placement-core.ts';
const edit = {markerType:'plantings',modelScale:1,positionX:0,positionY:0,positionZ:0};
assert.equal(parseUpdateProjectPlantingPlacement(edit).bedId,undefined);
assert.equal(parseUpdateProjectPlantingPlacement({...edit,bedId:null}).bedId,null);
assert.equal(parseUpdateProjectPlantingPlacement({...edit,bedId:7}).bedId,7);
assert.throws(()=>parseUpdateProjectPlantingPlacement({...edit,bedId:-1}));
assert.equal(resolvePlantingBedId({},3),3);
assert.equal(resolvePlantingBedId({bedId:null},3),null);
assert.equal(resolvePlantingBedId({bedId:7},3),7);
assert.throws(()=>resolvePlantingBedId({bedId:0},3));
console.log('PASS: Project Bed override, explicit unassignment, omission compatibility and invalid assignments');

const neighborRaw = {...raw, plantings:[
  {id:7,name:'Neighbor',bedId:2,positionX:11.99,positionY:3.01,positionZ:-4},
  {id:9,name:'Reassigned',bedId:2,positionX:12.5,positionY:0,positionZ:-4},
]};
const neighbors=buildThreeDRuntimeMarkerResult(neighborRaw).markers;
assert.deepEqual(neighbors.find(marker=>marker.id==='plantings-7')?.position,{x:11.99,y:3.01,z:-4},'A changed Planting must not shift a valid neighbor');
assert.equal(neighbors.find(marker=>marker.id==='plantings-9')?.position.x,11.99);
console.log('PASS: One out-of-bounds Planting recovers without moving an already valid neighbor');

// Unassignment must not change another root by switching layout recovery modes.
const beforeUnassign=buildThreeDRuntimeMarkerResult(overflowRaw).markers;
const afterUnassign=buildThreeDRuntimeMarkerResult({...overflowRaw,plantings:overflowRaw.plantings.map(planting=>planting.id===7 ? {...planting,bedId:null}:planting)}).markers;
assert.deepEqual(afterUnassign.find(marker=>marker.id==='plantings-9')?.position,beforeUnassign.find(marker=>marker.id==='plantings-9')?.position);
assert.equal(afterUnassign.find(marker=>marker.id==='plantings-7')?.position.x,-100);
console.log('PASS: Unassignment leaves other Planting positions unchanged across oversized-layout recovery');
const savedPlantings = overflowRaw.plantings.map((planting,index)=>({
  id:index+101, markerType:'plantings', sourceAssetId:planting.id, markerId:`plantings-${planting.id}`,
  name:`Planting ${planting.id}`,positionX:planting.positionX,positionY:planting.positionY,positionZ:planting.positionZ,
  positionSource:'asset' as const,color:'#22c55e',icon:'🌱',label:'Planting',isVisible:true,isActive:true,data:{...planting},metadata:{},
}));
const snapshotBefore=buildThreeDRuntimeMarkerResult({...overflowRaw,projectThreedMarkers:savedPlantings});
const snapshotAfter=buildThreeDRuntimeMarkerResult({...overflowRaw,projectThreedMarkers:savedPlantings.map(record=>record.id===101?{...record,data:{...record.data,bedId:null}}:record)});
assert.deepEqual(snapshotAfter.markers.find(marker=>marker.id==='plantings-9')?.position,snapshotBefore.markers.find(marker=>marker.id==='plantings-9')?.position);
assert.equal(snapshotAfter.markers.find(marker=>marker.id==='plantings-7')?.data.projectMarkerId,101);
assert.equal(snapshotAfter.markers.find(marker=>marker.id==='plantings-7')?.data.bedId,null);
assert.equal(snapshotAfter.markers.find(marker=>marker.id==='plantings-9')?.data.projectMarkerId,102);
console.log('PASS: Saved Project unassignment retains distinct record identities and leaves the other instance unchanged');
