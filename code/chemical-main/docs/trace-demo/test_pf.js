/* 多点测试 PF 精度与稳定性（纯数值，定位问题）。*/
const R_GAS=8.314462618, MPU=0.5, CELL_M=10, MIX_H=3.0, M_MOL=28.97, Q_SOURCE=50;
const WIND_EXP={A:0.07,B:0.07,C:0.10,D:0.15,E:0.35,F:0.55};
function effWind(w10,h=2,stab='D',ref=10){ return Math.max(w10*Math.pow(Math.max(h,1)/ref,WIND_EXP[stab]),0.3); }
function effDiffusivity(w,cellM){ return Math.max((0.35+0.12*w*cellM+0.10*2e-5*1e5)*1,0.05); }
function massToPpm(c,M,T,P){ return c*R_GAS*T/(M*P)*1e6; }
function sensorResponse(sx,sy,px,py,Q,env){ const a=env.windDirDeg*Math.PI/180,dx=px-sx,dy=py-sy;
  const alongM=(dx*Math.cos(a)+dy*Math.sin(a))*env.mpu; if(alongM<=0) return 0;
  const crossM=(-dx*Math.sin(a)+dy*Math.cos(a))*env.mpu, u=Math.max(env.effWind,0.3), travel=Math.max(alongM/u,1e-6);
  const sigma=Math.sqrt(Math.max(2*env.kEff*travel,env.cellM*env.cellM*0.25))*3;
  const norm=Math.max(Q,0)/(Math.sqrt(2*Math.PI)*sigma*u*Math.max(env.mixH,0.5));
  return massToPpm(norm*Math.exp(-(crossM*crossM)/(2*sigma*sigma)),env.M,env.T,env.P); }
function buildEnv(w){ const projDir=(w.wind360+90)%360, ew=effWind(w.windSpeed,2,'D',10);
  return {windDirDeg:projDir,effWind:ew,kEff:effDiffusivity(ew,CELL_M),mpu:MPU,cellM:CELL_M,mixH:MIX_H,M:M_MOL,T:w.temp+273.15,P:w.pressure*100}; }
