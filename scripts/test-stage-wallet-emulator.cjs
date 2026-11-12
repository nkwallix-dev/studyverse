'use strict';
/* Real Firestore emulator test: staging makes no live economy changes and
 * refresh can only update an unapproved shadow, never an activated wallet. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const backend=path.resolve(__dirname,'../functions');
const {initializeApp}=require(require.resolve('firebase-admin/app',{paths:[backend]}));
const {getFirestore}=require(require.resolve('firebase-admin/firestore',{paths:[backend]}));
const project='demo-studyverse-shadow-stage';
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Run inside Firestore emulator');
const app=initializeApp({projectId:project}),db=getFirestore(app);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'studyverse-shadows-'));
const report=path.join(temp,'report.json');
const run=(script,opts=[])=>spawnSync(process.execPath,['scripts/'+script,
 '--project',project,'--report',report,...opts],{cwd:path.resolve(__dirname,'..'),env:process.env,encoding:'utf8'});
(async()=>{
 try{
  const uid='shadowTester111',doc=db.doc('users/'+uid),wallet=db.doc('users/'+uid+'/wallet/tokens');
  const make=(tokens,xp)=>JSON.stringify({version:1,
    profile:{nickname:'ShadowPlayer',tokens,xp,inventory:['title','banner'],
      equipped:{title:'title'},claimedLevels:{'10':true}},
    trainers:{chem:{xp:320}}});
  const first=make(13545,4274);
  await doc.set({profile:first,updatedAt:new Date()});
  assert.equal(run('migrate-wallets.cjs',['--scan']).status,0,'scan must succeed');
  let data=JSON.parse(fs.readFileSync(report,'utf8'));
  assert.equal(data.entries.length,1);
  assert(data.entries[0].flags.includes('REVIEW_TOKENS_SPIKE'));
  assert.equal(run('stage-wallets.cjs').status,0,'preview has no writes');
  assert.equal((await wallet.get()).exists,false);
  const stage=run('stage-wallets.cjs',['--stage','--owner-approved-unchanged']);
  assert.equal(stage.status,0,stage.stderr);
  let shadow=(await wallet.get()).data();
  assert.equal(shadow.xp,4274);
  assert.equal(shadow.tokens,13545);
  assert.deepEqual(shadow.inventory,['title','banner']);
  assert.equal(shadow.migrationStage,'shadow');
  assert.equal(shadow.migrationApproved,false);
  assert.equal((await doc.get()).data().profile,first,'Live legacy XP & shop data stay unchanged');
  assert.equal((await db.doc('verifiedProfiles/'+uid).get()).exists,false,
    'Shadow migration cannot change rankings');
  assert.equal(run('stage-wallets.cjs',['--audit']).status,0,'audit must match staged wallets');
  assert.equal(run('stage-wallets.cjs',['--stage','--owner-approved-unchanged']).status,0,
    'Repeat migration must be idempotent');
  const newer=make(13570,4310);
  await doc.update({profile:newer,updatedAt:new Date()});
  assert.notEqual(run('stage-wallets.cjs',['--audit']).status,0,'Stale snapshot must be detected');
  assert.equal(run('migrate-wallets.cjs',['--scan']).status,0,'Fresh scan needed');
  assert.notEqual(run('stage-wallets.cjs',['--stage','--owner-approved-unchanged']).status,0,
    'Stale shadow cannot be overwritten accidentally');
  const refreshed=run('stage-wallets.cjs',['--stage','--refresh-shadow','--owner-approved-unchanged']);
  assert.equal(refreshed.status,0,refreshed.stderr);
  shadow=(await wallet.get()).data();
  assert.equal(shadow.xp,4310);
  assert.equal(shadow.tokens,13570);
  assert.equal(shadow.migrationApproved,false);
  assert.equal((await doc.get()).data().profile,newer);
  await wallet.update({migrationApproved:true,migrationStage:'active'});
  assert.notEqual(run('stage-wallets.cjs',['--stage','--refresh-shadow','--owner-approved-unchanged']).status,0,
    'No staged script can modify an activated wallet');
  console.log('PASS: shadow staging/auditing/rescan is safe and never changes XP or shop.');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
