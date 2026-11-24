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
vm.runInNewContext(bookJs,sandbox);vm.runInNewContext(read('public/maths/sa-01/book-groups.js'),sandbox);vm.runInNewContext(read('public/maths/sa-01/book-crops.js'),sandbox);vm.runInNewContext(poolJs,sandbox);vm.runInNewContext(read('public/maths/sa-01/sa1-scope-bank.js'),sandbox);
const book=sandbox.window.MATHS_BOOK_BANK,pool=sandbox.window.MATHS_POOL_BANK,sourceGroups=sandbox.window.MATHS_BOOK_GROUPS;
assert(book.length>=80,'Textbook ZIP must produce >80 specific sourced tasks');
assert(pool.length>=60&&pool.length<=150,'SA1 cluster should have a substantial, curated task set');
assert.equal(sourceGroups.length,84,'Book task navigation should group the 215 existing sub-parts into 84 real exercises');


/* Only real BMB exercises with preserved task IDs/sources may extend 4.8. */
const newIntegralCases=[
 ['A_299 a','Bäume – Fläche eines Buchenblatts'],
 ['A_309 a','Zirbenholzbetten – Fläche und Masse'],
 ['A_317 a','Stand-up-Paddling – Fläche zwischen Kurven'],
 ['A_318 a','Kleingartensiedlung – Grundstück halbieren'],
 ['1_1309','Integral und Flächeninhalt – Vorzeichen richtig deuten']
];
const integralCases=pool.filter(q=>q.descriptor.split(',').map(s=>s.trim()).includes('4.8'));
assert(integralCases.length>=10&&integralCases.length<=15,'Descriptor 4.8 must include a balanced maximum of 15 integral tasks');
for(const [number,title] of newIntegralCases){
 const q=pool.find(x=>x.number===number);
 assert(q,'Missing official task '+number);
 assert.equal(q.title,title);
 assert(q.prompt?.length>=80&&q.solution?.length>=75&&q.guide?.length>=75,'Incomplete original-source exercise '+number);
 assert(q.source.startsWith('https://www.aufgabenpool.at/amn/'),'No non-ministry sources in 4.8');
 assert(q.descriptor==='4.8','Integral example outside 4.8');
}
for(const key of ['A_299 a','A_309 a','A_317 a','A_318 a']){
 const q=pool.find(x=>x.number===key);
 assert.equal(q.collection,true,'Older task should use the source collection view');
 assert.equal(q.source,'https://www.aufgabenpool.at/amn/allFiles/A.pdf');
}
const newStandalone=pool.find(q=>q.number==='1_1309');
assert(!newStandalone.collection&&newStandalone.source.endsWith('.pdf'));
assert(sourceJs.includes('if(q.collection)')&&sourceJs.includes('source-compendium-statement'),
 'Large original collection must show the exact chosen question before opening the PDF');
assert(sourceJs.includes('q.collection?')&&sourceJs.includes('esc(q.solution)'),
 'Embedded collection tasks need an accessible answer comparison');
assert(read('public/maths/sa-01/source-trainer.css').includes('.source-compendium-pdf iframe'),
 'Original compendium must be available on demand');

assert.equal(pool.filter(q=>q.kind==='worksheet').length,9,'Exactly nine analysis-related teacher sheets');
assert(!pool.some(q=>q.number==='B_261 b'||q.number==='B_602'),'Unrelated sign geometry and proportionality excluded');
assert(pool.some(q=>q.number==='B_684 b'),'Roboterarm worksheet missing');
assert(pool.some(q=>q.number==='B_623 a'),'Thermosflasche worksheet missing');
for(const sheet of pool.filter(q=>q.kind==='worksheet')){
 assert(fs.existsSync('public/maths/sa-01/'+sheet.source),'Classroom scan not imported: '+sheet.source);
}
assert(pool.filter(q=>q.origin==='studyverse').every(q=>q.sourceLabel.includes('keine amtliche Maturaaufgabe')),
 'Self-authored tasks must not masquerade as official SRDP questions');
assert(sourceJs.includes('source-worksheet-photo')&&sourceJs.includes('STUDYVERSE-ÜBUNG'),
 'Classroom and self-authored tasks need clear labels and safe image toggle');

