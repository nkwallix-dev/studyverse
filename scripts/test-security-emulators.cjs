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
  assert.equal(second.tokensAwarded,0);
  const w=await admin.doc('users/'+uid+'/wallet/tokens').get();
  assert.equal(w.data().tokens,25,'Only one server-side credit');
  console.log('PASS: callable quiz credits once per day.');

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
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1});
