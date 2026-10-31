// Galaxy Golf – Startbildschirm, Shop, Großansicht, Kauf-Moment, Inventar, Sternenpass, Rangliste, Einstellungen, Konto, Admin und Abgleich mit dem Server.

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
function nachSync(eqVor){if(JSON.stringify(st.eq)!==eqVor)lookAnwenden();
  if(lvl)ui();aktualisieren();}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
setInterval(()=>{if(document.visibilityState==='visible')sync();},120000);

// ---------- Navigation ----------
// Untere Leiste mit fünf Reitern. Rangliste, Konto und Admin sind Unterseiten von „Mehr“ und haben „Zurück“.
const REITER=['home','aufg','shop','inv','mehr'],ELTERN={rang:'mehr',konto:'mehr',admin:'mehr'};
const TITEL={aufg:'Aufgaben',inv:'Inventar',shop:'Shop',mehr:'Mehr',rang:'Rangliste',konto:'Konto',admin:'Admin'};
let ansicht='spiel',stapel=[],letzterReiter='home';
const spielSichtbar=()=>ansicht==='spiel',homeSichtbar=()=>ansicht==='home';
function zeige(a,arg,zurueck){if(a==='pass'){a='aufg';arg='pass';}if(a==='einst')a='mehr';
  const vor=ansicht;if(vor==='admin'&&a!=='admin')adminAbmelden();ansicht=a;const reiter=REITER.includes(a);if(reiter)letzterReiter=a;
  $('home').hidden=a!=='home';$('scr').hidden=a==='spiel'||a==='home';$('leiste').hidden=a==='spiel';
  if(reiter)stapel=[];else if(!zurueck&&vor!==a&&vor!=='spiel')stapel.push(vor);
  if(a==='spiel'){if(lvl){ui();size();}return;}
  if(a==='home'){renderHome();return leisteZeigen();}
  $('zur').hidden=reiter;$('stitel').textContent=TITEL[a];
  $('sinhalt').scrollTop=0;({aufg:renderAufg,inv:renderInv,shop:renderShop,mehr:renderEinst,rang:renderRang,konto:renderKonto,admin:renderAdmin})[a](arg);leisteZeigen();}
$('zur').onclick=()=>zeige(stapel.pop()||ELTERN[ansicht]||'home',undefined,true);
function lokal(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lokalSetzen(k,v){try{localStorage.setItem(k,v);}catch(e){}}
// Punkte an den Reitern: Aufgaben (Bonus offen oder heute noch nicht reingeschaut), Shop (Event offen oder heute noch nicht reingeschaut), Inventar (neue Sachen)
function leisteZeigen(){const d=datum(),aktiv=REITER.includes(ansicht)?ansicht:ELTERN[ansicht]||'home',
    punkt={aufg:!st.login[d]||lokal('gg-aufg-tag')!==d,shop:offeneEvents().length>0||lokal('gg-shop-tag')!==d,inv:ungesehen().length>0};
  document.querySelectorAll('#leiste [data-reiter]').forEach(b=>{const r=b.dataset.reiter;if(r===aktiv)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    const pt=b.querySelector('.punkt');if(pt)pt.hidden=!punkt[r];});}
document.querySelectorAll('#leiste [data-reiter]').forEach(b=>b.onclick=()=>{const r=b.dataset.reiter;if(r==='shop')zeige('shop',offeneEvents().length?'ev':'heute');else zeige(r);});
function muenzAnzeige(){$('smz').innerHTML=COIN+zahl(muenzen(st));}
function aktualisieren(){muenzAnzeige();if(ansicht==='home')renderHome();else if(ansicht==='mehr'&&!$('e-code')?.value&&document.activeElement?.tagName!=='INPUT')renderEinst();else if(ansicht==='shop')renderShop();else if(ansicht==='inv')renderInv();
  else if(ansicht==='aufg')renderAufg();if(grossId&&!$('gross').hidden)renderGross();if(ansicht!=='spiel')leisteZeigen();}
let toastT;function toast(s){const t=$('toast');t.textContent=s;t.hidden=false;t.classList.add('an');clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove('an');},3200);}
function fragen(titel,text,ja,fn,bild){const d=$('dialog');d.innerHTML='<div class="dkarte" role="dialog" aria-modal="true" aria-labelledby="dtitel">'+(bild?'<canvas class="dbild" width="360" height="240" aria-hidden="true"></canvas>':'')+'<h3 id="dtitel">'+titel+'</h3><p>'+text+'</p><div class="row"><button type="button" id="dnein">Abbrechen</button><button type="button" class="go" id="dja">'+ja+'</button></div></div>';
  if(bild)vorschau(d.querySelector('canvas'),bild);d.hidden=false;$('dnein').onclick=()=>d.hidden=true;$('dja').onclick=()=>{d.hidden=true;fn();};$('dja').focus();}

// ---------- Startbildschirm ----------
// Nur das Wichtigste, ohne Scrollen: Szene, Weiterspielen, Tagesbahn und Endlos, darunter eine Zeile zu Aufgaben und Sternenpass.
const GESCHENK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7.5h18v3H3zM12 7.5V20M12 7.5c-1.6-3.6-5.6-3.8-5.6-1.6 0 1.4 2.5 1.6 5.6 1.6zM12 7.5c1.6-3.6 5.6-3.8 5.6-1.6 0 1.4-2.5 1.6-5.6 1.6z"/></svg>';
const TRUHE_BILD='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="11" rx="2" fill="#b46cff"/><path d="M3 11.5C3 7 6.5 5 12 5s9 2 9 6.5z" fill="#7a3fd0"/><rect x="10.3" y="10" width="3.4" height="5" rx="1" fill="#ffd76a"/></svg>';
// Weiterspielen: die aktuelle Bahn, oder wenn sie geschafft ist, die erste offene Bahn
function weiterIndex(){const c=Math.min(st.cur,st.un-1);if(!st.best[c+1])return c;for(let i=0;i<st.un;i++)if(!st.best[i+1])return i;return c;}
function weiterText(){const i=weiterIndex();return'Bahn '+(i+1)+' · '+TIERS[LV[i].t];}
function weiterSpielen(){zeige('spiel');if(modus!=='kampagne'||!bahn||zust==='won'||bahn!==LV[weiterIndex()]&&st.best[li+1])load(weiterIndex());}
// Spielen-Knopf einer Tagesaufgabe: passende Bahnen oder die passende Spielart
function los(id){const A=AUFG[id];if(A.b){zeige('spiel');if(!startAufgabe(id,0))weiterSpielen();}
  else if(A.los==='tages'){zeige('spiel');if(modus!=='tages'||tagKey!==datum())startTages();}
  else if(A.los==='endlos'){zeige('spiel');if(!lauf)startEndlos();}else weiterSpielen();}
