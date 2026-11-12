# Studyverse — Account-Migration OHNE XP-/Shop-Änderungen

**Status:** Schattenkopie, keine produktive Umstellung. Die neue, serverseitige
XP-/Token-Economy von PR #15 wird **nicht** veröffentlicht. Keine Website,
keine Firestore-Regeln und keine Cloud Functions werden für diesen Schritt deployed.

## Was exakt kopiert wird

Aus jedem `users/{uid}.profile` werden `xp`, `tokens` und `inventory`
**unverändert** in `users/{uid}/wallet/tokens` gespiegelt. Die neue Kopie
bekommt `migrationApproved:false` und `migrationStage:'shadow'`.
Derzeitige XP-Vergabe, Shop-Logik, gekaufte Kosmetik, Profile, Spielstände,
Logins und Moderationsdaten bleiben unangetastet. Die Live-App verwendet
weiter den bestehenden Legacy-Spielstand.

Die früher auffälligen Guthaben von **gissi** und **JOOOOOOOOOOOO** gelten
laut Owner-Review als legitime Spielstände und werden nicht reduziert.
`REVIEW_TOKENS_SPIKE` bleibt ein Audit-Hinweis, keine Strafe.
Andere ungültige Feldwerte oder unerwartete Review-Flags führen zum Abbruch.

## Schritt für Schritt (in deiner bisherigen Google Cloud Shell)

1. Bitte deine Mitschüler, in diesem kurzen Moment nichts zu speichern.
   Das ist kein automatischer Maintenance-Lock, sondern verhindert
   eine Änderung genau zwischen Scan und Kopie.
2. Wechsle in deinen vorhandenen Repo-Ordner, aktualisiere den Branch
   und wähle das richtige Projekt:

   ```bash
   cd ~/studyverse-security
   git checkout feature/server-authoritative-wallet-20261112
   git pull --ff-only
   gcloud config set project studyverse-logins
   ```

   Wenn `npm install --prefix functions` zuvor erfolgreich war, müssen
   keine Pakete erneut installiert werden. Die vorherige Lesefreigabe in
   Cloud Shell wird ebenfalls weiterverwendet; bitte keine JSON-Keys
   oder Passwörter in ChatGPT einfügen.

3. Aktuelle, **frische** Daten ausschließlich LESEN (der alte Report
   könnte durch neue XP bereits veraltet sein):

   ```bash
   node scripts/migrate-wallets.cjs --scan \
     --project studyverse-logins \
     --report security-reports/wallet-report.json

   node scripts/show-wallet-summary.cjs \
     --report security-reports/wallet-report.json
   ```

   Prüfe die Tabelle: **alle 12 oder mehr inzwischen angelegten Accounts**,
   aktuelle XP, TT, gekaufte Items, die beiden legitimen Token-Flags.
   Die Liste kann inzwischen von deinem Screenshot abweichen — das ist
   normal, wenn jemand seitdem gelernt oder Items gekauft hat.

4. Migration erst simulieren (NO WRITES):

   ```bash
   node scripts/stage-wallets.cjs \
     --project studyverse-logins \
     --report security-reports/wallet-report.json
   ```

5. Wenn die **aktuell gelesenen Werte** für alle Accounts unverändert
   übernommen werden sollen, Schattenkopie anlegen:

   ```bash
   node scripts/stage-wallets.cjs \
     --project studyverse-logins \
     --report security-reports/wallet-report.json \
     --stage --owner-approved-unchanged
   ```

   Das Script legt **vor der ersten Firestore-Änderung** eine private
   Kopie aller alten `users`-Dokumente unter
   `security-reports/legacy-users-backup-*.json` ab. Danach werden nur
   noch inaktive Wallet-Schattenkopien erstellt. Die alten Docs werden
   weder geändert noch gelöscht. Das Ergebnis darf keinen Account
   als `migrationApproved:true` aktivieren.

6. Kontrolle (read-only, ohne neue Daten zu verändern):

   ```bash
   node scripts/stage-wallets.cjs \
     --project studyverse-logins \
     --report security-reports/wallet-report.json \
     --audit
   ```

   Erwartet: `12 match / 0 missing / 0 mismatched` (oder die
   tatsächliche neue Accountanzahl). Wenn das nicht erscheint, **nicht
   an Regeln oder PR #15 weiterarbeiten**, sondern die Ausgabe prüfen.

## Danach

- Studyverse bleibt **wie bisher** nutzbar. **PR #15 nicht mergen**;
  sonst würde der derzeitige Entwurf XP-Vergabe und Item-Shop verändern.
- Keine Blaze-Umstellung, neuen IAM-Rechte oder Functions-Deployment sind
  für **diese Schattenkopie** erforderlich.
- Die Kopien werden **nicht automatisch synchronisiert**. Wenn ein Schüler
  XP verdient oder im Shop einkauft, ist die Wallet-Kopie irgendwann
  veraltet, der echte bisherige Spielstand bleibt korrekt.
- Beim nächsten XP-/Item-Shop-Umbau erzeugen wir einen neuen Scan und
  aktualisieren die noch inaktiven Kopien mit:

   ```bash
   node scripts/migrate-wallets.cjs --scan --project studyverse-logins \
     --report security-reports/wallet-report.json
   node scripts/stage-wallets.cjs --project studyverse-logins \
     --report security-reports/wallet-report.json \
     --stage --refresh-shadow --owner-approved-unchanged
   ```

- **Niemals** die späteren `--apply`- oder
  `STUDYVERSE_SECURITY_CUTOVER_APPROVED=true`-Schritte ausführen,
  bevor die neue XP-/Shop-Logik und das Live-Deployment überprüft wurden.

Der volle JSON-Report und das Backup enthalten personenbezogene Accountdaten.
Sie bleiben privat in deiner Cloud Shell; **nicht öffentlich in GitHub hochladen**.
