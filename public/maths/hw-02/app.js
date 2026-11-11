'use strict';
(function(){
 const D=window.MATHSVERSE_DATA,E=window.MATHSVERSE_MATH,W=window.MATHSVERSE_WORKBOOK,G=window.MATHSVERSE_GRAPHS;
 if(!W||!G)throw Error('MathsVerse: Rechenbaukasten oder Graphen fehlen.');
 if(!D||!E)throw Error('MathsVerse: Aufgaben oder Rechenkern fehlen.');
 const KEY='mathsverse_hw02_v1',PROFILE='studyverse_profile_v1';
 const $=s=>document.querySelector(s),money=n=>new Intl.NumberFormat('de-AT').format(n);
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const icon={'Stammfunktionen':'∫','Bestimmte Integrale':'∑','Flächen':'▱','Drohnenaufgabe':'🚁'};
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const initial={xp:0,coins:0,solved:{},learned:{},earned:{},bestBoss:0,attempts:0};
 const old=read(KEY);const s={...initial,...(old&&typeof old==='object'?old:{}),
  solved:{...(old?.solved||{})},learned:{...(old?.learned||{})},earned:{...(old?.earned||{})}};
 let screen='home',group='Alle',academyGroup=D.groups[0].name,academyFocus=null,selectedId=D.tasks[0].id;
 let phase=0,methodOrder=[0,1,2],stepOrder=[0,1,2],attempts=0,feedback='',solutionOpen=false;
 let labMode='builder',workIndex=0,workHistory=[],workHint=false;
 let boss=null,noticeTimer=null;
 function save(){
  localStorage.setItem(KEY,JSON.stringify(s));
  if(typeof window.studyverseCloudTouch==='function')window.studyverseCloudTouch();
 }
 function award(key,xp,tokens){
  if(s.earned[key])return false;
  s.earned[key]=true;s.xp+=xp;s.coins+=tokens;save();
  return true;
 }
 function shuffle(items){
  let a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
 }
 function current(){return D.tasks.find(t=>t.id===selectedId)||D.tasks[0]}
 function count(groupName){return D.tasks.filter(t=>(groupName==='Alle'||t.group===groupName)&&s.solved['q'+t.id]).length}
 function total(groupName){return D.tasks.filter(t=>groupName==='Alle'||t.group===groupName).length}
 function pct(value,whole){return whole?Math.round(value/whole*100):0}
 function toast(message){
  const el=$('#toast');if(!el)return;
  el.textContent=message;el.classList.add('visible');
  if(noticeTimer)clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>el.classList.remove('visible'),3600);
 }
 function taskLabel(t){return t.id.replace('1.100-','1.100 / ')}
 function taskCard(t,action='train'){
  const done=!!s.solved['q'+t.id];
  return '<button type="button" class="task-card '+(done?'done ':'')+(selectedId===t.id?'picked':'')+'" data-action="'+action+':'+esc(t.id)+'">'+
   '<span class="task-symbol">'+(done?'✓':esc(icon[t.group]))+'</span><span><strong>'+esc(taskLabel(t))+'</strong><small>'+esc(t.group)+'</small>'+
   '<span class="task-formula">'+esc(t.math)+'</span></span><span class="task-arrow">↗</span></button>';
 }
 function head(){
  const player=read(PROFILE)||{},avatar=player.equipped?.avatar||'∑';
  return '<header class="topbar"><div class="breadcrumb"><span>∑ MATHSVERSE</span><span class="slash">/</span><b>2. Hausübungswiederholung</b></div>'+
   '<div class="top-links"><a href="../../" aria-label="Zur StudyVerse-Startseite">↩ <span>STUDYVERSE</span></a>'+
   '<a href="../../#profile" aria-label="Profil öffnen"><span>'+esc(avatar)+'</span> Mein Profil</a></div></header>';
 }
 function tabs(){
  return '<aside class="sidebar"><a class="brand" href="../../"><span class="brand-mark">∑</span><span>MathsVerse<small>2. HAUSÜBUNGSWIEDERHOLUNG</small></span></a>'+
   '<p class="nav-label">LERN-MISSIONEN</p><nav class="nav" aria-label="MathsVerse Navigation">'+[
    ['home','◈','Kommandozentrale'],['academy','📖','Verstehen'],['practice','✍️','Rechenbaukasten'],['boss','👑','Testmodus · Boss']
   ].map(([id,ico,title])=>'<button type="button" class="'+(screen===id?'selected':'')+'" data-action="view:'+id+'"><span>'+ico+'</span>'+title+'</button>').join('')+
   '</nav><div class="side-foot"><span>🧮 18 Teilaufgaben</span><small>Deine Buchbeispiele · ohne zusätzliche Themen</small><a href="../../">↩ Zur StudyVerse-Zentrale</a></div></aside>';
 }
 function shell(content){
  $('#app').innerHTML=tabs()+'<div class="workspace">'+head()+'<main class="main">'+content+
   '</main><footer>∑ MathsVerse · 2. Hausübungswiederholung · Mathe-Lernhilfe für die Aufgaben 1.55–1.100</footer></div>';
 }
 function renderHome(){
  const done=count('Alle'),all=total('Alle');
  return '<section class="hero"><div class="eyebrow">MATHSVERSE · DEIN MATHE-COME­BACK</div><h1>Mathe verstehen.<br><em>Bosskampf gewinnen.</em></h1>'+
   '<p>2. Hausübungswiederholung · 18 Buchaufgaben mit echten Graphen, eigenem Rechenheft, überprüfbaren Zwischenschritten und Testmodus.</p>'+
   '<div class="actions"><button class="primary" data-action="view:academy">📖 Lösungen lernen</button><button class="secondary" data-action="view:practice">✍️ Jetzt rechnen</button></div>'+
   '<div class="hero-art" aria-hidden="true">∫<span>π</span><span>x²</span></div></section>'+
   '<section class="stats"><div class="stat"><small>BEISPIELE</small><strong>'+all+'</strong><span>aus deinen Screenshots</span></div>'+
   '<div class="stat"><small>GEMEISTERT</small><strong>'+done+'</strong><span>'+pct(done,all)+' % Fortschritt</span></div>'+
   '<div class="stat"><small>LERNKAPITEL</small><strong>'+Object.keys(s.learned).filter(k=>s.learned[k]).length+' / '+D.groups.length+'</strong><span>vorgerechnete Muster</span></div>'+
   '<div class="stat"><small>BOSS-REKORD</small><strong>'+s.bestBoss+' %</strong><span>10 zufällige Aufgaben</span></div></section>'+
   '<div class="section-title"><div><span class="eyebrow">LERNROUTE</span><h2>Was steht morgen an?</h2></div><span class="dim">Klick ein Kapitel zum Üben an</span></div>'+
   '<div class="group-grid">'+D.groups.map(g=>'<button class="group-card" data-action="group:'+esc(g.name)+'"><span class="group-icon">'+g.icon+'</span><strong>'+esc(g.name)+'</strong><small>'+esc(g.description)+'</small>'+
   '<div class="progress"><span style="width:'+pct(count(g.name),total(g.name))+'%"></span></div><span class="group-stat">'+count(g.name)+' / '+total(g.name)+' geschafft ↗</span></button>').join('')+'</div>'+
   '<div class="tip-strip">💡 <b>Wichtig bei Flächen:</b> Ein bestimmtes Integral darf negativ sein. Ein geometrischer Flächeninhalt nicht. Vorzeichenwechsel immer prüfen!</div>'+
   '<div class="section-title"><h2>Bereit fürs Endgame?</h2></div><div class="boss-preview"><div>👑</div><span><b>Bosskampf · 10 Aufgaben</b><small>Ohne Tipps, gemischte Beispieltypen und eine ehrliche Auswertung.</small></span><button class="primary" data-action="view:boss">Starten ↗</button></div>';
 }
 function groupPicker(action,currentGroup){
  return '<div class="chips">'+['Alle',...D.groups.map(x=>x.name)].map(g=>'<button type="button" class="'+(currentGroup===g?'active':'')+'" data-action="'+action+':'+esc(g)+'">'+esc(g)+'</button>').join('')+'</div>';
 }
 function renderAcademy(){
  const g=D.groups.find(x=>x.name===academyGroup)||D.groups[0];
  const lessons=D.tasks.filter(t=>t.group===g.name);
  const task=lessons.find(t=>t.id===academyFocus)||lessons[0];
  return '<div class="heading"><span class="eyebrow">📖 LERN­AKADEMIE</span><h1>Vorgerechnet. <em>Schritt für Schritt.</em></h1><p>Hier stehen wirklich alle ausgewählten Aufgaben mit vollständigem Lösungsweg. Such dir ein Kapitel und dann ein Beispiel aus.</p></div>'+
   '<div class="chips">'+D.groups.map(item=>'<button type="button" class="'+(item.name===g.name?'active':'')+'" data-action="academy-group:'+esc(item.name)+'">'+item.icon+' '+esc(item.name)+'</button>').join('')+'</div>'+
   '<section class="lesson-intro"><span class="lesson-big">'+g.icon+'</span><div><span class="eyebrow">MERKREGEL</span><h2>'+esc(g.name)+'</h2><p>'+esc(g.rule)+'</p></div><button type="button" class="'+(s.learned[g.name]?'secondary':'primary')+'" data-action="lesson-done">'+(s.learned[g.name]?'✓ Kapitel gelesen':'✓ Kapitel verstanden')+'</button></section>'+
   '<div class="training-layout"><aside class="task-rail"><div class="eyebrow">ALLE BUCHBEISPIELE</div>'+lessons.map(t=>'<button class="rail-task '+(t.id===task.id?'active':'')+'" data-action="academy-task:'+esc(t.id)+'"><b>'+esc(taskLabel(t))+'</b><small>'+esc(t.math)+'</small></button>').join('')+'</aside>'+
   '<article class="solution-panel"><div class="eyebrow">'+esc(taskLabel(task))+' · VORGERECHNET</div><h2>'+esc(task.prompt)+'</h2>'+
   '<div class="formula">'+esc(task.math)+'</div>'+G.render(task)+'<ol class="solution-steps">'+task.steps.map((step,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span><p>'+esc(step)+'</p></li>').join('')+'</ol>'+
   '<div class="answer-key">✅ <b>Ergebnis:</b> '+esc(task.kind==='number'?task.steps[task.steps.length-1]:task.steps.find(x=>x.includes('F('))||task.steps[task.steps.length-1])+'</div>'+
   '<div class="actions"><button class="primary" data-action="train:'+esc(task.id)+'">✍️ Dieses Beispiel selbst rechnen</button></div></article></div>';
 }
 function resetTrainer(){
  phase=0;attempts=0;feedback='';solutionOpen=false;workIndex=0;workHistory=[];workHint=false;
  methodOrder=shuffle([0,1,2]);stepOrder=shuffle([0,1,2]);
 }
 function setTask(id){if(!D.tasks.some(t=>t.id===id))return;selectedId=id;resetTrainer();screen='practice';render();}
 function filtered(){return D.tasks.filter(t=>group==='Alle'||t.group===group)}
 function showOptions(options,right,order,action){
  return '<div class="answer-options">'+order.map((original,i)=>'<button type="button" class="option" data-action="'+action+':'+i+'"><span>'+String.fromCharCode(65+i)+'</span>'+esc(options[original])+'</button>').join('')+'</div>';
 }
 function modeBar(){
  return '<div class="lab-modes" role="group" aria-label="Lernmodus wählen">'+
   [['understand','📖 1 · Verstehen'],['builder','✍️ 2 · Rechenbaukasten'],['test','⏱️ 3 · Testmodus']].map(([key,label])=>
   '<button type="button" class="lab-mode '+(labMode===key?'active':'')+'" data-action="mode:'+key+'" aria-pressed="'+(labMode===key)+'">'+label+'</button>').join('')+'</div>';
 }
 function solutionList(t){
  return '<div class="worked maths-worked"><b>Vollständiger Rechenweg</b><ol>'+
   t.steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></div>';
 }
 function builderView(t){
  const rows=W.steps(t.id),row=rows[workIndex],finished=workIndex>=rows.length;
  const history='<div class="notebook"><div class="notebook-top"><span>📒 DEIN RECHENHEFT</span><span>'+workIndex+' / '+rows.length+' Zeilen</span></div>'+
   (workHistory.length?workHistory.map((h,i)=>'<div class="notebook-line"><span class="notebook-number">'+String(i+1).padStart(2,'0')+'</span><div><small>'+esc(h.rule)+' · '+(h.written?'Selbst gerechnet':'Vorlage verwendet')+'</small><strong>'+esc(h.line)+'</strong><p>'+esc(h.why)+'</p></div></div>').join(''):'<div class="notebook-empty">Noch leer – beginne mit der ersten Umformung.</div>')+
   '</div>';
  const controls=finished?'<div class="lab-final"><span class="eyebrow">DEIN FINALES ERGEBNIS</span><h3>Jetzt die gesamte Aufgabe ohne Abschreiben lösen</h3>'+
   '<p>'+esc(t.kind==='number'?'Gib das Endergebnis ein. Einheiten kannst du weglassen.':'Schreibe die vollständige Stammfunktion bzw. Geschwindigkeitsfunktion. +C ist optional.')+'</p>'+
   '<form id="answer-form" class="answer-form"><label for="math-entry">Endergebnis</label><input id="math-entry" autocomplete="off" spellcheck="false" required placeholder="z. B. 48, 98/3 oder x^4-1.5*x^2+x"><button class="primary" type="submit">✅ Ergebnis prüfen</button></form>'+
   '</div>':
   '<section class="lab-step"><div class="lab-step-title"><span class="tag">ZEILE '+(workIndex+1)+' / '+rows.length+'</span><h3>'+esc(row.prompt)+'</h3></div>'+
   '<div class="lab-rule-picker"><label for="rule-select">1 · Passende Regel wählen</label>'+
   '<select id="rule-select" aria-label="Regel für diese Rechenzeile wählen"><option value="">Regel auswählen …</option>'+
   W.rules.map(rule=>'<option value="'+esc(rule)+'">'+esc(rule)+'</option>').join('')+'</select></div>'+
   '<div class="lab-choice-actions"><button class="secondary" data-action="builder-generate">✨ Nächste Zeile erzeugen</button>'+
   '<button class="secondary" data-action="builder-hint">💡 Tipp</button></div>'+
   (workHint?'<div class="lab-hint">💡 '+esc(row.why)+'</div>':'')+
   '<form id="builder-form" class="answer-form"><label for="builder-entry">2 · Nächste Zeile selbst schreiben (rechte Seite als Term/Zahl)</label>'+
   '<input id="builder-entry" autocomplete="off" spellcheck="false" required placeholder="z. B. x^3/3+2*x^2-x">'+
   '<button class="primary" type="submit">🧮 Meine Zeile prüfen</button></form>'+
   '<div class="entry-help">Mathe-Eingabe: x^2, t^3, 3/5, sqrt(10), ln(abs(x)), e^(2*x), pi. Dezimalkomma ist erlaubt. Schreibe nur den Term rechts von „=“.</div></section>';
  return history+(phase===3?'<div class="success"><strong>🎉 Aufgabe selbst gelöst!</strong><p>Dein Fortschritt ist gespeichert.</p></div>'+
   '<div class="actions"><button class="primary" data-action="next">Nächste offene Aufgabe →</button></div>':controls)+
   (feedback?'<div class="feedback '+(phase===3?'good':'warn')+'" role="status">'+esc(feedback)+'</div>':'')+
   (workIndex>0&&phase!==3?'<button class="back-step" data-action="builder-back">← Eine Zeile zurück</button>':'')+
   '<div class="lab-help-actions"><button class="secondary" data-action="builder-solution">'+(solutionOpen?'Lösung verbergen':'📖 Komplette Lösung zeigen')+'</button></div>'+
   (solutionOpen?solutionList(t):'');
 }
 function understandView(t){
  return '<div class="understand-panel"><div class="eyebrow">MODUS 1 · VERSTEHEN</div><h3>Jede Zeile erklärt</h3>'+
   '<p>Hier siehst du die Rechnung mit Regel und Begründung. Danach kannst du sie im Baukasten selbst durchgehen.</p>'+
   '<ol class="explain-steps">'+W.steps(t.id).map((row,i)=>
    '<li><span class="step-number">'+String(i+1).padStart(2,'0')+'</span><div><small>'+esc(row.rule)+'</small>'+
    '<strong>'+esc(row.line)+'</strong><p>'+esc(row.why)+'</p></div></li>').join('')+'</ol>'+
   solutionList(t)+'<div class="actions"><button class="primary" data-action="mode:builder">✍️ Jetzt selbst rechnen</button></div></div>';
 }
 function testView(t){
  return '<div class="test-panel"><div class="eyebrow">MODUS 3 · TESTMODUS</div>'+
   '<h3>Nur die Angabe. Keine Regelvorgabe.</h3><p>Rechne den Weg selbst auf Papier oder im Kopf und trage dein Endergebnis ein. Der Graph dient nur zur Orientierung.</p>'+
   '<form id="answer-form" class="answer-form"><label for="math-entry">Dein Endergebnis</label>'+
   '<input id="math-entry" autocomplete="off" spellcheck="false" required placeholder="Antwort als mathematischen Term eingeben">'+
   '<button class="primary" type="submit">📋 Abgeben und prüfen</button></form>'+
   (feedback?'<div class="feedback '+(phase===3?'good':'warn')+'" role="status">'+esc(feedback)+'</div>':'')+
   (phase===3?'<div class="actions"><button class="primary" data-action="next">Nächste offene Aufgabe →</button></div>':'')+'</div>';
 }
 function renderPractice(){
  const t=current(),done=!!s.solved['q'+t.id];
  return '<div class="heading"><span class="eyebrow">✍️ DEIN RECHENLABOR</span><h1>Selbst rechnen. <em>Zeile für Zeile.</em></h1><p>Wähle Verstehen, den Rechenbaukasten oder Testmodus – ohne Multiple-Choice-Raterei. XP gibt es nur für ein selbst eingegebenes korrektes Endergebnis.</p></div>'+
   groupPicker('filter',group)+modeBar()+
   '<div class="training-layout"><aside class="task-rail"><div class="eyebrow">ORIGINALAUFGABEN · '+count(group)+' / '+total(group)+'</div>'+filtered().map(task=>taskCard(task)).join('')+'</aside>'+
   '<article class="exercise-panel"><div class="task-header"><span class="eyebrow">'+esc(taskLabel(t))+' · '+esc(t.group)+'</span>'+
   '<span class="tag">'+(done?'✓ Schon gemeistert':'Noch offen')+'</span></div>'+
   '<h2>'+esc(t.prompt)+'</h2><div class="formula">'+esc(t.math)+'</div>'+
   G.render(t)+(labMode==='understand'?understandView(t):labMode==='test'?testView(t):builderView(t))+
   '<div class="actions exercise-actions"><button class="secondary" data-action="academy-for:'+esc(t.id)+'">📖 Original-Lösungsweg im Kurs</button></div></article></div>';
 }
 function renderBoss(){
  if(!boss){startBoss();}
  if(boss.done){
   const score=Math.round(boss.correct/boss.ids.length*100);
   return '<div class="heading"><span class="eyebrow">👑 2. HAUSÜBUNGSWIEDERHOLUNG · ERGEBNIS</span><h1>'+score+' % <em>'+(score===100?'ABSOLUT COOKED 🔥':score>=80?'MATHE-BOSS!':'Weiter trainieren!')+'</em></h1>'+
    '<p>'+boss.correct+' von '+boss.ids.length+' Aufgaben richtig. Bestwert: '+s.bestBoss+' %. Wiederholen ist gratis.</p></div>'+
    '<div class="result-review">'+boss.answers.map(a=>'<div class="'+(a.ok?'correct':'incorrect')+'"><span>'+(a.ok?'✅':'❌')+'</span><strong>'+esc(a.id)+'</strong><span>Deine Antwort: '+esc(a.input||'—')+'</span><small>Gesucht: '+esc(a.answer)+'</small></div>').join('')+'</div>'+
    '<div class="actions"><button class="primary" data-action="boss-new">👑 Noch einmal</button><button class="secondary" data-action="view:practice">✍️ Schwächen üben</button></div>';
  }
  const id=boss.ids[boss.index],t=D.tasks.find(x=>x.id===id),answered=boss.answers[boss.index];
  return '<div class="heading"><span class="eyebrow">👑 PRÜFUNGSSIMULATION</span><h1>Die <em>2. Hausübungswiederholung</em></h1><p>10 zufällige Original-Teilaufgaben, keine vorgegebenen Lösungswege. Keine Zeitbegrenzung.</p></div>'+
   '<div class="boss-status"><span>AUFGABE '+(boss.index+1)+' / '+boss.ids.length+'</span><span>'+boss.correct+' bisher korrekt</span></div>'+
   '<div class="progress"><span style="width:'+pct(boss.index,boss.ids.length)+'%"></span></div>'+
   '<article class="boss-problem"><div class="eyebrow">'+esc(taskLabel(t))+' · '+esc(t.group)+'</div><h2>'+esc(t.prompt)+'</h2><div class="formula">'+esc(t.math)+'</div>'+
   (answered?'<div class="feedback '+(answered.ok?'good':'warn')+'">'+(answered.ok?'✅ Richtig!':'❌ Nicht ganz.')+' '+esc(t.steps[t.steps.length-1])+'</div>'+
    '<button class="primary" data-action="boss-next">'+(boss.index+1===boss.ids.length?'Auswertung ansehen 🏆':'Nächste Aufgabe →')+'</button>':
    '<form id="boss-form" class="answer-form"><label for="boss-entry">Deine '+(t.kind==='number'?'Zahl':'Stammfunktion')+'</label><input id="boss-entry" autocomplete="off" spellcheck="false" placeholder="Ergebnis ohne Einheit eingeben" required>'+
    '<button class="primary" type="submit">Antwort abgeben</button></form>')+'</article>';
 }
 function startBoss(){
  const indices=shuffle(D.tasks.map(t=>t.id));
  boss={ids:indices.slice(0,10),index:0,correct:0,answers:[],done:false};
 }
 function finishBoss(){
  boss.done=true;
  const score=Math.round(boss.correct/boss.ids.length*100);
  if(score>s.bestBoss){s.bestBoss=score;save()}
  if(score>=80&&award('boss80',85,90))toast('👑 Boss besiegt! +85 XP und +90 TT');
 }
 function route(action){
  const [verb,...rest]=action.split(':'),arg=rest.join(':');
  if(verb==='view'){screen=arg;render();return}
   if(verb==='mode'&&['understand','builder','test'].includes(arg)){labMode=arg;feedback='';solutionOpen=false;render();return}
   if(verb==='builder-hint'){workHint=true;render();return}
   if(verb==='builder-solution'){solutionOpen=!solutionOpen;render();return}
   if(verb==='builder-back'){if(workIndex>0){workIndex--;workHistory.pop();workHint=false;feedback='';phase=0}render();return}
   if(verb==='builder-generate'){
    const row=W.steps(current().id)[workIndex],rule=$('#rule-select')?.value||'';
    if(!row)return;
    if(rule!==row.rule){feedback='Wähle zuerst die passende Rechenregel – überleg, welcher Schritt hier gemacht wird.';render();return}
    workHistory.push({...row,written:false});workIndex++;workHint=false;feedback='Zeile eingeblendet. Für XP musst du am Ende die Gesamtaufgabe selbst lösen.';render();return;
   }
  if(verb==='group'){group=arg;const first=filtered()[0];if(first)setTask(first.id);return}
  if(verb==='academy-group'){academyGroup=arg;academyFocus=null;render();return}
  if(verb==='academy-task'){academyFocus=arg;render();return}
  if(verb==='academy-for'){const t=D.tasks.find(x=>x.id===arg);if(t){academyGroup=t.group;academyFocus=t.id;screen='academy';render()}return}
  if(verb==='lesson-done'){
   if(!s.learned[academyGroup]){s.learned[academyGroup]=true;award('lesson:'+academyGroup,25,12);toast('📘 Kapitel geschafft! +25 XP +12 TT');}
   render();return;
  }
  if(verb==='filter'){group=arg;if(!filtered().some(t=>t.id===selectedId)){selectedId=filtered()[0]?.id||selectedId;resetTrainer()}render();return}
  if(verb==='train'){setTask(arg);return}
  if(verb==='method'||verb==='step'){
   const t=current(),order=verb==='method'?methodOrder:stepOrder,right=verb==='method'?t.methodRight:t.stepRight;
   const actual=order[Number(arg)];
   if(actual===right){phase++;attempts=0;feedback='✅ Genau! Weiter zum nächsten Schritt.';solutionOpen=false;}
   else{attempts++;feedback='Noch nicht. Schau auf die Aufgabenstellung und versuch die passende Regel zu erkennen.';}
   render();return;
  }
  if(verb==='hint'){solutionOpen=true;render();return}
  if(verb==='next'){
   const all=filtered(),i=all.findIndex(t=>t.id===selectedId);
   const next=[...all.slice(i+1),...all.slice(0,i+1)].find(t=>!s.solved['q'+t.id])||all[(i+1)%all.length];
   if(next)setTask(next.id);return;
  }
  if(verb==='boss-new'){startBoss();render();return}
  if(verb==='boss-next'){
   if(!boss||!boss.answers[boss.index])return;
   boss.index++;if(boss.index>=boss.ids.length)finishBoss();
   render();return;
  }
 }
 function checkBuilder(input){
  const row=W.steps(current().id)[workIndex],rule=$('#rule-select')?.value||'';
  if(!row)return;
  if(rule!==row.rule){feedback='Wähle erst die korrekte Regel für deine Rechenzeile.';render();return}
  const result=W.compare(input,row);
  if(result.ok){workHistory.push({...row,written:true,line:input});workIndex++;workHint=false;feedback=result.message}
  else{attempts++;feedback=result.message}
  render();
 }
 function checkPractice(input){
  const t=current(),res=E.check(t,input);
  if(res.ok){
   phase=3;attempts=0;feedback=res.message;
   if(!s.solved['q'+t.id]){
    s.solved['q'+t.id]=true;
    s.attempts++;save();award('exercise:'+t.id,32,18);
    toast('✅ '+taskLabel(t)+' bestanden! +32 XP · +18 TT');
   }
  }else{
   attempts++;feedback=res.message;
  }
  render();
 }
 function checkBoss(input){
  if(!boss||boss.done||boss.answers[boss.index])return;
  const t=D.tasks.find(x=>x.id===boss.ids[boss.index]),res=E.check(t,input);
  if(res.ok)boss.correct++;
  boss.answers[boss.index]={id:t.id,input,ok:res.ok,answer:t.kind==='number'?t.answer:'siehe vorgerechneter Lösungsweg'};
  render();
 }
 function render(){
  const currentScreen=['home','academy','practice','boss'].includes(screen)?screen:'home';
  const content=currentScreen==='home'?renderHome():currentScreen==='academy'?renderAcademy():currentScreen==='practice'?renderPractice():renderBoss();
  shell(content);
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  route(button.dataset.action);
 });
 document.addEventListener('submit',event=>{
  if(event.target.id==='answer-form'){event.preventDefault();checkPractice($('#math-entry')?.value||'')}
   if(event.target.id==='builder-form'){event.preventDefault();checkBuilder($('#builder-entry')?.value||'')}
  if(event.target.id==='boss-form'){event.preventDefault();checkBoss($('#boss-entry')?.value||'')}
 });
 // Hash-based shortcuts let Studyverse route directly to individual trainers.
 if(location.hash==='#practice')screen='practice';
 else if(location.hash==='#boss')screen='boss';
 else if(location.hash==='#academy')screen='academy';
 resetTrainer();render();
})();