function renderHome(){const d=datum(),tg=st.tag[d],ids=aufgabenFuer(d),a=st.auf[d]||{},fertigN=ids.filter(id=>(a[id]|0)>=AUFG[id].z).length,p=passJetzt(),laeuft=p.mon>=PASS.ab,voll=p.stufe>=PASS.stufen;
  let h='<div class="hkopf"><h1 class="brand">Galaxy <span>Golf</span></h1><div class="hkr">'+(st.login[d]?'':'<button type="button" class="bonuschip" id="h-bonus" aria-label="Tagesbonus abholen">'+GESCHENK+'<i class="punkt" aria-hidden="true"></i></button>')+
    '<button type="button" class="mzbig" id="h-mz" aria-label="Münzen, zum Shop">'+COIN+zahl(muenzen(st))+'</button></div></div>';
  h+='<p class="hallo">'+(konto?'Hallo '+esc(konto.name)+' · '+(syncFehler?'nicht gespeichert: '+esc(syncFehler):syncZeit?'gespeichert':'wird abgeglichen'):server?'Spielstand nur auf diesem Gerät':'Spielstand auf diesem Gerät')+'</p>';
  h+='<button type="button" class="go gross" id="h-weiter">Weiterspielen<small>'+weiterText()+'</small></button>';
  h+='<div class="hrow"><button type="button" id="h-tages">Tagesbahn<small>'+(tg?'<span class="st">'+'★'.repeat(tg.st)+'<i>'+'★'.repeat(3-tg.st)+'</i></span>':'neu heute')+'</small></button><button type="button" id="h-endlos">Endlos<small>Rekord '+st.endl.best+'</small></button></div>';
  h+='<div class="hstatus"><button type="button" id="h-aufg"><span>Aufgaben</span><b>'+fertigN+'<small> von 3</small></b><span class="hbar" aria-hidden="true"><i style="width:'+Math.round(fertigN/3*100)+'%"></i></span></button>'+
    '<button type="button" id="h-pass" class="hpass"><span>Sternenpass</span><b>'+(!laeuft?'ab '+fdk(PASS.ab+'-01'):voll?'Geschafft':'Stufe '+p.stufe)+'</b><span class="hbar" aria-hidden="true"><i style="width:'+(voll?100:laeuft?Math.round((p.xp-p.stufe*PASS.xp)/PASS.xp*100):0)+'%"></i></span></button></div>';
  $('hinhalt').innerHTML=h;
  $('h-weiter').onclick=weiterSpielen;
  $('h-tages').onclick=()=>{zeige('spiel');if(modus!=='tages'||tagKey!==datum())startTages();};
  $('h-endlos').onclick=()=>{zeige('spiel');if(!lauf)startEndlos();};
  $('h-mz').onclick=()=>zeige('shop',offeneEvents().length?'ev':'heute');$('h-aufg').onclick=()=>zeige('aufg','heute');$('h-pass').onclick=()=>zeige('aufg','pass');
  if($('h-bonus'))$('h-bonus').onclick=()=>bonusFenster(true);
  if(!lauf)vorratBauen();}

// ---------- Aufgaben: Heute, Woche, Sternenpass ----------
let aufgTab='heute';
function bonusZeile(){const d=datum();
  if(!st.login[d]){const pos=seriePos(serieLaenge(st,plusTage(d,-1))+1);let dots='';for(let k=1;k<=7;k++)dots+='<i class="'+(k<pos?'ok':k===pos?'jetzt':'')+(k===7?' truhe':'')+'"></i>';
    return'<div class="bonus"><div class="bkopf"><b>Tagesbonus</b><span>Tag '+pos+' von 7'+(pos<7?' · an Tag 7 wartet eine Truhe':'')+'</span></div><div class="bdots" aria-hidden="true">'+dots+'</div>'+
      '<button type="button" class="go" id="a-bonus">'+(pos===7?'Truhe öffnen':'+'+SERIE[pos-1]+' '+COIN+'abholen')+'</button></div>';}
  const l=serieLaenge(st,d),morgen=seriePos(l+1);
  return'<p class="bonusok"><span class="chk" aria-hidden="true"></span><span>Tagesbonus abgeholt · '+l+(l===1?' Tag':' Tage')+' am Stück · morgen '+(morgen===7?'die Truhe':'+'+SERIE[morgen-1]+' '+COIN)+'</span></p>';}
function aufgZeile(ok,t,klein,v,z,knopf){return'<li class="'+(ok?'ok':'')+'"><span class="chk" aria-hidden="true"></span><span class="at"><span class="att">'+esc(t)+(ok?'<span class="sr"> – geschafft</span>':'')+'</span><small>'+klein+'</small>'+
  (z>1&&!ok?'<span class="abar" aria-hidden="true"><i style="width:'+Math.round(v/z*100)+'%"></i></span>':'')+'</span>'+(knopf||'')+'</li>';}
function renderAufg(tab){if(tab)aufgTab=tab;const d=datum(),S=$('sinhalt'),a=st.auf[d]||{},w=wocheVon(d);lokalSetzen('gg-aufg-tag',d);
  let h='<div class="stabs" role="tablist">'+[['heute','Heute'],['woche','Woche'],['pass','Sternenpass']].map(([k,n])=>'<button type="button" role="tab" data-at="'+k+'" aria-selected="'+(aufgTab===k)+'">'+n+'</button>').join('')+'</div>';
  if(aufgTab==='heute'){h+=bonusZeile()+'<section class="aufg" aria-label="Tagesaufgaben"><ul>'+aufgabenFuer(d).map(id=>{const A=AUFG[id],v=Math.min(A.z,a[id]|0),ok=v>=A.z;
      return aufgZeile(ok,A.t,(A.z>1?v+' von '+A.z+' · ':'')+'+'+A.m+' '+COIN+' · +40 XP',v,A.z,ok?'':'<button type="button" class="los" data-los="'+id+'">Spielen</button>');}).join('')+
      '</ul><p class="aufghin">Alle drei geschafft: +30 XP extra. Neue in <span data-bis-ms="'+mitternacht()+'">'+restText(mitternacht())+'</span>.</p></section>';}
  else if(aufgTab==='woche'){h+='<section class="aufg" aria-label="Wochen-Herausforderungen"><ul>';
    if(w<WOCHE_AB)h+='</ul><p class="aufghin">Die ersten Wochen-Herausforderungen starten am Montag, '+fd(WOCHE_AB)+'.</p>';
    else{const s=wochenStand(st,w);h+=wochenAufgaben(w).map(id=>{const A=WAUFG[id],v=Math.min(A.z,s[id]),ok=v>=A.z;return aufgZeile(ok,A.t,v+' von '+A.z+' · +'+WOCHE_MZ+' '+COIN+' · +'+WOCHE_XP+' XP',v,A.z);}).join('')+
      '</ul><p class="aufghin">Neue Herausforderungen in <span data-bis="'+plusTage(w,6)+'">'+restText(plusTage(w,6))+'</span>.</p>';}
    h+='</section>';}
  else h+=passInhalt();
  S.innerHTML=h;muenzAnzeige();passSz=null;
  S.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{aufgTab=b.dataset.at;renderAufg();S.scrollTop=0;});
  S.querySelectorAll('[data-los]').forEach(b=>b.onclick=()=>los(b.dataset.los));
  if($('a-bonus'))$('a-bonus').onclick=bonusHolen;
  S.querySelectorAll('[data-pv]').forEach(c=>vorschau(c,c.dataset.pv));
  if(aufgTab==='pass'){const j=S.querySelector('.stufe.jetzt');if(j)j.scrollIntoView({block:'nearest'});}
  leisteZeigen();}

// ---------- Tagesbonus ----------
// Springt einmal am Tag beim Öffnen auf. „Später“ lässt ihn für heute in Ruhe, abholen geht dann im Reiter Aufgaben oder über das Geschenk oben.
function bonusFenster(gewollt){const d=datum();if(st.login[d]||!$('dialog').hidden||!$('moment').hidden||!$('gross').hidden||ansicht==='spiel')return;
  if(!gewollt&&lokal('gg-bonus-spaeter')===d)return;
  const pos=seriePos(serieLaenge(st,plusTage(d,-1))+1);let t='';
  for(let k=1;k<=7;k++)t+='<li class="'+(k<pos?'ok':k===pos?'jetzt':'')+(k===7?' truhe':'')+'"><span>Tag '+k+'</span><b>'+(k===7?TRUHE_BILD:COIN+SERIE[k-1])+'</b></li>';
  $('dialog').innerHTML='<div class="dkarte bfenster" role="dialog" aria-modal="true" aria-labelledby="b-titel"><span class="blabel">Tagesbonus</span><h3 id="b-titel">'+(pos===7?'Tag 7: die Truhe!':'Tag '+pos+' von 7')+'</h3><ol class="btrack">'+t+'</ol>'+
    '<p>'+(pos===7?'Sieben Tage am Stück. In der Truhe steckt eine seltene oder epische Sache, die du noch nicht hast.':'Schau jeden Tag vorbei, dann wird der Bonus größer. An Tag 7 öffnest du eine Truhe. Lässt du einen Tag aus, geht es bei Tag 1 weiter.')+'</p>'+
    '<div class="row"><button type="button" id="b-spaeter">Später</button><button type="button" class="go" id="b-holen">'+(pos===7?'Truhe öffnen':'+'+SERIE[pos-1]+' '+COIN+'abholen')+'</button></div></div>';
  $('dialog').hidden=false;
  $('b-spaeter').onclick=()=>{lokalSetzen('gg-bonus-spaeter',d);$('dialog').hidden=true;};
  $('b-holen').onclick=()=>{$('dialog').hidden=true;bonusHolen();};$('b-holen').focus({preventScroll:true});}
