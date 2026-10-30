// Spielstand, Shop-Katalog, Events, Tagesaufgaben und Münzen.
// Gemeinsam für Spiel und Server: beide rechnen Münzen gleich und führen Stände gleich zusammen.

// ---------- Katalog ----------
// Fächer: k Kugel, s Flugspur, l Ziel-Loch, o Look (alle Himmelskörper nach festen Regeln umgestaltet)
const FAECHER=[['k','Kugel'],['s','Spur'],['l','Loch'],['o','Look']];
const ITEMS=[
  {id:'k-standard',n:'Standard',p:0},{id:'k-mond',n:'Mondstein',p:150},{id:'k-erde',n:'Blauer Planet',p:200},{id:'k-mars',n:'Roter Staub',p:200},
  {id:'k-komet',n:'Komet',p:300},{id:'k-saturn',n:'Ringkugel',p:350},{id:'k-neutron',n:'Neutronenstern',p:450},{id:'k-gold',n:'Goldkugel',p:600},
  {id:'k-kuerbis',n:'Kürbiskugel',ev:'halloween-2026'},
  {id:'s-standard',n:'Standard',p:0},{id:'s-pixel',n:'Pixel',p:200},{id:'s-staub',n:'Sternenstaub',p:250},{id:'s-feuer',n:'Feuerschweif',p:300},
  {id:'s-plasma',n:'Plasma',p:350},{id:'s-regenbogen',n:'Regenbogen',p:450},{id:'s-irrlicht',n:'Irrlicht',ev:'halloween-2026'},
  {id:'l-standard',n:'Schwarzes Loch',p:0},{id:'l-quasar',n:'Quasar',p:400},{id:'l-spirale',n:'Spiralgalaxie',p:500},{id:'l-tor',n:'Sternentor',p:550},
  {id:'o-klassisch',n:'Klassisch',p:0},{id:'o-nebula',n:'Nebula',p:900},{id:'o-frost',n:'Frost',p:1000},{id:'o-neon',n:'Neon',p:1200},
  {id:'o-halloween',n:'Halloween',ev:'halloween-2026'}
];
const ITEM={};ITEMS.forEach(i=>{i.f=i.id[0];ITEM[i.id]=i;});
const STANDARD={k:'k-standard',s:'s-standard',l:'l-standard',o:'o-klassisch'};
// Events: wer im Zeitraum spielt, bekommt das Abzeichen und die Event-Sachen für immer.
// Ein neues Event: hier eintragen (Zeitraum in Ortszeit, beide Tage zählen mit) und die Sachen in ITEMS mit ev markieren.
const EVENTS=[
  {id:'halloween-2026',n:'Halloween 2026',von:'2026-10-10',bis:'2026-11-03',look:'o-halloween'}
];
const EVENT={};EVENTS.forEach(e=>{e.items=ITEMS.filter(i=>i.ev===e.id).map(i=>i.id);EVENT[e.id]=e;});
function evItems(id){return EVENT[id]?['e-'+id,...EVENT[id].items]:[];}
function istBekannt(id){return !!ITEM[id]||(id.startsWith('e-')&&!!EVENT[id.slice(2)]);}

// ---------- Tagesaufgaben ----------
const AUFG={
  spielen:{t:'Schaffe 5 Bahnen',z:5,m:20},
  unterpar:{t:'3 Bahnen unter Par',z:3,m:30},
  ass:{t:'Ein Ass ohne Tipp',z:1,m:40},
  tages:{t:'Schaffe die Tagesbahn',z:1,m:25},
  endlos:{t:'5 Bahnen in einem Endlos-Lauf',z:5,m:35},
  knifflig:{t:'3 Bahnen mit Par 3 oder mehr',z:3,m:30},
  ohnetipp:{t:'5 Bahnen ohne Tipp',z:5,m:25},
  sterne:{t:'Sammle heute 9 Sterne',z:9,m:30},
  wurm:{t:'Eine Bahn mit Wurmloch',z:1,m:20}
};
const AUFG_IDS=Object.keys(AUFG);
function aufgabenFuer(tag){let h=2166136261;for(const c of tag)h=Math.imul(h^c.charCodeAt(0),16777619);
  const ids=AUFG_IDS.slice();for(let i=ids.length-1;i>0;i--){h=Math.imul(h^(h>>>15),2246822507)>>>0;const j=h%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3);}

