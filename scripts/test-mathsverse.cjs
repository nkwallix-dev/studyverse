'use strict';
/* End-to-end in-memory MathsVerse check: source transcription, equivalent math
   answers, hint flow, progress, boss, StudyVerse integration and rewards. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='public/maths/hw-02/';
const data=fs.readFileSync(dir+'data.js','utf8'),
 engine=fs.readFileSync(dir+'math-engine.js','utf8'),
 app=fs.readFileSync(dir+'app.js','utf8'),
 page=fs.readFileSync(dir+'index.html','utf8'),
 css=fs.readFileSync(dir+'style.css','utf8');
new Function(data);new Function(engine);new Function(app);
for(const script of ['data.js','math-engine.js','app.js','../../shared/cloud-progress.js','../../shared/verse-cosmetics.js']){
 assert(page.includes('src="'+script+'"'),'Trainer must load '+script);
}
assert(css.includes('@media(max-width:520px)')&&css.includes('@media(max-width:770px)'),'MathsVerse must fit phone screens');
const bundle={};vm.runInNewContext(data,{window:bundle});
vm.runInNewContext(engine,{window:bundle});
const D=bundle.MATHSVERSE_DATA,E=bundle.MATHSVERSE_MATH;
assert.equal(D.exam,'2. Hausübungswiederholung','Explicitly the SECOND homework revision');
assert.equal(D.tasks.length,18,'All original tasks and only selected subparts');
assert.equal(new Set(D.tasks.map(q=>q.id)).size,18,'No duplicate exercises');
assert.deepEqual(Array.from(D.groups,g=>D.tasks.filter(t=>t.group===g.name).length),[6,6,2,4]);
const required=['1.55a','1.55b','1.56a','1.56b','1.57a','1.57b','1.58a','1.58b','1.66a','1.67a',
 '1.98a','1.98b','1.98c','1.98d','1.100-1','1.100-2','1.100-3','1.100-4'];
assert.deepEqual(Array.from(D.tasks,t=>t.id).sort(),required.sort(),'Exercise scope exactly matches submitted pages');
for(const task of D.tasks){
 assert.equal(task.methodOptions.length,3,'Three method choices: '+task.id);
 assert.equal(task.stepOptions.length,3,'Three intermediate choices: '+task.id);
 assert(task.steps.length>=3,'Fully worked example: '+task.id);
 assert(E.check(task,task.answer).ok,'Official answer must pass for '+task.id);
}
for(const [id,input] of [
 ['1.55a','x⁴ - 1,5x² + x + C'],
 ['1.55b','a*t²/2+b*t+C'],
 ['1.56b','(3/5)*x^(5/3)+5*ln|x|+3/x+C'],
 ['1.58b','2*sin(t/2) + C'],
 ['1.98b','(e² - 1)/2'],
 ['1.66a','98/3'],
 ['1.67a','40sqrt(10)/3'],
 ['1.100-4','14,41']]){
 assert(E.check(D.tasks.find(t=>t.id===id),input).ok,'Equivalent solution rejected for '+id);
}
assert(!E.check(D.tasks.find(t=>t.id==='1.55a'),'x^3').ok,'Wrong primitive must not earn rewards');
assert(!E.check(D.tasks.find(t=>t.id==='1.100-1'),'0.0012*t³-0.09*t²+2.25*t').ok,'Drohne needs v(0)=3');
assert.throws(()=>E.evaluate('window.alert(1)'),/kann ich nicht lesen|Unbekannt/,'Parser must not run user code');
const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const host=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
const shop=fs.readFileSync('src/app/shop-items.ts','utf8');
const sync=fs.readFileSync('public/shared/cloud-progress.js','utf8');
assert(registry.includes("id:'maths-hw-02',subjectId:'mat'")&&registry.includes("saveKey:'mathsverse_hw02_v1'"),'Trainer must be registered');
assert(host.includes("id:'mat',short:'MAT'"),'Math must be a playable StudyVerse subject');
assert(html.includes("trainer.subjectId==='mat'?'MathsVerse'"),'MathsVerse must appear in live sidebar');
assert(shop.includes("id:'maths-hw-02'")&&shop.includes("id:'maths_avatar_pi'"),'MathsVerse must have its own cosmetic drop');
assert(sync.includes("'maths-hw-02':'mathsverse_hw02_v1'"),'Cloud snapshot must mirror MathsVerse progress');

const elements={'#app':{innerHTML:''},'#toast':{textContent:'',classList:{add(){},remove(){}}},'#math-entry':{value:''},'#boss-entry':{value:''}};
const handlers={},storage={};
const browser={
 window:bundle,
 localStorage:{getItem(k){return storage[k]||null},setItem(k,v){storage[k]=String(v)},removeItem(k){delete storage[k]}},
 document:{querySelector(sel){return elements[sel]||null},addEventListener(type,fn){handlers[type]=fn}},
 location:{hash:''},setTimeout(){return 1},clearTimeout(){},console
};
vm.runInNewContext(app,browser);
assert(elements['#app'].innerHTML.includes('2. Hausübungswiederholung'),'Dashboard should load');
function click(action){handlers.click({target:{closest(){return{dataset:{action}}}}})}
function submit(id){handlers.submit({target:{id},preventDefault(){}})}
function saved(){return JSON.parse(storage.mathsverse_hw02_v1)}
click('view:academy');assert(elements['#app'].innerHTML.includes('Vorgerechnet'),'Academy must render');
click('lesson-done');assert(saved().learned['Stammfunktionen'],'Chapter completion saved');
click('lesson-done');assert.equal(saved().xp,25,'Chapter XP must only be paid once');
click('train:1.55a');
assert(elements['#app'].innerHTML.includes('Schritt 1'),'Guided trainer starts at method');
const answers=D.tasks.find(t=>t.id==='1.55a');
function solveChoice(prefix,options,right,needle){
 const h=elements['#app'];
 const escape=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const s=h.innerHTML;
 const found=[...s.matchAll(new RegExp('data-action="'+prefix+':(\\d+)"[^>]*>\\s*<span>[A-C]<\\/span>([^<]*)<\\/button>','g'))];
 const pick=found.find(a=>a[2]===escape(options[right]));
 assert(pick,'Correct '+prefix+' choice must be shown');
 click(prefix+':'+pick[1]);assert(elements['#app'].innerHTML.includes(needle));
}
solveChoice('method',answers.methodOptions,answers.methodRight,'Schritt 2');
solveChoice('step',answers.stepOptions,answers.stepRight,'Schritt 3');
elements['#math-entry'].value='x^4-1.5x^2+x+C';submit('answer-form');
assert(saved().solved['q1.55a'],'Solved original task must save');
const before=saved().xp;
click('train:1.55a');
solveChoice('method',answers.methodOptions,answers.methodRight,'Schritt 2');
solveChoice('step',answers.stepOptions,answers.stepRight,'Schritt 3');
elements['#math-entry'].value='x^4-1.5x^2+x';submit('answer-form');
assert.equal(saved().xp,before,'Repeating the same solution must not farm XP');
assert(!elements['#app'].innerHTML.includes('class="token"'),'Keep standalone trainer wallet out of top header');
click('view:boss');let bossCount=0;
for(let i=0;i<10;i++){
 const task=D.tasks.find(t=>elements['#app'].innerHTML.includes(taskMath(t)));
 assert(task,'Boss task must be displayed at step '+i);
 elements['#boss-entry'].value=task.answer;
 submit('boss-form');click('boss-next');bossCount++;
}
assert.equal(bossCount,10);
assert.equal(saved().bestBoss,100,'Perfect boss result must be saved');
assert(elements['#app'].innerHTML.includes('100 %'),'Boss result displayed');
function taskMath(t){return String(t.math).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
console.log('MATHSVERSE PASS: 18 official tasks, 4 fully worked chapters, equivalent-input math checker, 3-step practice, persistent rewards, boss and cloud/trainer integration.');
