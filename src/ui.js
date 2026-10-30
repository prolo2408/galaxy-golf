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
  const T={inv:'Inventar',shop:'Shop',samml:'Sammlung',einst:'Einstellungen',konto:'Konto',admin:'Admin'};$('stitel').textContent=T[a];
  $('sinhalt').scrollTop=0;({inv:renderInv,shop:renderShop,samml:renderSammlung,einst:renderEinst,konto:renderKonto,admin:renderAdmin})[a](arg);}
$('zur').onclick=()=>zeige(stapel.pop()||'home',undefined,true);
function muenzAnzeige(){$('smz').innerHTML=COIN+zahl(muenzen(st));}
function aktualisieren(){muenzAnzeige();if(ansicht==='home')renderHome();else if(ansicht==='einst'&&!$('e-code')?.value&&document.activeElement?.tagName!=='INPUT')renderEinst();else if(ansicht==='shop')renderShop();else if(ansicht==='inv')renderInv();else if(ansicht==='samml')renderSammlung();}
let toastT;function toast(s){const t=$('toast');t.textContent=s;t.hidden=false;t.classList.add('an');clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove('an');},3200);}
function fragen(titel,text,ja,fn){const d=$('dialog');d.innerHTML='<div class="dkarte" role="dialog" aria-modal="true" aria-labelledby="dtitel"><h3 id="dtitel">'+titel+'</h3><p>'+text+'</p><div class="row"><button type="button" id="dnein">Abbrechen</button><button type="button" class="go" id="dja">'+ja+'</button></div></div>';
  d.hidden=false;$('dnein').onclick=()=>d.hidden=true;$('dja').onclick=()=>{d.hidden=true;fn();};$('dja').focus();}

