// Galaxy Golf – Spiel. Erwartet LV (Bahnen) und die Funktionen aus physics.js.
const N=LV.length;
const TIERS=['Leicht','Mittel','Schwer','Extrem'];
const $=id=>document.getElementById(id);
const cv=$('c'),x=cv.getContext('2d');

// ---------- Spielstand ----------
let save={un:3,best:{},seen:{},skin:null,cur:0};
try{const s=JSON.parse(localStorage.getItem('gg2')||'null');if(s&&s.best)save=Object.assign(save,s);}catch(e){}
function persist(){try{localStorage.setItem('gg2',JSON.stringify(save));}catch(e){}}
function autoSkin(){const d=new Date(),m=d.getMonth(),dd=d.getDate();return(m===9&&dd>=10)||(m===10&&dd<=3)?'halloween':'classic';}

// ---------- Skins ----------
const SK={
  classic:{void:'#070a16',push:'255,106,61',pull:'150,170,255',glow:'242,181,68',trail:'245,190,90',
    disk:['#fff4d6','#ffc964','#e0782a'],wh:['#6fd3ff','#b48cff'],ball:'#c9d3ff',
    neb:[['#2b3a8a',.5],['#5b2a86',.32],['#0f5d6b',.28],['#1d2a66',.4],['#7a3a2a',.12]]},
  halloween:{void:'#0b0612',push:'255,138,31',pull:'190,160,255',glow:'255,138,31',trail:'255,150,50',
    disk:['#ffe2b0','#ff9a2e','#a03cff'],wh:['#9cff57','#c06bff'],ball:'#ffe0c2',
    neb:[['#4a1a6b',.55],['#7a2d14',.26],['#173d2a',.24],['#2a1240',.45],['#6a1a3a',.2]]}
};
let skin=save.skin||autoSkin(),C=SK[skin];
document.documentElement.dataset.skin=skin;

