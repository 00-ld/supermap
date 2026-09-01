// CDP: probe sensor entity positions vs path positions on /screen 3D scene.
// 目的：确认监控点是否真的渲染、落点经纬度、与路径点/模型锚点的偏差。
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

  const logs=[]
  ws.addEventListener('message',(ev)=>{
    const text=typeof ev.data==='string'?ev.data:ev.data.toString()
    let msg
    try{msg=JSON.parse(text)}catch{return}
    if(msg.method==='Runtime.consoleAPICalled'||msg.method==='Runtime.exceptionThrown'){
      const entry=msg.method==='Runtime.consoleAPICalled'
        ?`[${msg.params.type}] ${msg.params.args.map(a=>a.value||a.description||'').join(' ')}`
        :`[exception] ${msg.params.exceptionDetails?.exception?.description||msg.params.exceptionDetails?.text}`
      logs.push(entry)
      if(/\[F2\]|\[F6\]|\[F7\]|sensor|监控|越界|路径|疏散|render-chain/i.test(entry)){
        console.log('PROBE>',entry.slice(0,500))
      }
    }
  })

  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  console.log('navigating to /screen ...')
  await evalJS(ws,`location.hash='#/screen'`)
  console.log('waiting 45s for 3D model + georeference load...')
  await new Promise(r=>setTimeout(r,45000))

  // 注入 F7 监控点探针：遍历 viewer.entities，找 superMapCupSensorId 标记的实体，
  // 打印其 position(Cartesian3) 转 经纬度，与模型锚点(113.569463, 34.76965)对比。
  const probe=await evalJS(ws,`(()=>{
    const find=()=> {
      // 尝试从 Vue 组件实例拿 viewer
      const el=document.querySelector('.supermap-scene-viewer, [class*="scene"]');
      if(!el) return {error:'no scene element'};
      // 直接挂全局的 viewer（SuperMapSceneViewer 有时把 viewer 挂 window.__sceneViewer）
      let viewer=window.__supermapCupDebug&&window.__supermapCupDebug.viewer;
      if(!viewer){
        for(const k of Object.keys(window)){
          const v=window[k];
          if(v&&v.entities&&v.scene){viewer=v;break}
        }
      }
      return viewer;
    };
    const viewer=find();
    if(!viewer) return {error:'viewer not exposed on window'};
    const C=window.Cesium;
    const ents=viewer.entities.values;
    const sensors=[];
    const paths=[];
    for(const e of ents){
      try{
        const pos=e.position&&e.position.getValue?e.position.getValue(viewer.clock.currentTime):e.position;
        let geo=null;
        if(pos&&C&&C.Cartographic&&C.Ellipsoid&&C.Ellipsoid.WGS84){
          const carto=C.Cartographic.fromCartesian(pos);
          if(carto) geo={lon:C.Math.toDegrees(carto.longitude),lat:C.Math.toDegrees(carto.latitude),h:carto.height};
        }
        const rec={name:e.name, geo};
        if(e.superMapCupSensorId) sensors.push({id:e.superMapCupSensorId, ...rec});
        else if(/path|路径|疏散|evac/i.test(e.name||'')) paths.push(rec);
      }catch(err){}
    }
    return {
      viewerFound:true,
      totalEntities:ents.length,
      sensorCount:sensors.length,
      pathCount:paths.length,
      sensorSample:sensors.slice(0,8),
      pathSample:paths.slice(0,4),
      modelAnchor:{lon:113.569463,lat:34.76965},
    };
  })()`)
  console.log('SENSOR PROBE:',JSON.stringify(probe,null,2))

  fs.writeFileSync(path.join(OUT_DIR,'sensor-probe-result.json'),JSON.stringify(probe,null,2))
  fs.writeFileSync(path.join(OUT_DIR,'sensor-cdp-logs.txt'),logs.join('\n'))
  console.log('saved. total logs='+logs.length)

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
