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
      if (window.parent !== window) return;
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
          kennyTutorialSeen: true,
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

    // Settings are available from the expedition menu, before entering fullscreen.
    // Check the actual accessible panel and tutorial shortcut, not merely DOM presence.
    const settingsToggle = page.locator('.kenny-settings .settings-toggle');
    await settingsToggle.click();
    // This test pauses the browser clock; let Angular flush its signal-driven view.
    await page.clock.runFor(32);
    const settingsPanel = page.locator('.kenny-settings .settings-popover');
    assert(await settingsPanel.isVisible(), 'Expedition settings must open from the menu');
    assert(
      await settingsPanel.getByRole('button', { name: 'Tutorial spielen' }).isVisible(),
      'The repeatable tutorial shortcut must be visible inside settings',
    );
    await settingsToggle.click();
    await page.clock.runFor(32);
    assert(!(await settingsPanel.isVisible()), 'Settings must close again');

    await page.getByRole('button', { name: 'Expedition starten' }).click();
    await page.clock.runFor(32);
    await page.getByRole('heading', { name: 'Wähle dein Starter-Kit' }).waitFor();
    await page.getByRole('button', { name: 'Mit diesem Kit starten' }).click();
    await page.clock.runFor(32);

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
    const baselines = await page.evaluate(async () => {
      const names = [
        'blue-walk',
        'red-walk',
        'pink-walk',
        'green-walk',
        'zebra-walk',
        'triceratops-walk',
        'stegosaurus-walk',
      ];
      const result = [];
      for (const name of names) {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = new URL(`kenny/animations/${name}.png?v=2`, document.baseURI).href;
        });
        const canvas = document.createElement('canvas');
        canvas.width = 768;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, 768, 192).data;
        for (let frame = 0; frame < 4; frame++) {
          let bottom = 0;
          for (let y = 0; y < 192; y++)
            for (let x = frame * 192; x < (frame + 1) * 192; x++) {
              if (data[(y * 768 + x) * 4 + 3] > 32) bottom = y + 1;
            }
          result.push({ name, frame, bottom });
        }
      }
      return result;
    });
    assert(
      baselines.every((frame) => frame.bottom >= 178 && frame.bottom <= 181),
      'Visible feet must sit at the common baseline: ' + JSON.stringify(baselines),
    );
    const wallet = await page.evaluate(
      () => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens,
    );
    // The new expedition has 20 randomized encounters, so the old fixed three-enemy
    // course trace cannot be replayed as a deterministic full-run browser test.
    // The old solver remains independently checked by test-kenny-platformer.cjs.
    const sprite = page.locator('.platformer-player');
    // Check attacks before approaching a random dinosaur: a real special can
    // correctly stun Kenny and make later keyboard-input assertions unreliable.
    await page.keyboard.press('KeyJ');
    await page.evaluate(() => window.__kennyFrames(8));
    assert.equal(await sprite.getAttribute('data-motion'), 'attack', 'J uses bite artwork');
    await page.evaluate(() => window.__kennyFrames(30));
    await page.keyboard.press('KeyL');
    await page.evaluate(() => window.__kennyFrames(18));
    assert.equal(await sprite.getAttribute('data-motion'), 'attack', 'L uses special artwork');
    await page.screenshot({ path: path.join(screenshots, 'kenny-jump-attack.png') });
    await page.evaluate(() => window.__kennyFrames(65));
    // Restart between attack and movement checks: the special's attack-lock
    // and randomized enemy stuns must not turn a keyboard test into a timing lottery.
    const retry = page.getByRole('button', { name: 'Neuer Versuch' });
    if (await retry.isVisible()) {
      await retry.click();
    } else {
      const restart = page.getByRole('button', { name: 'Neu starten' });
      if (!(await restart.isVisible())) {
        await page.getByRole('button', { name: 'Spiel pausieren' }).click();
        // Clock is frozen in this test: flush Angular's scheduled signal render.
        await page.clock.runFor(32);
      }
      await restart.click();
    }
    await page.clock.runFor(32);
    await page.evaluate(() => window.__kennyFrames(3));
    const originalX = await sprite.evaluate((element) => parseFloat(element.style.left));
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.__kennyFrames(38));
    await page.keyboard.up('KeyD');
    assert(
      (await sprite.evaluate((element) => parseFloat(element.style.left))) > originalX + 10,
      'Real keyboard controls move Kenny in a fresh expedition',
    );
    await page.screenshot({ path: path.join(screenshots, 'kenny-platformer-desktop.png') });
    await page.evaluate(() => window.__kennyFrames(65));
    const beforeAim = await sprite.evaluate((element) => ({
      height: element.style.height,
      top: element.style.top,
    }));
    for (const code of ['KeyW', 'KeyS']) {
      await page.keyboard.down(code);
      await page.evaluate(() => window.__kennyFrames(12));
      await page.keyboard.up(code);
      assert.deepEqual(
        await sprite.evaluate((element) => ({ height: element.style.height, top: element.style.top })),
        beforeAim,
        'Aiming must not resize or jump Kenny',
      );
    }
    await page.evaluate(() => window.__kennyFrames(20));
    const stageSize = await page.locator('.kenny-stage > canvas').boundingBox();
    // The permanent key hint was intentionally removed. Inject a simulated
    // contextual overlay to verify long messages cannot resize the canvas.
    await page.locator('.kenny-stage').evaluate((stage) => {
      const overlay = document.createElement('div');
      overlay.className = 'game-hint';
      overlay.textContent = 'Ein sehr langer Pickup-Hinweis '.repeat(30);
      stage.append(overlay);
    });
    assert.deepEqual(await page.locator('.kenny-stage > canvas').boundingBox(), stageSize);
    // Random encounters can legitimately end a run before the UI regression finishes.
    if (await page.getByRole('button', { name: 'Neuer Versuch' }).isVisible()) {
      await page.getByRole('button', { name: 'Neuer Versuch' }).click();
    }
    await page.keyboard.press('KeyP');
    await page.evaluate(() => window.__kennyFrames(3));
    const gameDialog = await page.locator('.game-dialog').allInnerTexts();
    console.log('KENNYVERSE PAUSE CHECK:', gameDialog);
    assert(
      await page.getByRole('button', { name: 'Weiterspielen' }).isVisible(),
      'P must pause the real expedition: ' + JSON.stringify(gameDialog),
    );
    await page.getByRole('button', { name: 'Weiterspielen' }).click();
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens),
      wallet,
      'The game must not mutate global TastyTokens',
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
    await phone.getByRole('button', { name: 'Mit diesem Kit starten' }).click();
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
      assert.equal(fit.controls.length, 10, 'Kenny keeps all ten touch controls, including Q');
      if (width === 844 && height === 390) {
        // Regression: the Q button used to wrap to a second row and leave the viewport.
        const tops = fit.controls.map((button) => Math.round(button.bottom));
        assert.equal(new Set(tops).size, 1, 'Landscape must display Q and all other controls in one row');
      }
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
      pickups: Object.fromEntries(
        ['triceratops-horns', 'stegosaurus-plates'].flatMap((item) =>
          Array.from({ length: 50 }, (_, i) => [item + '_fixture_' + i, item]),
        ),
      ),
      equipped: null,
      equippedAt: 0,
      seen: ['stegosaurus-plates', 'triceratops-horns'],
    });
    const inventory = await collection.newPage();
    await inventory.goto(base + '#companions');
    assert.equal(await inventory.getByRole('button', { name: 'Skillbaum & Erfolge', exact: true }).count(), 0,
      'The global Companion menu must not expose Kennyverse equipment');
    // Kenny fusion progression is accessible only from the dedicated Kennyverse.
    await inventory.goto(base + 'kennyverse/index.html');
    await inventory.locator('.side [data-kenny-nav="inventory"]').click();
    const skillPanel = inventory.frameLocator('#kennyCollection iframe');
    // Both earned items were acknowledged in the fixture. Test navigation and
    // kit selection here; reward dialogs are checked in their own suite.
    await skillPanel.getByRole('heading', { name: 'Kennys Fusions-Skillbaum' }).waitFor();
    const tree = skillPanel.locator('.skill-tree-viewport');
    await tree.waitFor();
    assert.equal(await tree.locator('.skill-node').count(), 8, 'Two equal items per dinosaur, two complete kits, two hybrid fusions');
    const fusion = tree.locator('.skill-node').filter({ hasText: 'Hörner + Rückenplatten' });
    await fusion.getByRole('button', { name: 'Als Starter wählen' }).click();
    await fusion.getByRole('button', { name: /Ausgerüstet/ }).waitFor();
    assert.equal(await tree.evaluate((el) => getComputedStyle(el).overflowY), 'auto');
    const equipped = await inventory.evaluate(
      () => JSON.parse(localStorage.getItem('studyverse_profile_v1')).companions.equippedSlots,
    );
    assert.deepEqual(equipped, { offense: 'triceratops-horns', defense: 'stegosaurus-plates' });
    for (const width of [320, 390, 768, 1280]) {
      await inventory.setViewportSize({ width, height: 900 });
      assert(
        await inventory.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
      );
      await inventory.screenshot({
        path: path.join(screenshots, `companion-equipment-${width}.png`),
        fullPage: true,
      });
    }
    await inventory.locator('.side a.kenny-platformer-link').click();
    // Wait for the new Angular page and renderer to finish booting; a reward
    // dialog may only appear AFTER cloud hydration, not on initial navigation.
    await inventory.waitForFunction(() => [...document.querySelectorAll('button')].some(
      (button) => button.textContent?.trim() === 'Expedition starten' && !button.disabled,
    ));
    // A separate, yet-unacknowledged item may reveal a reward on entering the game.
    // Acknowledge it normally before trying to press the unobscured Start button.
    for (let attempt = 0; attempt < 5; attempt++) {
      const acknowledge = inventory.getByRole('button', { name: 'Annehmen', exact: true });
      if (!(await acknowledge.isVisible())) break;
      try {
        await acknowledge.click({ timeout: 1800 });
      } catch {
        // Cloud reconciliation can detach the reward dialog between visibility
        // check and click. If so, re-check the current dialog instead of failing.
      }
      await inventory.waitForTimeout(80);
    }
    await inventory.getByRole('button', { name: 'Expedition starten' }).click();
    await inventory.getByRole('heading', { name: 'Wähle dein Starter-Kit' }).waitFor();
    // Re-select explicitly via the real starter picker: changing pages may change
    // which preview is highlighted before cloud persistence settles.
    await inventory.getByRole('button', { name: /Anpassen/ }).click();
    const mixedKit = inventory.locator('.kit-selection button').filter({ hasText: 'Hörner + Rückenplatten' });
    await mixedKit.click();
    await inventory.getByRole('button', { name: 'Auswahl übernehmen' }).click();
    await inventory.getByRole('button', { name: 'Mit diesem Kit starten' }).click();
    await inventory
      .locator('.ability-hud')
      .getByText(/Triceratops-Charge/)
      .waitFor();
    await inventory
      .locator('.ability-hud')
      .getByText(/Stegosaurus-Rückenplatten/)
      .waitFor();
    assert((await inventory.locator('.shield').innerText()).includes('1/1'));
    const fusedSprite = inventory.locator('.platformer-player');
    await inventory.waitForFunction(() => {
      const el = document.querySelector('.platformer-player');
      return el?.getAttribute('data-fusion-row') === '5';
    });
    assert.equal(await fusedSprite.getAttribute('data-fusion-row'), '5',
      'Horns and plates must use the combined, actually illustrated fusion row');
    const fusionCanvas = fusedSprite.locator('.kenny-native-fusion-frame');
    await inventory.waitForFunction(() => {
      const canvas = document.querySelector('.platformer-player .kenny-native-fusion-frame');
      if (!canvas || canvas.width !== 192 || canvas.height !== 192) return false;
      return canvas.getContext('2d').getImageData(0, 0, 192, 192).data.some((pixel, i) =>
        i % 4 === 3 && pixel > 0);
    });
    assert.equal(await fusionCanvas.evaluate(el => getComputedStyle(el).display), 'block',
      'Native full fusion must render a cropped Canvas frame instead of background atlas bleeding');
    assert.equal(await fusedSprite.evaluate(el => el.style.backgroundImage), 'none',
      'Old 800% CSS background must be disabled to avoid neighbouring-frame pixels');
    assert((await inventory.locator('.kenny-fusion-layer').getAttribute('data-native-atlas')) === 'true',
      'Separate fake accessory overlays must be disabled for a real animated fusion');
    const fusedImage = await inventory.evaluate(() => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
      image.onerror = () => reject(new Error('Production fusion atlas failed to decode'));
      image.src = new URL('kenny/animations/fusions/green.png?v=4', document.baseURI).href;
    }));
    assert.deepEqual(fusedImage, [1254, 1254], 'Full-resolution supplied atlas must load');
    await inventory.screenshot({ path: path.join(screenshots, 'kenny-fusion-horns-plates.png') });
    const stageBefore = await inventory.locator('.kenny-stage > canvas').boundingBox();
    await inventory.keyboard.press('KeyL');
    await inventory.waitForTimeout(300);
    assert.equal(
      await inventory.locator('.platformer-player').getAttribute('data-special'),
      'charge',
    );
    assert.deepEqual(await inventory.locator('.kenny-stage > canvas').boundingBox(), stageBefore);
    assert.equal(
      await inventory.evaluate(
        () => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens,
      ),
      1745,
    );
    await collection.close();

    // Enter from the Kennyverse itself: both collection tabs retain its shell.
    const tabs = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await initialize(tabs, true, {
      version: 1,
      pickups: Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => ['tab_fixture_' + i, 'triceratops-horns']),
      ),
      equipped: null,
      equippedAt: 0,
      seen: ['triceratops-horns'],
    });
    const kenny = await tabs.newPage();
    const tabErrors = [];
    kenny.on('pageerror', (error) => tabErrors.push(error.message));
    await kenny.goto(base + 'kennyverse/index.html');
    await kenny.locator('.side [data-kenny-nav="inventory"]').click();
    const panel = kenny.frameLocator('#kennyCollection iframe');
    await panel.getByRole('heading', { name: 'Begleiter-Skillbaum', exact: true }).waitFor();
    assert.equal(
      await panel.locator('.sidebar').count(),
      0,
      'Do not show the global Studyverse navigation inside Kennyverse',
    );
    assert.equal(await panel.locator('nav[aria-label="Begleiter-Sammlung"]').count(), 0);
    const unlockedHorn = panel.locator('.skill-node').filter({ hasText: 'Kenny · Hörner' });
    await unlockedHorn.getByRole('button', { name: 'Als Starter wählen' }).click();
    await unlockedHorn.getByRole('button', { name: /Ausgerüstet/ }).waitFor();
    await kenny.locator('.side [data-kenny-nav="achievements"]').click();
    await panel.getByRole('heading', { name: 'Begleiter-Achievements', exact: true }).waitFor();
    await panel.getByRole('heading', { name: 'Plattenbau Deluxe', exact: true }).waitFor();
    assert.equal(await panel.locator('article').count(), 4);
    assert.equal(await panel.getByRole('button', { name: 'Ausrüsten', exact: true }).count(), 0);
    assert.equal(
      await kenny.locator('#kennyCollection iframe').count(),
      1,
      'Tab switches reuse the collection and pending saves',
    );
    for (const width of [320, 390, 768, 1280]) {
      await kenny.setViewportSize({ width, height: 900 });
      const navigation = width <= 610 ? '.kenny-mobile-nav' : '.side';
      await kenny.locator(navigation + ' [data-kenny-nav="inventory"]').click();
      await panel.getByRole('heading', { name: 'Begleiter-Skillbaum', exact: true }).waitFor();
      await unlockedHorn.getByRole('button', { name: /Ausgerüstet/ }).waitFor();
      assert(await kenny.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      assert(
        await panel
          .locator('body')
          .evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
      );
      const frameBox = await kenny.locator('#kennyCollection iframe').boundingBox();
      assert(
        frameBox.height > 200 && frameBox.width > 100,
        'Collection has usable space at ' + width,
      );
      await kenny.screenshot({ path: path.join(screenshots, `kenny-inventory-tab-${width}.png`) });
      await kenny.locator(navigation + ' [data-kenny-nav="achievements"]').click();
      await panel.getByRole('heading', { name: 'Begleiter-Achievements', exact: true }).waitFor();
      await kenny.screenshot({
        path: path.join(screenshots, `kenny-achievements-tab-${width}.png`),
      });
    }
    await kenny.locator('.side [data-kenny-nav="quiz"]').click();
    const question = await kenny.locator('.question').innerText();
    await kenny.locator('.side [data-kenny-nav="inventory"]').click();
    await panel.getByRole('heading', { name: 'Begleiter-Skillbaum', exact: true }).waitFor();
    await kenny.locator('.side [data-kenny-nav="quiz"]').click();
    assert.equal(
      await kenny.locator('.question').innerText(),
      question,
      'Visiting the collection must retain quiz sessions',
    );
    assert.equal(
      await kenny.evaluate(() => JSON.parse(localStorage.getItem('studyverse_profile_v1')).tokens),
      1745,
    );
    assert.deepEqual(tabErrors, []);
    await tabs.close();

    const emptyContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await initialize(emptyContext, true, { version: 1, amberPickups: { test_amber: true } });
    const empty = await emptyContext.newPage();
    await empty.goto(base + 'kennyverse/index.html?mode=inventory');
    const emptyPanel = empty.frameLocator('#kennyCollection iframe');
    await emptyPanel.getByRole('heading', { name: 'Begleiter-Skillbaum', exact: true }).waitFor();
    assert.equal(await emptyPanel.locator('.skill-node.locked').count(), 8, 'New accounts start with every fusion locked');
    assert.equal(await emptyPanel.locator('.skill-root').count(), 1, 'Base Kenny remains playable without pickups');
    assert.equal(await empty.locator('#kennyAmber strong').innerText(), '1');
    await empty.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('studyverse_profile_v1'));
      p.companions.amberPickups.second = true;
      localStorage.setItem('studyverse_profile_v1', JSON.stringify(p));
      window.dispatchEvent(new StorageEvent('storage', { key: 'studyverse_profile_v1' }));
    });
    assert.equal(await empty.locator('#kennyAmber strong').innerText(), '2');
    await empty.screenshot({ path: path.join(screenshots, 'kenny-empty-inventory.png') });
    await emptyContext.close();

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
