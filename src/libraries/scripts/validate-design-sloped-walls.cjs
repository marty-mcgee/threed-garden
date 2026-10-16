// Actual document/geometry/history boundaries; no database, browser or server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const THREE = require('three');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (module, file) => {
  assert(file.includes(`${path.sep}design${path.sep}`) || file.endsWith('scene-units.ts'));
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, file);
};
const D = require('../services/threed/design/document.ts');
const G = require('../services/threed/design/geometry.ts');
const H = require('../services/threed/design/history.ts');
const A = require('../services/threed/design/project-architecture.ts');
const I = require('../services/threed/design/asset-inventory.ts');
const O = require('../services/threed/design/object-properties.ts');
if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
const near = (a,b) => assert(Math.abs(a-b)<1e-5, `${a} != ${b}`);
const base = D.validateDesign({...D.newDesign(), nodes:[{id:'a',x:0,z:0},{id:'b',x:4,z:0}], walls:[{id:'wall',levelId:'ground',start:'a',end:'b',height:3,thickness:.2,elevation:0}]});
assert.equal(base.version,5); assert.equal(base.walls[0].endHeight,undefined);
const slope = (start,end) => D.validateDesign({...base,version:6,walls:[{...base.walls[0],height:start,endHeight:end}]});
assert.throws(()=>D.validateDesign({...base,walls:[{...base.walls[0],endHeight:4}]}));
for(const [a,b] of [[-1,3],[3,-1],[0,0],[31,3],[3,Infinity]]) assert.throws(()=>slope(a,b));
function volume(geometry) {
  const p=geometry.getAttribute('position'); let v=0;
  for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i), b=new THREE.Vector3().fromBufferAttribute(p,i+1), c=new THREE.Vector3().fromBufferAttribute(p,i+2); v+=a.dot(b.cross(c))/6;}
  return v;
}
function hit(geometry,x,y,z,dx,dy,dz) {
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}); const mesh=new THREE.Mesh(geometry,material); mesh.updateMatrixWorld();
  const hits=new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,dy,dz)).intersectObject(mesh); material.dispose(); return hits;
}
for(const [start,end] of [[0,4],[4,0],[2,4],[4,2],[3,3]]) {
  const doc=slope(start,end), geometry=G.wallGeometry(doc,doc.walls[0]);
  near(volume(geometry),4*.2*(start+end)/2);
  for(const x of [.1,1,2,3,3.9]) near(hit(geometry,x,10,0,0,-1,0)[0].point.y,D.wallHeightAt(doc.walls[0],x,4));
  for(const value of geometry.getAttribute('normal').array) assert(Number.isFinite(value));
  geometry.dispose();
}
const doc=slope(2,4), opened=D.validateDesign({...doc,openings:[{id:'door',wallId:'wall',kind:'door',offset:1,width:1,height:2,sill:0}]});
const geometry=G.wallGeometry(opened,opened.walls[0]);
near(volume(geometry),2.4-.4);
assert.equal(hit(geometry,1.5,1,-1,0,0,1).length,0,'Real aperture, no hidden wall.');
assert(hit(geometry,1.5,2.5,-1,0,0,1).length);
assert.throws(()=>D.validateDesign({...opened,walls:[{...opened.walls[0],height:0}]}),/taller/);
geometry.dispose();
for(const field of ['flipX','flipZ']) { const flipped=O.editObject(opened,'wall',{field}); near(flipped.walls[0].height,2);near(flipped.walls[0].endHeight,4);const g=G.wallGeometry(flipped,flipped.walls[0]);near(volume(g),2);g.dispose(); }
const rotated=O.editObject(opened,'wall',{field:'rotation',value:37}); const rg=G.wallGeometry(rotated,rotated.walls[0]);near(volume(rg),2);rg.dispose();
const joined=D.validateDesign({...doc,nodes:[...doc.nodes,{id:'c',x:4,z:3}],walls:[...doc.walls,{...base.walls[0],id:'neighbor',start:'b',end:'c'}]});
const owner=new G.DesignGeometryCache();owner.update(joined,null);
const mesh=owner.group.children.find(o=>o.name==='wall'), other=owner.group.children.find(o=>o.name==='neighbor'), old=mesh.geometry, unchanged=other.geometry;
let disposed=0; old.addEventListener('dispose',()=>disposed++);
owner.update(joined,'wall'); assert.equal(mesh.geometry,old);
const edited=D.validateDesign({...joined,walls:joined.walls.map(w=>w.id==='wall'?{...w,endHeight:5}:w)});
owner.update(edited,null); assert.equal(owner.group.children.find(o=>o.name==='wall'),mesh);assert.equal(disposed,1);assert.equal(other.geometry,unchanged);
assert(I.architectureAssets(edited).find(a=>a.id==='wall').dimensions.includes(' to '));
for(let i=0;i<12;i++){const next=D.validateDesign({...edited,walls:edited.walls.map(w=>w.id==='wall'?{...w,endHeight:4+i/10}:w)});owner.update(next,null);assert.equal(other.geometry,unchanged);assert.equal(owner.group.children.length,2);}
owner.update(D.removeEntity(edited,'wall'),null);assert(!owner.group.children.includes(mesh));owner.dispose();
let draft=A.projectArchitectureDraft({version:1,document:base}); assert(!A.architectureIsDirty(draft));
draft={...draft,history:H.commitDesign(draft.history,doc)};assert(A.architectureIsDirty(draft));
assert.deepEqual(H.undoDesign(draft.history).present,base); assert.deepEqual(H.redoDesign(H.undoDesign(draft.history)).present,doc);
const payload=JSON.parse(JSON.stringify({version:1,document:doc}));
const loaded=A.projectArchitectureDraft(A.parseProjectArchitecture(payload));assert(!A.architectureIsDirty(loaded));assert.deepEqual(loaded.history.present,doc);
assert(!A.architectureIsDirty(A.acknowledgeArchitecture(draft,payload)));
const pending={...draft,history:H.commitDesign(draft.history,slope(2,5))};assert(A.architectureIsDirty(A.acknowledgeArchitecture(pending,payload)));
assert.deepEqual(A.projectArchitectureDraft().history.present.walls,[]);
let seq=0;const merged=A.importProjectArchitecture(base,doc,'merge',()=>`fresh-${++seq}`);assert.equal(merged.version,6);assert.equal(merged.walls.length,2);assert.equal(merged.walls[1].endHeight,4);assert.notEqual(merged.walls[1].id,'wall');
console.log('PASS: v5/v6 validation, zero/increasing/decreasing tops, volumes/apertures, transforms, miter resource retention/disposal, Assets, undo, fresh IDs and clean/dirty mocked hydration.');