// ---------- Startbildschirm ----------
let hinweis=null;
// Weiterspielen: die aktuelle Bahn, oder wenn sie geschafft ist, die erste offene Bahn
function weiterIndex(){const c=Math.min(st.cur,st.un-1);if(!st.best[c+1])return c;for(let i=0;i<st.un;i++)if(!st.best[i+1])return i;return c;}
function weiterText(){const i=weiterIndex();return'Bahn '+(i+1)+' · '+TIERS[LV[i].t];}
function renderHome(){const d=datum(),tg=st.tag[d],a=st.auf[d]||{},ids=aufgabenFuer(d);
  let h='<div class="hkopf"><h1 class="brand">Galaxy <span>Golf</span></h1><button type="button" class="mzbig" id="h-mz" aria-label="Münzen, zum Shop">'+COIN+zahl(muenzen(st))+'</button></div>';
  h+='<p class="hallo">'+(konto?'Hallo '+esc(konto.name)+' · '+(syncFehler?'nicht gespeichert: '+esc(syncFehler):syncZeit?'gespeichert':'wird abgeglichen'):server?'Spielstand nur auf diesem Gerät':'Spielstand auf diesem Gerät')+'</p>';
  if(hinweis)h+='<div class="notiz"><b>'+esc(hinweis.t)+'</b><span>'+esc(hinweis.p)+'</span><button type="button" id="h-ok">Schön</button></div>';
  else if(!konto&&server&&!localStorage.getItem('gg-willkommen'))h+='<div class="notiz"><b>Spielstand sichern</b><span>Mit Name und PIN liegt dein Fortschritt auf dem Server, du kannst ihn auf jedes Handy holen und Geschenk-Codes einlösen.</span><div class="row"><button type="button" id="h-spaeter">Später</button><button type="button" class="go" id="h-konto">Konto anlegen</button></div></div>';
  h+='<button type="button" class="go gross" id="h-weiter">Weiterspielen<small>'+weiterText()+'</small></button>';
  h+='<div class="hrow"><button type="button" id="h-tages">Tagesbahn<small>'+(tg?'<span class="st">'+'★'.repeat(tg.st)+'<i>'+'★'.repeat(3-tg.st)+'</i></span>':'neu heute')+'</small></button><button type="button" id="h-endlos">Endlos<small>Rekord '+st.endl.best+'</small></button></div>';
  h+='<section class="aufg" aria-labelledby="aufg-h"><h2 id="aufg-h">Tagesaufgaben</h2><ul>'+ids.map(id=>{const A=AUFG[id],v=Math.min(A.z,a[id]|0),ok=v>=A.z;
    return'<li class="'+(ok?'ok':'')+'"><span class="chk" aria-hidden="true"></span><span class="at">'+esc(A.t)+(ok?'<span class="sr"> – geschafft</span>':'')+'</span><span class="ap">'+(A.z>1?v+'/'+A.z:'')+'</span><span class="am">+'+A.m+'</span></li>';}).join('')+'</ul></section>';
  h+='<nav class="hnav"><button type="button" id="h-inv">Inventar</button><button type="button" id="h-shop">Shop</button><button type="button" id="h-samml">Sammlung</button><button type="button" id="h-einst">Einstellungen</button></nav>';
  $('hinhalt').innerHTML=h;
  $('h-weiter').onclick=()=>{zeige('spiel');if(modus!=='kampagne'||!bahn||zust==='won'||bahn!==LV[weiterIndex()]&&st.best[li+1])load(weiterIndex());};
  $('h-tages').onclick=()=>{zeige('spiel');if(modus!=='tages'||tagKey!==datum())startTages();};
  $('h-endlos').onclick=()=>{zeige('spiel');if(!lauf)startEndlos();};
  $('h-shop').onclick=$('h-mz').onclick=()=>zeige('shop');$('h-samml').onclick=()=>zeige('samml');$('h-inv').onclick=()=>zeige('inv');$('h-einst').onclick=()=>zeige('einst');
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
let shopFach='k';
function vorschau(c,id){const i=ITEM[id],g=c.getContext('2d'),w=c.width,h=c.height;
  const lookId=i.f==='o'?id:st.eq.o;mitLook(lookId,()=>mitCtx(g,()=>{x.setTransform(1,0,0,1,0,0);x.drawImage(buildBg(w,h,w/120),0,0);const k=w/120;x.setTransform(k,0,0,k,0,0);
    if(i.f==='k')drawBall(id,60,48,3.4);
    else if(i.f==='s'){const T=[];for(let n=0;n<34;n++){const f=n/33;T.push([12+f*84,74-Math.sin(f*2.6)*40+f*f*8]);}(SPUREN[id])(T);drawBall(st.eq.k,T[33][0],T[33][1],1.4);}
    else if(i.f==='l'){x.translate(60,48);x.scale(1.3,1.3);(LOECHER[id])(0,0);}
    else{const P=[[30,34,15,4],[86,58,13,2],[86+22,58-14,5,1],[38,78,9,3]],L=mkLooks({p:[[0,0,15,4],[0,0,13,2],[0,0,5,1,1,26,1,0],[0,0,9,1]]},3);
      P.forEach((p,j)=>drawBody(L[j],p,P,1));lochStandard(96,20);}}));}
const besitzt=id=>!!st.own[id]||(!ITEM[id].p&&!ITEM[id].ev);
function status(id){const i=ITEM[id];if(st.eq[i.f]===id)return['an','Angelegt'];if(besitzt(id))return['hat','Im Inventar'];
  if(i.ev)return['zu','Nur beim Event '+EVENT[i.ev].n];return['kauf',COIN+zahl(i.p)];}
function renderShop(){const m=muenzen(st);
  let h='<div class="tabs4" role="tablist">'+FAECHER.map(([f,n])=>'<button type="button" role="tab" data-f="'+f+'" aria-selected="'+(f===shopFach)+'">'+n+'</button>').join('')+'</div><div class="sgrid">';
  for(const i of ITEMS){if(i.f!==shopFach)continue;const[k,s]=status(i.id);h+='<button type="button" class="item '+k+'" data-id="'+i.id+'"><canvas width="240" height="192" aria-hidden="true"></canvas><b>'+esc(i.n)+'</b><small>'+s+'</small></button>';}
  $('sinhalt').innerHTML=h+'</div>';muenzAnzeige();
  $('sinhalt').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{shopFach=b.dataset.f;renderShop();});
  $('sinhalt').querySelectorAll('.item').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>shopKlick(b.dataset.id,m);});}
