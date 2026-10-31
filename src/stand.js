// Spielstand, Shop-Katalog und Shop-Wechsel, Events, Tagesaufgaben, Wochen-Herausforderungen, Tagesbonus, Sternenpass und Münzen.
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
  {id:'o-halloween',n:'Halloween',ev:'halloween-2026'},
  // Sternenpass: Belohnung auf Stufe 30, nur in diesem Monat zu verdienen (pass:'JJJJ-MM'), nie im Shop
  {id:'k-prisma',n:'Prismakugel',pass:'2026-11'}
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

// ---------- Datum ----------
function datum(d,tz){d=d||new Date();if(tz){const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);return p;}
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const DATUM=/^\d{4}-\d{2}-\d{2}$/;
function imEvent(e,tag){return tag>=e.von&&tag<=e.bis;}
function dnum(d){const[y,m,t]=d.split('-').map(Number);return Math.round(Date.UTC(y,m-1,t)/864e5);}
function dstr(n){const x=new Date(n*864e5);return x.getUTCFullYear()+'-'+String(x.getUTCMonth()+1).padStart(2,'0')+'-'+String(x.getUTCDate()).padStart(2,'0');}
function plusTage(d,k){return dstr(dnum(d)+k);}
function wocheVon(d){const n=dnum(d);return dstr(n-(new Date(n*864e5).getUTCDay()+6)%7);}  // Montag der Woche
function hashStr(t){let h=2166136261;for(const c of t)h=Math.imul(h^c.charCodeAt(0),16777619);
  h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489917);h^=h>>>16;return h>>>0;}   // FNV-1a, dann gut durchmischt