function mulberry32(s){ return function(){ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function buildSensors(){ const r=mulberry32(98765), out=[]; for(let j=0;j<5;j++) for(let i=0;i<6;i++){ const bx=60+(i+0.5)*880/6, by=60+(j+0.5)*530/5;
  out.push({x:Math.max(50,Math.min(950,bx+(r()-0.5)*60)), y:Math.max(50,Math.min(600,by+(r()-0.5)*50))}); } return out; }
const env=buildEnv({windSpeed:6.9,wind360:180,temp:33,pressure:1003});
const sensors=buildSensors();
let leak, observed, arrival;
function setup(lx,ly){ leak={x:lx,y:ly}; const ca=Math.cos(env.windDirDeg*Math.PI/180), sa=Math.sin(env.windDirDeg*Math.PI/180);
  const noiseR=mulberry32(7);
  observed=sensors.map(s=>{ const c=sensorResponse(lx,ly,s.x,s.y,Q_SOURCE,env); return Math.max(c+noiseR()*0.1*Math.max(c,1e-3)-0.05*Math.max(c,1e-3),0); });
  arrival=sensors.map((s,i)=>{ const dx=s.x-lx,dy=s.y-ly; const alongM=(dx*ca+dy*sa)*env.mpu; if(alongM<=0||observed[i]<0.3) return null; return Math.max(alongM/Math.max(env.effWind,0.3)+(noiseR()-0.5)*10,1); }); }
function concLogL(P){ return P.map(p=>{ let s=0; for(let j=0;j<sensors.length;j++){ const pred=sensorResponse(p[0],p[1],sensors[j].x,sensors[j].y,p[2],env); const o=observed[j];
  const sig=Math.sqrt((0.1*Math.max(o,1e-4))**2+(0.05*Math.max(Math.abs(pred),o,1e-4))**2+1e-8); s+=-0.5*((pred-o)/sig)**2-0.5*Math.log(2*Math.PI*sig*sig); } return s; }); }
function arrivalLogL(P){ const ca=Math.cos(env.windDirDeg*Math.PI/180),sa=Math.sin(env.windDirDeg*Math.PI/180),u=Math.max(env.effWind,0.5);
  const timed=[]; for(let i=0;i<sensors.length;i++) if(arrival[i]!=null) timed.push({s:sensors[i],a:arrival[i]});
  if(timed.length<2) return new Array(P.length).fill(0);
  const sigma=6, obsArr=timed.map(t=>t.a), obsMin=Math.min(...obsArr);
  return P.map(p=>{ const predArr=timed.map(t=>{const dx=t.s.x-p[0],dy=t.s.y-p[1];const alongM=(dx*ca+dy*sa)*env.mpu;return Math.max(alongM,0)/u;});
    let abs=0; for(let k=0;k<predArr.length;k++) abs+=((predArr[k]-timed[k].a)/sigma)**2; abs/=predArr.length;
    const predMin=Math.min(...predArr); let rel=0; for(let k=0;k<predArr.length;k++) rel+=((predArr[k]-predMin)-(obsArr[k]-obsMin))/sigma; rel/=predArr.length; rel*=rel;
    return -0.5*6.0*timed.length*(0.65*abs+0.35*rel); }); }
function computeLogL(P){ const c=concLogL(P), ar=arrivalLogL(P); return c.map((v,i)=>v+ar[i]); }
function normalizeLogs(lw){ const mx=Math.max(...lw), w=lw.map(v=>Math.exp(v-mx)); const s=w.reduce((a,b)=>a+b,0); return w.map(v=>v/(s||1)); }
function sysResample(P,W,r){ const N=P.length, cum=new Array(N); let c=0; for(let i=0;i<N;i++){c+=W[i];cum[i]=c;} const u0=r()/N, out=new Array(N);
  for(let i=0;i<N;i++){ const p=u0+i/N; let lo=0,hi=N-1; while(lo<hi){ const m=(lo+hi)>>1; if(cum[m]<p) lo=m+1; else hi=m; } out[i]=P[lo].slice(); } return out; }
function weightedMean(P,W){ let x=0,y=0,q=0; for(let i=0;i<P.length;i++){x+=W[i]*P[i][0];y+=W[i]*P[i][1];q+=W[i]*P[i][2];} return [x,y,q]; }
function mcmcRejuvenate(P,logL,beta,r){ let acc=0; for(let i=0;i<P.length;i++){ const prop=[Math.max(40,Math.min(960,P[i][0]+(r()-0.5)*40)),Math.max(40,Math.min(610,P[i][1]+(r()-0.5)*40)),Math.max(0.1,Math.min(1e5,P[i][2]*Math.exp((r()-0.5)*0.6)))];
    let pl=0; for(let j=0;j<sensors.length;j++){ const pred=sensorResponse(prop[0],prop[1],sensors[j].x,sensors[j].y,prop[2],env); const o=observed[j]; const sig=Math.sqrt((0.1*Math.max(o,1e-4))**2+(0.05*Math.max(Math.abs(pred),o,1e-4))**2+1e-8); pl+=-0.5*((pred-o)/sig)**2; }
    if(Math.log(r()+1e-300)<beta*(pl-logL[i])){ P[i]=prop; logL[i]=pl; acc++; } } return acc/P.length; }
function runPF(N=1000,iters=24){ const r=mulberry32(42); let P=[], W=new Array(N).fill(1/N);
  for(let i=0;i<N;i++) P.push([40+r()*920, 40+r()*570, Math.exp(Math.log(0.1)+r()*(Math.log(1e5)-Math.log(0.1)))]);
  let logL=computeLogL(P), beta=0;
  for(let it=0;it<iters;it++){ const bn=(it+1)/iters; for(let i=0;i<N;i++) W[i]=Math.log(W[i]+1e-300)+(bn-beta)*logL[i]; W=normalizeLogs(W); beta=bn;
    let ess=0; for(const w of W) ess+=w*w; ess=1/ess; if(ess<0.5*N){ P=sysResample(P,W,r); W=new Array(N).fill(1/N); logL=computeLogL(P); mcmcRejuvenate(P,logL,beta,r); } }
  return weightedMean(P,W); }
const points=[[400,450],[300,500],[500,450],[350,520],[550,480],[250,400],[450,350],[600,500],[330,420]];
let t0=Date.now();
for(const [lx,ly] of points){ setup(lx,ly);
  const triggered=arrival.filter(a=>a!=null).length;
  try{ const est=runPF(); const err=Math.hypot(est[0]-lx,est[1]-ly)*MPU;
    console.log(`点(${lx},${ly}) 触发${triggered}/16 → 算出(${est[0].toFixed(0)},${est[1].toFixed(0)}) 误差${err.toFixed(1)}m Q=${est[2].toFixed(1)} 命中${err<=15}`); }
  catch(e){ console.log(`点(${lx},${ly}) 触发${triggered}/16 → ERROR: ${e.message}`); } }
console.log('总耗时:', (Date.now()-t0)/9|0, 'ms/点');
