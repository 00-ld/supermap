// CDP: 检查 /screen 页面当前状态——有没有报错、viewer 是否存在、hash 是什么
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
    }
  })

  await cdpCall(ws,'Runtime.enable')
  await cdpCall(ws,'Page.enable')

  // 不导航，直接看当前页面状态
  const state=await evalJS(ws,`(()=>{
    const dbg=window.__supermapCupDebug||{};
    return {
      url:location.href,
      hash:location.hash,
      hasDebug:!!window.__supermapCupDebug,
      hasViewer:!!dbg.viewer,
      viewerKeys:dbg.viewer?Object.keys(dbg.viewer).slice(0,10):[],
      canvasCount:document.querySelectorAll('canvas').length,
      bodyTextLen:document.body.innerText.length,
      bodyTail:document.body.innerText.slice(-400),
    };
  })()`)
  console.log('CURRENT STATE:',JSON.stringify(state,null,2))

  // 尝试强制 reload
  console.log('\n--- forcing hard reload ---')
  await evalJS(ws,`location.reload()`)

  // 等待 viewer
  let viewerReady=false
  for(let i=0;i<40;i++){
    await new Promise(r=>setTimeout(r,3000))
    const v=await evalJS(ws,`!!(window.__supermapCupDebug&&window.__supermapCupDebug.viewer&&window.__supermapCupDebug.viewer.entities)`)
    if(v){viewerReady=true; console.log('viewer ready after', (i+1)*3, 's post-reload'); break}
  }
  if(!viewerReady){
    console.log('still no viewer. dumping last 20 console logs:')
    console.log(logs.slice(-20).join('\n'))
  } else {
    await new Promise(r=>setTimeout(r,15000))
  }

  ws.close();process.exit(0)
}
main().catch(e=>{console.error('FATAL',e.message,e.stack);process.exit(1)})
