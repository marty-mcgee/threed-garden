import assert from 'node:assert/strict';
import { newDesign } from '../services/threed/design/document';
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
}
void main();
