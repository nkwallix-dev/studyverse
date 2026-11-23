# Kenny Master-Rig v2 – Batch 01: Kopf und Gesicht

**Review-Batch, NICHT ins Spiel integriert.** Genau zehn eigenständige, transparente PNG-Ebenen aus der freigegebenen Quelle `public/kenny/rig/v1/source/kenny-approved-master.png` (1205 × 1305 RGBA). Kein neuer Kenny-Stil, keine fremden Gliedmaßen, keine Animationsframes.

## Die zehn PNGs

`head_upper.png`, `eye_near_open.png`, `eye_near_closed.png`, `eye_far_open.png`, `eye_far_closed.png`, `jaw_lower_open.png`, `jaw_lower_closed.png`, `mouth_cavity.png`, `upper_teeth.png`, `lower_teeth.png`.

`manifest.json` enthält pro Layer den Original-Crop (x, y, width, height), globale und lokale Pivots und SHA-256. Das **linke Kiefergelenk liegt bei (771, 376)** im Master-Canvas. Für die geschlossene Probe-Pose wurde die ursprüngliche Kiefer-Kontur um **+27° in Bildschirmkoordinaten** hochgedreht und die versteckte cyanfarbene Hautfläche zwischen den Lippen ergänzt.

Die *geöffneten* Augen, die originale Wange, die geöffnete Maulhöhle und beide Zahnreihen sind aus den echten Pixeln der Freigabe abgeleitet und **nicht unabhängig neu gezeichnet**. Das Gesicht hinter den Augen wurde aus den umliegenden Originalfarben repariert; die geschlossenen Lider und das geschlossene Maul sind gezielt erzeugte Ersatzgrafiken. Der geschlossene Kiefer enthält keine roten/rosa oder zahnfarbenen Pixel.

## Qualitätskontrolle

- `preview-10-parts.png`: die zehn **tatsächlich separat gespeicherten** PNGs als Übersicht (die Dateien selbst sind kein Atlas).
- `preview-comparison.png`: Original / geöffnete Komposition **ohne Halsreferenz** / geschlossene Komposition **ohne Halsreferenz**.
- `preview-in-context.png`: dieselben Kompositionen mit **bestehender Hals-/Körperreferenz** als reiner Vorschau-Hintergrund. Die Halsreferenz ist keine der zehn Gesichtsebenen und wurde nicht als Kopf-Asset eingebaut.
- `python verify_batch01.py`: prüft exakt zehn RGBA-Dateien, Dimensionen, Transparenz, Hashes, Pivot/Offsets, ausbleibende Zähne und rote Maulflächen im geschlossenen Zustand sowie RGB-Abweichungen der offenen Gesichtsdetails zum Original.

**Bewusste offene Punkte vor animierter Produktion:** Das geschlossene Maul ist eine **erste neue Pose**, keine vom Nutzer bereits freigegebene Originalgrafik. Der Mundwinkel und die Überlappung zum späteren Hals-Rig brauchen künstlerische Prüfung. Beim Rotieren um den Pivot müssen verdeckte Flächen bis zur vollen Bissöffnung weiter ergänzt werden. Die geöffnete, statische Komposition ist kontrolliert, aber das allein beweist noch keinen perfekten Übergang **zwischen** den Posen.

## Reproduzieren

Aus der Repo-Wurzel mit `numpy`, `Pillow`, `opencv-python-headless`, `scipy`:

```bash
python kenny-rig-v2/batch-01/build_batch01.py
python kenny-rig-v2/batch-01/verify_batch01.py
```

**Kein Merge in `main`**, keine Änderungen an aktiven Dino-/Fütterungs-/Combat-Komponenten, Firestore oder Mathsverse. Nach diesem Batch zunächst visuelles Feedback.