const sourceCrops=sandbox.window.MATHS_BOOK_CROPS;
assert(mhtml.includes('<script src="book-crops.js"></script>'),'Crop module must load before original-source renderer');
assert(sourceJs.includes('const sheet=bookOriginalStep(q)'),'Original image must depend on active book step');
assert(!sourceJs.includes('group.artwork.map'),'Whole book pages must not be rendered in grouped exercises');
assert(sourceJs.includes('Originalausschnitt · '+String.fromCharCode(39)+'+esc(q.number)'),'Original toggle must name selected subpart');
for(const q of book){
 const pieces=sourceCrops[q.number];
 assert(pieces?.length>0,'Original crop missing for '+q.number);
 for(const r of pieces){
  assert.equal(r.page,q.originalScreenshot,'Original screenshot page mismatch for '+q.number);
  assert([r.x,r.y,r.w,r.h,r.W,r.H].every(Number.isFinite),'Non-numeric original crop for '+q.number);
  assert(r.x>=0&&r.y>=0&&r.w>=8&&r.h>=8&&r.x+r.w<=r.W+2&&r.y+r.h<=r.H+2,'Out-of-bounds original crop '+q.number);
  assert(r.w*r.h<r.W*r.H*.9,'Crop shows almost entire original page for '+q.number);
  assert(fs.existsSync('public/maths/sa-01/original-figures/book-page-'+r.page+'.webp'),'Missing source scan for '+q.number);
 }
}
for(const [a,b] of [['1.1a','1.1b'],['1.1b','1.1c'],['1.80a','1.80b'],['1.98a','1.98d']]){
 assert(JSON.stringify(sourceCrops[a].at(-1))!==JSON.stringify(sourceCrops[b].at(-1)),a+' and '+b+' must have different original subpart crops');
}
assert(sourceJs.includes("'<div class=\"book-exam-original\">'+bookOriginalStep(q)"),'Original exam must also use selected-subtask crop');

