# Studyverse — Lernziel-Freischaltungen & Token-Shop (November 2026)

## Aktuelle Preis- und Belohnungsregeln

- Im Shop stehen „Alle Items“ und die Auswahl „Kollektion auswählen“ nebeneinander.
  Test-Kollektionen erscheinen nach der ersten Freischaltung und verschwinden,
  sobald alle ihre Items gekauft wurden. Essentials bleiben immer auswählbar.
- `src/app/shop-items.ts` berechnet die Preise zentral mit `itemPrice`: Test-Items
  kosten nach Kategorie gleich viel, unabhängig von der Reihenfolge der Verses.
  Boss-Titel bei 80 % kosten 800 TT, Professorentitel bei 100 % 1.200 TT;
  Zeichen-Theme-Upgrades kosten 900 TT, der Sharpverse-Goldrahmen 500 TT. Essentials steigen mit dem nötigen
  Profil-Level im Preis. Galaxy auf Level 20 kostet 1.000 TT.
- Die **einmaligen Token-Quellen** jedes Verse finanzieren genau seinen Shop:

  | Verse | Lernaufgaben und Boss | Achievements | Shop gesamt |
  | --- | ---: | ---: | ---: |
  | Chemverse | 4.100 TT | 4.200 TT | 8.300 TT |
  | Dsaiverse | 4.300 TT | 3.300 TT | 7.600 TT |
  | Sharpverse | 1.900 TT | 4.700 TT | 6.600 TT |

- Optionale Chemverse-Orbitalübungen und der separate 50-%-Boss-Meilenstein
  geben weiterhin XP, aber keine zusätzlichen TT. So hängt die Verse-Bilanz
  nicht davon ab, ob jemand optionale Aufgaben vor den Pflichtaufgaben macht.
- Die gemeinsame Tagesgrenze ist **20 verschiedene richtige Fragen × 10 TT**
  plus **ein Boss ab 70 % × 100 TT**, also höchstens **300 TT pro Tag** über
  Chemverse, Dsaiverse und die Tagesarena zusammen. Die ersten 20 Quizfragen
  am Tag können zusätzlich ihre einmaligen Erfüllungs-TT einbringen.
- Globale Level-TT sind für Essentials gedacht und werden getrennt von der
  Verse-Bilanz gerechnet. Alle TT landen weiterhin im selben Geldbeutel;
  Spieler können sie frei zwischen Verses ausgeben.
- Bereits gezahlte Achievement-Claims, gekaufte Items und bestehende Wallets
  bleiben unverändert. Neue Auszahlungen verwenden die neuen Beträge. Beim
  späteren Cutover der separaten Draft-PR #15 müssen dessen Wallet- und
  Belohnungsregeln mit diesem aktuellen Stand abgeglichen werden.
- Neue Verses brauchen eine eigene Bilanzprüfung: Summe der einmaligen
  Aufgaben-TT plus Achievements = Summe der Itempreise; tägliche TT zählen
  nicht hinein.

## Shop und Inventar: neues Wirtschaftsmodell

- **ALLE noch nicht gekauften Cosmetics kosten TastyTokens**, auch Test-Items.
  Item-IDs und XP-Verdienstregeln bleiben erhalten. Es gibt keine kostenlosen Test-Items.
- **Essentials** können nach Erreichen des jeweiligen Profil-Levels gekauft
  werden. **Test-Items** werden erst durch **nachweisbaren Lernfortschritt**
  im zugehörigen Test **zum Kauf freigeschaltet**.
- Popup bei einem neuen Lernziel: **„Gegenstand freigeschaltet!“**.
  **„Annehmen“** bestätigt und schließt nur das Popup (kein Item, kein Tokenabzug).
  **„Zeig's mir“** öffnet direkt die passende Test-Shop-Seite und zeigt
  das freigeschaltete Item. Erst ein gesonderter Klick auf **Kaufen** im Shop
  bezahlt die Tokens und übernimmt das Item ins Inventar.
- Im Shop sind **nur Items, die noch NICHT im Besitz sind**.
  Bereits gekaufte Items sind ausschließlich im **Inventar** sichtbar und
  dort ausrüstbar. Auf einer Test-Shop-Seite sieht man **freigeschaltete**
  und **gesperrte** Items inklusive Lernziel, Fortschritt und TT-Preis.
- Der Shop-Dropdown zeigt **Essentials immer**; einen Test nur,
  nachdem mindestens ein noch nicht gekauftes Item in diesem Test freigeschaltet
  wurde. Vollständig gekaufte Test-Kollektionen verschwinden aus der Auswahl.
- Freigeschaltete Alt-Items bleiben kaufbar, ohne die Nutzer mit vielen
  rückwirkenden Popups zu nerven. Eine gespeicherte Seen-/Queue-Liste
  verhindert doppelte Hinweise und überlebt den Cloud-Sync.

## MathsVerse

Die alte **2. Hausübungswiederholung** mit ihren bisherigen HTML- und
JavaScript-Lektionen ist vollständig aus dem öffentlich deployten Katalog
entfernt. **Mathematik bleibt als gesperrte Lernwelt („Coming Soon“) erhalten**,
bis der neue Schularbeitsstoff hinzugefügt wird. Die zwei bisherigen Mathe-
Shop-Items (`maths_avatar_pi`, `maths_title_integral`) sind nicht mehr
im Shop-Katalog enthalten. **Wer eines der beiden früher gekauft hat, behält
es weiterhin im Inventar und kann es ausrüsten.** Die archivierten Einträge
in `src/app/legacy-owned-items.ts` sind ausschließlich zur Anzeige bereits
besessener Items da; sie sind nicht neu kaufbar. Bestehende
Lernstände/Wallet-Kopien werden nicht automatisch verändert oder gelöscht.

## XP, TT und Sicherheitsmigration

**Dieser Umbau verändert keine XP-Formel oder Level-Schwellen; die TT-Beträge
folgen der aktuellen Preis- und Belohnungsregel oben.** Die am 12. November erstellten zwölf inaktiven
Shadow-Wallets werden ebenfalls nicht angerührt. Bestehende Cloud-Accounts
nutzen vor PR #15 weiterhin das bisherige Cloud-Save-Format.
Die Shop-Freischaltung benutzt wie bisher den lokalen oder synchronisierten
Trainerfortschritt. **Das ist noch keine serververifizierte Anti-Cheat-
Freischaltung.** Die spätere Wallet-Aktivierung muss dieses Belohnungssystem
mit einem vertrauenswürdigen Backend nachziehen; PR #15 bleibt bis dahin Draft.

---

## Vorherige Shop-/Economy-Regeln (historischer Kontext; Beträge unten sind veraltet)

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
