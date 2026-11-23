/* MathsVerse original-source trainer.
 * Uses ONLY sourced textbook exercises and identified official SRDP tasks.
 * No synthetic questions enter the two source catalogs or the 10+10 exam.
 * Existing save key, rewards and cosmetics remain unchanged.
 */
(function(){
'use strict';
const BOOK=window.MATHS_BOOK_BANK||[];
const POOL=window.MATHS_POOL_BANK||[];
const ui={bookId:BOOK[0]?.id,poolId:POOL[0]?.id,mode:null,filter:'',topic:'all',shown:false,submitted:false,correct:null,answer:'',run:null,complete:null,listScroll:{book:0,pool:0}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(arr)=>arr[Math.floor(Math.random()*arr.length)];
function shuffle(items){let a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const key=q=>q.id.replace(/[^a-z0-9-]/gi,'_');
const solvedKey=(q,mode)=>mode==='book'?'n'+key(q):'q'+key(q);
function plot(graph){
 if(!graph||!Array.isArray(graph.curves)||!graph.curves.length)return '';
 const W=640,H=280,xRange=graph.x||[-5,5],yRange=graph.y||[-5,5];
 const x0=Number(xRange[0]),x1=Number(xRange[1]),y0=Number(yRange[0]),y1=Number(yRange[1]);
 if(!(x1>x0&&y1>y0))return '';
 const X=x=>((x-x0)/(x1-x0))*W,Y=y=>H-((y-y0)/(y1-y0))*H;
 const pointY=(c,x)=>{
  if(Array.isArray(c.domain)&&(x<c.domain[0]||x>c.domain[1]))return NaN;
  if(Array.isArray(c.poly)){return c.poly.reduce((v,n)=>v*x+Number(n),0)}
  if(Array.isArray(c.points)){
   let p=c.points;
   for(let j=0;j<p.length-1;j++){const a=p[j],b=p[j+1];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}
  }
  return NaN;
 };
 let grid='',fill='',paths='';
 for(let n=Math.ceil(x0);n<=Math.floor(x1);n++){let x=X(n);grid+='<line x1="'+x+'" x2="'+x+'" y1="0" y2="'+H+'" stroke="currentColor" opacity=".1"/>'}
 for(let n=Math.ceil(y0);n<=Math.floor(y1);n++){let y=Y(n);grid+='<line x1="0" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="currentColor" opacity=".1"/>'}
 const curveData=graph.curves.map((c,i)=>{
   let entries=[];
   const N=160;for(let j=0;j<=N;j++){let x=x0+(x1-x0)*j/N,y=pointY(c,x);if(Number.isFinite(y)&&Math.abs(y)<1e7)entries.push([x,y])}
   return {c,entries,i};
 });
 if(graph.area&&Number.isFinite(graph.area.a)&&Number.isFinite(graph.area.b)){
   const a=Math.max(x0,Number(graph.area.a)),b=Math.min(x1,Number(graph.area.b));
   if(b>a){
    let vertices=[],other=[];
    for(let j=0;j<=100;j++){
     let x=a+(b-a)*j/100,upper=pointY(graph.curves[0],x),lower=graph.area.between?pointY(graph.curves[1],x):0;
     if(Number.isFinite(upper)&&Number.isFinite(lower)){vertices.push(X(x)+','+Y(upper));other.unshift(X(x)+','+Y(lower))}
    }
    if(vertices.length>1)fill='<polygon points="'+vertices.concat(other).join(' ')+'" fill="#adf19a" fill-opacity=".22"/>';
   }
 }
 curveData.forEach(({c,entries,i})=>{
  let path=entries.map((a,j)=>(j?'L':'M')+X(a[0]).toFixed(1)+' '+Y(a[1]).toFixed(1)).join(' ');
  paths+='<path d="'+path+'" stroke="'+(i===0?'#b8f48a':'#f6c36d')+'" fill="none" stroke-width="3.2" stroke-linecap="round"/>';
 });
 let ax='<line x1="0" x2="'+W+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#e2ffdf" stroke-width="1.5" opacity=".7"/><line x1="'+X(0)+'" x2="'+X(0)+'" y1="0" y2="'+H+'" stroke="#e2ffdf" stroke-width="1.5" opacity=".7"/>';
 return '<figure class="source-graph"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Passender mathematischer Funktionsgraph zum Originalbuchbeispiel"><g>'+grid+fill+ax+paths+'</g></svg><figcaption>Rechnerisch rekonstruierter Funktionsgraph · dieselben Koordinaten wie in der Angabe</figcaption></figure>';
}
const cards=(mode)=>mode==='book'?BOOK:POOL;
function details(q,mode){
 if(!q)return '<div class="source-empty">Kein Beispiel gefunden.</div>';
 const solved=!!window.__mathSourceState?.solved?.[solvedKey(q,mode)];
 const isPool=mode==='pool',needsExternal=isPool&&q.expected==null;
 const ref=isPool?(q.kind==='pdf'?'Offizielles PDF mit Originalgrafiken':'Originalaufgabe mit Grafiken'):'Aus der hochgeladenen Schulbuch-ZIP';
 let remote='';
 if(isPool){
  const link='<a class="btn secondary source-open-link" href="'+esc(q.source)+'" target="_blank" rel="noopener noreferrer">Originalaufgabe öffnen ↗</a>';
  remote='<div class="source-external"><b>'+esc(ref)+'</b><p>Die Angabe stammt aus der amtlichen Aufgabensammlung. Diagramme und Tabellen bleiben im Originaldokument, damit nichts verfälscht wird.</p>'+link+
   (q.kind==='pdf'?'<iframe loading="lazy" title="Originalaufgabe '+esc(q.number)+'" src="'+esc(encodeURI(q.source))+'#page=1&toolbar=0&navpanes=0" referrerpolicy="no-referrer" aria-label="Original-PDF der Bundesministerium-Aufgabe"></iframe>':'')+'</div>';
 }
 const badge=solved?'<span class="source-done">✓ Bereits bearbeitet</span>':'<span class="pill">✎ Noch offen</span>';
 return '<div class="source-detail"><div class="source-meta"><span class="eyebrow">'+(isPool?'SRDP · '+esc(q.descriptor):'BUCHBEISPIEL · '+esc(q.category))+'</span>'+badge+'</div><h2>'+esc(isPool?q.title+' · '+q.part:q.number)+'</h2><p class="source-number">'+esc(isPool?q.number:q.source)+'</p><div class="source-question">'+esc(q.prompt)+'</div>'+plot(q.graph)+remote+
 '<div class="handwrite-note" role="note">✏️ <strong>Stift und Papier:</strong> Rechne die Originalaufgabe selbst. Wenn du fertig bist, trage dein Ergebnis ein. Falls du nicht weiterkommst: „Lösung anzeigen“.</div>'+
 (!needsExternal?'<div class="answer-field"><input id="sourceAnswer" autocomplete="off" placeholder="'+(q.expected==null?'Dein Rechenweg oder Ergebnis …':'Deine Zahl, z. B. 4,5')+'" value="'+esc(ui.answer)+'" aria-label="Deine Antwort"><button class="btn primary" data-action="source:submit">Überprüfen</button></div>':
 '<div class="answer-field"><textarea id="sourceAnswer" rows="2" placeholder="Deine Rechnung / Interpretation …" aria-label="Deine Rechnung">'+esc(ui.answer)+'</textarea></div>')+
 (ui.submitted&&ui.correct!==null?'<p class="answer-feedback '+(ui.correct?'good':'bad')+'">'+(ui.correct?'✓ Richtig!':'Noch nicht korrekt. Schau dir den Rechenweg an.')+'</p>':'')+
 '<div class="source-actions"><button class="btn secondary" data-action="source:reveal">'+(ui.shown?'Lösung wieder ausblenden':'Lösung anzeigen')+'</button><button class="btn secondary" data-action="source:next">Nächstes Beispiel →</button></div>'+
 (ui.shown?'<section class="source-solution"><h3>Schritt-für-Schritt-Erklärung</h3><p>'+esc(q.guide||q.steps)+'</p><div class="formula">'+esc(q.solution)+'</div>'+
 (isPool?'<p class="source-credit">'+esc(q.credit||'Datenquelle: Bundesministerium für Bildung (CC BY 4.0)')+'</p><a target="_blank" rel="noopener noreferrer" href="'+esc(q.source)+'">Vollständige offizielle Lösungserwartung öffnen ↗</a>':'')+
 '<div class="source-actions"><button class="btn secondary" data-action="source:reveal">Okay, verstanden · Lösung schließen</button><button class="btn primary" data-action="source:self-right">✓ Ich hatte es richtig</button><button class="btn secondary" data-action="source:self-wrong">✕ Noch üben</button></div></section>':'')+
 (needsExternal?'<p class="source-credit">Bei dieser Aufgabe können Antworten eine Zeichnung, Formel oder Begründung sein. Ohne eindeutigen Zahlenwert erfolgt eine transparente Selbstkontrolle statt erfundener automatischer Bewertung.</p>':'')+
 '</div>';
}
function browser(mode,state){
 if(ui.mode!==mode){ui.mode=mode;ui.filter='';ui.topic='all';reset()}
 window.__mathSourceState=state;
 const bank=cards(mode),value=mode==='book'?ui.bookId:ui.poolId;
 let categories=[...new Set(bank.map(x=>x.category))];
 const rows=bank.filter(x=>(ui.topic==='all'||x.category===ui.topic)&&(!ui.filter||(x.number+' '+(x.title||'')+' '+x.prompt).toLowerCase().includes(ui.filter.toLowerCase())));
 let active=rows.find(x=>x.id===value)||rows[0];if(active&&active.id!==value){mode==='book'?ui.bookId=active.id:ui.poolId=active.id;reset()}
 const done=bank.filter(x=>state.solved[solvedKey(x,mode)]).length;
 return '<div class="eyebrow">'+(mode==='book'?'ECHTE SCHULBUCH-AUFGABEN':'ORIGINAL-SRDP · 4. DESKRIPTOR')+'</div><h1>'+(mode==='book'?'Buchbeispiele':'4. Deskriptor')+'</h1><p>'+(mode==='book'?'Die nummerierten Beispiele aus deinem Schulbuch – an Papier rechnen, Lösung bei Bedarf ausklappen.':'50 echte veröffentlichte SRDP-Teilaufgaben mit offiziellen PDFs/Quellen und Originalgrafiken, statt erfundener Ersatzfragen.')+'</p>'+
 '<div class="source-count"><strong>'+done+'/'+bank.length+'</strong> bearbeitet · '+(mode==='book'?'Buchnummern aus der ZIP':'Datenquelle: Bundesministerium für Bildung · CC BY 4.0')+'</div>'+
 '<div class="source-filters"><label>Suche <input id="sourceSearch" placeholder="z. B. '+(mode==='book'?'1.66 a':'B_405')+'" value="'+esc(ui.filter)+'"></label><label>Thema <select id="sourceTopic"><option value="all">Alle Bereiche</option>'+categories.map(c=>'<option value="'+esc(c)+'" '+(ui.topic===c?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label></div>'+
 '<div class="source-workspace" data-mode="'+mode+'"><aside class="source-list" aria-label="Aufgabenliste">'+rows.map(x=>'<button class="source-task '+(x.id===active?.id?'active':'')+'" data-action="source:open:'+esc(x.id)+'"><span>'+esc(x.number)+'</span><small>'+esc(x.title||x.category)+'</small>'+(state.solved[solvedKey(x,mode)]?' ✓':'')+'</button>').join('')+'</aside>'+details(active,mode)+'</div>';
}
function reset(){ui.shown=false;ui.submitted=false;ui.correct=null;ui.answer=''}
function captureList(mode,scroll){if(mode==='book'||mode==='pool')ui.listScroll[mode]=Math.max(0,scroll||0)}
function restoreList(mode,el){if(el&&ui.listScroll[mode]!=null)el.scrollTop=ui.listScroll[mode]}
function isSolutionOpen(){return !!ui.shown}
function current(mode){return cards(mode).find(x=>x.id===(mode==='book'?ui.bookId:ui.poolId))}
function next(mode,state){let list=cards(mode),idx=list.findIndex(x=>x.id===current(mode)?.id);
 if(idx<0)return;let fresh=list.find((x,i)=>i>idx&&!state.solved[solvedKey(x,mode)])||list.find(x=>!state.solved[solvedKey(x,mode)])||list[(idx+1)%list.length];
 if(mode==='book')ui.bookId=fresh.id;else ui.poolId=fresh.id;reset();
}
function mark(q,mode,correct,api){if(!correct)return;
 const id=solvedKey(q,mode);
 api.state.solved[id]=true;
 api.reward('source-first:'+id,22,20);
 api.save();
}
function answerNumeric(q,s){
 if(q.expected==null)return null;
 const v=String(s||'').trim().replace(',','.');
 if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))return false;
 const tolerance=Math.max(0.011,Math.abs(q.expected)*0.001);
 return Math.abs(Number(v)-q.expected)<=tolerance;
}
function startExam(api){
 if(BOOK.length<10||POOL.length<10)throw Error('Not enough authentic source problems for a 10+10 exam');
 const b=shuffle(BOOK).slice(0,10).map(q=>({...q,origin:'book'}));
 const p=shuffle(POOL).slice(0,10).map(q=>({...q,origin:'pool'}));
 ui.run={tasks:shuffle(b.concat(p)),index:0,score:0,results:[],draft:'',revealed:false,graded:false};
 ui.complete=null;
}
function intro(state){
 return '<div class="eyebrow">ENDGAME / ORIGINAL-SCHULARBEIT</div><h1>Schularbeitssimulation.</h1><div class="panel center"><div class="boss-number">∑</div><h2>20 originale Aufgaben · 10 Buch + 10 Deskriptor 4</h2><p>Jeder Durchgang zieht zufällig 10 echte Buchbeispiele und 10 veröffentlichte SRDP-Aufgaben. Du rechnest auf Papier und gibst dein Ergebnis ein. Bei numerischen Ergebnissen prüft Studyverse automatisch; begründende oder grafische Aufgaben vergleichst du mit der Quelle.</p><div class="stats"><div class="stat"><b>10</b><small>BUCHBEISPIELE</small></div><div class="stat"><b>10</b><small>SRDP-TASKS</small></div><div class="stat"><b>'+Math.max(0,Number(state.bestBoss)||0)+'%</b><small>BESTWERT</small></div><div class="stat"><b>100%</b><small>PROFESSOR FILIPP</small></div></div><button class="btn primary" data-action="source:exam-start">Prüfung starten ✎</button></div>';
}
function run(){
 if(!ui.run)return '<div class="panel">Starte eine neue Prüfung.</div>';
 const r=ui.run,q=r.tasks[r.index],mode=q.origin;const isPool=mode==='pool';
 const frame=isPool?'<div class="source-external"><p>Originalaufgabe mit Diagrammen und Tabellen:</p><a href="'+esc(q.source)+'" target="_blank" rel="noopener noreferrer">Original öffnen ↗</a>'+(q.kind==='pdf'?'<iframe title="Original-Aufgabe" loading="lazy" src="'+esc(encodeURI(q.source))+'#page=1&toolbar=0"></iframe>':'')+'</div>':'';
 return '<div class="eyebrow">SCHULARBEITSSIMULATION · FRAGE '+(r.index+1)+' / 20 · '+(isPool?'DESKRIPTOR 4':'BUCHBEISPIEL')+'</div><h1>Am Papier rechnen.</h1><div class="progress-track"><i style="width:'+((r.index/20)*100)+'%"></i></div>'+
 '<section class="question-card source-exam-card"><span class="pill">'+esc(q.number)+'</span><h2>'+esc(q.title||q.category)+'</h2><p class="source-question">'+esc(q.prompt)+'</p>'+plot(q.graph)+frame+
 '<div class="handwrite-note">✏️ Berechne oder begründe zuerst auf Papier. Erst danach die Antwort hier eintragen.</div>'+
 (q.expected!=null?'<input class="source-exam-input" id="sourceExamAnswer" inputmode="decimal" value="'+esc(r.draft)+'" placeholder="Berechnetes Ergebnis, z. B. 4,5" aria-label="Berechnetes Ergebnis">':
 '<textarea class="source-exam-input" id="sourceExamAnswer" rows="3" aria-label="Deine Rechnung / Interpretation" placeholder="Deine Rechnung, Formel oder Begründung …">'+esc(r.draft)+'</textarea>')+
 (!r.graded?'<button class="btn primary" data-action="source:exam-submit">Prüfen / Lösung vergleichen</button>':
 '<div class="source-solution"><h3>'+ (r.results[r.results.length-1]?.auto===null?'Vergleiche deine Begründung mit der Lösung':'Ergebniskontrolle')+'</h3><p>'+esc(q.guide||q.steps)+'</p><div class="formula">'+esc(q.solution)+'</div>'+(isPool?'<a href="'+esc(q.source)+'" target="_blank" rel="noopener noreferrer">Offizielle Lösung & Originalabbildung ↗</a>':'')+
 (r.results[r.results.length-1]?.auto===null?'<div class="source-actions"><button class="btn primary" data-action="source:exam-self-right">✓ Meine Lösung stimmt</button><button class="btn secondary" data-action="source:exam-self-wrong">✕ Noch nicht richtig</button></div>':
 '<div class="answer-feedback '+(r.results[r.results.length-1]?.correct?'good':'bad')+'">'+(r.results[r.results.length-1]?.correct?'✓ Automatisch richtig bewertet':'✕ Ergebnis stimmt noch nicht')+'</div><button class="btn primary" data-action="source:exam-next">Nächste Aufgabe →</button>')+'</div>')+
 '</section>';
}
function result(){
 const r=ui.complete;if(!r)return intro({bestBoss:0});
 const automated=r.results.filter(x=>x.auto!==null).length,manual=r.results.length-automated;
 return '<div class="eyebrow">PRÜFUNG ABGESCHLOSSEN</div><div class="panel center"><div class="boss-number">'+r.percent+'%</div><h1>'+r.score+' von 20 Aufgaben richtig</h1><p>10 Original-Buchaufgaben und 10 offizielle Deskriptor-Aufgaben. Davon '+automated+' automatisch überprüft und '+manual+' nach aufgedeckter Lösung selbst beurteilt. Dieser Unterschied bleibt transparent.</p><p>'+(r.percent===100?'Perfekt! Professor Filipp ist freigeschaltet.':'Wiederhole schwierige Originalbeispiele und versuche die Simulation erneut.')+'</p><div class="source-actions"><button class="btn primary" data-action="source:exam-start">Neue Mischung starten</button><button class="btn secondary" data-action="nav:book">Buchbeispiele üben</button></div></div>';
}
function handle(action,api){
 const mode=api.view==='pool'?'pool':'book';
 if(action.startsWith('source:open:')){let x=action.slice(12),q=cards(mode).find(q=>q.id===x);if(q){mode==='book'?ui.bookId=x:ui.poolId=x;reset()}return}
 if(action==='source:next'){next(mode,api.state);return}
 if(action==='source:reveal'){ui.shown=!ui.shown;return}
 if(action==='source:submit'){let q=current(mode);if(!q)return;const v=document.getElementById('sourceAnswer')?.value||'';ui.answer=v;ui.submitted=true;ui.correct=answerNumeric(q,v);if(ui.correct===true)mark(q,mode,true,api);if(ui.correct===false)ui.shown=true;if(ui.correct===null)ui.shown=true;return}
 if(action==='source:self-right'){let q=current(mode);if(q)mark(q,mode,true,api);ui.correct=true;ui.submitted=true;return}
 if(action==='source:self-wrong'){ui.correct=false;ui.submitted=true;return}
 if(action==='source:exam-start'){startExam(api);api.navigate('bossrun');return}
 if(action==='source:exam-submit'&&ui.run&&!ui.run.graded){
  const r=ui.run,q=r.tasks[r.index];r.draft=document.getElementById('sourceExamAnswer')?.value||'';
  const verdict=answerNumeric(q,r.draft);
  r.results.push({id:q.id,origin:q.origin,auto:verdict,correct:verdict===true});
  r.graded=true;if(verdict===true)r.score++;return
 }
 if((action==='source:exam-self-right'||action==='source:exam-self-wrong')&&ui.run&&ui.run.graded){
  let item=ui.run.results[ui.run.results.length-1];if(item.auto!==null)return;
  item.correct=action.endsWith('right');if(item.correct)ui.run.score++;
  nextExam(api);return
 }
 if(action==='source:exam-next'&&ui.run&&ui.run.graded){if(ui.run.results[ui.run.results.length-1]?.auto!==null)nextExam(api)}
}
function nextExam(api){
 const r=ui.run;if(r.index<19){r.index++;r.draft='';r.graded=false;return}
 const pct=Math.round(r.score/20*100);
 api.state.bestBoss=Math.max(Number(api.state.bestBoss)||0,pct);
 api.state.bossRuns=(Number(api.state.bossRuns)||0)+1;
 if(api.state.bossRuns===1)api.reward('boss-first-run',r.score*10,Math.round(pct));
 if(pct===100)api.reward('boss-perfect',300,500);
 api.save();
 ui.complete={score:r.score,percent:pct,results:[...r.results]};
 ui.run=null;api.navigate('bossresult');
}
function refreshFilters(){
 const q=document.getElementById('sourceSearch'),t=document.getElementById('sourceTopic');
 ui.filter=q?.value||'';ui.topic=t?.value||'all';reset();
}
window.MATHS_SOURCE_TRAINER={BOOK,POOL,browser,details,intro,run,result,startExam,handle,refreshFilters,reset,plot,captureList,restoreList,isSolutionOpen};
})();