// ---------- Zufall und Rauschen ----------
function rng(s){s=s>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function hsh(x,y,z,s){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,1440662683)+Math.imul(s,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vn(x,y,z,s){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  const a=hsh(xi,yi,zi,s),b=hsh(xi+1,yi,zi,s),c=hsh(xi,yi+1,zi,s),d=hsh(xi+1,yi+1,zi,s),e=hsh(xi,yi,zi+1,s),f=hsh(xi+1,yi,zi+1,s),g=hsh(xi,yi+1,zi+1,s),h=hsh(xi+1,yi+1,zi+1,s);
  const l1=a+(b-a)*u,l2=c+(d-c)*u,l3=e+(f-e)*u,l4=g+(h-g)*u,m1=l1+(l2-l1)*v,m2=l3+(l4-l3)*v;return m1+(m2-m1)*w;}
function fbm(x,y,z,s,o){let t=0,a=.5,n=0;for(let i=0;i<o;i++){t+=a*vn(x+7.1,y+3.3,z+5.7,s+i*31);n+=a;a*=.5;x*=2.03;y*=2.03;z*=2.03;}return t/n;}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const sst=(e0,e1,v)=>{const t=Math.min(1,Math.max(0,(v-e0)/(e1-e0)));return t*t*(3-2*t);};
function pal(P,t){t=Math.min(.9999,Math.max(0,t))*(P.length-1);const i=Math.floor(t);return mix(P[i],P[i+1],t-i);}
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}

// ---------- Planeten-Oberflächen ----------
let E=0,SP=0;
function craters(n){return r=>{const cr=[];for(let i=0;i<n;i++){const a=r()*2-1,b=r()*2-1,c=r()*2-1,l=Math.hypot(a,b,c)||1;cr.push([a/l,b/l,c/l,.05+Math.pow(r(),2)*.22]);}return{cr};};}
function crater(c,x,y,z,q,k){let m=1;for(const r of q.cr){const dx=x-r[0],dy=y-r[1],dz=z-r[2],d=Math.sqrt(dx*dx+dy*dy+dz*dz)/r[3];if(d<1.15)m*=d<.75?1-.2*k:d<1?1+.16*k:1-.06*k;}return[c[0]*m,c[1]*m,c[2]*m];}
function spot(x,y,z,lon0,lat0,w,h){const lon=Math.atan2(x,z),lat=Math.asin(Math.max(-1,Math.min(1,y)));let dl=lon-lon0;if(dl>Math.PI)dl-=2*Math.PI;if(dl<-Math.PI)dl+=2*Math.PI;return Math.hypot(dl*Math.cos(lat)/w,(lat-lat0)/h);}
const TY={
  gas:{atm:[255,215,170],as:.3,
    prep:r=>({P:r()<.6?[[150,95,60],[214,176,132],[240,224,196],[196,140,96],[228,200,160],[170,110,72]]:[[110,58,40],[200,120,72],[238,176,118],[156,84,52],[246,214,166]],lon:(r()-.5)*1.4,lat:(.3+r()*.15)*(r()<.5?-1:1),sp:r()<.75}),
    col(x,y,z,q,s){const w=fbm(x*2.2,y*5,z*2.2,s,4),b=y*7+(w-.5)*2.6+Math.sin(y*29)*.12;let c=pal(q.P,(Math.sin(b*1.7)+1)/2);
      c=mix(c,[255,250,240],(fbm(x*7,y*15,z*7,s+9,3)-.5)*.35);
      if(q.sp){const d=spot(x,y,z,q.lon,q.lat,.3,.13);if(d<1.25){const sw=fbm(x*9,y*9,z*9,s+3,2);c=mix(c,[196,92,58],sst(1,.2,d)*(.7+.3*sw));c=mix(c,[240,215,180],sst(.95,1.05,d)*sst(1.25,1.1,d)*.6);}}
      return c;}},
  saturn:{atm:[255,230,180],as:.22,ring:1,
    prep:()=>({P:[[212,184,138],[234,214,170],[196,162,114],[226,204,160],[205,176,126]]}),
    col(x,y,z,q,s){const w=fbm(x*2,y*4,z*2,s,3),b=y*6+(w-.5)*1.2;return mix(pal(q.P,(Math.sin(b*2)+1)/2),[250,240,215],(fbm(x*6,y*12,z*6,s+2,2)-.5)*.3);}},
  ice:{atm:[140,200,255],as:.55,
    prep:r=>({u:r()<.4,lon:(r()-.5)*1.2,lat:(r()-.5)*.7}),
    col(x,y,z,q,s){const P=q.u?[[128,192,208],[160,216,226],[116,178,198],[176,226,232]]:[[36,70,168],[60,108,210],[30,58,146],[82,132,222]];
      const n=fbm(x*2,y*6,z*2,s,3);let c=pal(P,(Math.sin((y*4+(n-.5)*1.3)*2)+1)/2);
      if(!q.u){const d=spot(x,y,z,q.lon,q.lat,.22,.11);if(d<1)c=mix(c,[14,26,80],sst(1,.3,d)*.8);c=mix(c,[220,235,255],sst(.72,.8,fbm(x*5,y*9,z*5,s+5,3))*.7);}
      SP=.12;return c;}},
  earth:{atm:[110,170,255],as:.65,
    col(x,y,z,q,s){const n=fbm(x*1.7,y*1.7,z*1.7,s,5);let c;SP=0;
      if(n>.53){const m=fbm(x*4,y*4,z*4,s+5,3);c=mix([58,108,48],[168,146,92],sst(.35,.65,m));c=mix(c,[118,108,96],sst(.62,.72,n));}
      else{c=mix([10,34,92],[34,98,162],sst(.3,.53,n));SP=.6;}
      if(Math.abs(y)+(fbm(x*5,y*5,z*5,s+2,2)-.5)*.16>.84){c=[232,238,245];SP=.1;}
      const a=sst(.52,.72,fbm(x*2.6+3,y*3.4,z*2.6,s+11,4))*.92;if(a>0){c=mix(c,[248,250,255],a);SP*=1-a;}
      return c;}},
  mars:{atm:[255,160,120],as:.16,prep:craters(8),
    col(x,y,z,q,s){const n=fbm(x*2.2,y*2.2,z*2.2,s,5);let c=mix([116,50,32],[198,96,56],sst(.3,.6,n));c=mix(c,[226,152,106],sst(.62,.76,n)*.6);
      c=mix(c,[240,236,230],sst(.88,.94,Math.abs(y)+(n-.5)*.1));return crater(c,x,y,z,q,.45);}},
  venus:{atm:[255,226,170],as:.45,
    col(x,y,z,q,s){const w=fbm(x*1.5,y*1.5,z*1.5,s,3),n=fbm(x*2+w*2.2,y*4+w*1.6,z*2,s+4,4);return mix([194,146,88],[248,228,178],sst(.3,.7,n));}},
  moon:{atm:null,prep:craters(22),
    col(x,y,z,q,s){const n=fbm(x*2,y*2,z*2,s,5);let c=mix([92,92,100],[178,176,172],sst(.3,.7,n));if(fbm(x*1.2,y*1.2,z*1.2,s+3,3)>.56)c=mix(c,[74,76,86],.6);return crater(c,x,y,z,q,1);}},
  rocky:{atm:null,prep:craters(16),
    col(x,y,z,q,s){const n=fbm(x*2.4,y*2.4,z*2.4,s,5);return crater(mix([96,82,70],[176,156,130],sst(.28,.72,n)),x,y,z,q,.9);}},
  lava:{atm:[255,90,40],as:.55,
    col(x,y,z,q,s){const n=fbm(x*2.6,y*2.6,z*2.6,s,5);let c=mix([30,22,22],[74,52,46],n);const cr=sst(.045,0,Math.abs(n-.5));E=cr;if(cr>0)c=mix(c,[255,150,50],cr);
      const h=sst(.6,.74,fbm(x*1.5,y*1.5,z*1.5,s+7,2))*.55;if(h>0){c=mix(c,[255,90,30],h);E=Math.max(E,h);}return c;}},
  pumpkin:{atm:[255,140,30],as:.35,flat:1,
    prep:r=>({o:r()*3}),
    col(x,y,z,q,s){const lon=Math.atan2(x,z),sv=Math.abs(Math.sin(lon*4+q.o)),g=Math.pow(1-sv,3);
      let c=mix([226,104,14],[255,156,42],sv);c=mix(c,[140,52,8],g*.6);c=mix(c,[116,44,8],Math.max(0,fbm(x*6,y*3,z*6,s,3)-.5)*.6);
      return mix(c,[170,72,16],sst(.7,1,Math.abs(y))*.5);}}
};
const TC=new Map();
function texK(){return Math.min(S*DPR,matchMedia('(hover:hover)').matches?3:2.2);}
function tex(look,r){
  const k=texK(),key=look.type+look.seed+'|'+r+'|'+Math.round(k*50);let t=TC.get(key);if(t)return t;
  if(TC.size>80)TC.clear();
  const T=TY[look.type],R=r*k,m=T.ring?2.25:look.type==='pumpkin'?1.42:T.atm?1.32:1.04;
  const size=Math.ceil(R*m)*2+2,c=size/2,cvs=document.createElement('canvas');cvs.width=cvs.height=size;
  const g=cvs.getContext('2d'),img=g.createImageData(size,size),d=img.data,rr=rng(look.seed*2654435761),q=T.prep?T.prep(rr):{},s=look.seed;
  const tl=T.flat?0:(rr()-.5)*.6,ct=Math.cos(tl),st=Math.sin(tl);
  let lx=-.5,ly=-.55,lz=.67;const ln=Math.hypot(lx,ly,lz);lx/=ln;ly/=ln;lz/=ln;let hx=lx,hy=ly,hz=lz+1;const hn=Math.hypot(hx,hy,hz);hx/=hn;hy/=hn;hz/=hn;
  const rc=Math.cos(-.38),rs=Math.sin(-.38);
  let cr,cg,cb,ca;const ov=(r2,g2,b2,a)=>{if(a<=0)return;const na=a+ca*(1-a);cr=(r2*a+cr*ca*(1-a))/na;cg=(g2*a+cg*ca*(1-a))/na;cb=(b2*a+cb*ca*(1-a))/na;ca=na;};
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const dx=(px+.5-c)/R,dy=(py+.5-c)/R,d2=dx*dx+dy*dy,dd=Math.sqrt(d2);cr=cg=cb=ca=0;
    if(T.atm&&dd>.85){const e=Math.max(0,dd-1),lit=Math.max(0,-(dx*lx+dy*ly)/(dd||1))*.8+.2,ga=Math.min(1,T.as*Math.exp(-e*R/(R*.085+1.5))*lit);if(ga>.004){cr=T.atm[0];cg=T.atm[1];cb=T.atm[2];ca=ga;}}
    let front=null;
    if(T.ring){const u=dx*rc+dy*rs,v=(-dx*rs+dy*rc)/.26,rd=Math.hypot(u,v);
      if(rd>1.28&&rd<2.18){const band=.55+.45*Math.sin(rd*41)*Math.sin(rd*13),a=(rd>1.7&&rd<1.77?.08:1)*(.3+.45*band)*sst(1.28,1.36,rd)*sst(2.18,2.06,rd),col=[214*band+34,194*band+30,156*band+24];
        if(v<0&&d2>1)ov(col[0]*.8,col[1]*.8,col[2]*.8,a);else if(v>=0)front=[col,a];}}
    const aa=Math.min(1,Math.max(0,(1-dd)*R+.5));
    if(aa>0){let nx=dx,ny=dy;if(d2>=.998){nx/=dd*1.002;ny/=dd*1.002;}const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
      E=0;SP=0;const col=T.col(nx*ct-ny*st,nx*st+ny*ct,nz,q,s),lam=Math.max(0,nx*lx+ny*ly+nz*lz),li=.045+1.06*Math.pow(lam,.85),sp=SP*Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),40)*255;
      let r1=col[0]*(li*(1-E)+E)+sp,g1=col[1]*(li*(1-E)+E)+sp,b1=col[2]*(li*(1-E)+E)+sp;
      if(T.atm){const ra=Math.pow(1-nz,2.4)*T.as*(.2+lam);r1+=T.atm[0]*ra;g1+=T.atm[1]*ra;b1+=T.atm[2]*ra;}
      ov(r1,g1,b1,aa);}
    if(front)ov(front[0][0],front[0][1],front[0][2],front[1]);
    const i=(py*size+px)*4;d[i]=cr;d[i+1]=cg;d[i+2]=cb;d[i+3]=ca*255;}
  g.putImageData(img,0,0);
  if(look.type==='pumpkin'){g.lineCap='round';g.strokeStyle='#3f5a1c';g.lineWidth=R*.17;g.beginPath();g.moveTo(c-R*.04,c-R*.9);g.quadraticCurveTo(c-R*.02,c-R*1.18,c+R*.16,c-R*1.27);g.stroke();
    g.strokeStyle='#6f8a32';g.lineWidth=R*.05;g.beginPath();g.moveTo(c-R*.06,c-R*.95);g.quadraticCurveTo(c-R*.05,c-R*1.15,c+R*.1,c-R*1.24);g.stroke();}
  t={cv:cvs,half:size/2/k};TC.set(key,t);return t;}

