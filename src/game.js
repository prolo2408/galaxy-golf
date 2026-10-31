// Galaxy Golf – Spielfeld. Erwartet LV (Kampagne), TG (Tagesbahnen), AG (Bahnen der Tagesaufgaben) und physics.js, gen.js, stand.js, look.js.
const N=LV.length;
const TIERS=['Leicht','Mittel','Schwer','Extrem','Kosmos'];
const $=id=>document.getElementById(id);
const cv=$('c');x=cv.getContext('2d');
// iPhone-App vom Home-Bildschirm: iOS meldet dort eine um die Statusleiste zu kurze Höhe, unten bleibt ein Streifen.
// Dort gilt deshalb die volle Bildschirmhöhe, sonst die sichtbare Höhe des Fensters.
function appHoehe(){let h=innerHeight;if(navigator.standalone===true&&/iPhone|iPod/.test(navigator.userAgent)){const a=Math.max(screen.width,screen.height),b=Math.min(screen.width,screen.height);h=innerWidth<innerHeight?a:b;}
  document.documentElement.style.setProperty('--app-h',h+'px');}
appHoehe();addEventListener('resize',appHoehe);addEventListener('orientationchange',()=>setTimeout(appHoehe,300));
// iOS Safari ignoriert user-scalable=no: Zoomen per Geste und Doppeltipp abfangen, sonst verrutscht die Seite seitlich
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zahl=n=>Number(n).toLocaleString('de-DE');
const COIN='<i class="coin" aria-hidden="true"></i>';

// ---------- Spielstand ----------
function ladeStand(){try{const s=JSON.parse(localStorage.getItem('gg5')||'null');if(s)return sauber(s,N);}catch(e){}
  try{const a=JSON.parse(localStorage.getItem('gg4')||'null');if(a)return ausAlt(a,N,datum());}catch(e){}return neuerStand();}
let st=ladeStand();
function persist(){st.t=Date.now();try{localStorage.setItem('gg5',JSON.stringify(st));}catch(e){}syncBald();}
// Events holt man im Shop ab. Ein Event-Look, der beim Abholen angelegt wurde, wird nach dem Event wieder abgelegt.
function eventsPruefen(){const d=datum();let vorbei=null;
  if(st.auto&&!EVENTS.some(e=>e.look===st.auto.look&&imEvent(e,d))){if(st.eq.o===st.auto.look){vorbei=ITEM[st.auto.look].n;st.eq.o=st.auto.vorher;}st.auto=null;persist();}
  return{vorbei};}
// Ein Event ist offen, solange es läuft und noch nicht jede Sache abgeholt ist
const offeneEvents=()=>EVENTS.filter(e=>imEvent(e,datum())&&e.items.some(id=>!st.own[id]));
// Sternenpass des laufenden Monats
function passJetzt(){const mon=datum().slice(0,7),xp=mon>=PASS.ab?xpMonat(st,mon):0;return{mon,xp,stufe:passStufe(xp)};}
// Stufe 30 erreicht: die Pass-Sache des Monats kommt ins Inventar (der Server prüft das nach)
function passPruefen(){const p=passJetzt(),P=PAESSE[p.mon];if(P&&p.stufe>=PASS.stufen&&!st.own[P.item]){st.own[P.item]={w:'pass',d:datum()};persist();return P.item;}return null;}
SEEN.push(...EVENTS.map(e=>'ev-'+e.id));

// ---------- Größe und Ausrichtung ----------
let S=1,DPR=1,orient='p',bg=null,sterneBlink=[];
let modus='kampagne',bahn=null,li=0,lvl=null,looks=[],tagKey=null,lauf=null,aufg=null;
function inst(b){if(orient==='l')return genRot(b);const l={W:360,H:560,b:b.b.slice(),h:b.h.slice(),par:b.par,t:b.t,s:b.s.slice(),p:b.p.map(q=>q.slice())};
  if(b.w)l.w=b.w.map(q=>q.slice());if(b.f)l.f=b.f.map(q=>q.slice());return l;}
function size(){const f=$('field'),fw=f.clientWidth,fh=f.clientHeight;if(!fw||!fh)return;
  const o=fw>fh*1.08?'l':'p',W=o==='l'?560:360,H=o==='l'?360:560,k=Math.min(fw/W,fh/H)*.995;
  DPR=Math.min(window.devicePixelRatio||1,2.5);cv.style.width=Math.floor(W*k)+'px';cv.style.height=Math.floor(H*k)+'px';
  cv.width=Math.round(W*k*DPR);cv.height=Math.round(H*k*DPR);S=cv.width/DPR/W;bg=null;
  const ch=o!==orient;orient=o;if(bahn&&ch){lvl=inst(bahn);hint=null;drag=null;if(zust==='fly')zust='aim';home();}}
