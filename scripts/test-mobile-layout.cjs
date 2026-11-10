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
    const level=bounds('.dashboard-grid .right-rail>.level-card');
    const inventory=bounds('.dashboard-grid .right-rail>.loot-card');
    const achievements=bounds('.dashboard-grid .right-rail>.achievements-preview');
    const activity=bounds('.dashboard-grid .right-rail>.activity-card:last-child');
    return {railWidth:rail.width,levelWidth:level.width,
      inventoryTop:inventory.top,achievementsTop:achievements.top,
      activityWidth:activity.width};
   });
   assert(cardLayout.levelWidth >= cardLayout.railWidth-4,
    'Level XP bar should span both dashboard info-grid columns at '+width+'px');
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
     await select.selectOption('nawi-test-01');
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
     const menu=page.locator(world==='Chemverse'?'#menuBtn':world==='Dsaiverse'?'#mobileMenu':'.mobile-menu');
     await menu.click();
     const drawer=page.locator(world==='Sharpverse'?'.sidebar':'#sidebar');
     await page.waitForTimeout(120);
     assert(await drawer.evaluate(e=>e.classList.contains('open')),
      'Mobile navigation drawer must open in '+world);
     if(world==='Dsaiverse'||world==='Sharpverse'){
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
