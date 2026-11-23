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
for(const l of d.lessons){assert.ok(l.check&&l.check.a[l.check.correct]);assert.ok(l.steps.length>=3)}
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
assert(mcss.includes('--bg:#102c1f')&&mcss.includes('--card:#204c32'),'Default MathsVerse must use dark emerald instead of white');
assert(mcss.includes('body[data-theme="cosmic"]{--ink:#f5f1ff'),'Galaxy must keep light text on dark blue');
const navMarkup=mhtml.slice(mhtml.indexOf('<nav id="nav"'),mhtml.indexOf('</nav>'));
const endgameMarkup=mhtml.slice(mhtml.indexOf('<div class="verse-endgame">'),mhtml.indexOf('</aside>'));
assert(!navMarkup.includes('data-nav="sources"'),'Sources should be under Endgame, not academy');
assert(endgameMarkup.indexOf('data-nav="boss"')<endgameMarkup.indexOf('data-nav="sources"'),'Endgame must end with Boss then Quellen');
assert(endgameMarkup.includes('>Quellen</span>'),'Sources should have a readable label');
assert(!mhtml.includes('NO GALAXY. JUST MATH.')&&!mhtml.includes('sidebar-foot'),'Remove unrequested footer');
assert(!mcss.includes('.sidebar-foot'),'Removed footer must not leave dead styles');
assert(!mcss.includes('.hero{background:linear-gradient(115deg,var(--side),var(--card2))'),'Equipped themes and banners must retain their hero backgrounds');
assert(mjs.includes("state.solved[q.id]=true"));
assert(cosmetics.includes("maths_avatar_pi: 'maths_pi_fox.svg'"));
assert(!fs.existsSync('public/maths/hw-02/index.html'),'retired homework still absent');
const appHtml=read('src/app/app.html');
const trainerRegistry=read('src/app/trainer-registry.ts');
const sharedCosmetics=read('public/shared/verse-cosmetics.js');
assert(mjs.includes('boss:()=>SOURCE.intro(state)')&&mjs.includes('bossrun:()=>SOURCE.run()'),'Exam route uses source-first 10+10 simulation');
assert(mjs.includes('Stift und Papier bereitlegen'),'Handwork must instruct users to calculate on paper');
assert(mjs.includes("['hand','✎ Nur Handrechnen']"),'Hand calculation questions must be directly selectable');
assert(mjs.includes('id="topicSelect"'),'Compact practice topic selector must be present');
assert(shop.includes("name:'Professor Filipp'"),'100% title must be Professor Filipp');
assert(trainerRegistry.includes("title:'Professor Filipp'"),'Achievement title must match boss title');
assert(sharedCosmetics.includes("maths_boss_title:'Professor Filipp'"),'Equipped titles must update without changing saved item IDs');
assert(shop.includes("name:'Pi-Fuchs',desc:'Ein schlauer Mathe-Fuchs"),'Pi-Fuchs description must not claim a past owner');
assert(shop.includes("name:'Integral-Genie',desc:'Für alle"),'Integral title description must not claim past ownership');
assert(appHtml.includes("item.group !== 'avatar' && item.group !== 'title'"),'Avatar and title previews must not use before/after slider');
assert(appHtml.includes('previewDropLabel(item.drop)'),'Drops must be labeled by universe');
assert(app.includes("'maths-sa-01':'MATHSVERSE DROP'"),'MathsVerse previews must display their own collection name');
assert(read('src/styles.scss').includes('linear-gradient(125deg,#351157'),'Toxic Neon global theme must use purple and green');
assert(read('public/shared/verse-cosmetics.css').includes('linear-gradient(130deg,#31164f'),'Toxic Neon in trainers must use purple and green');
const bookJs=read('public/maths/sa-01/book-bank.js');
const poolJs=read('public/maths/sa-01/pool-bank.js');
const sourceJs=read('public/maths/sa-01/source-trainer.js');
vm.runInNewContext(bookJs,sandbox);vm.runInNewContext(poolJs,sandbox);
const book=sandbox.window.MATHS_BOOK_BANK,pool=sandbox.window.MATHS_POOL_BANK;
assert(book.length>=80,'Textbook ZIP must produce >80 specific sourced tasks');
assert.equal(pool.length,50,'Descriptor 4 bank must contain 50 real source IDs');
assert.equal(new Set(book.map(q=>q.number)).size,book.length,'Do not repeat textbook tasks');
assert.equal(new Set(pool.map(q=>q.number)).size,pool.length,'Do not repeat official task IDs');
for(const q of book){assert(q.prompt&&q.solution&&q.steps,'Book tasks need exact prompt and explained answer');if(q.expected!=null)assert(Number.isFinite(q.expected),'Book numeric result must be finite')}
for(const q of pool){assert(q.source.startsWith('https://')&&q.number,'Every pool task must link to its original source');assert(!/^4[.]7(?:\\D|$)/.test(q.descriptor),'Excluded descriptor 4.7 must not appear');if(q.expected!=null)assert(Number.isFinite(q.expected))}
assert(sourceJs.includes('shuffle(BOOK).slice(0,10)'),'Book half of boss is random 10');
assert(sourceJs.includes('shuffle(POOL).slice(0,10)'),'Official half of boss is random 10');
assert(sourceJs.includes('api.reward')||sourceJs.includes('api.state.bestBoss'),'Exam result must be recorded');
assert(mhtml.includes('data-nav="book"')&&mhtml.includes('data-nav="pool"'),'There must be two separate catalog tabs');
assert(!mhtml.includes('data-nav="practice"'),'Synthetic practice must not be in the navigation');
for(const name of ['book-bank.js','pool-bank.js','source-trainer.js','source-trainer.css'])assert(mhtml.includes(name),'Missing source trainer asset '+name);
assert(mjs.includes('SOURCE.browser(\'book\',state)')&&mjs.includes('SOURCE.browser(\'pool\',state)'),'Original catalogs must render via app');
assert(sourceJs.includes('Stift und Papier')&&sourceJs.includes('Lösung anzeigen'),'Paper instructions and reveal button required');
console.log('PASS: MathsVerse 84 original book tasks, 50 sourced SRDP tasks, 10+10 exam, safe progress and cosmetics.');
