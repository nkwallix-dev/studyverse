'use strict';
/* Small safe math-expression reader. No eval / arbitrary code execution.
   Supports implicit multiplication, German decimals, π, e, powers and common functions. */
window.MATHSVERSE_MATH=(function(){
 const functions={sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,ln:Math.log,log:Math.log,exp:Math.exp};
 function normalise(input){
  return String(input||'').trim()
   .replace(/ln\|([^|]+)\|/gi,'ln(abs($1))')
   .replace(/\|([^|]+)\|/g,'abs($1)')
   .replace(/∛\s*([a-zA-Z0-9]+)/g,'cbrt($1)')
   .replace(/√\s*([a-zA-Z0-9]+)/g,'sqrt($1)')
   .replace(/[−–]/g,'-').replace(/[×·⋅]/g,'*').replace(/÷/g,'/')
   .replace(/²/g,'^2').replace(/³/g,'^3').replace(/⁴/g,'^4')
   .replace(/,/g,'.').replace(/\s+/g,'');
 }
 function tokens(input){
  const source=normalise(input),out=[];
  if(!source||source.length>250)throw Error('Bitte gib einen kürzeren Term ein.');
  let pos=0;
  while(pos<source.length){
   const m=/^(?:(\d+(?:\.\d*)?|\.\d+)(?:([eE][+-]?\d+))?|([a-zA-Z]+|π)|([()+*\/\^-]))/.exec(source.slice(pos));
   if(!m)throw Error('Dieses Zeichen kann ich nicht lesen: '+source[pos]);
   if(m[1])out.push({type:'num',value:Number(m[1]+(m[2]||''))});
   else if(m[3])out.push({type:'id',value:m[3]});
   else out.push({type:m[4],value:m[4]});
   pos+=m[0].length;
  }
  return out;
 }
 function evaluate(source,values={}){
  const list=tokens(source);let i=0;
  const peek=()=>list[i]?.type;
  const eat=type=>{if(peek()!==type)throw Error('Unerwarteter Term. Prüfe Klammern und Rechenzeichen.');return list[i++].value;};
  function atom(){
   const k=peek();
   if(k==='num')return eat('num');
   if(k==='('){eat('(');const v=sum();eat(')');return v;}
   if(k==='id'){
    const raw=eat('id'),name=String(raw).toLowerCase();
    if(Object.hasOwn(functions,name)){
     eat('(');const arg=sum();eat(')');
     return functions[name](arg);
    }
    if(name==='pi'||raw==='π')return Math.PI;
    if(name==='e')return Math.E;
    if(name==='c')return 0;
    if(['x','t','a','b'].includes(name))return Number(values[name]??0);
    throw Error('Unbekannt: '+raw+' (erlaubt: x, t, a, b, sin, cos, ln, sqrt, e, pi).');
   }
   throw Error('Hier fehlt eine Zahl oder Klammer.');
  }
  function power(){
   let left=atom();
   if(peek()==='^'){eat('^');left=Math.pow(left,unary());}
   return left;
  }
  function unary(){if(peek()==='+'){eat('+');return unary()}if(peek()==='-'){eat('-');return -unary()}return power();}
  function product(){
   let left=unary();
   while(['*','/','num','id','('].includes(peek())){
    if(peek()==='*'){eat('*');left*=unary();}
    else if(peek()==='/'){eat('/');left/=unary();}
    else left*=unary();
   }
   return left;
  }
  function sum(){
   let v=product();
   while(peek()==='+'||peek()==='-'){
    if(peek()==='+'){eat('+');v+=product();}
    else{eat('-');v-=product();}
   }
   return v;
  }
  const result=sum();
  if(i!==list.length)throw Error('Das Ende des Terms konnte ich nicht lesen.');
  if(!Number.isFinite(result))throw Error('Der Term ist hier nicht definiert.');
  return result;
 }
 function close(actual,wanted,absolute=0.025){
  return Number.isFinite(actual)&&Number.isFinite(wanted)&&Math.abs(actual-wanted)<=Math.max(absolute,Math.abs(wanted)*0.004);
 }
 function check(task,input){
  const parsed=window.MATHSVERSE_INPUT?.parse(input);
  if(parsed&&parsed.kind!=='math')return {ok:false,message:window.MATHSVERSE_INPUT.simpleHint(task,parsed,true)};
  if(parsed)input=parsed.expression;
  if(!String(input||'').trim())return {ok:false,message:'Trag zuerst deine Rechnung ein.'};
  try{
   if(task.kind==='number'){
    const actual=evaluate(input,{});
    const expected=evaluate(task.answer,{});
    return close(actual,expected,task.tolerance||0.025)?
     {ok:true,message:'Richtig ausgerechnet!'}:
     {ok:false,message:'Noch nicht ganz. Prüfe die Zwischenschritte und die Grenzen.'};
   }
   const variable=task.variable||'x';
   const trials=[{x:0.65,t:0.65,a:2.4,b:-1.7},{x:1.15,t:1.15,a:-1.8,b:3.2},
    {x:2.2,t:2.2,a:1.5,b:0.6},{x:3.1,t:3.1,a:-3.1,b:2.1}];
   for(const values of trials){
    const x=values[variable],h=0.00001;
    const plus={...values,[variable]:x+h},minus={...values,[variable]:x-h};
    const slope=(evaluate(input,plus)-evaluate(input,minus))/(2*h);
    const target=evaluate(task.integrand,values);
    if(!close(slope,target,0.012))
     return {ok:false,message:task.id==='1.55a'?'Deine Stammfunktion ist lesbar, aber das Vorzeichen beim letzten x stimmt nicht: Aus +1 wird beim Integrieren +x (nicht −x).':'Die Eingabe ist lesbar, aber beim Ableiten entsteht noch nicht die Ausgangsfunktion. Prüfe Vorzeichen, Exponenten und Vorfaktoren.'};
   }
   if(task.kind==='velocity'){
    const v0=evaluate(input,{t:0,x:0,a:2,b:3});
    if(!close(v0,task.atZero,0.02))
     return {ok:false,message:'Die Form der Stammfunktion passt, aber v(0) muss 3 m/s ergeben.'};
   }
   return {ok:true,message:'Richtig! Deine Ableitung stimmt – auch eine anders geschriebene Stammfunktion zählt.'};
  }catch(error){
   return {ok:false,message:String(error.message||error)};
  }
 }
 return {evaluate,check,normalise};
})();
