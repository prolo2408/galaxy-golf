'use strict';
// Galaxy Golf – Server: liefert das Spiel aus und hält Konten, Spielstände, Geschenk-Codes und den Admin-Zugang.
// Nur Node-Standardbibliothek. Daten in einer JSON-Datei im Volume (DATEN, Vorgabe /data).
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const BASIS=path.join(__dirname,'..'),SITE=path.join(BASIS,'site'),DATEN=process.env.DATEN||'/data';
const PORT=+(process.env.PORT||80),TZ='Europe/Berlin';
const ADMIN=String(process.env.GG_ADMIN_PASSWORT||'').trim();
const ST=new Function(fs.readFileSync(path.join(BASIS,'src/stand.js'),'utf8')+
  ';return{ITEM,EVENT,evItems,istBekannt,muenzen,sauber,zusammen,neuerStand,datum,imEvent,angebotOk,truheOk,passOk,STANDARD};')();
const N=JSON.parse(fs.readFileSync(path.join(__dirname,'info.json'),'utf8')).n;

// ---------- Daten ----------
const DATEI=path.join(DATEN,'galaxy-golf.json');
let db={spieler:{},codes:{}};
try{db=JSON.parse(fs.readFileSync(DATEI,'utf8'));}
catch(e){if(e.code!=='ENOENT'){// Lieber nicht starten als einen Stand überschreiben, der nur nicht lesbar war
  console.error('Spielstände in '+DATEI+' sind nicht lesbar ('+e.message+'). Nichts überschrieben. Datei prüfen oder aus der Sicherung holen.');process.exit(1);}}
db.spieler=db.spieler||{};db.codes=db.codes||{};
const nachName=new Map(),nachToken=new Map();
for(const id in db.spieler){const p=db.spieler[id];nachName.set(p.key,id);for(const t of p.tokens)nachToken.set(t,id);}
let schreibT=null;
function speichern(){clearTimeout(schreibT);schreibT=setTimeout(jetztSpeichern,400);}
function jetztSpeichern(){clearTimeout(schreibT);schreibT=null;const tmp=DATEI+'.neu';
  try{const fd=fs.openSync(tmp,'w',0o600);fs.writeSync(fd,JSON.stringify(db));fs.fsyncSync(fd);fs.closeSync(fd);fs.renameSync(tmp,DATEI);}
  catch(e){console.error('Speichern fehlgeschlagen: '+e.message);}}

// ---------- Hilfen ----------
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const zufall=n=>crypto.randomBytes(n).toString('base64url');
function gleich(a,b){const x=Buffer.from(hash(String(a))),y=Buffer.from(hash(String(b)));return crypto.timingSafeEqual(x,y);}
function pinHash(pin,salz){return crypto.scryptSync(pin,salz,32).toString('hex');}
const heute=()=>ST.datum(null,TZ),morgen=()=>ST.datum(new Date(Date.now()+864e5),TZ),gestern=()=>ST.datum(new Date(Date.now()-864e5),TZ);
function ip(req){const x=String(req.headers['x-forwarded-for']||'').split(',').map(s=>s.trim()).filter(Boolean);return x.length?x[x.length-1]:req.socket.remoteAddress||'?';}
// Bremse für Fehlversuche je Adresse: zu viele in 10 Minuten → warten
const bremse=new Map();
function gebremst(art,wer,max){const k=art+'|'+wer,b=bremse.get(k);if(!b||b.bis<Date.now())return false;return b.n>=max;}
function fehlversuch(art,wer){const k=art+'|'+wer,now=Date.now();let b=bremse.get(k);if(!b||b.bis<now)b={n:0,bis:now+6e5};b.n++;bremse.set(k,b);}
setInterval(()=>{const now=Date.now();for(const[k,b]of bremse)if(b.bis<now)bremse.delete(k);for(const[k,t]of admins)if(t<now)admins.delete(k);},6e4).unref();
class Fehler extends Error{constructor(code,text){super(text);this.code=code;}}

