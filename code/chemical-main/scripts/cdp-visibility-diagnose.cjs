// CDP: 多视角诊断"建筑物看不见"的真实原因
// 统计：READY 总数、真正被渲染的 tile 数、被 SSE 裁掉的 tile 数、被 frustum 裁掉的 tile 数
// 同时输出每个视角的相机高度、SSE、内存、boundingSphere 与相机距离
const http = require('http')
const fs = require('fs')
const path = require('path')

const CDP_PORT = 9223
const OUT_DIR = path.resolve(__dirname, '..', 'logs')

function getJson(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
async function cdpCall(ws,method,params={}){const id=cdpCall._id=(cdpCall._id||0)+1;return new Promise((res,rej)=>{const on=(ev)=>{const t=typeof ev==='string'?ev:(ev.data||'');let m;try{m=JSON.parse(t)}catch{return}if(m.id===id){ws.removeEventListener('message',on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};ws.addEventListener('message',on);ws.send(JSON.stringify({id,method,params}))})}
async function evalJS(ws,expr){const r=await cdpCall(ws,'Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.value}

async function flyAndProbe(ws,label,lon,lat,height,pitch){
  await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D;
    if(!viewer||!C) return 'no viewer';
    const dest=C.Cartesian3.fromDegrees(${lon},${lat},${height});
    viewer.camera.flyTo({destination:dest, duration:1.5, orientation:{heading:0, pitch:C.Math.toRadians(${pitch}), roll:0}});
    return 'ok';
  })()`)
  await new Promise(r=>setTimeout(r,3500))

  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D||{};
    if(!viewer) return {error:'no viewer'};
    const camPos=viewer.camera.positionCartographic;
    const camCart=viewer.camera.position;
    let result={tilesets:[]};
    const prims=viewer.scene.primitives;
    for(let i=0;i<prims.length;i++){
      const p=prims.get(i);
      if(!p||!p.root) continue;
      // Cesium TileContentState: 0 UNLOADED, 1 LOADING, 2 LOADED, 3 READY, 4 FAILED
      const stateName=['UNLOADED','LOADING','LOADED','READY','FAILED'];
      let stats={UNLOADED:0,LOADING:0,LOADED:0,READY:0,FAILED:0,total:0};
      // 分类：真正参与渲染 / 被 SSE 裁 / 被 frustum 裁 / 未加载
      let rendered=0, culledBySse=0, culledByFrustum=0, notReady=0;
      const camDir=new C.Cartesian3();
      if(C.Cartesian3.subtract) C.Cartesian3.subtract(camCart, viewer.camera.positionWC || camCart, camDir);
      let bsInfo=null;
      if(p.boundingSphere){
        const bs=p.boundingSphere;
        const dist=C.Cartesian3.distance(camCart, bs.center);
        bsInfo={radius:bs.radius, distToCam:dist};
      }
      const frustumCulledCount=0;
      const stack=[p.root]; const seen=new Set();
      while(stack.length){
        const t=stack.pop();
        if(!t||seen.has(t)) continue; seen.add(t);
        const cs=t._contentState;
        if(t.content||t._content){
          stats.total++;
          if(cs>=0&&cs<5) stats[stateName[cs]]++;
          if(cs===3){
            // READY：再看是否被渲染
            // _finalResolution=true 表示本帧该 tile 被选中渲染
            // _visible=false 表示被 frustum 裁
            // _screenSpaceError < SSE 表示细节够（该渲染）
            const renderedFlag = t._finalResolution===true;
            const sse = typeof t._screenSpaceError==='number' ? t._screenSpaceError : null;
            const visible = t._visible;
            if(renderedFlag){rendered++;}
            else if(visible===false){culledByFrustum++;}
            else if(sse!==null && sse < p.maximumScreenSpaceError){culledBySse++; /*细节够但没被选中，通常是被更精细的子节点替代或被 SSE 降级*/}
            else {notReady++;}
          }
        }
        if(t.children) for(const c of t.children) stack.push(c);
      }
      result.tilesets.push({
        maximumScreenSpaceError:p.maximumScreenSpaceError,
        dynamicScreenSpaceError:p.dynamicScreenSpaceError,
        dynamicScreenSpaceErrorFactor:p.dynamicScreenSpaceErrorFactor,
        cacheBytes:p.cacheBytes,
        totalMemoryUsageInBytes:p.totalMemoryUsageInBytes,
        memMB:(p.totalMemoryUsageInBytes/1048576).toFixed(0),
        tilesLoaded:p._tilesLoaded,
        bs:bsInfo,
        stats,
        rendered,
        culledBySse,
        culledByFrustum,
        notReady,
        camH:camPos.height,
        colorBlendAmount:p.colorBlendAmount,
        colorBlendMode:p.colorBlendMode,
        show:p.show,
      });
    }
    return result;
  })()`)
  console.log(label,'→',JSON.stringify(probe))
  // 截图
  const ss=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:88})
  const fn=label.replace(/\s+/g,'_')+'.jpg'
  fs.writeFileSync(path.join(OUT_DIR,'vis_'+fn),Buffer.from(ss.data,'base64'))
  return probe
}

async function main() {
  const targets=await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  const t=targets.find(x=>x.type==='page')
  if(!t){console.error('no page target');process.exit(1)}
  const ws=new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r,x)=>{ws.addEventListener('open',()=>r());ws.addEventListener('error',e=>x(new Error(e.message||'ws')))})
  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  const ready=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer)`)
  if(!ready){console.log('viewer not ready, waiting...');for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,3000));if(await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer)`))break}}

  const results={}
  results.overview=await flyAndProbe(ws,'overview_500m_45', 113.569463, 34.76965, 500, -45)
  results.closeup=await flyAndProbe(ws,'closeup_120m_40', 113.569463, 34.76965, 120, -40)
  results.east=await flyAndProbe(ws,'east_view_200m_15', 113.5720, 34.76965, 200, -15)
  results.west=await flyAndProbe(ws,'west_view_200m_15', 113.5668, 34.76965, 200, -15)

  fs.writeFileSync(path.join(OUT_DIR,'cdp-visibility-diagnose.json'),JSON.stringify(results,null,2))
  console.log('\nsaved: logs/cdp-visibility-diagnose.json')

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
