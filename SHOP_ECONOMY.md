# Studyverse — Ökonomie der Lernziele & Essentials (November 2026)

## Shop / Inventar — neue verbindliche Logik

- **STUDYVERSE Essentials** sind die **einzigen Items, die TastyTokens kosten**.
  Sie bleiben durch das globale Profil-Level begrenzt, bis sie kaufbar sind.
- **Test-Drops** (Chemverse, Dsaiverse, Sharpverse, später weitere Tests) haben
  `cost:0`, ein **konkretes Lernziel** und werden nach dem Lernziel **gratis abgeholt**.
  Items werden nicht automatisch verschenkt, nur weil eine Metrik erhöht wurde.
- Bei einem **neu erreichten** Lernziel erscheint ein Popup mit dem Item:
  **„Annehmen“** legt es gratis ins Inventar; **„Zeig's mir“** öffnet den
  passenden Test-Drop im Shop, ohne es bereits zu besitzen.
- Im Shop sind **niemals bereits besessene Items** sichtbar.
  Ein Test-Drop erscheint im Dropdown erst, sobald der Account wenigstens
  eines seiner Items freigeschaltet hat (auch wenn er es bereits besitzt).
  Auf der Testseite erscheinen sowohl freigeschaltete, noch nicht abgeholte
  Items als auch gesperrte Items mit Ziel und Fortschritt.
- Das **Inventar** ist der einzige Ort, an dem besessene Items angezeigt,
  betrachtet oder ausgerüstet werden. Bereits gekaufte Cosmetics werden **nicht
  aus dem gespeicherten Profil gelöscht**.
- Vor diesem Update bereits erfüllte Lernziele sind weiterhin abholbar,
  erzeugen bei der ersten Anmeldung aber keinen Spam von alten Popups.
  Die wartende Popup-Liste ist Teil des Cloud-Snapshots.

## MathsVerse

Die alte **2. Hausübungswiederholung** mit ihren bisherigen HTML- und
JavaScript-Lektionen ist vollständig aus dem öffentlich deployten Katalog
entfernt. **Mathematik bleibt als gesperrte Lernwelt („Coming Soon“) erhalten**,
bis der neue Schularbeitsstoff hinzugefügt wird. Die zwei bisherigen Mathe-
Shop-Items (`maths_avatar_pi`, `maths_title_integral`) sind nicht mehr
im Katalog enthalten. Bestehende Lernstände/Wallet-Kopien werden nicht
automatisch verändert oder gelöscht.

## XP, TT und Sicherheitsmigration

**Dieser Umbau verändert keine XP-Formel, Level-Schwellen oder bestehenden
TT-Verdienstmöglichkeiten.** Die am 12. November erstellten zwölf inaktiven
Shadow-Wallets werden ebenfalls nicht angerührt. Bestehende Cloud-Accounts
nutzen vor PR #15 weiterhin das bisherige Cloud-Save-Format.
Die Shop-Freischaltung benutzt wie bisher den lokalen oder synchronisierten
Trainerfortschritt. **Das ist noch keine serververifizierte Anti-Cheat-
Freischaltung.** Die spätere Wallet-Aktivierung muss dieses Belohnungssystem
mit einem vertrauenswürdigen Backend nachziehen; PR #15 bleibt bis dahin Draft.

---

## Frühere Regeln und Historie

# Historisches Drops-/Token-Modell (vor der Umstellung)

## Dauerhafte Regel für neue Lernwelten
Mit **jedem neuen Test-Trainer** kommt ein neuer, eigener kosmetischer **Verse-Drop** in den globalen STUDYVERSE-Item-Shop.
Jeder neue Test erweitert zugleich die möglichen **XP und Tokens**; die Belohnungen werden beim Wechsel zur STUDYVERSE-Homepage ins gemeinsame Profil übertragen.
Neue Drops benötigen eigene Lernfortschritt-Sperren. Neue **globale** Level-Meilensteine gibt es unabhängig davon nur für allgemeine STUDYVERSE-Items.

- Globale Basics wie Schriften, Standard-Rahmen, Hintergründe und Effekte sind **an das globale Profil-Level** gebunden.
- **Chemverse 1. Test** hat eigene Items wie Lehrer-Pizza und Froschlabor, die nur durch **Chemverse-Lernen** freigeschaltet werden.
- **Fachspezifische Cosmetics** haben **keine globalen Levelgrenzen** – ausschließlich nachweisbaren Fortschritt im zugehörigen Test. Sobald die Lernanforderung erfüllt ist, ist das Item kaufbar (sofern genügend Tokens vorhanden sind).
- **Besessene Items** bleiben im globalen Inventar, auch wenn spätere Versionen Preise oder Sperren ändern. Einmal gekauft = in allen unterstützten Verses nutzbar.
- **Galaxy** ist eine globale Prestige-Ausnahme und kostet 980 Tokens; Altbesitz bleibt gültig.
- Der zentrale Katalog liegt in `src/app/shop-items.ts`, Lernwelten in `src/app/trainer-registry.ts`; neue Fächer/Test-Trainer hinzufügen, ohne das Shopsystem neu zu bauen.

