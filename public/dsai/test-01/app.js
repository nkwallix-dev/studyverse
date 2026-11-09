(function trainer(){
"use strict";
const C=window.DSAI_CONTENT,Q=window.DSAI_QUESTIONS,KEY="dsai_studyverse_v1",PROFILE="studyverse_profile_v1";
const $=id=>document.getElementById(id),allModes=["quiz","code","sorter","pipeline","forecast"],CODE=Q.filter(q=>q.code),FORE=Array.from({length:12},(_,i)=>({id:"f"+i,x:i}));
const CAT=[["Volume","Velocity","Variety","Veracity","Value"],["Nominal","Ordinal","Intervall","Verhältnis"],["Strukturiert","Semistrukturiert","Unstrukturiert","Nominal"],["Business Understanding","Data Understanding","Data Preparation","Modeling","Evaluation","Deployment"],["Selection","Preprocessing","Transformation","Data Mining","Interpretation"]];
function load(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}}
function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
const s=Object.assign({xp:0,coins:0,solved:{},courseDone:{},learned:{},bestBoss:0,maxCombo:0,combo:0,bossRuns:0,orders:{},dailyCoin:{date:"",quizIds:[],bossPaid:false}},obj(load(KEY)));
for(const key of ["solved","courseDone","learned","orders"])s[key]=obj(s[key]);
const equip=Object.assign({},obj(s.loadout),obj(obj(load(PROFILE)).equipped));
document.body.dataset.theme=equip.theme||s.theme||"base";document.body.dataset.atm=equip.atm||"none";document.body.dataset.frame=equip.frame||"none";document.body.dataset.font=equip.font||"standard";$("avatar").textContent=equip.avatar||"🤖";
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function store(){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn(e)}}
function shuffle(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function toast(t){let e=$("toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>e.classList.remove("show"),2500)}
function date(){let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function daily(){if(s.dailyCoin?.date!==date())s.dailyCoin={date:date(),quizIds:[],bossPaid:false};return s.dailyCoin}
function payFirst(id,xp,tt){if(s.solved[id])return false;s.solved[id]=true;s.xp+=xp;s.coins+=tt;store();toast(`✨ Erstmals geschafft: +${xp} XP · +${tt} TT`);return true}
function payDailyQuiz(id){let d=daily();if(!Array.isArray(d.quizIds))d.quizIds=[];if(d.quizIds.includes(id)||d.quizIds.length>=20)return;d.quizIds.push(id);s.coins+=25;store();toast(`🪙 Tägliche Quizbelohnung: +25 TT (${d.quizIds.length}/20)`)}
function payDailyBoss(p){let d=daily();if(p<70||d.bossPaid)return;d.bossPaid=true;s.coins+=250;store();toast("🪙 Tagesboss geschafft: +250 TT")}
function ids(mode){return mode==="quiz"?Q.map(x=>x.id):mode==="code"?CODE.map(x=>"d"+x.id):mode==="sorter"?C.sort.map(x=>x.id):mode==="pipeline"?C.pipelines.map(x=>"p"+x.id):mode==="forecast"?FORE.map(x=>x.id):[]}
function progress(mode){let a=ids(mode),done=a.filter(x=>s.solved[x]).length;return {total:a.length,done,left:a.length-done}}
function learned(){return C.lessons.filter(l=>s.courseDone[l.id]).length}
function bar(n,d){return `<div class="bar"><i style="width:${d?Math.min(100,n/d*100):0}%"></i></div>`}
function button(text,act,cls="btn"){return `<button class="${cls}" data-action="${esc(act)}">${text}</button>`}
function navbtn(text,target,cls="btn"){return `<button class="${cls}" data-navmain="${esc(target)}">${text}</button>`}
function options(key,answers,correct){
 let order=shuffle(answers.map((_,i)=>i)),last=s.orders[key],pos=order.indexOf(correct);
 if(order.length>1&&last!==undefined&&pos===last){let other=(pos+1+Math.floor(Math.random()*(order.length-1)))%order.length;[order[other],order[pos]]=[order[pos],order[other]]}
 s.orders[key]=order.indexOf(correct);store();
 return order.map(i=>({text:answers[i],correct:i===correct}));
}
function choices(opts,finished,pick,attr){
 return `<div class="choices">${opts.map((o,i)=>`<button class="choice ${finished?(o.correct?"good":pick===i?"bad":""):""}" ${finished?"disabled":""} data-${attr}="${i}"><span class="letter">${"ABCD"[i]||i+1}</span><span>${esc(o.text)}</span></button>`).join("")}</div>`
}
function feed(ok,explanation){return `<div class="feedback ${ok?"":"bad"}"><b>${ok?"✅ Richtig!":"❌ Nicht ganz."}</b><p>${esc(explanation)}</p></div>`}
const MODE=[
{id:"academy",icon:"🎓",title:"Von Null lernen",desc:"16 erklärte Kapitel mit Mini-Checks."},
{id:"quiz",icon:"⚡",title:"Quiz-Arena",desc:"106 Unterrichtsfragen mit neu gemischten Antworten."},
{id:"code",icon:"🧩",title:"Code-Detective",desc:"23 Code-Schnipsel lesen und die Ausgabe erkennen."},
{id:"sorter",icon:"🗂️",title:"Data-Sorter",desc:"5 V, Datentypen und Data-Science-Phasen einordnen."},
{id:"pipeline",icon:"🧭",title:"Pipeline-Puzzle",desc:"CRISP-DM und KDD als Sequenz lösen."},
{id:"forecast",icon:"📈",title:"Festival-Forecast",desc:"Regressionsprognosen ohne Code berechnen."}
];
let view="home",lessonId="",lessonOpts=[],lessonAnswered=false,lessonPick=-1,run=null,bossPercent=0;
const titles={home:"Kommandozentrale",academy:"Von Null lernen",atlas:"Nachschlageatlas",lesson:"Lernakademie",quiz:"Quiz-Arena",code:"Code-Detective",sorter:"Data-Sorter",pipeline:"Pipeline-Puzzle",forecast:"Festival-Forecast",boss:"AI-Bosskampf","boss-run":"AI-Bosskampf","boss-result":"AI-Bosskampf",result:"Ergebnis"};
function go(where){
 $("sidebar").classList.remove("open");
 if(allModes.includes(where)){begin(where,false);return}
 view=["home","academy","atlas","boss"].includes(where)?where:"home";run=null;render();window.scrollTo(0,0)
}
function overview(){
 const lc=learned(),p=mode=>progress(mode);
 return `<div class="hero"><div><div class="eyebrow">🤖 MISSION · DSAI 1. TEST</div><h1>Von Null zum <span>AI-Boss.</span></h1><p>Deine DSAI-Unterlagen als Lernwelt. Verstehe Python-Schnipsel, prüfe Daten, löse Multiple Choice – ohne Code zu schreiben.</p><div class="actions">${button("🎓 Von Null lernen","finish:academy")}${navbtn("⚡ Quiz trainieren","quiz","btn secondary")}${navbtn("👾 Bosskampf","boss","btn secondary")}</div></div><div class="hero-art">🤖</div></div>
 <div class="stats">${["academy","quiz","code","sorter"].map(m=>{let x=m==="academy"?{done:lc,total:C.lessons.length,left:C.lessons.length-lc}:p(m),meta=MODE.find(z=>z.id===m);return `<div class="stat"><div class="ico">${meta.icon}</div><b>${x.done}/${x.total}</b><small>${esc(meta.title)} abgeschlossen</small>${bar(x.done,x.total)}${x.left?`<div class="actions">${button("🎯 Fertig stellen ("+x.left+")","finish:"+m,"btn small")}</div>`:""}</div>`}).join("")}</div>
 <div class="section"><div class="eyebrow">TRAININGSBEREICHE</div><h2>Wähle deinen <span>Modus</span></h2></div><div class="cards">${MODE.map(m=>{let x=m.id==="academy"?{done:lc,total:C.lessons.length,left:C.lessons.length-lc}:p(m.id);return `<div class="mode-card"><div class="icon">${m.icon}</div><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p><small>${x.done}/${x.total} gemeistert</small><div class="actions">${navbtn("Öffnen ↗",m.id,"btn small")}${x.left?button("Fertig stellen ("+x.left+")","finish:"+m.id,"btn small secondary"):""}</div></div>`}).join("")}</div>
 <div class="panel"><div class="eyebrow">👾 AI-BOSSKAMPF</div><h2>20 gemischte Fragen</h2><p>Bester Versuch: ${Number(s.bestBoss)||0}%. Euer Stoff, inklusive NumPy, Pandas, Prozessmodelle, Regression und Statistik.</p>${navbtn("Boss herausfordern ↗","boss")}</div>`;
}
function academy(){
 let n=learned(),left=C.lessons.length-n;
 return `<div class="eyebrow">🎓 LERNAKADEMIE · SCHRITT FÜR SCHRITT</div><h1>Von <span>Null.</span></h1><p>Jedes der 16 Kapitel erklärt genau euren Stoff. Nach den Beispielen beantwortest du eine Verständnisfrage. Erst dann zählt es als abgeschlossen.</p><div class="panel"><h2>${n}/${C.lessons.length} abgeschlossen</h2>${bar(n,C.lessons.length)}<div class="actions">${left?button("🎯 Die "+left+" offenen Lektionen fertig stellen","finish:academy"):navbtn("🏆 Alles geschafft","atlas","btn secondary")}</div></div>
 <div class="lesson-list">${C.lessons.map((l,i)=>`<button class="lesson-card" data-lesson="${esc(l.id)}"><span>${l.icon}</span><div><b>${i+1}. ${esc(l.title)}</b><small>${esc(l.group)}</small></div><span class="done">${s.courseDone[l.id]?"✓ Fertig":"↗"}</span></button>`).join("")}</div>`;
}
function atlas(){
 return `<div class="eyebrow">📚 NACHSCHLAGEATLAS</div><h1>Alles auf <span>einen Blick.</span></h1><p>Die Kernaussagen, Beispiele, Stolperfallen und Quellen deiner Unterrichtsmappen.</p>${C.lessons.map((l,i)=>`<details class="panel"><summary><b>${l.icon} ${i+1}. ${esc(l.title)}</b> <small>${esc(l.group)}</small></summary><ul>${l.blocks.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="code">${esc(l.example)}</div><div class="tip">💡 ${esc(l.trap)}</div><p class="source">Quelle: ${esc(l.source)}</p>${button("Zum Kapitel","lesson:"+l.id,"btn small")}</details>`).join("")}`;
}
function openLesson(id){
 let l=C.lessons.find(x=>x.id===id);if(!l)return;
 lessonId=id;view="lesson";lessonAnswered=false;lessonPick=-1;
 let q=Q.find(x=>x.topic===id);
 lessonOpts=q?options("lesson:"+id,q.choices,q.answer):[];
 render();window.scrollTo(0,0)
}
function lesson(){
 let l=C.lessons.find(x=>x.id===lessonId),idx=C.lessons.indexOf(l);
 if(!l)return academy();
 let next=C.lessons.slice(idx+1).find(x=>!s.courseDone[x.id])||C.lessons.find(x=>!s.courseDone[x.id]);
 const q=Q.find(x=>x.topic===l.id),done=!!s.courseDone[l.id];
 return `<div class="eyebrow">KAPITEL ${idx+1}/${C.lessons.length} · ${esc(l.group)}</div><h1>${esc(l.title)}</h1><div class="actions">${navbtn("↩ Lernakademie","academy","btn secondary")}${next&&next.id!==l.id?button("🎯 Nächste offene Lektion","lesson:"+next.id):""}</div>
 <article class="lesson-body"><div class="eyebrow">SCHRITT FÜR SCHRITT ERKLÄRT</div><ul>${l.blocks.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="eyebrow">BEISPIEL</div><div class="code">${esc(l.example)}</div><div class="tip">⚠️ ${esc(l.trap)}</div><p class="source">Quelle: ${esc(l.source)}</p></article>
 <div class="panel lesson-check"><div class="eyebrow">VERSTÄNDNIS-CHECK</div>${done?"<h2>✓ Lektion abgeschlossen</h2><p>Du kannst die Erklärung beliebig wiederholen.</p>":q?`<h3>${esc(q.question)}</h3>${choices(lessonOpts,lessonAnswered,lessonPick,"lessonanswer")}${lessonAnswered?feed(lessonOpts[lessonPick].correct,q.explain)+(!lessonOpts[lessonPick].correct?button("Erneut versuchen ↻","lesson:"+l.id):"<span class='tag good'>Lektion gespeichert</span>"):""}`:"<p>Keine Checkfrage vorhanden.</p>"}
 <div class="actions">${next&&next.id!==l.id&&done?button("Nächste offene Lektion →","lesson:"+next.id):""}${navbtn("Alle Kapitel","academy","btn secondary")}</div></div>`;
}
function lessonAnswer(i){
 if(view!=="lesson"||s.courseDone[lessonId]||lessonAnswered||!lessonOpts[i])return;
 lessonAnswered=true;lessonPick=i;
 if(lessonOpts[i].correct){s.courseDone[lessonId]=true;s.learned[lessonId]=true;s.xp+=20;s.coins+=20;store();toast("🎓 Lektion gemeistert! +20 XP · +20 TT")}
 render();
}
function begin(mode,focus){
 let all=ids(mode),todo=focus?all.filter(id=>!s.solved[id]):shuffle(all),cap=focus?todo.length:({quiz:20,code:12,sorter:12,pipeline:3,forecast:8}[mode]||20);
 run={mode,focus,items:todo.slice(0,cap),at:0,step:0,answered:false,picked:-1,correct:false,right:0,prompt:null};
 view=mode;
 if(run.items.length)prepare();
 render();window.scrollTo(0,0)
}
function makePrompt(){
 let id=run.items[run.at],mode=run.mode;
 if(mode==="quiz"||mode==="code"||mode==="boss"){
  let q=Q.find(x=>x.id===(mode==="code"?id.slice(1):id));
  return {text:q.question,code:q.code||"",why:q.explain,category:q.topic,opts:options(mode+":"+id,q.choices,q.answer)};
 }
 if(mode==="sorter"){
  let x=C.sort.find(x=>x.id===id),cat=CAT.find(a=>a.includes(x.answer))||[x.answer],arr=shuffle([x.answer,...shuffle(cat.filter(y=>y!==x.answer)).slice(0,3)]);
  return {text:"Welche Kategorie passt zu diesem Beispiel?",code:x.text,category:"Daten zuordnen",why:"Richtig ist „"+x.answer+"“.",opts:arr.map(a=>({text:a,correct:a===x.answer}))};
 }
 if(mode==="forecast"){
  let x=FORE.find(x=>x.id===id).x,n=Number((15.71+5.34*x).toFixed(2)),vals=shuffle([n,n+5.34,n-5.34,n+10.68].map(z=>Number(z.toFixed(2))));
  return {text:"Wie lautet die Prognose für "+x+" Sonnenstunden? (y in Hunderten Besuchern)",code:"y = 15,71 + 5,34 × "+x,category:"Regression",why:"15,71 + 5,34 × "+x+" = "+n.toFixed(2).replace(".",","),opts:vals.map(z=>({text:z.toFixed(2).replace(".",","),correct:z===n}))};
 }
 if(mode==="pipeline"){
  let p=C.pipelines.find(x=>"p"+x.id===id),correct=p.parts[run.step],arr=shuffle([correct,...shuffle(p.parts.filter((_,i)=>i!==run.step)).slice(0,3)]);
  return {text:"Welcher Schritt kommt bei "+p.name+" an Stelle "+(run.step+1)+"?",code:run.step?"Bisher: "+p.parts.slice(0,run.step).join(" → "):"Beginne mit dem ersten Prozessschritt.",category:"Prozess-Puzzle",why:p.parts.join(" → "),opts:arr.map(z=>({text:z,correct:z===correct}))};
 }
}
function prepare(){run.answered=false;run.picked=-1;run.correct=false;run.prompt=makePrompt()}
function modePage(){
 if(!run.items.length)return `<div class="result panel"><div class="icon">🏆</div><h1>Alles <span>erledigt.</span></h1><p>Hier sind keine Aufgaben mehr offen.</p><div class="actions">${navbtn("↩ Kommandozentrale","home")}${button("Nochmal üben","start:"+run.mode,"btn secondary")}</div></div>`;
 if(run.at>=run.items.length)return endRound();
 let p=run.prompt,meta=MODE.find(m=>m.id===run.mode),stat=progress(run.mode),id=run.items[run.at],pipe=run.mode==="pipeline"?C.pipelines.find(x=>"p"+x.id===id):null;
 let open=stat.left?`<details class="panel"><summary class="data-label">NOCH OFFEN · ${stat.left} AUFGABEN · DIREKT AUSWÄHLEN</summary><div class="inline-nav">${ids(run.mode).filter(x=>!s.solved[x]).map(x=>`<button data-open="${esc(x)}" class="${x===id?"active":""}">#${ids(run.mode).indexOf(x)+1}</button>`).join("")}</div></details>`:"";
 return `<div class="eyebrow">${meta.icon} ${esc(meta.title)} · ${run.focus?"NUR OFFENE AUFGABEN":"TRAININGSRUNDE"}</div><h1>${run.focus?"Fertig <span>stellen.</span>":"Wissen <span>anwenden.</span>"}</h1><p>Es zählt nur die richtige Antwort. Wiederholungen mischen die Optionen neu – so lernst du das Prinzip, nicht die Position.</p>
 <div class="actions">${stat.left?button("🎯 Fertig stellen ("+stat.left+")","finish:"+run.mode,"btn small"):""}${button("🔁 Alle Aufgaben","start:"+run.mode,"btn small secondary")}${navbtn("↩ Übersicht","home","btn small ghost")}</div>
 <div class="panel"><div class="eyebrow">MODUL-FORTSCHRITT</div><h2>${stat.done}/${stat.total} gemeistert</h2>${bar(stat.done,stat.total)}<small>Aktuelle Runde: ${run.at+1}/${run.items.length} · ${run.right} richtige Antworten</small>${run.mode==="quiz"?`<div class="info-strip">🪙 Heute ${Array.isArray(daily().quizIds)?daily().quizIds.length:0}/20 richtige unterschiedliche Quizfragen für je +25 TT vergütet</div>`:""}</div>
 ${run.focus?open:""}
 <div class="task-grid"><div class="question-card"><div class="eyebrow">${esc(p.category)} · ${run.at+1}/${run.items.length}</div>
 ${pipe?`<div class="puzzle-row">${pipe.parts.map((x,i)=>`<span class="puzzle-step ${i<run.step?"done":""}">${i<run.step?"✓ "+esc(x):i===run.step?"❔ "+(i+1):"🔒"}</span>`).join("")}</div>`:""}
 ${p.code?`<div class="code">${esc(p.code)}</div>`:""}<div class="question">${esc(p.text)}</div>${choices(p.opts,run.answered,run.picked,"answer")}
 ${run.answered?feed(run.correct,p.why)+`<div class="actions">${button(run.mode==="pipeline"&&!run.correct?"Diesen Schritt erneut ↻":run.mode==="pipeline"&&run.step<pipe.parts.length-1?"Nächster Schritt →":run.at+1===run.items.length?"Runde abschließen 🏁":"Nächste Aufgabe →","next")}</div>`:""}</div>
 <div class="info-card"><div class="eyebrow">💡 TRAININGS-TIPP</div><h3>${run.mode==="code"?"Code verstehen":run.mode==="sorter"?"Kategorien unterscheiden":run.mode==="forecast"?"Regressionsformel lesen":run.mode==="pipeline"?"Reihenfolge beherrschen":"Warum statt Wo"}</h3>
 <p>${run.mode==="code"?"Bei NumPy: Indizes beginnen bei 0, Slicing stoppt vor dem Endindex, axis=0 summiert Spalten.":run.mode==="sorter"?"Achte auf nahe Begriffe wie Variety und Veracity oder nominal und ordinal.":run.mode==="forecast"?"Lies x als Sonnenstunden; die Ausgabe y ist in Hunderten Besuchern.":run.mode==="pipeline"?"Es wird Schritt für Schritt die nächste Phase gesucht – nicht geraten.":"Begründe dir selbst jede Entscheidung, bevor du klickst."}</p>
 <div class="info-strip">⭐ Neues korrekt gelöstes Beispiel: XP + TT. Tägliches Quiz: zusätzliche TT. Keine Eingabe von Python-Code.</div></div></div>`;
}
function answer(i){
 if(!run||run.answered||!run.prompt?.opts[i])return;
 run.picked=i;run.answered=true;run.correct=run.prompt.opts[i].correct;
 if(run.correct){
  run.right++;s.combo++;s.maxCombo=Math.max(s.maxCombo||0,s.combo);
  let id=run.items[run.at];
  if(run.mode==="quiz"){payFirst(id,13,12);payDailyQuiz(id)}
  if(run.mode==="code")payFirst(id,20,18);
  if(run.mode==="sorter")payFirst(id,15,14);
  if(run.mode==="forecast")payFirst(id,20,18);
 }else{s.combo=0;store()}
 render();
}
function advance(){
 if(!run?.answered)return;
 if(run.mode==="pipeline"){
  const p=C.pipelines.find(x=>"p"+x.id===run.items[run.at]);
  if(!run.correct){prepare();render();return}
  if(run.step<p.parts.length-1){run.step++;prepare();render();return}
  payFirst("p"+p.id,55,45);run.step=0;
 }
 run.at++;
 if(run.at>=run.items.length){view="result";render();window.scrollTo(0,0)}
 else{prepare();render();window.scrollTo(0,0)}
}
function endRound(){
 let p=progress(run.mode);
 return `<div class="result panel"><div class="icon">🏅</div><div class="eyebrow">RUNDE ABGESCHLOSSEN</div><h1>GG, <span>weiter so.</span></h1><p>${run.right} richtige Antworten in ${run.items.length} Aufgaben. Insgesamt ${p.done}/${p.total} dieses Modus geschafft.</p><div class="actions" style="justify-content:center">${p.left?button("🎯 Die "+p.left+" offenen fertig stellen","finish:"+run.mode):""}${button("Nochmal üben","start:"+run.mode,"btn secondary")}${navbtn("Übersicht","home","btn ghost")}</div></div>`;
}
function bossIntro(){
 return `<div class="eyebrow">👾 ENDGAME · DSAIVERSE 1. TEST</div><h1>Finaler <span>AI-Boss.</span></h1><div class="panel"><h2>20 gemischte Multiple-Choice-Fragen</h2><p>Alle 16 Stoffbereiche, inklusive Code-Schnipsel. Die richtige Antwort wandert bei wiederholten Fragen auf andere Positionen. Ab 70 % gibt es einmal täglich +250 TT.</p>
 <div class="stats"><div class="stat"><b>${s.bestBoss||0}%</b><small>Bestes Ergebnis</small></div><div class="stat"><b>${s.bossRuns||0}</b><small>Bosskämpfe</small></div><div class="stat"><b>${daily().bossPaid?"✓":"250 TT"}</b><small>Täglicher Bonus</small></div><div class="stat"><b>70%</b><small>Für Tages-TT benötigt</small></div></div><div class="actions">${button("⚔️ Boss starten","start-boss")}${navbtn("Vorher lernen","academy","btn secondary")}</div></div>`;
}
function startBoss(){
 const primary=C.lessons.map(l=>shuffle(Q.filter(q=>q.topic===l.id))[0]).filter(Boolean);
 const chosen=shuffle([...primary,...shuffle(Q.filter(q=>!primary.includes(q))).slice(0,Math.max(0,20-primary.length))]).map(q=>q.id);
 run={mode:"boss",focus:false,items:chosen,at:0,step:0,answered:false,picked:-1,correct:false,right:0,prompt:null};
 view="boss-run";prepare();render();window.scrollTo(0,0)
}
function bossPage(){
 let p=run.prompt;
 return `<div class="eyebrow">👾 FINAL BOSS · FRAGE ${run.at+1}/${run.items.length}</div><h1>Data-Science-<span>Boss.</span></h1><div class="panel"><b>${run.right} richtig</b>${bar(run.at,run.items.length)}</div>
 <div class="task-grid"><div class="question-card"><div class="eyebrow">${esc(p.category)}</div>${p.code?`<div class="code">${esc(p.code)}</div>`:""}<div class="question">${esc(p.text)}</div>${choices(p.opts,run.answered,run.picked,"bossanswer")}
 ${run.answered?feed(run.correct,p.why)+`<div class="actions">${button(run.at+1===run.items.length?"Ergebnis ansehen 🏆":"Nächste Bossfrage →","boss-next")}</div>`:""}</div><div class="info-card"><h3>🤖 PROFESSOR BOT</h3><p>Keine Strafpunkte für falsche Antworten. Lern aus den Erklärungen und versuch's danach nochmal.</p><span class="tag">20 Fragen · 70 % für Bonus</span></div></div>`;
}
function bossAnswer(i){
 if(view!=="boss-run"||run.answered||!run.prompt.opts[i])return;
 run.answered=true;run.picked=i;run.correct=run.prompt.opts[i].correct;
 if(run.correct){run.right++;s.combo++;s.maxCombo=Math.max(s.maxCombo||0,s.combo)}else s.combo=0;
 store();render();
}
function bossNext(){
 if(!run.answered)return;run.at++;
 if(run.at<run.items.length){prepare();render();window.scrollTo(0,0);return}
 bossPercent=Math.round(run.right/run.items.length*100);
 s.bossRuns++;s.bestBoss=Math.max(s.bestBoss||0,bossPercent);
 if(bossPercent>=70)payFirst("boss70",150,130);
 payDailyBoss(bossPercent);store();view="boss-result";render();window.scrollTo(0,0);
}
function bossEnd(){
 return `<div class="result panel"><div class="icon">${bossPercent>=70?"👑":"🤖"}</div><div class="eyebrow">BOSSFIGHT COMPLETE</div><h1>${bossPercent>=70?"Boss <span>zerlegt.</span>":"Boss noch <span>nicht besiegt.</span>"}</h1><h2>${bossPercent}% richtig</h2><p>${bossPercent>=70?"Du hast die 70 % erreicht. Neue Boss-Erfolge bringen XP und TT, tägliche Wiederholungen können zusätzliche TT bringen.":"Noch nicht 70 %. Übe die Themen, lies die Begründungen und tritt erneut an."}</p><div class="actions" style="justify-content:center">${button("👾 Neuer Kampf","start-boss")}${navbtn("Lernakademie","academy","btn secondary")}${navbtn("Übersicht","home","btn ghost")}</div></div>`;
}
function render(){
 $("crumb").textContent=titles[view]||"Kommandozentrale";
 let selected=view==="lesson"?"academy":view.startsWith("boss")?"boss":view==="result"?run?.mode:view;
 document.querySelectorAll("#nav button[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===selected));
 $("main").innerHTML=view==="home"?overview():view==="academy"?academy():view==="atlas"?atlas():view==="lesson"?lesson():view==="boss"?bossIntro():view==="boss-run"?bossPage():view==="boss-result"?bossEnd():view==="result"?endRound():modePage();
}
function doAction(action){
 if(action.startsWith("finish:")){
  let mode=action.slice(7);
  if(mode==="academy"){let l=C.lessons.find(x=>!s.courseDone[x.id]);if(l)openLesson(l.id);else go("academy");return}
  if(allModes.includes(mode))begin(mode,true);return;
 }
 if(action.startsWith("start:")){let m=action.slice(6);if(allModes.includes(m))begin(m,false);return}
 if(action.startsWith("lesson:")){openLesson(action.slice(7));return}
 if(action==="next"){advance();return}
 if(action==="start-boss"){startBoss();return}
 if(action==="boss-next"){bossNext();return}
}
$("main").addEventListener("click",e=>{
 let t=e.target.closest("[data-lessonanswer]");if(t){lessonAnswer(Number(t.dataset.lessonanswer));return}
 t=e.target.closest("[data-bossanswer]");if(t){bossAnswer(Number(t.dataset.bossanswer));return}
 t=e.target.closest("[data-answer]");if(t){answer(Number(t.dataset.answer));return}
 t=e.target.closest("[data-lesson]");if(t){openLesson(t.dataset.lesson);return}
 t=e.target.closest("[data-open]");if(t&&run&&allModes.includes(run.mode)){
  let id=t.dataset.open;if(!ids(run.mode).includes(id))return;
  run.items=[id,...run.items.filter(x=>x!==id)];run.at=0;run.step=0;prepare();view=run.mode;render();return;
 }
 t=e.target.closest("[data-navmain]");if(t){go(t.dataset.navmain);return}
 t=e.target.closest("[data-action]");if(t)doAction(t.dataset.action);
});
$("nav").addEventListener("click",e=>{let t=e.target.closest("[data-nav]");if(t)go(t.dataset.nav)});
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("sidebar").classList.remove("open")});
let hash=location.hash.slice(1);if([...allModes,"home","academy","atlas","boss"].includes(hash))go(hash);else render();
})();