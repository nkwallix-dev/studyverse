// Sharpverse runtime, academic coverage, save, achievements and 100% PA boss regression tests.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dataJS=fs.readFileSync('public/pos/pa-01/data.js','utf8');
const appJS=fs.readFileSync('public/pos/pa-01/app.js','utf8');
const css=fs.readFileSync('public/pos/pa-01/style.css','utf8');
const html=fs.readFileSync('public/pos/pa-01/index.html','utf8');
new Function(dataJS);new Function(appJS);
assert(html.includes('src="app.js"')&&html.includes('src="../../shared/cloud-progress.js"'),'Sharpverse must load the trainer and shared cloud sync');
assert(css.includes('@media(max-width:520px)')&&css.includes('.writing-layout'),'Sharpverse needs responsive screens and a real writing trainer');
const w={};
vm.runInNewContext(dataJS,{window:w});
const D=w.SHARPVERSE_DATA;
assert.equal(D.name,'Sharpverse');
assert.equal(D.exam,'1. PA');
assert.equal(D.lessons.length,20);
assert.equal(D.challenges.length,44);
assert.equal(new Set(D.lessons.map(l=>l.id)).size,20,'Unique lesson IDs');
assert.equal(new Set(D.challenges.map(q=>q.id)).size,44,'Unique question IDs');
for(const l of D.lessons)assert(l.steps.length>=4&&l.code&&l.trap&&l.source,'Complete, grounded explanation required: '+l.id);
for(const q of D.challenges){
 assert.equal(q.answers.length,4,'Exactly four answer options: '+q.id);
 assert(Number.isInteger(q.right)&&q.right>=0&&q.right<4,'Correct answer index: '+q.id);
 assert(q.code&&q.explain&&q.source,'Self-contained question, explanation and source: '+q.id);
}
const poolQuestion=D.challenges.find(q=>q.id==='t21');
assert(poolQuestion&&poolQuestion.kind==='transfer'&&poolQuestion.title.includes('WPF-Bildverarbeitung'),
 'ThreadPool question must clearly describe a concrete WPF image-processing scenario');
assert.equal(poolQuestion.right,2,'ThreadPool solution must point to the Task/Dispatcher approach');
assert(poolQuestion.answers[2].includes('begrenzter Parallelität')&&poolQuestion.explain.includes('ThreadPool-Threads'),
 'ThreadPool answer must explain bounded parallelism, thread reuse and the Dispatcher');
assert(D.challenges.some(q=>q.source.includes('Drei Raucher EXTRA')),'Must cover Three Smokers EXTRA Extension');
assert(D.challenges.some(q=>q.source.includes('Kreuzung EXTRA')),'Must cover intersection EXTRA Extension');
const shop=fs.readFileSync('src/app/shop-items.ts','utf8');
const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const cloud=fs.readFileSync('public/shared/cloud-progress.js','utf8');
assert(registry.includes("id:'pos-pa-01'")&&registry.includes("saveKey:'sharpverse_pa01_v1'"),'Sharpverse registered as the third trainer');
assert(cloud.includes("'pos-pa-01':'sharpverse_pa01_v1'"),'Cloud sync includes Sharpverse');
assert(shop.includes("name:'Professor Spermann'")&&shop.includes("requirement:{metric:'boss',value:100}"),'Boss prestige requires 100%');
assert(shop.includes("name:'Pink Paradise'")&&shop.includes("name:'Solitaire Cascade'"),'Both requested banners in the shop');
assert(shop.includes("name:'Velvet Voltage'")&&shop.includes("name:'Scharfes Schaf'"),'Font and sheep avatar present');
assert(shop.includes("name:'Thread Sparks'")&&shop.includes("name:'Pulse Rings'"),'Both level-4/6 new effects present');

