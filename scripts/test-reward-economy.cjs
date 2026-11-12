'use strict';
/* vNext shop: paid catalog + learning-goal purchase eligibility, not free items.
 * All 12 shadow wallets and existing account progress remain untouched. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const shop=fs.readFileSync('src/app/shop-items.ts','utf8');
const host=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
const css=fs.readFileSync('src/app/app.scss','utf8');
const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const commonjs=ts.transpileModule(shop,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};vm.runInNewContext(commonjs,{exports:m.exports,module:m,console});
const items=Array.from(m.exports.SHOP_ITEMS);
const drops=Array.from(m.exports.SHOP_DROPS);
assert(items.length>65,'Current shop content must not be erased by economy change');
const global=items.filter(item=>item.drop==='global');
const testItems=items.filter(item=>item.drop!=='global');
assert(global.length>=20&&testItems.length>=30);
for(const item of global){
 assert(Number.isInteger(item.cost)&&item.cost>0,'Essentials prices remain positive: '+item.id);
 assert(Number.isInteger(item.level)&&item.level>=1,'Essentials retain global level gates: '+item.id);
}
for(const item of testItems){
 assert(Number.isInteger(item.cost)&&item.cost>0,'Test items must retain their original TT price: '+item.id);
 assert(item.requirement?.metric&&item.requirement?.value>0,
  'Every test item must have a measurable learning goal: '+item.id);
 assert(!('level' in item),'Test rewards cannot be locked behind global profile level: '+item.id);
}
assert(drops[0].id==='global'&&drops.filter(d=>d.id!=='global').length===3);
assert(!items.some(i=>i.id==='maths_avatar_pi'||i.id==='maths_title_integral'));
assert(!drops.some(d=>d.id==='maths-hw-02'));
assert(!registry.includes("id:'maths-hw-02'"));
assert(!fs.existsSync('public/maths/hw-02/index.html'));
const legacy=fs.readFileSync('src/app/legacy-owned-items.ts','utf8');
assert(legacy.includes("id:'maths_avatar_pi'")&&legacy.includes("id:'maths_title_integral'"),
 'Existing MathsVerse purchases remain available ONLY to existing inventory owners');
assert(host.includes('...LEGACY_OWNED_ITEMS].filter(item=>this.owns(item))'),
 'Legacy Math cosmetics must remain accessible in the inventory, never in the store');
assert(host.includes('MathsVerse · Archiv'),'Archived MathsVerse inventory category needs a readable name');

assert(host.includes("id:'mat',short:'AM'"),'MathsVerse tile remains visible while locked');
assert(host.includes('get drops(){return SHOP_DROPS.filter(d=>d.id===\'global\''),
 'Show test dropdown only after user unlocks an item');
assert(host.includes('this.items.some(i=>i.drop===d.id&&this.isUnlocked(i))'),
 'Test dropdown must depend on actual goals');
assert(host.includes('.filter(i=>!this.owns(i)'), 'Owned cosmetics may never appear in shop catalog');
assert(host.includes("this.profile.tokens-=item.cost;")&&host.includes("if(this.profile.tokens<item.cost)"),
 'All purchases, including test items, must deduct TT after checking available balance');
const accept=host.slice(host.indexOf('acceptReward(){'),host.indexOf('buyAndEquipReward(){'));
assert(accept.includes('this.finishRewardItem(item.id)'),
 'Weiter/Annehmen must advance exactly one reward in the batch');
assert(!accept.includes('this.buyOrEquip')&&!accept.includes('this.profile.inventory')&&!accept.includes('this.profile.tokens-='),
 'Weiter must not buy/grant rewards or change TT');
assert(host.includes('this.profile.rewardQueue')&&host.includes('this.profile.rewardSeen'),
 'Reward notification queue and seen ledger must persist in player profile');
assert(host.includes('this.checkRewardUnlocks();'),'Unlock notifications must be checked after trainer return');
assert(host.includes('get nextReward():ShopItem|null')&&host.includes('acceptReward()')&&host.includes('buyAndEquipReward()'),
 'Both sequential popup actions must be functional');
assert(html.includes('*ngIf="nextReward as reward"')&&html.includes('role="dialog"'),
 'New unlock popup must be accessible and conditional');
assert(html.includes('(click)="acceptReward()"')&&html.includes('(click)="buyAndEquipReward()"'),
 'Both popup buttons must be wired');
assert(html.includes('Kaufen &amp; Ausrüsten')&&html.includes('Weiter →'));
assert(!html.includes('[(ngModel)]="hideOwnedItems"'),'Hide-owned toggle no longer needed');
const catalog=html.slice(html.indexOf('<div class="item-grid drop-item-grid">'),
  html.indexOf('class="item-grid drop-item-grid inventory-item-grid"'));
assert(!catalog.includes('✓ OWNED'),'Catalog may never label owned items');
assert(catalog.includes('PREIS NACH FREISCHALTUNG')&&catalog.includes('{{item.cost | number}} TT'));
assert(!catalog.includes('GRATIS'),'Test items must not be advertised as free');
assert(catalog.includes('🎁 FREIGESCHALTET')&&catalog.includes('🔒 GESPERRT'));
assert(html.includes('class="item-grid drop-item-grid inventory-item-grid"'),
 'Inventory remains the only place for owned items');
assert(css.includes('.reward-unlock-modal')&&css.includes('.reward-unlock-actions'),
 'Reward popup must have specific styles');
console.log('PASS: '+global.length+' paid Essentials + '+testItems.length+
 ' paid test items; learning unlock carousel, buy-and-equip, inventory separation, MathsVerse lock.');
