# Galaxy Golf – Regeln für die Pflege

Gilt für jede Sitzung, auch für die wöchentliche geplante Aufgabe. Der Besitzer (Artur) spielt das Spiel mit Freunden auf seinem Prolo-Server (`golf.prolo.me`). Live geht eine Änderung erst, wenn er in Prolo **Aktualisieren** drückt – ein Push auf `main` ist also sicher, muss aber fertig und geprüft sein.

## Nie

- **Spielstände nie zurücksetzen.** Speicherschlüssel `gg5` bleibt, `src/stand.js` bleibt rückwärtskompatibel (`sauber`, `zusammen`, `muenzen`).
- **IDs nie umbenennen oder löschen**: Bahnen (Reihenfolge in `src/levels.json`, `src/tages.json`, `src/aufgaben.json`), Sachen (`ITEMS`), Events (`EVENTS`), Pässe (`PAESSE`). Spielstände verweisen darauf. Neue Bahnen nur hinten anhängen.
- **Glücksbox-Ergebnisse werden aus dem Spielstand nachgerechnet.** Deshalb nie ändern: `BOX`, `SELTEN`, `selVon`, `banner`, `boxZuege`, `zufall01`, bei bestehenden Sachen `box`, `sel`, `neu` und Preise. Neue Box-Sachen nur mit `box:'<Start eines Banners>'`, der mindestens 7 Tage in der Zukunft liegt.
- **Weniger Münzen ab 2.11.2026**: `ECO_AB`, `SERIE2`, `SERIE2_TRUHE_MZ`, `WOCHE2_MZ`, `aufgMz`, `serieMz`, `truheMz`, `wocheMz`, `tagMz` nicht ändern.
- **Preise bestehender Sachen nie ändern** (Münzen werden aus Käufen berechnet).
- **Münzen werden rückwirkend berechnet.** Deshalb nie ändern: `AUFG` (Einträge, Ziele, Belohnungen), `AUFG_ALT`, `AUFG_NEU`, `AUFG_AB`, `WAUFG` (auch nichts ergänzen, die Reihenfolge bestimmt die Wochen), `WOCHE_*`, `SERIE*`, `TRUHE`, `PASS`, `passBelohnung`, bestehende `PAESSE`-Einträge (auch nicht ihre `stufen`), `MZ`, `hashStr`, `mischen`.
- **Shop-Wechsel nicht umbauen**: `ROT`, `ziehen`, `shopFuer` bleiben, sonst ändern sich Angebote rückwirkend und Rabattkäufe gelten nicht mehr. Neue kaufbare Sachen **immer** mit `neu:'JJJJ-MM-TT'`, nie ohne.
- Nichts am Server-Teil, an Konten, Codes oder Admin ändern, wenn die Aufgabe nur Inhalt ist.
- Keine Geheimnisse ins Repo.

## Fächer

`k` Kugel, `s` Flugspur, `l` Ziel-Loch, `o` Look, `j` Jubel (Effekt beim Einlochen), `t` Titel (Schild neben dem Namen in Rangliste, Profil und Start). Die ID beginnt immer mit dem Fach-Buchstaben.

## So funktioniert der Shop (nichts zu tun)

Der Shop wechselt von selbst nach Datum, für alle gleich: jeden Tag 4 Sachen unter 450 Münzen (eine 25 % günstiger), jeden Montag 2 Highlights ab 450 Münzen. Wie ein gemischter Stapel: jede Sache kommt einmal pro Runde dran, dann wird neu gemischt. Was fehlt, kommt also von selbst wieder. Eine neue Sache steht ab ihrem `neu`-Datum 14 Tage unter **Neu** und kommt danach in den Wechsel und mit dem nächsten Banner auch in die Glücksbox.

## So funktioniert die Glücksbox (fast nichts zu tun)