// ---------- Münzen ----------
const MZ={stern:4,ass:15,tagBasis:15,tagStern:5};
function preis(id){return ITEM[id]&&ITEM[id].p||0;}
// Tagesangebote: jeden Tag drei Sachen 25 % günstiger, für alle gleich
function angebote(tag){let h=2166136261;for(const c of 'angebot'+tag)h=Math.imul(h^c.charCodeAt(0),16777619);
  const ids=ITEMS.filter(i=>i.p).map(i=>i.id);for(let i=ids.length-1;i>0;i--){h=Math.imul(h^(h>>>13),3266489917)>>>0;const j=h%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3).map(id=>({id,p:Math.round(preis(id)*.75/10)*10}));}
function bezahlt(id,o){return typeof o.p==='number'?o.p:preis(id);}
function muenzen(st){let m=st.bonus|0;
  for(const k in st.best){const b=st.best[k];m+=b.st*MZ.stern+(b.a?MZ.ass:0);}
  for(const d in st.tag)m+=MZ.tagBasis+MZ.tagStern*st.tag[d].st;
  for(const d in st.auf){const a=st.auf[d];for(const id of aufgabenFuer(d))if((a[id]|0)>=AUFG[id].z)m+=AUFG[id].m;}
  for(const id in st.own)if(st.own[id].w==='kauf')m-=bezahlt(id,st.own[id]);
  return m;}

// ---------- Datum ----------
function datum(d,tz){d=d||new Date();if(tz){const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);return p;}
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const DATUM=/^\d{4}-\d{2}-\d{2}$/;
function imEvent(e,tag){return tag>=e.von&&tag<=e.bis;}

// ---------- Stand ----------
function neuerStand(){return{v:5,t:0,un:3,best:{},seen:{},cur:0,own:{},eq:Object.assign({},STANDARD),tag:{},auf:{},endl:{best:0},opt:{ringe:true,vorschau:true,vib:true},auto:null,bonus:0};}
// Alter Spielstand (gg4) → neu. Wer ihn hat, hat schon im Halloween-Zeitraum gespielt (gg4 kam am 28.10.2026).
function ausAlt(a,N,heute){const s=neuerStand();if(!a||!a.best)return s;let max=0;
  for(const k in a.best){const b=a.best[k],n=+k;if(!(n>=1&&n<=N)||!b)continue;s.best[n]={s:b.s|0||1,st:Math.max(1,Math.min(3,b.st|0))};if(s.best[n].s===1)s.best[n].a=1;max=Math.max(max,n);}
  s.un=Math.max(3,Math.min(N,Math.max(a.un|0,max+3)));s.cur=Math.max(0,Math.min(N-1,a.cur|0));
  for(const k in a.seen||{})if(SEEN.includes(k))s.seen[k]=1;
  if(max>0){const e=EVENT['halloween-2026'],d=heute<=e.bis?heute:'2026-10-28';for(const id of evItems(e.id))s.own[id]={w:'event',d};}
  if(a.skin==='halloween'&&s.own['o-halloween'])s.eq.o='o-halloween';
  s.t=Date.now();return s;}
