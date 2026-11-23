/* Official SRDP/BRP Angewandte Mathematik descriptor-4 source index.
 * 39 numbered B tasks were collected by filtering www.aufgabenpool.at/amn
 * on 23 Nov 2026. Eleven A tasks (descriptor 4.8) were cross-checked
 * against an openly published BMB exercise mirror on maths2mind.com.
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
P('B_636 b','Trinkflasche','b','4.4, 3.9',base+'1074/B_636 Trinkflasche (PT3_2024).pdf');
P('B_512 b','Ressourcen','b','4.4',base+'877/B_512 Ressourcen (PT1_2021).pdf');
P('B_512 c','Ressourcen','c','4.4',base+'877/B_512 Ressourcen (PT1_2021).pdf');
P('B_503 c','Scharniere','c','4.4',base+'853/Scharniere (PT3_2020).pdf');
P('B_475 d','W-LAN','d','4.4, 4.5',base+'807/W-LAN.pdf');
P('B_444 a','Boule','a','4.4, 3.4',base+'725/Boule (PT1_2019).pdf');
P('B_440 c','Werbung','c','4.4',base+'699/Werbung.pdf');
P('B_432 a','Elektrische Bauteile','a','4.4, 3.2',base+'589/Elektrische Bauteile.pdf');
P('B_432 b','Elektrische Bauteile','b','4.4',base+'589/Elektrische Bauteile.pdf');
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
P('B_373 b','Puppenrutsche','b','4.4, 3.4',base+'710/Puppenrutsche.pdf');
P('B_364 b','Nemo','b','4.4, 4.3',base+'765/Nemo.pdf');
P('B_364 c','Nemo','c','4.4, 4.8',base+'765/Nemo.pdf');
P('B_352 c','Staatseinnahmen und -ausgaben','c','4.4, 4.5, 4.8',base+'449/Staatseinnahmen_ausgaben.pdf');
P('B_347 d','Vektorgrafiken','d','4.4',base+'427/Vektorgrafiken.pdf');
P('B_336 c','Bastelarbeit im Kindergarten','c','4.4',base+'709/Bastelarbeit im Kindergarten.pdf');
P('B_322 b','Schwangerschaft','b','4.4, 3.2',base+'375/Schwangerschaft.pdf');
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
 expected:49.133333333
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
 solution:'Berechne die Gesamtfläche und halbiere sie. Setze F(a) auf die Hälfte und löse numerisch. Die Teilstelle liegt bei ungefähr a=10,65 m.',
 expected:10.65
});
if(Q.length!==50)throw Error('Expected exactly 50 genuinely sourced pool tasks, got '+Q.length);
if(new Set(Q.map(q=>q.id)).size!==Q.length)throw Error('Duplicate pool tasks');
window.MATHS_POOL_BANK=Object.freeze(Q);
})();