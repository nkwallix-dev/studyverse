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

const original=new Map(book.map(q=>[q.number,q]));
const approx=(actual,expected,id)=>assert(Math.abs(actual-expected)<1e-8,id+' value incorrect: '+actual+' expected '+expected);
for(const [number,page] of [['1.1a',1],['1.11a',2],['1.18a',3],['1.21',4],['1.31',6],['1.55a',7],['1.57c',7],['1.67c',8],['1.73b',9],['1.82d',11],['1.98d',13],['2.24a',14],['2.36a',15]]){
 assert.equal(original.get(number)?.originalScreenshot,page,number+' must cite the actual screenshot in the provided ZIP');
}
assert(original.get('1.12a').graph.kind==='book-distance-time'&&original.get('1.12b').graph.kind==='book-distance-time'&&original.get('1.12d').graph.kind==='book-distance-time','1.12 variants use the real distance-time diagram instead of a made-up graph');
assert(sourceJs.includes('book-original-graph'),'Source graph must be an accurately labelled diagram');
assert(original.get('1.18a').prompt.includes('110 GE'),'Sessel variable costs are part of original 1.18');
assert(original.get('1.21').prompt.includes('W(−1|0,5)'),'Wendepunkt must use original ordinate 0.5');
assert(original.get('1.55a').prompt.includes('4x³'),'1.55a contains a cubic power');
assert(original.get('1.55c').prompt.includes('2/x'),'1.55c is 2/x, not x/2');
assert(original.get('1.56a').prompt.includes('3/x³')&&original.get('1.56a').prompt.includes('³√x'),'1.56a has original fraction and cube root');
assert(original.get('1.58b').prompt.includes('π/2'),'1.58b angle is pi/2');
assert(original.get('1.60c').prompt.includes('3π/2'),'1.60c upper integration limit is 3pi/2');
approx(original.get('1.57c').expected,16/3,'1.57c');
approx(original.get('1.60c').expected,2,'1.60c');
approx(original.get('1.67c').expected,1/24,'1.67c');
approx(original.get('1.31').expected,15,'1.31');
approx(original.get('1.32a').expected,100/Math.PI,'1.32a');
approx(original.get('1.73b').expected,17.64,'1.73b');
approx(original.get('1.76a').expected,96/(Math.PI*Math.PI),'1.76a');
assert(original.get('2.37').solution.includes('Anna hat recht'),'2.37 must match calculator screenshot analysis');
assert(book.length>=160,'Book task bank should retain the verified expansions from screenshots');

assert(book.length>=210,'Book bank must include the full handwritten core and further numbered source subparts');
approx(original.get('1.19b').expected,2,'1.19b');
approx(original.get('1.98a').expected,48,'1.98a');
assert(original.get('1.98c').prompt.includes('³√(x²)'),'1.98c has the original root and power');
approx(original.get('1.98c').expected,(3/5)*(Math.pow(5,5/3)-Math.pow(2,5/3)),'1.98c');
approx(original.get('1.99').expected,300/Math.PI,'1.99');
approx(original.get('1.100d').expected,14.4098445789603,'1.100d');
assert(original.get('1.79a').graph?.curves?.[1]?.domain?.[0]===10,'Composite rod plot must begin the parabola only at x=10');
for(const comp of ['4.2','4.4','4.5','4.8']){
 const hits=pool.filter(q=>q.descriptor.split(',').map(x=>x.trim()).includes(comp));
 assert(hits.length>=5,'Official pool must cover highlighted descriptor '+comp+' (got '+hits.length+')');
}


const fixedCss=read('public/maths/sa-01/source-trainer.css');
const inlineJs=read('public/maths/sa-01/official-inline.js');
const assetMap=read('src/app/cosmetic-assets.ts');
const legacyBridge=read('public/shared/verse-cosmetics.js');
const foxSvg=read('public/cosmetics/avatars/maths_pi_fox.svg');
const owlSvg=read('public/cosmetics/avatars/maths_euler_owl.svg');
vm.runInNewContext(inlineJs,sandbox);
assert(!mhtml.includes('data-nav="graphs"')&&!mjs.includes('Graphenlabor'),'Unneeded graph lab removed from all visible MathsVerse destinations');
assert(mjs.includes('SOURCE.captureList')&&mjs.includes('SOURCE.restoreList'),'Catalog position must survive changing selected tasks');
assert(mjs.includes("source-screen")&&mjs.includes("source-solution-open"),'Page scrolling enabled only for a revealed solution');
assert(fixedCss.includes('height:100dvh;max-height:100dvh;overflow:hidden'),'Catalog exercise pages must fit in viewport');
assert(fixedCss.includes('source-list')&&fixedCss.includes('overflow-y:auto'),'Only the list scrolls in normal study mode');
assert(sourceJs.includes('officialStatement(q)')&&sourceJs.includes('source-inline-original'),'SRDP should show complete sourced prompt inline');
assert(sourceJs.includes('scrolling="no"')&&sourceJs.includes('view=Fit'),'Official PDF must fit without a nested scroll viewer');
assert(mhtml.includes('official-inline.js'),'Full official inline material should load before source trainer');
assert.equal(Object.keys(sandbox.window.MATHS_INLINE_ORIGINAL).length,21,'All source-page-based exams must be imported');
assert(sandbox.window.MATHS_OFFICIAL_FIGURES['4205'].some(x=>x.endsWith('.svg')),'Real original graphs must be available as SVG');
assert(assetMap.includes("'🦊':'maths_avatar_pi'")&&assetMap.includes("'🦉':'maths_owl'"),'Legacy equipped animal emojis must resolve to new art');
assert(legacyBridge.includes("'🦊': 'maths_avatar_pi'")&&legacyBridge.includes("'🦉': 'maths_owl'"),'Standalone worlds must show same avatar art');
assert(app.includes("item.id==='maths_avatar_pi'||item.id==='maths_owl'"),'MathsVerse equipped items must store ID, not emoji');
assert(!/circle cx="256" cy="256" r="250" fill=/.test(foxSvg),'Fox image may not contain a background circle');
assert(!/circle cx="256" cy="256" r="250" fill=/.test(owlSvg),'Owl image may not contain a background circle');

console.log('PASS: Source-screenshot cross-checks, numeric golden values, and original 10+10 MathsVerse training.');

console.log('PASS: MathsVerse original textbook, 50 sourced SRDP tasks, 10+10 exam, safe progress and cosmetics.');