const elements={
 app:{innerHTML:''},
 toast:{textContent:'',classList:{add(){},remove(){}}}
};
const storage={},localStorage={
 getItem(key){return Object.hasOwn(storage,key)?storage[key]:null},
 setItem(key,value){storage[key]=String(value);},
 removeItem(key){delete storage[key]}
};
let cloudTouches=0;const listeners={};
const document={
 getElementById(id){return elements[id]||null},
 addEventListener(name,handler){listeners[name]=handler},
};
const window={SHARPVERSE_DATA:D,scrollTo(){},studyverseCloudTouch(){cloudTouches++}};
const ctx={document,window,localStorage,console,setTimeout(fn){return 1},clearTimeout(){}};
vm.runInNewContext(appJS,ctx);
assert(elements.app.innerHTML.includes('Code verstehen.')&&elements.app.innerHTML.includes('Threading-Labor'),'Dashboard must render on first load');
assert(typeof listeners.click==='function','User interactions must be wired');
function click(action){
 const target={closest(){return {getAttribute(){return action}}}};
 listeners.click({target});
}
function state(){return JSON.parse(storage.sharpverse_pa01_v1)}
click('view:academy');
assert(elements.app.innerHTML.includes('Vererbung &amp; Polymorphie'),'Academy must include beginner-friendly inheritance');
click('lesson:vs-setup');
assert(elements.app.innerHTML.includes('Solution'),'Visual Studio crash course must have real instructions');
click('done:vs-setup');
assert(state().courseDone['vs-setup']===true&&state().xp===35,'Completing a lesson awards XP only once');
click('lesson:vs-setup');click('done:vs-setup');
assert.equal(state().xp,35,'Lessons must never pay the same reward twice');
click('view:writing');
click('writing:inherit');
elements['writing-answer']={value:'class Car : Vehicle'};
click('check-writing');
assert(state().writingDone.inherit===true,'C# writing task must accept a valid inheritance declaration');
assert(state().solved.pinherit===true,'Writing trainer progress must be visible to Studyverse achievements');
click('view:code');
click('answer:c01:1');
assert(state().solved.dc01===true,'Code-Detective should save correct answers');
click('view:lab');
assert(elements.app.innerHTML.includes('Zwei Threads, ein Zähler'),'Race simulator must load');
click('race-next');click('race-next');click('race-next');click('race-next');
assert(elements.app.innerHTML.includes('Ein Update ist verloren'),'Race simulator must show lost update');
click('lab:deadlock');
assert(elements.app.innerHTML.includes('DEADLOCK MÖGLICH'),'Deadlock graph simulation must show failure');
click('deadlock:same');
assert(elements.app.innerHTML.includes('VERMIEDEN'),'Switching to same resource order must avoid deadlock');
click('lab:semaphore');
assert(elements.app.innerHTML.includes('SemaphoreSlim(2, 2)'),'Semaphore controls must run');
click('capacity-plus');
assert(elements.app.innerHTML.includes('SemaphoreSlim(3, 3)'),'Semaphore capacity is interactive');
// Every boss has 12 questions and exactly 3 correct answers in each slot.
// The correct button is discovered from the rendered text, not the JSON index.
const encode=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
for(let run=0;run<4;run++){
 click('view:boss');
 const histogram=[0,0,0,0];
 for(let i=0;i<12;i++){
  const q=D.challenges.find(x=>elements.app.innerHTML.includes(encode(x.title)));
  assert(q,'A unique complete Boss question should be displayed at step '+(i+1));
  const buttons=elements.app.innerHTML.split('data-action="boss-answer:').slice(1).map(fragment=>({
   index:Number(fragment.split('"')[0]),
   label:fragment.split('</span>')[1].split('</button>')[0]
  }));
  assert.equal(buttons.length,4,'Boss must show exactly four answer buttons for '+q.id);
  const correct=buttons.find(x=>x.label===encode(q.answers[q.right]));
  assert(correct,'Correct answer text must be available after option shuffling: '+q.id);
  histogram[correct.index]++;
  click('boss-answer:'+correct.index);
  click('boss-next');
 }
 assert.deepEqual(histogram,[3,3,3,3],'Every 12-question boss must balance A/B/C/D correctly (run '+run+')');
 assert.equal(state().bestBoss,100,'Correct displayed answers must give perfect 12/12 Boss');
 assert(elements.app.innerHTML.includes('Professor Spermann'),'Perfect result should announce title unlock');
}
assert(cloudTouches>=3,'Sharpverse must request shared account cloud sync after progress updates');
console.log('SHARPVERSE PASS: 20 lessons, 44 grounded questions, clearer ThreadPool exercise, balanced/shuffled boss answers, C# writing, threading labs, cloud saves and perfect Boss.');
