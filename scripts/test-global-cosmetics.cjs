'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const shop=read('src/app/shop-items.ts'),css=read('public/shared/verse-cosmetics.css');
const home=read('src/app/app.scss')+'\n'+read('src/styles.scss');
const html=read('src/app/app.html'),app=read('src/app/app.ts');
const catalog={theme:new Set(),frame:new Set()};
for(const line of shop.split('\n')){
 const g=line.match(/group:'(theme|frame)'/);if(!g)continue;
 const id=line.match(/\bid:'([^']+)'/),equip=line.match(/equip:'([^']+)'/);
 assert(id,'Missing cosmetic ID');catalog[g[1]].add(equip?equip[1]:id[1]);
}
for(const [group,values] of Object.entries(catalog))for(const value of values){
 assert(css.includes('data-'+group+'="'+value+'"'),'Missing standalone '+group+': '+value);
 assert(home.includes('data-'+group+'="'+value+'"'),'Missing homepage '+group+': '+value);
}
for(const theme of ['gold','ocean','chem_reactor'])assert(css.includes('data-theme="'+theme+'"'));
for(const frame of ['glass','kenny_fossil'])assert(css.includes('data-frame="'+frame+'"'));
for(const path of ['nawi/test-01','dsai/test-01','pos/pa-01','maths/sa-01']){
 const index=read('public/'+path+'/index.html');
 assert(index.includes('../../shared/verse-cosmetics.css'),path+' missing shared CSS');
 assert(index.includes('../../shared/verse-cosmetics.js'),path+' missing shared JS');
}
assert(!html.includes('sidebar-live-course'),'LIVE shortcut remains');
assert(html.includes('(click)="go(\'subjects\')" [style.--tilecolor]="s.color"'),'Dashboard shortcut remains');
assert(html.includes('(click)="openTrainer(trainer.id)">Spielen'),'Subject Play button missing');
assert(app.includes('EQUIP_PENDING')&&app.includes('confirmEquipmentSave')&&app.includes('rememberEquipment(key)'),'Unsaved equipment protection missing');
console.log('PASS '+catalog.theme.size+' themes, '+catalog.frame.size+' frames, four worlds, Cloud and navigation');