// Was ein Gerät schickt, wird geprüft: Geschenke und eingelöste Codes kann es sich nicht selbst geben,
// Event-Sachen nur aus dem Event-Zeitraum, und gekauft wird nur, was die Münzen hergeben.
function eventVon(id){return id.startsWith('e-')?ST.EVENT[id.slice(2)]:ST.ITEM[id]&&ST.EVENT[ST.ITEM[id].ev];}
function vomGeraet(x,alt){const s=ST.sauber(x,N),m=morgen();
  for(const id in s.own){if(alt&&alt.own[id])continue;const o=s.own[id];
    if(o.w==='geschenk'||o.w==='code')delete s.own[id];
    else if(o.w==='event'){const e=eventVon(id);if(!e||!ST.imEvent(e,o.d)||o.d>m)delete s.own[id];}
    else if(o.w==='kauf'&&!(ST.ITEM[id]&&ST.ITEM[id].p))delete s.own[id];
    // Angebotspreis nur, wenn es an dem Tag (± ein Tag Zeitzone) wirklich das Angebot war, sonst gilt der volle Preis
    else if(o.w==='kauf'&&typeof o.p==='number'&&!(o.d>=gestern()&&o.d<=m&&ST.angebotOk(id,o.d,o.p)))delete o.p;
    else if((o.w==='serie'||o.w==='pass')&&o.d>m)delete s.own[id];}
  for(const k of['tag','auf','akt','login'])for(const d in s[k])if(d>m)delete s[k][d];
  s.bonus=alt?alt.bonus|0:0;
  const r=alt?ST.zusammen(alt,s):s;
  // Truhe und Sternenpass prüfen erst nach dem Zusammenführen: Serie und XP ergeben sich aus dem ganzen Stand
  for(const id of Object.keys(r.own)){if(alt&&alt.own[id])continue;const o=r.own[id];
    if(o.w==='serie'&&!ST.truheOk(r,id,o.d)||o.w==='pass'&&!ST.passOk(r,id))delete r.own[id];}
  const neu=Object.keys(r.own).filter(id=>r.own[id].w==='kauf'&&!(alt&&alt.own[id])).sort((a,b)=>r.own[b].d.localeCompare(r.own[a].d));
  while(ST.muenzen(r)<0&&neu.length)delete r.own[neu.shift()];
  for(const f in r.eq)if(!r.own[r.eq[f]]&&r.eq[f]!==ST.STANDARD[f])r.eq[f]=ST.STANDARD[f];
  return r;}
function spielerAus(req){const a=String(req.headers.authorization||'');if(!a.startsWith('Bearer '))return null;const id=nachToken.get(hash(a.slice(7)));return id?db.spieler[id]:null;}
function brauchtSpieler(req){const p=spielerAus(req);if(!p)throw new Fehler(401,'Nicht angemeldet. Bitte neu anmelden.');p.zuletzt=Date.now();return p;}
function neuesToken(p){const t=zufall(32),h=hash(t);p.tokens.push(h);nachToken.set(h,p.id);
  while(p.tokens.length>10)nachToken.delete(p.tokens.shift());return t;}
function antwortStand(p){return{name:p.name,stand:p.stand,muenzen:ST.muenzen(p.stand)};}
const NAME=/^[\p{L}\p{N}][\p{L}\p{N} _.\-]{0,14}[\p{L}\p{N}]$/u;

// ---------- Admin ----------
const admins=new Map();
function brauchtAdmin(req){const t=String(req.headers['x-admin']||''),h=hash(t),bis=admins.get(h);
  if(!t||!bis||bis<Date.now())throw new Fehler(401,'Admin-Sitzung abgelaufen. Code noch einmal eingeben.');admins.set(h,Date.now()+2*36e5);}
function geschenkInhalt(x){const items=(Array.isArray(x.items)?x.items:[]).filter(id=>typeof id==='string'&&ST.istBekannt(id)&&!/-(standard|klassisch)$/.test(id));
  const e=[];for(const id of items)if(id.startsWith('e-'))e.push(...ST.evItems(id.slice(2)));
  const m=Math.round(+x.muenzen||0);if(!Number.isFinite(m)||Math.abs(m)>1e6)throw new Fehler(400,'Münzen: eine Zahl bis eine Million.');
  return{items:[...new Set([...items,...e])],muenzen:m,alleBahnen:!!x.alleBahnen};}
