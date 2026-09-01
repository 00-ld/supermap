// CDP: 用正确 Cesium API 重新验证监控点是否在模型上。
// 之前诊断脚本误用 Cartographic.fromCartesian({x,y,z}) 普通对象，返回错误经纬度。
// 本次用 Cesium.Cartesian3(x,y,z) 构造实例再转，并对比模型 boundingSphere 中心。
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

  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return {error:'no viewer'};
    const C=window.Cesium||window.SuperMap3D;
    if(!C||!C.Cartesian3||!C.Cartographic) return {error:'no Cesium'};

    // 模型 boundingSphere 中心（真值）
    let modelCenterCartesian=null, modelCenterGeo=null;
    try{
      const prims=viewer.scene.primitives;
      for(let i=0;i<prims.length;i++){
        const p=prims.get(i);
        if(p&&p.root&&p.boundingSphere){
          const bs=p.boundingSphere;
          // 用 Cartesian3 构造实例
          const c3=new C.Cartesian3(bs.center.x, bs.center.y, bs.center.z);
          modelCenterCartesian={x:bs.center.x,y:bs.center.y,z:bs.center.z};
          const carto=C.Cartographic.fromCartesian(c3);
          if(carto) modelCenterGeo={lon:C.Math.toDegrees(carto.longitude),lat:C.Math.toDegrees(carto.latitude),h:carto.height};
          break;
        }
      }
    }catch(e){modelCenterGeo={err:e.message}}

    // 监控点 entity position，用 Cartesian3 实例转
    const ents=viewer.entities.values;
    const sensors=[];
    for(const e of ents){
      if(!e.superMapCupSensorId) continue;
      const pos=e.position&&e.position.getValue?e.position.getValue(viewer.clock.currentTime):e.position;
      if(!pos) continue;
      const c3=new C.Cartesian3(pos.x, pos.y, pos.z);
      const carto=C.Cartographic.fromCartesian(c3);
      if(!carto) continue;
      sensors.push({
        id:e.superMapCupSensorId,
        lon:C.Math.toDegrees(carto.longitude),
        lat:C.Math.toDegrees(carto.latitude),
        h:carto.height
      });
    }

    return {
      modelCenterCartesian, modelCenterGeo,
      sensorCount:sensors.length,
      sensors:sensors.slice(0,5),
      allSensorLats:sensors.map(s=>s.lat),
      allSensorHs:sensors.map(s=>s.h),
    };
  })()`)
  console.log('VERIFY:',JSON.stringify(probe,null,2))

  fs.writeFileSync(path.join(OUT_DIR,'sensor-verify-on-model.json'),JSON.stringify(probe,null,2))
  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
