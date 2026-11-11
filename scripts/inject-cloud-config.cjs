'use strict';
// The Firebase web API key is supplied by GitHub Actions during deployment.
// This writes ONLY to the generated Pages artifact, never to tracked source.
const fs=require('node:fs');
const path=require('node:path');

const target=process.argv[2];
const key=(process.env.FIREBASE_WEB_API_KEY||'').trim();
if(!target){
  console.error('Expected path to generated cloud-config.json');
  process.exit(1);
}
if(!/^AIza[A-Za-z0-9_-]{30,}$/.test(key)){
  console.error('Firebase web API key missing/invalid. Set APIKEYFIREBASEDB as a GitHub Actions repository variable or secret.');
  process.exit(1);
}
const file=path.resolve(target);
let config;
try{config=JSON.parse(fs.readFileSync(file,'utf8'));}
catch{console.error('Generated cloud-config.json missing or invalid');process.exit(1);}
if(typeof config.projectId!=='string'||!/^[a-z][a-z0-9-]{4,60}$/.test(config.projectId)){
  console.error('Firebase projectId missing or invalid in cloud-config.json');
  process.exit(1);
}
fs.writeFileSync(file,JSON.stringify({apiKey:key,projectId:config.projectId},null,2)+'\n');
console.log('Firebase web config injected into deployment artifact (key not logged).');
