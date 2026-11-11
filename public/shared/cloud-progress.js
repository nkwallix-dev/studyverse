/*
 * Lightweight cloud upload for standalone Chemverse, Dsaiverse, Sharpverse, MathsVerse and daily arena.
 * On every local game save we mirror the WHOLE account snapshot, including the
 * pending trainer bridge. The Angular home page later applies XP deltas once.
 * Credentials are Firebase session tokens, never the user's six-digit PIN.
 */
(function(){
  'use strict';
  const SESSION='studyverse_cloud_session_v1';
  const PROFILE='studyverse_profile_v1';
  const BRIDGE='studyverse_trainer_launch_v2';
  const DAILY='studyverse_shared_daily_v1';
  const TRAINERS={'nawi-test-01':'chemverse_niklas_v1','dsai-test-01':'dsai_studyverse_v1','pos-pa-01':'sharpverse_pa01_v1','maths-hw-02':'mathsverse_hw02_v1'};
  const script=document.currentScript;
  const configUrl=new URL('../cloud-config.json',script&&script.src?script.src:document.baseURI).href;
  const configPromise=fetch(configUrl,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  let timer=null,chain=Promise.resolve();
  function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function obj(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
  async function authToken(config){
    let session=parse(SESSION);
    if(!session?.refreshToken||!session?.uid)return null;
    if(session.expiresAt>Date.now()+60000&&session.idToken)return {session,token:session.idToken};
    const reply=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(config.apiKey),{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken})
    });
    const data=await reply.json();
    if(!reply.ok||!data.id_token)throw Error(data.error?.message||'Cloud session expired');
    session={...session,idToken:data.id_token,refreshToken:data.refresh_token||session.refreshToken,
      expiresAt:Date.now()+Math.max(60,Number(data.expires_in)||3600)*1000};
    localStorage.setItem(SESSION,JSON.stringify(session));
    return {session,token:session.idToken};
  }
  function snapshot(){
    const profile=parse(PROFILE);if(!obj(profile))return null;
    const trainers=obj(profile.trainerSaves)?{...profile.trainerSaves}:{};
    for(const [id,key] of Object.entries(TRAINERS)){
      const saved=parse(key);if(obj(saved))trainers[id]=saved;
    }
    const data={version:1,profile:{...profile,trainerSaves:trainers},trainers};
    const daily=parse(DAILY);if(daily!==null)data.daily=daily;
    const bridge=parse(BRIDGE);if(obj(bridge))data.bridge=bridge;
    return data;
  }
  async function upload(){
    const config=await configPromise;
    if(!config||!config.apiKey||!config.projectId)return;
    const authenticated=await authToken(config);
    if(!authenticated)return;
    const data=snapshot();if(!data)return;
    const body=JSON.stringify(data);
    if(body.length>700000)throw Error('Cloud snapshot over size limit');
    const url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(config.projectId)
      +'/databases/(default)/documents/users/'+encodeURIComponent(authenticated.session.uid)
      +'?updateMask.fieldPaths=profile&updateMask.fieldPaths=updatedAt';
    const reply=await fetch(url,{
      method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authenticated.token},
      body:JSON.stringify({fields:{profile:{stringValue:body},updatedAt:{timestampValue:new Date().toISOString()}}})
    });
    if(!reply.ok)throw Error('Cloud upload failed: '+reply.status);
  }
  function flush(){
    if(timer!==null){clearTimeout(timer);timer=null;}
    if(!localStorage.getItem(SESSION))return;
    chain=chain.catch(()=>{}).then(upload).catch(e=>console.warn('Studyverse cloud:',e));
  }
  window.studyverseCloudTouch=function(){
    if(!localStorage.getItem(SESSION))return;
    if(timer!==null)clearTimeout(timer);
    timer=setTimeout(flush,1100);
  };
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&timer!==null)flush()});
})();
