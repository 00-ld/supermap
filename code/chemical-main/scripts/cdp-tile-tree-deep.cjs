// CDP: 深度遍历 tileset tile 树，抓每个 content tile 的真实状态、uri、错误原因
// 区分：UNLOADED(0)/CONTENT_LOADING(1)/CONTENT_LOADED(2)/READY(3)/FAILED(4) (Cesium TileState 常量)
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

  console.log('checking current tileset state (no reload)...')
  const probe=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return {error:'no viewer'};
    let out={tilesets:[]};
    const prims=viewer.scene.primitives;
    for(let i=0;i<prims.length;i++){
      const p=prims.get(i);
      if(!p||!p.root) continue;
      const C=window.Cesium||window.SuperMap3D||{};
      // Cesium TileContentState: 0 UNLOADED, 1 LOADING, 2 LOADED, 3 READY, 4 FAILED
      const stateName=['UNLOADED','LOADING','LOADED','READY','FAILED'];
      const stats={UNLOADED:0,LOADING:0,LOADED:0,READY:0,FAILED:0,total:0};
      const failedTiles=[];
      const allTiles=[];
      const stack=[p.root];
      const seen=new Set();
      while(stack.length){
        const t=stack.pop();
        if(!t||seen.has(t)) continue;
        seen.add(t);
        const contentState = t._contentState!==undefined ? t._contentState
                          : (t.contentReady!==undefined ? (t.contentReady?3:1) : -1);
        const uri = t.content&&t.content.uri ? t.content.uri
                   : (t._content&&t._content.uri ? t._content.uri : null);
        if(t.content||t._content){
          stats.total++;
          if(contentState>=0&&contentState<5) stats[stateName[contentState]]++;
          if(contentState===4){
            failedTiles.push({uri, state:contentState, hasContent:!!(t.content||t._content)});
          }
          allTiles.push({uri:uri?uri.slice(-60):null, state:stateName[contentState]||(''+contentState), geErr:t.geometricError});
        }
        if(t.children) for(const c of t.children) stack.push(c);
      }
      out.tilesets.push({
        maximumScreenSpaceError:p.maximumScreenSpaceError,
        cacheBytes:p.cacheBytes,
        maximumMemoryUsage:p.maximumMemoryUsage,
        totalMemoryUsageInBytes:p.totalMemoryUsageInBytes,
        tilesLoaded:p._tilesLoaded,
        stats,
        failedSample: failedTiles.slice(0,10),
        failedCount: failedTiles.length,
      });
    }
    return out;
  })()`)
  console.log('TILE TREE STATE:',JSON.stringify(probe,null,2))
  fs.writeFileSync(path.join(OUT_DIR,'cdp-tile-tree-deep.json'),JSON.stringify(probe,null,2))
  console.log('saved: logs/cdp-tile-tree-deep.json')

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
