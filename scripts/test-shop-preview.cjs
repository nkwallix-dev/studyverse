// Verify that the live-preview is a real, isolated mini-dashboard for every cosmetic
// except avatar/title; placeholder subjects are locked using actual trainer availability.
const fs=require('node:fs'), assert=require('node:assert/strict'),ts=require('typescript');
const h=fs.readFileSync('src/app/app.html','utf8');
const t=fs.readFileSync('src/app/app.ts','utf8');
const c=fs.readFileSync('src/styles.scss','utf8');
const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const items=fs.readFileSync('src/app/shop-items.ts','utf8');
const preview=h.slice(h.indexOf('<div class="veil shop-preview-veil"'),h.indexOf('<div class="notice"'));
assert(preview.includes('class="universe shop-live-stage"'),'A live mini-universe must be in the popup');
assert(preview.includes("item.group!=='avatar' && item.group!=='title'"),'Avatar/title should retain their current simple preview');
for(const group of ['theme','atm','frame','font','banner','fx']){
 assert(preview.includes("[attr.data-"+group+"]=\"previewValue('"+group+"',item)\""),
  group+' is missing from the active sample');
}
assert(preview.includes('class="hero')||preview.includes('class="shop-live-hero hero"'),'A banner sample must be displayed');
assert(preview.includes('class="profile-panel shop-frame-card"'),'A real previewable frame card is required');
assert(preview.includes('class="stat shop-frame-card"'),'Second frame comparison tile is required');
assert(preview.includes("item.group==='fx'"),'Effect visuals must be animated in the mini scene');
assert(preview.includes('previewParticleSlots'),'Particle rendering must be wired in the Angular template');
assert(c.includes('@keyframes shop-fx-fall')&&c.includes('@keyframes shop-atm-fall'), 'Particle and background animation must exist');
assert(c.includes('.shop-live-stage.universe[data-frame="dataframe"] .shop-frame-card'),'DataFrame item needs an actual table-like frame');
assert(c.includes('.universe[data-frame="dataframe"] :is('),'DataFrame frame must ALSO work in real app');
assert(c.includes('.shop-live-stage.universe[data-frame="gold"] .shop-frame-card')&&c.includes('.shop-live-stage.universe[data-frame="legend"] .shop-frame-card'), 'Gold and legendary borders need distinct appearances');
assert(t.includes('get previewTheme(){return this.currentTheme;}'),'Preview must NOT change main homepage design');
assert(t.includes('previewSlot(k:string){return this.profile.equipped[k]'),'Preview must NOT equip the candidate elsewhere');
assert(t.includes('previewValue(slot:string,item:ShopItem)'),'Preview method must choose candidate only for the popup');
assert(t.includes("preview(item:ShopItem){this.previewed=item;}"),'Preview must not purchase an item');
assert(preview.includes('Vorschau ohne Kauf'), 'Explain that TT balance is unaffected');
for(const category of ['theme','atm','frame','font','banner','fx']){
 assert(items.includes("group:'"+category+"'"),'Shop must contain '+category+' products');
}
assert(h.includes('[disabled]="!subjectHasTrainer(s.id)"'),'Unavailable subject tiles must be actually disabled');
assert(h.includes('class="subject-lock-overlay"'),'Unavailable subjects need a visible LOCKED overlay');
assert(h.includes('COMING SOON'),'Unavailable subject label should be obvious');
assert(h.includes('{{subjectCountLabel(s.id)}}'),'Available labels derive from registry, not hardcoded subject ids');
assert(t.includes("choose(id:string){if(!this.subjectHasTrainer(id))return;"),'Direct navigation to a locked subject must be guarded');
assert(t.includes('subjectHasTrainer(id:string):boolean{return TRAINERS.some'),'Subjects must unlock based on a trainer registry entry');
for(const [subject,path] of [['nawi','public/nawi/test-01/index.html'],['dsai','public/dsai/test-01/index.html']]){
 assert(registry.includes("subjectId:'"+subject+"'"),'Live subject not in trainer registry: '+subject);
 assert(fs.existsSync(path),'Registered trainer is not deployable: '+path);
}
assert(t.includes("return item.group===slot?(item.equip||item.id)"),'Candidate item must only alter its own sample slot');
console.log('PASS: scoped live previews and locked unavailable learning worlds.');

const catalog=h.slice(h.indexOf('<div class="item-grid drop-item-grid">'),h.indexOf('class="item-grid drop-item-grid inventory-item-grid"'));
const inventory=h.slice(h.indexOf('class="item-grid drop-item-grid inventory-item-grid"'),h.indexOf('class="empty-tests inventory-empty"'));
assert(catalog.includes('class="item-title-row"'),'Shop badges must be adjacent to product title');
assert(inventory.includes('class="item-title-row"'),'Inventory equipped badge must be adjacent to product title');
assert(catalog.includes('class="item-inline-status owned"')&&catalog.includes('class="item-inline-status locked-status"'),'Catalog must label owned and locked, below art');
assert(!catalog.includes('🔓 UNLOCKED'),'Redundant unlocked labels must be removed');
assert(!catalog.includes('item-top-badge'),'No status overlays on catalog item art');
assert(!inventory.includes('inventory-equipped-badge'),'No status overlays on inventory art');
assert(inventory.includes('class="item-inline-status equipped-status"'),'Equipped state should be a small badge beside inventory title');
assert(!inventory.includes('✓ OWNED')&&!inventory.includes('IM INVENTAR'),'Inventory already means owned: no redundant ownership badges');
assert(catalog.includes("[class.panda-art]=\"item.id==='dsai_panda'\"")&&inventory.includes("[class.panda-art]=\"item.id==='dsai_panda'\""),'Panda needs the larger avatar art in shop and inventory');
assert(c.includes('.drop-item .item-art.drop-item-art.panda-art .big-item-icon'),'Panda art must have an enlarged rendering');
console.log('PASS: clean item art; statuses next to titles; enlarged panda in catalog and inventory.');
