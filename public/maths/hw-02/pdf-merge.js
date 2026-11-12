'use strict';
/* Aligned with the user's eight-page "HÜ-Wiederholung Integralrechnung" PDF.
   Only the 10 overlapping MathsVerse tasks are enriched here; the remaining
   8 original tasks keep their independently written explanations.
   The PDF itself is NOT published to this public GitHub repository. */
window.MATHSVERSE_PDF_MERGE=(function(){
 const S=(title,math,why)=>({heading:title,math,why});
 const P=(pages,memo,steps,notes)=>({pages,memo,steps,notes});
 const matched={
 '1.66a':P('1–2','Erst Nullstellen, dann teilen, dann Betrag.',[
  S('1 · Nullstellen berechnen','x² + 6x = 0 ⇒ x(x + 6) = 0 ⇒ x₁ = 0, x₂ = −6','Zum Finden möglicher Vorzeichenwechsel setzt du f(x) gleich null. Das Produkt ist null, wenn x=0 oder x+6=0 gilt.'),
  S('2 · Intervall an der Nullstelle teilen','−3 ≤ x ≤ 2; nur x=0 liegt dazwischen ⇒ [−3; 0] und [0; 2]','Die Nullstelle −6 liegt links außerhalb des angegebenen Intervalls. Bei x=0 wechselt die Fläche von unterhalb zu oberhalb der x-Achse.'),
  S('3 · Stammfunktion bilden','∫x² dx = x³/3; ∫6x dx = 6x²/2 = 3x²','Du integrierst die zwei Summanden einzeln: Exponent um eins erhöhen und durch den neuen Exponenten dividieren.'),
  S('4 · Beide Teile zusammenfassen','F(x) = x³/3 + 3x²','Diese Stammfunktion benötigst du für beide Teilintervalle. Du musst nicht zweimal integrieren.'),
  S('5 · Erste Teilfläche: obere Grenze 0','F(0) = 0³/3 + 3·0² = 0','Beim Einsetzen der oberen Teilgrenze 0 verschwinden beide Potenzterme.'),
  S('6 · Erste Teilfläche: untere Grenze −3','F(−3) = (−3)³/3 + 3·(−3)² = −27/3 + 3·9 = −9 + 27 = 18','Die dritte Potenz von −3 ist negativ, das Quadrat ist positiv. Deshalb ergibt die Summe 18.'),
  S('7 · Integral links und Betrag','F(0) − F(−3) = 0 − 18 = −18 ⇒ A₁ = |−18| = 18 FE','Das Integral ist negativ, weil der Graph zwischen −3 und 0 unter der x-Achse liegt. Gefragt ist aber ein Flächeninhalt: also Betrag nehmen.'),
  S('8 · Zweite Teilfläche: obere Grenze 2','F(2) = 2³/3 + 3·2² = 8/3 + 12 = 44/3 ≈ 14,67','Um bei Brüchen sauber zu rechnen, schreibst du 12 als 36/3. Zusammen mit 8/3 ergibt das 44/3.'),
  S('9 · Zweite Teilfläche bestimmen','A₂ = F(2) − F(0) = 44/3 − 0 = 44/3 FE','Die Funktion liegt zwischen 0 und 2 oberhalb der x-Achse. Daher ist dieser Integralwert schon positiv.'),
  S('10 · Geometrische Gesamtfläche','A = A₁ + A₂ = 18 + 44/3 = 98/3 ≈ 32,67 FE','Beide positiven Teilflächen werden addiert. Würdest du die Integrale ohne Betrag zusammenzählen, bekämst du nicht die gesuchte geometrische Fläche.')
 ],'Das Schaubild zeigt die zwei getrennten Flächen A₁ (unterhalb) und A₂ (oberhalb) der x-Achse.'),
 '1.67a':P('3–4','Gleichsetzen, oben minus unten, integrieren.',[
  S('1 · Schnittpunkte durch Gleichsetzen','x² − 3x − 2 = 3x − 1','Die Fläche beginnt und endet dort, wo beide Graphen denselben y-Wert haben. Darum setzt du ihre Funktionsgleichungen gleich.'),
  S('2 · Quadratische Gleichung umformen','x² − 3x − 2 − 3x + 1 = 0 ⇒ x² − 6x − 1 = 0','Bringe alle Terme auf eine Seite, damit du die Schnittstellen mit der kleinen Lösungsformel berechnen kannst.'),
  S('3 · Kleine Lösungsformel anwenden','p = −6, q = −1 ⇒ x = −p/2 ± √((p/2)² − q)','Bei x²+px+q=0 setzt du p und q in die kleine Lösungsformel ein. Die PDF verwendet genau dieses Verfahren.'),
  S('4 · Schnittstellen als Grenzen erhalten','x = 3 ± √(9+1) = 3 ± √10 ⇒ a ≈ −0,162; b ≈ 6,162','Die kleinere Lösung ist die linke Integrationsgrenze, die größere die rechte. Die genauen Werte sind 3−√10 und 3+√10.'),
  S('5 · Welche Kurve ist oben?','f(0) = 0−0−2 = −2; g(0) = 0−1 = −1','Nimm eine Testzahl zwischen den beiden Schnittstellen, z. B. x=0. Da −1 größer als −2 ist, liegt g(x) oberhalb von f(x).'),
  S('6 · Oben minus unten aufstellen','g(x) − f(x) = (3x−1) − (x²−3x−2)','Für die geometrische Fläche zwischen zwei Kurven wird von der oberen Funktion die untere abgezogen.'),
  S('7 · Klammer auflösen','3x−1−x²+3x+2 = −x² + 6x + 1','Achtung: Das Minus vor der gesamten zweiten Klammer ändert ALLE Vorzeichen der Terme von f(x).'),
  S('8 · Stammfunktion der Differenz','D(x) = −x³/3 + 6x²/2 + x = −x³/3 + 3x² + x','Integriere −x², +6x und +1 einzeln. Daraus entsteht die Funktion D, mit der du obere und untere Grenze auswertest.'),
  S('9 · Obere Grenze ungefähr einsetzen','D(6,162) = −6,162³/3 + 3·6,162² + 6,162','Die PDF setzt den gerundeten rechten Schnittpunkt in alle x-Stellen der Stammfunktion ein. Nicht in f oder g einsetzen!'),
  S('10 · Oberen Funktionswert ausrechnen','≈ −233,97/3 + 3·37,97 + 6,162 ≈ −77,99 + 113,91 + 6,162 ≈ 42,08','Hier wird erst potenziert, dann mit den Vorfaktoren multipliziert und schließlich addiert.'),
  S('11 · Untere Grenze ungefähr einsetzen','D(−0,162) = −(−0,162)³/3 + 3·(−0,162)² − 0,162','Bei negativen Zahlen immer die Klammern um den eingesetzten Wert setzen, vor allem bei Quadraten und dritten Potenzen.'),
  S('12 · Unteren Funktionswert ausrechnen','≈ 0,0014 + 0,0787 − 0,162 ≈ −0,08','Die dritte Potenz ist negativ; davor steht noch ein Minus. Der erste Beitrag wird damit positiv.'),
  S('13 · Oberen minus unteren Wert rechnen','A = D(6,162) − D(−0,162) ≈ 42,08 − (−0,08) = 42,16 FE','Du ziehst den kompletten Wert an der linken Grenze ab. Weil er negativ ist, wird daraus ein Plus.'),
  S('14 · Genaues Ergebnis ergänzen','A = (40√10)/3 ≈ 42,16 FE','Die PDF rechnet anschaulich mit gerundeten Schnittstellen. Das exakte Resultat ist 40√10/3; beide Methoden ergeben denselben Flächeninhalt.')
 ],'Die Abkürzung „oben minus unten“ meint g(x)−f(x), NICHT obere minus untere x-Grenze. Erst danach rechnest du D(b)−D(a).'),
 '1.98a':P('5','Stammfunktion, oben einsetzen, minus unten einsetzen.',[
  S('1 · Jeden Summanden integrieren','∫x² dx = x³/3; ∫4x dx = 4x²/2; ∫(−1) dx = −x','Erhöhe bei jeder Potenz den Exponenten um 1 und teile durch den neuen Exponenten. Die Konstante −1 wird zu −x.'),
  S('2 · Stammfunktion zusammenfassen','F(x) = x³/3 + 2x² − x','Der Bruch 4x²/2 vereinfacht sich zu 2x². Bei einem bestimmten Integral kürzt sich eine zusätzliche Integrationskonstante später heraus.'),
  S('3 · Obere Grenze 4 einsetzen','F(4) = 4³/3 + 2·4² − 4 = 64/3 + 32 − 4','Die obere Grenze 4 wird überall in die STAMMFUNKTION eingesetzt. Zuerst die Potenzen ausrechnen.'),
  S('4 · Obere Grenze auswerten','F(4) = 64/3 + 28 = 64/3 + 84/3 = 148/3','Damit du Brüche sauber addieren kannst, bringst du die ganze Zahl 28 auf den Nenner 3.'),
  S('5 · Untere Grenze 1 einsetzen','F(1) = 1³/3 + 2·1² − 1 = 1/3 + 1 = 4/3','Berechne die untere Grenze separat. Die 1 wird ebenso in jeden x-Term eingesetzt.'),
  S('6 · Oben minus unten','F(4) − F(1) = 148/3 − 4/3 = 144/3 = 48','Beide Funktionswerte haben denselben Nenner 3. Du subtrahierst daher direkt die Zähler.')
 ],'Im Gegensatz zu Flächenaufgaben mit Vorzeichenwechsel brauchst du hier keine Aufteilung und keinen Betrag.'),
 '1.98b':P('5','Stammfunktion, oben einsetzen, minus unten einsetzen.',[
  S('1 · Exponentialfunktion ansehen','∫₀¹ e^(2x) dx','Innen im Exponenten steht 2x statt x. Dessen Ableitung ist 2, daher muss beim Integrieren durch 2 geteilt werden.'),
  S('2 · Stammfunktion bilden','F(x) = e^(2x)/2','Die Kontrolle durch Ableiten zeigt, warum der Nenner 2 nötig ist: (e^(2x)/2)′ = e^(2x).'),
  S('3 · Obere Grenze 1 einsetzen','F(1) = e²/2 ≈ 7,389/2 ≈ 3,695','Für x=1 lautet der Exponent 2. Danach mit der e-Taste am Taschenrechner den Wert berechnen.'),
  S('4 · Untere Grenze 0 einsetzen','F(0) = e⁰/2 = 1/2 = 0,5','e hoch 0 ist genau 1. Deshalb wird beim Einsetzen der unteren Grenze nicht 0, sondern 0,5 herauskommen.'),
  S('5 · Die Werte voneinander abziehen','F(1) − F(0) ≈ 3,695 − 0,5 ≈ 3,19','Die PDF zeigt diesen Rechenweg mit gerundeten Zahlen. Exakt lautet das Ergebnis (e²−1)/2 ≈ 3,1945.')
 ],'Die gerundeten Zwischenschritte aus der PDF ergeben ungefähr 3,19. Als exakte Antwort kannst du (e²−1)/2 schreiben.'),
 '1.98c':P('5','Wurzel als Hochzahl, Stammfunktion, Werte einsetzen.',[
  S('1 · Dritte Wurzel als Potenz schreiben','∛(x²) = x^(2/3)','Eine dritte Wurzel entspricht dem Exponenten 1/3. Unter der Wurzel steht x², deshalb ergibt sich die Potenz 2/3.'),
  S('2 · Den Exponenten um 1 erhöhen','2/3 + 1 = 5/3','In der Stammfunktion wird daraus also x^(5/3). Der neue Exponent muss gleich auch im Nenner vorkommen.'),
  S('3 · Stammfunktion bilden','F(x) = x^(5/3)/(5/3) = (3/5)x^(5/3)','Durch den Bruch 5/3 teilen ist dasselbe wie mit 3/5 multiplizieren. Daher steht vor der Potenz 3/5 bzw. 0,6.'),
  S('4 · Obere Grenze 5 einsetzen','F(5) = 0,6 · 5^(5/3) ≈ 0,6 · 14,620 ≈ 8,772','Die Potenz 5^(5/3) berechnest du mit dem Taschenrechner. Erst danach multiplizierst du mit 0,6.'),
  S('5 · Untere Grenze 2 einsetzen','F(2) = 0,6 · 2^(5/3) ≈ 0,6 · 3,175 ≈ 1,905','Verwende für beide Grenzen denselben Exponenten 5/3 und denselben Vorfaktor 0,6.'),
  S('6 · Oben minus unten','F(5) − F(2) ≈ 8,772 − 1,905 ≈ 6,87','Die PDF rechnet zuletzt mit drei Nachkommastellen. Exakt ist das Integral (3/5)(5^(5/3)−2^(5/3)).')
 ],'Gib für Wurzelexponenten am Taschenrechner die Klammern mit ein: 5^(5/3) und 2^(5/3).'),
 '1.98d':P('6','Stammfunktion, oben einsetzen, minus unten einsetzen.',[
  S('1 · Sinus integrieren','∫₀^(π/2) 3sin(x) dx ⇒ F(x) = −3cos(x)','Die Stammfunktion von sin(x) ist −cos(x). Der feste Vorfaktor 3 bleibt davor stehen.'),
  S('2 · Taschenrechner auf RAD stellen','π/2 entspricht 90°, aber die Winkel stehen im Bogenmaß','Wenn du π als Zahl eingibst, muss dein Rechner auf RAD (Radiant) stehen, sonst erhältst du falsche trigonometrische Werte.'),
  S('3 · Obere Grenze π/2 einsetzen','F(π/2) = −3cos(π/2) = −3 · 0 = 0','Bei π/2 hat der Kosinus den Wert 0; folglich verschwindet hier der ganze obere Ausdruck.'),
  S('4 · Untere Grenze 0 einsetzen','F(0) = −3cos(0) = −3 · 1 = −3','Bei x=0 ist cos(0)=1. Der negative Vorfaktor bleibt deshalb als −3 stehen.'),
  S('5 · Die beiden Werte subtrahieren','F(π/2) − F(0) = 0 − (−3) = 3','Das Minus vor dem negativen unteren Funktionswert macht aus −(−3) ein Plus.')
 ],'Den Taschenrechner bei Aufgaben mit π unbedingt im RAD-Modus verwenden.'),
 '1.100-1':P('7','Beschleunigung integrieren gibt Geschwindigkeit; +C nicht vergessen.',[
  S('1 · Zusammenhang verstehen','a(t) = v′(t) ⇒ v(t) = ∫a(t) dt','Beschleunigung ist die Änderung der Geschwindigkeit pro Zeit. Integrierst du die Beschleunigung, bekommst du die Geschwindigkeitsfunktion.'),
  S('2 · Ersten Term integrieren','0,0036t² → 0,0036t³/3 = 0,0012t³','Beim Term mit t² erhöhst du die Potenz auf 3 und teilst den Vorfaktor durch 3.'),
  S('3 · Zweiten Term integrieren','−0,18t → −0,18t²/2 = −0,09t²','Das Minuszeichen vor dem linearen Term bleibt stehen. Beim Integrieren wird aus t die Potenz t²/2.'),
  S('4 · Konstanten Term integrieren','2,25 → 2,25t','Eine konstante Beschleunigung liefert eine linear zunehmende Geschwindigkeit.'),
  S('5 · Noch unbestimmte Geschwindigkeitsfunktion','v(t) = 0,0012t³ − 0,09t² + 2,25t + C','Die unbestimmte Integration liefert zusätzlich die Konstante C, die du aus der Startgeschwindigkeit bestimmst.'),
  S('6 · Anfangswert v(0)=3 einsetzen','v(0) = 0 − 0 + 0 + C = 3 ⇒ C = 3','Bei t=0 verschwinden alle Terme mit t. Übrig bleibt nur die Konstante C, die somit 3 sein muss.'),
  S('7 · Fertige Geschwindigkeitsfunktion','v(t) = 0,0012t³ − 0,09t² + 2,25t + 3','Mit C=3 berücksichtigt die Funktion, dass die Drohne bereits am Anfang mit 3 m/s fliegt.')
 ],'Wichtig für alle vier Drohnen-Teile: a(t) beschreibt m/s², v(t) m/s, der Weg s(t) Meter.'),
 '1.100-2':P('7','Den gesuchten Zeitpunkt in die Geschwindigkeitsfunktion einsetzen.',[
  S('1 · Ausgangsfunktion übernehmen','v(t) = 0,0012t³ − 0,09t² + 2,25t + 3','Die Funktion kommt aus Teil 1. Sie beschreibt die Geschwindigkeit für jeden Zeitpunkt t.'),
  S('2 · t durch 25 ersetzen','v(25) = 0,0012 · 25³ − 0,09 · 25² + 2,25 · 25 + 3','Die Frage lautet „nach 25 Sekunden“. Deshalb wird in jedem Term t=25 eingesetzt.'),
  S('3 · Potenzen ausrechnen','25³ = 15625; 25² = 625','Die Hochzahlen berechnest du vor den Multiplikationen, sonst ergeben sich falsche Werte.'),
  S('4 · Produkte ausrechnen','v(25) = 0,0012 · 15625 − 0,09 · 625 + 56,25 + 3','Die PDF führt die Potenzen als Zwischenschritt aus, bevor sie alles addiert.'),
  S('5 · Einzelwerte bilden','v(25) = 18,75 − 56,25 + 56,25 + 3','Die negativen und positiven Beiträge mit 56,25 heben sich gegenseitig auf.'),
  S('6 · Geschwindigkeit ablesen','v(25) = 21,75 m/s','Das ist ein Geschwindigkeitswert, keine Strecke. Die Einheit lautet deshalb Meter pro Sekunde.')
 ],'Die v(t)-Kurve ist im PDF die zentrale Grafik: Der Punkt bei t=25 liegt bei 21,75 m/s.'),
 '1.100-3':P('7','Das Beschleunigungsintegral ist die Änderung der Geschwindigkeit.',[
  S('1 · Bedeutung des Integrals','∫₀²⁵ a(t) dt = v(25) − v(0)','Weil v(t) eine Stammfunktion von a(t) ist, erhältst du durch obere minus untere Grenze genau die Geschwindigkeitsänderung.'),
  S('2 · Endgeschwindigkeit übernehmen','v(25) = 21,75 m/s','Diesen Wert hast du im vorherigen Teil bereits durch Einsetzen von t=25 ausgerechnet.'),
  S('3 · Startgeschwindigkeit übernehmen','v(0) = 3 m/s','Die Anfangsgeschwindigkeit ist direkt in der Aufgabenstellung gegeben.'),
  S('4 · Die Änderung ausrechnen','Δv = 21,75 − 3 = 18,75 m/s','Subtrahiere den Startwert vom Endwert, denn gefragt ist die Veränderung während der ersten 25 Sekunden.'),
  S('5 · Antwort in Worten','Die Geschwindigkeit nimmt in den ersten 25 s um 18,75 m/s zu.','Die PDF verlangt ausdrücklich die Interpretation. Du schreibst nicht „18,75 Meter“, denn ein Beschleunigungsintegral hat die Einheit m/s.')
 ],'Achtung: Das Integral von a(t) gibt die Geschwindigkeitsänderung, nicht die zurückgelegte Strecke.'),
 '1.100-4':P('8','Geschwindigkeit integrieren gibt Strecke; für 200 m eine Zeit annähern.',[
  S('1 · Von Geschwindigkeit zur Strecke wechseln','s(t) = ∫v(t) dt','Die Fläche unter der v(t)-Kurve beschreibt die zurückgelegte Strecke. Daher wird die Geschwindigkeitsfunktion integriert.'),
  S('2 · Kubischen Term integrieren','0,0012t³ → 0,0012t⁴/4 = 0,0003t⁴','Die Hochzahl 3 wächst um eins auf 4. Danach wird 0,0012 durch 4 geteilt.'),
  S('3 · Quadratischen Term integrieren','−0,09t² → −0,09t³/3 = −0,03t³','Das Minus bleibt erhalten. Aus t² wird t³/3, daher lautet der Faktor −0,03.'),
  S('4 · Die letzten Terme integrieren','2,25t → 2,25t²/2 = 1,125t²; 3 → 3t','Der lineare Geschwindigkeitsanteil liefert einen quadratischen Weganteil, der konstante Anteil einen linearen.'),
  S('5 · Streckenfunktion aufschreiben','s(t) = 0,0003t⁴ − 0,03t³ + 1,125t² + 3t','Der Weg wird ab t=0 gezählt, also s(0)=0. Deshalb fällt eine zusätzliche Konstante hier weg.'),
  S('6 · Die Bedingung 200 m formulieren','s(t) = 200','Gesucht ist die Zeit, bei der die Strecke 200 Meter beträgt. Du setzt also die Wegfunktion gleich 200, nicht die Geschwindigkeit.'),
  S('7 · Erste Probe mit t=14','s(14) = 0,0003·38416 − 0,03·2744 + 1,125·196 + 3·14 ≈ 191,7 m','14 Sekunden sind noch zu früh: Die Drohne hat rund 191,7 m und damit noch weniger als 200 m zurückgelegt.'),
  S('8 · Zweite Probe mit t=14,5','s(14,5) ≈ 13,26 − 91,46 + 236,53 + 43,5 ≈ 201,8 m','14,5 Sekunden sind etwas zu spät, denn der Wert liegt über 200 m. Die Lösung muss also zwischen 14 und 14,5 liegen.'),
  S('9 · Näherungsprobe mit t=14,4','s(14,4) ≈ 12,90 − 89,58 + 233,28 + 43,2 ≈ 199,8 m','Bei 14,4 Sekunden bist du nur noch etwa 0,2 m vom Ziel entfernt. Für die Näherung wie im PDF reicht das.'),
  S('10 · Zeit als Antwort angeben','t ≈ 14,4 s (genauer t ≈ 14,41 s)','Die PDF arbeitet mit einfachen Probewerten ohne GeoGebra. Der auf zwei Nachkommastellen genauere Wert bestätigt die Rechnung.')
 ],'Statt eine komplizierte Gleichung vierten Grades von Hand aufzulösen, grenzt die PDF die Zeit mithilfe einer Wertetabelle mit 14; 14,5 und 14,4 Sekunden ein.')
 };
 function install(original){
  for(const [id,entry] of Object.entries(matched)){
   const target=original.get(id);
   if(!target)throw Error('Fehlendes MathsVerse-Buchbeispiel '+id);
   // Retain the existing introduction and final result, but use the exact PDF
   // order and intermediate numerical arithmetic for the worked calculation.
   target.steps=entry.steps.map(step=>({...step}));
   target.pdf={pages:entry.pages,memo:entry.memo,notes:entry.notes};
  }
  return original;
 }
 return {matched,ids:Object.keys(matched),install};
})();