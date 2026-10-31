# Galaxy Golf

Weltraum-Minigolf mit echter Schwerkraft (Newton: Masse wächst mit Dichte und Radius³, Sonnen ziehen am stärksten, Monde und Doppelsterne kreisen mit Kepler-Geschwindigkeit, kein Bremsen im Vakuum).

- **420 Bahnen in fünf Stufen**: Leicht, Mittel, Schwer, Extrem und **Kosmos** mit Sonnenwind-Feldern und Doppelsternen. Jede Bahn ist geprüft: kein gerader Schuss aufs Loch, der Tipp-Schuss trifft hoch und quer.
- **Tagesbahn**: jeden Tag eine neue, für alle gleich (Vorrat für ein Jahr).
- **Endlos**: Bahnen werden im Browser frisch gebaut und mit der Physik geprüft, immer schwerer. Pro Bahn Par + 2 Schläge.
- **Münzen** für Sterne (4 je Stern), Asse ohne Tipp (15), die Tagesbahn (8 + 3 je Stern), Tagesaufgaben (10 bis 20), Wochen-Herausforderungen, Tagesbonus und Sternenpass. Seit 2.11.2026 gibt es dafür etwa halb so viel wie vorher, damit man für Sachen etwas tun muss. Bisherige Sterne und alles bis 1.11. zählen rückwirkend wie gehabt.
- **Tagesaufgaben**: drei am Tag, für alle gleich, jede für jeden machbar. Aufgaben wie „3 Bahnen mit Par 3“ oder „eine Bahn mit Wurmloch“ bringen ihre eigenen, geprüften Bahnen mit (`src/aufgaben.json`), der Spielen-Knopf startet sie.
- **Wochen-Herausforderungen**: drei pro Woche (ab 2.11.2026), je 50 Münzen und 100 XP.
- **Tagesbonus**: 5 bis 20 Münzen fürs Reinschauen, mit Serie wachsend; an Tag 7 eine Truhe mit einer seltenen oder epischen Sache.
- **Sternenpass**: jeden Monat 30 Stufen, XP aus Bahnen, Aufgaben, Bonus und Woche. Sieben Stufen bringen Sachen nur für diesen Monat: drei Titel, zwei Farbvarianten, einen Jubel und auf Stufe 30 die Hauptbelohnung (November 2026: Prismakugel). Die anderen Stufen bringen Münzen.
- **Glücksbox** im Shop, wie Wünsche in großen Spielen: 1× für 100, 10× für 900 Münzen. Chancen stehen offen da (Legendär 1,6 % mit steigender Chance ab Ziehung 31 und sicher bei 40, Episch spätestens jede 10.), Hauptgewinn im 50/50 mit Garantie, alle 14 Tage ein neuer Banner. Drin sind alle Shop-Sachen und eigene Box-Sachen. Doppeltes wird Sternenstaub, damit tauscht man Box-Sachen ein. Eine Sternschnuppe in der Farbe der Seltenheit zeigt, was kommt. Jede Ziehung lässt sich aus dem Spielstand nachrechnen, der Server prüft Münzen und Staub.
- **Jubel und Titel**: Jubel ist der Effekt beim Einlochen (Funken, Konfetti, Sternregen, Feuerwerk, Schockwelle). Titel stehen neben dem Namen in Rangliste, Profil und auf dem Start.
- **Musik und Geräusche**: entstehen live im Browser (Web Audio, keine Dateien). Jeder Look hat seine Musik: ruhige Weltraumfläche, unheimlich an Halloween, Synthwave bei Neon, träumerisch bei Nebula, Glockenspiel bei Frost. Geräusche für Abschlag, Einlochen, Sterne, Aufschlag, Verglühen, Wurmloch, Münzen, Kauf und Glücksbox. Musik und Geräusche lassen sich unter *Mehr* getrennt abschalten.
- **Shop** mit Wechsel wie in großen Spielen: jeden Tag vier Sachen (eine 25 % günstiger), jeden Montag zwei Highlights ab 450 Münzen, neue Sachen 14 Tage unter *Neu*. Was fehlt, kommt wieder. Marken für Neu, Zurück und Rabatt, Countdowns. Antippen öffnet die **Großansicht** mit Probeflug, Kaufen zeigt einen **Kauf-Moment** in der Farbe der Seltenheit.
- **Bedienung** wie in Handyspielen: feste Leiste unten mit *Spielen*, *Aufgaben* (Heute, Woche, Sternenpass), *Shop*, *Inventar* und *Mehr* (Rangliste, Konto, Optionen). Punkte zeigen, wo etwas Neues wartet. Der Startbildschirm passt ohne Scrollen auf eine Seite, der Tagesbonus springt einmal am Tag als Fenster auf, *Menü* im Spiel führt zurück zum zuletzt genutzten Reiter.
- **Inventar** mit sechs Plätzen (Kugel, Spur, Loch, Look, Jubel, Titel): Platz antippen, aus den eigenen Sachen wählen, oben fliegt die Ausrüstung zur Probe, mit Jubel am Loch. Neu bekommene Sachen tragen eine Marke.
- **Events**: Event-Sachen stehen im Reiter *Event* für 0 Münzen und werden einzeln abgeholt; mit der ersten kommt das Abzeichen. Sie bleiben für immer, etwa *Halloween 2026* (10.10. bis 03.11.). Das Profil in den Einstellungen zeigt, seit wann man dabei ist.
- **Rangliste** der Tagesbahn unter Freunden (heute und gestern, braucht ein Konto).
- **Konten** mit Name und PIN: Spielstand auf dem Server, auf jedes Handy mitnehmbar. **Geschenk-Codes** und ein **Admin-Bereich** nur für dich.
- Auf dem Handy hochkant, am Rechner quer mit Seitenleiste. Als App installierbar (PWA), spielbar auch offline.