let rzq=0;new ResizeObserver(()=>{cancelAnimationFrame(rzq);rzq=requestAnimationFrame(size);}).observe($('field'));

// ---------- Zustand ----------
let zust='aim',ball=null,shots=0,drag=null,hint=null,tipp=false,trail=[],t=0,acc=0,frames=0,sinkT=0,parts=[],menuTier=0,gewinn=0,fertig=[];
function home(){ball={x:lvl.b[0],y:lvl.b[1],vx:0,vy:0,cd:0};trail=[];t=0;frames=0;}
// Dieselbe Bahn noch einmal laden, ohne sie geschafft zu haben, setzt die Schläge nicht zurück – sonst wären Sterne geschenkt.
function setBahn(b,seed){const offen=b===bahn&&zust!=='won'&&zust!=='sink';bahn=b;lvl=inst(b);looks=mkLooks(b,seed);if(!offen){shots=0;tipp=false;}hint=null;drag=null;zust='aim';home();$('ov').hidden=true;ui();intro();}
function load(i){lauf=null;aufg=null;if(modus!=='kampagne')bahn=null;modus='kampagne';li=Math.max(0,Math.min(N-1,i));st.cur=li;persist();setBahn(LV[li],li);}
// Tagesbahn: eine pro Tag aus dem Vorrat, für alle gleich
const TAG0=Date.UTC(2026,9,30);
function tagIndex(d){const[y,m,dd]=d.split('-').map(Number);return Math.round((Date.UTC(y,m-1,dd)-TAG0)/864e5);}
function tagesBahn(d){const n=TG.length;return TG[((tagIndex(d)%n)+n)%n];}
function startTages(){lauf=null;aufg=null;if(modus!=='tages')bahn=null;modus='tages';tagKey=datum();setBahn(tagesBahn(tagKey),100000+tagIndex(tagKey));}
// Endlos: Bahnen werden im Hintergrund gebaut und mit der Physik geprüft, eine im Voraus
function endlosOpt(k){const d=Math.min(.95,.12+k*.06);return[d,{sa:6,sp:.45,ds:.2,minHits:Math.round(3+10*(1-d)),parQ:[13,7,4],wind:k>=4?.3:0,bin:k>=6?.25:0,tier:d<.35?0:d<.6?1:d<.8?2:3}];}
// Die erste Endlos-Bahn wird schon gebaut, während der Startbildschirm offen ist
let vorrat=null;
function vorratBauen(){if(vorrat||lauf)return;const seed=(Math.random()*4294967296)>>>0,rnd=rng(seed),[d,o]=endlosOpt(0),v=vorrat={seed,rnd,g:genLevel(d,rnd,o),bahn:null};
  (function schritt(){if(vorrat!==v)return;const t0=performance.now();let r;do{r=v.g.next();}while(!r.done&&performance.now()-t0<8);if(r.done)v.bahn=r.value;else setTimeout(schritt,16);})();}
function startEndlos(){bahn=null;aufg=null;const v=vorrat;vorrat=null;const seed=v?v.seed:(Math.random()*4294967296)>>>0;
  lauf={n:0,k:v&&v.bahn?1:0,seed,rnd:v?v.rnd:rng(seed),naechste:v&&v.bahn||null,arbeit:v&&!v.bahn?v.g:null,warten:false};modus='endlos';
  if(lauf.arbeit){const l=lauf;setTimeout(()=>arbeite(l),0);}else endlosBauen();endlosWeiter();}
function endlosBauen(){if(!lauf||lauf.naechste||lauf.arbeit)return;const[d,o]=endlosOpt(lauf.k);lauf.arbeit=genLevel(d,lauf.rnd,o);const l=lauf;setTimeout(()=>arbeite(l),0);}
function arbeite(l){if(l!==lauf||!l.arbeit)return;const t0=performance.now();let r;do{r=l.arbeit.next();}while(!r.done&&performance.now()-t0<(zust==='fly'?4:12));
  if(!r.done){setTimeout(()=>arbeite(l),0);return;}l.naechste=r.value;l.arbeit=null;l.k++;if(l.warten){l.warten=false;endlosWeiter();}}
