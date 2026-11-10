/* Sharpverse · 1. PA — source-grounded interactive C#/threading trainer.
 * Save keys and reward fields intentionally match the Studyverse trainer bridge.
 * All snippets are learning examples, not an in-browser C# compiler. */
(function(){
'use strict';
const D=window.SHARPVERSE_DATA;
const KEY='sharpverse_pa01_v1';
const PROFILE='studyverse_profile_v1';
const LABS=['race','deadlock','semaphore'];
const WRITING=[
 {id:'inherit',name:'Vererbung',prompt:'Ergänze die C#-Klassendeklaration: Car soll von Vehicle erben.',before:'class Vehicle { }\n// Deine Zeile:',sample:'class Car : Vehicle',check:/^\s*class\s+Car\s*:\s*Vehicle\s*(\{\s*\})?\s*;?\s*$/,hint:'In Java ist es extends, aber C# benutzt den Doppelpunkt. Klassenname Car, Basisklasse Vehicle.'},
 {id:'create',name:'Eine gemeinsame Kreuzung',prompt:'Erzeuge eine Crossroad-Instanz und speichere sie in der Variable road.',before:'class Crossroad { }\n// Deine Zeile:',sample:'Crossroad road = new Crossroad();',check:/^\s*(Crossroad\s+road|var\s+road)\s*=\s*new\s*(Crossroad)?\s*\(\s*\)\s*;\s*$/,hint:'new Crossroad() erzeugt das Objekt. Du darfst auch var road = new Crossroad(); verwenden.'},
 {id:'thread',name:'Thread starten',prompt:'Erzeuge einen Thread namens worker für die vorhandene Methode Work und starte ihn. Zwei Zeilen.',before:'void Work() { /* Arbeit */ }\n// Deine zwei Zeilen:',sample:'Thread worker = new Thread(Work);\nworker.Start();',check:/\b(?:Thread|var)\s+worker\s*=\s*new\s+(?:Thread\s*)?\(\s*Work\s*\)\s*;[\s\S]*\bworker\.Start\s*\(\s*\)\s*;/,hint:'new Thread(Work) erzeugt den Thread; worker.Start() startet ihn.'},
 {id:'lock',name:'Race Condition fixen',prompt:'Schreibe den lock-Block, der counter++ mit dem bereits vorhandenen gate schützt.',before:'int counter = 0;\nobject gate = new();\n// Dein Block:',sample:'lock (gate) { counter++; }',check:/^\s*lock\s*\(\s*gate\s*\)\s*\{\s*counter\s*\+\+\s*;\s*\}\s*$/,hint:'lock(gate) { counter++; } — für alle Threads dasselbe gate.'},
 {id:'wait',name:'Richtig warten',prompt:'Schreibe nur die while-Zeile, die wartet, solange ready false ist. Das lock(gate) ist bereits vorhanden.',before:'lock (gate)\n{\n  // Deine Zeile\n}',sample:'while (!ready) Monitor.Wait(gate);',check:/^\s*while\s*\(\s*!\s*ready\s*\)\s*Monitor\.Wait\s*\(\s*gate\s*\)\s*;\s*$/,hint:'while (!ready) Monitor.Wait(gate); — die Bedingung muss nach jedem Aufwachen erneut geprüft werden.'},
 {id:'release',name:'Semaphore richtig freigeben',prompt:'Welche Zeile gehört in den finally-Block, um den Semaphore slots freizugeben?',before:'slots.Wait();\ntry { DoWork(); }\nfinally {\n  // Deine Zeile\n}',sample:'slots.Release();',check:/^\s*slots\.Release\s*\(\s*\)\s*;\s*$/,hint:'Release() gibt den belegten Slot frei, auch wenn ein Fehler auftritt.'},
 {id:'dispatcher',name:'WPF-UI aktualisieren',prompt:'Schreibe eine Zeile mit Dispatcher.BeginInvoke, die statusLabel.Content auf "Fertig" setzt.',before:'// Hintergrundthread:\n// Deine Zeile:',sample:'Dispatcher.BeginInvoke(() => statusLabel.Content = "Fertig");',check:/^\s*Dispatcher\.BeginInvoke\s*\(\s*\(\s*\)\s*=>\s*statusLabel\.Content\s*=\s*"Fertig"\s*\)\s*;\s*$/,hint:'Dispatcher.BeginInvoke(() => statusLabel.Content = "Fertig"); – UI-Update auf dem UI-Thread.'},
 {id:'override',name:'Polymorphie',prompt:'Überschreibe Move() in Car so, dass die Methode "Schnell" zurückgibt. Schreib die vollständige Methodenzeile.',before:'class Vehicle { public virtual string Move() => "Normal"; }\nclass Car : Vehicle {\n  // Deine Methode\n}',sample:'public override string Move() => "Schnell";',check:/^\s*public\s+override\s+string\s+Move\s*\(\s*\)\s*=>\s*"Schnell"\s*;\s*$/,hint:'public override string Move() => "Schnell"; – override statt Java-Annotation.'}
];
function load(){
 const fresh={xp:0,coins:0,solved:{},learned:{},courseDone:{},earned:{},maxCombo:0,combo:0,bestBoss:0,labDone:{},writingDone:{},purchased:{}};
 try{
  const data=JSON.parse(localStorage.getItem(KEY)||'null');
  if(data&&typeof data==='object'&&!Array.isArray(data)){
   Object.assign(fresh,data);
   for(const k of ['solved','learned','courseDone','earned','labDone','writingDone','purchased']){
    if(!fresh[k]||typeof fresh[k]!=='object'||Array.isArray(fresh[k]))fresh[k]={};
   }
  }
 }catch{}
 return fresh;
}
const s=load();
let view='home',selected='',challengeMode='code',selectedQuestion='',selectedWriting='',lab='race',raceStep=0,deadlockMode='opposite',capacity=2,boss=null,lastFeedback='';
let menuOpen=false;
const h=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const count=o=>Object.keys(o||{}).filter(k=>o[k]).length;
const money=n=>Number(n||0).toLocaleString('de-AT');
const percent=(a,b)=>b?Math.round(a*100/b):0;
const choice=(text,action,cls)=>'<button type="button" class="'+(cls||'btn')+'" data-action="'+h(action)+'">'+h(text)+'</button>';
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){console.warn('Sharpverse save:',e);}
 if(typeof window.studyverseCloudTouch==='function')window.studyverseCloudTouch();
}
function reward(key,xp,tt){
 if(s.earned[key])return false;
 s.earned[key]=true;s.xp+=xp;s.coins+=tt;save();
 return true;
}
function toast(message){
 const el=document.getElementById('toast');
 el.textContent=message;el.classList.add('show');
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000);
}
function doneLesson(id){
 if(!s.courseDone[id]){
  s.courseDone[id]=true;s.learned[id]=true;
  reward('lesson:'+id,35,25);
  save();toast('🎓 Lektion gemeistert · +35 XP · +25 TastyTokens');
 }
 show('academy');
}
function show(next,detail){
 view=next;selected=detail||'';
 if(next==='code'||next==='transfer'||next==='extras'){
  challengeMode=next;
  const pool=questionsFor(next);
  if(!pool.some(q=>q.id===selectedQuestion))selectedQuestion=pool.find(q=>!s.solved['d'+q.id])?.id||pool[0]?.id||'';
  lastFeedback='';
 }
 if(next==='writing')selectedWriting=selectedWriting||WRITING[0].id;
 if(next==='boss')startBoss();
 render();window.scrollTo(0,0);
}
function progress(){return {lessons:count(s.courseDone),code:D.challenges.filter(x=>x.kind==='code'&&s.solved['d'+x.id]).length,transfer:D.challenges.filter(x=>x.kind==='transfer'&&s.solved['d'+x.id]).length,writing:count(s.writingDone)};}
function questionsFor(mode){
 if(mode==='code')return D.challenges.filter(q=>q.kind==='code');
 if(mode==='extras')return D.challenges.filter(q=>q.level===2);
 return D.challenges.filter(q=>q.kind==='transfer');
}
function markAnswer(id,pick){
 const q=D.challenges.find(x=>x.id===id);if(!q)return;
 const correct=Number(pick)===q.right;
 lastFeedback={id,correct,pick};
 if(correct){
  s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);
  if(!s.solved['d'+id]){
   s.solved['d'+id]=true;
   const paid=reward('question:'+id,24,18);
   if(paid)toast('⚡ Richtig! +24 XP · +18 TastyTokens');
  }
 }else{s.combo=0;save();}
 render();
}
function playQuestion(id){selectedQuestion=id;lastFeedback='';render();}
function nextQuestion(){
 const pool=questionsFor(challengeMode),i=pool.findIndex(x=>x.id===selectedQuestion);
 const next=pool.slice(i+1).find(q=>!s.solved['d'+q.id])||pool.slice(0,i+1).find(q=>!s.solved['d'+q.id])||pool[(i+1)%pool.length];
 if(next){selectedQuestion=next.id;lastFeedback='';render();}
}
function startBoss(){
 const pool=D.challenges.filter(q=>q.kind==='transfer'&&q.level===2);
 const advanced=D.challenges.filter(q=>q.kind==='transfer'&&q.level!==2);
 const code=D.challenges.filter(q=>q.kind==='code');
 const randomize=arr=>[...arr].sort(()=>Math.random()-.5);
 const items=[...randomize(pool).slice(0,2),...randomize(advanced).slice(0,7),...randomize(code).slice(0,3)];
 boss={items:randomize(items),at:0,right:0,answered:false,choice:-1,finished:false,percent:0};
}
function answerBoss(pick){
 if(!boss||boss.answered||boss.finished)return;
 const q=boss.items[boss.at];
 boss.answered=true;boss.choice=Number(pick);
 if(boss.choice===q.right)boss.right++;
 render();
}
function nextBoss(){
 if(!boss||!boss.answered)return;
 boss.at++;boss.answered=false;boss.choice=-1;
 if(boss.at>=boss.items.length){
  boss.finished=true;boss.percent=Math.round(100*boss.right/boss.items.length);
  if(boss.percent>s.bestBoss){s.bestBoss=boss.percent;save();}
  if(boss.percent>=80&&reward('boss80',150,150))toast('👑 Boss bezwungen · +150 XP · +150 TastyTokens');
  save();
 }
 render();
}
function finishWriting(){
 const task=WRITING.find(x=>x.id===selectedWriting),el=document.getElementById('writing-answer');
 if(!task||!el)return;
 const value=el.value.trim();
 // Deterministic syntax pattern check: a teaching aid, not actual C# compilation.
 if(task.check.test(value)){
  if(!s.writingDone[task.id]){s.writingDone[task.id]=true;s.solved['p'+task.id]=true;reward('writing:'+task.id,40,30);save();toast('✅ Syntax stimmt! +40 XP · +30 TastyTokens');}
  lastFeedback={id:task.id,correct:true};
 }else lastFeedback={id:task.id,correct:false};
 render();
}
function writeMode(id){selectedWriting=id;lastFeedback='';render();}
function escCode(code){return '<pre class="code"><code>'+h(code)+'</code></pre>';}
function progressBar(n,max){return '<div class="progress-track"><span style="width:'+Math.min(100,percent(n,max))+'%"></span></div>';}
function stat(title,num,detail,icon){return '<div class="stat"><span>'+icon+'</span><div><small>'+h(title)+'</small><b>'+h(num)+'</b><p>'+h(detail)+'</p></div></div>';}
function navLink(name,label,icon){
 return '<button type="button" class="nav-link'+(view===name?' active':'')+'" data-action="view:'+name+'"><span>'+icon+'</span>'+h(label)+'</button>';
}
function header(){
 const p=progress(),player=(()=>{try{return JSON.parse(localStorage.getItem(PROFILE)||'{}')}catch{return {}}})();
 const avatar=player.equipped?.avatar||'🐑';
 return '<header class="topbar"><button type="button" class="mobile-menu" data-action="menu">☰</button><div class="breadcrumbs">✦ SHARPVERSE <span>/</span> <b>1. PA</b></div>'+
 '<div class="top-info"><a class="studyverse-back" href="../../" title="Zur Studyverse-Homepage"><span>↩</span><span>STUDYVERSE</span></a><span class="token">🪙 '+money(s.coins)+' TT</span><a class="profile-link" href="../../#profile"><span class="avatar">'+h(avatar)+'</span> Mein Profil</a></div></header>';
}
function sidebar(){
 const p=progress();
 return '<aside class="sidebar'+(menuOpen?' open':'')+'"><a class="brand" href="../../"><span class="logo">♯</span><span><b>Sharpverse</b><small>1. PA · C# &amp; THREADING</small></span></a>'+
 '<p class="nav-title">DEIN PROGRAMMIER-UNIVERSUM</p>'+navLink('home','Kommandozentrale','◈')+
 '<p class="nav-title">LERNEN</p>'+navLink('academy','Lernakademie','📘')+navLink('vs','Visual Studio Crashkurs','🖥️')+navLink('lab','Threading-Labor','⚡')+
 '<p class="nav-title">ANWENDEN</p>'+navLink('code','Code-Detective','🧩')+navLink('writing','Code-Schreibtrainer','✍️')+navLink('transfer','PA-Transferaufgaben','🧠')+navLink('extras','Extra Extensions','🔥')+
 '<p class="nav-title">ENDGAME</p>'+navLink('boss','1. PA · Bosskampf','👑')+navLink('sources','Quellen','📚')+
 '<div class="nav-bottom"><small>DEIN FORTSCHRITT</small><strong>'+p.lessons+' / '+D.lessons.length+' Lektionen</strong>'+progressBar(p.lessons,D.lessons.length)+'<p>☁ Spielstand mit Studyverse verbunden</p><a href="../../">↩ Studyverse</a></div></aside>';
}
function home(){
 const p=progress(),pct=p.lessons/D.lessons.length;
 const featured=[
 ['vs','🖥️','Von IntelliJ zu Visual Studio','Projekte, Klassen, Debugger & WPF-Vorlagen','start'],
 ['academy','📘','C# verstehen','20 gezielte Lektionen vom absoluten C#-Einstieg bis zu Dispatcher','learn'],
 ['lab','⚡','Threading-Labor','Race Conditions, Deadlocks und Semaphoren live ausprobieren','lab'],
 ['writing','✍️','Code selber schreiben','8 kleine C#-Bausteine tippen, nicht einfach raten','practice'],
 ['transfer','🧠','Transfer statt auswendig','24 unbekannte Situationen mit bekannten Konzepten','test'],
 ['boss','👑','Professor Spermann','12 Aufgaben · 100 % für den exklusiven Boss-Titel','boss']
 ];
 return '<section class="hero"><div class="eyebrow">DAS VERSTEHST DU DANN WIRKLICH · 1. PRAKTISCHE ARBEIT</div>'+
 '<h1>Code verstehen.<br><em>Probleme lösen.</em></h1><p>Dein C#-Survival-Kit für eine praktische Arbeit mit neuem Kontext. Keine Copy-Paste-Musterlösungen – wir lernen, WARUM ein Programm funktioniert.</p>'+
 '<div class="hero-actions">'+choice('📘 Lernpfad starten','view:academy','primary')+choice('⚡ Threading simulieren','view:lab','secondary')+'</div>'+
 '<div class="hero-emblem">C<span>#</span></div></section>'+
 '<section class="stats">'+stat('LERNLEKTIONEN',p.lessons+'/'+D.lessons.length,'Theorie plus Code','📘')+stat('CODE ERKANNT',p.code+'/'+D.challenges.filter(q=>q.kind==='code').length,'Code-Detective','🧩')+stat('TRANSFER',p.transfer+'/'+D.challenges.filter(q=>q.kind==='transfer').length,'Neue Kontexte','🧠')+stat('BOSS-REKORD',s.bestBoss+' %','100 % → Professor Spermann','👑')+'</section>'+
 '<div class="section-heading"><h2>Deine Missionen <span>✦</span></h2><small>Wissen → Code → Transfer</small></div>'+
 '<div class="mode-grid">'+featured.map(([mode,icon,name,desc])=>'<button class="mode-card" data-action="view:'+mode+'"><span class="mode-icon">'+icon+'</span><strong>'+h(name)+'</strong><p>'+h(desc)+'</p><span class="arrow">Ansehen ↗</span></button>').join('')+'</div>'+
 '<section class="notice"><b>🎯 So läuft die 1. PA</b><p>In euren Übungsangaben stecken Counter, Primzahlen, Philosophen, Drei Raucher, Kreuzung, Achterbahn, ImageRotator und FloodFill. Der Kontext kann sich ändern – die Regeln für Thread-Sicherheit nicht. Extra Extensions sind berücksichtigt.</p></section>';
}
function academy(filter){
 const groups=['START','C# BASIS','THREADING','WPF'];
 const filtered=filter?D.lessons.filter(x=>x.group==='START'):D.lessons;
 return '<div class="eyebrow">'+(filter?'MICRO-ONBOARDING':'THEORIE → BEGREIFEN → CODE ANWENDEN')+'</div>'+
 '<h1 class="page-title">'+(filter?'Visual Studio <em>Survival.</em>':'Deine <em>Lernakademie.</em>')+'</h1>'+
 '<p class="subtitle">Keine 300 unverbundenen PowerPoint-Fakten. Die Theorie ist in 20 aufeinander aufbauende Lektionen zerlegt – mit Beispielcode und Transferwarnungen.</p>'+
 '<section class="notice"><b>🗺️ Lernroute</b><p>1. Visual Studio → 2. C# Basics → 3. Multithreading → 4. WPF. Du darfst jede Lektion direkt öffnen. Vergessene Grundbegriffe kannst du jederzeit nachholen.</p></section>'+
 groups.filter(g=>filtered.some(l=>l.group===g)).map(g=>{
 const arr=filtered.filter(l=>l.group===g),done=arr.filter(l=>s.courseDone[l.id]).length;
 return '<section class="lesson-group"><div class="section-heading"><h2>'+h(g)+'</h2><small>'+done+'/'+arr.length+' abgeschlossen</small></div>'+progressBar(done,arr.length)+
 '<div class="lesson-grid">'+arr.map((l,i)=>'<button class="lesson-card '+(s.courseDone[l.id]?'complete':'')+'" data-action="lesson:'+h(l.id)+'"><span class="lesson-index">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+h(l.title)+'</strong><p>'+h(l.lead)+'</p></div><span class="lesson-status">'+(s.courseDone[l.id]?'✓':'↗')+'</span></button>').join('')+'</div></section>';
 }).join('');
}
function lessonPage(){
 const l=D.lessons.find(x=>x.id===selected);if(!l)return academy();
 const ix=D.lessons.indexOf(l),next=D.lessons[ix+1];
 return '<div class="eyebrow">'+h(l.group)+' · KAPITEL '+(ix+1)+'/'+D.lessons.length+'</div><h1 class="page-title">'+h(l.title)+'</h1>'+
 '<p class="subtitle">'+h(l.lead)+'</p><section class="lesson-detail"><h2>💡 Das musst du verstehen</h2>'+
 '<div class="lesson-steps">'+l.steps.map((x,i)=>'<div class="lesson-step"><span>'+String(i+1).padStart(2,'0')+'</span><p>'+h(x)+'</p></div>').join('')+'</div>'+
 '<h2>🧩 Echten Code lesen</h2>'+escCode(l.code)+
 '<div class="warning"><b>⚠️ Typischer PA-Fail</b><p>'+h(l.trap)+'</p></div><small class="source">Bezug zum Unterricht: '+h(l.source)+'</small></section>'+
 '<div class="actions">'+choice(s.courseDone[l.id]?'✓ Bereits abgeschlossen':'🎓 Verstanden – Lektion abschließen','done:'+l.id,'primary')+
 (next?choice('Nächste Lektion →','lesson:'+next.id,'secondary'):'')+choice('Zur Lernakademie','view:academy','ghost')+'</div>';
}
function challengePage(){
 const pool=questionsFor(challengeMode),q=pool.find(x=>x.id===selectedQuestion)||pool[0];if(!q)return '<p>Keine Aufgaben verfügbar.</p>';
 const achieved=pool.filter(x=>s.solved['d'+x.id]).length,isExtra=challengeMode==='extras';
 const caption=challengeMode==='code'?'CODE-DETECTIVE':isExtra?'EXTRA EXTENSIONS':'PA-TRANSFER';
 const fb=lastFeedback&&lastFeedback.id===q.id?lastFeedback:null;
 return '<div class="eyebrow">'+caption+' · EIGENE DENKLEISTUNG</div><h1 class="page-title">'+(isExtra?'Die <em>Extra Extensions.</em>':challengeMode==='code'?'Code <em>lesen & reparieren.</em>':'Neue Situationen. <em>Gleiche Regeln.</em>')+'</h1>'+
 '<p class="subtitle">Alles, was du zum Lösen brauchst, steht in der Aufgabenstellung. Kein unsichtbarer Code, keine vorherige Aufgabe auswendig lernen.</p>'+
 '<div class="challenge-progress"><strong>'+achieved+' / '+pool.length+' gemeistert</strong>'+progressBar(achieved,pool.length)+'</div>'+
 '<div class="challenge-layout"><section class="challenge-card"><div class="eyebrow">'+h(q.topic)+' · '+(pool.indexOf(q)+1)+'/'+pool.length+'</div><h2>'+h(q.title)+'</h2>'+
 escCode(q.code)+
 '<div class="answers">'+q.answers.map((a,i)=>'<button class="answer '+(fb?(i===q.right?'correct':i===fb.pick?'wrong':''):'')+'" data-action="answer:'+h(q.id)+':'+i+'" '+(fb?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+h(a)+'</button>').join('')+'</div>'+
 (fb?'<div class="feedback '+(fb.correct?'right':'wrong')+'"><b>'+(fb.correct?'✅ Korrekt!':'❌ Noch nicht ganz.')+'</b><p>'+h(q.explain)+'</p></div><div class="actions">'+choice('Nächste Aufgabe →','next-question','primary')+'</div>':'')+'</section>'+
 '<aside class="tip-card"><div class="eyebrow">🎯 ANWENDEN STATT RATEN</div><h3>Dein PA-Mindset</h3><p>Frag dich zuerst: Welche Ressourcen teilen sich die Threads? Wer darf wann in den kritischen Bereich? Welche Bedingung muss immer gelten?</p><div class="tag">Quelle: '+h(q.source)+'</div>'+
 '<hr><b>Direkt zu einer Aufgabe</b><div class="task-pills">'+pool.map((x,i)=>'<button class="'+(x.id===q.id?'selected ':'')+(s.solved['d'+x.id]?'done':'')+'" data-action="question:'+h(x.id)+'">'+(i+1)+'</button>').join('')+'</div></aside></div>';
}
function writingPage(){
 const t=WRITING.find(x=>x.id===selectedWriting)||WRITING[0];const fb=lastFeedback&&lastFeedback.id===t.id?lastFeedback:null;
 return '<div class="eyebrow">MINI-PRAXIS · NICHT NUR ANKLICKEN</div><h1 class="page-title">Schreib den <em>Code selbst.</em></h1><p class="subtitle">Kleine Syntaxaufgaben als Brücke zur echten PA. Hier wird dein Text anhand bekannter Muster geprüft – das ist kein C#-Compiler. Für komplexe Aufgaben nutzt du Visual Studio.</p>'+
 '<div class="challenge-progress"><strong>'+count(s.writingDone)+' / '+WRITING.length+' geschrieben</strong>'+progressBar(count(s.writingDone),WRITING.length)+'</div>'+
 '<div class="writing-layout"><div class="writing-card"><div class="eyebrow">'+h(t.name)+'</div><h2>'+h(t.prompt)+'</h2>'+escCode(t.before)+'<label class="field-label" for="writing-answer">Deine C#-Antwort</label><textarea id="writing-answer" spellcheck="false" autocapitalize="off" placeholder="Tippe hier C#-Code..."></textarea>'+
 '<div class="actions">'+choice('Code prüfen ✓','check-writing','primary')+choice('Nächste Aufgabe','next-writing','secondary')+'</div>'+
 (fb?'<div class="feedback '+(fb.correct?'right':'wrong')+'"><b>'+(fb.correct?'✅ Muster erkannt!':'⚠️ Das passt noch nicht.')+'</b><p>'+h(fb.correct?'Sauber. Vergleiche trotzdem mit Visual Studio, wenn du komplexere Varianten programmierst.':t.hint)+'</p><details><summary>Beispielantwort anzeigen</summary>'+escCode(t.sample)+'</details></div>':'')+
 '</div><aside class="tip-card"><h3>Deine 8 Bausteine</h3><div class="writing-list">'+WRITING.map((x,i)=>'<button class="'+(x.id===t.id?'selected':'')+'" data-action="writing:'+x.id+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+h(x.name)+' '+(s.writingDone[x.id]?'✓':'')+'</button>').join('')+'</div></aside></div>';
}
const RACE=[
 {a:'Wert 0 lesen',b:'Wartet',memory:0,aa:0,bb:0,desc:'Thread A liest counter=0.'},
 {a:'Lokalen Wert 1 berechnen',b:'Wert 0 lesen',memory:0,aa:1,bb:0,desc:'Thread B liest denselben alten Wert 0.'},
 {a:'Wartet',b:'Lokalen Wert 1 berechnen',memory:0,aa:1,bb:1,desc:'Beide berechnen unabhängig voneinander 1.'},
 {a:'Schreibt 1',b:'Wartet',memory:1,aa:1,bb:1,desc:'A schreibt 1 in den gemeinsamen Speicher.'},
 {a:'Fertig',b:'Schreibt 1',memory:1,aa:1,bb:1,desc:'B überschreibt mit 1. Erwartet wären 2! Ein Update ist verloren.'}
];
function labPage(){
 const buttons=LABS.map(id=>choice(id==='race'?'⚡ Race Condition':id==='deadlock'?'🔒 Deadlock':'🚥 Semaphore','lab:'+id,lab===id?'selected':'secondary')).join('');
 let scene='';
 if(lab==='race'){
  const step=RACE[Math.min(raceStep,RACE.length-1)];
  scene='<h2>Zwei Threads, ein Zähler</h2><p>Starte bei counter=0. Beide Threads wollen einmal erhöhen. Klicke Schritt für Schritt durch das Interleaving.</p>'+
  '<div class="simulation-grid"><div class="sim-agent"><small>THREAD A</small><strong>'+h(step.a)+'</strong><b>lokal: '+step.aa+'</b></div><div class="sim-memory"><small>SHARED COUNTER</small><strong>'+step.memory+'</strong><b>erwartet: 2</b></div><div class="sim-agent"><small>THREAD B</small><strong>'+h(step.b)+'</strong><b>lokal: '+step.bb+'</b></div></div>'+
  '<div class="sim-state"><strong>SCHRITT '+(raceStep+1)+' / 5</strong><p>'+h(step.desc)+'</p></div>'+
  '<div class="actions">'+choice('Nächster Schritt →','race-next','primary')+choice('↻ Zurücksetzen','race-reset','secondary')+'</div>'+
  (raceStep===4?'<div class="feedback wrong"><b>💡 Lösungsprinzip: lock(gate) oder Interlocked.Increment(ref counter)</b><p>Mit dem gleichen gemeinsamen Lock wird die Lese-/Schreibfolge atomar geschützt.</p></div>':'');
 }else if(lab==='deadlock'){
  scene='<h2>Der Deadlock-Detektor</h2><p>Thread A braucht zuerst Ressource 1, dann Ressource 2. Was passiert, wenn Thread B die Reihenfolge umdreht?</p>'+
  '<div class="deadlock-actions">'+choice('Gegensätzliche Lock-Reihenfolge','deadlock:opposite',deadlockMode==='opposite'?'selected':'secondary')+choice('Gleiche Lock-Reihenfolge','deadlock:same',deadlockMode==='same'?'selected':'secondary')+'</div>'+
  '<div class="deadlock-scene"><div class="resource">T1<br><small>besitzt R1</small></div><div class="resource-arrow">'+(deadlockMode==='opposite'?'⟷':'→')+'</div><div class="resource">T2<br><small>'+(deadlockMode==='opposite'?'besitzt R2':'wartet auf R1')+'</small></div></div>'+
  '<div class="feedback '+(deadlockMode==='opposite'?'wrong':'right')+'"><b>'+(deadlockMode==='opposite'?'🔒 DEADLOCK MÖGLICH':'✅ DEADLOCK DURCH REIHENFOLGE VERMIEDEN')+'</b><p>'+(deadlockMode==='opposite'?'T1 hält R1 und wartet auf R2; T2 hält R2 und wartet auf R1. Circular Wait!':'Beide nehmen zuerst R1, dann R2. Nur einer kann zuerst eintreten; der andere wartet, ohne selbst R2 zu blockieren.')+'</p></div>';
 }else{
  scene='<h2>Semaphore-Simulator</h2><p>Fünf Threads wollen dieselbe Ressource. Begrenze die Zahl der gleichzeitig arbeitenden Threads.</p>'+
  '<div class="semaphore-controls"><span>Parallel erlaubte Threads:</span>'+choice('−','capacity-minus','secondary')+'<strong>'+capacity+'</strong>'+choice('+','capacity-plus','secondary')+'</div>'+
  '<div class="sim-workers">'+[0,1,2,3,4].map(i=>'<div class="worker '+(i<capacity?'inside':'waiting')+'"><b>Thread '+(i+1)+'</b><small>'+(i<capacity?'✓ IN DER RESSOURCE':'⏳ WARTET')+'</small></div>').join('')+'</div>'+
  '<div class="feedback right"><b>SemaphoreSlim('+capacity+', '+capacity+')</b><p>Es arbeiten höchstens '+capacity+' gleichzeitig. Die Wartenden werden nach Release zugelassen. Bei der Achterbahn reicht das allein NICHT, um „genau x vor Abfahrt“ zu erzwingen.</p></div>';
 }
 return '<div class="eyebrow">LEARNING BY SEEING</div><h1 class="page-title">Das <em>Threading-Labor.</em></h1><p class="subtitle">Bewegte Denkmodelle statt nur trockener Definitionen. Hier sind die Situationen bewusst vereinfacht; echte Thread-Reihenfolgen sind nicht deterministisch.</p>'+
 '<div class="lab-tabs">'+buttons+'</div><section class="lab-card">'+scene+'</section>';
}
function bossPage(){
 if(!boss)startBoss();
 if(boss.finished){
  const perfect=boss.percent===100;
  return '<div class="result '+(perfect?'perfect':'')+'"><div class="result-icon">'+(perfect?'👑':'🧠')+'</div><div class="eyebrow">1. PA · BOSSBATTLE ABGESCHLOSSEN</div><h1>'+boss.percent+' % <em>'+ (perfect?'PERFEKT!':'GESCHAFFT?') +'</em></h1>'+
  '<p>'+boss.right+'/'+boss.items.length+' richtige Antworten. Dein Bestwert: '+s.bestBoss+' %. '+(perfect?'Du hast den Kauf des Prestige-Titels „Professor Spermann“ freigeschaltet!':'Für den Titel „Professor Spermann“ brauchst du einen perfekten Durchlauf. Du kannst jederzeit nochmal trainieren.')+'</p>'+
  '<div class="actions">'+choice('Bosskampf wiederholen','view:boss','primary')+choice('Zur Kommandozentrale','view:home','secondary')+'</div></div>';
 }
 const q=boss.items[boss.at],answered=boss.answered,correct=answered&&boss.choice===q.right;
 return '<div class="eyebrow">👑 1. PA · PROFESSOR SPERMANN</div><h1 class="page-title">Der <em>Endgegner.</em></h1><div class="challenge-progress"><strong>AUFGABE '+(boss.at+1)+' / '+boss.items.length+'</strong>'+progressBar(boss.at,boss.items.length)+'<small>'+boss.right+' bisher richtig</small></div>'+
 '<div class="boss-card"><div class="eyebrow">'+h(q.topic)+' · UNBEKANNTER KONTEXT</div><h2>'+h(q.title)+'</h2>'+escCode(q.code)+
 '<div class="answers">'+q.answers.map((a,i)=>'<button class="answer '+(answered?(i===q.right?'correct':i===boss.choice?'wrong':''):'')+'" '+(answered?'disabled':'')+' data-action="boss-answer:'+i+'"><span>'+String.fromCharCode(65+i)+'</span>'+h(a)+'</button>').join('')+'</div>'+
 (answered?'<div class="feedback '+(correct?'right':'wrong')+'"><b>'+(correct?'✅ Richtig!':'❌ Leider falsch.')+'</b><p>'+h(q.explain)+'</p></div><div class="actions">'+choice(boss.at+1===boss.items.length?'Ergebnis ansehen 🏁':'Nächste Aufgabe →','boss-next','primary')+'</div>':'')+'</div>'+
 '<p class="exam-note">Der Boss prüft Transfer und Codeverständnis. 100 % schalten den exklusive Shop-Titel frei – der eigentliche C#-Programmiernachweis passiert weiterhin in Visual Studio.</p>';
}
function sources(){
 return '<div class="eyebrow">QUELLEN</div><h1>Quellen</h1><section class="panel sources-list"><h2>Unterrichtsunterlagen · C#, Threading &amp; WPF</h2><p>Grundlage sind die Theorieunterlagen und praktischen Aufgaben der 1. PA. Die Lernkapitel nennen zusätzlich ihren jeweiligen Unterrichtsbezug.</p><ul>'+D.sources.map(source=>'<li>'+h(source)+'</li>').join('')+'</ul></section>';
}
function render(){
 // Initial entry only contains #app; #main is created by this first render.
 let page='';
 switch(view){
  case 'sources':page=sources();break;
  case 'academy':page=academy();break;case 'vs':page=academy(true);break;
  case 'lesson':page=lessonPage();break;
  case 'code':case 'transfer':case 'extras':page=challengePage();break;
  case 'writing':page=writingPage();break;
  case 'lab':page=labPage();break;
  case 'boss':page=bossPage();break;
  default:page=home();
 }
 document.getElementById('app').innerHTML=sidebar()+'<div class="workspace">'+header()+'<main id="main" aria-live="polite">'+page+'</main><footer>♯ Sharpverse · 1. PA · C# · Multithreading · WPF <span>Eigene Lernhilfe auf Basis eurer Unterrichtsangaben · Kein C#-Compiler</span></footer></div>';
}
document.addEventListener('click',function(e){
 const el=e.target.closest('[data-action]');if(!el)return;
 const action=el.getAttribute('data-action');
 if(action==='menu'){menuOpen=!menuOpen;render();return;}
 menuOpen=false;
 if(action.startsWith('view:'))return show(action.slice(5));
 if(action.startsWith('lesson:'))return show('lesson',action.slice(7));
 if(action.startsWith('done:'))return doneLesson(action.slice(5));
 if(action.startsWith('question:'))return playQuestion(action.slice(9));
 if(action.startsWith('answer:')){const spl=action.split(':');return markAnswer(spl[1],Number(spl[2]));}
 if(action==='next-question')return nextQuestion();
 if(action.startsWith('writing:'))return writeMode(action.slice(8));
 if(action==='next-writing'){const i=WRITING.findIndex(x=>x.id===selectedWriting);return writeMode(WRITING[(i+1)%WRITING.length].id);}
 if(action==='check-writing')return finishWriting();
 if(action.startsWith('lab:')){lab=action.slice(4);return render();}
 if(action==='race-next'){raceStep=(raceStep+1)%5;return render();}
 if(action==='race-reset'){raceStep=0;return render();}
 if(action.startsWith('deadlock:')){deadlockMode=action.slice(9);return render();}
 if(action==='capacity-minus'){capacity=Math.max(1,capacity-1);return render();}
 if(action==='capacity-plus'){capacity=Math.min(5,capacity+1);return render();}
 if(action.startsWith('boss-answer:'))return answerBoss(action.slice(12));
 if(action==='boss-next')return nextBoss();
});
render();
})();
