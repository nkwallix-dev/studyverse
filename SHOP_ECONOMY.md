# STUDYVERSE – Drops, Level-Items & Tokens

## Dauerhafte Regel für neue Lernwelten
Mit **jedem neuen Test-Trainer** kommt ein neuer, eigener kosmetischer **Verse-Drop** in den globalen STUDYVERSE-Item-Shop.
Jeder neue Test erweitert zugleich die möglichen **XP und Tokens**; die Belohnungen werden beim Wechsel zur STUDYVERSE-Homepage ins gemeinsame Profil übertragen.
Neue Drops benötigen eigene Lernfortschritt-Sperren und möglichst auch zusätzliche globale Level-Meilensteine.

- Globale Basics wie Schriften, Standard-Rahmen, Hintergründe und Effekte sind **an das globale Profil-Level** gebunden.
- **Chemverse 1. Test** hat eigene Items wie Lehrer-Pizza und Froschlabor, die nur durch **Chemverse-Lernen** freigeschaltet werden.
- Wertvollere Verse-Cosmetics können **beides** verlangen: Mindest-Profil-Level und Lernfortschritt im zugehörigen Test.
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
2. Shop-Drop `{id:<trainer-id>,...}` hinzufügen; jedes neue Item erhält `drop`, `cost`, ggf. globales `level` und echte `requirement`.
3. Wiederholbare Token-Quellen mit einem Zeit-/Aufgabenlimit und **abwechselnder Antwortreihenfolge** implementieren.
4. Erreichten Besitz und bestehende XP/Coins niemals zurücksetzen; verifizierte Einmal-Belohnungen mit Claims-Ledger gegen Doppelgutschrift absichern.
5. Angular-Build und Lerntrainer-Quiz-/Boss-Funktionsweise testen.

Nächster Trainer: **DSAI – 1. Test**. Drop `dsai-test-01` ist als Platzhalter im Shop markiert.
