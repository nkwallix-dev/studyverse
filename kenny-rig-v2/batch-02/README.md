# Kenny Master-Rig v2 – Batch 02: Rumpf & Gliedmaßen

**Status: separater Review-Batch, noch keine Live-Implementierung.** Dieses Paket enthält **genau zehn eigenständige RGBA-PNG-Körperteile** für den originalen blauen Kenny. Es ergänzt Batch 01 (Kopf/Gesicht). Das 1205 × 1305-Masterbild ist dieselbe freigegebene Datei mit SHA-256 `11440b14fa46df978bab203e1feebdd3f93f1cbb240931b8658061e7016529a0`.

## Die zehn PNGs

1. `torso_core.png` – Bauch, Brust, Rücken und Hüftkörper; Arme/Beine auf der Basisebene übermalt.
2. `neck.png` – Hals, mit rekonstruierter Haut unter dem Batch-01-Kopf.
3. `arm_near_upper.png` – Vorderer Oberarm.
4. `arm_near_forearm.png` – Vorderer Unterarm.
5. `hand_near.png` – Vordere Hand, **3 originalgetreue Krallen**.
6. `arm_far_upper.png` – Hinterer Oberarm; verdeckte Partien aus passendem Blau rekonstruiert.
7. `arm_far_forearm.png` – Hinterer Unterarm; verdeckte Partien rekonstruiert.
8. `hand_far.png` – Hintere Hand, **3 originalgetreue Krallen**.
9. `thigh_near.png` – Vorderer Oberschenkel mit originalen dunklen Streifen.
10. `thigh_far.png` – Hinterer Oberschenkel, ohne die überlagerten Vorderhand-Krallen.

**Wichtig zur Quellen-Treue:** Alle noch sichtbaren Konturen/Farben werden aus dem Original verwendet, soweit das betreffende Teil in der Vorlage unabhängig sichtbar ist. Die Vorlage enthält **keine** zeichnerisch fertigen, zuvor vom Arm bzw. Kopf verdeckten Flächen. Diese Flächen sind daher **aus vorhandenen Original-Blau-/Cyan-Farben** ergänzt und im Manifest als rekonstruiert markiert; es wurden keine neuen Streifen, Schuppen oder Schattierungen erfunden. Jede Änderung an diesen Flächen ist später visuell reviewbar.

## Koordinaten und Hierarchie

Alle PNGs sind eng zugeschnitten und speichern die exakte Position im Original über `manifest.json` (`x`, `y`, `width`, `height`); außerdem hat jedes Teil `pivot.global`, `pivot.local`, `parent`, `attachments` und SHA-256. Auszug der Gelenke:

| Anschluss | Canvas-X/Y |
|---|---:|
| Kopf – Hals (Batch 01) | 690, 433 |
| Hals – Rumpf | 730, 620 |
| Vordere Schulter | 703, 648 |
| Vorderer Ellenbogen | 626, 748 |
| Vorderes Handgelenk | 732, 739 |
| Hintere Schulter | 845, 699 |
| Hinterer Ellenbogen | 885, 745 |
| Hinteres Handgelenk | 897, 739 |
| Vordere Hüfte | 486, 770 |
| Hintere Hüfte | 757, 828 |

Alle Bilder verwenden dieselben master-globalen Pixelkoordinaten, daher müssen `x/y` beim Zeichnen nicht geraten werden. Beim späteren Rotieren das **globale** Pivot verwenden, nicht das PNG-Zentrum.

## Wie kontrollieren?

- `previews/parts-contact-sheet.png`: Bildtafel nur als **Kontrolle** – die echten Teile sind die zehn separaten PNGs.
- `previews/comparison-original-rest-movement.png`: Original / zusammengesetzte 10 Teile + sieben Batch-01-Gesichtslayer / geringe Gelenkrotation. Schwanz und Unterschenkel/Füße sind **nur halbtransparent als Referenz** eingeblendet: Sie fehlen in Batch 02 absichtlich und kommen in Batch 03.
- `previews/joint-check-moderate-rotation.png`: Vergrößerte Schulter-, Ellenbogen-, Hüft- und Halsanschlüsse bei Grundstellung und ca. ±7° Testdrehung. Das sind **Standbilder für Qualitätskontrolle**, keine fertigen Idle-, Lauf- oder Kampfanimationen.
- `previews/joints-and-pivots.png`: Lage der Gelenke auf der Gesamtfigur, zur visuellen Kontrolle.

Ein Script reproduziert die zehn Dateien: `python kenny-rig-v2/batch-02/build_batch02.py` (benötigt `numpy`, `Pillow`, `scipy`, `opencv-python-headless`). Dessen Eingabe sind das freigegebene Original aus `public/kenny/rig/v1/source/kenny-approved-master.png` und die Metadaten/PNG-Dateien aus Batch 01.

`python kenny-rig-v2/batch-02/verify_batch02.py` prüft: genau zehn unabhängige transparente PNGs, korrekte Größen und SHA-256, identische Quelle wie Batch 01, **genau drei sichtbare Krallen an jeder Hand** und an allen neun geprüften inneren Gelenk-Zentren eine undurchsichtige Abdeckung. Die 7°-Testpose im Build wurde auf dieselben Gelenkzentren kontrolliert.

## Offene Review-Punkte (ehrlich)

- Dies ist **noch kein fertiges animierbares Produktionsrig**. Ein Polygon-/Spline-Maskenansatz kann die ursprünglich verdeckten Körperflächen nur näherungsweise ergänzen; dies gilt besonders für die hintere Schulter und den hinteren Hüftansatz.
- Die separaten Ober- und Unterarmstücke enthalten im Ursprung **keinen echten gemalten, unsichtbaren Ellbogeninnenbereich**. Die Naht muss bei **größerem Bewegungsradius** erneut visuell freigegeben und eventuell nachretuschiert werden.
- Nahe/ferne Kanten können bei leichten Drehungen zwar deckend sein, aber die Form der **Schwarz-Outlines** ist weiter optisch zu kontrollieren: Kein Pixeltest kann garantieren, dass jede Kontur nach dem Rotieren ästhetisch perfekt bleibt.
- Knie, Unterschenkel, Füße und Schwanz sind **nicht** Teil des Auftrags und werden ausdrücklich nicht vorab generiert.

**Keine Änderungen an `main`, Live-Spiel, bestehenden `public/kenny/rig/v1`-Assets, Mathsverse oder Firestore.**
