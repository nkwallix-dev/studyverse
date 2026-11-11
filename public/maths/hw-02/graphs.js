'use strict';
/* MathsVerse graph atlas: SVG charts rendered locally, no dependency or eval.
   Curves and fill limits belong to the 18 original textbook tasks. */
window.MATHSVERSE_GRAPHS=(function(){
 const math=window.MATHSVERSE_MATH;
 const DRONE={
  a:'0.0036*t^2-0.18*t+2.25',
  v:'0.0012*t^3-0.09*t^2+2.25*t+3',
  s:'0.0003*t^4-0.03*t^3+1.125*t^2+3*t'
 };
 const P={
  '1.55a':{range:[-2,2],curves:[['4*x^3-3*x+1','f(x)'],['x^4-1.5*x^2+x','F(x)']]},
  '1.55b':{range:[-3,3],curves:[['2*t+1','f(t), mit a=2 und b=1'],['t^2+t','F(t)']],note:'Beispielgrafik für a=2, b=1; die Aufgabe selbst gilt für beliebige Konstanten.'},
  '1.56a':{range:[0.8,3.2],curves:[['-5*x^2+3/x^3-x^(1/3)','f(x)'],['-5*x^3/3-3/(2*x^2)-3*x^(4/3)/4','F(x)']],note:'Nur der positive Definitionsbereich wird hier gezeigt.'},
  '1.56b':{range:[0.55,4],curves:[['x^(2/3)+5/x-3/x^2','f(x)'],['3*x^(5/3)/5+5*ln(x)+3/x','F(x)']],note:'Gezeigt wird x > 0; ln|x| gilt auf beiden Seiten von 0.'},
  '1.57a':{range:[-0.45,3.65],curves:[['sin(t)','sin(t)']],shade:{from:0,to:Math.PI},marks:[0,Math.PI],xlabel:'t (Bogenmaß)'},
  '1.57b':{range:[-0.5,6.8],curves:[['cos(x)','cos(x)']],shade:{from:0,to:2*Math.PI},marks:[0,Math.PI,2*Math.PI],xlabel:'x (Bogenmaß)'},
  '1.58a':{range:[-1.5,1.25],curves:[['5*e^(2*x)','f(x)'],['2.5*e^(2*x)','F(x)']]},
  '1.58b':{range:[-3,7],curves:[['sin(0.5*t+pi/2)','f(t)'],['-2*cos(0.5*t+pi/2)','F(t)']],xlabel:'t'},
  '1.66a':{range:[-4,3],curves:[['x^2+6*x','f(x)']],shade:{from:-3,to:2},marks:[-3,0,2],note:'Die Teilfläche links von 0 liegt unter der x-Achse: für den Flächeninhalt ihren Betrag nehmen.'},
  '1.67a':{range:[-1.3,7.3],curves:[['x^2-3*x-2','f(x)'],['3*x-1','g(x)']],shade:{from:3-Math.sqrt(10),to:3+Math.sqrt(10),between:true},marks:[3-Math.sqrt(10),3+Math.sqrt(10)],note:'Schattiert ist der Bereich zwischen den Schnittpunkten: g(x) liegt hier oberhalb von f(x).'},
  '1.98a':{range:[0,5],curves:[['x^2+4*x-1','f(x)']],shade:{from:1,to:4},marks:[1,4]},
  '1.98b':{range:[-0.15,1.35],curves:[['e^(2*x)','e^(2x)']],shade:{from:0,to:1},marks:[0,1]},
  '1.98c':{range:[0,6],curves:[['x^(2/3)','∛(x²)']],shade:{from:2,to:5},marks:[2,5]},
  '1.98d':{range:[-0.25,1.85],curves:[['3*sin(x)','3 sin(x)']],shade:{from:0,to:Math.PI/2},marks:[0,Math.PI/2]},
 };
 const points=['#9beedb','#d5a9ff','#ffcf90'];
 const printable=n=>{if(Math.abs(n-Math.PI)<0.002)return 'π';if(Math.abs(n-2*Math.PI)<0.002)return '2π';if(Math.abs(n-Math.PI/2)<0.002)return 'π/2';return Number(n.toFixed(2)).toLocaleString('de-AT')};
 const safe=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]));
 function spec(id){return P[id]||null}
 function graphSvg(specification){
  const width=620,height=280,L=45,R=16,T=16,B=35;
  const [minX,maxX]=specification.range,plotW=width-L-R,plotH=height-T-B;
  const axis=specification.xlabel||'x';
  const curves=specification.curves.map(([expression,label])=>({expression,label,values:[]}));
  const at=(exp,x)=>{try{return math.evaluate(exp,{x,t:x,a:2,b:1})}catch{return NaN}};
  let low=0,high=0;
  for(let i=0;i<=180;i++){
   const x=minX+(maxX-minX)*i/180;
   curves.forEach(c=>{
    let y=at(c.expression,x);if(!Number.isFinite(y)||Math.abs(y)>100000)y=NaN;
    c.values.push({x,y});
    if(Number.isFinite(y)){low=Math.min(low,y);high=Math.max(high,y)}
   });
  }
  const span=Math.max(1,high-low),margin=span*0.11;
  low-=margin;high+=margin;
  const xx=x=>L+(x-minX)/(maxX-minX)*plotW;
  const yy=y=>T+(high-y)/(high-low)*plotH;
  function path(v){
   let d='',active=false;
   for(const p of v){if(!Number.isFinite(p.y)){active=false;continue}d+=(active?' L':' M')+xx(p.x).toFixed(2)+' '+yy(p.y).toFixed(2);active=true}
   return d;
  }
  let svg='<svg class="maths-graph-svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+safe(curves.map(c=>c.label).join(' und '))+' als Koordinatengrafik" xmlns="http://www.w3.org/2000/svg">';
  svg+='<defs><clipPath id="maths-plot-clip"><rect x="'+L+'" y="'+T+'" width="'+plotW+'" height="'+plotH+'"/></clipPath></defs>';
  for(let i=0;i<=4;i++){
   const x=L+plotW*i/4,y=T+plotH*i/4;
   svg+='<path d="M'+x+' '+T+'V'+(height-B)+' M'+L+' '+y+'H'+(width-R)+'" stroke="#ffffff15" stroke-width="1"/>';
   svg+='<text x="'+x+'" y="'+(height-15)+'" text-anchor="middle" class="graph-tick">'+safe(printable(minX+(maxX-minX)*i/4))+'</text>';
   svg+='<text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" class="graph-tick">'+safe(printable(high-(high-low)*i/4))+'</text>';
  }
  if(low<=0&&high>=0)svg+='<path d="M'+L+' '+yy(0)+' H'+(width-R)+'" stroke="#ffffff90" stroke-width="1.4"/>';
  if(minX<=0&&maxX>=0)svg+='<path d="M'+xx(0)+' '+T+' V'+(height-B)+'" stroke="#ffffff90" stroke-width="1.4"/>';
  const shade=specification.shade;
  if(shade){
   const count=160;
   const top=[],bottom=[];
   for(let i=0;i<=count;i++){
    const x=shade.from+(shade.to-shade.from)*i/count;
    const a=at(curves[0].expression,x),b=shade.between?at(curves[1].expression,x):0;
    if(Number.isFinite(a)&&Number.isFinite(b)){top.push(xx(x)+','+yy(a));bottom.push(xx(x)+','+yy(b))}
   }
   if(top.length>1)svg+='<polygon points="'+top.concat(bottom.reverse()).join(' ')+'" fill="#9eeec8" fill-opacity=".25" clip-path="url(#maths-plot-clip)"/>';
  }
  svg+='<g clip-path="url(#maths-plot-clip)">';
  curves.forEach((c,i)=>{svg+='<path d="'+path(c.values)+'" stroke="'+points[i]+'" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'});
  for(const mark of specification.marks||[]){
   svg+='<path d="M'+xx(mark)+' '+T+' V'+(height-B)+'" stroke="#ffd99a" stroke-width="1.2" stroke-dasharray="5 5"/>';
   if(shade&&shade.between){let y=at(curves[0].expression,mark);if(Number.isFinite(y))svg+='<circle cx="'+xx(mark)+'" cy="'+yy(y)+'" r="4.5" fill="#ffd99a" stroke="#1b2143" stroke-width="2"/>'}
  }
  svg+='</g>';
  svg+='<text x="'+(width-R)+'" y="'+(height-3)+'" text-anchor="end" class="graph-tick">'+safe(axis)+'</text></svg>';
  return svg;
 }
 function card(title,description,definition){
  return '<section class="graph-card"><div class="graph-head"><div><b>'+safe(title)+'</b><small>'+safe(description||'Lokale Darstellung der Funktionen')+'</small></div><span class="graph-label">📈 GRAPH</span></div>'+
   graphSvg(definition)+'<div class="graph-legend">'+definition.curves.map((c,i)=>'<span><i style="background:'+points[i]+'"></i>'+safe(c[1])+'</span>').join('')+
   (definition.shade?'<span><i class="area-swatch"></i>'+ (definition.shade.between?'Eingeschlossene Fläche':'Integralintervall')+'</span>':'')+'</div>'+
   (definition.note?'<p class="graph-note">'+safe(definition.note)+'</p>':'')+'</section>';
 }
 function render(task,examMode=false){
  if(task.group==='Drohnenaufgabe'){
   const chosen=task.id==='1.100-1'?0:task.id==='1.100-4'?2:1;
   const titles=['Beschleunigung a(t)','Geschwindigkeit v(t)','Strecke s(t)'];
   const units=['m/s²','m/s','m'];
   return '<div class="graph-stack"><div class="drone-chain"><b>DROHNEN-PROZESSKETTE</b><span>a(t) → integrieren → v(t) → integrieren → s(t)</span></div>'+
    [0,1,2].map((i)=>{
     const spec={range:[0,25],xlabel:'t (Sekunden)',curves:[[DRONE[['a','v','s'][i]],titles[i]+' ['+units[i]+']']],
      shade:!examMode&&task.id==='1.100-3'&&i===0?{from:0,to:25}:!examMode&&task.id==='1.100-4'&&i===1?{from:0,to:14.4098445789603}:null,
      marks:examMode?[]:task.id==='1.100-4'&&i===2?[14.4098445789603]:task.id==='1.100-2'&&i===1?[25]:[],
      note:!examMode&&i===2?'Bei t≈14,41 s erreicht die Drohne 200 m.':''};
     return '<div class="drone-graph '+(i===chosen?'drone-graph-main':'')+'">'+card(titles[i],i===chosen?'Aktueller Rechenschritt':'Aus derselben Bewegung abgeleitet',spec)+'</div>';
    }).join('')+'</div>';
  }
  const x=spec(task.id);const drawing=examMode&&x?{...x,shade:null,marks:[],note:''}:x;
  return drawing?card('Graph zu '+task.id,task.group,drawing):'';
 }
 return {render,spec,graphSvg};
})();