## Auf ProloWelt installieren

Admin-Seite → *Tools* → **Tool installieren**

- Name: `golf` (Adresse wird `golf.<domain>`)
- Quelle: **Git-Repository**, URL dieses Repositorys
- Anmeldung: **Ohne** (die App am Handy startet so ohne Umweg über Authentik; Konten macht das Spiel selbst)

Neue Fassung: auf der Tool-Seite **Aktualisieren**. Prolo sichert vorher, baut neu und startet.

Die Spielstände liegen im Volume `daten` (Datei `galaxy-golf.json`) und kommen mit in Prolos Sicherung.

### Admin-Passwort setzen

Ohne Passwort gibt es keinen Admin-Bereich. Einmalig auf der Admin-Seite: Tool **golf** → **Bearbeiten** → *Variablen setzen*:

```
GG_ADMIN_PASSWORT=dein-langes-passwort
```

Mindestens 8 Zeichen, am besten aus dem Passwortmanager. Oder auf dem Server:

```bash
sudo prolo tool edit golf --env GG_ADMIN_PASSWORT='dein-langes-passwort'
```

Im Spiel: *Einstellungen* → *Code einlösen* → Passwort eingeben → der Admin-Bereich öffnet sich. Dort:

- Spieler sehen, Münzen und Sachen schenken, alle Bahnen freischalten, eine vergessene PIN neu setzen
- Geschenk-Codes erstellen (einmal, fünfmal oder unbegrenzt einlösbar, jeder Spieler einmal) und löschen

Der Server prüft Passwort und Codes; im Spiel selbst steht nichts davon. Beim Verlassen der Admin-Seite ist man abgemeldet, auch auf fremden Handys bleibt nichts zurück. Falsche Codes und PINs werden gebremst.

## Installieren als App

- Android (Chrome): Menü ⋮ → „App installieren“
- iPhone (Safari): Teilen → „Zum Home-Bildschirm“
- Rechner (Chrome/Edge): Installieren-Symbol rechts in der Adresszeile

## Aufbau

| | |
|---|---|
| `src/physics.js` | Flugphysik, gemeinsam für Spiel, Generator und Endlos-Modus |
| `src/gen.js` | Bahn-Baukasten und Prüfungen (Generator und Endlos-Modus) |
| `src/stand.js` | Spielstand, Shop-Katalog und Shop-Wechsel, Events, Tagesaufgaben, Woche, Tagesbonus, Sternenpass, Glücksbox, Münzen, Zusammenführen – gemeinsam für Spiel und Server |
| `src/look.js` | Looks, Planeten, Kugeln, Spuren, Löcher, Jubel, Titel, Hintergrund |
| `src/ton.js` | Musik je Look und Geräusche (Web Audio), `TON.probe` zum Prüfen |
| `src/game.js` | Spielfeld, Modi, Eingabe |
| `src/ui.js` | Startbildschirm, Shop mit Glücksbox, Großansicht, Kauf-Moment, Inventar, Sternenpass, Rangliste, Einstellungen mit Profil, Konto, Admin, Abgleich |
| `src/levels.json` | Kampagne mit Stufe, Par und Lösungsschuss für den Tipp |
| `src/tages.json` | Vorrat für die Tagesbahn |
| `src/aufgaben.json` | Bahnen für Tagesaufgaben: `ass`, `p3`, `wurm`, `wind`, `doppel` |
| `server/server.js` | Server (nur Node-Standardbibliothek): liefert `site/` aus, Konten, Abgleich, Truhe, Pass, Glücksbox und Sternenstaub prüfen, Rangliste mit Titeln, Codes, Admin |
| `tools/levelgen.cjs` | erzeugt Bahnen: `node tools/levelgen.cjs kosmos|tages|aufgaben-<art> <ausgabe.json>` |
| `tools/build.cjs` | baut `site/index.html` und `server/info.json` |
| `tools/test.cjs` | prüft Münzen, Zusammenführen und den Server |

Nach einer Änderung in `src/`:

```bash
node tools/build.cjs && node tools/test.cjs
```

und in `site/sw.js` die Nummer in `CACHE` hochzählen, damit installierte Apps die neue Fassung holen.

### Neue Inhalte

Events, neue Skins, neue Box-Sachen und der Sternenpass jedes Monats: siehe `CLAUDE.md`. Die wöchentliche geplante Aufgabe hält sich daran.
