// Erzeugt die Bahnen: alte Bahnen + neue, misst die Schwierigkeit, sortiert in 4 Stufen
// und speichert zu jeder Bahn einen sicheren Lösungsschuss (für den Tipp-Knopf).
// Aufruf: node tools/levelgen.cjs <alte-bahnen.json> <ausgabe.json>
const fs=require("fs"),path=require("path");
const phys=fs.readFileSync(path.join(__dirname,"../src/physics.js"),"utf8");
const P=new Function(phys+";return{simulate};")();
const old=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const W=360,H=560,R=Math.PI/180;
const norm=l=>Object.assign({W,H},l);
function count(l){let n=0;for(let a=0;a<360;a+=3)for(let pw=0.5;pw<=7.21;pw+=0.3)if(P.simulate(l,Math.cos(a*R)*pw,Math.sin(a*R)*pw)>=0)n++;return n;}
function solve(l){let best=null;
  for(let a=0;a<360;a+=2)for(let pw=0.5;pw<=7.21;pw+=0.2){const vx=Math.cos(a*R)*pw,vy=Math.sin(a*R)*pw,f=P.simulate(l,vx,vy);if(f<0)continue;
    let ok=0;for(const[da,dp]of[[1.5,0],[-1.5,0],[0,.12],[0,-.12]])if(P.simulate(l,Math.cos((a+da)*R)*(pw+dp),Math.sin((a+da)*R)*(pw+dp))>=0)ok++;
    const s=ok*1000-f;if(!best||s>best.s)best={s,vx:+vx.toFixed(4),vy:+vy.toFixed(4)};}
  return best;}
let seed=+(process.env.SEED||777);
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const ri=(a,b)=>Math.round(a+rnd()*(b-a));
function make(d){
  const v=ri(0,3);let b,hh;
  if(v===0){b=[ri(40,320),ri(490,525)];hh=[ri(40,320),ri(40,90)];}
  else if(v===1){b=[ri(30,60),ri(80,480)];hh=[ri(300,330),ri(80,480)];if(rnd()<.5){b[0]=W-b[0];hh[0]=W-hh[0];}}
  else if(v===2){const Lf=rnd()<.5;b=[Lf?ri(30,70):ri(290,330),ri(480,525)];hh=[Lf?ri(290,330):ri(30,70),ri(35,80)];}
  else{b=[ri(150,210),ri(260,320)];hh=rnd()<.5?[ri(40,320),ri(40,80)]:[ri(40,320),ri(480,520)];}
  if(rnd()<.5){b[1]=H-b[1];hh[1]=H-hh[1];}
  const p=[];
  const nA=ri(1+(d>.3),2+Math.round(d*2.6)),nR=ri(d>.25?1:0,Math.round(d*3.4)),nM=rnd()<0.1+d*0.5?ri(1,1+Math.round(d*1.6)):0;
  const free=(x,y,r)=>{if(x<r+8||x>W-r-8||y<r+8||y>H-r-8)return false;
    if(Math.hypot(x-b[0],y-b[1])<r+40||Math.hypot(x-hh[0],y-hh[1])<r+45)return false;
    for(const q of p){const qx=q.length>4?q[4]:q[0],qy=q.length>4?q[5]:q[1],qr=q.length>4?q[6]+q[2]:q[2];if(Math.hypot(qx-x,qy-y)<qr+r+28)return false;}return true;};
  const place=(r,s)=>{for(let k=0;k<200;k++){const x=ri(30,330),y=ri(60,500);if(free(x,y,r)){p.push([x,y,r,s]);return true;}}return false;};
  {const r=ri(22,30+Math.round(d*24));const mx=Math.round((b[0]+hh[0])/2+ri(-50,50)),my=Math.round((b[1]+hh[1])/2+ri(-50,50));if(free(mx,my,r))p.push([mx,my,r,1]);else place(r,1);}
  for(let i=1;i<nA;i++)place(ri(14,26+Math.round(d*14)),1);
  for(let i=0;i<nR;i++)place(ri(10,18),-1);
  for(let i=0;i<nM;i++){const host=p.filter(q=>q[3]>0&&q.length===4&&q[2]>=22)[i];if(!host)break;
    const Rr=host[2]+ri(35,60);const ok=p.every(q=>q===host||q.length>4||Math.hypot(q[0]-host[0],q[1]-host[1])>Rr+q[2]+26)&&Math.hypot(b[0]-host[0],b[1]-host[1])>Rr+30&&Math.hypot(hh[0]-host[0],hh[1]-host[1])>Rr+30;
    if(!ok)continue;const sp=+(((rnd()<.5?-1:1)*(0.012+rnd()*0.012)).toFixed(3));
    p.push([0,0,ri(9,13),rnd()<.3?-1:1,host[0],host[1],Rr,sp,+(rnd()*6.28).toFixed(2)]);}
  const l={b,h:hh,p};
  if(rnd()<0.15+d*0.25){for(let k=0;k<60;k++){const w=[ri(30,330),ri(60,500),ri(30,330),ri(60,500)];
    if(Math.hypot(w[0]-w[2],w[1]-w[3])<160)continue;
    const okw=[[w[0],w[1]],[w[2],w[3]]].every(([x,y])=>Math.hypot(x-b[0],y-b[1])>45&&Math.hypot(x-hh[0],y-hh[1])>70&&p.every(q=>{const qx=q.length>4?q[4]:q[0],qy=q.length>4?q[5]:q[1],qr=q.length>4?q[6]+q[2]:q[2];return Math.hypot(qx-x,qy-y)>qr+30;}));
    if(okw){l.w=[w];break;}}}
  return l;}
