# STUDYVERSE – Onlinekonten aktivieren

Der Login ist bereits im Angular-Frontend, Chemverse, DSAIVERSE und der Daily Arena integriert. Er bleibt absichtlich **deaktiviert**, solange in `public/cloud-config.json` keine echte Firebase-Webkonfiguration steht. Bis dahin bleiben die bisherigen lokalen Spielstände funktionsfähig.

## Einmalige Einrichtung für den Betreiber

1. Öffne [Firebase Console](https://console.firebase.google.com/) und erstelle ein Projekt, z. B. `studyverse-klasse`. **Keinen Service-Account-Schlüssel** ins GitHub-Repository laden.
2. **Authentication → Sign-in method → Email/Password aktivieren.** Studyverse wandelt einen Nutzernamen intern in eine synthetische E-Mail-Adresse unter `@accounts.studyverse.example.com` um; die Benutzer müssen keine E-Mail angeben. Daher gibt es **keine automatische PIN-Zurücksetzung per Mail**.
3. **Cloud Firestore** anlegen. **Firestore Database → Rules** öffnen, den Inhalt aus `firebase/firestore.rules` einfügen und **Publish** klicken. Nur der angemeldete Eigentümer darf sein eigenes Dokument `users/{uid}` lesen oder schreiben.
4. **Project settings → Your apps → Web app** registrieren. Im angezeigten `firebaseConfig` stehen u. a. `apiKey` und `projectId`. Genau diese beiden *öffentlichen Web-Konfigurationswerte* in `public/cloud-config.json` eintragen:

   ```json
   {
     "apiKey": "AIza...",
     "projectId": "studyverse-klasse-..."
   }
   ```

5. GitHub Actions baut und veröffentlicht nach dem Commit die Website neu. Danach sollte die Registrierung auf der Startseite angezeigt werden. Einmal mit einem **Testaccount** Registrierung, Login, Level/TT, einen Trainer, Logout und Login auf einem anderen Browser testen.

**Wichtig:** Firebase-Web-API-Key und Project-ID sind keine geheimen Admin-Credentials; ihre Veröffentlichung ist bei Firebase-Webapps üblich. Die Firestore-Regeln sind hingegen unbedingt erforderlich. Setze in der Google Cloud Console nach Möglichkeit API-Key-Beschränkungen. **Keine** Service-Account-Datei, Refresh-Token oder echte PIN ins Repository committen.

## Bedienung für deine Klasse

- Beim ersten Start: „Neuen Account“ → Namen (3–20 Zeichen, klein, Ziffern, `_` oder `-`) → **sechsstellige numerische PIN**. Anmeldung auf weiteren Geräten über denselben Namen + PIN.
- Bisherige Spieler können **vor der Registrierung** eine alte Studyverse-JSON-Datei importieren. Das Profil und die verfügbaren Testergebnisse werden mit der Registrierung hochgeladen.
- Auch später ist der Backup-Import im Profil verfügbar. Bei bestehendem Cloudkonto ersetzt der Import den aktuellen Stand nach Rückfrage.
- Beim Lernen in Chemverse, DSAIVERSE und in den Daily Quizzes werden Änderungen im Browser gespeichert und im Hintergrund an Firestore übertragen. Nach Rückkehr zur Studyverse-Startseite werden Trainer-XP, TT und Achievements zusammengeführt.
- Im Profil: Cloud-Status, „Jetzt synchronisieren“, Abmelden. Manuelle JSON-Backups bleiben als Notfallweg möglich.
- Die letzten Änderungen können bei Netzproblemen lokal verbleiben. Daher vor einem Gerätewechsel zurück zur Studyverse-Startseite gehen und im Profil **„✓ Online gespeichert“** prüfen.

## Daten & Grenzen

- **PIN-Sicherheit:** sechs Ziffern sind leichter zu erraten als ein langes Passwort. Für ernsthaft vertrauliche Daten oder öffentlich große Communities sollte man längere Passwörter, E-Mail-/Passkey-Login, zusätzliche Missbrauchserkennung und Wiederherstellung verwenden. Firebase Authentication verwaltet und prüft die PIN; sie wird niemals im Studyverse-Profil, der Cloud-Datenbank oder im GitHub-Repository gespeichert.
- **Kein Reset:** Ohne E-Mail/Recovery muss ein vergessener PIN administrativ zurückgesetzt werden; lokale JSON-Sicherungen bleiben sinnvoll.
- **Speicherung:** Firestore `users/{uid}`, `profile` = JSON-String mit Profil, Trainer-Saves, Daily-Save und eventuell einem offenen Trainer-Bridge-Stand. `updatedAt` ist ein Zeitstempel. Pro Cloudstand gelten der 700-kB-Clientgrenzwert und die Größenlimits von Firestore.
- **Konflikte:** Aktuell gilt „letzte Speicherung gewinnt“. Nicht denselben Account gleichzeitig auf zwei Geräten spielen.
- **Manipulationsschutz:** Lernbelohnungen werden weiterhin clientseitig berechnet; Spieler können deshalb ihren eigenen Spielstand technisch manipulieren. Die Firestore-Sicherheitsregeln verhindern jedoch, dass sie fremde UID-Spielstände direkt auslesen oder überschreiben.
- **Kosten:** Firebase hat je nach Tarif kostenlose Kontingente und Nutzungsbeschränkungen. In der Firebase Console Verbrauch und mögliche Abrechnung beobachten.

## Technische Stellen

- `src/app/cloud.ts` – Authentifizierung und Firestore REST, Token-Erneuerung
- `src/app/app.ts`, `app.html`, `app.scss` – Login, Session, Accountwechsel, Cloudstatus
- `public/shared/cloud-progress.js` – Cloudspiegelung der Standalone-Lernwelten
- `public/cloud-config.json` – öffentliche Firebase-Webprojektkonfiguration
- `firebase/firestore.rules` – Zugriffsschutz

Wenn `cloud-config.json` leer bleibt, funktioniert die Website wie zuvor lokal. Es werden keine neuen Onlinekonten angelegt.
