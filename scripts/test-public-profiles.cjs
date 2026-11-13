'use strict';
/* Provisional legacy levels may be DISPLAYED but never edited or trusted as verified scores. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync('src/app/cloud.ts','utf8');
const rules=fs.readFileSync('firestore.rules','utf8');
const mirror=fs.readFileSync('firebase/firestore.rules','utf8');
const angular=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
const css=fs.readFileSync('src/app/app.scss','utf8');
const shopCss=fs.readFileSync('src/styles.scss','utf8');
assert.equal(rules,mirror,'The repository and Firebase rules copies must stay identical');
assert(/match \/users\/\{userId\}/.test(rules)&&rules.includes('request.auth.uid == userId'),
 'Private cloud saves must remain owner-only');
assert(/match \/publicProfiles\/\{userId\}/.test(rules)
 &&rules.includes('allow get, list: if request.auth != null;')
 &&rules.includes("request.resource.data.keys().hasOnly(['nickname', 'avatar', 'selectedTitle', 'showcase', 'updatedAt'])")
 &&rules.includes("request.resource.data.diff(resource.data).affectedKeys()")
 &&rules.includes(".hasOnly(['nickname', 'avatar', 'selectedTitle', 'showcase', 'updatedAt'])"),
 'Friend cards may be updated only by their owner and never edit an existing level field');
assert(/match \/verifiedProfiles\/\{userId\}\s*\{[\s\S]*?allow get, list: if request.auth != null;[\s\S]*?allow create, update, delete: if false;/.test(rules),
 'The true competitive leaderboard stays server-only');
assert(!angular.includes('publishPlayerProfile('),'No user-supplied level publishing allowed');
assert(source.includes('documents/publicProfiles')&&!source.includes('documents/verifiedProfiles'),
 'The friends directory must be distinct from the verified ranking system');
assert(html.includes("displayPlayerLevel(player) === null ? '–' : displayPlayerLevel(player)")
 &&html.includes('*ngFor="let player of displayedPlayers; let i = index"')
 &&html.includes('#{{i+1}}')&&angular.includes('return this.isOwnPlayer(player)?this.level:player.level'),
 'Own level appears immediately while other cards use the admin snapshot');
assert(html.includes('friend-profile-button')&&html.includes('friend-showcase-veil')&&html.includes('friend-showcase-courses')&&angular.includes('openPlayerProfile(player:PublicPlayer)'),
 'Public player profiles show cosmetics, level, and completed lessons in a modal');
assert(shopCss.includes('.friend-showcase-veil > .friend-showcase.universe{display:block;')
 &&shopCss.includes('.friend-showcase.universe > .friend-showcase-cover.hero{width:100%;')
 &&shopCss.includes('.friend-showcase-loadout{grid-template-columns:1fr;gap:8px}'),
 'The modal must override the page flex layout and keep cosmetic names readable on phones');
assert(!html.includes('friends-summary')&&!html.includes('friends-directory-note')&&!html.includes('friends-refresh'),
 'Friends page removes clutter and manual refresh button');
assert(html.includes('friends-list')&&html.includes('friend-character'),
 'Friend character cards remain visible');
assert(/<div class="top-pills">[\s\S]*?class="top-pill token"[\s\S]*?class="top-friends-link"[\s\S]*?class="top-profile-link"/.test(html),
 'Friends button must be in the right header between TastyTokens and Mein Profil');
assert(!/<div class="topbar-left">[\s\S]*?class="top-friends-link"[\s\S]*?<\/div>\s*<div class="top-pills">/.test(html),
 'Friends button must not remain among the left breadcrumbs');
assert(html.includes('player.avatar')&&html.includes('player.title')&&html.includes('player.nickname'),
 'Friends cards keep the avatar, title and name');
assert(html.includes('SPIELERVERZEICHNIS')&&html.includes('alphabetisch')===false,
 'Friends list must no longer falsely claim to be a verified leaderboard');
assert(html.includes("Nur")===true,'Main app page still renders');
assert(!html.includes('VERIFIZIERTE SPIELER'),'The social directory must not claim verified scores');
assert(!html.includes('No backend available'),'No placeholder error instead of working directory');
assert(html.includes('id="shop-drop-select"')&&html.includes('(ngModelChange)="chooseDrop($event)"'),
 'Shop remains unaffected');
assert(shopCss.includes('COSMETIC CATEGORY SIGNATURES')&&css.includes('.profile-view .profile-grid'),
 'Other site UI remains unaffected');
assert(angular.includes('publishFriendCard(')&&angular.includes('this.cloud.publishFriendProfile('),
 'Existing account cards and user cosmetics must sync from the app');
const registerPath=angular.slice(angular.indexOf('async submitCloudAccount(){'),
 angular.indexOf('private clearDeviceProgress(){'));
const afterHydration=registerPath.indexOf("this.cloudHydrating=false;this.cloudBusy=false;this.cloudStage='';");
const publishes=registerPath.indexOf("void this.refreshExclusiveTitle().then(()=>this.publishFriendCard());");
assert(afterHydration>0&&publishes>afterHydration,
 'New registrations and sign-ins must load entitlements before publishing their public card after hydration');
assert(registerPath.includes("if(this.cloud.session&&this.cloudMaySave&&this.cloudStatus==='✓ Online gespeichert')"),
 'Only a fully saved online account may publish its public social card');
assert(registerPath.includes("await this.cloud.save(this.cloudSnapshot());"),
 'Registration persists the private save before publishing a public card');

assert(angular.includes('void this.publishFriendCard(true)'),
 'Explicit nickname changes must update friends without overriding admin corrections during login');
const session={uid:'user-123',username:'niko',idToken:'token-123',refreshToken:'refresh-123',expiresAt:Date.now()+3600_000};
const store=new Map([['studyverse_cloud_session_v1',JSON.stringify(session)]]);
const requests=[];
const doc=(uid,nickname,level=0,title='Weltenentdecker',extra={})=>({
 name:'projects/t/databases/(default)/documents/publicProfiles/'+uid,
 fields:{nickname:{stringValue:nickname},avatar:{stringValue:'🧪'},
   title:{stringValue:title},level:{integerValue:String(level)},...extra}
});
let page=0;
let existing={name:'projects/t/databases/(default)/documents/publicProfiles/user-123',
 fields:{nickname:{stringValue:'Korrigierter Name'},level:{integerValue:'31'},
  avatar:{stringValue:'🧪'},title:{stringValue:'Cheater'}}};
const fetch=async(url,opts={})=>{
 url=String(url);
 const method=opts.method||'GET';
 requests.push({url,method,body:opts.body?JSON.parse(opts.body):null});
 if(url.endsWith('cloud-config.json'))return {ok:true,json:async()=>({apiKey:'public-example-key-over-fifteen',projectId:'studyverse-unit-tests'})};
 if(url.includes('/publicProfiles?')){
  const docs=page++===0?
   [doc('user-123','Korrigierter Name',31,'Cheater',{selectedTitle:{stringValue:'Weltenentdecker'}}),
    doc('a','Gwendi',3),doc('bad','n*gga',70000)]:
   [doc('b','Kogi',99999),doc('c','Niki',5)];
  return {ok:true,json:async()=>({documents:docs,...(page===1?{nextPageToken:'next-page'}:{})})};
 }
 if(url.includes('/publicProfiles/user-123')){
  if(method==='GET')return {ok:true,status:200,json:async()=>existing};
  if(method==='PATCH'){
   const fields=JSON.parse(opts.body).fields;
   for(const [key,value] of Object.entries(fields))existing.fields[key]=value;
   return {ok:true,json:async()=>existing};
  }
 }
 if(url.includes('/publicProfiles/new-user')){
  if(method==='GET')return {ok:false,status:404,json:async()=>({})};
  if(method==='PATCH')return {ok:true,json:async()=>({})};
 }
 throw Error('Unexpected request '+method+' '+url);
};
const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleStub={exports:{}};
const sandbox={module:moduleStub,exports:moduleStub.exports,fetch,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
 document:{baseURI:'https://example.com/studyverse/'},URL,URLSearchParams,AbortController,Date,
 setTimeout,clearTimeout,console};
vm.runInNewContext(out,sandbox);
const {StudyverseCloud,isAllowedNickname,hasExclusiveCheaterTitle,visiblePublicTitle,parsePublicShowcase}=moduleStub.exports;
assert.equal(parsePublicShowcase(JSON.stringify({
  theme:'gold',frame:'gold',banner:'pink_paradise',font:'serif',
  courses:[{id:'dsai-test-01',done:8,total:16,percent:999}]
})).courses[0].percent,50,'Recalculate percentages from validated completion totals');
assert.equal(parsePublicShowcase('broken').theme,'base','Old and corrupted cards use safe defaults');
assert.equal(parsePublicShowcase(JSON.stringify({theme:'url(evil)',courses:[{id:'x',done:999,total:1}]})).courses.length,0,
 'Reject CSS injection and invalid progression data');
assert(isAllowedNickname('Niko')&&isAllowedNickname('Johannes 42'),'Legitimate nicknames permitted');
assert(!isAllowedNickname('n*gga')&&!isAllowedNickname('n1gga')&&!isAllowedNickname('admin'),
 'Known abusive or impersonating nicknames filtered');
assert.equal(visiblePublicTitle({title:{stringValue:'Cheater'},selectedTitle:{stringValue:'Weltenentdecker'}}),'Weltenentdecker');
assert.equal(visiblePublicTitle({title:{stringValue:'Cheater'},selectedTitle:{stringValue:'Cheater'}}),'Cheater');
assert.equal(visiblePublicTitle({selectedTitle:{stringValue:'Cheater'}}),'Weltenentdecker',
 'Client-supplied title alone cannot forge the exclusive title in the public directory');
assert.equal(hasExclusiveCheaterTitle({exclusiveItems:{arrayValue:{values:[{stringValue:'exclusive_title_cheater'}]}}}),true);
assert(angular.includes("item.id==='exclusive_title_cheater'?this.exclusiveCheaterTitle")&&
 angular.includes("i.id!=='exclusive_title_cheater'||this.exclusiveCheaterTitle"),
 'Exclusive item ownership and equipped display must require the admin entitlement');
(async()=>{
 const cloud=new StudyverseCloud();
 await cloud.initialize();
 const entries=await cloud.listPublicProfiles();
 assert.equal(entries.length,4,'Show legitimate names, not one offensive entry');
 assert.equal(entries.map(x=>x.nickname).join(','),'Kogi,Korrigierter Name,Niki,Gwendi',
  'Friends sort by historical level descending, not by nickname');
 assert.equal(entries.map(x=>x.level).join(','),'99999,31,5,3',
  'Read existing immutable public level only; never source it from localStorage');
 assert.equal(entries.find(x=>x.uid==='user-123').title,'Weltenentdecker',
  'The exclusive title must not override the actually equipped title');
 assert.equal(entries.find(x=>x.uid==='user-123').level,31,'Existing level may be shown as a provisional value');
 assert.equal(await cloud.hasExclusiveCheaterTitle(),true,
  'The old admin-only title grants the exclusive inventory entitlement');
 await cloud.publishFriendProfile('Altes Profil','🐱','Matheprofi');
 const update=requests.at(-1);
 assert.equal(update.method,'PATCH');
 assert(!update.url.includes('level')&&!Object.hasOwn(update.body.fields,'nickname'),
  'Automatic cosmetics sync must NEVER overwrite a Firebase-admin-corrected nickname');
 assert(!Object.hasOwn(update.body.fields,'level')&&!Object.hasOwn(update.body.fields,'title'),
  'Automatic owner sync must NEVER overwrite unverified levels or moderator-assigned titles');
 assert.equal(existing.fields.nickname.stringValue,'Korrigierter Name','Admin-corrected nickname preserved');
 assert.equal(existing.fields.title.stringValue,'Cheater','Cheater title preserved');
 assert.equal(existing.fields.level.integerValue,'31','Existing public level is never overwritten by the browser');
 await cloud.publishFriendProfile('Neuer Name','🐱','Matheprofi',true);
 assert.equal(existing.fields.nickname.stringValue,'Neuer Name','Explicit user nickname change must sync');
 cloud.session={...session,uid:'new-user'};
 await cloud.publishFriendProfile('NeuDabei','🧪','Weltenentdecker');
 const create=requests.at(-1);
 assert.deepEqual(Object.keys(create.body.fields).sort(),['avatar','nickname','selectedTitle','showcase','updatedAt'].sort(),
  'New public cards contain no level, XP or token balances');
 assert(!requests.some(x=>x.url.includes('/verifiedProfiles')||x.url.includes('/users/')),
  'Publishing friends never touches competitive scores or private saves');
 console.log('PASS: Friends ranking returns from immutable legacy levels; old cosmetics/admin title preserved, no new level writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
