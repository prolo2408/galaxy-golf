// Erzeugt die Bahnen mit der echten Physik aus src/physics.js, misst ihre Schwierigkeit,
// verteilt sie auf vier Stufen und speichert zu jeder einen geprüften Lösungsschuss (für den Tipp).
// Aufruf: node tools/levelgen.cjs <ausgabe.json> [anzahl-kandidaten]
const fs=require("fs"),path=require("path");
const P=new Function(fs.readFileSync(path.join(__dirname,"../src/physics.js"),"utf8")+";return{simulate,gm};")();
const W=360,H=560,R=Math.PI/180,TOTAL=220,QUOTA=[50,60,60,50];
const norm=l=>Object.assign({W,H},l);
function count(l){let n=0;for(let a=0;a<360;a+=3)for(let pw=0.5;pw<=7.21;pw+=0.3)if(P.simulate(l,Math.cos(a*R)*pw,Math.sin(a*R)*pw)>=0)n++;return n;}
function solve(l){let best=null;
  for(let a=0;a<360;a+=2)for(let pw=0.5;pw<=7.21;pw+=0.2){const vx=Math.cos(a*R)*pw,vy=Math.sin(a*R)*pw,f=P.simulate(l,vx,vy);if(f<0)continue;
    let ok=0;for(const[da,dp]of[[1.5,0],[-1.5,0],[0,.12],[0,-.12]])if(P.simulate(l,Math.cos((a+da)*R)*(pw+dp),Math.sin((a+da)*R)*(pw+dp))>=0)ok++;
    const s=ok*1000-f;if(!best||s>best.s)best={s,vx:+vx.toFixed(4),vy:+vy.toFixed(4)};}
  return best;}
let seed=+(process.env.SEED||2026);
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const ri=(a,b)=>Math.round(a+rnd()*(b-a));
function kindFor(r){const u=rnd();return r>=36?(u<.65?2:3):r>=24?(u<.5?1:u<.75?3:2):1;}
function make(d){
  const v=ri(0,3);let b,hh;
  if(v===0){b=[ri(40,320),ri(490,525)];hh=[ri(40,320),ri(40,90)];}
  else if(v===1){b=[ri(30,60),ri(80,480)];hh=[ri(300,330),ri(80,480)];if(rnd()<.5){b[0]=W-b[0];hh[0]=W-hh[0];}}
  else if(v===2){const Lf=rnd()<.5;b=[Lf?ri(30,70):ri(290,330),ri(480,525)];hh=[Lf?ri(290,330):ri(30,70),ri(35,80)];}
  else{b=[ri(150,210),ri(260,320)];hh=rnd()<.5?[ri(40,320),ri(40,80)]:[ri(40,320),ri(480,520)];}
  if(rnd()<.5){b[1]=H-b[1];hh[1]=H-hh[1];}
  const p=[],ext=q=>q.length>4?[p[q[4]][0],p[q[4]][1],q[5]+q[2]]:[q[0],q[1],q[2]+(q[3]===4?14:0)];
  const free=(x,y,r,m)=>{if(x<r+8||x>W-r-8||y<r+8||y>H-r-8)return false;
    if(Math.hypot(x-b[0],y-b[1])<r+40+m||Math.hypot(x-hh[0],y-hh[1])<r+45+m)return false;
    for(const q of p){const[qx,qy,qr]=ext(q);if(Math.hypot(qx-x,qy-y)<qr+r+28)return false;}return true;};
  const place=(r,k,m=0)=>{for(let i=0;i<200;i++){const x=ri(30,330),y=ri(60,500);if(free(x,y,r,m)){p.push([x,y,r,k]);return true;}}return false;};
  if(rnd()<-.15+d*.75)place(ri(24,36),4,30);
  {const r=ri(20,28+Math.round(d*26)),mx=Math.round((b[0]+hh[0])/2+ri(-50,50)),my=Math.round((b[1]+hh[1])/2+ri(-50,50));if(free(mx,my,r,0))p.push([mx,my,r,kindFor(r)]);else place(r,kindFor(r));}
  const nA=ri(d>.3?1:0,1+Math.round(d*3));for(let i=0;i<nA;i++){const r=ri(12,24+Math.round(d*16));place(r,kindFor(r));}
  if(rnd()<.08+d*.55){const hosts=p.map((q,i)=>[q,i]).filter(([q])=>q[2]>=22);for(const[host,hi]of hosts.slice(0,1+Math.round(d))){
    const Rr=host[2]+(host[3]===4?ri(50,75):ri(32,56));
    const ok=p.every(q=>q===host||Math.hypot(q[0]-host[0],q[1]-host[1])>Rr+ext(q)[2]+24)&&Math.hypot(b[0]-host[0],b[1]-host[1])>Rr+30&&Math.hypot(hh[0]-host[0],hh[1]-host[1])>Rr+30;
    if(ok)p.push([0,0,ri(7,12),1,hi,Rr,rnd()<.5?-1:1,+(rnd()*6.28).toFixed(2)]);}}
  const l={b,h:hh,p};
  if(rnd()<.1+d*.25){for(let k=0;k<60;k++){const w=[ri(30,330),ri(60,500),ri(30,330),ri(60,500)];
    if(Math.hypot(w[0]-w[2],w[1]-w[3])<160)continue;
    const okw=[[w[0],w[1]],[w[2],w[3]]].every(([x,y])=>Math.hypot(x-b[0],y-b[1])>45&&Math.hypot(x-hh[0],y-hh[1])>70&&p.every(q=>{const[qx,qy,qr]=ext(q);return Math.hypot(qx-x,qy-y)>qr+30;}));
    if(okw){l.w=[w];break;}}}
  return l;}
