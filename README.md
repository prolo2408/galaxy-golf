# Galaxy Golf

Weltraum-Minigolf mit echter Schwerkraft (Newton: Masse wächst mit Dichte und Radius³, Sonnen ziehen am stärksten, Monde und Doppelsterne kreisen mit Kepler-Geschwindigkeit, kein Bremsen im Vakuum).

- **420 Bahnen in fünf Stufen**: Leicht, Mittel, Schwer, Extrem und **Kosmos** mit Sonnenwind-Feldern und Doppelsternen. Jede Bahn ist geprüft: kein gerader Schuss aufs Loch, der Tipp-Schuss trifft hoch und quer.
- **Tagesbahn**: jeden Tag eine neue, für alle gleich (Vorrat für ein Jahr).
- **Endlos**: Bahnen werden im Browser frisch gebaut und mit der Physik geprüft, immer schwerer. Pro Bahn Par + 2 Schläge.
- **Münzen** für Sterne (4 je Stern), Asse ohne Tipp (15), die Tagesbahn (15 + 5 je Stern) und drei **Tagesaufgaben**. Bisherige Sterne zählen rückwirkend.
- **Shop**: Kugeln, Flugspuren, Ziel-Löcher und Looks (Nebula, Frost, Neon), die alle Himmelskörper nach festen Regeln umgestalten.
- **Events**: Wer im Zeitraum spielt, bekommt Abzeichen und Event-Sachen für immer, etwa *Halloween 2026* (10.10. bis 03.11.). Die Sammlung zeigt, seit wann man dabei ist.
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
| `src/stand.js` | Spielstand, Shop-Katalog, Events, Tagesaufgaben, Münzen, Zusammenführen – gemeinsam für Spiel und Server |
| `src/look.js` | Looks, Planeten, Kugeln, Spuren, Löcher, Hintergrund |
| `src/game.js` | Spielfeld, Modi, Eingabe |
| `src/ui.js` | Startbildschirm, Shop, Sammlung, Einstellungen, Konto, Admin, Abgleich |
| `src/levels.json` | Kampagne mit Stufe, Par und Lösungsschuss für den Tipp |
| `src/tages.json` | Vorrat für die Tagesbahn |
| `server/server.js` | Server (nur Node-Standardbibliothek): liefert `site/` aus, Konten, Abgleich, Codes, Admin |
| `tools/levelgen.cjs` | erzeugt Bahnen: `node tools/levelgen.cjs kosmos|tages <ausgabe.json>` |
| `tools/build.cjs` | baut `site/index.html` und `server/info.json` |
| `tools/test.cjs` | prüft Münzen, Zusammenführen und den Server |

Nach einer Änderung in `src/`:

```bash
node tools/build.cjs && node tools/test.cjs
```

und in `site/sw.js` die Nummer in `CACHE` hochzählen, damit installierte Apps die neue Fassung holen.

### Ein neues Event

In `src/stand.js` bei `EVENTS` eintragen (Name, Zeitraum, optional ein Look) und die Event-Sachen in `ITEMS` mit `ev:'<event-id>'` markieren. Für neue Sachen braucht es eine Zeichenfunktion in `src/look.js` (`KUGELN`, `SPUREN`, `LOECHER` oder `LOOKS`).
