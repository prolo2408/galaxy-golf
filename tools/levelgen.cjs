// Erzeugt Bahnen mit der echten Physik (src/physics.js + src/gen.js) und prüft jede:
// kein gerader Schuss aufs Loch, geprüfter Lösungsschuss für den Tipp (hoch und quer), Sonnenwind muss mitspielen.
// Aufruf:
//   node tools/levelgen.cjs kosmos <ausgabe.json>   Stufe Kosmos: Sonnenwind, dann Doppelsterne, dann beides
//   node tools/levelgen.cjs tages  <ausgabe.json>   Vorrat für die Tagesbahn (eine pro Tag)
//   node tools/levelgen.cjs aufgaben-<art> <ausgabe.json>   Bahnen für Tagesaufgaben (art: ass, p3, wurm, wind, doppel)
// Die 320 Bahnen der Stufen Leicht bis Extrem stammen aus der Fassung dieses Skripts vor dem Kosmos-Update (git log).
const fs=require("fs"),path=require("path");
const src=f=>fs.readFileSync(path.join(__dirname,"../src",f),"utf8");
const M=new Function(src("physics.js")+src("gen.js")+";return{genLevel};")();
const run=g=>{let r;while(!(r=g.next()).done);return r.value;};
let seed=+(process.env.SEED||4711);
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
// Par nach Treffern im feinen Raster (3° × 0,3), abgelesen an den bestehenden 320 Bahnen
const FEIN={sa:3,sp:.3,ds:.1,parQ:[37,22,12]};
const isBin=q=>q.length>4&&q[4]<0;
const [mode,out]=process.argv.slice(2);
const t0=Date.now(),log=(...a)=>console.error(...a,Math.round((Date.now()-t0)/1000)+"s");
function sammeln(n,dmin,dmax,opt,name){const c=[];while(c.length<n){const d=dmin+rnd()*(dmax-dmin);c.push(run(M.genLevel(d,rnd,Object.assign({},FEIN,opt))));
  if(c.length%20===0)log(name,c.length+"/"+n);}return c;}
// gleichmäßig über die Schwierigkeit verteilt auswählen, leicht zuerst
function spanne(c,n){c.sort((a,b)=>b.n-a.n);const r=[];for(let i=0;i<n;i++)r.push(c[Math.round(i*(c.length-1)/(n-1))]);return r;}
const ohneN=l=>{const o=Object.assign({},l);delete o.n;return o;};
let res;
if(mode==="kosmos"){
  const wind=spanne(sammeln(90,.3,1,{wind:1,minHits:3,maxHits:140,must:l=>!!l.f,tier:4},"wind"),34);
  const dopp=spanne(sammeln(90,.3,1,{bin:1,minHits:3,maxHits:140,must:l=>l.p.some(isBin),tier:4},"doppel"),33);
  const mix=spanne(sammeln(90,.45,1,{wind:1,bin:1,minHits:3,maxHits:120,must:l=>!!l.f&&l.p.some(isBin),tier:4},"beides"),33);
  res=[...wind,...dopp,...mix];
}else if(mode==="tages"){
  res=sammeln(366,.25,.85,{wind:.15,bin:.1,minHits:4,maxHits:120},"tages");
  for(const l of res)l.t=l.n>=37?0:l.n>=22?1:l.n>=12?2:3;
}else if(mode.startsWith("aufgaben-")){
  // Vorrat für die Bahnen der Tagesaufgaben (src/aufgaben.json), je Art ein eigener Lauf:
  //   ass: leichte Par-2-Bahnen mit vielen Treffern, damit ein Ass machbar ist
  //   p3: Par 3 und 4, mittel, damit „unter Par“ machbar ist
  //   wurm, wind, doppel: mittelschwere Bahnen, die genau das Element enthalten
  const art=mode.slice(9),A={
    ass:[+(process.env.ANZAHL||70),.05,.35,{minHits:42,must:l=>!l.w}],
    p3:[80,.3,.65,{wind:.1,bin:.1,minHits:16,maxHits:36}],
    wurm:[50,.25,.6,{minHits:12,maxHits:90,must:l=>!!l.w}],
    wind:[50,.3,.6,{wind:1,minHits:12,maxHits:90,must:l=>!!l.f}],
    doppel:[50,.3,.6,{bin:1,minHits:12,maxHits:90,must:l=>l.p.some(isBin)}]}[art];
  if(!A){console.error("Arten: ass, p3, wurm, wind, doppel");process.exit(2);}
  res=sammeln(A[0],A[1],A[2],A[3],art);
  for(const l of res)l.t=l.n>=37?0:l.n>=22?1:l.n>=12?2:3;
}else{console.error("Aufruf: node tools/levelgen.cjs kosmos|tages|aufgaben-<art> <ausgabe.json>");process.exit(2);}
fs.writeFileSync(out,JSON.stringify(res.map(ohneN)));
const par={};res.forEach(l=>par[l.par]=(par[l.par]||0)+1);
log("fertig",res.length,"Bahnen, Par",JSON.stringify(par),"Wind",res.filter(l=>l.f).length,"Doppelsterne",res.filter(l=>l.p.some(isBin)).length);
