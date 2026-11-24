/* Official SRDP/BRP Angewandte Mathematik descriptor-4 source index.
 * Native source PDFs from www.aufgabenpool.at only.
 * Datenquelle: Bundesministerium für Bildung (CC BY 4.0).
 * Third-party illustrations within official PDFs may have their own rights;
 * these assets remain at the original source and are not republished here.
 */
(function(){
'use strict';
const Q=[];
const base='https://www.aufgabenpool.at/amn/teilb1/';
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
 if(exact){record.prompt=exact.prompt;record.solution=exact.solution;record.guide=exact.guide; if(exact.expected!=null)record.expected=exact.expected;if(exact.graph)record.graph=exact.graph;if(exact.collection===true)record.collection=true}
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


/* Descriptor 4.8 — additional REAL applied-integral tasks.
 * Original BMB texts/solution outlines checked against the ministry's
 * Angewandte-Mathematik collection A.pdf; old task IDs remain untouched.
 * The collection PDF is large, so its concise tasks are displayed in the
 * trainer alongside a link to the unchanged official complete original. */
const collectionA='https://www.aufgabenpool.at/amn/allFiles/A.pdf';
P('A_299 a','Bäume – Fläche eines Buchenblatts','a','4.8',collectionA,'pdf',{
 collection:true,
 prompt:'Eine Buchenblattfläche wird zwischen f(x)=0,0047x³−0,2x²+1,28x und g(x)=−f(x) modelliert. x und die Funktionswerte sind in cm angegeben. Zeichne g, berechne die erste positive Nullstelle xₙ nach 0 und ermittle den Flächeninhalt des Blattes zwischen x=0 und x=xₙ.',
 guide:'Die Blattfläche liegt symmetrisch zwischen f und −f. Bestimme zuerst die kleinere positive Nullstelle, dann berechne A=∫₀ˣⁿ(f(x)−g(x))dx=2∫₀ˣⁿf(x)dx.',
 solution:'Amtliche Lösungserwartung: xₙ≈7,84 cm. A=2·∫₀⁷·⁸⁴ f(x)dx≈23,30 cm². Der Flächeninhalt beträgt rund 23,3 cm².'
});
P('A_309 a','Zirbenholzbetten – Fläche und Masse','a','4.8',collectionA,'pdf',{
 collection:true,
 prompt:'Das Kopfteil eines Zirbenholzbettes ist unten gerade und oben durch f(x)=0,24x⁴−0,48x²+0,66 für −1≤x≤1 begrenzt (Koordinaten in m). Berechne die Fläche des Kopfteils. Die Holzplatte ist 50 mm dick; die Dichte beträgt 400 kg/m³. Berechne zusätzlich die Masse.',
 guide:'Fläche A=∫₋₁¹f(x)dx. Für die Masse Dicke 50 mm=0,05 m einsetzen: V=A·0,05 m, m=400 kg/m³·V.',
 solution:'Amtliche Lösungserwartung: A=1,096 m². Bei 0,05 m Dicke ist m=400·1,096·0,05=21,92 kg.'
});
P('A_317 a','Stand-up-Paddling – Fläche zwischen Kurven','a','4.8',collectionA,'pdf',{
 collection:true,
 prompt:'Ein zweifärbiges Stand-up-Paddling-Board wird in einem Koordinatensystem durch die oberen und unteren Begrenzungskurven f und g beschrieben. Die obere Kurve lautet f(x)=−0,0125x³+0,02x²+0,07x+0,2 für 0≤x≤4 (in m). Stelle anhand der amtlichen Abbildung eine Formel für die grau markierte Fläche auf. Bestimme außerdem die maximale Gesamtbreite b des Boards.',
 guide:'Zerlege die grau markierte Fläche in die Integrale zur oberen und unteren Begrenzung; für b nutzt du die Symmetrie um die x-Achse und den Hochpunkt von f. Die genaue Form der Kurve g ist der Originalabbildung zu entnehmen.',
 solution:'Amtliche Lösungserwartung: A=∫₀⁴ f(x)dx−∫₀²·⁸g(x)dx. Für die Breite gilt f′(2)=0, f(2)=0,32 m und damit b=2·0,32=0,64 m.'
});
P('A_318 a','Kleingartensiedlung – Grundstück halbieren','a','4.8',collectionA,'pdf',{
 collection:true,
 prompt:'Ein Grundstück wird durch drei gerade Seiten und den Graphen f(x)=0,01x²+0,01x+16 für 0≤x≤20 begrenzt (Koordinaten in m). Eine senkrechte Trennlinie bei x=a soll das Grundstück in zwei Gärten mit gleichem Flächeninhalt teilen. Ermittle a.',
 guide:'Nutze die Gleichung ∫₀ᵃ f(x)dx=½·∫₀²⁰ f(x)dx und löse sie mit einer Stammfunktion oder einem geeigneten Rechenwerkzeug nach a auf.',
 solution:'Amtliche Lösungserwartung: Die Gesamtfläche halbieren und die Teilflächen gleichsetzen ergibt a≈10,61 m.'
});
P('1_1309','Integral und Flächeninhalt – Vorzeichen richtig deuten','Zuordnung','4.8',
 'https://www.aufgabenpool.at/amn/Typ-1/853/1_1309_srdp_ma_Integral%20und%20Fl%C3%A4cheninhalt_PT2_23.pdf','pdf',{
 prompt:'Ein Funktionsgraph schneidet die x-Achse in 0, a, b und c. Die drei eingeschlossenen Teilflächen haben die Inhalte A₁=17, A₂=50 und A₃=2. Ordne die vier im offiziellen Aufgabenblatt angegebenen Integralausdrücke den passenden Werten zu.',
 guide:'Ein Integral oberhalb der x-Achse zählt positiv, eines darunter negativ. Zerlege Integrale über mehrere Teilintervalle in orientierte Teilflächen. Beachte vorangestellte Minuszeichen.',
 solution:'Amtliche Lösungserwartung (Zuordnung in der Reihenfolge des PDFs): A, C, B, D. Die Werte der Flächen sind orientiert, nicht pauschal positiv.'
});

if(Q.length!==34)throw Error('Expected 34 official Aufgabenpool PDF tasks, got '+Q.length);
if(new Set(Q.map(q=>q.id)).size!==Q.length)throw Error('Duplicate original task IDs');
if(Q.some(q=>!/https:\/\/(?:www\.)?aufgabenpool\.at\/amn\//.test(q.source)))throw Error('Foreign host in official bank');
window.MATHS_POOL_BANK=Object.freeze(Q);
})();