function anwenden(p,g,wie){const d=heute();for(const id of g.items)if(!p.stand.own[id])p.stand.own[id]={w:wie,d};
  p.stand.bonus=(p.stand.bonus|0)+g.muenzen;if(g.alleBahnen)p.stand.un=N;}
function beschreiben(g){const t=[];if(g.muenzen)t.push(g.muenzen+' Münzen');for(const id of g.items)if(ST.ITEM[id])t.push(ST.ITEM[id].n);
  else if(id.startsWith('e-'))t.push('Abzeichen '+ST.EVENT[id.slice(2)].n);if(g.alleBahnen)t.push('alle Bahnen');return t.join(', ')||'nichts';}
const CODE_ZEICHEN='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function codeNorm(c){return String(c||'').toUpperCase().replace(/[\s_]+/g,'-').replace(/[^A-Z0-9-]/g,'').slice(0,24);}

// ---------- API ----------
const API={
  'GET /api/status':()=>({ok:true,n:N}),
  'POST /api/konto':(req,x)=>{const w=ip(req);if(gebremst('konto',w,20))throw new Fehler(429,'Zu viele neue Konten von hier. Später noch einmal.');
    const name=String(x.name||'').trim().replace(/\s+/g,' '),pin=String(x.pin||'');
    if(!NAME.test(name))throw new Fehler(400,'Name: 2 bis 16 Zeichen, Buchstaben, Ziffern, Leerzeichen, Punkt oder Strich.');
    if(!/^\d{4,8}$/.test(pin))throw new Fehler(400,'PIN: 4 bis 8 Ziffern.');
    const key=name.toLowerCase();if(nachName.has(key))throw new Fehler(409,'Den Namen gibt es schon. Anmelden oder einen anderen nehmen.');
    fehlversuch('konto',w);
    const id=zufall(9),salz=zufall(16),p={id,name,key,salz,pin:pinHash(pin,salz),tokens:[],seit:heute(),zuletzt:Date.now(),eingeloest:[]};
    p.stand=vomGeraet(x.stand,null);db.spieler[id]=p;nachName.set(key,id);const token=neuesToken(p);speichern();
    return Object.assign({token},antwortStand(p));},
  'POST /api/anmelden':(req,x)=>{const name=String(x.name||'').trim().replace(/\s+/g,' '),id=nachName.get(name.toLowerCase()),p=id&&db.spieler[id];
    if(gebremst('pin',name.toLowerCase(),5)||gebremst('pin-ip',ip(req),20))throw new Fehler(429,'Zu viele falsche PINs. Warte zehn Minuten.');
    if(!p||!gleich(pinHash(String(x.pin||''),p.salz),p.pin)){fehlversuch('pin',name.toLowerCase());fehlversuch('pin-ip',ip(req));throw new Fehler(403,'Name oder PIN stimmt nicht.');}
    p.zuletzt=Date.now();const token=neuesToken(p);speichern();return Object.assign({token},antwortStand(p));},
  'POST /api/sync':(req,x)=>{const p=brauchtSpieler(req);p.stand=vomGeraet(x.stand,p.stand);speichern();return antwortStand(p);},
  // Rangliste der Tagesbahn für heute und gestern: wenigste Schläge zuerst, dann mehr Sterne
  'GET /api/rangliste':(req)=>{const p=brauchtSpieler(req);
    return{tage:[heute(),gestern()].map(d=>({tag:d,liste:Object.values(db.spieler).filter(q=>q.stand&&q.stand.tag&&q.stand.tag[d])
      .map(q=>({name:q.name,s:q.stand.tag[d].s,st:q.stand.tag[d].st,ich:q.id===p.id}))
      .sort((a,b)=>a.s-b.s||b.st-a.st||a.name.localeCompare(b.name,'de'))}))};},
  'POST /api/abmelden':(req)=>{const a=String(req.headers.authorization||'').slice(7),h=hash(a),id=nachToken.get(h);
    if(id){const p=db.spieler[id];p.tokens=p.tokens.filter(t=>t!==h);nachToken.delete(h);speichern();}return{ok:true};},
  'POST /api/code':(req,x)=>{const w=ip(req);if(gebremst('code',w,10))throw new Fehler(429,'Zu viele falsche Codes. Warte zehn Minuten.');
    const roh=String(x.code||'').trim();
    if(ADMIN.length>=8&&gleich(roh,ADMIN)){const t=zufall(32);admins.set(hash(t),Date.now()+2*36e5);return{admin:t};}
    const k=codeNorm(roh),c=k&&db.codes[k];
    if(!c){fehlversuch('code',w);throw new Fehler(404,'Diesen Code gibt es nicht.');}
    const p=spielerAus(req);if(!p)throw new Fehler(401,'Lege erst ein Konto an, dann kannst du den Code einlösen.');
    if(c.eingeloest.some(e=>e.id===p.id))throw new Fehler(409,'Diesen Code hast du schon eingelöst.');
    if(c.max&&c.eingeloest.length>=c.max)throw new Fehler(410,'Dieser Code ist schon aufgebraucht.');
    anwenden(p,c,'code');c.eingeloest.push({id:p.id,name:p.name,d:heute()});speichern();
    return Object.assign({text:beschreiben(c)},antwortStand(p));},
  'GET /api/admin':(req)=>{brauchtAdmin(req);
    return{n:N,eingerichtet:true,
      spieler:Object.values(db.spieler).map(p=>({id:p.id,name:p.name,seit:p.seit,zuletzt:p.zuletzt,muenzen:ST.muenzen(p.stand),
        sterne:Object.values(p.stand.best).reduce((a,b)=>a+b.st,0),bahnen:Object.keys(p.stand.best).length,un:p.stand.un,own:Object.keys(p.stand.own)})).sort((a,b)=>b.zuletzt-a.zuletzt),
      codes:Object.values(db.codes).sort((a,b)=>b.erstellt.localeCompare(a.erstellt)).map(c=>({code:c.code,items:c.items,muenzen:c.muenzen,alleBahnen:c.alleBahnen,max:c.max,erstellt:c.erstellt,
        text:beschreiben(c),eingeloest:c.eingeloest.map(e=>e.name)}))};},
  'POST /api/admin/schenken':(req,x)=>{brauchtAdmin(req);const p=db.spieler[x.id];if(!p)throw new Fehler(404,'Diesen Spieler gibt es nicht mehr.');
    const g=geschenkInhalt(x);anwenden(p,g,'geschenk');speichern();return{text:p.name+' bekommt: '+beschreiben(g)};},
  'POST /api/admin/pin':(req,x)=>{brauchtAdmin(req);const p=db.spieler[x.id];if(!p)throw new Fehler(404,'Diesen Spieler gibt es nicht mehr.');
    const pin=String(x.pin||'');if(!/^\d{4,8}$/.test(pin))throw new Fehler(400,'PIN: 4 bis 8 Ziffern.');
    p.salz=zufall(16);p.pin=pinHash(pin,p.salz);bremse.delete('pin|'+p.key);speichern();return{text:'Neue PIN für '+p.name+' gesetzt.'};},
  'POST /api/admin/code':(req,x)=>{brauchtAdmin(req);const g=geschenkInhalt(x);
    if(!g.items.length&&!g.muenzen&&!g.alleBahnen)throw new Fehler(400,'Ein Code ohne Inhalt bringt nichts. Münzen, Sachen oder alle Bahnen wählen.');
    let code=codeNorm(x.code);if(!code){do{code='GG-';for(let i=0;i<6;i++)code+=CODE_ZEICHEN[crypto.randomInt(CODE_ZEICHEN.length)];}while(db.codes[code]);}
    if(!/^[A-Z0-9][A-Z0-9-]{2,22}[A-Z0-9]$/.test(code))throw new Fehler(400,'Code: 4 bis 24 Zeichen, Buchstaben, Ziffern und Striche.');
    if(db.codes[code])throw new Fehler(409,'Den Code gibt es schon.');
    if(ADMIN&&gleich(code,codeNorm(ADMIN)))throw new Fehler(400,'Das ist dein Admin-Passwort. Nimm einen anderen Code.');
    const max=Math.max(0,Math.min(10000,Math.round(+x.max||0)));
    db.codes[code]=Object.assign({code,max,erstellt:new Date().toISOString(),eingeloest:[]},g);speichern();return{code,text:beschreiben(g)};},
  'POST /api/admin/code-loeschen':(req,x)=>{brauchtAdmin(req);const k=codeNorm(x.code);if(!db.codes[k])throw new Fehler(404,'Den Code gibt es nicht.');
    delete db.codes[k];speichern();return{ok:true};},
  'POST /api/admin/abmelden':(req)=>{admins.delete(hash(String(req.headers['x-admin']||'')));return{ok:true};}
};

