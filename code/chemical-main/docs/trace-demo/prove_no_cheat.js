/* 反作弊证明：同一组观测，改真源标记位置，反演结果应不变（跟观测走，不跟标记走）。*/
const path=require('path');
const GROOT=require('child_process').execSync('npm root -g',{encoding:'utf8'}).trim();
const puppeteer=require(path.join(GROOT,'puppeteer-core'));
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL='file:///'+path.join(__dirname,'index.html').replace(/\\/g,'/');

(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-gpu']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL,{waitUntil:'networkidle0'});
  await p.waitForFunction("document.querySelector('#weatherCard .wsrc')&&document.querySelector('#weatherCard .wsrc').textContent.includes('和风')",{timeout:15000}).catch(()=>{});

  // 第1次：真源 A=(330,420)，生成观测A，反演
  await p.evaluate(()=>{ setLeak(330,420); goStep(2,false); });
  await p.waitForFunction('state.pf!=null',{timeout:15000});
  const r1=await p.evaluate(()=>({leak:[state.leak.x,state.leak.y], est:[state.pf.estimate[0],state.pf.estimate[1]], obs0:state.observed[0].toFixed(2)}));

  // 第2次：不动观测，只把"真源标记"改成 B=(700,200)，重跑反演
  await p.evaluate(()=>{ state.leak={x:700,y:200}; state.pfStale=true; state.pf=null; goStep(2,false); });
  await p.waitForFunction('state.pf!=null',{timeout:15000});
  const r2=await p.evaluate(()=>({leak:[state.leak.x,state.leak.y], est:[state.pf.estimate[0],state.pf.estimate[1]], obs0:state.observed[0].toFixed(2)}));

  // 第3次：真正换源到 C=(500,480)（会重算观测），反演应指向 C
  await p.evaluate(()=>{ setLeak(500,480); goStep(2,false); });
  await p.waitForFunction('state.pf!=null',{timeout:15000});
  const r3=await p.evaluate(()=>({leak:[state.leak.x,state.leak.y], est:[state.pf.estimate[0],state.pf.estimate[1]], obs0:state.observed[0].toFixed(2)}));

  const fmt=v=>'('+v[0].toFixed(1)+','+v[1].toFixed(1)+')';
  console.log('【第1次】真源标记='+fmt(r1.leak)+' 观测M1='+r1.obs0+'ppm → 反演='+fmt(r1.est));
  console.log('【第2次】真源标记改成'+fmt(r2.leak)+' 观测M1仍='+r2.obs0+'ppm（没变）→ 反演='+fmt(r2.est));
  console.log('【第3次】真正换源到'+fmt(r3.leak)+' 观测M1变='+r3.obs0+'ppm → 反演='+fmt(r3.est));
  console.log('');
  const d1=Math.hypot(r1.est[0]-330,r1.est[1]-420);
  const d2=Math.hypot(r2.est[0]-330,r2.est[1]-420);  // 应仍接近 A=(330,420)
  const d2B=Math.hypot(r2.est[0]-700,r2.est[1]-200); // 应远离 B
  const d3=Math.hypot(r3.est[0]-500,r3.est[1]-480);
  console.log('反演到 A(330,420) 距离: 第1次='+d1.toFixed(1)+'m, 第2次='+d2.toFixed(1)+'m（应都小）');
  console.log('第2次反演到 B(700,200) 距离: '+d2B.toFixed(1)+'m（应大→没跟标记走）');
  console.log('第3次反演到 C(500,480) 距离: '+d3.toFixed(1)+'m（应小→换源后跟着观测走）');
  console.log('JS错误:', errs.length? errs.join('|') : '无');
  console.log('');
  console.log(d2<15 && d2B>50 ? '✅ 反作弊验证通过：反演跟观测走，不跟真源标记走' : '❌ 异常');
  await b.close();
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1);});
