'use strict';
/* MathsVerse · 2. Hausübungswiederholung
   Read-only solution course. No quiz, boss, free-form calculator, or answer gating.
   Existing player save data is retained for backwards-compatible StudyVerse syncing. */
(function(){
 const D=window.MATHSVERSE_DATA,G=window.MATHSVERSE_GRAPHS,L=window.MATHSVERSE_SOLUTIONS;
 if(!D||!G||!L)throw Error('MathsVerse: Buchaufgaben, Graphen oder ausführliche Lösungen fehlen.');
 const KEY='mathsverse_hw02_v1',PROFILE='studyverse_profile_v1';
 const $=selector=>document.querySelector(selector);
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const existing=read(KEY),saved=existing&&typeof existing==='object'?existing:{};
 saved.learned=saved.learned&&typeof saved.learned==='object'?saved.learned:{};
 let chapterIndex=0;
 const usefulGraphs=new Set(['1.57a','1.57b','1.66a','1.67a','1.98a','1.98b','1.98c','1.98d','1.100-1','1.100-2','1.100-3','1.100-4']);
 const primaryGraphs=new Set(['1.57b','1.66a','1.67a','1.100-1','1.100-4']);
 const titleFor=id=>id.replace('1.100-','1.100 / Teil ');
 const lessonCount=g=>D.tasks.filter(task=>task.group===g.name).length;
 function getChapter(){return D.groups[chapterIndex]||D.groups[0]}
 function topbar(){
  const profile=read(PROFILE)||{},avatar=profile.equipped?.avatar||'∑';
  return '<header class="topbar"><div class="breadcrumb"><span>∑ MATHSVERSE</span><span class="slash">/</span><b>2. Hausübungswiederholung</b></div>'+
   '<div class="top-links"><a href="../../" aria-label="Zur StudyVerse-Startseite">↩ <span>STUDYVERSE</span></a>'+
   '<a href="../../#profile" aria-label="Profil öffnen"><span>'+esc(avatar)+'</span> Mein Profil</a></div></header>';
 }
 function sidebar(){
  return '<aside class="sidebar"><a class="brand" href="../../"><span class="brand-mark">∑</span><span>MathsVerse<small>2. HAUSÜBUNGSWIEDERHOLUNG</small></span></a>'+
   '<p class="nav-label">DEINE 4 LERNKAPITEL</p><nav class="nav" aria-label="Lernkapitel">'+
   D.groups.map((g,i)=>'<button type="button" class="'+(chapterIndex===i?'selected':'')+'" data-chapter="'+i+'">'+
    '<span>'+esc(g.icon)+'</span><span>'+esc(g.name)+'</span>'+
    (saved.learned[g.name]?'<span class="chapter-nav-check" aria-label="Bereits gelesen">✓</span>':'')+'</button>').join('')+
   '</nav><div class="side-foot"><span>📖 18 vollständig gelöste Aufgaben</span>'+
   '<small>Vier Kapitel · 18 Musterlösungen · alle Rechenschritte erklärt</small>'+
   '<a href="../../">↩ StudyVerse-Zentrale</a></div></aside>';
 }
 function graph(task){
  if(!usefulGraphs.has(task.id))return '';
  const essential=primaryGraphs.has(task.id);
  return '<details class="solved-graph"'+(essential?' open':'')+'><summary>📈 '+(essential?'Graph zur Erklärung':'Graph optional ansehen')+'</summary>'+
   G.render(task)+'</details>';
 }
 function problem(task,index){
  const lesson=L.get(task.id);
  if(!lesson)return '<article class="solved-example"><h3>'+esc(titleFor(task.id))+'</h3><p>Für dieses Beispiel fehlt die Musterlösung.</p></article>';
  return '<article class="solved-example" id="beispiel-'+esc(task.id)+'">'+
   '<div class="solved-example-top"><span class="eyebrow">BUCHBEISPIEL '+esc(titleFor(task.id))+'</span>'+
   '<span class="solved-page-counter">'+String(index+1).padStart(2,'0')+' / '+String(lessonCount(getChapter())).padStart(2,'0')+'</span></div>'+
   '<h2>'+esc(task.prompt)+'</h2>'+
   '<div class="solved-given"><small>AUFGABENSTELLUNG</small><div class="solved-original">'+esc(task.math)+'</div></div>'+
   '<p class="solved-lead">'+esc(lesson.lead)+'</p>'+
   graph(task)+
   '<div class="solved-steps-header"><h3>Vollständiger Rechenweg</h3><span>'+lesson.steps.length+' erklärte Schritte</span></div>'+
   '<ol class="solved-calculation">'+lesson.steps.map((step,i)=>
    '<li class="solved-step"><span class="solved-step-no">'+String(i+1).padStart(2,'0')+'</span>'+
    '<div class="solved-step-content"><h4>'+esc(step.heading)+'</h4>'+
    '<div class="solved-math">'+esc(step.math)+'</div>'+
    '<p>'+esc(step.why)+'</p></div></li>').join('')+'</ol>'+
   '<div class="solved-answer"><span>✓ ERGEBNIS</span><strong>'+esc(lesson.result)+'</strong></div>'+
   (lesson.note?'<div class="solved-tip"><strong>💡 Darauf achten</strong><p>'+esc(lesson.note)+'</p></div>':'')+
   '<a class="solved-backlink" href="#kapitel-start">↑ Zur Kapitelübersicht</a>'+
   '</article>';
 }
 function chapterView(){
  const g=getChapter(),tasks=D.tasks.filter(t=>t.group===g.name);
  const finished=!!saved.learned[g.name];
  return '<div class="solved-chapter" id="kapitel-start">'+
   '<div class="heading"><span class="eyebrow">📖 MATHSVERSE · AUSFÜHRLICHER LERNKURS</span>'+
   '<h1>'+esc(g.icon)+' '+esc(g.name)+'</h1>'+
   '<p>'+esc(g.description)+'. Hier wird jedes ausgewählte Buchbeispiel wirklich durchgerechnet – mit allen Zwischenschritten, Erklärungen und wo sinnvoll mit Graph.</p></div>'+
   '<div class="solved-chapter-intro"><span class="eyebrow">DAS BRAUCHST DU FÜR DIESE AUFGABEN</span>'+
   '<p>'+esc(g.rule)+'</p></div>'+
   '<section class="solved-index" aria-label="Beispiele in diesem Kapitel"><div class="solved-index-top"><h2>Die '+tasks.length+' Beispiele dieses Kapitels</h2>'+
   '<span>'+esc(g.name)+'</span></div><div class="solved-index-items">'+
   tasks.map(t=>'<a href="#beispiel-'+esc(t.id)+'"><b>'+esc(titleFor(t.id))+'</b><small>'+esc(t.prompt)+'</small><span>↘</span></a>').join('')+'</div></section>'+
   tasks.map(problem).join('')+
   '<div class="solved-chapter-bottom"><div><h3>Kapitel durchgearbeitet?</h3><p>Du kannst das Kapitel als gelesen markieren. Die ausführlichen Beispiele bleiben jederzeit verfügbar.</p></div>'+
   '<button class="'+(finished?'secondary':'primary')+'" type="button" data-read-chapter="'+chapterIndex+'">'+
   (finished?'✓ Kapitel gelesen':'✓ Als gelesen markieren')+'</button></div>'+
   '<nav class="solved-chapter-next" aria-label="Zwischen Lernkapiteln wechseln">'+
   (chapterIndex>0?'<button type="button" class="secondary" data-chapter="'+(chapterIndex-1)+'">← '+esc(D.groups[chapterIndex-1].name)+'</button>':'<span></span>')+
   (chapterIndex<D.groups.length-1?'<button type="button" class="primary" data-chapter="'+(chapterIndex+1)+'">'+esc(D.groups[chapterIndex+1].name)+' →</button>':'<span class="solved-complete">🎓 Alle 18 Buchbeispiele sind hier ausführlich gelöst.</span>')+
   '</nav></div>';
 }
 function render(){
  $('#app').innerHTML=sidebar()+'<div class="workspace">'+topbar()+
   '<main class="main">'+chapterView()+'</main>'+
   '<footer>∑ MathsVerse · 2. Hausübungswiederholung · 18 ausführlich erklärte Buchteilaufgaben</footer></div>';
 }
 document.addEventListener('click',event=>{
  const chapter=event.target.closest('[data-chapter]');
  if(chapter){const index=Number(chapter.dataset.chapter);
   if(Number.isInteger(index)&&index>=0&&index<D.groups.length){chapterIndex=index;render();window.scrollTo?.(0,0)}
   return;
  }
  const readButton=event.target.closest('[data-read-chapter]');
  if(readButton){
   const name=getChapter().name;
   if(!saved.learned[name]){saved.learned[name]=true;localStorage.setItem(KEY,JSON.stringify(saved));
    if(typeof window.studyverseCloudTouch==='function')window.studyverseCloudTouch();
   }
   render();return;
  }
 });
 const param=new URLSearchParams(location.search).get('kapitel');
 const found=D.groups.findIndex(g=>g.name.toLowerCase()===String(param||'').toLowerCase());
 if(found>=0)chapterIndex=found;
 render();
})();
