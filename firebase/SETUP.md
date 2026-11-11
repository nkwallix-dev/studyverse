# STUDYVERSE – Onlinekonten aktivieren

Der Login ist bereits im Angular-Frontend, Chemverse, DSAIVERSE und der Daily Arena integriert. **GitHub Pages erhält den Firebase-Web-API-Key erst während des Deployments** aus GitHub Actions. Die im Repository versionierte `public/cloud-config.json` enthält absichtlich keinen Key; ohne injizierte Konfiguration bleibt der Login lokal deaktiviert, während lokale Spielstände weiterhin funktionieren.

## Einmalige Einrichtung für den Betreiber

1. Öffne [Firebase Console](https://console.firebase.google.com/) und erstelle ein Projekt, z. B. `studyverse-klasse`. **Keinen Service-Account-Schlüssel** ins GitHub-Repository laden.
2. **Authentication → Sign-in method → Email/Password aktivieren.** Studyverse wandelt einen Nutzernamen intern in eine synthetische E-Mail-Adresse unter `@accounts.studyverse.example.com` um; die Benutzer müssen keine E-Mail angeben. Daher gibt es **keine automatische PIN-Zurücksetzung per Mail**.
3. **Cloud Firestore** anlegen. **Firestore Database → Rules** öffnen, den Inhalt aus `firebase/firestore.rules` einfügen und **Publish** klicken. Nur der angemeldete Eigentümer darf sein eigenes Dokument `users/{uid}` lesen oder schreiben.
4. **Project settings → Your apps → Web app:** Die `projectId` bleibt in `public/cloud-config.json` hinterlegt, das Feld `apiKey` bleibt dort **leer**. Trage den **Firebase-Web-API-Key** unter **GitHub → Repository → Settings → Secrets and variables → Actions → Variables** als `APIKEYFIREBASEDB` ein. Du kannst stattdessen ein **Repository Secret** mit demselben Namen verwenden; Secrets werden beim Deployment bevorzugt. Der GitHub-Actions-Build fügt den Key nach dem Angular-Build ausschließlich in `dist/site/browser/cloud-config.json` ein (nicht in die Git-Quelldatei). Ohne Variable/Secret **schlägt das Deployment bewusst fehl**, statt eine kaputte Login-Konfiguration zu veröffentlichen.

5. GitHub Actions baut und veröffentlicht nach dem Commit die Website neu. Danach sollte die Registrierung auf der Startseite angezeigt werden. Einmal mit einem **Testaccount** Registrierung, Login, Level/TT, einen Trainer, Logout und Login auf einem anderen Browser testen.

**Wichtig:** Der Firebase-Web-API-Key ist auch nach dem Injizieren im **öffentlich auslieferbaren** `cloud-config.json` und in Browser-Netzwerkanfragen sichtbar; die GitHub-Variable ist keine Zugangskontrolle. Die **Firestore Security Rules** und möglichst **Firebase App Check** sichern die Daten und erschweren missbräuchliche Zugriffe. Begrenze den Web-Key in Google Cloud auf die benötigten Firebase-APIs und überprüfe passende App-/HTTP-Referrer-Einschränkungen sowie Auth-Kontingente. Der zuvor im öffentlichen Repository eingecheckte Key bleibt in der Git-Historie; falls du ihn ersetzen willst, rotiere den Key kontrolliert in Firebase/Google Cloud und aktualisiere `APIKEYFIREBASEDB`. **Keine** Service-Account-Datei, Refresh-Token oder echte PIN ins Repository committen.

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
- `public/cloud-config.json` – versionierte Konfiguration ohne Key (enthält die öffentliche Projekt-ID)
- `.github/workflows/deploy.yml` – liest `APIKEYFIREBASEDB` aus GitHub Actions
- `scripts/inject-cloud-config.cjs` – injiziert den Key nur in das fertige GitHub-Pages-Artefakt
- `firebase/firestore.rules` – Zugriffsschutz

Bleibt der Key in der **lokalen** `cloud-config.json` leer, funktioniert die Website weiterhin ohne Onlinekonten. Die **veröffentlichte** GitHub-Pages-Website erhält den Key automatisch im Deploy-Artefakt.
