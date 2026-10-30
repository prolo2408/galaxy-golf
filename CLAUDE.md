# Galaxy Golf – Regeln für die Pflege

Gilt für jede Sitzung, auch für die wöchentliche geplante Aufgabe. Der Besitzer (Artur) spielt das Spiel mit Freunden auf seinem Prolo-Server (`golf.prolo.me`). Live geht eine Änderung erst, wenn er in Prolo **Aktualisieren** drückt – ein Push auf `main` ist also sicher, muss aber fertig und geprüft sein.

## Nie

- **Spielstände nie zurücksetzen.** Speicherschlüssel `gg5` bleibt, `src/stand.js` bleibt rückwärtskompatibel (`sauber`, `zusammen`, `muenzen`).
- **IDs nie umbenennen oder löschen**: Bahnen (Reihenfolge in `src/levels.json`), Sachen (`ITEMS`), Events (`EVENTS`). Spielstände verweisen darauf. Neue Bahnen nur hinten anhängen.
- **Preise bestehender Sachen nie ändern** (Münzen werden aus Käufen berechnet).
- Nichts am Server-Teil, an Konten, Codes oder Admin ändern, wenn die Aufgabe nur Inhalt ist.
- Keine Geheimnisse ins Repo.

## Ein Event anlegen

1. In `src/stand.js` bei `EVENTS` eintragen: `{id:'weihnachten-2026', n:'Weihnachten 2026', von:'2026-12-01', bis:'2026-12-26', look:'o-weihnachten-2026'}`. Datum in Ortszeit, beide Tage zählen mit. Die ID enthält das Jahr; wiederkehrende Feste bekommen jedes Jahr ein neues Event mit neuen Sachen.
2. Zwei bis drei Sachen in `ITEMS` mit `ev:'<event-id>'` und ohne Preis, IDs mit Fach-Präfix (`k-`, `s-`, `l-`, `o-`).
3. Zeichnen in `src/look.js`: Kugeln in `KUGELN`, Spuren in `SPUREN`, Löcher in `LOECHER`, Looks in `LOOKS`.
   Ein Event-Look gestaltet **alle Himmelskörper nach festen Regeln** um, nie zufällig. Vorbild ist `o-halloween`: Sonnen werden Kürbislaternen, Monde Geister, Planeten behalten ihr Design in Event-Farben. Ein Look braucht `css`, `c`, `pal`, `sonne`, `mond`, `stil`, `seed`, optional `bg`, `fx`, `brand`. Neue Zeichenregeln für Sonne oder Mond in `drawBody` ergänzen.
   Texte im Spiel, die vom Look abhängen (`istHW()` in `src/game.js`), nur ergänzen, nicht kaputt machen.
4. Das Event erscheint von selbst im Shop-Reiter **Event** (Banner, Countdown, gratis abholen) und endet von selbst.

## Neue Skins (alle drei Wochen zwei Stück)

Zwei kaufbare Sachen in `ITEMS` mit Preis passend zur Seltenheit: Gewöhnlich ≤ 200, Selten ≤ 400, Episch ≤ 700, Legendär darüber. Abwechselnd die Fächer bedienen (Kugel, Spur, Loch, Look). Jede Sache muss im Spielfeld und in der Shop-Vorschau gut aussehen.

## Prüfen, dann pushen

```bash
node tools/build.cjs && node tools/test.cjs
```

- In `site/sw.js` die Nummer in `CACHE` um eins hochzählen.
- Im Browser ansehen, wenn Playwright da ist (`require("/opt/npm-tools/node_modules/playwright")` oder `npx playwright`): Server mit `PORT=18600 DATEN=<tmp> node server/server.js` starten, Shop-Reiter und Inventar bei 390 px und 1440 px Breite fotografieren, die Bilder ansehen, keine Fehler in der Konsole. Event-Looks im Spielfeld auf einer Bahn mit Sonne und Mond prüfen (`load(<index>)` im Browser).
- Nur pushen, wenn alles grün ist. Commit-Nachricht auf Deutsch, was neu ist und was geprüft wurde.
- In `PFLEGE.md` eine Zeile eintragen: Datum, was neu ist.

## Sprache

Oberfläche Deutsch mit echten Umlauten, kurze klare Sätze, Du-Form.
