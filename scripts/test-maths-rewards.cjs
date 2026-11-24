'use strict';
/* MathsVerse reward regression: completed printed exercises, official descriptors,
 * migration from legacy saves, and no stale quiz/draw cosmetic unlocks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const read=p=>fs.readFileSync(p,'utf8');
const box={window:{},document:{getElementById(){return {value:answer}}}};
let answer='';
for(const path of ['public/maths/sa-01/book-bank.js','public/maths/sa-01/book-groups.js',
 'public/maths/sa-01/pool-bank.js','public/maths/sa-01/sa1-scope-bank.js','public/maths/sa-01/source-trainer.js'])
 vm.runInNewContext(read(path),box,{filename:path});
const source=box.window.MATHS_SOURCE_TRAINER,groups=source.GROUPS,pool=source.POOL;
assert(groups.length>=20&&pool.length>=20,'Current verified MathsVerse banks must load');
const state={solved:{},earned:{},bookCompleted:{},descriptorCompleted:{}};
const paid=[];
const api={view:'book',state,save(){},navigate(){},reward(id,xp,tt){
 if(state.earned[id])return false;state.earned[id]=true;paid.push({id,xp,tt});return true;
}};
const choose=(action)=>source.handle(action,api);
const key=q=>'n'+q.id.replace(/[^a-z0-9-]/gi,'_');
const book=groups.find(g=>g.number==='1.80');
assert(book&&book.steps.length===2,'Original 1.80 must retain two grouped steps');
function solveStep(q){
 answer=Number.isFinite(q.expected)?String(q.expected):'Eigener Lösungsweg auf Papier';
 choose('source:step:'+q.id);
 choose('source:submit');
 if(!Number.isFinite(q.expected))choose('source:self-right');
}
choose('source:open:'+book.id);
solveStep(book.steps[1]);
assert.equal(!!state.bookCompleted[book.id],false,'Last step alone is not a finished book example');
assert.equal(paid.length,0,'No XP for one isolated last step');
solveStep(book.steps[0]);
assert.equal(!!state.bookCompleted[book.id],false,'Finishing an earlier step must not silently complete the book example');
assert.equal(paid.length,0,'No XP before correct final-step confirmation');
solveStep(book.steps[1]);
assert.equal(state.bookCompleted[book.id],true,'Last step + all preceding steps completes exactly one printed example');
assert.equal(paid.length,1,'Completed book example earns one (not per-step) payout');
assert.deepEqual([paid[0].xp,paid[0].tt],[50,25]);
solveStep(book.steps[1]);
assert.equal(paid.length,1,'Repeating solved last step must not re-award rewards');
assert(source.browser('book',state).includes('Buchbeispiele vollständig abgeschlossen'),
 'Book completion indicator must show full examples, not per-subpart counts');

const numeric=groups.find(g=>g.steps.length===1&&Number.isFinite(g.steps[0].expected)&&g.id!==book.id);
assert(numeric,'At least one numeric book exercise must be available');
choose('source:open:'+numeric.id);
choose('source:step:'+numeric.steps[0].id);
answer=String(numeric.steps[0].expected+1000);
choose('source:submit');
choose('source:self-right'); // A wrong known number must not be overridable by a self-grade.
assert.equal(!!state.bookCompleted[numeric.id],false,'Wrong numeric answer cannot be self-certified');
answer=String(numeric.steps[0].expected);
choose('source:submit');
assert.equal(state.bookCompleted[numeric.id],true,'Correct numeric result completes a one-step example');

api.view='pool';
const official=pool[0];
choose('source:open:'+official.id);
choose('source:pool-complete');
assert.equal(!!state.descriptorCompleted[official.id],false,'One-click descriptor completion must be blocked');
choose('source:pool-check');
choose('source:pool-complete');
assert.equal(state.descriptorCompleted[official.id],true,'Official solution comparison + self-confirmation counts');
const paidAfterPool=paid.length;
choose('source:pool-complete');
assert.equal(paid.length,paidAfterPool,'Official exercise can only pay once');
assert(source.browser('pool',state).includes('Deskriptor-Aufgaben nach Lösungsvergleich'),
 'Descriptor completion indicator must be explicit');

const old={solved:{},earned:{},courseDone:{x:true},bookCompleted:{},descriptorCompleted:{}};
for(const q of book.steps)old.solved[key(q)]=true;
old.solved['q'+official.id.replace(/[^a-z0-9-]/gi,'_')]=true;
assert.equal(source.migrateProgress(old),true,'Existing MathsVerse save gets a one-time migration');
assert.equal(old.bookCompleted[book.id],true,'Previously finished book example stays completed');
assert.equal(old.descriptorCompleted[official.id],true,'Previously solved official descriptor stays completed');
assert.equal(source.migrateProgress(old),false,'Migration never repeats');
assert.equal(old.mathsProgressVersion,1);

function tsModule(path){
 const mod={exports:{}};
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(js,{exports:mod.exports,module:mod,console},{filename:path});
 return mod.exports;
}
const {SHOP_ITEMS}=tsModule('src/app/shop-items.ts');
const {TRAINERS,mathsProgress,achievementValue}=tsModule('src/app/trainer-registry.ts');
const items=SHOP_ITEMS.filter(x=>x.drop==='maths-sa-01');
assert.equal(items.length,14,'All current MathsVerse cosmetics must stay in the catalog');
const allowed=['academy','book','descriptor','boss'];
for(const item of items)assert(allowed.includes(item.requirement?.metric),
 'Obsolete MathsVerse requirement '+item.id+': '+item.requirement?.metric);
const title=items.find(i=>i.id==='maths_boss_title');
assert.equal(title.requirement.metric,'boss');
assert.equal(title.requirement.value,100,'Professor Filipp remains exclusively 100% boss');
assert.equal(items.find(i=>i.id==='maths_avatar_pi').requirement.metric,'academy',
 'Preexisting item IDs still have updated learning goals');
const stale={solved:{q1:true,q17:true,nold_math_task:true},earned:{},courseDone:{},bookCompleted:{},descriptorCompleted:{},bestBoss:99};
assert.equal(mathsProgress(stale,'book'),0,'Old quiz/numeric task keys must not unlock books');
assert.equal(mathsProgress(stale,'descriptor'),0,'Old quiz keys must not unlock descriptors');
assert.equal(mathsProgress(stale,'boss'),99);
assert.equal(mathsProgress(old,'book'),1);
assert.equal(mathsProgress(old,'descriptor'),1);
const achievements=TRAINERS.find(x=>x.id==='maths-sa-01').achievements;
assert.equal(achievements.length,10);
for(const a of achievements)assert(allowed.includes(a.metric),'Maths achievement must use a live learning mode');
assert(achievements.some(a=>a.metric==='book'&&achievementValue(a,old)===1));
assert(achievements.some(a=>a.metric==='descriptor'&&achievementValue(a,old)===1));
assert(achievements.some(a=>a.metric==='boss'&&a.target===100&&a.title==='Professor Filipp'));
for(const oldId of ['firstquiz','quiz15','quiz40','numeric1','numeric10'])
 assert(achievements.some(x=>x.id===oldId),'Achievement claim IDs must be stable to prevent duplicate TT');
const app=read('src/app/app.ts');
assert(app.includes("if(drop==='maths-sa-01')")&&app.includes('return mathsProgress(save,metric)'),
 'Shop must use the same MathsVerse counters as the achievement system');
console.log('PASS: MathsVerse rewards, migration, exact book completion, official descriptor confirmation, and 100% boss.');
