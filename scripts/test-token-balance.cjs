'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const read=path=>fs.readFileSync(path,'utf8');
function moduleExports(path){
 const m={exports:{}};
 vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
  {module:m,exports:m.exports});
 return m.exports;
}
const {SHOP_ITEMS,itemPrice}=moduleExports('src/app/shop-items.ts');
const {TRAINERS}=moduleExports('src/app/trainer-registry.ts');
const prices={};
for(const item of SHOP_ITEMS){
 assert.equal(item.cost,itemPrice(item),'Shared price rule: '+item.id);
 assert.equal(item.cost%100,0,'Shop prices use 100-TT steps: '+item.id);
 prices[item.drop]=(prices[item.drop]||0)+item.cost;
}
assert.equal(SHOP_ITEMS.find(i=>i.id==='cosmic').cost,1000);
const achievements=Object.fromEntries(TRAINERS.map(t=>[t.id,t.achievements.reduce((n,a)=>n+a.reward,0)]));
for(const trainer of TRAINERS)for(const a of trainer.achievements)
 assert.equal(a.reward%100,0,'Achievement payout uses 100-TT steps: '+a.id);

function amount(source,pattern){const m=source.match(pattern);assert(m,'Missing payout: '+pattern);return Number(m[1]);}
const dsai=read('public/dsai/test-01/app.js');
const box={window:{}};
vm.runInNewContext(read('public/dsai/test-01/data.js')+'\n'+read('public/dsai/test-01/questions.js'),box);
const d=box.window.DSAI_CONTENT,q=box.window.DSAI_QUESTIONS;
const dsaiOnce=d.lessons.length*amount(dsai,/s\.coins\+=([0-9]+);store\(\);toast\("🎓 Lektion/)
 +q.length*amount(dsai,/payFirst\(id,13,([0-9]+)\)/)
 +q.filter(x=>x.code).length*amount(dsai,/payFirst\(id,20,([0-9]+)\);\s*if\(run.mode==="sorter"/)
 +d.sort.length*amount(dsai,/payFirst\(id,15,([0-9]+)\)/)
 +d.pipelines.length*amount(dsai,/payFirst\("p"\+p.id,55,([0-9]+)\)/)
 +12*amount(dsai,/if\(run.mode==="forecast"\)payFirst\(id,20,([0-9]+)\)/)
 +amount(dsai,/payFirst\("boss70",150,([0-9]+)\)/);

const sharp=read('public/pos/pa-01/app.js'),sharpBox={window:{}};
vm.runInNewContext(read('public/pos/pa-01/data.js'),sharpBox);
const sd=sharpBox.window.SHARPVERSE_DATA;
const sharpOnce=sd.lessons.length*amount(sharp,/reward\('lesson:'\+id,35,([0-9]+)\)/)
 +sd.challenges.length*amount(sharp,/reward\('question:'\+id,24,([0-9]+)\)/)
 +8*amount(sharp,/reward\('writing:'\+task.id,40,([0-9]+)\)/)
 +amount(sharp,/reward\('boss80',150,([0-9]+)\)/);

const chem=read('public/nawi/test-01/index.html');
const chemData=vm.runInNewContext(chem.slice(chem.indexOf('const SRC='),chem.indexOf('const SHOP='))+
 ';({TOPICS,QUIZ,FLASH,NAMES,REACTIONS})');
const drawings=vm.runInNewContext(chem.slice(chem.indexOf('const VALENCE='),chem.indexOf('function draw',chem.indexOf('const DRAW_TASKS=')))+';DRAW_TASKS');
const lessons=vm.runInNewContext(chem.slice(chem.indexOf('const LEARNPATH ='),chem.indexOf('const MUST_LESSONS='))+';LEARNPATH');
const chemPay=vm.runInNewContext(chem.slice(chem.indexOf('function tokenReward('),chem.indexOf('function reward('))+';tokenReward');
const core=lessons.filter(l=>l.priority!=='Optional');
const ids=[...core.flatMap(l=>['course_complete_'+l.id,...l.tasks.map((_,j)=>'course_answer_'+l.id+'_'+j)]),
 ...chemData.TOPICS.filter(t=>t.id!=='orb').map(t=>'learn_'+t.id),
 ...chemData.QUIZ.map(q=>q.id),...chemData.FLASH.map(c=>'flash_'+c.id),
 ...chemData.NAMES.map(n=>n.id),...drawings.map(d=>d.id),...chemData.REACTIONS.map(r=>r.id),
 'iso_pentan','iso_ez_Z','iso_ez_E','iso_siede','boss80'];
assert.equal(new Set(ids).size,ids.length,'One-time Chemverse reward IDs must be unique');
const chemOnce=ids.reduce((n,id)=>n+chemPay(id),0);
assert.equal(chemPay('boss50'),0,'50% boss milestone cannot mint bonus TT');
assert.equal(chemPay('course_complete_orbitalextra'),0,'Optional lessons cannot exceed the Verse budget');
assert.equal(chemPay('o0'),0,'Optional orbital tasks cannot exceed the Verse budget');
for(const [drop,once] of [['nawi-test-01',chemOnce],['dsai-test-01',dsaiOnce],['pos-pa-01',sharpOnce]]){
 assert.equal(once+achievements[drop],prices[drop],`${drop}: once-only earnings must buy its entire catalog`);
 console.log(`${drop}: ${once} tasks + ${achievements[drop]} achievements = ${prices[drop]} TT shop`);
}
const daily=read('public/daily/app.js');
assert(daily.includes('addTT(10,"Tagesquiz')&&daily.includes('addTT(100,"Tagesboss'));
assert(chem.includes('DAILY_QUIZ_TOKENS=10, DAILY_BOSS_TOKENS=100'));
assert(dsai.includes('s.coins+=10;store()')&&dsai.includes('s.coins+=100;store()'));
console.log('Daily shared cap: 20 × 10 + 100 = 300 TT.');
