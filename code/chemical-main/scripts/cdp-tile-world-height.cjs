// CDP: 查每个 tile 的实际世界坐标(ECEF)高度范围，转地理高度，对比地表 anchor.height=8m
// 诊断：是否有建筑穿地（顶部/底部高度异常）
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

  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    const C=window.Cesium||window.SuperMap3D||{};
    if(!viewer) return {error:'no viewer'};
    const ecefToGeo=(x,y,z)=>{
      const a=6378137.0, e2=6.69437999014e-3;
      const p=Math.sqrt(x*x+y*y);
      let lat=Math.atan2(z, p*(1-e2));
      for(let i=0;i<8;i++){
        const N=a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
        const h=p/Math.cos(lat)-N;
        lat=Math.atan2(z, p*(1-e2*(N/(N+h))));
      }
      const lon=Math.atan2(y,x);
      const N=a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
      const h=p/Math.cos(lat)-N;
      return {lon:C.Math.toDegrees(lon), lat:C.Math.toDegrees(lat), h};
    };
    let out={tilesets:[]};
    const prims=viewer.scene.primitives;
    for(let i=0;i<prims.length;i++){
      const p=prims.get(i);
      if(!p||!p.root) continue;
      // 收集所有 READY content tile 的 boundingSphere（世界坐标）和 transform
      const tiles=[];
      let minH=Infinity, maxH=-Infinity, minLat=Infinity, maxLat=-Infinity, minLon=Infinity, maxLon=-Infinity;
      const stack=[p.root]; const seen=new Set();
      while(stack.length){
        const t=stack.pop();
        if(!t||seen.has(t)) continue; seen.add(t);
        if((t.content||t._content) && t._contentState===3){
          // tile 的 boundingSphere 是世界坐标(ECEF)
          let bs=t.boundingSphere||t._boundingSphere;
          let info={uri:null, readyState:t._contentState};
          if(t.content&&t.content.uri) info.uri=t.content.uri.slice(-50);
          if(bs){
            const c=ecefToGeo(bs.center.x, bs.center.y, bs.center.z);
            info.bsCenterGeo=c;
            info.bsRadius=bs.radius;
            info.bsCenterEcef={x:bs.center.x,y:bs.center.y,z:bs.center.z};
            if(c.h<minH) minH=c.h;
            if(c.h>maxH) maxH=c.h;
            if(c.lat<minLat) minLat=c.lat;
            if(c.lat>maxLat) maxLat=c.lat;
            if(c.lon<minLon) minLon=c.lon;
            if(c.lon>maxLon) maxLon=c.lon;
          }
          // tile 自身的 transform（本地到世界）
          if(t.transform){
            const tm=t.transform;
            info.transformLastColumn={x:tm[12],y:tm[13],z:tm[14]}; // 平移分量=ECEF
            const tEcef=ecefToGeo(tm[12],tm[13],tm[14]);
            info.transformOriginGeo=tEcef;
          }
          tiles.push(info);
        }
        if(t.children) for(const c of t.children) stack.push(c);
      }
      // tileset root transform
      const rt=p.root&&p.root.transform?p.root.transform:null;
      let rootOrigin=null;
      if(rt){
        rootOrigin=ecefToGeo(rt[12],rt[13],rt[14]);
      }
      // tileset 自己的 boundingSphere
      let pbs=null;
      if(p.boundingSphere){
        pbs={radius:p.boundingSphere.radius, centerEcef:{x:p.boundingSphere.center.x,y:p.boundingSphere.center.y,z:p.boundingSphere.center.z}};
        pbs.centerGeo=ecefToGeo(p.boundingSphere.center.x,p.boundingSphere.center.y,p.boundingSphere.center.z);
      }
      out.tilesets.push({
        tileCount:tiles.length,
        rootTransformOriginGeo:rootOrigin,
        rootBS:pbs,
        tileHeightRange:{minH, maxH, span:maxH-minH},
        tileLatRange:{minLat, maxLat},
        tileLonRange:{minLon, maxLon},
        sampleTiles:tiles.slice(0,8),
      });
    }
    return out;
  })()`)
  console.log(JSON.stringify(probe,null,2))
  fs.writeFileSync(path.join(OUT_DIR,'cdp-tile-world-height.json'),JSON.stringify(probe,null,2))
  console.log('saved: logs/cdp-tile-world-height.json')

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
