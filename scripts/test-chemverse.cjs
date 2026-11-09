// Smoke-test the standalone Chemverse HTML trainer in CI.
// This checks JavaScript syntax plus the repeatable daily rewards and answer reshuffling.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/nawi/test-01/index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/i);
assert(match,'Expected inline Chemverse <script> source');
const js=match[1];
new Function(js); // Syntax check for the entire learning app, not just Angular.

function extract(start,end){
 const a=js.indexOf(start),b=js.indexOf(end,a);
 assert(a>=0&&b>a,'Missing '+start+' or '+end);
 return js.slice(a,b);
}
// Test multiple correct answers, repeat runs, and rolling local-day caps.
let today='2026-11-09';
let writes=0;
const state={coins:0,quizAnswerOrders:{},dailyCoin:{date:'',quizIds:[],bossPaid:false}};
const rewardFactory=new Function('state','dayString','save','toast',
  extract('const DAILY_QUIZ_COUNT','function randomizedChoices(')+
  ';return {dailyCoinState,awardDailyQuiz,awardDailyBoss};');
const {awardDailyQuiz,awardDailyBoss}=rewardFactory(state,()=>today,()=>writes++,()=>{});
for(let i=0;i<20;i++)assert.equal(awardDailyQuiz('q'+i),true);
assert.equal(state.coins,500,'20 unique correct quiz answers = 500 Tokens');
assert.equal(awardDailyQuiz('q0'),false,'No duplicate payment for the same question on the same day');
assert.equal(awardDailyQuiz('q20'),false,'No more than 20 unique quiz payments each day');
assert.equal(state.coins,500);
assert.equal(awardDailyBoss(69),false,'Boss below 70% must not pay');
assert.equal(awardDailyBoss(70),true,'Boss at 70% pays 250');
assert.equal(awardDailyBoss(100),false,'Boss pays at most once per day');
assert.equal(state.coins,750);
today='2026-11-10';
assert.equal(awardDailyQuiz('q0'),true,'Daily quiz resets the next day');
assert.equal(awardDailyBoss(85),true,'Daily Boss resets the next day');
assert.equal(state.coins,1025);

const shuffleFactory=new Function('state','shuffledIndices','save',
  extract('function randomizedChoices(','function coinRain(')+
  ';return randomizedChoices;');
const stableShuffle=n=>Array.from({length:n},(_,i)=>i);
const randomize=shuffleFactory(state,stableShuffle,()=>writes++);
const q={id:'repeat-q',choices:['right','wrong1','wrong2','wrong3'],a:0};
let prev=-1;
for(let i=0;i<80;i++){
 const order=randomize(q);
 assert.deepEqual([...order].sort(),[0,1,2,3],'Choice order must remain a permutation');
 const current=order.indexOf(q.a);
 if(prev>=0)assert.notEqual(current,prev,'Repeated questions must move the right answer');
 prev=current;
}
assert(js.includes('quizSession.order=randomizedChoices(quizSession.question)'),'Quiz must use new randomization');
assert(js.includes('orders:core.map(q=>randomizedChoices(q))'),'Boss must use new randomization');
assert(js.includes("reward(q.id,15,'Quizfrage gemeistert');awardDailyQuiz(q.id);"),
 'Daily tokens must be granted only from the correct-answer branch');
assert(js.includes("awardDailyBoss(pct)"),'Boss payout must use real final score');
console.log('CHEMVERSE tests passed: syntax, daily caps, Boss scoring, repeat choice reshuffle.');


// Drop gate regression: learning worlds must NEVER require global profile levels.
const catalog=fs.readFileSync('src/app/shop-items.ts','utf8');
const items=catalog.split('\n').filter(line=>line.startsWith("{id:"));
assert.equal(items.length,56,'Expected 56 cosmetics');
let global=0,verse=0;
for(const item of items){
 if(item.includes("drop:'global'")){
   global++;
   assert.match(item,/,level:\d+/,'Global item should have a profile-level requirement');
   assert.doesNotMatch(item,/,requirement:/,'Global items must not require subject-specific progress');
 }else{
   verse++;
   assert.match(item,/,drop:'nawi-test-01'/,'Verse item must belong to a trainer');
   assert.match(item,/,requirement:/,'Verse item must require actual study progress');
   assert.doesNotMatch(item,/,level:\d+/,'Verse item MUST NOT have global level lock');
 }
}
assert.equal(global,29);assert.equal(verse,27);
const studyTs=fs.readFileSync('src/app/app.ts','utf8');
assert.match(studyTs,/if\(item\.drop==='global'\)return this\.level>=\(item\.level\|\|1\)/,
 'Profile level gate applies only to global items');
