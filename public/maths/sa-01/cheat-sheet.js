(function(){
'use strict';
const pages=[
{title:'01 · Umformen & Ableiten',cards:[
['Potenzen, Wurzeln & Brüche',[
['x<sup>−n</sup> = 1/x<sup>n</sup>','1/x³ = x⁻³'],
['ⁿ√(x<sup>m</sup>) = x<sup>m/n</sup>','³√x = x<sup>1/3</sup>; ³√(x²) = x<sup>2/3</sup>; 1/√x = x<sup>−1/2</sup>'],
['x<sup>a</sup> · x<sup>b</sup> = x<sup>a+b</sup>','x² · x³ = x⁵; x⁵/x² = x³'],
['(x<sup>a</sup>)<sup>b</sup> = x<sup>ab</sup>','(x²)³ = x⁶']
],'Für gebrochene Potenzen im Reellen auf den Definitionsbereich achten; bei geraden Wurzeln darf der Radikand nicht negativ sein.'],
['Nullstellen & p-q-Formel',[
['x² + px + q = 0 ⇒ x₁,₂ = −p/2 ± √((p/2)² − q)','x² − 6x − 1 = 0 ⇒ x₁,₂ = 3 ± √10'],
['ax² + bx + c = 0 ⇒ p = b/a, q = c/a','Erst durch a teilen! Alternativ: x₁,₂ = (−b ± √(b²−4ac))/(2a).'],
['x·(x−4) = 0 ⇒ x = 0 oder x = 4','Vor der p-q-Formel prüfen, ob Ausklammern schneller geht.']
],'Radikand negativ: keine reelle Lösung; null: eine doppelte Lösung.'],
['Ableitungsregeln',[
['(x<sup>n</sup>)′ = n·x<sup>n−1</sup>','(4x³)′ = 12x²; (1/x²)′ = −2/x³'],
['(u+v)′ = u′+v′; (c·u)′ = c·u′','Konstanten allein werden 0.'],
['(u·v)′ = u′v + uv′','(x²·sin x)′ = 2x·sin x + x²·cos x'],
['(u/v)′ = (u′v−uv′)/v²','(x/eˣ)′ = (eˣ−xeˣ)/e²ˣ = (1−x)/eˣ'],
['(f(g(x)))′ = f′(g(x))·g′(x)','(sin(3x²))′ = cos(3x²)·6x; (e<sup>2x</sup>)′ = 2e<sup>2x</sup>']
],'Kettenregel: außen ableiten, innen stehen lassen, mal innere Ableitung. Produktregel ist nicht u′·v′!'],
['Standardableitungen',[
['(sin x)′ = cos x; (cos x)′ = −sin x','(tan x)′ = 1/cos²x'],
['(eˣ)′ = eˣ; (ln x)′ = 1/x','(aˣ)′ = aˣ·ln a (a > 0)'],
['(√x)′ = 1/(2√x)','(ln|u|)′ = u′/u, u ≠ 0']
],'Trigonometrische Ableitungen setzen Bogenmaß voraus.'],
['Kurvendiskussion & Tangenten',[
['Nullstellen: f(x)=0; Extremstellen: f′(x)=0','f″(x₀)>0: Tiefpunkt; f″(x₀)<0: Hochpunkt. Bei f″=0 weiter prüfen.'],
['Wendestellen: f″(x)=0','Krümmungswechsel prüfen; f‴(x₀)≠0 ist hinreichend.'],
['Tangente: y = f′(x₀)(x−x₀)+f(x₀)','Steigung m=f′(x₀); Winkel α=arctan(m).'],
['Polynom 3. Grades: f(x)=ax³+bx²+cx+d','Punkt ⇒ f(x₀)=y₀; Extrempunkt ⇒ f′(x₀)=0; Wendepunkt ⇒ f″(x₀)=0. Vier unabhängige Bedingungen lösen.']
],'Bei Optimierung: Zielfunktion aufstellen, Nebenbedingung einsetzen, ableiten, kritische Stellen und Randwerte vergleichen.'],
['Partielle Ableitungen',[
['∂/∂x: y konstant; ∂/∂y: x konstant','z=3x²y+4y³ ⇒ zₓ=6xy; zᵧ=3x²+12y²'],
['zₓₓ=6y; zᵧᵧ=24y; zₓᵧ=zᵧₓ=6x','Gemischte Ableitungen sind bei stetigen zweiten Ableitungen gleich.'],
['Tangentialebene: z=z₀+zₓ(P)(x−x₀)+zᵧ(P)(y−y₀)','Zuerst z₀=f(x₀,y₀) berechnen.']
],'Alle anderen Variablen werden wie Zahlen behandelt.']
]},
{title:'02 · Integrale & Anwendungen',cards:[
['Stammfunktionen – die wichtigsten',[
['∫ x<sup>n</sup> dx = x<sup>n+1</sup>/(n+1)+C (n≠−1)','∫ 4x³ dx = x⁴+C; ∫ x<sup>1/3</sup> dx = ¾x<sup>4/3</sup>+C'],
['∫ 1/x dx = ln|x|+C','∫ 5/x dx = 5ln|x|+C (x≠0)'],
['∫ eˣ dx = eˣ+C; ∫ sin x dx = −cos x+C','∫ cos x dx = sin x+C'],
['∫ 1/cos²x dx = tan x+C','∫ aˣ dx = aˣ/ln(a)+C (a>0, a≠1)']
],'Unbestimmtes Integral: immer +C. Potenzregel gilt nicht für x⁻¹!'],
['Innere Funktion: die schnellen Tricks',[
['∫ e<sup>ax+b</sup> dx = e<sup>ax+b</sup>/a+C','∫ 5e<sup>2x</sup> dx = (5/2)e<sup>2x</sup>+C'],
['∫ sin(ax+b) dx = −cos(ax+b)/a+C','∫ sin(0,5x) dx = −2cos(0,5x)+C'],
['∫ cos(ax+b) dx = sin(ax+b)/a+C','∫ cos(3x) dx = sin(3x)/3+C'],
['∫ u′/u dx = ln|u|+C','∫ 1/(2x+3) dx = ½ln|2x+3|+C'],
['∫ u′·u<sup>n</sup> dx = u<sup>n+1</sup>/(n+1)+C','∫ 2x·(x²+1)³ dx = (x²+1)⁴/4+C']
],'Bei linearer innerer Funktion durch deren Steigung a≠0 teilen. Bei nichtlinearer innerer Funktion muss die passende Ableitung als Faktor vorhanden sein.'],
['Partielle Integration & Polynomdivision',[
['∫ u·v′ dx = u·v − ∫ u′·v dx','∫ x·eˣ dx: u=x, v′=eˣ ⇒ xeˣ−eˣ+C'],
['∫ x·cos x dx = x·sin x + cos x+C','u=x; v=sin x; das verbleibende Integral ist ∫ sin x dx.'],
['x²/(x+1) = x−1+1/(x+1)','∫ x²/(x+1) dx = x²/2−x+ln|x+1|+C']
],'Partielle Integration bei geeigneten Produkten. Bei rationalen Funktionen zuerst Polynomdivision, wenn Zählergrad ≥ Nennergrad.'],
['Bestimmtes Integral & Flächen',[
['Untergrenze a, Obergrenze b: ∫ f(x) dx = F(b)−F(a)','Beispiel: ∫ 3sin(x) dx von 0 bis π/2 = −3cos(π/2)−(−3cos(0)) = 3.'],
['Fläche zur x-Achse: A = ∫ |f(x)| dx','Nullstellen im Intervall finden; Teilintegrale einzeln berechnen und Beträge addieren.'],
['Fläche zwischen zwei Graphen: A = ∫ |f(x)−g(x)| dx','Schnittpunkte mit f=g bestimmen. Je Abschnitt: obere minus untere Funktion.'],
['Beispiel: f=x², g=2x; Schnittpunkte 0 und 2','A = Integral von 2x−x², von 0 bis 2 = 4/3.']
],'Bei bestimmten Integralen kein +C nötig. Positive und negative Flächen können sich im orientierten Integral aufheben.'],
['Rotationsvolumen & Masse',[
['Um x-Achse: V = π·∫ [f(x)]² dx','Grenzen sind x-Werte. Bei Hohlkörpern: π·∫ (R²−r²) dx.'],
['Um y-Achse (Querschnitte): V = π·∫ [x(y)]² dy','Nach x bzw. x² umstellen; Grenzen sind y-Werte.'],
['m = ρ·V','1 cm³ = 1 ml; 1 l = 1000 cm³; 1 m³ = 1000 l = 10 hl; 1000 mm³ = 1 cm³.']
],'Radius quadrieren, nicht den Wert des Integrals! Dichte und Volumen müssen zusammenpassende Einheiten haben.'],
['Anwendungen: Bewegung & Änderungsraten',[
['v(t)=s′(t); a(t)=v′(t)=s″(t)','v(t)=v₀+ Integral von a(τ) über τ von 0 bis t.'],
['s(t)=s₀+ Integral von v(τ) über τ von 0 bis t','Anfangsbedingungen bestimmen die Integrationskonstante.'],
['Mittlere Änderungsrate = (f(b)−f(a))/(b−a)','Momentane Änderungsrate = f′(t).'],
['Menge = Integral der Rate über die Zeit','Durchfluss in m³/s × integrierte Sekunden ⇒ m³; zurückgelegter Weg = Integral von |v|.']
],'GeoGebra: Winkelmodus RAD bei π-Integralen; bei Flächen und Nullstellen Ergebnis mit Skizze bzw. Vorzeichen prüfen.']
]}
];
function render(){return '<div class="cheat-sheet"><div class="eyebrow">NACHSCHLAGEN · 1. SCHULARBEIT</div><h1>Cheat Sheet<span style="color:var(--accent)">.</span></h1><p>Die wichtigsten Rechenregeln, schnelle Umformungen und Fehlerfallen. Zwei kompakte Kapitel – kein unnötiger Theorieballast.</p><div class="cheat-tabs" role="group" aria-label="Kapitel">'+pages.map((p,i)=>'<button type="button" class="btn secondary" aria-pressed="'+(i===0)+'" data-cheat-page="'+i+'">'+p.title+'</button>').join('')+'</div>'+pages.map((p,i)=>'<section class="cheat-page" data-cheat-panel="'+i+'" '+(i?'hidden':'')+'><div class="cheat-grid">'+p.cards.map(c=>'<article class="panel cheat-card"><h2>'+c[0]+'</h2>'+c[1].map(r=>'<div class="cheat-rule"><div class="cheat-formula">'+r[0]+'</div><p>'+r[1]+'</p></div>').join('')+'<div class="cheat-tip"><strong>Merke:</strong> '+c[2]+'</div></article>').join('')+'</div></section>').join('')+'</div>'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cheat-page]');if(!b)return;const root=b.closest('.cheat-sheet');root.querySelectorAll('[data-cheat-page]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));root.querySelectorAll('[data-cheat-panel]').forEach(x=>x.hidden=x.dataset.cheatPanel!==b.dataset.cheatPage);});
window.MATHS_CHEAT_SHEET=Object.freeze({render});
})();