// Actual document/history/Three geometry, entirely offline. No DB, API or reference assets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const THREE = require('three');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  assert(filename.includes(`${path.sep}home-design${path.sep}`));
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, filename);
};
const D = require('../services/threed/home-design/document.ts');
const H = require('../services/threed/home-design/history.ts');
const G = require('../services/threed/home-design/geometry.ts');
if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
const near = (a, b) => assert(Math.abs(a - b) < 1e-5, `${a} differs from ${b}`);
const room = D.validateDesign({ ...D.newDesign(), nodes: [{ id:'a',x:0,z:0 },{ id:'b',x:120*D.INCH,z:0 },{ id:'c',x:120*D.INCH,z:120*D.INCH },{ id:'d',x:0,z:120*D.INCH }],
  walls: ['ab','bc','cd','da'].map((id,i) => ({ id,levelId:'ground',start:'abcd'[i],end:'abcd'[(i+1)%4],height:96*D.INCH,thickness:6*D.INCH,elevation:0 })),
  floors: [{id:'floor',levelId:'ground',vertices:['a','b','c','d'],thickness:6*D.INCH,elevation:0}] });
assert.deepEqual(D.parseDesign(JSON.stringify(room)),room);
assert.equal(room.defaults.doorHeight,80*D.INCH); assert.equal(room.defaults.doorWidth,36*D.INCH);
near(D.legacyCentimetresToMetres(265),2.65);
near(D.inchesToMetres(120),3.048);
const {openings: ignoredOpenings, levels: ignoredLevels, roofs: ignoredRoofs, roofOpenings: ignoredRoofOpenings, ...legacyRoom}=room;
legacyRoom.walls=legacyRoom.walls.map(({levelId,...wall})=>wall);legacyRoom.floors=legacyRoom.floors.map(({levelId,...floor})=>floor);
for(const key of ['windowHeight','windowWidth','windowSill']) delete (legacyRoom.defaults={...legacyRoom.defaults})[key];
legacyRoom.version=1;
assert.deepEqual(D.parseDesign(JSON.stringify(legacyRoom)),room,'Version 1 editable documents upgrade losslessly to version 3 defaults.');
for (const invalid of [null, [], {...room,version:6}, {...room,units:'cm'}, {...room,unexpected:0}, {...room,nodes:[...room.nodes,room.nodes[0]]},
  {...room,walls:[{...room.walls[0],end:'a'}]}, {...room,walls:[{...room.walls[0],start:'absent'}]}, {...room,walls:[...room.walls, {...room.walls[0],id:'duplicate'}]},
  {...room,floors:[{...room.floors[0],vertices:['a','c','b','d']}]}, {...room,nodes:room.nodes.map((n,i)=>i===0?{...n,x:Infinity}:n)},
  {...room,defaults:{...room.defaults,doorHeight:-1}}, {...room,floors:[{...room.floors[0],vertices:['a','b','a']}]},
  {...room,nodes:Array.from({length:1201},(_,i)=>({id:'n'+i,x:i/2,z:0}))}]) assert.throws(()=>D.validateDesign(invalid));
assert.throws(()=>D.parseDesign('x'.repeat(1024*1024+1)),/1 MiB/);
assert.equal(D.polygonIssue([{x:0,z:0},{x:2,z:0},{x:2,z:2},{x:1,z:1},{x:0,z:2}]),null,'Concave polygons remain usable');
const reversed = {...room,floors:[{...room.floors[0],vertices:['d','c','b','a']}]};
assert.doesNotThrow(()=>D.validateDesign(reversed));
console.log('Passed: strict bounded editable JSON, metre/inch/cm conversions, disconnected/concave/reversed geometry and invalid reference/polygon rejection.');