// Stufen nach Anteil treffender Schüsse (von 2760 im Raster)
const TIER=c=>c>=45?0:c>=26?1:c>=13?2:3;
const QUOTA=[50,60,60,50];
const minS=[2000,2000,2000,1000];
const pool=[[],[],[],[]];
function consider(l,src){const L=norm(l),c=count(L);if(c<4)return false;const t=src==="first"?0:TIER(c);if(pool[t].length>=QUOTA[t])return false;
  const s=solve(L);if(!s||s.s<minS[t])return false;
  pool[t].push({l,c,s:[s.vx,s.vy],src});return true;}
const t0=Date.now();
old.forEach((l,i)=>{const o={b:l.b,h:l.h,p:l.p};if(l.w)o.w=l.w;consider(o,i===0?"first":"old");});
console.error("alt:",pool.map(p=>p.length).join("/"));
let tries=0;
while(pool.some((p,t)=>p.length<QUOTA[t])&&tries<20000){tries++;
  const need=pool.map((p,t)=>QUOTA[t]-p.length);const t=need.findIndex(n=>n>0);
  const want=need.map((n,i)=>n>0?i:-1).filter(i=>i>=0);const tt=want[Math.floor(rnd()*want.length)];
  const d=Math.min(1,Math.max(0,[0,0.3,0.6,0.92][tt]+(rnd()-.5)*0.3));
  consider(make(d),"neu");
  if(tries%100===0)console.error(tries,pool.map(p=>p.length).join("/"),Math.round((Date.now()-t0)/1000)+"s");}
const par=c=>c>=45?2:c>=20?3:c>=8?4:5;
const out=[];
// innerhalb einer Stufe: leichtere zuerst, neue Elemente (Abstoßer, Monde, Wurmlöcher) etwas später
const key=e=>e.c-(e.l.p.some(q=>q[3]<0)?12:0)-(e.l.p.some(q=>q.length>4)?45:0)-(e.l.w?30:0);
pool.forEach((arr,t)=>{arr.sort((a,b)=>(b.src==="first")-(a.src==="first")||key(b)-key(a));
  for(const e of arr){const o={b:e.l.b,h:e.l.h,par:par(e.c),t,s:e.s,p:e.l.p};if(e.l.w)o.w=e.l.w;out.push(o);}});
fs.writeFileSync(process.argv[3],JSON.stringify(out));
console.error("fertig",out.length,"Bahnen,",tries,"Versuche,",Math.round((Date.now()-t0)/1000)+"s");