function endlosWeiter(){if(!lauf)return;if(!lauf.naechste){lauf.warten=true;$('card').innerHTML='<h2>Bahn wird gebaut</h2><p>Die Physik prüft gerade, ob sie lösbar ist.</p><div class="laden" aria-hidden="true"></div>';$('ov').hidden=false;return;}
  const b=lauf.naechste;lauf.naechste=null;setBahn(b,lauf.seed%99991+lauf.n);endlosBauen();}
// Aufgaben-Bahnen: die Bahnen, die eine Tagesaufgabe heute mitbringt, nacheinander
function startAufgabe(id,i){const d=datum(),A=AUFG[id],pool=AG[A.b]||[],idx=aufgabenBahnen(id,d,pool.length);if(!idx.length)return false;
  lauf=null;if(modus!=='aufgabe'||!aufg||aufg.id!==id||aufg.d!==d)bahn=null;modus='aufgabe';aufg={id,d,idx,i:Math.max(0,Math.min(idx.length-1,i|0))};
  setBahn(pool[idx[aufg.i]],300000+dnum(d)%9973*10+aufg.i);return true;}
const limit=()=>lvl.par+2;
function totalStars(){return Object.values(st.best).reduce((a,b)=>a+b.st,0);}
function ui(){const tr=$('tier');
  if(modus==='kampagne'){tr.textContent=TIERS[lvl.t];tr.className='tier t'+lvl.t;$('lvn').textContent='Bahn '+(li+1)+'/'+N;}
  else if(modus==='tages'){tr.textContent='Tagesbahn';tr.className='tier tt';const[,m,d]=tagKey.split('-');$('lvn').textContent=d+'.'+m+'. · '+TIERS[lvl.t];}
  else if(modus==='aufgabe'){tr.textContent='Aufgabe';tr.className='tier ta';$('lvn').textContent='Bahn '+(aufg.i+1)+' von '+aufg.idx.length;}
  else{tr.textContent='Endlos';tr.className='tier te';$('lvn').textContent=(lauf?'Bahn '+(lauf.n+1)+' · ':'')+'Rekord '+st.endl.best;}
  $('par').textContent=lvl.par;$('sh').textContent=modus==='endlos'?shots+'/'+limit():shots;$('mz').textContent=zahl(muenzen(st));
  $('tip').classList.toggle('on',!!hint);$('tip').setAttribute('aria-disabled',modus==='endlos');
  const hw=istHW();$('lgsun').textContent=hw?'Kürbislaternen sind die Sonnen: sehr stark, zu nah verglüht die Kugel':'Sonnen ziehen sehr stark, zu nah verglüht die Kugel';$('lgmoon').textContent=hw?'Geister kreisen als Monde um ihren Planeten':'Monde kreisen um ihren Planeten';}
let msgT;function say(s,col){const m=$('msg');m.textContent=s;m.style.color=col||'var(--dim)';m.style.opacity=1;clearTimeout(msgT);msgT=setTimeout(()=>m.style.opacity=0,2600);}

// ---------- Neue Elemente erklären ----------
const INTRO={start:['So geht’s','Irgendwo aufs Feld tippen, zurückziehen und loslassen. Alles zieht die Kugel an, große und dichte Planeten am stärksten. Ziel ist das Schwarze Loch.'],
  sun:[()=>istHW()?'Neu: Kürbislaternen':'Neu: Sonnen',()=>(istHW()?'An Halloween sind die Sonnen Kürbislaternen. ':'')+'Sie ziehen viel stärker als Planeten. Wer über den gestrichelten Ring hinein fliegt, verglüht.'],
  moon:[()=>istHW()?'Neu: Geister':'Neu: Monde',()=>(istHW()?'An Halloween spuken die Monde als Geister. ':'')+'Sie kreisen um ihren Planeten, so schnell, wie es seine Schwerkraft vorgibt. Bei jedem Schuss starten sie an derselben Stelle.'],
  warp:['Neu: Wurmloch','Rein in den einen Strudel, raus aus dem anderen, mit demselben Schwung.'],
  wind:['Neu: Sonnenwind','In den schimmernden Feldern weht Sonnenwind. Er schiebt die Kugel gleichmäßig in Pfeilrichtung, solange sie darin fliegt.'],
  bin:['Neu: Doppelsterne','Zwei Sonnen kreisen umeinander, so schnell, wie ihre Schwerkraft es vorgibt. Bei jedem Schuss starten sie an derselben Stelle.'],
  tages:['Tagesbahn','Jeden Tag eine neue Bahn, für alle gleich. Beim ersten Schaffen gibt es Bonus-Münzen, mehr Sterne bringen mehr.'],
  endlos:['Endlos','Bahn um Bahn, immer schwerer, frisch gebaut. Pro Bahn hast du Par + 2 Schläge, sonst ist der Lauf vorbei. Einen Tipp gibt es hier nicht.'],
  aufgabe:['Aufgaben-Bahnen','Diese Bahnen passen genau zur Tagesaufgabe und sind heute für alle gleich. Jede geschaffte Bahn zählt, auch nochmal gespielt.']};