// Tagesbonus abholen: Münzen, an Tag 7 eine Truhe mit einer seltenen oder epischen Sache, die man noch nicht hat
function bonusHolen(){const d=datum();if(st.login[d])return;const pos=seriePos(serieLaenge(st,plusTage(d,-1))+1);st.login[d]=1;
  if(pos===7){const frei=ITEMS.filter(i=>truheMoeglich(i.id)&&!st.own[i.id]);
    if(frei.length){const i=frei[Math.floor(Math.random()*frei.length)];st.own[i.id]={w:'serie',d};moment({id:i.id,titel:'Truhe geöffnet!',text:'Sieben Tage am Stück. Morgen beginnt die nächste Serie.'});}
    else moment({muenzen:SERIE_TRUHE_MZ,titel:'Truhe geöffnet!',text:'Aus der Truhe hast du schon alles. Dafür gibt es Münzen.'});}
  else moment({muenzen:SERIE[pos-1],titel:'Tag '+pos+' von 7',text:pos===6?'Morgen öffnest du die Truhe mit einer seltenen Sache.':'Komm morgen wieder, dann gibt es mehr.'});
  const ps=passPruefen();persist();sync();aktualisieren();
  if(ps)momentDanach={id:ps,titel:'Sternenpass geschafft!',text:'Alle 30 Stufen. Diese Belohnung gibt es nur in diesem Monat.'};}
let momentDanach=null;
// Countdowns auf der sichtbaren Seite jede Sekunde nachführen
let tickT=0;
function ticken(dt,root){tickT+=dt;if(tickT<1)return;tickT=0;
  root.querySelectorAll('[data-bis]').forEach(p=>p.textContent=(p.dataset.pre||'')+restText(p.dataset.bis));
  root.querySelectorAll('[data-bis-ms]').forEach(p=>p.textContent=(p.dataset.pre||'')+restText(+p.dataset.bisMs));}
// Kleine Kulisse hinter dem Startbildschirm im angelegten Look
let hScene=null;
function homeFrame(dt){ticken(dt,$('hinhalt'));const c=$('hcv'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)||!hScene||hScene.look!==st.eq.o){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
    hScene={look:st.eq.o,bg:buildBg(c.width,c.height,dpr),looks:mkLooks({p:[[0,0,26,4],[0,0,17,2],[0,0,7,1,1,30,1,0],[0,0,13,3]]},7)};}
  const g=c.getContext('2d');mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(hScene.bg,0,0);x.setTransform(dpr,0,0,dpr,0,0);
    const hr=document.querySelector('.hallo'),cr=c.getBoundingClientRect(),hb=hr?hr.getBoundingClientRect():null,cx=w*.5,cy=hb?hb.top-cr.top+30+(hb.height-30)/2:Math.min(h*.22,150),s=Math.min(1.3,w/360,hb?(hb.height-30)/110:1);x.save();x.translate(cx,cy);x.scale(s,s);
    const a1=anim*.25,a2=-anim*.16,p1=[Math.cos(a1)*95,Math.sin(a1)*34,17,2],p2=[Math.cos(a2)*150,Math.sin(a2)*52,13,3],m=[p1[0]+Math.cos(anim*1.4)*30,p1[1]+Math.sin(anim*1.4)*30,7,1],P=[[0,0,26,4],p1,m,p2];
    x.strokeStyle='rgba('+C.star+',.08)';x.lineWidth=1;x.beginPath();x.ellipse(0,0,95,34,0,0,7);x.stroke();x.beginPath();x.ellipse(0,0,150,52,0,0,7);x.stroke();
    const order=[3,1,2,0].sort((i,j)=>P[i][1]-P[j][1]);for(const i of order)drawBody(hScene.looks[i],P[i],P,1);
    x.restore();});}

// ---------- Gemeinsame Bausteine ----------
const RAR=[['gewoehnlich','Gewöhnlich',200],['selten','Selten',400],['episch','Episch',700],['legendaer','Legendär',1e9]];
const RFARBE={basis:'#9aa3c2',gewoehnlich:'#aab3cf',selten:'#4fa3ff',episch:'#b46cff',legendaer:'#ffb238',event:'#ff7a3d',pass:'#5fe0c8',muenzen:'#ffcf4d'};
const FACH={k:'Kugel',s:'Flugspur',l:'Ziel-Loch',o:'Look'};
function seltenheit(id){const i=ITEM[id];if(!i||i.ev||id.startsWith('e-'))return['event','Event'];if(i.pass)return['pass','Sternenpass'];if(!i.p)return['basis','Standard'];const r=RAR.find(r=>i.p<=r[2]);return[r[0],r[1]];}
// Restzeit bis Ende eines Datums (der Tag zählt mit) oder bis zu einem Zeitpunkt in ms
function restText(bis){const end=typeof bis==='number'?bis:new Date(bis+'T00:00:00').getTime()+864e5,ms=end-Date.now();if(ms<=0)return'0 Min';
  const m=Math.floor(ms/6e4),t=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60;return t?t+' T '+h+' Std':h?h+' Std '+mi+' Min':Math.max(1,mi)+' Min';}
function mitternacht(){const d=new Date();d.setHours(24,0,0,0);return d.getTime();}
function fd(d){const[y,m,t]=d.split('-');return t+'.'+m+'.'+y;}
function fdk(d){const[,m,t]=d.split('-');return(+t)+'.'+(+m)+'.';}
function lookSeed(){return modus==='kampagne'?li:modus==='tages'?100000+tagIndex(tagKey):modus==='aufgabe'&&aufg?300000+dnum(aufg.d)%9973*10+aufg.i:lauf?lauf.seed%99991+lauf.n:0;}
function lookAnwenden(){setzeLook(st.eq.o);bg=null;hScene=null;invSz=null;if(bahn)looks=mkLooks(bahn,lookSeed());}
const besitzt=id=>!!st.own[id]||(!!ITEM[id]&&!ITEM[id].p&&!ITEM[id].ev&&!ITEM[id].pass);
function anlegen(id){const i=ITEM[id];st.eq[i.f]=id;if(i.f==='o'){st.auto=null;lookAnwenden();}persist();}
// Abzeichen eines Events: Medaille mit der Sonne des Event-Looks
function abzeichen(c,evId){const e=EVENT[evId],g=c.getContext('2d'),w=c.width,h=c.height;mitLook(e.look||'o-klassisch',()=>mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(buildBg(w,h,w/120),0,0);const k=w/120;x.setTransform(k,0,0,k,0,0);
  x.save();x.translate(60,44);x.fillStyle=C.acc;x.beginPath();x.moveTo(-15,8);x.lineTo(-24,42);x.lineTo(-13,36);x.lineTo(-6,45);x.lineTo(1,12);x.fill();
  x.fillStyle=C.ring;x.beginPath();x.moveTo(15,8);x.lineTo(24,42);x.lineTo(13,36);x.lineTo(6,45);x.lineTo(-1,12);x.fill();
  x.fillStyle='#b8811f';x.beginPath();x.arc(0,0,25,0,7);x.fill();x.fillStyle='#ffd76a';x.beginPath();x.arc(0,0,22,0,7);x.fill();x.restore();
  (LK.sonne==='lantern'?drawLantern:LK.sonne==='neonsun'?drawNeonSun:drawSun)(60,44,12);}));}
