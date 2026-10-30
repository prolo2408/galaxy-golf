// Prüft Spielstand-Logik und Server. Aufruf: node tools/test.cjs   (vorher node tools/build.cjs)
// Erwartungswerte sind von Hand gerechnet, nicht aus dem Code übernommen.
const fs=require("fs"),path=require("path"),os=require("os"),{spawn}=require("child_process"),assert=require("assert");
const W=path.join(__dirname,"..");
const ST=new Function(fs.readFileSync(path.join(W,"src/stand.js"),"utf8")+";return{ITEM,EVENT,AUFG,aufgabenFuer,muenzen,sauber,zusammen,neuerStand,ausAlt,evItems,angebote};")();
let n=0;const ok=(name,fn)=>Promise.resolve().then(fn).then(()=>{n++;console.log("ok  ",name);},e=>{console.error("FEHLER",name,"\n",e);process.exitCode=1;});

async function logik(){
  await ok("Aufgaben: drei verschiedene, jeden Tag gleich",()=>{const a=ST.aufgabenFuer("2026-10-30"),b=ST.aufgabenFuer("2026-10-30");
    assert.deepStrictEqual(a,b);assert.strictEqual(new Set(a).size,3);a.forEach(id=>assert.ok(ST.AUFG[id]));
    const tage=new Set();for(let d=1;d<=28;d++)tage.add(ST.aufgabenFuer("2026-11-"+String(d).padStart(2,"0")).join());assert.ok(tage.size>15,"zu wenig Abwechslung: "+tage.size);});
  await ok("Münzen: Sterne, Ass, Tagesbahn, Aufgabe, Bonus, Kauf",()=>{const s=ST.neuerStand();
    s.best={1:{s:1,st:3,a:1},2:{s:3,st:2}};          // 3·4+15 + 2·4 = 35
    s.tag={"2026-10-30":{s:2,st:2}};                   // 15 + 2·5 = 25
    const id=ST.aufgabenFuer("2026-10-31")[0];s.auf={"2026-10-31":{[id]:ST.AUFG[id].z}}; // + Belohnung
    s.bonus=100;s.own={"k-mond":{w:"kauf",d:"2026-10-31"},"k-kuerbis":{w:"event",d:"2026-10-31"}}; // −150, Event kostet nichts
    assert.strictEqual(ST.muenzen(s),35+25+ST.AUFG[id].m+100-150);});
  await ok("Tagesangebote: drei Sachen, 25 % günstiger, auf zehn gerundet; gezahlt wird der Angebotspreis",()=>{const a=ST.angebote("2026-10-30");
    assert.strictEqual(a.length,3);assert.strictEqual(new Set(a.map(x=>x.id)).size,3);
    for(const x of a){const p=ST.ITEM[x.id].p;assert.ok(x.p<p&&x.p%10===0&&Math.abs(x.p-p*.75)<=5,x.id+" "+x.p);}
    const s=ST.neuerStand();s.bonus=1000;s.own={"k-gold":{w:"kauf",d:"2026-10-30",p:450}};assert.strictEqual(ST.muenzen(s),550);
    assert.strictEqual(ST.sauber(s,420).own["k-gold"].p,450);assert.strictEqual(ST.zusammen(ST.neuerStand(),s).own["k-gold"].p,450);
    s.own["k-gold"].p=600;assert.strictEqual(ST.sauber(s,420).own["k-gold"].p,undefined,"voller Preis wird nicht als Rabatt gespeichert");});
  await ok("Münzen: halbe Aufgabe zählt nicht, fremde Aufgabe zählt nicht",()=>{const s=ST.neuerStand(),d="2026-11-02",ids=ST.aufgabenFuer(d);
    const fremd=Object.keys(ST.AUFG).find(k=>!ids.includes(k));s.auf={[d]:{[ids[0]]:ST.AUFG[ids[0]].z-1,[fremd]:99}};assert.strictEqual(ST.muenzen(s),0);});
  await ok("Zusammenführen: Bestes gewinnt, Besitz vereinigt, Bonus vom Server, Einstellungen vom neueren",()=>{
    const a=ST.neuerStand(),b=ST.neuerStand();a.t=100;b.t=200;a.bonus=500;b.bonus=99999;
    a.best={1:{s:4,st:1},2:{s:2,st:2,a:1}};b.best={1:{s:2,st:3},3:{s:1,st:3,a:1}};a.un=10;b.un=7;
    a.own={"k-gold":{w:"geschenk",d:"2026-10-20"}};b.own={"k-gold":{w:"kauf",d:"2026-10-25"},"s-feuer":{w:"kauf",d:"2026-10-26"}};
    b.eq.s="s-feuer";a.opt.ringe=true;b.opt.ringe=false;a.tag={"2026-10-30":{s:3,st:2}};b.tag={"2026-10-30":{s:1,st:3}};
    const r=ST.zusammen(a,b);
    assert.deepStrictEqual(r.best,{1:{s:2,st:3},2:{s:2,st:2,a:1},3:{s:1,st:3,a:1}});assert.strictEqual(r.un,10);
    assert.deepStrictEqual(r.own["k-gold"],{w:"geschenk",d:"2026-10-20"});assert.ok(r.own["s-feuer"]);
    assert.strictEqual(r.bonus,500);assert.strictEqual(r.eq.s,"s-feuer");assert.strictEqual(r.opt.ringe,false);assert.deepStrictEqual(r.tag["2026-10-30"],{s:1,st:3});});
  await ok("Prüfen: Unbekanntes fliegt raus, Grenzen halten, Angelegtes muss man besitzen",()=>{
    const s=ST.sauber({un:99999,best:{"0":{s:1,st:3},"5":{s:0,st:9,a:1},"9999":{s:1,st:3}},own:{"k-hack":{w:"kauf",d:"2026-10-30"},"k-gold":{w:"kauf",d:"kaputt"}},eq:{k:"k-gold",o:"o-neon"},opt:{ringe:"ja",vib:false}},420);
    assert.strictEqual(s.un,420);assert.deepStrictEqual(s.best,{5:{s:1,st:3,a:1}});assert.deepStrictEqual(s.own,{});
    assert.strictEqual(s.eq.k,"k-standard");assert.strictEqual(s.eq.o,"o-klassisch");assert.strictEqual(s.opt.ringe,true);assert.strictEqual(s.opt.vib,false);});
  await ok("Alter Spielstand: Fortschritt bleibt, freigeschaltet bis drei nach der letzten, Halloween 2026 gehört dazu",()=>{
    const s=ST.ausAlt({un:4,best:{"1":{s:2,st:2},"320":{s:1,st:3}},seen:{start:1,sun:1,quatsch:1},skin:null,cur:319},420,"2026-10-30");
    assert.strictEqual(s.un,323);assert.deepStrictEqual(s.best[320],{s:1,st:3,a:1});assert.deepStrictEqual(s.best[1],{s:2,st:2});
    assert.deepStrictEqual(Object.keys(s.seen).sort(),["start","sun"]);assert.strictEqual(s.cur,319);
    for(const id of ST.evItems("halloween-2026"))assert.deepStrictEqual(s.own[id],{w:"event",d:"2026-10-30"});
    assert.strictEqual(ST.ausAlt({un:3,best:{"1":{s:2,st:2}}},420,"2026-12-01").own["k-kuerbis"].d,"2026-10-28");
    assert.deepStrictEqual(ST.ausAlt({un:3,best:{}},420,"2026-10-30").own,{});});
}

