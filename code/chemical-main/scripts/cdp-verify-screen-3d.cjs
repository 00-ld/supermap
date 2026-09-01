// CDP: drive /screen (data dashboard) which actually mounts SuperMapSceneViewer + 3D Tiles.
// Trigger evacuation, capture [F2]/[F6] probes + screenshot.
const http = require('http')
const fs = require('fs')
const path = require('path')

const CDP_PORT = 9223
const TARGET_URL = 'http://127.0.0.1:5173/#/screen'
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
      if(/\[F2\]|\[F6\]|网络分析|降级|evacuation|render-chain|georefTransformLen|越界|tileset|b3dm|3dtiles|路径|疏散/i.test(entry)){
        console.log('PROBE>',entry.slice(0,400))
      }
    }
  })

  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  console.log('navigating to /screen ...')
  await evalJS(ws,`location.hash='#/screen'`)
  // give 3D model time to stream (1.1G b3dm)
  console.log('waiting 40s for 3D model stream...')
  await new Promise(r=>setTimeout(r,40000))

  const state1=await evalJS(ws,`(()=>{
    const cv=document.querySelector('canvas');
    const scene=document.querySelector('.supermap-scene-viewer, .cesium-viewer, [class*="scene"]');
    const btns=[...document.querySelectorAll('button, .el-button, [role="button"], [class*="btn"]')]
    return {
      url:location.href,
      hasCanvas:!!cv,
      canvasSize:cv?(cv.width+'x'+cv.height):'none',
      hasScene:!!scene,
      sceneClass:scene?(scene.className||'').toString().slice(0,80):'',
      evacBtns:btns.filter(b=>/疏散|evacuation|路径|建筑/i.test(b.textContent||'')).map(b=>(b.textContent||'').trim().slice(0,40)+'[d='+b.disabled+']'),
      title:document.title,
      bodyTextLen:document.body.innerText.length,
    }
  })()`)
  console.log('SCREEN STATE:',JSON.stringify(state1,null,2))

  // click evacuation trigger
  const clickRes=await evalJS(ws,`(()=>{
    const btns=[...document.querySelectorAll('button, .el-button, [role="button"], [class*="btn"]')];
    const cands=btns.filter(b=>/疏散|evacuation|路径|建筑/i.test(b.textContent||''));
    const target=cands.find(b=>/当前建筑|疏散|建筑路径/i.test(b.textContent||''))||cands[0];
    if(target){target.click();return 'clicked: '+(target.textContent||'').trim().slice(0,60)}
    return 'no evac button; btns='+btns.length;
  })()`)
  console.log('CLICK:',clickRes)

  console.log('waiting 18s for path render...')
  await new Promise(r=>setTimeout(r,18000))

  const ss=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:95})
  fs.writeFileSync(path.join(OUT_DIR,'screen-3d-path.jpg'),Buffer.from(ss.data,'base64'))
  console.log('screenshot saved: screen-3d-path.jpg')

  // final probe: count polyline entities / primitives if exposed
  const finalState=await evalJS(ws,`(()=>{
    const cv=document.querySelector('canvas');
    return {
      hasCanvas:!!cv,
      canvasSize:cv?(cv.width+'x'+cv.height):'none',
      bodyTextTail:document.body.innerText.slice(-600),
    }
  })()`)
  console.log('FINAL:',JSON.stringify(finalState,null,2))

  const probeLogs=logs.filter(l=>/\[F2\]|\[F6\]|网络分析|降级|evacuation|render-chain|georefTransformLen|越界|tileset|b3dm|3dtiles|路径|疏散|不可达/i.test(l))
  fs.writeFileSync(path.join(OUT_DIR,'screen-cdp-logs.txt'),logs.join('\n')+'\n\n=== PROBE ===\n'+probeLogs.join('\n'))
  console.log('logs saved. total='+logs.length+' probe='+probeLogs.length)

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
