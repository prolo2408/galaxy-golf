// Galaxy Golf – Spiel. Erwartet LV (Bahnen) und die Funktionen aus physics.js.
const N=LV.length;
const TIERS=['Leicht','Mittel','Schwer','Extrem'];
const $=id=>document.getElementById(id);
const cv=$('c'),x=cv.getContext('2d');

// ---------- Spielstand ----------
let save={un:3,best:{},seen:{},skin:null,cur:0};
try{const s=JSON.parse(localStorage.getItem('gg4')||'null');if(s&&s.best)save=Object.assign(save,s);}catch(e){}
function persist(){try{localStorage.setItem('gg4',JSON.stringify(save));}catch(e){}}
function autoSkin(){const d=new Date(),m=d.getMonth(),dd=d.getDate();return(m===9&&dd>=10)||(m===10&&dd<=3)?'halloween':'classic';}

// ---------- Skins (flache Farben) ----------
const SK={
  classic:{bg:'#0c1030',star:'226,232,255',acc:'#ffc857',glow:'255,200,87',ring:'#7ae7c7',disk:'#ffc857',ball:'#ffffff',trail:'255,200,87',
    sun:['#fff3c4','#ffcf4d','#ffad33'],wh:['#7ad3ff','#c59df5'],shade:'rgba(6,6,28,.45)'},
  halloween:{bg:'#130a1d',star:'240,226,255',acc:'#ff8a1f',glow:'255,138,31',ring:'#9cff57',disk:'#ff8a1f',ball:'#f6f0ff',trail:'255,150,50',
    sun:['#ffe0a8','#ff9a2e','#ff6a1a'],wh:['#9cff57','#c06bff'],shade:'rgba(14,4,22,.5)'}
};
let skin=save.skin||autoSkin(),C=SK[skin];
document.documentElement.dataset.skin=skin;

function rng(s){s=s>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}

// ---------- Planeten-Designs ----------
// Jede Art bekommt ein paar schlichte Varianten. Das Aussehen folgt der Physik: Gestein, Gas, Eis, Sonne.
const PAL={
  bands:[['#f2c38b','#d9935a','#f8ddb6'],['#c9a7ff','#9f7de6','#e4d6ff'],['#ffb4a2','#e3828a','#ffd8cc'],['#9fd8cb','#66b5a4','#d0f0e8']],
  ringed:[['#ffe6a0','#e2b061'],['#f3d2ff','#c39bf2'],['#c3e4ff','#7cb3e8'],['#ffd3ba','#ec9f78']],
  ice:[['#bfeef7','#e9fcff','#8fd3e3'],['#b9c8ff','#e2e8ff','#8ea2ef']],
  earth:[['#4f8fe8','#6cc48a'],['#3f7fd6','#8fcf6c']],
  mars:[['#e2725b','#b9503f'],['#d98a4e','#b0663a']],
  venus:[['#f5d58e','#e3b25f']],
  moon:[['#bab7cc','#8e8aa8'],['#cdb39a','#9f8166'],['#a9b4c4','#7d889c']]
};
const PAL_H={
  bands:[['#ff9f43','#c95f1a','#ffd2a6'],['#9b6bd6','#6c3fae','#cdb0f4'],['#86d46f','#4a933f','#c8f1b8']],
  ringed:[['#dcc6ff','#9b6bd6'],['#ffd1a0','#ff8a1f'],['#cdf7ae','#73c95e']],
  ice:[['#b9f0e0','#e6fff8','#79cdb3'],['#d8c8ff','#f1ebff','#a48ae6']],
  earth:[['#4b3a80','#7bd36a'],['#3a2f6b','#9be07f']],
  mars:[['#c4472f','#86281c']],
  venus:[['#eadcb6','#c8ae78']],
  moon:[['#ddd6c6','#a89f8b'],['#c9c0d6','#958aa8']]
};
// Halloween verkleidet jede Art immer gleich: Sonnen werden Kürbislaternen, Monde kleine Geister,
// Planeten behalten ihr Design in Halloween-Farben.
function mkLooks(i){const r=rng(i*7919+13),hw=skin==='halloween',PP=hw?PAL_H:PAL;return LV[i].p.map((q,j)=>{const seed=i*131+j*17+1,pk=a=>a[Math.floor(r()*a.length)];
  if(q[3]===4)return{d:hw?'lantern':'sun',seed};
  if(q.length>4)return hw?{d:'ghost',seed}:{d:'moon',c:pk(PP.moon),seed};
  if(q[3]===2){const d=r()<.45?'ringed':'bands';return{d,c:pk(PP[d]),seed};}
  if(q[3]===3)return r()<.35?{d:'ringed',c:pk(PP.ringed),seed}:{d:'ice',c:pk(PP.ice),seed};
  const d=q[2]<16?'moon':pk(['earth','mars','venus','moon','earth','mars']);return{d,c:pk(PP[d]),seed};});}