const view = {x:173,y:97,scale:53};
assert.deepEqual(D.screenToPlan(D.planToScreen({x:3,z:-2},view),view),{x:3,z:-2});
assert.equal(D.snapPoint({x:.05,z:0},room.nodes,100,false).nodeId,'a');
assert.equal(D.snapPoint({x:.05,z:0},room.nodes,300,false).nodeId,undefined,'Snap tolerance is screen based');
near(D.snapPoint({x:1.06,z:1.03},[],53,true).point.x,7*6*D.INCH);
const original = JSON.stringify(room);
let history = H.designHistory(room);
let moving = room;
for(let i=1;i<=20;i++) moving = D.moveNodes(room,new Map([['b',{x:room.nodes[1].x+i*.01,z:.4}]]));
assert.equal(history.past.length,0,'Preview samples are not commits');
history=H.commitDesign(history,moving); assert.equal(history.past.length,1);
assert.equal(history.present.nodes[1].z,.4); assert.equal(history.present.walls[0].end,history.present.walls[1].start);
assert.equal(history.present.floors[0].vertices[1],'b');
assert.equal(JSON.stringify(H.undoDesign(history).present),original);
assert.deepEqual(H.redoDesign(H.undoDesign(history)).present,history.present);
assert.equal(H.commitDesign(H.undoDesign(history),{...room,name:'Branch'}).future.length,0);
assert.throws(()=>H.commitDesign(history,D.mergeNodes(moving,'b','a')),'A collapsing merge must reject atomically');
assert.equal(JSON.stringify(room),original,'Transforms never mutate the captured document');
const pruned=D.pruneNodes({...room,walls:[],floors:[]}); assert.equal(pruned.nodes.length,0);
for(let i=0;i<110;i++) history=H.commitDesign(history,{...history.present,name:'Revision '+i});
assert.equal(history.past.length,100,'History is bounded');
console.log('Passed: shared corner topology, pure pointer samples, one drag/one history entry, undo/redo/branching, failed atomic merge and orphan pruning.');

const owner = new G.DesignGeometryCache(); owner.update(room,null);
assert.equal(owner.group.children.length,5);
const wall = owner.group.children.find(mesh=>mesh.name==='ab');
const wallBox = new THREE.Box3().setFromObject(wall);
near(wallBox.max.y,96*D.INCH); near(wallBox.min.y,0);
const floor = owner.group.children.find(mesh=>mesh.name==='floor');
const floorBox = new THREE.Box3().setFromObject(floor);
near(floorBox.min.y,-6*D.INCH);near(floorBox.max.y,0);near(floorBox.max.x,120*D.INCH);near(floorBox.max.z,120*D.INCH);
const footprints=room.walls.map(wall=>G.wallFootprint(room,wall));
near(footprints[0][1].x,footprints[1][0].x); near(footprints[0][1].z,footprints[1][0].z);
near(footprints[0][2].x,footprints[1][3].x); near(footprints[0][2].z,footprints[1][3].z);
const oldGeometry=wall.geometry,oldFloor=floor.geometry;
owner.update(room,'ab'); assert.equal(wall.geometry,oldGeometry);assert.equal(floor.geometry,oldFloor);
let disposals=0, materials=0;
for(let i=0;i<100;i++) {
  wall.geometry.addEventListener('dispose',()=>disposals++);
  owner.update({...room,walls:room.walls.map(w=>w.id==='ab'?{...w,height:w.height+i*.01+.01}:w)},'ab');
  assert.equal(owner.group.children.length,5); assert.equal(floor.geometry,oldFloor);
}
assert.equal(disposals,100,'Every replaced geometry is released once');
for(const mesh of owner.group.children) mesh.material.addEventListener('dispose',()=>materials++);
owner.update(D.newDesign(),null);assert.equal(owner.group.children.length,0);assert.equal(materials,5);
owner.dispose();owner.dispose();assert.equal(materials,5);
const acute=D.validateDesign({...room,floors:[],walls:[room.walls[0],{...room.walls[1],start:'a',end:'c'}],nodes:room.nodes.map(n=>n.id==='c'?{...n,x:3,z:.03}:n)});
for(const w of acute.walls) for(const point of G.wallFootprint(acute,w)) assert(Number.isFinite(point.x)&&Number.isFinite(point.z)&&Math.abs(point.x)<5&&Math.abs(point.z)<5);
const revGeometry=G.extrudePlan(reversed.floors[0].vertices.map(id=>room.nodes.find(n=>n.id===id)),.1,0);
near(revGeometry.boundingBox.max.x,3.048);revGeometry.dispose();
console.log('Passed: actual BufferGeometry Y-up extrusion, Imperial bounds, identical 2D/3D miter corners, stable mesh identity, acute bounds and 100 edit/delete disposal cycles.');

