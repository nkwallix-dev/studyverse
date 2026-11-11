'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const template=JSON.parse(fs.readFileSync('public/cloud-config.json','utf8'));
assert.equal(template.apiKey,'','Tracked Firebase config must not contain a real API key.');
assert.equal(template.projectId,'studyverse-logins');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'studyverse-firebase-test-'));
const output=path.join(folder,'cloud-config.json');
const script=path.resolve('scripts/inject-cloud-config.cjs');
const sampleKey='AIza'+'Z'.repeat(35);
try{
  fs.writeFileSync(output,JSON.stringify(template));
  const success=spawnSync(process.execPath,[script,output],{
    env:{...process.env,FIREBASE_WEB_API_KEY:sampleKey},encoding:'utf8'
  });
  assert.equal(success.status,0,'A valid CI variable should inject correctly: '+success.stderr);
  assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).apiKey,sampleKey);
  assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).projectId,'studyverse-logins');
  assert(!success.stdout.includes(sampleKey),'Never log the Firebase API key');

  fs.writeFileSync(output,JSON.stringify(template));
  const fail=spawnSync(process.execPath,[script,output],{
    env:{...process.env,FIREBASE_WEB_API_KEY:''},encoding:'utf8'
  });
  assert.notEqual(fail.status,0,'Missing variable must fail the build instead of publishing a broken login');
  assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).apiKey,'','Missing key must not inject anything');
  console.log('PASS: Firebase API key injected into deployment artifact only, missing key fails closed.');
}finally{fs.rmSync(folder,{recursive:true,force:true});}