function lightFor(px,py,P){let best=null,bd=1e9;for(const p of P)if(p[3]===4){const d=Math.hypot(p[0]-px,p[1]-py);if(d>1&&d<bd){bd=d;best=p;}}
  if(!best)return[-.6,-.8];return[(best[0]-px)/bd,(best[1]-py)/bd];}
function ringArc(r,col,back){x.save();x.rotate(-.35);x.strokeStyle=col;x.lineWidth=Math.max(2,r*.13);x.lineCap='round';x.beginPath();x.ellipse(0,0,r*1.75,r*.42,0,back?Math.PI:0,back?2*Math.PI:Math.PI);x.stroke();
  x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=Math.max(1,r*.04);x.beginPath();x.ellipse(0,0,r*1.58,r*.36,0,back?Math.PI:0,back?2*Math.PI:Math.PI);x.stroke();x.restore();}
function blob(cx,cy,s,r){x.beginPath();x.arc(cx,cy,s,0,7);x.arc(cx+s*.8,cy+s*.25,s*.7,0,7);x.arc(cx-s*.5,cy+s*.55,s*.6,0,7);x.fill();}
function drawPlanet(L,px,py,r,lt){const R=rng(L.seed);x.save();x.translate(px,py);
  if(L.d==='ringed')ringArc(r,L.c[1],true);
  x.beginPath();x.arc(0,0,r,0,7);
  x.fillStyle=L.c[0];x.fill();
  x.save();x.clip();
  if(L.d==='bands'){const n=4+Math.floor(R()*2);for(let i=0;i<n;i++){const y=-r+(i+.5)*2*r/n+(R()-.5)*r*.15,h=r*(.12+R()*.16);x.fillStyle=i%2?L.c[1]:L.c[2];x.beginPath();x.ellipse(0,y,r*1.2,h,0,0,7);x.fill();}
    if(R()<.7){x.fillStyle=L.c[1];x.beginPath();x.ellipse(r*(R()-.5)*.8,r*(.25+R()*.2),r*.24,r*.13,0,0,7);x.fill();}}
  else if(L.d==='ringed'){x.fillStyle=rgba(L.c[1],.45);x.fillRect(-r,-r*.25,2*r,r*.18);x.fillRect(-r,r*.2,2*r,r*.12);}
  else if(L.d==='ice'){x.fillStyle=L.c[1];x.fillRect(-r,-r*.55,2*r,r*.16);x.fillRect(-r,r*.1,2*r,r*.1);x.fillStyle=L.c[2];x.fillRect(-r,r*.42,2*r,r*.14);}
  else if(L.d==='earth'){x.fillStyle=L.c[1];for(let i=0;i<3;i++)blob((R()-.5)*r*1.3,(R()-.5)*r*1.1,r*(.18+R()*.14),r);x.fillStyle='#f4f8ff';x.beginPath();x.ellipse(0,-r*1.02,r*.7,r*.28,0,0,7);x.ellipse(0,r*1.04,r*.6,r*.22,0,0,7);x.fill();
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-r*.1,-r*.25,r*.45,r*.07,-.2,0,7);x.ellipse(r*.2,r*.35,r*.38,r*.06,-.2,0,7);x.fill();}
  else if(L.d==='mars'){x.fillStyle=L.c[1];for(let i=0;i<3;i++){x.beginPath();x.ellipse((R()-.5)*r*1.2,(R()-.5)*r*1.1,r*(.15+R()*.2),r*(.1+R()*.12),R()*3,0,7);x.fill();}x.fillStyle='#fff1ea';x.beginPath();x.ellipse(0,-r*1.02,r*.5,r*.2,0,0,7);x.fill();}
  else if(L.d==='venus'){x.strokeStyle=L.c[1];x.lineWidth=r*.12;x.lineCap='round';for(let i=0;i<3;i++){const y=(i-1)*r*.5;x.beginPath();x.moveTo(-r,y);x.bezierCurveTo(-r*.3,y-r*.25,r*.3,y+r*.25,r,y);x.stroke();}}
  else if(L.d==='moon'){const n=3+Math.floor(R()*3);for(let i=0;i<n;i++){const cx=(R()-.5)*r*1.3,cy=(R()-.5)*r*1.3,cr=r*(.12+R()*.16);x.fillStyle=L.c[1];x.beginPath();x.arc(cx,cy,cr,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=Math.max(.8,r*.04);x.beginPath();x.arc(cx,cy,cr,Math.PI*.9,Math.PI*1.7);x.stroke();}}
  x.fillStyle=C.shade;x.beginPath();x.rect(-r-2,-r-2,2*r+4,2*r+4);x.moveTo(lt[0]*r*.42+r*1.02,lt[1]*r*.42);x.arc(lt[0]*r*.42,lt[1]*r*.42,r*1.02,0,Math.PI*2,true);x.fill('evenodd');
  x.restore();
  if(L.d==='ringed')ringArc(r,L.c[1],false);
  x.restore();}
