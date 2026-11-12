'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {isExamQuestion}=require('../public/shared/exam-question-policy.js');
function questions(file,global){
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 return context.window[global];
}
const dsai=questions('public/dsai/test-01/questions.js','DSAI_QUESTIONS');
const daily=questions('public/daily/questions.js','STUDYVERSE_DAILY_QUESTIONS');
const content=questions('public/dsai/test-01/data.js','DSAI_CONTENT');
const dsaiExam=dsai.filter(isExamQuestion),dailyBoss=daily.filter(isExamQuestion);
assert.equal(dsai.length,109);
assert.equal(daily.length,167);
assert.equal(new Set(dsai.map(x=>x.id)).size,dsai.length);
assert.equal(new Set(daily.map(x=>x.id)).size,daily.length);

// No topic disappears from the simulation; reject trivia without reducing to
// an empty or repetitive exam for Pandas or the history section.
assert.equal(content.lessons.length,16);
for(const lesson of content.lessons){
 const candidates=dsaiExam.filter(q=>q.topic===lesson.id);
 assert(candidates.length>0,'No exam-safe question for topic '+lesson.id);
}
assert(dsaiExam.length>=60,'At least 60 diverse Dsaiverse exam candidates');
assert(dsaiExam.filter(q=>q.code).length>=3,'Keep runnable programming questions');
assert(dailyBoss.filter(q=>q.subject==='chem').length>=10);
assert(dailyBoss.filter(q=>q.subject==='dsai'&&q.code).length>=3);
assert(dailyBoss.filter(q=>q.subject==='dsai').length>=10);

// Previously reported nonsense must NEVER appear in any simulation,
// even if it is still available in the normal Quiz-Arena.
const excluded=['q16','q24','q25','q27','q30','q53','q56','q57','q59',
 'q70','q87','q88','q89','q90','q91','q93','q94','q95','q96','q97',
 'q98','q99','q100','q101','q102','q104','q106'];
for(const id of excluded){
 const original=dsai.find(q=>q.id===id);
 assert(original && !isExamQuestion(original),'Exclude '+id+' '+original?.question);
 const onDaily=daily.find(q=>q.id==='dsai:'+id);
 assert(onDaily && !isExamQuestion(onDaily),'Exclude daily boss variant of '+id);
}
for(const id of ['q107','q108','q109']){
 assert(isExamQuestion(dsai.find(q=>q.id===id)),'Generic Pandas replacement must qualify '+id);
 assert(isExamQuestion(daily.find(q=>q.id==='dsai:'+id)));
}
assert(isExamQuestion(dsai.find(q=>q.id==='q5')),'Big Data 100 TB quantity is NOT a calendar year');
assert(isExamQuestion(dsai.find(q=>q.id==='q29')),'Conceptual Transformer question should remain');
assert(isExamQuestion(dsai.find(q=>q.id==='q52')),'Independent calculation question should remain');

const src=fs.readFileSync('public/dsai/test-01/app.js','utf8');
const chem=fs.readFileSync('public/nawi/test-01/index.html','utf8');
const dailyApp=fs.readFileSync('public/daily/app.js','utf8');
for(const file of ['public/dsai/test-01/index.html','public/nawi/test-01/index.html','public/daily/index.html']){
 assert(fs.readFileSync(file,'utf8').includes('exam-question-policy.js'),file+' must load exam policy');
}
assert(src.includes('const examPool=Q.filter(eligible)'),'Dsaiverse Final Boss must use safe questions');
assert(chem.includes("QUIZ.filter(q=>q.t===t.id&&eligible(q))"),'Chemverse Final Boss must use safe questions');
assert(dailyApp.includes('selectPool(newMode==="boss")'),'Daily Arena boss must use safe questions');
assert(dailyApp.includes('examOnly?bySubject.dsai.filter(eligible):bySubject.dsai'),
 'Normal daily repetition must retain its complete question pool');

// All sample sets remain mathematically possible.
for(const q of dailyBoss.filter(q=>q.subject==='dsai')){
 const original=dsai.find(d=>('dsai:'+d.id)===q.id);
 assert(original && isExamQuestion(original),
  'Daily boss must never include an original Dsaiverse question that is not exam-safe '+q.id);
}
// The shared Daily questions sometimes explicitly reference an Original-Array
// even when the standalone trainer phrases it independently; that daily
// variant is excluded, which is intentional (e.g. dsai:q67).
assert(!dailyBoss.some(q=>q.id==='dsai:q67'),'Daily Original-Array wording must not enter the boss');
console.log('PASS: Dsaiverse exam has '+dsaiExam.length+
 ' safe candidates from all 16 topics, excludes dataset trivia/years, keeps regular learning pool intact.');