const target=+(process.argv[3]||650),cands=[],t0=Date.now();let tries=0;
const first={b:[180,500],h:[180,80],p:[[180,290,40,1]]};
while(cands.length<target){tries++;const d=tries===1?-1:rnd();const l=d<0?first:make(d);const L=norm(l),c=count(L);if(c<3)continue;
  const s=solve(L);if(!s||s.s<1000)continue;cands.push({l,c,s:[s.vx,s.vy],first:d<0});
  if(cands.length%50===0)console.error(cands.length,"Kandidaten,",tries,"Versuche,",Math.round((Date.now()-t0)/1000)+"s");}
// gleichmäßig über die Schwierigkeit verteilt auswählen
cands.sort((a,b)=>b.first-a.first||b.c-a.c);
const pick=[cands[0]],rest=cands.slice(1);for(let i=0;i<TOTAL-1;i++)pick.push(rest[Math.round(i*(rest.length-1)/(TOTAL-2))]);
const mech=e=>(e.l.p.some(q=>q[3]===4)?14:0)+(e.l.p.some(q=>q.length>4)?40:0)+(e.l.w?30:0);
const out=[];let i=0;
QUOTA.forEach((n,t)=>{const tier=pick.slice(i,i+n);i+=n;tier.sort((a,b)=>b.first-a.first||(b.c-mech(b))-(a.c-mech(a)));
  for(const e of tier)out.push({e,t});});
const cs=pick.map(e=>e.c).sort((a,b)=>b-a),q=f=>cs[Math.floor(f*(cs.length-1))];
const par=c=>c>=q(.22)?2:c>=q(.62)?3:c>=q(.9)?4:5;
const res=out.map(({e,t})=>{const o={b:e.l.b,h:e.l.h,par:par(e.c),t,s:e.s,p:e.l.p};if(e.l.w)o.w=e.l.w;return o;});
fs.writeFileSync(process.argv[2],JSON.stringify(res));
console.error("fertig",res.length,"Bahnen aus",cands.length,"Kandidaten,",tries,"Versuche,",Math.round((Date.now()-t0)/1000)+"s; Treffer-Spanne",cs[0],"bis",cs[cs.length-1]);
