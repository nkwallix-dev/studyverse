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
for(const [subject,path] of [['nawi','public/nawi/test-01/index.html'],['dsai','public/dsai/test-01/index.html'],['pos','public/pos/pa-01/index.html']]){
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

const newShop=fs.readFileSync('src/app/shop-items.ts','utf8');
assert(h.includes('class="sidebar-live-courses"'),'All playable trainer shortcuts should appear in top-left sidebar');
assert(h.includes('*ngFor="let trainer of trainers"')&&h.includes('openTrainer(trainer.id)'),
 'Sidebar shortcuts must derive from registry so all verses, including future ones, appear automatically');
const bannerCount=(h.match(/class="banner-scenery"/g)||[]).length;
assert.equal(bannerCount,2,'Both home and shop preview need full scene-based banners');
for(const banner of ['gold','warning','galaxy','molecule','flow','curve','cloud','solitaire','pink_paradise','parallel_pulse']){
 assert(c.includes('.universe[data-banner="'+banner+'"] .hero:has(.banner-scenery)'),banner+' needs its own full hero design');
 const scene=({pink_paradise:'pink',parallel_pulse:'parallel'})[banner]||banner;
 assert(h.includes('scene-'+scene),banner+' needs actual thematic scenery');
}
assert(h.includes('<div class="drop-price" *ngIf="!owns(item)"'),'Owned cosmetics should not show cost in store');
assert(h.includes('<p class="preview-cost" *ngIf="!owns(item)"'),'Owned cosmetics should not show cost in preview popup');
const weber=newShop.split('\n').find(x=>x.includes("id:'dsai_title_weber'"));
const fischer=newShop.split('\n').find(x=>x.includes("id:'title_chaos'"));
const radical=newShop.split('\n').find(x=>x.includes("id:'chem_radical'"));
assert(weber.includes("requirement:{metric:'boss',value:100}"),'Professorin Weber requires a perfect DSAI boss');
assert(fischer.includes("requirement:{metric:'boss',value:100}"),'Professor Fischer requires a perfect Chemistry boss');
assert(radical.includes("requirement:{metric:'academy',value:12}"),'Former prestige Radikal-Master swapped to academy');
console.log('Full-scene banner previews, prestige teachers, hidden owned prices and top-left courses verified.');


// Dashboard and learning-world ordering regression checks.
assert(t.includes("get activeSubjects(){return this.orderedSubjects.filter(s=>this.subjectHasTrainer(s.id));}"),
 'Dashboard must derive playable worlds dynamically from registered trainers');
assert(t.includes("const pinned:Record<string,number>={nawi:0,dsai:1,pos:2};"),
 'Pinned world priority: Chemverse, Dsaiverse, and next-up C#');
assert(t.includes('Number(this.subjectHasTrainer(b.id))-Number(this.subjectHasTrainer(a.id))'),
 'Playable worlds must appear ahead of all locked worlds');
assert(h.includes('*ngFor="let s of activeSubjects"'),
 'Dashboard must show only playable subjects');
assert(h.includes('*ngFor="let s of filteredSubjects"'),
 'Full Lernwelten page must preserve locked subjects');
assert(!h.includes('Dein nächster Boss'),
 'Fixed next boss teaser should not appear in the dashboard');
assert(h.includes('[(ngModel)]="achievementSort"') &&
 t.includes("achievementSort:'open'|'done'|'progress'|'reward'|'title'='open'"),
 'Achievements need working configurable sorting');
const chemversePage=fs.readFileSync('public/nawi/test-01/index.html','utf8');
assert(chemversePage.includes('<strong>Chemverse</strong>'),'Chemverse header should use standard casing');
assert(!chemversePage.includes("toast('Achievement:"),'Chemverse should never spam achievement notifications');
for(const path of ['src/app/app.html','src/app/trainer-registry.ts','src/app/shop-items.ts',
 'public/dsai/test-01/index.html','public/dsai/test-01/app.js','public/daily/index.html','public/daily/app.js']){
 assert(!fs.readFileSync(path,'utf8').includes('DSAIVERSE'),
  path+' must display Dsaiverse in consistent title case');
}
console.log('PASS: active dashboard worlds, C# third, achievements sorting, verse names and quiet Chemverse.');

const sharpTeacher=newShop.split('\n').find(x=>x.includes("id:'sharp_title_spermann'"));
const pinkBanner=newShop.split('\n').find(x=>x.includes("id:'sharp_pink'"));
const solitaireBanner=newShop.split('\n').find(x=>x.includes("id:'sharp_solitaire'"));
assert(sharpTeacher?.includes("name:'Professor Spermann'")&&sharpTeacher?.includes("metric:'boss',value:100"),
 'Professor Spermann requires a perfect 1. PA boss run');
assert(pinkBanner?.includes("equip:'pink_paradise'"),'Pink Paradise must be a real purchasable banner');
assert(solitaireBanner?.includes("equip:'solitaire'"),'Solitaire Cascade must be a real purchasable banner');
assert(h.includes('scene-solitaire')&&h.includes('scene-pink'),'Both banners must render in main and live preview');
assert(newShop.includes("id:'g_thread_sparks'")&&newShop.includes("id:'g_pulse_rings'"),
 'Two new VFX must be available by profile level 7');