function drawGhost(px,py,r,vx){x.save();x.translate(px,py);const k=r*1.15,w=Math.sin(anim*6+px*.1);
  x.fillStyle='rgba(246,240,255,.12)';x.beginPath();x.arc(0,0,r*1.9,0,7);x.fill();
  x.fillStyle='#f4efff';x.beginPath();x.arc(0,-k*.15,k*.8,Math.PI,0);x.lineTo(k*.8,k*.72);
  for(let i=0;i<4;i++){const a=k*.8-(i+.5)*k*.4,b=k*.8-(i+1)*k*.4;x.quadraticCurveTo(a,k*(.95+(i%2?-.12:.12)*w),b,k*.72);}x.closePath();x.fill();
  x.fillStyle='#2a1838';const ex=vx<0?-.12:.12;x.beginPath();x.ellipse((-.28+ex)*k,-.18*k,.13*k,.18*k,0,0,7);x.ellipse((.28+ex)*k,-.18*k,.13*k,.18*k,0,0,7);x.fill();
  x.beginPath();x.ellipse(ex*k,.2*k,.12*k,.1*k,0,0,7);x.fill();x.restore();}
function drawLantern(px,py,r){x.save();x.translate(px,py);const fl=.75+.25*Math.sin(anim*9+px)*Math.sin(anim*5.3+py);
  const g=x.createRadialGradient(0,0,r*.8,0,0,r*2.6);g.addColorStop(0,'rgba(255,140,30,'+.4*fl+')');g.addColorStop(1,'rgba(255,120,20,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.6,0,7);x.fill();
  x.fillStyle='#ff8a1f';x.beginPath();x.arc(0,0,r,0,7);x.fill();x.save();x.clip();
  x.fillStyle='#e8670c';for(const k of[-.62,0,.62]){x.beginPath();x.ellipse(k*r,0,r*.36,r*1.05,0,0,7);x.fill();}
  x.fillStyle='#ffa646';for(const k of[-.31,.31]){x.beginPath();x.ellipse(k*r,0,r*.2,r*1.02,0,0,7);x.fill();}x.restore();
  x.strokeStyle='#4f7d24';x.lineWidth=Math.max(3,r*.18);x.lineCap='round';x.beginPath();x.moveTo(0,-r*.9);x.quadraticCurveTo(r*.05,-r*1.22,r*.26,-r*1.28);x.stroke();
  x.fillStyle='rgba(255,'+(214+30*fl|0)+',110,'+(.85+.15*fl)+')';x.beginPath();
  for(const s of[-1,1]){x.moveTo(s*.14*r,-.04*r);x.lineTo(s*.46*r,-.04*r);x.lineTo(s*.3*r,-.36*r);x.closePath();}
  x.moveTo(-.07*r,.12*r);x.lineTo(.07*r,.12*r);x.lineTo(0,0);x.closePath();
  x.moveTo(-.56*r,.2*r);x.quadraticCurveTo(0,.68*r,.56*r,.2*r);x.lineTo(.4*r,.31*r);x.lineTo(.26*r,.24*r);x.lineTo(.12*r,.37*r);x.lineTo(-.04*r,.26*r);x.lineTo(-.18*r,.37*r);x.lineTo(-.33*r,.25*r);x.lineTo(-.45*r,.32*r);x.closePath();x.fill();
  x.strokeStyle='rgba(255,170,60,.5)';x.setLineDash([4,5]);x.lineDashOffset=-anim*6;x.lineWidth=1.2;x.beginPath();x.arc(0,0,r+BURN+5,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;
  x.restore();}
function drawSun(px,py,r){x.save();x.translate(px,py);const s=C.sun;
  const g=x.createRadialGradient(0,0,r*.8,0,0,r*2.6);g.addColorStop(0,rgba(s[1],.35));g.addColorStop(1,rgba(s[1],0));x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.6,0,7);x.fill();
  x.rotate(anim*.15);x.fillStyle=rgba(s[2],.55);x.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=a+.13;x.moveTo(Math.cos(a-.13)*r*1.02,Math.sin(a-.13)*r*1.02);x.lineTo(Math.cos(a)*r*(i%2?1.38:1.55),Math.sin(a)*r*(i%2?1.38:1.55));x.lineTo(Math.cos(b)*r*1.02,Math.sin(b)*r*1.02);}x.fill();x.rotate(-anim*.15);
  x.fillStyle=s[1];x.beginPath();x.arc(0,0,r,0,7);x.fill();x.fillStyle=s[0];x.beginPath();x.arc(-r*.12,-r*.12,r*.68,0,7);x.fill();
  x.strokeStyle=rgba(s[2],.45);x.setLineDash([4,5]);x.lineDashOffset=-anim*6;x.lineWidth=1.2;x.beginPath();x.arc(0,0,r+BURN+5,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;
  x.restore();}

// ---------- Größe und Ausrichtung ----------
let S=1,DPR=1,orient='p',li=0,lvl=null,looks=[],bg=null,stars=[];
function inst(i){const b=LV[i];const l={W:360,H:560,b:b.b.slice(),h:b.h.slice(),par:b.par,t:b.t,s:b.s.slice(),p:b.p.map(q=>q.slice())};if(b.w)l.w=b.w.map(q=>q.slice());
  if(orient==='l'){const f=(a,c)=>[560-c,a];l.W=560;l.H=360;l.b=f(l.b[0],l.b[1]);l.h=f(l.h[0],l.h[1]);l.s=[-l.s[1],l.s[0]];
    if(l.w)l.w=l.w.map(w=>[...f(w[0],w[1]),...f(w[2],w[3])]);
    l.p=l.p.map(q=>q.length>4?[0,0,q[2],q[3],q[4],q[5],q[6],q[7]+Math.PI/2]:[...f(q[0],q[1]),q[2],q[3]]);}
  return l;}
function size(){const f=$('field'),fw=f.clientWidth,fh=f.clientHeight;if(!fw||!fh)return;
  const o=fw>fh*1.08?'l':'p',W=o==='l'?560:360,H=o==='l'?360:560,k=Math.min(fw/W,fh/H)*.995;
  DPR=Math.min(window.devicePixelRatio||1,2.5);cv.style.width=Math.floor(W*k)+'px';cv.style.height=Math.floor(H*k)+'px';
  cv.width=Math.round(W*k*DPR);cv.height=Math.round(H*k*DPR);S=cv.width/DPR/W;bg=null;
  const ch=o!==orient;orient=o;if(lvl&&ch){lvl=inst(li);hint=null;drag=null;if(st==='fly')st='aim';home();}}
let rzq=0;new ResizeObserver(()=>{cancelAnimationFrame(rzq);rzq=requestAnimationFrame(size);}).observe($('field'));

// ---------- Hintergrund: flach, Sterne ----------
function buildBg(){const w=cv.width,h=cv.height,g=(bg=document.createElement('canvas')).getContext('2d'),k=DPR*S,r=rng(skin==='halloween'?66:42);bg.width=w;bg.height=h;
  g.fillStyle=C.bg;g.fillRect(0,0,w,h);
  const n=Math.round(w*h/(1100*DPR*DPR));for(let i=0;i<n;i++){const sz=(.5+Math.pow(r(),4)*1.4)*k;g.fillStyle='rgba('+C.star+','+(.2+r()*.55)+')';g.beginPath();g.arc(r()*w,r()*h,sz,0,7);g.fill();}
  for(let i=0;i<7;i++){const sx=r()*w,sy=r()*h,L=(2.5+r()*3)*k;g.fillStyle='rgba('+C.star+',.85)';g.beginPath();g.moveTo(sx,sy-L);g.quadraticCurveTo(sx,sy,sx+L,sy);g.quadraticCurveTo(sx,sy,sx,sy+L);g.quadraticCurveTo(sx,sy,sx-L,sy);g.quadraticCurveTo(sx,sy,sx,sy-L);g.fill();}
  if(skin==='halloween'){const mr=Math.min(w,h)*.09,mx=w-mr*1.6,my=mr*1.6;g.fillStyle='rgba(246,217,168,.22)';g.beginPath();g.arc(mx,my,mr,0,Math.PI*2);g.moveTo(mx+mr*.38+mr*.92,my-mr*.12);g.arc(mx+mr*.38,my-mr*.12,mr*.92,0,Math.PI*2);g.fill('evenodd');}
  const rs=rng(7);stars=Array.from({length:22},()=>[rs(),rs(),rs()*6]);}

// ---------- Zustand ----------
let st='aim',ball=null,shots=0,drag=null,hint=null,trail=[],t=0,acc=0,anim=0,frames=0,sinkT=0,parts=[],bats=[],batT=2.5,menuTier=0;
function home(){ball={x:lvl.b[0],y:lvl.b[1],vx:0,vy:0,cd:0};trail=[];t=0;frames=0;}
function load(i){li=Math.max(0,Math.min(N-1,i));save.cur=li;persist();lvl=inst(li);looks=mkLooks(li);shots=0;hint=null;drag=null;st='aim';home();$('ov').hidden=true;ui();intro();}
function totalStars(){return Object.values(save.best).reduce((a,b)=>a+b.st,0);}
function ui(){const tr=$('tier');tr.textContent=TIERS[lvl.t];tr.className='tier t'+lvl.t;$('lvn').textContent='Bahn '+(li+1)+' von '+N;
  $('par').textContent=lvl.par;$('sh').textContent=shots;$('stars').textContent=totalStars();$('tip').classList.toggle('on',!!hint);
  const hw=skin==='halloween';$('lgsun').textContent=hw?'Kürbislaternen sind die Sonnen: sehr stark, zu nah verglüht die Kugel':'Sonnen ziehen sehr stark, zu nah verglüht die Kugel';$('lgmoon').textContent=hw?'Geister kreisen als Monde um ihren Planeten':'Monde kreisen um ihren Planeten';}
let msgT;function say(s,col){const m=$('msg');m.textContent=s;m.style.color=col||'var(--dim)';m.style.opacity=1;clearTimeout(msgT);msgT=setTimeout(()=>m.style.opacity=0,2600);}

// ---------- Neue Elemente erklären ----------
const INTRO={start:['So geht’s','Irgendwo aufs Feld tippen, zurückziehen und loslassen. Alles zieht die Kugel an, große und dichte Planeten am stärksten. Ziel ist das Schwarze Loch.'],
  sun:[()=>skin==='halloween'?'Neu: Kürbislaternen':'Neu: Sonnen',()=>(skin==='halloween'?'An Halloween sind die Sonnen Kürbislaternen. ':'')+'Sie ziehen viel stärker als Planeten. Wer über den gestrichelten Ring hinein fliegt, verglüht.'],
  moon:[()=>skin==='halloween'?'Neu: Geister':'Neu: Monde',()=>(skin==='halloween'?'An Halloween spuken die Monde als Geister. ':'')+'Sie kreisen um ihren Planeten, so schnell, wie es seine Schwerkraft vorgibt. Bei jedem Schuss starten sie an derselben Stelle.'],
  warp:['Neu: Wurmloch','Rein in den einen Strudel, raus aus dem anderen, mit demselben Schwung.']};
let introT;function intro(){const l=lvl,k=!save.seen.start?'start':l.p.some(q=>q[3]===4)&&!save.seen.sun?'sun':l.p.some(q=>q.length>4)&&!save.seen.moon?'moon':l.w&&!save.seen.warp?'warp':null;
  const el=$('intro');if(!k){el.hidden=true;return;}save.seen[k]=1;persist();const tx=v=>typeof v==='function'?v():v;$('inh').textContent=tx(INTRO[k][0]);$('inp').textContent=tx(INTRO[k][1]);el.hidden=false;clearTimeout(introT);introT=setTimeout(()=>el.hidden=true,10000);}
$('intro').onclick=()=>$('intro').hidden=true;

// ---------- Eingabe ----------
function pos(e){const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left)/S,y:(e.clientY-b.top)/S};}
function power(){if(!drag)return{x:0,y:0,l:0};let dx=drag.sx-drag.x,dy=drag.sy-drag.y,l=Math.hypot(dx,dy);if(l>150){dx*=150/l;dy*=150/l;}return{x:dx*.048,y:dy*.048,l:Math.min(l,150)};}
cv.addEventListener('pointerdown',e=>{if(st!=='aim'||!$('ov').hidden)return;$('intro').hidden=true;const p=pos(e);drag={sx:p.x,sy:p.y,x:p.x,y:p.y};cv.setPointerCapture(e.pointerId);e.preventDefault();});
cv.addEventListener('pointermove',e=>{if(!drag)return;const p=pos(e);drag.x=p.x;drag.y=p.y;});
cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',()=>drag=null);
function release(){if(!drag)return;const pw=power();drag=null;if(pw.l<8)return;let v=[pw.x,pw.y];
  if(hint&&Math.hypot(pw.x-hint.vx,pw.y-hint.vy)<.6){v=[hint.vx,hint.vy];say('Tipp-Schuss','#5fd39a');}
  hint=null;home();ball.vx=v[0];ball.vy=v[1];st='fly';shots++;ui();}
