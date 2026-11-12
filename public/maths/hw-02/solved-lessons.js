'use strict';
/* Hand-written teaching notes for EACH of the 18 textbook subproblems.
   The focus is on arithmetic and conceptual reasons, never memorizing rule names. */
window.MATHSVERSE_SOLUTIONS=(function(){
 const B=(lead,steps,result,note='')=>({lead,steps:steps.map(([heading,math,why])=>({heading,math,why})),result,note});
 const worked={
 '1.55a':B(
  'Gesucht ist eine Funktion F(x), deren Ableitung wieder 4x³−3x+1 ergibt. Wir rechnen jeden Summanden einzeln.',
  [
   ['Die drei Teile trennen','∫(4x³−3x+1) dx = ∫4x³ dx − ∫3x dx + ∫1 dx','Jeder Summand kann einzeln integriert werden. Das Minus vor 3x gehört zum zweiten Summanden.'],
   ['Den x³-Term integrieren','4 · x⁴/4 = x⁴','Beim Integrieren von x³ entsteht x⁴/4. Der vorhandene Faktor 4 kürzt sich mit dem Nenner 4.'],
   ['Den linearen Term integrieren','−3 · x²/2 = −1,5x²','Aus x wird x²/2. Multipliziert mit −3 ergibt das −3x²/2. Das Minus bleibt erhalten.'],
   ['Die Konstante integrieren','∫1 dx = x','Die Ableitung von x ist genau 1; deshalb wird aus 1 beim Integrieren x.'],
   ['Alles zusammenfassen','F(x) = x⁴ − 1,5x² + x + C','C ist eine beliebige Konstante: Jede feste Zahl verschwindet beim Ableiten. Bei einem unbestimmten Integral muss +C dabei sein.'],
   ['Probe durch Ableiten','F′(x) = 4x³ − 3x + 1','x⁴ wird zu 4x³, −1,5x² zu −3x und x zu +1. Das entspricht exakt dem Ausgangsterm.']
  ],'F(x) = x⁴ − 1,5x² + x + C',
  'Häufiger Fehler: Am Ende −x statt +x schreiben. Weil in der Angabe +1 steht, muss die Stammfunktion +x enthalten.'),
 '1.55b':B(
  'a und b sind feste Zahlen. Auch wenn ihre Werte nicht angegeben sind, werden sie beim Integrieren nach t wie gewöhnliche Vorfaktoren behandelt.',
  [
   ['Parameter von der Variablen unterscheiden','∫(a·t+b) dt','Nur t ändert sich. a und b sind hier Konstanten und werden nicht selbst integriert.'],
   ['Den ersten Summanden integrieren','∫a·t dt = a·t²/2','Aus t wird t²/2; a bleibt als Faktor davor stehen. Der Faktor a bleibt unverändert; nur die Integrationsvariable t erhält einen höheren Exponenten.'],
   ['Den zweiten Summanden integrieren','∫b dt = b·t','Die Ableitung von bt nach t ist b. Die Konstante b kann auch negativ sein: Das Vorgehen bleibt identisch, solange b nicht von t abhängt.'],
   ['Stammfunktion aufschreiben','F(t) = (a/2)t² + bt + C','Alle integrierten Summanden werden wieder addiert. Weil keine Grenzen vorgegeben sind, gehört die Konstante C dazu.'],
   ['Zurückableiten','F′(t) = at + b','Aus (a/2)t² wird at; aus bt wird b. Die Ableitung stimmt mit der Angabe überein.']
  ],'F(t) = (a/2)t² + bt + C',
  'Nicht vergessen: Ein Buchstabe ist nur dann Integrationsvariable, wenn nach ihm integriert wird – hier also t.'),
 '1.56a':B(
  'Hier stehen Brüche und eine dritte Wurzel im Term. Die Rechnung wird einfacher, wenn du zuerst alles als Potenzen von x schreibst.',
  [
   ['Bruch in eine negative Potenz verwandeln','3/x³ = 3x⁻³','Ein Faktor x im Nenner erhält beim Schreiben als Potenz ein negatives Vorzeichen im Exponenten.'],
   ['Kubikwurzel als Potenz schreiben','∛x = x^(1/3)','Eine dritte Wurzel entspricht dem Exponenten 1/3. Das Minus vor der Wurzel bleibt stehen.'],
   ['Umgeformte Angabe','∫(−5x² + 3x⁻³ − x^(1/3)) dx','Jetzt lässt sich auf jeden Summanden dasselbe Potenzverfahren anwenden.'],
   ['Ersten Summanden integrieren','∫−5x² dx = −(5/3)x³','Aus Exponent 2 wird 3, durch 3 teilen; der Vorfaktor −5 bleibt negativ.'],
   ['Zweiten Summanden integrieren','∫3x⁻³ dx = 3x⁻²/(−2) = −(3/2)x⁻²','Aus −3 wird −2. Weil du durch eine negative Zahl teilst, wird der zuvor positive Summand negativ.'],
   ['Wurzelterm integrieren','∫−x^(1/3) dx = −x^(4/3)/(4/3) = −(3/4)x^(4/3)','1/3 plus 1 ergibt 4/3. Durch 4/3 teilen heißt mit 3/4 multiplizieren.'],
   ['Ergebnis zusammenführen','F(x) = −(5/3)x³ − 3/(2x²) − (3/4)x^(4/3) + C','x⁻² lässt sich wieder als 1/x² schreiben. Jeder Bestandteil wurde integriert; C ergänzt die unbestimmte Stammfunktion.']
  ],'F(x) = −(5/3)x³ − 3/(2x²) − (3/4)x^(4/3) + C',
  'Der Ausdruck ist wegen 3/x³ bei x=0 nicht definiert. Die Stammfunktion gilt getrennt auf Intervallen ohne 0.'),
 '1.56b':B(
  'Dieses Integral braucht eine besondere Aufmerksamkeit: 5/x wird nicht mit der gewöhnlichen Potenzformel behandelt, sondern führt zum natürlichen Logarithmus.',
  [
   ['Dritte Wurzel umschreiben','∛(x²) = x^(2/3)','Der Wurzelexponent 3 kommt in den Nenner: Quadrat unter der Kubikwurzel ergibt die Potenz 2/3.'],
   ['Bruchterm umschreiben','−3/x² = −3x⁻²','So ist klar, dass hier eine negative Zweierpotenz steht. Dadurch kann der dritte Summand anschließend direkt mit den anderen Potenztermen integriert werden.'],
   ['Ersten Summanden integrieren','∫x^(2/3) dx = x^(5/3)/(5/3) = (3/5)x^(5/3)','2/3 + 1 = 5/3. Durch 5/3 teilen bedeutet, mit 3/5 multiplizieren.'],
   ['Sonderfall 5/x erkennen','∫5/x dx = 5 ln|x|','Bei x⁻¹ würde der neue Exponent 0 werden und man müsste durch 0 teilen. Dafür gibt es die Logarithmus-Stammfunktion.'],
   ['Letzten Summanden integrieren','∫−3x⁻² dx = −3x⁻¹/(−1) = 3/x','Weil durch −1 geteilt wird, ändern sich hier die beiden Minuszeichen zu Plus.'],
   ['Alle Teile addieren','F(x) = (3/5)x^(5/3) + 5 ln|x| + 3/x + C','Beim unbestimmten Integral kommt zum Schluss immer eine Konstante dazu.'],
   ['Wichtiger Definitionsbereich','x ≠ 0','Wegen 5/x und 3/x² ist die Funktion bei x=0 nicht definiert. Auf x>0 darfst du ln x schreiben, allgemein ln|x|.']
  ],'F(x) = (3/5)x^(5/3) + 5 ln|x| + 3/x + C',
  'Merke dir als Rechenentscheidung: Steht genau 1/x, entsteht ln|x|. Bei 1/x², 1/x³ usw. rechnest du mit negativen Potenzen.'),
 '1.57a':B(
  'Bei einem bestimmten Integral berechnest du nach der Stammfunktion einen festen Zahlenwert. Die Grenzen 0 und π gehören erst nach dem Integrieren in die Rechnung.',
  [
   ['Sinus integrieren','∫sin(t) dt = −cos(t) + C','Die Ableitung von −cos(t) ist +sin(t). Deshalb gehört das Minus vor den Kosinus.'],
   ['Grenzen einsetzen','∫₀^π sin(t) dt = [−cos(t)]₀^π = F(π)−F(0)','Die obere Grenze wird in die Stammfunktion eingesetzt und anschließend der Wert der unteren Grenze abgezogen.'],
   ['Obere Grenze ausrechnen','F(π) = −cos(π) = −(−1) = 1','Im Bogenmaß liegt π bei 180°. Der Kosinus von π ist −1. Das Vorzeichen ist wichtig: In der Stammfunktion steht bereits ein Minus vor cos(t).'],
   ['Untere Grenze ausrechnen','F(0) = −cos(0) = −1','Der Kosinus von 0 ist 1. Dieses negative Vorzeichen gehört noch zur Stammfunktion und muss beim anschließenden Subtrahieren mitgerechnet werden.'],
   ['Differenz bilden','1 − (−1) = 2','Das Minus vor der unteren Grenze wird mit dem negativen Funktionswert zu einem Plus.']
  ],'∫₀^π sin(t) dt = 2',
  'Im Graphen ist sin(t) zwischen 0 und π nicht negativ; deshalb ist der Integralwert hier zugleich der Flächeninhalt.'),
 '1.57b':B(
  'Dieses Beispiel zeigt, warum ein bestimmtes Integral auch 0 ergeben kann, obwohl unter dem Graphen sichtbare Flächen liegen.',
  [
   ['Kosinus integrieren','∫cos(x) dx = sin(x) + C','Die Ableitung des Sinus ist der Kosinus. Deshalb müssen wir den Kosinus nicht in einzelne Teilstücke zerlegen, um den Integralwert auszurechnen.'],
   ['Grenzen einsetzen','∫₀^(2π) cos(x) dx = sin(2π) − sin(0)','2π ist eine vollständige Periode des Kosinus. Für das Integral setzt du die Grenzen in die Stammfunktion ein.'],
   ['Oberen Wert berechnen','sin(2π) = 0','Nach einer ganzen Umdrehung ist der Sinus wieder am Startwert. Der zweite Funktionswert wird daher null, obwohl die Funktion zwischendurch positive und negative Werte hatte.'],
   ['Unteren Wert berechnen','sin(0) = 0','An der Stelle 0 ist der Sinus null. Das ist der Ausgangswert der Sinusfunktion und wird von dem oberen Stammfunktionswert abgezogen.'],
   ['Ergebnis interpretieren','0 − 0 = 0','Oberhalb der x-Achse zählt das Integral positiv, unterhalb negativ. Beide Beiträge gleichen sich über eine Periode genau aus.']
  ],'∫₀^(2π) cos(x) dx = 0',
  '0 ist der vorzeichenbehaftete Integralwert, nicht die geometrische Gesamtfläche. Für die gesamte Fläche müsste man die Beträge der Teilflächen addieren.'),
 '1.58a':B(
  'Beim Exponentialterm e^(2x) steht innen nicht nur x, sondern 2x. Daher entsteht beim Ableiten ein zusätzlicher Faktor 2, der beim Integrieren ausgeglichen werden muss.',
  [
   ['Den Aufbau erkennen','∫5e^(2x) dx','Die Zahl 5 ist ein fester Vorfaktor, der Term im Exponenten lautet 2x.'],
   ['Innere Ableitung bestimmen','(2x)′ = 2','Wenn du e^(2x) ableitest, entsteht 2e^(2x). Diesen Faktor müssen wir beim Integrieren durch Division ausgleichen, sonst wäre die Ableitungsprobe falsch.'],
   ['Beim Integrieren ausgleichen','∫e^(2x) dx = (1/2)e^(2x)','Das spätere zusätzliche Mal 2 wird durch den Faktor 1/2 ausgeglichen.'],
   ['Den Faktor 5 mitnehmen','F(x) = 5 · (1/2)e^(2x) + C = (5/2)e^(2x) + C','Der Vorfaktor gehört zur ganzen Funktion und bleibt bei der Integration erhalten.'],
   ['Ableitung zur Kontrolle','F′(x) = (5/2) · 2e^(2x) = 5e^(2x)','Der Faktor 2 aus dem Inneren kürzt den Nenner 2; genau die Angabe kommt zurück.']
  ],'F(x) = (5/2)e^(2x) + C',
  'Nicht einfach 5e^(2x) hinschreiben: Dessen Ableitung wäre 10e^(2x).'),
 '1.58b':B(
  'Der Sinus enthält den inneren Term 0,5t+π/2. Durch diesen inneren Faktor 0,5 unterscheidet sich die Stammfunktion von ∫sin(t)dt.',
  [
   ['Inneren Term benennen','u(t) = 0,5t + π/2','Die Verschiebung π/2 ist konstant, nur 0,5t ändert sich mit t. Sie ändert nur die Lage des Sinus, nicht die Größe der inneren Ableitung.'],
   ['Innere Ableitung ausrechnen','u′(t) = 0,5','π/2 wird beim Ableiten zu 0, und 0,5t zu 0,5. Genau diese Zahl muss später im Nenner der Stammfunktion berücksichtigt werden.'],
   ['Sinus-Stammfunktion bilden','∫sin(u) du = −cos(u)','Der Kosinus erhält beim Integrieren ein Minuszeichen. Das kannst du durch Ableiten von −cos(u) überprüfen: Die beiden Minuszeichen heben sich auf.'],
   ['Den inneren Faktor ausgleichen','F(t) = −cos(0,5t+π/2)/0,5 + C','Beim Ableiten würde 0,5 zusätzlich entstehen. Durch 0,5 teilen gleicht es aus.'],
   ['Vereinfachen','F(t) = −2cos(0,5t+π/2) + C','1/0,5 ist 2. Eine ebenso richtige Schreibweise ist 2sin(t/2)+C. Beide Schreibweisen liefern beim Ableiten dieselbe Ausgangsfunktion und sind daher gleichwertig.'],
   ['Ableiten als Probe','F′(t) = −2 · (−sin(0,5t+π/2)) · 0,5 = sin(0,5t+π/2)','Die beiden Minuszeichen und der Faktor 2·0,5 liefern wieder den ursprünglichen Sinus.']
  ],'F(t) = −2cos(0,5t+π/2) + C',
  'Entscheidend beim Integrieren: Erst die innere Ableitung ausrechnen, dann durch sie teilen (sofern sie eine feste, von null verschiedene Zahl ist).'),
 '1.66a':B(
  'Gesucht ist der Flächeninhalt zwischen f(x)=x²+6x und der x-Achse von −3 bis 2. Weil der Graph die x-Achse innerhalb des Intervalls schneidet, musst du die Fläche aufteilen.',
  [
   ['Nullstellen finden','x²+6x = x(x+6) = 0 ⇒ x₁=0, x₂=−6','Eine Fläche kann beim Überqueren der x-Achse das Vorzeichen wechseln. Darum zuerst die Nullstellen prüfen.'],
   ['Relevante Nullstelle wählen','−3 ≤ 0 ≤ 2, aber −6 liegt außerhalb','Die Stelle x=0 teilt dein Intervall in [−3;0] und [0;2]. Ohne diese Teilung würden sich positive und negative Integralanteile teilweise gegenseitig aufheben.'],
   ['Vorzeichen mithilfe des Graphen prüfen','f(−1)=1−6=−5; f(1)=1+6=7','Links von 0 liegt die Parabel unter, rechts davon oberhalb der x-Achse.'],
   ['Stammfunktion bilden','F(x) = x³/3 + 3x²','x² wird zu x³/3 und 6x zu 6x²/2=3x². Diese Stammfunktion wird in beiden Teilintervallen benötigt; wir müssen sie nicht zweimal bilden.'],
   ['Fläche links berechnen','F(−3)=(−27)/3+3·9=−9+27=18; F(0)=0','Der Integralwert von −3 bis 0 ist 0−18=−18, weil der Graph dort unter der x-Achse liegt.'],
   ['Ersten Betrag nehmen','A₁ = |F(0)−F(−3)| = |−18| = 18 FE','Geometrische Flächen dürfen nicht negativ sein. Daher nimmst du den Betrag.'],
   ['Fläche rechts berechnen','F(2)=8/3+3·4=8/3+12=44/3; A₂=44/3 FE','Rechts von 0 ist der Graph positiv, deshalb ist der Integralwert bereits ein Flächeninhalt.'],
   ['Beide Teilflächen addieren','A = 18 + 44/3 = 54/3+44/3 = 98/3 ≈ 32,667 FE','Nicht die beiden vorzeichenbehafteten Integrale einfach addieren: Gefragt ist die gesamte geometrische Fläche.']
  ],'A = 98/3 FE ≈ 32,667 FE',
  'Der Graph zeigt die beiden unterschiedlich liegenden Teilflächen. Genau deshalb musst du bei x=0 aufteilen.'),
 '1.67a':B(
  'Zwischen einer Parabel f und einer Geraden g entsteht eine eingeschlossene Fläche. Ihre linke und rechte Grenze findest du nicht in der Angabe, sondern an den Schnittpunkten beider Graphen.',
  [
   ['Schnittpunkte gleichsetzen','x²−3x−2 = 3x−1','An einem Schnittpunkt haben beide Funktionen denselben y-Wert. Deshalb setzt man die beiden Funktionsgleichungen gleich, statt bei einer einzelnen Nullstelle zu suchen.'],
   ['Alles auf eine Seite bringen','x²−6x−1 = 0','Auf beiden Seiten 3x abziehen und +1 addieren. Damit entsteht die quadratische Gleichung, deren zwei Lösungen die Grenzen der Fläche ergeben.'],
   ['Quadratische Gleichung lösen','x = (6 ± √(36+4))/2 = (6 ± √40)/2 = 3 ± √10','Mit der Lösungsformel für x²−6x−1 erhältst du zwei Schnittstellen.'],
   ['Integrationsgrenzen aufschreiben','a = 3−√10 ≈ −0,162; b = 3+√10 ≈ 6,162','Die eingeschlossene Fläche beginnt am linken Schnittpunkt und endet am rechten.'],
   ['Obere Funktion erkennen','g(x)−f(x) = (3x−1)−(x²−3x−2) = −x²+6x+1','Am Beispiel x=3 ist g(3)=8 und f(3)=−2. Deshalb liegt die Gerade g zwischen den Schnittstellen über f.'],
   ['Flächenintegral aufstellen','A = ∫₍₃₋√₁₀₎⁽₃₊√₁₀⁾ (−x²+6x+1) dx','Bei Flächen zwischen zwei Kurven integrierst du obere minus untere Funktion.'],
   ['Stammfunktion bilden','H(x) = −x³/3 + 3x² + x','Alle drei Summanden werden nacheinander integriert. Für −x² entsteht −x³/3, für 6x entsteht 3x² und für 1 entsteht x.'],
   ['Symmetrie zum Rechnen nutzen','u = x−3 ⇒ −x²+6x+1 = 10−u²','Die Parabel ist um x=3 symmetrisch. In u-Koordinaten gehen die Grenzen von −√10 bis +√10.'],
   ['Wert ausrechnen','A = [10u−u³/3]₋√₁₀^√₁₀ = 40√10/3','Oben ergibt sich (20/3)√10, unten −(20/3)√10. Die Differenz ist (40/3)√10.']
  ],'A = 40√10/3 FE ≈ 42,164 FE',
  'Wichtig: Es gibt hier keine vorgegebenen Grenzen. Erst Schnittpunkte bestimmen, dann obere minus untere Kurve verwenden.'),
 '1.98a':B(
  'Dieses bestimmte Integral enthält drei Summanden. Erst integrierst du den Term, dann setzt du die obere und die untere Grenze ein.',
  [
   ['Stammfunktion von x²','∫x² dx = x³/3','Exponent 2 um 1 auf 3 erhöhen; durch 3 teilen. So wird beim späteren Ableiten aus x³/3 wieder der ursprüngliche Term x².'],
   ['Stammfunktion von 4x','∫4x dx = 4x²/2 = 2x²','Aus x wird x²/2, und der Faktor 4 wird zu 2. Du kannst die Probe direkt machen: Die Ableitung von 2x² ist wieder 4x.'],
   ['Stammfunktion von −1','∫−1 dx = −x','Die Ableitung von −x ist −1. Das Vorzeichen der Konstanten bleibt beim Integrieren erhalten; aus +1 würde entsprechend +x.'],
   ['Gesamte Stammfunktion','F(x) = x³/3 + 2x² − x','Für das bestimmte Integral brauchst du kein +C, denn eine Konstante würde sich beim Subtrahieren ohnehin wegheben.'],
   ['Obere Grenze 4 einsetzen','F(4) = 4³/3 + 2·4² − 4 = 64/3+32−4 = 148/3','Immer in die Stammfunktion einsetzen, nicht in den ursprünglichen Integranden.'],
   ['Untere Grenze 1 einsetzen','F(1) = 1/3 + 2·1 − 1 = 4/3','Die untere Grenze wird genauso ausgewertet. Hier ergibt sich 1/3+2−1; die Summanden müssen mit ihren Vorzeichen berücksichtigt werden.'],
   ['Oben minus unten','F(4)−F(1) = 148/3 − 4/3 = 144/3 = 48','Das gesamte Integral ist die Differenz der beiden Stammfunktionswerte.']
  ],'∫₁⁴(x²+4x−1) dx = 48',
  'Tipp: Verwende Brüche bis zum Schluss. 148/3−4/3 geht einfacher als gerundete Dezimalzahlen.'),
 '1.98b':B(
  'Bei diesem Integral ist die innere Ableitung des Exponenten 2. Nach der Stammfunktion werden die Grenzen 0 und 1 eingesetzt.',
  [
   ['Exponenten prüfen','e^(2x), innen: 2x, Ableitung: 2','Beim Ableiten von e^(2x) entsteht wegen der inneren 2 ein zusätzlicher Faktor 2.'],
   ['Stammfunktion bilden','F(x) = e^(2x)/2','Durch 2 teilen gleicht genau diesen Zusatzfaktor aus. Bei der Probe wird aus e^(2x)/2 durch die innere Ableitung wieder e^(2x).'],
   ['Obere Grenze einsetzen','F(1) = e²/2','Für x=1 ist der Exponent 2·1 = 2. Der Faktor 1/2 bleibt vor der e-Funktion stehen, weil er ein konstanter Vorfaktor ist.'],
   ['Untere Grenze einsetzen','F(0) = e⁰/2 = 1/2','e hoch 0 ist 1. Deshalb entsteht unten 1/2 und nicht etwa 0: Eine Exponentialfunktion wird bei Exponent 0 zu 1.'],
   ['Subtrahieren','F(1)−F(0) = e²/2 − 1/2 = (e²−1)/2','Beide Terme haben denselben Nenner 2. Man kann sie direkt zusammenfassen, statt zuerst getrennt mit Dezimalwerten zu rechnen.'],
   ['Näherungswert','(e²−1)/2 ≈ 3,195','Erst ganz zum Schluss mit e≈2,71828 einen Dezimalwert ausrechnen.']
  ],'∫₀¹ e^(2x) dx = (e²−1)/2 ≈ 3,195',
  'Das Ergebnis ist positiv, weil e^(2x) überall oberhalb der x-Achse verläuft.'),
 '1.98c':B(
  'Hier steht eine dritte Wurzel im bestimmten Integral. Die Integrationsgrenzen sind beide positiv, daher lässt sich die Wurzel bequem als Potenz schreiben.',
  [
   ['Wurzel umformen','∛(x²) = x^(2/3)','Eine dritte Wurzel entspricht dem Exponenten 1/3; das Quadrat ergibt 2/3.'],
   ['Exponent erhöhen','2/3 + 1 = 5/3','Beim Integrieren von x^(2/3) wächst der Exponent um eins. Der neue Exponent ist 5/3; durch diesen neuen Wert teilen wir im nächsten Schritt.'],
   ['Durch den neuen Exponenten teilen','F(x) = x^(5/3)/(5/3) = (3/5)x^(5/3)','Ein Bruch im Nenner wird durch Multiplikation mit seinem Kehrwert aufgelöst.'],
   ['Obere Grenze 5 einsetzen','F(5) = (3/5) · 5^(5/3)','Das ist noch kein gerundeter Wert; die Potenz bleibt zunächst stehen.'],
   ['Untere Grenze 2 einsetzen','F(2) = (3/5) · 2^(5/3)','Auch hier wird die untere Grenze in F(x) eingesetzt. Hier wird x durch 2 ersetzt, einschließlich des gesamten Exponenten 5/3.'],
   ['Differenz bilden','F(5)−F(2) = (3/5)(5^(5/3)−2^(5/3))','Den gemeinsamen Faktor 3/5 kann man ausklammern. So bleibt der Rechenweg übersichtlich und es entstehen weniger Rundungsfehler.'],
   ['Mit dem Taschenrechner auswerten','≈ 6,867','Achte darauf, dass der Exponent 5/3 bei beiden Potenzen gilt und die Differenz in Klammern steht.']
  ],'∫₂⁵ ∛(x²) dx = (3/5)(5^(5/3)−2^(5/3)) ≈ 6,867',
  'Der Graph liegt im Intervall [2;5] oberhalb der x-Achse, also ist auch der Integralwert positiv.'),
 '1.98d':B(
  'Das Integral läuft von 0 bis π/2. Alle Winkel müssen im Bogenmaß interpretiert werden.',
  [
   ['Vorfaktor mitnehmen','∫3sin(x) dx = 3∫sin(x) dx','Die feste Zahl 3 kann vor dem Integral bleiben. Die Integration verändert nur sin(x), nicht den davorstehenden konstanten Faktor.'],
   ['Sinus integrieren','F(x) = −3cos(x)','Weil (−cos x)′=sin x, bleibt der Vorfaktor 3 erhalten und ein Minus entsteht.'],
   ['Obere Grenze einsetzen','F(π/2) = −3cos(π/2) = −3·0 = 0','Bei π/2 (90°) ist der Kosinus null. Der gesamte obere Stammfunktionswert wird dadurch null, unabhängig vom Vorfaktor −3.'],
   ['Untere Grenze einsetzen','F(0) = −3cos(0) = −3·1 = −3','Der Kosinus bei 0 ist 1. Deshalb ist der untere Stammfunktionswert −3 und wird danach vom oberen Wert abgezogen.'],
   ['Oben minus unten','F(π/2)−F(0) = 0−(−3) = 3','Die beiden Minuszeichen machen aus dem letzten Schritt ein Plus. Es wird also nicht −3 gerechnet, sondern 0+3, was den positiven Integralwert erklärt.']
  ],'∫₀^(π/2) 3sin(x) dx = 3',
  'Stell deinen Rechner auf RAD, nicht DEG, wenn du π/2 als Zahl eintippst.'),
 '1.100-1':B(
  'Die Beschleunigung a(t) ist gegeben. Daraus soll die Geschwindigkeit v(t) entstehen. Die Zusatzinformation v(0)=3 m/s entscheidet über die Integrationskonstante.',
  [
   ['Zusammenhang der Größen verstehen','a(t)=v′(t) ⇒ v(t)=∫a(t)dt','Beschleunigung sagt, wie schnell sich die Geschwindigkeit verändert. Deshalb erhältst du v durch Integrieren von a.'],
   ['Quadratischen Term integrieren','∫0,0036t² dt = (0,0036/3)t³ = 0,0012t³','Exponent von 2 auf 3 erhöhen und den Faktor durch 3 teilen. Du erhältst dadurch den ersten Anteil der Geschwindigkeit; die Konstante C kommt erst am Ende hinzu.'],
   ['Linearen Term integrieren','∫−0,18t dt = −(0,18/2)t² = −0,09t²','Aus t wird t²/2. Das Minus bleibt stehen. Dieser negative Geschwindigkeitsanteil ist ein Ergebnis der negativen Beschleunigungskomponente.'],
   ['Konstanten Term integrieren','∫2,25 dt = 2,25t','Die Ableitung von 2,25t ist 2,25. Es ist genau derjenige lineare Anteil, dessen Ableitung die konstante Beschleunigung 2,25 ergibt.'],
   ['Vorläufige Geschwindigkeit','v(t)=0,0012t³−0,09t²+2,25t+C','Weil eine Stammfunktion gesucht ist, erscheint zunächst die unbekannte Konstante C.'],
   ['Anfangswert einsetzen','v(0)=0+0+0+C=3 ⇒ C=3','Bei t=0 verschwinden alle Terme mit t. Die Drohne startet aber bereits mit 3 m/s.'],
   ['Fertige Geschwindigkeit','v(t)=0,0012t³−0,09t²+2,25t+3 [m/s]','Erst mit +3 erfüllt die Funktion die Anfangsbedingung. Der Startwert wird nicht erst nach 25 Sekunden addiert, sondern gehört zu jeder Zeit t zur Funktion.']
  ],'v(t) = 0,0012t³ − 0,09t² + 2,25t + 3 m/s',
  'Wichtig: Ohne den Startwert v(0)=3 kennst du nur die Form der Geschwindigkeit, aber nicht ihre tatsächliche Höhe.'),
 '1.100-2':B(
  'Die Geschwindigkeitsfunktion aus dem vorherigen Teil ist bekannt. Gesucht ist nicht eine neue Stammfunktion, sondern ihr Wert zur Zeit t=25 s.',
  [
   ['Die vorhandene Funktion aufschreiben','v(t)=0,0012t³−0,09t²+2,25t+3','Diese Funktion beschreibt zu jedem Zeitpunkt die Geschwindigkeit in m/s.'],
   ['Zeitpunkt einsetzen','v(25)=0,0012·25³−0,09·25²+2,25·25+3','Jedes t wird durch 25 ersetzt, auch wenn es hoch 2 oder hoch 3 vorkommt.'],
   ['Potenzen berechnen','25³=15625; 25²=625','Zuerst die Potenzen auswerten, damit die Vorfaktoren korrekt angewendet werden.'],
   ['Die vier Beiträge berechnen','0,0012·15625=18,75; −0,09·625=−56,25; 2,25·25=56,25','Die beiden mittleren Beiträge sind gleich groß mit entgegengesetztem Vorzeichen.'],
   ['Alle Beiträge addieren','18,75−56,25+56,25+3 = 21,75','−56,25 und +56,25 heben sich auf, übrig bleiben 18,75+3. Das ist die Geschwindigkeit nach genau 25 Sekunden, nicht die gesamte zurückgelegte Strecke.']
  ],'v(25) = 21,75 m/s',
  'Die Einheit ist m/s. 25 s ist ein Zeitpunkt, nicht die zurückgelegte Strecke.'),
 '1.100-3':B(
  'Das bestimmte Integral der Beschleunigung sagt, wie sehr sich die Geschwindigkeit zwischen t=0 und t=25 verändert hat.',
  [
   ['Die Bedeutung erkennen','∫₀²⁵ a(t) dt = v(25)−v(0)','Weil a(t)=v′(t) gilt, ist eine Stammfunktion der Beschleunigung die Geschwindigkeit.'],
   ['Anfangsgeschwindigkeit nennen','v(0)=3 m/s','Dieser Startwert war in der Aufgabe vorgegeben. Sie ist für die Differenz wichtig: Eine Geschwindigkeitsänderung beginnt nicht automatisch bei null.'],
   ['Endgeschwindigkeit übernehmen','v(25)=21,75 m/s','Das hast du im vorherigen Teil bereits ausgerechnet. In diesem Teil ist der bereits berechnete Funktionswert die obere Grenze des Beschleunigungsintegrals.'],
   ['Differenz bilden','Δv = 21,75−3 = 18,75 m/s','Die Geschwindigkeit steigt während des Zeitintervalls um 18,75 m/s.'],
   ['Einheit verstehen','(m/s²) · s = m/s','Beschleunigung mal Zeit ergibt eine Geschwindigkeitsänderung, keine Strecke.']
  ],'∫₀²⁵ a(t) dt = Δv = 18,75 m/s',
  'Verwechslung vermeiden: ∫a(t)dt verändert die Geschwindigkeit; ∫v(t)dt ergibt eine Orts- bzw. Streckenänderung.'),
 '1.100-4':B(
  'Jetzt wird nach der Zeit gesucht, bei der 200 Meter zurückgelegt wurden. Dafür musst du die Geschwindigkeit noch einmal integrieren und anschließend eine Gleichung lösen.',
  [
   ['Von Geschwindigkeit zur Strecke','s(t)=∫v(t)dt','Geschwindigkeit beschreibt den Wegzuwachs pro Sekunde; integrierst du sie über die Zeit, erhältst du den zurückgelegten Weg.'],
   ['Kubischen Term integrieren','∫0,0012t³ dt = 0,0003t⁴','Aus t³ wird t⁴/4; 0,0012 geteilt durch 4 ergibt 0,0003. Der Faktor 0,0003 ist also nicht geraten, sondern folgt aus dem Dividieren durch den neuen Exponenten.'],
   ['Quadratischen Term integrieren','∫−0,09t² dt = −0,03t³','Aus t² wird t³/3; −0,09/3 ist −0,03. Auch das Minus bleibt erhalten; sonst würde beim späteren Ableiten der Vorzeichenverlauf nicht stimmen.'],
   ['Die letzten beiden Terme integrieren','∫(2,25t+3)dt = 1,125t²+3t','Aus 2,25t wird 2,25t²/2, und aus 3 wird 3t. Beide Terme werden einzeln integriert und anschließend zur gesamten Streckenfunktion addiert.'],
   ['Streckenfunktion zusammenführen','s(t)=0,0003t⁴−0,03t³+1,125t²+3t+C','Weil ab t=0 zurückgelegte Strecke gezählt wird, gilt s(0)=0. Also ist C=0.'],
   ['200-Meter-Bedingung aufstellen','0,0003t⁴−0,03t³+1,125t²+3t=200','Gesucht ist der Zeitpunkt, an dem der gesamte Weg 200 m erreicht. Daher s(t)=200 setzen, nicht v(t)=200.'],
   ['Numerisch lösen','t ≈ 14,41 s','Die Gleichung ist vom vierten Grad. Im betrachteten Zeitintervall 0 bis 25 s kann sie mit einem Gleichungslöser oder Näherungsverfahren gelöst werden.'],
   ['Ergebnis plausibilisieren','s(14,41) ≈ 200 m','Setze die gefundene Zeit wieder in die Streckenfunktion ein. Dann muss annähernd 200 herauskommen.']
  ],'t ≈ 14,41 s',
  'Bei Bewegungsaufgaben auf die Einheiten achten: a(t) in m/s², v(t) in m/s und s(t) in m. Die gesuchte Variable ist hier t in Sekunden.')
 };
 return {worked, get(id){return worked[id]||null}};
})();