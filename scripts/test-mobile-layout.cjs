// Real Chromium mobile smoke test for Studyverse, Chemverse, Dsaiverse and Sharpverse.
// Run after: npm run build -- --base-href /studyverse/ --output-path dist/site
// Requires the Playwright package and Google Chrome/Chromium on the test runner.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');

const root=path.resolve('dist/site/browser');
const screenshots=path.resolve('mobile-screenshots');
const contentTypes={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'
};
function binaryPath(){
 if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;
 for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
  try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch{}
 }
 throw Error('No system Google Chrome or Chromium found for mobile visual test');
}
const server=http.createServer((request,response)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname)}catch{response.writeHead(400).end();return}
 if(!pathname.startsWith('/studyverse/')){response.writeHead(404).end();return}
 if(pathname==='/studyverse/cloud-config.json'){
  // Keep the test fully local: no Firebase credentials or live account requests.
  response.writeHead(200,{'Content-Type':'application/json'}).end('{"apiKey":"","projectId":""}');
  return;
 }
 const relative=pathname.slice('/studyverse/'.length);
 const target=path.resolve(root,relative||'index.html');
 if(!target.startsWith(root+path.sep)&&target!==path.join(root,'index.html')){
  response.writeHead(403).end();return;
 }
 const source=fs.existsSync(target)&&fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
 fs.readFile(source,(error,data)=>{
  if(error){response.writeHead(404).end();return}
  response.writeHead(200,{'Content-Type':contentTypes[path.extname(source)]||'application/octet-stream'});
  response.end(data);
 });
});
function overflow(page,label){
 return page.evaluate(label=>{
  const width=document.documentElement.clientWidth;
  const bodyWidth=Math.max(document.body.scrollWidth,document.documentElement.scrollWidth);
  const bad=[...document.querySelectorAll('body *')].filter(el=>{
   const cs=getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')return false;
   const box=el.getBoundingClientRect();
   return box.width>0&&(box.right>width+3||box.left< -3)
      &&cs.overflowX!=='hidden'&&cs.overflowX!=='clip';
  }).slice(0,7).map(el=>({
    tag:el.tagName.toLowerCase(),class:String(el.className).slice(0,90),
    left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)
  }));
  return {label,width,bodyWidth,extra:Math.round(bodyWidth-width),candidates:bad};
 },label);
}
async function main(){
 assert(fs.existsSync(path.join(root,'index.html')),'Build is missing: dist/site/browser/index.html');
 fs.mkdirSync(screenshots,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/studyverse/';
 const browser=await chromium.launch({
  executablePath:binaryPath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
 });
 const problems=[];
 const check=async(page,label)=>{
  const result=await overflow(page,label);
  if(result.extra>3)problems.push(result);
  console.log((result.extra>3?'OVERFLOW':'OK')+' '+label+': '+result.width+'px viewport, overflow '+result.extra+'px');
  if(result.extra>3)console.log(JSON.stringify(result.candidates));
 };
 try{
  for(const width of [320,360,390,430,768]){
   const context=await browser.newContext({
    viewport:{width,height:800},deviceScaleFactor:1,isMobile:true,hasTouch:true
   });
   const page=await context.newPage();
   await page.addInitScript(()=>localStorage.setItem('studyverse_import_prompt_seen_v1','1'));
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base,{waitUntil:'load'});
   await page.locator('.dashboard-grid').waitFor({timeout:12000});
   await check(page,'Studyverse Dashboard '+width);
   const cardLayout=await page.evaluate(()=>{
    const bounds=selector=>document.querySelector(selector).getBoundingClientRect();
    const rail=bounds('.dashboard-grid .right-rail');
    const level=bounds('.dashboard-level');
    const hero=bounds('main .hero');
    const stats=bounds('main .stats');
    const inventory=bounds('.dashboard-grid .right-rail>.loot-card');
    const achievements=bounds('.dashboard-grid .right-rail>.achievements-preview');
    const activity=bounds('.dashboard-grid .right-rail>.activity-card:last-child');
    return {railWidth:rail.width,levelWidth:level.width,statsWidth:stats.width,
      heroBottom:hero.bottom,levelTop:level.top,levelBottom:level.bottom,statsTop:stats.top,levelHeight:level.height,
      inventoryTop:inventory.top,achievementsTop:achievements.top,
      activityWidth:activity.width};
   });
   assert(Math.abs(cardLayout.levelWidth-cardLayout.statsWidth)<=4,
    'Level XP bar should match the statistics row width at '+width+'px');
   assert(cardLayout.levelTop>=cardLayout.heroBottom && cardLayout.levelBottom<=cardLayout.statsTop,
    'Level XP bar should sit between the hero and statistics at '+width+'px');
   assert(cardLayout.levelHeight<=160,
    'Level XP bar should remain compact at '+width+'px');
   assert(cardLayout.activityWidth >= cardLayout.railWidth-4,
    'Activity history should fill both dashboard info-grid columns at '+width+'px');
   if(width>=360){
    assert(Math.abs(cardLayout.inventoryTop-cardLayout.achievementsTop)<=6,
     'Inventory and achievements should be side by side at '+width+'px');
   }
   if(width===390)await page.screenshot({path:path.join(screenshots,'studyverse-dashboard-390.png'),fullPage:true});
   let shopFilterTop=null;
   for(const [label,nav] of [
    ['Lernwelten','Lernwelten'],['Achievements','Achievements'],['Item-Shop','Item-Shop'],
    ['Inventar','Inventar'],['Dino-Verse','Dino-Verse'],['Begleiter','Begleiter']]){
    // Inventory stays inside the Shop; companions are a full destination.
    const button=width<=700&&label==='Inventar'
     ?page.locator('.shop-view-tabs button').filter({hasText:'Inventar'})
     :page.locator('.navigation button[aria-label="'+nav+'"]');
    await button.waitFor({state:'visible',timeout:5000});
    await button.click();
    await page.waitForTimeout(100);
    await check(page,'Studyverse '+label+' '+width);
    if(['Item-Shop','Inventar'].includes(label)){
     const layout=await page.evaluate(()=>({viewport:innerHeight,page:document.documentElement.scrollHeight,
      mainBottom:document.querySelector('main').getBoundingClientRect().bottom}));
     assert(layout.page<=layout.viewport+3&&layout.mainBottom<=layout.viewport+3,
      'Shop destinations should fit the screen without page scrolling: '+JSON.stringify(layout));
    }
    if (label === 'Lernwelten' && width <= 700) {
     const categoryFilter = page.getByRole('combobox', { name: 'Lernwelten nach Kategorie filtern' });
     await categoryFilter.selectOption('Informatik');
     await page.waitForFunction(() =>
       [...document.querySelectorAll('.all-subjects .subject-card')].every((card) =>
         card.querySelector('small').textContent.includes('Informatik'),
       ),
     );
     assert(await page.locator('.all-subjects .subject-card').count());
     await categoryFilter.selectOption('Alle');
     await page.waitForFunction(() => document.querySelectorAll('.all-subjects .subject-card').length > 3);
     const worldColumns = await page.locator('.all-subjects').evaluate((grid) =>
       getComputedStyle(grid).gridTemplateColumns.split(' ').length,
     );
     assert.equal(worldColumns, 3);
     if (width === 390) await page.screenshot({ path: path.join(screenshots, 'studyverse-lernwelten-390.png') });
    }
    if (label === 'Achievements' && width <= 700) {
     if (width === 320) await page.setViewportSize({ width, height: 568 });
     await page.evaluate(async () => {
       await document.fonts.ready;
       window.scrollTo({ top: 0, behavior: 'instant' });
     });
     const achievements = await page.locator('.achievement-grid').first().evaluate((grid) => {
       const navTop = document.querySelector('.sidebar').getBoundingClientRect().top;
       const cards = [...grid.children].slice(0, 4).map((card) => {
         const { top, bottom } = card.getBoundingClientRect();
         return { top, bottom };
       });
       return {
         columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
         viewport: { width: innerWidth, height: innerHeight },
         cards,
         navTop,
       };
     });
     assert.equal(achievements.columns, 2);
     assert(achievements.cards.length === 4 &&
       achievements.cards.every(({ top, bottom }) => top >= 0 && bottom <= achievements.navTop),
       'Four achievements should fit above mobile navigation: ' + JSON.stringify(achievements));
     if (width === 390) await page.screenshot({ path: path.join(screenshots, 'studyverse-achievements-390.png') });
     if (width === 320) await page.setViewportSize({ width, height: 800 });
    }
    if(label==='Begleiter'){
     if (width <= 700) {
      assert(await page.locator('.companions-page > .page-subtitle').isHidden());
      assert((await page.locator('.companion-mobile-description').innerText()).includes('Jeder Dino bringt'));
      assert(await page.locator('.companion-mobile-description').isVisible());
     }
     assert.equal(await page.locator('.companions-hint').count(),0,'No redundant Daily cap sentence');
     await page.locator('.companions-grid').waitFor({state:'visible'});
     assert.equal(await page.locator('.companion-card').count(),3,
      'Three companion slots must appear with the current Kenny');
     assert(await page.locator('.companion-enter').isVisible(),
      'Kennyverse must be enterable during the active season');
     const companionLayout=await page.evaluate(()=>{
      const box=selector=>document.querySelector(selector).getBoundingClientRect();
      const cards=[...document.querySelectorAll('.companions-grid .companion-card')].map(el=>el.getBoundingClientRect());
      return {viewport:innerHeight,scroll:document.documentElement.scrollHeight,
       cardBottom:Math.max(...cards.map(x=>x.bottom)),
       cta:document.querySelector('.companion-enter').getBoundingClientRect().toJSON(),
       firstCard:cards[0].toJSON(),
       cardWidths:cards.map(x=>x.width),visibleHeight:cards[0].height};
     });
     assert(companionLayout.scroll<=companionLayout.viewport+3&&
       companionLayout.cardBottom<=companionLayout.viewport-(width<=700?68:0)+2&&
       companionLayout.visibleHeight>95&&companionLayout.cardWidths.every(x=>x>90)&&
       companionLayout.cta.top>=companionLayout.firstCard.top+2&&
       companionLayout.cta.bottom<=companionLayout.firstCard.bottom-2&&
       companionLayout.cardBottom>=companionLayout.viewport-(width<=700?108:48),
       'Begleiter cards, actions and footer must fit without scrolling at '+width+': '+JSON.stringify(companionLayout));
     if(width===390)await page.screenshot({path:path.join(screenshots,'begleiter-390.png'),fullPage:true});
    }
    if(label==='Inventar'){
     assert.equal(await page.locator('.inventory-summary').count(),0,
      'Remove the cosmetics summary');
     assert.equal(await page.locator('.shop-view-tabs button').count(),3);
     const filterTop=await page.locator('.inventory-filter-bar.shop-filter-start').evaluate(el=>el.getBoundingClientRect().top);
     assert(shopFilterTop!==null&&Math.abs(shopFilterTop-filterTop)<10,
       'Catalog and Inventory filters must start at the same height: '+JSON.stringify({shopFilterTop,filterTop}));
    }
    if(label==='Dino-Verse'){
     await page.locator('.kenny-page').waitFor({state:'visible'});
     assert(await page.locator('.kenny-feed-btn').isVisible(),
      'Dino-Verse must remain a direct, independent feeding destination');
     if (width <= 700) {
      assert(await page.locator('.kenny-loot').isHidden());
      const stage = await page.locator('.kenny-play > .kenny-stage').boundingBox();
      assert(stage.height >= 160, 'Kenny must have room for the feeding animation');
      const prizesDialog = page.getByRole('dialog', { name: 'Kennys mögliche Gewinne' });
      await page.locator('.kenny-mobile-prizes').click();
      await prizesDialog.waitFor({ state: 'visible' });
      await page.locator('.kenny-dialog-close').click();
      await prizesDialog.waitFor({ state: 'hidden' });
     } else {
      assert(await page.locator('.kenny-loot').isVisible()&&
       await page.locator('.kenny-exclusives>div').count()===6,
       'All six Kenny-exclusive drops must be visible');
      assert.equal(await page.locator('.kenny-tiers').count(),0,'No duplicated tier summary');
      const prizes=await page.locator('.kenny-exclusives').evaluate(el=>{
        const parent=el.getBoundingClientRect();
        const rows=[...el.children].map(c=>c.getBoundingClientRect());
        const loot=el.closest('.kenny-loot').getBoundingClientRect();
        return {viewport:innerHeight,bottom:Math.max(...rows.map(c=>c.bottom)),
         prizeBottom:parent.bottom,lootBottom:loot.bottom,
         maxWidth:Math.max(...rows.map(c=>c.right)),parentRight:parent.right,
         scroll:el.scrollHeight,client:el.clientHeight};
      });
      const lootTypography=await page.evaluate(()=>({
       text:Number.parseFloat(getComputedStyle(document.querySelector('.kenny-exclusives strong')).fontSize),
       icon:Number.parseFloat(getComputedStyle(document.querySelector('.kenny-exclusives span')).fontSize),
       level:Number.parseFloat(getComputedStyle(document.querySelector('.kenny-level-reward')).fontSize)
      }));
      assert(lootTypography.text>=10&&lootTypography.icon>=17&&lootTypography.level>=11,
       'Kenny exclusive text, icons and level-five note must remain readable: '+JSON.stringify(lootTypography));
      assert(prizes.bottom<=prizes.prizeBottom+3&&prizes.maxWidth<=prizes.parentRight+3&&
        prizes.scroll<=prizes.client+3&&prizes.lootBottom<=prizes.viewport-(width<=700?68:0)+3,
        'All Kenny-exclusive items must fit without scrolling: '+JSON.stringify(prizes));
     }
     const topActions=await page.locator('.companion-kenny-back button').evaluateAll(buttons=>buttons.map(b=>({
       width:b.getBoundingClientRect().width,
       height:b.getBoundingClientRect().height,
       visible:getComputedStyle(b).visibility,
       whiteSpace:getComputedStyle(b).whiteSpace,
       scrollWidth:b.scrollWidth,clientWidth:b.clientWidth,
       text:b.innerText.trim(),containerWidth:b.parentElement.getBoundingClientRect().width
     })));
     assert(topActions.length===2&&Math.abs(topActions[0].width-topActions[1].width)<=1&&
       topActions.every(action=>action.width>100&&action.height>=38&&action.visible==='visible'),
       'My Companions and Enter Kennyverse must share equal-width, visible buttons: '+JSON.stringify(topActions));
     assert(topActions[1].text===(topActions[1].containerWidth<=410?'Kennyverse ↗':'Kennyverse betreten ↗') &&
       topActions.every(a=>a.whiteSpace==='nowrap'&&a.scrollWidth<=a.clientWidth+1),
       'Kennyverse action must not wrap or overflow at any viewport: '+JSON.stringify(topActions));
     const actionsToLoot=await page.evaluate((isPhone)=>{
       const actions=document.querySelector('.companion-kenny-back')?.getBoundingClientRect();
       const content=document.querySelector(isPhone?'.kenny-play':'.kenny-loot')?.getBoundingClientRect();
       return {actions:{width:actions?.width,right:actions?.right},
         loot:{width:content?.width,right:content?.right}};
     }, width <= 700);
     assert(Math.abs(actionsToLoot.actions.width-actionsToLoot.loot.width)<=3&&
       Math.abs(actionsToLoot.actions.right-actionsToLoot.loot.right)<=3,
       'The two buttons together must match the exact width of possible prizes at '+width+': '+JSON.stringify(actionsToLoot));
     if (width > 700) {
      assert((await page.locator('.kenny-level-reward').innerText()).includes('schließt sich Kenny deinen Begleitern an'),
        'The level-five companion text must use the correct plural wording');
     }
     await page.locator('.kenny-action-row .kenny-style-btn').click();
     await page.locator('.dino-designer-grid').waitFor({state:'visible'});
     assert.equal(await page.locator('.shop-view-tabs button').count(),3);
     assert.equal(await page.locator('.shop-view-tabs button').filter({hasText:'Designe deinen Dino'}).getAttribute('aria-selected'),'true');
     const designerNav=page.locator('.dino-designer-heading-actions button');
     assert.equal(await designerNav.count(),2,'The designer needs shortcuts to feeding and companions');
     assert((await designerNav.first().innerText()).includes('Den aktuellen Season-Dino füttern')&&
       (await designerNav.last().innerText()).includes('Meine Begleiter'),
       'Designer navigation labels must be clear');
     const designerActionLayout=await designerNav.evaluateAll(buttons=>buttons.map(b=>({
       width:b.getBoundingClientRect().width,
       top:b.getBoundingClientRect().top,
       right:b.getBoundingClientRect().right
     })));
     assert(designerActionLayout.every(b=>b.width>70&&b.right<=width+2)&&
       Math.abs(designerActionLayout[0].top-designerActionLayout[1].top)<3,
       'Designer navigation must stay aligned and inside the viewport: '+JSON.stringify(designerActionLayout));
     const colors=await page.locator('.dino-designer-skin-grid .kenny-skin-preview').evaluateAll(nodes=>nodes.map(node=>({
      skin:node.dataset.skin,
      imageSrc:node.querySelector('img').getAttribute('src'),
      imageFilter:getComputedStyle(node.querySelector('img')).filter,
      imageLoaded:node.querySelector('img').naturalWidth>0,
      imageOpacity:Number(getComputedStyle(node.querySelector('img')).opacity),
      stripe:getComputedStyle(node,'::after').webkitMaskImage
     })));
     assert.equal(colors.length,5,'Every Dino Designer skin needs its own preview');
     assert(colors.every(c=>c.imageLoaded&&c.imageSrc?.endsWith('kenny_'+c.skin+'_avatar.png')),
      'Each skin must load its own dedicated real portrait PNG: '+JSON.stringify(colors));
     assert.equal(new Set(colors.map(c=>c.imageSrc)).size,5,'All five previews need distinct assets');
     assert(colors.every(c=>c.imageFilter==='none'&&c.stripe==='none'),
      'Kenny must not use CSS color filters or zebra overlays: '+JSON.stringify(colors));
     assert(colors.every(c=>c.imageOpacity>.9),
      'Locked colors should remain fully visible, even if unavailable to equip');
     const designer=await page.evaluate(()=>{
      const rect=selector=>document.querySelector(selector).getBoundingClientRect();
      const cards=[...document.querySelectorAll('.dino-designer-card')].map(el=>el.getBoundingClientRect());
      const skins=[...document.querySelectorAll('.dino-designer-skin-grid button')].map(el=>el.getBoundingClientRect());
      return {viewport:innerHeight,scroll:document.documentElement.scrollHeight,
       stageHeight:rect('.dino-designer-live').height,
       cardBottom:Math.max(...cards.map(x=>x.bottom)),skinBottom:Math.max(...skins.map(x=>x.bottom)),
       cardCount:cards.length,skinCount:skins.length};
     });
     assert(designer.scroll<=designer.viewport+3&&designer.cardCount===3&&designer.skinCount===5&&
       designer.cardBottom<=designer.viewport-(width<=700?68:0)+3&&
       designer.skinBottom<=designer.viewport-(width<=700?68:0)+3&&designer.stageHeight>65,
       'The complete Dino Designer including five skin buttons must fit at '+width+': '+JSON.stringify(designer));
     if(width===390)await page.screenshot({path:path.join(screenshots,'dino-designer-390.png'),fullPage:true});
     await designerNav.first().click();
     await page.locator('.kenny-feed-btn').waitFor({state:'visible'});
     assert(await page.locator('.kenny-page').isVisible(),
       'Feeding shortcut must open the existing current-season Dino-Verse, not trigger feeding');
    }
    if(label==='Item-Shop'){
     assert.equal(await page.locator('.shop-banner.drop-hero').count(),0,
      'Remove the wallet banner from the Shop');
     assert.equal(await page.locator('.shop-view-tabs button').count(),3,
      'Shop, Inventar and Designe deinen Dino require three header tabs');
     shopFilterTop=await page.locator('.shop-filter-start').first().evaluate(el=>el.getBoundingClientRect().top);
     const select=page.locator('#shop-drop-select');
     assert(await select.isVisible(),'Drop selector should be beside Alle Items at '+width+'px');
     assert.equal(await page.locator('.shop-drop-card').count(),0,'No old chunky drop cards');
     assert((await page.locator('.item-name-type').count())>0,
      'Product names should visibly include the cosmetic kind');
     await select.selectOption('global');
     assert.equal(await select.inputValue(),'global',
      'Dropdown must select Studyverse Essentials');
     assert((await select.locator('option:checked').innerText()).includes('STUDYVERSE'),
      'Dropdown must show the selected collection');
     const layout=await page.evaluate(()=>{
      const head=document.querySelector('.shop-items-heading-main h2').getBoundingClientRect();
      const select=document.querySelector('#shop-drop-select').getBoundingClientRect();
      return {headingBottom:head.bottom,selectTop:select.top,selectLeft:select.left,headRight:head.right};
     });
     assert(layout.selectLeft>=layout.headRight-4||Math.abs(layout.selectTop-layout.headingBottom)<48,
      'Drop selector should be in same header row on mobile '+width+'px: '+JSON.stringify(layout));
     if (width <= 700) {
      const categoryFilter = page.getByRole('combobox', { name: 'Shop-Artikel nach Kategorie filtern' });
      const collection = await select.boundingBox();
      const category = await categoryFilter.boundingBox();
      assert(category.y >= collection.y + collection.height);
      assert(Math.abs(category.x - collection.x) <= 2 && Math.abs(category.width - collection.width) <= 2);
      await categoryFilter.selectOption('frame');
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('.drop-item-grid > .drop-item')];
        return cards.length > 0 && cards.every((card) => card.dataset.category === 'frame');
      });
      assert.equal(await categoryFilter.inputValue(), 'frame');
      await categoryFilter.selectOption('Alle');
      await page.waitForFunction(() => document.querySelector('.drop-item-grid > [data-category]:not([data-category="frame"])'));
      const itemColumns = await page.locator('.drop-item-grid').evaluate((grid) =>
        getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      );
      assert.equal(itemColumns, 3);
     }
     if(width===390){
      const bannerArt = page.locator('.drop-item[data-category="banner"] app-cosmetic-banner img').first();
      await bannerArt.scrollIntoViewIfNeeded();
      assert(await bannerArt.evaluate(async (image) => {
        await image.decode();
        return image.src.includes('/cosmetics/banners/') &&
          image.naturalWidth > image.naturalHeight;
      }), 'Shop banners use images of the dashboard scenery');
      const dotsCard=page.locator('.drop-item').filter({hasText:'Dots & Lines'}).first();
      try{await dotsCard.locator('.drop-preview-btn').click({timeout:5000})}catch(error){
       const geometry=await page.evaluate(()=>{
        const target=[...document.querySelectorAll('.drop-item')].find(el=>el.textContent.includes('Dots & Lines'));
        const button=target.querySelector('.drop-preview-btn');
        const rect=button.getBoundingClientRect();
        const hit=document.elementsFromPoint(rect.left+rect.width/2,rect.top+rect.height/2).slice(0,5);
        return {button:rect.toJSON(),card:target.getBoundingClientRect().toJSON(),grid:document.querySelector('.item-grid').getBoundingClientRect().toJSON(),hits:hit.map(el=>({class:el.className,card:el.closest('.drop-item')?.textContent.slice(0,70)}))};
       });
       console.error('Dots & Lines preview geometry',JSON.stringify(geometry));
       await page.screenshot({path:path.join(screenshots,'shop-preview-obstruction-390.png')});
       throw error;
      }
      const preview = page.locator('.shop-preview-modal .preview-after .shop-live-stage[data-atm="dots"]');
      await preview.waitFor();
      const dotsVisual=await preview.evaluate(el=>{
       const rule=getComputedStyle(el,'::after');
       return {content:rule.content,bg:rule.backgroundImage,z:Number(rule.zIndex),opacity:Number(rule.opacity)};
      });
      assert(dotsVisual.content!=='none'&&dotsVisual.bg.includes('radial-gradient')&&dotsVisual.bg.includes('linear-gradient')&&dotsVisual.z>=6&&dotsVisual.opacity>=.65,
       'Dots & Lines must be visibly rendered ABOVE the shop preview cards: '+JSON.stringify(dotsVisual));
      await page.screenshot({path:path.join(screenshots,'studyverse-dots-preview-390.png')});
      await page.locator('.shop-preview-modal .btn.secondary.full').click();
     }
     // A new account has no learning unlocks. The test selector may only
     // include a test once a milestone actually makes an item purchaseable.
     const options=await select.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
     assert(options.includes('global'),'Essentials must always be selectable');
     assert(!options.includes('nawi-test-01'),
      'New user without Chemverse progress must not see locked Chemverse drop');
     await check(page,'Studyverse Shop-Drop-Selector '+width);
     if(width===390)await page.screenshot({path:path.join(screenshots,'studyverse-item-shop-390.png'),fullPage:true});
     await page.locator('.navigation button[aria-label="Dino-Verse"]').click();
     await page.locator('.kenny-page .kenny-stage').waitFor({state:'visible'});
     const dinoLayout=await page.evaluate(()=>({
      viewport:innerHeight,scroll:document.documentElement.scrollHeight,
      stage:document.querySelector('.kenny-stage').getBoundingClientRect().height,
      feedBottom:document.querySelector('.kenny-feed-btn').getBoundingClientRect().bottom,
      countdownBottom:document.querySelector('.kenny-season-foot').getBoundingClientRect().bottom
     }));
     assert(dinoLayout.scroll<=dinoLayout.viewport+3&&dinoLayout.stage>100&&
      dinoLayout.feedBottom<=dinoLayout.viewport&&dinoLayout.countdownBottom<=dinoLayout.viewport,
      'Kenny must fit on-screen without vertical page scrolling at '+width+'px: '+JSON.stringify(dinoLayout));
     assert(await page.locator('.kenny-sprite').evaluate(el=>el.getBoundingClientRect().width>90),
      'Kenny sprite must have a visible, nonzero width at '+width+'px');
     if(width===390)await page.screenshot({path:path.join(screenshots,'kenny-390.png')});
     await page.locator('.navigation button[aria-label="Item-Shop"]').click();
    }
    if(width===390&&label==='Achievements')
     await page.screenshot({path:path.join(screenshots,'studyverse-'+label.toLowerCase()+'-390.png'),fullPage:true});
   }
   await page.locator('.top-friends-link').click();
   await page.locator('.friends-page').waitFor({timeout:4000});
   await check(page,'Studyverse Freunde '+width);
   if(width===390)await page.screenshot({path:path.join(screenshots,'studyverse-freunde-390.png'),fullPage:true});
   await page.locator('.top-profile-link').click();
   await page.locator('.profile-grid').waitFor({timeout:4000});
   await check(page,'Studyverse Profil '+width);
   if(width===390)await page.screenshot({path:path.join(screenshots,'studyverse-profil-390.png'),fullPage:true});
   const navLabels=await page.locator('.navigation button .mobile-nav-label:visible').count();
   if(width<=430){
    assert.equal(navLabels,6,'Phone navigation must include separate Dino-Verse and Begleiter destinations');
    const visibleNavButtons=await page.locator('.navigation button:visible').count();
    assert.equal(visibleNavButtons,6,'Inventory stays in Shop while Dino-Verse and Begleiter have distinct tabs');
   }
   assert(!errors.length,'Studyverse script errors at '+width+': '+errors.join('; '));
   await context.close();
  }
  // Compare actual saved equipment with one cosmetic, including readable text thumbnails.
  const comparisonIds = [
    ...fs.readFileSync('src/app/shop-items.ts', 'utf8').matchAll(/\{id:'([^']+)'/g),
    ...fs.readFileSync('src/app/dino-season.ts', 'utf8').matchAll(/\{id:'([^']+)'/g),
  ].map((match) => match[1]);
  for (const width of [320, 390, 650, 768, 1365]) {
    const comparisonContext = await browser.newContext({ viewport: { width, height: 800 } });
    await comparisonContext.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    const comparisonPage = await comparisonContext.newPage();
    await comparisonPage.addInitScript((inventory) => {
      localStorage.setItem('studyverse_import_prompt_seen_v1', '1');
      localStorage.setItem('studyverse_profile_v1', JSON.stringify({
        xp: 0, tokens: 5000, nickname: 'PreviewTester', inventory,
        equipped: {
          title: 'kenny_pangea_title', font: 'velvet_voltage', avatar: 'kenny_avatar_pink',
          theme: 'sakura', banner: 'pink_paradise', frame: 'neural', atm: 'dots', fx: 'pulse_rings',
        },
        claimedLevels: {}, activity: [], shopDropMigrationV1: true, rewardSeen: {}, rewardQueue: [],
      }));
    }, comparisonIds);
    await comparisonPage.goto(base, { waitUntil: 'load' });
    await comparisonPage.evaluate(() => document.fonts.ready);
    assert((await comparisonPage.locator('.universe').first().evaluate((universe) =>
      getComputedStyle(universe).fontFamily)).includes('Unbounded'),
    'The equipped Velvet Voltage font must override the default interface font');

    const notice = comparisonPage.locator('.notice button');
    if (await notice.isVisible()) await notice.click();
    await comparisonPage.locator('.navigation button[aria-label="Item-Shop"]').click();
    await comparisonPage.locator('.shop-view-tabs button').filter({ hasText: 'Inventar' }).click();
    await comparisonPage.locator('.inventory-item').first().waitFor();
    const baseline = await comparisonPage.evaluate(() =>
      JSON.parse(localStorage.getItem('studyverse_profile_v1')));
    const category = comparisonPage.locator('.inventory-filter-bar select').nth(1);
    async function assertReadableText(text) {
      const element = await text.elementHandle();
      await comparisonPage.waitForFunction((element) => {
        const parent = element.parentElement;
        const box = parent.getBoundingClientRect();
        const style = getComputedStyle(parent);
        const range = document.createRange();
        range.selectNodeContents(element);
        const lines = Array.from(range.getClientRects());
        return lines.length > 0 && lines.every((line) =>
          line.top >= box.top + parseFloat(style.paddingTop) - 1 &&
          line.bottom <= box.bottom - parseFloat(style.paddingBottom) + 1 &&
          line.left >= box.left + parseFloat(style.paddingLeft) - 1 &&
          line.right <= box.right - parseFloat(style.paddingRight) + 1);
      }, element);
    }
    for (const group of ['title', 'font']) {
      await category.selectOption(group);
      const equippedCard = comparisonPage.locator('.inventory-item.equipped[data-category="' + group + '"]');
      await equippedCard.scrollIntoViewIfNeeded();
      assert.equal((await equippedCard.locator('.cosmetic-text').innerText()), 'Hat Pangea überlebt');
      assert.equal(await equippedCard.locator('.item-art app-cosmetic-icon').count(), 0);
      const text = equippedCard.locator('.cosmetic-text');
      await assertReadableText(text);
      for (const content of [
        'Hat Pangea überlebt und die gesamte Urzeit erforscht '.repeat(4),
        'Pangea'.repeat(35),
      ]) {
        await text.evaluate((element, content) => { element.textContent = content; }, content);
        await assertReadableText(text);
        assert(await text.evaluate((element) => parseFloat(getComputedStyle(element).fontSize) < 21),
          'Long text must shrink to fit the thumbnail');
      }
      await text.evaluate((element) => { element.textContent = 'Hat Pangea überlebt'; });
      await assertReadableText(text);

      const badgeFits = await equippedCard.locator('.equipped-status').evaluate((badge) => {
        const box = badge.getBoundingClientRect();
        const detail = badge.closest('.inventory-item-detail').getBoundingClientRect();
        return box.top >= detail.top && box.bottom <= detail.bottom && box.width > 0;
      });
      assert(badgeFits, group + ' equipped status must be fully visible at ' + width);
      assert((await equippedCard.locator('.cosmetic-text').evaluate((text) =>
        getComputedStyle(text).fontFamily)).includes('Unbounded'));
      if (width === 390) {
        await comparisonPage.screenshot({ path: path.join(screenshots, 'inventory-' + group + '-text-390.png') });
      }
    }
    if (width === 390 || width === 1365) {
      const inspector = await comparisonContext.newCDPSession(comparisonPage);
      await inspector.send('DOM.enable');
      await inspector.send('CSS.enable');
      for (const [name, isVelvet] of [['Compact UI', false], ['Velvet Voltage', true]]) {
        await comparisonPage.locator('.inventory-item').filter({ hasText: name })
          .locator('.drop-preview-btn').click();
        const sample = comparisonPage.locator('.preview-after .cosmetic-text');
        await sample.waitFor();
        await comparisonPage.evaluate(() => document.fonts.ready);
        const family = await sample.evaluate((text) => getComputedStyle(text).fontFamily);
        assert(family.includes(isVelvet ? 'Unbounded' : 'Arial'), name + ' must select its own font family');
        const { root } = await inspector.send('DOM.getDocument');
        const { nodeId } = await inspector.send('DOM.querySelector', {
          nodeId: root.nodeId, selector: '.preview-after .cosmetic-text',
        });
        const { fonts } = await inspector.send('CSS.getPlatformFontsForNode', { nodeId });
        assert(fonts.some((font) => font.glyphCount > 0), 'The sample must render actual text glyphs');
        assert.equal(fonts.some((font) => font.isCustomFont && font.familyName.includes('Unbounded')),
          isVelvet, name + ' must render its intended font with external font requests blocked');
        await assertReadableText(sample);
        if (width === 390) {
          await comparisonPage.screenshot({
            path: path.join(screenshots, isVelvet ? 'font-velvet-native-390.png' : 'font-compact-native-390.png'),
          });
        }
        await comparisonPage.getByRole('button', { name: 'Vorschau schließen' }).click();
      }
      await inspector.detach();
    }
    for (const group of ['theme', 'atm', 'frame', 'font', 'banner', 'fx', 'avatar', 'title']) {
      await category.selectOption(group);
      const card = comparisonPage.locator('.inventory-item:not(.equipped)[data-category="' + group + '"]').first();
      const candidateName = await card.locator('.item-name').innerText();
      const candidateText = await card.locator('.cosmetic-text').allTextContents();
      await card.locator('.drop-preview-btn').click();
      const slider = comparisonPage.getByRole('slider', { name: 'Vorher / Nachher' });
      if (group === 'fx' || group === 'atm') {
        const stage = comparisonPage.locator('.preview-after .shop-live-stage[data-preview-group="' + group + '"]');
        await stage.waitFor();
        assert.equal(await slider.count(), 0, 'Effects and backgrounds have no comparison slider');
        assert.equal(await comparisonPage.locator('.preview-before').count(), 0);
        assert.equal(await comparisonPage.locator('.preview-divider').count(), 0);
        assert.equal(await stage.locator('.cosmetic-text').count(), 0);
        await comparisonPage.getByRole('button', { name: 'Vorschau schließen' }).click();
        const saved = await comparisonPage.evaluate(() =>
          JSON.parse(localStorage.getItem('studyverse_profile_v1')));
        assert.deepEqual(saved.equipped, baseline.equipped);
        assert.equal(saved.tokens, baseline.tokens);
        continue;
      }
      await slider.waitFor();
      assert.equal(await slider.inputValue(), '100', 'Each preview starts at After');
      const before = comparisonPage.locator('.preview-before');
      const after = comparisonPage.locator('.preview-after');
      if (group === 'title') {
        assert.equal(await before.locator('.cosmetic-text').innerText(), 'Hat Pangea überlebt');
        assert.equal(await after.locator('.cosmetic-text').innerText(), candidateText[0]);
      } else if (group !== 'avatar') {
        const beforeEquipment = await before.locator('.shop-live-stage').evaluate((stage) => {
          return Object.fromEntries(['theme', 'atm', 'frame', 'font', 'banner', 'fx']
            .map((slot) => [slot, stage.dataset[slot]]));
        });
        const afterEquipment = await after.locator('.shop-live-stage').evaluate((stage) => {
          return Object.fromEntries(['theme', 'atm', 'frame', 'font', 'banner', 'fx']
            .map((slot) => [slot, stage.dataset[slot]]));
        });
        for (const slot of Object.keys(beforeEquipment)) {
          assert.equal(beforeEquipment[slot], baseline.equipped[slot], 'Before must show saved ' + slot);
          if (slot !== group) {
            assert.equal(afterEquipment[slot], beforeEquipment[slot], 'Preview must preserve other slots');
          }
        }
        assert.notEqual(afterEquipment[group], beforeEquipment[group], candidateName + ' must change its slot');
        if (group === 'font') {
          assert.equal(await after.locator('.cosmetic-text').innerText(), 'Hat Pangea überlebt');
          assert.notEqual(
            await before.locator('.cosmetic-text').evaluate((text) => getComputedStyle(text).fontFamily),
            await after.locator('.cosmetic-text').evaluate((text) => getComputedStyle(text).fontFamily),
          );
        }
      }
      for (const text of await after.locator('.cosmetic-text').all()) {
        await assertReadableText(text);
      }
      await slider.focus();
      await slider.press('Home');
      assert.equal(await slider.inputValue(), '0');
      await comparisonPage.waitForFunction(() =>
        document.querySelector('.preview-after').getAttribute('aria-hidden') === 'true');
      await slider.press('End');
      assert.equal(await slider.inputValue(), '100');
      await comparisonPage.waitForFunction(() =>
        document.querySelector('.preview-before').getAttribute('aria-hidden') === 'true');
      await slider.evaluate((input) => {
        input.stepDown(50);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await comparisonPage.waitForFunction(() =>
        getComputedStyle(document.querySelector('.preview-after')).clipPath === 'inset(0px 50% 0px 0px)');
      const geometry = await comparisonPage.locator('.shop-preview-modal').evaluate((modal) => ({
        height: modal.clientHeight, content: modal.scrollHeight, bottom: modal.getBoundingClientRect().bottom,
      }));
      assert(geometry.content <= geometry.height + 2 && geometry.bottom <= 801,
        group + ' comparison and controls must fit at ' + width + ': ' + JSON.stringify(geometry));
      if (width === 390 && ['font', 'title'].includes(group)) {
        await comparisonPage.screenshot({ path: path.join(screenshots, 'compare-' + group + '-390.png') });
      }
      await comparisonPage.getByRole('button', { name: 'Vorschau schließen' }).click();
      const saved = await comparisonPage.evaluate(() =>
        JSON.parse(localStorage.getItem('studyverse_profile_v1')));
      assert.deepEqual(saved.equipped, baseline.equipped);
      assert.deepEqual(saved.inventory, baseline.inventory);
      assert.equal(saved.tokens, baseline.tokens);
    }
    await check(comparisonPage, 'Velvet Voltage inventory ' + width);
    await comparisonContext.close();
  }
  console.log('PASS: complete titles fit every thumbnail and preview; effects and backgrounds show only the selected cosmetic.');

  const bannerContext = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const bannerPage = await bannerContext.newPage();
  await bannerPage.addInitScript((itemIds) => {
    localStorage.setItem('studyverse_import_prompt_seen_v1', '1');
    localStorage.setItem('studyverse_profile_v1', JSON.stringify({
      xp: 0,
      tokens: 10000,
      nickname: 'BannerTester',
      inventory: ['chem_link'],
      equipped: { banner: 'molecule' },
      claimedLevels: {},
      activity: [],
      shopDropMigrationV1: true,
      rewardSeen: Object.fromEntries(itemIds.map((id) => [id, true])),
      rewardQueue: [],
      trainerSaves: {
        'pos-pa-01': {
          courseDone: { first: true, second: true },
          solved: Object.fromEntries(Array.from({ length: 10 }, (_, index) => ['d' + index, true])),
        },
      },
    }));
  }, [...fs.readFileSync('src/app/shop-items.ts', 'utf8').matchAll(/\{id:'([^']+)'/g)]
    .map((match) => match[1]));
  await bannerPage.goto(base, { waitUntil: 'load' });
  const bannerNotice = bannerPage.locator('.notice button');
  if (await bannerNotice.isVisible()) await bannerNotice.click();
  await bannerPage.locator('.navigation button[aria-label="Item-Shop"]').click();
  const specialBanners = [
    { name: 'Pink Paradise', key: 'pink_paradise', scene: 'pink', color: 'rgb(105, 48, 95)', drop: 'global' },
    { name: 'Solitaire Cascade', key: 'solitaire', scene: 'solitaire', color: 'rgb(16, 46, 50)', drop: 'pos-pa-01' },
    { name: 'Parallel Pulse', key: 'parallel_pulse', scene: 'parallel', color: 'rgb(23, 32, 67)', drop: 'pos-pa-01' },
  ];
  async function openBannerPreview(card, { name, key, scene, color }) {
    const thumbnail = card.locator('app-cosmetic-banner img');
    await thumbnail.scrollIntoViewIfNeeded();
    assert(await thumbnail.evaluate(async (image, key) => {
      await image.decode();
      return image.naturalWidth > 0 && image.src.endsWith('/' + key + '.webp');
    }, key), name + ' must use its own thumbnail');
    await card.locator('.drop-preview-btn').click();
    const stage = bannerPage.locator('.preview-after .shop-live-stage[data-banner="' + key + '"]');
    await stage.locator('.scene-' + scene).waitFor({ state: 'visible' });
    assert.equal(await stage.locator('.banner-scene:visible').count(), 1);
    assert((await stage.locator('.shop-live-hero').evaluate((hero) =>
      getComputedStyle(hero).backgroundImage)).includes(color),
    name + ' must show its own background instead of the equipped one');
  }
  for (const banner of specialBanners) {
    await bannerPage.locator('#shop-drop-select').selectOption(banner.drop);
    const card = bannerPage.locator('.drop-item[data-category="banner"]').filter({ hasText: banner.name });
    await openBannerPreview(card, banner);
    await bannerPage.locator('.shop-preview-modal .btn.primary').click();
    await bannerNotice.click();
  }
  await bannerPage.locator('.shop-view-tabs button').filter({ hasText: 'Inventar' }).click();
  for (const banner of specialBanners) {
    const card = bannerPage.locator('.inventory-item[data-category="banner"]').filter({ hasText: banner.name });
    await openBannerPreview(card, banner);
    await bannerPage.getByRole('button', { name: 'Vorschau schließen' }).click();
  }
  await bannerContext.close();
  console.log('PASS: Pink Paradise, Solitaire Cascade, and Parallel Pulse show their Shop and Inventory previews.');

  const refundContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const refundPage=await refundContext.newPage();
  await refundPage.addInitScript(()=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   const purchased={sharp_sheep:true,sharp_theme:true,sharp_scissors:true};
   const trainer={xp:0,coins:500,purchased,earned:{},solved:{},learned:{}};
   localStorage.setItem('sharpverse_pa01_v1',JSON.stringify(trainer));
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:500,nickname:'RefundTester',
    inventory:['sharp_sheep','sharp_theme','sharp_scissors','dsai_bot'],
    equipped:{theme:'sharp_theme',atm:'none',frame:'none',avatar:'🐑',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[],
    kennyWonItems:{sharp_sheep:true,sharp_theme:true},trainerSaves:{'pos-pa-01':trainer}}));
  });
  await refundPage.goto(base,{waitUntil:'load'});
  const refund=await refundPage.evaluate(()=>({profile:JSON.parse(localStorage.getItem('studyverse_profile_v1')),
   trainer:JSON.parse(localStorage.getItem('sharpverse_pa01_v1'))}));
  assert.equal(refund.profile.tokens,1100,'Two Kenny Sharpverse drops must refund 300 TT each');
  assert(!refund.profile.inventory.includes('sharp_sheep')&&!refund.profile.inventory.includes('sharp_theme'));
  assert(refund.profile.inventory.includes('sharp_scissors')&&refund.profile.inventory.includes('dsai_bot'),
   'Legitimately owned and other-Verse cosmetics must survive the refund');
  assert.equal(refund.profile.equipped.avatar,'🧪');
  assert.equal(refund.profile.equipped.theme,'base');
  assert(!refund.trainer.purchased.sharp_sheep&&!refund.trainer.purchased.sharp_theme,
   'Old trainer saves must not restore revoked Kenny drops');
  await refundPage.reload({waitUntil:'load'});
  assert.equal((await refundPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')))).tokens,1100,
   'The migration must not refund the same items twice');
  await refundContext.close();
  console.log('PASS: Kenny Sharpverse refunds are selective and idempotent.');
  // Feeding spends one shared wallet, awards a reveal for each draw and reaches
  // level 2 after precisely three feeds without granting study XP.
  const dinoContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const dinoPage=await dinoContext.newPage();
  await dinoPage.addInitScript(()=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:10000,nickname:'DinoTester',
    inventory:[],equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[]}));
  });
  await dinoPage.goto(base,{waitUntil:'load'});
  await dinoPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await dinoPage.locator('.companion-actions button').filter({hasText:'Kenny füttern'}).click();
  for(let n=1;n<=3;n++){
   await dinoPage.locator('.kenny-feed-btn').click();
   await dinoPage.locator('.kenny-stage.kenny-feeding').waitFor();
   assert.equal(await dinoPage.locator('.kenny-reveal-modal').count(),0,
    'Reward must wait while Kenny walks to his meal');
   if(n===1){
    await dinoPage.waitForTimeout(1100);
    assert.equal(await dinoPage.locator('.kenny-reveal-modal').count(),0,
     'Feeding animation must remain visible for more than a brief flash');
    const delivery=await dinoPage.evaluate(()=>{
     const stage=document.querySelector('.kenny-stage').getBoundingClientRect();
     const drone=document.querySelector('.kenny-drone');
     const meat=document.querySelector('.kenny-meat');
     return {stageRight:stage.right,droneLeft:drone.getBoundingClientRect().left,
      droneOpacity:Number(getComputedStyle(drone).opacity),meatOpacity:Number(getComputedStyle(meat).opacity)};
    });
    assert(delivery.droneLeft<delivery.stageRight&&delivery.droneOpacity>.3&&delivery.meatOpacity>.3,
     'The drone must fly into the stage and release the meat before Kenny eats: '+JSON.stringify(delivery));
    await dinoPage.screenshot({path:path.join(screenshots,'kenny-feeding-390.png')});
    await dinoPage.waitForTimeout(900);
    await dinoPage.screenshot({path:path.join(screenshots,'kenny-eating-390.png')});
   }
   await dinoPage.locator('.kenny-reveal-modal').waitFor();
   if(n===1)await dinoPage.screenshot({path:path.join(screenshots,'kenny-drop-390.png')});
   let sawLevel=false;
   for(let revealCount=0;revealCount<4&&await dinoPage.locator('.kenny-reveal-modal').count();revealCount++){
    const title=await dinoPage.locator('#kenny-reveal-title').textContent();
    if(title.includes('Level 2')){
     sawLevel=true;
     const revealLayout=await dinoPage.evaluate(()=>({
      art:document.querySelector('.kenny-reveal-art').getBoundingClientRect().bottom,
      title:document.querySelector('#kenny-reveal-title').getBoundingClientRect().top,
      sprite:document.querySelector('.kenny-mini-sprite').getBoundingClientRect().width
     }));
     assert(revealLayout.art<=revealLayout.title&&revealLayout.sprite>40,
      'Kenny level-up artwork must stay above and separate from the text: '+JSON.stringify(revealLayout));
     await dinoPage.screenshot({path:path.join(screenshots,'kenny-level-390.png')});
    }
    // The primary action now means "equip" or "show designer"; the always-present
    // secondary action explicitly acknowledges any drop and advances the queue.
    await dinoPage.locator('.kenny-reveal-actions .btn.secondary').click();
    await dinoPage.waitForFunction(previous=>{
     const current=document.querySelector('#kenny-reveal-title');
     return !current||current.textContent!==previous;
    },title);
   }
   if(n===3)assert(sawLevel,'Third feed must reveal Kenny level 2');
   await dinoPage.locator('.kenny-reveal-modal').waitFor({state:'hidden'});
  }
  const dinoProfile=await dinoPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(dinoProfile.dinoSeasons['kenny-2026'].feeds,3);
  assert.equal(dinoProfile.xp,0,'Feeding must never grant learning XP');
  assert(dinoProfile.tokens>=9100,'300 TT per feed, net of random Token rewards');
  await dinoPage.locator('.kenny-action-row .kenny-style-btn').click();
  await dinoPage.locator('.dino-designer-grid').waitFor({state:'visible'});
  assert.equal(await dinoPage.locator('.dino-designer-card').count(),3,
   'The dedicated Dino Designer must reserve three dinosaur slots');
  assert.equal(await dinoPage.locator('.dino-designer-locked').count(),2,
   'Two upcoming dinos must remain locked and silhouetted');
  const unlockedSkins=dinoProfile.inventory.filter(id=>id.startsWith('kenny_skin_')&&id!=='kenny_skin_blue').length;
  assert.equal(await dinoPage.locator('.dino-designer-skin-grid button:disabled').count(),4-unlockedSkins,
   'Only owned skins may be selected, including the rare zebra skin');
  await dinoPage.locator('.dino-designer-heading-actions button').filter({hasText:'Meine Begleiter'}).click();
  await dinoContext.close();
  console.log('PASS: Kenny viewport, three feeds, reward reveals, XP isolation and locked skins.');
  // The blue avatar is granted at the 25th feed, independently of the random drop.
  const allIds=[...fs.readFileSync('src/app/shop-items.ts','utf8').matchAll(/\{id:'([^']+)'/g),
   ...fs.readFileSync('src/app/dino-season.ts','utf8').matchAll(/\{id:'([^']+)'/g)]
   .map(match=>match[1]).concat('kenny_skin_zebra').filter(id=>id!=='kenny_avatar');

  // A nearly complete Kenny collection should see the ENTIRE prize dialog
  // on one screen, not a tiny scroll box below redundant help text.
  for(const width of [390,1365]){
   const poolContext=await browser.newContext({viewport:{width,height:800},deviceScaleFactor:1});
   const poolPage=await poolContext.newPage();
   await poolPage.addInitScript(owned=>{
    const collected = sessionStorage.getItem('studyverse_test_zebra_owned') === '1'
      ? [...owned, 'kenny_skin_zebra'] : owned;
    const inventory = collected.filter(id => sessionStorage.getItem('studyverse_test_missing_green') !== '1' ||
      id !== 'kenny_skin_green');
    localStorage.setItem('studyverse_import_prompt_seen_v1','1');
    localStorage.setItem('studyverse_profile_v1',JSON.stringify({
     xp:0,tokens:900,nickname:'PrizePreview',
     inventory,equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
     claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[],
     dinoSeasons:{'kenny-2026':{feeds:25,skin:'blue',overfeeds:0,overTokenWins:0,settled:false,settlement:0}}
    }));
   },allIds.filter(id=>id!=='kenny_skin_zebra'));
   await poolPage.goto(base,{waitUntil:'load'});
   await poolPage.locator('.navigation button[aria-label="Dino-Verse"]').click();
   await poolPage.locator('.kenny-page').waitFor({state:'visible'});
   await poolPage.waitForFunction(()=>document.querySelector('.universe')?.classList.contains('kenny-mode'));
   assert.equal(await poolPage.locator('.kenny-test-unlock').count(),0,
    'The temporary free drop is not available without an authenticated cloud account');
   if (width <= 700) {
    const spriteFits = await poolPage.locator('.kenny-play .kenny-sprite').evaluate((sprite) => {
      const bounds = sprite.getBoundingClientRect();
      const stage = sprite.parentElement.getBoundingClientRect();
      return bounds.top >= stage.top && bounds.bottom <= stage.bottom &&
        bounds.left >= stage.left && bounds.right <= stage.right;
    });
    assert(spriteFits, 'Kenny’s max-level sprite must fit completely in the mobile feeding stage');
   }
   const prizeSelector = width <= 700 ? '.kenny-mobile-prizes' : '.kenny-pool-button';
   const poolButtonFit=await poolPage.evaluate((selector)=>{
    const rect=selector=>{const box=document.querySelector(selector)?.getBoundingClientRect();return box?{top:box.top,bottom:box.bottom,height:box.height}:null};
    return {button:rect(selector),
      navigation:rect('.sidebar .navigation'),navButton:rect('.sidebar .navigation button'),
      page:rect('.kenny-page'),main:rect('main'),workspace:rect('.workspace'),
      ctrl:rect('.kenny-controls'),viewport:innerHeight};
   }, prizeSelector);
   console.log('KENNY POOL BUTTON GEOMETRY '+width+': '+JSON.stringify(poolButtonFit));
   assert(poolButtonFit.button&&
      (width>700 || (poolButtonFit.navigation.height<=80 &&
        poolButtonFit.button.bottom<=poolButtonFit.navigation.top+2)),
    'The collector prize button must stay above the single-row mobile navigation: '+
     JSON.stringify(poolButtonFit));
   await poolPage.locator(prizeSelector).click();
   await poolPage.locator('.kenny-pool-dialog').waitFor({state:'visible'});
   const exclusiveSection=poolPage.locator('.kenny-pool-section').filter({hasText:'Saisonexklusiv'}).first();
   assert.equal(await exclusiveSection.locator('.kenny-pool-items > span').count(), 1,
     'A completed regular collection must leave only the missing Zebra in the prize pool');
   const exclusiveLayout=await exclusiveSection.locator('.kenny-pool-items').evaluate(el=>{
     const bar=el.querySelector('.kenny-pool-zebra-divider');
     const zebra=el.querySelector('.kenny-pool-zebra');
     const children=[...el.children];
     return {bar:bar?.textContent?.trim(),barPosition:children.indexOf(bar),
       zebraPosition:children.indexOf(zebra),totalChildren:children.length,
       heading:el.closest('.kenny-pool-section')?.querySelector(':scope > strong')?.textContent?.trim(),
       zebraLabel:zebra?.textContent?.trim()};
   });
   assert(exclusiveLayout.bar==='Exklusiv ab Level 4 mit 0,5%'&&
     exclusiveLayout.zebraLabel?.includes('Kenny Zebra')&&
     exclusiveLayout.barPosition===exclusiveLayout.totalChildren-2&&
     exclusiveLayout.zebraPosition===exclusiveLayout.totalChildren-1&&
     !exclusiveLayout.heading?.includes('Zebra separat'),
     'Zebra must appear immediately after its own rarity bar, following Kenny Rot: '+JSON.stringify(exclusiveLayout));
   assert.equal(await exclusiveSection.locator('.kenny-pool-complete-regular').count(),1,
     'The five ordinary season exclusives must show their own completed note');
   assert.equal(await exclusiveSection.locator('.kenny-pool-complete-zebra').count(),0,
     'The rare Zebra note must stay absent before Zebra is owned');
   const modal=await poolPage.evaluate(()=>{
    const root=document.querySelector('.kenny-pool-dialog');
    const list=document.querySelector('.kenny-pool-scroll');
    const rect=root.getBoundingClientRect();
    const rows=[...list.children].map(el=>el.getBoundingClientRect());
    const listRect=list.getBoundingClientRect();
    return {viewport:innerHeight,modalTop:rect.top,modalBottom:rect.bottom,
      modalScroll:root.scrollHeight,modalClient:root.clientHeight,
      listScroll:list.scrollHeight,listClient:list.clientHeight,
      sectionCount:rows.length,contentBottom:Math.max(...rows.map(r=>r.bottom)),
      listBottom:listRect.bottom,overflow:document.documentElement.scrollHeight-innerHeight};
   });
   assert(modal.sectionCount===5&&modal.modalTop>=-1&&modal.modalBottom<=modal.viewport+2&&
     modal.modalScroll<=modal.modalClient+3&&modal.listScroll<=modal.listClient+3&&
     modal.contentBottom<=modal.listBottom+3&&modal.overflow<=3,
     'The compact full-prize popup must fit the whole viewport without scrolling at '+width+': '+JSON.stringify(modal));
   assert.equal(await poolPage.locator('.kenny-pool-dialog > p').count(),0,
    'Redundant explanation paragraphs must not use modal height');
   await poolPage.screenshot({path:path.join(screenshots,'kenny-prize-modal-'+width+'.png')});
   // addInitScript reseeds localStorage on every reload. Pass the collected
   // state via sessionStorage so the next document loads Zebra as owned.
   await poolPage.evaluate(()=>sessionStorage.setItem('studyverse_test_zebra_owned','1'));
   await poolPage.reload({waitUntil:'load'});
   await poolPage.locator('.navigation button[aria-label="Dino-Verse"]').click();
   await poolPage.locator(prizeSelector).click();
   await poolPage.locator('.kenny-pool-dialog').waitFor({state:'visible'});
   const completeSection = poolPage.locator('.kenny-pool-section')
     .filter({ hasText: 'Saisonexklusiv' }).first();
   assert.deepEqual(await completeSection.locator('.kenny-pool-complete').allInnerTexts(),
     ['Alles aus dieser Kategorie eingesammelt.'],
     'The fully owned exclusive category must show the same single completion message as other categories');
   assert.equal(await completeSection.locator('.kenny-pool-items > span').count(), 0);
   assert.equal(await completeSection.locator('.kenny-pool-zebra-divider').count(), 0);
   if (width === 390) {
     await poolPage.screenshot({ path: path.join(screenshots, 'kenny-prizes-complete-390.png') });
   }
   await poolPage.evaluate(() => sessionStorage.setItem('studyverse_test_missing_green', '1'));
   await poolPage.reload({ waitUntil: 'load' });
   await poolPage.locator('.navigation button[aria-label="Dino-Verse"]').click();
   await poolPage.locator(prizeSelector).click();
   const partialSection = poolPage.locator('.kenny-pool-section')
     .filter({ hasText: 'Saisonexklusiv' }).first();
   await partialSection.waitFor();
   assert.equal(await partialSection.locator('.kenny-pool-items > span').count(), 1);
   assert((await partialSection.locator('.kenny-pool-items > span').innerText()).includes('Kenny Grün'));
   assert.equal(await partialSection.locator('.kenny-pool-complete-regular').count(), 0);
   assert.equal(await partialSection.locator('.kenny-pool-complete-zebra').count(), 1,
     'Directly granted Zebra must complete only its own group while a missing regular skin stays listed');
   await poolContext.close();
  }
  console.log('PASS: Kenny complete-collection prize dialog and temporary reward gating.');
  const avatarContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const avatarPage=await avatarContext.newPage();
  await avatarPage.addInitScript(ids=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:1000,nickname:'AvatarTester',
    inventory:ids,equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[],
    dinoSeasons:{'kenny-2026':{feeds:24,overfeeds:0,overTokenWins:0,skin:'blue',settled:false,settlement:0}}}));
   const original=crypto.getRandomValues.bind(crypto);
   crypto.getRandomValues=array=>{
    if(array instanceof Uint32Array){array[0]=0;return array;}
    return original(array);
   };
  },allIds);
  await avatarPage.goto(base,{waitUntil:'load'});
  await avatarPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await avatarPage.locator('.companion-actions button').filter({hasText:'Kenny füttern'}).click();
  await avatarPage.locator('.kenny-feed-btn').click();
  await avatarPage.locator('.kenny-reveal-modal').waitFor();
  await avatarPage.locator('.kenny-reveal-actions .btn.secondary').click();
  await avatarPage.waitForFunction(()=>document.querySelector('#kenny-reveal-title')?.textContent?.includes('Level 5'));
  const avatarTitle=await avatarPage.locator('#kenny-reveal-title').innerText();
  assert(avatarTitle.includes('Level 5'),'The guaranteed avatar arrives with the level 5 reveal: '+avatarTitle);
  assert((await avatarPage.locator('.kenny-reveal-modal p').innerText()).includes('Kenny Blau'),
   'Level 5 reveal must name the guaranteed avatar');
  assert((await avatarPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')))).inventory.includes('kenny_avatar'));
  const avatarArt=await avatarPage.locator('.kenny-reveal-art img').evaluate(el=>({
   width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
   naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight
  }));
  assert(avatarArt.naturalWidth>0&&avatarArt.width>70&&avatarArt.width<190&&avatarArt.height<=160,
   'The full Kenny avatar should fit inside the reveal art area: '+JSON.stringify(avatarArt));
  await avatarPage.screenshot({path:path.join(screenshots,'kenny-avatar-reveal-390.png')});
  await avatarPage.locator('.kenny-inventory-btn').click();
  await avatarPage.locator('.inventory-item').first().waitFor();
  assert.equal(await avatarPage.locator('.inventory-item[data-category="avatar"]').count(),1,
   'The reward inventory shortcut should include the newly won blue avatar');
  assert((await avatarPage.locator('.inventory-item[data-category="avatar"]').innerText()).includes('Kenny Blau'));
  await avatarPage.locator('.inventory-item[data-category="avatar"] .drop-preview-btn').click();
  assert((await avatarPage.locator('.preview-requirement').innerText()).includes('Durch Kenny, den Raptor freigeschaltet'));
  await avatarContext.close();
  console.log('PASS: level 5 grants blue Kenny avatar, full-body reveal and direct inventory shortcut.');
  const colorContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const colorPage=await colorContext.newPage();
  await colorPage.addInitScript(ids=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:1000,nickname:'PinkTester',
    inventory:ids,equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[]}));
   const original=crypto.getRandomValues.bind(crypto);
   crypto.getRandomValues=array=>{if(array instanceof Uint32Array){array[0]=0;return array;}return original(array);};
  },[...allIds,'kenny_avatar'].filter(id=>!id.startsWith('kenny_skin_')&&id!=='kenny_avatar_pink'));
  await colorPage.goto(base,{waitUntil:'load'});
  await colorPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await colorPage.locator('.companion-actions button').filter({hasText:'Kenny füttern'}).click();
  await colorPage.locator('.kenny-feed-btn').click();
  const colorReveal = colorPage.getByRole('dialog', { name: /Neuer Skin für Kenny/ });
  await colorReveal.waitFor();
  assert((await colorReveal.locator('.kenny-reveal-art img').getAttribute('src'))
    .endsWith('kenny_pink_avatar.png'));
  assert.deepEqual(
    (await colorReveal.getByRole('button').allTextContents()).map((label) => label.trim()),
    ['Weiter'],
  );
  const colorProfile=await colorPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert(colorProfile.inventory.includes('kenny_skin_blue')&&colorProfile.inventory.includes('kenny_skin_pink')&&colorProfile.inventory.includes('kenny_avatar_pink'));
  assert(colorProfile.kennyWonItems['kenny_avatar_pink']);
  await colorReveal.getByRole('button', { name: 'Weiter', exact: true }).click();
  const pairedAvatarReveal = colorPage.getByRole('dialog', { name: /Dazu gibt’s einen Kenny-Avatar/ });
  await pairedAvatarReveal.waitFor();
  assert((await pairedAvatarReveal.locator('.kenny-reveal-art img').getAttribute('src'))
    .endsWith('kenny_pink_avatar.png'));
  assert(await pairedAvatarReveal.getByRole('button', { name: 'Weiter', exact: true }).isVisible());
  await pairedAvatarReveal.getByRole('button', { name: 'Ausrüsten & Weiter' }).click();
  await colorPage.waitForFunction(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1'))?.equipped?.avatar==='kenny_avatar_pink');
  await colorPage.waitForFunction(()=>document.querySelector('.top-profile-avatar img')?.getAttribute('src')?.includes('kenny_pink_avatar.png'),null,{timeout:4000}).catch(()=>{});
  const equippedPortrait=await colorPage.evaluate(()=>({
   saved:JSON.parse(localStorage.getItem('studyverse_profile_v1'))?.equipped?.avatar,
   src:document.querySelector('.top-profile-avatar img')?.getAttribute('src'),
   content:document.querySelector('.top-profile-avatar')?.innerHTML
  }));
  assert(equippedPortrait.src?.includes('kenny_pink_avatar.png'),
   'Ausrüsten & Weiter must equip the new Kenny avatar artwork: '+JSON.stringify(equippedPortrait));
  const designerReveal = colorPage.getByRole('dialog', { name: /Kenny in neuem Look/ });
  await designerReveal.waitFor();
  await designerReveal.getByRole('button', { name: "Zeig's mir" }).click();
  await colorPage.locator('.dino-designer-grid').waitFor({state:'visible'});
  assert.equal(await colorPage.locator('.kenny-reveal-modal').count(), 0);
  assert(await colorPage.locator('.dino-designer-skin-grid button').filter({hasText:'Kenny Pink'}).isEnabled(),
   'Zeig\'s mir must open the skin selector with the new color unlocked');
  await colorPage.locator('.dino-designer-heading-actions button').filter({hasText:'Meine Begleiter'}).click();
  await colorPage.locator('.navigation button[aria-label="Item-Shop"]').click();
  await colorPage.locator('.shop-view-tabs button').filter({hasText:'Inventar'}).click();
  await colorPage.locator('.inventory-search-label input').fill('Kenny Pink');
  await colorPage.locator('.inventory-item').first().waitFor({state:'visible'});
  assert.equal(await colorPage.locator('.inventory-item').count(),1,
   'The avatar stays in Inventory while Dino skins are exclusive to Dino Designer');
  assert((await colorPage.locator('.inventory-item').allTextContents()).every(text=>text.includes('Kenny Pink')));
  await colorContext.close();
  console.log('PASS: color skin, matching profile avatar, then Dino Designer shortcut.');

  const botContext = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const botPage = await botContext.newPage();
  await botPage.addInitScript((inventory) => {
    localStorage.setItem('studyverse_import_prompt_seen_v1', '1');
    localStorage.setItem('studyverse_profile_v1', JSON.stringify({
      xp: 0, tokens: 900, nickname: 'BotTester', inventory, equipped: { avatar: '🧪' },
      claimedLevels: {}, activity: [], shopDropMigrationV1: true, rewardSeen: {}, rewardQueue: [],
    }));
    const original = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (array) => {
      if (!(array instanceof Uint32Array)) return original(array);
      array[0] = 0;
      return array;
    };
  }, allIds.filter((id) => id !== 'dsai_bot'));
  await botPage.goto(base, { waitUntil: 'load' });
  await botPage.locator('.navigation button[aria-label="Dino-Verse"]').click();
  await botPage.locator('.kenny-feed-btn').click();
  const botReveal = botPage.getByRole('dialog', { name: /Data-Bot Avatar/ });
  await botReveal.waitFor();
  assert(!(await botReveal.innerText()).includes('Kenny-Avatar'));
  assert((await botReveal.locator('.kenny-reveal-art img').getAttribute('src'))
    .endsWith('dsai_bot_avatar.png'));
  await botReveal.getByRole('button', { name: 'Ausrüsten & Weiter' }).click();
  await botReveal.waitFor({ state: 'hidden' });
  assert.equal(await botPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('studyverse_profile_v1')).equipped.avatar;
  }), '🤖');
  await botContext.close();
  console.log('PASS: a standalone Data-Bot drop displays its own name and can be equipped.');

  // A non-avatar prize must name the cosmetic category (as Shop / Inventory
  // do) and put Kenny's random sentence on a separate line from its description.
  const itemContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const itemPage=await itemContext.newPage();
  await itemPage.addInitScript(ids=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:900,nickname:'BubbleTester',
    inventory:ids,equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[]}));
   const original=crypto.getRandomValues.bind(crypto);
   crypto.getRandomValues=array=>{if(array instanceof Uint32Array){array[0]=0;return array;}return original(array)};
  },allIds.filter(id=>id!=='bubbles'));
  await itemPage.goto(base,{waitUntil:'load'});
  await itemPage.locator('.navigation button[aria-label="Dino-Verse"]').click();
  await itemPage.locator('.kenny-feed-btn').click();
  await itemPage.locator('.kenny-reveal-modal').waitFor({state:'visible'});
  const dropTitle=await itemPage.locator('#kenny-reveal-title').innerText();
  assert(dropTitle.includes('Reagenzglas-Blasen Hintergrund'),
   'A random reward popup must show the readable cosmetic category: '+dropTitle);
  const copy=await itemPage.evaluate(()=>{
   const flavor=document.querySelector('.kenny-reveal-flavor');
   const desc=document.querySelector('.kenny-reveal-description');
   return {flavor:flavor?.textContent,description:desc?.textContent,
    flavorBottom:flavor?.getBoundingClientRect().bottom,
    descriptionTop:desc?.getBoundingClientRect().top};
  });
  assert(copy.flavor.includes('Kenny')&&copy.description.includes('Aufsteigende')&&
   copy.flavorBottom<=copy.descriptionTop,
   'Kenny random line and the item description must be separate readable paragraphs: '+
    JSON.stringify(copy));
  await itemPage.screenshot({path:path.join(screenshots,'kenny-item-drop-390.png')});
  await itemContext.close();
  console.log('PASS: the cosmetic type and separate flavor / description are displayed in Kenny rewards.');
  const maxContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const maxPage=await maxContext.newPage();
  await maxPage.addInitScript(()=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:6000,nickname:'MaxTester',
    inventory:['dsai_bot','dsai_panda','sharp_sheep','kenny_skin_pink','chem_link'],
    equipped:{theme:'base',atm:'none',frame:'none',avatar:'🦖',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[],
    dinoSeasons:{'kenny-2026':{feeds:32,overfeeds:0,overTokenWins:2000,skin:'blue',settled:false,settlement:0}}}));
  });
  await maxPage.goto(base,{waitUntil:'load'});
  assert((await maxPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')))).inventory.includes('kenny_avatar'),
   'Existing level 5 players receive the blue avatar retroactively');
  assert((await maxPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')))).inventory.includes('kenny_skin_blue'),
   'Existing owners of a colored Kenny skin receive the blue skin retroactively');
  await maxPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await maxPage.locator('.companion-actions button').filter({hasText:'Kenny füttern'}).click();
  await maxPage.locator('.kenny-hint').waitFor();
  assert(/1[, .]050 TT/.test(await maxPage.locator('.kenny-hint').innerText()),
   'Seven saved feeds beyond level 5 must show 1,050 TT gross cashback, including old saves');
  await maxPage.locator('.top-profile-link').click();
  await maxPage.locator('.profile-avatar-edit-btn').click();
  await maxPage.locator('.avatar-pick-grid').waitFor({state:'visible'});
  const avatarLayout=await maxPage.evaluate(()=>{
   const cards=[...document.querySelectorAll('.avatar-pick-item')];
   const kenny=cards.find(card=>card.textContent.includes('Kenny Blau'));
   const pink=cards.find(card=>card.textContent.includes('Kenny Pink'));
   const bot=cards.find(card=>card.textContent.includes('Data-Bot Avatar'));
   const image=kenny.querySelector('img').getBoundingClientRect();
   return {kennyHeight:kenny.getBoundingClientRect().height,botHeight:bot.getBoundingClientRect().height,
    imageWidth:image.width,imageHeight:image.height,pinkOwned:!!pink};
  });
  assert(avatarLayout.pinkOwned&&Math.abs(avatarLayout.kennyHeight-avatarLayout.botHeight)<=4&&
   avatarLayout.imageWidth<=60&&avatarLayout.imageHeight<=60,
   'Kenny must have the same avatar tile size as the other avatars: '+JSON.stringify(avatarLayout));
  await maxPage.screenshot({path:path.join(screenshots,'kenny-avatar-picker-390.png')});
  await maxPage.locator('.avatar-picker-modal .btn.secondary').click();
  await maxPage.locator('.navigation button[aria-label="Item-Shop"]').click();
  await maxPage.locator('.shop-view-tabs button').filter({hasText:'Inventar'}).click();
  await maxPage.locator('.inventory-item .item-art').first().waitFor({state:'visible'});
  const artHeights=await maxPage.locator('.inventory-item .item-art').evaluateAll(elements=>
   elements.map(element=>({name:element.closest('.inventory-item').querySelector('.item-name').textContent,
    height:element.getBoundingClientRect().height})));
  assert(artHeights.length>=4&&artHeights.every(art=>Math.abs(art.height-artHeights[0].height)<=1),
   'Panda and sheep avatar panels should match the other inventory art: '+JSON.stringify(artHeights));
  const inventoryGrid = maxPage.locator('.inventory-item-grid');
  for (const width of [320, 390]) {
    await maxPage.setViewportSize({ width, height: 800 });
    assert.equal(await inventoryGrid.evaluate((grid) =>
      getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    ), 3, 'Phone inventory uses the same three columns as the shop');
  }
  const bannerThumbnail = maxPage.locator('.inventory-item[data-category="banner"] app-cosmetic-banner img');
  await bannerThumbnail.scrollIntoViewIfNeeded();
  assert(await bannerThumbnail.evaluate(async (image) => {
    await image.decode();
    return image.src.endsWith('/cosmetics/banners/molecule.webp') &&
      image.naturalWidth > image.naturalHeight;
  }), 'The inventory must display the actual equipped-banner scene as a thumbnail');
  await maxPage.setViewportSize({ width: 390, height: 475 });
  const inventoryScroll = await inventoryGrid.evaluate((grid) => ({
    height: grid.clientHeight,
    content: grid.scrollHeight,
  }));
  assert(inventoryScroll.content > inventoryScroll.height,
    'The item grid must scroll when owned items exceed the available phone height');
  await maxPage.setViewportSize({ width: 390, height: 800 });
  const ownedAvatar=maxPage.locator('.inventory-item[data-category="avatar"]').first();
  assert(await ownedAvatar.count()>0,'Kenny must have a real avatar in inventory at level five');
  await ownedAvatar.locator('.drop-preview-btn').click();
  const avatarPreview=maxPage.locator('.shop-preview-modal[data-category="avatar"] .preview-after .preview-visual');
  await avatarPreview.waitFor({state:'visible'});
  await maxPage.waitForFunction(()=>{
    const img=document.querySelector('.shop-preview-modal[data-category="avatar"] .preview-after .preview-visual img');
    return img&&img.complete&&img.naturalWidth>0;
  });
  const avatarPreviewGeometry=await avatarPreview.evaluate(el=>{
    const art=el.querySelector('img').getBoundingClientRect(), frame=el.getBoundingClientRect();
    return {frame:frame.toJSON(),image:art.toJSON(),fit:getComputedStyle(el.querySelector('img')).objectFit};
  });
  assert(avatarPreviewGeometry.fit==='contain'&&
    avatarPreviewGeometry.image.top>=avatarPreviewGeometry.frame.top-1&&
    avatarPreviewGeometry.image.bottom<=avatarPreviewGeometry.frame.bottom+1&&
    avatarPreviewGeometry.image.left>=avatarPreviewGeometry.frame.left-1&&
    avatarPreviewGeometry.image.right<=avatarPreviewGeometry.frame.right+1,
    'Avatar PNG must remain completely inside the preview box: '+JSON.stringify(avatarPreviewGeometry));
  await maxPage.locator('.shop-preview-modal .btn.secondary').click();
  await maxPage.locator('.inventory-item').filter({hasText:'Molekül-Matrix'}).locator('.drop-preview-btn').click();
  assert((await maxPage.locator('.preview-requirement').innerText()).includes('Durch Kenny, den Raptor freigeschaltet'),
   'Already owned cosmetics with an incomplete learning goal must not claim it was fulfilled');
  await maxPage.locator('.shop-preview-modal .btn.secondary').click();
  const inventoryFilters = maxPage.locator('.inventory-filter-bar');
  const collectionFilter = inventoryFilters.getByLabel('Kollektion');
  const categoryFilter = inventoryFilters.getByLabel('Kategorie');
  await collectionFilter.selectOption('dsai-test-01');
  await categoryFilter.selectOption('avatar');

  const panda = maxPage.locator('.inventory-item').filter({ hasText: 'Panda' });
  const equipmentButton = panda.locator('.drop-buy-btn');
  const originalButton = await equipmentButton.elementHandle();
  assert.equal(await equipmentButton.innerText(), 'Ausrüsten');
  assert(await equipmentButton.evaluate((button) => {
    const control = getComputedStyle(button);
    const card = getComputedStyle(button.closest('.inventory-item'));
    return control.fontFamily === card.fontFamily && Number.parseFloat(control.fontSize) <= 12;
  }), 'Mobile inventory actions use the same compact type scale as shop actions');
  await equipmentButton.click();
  await equipmentButton.filter({ hasText: 'Ablegen' }).waitFor({ state: 'visible', timeout: 5000 });
  assert(await panda.locator('.equipped-status').isVisible());
  assert(await equipmentButton.evaluate((button, original) => button === original, originalButton),
    'Sorting the equipped avatar first must reuse its inventory card');
  await originalButton.dispose();

  await equipmentButton.click();
  await equipmentButton.filter({ hasText: 'Ausrüsten' }).waitFor({ state: 'visible', timeout: 5000 });
  await collectionFilter.selectOption('Alle');
  await maxPage.waitForFunction(() => {
    const filters = document.querySelectorAll('.inventory-filter-bar select');
    return filters[1]?.value === 'Alle';
  });

  await maxPage.setViewportSize({width:1200,height:850});
  const sidebarAlignment=await maxPage.locator('.navigation button').evaluateAll(buttons=>
   buttons.map(button=>({name:button.getAttribute('aria-label'),left:button.getBoundingClientRect().left})))
  assert(sidebarAlignment.some(button=>button.name==='Begleiter')&&sidebarAlignment.some(button=>button.name==='Dino-Verse')&&
   sidebarAlignment.every(button=>Math.abs(button.left-sidebarAlignment[0].left)<=1),
   'Shop, Inventory, Dino-Verse and Begleiter must align as peer sidebar destinations: '+JSON.stringify(sidebarAlignment));
  await maxPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await maxPage.locator('.companion-stage').waitFor({state:'visible'});
  await maxPage.locator('.navigation button[aria-label="Dashboard"]').click();
  await maxPage.locator('.dashboard-grid').waitFor({state:'visible'});
  const themeLooks=await maxPage.evaluate(()=>{
   const root=document.querySelector('.universe');root.dataset.banner='default';
   return ['dsai_neural','sharp_theme','sharp_cutline'].map(theme=>{
    root.dataset.theme=theme;
    const css=getComputedStyle(root);
    return {theme,bg:css.getPropertyValue('--bg').trim(),accent:css.getPropertyValue('--accent').trim(),
     hero:getComputedStyle(root.querySelector('.hero')).backgroundImage};
   });
  });
  assert(new Set(themeLooks.map(look=>look.bg)).size===3&&
   new Set(themeLooks.map(look=>look.accent)).size===3&&
   new Set(themeLooks.map(look=>look.hero)).size===3,
   'Neural Core, Violet Overclock and Razor Syntax need distinct backgrounds, accents and hero art: '+JSON.stringify(themeLooks));
  await maxContext.close();
  console.log('PASS: retroactive level-5 cashback and matched avatar picker size.');
  // Owning every cosmetic must never prevent another 300 TT feeding. With an
  // exhausted pool, the draw pays tokens and one more 150 TT season cashback.
  const emptyContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const emptyPage=await emptyContext.newPage();
  await emptyPage.addInitScript(ids=>{
   localStorage.setItem('studyverse_import_prompt_seen_v1','1');
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({xp:0,tokens:6220,nickname:'FullPoolTester',
    inventory:ids,equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
    claimedLevels:{},activity:[],shopDropMigrationV1:true,rewardSeen:{},rewardQueue:[],
    dinoSeasons:{'kenny-2026':{feeds:46,overfeeds:21,overTokenWins:0,skin:'blue',settled:false,settlement:0}}}));
   const original=crypto.getRandomValues.bind(crypto);
   crypto.getRandomValues=array=>{
    if(array instanceof Uint32Array){array[0]=0;return array;}
    return original(array);
   };
  },[...allIds,'kenny_avatar']);
  await emptyPage.goto(base,{waitUntil:'load'});
  await emptyPage.locator('.navigation button[aria-label="Begleiter"]').click();
  await emptyPage.locator('.companion-actions button').filter({hasText:'Kenny füttern'}).click();
  assert(await emptyPage.locator('.kenny-feed-btn').isEnabled(),
   'Kenny must remain feedable after every item has been collected');
  assert((await emptyPage.locator('.kenny-hint').allInnerTexts()).some(text=>/3[, .]150 TT/.test(text)),
   'Twenty-one extra feeds must preserve 3,150 TT cashback');
  await emptyPage.locator('.kenny-feed-btn').click();
  await emptyPage.locator('.kenny-reveal-modal').waitFor();
  const fullPoolSave=await emptyPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(fullPoolSave.tokens,6020,'Feeding must cost 300 TT and award a 100 TT token drop');
  assert.equal(fullPoolSave.dinoSeasons['kenny-2026'].feeds,47);
  assert.equal(fullPoolSave.dinoSeasons['kenny-2026'].overfeeds,22);
  await emptyPage.locator('.kenny-reveal-actions .btn.secondary').click();
  assert((await emptyPage.locator('.kenny-hint').allInnerTexts()).some(text=>/3[, .]300 TT/.test(text)),
   'Each extra 300 TT feeding must add 150 TT to the season cashback');
  await emptyContext.close();
  console.log('PASS: exhausted item pool permits 300 TT feeds, token prizes, and 150 TT cashback.');

  // A retained Kenny can still play his Verse after the season, while a
  // non-level-five dinosaur is locked even when entering the URL directly.
  const verseContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const versePage=await verseContext.newPage();
  await versePage.addInitScript(()=>{
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({
    xp:0,tokens:0,nickname:'VerseTester',
    inventory:['kenny_skin_red','kenny_skin_pink'],equipped:{dinoSkin:'red'},activity:[],
    dinoSeasons:{'kenny-2026':{feeds:25,skin:'red',settled:true,settlement:0}}
   }));
   Date.now=()=>Date.parse('2027-02-15T12:00:00+01:00');
  });
  await versePage.goto(base+'kennyverse/index.html',{waitUntil:'load'});
  await versePage.locator('.hero h1').waitFor({state:'visible'});
  assert.equal(await versePage.locator('#homeTab').count(),1,
   'A permanent Startseite tab must exist in the Kennyverse desktop sidebar');
  assert(await versePage.locator('.kenny-mobile-nav [data-kenny-nav="overview"]').isVisible(),
   'The mobile bottom bar must have an always-accessible Home button');
  assert(await versePage.locator('.top .return').innerText()!=='BEGLEITER',
   'Return link must be labelled Zurück zu Begleiter');
  async function assertVerseFits(viewport,screenLabel){
   const fit=await versePage.evaluate(()=>{
    const root=document.querySelector('#root').getBoundingClientRect();
    const screen=document.querySelector('.kenny-screen');
    const children=screen?[...screen.children].map(el=>({name:el.className,bottom:el.getBoundingClientRect().bottom,top:el.getBoundingClientRect().top})):[];
    const question=document.querySelector('.kenny-question-card');
    const choices=[...document.querySelectorAll('.kenny-question-card .choice')].map(el=>el.getBoundingClientRect());
    const next=document.querySelector('.kenny-next-row')?.getBoundingClientRect();
    return {viewport:innerHeight,bodyScroll:document.documentElement.scrollHeight,
      rootBottom:root.bottom,rootTop:root.top,content:children,
      choiceBottom:choices.length?Math.max(...choices.map(c=>c.bottom)):0,
      nextBottom:next?.bottom||0,cardBottom:question?.getBoundingClientRect().bottom||0,
      screen:document.querySelector('#root').dataset.screen};
   });
   assert(fit.bodyScroll<=fit.viewport+3&&
      fit.content.every(x=>x.bottom<=fit.rootBottom+3&&x.top>=fit.rootTop-3)&&
      fit.choiceBottom<=fit.cardBottom+3&&fit.nextBottom<=fit.cardBottom+3,
      'Kennyverse '+screenLabel+' must fit '+viewport+'px without scrolling or clipped buttons: '+JSON.stringify(fit));
  }
  await assertVerseFits(390,'Home');
  assert((await versePage.title()).includes('Kennyverse'));
  assert(await versePage.locator('.hero-icon img').isVisible(),
   'Kenny must be visibly present inside his Daily world');
  const equippedAppearance=await versePage.evaluate(()=>{
   const image=document.querySelector('.hero-icon .kenny-visual img');
   const sidebar=document.querySelector('.kenny-side-art .kenny-visual img');
   const root=getComputedStyle(document.documentElement);
   return {skin:document.documentElement.dataset.kennySkin,
    heroSrc:image.getAttribute('src'),heroLoaded:image.naturalWidth>0,
    sidebarSrc:sidebar.getAttribute('src'),sidebarLoaded:sidebar.naturalWidth>0,
    accent:root.getPropertyValue('--kenny-primary').trim(),
    sun:!!document.querySelector('.hero .kenny-banner-sun'),
    volcano:!!document.querySelector('.hero .kenny-banner-volcano i'),
    fern:document.querySelectorAll('.hero .kenny-banner-fern').length===2,
    ground:!!document.querySelector('.hero .kenny-banner-ground')};
  });
  assert(equippedAppearance.skin==='red'&&
    equippedAppearance.heroSrc?.endsWith('kenny-red-portrait.png')&&equippedAppearance.heroLoaded&&
    equippedAppearance.sidebarSrc?.endsWith('kenny-red-portrait.png')&&equippedAppearance.sidebarLoaded&&
    equippedAppearance.accent==='#ffa397'&&
    equippedAppearance.sun&&equippedAppearance.volcano&&equippedAppearance.fern&&equippedAppearance.ground,
    'Kennyverse must render equipped red Kenny, a matching red UI and the prehistoric banner: '+
     JSON.stringify(equippedAppearance));
  await versePage.locator('.hero button[data-action="quiz"]').click();
  await versePage.locator('.question').waitFor({state:'visible'});
  const firstQuestion=await versePage.locator('.question').innerText();
  await assertVerseFits(390,'Quiz question');
  await versePage.locator('.choice').first().click();
  await versePage.locator('.kenny-next-row button').waitFor({state:'visible'});
  await assertVerseFits(390,'Quiz feedback');
  await versePage.locator('.kenny-mobile-nav [data-kenny-nav="overview"]').click();
  await versePage.locator('.hero h1').waitFor({state:'visible'});
  await assertVerseFits(390,'Home from Quiz');
  await versePage.locator('.kenny-mobile-nav [data-kenny-nav="quiz"]').click();
  await versePage.locator('.kenny-next-row button').waitFor({state:'visible'});
  assert.equal(await versePage.locator('.question').innerText(),firstQuestion,
   'Returning to Home must not reset an unfinished quiz or erase the answer');
  await versePage.locator('.kenny-mobile-nav [data-kenny-nav="boss"]').click();
  await versePage.locator('.kenny-question-card').waitFor({state:'visible'});
  await assertVerseFits(390,'Boss question');
  await versePage.locator('#topHome').click();
  await versePage.locator('.hero h1').waitFor({state:'visible'});
  await versePage.locator('.kenny-mobile-nav [data-kenny-nav="quiz"]').click();
  await versePage.locator('.kenny-next-row button').waitFor({state:'visible'});
  assert.equal(await versePage.locator('.question').innerText(),firstQuestion,
   'Switching to Boss and back must preserve the quiz question');
  assert.equal(await versePage.locator('.choice').count(),4,
   'Kennyverse must keep four original answer options');
  assert(await versePage.locator('.kenny-play-title .kenny-visual img').isVisible(),
   'Research questions must also show the equipped Kenny companion');
  await versePage.evaluate(()=>{
    const profile=JSON.parse(localStorage.getItem('studyverse_profile_v1'));
    profile.dinoSeasons['kenny-2026'].skin='pink';
    profile.equipped.dinoSkin='pink';
    localStorage.setItem('studyverse_profile_v1',JSON.stringify(profile));
    window.dispatchEvent(new StorageEvent('storage',{key:'studyverse_profile_v1'}));
  });
  // A different PNG takes a network/decode turn after changing src; ensure
  // the new real artwork is loaded before checking its dimensions.
  await versePage.waitForFunction(()=>{
    const image=document.querySelector('.kenny-play-title .kenny-visual img');
    return image?.getAttribute('src')?.endsWith('kenny-pink-portrait.png') &&
      image.complete && image.naturalWidth>0;
  },null,{timeout:10000});
  const updatedAppearance=await versePage.evaluate(()=>({
    skin:document.documentElement.dataset.kennySkin,
    questionSrc:document.querySelector('.kenny-play-title .kenny-visual img').getAttribute('src'),questionLoaded:document.querySelector('.kenny-play-title .kenny-visual img').naturalWidth>0,
    accent:getComputedStyle(document.documentElement).getPropertyValue('--kenny-primary').trim()
  }));
  assert(updatedAppearance.skin==='pink'&&updatedAppearance.questionSrc?.endsWith('kenny-pink-portrait.png')&&updatedAppearance.questionLoaded&&
    updatedAppearance.accent==='#ffa7ed',
    'Kennyverse must recolor the quiz companion and entire UI when equipped skin changes: '+
     JSON.stringify(updatedAppearance));
  for(const width of [320,390,1365]){
   await versePage.setViewportSize({width,height:800});
   await assertVerseFits(width,'Quiz feedback');
   if(width<=610)await versePage.locator('.kenny-mobile-nav [data-kenny-nav="overview"]').click();
   else await versePage.locator('#topHome').click();
   await versePage.locator('.hero h1').waitFor({state:'visible'});
   await assertVerseFits(width,'Home');
   if (width <= 610) {
    const ground = await versePage.locator('.kenny-home-screen .hero').evaluate((hero) => {
      const terrain = hero.querySelector('.kenny-banner-ground').getBoundingClientRect();
      const portrait = hero.querySelector('.hero-icon img').getBoundingClientRect();
      return { groundTop: terrain.top, feet: portrait.bottom - portrait.height * 0.05 };
    });
    assert(ground.feet > ground.groundTop, 'Kenny must stand on the ground in the mobile hero');
   }
   if(width===1365){
    const stage=await versePage.evaluate(()=>{
     const rect=sel=>document.querySelector(sel).getBoundingClientRect();
     const image=rect('.hero-icon .kenny-visual img');
     const frame=rect('.side .kenny-side-art');
     const portrait=rect('.side .kenny-side-art .kenny-visual img');
     const label=rect('.side .kenny-side-art strong');
     return {imageWidth:image.width,imageHeight:image.height,
      frameTop:frame.top,frameBottom:frame.bottom,frameLeft:frame.left,frameRight:frame.right,
      imgTop:portrait.top,imgBottom:portrait.bottom,imgLeft:portrait.left,imgRight:portrait.right,
      labelBottom:label.bottom,labelTop:label.top,portraitBottom:portrait.bottom};
    });
    assert(stage.imageWidth>=190&&stage.imageHeight>=210,
     'Kenny should be a large hero character in the Urzeit landscape: '+JSON.stringify(stage));
    assert(stage.imgTop>=stage.frameTop-2&&stage.imgBottom<=stage.frameBottom+2&&
      stage.imgLeft>=stage.frameLeft-2&&stage.imgRight<=stage.frameRight+2&&
      stage.portraitBottom<=stage.labelTop+2&&stage.labelBottom<=stage.frameBottom+2,
      'Sidebar Kenny must remain fully inside his portrait panel: '+JSON.stringify(stage));
   }
   await versePage.locator(width<=610?'.kenny-mobile-nav [data-kenny-nav="quiz"]':'#quizTab').click();
  }
  await versePage.setViewportSize({width:390,height:800});
  for(let i=0;i<20;i++){
   if(await versePage.locator('.kenny-question-card').count()===0)break;
   if(await versePage.locator('.kenny-next-row').count()===0)
    await versePage.locator('.choice').first().click();
   await versePage.locator('.kenny-next-row button').click();
  }
  await versePage.locator('.kenny-result-screen').waitFor({state:'visible'});
  await assertVerseFits(390,'Quiz result');
  await versePage.locator('.kenny-mobile-nav [data-kenny-nav="boss"]').click();
  for(let i=0;i<20;i++){
   await versePage.locator('.choice').first().click();
   await versePage.locator('.kenny-next-row button').click();
  }
  await versePage.locator('.kenny-result-screen').waitFor({state:'visible'});
  await assertVerseFits(390,'Boss result');
  await check(versePage,'Kennyverse 390');
  await verseContext.close();
  const lockedContext=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
  const lockedPage=await lockedContext.newPage();
  await lockedPage.addInitScript(()=>{
   localStorage.setItem('studyverse_profile_v1',JSON.stringify({
    dinoSeasons:{'kenny-2026':{feeds:24}}
   }));
   Date.now=()=>Date.parse('2027-02-15T12:00:00+01:00');
  });
  await lockedPage.goto(base+'kennyverse/index.html',{waitUntil:'load'});
  await lockedPage.locator('.kenny-locked').waitFor({state:'visible'});
  assert(await lockedPage.locator('#quizTab').isDisabled(),
   'A retired non-level-five Kenny must not unlock Daily rewards via a direct URL');
  await lockedContext.close();
  console.log('PASS: Kennyverse remains playable after Level 5; expired non-retained companions are locked.');
  for(const [world,url,mainSelector,header] of [
   ['Chemverse','nawi/test-01/','#pages','.studyverse-profile-link'],
   ['Dsaiverse','dsai/test-01/','#main','.studyverse-profile-link'],
   ['Sharpverse','pos/pa-01/','#main','.profile-link']]){
   for(const width of [320,360,390,430,768]){
    const context=await browser.newContext({
     viewport:{width,height:800},deviceScaleFactor:1,isMobile:true,hasTouch:true
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+url,{waitUntil:'load'});
    await page.locator(mainSelector).waitFor({timeout:12000});
    await check(page,world+' Start '+width);
    await page.locator(header).waitFor();
    assert(await page.locator(header).isVisible(),'Mein Profil should be visible in '+world);
    if(width===390)await page.screenshot({
     path:path.join(screenshots,world.toLowerCase()+'-390.png'),fullPage:true
    });
    if(width<=430){
     if(world==='Chemverse'){
      assert.equal(await page.locator('#menuBtn').count(),0,'Chemverse no longer uses a burger button');
      const nav=page.locator('#nav');
      assert(await nav.isVisible(),'Chemverse mobile learning tabs must remain accessible');
      await nav.locator('[data-nav="academy"]').click();
      await check(page,'Chemverse Academy '+width);
     }else{
      const menu=page.locator(world==='Dsaiverse'?'#mobileMenu':'.mobile-menu');
      await menu.click();
      const drawer=page.locator(world==='Sharpverse'?'.sidebar':'#sidebar');
      await page.waitForTimeout(120);
      assert(await drawer.evaluate(e=>e.classList.contains('open')),
       'Mobile navigation drawer must open in '+world);
      await page.locator(world==='Dsaiverse'?'#nav button[data-nav="academy"]':'.nav-link[data-action="view:academy"]').click();
      await page.waitForTimeout(120);
      assert(!await drawer.evaluate(e=>e.classList.contains('open')),
       world+' drawer must close after navigating');
      await check(page,world+' Academy '+width);
     }
    }
    assert(!errors.length,world+' script errors at '+width+': '+errors.join('; '));
    await context.close();
   }
  }
  // Real Dsaiverse return regression: six lessons must reveal ALL four
  // rewards in one 1-of-4 sequence, not across separate page visits.
  const rewardContext=await browser.newContext({viewport:{width:430,height:800},deviceScaleFactor:1});
  const rewardPage=await rewardContext.newPage();
  await rewardPage.addInitScript(()=>{
    localStorage.setItem('studyverse_import_prompt_seen_v1','1');
    localStorage.setItem('studyverse_profile_v1',JSON.stringify({
      xp:0,tokens:1000,nickname:'RewardTester',inventory:[],
      equipped:{theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'},
      claimedLevels:{},activity:[],shopDropMigrationV1:true,
      rewardSeen:{},rewardQueue:[],rewardBatchTotal:0,rewardBatchPosition:0
    }));
    localStorage.setItem('dsai_studyverse_v1',JSON.stringify({
      xp:180,coins:1000,courseDone:{a:true,b:true,c:true,d:true,e:true,f:true},
      purchased:{},solved:{},earned:{}
    }));
    localStorage.setItem('studyverse_trainer_launch_v2',JSON.stringify({
      id:'dsai-test-01',saveKey:'dsai_studyverse_v1',xp:0
    }));
  });
  await rewardPage.goto(base,{waitUntil:'load'});
  const rewardModal=rewardPage.locator('.reward-unlock-modal');
  await rewardModal.waitFor({timeout:10000});
  assert((await rewardModal.locator('.reward-counter').innerText()).includes('1 VON 4'),
   'All four academy milestone rewards must be queued together after one Dsaiverse return');
  const tokensBefore=await rewardPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens);
  const displayedTokens=Number((await rewardModal.locator('.reward-wallet').innerText()).replace(/[^0-9]/g,''));
  assert.equal(displayedTokens,tokensBefore,
   'Modal shows the actual current TT balance, including earned level bonuses');
  const dataBotPrice=Number((await rewardModal.locator('.reward-price-text strong').innerText()).replace(/[^0-9]/g,''));
  assert.equal(dataBotPrice,200,'Data-Bot uses the shared Verse avatar price');
  await rewardModal.getByRole('button',{name:/Kaufen.*Ausrüsten/}).click();
  await rewardPage.waitForFunction(()=>document.querySelector('.reward-counter')?.textContent?.includes('2 VON 4'));
  const firstCounter=await rewardModal.locator('.reward-counter').innerText();
  console.log('REWARD AFTER FIRST BUY:',firstCounter,
   JSON.stringify(await rewardPage.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('studyverse_profile_v1')||'{}');
    return {tokens:p.tokens,inventory:p.inventory,queue:p.rewardQueue,pos:p.rewardBatchPosition,total:p.rewardBatchTotal};
   })));
  assert(firstCounter.includes('2 VON 4'),
   'Buying the first reward must advance directly to second, not dismiss the whole batch');
  const afterPurchase=await rewardPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(afterPurchase.tokens,tokensBefore-dataBotPrice,'Purchase deducts the displayed Data-Bot price exactly once');
  assert(afterPurchase.inventory.length>=1,'Purchased avatar enters inventory');
  for(let i=3;i<=4;i++){
    await rewardModal.getByRole('button',{name:/Weiter/}).click();
    await rewardPage.waitForFunction(n=>document.querySelector('.reward-counter')?.textContent?.includes(n+' VON 4'),i);
    assert((await rewardModal.locator('.reward-counter').innerText()).includes(i+' VON 4'),
      'Reward '+i+' must appear within the same modal session');
  }
  await rewardModal.getByRole('button',{name:/Annehmen/}).click();
  await rewardModal.waitFor({state:'hidden'});
  assert.equal(await rewardPage.locator('.reward-unlock-modal').count(),0,
   'Modal only closes after reviewing every unlocked item');
  const final=await rewardPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(final.tokens,tokensBefore-dataBotPrice,'Skipping the three remaining items must not deduct any tokens');
  assert.equal(final.rewardQueue.length,0,'Entire reward queue acknowledged once');
  await rewardContext.close();
  console.log('PASS: 6 Dsaiverse lessons reveal all four cosmetics in a single buy-or-next carousel.');
  // MathsVerse remains a visible locked subject but has no deployable course.
  const subjectPage=await browser.newPage();
  // Same initialized test profile as the main mobile sweep. Otherwise the
  // first-run import welcome dialog correctly blocks navigation clicks.
  await subjectPage.addInitScript(()=>
   localStorage.setItem('studyverse_import_prompt_seen_v1','1'));
  await subjectPage.goto(base,{waitUntil:'load'});
  await subjectPage.locator('.navigation button[aria-label="Lernwelten"]').first().click();
  const matTile=subjectPage.locator('button.subject-card.detailed[aria-label^="Mathematik"]').first();
  await matTile.waitFor({state:'visible',timeout:6000});
  assert(await matTile.isDisabled(),'MathsVerse must remain visible but locked');
  await subjectPage.close();
  // Global equipment must actually render inside EACH standalone trainer, not
  // merely appear on the Studyverse dashboard where it was equipped.
  for(const [world,url] of [
   ['Chemverse','nawi/test-01/'],
   ['Dsaiverse','dsai/test-01/'],
   ['Sharpverse','pos/pa-01/']]){
   const equipped=await browser.newContext({viewport:{width:390,height:800},deviceScaleFactor:1});
   const cosmeticPage=await equipped.newPage();
   await cosmeticPage.addInitScript(()=>{
    localStorage.setItem('studyverse_profile_v1',JSON.stringify({
     equipped:{theme:'sharp_cutline',atm:'dots',frame:'legend',font:'serif',
      banner:'pink_paradise',fx:'thread_sparks',avatar:'kenny_avatar_zebra',title:'sharp_title_spermann'}
    }));
   });
   const issues=[];cosmeticPage.on('pageerror',e=>issues.push(e.message));
   await cosmeticPage.goto(base+url,{waitUntil:'load'});
   const headerAvatar = cosmeticPage.locator('.topbar .studyverse-verse-avatar').first();
   await headerAvatar.waitFor({ state: 'visible' });
   assert(await headerAvatar.evaluate(async (image) => {
     await image.decode();
     return image.naturalWidth > 0 && image.src.endsWith('/kenny_zebra_avatar.png') &&
       image.parentElement.textContent.trim() === '';
   }), world + ' must show the Zebra artwork without its raw ID');

   await cosmeticPage.locator('.verse-banner span').first().waitFor({timeout:10000});
   const appearance=await cosmeticPage.evaluate(()=>{
    const body=document.body;
    const backdrop=document.querySelector('.verse-atmosphere');
    const card=document.querySelector('.panel,.stat,.mode-card,.lesson-card,.challenge-card');
    return {
     theme:body.dataset.theme,atm:body.dataset.atm,frame:body.dataset.frame,
     font:body.dataset.font,banner:body.dataset.banner,fx:body.dataset.fx,
     backdropOpacity:Number(getComputedStyle(backdrop).opacity),
     background:getComputedStyle(backdrop).backgroundImage,
     cards:document.querySelectorAll('.verse-banner span').length,
     effectCount:document.querySelectorAll('.verse-fx i').length,
     cardBorder:card?getComputedStyle(card).borderTopColor:'',
     title:document.querySelector('.verse-equipped-title')?.textContent||''
    };
   });
   for(const [key,val] of Object.entries({theme:'sharp_cutline',atm:'dots',frame:'legend',
     font:'serif',banner:'pink_paradise',fx:'thread_sparks'})){
    assert.equal(appearance[key],val,world+' must apply the globally equipped '+key);
   }
   assert(appearance.backdropOpacity>=.5&&appearance.background.includes('radial-gradient'),
    world+' must show the equipped Dots & Lines atmosphere');
   assert(appearance.cards>=3&&appearance.effectCount===9,
    world+' must render the equipped banner and 9 effect particles');
   assert(appearance.title.includes('Professor Spermann'),world+' must display equipped title');
   assert(!issues.length,world+' cosmetics caused JS errors: '+issues.join('; '));
   if(world==='Sharpverse')assert(await cosmeticPage.locator('.studyverse-back').isVisible(),
    'Sharpverse must have a top-right back button just like Chemverse and Dsaiverse');
   await check(cosmeticPage,world+' global equipment');
   await cosmeticPage.screenshot({path:path.join(screenshots,world.toLowerCase()+'-global-cosmetics-390.png'),fullPage:true});
   // Switching equipment must replace old textures, including a restored background tab.
   for(const atm of ['snow','bubbles','none']){
    await cosmeticPage.evaluate(atm=>{
     const profile=JSON.parse(localStorage.getItem('studyverse_profile_v1'));
     profile.equipped.atm=atm;profile.equipped.fx='none';
     localStorage.setItem('studyverse_profile_v1',JSON.stringify(profile));
     window.dispatchEvent(new Event('pageshow'));
    },atm);
    await cosmeticPage.waitForFunction(atm=>document.body.dataset.atm===atm&&document.body.dataset.fx==='none',atm);
    await cosmeticPage.waitForTimeout(300);
    const layers=await cosmeticPage.evaluate(()=>({
     count:document.querySelectorAll('.verse-atmosphere').length,
     before:getComputedStyle(document.body,'::before').content,
     after:getComputedStyle(document.body,'::after').content,
     opacity:Number(getComputedStyle(document.querySelector('.verse-atmosphere')).opacity),
     particles:document.querySelectorAll('.verse-fx i').length,
     z:Number(getComputedStyle(document.querySelector('.verse-atmosphere')).zIndex),
     appZ:Number(getComputedStyle(document.querySelector('#app,.app')).zIndex)
    }));
    assert.equal(layers.count,1,world+' should have exactly one atmosphere layer');
    assert.equal(layers.before,'none',world+' should disable legacy background');
    assert.equal(layers.after,'none',world+' should disable legacy atmosphere');
    assert.equal(layers.particles,0,world+' must clear unequipped effects');
    assert(layers.z<layers.appZ,world+' atmosphere must stay behind content');
    assert(atm==='none'?layers.opacity===0:layers.opacity>0,world+' should apply '+atm);
   }
   // Sources are reachable through each trainer navigation and contain no old settings.
   if(world!=='Chemverse'){
    const menu=cosmeticPage.locator(world==='Dsaiverse'?'#mobileMenu':'.mobile-menu');
    await menu.click();
   }else{
    assert.equal(await cosmeticPage.locator('#menuBtn').count(),0,'Chemverse has no burger');
   }
   const sourceNav=cosmeticPage.locator(world==='Sharpverse'?'[data-action="view:sources"]':'[data-nav="sources"]');
   await sourceNav.click();
   await cosmeticPage.locator('.sources-list').waitFor();
   assert((await cosmeticPage.locator('.sources-list').innerText()).length>150,world+' must list real teaching sources');
   assert.equal(await cosmeticPage.locator('.sources-list input,.sources-list select,#resetBtn,#exportBtn,#focusToggle,#soundToggle,#testDate').count(),0,
    world+' sources page must not contain settings');
   await cosmeticPage.evaluate(() => {
     const profile = JSON.parse(localStorage.getItem('studyverse_profile_v1'));
     profile.equipped.font = 'velvet_voltage';
     localStorage.setItem('studyverse_profile_v1', JSON.stringify(profile));
     window.dispatchEvent(new Event('pageshow'));
   });
   await cosmeticPage.waitForFunction(() => {
     return getComputedStyle(document.body).fontFamily.includes('Unbounded') &&
       Array.from(document.fonts).some((font) => font.family.includes('Unbounded') && font.status === 'loaded');
   });
   await check(cosmeticPage,world+' sources');
   await cosmeticPage.screenshot({path:path.join(screenshots,world.toLowerCase()+'-sources-390.png'),fullPage:true});
   await equipped.close();
  }
  // 1440 × 900 desktop: profile settings should fit without scrolling.
  const desktop=await browser.newContext({viewport:{width:1440,height:900}});
  const desktopPage=await desktop.newPage();
  // Dismiss the one-time legacy import welcome veil, as in the phone checks.
  await desktopPage.addInitScript(()=>localStorage.setItem('studyverse_import_prompt_seen_v1','1'));
  await desktopPage.goto(base,{waitUntil:'load'});
  await desktopPage.locator('.top-profile-link').click();
  await desktopPage.locator('.profile-view').waitFor();
  const profileHeight=await desktopPage.evaluate(()=>({
   scroll:document.documentElement.scrollHeight,
   viewport:document.documentElement.clientHeight,
   controls:document.querySelectorAll('.profile-view input,.profile-view button,.profile-view select').length
  }));
  assert(profileHeight.controls>=5,'Profile settings must keep all interactive controls');
  assert(profileHeight.scroll-profileHeight.viewport<=12,
   'Desktop profile should not require scrolling: '+JSON.stringify(profileHeight));
  const sidebar=await desktopPage.locator('.sidebar').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight}));
  assert(sidebar.content<=sidebar.height+2,'Desktop sidebar should show every destination without scrolling: '+JSON.stringify(sidebar));
  await desktopPage.screenshot({path:path.join(screenshots,'studyverse-profil-desktop.png'),fullPage:true});
  await desktopPage.locator('.navigation button[aria-label="Item-Shop"]').click();
  await desktopPage.locator('.drop-item').first().waitFor();
  const shopSix=await desktopPage.evaluate(()=>{
   const cards=[...document.querySelectorAll('.drop-item')].slice(0,6).map(el=>el.getBoundingClientRect());
   const grid=document.querySelector('.item-grid').getBoundingClientRect();
   return {count:cards.length,columns:new Set(cards.map(r=>Math.round(r.left))).size,
    sixthBottom:cards[5]?.bottom,gridBottom:grid.bottom};
  });
  assert(shopSix.count===6&&shopSix.columns===3&&shopSix.sixthBottom<=shopSix.gridBottom+2,
   'Desktop shop should show two complete rows of three items: '+JSON.stringify(shopSix));
  assert.equal(await desktopPage.locator('.drop-item .drop-price').count(),0,
   'The buy button alone should state the price');
  await desktopPage.locator('.shop-category-chips button').filter({hasText:'Rahmen'}).click();
  await desktopPage.waitForFunction(()=>{
   const grid=document.querySelector('.drop-item-grid');
   return grid?.classList.contains('few-items')&&grid.querySelectorAll('.drop-item').length>3;
  });
  const frameGrid=await desktopPage.locator('.drop-item-grid').evaluate(el=>({
   count:el.querySelectorAll('.drop-item').length,height:el.clientHeight,content:el.scrollHeight,
   lastBottom:[...el.querySelectorAll('.drop-item')].at(-1)?.getBoundingClientRect().bottom,
   gridBottom:el.getBoundingClientRect().bottom,
   overflow:getComputedStyle(el).overflowY
  }));
  assert(frameGrid.count>3&&frameGrid.count<=6&&frameGrid.content<=frameGrid.height+2&&
   frameGrid.lastBottom<=frameGrid.gridBottom+2&&frameGrid.overflow==='hidden',
   'A collection with at most six items must fit without a scrollbar: '+JSON.stringify(frameGrid));
  await desktopPage.locator('.drop-item .drop-preview-btn').first().click();
  assert.equal(await desktopPage.locator('.shop-preview-modal .preview-cost').count(),0);
  const previewFit=await desktopPage.locator('.shop-preview-modal').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  assert(previewFit.content<=previewFit.height+2&&previewFit.overflow==='hidden',
   'The preview should fit without an inner scrollbar: '+JSON.stringify(previewFit));
  await desktop.close();
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
 if(problems.length){
  console.error('Mobile overflow detected:\n'+JSON.stringify(problems,null,2));
  process.exitCode=1;
 }else console.log('PASS: Chromium mobile layout and navigation across all four Verses, 320–768px.');
}
main().catch(error=>{console.error(error);process.exitCode=1;server.close()});
