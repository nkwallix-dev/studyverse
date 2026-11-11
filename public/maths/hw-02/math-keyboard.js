'use strict';
/* Reusable on-screen math keyboard for MathsVerse. Text only; no eval.
   Inserts expressions at the caret so learners can build fractions, roots and powers. */
window.MATHSVERSE_KEYBOARD=(function(){
 const groups=[
  [
   ['7','7'],['8','8'],['9','9'],['÷','/'],['(','('],[')',')']
  ],[
   ['4','4'],['5','5'],['6','6'],['×','*'],['x','x'],['t','t']
  ],[
   ['1','1'],['2','2'],['3','3'],['+','+'],['−','-'],['π','pi']
  ],[
   ['0','0'],[',','.'],['x²','square'],['x³','cube'],['xⁿ','power'],['√','root']
  ],[
   ['∛','cuberoot'],['a⁄b','fraction'],['ln','ln'],['eˣ','exp'],['|x|','abs'],['⌫','backspace'],['Leeren','clear']
  ]
 ];
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function render(inputId){
  return '<div class="math-keyboard" role="group" aria-label="Mathematik-Tastatur">'+
   '<div class="math-keyboard-head"><b>⌨️ MATHE-TASTATUR</b><span>Symbole antippen oder normal tippen</span></div>'+
   groups.map(row=>'<div class="math-keyboard-row">'+row.map(([label,key])=>
    '<button type="button" class="math-key '+(key==='clear'?'math-key-clear':'')+'" data-math-target="'+esc(inputId)+'" data-math-key="'+key+'" aria-label="'+esc(label==='a⁄b'?'Bruch eingeben':label==='xⁿ'?'Beliebige Potenz eingeben':label==='√'?'Quadratwurzel eingeben':label==='∛'?'Kubikwurzel eingeben':label==='⌫'?'Rückschritt':label==='Leeren'?'Eingabe löschen':label)+'">'+esc(label)+'</button>'
   ).join('')+'</div>').join('')+
   '<div class="math-keyboard-tip">Beispiele: <code>x^2</code>, <code>sqrt(9)</code>, <code>(x+1)/(x-2)</code>. Der Cursor bleibt an der richtigen Stelle.</div></div>';
 }
 function apply(value,start,end,key){
  value=String(value||'');
  const s=Math.max(0,Math.min(value.length,Number.isInteger(start)?start:value.length));
  const e=Math.max(s,Math.min(value.length,Number.isInteger(end)?end:s));
  const chosen=value.slice(s,e);
  let insert='',offset=0;
  if(key==='clear')return {value:'',caret:0};
  if(key==='backspace'){
   const from=s===e?Math.max(0,s-1):s;
   return {value:value.slice(0,from)+value.slice(e),caret:from};
  }
  if(key==='square'||key==='cube'){
   const n=key==='square'?'2':'3';
   insert=chosen?'('+chosen+')^'+n:'^'+n;
   offset=insert.length;
  }else if(key==='power'){
   insert=chosen?'('+chosen+')^()':'^()';
   offset=insert.length-1;
  }else if(key==='fraction'){
   insert=chosen?'('+chosen+')/()':'()/()';
   offset=chosen?insert.length-1:1;
  }else if(['root','cuberoot','ln','abs','exp'].includes(key)){
   const head={root:'sqrt(',cuberoot:'cbrt(',ln:'ln(',abs:'abs(',exp:'e^('}[key];
   insert=head+chosen+')';
   offset=chosen?insert.length:head.length;
  }else if(key===','){
   insert='.';offset=1;
  }else{
   const allowed=/^(?:[0-9xtab+\-*/().]|pi)$/;
   if(!allowed.test(key))return {value,caret:s};
   insert=key;offset=insert.length;
  }
  return {value:value.slice(0,s)+insert+value.slice(e),caret:s+offset};
 }
 function pretty(value){
  const raw=String(value||'').trim();
  if(!raw)return '<span class="math-placeholder">Hier erscheint dein Term …</span>';
  // Escape first; preserve no user-supplied HTML. This is a preview, never a solver.
  let text=esc(raw);
  text=text.replace(/\bpi\b/g,'π')
   .replace(/\bsqrt\(/gi,'√(').replace(/\bcbrt\(/gi,'∛(')
   .replace(/\*/g,' · ').replace(/\/(?=\S)/g,' / ')
   .replace(/\^(\d+|\([^)]*\))/g,(_,power)=>'<sup>'+power.replace(/^\((.*)\)$/,'$1')+'</sup>');
  return text;
 }
 return {render,apply,pretty};
})();
