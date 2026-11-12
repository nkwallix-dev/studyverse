# STUDYVERSE – Drops, Level-Items & Tokens

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
- **Tägliches Quiz:** Für die ersten 20 **verschiedenen richtig beantworteten** Quizfragen desselben Tages: **25 Tokens pro Frage** (bis zu 500 pro Tag). Im geplanten Sicherheits-Backend zusätzlich **10 verifizierte XP** je vergüteter Frage. Auch bereits gemeisterte Fragen zählen. Dieselbe Frage gibt am selben Tag keinen zweiten Bonus. Falsche Antworten geben keine Tokens.
- **Täglicher Boss:** Einmal pro Tag **250 Tokens**, wenn ein kompletter Bosskampf mit **mindestens 70 %** bestanden wird. Im geplanten Sicherheits-Backend zusätzlich **50 verifizierte XP**.
- Maximal **750 wiederholbare Tokens pro Kalendertag** bei Chemverse.
- Quiz und Boss verwenden **neu gemischte Antwortpositionen**, auch bei wiederholten Fragen. Die richtige Antwort wird bei derselben Frage nicht an derselben Position wie beim vorherigen Auftreten platziert.
- Erstmalige Lernfortschritte erhalten weiterhin ihre bisherigen XP-/Token-Boni; mit späteren Verses kommen neue hinzu.
- Jeder weitere Lernwelt-Drop soll eigene wiederholbare **kompetenzbasierte** Coin-Quellen bieten.

**Aktueller Produktionsstand:** Die bisherige Browser-Economy bleibt bis zum kontrollierten Sicherheits-Cutover aktiv. PR #15 führt danach serverseitig begrenzte TT/XP-Wallets für angemeldete Nutzer ein. Trainerfortschritt bleibt lokal als nicht verifizierte Übung gespeichert; Wiederholungs-Gutschriften werden nur über das Backend gezählt. Die Fragen und Lösungen sind im Web weiterhin sichtbar – serverseitiges Guthaben verhindert direkte Fantasiebeträge, nicht das automatisierte Lösen innerhalb des Tageslimits.

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
