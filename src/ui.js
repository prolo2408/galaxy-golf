// Galaxy Golf – Startbildschirm, Shop, Sammlung, Einstellungen, Konto, Admin und Abgleich mit dem Server.

// ---------- Server ----------
let konto=null,server=null,syncT=null,syncZeit=0,syncFehler='',adminT=null;
try{konto=JSON.parse(localStorage.getItem('gg-konto')||'null');}catch(e){}
function kontoSpeichern(){try{konto?localStorage.setItem('gg-konto',JSON.stringify(konto)):localStorage.removeItem('gg-konto');}catch(e){}}
async function api(pfad,body,kopf){const h={'content-type':'application/json'};if(konto)h.authorization='Bearer '+konto.token;Object.assign(h,kopf||{});
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),9000);let r;
  try{r=await fetch(pfad,{method:body===undefined?'GET':'POST',headers:h,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal,cache:'no-store'});}
  catch(e){throw Object.assign(new Error('Keine Verbindung zum Spiel-Server.'),{status:0});}finally{clearTimeout(to);}
  let j=null;try{j=await r.json();}catch(e){}
  if(!r.ok)throw Object.assign(new Error(j&&j.fehler||'Der Server antwortet nicht richtig ('+r.status+').'),{status:r.status});return j;}
async function serverPruefen(){try{const j=await api('/api/status');server=!!(j&&j.ok);}catch(e){server=false;}return server;}
function standUebernehmen(j){st=zusammen(sauber(j.stand,N),st);try{localStorage.setItem('gg5',JSON.stringify(st));}catch(e){}syncZeit=Date.now();syncFehler='';}
function syncBald(){if(!konto||!server)return;clearTimeout(syncT);syncT=setTimeout(sync,2500);}
async function sync(){clearTimeout(syncT);if(!konto||!server)return;
  try{const j=await api('/api/sync',{stand:st});const eqVor=JSON.stringify(st.eq);standUebernehmen(j);nachSync(eqVor);}
  catch(e){syncFehler=e.message;if(e.status===401){konto=null;kontoSpeichern();toast('Bitte neu anmelden, dein Konto war abgemeldet.');}aktualisieren();}}
function nachSync(eqVor){if(JSON.stringify(st.eq)!==eqVor){setzeLook(st.eq.o);bg=null;if(bahn)looks=mkLooks(bahn,modus==='kampagne'?li:modus==='tages'?100000+tagIndex(tagKey):lauf?lauf.seed%99991+lauf.n:0);}
  if(lvl)ui();aktualisieren();}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
setInterval(()=>{if(document.visibilityState==='visible')sync();},120000);

// ---------- Navigation ----------
let ansicht='spiel',stapel=[];
const spielSichtbar=()=>ansicht==='spiel',homeSichtbar=()=>ansicht==='home';
// Seiten merken sich, woher man kam: „Zurück“ führt genau dorthin, vom Startbildschirm aus immer zum Start
function zeige(a,arg,zurueck){const vor=ansicht;if(vor==='admin'&&a!=='admin')adminAbmelden();ansicht=a;
  $('home').hidden=a!=='home';$('scr').hidden=a==='spiel'||a==='home';
  if(a==='spiel'||a==='home'){stapel=[];if(a==='home')renderHome();else if(lvl){ui();size();}return;}
  if(!zurueck&&vor!==a&&vor!=='home'&&vor!=='spiel')stapel.push(vor);
  const T={inv:'Inventar',shop:'Shop',einst:'Einstellungen',konto:'Konto',admin:'Admin'};$('stitel').textContent=T[a];
  $('sinhalt').scrollTop=0;({inv:renderInv,shop:renderShop,einst:renderEinst,konto:renderKonto,admin:renderAdmin})[a](arg);}
$('zur').onclick=()=>zeige(stapel.pop()||'home',undefined,true);
function muenzAnzeige(){$('smz').innerHTML=COIN+zahl(muenzen(st));}
function aktualisieren(){muenzAnzeige();if(ansicht==='home')renderHome();else if(ansicht==='einst'&&!$('e-code')?.value&&document.activeElement?.tagName!=='INPUT')renderEinst();else if(ansicht==='shop')renderShop();else if(ansicht==='inv')renderInv();}
let toastT;function toast(s){const t=$('toast');t.textContent=s;t.hidden=false;t.classList.add('an');clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove('an');},3200);}
function fragen(titel,text,ja,fn,bild){const d=$('dialog');d.innerHTML='<div class="dkarte" role="dialog" aria-modal="true" aria-labelledby="dtitel">'+(bild?'<canvas class="dbild" width="360" height="240" aria-hidden="true"></canvas>':'')+'<h3 id="dtitel">'+titel+'</h3><p>'+text+'</p><div class="row"><button type="button" id="dnein">Abbrechen</button><button type="button" class="go" id="dja">'+ja+'</button></div></div>';
  if(bild)vorschau(d.querySelector('canvas'),bild);d.hidden=false;$('dnein').onclick=()=>d.hidden=true;$('dja').onclick=()=>{d.hidden=true;fn();};$('dja').focus();}