const door={id:'door',wallId:'ab',kind:'door',offset:18*D.INCH,width:36*D.INCH,height:80*D.INCH,sill:0};
const windowOpening={id:'window',wallId:'ab',kind:'window',offset:66*D.INCH,width:36*D.INCH,height:48*D.INCH,sill:36*D.INCH};
const opened=D.validateDesign({...room,openings:[door,windowOpening]});
assert.deepEqual(D.parseDesign(JSON.stringify(opened)),opened);
for(const bad of [{...door,wallId:'missing'},{...door,kind:'roof'},{...door,sill:D.INCH},{...door,offset:0}, {...door,offset:110*D.INCH}, {...door,height:96*D.INCH}, {...windowOpening,sill:0}])assert.throws(()=>D.validateDesign({...room,openings:[bad]}));
assert.throws(()=>D.validateDesign({...opened,openings:[door,{...windowOpening,offset:40*D.INCH}]}),/overlap/);
assert.throws(()=>D.validateDesign({...opened,openings:[...opened.openings,{...door,id:'ab'}]}),/unique/);
assert.throws(()=>D.validateDesign({...room,openings:Array.from({length:201},(_,i)=>({...door,id:'opening'+i}))}),/limit/);
assert.throws(()=>D.validateDesign({...opened,walls:opened.walls.map(w=>w.id==='ab'?{...w,height:79*D.INCH}:w)}),/taller/);
assert.throws(()=>H.commitDesign(H.designHistory(opened),D.moveNodes(opened,new Map([['b',{x:70*D.INCH,z:0}]]))),/does not fit/);
let openingHistory=H.commitDesign(H.designHistory(opened),D.removeEntity(opened,'ab'));
assert.equal(openingHistory.present.openings.length,0);assert.equal(openingHistory.present.floors.length,1);
assert.deepEqual(H.undoDesign(openingHistory).present,opened,'Host deletion and its openings undo atomically.');
assert.equal(D.removeEntity(opened,'door').walls.length,4);assert.equal(D.removeEntity(opened,'door').openings.length,1);
const cutOwner=new G.DesignGeometryCache();cutOwner.update(opened,null);
const cutWall=cutOwner.group.children.find(o=>o.name==='ab'), keptFloor=cutOwner.group.children.find(o=>o.name==='floor');
cutWall.updateMatrixWorld(true);
const through=(mesh,x,y)=>new THREE.Raycaster(new THREE.Vector3(x*D.INCH,y*D.INCH,-2),new THREE.Vector3(0,0,1)).intersectObject(mesh).length;
assert.equal(through(cutWall,36,40),0,'Door aperture must contain no covering wall triangles.');
assert.equal(through(cutWall,84,60),0,'Window aperture must contain no covering wall triangles.');
assert(through(cutWall,36,90)>0,'Door lintel remains solid.');assert(through(cutWall,84,20)>0,'Wall below a window remains solid.');assert(through(cutWall,60,50)>0,'Pier between openings remains solid.');
const windowGroup=cutOwner.group.children.find(o=>o.name==='window'), glass=windowGroup.children.find(o=>o.material.transparent);
assert(glass&&glass.material.opacity===.28&&glass.material.depthWrite===false,'Glazing is transparent and has a dedicated resource owner.');
const retainedWall=cutWall,retainedFloor=keptFloor.geometry,retainedWindow=windowGroup;
cutOwner.update(opened,'window');assert.equal(cutOwner.group.children.find(o=>o.name==='window'),retainedWindow);
let trimDisposed=0,trimMaterials=0;
for(let i=0;i<20;i++){
  const group=cutOwner.group.children.find(o=>o.name==='door'),materials=new Set();
  group.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>trimDisposed++);materials.add(o.material)}});
  for(const material of materials)material.addEventListener('dispose',()=>trimMaterials++);
  cutOwner.update({...opened,openings:opened.openings.map(o=>o.id==='door'?{...o,offset:o.offset+(i+1)*.002}:o)},'door');
  assert.equal(cutOwner.group.children.length,7);assert.equal(cutOwner.group.children.find(o=>o.name==='ab'),retainedWall);assert.equal(keptFloor.geometry,retainedFloor);assert.equal(cutOwner.group.children.find(o=>o.name==='window'),retainedWindow);
}
assert.equal(trimDisposed,80);assert.equal(trimMaterials,20,'Shared trim material disposes once per replacement.');
const moved=D.validateDesign({...opened,nodes:opened.nodes.map(n=>({ ...n,x:10+n.x/Math.SQRT2-n.z/Math.SQRT2,z:5+n.x/Math.SQRT2+n.z/Math.SQRT2 })),walls:opened.walls.map(w=>({...w,elevation:3*D.INCH}))});
cutOwner.update(moved,null);cutOwner.group.updateMatrixWorld(true);
const frame=D.wallFrame(moved,moved.walls[0]),center=frame.point(door.offset+door.width/2),normal=new THREE.Vector3(-frame.dz,0,frame.dx);
assert.equal(new THREE.Raycaster(new THREE.Vector3(center.x,3*D.INCH+40*D.INCH,center.z).addScaledVector(normal,2),normal.clone().negate()).intersectObject(cutWall).length,0,'Rotated/elevated walls retain true apertures.');
const frameBox=new THREE.Box3().setFromObject(cutOwner.group.children.find(o=>o.name==='window'));near(frameBox.min.y,(3+36)*D.INCH);
cutOwner.update(D.removeEntity(moved,'door'),null);assert.equal(cutOwner.group.children.length,6);assert(!cutOwner.group.children.some(o=>o.name==='door'));
cutOwner.update(D.removeEntity(moved,'ab'),null);assert.equal(cutOwner.group.children.length,4);cutOwner.dispose();cutOwner.dispose();
console.log('Passed: v1/v2 JSON migration, bounded host/clearance/overlap checks, atomic host deletion/Undo, real door/window raycast apertures/lintels/piers, rotated/elevated hosts, transparent glazing and incremental opening disposal.');