function toggleHint(){if(st!=='aim'||!$('ov').hidden)return;if(hint){hint=null;ui();say('Tipp ausgeblendet');return;}
  hint={vx:lvl.s[0],vy:lvl.s[1],path:[]};simulate(lvl,hint.vx,hint.vy,hint.path);ui();say('Zum Kreis ziehen, bei Grün loslassen','var(--acc)');}

// ---------- Ablauf ----------
function burst(px,py,n,cols,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.25+Math.random());parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,d:.5+Math.random()*.9,c:cols[i%cols.length],s:.8+Math.random()*2});}}
function tick(){t+=DT;const e=stepBody(lvl,ball,t);frames++;
  if(frames%2===0){trail.push([ball.x,ball.y]);if(trail.length>60)trail.shift();}
  if(e==='warp'){trail=[];burst(ball.x,ball.y,18,C.wh,1.6);say('Wurmloch!',C.wh[0]);}
  if(e==='hole')return win();
  if(e==='burn')return fail('Verglüht! Zu nah an der Sonne.',[C.sun[1],C.sun[2],'#fff']);
  if(e==='crash')return fail(skin==='halloween'?'Saures! Aufgeschlagen.':'Aufgeschlagen. Nochmal.',['#ff7a59','#ffd0a8','#ffffff']);
  if(e==='out')return fail(skin==='halloween'?'In der Nacht verschwunden.':'Ab ins All.',[C.acc]);
  if(frames>=MAXF)return fail(skin==='halloween'?'Spukt jetzt im Orbit.':'Im Orbit gefangen.',[C.acc]);}