let introT;function intro(){const l=lvl,sn=st.seen,k=modus!=='kampagne'&&!sn[modus]?modus:!sn.start?'start':l.p.some(q=>q[3]===4&&!isBin(q))&&!sn.sun?'sun':l.p.some(isBin)&&!sn.bin?'bin':l.p.some(isMoon)&&!sn.moon?'moon':l.w&&!sn.warp?'warp':l.f&&!sn.wind?'wind':null;
  const el=$('intro');if(!k){el.hidden=true;return;}sn[k]=1;persist();const tx=v=>typeof v==='function'?v():v;$('inh').textContent=tx(INTRO[k][0]);$('inp').textContent=tx(INTRO[k][1]);el.hidden=false;clearTimeout(introT);introT=setTimeout(()=>el.hidden=true,10000);}
$('intro').onclick=()=>$('intro').hidden=true;

// ---------- Eingabe ----------
function pos(e){const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left)/S,y:(e.clientY-b.top)/S};}
function power(){if(!drag)return{x:0,y:0,l:0};let dx=drag.sx-drag.x,dy=drag.sy-drag.y,l=Math.hypot(dx,dy);if(l>150){dx*=150/l;dy*=150/l;}return{x:dx*.048,y:dy*.048,l:Math.min(l,150)};}
cv.addEventListener('pointerdown',e=>{if(zust!=='aim'||!$('ov').hidden)return;$('intro').hidden=true;const p=pos(e);drag={sx:p.x,sy:p.y,x:p.x,y:p.y};cv.setPointerCapture(e.pointerId);e.preventDefault();});
cv.addEventListener('pointermove',e=>{if(!drag)return;const p=pos(e);drag.x=p.x;drag.y=p.y;});
cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',()=>drag=null);
function release(){if(!drag)return;const pw=power();drag=null;if(pw.l<8)return;let v=[pw.x,pw.y];
  if(hint&&Math.hypot(pw.x-hint.vx,pw.y-hint.vy)<.6){v=[hint.vx,hint.vy];say('Tipp-Schuss','#5fd39a');}
  hint=null;home();ball.vx=v[0];ball.vy=v[1];zust='fly';shots++;ui();}
function toggleHint(){if(zust!=='aim'||!$('ov').hidden)return;if(modus==='endlos'){say('Im Endlos-Modus gibt es keinen Tipp');return;}
  if(hint){hint=null;ui();say('Tipp ausgeblendet');return;}
  tipp=true;hint={vx:lvl.s[0],vy:lvl.s[1],path:[]};simulate(lvl,hint.vx,hint.vy,hint.path);ui();say('Zum Kreis ziehen, bei Grün loslassen','var(--acc)');}

// ---------- Ablauf ----------
function burst(px,py,n,cols,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.25+Math.random());parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,d:.5+Math.random()*.9,c:cols[i%cols.length],s:.8+Math.random()*2});}}
function tick(){t+=DT;const e=stepBody(lvl,ball,t);frames++;
  if(frames%2===0){trail.push([ball.x,ball.y]);if(trail.length>60)trail.shift();}
  if(e==='warp'){trail=[];burst(ball.x,ball.y,18,C.wh,1.6);say('Wurmloch!',C.wh[0]);}
  if(e==='hole')return win();
  if(e==='burn')return fail('Verglüht! Zu nah an der Sonne.',[C.sun[1],C.sun[2],'#fff']);
  if(e==='crash')return fail(istHW()?'Saures! Aufgeschlagen.':'Aufgeschlagen. Nochmal.',['#ff7a59','#ffd0a8','#ffffff']);
  if(e==='out')return fail(istHW()?'In der Nacht verschwunden.':'Ab ins All.',[C.acc]);
  if(frames>=MAXF)return fail(istHW()?'Spukt jetzt im Orbit.':'Im Orbit gefangen.',[C.acc]);}
function fail(m,cols){burst(ball.x,ball.y,30,cols,2.2);zust='aim';home();say(m,'var(--acc)');
  if(modus==='endlos'&&shots>=limit())laufEnde();}
