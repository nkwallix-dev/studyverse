'use strict';
/* MathsVerse is a read-only, detailed worked-solutions course:
   18 book exercises across 4 chapters; NO boss or quiz gameplay. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='public/maths/hw-02/';
const read=name=>fs.readFileSync(dir+name,'utf8');
const data=read('data.js'),engine=read('math-engine.js'),graphs=read('graphs.js'),
 lessons=read('solved-lessons.js'),merge=read('pdf-merge.js'),app=read('app.js'),page=read('index.html'),css=read('style.css');
for(const source of [data,engine,graphs,lessons,merge,app])new Function(source);
for(const file of ['data.js','math-engine.js','graphs.js','solved-lessons.js','pdf-merge.js','app.js','../../shared/cloud-progress.js','../../shared/verse-cosmetics.js'])
 assert(page.includes('src="'+file+'"'),'Required teaching module not loaded: '+file);
for(const removed of ['math-canvas.js','math-keyboard.js','workbook.js'])
 assert(!page.includes('src="'+removed+'"'),'Obsolete calculator/trainer module still loaded: '+removed);
assert(!page.includes('Prüfungssimulation'),'No boss should be advertised in MathsVerse page metadata.');
const bundle={};
for(const src of [data,engine,graphs,lessons,merge])vm.runInNewContext(src,{window:bundle,console});
const D=bundle.MATHSVERSE_DATA,E=bundle.MATHSVERSE_MATH,G=bundle.MATHSVERSE_GRAPHS,L=bundle.MATHSVERSE_SOLUTIONS,P=bundle.MATHSVERSE_PDF_MERGE;
P.install(L);
const pdfIds=['1.66a','1.67a','1.98a','1.98b','1.98c','1.98d','1.100-1','1.100-2','1.100-3','1.100-4'];
assert.deepEqual(Array.from(P.ids).sort(),pdfIds.sort(),'Exactly ten overlapping PDF-backed textbook tasks');
assert.equal(D.tasks.filter(t=>!P.ids.includes(t.id)).length,8,'The remaining MathsVerse tasks must be preserved');
for(const id of pdfIds){const l=L.get(id);assert(l.pdf?.pages&&l.pdf.memo,'PDF method and page missing: '+id)}
for(const id of ['1.55a','1.55b','1.56a','1.56b','1.57a','1.57b','1.58a','1.58b'])assert(!L.get(id).pdf,'Non-overlapping task should not be attributed to PDF: '+id);
assert(L.get('1.66a').steps.some(s=>s.math.includes('F(−3)')&&s.math.includes('−27/3')),'The PDF explicitly calculates the first negative-limit substitution');
assert(L.get('1.67a').steps.some(s=>s.math.includes('p = −6, q = −1')),'PDF uses the small p-q formula');
assert(L.get('1.67a').steps.some(s=>s.math.includes('f(0)')&&s.math.includes('g(0)')),'PDF tests which curve is above at x=0');
assert(L.get('1.67a').steps.some(s=>s.math.includes('D(6,162)')),'PDF substitutes rounded intersection upper bound');
assert(L.get('1.98c').steps.some(s=>s.math.includes('14,620')),'PDF evaluates roots to numeric intermediate values');
assert(L.get('1.100-4').steps.some(s=>s.math.includes('s(14)'))&&L.get('1.100-4').steps.some(s=>s.math.includes('s(14,5)'))&&L.get('1.100-4').steps.some(s=>s.math.includes('s(14,4)')),'Keep PDF numerical trials for drone 200m problem');
assert.equal(D.exam,'2. Hausübungswiederholung');
assert.equal(D.tasks.length,18);
assert.equal(new Set(D.tasks.map(t=>t.id)).size,18);
assert.equal(D.groups.length,4);
assert.deepEqual(Array.from(D.groups,g=>D.tasks.filter(t=>t.group===g.name).length),[6,6,2,4]);
const required=['1.55a','1.55b','1.56a','1.56b','1.57a','1.57b','1.58a','1.58b','1.66a','1.67a',
 '1.98a','1.98b','1.98c','1.98d','1.100-1','1.100-2','1.100-3','1.100-4'];
assert.deepEqual(Array.from(D.tasks,t=>t.id).sort(),required.sort(),'Only the assigned 18 textbook subproblems');
assert.deepEqual(Object.keys(L.worked).sort(),required.sort(),'Every exercise needs its own detailed guide');
for(const task of D.tasks){
 const l=L.get(task.id);
 assert(l,'Missing explanation: '+task.id);
 assert(l.lead.length>=65,'Too little introduction: '+task.id);
 assert(l.steps.length>=5,'Not enough worked calculation steps: '+task.id);
 for(const step of l.steps){
  assert(step.heading.length>=6,'No meaningful heading: '+task.id);
  assert(step.math.length>=5,'No calculation or mathematical condition shown: '+task.id);
  assert(step.why.length>=65,'Must explain HOW and WHY each calculation works: '+task.id+' '+step.heading);
 }
 assert(l.result.length>=8,'Missing final answer: '+task.id);
 assert(l.note.length>=55,'Missing pitfall/understanding note: '+task.id);
 assert(E.check(task,task.answer).ok,'Official result must check correctly: '+task.id);
}
for(const id of ['1.57b','1.66a','1.67a','1.98a','1.100-4'])
 assert(G.render(D.tasks.find(t=>t.id===id)).includes('maths-graph-svg'),'Helpful graph missing for '+id);
assert(L.get('1.66a').steps.some(x=>x.math.includes('98/3')),'Area across the x-axis must sum the absolute values');
assert(L.get('1.67a').steps.some(x=>x.math.includes('√10')),'Curve intersections must show exact bounds');
assert(L.get('1.100-4').steps.some(x=>x.math.includes('200')),'Drone lesson must solve the actual distance condition');
assert(L.get('1.55a').result.includes('+ x + C'),'Antiderivative must preserve the positive +x');

const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const host=fs.readFileSync('src/app/app.ts','utf8');
const shop=fs.readFileSync('src/app/shop-items.ts','utf8');
const sync=fs.readFileSync('public/shared/cloud-progress.js','utf8');
assert(registry.includes("id:'maths-hw-02',subjectId:'mat'")&&registry.includes("saveKey:'mathsverse_hw02_v1'"),'Keep StudyVerse registered learning subject');
assert(registry.includes("4 ausführliche Lernkapitel"),'StudyVerse must describe course accurately');
assert(!registry.includes("title:'Mathe-Endgegner'"),'Remove MathsVerse boss achievement');
assert(host.includes("id:'mat',short:'AM'"),'MathsVerse remains available as a StudyVerse subject');
assert(shop.includes("id:'maths-hw-02'")&&shop.includes("id:'maths_avatar_pi'"),'Existing math cosmetics are preserved');
assert(sync.includes("'maths-hw-02':'mathsverse_hw02_v1'"),'Keep the same cloud save key');
const elements={'#app':{innerHTML:''}},handlers={},storage={mathsverse_hw02_v1:JSON.stringify({xp:185,coins:34,solved:{q1:true},earned:{},learned:{}})};
const browser={
 window:bundle,localStorage:{getItem(k){return storage[k]||null},setItem(k,v){storage[k]=String(v)}},
 document:{querySelector(sel){return elements[sel]||null},addEventListener(type,fn){handlers[type]=fn}},
 location:{search:''},URLSearchParams,console
};
vm.runInNewContext(app,browser);
const render=()=>elements['#app'].innerHTML;
assert(render().includes('Stammfunktionen'),'First chapter should open immediately, not a game dashboard');
assert(render().includes('Vollständiger Rechenweg'),'Each task must show worked solutions');
assert(render().includes('BUCHBEISPIEL 1.55a'),'Original exercise IDs must be visible');
assert(!render().includes('Bosskampf')&&!render().includes('data-action="view:boss"'),'No boss content');
assert(!render().includes('data-action="train:')&&!render().includes('builder-entry'),'No arithmetic trainer');
assert(!render().includes('mathcad-sheet')&&!render().includes('answer-form'),'No Mini-Mathcad or multiple-choice quiz');
function clickChapter(i){
 handlers.click({target:{closest(sel){return sel==='[data-chapter]'?{dataset:{chapter:String(i)}}:null}}});
}
function readChapter(){
 handlers.click({target:{closest(sel){return sel==='[data-read-chapter]'?{dataset:{readChapter:'0'}}:null}}});
}
for(let i=0;i<D.groups.length;i++){
 clickChapter(i);
 assert(render().includes(D.groups[i].name),'Must navigate to chapter '+i);
 const number=(render().match(/class="solved-example"/g)||[]).length;
 assert.equal(number,[6,6,2,4][i],'Every chapter must display all fully worked exercises');
 const headings=(render().match(/Vollständiger Rechenweg/g)||[]).length;
 assert.equal(headings,number,'Each example needs a complete worked sequence');
 assert(render().includes('AUFGABENSTELLUNG'),'Original task remains visible');
 assert(render().includes('DARAUF ACHTEN')||render().includes('Darauf achten'),'Each example needs a cautionary note');
 if(i===2){assert(render().includes('Schnittpunkte')&&render().includes('maths-graph-svg'),'Area chapter must show intersection graph');assert(render().includes('MIT DER HÜ-WIEDERHOLUNGS-PDF ABGEGLICHEN'),'PDF matched area tasks must be labelled clearly')}
 if(i===0)assert(render().includes('Zusätzliches MathsVerse-Beispiel'),'Non-PDF tasks must be distinguishable from PDF-supported tasks');
 readChapter();
}
const saved=JSON.parse(storage.mathsverse_hw02_v1);
assert.equal(saved.xp,185,'Previous XP remains untouched');
assert.equal(saved.coins,34,'Previous coins remain untouched');
assert.equal(saved.solved.q1,true,'Previous task progress remains untouched');
assert(D.groups.every(g=>saved.learned[g.name]),'Reading progress can be marked for all four chapters');
assert(css.includes('@media(max-width:520px)')&&css.includes('.solved-step'),'Solution cards must be responsive');
const questions=fs.readFileSync('public/dsai/test-01/questions.js','utf8'),dsai={};
vm.runInNewContext(questions,{window:dsai});
const q93=dsai.DSAI_QUESTIONS.find(q=>q.id==='q93');
assert(q93&&q93.question.includes('Jobtitel'),'Preserve the teammate question');
assert(!q93.code||!q93.code.includes('nunique()'),'DSAIVerse must not reveal the answer above its own quiz');
assert(q93.choices[q93.answer]==='nunique()','Correct pandas method remains nunique()');
console.log('MATHSVERSE PASS: 10 PDF-matched thorough calculation methods + 8 other original lessons, all 18 graph-safe, cloud-save safe, no boss/quiz.');
