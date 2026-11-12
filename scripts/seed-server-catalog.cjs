#!/usr/bin/env node
'use strict';
/** Seed private question bank & canonical shop prices, owner-only. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {initializeApp,applicationDefault}=require(require.resolve('firebase-admin/app',{paths:[path.resolve(__dirname,'../functions')]}));
const {getFirestore,FieldValue}=require(require.resolve('firebase-admin/firestore',{paths:[path.resolve(__dirname,'../functions')]}));
const {isExamQuestion}=require(path.resolve(__dirname,'../public/shared/exam-question-policy.js'));

const args=process.argv.slice(2),project=args[args.indexOf('--project')+1];
if(!project||!/^[a-z][a-z0-9-]{4,60}$/.test(project))
 throw Error('Usage: --project studyverse-logins [--apply --owner-approved]');
const approved=args.includes('--apply')&&args.includes('--owner-approved');
initializeApp({credential:applicationDefault(),projectId:project});const db=getFirestore();
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../public/daily/questions.js'),'utf8'),sandbox);
const questions=sandbox.window.STUDYVERSE_DAILY_QUESTIONS;
if(!Array.isArray(questions)||questions.length<100)throw Error('No daily challenge bank found');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'..')]}));
const original=fs.readFileSync(path.resolve(__dirname,'../src/app/shop-items.ts'),'utf8');
const output=ts.transpileModule(original,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const compiledModule={exports:{}};
vm.runInNewContext(output,{module:compiledModule,exports:compiledModule.exports,console});
const items=compiledModule.exports.SHOP_ITEMS;
if(!Array.isArray(items)||items.length<20)throw Error('No shop items found');
console.log('Questions='+questions.length+' Shop items='+items.length+' mode='+(approved?'WRITE':'DRY RUN'));
if(!approved){console.log('No Firestore write made. To populate private server catalog add --apply --owner-approved');process.exit(0)}
(async()=>{
 for(const q of questions){
  if(typeof q.id!=='string'||!/^[-a-z0-9:_]{3,100}$/.test(q.id)||!Array.isArray(q.choices)||
     !Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)throw Error('Invalid challenge '+q.id);
  await db.doc('questionBank/'+q.id).set({kind:'quiz',active:true,
    examEligible:isExamQuestion(q),answer:String(q.choices[q.answer]),
    source:q.subject||'unknown',updatedAt:FieldValue.serverTimestamp()},{merge:true});
 }
 for(const item of items){
  if(typeof item.id!=='string'||!/^[-a-z0-9_]{2,80}$/.test(item.id)||
     !Number.isSafeInteger(item.cost)||item.cost<0)throw Error('Invalid shop item '+item.id);
  await db.doc('shopCatalog/'+item.id).set({active:true,drop:item.drop,cost:item.cost,
    level:Number.isSafeInteger(item.level)?item.level:1,
    ...(item.requirement?{requirement:item.requirement}:{}),
    updatedAt:FieldValue.serverTimestamp()},{merge:true});
 }
 console.log('Private canonical catalog seeded successfully. Public scripts STILL expose the original answers.');
})().catch(e=>{console.error(e);process.exitCode=1});