const SEEN=['start','sun','moon','warp','wind','bin','tages','endlos'];
const OPT=['ringe','vorschau','vib'];
// Eingaben prüfen: nur bekannte Felder in sinnvollen Grenzen. N = Anzahl Bahnen.
function sauber(x,N){const s=neuerStand();if(!x||typeof x!=='object')return s;const int=(v,a,b,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;};
  s.t=int(x.t,0,Date.now()+864e5,0);s.un=int(x.un,3,N,3);s.cur=int(x.cur,0,N-1,0);s.bonus=int(x.bonus,-1e7,1e7,0);
  if(x.best&&typeof x.best==='object')for(const k in x.best){const n=+k,b=x.best[k];if(!(n>=1&&n<=N)||!b)continue;const o={s:int(b.s,1,999,99),st:int(b.st,1,3,1)};if(b.a&&o.s===1)o.a=1;s.best[n]=o;}
  if(x.seen&&typeof x.seen==='object')for(const k of SEEN)if(x.seen[k])s.seen[k]=1;
  if(x.own&&typeof x.own==='object')for(const id in x.own){const o=x.own[id];if(!istBekannt(id)||!o||!['kauf','event','geschenk','code'].includes(o.w)||!DATUM.test(o.d))continue;s.own[id]={w:o.w,d:o.d};if(o.w==='kauf'&&Number.isInteger(o.p)&&o.p>=0&&o.p<preis(id))s.own[id].p=o.p;}
  if(x.eq&&typeof x.eq==='object')for(const f in STANDARD){const id=x.eq[f];if(typeof id==='string'&&ITEM[id]&&ITEM[id].f===f&&(s.own[id]||id===STANDARD[f]))s.eq[f]=id;}
  if(x.tag&&typeof x.tag==='object')for(const d of Object.keys(x.tag).filter(d=>DATUM.test(d)).sort().slice(-1000)){const b=x.tag[d];if(b)s.tag[d]={s:int(b.s,1,999,99),st:int(b.st,1,3,1)};}
  if(x.auf&&typeof x.auf==='object')for(const d of Object.keys(x.auf).filter(d=>DATUM.test(d)).sort().slice(-1000)){const a=x.auf[d];if(!a||typeof a!=='object')continue;const o={};for(const id of aufgabenFuer(d))if(a[id])o[id]=int(a[id],0,AUFG[id].z,0);s.auf[d]=o;}
  if(x.endl&&typeof x.endl==='object')s.endl.best=int(x.endl.best,0,99999,0);
  if(x.opt&&typeof x.opt==='object')for(const k of OPT)if(typeof x.opt[k]==='boolean')s.opt[k]=x.opt[k];
  if(x.auto&&typeof x.auto==='object'&&ITEM[x.auto.look]&&ITEM[x.auto.vorher])s.auto={look:x.auto.look,vorher:x.auto.vorher};
  return s;}
// Zwei Stände zusammenführen. a = Stand des Servers (er bestimmt den Bonus), b = Stand des Geräts.
// Fortschritt geht nie verloren: jeweils das Bessere, Besitz vereinigt; Einstellungen vom neueren Stand.
function zusammen(a,b){const r=neuerStand(),neu=(b.t||0)>=(a.t||0)?b:a;
  r.t=Math.max(a.t||0,b.t||0);r.un=Math.max(a.un,b.un);r.cur=neu.cur;r.bonus=a.bonus|0;
  r.eq=Object.assign({},neu.eq);r.opt=Object.assign({},neu.opt);r.auto=neu.auto?Object.assign({},neu.auto):null;
  for(const s of[a,b]){
    for(const k in s.best){const x=s.best[k],y=r.best[k];r.best[k]=y?{s:Math.min(x.s,y.s),st:Math.max(x.st,y.st)}:{s:x.s,st:x.st};if(x.a||(y&&y.a))r.best[k].a=1;}
    for(const k in s.seen)r.seen[k]=1;
    for(const id in s.own){const x=s.own[id],y=r.own[id];if(!y||x.d<y.d){r.own[id]={w:x.w,d:x.d};if(typeof x.p==='number')r.own[id].p=x.p;}}
    for(const d in s.tag){const x=s.tag[d],y=r.tag[d];r.tag[d]=y?{s:Math.min(x.s,y.s),st:Math.max(x.st,y.st)}:{s:x.s,st:x.st};}
    for(const d in s.auf){const o=r.auf[d]||(r.auf[d]={});for(const id in s.auf[d])o[id]=Math.max(o[id]|0,s.auf[d][id]|0);}
    r.endl.best=Math.max(r.endl.best,s.endl.best|0);}
  for(const f in r.eq)if(!r.own[r.eq[f]]&&r.eq[f]!==STANDARD[f])r.eq[f]=STANDARD[f];
  return r;}