// Eine Sache im 120×96-Raster zeichnen, ohne Hintergrund (Vorschau, Großansicht, Kauf-Moment)
function sacheZeichnen(id,gr){const i=ITEM[id];
  if(i.f==='k')drawBall(id,60,48,3.4*(gr||1));
  else if(i.f==='s'){const T=[];for(let n=0;n<34;n++){const f=n/33;T.push([12+f*84,74-Math.sin(f*2.6)*40+f*f*8]);}(SPUREN[id])(T);drawBall(st.eq.k,T[33][0],T[33][1],1.4);}
  else if(i.f==='l'){x.save();x.translate(60,48);x.scale(1.3*(gr||1),1.3*(gr||1));(LOECHER[id])(0,0);x.restore();}
  else{const P=[[30,34,15,4],[86,58,13,2],[86+Math.cos(anim*1.1)*22,58+Math.sin(anim*1.1)*22,5,1],[38,78,9,3]],L=mkLooks({p:[[0,0,15,4],[0,0,13,2],[0,0,5,1,1,26,1,0],[0,0,9,1]]},3);
    P.forEach((p,j)=>drawBody(L[j],p,P,1));lochStandard(96,20);}}
function vorschau(c,id){if(id.startsWith('e-'))return abzeichen(c,id.slice(2));const i=ITEM[id],g=c.getContext('2d'),w=c.width,h=c.height;
  mitLook(i.f==='o'?id:st.eq.o,()=>mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(buildBg(w,h,w/120),0,0);const k=w/120;x.setTransform(k,0,0,k,0,(h-96*k)/2);sacheZeichnen(id);}));}
// Probeflug: Kugel mit Spur an Sonne und Planet vorbei ins Loch, alles im gegebenen Look. z = Zwischenspeicher je Leinwand
function szene(c,eq,z){const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return z;const dpr=Math.min(devicePixelRatio||1,2);
  if(!z||z.w!==w||z.h!==h||z.look!==eq.o){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);z={w,h,look:eq.o};mitLook(eq.o,()=>{z.bg=buildBg(c.width,c.height,dpr);z.L=mkLooks({p:[[0,0,20,4],[0,0,14,2],[0,0,6,1,1,26,1,0]]},11);});}
  mitLook(eq.o,()=>mitCtx(c.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(z.bg,0,0);const k=Math.min(w/320,h/150);
    x.setTransform(dpr*k,0,0,dpr*k,dpr*(w-320*k)/2,dpr*(h-150*k)/2);
    const P=[[84,58,20,4],[196,42,14,2],[196+Math.cos(anim*1.3)*26,42+Math.sin(anim*1.3)*26,6,1]];P.forEach((p,j)=>drawBody(z.L[j],p,P,1));
    (LOECHER[eq.l]||lochStandard)(276,104);
    const dur=2.8,ph=(anim%dur)/dur,A=[26,118],B=[160,150],E=[276,104],pt=f=>{const u=1-f;return[u*u*A[0]+2*u*f*B[0]+f*f*E[0],u*u*A[1]+2*u*f*B[1]+f*f*E[1]];};
    if(ph<.82){const n=ph/.82,T=[];for(let i=0;i<=36;i++)T.push(pt(n*i/36));(SPUREN[eq.s]||SPUREN['s-standard'])(T);const e=T[36];drawBall(eq.k,e[0],e[1],1.6);}
    else drawBall(eq.k,E[0],E[1],1.6*Math.max(0,1-(ph-.82)/.12));}));
  return z;}
// Bühne: Hintergrund im passenden Look, die Sache groß und bewegt davor
function buehne(c,id,z){const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return z;const dpr=Math.min(devicePixelRatio||1,2),i=ITEM[id],look=i.f==='o'?id:st.eq.o;
  if(!z||z.w!==w||z.h!==h||z.look!==look){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);z={w,h,look};mitLook(look,()=>{z.bg=buildBg(c.width,c.height,dpr);});}
  mitLook(look,()=>mitCtx(c.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(z.bg,0,0);const k=Math.min(w/120,h/96);x.setTransform(dpr*k,0,0,dpr*k,dpr*(w-120*k)/2,dpr*(h-96*k)/2);sacheZeichnen(id,1.15);}));
  return z;}

// ---------- Shop ----------
// Wie in großen Spielen: Highlights der Woche, vier tägliche Sachen mit Countdown, dazu Event und Neues. Jede Karte zeigt ihre Seltenheit.
let shopTab='heute';
function kartenInfo(id){const i=ITEM[id],d=datum();
  if(st.eq[i.f]===id)return['an','Angelegt'];if(besitzt(id))return['hat','Im Inventar'];
  if(i.ev){const e=EVENT[i.ev];return imEvent(e,d)?['frei',COIN+'0 Münzen']:['zu','Gab es beim Event '+esc(e.n)];}
  if(i.pass)return['zu','Sternenpass, Stufe 30'];
  if(imShop(id,d)){const p=kaufPreis(id,d);return['kauf',p<i.p?'<s>'+zahl(i.p)+'</s>'+COIN+zahl(p):COIN+zahl(i.p)];}
  return['zu','Gerade nicht im Shop'];}
function marken(id){const d=datum(),s=shopFuer(d),m=[];if(!ITEM[id].p)return m;
  if(s.neu.includes(id))m.push(['neu','Neu']);else if(zurueckNach(id,d))m.push(['zurueck','Zurück']);
  if(s.ang===id&&!besitzt(id))m.push(['rabatt','−25 %']);return m;}
function karte(id,hl){const[k,t]=kartenInfo(id),[r,rn]=seltenheit(id),mk=marken(id);
  return'<button type="button" class="item karte '+k+(hl?' hl':'')+'" data-r="'+r+'" data-id="'+id+'">'+(mk.length?'<span class="marken">'+mk.map(([c,n])=>'<span class="mk '+c+'">'+n+'</span>').join('')+'</span>':'')+
    '<canvas width="240" height="192" aria-hidden="true"></canvas><span class="rar">'+rn+' · '+FACH[ITEM[id].f]+'</span><b>'+esc(ITEM[id].n)+'</b><small>'+t+'</small></button>';}
function shopHeute(){const d=datum(),s=shopFuer(d),so=plusTage(s.bisWoche,-1);let h='';
  if(s.neu.length)h+='<div class="angkopf"><h3>Neu</h3></div><div class="sgrid">'+s.neu.map(id=>karte(id)).join('')+'</div>';
  h+='<div class="angkopf"><h3>Highlights der Woche</h3><span class="evzeit" data-bis="'+so+'" data-pre="Noch ">Noch '+restText(so)+'</span></div><div class="sgrid hlgrid">'+s.woche.map(id=>karte(id,true)).join('')+'</div>';
  h+='<div class="angkopf"><h3>Täglich</h3><span class="evzeit" data-bis-ms="'+mitternacht()+'" data-pre="Neue in ">Neue in '+restText(mitternacht())+'</span></div><div class="sgrid">'+s.tag.map(id=>karte(id)).join('')+'</div>';
  return h+'<p class="evinfo">Jeden Tag kommen vier neue Sachen, jeden Montag zwei neue Highlights. Was gerade fehlt, kommt wieder. Gekauftes bleibt für immer in deinem Inventar.</p>';}
