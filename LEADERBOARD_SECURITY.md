# StudyVerse – Incident Response & Ranglisten-Sicherheit

> **Aktueller Stand (12.11.2026; UI-PR #17):** Die Freundeseite zeigt wieder Rangplätze und die **historischen, unverifizierten** Levelwerte aus `publicProfiles/{uid}.level`. Diese Werte sind unter den aktuellen Firestore-Regeln für normale Clients **nicht mehr veränderbar**, können aber durch frühere Manipulation bereits falsch oder veraltet sein. Die Anzeige ist **noch keine faire oder serververifizierte Highscore-Liste**. Die App schreibt weiterhin keine Level in `publicProfiles`. Die kosmetischen Profilfelder bleiben für ihren Eigentümer bearbeitbar. Der serverautorisierte Wallet-Umbau in Draft-PR #15 ist noch nicht live; das spätere echte Ranking muss aus `verifiedProfiles` entstehen. Firestore-Regeln werden inzwischen über GitHub Actions aus `main` automatisch veröffentlicht. Die nachfolgenden Abschnitte dokumentieren den **historischen Vorfall und frühere Sofortmaßnahmen**, nicht durchgängig den aktuellen Implementierungsstand.

## 2026-11-12: Warum ein beliebiges Level sichtbar werden konnte

Die ursprüngliche App speicherte XP, TastyTokens, Trainer-Fortschritt, Inventar und Ausrüstung in `localStorage`. Firebase speicherte den privaten Spielstand als unverifizierten JSON-String in `/users/{uid}.profile`. Der Browser berechnete anschließend aus seinem lokalen XP-Wert das Level und schrieb dieses Level direkt in `/publicProfiles/{uid}`. Die alten Firestore-Regeln erlaubten dem jeweiligen Kontoinhaber, fast jedes Level zwischen 1 und 100000 selbst in sein öffentliches Profil zu schreiben.

**Ein Firebase-Login macht einen Wert nicht wahr.** Die Regeln bestätigten nur, wer den Datensatz schrieb, nicht ob die Punkte erspielt wurden. Ein editierter Browser-Spielstand oder ein selbst abgesetzter REST-Request reichte aus, um andere Spieler mit einem frei gewählten Level zu täuschen. Das ist kein Beleg für einen Einbruch in andere Accounts.

## Sofortmaßnahmen – bereits im GitHub-Code umgesetzt

1. Alte `/publicProfiles` werden vom neuen Frontend **nie mehr gelesen oder beschrieben**.
2. `/verifiedProfiles` ist die einzige künftig anzeigbare Rangliste. Die Web-App liest nur Dokumente mit `verified: true`; sie hat **keine Schreibfunktion** für diese Sammlung.
3. Die mitgelieferten Firestore-Regeln verweigern `/publicProfiles` **jeden** Client-Zugriff, einschließlich DELETE, und verweigern **alle** Client-Schreibzugriffe auf `/verifiedProfiles`.
4. Die Freundeseite erklärt die Pause; die private Cloud-Synchronisierung, gesammelte XP und TT bleiben für den persönlichen Lernfortschritt verfügbar.
5. Ein zusätzlicher clientseitiger Nicknamefilter weist offensichtliche beleidigende und irreführende Namen zurück. **Das ist keine vollständige Inhaltsmoderation**; später muss der Server die Namen ebenfalls prüfen.

### Dringend: Firestore-Regeln im echten Firebase-Projekt veröffentlichen

**GitHub Pages deployt nur den Web-Client, NICHT die Firebase-Regeln.** Selbst wenn alle GitHub-Tests grün sind, sind die Regeln deshalb nicht automatisch online.

1. `https://console.firebase.google.com/` öffnen und **das Firebase-Projekt von StudyVerse** auswählen.
2. **Build → Firestore Database → Rules** öffnen.
3. Den vollständigen Inhalt der Datei [firestore.rules](./firestore.rules) aus dem neuesten GitHub-`main` in den Rules-Editor kopieren.
4. **Publish / Veröffentlichen** klicken.
5. In der Rules-Playground-/Simulator-Funktion und nach Möglichkeit mit einem normalen Testkonto prüfen:
   - Client kann `/users/{eigene_uid}` lesen und speichern.
   - Client kann `/users/{fremde_uid}` NICHT lesen oder speichern.
   - Client kann `/publicProfiles/{uid}` NICHT lesen, erzeugen, ändern oder löschen.
   - Client kann `/verifiedProfiles/{uid}` als angemeldeter Nutzer lesen, aber **NICHT** erzeugen, ändern oder löschen.
6. Prüfen, dass im Firebase-Projekt **keine anderen permissiven Regeln** diese Pfade freigeben.

**Das muss mit Owner-Zugriff im Firebase-Projekt passieren. GitHub-Zugriff allein reicht nicht.**

## Verfälschten Datensatz bereinigen

1. In Firebase Console → **Firestore Database → Data** den Ordner `publicProfiles` öffnen. Ungeprüfte Einträge werden durch die neue App **nicht** mehr angezeigt, können dort aber noch liegen.
2. Nach dem **auffälligen Anzeigenamen** und dem **unplausiblen Level** suchen; die betroffene **Dokument-ID / UID notieren** und zuerst einen Screenshot/Beleg sichern.
3. Den offensichtlich missbräuchlichen Datensatz über die Firebase Console entfernen. Die neuen Regeln sperren nur Clients; Projekt-Admins können weiterhin über Console/Admin SDK aufräumen.
4. Falls es eindeutig dasselbe angemeldete Konto ist und der Account weiterhin missbraucht wird: unter **Authentication → Users** den jeweiligen Account prüfen und gegebenenfalls **deaktivieren**. Nicht anhand des sichtbaren Nicknames auf eine reale Person schließen.
5. Im privaten `users/{uid}`-Spielstand können manipulierte 30-Millionen-Token-Werte weiter vorhanden sein. Ein einfaches Bearbeiten des privaten JSONs ist **keine** dauerhaft sichere Anti-Cheat-Lösung: Ein laufender Browser kann den Wert erneut hochladen. Deshalb niemals privaten XP-/TT-Ständen eine öffentliche Platzierung zuweisen.
6. Verifizierte Profile **nicht aus der alten Sammlung automatisch übernehmen**. Die alte Punktzahl ist rückwirkend nicht beweisbar.

## Wie eine echte Rangliste künftig funktionieren muss

Für ein faires öffentliches Level braucht StudyVerse zusätzlich eine **serverautorisierte Punktewirtschaft**. Die bisherige lokale Erfahrung darf weiter als Offline-Übungsfortschritt erhalten bleiben, aber nicht die weltweite Rangliste bestimmen.

### Empfohlene Architektur

- Login per Firebase Authentication. Authentifizierung allein beweist keine Punkte.
- Ein auf Firebase Cloud Functions oder Cloud Run betriebener Endpunkt `submitAnswer(challengeId, answer)` prüft die Antwort **serverseitig** anhand einer serververwalteten Aufgaben-/Lösungsliste.
- Firestore-Transaktionen vergeben einen festen XP-Bonus nur **einmal je Aufgabe/Konto** oder nach klaren Tages-/Wiederholungsregeln. Der Server setzt vernünftige Obergrenzen und Rate Limits.
- Der Server speichert die akzeptierte Aktivität in einem **für Clients nicht beschreibbaren** Punktejournal (`verifiedAttempts`) und berechnet daraus `verifiedXP`, `verifiedLevel` und ggf. einen **verifizierten** Tokenstand.
- Nur der Server schreibt das Ergebnis nach `verifiedProfiles/{uid}` mit Feldern `nickname`, `avatar`, `title`, `level`, `verified:true`, `updatedAt`; Nicknames und Cosmetics müssen auch dort validiert werden. Die neuen Firestore-Regeln verhindern ein Selbstveröffentlichen.
- Rate Limits, IP-/Account-Anomalien und App Check können automatisiertes Einsenden erschweren, ersetzen aber keine serverseitige Bewertung.
- Quizlösungen, die im öffentlich geladenen JavaScript stehen, können weiterhin ausgelesen und automatisiert abgegeben werden. Wirklich stärkere Fairness braucht geeignete Aufgabenrotation, einen serververwalteten Fragenpool und Anti-Automation-Kontrollen. Absolute Cheat-Sicherheit im Browser ist unrealistisch.
- TastyTokens und Inventargegenstände, die kompetitiv oder öffentlich überprüft sein sollen, benötigen **dieselbe** Server-Autorität. Die aktuelle private Offline-Wallet ist ausdrücklich noch nicht gegen Eigenmanipulation geschützt.

### Sichtbarer Status bis zum Backend

Das neue Frontend zeigt nur `verifiedProfiles`. Da aktuell **kein** serverseitiger `submitAnswer`-Dienst bereitgestellt wird, bleibt diese öffentliche Liste zunächst **leer**. Das ist Absicht: Eine leere ehrliche Rangliste ist besser als eine Rangliste mit frei erfundenen Leveln.

## Weitere Kontosicherheit

Bestehende StudyVerse-Logins verwenden sechstellige PINs. Für ein späteres öffentliches kompetitives System sind starke Zugangsdaten (oder passwortlose sichere Authentifizierung), begrenzte Loginversuche, Account-Recovery und ggf. App Check sinnvoll. Pin-Sicherheit und die Datenmigration sind eigene Arbeiten; die aktuellen Sicherheitsänderungen ändern noch keine bestehenden Logins.

## Tests

- `node scripts/test-public-profiles.cjs` prüft, dass alte Ranglistenpfade gesperrt und im Client nicht mehr verwendet werden, sowie die Filterung verifizierter Datensätze.
- Die GitHub-Action prüft außerdem den Angular-Build und mobile Layouts.
- **Wichtig:** Die statischen Tests beweisen nicht, dass du die Regeln bereits in Firebase **veröffentlicht** hast. Das musst du im Projekt selbst kontrollieren.
