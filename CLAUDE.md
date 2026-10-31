# Galaxy Golf – Regeln für die Pflege

Gilt für jede Sitzung, auch für die wöchentliche geplante Aufgabe. Der Besitzer (Artur) spielt das Spiel mit Freunden auf seinem Prolo-Server (`golf.prolo.me`). Live geht eine Änderung erst, wenn er in Prolo **Aktualisieren** drückt – ein Push auf `main` ist also sicher, muss aber fertig und geprüft sein.

## Nie

- **Spielstände nie zurücksetzen.** Speicherschlüssel `gg5` bleibt, `src/stand.js` bleibt rückwärtskompatibel (`sauber`, `zusammen`, `muenzen`).
- **IDs nie umbenennen oder löschen**: Bahnen (Reihenfolge in `src/levels.json`, `src/tages.json`, `src/aufgaben.json`), Sachen (`ITEMS`), Events (`EVENTS`), Pässe (`PAESSE`). Spielstände verweisen darauf. Neue Bahnen nur hinten anhängen.
- **Preise bestehender Sachen nie ändern** (Münzen werden aus Käufen berechnet).
- **Münzen werden rückwirkend berechnet.** Deshalb nie ändern: `AUFG` (Einträge, Ziele, Belohnungen), `AUFG_ALT`, `AUFG_NEU`, `AUFG_AB`, `WAUFG` (auch nichts ergänzen, die Reihenfolge bestimmt die Wochen), `WOCHE_*`, `SERIE*`, `TRUHE`, `PASS`, bestehende `PAESSE`-Einträge, `MZ`, `hashStr`, `mischen`.
- **Shop-Wechsel nicht umbauen**: `ROT`, `ziehen`, `shopFuer` bleiben, sonst ändern sich Angebote rückwirkend und Rabattkäufe gelten nicht mehr. Neue kaufbare Sachen **immer** mit `neu:'JJJJ-MM-TT'`, nie ohne.
- Nichts am Server-Teil, an Konten, Codes oder Admin ändern, wenn die Aufgabe nur Inhalt ist.
- Keine Geheimnisse ins Repo.

## So funktioniert der Shop (nichts zu tun)

Der Shop wechselt von selbst nach Datum, für alle gleich: jeden Tag 4 Sachen unter 450 Münzen (eine 25 % günstiger), jeden Montag 2 Highlights ab 450 Münzen. Wie ein gemischter Stapel: jede Sache kommt einmal pro Runde dran, dann wird neu gemischt. Was fehlt, kommt also von selbst wieder. Eine neue Sache steht ab ihrem `neu`-Datum 14 Tage unter **Neu** und kommt danach in den Wechsel.

## Neue Skins (alle drei Wochen zwei Stück)

Zwei kaufbare Sachen in `ITEMS` mit Preis passend zur Seltenheit: Gewöhnlich ≤ 200, Selten ≤ 400, Episch ≤ 700, Legendär darüber. Ab 450 Münzen ist es später ein Wochen-Highlight, darunter eine tägliche Sache. Abwechselnd die Fächer bedienen (Kugel, Spur, Loch, Look).
- `neu:'<Datum des nächsten Montags>'`, zum Beispiel `{id:'k-nordlicht',n:'Nordlicht',p:350,neu:'2026-11-23'}`. Ab diesem Tag stehen sie 14 Tage unter Neu.
- Zeichnen in `src/look.js`: Kugeln in `KUGELN`, Spuren in `SPUREN`, Löcher in `LOECHER`, Looks in `LOOKS`. Jede Sache muss im Spielfeld, in der Shop-Karte, in der Großansicht und im Kauf-Moment gut aussehen.

## Ein Event anlegen

1. In `src/stand.js` bei `EVENTS` eintragen: `{id:'weihnachten-2026', n:'Weihnachten 2026', von:'2026-12-01', bis:'2026-12-26', look:'o-weihnachten-2026'}`. Datum in Ortszeit, beide Tage zählen mit. Die ID enthält das Jahr; wiederkehrende Feste bekommen jedes Jahr ein neues Event mit neuen Sachen.
2. Zwei bis drei Sachen in `ITEMS` mit `ev:'<event-id>'` und ohne Preis, IDs mit Fach-Präfix (`k-`, `s-`, `l-`, `o-`).
3. Zeichnen wie oben. Ein Event-Look gestaltet **alle Himmelskörper nach festen Regeln** um, nie zufällig. Vorbild ist `o-halloween`: Sonnen werden Kürbislaternen, Monde Geister, Planeten behalten ihr Design in Event-Farben. Ein Look braucht `css`, `c`, `pal`, `sonne`, `mond`, `stil`, `seed`, optional `bg`, `fx`, `brand`. Neue Zeichenregeln für Sonne oder Mond in `drawBody` ergänzen.
   Texte im Spiel, die vom Look abhängen (`istHW()` in `src/game.js`), nur ergänzen, nicht kaputt machen.
4. Das Event erscheint von selbst im Shop-Reiter **Event** mit Banner und Countdown. Jede Sache kostet dort **0 Münzen** und wird **einzeln** abgeholt; mit der ersten kommt das Abzeichen. Nach dem Event endet alles von selbst.

## Sternenpass (jeden Monat)

Jeder Monat hat einen Pass mit 30 Stufen. Auf Stufe 30 gibt es eine Sache, die es nur in diesem Monat gibt. Spätestens 7 Tage vor Monatsbeginn anlegen:
1. In `src/stand.js` bei `PAESSE` eintragen: `'2026-12':{n:'Sternenpass Dezember',item:'s-polarlicht'}`.
2. Die Sache in `ITEMS` mit `pass:'2026-12'`, **ohne** Preis und ohne `ev`, zum Beispiel `{id:'s-polarlicht',n:'Polarlicht',pass:'2026-12'}`. Sie kommt nie in den Shop.
3. Zeichnen wie oben; sie soll sich wie eine legendäre Belohnung anfühlen (bewegt, besonders, aber im Spielfeld gut lesbar). Fächer abwechseln.
Fehlt ein Eintrag, läuft der Pass trotzdem, Stufe 30 bringt dann Münzen statt einer Sache.

## Prüfen, dann pushen

```bash
node tools/build.cjs && node tools/test.cjs
```

- In `site/sw.js` die Nummer in `CACHE` um eins hochzählen.
- Im Browser ansehen, wenn Playwright da ist (`require("/opt/npm-tools/node_modules/playwright")` oder `npx playwright`): Server mit `PORT=18600 DATEN=<tmp> node server/server.js` starten und bei 390 px und 1440 px Breite fotografieren: Shop (Reiter Shop und Event), die Großansicht der neuen Sachen (Karte antippen), den Kauf-Moment, Inventar und Sternenpass. Ein Datum in der Zukunft geht mit `page.clock.setFixedTime(...)`. Die Bilder ansehen, keine Fehler in der Konsole. Event-Looks im Spielfeld auf einer Bahn mit Sonne und Mond prüfen (`load(<index>)` im Browser).
- Nur pushen, wenn alles grün ist. Commit-Nachricht auf Deutsch, was neu ist und was geprüft wurde.
- In `PFLEGE.md` eine Zeile eintragen: Datum, was neu ist.

## Sprache

Oberfläche Deutsch mit echten Umlauten, kurze klare Sätze, Du-Form.