// ---------- Größe und Ausrichtung ----------
let S=1,DPR=1,orient='p',li=0,lvl=null,looks=[],bg=null,stars=[];
function inst(i){const b=LV[i];const l={W:360,H:560,b:b.b.slice(),h:b.h.slice(),par:b.par,t:b.t,s:b.s.slice(),p:b.p.map(q=>q.slice())};if(b.w)l.w=b.w.map(q=>q.slice());
  if(orient==='l'){const f=(a,c)=>[560-c,a];l.W=560;l.H=360;l.b=f(l.b[0],l.b[1]);l.h=f(l.h[0],l.h[1]);l.s=[-l.s[1],l.s[0]];
    if(l.w)l.w=l.w.map(w=>[...f(w[0],w[1]),...f(w[2],w[3])]);
    l.p=l.p.map(q=>q.length>4?[0,0,q[2],q[3],...f(q[4],q[5]),q[6],q[7],q[8]+Math.PI/2]:[...f(q[0],q[1]),q[2],q[3]]);}
  return l;}
function mkLooks(i){const r=rng(i*7919+13);return LV[i].p.map((q,j)=>{const seed=i*131+j*17+1;
  if(q[3]<0)return{type:skin==='halloween'?'pumpkin':'lava',seed};
  const o=q.length>4?['moon','rocky','moon']:q[2]>=34?['gas','saturn','ice','gas']:q[2]>=23?['earth','mars','venus','ice','earth']:['moon','rocky','mars'];
  return{type:o[Math.floor(r()*o.length)],seed};});}
