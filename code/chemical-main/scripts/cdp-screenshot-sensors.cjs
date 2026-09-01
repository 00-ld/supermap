// CDP: 截图 /screen 3D 场景，看监控点视觉上是否在模型上。
// 同时飞到第一个监控点位置，拉近看。
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
  console.log('waiting 50s for 3D model load...')
  await new Promise(r=>setTimeout(r,50000))

  // 截图1：默认视角
  const ss1=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:92})
  fs.writeFileSync(path.join(OUT_DIR,'sensors-default-view.jpg'),Buffer.from(ss1.data,'base64'))
  console.log('screenshot 1 saved: sensors-default-view.jpg')

  // 飞到第一个监控点，拉近
  const fly=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return 'no viewer';
    const C=window.Cesium||window.SuperMap3D;
    const ents=viewer.entities.values;
    let sensor=null;
    for(const e of ents){ if(e.superMapCupSensorId){sensor=e;break} }
    if(!sensor) return 'no sensor entity';
    const pos=sensor.position&&sensor.position.getValue?sensor.position.getValue(viewer.clock.currentTime):sensor.position;
    if(!pos) return 'no pos';
    // 飞到监控点上方 200m
    try{
      const dest=C.Cartesian3.fromDegrees? C.Cartesian3.fromDegrees(113.569463, 34.76965, 300) : null;
      if(dest&&viewer.camera.flyTo){
        viewer.camera.flyTo({destination:dest, duration:2, orientation:{heading:0, pitch:C.Math.toRadians(-45), roll:0}});
        return 'flying to model area';
      }
      return 'no flyTo';
    }catch(e){return 'err:'+e.message}
  })()`)
  console.log('FLY:',fly)
  await new Promise(r=>setTimeout(r,5000))

  const ss2=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:92})
  fs.writeFileSync(path.join(OUT_DIR,'sensors-closeup.jpg'),Buffer.from(ss2.data,'base64'))
  console.log('screenshot 2 saved: sensors-closeup.jpg')

  // 检查 canvas 是否有内容渲染
  const state=await evalJS(ws,`(()=>{
    const cv=document.querySelector('canvas');
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    let sensorCount=0;
    if(viewer&&viewer.entities){
      for(const e of viewer.entities.values){ if(e.superMapCupSensorId) sensorCount++; }
    }
    return {
      canvasSize:cv?(cv.width+'x'+cv.height):'none',
      sensorCount,
      cameraPos:viewer&&viewer.camera?{x:viewer.camera.positionWC.x,y:viewer.camera.positionWC.y,z:viewer.camera.positionWC.z}:'none',
    };
  })()`)
  console.log('STATE:',JSON.stringify(state,null,2))

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
