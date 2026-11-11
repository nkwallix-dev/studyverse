'use strict';
/* Human-readable worksheet syntax adapter. Does not run arbitrary JavaScript.
   It recognizes function assignments and handwritten integral statements before
   sending only the actual mathematical expression to the safe math evaluator. */
window.MATHSVERSE_INPUT=(function(){
 function parse(value){
  const source=String(value??'').trim();
  if(!source)return {kind:'empty',expression:'',source};
  // Integral statements are a task description, not their evaluated integral.
  if(/^(?:∫|integral\b|integriere\b|\\int\b)/i.test(source))
   return {kind:'integral',expression:'',source};
  // Accept the conventional written style F(x)=..., v(t)=..., A=..., x=...
  // Reject chained equalities instead of silently skipping a calculation.
  const equation=/^([a-zA-ZΔ][a-zA-Z0-9Δ]*\s*(?:\(\s*[a-zA-Z]\s*\))?)\s*(?::=|=)\s*(.+)$/u.exec(source);
  if(equation){
   const left=equation[1].replace(/\s/g,''),right=equation[2].trim();
   if(right.includes('='))return {kind:'equation',expression:'',source};
   return {kind:'math',expression:right,source,label:left};
  }
  if(source.includes('='))return {kind:'equation',expression:'',source};
  // Typical written notebook notes ("Integral aus ...", "die erste Fläche" etc.).
  if(/(?:\b(?:aus|ist|von|berechnen|umformen|aufteilen|integrieren|ableiten|schritt)\b)/i.test(source))
   return {kind:'note',expression:'',source};
  return {kind:'math',expression:source,source,label:null};
 }
 function simpleHint(task,parsed,asResult){
  if(parsed.kind==='integral')
   return 'Das ist deine Integral-Angabe, noch keine berechnete Stammfunktion. Speichere sie als Notiz und rechne im nächsten Feld weiter.';
  if(parsed.kind==='equation')
   return 'Eine Gleichung mit zwei Seiten kannst du als Zwischenrechnung speichern. Zum Prüfen gib den ausgerechneten Ausdruck ein, zum Beispiel F(x)=x^4−1,5x^2+x.';
  if(parsed.kind==='note')
   return 'Das ist eine verständliche Notiz. Speichere sie als Zwischenrechnung; mathematisch prüfen kann ich nur einen Term.';
  if(parsed.kind==='empty')return 'Schreib zunächst einen Term oder eine Rechnung in das Feld.';
  return asResult?'Prüf dein Vorzeichen und die Stammfunktion. Bei F(x)=… wird nur die rechte Seite berechnet.':'Die Rechnung ist lesbar, stimmt aber noch nicht mit diesem Schritt überein.';
 }
 return {parse,simpleHint};
})();
