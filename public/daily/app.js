(function(){
"use strict";
const DATA=window.STUDYVERSE_DAILY_QUESTIONS||[],DAILY=window.STUDYVERSE_DAILY,ROOT=document.getElementById("root"),PROFILE="studyverse_profile_v1",ORDER="studyverse_daily_orders_v1";
if(!DATA.length||!DAILY){ROOT.textContent="Der tägliche Fragenpool konnte nicht geladen werden.";return}
const bySubject={chem:DATA.filter(q=>q.subject==="chem"),dsai:DATA.filter(q=>q.subject==="dsai")};
const safe=x=>String(x).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
function read(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}}
function write(k,v){localStorage.setItem(k,JSON.stringify(v));window.studyverseCloudTouch?.()}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function selectPool(examOnly=false){
 const eligible=window.STUDYVERSE_IS_EXAM_QUESTION;
 if(examOnly&&typeof eligible!=="function")return [];
 const chemSource=examOnly?bySubject.chem.filter(eligible):bySubject.chem;
 const dsaiSource=examOnly?bySubject.dsai.filter(eligible):bySubject.dsai;
 const chem=shuffle(chemSource).slice(0,10);
 const code=shuffle(dsaiSource.filter(q=>q.code)).slice(0,3);
 const other=shuffle(dsaiSource.filter(q=>!code.includes(q))).slice(0,7);
 if(chem.length!==10||code.length!==3||other.length!==7)return [];
 return shuffle([...chem,...code,...other]);
}
function shuffledOptions(q){
 const last=read(ORDER)||{}, order=shuffle([0,1,2,3]), correct=order.indexOf(q.answer);
 if(last[q.id]===correct){const next=(correct+1+Math.floor(Math.random()*3))%4;[order[correct],order[next]]=[order[next],order[correct]]}
 last[q.id]=order.indexOf(q.answer);write(ORDER,last);
 return order.map(i=>({label:q.choices[i],correct:i===q.answer,optionIndex:i}));
}
let mode=(new URLSearchParams(location.search).get("mode")==="boss"?"boss":"quiz"),session=null;
function toast(x){const e=document.getElementById("toast");e.textContent=x;e.classList.add("visible");clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>e.classList.remove("visible"),2700)}
function isCloudAccount(){
 try{const session=read('studyverse_cloud_session_v1');return !!(session?.uid&&session?.refreshToken)}catch{return false}
}
function addTT(amount,label){
 const profile=read(PROFILE);
 if(!profile||typeof profile!=="object"){toast("Bitte öffne erst die STUDYVERSE-Homepage und erstelle dein Profil.");return}
 profile.tokens=Math.max(0,Number(profile.tokens)||0)+amount;
 profile.activity=[{label:label,date:new Date().toISOString(),amount},...(Array.isArray(profile.activity)?profile.activity:[])].slice(0,30);
 write(PROFILE,profile);
 toast("🪙 +"+amount+" TastyTokens auf deinem STUDYVERSE-Profil!");
}
function begin(newMode){
 mode=newMode;history.replaceState(null,"","?mode="+mode);
 session={questions:selectPool(),pos:0,score:0,answered:false,picked:-1,options:[],answers:[],pending:false};
 refreshOptions();render();
}
function refreshOptions(){if(session&&session.pos<session.questions.length)session.options=shuffledOptions(session.questions[session.pos]);session.answered=false;session.picked=-1}
function progressBar(n,total){return '<div class="bar"><i style="width:'+Math.round(n/total*100)+'%"></i></div>'}
function stats(){
 const d=DAILY.get(),quiz=d.quizIds.length;
 return '<div class="stats"><div class="stat"><small>⚡ TAGESQUIZ</small><b>'+quiz+'/20</b><small>Richtige einzigartige Fragen vergütet</small>'+progressBar(quiz,20)+'</div><div class="stat"><small>🪙 HEUTE NOCH MÖGLICH</small><b>'+((20-quiz)*25+(d.bossPaid?0:250))+' TT</b><small>Maximal 750 TT pro Tag</small></div><div class="stat"><small>👾 BOSS-TAGESBONUS</small><b>'+(d.bossPaid?'✓ Erledigt':'250 TT')+'</b><small>Einmal täglich bei mindestens 70 %</small></div></div>';
}
function startScreen(){
 return '<div class="hero"><div><div class="eyebrow">✦ STUDYVERSE · GEMEINSAME DAILY ARENA</div><h1>Dein täglicher<br><span>XP-Check.</span></h1><p>20 wechselnde Fragen aus CHEMVERSE und Dsaiverse. Beide Fächer können auftauchen, auch im Bosskampf. Deine TastyTokens landen direkt im globalen Profil.</p><div class="actions"><button class="btn" data-action="quiz">⚡ Tägliches Quiz</button><button class="btn secondary" data-action="boss">👾 Bosskampf</button></div></div><div class="hero-icon">⚡</div></div>'+stats()+
 '<div class="card"><h2>⚡ Quiz oder 👾 Boss?</h2><p>Im Quiz zählen bis zu 20 unterschiedliche richtig gelöste Fragen pro Tag für je 25 TT. Beim Boss gibt es einmal täglich 250 TT, wenn mindestens 70 % von 20 Fragen richtig sind. Fragen und Antwortpositionen werden neu gemischt.</p><div class="notice">Die täglichen Limits gelten <b>gemeinsam</b> für CHEMVERSE, Dsaiverse und diese Arena – kein doppeltes Kassieren durch Fachwechsel.</div></div>';
}
function questionScreen(){
 const s=session,q=s.questions[s.pos],d=DAILY.get();
 const choices=s.options.map((o,i)=>'<button class="choice '+(s.answered?(o.correct?'correct':s.picked===i?'wrong':''):'')+'" '+(s.answered?'disabled':'')+' data-answer="'+i+'"><span class="letter">'+("ABCD"[i])+'</span><span>'+safe(o.label)+'</span></button>').join("");
 const correct=s.answered?s.options[s.picked].correct:false;
 return '<div class="eyebrow">'+(mode==="quiz"?"⚡ TÄGLICHES QUIZ":"👾 TÄGLICHER BOSSKAMPF")+' · CHEMVERSE + Dsaiverse</div><h1>Wissen <span>beweisen.</span></h1>'+stats()+
 '<div class="card"><div class="tag">'+(q.subject==="chem"?'🧪 CHEMVERSE · CHEMIE':'🤖 Dsaiverse · DATA SCIENCE')+'</div><div class="actions"><small>FRAGE '+(s.pos+1)+' / '+s.questions.length+'</small><small>· '+s.score+' richtig</small></div>'+progressBar(s.pos,s.questions.length)+
 (q.code?'<pre class="snippet">'+safe(q.code)+'</pre>':'')+
 '<div class="question">'+safe(q.question)+'</div><div class="choices">'+choices+'</div>'+
 (s.answered?'<div class="feedback '+(correct?'':'bad')+'"><b>'+(correct?'✅ Richtig!':'❌ Leider falsch.')+'</b><p>'+safe(q.why)+'</p></div><div class="actions"><button class="btn" data-action="next">'+(s.pos+1===s.questions.length?'Ergebnis ansehen 🏆':'Nächste Frage →')+'</button></div>':'')+'</div>'+
 '<div class="notice">'+(mode==="quiz"?'Für neue richtige Fragen gibt es +25 TT, solange die gemeinsame Tagesgrenze von 20 nicht erreicht ist.':'Der Boss bringt +250 TT, wenn du mindestens 14 von 20 Fragen richtig hast und den heutigen Bonus noch nicht kassiert hast.')+'</div>';
}
function resultScreen(){
 const percent=Math.round(100*session.score/session.questions.length);
 return '<div class="card result"><div class="emoji">'+(mode==="boss"?(percent>=70?'👑':'🤖'):'🏅')+'</div><div class="eyebrow">RUNDE ABGESCHLOSSEN</div><h1>'+session.score+'/20 <span>richtig</span></h1><h2>'+percent+' %</h2><p>'+(mode==="boss"?(percent>=70?'Boss bestanden! Ab 70 % gibt’s einmal am Tag die 250 TT.':'Noch keine 70 %. Trainier weiter, dann zerlegst du den Boss.'): 'GG! Du hast wieder Chemie und DSAI zusammen trainiert. Bei Cloud-Accounts gelten nur serverseitig bestätigte TastyTokens.')+'</p><div class="actions" style="justify-content:center"><button class="btn" data-action="'+mode+'">🔁 Nochmal</button><button class="btn secondary" data-action="overview">Tagesübersicht</button><a class="btn secondary" href="../">↩ STUDYVERSE</a></div></div>'+stats();
}
function render(){
 document.getElementById("quizTab").classList.toggle("active",mode==="quiz");
 document.getElementById("bossTab").classList.toggle("active",mode==="boss");
 ROOT.innerHTML=!session?startScreen():session.pos<session.questions.length?questionScreen():resultScreen();
}
async function answer(i){
 if(!session||session.answered||!session.options[i])return;
 const run=session, q=run.questions[run.pos], choice=run.options[i];
 run.answered=true;run.picked=i;
 run.answers.push({challengeId:q.id,answer:String(q.choices[choice.optionIndex])});
 if(choice.correct){
  run.score++;
  if(mode==="quiz"){
   if(isCloudAccount()){
    run.pending=true;render();
    try{
     const result=await window.studyverseCallFunction("submitAnswer",{
      challengeId:q.id,answer:String(q.choices[choice.optionIndex])});
     if(result.tokensAwarded>0){
      DAILY.claimQuiz(q.subject,q.id.split(":")[1]);
      toast("✅ +"+result.tokensAwarded+" TT · +"+(result.xpAwarded||0)+" XP verifiziert!");}
     else toast(result.reason==="already-credited-today"?"Diese Frage wurde heute schon vergütet.":"Heute keine weitere Quiz-Gutschrift.");
    }catch(error){toast("⚠ Server-Gutschrift fehlgeschlagen – keine TT gebucht.");console.warn("Verified quiz:",error)}
    finally{run.pending=false;render();}
   }else if(DAILY.claimQuiz(q.subject,q.id.split(":")[1])){
    addTT(25,"Tagesquiz · "+(q.subject==="chem"?"CHEMVERSE":"Dsaiverse"));}
  }
 }
 render();
}
async function next(){
 if(!session?.answered||session.pending)return;
 session.pos++;
 if(session.pos>=session.questions.length){
  if(mode==="boss"){
   const p=Math.round(100*session.score/session.questions.length);
   if(p>=70){
    if(isCloudAccount()){
     session.pending=true;render();
     try{
      const result=await window.studyverseCallFunction("submitDailyBoss",{answers:session.answers});
      if(result.tokensAwarded>0){DAILY.claimBoss();toast("👾 +"+result.tokensAwarded+" TT · +"+(result.xpAwarded||0)+" XP verifiziert!");}
      else toast("Boss geschafft – heute kein weiterer Bonus.");
     }catch(error){toast("⚠ Boss-Bonus nicht bestätigt.");console.warn("Verified boss:",error)}
     finally{session.pending=false;}
    }else if(DAILY.claimBoss())addTT(250,"Tagesboss · CHEMVERSE & Dsaiverse");
   }
  }
  render();scrollTo(0,0);return;
 }
 refreshOptions();render();scrollTo(0,0);
}

ROOT.addEventListener("click",e=>{
 const target=e.target.closest("button");if(!target)return;
 if(target.dataset.answer!==undefined){answer(Number(target.dataset.answer));return}
 const action=target.dataset.action;
 if(action==="quiz"||action==="boss"){begin(action);return}
 if(action==="next"){next();return}
 if(action==="overview"){session=null;render()}
});
document.getElementById("quizTab").addEventListener("click",()=>begin("quiz"));
document.getElementById("bossTab").addEventListener("click",()=>begin("boss"));
session=null;render();
})();
