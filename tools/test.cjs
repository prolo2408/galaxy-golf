// Prüft Spielstand-Logik und Server. Aufruf: node tools/test.cjs   (vorher node tools/build.cjs)
// Erwartungswerte sind von Hand gerechnet, nicht aus dem Code übernommen.
const fs=require("fs"),path=require("path"),os=require("os"),{spawn}=require("child_process"),assert=require("assert");
const W=path.join(__dirname,"..");
const NAMEN="ITEM,ITEMS,EVENT,AUFG,AUFG_AB,aufgabenFuer,aufgabenGezaehlt,aufgabenBahnen,muenzen,sauber,zusammen,neuerStand,ausAlt,evItems,angeboteAlt,angebotOk,shopFuer,kaufPreis,imShop,zurueckNach,wiederAm,"+
  "WAUFG,WOCHE_AB,wochenAufgaben,wochenStand,wochenErledigt,serieLaenge,truheOk,truheMoeglich,PASS,PAESSE,xpTag,xpMonat,passStufe,passOk,plusTage,wocheVon,dnum,serieMuenzen,wochenMuenzen,passMuenzen,"+
  "STANDARD,ECO_AB,passBelohnung,passSachen,BOX,banner,boxZuege,boxPity,boxKosten,staubStand,tauschbar,selVon";
const laden=(code,extra)=>new Function(code+(extra||"")+";return{"+NAMEN+"};")();
const ST=laden(fs.readFileSync(path.join(W,"src/stand.js"),"utf8"));
const AG=JSON.parse(fs.readFileSync(path.join(W,"src/aufgaben.json"),"utf8"));
// Fassung vor dem Shop-Wechsel (Commit 283c1c9), um Rückwärtskompatibilität nachzurechnen
const git=c=>require("child_process").execSync("git show "+c+":src/stand.js",{cwd:W,encoding:"utf8",stdio:["ignore","pipe","ignore"]});
let ALT=null;try{ALT=new Function(git("283c1c9")+";return{aufgabenFuer,muenzen,neuerStand};")();}catch(e){}
// Fassung vor Glücksbox und weniger Münzen (Commit 236f1ed)
let VOR=null;try{VOR=new Function(git("236f1ed")+";return{aufgabenFuer,muenzen,neuerStand,shopFuer,wochenAufgaben,sauber,passMuenzen};")();}catch(e){}
const tage=(von,n)=>Array.from({length:n},(_,k)=>ST.plusTage(von,k));
let n=0;const ok=(name,fn)=>Promise.resolve().then(fn).then(()=>{n++;console.log("ok  ",name);},e=>{console.error("FEHLER",name,"\n",e);process.exitCode=1;});

