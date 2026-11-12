'use strict';
// Moderation notices are issued by Firestore administrators; they never ban
// players automatically. Dismissal is a UX preference, not proof of admission.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('src/app/cloud.ts','utf8');
const app=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
const css=fs.readFileSync('src/app/app.scss','utf8');
const rules=fs.readFileSync('firestore.rules','utf8');
assert.equal(rules,fs.readFileSync('firebase/firestore.rules','utf8'),'Rules files must match');
assert(/match \/accountNotices\/\{userId\}/.test(rules) &&
 /match \/accountNotices\/\{userId\}\s*\{[\s\S]*?allow get: if request.auth != null && request.auth.uid == userId;[\s\S]*?allow list, create, update, delete: if false;/.test(rules),
 'Only the authenticated recipient may read a notice; clients may never issue one');
assert(/match \/accountNoticeAcks\/\{userId\}/.test(rules) &&
 rules.includes("request.resource.data.keys().hasOnly(['noticeId','acknowledgedAt'])") &&
 rules.includes('request.resource.data.acknowledgedAt is timestamp'),
 'Acknowledgement must contain only the notice ID and a timestamp, owner-only');
assert(app.includes('readAccountNotice()')&&app.includes('noticeAcknowledged(')&&app.includes('acknowledgeNotice('),
 'App must check the correct UID and store the one-time dismissal');
assert(app.includes("get('warningPreview')==='1'") &&
 app.includes("write('studyverse_fairplay_preview_seen_'+uid,'1')"),
 'Preview must be opt-in and shown once per browser/account, with no sanction');
assert(html.includes('OFFIZIELLE STUDYVERSE-VERWARNUNG') &&
 html.includes('KEINE ECHTE VERWARNUNG') &&
 html.includes('(click)="acknowledgeAccountNotice()"'),
 'Warning and preview must use same alertdialog with acknowledgement');
assert(html.includes('keine automatische Sperre oder Löschung') &&
 html.includes('persönlicher Prüfung'),
 'Warning must state clearly that bans are never automated');
assert(!app.includes('deleteAccount(')&&!app.includes('disableAccount('),
 'The app must never automatically delete or disable an account');
assert(css.includes('.moderation-modal')&&css.includes('@media(max-width:520px)'),
 'One-time warning must be readable on desktop and small phones');

const token='token-warning-123',uid='paul-firebase-uid',noticeId='fairplay-paul-2026-11-12';
const session={uid,username:'paul',idToken:token,refreshToken:'refresh-123',expiresAt:Date.now()+3600_000};
const state=new Map([['studyverse_cloud_session_v1',JSON.stringify(session)]]);
const requests=[];let active=true;let savedId='';
const fetch=async(url,options={})=>{
 url=String(url);const method=options.method||'GET';requests.push({url,method,body:options.body});
 if(url.endsWith('/cloud-config.json'))return {ok:true,json:async()=>({apiKey:'test-public-web-api-key-123456',projectId:'studyverse-tests'})};
 if(url.endsWith('/accountNotices/'+uid))return {
   ok:true,status:200,json:async()=>({fields:{
     kind:{stringValue:'fairplay-warning'},id:{stringValue:noticeId},active:{booleanValue:active}}})};
 if(url.includes('/accountNoticeAcks/'+uid)){
   if(method==='GET')return savedId?
     {ok:true,status:200,json:async()=>({fields:{noticeId:{stringValue:savedId}}})}:
     {ok:false,status:404,json:async()=>({})};
   if(method==='PATCH'){
     const fields=JSON.parse(options.body).fields;
     assert.deepEqual(Object.keys(fields).sort(),['acknowledgedAt','noticeId']);
     savedId=fields.noticeId.stringValue;
     return {ok:true,json:async()=>({fields})};
   }
 }
 throw Error('Unexpected fetch '+method+' '+url);
};
const transpiled=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
const sandbox={module:mod,exports:mod.exports,fetch,
 localStorage:{getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,String(v)),removeItem:k=>state.delete(k)},
 document:{baseURI:'https://example.com/studyverse/'},URL,URLSearchParams,AbortController,Date,
 setTimeout,clearTimeout,console};
vm.runInNewContext(transpiled,sandbox);
const {StudyverseCloud}=mod.exports;
(async()=>{
 const cloud=new StudyverseCloud();
 await cloud.initialize();
 assert.equal(cloud.session.uid,uid,'Session preserved');
 const notice=await cloud.readAccountNotice();
 assert.equal(notice.id,noticeId,'Targeted warning loaded from OWN authenticated UID');
 assert.equal(notice.kind,'fairplay-warning','Unsupported notice types ignored');
 assert.equal(await cloud.noticeAcknowledged(noticeId),false,'Notice initially unread');
 await cloud.acknowledgeNotice(noticeId);
 assert.equal(await cloud.noticeAcknowledged(noticeId),true,'Dismissal stored across devices');
 assert.equal(await cloud.noticeAcknowledged('fairplay-paul-2026-12-11'),false,
   'A NEW admin-issued notice shows again even after previous dismissal');
 assert.equal(requests.filter(r=>r.url.includes('/accountNotices/')).length,1,'Notice only read, not modified');
 assert(!requests.some(r=>r.url.includes('/accountNotices/')&&r.method!=='GET'),
   'No client may create/edit a sanction');
 assert(requests.some(r=>r.url.includes('/accountNoticeAcks/')&&r.method==='PATCH'),
   'Acknowledgement must be persisted in own Firestore document');
 active=false;
 assert.equal(await cloud.readAccountNotice(),null,'A deactivated notice is not shown');
 cloud.signOut();
 await assert.rejects(()=>cloud.readAccountNotice(),/anmelden/);
 console.log('PASS: admin-only fair-play warning, Firebase UID isolation, once-per-notice acknowledgement, no automatic bans, preview UI.');
})().catch(error=>{console.error(error);process.exitCode=1});
