/* Shared daily reward ledger for every trainer on the same GitHub Pages origin.
   Maximum 20 unique correct quiz questions (+25 TT) and one 70% boss (+250 TT) per local day.
   Legacy trainer daily payouts are imported so updating cannot accidentally pay twice. */
(function(root){
  'use strict';
  const KEY='studyverse_shared_daily_v1';
  const TRAINERS=[['chem','chemverse_niklas_v1'],['dsai','dsai_studyverse_v1']];
  function getJSON(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function get(){
    const d=today(),stored=getJSON(KEY);
    const result=stored&&stored.date===d&&Array.isArray(stored.quizIds)
      ?{date:d,quizIds:[...new Set(stored.quizIds.filter(x=>typeof x==='string'))].slice(0,20),bossPaid:stored.bossPaid===true}
      :{date:d,quizIds:[],bossPaid:false};
    // Import any rewards earned before or outside the combined daily arena.
    for(const [prefix,key] of TRAINERS){
      const snapshot=getJSON(key),legacy=snapshot&&snapshot.dailyCoin;
      if(!legacy||legacy.date!==d)continue;
      if(Array.isArray(legacy.quizIds))for(const id of legacy.quizIds){
        if(typeof id!=='string')continue;
        const normalized=id.includes(':')?id:prefix+':'+id;
        if(!result.quizIds.includes(normalized)&&result.quizIds.length<20)result.quizIds.push(normalized);
      }
      if(legacy.bossPaid===true)result.bossPaid=true;
    }
    try{localStorage.setItem(KEY,JSON.stringify(result))}catch{}
    return result;
  }
  function claimQuiz(source,id){
    if(!TRAINERS.some(x=>x[0]===source)||typeof id!=='string')return false;
    const s=get(),key=source+':'+id;
    if(s.quizIds.includes(key)||s.quizIds.length>=20)return false;
    s.quizIds.push(key);try{localStorage.setItem(KEY,JSON.stringify(s))}catch{return false}
    return true;
  }
  function claimBoss(){
    const s=get();if(s.bossPaid)return false;
    s.bossPaid=true;try{localStorage.setItem(KEY,JSON.stringify(s))}catch{return false}
    return true;
  }
  root.STUDYVERSE_DAILY={get,claimQuiz,claimBoss,today};
})(window);
