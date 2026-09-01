/* 验证 index.html：和风自动加载 + 模型名 + 算法指标 + 多点命中。*/
const path=require('path');
const GROOT=require('child_process').execSync('npm root -g',{encoding:'utf8'}).trim();
const puppeteer=require(path.join(GROOT,'puppeteer-core'));
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL='file:///'+path.join(__dirname,'index.html').replace(/\\/g,'/');

async function testPoint(p,x,y,label){
  await p.evaluate((x,y)=>{ setLeak(x,y); goStep(2,false); },x,y);
  await p.waitForFunction('state.pf!=null',{timeout:15000});
  const alg=await p.evaluate(()=>({bt:document.querySelector('#below2 .bt')?.textContent||'', alg:document.getElementById('algGrid')?.innerText.replace(/\n/g,' | ')||''}));
  await p.evaluate(()=>goStep(3,false));
  await new Promise(r=>setTimeout(r,120));
  const r=await p.evaluate(()=>{ const e=state.pf.estimate, l=state.leak;
    return {leak:[l.x.toFixed(0),l.y.toFixed(0)], est:[e[0].toFixed(1),e[1].toFixed(1)], Qfit:state.pf.Qfit.toFixed(1), locErr:state.pf.locErr.toFixed(2),
      trig:state.arrival.filter(a=>a!=null).length, total:state.sensors.length,
      result:document.getElementById('resultGrid').innerText.replace(/\n/g,' | ')}; });
  console.log(`[${label}] 你选:(${r.leak[0]},${r.leak[1]}) → 算出:(${r.est[0]},${r.est[1]}) 误差:${r.locErr}m Q=${r.Qfit}g/s 触发${r.trig}/${r.total} 命中:${parseFloat(r.locErr)<=15}`);
  if(label==='点A'){ console.log('  溯源模型:', alg.bt); console.log('  算法指标:', alg.alg); }
  return r;
}

(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-gpu']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(URL,{waitUntil:'networkidle0'});
  // 等和风自动加载
  await p.waitForFunction("document.querySelector('#weatherCard .wsrc')&&document.querySelector('#weatherCard .wsrc').textContent.includes('和风')",{timeout:15000}).catch(()=>console.log('和风未加载（可能CORS/网络）'));
  const winfo=await p.evaluate(()=>({src:document.querySelector('#weatherCard .wsrc')?.textContent||'', wind:state.weather.windDir+' '+state.weather.windSpeed+'m/s', temp:state.weather.temp+'℃'}));
  console.log('气象:', winfo.src, '|', winfo.wind, winfo.temp);
  await testPoint(p,330,420,'点A-默认');
  await testPoint(p,350,520,'点B-中下');
  await testPoint(p,500,450,'点C-右中');
  await testPoint(p,550,480,'点D-右下');
  await testPoint(p,600,500,'点E-右下角');
  console.log('JS错误:', errs.length? errs.join(' | ') : '无');
  await b.close();
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1);});