// Stage 3: migrate flat documents without elevation loss; levels own independent topology.
const v2={...opened,version:2};delete v2.levels;delete v2.roofs;delete v2.roofOpenings;v2.walls=v2.walls.map(({levelId,...wall})=>wall);v2.floors=v2.floors.map(({levelId,...floor})=>floor);
assert.deepEqual(D.validateDesign(v2),opened,'Version 2 migration preserves geometry, openings and dimensions.');
const collidingLegacy={...legacyRoom,nodes:[...legacyRoom.nodes,{id:'ground',x:10,z:10}]};
const migratedCollision=D.validateDesign(collidingLegacy);assert.notEqual(migratedCollision.levels[0].id,'ground');assert.equal(migratedCollision.nodes.at(-1).id,'ground');
const manyCollisions=D.validateDesign({...legacyRoom,nodes:[...legacyRoom.nodes,...Array.from({length:30},(_,i)=>({id:i?'ground-level-'+i:'ground',x:10+i,z:10}))]});
assert(manyCollisions.levels[0].id.length<=80);assert.deepEqual(D.validateDesign(manyCollisions),manyCollisions,'Migration IDs remain bounded and round-trip after repeated collisions.');
const upper={id:'upper',name:'Upper',elevation:108*D.INCH};
const stacked=D.validateDesign({...opened,levels:[...opened.levels,upper],nodes:[...opened.nodes,...opened.nodes.map(n=>({...n,id:'upper-'+n.id}))],
 walls:[...opened.walls,...opened.walls.map(w=>({...w,id:'upper-'+w.id,levelId:upper.id,start:'upper-'+w.start,end:'upper-'+w.end}))],
 floors:[...opened.floors,...opened.floors.map(f=>({...f,id:'upper-'+f.id,levelId:upper.id,vertices:f.vertices.map(id=>'upper-'+id)}))],
 openings:[...opened.openings,...opened.openings.map(o=>({...o,id:'upper-'+o.id,wallId:'upper-'+o.wallId}))]});
assert.deepEqual(D.parseDesign(JSON.stringify(stacked)),stacked);
for(const bad of [{...stacked,levels:[]},{...stacked,levels:[...stacked.levels,{id:'extra',name:'UPPER',elevation:0}]},
 {...stacked,levels:stacked.levels.map(l=>l.id==='upper'?{...l,elevation:101}:l)},
 {...stacked,walls:stacked.walls.map(w=>w.id==='upper-ab'?{...w,levelId:'absent'}:w)},
 {...stacked,walls:stacked.walls.map(w=>w.id==='upper-ab'?{...w,start:'a'}:w)},
 {...stacked,floors:stacked.floors.map(f=>f.id==='upper-floor'?{...f,vertices:['a','b','c','d']}:f)},
 {...stacked,levels:[...stacked.levels,{id:'ab',name:'Collision',elevation:0}]},
 {...stacked,levels:Array.from({length:21},(_,i)=>({id:'level'+i,name:'Level '+i,elevation:i}))}])assert.throws(()=>D.validateDesign(bad));
