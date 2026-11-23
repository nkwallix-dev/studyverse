// Browser regression for the approved PNG-rig Kenny test tab.
// npm run build -- --base-href /studyverse/ --output-path dist/site
// npm install --no-save --package-lock=false playwright
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve('dist/site/browser');
const shots = path.resolve('mobile-screenshots');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/studyverse/')) return response.writeHead(404).end();
  if (pathname === '/studyverse/cloud-config.json')
    return response.writeHead(200, { 'Content-Type': 'application/json' })
      .end('{"apiKey":"","projectId":""}');
  const target = path.resolve(root, pathname.slice('/studyverse/'.length) || 'index.html');
  if (!target.startsWith(root + path.sep))
    return response.writeHead(403).end();
  fs.readFile(target, (error, content) => {
    if (error) return response.writeHead(404).end();
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }).end(content);
  });
});
function browserPath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'])
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  throw Error('Chromium is required for PNG-rig browser validation');
}
(async () => {
  assert(fs.existsSync(path.join(root, 'index.html')), 'Build output missing');
  fs.mkdirSync(shots, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/studyverse/`;
  const browser = await chromium.launch({
    executablePath: browserPath(),
    headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('studyverse_import_prompt_seen_v1', '1'));
    const errors = [];
    const missingRigImages = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => {
      if (response.url().includes('/kenny/rig/v1/') && response.status() !== 200)
        missingRigImages.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil: 'load' });
    await page.locator('.dashboard-grid').waitFor({ timeout: 20000 });
    await page.locator('.navigation button[aria-label="Dino-Verse"]').click();
    await page.locator('.kenny-page').waitFor({ state:'visible' });
    await page.locator('.kenny-action-row .kenny-style-btn').click();
    await page.locator('.dino-designer-grid').waitFor({ state: 'visible' });
    const switcher = page.locator('.kenny-designer-mode');
    assert(await switcher.isVisible(), 'Rig test navigation missing');
    await switcher.getByRole('button', { name: /Test · Kenny-Rig/ }).click();
    const rig = page.locator('app-kenny-rig-preview');
    await rig.waitFor({ state: 'visible' });
    await page.waitForTimeout(1700);
    const debug = await page.evaluate(async () => {
      const rig = document.querySelector('app-kenny-rig-preview');
      const r = await fetch(new URL('kenny/rig/v1/manifest.json', document.baseURI));
      return {
        base: document.baseURI, imageCount: rig?.querySelectorAll('svg image').length,
        error: rig?.querySelector('.rig-error')?.textContent,
        src: [...(rig?.querySelectorAll('svg image') || [])].slice(0, 3).map(i => i.getAttribute('href')),
        manifestStatus: r.status, manifestTypes: r.ok ? (await r.json()).parts?.length : null,
      };
    });
    console.log('RIG_DIAGNOSTICS', JSON.stringify(debug), 'HTTP_ERRORS', JSON.stringify(missingRigImages), 'PAGE_ERRORS', JSON.stringify(errors));
    await page.screenshot({path:path.join(shots,'kenny-rig-initial-state.png'),fullPage:true});
    await page.waitForFunction(() => document.querySelectorAll('app-kenny-rig-preview svg image').length >= 19, null, {timeout: 12000});
    assert((await rig.locator('svg image').count())>=19,'Expected 18 independent PNG parts plus underpaint');
    assert((await rig.locator('svg image[href*="/parts/blue/"]').count())>=19,'Should begin with blue PNG parts plus underpaint');
    assert.equal(missingRigImages.length,0,'Missing rig assets: '+JSON.stringify(missingRigImages));
    await rig.getByRole('button',{name:'Pause'}).click();
    // Allow any already-queued 10 FPS tick to settle before reading the paused frame.
    await page.waitForTimeout(180);
    const before=await rig.locator('.frame-meta').last().innerText();
    const beforeFrame=Number(before.match(/Frame:\s*(\d+)/)?.[1]);
    assert(Number.isInteger(beforeFrame), 'Could not parse paused frame counter');
    await rig.getByRole('button',{name:'Ein Frame weiter'}).click();
    await page.waitForFunction(previous => {
      const nodes=document.querySelectorAll('app-kenny-rig-preview .frame-meta');
      const match=nodes[nodes.length-1]?.textContent?.match(/Frame:\s*(\d+)/);
      return match && Number(match[1]) === (previous+1)%64;
    }, beforeFrame, {timeout: 5000});
    const after=await rig.locator('.frame-meta').last().innerText();
    assert.equal(Number(after.match(/Frame:\s*(\d+)/)?.[1]),(beforeFrame+1)%64,
      'Frame step should advance exactly one frame');
    await rig.getByRole('button',{name:'Pink',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('app-kenny-rig-preview svg image[href*="/parts/pink/"]')!==null);
    assert((await rig.locator('svg image[href*="/parts/pink/"]').count())>=19,'Pink reuses the identical 18 body parts');
    await rig.getByRole('button',{name:'Weiß',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('app-kenny-rig-preview svg image[href*="/parts/white/"]')!==null);
    assert((await rig.locator('svg image[href*="/parts/white/"]').count())>=19,'Stored zebra ID maps to white');
    await rig.getByRole('button',{name:/Gelenke/}).click();
    assert(await rig.locator('svg .rig-joint').count()>=17,'Joint debug controls must work');
    await rig.getByRole('button',{name:'Blau',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('app-kenny-rig-preview svg image[href*="/parts/blue/"]')!==null);
    await page.screenshot({path:path.join(shots,'kenny-rig-approved-master-1280.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(shots,'kenny-rig-approved-master-390.png'),fullPage:true});
    assert.equal(missingRigImages.length,0,'Rig PNG requests must resolve on GitHub Pages base path');
    assert.deepEqual(errors,[],'Browser runtime error in rig');
    console.log('OK: real Kenny rig renders from 18 original PNG parts, frame step and all skin palettes work.');
    await context.close();
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