Reiter **Glücksbox** im Shop. 1× kostet 100, 10× kostet 900 Münzen. Chancen: Legendär 1,6 % (ab der 31. Ziehung ohne Legendär je +6 %, die 40. ist sicher), Episch 8 % (spätestens jede 10.), Selten 30 %, sonst Gewöhnlich. Legendär ist zu 50 % der Hauptgewinn, sonst ist das nächste Legendär sicher der Hauptgewinn. Doppeltes wird Sternenstaub (3/8/25/80), damit tauscht man Box-Sachen ein (20/50/120/400).
In der Box: alle Shop-Sachen (Seltenheit nach Preis) und eigene Box-Sachen (`box`, `sel`, kein Preis, nie im Shop). Banner wechseln alle 14 Tage, Starts: 2026-11-02 (erster Banner schon ab 31.10.), 2026-11-16, 2026-11-30, 2026-12-14, 2026-12-28, 2027-01-11, dann immer +14 Tage. Hauptgewinn ist das legendäre Box-Stück, das mit diesem Banner neu dazukommt, sonst reihum.

## Neue Skins (jede Woche zwei Stück)

Zwei kaufbare Sachen in `ITEMS` mit Preis passend zur Seltenheit: Gewöhnlich ≤ 200, Selten ≤ 400, Episch ≤ 700, Legendär darüber. Ab 450 Münzen ist es später ein Wochen-Highlight, darunter eine tägliche Sache. Abwechselnd die Fächer bedienen (Kugel, Spur, Loch, Look).
- `neu:'<Datum des nächsten Montags>'`, zum Beispiel `{id:'k-nordlicht',n:'Nordlicht',p:350,neu:'2026-11-23'}`. Ab diesem Tag stehen sie 14 Tage unter Neu.
- Zeichnen in `src/look.js`: Kugeln in `KUGELN`, Spuren in `SPUREN`, Löcher in `LOECHER`, Looks in `LOOKS`. Jede Sache muss im Spielfeld, in der Shop-Karte, in der Großansicht und im Kauf-Moment gut aussehen.

## Neue Box-Sachen (alle vier Wochen)

Alle vier Wochen ein neues **legendäres** Box-Stück, dazu ein bis zwei kleinere (gern ein Jubel). Fällig für die Banner ab 2026-12-14, 2027-01-11, 2027-02-08 und so weiter (alle 28 Tage):
- In `ITEMS` ohne Preis: `{id:'k-sonnenwind',n:'Sonnenwind',box:'2026-12-14',sel:'legendaer'}`. `box` ist der Start eines Banners mindestens 7 Tage in der Zukunft. Mit diesem Banner wird es von selbst Hauptgewinn.
- `sel`: `gewoehnlich`, `selten`, `episch` oder `legendaer`. Legendär soll man auf den ersten Blick erkennen (bewegt, leuchtend, im Spielfeld gut lesbar).
- Zeichnen wie bei Skins. Jubel in `JUBEL` (Funktion `(t,hx,hy,o)`, t = Sekunden seit dem Einlochen bis `JUBEL_T`, nur aus t berechnet, nie zufällig; `o.auf` = 1 heißt, oben ist kein Platz) und ein Standbild-Zeitpunkt in `JUBEL_STILL`.

## Ein Event anlegen

1. In `src/stand.js` bei `EVENTS` eintragen: `{id:'weihnachten-2026', n:'Weihnachten 2026', von:'2026-12-01', bis:'2026-12-26', look:'o-weihnachten-2026'}`. Datum in Ortszeit, beide Tage zählen mit. Die ID enthält das Jahr; wiederkehrende Feste bekommen jedes Jahr ein neues Event mit neuen Sachen.
2. Zwei bis drei Sachen in `ITEMS` mit `ev:'<event-id>'` und ohne Preis, IDs mit Fach-Präfix (`k-`, `s-`, `l-`, `o-`).
3. Zeichnen wie oben. Ein Event-Look gestaltet **alle Himmelskörper nach festen Regeln** um, nie zufällig. Vorbild ist `o-halloween`: Sonnen werden Kürbislaternen, Monde Geister, Planeten behalten ihr Design in Event-Farben. Ein Look braucht `css`, `c`, `pal`, `sonne`, `mond`, `stil`, `seed`, optional `bg`, `fx`, `brand`. Neue Zeichenregeln für Sonne oder Mond in `drawBody` ergänzen.
   Texte im Spiel, die vom Look abhängen (`istHW()` in `src/game.js`), nur ergänzen, nicht kaputt machen.
   Jeder Look braucht Musik: in `src/ton.js` bei `STILE` einen Stil ergänzen (Tempo, Akkorde, Klänge passend zum Fest) und in `STIL_VON` eintragen. Ohne Eintrag läuft die klassische Musik.