assert.throws(()=>D.removeLevel(room,'ground'),/at least one/);
assert.throws(()=>D.removeLevel(stacked,'absent'),/Missing/);
const upperView=D.levelDocument(stacked,'upper');assert.equal(upperView.nodes.length,4);assert.equal(upperView.walls.length,4);assert.equal(upperView.openings.length,2);assert(upperView.nodes.every(n=>n.id.startsWith('upper-')));
assert.equal(D.entityLevelId(stacked,'upper-door'),'upper');assert.equal(D.entityLevelId(stacked,'floor'),'ground');
const shifted=D.validateDesign(D.moveNodes(stacked,new Map([['upper-b',{x:4,z:.2}]])));assert.deepEqual(shifted.nodes.slice(0,4),opened.nodes,'Upper corner movement never changes Ground nodes.');
let levelHistory=H.commitDesign(H.designHistory(stacked),D.removeLevel(stacked,'upper'));
assert.deepEqual(levelHistory.present,opened,'Deleting a level cascades its geometry and prunes only its orphan nodes.');assert.deepEqual(H.undoDesign(levelHistory).present,stacked);
const levelOwner=new G.DesignGeometryCache();levelOwner.update(stacked,null);levelOwner.group.updateMatrixWorld(true);
const get=id=>levelOwner.group.children.find(o=>o.name===id);
const groundWall=get('ab'),upperWall=get('upper-ab'),upperFloor=get('upper-floor'),upperDoor=get('upper-door');
near(new THREE.Box3().setFromObject(upperWall).min.y,108*D.INCH);near(new THREE.Box3().setFromObject(upperFloor).min.y,102*D.INCH);near(new THREE.Box3().setFromObject(upperDoor).min.y,108*D.INCH);
assert.equal(through(upperWall,36,148),0,'Upper door aperture inherits level elevation.');assert(through(upperWall,36,198)>0);
const groundGeometry=groundWall.geometry,upperGeometry=upperWall.geometry;let levelDisposals=0;
for(const mesh of [groundWall,upperWall])mesh.geometry.addEventListener('dispose',()=>levelDisposals++);
for(let i=0;i<10;i++){
 levelOwner.update(stacked,null,'upper');assert.equal(groundWall.visible,false);assert.equal(upperWall.visible,true);assert.equal(through(groundWall,60,50),0,'Hidden level meshes cannot be picked.');
 levelOwner.update(stacked,null);assert.equal(groundWall.visible,true);assert(through(groundWall,60,50)>0);
 assert.equal(groundWall.geometry,groundGeometry);assert.equal(upperWall.geometry,upperGeometry);assert.equal(get('upper-door'),upperDoor);
}
assert.equal(levelDisposals,0,'Visibility switching must not delete/recreate geometry.');
const raised=D.validateDesign({...stacked,levels:stacked.levels.map(l=>l.id==='upper'?{...l,elevation:120*D.INCH}:l)});
levelOwner.update(raised,null);levelOwner.group.updateMatrixWorld(true);assert.equal(levelDisposals,1);assert.equal(groundWall.geometry,groundGeometry);assert.equal(get('upper-ab'),upperWall);
near(new THREE.Box3().setFromObject(upperWall).min.y,120*D.INCH);near(new THREE.Box3().setFromObject(get('upper-window')).min.y,156*D.INCH);
const offset=D.validateDesign({...raised,walls:raised.walls.map(w=>w.id==='upper-ab'?{...w,elevation:3*D.INCH}:w)});levelOwner.update(offset,null);levelOwner.group.updateMatrixWorld(true);near(new THREE.Box3().setFromObject(upperWall).min.y,123*D.INCH);near(new THREE.Box3().setFromObject(get('upper-window')).min.y,159*D.INCH);
levelOwner.update(D.removeLevel(offset,'upper'),null);assert.equal(levelOwner.group.children.length,7);assert.equal(groundWall.geometry,groundGeometry);levelOwner.dispose();levelOwner.dispose();
console.log('Passed: v1/v2/v3 migration and collision-safe IDs, level bounds/ownership and isolated topology, atomic level deletion/Undo, inherited apertures/elevations, hidden picking exclusion and retained visibility/geometry owners.');