// ---------- Startbildschirm ----------
let hinweis=null,evSpaeter=false;
// Weiterspielen: die aktuelle Bahn, oder wenn sie geschafft ist, die erste offene Bahn
function weiterIndex(){const c=Math.min(st.cur,st.un-1);if(!st.best[c+1])return c;for(let i=0;i<st.un;i++)if(!st.best[i+1])return i;return c;}
function weiterText(){const i=weiterIndex();return'Bahn '+(i+1)+' · '+TIERS[LV[i].t];}
function renderHome(){const d=datum(),tg=st.tag[d],a=st.auf[d]||{},ids=aufgabenFuer(d);
  let h='<div class="hkopf"><h1 class="brand">Galaxy <span>Golf</span></h1><button type="button" class="mzbig" id="h-mz" aria-label="Münzen, zum Shop">'+COIN+zahl(muenzen(st))+'</button></div>';
  h+='<p class="hallo">'+(konto?'Hallo '+esc(konto.name)+' · '+(syncFehler?'nicht gespeichert: '+esc(syncFehler):syncZeit?'gespeichert':'wird abgeglichen'):server?'Spielstand nur auf diesem Gerät':'Spielstand auf diesem Gerät')+'</p>';
  const offen=offeneEvents();
  if(hinweis)h+='<div class="notiz"><b>'+esc(hinweis.t)+'</b><span>'+esc(hinweis.p)+'</span><button type="button" id="h-ok">Alles klar</button></div>';
  else if(offen.length&&!evSpaeter){const e=offen[0];h+='<div class="notiz evnotiz" style="--ev:'+(LOOKS[e.look]||LOOKS['o-klassisch']).css.acc+'"><b>'+esc(e.n)+' läuft</b><span>Noch '+restText(e.bis)+'. Im Shop gibt es '+e.items.map(id=>ITEM[id].n).join(', ')+' gratis, für immer.</span><div class="row"><button type="button" id="h-evsp">Später</button><button type="button" class="go" id="h-evshop">Zum Shop</button></div></div>';}
  else if(!konto&&server&&!localStorage.getItem('gg-willkommen'))h+='<div class="notiz"><b>Spielstand sichern</b><span>Mit Name und PIN liegt dein Fortschritt auf dem Server, du kannst ihn auf jedes Handy holen und Geschenk-Codes einlösen.</span><div class="row"><button type="button" id="h-spaeter">Später</button><button type="button" class="go" id="h-konto">Konto anlegen</button></div></div>';
  h+='<button type="button" class="go gross" id="h-weiter">Weiterspielen<small>'+weiterText()+'</small></button>';
  h+='<div class="hrow"><button type="button" id="h-tages">Tagesbahn<small>'+(tg?'<span class="st">'+'★'.repeat(tg.st)+'<i>'+'★'.repeat(3-tg.st)+'</i></span>':'neu heute')+'</small></button><button type="button" id="h-endlos">Endlos<small>Rekord '+st.endl.best+'</small></button></div>';
  h+='<section class="aufg" aria-labelledby="aufg-h"><h2 id="aufg-h">Tagesaufgaben</h2><ul>'+ids.map(id=>{const A=AUFG[id],v=Math.min(A.z,a[id]|0),ok=v>=A.z;
    return'<li class="'+(ok?'ok':'')+'"><span class="chk" aria-hidden="true"></span><span class="at">'+esc(A.t)+(ok?'<span class="sr"> – geschafft</span>':'')+'</span><span class="ap">'+(A.z>1?v+'/'+A.z:'')+'</span><span class="am">+'+A.m+'</span></li>';}).join('')+'</ul></section>';
  h+='<nav class="hnav"><button type="button" id="h-inv">Inventar</button><button type="button" id="h-shop">Shop'+(offen.length?'<i class="punkt" aria-hidden="true"></i><span class="sr"> (Event)</span>':'')+'</button><button type="button" id="h-einst">Einstellungen</button></nav>';
  $('hinhalt').innerHTML=h;
  $('h-weiter').onclick=()=>{zeige('spiel');if(modus!=='kampagne'||!bahn||zust==='won'||bahn!==LV[weiterIndex()]&&st.best[li+1])load(weiterIndex());};
  $('h-tages').onclick=()=>{zeige('spiel');if(modus!=='tages'||tagKey!==datum())startTages();};
  $('h-endlos').onclick=()=>{zeige('spiel');if(!lauf)startEndlos();};
  $('h-shop').onclick=$('h-mz').onclick=()=>zeige('shop',offen.length?'ev':null);$('h-inv').onclick=()=>zeige('inv');$('h-einst').onclick=()=>zeige('einst');
  if($('h-evshop'))$('h-evshop').onclick=()=>zeige('shop','ev');if($('h-evsp'))$('h-evsp').onclick=()=>{evSpaeter=true;renderHome();};
  if($('h-ok'))$('h-ok').onclick=()=>{hinweis=null;renderHome();};
  if($('h-spaeter'))$('h-spaeter').onclick=()=>{try{localStorage.setItem('gg-willkommen','1');}catch(e){}renderHome();};
  if($('h-konto'))$('h-konto').onclick=()=>zeige('konto');
  if(!lauf)vorratBauen();}
// Kleine Kulisse hinter dem Startbildschirm im angelegten Look
let hScene=null;
function homeFrame(){const c=$('hcv'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)||!hScene||hScene.look!==st.eq.o){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
    hScene={look:st.eq.o,bg:buildBg(c.width,c.height,dpr),looks:mkLooks({p:[[0,0,26,4],[0,0,17,2],[0,0,7,1,1,30,1,0],[0,0,13,3]]},7)};}
  const g=c.getContext('2d');mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(hScene.bg,0,0);x.setTransform(dpr,0,0,dpr,0,0);
    const cx=w*.5,cy=Math.min(h*.22,150),s=Math.min(1.3,w/360);x.save();x.translate(cx,cy);x.scale(s,s);
    const a1=anim*.25,a2=-anim*.16,p1=[Math.cos(a1)*95,Math.sin(a1)*34,17,2],p2=[Math.cos(a2)*150,Math.sin(a2)*52,13,3],m=[p1[0]+Math.cos(anim*1.4)*30,p1[1]+Math.sin(anim*1.4)*30,7,1],P=[[0,0,26,4],p1,m,p2];
    x.strokeStyle='rgba('+C.star+',.08)';x.lineWidth=1;x.beginPath();x.ellipse(0,0,95,34,0,0,7);x.stroke();x.beginPath();x.ellipse(0,0,150,52,0,0,7);x.stroke();
    const order=[3,1,2,0].sort((i,j)=>P[i][1]-P[j][1]);for(const i of order)drawBody(hScene.looks[i],P[i],P,1);
    x.restore();});}

