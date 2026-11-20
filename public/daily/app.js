(function(){
"use strict";
const DATA=window.STUDYVERSE_DAILY_QUESTIONS||[],DAILY=window.STUDYVERSE_DAILY,ROOT=document.getElementById("root"),PROFILE="studyverse_profile_v1",ORDER="studyverse_daily_orders_v1";
const ACCESS=window.STUDYVERSE_KENNY_ACCESS;
const KENNY_PORTRAIT='<span class="kenny-visual"><img src="../kenny/skins/kenny-'+(window.STUDYVERSE_KENNY_STYLE?.current?.()||'blue')+'-portrait.png" alt="Kenny der Raptor"></span>';
const URZEIT_BANNER='<div class="kenny-prehistoric-banner" aria-hidden="true"><span class="kenny-banner-sun"></span><span class="kenny-banner-mountain mountain-left"></span><span class="kenny-banner-mountain mountain-right"></span><span class="kenny-banner-volcano"><i></i></span><span class="kenny-banner-lava"></span><span class="kenny-banner-ground"></span><span class="kenny-banner-fern fern-left">🌿</span><span class="kenny-banner-fern fern-right">🌿</span></div>';
if(!DATA.length||!DAILY||!ACCESS){ROOT.textContent="Kennys Forschungsfragen konnten nicht geladen werden.";return}
if(!ACCESS.available()){
 document.getElementById("quizTab").disabled=true;
 document.getElementById("bossTab").disabled=true;
 ROOT.innerHTML='<section class="card kenny-locked">'+KENNY_PORTRAIT+'<div class="eyebrow">🔒 KENNYVERSE · SEASON 01</div><h1>Kenny ist <span>weitergezogen.</span></h1><p>Solange seine Season aktiv ist, kannst du mit Kenny täglich forschen. Ab Level 5 bleibt er nach Saisonende für immer bei dir. Deine gesammelten Items bleiben erhalten.</p><a class="btn" href="../#companions">← Zurück zu Begleiter</a></section>';
 return;
}
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
 return order.map(i=>({label:q.choices[i],correct:i===q.answer}));
}
let mode=(new URLSearchParams(location.search).get("mode")==="boss"?"boss":"quiz");
let session=null,screen="overview";
const sessions={quiz:null,boss:null};
function toast(x){const e=document.getElementById("toast");e.textContent=x;e.classList.add("visible");clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>e.classList.remove("visible"),2700)}
function addTT(amount,label){
 const profile=read(PROFILE);
 if(!profile||typeof profile!=="object"){toast("Bitte öffne erst die STUDYVERSE-Homepage und erstelle dein Profil.");return}
 profile.tokens=Math.max(0,Number(profile.tokens)||0)+amount;
 profile.activity=[{label:label,date:new Date().toISOString(),amount},...(Array.isArray(profile.activity)?profile.activity:[])].slice(0,30);
 write(PROFILE,profile);
 toast("🪙 +"+amount+" TastyTokens auf deinem STUDYVERSE-Profil!");
}
function begin(newMode,forceRestart=false){
 if(newMode!=="quiz"&&newMode!=="boss")return;
 mode=newMode;
 history.replaceState(null,"","?mode="+mode);
 if(!forceRestart&&sessions[newMode]){
  session=sessions[newMode];screen="play";render();return;
 }
 const questions=selectPool(newMode==="boss");
 if(questions.length!==20){toast("Der Fragenpool konnte nicht geladen werden.");return}
 session={questions,pos:0,score:0,answered:false,picked:-1,options:[]};
 sessions[newMode]=session;screen="play";
 refreshOptions();render();
}
function goHome(){
 // Keep both sessions in memory. Returning to Home is NOT a reset.
 screen="overview";
 history.replaceState(null,"",location.pathname);
 render();
}
function refreshOptions(){if(session&&session.pos<session.questions.length)session.options=shuffledOptions(session.questions[session.pos]);session.answered=false;session.picked=-1}
function progressBar(n,total){return '<div class="bar"><i style="width:'+Math.round(n/total*100)+'%"></i></div>'}
function stats(){
 const d=DAILY.get(),quiz=d.quizIds.length;
 return '<div class="stats"><div class="stat"><small>⚡ TAGESQUIZ</small><b>'+quiz+'/20</b><small>Richtige einzigartige Fragen vergütet</small>'+progressBar(quiz,20)+'</div><div class="stat"><small>🪙 HEUTE NOCH MÖGLICH</small><b>'+((20-quiz)*10+(d.bossPaid?0:100))+' TT</b><small>Maximal 300 TT pro Tag</small></div><div class="stat"><small>👾 BOSS-TAGESBONUS</small><b>'+(d.bossPaid?'✓ Erledigt':'100 TT')+'</b><small>Einmal täglich bei mindestens 70 %</small></div></div>';
}
function startScreen(){
 return '<div class="kenny-screen kenny-home-screen">'+
 '<div class="hero"><div><div class="eyebrow">🦖 KENNYVERSE · DEINE TÄGLICHE EXPEDITION</div>'+
 '<h1>Mit Kenny<br><span>Wissen entdecken.</span></h1>'+
 '<p>Entdecke mit Kenny Chemie und Data Science, beantworte 20 Fragen und besiege den Expeditionsboss. Verdiene täglich bis zu 300 TastyTokens.</p>'+
 '<div class="actions"><button class="btn" data-action="quiz">⚡ Forschungsquiz</button><button class="btn secondary" data-action="boss">👾 Expeditionsboss</button><a class="btn secondary" href="../#kenny-platformer">✦ Jump &amp; Run</a></div></div>'+
 '<div class="hero-icon">'+KENNY_PORTRAIT+'</div>'+URZEIT_BANNER+'</div>'+
 stats()+
 '<div class="kenny-home-footnote">🌋 Kennys Urzeit-Expedition · 20 vergütete Quizfragen · einmaliger Bossbonus ab 70 % · gemeinsames Tageslimit von 300 TT</div>'+
 '</div>';
}
function questionScreen(){
 const s=session,q=s.questions[s.pos],d=DAILY.get();
 const choices=s.options.map((o,i)=>'<button class="choice '+(s.answered?(o.correct?'correct':s.picked===i?'wrong':''):'')+'" '+(s.answered?'disabled':'')+' data-answer="'+i+'"><span class="letter">'+("ABCD"[i])+'</span><span>'+safe(o.label)+'</span></button>').join("");
 const correct=s.answered?s.options[s.picked].correct:false;
 const heading=mode==="quiz"?"⚡ FORSCHUNGSQUIZ":"👾 EXPEDITIONSBOSS";
 return '<div class="kenny-screen kenny-play-screen">'+
  '<header class="kenny-play-header"><div class="kenny-play-title">'+KENNY_PORTRAIT+
  '<div><span class="eyebrow">🦖 KENNYVERSE · '+heading+'</span><h1>Wissen <span>erforschen.</span></h1></div></div>'+
  '<div class="kenny-play-hud"><span>FRAGE <b>'+(s.pos+1)+'/20</b></span><span>RICHTIG <b>'+s.score+'</b></span><span>NOCH MÖGLICH <b>'+((20-d.quizIds.length)*10+(d.bossPaid?0:100))+' TT</b></span></div></header>'+
  '<section class="card kenny-question-card">'+
  '<div class="kenny-question-meta"><span class="tag">'+(q.subject==="chem"?'🧪 CHEMIE':'🤖 DATA SCIENCE')+'</span><span>FRAGE '+(s.pos+1)+' / '+s.questions.length+' · '+s.score+' RICHTIG</span></div>'+
  progressBar(s.pos,s.questions.length)+
  (q.code?'<pre class="snippet">'+safe(q.code)+'</pre>':'')+
  '<div class="question">'+safe(q.question)+'</div><div class="choices">'+choices+'</div>'+
  (s.answered?'<div class="feedback '+(correct?'':'bad')+'"><b>'+(correct?'✅ Richtig!':'❌ Leider falsch.')+'</b><p>'+safe(q.why)+'</p></div><div class="kenny-next-row"><button class="btn" data-action="next">'+(s.pos+1===s.questions.length?'Ergebnis ansehen 🏆':'Nächste Frage →')+'</button></div>':'')+
  '</section>'+
  '<div class="kenny-play-note">'+(mode==="quiz"?'⚡ Neue richtige Fragen bringen jeweils +10 TT – max. 20 pro Tag.':'👾 +100 TT ab 14 richtigen Antworten – ein Bossbonus täglich.')+'</div>'+
 '</div>';
}
function resultScreen(){
 const percent=Math.round(100*session.score/session.questions.length);
 return '<div class="kenny-screen kenny-result-screen">'+
 '<div class="card result"><div class="emoji">'+(mode==="boss"?(percent>=70?'👑':'🤖'):'🏅')+'</div>'+
 '<div class="eyebrow">🦖 KENNYVERSE · EXPEDITION BEENDET</div><h1>'+session.score+'/20 <span>richtig</span></h1><h2>'+percent+' %</h2>'+
 '<p>'+(mode==="boss"?(percent>=70?'Boss bestanden! Ab 70 % gibt’s einmal am Tag 100 TT.':'Noch keine 70 %. Trainier weiter, dann zerlegst du den Boss.'):
 'GG! Kenny hat mit dir erfolgreich geforscht. Die Belohnungen sind direkt auf deinem Studyverse-Profil.')+'</p>'+
 '<div class="actions"><button class="btn" data-action="restart">🔁 Nochmal spielen</button><button class="btn secondary" data-action="overview">🏠 Startseite</button><a class="btn secondary" href="../#companions">← Zurück zu Begleiter</a></div></div>'+
 stats()+'</div>';
}
function render(){
 const nav=screen==="overview"?"overview":mode;
 document.querySelectorAll('[data-kenny-nav]').forEach(button=>{
  const active=button.dataset.kennyNav===nav;
  button.classList.toggle("active",active);
  button.setAttribute("aria-pressed",String(active));
 });
 const actual=screen==="overview"?"home":session&&session.pos<session.questions.length?"play":"result";
 ROOT.dataset.screen=actual;
 ROOT.innerHTML=actual==="home"?startScreen():actual==="play"?questionScreen():resultScreen();
}
function answer(i){
 if(!session||session.answered||!session.options[i])return;
 session.answered=true;session.picked=i;
 if(session.options[i].correct){
  session.score++;
  if(mode==="quiz"){
   const q=session.questions[session.pos];
   if(DAILY.claimQuiz(q.subject,q.id.split(":")[1]))addTT(10,"Kennyverse · Quiz · "+(q.subject==="chem"?"CHEMVERSE":"Dsaiverse"));
  }
 }
 render();
}
function next(){
 if(!session?.answered)return;
 session.pos++;
 if(session.pos>=session.questions.length){
  if(mode==="boss"){
   const p=Math.round(100*session.score/session.questions.length);
   if(p>=70&&DAILY.claimBoss())addTT(100,"Kennyverse · Expeditionsboss · Chemie & Data Science");
  }
  render();;return;
 }
 refreshOptions();render();;
}
ROOT.addEventListener("click",e=>{
 const target=e.target.closest("button");if(!target)return;
 if(target.dataset.answer!==undefined){answer(Number(target.dataset.answer));return}
 const action=target.dataset.action;
 if(action==="quiz"||action==="boss"){begin(action);return}
 if(action==="next"){next();return}
 if(action==="restart"){begin(mode,true);return}
 if(action==="overview"){goHome()}
});
document.querySelectorAll('[data-kenny-nav]').forEach(button=>button.addEventListener("click",()=>{
 if(button.dataset.kennyNav==="overview")goHome();
 else begin(button.dataset.kennyNav);
}));
document.getElementById("topHome").addEventListener("click",goHome);
screen="overview";render();
})();