function sterne(){return shots<=lvl.par-1?3:shots<=lvl.par?2:1;}
function aufgabe(id,wert,hoechst){const d=datum();if(!aufgabenFuer(d).includes(id))return;const a=st.auf[d]||(st.auf[d]={}),z=AUFG[id].z,alt=a[id]|0;
  const neu=Math.min(z,hoechst?Math.max(alt,wert):alt+wert);if(neu===alt)return;a[id]=neu;if(alt<z&&neu>=z)fertig.push(AUFG[id]);}
let xpPlus=0,passNeu=null,passSache=null,wocheNeu=[];
function win(){zust='sink';sinkT=0;ball.x=lvl.h[0];ball.y=lvl.h[1];burst(lvl.h[0],lvl.h[1],40,[C.ring,C.disk,'#ffffff'],2);
  const n=sterne(),vorher=muenzen(st),ass=shots===1&&!tipp,d=datum(),w=wocheVon(d),pv=passJetzt(),wv=wochenErledigt(st,w);fertig=[];
  if(modus==='kampagne'){const k=li+1,prev=st.best[k];st.best[k]={s:Math.min(shots,prev?prev.s:99),st:Math.max(n,prev?prev.st:0)};if(ass||(prev&&prev.a))st.best[k].a=1;st.un=Math.max(st.un,Math.min(N,k+3));}
  else if(modus==='tages'){const prev=st.tag[tagKey];st.tag[tagKey]={s:Math.min(shots,prev?prev.s:99),st:Math.max(n,prev?prev.st:0)};aufgabe('tages',1);}
  else if(modus==='endlos'){lauf.n++;st.endl.best=Math.max(st.endl.best,lauf.n);aufgabe('en3',lauf.n,true);}
  aufgabe('b5',1);aufgabe('st8',n);if(!tipp)aufgabe('ot3',1);if(lvl.par>=3)aufgabe('p3',1);if(shots<lvl.par)aufgabe('up2',1);if(ass)aufgabe('as1',1);
  if(lvl.w)aufgabe('wu',1);if(lvl.f)aufgabe('wi',1);if(lvl.p.some(isBin))aufgabe('dp',1);
  // Tagesleistung: zählt für Sternenpass und Wochen-Herausforderungen
  const a=st.akt[d]||(st.akt[d]={b:0,s:0,a:0,e:0});a.b++;a.s+=n;if(ass)a.a++;if(modus==='endlos')a.e=Math.max(a.e,lauf.n);
  const pn=passJetzt();xpPlus=pn.xp-pv.xp;passNeu=pn.stufe>pv.stufe&&pn.mon>=PASS.ab?pn.stufe:null;
  wocheNeu=wochenErledigt(st,w).filter(id=>!wv.includes(id)).map(id=>WAUFG[id]);
  passSache=passPruefen();
  gewinn=muenzen(st)-vorher;persist();if(st.opt.vib&&navigator.vibrate)try{navigator.vibrate(25);}catch(e){}ui();}