// ---------- Server ----------
const PORT=18000+Math.floor(Math.random()*1000),BASIS="http://127.0.0.1:"+PORT,PW="Kometen-Schweif-7";
let proc,daten;
function starten(env){return new Promise((res,rej)=>{proc=spawn(process.execPath,[path.join(W,"server/server.js")],{env:Object.assign({},process.env,{PORT,DATEN:daten,GG_ADMIN_PASSWORT:PW},env||{}),stdio:["ignore","pipe","pipe"]});
  let out="";proc.stdout.on("data",d=>{out+=d;if(out.includes("läuft"))res(out);});proc.stderr.on("data",d=>out+=d);proc.on("exit",c=>rej(Object.assign(new Error("Server beendet ("+c+"): "+out),{code:c})));});}
const stoppen=()=>new Promise(r=>{proc.removeAllListeners("exit");proc.on("exit",()=>r());proc.kill("SIGTERM");});
async function req(m,p,body,h){const r=await fetch(BASIS+p,{method:m,headers:Object.assign({"content-type":"application/json"},h||{}),body:body&&JSON.stringify(body)});
  const t=await r.text();let j=null;try{j=JSON.parse(t);}catch(e){}return{s:r.status,j,t,h:r.headers};}
const auth=t=>({authorization:"Bearer "+t});
const heute=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin"}).format(new Date());

