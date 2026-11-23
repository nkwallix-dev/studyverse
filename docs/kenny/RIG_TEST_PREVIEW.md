# Kenny Rig-Test – erster sichtbarer Prototyp (Branch)

**Status: echter, separat animierter SVG-Cutout-Rig-Prototyp, NICHT die pixelgenaue Zerlegung des finalen Kenny-PNGs.** Die endgültige Master-Grafik ist die zuletzt freigegebene transparente Illustration aus dem Gespräch. Die Konvertierung in hochwertige, nahtfrei bewegliche Original-Layer benötigt weiterhin die Lieferung/Übertragung des Master-PNGs in das Repo.

## Ausprobieren

1. Dino-Designer öffnen, dann neuen Tab **🦴 Test · Kenny-Rig** auswählen.
2. Idle-Loop ansehen; Play/Pause, Frame vor/zurück und Gelenke anzeigen.
3. Blau, Pink, Grün, Rot und Weiß testen; Skin-Vorschau ändert **keine** ausgerüsteten Skins und keinen Firestore-Stand.
4. Der Reiter befindet sich **nur auf dem Branch** `feature/kenny-master-rig-preview-20261123` bis Merge und Deployment auf `main`. Ein GitHub-Push allein aktualisiert das veröffentlichte Studyverse nicht.

## Rig-Lieferumfang
- `kenny-rig.model.ts` definiert 14 benannte Knochen, Parent-Kanten, 5 Skin-Materialpaletten und 64 Idle-Schritte bei 10 FPS.
- `kenny-rig-preview.component.ts` führt nur die Idle-Timeline aus, unabhängig von der 120-Hz-Kennyverse-Physik.
- `kenny-rig-preview.component.html` zeichnet Kopf/Kiefer/Auge, Torso, Hals, Schwanz, Vorder- und Hinterarme/-beine als eigene SVG-Gruppen und unterstützt eine Diagnoseansicht.
- `kenny-rig.model.spec.ts` testet Hierarchie, Loop, Skin-Paletten und Blinzeln.
- Die bestehenden Idle-, Futter-, Kampf- und Fusionsanimationen wurden NICHT ersetzt.

## Offene Qualitätsaufgaben vor produktiver Freigabe
1. Die **finale transparente Master-Illustration** als echtes Asset hochladen und separat in offene Schichten (hintere/vordere Teile, Kiefer, Augen, Arme, Beine, Schwanz) **inklusive verdeckter Flächen** zerlegen. Eine SVG-Vektor-Neuzeichnung ist nur Prototyp.
2. Originalgetreue Materialmasken pro Teil und unabhängig exportierbare PNGs entwickeln; Anatomie/Fußsichelkralle und Design visuell abnehmen.
3. Gelenke sauber hierarchisch transformieren, einschließlich Unterarmen/Knien/Füßen. Aktuelle SVG-Gruppen und Knochenmetadaten bilden ein erstes funktionales Rig, aber noch keinen vollwertigen IK-/Mesh-Deformer.
4. Sichere Ground-Anker, visuelle Regression, responsive Anzeige und alle fünf Skins prüfen; auf Mobilgeräten testen.
5. Erst danach das bestehende Rendering im Dino-Designer/Dino-Season und später Expedition migrieren. `docs/kenny/Animation_System.md` enthält den phasenweisen Gesamtplan.

**Mathsverse und Gameplay:** Dieser Branch verändert nur `src/app/features/dinoverse/dino-designer/` und diese Dokumentationsdatei. Keine Änderung an Firestore, Inventory, Physics, Shop, App-Routing oder bestehenden Kenny-Atlanten.