function showWin(){const n=sterne(),h=istHW();
  const title=shots===1?'Hole in one!':n===3?(h?'Gruselig gut!':'Unter Par!'):n===2?(h?'Süßes!':'Par geschafft'):'Eingelocht';
  let p=shots+(shots===1?' Schlag':' Schläge')+' bei Par '+lvl.par+'.'+(shots===1&&tipp&&modus==='kampagne'?' Mit Tipp gibt es keinen Ass-Bonus.':''),knoepfe;
  if(modus==='kampagne'){const last=li===N-1,nt=!last&&LV[li+1].t>lvl.t?' Als Nächstes beginnt Stufe '+TIERS[LV[li+1].t]+'.':'';p+=last?' Das war die letzte Bahn.':nt;
    knoepfe='<button type="button" id="again">Nochmal</button><button type="button" class="go" id="nx">'+(last?'Alle Bahnen':'Weiter')+'</button>';}
  else if(modus==='tages')knoepfe='<button type="button" id="again">Nochmal</button><button type="button" class="go" id="nx">Zum Start</button>'+(konto?'<button type="button" class="breit" id="rangl">Rangliste ansehen</button>':'');
  else if(modus==='aufgabe'){const last=aufg.i>=aufg.idx.length-1;knoepfe='<button type="button" id="again">Nochmal</button><button type="button" class="go" id="nx">'+(last?'Zu den Aufgaben':'Nächste Bahn')+'</button>';}
  else{p='Bahn '+lauf.n+' geschafft'+(lauf.n>=st.endl.best&&lauf.n>1?', neuer Rekord!':'.');knoepfe='<button type="button" class="go" id="nx">Nächste Bahn</button>';}
  const extra='<div class="gewinne">'+(gewinn>0?'<span class="plus">+'+zahl(gewinn)+' '+COIN+'</span>':'')+(xpPlus>0?'<span class="xp">+'+xpPlus+' XP</span>':'')+'</div>'+
    (passNeu?'<p class="passneu">Sternenpass Stufe '+passNeu+(passNeu>=PASS.stufen?' – geschafft!':'')+'</p>':'')+
    fertig.map(a=>'<p class="erledigt">Aufgabe geschafft: '+esc(a.t)+'</p>').join('')+wocheNeu.map(a=>'<p class="erledigt">Wochen-Herausforderung geschafft: '+esc(a.t)+'</p>').join('');
  $('card').innerHTML='<div class="stars">'+'★'.repeat(n)+'<i>'+'★'.repeat(3-n)+'</i></div><h2 class="big">'+title+'</h2><p>'+p+'</p>'+extra+'<div class="row wrap">'+knoepfe+'</div>';
  if($('again'))$('again').onclick=()=>modus==='tages'?setBahn(bahn,100000+tagIndex(tagKey)):modus==='aufgabe'?startAufgabe(aufg.id,aufg.i):load(li);
  if($('rangl'))$('rangl').onclick=()=>zeige('rang');
  if(passSache){const id=passSache;passSache=null;setTimeout(()=>moment({id,titel:'Sternenpass geschafft!',text:'Alle 30 Stufen. Diese Belohnung gibt es nur in diesem Monat.'}),500);}
  $('nx').onclick=weiter;$('ov').hidden=false;$('nx').focus({preventScroll:true});}
function weiter(){if(modus==='kampagne')li===N-1?showMenu():load(li+1);else if(modus==='tages')zeige('home');
  else if(modus==='aufgabe'){if(aufg.i>=aufg.idx.length-1)zeige('aufg','heute');else startAufgabe(aufg.id,aufg.i+1);}else endlosWeiter();}
function laufEnde(){const n=lauf.n,rek=n>=st.endl.best&&n>0;lauf=null;
  $('card').innerHTML='<h2 class="big">Lauf vorbei</h2><p>'+(n===1?'Eine Bahn':n+' Bahnen')+' geschafft.'+(rek?' Neuer Rekord!':' Rekord: '+st.endl.best+'.')+'</p><div class="row"><button type="button" id="again">Zum Start</button><button type="button" class="go" id="nx">Neuer Lauf</button></div>';
  $('again').onclick=()=>zeige('home');$('nx').onclick=()=>{bahn=null;startEndlos();};$('ov').hidden=false;$('nx').focus({preventScroll:true});}

// ---------- Bahnen-Menü ----------
function showMenu(){if(zust==='fly'){zust='aim';home();}drag=null;menuTier=modus==='kampagne'?LV[li].t:Math.max(0,LV[Math.min(N-1,st.un-1)].t);renderMenu();$('ov').hidden=false;}
function renderMenu(){let h='<div class="mhead"><h2>Bahnen</h2><span>★ '+totalStars()+' / '+N*3+'</span></div><div class="tabs" role="tablist">';
  TIERS.forEach((n,i)=>{let a=0,s=0;LV.forEach((l,j)=>{if(l.t===i){a++;if(st.best[j+1])s++;}});h+='<button type="button" role="tab" class="t'+i+'" data-t="'+i+'" aria-selected="'+(i===menuTier)+'">'+n+'<small>'+s+'/'+a+'</small></button>';});
  h+='</div><div class="grid">';
  LV.forEach((l,j)=>{if(l.t!==menuTier)return;const k=j+1,lock=k>st.un,b=st.best[k];h+='<button type="button" data-l="'+k+'" class="'+(modus==='kampagne'&&j===li?'cur':'')+'" aria-disabled="'+lock+'">'+k+'<small>'+(b?'★'.repeat(b.st):lock?'·':'')+'</small></button>';});
  h+='</div><button type="button" class="go" id="close">'+(modus==='kampagne'?'Weiterspielen':'Zurück')+'</button>';
  const cd=$('card');cd.innerHTML=h;
  cd.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{menuTier=+b.dataset.t;renderMenu();});
  cd.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const k=+b.dataset.l;if(k<=st.un)load(k-1);else say('Erst die Bahnen davor spielen');});
  $('close').onclick=closeMenu;
  const cur=cd.querySelector('.grid .cur')||cd.querySelector('.grid button');if(cur)cur.scrollIntoView({block:'nearest'});}
