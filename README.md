# Galaxy Golf

Weltraum-Minigolf mit echter Schwerkraft (Newton: Masse wächst mit Dichte und Radius³, Sonnen ziehen am stärksten, Monde kreisen mit Kepler-Geschwindigkeit, kein Bremsen im Vakuum). 220 Bahnen in vier Stufen (Leicht, Mittel, Schwer, Extrem), Tipp-Knopf, schlichte flache Planeten in vielen Varianten, Halloween- und klassischer Look. Auf dem Handy hochkant, am Rechner quer mit Seitenleiste. Als App installierbar (PWA) und offline spielbar.

## Auf ProloWelt installieren

Admin-Seite → *Tools* → **Tool installieren**

- Name: `golf` (Adresse wird `golf.<domain>`)
- Quelle: **Git-Repository**, URL dieses Repositorys
- Anmeldung: **Ohne** (ein Spiel braucht keinen Login, und die installierte App startet so ohne Umweg über Authentik)

Oder auf dem Server:

```bash
sudo prolo tool add golf --git https://github.com/prolo2408/galaxy-golf.git --anmeldung keine
```

Neue Fassung: auf der Tool-Seite **Aktualisieren**.

## Installieren als App

- Android (Chrome): Menü ⋮ → „App installieren“
- iPhone (Safari): Teilen → „Zum Home-Bildschirm“
- Rechner (Chrome/Edge): Installieren-Symbol rechts in der Adresszeile

## Aufbau

| | |
|---|---|
| `src/physics.js` | Flugphysik, gemeinsam für Spiel und Bahn-Generator |
| `src/game.js`, `src/style.css`, `src/body.html` | das Spiel |
| `src/levels.json` | die Bahnen mit Stufe, Par und Lösungsschuss für den Tipp |
| `tools/levelgen.cjs` | erzeugt Bahnen (`node tools/levelgen.cjs src/levels.json 800`), misst die Schwierigkeit und verteilt sie auf vier Stufen |
| `tools/build.cjs` | baut `site/index.html` |
| `site/` | das, was ausgeliefert wird |

Nach einer Änderung in `src/`:

```bash
node tools/build.cjs
```

und in `site/sw.js` die Nummer in `CACHE` hochzählen, damit installierte Apps die neue Fassung holen.

Jede Bahn ist geprüft: Der gespeicherte Lösungsschuss trifft im Hoch- und im Querformat.