assert.equal(new Set(book.map(q=>q.number)).size,book.length,'Do not repeat textbook tasks');
assert.equal(new Set(pool.map(q=>q.number)).size,pool.length,'Do not repeat official task IDs');
for(const q of book){assert(q.prompt&&q.solution&&q.steps,'Book tasks need exact prompt and explained answer');if(q.expected!=null)assert(Number.isFinite(q.expected),'Book numeric result must be finite')}
for(const q of pool){assert(q.source&&q.number,'Every cluster task must identify its source');assert(!/^(?:4[.]7|B_T2_4[.]3)$/.test(q.descriptor),'Excluded chapter must not appear');if(q.expected!=null)assert(Number.isFinite(q.expected))}
assert(sourceJs.includes('shuffle(GROUPS).slice(0,10)'),'Boss must select 10 distinct original textbook exercise groups');
assert(sourceJs.includes('shuffle(POOL).slice(0,10)'),'Official half of boss is random 10');
assert(sourceJs.includes('api.reward')||sourceJs.includes('api.state.bestBoss'),'Exam result must be recorded');
assert(mhtml.includes('data-nav="book"')&&mhtml.includes('data-nav="pool"'),'There must be two separate catalog tabs');
assert(!mhtml.includes('data-nav="practice"'),'Synthetic practice must not be in the navigation');
for(const name of ['book-bank.js','book-groups.js','pool-bank.js','sa1-scope-bank.js','source-trainer.js','source-trainer.css'])assert(mhtml.includes(name),'Missing source trainer asset '+name);
assert(mjs.includes('SOURCE.browser(\'book\',state)')&&mjs.includes('SOURCE.browser(\'pool\',state)'),'Original catalogs must render via app');
assert(sourceJs.includes('Stift und Papier')&&sourceJs.includes('Lösung anzeigen'),'Paper instructions and reveal button required');
assert(!poolJs.includes('maths2mind.com'),'No third-party task mirror allowed in official source bank');
assert(!mhtml.includes('official-inline.js'),'Do not load mixed-origin inline task artifacts');
assert(pool.filter(q=>q.origin==='official').every(q=>/^https:\/\/(?:www\.)?aufgabenpool\.at\/amn\//.test(q.source)),'Official tasks must link only to the ministry');
assert(sourceJs.includes('source:pool-check')&&sourceJs.includes('Lösungserwartung'),'Official solutions must be checked in the real PDF instead of fake numerical grading');
for(const group of sourceGroups){
 assert(group.steps.length>=1&&group.steps.every(q=>q.number.startsWith(group.number)),'Every original subtask must belong to exactly one exercise');
 assert(group.artwork.length>=1,'Original page scan must be attached to exercise '+group.number);
 for(const art of group.artwork)assert(fs.existsSync('public/maths/sa-01/original-figures/'+art),'Missing imported original figure '+art);
}
assert.equal(sourceGroups.find(g=>g.number==='1.80').steps.length,2,'Rotational-solid book example 1.80 must be grouped in two steps');
assert.equal(sourceGroups.find(g=>g.number==='1.100').steps.length,4,'Drone book example 1.100 must be grouped in four steps');
assert(sourceGroups.find(g=>g.number==='1.80').artwork.includes('book-1-80.webp'),'Use original 1.80 diagram, not a hand-drawn substitute');
assert(sourceGroups.find(g=>g.number==='1.100').artwork.includes('book-1-100.webp'),'Use original 1.100 statement scan');
for(let n=1;n<=15;n++)assert(fs.existsSync('public/maths/sa-01/original-figures/book-page-'+n+'.webp'),'Missing original image for source page '+n);

const original=new Map(book.map(q=>[q.number,q]));
const approx=(actual,expected,id)=>assert(Math.abs(actual-expected)<1e-8,id+' value incorrect: '+actual+' expected '+expected);
for(const [number,page] of [['1.1a',1],['1.11a',2],['1.18a',3],['1.21',4],['1.31',6],['1.55a',7],['1.57c',7],['1.67c',8],['1.73b',9],['1.82d',11],['1.98d',13],['2.24a',14],['2.36a',15]]){
 assert.equal(original.get(number)?.originalScreenshot,page,number+' must cite the actual screenshot in the provided ZIP');
}
assert(original.get('1.13').prompt.includes('Kreuze die zutreffende Aussage')&&original.get('1.13').solution.includes('C ist richtig'),'Real multiple-choice source 1.13 must not be reduced to a synthetic numeric question');
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
for(const comp of ['4.1','4.2','4.3','4.4','4.5','4.6','4.8','B_T_4.1','B_T2_4.2','B_T2_4.4','B_T2_4.5','partial','parts']){
 const hits=pool.filter(q=>q.primary===comp);
 assert(hits.length>=2&&hits.length<=15,'Every listed descriptor must have 2–15 fitting tasks: '+comp+'='+hits.length);
}
assert(sourceJs.includes("'4.1':'Grenzwerte & Stetigkeit'")&&sourceJs.includes("'4.6':'Stammfunktionen'"),'All 7 descriptor topics must have transparent navigation, even without verified official question IDs');

const fixedCss=read('public/maths/sa-01/source-trainer.css');
const assetMap=read('src/app/cosmetic-assets.ts');
const legacyBridge=read('public/shared/verse-cosmetics.js');
const foxSvg=read('public/cosmetics/avatars/maths_pi_fox.svg');
const owlSvg=read('public/cosmetics/avatars/maths_euler_owl.svg');
assert(!mhtml.includes('data-nav="graphs"')&&!mjs.includes('Graphenlabor'),'Unneeded graph lab removed from all visible MathsVerse destinations');
assert(mjs.includes('SOURCE.captureList')&&mjs.includes('SOURCE.restoreList'),'Catalog position must survive changing selected tasks');
assert(mjs.includes("source-screen")&&mjs.includes("SOURCE.focusSolution")&&!mjs.includes("classList.toggle('source-solution-open'"),'Revealing an answer must never release the fixed viewport');
assert(fixedCss.includes('height:100dvh;max-height:100dvh;overflow:hidden'),'Catalog exercise pages must fit in viewport');
assert(fixedCss.includes('source-list')&&fixedCss.includes('overflow-y:auto'),'The list must scroll independently');
assert(fixedCss.includes('source-reading')&&fixedCss.includes('source-answer-dock'),'Document scrolling must be independent of the permanently visible answer dock');
assert(fixedCss.includes('min-height:56px!important')&&fixedCss.includes('flex:0 0 auto!important'),'Task buttons must not compress vertically or overlap labels');
assert(!fixedCss.includes('source-solution-open'),'No solution mode may unlock outer page scrolling');
assert(sourceJs.includes('source-reading')&&sourceJs.includes('source-answer-dock'),'The trainer must render document area and answer dock as siblings');
assert(!sourceJs.includes('inner.style.zoom'),'Remove automatic content shrinking that made PDFs unreadable');
assert(sourceJs.includes('officialStatement(q)')&&sourceJs.includes('aufgabenpool.at'),'SRDP tasks must display the original official PDF');
assert(sourceJs.includes('view=FitH')&&sourceJs.includes('zoom=page-width'),'Official PDF must open readable at page width');
assert(assetMap.includes("'🦊':'maths_avatar_pi'")&&assetMap.includes("'🦉':'maths_owl'"),'Legacy equipped animal emojis must resolve to new art');
assert(legacyBridge.includes("'🦊': 'maths_avatar_pi'")&&legacyBridge.includes("'🦉': 'maths_owl'"),'Standalone worlds must show same avatar art');
assert(app.includes("item.id==='maths_avatar_pi'||item.id==='maths_owl'"),'MathsVerse equipped items must store ID, not emoji');
assert(!/circle cx="256" cy="256" r="250" fill=/.test(foxSvg),'Fox image may not contain a background circle');
assert(!/circle cx="256" cy="256" r="250" fill=/.test(owlSvg),'Owl image may not contain a background circle');

console.log('PASS: Source-screenshot cross-checks, numeric golden values, and original 10+10 MathsVerse training.');


/* XP economy: do not force completion of 215 book parts to earn XP.
   10 DISTINCT printed groups/official tasks at most, idempotent, legacy-safe. */
const xpContext={window:{},document:{getElementById:()=>null}};
vm.runInNewContext(bookJs,xpContext);
vm.runInNewContext(read('public/maths/sa-01/book-groups.js'),xpContext);
vm.runInNewContext(poolJs,xpContext);vm.runInNewContext(read('public/maths/sa-01/sa1-scope-bank.js'),xpContext);
vm.runInNewContext(read('public/maths/sa-01/source-trainer.js'),xpContext);
const xpSource=xpContext.window.MATHS_SOURCE_TRAINER;
function testState(earned={}){
 const state={solved:{},earned:{...earned},xp:0,coins:0},payouts=[];
 const api={state,view:'book',save(){},navigate(){},
  reward(id,xp,coins){
   if(state.earned[id])return false;
   state.earned[id]=true;state.xp+=xp;state.coins+=coins;payouts.push({id,xp,coins});return true;
  }
 };
 return {state,payouts,api};
}
const xpTest=testState();
const tenGroups=xpSource.GROUPS.slice(0,11);
assert(tenGroups[0].steps.length>1,'First printed book example must test grouped rewards');
xpSource.handle('source:open:'+tenGroups[0].id,xpTest.api);
xpSource.handle('source:self-right',xpTest.api);
assert.equal(xpTest.payouts.length,0,'A single 1.1 subpart must not count as four independent book exercises');
for(const step of tenGroups[0].steps.slice(1)){
 xpSource.handle('source:step:'+step.id,xpTest.api);
 xpSource.handle('source:self-right',xpTest.api);
}
assert.equal(xpTest.payouts.length,1,'All 1.1 subparts together award only one book group');
for(const group of tenGroups.slice(1)){
 xpSource.handle('source:open:'+group.id,xpTest.api);
 for(const step of group.steps){
  xpSource.handle('source:step:'+step.id,xpTest.api);
  xpSource.handle('source:self-right',xpTest.api);
 }
}
assert.equal(xpTest.payouts.length,10,'Only the first ten distinct complete examples grant payouts');
assert.equal(xpTest.state.xp,500,'Ten full examples grant 10 x 50 XP');
assert.equal(xpTest.state.coins,250,'Ten full examples grant 10 x 25 TT');
assert.equal(xpSource.sourceRewardProgress(xpTest.state).paid,10);
xpSource.handle('source:open:'+tenGroups[0].id,xpTest.api);
xpSource.handle('source:self-right',xpTest.api);
assert.equal(xpTest.payouts.length,10,'Repeat answers must not generate more XP or TT');
const oldXp=testState({'source-first:nbook-1-1a':true});
assert.equal(xpSource.sourceRewardProgress(oldXp.state).paid,1,'Legacy per-substep rewards count toward the cap');
xpSource.handle('source:open:'+tenGroups[0].id,oldXp.api);
for(const step of tenGroups[0].steps){
 xpSource.handle('source:step:'+step.id,oldXp.api);
 xpSource.handle('source:self-right',oldXp.api);
}
assert.equal(oldXp.payouts.length,0,'Existing paid book example must not be rewarded twice');
for(const group of tenGroups.slice(1)){
 xpSource.handle('source:open:'+group.id,oldXp.api);
 for(const step of group.steps){
  xpSource.handle('source:step:'+step.id,oldXp.api);
  xpSource.handle('source:self-right',oldXp.api);
 }
}
assert.equal(oldXp.payouts.length,9,'Legacy payout should leave only nine new reward slots');
const poolXp=testState();
poolXp.api.view='pool';
for(const task of xpSource.POOL.slice(0,11)){
 xpSource.handle('source:open:'+task.id,poolXp.api);
 xpSource.handle('source:pool-complete',poolXp.api);
}
assert.equal(poolXp.payouts.length,10,'SRDP original tasks share the ten-example cap');

console.log('PASS: 84 unchanged book groups, curated HTL2/classroom/curriculum tasks, no excluded chapters, and 10+10 exam.');