// Roofs: real surface heights and apertures in concave footprints, not bounds alone.
const v3={...stacked,version:3};delete v3.roofs;delete v3.roofOpenings;assert.deepEqual(D.validateDesign(v3),stacked);
const roof={id:'roof',levelId:'upper',vertices:['upper-a','upper-b','upper-c','upper-d'],kind:'gable',pitch:6,direction:0,thickness:6*D.INCH,elevation:96*D.INCH};
const roofed=D.validateDesign({...stacked,roofs:[roof]});assert.deepEqual(D.parseDesign(JSON.stringify(roofed)),roofed);
const roofOwner=new G.DesignGeometryCache();roofOwner.update(roofed,'roof');roofOwner.group.updateMatrixWorld(true);
const roofMesh=roofOwner.group.children.find(o=>o.name==='roof'), roofBase=(108+96)*D.INCH;
const rayDown=(mesh,x,z)=>new THREE.Raycaster(new THREE.Vector3(x,50,z),new THREE.Vector3(0,-1,0)).intersectObject(mesh);
near(roofMesh.geometry.boundingBox.min.y,roofBase);near(roofMesh.geometry.boundingBox.max.y,roofBase+36*D.INCH);
near(rayDown(roofMesh,1,60*D.INCH)[0].point.y,roofBase+36*D.INCH);
near(rayDown(roofMesh,1,30*D.INCH)[0].point.y,roofBase+21*D.INCH);
assert.equal(rayDown(roofMesh,4,1).length,0);
const retainedRoof=roofMesh.geometry;let roofDisposals=0;retainedRoof.addEventListener('dispose',()=>roofDisposals++);
roofOwner.update(roofed,null,undefined,false);assert.equal(roofMesh.visible,false);assert.equal(rayDown(roofMesh,1,1).length,0);
roofOwner.update(roofed,null,'ground');assert.equal(roofMesh.visible,false);roofOwner.update(roofed,null);assert.equal(roofMesh.geometry,retainedRoof);assert.equal(roofDisposals,0);
for(const kind of ['flat','shed','gable'])for(const direction of [0,37,90,180,270]){
 const variant=D.validateDesign({...roofed,roofs:[{...roof,kind,direction}]});roofOwner.update(variant,null);roofOwner.group.updateMatrixWorld(true);
 const profile=D.roofProfile(roof.vertices.map(id=>variant.nodes.find(n=>n.id===id)),variant.roofs[0]);
 for(const [x,z] of [[.3,.7],[1.1,1.3],[2.5,2.1]])near(rayDown(roofMesh,x,z)[0].point.y,roofBase+profile.height({x,z})+roof.thickness);
 const position=roofMesh.geometry.getAttribute('position'),normal=roofMesh.geometry.getAttribute('normal');
 let volume=0;for(let i=0;i<position.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(position,i),b=new THREE.Vector3().fromBufferAttribute(position,i+1),c=new THREE.Vector3().fromBufferAttribute(position,i+2);volume+=a.dot(b.cross(c))/6;}near(volume,3.048*3.048*roof.thickness);
 const underside=new THREE.Raycaster(new THREE.Vector3(1,roofBase-1,1),new THREE.Vector3(0,1,0)).intersectObject(roofMesh);assert(underside.length);near(underside[0].point.y,roofBase+profile.height({x:1,z:1}));
 for(let i=0;i<position.count;i++)assert(Number.isFinite(position.getX(i))&&Number.isFinite(normal.getY(i)));
}
const concavePoints=[{id:'ra',x:0,z:0},{id:'rb',x:4,z:0},{id:'rc',x:4,z:1},{id:'rd',x:1,z:1},{id:'re',x:1,z:4},{id:'rf',x:0,z:4}];
for(const reverse of [false,true])for(const direction of [0,45,90]){
 const doc=D.validateDesign({...D.newDesign(),nodes:concavePoints,roofs:[{...roof,levelId:'ground',vertices:concavePoints.map(n=>n.id)[reverse?'reverse':'slice'](),direction}]});
 const geometry=G.roofGeometry(doc,doc.roofs[0]),mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
 assert.equal(rayDown(mesh,2,2).length,0,'Concave cutout must not be bridged across the ridge.');assert(rayDown(mesh,.5,2).length);assert(rayDown(mesh,2,.5).length);
 geometry.dispose();mesh.material.dispose();
}
for(const patch of [{kind:'hip'},{pitch:-1},{pitch:25},{direction:360},{direction:NaN},{thickness:0},{levelId:'missing'},{vertices:['upper-a','upper-c','upper-b','upper-d']},{vertices:['a','b','c','d']},{id:'ab'}])assert.throws(()=>D.validateDesign({...roofed,roofs:[{...roof,...patch}]}));
assert.throws(()=>D.validateDesign({...roofed,roofs:[{...roof,pitch:24}],nodes:roofed.nodes.map(n=>n.id==='upper-c'?{...n,z:40}:n.id==='upper-d'?{...n,z:40}:n)}),/rise/);
const roofMoved=D.validateDesign(D.moveNodes(roofed,new Map([['upper-b',{x:4,z:.2}]])));assert.deepEqual(roofMoved.nodes.slice(0,4),room.nodes);assert.equal(roofMoved.roofs[0].vertices[1],'upper-b');
assert.deepEqual(H.undoDesign(H.commitDesign(H.designHistory(roofed),D.removeEntity(roofed,'roof'))).present,roofed);
assert.equal(D.removeEntity(roofed,'upper-ab').roofs.length,1,'Deleting a wall must preserve its snapped roof.');
assert.equal(D.removeLevel(roofed,'upper').roofs.length,0);assert.equal(D.levelDocument(roofed,'ground').roofs.length,0);assert.equal(D.entityLevelId(roofed,'roof'),'upper');
assert.equal(roofDisposals,1,'The replaced roof geometry must dispose once.');
const roofGeometryBefore=roofMesh.geometry;let finalRoofDisposals=0;roofGeometryBefore.addEventListener('dispose',()=>finalRoofDisposals++);roofOwner.dispose();roofOwner.dispose();assert.equal(finalRoofDisposals,1);
console.log('Passed: v1-v4 JSON, flat/shed/gable heights and rotated profiles, concave/reversed ridge triangulation, roof validation/topology/deletion/Undo, hidden picking and retained roof owners.');