function size(){const f=$('field'),fw=f.clientWidth,fh=f.clientHeight;if(!fw||!fh)return;
  const o=fw>fh*1.08?'l':'p',W=o==='l'?560:360,H=o==='l'?360:560,k=Math.min(fw/W,fh/H)*.995;
  DPR=Math.min(window.devicePixelRatio||1,2.5);cv.style.width=Math.floor(W*k)+'px';cv.style.height=Math.floor(H*k)+'px';
  cv.width=Math.round(W*k*DPR);cv.height=Math.round(H*k*DPR);S=cv.width/DPR/W;bg=null;
  const ch=o!==orient;orient=o;if(lvl&&ch){lvl=inst(li);hint=null;drag=null;if(st==='fly'){st='aim';}home();}}
let rzq=0;new ResizeObserver(()=>{cancelAnimationFrame(rzq);rzq=requestAnimationFrame(size);}).observe($('field'));

// ---------- Hintergrund ----------
function buildBg(){const w=cv.width,h=cv.height,g=(bg=document.createElement('canvas')).getContext('2d');bg.width=w;bg.height=h;const r=rng(skin==='halloween'?66:42),M=Math.max(w,h);
  g.fillStyle=C.void;g.fillRect(0,0,w,h);g.globalCompositeOperation='lighter';
  for(let i=0;i<8;i++){const[col,a]=C.neb[i%C.neb.length],cx=r()*w,cy=r()*h,rad=(.3+r()*.45)*M,gr=g.createRadialGradient(cx,cy,0,cx,cy,rad);gr.addColorStop(0,rgba(col,a*.5));gr.addColorStop(.55,rgba(col,a*.16));gr.addColorStop(1,rgba(col,0));g.fillStyle=gr;g.fillRect(0,0,w,h);}
  const nw=110,nh=Math.round(nw*h/w),nc=document.createElement('canvas');nc.width=nw;nc.height=nh;const ng=nc.getContext('2d'),id=ng.createImageData(nw,nh),c1=parseInt(C.neb[0][0].slice(1),16),c2=parseInt(C.neb[1][0].slice(1),16);
  for(let y=0;y<nh;y++)for(let xx=0;xx<nw;xx++){const n=fbm(xx/nw*3.2,y/nw*3.2,1.7,skin==='halloween'?9:5,5),m=fbm(xx/nw*6,y/nw*6,4.1,3,3),a=sst(.48,.82,n)*.55,i=(y*nw+xx)*4,cc=m>.5?c2:c1;
    id.data[i]=(cc>>16)*1.6;id.data[i+1]=(cc>>8&255)*1.6;id.data[i+2]=(cc&255)*1.6;id.data[i+3]=a*255;}
  ng.putImageData(id,0,0);g.imageSmoothingQuality='high';g.drawImage(nc,0,0,w,h);
  g.globalCompositeOperation='source-over';const k=DPR*S;
  for(let i=0;i<w*h/(1400*DPR*DPR);i++){const sx=r()*w,sy=r()*h,sz=(.35+Math.pow(r(),3)*1.3)*k,a=.25+r()*.6,tint=r();g.fillStyle=tint<.15?'rgba(255,214,170,'+a+')':tint<.3?'rgba(180,205,255,'+a+')':'rgba(255,255,255,'+a+')';g.beginPath();g.arc(sx,sy,sz,0,7);g.fill();}
  for(let i=0;i<6;i++){const sx=r()*w,sy=r()*h,L=(4+r()*6)*k;g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=.6*k;g.beginPath();g.moveTo(sx-L,sy);g.lineTo(sx+L,sy);g.moveTo(sx,sy-L);g.lineTo(sx,sy+L);g.stroke();const gg=g.createRadialGradient(sx,sy,0,sx,sy,L*.7);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gg;g.beginPath();g.arc(sx,sy,L*.7,0,7);g.fill();}
  if(skin==='halloween'){const mr=Math.min(w,h)*.17,mx=w-mr*.55,my=mr*.75,gl=g.createRadialGradient(mx,my,mr*.8,mx,my,mr*2.6);gl.addColorStop(0,'rgba(255,170,90,.22)');gl.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);
    const md=g.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);md.addColorStop(0,'#ffe6c4');md.addColorStop(1,'#e8a466');g.fillStyle=md;g.beginPath();g.arc(mx,my,mr,0,7);g.fill();
    g.fillStyle='rgba(160,90,50,.22)';for(const[a,b,c]of[[-.3,-.2,.22],[.25,.15,.3],[-.1,.4,.16],[.35,-.35,.12],[-.45,.2,.1]]){g.beginPath();g.arc(mx+a*mr,my+b*mr,c*mr,0,7);g.fill();}}
  const v=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,M*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=v;g.fillRect(0,0,w,h);
  const rs=rng(7);stars=Array.from({length:26},()=>[rs(),rs(),rs()*6]);}

