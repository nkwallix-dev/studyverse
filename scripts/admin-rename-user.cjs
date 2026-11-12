#!/usr/bin/env node
'use strict';
/**
 * Owner-only safe Studyverse rename. DRY RUN by default.
 *
 * Examples:
 * node scripts/admin-rename-user.cjs --project studyverse-logins --uid UID --display-name Spieler123
 * node scripts/admin-rename-user.cjs --project studyverse-logins --uid UID --display-name Spieler123 --new-login spieler123 --apply --confirm-rename
 *
 * --new-login changes Firebase Auth email (Studyverse signs in with
 * '<handle>@accounts.studyverse.example.com') but never changes password/PIN.
 * Existing sessions might need to sign out and sign in again with new handle.
 *
 * Requires owner's local Google ADC. Never pass service account keys or user
 * UID lists into a public GitHub Action, and do not commit backup snapshots.
 */
const path=require('node:path');
const APP_DOMAIN='@accounts.studyverse.example.com';
const arg=(args,name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const validDisplay=x=>typeof x==='string'&&x.length>=2&&x.length<=24&&
  /^[\p{L}\p{N} _-]+$/u.test(x);
const validLogin=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{2,19}$/.test(x);
function renameJson(raw,newName){
  if(typeof raw!=='string'||!raw)return null;
  let object;
  try{object=JSON.parse(raw)}catch{throw Error('Invalid JSON; manual review required')}
  if(!object||typeof object!=='object'||Array.isArray(object)||
     !object.profile||typeof object.profile!=='object'||Array.isArray(object.profile))
    throw Error('Expected a Studyverse profile wrapper; manual review required');
  // Preserve every economy, activity and inventory field byte-for-byte as
  // parsed JSON values; only the profile.nickname field changes.
  return JSON.stringify({...object,profile:{...object.profile,nickname:newName}});
}
function authEmail(handle){if(!validLogin(handle))throw Error('Invalid login handle');return handle+APP_DOMAIN;}
async function main(args=process.argv.slice(2)){
  const project=arg(args,'--project'),uid=arg(args,'--uid'),
    name=arg(args,'--display-name'),newLogin=arg(args,'--new-login');
  const apply=args.includes('--apply'),confirmed=args.includes('--confirm-rename');
  if(!project||!/^[a-z][a-z0-9-]{4,60}$/.test(project)||
     !uid||!/^[a-zA-Z0-9_-]{6,160}$/.test(uid)||
     !validDisplay(name)||(newLogin&&!validLogin(newLogin))||
     (apply&&!confirmed)){
    throw Error('Usage: --project PROJECT --uid USER_UID --display-name NAME [--new-login HANDLE] [--apply --confirm-rename]');
  }
  if(!process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST &&
     !args.includes('--acknowledge-production-read')){
    throw Error('Use --acknowledge-production-read to explicitly acknowledge accessing real Studyverse accounts. Preview is read-only.');
  }
  const functionsDir=path.resolve(__dirname,'../functions');
  const requireBackend=id=>require(require.resolve(id,{paths:[functionsDir]}));
  const {initializeApp,applicationDefault}=requireBackend('firebase-admin/app');
  const {getFirestore,FieldValue}=requireBackend('firebase-admin/firestore');
  const {getAuth}=requireBackend('firebase-admin/auth');
  initializeApp({projectId:project,...(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST?
    {}:{credential:applicationDefault()})});
  const db=getFirestore(),auth=getAuth();
  const account=await auth.getUser(uid);
  if(newLogin){
    if(!account.email?.endsWith(APP_DOMAIN))
      throw Error('User is not a Studyverse synthetic-email account');
    const desired=authEmail(newLogin);
    if(desired!==account.email){
      try{
        const other=await auth.getUserByEmail(desired);
        if(other.uid!==uid)throw Error('Requested login is already in use');
      }catch(e){if(e.code!=='auth/user-not-found')throw e;}
    }
  }
  const refs={
    legacy:db.doc('users/'+uid),
    card:db.doc('publicProfiles/'+uid),
    practice:db.doc('clientStates/'+uid)
  };
  const [legacy,card,practice]=await Promise.all(Object.values(refs).map(ref=>ref.get()));
  if(!legacy.exists&&!card.exists&&!practice.exists)throw Error('No Studyverse Firestore profile found');
  const before=legacy.exists?renameJson(legacy.data().profile,name):null;
  const currentPractice=practice.exists?renameJson(practice.data().practice,name):null;
  // Preflight catches malformed saves before any Auth or Firestore write.
  console.log('Studyverse owner rename '+(apply?'APPLY':'DRY-RUN'));
  console.log('Project: '+project+' | UID suffix: …'+uid.slice(-5));
  console.log('Display: '+String(card.data()?.nickname||'(no public card)')+' -> '+name);
  console.log('Login: '+String(account.email||'(none)')+' -> '+(newLogin?authEmail(newLogin):'(unchanged)'));
  console.log('Legacy profile: '+(before?'update nickname only':'not present'));
  console.log('Practice profile: '+(currentPractice?'update nickname only':'not present'));
  console.log('XP, TT, inventory, titles, avatar, PIN and UID: UNCHANGED');
  if(!apply){console.log('No writes made. Rerun with --apply --confirm-rename for owner-authorized rename.');return;}
  const originalEmail=account.email;
  const desiredEmail=newLogin?authEmail(newLogin):null;
  let authChanged=false;
  if(desiredEmail&&originalEmail!==desiredEmail){
    await auth.updateUser(uid,{email:desiredEmail});
    authChanged=true;
  }
  try{
    await db.runTransaction(async tx=>{
      const [l,c,p]=await tx.getAll(refs.legacy,refs.card,refs.practice);
      // A cloud save changed during our preview: abort and rerun instead of
      // overwriting a concurrent user's progress or profile changes.
      if(l.exists!==legacy.exists||c.exists!==card.exists||p.exists!==practice.exists||
         (l.exists&&l.data().profile!==legacy.data().profile)||
         (p.exists&&p.data().practice!==practice.data().practice)||
         (c.exists&&c.data().nickname!==card.data().nickname))
        throw Error('Profile changed since preview; abort and review again');
      const now=FieldValue.serverTimestamp();
      if(l.exists)tx.update(refs.legacy,{profile:renameJson(l.data().profile,name),updatedAt:now});
      if(p.exists)tx.update(refs.practice,{practice:renameJson(p.data().practice,name),
        nickname:name,updatedAt:now});
      if(c.exists)tx.update(refs.card,{nickname:name,updatedAt:now});
    });
  }catch(error){
    if(authChanged&&originalEmail){
      try{await auth.updateUser(uid,{email:originalEmail});}
      catch(rollback){console.error('AUTH ROLLBACK FAILED; manually restore previous email:',rollback.message);}
    }
    throw error;
  }
  console.log('SUCCESS: display updated'+(authChanged?' and new login handle set':'')+'. All wallets and passwords unchanged.');
  console.log('IMPORTANT: Regenerate the wallet migration report; legacy JSON hash changed.');
  if(authChanged)console.log('Ask user to log out and log back in with the new handle and existing PIN.');
}
if(require.main===module)main().catch(e=>{console.error('Rename aborted:',e.message);process.exitCode=1;});
module.exports={renameJson,validDisplay,validLogin,authEmail};
