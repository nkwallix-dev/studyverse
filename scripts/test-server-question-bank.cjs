'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a={window:{}},b={window:{}};
vm.runInNewContext(fs.readFileSync('public/daily/questions.js','utf8'),a);
vm.runInNewContext(fs.readFileSync('public/dsai/test-01/questions.js','utf8'),b);
const bank=a.window.STUDYVERSE_DAILY_QUESTIONS,dsai=b.window.DSAI_QUESTIONS;
assert.equal(bank.length,164,'Canonical daily question bank must stay 164');
assert.equal(dsai.length,106,'Dsaiverse source must stay 106');
const map=new Map(bank.map(q=>[q.id,q]));
assert.equal(map.size,bank.length,'No duplicate challenge IDs');
for(const q of dsai){
 const onServer=map.get('dsai:'+q.id);
 assert(onServer,'Server must recognize each Dsaiverse daily quiz: '+q.id);
 assert.equal(onServer.choices[onServer.answer],q.choices[q.answer],
   'Server answer must match the visible original trainer question '+q.id);
}
for(const q of bank){
 assert(/^(chem|dsai):q\d+$/.test(q.id),'IDs must use exact trainer namespaces');
 assert(q.choices.length===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,
   'Canonical question answer must be a valid option');
}
console.log('PASS: All Dsaiverse trainer answers match canonical Firebase seed bank.');