// ---------- Zustand ----------
let st='aim',ball=null,shots=0,drag=null,hint=null,trail=[],t=0,acc=0,anim=0,frames=0,sinkT=0,parts=[],bats=[],batT=2.5,menuTier=0;
function home(){ball={x:lvl.b[0],y:lvl.b[1],vx:0,vy:0,cd:0};trail=[];t=0;frames=0;}
function warm(){planetsAt(lvl,0).forEach((p,j)=>tex(looks[j],p[2]));}
function load(i){li=Math.max(0,Math.min(N-1,i));save.cur=li;persist();lvl=inst(li);looks=mkLooks(li);shots=0;hint=null;drag=null;st='aim';home();$('ov').hidden=true;ui();warm();intro();}
function totalStars(){return Object.values(save.best).reduce((a,b)=>a+b.st,0);}
function ui(){const tr=$('tier');tr.textContent=TIERS[lvl.t];tr.className='tier t'+lvl.t;$('lvn').textContent='Bahn '+(li+1)+' von '+N;
  $('par').textContent=lvl.par;$('sh').textContent=shots;$('stars').textContent=totalStars();
  $('lgpush').textContent=skin==='halloween'?'Kürbisse stoßen sie ab':'Lava-Planeten stoßen sie ab';$('tip').classList.toggle('on',!!hint);}
let msgT;function say(s,col){const m=$('msg');m.textContent=s;m.style.color=col||'var(--dim)';m.style.opacity=1;clearTimeout(msgT);msgT=setTimeout(()=>m.style.opacity=0,2600);}

// ---------- Neue Elemente erklären ----------
const INTRO={start:['So geht’s','Irgendwo aufs Feld tippen, zurückziehen und loslassen. Planeten ziehen die Kugel an. Ziel ist das Schwarze Loch.'],
  push:[()=>skin==='halloween'?'Neu: Kürbisse':'Neu: Lava-Planeten','Sie stoßen die Kugel ab, statt sie anzuziehen.'],
  moon:['Neu: Monde','Sie kreisen um ihren Planeten und starten bei jedem Schuss an derselben Stelle. Die Pfeile zeigen ihre Richtung.'],
  warp:['Neu: Wurmloch','Rein in den einen Strudel, raus aus dem anderen, mit demselben Schwung.']};
