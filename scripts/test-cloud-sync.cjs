'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('public/shared/cloud-progress.js','utf8');
async function exercise(expired){
  const values=new Map();
  const set=(k,x)=>values.set(k,JSON.stringify(x));
  const profile={xp:132,tokens:500,nickname:'Test',inventory:['stars'],equipped:{atm:'stars'},claimedLevels:{},activity:[],trainerSaves:{}};
  set('studyverse_profile_v1',profile);
  set('studyverse_cloud_session_v1',{uid:'firebase-user-123',username:'test',refreshToken:'refresh-123',
    idToken:'access-123',expiresAt:expired?1:Date.now()+3600_000});
  set('chemverse_niklas_v1',{xp:21,coins:499,purchased:{stars:true},learned:{basis:true}});
  set('dsai_studyverse_v1',{xp:9,coins:499,learned:{a:true}});
  set('studyverse_trainer_launch_v2',{id:'nawi-test-01',saveKey:'chemverse_niklas_v1',xp:0});
  set('studyverse_shared_daily_v1',{today:'2026-11-09',bossPaid:true});
  let scheduled=null;const calls=[];
  const fetch=async(url,opts)=>{
    calls.push({url:String(url),options:opts});
    if(String(url).endsWith('cloud-config.json'))return {ok:true,json:async()=>({apiKey:'example-web-key-for-test-only',projectId:'studyverse-test'})};
    if(String(url).startsWith('https://securetoken.googleapis.com'))return {ok:true,json:async()=>({id_token:'refreshed-access',refresh_token:'refreshed-secret',expires_in:'3600'})};
    if(String(url).startsWith('https://firestore.googleapis.com'))return {ok:true,json:async()=>({})};
    throw new Error('Unexpected URL '+url);
  };
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const browser={window:{},document:{currentScript:{src:'https://example.com/studyverse/shared/cloud-progress.js'},addEventListener(){}},
    localStorage:storage,fetch,URL,URLSearchParams,Date,JSON,Promise,
    setTimeout:fn=>{scheduled=fn;return 123},clearTimeout:()=>{scheduled=null},console};
  vm.runInNewContext(source,browser);
  assert.equal(typeof browser.window.studyverseCloudTouch,'function');
  browser.window.studyverseCloudTouch();
  assert.equal(typeof scheduled,'function');
  scheduled();
  // Let the mocked asynchronous config and Firestore calls settle.
  for(let i=0;i<10;i++)await new Promise(resolve=>setTimeout(resolve,1));
  const upload=calls.find(x=>x.url.startsWith('https://firestore.googleapis.com'));
  assert.ok(upload,'Firestore upload must be invoked');
  assert.ok(upload.url.includes('/users/firebase-user-123'));
  const payload=JSON.parse(upload.options.body);
  const snapshot=JSON.parse(payload.fields.profile.stringValue);
  assert.equal(snapshot.profile.xp,132);
  assert.equal(snapshot.trainers['nawi-test-01'].xp,21);
  assert.equal(snapshot.trainers['dsai-test-01'].xp,9);
  assert.equal(snapshot.bridge.xp,0);
  assert.equal(snapshot.daily.bossPaid,true);
  assert.ok(!payload.fields.profile.stringValue.includes('refresh-123'),'Tokens must stay out of Firestore');
  if(expired){
    assert.ok(calls.some(x=>x.url.startsWith('https://securetoken.googleapis.com')),'Expired session must be refreshed');
    assert.equal(JSON.parse(values.get('studyverse_cloud_session_v1')).idToken,'refreshed-access');
  }
}
(async()=>{await exercise(false);await exercise(true);console.log('PASS: cloud trainers, daily, bridge, owner-scoped upload and token refresh');})().catch(e=>{console.error(e);process.exitCode=1});
