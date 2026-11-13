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
function fieldsForNewCard(p){
 return {nickname:{stringValue:p.nickname},avatar:{stringValue:typeof p.equipped?.avatar==='string'&&p.equipped.avatar.length<=20?p.equipped.avatar:'🧪'},
  selectedTitle:{stringValue:'Weltenentdecker'},updatedAt:{timestampValue:new Date().toISOString()},
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
 let patched=0,created=0,skipped=0,pendingVerse=0;
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
   if(existing.fields?.level?.integerValue===desired){skipped++;continue;}
   if(!readOnly)await api(url+'?updateMask.fieldPaths=level','PATCH',
    {fields:{level:{integerValue:desired}}});
   patched++;
  }else if(allowedName(p.nickname)){
   // Repair older failed registrations without modifying private balance.
   if(!readOnly)await api(url,'PATCH',{fields:fieldsForNewCard({...p,xp:displayXp})});
   created++;
  }else skipped++;
 }
 console.log('Studyverse provisional public levels: scanned='+users.length+
  ' updated='+patched+' missing_cards_created='+created+' unchanged_or_skipped='+skipped+
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
module.exports={levelFor,profileFromDoc,displayXpFromDoc,allowedName,fieldsForNewCard,run};
