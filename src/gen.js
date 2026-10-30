// Bahn-Baukasten: erzeugt Kandidaten und prüft sie mit der echten Physik.
// Benutzt vom Generator (tools/levelgen.cjs) und vom Endlos-Modus im Spiel. Erwartet physics.js.
const GW=360,GH=560,GRAD=Math.PI/180;
// Neue Bahn. d = Schwierigkeit 0..1, rnd = Zufallsquelle, o.wind / o.bin = Wahrscheinlichkeit für Sonnenwind und Doppelstern.
function genMake(d,rnd,o){o=o||{};const ri=(a,b)=>Math.round(a+rnd()*(b-a));
  const kindFor=r=>{const u=rnd();return r>=36?(u<.65?2:3):r>=24?(u<.5?1:u<.75?3:2):1;};
  const v=ri(0,3);let b,hh;
  if(v===0){b=[ri(40,320),ri(490,525)];hh=[ri(40,320),ri(40,90)];}
  else if(v===1){b=[ri(30,60),ri(80,480)];hh=[ri(300,330),ri(80,480)];if(rnd()<.5){b[0]=GW-b[0];hh[0]=GW-hh[0];}}
  else if(v===2){const Lf=rnd()<.5;b=[Lf?ri(30,70):ri(290,330),ri(480,525)];hh=[Lf?ri(290,330):ri(30,70),ri(35,80)];}
  else{b=[ri(150,210),ri(260,320)];hh=rnd()<.5?[ri(40,320),ri(40,80)]:[ri(40,320),ri(480,520)];}
  if(rnd()<.5){b[1]=GH-b[1];hh[1]=GH-hh[1];}
  const p=[],L={b,h:hh,p};
  // Ausdehnung eines Körpers: Mitte und Radius, den er überstreicht (mit Glutzone)
  const ext=q=>{if(q.length<=4)return[q[0],q[1],q[2]+(q[3]===4?14:0)];if(q[4]>=0)return[p[q[4]][0],p[q[4]][1],q[5]+q[2]];return[q[0],q[1],binR(L,q)+q[2]+14];};
  const free=(x,y,r,m)=>{if(x<r+8||x>GW-r-8||y<r+8||y>GH-r-8)return false;
    if(Math.hypot(x-b[0],y-b[1])<r+40+m||Math.hypot(x-hh[0],y-hh[1])<r+45+m)return false;
    for(const q of p){const[qx,qy,qr]=ext(q);if(Math.hypot(qx-x,qy-y)<qr+r+28)return false;}return true;};
  const place=(r,k,m=0)=>{for(let i=0;i<200;i++){const x=ri(30,330),y=ri(60,500);if(free(x,y,r,m)){p.push([x,y,r,k]);return true;}}return false;};
  let bin=false;
  if(o.bin&&rnd()<o.bin){const r1=ri(13,19),r2=ri(13,19),D=ri(100,140),dir=rnd()<.5?-1:1,ph=+(rnd()*6.28).toFixed(2);
    const m1=r1*r1*r1,m2=r2*r2*r2,R=Math.max(D*m2/(m1+m2)+r1,D*m1/(m1+m2)+r2)+14;
    for(let i=0;i<200&&!bin;i++){const x=ri(40,320),y=ri(90,470);
      if(x<R-20||x>GW-R+20||y<R-10||y>GH-R+10)continue;
      if(Math.hypot(x-b[0],y-b[1])<R+38||Math.hypot(x-hh[0],y-hh[1])<R+42)continue;
      const n=p.length;p.push([x,y,r1,4,-1,n+1,dir,ph,D],[x,y,r2,4,-1,n,dir,+(ph+Math.PI).toFixed(4),D]);bin=true;}}
  if(!bin&&rnd()<-.15+d*.75)place(ri(24,36),4,30);
  {const r=ri(20,28+Math.round(d*(bin?12:26))),mx=Math.round((b[0]+hh[0])/2+ri(-50,50)),my=Math.round((b[1]+hh[1])/2+ri(-50,50));if(free(mx,my,r,0))p.push([mx,my,r,kindFor(r)]);else place(r,kindFor(r));}
  const nA=ri(d>.3?1:0,(bin?0:1)+Math.round(d*(bin?2:3)));for(let i=0;i<nA;i++){const r=ri(12,24+Math.round(d*16));place(r,kindFor(r));}
  if(rnd()<.08+d*.55){const hosts=p.map((q,i)=>[q,i]).filter(([q])=>q.length<=4&&q[2]>=22);for(const[host,hi]of hosts.slice(0,1+Math.round(d))){
    const Rr=host[2]+(host[3]===4?ri(50,75):ri(32,56));
    const ok=p.every(q=>q===host||Math.hypot(ext(q)[0]-host[0],ext(q)[1]-host[1])>Rr+ext(q)[2]+24)&&Math.hypot(b[0]-host[0],b[1]-host[1])>Rr+30&&Math.hypot(hh[0]-host[0],hh[1]-host[1])>Rr+30;
    if(ok)p.push([0,0,ri(7,12),1,hi,Rr,rnd()<.5?-1:1,+(rnd()*6.28).toFixed(2)]);}}
  if(o.wind&&rnd()<o.wind){const F=[],n=rnd()<.3+d*.3?2:1;
    for(let k=0;k<40&&F.length<n;k++){const r=ri(48,84),x=ri(20,340),y=ri(70,490),a=rnd()*6.283,m=.028+rnd()*(.025+d*.025);
      if(Math.hypot(x-b[0],y-b[1])<r+24||Math.hypot(x-hh[0],y-hh[1])<r+30)continue;
      if(p.some(q=>{const[qx,qy,qr]=ext(q);return Math.hypot(qx-x,qy-y)<(q.length<=4?q[2]:qr*.6)+12;}))continue;
      if(F.some(z=>Math.hypot(z[0]-x,z[1]-y)<z[2]+r+10))continue;
      F.push([x,y,r,+(Math.cos(a)*m).toFixed(4),+(Math.sin(a)*m).toFixed(4)]);}
    if(F.length)L.f=F;}
  if(rnd()<.1+d*.25){for(let k=0;k<60;k++){const w=[ri(30,330),ri(60,500),ri(30,330),ri(60,500)];
    if(Math.hypot(w[0]-w[2],w[1]-w[3])<160)continue;
    const okw=[[w[0],w[1]],[w[2],w[3]]].every(([x,y])=>Math.hypot(x-b[0],y-b[1])>45&&Math.hypot(x-hh[0],y-hh[1])>70&&p.every(q=>{const[qx,qy,qr]=ext(q);return Math.hypot(qx-x,qy-y)>qr+30;}));
    if(okw){L.w=[w];break;}}}
  return L;}
