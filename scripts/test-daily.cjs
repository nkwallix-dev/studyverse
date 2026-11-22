const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dailySource=fs.readFileSync('public/shared/daily-rewards.js','utf8');
const dailyApp=fs.readFileSync('public/daily/app.js','utf8');
const dailyHTML=fs.readFileSync('public/kennyverse/index.html','utf8');
const oldDaily=fs.readFileSync('public/daily/index.html','utf8');
const companionAccess=fs.readFileSync('public/shared/kenny-access.js','utf8');
const kennyStyle=fs.readFileSync('public/shared/kenny-style.js','utf8');
const kennyCss=fs.readFileSync('public/kennyverse/style.css','utf8');
const dailyQuestions=fs.readFileSync('public/daily/questions.js','utf8');
const chem=fs.readFileSync('public/nawi/test-01/index.html','utf8');
const dsai=fs.readFileSync('public/dsai/test-01/app.js','utf8');
const homepage=fs.readFileSync('src/app/app.ts','utf8');
new Function(dailySource);new Function(dailyApp);new Function(dailyQuestions);new Function(companionAccess);new Function(kennyStyle);
const qb={window:{}};vm.runInNewContext(dailyQuestions,qb);
const pool=qb.window.STUDYVERSE_DAILY_QUESTIONS;
assert.equal(pool.length,167,'58 Chemverse + 109 DSAIVERSE questions');
assert.equal(pool.filter(x=>x.subject==='chem').length,58);
assert.equal(pool.filter(x=>x.subject==='dsai').length,109);
assert(pool.filter(x=>x.code).length>=20,'DAILY pool needs notebook code recognition');
assert.equal(new Set(pool.map(q=>q.id)).size,pool.length,'Every question needs a stable globally unique ID');
for(const q of pool)assert(q.choices.length===4&&q.answer>=0&&q.answer<4,'Question must have four options: '+q.id);
assert(dailyHTML.includes('src="../shared/daily-rewards.js"'),'Kennyverse must preserve the shared daily reward ledger');
assert(dailyHTML.includes('src="../shared/kenny-access.js"')&&dailyHTML.includes('KENNYVERSE'),
 'Kennyverse must enforce retention and use its own branded page');
assert(dailyHTML.includes('src="../shared/kenny-style.js"'),
 'Kennyverse must load the selected-skin theme before rendering the daily arena');
assert(dailyHTML.includes('class="kenny-visual"')&&dailyApp.includes('KENNY_PORTRAIT'),
 'Kennyverse portraits must share the color-aware visual wrapper');
assert(dailyApp.includes('kenny-prehistoric-banner')&&
 kennyCss.includes('.kenny-banner-volcano:after')&&
 kennyCss.includes('.kenny-banner-fern')&&
 kennyCss.includes('.kenny-banner-sun'),
 'Kennyverse hero must reuse the original volcano/Urzeit banner scenery');
for(const color of ['blue','pink','green','red','zebra'])
 assert(kennyCss.includes('data-kenny-skin="'+color+'"'),
  'Kennyverse needs a unique UI theme for '+color);
assert(oldDaily.includes('kennyverse/index.html'),'Old Daily Arena bookmarks must redirect');
assert(dailyApp.includes('ACCESS.available()')&&dailyApp.includes('Kenny ist'),
 'Direct Kennyverse links cannot bypass the companion availability check');
assert(chem.includes('src="../../shared/daily-rewards.js"'),'Chemverse must load shared reward ledger');
assert(fs.readFileSync('public/dsai/test-01/index.html','utf8').includes('src="../../shared/daily-rewards.js"'),'DSAIVERSE must load shared reward ledger');
assert(chem.includes("STUDYVERSE_DAILY.claimQuiz('chem',questionId)"));
assert(dsai.includes("STUDYVERSE_DAILY.claimQuiz('dsai',id)"));
assert(chem.includes('STUDYVERSE_DAILY.claimBoss()')&&dsai.includes('STUDYVERSE_DAILY.claimBoss()'),'Both boss modes need common cap');
assert(homepage.includes("new URL('kennyverse/index.html',document.baseURI)"),
 'Companion Daily buttons must enter Kennyverse rather than the old shop arena');
assert(dailyApp.includes('const chem=shuffle(chemSource).slice(0,10)'),'Mixed run must include Chemistry');
assert(dailyApp.includes('const code=shuffle(dsaiSource.filter(q=>q.code)).slice(0,3)'),'Mixed run must include DSAI code snippets');
assert(dailyApp.includes('const other=shuffle(dsaiSource.filter(q=>!code.includes(q))).slice(0,7)'),'Mixed run must have 10 DSAI questions');
for (const tab of ['inventory','labor']) {
 assert(dailyHTML.includes('data-kenny-nav="'+tab+'"'), 'Skilltree and Bernstein-Labor need distinct Kennyverse tabs');
}
assert(!dailyHTML.includes('data-kenny-nav="achievements"'),
 'Separate companion achievements tab is replaced by DNA lab');
