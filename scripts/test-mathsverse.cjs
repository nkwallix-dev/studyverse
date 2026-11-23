'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const registry=read('src/app/trainer-registry.ts'),shop=read('src/app/shop-items.ts');
const app=read('src/app/app.ts'),html=read('src/app/app.html');
const cosmetics=read('public/shared/verse-cosmetics.js'),legacy=read('src/app/legacy-owned-items.ts');
const mhtml=read('public/maths/sa-01/index.html'),mjs=read('public/maths/sa-01/app.js');
const mcss=read('public/maths/sa-01/style.css');
const sandbox={window:{}};vm.runInNewContext(read('public/maths/sa-01/data.js'),sandbox);
const d=sandbox.window.MATHS_DATA;
assert.equal(d.lessons.length,11);
assert.equal(d.questions.length,40);
assert.equal(d.numeric.length,14);
assert.equal(new Set(d.questions.map(x=>x.id)).size,40);
assert.equal(new Set(d.numeric.map(x=>x.id)).size,14);
for(const l of d.lessons){assert.ok(l.check&&l.check.options[l.check.correct]);assert.ok(l.steps.length>=3)}
for(const q of d.questions){assert.ok(d.lessons.some(l=>l.id===q.topic));assert.ok(q.options[q.answer],q.id)}
for(const q of d.numeric){assert.ok(d.lessons.some(l=>l.id===q.topic));assert.ok(Number.isFinite(q.expected),q.id)}
assert(registry.includes("id:'maths-sa-01'"),'trainer activated');
assert(registry.includes("saveKey:'mathsverse_sa01_v1'"),'trainer save key');
assert(registry.includes("path:'maths/sa-01/index.html'"));
assert(shop.includes("id:'maths-sa-01'"),'shop drop');
const ids=[...shop.matchAll(/id:'(maths_[a-z0-9_]+)'/g)].map(x=>x[1]);
assert.equal(ids.length,14,'14 MathsVerse cosmetics');
assert.equal(new Set(ids).size,14);
for(const old of ['maths_avatar_pi','maths_title_integral']){assert(ids.includes(old));assert(!legacy.includes("id:'"+old+"'"),'old cosmetics must not double render')}
const groups=[...shop.matchAll(/\{id:'maths_[^']+',kind:'[^']+',icon:'[^']+',name:'[^']+',desc:'[^']+',group:'([^']+)'/g)].map(m=>m[1]);
for(const g of ['theme','atm','frame','avatar','title','font','banner','fx']){
 const n=groups.filter(x=>x===g).length;assert(n>=1&&n<=2,g+' count='+n);
}
assert(app.includes("drop==='maths-sa-01'?'n':'d'"),'numeric handwork metric');
assert(app.includes("id:'mat',short:'AM'"));
assert(html.includes('[disabled]="!subjectHasTrainer(s.id)"'));
assert(mhtml.includes('../../shared/verse-cosmetics.js'));
assert(mhtml.includes('../../shared/cloud-progress.js'));
assert(mcss.includes('#143727'));
assert(mjs.includes("state.solved[q.id]=true"));
assert(cosmetics.includes("maths_avatar_pi: 'maths_pi_fox.svg'"));
assert(!fs.existsSync('public/maths/hw-02/index.html'),'retired homework still absent');
console.log('PASS: MathsVerse SA1 source content, IDs, green skin, bridge, shop and compatibility.');
