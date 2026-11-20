// Play the expedition in Chromium and check desktop, touch, pause, skins and wallets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve('dist/site/browser');
const screenshots = path.resolve('mobile-screenshots');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/studyverse/')) return response.writeHead(404).end();
  if (pathname.endsWith('/cloud-config.json'))
    return response
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end('{"apiKey":"","projectId":""}');
  const target = path.resolve(root, pathname.slice('/studyverse/'.length) || 'index.html');
  if (!target.startsWith(root + path.sep)) return response.writeHead(403).end();
  fs.readFile(target, (error, bytes) => {
    if (error) return response.writeHead(404).end();
    response
      .writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' })
      .end(bytes);
  });
});

function binaryPath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const binary of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      return execFileSync('which', [binary], { encoding: 'utf8' }).trim();
    } catch {}
  }
  throw Error('Chromium must be installed to test the platformer');
}

async function initialize(context, retained = true, companions = undefined) {
  await context.addInitScript(
    ({ retained, companions }) => {
      localStorage.setItem('studyverse_import_prompt_seen_v1', '1');
      localStorage.setItem(
        'studyverse_profile_v1',
        JSON.stringify({
          companions,
          xp: 1000,
          tokens: 1745,
          nickname: 'Expeditionstest',
          inventory: ['kenny_skin_green'],
          equipped: {
            theme: 'base',
            avatar: '🧪',
            font: 'standard',
            banner: 'default',
            title: '',
            frame: 'none',
            atm: 'none',
            fx: 'none',
          },
          claimedLevels: {},
          activity: [],
          shopDropMigrationV1: true,
          dinoSeasons: {
            'kenny-2026': {
              feeds: retained ? 25 : 0,
              skin: retained ? 'green' : 'blue',
              settled: false,
              settlement: 0,
            },
          },
        }),
      );
    },
    { retained, companions },
  );
}

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/studyverse/`;
  const traceFile = path.join(os.tmpdir(), `kenny-trace-${process.pid}.json`);
  execFileSync(process.execPath, ['scripts/test-kenny-platformer.cjs'], {
    env: { ...process.env, KENNY_TRACE: traceFile },
  });
  const trace = JSON.parse(fs.readFileSync(traceFile, 'utf8'));
  fs.unlinkSync(traceFile);
  const browser = await chromium.launch({
    executablePath: binaryPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    fs.mkdirSync(screenshots, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await initialize(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/cloud-config.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: '{"apiKey":"","projectId":""}' }),
    );
    await page.goto(base + 'kennyverse/index.html');
    await page.locator('.side .kenny-platformer-link').click();
    await page.getByRole('button', { name: 'Expedition starten' }).waitFor();
    assert(page.url().endsWith('#kenny-platformer'));
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    // Pump real browser animation callbacks at a fixed cadence. Production code
    // has no test bridge; only the clock scheduler is replaced inside this test.
    await page.evaluate(() => {
      let time = performance.now();
      let id = 100000;
      let callbacks = new Map();
      window.requestAnimationFrame = (callback) => {
        callbacks.set(++id, callback);
        return id;
      };
      window.cancelAnimationFrame = (key) => callbacks.delete(key);
      window.__kennyFrames = (count) => {
        for (let frame = 0; frame < count; frame++) {
          time += 1000 / 120;
          const pending = [...callbacks.values()];
          callbacks.clear();
          for (const callback of pending) callback(time);
        }
      };
    });
    await page.clock.runFor(32);
    await page.evaluate(() => window.__kennyFrames(2));

    await page.getByRole('button', { name: 'Expedition starten' }).click();

    assert.equal(await page.locator('.platformer-player').getAttribute('data-skin'), 'green');
    const image = await page
      .locator('.platformer-player')
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    assert(
      image.includes('kenny-green-idle-strip'),
      'Equipped Kenny skins must use the actual sprite strip',
    );
    const spriteUrl = /url\("?([^"\)]+)/.exec(image)[1];
    assert((await page.request.get(spriteUrl)).ok(), 'The sprite image must load');
    const wallet = await page.evaluate(
      () => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens,
    );
    const codes = { left: 'KeyA', right: 'KeyD', crouch: 'KeyS', jump: 'Space', bite: 'KeyJ' };
    let keys = new Set();
    // The engine solver records normal controls. Replay them through real DOM keyboard events.
    for (let start = 0; start < trace.length;) {
      const input = trace[start].input;
      let end = start + 1;
      while (end < trace.length && JSON.stringify(trace[end].input) === JSON.stringify(input))
        end++;
      const next = new Set();
      if (input.axis < 0) next.add(codes.left);
      if (input.axis > 0) next.add(codes.right);
      if (input.crouch) next.add(codes.crouch);
      if (input.jumpHeld || input.jump) next.add(codes.jump);
      if (input.bite) next.add(codes.bite);
      for (const key of keys) if (!next.has(key)) await page.keyboard.up(key);
      for (const key of next) if (!keys.has(key)) await page.keyboard.down(key);
      await page.evaluate((count) => window.__kennyFrames(count), end - start);
      if (start === 0) {
        await page.clock.runFor(32);
        await page.screenshot({ path: path.join(screenshots, 'kenny-platformer-desktop.png') });
      }
      keys = next;
      start = end;
    }
    for (const key of keys) await page.keyboard.up(key);
    // Allow a small landing / knockback margin while approaching the final portal.
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.__kennyFrames(120));
    await page.keyboard.up('KeyD');
    await page.evaluate(() => window.__kennyFrames(8));
    await page.clock.runFor(100);
    assert(
      await page.getByRole('heading', { name: 'Pfad gemeistert.' }).isVisible(),
      'A full keyboard-only expedition must reach the goal',
    );
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens),
      wallet,
      'Prototype points must never change the token wallet',
    );
    assert(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('studyverse_kenny_platformer_v1')).seconds > 0,
      ),
    );
    await page.screenshot({ path: path.join(screenshots, 'kenny-platformer-finish.png') });
    await page.getByRole('button', { name: 'Nochmal los' }).click();
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.__kennyFrames(20));
    await page.clock.runFor(32);
    await page.keyboard.up('KeyD');
    await page.keyboard.press('KeyP');
    const position = await page
      .locator('.platformer-player')
      .evaluate((element) => element.style.left);
    await page.evaluate(() => window.__kennyFrames(120));
    await page.clock.runFor(2000);
    assert.equal(
      await page.locator('.platformer-player').evaluate((element) => element.style.left),
      position,
      'Paused physics must not advance',
    );
    await page.getByRole('button', { name: 'Weiterspielen' }).click();
    await page.keyboard.press('KeyR');
    await page.evaluate(() => window.__kennyFrames(3));
    await page.clock.runFor(32);
    assert(
      await page
        .locator('.game-hint')
        .innerText()
        .then((text) => text.includes('Checkpoint')),
    );
    assert.deepEqual(errors, []);
    await context.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await initialize(mobile);
    const phone = await mobile.newPage();
    await phone.goto(base + '#kenny-platformer');
    await phone.getByRole('button', { name: 'Expedition starten' }).click();
    await phone.locator('.touch-controls button').first().waitFor({ state: 'visible' });
    for (const [width, height] of [
      [320, 740],
      [390, 844],
      [768, 1024],
      [844, 390],
    ]) {
      await phone.setViewportSize({ width, height });
      await phone.waitForTimeout(60);
      const fit = await phone.evaluate(() => {
        const canvas = document.querySelector('canvas').getBoundingClientRect();
        return {
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
          bottom: document.querySelector('.expedition').getBoundingClientRect().bottom,
          height: innerHeight,
          canvasHeight: canvas.height,
          controls: [...document.querySelectorAll('.touch-controls button')].map((el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, bottom: r.bottom };
          }),
        };
      });
      assert(
        fit.scroll <= fit.width &&
          fit.bottom <= fit.height + 1 &&
          fit.canvasHeight > 180 &&
          fit.controls.every((r) => r.left >= 0 && r.right <= fit.width && r.bottom <= fit.height),
        `Mobile game and controls must fit ${width}×${height}: ${JSON.stringify(fit)}`,
      );
      await phone.screenshot({ path: path.join(screenshots, `kenny-platformer-${width}.png`) });
    }
    await phone.setViewportSize({ width: 390, height: 844 });
    const right = phone.locator('[data-action="right"]');
    const jump = phone.locator('[data-action="jump"]');
    const prior = await phone
      .locator('.platformer-player')
      .evaluate((element) => element.style.left);
    const priorTop = await phone
      .locator('.platformer-player')
      .evaluate((element) => parseFloat(element.style.top));
    const rightBounds = await right.boundingBox();
    const jumpBounds = await jump.boundingBox();
    const cdp = await mobile.newCDPSession(phone);
    const fingers = [
      {
        id: 1,
        x: rightBounds.x + rightBounds.width / 2,
        y: rightBounds.y + rightBounds.height / 2,
      },
      { id: 2, x: jumpBounds.x + jumpBounds.width / 2, y: jumpBounds.y + jumpBounds.height / 2 },
    ];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers });
    await phone.waitForTimeout(300);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert(
      (await phone
        .locator('.platformer-player')
        .evaluate((element) => parseFloat(element.style.top))) <
        priorTop - 20,
      'A second touch must trigger a real jump while running',
    );
    assert.notEqual(
      await phone.locator('.platformer-player').evaluate((element) => element.style.left),
      prior,
      'Touch movement and jumping must work together',
    );
    await phone.getByRole('button', { name: 'Spiel pausieren' }).click();
    await phone.getByRole('button', { name: 'Weiterspielen' }).waitFor();
    await mobile.close();

    const collection = await browser.newContext();
    await initialize(collection, true, {
      version: 1,
      pickups: Object.fromEntries(Array.from({ length: 50 }, (_, i) => ['fixture_' + i, 'triceratops-horns'])),
      equipped: null, equippedAt: 0, seen: [],
    });
    const inventory = await collection.newPage();
    await inventory.goto(base + '#companions');
    await inventory.getByRole('heading', { name: 'Mit dem Kopf durch die Wand' }).waitFor();
    await inventory.getByRole('button', { name: 'Annehmen', exact: true }).click();
    const cards = inventory.locator('app-companion-equipment article');
    await cards.first().getByRole('button', { name: 'Ausrüsten', exact: true }).click();
    await cards.first().getByRole('button', { name: 'Ablegen', exact: true }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await inventory.setViewportSize({ width, height: 900 });
      assert(await inventory.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      await inventory.screenshot({ path: path.join(screenshots, `companion-equipment-${width}.png`), fullPage: true });
    }
    await inventory.getByRole('button', { name: 'Spielen', exact: true }).click();
    await inventory.getByRole('button', { name: 'Expedition starten' }).click();
    await inventory.getByText('Aktive Fusionen (Grafik folgt): Triceratops-Hörner').waitFor();
    assert.equal(await inventory.evaluate(() => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens), 1745);
    await collection.close();

    const locked = await browser.newContext();
    await initialize(locked, false);
    const lockedPage = await locked.newPage();
    await lockedPage.clock.install({ time: new Date('2027-02-15T12:00:00Z') });
    await lockedPage.goto(base + '#kenny-platformer');
    await lockedPage.getByRole('heading', { name: 'Kenny ist weitergezogen.' }).waitFor();
    assert.equal(await lockedPage.getByRole('button', { name: 'Expedition starten' }).count(), 0);
    await lockedPage.getByRole('button', { name: 'Zu meinen Begleitern' }).click();
    await lockedPage.locator('app-kenny-platformer').waitFor({ state: 'detached' });
    await locked.close();
    console.log(
      'Kenny platformer browser: full keyboard run, skin assets, wallet, pause, reset, mobile controls and season access passed.',
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
