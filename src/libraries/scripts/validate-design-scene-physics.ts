import assert from 'node:assert/strict';
import { newDesign, validateDesign } from '../services/threed/design/document';
import { buildDesignColliders } from '@/components/threed/design/DesignScenePhysics';
import RAPIER from '@dimforge/rapier3d-compat';
async function main() {
 await RAPIER.init();
 const doc=newDesign();const levelId=doc.levels[0].id;
 doc.nodes=[{id:'a',x:0,z:0},{id:'b',x:4,z:0}];
 doc.walls=[{id:'wall',start:'a',end:'b',height:3,thickness:0.2,elevation:0,levelId}];
 const metre=buildDesignColliders(doc,1),feet=buildDesignColliders(doc,0.3048);
 assert.ok(metre.length>0);
 assert.ok(Math.abs(Math.max(...feet[0].vertices)/Math.max(...metre[0].vertices)-1/0.3048)<0.0001);
 const world=new RAPIER.World({x:0,y:0,z:0});
 try {
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
 for(const c of metre)world.createCollider(RAPIER.ColliderDesc.trimesh(c.vertices,c.indices),body);
 const ball=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(2,1,-2).setLinvel(0,0,3).setCcdEnabled(true));
 world.createCollider(RAPIER.ColliderDesc.ball(0.2),ball);
 for(let i=0;i<120;i++)world.step();
 assert.ok(ball.translation().z<0,'Ball must not pass through wall');
 console.log('PASS: generated wall collision stops dynamic ball; metre/foot scale matches.');
 }finally{world.free();}
 const sloped=validateDesign({...doc,version:6,walls:[{...doc.walls[0],height:2,endHeight:4}],openings:[{id:'door',wallId:'wall',kind:'door',offset:1,width:1,height:2,sill:0}]});
 for(const [x,y,blocked] of [[.5,1,true],[1.5,1,false],[3,3,true],[3,4,false]] as const){
   const test=new RAPIER.World({x:0,y:0,z:0});
   try {
     const fixed=test.createRigidBody(RAPIER.RigidBodyDesc.fixed());
     for(const collider of buildDesignColliders(sloped,1))test.createCollider(RAPIER.ColliderDesc.trimesh(collider.vertices,collider.indices),fixed);
     const ball=test.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,-2).setLinvel(0,0,3).setCcdEnabled(true));
     test.createCollider(RAPIER.ColliderDesc.ball(.1),ball);
     for(let i=0;i<120;i++)test.step();
     assert.equal(ball.translation().z<0,blocked,`Sloped wall collision at ${x},${y}`);
   }finally{test.free();}
 }
 console.log('PASS: real Rapier sloped solids block below profile and allow door/above-profile passage.');
}
void main();