function genNorm(l){return Object.assign({W:GW,H:GH},l);}
// Dieselbe Bahn im Querformat: um 90° gedreht, Monde und Doppelsterne mit gedrehter Phase, Sonnenwind mit gedrehter Richtung
function genRot(l){const f=(a,c)=>[560-c,a],o={W:560,H:360,b:f(l.b[0],l.b[1]),h:f(l.h[0],l.h[1]),par:l.par,t:l.t,s:[-l.s[1],l.s[0]],
  p:l.p.map(q=>q.length<=4?[...f(q[0],q[1]),q[2],q[3]]:q[4]>=0?[0,0,q[2],q[3],q[4],q[5],q[6],q[7]+Math.PI/2]:[...f(q[0],q[1]),q[2],q[3],q[4],q[5],q[6],q[7]+Math.PI/2,q[8]])};
  if(l.w)o.w=l.w.map(w=>[...f(w[0],w[1]),...f(w[2],w[3])]);if(l.f)o.f=l.f.map(z=>[...f(z[0],z[1]),z[2],-z[4],z[3]]);return o;}
// Trifft ein Schuss genau aufs Loch (±1,5°) mit irgendeiner Stärke? Dann sind die Hindernisse egal.
function genDirect(L,step){const a=Math.atan2(L.h[1]-L.b[1],L.h[0]-L.b[0]);
  for(const da of[0,-1.5,1.5])for(let pw=0.5;pw<=7.21;pw+=step||0.1)if(simulate(L,Math.cos(a+da*GRAD)*pw,Math.sin(a+da*GRAD)*pw)>=0)return true;return false;}
