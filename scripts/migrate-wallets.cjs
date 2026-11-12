#!/usr/bin/env node
'use strict';
/**
 * Owner-only, two-stage migration:
 *  1. --scan --project studyverse-logins --report security-reports/review.json
 *  2. Owner reviews and creates approvals JSON. NO AUTO-APPROVAL.
 *  3. --apply --project studyverse-logins --report ... --approvals ... --confirm-reviewed
 * Requires GOOGLE_APPLICATION_CREDENTIALS pointing to a local, protected
 * administrator credential OR a local gcloud ADC login. Never commit it.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {initializeApp,applicationDefault}=require(require.resolve('firebase-admin/app',{paths:[path.resolve(__dirname,'../functions')]}));
const {getFirestore,FieldValue}=require(require.resolve('firebase-admin/firestore',{paths:[path.resolve(__dirname,'../functions')]}));
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
const project=arg('--project'),reportPath=arg('--report');
const scan=args.includes('--scan'),apply=args.includes('--apply');
if(!project||!/^[a-z][a-z0-9-]{4,60}$/.test(project)||!reportPath||scan===apply){
 console.error('Usage: --scan|--apply --project PROJECT --report FILE [--approvals FILE --confirm-reviewed]');
 process.exit(2);
}
initializeApp({projectId:project,...(process.env.FIRESTORE_EMULATOR_HOST?{}:{credential:applicationDefault()})});
const db=getFirestore();
const parse=raw=>{try{return JSON.parse(raw||'{}')}catch{return {}}};
const sane=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const owned=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string'&&v.length<100))]:[];
const restrictedNickname=value=>{
 if(typeof value!=='string')return false;
 const lookalikes={'а':'a','е':'e','о':'o','і':'i','ѕ':'s'};
 const name=[...value.normalize('NFKC').normalize('NFKD').toLowerCase()]
  .map(c=>lookalikes[c]||c).join('').replace(/[\u0300-\u036f]/g,'')
  .replace(/ß/g,'ss').replace(/[4@]/g,'a').replace(/3/g,'e')
  .replace(/[1!|]/g,'i').replace(/0/g,'o').replace(/[5$]/g,'s')
  .replace(/7/g,'t').replace(/[^a-z]/g,'');
 return /n(?:i|e)?gg(?:a|er|ers)|heilhitler|hurensohn/.test(name);
};

const legacyState=data=>{
 const raw=typeof data?.profile==='string'?data.profile:'';
 const wrapper=parse(raw),p=wrapper?.profile;
 const valid=!!raw&&!!p&&typeof p==='object'&&!Array.isArray(p);
 const profile=valid?p:{};
 return {raw,valid,profile,
   nickname:typeof profile.nickname==='string'?profile.nickname.slice(0,48):'(unbekannt)',
   tokens:sane(profile.tokens),xp:sane(profile.xp),inventory:owned(profile.inventory),
   validTokens:Number.isSafeInteger(profile.tokens)&&profile.tokens>=0,
   validXp:Number.isSafeInteger(profile.xp)&&profile.xp>=0,
   validInventory:Array.isArray(profile.inventory)
 };
};
(async()=>{
 if(scan){
  const docs=await db.collection('users').get(),entries=[];
  for(const doc of docs.docs){
   const record=legacyState(doc.data());
   const sourceUpdatedAt=doc.data().updatedAt?.toDate?.()?.toISOString()||null;
   let days=0;
   try{
    const {getAuth}=require(require.resolve('firebase-admin/auth',{paths:[path.resolve(__dirname,'../functions')]}));
    const user=await getAuth().getUser(doc.id);
    days=Math.max(0,Math.ceil((Date.now()-new Date(user.metadata.creationTime).getTime())/86400000));
   }catch{days=0;}
   const upperBound=4670+750*days+2000;
   const flags=[];
   if(!record.valid)flags.push('INVALID_LEGACY_PROFILE');
   if(!record.validTokens)flags.push('INVALID_TOKENS_VALUE');
   if(!record.validXp)flags.push('INVALID_XP_VALUE');
   if(!record.validInventory)flags.push('INVALID_INVENTORY');
   if(record.tokens>100000||record.tokens>upperBound)flags.push('REVIEW_TOKENS_SPIKE');
   if(record.xp>1000000)flags.push('REVIEW_XP_SPIKE');
   if(record.inventory.length>400)flags.push('REVIEW_INVENTORY_SPIKE');
   if(restrictedNickname(record.nickname))flags.push('REVIEW_NICKNAME');
   const entry={uid:doc.id,nickname:record.nickname,sourceHash:digest(record.raw),sourceUpdatedAt,
    tokens:record.tokens,xp:record.xp,inventory:record.inventory,
    ageDays:days,maxPlausibleTokensEstimate:upperBound,flags};
   entries.push(entry);
   const safeLabel=flags.includes('REVIEW_NICKNAME')?'[nickname requires review]':record.nickname;
   console.log(doc.id+' ('+safeLabel+') XP='+record.xp+' TT='+record.tokens+
     ' inventory='+record.inventory.length+' flags='+flags.join(','));
  }
  const report={project,scannedAt:new Date().toISOString(),readOnly:true,
    notice:'NOT APPROVED: Review each UID and prepare a separate approvals file before apply.',
    entries};
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  // Owner-friendly template: every user starts with decision "review".
  // Applying this template without explicit per-user approval is impossible.
  const templatePath=reportPath.replace(/\.json$/,'')+'.approvals.template.json';
  const template={project,reviewed:false,entries:entries.map(x=>({
    uid:x.uid,sourceHash:x.sourceHash,decision:'review',
    tokens:x.tokens,xp:x.xp,inventory:x.inventory,flags:x.flags
  }))};
  fs.writeFileSync(templatePath,JSON.stringify(template,null,2)+'\n',{mode:0o600});
  console.log('READ-ONLY REPORT: '+reportPath+' (no Firestore writes)');
  console.log('REVIEW TEMPLATE: '+templatePath+' (mark EVERY entry approve or skip, then reviewed=true)');
  return;
 }
 if(!args.includes('--confirm-reviewed')||!arg('--approvals'))throw Error('Manual approvals and --confirm-reviewed required');
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 const approvals=JSON.parse(fs.readFileSync(arg('--approvals'),'utf8'));
 if(report.project!==project||approvals.project!==project||approvals.reviewed!==true ||
    !Array.isArray(approvals.entries))throw Error('Project mismatch or review not confirmed');
 const indexed=new Map(report.entries.map(x=>[x.uid,x]));
 if(approvals.entries.length!==report.entries.length ||
    new Set(approvals.entries.map(x=>x.uid)).size!==approvals.entries.length)
   throw Error('Every legacy user must be reviewed exactly once');
 for(const decision of approvals.entries){
  const source=indexed.get(decision.uid);
  if(!source)throw Error('Unknown UID '+decision.uid);
  if(decision.sourceHash!==source.sourceHash)throw Error('Mismatched sourceHash for '+decision.uid);
  if(decision.decision==='skip'){console.log('Owner skipped '+decision.uid);continue;}
  if(decision.decision!=='approve'||!Number.isSafeInteger(decision.tokens)||decision.tokens<0||
     !Number.isSafeInteger(decision.xp)||decision.xp<0||
     !Array.isArray(decision.inventory)||!decision.inventory.every(x=>typeof x==='string'&&x.length<100)) {
    throw Error('Invalid approval for '+decision.uid);
  }
  // Re-read legacy snapshot inside a transaction: never import stale data.
  const legacy=db.doc('users/'+decision.uid),wallet=db.doc('users/'+decision.uid+'/wallet/tokens'),
    verified=db.doc('verifiedProfiles/'+decision.uid);
  await db.runTransaction(async tx=>{
   const [old,existing]=await tx.getAll(legacy,wallet);
   if(existing.exists)throw Error('Wallet already exists for '+decision.uid+'; refusing overwrite');
   if(!old.exists||digest(legacyState(old.data()).raw)!==source.sourceHash)
     throw Error('Legacy save changed since review for '+decision.uid+'; re-scan and re-review');
   tx.create(wallet,{tokens:decision.tokens,xp:decision.xp,
     inventory:[...new Set(decision.inventory)],migrationApproved:true,version:1,
     migrationSourceHash:source.sourceHash,createdAt:FieldValue.serverTimestamp(),
     updatedAt:FieldValue.serverTimestamp()});
   // Owner-reviewed verified level is created atomically alongside the wallet.
   // This backfills pre-existing wallets BEFORE Cloud Functions triggers exist.
   const level=1+Math.floor(Math.sqrt(decision.xp/110));
   tx.set(verified,{verified:true,level,updatedAt:FieldValue.serverTimestamp()});
  });
  console.log('APPROVED AND CREATED '+decision.uid+' TT='+decision.tokens+' XP='+decision.xp);
 }
 console.log('Completed reviewed approvals only. No legacy /users data was deleted.');
})().catch(e=>{console.error('Migration aborted:',e.message);process.exitCode=1});
