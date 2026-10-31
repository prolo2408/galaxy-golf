// Aussehen: Looks (ganze Themen), Planeten, Sonnen, Kugeln, Flugspuren, Ziel-Löcher, Jubel beim Einlochen, Titel, Hintergrund.
// Gezeichnet wird immer in den Kontext x mit den Farben C des angelegten Looks LK.
let x=null,C=null,LK=null,anim=0;
function rng(s){s=s>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}

// ---------- Paletten ----------
const PAL={
  bands:[['#f2c38b','#d9935a','#f8ddb6'],['#c9a7ff','#9f7de6','#e4d6ff'],['#ffb4a2','#e3828a','#ffd8cc'],['#9fd8cb','#66b5a4','#d0f0e8']],
  ringed:[['#ffe6a0','#e2b061'],['#f3d2ff','#c39bf2'],['#c3e4ff','#7cb3e8'],['#ffd3ba','#ec9f78']],
  ice:[['#bfeef7','#e9fcff','#8fd3e3'],['#b9c8ff','#e2e8ff','#8ea2ef']],
  earth:[['#4f8fe8','#6cc48a'],['#3f7fd6','#8fcf6c']],
  mars:[['#e2725b','#b9503f'],['#d98a4e','#b0663a']],
  venus:[['#f5d58e','#e3b25f']],
  moon:[['#bab7cc','#8e8aa8'],['#cdb39a','#9f8166'],['#a9b4c4','#7d889c']]};
const PAL_H={
  bands:[['#ff9f43','#c95f1a','#ffd2a6'],['#9b6bd6','#6c3fae','#cdb0f4'],['#86d46f','#4a933f','#c8f1b8']],
  ringed:[['#dcc6ff','#9b6bd6'],['#ffd1a0','#ff8a1f'],['#cdf7ae','#73c95e']],
  ice:[['#b9f0e0','#e6fff8','#79cdb3'],['#d8c8ff','#f1ebff','#a48ae6']],
  earth:[['#4b3a80','#7bd36a'],['#3a2f6b','#9be07f']],
  mars:[['#c4472f','#86281c']],venus:[['#eadcb6','#c8ae78']],moon:[['#ddd6c6','#a89f8b'],['#c9c0d6','#958aa8']]};
const PAL_N={
  bands:[['#f7b7d8','#e48ab8','#fde0ef'],['#b9a4ff','#8f74e8','#e0d6ff'],['#9be8de','#5fc4b8','#d4f7f2']],
  ringed:[['#ffd6ec','#ff8fc4'],['#c9f5ef','#6fd8c8'],['#e2d4ff','#a98af0']],
  ice:[['#c8f3f0','#effffd','#8fdcd4'],['#e6d8ff','#f6f0ff','#bba4f2']],
  earth:[['#6b7fe0','#f29bc9'],['#5a6fd1','#8fe3d6']],
  mars:[['#e77b9f','#b84e74']],venus:[['#ffd9b8','#f0ad86']],moon:[['#d8cde8','#a597bf'],['#e9d3df','#b893a8']]};
const PAL_F={
  bands:[['#cfe9ff','#8fc3ec','#eef8ff'],['#b8d8f0','#7aaed6','#e3f2ff'],['#c9f2ff','#7fd1ec','#f0fcff']],
  ringed:[['#e8f6ff','#9fd2f5'],['#d6efff','#7fc0ea']],
  ice:[['#d6f6ff','#ffffff','#9fdcf0'],['#c4e2ff','#f2f9ff','#8db8e8']],
  earth:[['#3d6fa8','#dff2ff'],['#2f5f96','#cfeaff']],
  mars:[['#9cc3dd','#6f97b3']],venus:[['#e6f3fa','#b9d6e8']],moon:[['#c9d6e2','#93a7ba'],['#d8e4ee','#a2b6c8']]};
const NEONF=[['#ff2ec4'],['#ffd23f'],['#2ef2ff'],['#9dff3a'],['#b26bff']];
const PAL_NE={bands:NEONF,ringed:NEONF,ice:NEONF,earth:NEONF,mars:NEONF,venus:NEONF,moon:[['#e8e6ff'],['#9de7ff']]};

// ---------- Looks ----------
// css: Farben der Oberfläche, c: Farben im Spielfeld, pal: Planeten, sonne/mond/stil: Zeichenregeln, bg/fx: Hintergrund
const LOOKS={
  'o-klassisch':{css:{void:'#080b22',panel:'#121636',panel2:'#1a1f45',line:'#2a3060',ink:'#e9ecfb',dim:'#8b93b5',acc:'#ffc857','acc-ink':'#221703',ring:'#7ae7c7'},
    c:{bg:'#0c1030',star:'226,232,255',acc:'#ffc857',glow:'255,200,87',ring:'#7ae7c7',disk:'#ffc857',ball:'#ffffff',trail:'255,200,87',
      sun:['#fff3c4','#ffcf4d','#ffad33'],wh:['#7ad3ff','#c59df5'],shade:'rgba(6,6,28,.45)',wind:'150,210,255'},pal:PAL,sonne:'sun',mond:'moon',stil:'flach',seed:42},
  'o-halloween':{css:{void:'#0d0714',panel:'#1a0f26',panel2:'#231433',line:'#3c2652',ink:'#f6edf8',dim:'#a993bb',acc:'#ff8a1f','acc-ink':'#2a1000',ring:'#9cff57'},brand:'"Creepster",var(--display)',
    c:{bg:'#130a1d',star:'240,226,255',acc:'#ff8a1f',glow:'255,138,31',ring:'#9cff57',disk:'#ff8a1f',ball:'#f6f0ff',trail:'255,150,50',
      sun:['#ffe0a8','#ff9a2e','#ff6a1a'],wh:['#9cff57','#c06bff'],shade:'rgba(14,4,22,.5)',wind:'190,255,150'},pal:PAL_H,sonne:'lantern',mond:'ghost',stil:'flach',seed:66,bg:'mondsichel',fx:'bats'},
  'o-nebula':{css:{void:'#110a22',panel:'#1c1234',panel2:'#261a44',line:'#3d2c66',ink:'#f3ecff',dim:'#ab9dca',acc:'#ff6fae','acc-ink':'#2b0717',ring:'#6ff0e0'},
    c:{bg:'#130b27',star:'236,226,255',acc:'#ff6fae',glow:'255,111,174',ring:'#6ff0e0',disk:'#ff6fae',ball:'#ffffff',trail:'255,140,200',
      sun:['#fff0f6','#ffb3d6','#ff7ab8'],wh:['#6ff0e0','#b48cff'],shade:'rgba(20,6,40,.42)',wind:'255,175,220'},pal:PAL_N,sonne:'sun',mond:'moon',stil:'flach',seed:91,bg:'nebel'},
  'o-frost':{css:{void:'#06131f',panel:'#0d2133',panel2:'#132c42',line:'#21445f',ink:'#e8f6ff',dim:'#8fb0c6',acc:'#7fe0ff','acc-ink':'#022130',ring:'#e8f8ff'},
    c:{bg:'#071726',star:'220,240,255',acc:'#7fe0ff',glow:'127,224,255',ring:'#e8f8ff',disk:'#7fe0ff',ball:'#ffffff',trail:'160,225,255',
      sun:['#f4fbff','#a8dcff','#5fb0ff'],wh:['#7fe0ff','#d2f3ff'],shade:'rgba(2,10,22,.45)',wind:'215,245,255'},pal:PAL_F,sonne:'sun',mond:'moon',stil:'flach',seed:17,bg:'polarlicht',fx:'schnee'},
  'o-neon':{css:{void:'#05040b',panel:'#0f0c1d',panel2:'#171330',line:'#2e2752',ink:'#f2f0ff',dim:'#9a95bd',acc:'#2ef2ff','acc-ink':'#001a1d',ring:'#ff2ec4'},
    c:{bg:'#06050d',star:'200,200,255',acc:'#2ef2ff',glow:'46,242,255',ring:'#ff2ec4',disk:'#2ef2ff',ball:'#ffffff',trail:'46,242,255',
      sun:['#fff7c2','#ffd23f','#ff8a00'],wh:['#2ef2ff','#ff2ec4'],shade:'rgba(0,0,0,0)',wind:'46,242,255'},pal:PAL_NE,sonne:'neonsun',mond:'neonmoon',stil:'neon',seed:5,bg:'raster'}
};
function setzeLook(id){LK=LOOKS[id]||LOOKS['o-klassisch'];C=LK.c;const r=document.documentElement;if(typeof TON!=='undefined')TON.look(id);
  for(const k in LK.css)r.style.setProperty('--'+k,LK.css[k]);r.style.setProperty('--feld',LK.c.bg);r.style.setProperty('--brand',LK.brand||'var(--display)');
  r.dataset.look=id.slice(2);const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=LK.css.void;}