function anlegen(id){const i=ITEM[id];st.eq[i.f]=id;if(i.f==='o'){st.auto=null;setzeLook(id);bg=null;hScene=null;if(bahn)looks=mkLooks(bahn,modus==='kampagne'?li:modus==='tages'?100000+tagIndex(tagKey):lauf?lauf.seed%99991+lauf.n:0);}persist();}
function shopKlick(id,m){const i=ITEM[id],[k]=status(id);
  if(k==='an'||k==='hat')return zeige('inv',i.f);
  if(k==='zu')return toast(i.n+' gibt es nur beim Event '+EVENT[i.ev].n+'.');
  if(m<i.p)return toast('Dir fehlen noch '+zahl(i.p-m)+' Münzen für '+i.n+'.');
  fragen(esc(i.n)+' kaufen?','Kostet '+zahl(i.p)+' Münzen. Danach hast du noch '+zahl(m-i.p)+'.','Kaufen',()=>{st.own[id]={w:'kauf',d:datum()};anlegen(id);toast(i.n+' gekauft und angelegt.');renderShop();sync();});}

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

// ---------- Sammlung ----------
function fd(d){const[y,m,t]=d.split('-');return t+'.'+m+'.'+y;}
function renderSammlung(){const evs=EVENTS.filter(e=>st.own['e-'+e.id]).sort((a,b)=>st.own['e-'+a.id].d.localeCompare(st.own['e-'+b.id].d));
  let h='';if(evs.length)h+='<div class="dabei">Dabei seit <b>'+esc(evs[0].n)+'</b></div>';
  h+='<h3 class="sub2">Events</h3>';
  if(!evs.length)h+='<p class="leer">Noch kein Event. Wer während eines Events spielt, bekommt ein Abzeichen und die Event-Sachen für immer.</p>';
  for(const e of evs){h+='<div class="evkarte"><div class="evkopf"><b>'+esc(e.n)+'</b><small>erhalten am '+fd(st.own['e-'+e.id].d)+(imEvent(e,datum())?' · läuft noch bis '+fd(e.bis):'')+'</small></div><div class="evitems">';
    for(const id of e.items){const[k,s]=status(id);h+='<button type="button" class="item '+k+'" data-id="'+id+'"><canvas width="240" height="192" aria-hidden="true"></canvas><b>'+esc(ITEM[id].n)+'</b><small>'+s+'</small></button>';}
    h+='</div><button type="button" class="go" data-alle="'+e.id+'">Alles anlegen</button></div>';}
  const best=Object.values(st.best),ass=best.filter(b=>b.a).length,tage=Object.keys(st.tag).length;
  h+='<h3 class="sub2">Bisher</h3><dl class="werte"><div><dt>Sterne</dt><dd>'+zahl(totalStars())+' <small>von '+zahl(N*3)+'</small></dd></div><div><dt>Bahnen</dt><dd>'+best.length+' <small>von '+N+'</small></dd></div>'+
    '<div><dt>Asse</dt><dd>'+ass+'</dd></div><div><dt>Tagesbahnen</dt><dd>'+tage+'</dd></div><div><dt>Endlos-Rekord</dt><dd>'+st.endl.best+'</dd></div><div><dt>Sachen</dt><dd>'+Object.keys(st.own).filter(id=>ITEM[id]).length+' <small>von '+ITEMS.filter(i=>i.p||i.ev).length+'</small></dd></div></dl>';
  $('sinhalt').innerHTML=h;muenzAnzeige();
  $('sinhalt').querySelectorAll('.item').forEach(b=>{vorschau(b.querySelector('canvas'),b.dataset.id);b.onclick=()=>zeige('inv',ITEM[b.dataset.id].f);});
  $('sinhalt').querySelectorAll('[data-alle]').forEach(b=>b.onclick=()=>{for(const id of EVENT[b.dataset.alle].items)anlegen(id);toast(EVENT[b.dataset.alle].n+' angelegt.');renderSammlung();});}

