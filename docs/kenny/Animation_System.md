# Kenny Animation System – Master-Rig, Skin-Vererbung und einzelne PNG-Frames

> **Status: ARCHITEKTUR / GEPLANTE MIGRATION – NICHT IMPLEMENTIERT.**
> Stand: 23. November 2026. Dieses Dokument ist die verbindliche Planungs- und Übergabegrundlage für zukünftige Kenny-Animationsarbeiten in Studyverse. Die Erstellung dieser Dokumentation allein verändert weder die Laufzeit noch Assets, Spieldaten oder Mathverse.
>
> **Für jeden neuen Chat / Codex-Run:** Dieses Dokument **vollständig lesen**, danach den tatsächlichen GitHub-Stand untersuchen und die unter „Migration“ beschriebene nächste kleine Phase wählen. Nicht von früheren Chat-Aussagen ableiten, dass bereits etwas implementiert wurde. Vor Änderungen den aktuellen Branch, die Dateien und Tests verifizieren.

## 1. Ziel und zentrale Architekturentscheidung

Kenny soll dauerhaft **ein gemeinsames, anatomisch konsistentes 2D-Master-Modell** erhalten. Neue Animationen werden **einmal** als Bewegungsdaten erstellt; die auswählbaren Skins nutzen dieselben Knochen, Gelenke, Körperteile, Animationen und Pivots. Alle Varianten sollen anschließend **automatisiert als einzelne, transparente PNG-Dateien pro Frame** exportiert werden.

**Nicht** erneut fünf separat per KI erzeugte Animationssheets bauen. Die Zielpipeline ist:

    einmal gestaltete Kenny-Teile + Gelenke/Pivots
                         |
              ein Master-Rig (2D)
                         |
             gemeinsame Animationen
                         |
        Masken + Farbprofile der fünf Skins
                         |
      deterministischer Offline-Export pro Skin
                         |
     einzelne PNG-Dateien + geprüftes Manifest
                         |
        Skin-aware Frame-Player im Spiel

Das ist **Variante B** aus der Planung: eine Layer-/Maskenlösung **plus** 2D-Skelett/Cutout-Rig. Technisch eher **Komposition von Daten** als fünf TypeScript-Klassen mit Code-Vererbung. Konzeptionell gilt trotzdem „Master-Kenny als abstrakte Vorlage; die Skins erben Aussehen und Animation“.

**Warum:** keine Nachbarzellen im Atlas, klare Benennung, keine Neugenerierung derselben Posen pro Skin, zentrale Anatomiekorrekturen, gezielte Einzel-Frame-Reviews, reproduzierbare Exporte und weniger fehleranfällige Animation-Mappings.

Die **Master-Dateien** bleiben bearbeitbar. Die **PNG-Einzelbilder** sind generierte Ausgabe, nicht die einzige Quelle der Wahrheit.

## 2. Verifizierter Ist-Stand im Repository (vor der Umsetzung)

