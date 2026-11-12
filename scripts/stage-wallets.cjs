#!/usr/bin/env node
'use strict';
/**
 * Safe, pre-cutover Studyverse wallet shadow copy.
 *
 * Does NOT modify legacy profiles, XP rules, shop, tokens in browser,
 * Firestore security rules, verified public ranks or Firebase Authentication.
 * Every wallet is created with migrationApproved=false and
 * migrationStage='shadow'. The live app continues to use /users/{uid}.profile.
 *
 * Usage:
 * node scripts/stage-wallets.cjs --project studyverse-logins --report security-reports/wallet-report.json
 * node scripts/stage-wallets.cjs --project studyverse-logins --report security-reports/wallet-report.json --stage --owner-approved-unchanged
 * node scripts/stage-wallets.cjs --project studyverse-logins --report security-reports/wallet-report.json --audit
 *
 * When legacy progress changes, rescan and use --stage --refresh-shadow
 * --owner-approved-unchanged to replace only not-yet-activated shadow wallets.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const args=process.argv.slice(2);
const arg=(key)=>{const i=args.indexOf(key);return i<0?null:args[i+1]||null;};
const project=arg('--project'),reportPath=arg('--report');
const stage=args.includes('--stage'),audit=args.includes('--audit');
const refresh=args.includes('--refresh-shadow');
const approve=args.includes('--owner-approved-unchanged');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const saneNumber=n=>Number.isSafeInteger(n)&&n>=0;
const safeUid=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{6,160}$/.test(s);
const badFlags=new Set(['INVALID_LEGACY_PROFILE','INVALID_TOKENS_VALUE','INVALID_XP_VALUE','INVALID_INVENTORY','REVIEW_XP_SPIKE','REVIEW_INVENTORY_SPIKE']);
const safeNickname=e=>(e.flags||[]).includes('REVIEW_NICKNAME')?'[Name zur Prüfung]':String(e.nickname||'(unbekannt)').slice(0,32);
function inspectReport(data){
  if(!data||!data.readOnly||data.project!==project||!Array.isArray(data.entries)||!data.entries.length)
    throw Error('Invalid report/project; run the read-only scan again');
  if(new Set(data.entries.map(e=>e.uid)).size!==data.entries.length)
    throw Error('Duplicate user IDs in report');
  const created=Date.parse(data.scannedAt||'');
  if(!Number.isFinite(created)||created>Date.now()+120000)throw Error('Invalid scan timestamp');
  for(const e of data.entries){
    if(!safeUid(e.uid)||!saneNumber(e.tokens)||!saneNumber(e.xp)||
      !Array.isArray(e.inventory)||e.inventory.some(x=>typeof x!=='string'||x.length>100)||
      new Set(e.inventory).size!==e.inventory.length||
      !/^[0-9a-f]{64}$/.test(e.sourceHash||''))throw Error('Invalid wallet source data for '+String(e.uid).slice(-5));
    if((e.flags||[]).some(f=>badFlags.has(f)||!['REVIEW_TOKENS_SPIKE','REVIEW_NICKNAME'].includes(f)))
      throw Error('Needs separate manual review: '+safeNickname(e));
  }
  return data.entries;
}
function legacyWallet(doc){
  const raw=doc?.profile;
  if(typeof raw!=='string')throw Error('Missing legacy JSON profile');
  const wrapper=JSON.parse(raw);
  if(!wrapper?.profile||typeof wrapper.profile!=='object')throw Error('Missing legacy profile');
  const p=wrapper.profile;
  if(!saneNumber(p.tokens)||!saneNumber(p.xp)||
     !Array.isArray(p.inventory)||p.inventory.some(x=>typeof x!=='string'||x.length>100)||
     new Set(p.inventory).size!==p.inventory.length)
    throw Error('Legacy wallet malformed: refuse implicit changes');
  return {raw,sourceHash:digest(raw),tokens:p.tokens,xp:p.xp,inventory:p.inventory};
}
const same=(a,b)=>a?.tokens===b?.tokens&&a?.xp===b?.xp&&
  JSON.stringify(a?.inventory)===JSON.stringify(b?.inventory);
async function main(){
  if(!project||!/^[a-z][a-z0-9-]{4,60}$/.test(project)||!reportPath||
    (stage&&audit)||(refresh&&!stage)||(stage&&!approve)){
    throw Error('Usage: --project PROJECT --report REPORT [--stage --owner-approved-unchanged [--refresh-shadow] | --audit]');
  }
  const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
  const entries=inspectReport(report);
  console.log('Studyverse shadow wallet migration | '+project+' | '+entries.length+' accounts');
  console.log('PRESERVES XP FORMULAS, SHOP, LEGACY DATA AND LIVE APPLICATION.');
  console.log('All imported balances are exact copies. Suspected bonus flags are not penalties.');
  if(!stage&&!audit){
    for(const e of entries)console.log(safeNickname(e)+': XP='+e.xp+' TT='+e.tokens+' items='+e.inventory.length+
      ' '+(e.flags||[]).join(','));
    console.log('PREVIEW ONLY: no Firestore access and no writes.');
    return;
  }
  const functionsDir=path.resolve(__dirname,'../functions');
  const requireAdmin=n=>require(require.resolve(n,{paths:[functionsDir]}));
  const {initializeApp,applicationDefault}=requireAdmin('firebase-admin/app');
  const {getFirestore,FieldValue}=requireAdmin('firebase-admin/firestore');
  initializeApp({projectId:project,...(process.env.FIRESTORE_EMULATOR_HOST?{}:{credential:applicationDefault()})});
  const db=getFirestore();
  const docs=await db.collection('users').get();
  const actual=new Map(docs.docs.map(x=>[x.id,x]));
  if(actual.size!==entries.length||entries.some(e=>!actual.has(e.uid)))
    throw Error('The account set changed since the report. Re-scan all accounts first.');
  // Validate ALL legacy saves BEFORE any write.
  const current=[];
  for(const e of entries){
    const snap=actual.get(e.uid);
    const copy=legacyWallet(snap.data());
    if(copy.sourceHash!==e.sourceHash||!same(copy,e))
      throw Error('Account progress changed since the report: '+safeNickname(e)+'. Run --scan again.');
    current.push({entry:e,source:copy,fullLegacy:snap.data()});
  }
  if(audit){
    let drift=0,missing=0;
    for(const {entry:e,source} of current){
      const walletSnap=await db.doc('users/'+e.uid+'/wallet/tokens').get();
      if(!walletSnap.exists){missing++;console.log('MISSING shadow: '+safeNickname(e));continue;}
      const w=walletSnap.data();
      if(w.migrationApproved!==false||w.migrationStage!=='shadow'||!same(w,source)||
         w.migrationSourceHash!==source.sourceHash){
        drift++;console.log('DIFFERENT: '+safeNickname(e));
      }
    }
    console.log('AUDIT: '+(entries.length-missing-drift)+' match / '+missing+' missing / '+drift+' mismatched.');
    if(missing||drift)process.exitCode=2;
    return;
  }
  const age=Date.now()-Date.parse(report.scannedAt);
  if(age>60*60*1000)throw Error('Report older than one hour. Re-scan before applying.');
  // Private recovery snapshot of every legacy document before writing new
  // shadow docs. NOT a replacement for a full Firestore managed export.
  const archiveDir=path.resolve(path.dirname(reportPath));
  const name='legacy-users-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
  fs.mkdirSync(archiveDir,{recursive:true,mode:0o700});
  const backup=path.join(archiveDir,name);
  fs.writeFileSync(backup,JSON.stringify({project,at:new Date().toISOString(),
    docs:current.map(x=>({uid:x.entry.uid,data:x.fullLegacy}))},null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log('Private recovery copy saved locally: '+backup);
  let created=0,updated=0,skipped=0;
  for(const {entry:e} of current){
    const user=db.doc('users/'+e.uid),wallet=user.collection('wallet').doc('tokens');
    const result=await db.runTransaction(async tx=>{
      const [old,existing]=await tx.getAll(user,wallet);
      if(!old.exists)throw Error('Legacy profile disappeared: '+safeNickname(e));
      const copy=legacyWallet(old.data());
      if(copy.sourceHash!==e.sourceHash||!same(copy,e))
        throw Error('Live progress changed during migration for '+safeNickname(e)+'. Re-scan.');
      if(existing.exists){
        const w=existing.data();
        if(w?.migrationStage!=='shadow'||w?.migrationApproved!==false)
          throw Error('Already activated/unrecognized wallet: '+safeNickname(e)+'. Refuse overwrite.');
        if(w.migrationSourceHash===copy.sourceHash&&same(w,copy))return 'skipped';
        if(!refresh)throw Error('Shadow differs from current progress: '+safeNickname(e)+'. Re-scan and use --refresh-shadow.');
        tx.update(wallet,{tokens:copy.tokens,xp:copy.xp,inventory:copy.inventory,
          migrationSourceHash:copy.sourceHash,updatedAt:FieldValue.serverTimestamp()});
        return 'updated';
      }
      tx.create(wallet,{tokens:copy.tokens,xp:copy.xp,inventory:copy.inventory,
        migrationApproved:false,migrationStage:'shadow',migrationSourceHash:copy.sourceHash,
        version:1,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
      return 'created';
    });
    if(result==='created')created++;
    if(result==='updated')updated++;
    if(result==='skipped')skipped++;
    console.log('SHADOW '+result+': '+safeNickname(e)+' | XP='+e.xp+' TT='+e.tokens+' items='+e.inventory.length);
  }
  console.log('DONE: '+created+' created, '+updated+' refreshed, '+skipped+' unchanged.');
  console.log('NO account activated, NO legacy progress changed, NO XP/shop changes, NO deployment.');
  console.log('Continue playing normally. Shadow copies must be refreshed again before later XP/shop cutover.');
}
if(require.main===module)main().catch(e=>{console.error('STOP:',e.message);process.exitCode=1});
module.exports={legacyWallet,same,digest};