// ---------- Einstellungen ----------
function renderEinst(){let h='<section class="grp"><h3>Konto</h3>';
  if(konto)h+='<p>Angemeldet als <b>'+esc(konto.name)+'</b>. '+(syncFehler?'Letzter Abgleich ging schief: '+esc(syncFehler):syncZeit?'Zuletzt gespeichert um '+new Date(syncZeit).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+'.':'')+'</p><div class="row"><button type="button" id="e-sync">Jetzt speichern</button><button type="button" id="e-ab">Abmelden</button></div>';
  else if(server)h+='<p>Ohne Konto liegt dein Spielstand nur auf diesem Gerät. Mit Name und PIN holst du ihn auf jedes Handy.</p><div class="row"><button type="button" class="go" id="e-konto">Konto anlegen oder anmelden</button></div>';
  else h+='<p>Kein Spiel-Server erreichbar. Konten und Geschenk-Codes gehen nur in der App, die du von deinem Server installierst.</p>';
  h+='</section><section class="grp"><h3>Spiel</h3>'+[['ringe','Schwerkraft-Ringe anzeigen'],['vorschau','Flugbahn beim Zielen anzeigen'],['vib','Vibrieren beim Einlochen']].filter(([k])=>k!=='vib'||navigator.vibrate)
    .map(([k,t])=>'<label class="schalter" for="o-'+k+'"><span>'+t+'</span><input type="checkbox" role="switch" id="o-'+k+'" data-o="'+k+'"'+(st.opt[k]?' checked':'')+'></label>').join('')+'</section>';
  h+='<section class="grp"><h3>Code einlösen</h3><form id="e-cform" class="row"><label class="sr" for="e-code">Geschenk-Code</label><input id="e-code" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Geschenk-Code"'+(server?'':' disabled')+'><button type="submit" class="go"'+(server?'':' disabled')+'>Einlösen</button></form><p class="hinweis" id="e-cmsg" role="status"></p></section>';
  h+='<section class="grp"><h3>Über</h3><p>Galaxy Golf · '+N+' Bahnen in fünf Stufen, jeden Tag eine Tagesbahn und der Endlos-Modus. Weltraum-Minigolf mit echter Schwerkraft.</p></section>';
  $('sinhalt').innerHTML=h;muenzAnzeige();
  if($('e-konto'))$('e-konto').onclick=()=>zeige('konto');
  if($('e-sync'))$('e-sync').onclick=async e=>{e.target.disabled=true;await sync();toast(syncFehler?syncFehler:'Gespeichert.');renderEinst();};
  if($('e-ab'))$('e-ab').onclick=()=>fragen('Abmelden?','Dein Fortschritt bleibt in deinem Konto. Auf diesem Gerät beginnt danach ein neuer Spielstand, bis du dich wieder anmeldest.','Abmelden',async()=>{await sync();
    try{await api('/api/abmelden',{});}catch(e){}konto=null;kontoSpeichern();st=neuerStand();eventsPruefen();setzeLook(st.eq.o);bg=null;hScene=null;try{localStorage.setItem('gg5',JSON.stringify(st));}catch(e){}bahn=null;lauf=null;toast('Abgemeldet.');zeige('home');});
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
  if(ev.neu.length){const e=ev.neu[0];hinweis={t:'Neu in deiner Sammlung: '+e.n,p:e.items.map(id=>ITEM[id].n).join(', ')+'. Das bleibt dir für immer, auch nach dem Event.'};}
  else if(ev.vorbei)hinweis={t:ev.vorbei+' ist vorbei',p:'In der Sammlung kannst du den Look jederzeit wieder anlegen.'};
  size();zeige('home');requestAnimationFrame(frame);
  serverPruefen().then(ok=>{if(ok&&konto)sync();else aktualisieren();});})();
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('dialog').hidden){$('dialog').hidden=true;return;}if(ansicht!=='spiel'&&ansicht!=='home'){e.preventDefault();$('zur').click();}});