assert.doesNotMatch(studyTs,/if\(this\.level<\(item\.level\|\|1\)\)return false/,
 'Subject drops may not be gated by profile level');
const studyHtml=fs.readFileSync('src/app/app.html','utf8');
assert.doesNotMatch(studyHtml,/item\.drop!=='global' && item\.level/,
 'Do not show obsolete subject-drop profile level requirements');
console.log('STUDYVERSE shop gate tests passed: 27 subject cosmetics require only learning progress; 29 global items use profile levels.');

// Ensure the standalone trainer and global shop retain the same title ID, name and description.
const shopCatalog=fs.readFileSync('src/app/shop-items.ts','utf8');
const professor=shopCatalog.split('\n').find(x=>x.startsWith("{id:'title_chaos',"));
assert(professor,'Existing cosmetic ID must be preserved for save compatibility');
assert(professor.includes("name:'Professor Fischer'"),'Professor title must match the requested new name');
assert(professor.includes("desc:'Unterschätz niemals jemals jemand... Unterschätz den Mann.'"),'Professor description must match exactly');
assert(js.includes("title_chaos:'☠️ PROFESSOR FISCHER'"),'Trainer profile must use same title');
const studyTemplate=fs.readFileSync('src/app/app.html','utf8');
assert(!studyTemplate.includes('Drop-Shop'),'Navigation and heading must say Item-Shop');
assert(!studyTemplate.includes('learning-milestones'),'Shop must not show module-level course progress');
console.log('Item-Shop rename, module summary removal and Professor Fischer naming verified.');

// Regression: completion shortcut must jump straight to unsolved reaction IDs.
assert(js.includes("case'reactionfinish':startReactionFinish()"),'Dashboard finish button must route to unfinished reactions');
assert(js.includes('data-rxjump'),'Missing reactions must be directly selectable');
assert(js.includes("if(reactionSession.onlyMissing&&!pending.length)"),'Completed reaction focus mode needs a success screen');
const reactionSource=extract('function remainingReactions(){','function renderReactions(){');
const reactionFactory=new Function('REACTIONS','state','reactionSession','toast','activatePage',
  reactionSource+';return {remainingReactions,jumpToReaction,startReactionFinish};');
const completed=Object.fromEntries(Array.from({length:10},(_,i)=>['r'+i,1]));
const focusState={solved:completed};
const focusSession={idx:0,step:1,answered:true,correct:true,failed:true,onlyMissing:false};
let opened='';
const focus=reactionFactory(Array.from({length:12},(_,i)=>({id:'r'+i})),focusState,focusSession,()=>{},page=>opened=page);
assert.deepEqual(focus.remainingReactions().map(x=>x.task.id),['r10','r11'],'10/12 must show only the remaining two tasks');
focus.startReactionFinish();
assert.equal(opened,'reactions');
assert.equal(focusSession.onlyMissing,true);
assert.equal(focusSession.idx,10,'Finish must jump to the first unsolved reaction');
assert.equal(focusSession.step,0,'Finish must restart the incomplete task from step one');
assert.equal(focusSession.answered,false);
focusState.solved['r10']=1;
assert.deepEqual(focus.remainingReactions().map(x=>x.task.id),['r11'],'Completing one should leave only the other');
focusState.solved['r11']=1;
assert.equal(focus.remainingReactions().length,0);
console.log('Reaction Finish tests passed: 10/12 -> two missing missions -> all completed.');

