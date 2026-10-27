# Galaxy Golf

Weltraum-Minigolf mit Schwerkraft: 120 Bahnen, Tipp-Knopf, als App installierbar (PWA) und offline spielbar.

## Auf ProloWelt installieren

Admin-Seite → *Tools* → **Tool installieren**

- Name: `golf` (Adresse wird `golf.<domain>`)
- Quelle: **Git-Repository**, URL dieses Repositorys
- Anmeldung: **Ohne** (ein Spiel braucht keinen Login, und die installierte App startet so ohne Umweg über Authentik)

Oder auf dem Server:

```bash
sudo prolo tool add golf --git https://github.com/prolo2408/galaxy-golf.git --anmeldung keine
```

## Aufs Handy

- Android (Chrome): Seite öffnen, Menü ⋮ → „App installieren“
- iPhone (Safari): Teilen → „Zum Home-Bildschirm“

## Neue Fassung

Änderungen hier pushen, in `site/sw.js` die Nummer in `CACHE` hochzählen, dann auf der Tool-Seite **Aktualisieren**.
