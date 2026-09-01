// CDP: 多视角截图模型，统计每个视角下可见 tile 数 + 抓 tile 实际 ECEF/经纬度范围
// 诊断：是否远处建筑因 SSE 被裁、是否有建筑穿地、是否过曝看不清
const http = require('http')
const fs = require('fs')
const path = require('path')

const CDP_PORT = 9223
const OUT_DIR = path.resolve(__dirname, '..', 'logs')

function getJson(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
async function cdpCall(ws,method,params={}){const id=cdpCall._id=(cdpCall._id||0)+1;return new Promise((res,rej)=>{const on=(ev)=>{const t=typeof ev==='string'?ev:(ev.data||'');let m;try{m=JSON.parse(t)}catch{return}if(m.id===id){ws.removeEventListener('message',on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};ws.addEventListener('message',on);ws.send(JSON.stringify({id,method,params}))})}
async function evalJS(ws,expr){const r=await cdpCall(ws,'Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.value}

async function flyAndShot(ws,label,lon,lat,height,pitch){
  const fly=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D;
    if(!viewer||!C) return 'no viewer';
    const dest=C.Cartesian3.fromDegrees(${lon},${lat},${height});
    viewer.camera.flyTo({destination:dest, duration:1.5, orientation:{heading:0, pitch:C.Math.toRadians(${pitch}), roll:0}});
    return 'ok';
  })()`)
  await new Promise(r=>setTimeout(r,3000))
  // 数当前可见的 content tile
  const vis=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D;
    if(!viewer) return {error:'no viewer'};
    let prims=viewer.scene.primitives;
    for(let i=0;i<prims.length;i++){
      const p=prims.get(i);
      if(!p||!p.root) continue;
      const camPos=viewer.camera.positionCartographic;
      let visibleReady=0, visibleLoading=0, total=0;
      const stack=[p.root]; const seen=new Set();
      while(stack.length){
        const t=stack.pop();
        if(!t||seen.has(t)) continue; seen.add(t);
        if(t.content||t._content){
          total++;
          // Cesium3DTile._finalResolution: tile 实际可见时会算屏幕误差
          const visible = t._finalResolution===true || (t._screenSpaceError!==undefined && t._screenSpaceError < p.maximumScreenSpaceError);
          if(t._contentState===3) visibleReady++;
          else if(t._contentState===1) visibleLoading++;
        }
        if(t.children) for(const c of t.children) stack.push(c);
      }
      return {cameraH:camPos.height, totalContent:total, ready:visibleReady, loading:visibleLoading, sse:p.maximumScreenSpaceError, memMB:(p.totalMemoryUsageInBytes/1048576).toFixed(0)};
    }
    return {error:'no tileset'};
  })()`)
  console.log(label,'→ visible:',JSON.stringify(vis))
  const ss=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:88})
  const fn=label.replace(/\s+/g,'_')+'.jpg'
  fs.writeFileSync(path.join(OUT_DIR,fn),Buffer.from(ss.data,'base64'))
  console.log('  screenshot:',fn)
  return vis
}

async function main() {
  const targets=await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  const t=targets.find(x=>x.type==='page')
  const ws=new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r,x)=>{ws.addEventListener('open',()=>r());ws.addEventListener('error',e=>x(new Error(e.message||'ws')))})
  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  // 不 reload，用当前已加载好的状态
  const ready=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer)`)
  if(!ready){console.log('viewer not ready, waiting...');for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,3000));if(await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer)`))break}}

  // 模型锚点 113.569463, 34.76965, h=8
  // 4 个视角：俯瞰、低空斜视、东向、西向
  await flyAndShot(ws,'overview_500m_45', 113.569463, 34.76965, 500, -45)
  await flyAndShot(ws,'closeup_120m_40', 113.569463, 34.76965, 120, -40)
  await flyAndShot(ws,'east_view_200m_15', 113.5720, 34.76965, 200, -15)
  await flyAndShot(ws,'west_view_200m_15', 113.5668, 34.76965, 200, -15)

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
