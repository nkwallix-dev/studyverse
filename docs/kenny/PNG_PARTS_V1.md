# Kenny – PNG Parts v1 / Test-Reiter

**Status:** erste Bildteil-Implementierung zum visuellen Review. **Nur Test · Kenny-Rig**, keine Änderung an Dino-Season-Füttern, Shop, Profildaten oder Expedition.

## Quellen und Bildteile

- `public/kenny/rig/v1/source/kenny-approved-master.png`: die im Chat freigegebene blau/cyanfarbene Originalillustration (1205 × 1305, RGBA).
- `public/kenny/rig/v1/source/kenny-part1-source.png`: generierte Sammlung acht größerer Hauptformen (separat als *Referenz* exportiert).
- `public/kenny/rig/v1/part1-generated/*.png`: acht transparente, einzeln ausgeschnittene *Referenz*-Formen aus der Generierung. **Nicht** blind als Live-Layer benutzen: eine KI kann Proportionen/Innenflächen gegenüber dem Original minimal verändern.
- `public/kenny/rig/v1/parts/{blue,green,red,pink,white}/*.png`: 18 präzise und verlustfrei aus dem tatsächlichen Master ausgeschnittene, transparente Layer + ein eigens erstelltes geschlossenes Augenlid, je Skin.
- `public/kenny/rig/v1/manifest.json`: Maße, globale Canvas-Koordinaten und Gelenk-Pivots aller PNGs.

## Struktur der 18 getrennten Original-PNGs

- **Kopf/Gesicht:** `head_upper`, `jaw_lower`, `eye_open`; zusätzlich `eye_closed` für Blinkframes.
- **Hals/Rumpf:** `neck`, `torso_core`.
- **Arme/Hände:** `arm_near`, `hand_near`, `arm_far`, `hand_far` (je drei Finger bleiben Bestandteil der Handillustration).
- **Beine/Füße:** `thigh_near`, `shin_near`, `foot_near`, `thigh_far`, `shin_far`, `foot_far` (drei Hauptzehen bleiben im Original erhalten; Sichelkralle muss bei künftigem Anatomie-Rework separat qualitätsgeprüft werden).
- **Schwanz:** `tail_base`, `tail_mid`, `tail_tip`.

Die Render-PNGs sind mit Bounding-Boxes statt Atlas-Zellen gespeichert. Bei statischer Zusammensetzung aller 18 **blauen** Ebenen entsteht pixelgenau wieder das freigegebene Original. Kein „Nachbar-Kenny“ ist im Sprite enthalten.

## Eine Animation, fünf Farben

`scripts/kenny/build-parts-from-master.mjs` liest genau **eine** freigegebene Illustration, klassifiziert blaue/dunkle Streifen-/helle Unterseitenregionen und erstellt daraus die fünf Varianten. Augen, Maul, Zähne und schwarze Outlines bleiben unverändert.

Persistierte Skin-ID `zebra` bleibt unverändert und wird im Test-Rendering **nur intern** auf `white` abgebildet. Kein Firestore-Migrationsskript, keine Shop-Änderungen.

## Laufzeit und Sicherheit

Die bestehende Angular-Komponente `kenny-rig-preview.component.ts/html` lädt das Manifest unter Berücksichtigung von `document.baseURI` (GitHub Pages: `/studyverse/`) und preloaded beim Skinwechsel die einzelnen PNG-Dateien. Nur der Test-Reiter benutzt die neuen Assets.

- **10 FPS** für Idle (64 Ticks = 6,4 Sekunden); die Kennyverse-Spielphysik bleibt unberührt.
- Jedes Teil hat eigene Zeichenkoordinaten und ggf. einen eigenen Drehpunkt. Kopf, Kiefer, Hals, Arme/Hände und Schwanz können separat minimal bewegt werden.
- Blinkanimation nutzt ein zusätzliches gezeichnetes `eye_closed.png`. Das ist nicht die ursprüngliche offene Augen-PNG und braucht noch optische Abnahme.
- Der freigegebene Master wird als Fallback angezeigt, wenn das Teilemanifest oder einzelne PNGs fehlen.
- Skin-Knöpfe ändern **nur die Vorschau**, niemals ausgerüstete Items.

## Qualitätsgrenze und ehrlicher nächster Schritt

Die v1-Bilder sind **präzise ausgeschnitten**, nicht vollständig hinter den Gelenken nachgemalt. Wird eine Hand oder der Kopf sehr weit gedreht, könnten an der Schnittkante verdeckte Flächen fehlen. Deshalb ist die erste Animation **absichtlich dezent**. Vor Lauf-/Biss-/Sprunganimationen: verdeckte Bereiche unter den Gelenken künstlerisch ergänzen, passende Gelenk-Hierarchie und echte Fußkontakte erarbeiten. Keine Riesenrotation als Quick-Fix.

`part1-generated` enthält alternative, echte KI-Teile; sie sind bewusst nicht die aktive Laufzeitquelle, weil ihr Zusammensetzen sonst Kennys Gesicht/Proportionen verändern könnte. Sie können künftig zur gezielten Reparatur verdeckter Flächen dienen.

## Testverfahren

1. `node scripts/kenny/build-parts-from-master.mjs` – regeneriert 5 × 19 Einzel-PNGs.
2. `node scripts/kenny/test-rig-parts.mjs` – prüft Dateigeometrie und **pixelgenaue Rekonstruktion** der blauen Originalillustration.
3. `npm run build -- --base-href /studyverse/ --output-path dist/site`.
4. `node scripts/kenny/test-rig-browser.cjs` (Playwright + Chrome) – überprüft im echten Dino-Designer-Tab Einzel-PNG-Laden, Buttons, Frame und Skin-Wechsel sowie Screenshots bei 1280 px und 390 px.
5. Manuelle **visuelle** Abnahme von Kopf/Kiefer/Arme/Schwanz auch während der Bewegung; nicht allein aus grünem CI „perfekt“ ableiten.

**Keine Live-Migration der Expedition, Fütterung oder Cosmetics in diesem PR.** Nach Nutzerfreigabe bleibt dieser Testreiter als Werkbank für die nächste Animationsphase.
