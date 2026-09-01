// CDP: explore smart-map UI to find 3D toggle + building selection.
const http = require('http')
const CDP_PORT = 9223

function getJson(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
async function cdpCall(ws,method,params={}){const id=cdpCall._id=(cdpCall._id||0)+1;return new Promise((res,rej)=>{const on=(ev)=>{const t=typeof ev==='string'?ev:(ev.data||'');let m;try{m=JSON.parse(t)}catch{return}if(m.id===id){ws.removeEventListener('message',on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};ws.addEventListener('message',on);ws.send(JSON.stringify({id,method,params}))})}
async function evalJS(ws,expr){const r=await cdpCall(ws,'Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.value}

(async()=>{
  const targets=await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  const t=targets.find(x=>x.type==='page')
  const ws=new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r,x)=>{ws.addEventListener('open',()=>r());ws.addEventListener('error',e=>x(new Error(e.message||'ws')))})
  await cdpCall(ws,'Runtime.enable')

  // 列出所有按钮、tab、可点击图标
  const ui=await evalJS(ws,`(()=>{
    const all=[...document.querySelectorAll('button, .el-button, .el-tab, [role="tab"], [class*="tab"], [class*="3d"], [class*="3D"], [class*="scene"], [class*="cesium"], [class*="三维"], [class*="toggle"], i[class*="icon"], [class*="switch"]')]
    return all.slice(0,80).map(e=>({
      tag:e.tagName,
      cls:(e.className||'').toString().slice(0,80),
      txt:(e.textContent||'').trim().slice(0,40),
      title:e.title||'',
    })).filter(o=>o.txt||o.title||/3d|三维|scene|cesium|tab|switch/i.test(o.cls))
  })()`)
  console.log('UI ELEMENTS:')
  ui.forEach((u,i)=>console.log(`${i}: <${u.tag}> cls="${u.cls}" txt="${u.txt}" title="${u.title}"`))

  // 看 leaflet 地图上有多少 building 图层 / 要素
  const bld=await evalJS(ws,`(()=>{
    // 检查 leaflet 全局
    const hasL=typeof window.L!=='undefined';
    let layers=[];
    try{
      // 尝试找 leaflet map 实例
      const mapEl=document.querySelector('.leaflet-container');
      if(mapEl && mapEl._leaflet_id){
        // 找所有 path / polygon
        const paths=document.querySelectorAll('.leaflet-overlay-pane path, .leaflet-overlay-pane image');
        layers.push('paths:'+paths.length);
      }
    }catch(e){layers.push('err:'+e.message)}
    return {hasLeaflet:hasL, mapEl:!!document.querySelector('.leaflet-container'), layers};
  })()`)
  console.log('LEAFLET:',JSON.stringify(bld))

  // 找"三维"相关切换或入口,以及路由
  const route3d=await evalJS(ws,`(()=>{
    const links=[...document.querySelectorAll('a, [class*="menu"], [class*="nav"], .el-menu-item')]
    return links.map(a=>({txt:(a.textContent||'').trim().slice(0,30),href:a.getAttribute('href')||'',cls:(a.className||'').toString().slice(0,50)})).filter(o=>/3d|三维|scene|球|园区|地图|数字/i.test(o.txt+o.cls)).slice(0,20)
  })()`)
  console.log('NAV TO 3D:')
  route3d.forEach(r=>console.log(JSON.stringify(r)))

  ws.close();process.exit(0)
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)})