4. Das Event erscheint von selbst im Shop-Reiter **Event** mit Banner und Countdown. Jede Sache kostet dort **0 Münzen** und wird **einzeln** abgeholt; mit der ersten kommt das Abzeichen. Nach dem Event endet alles von selbst.

## Sternenpass (jeden Monat)

Jeder Monat hat einen Pass mit 30 Stufen. Sieben Stufen bringen Sachen, die es nur in diesem Monat gibt, die anderen Münzen. Spätestens 7 Tage vor Monatsbeginn anlegen, immer mit diesem Aufbau:
1. In `src/stand.js` bei `PAESSE` eintragen:
   `'2026-12':{n:'Sternenpass Dezember',item:'s-polarlicht',stufen:{3:'t-…',6:'k-…',10:'j-…',15:'t-…',20:'s-…',25:'t-…'}}`
   - Stufe 30 (`item`): die Hauptbelohnung, legendär im Gefühl (bewegt, besonders, im Spielfeld gut lesbar). Fächer abwechseln.
   - Stufen 3, 15, 25: drei **Titel** (`t-`), kurze Wörter mit Weltraum-Bezug, zum Beispiel „Polarstern“, „Eisläufer“, „Lichtjahr-Profi“.
   - Stufen 6 und 20: zwei **Farbvarianten** bekannter Kugeln oder Spuren in neuen Farben, neue IDs (zum Beispiel `k-komet-rot`), passend zum Monat.
   - Stufe 10: ein **Jubel** (`j-`), wie bei den Box-Sachen gezeichnet.
2. Alle sieben Sachen in `ITEMS` mit `pass:'2026-12'`, **ohne** Preis, ohne `ev` und ohne `box`. Sie kommen nie in Shop oder Box.
3. Titel in `src/look.js` bei `TITEL_STIL` eintragen: Farbe `c` und Wappen `sym` (`schnuppe`, `komet`, `orbit` oder ein neues Wappen in `titelZeichnen`). Text höchstens 18 Zeichen.
Fehlt ein Eintrag, läuft der Pass trotzdem, dann gibt es nur Münzen.

## Prüfen, dann pushen

```bash
node tools/build.cjs && node tools/test.cjs
```

- In `site/sw.js` die Nummer in `CACHE` um eins hochzählen.
- Im Browser ansehen, wenn Playwright da ist (`require("/opt/npm-tools/node_modules/playwright")` oder `npx playwright`): Server mit `PORT=18600 DATEN=<tmp> node server/server.js` starten und bei 390 px und 1440 px Breite fotografieren: Shop (Reiter Shop, Glücksbox und Event), die Großansicht der neuen Sachen (Karte antippen, bei Jubel nach etwa 2,6 s, wenn die Kugel im Loch ist), den Kauf-Moment, Inventar und Sternenpass. Ein Datum in der Zukunft geht mit `page.clock.setFixedTime(...)`. Die Bilder ansehen, keine Fehler in der Konsole. Event-Looks im Spielfeld auf einer Bahn mit Sonne und Mond prüfen (`load(<index>)` im Browser).
- Neue Musik oder Geräusche: im Browser `await TON.probe('<stil oder geräusch>',10)` aufrufen. Spitze unter 0,7, kein `nan`, RMS ähnlich wie bei den anderen Stilen (etwa 0,03 bis 0,05).
- Nur pushen, wenn alles grün ist. Commit-Nachricht auf Deutsch, was neu ist und was geprüft wurde.
- In `PFLEGE.md` eine Zeile eintragen: Datum, was neu ist.

## Sprache

Oberfläche Deutsch mit echten Umlauten, kurze klare Sätze, Du-Form.