async function logik(){
  await ok("Aufgaben bis 30.10.: genau wie in der alten Fassung",()=>{for(const d of tage("2026-09-01",60)){if(d>="2026-10-31")break;
      assert.strictEqual(ST.aufgabenFuer(d).length,3);if(ALT)assert.deepStrictEqual(ST.aufgabenFuer(d),ALT.aufgabenFuer(d),d);}
    if(!ALT)console.log("     (alte Fassung nicht im Git, Vergleich übersprungen)");});
  await ok("Aufgaben ab 31.10.: eine je Gruppe, jeden Tag gleich, abwechslungsreich, alte zählen weiter",()=>{const v=new Set();
    for(const d of tage("2026-10-31",60)){const a=ST.aufgabenFuer(d);assert.deepStrictEqual(a,ST.aufgabenFuer(d));assert.strictEqual(new Set(a).size,3);
      assert.ok(["b5","st8","ot3"].includes(a[0])&&["tages","en3"].includes(a[1])&&["p3","up2","as1","wu","wi","dp"].includes(a[2]),d+" "+a);
      for(const id of a)assert.ok(ST.aufgabenGezaehlt(d).includes(id));if(ALT)for(const id of ALT.aufgabenFuer(d))assert.ok(ST.aufgabenGezaehlt(d).includes(id),"alte Aufgabe "+id+" am "+d);
      v.add(a.join());}
    assert.ok(v.size>=20,"zu wenig Abwechslung: "+v.size);});
  await ok("Aufgaben mit eigenen Bahnen: jede bringt passende Bahnen mit, jeden Tag andere",()=>{
    const passt={p3:b=>b.par>=3,up2:b=>b.par>=3,as1:b=>b.par===2,wu:b=>!!b.w,wi:b=>!!b.f,dp:b=>b.p.some(q=>q.length>4&&q[4]<0)};
    for(const id in passt){const A=ST.AUFG[id];assert.ok(AG[A.b]&&AG[A.b].length>=30,id);let vor=null;
      for(const d of tage("2026-11-01",20)){const idx=ST.aufgabenBahnen(id,d,AG[A.b].length);assert.strictEqual(idx.length,A.n);
        for(const i of idx)assert.ok(passt[id](AG[A.b][i]),id+" Bahn "+i);assert.notDeepStrictEqual(idx,vor);vor=idx;}}});
  await ok("Münzen: Sterne, Ass, Tagesbahn, Aufgabe, Bonus, Kauf",()=>{const s=ST.neuerStand();
    s.best={1:{s:1,st:3,a:1},2:{s:3,st:2}};          // 3·4+15 + 2·4 = 35
    s.tag={"2026-10-30":{s:2,st:2}};                   // 15 + 2·5 = 25
    const id=ST.aufgabenFuer("2026-10-31")[0];s.auf={"2026-10-31":{[id]:ST.AUFG[id].z}}; // + Belohnung
    s.bonus=100;s.own={"k-mond":{w:"kauf",d:"2026-10-31"},"k-kuerbis":{w:"event",d:"2026-10-31"}}; // −150, Event kostet nichts
    assert.strictEqual(ST.muenzen(s),35+25+ST.AUFG[id].m+100-150);});
  await ok("Rückwärts: alte Spielstände haben genau so viele Münzen wie vorher",()=>{if(!ALT)return;
    const s=ST.neuerStand();s.best={1:{s:1,st:3,a:1},7:{s:2,st:2},40:{s:4,st:1}};s.tag={"2026-10-30":{s:2,st:3},"2026-10-31":{s:3,st:2}};s.bonus=250;
    const d0="2026-10-30",d1="2026-10-31";s.auf={[d0]:Object.fromEntries(ALT.aufgabenFuer(d0).map(id=>[id,ST.AUFG[id].z])),[d1]:Object.fromEntries(ALT.aufgabenFuer(d1).map(id=>[id,ST.AUFG[id].z]))};
    s.own={"k-mond":{w:"kauf",d:d0},"s-feuer":{w:"kauf",d:d1,p:230},"k-kuerbis":{w:"event",d:d0}};
    const a=JSON.parse(JSON.stringify(s));delete a.akt;delete a.login;assert.strictEqual(ST.muenzen(ST.sauber(s,420)),ALT.muenzen(a));});
  await ok("Shop-Wechsel: 4 täglich unter 450, 2 Highlights ab 450, ein Angebot 25 % günstiger",()=>{
    for(const d of tage("2026-10-31",70)){const s=ST.shopFuer(d);assert.strictEqual(s.tag.length,4,d);assert.strictEqual(s.woche.length,2,d);
      assert.strictEqual(new Set([...s.tag,...s.woche]).size,6,d);for(const id of s.tag)assert.ok(ST.ITEM[id].p>0&&ST.ITEM[id].p<450,id);for(const id of s.woche)assert.ok(ST.ITEM[id].p>=450,id);
      assert.ok(s.tag.includes(s.ang));const p=ST.ITEM[s.ang].p;assert.ok(s.angP<p&&s.angP%10===0&&Math.abs(s.angP-p*.75)<=5);
      assert.strictEqual(ST.kaufPreis(s.ang,d),s.angP);assert.ok(ST.angebotOk(s.ang,d,s.angP));assert.ok(!ST.angebotOk(s.ang,d,10));
      if(ST.wocheVon(d)===ST.wocheVon(ST.plusTage(d,1)))assert.deepStrictEqual(s.woche,ST.shopFuer(ST.plusTage(d,1)).woche,"Highlights halten die Woche");}});
  await ok("Shop-Wechsel: alles kommt dran und kommt wieder, Pass- und Event-Sachen nie",()=>{const da={};
    for(const d of tage("2026-11-02",56)){const s=ST.shopFuer(d);for(const id of[...s.tag,...s.woche])da[id]=(da[id]||0)+1;}
    for(const i of ST.ITEMS){if(i.p>0)assert.ok(da[i.id]>=1,"nie im Shop: "+i.id);else assert.ok(!da[i.id],"darf nicht in den Shop: "+i.id);}
    const z=ST.wiederAm("o-neon","2026-11-09");assert.ok(z&&z>"2026-11-09"&&ST.imShop("o-neon",z));
    for(const d of tage("2026-10-20",11))assert.ok(ST.imShop("k-gold",d)===(d<"2026-10-31"||ST.shopFuer(d).woche.includes("k-gold")),"vor dem Wechsel war alles im Shop "+d);});
  await ok("Shop-Wechsel: neue Sache 14 Tage unter Neu, ändert vergangene Tage nicht",()=>{
    const N2=laden(fs.readFileSync(path.join(W,"src/stand.js"),"utf8"),";ITEMS.push({id:'k-test',n:'Test',p:300,neu:'2026-11-10',f:'k'});ITEM['k-test']=ITEMS[ITEMS.length-1];");
    for(const d of tage("2026-10-31",24)){const a=ST.shopFuer(d),b=N2.shopFuer(d);assert.deepStrictEqual([b.tag,b.woche,b.ang],[a.tag,a.woche,a.ang],"Wechsel gleich am "+d);
      assert.strictEqual(b.neu.includes("k-test"),d>="2026-11-10"&&d<"2026-11-24",d);}
    let spaeter=false;for(const d of tage("2026-11-24",30))if(N2.shopFuer(d).tag.includes("k-test"))spaeter=true;assert.ok(spaeter,"kommt danach in den Wechsel");});
  await ok("Angebote alter Geräte: Rabatt vom 30.10. wird weiter anerkannt",()=>{const a=ST.angeboteAlt("2026-10-30")[0];assert.ok(ST.angebotOk(a.id,"2026-10-30",a.p));
    const s=ST.neuerStand();s.bonus=1000;s.own={"k-gold":{w:"kauf",d:"2026-10-30",p:450}};assert.strictEqual(ST.muenzen(s),550);
    assert.strictEqual(ST.sauber(s,420).own["k-gold"].p,450);s.own["k-gold"].p=600;assert.strictEqual(ST.sauber(s,420).own["k-gold"].p,undefined);});
  await ok("Tagesbonus: bis 1.11. 10 bis 40 Münzen und Truhe oder 150, ab 2.11. 5 bis 20 und Truhe oder 80, Lücke fängt neu an",()=>{
    const alt=ST.neuerStand();tage("2026-10-20",7).forEach(d=>alt.login[d]=1);assert.strictEqual(ST.serieMuenzen(alt),10+15+20+25+30+40+150);
    const s=ST.neuerStand();tage("2026-11-02",7).forEach(d=>s.login[d]=1);assert.strictEqual(ST.serieMuenzen(s),5+8+10+12+15+20+80);
    const mix=ST.neuerStand();tage("2026-10-30",4).forEach(d=>mix.login[d]=1);assert.strictEqual(ST.serieMuenzen(mix),10+15+20+12,"der Tag zählt, nicht der Beginn der Serie");
    assert.ok(ST.truheOk(s,"k-komet","2026-11-08"));assert.ok(!ST.truheOk(s,"k-komet","2026-11-07"),"Tag 6 ist keine Truhe");
    assert.ok(!ST.truheOk(s,"o-neon","2026-11-08"),"Legendär nicht");assert.ok(!ST.truheOk(s,"k-prisma","2026-11-08"),"Pass-Sache nicht");
    assert.ok(!ST.truheOk(s,"k-lava","2026-11-08"),"Box-Sache nicht");
    s.own["k-komet"]={w:"serie",d:"2026-11-08"};assert.strictEqual(ST.serieMuenzen(s),70);
    assert.ok(!ST.truheOk(s,"s-feuer","2026-11-08"),"nur eine Sache pro Truhe");
    const t=ST.neuerStand();["2026-11-02","2026-11-03","2026-11-05","2026-11-06"].forEach(d=>t.login[d]=1);assert.strictEqual(ST.serieLaenge(t,"2026-11-06"),2);
    assert.strictEqual(ST.serieMuenzen(t),5+8+5+8);
    const g=ST.neuerStand();tage("2026-11-02",15).forEach(d=>g.login[d]=1);assert.strictEqual(ST.serieMuenzen(g),2*(70+80)+5,"nach Tag 7 geht es mit Tag 1 weiter");});
  await ok("Wochen-Herausforderungen: drei pro Woche ab 2.11., Fortschritt aus der ganzen Woche, 50 Münzen je Stück",()=>{
    assert.deepStrictEqual(ST.wochenErledigt({akt:{},tag:{},login:{},auf:{}},"2026-10-26"),[]);
    for(const w of tage("2026-11-02",70).filter((_,k)=>k%7===0)){const a=ST.wochenAufgaben(w);assert.strictEqual(new Set(a).size,3);a.forEach(id=>assert.ok(ST.WAUFG[id]));}
    const w="2026-11-09",s=ST.neuerStand();tage(w,7).forEach((d,k)=>{s.akt[d]={b:6,s:12,a:k<3?1:0,e:k===2?7:2};s.tag[d]={s:2,st:2};s.login[d]=1;});
    const st=ST.wochenStand(s,w);assert.deepStrictEqual([st.wb,st.ws,st.wa,st.we,st.wt,st.wl],[42,84,3,7,7,7]);

    const erl=ST.wochenErledigt(s,w),soll=ST.wochenAufgaben(w).filter(id=>id!=="wq");assert.deepStrictEqual(erl,soll,"alles außer Tagesaufgaben geschafft");
    assert.strictEqual(ST.wochenMuenzen(s),50*erl.length);
    s.akt[ST.plusTage(w,7)]={b:99,s:99,a:9,e:99};assert.strictEqual(ST.wochenStand(s,w).wb,42,"nächster Montag zählt nicht mit");
    const ohne=JSON.parse(JSON.stringify(s));ohne.akt={};ohne.tag={};ohne.login={};assert.strictEqual(ST.wochenErledigt(ohne,w).length,0);assert.strictEqual(ST.wochenMuenzen(ohne),0);});
  await ok("Sternenpass: XP aus Bahnen (höchstens 250), Aufgaben, Bonus, Woche; Sachen auf ihren Stufen, sonst Münzen",()=>{
    const s=ST.neuerStand(),d="2026-11-03";s.akt[d]={b:10,s:25,a:0,e:0};assert.strictEqual(ST.xpTag(s,d),175);
    s.akt[d]={b:40,s:100,a:0,e:0};assert.strictEqual(ST.xpTag(s,d),250);s.login[d]=1;assert.strictEqual(ST.xpTag(s,d),270);
    const ids=ST.aufgabenFuer(d);s.auf[d]=Object.fromEntries(ids.map(id=>[id,ST.AUFG[id].z]));assert.strictEqual(ST.xpTag(s,d),270+3*40+30);
    assert.strictEqual(ST.xpMonat(s,"2026-11"),420+100*ST.wochenErledigt(s,"2026-11-02").length,"Woche zählt für den Monat ihres Sonntags");
    const v=ST.neuerStand();tage("2026-11-01",30).forEach(t=>v.akt[t]={b:40,s:100,a:0,e:0});      // 30 × 250 = 7500 XP
    assert.ok(ST.passStufe(ST.xpMonat(v,"2026-11"))===30);assert.ok(!ST.passOk(ST.neuerStand(),"k-prisma"));assert.ok(!ST.passOk(v,"k-gold"));
    const nov=["t-sternschnuppe","k-saturn-eis","j-schockwelle","t-kometenjaeger","s-feuer-blau","t-schwerkraft","k-prisma"];
    for(const id of nov){assert.ok(ST.passOk(v,id),id);assert.strictEqual(ST.ITEM[id].pass,"2026-11");assert.ok(!(ST.ITEM[id].p>0)&&!ST.ITEM[id].ev&&!ST.ITEM[id].box,id);}
    assert.deepStrictEqual(Object.values(ST.passSachen("2026-11")).sort(),nov.slice().sort(),"jede Pass-Sache hat genau eine Stufe");
    assert.ok(new Set(nov.map(id=>id[0])).size>=4,"Kugel, Spur, Jubel und Titel");
    // 23 Stufen ohne Sache: Stufe 5 bringt 40, die anderen 22 je 15, Stufe 30 zusätzlich 50
    assert.strictEqual(ST.passMuenzen(v),22*15+40+50,"Münzen aus dem Pass");
    const halb=ST.neuerStand();tage("2026-11-01",2).forEach(t=>halb.akt[t]={b:40,s:100,a:0,e:0});halb.akt["2026-11-03"]={b:10,s:12,a:0,e:0}; // 500 + 110 = 610 XP → Stufe 4
    assert.strictEqual(ST.passStufe(ST.xpMonat(halb,"2026-11")),4);assert.ok(ST.passOk(halb,"t-sternschnuppe"));assert.ok(!ST.passOk(halb,"k-saturn-eis"));assert.ok(!ST.passOk(halb,"k-prisma"));
    assert.strictEqual(ST.passMuenzen(halb),3*15);
    const okt=ST.neuerStand();tage("2026-10-01",31).forEach(t=>okt.akt[t]={b:40,s:100,a:0,e:0});assert.strictEqual(ST.passMuenzen(okt),0,"vor November gibt es keinen Pass");
    // ohne Eintrag: 24 × 15 + 5 × 40 + 50 + 150
    const dez=ST.neuerStand();tage("2026-12-01",30).forEach(t=>dez.akt[t]={b:40,s:100,a:0,e:0});assert.strictEqual(ST.passMuenzen(dez),24*15+5*40+50+150,"ohne eingetragene Pass-Sachen gibt es Münzen");});
  await ok("Weniger Münzen ab 2.11.: Aufgaben, Tagesbahn halb, Sterne und Asse wie bisher, alte Tage unverändert",()=>{
    const halb={b5:10,st8:15,ot3:10,tages:15,en3:15,p3:15,up2:20,as1:20,wu:10,wi:10,dp:10};
    for(const d of tage("2026-11-02",21)){const s=ST.neuerStand();const ids=ST.aufgabenFuer(d);s.auf[d]=Object.fromEntries(ids.map(id=>[id,ST.AUFG[id].z]));
      assert.strictEqual(ST.muenzen(s)-ST.passMuenzen(s),ids.reduce((m,id)=>m+halb[id],0),d+" "+ids);}
    const s=ST.neuerStand();s.tag={"2026-11-01":{s:2,st:3},"2026-11-02":{s:2,st:3},"2026-11-03":{s:5,st:1}};assert.strictEqual(ST.muenzen(s),15+15+8+9+8+3);
    s.best={1:{s:1,st:3,a:1}};assert.strictEqual(ST.muenzen(s),30+17+11+12+15);
    if(!VOR)return console.log("     (Fassung 236f1ed nicht im Git, Vergleich übersprungen)");
    const a=VOR.neuerStand();a.best={1:{s:1,st:3,a:1},9:{s:2,st:2}};a.bonus=300;a.tag={"2026-10-31":{s:2,st:3},"2026-11-01":{s:1,st:3}};
    for(const d of["2026-10-31","2026-11-01"])a.auf[d]=Object.fromEntries(VOR.aufgabenFuer(d).map(id=>[id,ST.AUFG[id].z]));
    tage("2026-10-26",7).forEach(d=>{a.login[d]=1;a.akt[d]={b:8,s:20,a:1,e:3};});a.own={"k-komet":{w:"serie",d:"2026-11-01"},"k-mond":{w:"kauf",d:"2026-10-31"}};
    const x=ST.sauber(JSON.parse(JSON.stringify(a)),420),y=VOR.sauber(JSON.parse(JSON.stringify(a)),420);
    assert.strictEqual(ST.muenzen(x)-ST.passMuenzen(x),VOR.muenzen(y)-VOR.passMuenzen(y),"bis 1.11. gleich viele Münzen (der Pass beginnt erst am 1.11. und ist neu)");});
  await ok("Gleich wie vorher: Shop-Wechsel, Tagesaufgaben und Wochen-Herausforderungen",()=>{if(!VOR)return;
    for(const d of tage("2026-10-31",120)){const a=ST.shopFuer(d),b=VOR.shopFuer(d);assert.deepStrictEqual([a.tag,a.woche,a.neu,a.ang,a.angP],[b.tag,b.woche,b.neu,b.ang,b.angP],"Shop am "+d);
      assert.deepStrictEqual(ST.aufgabenFuer(d),VOR.aufgabenFuer(d),d);if(d>="2026-11-02"&&ST.wocheVon(d)===d)assert.deepStrictEqual(ST.wochenAufgaben(d),VOR.wochenAufgaben(d),d);}});
  await ok("Glücksbox: Banner alle 14 Tage, Hauptgewinn wechselt, nur was es zu dem Zeitpunkt gab",()=>{
    const b0=ST.banner("2026-10-31"),b1=ST.banner("2026-11-16");
    assert.deepStrictEqual([b0.von,b0.bis,b0.top],["2026-10-31","2026-11-15","k-galaxis"]);assert.strictEqual(ST.banner("2026-11-15"),b0);
    assert.deepStrictEqual([b1.von,b1.bis,b1.top],["2026-11-16","2026-11-29","s-milchstrasse"],"neues Legendär ist Hauptgewinn seines ersten Banners");
    assert.strictEqual(ST.banner("2026-11-30").top,"k-galaxis");assert.strictEqual(ST.banner("2026-12-14").top,"s-milchstrasse");
    assert.ok(!b0.pool.legendaer.includes("s-milchstrasse"),"vor ihrem Datum nicht in der Box");
    for(const d of tage("2026-10-31",120).filter((_,k)=>k%14===0)){const B=ST.banner(d),alle=[].concat(...Object.values(B.pool));
      assert.strictEqual(new Set(alle).size,alle.length);assert.ok(B.pool.legendaer.includes(B.top));
      for(const id of alle){const i=ST.ITEM[id];assert.ok(!i.ev&&!i.pass&&id!==ST.STANDARD[id[0]],id);assert.ok(i.box?i.box<=B.von:i.p>0,id);assert.strictEqual(ST.selVon(id),Object.keys(B.pool).find(k=>B.pool[k].includes(id)));}
      for(const i of ST.ITEMS)if(i.p>0&&!i.neu)assert.ok(alle.includes(i.id),"Shop-Sache fehlt: "+i.id);}
    const N2=laden(fs.readFileSync(path.join(W,"src/stand.js"),"utf8"),";ITEMS.push({id:'k-neu',n:'Neu',p:300,neu:'2026-11-23',f:'k'});ITEM['k-neu']=ITEMS[ITEMS.length-1];");
    assert.ok(!N2.banner("2026-11-30").pool.selten.includes("k-neu"),"neue Shop-Sache erst nach ihren 14 Tagen unter Neu");
    assert.ok(N2.banner("2026-12-14").pool.selten.includes("k-neu"));
    const sb=s=>{const z=ST.neuerStand();z.box.z=s;return z;};
    assert.deepStrictEqual(N2.boxZuege(sb([{d:"2026-11-20",t:1,n:10,u:"test1"}])).map(r=>r.id),ST.boxZuege(sb([{d:"2026-11-20",t:1,n:10,u:"test1"}])).map(r=>r.id),"neue Sachen ändern laufende Banner nicht");});
  await ok("Glücksbox: kostet Münzen, gleiche Ziehung gleiches Ergebnis, Garantien halten, 50/50 mit Garantie",()=>{
    const s=ST.neuerStand();s.bonus=10000;s.box.z=[{d:"2026-11-03",t:5,n:1,u:"aaaa1"},{d:"2026-11-03",t:6,n:10,u:"aaaa2"}];assert.strictEqual(ST.muenzen(s),10000-100-900);
    const a=ST.boxZuege(s);assert.strictEqual(a.length,11);s.box.z.reverse();assert.deepStrictEqual(ST.boxZuege(s).map(r=>r.id),a.map(r=>r.id),"Reihenfolge kommt aus der Zeit");
    const v=ST.neuerStand();for(let i=0;i<3000;i++)v.box.z.push({d:ST.plusTage("2026-10-31",i%100),t:i,n:10,u:"v"+i});
    const z=ST.boxZuege(v),zahl={};let ohneL=0,ohneE=0,maxL=0,maxE=0,top=0,leg=0,nachVerlust=0,verloren=0,vorher=null;
    for(const r of z){zahl[r.sel]=(zahl[r.sel]||0)+1;if(r.sel==="legendaer"){maxL=Math.max(maxL,ohneL+1);ohneL=0;leg++;if(r.top)top++;
        if(vorher===false){verloren++;if(r.top)nachVerlust++;}vorher=r.top;}else ohneL++;
      if(r.sel==="legendaer"||r.sel==="episch"){maxE=Math.max(maxE,ohneE+1);ohneE=0;}else ohneE++;}
    assert.ok(maxL<=40,"spätestens die 40. ist legendär: "+maxL);assert.ok(maxE<=10,"spätestens die 10. ist episch: "+maxE);assert.strictEqual(nachVerlust,verloren,"nach verlorenem 50/50 kommt sicher der Hauptgewinn");
    const q=k=>(zahl[k]||0)/z.length;assert.ok(q("legendaer")>.025&&q("legendaer")<.05,"Legendär "+q("legendaer"));assert.ok(q("episch")>.1&&q("episch")<.16,"Episch "+q("episch"));
    assert.ok(q("selten")>.25&&q("selten")<.33);assert.ok(top/leg>.6&&top/leg<.72,"Hauptgewinn "+top/leg);
    const p=ST.boxPity(v);assert.ok(p.leg>=1&&p.leg<=40&&p.epi>=1&&p.epi<=10);});
  await ok("Glücksbox: Neues ins Inventar, Doppeltes wird Sternenstaub, Tausch kostet Staub, Geräte zusammen",()=>{
    const s=ST.neuerStand();s.box.z=[{d:"2026-11-03",t:1,n:10,u:"bbbb1"},{d:"2026-11-03",t:2,n:10,u:"bbbb2"}];
    s.own["k-mond"]={w:"kauf",d:"2026-11-01"};const r=ST.boxZuege(s),c=ST.sauber(JSON.parse(JSON.stringify(s)),420),seen=new Set();let staub=0;
    for(const x of r){const dopp=seen.has(x.id)||x.id==="k-mond";seen.add(x.id);assert.strictEqual(x.neu,!dopp,x.id);assert.strictEqual(x.staub,dopp?ST.BOX.staub[x.sel]:0);staub+=x.staub;
      if(!dopp)assert.deepStrictEqual(c.own[x.id],{w:"box",d:"2026-11-03"});}
    assert.strictEqual(c.own["k-mond"].w,"kauf");assert.strictEqual(ST.staubStand(c),staub);
    const f=ST.sauber({own:{"k-galaxis":{w:"box",d:"2026-11-03"}},eq:{k:"k-galaxis"}},420);assert.ok(!f.own["k-galaxis"],"ohne Ziehung keine Box-Sache");assert.strictEqual(f.eq.k,"k-standard");
    const ausBox=Object.keys(c.own).sort(),tid=["l-pulsar","j-feuerwerk","k-lava","j-sternregen"].find(id=>!c.own[id]);
    const t=JSON.parse(JSON.stringify(c));t.own[tid]={w:"staub",d:"2026-11-04"};assert.strictEqual(ST.staubStand(t),staub-ST.BOX.tausch[ST.selVon(tid)]);
    assert.ok(ST.tauschbar("k-lava","2026-11-04")&&!ST.tauschbar("s-milchstrasse","2026-11-04")&&ST.tauschbar("s-milchstrasse","2026-11-16")&&!ST.tauschbar("k-gold","2026-11-04")&&!ST.tauschbar("k-prisma","2026-11-30"));
    const a=ST.neuerStand(),b=ST.neuerStand();a.box.z=[{d:"2026-11-03",t:1,n:10,u:"bbbb1"}];b.box.z=[{d:"2026-11-03",t:1,n:10,u:"bbbb1"},{d:"2026-11-03",t:2,n:10,u:"bbbb2"}];b.own["k-mond"]={w:"kauf",d:"2026-11-01"};
    const m=ST.zusammen(ST.sauber(a,420),ST.sauber(b,420));assert.strictEqual(m.box.z.length,2,"keine Ziehung doppelt");assert.deepStrictEqual(Object.keys(m.own).sort(),ausBox);
    // Box früher als Kauf auf dem anderen Gerät: die Box gilt, der Kauf kostet nichts
    const id=r.find(x=>x.neu&&ST.ITEM[x.id].p>0).id,k=ST.neuerStand();k.own[id]={w:"kauf",d:"2026-11-05"};k.bonus=5000;
    const m2=ST.zusammen(ST.sauber(k,420),ST.sauber(b,420));assert.strictEqual(m2.own[id].w,"box");assert.strictEqual(ST.muenzen(m2),5000-1800-150,"Bonus, zwei Zehner, Mondstein");
    const kaputt=ST.sauber({box:{z:[{d:"2026-10-01",t:1,n:1,u:"cccc1"},{d:"2026-11-03",t:1,n:3,u:"cccc2"},{d:"2026-11-03",t:1,n:1,u:"<b>"},{d:"2026-11-03",t:1,n:1,u:"cccc3"},{d:"2026-11-03",t:2,n:1,u:"cccc3"}]}},420);
    assert.deepStrictEqual(kaputt.box.z.map(g=>g.u),["cccc3"],"vor dem Start, falsche Anzahl, falsche ID und doppelte fliegen raus");});
  await ok("Zusammenführen: Bestes gewinnt, Besitz vereinigt, Bonus vom Server, Einstellungen vom neueren, Tagesleistung und Bonus-Tage",()=>{
    const a=ST.neuerStand(),b=ST.neuerStand();a.t=100;b.t=200;a.bonus=500;b.bonus=99999;
    a.best={1:{s:4,st:1},2:{s:2,st:2,a:1}};b.best={1:{s:2,st:3},3:{s:1,st:3,a:1}};a.un=10;b.un=7;
    a.own={"k-gold":{w:"geschenk",d:"2026-10-20"}};b.own={"k-gold":{w:"kauf",d:"2026-10-25"},"s-feuer":{w:"kauf",d:"2026-10-26"}};
    b.eq.s="s-feuer";a.opt.ringe=true;b.opt.ringe=false;a.tag={"2026-10-30":{s:3,st:2}};b.tag={"2026-10-30":{s:1,st:3}};
    a.akt={"2026-11-02":{b:3,s:5,a:1,e:0}};b.akt={"2026-11-02":{b:2,s:7,a:0,e:4},"2026-11-03":{b:1,s:1,a:0,e:0}};a.login={"2026-11-02":1};b.login={"2026-11-03":1};
    const r=ST.zusammen(a,b);
    assert.deepStrictEqual(r.best,{1:{s:2,st:3},2:{s:2,st:2,a:1},3:{s:1,st:3,a:1}});assert.strictEqual(r.un,10);
    assert.deepStrictEqual(r.own["k-gold"],{w:"geschenk",d:"2026-10-20"});assert.ok(r.own["s-feuer"]);
    assert.strictEqual(r.bonus,500);assert.strictEqual(r.eq.s,"s-feuer");assert.strictEqual(r.opt.ringe,false);assert.deepStrictEqual(r.tag["2026-10-30"],{s:1,st:3});
    assert.deepStrictEqual(r.akt,{"2026-11-02":{b:3,s:7,a:1,e:4},"2026-11-03":{b:1,s:1,a:0,e:0}});assert.deepStrictEqual(r.login,{"2026-11-02":1,"2026-11-03":1});});
  await ok("Alte Stände vom Server ohne Box, Jubel, Titel und Ton lassen sich zusammenführen",()=>{
    const alt={t:5,un:3,best:{},seen:{},cur:0,own:{"k-mond":{w:"kauf",d:"2026-10-30"}},eq:{k:"k-mond",s:"s-standard",l:"l-standard",o:"o-klassisch"},tag:{},auf:{},akt:{},login:{},endl:{best:0},opt:{ringe:true,vorschau:false,vib:true},auto:null,bonus:500};
    const r=ST.zusammen(alt,ST.neuerStand());assert.deepStrictEqual([r.eq.k,r.eq.j,r.eq.t,r.opt.vorschau,r.opt.musik,r.opt.effekte],["k-mond","j-funken","t-keiner",false,true,true]);
    assert.deepStrictEqual(r.box.z,[]);assert.strictEqual(ST.muenzen(r),500-150);});
  await ok("Prüfen: Unbekanntes fliegt raus, Grenzen halten, Angelegtes muss man besitzen",()=>{
    const s=ST.sauber({un:99999,best:{"0":{s:1,st:3},"5":{s:0,st:9,a:1},"9999":{s:1,st:3}},own:{"k-hack":{w:"kauf",d:"2026-10-30"},"k-gold":{w:"kauf",d:"kaputt"},"k-mond":{w:"hack",d:"2026-11-01"}},eq:{k:"k-gold",o:"o-neon"},opt:{ringe:"ja",vib:false},
      akt:{"2026-11-01":{b:9999,s:-4,a:"x",e:3},"kaputt":{b:1}},login:{"2026-11-01":1,"2026-11-02":0,"nix":1}},420);
    assert.strictEqual(s.un,420);assert.deepStrictEqual(s.best,{5:{s:1,st:3,a:1}});assert.deepStrictEqual(s.own,{});
    assert.strictEqual(s.eq.k,"k-standard");assert.strictEqual(s.eq.o,"o-klassisch");assert.strictEqual(s.opt.ringe,true);assert.strictEqual(s.opt.vib,false);
    assert.deepStrictEqual([s.eq.j,s.eq.t,s.opt.musik,s.opt.effekte],["j-funken","t-keiner",true,true],"neue Fächer und Töne an");
    assert.strictEqual(ST.sauber({eq:{j:"j-konfetti",t:"t-kometenjaeger"},opt:{musik:false}},420).eq.j,"j-funken");assert.strictEqual(ST.sauber({opt:{musik:false}},420).opt.musik,false);
    assert.deepStrictEqual(s.akt,{"2026-11-01":{b:500,s:0,a:0,e:3}});assert.deepStrictEqual(s.login,{"2026-11-01":1});});
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
    const sh=ST.shopFuer(heute),ang={id:sh.ang,p:sh.angP},fremd=sh.tag.find(id=>id!==ang.id),kauf=["k-saturn","k-komet","s-plasma"].find(id=>id!==ang.id&&id!==fremd);
    const k1=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[ang.id]:{w:"kauf",d:heute,p:ang.p}}}},auth(B));assert.strictEqual(k1.j.stand.own[ang.id].p,ang.p);assert.strictEqual(k1.j.muenzen,1250-ang.p);
    const k2=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[fremd]:{w:"kauf",d:heute,p:10}}}},auth(B));assert.strictEqual(k2.j.stand.own[fremd].p,undefined);assert.strictEqual(k2.j.muenzen,1250-ang.p-ST.ITEM[fremd].p);
    await req("POST","/api/admin/schenken",{id:lena.id,muenzen:ang.p+ST.ITEM[fremd].p},admin);
    // Lena kann jetzt mit ihren Münzen kaufen
    const k=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[kauf]:{w:"kauf",d:heute}},eq:{[kauf[0]]:kauf}}},auth(B));assert.strictEqual(k.j.stand.own[kauf].w,"kauf");assert.strictEqual(k.j.stand.eq[kauf[0]],kauf);assert.strictEqual(k.j.muenzen,1250-ST.ITEM[kauf].p);
    assert.strictEqual((await req("POST","/api/admin/pin",{id:lena.id,pin:"777777"},admin)).s,200);assert.strictEqual((await req("POST","/api/anmelden",{name:"lena",pin:"777777"})).s,200);});
  await ok("Truhe und Sternenpass: nur, was man sich verdient hat",async()=>{
    const ohne=await req("POST","/api/sync",{stand:{t:Date.now(),own:{"k-komet":{w:"serie",d:heute},"k-prisma":{w:"pass",d:heute}},eq:{k:"k-prisma"}}},auth(A));
    assert.ok(!ohne.j.stand.own["k-komet"]&&!ohne.j.stand.own["k-prisma"]);assert.strictEqual(ohne.j.stand.eq.k,"k-standard");
    const login={};for(let k=0;k<7;k++)login[ST.plusTage(heute,-k)]=1;const m0=ohne.j.muenzen;
    const mit=await req("POST","/api/sync",{stand:{t:Date.now(),login,own:{"k-komet":{w:"serie",d:heute},"o-neon":{w:"serie",d:ST.plusTage(heute,-1)}}}},auth(A));
    assert.strictEqual(mit.j.stand.own["k-komet"].w,"serie");assert.ok(!mit.j.stand.own["o-neon"],"Legendär und Tag 6 gibt es nicht aus der Truhe");
    assert.ok(mit.j.muenzen>=m0+140,"Tag 1 bis 6 bringen 140 Münzen");
    const zwei=await req("POST","/api/sync",{stand:{t:Date.now(),own:{"s-feuer":{w:"serie",d:heute}}}},auth(A));assert.ok(!zwei.j.stand.own["s-feuer"],"eine Sache pro Truhe");});
  await ok("Rangliste: nur mit Konto, wenigste Schläge zuerst, heute und gestern",async()=>{assert.strictEqual((await req("GET","/api/rangliste")).s,401);
    await req("POST","/api/sync",{stand:{t:Date.now(),tag:{[heute]:{s:4,st:1}}}},auth(A));await req("POST","/api/sync",{stand:{t:Date.now(),tag:{[heute]:{s:2,st:2}}}},auth(B));
    const r=await req("GET","/api/rangliste",null,auth(A));assert.strictEqual(r.s,200,r.t);assert.strictEqual(r.j.tage.length,2);assert.strictEqual(r.j.tage[0].tag,heute);
    assert.deepStrictEqual(r.j.tage[0].liste.map(e=>[e.name,e.s,e.ich]),[["Lena",2,false],["Artur",4,true]]);assert.deepStrictEqual(r.j.tage[1].liste,[]);});
  await ok("Glücksbox auf dem Server: nur mit genug Münzen, Ergebnis nachgerechnet, Tausch nur mit genug Staub, Titel in der Rangliste",async()=>{
    const k=await req("POST","/api/konto",{name:"Mira",pin:"4321",stand:{}});assert.strictEqual(k.s,200,k.t);const M=k.j.token;
    const z1=[{d:heute,t:Date.now(),n:10,u:"mira0001"}];
    const arm=await req("POST","/api/sync",{stand:{t:Date.now(),box:{z:z1}}},auth(M));assert.strictEqual(arm.j.stand.box.z.length,0,"ohne Münzen keine Ziehung");assert.strictEqual(arm.j.muenzen,0);
    const u=await req("GET","/api/admin",null,admin),mira=u.j.spieler.find(p=>p.name==="Mira");
    await req("POST","/api/admin/schenken",{id:mira.id,muenzen:1000,items:["t-kometenjaeger"]},admin);
    const fake=ST.ITEMS.find(i=>i.box&&!ST.boxZuege({box:{z:z1},own:{}}).some(r=>r.id===i.id&&r.neu)).id;
    const r=await req("POST","/api/sync",{stand:{t:Date.now(),box:{z:z1},own:{[fake]:{w:"box",d:heute}}}},auth(M));
    assert.strictEqual(r.j.stand.box.z.length,1);assert.strictEqual(r.j.muenzen,100);
    const soll=new Set(ST.boxZuege({box:{z:z1},own:{}}).filter(x=>x.neu).map(x=>x.id)),ist=Object.keys(r.j.stand.own).filter(id=>r.j.stand.own[id].w==="box");
    assert.deepStrictEqual(ist.sort(),[...soll].sort(),"Box-Sachen genau wie nachgerechnet");assert.ok(!r.j.stand.own[fake]||soll.has(fake),"erfundene Box-Sache fliegt raus");
    const zu=await req("POST","/api/sync",{stand:{t:Date.now(),box:{z:[{d:heute,t:Date.now()+1,n:10,u:"mira0002"},{d:ST.plusTage(heute,3),t:Date.now(),n:1,u:"mira0003"}]}}},auth(M));
    assert.strictEqual(zu.j.stand.box.z.length,1,"zu teuer und Zukunft fliegen raus");assert.strictEqual(zu.j.muenzen,100);
    const staub=ST.staubStand(r.j.stand),teuer=["l-pulsar","j-feuerwerk"].find(id=>!r.j.stand.own[id]&&ST.BOX.tausch.episch>staub);
    if(teuer){const t=await req("POST","/api/sync",{stand:{t:Date.now(),own:{[teuer]:{w:"staub",d:heute}}}},auth(M));assert.ok(!t.j.stand.own[teuer],"zu wenig Sternenstaub");}
    const nb=await req("POST","/api/sync",{stand:{t:Date.now(),own:{"s-milchstrasse":{w:"staub",d:heute}}}},auth(M));assert.ok(!nb.j.stand.own["s-milchstrasse"]||nb.j.stand.own["s-milchstrasse"].w==="box","vor ihrem Datum nicht tauschbar");
    const ti=await req("POST","/api/sync",{stand:{t:Date.now()+5,own:{"t-kometenjaeger":{w:"geschenk",d:heute},"j-schockwelle":{w:"pass",d:heute}},eq:{t:"t-kometenjaeger",j:"j-schockwelle"},tag:{[heute]:{s:3,st:2}}}},auth(M));
    assert.strictEqual(ti.j.stand.eq.t,"t-kometenjaeger");assert.strictEqual(ti.j.stand.eq.j,"j-funken","Jubel aus dem Pass muss man erst verdienen");assert.ok(!ti.j.stand.own["j-schockwelle"]);
    const rl=await req("GET","/api/rangliste",null,auth(A));const e=rl.j.tage[0].liste.find(x=>x.name==="Mira");assert.strictEqual(e.titel,"t-kometenjaeger");
    assert.strictEqual(rl.j.tage[0].liste.find(x=>x.name==="Artur").titel,undefined);});
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
