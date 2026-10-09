// Optional native Edge/CDP acceptance of the actual React editor and WebGL preview.
// Serves a standalone bundle locally; no App/auth/database/storage connections.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const esbuild = require('esbuild');
const root = path.resolve(__dirname,'../../..');
const browser = process.env.THREED_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!browser) throw new Error('Set THREED_TEST_BROWSER to an installed Chromium/Edge executable.');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'threed-home-design-browser-'));
const delay = milliseconds => new Promise(resolve=>setTimeout(resolve,milliseconds));
const bundle = esbuild.buildSync({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {HomeDesignEditor} from './src/components/admin/threed/models/home-design/HomeDesignEditor';createRoot(document.getElementById('root')).render(<HomeDesignEditor/>);`,resolveDir:root,sourcefile:'home-browser.tsx',loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'}).outputFiles[0].contents;
let stylesheet='';
const html = `<html class="dark"><head><link rel="stylesheet" href="/app.css"><style>body{margin:0;font-family:Arial}#root{padding:12px;height:100dvh}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`;
const server=http.createServer((req,res)=> { if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle);}else if(req.url==='/app.css'){res.setHeader('Content-Type','text/css');res.end(stylesheet);}else{res.setHeader('Content-Type','text/html');res.end(html);} });
async function main(){
  const cssPath=path.join(root,'src/app/globals.css');
  stylesheet=(await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(cssPath,'utf8'),{from:cssPath})).css;
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const profile=path.join(temporary,'profile'), process=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-port=0','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--in-process-gpu',`http://127.0.0.1:${server.address().port}`],{windowsHide:true,stdio:'ignore'});
  let ws;
  try{
    const portFile=path.join(profile,'DevToolsActivePort');
    for(let i=0;i<100&&!fs.existsSync(portFile);i++)await delay(100);
    assert(fs.existsSync(portFile),'Browser debugging port did not start.');
    const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
    const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    ws=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
    let id=0;const pending=new Map(),exceptions=[];
    ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method==='Runtime.exceptionThrown')exceptions.push(data.params.exceptionDetails.text);const task=pending.get(data.id);if(task){pending.delete(data.id);data.error?task.reject(new Error(data.error.message)):task.resolve(data.result);}});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
    const evaluate=async(expression)=>{const reply=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(reply.exceptionDetails)throw new Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);return reply.result.value;};
    await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1250,height:1000,deviceScaleFactor:1,mobile:false});
    for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('[data-testid="home-plan"]') && !!document.querySelector('[data-testid="home-preview"] canvas')`))break;await delay(100);}
    const rect=await evaluate(`(()=>{const r=document.querySelector('[data-testid="home-plan"]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
    assert(rect.width>200&&rect.height>300,'Plan viewport must grow beyond the old 280px height.');
    const fillsWorkspace=()=>evaluate(`(()=>{const views=document.querySelector('[data-testid="home-viewports"]').getBoundingClientRect(),workspace=document.querySelector('[data-testid="home-workspace"]').getBoundingClientRect(),preview=document.querySelector('[data-testid="home-preview"]').getBoundingClientRect();return Math.abs(views.bottom-workspace.bottom)<2&&Math.abs(preview.bottom-views.bottom)<2&&preview.height>200})()`);
    assert(await fillsWorkspace(),'Plan and live preview must fill the available workspace height.');
    const click=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await delay(70);};
    const button=async(text)=>{const point=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Button unavailable: '+${JSON.stringify(text)});b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await click(point.x,point.y);};
    const counts=()=>evaluate(`document.querySelector('aside').textContent.match(/(\\d+) walls · (\\d+) floors · (\\d+) nodes/).slice(1).map(Number)`);
    const point=(x,z)=>({x:rect.x+80+x*45,y:rect.y+80+z*45});
    const corners=[[0,0],[3.048,0],[3.048,3.048],[0,3.048],[0,0]];
    await button('Wall');for(const corner of corners){const p=point(...corner);await click(p.x,p.y);}assert.deepEqual(await counts(),[4,0,4]);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
    await button('Floor');for(const corner of corners.slice(0,4)){const p=point(...corner);await click(p.x,p.y);}
    assert.deepEqual(await counts(),[4,0,4],'A floor draft must remain separate until Finish.');
    await button('Finish Floor');assert.deepEqual(await counts(),[4,1,4]);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Select').getAttribute('aria-pressed')`),'true','Finishing a floor must exit drawing into Select.');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});assert.deepEqual(await counts(),[4,1,4],'Escape after Finish must retain the completed floor.');
    await button('Undo');assert.deepEqual(await counts(),[4,0,4]);await button('Redo');assert.deepEqual(await counts(),[4,1,4]);
    await button('Floor');for(const corner of corners.slice(0,3)){const p=point(...corner);await click(p.x,p.y);}
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter'});await delay(70);assert.deepEqual(await counts(),[4,2,4]);await button('Undo');assert.deepEqual(await counts(),[4,1,4]);
    await button('Floor');for(const corner of corners){const p=point(...corner);await click(p.x,p.y);}assert.deepEqual(await counts(),[4,2,4]);await button('Undo');assert.deepEqual(await counts(),[4,1,4]);
    await button('Select');const midpoint=point(1.524,0);await click(midpoint.x,midpoint.y);
    await evaluate(`(()=>{const input=document.querySelector('input[aria-label="Height (in)"]');if(!input)throw Error('Wall selection missing');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'120');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(100);
    assert.equal(await evaluate(`document.querySelector('input[aria-label="Height (in)"]').value`),'120','Numeric wall properties did not update');
    const before=await evaluate(`document.querySelector('[data-testid="home-plan"] polygon[data-entity]').getAttribute('points')`);
    const node=point(3.048,0);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:node.x,y:node.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:node.x+6.096*45/12,y:node.y+6.096*45/12,button:'left',buttons:1});await delay(80);
    const moving=await evaluate(`document.querySelector('[data-testid="home-plan"] polygon[data-entity]').getAttribute('points')`);
    assert.notEqual(moving,before,'Shared corner did not update during drag');
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:node.x+6.096*45/12,y:node.y+6.096*45/12,button:'left'});await delay(80);
    await button('Undo');assert.equal(await evaluate(`document.querySelector('[data-testid="home-plan"] polygon[data-entity]').getAttribute('points')`),before,'One Undo must restore the entire drag');
    await button('Redo');assert.equal(await evaluate(`document.querySelector('[data-testid="home-plan"] polygon[data-entity]').getAttribute('points')`),moving);
    // Local export/import uses the actual editor handlers; file download is captured in memory.
    await evaluate(`window.__exports=[];const original=URL.createObjectURL;URL.createObjectURL=blob=>{window.__exports.push(blob);return original(blob)};HTMLAnchorElement.prototype.click=function(){};window.confirm=()=>true;`);
    await button('Export JSON');const design=await evaluate(`window.__exports[0].text().then(JSON.parse)`);assert.equal(design.walls.length,4);assert.equal(design.floors.length,1);assert.equal(design.units,'metres');
    assert(Math.abs(design.walls[0].height-3.048)<1e-6,'Imperial numeric height did not reach editable geometry');
    await button('Wall');const p=point(5,1);await click(p.x,p.y);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+50,y:p.y+25});await delay(50);await button('Export JSON');assert.equal(await evaluate(`window.__exports[1].text().then(text=>JSON.parse(text).walls.length)`),4,'Draft must not leak into export');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});assert.deepEqual(await counts(),[4,1,4]);
    await evaluate(`(async()=>{const file=new File([await window.__exports[0].text()],'design.json',{type:'application/json'});const data=new DataTransfer();data.items.add(file);const input=document.querySelector('input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(150);assert.deepEqual(await counts(),[4,1,4]);
    // Native wheel stays local; pan/zoom cannot rewrite world dimensions.
    const originalCount=await counts();await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:rect.x+350,y:rect.y+150,deltaX:0,deltaY:-100});await delay(80);assert.deepEqual(await counts(),originalCount);
    assert.equal(await evaluate(`document.querySelector('[role="alert"]')?.textContent ?? ''`),'');
    const canvasBefore=await evaluate(`window.__canvas=document.querySelector('[data-testid="home-preview"] canvas');!!window.__canvas`);
    assert(canvasBefore);await button('Fit');await button('Fit Plan');await delay(100);
    assert.equal(await evaluate(`window.__canvas===document.querySelector('[data-testid="home-preview"] canvas')`),true,'Camera framing remounted the Canvas');
    const canvas=await evaluate(`(()=>{const r=window.__canvas.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await click(canvas.x,canvas.y);assert.match(await evaluate(`document.querySelector('aside').textContent`),/Selected (Wall|Floor)/,'3D picking did not update shared properties');
    // A malformed import must preserve the existing editable design.
    await evaluate(`(()=>{const data=new DataTransfer();data.items.add(new File(['{"version":99}'],'invalid.json',{type:'application/json'}));const input=document.querySelector('input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);
    assert.deepEqual(await counts(),[4,1,4]);assert.match(await evaluate(`document.querySelector('[role="alert"]').textContent`),/fields|version/);
    await evaluate(`(async()=>{const data=new DataTransfer();data.items.add(new File([await window.__exports[0].text()],'valid.json',{type:'application/json'}));const input=document.querySelector('input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);
    await button('Select');const floorPoint=await evaluate(`(()=>{const r=document.querySelector('[data-testid="home-plan"] polygon[data-entity]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await click(floorPoint.x,floorPoint.y);
    await button('Delete Selected');assert.deepEqual(await counts(),[4,0,4]);await button('Undo');assert.deepEqual(await counts(),[4,1,4]);
    // Stage 2: actual host-bound placement, draft exclusion, property edits and pointer transactions.
    await button('Reset View');
    const exported=async()=>{await button('Export JSON');return evaluate(`window.__exports.at(-1).text().then(JSON.parse)`);};
    const edit=async(label,value)=>{await evaluate(`(()=>{const input=document.querySelector('input[aria-label="${label} (in)"]');if(!input)throw Error('Missing field: ${label}');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'${value}');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(80);};
    const wallStart=design.nodes.find(n=>n.id===design.walls[0].start),wallEnd=design.nodes.find(n=>n.id===design.walls[0].end),length=Math.hypot(wallEnd.x-wallStart.x,wallEnd.z-wallStart.z),dx=(wallEnd.x-wallStart.x)/length,dz=(wallEnd.z-wallStart.z)/length;
    const doorPoint=point(wallStart.x+dx*36*.0254,wallStart.z+dz*36*.0254);
    await button('Door');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:doorPoint.x,y:doorPoint.y});await delay(80);
    assert.equal(await evaluate(`document.querySelectorAll('[data-opening="door"]').length`),1,'Hover must preview the door.');
    assert.equal((await exported()).openings.length,0,'An unplaced opening must not leak into JSON.');
    await click(doorPoint.x,doorPoint.y);assert.match(await evaluate(`document.querySelector('aside').textContent`),/Selected Door/);
    await edit('Width',40);let openingDoc=await exported();assert.equal(openingDoc.version,5);assert.equal(openingDoc.openings.length,1);assert(Math.abs(openingDoc.openings[0].width-40*.0254)<1e-6);
    const oldOffset=openingDoc.openings[0].offset;
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:doorPoint.x,y:doorPoint.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:doorPoint.x+dx*6*.0254*45,y:doorPoint.y+dz*6*.0254*45,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:doorPoint.x+dx*6*.0254*45,y:doorPoint.y+dz*6*.0254*45,button:'left'});await delay(80);
    openingDoc=await exported();assert(openingDoc.openings[0].offset>oldOffset,'Opening drag must slide along its captured host wall.');
    await button('Undo');assert.equal((await exported()).openings[0].offset,oldOffset,'One Undo restores the entire opening drag.');await button('Redo');
    const nextWall=design.walls[1],wa=design.nodes.find(n=>n.id===nextWall.start),wb=design.nodes.find(n=>n.id===nextWall.end),windowPoint=point((wa.x+wb.x)/2,(wa.z+wb.z)/2);
    await button('Window');await click(windowPoint.x,windowPoint.y);assert.match(await evaluate(`document.querySelector('aside').textContent`),/Selected Window/);
    await edit('Sill height',42);await edit('Height',100);assert.match(await evaluate(`document.querySelector('[role="alert"]').textContent`),/taller/);
    openingDoc=await exported();assert.equal(openingDoc.openings.length,2);const savedWindow=openingDoc.openings.find(o=>o.kind==='window');assert(Math.abs(savedWindow.sill-42*.0254)<1e-6);assert(Math.abs(savedWindow.height-48*.0254)<1e-6,'Invalid dimensions must retain the previous valid opening.');await edit('Height',48);
    await button('Select');const hostPoint=point(wallStart.x+dx*length*.9,wallStart.z+dz*length*.9);await click(hostPoint.x,hostPoint.y);await button('Delete Selected');
    assert.equal((await exported()).openings.length,1,'Deleting a host must remove its opening.');await button('Undo');assert.equal((await exported()).openings.length,2);
    const importDesign=async value=>{await evaluate(`(()=>{const data=new DataTransfer();data.items.add(new File([${JSON.stringify(JSON.stringify(value))}],'design.json',{type:'application/json'}));const input=document.querySelector('input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);};
    await importDesign(openingDoc);assert.equal((await exported()).openings.length,2,'Version 2 import must retain editable openings.');
    const legacy={...design,version:1};delete legacy.openings;delete legacy.levels;delete legacy.roofs;delete legacy.roofOpenings;legacy.walls=legacy.walls.map(({levelId,...wall})=>wall);legacy.floors=legacy.floors.map(({levelId,...floor})=>floor);legacy.defaults={...legacy.defaults};for(const key of ['windowHeight','windowWidth','windowSill'])delete legacy.defaults[key];
    await importDesign(legacy);assert.equal((await exported()).version,5,'Version 1 import must upgrade to version 5.');assert.equal((await exported()).openings.length,0);await button('Undo');assert.equal((await exported()).openings.length,2);
    // Stage 3: native active-level drawing, independent corners, naming/elevation and recovery.
    const chooseLevel=async name=>{await evaluate(`(()=>{const select=document.querySelector('select[aria-label="Active level"]');const option=[...select.options].find(o=>o.textContent.startsWith(${JSON.stringify(name)}+' ·'));if(!option)throw Error('Missing level');select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);};
    await button('Add Level');assert.equal((await exported()).levels.length,2);assert.equal(await evaluate(`document.querySelectorAll('[data-testid="home-plan"] polygon[data-entity]').length`),0,'New levels begin empty in 2D.');
    await evaluate(`(()=>{const input=document.querySelector('input[aria-label="Level name"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Upper');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await edit('Level elevation',120);
    const groundSnapshot=await exported();assert(Math.abs(groundSnapshot.levels[1].elevation-120*.0254)<1e-6);
    await button('Reset View');await button('Wall');for(const corner of corners){const p=point(...corner);await click(p.x,p.y);}
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
    let stacked=await exported();assert.equal(stacked.walls.length,8);assert.equal(stacked.nodes.length,8,'Coincident upper corners must not reuse Ground IDs.');assert.deepEqual(stacked.nodes.slice(0,4),groundSnapshot.nodes);
    await button('Floor');for(const corner of corners.slice(0,4)){const p=point(...corner);await click(p.x,p.y);}await button('Finish Floor');
    await button('Door');const upperDoorPoint=point(36*.0254,0);await click(upperDoorPoint.x,upperDoorPoint.y);stacked=await exported();assert.equal(stacked.openings.length,3);
    assert.equal(stacked.walls.find(w=>w.id===stacked.openings.at(-1).wallId).levelId,stacked.levels[1].id);
    await chooseLevel('Ground');assert.equal(await evaluate(`document.querySelectorAll('[data-testid="home-plan"] polygon[data-entity]').length`),5,'2D shows only Ground walls/floor.');
    await chooseLevel('Upper');assert.equal(await evaluate(`document.querySelectorAll('[data-testid="home-plan"] polygon[data-entity]').length`),5);
    await button('Floor');for(const corner of corners.slice(0,2)){const p=point(...corner);await click(p.x,p.y);}await chooseLevel('Ground');await chooseLevel('Upper');assert.equal((await exported()).floors.length,2,'Level changes discard incomplete drawings, not committed geometry.');
    await evaluate(`document.querySelector('input[aria-label="Show all levels in 3D"]').click()`);await delay(100);await button('Fit');assert.equal(await evaluate(`window.__canvas===document.querySelector('[data-testid="home-preview"] canvas')`),true,'Level visibility must retain the Canvas.');
    await evaluate(`window.confirm=()=>false`);await button('Delete Level');assert.equal((await exported()).levels.length,2,'Cancelling populated-level deletion must preserve all geometry.');
    await evaluate(`window.confirm=()=>true`);await button('Delete Level');assert.deepEqual(await counts(),[4,1,4]);assert.equal((await exported()).openings.length,2);
    await button('Undo');assert.equal((await exported()).levels.length,2);assert.equal((await exported()).openings.length,3);await button('Redo');assert.equal((await exported()).levels.length,1);await button('Undo');
    await importDesign(stacked);assert.deepEqual((await exported()).levels,stacked.levels);await chooseLevel('Upper');
    const v2={...openingDoc,version:2};delete v2.levels;delete v2.roofs;delete v2.roofOpenings;v2.walls=v2.walls.map(({levelId,...wall})=>wall);v2.floors=v2.floors.map(({levelId,...floor})=>floor);await importDesign(v2);const upgraded=await exported();assert.equal(upgraded.version,5);assert.equal(upgraded.levels.length,1);assert.equal(upgraded.openings.length,2);await button('Undo');await chooseLevel('Upper');
    await evaluate(`(()=>{const box=document.querySelector('input[aria-label="Show all levels in 3D"]');if(!box.checked)box.click()})()`);
    console.log('Passed: level create/name/elevation, isolated same-coordinate upper drawing, active plan filtering, draft cancellation, retained Canvas visibility, confirmed/cancelled cascading deletion/Undo/Redo and editable v1/v2/v3 recovery.');

    // Roof tools share the active level's existing corners, without consuming floor hits.
    await button('Reset View');await button('Roof');for(const corner of corners.slice(0,4)){const p=point(...corner);await click(p.x,p.y);}await button('Finish Roof');
    let roofDoc=await exported();assert.equal(roofDoc.version,5);assert.equal(roofDoc.roofs.length,1);assert.equal(roofDoc.nodes.length,8);assert.equal(roofDoc.roofs[0].levelId,roofDoc.levels[1].id);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Select').getAttribute('aria-pressed')`),'true');
    const scalar=async(label,value)=>{await evaluate(`(()=>{const input=document.querySelector('input[aria-label='+JSON.stringify(${JSON.stringify(label)})+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(String(value))});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(50)};
    const roofKind=async(kind)=>{await evaluate(`(()=>{const select=document.querySelector('select[aria-label="Roof type"]');select.value=${JSON.stringify(kind)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(50)};
    await scalar('Pitch (rise / 12)',8);await scalar('Direction (degrees)',45);await edit('Eave offset',108);await edit('Roof thickness',8);
    await roofKind('shed');roofDoc=await exported();assert.equal(roofDoc.roofs[0].kind,'shed');assert.equal(roofDoc.roofs[0].pitch,8);assert.equal(roofDoc.roofs[0].direction,45);assert(Math.abs(roofDoc.roofs[0].elevation-108*.0254)<1e-6);
    await roofKind('flat');assert.equal((await exported()).roofs[0].kind,'flat');await roofKind('gable');roofDoc=await exported();
    await evaluate(`document.querySelector('input[aria-label="Show roofs in 3D"]').click()`);await button('Fit');assert.equal(await evaluate(`window.__canvas===document.querySelector('[data-testid="home-preview"] canvas')`),true);await evaluate(`document.querySelector('input[aria-label="Show roofs in 3D"]').click()`);

    await button('Reset View');
    const roofBody=await evaluate(`(()=>{const r=document.querySelector('[data-roof] text').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...roofBody,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:roofBody.x+14,y:roofBody.y+14,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:roofBody.x+14,y:roofBody.y+14,button:'left',clickCount:1});await delay(80);
    let draggedRoof=await exported();assert.notDeepEqual(draggedRoof.nodes.slice(4),roofDoc.nodes.slice(4));assert.deepEqual(draggedRoof.nodes.slice(0,4),roofDoc.nodes.slice(0,4));await button('Undo');assert.deepEqual((await exported()).nodes,roofDoc.nodes);
    await click(roofBody.x,roofBody.y);
    const roofCorner=await evaluate(`(()=>{const r=document.querySelector('[data-node]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...roofCorner,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:roofCorner.x-14,y:roofCorner.y+14,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:roofCorner.x-14,y:roofCorner.y+14,button:'left',clickCount:1});await delay(80);assert.notDeepEqual((await exported()).nodes,roofDoc.nodes);await button('Undo');assert.deepEqual((await exported()).nodes,roofDoc.nodes);await click(roofBody.x,roofBody.y);
    await scalar('Pitch (rise / 12)',25);assert.match(await evaluate(`document.querySelector('[role="alert"]').textContent`),/pitch/i);assert.equal((await exported()).roofs[0].pitch,8);await scalar('Pitch (rise / 12)',8);
    await edit('Corner 2 X',132);assert.notDeepEqual((await exported()).nodes,roofDoc.nodes);await button('Undo');assert.deepEqual((await exported()).nodes,roofDoc.nodes);
    await importDesign(roofDoc);assert.deepEqual((await exported()).roofs,roofDoc.roofs);await chooseLevel('Upper');
    const roofLabel=await evaluate(`(()=>{const r=document.querySelector('[data-roof] text').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await click(roofLabel.x,roofLabel.y);await button('Delete Selected');assert.equal((await exported()).roofs.length,0);await button('Undo');assert.equal((await exported()).roofs.length,1);
    await chooseLevel('Upper');await button('Delete Level');assert.equal((await exported()).roofs.length,0);await button('Undo');assert.equal((await exported()).roofs.length,1);await chooseLevel('Upper');
    const version3={...roofDoc,version:3};delete version3.roofs;delete version3.roofOpenings;await importDesign(version3);assert.equal((await exported()).version,5);assert.equal((await exported()).roofs.length,0);await button('Undo');await chooseLevel('Upper');
    console.log('Passed: native Roof completion, level corner reuse, pitch/direction/eave/thickness and all roof kinds, retained roof visibility, roof body/corner dragging and numeric Undo, invalid pitch guidance, roof/level deletion Undo and v3-v4 editable recovery.');

    // Roof openings: exact host, hover-only drafts, slope guards and atomic recovery.
    {
    const roofOpeningDesign={...roofDoc,roofs:roofDoc.roofs.map(roof=>({...roof,direction:0})),roofOpenings:[]};
    await importDesign(roofOpeningDesign);await chooseLevel('Upper');await button('Reset View');
    const skyPoint=point(72*.0254,30*.0254);await button('Skylight');await send('Input.dispatchMouseEvent',{type:'mouseMoved',...skyPoint});await delay(100);
    assert.equal((await exported()).roofOpenings.length,0,'Hover must never export a roof opening.');
    await click(skyPoint.x,skyPoint.y);let withSky=await exported();assert.equal(withSky.roofOpenings.length,1);assert.equal(withSky.roofOpenings[0].kind,'skylight');assert.equal(withSky.roofOpenings[0].roofId,withSky.roofs[0].id);
    await edit('Width',30);withSky=await exported();assert(Math.abs(withSky.roofOpenings[0].width-30*.0254)<1e-6);
    await edit('Across offset',48);assert.match(await evaluate(`document.querySelector('[role="alert"]').textContent`),/one roof plane/);assert.deepEqual((await exported()).roofOpenings,withSky.roofOpenings);await edit('Across offset',12);
    await button('Roof Cutout');const cutPoint=point(36*.0254,60*.0254);await click(cutPoint.x,cutPoint.y);let withRoofOpenings=await exported();assert.equal(withRoofOpenings.roofOpenings.length,2);assert.equal(withRoofOpenings.roofOpenings[1].kind,'cutout');
    await evaluate(`(()=>{const select=document.querySelector('select[aria-label="Roof opening type"]');select.value='skylight';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(80);assert.match(await evaluate(`document.querySelector('[role="alert"]').textContent`),/one roof plane/);assert.equal((await exported()).roofOpenings[1].kind,'cutout');
    await click(skyPoint.x,skyPoint.y);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...skyPoint,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:skyPoint.x+6*.0254*45,y:skyPoint.y,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:skyPoint.x+6*.0254*45,y:skyPoint.y,button:'left',clickCount:1});await delay(80);
    assert((await exported()).roofOpenings[0].along>withRoofOpenings.roofOpenings[0].along);await button('Undo');assert.deepEqual((await exported()).roofOpenings,withRoofOpenings.roofOpenings);
    await click(skyPoint.x,skyPoint.y);await button('Delete Selected');assert.equal((await exported()).roofOpenings.length,1);await button('Undo');assert.equal((await exported()).roofOpenings.length,2);
    await importDesign(withRoofOpenings);assert.deepEqual((await exported()).roofOpenings,withRoofOpenings.roofOpenings);await chooseLevel('Upper');
    await evaluate(`document.querySelector('input[aria-label="Show roofs in 3D"]').click()`);await button('Fit');assert.equal(await evaluate(`window.__canvas===document.querySelector('[data-testid="home-preview"] canvas')`),true);await evaluate(`document.querySelector('input[aria-label="Show roofs in 3D"]').click()`);
    // Roof label at 60,60 remains outside both rectangular openings.
    const hostPoint=point(60*.0254,60*.0254);await click(hostPoint.x,hostPoint.y);await button('Delete Selected');assert.equal((await exported()).roofs.length,0);assert.equal((await exported()).roofOpenings.length,0);await button('Undo');assert.equal((await exported()).roofOpenings.length,2);
    await chooseLevel('Upper');await button('Delete Level');assert.equal((await exported()).roofOpenings.length,0);await button('Undo');assert.equal((await exported()).roofOpenings.length,2);await chooseLevel('Upper');
    const version4={...withRoofOpenings,version:4};delete version4.roofOpenings;await importDesign(version4);assert.equal((await exported()).version,5);assert.equal((await exported()).roofOpenings.length,0);await button('Undo');await chooseLevel('Upper');
    await button('Skylight');const ridgePoint=point(60*.0254,60*.0254);await click(ridgePoint.x,ridgePoint.y);assert.match(await evaluate(`document.querySelector('[role="status"]').textContent`),/overlap|plane/);assert.equal((await exported()).roofOpenings.length,2);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
    console.log('Passed: native Skylight/Cutout hover/placement/properties, ridge conversion guidance, captured roof-opening drag/Undo, deletion/host/level cascades, retained Canvas and v4/v5 recovery.');
    }
    await button('Fit');await button('Fit Plan');
    await send('Emulation.setDeviceMetricsOverride',{width:1250,height:1200,deviceScaleFactor:1,mobile:false});await delay(150);
    assert(await fillsWorkspace(),'Resized desktop workspace must still be filled by the viewports.');
    assert.equal(await evaluate(`window.__canvas===document.querySelector('[data-testid="home-preview"] canvas')`),true,'Viewport resize remounted the Canvas');
    await send('Emulation.setDeviceMetricsOverride',{width:1250,height:600,deviceScaleFactor:1,mobile:false});await delay(150);
    assert(await evaluate(`(()=>{const editor=document.querySelector('[data-testid="home-editor"]'),scroll=document.querySelector('[data-testid="home-workspace"]').parentElement,footer=editor.querySelector('footer').getBoundingClientRect();return footer.bottom<=innerHeight&&scroll.scrollHeight>scroll.clientHeight})()`),'Short viewports must scroll the workspace while keeping the footer visible.');
    await send('Emulation.setDeviceMetricsOverride',{width:1250,height:1000,deviceScaleFactor:1,mobile:false});await delay(100);
    assert.deepEqual(exceptions,[]);
    await delay(500);const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temporary,'home-design.png'),Buffer.from(capture.data,'base64'));
    console.log('Passed: native wall/floor drawing, Finish/Enter/closure completion into Select, completed floor retention/Undo, endpoint reuse, live shared-corner drag, numeric height, single-step Undo/Redo, cancellation, JSON export/import/rejection, deletion, isolated wheel zoom, retained Canvas Fit/shared 3D picking and real App CSS viewport fill/resize/short-height scrolling.');
    console.log('Standalone capture: '+path.join(temporary,'home-design.png'));
    console.log('Passed: Door/Window hover/place/properties, invalid-height guidance, captured opening drag/Undo, host deletion cascade/Undo and editable v1/v2 JSON import/export.');
  }finally{ws?.close();process.kill();server.close();}
}
const deadline=setTimeout(()=>{console.error('Browser acceptance timed out.');process.exit(1);},75000);
main().then(()=>clearTimeout(deadline)).catch(error=>{clearTimeout(deadline);console.error(error);process.exitCode=1;server.close();});
