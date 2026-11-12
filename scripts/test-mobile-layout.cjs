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
   for(const [label,nav] of [
    ['Lernwelten','Lernwelten'],['Achievements','Achievements'],['Item-Shop','Item-Shop'],
    ['Inventar','Inventar'],['TastyTokens','TastyTokens verdienen']]){
    // On phones, Inventory and TastyTokens live within the Shop's own three tabs.
    const button=width<=700&&['Inventar','TastyTokens'].includes(label)
     ?page.locator('.shop-view-tabs button').filter({hasText:label==='Inventar'?'Inventar':'TastyTokens verdienen'})
     :page.locator('.navigation button[aria-label="'+nav+'"]');
    await button.waitFor({state:'visible',timeout:5000});
    await button.click();
    await page.waitForTimeout(100);
    await check(page,'Studyverse '+label+' '+width);
    if(label==='Item-Shop'){
     const select=page.locator('#shop-drop-select');
     assert(await select.isVisible(),'Drop selector should be beside Alle Items at '+width+'px');
     assert.equal(await page.locator('.shop-drop-card').count(),0,'No old chunky drop cards');
     assert((await page.locator('.item-name-type').count())>0,
      'Product names should visibly include the cosmetic kind');
     await select.selectOption('global');
     assert((await page.locator('.shop-current-drop').innerText()).includes('STUDYVERSE'),
      'Dropdown must update selected collection and items');
     const layout=await page.evaluate(()=>{
      const head=document.querySelector('.shop-items-heading-main h2').getBoundingClientRect();
      const select=document.querySelector('#shop-drop-select').getBoundingClientRect();
      return {headingBottom:head.bottom,selectTop:select.top,selectLeft:select.left,headRight:head.right};
     });
     assert(layout.selectLeft>=layout.headRight-4||Math.abs(layout.selectTop-layout.headingBottom)<48,
      'Drop selector should be in same header row on mobile '+width+'px: '+JSON.stringify(layout));
     if(width===390){
      const dotsCard=page.locator('.drop-item').filter({hasText:'Dots & Lines'}).first();
      await dotsCard.locator('.drop-preview-btn').click();
      const preview=page.locator('.shop-live-stage[data-atm="dots"]');
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
    }
    if(width===390&&['Item-Shop','Achievements'].includes(label))
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
    assert.equal(navLabels,4,'Phone bottom bar should contain four readable main destinations');
    const visibleNavButtons=await page.locator('.navigation button:visible').count();
    assert.equal(visibleNavButtons,4,'Inventory and TastyTokens stay within the Shop on phones');
   }
   assert(!errors.length,'Studyverse script errors at '+width+': '+errors.join('; '));
   await context.close();
  }
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
  assert((await rewardModal.locator('.reward-wallet').innerText()).includes('1.000'),
   'Modal shows current TT before purchase');
  await rewardModal.getByRole('button',{name:/Kaufen.*Ausrüsten/}).click();
  assert((await rewardModal.locator('.reward-counter').innerText()).includes('2 VON 4'),
   'Buying the first reward must advance directly to second, not dismiss the whole batch');
  const afterPurchase=await rewardPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(afterPurchase.tokens,910,'Purchase deducts the existing Data-Bot 90 TT exactly once');
  assert(afterPurchase.inventory.length>=1,'Purchased avatar enters inventory');
  for(let i=3;i<=4;i++){
    await rewardModal.getByRole('button',{name:/Weiter/}).click();
    assert((await rewardModal.locator('.reward-counter').innerText()).includes(i+' VON 4'),
      'Reward '+i+' must appear immediately, within the same modal session');
  }
  await rewardModal.getByRole('button',{name:/Annehmen/}).click();
  assert.equal(await rewardPage.locator('.reward-unlock-modal').count(),0,
   'Modal only closes after reviewing every unlocked item');
  const final=await rewardPage.evaluate(()=>JSON.parse(localStorage.getItem('studyverse_profile_v1')));
  assert.equal(final.tokens,910,'Skipping the three remaining items must not deduct any tokens');
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
      banner:'pink_paradise',fx:'thread_sparks',avatar:'🐑',title:'sharp_title_spermann'}
    }));
   });
   const issues=[];cosmeticPage.on('pageerror',e=>issues.push(e.message));
   await cosmeticPage.goto(base+url,{waitUntil:'load'});
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
     title:document.querySelector('.verse-equipped-title')?.textContent||'',
     avatar:document.querySelector('.profile-link .avatar,#avatar,#levelAvatar')?.textContent||''
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
   assert(appearance.avatar.includes('🐑'),world+' must display equipped avatar');
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
  await desktopPage.screenshot({path:path.join(screenshots,'studyverse-profil-desktop.png'),fullPage:true});
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