let introT;function intro(){const l=lvl,k=!save.seen.start?'start':l.p.some(q=>q[3]<0)&&!save.seen.push?'push':l.p.some(q=>q.length>4)&&!save.seen.moon?'moon':l.w&&!save.seen.warp?'warp':null;
  const el=$('intro');if(!k){el.hidden=true;return;}save.seen[k]=1;persist();const h=INTRO[k][0];$('inh').textContent=typeof h==='function'?h():h;$('inp').textContent=INTRO[k][1];el.hidden=false;clearTimeout(introT);introT=setTimeout(()=>el.hidden=true,10000);}
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
  if(frames%2===0){trail.push([ball.x,ball.y]);if(trail.length>46)trail.shift();}
  if(e==='warp'){trail=[];burst(ball.x,ball.y,18,C.wh,1.6);say('Wurmloch!',C.wh[0]);}
  if(e==='hole')return win();
  if(e==='crash')return fail(skin==='halloween'?'Saures! Nochmal.':'Crash! Nochmal.');
  if(e==='out')return fail(skin==='halloween'?'In der Nacht verschwunden.':'Ab ins All.');
  if(frames>=MAXF)return fail(skin==='halloween'?'Spukt jetzt im Orbit.':'Verloren im Orbit.');}
function fail(m){burst(ball.x,ball.y,30,['#ff6a3d','#ffb347','#ffffff'],2.2);st='aim';home();say(m,'rgb('+C.push+')');}
function win(){st='sink';sinkT=0;ball.x=lvl.h[0];ball.y=lvl.h[1];burst(lvl.h[0],lvl.h[1],40,C.disk,2);
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
function setSkin(s){skin=s;save.skin=s;persist();C=SK[s];document.documentElement.dataset.skin=s;bg=null;bats=[];looks=mkLooks(li);warm();ui();if(!$('ov').hidden&&$('card').querySelector('.tabs'))renderMenu();}

function closeMenu(){$('ov').hidden=true;if(st==='won'||st==='sink')load(li);}
$('reset').onclick=()=>load(li);$('menu').onclick=()=>$('ov').hidden||!$('card').querySelector('.tabs')?showMenu():closeMenu();$('tip').onclick=toggleHint;
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toLowerCase();
  if(k==='t'||k==='h')toggleHint();else if(k==='r')load(li);
  else if(k==='m'||k==='escape'){if($('ov').hidden)showMenu();else if($('card').querySelector('.tabs'))closeMenu();}
  else if(k==='enter'&&st==='won'&&!$('ov').hidden&&document.activeElement?.id!=='again'){e.preventDefault();li===N-1?showMenu():load(li+1);}});

// ---------- Zeichnen ----------
function drawBat(b){const f=Math.sin(b.ph),y=b.y+Math.sin(b.ph*.21)*10;x.save();x.translate(b.x,y);x.scale(b.s*(b.vx<0?-1:1),b.s);
  x.fillStyle='#0d0612';x.strokeStyle='rgba(255,138,31,.35)';x.lineWidth=.7;x.beginPath();const wy=-7*f;
  for(const sd of[-1,1]){x.moveTo(sd*2,0);x.quadraticCurveTo(sd*8,wy-5,sd*17,wy-1);x.quadraticCurveTo(sd*13,wy+2,sd*12,wy+5);x.quadraticCurveTo(sd*9,wy+2,sd*7,wy+6);x.quadraticCurveTo(sd*5,2,sd*2,3);}
  x.moveTo(3,0);x.ellipse(0,1,3,4,0,0,7);x.moveTo(-2.4,-2);x.lineTo(-1.8,-5.5);x.lineTo(-.6,-2.6);x.moveTo(2.4,-2);x.lineTo(1.8,-5.5);x.lineTo(.6,-2.6);x.fill();x.stroke();x.restore();}