function closeMenu(){if(lauf&&lauf.warten)return;$('ov').hidden=true;if(zust==='won'||zust==='sink')modus==='kampagne'?load(li):weiter();}
// „Neu“ holt die Kugel an den Start zurück (auch mitten im Flug); die Schläge bleiben gezählt.
$('reset').onclick=()=>{if(!$('ov').hidden||!lvl)return;if(zust==='fly'){zust='aim';home();say(modus==='endlos'&&shots>=limit()?'':'Kugel zurück');if(modus==='endlos'&&shots>=limit())laufEnde();}else if(zust==='aim'){home();drag=null;}};
$('menu').onclick=()=>$('ov').hidden||!$('card').querySelector('.tabs')?showMenu():closeMenu();$('tip').onclick=toggleHint;$('start').onclick=()=>zeige(letzterReiter);
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||!spielSichtbar()||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName))return;const k=e.key.toLowerCase();
  if(k==='t'||k==='h')toggleHint();else if(k==='r')$('reset').click();
  else if(k==='m'){if($('ov').hidden)showMenu();else if($('card').querySelector('.tabs'))closeMenu();}
  else if(k==='escape'){if(!$('ov').hidden&&$('card').querySelector('.tabs'))closeMenu();else zeige(letzterReiter);}
  else if(k==='enter'&&zust==='won'&&!$('ov').hidden&&document.activeElement?.id!=='again'){e.preventDefault();weiter();}});