const inventoryAppTs=fs.readFileSync('src/app/app.ts','utf8');
const inventoryHtml=fs.readFileSync('src/app/app.html','utf8');
const inventoryStyles=fs.readFileSync('src/app/app.scss','utf8');
assert(inventoryAppTs.includes("shopTab:'catalog'|'inventory'"),'Shop and inventory must be separate tabs');
assert(inventoryAppTs.includes('get inventoryItems()'),'Inventory filtering must exist');
assert(inventoryAppTs.includes('this.ownedCatalogItems.filter(item=>'),'Inventory must list owned items only');
assert(inventoryAppTs.includes("this.inventoryDrop==='Alle'")&&studyTs.includes("this.inventoryGroup==='Alle'"),'Drop/category inventory filters required');
assert(inventoryHtml.includes('class="shop-view-tabs"')&&inventoryHtml.includes('class="item-grid drop-item-grid inventory-item-grid"'),'Inventory UI tab and item cards missing');
const inventoryCard=inventoryHtml.slice(inventoryHtml.indexOf('class="item-grid drop-item-grid inventory-item-grid"'),inventoryHtml.indexOf('class="empty-tests inventory-empty"'));
assert(!inventoryCard.includes('OWNED')&&!inventoryCard.includes('IM INVENTAR'),'No redundant owned badges in the inventory');
assert(inventoryStyles.includes('overflow-x:clip'),'Layout must not create a scroll ancestor that breaks sticky sidebar');
assert(inventoryStyles.includes('height:100dvh;align-self:flex-start'),'Sidebar should remain full viewport height');
console.log('STUDYVERSE inventory + sidebar smoke tests passed.');

// User-facing wallet vocabulary & fair achievement reward estimates.
const shopTs=fs.readFileSync('src/app/app.ts','utf8');
const shopTemplate=fs.readFileSync('src/app/app.html','utf8');
assert(shopTs.includes('get shopAchievementStatus()'),'Shop must compute remaining achievement rewards');
assert(shopTs.includes('const open=trainer.achievements.filter(a=>achievementValue(a,save)<a.target)'),
 'Only unearned achievements may contribute to remaining currency');
assert(shopTemplate.includes('Alle Achievements abgeschlossen.'),'Completion state must be explicit');
assert(shopTemplate.includes('shopAchievementStatus.remaining===0'),'Completion label must appear when none are open');
assert(!shopTemplate.includes('Bis zu {{achievementRewardTotal'),'Do not advertise lifetime total as still obtainable');
assert(shopTemplate.includes('TastyTokens (TT)'),'Wallet must explain the renamed currency');
assert(!shopTemplate.includes(' Tokens'),'Use TT, not old Tokens, in visible wallet UI');
assert(!shopTemplate.includes('TastyTT'),'Do not corrupt full currency name when shortening the label');
assert(shopTemplate.includes("goEarnTokens('quiz')")&&shopTemplate.includes("goEarnTokens('boss')"),
 'Daily TT shortcuts must still call the real Angular method');
assert(js.includes('25 TastyTokens (TT)')&&js.includes('250 zusätzliche TT'),'Chemverse must use TT in practice descriptions');
console.log('Shop reward honesty and TastyTokens wording verified.');

// Profile editor: avatar brush and title dropdown must live beside the name input.
const settingsTs=fs.readFileSync('src/app/app.ts','utf8');
const settingsHtml=fs.readFileSync('src/app/app.html','utf8');
const settingsSection=settingsHtml.slice(settingsHtml.indexOf('<div class="profile-panel settings">'),settingsHtml.indexOf('<h3>CHEMVERSE-Spielstand</h3>'));
assert(settingsTs.includes('get unlockedTitles()'),'Profile must expose earned titles');
assert(settingsTs.includes("item.group==='title'&&this.owns(item)"),'Locked titles must be excluded');
assert(settingsTs.includes('setProfileTitle(id:string)'),'Title selection needs persistence handler');
assert(settingsSection.indexOf('id="profile-title-select"')>settingsSection.indexOf('id="profile-name-input"'),'Title selection must appear directly under name field');
assert(settingsSection.includes('(ngModelChange)="setProfileTitle($event)"'),'Changing title must trigger save handler');
assert(settingsSection.includes('(click)="openAvatarPicker()"'),'Paintbrush in Profile bearbeiten should open selector');
assert(settingsHtml.includes('class="modal avatar-picker-modal"'),'Avatar popup should be present');
console.log('Profile title + avatar editing form tests passed.');
