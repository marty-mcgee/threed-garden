import assert from 'node:assert/strict';
import {BufferGeometry,Float32BufferAttribute,Group,Mesh} from 'three';
// @ts-ignore Native Node source extension.
import {indexEnvironmentRegions,extractEnvironmentRegion} from '../services/threed/models/environment-region-index.ts';
const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute([-100,0,-100,100,0,-100,0,0,100, 50,0,0,51,0,0,50,1,0],3));
const body=new Group();const mesh=new Mesh(geometry);mesh.position.y=2;body.add(mesh);
const generator=indexEnvironmentRegions(mesh,body);let next=generator.next();let yields=0;while(!next.done){yields++;next=generator.next();}
const index=next.value;assert(index);assert(yields>0);assert.equal(index.triangleCount,2);assert.equal(index.referenceBytes,8);
const spanning=index.regions.find(r=>r.min[0]===-100);assert(spanning);assert.equal(spanning.max[0],100);
assert.equal(extractEnvironmentRegion(spanning).vertices[1],2);
assert.equal(index.regions.reduce((n,r)=>n+r.triangleCount,0),2,'No duplicated spanning triangles');
geometry.getAttribute('position').setX(0,NaN);assert.throws(()=>extractEnvironmentRegion(spanning));
geometry.dispose();console.log('PASS: incremental region metadata, spanning coverage, transforms, bounded references and invalid extraction');

// Fragmented assets must not allocate one collider region per source mesh.
const fragmented=new Group();
const triangle=new BufferGeometry();triangle.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0,0,0,1],3));
for(let i=0;i<1000;i++){const child=new Mesh(triangle);child.position.y=i%3;fragmented.add(child);}
const fragmentedBody=new Group();fragmentedBody.add(fragmented);
const packedJob=indexEnvironmentRegions(fragmented,fragmentedBody);
let packedNext=packedJob.next();while(!packedNext.done)packedNext=packedJob.next();
const packed=packedNext.value;assert.equal(packed.regions.length,1);assert.equal(packed.triangleCount,1000);
assert.equal(packed.regions[0].parts.length,1000);assert.equal(extractEnvironmentRegion(packed.regions[0]).indices.length,3000);
assert.equal(packed.referenceBytes,4000);triangle.dispose();
console.log('PASS: nearby mesh fragments pack into one bounded spatial collider region');
