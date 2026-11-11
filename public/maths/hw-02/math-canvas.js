'use strict';
/* MathsVerse Mini-Mathcad: freely placed, movable math regions.
   UI text is escaped, expressions are never executed, and region data is capped. */
window.MATHSVERSE_CANVAS=(function(){
 const K=window.MATHSVERSE_KEYBOARD;
 const escape=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
 const MAX=45, MAX_LENGTH=240;
 function restore(raw){
  if(!Array.isArray(raw))return [];
  const ids=new Set();
  return raw.slice(0,MAX).map((r,i)=>{
   if(!r||typeof r!=='object')return null;
   const id=typeof r.id==='string'&&/^r\d{1,7}$/.test(r.id)?r.id:'r'+(i+1);
   if(ids.has(id))return null;ids.add(id);
   return {id,x:clamp(r.x,0,90),y:clamp(r.y,8,6000),
    text:String(r.text??'').slice(0,MAX_LENGTH),
    kind:['draft','note','checked','example','result'].includes(r.kind)?r.kind:'draft',
    step:Number.isInteger(r.step)&&r.step>=0&&r.step<40?r.step:null};
  }).filter(Boolean);
 }
 function create(regions,x,y){
  if(regions.length>=MAX)return null;
  const max=regions.reduce((value,r)=>Math.max(value,Number(r.id.slice(1))||0),0);
  let yy=clamp(y,14,6000);
  for(let tries=0;tries<10;tries++){
   if(!regions.some(r=>Math.abs(r.y-yy)<195&&Math.abs(r.x-x)<44))break;
   yy=Math.min(6000,yy+235);
  }
  const region={id:'r'+(max+1),x:clamp(x,0,80),y:yy,text:'',kind:'draft',step:null};
  regions.push(region);return region;
 }
 function height(regions){return Math.max(490,...regions.map(r=>r.y+230))+95}
 function position(clientX,clientY,rect){
  const width=Math.max(1,rect.width||1);
  const x=clamp((clientX-rect.left)/width*100,0,80);
  return {x:Math.round(x*10)/10,y:clamp(Math.round(clientY-rect.top),14,6000)};
 }
 function countSteps(regions,total){
  const checked=new Set(regions.filter(r=>['checked','example'].includes(r.kind)&&r.step!==null).map(r=>r.step));
  let i=0;while(i<total&&checked.has(i))i++;
  return i;
 }
 function render(regions,activeId,total,step,done,feedback){
  const current=regions.find(r=>r.id===activeId);
  return '<section class="mathcad-workspace" aria-label="Freies Mathe-Rechenblatt">'+
   '<div class="mathcad-toolbar"><div><span class="eyebrow">✍️ MINI-MATHCAD</span><h3>Deine freie Rechenfläche</h3>'+
   '<p>Klicke an eine freie Stelle und tippe los. Verschiebe die Eingabefelder am ⠿-Griff. Mit Enter fügst du darunter eine neue Zeile hinzu.</p></div>'+
   '<button type="button" class="secondary" data-action="pad-add">＋ Neues Feld</button></div>'+
   '<div class="mathcad-progress"><span>'+step+' / '+total+' überprüfte Aufgabenschritte</span>'+
   (done?'<strong>✓ Aufgabe geschafft</strong>':'<span>Rechne frei – „Ergebnis prüfen“ erkennt auch andere Lösungswege.</span>')+'</div>'+
   '<div class="mathcad-sheet" tabindex="0" role="group" aria-label="Freie Rechenfläche: an beliebiger Stelle klicken, um zu schreiben" style="height:'+height(regions)+'px">'+
   '<div class="mathcad-sheet-hint" aria-hidden="true">＋ Hier klicken, um an dieser Stelle zu rechnen</div>'+
   regions.map(r=>{
    const verified=['checked','result'].includes(r.kind),example=r.kind==='example',active=r.id===activeId;
    return '<div class="mathcad-region '+(verified?'mathcad-verified ':'')+(example?'mathcad-example ':'')+(active?'mathcad-active ':'')+'" data-pad-region="'+r.id+'" style="--pad-x:'+r.x+'%;top:'+r.y+'px">'+
     '<div class="mathcad-region-title"><button type="button" class="mathcad-grab" data-pad-drag="'+r.id+'" aria-label="Rechenfeld verschieben">⠿</button>'+
      '<span>'+(r.kind==='checked'?'✓ Schritt '+(r.step+1):r.kind==='result'?'✓ Ergebnis':example?'👀 Beispiel':r.kind==='note'?'📝 Zwischenrechnung':'∑ Rechenfeld')+'</span>'+
      (verified||example?'<span class="mathcad-region-state">GESPEICHERT</span>':
       '<button type="button" class="mathcad-remove" data-action="pad-remove:'+r.id+'" aria-label="Eingabefeld entfernen">×</button>')+'</div>'+
     (verified||example?'<div class="mathcad-fixed-expression">'+K.pretty(r.text)+'</div>':
      '<input id="pad-input-'+r.id+'" class="mathcad-input" data-pad-input="'+r.id+'" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="'+MAX_LENGTH+'" aria-label="Rechenausdruck eingeben" placeholder="Hier rechnen …" value="'+escape(r.text)+'">'+
      '<div class="mathcad-expression-preview" data-pad-preview="'+r.id+'">'+K.pretty(r.text)+'</div>'+
      '<div class="mathcad-region-actions"><button type="button" data-action="pad-check:'+r.id+'">✓ Schritt prüfen</button>'+
      '<button type="button" data-action="pad-result:'+r.id+'">🏁 Ergebnis prüfen</button>'+
      '<button type="button" data-action="pad-note:'+r.id+'">Notiz</button></div>')+
     '</div>';
   }).join('')+'</div>'+
   (feedback?'<div class="feedback '+(feedback.ok?'good':'warn')+'" role="status">'+escape(feedback.message)+'</div>':'')+
   '<div class="mathcad-dock"><div class="mathcad-dock-title"><b>⌨️ MATHE-TASTATUR</b><small>'+(current?'Aktiv: '+escape(current.id):'Zum Eingeben zuerst eine Stelle im Blatt anklicken')+'</small></div>'+
   K.render('mathcad-active')+'</div>'+
   '</section>';
 }
 return {restore,create,height,position,countSteps,render};
})();