function fail(m,cols){burst(ball.x,ball.y,30,cols,2.2);st='aim';home();say(m,'var(--acc)');}
function win(){st='sink';sinkT=0;ball.x=lvl.h[0];ball.y=lvl.h[1];burst(lvl.h[0],lvl.h[1],40,[C.ring,C.disk,'#ffffff'],2);
  const n=shots<=lvl.par-1?3:shots<=lvl.par?2:1,k=li+1,prev=save.best[k];if(!prev||shots<prev.s||n>prev.st)save.best[k]={s:Math.min(shots,prev?prev.s:99),st:Math.max(n,prev?prev.st:0)};
  save.un=Math.max(save.un,Math.min(N,k+3));persist();ui();}
function showWin(){const n=shots<=lvl.par-1?3:shots<=lvl.par?2:1,last=li===N-1,h=skin==='halloween';
  const title=shots===1?'Hole in one!':n===3?(h?'Gruselig gut!':'Unter Par!'):n===2?(h?'Süßes!':'Par geschafft'):'Eingelocht';
  const nt=!last&&LV[li+1].t>lvl.t?' Als Nächstes beginnt Stufe '+TIERS[LV[li+1].t]+'.':'';
  $('card').innerHTML='<div class="stars">'+'★'.repeat(n)+'<i>'+'★'.repeat(3-n)+'</i></div><h2 class="big">'+title+'</h2><p>'+shots+(shots===1?' Schlag':' Schläge')+' bei Par '+lvl.par+'.'+(last?' Das war die letzte Bahn.':nt)+'</p>'+
    '<div class="row"><button type="button" id="again">Nochmal</button><button type="button" class="go" id="nx">'+(last?'Alle Bahnen':'Weiter')+'</button></div>';
  $('again').onclick=()=>load(li);$('nx').onclick=()=>last?showMenu():load(li+1);$('ov').hidden=false;$('nx').focus({preventScroll:true});}

