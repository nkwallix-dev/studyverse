# Öffentliche Levelanzeige

Die beiden Firestore-Trigger gleichen das **vorläufige Anzeigelevel** im
`publicProfiles/{uid}` mit den XP im privaten `users/{uid}`-Spielstand ab:

- `projectLevelOnSave` reagiert auf geänderte XP.
- `projectLevelOnCardCreate` ergänzt das Level bei neuen öffentlichen Profilen.

Der Trigger liest in einer Transaktion den aktuellen Spielstand. Verzögerte
Ereignisse können damit keinen älteren Stand zurückschreiben. Er verändert
weder TastyTokens noch Inventar, Titel oder den privaten Spielstand. Die XP
sind derzeit noch vom Client bearbeitbar; dies ist keine verifizierte Rangliste.

## Bereitstellung

1. `npm ci && npm test` in diesem Ordner.
2. Im Projekt `studyverse-logins` die Firebase Functions dieser Codebase mit
   `firebase deploy --only functions:public-rank --project studyverse-logins`
   bereitstellen. Die erforderlichen Firebase-Dienste und das passende
   Abrechnungsmodell müssen dafür im Projekt eingerichtet sein.
3. Den vorhandenen GitHub-Workflow **Sync Studyverse public display levels**
   einmal über **Run workflow** ausführen. Das setzt alle bereits vorhandenen
   Profile auf ihren aktuellen Stand; danach halten die Trigger sie aktuell.

Der bestehende GitHub-Zeitplan kann als zusätzlicher Abgleich bestehen bleiben.