## Coin-Economy – Stand November 2026
Alle **11 Chemverse-Achievements** vergeben zusätzlich **4.670 Tokens** insgesamt. Die Belohnungen gelten rückwirkend, werden aber **pro Achievements-ID/Test genau einmal** auf dem STUDYVERSE-Profil gutgeschrieben.

Regelmäßiges Lernen bleibt auch nach allen erstmaligen Aufgaben möglich:
- **Tägliches Quiz:** Für die ersten 20 **verschiedenen richtig beantworteten** Quizfragen desselben Tages: **25 Tokens pro Frage** (bis zu 500 pro Tag). Auch bereits gemeisterte Fragen zählen. Dieselbe Frage gibt am selben Tag keinen zweiten Bonus. Falsche Antworten geben keine Tokens.
- **Täglicher Boss:** Einmal pro Tag **250 Tokens**, wenn ein kompletter Bosskampf mit **mindestens 70 %** bestanden wird.
- Maximal **750 wiederholbare Tokens pro Kalendertag** bei Chemverse.
- Quiz und Boss verwenden **neu gemischte Antwortpositionen**, auch bei wiederholten Fragen. Die richtige Antwort wird bei derselben Frage nicht an derselben Position wie beim vorherigen Auftreten platziert.
- Erstmalige Lernfortschritte erhalten weiterhin ihre bisherigen XP-/Token-Boni; mit späteren Verses kommen neue hinzu.
- Jeder weitere Lernwelt-Drop soll eigene wiederholbare **kompetenzbasierte** Coin-Quellen bieten.

**Die täglichen Aufgaben und Spielstände sind aktuell nur browserlokal.** Das ist eine Motivations-Economy, kein gegen Manipulation abgesichertes Online-Spiel. Für echte Konten ist weiterhin ein Auth-Provider / Backend erforderlich.

## Bestehenden Spielstand übernehmen
- Die CHEMVERSE-IDs der kosmetischen Items wurden beibehalten.
- Alt-Level-Belohnungen `avatar_atom`, `ionstorm`, `title_chaos`, `blueprint` und `legend` werden bei früher erreichten Levels rückwirkend als *besessen* eingetragen, ohne neue Kaufkosten.
- Die Erfolge werden aus den jeweiligen Trainer-Spielständen abgeleitet, nicht nur aus Anzeigen.
- In STUDYVERSE sieht man die Drops, Kosten, Freischaltfortschritte, täglich verdienbare Tokens und die Achievements.

## Qualitätsanforderung für neue Tests
1. Neuer Trainer in `trainer-registry.ts` mit Fach, Test-ID, Lernpfad, eindeutiger Speicherkennung und Achievements.
2. Shop-Drop `{id:<trainer-id>,...}` hinzufügen. **Verse-Items** erhalten `drop`, `cost` und eine echte `requirement`, aber **nie `level`**. Nur **globale Items** erhalten `level`, jedoch keine fachlichen Anforderungen.
3. Wiederholbare Token-Quellen mit einem Zeit-/Aufgabenlimit und **abwechselnder Antwortreihenfolge** implementieren.
4. Erreichten Besitz und bestehende XP/Coins niemals zurücksetzen; verifizierte Einmal-Belohnungen mit Claims-Ledger gegen Doppelgutschrift absichern.
5. Angular-Build und Lerntrainer-Quiz-/Boss-Funktionsweise testen.

**DSAIVERSE 1. Test** ist spielbar unter `public/dsai/test-01/index.html`. Der Verse-Drop `dsai-test-01` ist aktiv und enthält 15 eigene Cosmetics. Daneben gibt es vier neue globale, levelgebundene Basics.

DSAI-Training: 16 Lektionen, 106 MC-Aufgaben, 23 Code-Schnipsel, Data-Sorter, Pipeline-Puzzle, Festival-Forecast und Bosskampf. Jeder Modus hat einen „Fertig stellen“-Weg zu den offenen Aufgaben; fachliche Cosmetics benötigen ausschließlich Lernfortschritt. Die Quiz-Arena vergibt bis zu 500 zusätzliche TT am Tag, der Bosskampf bis zu 250 TT.