// ---------- Shop ----------
// Aufgebaut wie die Shops großer Spiele: Event mit Countdown, Tagesangebote, dann die Fächer. Jede Karte zeigt ihre Seltenheit.
let shopFach=null,shopSz={};
const RAR=[['gewoehnlich','Gewöhnlich',200],['selten','Selten',400],['episch','Episch',700],['legendaer','Legendär',1e9]];
function seltenheit(id){const i=ITEM[id];if(!i||i.ev)return['event','Event'];if(!i.p)return['basis','Standard'];const r=RAR.find(r=>i.p<=r[2]);return[r[0],r[1]];}
// Restzeit bis Ende eines Datums (der Tag zählt mit) oder bis zu einem Zeitpunkt in ms
function restText(bis){const end=typeof bis==='number'?bis:new Date(bis+'T00:00:00').getTime()+864e5,ms=end-Date.now();if(ms<=0)return'0 Min';
  const m=Math.floor(ms/6e4),t=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60;return t?t+' T '+h+' Std':h?h+' Std '+mi+' Min':Math.max(1,mi)+' Min';}
function mitternacht(){const d=new Date();d.setHours(24,0,0,0);return d.getTime();}
function fd(d){const[y,m,t]=d.split('-');return t+'.'+m+'.'+y;}
function lookSeed(){return modus==='kampagne'?li:modus==='tages'?100000+tagIndex(tagKey):lauf?lauf.seed%99991+lauf.n:0;}
function lookAnwenden(){setzeLook(st.eq.o);bg=null;hScene=null;invSz=null;if(bahn)looks=mkLooks(bahn,lookSeed());}
// Abzeichen eines Events: Medaille mit der Sonne des Event-Looks
function abzeichen(c,evId){const e=EVENT[evId],g=c.getContext('2d'),w=c.width,h=c.height;mitLook(e.look||'o-klassisch',()=>mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(buildBg(w,h,w/120),0,0);const k=w/120;x.setTransform(k,0,0,k,0,0);
  x.save();x.translate(60,44);x.fillStyle=C.acc;x.beginPath();x.moveTo(-15,8);x.lineTo(-24,42);x.lineTo(-13,36);x.lineTo(-6,45);x.lineTo(1,12);x.fill();
  x.fillStyle=C.ring;x.beginPath();x.moveTo(15,8);x.lineTo(24,42);x.lineTo(13,36);x.lineTo(6,45);x.lineTo(-1,12);x.fill();
  x.fillStyle='#b8811f';x.beginPath();x.arc(0,0,25,0,7);x.fill();x.fillStyle='#ffd76a';x.beginPath();x.arc(0,0,22,0,7);x.fill();x.restore();
  (LK.sonne==='lantern'?drawLantern:LK.sonne==='neonsun'?drawNeonSun:drawSun)(60,44,12);}));}
function vorschau(c,id){if(id.startsWith('e-'))return abzeichen(c,id.slice(2));const i=ITEM[id],g=c.getContext('2d'),w=c.width,h=c.height;
  const lookId=i.f==='o'?id:st.eq.o;mitLook(lookId,()=>mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(buildBg(w,h,w/120),0,0);const k=w/120;x.setTransform(k,0,0,k,0,0);
    if(i.f==='k')drawBall(id,60,48,3.4);
    else if(i.f==='s'){const T=[];for(let n=0;n<34;n++){const f=n/33;T.push([12+f*84,74-Math.sin(f*2.6)*40+f*f*8]);}(SPUREN[id])(T);drawBall(st.eq.k,T[33][0],T[33][1],1.4);}
    else if(i.f==='l'){x.translate(60,48);x.scale(1.3,1.3);(LOECHER[id])(0,0);}
    else{const P=[[30,34,15,4],[86,58,13,2],[86+22,58-14,5,1],[38,78,9,3]],L=mkLooks({p:[[0,0,15,4],[0,0,13,2],[0,0,5,1,1,26,1,0],[0,0,9,1]]},3);
      P.forEach((p,j)=>drawBody(L[j],p,P,1));lochStandard(96,20);}}));}
const besitzt=id=>!!st.own[id]||(!!ITEM[id]&&!ITEM[id].p&&!ITEM[id].ev);
function status(id){const i=ITEM[id];if(st.eq[i.f]===id)return['an','Angelegt'];if(besitzt(id))return['hat','Im Inventar'];
  if(i.ev)return['zu',imEvent(EVENT[i.ev],datum())?'Im Event gratis':'Gab es beim Event '+EVENT[i.ev].n];return['kauf',COIN+zahl(i.p)];}
function kstatus(id){const e=id.startsWith('e-')?EVENT[id.slice(2)]:ITEM[id].ev&&EVENT[ITEM[id].ev];
  if(e&&!st.own[id]&&imEvent(e,datum()))return['frei','Gratis'];if(id.startsWith('e-'))return st.own[id]?['hat','Abgeholt']:['zu','Verpasst'];return status(id);}
