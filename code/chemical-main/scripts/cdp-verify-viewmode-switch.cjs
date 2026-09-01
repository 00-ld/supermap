// CDP: verify the digital park can swap its 3D primary view and 2D inset.
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

  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  console.log('navigating to /screen ...')
  await evalJS(ws,`location.hash='#/screen'`)
  await new Promise(r=>setTimeout(r,8000))

  // 状态1: 默认应为三维主屏、二维副屏。
  const s1=await evalJS(ws,`(()=>{
    const root=document.querySelector('.screen-entry')
    const scene3d=document.querySelector('.screen-scene')
    const map2d=document.querySelector('.screen-route-navigation')
    return {
      url:location.href,
      hasScene3d:!!scene3d,
      hasMap2d:!!map2d,
      twoDPrimary:!!root?.classList.contains('two-d-primary'),
    }
  })()`)
  console.log('STATE-1 (expect 3D primary):',JSON.stringify(s1,null,2))

  // 点击二维副屏，将二维切为主屏。
  const click=await evalJS(ws,`(()=>{
    const map2d=document.querySelector('.screen-route-navigation')
    if(!map2d) return 'no 2D inset'
    map2d.click()
    return 'clicked 2D inset'
  })()`)
  console.log('CLICK:',click)

  await new Promise(r=>setTimeout(r,1500))

  const s2=await evalJS(ws,`(()=>{
    const root=document.querySelector('.screen-entry')
    const scene3d=document.querySelector('.screen-scene')
    const map2d=document.querySelector('.screen-route-navigation')
    return {
      hasScene3d:!!scene3d,
      hasMap2d:!!map2d,
      twoDPrimary:!!root?.classList.contains('two-d-primary'),
      bodyTail:document.body.innerText.slice(-300),
    }
  })()`)
  console.log('STATE-2 (expect 2D primary):',JSON.stringify(s2,null,2))

  const ss=await cdpCall(ws,'Page.captureScreenshot',{format:'jpeg',quality:92})
  fs.writeFileSync(path.join(OUT_DIR,'screen-view-switch.jpg'),Buffer.from(ss.data,'base64'))
  console.log('screenshot saved: screen-view-switch.jpg')

  // 点击三维副屏，切回三维主屏。
  const click2=await evalJS(ws,`(()=>{
    const scene3d=document.querySelector('.screen-scene')
    if(!scene3d) return 'no 3D inset'
    scene3d.click()
    return 'clicked 3D inset'
  })()`)
  console.log('CLICK2:',click2)
  await new Promise(r=>setTimeout(r,3000))
  const s3=await evalJS(ws,`(()=>{
    const root=document.querySelector('.screen-entry')
    return {
      twoDPrimary:!!root?.classList.contains('two-d-primary'),
    }
  })()`)
  console.log('STATE-3 (expect 3D primary):',JSON.stringify(s3,null,2))

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