function eventSeite(){const aktiv=EVENTS.filter(e=>imEvent(e,datum()));let h='';
  if(!aktiv.length)h+='<div class="evleer"><b>Gerade läuft kein Event</b><span>Events bringen eigene Looks und Sachen, die es nur in dieser Zeit gibt, jede für 0 Münzen. Schau wieder rein.</span></div>';
  for(const e of aktiv){const L=LOOKS[e.look]||LOOKS['o-klassisch'],fehlt=e.items.filter(id=>!st.own[id]).length,abz=st.own['e-'+e.id];
    h+='<section class="evbanner" style="--ev:'+L.css.acc+';--evring:'+L.css.ring+'" aria-labelledby="evt-'+e.id+'"><canvas class="evcv" data-ev="'+e.id+'" aria-hidden="true"></canvas><div class="evtext">'+
      '<span class="evlabel">'+(fehlt?'Event · je 0 Münzen':'Alles abgeholt')+'</span><h3 id="evt-'+e.id+'" class="evtitel" style="font-family:'+(L.brand||'var(--display)').replace(/"/g,"'")+'">'+esc(e.n)+'</h3><p class="evzeit" data-bis="'+e.bis+'" data-pre="Endet in ">Endet in '+restText(e.bis)+'</p></div></section>';
    h+='<p class="evinfo">'+(fehlt?'Jede Sache kostet 0 Münzen. Tipp sie an und hol sie dir einzeln ab, bis zum '+fd(e.bis)+'. Sie bleiben für immer in deinem Inventar.':'Du hast alles. Es bleibt für immer in deinem Inventar.')+
      (abz?' Abzeichen erhalten am '+fd(abz.d)+'.':' Mit der ersten Sache bekommst du das Abzeichen „'+esc(e.n)+'“.')+'</p>';
    h+='<div class="sgrid">'+e.items.map(id=>karte(id)).join('')+'</div>';}
  const meine=EVENTS.filter(e=>st.own['e-'+e.id]).sort((a,b)=>st.own['e-'+a.id].d.localeCompare(st.own['e-'+b.id].d));
  if(meine.length)h+='<h3 class="sub2">Deine Abzeichen</h3><div class="abzliste">'+meine.map(e=>'<div class="abz"><canvas width="120" height="96" data-abz="'+e.id+'" aria-hidden="true"></canvas><div><b>'+esc(e.n)+'</b><small>erhalten am '+fd(st.own['e-'+e.id].d)+'</small></div></div>').join('')+'</div>';
  return h;}
function renderShop(tab){if(tab)shopTab=tab;const S=$('sinhalt'),offen=offeneEvents().length;lokalSetzen('gg-shop-tag',datum());
  let h='<div class="stabs" role="tablist"><button type="button" role="tab" data-f="heute" aria-selected="'+(shopTab==='heute')+'">Shop</button><button type="button" role="tab" data-f="ev" aria-selected="'+(shopTab==='ev')+'">Event'+(offen?'<i class="punkt" aria-hidden="true"></i><span class="sr"> (neu)</span>':'')+'</button></div>';
  h+=shopTab==='ev'?eventSeite():shopHeute();
  S.innerHTML=h;muenzAnzeige();shopSz={};
  S.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.f;renderShop();S.scrollTop=0;});
  S.querySelectorAll('.karte').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>oeffneGross(b.dataset.id);});
  S.querySelectorAll('[data-abz]').forEach(c=>abzeichen(c,c.dataset.abz));}
// Event-Banner: Szene im Event-Look, Fledermäuse fliegen durch, Countdown läuft mit
let shopSz={};
function shopFrame(dt){ticken(dt,$('sinhalt'));
  $('sinhalt').querySelectorAll('.evcv').forEach(c=>{const e=EVENT[c.dataset.ev],w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);
    let z=shopSz[e.id];if(!z||z.w!==w||z.h!==h){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);mitLook(e.look,()=>{z=shopSz[e.id]={w,h,bg:buildBg(c.width,c.height,dpr),L:mkLooks({p:[[0,0,30,4],[0,0,16,2],[0,0,7,1,1,30,1,0]]},5),fx:[]};});}
    mitLook(e.look,()=>mitCtx(c.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(z.bg,0,0);const k=h/150;x.setTransform(dpr*k,0,0,dpr*k,dpr*(w-360*k),0);
      const P=[[250,78+Math.sin(anim*1.6)*4,30,4],[322,44,16,2],[322+Math.cos(anim*1.2)*30,44+Math.sin(anim*1.2)*30,7,1]];P.forEach((p,j)=>drawBody(z.L[j],p,P,1));
      if(LK.fx==='bats'){if(z.fx.length<2&&Math.random()<dt*.6)z.fx.push({k:'bat',x:380,y:20+Math.random()*90,vx:-(30+Math.random()*25),ph:Math.random()*6,s:.6+Math.random()*.4});
        for(const b of z.fx){b.x+=b.vx*dt;b.ph+=dt*13;}z.fx=z.fx.filter(b=>b.x>-40);const a=fx;fx=z.fx;fxDraw();fx=a;}}));});}

// ---------- Großansicht ----------
// Antippen einer Sache: groß und bewegt im Probeflug, mit Seltenheit, Herkunft, Preis und dem passenden Knopf
let grossId=null,grossSz=null;
function grossEq(id){const eq=Object.assign({},st.eq),i=ITEM[id];eq[i.f]=id;return eq;}
function oeffneGross(id){if(!ITEM[id])return;grossId=id;grossSz=null;renderGross();$('gross').hidden=false;const b=$('gross').querySelector('.go:not([disabled])')||$('g-zu');b.focus({preventScroll:true});}
function schliesseGross(){$('gross').hidden=true;grossId=null;}
function renderGross(){const id=grossId,i=ITEM[id],d=datum(),[r,rn]=seltenheit(id),e=i.ev?EVENT[i.ev]:null,m=muenzen(st);let status='',knopf='';
  if(besitzt(id)){const an=st.eq[i.f]===id,o=st.own[id];status=(an?'Angelegt':'In deinem Inventar')+(o&&o.w==='serie'?' · aus der Truhe':o&&o.w==='pass'?' · aus dem '+esc(passName(i.pass)):e?' · Event '+esc(e.n):'')+'.';
    knopf=an?'<button type="button" disabled>Angelegt</button>':'<button type="button" class="go" data-g="an">Anlegen</button>';}
  else if(e){if(imEvent(e,d)){status='Event '+esc(e.n)+' · noch '+restText(e.bis)+'. Kostet 0 Münzen und bleibt für immer.';knopf='<button type="button" class="go" data-g="holen">Holen · '+COIN+'0</button>';}
    else status='Gab es nur beim Event '+esc(e.n)+'.';}
  else if(i.pass){status='Belohnung auf Stufe 30 im '+esc(passName(i.pass))+'. Nur in diesem Monat zu verdienen.';if(d.slice(0,7)<=i.pass)knopf='<button type="button" class="go" data-g="pass">Zum Sternenpass</button>';}
  else if(imShop(id,d)){const p=kaufPreis(id,d),s=shopFuer(d);
    status=(s.neu.includes(id)?'Neu im Shop':s.woche.includes(id)?'Highlight der Woche · noch '+restText(plusTage(s.bisWoche,-1)):'Heute im Shop · noch '+restText(mitternacht()))+'.'+(p<i.p?' Heute 25 % günstiger.':'');
    if(zurueckNach(id,d))status+=' Nach '+zurueckNach(id,d)+' Tagen wieder da.';
    knopf=m>=p?'<button type="button" class="go" data-g="kauf">Kaufen · '+(p<i.p?'<s>'+zahl(i.p)+'</s> ':'')+COIN+zahl(p)+'</button>':'<button type="button" disabled>Dir fehlen '+COIN+zahl(p-m)+'</button>';
    if(m>=p)status+=' Danach hast du noch '+zahl(m-p)+' Münzen.';}
  else{const w=wiederAm(id,d);status='Gerade nicht im Shop.'+(w?' Kommt voraussichtlich am '+fdk(w)+' wieder.':' Kommt wieder, sobald der Shop wechselt.');}
  $('gross').innerHTML='<div class="gkarte" role="dialog" aria-modal="true" aria-labelledby="g-name" style="--r:'+RFARBE[r]+'"><button type="button" class="gzu" id="g-zu" aria-label="Schließen">×</button>'+
    '<canvas id="g-cv" aria-hidden="true"></canvas><div class="ginfo"><span class="rar">'+rn+' · '+FACH[i.f]+'</span><h3 id="g-name">'+esc(i.n)+'</h3><p>'+status+'</p></div>'+
    '<div class="row"><button type="button" data-g="zu">Zurück</button>'+knopf+'</div></div>';
  grossSz=null;$('g-zu').onclick=schliesseGross;$('gross').onclick=ev=>{if(ev.target===$('gross'))schliesseGross();};
  $('gross').querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>grossAktion(b.dataset.g));}