function karte(id,ang){const[k,s]=kstatus(id),[r,rn]=seltenheit(id),i=ITEM[id],name=i?i.n:'Abzeichen',rab=ang&&k==='kauf';
  return'<button type="button" class="item karte '+k+'" data-r="'+r+'" data-id="'+id+'"'+(rab?' data-ang="'+ang.p+'"':'')+'>'+(rab?'<span class="rabatt">−25 %</span>':'')+
    '<canvas width="240" height="192" aria-hidden="true"></canvas><span class="rar">'+rn+'</span><b>'+esc(name)+'</b><small>'+(rab?'<s>'+zahl(i.p)+'</s>'+COIN+zahl(ang.p):s)+'</small></button>';}
function eventSeite(){const aktiv=EVENTS.filter(e=>imEvent(e,datum()));let h='';
  if(!aktiv.length)h+='<div class="evleer"><b>Gerade läuft kein Event</b><span>Events bringen eigene Looks und Sachen, die es nur in dieser Zeit gibt. Schau wieder rein.</span></div>';
  for(const e of aktiv){const hat=!!st.own['e-'+e.id],L=LOOKS[e.look]||LOOKS['o-klassisch'];
    h+='<section class="evbanner" style="--ev:'+L.css.acc+';--evring:'+L.css.ring+'" aria-labelledby="evt-'+e.id+'"><canvas class="evcv" data-ev="'+e.id+'" aria-hidden="true"></canvas><div class="evtext">'+
      '<span class="evlabel">'+(hat?'Abgeholt':'Event · gratis')+'</span><h3 id="evt-'+e.id+'" class="evtitel" style="font-family:'+(L.brand||'var(--display)').replace(/"/g,"'")+'">'+esc(e.n)+'</h3><p class="evzeit" data-bis="'+e.bis+'">Endet in '+restText(e.bis)+'</p></div></section>';
    h+='<p class="evinfo">'+(hat?'Abgeholt am '+fd(st.own['e-'+e.id].d)+'. Alles liegt für immer in deinem Inventar.':'Alles gratis für alle, die bis zum '+fd(e.bis)+' vorbeischauen. Es bleibt für immer in deinem Inventar, auch nach dem Event.')+'</p>';
    h+='<div class="sgrid">'+karte('e-'+e.id)+e.items.map(id=>karte(id)).join('')+'</div>';
    h+=hat?'<button type="button" class="gross" data-inv="'+e.id+'">Im Inventar anlegen</button>':'<button type="button" class="go gross" data-holen="'+e.id+'">Alles gratis abholen</button>';}
  const meine=EVENTS.filter(e=>st.own['e-'+e.id]).sort((a,b)=>st.own['e-'+a.id].d.localeCompare(st.own['e-'+b.id].d));
  if(meine.length)h+='<h3 class="sub2">Deine Abzeichen</h3><div class="abzliste">'+meine.map(e=>'<div class="abz"><canvas width="120" height="96" data-abz="'+e.id+'" aria-hidden="true"></canvas><div><b>'+esc(e.n)+'</b><small>abgeholt am '+fd(st.own['e-'+e.id].d)+'</small></div></div>').join('')+'</div>';
  return h;}
function angebotSeite(){return'<div class="angkopf"><h3>Tagesangebote</h3><span class="evzeit" data-bis-ms="'+mitternacht()+'">Neue in '+restText(mitternacht())+'</span></div>'+
  '<div class="sgrid">'+angebote(datum()).map(a=>karte(a.id,a)).join('')+'</div><p class="evinfo">Jeden Tag drei Sachen 25 % günstiger, für alle gleich. Um Mitternacht kommen neue.</p>';}
function renderShop(tab){if(tab)shopFach=tab;if(!shopFach)shopFach=offeneEvents().length?'ev':'ang';const S=$('sinhalt');
  const tabs=[['ev','Event'+(offeneEvents().length?'<i class="punkt" aria-hidden="true"></i><span class="sr"> (neu)</span>':'')],['ang','Angebote'],...FAECHER];
  let h='<div class="stabs" role="tablist">'+tabs.map(([f,n])=>'<button type="button" role="tab" data-f="'+f+'" aria-selected="'+(f===shopFach)+'">'+n+'</button>').join('')+'</div>';
  h+=shopFach==='ev'?eventSeite():shopFach==='ang'?angebotSeite():'<div class="sgrid">'+ITEMS.filter(i=>i.f===shopFach).map(i=>karte(i.id)).join('')+'</div>';
  S.innerHTML=h;muenzAnzeige();shopSz={};
  S.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{shopFach=b.dataset.f;renderShop();S.scrollTop=0;});
  const sel=S.querySelector('.stabs [aria-selected="true"]');if(sel)sel.scrollIntoView({block:'nearest',inline:'nearest'});
  S.querySelectorAll('.karte').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>shopKlick(b.dataset.id,b.dataset.ang?+b.dataset.ang:0);});
  S.querySelectorAll('[data-abz]').forEach(c=>abzeichen(c,c.dataset.abz));
  S.querySelectorAll('[data-holen]').forEach(b=>b.onclick=()=>holen(EVENT[b.dataset.holen]));
  S.querySelectorAll('[data-inv]').forEach(b=>b.onclick=()=>zeige('inv',ITEM[EVENT[b.dataset.inv].items[0]].f));}
function holen(e){const d=datum();for(const id of evItems(e.id))if(!st.own[id])st.own[id]={w:'event',d};
  let t=e.n+' abgeholt.';if(e.look&&st.eq.o!==e.look){st.auto={look:e.look,vorher:st.eq.o};st.eq.o=e.look;lookAnwenden();t+=' Der Look ist schon angelegt.';}
  persist();sync();toast(t);renderShop();}
