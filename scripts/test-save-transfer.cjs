// Regression checks for laptop -> desktop migration (both old export formats).
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = fs.readFileSync('src/app/app.ts','utf8');
const html = fs.readFileSync('src/app/app.html','utf8');
const from = code.indexOf('const safe=');
const until = code.indexOf('const read=',from);
assert(from>=0&&until>from,'Cannot locate the backup format validators');
const excerpt=code.slice(from,until);
const plain=ts.transpileModule(excerpt,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const {validStudyverse,validChem} = new Function(plain + '\nreturn {validStudyverse,validChem};')();
const rawStudyverse = {
 xp:3175,tokens:1745,nickname:'Niki',
 inventory:['avatar_atom','gold','legend'],
 equipped:{theme:'base',avatar:'👑',atm:'snow'},
 claimedLevels:{'2':true},activity:[],
 trainerSaves:{'nawi-test-01':{xp:3175,coins:1745,solved:{q1:1},learned:{basis:true}}}
};
const rawChemverse = {
 xp:3175,coins:1745,solved:{q1:1},learned:{basis:true},
 earned:{q1:15},purchased:{neon:true}
};
assert(validStudyverse(rawStudyverse),'Original studyverse-backup.json must be accepted');
assert(!validChem(rawStudyverse),'Studyverse backup is NOT raw CHEMVERSE save');
assert(validChem(rawChemverse),'Old CHEMVERSE state must still import');
assert(!validStudyverse(rawChemverse),'Raw CHEMVERSE should not accidentally overwrite global studyverse profile');
assert(!validStudyverse({xp:100,tokens:200,inventory:[],equipped:{}}),'Malformed backups must be rejected');
assert(!validStudyverse({...rawStudyverse,tokens:-100}),'Negative TT invalid');
assert(!validStudyverse({...rawStudyverse,xp:Infinity}),'Nonfinite XP invalid');
assert(code.includes("if(validStudyverse(candidate)){this.restoreStudyverseBackup(candidate);return;}"),'File chooser must automatically distinguish STUDYVERSE backups');
assert(code.includes("if(validChem(candidate)){this.applyImport(candidate);return;}"),'Legacy CHEMVERSE import must remain');
assert(code.includes('private restoreStudyverseBackup('),'Actual restore function must exist');
assert(code.includes('localStorage.setItem(RESTORE,JSON.stringify(previous))'),'Existing PC save must be recoverable');
assert(code.includes('this.profile=this.load();this.nicknameEdit=this.profile.nickname'),'Restore must update visible account immediately');
assert(code.includes('localStorage.removeItem(BRIDGE)'),'Old in-flight trainer must not cause duplicate XP');
assert(code.includes('undoStudyverseRestore()'),'Users need undo after restoring');
assert(code.includes('this.profile.trainerSaves=snapshots'),'A full backup must carry per-test progress');
assert(code.includes('this.profile.tokens')===true,'Use global TT on profile restore');
assert(html.includes('class="profile-advanced-tools"') && html.includes('id="studyverse-backup-import"'),'Legacy backup import must remain available in collapsible advanced data tools');
assert(html.includes('undoStudyverseRestore()'),'Undo button required');
// Offline backups remain readable, but must NEVER seed competitive cloud wallets.
assert(code.includes('get canRestoreBackup(){return this.cloudReady&&!this.cloudConfigured&&!this.cloud.session;}'),
 'Imports must be disabled while Firebase setup is pending and whenever Cloud accounts exist');
for(const path of ['importFile(event:Event)','private restoreStudyverseBackup(data:Record<string,unknown>)','private applyImport(data:unknown)','undoStudyverseRestore()']){
 const idx=code.indexOf(path);
 assert(idx>=0,'Import handler missing: '+path);
 assert(code.slice(idx,idx+300).includes('rejectUnsafeBackupRestore()'),
  'No import/undo entrypoint may bypass the Cloud guard: '+path);
}
assert(code.includes('this.freshCloudAccount();')&&code.includes('write(LOCAL_ARCHIVE,'),
 'New Cloud accounts must start at zero after keeping an offline-only archive');
assert(code.includes('this.profile=initial();')&&code.includes('this.clearDeviceProgress();'),
 'New Cloud account wallet cannot copy local coins or XP');
assert(!html.includes('class="cloud-auth-import"'),
 'Registration UI must not advertise editable JSON uploads');
assert(html.includes('*ngIf="canRestoreBackup" for="studyverse-backup-import"'),
 'Offline restore must be explicitly hidden from Cloud users');
assert(html.includes('exportLocalArchive()'),
 'Users should still be able to download previous unsynced local progress');
assert(html.includes('type="button" class="btn secondary" (click)="exportProfile()"'),
 'Backup export remains available even after imports are disabled');
console.log('PASS: legacy offline backups still parse, Cloud JSON import disabled, new accounts start clean, old local data archived.');