// ---------- Menü ----------
function showMenu(){if(st==='fly'){st='aim';home();}drag=null;menuTier=LV[li].t;renderMenu();$('ov').hidden=false;}
function renderMenu(){let h='<div class="mhead"><h2>Bahnen</h2><span>★ '+totalStars()+' / '+N*3+'</span></div><div class="tabs" role="tablist">';
  TIERS.forEach((n,i)=>{let a=0,s=0;LV.forEach((l,j)=>{if(l.t===i){a++;if(save.best[j+1])s++;}});h+='<button type="button" role="tab" class="t'+i+'" data-t="'+i+'" aria-selected="'+(i===menuTier)+'">'+n+'<small>'+s+'/'+a+'</small></button>';});
  h+='</div><div class="grid">';
  LV.forEach((l,j)=>{if(l.t!==menuTier)return;const k=j+1,lock=k>save.un,b=save.best[k];h+='<button type="button" data-l="'+k+'" class="'+(j===li?'cur':'')+'" aria-disabled="'+lock+'">'+k+'<small>'+(b?'★'.repeat(b.st):lock?'·':'')+'</small></button>';});
  h+='</div><div class="seg"><span>Look</span><button type="button" data-s="halloween" class="'+(skin==='halloween'?'on':'')+'">Halloween</button><button type="button" data-s="classic" class="'+(skin==='classic'?'on':'')+'">Klassisch</button></div><button type="button" class="go" id="close">Weiterspielen</button>';
  const cd=$('card');cd.innerHTML=h;
  cd.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{menuTier=+b.dataset.t;renderMenu();});
  cd.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const k=+b.dataset.l;if(k<=save.un)load(k-1);else say('Erst die Bahnen davor spielen');});
  cd.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>setSkin(b.dataset.s));
  $('close').onclick=closeMenu;
  const cur=cd.querySelector('.grid .cur');if(cur)cur.scrollIntoView({block:'nearest'});}
function setSkin(s){skin=s;save.skin=s;persist();C=SK[s];document.documentElement.dataset.skin=s;bg=null;bats=[];looks=mkLooks(li);ui();if(!$('ov').hidden&&$('card').querySelector('.tabs'))renderMenu();}
function closeMenu(){$('ov').hidden=true;if(st==='won'||st==='sink')load(li);}
$('reset').onclick=()=>load(li);$('menu').onclick=()=>$('ov').hidden||!$('card').querySelector('.tabs')?showMenu():closeMenu();$('tip').onclick=toggleHint;
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toLowerCase();
  if(k==='t'||k==='h')toggleHint();else if(k==='r')load(li);
  else if(k==='m'||k==='escape'){if($('ov').hidden)showMenu();else if($('card').querySelector('.tabs'))closeMenu();}
  else if(k==='enter'&&st==='won'&&!$('ov').hidden&&document.activeElement?.id!=='again'){e.preventDefault();li===N-1?showMenu():load(li+1);}});

// ---------- Zeichnen ----------
function drawBat(b){const f=Math.sin(b.ph),y=b.y+Math.sin(b.ph*.21)*10;x.save();x.translate(b.x,y);x.scale(b.s*(b.vx<0?-1:1),b.s);
  x.fillStyle='#06030a';x.beginPath();const wy=-7*f;
  for(const sd of[-1,1]){x.moveTo(sd*2,0);x.quadraticCurveTo(sd*8,wy-5,sd*17,wy-1);x.quadraticCurveTo(sd*13,wy+2,sd*12,wy+5);x.quadraticCurveTo(sd*9,wy+2,sd*7,wy+6);x.quadraticCurveTo(sd*5,2,sd*2,3);}
  x.moveTo(3,0);x.ellipse(0,1,3,4,0,0,7);x.moveTo(-2.4,-2);x.lineTo(-1.8,-5.5);x.lineTo(-.6,-2.6);x.moveTo(2.4,-2);x.lineTo(1.8,-5.5);x.lineTo(.6,-2.6);x.fill();x.restore();}