function shopKlick(id,ang){const[k]=kstatus(id);
  if(k==='frei')return holen(id.startsWith('e-')?EVENT[id.slice(2)]:EVENT[ITEM[id].ev]);
  if(id.startsWith('e-'))return toast(k==='hat'?'Das Abzeichen hast du schon.':'Das Event ist vorbei.');
  const i=ITEM[id];if(k==='an'||k==='hat')return zeige('inv',i.f);
  if(k==='zu')return toast(i.n+' gab es nur beim Event '+EVENT[i.ev].n+'.');
  const p=ang||i.p,m=muenzen(st);if(m<p)return toast('Dir fehlen noch '+zahl(p-m)+' Münzen für '+i.n+'.');
  fragen(esc(i.n)+' kaufen?','Kostet '+zahl(p)+' Münzen'+(ang?' statt '+zahl(i.p):'')+'. Danach hast du noch '+zahl(m-p)+'.','Kaufen',()=>{st.own[id]={w:'kauf',d:datum()};if(ang)st.own[id].p=ang;anlegen(id);toast(i.n+' gekauft und angelegt.');renderShop();sync();},id);}
function anlegen(id){const i=ITEM[id];st.eq[i.f]=id;if(i.f==='o'){st.auto=null;lookAnwenden();}persist();}
// Event-Banner: Szene im Event-Look, Fledermäuse fliegen durch, Countdown läuft mit
let shopT=0;
function shopFrame(dt){shopT+=dt;if(shopT>1){shopT=0;$('sinhalt').querySelectorAll('[data-bis]').forEach(p=>p.textContent='Endet in '+restText(p.dataset.bis));
    $('sinhalt').querySelectorAll('[data-bis-ms]').forEach(p=>p.textContent='Neue in '+restText(+p.dataset.bisMs));}
  $('sinhalt').querySelectorAll('.evcv').forEach(c=>{const e=EVENT[c.dataset.ev],w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);
    let z=shopSz[e.id];if(!z||z.w!==w||z.h!==h){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);mitLook(e.look,()=>{z=shopSz[e.id]={w,h,bg:buildBg(c.width,c.height,dpr),L:mkLooks({p:[[0,0,30,4],[0,0,16,2],[0,0,7,1,1,30,1,0]]},5),fx:[]};});}
    mitLook(e.look,()=>mitCtx(c.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(z.bg,0,0);const k=h/150;x.setTransform(dpr*k,0,0,dpr*k,dpr*(w-360*k),0);
      const P=[[250,78+Math.sin(anim*1.6)*4,30,4],[322,44,16,2],[322+Math.cos(anim*1.2)*30,44+Math.sin(anim*1.2)*30,7,1]];P.forEach((p,j)=>drawBody(z.L[j],p,P,1));
      if(LK.fx==='bats'){if(z.fx.length<2&&Math.random()<dt*.6)z.fx.push({k:'bat',x:380,y:20+Math.random()*90,vx:-(30+Math.random()*25),ph:Math.random()*6,s:.6+Math.random()*.4});
        for(const b of z.fx){b.x+=b.vx*dt;b.ph+=dt*13;}z.fx=z.fx.filter(b=>b.x>-40);const a=fx;fx=z.fx;fxDraw();fx=a;}}));});}

// ---------- Inventar ----------
// Vier Plätze wie ein Spind: Platz antippen, dann aus den eigenen Sachen wählen. Oben fliegt die Ausrüstung zur Probe.
let invFach='k',invSz=null;
function renderInv(f){if(f)invFach=f;const alle=ITEMS.filter(i=>i.f===invFach),mein=alle.filter(i=>besitzt(i.id)),fehlt=alle.length-mein.length,name=FAECHER.find(x=>x[0]===invFach)[1];
  let h='<canvas class="invbild" id="invcv" role="img" aria-label="Vorschau: '+esc(FAECHER.map(([f])=>ITEM[st.eq[f]].n).join(', '))+'"></canvas><div class="slots" role="tablist" aria-label="Plätze">';
  for(const[f,n]of FAECHER)h+='<button type="button" role="tab" class="slot" data-slot="'+f+'" aria-selected="'+(f===invFach)+'"><canvas width="240" height="192" aria-hidden="true"></canvas><span>'+n+'</span><b>'+esc(ITEM[st.eq[f]].n)+'</b></button>';
  h+='</div><h3 class="sub2">'+name+' wählen <small>'+mein.length+' von '+alle.length+'</small></h3><div class="sgrid">';
  for(const i of mein){const an=st.eq[invFach]===i.id;h+='<button type="button" class="item '+(an?'an':'hat')+'" data-id="'+i.id+'" aria-pressed="'+an+'"><canvas width="240" height="192" aria-hidden="true"></canvas><b>'+esc(i.n)+'</b><small>'+(an?'Angelegt':i.ev?esc(EVENT[i.ev].n):'')+'</small></button>';}
  if(fehlt)h+='<button type="button" class="item mehr" id="inv-shop"><span class="mehrbild" aria-hidden="true">+</span><b>Mehr im Shop</b><small>'+fehlt+' weitere</small></button>';
  $('sinhalt').innerHTML=h+'</div>';muenzAnzeige();invSz=null;
  $('sinhalt').querySelectorAll('.slot').forEach(b=>{vorschau(b.querySelector('canvas'),st.eq[b.dataset.slot]);b.onclick=()=>{invFach=b.dataset.slot;renderInv();};});
  $('sinhalt').querySelectorAll('.item[data-id]').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>{const id=b.dataset.id;if(st.eq[invFach]!==id){anlegen(id);toast(ITEM[id].n+' angelegt.');}renderInv();};});
  if($('inv-shop'))$('inv-shop').onclick=()=>{shopFach=invFach;zeige('shop');};}
