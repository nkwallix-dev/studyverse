'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {levelFor,profileFromDoc,displayXpFromDoc,allowedName,showcaseFromDoc,fieldsForNewCard,run}=require('./sync-public-levels.cjs');
const host=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
assert.equal(levelFor(0),1);
assert.equal(levelFor(150),2);
assert.equal(levelFor(5768),8);
assert.equal(levelFor(2740),5);
assert.equal(profileFromDoc({fields:{profile:{stringValue:JSON.stringify({profile:{xp:5768,nickname:'Niki'}})}}}).xp,5768);
assert.equal(profileFromDoc({fields:{profile:{stringValue:'broken'}}}),null);
const pending={fields:{profile:{stringValue:JSON.stringify({
 profile:{xp:0,nickname:'Spielerin',trainerSaves:{'dsai-test-01':{xp:0}}},
 trainers:{'dsai-test-01':{xp:5768}},
 bridge:{id:'dsai-test-01',saveKey:'dsai_studyverse_v1',xp:0}
})}}};
assert.equal(displayXpFromDoc(pending,profileFromDoc(pending)),5768,
 'Standalone verse XP must count toward the public display before returning home');
const partlyApplied={fields:{profile:{stringValue:JSON.stringify({
 profile:{xp:500,nickname:'Spielerin',trainerSaves:{'dsai-test-01':{xp:500}}},
 trainers:{'dsai-test-01':{xp:5768}},
 bridge:{id:'dsai-test-01',saveKey:'dsai_studyverse_v1',xp:0}
})}}};
assert.equal(displayXpFromDoc(partlyApplied,profileFromDoc(partlyApplied)),5768,
 'Previously applied verse XP must not be counted twice');
const untrusted={fields:{profile:{stringValue:JSON.stringify({
 profile:{xp:0},trainers:{'dsai-test-01':{xp:5768}},
 bridge:{id:'dsai-test-01',saveKey:'some-other-game',xp:0}
})}}};
assert.equal(displayXpFromDoc(untrusted,profileFromDoc(untrusted)),0,
 'Only an expected trainer bridge can contribute pending XP');
assert(allowedName('Julian')&&!allowedName('n1gga')&&!allowedName('admin'));
assert.deepEqual(Object.keys(fieldsForNewCard({nickname:'Julian',xp:120,equipped:{avatar:'🐼'}})).sort(),
 ['nickname','avatar','selectedTitle','showcase','updatedAt','level'].sort());
const prior={fields:{profile:{stringValue:JSON.stringify({profile:{xp:0,equipped:{theme:'galaxy',frame:'gold'},
 trainerSaves:{'dsai-test-01':{courseDone:{intro:true,bigdata:true}}}}})}}};
assert.deepEqual(JSON.parse(showcaseFromDoc(prior,profileFromDoc(prior))).courses,
 [{id:'dsai-test-01',done:2,total:16,percent:13}]);
const users=[
 {name:'projects/studyverse-logins/databases/(default)/documents/users/Julian0001',
  fields:{profile:{stringValue:JSON.stringify({profile:{xp:5768,nickname:'Julian',tokens:400,inventory:['panda'],equipped:{avatar:'🐼',frame:'gold'},
   trainerSaves:{'dsai-test-01':{courseDone:{intro:true,bigdata:true}}}}})}}},
 {name:'projects/studyverse-logins/databases/(default)/documents/users/User000002',
  fields:{profile:{stringValue:JSON.stringify({profile:{xp:150,nickname:'Klar',tokens:0,inventory:[]}})}}}
];
const requests=[];
const pages=async(url,options)=>{
 const method=options?.method||'GET';requests.push({url,method,body:options?.body?JSON.parse(options.body):null});
 const json=value=>({ok:true,status:200,json:async()=>value});
 if(url.endsWith('/users?pageSize=100'))return json({documents:users});
 if(url.endsWith('/publicProfiles/Julian0001')&&method==='GET')
   return json({fields:{nickname:{stringValue:'Julian'},level:{integerValue:'1'},moderatorTitle:{stringValue:'VIP'}}});
 if(url.endsWith('/publicProfiles/User000002')&&method==='GET')
   return {ok:false,status:404};
 if(method==='PATCH')return json({});
 throw Error('Unrecognized '+method+' '+url);
};
(async()=>{
 const res=await run({token:'x'.repeat(40),fetcher:pages});
 assert.equal(res.patched,1);
 assert.equal(res.created,1);
 assert.equal(requests.filter(r=>r.method==='PATCH').length,2);
 const julian=requests.find(r=>r.method==='PATCH'&&r.url.includes('Julian0001'));
 assert.equal(julian.body.fields.level.integerValue,'8');
 assert.deepEqual(Object.keys(julian.body.fields),['level','showcase'],'Backfill a legacy card without overwriting admin display name or title');
 assert.equal(JSON.parse(julian.body.fields.showcase.stringValue).frame,'gold');
 assert.equal(JSON.parse(julian.body.fields.showcase.stringValue).courses[0].percent,13);
 const fresh=requests.find(r=>r.method==='PATCH'&&r.url.includes('User000002'));
 assert.equal(fresh.body.fields.level.integerValue,'2');
 assert.equal(fresh.body.fields.nickname.stringValue,'Klar');
 assert.equal(JSON.parse(fresh.body.fields.showcase.stringValue).theme,'base');
 assert(!requests.some(r=>r.url.includes('wallet/')||r.url.includes('tokens')));
 assert(host.includes('rewardBatchTotal')&&host.includes('rewardBatchPosition'),
  'Reward carousel needs persisted batch size and index');
 assert(host.includes('get rewardStep()')&&host.includes('get rewardTotal()'));
 assert(host.includes('buyAndEquipReward()')&&host.includes('finishRewardItem(item.id)'));
 assert(!host.includes('rewardPopupSuppressed'),'Popups must not suppress later pending items');
 assert(html.includes('FREISCHALTUNG {{rewardStep}} VON {{rewardTotal}}'));
 assert(html.includes('Kaufen &amp; Ausrüsten')&&html.includes('Deine TastyTokens'));
 assert(html.includes('(click)="acceptReward()"')&&html.includes('(click)="buyAndEquipReward()"'));
 assert(!html.includes('(click)="showRewardInShop()"'));
 console.log('PASS: Julian & future accounts get admin-written provisional level; TT/inventory untouched; reward carousel displays every unlocked item.');
})().catch(e=>{console.error(e);process.exitCode=1});
