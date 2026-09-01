// CDP: 抓所有监控点 ECEF h，判断高度偏移是系统性还是位置相关。
// 同时用 scene.pickPosition 在监控点屏幕位置抓模型表面 ECEF，对比监控点是否悬浮。
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
  console.log('waiting for viewer + 3D model load (poll up to 90s)...')
  let viewerReady=false
  for(let i=0;i<30;i++){
    await new Promise(r=>setTimeout(r,3000))
    const v=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer&&window.__supermapCupDebug.viewer.entities)`)
    if(v){viewerReady=true; console.log('viewer ready after', (i+1)*3, 's'); break}
  }
  if(!viewerReady){console.log('viewer NOT ready after 90s')}
  else{
    // 再等 15s 让 tileset 流式加载
    console.log('waiting 15s more for tileset streaming...')
    await new Promise(r=>setTimeout(r,15000))
  }

  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return {error:'no viewer'};
    const C=window.Cesium||window.SuperMap3D;
    if(!C||!C.Cartesian3) return {error:'no Cesium'};

    // 1. 模型 boundingSphere 中心 ECEF + h
    let modelCenter=null;
    try{
      const prims=viewer.scene.primitives;
      for(let i=0;i<prims.length;i++){
        const p=prims.get(i);
        if(p&&p.root&&p.boundingSphere){
          const bs=p.boundingSphere;
          modelCenter={x:bs.center.x,y:bs.center.y,z:bs.center.z,radius:bs.radius};
          break;
        }
      }
    }catch(e){modelCenter={err:e.message}}

    // 2. 所有监控点 ECEF + h（用 WGS84 反算，不用 Cesium Cartographic）
    function ecefToGeo(x,y,z){
      const a=6378137.0,e2=6.69437999014e-3;
      const lon=Math.atan2(y,x);
      const p=Math.sqrt(x*x+y*y);
      let lat=Math.atan2(z,p*(1-e2));
      let h=0;
      for(let i=0;i<8;i++){
        const s=Math.sin(lat);
        const N=a/Math.sqrt(1-e2*s*s);
        h=p/Math.cos(lat)-N;
        lat=Math.atan2(z,p*(1-e2*N/(N+h)));
      }
      const s=Math.sin(lat);
      const N=a/Math.sqrt(1-e2*s*s);
      h=p/Math.cos(lat)-N;
      return {lon:lon*180/Math.PI,lat:lat*180/Math.PI,h};
    }

    const ents=viewer.entities.values;
    const sensors=[];
    for(const e of ents){
      if(!e.superMapCupSensorId) continue;
      const pos=e.position&&e.position.getValue?e.position.getValue(viewer.clock.currentTime):e.position;
      if(!pos) continue;
      const geo=ecefToGeo(pos.x,pos.y,pos.z);
      sensors.push({
        id:e.superMapCupSensorId,
        ecef:{x:pos.x,y:pos.y,z:pos.z},
        lon:geo.lon,lat:geo.lat,h:geo.h
      });
    }

    // 3. 用 scene.pickPosition 在第一个监控点屏幕位置抓模型表面 ECEF
    let surfacePick=null;
    try{
      const s0=sensors[0];
      if(s0){
        const carto=C.Cartographic.fromRadians(s0.lon*Math.PI/180, s0.lat*Math.PI/180, 0);
        // 用 globe.getHeight 拿地形高度（3D Tiles 模型不走这个，但试试）
        let globeH=null;
        try{globeH=viewer.scene.globe.getHeight(carto)}catch(e){globeH='err:'+e.message}
        surfacePick={sensorId:s0.id, sensorH:s0.h, globeH};
      }
    }catch(e){surfacePick={err:e.message}}

    // 4. 统计监控点 h 分布
    const hs=sensors.map(s=>s.h);
    const hMin=Math.min(...hs), hMax=Math.max(...hs), hAvg=hs.reduce((a,b)=>a+b,0)/hs.length;

    return {
      modelCenter,
      modelCenterH: modelCenter&&modelCenter.x? ecefToGeo(modelCenter.x,modelCenter.y,modelCenter.z).h : null,
      sensorCount:sensors.length,
      sensorHStats:{min:hMin,max:hMax,avg:hAvg.toFixed(1)},
      sensors:sensors.slice(0,10),
      surfacePick,
    };
  })()`)
  console.log('HEIGHT DIAGNOSIS:',JSON.stringify(probe,null,2))

  fs.writeFileSync(path.join(OUT_DIR,'sensor-height-diagnosis.json'),JSON.stringify(probe,null,2))
  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
