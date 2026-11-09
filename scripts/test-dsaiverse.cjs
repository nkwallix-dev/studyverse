const fs=require('node:fs'), assert=require('node:assert/strict'), vm=require('node:vm');
const data=fs.readFileSync('public/dsai/test-01/data.js','utf8');
const questions=fs.readFileSync('public/dsai/test-01/questions.js','utf8');
const app=fs.readFileSync('public/dsai/test-01/app.js','utf8');
const page=fs.readFileSync('public/dsai/test-01/index.html','utf8');
const css=fs.readFileSync('public/dsai/test-01/style.css','utf8');
new Function(data);new Function(questions);new Function(app);
const sandbox={window:{}};
vm.runInNewContext(data,sandbox);
vm.runInNewContext(questions,sandbox);
const C=sandbox.window.DSAI_CONTENT,Q=sandbox.window.DSAI_QUESTIONS;
assert.equal(C.lessons.length,16);
assert.equal(Q.length,106);
assert.equal(new Set(Q.map(q=>q.id)).size,Q.length,'Unique question IDs required');
assert.equal(Q.filter(q=>q.code).length,23,'Expected the uploaded notebooks to drive 23 code-recognition questions');
for(const l of C.lessons){
 assert(Q.some(q=>q.topic===l.id),'All learning lessons require a checkpoint question: '+l.id);
 assert(l.blocks.length>=3&&l.example&&l.source,'Each lesson needs examples and source: '+l.id);
}
for(const q of Q){
 assert.equal(q.choices.length,4,'Four MC options '+q.id);
 assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,'Valid answer '+q.id);
 assert(q.explain&&q.explain.length>10,'Explanation needed '+q.id);
}
assert.equal(C.sort.length,23);assert.equal(C.pipelines.length,3);
assert(page.includes('src="data.js"')&&page.includes('src="questions.js"')&&page.includes('src="app.js"'));
assert(css.includes('.sidebar')&&css.includes('data-atm'));
assert(app.includes('dsai_studyverse_v1'),'Global bridge must use the registered per-test save key');
assert(app.includes('payDailyQuiz')&&app.includes('payDailyBoss'),'Repeated correct learning has capped daily TT');
assert(app.includes('finish:'),'Finish button must be implemented in all DSAI training modes');
assert(app.includes('options(key,answers,correct)'),'Answer positions must be freshly shuffled');

const elements={};
for(const id of ['main','sidebar','nav','crumb','avatar','mobileMenu','toast']){
 elements[id]={textContent:'',innerHTML:'',dataset:{},events:{},
  classList:{add(){},remove(){},toggle(){}},
  addEventListener(type,fn){this.events[type]=fn;}};
}
const store={};
const localStorage={
 getItem(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null},
 setItem(k,v){store[k]=String(v);}
};
const document={
 body:{dataset:{}},getElementById:id=>elements[id],
 querySelectorAll:()=>[],addEventListener(){}
};
const window={DSAI_CONTENT:C,DSAI_QUESTIONS:Q,scrollTo(){}};
const ctx={window,document,localStorage,location:{hash:''},console,setTimeout,clearTimeout,Date,Math};
vm.runInNewContext(app,ctx);
assert(elements.main.innerHTML.includes('Von Null zum'),'Dashboard should render immediately');
assert(elements.main.innerHTML.includes('Fertig stellen'),'Dashboard must show completion shortcuts');

function clickAction(name){
 const target={closest(selector){return selector==='[data-action]'?{dataset:{action:name}}:null}};
 elements.main.events.click({target});
}
clickAction('finish:academy');
assert(elements.main.innerHTML.includes('VERSTÄNDNIS-CHECK'),'Finish academy must jump to the first incomplete lesson');
clickAction('finish:quiz');
assert(elements.main.innerHTML.includes('data-answer='),'Finish quiz must display unanswered questions');
clickAction('finish:code');
assert(elements.main.innerHTML.includes('Code')&&elements.main.innerHTML.includes('data-answer='),'Code-Detective must be playable');
clickAction('finish:sorter');
assert(elements.main.innerHTML.includes('data-answer='),'Data-Sorter must be playable');
clickAction('finish:pipeline');
assert(elements.main.innerHTML.includes('puzzle-step'),'Pipeline-Puzzle must be playable');
clickAction('finish:forecast');
assert(elements.main.innerHTML.includes('y = 15,71'),'Festival-Forecast must use class formula');
clickAction('start-boss');
assert(elements.main.innerHTML.includes('data-bossanswer='),'Boss must show MC questions');

console.log('DSAIVERSE PASS: 16 lessons, 106 MC questions, 23 snippets, all Finish modes, game runtime and Boss.');

// Pipeline requires full mastery: no solution spoilers and mistakes restart from phase 1.
assert(app.includes('if(!run.correct){run.step=0;prepare();render();return}'),'Wrong pipeline answers must reset the entire process to step 1');
assert(!app.includes('why:p.parts.join(" → ")'),'Do not leak process solution through feedback');
assert(app.includes('Die aktuelle Prozesskette startet wieder bei Schritt 1'),'Show reset notice rather than the answer');
assert(app.includes('Prozess bei Schritt 1 neu starten'),'Reset action needs clear label');
console.log('DSAIVERSE pipeline spoiler-free restart checks passed.');
