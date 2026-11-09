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
assert(html.includes('id="studyverse-backup-import"'),'Backup import needs a visible control directly in the profile');
assert(html.includes('undoStudyverseRestore()'),'Undo button required');
assert(html.includes('studyverse-backup.json'),'Dialog should explain the correct backup');
console.log('PASS: STUDYVERSE raw export / CHEMVERSE export differentiated, backup restore and undo flow linked in UI.');
