// CDP: 深度诊断——对比监控点落点 vs 模型 boundingSphere 中心 vs 路径点落点。
// 同时手动用 fallback georef.transform 算监控点 ECEF，判断 georef 是否加载真实值。
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
  console.log('waiting 50s for 3D model + georeference load...')
  await new Promise(r=>setTimeout(r,50000))

  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return {error:'no viewer'};
    const C=window.Cesium||window.SuperMap3D;

    // 1. 模型 tileset boundingSphere 中心（真值）
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

    // 2. 模型中心转经纬度
    let modelCenterGeo=null;
    if(modelCenter&&modelCenter.x&&C&&C.Cartographic){
      const carto=C.Cartographic.fromCartesian({x:modelCenter.x,y:modelCenter.y,z:modelCenter.z});
      if(carto) modelCenterGeo={lon:C.Math.toDegrees(carto.longitude),lat:C.Math.toDegrees(carto.latitude),h:carto.height};
    }

    // 3. 监控点 entity position（实际落点）
    const ents=viewer.entities.values;
    const sensors=[];
    for(const e of ents){
      if(!e.superMapCupSensorId) continue;
      const pos=e.position&&e.position.getValue?e.position.getValue(viewer.clock.currentTime):e.position;
      let geo=null,xyz=null;
      if(pos){xyz={x:pos.x,y:pos.y,z:pos.z};
        if(C&&C.Cartographic){const c=C.Cartographic.fromCartesian(pos);if(c)geo={lon:C.Math.toDegrees(c.longitude),lat:C.Math.toDegrees(c.latitude),h:c.height}}
      }
      sensors.push({id:e.superMapCupSensorId,xyz,geo});
    }

    // 4. 手动用 fallback transform 算监控点 PA-01L (272,286) 的 ECEF
    // fallback transform (16个数，列主序)
    const T=[-0.1740248413607987,-0.07625847224635991,0,0,
             -0.0725794435405089,0.16562915275023768,0.12529648093457577,0,
             -0.036573849622644636,0.08346296734050102,-0.13151534741808135,0,
             -2097359.589449915,4807542.341291077,3616968.422988921,1];
    // mapPointToS3MLocal(272,286): map.width=1587.2,height=947.2
    // bounds: left=-1605.9164671191247,right=810.41634921256627,bottom=-1130.1391864245234,top=878.30004171701148
    // offset.x=260, offset.y=0
    const w=1587.2,h=947.2;
    const L=-1605.9164671191247,R=810.41634921256627,B=-1130.1391864245234,Top=878.30004171701148,ox=260,oy=0;
    function s3mLocal(px,py,z){
      const nx=px/w, ny=py/h;
      return {x:L+nx*(R-L)+ox, y:Top-ny*(Top-B)+oy, z};
    }
    function mul(T,x,y,z){
      return {x:T[0]*x+T[4]*y+T[8]*z+T[12], y:T[1]*x+T[5]*y+T[9]*z+T[13], z:T[2]*x+T[6]*y+T[10]*z+T[14]};
    }
    const sensorLocal=s3mLocal(272,286,0.5/0.16); // altitudeOffset/scaleZ, scaleZ=0.16
    const sensorEcefFallback=mul(T,sensorLocal.x,sensorLocal.y,sensorLocal.z);
    let sensorEcefFallbackGeo=null;
    if(C&&C.Cartographic){const c=C.Cartographic.fromCartesian(sensorEcefFallback);if(c)sensorEcefFallbackGeo={lon:C.Math.toDegrees(c.longitude),lat:C.Math.toDegrees(c.latitude),h:c.height}}

    // 5. 路径点 (119,236) 同样算
    const pathLocal=s3mLocal(119,236,1.4/0.16);
    const pathEcefFallback=mul(T,pathLocal.x,pathLocal.y,pathLocal.z);
    let pathEcefFallbackGeo=null;
    if(C&&C.Cartographic){const c=C.Cartographic.fromCartesian(pathEcefFallback);if(c)pathEcefFallbackGeo={lon:C.Math.toDegrees(c.longitude),lat:C.Math.toDegrees(c.latitude),h:c.height}}

    return {
      modelCenter, modelCenterGeo,
      sensorCount:sensors.length,
      sensorFirst:sensors[0],
      sensorLocalComputed:sensorLocal,
      sensorEcefFallback:sensorEcefFallback,
      sensorEcefFallbackGeo,
      pathLocalComputed:pathLocal,
      pathEcefFallbackGeo,
      debugViewerPresent:!!dbg.viewer,
      debugLayerCount:(dbg.layers||[]).length,
      debugMessages:(dbg.messages||[]).slice(-5),
    };
  })()`)
  console.log('DIAGNOSE:',JSON.stringify(probe,null,2))

  fs.writeFileSync(path.join(OUT_DIR,'sensor-diagnose.json'),JSON.stringify(probe,null,2))
  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
