// Gemeinsame Physik: wird ins Spiel eingebaut und vom Bahn-Generator benutzt.
// Newtonsche Schwerkraft: a = G*M/d², Masse = Dichte * r³. Kein Luftwiderstand im All.
// Körper: [x, y, r, art]            art 1 Gestein, 2 Gasriese, 3 Eisriese, 4 Sonne
// Mond:   [0, 0, r, art, wirt, R, richtung, phase]  kreist mit Kepler-Geschwindigkeit um Körper Nr. wirt
// Jeder Schuss startet bei Weltzeit 0, dadurch ist jede Bahn deterministisch.
const DT=1/120,MAXF=1200,G=0.02,RHO=[0,1,.55,.7,4],BH=120,BURN=10;
function gm(p){return G*RHO[p[3]]*p[2]*p[2]*p[2];}
function planetsAt(l,tt){return l.p.map(p=>{if(p.length<=4)return p;const h=l.p[p[4]],w=Math.sqrt(gm(h)/(p[5]*p[5]*p[5]))*p[6],a=p[7]+w*tt/DT;
  return[h[0]+Math.cos(a)*p[5],h[1]+Math.sin(a)*p[5],p[2],p[3]];});}
function accel(l,P,px,py){let ax=0,ay=0;
  for(const p of P){const dx=p[0]-px,dy=p[1]-py,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,f=gm(p)/Math.max(d2,1);ax+=f*dx/d;ay+=f*dy/d;}
  const hx=l.h[0]-px,hy=l.h[1]-py,h2=Math.max(hx*hx+hy*hy,16),hd=Math.sqrt(h2);ax+=BH/h2*hx/hd;ay+=BH/h2*hy/hd;
  return[ax,ay];}
function hitP(P,px,py){for(const p of P)if(Math.hypot(p[0]-px,p[1]-py)<p[2]+5+(p[3]===4?BURN:0))return p[3]===4?'burn':'crash';return null;}
function warpAt(l,o){if(!l.w)return false;
  for(const w of l.w){if(Math.hypot(w[0]-o.x,w[1]-o.y)<11){o.x=w[2];o.y=w[3];o.cd=25;return true;}
    if(Math.hypot(w[2]-o.x,w[3]-o.y)<11){o.x=w[0];o.y=w[1];o.cd=25;return true;}}
  return false;}
function stepBody(l,o,tt){const P=planetsAt(l,tt),a=accel(l,P,o.x,o.y);
  o.vx+=a[0];o.vy+=a[1];o.x+=o.vx;o.y+=o.vy;
  let e=null;if(o.cd>0)o.cd--;else if(warpAt(l,o))e='warp';
  if(Math.hypot(l.h[0]-o.x,l.h[1]-o.y)<11)return'hole';
  const h=hitP(P,o.x,o.y);if(h)return h;
  if(o.x<-60||o.x>l.W+60||o.y<-60||o.y>l.H+60)return'out';
  return e;}
function simulate(l,vx,vy,path,maxf){const o={x:l.b[0],y:l.b[1],vx,vy,cd:0},m=maxf||MAXF;let tt=0;
  for(let f=0;f<m;f++){tt+=DT;const e=stepBody(l,o,tt);
    if(path){if(e==='warp')path.push(null);if(f%3===0)path.push([o.x,o.y]);}
    if(e==='hole')return f;if(e==='crash'||e==='burn'||e==='out')return -1;}
  return maxf?0:-1;}