function mitLook(id,fn){const a=LK,b=C;LK=LOOKS[id];C=LK.c;try{fn();}finally{LK=a;C=b;}}
function mitCtx(c,fn){const a=x;x=c;try{fn();}finally{x=a;}}
const istHW=()=>LK===LOOKS['o-halloween'];

// Jede Art bekommt nach festen Regeln ihr Aussehen: Sonnen nach dem Look, Monde nach dem Look, Planeten nach Art und Größe.
function mkLooks(l,seed){const r=rng(seed*7919+13),PP=LK.pal;return l.p.map((q,j)=>{const s=seed*131+j*17+1,pk=a=>a[Math.floor(r()*a.length)];
  if(q[3]===4)return{d:LK.sonne,seed:s};
  if(q.length>4)return{d:LK.mond,c:pk(PP.moon),seed:s};
  if(q[3]===2){const d=r()<.45?'ringed':'bands';return{d,c:pk(PP[d]),seed:s};}
  if(q[3]===3)return r()<.35?{d:'ringed',c:pk(PP.ringed),seed:s}:{d:'ice',c:pk(PP.ice),seed:s};
  const d=q[2]<16?'moon':pk(['earth','mars','venus','moon','earth','mars']);return{d,c:pk(PP[d]),seed:s};});}

// ---------- Himmelskörper ----------
function lightFor(px,py,P){let best=null,bd=1e9;for(const p of P)if(p[3]===4){const d=Math.hypot(p[0]-px,p[1]-py);if(d>1&&d<bd){bd=d;best=p;}}
  if(!best)return[-.6,-.8];return[(best[0]-px)/bd,(best[1]-py)/bd];}
function ringArc(r,col,back){x.save();x.rotate(-.35);x.strokeStyle=col;x.lineWidth=Math.max(2,r*.13);x.lineCap='round';x.beginPath();x.ellipse(0,0,r*1.75,r*.42,0,back?Math.PI:0,back?2*Math.PI:Math.PI);x.stroke();
  x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=Math.max(1,r*.04);x.beginPath();x.ellipse(0,0,r*1.58,r*.36,0,back?Math.PI:0,back?2*Math.PI:Math.PI);x.stroke();x.restore();}
function blob(cx,cy,s){x.beginPath();x.arc(cx,cy,s,0,7);x.arc(cx+s*.8,cy+s*.25,s*.7,0,7);x.arc(cx-s*.5,cy+s*.55,s*.6,0,7);x.fill();}
function drawPlanet(L,px,py,r,lt){const R=rng(L.seed);x.save();x.translate(px,py);
  if(L.d==='ringed')ringArc(r,L.c[1],true);
  x.beginPath();x.arc(0,0,r,0,7);x.fillStyle=L.c[0];x.fill();x.save();x.clip();
  if(L.d==='bands'){const n=4+Math.floor(R()*2);for(let i=0;i<n;i++){const y=-r+(i+.5)*2*r/n+(R()-.5)*r*.15,h=r*(.12+R()*.16);x.fillStyle=i%2?L.c[1]:L.c[2];x.beginPath();x.ellipse(0,y,r*1.2,h,0,0,7);x.fill();}
    if(R()<.7){x.fillStyle=L.c[1];x.beginPath();x.ellipse(r*(R()-.5)*.8,r*(.25+R()*.2),r*.24,r*.13,0,0,7);x.fill();}}
  else if(L.d==='ringed'){x.fillStyle=rgba(L.c[1],.45);x.fillRect(-r,-r*.25,2*r,r*.18);x.fillRect(-r,r*.2,2*r,r*.12);}
  else if(L.d==='ice'){x.fillStyle=L.c[1];x.fillRect(-r,-r*.55,2*r,r*.16);x.fillRect(-r,r*.1,2*r,r*.1);x.fillStyle=L.c[2];x.fillRect(-r,r*.42,2*r,r*.14);}
  else if(L.d==='earth'){x.fillStyle=L.c[1];for(let i=0;i<3;i++)blob((R()-.5)*r*1.3,(R()-.5)*r*1.1,r*(.18+R()*.14));x.fillStyle='#f4f8ff';x.beginPath();x.ellipse(0,-r*1.02,r*.7,r*.28,0,0,7);x.ellipse(0,r*1.04,r*.6,r*.22,0,0,7);x.fill();
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-r*.1,-r*.25,r*.45,r*.07,-.2,0,7);x.ellipse(r*.2,r*.35,r*.38,r*.06,-.2,0,7);x.fill();}
  else if(L.d==='mars'){x.fillStyle=L.c[1];for(let i=0;i<3;i++){x.beginPath();x.ellipse((R()-.5)*r*1.2,(R()-.5)*r*1.1,r*(.15+R()*.2),r*(.1+R()*.12),R()*3,0,7);x.fill();}x.fillStyle='#fff1ea';x.beginPath();x.ellipse(0,-r*1.02,r*.5,r*.2,0,0,7);x.fill();}
  else if(L.d==='venus'){x.strokeStyle=L.c[1];x.lineWidth=r*.12;x.lineCap='round';for(let i=0;i<3;i++){const y=(i-1)*r*.5;x.beginPath();x.moveTo(-r,y);x.bezierCurveTo(-r*.3,y-r*.25,r*.3,y+r*.25,r,y);x.stroke();}}
  else if(L.d==='moon'){const n=3+Math.floor(R()*3);for(let i=0;i<n;i++){const cx=(R()-.5)*r*1.3,cy=(R()-.5)*r*1.3,cr=r*(.12+R()*.16);x.fillStyle=L.c[1];x.beginPath();x.arc(cx,cy,cr,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=Math.max(.8,r*.04);x.beginPath();x.arc(cx,cy,cr,Math.PI*.9,Math.PI*1.7);x.stroke();}}
  x.fillStyle=C.shade;x.beginPath();x.rect(-r-2,-r-2,2*r+4,2*r+4);x.moveTo(lt[0]*r*.42+r*1.02,lt[1]*r*.42);x.arc(lt[0]*r*.42,lt[1]*r*.42,r*1.02,0,Math.PI*2,true);x.fill('evenodd');
  x.restore();if(L.d==='ringed')ringArc(r,L.c[1],false);x.restore();}