// Wie weit weicht ein treffender Schuss höchstens von der Geraden Ball–Loch ab? (Wurmloch zählt als weit.)
function genDev(L,vx,vy){const path=[];simulate(L,vx,vy,path);const bx=L.b[0],by=L.b[1],dx=L.h[0]-bx,dy=L.h[1]-by,len=Math.hypot(dx,dy);let m=0;
  for(const q of path){if(!q)return 1e6;const t=Math.max(0,Math.min(1,((q[0]-bx)*dx+(q[1]-by)*dy)/(len*len)));m=Math.max(m,Math.hypot(q[0]-bx-t*dx,q[1]-by-t*dy));}return m;}
// Wie viele Schüsse im Raster treffen, wie gerade ist der geradeste, und welche treffen (für die Lösungssuche)
function* genScan(L,sa,sp){const hits=[];let dev=1e9;
  for(let a=0;a<360;a+=sa){for(let pw=0.5;pw<=7.21;pw+=sp){const vx=Math.cos(a*GRAD)*pw,vy=Math.sin(a*GRAD)*pw;if(simulate(L,vx,vy)<0)continue;hits.push([a,pw]);dev=Math.min(dev,genDev(L,vx,vy));}yield;}
  return{n:hits.length,dev,hits};}
// Robuster Lösungsschuss: trifft auch, wenn man ein wenig daneben zieht
function genScore(L,a,pw){const f=simulate(L,Math.cos(a*GRAD)*pw,Math.sin(a*GRAD)*pw);if(f<0)return null;let ok=0;
  for(const[da,dp]of[[1.5,0],[-1.5,0],[0,.12],[0,-.12]])if(simulate(L,Math.cos((a+da)*GRAD)*(pw+dp),Math.sin((a+da)*GRAD)*(pw+dp))>=0)ok++;return ok*1000-f;}
function* genRefine(L,hits){let best=null;const seen=new Set();
  const tryS=(a,pw)=>{a=+a.toFixed(2);pw=+pw.toFixed(2);const k=a+'/'+pw;if(seen.has(k)||pw<.5||pw>7.21)return;seen.add(k);const s=genScore(L,a,pw);
    if(s!==null&&(!best||s>best.s))best={s,a,pw};};
  for(const[a,pw]of hits){tryS(a,pw);yield;}
  if(best){const a0=best.a,p0=best.pw;for(let da=-4;da<=4;da+=1){for(let dp=-.4;dp<=.41;dp+=.1)tryS(a0+da,p0+dp);yield;}}
  return best&&{s:best.s,vx:+(Math.cos(best.a*GRAD)*best.pw).toFixed(4),vy:+(Math.sin(best.a*GRAD)*best.pw).toFixed(4)};}
// Trifft der Lösungsschuss auch ohne Sonnenwind? Dann spielt der Wind keine Rolle.
function genNeedsWind(L,s){if(!L.f)return true;const o=Object.assign({},L);delete o.f;return simulate(o,s[0],s[1])<0;}
// Generator-Funktion: läuft so lange, bis eine gute Bahn gefunden ist. Für den Browser in kleinen Häppchen.
// o: sa/sp Rasterweite (Grad/Stärke), ds Schrittweite beim Geraden-Test, minHits/maxHits, parQ Par-Schwellen (Treffer im Raster),
//    must(l): Pflichtbedingung an den Kandidaten, tier: Stufe. Gibt es Sonnenwind, muss die Lösung ihn brauchen. Rückgabe wie in levels.json, dazu n (Treffer).
function* genLevel(d,rnd,o){o=o||{};for(let tries=0;;tries++){const l=genMake(d,rnd,o),L=genNorm(l);yield;
  if(o.must&&!o.must(l))continue;
  if(genDirect(L,o.ds||.2))continue;yield;
  const sc=yield* genScan(L,o.sa||6,o.sp||.45);if(sc.n<(o.minHits||2)||sc.n>(o.maxHits||1e9)||sc.dev<38)continue;
  const s=yield* genRefine(L,sc.hits);if(!s||s.s<1000)continue;
  if(l.f&&!genNeedsWind(L,[s.vx,s.vy]))continue;
  const res={b:l.b,h:l.h,par:0,t:o.tier||0,s:[s.vx,s.vy],p:l.p};if(l.w)res.w=l.w;if(l.f)res.f=l.f;
  if(simulate(genRot(res),-s.vy,s.vx)<0)continue;
  const q=o.parQ||[13,7,4];res.par=sc.n>=q[0]?2:sc.n>=q[1]?3:sc.n>=q[2]?4:5;
  return Object.assign(res,{n:sc.n});}}
