'use strict';
/* Actual boss eligibility regression. Original dataset trivia remains available
 * in training quizzes, but is never selected or rewarded in an exam simulation.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {isExamQuestion}=require('../public/shared/exam-question-policy.js');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('public/dsai/test-01/questions.js','utf8'),sandbox);
const questions=sandbox.window.DSAI_QUESTIONS;
vm.runInNewContext(fs.readFileSync('public/daily/questions.js','utf8'),sandbox);
const shared=sandbox.window.STUDYVERSE_DAILY_QUESTIONS;

const banned=new Set(['q24','q25','q27','q30','q98','q99','q100','q101','q106']);
for(const id of banned){
 const source=questions.find(q=>q.id===id);
 const daily=shared.find(q=>q.id==='dsai:'+id);
 assert(source&&daily,'Original source question remains in ordinary training: '+id);
 assert.equal(isExamQuestion(source),false,'Exclude from Dsaiverse final boss: '+id);
 assert.equal(isExamQuestion(daily),false,'Exclude from shared Daily Arena boss: '+id);
}
const exam=questions.filter(isExamQuestion);
const groups=[...new Set(questions.map(x=>x.topic))];
assert(exam.length>=20,'At least twenty independent exam questions needed');
for(const topic of groups){
 assert(exam.some(q=>q.topic===topic),'At least one relevant exam question in '+topic);
}
const cloudExam=shared.filter(q=>q.subject==='dsai'&&isExamQuestion(q));
assert(cloudExam.filter(q=>q.code).length>=3,'Mixed exam must retain code comprehension');
assert(cloudExam.length>=10,'Mixed boss needs 10 Dsaiverse exam questions');
assert(shared.filter(q=>q.subject==='chem'&&isExamQuestion(q)).length>=10,
 'Mixed boss needs 10 Chemverse exam questions');
for(const q of exam){
 assert(!/(?:\b(?:19|20)\d{2}\b|original|notebook|folien|\bchief\b|\bsal(?:\[|\.)|basepay|overtimepay)/i
   .test([q.question,q.code||'',...q.choices].join(' ')),
  'Unexpected dataset/year/memorization reference in boss: '+q.id);
}
assert(isExamQuestion(questions.find(q=>q.id==='q1')),
 'General subject knowledge must remain in exam');
assert(isExamQuestion(questions.find(q=>q.id==='q107')),
 'Generic pandas nunique comprehension stays in exam');
assert(isExamQuestion(questions.find(q=>q.id==='q109')),
 'Generic pandas string-search method stays in exam');
const app=fs.readFileSync('public/dsai/test-01/app.js','utf8');
const daily=fs.readFileSync('public/daily/app.js','utf8');
const chem=fs.readFileSync('public/nawi/test-01/index.html','utf8');
const seeder=fs.readFileSync('scripts/seed-server-catalog.cjs','utf8');
const backend=fs.readFileSync('functions/src/index.ts','utf8');
assert(app.includes('Q.filter(eligible)'),'Standalone Dsaiverse boss uses exam-filtered question pool');
assert(app.includes('bossAnswers:[]'),'Boss must collect all answers for server review');
assert(daily.includes('bySubject.dsai.filter(eligible)'),'Shared daily boss uses exam-filtered DS questions');
assert(chem.includes('QUIZ.filter(q=>q.t===t.id&&eligible(q))'),
 'Chemverse boss filters source-only memorization prompts');
assert(seeder.includes('examEligible:isExamQuestion(q)')&&backend.includes('q.data()?.examEligible !== true'),
 'Server must reject excluded questions even if a caller submits them directly');
console.log('PASS: '+exam.length+'/'+questions.length+
 ' Dsaiverse exam-eligible questions; all dataset counts/people/years excluded, learning quiz untouched.');
