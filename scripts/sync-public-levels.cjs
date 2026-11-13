#!/usr/bin/env node
'use strict';
/**
 * Admin-only PUBLIC DISPLAY LEVEL sync. Never accepts a browser-supplied
 * level, never modifies private saves, wallets, tokens, inventories or titles.
 * Reads existing legacy (currently client-editable) XP and publishes a
 * PROVISIONAL display level, not a verified anti-cheat score.
 * GitHub OIDC obtains short-lived access tokens; no service account JSON keys.
 */
const PROJECT='studyverse-logins';
const BASE='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const levelFor=xp=>1+Math.floor(Math.sqrt(xp/110));
const validUid=uid=>/^[A-Za-z0-9_-]{6,160}$/.test(uid);
const trainerKeys={
 'nawi-test-01':'chemverse_niklas_v1',
 'dsai-test-01':'dsai_studyverse_v1',
 'pos-pa-01':'sharpverse_pa01_v1',
 'maths-hw-02':'mathsverse_hw02_v1'
};
function profileFromDoc(doc){
 try{
  const raw=doc?.fields?.profile?.stringValue;
  if(typeof raw!=='string')return null;
  const envelope=JSON.parse(raw),p=envelope?.profile;
  if(!p||typeof p!=='object'||!Number.isSafeInteger(p.xp)||p.xp<0)return null;
  return p;
 }catch{return null}
}
// Standalone learning worlds upload their progress before the home page applies
// the XP delta. Project that pending delta for display without changing the
// private save. trainerSaves records how much was already included globally.
function displayXpFromDoc(doc,p){
 try{
  const envelope=JSON.parse(doc.fields.profile.stringValue);
  const bridge=envelope.bridge,id=bridge?.id;
  if(!Object.hasOwn(trainerKeys,id)||bridge.saveKey!==trainerKeys[id]||
   !Number.isSafeInteger(bridge.xp)||bridge.xp<0)return p.xp;
  const next=envelope.trainers?.[id]?.xp;
  const included=p.trainerSaves?.[id]?.xp;
  if(!Number.isSafeInteger(next)||next<0||
   (included!==undefined&&(!Number.isSafeInteger(included)||included<0)))return p.xp;
  const xp=p.xp+Math.max(0,next-Math.max(bridge.xp,included??0));
  return Number.isSafeInteger(xp)?xp:p.xp;
 }catch{return p.xp}
}
function allowedName(v){
 if(typeof v!=='string')return false;
 let n=v.trim();if(n.length<2||n.length>24||!/^[\p{L}\p{N} _.-]+$/u.test(n))return false;
 n=n.normalize('NFKD').toLowerCase().replace(/[4@]/g,'a').replace(/3/g,'e')
  .replace(/[1!|]/g,'i').replace(/0/g,'o').replace(/9/g,'g').replace(/[^a-z]/g,'');
 return !/n(?:i)?gg(?:a|e|er|ers)|^(?:admin|administrator|moderator|support|studyverse)$/.test(n);
}
const courseTotals={'nawi-test-01':13,'dsai-test-01':16,'pos-pa-01':20};
function showcaseFromDoc(doc,p){
 const defaults={theme:'base',frame:'none',banner:'default',font:'standard',atm:'none',fx:'none'};
 const equipped=p.equipped&&typeof p.equipped==='object'?p.equipped:{};
 const showcase={};
 for(const [key,fallback] of Object.entries(defaults)){
  const value=equipped[key];
  showcase[key]=typeof value==='string'&&/^[a-z0-9_-]{1,40}$/.test(value)?value:fallback;
 }
 let envelope={};
 try{envelope=JSON.parse(doc?.fields?.profile?.stringValue||'{}')}catch{}
 const trainers=envelope.trainers&&typeof envelope.trainers==='object'?envelope.trainers:{};
 const saved=p.trainerSaves&&typeof p.trainerSaves==='object'?p.trainerSaves:{};
 showcase.courses=[];
 for(const [id,total] of Object.entries(courseTotals)){
  const trainer=trainers[id]||saved[id]||(id==='nawi-test-01'?p.chemverseSave:null);
  const completed=trainer?.courseDone;
  if(!completed||typeof completed!=='object'||Array.isArray(completed))continue;
  const done=Math.min(total,Object.values(completed).filter(v=>v===true).length);
  if(done)showcase.courses.push({id,done,total,percent:Math.round(done/total*100)});
 }
 return JSON.stringify(showcase);
}
function fieldsForNewCard(p,doc){
 return {nickname:{stringValue:p.nickname},avatar:{stringValue:typeof p.equipped?.avatar==='string'&&p.equipped.avatar.length<=20?p.equipped.avatar:'🧪'},
  selectedTitle:{stringValue:'Weltenentdecker'},showcase:{stringValue:showcaseFromDoc(doc,p)},updatedAt:{timestampValue:new Date().toISOString()},
  level:{integerValue:String(levelFor(p.xp))}};
}
async function run({token,fetcher=fetch,base=BASE,project=PROJECT,readOnly=false}){
 if(!token||token.length<30)throw Error('Missing short-lived OIDC access token');
 if(project!==PROJECT)throw Error('Unexpected Firebase project');
 const api=async(url,method='GET',body)=>{
  const r=await fetcher(url,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},
   ...(body?{body:JSON.stringify(body)}:{})});
  if(r.status===404)return null;
  if(!r.ok){const msg=await r.text();throw Error('Firestore '+method+' '+r.status+': '+msg.slice(0,350));}
  return r.json();
 };
 const users=[];let cursor='';
 for(let page=0;page<100;page++){
  const data=await api(base+'/users?pageSize=100'+(cursor?'&pageToken='+encodeURIComponent(cursor):''));
  if(!data)break;
  users.push(...(data.documents||[]));cursor=data.nextPageToken||'';if(!cursor)break;
  if(page===99)throw Error('User pagination safety cap reached');
 }
 let patched=0,created=0,skipped=0,pendingVerse=0,showcasesBackfilled=0;
 const globalLevels={},projectedLevels={},publicLevels={};
 const count=(counts,level)=>{counts[level]=(counts[level]||0)+1};
 for(const doc of users){
  const uid=doc.name?.split('/').pop(),p=profileFromDoc(doc);
  if(!validUid(uid||'')||!p){skipped++;continue;}
  const url=base+'/publicProfiles/'+encodeURIComponent(uid);
  const existing=await api(url);
  const displayXp=displayXpFromDoc(doc,p);
  const desired=String(levelFor(displayXp));
  count(globalLevels,levelFor(p.xp));count(projectedLevels,Number(desired));
  if(displayXp>p.xp)pendingVerse++;
  if(existing)count(publicLevels,existing.fields?.level?.integerValue||'unset');
  if(existing){
   // Preserve owner/admin-corrected nicknames, moderator titles, avatars.
   const fields={};
   if(existing.fields?.level?.integerValue!==desired)fields.level={integerValue:desired};
   // Older cards had no showcase. Fill that gap without overwriting a player's
   // newer self-published cosmetics or their administrator-managed fields.
   if(existing.fields?.showcase?.stringValue===undefined){
    fields.showcase={stringValue:showcaseFromDoc(doc,p)};
    showcasesBackfilled++;
   }
   if(!Object.keys(fields).length){skipped++;continue;}
   if(!readOnly)await api(url+'?'+Object.keys(fields).map(k=>'updateMask.fieldPaths='+k).join('&'),'PATCH',{fields});
   patched++;
  }else if(allowedName(p.nickname)){
   // Repair older failed registrations without modifying private balance.
   if(!readOnly)await api(url,'PATCH',{fields:fieldsForNewCard({...p,xp:displayXp},doc)});
   created++;
  }else skipped++;
 }
 console.log('Studyverse provisional public levels: scanned='+users.length+
  ' updated='+patched+' missing_cards_created='+created+' showcases_backfilled='+showcasesBackfilled+' unchanged_or_skipped='+skipped+
  (readOnly?' (dry run)':''));
 console.log('XP remains user-editable until backend verification; this is a DISPLAY rank only.');
 console.log('Rank diagnostics (aggregate): global='+JSON.stringify(globalLevels)+
  ' projected='+JSON.stringify(projectedLevels)+' public='+JSON.stringify(publicLevels)+
  ' pending_verse='+pendingVerse);
 return {scanned:users.length,patched,created,skipped};
}
if(require.main===module){
 const token=process.env.GCLOUD_ACCESS_TOKEN;
 run({token,readOnly:process.argv.includes('--dry-run')}).catch(e=>{console.error('Rank sync failed:',e.message);process.exitCode=1});
}
module.exports={levelFor,profileFromDoc,displayXpFromDoc,allowedName,showcaseFromDoc,fieldsForNewCard,run};