// Neon: nur leuchtende Umrisse, das Muster verrät die Art
function drawNeon(L,px,py,r){const col=L.c[0];x.save();x.translate(px,py);
  x.fillStyle=rgba(col,.07);x.beginPath();x.arc(0,0,r,0,7);x.fill();
  x.shadowColor=col;x.shadowBlur=10;x.strokeStyle=col;x.lineWidth=2;x.stroke();x.shadowBlur=0;
  x.save();x.beginPath();x.arc(0,0,r-1.5,0,7);x.clip();x.globalAlpha=.65;x.lineWidth=1.2;x.beginPath();
  if(L.d==='bands')for(let i=-1;i<=1;i++){x.moveTo(r*1.1,i*r*.45);x.ellipse(0,i*r*.45,r*1.1,r*.13,0,0,7);}
  else if(L.d==='ringed'||L.d==='ice'){x.moveTo(-r,-r*.22);x.lineTo(r,-r*.22);x.moveTo(-r,r*.26);x.lineTo(r,r*.26);}
  else if(L.d==='earth'){x.ellipse(0,0,r*.45,r,0,0,7);x.moveTo(-r,0);x.lineTo(r,0);}
  else{x.moveTo(-r*.08,-r*.15);x.arc(-r*.3,-r*.15,r*.22,0,7);x.moveTo(r*.47,r*.32);x.arc(r*.3,r*.32,r*.17,0,7);}
  x.stroke();x.restore();
  if(L.d==='ringed'){x.shadowColor=col;x.shadowBlur=8;x.lineWidth=1.6;x.beginPath();x.ellipse(0,0,r*1.7,r*.38,-.35,0,7);x.stroke();}
  x.restore();}
function drawNeonMoon(L,px,py,r){x.save();x.shadowColor=L.c[0];x.shadowBlur=8;x.strokeStyle=L.c[0];x.lineWidth=1.6;x.beginPath();x.arc(px,py,r,0,7);x.stroke();x.restore();}
function burnRing(r,col){x.strokeStyle=col;x.setLineDash([4,5]);x.lineDashOffset=-anim*6;x.lineWidth=1.2;x.beginPath();x.arc(0,0,r+BURN+5,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;}
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
  burnRing(r,'rgba(255,170,60,.5)');x.restore();}
function drawSun(px,py,r){x.save();x.translate(px,py);const s=C.sun;
  const g=x.createRadialGradient(0,0,r*.8,0,0,r*2.6);g.addColorStop(0,rgba(s[1],.35));g.addColorStop(1,rgba(s[1],0));x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.6,0,7);x.fill();
  x.rotate(anim*.15);x.fillStyle=rgba(s[2],.55);x.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=a+.13;x.moveTo(Math.cos(a-.13)*r*1.02,Math.sin(a-.13)*r*1.02);x.lineTo(Math.cos(a)*r*(i%2?1.38:1.55),Math.sin(a)*r*(i%2?1.38:1.55));x.lineTo(Math.cos(b)*r*1.02,Math.sin(b)*r*1.02);}x.fill();x.rotate(-anim*.15);
  x.fillStyle=s[1];x.beginPath();x.arc(0,0,r,0,7);x.fill();x.fillStyle=s[0];x.beginPath();x.arc(-r*.12,-r*.12,r*.68,0,7);x.fill();
  burnRing(r,rgba(s[2],.45));x.restore();}
function drawNeonSun(px,py,r){x.save();x.translate(px,py);const s=C.sun;x.shadowColor=s[2];x.shadowBlur=16;x.strokeStyle=s[1];x.lineWidth=2.4;
  x.fillStyle=rgba(s[2],.1);x.beginPath();x.arc(0,0,r,0,7);x.fill();x.stroke();x.lineWidth=1.4;x.beginPath();x.arc(0,0,r*.6,0,7);x.stroke();
  x.rotate(anim*.25);x.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2;x.moveTo(Math.cos(a)*r*1.18,Math.sin(a)*r*1.18);x.lineTo(Math.cos(a)*r*(i%2?1.38:1.5),Math.sin(a)*r*(i%2?1.38:1.5));}x.stroke();x.rotate(-anim*.25);
  x.shadowBlur=0;burnRing(r,rgba(s[2],.55));x.restore();}
// Ein Körper so, wie der Look ihn verlangt
function drawBody(Lk,p,P,vx){const d=Lk.d;if(d==='sun')drawSun(p[0],p[1],p[2]);else if(d==='lantern')drawLantern(p[0],p[1],p[2]);else if(d==='neonsun')drawNeonSun(p[0],p[1],p[2]);
  else if(d==='ghost')drawGhost(p[0],p[1],p[2],vx);else if(d==='neonmoon')drawNeonMoon(Lk,p[0],p[1],p[2]);else if(LK.stil==='neon')drawNeon(Lk,p[0],p[1],p[2]);
  else drawPlanet(Lk,p[0],p[1],p[2],lightFor(p[0],p[1],P));}

// ---------- Wurmloch, Sonnenwind ----------
function vortex(px,py,col,dir){x.save();x.translate(px,py);x.fillStyle=rgba(col,.12);x.beginPath();x.arc(0,0,24,0,7);x.fill();
  x.lineCap='round';for(let a=0;a<3;a++){x.beginPath();for(let i=0;i<=20;i++){const f=i/20,r=22-f*16,ang=a*Math.PI*2/3+f*3.2*dir+anim*2.2*dir;i?x.lineTo(Math.cos(ang)*r,Math.sin(ang)*r):x.moveTo(Math.cos(ang)*r,Math.sin(ang)*r);}x.strokeStyle=col;x.lineWidth=2;x.stroke();}
  x.fillStyle=C.bg;x.beginPath();x.arc(0,0,5,0,7);x.fill();x.restore();}
function drawWind(z){const[cx,cy,r,ax,ay]=z,m=Math.hypot(ax,ay),col=C.wind;x.save();x.translate(cx,cy);
  x.fillStyle='rgba('+col+',.06)';x.beginPath();x.arc(0,0,r,0,7);x.fill();x.strokeStyle='rgba('+col+',.28)';x.setLineDash([2,6]);x.lineWidth=1;x.stroke();x.setLineDash([]);
  x.clip();x.rotate(Math.atan2(ay,ax));const v=26+m*700,L=8+m*160;x.lineCap='round';
  for(let i=0;i<16;i++){const yy=((i*37.7)%(2*r))-r,ph=((anim*v*(.8+(i%3)*.15)+i*61)%(2*r+L))-r-L;x.strokeStyle='rgba('+col+','+(.16+.12*(i%3))+')';x.lineWidth=1.3;x.beginPath();x.moveTo(ph,yy);x.lineTo(ph+L,yy);x.stroke();}
  x.strokeStyle='rgba('+col+',.6)';x.lineWidth=2;for(let k=-1;k<=1;k++){const o=k*9;x.beginPath();x.moveTo(o-3,-6);x.lineTo(o+3,0);x.lineTo(o-3,6);x.stroke();}
  x.restore();}

// ---------- Ziel-Löcher ----------
function lochStandard(hx,hy){x.save();x.translate(hx,hy);
  x.strokeStyle=rgba(C.ring,.25);x.lineWidth=1;for(let k=0;k<2;k++){const f=(anim*.5+k/2)%1;x.globalAlpha=1-f;x.beginPath();x.arc(0,0,30-f*16,0,7);x.stroke();}x.globalAlpha=1;
  x.rotate(anim*.8);x.strokeStyle=C.ring;x.lineWidth=2;x.setLineDash([5,4.4]);x.beginPath();x.arc(0,0,18,0,7);x.stroke();x.setLineDash([]);
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();x.strokeStyle=C.ring;x.lineWidth=2.4;x.beginPath();x.arc(0,0,12.4,0,7);x.stroke();x.restore();
  if(istHW())for(let i=0;i<5;i++){const f=(anim*.6+i/5)%1,bx=hx+Math.sin(i*2.3+anim)*8,by=hy-10-f*26;x.strokeStyle=rgba(C.ring,.7*(1-f));x.lineWidth=1.2;x.beginPath();x.arc(bx,by,1.5+f*2.5,0,7);x.stroke();}}
