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
 const section=n.split('.')[0],number=Number((n.split('.')[1]||'').match(/^\d+/)?.[0]||0);
 const originalPage=section==='2'?(number<=31?14:15):
   number<=9?1:number<=13?2:number<=20?3:number<=25?4:number<=30?5:number<=33?6:
   number<=65?7:number<=70?8:number<=74?9:number<=76?10:number<=82?11:number<=92?12:13;
 const x={id:'book-'+n.replace(/[^a-z0-9]/gi,'-'),number:n,category,prompt,solution,steps,source:'Originaldatei: Buchbeispiele laut SchularbeitsStoff.zip · Screenshot '+String(originalPage).padStart(2,'0'),originalScreenshot:originalPage};
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
B('1.12a',K,'Eine Fahrt wird durch das nebenstehende Entfernungs-Zeit-Diagramm näherungsweise beschrieben. 1) Ermittle jeweils die Geschwindigkeit für die drei Abschnitte.','Abschnitt 1: 50/3≈16,67 km/h; Abschnitt 2: 0 km/h; Abschnitt 3: −50/3≈−16,67 km/h.',
 'Geschwindigkeit = ΔWeg/ΔZeit. Positive Steigung bedeutet Entfernung nimmt zu, Null bedeutet unveränderte Entfernung, negative Steigung bedeutet Rückfahrt.',
 null,{kind:'book-distance-time',curves:[{label:'s(t)',points:[[0,0],[3,50],[5,50],[8,0]]}],x:[0,8],y:[-5,60]});
B('1.14',K,'Diskutiere f(x)=0,2x³−x² und bestimme die Wendetangente.','f′=0,6x²−2x; f″=1,2x−2. Wendestelle x=5/3; Wendepunkt (5/3|−50/27); Steigung m=−5/3. Wendetangente y=−5x/3+25/27.',
 'Für Wendestellen f″=0 setzen; x in f und f′ einsetzen. Wendetangente y=f′(xW)(x−xW)+f(xW).',
 null,{curves:[{label:'f',poly:[0.2,-1,0,0]}],x:[-1,5],y:[-4,3]});
B('1.17',K,'Eine Körpertemperatur wird beschrieben durch T(t)=−0,16t³+0,82t²+0,8t+36,5 mit 0≤t≤6. Bestimme die maximale Körpertemperatur und wann sie auftritt.','T′(t)=−0,48t²+1,64t+0,8. Maximum im Intervall bei t≈3,85 h, mit T≈42,60 °C (gerundet).',
 'Ableitung gleich Null setzen. Positive kritische Stelle und beide Intervallenden prüfen, dann T einsetzen.');
B('1.18a',K,'Eine Firma hat Fixkosten von 1200 GE und Herstellungskosten von 110 GE pro Sessel. Bei E(x)=−4x²+450x stelle Kosten- und Gewinnfunktion auf.','K(x)=110x+1200; G(x)=E(x)−K(x)=−4x²+340x−1200.',
 'Die 110 GE je Sessel sind variable Kosten und müssen zur Fixkostenpauschale addiert werden. Gewinn = Erlös minus Gesamtkosten.');
B('1.19a',K,'Ein Ball folgt h(t)=−5t²+10t+7 (h in m, t in s). Bestimme seine Abwurfhöhe.','h(0)=7 m.','Abwurfzeit t=0 einsetzen.',7);
B('1.19b',K,'Ein Ball hat h(t)=−5t²+10t+7. Wann erreicht er nach dem Abwurf erneut die Abwurfhöhe von 7 m?','Bei t=2 s.',
 'Setze h(t)=7: −5t²+10t=0, also t(−5t+10)=0. Die Lösung t=0 ist der Abwurf, t=2 der gesuchte spätere Zeitpunkt.',2);
B('1.21',K,'Ein kubisches Polynom hat E(2|4) als Extrempunkt und W(−1|0,5) als Wendepunkt. Bestimme die Funktionsgleichung.','Bedingungen: f(2)=4, f′(2)=0, f(−1)=0,5 und f″(−1)=0. Daraus folgt f(x)=−7x³/108−7x²/36+14x/9+59/27.',
 'Vier Bedingungen für die vier Koeffizienten aufstellen und ein lineares Gleichungssystem lösen.');
B('1.28',K,'Zerlege 40 in zwei natürliche Summanden, sodass die Summe ihrer Quadrate minimal ist.','20 und 20; Minimalwert 20²+20²=800.',
 'Sei x der erste Teil und 40−x der zweite. S(x)=x²+(40−x)². S′=4x−80=0 ⇒ x=20.',20);
B('1.29',V,'Eine zylindrische Dose soll Volumen 75 cm³ besitzen. Bei welcher Abmessung wird die Materialoberfläche minimal? Boden und Deckel haben zusammen 25 % mehr Materialbedarf.','Mit r als Radius: h=75/(πr²). Materialmodell A(r)=2,5πr²+2πrh. Minimum aus A′(r)=0 bestimmen.',
 'Zylinder: V=πr²h. Materialfläche entsprechend Aufgabenstellung mit Aufschlag für Boden und Deckel aufstellen. Die Nebenbedingung eliminiert h.');
B('1.30',V,'Aus 144 cm Draht entsteht das Kantenmodell eines Quaders mit quadratischer Grundfläche. Berechne die Abmessungen für maximales Volumen.','Grundkante 12 cm, Höhe 12 cm; Volumen 1728 cm³.',
 'Drahtlänge 8a+4h=144 ⇒ h=36−2a. V=a²(36−2a). V′=72a−6a²=0 liefert a=12, h=12.',12);
B('1.31',K,'Ein Bauer hält bereits 50 Ziegen mit je 800 l Milch im Jahr. Für jede zusätzlich angeschaffte Ziege sinkt die Jahresmilchmenge pro Tier um 10 l. Wie viele Ziegen soll er zusätzlich anschaffen?','15 zusätzliche Ziegen, also 65 insgesamt. Maximal 65·650=42 250 l Milch.',
 'Sei x die Anzahl zusätzlich angeschaffter Ziegen. Dann M(x)=(50+x)(800−10x)=40 000+300x−10x². Ableitung M′=300−20x=0 ⇒ x=15; M″=−20<0.',15);
B('1.55a',I,'Ermittle das unbestimmte Integral: ∫(4x³−3x+1) dx.','F(x)=x⁴−3x²/2+x+C.',
 'Potenzregel rückwärts auf alle Summanden anwenden. Jede Stammfunktion hat +C.');
B('1.55b',I,'Ermittle das unbestimmte Integral: ∫(a·t+b) dt (a,b sind Konstanten).','F(t)=a·t²/2+b·t+C.',
 'Konstante Faktoren stehen lassen; t bekommt beim Integrieren Exponent 2.');
B('1.55c',I,'Ermittle das unbestimmte Integral: ∫(2sin(x)+3eˣ+2/x) dx.','F(x)=−2cos(x)+3eˣ+2ln|x|+C.',
 'Sinus wird zu −Cosinus; eˣ bleibt eˣ und ∫(2/x)dx=2ln|x| (x≠0).');
B('1.57a',F,'Berechne das bestimmte Integral ∫₀^π sin(t) dt.','[−cos(t)]₀^π=−(−1)−(−1)=2.',
 'Stammfunktion −cos t. Obere Grenze minus untere Grenze einsetzen.',2);
B('1.57b',F,'Berechne das bestimmte Integral: ∫₀^(2π) cos(x) dx.','[sin(x)]₀^(2π)=0.',
 'Nach einer ganzen Periode heben sich positive und negative orientierte Flächen auf.',0);
B('1.57c',F,'Berechne das bestimmte Integral: ∫₀⁴ √t dt.','[2t^(3/2)/3]₀⁴ = (2/3)·8=16/3≈5,3333.',
 'Wurzel als t^(1/2) schreiben, integrieren und die tatsächlichen Originalgrenzen 0 und 4 einsetzen.',16/3);