// ---------- Dateien ----------
const TYP={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const dateien=new Map();
(function laden(dir,pre){for(const n of fs.readdirSync(dir)){const f=path.join(dir,n);if(fs.statSync(f).isDirectory()){laden(f,pre+n+'/');continue;}
  const buf=fs.readFileSync(f),typ=TYP[path.extname(n)]||'application/octet-stream',text=/^(text|application\/(json|manifest))/.test(typ);
  dateien.set('/'+pre+n,{buf,gz:text?zlib.gzipSync(buf,{level:9}):null,typ,etag:'"'+hash(buf).slice(0,16)+'"',
    cache:/^(index\.html|sw\.js|manifest\.webmanifest)$/.test(n)?'no-cache':'public, max-age=86400'});}})(SITE,'');
function datei(req,res,u){let f=dateien.get(u.pathname==='/'?'/index.html':u.pathname);if(!f&&!path.extname(u.pathname))f=dateien.get('/index.html');
  if(!f){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('Nicht gefunden');}
  const h={'content-type':f.typ,'cache-control':f.cache,etag:f.etag,vary:'Accept-Encoding','x-content-type-options':'nosniff'};
  if(req.headers['if-none-match']===f.etag){res.writeHead(304,h);return res.end();}
  const gz=f.gz&&/\bgzip\b/.test(String(req.headers['accept-encoding']||''));if(gz)h['content-encoding']='gzip';
  res.writeHead(200,h);res.end(req.method==='HEAD'?undefined:gz?f.gz:f.buf);}

// ---------- Server ----------
const server=http.createServer((req,res)=>{let u;try{u=new URL(req.url,'http://x');}catch(e){res.writeHead(400);return res.end();}
  if(!u.pathname.startsWith('/api/')){if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}return datei(req,res,u);}
  const senden=(code,obj)=>{const b=JSON.stringify(obj);res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(b);};
  const f=API[req.method+' '+u.pathname];if(!f)return senden(404,{fehler:'Unbekannte Anfrage.'});
  let roh='',zuGross=false;req.setEncoding('utf8');
  req.on('data',c=>{roh+=c;if(roh.length>262144){zuGross=true;req.destroy();}});
  req.on('end',()=>{if(zuGross)return;let x={};if(roh){try{x=JSON.parse(roh);}catch(e){return senden(400,{fehler:'Die Anfrage ist kein gültiges JSON.'});}}
    if(!x||typeof x!=='object')x={};
    try{senden(200,f(req,x));}catch(e){if(e instanceof Fehler)return senden(e.code,{fehler:e.message});console.error(e);senden(500,{fehler:'Fehler auf dem Server.'});}});});
server.listen(PORT,'0.0.0.0',()=>console.log('Galaxy Golf läuft auf Port '+PORT+', '+Object.keys(db.spieler).length+' Spieler, '+Object.keys(db.codes).length+' Codes, Admin '+(ADMIN.length>=8?'eingerichtet':'nicht eingerichtet (GG_ADMIN_PASSWORT mit mindestens 8 Zeichen setzen)')));
function ende(){if(schreibT)jetztSpeichern();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref();}
process.on('SIGTERM',ende);process.on('SIGINT',ende);
