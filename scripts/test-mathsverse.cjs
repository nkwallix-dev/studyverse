'use strict';
/* End-to-end in-memory MathsVerse check: source transcription, equivalent math
   answers, hint flow, progress, boss, StudyVerse integration and rewards. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='public/maths/hw-02/';
const data=fs.readFileSync(dir+'data.js','utf8'),
 engine=fs.readFileSync(dir+'math-engine.js','utf8'),
 workbook=fs.readFileSync(dir+'workbook.js','utf8'),
 graphs=fs.readFileSync(dir+'graphs.js','utf8'),
 keyboard=fs.readFileSync(dir+'math-keyboard.js','utf8'),
 canvas=fs.readFileSync(dir+'math-canvas.js','utf8'),
 app=fs.readFileSync(dir+'app.js','utf8'),
 page=fs.readFileSync(dir+'index.html','utf8'),
 css=fs.readFileSync(dir+'style.css','utf8');
new Function(data);new Function(engine);new Function(workbook);new Function(graphs);new Function(keyboard);new Function(canvas);new Function(app);
for(const script of ['data.js','math-engine.js','graphs.js','workbook.js','math-keyboard.js','math-canvas.js','app.js','../../shared/cloud-progress.js','../../shared/verse-cosmetics.js']){
 assert(page.includes('src="'+script+'"'),'Trainer must load '+script);
}
assert(css.includes('@media(max-width:520px)')&&css.includes('@media(max-width:770px)'),'MathsVerse must fit phone screens');
const bundle={};vm.runInNewContext(data,{window:bundle});
vm.runInNewContext(engine,{window:bundle});
vm.runInNewContext(workbook,{window:bundle});
vm.runInNewContext(graphs,{window:bundle});
vm.runInNewContext(keyboard,{window:bundle});
vm.runInNewContext(canvas,{window:bundle});
const D=bundle.MATHSVERSE_DATA,E=bundle.MATHSVERSE_MATH,W=bundle.MATHSVERSE_WORKBOOK,G=bundle.MATHSVERSE_GRAPHS,K=bundle.MATHSVERSE_KEYBOARD,C=bundle.MATHSVERSE_CANVAS;
assert.equal(D.exam,'2. Hausübungswiederholung','Explicitly the SECOND homework revision');
assert.equal(D.tasks.length,18,'All original tasks and only selected subparts');
assert.equal(new Set(D.tasks.map(q=>q.id)).size,18,'No duplicate exercises');
assert.deepEqual(Array.from(D.groups,g=>D.tasks.filter(t=>t.group===g.name).length),[6,6,2,4]);
const required=['1.55a','1.55b','1.56a','1.56b','1.57a','1.57b','1.58a','1.58b','1.66a','1.67a',
 '1.98a','1.98b','1.98c','1.98d','1.100-1','1.100-2','1.100-3','1.100-4'];
assert.deepEqual(Array.from(D.tasks,t=>t.id).sort(),required.sort(),'Exercise scope exactly matches submitted pages');
for(const task of D.tasks){
 assert(W.steps(task.id).length>=1,'Handwritten recipe missing: '+task.id);
 assert(G.render(task).includes('class="maths-graph-svg"'),'Task graph missing: '+task.id);
 for(const row of W.steps(task.id)){
  assert(W.rules.includes(row.rule),'Unknown calculation rule: '+task.id);
  assert(W.compare(row.expected,row).ok,'Invalid worked calculation: '+task.id+' / '+row.prompt);
 }
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
assert(host.includes("id:'mat',short:'AM'"),'Math must be a playable StudyVerse subject');
assert(html.includes("trainer.subjectId==='mat'?'MathsVerse'"),'MathsVerse must appear in live sidebar');
assert(shop.includes("id:'maths-hw-02'")&&shop.includes("id:'maths_avatar_pi'"),'MathsVerse must have its own cosmetic drop');
assert(sync.includes("'maths-hw-02':'mathsverse_hw02_v1'"),'Cloud snapshot must mirror MathsVerse progress');

const elements={'#app':{innerHTML:''},'#toast':{textContent:'',classList:{add(){},remove(){}}},'#math-entry':{value:''},'#boss-entry':{value:''},'#builder-entry':{value:''}};
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
assert(elements['#app'].innerHTML.includes('MINI-MATHCAD'),'Mini-Mathcad must be default worksheet');
assert(elements['#app'].innerHTML.includes('maths-graph-svg'),'Practice still shows function graph');
assert(!elements['#app'].innerHTML.includes('id="builder-entry"'),'Old rigid line input must be gone');
click('mode:understand');
assert(elements['#app'].innerHTML.includes('Die Rechnung nachvollziehen'),'Understand mode still shows explanations');
click('mode:builder');
assert(elements['#app'].innerHTML.includes('Freie Rechenfläche'),'Builder must be a free math sheet');
assert(!elements['#app'].innerHTML.includes('rule-select'),'No rule naming');
assert(elements['#app'].innerHTML.includes('MATHE-TASTATUR'),'Math keypad stays available');
assert.equal(K.apply('x',1,1,'square').value,'x^2','Power key');
assert.equal(K.apply('',0,0,'root').value,'sqrt()','Root key');
assert.equal(K.apply('x+1',0,3,'fraction').value,'(x+1)/()','Fraction template');
assert(K.pretty('<img src=x>').includes('&lt;img'),'Preview must escape HTML');
assert(!C.render([{id:'r1',x:5,y:20,text:'<img>',kind:'draft',step:null}],null,3,0,false,null).includes('value="<img>'),'Canvas must escape user input');
assert.equal(C.restore([{id:'r4',x:200,y:-500,text:'a'.repeat(300),kind:'draft'}])[0].text.length,240,'Saved text must be length-limited');
assert(C.position(150,200,{left:50,top:100,width:500}).x===20,'Click position must map to sheet coordinates');
const fakeSheet={getBoundingClientRect(){return {left:0,top:0,width:600,height:490}}};
const blankTarget={closest(selector){return selector==='.mathcad-sheet'?fakeSheet:null}};
handlers.click({target:blankTarget,clientX:90,clientY:90});
assert(elements['#app'].innerHTML.includes('id="pad-input-r1"'),'Clicking free paper must spawn a math input at that position');
assert.equal(saved().worksheets['1.55a'][0].x,15,'Region must preserve where it was clicked');
function enterPad(id,value){
 handlers.input({target:{id:'pad-input-'+id,dataset:{padInput:id},value}});
}
function freshPad(){
 const entries=saved().worksheets['1.55a'];
 const result=entries.find(x=>x.kind==='draft');
 assert(result,'Expected an editable new calculation region');
 return result.id;
}
enterPad('r1','x^3');click('pad-check:r1');
assert.equal(saved().worksheets['1.55a'][0].text,'x^3','Incorrect calculation must remain editable');
assert.equal(saved().worksheets['1.55a'][0].kind,'draft','Incorrect calculation cannot be marked correct');
const rows=W.steps('1.55a');
enterPad('r1',rows[0].expected);click('pad-check:r1');
assert.equal(saved().worksheets['1.55a'][0].kind,'checked','Right next line becomes a checked worksheet card');
assert(elements['#app'].innerHTML.includes('✓ Schritt 1'),'Accepted calculation stays in its original position');
for(let i=1;i<rows.length;i++){
 const id=freshPad();enterPad(id,rows[i].expected);click('pad-check:'+id);
}
const lastId=freshPad();
enterPad(lastId,'x^4-1.5*x^2+x+C');click('pad-result:'+lastId);
assert(saved().solved['q1.55a'],'A correct result in any math region must save progress and award XP');
assert(saved().worksheets['1.55a'].some(x=>x.kind==='result'),'Worksheet must retain submitted result');
const before=saved().xp;
click('train:1.55a');
assert(elements['#app'].innerHTML.includes('Aufgabe erfolgreich selbst gerechnet'),'Returning to a solved task restores the worksheet');
click('pad-add');
const repeat=saved().worksheets['1.55a'].find(x=>x.kind==='draft');
enterPad(repeat.id,'x^4-1.5*x^2+x');click('pad-result:'+repeat.id);
assert.equal(saved().xp,before,'A repeat of the correct answer must never farm XP');
click('train:1.98a');click('mode:test');
assert(elements['#app'].innerHTML.includes('Nur die Angabe'),'Exam mode should not provide method choices');
assert(!elements['#app'].innerHTML.includes('id="rule-select"'),'Exam mode must hide builder controls');
assert(!G.render(D.tasks.find(t=>t.id==='1.66a'),true).includes('<polygon'),'Exam graphs must not disclose shaded answers');
assert(!G.render(D.tasks.find(t=>t.id==='1.100-4'),true).includes('14,41 s'),'Drone exam graph must not spoil the distance answer');

elements['#math-entry'].value='48';submit('answer-form');
assert(saved().solved['q1.98a'],'Exam mode must verify and reward self-written answers');
assert(G.render(D.tasks.find(t=>t.id==='1.66a')).includes('polygon'),'Area task must shade integral interval');
assert(G.render(D.tasks.find(t=>t.id==='1.67a')).includes('Schnittpunkten'),'Curve intersection task must show bounded area');
assert((G.render(D.tasks.find(t=>t.id==='1.100-4')).match(/maths-graph-svg/g)||[]).length===3,'Drone task must show acceleration, speed and distance');
assert(!elements['#app'].innerHTML.includes('class="token"'),'Keep standalone trainer wallet out of top header');
click('view:boss');let bossCount=0;
for(let i=0;i<10;i++){
 const task=D.tasks.find(t=>elements['#app'].innerHTML.includes(t.id.replace('1.100-','1.100 / ')+' · '+t.group));
 assert(task,'Boss task must be displayed at step '+i);
 elements['#boss-entry'].value=task.answer;
 submit('boss-form');click('boss-next');bossCount++;
}
assert.equal(bossCount,10);
assert.equal(saved().bestBoss,100,'Perfect boss result must be saved');
assert(elements['#app'].innerHTML.includes('100 %'),'Boss result displayed');
console.log('MATHSVERSE PASS: 18 task graphs, click-to-create Mini-Mathcad free sheet, editable steps, saved positions, safe math input, XP, exam mode and boss.');