function lochQuasar(hx,hy){x.save();x.translate(hx,hy);const pu=.7+.3*Math.sin(anim*3);
  for(const s of[-1,1]){const g=x.createLinearGradient(0,0,0,s*44);g.addColorStop(0,rgba(C.ring,.75*pu));g.addColorStop(1,rgba(C.ring,0));x.fillStyle=g;x.beginPath();x.moveTo(-3,0);x.lineTo(0,s*46);x.lineTo(3,0);x.closePath();x.fill();}
  x.save();x.scale(1,.38);x.rotate(anim*1.4);x.strokeStyle=C.disk;x.lineWidth=4;x.setLineDash([7,5]);x.beginPath();x.arc(0,0,24,0,7);x.stroke();x.lineWidth=2;x.strokeStyle=rgba(C.disk,.5);x.beginPath();x.arc(0,0,31,0,7);x.stroke();x.setLineDash([]);x.restore();
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();x.strokeStyle=C.disk;x.lineWidth=2;x.beginPath();x.arc(0,0,12.2,0,7);x.stroke();x.restore();}
function lochSpirale(hx,hy){x.save();x.translate(hx,hy);x.rotate(-anim*.9);
  for(let a=0;a<3;a++){for(let i=0;i<26;i++){const f=i/26,r=12+f*26,ang=a*Math.PI*2/3+f*4.2;x.fillStyle=f<.5?rgba(C.ring,.85*(1-f)):'rgba(255,255,255,'+(.6*(1-f))+')';x.beginPath();x.arc(Math.cos(ang)*r,Math.sin(ang)*r,1.6*(1-f*.6),0,7);x.fill();}}
  x.rotate(anim*.9);const g=x.createRadialGradient(0,0,8,0,0,18);g.addColorStop(0,rgba(C.disk,.5));g.addColorStop(1,rgba(C.disk,0));x.fillStyle=g;x.beginPath();x.arc(0,0,18,0,7);x.fill();
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();x.restore();}
function lochTor(hx,hy){x.save();x.translate(hx,hy);const gold='#ffd76a';
  const g=x.createRadialGradient(0,0,4,0,0,15);g.addColorStop(0,'#000');g.addColorStop(.7,'#1b0c3a');g.addColorStop(1,'rgba(140,90,255,.6)');x.fillStyle=g;x.beginPath();x.arc(0,0,15,0,7);x.fill();
  x.strokeStyle=gold;x.lineWidth=3.2;x.beginPath();x.arc(0,0,16.5,0,7);x.stroke();
  x.rotate(anim*.6);x.fillStyle=gold;for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillRect(-1.4,-24,2.8,i%2?4:6);}x.rotate(-anim*.6);
  x.strokeStyle=rgba(gold,.35);x.lineWidth=1;x.setLineDash([2,5]);x.lineDashOffset=anim*10;x.beginPath();x.arc(0,0,28,0,7);x.stroke();x.setLineDash([]);x.restore();}
// Glücksbox: Pulsar mit zwei kreisenden Lichtkegeln, Feldlinien und Pulsen im Takt
function lochPulsar(hx,hy){x.save();x.translate(hx,hy);const col=C.ring,ph=(anim*1.5)%1;
  for(let k=0;k<2;k++){const f=(ph+k/2)%1;x.strokeStyle=rgba(col,.55*(1-f));x.lineWidth=.6+2*(1-f);x.beginPath();x.arc(0,0,13+f*24,0,7);x.stroke();}
  x.save();x.rotate(anim*2.4);x.strokeStyle=rgba(col,.22);x.lineWidth=1;x.beginPath();x.ellipse(0,-12,6,12,0,0,7);x.moveTo(6,12);x.ellipse(0,12,6,12,0,0,7);x.stroke();
  for(const s of[0,Math.PI]){x.save();x.rotate(s);const g=x.createLinearGradient(0,0,48,0);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.3,rgba(col,.6));g.addColorStop(1,rgba(col,0));
    x.fillStyle=g;x.beginPath();x.moveTo(9,-2);x.lineTo(48,-9);x.lineTo(48,9);x.lineTo(9,2);x.closePath();x.fill();x.restore();}x.restore();
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();const pu=.55+.45*Math.max(0,Math.sin(anim*9));
  x.strokeStyle='rgba(255,255,255,'+pu+')';x.lineWidth=2.2;x.beginPath();x.arc(0,0,12.3,0,7);x.stroke();
  x.fillStyle=rgba(col,.5+.5*pu);x.beginPath();x.arc(0,0,2.2,0,7);x.fill();x.restore();}
const LOECHER={'l-standard':lochStandard,'l-quasar':lochQuasar,'l-spirale':lochSpirale,'l-tor':lochTor,'l-pulsar':lochPulsar};