// Hosted roof apertures: actual triangles, slope alignment, atomic host edits and disposal.
{
const v4={...roofed,version:4};delete v4.roofOpenings;assert.deepEqual(D.validateDesign(v4),roofed,'Version 4 roof geometry upgrades without adding an opening.');
const cutout={id:'roof-cutout',roofId:'roof',kind:'cutout',along:24*D.INCH,across:48*D.INCH,width:24*D.INCH,length:24*D.INCH};
const skylight={id:'skylight',roofId:'roof',kind:'skylight',along:60*D.INCH,across:12*D.INCH,width:24*D.INCH,length:36*D.INCH};
const apertured=D.validateDesign({...roofed,roofOpenings:[cutout,skylight]});assert.deepEqual(D.parseDesign(JSON.stringify(apertured)),apertured);
for(const patch of [{roofId:'missing'},{kind:'door'},{along:0},{width:0},{length:Infinity},{across:-1},{width:31},{id:'upper-ab'}])assert.throws(()=>D.validateDesign({...roofed,roofOpenings:[{...cutout,...patch}]}));
assert.throws(()=>D.validateDesign({...roofed,roofOpenings:[{...cutout,kind:'skylight'}]}),/one roof plane/);
assert.throws(()=>D.validateDesign({...roofed,roofOpenings:[cutout,{...cutout,id:'other',along:cutout.along+cutout.width}]}),/overlap/);
assert.throws(()=>D.validateDesign({...roofed,roofOpenings:Array.from({length:201},(_,i)=>({...cutout,id:'cut'+i}))}),/limit/);
assert.throws(()=>D.validateDesign({...apertured,roofs:apertured.roofs.map(r=>({...r,direction:90}))}),/fit/);
assert.throws(()=>H.commitDesign(H.designHistory(apertured),D.moveNodes(apertured,new Map([['upper-b',{x:1,z:0}]]))),/fit/);
const notchNodes=[[0,0],[4,0],[4,4],[3,4],[3,1],[1,1],[1,4],[0,4]].map(([x,z],i)=>({id:'notch'+i,x,z}));
const notched={...D.newDesign(),nodes:notchNodes,roofs:[{...roof,id:'notched',levelId:'ground',vertices:notchNodes.map(n=>n.id),kind:'flat'}]};
assert.throws(()=>D.validateDesign({...notched,roofOpenings:[{...cutout,roofId:'notched',along:.5,across:2,width:3,length:.5}]}),/fit/,'All rectangle corners inside a concave roof is insufficient: crossing the notch must reject.');
const apertureOwner=new G.DesignGeometryCache();apertureOwner.update(apertured,null);apertureOwner.group.updateMatrixWorld(true);
const apertureRoof=apertureOwner.group.children.find(o=>o.name==='roof'), skyGroup=apertureOwner.group.children.find(o=>o.name==='skylight');
assert.equal(rayDown(apertureRoof,36*D.INCH,60*D.INCH).length,0,'Cutout across ridge must be truly open.');
assert.equal(rayDown(apertureRoof,72*D.INCH,30*D.INCH).length,0,'Roof triangles must be absent underneath the glazing.');
assert(rayDown(apertureRoof,10*D.INCH,30*D.INCH).length,'Roof around the holes must remain solid.');
const glass=skyGroup.children.find(o=>o.material.transparent);assert.equal(glass.material.opacity,.28);assert.equal(glass.material.depthWrite,false);
const skyHits=rayDown(skyGroup,72*D.INCH,30*D.INCH);assert(skyHits.length);near(skyHits[0].point.y,roofBase+15*D.INCH+roof.thickness+D.INCH/2+.008);
const roofPosition=apertureRoof.geometry.getAttribute('position');let roofVolume=0;
for(let i=0;i<roofPosition.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(roofPosition,i),b=new THREE.Vector3().fromBufferAttribute(roofPosition,i+1),c=new THREE.Vector3().fromBufferAttribute(roofPosition,i+2);roofVolume+=a.dot(b.cross(c))/6;}
near(roofVolume,(3.048*3.048-cutout.width*cutout.length-skylight.width*skylight.length)*roof.thickness);
const apertureGeometry=apertureRoof.geometry,keptSky=skyGroup;let apertureDisposals=0,skyDisposals=0,skyMaterialDisposals=0;
apertureGeometry.addEventListener('dispose',()=>apertureDisposals++);
for(const mesh of skyGroup.children){mesh.geometry.addEventListener('dispose',()=>skyDisposals++);mesh.material.addEventListener('dispose',()=>skyMaterialDisposals++);}
apertureOwner.update(apertured,'skylight',undefined,false);assert.equal(skyGroup.visible,false);assert.equal(rayDown(skyGroup,72*D.INCH,30*D.INCH).length,0);apertureOwner.update(apertured,null);assert.equal(apertureRoof.geometry,apertureGeometry);assert.equal(apertureDisposals,0);assert.equal(skyDisposals,0);
const shiftedSky=D.validateDesign({...apertured,roofOpenings:apertured.roofOpenings.map(o=>o.id==='skylight'?{...o,along:o.along+6*D.INCH}:o)});
apertureOwner.update(shiftedSky,'skylight');assert.equal(apertureOwner.group.children.find(o=>o.name==='roof'),apertureRoof);assert.equal(apertureDisposals,1);assert.equal(skyDisposals,2);assert.equal(skyMaterialDisposals,2);
assert.equal(D.removeEntity(apertured,'roof-cutout').roofOpenings.length,1);assert.equal(D.removeEntity(apertured,'roof').roofOpenings.length,0);assert.equal(D.removeLevel(apertured,'upper').roofOpenings.length,0);assert.equal(D.levelDocument(apertured,'ground').roofOpenings.length,0);assert.equal(D.entityLevelId(apertured,'skylight'),'upper');
assert.deepEqual(H.undoDesign(H.commitDesign(H.designHistory(apertured),D.removeEntity(apertured,'roof'))).present,apertured);
const translated=D.validateDesign(D.moveNodes(apertured,new Map(apertured.nodes.filter(n=>n.id.startsWith('upper-')).map(n=>[n.id,{x:n.x+10,z:n.z+5}]))));
apertureOwner.update(translated,null);apertureOwner.group.updateMatrixWorld(true);assert.equal(rayDown(apertureRoof,10+36*D.INCH,5+60*D.INCH).length,0);assert(rayDown(apertureOwner.group.children.find(o=>o.name==='skylight'),10+72*D.INCH,5+30*D.INCH).length);
for(const direction of [0,37,90])for(const kind of ['flat','shed','gable'])for(const reverse of [false,true]){
 const angle=direction*Math.PI/180;
 const variant=D.validateDesign({...apertured,nodes:apertured.nodes.map(n=>({...n,x:10+n.x*Math.cos(angle)-n.z*Math.sin(angle),z:5+n.x*Math.sin(angle)+n.z*Math.cos(angle)})),roofs:[{...roof,kind,direction,vertices:reverse?[roof.vertices[0],...roof.vertices.slice(1).reverse()]:roof.vertices}]});
 apertureOwner.update(variant,null);apertureOwner.group.updateMatrixWorld(true);
 for(const opening of [cutout,skylight]){const fp=D.roofOpeningFootprint(variant,opening),center=fp.reduce((sum,p)=>({x:sum.x+p.x/4,z:sum.z+p.z/4}),{x:0,z:0});assert.equal(rayDown(apertureRoof,center.x,center.z).length,0,'Rotated/reversed hosts preserve holes.');}
}
apertureOwner.update(D.removeEntity(apertured,'skylight'),null);assert(!apertureOwner.group.children.some(o=>o.name==='skylight'));apertureOwner.dispose();apertureOwner.dispose();
console.log('Passed: v1-v5 recovery; hosted cutout/skylight fit, overlap, ridge/concavity/bounds rejection; actual roof holes and outward volume, sloped glazing, rotated/reversed hosts, level transforms, atomic cascade/Undo, hidden picking and owned resource disposal.');

}