function face(px,py,r){const fl=.72+.28*Math.sin(anim*9+px)*Math.sin(anim*5.3+py);x.save();x.translate(px,py);
  const gl=x.createRadialGradient(0,.08*r,0,0,.08*r,r*.95);gl.addColorStop(0,'rgba(255,170,40,'+.38*fl+')');gl.addColorStop(1,'rgba(255,120,20,0)');x.globalCompositeOperation='lighter';x.fillStyle=gl;x.beginPath();x.arc(0,.08*r,r*.95,0,7);x.fill();x.globalCompositeOperation='source-over';
  x.fillStyle='rgba(255,'+(196+40*fl|0)+',90,'+(.82*fl+.18)+')';x.beginPath();
  for(const sx of[-1,1]){x.moveTo(sx*.16*r,-.04*r);x.lineTo(sx*.46*r,-.04*r);x.lineTo(sx*.31*r,-.34*r);x.closePath();}
  x.moveTo(-.07*r,.13*r);x.lineTo(.07*r,.13*r);x.lineTo(0,.01*r);x.closePath();
  x.moveTo(-.56*r,.2*r);x.quadraticCurveTo(0,.66*r,.56*r,.2*r);x.lineTo(.4*r,.3*r);x.lineTo(.26*r,.24*r);x.lineTo(.12*r,.36*r);x.lineTo(-.04*r,.26*r);x.lineTo(-.18*r,.36*r);x.lineTo(-.33*r,.25*r);x.lineTo(-.44*r,.31*r);x.closePath();x.fill();x.restore();}
function vortex(px,py,col,dir){x.save();x.translate(px,py);const g=x.createRadialGradient(0,0,2,0,0,26);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.4,rgba(col,.28));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.beginPath();x.arc(0,0,26,0,7);x.fill();
  x.lineCap='round';for(let a=0;a<4;a++){x.beginPath();for(let i=0;i<=22;i++){const f=i/22,r=22-f*17,ang=a*Math.PI/2+f*3.4*dir+anim*2.4*dir;i?x.lineTo(Math.cos(ang)*r,Math.sin(ang)*r):x.moveTo(Math.cos(ang)*r,Math.sin(ang)*r);}x.strokeStyle=rgba(col,.8);x.lineWidth=1.7;x.stroke();}
  x.fillStyle='#000';x.beginPath();x.arc(0,0,5,0,7);x.fill();x.restore();}
function disk(back){const a0=back?Math.PI:0,n=18;for(let i=0;i<n;i++){const a=a0+i/n*Math.PI,b=a0+(i+1)/n*Math.PI+.02,br=(.6+.4*Math.sin(a*3-anim*5))*(.72+.28*Math.cos(a));
  for(const[rx,col,w,al]of[[25,C.disk[2],3.4,.5],[19.5,C.disk[1],3.4,.8],[14.6,C.disk[0],2.2,.95]]){x.strokeStyle=col;x.globalAlpha=al*br*(back?.7:1);x.lineWidth=w;x.beginPath();x.ellipse(0,0,rx,rx*.3,0,a,b);x.stroke();}}x.globalAlpha=1;}
function blackHole(hx,hy){x.save();x.translate(hx,hy);const g=x.createRadialGradient(0,0,8,0,0,44);g.addColorStop(0,'rgba('+C.glow+',.42)');g.addColorStop(1,'rgba('+C.glow+',0)');x.fillStyle=g;x.beginPath();x.arc(0,0,44,0,7);x.fill();
  x.rotate(-.3);disk(true);x.strokeStyle=C.disk[1];x.globalAlpha=.5;x.lineWidth=2.4;x.beginPath();x.ellipse(0,0,15.5,13.8,0,Math.PI*1.07,Math.PI*1.93);x.stroke();x.globalAlpha=1;
  x.fillStyle='#000';x.beginPath();x.arc(0,0,11,0,7);x.fill();x.strokeStyle=C.disk[0];x.lineWidth=1.2;x.globalAlpha=.9;x.beginPath();x.arc(0,0,11.7,0,7);x.stroke();x.globalAlpha=1;disk(false);x.restore();}
function drawBall(bx,by,sc){const g=x.createRadialGradient(bx,by,0,bx,by,15*sc);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(bx,by,15*sc,0,7);x.fill();
  const b=x.createRadialGradient(bx-1.8*sc,by-1.8*sc,.4,bx,by,5.5*sc);b.addColorStop(0,'#fff');b.addColorStop(1,C.ball);x.fillStyle=b;x.beginPath();x.arc(bx,by,5*sc,0,7);x.fill();}