// Probeflug: Kugel mit Spur an Sonne und Planet vorbei ins Loch, alles im angelegten Look
function invFrame(){const c=$('invcv');if(!c)return;const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);
  if(!invSz||invSz.w!==w||invSz.h!==h||invSz.look!==st.eq.o){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
    invSz={w,h,look:st.eq.o,bg:buildBg(c.width,c.height,dpr),L:mkLooks({p:[[0,0,20,4],[0,0,14,2],[0,0,6,1,1,26,1,0]]},11)};}
  mitCtx(c.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(invSz.bg,0,0);const k=Math.min(w/320,h/150);
    x.setTransform(dpr*k,0,0,dpr*k,dpr*(w-320*k)/2,dpr*(h-150*k)/2);
    const P=[[84,58,20,4],[196,42,14,2],[196+Math.cos(anim*1.3)*26,42+Math.sin(anim*1.3)*26,6,1]];P.forEach((p,j)=>drawBody(invSz.L[j],p,P,1));
    (LOECHER[st.eq.l]||lochStandard)(276,104);
    const dur=2.8,ph=(anim%dur)/dur,A=[26,118],B=[160,150],E=[276,104],pt=f=>{const u=1-f;return[u*u*A[0]+2*u*f*B[0]+f*f*E[0],u*u*A[1]+2*u*f*B[1]+f*f*E[1]];};
    if(ph<.82){const n=ph/.82,T=[];for(let i=0;i<=36;i++)T.push(pt(n*i/36));(SPUREN[st.eq.s]||SPUREN['s-standard'])(T);const e=T[36];drawBall(st.eq.k,e[0],e[1],1.6);}
    else drawBall(st.eq.k,E[0],E[1],1.6*Math.max(0,1-(ph-.82)/.12));});}

// ---------- Einstellungen ----------
function profil(){const evs=EVENTS.filter(e=>st.own['e-'+e.id]).sort((a,b)=>st.own['e-'+a.id].d.localeCompare(st.own['e-'+b.id].d)),best=Object.values(st.best);
  return'<section class="grp"><h3>Profil</h3>'+(evs.length?'<div class="dabei"><canvas width="120" height="96" data-abz="'+evs[0].id+'" aria-hidden="true"></canvas><span>Dabei seit <b>'+esc(evs[0].n)+'</b></span></div>':'')+
    '<dl class="werte"><div><dt>Sterne</dt><dd>'+zahl(totalStars())+' <small>von '+zahl(N*3)+'</small></dd></div><div><dt>Bahnen</dt><dd>'+best.length+' <small>von '+N+'</small></dd></div>'+
    '<div><dt>Asse</dt><dd>'+best.filter(b=>b.a).length+'</dd></div><div><dt>Tagesbahnen</dt><dd>'+Object.keys(st.tag).length+'</dd></div><div><dt>Endlos-Rekord</dt><dd>'+st.endl.best+'</dd></div>'+
    '<div><dt>Sachen</dt><dd>'+ITEMS.filter(i=>(i.p||i.ev)&&st.own[i.id]).length+' <small>von '+ITEMS.filter(i=>i.p||i.ev).length+'</small></dd></div></dl></section>';}
function renderEinst(){let h=profil()+'<section class="grp"><h3>Konto</h3>';
  if(konto)h+='<p>Angemeldet als <b>'+esc(konto.name)+'</b>. '+(syncFehler?'Letzter Abgleich ging schief: '+esc(syncFehler):syncZeit?'Zuletzt gespeichert um '+new Date(syncZeit).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+'.':'')+'</p><div class="row"><button type="button" id="e-sync">Jetzt speichern</button><button type="button" id="e-ab">Abmelden</button></div>';
  else if(server)h+='<p>Ohne Konto liegt dein Spielstand nur auf diesem Gerät. Mit Name und PIN holst du ihn auf jedes Handy.</p><div class="row"><button type="button" class="go" id="e-konto">Konto anlegen oder anmelden</button></div>';
  else h+='<p>Kein Spiel-Server erreichbar. Konten und Geschenk-Codes gehen nur in der App, die du von deinem Server installierst.</p>';
  h+='</section><section class="grp"><h3>Spiel</h3>'+[['ringe','Schwerkraft-Ringe anzeigen'],['vorschau','Flugbahn beim Zielen anzeigen'],['vib','Vibrieren beim Einlochen']].filter(([k])=>k!=='vib'||navigator.vibrate)
    .map(([k,t])=>'<label class="schalter" for="o-'+k+'"><span>'+t+'</span><input type="checkbox" role="switch" id="o-'+k+'" data-o="'+k+'"'+(st.opt[k]?' checked':'')+'></label>').join('')+'</section>';
  h+='<section class="grp"><h3>Code einlösen</h3><form id="e-cform" class="row"><label class="sr" for="e-code">Geschenk-Code</label><input id="e-code" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Geschenk-Code"'+(server?'':' disabled')+'><button type="submit" class="go"'+(server?'':' disabled')+'>Einlösen</button></form><p class="hinweis" id="e-cmsg" role="status"></p></section>';
  h+='<section class="grp"><h3>Über</h3><p>Galaxy Golf · '+N+' Bahnen in fünf Stufen, jeden Tag eine Tagesbahn und der Endlos-Modus. Weltraum-Minigolf mit echter Schwerkraft.</p></section>';
  $('sinhalt').innerHTML=h;muenzAnzeige();$('sinhalt').querySelectorAll('[data-abz]').forEach(c=>abzeichen(c,c.dataset.abz));
  if($('e-konto'))$('e-konto').onclick=()=>zeige('konto');
  if($('e-sync'))$('e-sync').onclick=async e=>{e.target.disabled=true;await sync();toast(syncFehler?syncFehler:'Gespeichert.');renderEinst();};
  if($('e-ab'))$('e-ab').onclick=()=>fragen('Abmelden?','Dein Fortschritt bleibt in deinem Konto. Auf diesem Gerät beginnt danach ein neuer Spielstand, bis du dich wieder anmeldest.','Abmelden',async()=>{await sync();
    try{await api('/api/abmelden',{});}catch(e){}konto=null;kontoSpeichern();st=neuerStand();eventsPruefen();lookAnwenden();try{localStorage.setItem('gg5',JSON.stringify(st));}catch(e){}bahn=null;lauf=null;toast('Abgemeldet.');zeige('home');});
  $('sinhalt').querySelectorAll('[data-o]').forEach(i=>i.onchange=()=>{st.opt[i.dataset.o]=i.checked;persist();});
  $('e-cform').onsubmit=async e=>{e.preventDefault();const inp=$('e-code'),b=e.target.querySelector('button'),code=inp.value.trim();if(!code)return;b.disabled=true;$('e-cmsg').textContent='';
    try{const j=await api('/api/code',{code});
      if(j.admin){adminT=j.admin;inp.value='';zeige('admin');return;}
      const eqVor=JSON.stringify(st.eq);standUebernehmen(j);nachSync(eqVor);inp.value='';$('e-cmsg').innerHTML='<b>Eingelöst:</b> '+esc(j.text)+'.';}
    catch(err){$('e-cmsg').textContent=err.message;}finally{b.disabled=false;}};}