function grossAktion(a){const id=grossId,i=ITEM[id],d=datum();
  if(a==='zu')return schliesseGross();
  if(a==='an'){anlegen(id);toast(i.n+' angelegt.');renderGross();return aktualisieren();}
  if(a==='pass'){schliesseGross();return zeige('pass');}
  if(a==='kauf'){const p=kaufPreis(id,d);if(!imShop(id,d)||besitzt(id)||muenzen(st)<p)return renderGross();
    st.own[id]={w:'kauf',d};if(p<i.p)st.own[id].p=p;persist();sync();schliesseGross();aktualisieren();moment({id,titel:'Gekauft!'});return;}
  if(a==='holen'){const e=EVENT[i.ev];if(!e||!imEvent(e,d)||st.own[id])return renderGross();st.own[id]={w:'event',d};const neuAbz=!st.own['e-'+e.id];if(neuAbz)st.own['e-'+e.id]={w:'event',d};
    persist();sync();schliesseGross();aktualisieren();moment({id,titel:'Abgeholt!',text:neuAbz?'Dazu kommt das Abzeichen „'+e.n+'“ in deine Sammlung.':'Kostet 0 Münzen und bleibt für immer.',event:e});}}
function grossFrame(){const c=$('g-cv');if(c&&grossId)grossSz=szene(c,grossEq(grossId),grossSz);}

// ---------- Kauf-Moment ----------
// Strahlen in der Farbe der Seltenheit, Funken, die Sache springt groß heraus. Für Kauf, Event, Truhe, Tagesbonus und Sternenpass.
let mo=null;
function moment(o){mo=Object.assign({t:0,funken:[]},o);const id=o.id,i=id&&ITEM[id],[r,rn]=i?seltenheit(id):['muenzen','Tagesbonus'];mo.farbe=RFARBE[r];
  const an=i&&st.eq[i.f]!==id&&besitzt(id);
  $('moment').innerHTML='<canvas id="m-cv" aria-hidden="true"></canvas><div class="minhalt" role="dialog" aria-modal="true" aria-labelledby="m-titel" style="--r:'+mo.farbe+'">'+
    '<span class="mrar">'+(i?rn+' · '+FACH[i.f]:rn)+'</span><canvas id="m-item" aria-hidden="true"></canvas><h2 id="m-titel">'+esc(o.titel)+'</h2><p class="mname">'+(i?esc(i.n):'+'+zahl(o.muenzen)+' Münzen')+'</p>'+(o.text?'<p class="mtext">'+esc(o.text)+'</p>':'')+
    '<div class="row"><button type="button" id="m-weiter"'+(an?'':' class="go"')+'>Weiter</button>'+(an?'<button type="button" class="go" id="m-an">Anlegen</button>':'')+'</div></div>';
  $('moment').hidden=false;if(st.opt.vib&&navigator.vibrate)try{navigator.vibrate([20,40,30]);}catch(e){}
  $('m-weiter').onclick=momentZu;if($('m-an'))$('m-an').onclick=()=>{const e=o.event;
    if(e&&e.look===id){const v=st.eq.o;st.eq.o=id;st.auto={look:id,vorher:v};lookAnwenden();persist();toast(i.n+' angelegt. Nach dem Event kommt dein alter Look zurück.');}else{anlegen(id);toast(i.n+' angelegt.');}
    momentZu();aktualisieren();};
  ($('m-an')||$('m-weiter')).focus({preventScroll:true});}
function momentZu(){$('moment').hidden=true;mo=null;if(momentDanach){const n=momentDanach;momentDanach=null;setTimeout(()=>moment(n),250);}}
function muenzeZeichnen(cx,cy,R,t){const sx=Math.abs(Math.cos(t*2.2))*.85+.15;x.save();x.translate(cx,cy);x.scale(sx,1);
  x.fillStyle='#c9962a';x.beginPath();x.arc(0,R*.06,R,0,7);x.fill();x.fillStyle='#ffcf4d';x.beginPath();x.arc(0,0,R,0,7);x.fill();
  x.strokeStyle='#c9962a';x.lineWidth=R*.12;x.beginPath();x.arc(0,0,R*.72,0,7);x.stroke();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-R*.3,-R*.35,R*.22,R*.12,-.6,0,7);x.fill();x.restore();}
function momentFrame(dt){if(!mo)return;mo.t+=dt;const t=mo.t,c=$('m-cv'),w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio||1,2),still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(c.width!==Math.round(w*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  const it=$('m-item'),iw=it.clientWidth,ih=it.clientHeight;if(it.width!==Math.round(iw*dpr)){it.width=Math.round(iw*dpr);it.height=Math.round(ih*dpr);}
  const ib=it.getBoundingClientRect(),cx=ib.left+iw/2,cy=ib.top+ih/2;
  mitCtx(c.getContext('2d'),()=>{x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);const auf=Math.min(1,t/.5);
    if(!still){x.save();x.translate(cx,cy);x.rotate(t*.35);const L=Math.hypot(w,h);for(let k=0;k<12;k++){x.rotate(Math.PI/6);x.fillStyle=rgba(mo.farbe,.13*auf);x.beginPath();x.moveTo(0,0);x.lineTo(L,-L*.12);x.lineTo(L,L*.12);x.closePath();x.fill();}x.restore();}
    const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.45);g.addColorStop(0,rgba(mo.farbe,.4*auf));g.addColorStop(1,rgba(mo.farbe,0));x.fillStyle=g;x.fillRect(0,0,w,h);
    if(!still&&t<.6&&mo.funken.length<70)for(let k=0;k<6;k++){const a=Math.random()*6.283,v=120+Math.random()*320;mo.funken.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,s:1.5+Math.random()*2.5,c:Math.random()<.5?mo.farbe:'#ffffff'});}
    for(const f of mo.funken){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.97;f.vy=f.vy*.97+60*dt;f.l-=dt*.8;if(f.l>0){x.globalAlpha=f.l;x.fillStyle=f.c;x.beginPath();x.arc(f.x,f.y,f.s,0,7);x.fill();}}x.globalAlpha=1;
    mo.funken=mo.funken.filter(f=>f.l>0);});
  mitCtx(it.getContext('2d'),()=>{x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,it.width,it.height);
    if(mo.id){const i=ITEM[mo.id],k=Math.min(it.width/120,it.height/96);mitLook(i.f==='o'?mo.id:st.eq.o,()=>{x.setTransform(k,0,0,k,(it.width-120*k)/2,(it.height-96*k)/2);sacheZeichnen(mo.id,1.25);});}
    else{x.setTransform(dpr,0,0,dpr,0,0);muenzeZeichnen(iw/2,ih/2,Math.min(iw,ih)*.3,still?0:t);}});}