function vortex(px,py,col,dir){x.save();x.translate(px,py);x.fillStyle=rgba(col,.12);x.beginPath();x.arc(0,0,24,0,7);x.fill();
  x.lineCap='round';for(let a=0;a<3;a++){x.beginPath();for(let i=0;i<=20;i++){const f=i/20,r=22-f*16,ang=a*Math.PI*2/3+f*3.2*dir+anim*2.2*dir;i?x.lineTo(Math.cos(ang)*r,Math.sin(ang)*r):x.moveTo(Math.cos(ang)*r,Math.sin(ang)*r);}x.strokeStyle=col;x.lineWidth=2;x.stroke();}
  x.fillStyle=C.bg;x.beginPath();x.arc(0,0,5,0,7);x.fill();x.restore();}
function blackHole(hx,hy){x.save();x.translate(hx,hy);
  x.strokeStyle=rgba(C.ring,.25);x.lineWidth=1;for(let k=0;k<2;k++){const f=(anim*.5+k/2)%1;x.globalAlpha=1-f;x.beginPath();x.arc(0,0,30-f*16,0,7);x.stroke();}x.globalAlpha=1;
  x.rotate(anim*.8);x.strokeStyle=C.ring;x.lineWidth=2;x.setLineDash([5,4.4]);x.beginPath();x.arc(0,0,18,0,7);x.stroke();x.setLineDash([]);
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();x.strokeStyle=C.ring;x.lineWidth=2.4;x.beginPath();x.arc(0,0,12.4,0,7);x.stroke();x.restore();
  if(skin==='halloween')for(let i=0;i<5;i++){const f=(anim*.6+i/5)%1,bx=hx+Math.sin(i*2.3+anim)*8,by=hy-10-f*26;x.strokeStyle=rgba(C.ring,.7*(1-f));x.lineWidth=1.2;x.beginPath();x.arc(bx,by,1.5+f*2.5,0,7);x.stroke();}}