// ---------- Kugeln ----------
function kugelBasis(r,col){x.fillStyle=col;x.beginPath();x.arc(0,0,r,0,7);x.fill();}
const KUGELN={
  'k-standard':r=>{x.fillStyle='rgba('+C.trail+',.18)';x.beginPath();x.arc(0,0,r*2,0,7);x.fill();kugelBasis(r,C.ball);},
  'k-mond':r=>{kugelBasis(r,'#cfcbe0');x.fillStyle='#9a96b0';x.beginPath();x.arc(-r*.35,-r*.2,r*.32,0,7);x.arc(r*.4,r*.35,r*.22,0,7);x.fill();},
  'k-erde':r=>{kugelBasis(r,'#4f8fe8');x.save();x.beginPath();x.arc(0,0,r,0,7);x.clip();x.fillStyle='#6cc48a';x.beginPath();x.arc(-r*.3,-r*.2,r*.5,0,7);x.arc(r*.5,r*.5,r*.35,0,7);x.fill();x.restore();},
  'k-mars':r=>{kugelBasis(r,'#e2725b');x.fillStyle='#b9503f';x.beginPath();x.ellipse(r*.2,r*.25,r*.45,r*.25,.4,0,7);x.fill();x.fillStyle='#fff1ea';x.beginPath();x.ellipse(0,-r*.82,r*.45,r*.2,0,0,7);x.fill();},
  'k-komet':r=>{const g=x.createRadialGradient(0,0,r*.5,0,0,r*3);g.addColorStop(0,'rgba(150,230,255,.55)');g.addColorStop(1,'rgba(150,230,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*3,0,7);x.fill();kugelBasis(r,'#e9fbff');x.fillStyle='#9fe3ff';x.beginPath();x.arc(r*.25,r*.25,r*.45,0,7);x.fill();},
  'k-saturn':r=>{x.strokeStyle='#e2b061';x.lineWidth=Math.max(1.2,r*.3);x.beginPath();x.ellipse(0,0,r*1.8,r*.55,-.4,Math.PI,2*Math.PI);x.stroke();kugelBasis(r,'#ffe6a0');x.fillStyle='#e8c477';x.fillRect(-r,-r*.2,2*r,r*.3);x.beginPath();x.ellipse(0,0,r*1.8,r*.55,-.4,0,Math.PI);x.stroke();},
  'k-neutron':r=>{const f=(anim*1.6)%1;x.strokeStyle='rgba(140,200,255,'+(1-f)+')';x.lineWidth=1.2;x.beginPath();x.arc(0,0,r*(1.3+f*1.8),0,7);x.stroke();
    const g=x.createRadialGradient(0,0,0,0,0,r*2);g.addColorStop(0,'rgba(190,225,255,.7)');g.addColorStop(1,'rgba(190,225,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2,0,7);x.fill();kugelBasis(r*.85,'#ffffff');},
  'k-gold':r=>{const g=x.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#fff0b0');g.addColorStop(.5,'#ffcf4d');g.addColorStop(1,'#b8811f');x.fillStyle='rgba(255,207,77,.2)';x.beginPath();x.arc(0,0,r*2,0,7);x.fill();
    x.fillStyle=g;x.beginPath();x.arc(0,0,r,0,7);x.fill();x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(-r*.35,-r*.35,r*.25,0,7);x.fill();},
  // Sternenpass November 2026: Kristall mit sechs Facetten in Regenbogenfarben, dreht sich langsam und blitzt
  'k-prisma':r=>{const R=r*1.08,g=x.createRadialGradient(0,0,r*.4,0,0,r*2.5);g.addColorStop(0,'rgba(210,240,255,.5)');g.addColorStop(1,'rgba(210,240,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.5,0,7);x.fill();
    x.save();x.rotate(anim*.7);for(let i=0;i<6;i++){const a0=i/6*Math.PI*2,a1=(i+1)/6*Math.PI*2;x.fillStyle='hsl('+((i*60+anim*80)%360)+',92%,'+(i%2?74:63)+'%)';
      x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(a0)*R,Math.sin(a0)*R);x.lineTo(Math.cos(a1)*R,Math.sin(a1)*R);x.closePath();x.fill();}
    x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=Math.max(.6,r*.13);x.lineJoin='round';x.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;i?x.lineTo(Math.cos(a)*R,Math.sin(a)*R):x.moveTo(Math.cos(a)*R,Math.sin(a)*R);}x.stroke();
    x.globalAlpha=.6;x.fillStyle='#fff';x.beginPath();x.moveTo(0,-R*.55);x.lineTo(R*.45,-R*.27);x.lineTo(0,0);x.lineTo(-R*.45,-R*.27);x.closePath();x.fill();x.globalAlpha=1;x.restore();
    const f=(anim*.9)%1;if(f<.25){const k=r*.6*(1-Math.abs(f-.125)/.125);x.strokeStyle='#fff';x.lineWidth=Math.max(.6,r*.11);x.lineCap='round';x.beginPath();x.moveTo(r*.55-k,-r*.6);x.lineTo(r*.55+k,-r*.6);x.moveTo(r*.55,-r*.6-k);x.lineTo(r*.55,-r*.6+k);x.stroke();}},
  // Sternenpass November 2026: die Ringkugel in Eis, mit Glitzern auf dem Ring
  'k-saturn-eis':r=>{const g=x.createRadialGradient(0,0,r*.5,0,0,r*2.2);g.addColorStop(0,'rgba(170,230,255,.35)');g.addColorStop(1,'rgba(170,230,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.2,0,7);x.fill();
    x.strokeStyle='#8fd6ff';x.lineWidth=Math.max(1.2,r*.3);x.beginPath();x.ellipse(0,0,r*1.8,r*.55,-.4,Math.PI,2*Math.PI);x.stroke();kugelBasis(r,'#eaf8ff');x.fillStyle='#b9e3f7';x.fillRect(-r,-r*.2,2*r,r*.3);
    x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(-r*.4,-r*.45,r*.2,0,7);x.fill();x.beginPath();x.ellipse(0,0,r*1.8,r*.55,-.4,0,Math.PI);x.stroke();
    const f=(anim*.8)%1,b=Math.PI*(.15+f*.7);x.save();x.rotate(-.4);x.fillStyle='rgba(255,255,255,'+Math.sin(f*Math.PI)+')';x.beginPath();x.arc(Math.cos(b)*r*1.8,Math.sin(b)*r*.55,Math.max(.6,r*.14),0,7);x.fill();x.restore();},
  // Glücksbox: Basalt mit glühenden Rissen, die im Takt pulsieren
  'k-lava':r=>{const pu=.65+.35*Math.sin(anim*3.2),g=x.createRadialGradient(0,0,r*.6,0,0,r*2.4);g.addColorStop(0,'rgba(255,110,30,'+.45*pu+')');g.addColorStop(1,'rgba(255,80,20,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.4,0,7);x.fill();
    const b=x.createRadialGradient(-r*.3,-r*.3,0,0,0,r);b.addColorStop(0,'#8a3a26');b.addColorStop(1,'#3a170f');x.fillStyle=b;x.beginPath();x.arc(0,0,r,0,7);x.fill();
    x.strokeStyle='rgba(255,140,50,'+(.55+.4*pu)+')';x.lineWidth=Math.max(.8,r*.12);x.stroke();x.save();x.beginPath();x.arc(0,0,r,0,7);x.clip();x.strokeStyle='rgb(255,'+(120+90*pu|0)+',40)';x.lineWidth=Math.max(.7,r*.16);x.lineJoin='round';x.lineCap='round';
    x.beginPath();x.moveTo(-r,-r*.3);x.lineTo(-r*.35,-r*.1);x.lineTo(-r*.1,-r*.55);x.lineTo(r*.3,-r*.35);x.lineTo(r,-r*.62);x.moveTo(-r*.35,-r*.1);x.lineTo(-r*.2,r*.4);x.lineTo(r*.25,r*.25);x.lineTo(r*.55,r*.75);x.moveTo(r*.25,r*.25);x.lineTo(r,r*.1);x.stroke();
    x.fillStyle='rgba(255,226,130,'+.85*pu+')';x.beginPath();x.arc(-r*.35,-r*.1,r*.13,0,7);x.arc(r*.25,r*.25,r*.11,0,7);x.fill();x.restore();
    x.fillStyle='rgba(255,255,255,.14)';x.beginPath();x.arc(-r*.38,-r*.45,r*.2,0,7);x.fill();},
  // Glücksbox, legendär: Kern einer Spiralgalaxie, zwei Arme drehen sich um die leuchtende Mitte
  'k-galaxis':r=>{const g=x.createRadialGradient(0,0,0,0,0,r*2.9);g.addColorStop(0,'rgba(255,230,250,.6)');g.addColorStop(.45,'rgba(170,110,255,.24)');g.addColorStop(1,'rgba(90,60,200,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,r*2.9,0,7);x.fill();
    x.save();x.rotate(-.5);x.scale(1,.58);x.rotate(anim*1.2);
    for(let a=0;a<2;a++)for(let i=0;i<20;i++){const f=i/19,R=r*(.55+f*1.8),w=a*Math.PI+f*3.6;x.fillStyle='hsla('+(290-f*95)+',95%,'+(80-f*20)+'%,'+(1-f*.7)+')';x.beginPath();x.arc(Math.cos(w)*R,Math.sin(w)*R,r*(.27-f*.15),0,7);x.fill();}
    x.restore();const c=x.createRadialGradient(-r*.2,-r*.2,0,0,0,r*.85);c.addColorStop(0,'#ffffff');c.addColorStop(.5,'#ffe9bf');c.addColorStop(1,'#ff9be0');x.fillStyle=c;x.beginPath();x.arc(0,0,r*.85,0,7);x.fill();},
  'k-kuerbis':r=>{kugelBasis(r,'#ff8a1f');x.fillStyle='#e8670c';x.beginPath();x.ellipse(-r*.45,0,r*.25,r*.95,0,0,7);x.ellipse(r*.45,0,r*.25,r*.95,0,0,7);x.fill();
    x.strokeStyle='#4f7d24';x.lineWidth=Math.max(1.2,r*.3);x.lineCap='round';x.beginPath();x.moveTo(0,-r*.85);x.lineTo(r*.25,-r*1.35);x.stroke();}
};
function drawBall(id,bx,by,sc){const f=KUGELN[id]||KUGELN['k-standard'],r=(id==='k-standard'?5:5.5)*sc;if(r<=.05)return;x.save();x.translate(bx,by);f(r);x.restore();}

// ---------- Flugspuren ----------
const SPUREN={
  's-standard':(T)=>T.forEach((q,i)=>{const f=i/T.length;x.fillStyle='rgba('+C.trail+','+f*.6+')';x.beginPath();x.arc(q[0],q[1],.6+f*1.8,0,7);x.fill();}),
  's-pixel':(T)=>T.forEach((q,i)=>{const f=i/T.length,s=1+f*2.6;x.fillStyle=rgba(C.acc,f*.8);x.fillRect(Math.round(q[0]-s/2),Math.round(q[1]-s/2),s,s);}),
  's-staub':(T)=>{const cols=['255,255,255','255,215,120','150,220,255'];T.forEach((q,i)=>{const f=i/T.length,tw=.5+.5*Math.sin(anim*14+i*1.7);x.fillStyle='rgba('+cols[i%3]+','+f*tw*.9+')';x.beginPath();x.arc(q[0]+Math.sin(i*2.1)*2,q[1]+Math.cos(i*1.3)*2,.4+f*1.5,0,7);x.fill();
    if(i%7===0&&tw>.8){x.strokeStyle='rgba(255,255,255,'+f*.8+')';x.lineWidth=.8;x.beginPath();x.moveTo(q[0]-3,q[1]);x.lineTo(q[0]+3,q[1]);x.moveTo(q[0],q[1]-3);x.lineTo(q[0],q[1]+3);x.stroke();}});},
  's-feuer':(T)=>T.forEach((q,i)=>{const f=i/T.length,j=Math.sin(anim*30+i)*f;x.fillStyle='rgba(255,'+(60+170*f|0)+','+(20+90*f*f|0)+','+f*.7+')';x.beginPath();x.arc(q[0]+j,q[1]-j,1+f*3.2,0,7);x.fill();}),
  's-plasma':(T)=>{if(T.length<2)return;x.lineCap='round';for(let i=1;i<T.length;i++){const f=i/T.length;x.strokeStyle='rgba(170,120,255,'+f*.5+')';x.lineWidth=1+f*5;x.beginPath();x.moveTo(T[i-1][0],T[i-1][1]);x.lineTo(T[i][0],T[i][1]);x.stroke();}
    for(let i=1;i<T.length;i++){const f=i/T.length;x.strokeStyle='rgba(235,225,255,'+f*.8+')';x.lineWidth=.6+f*1.2;x.beginPath();x.moveTo(T[i-1][0],T[i-1][1]);x.lineTo(T[i][0],T[i][1]);x.stroke();}},
  's-regenbogen':(T)=>T.forEach((q,i)=>{const f=i/T.length;x.fillStyle='hsla('+((i*9+anim*140)%360)+',95%,66%,'+f*.8+')';x.beginPath();x.arc(q[0],q[1],.8+f*2,0,7);x.fill();}),
  // Sternenpass November 2026: der Feuerschweif in Blau
  's-feuer-blau':(T)=>T.forEach((q,i)=>{const f=i/T.length,j=Math.sin(anim*30+i)*f;x.fillStyle='rgba('+(50+170*f*f|0)+','+(110+130*f|0)+',255,'+f*.75+')';x.beginPath();x.arc(q[0]+j,q[1]-j,1+f*3.2,0,7);x.fill();}),
  // Glücksbox, legendär: ein Band aus Sternenlicht, darin funkeln bunte Sterne
  's-milchstrasse':(T)=>{if(T.length<2)return;x.lineCap='round';x.lineJoin='round';
    for(const[w,a,col]of[[15,.08,'170,140,255'],[8,.14,'255,190,235'],[2.6,.38,'255,255,255']])for(let i=1;i<T.length;i++){const f=i/T.length;x.strokeStyle='rgba('+col+','+a*f*2+')';x.lineWidth=w*(.4+f*.6);x.beginPath();x.moveTo(T[i-1][0],T[i-1][1]);x.lineTo(T[i][0],T[i][1]);x.stroke();}
    const cols=['255,255,255','255,214,140','160,220,255','255,170,230'];
    for(let i=1;i<T.length;i++){const q=T[i],p=T[i-1],f=i/T.length,h=Math.sin(Math.round(q[0]*3)*12.9898+Math.round(q[1]*3)*78.233)*43758.5453,z=h-Math.floor(h),dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,o=(z-.5)*12*f,
        sx=q[0]-dy/l*o,sy=q[1]+dx/l*o,tw=.5+.5*Math.sin(anim*7+z*40);x.fillStyle='rgba('+cols[Math.floor(z*4)]+','+f*(.4+.6*tw)+')';x.beginPath();x.arc(sx,sy,.4+f*1.3*tw,0,7);x.fill();
      if(z>.86&&tw>.7){x.strokeStyle='rgba(255,255,255,'+f*.8+')';x.lineWidth=.7;x.beginPath();x.moveTo(sx-3.2*f,sy);x.lineTo(sx+3.2*f,sy);x.moveTo(sx,sy-3.2*f);x.lineTo(sx,sy+3.2*f);x.stroke();}}},
  's-irrlicht':(T)=>T.forEach((q,i)=>{const f=i/T.length,o=Math.sin(i*.6+anim*7)*2.5*f;x.fillStyle='rgba(156,255,87,'+f*.6+')';x.beginPath();x.arc(q[0]+o,q[1]-o,1+f*2.2,0,7);x.fill();
    if(i%4===0){x.fillStyle='rgba(220,255,200,'+f*.5+')';x.beginPath();x.arc(q[0]-o,q[1]+o,.7,0,7);x.fill();}})
};

// ---------- Jubel beim Einlochen ----------
// Jeder Jubel ist eine feste Abfolge: zu jedem Zeitpunkt t (Sekunden seit dem Einlochen) liegt fest, was zu sehen ist.
// So läuft er gleich im Spielfeld, in der Großansicht und auf der Shop-Karte (dort als Standbild).
const JUBEL_T=1.7;
function stern4(px,py,L){x.beginPath();x.moveTo(px,py-L);x.quadraticCurveTo(px,py,px+L,py);x.quadraticCurveTo(px,py,px,py+L);x.quadraticCurveTo(px,py,px-L,py);x.quadraticCurveTo(px,py,px,py-L);x.fill();}
const JUBEL={
  'j-funken':(t,hx,hy)=>{const R=rng(31),cols=[C.ring,C.disk,'#ffffff'],k=1-Math.pow(.96,60*t);
    for(let i=0;i<40;i++){const a=R()*6.283,v=2*(.25+R()),d=.5+R()*.9,s=.8+R()*2,l=1-t/d;if(l<=0)continue;const D=v*25*k;x.globalAlpha=l;x.fillStyle=cols[i%3];x.beginPath();x.arc(hx+Math.cos(a)*D,hy+Math.sin(a)*D,s*l+.3,0,7);x.fill();}x.globalAlpha=1;},
  // Bunte Schnipsel fliegen hoch, drehen sich und segeln herunter
  'j-konfetti':(t,hx,hy,o)=>{const R=rng(77),cols=['#ff5d8f','#ffd23f','#4fd1ff','#7dff8a','#b46cff','#ff9f43'],al=Math.min(1,(JUBEL_T-t)/.5),dir=o&&o.auf||-1;if(al<=0)return;
    for(let i=0;i<46;i++){const a=dir*Math.PI/2+(R()-.5)*(dir<0?2.2:3.4),v=90+R()*150,rot=R()*6,sp=(R()-.5)*16,fl=4+R()*8,w=3+R()*2.5;
      const e=1-Math.exp(-2.2*t),px=hx+Math.cos(a)*v*e/2.2+Math.sin(t*3+i)*6*t,py=hy+Math.sin(a)*v*e/2.2+70*t*t;
      x.save();x.globalAlpha=al;x.translate(px,py);x.rotate(rot+sp*t);x.scale(1,Math.cos(t*fl+i));x.fillStyle=cols[i%6];x.fillRect(-w/2,-1.3,w,2.6);x.restore();}x.globalAlpha=1;},
  // Goldene Sterne steigen auf, funkeln und rieseln herab
  'j-sternregen':(t,hx,hy,o)=>{const R=rng(53),cols=['#ffd76a','#fff3b0','#ffffff'],dir=o&&o.auf||-1;
    if(t<.25){x.strokeStyle='rgba(255,215,106,'+(1-t/.25)+')';x.lineWidth=2;x.beginPath();x.arc(hx,hy,12+t*90,0,7);x.stroke();}
    for(let i=0;i<20;i++){const a=dir*Math.PI/2+(R()-.5)*(dir<0?2:3.2),v=110+R()*120,L=2.6+R()*2.6,d=1.1+R()*.6,l=Math.min(1,(d-t)/.35);if(l<=0)continue;
      const e=(1-Math.exp(-3*t))/3,px=hx+Math.cos(a)*v*e,py=hy+Math.sin(a)*v*e+38*t*t,tw=.7+.3*Math.sin(t*16+i*2);
      x.globalAlpha=l*.16;x.beginPath();x.arc(px,py,L*1.2,0,7);x.fill();x.globalAlpha=l;x.fillStyle=cols[i%3];stern4(px,py,L*tw);}x.globalAlpha=1;},
  // Drei Raketen steigen auf und platzen nacheinander in Funkenkugeln
  'j-feuerwerk':(t,hx,hy,o)=>{const R=rng(19),dir=o&&o.auf||-1;
    for(let r=0;r<3;r++){const t0=r*.24,tr=t-t0;const ang=(r-1)*.5,hoch=74+R()*30,hue=[C.ring,C.acc,'#ff6fae'][r];const sparks=[];for(let i=0;i<30;i++)sparks.push([R()*6.283,55+R()*55]);
      if(tr<0)continue;const steig=.32,bx=hx+Math.sin(ang)*hoch,by=hy+dir*Math.cos(ang)*hoch;
      if(tr<steig){const f=1-Math.pow(1-tr/steig,2),px=hx+(bx-hx)*f,py=hy+(by-hy)*f;x.fillStyle='#fff';x.beginPath();x.arc(px,py,1.8,0,7);x.fill();
        x.strokeStyle=rgba(hue,.6);x.lineWidth=1.4;x.beginPath();x.moveTo(px,py);x.lineTo(hx+(bx-hx)*Math.max(0,f-.25),hy+(by-hy)*Math.max(0,f-.25));x.stroke();continue;}
      const tb=tr-steig,l=1-tb/.95;if(l<=0)continue;
      if(tb<.14){x.fillStyle='rgba(255,255,255,'+(1-tb/.14)*.8+')';x.beginPath();x.arc(bx,by,6+tb*60,0,7);x.fill();}
      const e=(1-Math.exp(-2.6*tb))/2.6;x.globalAlpha=l;for(const[a,v]of sparks){const px=bx+Math.cos(a)*v*e,py=by+Math.sin(a)*v*e+26*tb*tb;x.fillStyle=hue;x.beginPath();x.arc(px,py,1.5*l+.4,0,7);x.fill();
        x.fillStyle='rgba(255,255,255,'+.7*l+')';x.beginPath();x.arc(px,py,.6,0,7);x.fill();}x.globalAlpha=1;}},
  // Sternenpass November 2026: Lichtblitz, drei Druckwellen rollen über das Feld, Speedlines zeigen nach außen
  'j-schockwelle':(t,hx,hy)=>{if(t<.2){const g=x.createRadialGradient(hx,hy,0,hx,hy,40);g.addColorStop(0,'rgba(255,255,255,'+(1-t/.2)+')');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(hx,hy,40,0,7);x.fill();}
    [['#ffffff',0,4],[C.ring,.12,3],[C.acc,.24,2.4]].forEach(([col,t0,lw])=>{const tr=t-t0;if(tr<0||tr>1.1)return;const rad=12+tr*200*(1-tr*.3),l=1-tr/1.1;
      x.strokeStyle='rgba(0,0,0,'+.25*l+')';x.lineWidth=lw*3*l+1;x.beginPath();x.arc(hx,hy,Math.max(1,rad-lw*2),0,7);x.stroke();
      x.strokeStyle=rgba(col,l);x.lineWidth=lw*l+.4;x.beginPath();x.arc(hx,hy,rad,0,7);x.stroke();});
    if(t<.7){const l=1-t/.7;x.strokeStyle='rgba(255,255,255,'+.7*l+')';x.lineWidth=1.2;x.lineCap='round';x.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2+.2,r1=18+t*160,r2=r1+10+16*l;x.moveTo(hx+Math.cos(a)*r1,hy+Math.sin(a)*r1);x.lineTo(hx+Math.cos(a)*r2,hy+Math.sin(a)*r2);}x.stroke();}}
};
// o.auf: -1 nach oben (Standard), 1 nach unten, wenn oben kein Platz ist
function drawJubel(id,t,hx,hy,o){if(t<0||t>JUBEL_T)return;(JUBEL[id]||JUBEL['j-funken'])(t,hx,hy,o);}
// Standbild für Karten: der Moment, in dem der Jubel am meisten zeigt
const JUBEL_STILL={'j-funken':.22,'j-konfetti':.5,'j-sternregen':.55,'j-feuerwerk':.72,'j-schockwelle':.3};

// ---------- Titel ----------
// Ein Titel steht neben dem Namen in Rangliste und Profil. Gezeichnet als Schleife mit Wappen.
const TITEL_STIL={'t-keiner':{c:'#8b93b5'},'t-sternschnuppe':{c:'#ffd76a',sym:'schnuppe'},'t-kometenjaeger':{c:'#7fe0ff',sym:'komet'},'t-schwerkraft':{c:'#c39bff',sym:'orbit'}};
function titelFarbe(id){return(TITEL_STIL[id]||TITEL_STIL['t-keiner']).c;}
function titelZeichnen(id){const S=TITEL_STIL[id]||TITEL_STIL['t-keiner'],col=S.c,name=(ITEM[id]||{}).n||'';x.save();
  if(!S.sym){x.strokeStyle=rgba(col,.6);x.setLineDash([4,4]);x.lineWidth=1.5;x.beginPath();x.roundRect?x.roundRect(18,34,84,26,8):x.rect(18,34,84,26);x.stroke();x.setLineDash([]);
    x.fillStyle=col;x.font='500 11px Rubik, system-ui, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(name,60,47);x.restore();return;}
  const g=x.createRadialGradient(60,30,2,60,30,40);g.addColorStop(0,rgba(col,.45));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.beginPath();x.arc(60,30,40,0,7);x.fill();
  // Wappen
  x.fillStyle='#141936';x.beginPath();x.arc(60,30,17,0,7);x.fill();x.strokeStyle=col;x.lineWidth=2.2;x.stroke();x.save();x.translate(60,30);
  if(S.sym==='schnuppe'){x.strokeStyle=rgba(col,.7);x.lineCap='round';for(let k=0;k<3;k++){x.lineWidth=2.4-k*.6;x.beginPath();x.moveTo(-1-k*1.5,1+k*3);x.lineTo(-12+k,8+k*3);x.stroke();}x.fillStyle=col;stern4(3,-3,8.5);x.fillStyle='#fff';stern4(3,-3,3.5);}
  else if(S.sym==='komet'){const t=x.createLinearGradient(-12,10,4,-4);t.addColorStop(0,rgba(col,0));t.addColorStop(1,rgba(col,.9));x.fillStyle=t;x.beginPath();x.moveTo(-13,12);x.lineTo(1,-8);x.lineTo(8,-1);x.closePath();x.fill();x.fillStyle='#eafcff';x.beginPath();x.arc(4,-4,5,0,7);x.fill();
    x.strokeStyle=col;x.lineWidth=1.4;x.beginPath();x.arc(4,-4,8.5,-2.4,.8);x.stroke();}
  else{x.strokeStyle=rgba(col,.8);x.lineWidth=1.2;x.beginPath();x.ellipse(0,0,13,5,-.5,0,7);x.stroke();x.beginPath();x.ellipse(0,0,13,5,.6,0,7);x.stroke();x.fillStyle=col;x.beginPath();x.arc(0,0,4.5,0,7);x.fill();
    const a=anim*2.2;x.fillStyle='#fff';x.beginPath();x.arc(Math.cos(a)*13*Math.cos(-.5)-Math.sin(a)*5*Math.sin(-.5),Math.cos(a)*13*Math.sin(-.5)+Math.sin(a)*5*Math.cos(-.5),1.8,0,7);x.fill();}
  x.restore();
  // Schleife mit Namen, ein Glanz läuft darüber
  const y=56,h=22;x.fillStyle=rgba(col,.55);for(const s of[-1,1]){x.beginPath();x.moveTo(60+s*44,y+5);x.lineTo(60+s*56,y+5);x.lineTo(60+s*51,y+h/2+5);x.lineTo(60+s*56,y+h+5);x.lineTo(60+s*44,y+h+5);x.closePath();x.fill();}
  const bg=x.createLinearGradient(0,y,0,y+h);bg.addColorStop(0,col);bg.addColorStop(1,rgba(col,.75));x.fillStyle=bg;x.beginPath();x.moveTo(14,y);x.lineTo(106,y);x.lineTo(102,y+h/2);x.lineTo(106,y+h);x.lineTo(14,y+h);x.lineTo(18,y+h/2);x.closePath();x.fill();
  x.save();x.clip();const gx=((anim*.45)%1.6-.3)*120;const sh=x.createLinearGradient(gx-14,0,gx+14,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(255,255,255,.55)');sh.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=sh;x.fillRect(0,y,120,h);x.restore();
  x.fillStyle='#171026';let fs=12;x.font='600 '+fs+'px "Chakra Petch", system-ui, sans-serif';while(fs>8&&x.measureText(name).width>74){fs-=.5;x.font='600 '+fs+'px "Chakra Petch", system-ui, sans-serif';}
  x.textAlign='center';x.textBaseline='middle';x.fillText(name,60,y+h/2+.5);x.restore();}

// ---------- Hintergrund ----------
function buildBg(w,h,k){const c=document.createElement('canvas'),g=c.getContext('2d'),r=rng(LK.seed);c.width=w;c.height=h;
  g.fillStyle=C.bg;g.fillRect(0,0,w,h);
  if(LK.bg==='nebel')for(let i=0;i<6;i++){const cx=r()*w,cy=r()*h,rr=Math.max(w,h)*(.25+r()*.3),col=['255,111,174','111,240,224','180,140,255'][i%3],gr=g.createRadialGradient(cx,cy,0,cx,cy,rr);gr.addColorStop(0,'rgba('+col+',.13)');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}
  if(LK.bg==='polarlicht')for(let b=0;b<3;b++){const y0=h*(.08+b*.07),gr=g.createLinearGradient(0,y0-40*k,0,y0+60*k);gr.addColorStop(0,'rgba(120,255,200,0)');gr.addColorStop(.5,'rgba('+(b%2?'120,255,210':'120,200,255')+',.10)');gr.addColorStop(1,'rgba(120,255,200,0)');
    g.fillStyle=gr;g.beginPath();g.moveTo(0,y0);for(let i=0;i<=12;i++){const xx=i/12*w;g.lineTo(xx,y0+Math.sin(i*.9+b*2)*22*k);}g.lineTo(w,y0+80*k);g.lineTo(0,y0+80*k);g.fill();}
  if(LK.bg==='raster'){g.strokeStyle='rgba(46,242,255,.07)';g.lineWidth=1;const s=36*k;for(let xx=s/2;xx<w;xx+=s){g.beginPath();g.moveTo(xx,0);g.lineTo(xx,h);g.stroke();}for(let yy=s/2;yy<h;yy+=s){g.beginPath();g.moveTo(0,yy);g.lineTo(w,yy);g.stroke();}}
  const n=Math.round(w*h/(1100*k*k));for(let i=0;i<n;i++){const sz=(.5+Math.pow(r(),4)*1.4)*k;g.fillStyle='rgba('+C.star+','+(.2+r()*.55)+')';g.beginPath();g.arc(r()*w,r()*h,sz,0,7);g.fill();}
  for(let i=0;i<7;i++){const sx=r()*w,sy=r()*h,L=(2.5+r()*3)*k;g.fillStyle='rgba('+C.star+',.85)';g.beginPath();g.moveTo(sx,sy-L);g.quadraticCurveTo(sx,sy,sx+L,sy);g.quadraticCurveTo(sx,sy,sx,sy+L);g.quadraticCurveTo(sx,sy,sx-L,sy);g.quadraticCurveTo(sx,sy,sx,sy-L);g.fill();}
  if(LK.bg==='mondsichel'){const mr=Math.min(w,h)*.09,mx=w-mr*1.6,my=mr*1.6;g.fillStyle='rgba(246,217,168,.22)';g.beginPath();g.arc(mx,my,mr,0,Math.PI*2);g.moveTo(mx+mr*.38+mr*.92,my-mr*.12);g.arc(mx+mr*.38,my-mr*.12,mr*.92,0,Math.PI*2);g.fill('evenodd');}
  return c;}
// Bewegte Kleinigkeiten: Fledermäuse an Halloween, Schnee bei Frost
let fx=[],fxT=2.5;
function fxStep(dt,W,H){if(matchMedia('(prefers-reduced-motion: reduce)').matches){fx=[];return;}
  if(LK.fx==='bats'){fxT-=dt;if(fxT<=0){fxT=5+Math.random()*9;const L=Math.random()<.5;fx.push({k:'bat',x:L?-25:W+25,y:25+Math.random()*H*.55,vx:(L?1:-1)*(38+Math.random()*30),ph:Math.random()*6,s:.6+Math.random()*.55});}}
  else if(LK.fx==='schnee'){while(fx.length<26)fx.push({k:'flocke',x:Math.random()*W,y:Math.random()*H,vx:0,vy:6+Math.random()*10,ph:Math.random()*6,s:.6+Math.random()*1.2});}
  for(const b of fx){b.ph+=dt*(b.k==='bat'?13:1);if(b.k==='bat')b.x+=b.vx*dt;else{b.y+=b.vy*dt;b.x+=Math.sin(b.ph)*6*dt;if(b.y>H+5){b.y=-5;b.x=Math.random()*W;}}}
  fx=fx.filter(b=>b.k===(LK.fx==='bats'?'bat':'flocke')&&b.x>-50&&b.x<W+50);}
function fxDraw(){for(const b of fx){if(b.k==='flocke'){x.fillStyle='rgba(235,248,255,.55)';x.beginPath();x.arc(b.x,b.y,b.s,0,7);x.fill();continue;}
  const f=Math.sin(b.ph),y=b.y+Math.sin(b.ph*.21)*10;x.save();x.translate(b.x,y);x.scale(b.s*(b.vx<0?-1:1),b.s);
  x.fillStyle='#06030a';x.beginPath();const wy=-7*f;
  for(const sd of[-1,1]){x.moveTo(sd*2,0);x.quadraticCurveTo(sd*8,wy-5,sd*17,wy-1);x.quadraticCurveTo(sd*13,wy+2,sd*12,wy+5);x.quadraticCurveTo(sd*9,wy+2,sd*7,wy+6);x.quadraticCurveTo(sd*5,2,sd*2,3);}
  x.moveTo(3,0);x.ellipse(0,1,3,4,0,0,7);x.moveTo(-2.4,-2);x.lineTo(-1.8,-5.5);x.lineTo(-.6,-2.6);x.moveTo(2.4,-2);x.lineTo(1.8,-5.5);x.lineTo(.6,-2.6);x.fill();x.restore();}}