// ---------- Inventar ----------
// Vier Plätze wie ein Spind: Platz antippen, dann aus den eigenen Sachen wählen. Oben fliegt die Ausrüstung zur Probe.
// Neu bekommene Sachen tragen eine Marke, bis man sie im Inventar gesehen hat (nur auf diesem Gerät).
let invFach='k',invSz=null,gesehen=null;
try{const g=localStorage.getItem('gg-gesehen');gesehen=new Set(g?JSON.parse(g):Object.keys(st.own));if(!g)localStorage.setItem('gg-gesehen',JSON.stringify([...gesehen]));}catch(e){gesehen=new Set(Object.keys(st.own));}
const ungesehen=f=>ITEMS.filter(i=>(!f||i.f===f)&&(i.p||i.ev||i.pass)&&st.own[i.id]&&!gesehen.has(i.id)).map(i=>i.id);
function gesehenMerken(ids){ids.forEach(id=>gesehen.add(id));try{localStorage.setItem('gg-gesehen',JSON.stringify([...gesehen]));}catch(e){}}
function herkunft(id){const i=ITEM[id],o=st.own[id];return i.ev?EVENT[i.ev].n:i.pass?passName(i.pass):o&&o.w==='serie'?'Aus der Truhe':o&&(o.w==='geschenk'||o.w==='code')?'Geschenk':'';}
function renderInv(f){if(f)invFach=f;const d=datum(),alle=ITEMS.filter(i=>i.f===invFach),mein=alle.filter(i=>besitzt(i.id)),neu=ungesehen(invFach),
    imShopHeute=alle.filter(i=>!besitzt(i.id)&&imShop(i.id,d)).length,fehlt=alle.length-mein.length,name=FAECHER.find(x=>x[0]===invFach)[1];
  let h='<canvas class="invbild" id="invcv" role="img" aria-label="Vorschau: '+esc(FAECHER.map(([f])=>ITEM[st.eq[f]].n).join(', '))+'"></canvas><div class="slots" role="tablist" aria-label="Plätze">';
  for(const[f,n]of FAECHER)h+='<button type="button" role="tab" class="slot" data-slot="'+f+'" aria-selected="'+(f===invFach)+'"><canvas width="240" height="192" aria-hidden="true"></canvas><span>'+n+(ungesehen(f).length?'<i class="punkt" aria-hidden="true"></i>':'')+'</span><b>'+esc(ITEM[st.eq[f]].n)+'</b></button>';
  h+='</div><h3 class="sub2">'+name+' wählen <small>'+mein.length+' von '+alle.length+'</small></h3><div class="sgrid">';
  for(const i of mein){const an=st.eq[invFach]===i.id,[r]=seltenheit(i.id),hk=herkunft(i.id);
    h+='<button type="button" class="item karte '+(an?'an':'hat')+'" data-r="'+r+'" data-id="'+i.id+'" aria-pressed="'+an+'">'+(neu.includes(i.id)?'<span class="marken"><span class="mk neu">Neu</span></span>':'')+'<canvas width="240" height="192" aria-hidden="true"></canvas><b>'+esc(i.n)+'</b><small>'+(an?'Angelegt':esc(hk))+'</small></button>';}
  if(fehlt)h+='<button type="button" class="item mehr" id="inv-shop"><span class="mehrbild" aria-hidden="true">+</span><b>Mehr im Shop</b><small>'+(imShopHeute?imShopHeute+' heute im Shop':fehlt+' kommen wieder')+'</small></button>';
  $('sinhalt').innerHTML=h+'</div>';muenzAnzeige();invSz=null;
  $('sinhalt').querySelectorAll('.slot').forEach(b=>{vorschau(b.querySelector('canvas'),st.eq[b.dataset.slot]);b.onclick=()=>{invFach=b.dataset.slot;renderInv();};});
  $('sinhalt').querySelectorAll('.item[data-id]').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>{const id=b.dataset.id;if(st.eq[invFach]!==id){anlegen(id);toast(ITEM[id].n+' angelegt.');renderInv();}else oeffneGross(id);};});
  if($('inv-shop'))$('inv-shop').onclick=()=>zeige('shop','heute');
  gesehenMerken(neu);if(ansicht==='inv')leisteZeigen();}
function invFrame(){const c=$('invcv');if(c)invSz=szene(c,st.eq,invSz);}

// ---------- Sternenpass ----------
let passSz=null;
function passInhalt(){const p=passJetzt(),laeuft=p.mon>=PASS.ab,mon=laeuft?p.mon:PASS.ab,P=PAESSE[mon],stufe=laeuft?p.stufe:0,rest=laeuft?p.xp-stufe*PASS.xp:0,ende=monatTage(mon).slice(-1)[0],voll=stufe>=PASS.stufen;
  let h='<section class="passkopf">'+(P?'<canvas id="pass-cv" aria-hidden="true"></canvas>':'')+'<div class="pkinfo"><span class="evlabel">'+(laeuft?'Läuft · noch '+restText(ende):plusTage(datum(),1)===mon+'-01'?'Startet morgen':'Startet am '+fd(mon+'-01'))+'</span><h3>'+esc(passName(mon))+'</h3>'+
    '<p>'+(P?'Auf Stufe 30 wartet <b>'+esc(ITEM[P.item].n)+'</b>. Es gibt sie nur in diesem Monat.':'Auf Stufe 30 warten '+zahl(passMz(30)+PASS.ohneSache)+' Münzen.')+' Auf jeder Stufe gibt es Münzen.</p></div></section>';
  h+='<div class="pfort"><b>Stufe '+stufe+'<small> von '+PASS.stufen+'</small></b><span>'+(voll?'Geschafft':rest+' / '+PASS.xp+' XP')+'</span></div><div class="pbalken" role="progressbar" aria-valuemin="0" aria-valuemax="'+PASS.stufen+'" aria-valuenow="'+stufe+'"><i style="width:'+(voll?100:Math.round(rest/PASS.xp*100))+'%"></i></div>';
  h+='<div class="stufen">'+Array.from({length:PASS.stufen},(_,k)=>{const n=k+1,ok=n<=stufe,jetzt=n===stufe+1&&laeuft;
    return'<div class="stufe'+(ok?' ok':'')+(jetzt?' jetzt':'')+(n===PASS.stufen?' ende':n%5===0?' fuenf':'')+'"><span>'+n+'</span>'+(n===PASS.stufen&&P?'<canvas width="120" height="96" data-pv="'+P.item+'" aria-label="'+esc(ITEM[P.item].n)+'"></canvas>':'<b>'+COIN+(n===PASS.stufen&&!P?passMz(n)+PASS.ohneSache:passMz(n))+'</b>')+'</div>';}).join('')+'</div>';
  h+='<section class="grp"><h3>So sammelst du XP</h3><ul class="xpliste"><li><span>Jede geschaffte Bahn</span><b>5 XP + 5 je Stern</b></li><li><span>Bahnen pro Tag höchstens</span><b>250 XP</b></li><li><span>Tagesaufgabe</span><b>40 XP</b></li><li><span>Alle drei Tagesaufgaben</span><b>+30 XP</b></li><li><span>Tagesbonus</span><b>20 XP</b></li><li><span>Wochen-Herausforderung</span><b>100 XP</b></li></ul>'+
    '<p>Münzen bekommst du, sobald du eine Stufe erreichst. Jeden Monat beginnt ein neuer Pass bei Stufe 0, mit einer neuen Belohnung auf Stufe 30.</p></section>';
  return h;}
function passFrame(){const c=$('pass-cv'),P=PAESSE[datum().slice(0,7)>=PASS.ab?datum().slice(0,7):PASS.ab];if(c&&P)passSz=buehne(c,P.item,passSz);}