B('1.58a',I,'Ermittle das unbestimmte Integral: ∫5e^(2x) dx.','F(x)=(5/2)e^(2x)+C.',
 'Bei e^(kx) durch die innere Ableitung k teilen, hier 2.');
B('1.58b',I,'Ermittle das unbestimmte Integral: ∫sin(0,5t+π/2) dt.','F(t)=−2cos(0,5t+π/2)+C.',
 'Cosinus wird zu Sinus beim Ableiten; wegen innerer Steigung 0,5 beim Integrieren durch 0,5 teilen.');
B('1.58c',I,'Ermittle das unbestimmte Integral: ∫1/(1−x) dx.','F(x)=−ln|1−x|+C.',
 'Substitution u=1−x, du=−dx. Minuszeichen nicht vergessen.');
B('1.59a',I,'Ermittle das unbestimmte Integral: ∫2/(x+4) dx.','F(x)=2ln|x+4|+C.',
 'Die Logarithmus-Stammfunktion ∫1/u du=ln|u| nutzen.');
B('1.59b',I,'Ermittle das unbestimmte Integral: ∫2e^(2−x) dx.','F(x)=−2e^(2−x)+C.',
 'Innere Ableitung von 2−x ist −1, daher Vorzeichenwechsel.');
B('1.59c',I,'Ermittle das unbestimmte Integral: ∫cos(5t+π) dt.','F(t)=(1/5)sin(5t+π)+C.',
 'Sinus ist Stammfunktion von Cosinus; durch den Faktor 5 der inneren Funktion teilen.');
B('1.60a',F,'Berechne das bestimmte Integral: ∫₀³ 4/(x−6) dx.','4[ln|x−6|]₀³ = 4ln(3/6)=−4ln2≈−2,7726.',
 'Logarithmus integrieren; die negative Fläche ist als orientiertes Integral negativ.',-4*Math.log(2));
B('1.60b',F,'Berechne das bestimmte Integral: ∫₀² sin((π/2)t−π) dt.','[−2/π·cos((π/2)t−π)]₀²=−4/π≈−1,2732.',
 'Sinus integrieren und durch π/2 teilen, dann t=2 und t=0 einsetzen.',-4/Math.PI);
B('1.60c',F,'Berechne das bestimmte Integral: ∫_(π/2)^(3π/2) cos(x−π) dx.','[sin(x−π)]_(π/2)^(3π/2)=1−(−1)=2.',
 'Cosinus integrieren; bei 3π/2 ist sin(π/2)=1, bei π/2 ist sin(−π/2)=−1.',2);
B('1.61b',I,'Ermittle das unbestimmte Integral: ∫x/(x²+1) dx.','F(x)=(1/2)ln(x²+1)+C.',
 'Substitution u=x²+1; du=2x dx. Der Faktor 1/2 gleicht die innere Ableitung aus.');
B('1.62a',I,'Ermittle das unbestimmte Integral mithilfe der partiellen Integration: ∫t·cos(t) dt.','F(t)=t·sin(t)+cos(t)+C.',
 'Partielle Integration mit u=t, dv=cos(t)dt: uv−∫vdu.');
B('1.62b',I,'Ermittle das unbestimmte Integral mithilfe der partiellen Integration: ∫x·e^(−x) dx.','F(x)=−(x+1)e^(−x)+C.',
 'Partielle Integration: u=x, dv=e^(−x)dx; v=−e^(−x).');
B('1.62c',I,'Ermittle das unbestimmte Integral mithilfe der partiellen Integration: ∫x²·ln(x) dx (x>0).','F(x)=x³ln(x)/3−x³/9+C.',
 'Partielle Integration: u=ln x, dv=x²dx, dadurch du=1/x dx und v=x³/3.');
B('1.63a',I,'Ermittle das unbestimmte Integral mithilfe der Polynomdivision: ∫x/(x+1) dx.','F(x)=x−ln|x+1|+C.',
 'Bruch umformen: x/(x+1)=1−1/(x+1), dann getrennt integrieren.');
B('1.63b',I,'Ermittle das unbestimmte Integral mithilfe der Polynomdivision: ∫x²/(x+1) dx.','F(x)=x²/2−x+ln|x+1|+C.',
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
 'f−g=−2x²−3x−1. Schnittstellen durch f=g: x=−1 und x=−0,5. Dazwischen ist f−g positiv; A=∫₋₁^(−0,5)(f−g)dx=1/24.',1/24);
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
B('1.98a',F,'Berechne das bestimmte Integral: ∫₁⁴(x²+4x−1)dx.','Bestimmtes Integral =48.',
 'Stammfunktion F(x)=x³/3+2x²−x. Es gilt F(4)=148/3 und F(1)=4/3; Differenz =144/3=48.',48);
B('1.98b',F,'Berechne das bestimmte Integral: ∫₀¹ e^(2x) dx.','(e²−1)/2≈3,1945.',
 'Eine Stammfunktion ist ½e^(2x). Bei 1 und 0 einsetzen.',(Math.exp(2)-1)/2);
B('1.98c',F,'Berechne das bestimmte Integral: ∫₂⁵ ³√(x²) dx.','(3/5)(5^(5/3)−2^(5/3))≈6,867.',
 'Schreibe ³√(x²)=x^(2/3) und verwende die Potenzregel für Stammfunktionen: 3x^(5/3)/5.',(3/5)*(Math.pow(5,5/3)-Math.pow(2,5/3)));
