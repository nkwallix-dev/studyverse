/* MathsVerse original-source trainer.
 * Uses ONLY sourced textbook exercises and identified official SRDP tasks.
 * No synthetic questions enter the two source catalogs or the 10+10 exam.
 * Existing save key, rewards and cosmetics remain unchanged.
 */
(function(){
'use strict';
const BOOK=window.MATHS_BOOK_BANK||[];
const GROUPS=window.MATHS_BOOK_GROUPS||[];
const POOL=window.MATHS_POOL_BANK||[];
const ui={bookId:GROUPS[0]?.id,bookStepId:GROUPS[0]?.steps[0]?.id,poolId:POOL[0]?.id,mode:null,filter:'',topic:'all',shown:false,poolHint:false,submitted:false,correct:null,answer:'',run:null,complete:null,listScroll:{book:0,pool:0}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(arr)=>arr[Math.floor(Math.random()*arr.length)];
function shuffle(items){let a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const key=q=>q.id.replace(/[^a-z0-9-]/gi,'_');
const solvedKey=(q,mode)=>mode==='book'?'n'+key(q):'q'+key(q);
function plot(graph){
 if(graph?.kind==='book-velocity'){
  const ticks=[0,1,2,3,4,5,6,7,8].map(n=>'<text x="'+(50+68*n)+'" y="225" font-size="12" text-anchor="middle" fill="#e6f6df">'+n+'</text>').join('');
  return '<figure class="source-graph book-original-graph"><svg viewBox="0 0 660 270" role="img" aria-label="Original-Geschwindigkeits-Zeit-Grafik aus Buchaufgabe 1.13">'+
  '<path d="M50 18V209H635" fill="none" stroke="#d3edc7" stroke-width="2"/><path d="M50 209L254 97L390 97L594 23" stroke="#a4edb4" stroke-width="5" fill="none" stroke-linecap="round"/>'+
  '<text x="15" y="13" font-size="13" fill="#e6f6df">Geschwindigkeit in m/s</text><text x="540" y="250" font-size="13" fill="#e6f6df">Zeit in s</text>'+
  '<text x="28" y="101" font-size="12" fill="#e6f6df">6</text><text x="21" y="25" font-size="12" fill="#e6f6df">10</text>'+ticks+
  '</svg><figcaption>Die Geschwindigkeit bleibt von t=3 bis t=5 konstant; die Beschleunigung dort ist null.</figcaption></figure>';
 }
 if(graph?.kind==='book-distance-time'){
  const nums=[0,1,2,3,4,5,6,7,8].map(x=>'<text x="'+(48+68*x)+'" y="222" font-size="12" text-anchor="middle" fill="#e6f6df">'+x+'</text>').join('');
  return '<figure class="source-graph book-original-graph"><svg viewBox="0 0 660 270" role="img" aria-label="Entfernungs-Zeit-Diagramm aus Buchbeispiel 1.12, nach der Originalabbildung gezeichnet">'+
  '<path d="M48 18V205H639" stroke="#d3edc7" stroke-width="2" fill="none"/>'+
  '<path d="M48 35H640M48 68H640M48 101H640M48 135H640M48 168H640" stroke="#b9d6b4" stroke-opacity=".16" fill="none"/>'+
  '<path d="M48 205L252 35L388 35L592 205" fill="none" stroke="#a4edb4" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>'+
  '<path d="M252 35V205M388 35V205" stroke="#e1f5db" stroke-opacity=".45" stroke-dasharray="6 5"/>'+
  '<text x="22" y="38" fill="#e6f6df" font-size="13">50</text><text x="22" y="172" fill="#e6f6df" font-size="13">10</text>'+
  '<text x="11" y="14" fill="#e6f6df" font-size="13">Entfernung in km</text><text x="513" y="253" fill="#e6f6df" font-size="13">Zeit in h</text>'+
  '<text x="143" y="133" font-size="21" font-weight="bold" fill="#eff4ab">①</text><text x="317" y="25" font-size="21" font-weight="bold" fill="#eff4ab">②</text><text x="485" y="132" font-size="21" font-weight="bold" fill="#eff4ab">③</text>'+
  nums+'</svg><figcaption>Entfernungs-Zeit-Diagramm aus dem Buch (nach Screenshot 02 rekonstruiert, keine Trapezflächen)</figcaption></figure>';
 }
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
function officialStatement(q){
 if(!/^https:\/\/(?:www\.)?aufgabenpool\.at\/amn\//i.test(q.source))
  return '<p class="source-empty">Diese Aufgabe hat keine verifizierte Original-PDF-Quelle und kann hier nicht als offizielle SRDP-Aufgabe angezeigt werden.</p>';
 const src=esc(encodeURI(q.source))+'#view=FitH&zoom=page-width&toolbar=0&navpanes=0';
 return '<div class="source-external source-pdf-sheet"><b>Amtliches Aufgabenblatt · aufgabenpool.at</b>'+
 '<iframe loading="eager" title="Offizielle SRDP-Aufgabe '+esc(q.number)+'" src="'+src+'" referrerpolicy="no-referrer" aria-label="Vollständiges Original-PDF des Bundesministeriums für Bildung"></iframe>'+
 '<p class="source-pdf-help">Scrolle im Aufgabenblatt nach unten: Die offizielle Lösungserwartung steht im selben PDF.</p></div>';
}
function activeGroup(){return GROUPS.find(g=>g.id===ui.bookId)||GROUPS[0]}
function activeStep(){const group=activeGroup();return group?.steps.find(q=>q.id===ui.bookStepId)||group?.steps[0]}
function bookDetails(group){
 if(!group)return '<p>Keine Buchaufgabe ausgewählt.</p>';
 const q=activeStep(),stepIndex=Math.max(0,group.steps.findIndex(x=>x.id===q.id));
 const solved=window.__mathSourceState?.solved||{};
 const nDone=group.steps.filter(x=>solved[solvedKey(x,'book')]).length;
 const sheet=group.artwork.map((name,i)=>'<figure class="book-original-sheet"><img loading="eager" src="original-figures/'+esc(name)+'" alt="Originale Buchangabe und Abbildung zu Aufgabe '+esc(group.number)+' (Grafik '+(i+1)+')"><figcaption>Original-Screenshot · '+esc(group.number)+' · Abbildung '+(i+1)+'</figcaption></figure>').join('');
 const stepMenu=group.steps.map((x,i)=>'<button class="book-step-pick '+(x.id===q.id?'active':'')+'" data-action="source:step:'+esc(x.id)+'" aria-current="'+(x.id===q.id?'step':'false')+'">Schritt '+(i+1)+(solved[solvedKey(x,'book')]?' ✓':'')+'</button>').join('');
 const solution=ui.shown?'<section class="source-solution" id="sourceSolution"><h3>Lösung · Schritt '+(stepIndex+1)+'</h3><p>'+esc(q.steps)+'</p><div class="formula">'+esc(q.solution)+'</div></section>':'';
 const expected=Number.isFinite(q.expected);
 const result=ui.submitted?'<p class="answer-feedback '+(ui.correct?'good':ui.correct===false?'bad':'')+'">'+(ui.correct===true?'✓ Ergebnis richtig':ui.correct===false?'Noch nicht korrekt. Vergleiche den Lösungsweg.':'Vergleiche deine Begründung mit der Erklärung.')+'</p>':'';
 return '<section class="source-detail" data-source-id="'+esc(group.id)+'"><header class="source-detail-header"><div class="source-meta"><span class="eyebrow">BUCHBEISPIEL · '+esc(group.category)+'</span><span class="source-done">'+nDone+'/'+group.steps.length+' Schritte</span></div><h2>Aufgabe '+esc(group.number)+'</h2><p class="source-number">Original · '+esc(group.source)+'</p></header>'+
 '<div class="source-reading" role="region" tabindex="0" aria-label="Buchangabe, Originalgrafiken und Lösungswege">'+
 '<details class="book-original-toggle" open><summary>Originalangabe & Abbildungen · '+esc(group.number)+'</summary><div class="book-original-body">'+sheet+
 '<p class="source-credit">Lies die vollständige Aufgabenstellung in der Originalabbildung. Die einzelnen Rechenschritte findest du darunter.</p></div></details>'+
 '<nav class="book-step-tabs" aria-label="Teilaufgaben wählen">'+stepMenu+'</nav>'+
 '<section class="book-active-step"><h3>Schritt '+(stepIndex+1)+' von '+group.steps.length+(group.steps.length===1?'':' · '+esc(q.number))+'</h3><div class="source-question">'+esc(q.prompt)+'</div>'+
 (!sheet&&q.graph?plot(q.graph):'')+'</section>'+solution+'</div>'+
 '<div class="source-answer-dock"><div class="handwrite-note">✏️ <b>Stift und Papier:</b> Rechne Schritt '+(stepIndex+1)+' eigenständig. Ergebnis erst danach überprüfen.</div>'+
 '<div class="answer-field"><input id="sourceAnswer" aria-label="Ergebnis für Schritt '+(stepIndex+1)+'" inputmode="'+(expected?'decimal':'text')+'" placeholder="'+(expected?'Deine Zahl':'Dein Ergebnis oder Lösungsweg')+'" value="'+esc(ui.answer)+'">'+'<button class="btn primary" data-action="source:submit">Überprüfen</button></div>'+result+
 '<div class="source-actions"><button class="btn secondary" data-action="source:reveal">'+(ui.shown?'Lösung schließen':'Lösung anzeigen')+'</button>'+
 (ui.shown?'<button class="btn primary" data-action="source:self-right">✓ Richtig gelöst</button><button class="btn secondary" data-action="source:self-wrong">Noch üben</button>':'')+
 '<button class="btn secondary" data-action="source:next">'+(stepIndex+1<group.steps.length?'Nächster Schritt →':'Nächstes Buchbeispiel →')+'</button></div></div></section>';
}

function details(q,mode){
 if(!q)return '<div class="source-empty">Keine Originalaufgabe gefunden.</div>';
 if(mode!=='pool')return bookDetails(activeGroup());
 const solved=!!window.__mathSourceState?.solved?.[solvedKey(q,'pool')];
 return '<section class="source-detail" data-source-id="'+esc(q.id)+'">'+
 '<header class="source-detail-header"><div class="source-meta"><span class="eyebrow">SRDP · '+esc(q.descriptor)+'</span>'+
 (solved?'<span class="source-done">✓ Bearbeitet</span>':'<span class="pill">✎ Noch offen</span>')+'</div>'+
 '<h2>'+esc(q.title)+' · '+esc(q.part)+'</h2>'+
 '<p class="source-number">'+esc(q.number)+' <a class="source-original-link" href="'+esc(q.source)+'" target="_blank" rel="noopener noreferrer">Offizielle Quelle ↗</a></p></header>'+
 '<div class="source-reading" role="region" tabindex="0" aria-label="Vollständige offizielle Aufgabe mit Original-Lösungswegen">'+
 officialStatement(q)+
 (ui.poolHint?'<section class="source-solution" id="sourceSolution"><h3>Ergebnis überprüfen</h3><p>Scroll im offiziellen Aufgabenblatt weiter nach unten. Dort stehen die <strong>möglichen Lösungswege und die Lösungserwartung</strong>. Vergleiche sie direkt mit deinem Rechenweg auf Papier.</p></section>':'')+'</div>'+
 '<div class="source-answer-dock"><div class="handwrite-note">✏️ <b>Stift und Papier:</b> Bearbeite die vollständige Originalaufgabe. Lösungen stehen am Ende des PDF.</div>'+
 '<div class="source-actions"><button class="btn primary" data-action="source:pool-check">Ergebnis überprüfen</button>'+
 '<button class="btn secondary" data-action="source:pool-complete">'+(solved?'✓ Als bearbeitet markiert':'✓ Fertig bearbeitet')+'</button>'+
 '<button class="btn secondary" data-action="source:next">Nächstes Beispiel →</button></div>'+
 '<p class="source-credit">Datenquelle: Bundesministerium für Bildung · CC BY 4.0. Keine erfundene automatische Bewertung.</p></div></section>';
}
function browser(mode,state){
 if(ui.mode!==mode){ui.mode=mode;ui.filter='';ui.topic='all';reset()}
 window.__mathSourceState=state;
 const groups=mode==='book',bank=groups?GROUPS:POOL;
 const value=groups?ui.bookId:ui.poolId;
 const competencies={'4.1':'Grenzwerte & Stetigkeit','4.2':'Änderungsraten','4.3':'Ableitungsregeln','4.4':'Tangenten & Extrema','4.5':'Funktion & Ableitung','4.6':'Stammfunktionen','4.8':'Integrale & Flächen'};
 const categories=groups?[...new Set(bank.map(x=>x.category))]:Object.keys(competencies);
 const rows=bank.filter(x=>(ui.topic==='all'||(groups?x.category===ui.topic:
   x.descriptor.split(',').map(d=>d.trim()).includes(ui.topic)))&&
  (!ui.filter||(x.number+' '+(x.title||'')+' '+x.prompt).toLowerCase().includes(ui.filter.toLowerCase())));
 const active=rows.find(x=>x.id===value)||rows[0];
 if(active&&active.id!==value){
  if(groups){ui.bookId=active.id;ui.bookStepId=active.steps[0].id}else ui.poolId=active.id;
  reset();
 }
 const done=groups?BOOK.filter(q=>state.solved[solvedKey(q,'book')]).length:POOL.filter(q=>state.solved[solvedKey(q,'pool')]).length;
 const total=groups?BOOK.length:POOL.length;
 return '<div class="eyebrow">'+(groups?'ECHTE SCHULBUCH-AUFGABEN':'ORIGINAL-SRDP · 4. DESKRIPTOR')+'</div>'+
 '<h1>'+(groups?'Buchbeispiele':'4. Deskriptor')+'</h1><p>'+(groups?
 'Buchaufgaben mit gemeinsamer Originalangabe und einzeln überprüfbaren Schritten.':
 'Ausschließlich originale PDFs von aufgabenpool.at. Die Deskriptoren 4.1 und 4.6 sind im recherchierten amtlichen Pool nicht mit eigenständigen Aufgaben belegt.')+'</p>'+
 '<div class="source-count"><strong>'+done+'/'+total+'</strong> Schritte bearbeitet · '+(groups?GROUPS.length+' zusammengehörende Buchbeispiele':'Datenquelle: Bundesministerium für Bildung · CC BY 4.0')+'</div>'+
 '<div class="source-filters"><label>Suche <input id="sourceSearch" placeholder="z. B. '+(groups?'1.80':'B_405')+'" value="'+esc(ui.filter)+'"></label><label>Thema <select id="sourceTopic"><option value="all">Alle Bereiche</option>'+categories.map(c=>'<option value="'+esc(c)+'" '+(ui.topic===c?'selected':'')+'>'+(groups?esc(c):esc(c+' · '+competencies[c]))+'</option>').join('')+'</select></label></div>'+
 '<div class="source-workspace" data-mode="'+mode+'"><aside class="source-list" aria-label="Aufgabenliste">'+rows.map(x=>{
  const doneSteps=groups?x.steps.filter(q=>state.solved[solvedKey(q,'book')]).length:0;
  return '<button class="source-task '+(x.id===active?.id?'active':'')+'" data-action="source:open:'+esc(x.id)+'"><span class="source-task-number">'+esc(x.number)+(groups&&doneSteps===x.steps.length?' ✓':!groups&&state.solved[solvedKey(x,'pool')]?' ✓':'')+'</span><small class="source-task-title">'+esc(x.category)+(groups?' · '+doneSteps+'/'+x.steps.length+' Schritte':'')+'</small></button>'
 }).join('')+'</aside>'+(groups?bookDetails(active):active?details(active,'pool'):
 '<section class="source-detail"><header class="source-detail-header"><h2>Deskriptor '+esc(ui.topic)+'</h2></header><div class="source-reading"><p>Für diesen Deskriptor konnte ich keine eigenständig zugeordnete Originalaufgabe direkt von aufgabenpool.at verifizieren. Ich zeige dir keine erfundene Aufgabe und keine Fremdseite als angeblich offiziellen Aufgabenpool.</p><p>Die verbindliche Kompetenzbeschreibung findest du im <a target="_blank" rel="noopener noreferrer" href="https://www.aufgabenpool.at/amn/gk/srdp_am_kompetenzen_2018-2019-09-05.pdf">offiziellen Kompetenzkatalog des Bildungsministeriums</a>. Passende Rechenübungen sind unter Buchbeispiele zu finden.</p></div></section>')+'</div>';
}

function reset(){ui.shown=false;ui.poolHint=false;ui.submitted=false;ui.correct=null;ui.answer=''}
function captureList(mode,scroll){if(mode==='book'||mode==='pool')ui.listScroll[mode]=Math.max(0,scroll||0)}
function restoreList(mode,el){if(el&&ui.listScroll[mode]!=null)el.scrollTop=ui.listScroll[mode]}
function focusSolution(root){const reader=root?.querySelector('.source-reading');if(reader&&ui.shown)reader.scrollTop=reader.scrollHeight;}
function current(mode){return mode==='book'?activeStep():POOL.find(x=>x.id===ui.poolId)}
function next(mode,state){
 if(mode==='book'){
  const group=activeGroup(),step=activeStep(),index=group.steps.findIndex(x=>x.id===step.id);
  if(index+1<group.steps.length)ui.bookStepId=group.steps[index+1].id;
  else{const idx=GROUPS.findIndex(g=>g.id===group.id),upcoming=GROUPS[(idx+1)%GROUPS.length];
   ui.bookId=upcoming.id;ui.bookStepId=upcoming.steps[0].id}
  reset();return;
 }
 const idx=POOL.findIndex(x=>x.id===ui.poolId),fresh=POOL.find((x,i)=>i>idx&&!state.solved[solvedKey(x,'pool')])||
  POOL.find(x=>!state.solved[solvedKey(x,'pool')])||POOL[(idx+1)%POOL.length];
 if(fresh)ui.poolId=fresh.id;reset();
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
 const b=shuffle(GROUPS).slice(0,10).map(g=>({...g.steps[Math.floor(Math.random()*g.steps.length)],origin:'book',groupNumber:g.number,originalArtwork:g.artwork}));
 const p=shuffle(POOL).slice(0,10).map(q=>({...q,origin:'pool'}));
 ui.run={tasks:shuffle(b.concat(p)),index:0,score:0,results:[],draft:'',revealed:false,graded:false};
 ui.complete=null;
}
function intro(state){
 return '<div class="eyebrow">ENDGAME / ORIGINAL-SCHULARBEIT</div><h1>Schularbeitssimulation.</h1><div class="panel center"><div class="boss-number">∑</div><h2>20 originale Aufgaben · 10 Buch + 10 Deskriptor 4</h2><p>Jeder Durchgang zieht zufällig 10 echte Buchbeispiele und 10 veröffentlichte SRDP-Aufgaben. Du rechnest auf Papier und gibst dein Ergebnis ein. Bei numerischen Ergebnissen prüft Studyverse automatisch; begründende oder grafische Aufgaben vergleichst du mit der Quelle.</p><div class="stats"><div class="stat"><b>10</b><small>BUCHBEISPIELE</small></div><div class="stat"><b>10</b><small>SRDP-TASKS</small></div><div class="stat"><b>'+Math.max(0,Number(state.bestBoss)||0)+'%</b><small>BESTWERT</small></div><div class="stat"><b>100%</b><small>PROFESSOR FILIPP</small></div></div><button class="btn primary" data-action="source:exam-start">Prüfung starten ✎</button></div>';
}
function run(){
 if(!ui.run)return '<div class="panel">Starte eine neue Prüfung.</div>';
 const r=ui.run,q=r.tasks[r.index],isPool=q.origin==='pool';
 const frame=isPool?officialStatement(q):
  '<div class="book-exam-original">'+(q.originalArtwork||[]).map((name,i)=>'<img loading="lazy" alt="Originalbuchbeispiel '+esc(q.groupNumber)+' Abbildung '+(i+1)+'" src="original-figures/'+esc(name)+'">').join('')+'</div>';
 const last=r.results[r.results.length-1];
 return '<div class="eyebrow">SCHULARBEITSSIMULATION · FRAGE '+(r.index+1)+' / 20 · '+(isPool?'OFFIZIELLER AUFGABENPOOL':'BUCHBEISPIEL')+'</div>'+
 '<h1>Am Papier rechnen.</h1><div class="progress-track"><i style="width:'+((r.index/20)*100)+'%"></i></div>'+
 '<section class="question-card source-exam-card"><span class="pill">'+esc(q.groupNumber||q.number)+'</span><h2>'+esc(q.title||q.category)+'</h2>'+
 (isPool?'': '<p class="source-question">'+esc(q.prompt)+'</p>')+frame+
 '<div class="handwrite-note">✏️ Bearbeite die Originalaufgabe zuerst auf Papier. '+(isPool?'Die amtlichen Lösungswege befinden sich unten im PDF.':'Danach das Ergebnis eingeben.')+'</div>'+
 (q.expected!=null&&!isPool?'<input class="source-exam-input" id="sourceExamAnswer" inputmode="decimal" value="'+esc(r.draft)+'" placeholder="Berechnetes Ergebnis, z. B. 4,5">':
 '<textarea class="source-exam-input" id="sourceExamAnswer" rows="3" placeholder="Deine Rechnung oder Begründung …">'+esc(r.draft)+'</textarea>')+
 (!r.graded?'<button class="btn primary" data-action="source:exam-submit">'+(isPool?'Ergebnis mit Original-PDF vergleichen':'Prüfen / Lösung vergleichen')+'</button>':
 '<div class="source-solution"><h3>Ergebnis vergleichen</h3>'+
 (isPool?'<p>Scroll im amtlichen PDF weiter nach unten. Dort stehen die möglichen Lösungswege und die Lösungserwartung – keine automatisch erfundene Lösung.</p>':
 '<p>'+esc(q.steps)+'</p><div class="formula">'+esc(q.solution)+'</div>')+
 (last?.auto===null?'<div class="source-actions"><button class="btn primary" data-action="source:exam-self-right">✓ Meine Lösung stimmt</button><button class="btn secondary" data-action="source:exam-self-wrong">✕ Noch nicht richtig</button></div>':
 '<div class="answer-feedback '+(last?.correct?'good':'bad')+'">'+(last?.correct?'✓ Richtig':'✕ Ergebnis stimmt noch nicht')+'</div><button class="btn primary" data-action="source:exam-next">Nächste Aufgabe →</button>')+'</div>')+
 '</section>';
}
function result(){
 const r=ui.complete;if(!r)return intro({bestBoss:0});
 const automated=r.results.filter(x=>x.auto!==null).length,manual=r.results.length-automated;
 return '<div class="eyebrow">PRÜFUNG ABGESCHLOSSEN</div><div class="panel center"><div class="boss-number">'+r.percent+'%</div><h1>'+r.score+' von 20 Aufgaben richtig</h1><p>10 Original-Buchaufgaben und 10 offizielle Deskriptor-Aufgaben. Davon '+automated+' automatisch überprüft und '+manual+' nach aufgedeckter Lösung selbst beurteilt. Dieser Unterschied bleibt transparent.</p><p>'+(r.percent===100?'Perfekt! Professor Filipp ist freigeschaltet.':'Wiederhole schwierige Originalbeispiele und versuche die Simulation erneut.')+'</p><div class="source-actions"><button class="btn primary" data-action="source:exam-start">Neue Mischung starten</button><button class="btn secondary" data-action="nav:book">Buchbeispiele üben</button></div></div>';
}
function handle(action,api){
 const mode=api.view==='pool'?'pool':'book';
 if(action.startsWith('source:open:')){let x=action.slice(12),q=(mode==='book'?GROUPS:POOL).find(q=>q.id===x);if(q){if(mode==='book'){ui.bookId=x;ui.bookStepId=q.steps[0].id}else ui.poolId=x;reset()}return}
 if(action.startsWith('source:step:')&&mode==='book'){const id=action.slice(12);if(activeGroup().steps.some(q=>q.id===id)){ui.bookStepId=id;reset()}return}
 if(action==='source:pool-check'&&mode==='pool'){ui.poolHint=!ui.poolHint;return}
 if(action==='source:pool-complete'&&mode==='pool'){const q=current('pool');if(q)mark(q,'pool',true,api);return}
 if(action==='source:next'){next(mode,api.state);return}
 if(action==='source:reveal'){ui.answer=document.getElementById('sourceAnswer')?.value??ui.answer;ui.shown=!ui.shown;return}
 if(action==='source:submit'){let q=current(mode);if(!q)return;const v=document.getElementById('sourceAnswer')?.value||'';ui.answer=v;ui.submitted=true;ui.correct=answerNumeric(q,v);if(ui.correct===true)mark(q,mode,true,api);if(ui.correct===false)ui.shown=true;if(ui.correct===null)ui.shown=true;return}
 if(action==='source:self-right'){let q=current(mode);if(q)mark(q,mode,true,api);ui.correct=true;ui.submitted=true;return}
 if(action==='source:self-wrong'){ui.correct=false;ui.submitted=true;return}
 if(action==='source:exam-start'){startExam(api);api.navigate('bossrun');return}
 if(action==='source:exam-submit'&&ui.run&&!ui.run.graded){
  const r=ui.run,q=r.tasks[r.index];r.draft=document.getElementById('sourceExamAnswer')?.value||'';
  const verdict=q.origin==='pool'?null:answerNumeric(q,r.draft);
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
window.MATHS_SOURCE_TRAINER={BOOK,GROUPS,POOL,browser,details,intro,run,result,startExam,handle,refreshFilters,reset,plot,captureList,restoreList,focusSolution};
})();