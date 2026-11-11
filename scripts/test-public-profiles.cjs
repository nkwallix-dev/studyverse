'use strict';
// Public player directory regression: display safe cosmetics, never login identity or private saves.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync('src/app/cloud.ts','utf8');
const rules=fs.readFileSync('firestore.rules','utf8');
const angular=fs.readFileSync('src/app/app.ts','utf8');
const template=fs.readFileSync('src/app/app.html','utf8');
const css=fs.readFileSync('src/app/app.scss','utf8');
const shopCss=fs.readFileSync('src/styles.scss','utf8');

assert(rules.includes('match /users/{userId}')&&rules.includes('request.auth.uid == userId'),
 'Original private save must remain owner-only');
assert(rules.includes('match /publicProfiles/{userId}')&&rules.includes("['nickname', 'level', 'avatar', 'title', 'updatedAt']"),
 'Public players must have a distinct collection with an exact field allowlist');
assert(rules.includes('allow get, list: if request.auth != null'),
 'Only authenticated players may read the public directory');
assert(/if\(this\.cloud\.session&&this\.cloudMaySave\)\s*\{\s*(?:\/\/[^\n]*\n\s*)*void this\.publishPlayerProfile\(\);/.test(angular),
 'Existing accounts must auto-publish their display name and level on session hydration, without new progress');
assert((angular.match(/this\.profile\.nickname=this\.cloud\.session\.username/g)||[]).length>=3,
 'Registration, manual sign-in and restored sessions must default Explorer to the short Studyverse account username');
assert(!angular.includes("this.cloud.session!.email")&&!angular.includes("test@studyverse"),
 'Never publish the synthetic Firebase Authentication email address as a display name');
assert(template.includes('player.avatar')&&template.includes('player.title'),'Friends cards must display equipped avatar and title');
assert(template.includes('class="top-friends-link"')&&template.includes("(click)=\"go('friends')\""),
 'Friends button must be in the main topbar');
assert(template.includes('*ngSwitchCase="\'friends\'"')&&template.includes('player.nickname')&&template.includes('player.level'),
 'Friends page displays the editable display name and level');
assert(!template.includes('{{player.uid}}')&&!template.includes('{{player.username}}'),
 'Never display Firebase uid or authentication username on player cards');
assert(template.includes('id="shop-drop-select"')&&template.includes('(ngModelChange)="chooseDrop($event)"'),
 'Compact drop picker must be a working select control');
assert(!template.includes('class="shop-drop-grid"')&&!template.includes('class="shop-drop-card"')&&!template.includes('class="drop-stage"'),
 'Bulky multi-row drop cards and second info panel must be removed');
assert(template.includes('class="item-name-type"')&&template.includes('itemNameSuffix(item)'),
 'Item type must be prominent in the item name itself');
assert(shopCss.includes('COSMETIC CATEGORY SIGNATURES'),
 'Cosmetic categories must use decorative accents separate from equipped frames');
assert(template.includes('class="profile-view"')&&css.includes('.profile-view .profile-grid'),
 'Profile settings must be compact and layout-scoped');

const requests=[];
const session={uid:'firebase-user-123',username:'db_login_name',idToken:'token-123',refreshToken:'refresh-123',expiresAt:Date.now()+3600_000};
const values=new Map([['studyverse_cloud_session_v1',JSON.stringify(session)]]);
const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
const replies=[
 {documents:[{name:'projects/t/databases/(default)/documents/publicProfiles/a',fields:{nickname:{stringValue:'Gwendi'},level:{integerValue:'3'}}}],
  nextPageToken:'next-page'},
 {documents:[{name:'projects/t/databases/(default)/documents/publicProfiles/b',fields:{nickname:{stringValue:'Kogi'},level:{integerValue:'5'}}},
 {name:'projects/t/databases/(default)/documents/publicProfiles/c',fields:{nickname:{stringValue:'Niki'},level:{integerValue:'8'}}}]}
];
const fetch=async(url,opts={})=>{
 requests.push({url:String(url),method:opts.method||'GET',headers:opts.headers||{},body:opts.body});
 if(String(url).endsWith('cloud-config.json'))return {ok:true,json:async()=>({apiKey:'sample-public-web-api-key',projectId:'studyverse-login-tests'})};
 if(String(url).includes('publicProfiles')&&opts.method==='PATCH')return {ok:true,json:async()=>({})};
 if(String(url).includes('publicProfiles'))return {ok:true,json:async()=>replies.shift()||{documents:[]}};
 throw Error('Unexpected request '+url);
};
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
const sandbox={module:mod,exports:mod.exports,fetch,localStorage:storage,
  document:{baseURI:'https://example.com/studyverse/'},URL,URLSearchParams,AbortController,Date,
  setTimeout,clearTimeout,console};
vm.runInNewContext(transpiled,sandbox);
const {StudyverseCloud}=mod.exports;
(async()=>{
 const cloud=new StudyverseCloud();
 await cloud.initialize();
 await cloud.publishPublicProfile('Niki',8,'🧪','Weltenentdecker');
 const patch=requests.find(x=>x.method==='PATCH');
 assert(patch.url.endsWith('/publicProfiles/firebase-user-123?updateMask.fieldPaths=nickname&updateMask.fieldPaths=level&updateMask.fieldPaths=avatar&updateMask.fieldPaths=title&updateMask.fieldPaths=updatedAt'),
  'Write only to current user public doc with five explicit update masks');
 const body=JSON.parse(patch.body);
 assert.deepEqual(Object.keys(body.fields).sort(),['avatar','level','nickname','title','updatedAt']);
 assert.equal(body.fields.nickname.stringValue,'Niki');
 assert.equal(body.fields.level.integerValue,'8');
 assert.equal(body.fields.avatar.stringValue,'🧪');
 assert.equal(body.fields.title.stringValue,'Weltenentdecker');
 assert(!JSON.stringify(body).includes('db_login_name')&&!JSON.stringify(body).includes('token-123'),
  'Public document must never include Auth usernames or tokens');
 const entries=await cloud.listPublicProfiles();
 assert.equal(entries.length,3,'Pagination must list all public players, not only one page');
 assert.deepEqual(entries.map(x=>x.nickname).join(','),'Niki,Kogi,Gwendi','Sort by level, descending');
 assert.deepEqual(entries.map(x=>x.level).join(','),'8,5,3','Display exact level from documents');
 assert(requests.filter(x=>x.url.includes('/publicProfiles')&&x.method==='GET').length===2,'Both pages read');
 console.log('PASS: public player directory publishes safe cosmetics with nickname/level, paginates, sorts and protects private saves.');
})().catch(e=>{console.error(e);process.exitCode=1;});