assert(dailyApp.includes('function laborScreen()')&&dailyApp.includes('FORSCHUNG IN VORBEREITUNG'),
 'Amber laboratory must present an honest future-DNA concept without spending');
assert(homepage.includes('companionAchievementCards')&&homepage.includes('showCompanionAchievements'),
 'Kenny achievements are now discoverable through the global Studyverse filter');
assert(dailyHTML.includes('id="kennyCollection"'), 'Collection content stays inside the Kennyverse shell');
assert(dailyApp.includes('event.origin!==location.origin') && dailyApp.includes('event.source!==collectionFrame?.contentWindow'), 'Embedded navigation validates both origin and source');
const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
const db=new Map();
const storage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>{db.set(k,String(v))},removeItem:k=>db.delete(k)};
db.set('chemverse_niklas_v1',JSON.stringify({dailyCoin:{date:today,quizIds:['q1','q2'],bossPaid:false}}));
db.set('dsai_studyverse_v1',JSON.stringify({dailyCoin:{date:today,quizIds:['q4'],bossPaid:true}}));
const externalWindow={};vm.runInNewContext(dailySource,{window:externalWindow,localStorage:storage,Date,JSON});
const ledger=externalWindow.STUDYVERSE_DAILY;
const starting=ledger.get();
assert.equal(starting.quizIds.length,3,'Old paid questions must migrate into global cap');
assert(starting.quizIds.includes('chem:q1')&&starting.quizIds.includes('dsai:q4'),'IDs must preserve their subject namespace');
assert.equal(starting.bossPaid,true,'Old paid boss must prevent duplicate rewards');
assert.equal(ledger.claimQuiz('chem','q1'),false,'A historical paid question cannot pay twice');
assert.equal(ledger.claimBoss(),false,'Legacy paid boss blocks new bonus');
assert.equal(ledger.claimQuiz('dsai','q5'),true,'A new subject question should count');
for(let i=0;i<20;i++)ledger.claimQuiz('chem','test'+i);
assert.equal(ledger.get().quizIds.length,20,'Twenty total questions is global cap');
assert.equal(ledger.claimQuiz('dsai','q99'),false,'Cannot get >20 payouts by hopping subjects');
assert(ledger.get().quizIds.includes('dsai:q5'),'DSAI payouts remain counted');
const accessWindow={};vm.runInNewContext(companionAccess,{window:accessWindow,localStorage:storage,Date,JSON});
const access=accessWindow.STUDYVERSE_KENNY_ACCESS;
const during=Date.parse('2026-11-15T12:00:00+01:00');
const after=Date.parse('2027-01-15T12:00:00+01:00');
db.set('studyverse_profile_v1',JSON.stringify({dinoSeasons:{'kenny-2026':{feeds:8}}}));
assert.equal(access.available(during),true,'Kennyverse opens to all players during the active season');
assert.equal(access.available(after),false,'After the season, a level-3 Kenny must leave');
db.set('studyverse_profile_v1',JSON.stringify({dinoSeasons:{'kenny-2026':{feeds:24}}}));
assert.equal(access.available(after),false,'Level 4 is not a permanent companion');
db.set('studyverse_profile_v1',JSON.stringify({dinoSeasons:{'kenny-2026':{feeds:25}}}));
assert.equal(access.available(after),true,'Level-5 Kenny must permanently retain Kennyverse access');
assert.equal(access.retained(after),true,'Level-five unlock survives season end without extra flags');
const visualRoot={dataset:{}};
const meta={attributes:{},setAttribute(key,value){this.attributes[key]=value}};
const visualsWindow={addEventListener(){}};
vm.runInNewContext(kennyStyle,{window:visualsWindow,localStorage:storage,JSON,
 document:{documentElement:visualRoot,querySelector:selector=>selector==='meta[name="theme-color"]'?meta:null}});
const looks=visualsWindow.STUDYVERSE_KENNY_STYLE;
for(const skin of ['blue','pink','green','red','zebra']){
 const profile={inventory:['kenny_skin_'+skin],dinoSeasons:{'kenny-2026':{feeds:25,skin}}};
 assert.equal(looks.fromProfile(profile),skin,'Equipped and owned '+skin+' skin must be used');
 db.set('studyverse_profile_v1',JSON.stringify(profile));
 assert.equal(looks.apply(),skin,'The UI must sync '+skin);
 assert.equal(visualRoot.dataset.kennySkin,skin,'Kennyverse theme must match '+skin);
}
assert.equal(looks.fromProfile({inventory:[],dinoSeasons:{'kenny-2026':{skin:'zebra'}}}),'blue',
 'A non-owned zebra skin must not be shown as equipped');
assert.equal(looks.fromProfile({dinoSeasons:{'kenny-2026':{skin:'???'}}}),'blue',
 'Invalid skin IDs use the default blue appearance');
db.set('studyverse_profile_v1','broken json');
assert.equal(looks.apply(),'blue','Corrupted profile must not break Kennyverse styling');
assert.equal(visualRoot.dataset.kennySkin,'blue');
console.log('DAILY PASS: Kennyverse equipped skins/Urzeit banner, season access, 167 questions, mixed pool and shared daily budget.');
