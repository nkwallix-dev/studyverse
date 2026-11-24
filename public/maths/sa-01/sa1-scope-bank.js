/* MathsVerse SA1 – strikt am Unterrichtsstoff 19.11.2026 und HTL-Cluster orientiert.
 * Datenquellen werden NICHT vermischt: amtliche Original-PDFs, vom Nutzer
 * fotografierte Übungszettel und ausdrücklich eigenständige Trainingsaufgaben.
 * Nur hier kuratierter Pool wird im "4. Deskriptor" und im Bosskampf verwendet.
 * Buchbeispiele und Lern-/Inventarfortschritt bleiben unverändert.
 */
(function () {
  'use strict';
  const existing = window.MATHS_POOL_BANK || [];
  const Q = [];
  const keepOriginal = ['B_405 a', 'B_405 d', 'A_299 a', 'A_309 a', 'A_317 a', 'A_318 a', '1_1309'];
  for (const number of keepOriginal) {
    const original = existing.find((q) => q.number === number);
    if (!original) throw new Error('Original-SRDP-Beispiel fehlt: ' + number);
    Q.push({ ...original, origin: 'official', sourceLabel: 'Amtliche SRDP-Aufgabe', primary: number.startsWith('B_405') ? (number.endsWith(' a') ? '4.2' : '4.4') : '4.8' });
  }

  const chapter = {
    '4.1': 'Grenzwerte und Stetigkeit (kurz)',
    '4.2': 'Differenzen- und Differentialquotient',
    '4.3': 'Ableitungsregeln (händisch)',
    '4.4': 'Tangenten, Monotonie, Extrema und Wendepunkte',
    '4.5': 'Funktion, Ableitung und Stammfunktion',
    '4.6': 'Stammfunktionen (händisch)',
    '4.8': 'Bestimmtes Integral und Anwendungen',
    'B_T_4.1': 'Sättigung, Abklingen und Unstetigkeit',
    'B_T2_4.2': 'HTL 2: Sinus, Logarithmus und Quotientenregel',
    'B_T2_4.4': 'HTL 2: Anwendungen der Differentialrechnung',
    'B_T2_4.5': 'HTL 2: Anwendungen der Integralrechnung',
    'partial': 'Zusatz laut Lehrer: partielle Ableitungen',
    'parts': 'Zusatz laut Lehrer: partielle Integration'
  };
  const add = (id, primary, title, prompt, guide, solution, opts = {}) => {
    if (!chapter[primary]) throw new Error('Unbekanntes Kapitel ' + primary);
    Q.push({
      id: 'exam-scope-' + id,
      number: id,
      title, part: 'Aufgabe',
      descriptor: primary,
      primary,
      category: chapter[primary],
      prompt: '✏️ Nimm Stift und Papier. ' + prompt,
      guide,
      solution,
      source: opts.image ? 'lernzettel/' + opts.image + '.webp' : 'Studyverse · gezielte Übung zur Schularbeit am 26.11.2026',
      kind: opts.image ? 'worksheet' : 'practice',
      origin: opts.image ? 'classroom' : 'studyverse',
      sourceLabel: opts.image ? 'Dein Unterrichts-Lernzettel · Originalfoto' : 'Selbst erstelltes Stoffplan-Training · keine amtliche Maturaaufgabe',
      expected: opts.expected ?? undefined,
      activity: opts.activity || (primary === '4.8' || primary === 'B_T2_4.5' ? 'GeoGebra + Deutung' : 'Händisch'),
      sheet: opts.image || null,
      officialNumber: opts.officialNumber || null
    });
  };

  // Neun thematisch PASSENDE Fotos aus dem vom Nutzer gelieferten LernZettel.zip;
  // das Schwimmbad-Blatt B_602 enthält im gezeigten Teil nur Proportionalität.
  add('B_673 a', '4.2', 'Im Vergnügungspark – Freifall',
    'Eine Kabine fällt aus 80 m Höhe aus dem Stillstand. Es gilt a=10 m/s². Berechne die Geschwindigkeit nach 2 s in km/h und wähle aus der Originalgrafik den zur Höhe passenden Verlauf.',
    'v(t)=a·t für den Geschwindigkeitsbetrag. Für h(t)=80−5t² gilt h′(0)=0 und h″<0. Beachte die Einheit km/h.',
    'v(2)=20 m/s=72 km/h. Richtiger Höhenverlauf: startet mit waagrechter Tangente und wird zunehmend steiler fallend (im Arbeitsblatt die dritte Grafik).',
    {image:'b-673', officialNumber:'B_673 a', activity:'Händisch · Deutung'});
  add('B_684 b','4.5','Bewegung von Roboterarmen – Funktion und Ableitung',
    'Im Originalblatt ist ein positiver, glockenförmiger Geschwindigkeitsgraph v(t) eines Roboterarms dargestellt. Vergleiche Aussagen über die Wegfunktion s, das Integral von v und die Beschleunigung a=v′. Markiere die nicht zutreffende Aussage.',
    's′=v, a=v′. Das Integral von v liefert eine Wegänderung; a ist vor dem Geschwindigkeitsmaximum positiv und danach negativ. Interpretiere die Symmetrie der Kurve.',
    'Im Lernzettel wurde die letzte Aussage als nicht zutreffend angekreuzt. Prüfe zusätzlich die Integralausdrücke und die Vorzeichen von a an den vier Zeitpunkten.',
    {image:'b-684', officialNumber:'B_684 b', activity:'Händisch · Graphinterpretation'});
  add('B_649 b','B_T_4.1','Regelung der Temperatur – Grenzwert',
    'T(t)=a−15·e^(−0,05t)·cos(0,1t), t in Minuten. Erkläre, warum T(t) für t→∞ gegen a geht. Bestimme danach mit GeoGebra das Temperaturmaximum im Intervall 0<t<40 und interpretiere das im Original gezeigte Mittelwertintegral.',
    'Der Cosinus bleibt zwischen −1 und 1, aber e^(−0,05t) geht gegen 0. Für das Maximum T′(t)=0 im Intervall lösen; (1/t₁)∫₀^t₁T(t)dt ist eine mittlere Temperatur.',
    'Der Exponentialfaktor geht gegen 0, also T(t)→a. Aus T′(t)=0 folgt im Intervall 0<t<40 die Maximalstelle t≈26,78 min (nicht die handschriftlich notierten 30,92 min). Ein Mittelwertintegral wird in °C interpretiert.',
    {image:'b-649',officialNumber:'B_649 b',activity:'GeoGebra · Interpretation'});
  add('B_615 b','4.8','Dreibein – Rotationsvolumen',
    'Der Querschnitt eines Topfes ist durch y=x⁴/500 begrenzt und um die y-Achse rotierbar. Der Rand liegt bei y=20 cm; Wasser steht bis y=15 cm. Berechne das Wasservolumen in cm³.',
    'Löse x⁴=500y nach x² auf. Für die Rotation um die y-Achse gilt V=π·∫₀¹⁵ r(y)² dy. Mit GeoGebra rechnen.',
    'r(y)²=√(500y). Also V=π·∫₀¹⁵√(500y)dy=(2π√500/3)·15^(3/2)≈2 721 cm³ (gerundet).',
    {image:'b-615',officialNumber:'B_615 b'});
  add('B_685 d','4.8','Sauna – Rotationskörper als Integral',
    'Der Querschnitt eines Aufgusskübels folgt y=kx+d. Die Innenseite entsteht durch Rotation um die y-Achse von y=0 bis y=h. Ergänze die fehlenden Größen in V=π·∫(r(y))²dy.',
    'Stelle die Gerade nach x um: x=(y−d)/k. Der Radius ist r(y)=|x(y)|; integriere von 0 bis h.',
    'V=π·∫₀ʰ((y−d)/k)²dy. Die drei gesuchten Stellen sind h, d und k (in dieser Reihenfolge).',
    {image:'b-685',officialNumber:'B_685 d'});
  add('B_660 b','4.8','Millau-Brücke – Fläche und Krümmung',
    'Zwischen x=a und x=b liegt die grau markierte Fläche zwischen einem Graphen f und dem Wert f(b). Stelle die Flächenformel auf und vergleiche die Steigungen mithilfe des Originalgraphen.',
    'Fläche zwischen Kurve und unterer Horizontalen: ∫ₐᵇ(f(x)−f(b))dx. Bei fallender, konvexer Funktion nimmt f′ von links nach rechts zu.',
    'A=∫ₐᵇf(x)dx−(b−a)·f(b). Laut Originalgraph ist f′(a)<f′(b), und der Mittelwert der Funktionshöhe an den Rändern liegt über f((a+b)/2).',
    {image:'b-660',officialNumber:'B_660 b'});
  add('B_661 a','4.8','Reha-Zentrum – Integral als Luftvolumen',
    'Ein Diagramm zeigt den Atemfluss f(t) in Liter pro Sekunde. Schraffiere die zwischen t=0,3 s und t=0,6 s ausgeatmete Luftmenge und beschreibe, welches Integral diese Menge liefert.',
    'Für eine Flussrate in L/s ist die aufsummierte Menge in Liter die Fläche unter dem Graphen f(t) zwischen den Zeitgrenzen.',
    'Schraffiere die Fläche unter f(t) von t=0,3 bis t=0,6. V=∫₀,₃^₀,₆ f(t) dt, Einheit Liter.',
    {image:'b-661',officialNumber:'B_661 a'});
  add('B_623 a','4.8','Thermosflasche – Füllvolumen mit GeoGebra',
    'Eine liegende Flasche wird um die x-Achse gedreht. Für 0≤x≤18 gilt f(x)=3,5 cm; von 18 bis 26 gilt g(x)=−3/128·(x−18)²+3,5. Berechne das Volumen bis x=18 und die Füllhöhe z, wenn das Volumen 900 cm³ beträgt.',
    'Für Rotation um die x-Achse: V=π∫ r(x)²dx. V₁=π∫₀¹⁸(3,5)²dx. Löse 900=V₁+π∫₁₈ᶻg(x)²dx (18≤z≤26).',
    'V₁=220,5π≈692,72 cm³. Aus 900=V₁+π∫₁₈ᶻ[−3/128·(x−18)²+3,5]²dx folgt z≈24,02 cm.',
    {image:'b-623',officialNumber:'B_623 a'});
  add('B_612 a','4.8','Spargel – orientierte Teilflächen',
    'Die Fläche unter einem positiven Funktionsgraphen von x=0 bis x=b wird bei x=a so geteilt, dass A₁:A₂=2:3 gilt. Ergänze die Integralgleichung für die linke Teilfläche und interpretiere die Größen.',
    'A₁=∫₀ᵃf(x)dx; A₁+A₂=∫₀ᵇf(x)dx. Aus A₁:A₂=2:3 folgt A₁=2/5·(A₁+A₂).',
    '∫₀ᵃf(x)dx=(2/5)·∫₀ᵇf(x)dx. Die linke Teilfläche ist 40 % der gesamten Feldfläche.',
    {image:'b-612',officialNumber:'B_612 a'});

  // 4.1 – wenig, aber nicht komplett ignorieren.
  add('4.1-a','4.1','Grenzwert eines Polynoms','Berechne lim(x→2) (3x²−4x+1).',
    'Polynome sind überall stetig: direkt einsetzen.','3·4−8+1=5.');
  add('4.1-b','4.1','Hebbare Lücke','Bestimme lim(x→3) (x²−9)/(x−3). Ist die ursprüngliche Funktion bei x=3 definiert?',
    'Zerlege x²−9=(x−3)(x+3). Unterschied zwischen Grenzwert und Funktionswert.',
    'Für x≠3 ist der Term x+3, daher Grenzwert 6. Die angegebene Bruchfunktion ist bei x=3 nicht definiert.');
  add('4.1-c','4.1','Sprungstelle erkennen','Eine Stückfunktion hat links von x=1 den Wert 2 und rechts den Wert 5. Ist sie bei x=1 stetig?',
    'Ein zweiseitiger Grenzwert existiert nur bei gleichen links-/rechtsseitigen Grenzwerten.',
    'Nein. Linksgrenzwert 2, Rechtsgrenzwert 5: Sprungstelle.');
  add('4.1-d','4.1','Funktion und Grenzwert','g(x)=x² für x≠1 und g(1)=4. Bestimme lim(x→1)g(x) und entscheide, ob g bei x=1 stetig ist.',
    'Funktionswert ist nicht gleich dem Grenzwert.',
    'Grenzwert 1; g(1)=4. Daher nicht stetig (hebbare Unstetigkeit).');

  // 4.2 – mittlere/lokale Änderungsraten und Einheiten.
  add('4.2-a','4.2','Durchschnittliche Geschwindigkeit','s(t)=2t²+3t in Metern, t in Sekunden. Berechne die mittlere Geschwindigkeit zwischen 1 und 4 Sekunden.',
    '(s(4)−s(1))/(4−1), Einheit m/s.','s(4)=44, s(1)=5. Mittelwert 39/3=13 m/s.');
  add('4.2-b','4.2','Momentangeschwindigkeit','s(t)=2t²+3t. Bestimme s′(4) und interpretiere.',
    'Ableitung ist lokale Änderungsrate.','s′(t)=4t+3; s′(4)=19 m/s.');
  add('4.2-c','4.2','Differentialquotient aus Tabelle','Ein Tank enthält nach 2 min 48 L und nach 6 min 92 L. Bestimme die mittlere Zuflussrate und ihre Einheit.',
    'Änderung des Inhalts geteilt durch Änderung der Zeit.',
    '(92−48)/(6−2)=11 L/min.');
  add('4.2-d','4.2','Differentialquotient über Grenzwert','f(x)=x². Berechne f′(3) mithilfe des Grenzwerts lim(h→0)[f(3+h)−f(3)]/h.',
    'Ausmultiplizieren und h kürzen.',
    '[(3+h)²−9]/h=6+h; Grenzwert 6.');
  add('4.2-e','4.2','Temperaturänderung','T(t)=20+6t−0,5t² in °C, t in Minuten. Vergleiche die mittlere Rate von t=0 bis 4 mit T′(4).',
    'Durchschnitt (T(4)−T(0))/4; lokal T′(4).',
    'T(4)=36 °C. Mittlere Rate 4 °C/min; T′(t)=6−t, lokal bei 4: 2 °C/min.');
  add('4.2-f','4.2','Steigung aus Punkten','Der Graph einer Funktion geht durch (2|7) und (6|19). Bestimme die Sekantensteigung.',
    '(Δy)/(Δx), geometrisch mittlere Änderung.',
    '(19−7)/(6−2)=3.');
  add('4.2-g','4.2','Abbremsen','v(t)=24−3t in m/s. Berechne v′(t) und die Geschwindigkeitsänderung von 2 bis 5 Sekunden.',
    'Die Ableitung der Geschwindigkeit ist Beschleunigung.',
    'v′(t)=−3 m/s²; v(5)−v(2)=9−18=−9 m/s.');

  // 4.3 – händische Ableitungen und typische Produkt-/Kettenregel.
  add('4.3-a','4.3','Potenz- und Summenregel','Bilde f′(x) für f(x)=4x⁵−3x³+7x−8.',
    '(xⁿ)′=nxⁿ⁻¹.','f′(x)=20x⁴−9x²+7.');
  add('4.3-b','4.3','Produktregel','Leite f(x)=(x²+1)(3x−2) ab.',
    '(u·v)′=u′v+uv′.',
    'f′(x)=2x(3x−2)+3(x²+1)=9x²−4x+3.');
  add('4.3-c','4.3','Kettenregel','Leite f(x)=(2x−1)⁵ ab.',
    'Äußere Potenzregel mal innere Ableitung.',
    'f′(x)=10(2x−1)⁴.');
  add('4.3-d','4.3','Produkt aus Polynom und Exponentialfunktion','Leite f(x)=x²·eˣ ab.',
    'Produktregel, (eˣ)′=eˣ.',
    'f′(x)=eˣ(2x+x²).');
  add('4.3-e','4.3','Exponentialfunktion mit innerer Funktion','Leite f(x)=3e^(−2x) ab.',
    '(e^g)′=e^g·g′.','f′(x)=−6e^(−2x).');
  add('4.3-f','4.3','Mehrfache Ableitung','f(x)=x⁴−6x²+1. Bilde f′, f″ und f‴.',
    'Mehrmals Potenzregel anwenden.',
    'f′=4x³−12x, f″=12x²−12, f‴=24x.');
  add('4.3-g','4.3','Kette mit quadratischem Innenausdruck','Leite f(x)=(x²+3)³ ab.',
    'Außen 3(·)², innen 2x.',
    'f′(x)=6x(x²+3)².');
  add('4.3-h','4.3','Produkt mit Kette','Leite f(x)=x(2x+1)³ ab.',
    'Zuerst Produktregel, bei der Klammer Kettenregel.',
    'f′=(2x+1)³+6x(2x+1)²=(2x+1)²(8x+1).');
  add('4.3-i','4.3','Ableitung an einer Stelle','f(x)=2x³−3x²+4. Berechne f′(2).',
    'Erst f′, dann x=2 einsetzen.',
    'f′=6x²−6x; f′(2)=24−12=12.');
  add('4.3-j','4.3','Exponentielles Abklingen','N(t)=120e^(−0,4t). Berechne N′(2) und deute das Vorzeichen.',
    'Kettenregel für e^(kt).',
    'N′(t)=−48e^(−0,4t), N′(2)=−48e^(−0,8)≈−21,57 Einheiten pro Zeiteinheit.');
  add('4.3-k','4.3','Produkt und zweite Ableitung','f(x)=x²(x+4). Berechne f″(x).',
    'Ausmultiplizieren oder Produktregel.',
    'f=x³+4x², f′=3x²+8x, f″=6x+8.');

  // 4.4 – Graph und Kurvendiskussion, ohne Fachfremdes Optimierungsmodell.
  add('4.4-a','4.4','Tangente an eine Parabel','f(x)=x²−4x+1. Stelle die Tangente bei x=3 auf.',
    'm=f′(3), P=(3,f(3)), y−y₀=m(x−x₀).',
    'f(3)=−2, f′(3)=2, Tangente y=2x−8.');
  add('4.4-b','4.4','Monotonieintervalle','f(x)=x³−3x. Bestimme die Intervalle des Steigens und Fallens.',
    'f′(x)=3x²−3; Vorzeichen von f′.',
    'Steigend für x<−1 und x>1, fallend für −1<x<1.');
  add('4.4-c','4.4','Lokale Extrema','f(x)=x³−3x. Berechne Hoch- und Tiefpunkt.',
    'f′=0 und f″-Vorzeichen.',
    'Hochpunkt H(−1|2), Tiefpunkt T(1|−2).');
  add('4.4-d','4.4','Wendepunkt','f(x)=x³−6x²+9x. Bestimme den Wendepunkt.',
    'f″(x)=6x−12. f″=0, Vorzeichenwechsel prüfen.',
    'x=2, f(2)=8−24+18=2. W(2|2).');
  add('4.4-e','4.4','Steigungswinkel','Eine Tangente hat die Steigung m=1,2. Bestimme ihren Steigungswinkel.',
    'α=arctan(m); Taschenrechner auf Grad.',
    'α≈50,19°.');
  add('4.4-f','4.4','Krümmung aus Ableitung','f″(x)=6x−12. In welchen Bereichen ist f links- bzw. rechtsgekrümmt?',
    'f″>0: linksgekrümmt; f″<0: rechtsgekrümmt.',
    'Für x>2 linksgekrümmt, für x<2 rechtsgekrümmt.');
  add('4.4-g','4.4','Waagrechte Tangente','f(x)=x⁴−4x². Finde alle Stellen mit waagrechter Tangente.',
    'Setze f′(x)=0.',
    'f′=4x³−8x=4x(x²−2). x=0 und x=±√2.');
  add('4.4-h','4.4','Tangente und Normale','f(x)=x². Gib Tangente und Normale bei x=1 an.',
    'Tangentensteigung 2. Normalensteigung −1/2.',
    'P=(1,1), Tangente y=2x−1, Normale y=−0,5x+1,5.');
  add('4.4-i','4.4','Aussage eines Maximums','Für eine Temperaturfunktion gilt T′(6)=0 und T″(6)<0. Interpretiere beide Aussagen.',
    'Nicht nur Rechenwert, sondern Sachkontext.',
    'Bei 6 min ist die momentane Temperaturänderung 0; die Temperatur hat dort lokal ein Maximum.');
  add('4.4-j','4.4','Wendestelle und Änderungsrate','s(t)=t³−6t²+5t. Wann ändert die Beschleunigung ihr Vorzeichen?',
    'Die zweite Ableitung ist Beschleunigung; löse s″=0.',
    's″(t)=6t−12; Wechsel bei t=2 (bei entsprechendem Zeitbereich).');

  // 4.5 – Graph von f und f′, Bestand und Rate.
  add('4.5-a','4.5','Graph von f′ qualitativ skizzieren','Ein Graph f steigt bis x=−2, fällt bis x=2 und steigt danach wieder. Skizziere die Vorzeichen von f′.',
    'Bei lokalen Extrema hat f′ eine Nullstelle.',
    'f′>0 für x<−2, f′<0 für −2<x<2 und f′>0 für x>2; f′(−2)=f′(2)=0.');
  add('4.5-b','4.5','Ableitung und Stammfunktion','f(x)=3x². Gib eine mögliche Stammfunktion F an und prüfe durch Ableiten.',
    'F′(x)=f(x).','F(x)=x³+C, denn F′=3x².');
  add('4.5-c','4.5','Geschwindigkeit und Weg','v(t)=4t+2 in m/s. Was bedeutet s′(t)=v(t), und wie groß ist die Wegänderung von t=0 bis 3?',
    'Die Wegfunktion ist eine Stammfunktion von v.',
    'Δs=∫₀³(4t+2)dt=[2t²+2t]₀³=24 m.');
  add('4.5-d','4.5','f und f′ aus einem Graphen deuten','Bei x=4 besitzt f eine waagrechte Tangente und wechselt von steigend zu fallend. Was gilt für f′(4) und das Vorzeichen links/rechts?',
    'Graphisches Ableiten: f′ ist Tangentensteigung.',
    'f′(4)=0, links davon positiv, rechts davon negativ: lokales Maximum von f.');
  add('4.5-e','4.5','Aus einer Änderungsrate Bestand rekonstruieren','Der Zufluss eines Behälters beträgt r(t)=6−t L/min, 0≤t≤4. Am Anfang sind 10 L enthalten. Wie viel ist nach 4 min im Tank?',
    'Bestand = Anfangsbestand + Integral der Änderungsrate.',
    '10+∫₀⁴(6−t)dt=10+(24−8)=26 L.');
  add('4.5-f','4.5','Steigung von f′ und Krümmung von f','Ein Ableitungsgraph f′ steigt auf dem gesamten Intervall. Was folgt über das Krümmungsverhalten von f?',
    'f′ steigend bedeutet f″>0 (wo differenzierbar).',
    'f ist linksgekrümmt / konvex.');

  // 4.6 – Grundintegrale, händische Rechnung.
  add('4.6-a','4.6','Stammfunktion Polynom','Berechne ∫(6x²−4x+3)dx.',
    'Potenzregel rückwärts + C.',
    '2x³−2x²+3x+C.');
  add('4.6-b','4.6','Stammfunktion einer Potenz','Berechne ∫5x⁴dx.',
    'Exponent um 1 erhöhen, durch neuen Exponenten teilen.',
    'x⁵+C.');
  add('4.6-c','4.6','Grundintegral trigonometrisch','Berechne ∫3sin(x)dx.',
    'Die Ableitung von cos ist −sin.',
    '−3cos(x)+C.');
  add('4.6-d','4.6','Grundintegral Exponentialfunktion','Berechne ∫4eˣdx.',
    'eˣ ist eigene Ableitung.',
    '4eˣ+C.');
  add('4.6-e','4.6','Polynom mit negativem Exponenten','Berechne ∫(2x³−3x⁻²)dx für x≠0.',
    'Nutze ∫xⁿdx=xⁿ⁺¹/(n+1) für n≠−1.',
    '0,5x⁴+3/x+C.');
  add('4.6-f','4.6','Stammfunktion prüfen','Ist F(x)=2x³+3x²−4 eine Stammfunktion von f(x)=6x²+6x?',
    'Vergleiche F′ mit f.','Ja, F′(x)=6x²+6x.');
  add('4.6-g','4.6','Bestimmtes Polynom-Integral','Berechne ∫₁³2x dx.',
    'Hauptsatz der Integralrechnung.',
    '[x²]₁³=9−1=8.');
  add('4.6-h','4.6','Einfaches Integral mit x-Grenzen','Berechne ∫₀²(x²+1)dx.',
    'F=x³/3+x.',
    '[x³/3+x]₀²=8/3+2=14/3≈4,667.');

  // 4.8 – Anwendung, nicht Trigonometrie-Funktionsanpassung.
  add('4.8-a','4.8','Orientierter Flächeninhalt','f(x)=x−2. Berechne ∫₀⁴f(x)dx und den geometrischen Flächeninhalt.',
    'Teile bei der Nullstelle x=2 auf; unter der Achse negatives Vorzeichen.',
    'Das bestimmte Integral ist 0. Geometrische Fläche =2+2=4 FE.');
  add('4.8-b','4.8','Fläche zwischen zwei Graphen','Berechne die eingeschlossene Fläche zwischen f(x)=2x und g(x)=x² für x von 0 bis 2.',
    'Obere minus untere Kurve integrieren.',
    '∫₀²(2x−x²)dx=[x²−x³/3]₀²=4/3 FE.');
  add('4.8-c','4.8','Integral als Bestand','Die Zuflussrate beträgt r(t)=12−2t L/min für 0≤t≤5. Wie viel Wasser fließt insgesamt zu?',
    'Einheitenkontrolle: L/min integrieren über min.',
    '∫₀⁵(12−2t)dt=[12t−t²]₀⁵=60−25=35 L.');
  add('4.8-d','4.8','Rotationsvolumen mit GeoGebra','f(x)=x+1 für 0≤x≤2 und f(x)≥0. Rotiert die Fläche zwischen f und x-Achse um die x-Achse, wie groß ist das Volumen?',
    'Scheibenmethode V=π∫₀²[f(x)]²dx.',
    'V=π∫₀²(x+1)²dx=π[(x+1)³/3]₀²=26π/3≈27,23 VE.');
  add('4.8-e','4.8','Fläche aus Geschwindigkeitsgraph','Ein Körper hat v(t)=3t m/s für 0≤t≤4. Ermittle die Wegänderung über ein Integral.',
    'Geschwindigkeit in m/s integrieren nach s.',
    '∫₀⁴3t dt=[1,5t²]₀⁴=24 m.');

  // B_T_4.1 – laut Lehrermitschrift ausdrücklich im SA-Stoff.
  add('B-T-4.1-a','B_T_4.1','Sättigungsprozess','S(t)=80(1−e^(−0,2t)). Bestimme den langfristigen Grenzwert und deute ihn.',
    'e^(−kt)→0 für t→∞.',
    'S(t) nähert sich 80 Einheiten von unten an; 80 ist der Sättigungswert.');
  add('B-T-4.1-b','B_T_4.1','Exponentielles Abklingen','N(t)=150e^(−0,1t). Was gilt für t→∞? Was bedeutet die horizontale Asymptote?',
    'Vorzeichen des Exponenten beachten.',
    'N(t)→0; die Größe nimmt ab und nähert sich asymptotisch 0.');
  add('B-T-4.1-c','B_T_4.1','Unstetigkeit in einem technischen Modell','Ein Förderband läuft bis t=5 s mit 2 m/s und springt danach sofort auf 4 m/s. Erkläre die Unstetigkeit der Geschwindigkeitsfunktion.',
    'Vergleiche links- und rechtsseitigen Grenzwert.',
    'Sprungstelle bei t=5: Grenzwerte 2 und 4 m/s; ein idealisierter, physikalisch abrupter Zustandswechsel.');

  // B_T2_4.2: Der im Foto ausdrücklich angegebene HTL-2-Ableitungsstoff.
  add('B-T2-4.2-a','B_T2_4.2','Quotientenregel','Leite f(x)=(x²+1)/(x+1) für x≠−1 ab.',
    'f′=(u′v−uv′)/v².',
    'f′(x)=[2x(x+1)−(x²+1)]/(x+1)²=(x²+2x−1)/(x+1)².');
  add('B-T2-4.2-b','B_T2_4.2','Sinus mit Kettenregel','Leite f(x)=4sin(3x) ab.',
    'Innere Ableitung 3, (sin)′=cos.',
    'f′(x)=12cos(3x).');
  add('B-T2-4.2-c','B_T2_4.2','Logarithmus ableiten','Leite f(x)=ln(2x+5) für x>−2,5 ab.',
    '(ln g)′=g′/g.',
    'f′(x)=2/(2x+5).');
  add('B-T2-4.2-d','B_T2_4.2','Quotient und Verkettung','Leite f(x)=sin(x)/x für x≠0 ab.',
    'Quotientenregel mit u=sin(x), v=x.',
    'f′(x)=(xcos(x)−sin(x))/x².');

  // B_T2_4.4 – Anwendungsbezogen, keine neue Formelfindung aus Winkeln.
  add('B-T2-4.4-a','B_T2_4.4','Brückensteigung','Ein Wegprofil lautet h(x)=−0,02x²+0,8x+5 (x und h in m). Finde die Stelle der maximalen Höhe und die Tangentensteigung dort.',
    'h′(x)=0, h″ prüfen.',
    'h′(x)=−0,04x+0,8; Maximum bei x=20 m, Höhe 13 m, Steigung 0.');
  add('B-T2-4.4-b','B_T2_4.4','Beschleunigung aus Weg','s(t)=t³−6t²+10t (m). Bestimme v(t), a(t) und die Stelle, an der a=0 gilt.',
    'v=s′ und a=s″.',
    'v=3t²−12t+10, a=6t−12; bei t=2 s ist a=0.');
  add('B-T2-4.4-c','B_T2_4.4','Tankfüllstand und Änderungsrate','H(t)=−t³+6t²+2 (L), 0≤t≤4. Wann ist die momentane Änderungsrate maximal?',
    'H′(t)=−3t²+12t, Maximum dieser Rate via H″(t)=0 prüfen.',
    'H′ hat bei t=2 sein Maximum: H′(2)=12 L/Zeiteinheit.');

  // B_T2_4.5 – angewandte Integrale, GeoGebra.
  add('B-T2-4.5-a','B_T2_4.5','Abflussrate integrieren','Q(t)=8+2t L/min, 0≤t≤5. Bestimme die abgeflossene Menge und interpretiere die Einheit.',
    'Integrationsgrenzen Zeit in Minuten, Q in L/min.',
    '∫₀⁵(8+2t)dt=[8t+t²]₀⁵=65 L.');
  add('B-T2-4.5-b','B_T2_4.5','Rotationskörper um x-Achse','Ein rotationssymmetrischer Behälter hat Radius r(x)=2+0,5x (cm) auf 0≤x≤4. Bestimme sein Volumen.',
    'V=π·∫₀⁴r(x)²dx.',
    'V=π∫₀⁴(4+2x+0,25x²)dx=π(16+16+16/3)=112π/3≈117,29 cm³.');
  add('B-T2-4.5-c','B_T2_4.5','Modellierter Kühlprozess','Die Kühlrate ist r(t)=−10e^(−0,2t) °C/min, T(0)=80 °C. Bestimme T(5).',
    'Ausgangswert plus Integral der Änderungsrate.',
    'T(5)=80+∫₀⁵(−10e^(−0,2t))dt=30+50e^(−1)≈48,39 °C.');

  // Unterrichts-ZUSATZ: diese Aufgaben sind keine offiziell zugesagten Deskriptoren.
  add('P-a','partial','Partielle Ableitung nach x und y','z(x,y)=3x²y−4xy²+2y. Bestimme z_x und z_y.',
    'Bei ∂/∂x bleibt y konstant, bei ∂/∂y bleibt x konstant.',
    'z_x=6xy−4y²; z_y=3x²−8xy+2.');
  add('P-b','partial','Zweite partielle Ableitungen','z(x,y)=x³y²+5xy. Bestimme z_xx, z_yy und z_xy.',
    'Eine Variable nach der anderen ableiten.',
    'z_xx=6xy²; z_yy=2x³; z_xy=6x²y+5.');
  add('P-c','partial','Partielle Ableitung an einer Stelle','z(x,y)=2x²y+3y². Bestimme z_x(2,3) und z_y(2,3).',
    'Zuerst partielle Ableitung, danach einsetzen.',
    'z_x=4xy→24; z_y=2x²+6y→26.');
  add('P-d','partial','Gemischte Ableitung','z(x,y)=x²y³−2xy. Bestimme z_xy.',
    'Erst nach x, danach nach y ableiten.',
    'z_x=2xy³−2y; z_xy=6xy²−2.');

  add('PI-a','parts','Partielle Integration mit x·eˣ','Berechne ∫x eˣ dx.',
    '∫u v′=u v−∫u′v; u=x, v′=eˣ.',
    '∫x eˣ dx=xeˣ−eˣ+C=eˣ(x−1)+C.');
  add('PI-b','parts','Partielle Integration mit x·sin(x)','Berechne ∫x sin(x) dx.',
    'u=x, v′=sin(x), damit v=−cos(x).',
    '−x cos(x)+∫cos(x)dx=−x cos(x)+sin(x)+C.');
  add('PI-c','parts','Partielle Integration mit x·cos(x)','Berechne ∫x cos(x) dx.',
    'u=x, v′=cos(x), v=sin(x).',
    'x sin(x)−∫sin(x)dx=x sin(x)+cos(x)+C.');

  // Stabiler, reproduzierbarer Auswahl-Mix: alle Unterrichtsblätter und
  // gut verifizierten BMB-Beispiele bleiben bevorzugt; nur ergänzende
  // Aufgaben werden aus ggf. >15 pro Kapitel gemischt ausgewählt.
  function seedRank(key) {
    let h = 2166136261;
    for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  const relevant = Object.keys(chapter);
  const selected = [];
  for (const group of relevant) {
    const all = Q.filter((q) => q.primary === group);
    const priority = all.filter((q) => q.origin === 'classroom' || q.origin === 'official');
    const self = all.filter((q) => q.origin === 'studyverse')
      .sort((a,b) => seedRank('SA2026:' + a.id)-seedRank('SA2026:' + b.id));
    selected.push(...priority.slice(0,15),...self.slice(0,Math.max(0,15-priority.length)));
  }
  if (selected.some((q) => q.primary === '4.7' || q.primary === 'B_T2_4.3')) throw new Error('Nicht geprüfter Stoff enthalten');
  if (new Set(selected.map((q) => q.id)).size !== selected.length) throw new Error('Doppelte Aufgaben-IDs');
  for (const group of relevant) {
    const count = selected.filter((q) => q.primary === group).length;
    if (count < 2 || count > 15) throw new Error('Unsinnige Kapitelzahl ' + group + ': ' + count);
  }
  window.MATHS_EXAM_SCOPE = Object.freeze({chapters:chapter,excluded:['4.7','B_T2_4.3'],date:'2026-11-26'});
  window.MATHS_POOL_BANK = Object.freeze(selected);
})();