function render(){const L=lvl,P=planetsAt(L,t),pr=C.push;
  x.setTransform(1,0,0,1,0,0);if(!bg)buildBg();x.drawImage(bg,0,0);x.setTransform(DPR*S,0,0,DPR*S,0,0);
  for(const s of stars){x.fillStyle='rgba(255,255,255,'+(.15+.5*Math.max(0,Math.sin(anim*1.3+s[2])))+')';x.fillRect(s[0]*L.W,s[1]*L.H,1.3,1.3);}
  for(const b of bats)drawBat(b);
  P.forEach(p=>{const pull=p[3]>0,col=pull?C.pull:pr;for(let k=0;k<3;k++){let f=(anim*.32+k/3)%1;if(pull)f=1-f;x.strokeStyle='rgba('+col+','+(pull?.13:.2)*Math.sin(f*Math.PI)+')';x.lineWidth=1;x.beginPath();x.arc(p[0],p[1],p[2]+5+f*42,0,7);x.stroke();}});
  L.p.forEach((q,j)=>{if(q.length<=4)return;x.strokeStyle='rgba(220,225,255,.1)';x.setLineDash([3,6]);x.beginPath();x.arc(q[4],q[5],q[6],0,7);x.stroke();x.setLineDash([]);
    if(st==='aim'){const d=Math.sign(q[7]),a=t*q[7]*50+q[8];for(let k=1;k<=2;k++){const b=a+d*(.2+k*.17),px=q[4]+Math.cos(b)*q[6],py=q[5]+Math.sin(b)*q[6],tg=b+d*Math.PI/2;x.strokeStyle='rgba(220,225,255,'+(.55-k*.15)+')';x.lineWidth=1.5;x.beginPath();x.moveTo(px+Math.cos(tg-2.5)*5,py+Math.sin(tg-2.5)*5);x.lineTo(px,py);x.lineTo(px+Math.cos(tg+2.5)*5,py+Math.sin(tg+2.5)*5);x.stroke();}}});
  if(L.w)L.w.forEach((w,k)=>{const col=C.wh[k%2];vortex(w[0],w[1],col,1);vortex(w[2],w[3],col,-1);x.strokeStyle=rgba(col,.08);x.setLineDash([2,8]);x.beginPath();x.moveTo(w[0],w[1]);x.lineTo(w[2],w[3]);x.stroke();x.setLineDash([]);});
  P.forEach((p,j)=>{const tx=tex(looks[j],p[2]);x.drawImage(tx.cv,p[0]-tx.half,p[1]-tx.half,tx.half*2,tx.half*2);if(looks[j].type==='pumpkin')face(p[0],p[1],p[2]);});
  blackHole(L.h[0],L.h[1]);
  if(st==='aim'){x.strokeStyle='rgba(233,236,251,.3)';x.setLineDash([3,4]);x.lineDashOffset=-anim*8;x.beginPath();x.arc(L.b[0],L.b[1],11,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;}
  trail.forEach((q,i)=>{const f=i/trail.length;x.fillStyle='rgba('+C.trail+','+f*.55+')';x.beginPath();x.arc(q[0]+(skin==='halloween'?Math.sin(i*1.7+anim*20)*f:0),q[1],.6+f*1.8,0,7);x.fill();});
  if(hint&&st==='aim'){const dx=-hint.vx/.048,dy=-hint.vy/.048;x.fillStyle='rgba('+C.glow+',.6)';for(const q of hint.path)if(q){x.beginPath();x.arc(q[0],q[1],1.7,0,7);x.fill();}
    let ax,ay,close=false;if(drag){ax=drag.sx;ay=drag.sy;const pw=power();close=Math.hypot(pw.x-hint.vx,pw.y-hint.vy)<.6;}else{ax=L.W/2-dx/2;ay=L.H/2-dy/2;}
    const bx=ax+dx,by=ay+dy,col=close?'#5fd39a':'rgb('+C.glow+')';x.strokeStyle=col;x.lineWidth=2;x.setLineDash([6,5]);x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();x.setLineDash([]);
    if(!drag){x.beginPath();x.arc(ax,ay,9,0,7);x.stroke();}x.fillStyle=col;x.beginPath();x.arc(bx,by,close?14:10,0,7);x.fill();x.lineWidth=1.5;x.beginPath();x.arc(bx,by,22,0,7);x.stroke();
    if(!drag){x.fillStyle='rgb('+C.glow+')';x.font='500 12px Rubik, system-ui, sans-serif';x.textAlign='center';x.fillText('von ○ nach ● ziehen',L.W/2,Math.min(L.H-10,Math.max(ay,by)+30));}}
  if(drag){const pw=power(),o={x:L.b[0],y:L.b[1],vx:pw.x,vy:pw.y,cd:0};let tt=0;x.fillStyle='#fff';
    for(let i=0;i<60;i++){tt+=DT;const e=stepBody(L,o,tt);if(e==='crash'||e==='out')break;if(i%3===0){x.globalAlpha=.75*(1-i/60);x.beginPath();x.arc(o.x,o.y,2,0,7);x.fill();}if(e==='hole')break;}x.globalAlpha=1;
    x.strokeStyle='rgba(233,236,251,.25)';x.lineWidth=1;x.beginPath();x.moveTo(drag.sx,drag.sy);x.lineTo(drag.x,drag.y);x.stroke();
    const f=pw.l/150;x.fillStyle='rgba(255,255,255,.1)';x.fillRect(L.b[0]-20,L.b[1]+15,40,4);x.fillStyle=f>.85?'rgb('+pr+')':'rgb('+C.glow+')';x.fillRect(L.b[0]-20,L.b[1]+15,40*f,4);}
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