B('1.98d',F,'Berechne das bestimmte Integral: ∫₀^(π/2) 3sin(x)dx.','Ergebnis =3.',
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
B('1.56a',I,'Ermittle das unbestimmte Integral: ∫(−5x²+3/x³−³√x)dx.',
 'F(x)=−5x³/3−3/(2x²)−(3/4)x^(4/3)+C.',
 '3/x³ als 3x⁻³ schreiben. Die dritte Wurzel als x^(1/3) auffassen; das Integral ist (3/4)x^(4/3).');
B('1.61a',I,'Ermittle das unbestimmte Integral: ∫3x·e^(2x)dx mittels partieller Integration.',
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
B('1.69b',F,'Die blau markierte Fläche liegt im Rechteck von x=0 bis x=b oberhalb des Graphen einer positiven Funktion f und unter y=c. Stelle eine Integralformel auf.',
 'A=∫₀ᵇ[c−f(x)]dx.',
 'Obere Begrenzungsfunktion minus untere Begrenzungsfunktion integrieren.');


/* Graph interpretation, optimization and context exercises transcribed from the ZIP. */
B('1.11a',K,'Zeichne den Graphen von f′ zum originalen Linienzug durch (0|0),(2|3),(3|3),(5|0),(7|0),(9|2).',
 'f′ ist stückweise konstant: 1,5 auf (0;2), 0 auf (2;3), −1,5 auf (3;5), 0 auf (5;7), 1 auf (7;9). An den Knicken existiert keine eindeutige Ableitung.',
 'Die Ableitung entspricht den Steigungen der fünf Geradenabschnitte. An echten Knickstellen ist sie nicht definiert.',
 null,{curves:[{label:'f',points:[[0,0],[2,3],[3,3],[5,0],[7,0],[9,2]]}],x:[-0.5,9.5],y:[-0.5,4]});
B('1.11b',K,'Der Graph von f ist eine Parabel mit Nullstellen 1 und 3 sowie Scheitel (2|−1). Skizziere den Graphen ihrer Ableitung.',
 'f(x)=(x−2)²−1 ⇒ f′(x)=2x−4, eine Gerade mit Nullstelle bei x=2.',
 'Die Ableitung einer quadratischen Funktion ist eine Gerade. Links des Scheitels negativ, rechts positiv.',
 null,{curves:[{label:'f',poly:[1,-4,3]}],x:[-.2,4.3],y:[-2,5]});
B('1.13',K,'In der Abbildung ist der Graph einer Geschwindigkeits-Zeit-Funktion dargestellt. Kreuze die zutreffende Aussage an.\nA: Die Beschleunigung im Intervall ]0;3[ beträgt 6 m/s².\nB: Die Beschleunigung im Intervall ]5;8[ ist größer als jene im Intervall ]0;3[.\nC: Die Beschleunigung im Intervall ]3;5[ beträgt 0 m/s².\nD: Die Geschwindigkeit im Intervall ]3;5[ beträgt 0 m/s.\nE: Der Term (v(3)−v(2))/(3−2) gibt die mittlere Geschwindigkeit im Intervall [2;3] an.',
 'C ist richtig. Auf dem waagrechten Graphenabschnitt 3<t<5 bleibt die Geschwindigkeit konstant (6 m/s); die Beschleunigung ist dort 0 m/s².',
 'Beschleunigung ist die Steigung eines v-t-Diagramms, nicht dessen Höhe. Für 0<t<3 beträgt sie 2 m/s², für 3<t<5 beträgt sie 0 und für 5<t<8 beträgt sie 4/3 m/s². Die Geschwindigkeit bleibt im mittleren Abschnitt 6 m/s.',
 null,{kind:'book-velocity',curves:[{label:'v(t)',points:[[0,0],[3,6],[5,6],[8,10]]}],x:[0,8],y:[0,11]});
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
B('1.18b',K,'E(x)=−4x²+450x, variable Kosten 110 GE je Sessel, Fixkosten 1200 GE. Berechne Gewinnschwelle und Gewinngrenze sowie den maximalen Gewinn.',
 'G(x)=−4x²+340x−1200. Gewinnschwelle x≈3,69, Gewinngrenze x≈81,31. Gewinnmaximum bei x=42,5 mit G=6025 GE.',
 'G(x)=0 löst −4x²+340x−1200=0, also x=(85±5√241)/2. Das Maximum liegt am Scheitel x=340/8=42,5; G(42,5)=6025.',
 null,{curves:[{label:'G(x)',poly:[-4,340,-1200]}],x:[0,90],y:[-2200,6700]});
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
B('1.32a',K,'In einen Halbkreis mit Radius R wird ein gleichschenkliges Dreieck maximaler Fläche eingeschrieben. Die Spitze liegt im Kreismittelpunkt, die Grundlinie parallel zum Durchmesser. Welcher Prozentanteil der Halbkreisfläche ist maximal?',
 'Anteil 1/π≈31,83 %.',
 'Bei Dreieckshöhe h liegt die halbe Grundlinie bei √(R²−h²). A(h)=h·√(R²−h²) hat sein Maximum bei h=R/√2, also A=R²/2. Halbkreisfläche πR²/2 ⇒ Verhältnis 1/π.',100/Math.PI);
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


/* Further independently checked source subparts, original pages 6–15. */
B('1.33',V,'Ein Rundlaufweg um ein rechteckiges Fußballfeld besteht aus zwei Halbkreisbögen an den Torseiten und zwei Geraden. Die innere Bahnlänge beträgt 500 m. Bei welchen Abmessungen ist die rechteckige Spielfläche maximal?',
 'Geradenlänge 125 m, Feldbreite 250/π≈79,58 m; maximierte Fläche 31 250/π≈9 947,18 m².',
 'Sei r der Radius der Halbkreise und L die Länge der geraden Bahnteile. 2L+2πr=500 ⇒ L=250−πr. A=2rL=500r−2πr². Aus A′=500−4πr=0 folgt r=125/π und L=125.');
B('1.63c',I,'Berechne das unbestimmte Integral ∫x³/(x²−x−6) dx.',
 'F(x)=x²/2+x+(27/5)ln|x−3|+(8/5)ln|x+2|+C.',
 'Polynomdivision: x³/(x²−x−6)=x+1+(7x+6)/(x²−x−6). Der Nenner ist (x−3)(x+2); Partialbruchzerlegung liefert (27/5)/(x−3)+(8/5)/(x+2).');
B('1.64a',I,'Bestimme die fehlende obere Grenze a aus ∫₀ᵃ(2x²−3x)dx=56/3.',
 'a=4.',
 'F(x)=2x³/3−3x²/2. Gleichung 2a³/3−3a²/2=56/3 ⇒ 4a³−9a²−112=0. Einsetzen und Faktorisieren ergibt a=4.',4);
B('1.64b',I,'Bestimme alle reellen oberen Grenzen b, die ∫₁ᵇ(3x−4)dx=10,5 erfüllen.',
 'b=4 oder b=−4/3.',
 'F(x)=3x²/2−4x. F(b)−F(1)=10,5 ⇒ 3b²−8b−16=0. Mit der Mitternachtsformel erhältst du beide Lösungen.');
B('1.64c',I,'Bestimme die untere Grenze c aus ∫c⁶(3x²+2x)dx=240.',
 'c=2.',
 'F(x)=x³+x². F(6)=252, daher F(c)=12 und c³+c²=12. Die reelle Lösung ist c=2.',2);
B('1.65',K,'Im Buch ist f′ als nach unten geöffnete Kurve dargestellt, mit Nullstellen x=0 und x=2. Kreuze die richtige Aussage über f an (A: Maximum bei 1, B: Extrempunkt bei 0, C: f linear, D: steigend auf [−1;0], E: Wendepunkt bei 2).',
 'B ist richtig. f hat bei x=0 einen Extrempunkt (Minimum), weil f′ von negativ auf positiv wechselt.',
 'Für Extrema von f nicht nach Hochpunkten von f′ suchen, sondern nach den Nullstellen von f′ und dem Vorzeichenwechsel. Bei x=2 hat f ein Maximum, keinen Wendepunkt.',
 null,{curves:[{label:"f′(x)",poly:[-1,2,0]}],x:[-1.4,3.3],y:[-1.6,1.5]});
B('1.67d',F,'Berechne den gesamten eingeschlossenen Flächeninhalt zwischen f(x)=4/x² und g(x)=−x²+5.',
 'Zwei symmetrische Teilflächen von jeweils 2/3; zusammen A=4/3 Flächeneinheiten.',
 'f=g ⇒ 4/x²=5−x² ⇒ (x²−1)(x²−4)=0. Schnittpunkte x=±1, ±2. Auf [1;2] liegt g über f; ∫₁²(5−x²−4/x²)dx=2/3. Symmetrie verdoppeln.',4/3);
B('1.69c',F,'Rechts vom Maximum einer Funktion f verläuft im Buch eine blau markierte Fläche unter der Höhe f(0), über der Kurve f und zwischen x=0 und x=a. Stelle die Integralformel auf.',
 'A=∫₀ᵃ[f(0)−f(x)]dx.',
 'Der obere Rand ist die waagrechte Gerade y=f(0); der untere Rand ist y=f(x). Integrationsgrenzen 0 und a.');
B('1.70b',F,'Begründe, warum man mit dem orientierten Integral ∫₋₂¹f(x)dx nicht immer den geometrischen Flächeninhalt zwischen f und x-Achse erhält.',
 'Das bestimmte Integral zählt negative Teilflächen mit negativem Vorzeichen. Geometrische Fläche = Summe der Beträge der Teilintegrale nach Aufteilung an den Nullstellen.',
 'Wenn f innerhalb des Intervalls die x-Achse schneidet, können sich positive und negative Flächen teilweise aufheben. Das Ergebnis des Integrals ist nicht automatisch die Fläche.');
B('1.71b',K,'Gegeben ist f′(x)=x²−4x sowie f(0)=4. Ermittle die Extrempunkte von f.',
 'f(x)=x³/3−2x²+4. Hochpunkt H(0|4), Tiefpunkt T(4|−20/3).',
 'f′=x(x−4) hat Nullstellen x=0 und x=4. f″=2x−4: bei 0 negativ (H), bei 4 positiv (T). Funktionswerte in f einsetzen.');
B('1.73a',F,'Eine Wand (6 m × 10 m) wird zweifarbig gestaltet. Die Farbgrenzen werden durch g(x)=(x³−12x)/8 und h(x)=−g(x) beschrieben. Berechne die blau und rot eingefärbten Flächen.',
 'Jede Farbe bedeckt 9 m², beide Farben zusammen 18 m².',
 'Schnittstellen g=h liefern x=−2√3, 0, 2√3. Die vier Teilbereiche werden durch die Graphen und die x-Achse unterteilt; je Farbe bestehen zwei Teilflächen von 4,5 m².');
B('1.73b',F,'Eine 6×10-m-Wand wird nach 1.73 mit je 9 m² Blau und Rot gestrichen. Pro Quadratmeter braucht man 200 ml Farbe; Blau kostet 5,50 €/l und Rot 4,30 €/l. Berechne die Mindestkosten.',
 'Blau 1,8 l·5,50 €/l=9,90 €, Rot 1,8 l·4,30 €/l=7,74 €; zusammen 17,64 €.',
 '200 ml/m² =0,2 l/m². Jede Farbe benötigt 9·0,2=1,8 l; anschließend den jeweiligen Literpreis multiplizieren.',17.64);
B('1.73c',F,'Welche Prozentzahl der Wandfläche bleibt bei der zweifarbigen Gestaltung aus 1.73 weiß?',
 'Die Wand hat 60 m², farbig sind 18 m², weiß 42 m² ⇒ 70 %.',
 'Gesamtfläche =6·10=60 m². Weißer Anteil (60−18)/60·100.',70);
B('1.75b',V,'Die Beschleunigung eines Autos ist a(t)=(30t−t²)/225 m/s² auf [0;30]. Erkläre die Bedeutung von ∫₀²⁰ a(t)dt.',
 'Das Integral beschreibt den Geschwindigkeitszuwachs in den ersten 20 Sekunden, in m/s.',
 'Beschleunigung ist die Ableitung der Geschwindigkeit. Ihr Zeitintegral liefert die Änderung der Geschwindigkeit.');
B('1.75c',V,'Ein Auto startet mit v(0)=0 und hat a(t)=(30t−t²)/225. Bestimme v(t) und die Geschwindigkeit nach 30 Sekunden.',
 'v(t)=t²/15−t³/675; v(30)=20 m/s.',
 'a(t) integrieren; Integrationskonstante aus v(0)=0. Danach t=30 einsetzen.',20);
B('1.75d',V,'Begründe anhand von a(t)=(30t−t²)/225, warum v(t) auf [0;30] monoton steigt.',
 'a(t)=t(30−t)/225≥0 für 0≤t≤30, daher ist v′(t)=a(t)≥0.',
 'Monotonie der Geschwindigkeit aus dem Vorzeichen der Ableitung a(t) ablesen.');
B('1.76a',V,'Ein kreisförmiger Pool hat Durchmesser 20 m. Ein geschwungener Barbereich liegt zwischen y₁=sin(πx/8) und y₂=4sin(πx/8) für −8≤x≤8. Wie viel Prozent der Poolfläche nimmt der Barbereich ein?',
 'A_Bar=96/π≈30,56 m². Poolfläche 100π m²; Anteil (96/π²)≈9,73 %.',
 'Zwischen den beiden Sinusgraphen ergibt sich durch Symmetrie A=2∫₀⁸[4sin(πx/8)−sin(πx/8)]dx=96/π. Durch 100π teilen und mit 100 multiplizieren.',96/(Math.PI*Math.PI));
B('1.76b',V,'Der Barbereich aus 1.76 hat eine Fläche von 96/π m². Der Pool ist 120 cm tief. Wie viele Hektoliter Wasser passen in den Pool ohne Barbereich?',
 'Wasserfläche =100π−96/π m². Volumen=1,2·(100π−96/π) m³, in hL: ≈3 403,22 hL.',
 'Poolvolumen aus Oberfläche·Tiefe (1,2 m). Für Barbereich kein Wasser mitzählen. 1 m³=10 hL.');
B('1.82a',K,'Eine Polynomfunktion 3. Grades hat ein Maximum im Punkt H(2|5). An der Stelle x=4 befindet sich ein Wendepunkt. Die Steigung der Wendetangente beträgt k=−3/2. Bestimme die Funktionsgleichung und die Gleichung der Wendetangente.',
 'f(x)=x³/8−3x²/2+9x/2+1. Wendepunkt W(4|3) und Wendetangente y=−(3/2)x+9.',
 'f(2)=5, f′(2)=0, f″(4)=0, f′(4)=−3/2. Löse das lineare Gleichungssystem für a,b,c,d. Setze x=4 für W und die Tangente ein.');
B('1.82c',F,'Berechne den orientierten Flächeninhalt zwischen f(x)=x³/8−3x²/2+9x/2+1 und der x-Achse auf [1;7].',
 'Bestimmtes Integral ∫₁⁷f(x)dx =18 Flächeneinheiten.',
 'Stammfunktion x⁴/32−x³/2+9x²/4+x bilden und Grenzen 7 und 1 einsetzen.',18);
B('1.82d',V,'Rotiert der Funktionsgraph im Intervall [1;7] um die x-Achse, so hat der entstehende Rotationskörper die Form einer Spielfigur, wie sie aus einem Kunststoff mit der Dichte ρ=1,05 g/cm³ hergestellt ist. Bestimme die Masse der Spielfigur.',
 'V=π·75951/1120≈213,03 cm³; Masse m=1,05·V≈223,68 g.',
 'Rotationsvolumen um die x-Achse: V=π·Integral von f(x)² mit Untergrenze 1 und Obergrenze 7. Polynom quadrieren, integrieren und Grenzen einsetzen. Anschließend m=ρ·V mit ρ=1,05 g/cm³ berechnen.',1.05*75951*Math.PI/1120);


/* Actual exercises 2.25–2.38 from the last two uploaded screenshots. */
B('2.25a',P,'Gegeben z=−5x³y²+7xy−3x²y. Bestimme zₓ und zᵧ.',
 'zₓ=−15x²y²+7y−6xy; zᵧ=−10x³y+7x−3x².',
 'Bei zₓ wird y als Konstante behandelt, bei zᵧ wird x als Konstante behandelt.');
B('2.25b',P,'Gegeben z=4/x²−3x²y⁴+5/y. Bestimme zₓ und zᵧ.',
 'zₓ=−8/x³−6xy⁴; zᵧ=−12x²y³−5/y².',
 'Brüche als negative Potenzen schreiben. Nur die gewünschte Variable differenzieren.');
B('2.25c',P,'Gegeben z=4x+y²/x−6/y+4. Bestimme zₓ und zᵧ.',
 'zₓ=4−y²/x²; zᵧ=2y/x+6/y².',
 'Auch bei 1/x und 1/y die Potenzregel verwenden.');
B('2.26b',P,'Gegeben z=sin(3xy−4x²y). Berechne zₓ und zᵧ.',
 'zₓ=(3y−8xy)cos(3xy−4x²y); zᵧ=(3x−4x²)cos(3xy−4x²y).',
 'Sinus außen zu Cosinus ableiten; danach jeweils die partielle Ableitung der inneren Funktion multiplizieren.');
B('2.26c',P,'Gegeben z=tan(5x²y³−2xy²). Berechne zₓ und zᵧ.',
 'Mit u=5x²y³−2xy²: zₓ=(10xy³−2y²)/cos²(u); zᵧ=(15x²y²−4xy)/cos²(u).',
 'Kettenregel für tan(u): (tan u)′=1/cos²u; dann u nach x bzw. y differenzieren.');
B('2.27b',P,'Gegeben z=e^(3xy)/(2x+3y). Berechne zₓ und zᵧ.',
 'zₓ=e^(3xy)[3y(2x+3y)−2]/(2x+3y)²; zᵧ=e^(3xy)[3x(2x+3y)−3]/(2x+3y)².',
 'Quotientenregel und Kettenregel verwenden; beim Ableiten nach x bleibt y konstant, umgekehrt entsprechend.');
B('2.27c',P,'Gegeben z=³√(3x²y+2xy²). Bestimme zₓ und zᵧ.',
 'Mit u=3x²y+2xy²: zₓ=(6xy+2y²)/(3u^(2/3)); zᵧ=(3x²+4xy)/(3u^(2/3)).',
 'Dritte Wurzel als Potenz 1/3 schreiben und Kettenregel ausführen.');
B('2.28b',P,'Gegeben W(v,α)=v²sin(2α)/6. Berechne ∂W/∂v und ∂W/∂α.',
 'Wᵥ=v·sin(2α)/3; W_α=v²cos(2α)/3.',
 'Bei v-Ableitung ist α fest. Bei Winkelableitung bleibt v²/6 konstant; innere Ableitung von 2α ist 2.');
B('2.28c',P,'Gegeben p(V,T)=nRT/V. Bestimme ∂p/∂V und ∂p/∂T.',
 'pᵥ=−nRT/V²; pₜ=nR/V.',
 'Die Konstanten n und R bleiben fest; bei ∂/∂V ist T konstant, bei ∂/∂T ist V konstant.');
B('2.29b',P,'Die Halbkugel z=√(49−x²−y²) hat Radius 7. Skizziere die Fläche und beschreibe ihre Tangentialebenen an den Schnittpunkten mit x- und y-Achse.',
 'Am Rand (±7|0|0) und (0|±7|0) stehen die Tangentialebenen senkrecht zur xy-Ebene: x=±7 bzw. y=±7.',
 'Die Gleichung x²+y²+z²=49 beschreibt die Kugel. Der Radiusvektor ist an jedem der vier Randpunkte normal zur Tangentialebene.');
B('2.30b',P,'Bestimme die Tangentialebene von z=6x²−8y² in P(−2|5|z₀).',
 'z₀=−176. zₓ(P)=−24, zᵧ(P)=−80. Tangentialebene z=−176−24(x+2)−80(y−5).',
 'Erst den Punktwert berechnen, danach zₓ=12x und zᵧ=−16y im Punkt auswerten und in z=z₀+zₓ(P)(x−x₀)+zᵧ(P)(y−y₀) einsetzen.');
B('2.31b',P,'Bestimme die Tangentialebene von z=√(36−x²−y²) im Punkt P(−1|2|z₀).',
 'z₀=√31. Tangentialebene: z=√31+(x+1)/√31−2(y−2)/√31.',
 'Die partiellen Ableitungen lauten zₓ=−x/√(36−x²−y²) und zᵧ=−y/√(36−x²−y²). Bei P einsetzen.');
B('2.35b',P,'Gegeben z=cos(4xy²). Bestimme zₓₓ und zᵧᵧ.',
 'Mit u=4xy²: zₓₓ=−16y⁴cos(u); zᵧᵧ=−8xsin(u)−64x²y²cos(u).',
 'Zuerst zₓ=−4y²sin(u), zᵧ=−8xy sin(u). Dann noch einmal differenzieren, bei zᵧᵧ Produkt- und Kettenregel.');
B('2.35c',P,'Gegeben z=tan(5x³y). Ermittle zₓₓ und zᵧᵧ.',
 'Mit u=5x³y: zₓₓ=30xy·sec²(u)+450x⁴y²sec²(u)tan(u); zᵧᵧ=50x⁶sec²(u)tan(u).',
 'Zuerst Ableitung von tan als sec², danach erneute Produkt- und Kettenregel. sec²(u)=1/cos²(u).');

B('2.36a',P,'Gegeben f(x,y)=e^(3xy)cos(2xy²). Bestimme fₓₓ und fᵧᵧ.',
 'Setze v=2xy². fₓₓ=e^(3xy)[(9y²−4y⁴)cos(v)−12y³sin(v)]. fᵧᵧ=e^(3xy)[(9x²−16x²y²)cos(v)−(24x²y+4x)sin(v)].',
 'Erste Ableitungen: fₓ=e^(3xy)[3ycos(v)−2y²sin(v)], fᵧ=e^(3xy)[3xcos(v)−4xy sin(v)]. Beim zweiten Ableiten Produkt- und Kettenregel.');
B('2.36b',P,'Gegeben f(x,y)=7e^(−2y)sin(4x²+y²). Bestimme fₓₓ und fᵧᵧ.',
 'Mit v=4x²+y²: fₓₓ=7e^(−2y)[8cos(v)−64x²sin(v)]; fᵧᵧ=7e^(−2y)[(4−4y²)sin(v)+(2−8y)cos(v)].',
 'Für fₓₓ ist e^(−2y) konstant. Für fᵧᵧ müssen exponentieller Faktor und Sinus beide nach y abgeleitet werden.');
B('2.36c',P,'Gegeben f(x,y)=4x²cos(x+y). Bestimme fₓₓ und fᵧᵧ.',
 'fₓₓ=8cos(x+y)−16xsin(x+y)−4x²cos(x+y); fᵧᵧ=−4x²cos(x+y).',
 'Beim zweimaligen Ableiten nach x entsteht aus dem Produkt 4x²·cos(x+y) ein zusätzlicher Term; nach y ist 4x² konstant.');
B('2.37',P,'Gegeben f(x,y)=3x⁴y²−4xy²+x²y³. Anna und Sebastian berechnen fᵧᵧ am Rechner und erhalten verschiedene Ergebnisse. Berechne fᵧᵧ selbst und prüfe den Fehler.',
 'fᵧ=6x⁴y−8xy+3x²y²; fᵧᵧ=6x⁴−8x+6x²y. Anna hat recht. Sebastian hat in seiner Ausgabe den Term −8x ausgelassen.',
 'Halte x konstant. Differenziere 3x⁴y² zweimal nach y ⇒6x⁴; −4xy² ⇒−8x; x²y³⇒6x²y. Sebastians Ergebnis enthält keinen Beitrag des Terms −4xy², denn seine zweite Ableitung nach y ist −8x.');
B('2.38b',P,'Gegeben z=2sin(4x)+5cos(6y), Q(π/6|π/4|z₀). Bestimme zₓₓ, zᵧᵧ und zₓᵧ in Q.',
 'zₓₓ=−32sin(4x), zᵧᵧ=−180cos(6y), zₓᵧ=0. In Q: zₓₓ=−16√3, zᵧᵧ=0, zₓᵧ=0.',
 'Die beiden Summanden hängen jeweils nur von einer Variablen ab. Das gemischte Ableiten liefert 0; in die zweiten Ableitungen danach π/6 bzw. π/4 einsetzen.');
B('2.38c',P,'Gegeben z=(x²+y)/(y−x), R(1|4|z₀). Bestimme zₓₓ, zᵧᵧ und prüfe zₓᵧ=zᵧₓ in R.',
 'zₓₓ=2y(y+1)/(y−x)³, zᵧᵧ=2x(x+1)/(y−x)³. In R: zₓₓ=40/27, zᵧᵧ=4/27, zₓᵧ=zᵧₓ=−13/27.',
 'Quotientenregel für beide ersten Ableitungen. Danach erneut differenzieren und am Ende x=1, y=4 einsetzen.');
B('2.38d',P,'Gegeben z=y·e^(sin x), S(π|−3|z₀). Bestimme zₓₓ, zᵧᵧ und die gemischte Ableitung am Punkt.',
 'zₓₓ=y e^(sin x)(cos²x−sin x), zᵧᵧ=0, zₓᵧ=e^(sin x)cos x. In S: zₓₓ=−3, zᵧᵧ=0, zₓᵧ=−1.',
 'Zweimal die Kettenregel und bei zₓₓ die Produktregel. Beim Ableiten nach y ist e^(sin x) konstant.');


/* The teacher explicitly requires 1.55–1.57 by hand: include all subparts. */
B('1.56b',I,'Ermittle das unbestimmte Integral: ∫(³√(x²)+5/x−3/x³)dx.',
 'F(x)=(3/5)x^(5/3)+5ln|x|+3/(2x²)+C.',
 'Schreibe ³√(x²)=x^(2/3) und −3/x³=−3x⁻³. Dann die rückwärts angewandte Potenzregel und Logarithmus-Stammfunktion nutzen.');
B('1.56c',I,'Ermittle das unbestimmte Integral: ∫(6x−5·⁴√x+³√(2x))dx.',
 'F(x)=3x²−4x^(5/4)+(3/8)(2x)^(4/3)+C.',
 '⁴√x=x^(1/4); für ³√(2x) ist eine Substitution u=2x mit du=2dx hilfreich. Am Ende +C.');
B('1.61c',I,'Ermittle das unbestimmte Integral: ∫(3−2x)/(x²−3x+4)² dx.',
 'F(x)=1/(x²−3x+4)+C.',
 'Nenner-Grundfunktion u=x²−3x+4, u′=2x−3. Zähler 3−2x=−u′. Also ∫−u′/u² dx=1/u.');


/* Subparts from original graph and application pages 2, 3 and 9. */
B('1.12b',K,'Eine Fahrt wird durch das Entfernungs-Zeit-Diagramm beschrieben. 2) Erkläre, warum zum Zeitpunkt t=3 keine Momentangeschwindigkeit berechnet werden kann.',
 'Die Funktion ist bei t=3 nicht differenzierbar: Linkssteigung 50/3 km/h, Rechtssteigung 0 km/h.',
 'Am Knick sind links- und rechtsseitige Differenzialquotienten unterschiedlich, also existiert dort keine gemeinsame Tangentensteigung.',null,{kind:'book-distance-time'});
B('1.12c',K,'Eine Fahrt wird durch das Entfernungs-Zeit-Diagramm mit (0|0),(3|50),(5|50),(8|0) beschrieben. 3) Zeichne das zugehörige Geschwindigkeit-Zeit-Diagramm.',
 'v(t)=50/3 km/h auf (0;3), v(t)=0 auf (3;5), v(t)=−50/3 auf (5;8); an den Knicken t=3 und t=5 ist v nicht eindeutig.',
 'Nimm die Steigung der drei Strecken des Entfernungs-Zeit-Diagramms. Diese Steigung ist die Geschwindigkeit.',null,{kind:'book-distance-time'});
B('1.12d',K,'Eine Fahrt wird durch das Entfernungs-Zeit-Diagramm beschrieben. 4) Berechne die mittlere Geschwindigkeit im Zeitintervall [0; 5].',
 'v_mittel=(50−0)/(5−0)=10 km/h.',
 'Die mittlere Änderungsrate ist der Differenzenquotient (s(5)−s(0))/5.',10,{kind:'book-distance-time'});
B('1.17b',K,'Die Temperatur T(t)=−0,16t³+0,82t²+0,8t+36,5 (0≤t≤6) steigt zunächst. Wann ist ihr Anstieg am stärksten?',
 'Der stärkste Temperaturanstieg liegt bei t=41/24≈1,708 h.',
 'Maximiere T′(t)=−0,48t²+1,64t+0,8. Für das Maximum von T′ gilt T″=−0,96t+1,64=0.',41/24);
B('1.17c',K,'Erkläre die Bedeutung von [T(5)−T(2)]/3 für eine Körpertemperaturfunktion T(t), t in Stunden.',
 'Die durchschnittliche Temperaturänderung von Stunde 2 bis Stunde 5, gemessen in °C pro Stunde.',
 'Differenzenquotient: Temperaturdifferenz ΔT geteilt durch Zeitdifferenz Δt=3 h.');
B('1.18c',K,'Eine Firma hat E(x)=−4x²+450x und K(x)=110x+1200. Berechne die Höhe des maximalen Gewinns.',
 'G(x)=−4x²+340x−1200; Maximum 6025 GE bei x=42,5.',
 'Gewinn ableiten: G′=−8x+340=0 ⇒ x=42,5. In G einsetzen. Für ganzzahlige Sessel bei x=42 oder 43 getrennt prüfen.',6025);
B('1.20b',K,'Wirkstoff-Konzentration K(t)=5(e^(−0,12t)−e^(−0,3t)), t in h. In welchem Zeitintervall liegt K(t) über 25 % ihres Maximums?',
 'Über der 25-%-Schwelle liegt K(t) etwa für 0,503 h < t < 20,697 h.',
 'Erst Maximum von K bei t≈5,0905 h berechnen, K_max≈1,62865. Gleichung K(t)=0,25·K_max numerisch zweimal lösen; dazwischen ist der Wert größer.');
B('1.20c',K,'Für K(t)=5(e^(−0,12t)−e^(−0,3t)) bestimme den Zeitpunkt der stärksten Konzentrationsabnahme.',
 'Bei t=ln(6,25)/0,18≈10,181 h ist K′(t) am stärksten negativ.',
 'Minimiere K′. Dazu K″(t)=5(0,0144e^(−0,12t)−0,09e^(−0,3t))=0 setzen und die Ableitungsvorzeichen prüfen.',Math.log(6.25)/.18);
B('1.20d',K,'Erkläre, welchem Wert K(t)=5(e^(−0,12t)−e^(−0,3t)) für t→∞ zustrebt.',
 'lim(t→∞)K(t)=0 mg/l.',
 'Beide Exponentialterme mit negativen Exponenten streben für große t gegen 0.');
B('1.71c',K,'Gegeben f′(x)=x²−4x und f(0)=4. Erkläre, warum f genau einen Wendepunkt hat, und bestimme ihn.',
 'f″=2x−4 hat genau eine Nullstelle x=2; f‴=2≠0. W(2|−4/3).',
 'Aus f′ integrieren: f=x³/3−2x²+4. Da f″ linear mit Steigung 2 ist, wechselt die Krümmung genau bei x=2.');
B('1.71d',K,'Gegeben f=x³/3−2x²+4 mit Hochpunkt H(0|4) und Wendepunkt W(2|−4/3). Ermittle die Gerade g durch H und W.',
 'g(x)=−(8/3)x+4.',
 'Steigung m=[−4/3−4]/(2−0)=−8/3. Mit H(0|4) ist der y-Achsenabschnitt 4.');
B('1.71e',K,'Zeige rechnerisch, dass die Gerade g(x)=−8x/3+4 zum Graphen f(x)=x³/3−2x²+4 auch im Tiefpunkt T(4|−20/3) verläuft.',
 'g(4)=−32/3+4=−20/3=f(4).',
 'Zuerst aus f′=x(x−4) den Tiefpunkt bei x=4 erkennen, dann beide Funktionen an x=4 auswerten.');
B('1.71f',K,'Zeichne f(x)=x³/3−2x²+4 und g(x)=−8x/3+4 in ein gemeinsames Koordinatensystem.',
 'Die Graphen treffen sich bei x=0, x=2 und x=4; H(0|4), W(2|−4/3), T(4|−20/3) sind markante Punkte.',
 'Setze f(x)=g(x) und faktorisiere (x/3)(x−2)(x−4)=0. Nutze die besonderen Punkte zum Skizzieren.',
 null,{curves:[{label:'f',poly:[1/3,-2,0,4]},{label:'g',poly:[-8/3,4]}],x:[-1,5],y:[-8,7]});
B('1.71g',F,'Berechne die Fläche zwischen f(x)=x³/3−2x²+4 und g(x)=−8x/3+4, die von beiden Graphen eingeschlossen wird.',
 'Schnittpunkte bei x=0,2,4. Gesamtfläche A=8/3 Flächeneinheiten.',
 'Auf (0;2) ist f über g, auf (2;4) ist g über f. A=∫₀²(f−g)dx+∫₂⁴(g−f)dx=4/3+4/3.',8/3);
B('1.74a',V,'Nach Öffnung einer Kanalschleuse ist v(t)=6,2t·e^(−1,4t) m³/s. Erkläre die Bedeutung des Integrals ∫₀⁴⁰v(t)dt.',
 'Es ist das Wasservolumen in m³, das während der ersten 40 Sekunden durch die Schleuse strömt.',
 'Durchflussgeschwindigkeit ist Volumen pro Zeit. Integrieren über die Zeit summiert das Gesamtvolumen.');


/* Complete source page 12 (1.89–1.92), preserving the provided formulas. */
B('1.89b',A,'Bestimme f′ und f″ von f(x)=³√x+2/√x−4/x³.',
 'f′=(1/3)x^(−2/3)−x^(−3/2)+12x^(−4); f″=−(2/9)x^(−5/3)+(3/2)x^(−5/2)−48x^(−5).',
 'Schreibe die Ausdrücke als Potenzen x^(1/3), 2x^(−1/2) und −4x^(−3). Dann zweimal die Potenzregel anwenden.');
B('1.89c',A,'Bestimme f′ und f″ von f(x)=−2x³+⁴√(x³).',
 'f′=−6x²+(3/4)x^(−1/4); f″=−12x−(3/16)x^(−5/4).',
 'Die vierte Wurzel von x³ ist x^(3/4), dann beide Glieder zweimal ableiten.');
B('1.90a',A,'Leite f(x)=(2x³−4x+5)³ ab.',
 'f′(x)=3(2x³−4x+5)²·(6x²−4).',
 'Kettenregel: Äußere Potenz drei ableiten und mit innerer Ableitung 6x²−4 multiplizieren.');
B('1.90b',A,'Leite g(x)=x²·ln(x) ab.',
 'g′(x)=2xln(x)+x, x>0.',
 'Produktregel, wobei (x²)′=2x und (ln x)′=1/x.');
B('1.90c',A,'Leite h(x)=(3x²−5)/(4−x²) ab.',
 'h′(x)=14x/(4−x²)² für x≠±2.',
 'Quotientenregel: [(6x)(4−x²)−(3x²−5)(−2x)]/(4−x²)²; im Zähler kürzen sich die kubischen Terme.');
B('1.91a',A,'Leite f(x)=sin²(5x) ab.',
 'f′(x)=10sin(5x)cos(5x)=5sin(10x).',
 'Äußere Funktion u² zu 2u ableiten; innere Ableitung von sin(5x) ist 5cos(5x).');
B('1.91b',A,'Leite g(x)=3cos(4x²) ab.',
 'g′(x)=−24xsin(4x²).',
 'Kettenregel: cos wird zu −sin, innere Ableitung 8x; der Faktor 3 bleibt erhalten.');
B('1.91c',A,'Leite h(x)=tan³(4x) ab.',
 'h′(x)=12tan²(4x)/cos²(4x).',
 'Äußere Potenzregel, Ableitung von tan(4x) ist 4/cos²(4x).');
B('1.92a',A,'Leite f(x)=e^(6x²)·ln(4x) ab.',
 'f′(x)=e^(6x²)[12xln(4x)+1/x].',
 'Produktregel mit der inneren Ableitung von e^(6x²), nämlich 12x·e^(6x²). Für ln(4x) ist die Ableitung 1/x.');
B('1.92b',A,'Leite g(x)=5x²·e^(7x) ab.',
 'g′(x)=e^(7x)(10x+35x²).',
 'Produktregel; e^(7x) wird beim Ableiten zu 7e^(7x).');
B('1.92c',A,'Leite h(x)=ln(³√(2x−1)) ab.',
 'h′(x)=2/[3(2x−1)], gültig für 2x−1>0.',
 'Logarithmengesetz h=(1/3)ln(2x−1), danach Kettenregel.');


/* Volume chapter screenshot 11: curves and solutions reconstructed from the printed parameters. */
B('1.79a',V,'Das Endstück einer Vorhangstange entsteht durch Drehung der dargestellten Kurve um die x-Achse. Die Kurve setzt sich aus einer Geraden g und einer Parabel p zusammen, wobei der Übergang in P knickfrei (d. h. mit gleicher Steigung) erfolgt. Bestimme die Funktionsgleichungen von g und p. Die eingezeichneten Koordinaten sind in mm angegeben.',
 'g(x)=x/2 für 0≤x≤20; p(x)=−x²/36+(29/18)x−100/9 für 20≤x≤50.',
 'Aus dem Diagramm: g geht durch (0|0) und P(20|10), also g(x)=0,5x. Beim Übergang in P müssen Funktionswert und Steigung übereinstimmen: p(20)=10 und p′(20)=0,5. Die Parabel endet auf der x-Achse: p(50)=0. Setze p(x)=ax²+bx+c an und löse die drei Gleichungen nach a, b und c.',
 null,{curves:[{label:'g',points:[[0,0],[20,10]]},{label:'p',poly:[-1/36,29/18,-100/9],domain:[20,50]}],x:[0,52],y:[0,14]});
B('1.79b',V,'Berechne die Masse des Endstücks der Vorhangstange, wenn die Dichte des Materials ρ=8,4 g/cm³ beträgt. Verwende die beiden in Schritt 1 bestimmten Teilfunktionen g auf [0;20] und p auf [20;50] sowie die Rotation um die x-Achse.',
 'V=π·(10625/3) mm³≈11126,84 mm³=11,12684 cm³. Die Masse beträgt m=8,4·V≈93,46 g.',
 'Bei Rotation um die x-Achse: V=π·[Integral von g(x)² mit Untergrenze 0 und Obergrenze 20 + Integral von p(x)² mit Untergrenze 20 und Obergrenze 50]. Es ergibt sich V=(10625π/3) mm³. Teile durch 1000 für cm³, danach m=ρ·V mit ρ=8,4 g/cm³.',8.4*10625*Math.PI/3000);
B('1.80a',V,'Die Form des Halbschnitts eines Kreisels (siehe Abbildung) kann durch die Gerade g und den Graphen der Funktion f beschrieben werden. f(x) = −√(0,5·(4−x)), x und y in cm. Stelle die Funktionsgleichung von g auf. Entnimm die dafür benötigten Werte aus der Grafik.',
 'g(x)=3−(3/4)x.',
 'Geradengleichung y=mx+b. Aus den Punkten m=(0−3)/(4−0)=−3/4 und b=3.');
B('1.80b',V,'Die Form des Kreisels entsteht durch Rotation der beiden Kurven g und f um die y-Achse. Der Kreisel soll aus einer Messing-Legierung mit einer Dichte von 8,7 g/cm³ hergestellt werden. Berechne die Masse des Kreisels.',
 'Rotationsvolumen ≈88,178 cm³; Masse ≈767,15 g.',
 'Nach x umstellen: x_g(y)=4−4y/3 für y∈[0;3], x_f(y)=4−2y² für y∈[−√2;0]. V=π∫₀³x_g(y)²dy+π∫₋√₂⁰x_f(y)²dy.',8.7*16*Math.PI*(8*Math.sqrt(2)+15)/15);
B('1.81a',V,'Die Glasinnenseite ist durch y=0,2(x²+1)²+0,8 beschrieben. Forme die Gleichung nach x² um.',
 'x²=√[(y−0,8)/0,2]−1.',
 'Erst 0,8 abziehen und durch 0,2 teilen, dann die positive Quadratwurzel ziehen und 1 abziehen.');
B('1.81b',V,'Berechne, wie viele Milliliter Flüssigkeit das Glas beinhaltet, wenn die Füllhöhe im Glas 4 cm beträgt.',
 'Der Glasboden liegt bei y=1 cm. 4 cm Füllhöhe bedeutet deshalb die Grenzen y=1 und y=5. Volumen V=π·Integral von (√(5y−4)−1) mit Untergrenze 1 und Obergrenze 5 ≈27,33 cm³=27,33 ml.',
 'Die Innenwand hat die Gleichung y=0,2(x²+1)²+0,8. Stelle nach x² um: x²=√(5y−4)−1. Bei Rotation um die y-Achse ist der Querschnitt π·x². Der Boden liegt bei y=1; eine Flüssigkeitshöhe von 4 cm reicht daher bis y=5. Integriere π·x² über y von 1 bis 5 und nutze 1 cm³ = 1 ml.');
B('1.81c',V,'Überprüfe nachweislich, ob es möglich ist, das Glas mit 40 ml Flüssigkeit zu füllen, wenn das Glas insgesamt 5,8 cm hoch ist.',
 'Nein. Die Modellkapazität bis y=5,8 cm beträgt etwa 36,86 ml und damit weniger als 40 ml.',
 'V_max=π∫₁^5,8[√(5y−4)−1]dy. Vergleiche das Ergebnis in cm³=ml mit 40 ml.');
B('1.82b',K,'Zeichne f(x)=x³/8−3x²/2+9x/2+1 im Intervall [1;7], markiere Maximum H(2|5) und Wendepunkt W(4|3).',
 'f(2)=5 mit f′(2)=0 und f″(2)<0. Bei x=4 ist f″(4)=0 und f′(4)=−3/2.',
 'Berechne eine kleine Wertetabelle und markiere die beiden besonderen Punkte. Die Kurve ist kubisch.',
 null,{curves:[{label:'f',poly:[1/8,-3/2,9/2,1]}],x:[1,7],y:[0,6]});


B('1.97a',I,'Bei ∫(2+sin(3x))dx wurde fälschlich 2x−3cos(3x)+C als Stammfunktion notiert. Finde und korrigiere den Fehler.',
 'Korrekt F(x)=2x−(1/3)cos(3x)+C.',
 'Wegen der inneren Ableitung 3 muss bei der Integration von sin(3x) durch 3 geteilt werden, nicht mit 3 multipliziert werden.');
B('1.97b',I,'Bei ∫(2x−1/x³)dx wurde fälschlich x²−3/x²+C notiert. Korrigiere.',
 'Korrekt F(x)=x²+1/(2x²)+C.',
 'Schreibe −1/x³=−x⁻³. Die Potenzregel rückwärts gibt (−1)/(−2)·x⁻²=1/(2x²).');
B('1.99',F,'Ein gerader Kanal ist 10 m lang. Sein Querschnitt wird durch f(x)=1+cos(2πx/3) für 0≤x≤3 beschrieben und ist spiegelbildlich. Das Wasser steht 1 m hoch. Berechne die Wassermenge in Hektolitern.',
 'Wasserquerschnitt A=3/π≈0,955 m²; Volumen ≈9,549 m³=95,49 hL.',
 'Wasser liegt unter y=1 und über f zwischen x=0,75 und 2,25. A=∫₀,₇₅²,₂₅(1−f(x))dx=3/π. Mit Kanallänge 10 multiplizieren, m³ in hL umrechnen.',300/Math.PI,
 {curves:[{label:'Kanalsohle',points:[[0,2],[0.375,1.707],[0.75,1],[1.125,.293],[1.5,0],[1.875,.293],[2.25,1],[2.625,1.707],[3,2]]},{label:'Wasserstand',points:[[0,1],[3,1]]}],area:{a:.75,b:2.25,between:true},x:[0,3],y:[-.15,2.3]});
B('1.100b',V,'Eine Drohne hat a(t)=0,0036t²−0,18t+2,25 und v(0)=3 m/s auf 0≤t≤25 s. Berechne die Geschwindigkeit nach 25 s.',
 'v(t)=0,0012t³−0,09t²+2,25t+3; v(25)=21,75 m/s.',
 'Beschleunigung integrieren, Anfangsgeschwindigkeit als Konstante verwenden und t=25 einsetzen.',21.75);
B('1.100c',V,'Erkläre die Bedeutung des Integrals ∫₀²⁵a(t)dt bei der Drohne mit Beschleunigung a(t)=0,0036t²−0,18t+2,25.',
 'Das Integral ist die Geschwindigkeitsänderung in 25 s, hier 18,75 m/s.',
 'Da a=v′ gilt ∫₀²⁵a(t)dt=v(25)−v(0)=21,75−3.');
B('1.100d',V,'Die Drohne startet mit v(0)=3 m/s und a(t)=0,0036t²−0,18t+2,25. Wann hat sie ab Messbeginn 200 m zurückgelegt?',
 'Nach etwa t≈14,410 s hat die Drohne 200 m zurückgelegt.',
 'Aus a erhält man v(t)=0,0012t³−0,09t²+2,25t+3. Der Weg ist s(t)=0,0003t⁴−0,03t³+1,125t²+3t. Löse s(t)=200 numerisch auf [0;25].',14.40984457896);


B('1.30b',V,'Beweise an einem selbst gewählten Beispiel, dass ein Quader mit quadratischer Grundfläche, dessen Kanten zusammen 144 cm messen, ein kleineres Volumen als der optimale Würfel hat.',
 'Beispiel: Grundkante a=10 cm, Höhe h=16 cm. Drahtlänge 8·10+4·16=144 cm; Volumen 10²·16=1600 cm³ <1728 cm³ beim Würfel.',
 'Die Nebenbedingung lautet h=36−2a. Nimm einen zulässigen anderen Wert a≠12 und vergleiche V=a²h mit 1728.');
B('1.94',K,'Diskutiere f(x)=4x³+3x²−2x+1 und zeichne Extrema, Wendepunkt sowie Wendetangente ein.',
 'f′=12x²+6x−2, f″=24x+6. Extremstellen x=(−3±√33)/12; Wendepunkt W(−1/4|13/8), Wendetangente y=−11x/4+15/16.',
 'Zuerst f′=0 mit der quadratischen Formel lösen, mit f″ typisieren. Wendestelle f″=0 bei −1/4, y-Wert und Tangentensteigung f′ einsetzen.',
 null,{curves:[{label:'f',poly:[4,3,-2,1]}],x:[-1.8,1.2],y:[-5,10]});
B('1.95a',K,'In einen Kreis mit Radius R=10 cm soll das flächengrößte Rechteck eingeschrieben werden. Berechne die Seitenlängen.',
 'Die optimale Form ist ein Quadrat mit Seitenlänge 10√2 cm. Maximalfläche A=200 cm².',
 'Bei Halbseiten a,b gilt a²+b²=R². Fläche A=4ab. Maximum bei a=b=R/√2, also Seitenlänge 2a=√2R.');
B('1.95b',K,'In einen Kreis mit Radius R=10 cm soll das flächengrößte gleichschenklige Dreieck eingeschrieben werden. Bestimme seine Seitenlängen.',
 'Das maximale Dreieck ist gleichseitig mit Seitenlänge 10√3 cm; Fläche A=75√3≈129,90 cm².',
 'Ein gleichseitiges Dreieck maximiert bei festem Umkreisradius die Fläche. Beim gleichseitigen Dreieck gilt R=a/√3 ⇒ a=R√3.');
B('1.96',K,'Ein Turm soll ein kegelförmiges Dach bekommen. Der Dachraum hat das Volumen 300 m³. Welche Höhe und welcher Radius minimieren die Materialkosten bei möglichst kleiner Mantelfläche?',
 'Optimal gilt h=√2r, r≈5,873 m, h≈8,306 m.',
 'Volumen V=(πr²h)/3=300 ⇒ h=900/(πr²). Mantelfläche M=πr√(r²+h²). Nach Einsetzen minimieren; daraus folgt r⁶=405000/π².',5.8729893455533);

if(new Set(R.map(x=>x.id)).size!==R.length)throw Error('Duplicate book IDs');
window.MATHS_BOOK_BANK=Object.freeze(R);
})();