/* Real exercises transcribed from the user-provided ZIP
 * "Buchbeispiele laut SchularbeitsStoff.zip", 23.11.2026.
 * Each exercise retains its original book number and screenshot provenance.
 * Explanations here are original, independently calculated study notes.
 */
(function(){
'use strict';
const R=[];
function B(no,category,prompt,solution,steps,expected,graph){
 const n=String(no);if(!prompt||!solution||!steps)throw Error('Incomplete book task '+n);
 const x={id:'book-'+n.replace(/[^a-z0-9]/gi,'-'),number:n,category,prompt,solution,steps,source:'Vom Nutzer bereitgestellte Mathe-Matik 4, Kapitel 1–2 (Buch-Screenshot-ZIP)'};
 if(expected!==undefined&&expected!==null)x.expected=expected;
 if(graph)x.graph=graph;
 R.push(x);
}
const A='Ableitungsregeln',I='Stammfunktionen',F='Flächen & Integrale',V='Volumen & Anwendungen',P='Partielle Ableitungen',K='Kurvendiskussion';
B('1.1a',A,'Ermittle die erste und zweite Ableitung von y = x⁵ + 3x² + 4.','y′ = 5x⁴ + 6x; y″ = 20x³ + 6.',
 'Potenzregel auf jedes Glied anwenden. Konstante 4 wird beim ersten Ableiten 0. Danach nochmals differenzieren.');
B('1.1b',A,'Ermittle die erste und zweite Ableitung von f(t) = √(t³) − ³√t.','f′(t) = (3/2)√t − (1/3)t⁻²ᐟ³; f″(t) = (3/4)t⁻¹ᐟ² + (2/9)t⁻⁵ᐟ³.',
 'Schreibe die Wurzeln als Potenzen: t³ᐟ² − t¹ᐟ³. Exponenten mit dem Vorfaktor multiplizieren und um 1 verringern.');
B('1.1c',A,'Ermittle erste und zweite Ableitung von f(x) = 2/x − 4/x² + x/2.','f′ = −2/x² + 8/x³ + 1/2; f″ = 4/x³ − 24/x⁴.',
 'Schreibe Brüche als x⁻¹ und x⁻²; wende die Potenzregel zweimal an.');
B('1.1d',A,'Ermittle die erste und zweite Ableitung von y = sin(x) + cos(x).','y′ = cos(x) − sin(x); y″ = −sin(x) − cos(x).',
 'Sinus wird zu Cosinus; Cosinus wird zu minus Sinus.');
B('1.2',A,'Kreuze die richtige Ableitung der Funktion f(x)=√(5x) an.','f′(x) = √5 / (2√x), für x>0.',
 'Schreibe √(5x)=√5·x¹ᐟ². Der Faktor √5 bleibt erhalten, die Potenzregel gibt ½x⁻¹ᐟ².');
B('1.3',A,'Ein Schüler leitet f(x)=x²·sin(x) als 2x·cos(x) ab. Erkläre die falsche Regel und korrigiere.','f′(x)=2x·sin(x)+x²·cos(x).',
 'Für ein Produkt aus zwei veränderlichen Funktionen gilt (uv)′=u′v+uv′. Beides nur einzeln abzuleiten und zu multiplizieren ist falsch.');
B('1.4a',A,'Ermittle die erste Ableitung von f(x)=x·sin(x).','f′(x)=sin(x)+x·cos(x).','Produktregel mit u=x und v=sin(x).');
B('1.4b',A,'Ermittle die erste Ableitung von f(t)=t²·eᵗ.','f′(t)=2t·eᵗ+t²·eᵗ.','Produktregel, wobei (eᵗ)′=eᵗ.');
B('1.4c',A,'Ermittle die erste Ableitung von f(x)=x³·cos(x).','f′(x)=3x²·cos(x)−x³·sin(x).','Produktregel und (cos x)′=−sin x.');
B('1.4d',A,'Ermittle die erste Ableitung von f(x)=4x·ln(x).','f′(x)=4ln(x)+4, x>0.','Produktregel mit u=4x, v=ln x und v′=1/x.');
B('1.6a',A,'Ermittle die Ableitung von f(x)=(2x³−5x)⁶.','f′(x)=6(2x³−5x)⁵(6x²−5).','Kettenregel: äußere Potenz ableiten, dann mit innerer Ableitung multiplizieren.');
B('1.6b',A,'Ermittle die Ableitung von f(t)=4·sin(0,5t).','f′(t)=2·cos(0,5t).','Äußere Ableitung von sin ist cos; innere Ableitung von 0,5t ist 0,5.');
B('1.6d',A,'Ermittle die Ableitung von y=ln(5−3x).','y′=−3/(5−3x).','Kettenregel für ln(g): g′/g, hier g′=−3.');
B('1.7a',A,'Ermittle die Ableitung von f(x)=e^(0,5x)·cos(2x).','f′(x)=e^(0,5x)·(0,5cos(2x)−2sin(2x)).','Produktregel; außerdem zweimal die Kettenregel verwenden.');
B('1.7b',A,'Ermittle die Ableitung von f(t)=t²·ln(5t).','f′(t)=2t·ln(5t)+t.','Produktregel. Die Ableitung von ln(5t) ist 1/t.');
B('1.9a',A,'Die physikalische Leistung ist P=U²/R. Bestimme dP/dU und dP/dR.','∂P/∂U=2U/R; ∂P/∂R=−U²/R².',
 'Bei jeder partiellen Ableitung bleibt die jeweils andere Variable konstant.');
B('1.10a',K,'f(x)=0,5x³, x₀=2, k=3. Gib die Steigung und den Steigungswinkel an x₀ an. Ermittle alle Stellen mit Steigung k.','f′(x)=1,5x²; f′(2)=6; α=arctan(6)≈80,54°. Für f′(x)=3 gilt x=±√2.',
 'Ableiten, x₀ einsetzen, Steigungswinkel als arctan(m) berechnen. Dann 1,5x²=3 lösen.',6);
B('1.10b',K,'f(x)=sin(x), x₀=π, k=0. Gib Steigung und Steigungswinkel bei x₀ an; finde Stellen mit Steigung k.','f′(x)=cos x; f′(π)=−1; α=−45°. cos x=0 bei x=π/2+nπ.',
 'Sinus ableiten. Bei π ist der Cosinus −1. Für die Nullstellen von cos x die Periode beachten.',-1);
B('1.12a',K,'Das Weg-Zeit-Diagramm zeigt (0|0), (3|50), (5|50), (8|0). Ermittle die Geschwindigkeit in jedem der drei Abschnitte.','Abschnitt 1: 50/3≈16,67 km/h; Abschnitt 2: 0 km/h; Abschnitt 3: −50/3≈−16,67 km/h.',
 'Geschwindigkeit = ΔWeg/ΔZeit. Positive Steigung bedeutet Entfernung nimmt zu, Null bedeutet unveränderte Entfernung, negative Steigung bedeutet Rückfahrt.',
 null,{curves:[{label:'s(t)',points:[[0,0],[3,50],[5,50],[8,0]]}],x:[0,8],y:[-5,60]});
B('1.14',K,'Diskutiere f(x)=0,2x³−x² und bestimme die Wendetangente.','f′=0,6x²−2x; f″=1,2x−2. Wendestelle x=5/3; Wendepunkt (5/3|−50/27); Steigung m=−5/3. Wendetangente y=−5x/3+25/27.',
 'Für Wendestellen f″=0 setzen; x in f und f′ einsetzen. Wendetangente y=f′(xW)(x−xW)+f(xW).',
 null,{curves:[{label:'f',poly:[0.2,-1,0,0]}],x:[-1,5],y:[-4,3]});
B('1.17',K,'Eine Körpertemperatur wird beschrieben durch T(t)=−0,16t³+0,82t²+0,8t+36,5 mit 0≤t≤6. Bestimme die maximale Körpertemperatur und wann sie auftritt.','T′(t)=−0,48t²+1,64t+0,8. Maximum im Intervall bei t≈3,85 h, mit T≈42,60 °C (gerundet).',
 'Ableitung gleich Null setzen. Positive kritische Stelle und beide Intervallenden prüfen, dann T einsetzen.');
B('1.18a',K,'Die Firma hat Fixkosten 1200 GE und Erlös E(x)=−4x²+450x. Stelle die Gewinnfunktion auf.','G(x)=E(x)−1200=−4x²+450x−1200.',
 'Gewinn ist Erlös minus Kosten. Die Fixkosten sind unabhängig von x.');
B('1.19a',K,'Ein Ball folgt h(t)=−5t²+10t+7 (h in m, t in s). Bestimme seine Abwurfhöhe.','h(0)=7 m.','Abwurfzeit t=0 einsetzen.',7);
B('1.19b',K,'Der Ball hat h(t)=−5t²+10t+7. Wann erreicht er seine maximale Höhe?','t=1 s; Höhe h(1)=12 m.',
 'Scheitel einer quadratischen Funktion: h′=−10t+10=0 ⇒ t=1. Zweite Ableitung negativ.',1);
B('1.21',K,'Ein kubisches Polynom hat E(2|4) als Extrempunkt und W(−1|0) als Wendepunkt. Bestimme seine Funktionsgleichung.','f(x)=a x³+b x²+c x+d; Bedingungen f(2)=4, f′(2)=0, f(−1)=0, f″(−1)=0. Daraus folgt f(x)=−2x³/27−2x²/9+16x/9+52/27.',
 'Vier Bedingungen für die vier Koeffizienten aufstellen und ein lineares Gleichungssystem lösen.');
B('1.28',K,'Zerlege 40 in zwei natürliche Summanden, sodass die Summe ihrer Quadrate minimal ist.','20 und 20; Minimalwert 20²+20²=800.',
 'Sei x der erste Teil und 40−x der zweite. S(x)=x²+(40−x)². S′=4x−80=0 ⇒ x=20.',20);
B('1.29',V,'Eine zylindrische Dose soll Volumen 75 cm³ besitzen. Bei welcher Abmessung wird die Materialoberfläche minimal? Boden und Deckel haben zusammen 25 % mehr Materialbedarf.','Mit r als Radius: h=75/(πr²). Materialmodell A(r)=2,5πr²+2πrh. Minimum aus A′(r)=0 bestimmen.',
 'Zylinder: V=πr²h. Materialfläche entsprechend Aufgabenstellung mit Aufschlag für Boden und Deckel aufstellen. Die Nebenbedingung eliminiert h.');
B('1.30',V,'Aus 144 cm Draht entsteht das Kantenmodell eines Quaders mit quadratischer Grundfläche. Berechne die Abmessungen für maximales Volumen.','Grundkante 12 cm, Höhe 12 cm; Volumen 1728 cm³.',
 'Drahtlänge 8a+4h=144 ⇒ h=36−2a. V=a²(36−2a). V′=72a−6a²=0 liefert a=12, h=12.',12);
B('1.31',K,'Ein Bauer hat 50 m² Wiese. Eine Ziege gibt jährlich 800 l Milch; jede zusätzliche Ziege senkt die Jahresproduktion pro Ziege um 10 l. Wie viele Ziegen geben insgesamt die größte Milchmenge?','40 Ziegen, Milchmenge 16 000 l.',
 'M(n)=n(800−10n). Die Parabel ist nach unten geöffnet; Scheitel bei n=800/(20)=40.',40);
B('1.55a',I,'Berechne ∫(4x²−3x+1) dx.','F(x)=4x³/3−3x²/2+x+C.',
 'Potenzregel rückwärts auf alle Summanden anwenden. Jede Stammfunktion hat +C.');
B('1.55b',I,'Berechne ∫(a·t+b) dt (a,b sind Konstanten).','F(t)=a·t²/2+b·t+C.',
 'Konstante Faktoren stehen lassen; t bekommt beim Integrieren Exponent 2.');
B('1.55c',I,'Berechne ∫(2sin(x)+3eˣ+x/2) dx.','F(x)=−2cos(x)+3eˣ+x²/4+C.',
 'Sinus wird zu −Cosinus; eˣ bleibt eˣ; Potenzregel bei x/2.');
B('1.57a',F,'Berechne das bestimmte Integral ∫₀^π sin(t) dt.','[−cos(t)]₀^π=−(−1)−(−1)=2.',
 'Stammfunktion −cos t. Obere Grenze minus untere Grenze einsetzen.',2);
B('1.57b',F,'Berechne ∫₀^(2π) cos(x) dx.','[sin(x)]₀^(2π)=0.',
 'Nach einer ganzen Periode heben sich positive und negative orientierte Flächen auf.',0);
B('1.57c',F,'Berechne ∫₁⁴ √t dt.','[2t^(3/2)/3]₁⁴ = (2/3)(8−1)=14/3≈4,6667.',
 'Wurzel als t^(1/2) schreiben, integrieren und Grenzen einsetzen.',14/3);
B('1.58a',I,'Berechne ∫5e^(2x) dx.','F(x)=(5/2)e^(2x)+C.',
 'Bei e^(kx) durch die innere Ableitung k teilen, hier 2.');
B('1.58b',I,'Berechne ∫sin(0,5t+π/3) dt.','F(t)=−2cos(0,5t+π/3)+C.',
 'Cosinus wird zu Sinus beim Ableiten; wegen innerer Steigung 0,5 beim Integrieren durch 0,5 teilen.');
B('1.58c',I,'Berechne ∫1/(1−x) dx.','F(x)=−ln|1−x|+C.',
 'Substitution u=1−x, du=−dx. Minuszeichen nicht vergessen.');
B('1.59a',I,'Berechne ∫2/(x+4) dx.','F(x)=2ln|x+4|+C.',
 'Die Logarithmus-Stammfunktion ∫1/u du=ln|u| nutzen.');
B('1.59b',I,'Berechne ∫2e^(2−x) dx.','F(x)=−2e^(2−x)+C.',
 'Innere Ableitung von 2−x ist −1, daher Vorzeichenwechsel.');
B('1.59c',I,'Berechne ∫cos(5t+π) dt.','F(t)=(1/5)sin(5t+π)+C.',
 'Sinus ist Stammfunktion von Cosinus; durch den Faktor 5 der inneren Funktion teilen.');
B('1.60a',F,'Berechne ∫₀³ 4/(x−6) dx.','4[ln|x−6|]₀³ = 4ln(3/6)=−4ln2≈−2,7726.',
 'Logarithmus integrieren; die negative Fläche ist als orientiertes Integral negativ.',-4*Math.log(2));
B('1.60b',F,'Berechne ∫₀² sin((π/2)t−π) dt.','[−2/π·cos((π/2)t−π)]₀²=−4/π≈−1,2732.',
 'Sinus integrieren und durch π/2 teilen, dann t=2 und t=0 einsetzen.',-4/Math.PI);
B('1.60c',F,'Berechne ∫₀^(π/2) cos(x−π) dx.','[sin(x−π)]₀^(π/2)=−1.',
 'Cosinus integrieren, dann obere minus untere Grenze.',-1);
B('1.61b',I,'Berechne ∫x/(x²+1) dx.','F(x)=(1/2)ln(x²+1)+C.',
 'Substitution u=x²+1; du=2x dx. Der Faktor 1/2 gleicht die innere Ableitung aus.');
B('1.62a',I,'Berechne ∫t·cos(t) dt.','F(t)=t·sin(t)+cos(t)+C.',
 'Partielle Integration mit u=t, dv=cos(t)dt: uv−∫vdu.');
B('1.62b',I,'Berechne ∫x·e^(−x) dx.','F(x)=−(x+1)e^(−x)+C.',
 'Partielle Integration: u=x, dv=e^(−x)dx; v=−e^(−x).');
B('1.62c',I,'Berechne ∫x²·ln(x) dx (x>0).','F(x)=x³ln(x)/3−x³/9+C.',
 'Partielle Integration: u=ln x, dv=x²dx, dadurch du=1/x dx und v=x³/3.');
B('1.63a',I,'Berechne ∫x/(x+1) dx.','F(x)=x−ln|x+1|+C.',
 'Bruch umformen: x/(x+1)=1−1/(x+1), dann getrennt integrieren.');
B('1.63b',I,'Berechne ∫x²/(x+1) dx.','F(x)=x²/2−x+ln|x+1|+C.',
 'Polynomdivision: x²/(x+1)=x−1+1/(x+1).');
B('1.66a',F,'Berechne den tatsächlichen Flächeninhalt zwischen f(x)=x²+6x und der x-Achse für a=−3, b=2.','A=98/3≈32,667 Flächeneinheiten.',
 'Nullstellen x=−6 und x=0; im Intervall nur 0. F=x³/3+3x². Fläche = |F(0)−F(−3)|+|F(2)−F(0)| =18+44/3 =98/3.',98/3,
 {curves:[{poly:[1,6,0],label:'f(x)'}],area:{a:-3,b:2},x:[-4,3],y:[-10,18]});
B('1.66b',F,'Berechne den Flächeninhalt zwischen f(x)=−3x³+4x² und der x-Achse für a=−1,5, b=1.','A≈8,8802 Flächeneinheiten.',
 'f=x²(4−3x) ist im gesamten Intervall nichtnegativ. F=−3x⁴/4+4x³/3. A=F(1)−F(−1,5)≈8,8802.',8.8802083333,
 {curves:[{poly:[-3,4,0,0],label:'f(x)'}],area:{a:-1.5,b:1},x:[-2,1.6],y:[-4,18]});
B('1.66c',F,'Berechne den Flächeninhalt zwischen f(x)=x²−3x+2 und der x-Achse auf [0;3].','A=11/6≈1,8333 Flächeneinheiten.',
 'Nullstellen 1 und 2. F=x³/3−1,5x²+2x. In [1;2] ist der Graph unter der Achse. Beträge der drei Teilintegrale: 5/6+1/6+5/6.',11/6,
 {curves:[{poly:[1,-3,2],label:'f(x)'}],area:{a:0,b:3},x:[-.3,3.3],y:[-1,2.5]});
B('1.66d',F,'Berechne die Fläche unter f(x)=√x+3 auf dem Intervall [1;4].','A=41/3≈13,6667 Flächeneinheiten.',
 'F(x)=(2/3)x^(3/2)+3x; A=F(4)−F(1)=14/3+9=41/3.',41/3);
B('1.67a',F,'Berechne die Fläche zwischen f(x)=x²−3x−2 und g(x)=3x−1.','A=40√10/3≈42,1637 Flächeneinheiten.',
 'Schnittpunkte: x²−6x−1=0 ⇒ x=3±√10. Zwischen den Schnittpunkten liegt g über f. Integriere ∫(g−f)dx =∫(−x²+6x+1)dx.',40*Math.sqrt(10)/3,
 {curves:[{poly:[1,-3,-2],label:'f'},{poly:[3,-1],label:'g'}],area:{a:3-Math.sqrt(10),b:3+Math.sqrt(10),between:true},x:[-.5,7],y:[-8,31]});
B('1.67b',F,'Berechne die Fläche zwischen f(x)=x²+5x−1 und g(x)=2x+3.','A=125/6≈20,8333 Flächeneinheiten.',
 'Schnittpunkte über f=g: x=−4 und x=1. g liegt dazwischen über f. ∫₋₄¹(g−f)dx=125/6.',125/6);
B('1.67c',F,'Berechne die Fläche zwischen f(x)=−x²−4x+2 und g(x)=x²−x+3.','A=1/24≈0,04167 Flächeneinheiten.',
 'Schnittpunkte von f=g: x=−1 und x=−0,5. Die Differenz f−g=−2x²−3x−1 ist dazwischen positiv.',1/24);
B('1.70a',F,'Berechne den Flächeninhalt zwischen f(x)=5/(6x−3) und der x-Achse auf [1;6].','A=(5/6)ln(11)≈1,9982 Flächeneinheiten.',
 'Stammfunktion F=(5/6)ln|6x−3|. Das Intervall ist positiv, daher A=F(6)−F(1).',(5/6)*Math.log(11));
B('1.71a',K,'Von f ist f′(x)=x²−4x bekannt. Der Graph schneidet die y-Achse bei 4. Bestimme f(x).','f(x)=x³/3−2x²+4.',
 'Rückwärts integrieren: F=x³/3−2x²+C. Da f(0)=4, folgt C=4.');
B('1.72a',V,'Ein Auto hat im Leerlauf die Geschwindigkeit v(t)=10e^(−0,04t), wobei t in Sekunden und v in m/s gemessen wird. Bestimme v(0).','v(0)=10 m/s.',
 't=0 einsetzen, e⁰=1.',10);
B('1.72b',V,'Berechne den in den ersten 2 Minuten zurückgelegten Weg zu v(t)=10e^(−0,04t) m/s.','s=250(1−e^(−4,8))≈247,94 m.',
 '2 Minuten sind 120 Sekunden. s=∫₀¹²⁰ 10e^(−0,04t)dt. Stammfunktion −250e^(−0,04t).',250*(1-Math.exp(-4.8)));
B('1.75a',V,'Beschleunigung eines Autos: a(t)=(30t−t²)/225 für 0≤t≤30 (m/s²). Ermittle die Geschwindigkeitsfunktion v bei v(0)=0.','v(t)=t²/15−t³/675.',
 'Beschleunigung integrieren: ∫(30t−t²)/225 dt =t²/15−t³/675+C. Wegen v(0)=0 ist C=0.');
B('1.89a',A,'Bestimme die ersten beiden Ableitungen von f(x)=3x²−7x+5/x.','f′=6x−7−5/x²; f″=6+10/x³.',
 '5/x=5x⁻¹ schreiben und zweimal die Potenzregel anwenden.');
B('1.93a',K,'Die Steigung von y=x²+a·x+2 an x₀=−1 ist k=3. Bestimme a.','a=5.',
 'f′=2x+a. Bei x=−1 ist f′=−2+a=3 ⇒ a=5.',5);
B('1.93b',K,'Die Steigung von y=4x³−a·x²+x an x₀=2 ist k=−1. Bestimme a.','a=25/2=12,5.',
 'f′(x)=12x²−2ax+1. Bei x=2 ergibt 49−4a=−1 ⇒ a=12,5.',12.5);
B('1.98a',F,'Berechne ∫₀⁴(x²+4x−1)dx.','Achtung: bestimmtes, orientiertes Integral =148/3≈49,3333.',
 'Stammfunktion x³/3+2x²−x. F(4)−F(0)=64/3+32−4=148/3.',148/3);
B('1.98b',F,'Berechne ∫₀¹ e^(2x) dx.','(e²−1)/2≈3,1945.',
 'Eine Stammfunktion ist ½e^(2x). Bei 1 und 0 einsetzen.',(Math.exp(2)-1)/2);
B('1.98c',F,'Berechne ∫₂⁵ √(x³) dx.','(2/5)(5^(5/2)−2^(5/2))≈20,098.',
 'Schreibe √(x³)=x^(3/2), Stammfunktion 2x^(5/2)/5.',(2/5)*(Math.pow(5,2.5)-Math.pow(2,2.5)));
B('1.98d',F,'Berechne ∫₀^(π/2) 3sin(x)dx.','Ergebnis =3.',
 'Stammfunktion −3cos x. Obere minus untere Grenze: −3cos(π/2)+3cos 0=3.',3);
B('1.100a',V,'Eine Drohne wird durch a(t)=0,0036t²−0,18t+2,25 auf [0;25] beschleunigt. Anfangsgeschwindigkeit v(0)=3 m/s. Bestimme v(t).','v(t)=0,0012t³−0,09t²+2,25t+3.',
 'Beschleunigung integrieren und C=v(0)=3 setzen.');
B('2.24a',P,'Gegeben z=4x−3y+6. Bestimme zₓ, zᵧ und zₓₓ, zᵧᵧ.','zₓ=4, zᵧ=−3; zₓₓ=0, zᵧᵧ=0.',
 'Beim Ableiten nach x ist y konstant, beim Ableiten nach y ist x konstant. Konstante Ableitungen werden beim zweiten Ableiten 0.');
B('2.24b',P,'Gegeben z=−2x²+4y³+6xy. Bestimme die beiden partiellen Ableitungen und die zweiten Ableitungen.','zₓ=−4x+6y; zᵧ=12y²+6x; zₓₓ=−4; zᵧᵧ=24y.',
 'Variable, nach der nicht abgeleitet wird, konstant halten.');
B('2.24c',P,'Gegeben z=5xy+3y⁴−6x²y². Ermittle zₓ und zᵧ.','zₓ=5y−12xy²; zᵧ=5x+12y³−12x²y.',
 'Gemischte Produkte gliedweise partiell differenzieren.');
B('2.26a',P,'Gegeben z=cos(x+y³). Bestimme zₓ und zᵧ.','zₓ=−sin(x+y³); zᵧ=−3y² sin(x+y³).',
 'Kettenregel: äußere Ableitung von Cosinus =−Sinus. Innere Ableitung nach x ist 1, nach y ist 3y².');
B('2.27a',P,'Gegeben z=3e^(−2x)·sin(3x+y). Bestimme zₓ und zᵧ.','zₓ=3e^(−2x)(−2sin(3x+y)+3cos(3x+y)); zᵧ=3e^(−2x)cos(3x+y).',
 'Nach x Produkt- und Kettenregel kombinieren; nach y ist e^(−2x) konstant.');
B('2.28a',P,'Gegeben E(v,m)=mgh+(m·v²)/2. Berechne ∂E/∂v und ∂E/∂m.','Eᵥ=m·v; Eₘ=gh+v²/2.',
 'Bei Eᵥ m, g, h konstant halten; bei Eₘ v, g, h konstant halten.');
B('2.29a',P,'Gegeben z=x²+y²−5. Stelle die Fläche als Paraboloid dar und bestimme die z-Achsenhöhe.','Paraboloid mit Scheitel (0|0|−5).',
 'z hängt von x²+y² ab. Beide quadratischen Terme sind positiv; Minimum bei x=y=0.');
B('2.30a',P,'Bestimme die Tangentialebene von z=4x²+3y² im Punkt P(1|3|z₀).','z₀=31, zₓ(1,3)=8, zᵧ(1,3)=18. Ebene: z=31+8(x−1)+18(y−3).',
 'Tangentialebene: z=z₀+fₓ(P)(x−x₀)+fᵧ(P)(y−y₀). Erst die Koordinaten und partiellen Ableitungen einsetzen.');
B('2.31a',P,'Tangentialebene von z=√(100−x²−y²) im Punkt P(2|4|z₀).','z₀=√80=4√5. zₓ=−x/√(100−x²−y²), zᵧ=−y/√(...); Ebene z=√80−(2/√80)(x−2)−(4/√80)(y−4).',
 'Für die Wurzelfunktion Kettenregel verwenden, dann in die allgemeine Tangentialebene einsetzen.');
B('2.34a',P,'Bestimme die zweiten partiellen Ableitungen nach x und y von z=x³+2y²−5.','zₓₓ=6x; zᵧᵧ=4.',
 'Zuerst zₓ=3x² und zᵧ=4y bilden, dann jeweils erneut ableiten.');
B('2.34b',P,'Bestimme zₓₓ und zᵧᵧ von z=4x²y³+5x⁴y²+3x.','zₓₓ=8y³+60x²y²; zᵧᵧ=24x²y+10x⁴.',
 'Jeweils nach derselben Variablen zweimal ableiten.');
B('2.34c',P,'Bestimme zₓₓ und zᵧᵧ von z=−x²+7xy³+5x.','zₓₓ=−2; zᵧᵧ=42xy.',
 'zₓ=−2x+7y³+5; zᵧ=21xy². Nochmals nach der entsprechenden Variablen ableiten.');
B('2.35a',P,'Gegeben z=sin(x²y). Bestimme zₓₓ und zᵧᵧ.','zₓₓ=2ycos(x²y)−4x²y²sin(x²y); zᵧᵧ=−x⁴sin(x²y).',
 'Bei zₓ=2xycos(x²y) nochmals Produkt- und Kettenregel; bei zᵧ=x²cos(x²y) nochmals Kettenregel.');
B('2.38a',P,'Gegeben z=xy⁴+3x²−5x im Punkt P(−2|3|z₀). Ermittle zₓ und zᵧ am Punkt.','zₓ=y⁴+6x−5 ⇒ zₓ(P)=64; zᵧ=4xy³ ⇒ zᵧ(P)=−216.',
 'Für zₓ y konstant halten; für zᵧ x konstant halten. Zuletzt x=−2, y=3 einsetzen.');

/* Further exact subparts from the first screenshot (teacher's handwritten portion 1.1–1.9). */
B('1.5a',A,'Ermittle f′(x) für f(x)=(x²−3x)/(x⁴+1).',
 'f′(x)=[(2x−3)(x⁴+1)−4x³(x²−3x)]/(x⁴+1)².',
 'Quotientenregel (u/v)′=(u′v−uv′)/v² mit u=x²−3x und v=x⁴+1.');
B('1.5b',A,'Ermittle f′(t) für f(t)=eᵗ/(t+1).',
 'f′(t)=t·eᵗ/(t+1)².',
 'Quotientenregel: [eᵗ(t+1)−eᵗ]/(t+1)², dann eᵗ ausklammern.');
B('1.5c',A,'Ermittle f′(x) für f(x)=2x/cos(x).',
 'f′(x)=[2cos(x)+2xsin(x)]/cos²(x).',
 'Bei u=2x und v=cos(x) erhältst du u′=2, v′=−sin(x). Im Zähler ist minus mal minus plus.');
B('1.5d',A,'Ermittle f′(x) für f(x)=sin(x)/x².',
 'f′(x)=[xcos(x)−2sin(x)]/x³, x≠0.',
 'Quotientenregel ergibt [x²cos(x)−2xsin(x)]/x⁴. Kürze einen Faktor x.');
B('1.6c',A,'Ermittle f′(x) für f(x)=³√(x³+2x).',
 'f′(x)=(3x²+2)/[3(x³+2x)^(2/3)] an Stellen mit x³+2x≠0.',
 'Schreibe die dritte Wurzel als Potenz 1/3 und wende die Kettenregel mit innerer Ableitung 3x²+2 an.');
B('1.7c',A,'Ermittle f′(x) für f(x)=2sin(4x)/x³.',
 'f′(x)=8cos(4x)/x³−6sin(4x)/x⁴.',
 'Schreibe f=2sin(4x)·x⁻³. Produktregel und Kettenregel liefern die beiden Summanden.');
B('1.7d',A,'Ermittle die Ableitung von y=e^(−0,2x)/(0,3x).',
 'y′=e^(−0,2x)·[−2/(3x)−10/(3x²)].',
 'Zuerst durch 0,3 dividieren. Produktregel für e^(−0,2x)·x⁻¹; innere Ableitung −0,2 beachten.');
B('1.8-1',A,'Ermittle y′(t), wenn y(t)=a·e^(λ₁t)+b·e^(λ₂t), alle Parameter außer t konstant.',
 'y′(t)=aλ₁e^(λ₁t)+bλ₂e^(λ₂t).',
 'Jede Exponentialfunktion separat ableiten. Die Konstante λ wird wegen der Kettenregel als Faktor übernommen.');
B('1.8-2',A,'Ermittle y′(t), wenn y(t)=(a+b·t)e^(λt).',
 'y′(t)=e^(λt)[b+λ(a+bt)].',
 'Produktregel, wobei (a+bt)′=b und (e^(λt))′=λe^(λt).');
B('1.8-3',A,'Ermittle y′(t) für y(t)=a·e^(αt)sin(ωt)+b·e^(αt)cos(ωt).',
 'y′(t)=e^(αt)[(αa−ωb)sin(ωt)+(ωa+αb)cos(ωt)].',
 'Beide Produkte ableiten, danach gemeinsamen Faktor e^(αt) ausklammern.');
B('1.8-4',A,'Ermittle y′(t) für y(t)=a·sin(ωt)−b·t·cos(ωt).',
 'y′(t)=(aω−b)cos(ωt)+bωt·sin(ωt).',
 'Für b·t·cos(ωt) die Produktregel verwenden, danach Minuszeichen verteilen.');
B('1.9b',A,'Gegeben z=a(1+bc)³. Bestimme ∂z/∂a und ∂z/∂b.',
 'zₐ=(1+bc)³; zᵦ=3ac(1+bc)².',
 'Bei der ersten Ableitung b und c als Konstanten behandeln. Für die zweite Kettenregel mit innerer Ableitung c.');
B('1.9c',A,'Gegeben v=−ωcos(ωt−φ). Bestimme ∂v/∂t und ∂v/∂ω.',
 'vₜ=ω²sin(ωt−φ); v_ω=−cos(ωt−φ)+ωt·sin(ωt−φ).',
 'Nach t ist ω konstant. Nach ω musst du das Produkt −ω·cos(ωt−φ) mit Produkt- und Kettenregel ableiten.');
B('1.9d',A,'Gegeben η=(T₂−T₁)/T₁. Bestimme ∂η/∂T₁ und ∂η/∂T₂.',
 'η_T₁=−T₂/T₁²; η_T₂=1/T₁.',
 'Schreibe zuerst η=T₂/T₁−1. Bei jeder partiellen Ableitung bleibt die andere Temperatur konstant.');
B('1.56a',I,'Berechne ∫(−5x²+3/2−√x)dx.',
 'F(x)=−5x³/3+3x/2−2x^(3/2)/3+C.',
 'Die Wurzel ist x^(1/2). Potenzregel rückwärts für alle drei Summanden.');
B('1.61a',I,'Berechne ∫3x·e^(2x)dx mittels partieller Integration.',
 'F(x)=(3/2)x·e^(2x)−(3/4)e^(2x)+C.',
 'u=3x und dv=e^(2x)dx; damit du=3dx und v=e^(2x)/2. Verwende ∫u dv=uv−∫vdu.');
B('1.68a',F,'Die grafisch markierte Fläche wird von der x-Achse und der Geraden durch (0|3) und (6|0) begrenzt. Bestimme den Flächeninhalt.',
 'A=9 Flächeneinheiten. Gerade f(x)=3−x/2, Fläche =∫₀⁶(3−x/2)dx =9.',
 'Alternativ: rechtwinkliges Dreieck mit Grundseite 6 und Höhe 3 ⇒ ½·6·3=9.',9,
 {curves:[{label:'f',points:[[0,3],[6,0]]}],area:{a:0,b:6},x:[0,7],y:[-1,4]});
B('1.68b',F,'Die grafisch markierte Fläche hat die Eckpunkte (0|0),(2|4),(4|4),(5|0). Berechne den Flächeninhalt.',
 'A=14 Flächeneinheiten.',
 'Zerlege in ein linkes Dreieck (4), ein Rechteck (8) und rechtes Dreieck (2). Summe 14.',14,
 {curves:[{label:'f',points:[[0,0],[2,4],[4,4],[5,0]]}],area:{a:0,b:5},x:[-.5,5.7],y:[-1,5]});
B('1.69a',F,'Stelle eine Integralformel für die blau markierte Fläche zwischen einer steigenden Funktion f, x=0, x=a und der Höhe y=f(a) auf.',
 'A=∫₀ᵃ[f(a)−f(x)]dx=a·f(a)−∫₀ᵃf(x)dx.',
 'Die markierte Fläche ist Rechteck minus Fläche unter f.');
B('1.69b',F,'Die blau markierte Fläche liegt im Rechteck von x=a bis x=b über einer positiven Funktion f und unter y=c. Stelle eine Integralformel auf.',
 'A=∫ₐᵇ[c−f(x)]dx.',
 'Obere Begrenzungsfunktion minus untere Begrenzungsfunktion integrieren.');


/* Graph interpretation, optimization and context exercises transcribed from the ZIP. */
B('1.11a',K,'Zeichne den Graphen von f′ zu einer stückweise linearen Funktion f durch (0|0),(2|3),(3,5|3),(5|0),(7|0),(9|2).',
 'f′ ist stückweise konstant: 1,5 auf (0;2), 0 auf (2;3,5), −2 auf (3,5;5), 0 auf (5;7), 1 auf (7;9). An den Knicken existiert keine eindeutige Ableitung.',
 'Die Ableitung entspricht den Steigungen der fünf Geradenabschnitte. An echten Knickstellen ist sie nicht definiert.',
 null,{curves:[{label:'f',points:[[0,0],[2,3],[3.5,3],[5,0],[7,0],[9,2]]}],x:[-0.5,9.5],y:[-0.5,4]});
B('1.11b',K,'Der Graph von f ist eine Parabel mit Nullstellen 1 und 3 sowie Scheitel (2|−1). Skizziere den Graphen ihrer Ableitung.',
 'f(x)=(x−2)²−1 ⇒ f′(x)=2x−4, eine Gerade mit Nullstelle bei x=2.',
 'Die Ableitung einer quadratischen Funktion ist eine Gerade. Links des Scheitels negativ, rechts positiv.',
 null,{curves:[{label:'f',poly:[1,-4,3]}],x:[-.2,4.3],y:[-2,5]});
B('1.13',K,'Eine Geschwindigkeits-Zeit-Funktion steigt linear von (0|0) bis (3|6), verläuft bis (5|6) konstant und steigt dann bis (8|10). Wie groß ist die Beschleunigung im Intervall ]3;5[?',
 'a=0 m/s². Die Geschwindigkeit ist dort konstant.',
 'Beschleunigung ist die Steigung des v-t-Diagramms. Ein waagrechter Abschnitt hat Steigung 0.',0,
 {curves:[{label:'v(t)',points:[[0,0],[3,6],[5,6],[8,10]]}],x:[0,8],y:[0,11]});
B('1.15a',K,'Führe eine Kurvendiskussion für f(x)=x⁵−4x durch (Nullstellen, Extrema, Verhalten).',
 'f′=5x⁴−4; kritische Stellen x=±(4/5)^(1/4). f″=20x³: am negativen x lokales Maximum, am positiven x lokales Minimum. Nullstellen: x=0 und x=±√2.',
 'Mit f= x(x⁴−4) Nullstellen bestimmen. Für Extrema f′=0 und f″ untersuchen. Wegen ungeradem Grad fallen/steigen die Enden unterschiedlich.');
B('1.15b',K,'Diskutiere f(x)=½(x³−5x²+2x−5). Bestimme die beiden ersten Ableitungen und die Kandidaten für Extremstellen.',
 'f′=½(3x²−10x+2); f″=3x−5. Kritische Stellen x=(5±√19)/3.',
 'Ableiten, dann 3x²−10x+2=0 lösen. Zweite Ableitung zur Klassifizierung einsetzen.');
B('1.15c',K,'Diskutiere f(x)=⅓x⁴−2x²: Extremwerte und Wendestellen.',
 'f′=(4/3)x³−4x; f″=4x²−4. Hochpunkt (0|0), Tiefpunkte (±√3|−3); Wendestellen x=±1.',
 'Kritische x-Werte aus (4/3)x(x²−3)=0, Wendestellen aus 4(x²−1)=0. Krümmungswechsel prüfen.',
 null,{curves:[{label:'f',poly:[1/3,0,-2,0,0]}],x:[-3,3],y:[-4,7]});
B('1.16',K,'Diskutiere f(x)=(x−4)/(x²−4) mit Definitionsmenge, Polstellen und erster Ableitung.',
 'D=ℝ∖{−2,2}; Pole bei x=±2; Nullstelle x=4. f′(x)=(−x²+8x−4)/(x²−4)².',
 'Nenner darf nicht 0 sein. Nullstellen durch Zähler=0. Für f′ die Quotientenregel verwenden.');
B('1.18b',K,'Bei E(x)=−4x²+450x und Fixkosten 1200 GE berechne die Gewinnschwelle, Gewinngrenze und die Höhe des maximalen Gewinns.',
 'G(x)=−4x²+450x−1200. Nullstellen ungefähr x≈2,73 und x≈109,77, Gewinnmaximum bei x=56,25 mit G=11 456,25 GE.',
 'G(x)=0 mit Mitternachtsformel lösen. Gewinnmaximum am Scheitel x=−b/(2a)=450/8=56,25.',
 null,{curves:[{label:'G(x)',poly:[-4,450,-1200]}],x:[0,115],y:[-2500,12500]});
B('1.19c',K,'Ein Ball folgt h(t)=−5t²+10t+7. Berechne die maximale Höhe.',
 'Maximalhöhe 12 m bei t=1 s.',
 'Ableitung h′(t)=−10t+10=0 führt zu t=1. In h einsetzen: −5+10+7=12.',12);
B('1.19d',K,'Ein Ball folgt h(t)=−5t²+10t+7. Mit welcher vertikalen Geschwindigkeit trifft er auf dem Boden auf?',
 'Aufprallgeschwindigkeit v=−4√15≈−15,49 m/s (nach unten).',
 'Bodenkontakt: −5t²+10t+7=0 ⇒ t=1+2√15/5. v=h′=−10t+10 dort einsetzen.',-4*Math.sqrt(15));
B('1.20a',K,'Konzentration K(t)=5(e^(−0,12t)−e^(−0,3t)), t≥0. Bestimme die Zeit der maximalen Konzentration.',
 't=ln(2,5)/0,18≈5,09 Stunden.',
 'K′=5(−0,12e^(−0,12t)+0,3e^(−0,3t))=0. Umformen und logarithmieren.',Math.log(2.5)/.18);
B('1.22',K,'Ein Polynom 3. Grades geht durch (0|0), P(2|3) und berührt die x-Achse bei x=5. Ermittle die Funktionsgleichung.',
 'f(x)=x(x−5)²/6=⅙x³−(5/3)x²+(25/6)x.',
 'Eine Berührung bei x=5 ist eine doppelte Nullstelle. Wegen Nullstelle 0 gilt f=a·x·(x−5)². Aus f(2)=3 folgt a=1/6.');
B('1.23',K,'Eine Parabel hat bei x=5 eine Nullstelle. An P mit x=3 hat ihre Tangente die Gleichung y=−x+7. Ermittle die Parabel und ihre Scheitelkrümmung.',
 'f(x)=−½x²+2x+2,5; Scheitel (2|4,5), Krümmungsradius im Scheitel R=1.',
 'Bedingungen: f(5)=0, f(3)=4 und f′(3)=−1. Für f=ax²+bx+c entsteht ein lineares System. Im Scheitel ist f′=0, f″=−1.');
B('1.24',K,'Der höchste Punkt eines kubischen Seilverlaufs ist H(2|50), der tiefste T(4|4). Bestimme die Polynomfunktion und die Stelle des stärksten Gefälles.',
 'f(x)=11,5x³−103,5x²+276x−180. Das stärkste Gefälle zwischen H und T liegt beim Wendepunkt x=3 mit f(3)=27.',
 'Nutze f(2)=50, f′(2)=0, f(4)=4, f′(4)=0. Die größte negative Steigung zwischen beiden Extrema liegt bei f″=0.');
B('1.25',K,'Ein beidseitig eingespannter Träger von 3 m Länge biegt sich in der Mitte um maximal 2 cm durch. Die Endwerte sind 0 und die Tangenten an beiden Enden waagrecht. Stelle ein Polynom 4. Grades auf.',
 'Mit x in mm und y als Durchbiegung in mm gilt y(x)=20·[x(3000−x)/(1500²)]².',
 'Doppelte Nullstellen bei x=0 und x=3000 erzwingen y=a x²(x−3000)². Mit y(1500)=20 mm wird a eindeutig bestimmt.');
B('1.32a',K,'Einem Halbkreis mit Radius R ist ein gleichschenkliges Dreieck mit Grundseite am Durchmesser eingeschrieben. Wie viel Prozent der Halbkreisfläche kann die Dreiecksfläche maximal einnehmen?',
 'Anteil 2/π≈63,66 %.',
 'Größte Grundseite 2R (Durchmesser), maximale Höhe R. Dreiecksfläche R²; Halbkreisfläche πR²/2, Verhältnis 2/π.',200/Math.PI);
B('1.32b',K,'Einem gleichschenkligen Dreieck mit Basis B und Höhe H wird ein Rechteck mit maximaler Fläche eingeschrieben. Bestimme seine Abmessungen.',
 'Breite B/2, Höhe H/2, Rechtecksfläche BH/4.',
 'Mit Strahlensatz beträgt die verfügbare Breite in Höhe h: B(1−h/H). Maximieren von A(h)=hB(1−h/H).');
B('1.74',V,'Nach Öffnen einer Kanalschleuse gilt v(t)=6,2t·e^(−1,4t) m³/s für t≥0. Bestimme den Zeitpunkt maximaler Durchflussgeschwindigkeit.',
 'Maximum bei t=1/1,4≈0,7143 Sekunden.',
 'Produktregel: v′=6,2e^(−1,4t)(1−1,4t). Exponentialfaktor ist positiv, also 1−1,4t=0.',1/1.4);
B('1.101a',V,'Der Graph von f(x)=√(x−3) wird im Bereich x∈[3;7] um die x-Achse rotiert. Bestimme das Rotationsvolumen.',
 'Vₓ=π∫₃⁷(√(x−3))²dx=π∫₃⁷(x−3)dx=8π.',
 'Formel für Rotation um x-Achse: π∫[f(x)]²dx. Die Wurzel quadrieren.',8*Math.PI);
B('1.101b',V,'Der Graph von f(x)=√(x−3) wird im Bereich [3;7] um die y-Achse rotiert. Berechne das Volumen der erzeugten Rotationsfigur.',
 'Vᵧ=2π∫₃⁷ x√(x−3)dx=(288/5)π≈180,956.',
 'Zylinderschalenmethode: Umfang 2πx mal Höhe f(x) integrieren. Substitution u=x−3 benutzen.',288*Math.PI/5);
B('1.102',F,'Ordne zu: Welcher mathematische Begriff entspricht „einem orientierten Flächeninhalt“?',
 'Das bestimmte Integral. Es kann im Gegensatz zum geometrischen Flächeninhalt negativ sein.',
 'Auf der x-Achse liegende positive und negative Teilflächen werden beim bestimmten Integral mit Vorzeichen addiert.');

if(new Set(R.map(x=>x.id)).size!==R.length)throw Error('Duplicate book IDs');
window.MATHS_BOOK_BANK=Object.freeze(R);
})();