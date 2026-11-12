'use strict';
// Shared Endgame is visually the last sidebar group in every active learning world.
// Only the boss label/icon may differ; the next and last link must be Sources.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const chem=fs.readFileSync('public/nawi/test-01/index.html','utf8');
const dsai=fs.readFileSync('public/dsai/test-01/index.html','utf8');
const djs=fs.readFileSync('public/dsai/test-01/app.js','utf8');
const sharp=fs.readFileSync('public/pos/pa-01/app.js','utf8');
const sharpHtml=fs.readFileSync('public/pos/pa-01/index.html','utf8');
const css=fs.readFileSync('public/shared/verse-endgame.css','utf8');
for(const [verse,markup] of [['Chemverse',chem],['Dsaiverse',dsai],['Sharpverse',sharpHtml]])
 assert(markup.includes('../../shared/verse-endgame.css'),verse+' loads common Endgame CSS');
assert(chem.includes("MENUS.filter(g=>g.group!=='ENDGAME')"),
 'Chemverse renders its main scrollable menu separately from the pinned Endgame');
assert(chem.indexOf("group:'ZUSATZ · NICHT PFLICHT'")<chem.indexOf("group:'ENDGAME'"),
 'Chemverse Orbital-Kästchen must be before the final Endgame');
assert(/<nav class="nav" id="nav"[^>]*><\/nav>\s*<div class="verse-endgame"/.test(chem),
 'Chemverse Endgame directly follows the nav, no info box');
assert(chem.includes("document.querySelectorAll('#sidebar [data-nav]')"),
 'Chemverse should keep its pinned boss and sources clickable after rerender');
assert(/<\/nav>\s*<div class="verse-endgame"[^>]*>[\s\S]*?data-nav="boss"[\s\S]*?data-nav="sources"[\s\S]*?<\/div>\s*<\/aside>/.test(dsai),
 'Dsaiverse has Boss then Sources as the last sidebar group');
assert(!dsai.includes('sidebar-bottom')&&!dsai.includes('Dein Fortschritt bleibt gespeichert'),
 'Dsaiverse sidebar bottom storage/XP/TastyToken note must disappear');
assert(djs.includes('querySelectorAll("#sidebar button[data-nav]")')&&
 djs.includes('$("sidebar").addEventListener("click"'),
 'Dsaiverse pinned Boss/Sources must update active state and navigate');
const sharpSidebar=sharp.slice(sharp.indexOf('function sidebar(){'),sharp.indexOf('function home(){'));
assert(sharpSidebar.includes('class="verse-endgame"')&&
 sharpSidebar.indexOf("endgameLink('boss'")>0&&
 sharpSidebar.indexOf("endgameLink('boss'")<sharpSidebar.indexOf("endgameLink('sources'")&&
 sharpSidebar.includes("'</div></aside>';"),
 'Sharpverse endgame must be the last group: custom Boss label then Sources');
assert(!sharp.includes('<div class="nav-bottom">')&&!sharp.includes('<small>DEIN FORTSCHRITT</small>'),
 'Sharpverse sidebar progress and cloud storage advertising must be removed');
assert(css.includes('.verse-endgame-button.active')&&css.includes('margin-top:auto'),
 'All verses share styled, bottom-pinned Endgame controls');
console.log('PASS: Chemverse, Dsaiverse and Sharpverse end in Boss → Quellen, with no redundant sidebar status block.');