// ---------- Rangliste ----------
let rang=null,rangTab=0,rangFehler='';
async function rangLaden(){rangFehler='';try{await sync();rang=await api('/api/rangliste');}catch(e){rangFehler=e.message;}if(ansicht==='rang')renderRang(true);}
function renderRang(geladen){const S=$('sinhalt');muenzAnzeige();
  if(!konto){S.innerHTML='<div class="evleer"><b>Rangliste unter Freunden</b><span>Hier siehst du, wer die Tagesbahn mit den wenigsten Schlägen geschafft hat. Dafür brauchst du ein Konto mit Name und PIN.</span></div>'+
      (server?'<button type="button" class="go gross" id="r-konto">Konto anlegen oder anmelden</button>':'<p class="evinfo">Die Rangliste gibt es nur in der App von deinem Server.</p>');
    if($('r-konto'))$('r-konto').onclick=()=>zeige('konto');return;}
  if(!geladen){S.innerHTML='<p class="leer">Lädt …</p>';rangLaden();return;}
  if(rangFehler||!rang){S.innerHTML='<p class="leer">'+esc(rangFehler||'Keine Daten.')+'</p><button type="button" id="r-neu">Nochmal versuchen</button>';$('r-neu').onclick=()=>renderRang();return;}
  const T=rang.tage[rangTab]||rang.tage[0],L=T.liste,heute=rangTab===0;
  let h='<div class="stabs" role="tablist"><button type="button" role="tab" data-rt="0" aria-selected="'+heute+'">Heute</button><button type="button" role="tab" data-rt="1" aria-selected="'+!heute+'">Gestern</button></div>';
  h+='<p class="evinfo">Tagesbahn vom '+fd(T.tag)+': wenigste Schläge zuerst, bei Gleichstand mehr Sterne.'+(heute?' Läuft noch '+restText(mitternacht())+'.':'')+'</p>';
  if(!L.length)h+='<div class="evleer"><b>'+(heute?'Noch niemand dabei':'Gestern hat niemand mitgemacht')+'</b><span>'+(heute?'Sei heute die oder der Erste.':'Heute ist eine neue Chance.')+'</span></div>';
  else h+='<ol class="rliste">'+L.map(e=>{const platz=1+L.filter(o=>o.s<e.s||o.s===e.s&&o.st>e.st).length;
    return'<li class="'+(e.ich?'ich':'')+(platz<=3?' p'+platz:'')+'"><span class="rplatz">'+platz+'</span><span class="rname">'+esc(e.name)+(e.ich?' <small>(du)</small>':'')+'</span><span class="rst">'+'★'.repeat(e.st)+'<i>'+'★'.repeat(3-e.st)+'</i></span><b>'+e.s+'<small> '+(e.s===1?'Schlag':'Schläge')+'</small></b></li>';}).join('')+'</ol>';
  if(heute&&!st.tag[datum()])h+='<button type="button" class="go gross" id="r-spiel">Tagesbahn spielen</button>';
  else if(heute)h+='<button type="button" id="r-spiel">Nochmal versuchen und verbessern</button>';
  S.innerHTML=h;S.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{rangTab=+b.dataset.rt;renderRang(true);});
  if($('r-spiel'))$('r-spiel').onclick=()=>{zeige('spiel');if(modus!=='tages'||tagKey!==datum())startTages();};}

// ---------- Einstellungen ----------
function profil(){const evs=EVENTS.filter(e=>st.own['e-'+e.id]).sort((a,b)=>st.own['e-'+a.id].d.localeCompare(st.own['e-'+b.id].d)),best=Object.values(st.best);
  return'<section class="grp"><h3>Profil</h3>'+(evs.length?'<div class="dabei"><canvas width="120" height="96" data-abz="'+evs[0].id+'" aria-hidden="true"></canvas><span>Dabei seit <b>'+esc(evs[0].n)+'</b></span></div>':'')+
    '<dl class="werte"><div><dt>Sterne</dt><dd>'+zahl(totalStars())+' <small>von '+zahl(N*3)+'</small></dd></div><div><dt>Bahnen</dt><dd>'+best.length+' <small>von '+N+'</small></dd></div>'+
    '<div><dt>Asse</dt><dd>'+best.filter(b=>b.a).length+'</dd></div><div><dt>Tagesbahnen</dt><dd>'+Object.keys(st.tag).length+'</dd></div><div><dt>Endlos-Rekord</dt><dd>'+st.endl.best+'</dd></div>'+
    '<div><dt>Sachen</dt><dd>'+ITEMS.filter(i=>(i.p||i.ev||i.pass)&&st.own[i.id]).length+' <small>von '+ITEMS.filter(i=>i.p||i.ev||i.pass).length+'</small></dd></div>'+
    '<div><dt>Tagesbonus-Serie</dt><dd>'+serieLaenge(st,st.login[datum()]?datum():plusTage(datum(),-1))+' <small>Tage</small></dd></div>'+
    '<div><dt>Sternenpass</dt><dd>'+(datum().slice(0,7)>=PASS.ab?'Stufe '+passJetzt().stufe:'–')+'</dd></div></dl></section>';}
const POKAL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3M8.5 20h7M9.5 17h5v3h-5z"/></svg>';
function renderEinst(){let h='<button type="button" class="mzeile" id="e-rang">'+POKAL+'<span><b>Rangliste</b><small>Wer schafft die Tagesbahn mit den wenigsten Schlägen?</small></span><i aria-hidden="true">›</i></button><section class="grp"><h3>Konto</h3>';
  if(konto)h+='<p>Angemeldet als <b>'+esc(konto.name)+'</b>. '+(syncFehler?'Letzter Abgleich ging schief: '+esc(syncFehler):syncZeit?'Zuletzt gespeichert um '+new Date(syncZeit).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+'.':'')+'</p><div class="row"><button type="button" id="e-sync">Jetzt speichern</button><button type="button" id="e-ab">Abmelden</button></div>';
  else if(server)h+='<p>Ohne Konto liegt dein Spielstand nur auf diesem Gerät. Mit Name und PIN holst du ihn auf jedes Handy.</p><div class="row"><button type="button" class="go" id="e-konto">Konto anlegen oder anmelden</button></div>';
  else h+='<p>Kein Spiel-Server erreichbar. Konten und Geschenk-Codes gehen nur in der App, die du von deinem Server installierst.</p>';
  h+='</section>'+profil()+'<section class="grp"><h3>Spiel</h3>'+[['ringe','Schwerkraft-Ringe anzeigen'],['vorschau','Flugbahn beim Zielen anzeigen'],['vib','Vibrieren beim Einlochen']].filter(([k])=>k!=='vib'||navigator.vibrate)
    .map(([k,t])=>'<label class="schalter" for="o-'+k+'"><span>'+t+'</span><input type="checkbox" role="switch" id="o-'+k+'" data-o="'+k+'"'+(st.opt[k]?' checked':'')+'></label>').join('')+'</section>';
  h+='<section class="grp"><h3>Code einlösen</h3><form id="e-cform" class="row"><label class="sr" for="e-code">Geschenk-Code</label><input id="e-code" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Geschenk-Code"'+(server?'':' disabled')+'><button type="submit" class="go"'+(server?'':' disabled')+'>Einlösen</button></form><p class="hinweis" id="e-cmsg" role="status"></p></section>';
  h+='<section class="grp"><h3>Über</h3><p>Galaxy Golf · '+N+' Bahnen in fünf Stufen, jeden Tag eine Tagesbahn, Aufgaben, Sternenpass und der Endlos-Modus. Weltraum-Minigolf mit echter Schwerkraft.</p></section>';
  $('sinhalt').innerHTML=h;muenzAnzeige();$('sinhalt').querySelectorAll('[data-abz]').forEach(c=>abzeichen(c,c.dataset.abz));
  if($('e-konto'))$('e-konto').onclick=()=>zeige('konto');$('e-rang').onclick=()=>zeige('rang');
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
function chips(name,ausser){const alle=[...EVENTS.map(e=>({id:'e-'+e.id,n:'Event '+e.n})),...ITEMS.filter(i=>i.p||i.ev||i.pass)];
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
  size();zeige('home');requestAnimationFrame(frame);
  if(ev.vorbei)setTimeout(()=>toast(ev.vorbei+' ist vorbei. Im Inventar kannst du den Look wieder anlegen.'),500);
  setTimeout(()=>bonusFenster(),700);
  addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{bonusFenster();if(ansicht!=='spiel')leisteZeigen();},500);});
  serverPruefen().then(ok=>{if(ok&&konto)sync();else aktualisieren();});})();
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('moment').hidden){momentZu();return;}if(!$('gross').hidden){schliesseGross();return;}if(!$('dialog').hidden){if($('b-spaeter'))$('b-spaeter').click();else $('dialog').hidden=true;return;}if(ansicht!=='spiel'&&ansicht!=='home'){e.preventDefault();$('zur').click();}});