function mischen(a,salz){a=a.slice();let h=hashStr(salz);for(let i=a.length-1;i>0;i--){h=Math.imul(h^(h>>>15),2246822507)>>>0;h=Math.imul(h^(h>>>13),3266489917)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}

// ---------- Tagesaufgaben ----------
// los: wohin der Spielen-Knopf führt (weiter = Kampagne, tages, endlos). b: Art im Vorrat AG (src/aufgaben.json), n: so viele Bahnen bringt die Aufgabe mit.
const AUFG={
  // bis 30.10.2026 (bleiben für alte Spielstände und Geräte mit alter Fassung)
  spielen:{t:'Schaffe 5 Bahnen',z:5,m:20},
  unterpar:{t:'3 Bahnen unter Par',z:3,m:30},
  ass:{t:'Ein Ass ohne Tipp',z:1,m:40},
  tages:{t:'Schaffe die Tagesbahn',z:1,m:25,los:'tages'},
  endlos:{t:'5 Bahnen in einem Endlos-Lauf',z:5,m:35},
  knifflig:{t:'3 Bahnen mit Par 3 oder mehr',z:3,m:30},
  ohnetipp:{t:'5 Bahnen ohne Tipp',z:5,m:25},
  sterne:{t:'Sammle heute 9 Sterne',z:9,m:30},
  wurm:{t:'Eine Bahn mit Wurmloch',z:1,m:20},
  // ab 31.10.2026: jede ist für jeden machbar, besondere Aufgaben bringen ihre Bahnen mit
  b5:{t:'Schaffe 5 Bahnen',z:5,m:20,los:'weiter'},
  st8:{t:'Sammle 8 Sterne',z:8,m:25,los:'weiter'},
  ot3:{t:'3 Bahnen ohne Tipp',z:3,m:20,los:'weiter'},
  en3:{t:'3 Bahnen in einem Endlos-Lauf',z:3,m:30,los:'endlos'},
  p3:{t:'3 Bahnen mit Par 3 oder mehr',z:3,m:30,b:'p3',n:3},
  up2:{t:'2 Bahnen unter Par',z:2,m:35,b:'p3',n:4},
  as1:{t:'Ein Ass ohne Tipp',z:1,m:40,b:'ass',n:3},
  wu:{t:'Eine Bahn mit Wurmloch',z:1,m:20,b:'wurm',n:2},
  wi:{t:'Eine Bahn mit Sonnenwind',z:1,m:20,b:'wind',n:2},
  dp:{t:'Eine Bahn mit Doppelstern',z:1,m:20,b:'doppel',n:2}
};
const AUFG_AB='2026-10-31';
const AUFG_ALT=['spielen','unterpar','ass','tages','endlos','knifflig','ohnetipp','sterne','wurm'];
// Jeden Tag eine aus jeder Gruppe: allgemein, Spielart, besondere Bahnen
const AUFG_NEU=[['b5','st8','ot3'],['tages','en3'],['p3','up2','as1','wu','wi','dp']];
function aufgabenAlt(tag){let h=2166136261;for(const c of tag)h=Math.imul(h^c.charCodeAt(0),16777619);
  const ids=AUFG_ALT.slice();for(let i=ids.length-1;i>0;i--){h=Math.imul(h^(h>>>15),2246822507)>>>0;const j=h%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3);}
const AUFG_CACHE=new Map();
function aufgabenFuer(tag){if(tag<AUFG_AB)return aufgabenAlt(tag);let r=AUFG_CACHE.get(tag);
  if(!r){r=AUFG_NEU.map((g,i)=>g[hashStr('aufgabe'+i+tag)%g.length]);if(AUFG_CACHE.size>800)AUFG_CACHE.clear();AUFG_CACHE.set(tag,r);}return r;}
// Was an einem Tag Münzen bringt: ab der Umstellung auch die alten Aufgaben, falls ein Gerät noch die alte Fassung hat
function aufgabenGezaehlt(tag){if(tag<AUFG_AB)return aufgabenAlt(tag);const r=aufgabenFuer(tag).slice();for(const id of aufgabenAlt(tag))if(!r.includes(id))r.push(id);return r;}
function erledigt(st,tag){const a=st.auf[tag];if(!a)return[];return aufgabenGezaehlt(tag).filter(id=>(a[id]|0)>=AUFG[id].z);}
// Bahnen, die eine Aufgabe an einem Tag mitbringt: Indizes in AG[art], für alle gleich, jeden Tag andere
function aufgabenBahnen(id,tag,len){const A=AUFG[id];if(!A||!A.b||!len)return[];const s=(dnum(tag)*A.n+hashStr(id))%len;return Array.from({length:Math.min(A.n,len)},(_,i)=>(s+i)%len);}

// ---------- Wochen-Herausforderungen ----------
// Drei pro Woche (Montag bis Sonntag), für alle gleich. Fortschritt ergibt sich aus Tagesleistung, Tagesbahnen, Aufgaben und Tagesbonus.
const WOCHE_AB='2026-11-02',WOCHE_MZ=100,WOCHE_XP=100;
const WAUFG={
  wb:{t:'Schaffe 30 Bahnen',z:30},
  ws:{t:'Sammle 60 Sterne',z:60},
  wa:{t:'Hole 2 Asse ohne Tipp',z:2},
  wt:{t:'Schaffe 4 Tagesbahnen',z:4},
  wq:{t:'Erledige 9 Tagesaufgaben',z:9},
  we:{t:'6 Bahnen in einem Endlos-Lauf',z:6},
  wl:{t:'Hol dir an 5 Tagen den Tagesbonus',z:5}
};
function wochenAufgaben(w){return mischen(Object.keys(WAUFG),'woche'+w).slice(0,3);}
function wochenStand(st,w){const r={wb:0,ws:0,wa:0,wt:0,wq:0,we:0,wl:0};
  for(let k=0;k<7;k++){const d=plusTage(w,k),a=st.akt[d];if(a){r.wb+=a.b;r.ws+=a.s;r.wa+=a.a;r.we=Math.max(r.we,a.e);}
    if(st.tag[d])r.wt++;if(st.login[d])r.wl++;r.wq+=erledigt(st,d).length;}
  return r;}
function wochenErledigt(st,w){if(w<WOCHE_AB)return[];const s=wochenStand(st,w);return wochenAufgaben(w).filter(id=>s[id]>=WAUFG[id].z);}

// ---------- Tagesbonus (Login-Serie) ----------
// Tag 1 bis 6 Münzen, Tag 7 eine Truhe: eine seltene oder epische Sache, die man noch nicht hat (sonst Münzen). Wer einen Tag auslässt, fängt bei Tag 1 an.
const SERIE=[10,15,20,25,30,40],SERIE_TRUHE_MZ=150,SERIE_XP=20,TRUHE=[200,700];
function serieLaenge(st,tag){let k=0;while(st.login[plusTage(tag,-k)])k++;return k;}   // Tage am Stück bis einschließlich tag
const seriePos=l=>((l-1)%7)+1;
function truheMoeglich(id){const i=ITEM[id];return !!i&&i.p>TRUHE[0]&&i.p<=TRUHE[1]&&!i.ev&&!i.pass;}
function truheOk(st,id,tag){if(!truheMoeglich(id)||!st.login[tag]||seriePos(serieLaenge(st,tag))!==7)return false;
  return!Object.keys(st.own).some(k=>k!==id&&st.own[k].w==='serie'&&st.own[k].d===tag);}

// ---------- Sternenpass ----------
// Jeder Monat ein Pass mit 30 Stufen. XP aus Bahnen (höchstens 250 am Tag), Tagesaufgaben, Tagesbonus und Wochen-Herausforderungen.
// Münzen auf jeder Stufe, Stufe 30 bringt die Pass-Sache des Monats (Eintrag in PAESSE) oder, falls keine eingetragen ist, Münzen.
const PASS={stufen:30,xp:150,ab:'2026-11',tagMax:250,ohneSache:300};
const PAESSE={'2026-11':{n:'Sternenpass November',item:'k-prisma'}};
function passName(mon){const p=PAESSE[mon];if(p)return p.n;const[y,m]=mon.split('-');return'Sternenpass '+['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][+m-1]+' '+y;}
function passMz(stufe){return stufe===PASS.stufen?100:stufe%5===0?60:20;}
function monatTage(mon){const[y,m]=mon.split('-').map(Number),n=new Date(Date.UTC(y,m,0)).getUTCDate();return Array.from({length:n},(_,i)=>mon+'-'+String(i+1).padStart(2,'0'));}
function xpTag(st,tag){const a=st.akt[tag];let v=a?Math.min(PASS.tagMax,a.b*5+a.s*5):0;const e=erledigt(st,tag).length;v+=e*40+(e>=3?30:0);if(st.login[tag])v+=SERIE_XP;return v;}
// Wochen zählen für den Monat, in dem ihr Sonntag liegt
function xpMonat(st,mon){let v=0;for(const d of monatTage(mon)){v+=xpTag(st,d);if(new Date(dnum(d)*864e5).getUTCDay()===0)v+=wochenErledigt(st,plusTage(d,-6)).length*WOCHE_XP;}return v;}
function passStufe(v){return Math.min(PASS.stufen,Math.floor(v/PASS.xp));}
function passMonate(st){const s=new Set();for(const k of['akt','auf','login','tag'])for(const d in st[k]){const m=d.slice(0,7);if(m>=PASS.ab)s.add(m);}return[...s].sort();}
function passOk(st,id){const i=ITEM[id];return !!i&&!!i.pass&&!!PAESSE[i.pass]&&PAESSE[i.pass].item===id&&passStufe(xpMonat(st,i.pass))>=PASS.stufen;}

// ---------- Shop-Wechsel ----------
// Jeden Tag 4 Sachen unter 450 Münzen, eine davon 25 % günstiger, dazu 2 Highlights für die Woche aus allem ab 450 Münzen.
// Für alle gleich, nach Datum.
// Wie von einem gemischten Stapel gezogen: jede Sache kommt einmal pro Runde dran, dann wird neu gemischt.
// Neue Sachen (neu:'JJJJ-MM-TT') stehen ab diesem Tag 14 Tage lang zusätzlich unter „Neu“ und kommen erst danach in den Wechsel.
// Vor ROT.start war alles immer im Shop.
const ROT={tag:4,woche:2,rabatt:.75,neuTage:14,hoch:450,ab:'2026-10-26',start:'2026-10-31'};
function imNeu(i,d){return !!i.neu&&d>=i.neu&&dnum(d)<dnum(i.neu)+ROT.neuTage;}
function imWechsel(i,d){return i.p>0&&(!i.neu||dnum(d)>=dnum(i.neu)+ROT.neuTage);}
function ziehen(pool,start,n,salz){const out=[],m=pool.length;if(!m)return out;
  for(let k=start;out.length<Math.min(n,m)&&k<start+n+m;k++){const id=mischen(pool,salz+Math.floor(k/m))[k%m];if(!out.includes(id))out.push(id);}return out;}
const SHOP_CACHE=new Map();
function shopFuer(d){let r=SHOP_CACHE.get(d);if(r)return r;
  const w=wocheVon(d),wn=Math.floor((dnum(w)-dnum(ROT.ab))/7),tn=dnum(d)-dnum(ROT.ab);
  const woche=ziehen(ITEMS.filter(i=>imWechsel(i,w)&&i.p>=ROT.hoch).map(i=>i.id).sort(),wn*ROT.woche,ROT.woche,'woche');
  const tag=ziehen(ITEMS.filter(i=>imWechsel(i,d)&&i.p<ROT.hoch).map(i=>i.id).sort(),tn*ROT.tag,ROT.tag,'tag');
  const ang=tag.length?tag[hashStr('angebot'+d)%tag.length]:null;
  r={woche,tag,neu:ITEMS.filter(i=>i.p>0&&imNeu(i,d)).map(i=>i.id),ang,angP:ang?Math.round(preis(ang)*ROT.rabatt/10)*10:0,bisWoche:plusTage(w,7)};
  if(SHOP_CACHE.size>800)SHOP_CACHE.clear();SHOP_CACHE.set(d,r);return r;}
function imShop(id,d){const i=ITEM[id];if(!i||!(i.p>0))return false;if(d<ROT.start)return true;const s=shopFuer(d);return s.woche.includes(id)||s.tag.includes(id)||s.neu.includes(id);}
// Seit wie vielen Tagen weg (null: gestern noch da) und wann voraussichtlich wieder da
function zurueckNach(id,d){if(!imShop(id,d))return null;let k=1;while(k<=120&&!imShop(id,plusTage(d,-k)))k++;return k>8?k-1:null;}
function wiederAm(id,d,max){for(let k=1;k<=(max||90);k++){const t=plusTage(d,k);if(imShop(id,t))return t;}return null;}

// ---------- Münzen ----------
const MZ={stern:4,ass:15,tagBasis:15,tagStern:5};
function preis(id){return ITEM[id]&&ITEM[id].p||0;}
// Tagesangebote bis zur Umstellung auf den Shop-Wechsel (für Käufe alter Geräte)
function angeboteAlt(tag){let h=2166136261;for(const c of 'angebot'+tag)h=Math.imul(h^c.charCodeAt(0),16777619);
  const ids=ITEMS.filter(i=>i.p).map(i=>i.id);for(let i=ids.length-1;i>0;i--){h=Math.imul(h^(h>>>13),3266489917)>>>0;const j=h%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3).map(id=>({id,p:Math.round(preis(id)*.75/10)*10}));}
function bezahlt(id,o){return typeof o.p==='number'?o.p:preis(id);}
function kaufPreis(id,d){const s=shopFuer(d);return s.ang===id?s.angP:preis(id);}
function angebotOk(id,d,p){return kaufPreis(id,d)===p&&p<preis(id)||angeboteAlt(d).some(a=>a.id===id&&a.p===p);}
// Tagesbonus: Münzen je Tag der Serie; die Truhe an Tag 7 bringt eine Sache (own w:'serie' mit diesem Datum) oder Münzen
function serieMuenzen(st){let m=0,lauf=0,vor=null;const truhe=new Set();for(const id in st.own)if(st.own[id].w==='serie')truhe.add(st.own[id].d);
  for(const d of Object.keys(st.login).sort()){lauf=vor&&plusTage(vor,1)===d?lauf+1:1;vor=d;const p=seriePos(lauf);m+=p<7?SERIE[p-1]:truhe.has(d)?0:SERIE_TRUHE_MZ;}
  return m;}
function wochenMuenzen(st){const w=new Set();for(const k of['akt','auf','login','tag'])for(const d in st[k]){const x=wocheVon(d);if(x>=WOCHE_AB)w.add(x);}
  let m=0;for(const x of w)m+=wochenErledigt(st,x).length*WOCHE_MZ;return m;}
function passMuenzen(st){let m=0;for(const mon of passMonate(st)){const s=passStufe(xpMonat(st,mon));for(let k=1;k<=s;k++)m+=passMz(k);if(s>=PASS.stufen&&!PAESSE[mon])m+=PASS.ohneSache;}return m;}
function muenzen(st){let m=st.bonus|0;
  for(const k in st.best){const b=st.best[k];m+=b.st*MZ.stern+(b.a?MZ.ass:0);}
  for(const d in st.tag)m+=MZ.tagBasis+MZ.tagStern*st.tag[d].st;
  for(const d in st.auf){const a=st.auf[d];for(const id of aufgabenGezaehlt(d))if((a[id]|0)>=AUFG[id].z)m+=AUFG[id].m;}
  m+=serieMuenzen(st)+wochenMuenzen(st)+passMuenzen(st);
  for(const id in st.own)if(st.own[id].w==='kauf')m-=bezahlt(id,st.own[id]);
  return m;}

// ---------- Stand ----------
function neuerStand(){return{v:5,t:0,un:3,best:{},seen:{},cur:0,own:{},eq:Object.assign({},STANDARD),tag:{},auf:{},akt:{},login:{},endl:{best:0},opt:{ringe:true,vorschau:true,vib:true},auto:null,bonus:0};}
// Alter Spielstand (gg4) → neu. Wer ihn hat, hat schon im Halloween-Zeitraum gespielt (gg4 kam am 28.10.2026).
function ausAlt(a,N,heute){const s=neuerStand();if(!a||!a.best)return s;let max=0;
  for(const k in a.best){const b=a.best[k],n=+k;if(!(n>=1&&n<=N)||!b)continue;s.best[n]={s:b.s|0||1,st:Math.max(1,Math.min(3,b.st|0))};if(s.best[n].s===1)s.best[n].a=1;max=Math.max(max,n);}
  s.un=Math.max(3,Math.min(N,Math.max(a.un|0,max+3)));s.cur=Math.max(0,Math.min(N-1,a.cur|0));
  for(const k in a.seen||{})if(SEEN.includes(k))s.seen[k]=1;
  if(max>0){const e=EVENT['halloween-2026'],d=heute<=e.bis?heute:'2026-10-28';for(const id of evItems(e.id))s.own[id]={w:'event',d};}
  if(a.skin==='halloween'&&s.own['o-halloween'])s.eq.o='o-halloween';
  s.t=Date.now();return s;}
const SEEN=['start','sun','moon','warp','wind','bin','tages','endlos','aufgabe'];
const OPT=['ringe','vorschau','vib'];
// Eingaben prüfen: nur bekannte Felder in sinnvollen Grenzen. N = Anzahl Bahnen.
function sauber(x,N){const s=neuerStand();if(!x||typeof x!=='object')return s;const int=(v,a,b,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;};
  s.t=int(x.t,0,Date.now()+864e5,0);s.un=int(x.un,3,N,3);s.cur=int(x.cur,0,N-1,0);s.bonus=int(x.bonus,-1e7,1e7,0);
  if(x.best&&typeof x.best==='object')for(const k in x.best){const n=+k,b=x.best[k];if(!(n>=1&&n<=N)||!b)continue;const o={s:int(b.s,1,999,99),st:int(b.st,1,3,1)};if(b.a&&o.s===1)o.a=1;s.best[n]=o;}
  if(x.seen&&typeof x.seen==='object')for(const k of SEEN)if(x.seen[k])s.seen[k]=1;
  if(x.own&&typeof x.own==='object')for(const id in x.own){const o=x.own[id];if(!istBekannt(id)||!o||!['kauf','event','geschenk','code','serie','pass'].includes(o.w)||!DATUM.test(o.d))continue;s.own[id]={w:o.w,d:o.d};if(o.w==='kauf'&&Number.isInteger(o.p)&&o.p>=0&&o.p<preis(id))s.own[id].p=o.p;}
  if(x.eq&&typeof x.eq==='object')for(const f in STANDARD){const id=x.eq[f];if(typeof id==='string'&&ITEM[id]&&ITEM[id].f===f&&(s.own[id]||id===STANDARD[f]))s.eq[f]=id;}
  if(x.tag&&typeof x.tag==='object')for(const d of Object.keys(x.tag).filter(d=>DATUM.test(d)).sort().slice(-1000)){const b=x.tag[d];if(b)s.tag[d]={s:int(b.s,1,999,99),st:int(b.st,1,3,1)};}
  if(x.auf&&typeof x.auf==='object')for(const d of Object.keys(x.auf).filter(d=>DATUM.test(d)).sort().slice(-1000)){const a=x.auf[d];if(!a||typeof a!=='object')continue;const o={};for(const id of aufgabenGezaehlt(d))if(a[id])o[id]=int(a[id],0,AUFG[id].z,0);s.auf[d]=o;}
  if(x.akt&&typeof x.akt==='object')for(const d of Object.keys(x.akt).filter(d=>DATUM.test(d)).sort().slice(-400)){const a=x.akt[d];if(a&&typeof a==='object')s.akt[d]={b:int(a.b,0,500,0),s:int(a.s,0,1500,0),a:int(a.a,0,500,0),e:int(a.e,0,9999,0)};}
  if(x.login&&typeof x.login==='object')for(const d of Object.keys(x.login).filter(d=>DATUM.test(d)).sort().slice(-1000))if(x.login[d])s.login[d]=1;
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
    for(const d in s.akt){const x=s.akt[d],y=r.akt[d];r.akt[d]=y?{b:Math.max(x.b,y.b),s:Math.max(x.s,y.s),a:Math.max(x.a,y.a),e:Math.max(x.e,y.e)}:Object.assign({},x);}
    for(const d in s.login)r.login[d]=1;
    r.endl.best=Math.max(r.endl.best,s.endl.best|0);}
  for(const f in r.eq)if(!r.own[r.eq[f]]&&r.eq[f]!==STANDARD[f])r.eq[f]=STANDARD[f];
  return r;}
