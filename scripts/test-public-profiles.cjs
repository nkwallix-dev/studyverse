'use strict';
// Security: public level and cosmetics MUST NOT come from a client-writable record.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync('src/app/cloud.ts','utf8');
const rules=fs.readFileSync('firestore.rules','utf8');
const mirror=fs.readFileSync('firebase/firestore.rules','utf8');
const angular=fs.readFileSync('src/app/app.ts','utf8');
const template=fs.readFileSync('src/app/app.html','utf8');
const css=fs.readFileSync('src/app/app.scss','utf8');
const shopCss=fs.readFileSync('src/styles.scss','utf8');
assert.equal(rules,mirror,'Both Firestore rule copies MUST stay identical');
assert(/match \/users\/\{userId\}/.test(rules)&&rules.includes('request.auth.uid == userId'),
 'Private cloud save must remain owner-only');
assert(/match \/publicProfiles\/\{userId\}\s*\{\s*allow read, write: if false;/.test(rules),
 'ALL old untrusted publicProfiles reads/writes must be denied, even for document owner');
assert(/match \/verifiedProfiles\/\{userId\}\s*\{[\s\S]*?allow get, list: if request.auth != null;[\s\S]*?allow create, update, delete: if false;/.test(rules),
 'Verified leaderboard collection must never be client writable');
assert(!source.includes("documents/publicProfiles"),'Client must not query legacy insecure leaderboard');
assert(!source.includes('publishPublicProfile('),'Client must not publish levels to the public scoreboard');
assert(!angular.includes('publishPlayerProfile('),'App must never publish locally calculated XP as public proof');
assert(template.includes('player.avatar')&&template.includes('player.title'),
 'Verified cards should still display avatar and title');
assert(template.includes('class="top-friends-link"')&&template.includes("(click)=\"go('friends')\""),
 'Friends navigation remains available');
assert(template.includes("VERIFIZIERTE SPIELER")&&template.includes('serverseitig geprüfte Level'),
 'Directory should explain verified-only ranking');
assert(template.includes('player.nickname')&&template.includes('player.level'),
 'Cards display only nicknames and verified levels');
assert(!template.includes('{{player.uid}}')&&!template.includes('{{player.username}}'),
 'Never display internal uid or login username');
assert(template.includes('id="shop-drop-select"')&&template.includes('(ngModelChange)="chooseDrop($event)"'),
 'Shop selector remains functional');
assert(shopCss.includes('COSMETIC CATEGORY SIGNATURES')&&css.includes('.profile-view .profile-grid'),
 'Other app styles remain intact');
const session={uid:'firebase-user-123',username:'db_login_name',idToken:'token-123',refreshToken:'refresh-123',expiresAt:Date.now()+3600_000};
const values=new Map([['studyverse_cloud_session_v1',JSON.stringify(session)]]);
const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
const verifiedDoc=(uid,name,level,verified=true)=>({
 name:'projects/t/databases/(default)/documents/verifiedProfiles/'+uid,
 fields:{
  nickname:{stringValue:name},level:{integerValue:String(level)},
  avatar:{stringValue:'🧪'},title:{stringValue:'Weltenentdecker'},
  verified:{booleanValue:verified}
 }
});
const replies=[
 {documents:[
  verifiedDoc('a','Gwendi',3),
  verifiedDoc('d','ForgedPlayer',99999,false),
  verifiedDoc('e','n*gga',31)
 ],nextPageToken:'next-page'},
 {documents:[
  verifiedDoc('b','Kogi',5),
  verifiedDoc('c','Niki',8)
 ]}
];
const requests=[];
const fetch=async(url,opts={})=>{
 requests.push({url:String(url),method:opts.method||'GET',headers:opts.headers||{},body:opts.body});
 if(String(url).endsWith('cloud-config.json'))return {ok:true,json:async()=>({apiKey:'sample-public-web-api-key',projectId:'studyverse-login-tests'})};
 if(String(url).includes('/verifiedProfiles'))return {ok:true,json:async()=>replies.shift()||{documents:[]}};
 throw Error('Unexpected request '+url);
};
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
const sandbox={module:mod,exports:mod.exports,fetch,localStorage:storage,
 document:{baseURI:'https://example.com/studyverse/'},URL,URLSearchParams,AbortController,Date,
 setTimeout,clearTimeout,console};
vm.runInNewContext(transpiled,sandbox);
const {StudyverseCloud,isAllowedNickname}=mod.exports;
assert(isAllowedNickname('Niki')&&isAllowedNickname('Kogi123'),'Legitimate names remain valid');
assert(!isAllowedNickname('n*gga')&&!isAllowedNickname('n1gga')&&!isAllowedNickname('n.i.g.g.a'),'Obvious racist name variants must not be displayed');
assert(!isAllowedNickname('admin')&&!isAllowedNickname('<script>'),'Disallowed impersonation/code-like names rejected');
(async()=>{
 const cloud=new StudyverseCloud();
 await cloud.initialize();
 const entries=await cloud.listPublicProfiles();
 assert.equal(entries.length,3,'Only verified, moderated profiles can be shown');
 assert.equal(entries.map(x=>x.nickname).join(','),'Niki,Kogi,Gwendi','Sort verified results descending by level');
 assert.equal(entries.map(x=>x.level).join(','),'8,5,3','Never show forged or unverified level 31');
 assert(requests.filter(x=>x.url.includes('/verifiedProfiles')&&x.method==='GET').length===2,
  'Read server-only collection with full pagination');
 assert(!requests.some(x=>x.method==='PATCH'||x.url.includes('/publicProfiles')),
  'Never write or query user-published public profiles');
 console.log('PASS: legacy leaderboard quarantined, server-only verified records, nickname moderation, private saves preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
