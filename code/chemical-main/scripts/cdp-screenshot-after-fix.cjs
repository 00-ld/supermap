// CDP: 修复后截图——飞到监控点区域，拉近看监控点是否贴在模型上
const http = require('http')
const fs = require('fs')
const path = require('path')

const CDP_PORT = 9223
const OUT_DIR = path.resolve(__dirname, '..', 'logs')

function getJson(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
async function cdpCall(ws,method,params={}){const id=cdpCall._id=(cdpCall._id||0)+1;return new Promise((res,rej)=>{const on=(ev)=>{const t=typeof ev==='string'?ev:(ev.data||'');let m;try{m=JSON.parse(t)}catch{return}if(m.id===id){ws.removeEventListener('message',on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};ws.addEventListener('message',on);ws.send(JSON.stringify({id,method,params}))})}
async function evalJS(ws,expr){const r=await cdpCall(ws,'Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.value}

async function main() {
  const targets=await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  const t=targets.find(x=>x.type==='page')
  const ws=new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r,x)=>{ws.addEventListener('open',()=>r());ws.addEventListener('error',e=>x(new Error(e.message||'ws')))})

  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  console.log('navigating to /screen ...')
  await evalJS(ws,`location.hash='#/screen'`)
  console.log('waiting for viewer (poll up to 90s)...')
  let viewerReady=false
  for(let i=0;i<30;i++){
    await new Promise(r=>setTimeout(r,3000))
    const v=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer&&window.__supermapCupDebug.viewer.entities)`)
    if(v){viewerReady=true; console.log('viewer ready after', (i+1)*3, 's'); break}
  }
  if(!viewerReady){console.log('viewer NOT ready, abort'); ws.close(); process.exit(1)}
  console.log('waiting 15s for tileset streaming...')
  await new Promise(r=>setTimeout(r,15000))

  // 飞到模型上方 250m，俯角 45 度
  const fly=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return 'no viewer';
    const C=window.Cesium||window.SuperMap3D;
    const dest=C.Cartesian3.fromDegrees(113.569463, 34.76965, 250);
    viewer.camera.flyTo({destination:dest, duration:2, orientation:{heading:0, pitch:C.Math.toRadians(-45), roll:0}});
    return 'flying to model area (250m, pitch -45)';
  })()`)
  console.log('FLY:',fly)
  await new Promise(r=>setTimeout(r,4000))

  const ss1=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:95})
  fs.writeFileSync(path.join(OUT_DIR,'sensors-after-fix-overview.jpg'),Buffer.from(ss1.data,'base64'))
  console.log('screenshot 1 saved: sensors-after-fix-overview.jpg')

  // 再拉近到 120m
  const fly2=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D;
    const dest=C.Cartesian3.fromDegrees(113.569463, 34.76965, 120);
    viewer.camera.flyTo({destination:dest, duration:2, orientation:{heading:0, pitch:C.Math.toRadians(-35), roll:0}});
    return 'flying closer (120m, pitch -35)';
  })()`)
  console.log('FLY2:',fly2)
  await new Promise(r=>setTimeout(r,4000))

  const ss2=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:95})
  fs.writeFileSync(path.join(OUT_DIR,'sensors-after-fix-closeup.jpg'),Buffer.from(ss2.data,'base64'))
  console.log('screenshot 2 saved: sensors-after-fix-closeup.jpg')

  const state=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    let sensorCount=0;
    if(viewer&&viewer.entities){
      for(const e of viewer.entities.values){ if(e.superMapCupSensorId) sensorCount++; }
    }
    return {
      sensorCount,
      cameraHeight:viewer&&viewer.camera?viewer.camera.positionCartographic.height:'none',
    };
  })()`)
  console.log('STATE:',JSON.stringify(state,null,2))

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