// ---------- Zeichnen ----------
const ACC=[.22,.08,.03];
function orbitPfeile(cx,cy,R,a,d){for(let k=1;k<=2;k++){const b=a+d*(.18+k*.15),px=cx+Math.cos(b)*R,py=cy+Math.sin(b)*R,tg=b+d*Math.PI/2;x.strokeStyle='rgba('+C.star+','+(.6-k*.17)+')';x.lineWidth=1.5;x.beginPath();x.moveTo(px+Math.cos(tg-2.5)*5,py+Math.sin(tg-2.5)*5);x.lineTo(px,py);x.lineTo(px+Math.cos(tg+2.5)*5,py+Math.sin(tg+2.5)*5);x.stroke();}}
function render(){const L=lvl,P=planetsAt(L,t);
  x.setTransform(1,0,0,1,0,0);if(!bg){bg=buildBg(cv.width,cv.height,DPR*S);const rs=rng(7);sterneBlink=Array.from({length:22},()=>[rs(),rs(),rs()*6]);}x.drawImage(bg,0,0);x.setTransform(DPR*S,0,0,DPR*S,0,0);
  for(const s of sterneBlink){x.fillStyle='rgba('+C.star+','+(.1+.6*Math.max(0,Math.sin(anim*1.2+s[2])))+')';x.fillRect(s[0]*L.W,s[1]*L.H,1.4,1.4);}
  fxDraw();
  if(L.f)L.f.forEach(drawWind);
  // Schwerkraftfeld: Ringe dort, wo die Anziehung 0,22 / 0,08 / 0,03 erreicht – größere Masse, weitere Ringe
  if(st.opt.ringe)P.forEach(p=>{const m=gm(p),sun=p[3]===4;ACC.forEach((a,k)=>{const R=Math.sqrt(m/a);if(R<p[2]+(sun?BURN+8:5)||R>320)return;x.strokeStyle=sun?rgba(C.sun[2],.16-k*.04):'rgba('+C.star+','+(.11-k*.03)+')';x.lineWidth=1;x.beginPath();x.arc(p[0],p[1],R,0,7);x.stroke();});});
  L.p.forEach(q=>{if(q.length<=4)return;let cx,cy,R;if(q[4]>=0){const h=L.p[q[4]];cx=h[0];cy=h[1];R=q[5];}else{cx=q[0];cy=q[1];R=binR(L,q);}
    x.strokeStyle='rgba('+C.star+',.12)';x.setLineDash([3,6]);x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();x.setLineDash([]);if(zust==='aim')orbitPfeile(cx,cy,R,q[7],q[6]);});
  if(L.w)L.w.forEach((w,k)=>{const col=C.wh[k%2];vortex(w[0],w[1],col,1);vortex(w[2],w[3],col,-1);x.strokeStyle=rgba(col,.12);x.setLineDash([2,8]);x.beginPath();x.moveTo(w[0],w[1]);x.lineTo(w[2],w[3]);x.stroke();x.setLineDash([]);});
  P.forEach((p,j)=>drawBody(looks[j],p,P,L.p[j][6]));
  (LOECHER[st.eq.l]||lochStandard)(L.h[0],L.h[1]);
  if(zust==='aim'){x.strokeStyle='rgba('+C.star+',.35)';x.setLineDash([3,4]);x.lineDashOffset=-anim*8;x.beginPath();x.arc(L.b[0],L.b[1],11,0,7);x.stroke();x.setLineDash([]);x.lineDashOffset=0;}
  (SPUREN[st.eq.s]||SPUREN['s-standard'])(trail);
  if(hint&&zust==='aim'){const dx=-hint.vx/.048,dy=-hint.vy/.048;x.fillStyle='rgba('+C.glow+',.7)';for(const q of hint.path)if(q){x.beginPath();x.arc(q[0],q[1],1.7,0,7);x.fill();}
    let ax,ay,close=false;if(drag){ax=drag.sx;ay=drag.sy;const pw=power();close=Math.hypot(pw.x-hint.vx,pw.y-hint.vy)<.6;}else{ax=L.W/2-dx/2;ay=L.H/2-dy/2;}
    const bx=ax+dx,by=ay+dy,col=close?'#5fd39a':'rgb('+C.glow+')';x.strokeStyle=col;x.lineWidth=2;x.setLineDash([6,5]);x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();x.setLineDash([]);
    if(!drag){x.beginPath();x.arc(ax,ay,9,0,7);x.stroke();}x.fillStyle=col;x.beginPath();x.arc(bx,by,close?14:10,0,7);x.fill();x.lineWidth=1.5;x.beginPath();x.arc(bx,by,22,0,7);x.stroke();
    if(!drag){x.fillStyle='rgb('+C.glow+')';x.font='500 12px Rubik, system-ui, sans-serif';x.textAlign='center';x.fillText('von ○ nach ● ziehen',L.W/2,Math.min(L.H-10,Math.max(ay,by)+30));}}
  if(drag){const pw=power();if(st.opt.vorschau){const o={x:L.b[0],y:L.b[1],vx:pw.x,vy:pw.y,cd:0};let tt=0;x.fillStyle=C.ball;
    for(let i=0;i<70;i++){tt+=DT;const e=stepBody(L,o,tt);if(e==='crash'||e==='burn'||e==='out')break;if(i%3===0){x.globalAlpha=.8*(1-i/70);x.beginPath();x.arc(o.x,o.y,2,0,7);x.fill();}if(e==='hole')break;}x.globalAlpha=1;}
    x.strokeStyle='rgba('+C.star+',.25)';x.lineWidth=1;x.beginPath();x.moveTo(drag.sx,drag.sy);x.lineTo(drag.x,drag.y);x.stroke();
    const f=pw.l/150;x.fillStyle='rgba(255,255,255,.1)';x.fillRect(L.b[0]-20,L.b[1]+15,40,4);x.fillStyle=f>.85?'#ff7a59':'rgb('+C.glow+')';x.fillRect(L.b[0]-20,L.b[1]+15,40*f,4);}
  for(const p of parts){x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.s*p.l+.3,0,7);x.fill();}x.globalAlpha=1;
  if(zust==='sink'){const k=Math.min(1,sinkT/.6),a=k*12;drawBall(st.eq.k,L.h[0]+Math.cos(a)*14*(1-k),L.h[1]+Math.sin(a)*5*(1-k),1-k);}
  else if(zust!=='won')drawBall(st.eq.k,ball.x,ball.y,1);}

let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;anim+=dt;
  if(spielSichtbar()){
    if(zust==='fly'){acc+=dt;let n=0;while(acc>=DT&&zust==='fly'&&n<40){acc-=DT;tick();n++;}}else acc=0;
    if(zust==='sink'){sinkT+=dt;if(sinkT>.75){zust='won';showWin();}}
    for(const p of parts){p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=.96;p.vy*=.96;p.l-=dt/p.d;}parts=parts.filter(p=>p.l>0);
    if(lvl){fxStep(dt,lvl.W,lvl.H);if(cv.width)render();}}
  else if(homeSichtbar())homeFrame(dt);
  else if(ansicht==='inv')invFrame();
  else if(ansicht==='shop')shopFrame(dt);
  else if(ansicht==='aufg'){ticken(dt,$('sinhalt'));if(aufgTab==='pass')passFrame();}
  if(!$('gross').hidden)grossFrame();
  if(!$('moment').hidden)momentFrame(dt);
  requestAnimationFrame(frame);}
