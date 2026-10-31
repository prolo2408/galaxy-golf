// Ton: Musik passend zum Look und Geräusche, alles im Browser erzeugt (Web Audio), ohne Dateien.
// Musik und Geräusche lassen sich getrennt abschalten (st.opt.musik, st.opt.effekte). Start erst nach der ersten Berührung,
// so wollen es die Browser. Ist die Seite verdeckt, schweigt alles.
const TON=(()=>{
  let stil=null,stilId='',naechste=0,schritt=0,timer=0,an={musik:true,effekte:true};
  const hz=m=>440*Math.pow(2,(m-69)/12),zufall=a=>a[Math.floor(Math.random()*a.length)];

  // Aufbau: Musik und Geräusche auf eigenen Reglern, beide mit etwas Hall, am Ende ein Begrenzer gegen Übersteuern
  function bauen(c){const o={c};o.aus=c.createDynamicsCompressor();o.aus.threshold.value=-10;o.aus.ratio.value=6;o.aus.attack.value=.004;o.aus.release.value=.25;o.aus.connect(c.destination);
    o.musik=c.createGain();o.musik.gain.value=.55;o.musik.connect(o.aus);o.sfx=c.createGain();o.sfx.gain.value=.8;o.sfx.connect(o.aus);
    const hall=c.createConvolver(),n=Math.floor(c.sampleRate*2.6),b=c.createBuffer(2,n,c.sampleRate);
    for(let k=0;k<2;k++){const d=b.getChannelData(k);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2);}
    hall.buffer=b;o.hallIn=c.createGain();o.hallIn.gain.value=.5;const hg=c.createGain();hg.gain.value=.6;o.hallIn.connect(hall);hall.connect(hg);hg.connect(o.aus);
    const rb=c.createBuffer(1,c.sampleRate,c.sampleRate),rd=rb.getChannelData(0);for(let i=0;i<rd.length;i++)rd[i]=Math.random()*2-1;o.rausch=rb;return o;}
  let A=null;// aktueller Aufbau {c,aus,musik,sfx,hallIn,rausch}

  // ---------- Klangbausteine ----------
  function env(g,t,vol,att,dauer,rel){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.setValueAtTime(vol,t+Math.max(att,dauer));g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(att,dauer)+rel);}
  function osc(typ,f,t,ende){const o=A.c.createOscillator();o.type=typ;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(ende+.05);return o;}
  function ziel(knoten,bus,hall){knoten.connect(bus);if(hall){const s=A.c.createGain();s.gain.value=hall;knoten.connect(s);s.connect(A.hallIn);}}
  // Fläche: zwei leicht verstimmte Oszillatoren je Ton durch einen weichen Tiefpass
  function flaeche(noten,t,dauer,o){o=o||{};const g=A.c.createGain(),lp=A.c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(o.lp||900,t);lp.Q.value=.5;
    if(o.lfo){const l=A.c.createOscillator(),lg=A.c.createGain();l.frequency.value=o.lfo;lg.gain.value=(o.lp||900)*.4;l.connect(lg);lg.connect(lp.frequency);l.start(t);l.stop(t+dauer+(o.rel||2.5)+.1);}
    env(g,t,o.vol||.05,o.att||1.6,dauer,o.rel||2.5);lp.connect(g);ziel(g,A.musik,o.hall==null?.7:o.hall);
    for(const m of noten)for(const d of[-6,6]){const v=osc(o.typ||'sawtooth',hz(m),t,t+dauer+(o.rel||2.5));v.detune.value=d;v.connect(lp);}}
  // Glocke: Grundton und ein unharmonischer Oberton, langsames Ausklingen
  function glocke(m,t,vol,bus,hall,lang){const g=A.c.createGain(),f=hz(m),d=lang||2.2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    ziel(g,bus||A.musik,hall==null?.8:hall);const a=osc('sine',f,t,t+d),b=osc('sine',f*2.76,t,t+d*.5),bg=A.c.createGain();bg.gain.setValueAtTime(.35,t);bg.gain.exponentialRampToValueAtTime(.0001,t+d*.5);a.connect(g);b.connect(bg);bg.connect(g);}
  // f0 in Hertz (Noten mit hz() umrechnen)
  function ton(typ,f0,t,dauer,vol,o){o=o||{};const g=A.c.createGain();env(g,t,vol,o.att||.005,dauer,o.rel||.12);let n=g;
    if(o.lp){const f=A.c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);f.Q.value=o.q||.7;if(o.lpZiel)f.frequency.exponentialRampToValueAtTime(o.lpZiel,t+dauer+(o.rel||.12));f.connect(g);n=f;}
    ziel(g,o.bus||A.musik,o.hall||0);const v=osc(typ,f0,t,t+dauer+(o.rel||.12));if(o.gleit)v.frequency.exponentialRampToValueAtTime(o.gleit,t+dauer);if(o.vib){const l=A.c.createOscillator(),lg=A.c.createGain();l.frequency.value=o.vib;lg.gain.value=o.vibT||8;l.connect(lg);lg.connect(v.detune);l.start(t);l.stop(t+dauer+(o.rel||.12)+.1);}v.connect(n);}
  function rauschen(t,dauer,vol,typ,f,o){o=o||{};const s=A.c.createBufferSource();s.buffer=A.rausch;s.loop=true;const fl=A.c.createBiquadFilter();fl.type=typ;fl.frequency.setValueAtTime(f,t);fl.Q.value=o.q||.8;
    if(o.ziel)fl.frequency.exponentialRampToValueAtTime(o.ziel,t+dauer);const g=A.c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(o.att||.004));g.gain.exponentialRampToValueAtTime(.0001,t+dauer);
    s.connect(fl);fl.connect(g);ziel(g,o.bus||A.musik,o.hall||0);s.start(t);s.stop(t+dauer+.05);}
  function kick(t,vol){const g=A.c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.32);ziel(g,A.musik,0);const o=osc('sine',130,t,t+.35);o.frequency.exponentialRampToValueAtTime(42,t+.14);o.connect(g);}

  // ---------- Musik je Look ----------
  // step(i,t,d): i = Sechzehntel seit Beginn, t = Startzeit, d = Länge eines Sechzehntels
  const STILE={
    // Klassisch: ruhige Weltraumfläche, darüber vereinzelte Glockentöne
    klassisch:{bpm:60,akk:[[57,60,64],[53,57,60],[48,52,55,59],[55,59,62]],glo:[69,72,74,76,79,81,84],
      step(i,t,d){const takt=Math.floor(i/16);if(i%32===0){const a=this.akk[(takt/2)%4];flaeche(a,t,d*32-1,{lp:700,vol:.045,lfo:.07});flaeche([a[0]-12],t,d*32-1,{typ:'triangle',vol:.06,lp:400,hall:.3});}
        if(Math.random()<.11)glocke(zufall(this.glo),t,.05+Math.random()*.03);}},
    // Halloween: dunkle Moll-Fläche, ein schwebender Theremin-Ton und eine Spieluhr
    halloween:{bpm:58,akk:[[50,53,57],[46,50,53],[43,46,50],[45,49,52]],uhr:[74,76,77,79,81,82,85,86],
      step(i,t,d){const takt=Math.floor(i/16);if(i%32===0){const a=this.akk[(takt/2)%4];flaeche(a,t,d*32-1,{lp:520,vol:.05,lfo:.11,typ:'sawtooth'});flaeche([a[0]-24],t,d*32-1,{typ:'sine',vol:.09,lp:300,hall:.2});}
        if(i%16===8&&Math.random()<.6){const m=zufall([62,65,69,70,72,74]);ton('sine',hz(m),t,d*10,.035,{att:.6,rel:1.4,vib:5.5,vibT:22,gleit:hz(m+(Math.random()<.5?-2:3)),hall:.9});}
        if(i%2===0&&Math.random()<.16)glocke(zufall(this.uhr),t,.035,A.musik,.9,1.6);}},
    // Neon: Synthwave mit Bass in Achteln, Schlagzeug und Arpeggio
    neon:{bpm:100,akk:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],
      step(i,t,d){const takt=Math.floor(i/16),a=this.akk[takt%4],s=i%16;
        if(s===0)flaeche(a.map(m=>m+12),t,d*16-.2,{lp:1600,vol:.022,att:.4,rel:.8,lfo:.25,hall:.5});
        if(s%4===0)kick(t,.38);if(s===4||s===12){rauschen(t,.16,.16,'highpass',1500);ton('triangle',190,t,.05,.08,{rel:.08});}
        if(s%2===1)rauschen(t,.045,.05,'highpass',7500);
        if(s%2===0)ton('sawtooth',hz(a[0]-24+(s%4===2?12:0)),t,d*1.6,.07,{lp:520,lpZiel:220,rel:.06});
        const arp=[0,1,2,1];ton('square',hz(a[arp[s%4]]+12+(s>=8?12:0)),t,d*.7,.016,{lp:2400,rel:.05,hall:.4});}},
    // Nebula: träumerisch, große Septakkorde und funkelnde Töne
    nebula:{bpm:54,akk:[[53,57,60,64],[57,60,64,67],[50,53,57,60],[55,59,62,64]],glo:[77,79,81,83,84,86,88],
      step(i,t,d){const takt=Math.floor(i/16);if(i%32===0){const a=this.akk[(takt/2)%4];flaeche(a,t,d*32-1,{lp:1100,vol:.035,typ:'triangle',att:2.4,rel:3,lfo:.05});flaeche([a[0]-12],t,d*32-1,{typ:'sine',vol:.07,lp:300});}
        if(Math.random()<.13){const m=zufall(this.glo);glocke(m,t,.03);if(Math.random()<.4)glocke(m+12,t+d*2,.018);}}},
    // Frost: Glockenspiel über einer dünnen, klaren Fläche
    frost:{bpm:66,akk:[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],glo:[72,74,76,79,81,84,86,88,91],
      step(i,t,d){const takt=Math.floor(i/16);if(i%32===0){const a=this.akk[(takt/2)%4];flaeche(a,t,d*32-1,{lp:1400,vol:.034,typ:'sine',att:2,rel:3});}
        if(i%2===0&&Math.random()<.24)glocke(zufall(this.glo),t,.065+Math.random()*.03,A.musik,1,3);}}
  };
  const STIL_VON={'o-klassisch':'klassisch','o-halloween':'halloween','o-neon':'neon','o-nebula':'nebula','o-frost':'frost'};
  function planen(){if(!A||A.c.state!=='running'||!an.musik||!stil)return;const d=60/stil.bpm/4;
    if(naechste<A.c.currentTime)naechste=A.c.currentTime+.05;while(naechste<A.c.currentTime+.35){stil.step(schritt,naechste,d);naechste+=d;schritt++;}}

  // ---------- Geräusche ----------
  const SFX={
    // Abschlag: Luftzug, kräftiger je nach Schwung
    schuss(t,k){k=k==null?.6:k;rauschen(t,.28+k*.2,.12+k*.18,'bandpass',600,{ziel:2600+k*2000,q:1.2,bus:A.sfx,att:.02});ton('sine',160+k*60,t,.05,.22,{rel:.09,gleit:70,bus:A.sfx});},
    // Einlochen: Plopp und ein heller Akkord nach oben
    loch(t){ton('sine',700,t,.1,.35,{gleit:170,rel:.08,bus:A.sfx});[72,76,79,84].forEach((m,k)=>glocke(m,t+.09+k*.07,.11,A.sfx,.6,1.2));},
    stern(t,k){glocke(76+[0,3,8][k%3],t,.12,A.sfx,.5,1);ton('triangle',hz(88+[0,3,8][k%3]),t,.04,.05,{rel:.2,bus:A.sfx});},
    aufschlag(t){ton('sine',110,t,.09,.4,{gleit:45,rel:.15,bus:A.sfx});rauschen(t,.22,.25,'lowpass',900,{ziel:200,bus:A.sfx});},
    verglueht(t){rauschen(t,.7,.22,'highpass',900,{ziel:5200,bus:A.sfx,att:.03});ton('sawtooth',220,t,.35,.06,{gleit:60,lp:900,rel:.2,bus:A.sfx});},
    weg(t){ton('sine',880,t,.5,.12,{gleit:180,rel:.2,bus:A.sfx,vib:7,vibT:30});},
    wurmloch(t){ton('sine',300,t,.25,.16,{gleit:1300,rel:.25,bus:A.sfx,vib:9,vibT:40,hall:.6});ton('sine',1300,t+.25,.25,.1,{gleit:300,rel:.25,bus:A.sfx,hall:.6});},
    muenzen(t){ton('square',hz(95),t,.05,.09,{lp:5000,rel:.08,bus:A.sfx});ton('square',hz(100),t+.07,.18,.09,{lp:5000,rel:.25,bus:A.sfx,hall:.3});},
    kauf(t){[67,71,74,79,83].forEach((m,k)=>glocke(m,t+k*.06,.075,A.sfx,.6,1.4));rauschen(t+.1,.9,.05,'highpass',6000,{bus:A.sfx,hall:.5,att:.2});},
    stufe(t){[72,76,79].forEach((m,k)=>ton('triangle',hz(m),t+k*.09,.12,.09,{rel:.3,bus:A.sfx,hall:.4}));ton('triangle',hz(84),t+.27,.4,.1,{rel:.6,bus:A.sfx,hall:.6});},
    klick(t){ton('sine',1500,t,.012,.05,{rel:.03,bus:A.sfx});},
    // Glücksbox: die Sternschnuppe zieht vorbei
    schnuppe(t,sel){const hoch={gewoehnlich:0,selten:2,episch:4,legendaer:7}[sel]||0;rauschen(t,1.3,.22,'bandpass',500,{ziel:5000+hoch*500,q:2,bus:A.sfx,att:.5,hall:.6});ton('sine',hz(60+hoch),t,1.1,.1,{att:.6,gleit:hz(84+hoch),rel:.3,bus:A.sfx,hall:.7});},
    // Glücksbox: das Ergebnis, je seltener, desto größer
    auf(t,sel){const n={gewoehnlich:[76],selten:[74,79],episch:[71,76,79,83],legendaer:[67,71,74,79,83,86,91]}[sel]||[76];
      n.forEach((m,k)=>glocke(m,t+k*.07,sel==='legendaer'?.12:.1,A.sfx,.8,sel==='legendaer'?3:1.6));
      if(sel==='episch'||sel==='legendaer'){ton('sine',sel==='legendaer'?55:65,t,.5,.35,{gleit:35,rel:.6,bus:A.sfx});rauschen(t,sel==='legendaer'?2:1.2,.07,'highpass',5000,{bus:A.sfx,hall:.8,att:.3});}}
  };

  // ---------- Steuerung ----------
  function starten(){if(A){if(A.c.state==='suspended'&&document.visibilityState==='visible')A.c.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{A=bauen(new AC());}catch(e){A=null;return;}
    A.musik.gain.value=an.musik?.55:0;clearInterval(timer);timer=setInterval(planen,90);planen();}
  ['pointerdown','keydown','touchend'].forEach(e=>addEventListener(e,starten,{passive:true}));
  addEventListener('visibilitychange',()=>{if(!A)return;if(document.visibilityState==='visible')A.c.resume();else A.c.suspend();});
  function look(id){const s=STIL_VON[id]||'klassisch';if(s===stilId)return;stilId=s;stil=STILE[s];schritt=0;
    if(A){const g=A.musik.gain,t=A.c.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.4);if(an.musik)g.linearRampToValueAtTime(.55,t+1.6);naechste=t+.45;}}
  function setzen(o){an.musik=o.musik!==false;an.effekte=o.effekte!==false;if(!A)return;const g=A.musik.gain,t=A.c.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(an.musik?.55:0,t+.5);if(an.musik)naechste=t+.1;}
  function sfx(name,a,verz){if(!A||!an.effekte||A.c.state!=='running'||!SFX[name])return;try{SFX[name](A.c.currentTime+.01+(verz||0),a);}catch(e){}}
  // Zum Prüfen: Musik eines Looks oder ein Geräusch offline berechnen und Pegel zurückgeben
  async function probe(was,sek){const c=new OfflineAudioContext(2,Math.floor(44100*sek),44100),alt=A,st0=stil;A=bauen(c);
    try{if(STILE[was]){const s=STILE[was],d=60/s.bpm/4;for(let i=0,t=.05;t<sek-.5;i++,t+=d)s.step(i,t,d);}else SFX[was](.05,{auf:'legendaer',schnuppe:'legendaer',stern:2,schuss:1}[was]);}
    finally{A=alt;stil=st0;}
    const b=await c.startRendering();let peak=0,sum=0,nan=false;for(let k=0;k<b.numberOfChannels;k++){const d=b.getChannelData(k);for(let i=0;i<d.length;i++){const v=d[i];if(v!==v)nan=true;const a=Math.abs(v);if(a>peak)peak=a;sum+=v*v;}}
    return{peak,rms:Math.sqrt(sum/(b.length*b.numberOfChannels)),nan};}
  return{look,setzen,sfx,probe,starten,stile:Object.keys(STILE),geraeusche:Object.keys(SFX),aktiv:()=>!!A&&A.c.state==='running'};
})();