async function api(){daten=fs.mkdtempSync(path.join(os.tmpdir(),"gg-test-"));await starten();let A,B,admin,code1;
  await ok("Status und Seite",async()=>{const s=await req("GET","/api/status");assert.strictEqual(s.s,200);assert.strictEqual(s.j.n,420);
    const r=await fetch(BASIS+"/",{headers:{"accept-encoding":"gzip"}});assert.strictEqual(r.status,200);assert.match(r.headers.get("cache-control"),/no-cache/);
    assert.match(await r.text(),/Galaxy/);const sw=await fetch(BASIS+"/sw.js");assert.match(sw.headers.get("cache-control"),/no-cache/);
    assert.strictEqual((await fetch(BASIS+"/gibtsnicht.js")).status,404);assert.strictEqual((await fetch(BASIS+"/irgendwo")).status,200);
    assert.strictEqual((await fetch(BASIS+"/../server/server.js")).status,404);/* nur Dateien aus site/ */
    assert.doesNotMatch(await (await fetch(BASIS+"/%2e%2e/server/server.js")).text(),/GG_ADMIN_PASSWORT/);});
  await ok("Konto: Geschenke kann man sich nicht selbst geben, Kauf nur mit genug Münzen",async()=>{
    const stand={best:{"1":{s:2,st:2}},own:{"k-gold":{w:"geschenk",d:heute},"k-mond":{w:"kauf",d:heute},"o-neon":{w:"kauf",d:heute},"k-kuerbis":{w:"event",d:"2026-10-29"},"s-irrlicht":{w:"event",d:"2026-12-24"}},bonus:5000};
    const r=await req("POST","/api/konto",{name:"Artur",pin:"2408",stand});assert.strictEqual(r.s,200,r.t);A=r.j.token;
    // 1 Bahn mit 2 Sternen = 8 Münzen: weder Mondstein (150) noch Neon (1200) sind bezahlbar, Bonus vom Gerät zählt nicht
    assert.deepStrictEqual(Object.keys(r.j.stand.own).sort(),["k-kuerbis"]);assert.strictEqual(r.j.muenzen,8);assert.strictEqual(r.j.stand.bonus,0);});
  await ok("Konto: Name doppelt, Name und PIN ungültig",async()=>{assert.strictEqual((await req("POST","/api/konto",{name:"artur",pin:"1111"})).s,409);
    assert.strictEqual((await req("POST","/api/konto",{name:"<b>",pin:"1111"})).s,400);assert.strictEqual((await req("POST","/api/konto",{name:"Lena",pin:"12"})).s,400);
    const r=await req("POST","/api/konto",{name:"Lena",pin:"1234"});assert.strictEqual(r.s,200);B=r.j.token;});
  await ok("Anmelden: falsche PIN wird gebremst",async()=>{for(let i=0;i<5;i++)assert.strictEqual((await req("POST","/api/anmelden",{name:"Lena",pin:"9999"})).s,403);
    assert.strictEqual((await req("POST","/api/anmelden",{name:"Lena",pin:"1234"})).s,429);assert.strictEqual((await req("POST","/api/anmelden",{name:"artur",pin:"2408"})).s,200);});
  await ok("Sync: Fortschritt kommt dazu, ohne Anmeldung nicht",async()=>{assert.strictEqual((await req("POST","/api/sync",{stand:{}})).s,401);
    const r=await req("POST","/api/sync",{stand:{t:Date.now(),best:{"1":{s:1,st:3,a:1},"2":{s:2,st:2}},un:5}},auth(A));assert.strictEqual(r.s,200,r.t);
    assert.deepStrictEqual(r.j.stand.best,{1:{s:1,st:3,a:1},2:{s:2,st:2}});assert.strictEqual(r.j.muenzen,12+15+8);assert.ok(r.j.stand.own["k-kuerbis"],"Event-Kugel ging verloren");});
  await ok("Codes: falsch, Admin, ohne Admin-Sitzung kein Zugriff",async()=>{assert.strictEqual((await req("POST","/api/code",{code:"GIBTSNICHT"})).s,404);
    assert.strictEqual((await req("GET","/api/admin")).s,401);assert.strictEqual((await req("GET","/api/admin",null,{"x-admin":"rate"})).s,401);
    const r=await req("POST","/api/code",{code:PW});assert.strictEqual(r.s,200);admin={"x-admin":r.j.admin};
    const u=await req("GET","/api/admin",null,admin);assert.strictEqual(u.s,200);assert.deepStrictEqual(u.j.spieler.map(p=>p.name).sort(),["Artur","Lena"]);});
  await ok("Admin: Code erstellen, einlösen, doppelt, aufgebraucht",async()=>{
    assert.strictEqual((await req("POST","/api/admin/code",{muenzen:0},admin)).s,400);
    const c=await req("POST","/api/admin/code",{code:"kürbis 26",muenzen:250,items:["k-gold","e-halloween-2026"],max:1},admin);assert.strictEqual(c.s,200,c.t);code1=c.j.code;assert.strictEqual(code1,"KRBIS-26");
    assert.strictEqual((await req("POST","/api/code",{code:"krbis 26"})).s,401);
    const e=await req("POST","/api/code",{code:"krbis-26"},auth(B));assert.strictEqual(e.s,200,e.t);assert.ok(e.j.stand.own["k-gold"]&&e.j.stand.own["o-halloween"]);
    assert.strictEqual(e.j.stand.own["k-gold"].w,"code");assert.strictEqual(e.j.stand.bonus,250);assert.match(e.j.text,/250 Münzen/);
    assert.strictEqual((await req("POST","/api/code",{code:code1},auth(B))).s,409);assert.strictEqual((await req("POST","/api/code",{code:code1},auth(A))).s,410);});
  await ok("Admin: schenken, alle Bahnen, neue PIN",async()=>{const u=await req("GET","/api/admin",null,admin),lena=u.j.spieler.find(p=>p.name==="Lena");
    assert.strictEqual((await req("POST","/api/admin/schenken",{id:lena.id,muenzen:1000,alleBahnen:true,items:["o-neon","k-quatsch"]},admin)).s,200);
    const s=await req("POST","/api/sync",{stand:{}},auth(B));assert.strictEqual(s.j.stand.un,420);assert.strictEqual(s.j.stand.bonus,1250);assert.strictEqual(s.j.stand.own["o-neon"].w,"geschenk");assert.ok(!s.j.stand.own["k-quatsch"]);
    // Angebot von heute: Angebotspreis; erfundener Rabatt: voller Preis
    const hat=(await req("POST","/api/sync",{stand:{}},auth(B))).j.stand.own,ang=ST.angebote(heute).find(a=>!hat[a.id]&&a.id!=="k-saturn");
    const k1=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[ang.id]:{w:"kauf",d:heute,p:ang.p}}}},auth(B));assert.strictEqual(k1.j.stand.own[ang.id].p,ang.p);assert.strictEqual(k1.j.muenzen,1250-ang.p);
    const fremd=Object.keys(ST.ITEM).find(id=>ST.ITEM[id].p&&!ST.angebote(heute).some(a=>a.id===id)&&id!=="k-saturn");
    const k2=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[fremd]:{w:"kauf",d:heute,p:10}}}},auth(B));assert.strictEqual(k2.j.stand.own[fremd].p,undefined);assert.strictEqual(k2.j.muenzen,1250-ang.p-ST.ITEM[fremd].p);
    await req("POST","/api/admin/schenken",{id:lena.id,muenzen:ang.p+ST.ITEM[fremd].p},admin);
    // Lena kann jetzt mit ihren Münzen kaufen
    const k=await req("POST","/api/sync",{stand:{t:Date.now(),own:{"k-saturn":{w:"kauf",d:heute}},eq:{k:"k-saturn"}}},auth(B));assert.strictEqual(k.j.stand.own["k-saturn"].w,"kauf");assert.strictEqual(k.j.stand.eq.k,"k-saturn");assert.strictEqual(k.j.muenzen,1250-350);
    assert.strictEqual((await req("POST","/api/admin/pin",{id:lena.id,pin:"777777"},admin)).s,200);assert.strictEqual((await req("POST","/api/anmelden",{name:"lena",pin:"777777"})).s,200);});
  await ok("Admin: Code löschen, Abmelden beendet die Sitzung",async()=>{assert.strictEqual((await req("POST","/api/admin/code-loeschen",{code:code1},admin)).s,200);
    assert.strictEqual((await req("POST","/api/code",{code:code1},auth(A))).s,404);
    await req("POST","/api/admin/abmelden",{},admin);assert.strictEqual((await req("GET","/api/admin",null,admin)).s,401);});
  await ok("Codes: zu viele falsche werden gebremst",async()=>{for(let i=0;i<9;i++)await req("POST","/api/code",{code:"FALSCH"+i});
    assert.strictEqual((await req("POST","/api/code",{code:PW})).s,429);});
  await ok("Neustart: alles noch da",async()=>{await stoppen();await starten();const r=await req("POST","/api/sync",{stand:{}},auth(A));assert.strictEqual(r.s,200);assert.strictEqual(r.j.stand.best[1].st,3);});
  await ok("Ohne Admin-Passwort gibt es keinen Admin",async()=>{await stoppen();await starten({GG_ADMIN_PASSWORT:""});assert.strictEqual((await req("POST","/api/code",{code:""})).s,404);});
  await ok("Kaputte Datei: Server startet nicht und überschreibt nichts",async()=>{await stoppen();const f=path.join(daten,"galaxy-golf.json");fs.writeFileSync(f,"{kaputt");
    await assert.rejects(starten(),e=>e.code===1);assert.strictEqual(fs.readFileSync(f,"utf8"),"{kaputt");});
  fs.rmSync(daten,{recursive:true,force:true});}

(async()=>{await logik();await api();console.log(n+" Prüfungen bestanden"+(process.exitCode?", aber es gab Fehler":""));})()
  .catch(e=>{console.error("FEHLER beim Ablauf:",e.message);process.exitCode=1;if(proc)proc.kill();});