function drawBall(bx,by,sc){x.fillStyle='rgba('+C.trail+',.18)';x.beginPath();x.arc(bx,by,10*sc,0,7);x.fill();x.fillStyle=C.ball;x.beginPath();x.arc(bx,by,5*sc,0,7);x.fill();}
const ACC=[.22,.08,.03];
function render(){const L=lvl,P=planetsAt(L,t);
  x.setTransform(1,0,0,1,0,0);if(!bg)buildBg();x.drawImage(bg,0,0);x.setTransform(DPR*S,0,0,DPR*S,0,0);
  for(const s of stars){x.fillStyle='rgba('+C.star+','+(.1+.6*Math.max(0,Math.sin(anim*1.2+s[2])))+')';x.fillRect(s[0]*L.W,s[1]*L.H,1.4,1.4);}
  for(const b of bats)drawBat(b);
  // Schwerkraftfeld: Ringe dort, wo die Anziehung 0,22 / 0,08 / 0,03 erreicht – größere Masse, weitere Ringe
  P.forEach((p,j)=>{const m=gm(p),sun=p[3]===4;ACC.forEach((a,k)=>{const R=Math.sqrt(m/a);if(R<p[2]+(sun?BURN+8:5)||R>320)return;x.strokeStyle=sun?rgba(C.sun[2],.16-k*.04):'rgba('+C.star+','+(.11-k*.03)+')';x.lineWidth=1;x.beginPath();x.arc(p[0],p[1],R,0,7);x.stroke();});});
  L.p.forEach(q=>{if(q.length<=4)return;const hst=L.p[q[4]];x.strokeStyle='rgba('+C.star+',.12)';x.setLineDash([3,6]);x.beginPath();x.arc(hst[0],hst[1],q[5],0,7);x.stroke();x.setLineDash([]);
    if(st==='aim'){const d=q[6],a=q[7];for(let k=1;k<=2;k++){const b=a+d*(.18+k*.15),px=hst[0]+Math.cos(b)*q[5],py=hst[1]+Math.sin(b)*q[5],tg=b+d*Math.PI/2;x.strokeStyle='rgba('+C.star+','+(.6-k*.17)+')';x.lineWidth=1.5;x.beginPath();x.moveTo(px+Math.cos(tg-2.5)*5,py+Math.sin(tg-2.5)*5);x.lineTo(px,py);x.lineTo(px+Math.cos(tg+2.5)*5,py+Math.sin(tg+2.5)*5);x.stroke();}}});
  if(L.w)L.w.forEach((w,k)=>{const col=C.wh[k%2];vortex(w[0],w[1],col,1);vortex(w[2],w[3],col,-1);x.strokeStyle=rgba(col,.12);x.setLineDash([2,8]);x.beginPath();x.moveTo(w[0],w[1]);x.lineTo(w[2],w[3]);x.stroke();x.setLineDash([]);});
  P.forEach((p,j)=>{const d=looks[j].d;if(d==='sun')drawSun(p[0],p[1],p[2]);else if(d==='lantern')drawLantern(p[0],p[1],p[2]);else if(d==='ghost')drawGhost(p[0],p[1],p[2],L.p[j][6]);else drawPlanet(looks[j],p[0],p[1],p[2],lightFor(p[0],p[1],P));});
  blackHole(L.h[0],L.h[1]);
  if(st==='aim'){x.strokeStyle='rgba('+C.star+',.35)';x.setLineDash([3,4]);x.lineDashOffset=-anim*8;x.beginPath();x.arc(L.b[0],L.b[1],11,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;}
  trail.forEach((q,i)=>{const f=i/trail.length;x.fillStyle='rgba('+C.trail+','+f*.6+')';x.beginPath();x.arc(q[0],q[1],.6+f*1.8,0,7);x.fill();});
  if(hint&&st==='aim'){const dx=-hint.vx/.048,dy=-hint.vy/.048;x.fillStyle='rgba('+C.glow+',.7)';for(const q of hint.path)if(q){x.beginPath();x.arc(q[0],q[1],1.7,0,7);x.fill();}
    let ax,ay,close=false;if(drag){ax=drag.sx;ay=drag.sy;const pw=power();close=Math.hypot(pw.x-hint.vx,pw.y-hint.vy)<.6;}else{ax=L.W/2-dx/2;ay=L.H/2-dy/2;}
    const bx=ax+dx,by=ay+dy,col=close?'#5fd39a':'rgb('+C.glow+')';x.strokeStyle=col;x.lineWidth=2;x.setLineDash([6,5]);x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();x.setLineDash([]);
    if(!drag){x.beginPath();x.arc(ax,ay,9,0,7);x.stroke();}x.fillStyle=col;x.beginPath();x.arc(bx,by,close?14:10,0,7);x.fill();x.lineWidth=1.5;x.beginPath();x.arc(bx,by,22,0,7);x.stroke();
    if(!drag){x.fillStyle='rgb('+C.glow+')';x.font='500 12px Rubik, system-ui, sans-serif';x.textAlign='center';x.fillText('von ○ nach ● ziehen',L.W/2,Math.min(L.H-10,Math.max(ay,by)+30));}}
  if(drag){const pw=power(),o={x:L.b[0],y:L.b[1],vx:pw.x,vy:pw.y,cd:0};let tt=0;x.fillStyle=C.ball;
    for(let i=0;i<70;i++){tt+=DT;const e=stepBody(L,o,tt);if(e==='crash'||e==='burn'||e==='out')break;if(i%3===0){x.globalAlpha=.8*(1-i/70);x.beginPath();x.arc(o.x,o.y,2,0,7);x.fill();}if(e==='hole')break;}x.globalAlpha=1;
    x.strokeStyle='rgba('+C.star+',.25)';x.lineWidth=1;x.beginPath();x.moveTo(drag.sx,drag.sy);x.lineTo(drag.x,drag.y);x.stroke();
    const f=pw.l/150;x.fillStyle='rgba(255,255,255,.1)';x.fillRect(L.b[0]-20,L.b[1]+15,40,4);x.fillStyle=f>.85?'#ff7a59':'rgb('+C.glow+')';x.fillRect(L.b[0]-20,L.b[1]+15,40*f,4);}
  for(const p of parts){x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.s*p.l+.3,0,7);x.fill();}x.globalAlpha=1;
  if(st==='sink'){const k=Math.min(1,sinkT/.6),a=k*12;drawBall(L.h[0]+Math.cos(a)*14*(1-k),L.h[1]+Math.sin(a)*5*(1-k),1-k);}
  else if(st!=='won')drawBall(ball.x,ball.y,1);}

let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;anim+=dt;
  if(st==='fly'){acc+=dt;let n=0;while(acc>=DT&&st==='fly'&&n<40){acc-=DT;tick();n++;}}else acc=0;
  if(st==='sink'){sinkT+=dt;if(sinkT>.75){st='won';showWin();}}
  for(const p of parts){p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=.96;p.vy*=.96;p.l-=dt/p.d;}parts=parts.filter(p=>p.l>0);
  if(skin==='halloween'&&lvl&&!matchMedia('(prefers-reduced-motion: reduce)').matches){batT-=dt;if(batT<=0){batT=5+Math.random()*9;const L=Math.random()<.5;bats.push({x:L?-25:lvl.W+25,y:25+Math.random()*lvl.H*.55,vx:(L?1:-1)*(38+Math.random()*30),ph:Math.random()*6,s:.6+Math.random()*.55});}
    for(const b of bats){b.x+=b.vx*dt;b.ph+=dt*13;}bats=bats.filter(b=>b.x>-50&&b.x<lvl.W+50);}
  if(lvl&&cv.width)render();requestAnimationFrame(frame);}
size();load(Math.min(save.cur||0,save.un-1));requestAnimationFrame(frame);