Repository: `nkwallix-dev/studyverse`. Der für die Analyse bekannte Stand ist Merge-Commit `2dbcd05d46b97270d953b50e2bbda468ff6f76ea` (PR #66). Bei späterer Umsetzung **immer** erneut prüfen, ob sich diese Dateien geändert haben.

### 2.1 Die ursprünglichen, guten Idle-Strips sind gesichert

Die fünf Originale wurden beim 30-FPS-Umbau **nicht überschrieben** und existieren weiterhin im Repo unter:

| Gespeicherte Skin-ID | Alter Idle-Strip | Alter Feed-Strip |
| --- | --- | --- |
| `blue` | `src/assets/kenny/skins/kenny-blue-idle-strip.png` | `src/assets/kenny/skins/kenny-blue-feed-strip.png` |
| `green` | `src/assets/kenny/skins/kenny-green-idle-strip.png` | `src/assets/kenny/skins/kenny-green-feed-strip.png` |
| `red` | `src/assets/kenny/skins/kenny-red-idle-strip.png` | `src/assets/kenny/skins/kenny-red-feed-strip.png` |
| `pink` | `src/assets/kenny/skins/kenny-pink-idle-strip.png` | `src/assets/kenny/skins/kenny-pink-feed-strip.png` |
| `zebra` (angezeigt als **Weiß**) | `src/assets/kenny/skins/kenny-zebra-idle-strip.png` | `src/assets/kenny/skins/kenny-zebra-feed-strip.png` |

Zusätzlich existieren `src/assets/kenny/kenny-idle-strip.png` und `src/assets/kenny/kenny-feed-strip.png`. Die ursprüngliche CSS-Darstellung: **vier horizontale Idle-Posen**, `background-size: 400% 100%`, `kenny-look` mit **6,4 Sekunden Loop**. Vorherige Referenz: Commit `09b5301adfa72ba1d3859526bc6a4748068290b4`, `src/styles.scss` bei Zeile 1034 ff.

**Wichtig:** Die originalen Strips und Skin-Avatare/Porträts sind Referenz und Backup. Nicht löschen, überschreiben oder durch neu generierte Bilder ersetzen. Erst ihre tatsächlichen Pixelmaße, Transparenz und Zellgrenzen maschinell prüfen, dann mit exakt bestimmtem Crop in vier separate PNGs zerlegen. Keine geratenen 541-/727-Pixel-Crops ohne Bildprüfung.

### 2.2 Aktueller fehleranfälliger Neu-Stand

- `public/kenny/atlases/kenny-{blue,green,red,pink,white}-30fps.png`: fünf Atlanten mit **1728 × 1152 px, neun Spalten, sechs Zeilen, 192 × 192 px je Zelle**.
- `public/kenny/animations/manifest.json`: Version 3, `fps: 30` und Atlas-Zeilenbelegung.
- `src/app/features/dinoverse/kenny-atlas.animation.ts`: Zell-/Skin-Mapping; `zebra` wird für die **Bildausgabe** auf `white` abgebildet.
- `src/app/features/dinoverse/platformer/kenny-platformer.animation.ts`: `PlayerMotion = 'idle' | 'walk' | 'jump' | 'attack'`. Bisher wird eine generische Attack-Reihe für mehrere Aktionen verwendet.
- `src/app/features/dinoverse/platformer/kenny-platformer.component.ts` und `kenny-platformer.renderer.ts`: Player-CSS-Sprite, Canvas/Fusion-Layer und Angriffsvisualisierung.
- `src/app/app.ts`, `src/app/app.html`, `src/styles.scss`: Dino-Season und Begleiterdarstellung.
- `src/app/features/dinoverse/dino-designer/dino-designer.component.html`: eigene Dino-Designer-Vorschau, die momentan auf gemeinsame `.kenny-sprite`-Styles angewiesen ist.
- `angular.json` übernimmt derzeit **`public/** in den Angular-Build. `src/assets/kenny/…` ist ein historischer Quellbestand; neue direkt abrufbare Bilder deshalb nach `public/kenny/…` exportieren.
- Die bisherigen Fusionsatlanten unter `public/kenny/animations/fusions/` sind **ein gesondertes System**. Nicht beiläufig mitersetzen.

### 2.3 Durch Nutzerbeobachtung bestätigte Probleme, die Tests später verhindern müssen

1. Im Dino-Designer sind alle fünf Kennys unsichtbar, obwohl die Skin-Auswahl funktioniert.
2. Im Dino-Season-Bereich erscheint Kenny deutlich pixeliger als die Originalillustration.
3. Beim Atlas-Cropping erscheinen manchmal Pixel/Whooshes der Nachbarframes.
4. Beim Gehen (A/D) verändert sich in der Expedition teilweise die sichtbare Größe und die Bodenposition.
5. Die normalen Bisse nach vorne/oben/unten waren falsch mit Futter-/Rattenbildern verknüpft.
6. Der Spezial-Sprung wurde auf den normalen Space-Sprung gelegt, obwohl er ausschließlich zur Spezialfähigkeit auf L gehören soll.
7. „Tests grün“ hat diese visuellen und semantischen Fehler nicht erkannt.

**Regression-Root-Cause-Prüfung:** Bei fehlenden Bildern die konkrete Netzwerk-URL, Angular-`baseHref` und `document.baseURI` kontrollieren. Die Seite läuft auf GitHub Pages unter `/studyverse/`; absolute Root-Pfade `/kenny/…` können dorthin falsch aufgelöst werden. Nicht blind an der Bilddatei herumschneiden, wenn der Bildpfad 404 liefert.

## 3. Unveränderliche fachliche Regeln

- **Fünf** reguläre Skins: **Blau (Standard), Grün, Rot, Pink, Weiß**. Pink muss wirklich **rosa/pink**, nicht lila sein; Weiß hat **weißen Körper und schwarze Streifen**, nicht nur eine entsättigte blaue Variante. Die Augen, Krallen und das Maul bleiben als eigene, bewusst definierte Materialbereiche erhalten.
- Persistierte IDs bleiben **`blue`, `green`, `red`, `pink`, `zebra`**. `zebra` ist die **bestehende Datenbank-/Inventar-ID** für den sichtbaren weißen Skin. Kein Benutzerprofil migrieren, kein neues Skin-Item, keine Drops/Token/XPs verändern. Für Renderdaten kann intern `white` als Anzeigename dienen.
- Das süße Kenny-Gesicht aus den gelieferten Originalreferenzen bleibt erhalten: große gelbe Augen, freundlicher Cartoon-Look, dunkle Rückenstreifen, hellere Unterseite.
- Wenn anatomisch optimiert wird: **drei Finger je Hand, drei Hauptzehen je Fuß** und die charakteristische, hochgestellte Sichelkralle am inneren Zeh (zwischen den Beinen sichtbare Seite). Klauen, Beine und Perspektiven über alle Frames konsistent – **keine neue Dino-Identität**.
- Ein Master-Rig und dieselben Pose-Daten für sämtliche Skins. Farbvarianten **nicht** einzeln per Textprompt neu generieren.
- **J** = normaler Biss; horizontal links/rechts sowie eigenständige Bewegungen für oben und unten, gesteuert durch `world.biteAim`. **Keine Ratte** in Expedition/Angriffen.
- **Space** = gewöhnlicher Sprung, **ohne** Spezial-L-Wind-/Impact-Effekt.
- **L** = offensive Spezialfähigkeit (`leap`, `tail`, `charge` je Ausrüstung). Die große Sprungangriffsanimation mit Wind-Whooshes/Staub gehört **nur zu `leap` auf L**, nicht zu Space. Bei anderen Spezialfähigkeiten passende separate Animationen verwenden.
- **Fütterung nur in Dino-Season:** Eine **kleine Ratte** ist anfangs vollständig unsichtbar, läuft danach **schrittweise von außerhalb des Bildes herein**, Kenny bemerkt sie, schnappt, frisst und kehrt in die Idle-Haltung zurück. Keine Ziege, keine Drohne/Fleischkiste als ungewollter Ersatz.
- Spielphysik, Hitboxen, Reichweiten, Jump-/Angriffstiming, Fusionseffekte und Economy dürfen durch den Grafikumbau nicht heimlich verändert werden. Größen basieren auf denselben logischen Welt-Einheiten, unabhängig von Zoom und Auflösung.
- **Kein Merge/Deployment** neuer Visuals ohne reale Desktop- und Mobile-Vorschau sowie ausdrückliche Freigabe. Jedes Problem reproduzierbar an Frame/Animation/Skin benennen.

## 4. Ziel-Datenstruktur (Vorschlag; noch nichts davon existiert)

Die Struktur trennt **Quellen** von **exportierten PNGs**:

    assets/kenny/rig/
      README.md
      rig.json                         # Gelenke, Pivot, Zeichenreihenfolge, Referenzkoordinaten
      parts/
        head/
          skull.png                    # neutrale Ebene, transparent
          upper-jaw.png
          lower-jaw.png
          left-eye.png
          right-eye.png
        body/
          torso.png
          belly.png
          neck.png
        arms/
          near-upper.png
          near-forearm.png
          near-hand.png
          far-upper.png
          far-forearm.png
          far-hand.png
        legs/
          near-thigh.png
          near-shin.png
          near-foot.png
          far-thigh.png
          far-shin.png
          far-foot.png
        tail/
          root.png
          middle.png
          tip.png
      masks/
        body.png
        belly.png
        stripes.png
        claws.png
        eyes.png
        mouth.png
      skins/
        blue.json
        green.json
        red.json
        pink.json
        white.json
      animations/
        idle.json
        walk.json
        jump.json
        bite-horizontal.json
        bite-up.json
        bite-down.json
        special-leap.json
        special-tail.json
        special-charge.json
        feed-rat.json
      actors/
        rat/                           # eigenes Tier-Rig und Animation, kein Teil des Kenny-Skins
      effects/
        dust/                          # eigene transparente Effektlagen
        whoosh/

    scripts/kenny/
      extract-legacy-idle.mjs           # spätere Implementierung, exakte verlustfreie Einzelcrops
      render-frames.mjs                 # spätere Implementierung, Master + Skin -> PNGs
      validate-frames.mjs               # spätere Implementierung, Dimensions-/Alpha-/Pfadcheck
      compare-frames.mjs                # spätere Implementierung, visuelle Diff-Übersicht

    public/kenny/frames/v2/
      manifest.json
      blue/
        idle/frame-000.png
        idle/frame-001.png
        ...
        bite-horizontal/frame-000.png
        ...
      green/
        idle/frame-000.png
        ...
      red/
      pink/
      white/
      actors/rat/
        run/frame-000.png
      effects/
        dust/
        whoosh/

    src/app/features/dinoverse/kenny-frame-player.ts
    src/app/features/dinoverse/kenny-frame-player.spec.ts

    tools/kenny-preview/
      README.md
      ...                               # optionaler lokaler Frame-/Rig-Viewer

Der bestehende Stand bleibt parallel erhalten. Alle Pfade oben sind **geplante Dateien**, nicht „schon erledigt“. Keine Live-Referenz auf `v2`, bevor die Pipeline funktioniert.

**Erster kleiner Meilenstein:** Die alten fünf Idle-Strips präzise und unverändert in jeweils vier PNG-Einzelbilder nach `public/kenny/frames/v2/{skin}/idle/` extrahieren; für den **späteren** echten Master-Rig-Export können daraus längere Sequenzen entstehen. Niemals beim Extrahieren die Originale überschreiben. Ein früher PNG-Split ist **noch keine** saubere Master-Rig-Implementierung.

## 5. Rig- und Layer-Vertrag

### 5.1 Referenzsystem

- Gemeinsame lokale Koordinaten, z. B. Master-Canvas **768 × 1024 px** als **vorläufiger Exportvorschlag**. Endmaße erst nach Sichtprüfung festschreiben (Kenny mit Schwanz, aufrechter Kiefer und Effekte müssen hineinpassen).
- Einheitlicher **ground anchor/foot baseline** pro Pose: der Dino steht nie durch einen anderen Frame plötzlich höher oder tiefer. Anatomische Beinbewegungen dürfen sichtbar sein; die Spielerkollision und Root-Position bleiben getrennt.
- Gelenke/Pivots in `rig.json` mit Koordinaten relativ zu ihrem Parent: Halsgelenk, Schädel, Kiefergelenk, Schulter, Ellenbogen, Handgelenk, Hüfte, Knie, Sprunggelenk, Zehen, Schwanzsegmente.
- Klare Zeichenreihenfolge mit **hinteren Körperteilen**, Rumpf, **vorderen Teilen**, Kopf/Kiefer und gezielten Effekten; auf Links-/Rechtsansicht prüfen.
- Keine Körperteile per „ungefährem Atlas-Crop“ aus zusammengesetzten Posen stehlen. Ein freigestellter Kopf braucht eine vollständige, sauber geschlossene Hals-Naht.
- Rig-Assets haben sinnvolle **Sicherheitsränder**. Nie einen Schwanz, eine Nase, Fußkralle oder einen Whoosh an der Bildkante abschneiden.
- Pro Frame gleiches Canvas und dieselbe logische Dino-Skalierung, damit nur die **Pose** wechselt.

### 5.2 Was wirklich aus dem 2D-Rig wiederverwendbar ist

- Der **Unterkiefer** kann für horizontale, hohe und tiefe Bisse um ein echtes Kiefergelenk rotieren. Der **Kopf/Hals** liefert die jeweilige Angriffsrichtung.
- **Beine und Füße** nutzen dieselben Gelenke für Stand, Walk und Jump; Fußkontakt wird für Walk/Idle fixiert, damit keine ungewollte Gleitbewegung entsteht.
- Der **Schwanz** gleicht Schritte und Sprünge aus; seine Segmente dürfen sich biegen.
- **Krallen** und Sichelkralle gehören als definierte Teile zum Arm-/Fuß-Rig, nicht als zufälliger neu generierter Detailstrich.
- **Gesichtsausdrücke** (Blinzeln, Schnüffeln, Zufriedenheit) werden als austauschbare Augen-/Maul-/Nasen-Posen oder kleine Deformationen modelliert.
- Für starke Perspektiven oder Deformationen können zusätzlich **spezielle Ersatzzeichnungen** pro Pose nötig sein. Reine Rotation ohne Formänderung kann hölzern wirken; lieber eine gezielte Master-Pose als fünf unpassende Skin-Generierungen.

### 5.3 Skin-Material und Vererbung

Ein gemeinsamer Materialvertrag enthält mindestens `body`, `belly`, `stripes`, `claws`, `eyeIris`, `eyeWhite`, `mouth` und `outline`. Masken dürfen **nicht** auf bloßen RGB-Thresholds beruhen: Ähnliche Blau-/Grauwerte in Konturen, Schatten und Zähnen würden sonst falsch umgefärbt. Am besten echte Material-/Layer-Masken im Rig aus den Masterteilen erzeugen.

- Blau = Master und Standard; alle Originalfarben aus der freigegebenen Referenz übernehmen.
- Grün = grüne Körperflächen, dunklere grüne Streifen.
- Rot = rote Körperflächen, dunklere rote Streifen.
- Pink = erkennbar rosa/pink, nicht lila und deutlich von Rot unterscheidbar.
- Weiß = weiße Körperflächen mit **schwarzen Streifen**; Schatten dürfen die Figur lesbar halten, ohne den weißen Charakter zu verlieren.
- Augen, Innenmaul, Krallen und Umrisse werden selektiv gefärbt; globale `hue-rotate`-Filter sind **keine** endgültige Lösung.

**Skin-Export = deterministisches Anwenden der Materialwerte auf dieselben Pose-Daten.** Ein einmal korrigierter Finger, Fuß oder Kopf erscheint nach Re-Export bei allen Skins korrekt.

## 6. Frames, FPS und Gameplay-Zeit sind drei verschiedene Dinge

**Ziel:** Neue Kenny-Grafikanimationen verwenden standardmäßig **10 Bildwechsel/Sekunde (10 FPS)**, unabhängig von der eigentlichen Spiele-Renderfrequenz. Die Expedition kann weiterhin mit `requestAnimationFrame` gerendert werden; die Simulation behält ihre existierenden festen Zeitschritte (im überprüften `KennyWorld`: `STEP = 1 / 120`). Physik, Kollisionen und Hit-Timing werden **nicht** auf 10 Hz reduziert.

    sichtbarer Frame-Index = floor(Animationszeit_in_Sekunden * 10)

Nur bei Loop-Sequenzen modulo Frameanzahl; bei einmaligen Aktionen am letzten Frame halten, abbrechen oder sauber in Idle übergehen.

**WICHTIGER TIMING-KONFLIKT, vor dem Combat-Export ausdrücklich entscheiden:**
- `BALANCE.bite.duration` ist aktuell **0,22 s**. Bei **10 FPS** können in dieser Zeit nur **2–3 unterschiedliche Bilder** tatsächlich erscheinen. **10 eindeutige Bissbilder bei starren 10 FPS benötigen mindestens 1,0 s.**
- `BALANCE.leap` dauert aktuell **0,08 + 0,30 + 0,12 = 0,50 s**. **30 L-Sprungangriffsbilder bei 10 FPS benötigen 3,0 s.**
- `BALANCE.tail.duration` ist **0,8 s**. Der Spieler-`charge` dauert derzeit **1,0 + 0,4 + 0,2 = 1,6 s**.
- Die aktuelle Fütterung dauert **3,2 s**. Das passt zu **32 Zeitschritten bei 10 FPS**.

**Nicht** für hübsche Grafik stillschweigend Kampfdauer, Cooldown, Reichweite oder Kollision ändern. Vor Combat-Implementierung zwischen folgenden Wegen ausdrücklich entscheiden und im PR dokumentieren: (A) 10-FPS-Look mit weniger tatsächlich sichtbaren Kampfbildern und 10+ Master-Keyposes als Quellmaterial, (B) für sehr kurze Combat-Aktionen **gezielt höhere Bildwechselrate**, oder (C) sichtbare Recovery über die Hitzeit hinaus bei jederzeit sauber unterbrechbarer Animation. **Keinen dieser Wege ohne Review als „erfüllt 10 Frames bei 10 FPS“ deklarieren.**

Eine Bildgenerator-Ausgabe von höchstens zehn Referenzbildern ist **keine** technische 10-FPS-Grenze. Das Rig kann Zwischenposen/Frames interpolieren und für jeden Skin deterministisch exportieren. Entscheidend sind visuelle Qualität und korrekte Zustandszeiten.

## 7. Gewünschte Animationen und eindeutige Zustände

Die Zahlen in der Tabelle sind **künstlerische Zielvorgaben aus den Nutzerwünschen**, **nicht** Bestandszahlen oder bereits zugesagte technisch kompatible Laufzeiten.

| Animation-ID (geplant) | Quelle / Ort | Zielbilder | Wichtig |
| --- | --- | ---: | --- |
| `idle` | Lobby, Dino-Designer, Season, ruhender Expedition-Kenny | ursprünglich 30 Posen als längeres Ausbauziel; zunächst **4 alte, sichere Einzelbilder** | Blickwechsel, Blinzeln, Schnüffeln, Strecken, Kratzen; entspannt und loopbar; altes 6,4-s-Gefühl als Referenz |
| `walk` | Bewegung A/D in Expedition | mindestens 10 Master-Posen | links/rechts dieselbe Schrittfolge, korrekt gespiegelt/bei Bedarf perspektivisch korrigiert; Füße am Boden |
| `jump` | **Space** in Expedition | eigene normale Sprungsequenz | **kein** L-Spezialangriff, keine übertriebenen Whooshes |
| `bite-horizontal` | **J**, ohne vertikale Zielrichtung | ursprünglich mindestens 10 Master-Posen | Kopf/Kiefer schnappen horizontal; links/rechts gespiegelte Richtung |
| `bite-up` | **J + W** | ursprünglich mindestens 10 Master-Posen | Kopf/Kiefer schnappen **nach oben** |
| `bite-down` | **J + S** | ursprünglich mindestens 10 Master-Posen | Kopf/Kiefer schnappen **nach unten** |
| `special-leap` | **L**, ohne andere offensive Fusion | ursprünglich mindestens 30 Master-Posen | Vorbereitung, Absprung, Krallen/Maul, Whoosh, Landung/Staub |
| `special-tail` | **L** mit Stego-Offensivausrüstung | separat | Schwanzschlag statt Leap; bestehende Item-Fusionen erhalten |
| `special-charge` | **L** mit Triceratops-Offensivausrüstung | separat | Horn-/Charge-Motion; bestehende Item-Fusionen erhalten |
| `feed-rat` | **nur Dino-Season-Füttern** | **32 Exportframes bei 10 FPS für 3,2 s** als Ziel | Ratte erst außerhalb, dann sichtbarer Laufweg, Kenny sieht sie, schnappt, frisst, erholt sich |

### Fütterung als zwei Akteure, nicht als ein 5-fach generiertes Rattenbild

Die **Ratte ist ein eigenes Sprite/eigener Layer**, nicht Teil von Kennys pinken/grünen/blauen Körperteilen. Damit lässt sich ihr Weg exakt animieren und bei allen fünf Skins ohne Copy-Paste wiederverwenden. Die Szene synchronisiert `kennyPose` und `ratPose` anhand derselben **Feeding-Timeline**.

Vorgeschlagene 32-Schritt-Fütterung (10 FPS, Enddauer 3,2 s):
- `0–5`: Ratte komplett **außerhalb** bzw. nicht sichtbar; Kenny wartet.
- `6–13`: Ratte **von rechts schrittweise** hinein; jedes Frame eine nachvollziehbare Position. Keine plötzlich komplett sichtbare Ratte.
- `14–17`: Kenny nimmt die Ratte wahr, Blick/Schnauben/Ausrichten.
- `18–22`: Schnappbewegung und Fang.
- `23–27`: Fressen/Kauen/Schlucken.
- `28–31`: zufriedene Rückkehr in Idle.

Diese Phasen sind **Entwurfswerte**. Timing und sichtbare Übergänge in einer Vorschau verifizieren; die Economy bestätigt eine Fütterung nicht allein deshalb, weil ein Bildwechsel stattfand. Keine Rattenbilder im normalen `J`-Biss.

### Priorität bei kollidierenden Zuständen

1. explizit laufendes `special` mit korrektem `SpecialKind`,
2. expliziter `bite` mit `biteAim`,
3. `jump`/Fall solange physikalisch nicht am Boden,
4. `walk` bei Bodenbewegung,
5. `idle`.

**Dies ist lediglich die Zielpriorität der sichtbaren Animation.** Die Entscheidung über Physik, Schaden, Fähigkeiten und Eingaben bleibt im bestehenden `KennyWorld`. Keine neue Logik, bei der ein Space-Sprung versehentlich als L-Spezial interpretiert wird. Bei Fusionen im Renderpfad konkret kontrollieren, ob eine spezielle Zeichnung statt des Basisskins dargestellt werden muss.

## 8. Export, Metadaten und Frame-Player

### Export-Regeln

- Jede Frame-Datei ist **ein eigenständiges PNG mit Alpha-Kanal**. **Kein** Raster, Gitter, Text, dekorativer Hintergrund oder Nachbarframe.
- Gleiche Canvas-Maße je Animationssatz; idealerweise global festes Canvas und deklarierter Bodenanker. Transparentes Padding ist korrekt und darf nicht willkürlich automatisch weggeschnitten werden.
- Genügend Pixel für die größte tatsächlich dargestellte Größe in Dino-Season/Designer; die bisherigen **192 px pro Zelle** sind keine akzeptierte Qualitätsreferenz. Auf Desktop und Mobile in echter CSS-Größe visuell vergleichen.
- Durchgehende dreistellige Namen `frame-000.png`, `frame-001.png` usw.; Reihenfolge **niemals** lexikografisch ungesichert behandeln.
- Farbskims sollen **pixelgleiches Bewegungsgerüst** und gleiche Pivots behalten. Alle fünf müssen einzeln prüfbar bleiben.
- Bei Identität/Masken-Export prüfen: keine Farbreste, Alpha-Halos, schwarzen Rechtecke, verschobenen Kiefer oder abgeschnittenen Extremitäten.
- Build deterministisch: Aus denselben Masterdaten entsteht dieselbe Exportversion. Exportversion z. B. `v2` separat vom alten `30fps`-Atlas; Cache-Busting über versionierte URLs/Manifest.
- Lade nur **aktiven Skin und benötigte Animationen** vor; große Bildsammlungen nicht ungefragt für alle fünf Skins beim Appstart laden. Für 650+ Bilder Performance, Speicher und GitHub-Pages-Asset-Größe messen.
- Neue Laufzeit-URLs immer gegen `document.baseURI` auflösen; keine absoluten `/kenny/…`-Pfade hardcoden.

### Geplanter Manifest-Vertrag (Beispiel, **kein bestehendes Format**)

    {
      "version": 2,
      "fps": 10,
      "frameWidth": 768,
      "frameHeight": 1024,
      "skins": ["blue", "green", "red", "pink", "white"],
      "legacySkinAliases": { "zebra": "white" },
      "animations": {
        "idle": { "frames": 4, "loop": true },
        "walk": { "frames": 10, "loop": true },
        "jump": { "frames": 10, "loop": false },
        "bite-horizontal": { "frames": 10, "loop": false },
        "bite-up": { "frames": 10, "loop": false },
        "bite-down": { "frames": 10, "loop": false },
        "special-leap": { "frames": 30, "loop": false },
        "feed-rat": { "frames": 32, "loop": false }
      }
    }

**Beispiel, nicht voreilig aktivieren:** Dieser Manifest-Entwurf zeigt gewünschte Verzeichnis-/Frame-Zahlen. **Combat-Timingkonflikt aus `6 vorher lösen.** Die reale Exportauflösung und neue Idle-Framezahl nach visueller Prüfung festlegen; eine Transition mit vier extrahierten alten Idle-Bildern ist als erster sicherer Schritt sinnvoll.

### Ziel-API (Entwurf)

    type PersistedKennySkin = 'blue' | 'green' | 'red' | 'pink' | 'zebra';
    type RenderKennySkin = 'blue' | 'green' | 'red' | 'pink' | 'white';
    type KennyMotion =
      | 'idle' | 'walk' | 'jump'
      | 'bite-horizontal' | 'bite-up' | 'bite-down'
      | 'special-leap' | 'special-tail' | 'special-charge'
      | 'feed-rat';

    interface KennyFramePlayer {
      setSkin(skin: PersistedKennySkin): void;
      play(motion: KennyMotion, options?: { loop?: boolean; facing?: -1 | 1 }): void;
      seek(frameIndex: number): void;
      stop(): void;
      destroy(): void;
    }

Dies ist ein **Designvertrag**; Angular/DOM/Canvas-Adapter können die echte Schnittstelle noch beeinflussen. Skin-ID nur im **Adapter** auflösen, nicht Firestore-Daten umbenennen.

## 9. Performance und visuelle Stabilität

- **Ein** Animator/Timeline-Service ist für Framewahl verantwortlich; Dino-Season, Dino-Designer und Expedition sollen denselben Frame-Vertrag nutzen, aber ihre **verschiedenen Ereignisse** behalten.
- Beim Skinwechsel in der Vorschau zuerst aktiven Frame des neuen Skins laden, dann austauschen; niemals leere Fläche oder kurz falsches Skin-Bild zeigen.
- Bei Ladefehler nicht unsichtbar rendern: zuletzt gültiges Idle-Bild als Fallback, Fehler loggen und im Test sichtbar machen.
- **Feste Root-Position** im Platformer. Die CSS-/Canvas-Größe darf nicht durch `walk`, `bite` oder `jump` wechseln. Das Sprite wird mit konstantem Ground-Anchor gerendert; die **Hitbox** kommt ausschließlich aus der bestehenden Weltphysik.
- Links/Rechts: Körper darf gespiegelt werden, aber Text, separate Effekte, Feind-/Aufsatz-Pivots und Sichelkrallen-Lage einzeln kontrollieren. Nie die Weltkoordinaten spiegeln.
- `prefers-reduced-motion`: optionale Idle-Animation pausieren; explizite Fütterung und notwendiges Spielzustandsfeedback weiterhin korrekt und barrierearm abbilden.
- Altlasten wie CSS-`background-position`, `background-size: 900% 600%` und auf 192 px bezogene Crop-Berechnungen **erst** entfernen, wenn sämtliche Nutzeroberflächen auf den neuen Frame-Player umgestellt und geprüft sind.

## 10. Tests sind Vertragsprüfung **und** Sichtkontrolle

Tests für mindestens:

1. **Asset-Integrität:** Jede Manifestdatei existiert; jedes PNG hat gültige Signatur, Alpha und erwartete Maße. Kein Gitter/Schachbretthintergrund; Transparenz-Randprobe an den Eckpixeln.
2. **Frame-Isolation:** Ein einzelnes PNG enthält nur die beabsichtigte Pose/den zugehörigen Effekt. Kein Nachbarframe kann hineinbluten, da es keine Atlas-Zellen mehr gibt.
3. **Alle Skins:** Gleiche Framezahlen, Canvasmaße, Pivots, Bodenlinie und Animations-Timeline; Pink rosa, Weiß weiß/schwarz; `zebra`-Speicherdaten bleiben lesbar.
4. **J-Richtungen:** Horizontale, obere und untere Bissanimation sind unterscheidbar. Keine Ratte; kein L-Spezialeffekt.
5. **Space vs. L:** Space spielt gewöhnlichen Sprung, L bei `leap` den Spezial-Sprung; `tail`/`charge` zeigen jeweils eigene Animation. Damage/Cooldowns unverändert.
6. **A/D und Bodenlinie:** Sichtbare Dino-Größe, Kopf-/Fuß-Proportionen und Bodenanker bleiben beim Wechsel von Idle nach Walk und beim Richtungswechsel konstant.
7. **Ratten-Fütterung:** Im ersten Bild keine Ratte, danach nachvollziehbarer, frameweiser Eintritt von außerhalb; erst nach dem richtigen Fang-/Fressablauf zurück zu Idle.
8. **GitHub Pages:** Assets laden unter `/studyverse/`; Test kontrolliert konkrete Requests auf 200, nicht nur eine nichtleere CSS-Eigenschaft.
9. **Desktop/Handy:** echte Screenshots im Dino-Designer, bei Dino-Season und in der Expedition; verschiedene Skins, Idle, Walk, Richtungsbiss, Space, L und Fütterung; auf Unschärfe, Cropping, Bodenlinie prüfen.
10. **Bestandsregression:** Kenny-Gameplay, Fusionen, Ausrüstungsslots, Schild-Regeneration, Shop, Belohnungen, Profil, TastyTokens, Firestore und andere Lernwelten unverändert.

Bestehende Startpunkte: `scripts/test-kenny-30fps-assets.cjs`, `scripts/test-kenny-platformer.cjs`, `scripts/test-kenny-platformer-browser.cjs`, `scripts/test-dino-season.cjs`, `src/app/features/dinoverse/kenny-atlas.animation.spec.ts`. Für `v2` **neue** Tests schreiben und die alten erst nach bestätigter Migration anpassen.

### Verifikations-Kommandos (vor Merge)

    npm ci
    npm run format:check
    npm test
    npm run build
    node scripts/test-kenny-platformer.cjs
    node scripts/test-dino-season.cjs

**Browser-Tests** nach den im Repository vorhandenen Skript-/CI-Vorgaben ausführen; nicht blind versprechen, dass ein neuer Browser ohne Setup vorhanden ist. Den aktuellen GitHub-Actions-Workflow und seine Logs vollständig prüfen. Automatische Tests **allein** reichen nicht: visuelle Gegenüberstellung bei echter Rendergröße ist ein eigener Pflicht-Gate.

## 11. Menschlich bedienbare Vorschau: Pflichtbestandteil, nicht Luxus

Der Nutzer muss nicht Gelenk-JSONs lesen. Die Vorschau muss mindestens:
- Dropdown **Skin** (fünf Varianten),
- Dropdown **Animation**,
- Play/Pause und **Frame-vor/Frame-zurück**,
- FPS-Einstellung mit Default 10 und Zeitlupe,
- transparente/checkerboard-Hintergrundumschaltung **nur im Viewer**,
- wahlweise eingebaute Dino-Season-/Expedition-Hintergründe,
- Ground-Anchor, Gelenke und Bounding-Box **optional** sichtbar,
- Anzeige **Frame-ID** (z. B. `pink/bite-up/frame-007.png`),
- einfacher Vergleich **altes Original vs. neuer Export**,
- Möglichkeit, einen Screenshot pro Frame zu machen.

Der Nutzer meldet so z. B. „Pink → Biss nach oben → Frame 07: Kopf zu weit rechts“, ohne Programmiersprache lernen zu müssen. Neue Posen und Masterteile werden erst nach visueller Abnahme aller fünf Varianten veröffentlicht.

## 12. Konkreter Migrationsplan (inkrementell, jeder Schritt separat testbar)

### Phase 0: Sicherung und Analyse
- [ ] Neueste Branch-/Main-Historie lesen, laufende Mathverse-Änderungen respektieren, **separaten Kenny-Feature-Branch** von aktuellem `main` erstellen.
- [ ] Die alten fünf Idle-Strips, die alten Feed-Strips und aktuelle neue Atlanten inventarisieren (Maße, Alpha, Hash, Dateipfade, Screenshot).
- [ ] Originale unangetastet lassen; den Zustand der drei Oberflächen vor dem Umbau dokumentieren.
- [ ] In diesem Schritt **kein** Legacy-Asset löschen, keinen Player umstellen und nicht deployen.

### Phase 1: Verlustfreier Einzelbild-Split als schneller, sicherer Beweis
- [ ] Exakte alte Idle-Stripmaße aus PNG-Metadaten bestimmen (nicht aus CSS-Ratio raten).
- [ ] `scripts/kenny/extract-legacy-idle.mjs` schreiben: aus jedem Strip **vier** PNGs mit transparentem Hintergrund und **identischem** Ausschnitt/Canvas exportieren.
- [ ] Unit-/Bildtests: Summe der vier Original-Zellpixel reproduzierbar, keine fehlenden Extremitäten, alle fünf Skins, gleiche Baselines.
- [ ] Im privaten Preview die Framefolge inklusive 6,4-s-Look abspielen.
- [ ] Nutzerfreigabe für die vier extrahierten Idle-Posen; kein voreiliger Ersatz aller alten Animationen.

### Phase 2: Master-Rig herstellen
- [ ] Aus den freigegebenen blauen Referenzen saubere Kopf-/Kiefer-/Rumpf-/Arm-/Bein-/Schwanz-Teile und Materialmasken erstellen.
- [ ] Dreifingerigkeit, Hauptzehen und Sichelkrallen korrekt gestalten; Nasen-/Kiefernaht, Augen und Ausdruck gesondert prüfen.
- [ ] Gelenke, Pivots und Layer-Reihenfolge in `rig.json` dokumentieren; Ground-Anchor festlegen.
- [ ] **Eine** reproduzierbare Basispose und **eine** kurze Idle-Bewegung bauen. Master-Rig zunächst unabhängig vom Live-Spiel visualisieren.

### Phase 3: Fünf Skins aus **einem** Master exportieren
- [ ] Vorhandene Original-Skinfarben/Stripes als Referenz vergleichen; Materialprofile in `skins/*.json` ableiten.
- [ ] Deterministischen Export für Blau, Grün, Rot, **Rosa-Pink**, **Weiß mit schwarzen Streifen** implementieren.
- [ ] Einheitliche Pivots/Dims/Positionen im PNG pro Frame; Thumbnail-Vergleich aller fünf nebeneinander.
- [ ] Bei Änderungen nur Master-Maske/Animation anpassen, dann fünf Skins neu exportieren; nicht neu prompten.

### Phase 4: Frame-Player und Idle-Einführung **nur für Designer/Season**
- [ ] Manifest/PNG-Loader mit `document.baseURI` und Skin-Fallback implementieren; dafür zuerst fehlschlagende Tests schreiben.
- [ ] Frame-Player im Dino-Designer, in Begleiter-Vorschau und Dino-Season für **Idle** integrieren.
- [ ] GIF-/Screenshot-/Browser-Review: keine leeren Dinos, keine Unschärfe, Kopf/Blinzeln/Bodenlinie korrekt.
- [ ] Expedition, J/L/Space und Fütterung bleiben zunächst **auf altem Funktionsstand**. Kein Big-Bang-Rewrite.

### Phase 5: Fütterung als getrennte Kenny-/Ratten-Timeline
- [ ] Rat-Rig/Framefolge und Position außerhalb → innerhalb der Stage implementieren.
- [ ] `feed-rat` mit dem bereits bestehenden 3,2-s-Ablauf und 10-FPS-Frame-Player synchronisieren.
- [ ] Futter-Preis, Belohnungen, Speicherbestätigung, Level-Ups und UI unverändert lassen; fehlgeschlagene Speicherung darf keine unberechtigte Belohnung erzeugen.
- [ ] Alle fünf Skins, Start ohne Ratte und flüssiges Hereinlaufen im Browser visuell prüfen.

### Phase 6: Expedition – Bewegungen und gewöhnlicher Sprung
- [ ] `walk` aus gemeinsamen Keyposes bauen; A/D, Blickrichtung, feste Player-Größe und Ground-Anchor testen.
- [ ] `jump` für Space separat bauen, inklusive Aufstieg/Fall/Landung **ohne** L-Spezialeffekt.
- [ ] Fusions-/Rüstungsdarstellung und Hitboxen auf bestehender Weltphysik belassen.

### Phase 7: Angriffe und Fusions-Specials
- [ ] ZUERST Timingentscheidung aus `6 dokumentieren und freigeben; insbesondere 0,22-s-Biss vs. 10-Pose-Ziel.
- [ ] Drei Richtungsbisse für J mit separaten Head-/Jaw-Keyposes; Rattenframe darf niemals in den Expedition-Player gelangen.
- [ ] `special-leap` ausschließlich für L/`leap`; Stego-`tail` und Triceratops-`charge` getrennt darstellen.
- [ ] Automatisierte Eingabe- und Animationszuordnungstests + echte Spiel-Screenshots gegen die früheren Fehler.

### Phase 8: Finalisieren und erst dann altes Rendering entfernen
- [ ] Alle Screenshots, Asset-/Perzeptions-/Performance-/Browser-Tests und Build grün.
- [ ] Nutzer sieht **Dino-Designer, Dino-Season und Expedition** und gibt **visuelle Freigabe**.
- [ ] Erst dann verbliebene alte Atlas-Referenzen, obsolete CSS-Crops und ersetzte Tests kontrolliert entfernen.
- [ ] Historische Original-Strips und ursprüngliche Identitätsreferenzen **als Backup** behalten.
- [ ] PR mergen und GitHub-Pages-Deployment abschließend verifizieren; kein „fertig“ vor Beleg.

## 13. Werkzeuge sinnvoll einsetzen (optional; nie Selbstzweck)

- **GitHub:** Quellstand prüfen, isolierter Kenny-Branch, kleine Commits/PR, CI und Deploy-Checks.
- **Superpowers:** Spezifikation, schrittweiser Plan, TDD, systematisches Debugging und unabhängige Review-Gates.
- **Figma:** Körperteile, Layer, Pivots, Pose-Vergleich und editierbares Rig-/Viewer-Design.
- **tldraw:** Zustandsdiagramm für Idle/Walk/J/L/Feed und Szenen-/Gelenk-Skizzen.
- **fal:** **einmalige** Charakter-/Teile-Referenzen oder neue Spezialzeichnungen, nicht fünf unabhängig generierte Skin-Animationen.
- **Adobe:** echte transparente Freisteller, Masken, Retusche und Qualitätskontrolle der Masterteile.
- **Context7:** Dokumentation zu den tatsächlich verwendeten Angular-/Sharp-/Canvas-APIs prüfen.
- **TinyFish / Browser-Tests:** UI-/Grafikprüfung im laufenden Studyverse; ein reines „CSS-Klasse vorhanden“-Assertion ist nicht genug.
- **PostHog:** gegebenenfalls nach sauberer Instrumentierung Nutzungs-/Fehlerdaten; kein Ersatz für visuelle Abnahme.

**Fallback:** Wenn ein Plugin nicht verfügbar oder kostenpflichtig ist, keine Fake-Resultate melden. Das Repo und die lokale deterministische PNG-Pipeline müssen auch ohne Zusatzplattformen wartbar bleiben.

## 14. Einfache Übergabe an einen neuen Chat

**Startprompt für zukünftige Implementierung:**

> Arbeite am Kenny-Animationsrework in `nkwallix-dev/studyverse`. Lies zuerst vollständig `docs/kenny/Animation_System.md` und prüfe den aktuellen Repo-Stand. Benutze die dort beschriebene Master-Rig-/Masken-/Einzel-PNG-Architektur. Starte auf einem eigenen Branch und bearbeite **nur die nächste klar abgegrenzte Phase**. Die fünf Original-Idle-Strips und alle bestehenden Spielerdaten müssen erhalten bleiben. Keine Animationen pro Skin unabhängig generieren. Beachte 10-FPS-Präsentation getrennt von Physik, J-Richtungsbiss vs. L-Spezial vs. Space-Sprung, und die Ratte ausschließlich in Dino-Season. Zeige zunächst Tests und echte Screenshots, bevor du etwas nach `main` mergst oder veröffentlichst.

**Wer dieses Dokument fortschreibt:** Jede tatsächliche Umsetzung braucht eine sichtbare Kennzeichnung **IMPLEMENTIERT** mit Commit/PR, Exportversion, Testnachweis und verbleibenden Problemen. „Im Dokument beschrieben“ darf **nie** als „im Spiel umgesetzt“ ausgegeben werden.

## 15. Stop-Regeln: Was künftig ausdrücklich nicht mehr passieren darf

1. Keine Veröffentlichung, nur weil Build und generische Tests grün sind, während Dino-Designer oder Expedition sichtbar falsch sind.
2. Keine neuen 9×6-Atlanten als vermeintliche vollständige 30-Frame-Animation deklarieren.
3. Nicht aus 10 AI-Bildern automatisch 10 FPS, 10 eindeutige Kampfposen und echte korrekte Hit-Timings ableiten.
4. Keine unkontrollierten `background-position`-Quick-Fixes über einer fehlerhaften Bildaufteilung.
5. Keine Änderung an `Mathsverse`, Inventar, Firestore, Rewards, `KENNY_ODDS`, Hitboxen oder den zwei unabhängigen Dino-Ausrüstungsslots als Nebeneffekt.
6. Keine große gleichzeitige Umstellung von Idle, Fütterung, drei Bissen, Walk, Jump, drei Specials und allen Fusionsatlanten.
7. Keine angeblichen erfolgreichen Pushes, Tests, Screenshots oder Deployments ohne überprüfbare Belege.
8. Keine ungefragte automatische Entfernung der historischen Originale; Rollback muss pro Bereich möglich sein.

---

**Zusammenfassung:** Erst **sichere Original-Idle-Frames** und ein **Master-Rig** erstellen, dann **einmal** animieren und für **fünf Skin-Paletten** als **separate PNG-Einzelbilder** exportieren. **10 FPS** ist der vorgesehene Animationslook, nicht die Physikrate. Fütterung, Angriffe und Specials sind **getrennte** Zustände. Qualität wird an echten Screenshots, klaren Dateinamen und überprüften Pfaden gemessen.