// ---------- Konto ----------
let kontoArt='neu';
function renderKonto(){const neu=kontoArt==='neu';
  $('sinhalt').innerHTML='<div class="tabs2" role="tablist"><button type="button" role="tab" data-k="neu" aria-selected="'+neu+'">Neues Konto</button><button type="button" role="tab" data-k="an" aria-selected="'+!neu+'">Anmelden</button></div>'+
    '<form id="kform" class="form"><p>'+(neu?'Wähle einen Namen, den deine Freunde erkennen, und eine PIN mit 4 bis 8 Ziffern. Dein bisheriger Fortschritt auf diesem Gerät kommt mit.':'Mit Name und PIN holst du deinen Spielstand auf dieses Gerät. Was du hier schon gespielt hast, wird dazugerechnet.')+'</p>'+
    '<label for="kname">Spielername</label><input id="kname" maxlength="16" autocomplete="username" autocapitalize="words" spellcheck="false" required>'+
    '<label for="kpin">PIN</label><input id="kpin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="'+(neu?'new-password':'current-password')+'" required>'+
    '<button type="submit" class="go">'+(neu?'Konto anlegen':'Anmelden')+'</button><p class="hinweis" id="kmsg" role="status"></p></form>';
  $('sinhalt').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kontoArt=b.dataset.k;renderKonto();});
  $('kform').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button[type=submit]'),name=$('kname').value.trim(),pin=$('kpin').value;b.disabled=true;$('kmsg').textContent='';
    try{const j=await api(neu?'/api/konto':'/api/anmelden',neu?{name,pin,stand:st}:{name,pin});konto={name:j.name,token:j.token};kontoSpeichern();
      try{localStorage.setItem('gg-willkommen','1');}catch(e){}const eqVor=JSON.stringify(st.eq);standUebernehmen(j);persist();nachSync(eqVor);
      toast(neu?'Konto angelegt. Dein Spielstand ist gesichert.':'Willkommen zurück, '+j.name+'.');zeige('home');}
    catch(err){$('kmsg').textContent=err.message;b.disabled=false;}};}

// ---------- Admin ----------
let adminDaten=null,adminOffen=null;
function adminAbmelden(){if(adminT)api('/api/admin/abmelden',{},{'x-admin':adminT}).catch(()=>{});adminT=null;adminDaten=null;adminOffen=null;}
const aapi=(p,b)=>api(p,b,{'x-admin':adminT});
function chips(name,ausser){const alle=[...EVENTS.map(e=>({id:'e-'+e.id,n:'Event '+e.n})),...ITEMS.filter(i=>i.p||i.ev)];
  return'<div class="chips" role="group" aria-label="Sachen">'+alle.filter(i=>!ausser||!ausser.includes(i.id)).map(i=>'<label class="chip"><input type="checkbox" name="'+name+'" value="'+i.id+'"><span>'+esc(i.n)+'</span></label>').join('')+'</div>';}
