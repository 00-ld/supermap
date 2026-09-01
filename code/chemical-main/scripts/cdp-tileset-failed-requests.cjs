// CDP: 抓 /screen 3D 模型加载的失败请求（404/超时/网络错误）+ tileset 加载状态
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

  const failedReq=[]
  const allPicReq=[]
  ws.addEventListener('message',(ev)=>{
    const text=typeof ev.data==='string'?ev.data:ev.data.toString()
    let msg
    try{msg=JSON.parse(text)}catch{return}
    if(msg.method==='Network.loadingFailed'){
      const u=msg.params.requestId
      failedReq.push({url:msg.params.url||u,blockedReason:msg.params.blockedReason,errorText:msg.params.errorText,type:msg.params.type})
    }
    if(msg.method==='Network.responseReceived'){
      const r=msg.params.response
      if(r&&r.url&&r.url.indexOf('/pic/chemical-park-3dtiles/')>=0){
        const status=r.status
        if(status>=400||status===0){allPicReq.push({url:r.url,status})}
      }
    }
  })

  await cdpCall(ws,'Network.enable')
  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  // 触发一次 reload 让所有请求重发
  console.log('reloading /screen to capture all 3D Tiles requests...')
  await evalJS(ws,`location.hash='#/screen'; location.reload()`)
  await new Promise(r=>setTimeout(r,5000))

  // 等 viewer + tileset 流式加载
  let viewerReady=false
  for(let i=0;i<40;i++){
    await new Promise(r=>setTimeout(r,3000))
    const v=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer&&window.__supermapCupDebug.viewer.entities)`)
    if(v){viewerReady=true; console.log('viewer ready after',(i+1)*3,'s'); break}
  }
  if(!viewerReady){console.log('viewer NOT ready')}

  // 额外等 tileset 流式加载完
  console.log('waiting 40s for tileset streaming...')
  await new Promise(r=>setTimeout(r,40000))

  // 抓 tileset primitive 状态
  const tilesetState=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    const viewer=dbg.viewer;
    if(!viewer) return {error:'no viewer'};
    let tilesets=[];
    const prims=viewer.scene.primitives;
    for(let i=0;i<prims.length;i++){
      const p=prims.get(i);
      if(p&&p.root){
        try{
          tilesets.push({
            hasRoot:!!p.root,
            maximumScreenSpaceError:p.maximumScreenSpaceError,
            show:p.show,
            boundingSphereRadius:p.boundingSphere?p.boundingSphere.radius:null,
            tilesLoaded:p._tilesLoaded,
            totalMemoryUsageInBytes:p.totalMemoryUsageInBytes,
            rootChildren:p.root&&p.root.children?p.root.children.length:0,
            rootContentUri:p.root&&p.root.content&&p.root.content.uri?p.root.content.uri:null,
            rootChildrenUris:(p.root&&p.root.children?p.root.children.map(c=>c.content&&c.content.uri?c.content.uri:null):[]),
            visibleTiles: (function(){
              // 遍历 tile 树数 visible=true 的叶子
              let count=0; let needLoad=0; let failed=0;
              const stack=[p.root];
              const seen=new Set();
              while(stack.length){
                const t=stack.pop();
                if(!t||seen.has(t)) continue;
                seen.add(t);
                if(t.content&&t.content.uri) {count++;}
                if(t._contentState===3){failed++} // FAILED
                if(t._contentState===1){needLoad++}
                if(t.children) for(const c of t.children) stack.push(c);
              }
              return {contentTiles:count,needLoad:needLoad,failed:failed};
            })(),
          });
        }catch(e){tilesets.push({err:e.message})}
      }
    }
    return {tilesetCount:tilesets.length, tilesets};
  })()`)
  console.log('TILESET STATE:',JSON.stringify(tilesetState,null,2))

  console.log('\n=== FAILED REQUESTS (',failedReq.length,') ===')
  const picFails=failedReq.filter(f=>f.url&&(f.url.indexOf('/pic/')>=0||f.url.indexOf('Tile_')>=0))
  console.log('pic/Tile related fails:',picFails.length)
  picFails.slice(0,40).forEach(f=>console.log('  ',f.errorText||f.blockedReason, f.url))
  fs.writeFileSync(path.join(OUT_DIR,'cdp-tileset-failed-requests.json'),JSON.stringify({failedReq:failedReq.slice(0,200),allPicReq},null,2))
  console.log('\nsaved: logs/cdp-tileset-failed-requests.json')

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
