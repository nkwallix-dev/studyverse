/* Official SRDP/BRP Angewandte Mathematik descriptor-4 source index.
 * Only PDFs directly hosted by www.aufgabenpool.at are published in the trainer.
 * Actual examination prompt and its original figures are served through
 * the public source PDF/page; no task text or graphics are fabricated.
 *
 * Datenquelle: Bundesministerium für Bildung (CC BY 4.0).
 * Third-party illustrations within official PDFs may have their own rights;
 * these assets remain at the original source and are not republished here.
 */
(function(){
'use strict';
const Q=[];
const base='https://www.aufgabenpool.at/amn/teilb1/';
const mirror='https://maths2mind.com/pruefungsvorbereitung-matura-abitur-steop/matura-oesterreich-bhs-angewandte-mathematik/';
const ALL='teil-aufgaben-fuer-alle-cluster/';
const CLUSTER='teil-b-aufgaben-fuer-spezielle-cluster/';
const meta={
 '4.1':'Erkläre Grenzwert, Stetigkeit und den Wert der Funktion im Sachzusammenhang.',
 '4.2':'Prüfe erst die Einheiten. Mittlere Änderungsrate = Differenzenquotient Δy/Δx; lokale Änderungsrate = f′(x).',
 '4.3':'Betrachte Vorzeichen von f′, f″ und den funktionalen Zusammenhang. Formuliere dein Ergebnis im Sachzusammenhang.',
 '4.4':'Für Extremwerte gilt f′(x)=0 als Kandidatenbedingung. Prüfe mit f″, Vorzeichenwechsel und Sachkontext; für Wendepunkte f″=0 und Krümmungswechsel.',
 '4.5':'Eine Änderungsrate wird durch Integrieren aufsummiert. Unterscheide momentane von durchschnittlicher Änderung und beachte die Einheiten.',
 '4.6':'Bilde eine Stammfunktion F. Prüfe F′=f und setze bei bestimmten Integralen die Grenzen ein.',
 '4.8':'Bestimme die Fläche/Bestandsänderung als Integral. Unter der x-Achse ist das Integral negativ; für geometrischen Flächeninhalt Beträge und Teilintervalle beachten.'
};
function P(id,title,part,descriptor,source,kind='pdf',exact=null){
 const record={id:'pool-'+id.replace(/[^a-z0-9]+/gi,'-').toLowerCase(),number:id,title,part,descriptor,category:'Deskriptor '+descriptor.split(',')[0],source,kind,
 prompt:'Originalaufgabe '+id+' — '+title+' ('+part+'). Bearbeite die exakte Angabe aus dem offiziellen Aufgabentext mit Papier und Stift. Grafiken und Tabellen stehen in der eingebetteten Originalquelle.',
 guide:descriptor.split(',').map(x=>meta[x.trim()]||'Erkläre deinen Rechenweg nachvollziehbar.').join(' '),
 solution:'Verwende die offizielle Lösungserwartung am Ende der verlinkten Originalaufgabe und vergleiche jeden Rechenschritt. Die zusätzliche Studyverse-Erklärung beschreibt die anzuwendende Kompetenz.',
 credit:'Datenquelle: Bundesministerium für Bildung (CC BY 4.0)'};
 if(exact){record.prompt=exact.prompt;record.solution=exact.solution;record.guide=exact.guide; if(exact.expected!=null)record.expected=exact.expected;if(exact.graph)record.graph=exact.graph}
 Q.push(record);
}
P('B_405 a','Bodenunebenheiten','a','4.2, 4.4',base+'539/Bodenunebenheiten.pdf','pdf',{
 prompt:'Eine Messlatte berührt einen Boden an zwei Punkten P₁ und P₂. Die lineare Messlatte hat Steigung k. Welche Aussage in der Originaltabelle ist unzutreffend? Gib die Nummer der falschen Aussage (1–5) ein.',
 solution:'Aussage 2 ist falsch: p′(x₁)=0 lässt sich aus der Skizze nicht ableiten. Da die Messlatte an den Kontaktpunkten dieselbe Tangentensteigung hat, ist dort p′(x₁)=p′(x₂)=k.',
 guide:'Unterscheide Sekantensteigung und Tangentensteigung. Die Steigung k der Messlatte ist nicht notwendigerweise 0.',expected:2
});
P('B_475 d','W-LAN','d','4.4, 4.5',base+'807/W-LAN.pdf');
P('B_444 a','Boule','a','4.4, 3.4',base+'725/Boule (PT1_2019).pdf');
P('B_427 a','Im Möbelhaus','a','4.4, 4.8',base+'584/Im Moebelhaus.pdf');
P('B_417 a','Leistungsdiagnostik im Sport','a','4.4, 2.11',base+'550/Leistungsdiagnostik im Sport.pdf');
P('B_408 a','Straßenbau (2)','a','4.4, 2.8',base+'542/Strassenbau (2).pdf');
P('B_405 d','Bodenunebenheiten','d','4.4, 2.11',base+'539/Bodenunebenheiten.pdf','pdf',{
 prompt:'B_405 d — Eine Bodenkurve p und eine Messlatten-Gerade f sollen an T parallel verlaufen. p(x)=−70x⁴+150x³−100x²+17x+3, f(x)=−4,046x+4,378. Bestimme die innere x-Koordinate des Berührpunktes T (auf vier Nachkommastellen).',
 guide:'Parallele Tangenten haben dieselbe Steigung: p′(x)=f′(x)=−4,046. Löse −280x³+450x²−200x+17=−4,046 und wähle die zum Diagramm passende innere Lösung.',
 solution:'p′(x)=−280x³+450x²−200x+17. Aus p′(x)=−4,046 folgt x≈0,1527, 0,5357 oder 0,9187. Laut Abbildung liegt T innen, also x≈0,5357 m.',
 expected:0.5357
});
P('B_394 b','Kalt – warm (1)','b','4.4, 3.5',base+'518/Kalt_warm_1.pdf');
P('B_392 a','Snowboard (1)','a','4.4, 2.8',base+'516/Snowboard_1.pdf');
P('B_391 a','Seile','a','4.4, 4.2',base+'515/Seile.pdf');
P('B_391 b','Seile','b','4.4, 3.4',base+'515/Seile.pdf');
P('B_377 b','Angry Birds (1)','b','4.4, 3.2',base+'482/AngryBirds_1.pdf');
P('B_377 c','Angry Birds (1)','c','4.4, 2.8',base+'482/AngryBirds_1.pdf');
P('B_364 b','Nemo','b','4.4, 4.3',base+'765/Nemo.pdf');
P('B_364 c','Nemo','c','4.4, 4.8',base+'765/Nemo.pdf');
P('B_352 c','Staatseinnahmen und -ausgaben','c','4.4, 4.5, 4.8',base+'449/Staatseinnahmen_ausgaben.pdf');
P('B_347 d','Vektorgrafiken','d','4.4',base+'427/Vektorgrafiken.pdf');
P('B_308 b','Stromversorgung einer Baustelle','b','4.4, 2.12',base+'361/Stromversorgung_e_Baustelle.pdf');
P('B_261 b','Verkehrszeichen','b','4.4, 2.5',base+'457/Verkehrszeichen.pdf');
P('B_260 a','Gebäudetechnik','a','4.4, 2.8',base+'663/Gebaeudetechnik.pdf');
P('B_254 a','Sport und Gesundheit','a','4.4, 3.7',base+'566/Sport und Gesundheit.pdf');
P('B_195 b','Grönlandwale','b','4.4, 3.5',base+'196/Groenlandwale.pdf');
P('B_193 c','Reisekosten','c','4.4',base+'219/Reisekosten.pdf');
P('B_176 b','Kraftstoffverbrauch','b','4.4',base+'267/Kraftstoffverbrauch.pdf');
P('B_123 a','Herstellungskosten (1)','a','4.4, 3.9',base+'197/Herstellungskosten_1.pdf');
P('B_116 c','Ausstellungshalle','c','4.4',base+'755/Ausstellungshalle (PT2_2019).pdf');
P('B_027 a','Bruchbiegeprüfung','a','4.4',base+'456/Bruchbiegepruefung.pdf');
P('B_012 b','Abrissbirnen','b','4.4, 2.8',base+'631/Abrissbirnen.pdf');
P('A_392 a','Spielfiguren','a','4.4, 3.1','https://www.aufgabenpool.at/amn/teila/1167/A_392 Spielfiguren (PT2 2026).pdf');
const aLink=(n,typ=ALL)=>mirror+typ+'aufgabe-'+n;
P('A_266 b','Flussläufe und Pegelstände','b','4.8',aLink(4082),'page');
P('A_116 b','Baumhaus','b','4.8',aLink(4201),'page',{
 prompt:'A_116 b — Die obere Fensterkante eines Baumhauses ist f(x)=−0,003x³+0,164x²−2,25x+40 für 0≤x≤40 (cm). Um wie viel Prozent ist die tatsächlich begrenzte Fensterfläche kleiner als ein Quadrat mit Seitenlänge 40 cm?',
 guide:'Fläche des Quadrats =40²=1600 cm². Fläche unter der Kurve A=∫₀⁴⁰ f(x)dx. Prozentuale Verringerung = (1600−A)/1600·100.',
 solution:'Eine Stammfunktion ist F(x)=−0,00075x⁴+0,164x³/3−1,125x²+40x. Setze 40 und 0 ein. Die prozentuale Verringerung wird auf das Quadrat mit 1600 cm² bezogen.',
 expected:13.833333333
});
P('A_243 c','Der Bodensee','c','4.8',aLink(4015),'page',{
 prompt:'A_243 c — Sabine startet 12 km vor Bregenz und fährt mit 15 km/h. Johanna fährt eine Stunde später von Bregenz mit 30 km/h los. Wie viele Stunden ist Johanna unterwegs, bis sie Sabine einholt?',
 guide:'Beide Entfernungen gleichsetzen. Zeit t seit Start von Sabine: 12+15t=30(t−1). Danach 1 Stunde abziehen, weil Johanna später startet.',
 solution:'12+15t=30(t−1) ⇒ 42=15t ⇒ t=2,8 h seit Sabines Start. Johanna fährt 1,8 Stunden.',expected:1.8
});
P('A_071 c','Gewitter','c','4.8, 4.5',aLink(4184),'page');
P('A_141 a','Kühe auf der Weide','a','4.8',aLink(4240),'page');
P('A_297 b','Sauna','b','4.8, 4.5',aLink(4261),'page');
P('A_299 a','Bäume','a','4.8',aLink(4267),'page');
P('A_158 d','Ganzkörperhyperthermie','d','4.8',aLink(4316),'page');
P('A_309 a','Zirbenholzbetten','a','4.8',aLink(4517),'page',{
 prompt:'A_309 a — Die obere Begrenzung eines Bettkopfteils verläuft gemäß f(x)=0,24x⁴−0,8x²+0,66 für −1≤x≤1 (in Metern). Berechne die Fläche unter der Kurve zwischen −1 und 1.',
 guide:'f ist eine gerade Funktion: A=2∫₀¹(0,24x⁴−0,8x²+0,66)dx.',
 solution:'F(x)=0,048x⁵−(0,8/3)x³+0,66x. Fläche =2(F(1)−F(0))=0,882666… m².',
 expected:0.8826666666667,
 graph:{curves:[{label:'f(x)',poly:[0.24,0,-0.8,0,0.66]}],area:{a:-1,b:1},x:[-1.4,1.4],y:[-.2,1.1]}
});
P('A_317 a','Stand-up-Paddling','a','4.8',aLink(4551),'page');
P('A_318 a','Kleingartensiedlung','a','4.8',aLink(4553),'page',{
 prompt:'A_318 a — Ein Grundstück wird durch f(x)=0,01x²+0,01x+16 auf [0;20] begrenzt. Wo muss bei x=a vertikal geteilt werden, sodass beide Flächen gleich groß sind?',
 guide:'Suche a aus ∫₀ᵃ f(x)dx = ½∫₀²⁰ f(x)dx. Nutze F(x)=x³/300+x²/200+16x.',
 solution:'Berechne die Gesamtfläche und halbiere sie. Setze F(a) auf die Hälfte und löse numerisch. Die Teilstelle liegt bei ungefähr a≈10,612 m.',
 expected:10.611692948
});

/* Balanced, source-identified tasks for 4.2 and 4.5, not just 4.4. */
P('A_253 b','Der Bodensee','b','4.2',aLink(4014),'page');
P('A_262 c','Altenpflege','c','4.2',aLink(4071),'page',{
 prompt:'A_262 c — Hausbesuche in Oberösterreich: 1994 waren es 498 086, 2004 waren es 1 360 543. Interpretiere (1 360 543−498 086)/(2004−1994)≈86 246 im Sachzusammenhang; erkläre, warum derselbe prozentuale Anstieg in zwei Zeiträumen unterschiedliche absolute Zuwächse erzeugt.',
 guide:'Differenzenquotient ist die mittlere jährliche Zunahme. 15,6 % von größeren Ausgangsbeständen ergeben absolut mehr Besuche.',
 solution:'Im Mittel stieg die Anzahl um rund 86 246 Hausbesuche pro Jahr von 1994 bis 2004. Gleiche Prozentsätze auf unterschiedlichen Grundwerten ergeben unterschiedliche absolute Werte.'
});
P('A_263 b','Die Genussformel','b','4.2',aLink(4074),'page',{
 prompt:'A_263 b — Für eine Gans werden folgende Richtwerte angegeben: 2,0 kg → 104 min, 3,0 kg → 136 min, 3,8 kg → 159 min. Zeige mithilfe von Differenzenquotienten, dass Bratdauer und Masse keinen exakten linearen Zusammenhang haben.',
 guide:'Zuerst Steigung zwischen den ersten beiden Messpunkten berechnen, dann zwischen den nächsten beiden. Für exakte Linearität müssen die Steigungen gleich sein.',
 solution:'(136−104)/(3−2)=32 min/kg; (159−136)/(3,8−3)=28,75 min/kg. Da die Steigungen nicht gleich sind, ist der Zusammenhang nicht exakt linear.'
});
P('A_141 c','Kühe auf der Weide','c','4.2',aLink(4242),'page',{
 prompt:'A_141 c — Widerristhöhe h(t)=0,0024t³−0,19t²+5,73t+73 für Alter 1≤t≤24 Monate. Berechne das Alter bei 115 cm. Zeige mit h″, dass der Graph im gesamten Bereich negativ gekrümmt ist. Interpretiere h′(12)≈2,2.',
 guide:'Gleichung h(t)=115 numerisch auf [1;24] lösen. h″=0,0144t−0,38<0. h′(12) ist die momentane Wachstumsrate in cm/Monat.',
 solution:'115 cm bei t≈10,502 Monaten. h″(24)=−0,0344 und ist auf [1;24] stets negativ. Bei 12 Monaten wächst das Rind momentan ungefähr 2,2 cm pro Monat.'
});
P('A_292 a','Pflanzenwachstum','a','4.2',aLink(4245),'page');
P('A_117 c','Kontrolle der Geschwindigkeit','c','4.5',aLink(4205),'page');
P('B_407 c','Sinkende Kugeln','c','4.5',aLink(4039,CLUSTER),'page',{
 prompt:'B_407 c — Die Sinkgeschwindigkeit einer Kugel ist v(t)=0,25g·(1−e^(−4t)), t≥0, mit g=9,81 m/s². Berechne den in der ersten Sekunde zurückgelegten Weg.',
 guide:'Die zurückgelegte Strecke ist das Integral der Geschwindigkeit: s=∫₀¹v(t)dt. Exponentialfunktion gliedweise integrieren.',
 solution:'s=0,25g·[t+e^(−4t)/4]₀¹=g(3+e^(−4))/16≈1,851 m.',
 expected:9.81*(3+Math.exp(-4))/16
});
P('A_222 b','Der Genfer See','b','4.5',aLink(4234),'page');
P('B_406 c','Kräfte','c','4.5',aLink(4042,CLUSTER),'page',{
 prompt:'B_406 c — Gegeben v(t)=2t−t²/2 (m/s) auf [0;4]. Begründe v(t)≥0 und skizziere die Beschleunigungsfunktion a(t).',
 guide:'Faktorisiere v(t)=t(4−t)/2≥0 im Intervall. Für die Beschleunigung ist a(t)=v′(t).',
 solution:'v(t)=t(4−t)/2, daher nicht negativ auf [0;4]. a(t)=2−t ist eine fallende Gerade von (0|2) bis (4|−2).',
 graph:{curves:[{label:'a(t)',poly:[-1,2]}],x:[0,4],y:[-3,3]}
});
P('A_261 a','Fallschirmsprung','a','4.5',aLink(4066),'page',{
 prompt:'A_261 a — In den ersten Sekunden gilt für die Fallstrecke s(t)=(g/2)t² mit g=9,81 m/s². Berechne die Geschwindigkeit 1,5 s nach dem Absprung.',
 guide:'Geschwindigkeit ist Ableitung des Weges: v(t)=s′(t)=gt. Setze t=1,5 s ein.',
 solution:'v(1,5)=9,81·1,5=14,715 m/s.',
 expected:14.715
});

// This screen intentionally excludes all tasks from third-party mirrors.
 // Only original PDFs directly hosted by the Federal Ministry's Aufgabenpool
 // may enter the fourth-descriptor trainer and the SA simulation.
 const official=Q.filter(q=>q.kind==='pdf' && /^https:\/\/(?:www\.)?aufgabenpool\.at\/amn\//i.test(q.source));
 if(official.length<25)throw Error('Official descriptor source bank unexpectedly small: '+official.length);
 if(new Set(official.map(q=>q.id)).size!==official.length)throw Error('Duplicate official pool IDs');
 window.MATHS_POOL_BANK=Object.freeze(official);
 window.MATHS_UNVERIFIED_POOL_COUNT=Q.length-official.length;
})();