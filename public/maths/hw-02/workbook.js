'use strict';
/* Structured pencil-and-paper recipes for the original 18 MathsVerse questions.
   A row is always: rule, requested handwritten line, worked line, why, expected RHS. */
window.MATHSVERSE_WORKBOOK=(function(){
 const rules=['Summenregel','Potenregel','Bruch und Wurzel umformen','Logarithmusregel','Trigonometrische Stammfunktion','Umgekehrte Kettenregel','Stammfunktion bilden','Grenzen einsetzen','Nullstellen berechnen','Schnittpunkte berechnen','Vorzeichen prüfen','Fläche aufteilen','Flächendifferenz bilden','Anfangsbedingung einsetzen','Funktionswert berechnen','Beschleunigung integrieren','Geschwindigkeit integrieren','Gleichung lösen','Ableitung kontrollieren'];
 const S=(rule,prompt,line,why,expected,tolerance)=>({rule,prompt,line,why,expected,tolerance});
 const R={
 '1.55a':[
  S('Summenregel','Integriere zuerst den ersten Summanden 4x³.','∫4x³ dx = x⁴','Beim Integrieren darfst du eine Summe in einzelne Integrale aufteilen.','x^4'),
  S('Potenregel','Schreibe jetzt die ganze Stammfunktion (ohne +C).','F(x) = x⁴ − 1,5x² + x','Bei xⁿ erhöhst du den Exponenten um 1 und dividierst durch den neuen Exponenten.','x^4-1.5*x^2+x'),
  S('Ableitung kontrollieren','Leite deine Stammfunktion zur Kontrolle ab.','F′(x) = 4x³ − 3x + 1','Die Ableitung einer Stammfunktion muss wieder f(x) ergeben.','4*x^3-3*x+1')
 ],
 '1.55b':[
  S('Potenregel','Integriere den Summanden a·t.','∫a·t dt = (a/2)t²','a bleibt konstant, nur t wird integriert.','a*t^2/2'),
  S('Summenregel','Schreibe die gesamte Stammfunktion ohne +C.','F(t) = (a/2)t² + bt','Der konstante Summand b wird zu bt.','a*t^2/2+b*t'),
  S('Ableitung kontrollieren','Leite F(t) nach t ab.','F′(t)=at+b','Beim Ableiten nach t sind a und b Konstanten.','a*t+b')
 ],
 '1.56a':[
  S('Bruch und Wurzel umformen','Schreibe 3/x³ als Potenz.','3/x³ = 3x⁻³','Brüche mit x im Nenner werden Potenzen mit negativen Exponenten.','3*x^(-3)'),
  S('Potenregel','Integriere 3x⁻³.','∫3x⁻³ dx = −(3/2)x⁻²','Erhöhe −3 auf −2 und teile den Vorfaktor durch −2.','-3/(2*x^2)'),
  S('Summenregel','Schreibe die vollständige Stammfunktion ohne +C.','F(x) = −5x³/3 − 3/(2x²) − 3x^(4/3)/4','Die Kubikwurzel entspricht x^(1/3).','-5*x^3/3-3/(2*x^2)-3*x^(4/3)/4')
 ],
 '1.56b':[
  S('Bruch und Wurzel umformen','Schreibe ∛(x²) als Potenz.','∛(x²) = x^(2/3)','Die dritte Wurzel entspricht dem Exponenten 1/3.','x^(2/3)'),
  S('Logarithmusregel','Integriere den Summanden 5/x.','∫5/x dx = 5ln|x|','Für 1/x gilt die Sonderregel ln|x|, nicht die normale Potenzregel.','5*ln(abs(x))'),
  S('Summenregel','Ergänze alle Summanden zur Stammfunktion.','F(x) = (3/5)x^(5/3) + 5ln|x| + 3/x','Die übrigen Potenzen integrierst du mit der Potenzregel.','3*x^(5/3)/5+5*ln(abs(x))+3/x')
 ],
 '1.57a':[
  S('Trigonometrische Stammfunktion','Finde eine Stammfunktion von sin(t).','F(t) = −cos(t)','Weil die Ableitung von −cos(t) gleich sin(t) ist.','-cos(t)'),
  S('Grenzen einsetzen','Berechne F(π) − F(0).','−cos(π) − (−cos(0)) = 2','Bei bestimmten Integralen gilt immer obere Grenze minus untere Grenze.','2')
 ],
 '1.57b':[
  S('Trigonometrische Stammfunktion','Finde eine Stammfunktion von cos(x).','F(x) = sin(x)','Die Ableitung von sin(x) ist cos(x).','sin(x)'),
  S('Grenzen einsetzen','Berechne sin(2π) − sin(0).','sin(2π) − sin(0) = 0','Eine ganze Sinus-Periode ergibt als vorzeichenbehaftetes Integral 0.','0')
 ],
 '1.58a':[
  S('Umgekehrte Kettenregel','Integriere e^(2x) ohne den Faktor 5.','∫e^(2x) dx = e^(2x)/2','Die innere Ableitung von 2x ist 2; daher dividierst du durch 2.','e^(2*x)/2'),
  S('Stammfunktion bilden','Ergänze den Vorfaktor 5.','F(x) = (5/2)e^(2x)','Den ursprünglichen Faktor 5 nicht vergessen.','5*e^(2*x)/2'),
  S('Ableitung kontrollieren','Leite die Stammfunktion ab.','F′(x) = 5e^(2x)','Durch die Kettenregel kommt die innere 2 beim Ableiten zurück.','5*e^(2*x)')
 ],
 '1.58b':[
  S('Umgekehrte Kettenregel','Wie groß ist die innere Ableitung von 0,5t+π/2?','u′(t) = 0,5','Nur 0,5t hängt von t ab.','0.5'),
  S('Trigonometrische Stammfunktion','Bilde die Stammfunktion ohne +C.','F(t) = −2cos(0,5t+π/2)','Integral von sin(u): −cos(u) geteilt durch u′ = 0,5.','-2*cos(0.5*t+pi/2)'),
  S('Ableitung kontrollieren','Leite deine Stammfunktion ab.','F′(t) = sin(0,5t+π/2)','Der Faktor 2 wird mit der inneren Ableitung 0,5 verrechnet.','sin(0.5*t+pi/2)')
 ],
 '1.66a':[
  S('Nullstellen berechnen','Welche Nullstelle liegt zwischen −3 und 2?','x(x+6)=0 ⇒ x=0 liegt im Intervall','Nur bei einer Nullstelle kann f sein Vorzeichen wechseln.','0'),
  S('Stammfunktion bilden','Integriere f(x)=x²+6x.','F(x) = x³/3 + 3x²','Potenregel für beide Summanden.','x^3/3+3*x^2'),
  S('Fläche aufteilen','Wie groß ist die Teilfläche auf [−3;0]?','A₁ = |F(0)−F(−3)| = 18','Unterhalb der x-Achse liefert das Integral einen negativen Wert; die Fläche ist dessen Betrag.','18'),
  S('Fläche aufteilen','Berechne die Teilfläche auf [0;2].','A₂ = F(2)−F(0) = 44/3','Auf dem zweiten Intervall ist f positiv.','44/3')
 ],
 '1.67a':[
  S('Schnittpunkte berechnen','Gib die linke Schnittstelle als x-Wert an.','x₁=3−√10','f=g führt zu x²−6x−1=0; löse mit der Mitternachtsformel.','3-sqrt(10)'),
  S('Schnittpunkte berechnen','Gib die rechte Schnittstelle an.','x₂=3+√10','Die beiden Wurzeln bilden die Integrationsgrenzen.','3+sqrt(10)'),
  S('Flächendifferenz bilden','Schreibe obere minus untere Funktion als Term.','g(x)−f(x) = −x²+6x+1','Zwischen den Schnittpunkten liegt die Gerade g über der Parabel f.','-x^2+6*x+1'),
  S('Grenzen einsetzen','Berechne die eingeschlossene Fläche.','A = (40√10)/3','Integriere g−f von x₁ bis x₂.','40*sqrt(10)/3')
 ],
 '1.98a':[
  S('Stammfunktion bilden','Integriere x²+4x−1.','F(x)=x³/3+2x²−x','Alle Summanden einzeln mit der Potenzregel integrieren.','x^3/3+2*x^2-x'),
  S('Grenzen einsetzen','Berechne F(4).','F(4)=148/3','Setze zuerst die obere Grenze ein.','148/3'),
  S('Grenzen einsetzen','Berechne F(1).','F(1)=4/3','Setze danach die untere Grenze ein.','4/3'),
  S('Grenzen einsetzen','Berechne F(4)−F(1).','148/3−4/3 = 48','Das Endergebnis ist die Differenz, kein Produkt.','48')
 ],
 '1.98b':[
  S('Umgekehrte Kettenregel','Integriere e^(2x).','F(x) = e^(2x)/2','Innere Ableitung 2 berücksichtigen.','e^(2*x)/2'),
  S('Grenzen einsetzen','Berechne F(1)−F(0).','(e²−1)/2','Untere und obere Grenze einsetzen und subtrahieren.','(e^2-1)/2')
 ],
 '1.98c':[
  S('Bruch und Wurzel umformen','Schreibe ∛(x²) als Potenz.','x^(2/3)','Der Wurzelexponent 3 steht im Nenner des Potenzexponenten.','x^(2/3)'),
  S('Potenregel','Bilde die Stammfunktion.','F(x)=(3/5)x^(5/3)','Exponent um 1 erhöhen und durch 5/3 dividieren.','3*x^(5/3)/5'),
  S('Grenzen einsetzen','Berechne F(5)−F(2).','(3/5)(5^(5/3)−2^(5/3))','Die Grenzen bleiben nach der Integration erhalten.','3*(5^(5/3)-2^(5/3))/5')
 ],
 '1.98d':[
  S('Trigonometrische Stammfunktion','Integriere 3sin(x).','F(x)=−3cos(x)','Die Stammfunktion von sin(x) ist −cos(x).','-3*cos(x)'),
  S('Grenzen einsetzen','Berechne F(π/2)−F(0).','−3·0−(−3·1)=3','Die Winkel sind im Bogenmaß.','3')
 ],
 '1.100-1':[
  S('Beschleunigung integrieren','Bilde aus a(t) die Geschwindigkeit ohne Integrationskonstante.','v(t) = 0,0012t³−0,09t²+2,25t+C','Geschwindigkeit ist eine Stammfunktion der Beschleunigung.','0.0012*t^3-0.09*t^2+2.25*t'),
  S('Anfangsbedingung einsetzen','Was ist C, wenn v(0)=3 m/s?','C=3','Alle t-Terme sind bei t=0 gleich 0.','3'),
  S('Stammfunktion bilden','Schreibe die vollständige Geschwindigkeit v(t).','v(t)=0,0012t³−0,09t²+2,25t+3','Die Anfangsgeschwindigkeit kommt als Konstante dazu.','0.0012*t^3-0.09*t^2+2.25*t+3')
 ],
 '1.100-2':[
  S('Funktionswert berechnen','Berechne v(25) durch Einsetzen.','v(25)=21,75 m/s','25 für t einsetzen: 18,75−56,25+56,25+3.','21.75')
 ],
 '1.100-3':[
  S('Grenzen einsetzen','Berechne ∫₀²⁵a(t)dt.','Δv = v(25)−v(0) = 18,75 m/s','Das Beschleunigungsintegral ist die Geschwindigkeitsänderung, nicht der Weg.','18.75')
 ],
 '1.100-4':[
  S('Geschwindigkeit integrieren','Bilde den Weg s(t) bei s(0)=0.','s(t)=0,0003t⁴−0,03t³+1,125t²+3t','Der Weg ist das Integral von v(t); die Anfangsstrecke ist 0.','0.0003*t^4-0.03*t^3+1.125*t^2+3*t'),
  S('Gleichung lösen','Löse s(t)=200 nach t im Bereich 0 bis 25.','t≈14,41 s','Das ist eine Gleichung vierten Grades; numerisch lösen ist hier sinnvoll.','14.4098445789603',0.06)
 ]
 };
 function steps(id){return R[id]||[]}
 function compare(input,row){
  const parsed=window.MATHSVERSE_INPUT?.parse(input);
  if(parsed&&parsed.kind!=='math')return {ok:false,message:window.MATHSVERSE_INPUT.simpleHint(null,parsed,false)};
  if(parsed)input=parsed.expression;
  if(!row?.expected)return {ok:false,message:'Für diese Zeile gibt es keine prüfbare Eingabe.'};
  const E=window.MATHSVERSE_MATH;
  try{
   const samples=[{x:0.8,t:0.8,a:2.2,b:1.4},{x:1.6,t:1.6,a:-1.5,b:2.7},{x:2.8,t:2.8,a:1.3,b:-2.1}];
   for(const values of samples){
    const got=E.evaluate(input,values),expected=E.evaluate(row.expected,values);
    if(!Number.isFinite(got)||!Number.isFinite(expected)||Math.abs(got-expected)>Math.max(row.tolerance||0.025,Math.abs(expected)*0.004))
     return {ok:false,message:'Diese Zeile stimmt rechnerisch noch nicht. Prüfe Faktoren, Exponenten und Vorzeichen.'};
   }
   return {ok:true,message:'✅ Rechnerisch gleichwertig – auch andere korrekte Schreibweisen zählen.'};
  }catch(e){return {ok:false,message:String(e.message||e)}}
 }
 return {rules,steps,compare};
})();