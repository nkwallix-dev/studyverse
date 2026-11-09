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
