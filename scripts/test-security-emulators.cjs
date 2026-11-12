'use strict';
/* Run inside firebase emulators:exec --only firestore,auth,functions.
 * Uses real rules, auth emulator idTokens and callable functions emulator.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const basedir=path.resolve(__dirname,'../functions');
const testing=require(require.resolve('@firebase/rules-unit-testing',{paths:[basedir]}));
const {initializeApp,applicationDefault}=require(require.resolve('firebase-admin/app',{paths:[basedir]}));
const {getFirestore}=require(require.resolve('firebase-admin/firestore',{paths:[basedir]}));
const {initializeTestEnvironment,assertFails,assertSucceeds}=testing;
const project=process.env.GCLOUD_PROJECT||'demo-studyverse-rules';
const dbHost=process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8080';
const [host,port]=dbHost.split(':');
const time=ms=>new Promise(ok=>setTimeout(ok,ms));
initializeApp({projectId:project});const admin=getFirestore();
const http=async(name,token,data)=>{
 const url='http://127.0.0.1:5001/'+project+'/europe-west1/'+name;
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data})});
 const body=await response.json();
 if(!response.ok)throw new Error(name+' '+response.status+' '+JSON.stringify(body));
 return body.result;
};
(async()=>{
 const env=await initializeTestEnvironment({projectId:project,firestore:{host,port:Number(port),
   rules:fs.readFileSync(path.resolve(__dirname,'../firestore.rules'),'utf8')}});
 try{
  const alice=env.authenticatedContext('alice'),bob=env.authenticatedContext('bob');
  const aliceWallet=alice.firestore().doc('users/alice/wallet/tokens');
  await env.withSecurityRulesDisabled(async ctx=>{
   await ctx.firestore().doc('users/alice/wallet/tokens').set({
    tokens:15,xp:40,inventory:['starter'],migrationApproved:true,version:1
   });
  });
  await assertFails(aliceWallet.set({tokens:10000000},{merge:true}));
  await assertSucceeds(aliceWallet.get());
  await assertFails(bob.firestore().doc('users/alice/wallet/tokens').get());
  await assertFails(alice.firestore().doc('users/alice').set({profile:'{"tokens":10000000}'}));
  await assertFails(alice.firestore().doc('users/alice/verifiedAttempts/fake').set({tokensAwarded:10000000}));
  await assertFails(alice.firestore().doc('questionBank/private').get());
  await assertSucceeds(alice.firestore().doc('clientStates/alice').set({
   nickname:'Alice',practice:JSON.stringify({version:1,profile:{nickname:'Alice'}}),
   updatedAt:new Date()
  }));
  console.log('PASS: rules deny direct wallet forging and legacy profile writes.');

  // Real callable function with a real Auth-emulator token.
  const authRes=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({email:'integration@studyverse.example',password:'correct-pw-123',returnSecureToken:true})});
  const account=await authRes.json();
  if(!authRes.ok||!account.idToken||!account.localId)throw Error('Auth emulator signup failed: '+JSON.stringify(account));
  const uid=account.localId,token=account.idToken;
  await admin.doc('users/'+uid+'/wallet/tokens').set({
   tokens:0,xp:0,inventory:[],migrationApproved:true,version:1
  });
  await admin.doc('questionBank/chem:q1').set({active:true,kind:'quiz',answer:'Echte Antwort'});
  const first=await http('submitAnswer',token,{challengeId:'chem:q1',answer:'Echte Antwort'});
  const second=await http('submitAnswer',token,{challengeId:'chem:q1',answer:'Echte Antwort'});
  assert.equal(first.tokensAwarded,25);
  assert.equal(first.xpAwarded,10);
  assert.equal(second.tokensAwarded,0);
  assert.equal(second.xpAwarded,0);
  const w=await admin.doc('users/'+uid+'/wallet/tokens').get();
  assert.equal(w.data().tokens,25,'Only one server-side token credit');
  assert.equal(w.data().xp,10,'Only one server-side XP credit');
  console.log('PASS: callable quiz credits once per day.');
  // 20-question boss: 14/20 is the minimum, daily bonus is idempotent.
  for(let i=0;i<20;i++){
   await admin.doc('questionBank/boss:q'+i).set({active:true,kind:'quiz',examEligible:true,answer:'Right'});
  }
  const answers=Array.from({length:20},(_,i)=>({
   challengeId:'boss:q'+i,answer:i<14?'Right':'Wrong'
  }));
  await admin.doc('questionBank/boss:q19').update({examEligible:false});
  const rejected=await fetch('http://127.0.0.1:5001/'+project+'/europe-west1/submitDailyBoss',{
   method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
   body:JSON.stringify({data:{answers}})});
  assert.equal(rejected.ok,false,'Server must reject a dataset-dependent exam question');
  await admin.doc('questionBank/boss:q19').update({examEligible:true});
  const bossFirst=await http('submitDailyBoss',token,{answers});
  const bossAgain=await http('submitDailyBoss',token,{answers});
  assert.equal(bossFirst.passed,true,'14 of 20 must pass');
  assert.equal(bossFirst.tokensAwarded,250,'Only one 250 TT boss reward');
  assert.equal(bossFirst.xpAwarded,50,'One verified 50 XP reward');
  assert.equal(bossAgain.tokensAwarded,0,'Boss replay cannot mint more TT');
  assert.equal(bossAgain.xpAwarded,0,'Boss replay cannot mint more XP');
  const afterBoss=(await admin.doc('users/'+uid+'/wallet/tokens').get()).data();
  assert.equal(afterBoss.tokens,275);
  assert.equal(afterBoss.xp,60);
  console.log('PASS: verified daily boss awards TT+XP once, rejects replay.');

  await admin.doc('shopCatalog/test_starter').set({
   active:true,drop:'global',cost:75,level:1
  });
  const purchased=await http('purchaseItem',token,{itemId:'test_starter'});
  const purchasedAgain=await http('purchaseItem',token,{itemId:'test_starter'});
  assert.equal(purchased.tokens,200);
  assert.equal(purchasedAgain.tokens,200,'Repeat purchases are not charged twice');
  assert.equal(purchased.inventory.includes('test_starter'),true);
  const afterPurchase=(await admin.doc('users/'+uid+'/wallet/tokens').get()).data();
  assert.equal(afterPurchase.tokens,200,'Server canonical catalog price applied');
  console.log('PASS: server catalogue purchases are atomic and idempotent.');


  await assertSucceeds(alice.firestore().doc('publicProfiles/alice').set({
   nickname:'n1gg4',avatar:'🧪',selectedTitle:'Weltenentdecker',updatedAt:new Date()
  }));
  let current;
  for(let i=0;i<30;i++){
   await time(500);
   current=(await admin.doc('publicProfiles/alice').get()).data();
   if(current?.nickname==='Spieler')break;
  }
  assert.equal(current?.nickname,'Spieler','Trigger must sanitize forbidden nicknames');
  const notice=(await admin.doc('accountNotices/alice').get()).data();
  assert.equal(notice?.kind,'nickname-blocked');
  console.log('PASS: direct public profile write sanitized and notice recorded.');

  // End-to-end MIGRATION SAFETY: scan must not write, owner-review manifest is
  // mandatory, and a reviewed cap (not the attacker value) becomes canonical.
  const {spawnSync}=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'studyverse-migration-test-'));
  try{
    const legacy=JSON.stringify({version:1,profile:{
      nickname:'ReviewMe',tokens:10000000,xp:500,inventory:['alpha'],equipped:{}},trainers:{}});
    await admin.doc('users/migrate-me').set({profile:legacy,updatedAt:new Date()});
    const report=path.join(temp,'report.json');
    const runMigration=(params)=>spawnSync(process.execPath,['scripts/migrate-wallets.cjs',
      '--project',project,'--report',report,...params],{cwd:path.resolve(__dirname,'..'),
        encoding:'utf8',env:process.env});
    const scanned=runMigration(['--scan']);
    assert.equal(scanned.status,0,scanned.stderr);
    const file=JSON.parse(fs.readFileSync(report,'utf8')),entry=file.entries.find(e=>e.uid==='migrate-me');
    assert(entry?.flags.includes('REVIEW_TOKENS_SPIKE'),'10M TT should be flagged, never auto-approved');
    const template=JSON.parse(fs.readFileSync(report.replace(/\.json$/,'')+'.approvals.template.json','utf8'));
    assert.equal(template.reviewed,false,'Review template must start unapproved');
    assert.equal((await admin.doc('users/migrate-me/wallet/tokens').get()).exists,false,'Scan must never create wallets');
    const approvals=path.join(temp,'approved.json');
    fs.writeFileSync(approvals,JSON.stringify({project,reviewed:true,entries:[
      {...entry,decision:'approve',tokens:7,xp:500,inventory:['alpha']}
    ]}),{mode:0o600});
    const applied=runMigration(['--apply','--approvals',approvals,'--confirm-reviewed']);
    assert.equal(applied.status,0,applied.stderr);
    const wallet=(await admin.doc('users/migrate-me/wallet/tokens').get()).data();
    assert.equal(wallet.tokens,7,'Only owner-reviewed value may be imported');
    const verified=(await admin.doc('verifiedProfiles/migrate-me').get()).data();
    assert.equal(verified.verified,true,'Owner-approved wallet must publish a verified rank');
    assert.equal(verified.level,1+Math.floor(Math.sqrt(500/110)),
      'Verified rank must derive from reviewed XP, not old publicProfiles.level');
    assert.equal((await admin.doc('users/migrate-me').get()).data().profile,legacy,'Legacy backup must not be deleted');
    const repeated=runMigration(['--apply','--approvals',approvals,'--confirm-reviewed']);
    assert.notEqual(repeated.status,0,'Migration must refuse overwriting existing wallet');
    console.log('PASS: migration scan, manual review, safe apply and no overwrites.');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1});