const gewaehlt=(f,name)=>[...f.querySelectorAll('input[name="'+name+'"]:checked')].map(i=>i.value);
async function renderAdmin(){if(!adminT)return zeige('einst');const S=$('sinhalt');
  if(!adminDaten){S.innerHTML='<p class="leer">Lädt …</p>';try{adminDaten=await aapi('/api/admin');}catch(e){adminT=null;S.innerHTML='<p class="leer">'+esc(e.message)+'</p>';return;}}
  const D=adminDaten;let h='<p class="adminhin">Nur für dich. Beim Verlassen dieser Seite meldest du dich ab, auf fremden Handys bleibt nichts zurück.</p>';
  h+='<h3 class="sub2">Spieler <small>'+D.spieler.length+'</small></h3>';
  if(!D.spieler.length)h+='<p class="leer">Noch niemand hat ein Konto.</p>';
  h+='<div class="spliste">'+D.spieler.map(p=>{const offen=adminOffen===p.id;return'<div class="sp'+(offen?' offen':'')+'"><button type="button" class="spkopf" data-sp="'+p.id+'" aria-expanded="'+offen+'"><b>'+esc(p.name)+'</b><small>★ '+zahl(p.sterne)+' · '+COIN+zahl(p.muenzen)+' · '+p.bahnen+' Bahnen · zuletzt '+new Date(p.zuletzt).toLocaleDateString('de-DE')+'</small></button>'+
    (offen?'<form class="spform" data-id="'+p.id+'"><div class="row wrap"><button type="button" data-m="100">+100 Münzen</button><button type="button" data-m="500">+500</button><button type="button" data-m="1000">+1.000</button><button type="button" data-alle="1"'+(p.un>=D.n?' disabled':'')+'>Alle Bahnen freischalten</button></div>'+
      '<p class="klein">Sachen schenken</p>'+chips('g',p.own)+'<button type="submit" class="go">Ausgewählte schenken</button>'+
      '<div class="row"><label class="sr" for="pin-'+p.id+'">Neue PIN</label><input id="pin-'+p.id+'" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="Neue PIN"><button type="button" data-pin="1">PIN setzen</button></div></form>':'')+'</div>';}).join('')+'</div>';
  h+='<h3 class="sub2">Geschenk-Code erstellen</h3><form id="a-code" class="form"><label for="a-c">Code</label><input id="a-c" maxlength="24" autocapitalize="characters" spellcheck="false" placeholder="leer lassen = zufällig">'+
    '<label for="a-m">Münzen</label><input id="a-m" type="number" inputmode="numeric" min="0" step="50" value="0"><p class="klein">Sachen</p>'+chips('c')+
    '<label class="schalter" for="a-alle"><span>Alle Bahnen freischalten</span><input type="checkbox" role="switch" id="a-alle"></label>'+
    '<label for="a-max">Wie oft einlösbar</label><select id="a-max"><option value="1">einmal</option><option value="5">fünfmal</option><option value="0">unbegrenzt (jeder einmal)</option></select>'+
    '<button type="submit" class="go">Code erstellen</button><p class="hinweis" id="a-msg" role="status"></p></form>';
  h+='<h3 class="sub2">Codes <small>'+D.codes.length+'</small></h3>'+(D.codes.length?'<div class="codes">'+D.codes.map(c=>'<div class="cz"><div><b class="mono">'+esc(c.code)+'</b><small>'+esc(c.text)+' · '+(c.max?c.eingeloest.length+' von '+c.max:c.eingeloest.length+'× eingelöst')+(c.eingeloest.length?' · '+c.eingeloest.map(esc).join(', '):'')+'</small></div><button type="button" data-kopie="'+esc(c.code)+'">Kopieren</button><button type="button" class="weg" data-weg="'+esc(c.code)+'">Löschen</button></div>').join('')+'</div>':'<p class="leer">Noch keine Codes.</p>');
  S.innerHTML=h;
  S.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{adminOffen=adminOffen===b.dataset.sp?null:b.dataset.sp;renderAdmin();});
  const schenken=async(id,body)=>{try{const j=await aapi('/api/admin/schenken',Object.assign({id},body));toast(j.text);adminDaten=null;await renderAdmin();if(konto)sync();}catch(e){toast(e.message);if(e.status===401)zeige('einst');}};
  S.querySelectorAll('.spform').forEach(f=>{const id=f.dataset.id;
    f.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>schenken(id,{muenzen:+b.dataset.m}));
    f.querySelector('[data-alle]').onclick=()=>schenken(id,{alleBahnen:true});
    f.onsubmit=e=>{e.preventDefault();const items=gewaehlt(f,'g');if(!items.length)return toast('Erst Sachen auswählen.');schenken(id,{items});};
    f.querySelector('[data-pin]').onclick=async()=>{const pin=$('pin-'+id).value;try{const j=await aapi('/api/admin/pin',{id,pin});toast(j.text);$('pin-'+id).value='';}catch(e){toast(e.message);}};});
  $('a-code').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button[type=submit]');b.disabled=true;
    try{const j=await aapi('/api/admin/code',{code:$('a-c').value,muenzen:+$('a-m').value||0,items:gewaehlt(f,'c'),alleBahnen:$('a-alle').checked,max:+$('a-max').value});
      adminDaten=null;await renderAdmin();$('a-msg').innerHTML='Neuer Code <b class="mono">'+esc(j.code)+'</b>: '+esc(j.text);toast('Code '+j.code+' erstellt.');}
    catch(err){$('a-msg').textContent=err.message;b.disabled=false;}};
  S.querySelectorAll('[data-kopie]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.kopie);toast('Code kopiert.');}catch(e){toast('Kopieren ging nicht. Code: '+b.dataset.kopie);}});
  S.querySelectorAll('[data-weg]').forEach(b=>b.onclick=()=>fragen('Code löschen?','Der Code '+esc(b.dataset.weg)+' lässt sich danach nicht mehr einlösen. Was schon eingelöst ist, bleibt.','Löschen',async()=>{try{await aapi('/api/admin/code-loeschen',{code:b.dataset.weg});adminDaten=null;renderAdmin();toast('Code gelöscht.');}catch(e){toast(e.message);}}));}

// ---------- Start ----------
(function(){const ev=eventsPruefen();setzeLook(st.eq.o);
  if(ev.vorbei)hinweis={t:ev.vorbei+' ist vorbei',p:'Im Inventar kannst du den Look jederzeit wieder anlegen.'};
  size();zeige('home');requestAnimationFrame(frame);
  serverPruefen().then(ok=>{if(ok&&konto)sync();else aktualisieren();});})();
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('dialog').hidden){$('dialog').hidden=true;return;}if(ansicht!=='spiel'&&ansicht!=='home'){e.preventDefault();$('zur').click();}});
