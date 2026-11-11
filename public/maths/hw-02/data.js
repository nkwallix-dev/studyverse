'use strict';
(function(){
 const M={
  power:['Potenregel anwenden','Partielle Integration verwenden','Zähler und Nenner getrennt integrieren'],
  linear:['Potenregel und Summenregel nutzen','Produktregel beim Integrieren anwenden','Erst t = 0 einsetzen'],
  inverse:['Wurzeln und Brüche als Potenzen schreiben','Den Bruch ohne Umformen integrieren','Nur die konstanten Terme integrieren'],
  trig:['Trigonometrische Stammfunktion bilden','Die Funktion nur ableiten','Die Integrationsgrenzen addieren'],
  exponential:['Kettenregel rückwärts: durch innere Ableitung teilen','Den Exponenten unverändert als Vorfaktor verwenden','Die e-Funktion durch eine Zahl ersetzen'],
  fundamental:['Stammfunktion finden und F(oben) − F(unten) rechnen','Ober- und Untergrenze direkt multiplizieren','Nur F(oben) einsetzen'],
  areaAxis:['Nullstellen prüfen und Betragsflächen getrennt berechnen','Nur das Integral ohne Vorzeichenprüfung berechnen','f(a) mal f(b) rechnen'],
  areaBetween:['Schnittpunkte bestimmen, obere minus untere Funktion integrieren','Die beiden Funktionen getrennt von 0 bis 1 integrieren','Nur die y-Achsenabschnitte vergleichen'],
  acceleration:['Beschleunigung integrieren und v(0) berücksichtigen','Die Beschleunigung mit 25 multiplizieren','Die Beschleunigung ableiten'],
  speed:['Den Zeitpunkt in v(t) einsetzen','Den Zeitpunkt in a(t) einsetzen','Die Geschwindigkeit von der Strecke abziehen'],
  deltaV:['Die Geschwindigkeitsänderung über das Beschleunigungsintegral bestimmen','Die gesamte Strecke direkt aus a(t) ablesen','Die Anfangsgeschwindigkeit ableiten'],
  displacement:['v(t) integrieren und s(t)=200 lösen','Die Beschleunigung gleich 200 setzen','v(25) mit 200 multiplizieren']
 };
 const T=(id,group,math,prompt,method,stepPrompt,stepOptions,stepRight,kind,answer,steps,extra={})=>({
  id,group,math,prompt,methodOptions:M[method],methodRight:0,
  stepPrompt,stepOptions,stepRight,kind,answer,steps,...extra
 });
 const tasks=[
 T('1.55a','Stammfunktionen','∫ (4x³ − 3x + 1) dx','Bestimme die Stammfunktion F(x).','power','Wie lautet die Stammfunktion von 4x³?',
 ['x⁴','12x²','4x⁴'],0,'primitive','x^4-3*x^2/2+x',[
  'Summenregel: integriere jeden Summanden einzeln.',
  '∫4x³ dx = x⁴; ∫(−3x) dx = −(3/2)x²; ∫1 dx = x.',
  'Ergebnis: F(x) = x⁴ − 1,5x² + x + C.',
  'Kontrolle: F′(x) = 4x³ − 3x + 1.'
 ],{integrand:'4*x^3-3*x+1',variable:'x'}),
 T('1.55b','Stammfunktionen','∫ (a·t + b) dt','a und b sind Konstanten. Integriere nach t.','linear','Was entsteht beim Integrieren von a·t?',
 ['a·t² / 2','a·t²','a·t'],0,'primitive','a*t^2/2+b*t',[
  'a und b sind feste Parameter; nur t ist die Integrationsvariable.',
  '∫a·t dt = (a/2)t² und ∫b dt = bt.',
  'Ergebnis: F(t) = (a/2)t² + bt + C.',
  'Ableiten nach t ergibt wieder a·t + b.'
 ],{integrand:'a*t+b',variable:'t'}),
 T('1.56a','Stammfunktionen','∫ (−5x² + 3/x³ − ∛x) dx','Wandle zuerst alle Brüche und Wurzeln um.','inverse','Welche Potenzen sind richtig?',
 ['3x⁻³ und −x^(1/3)','3x³ und −x³','3x⁻¹ und −x^(−3)'],0,'primitive','-5*x^3/3-3/(2*x^2)-3*x^(4/3)/4',[
  'Schreibe die Funktion als −5x² + 3x⁻³ − x^(1/3).',
  'Potenregel: ∫xⁿ dx = xⁿ⁺¹/(n+1), sofern n ≠ −1.',
  'F(x) = −(5/3)x³ − (3/2)x⁻² − (3/4)x^(4/3) + C.',
  'Achtung: 3x⁻³ ergibt beim Integrieren −(3/2)x⁻².'
 ],{integrand:'-5*x^2+3/x^3-x^(1/3)',variable:'x'}),
 T('1.56b','Stammfunktionen','∫ (∛(x²) + 5/x − 3/x²) dx','Achte beim Term 5/x auf die logarithmische Sonderregel.','inverse','Welcher Term benötigt den natürlichen Logarithmus?',
 ['5/x','∛(x²)','−3/x²'],0,'primitive','3*x^(5/3)/5+5*ln(x)+3/x',[
  'Für x > 0: ∛(x²) = x^(2/3) und −3/x² = −3x⁻².',
  '∫x^(2/3) dx = (3/5)x^(5/3).',
  '∫(5/x) dx = 5 ln|x|; ∫(−3x⁻²) dx = 3/x.',
  'F(x) = (3/5)x^(5/3) + 5 ln|x| + 3/x + C (x ≠ 0).'
 ],{integrand:'x^(2/3)+5/x-3/x^2',variable:'x'}),
 T('1.57a','Bestimmte Integrale','∫₀^π sin(t) dt','Berechne das Integral im Bogenmaß.','fundamental','Welche Stammfunktion gehört zu sin(t)?',
 ['−cos(t)','cos(t)','sin(t)'],0,'number','2',[
  'Eine Stammfunktion von sin(t) ist F(t) = −cos(t).',
  'Setze die Grenzen ein: F(π) − F(0).',
  '−cos(π) − (−cos(0)) = 1 + 1 = 2.',
  'Ergebnis: 2.'
 ]),
 T('1.57b','Bestimmte Integrale','∫₀^(2π) cos(x) dx','Berechne über eine ganze Periode.','fundamental','Was ist eine Stammfunktion von cos(x)?',
 ['sin(x)','−sin(x)','−cos(x)'],0,'number','0',[
  'F(x) = sin(x) ist eine Stammfunktion von cos(x).',
  'F(2π) − F(0) = sin(2π) − sin(0) = 0.',
  'Das Integral ist 0; positive und negative Beiträge heben sich auf.',
  'Achtung: 0 bedeutet nicht, dass die Fläche geometrisch 0 wäre.'
 ]),
 T('1.58a','Stammfunktionen','∫ 5·e^(2x) dx','Gesucht ist ein unbestimmtes Integral.','exponential','Was musst du wegen der inneren Ableitung 2 tun?',
 ['Den Vorfaktor 5 durch 2 teilen','Mit 2 multiplizieren','e^(2x) durch x² ersetzen'],0,'primitive','5*e^(2*x)/2',[
  'Bei ∫e^(kx) dx erhältst du e^(kx)/k.',
  'Hier ist k = 2 und der äußere Faktor lautet 5.',
  'F(x) = (5/2)e^(2x) + C.',
  'Ableitungscheck: (5/2)·2e^(2x) = 5e^(2x).'
 ],{integrand:'5*e^(2*x)',variable:'x'}),
 T('1.58b','Stammfunktionen','∫ sin(0,5t + π/2) dt','Nutze die Umkehrung der Kettenregel.','trig','Welche innere Ableitung musst du berücksichtigen?',
 ['0,5','π/2','2π'],0,'primitive','-2*cos(0.5*t+pi/2)',[
  'u(t) = 0,5t + π/2 hat die innere Ableitung u′(t) = 0,5.',
  '∫sin(u) dt = −cos(u)/0,5 + C.',
  'F(t) = −2cos(0,5t + π/2) + C.',
  'Gleichwertig: F(t) = 2sin(t/2) + C.'
 ],{integrand:'sin(0.5*t+pi/2)',variable:'t'}),
 T('1.66a','Flächen','f(x) = x² + 6x, −3 ≤ x ≤ 2','Berechne die geometrische Fläche zwischen Graph und x-Achse.','areaAxis','Welche Nullstelle liegt im Intervall [−3, 2]?',
 ['x = 0','x = −6','x = 3'],0,'number','98/3',[
  'Nullstellen: x(x+6)=0 ⇒ x=0 oder x=−6. Im Bereich liegt nur x=0.',
  'F(x) = x³/3 + 3x². Zwischen −3 und 0 liegt f unter der x-Achse.',
  'A₁ = |F(0) − F(−3)| = |0 − 18| = 18.',
  'A₂ = F(2) − F(0) = 44/3.',
  'Gesamtfläche: 18 + 44/3 = 98/3 ≈ 32,667 FE.'
 ]),
 T('1.67a','Flächen','f(x)=x²−3x−2; g(x)=3x−1','Bestimme den Flächeninhalt zwischen beiden Graphen.','areaBetween','Welche Gleichung liefert die Schnittpunkte?',
 ['x² − 6x − 1 = 0','x² − 1 = 0','x² − 3x − 2 = 0'],0,'number','40*sqrt(10)/3',[
  'Schnittpunkte: f(x)=g(x) ⇒ x²−6x−1=0.',
  'Mit der Lösungsformel: x₁=3−√10, x₂=3+√10.',
  'Zwischen den Schnittpunkten liegt g über f.',
  'A = ∫[3−√10, 3+√10] (g−f) dx = ∫(−x²+6x+1) dx.',
  'Ergebnis: A = (40√10)/3 ≈ 42,164 FE.'
 ]),
 T('1.98a','Bestimmte Integrale','∫₁⁴ (x² + 4x − 1) dx','Berechne das bestimmte Integral.','fundamental','Wie lautet eine Stammfunktion?',
 ['x³/3 + 2x² − x','2x + 4','x³ + 4x² − x'],0,'number','48',[
  'F(x) = x³/3 + 2x² − x.',
  'F(4) = 64/3 + 32 − 4 = 148/3.',
  'F(1) = 1/3 + 2 − 1 = 4/3.',
  'F(4) − F(1) = 144/3 = 48.'
 ]),
 T('1.98b','Bestimmte Integrale','∫₀¹ e^(2x) dx','Rechne mit der Exponentialfunktion.','fundamental','Welche Stammfunktion ist richtig?',
 ['(1/2)e^(2x)','2e^(2x)','e^(2x)'],0,'number','(e^2-1)/2',[
  'Die innere Ableitung von 2x ist 2.',
  'Deshalb F(x) = (1/2)e^(2x).',
  'F(1) − F(0) = (e²/2) − (1/2) = (e²−1)/2.',
  'Numerisch ≈ 3,195.'
 ]),
 T('1.98c','Bestimmte Integrale','∫₂⁵ ∛(x²) dx','Schreibe die dritte Wurzel als Potenz.','fundamental','Welche Stammfunktion passt zu x^(2/3)?',
 ['(3/5)x^(5/3)','(2/3)x^(−1/3)','(5/3)x^(2/3)'],0,'number','3*(5^(5/3)-2^(5/3))/5',[
  'Da x positiv ist: ∛(x²) = x^(2/3).',
  'Potenregel: F(x) = (3/5)x^(5/3).',
  'F(5)−F(2) = (3/5)(5^(5/3)−2^(5/3)).',
  'Numerisch ≈ 6,867.'
 ]),
 T('1.98d','Bestimmte Integrale','∫₀^(π/2) 3·sin(x) dx','Rechne mit dem Bogenmaß π/2.','fundamental','Welche Stammfunktion ist richtig?',
 ['−3cos(x)','3cos(x)','3sin(x)'],0,'number','3',[
  'Eine Stammfunktion ist F(x) = −3cos(x).',
  'F(π/2)−F(0) = −3·0 − (−3·1).',
  'Ergebnis: 3.'
 ]),
 T('1.100-1','Drohnenaufgabe','a(t)=0,0036t²−0,18t+2,25; v(0)=3 m/s','Bestimme die Geschwindigkeit-Zeit-Funktion v(t).','acceleration','Welche Integrationskonstante erfüllt v(0)=3?',
 ['C = 3','C = 0','C = 2,25'],0,'velocity','0.0012*t^3-0.09*t^2+2.25*t+3',[
  'Geschwindigkeit ist eine Stammfunktion der Beschleunigung: v′(t)=a(t).',
  'Integrieren liefert v(t)=0,0012t³−0,09t²+2,25t+C.',
  'Anfangsbedingung: v(0)=C=3 m/s.',
  'Daher v(t)=0,0012t³−0,09t²+2,25t+3 (m/s).'
 ],{integrand:'0.0036*t^2-0.18*t+2.25',variable:'t',atZero:3}),
 T('1.100-2','Drohnenaufgabe','v(t)=0,0012t³−0,09t²+2,25t+3','Wie schnell ist die Drohne nach 25 Sekunden?','speed','Was wird in die Geschwindigkeitsfunktion eingesetzt?',
 ['t = 25','t = 0','t = 200'],0,'number','21.75',[
  'Setze t=25 in v(t)=0,0012t³−0,09t²+2,25t+3 ein.',
  'v(25)=0,0012·15625−0,09·625+2,25·25+3.',
  'v(25)=18,75−56,25+56,25+3=21,75 m/s.'
 ],{unit:'m/s'}),
 T('1.100-3','Drohnenaufgabe','∫₀²⁵ a(t) dt','Interpretiere das Beschleunigungsintegral und berechne seinen Wert.','deltaV','Welche Größe beschreibt das Integral?',
 ['Die Geschwindigkeitsänderung Δv','Den zurückgelegten Weg s','Die gesamte Flugzeit'],0,'number','18.75',[
  'Die Fläche unter dem a(t)-Graphen mit Vorzeichen ergibt Δv = v(25)−v(0).',
  'Mit v(25)=21,75 m/s und v(0)=3 m/s folgt Δv=18,75 m/s.',
  'Die Drohne ist nach 25 s um 18,75 m/s schneller als zu Beginn.',
  'Einheit des Beschleunigungsintegrals: (m/s²)·s = m/s.'
 ],{unit:'m/s'}),
 T('1.100-4','Drohnenaufgabe','v(t)=0,0012t³−0,09t²+2,25t+3','Nach welcher Zeit hat die Drohne ab t=0 genau 200 m zurückgelegt?','displacement','Welche Gleichung musst du lösen?',
 ['0,0003t⁴−0,03t³+1,125t²+3t = 200','v(t) = 200','a(t) = 200'],0,'number','14.4098445789603',[
  'Weg ist das Integral der Geschwindigkeit: s(t)=∫₀ᵗv(u)du.',
  's(t)=0,0003t⁴−0,03t³+1,125t²+3t.',
  'Setze s(t)=200 m und löse die Gleichung numerisch.',
  'Im erlaubten Zeitbereich 0≤t≤25 erhältst du t≈14,41 s.',
  'Wichtig: Nicht v(t)=200 setzen; gefragt ist die Strecke, nicht die Geschwindigkeit.'
 ],{unit:'s',tolerance:0.055})
 ];
 window.MATHSVERSE_DATA={
  title:'MathsVerse',exam:'2. Hausübungswiederholung',date:'12.11.2026',version:1,
  groups:[
   {name:'Stammfunktionen',icon:'∫',description:'Potenregel, Wurzeln, ln|x|, e-Funktion und verketteter Sinus',rule:'∫xⁿ dx=xⁿ⁺¹/(n+1)+C (n≠−1). Für 1/x gilt ln|x|. Die innere Ableitung beim Integrieren ausgleichen.'},
   {name:'Bestimmte Integrale',icon:'∑',description:'Stammfunktion bilden, Grenzen einsetzen, Differenz auswerten',rule:'∫ₐᵇ f(x)dx=F(b)−F(a). Ein bestimmtes Integral kann auch 0 oder negativ sein.'},
   {name:'Flächen',icon:'▱',description:'Nullstellen, Schnittpunkte, Vorzeichen und Betragsflächen',rule:'Geometrische Flächen sind nicht negativ: Bei Vorzeichenwechseln aufteilen oder ∫|f(x)| berechnen.'},
   {name:'Drohnenaufgabe',icon:'🚁',description:'Von Beschleunigung über Geschwindigkeit zur Strecke',rule:'a(t)=v′(t), v(t)=s′(t). Anfangsbedingungen berücksichtigen; für die Strecke v integrieren.'}
  ],tasks
 };
})();
