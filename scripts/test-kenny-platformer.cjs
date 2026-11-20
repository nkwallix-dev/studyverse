// Simulate the complete course through public controls, never teleporting Kenny.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { KennyWorld, STEP } = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const w = new KennyWorld();
const idle = { axis: 0, crouch: false, jump: false, jumpHeld: false, bite: false };
const trace = [];
function step(input = {}, frames = 1) {
  for (let i = 0; i < frames; i++) {
    w.step(STEP, { ...idle, ...input });
    trace.push({ input: { ...input } });
  }
}
function until(test, input, limit = 2000) {
  let i = 0;
  while (!test() && i++ < limit && !w.won) {
    step(typeof input === 'function' ? input() : input);
  }
  if (i >= limit) throw Error('stuck ' + JSON.stringify(w.player) + ' ' + w.hint);
}
function goto(x, crouch = false) {
  until(() => w.player.x >= x, { axis: 1, crouch });
}
function jumpTo(x) {
  step({});
  step({ axis: 1, jump: true, jumpHeld: true });
  until(() => w.player.x >= x, { axis: 1, jumpHeld: true }, 300);
}
function log(s) {
  console.log(
    s,
    Math.round(w.player.x),
    Math.round(w.player.y),
    w.checkpoint,
    w.runeProgress,
    w.deaths,
    w.elapsed.toFixed(1),
  );
}
step({}, 10);
goto(470);
jumpTo(700);
goto(1030);
log('gap');
goto(1205);
goto(1675, true);
goto(1688);
step({ axis: 1, bite: true });
goto(2000);
log('gate ' + w.switchOpen);
goto(2020);
jumpTo(2210);
goto(2330);
log('spikes');
// Catch each ferry, then use the permanent islands as safe waiting places.
const route = [
  { index: 10 },
  { index: 7 },
  { index: 11 },
  { index: 8 },
  { index: 12 },
  { index: 9 },
  { x: 3570 },
];
for (const destination of route) {
  const targetPlatform =
    destination.index === undefined ? w.platforms[2] : w.platforms[destination.index];
  const source = w.grounded;
  if (!source) throw Error('not grounded');
  until(() => w.player.x >= source.x + source.w - 45, { axis: 1 });
  until(
    () => {
      const future =
        targetPlatform.origin === undefined
          ? targetPlatform.x
          : targetPlatform.origin +
            Math.sin(((w.elapsed + 0.6) / targetPlatform.period) * Math.PI * 2) *
              targetPlatform.travel;
      return future - w.player.x < 155;
    },
    {},
    1200,
  );
  step({});
  step({ axis: 1, jump: true, jumpHeld: true });
  let f = 0;
  while ((f < 10 || !w.grounded) && f++ < 200) {
    const target = targetPlatform.x + Math.min(35, targetPlatform.w / 2);
    const d = target - w.player.x;
    step({ axis: Math.abs(d) > 5 ? Math.sign(d) : 0, jumpHeld: true });
  }
  log('island ' + JSON.stringify(destination));
  if (w.grounded !== targetPlatform) throw Error('wrong landing ' + JSON.stringify(w.player));
}
goto(3690);
log('ferries');
goto(3950);
step({ axis: 1, bite: true });
log('moon');
goto(4020);
jumpTo(4130);
until(() => !!w.grounded, {});
log('step');
goto(4180);
jumpTo(4300);
until(() => !!w.grounded, {});
goto(4320);
step({ axis: 1, bite: true });
log('fern');
goto(4390);
jumpTo(4620);
until(() => !!w.grounded, {});
goto(4620);
step({ axis: 1, bite: true });
log('sun');
goto(5120);
log('won ' + w.won);
assert(w.won, 'The course must be solvable through normal controls');
assert.equal(w.deaths, 0);
assert.equal(w.checkpoint, 3);
assert.equal(w.runeProgress, 3);
assert(w.switchOpen);
if (process.env.KENNY_TRACE) fs.writeFileSync(process.env.KENNY_TRACE, JSON.stringify(trace));

// Hazards return Kenny safely; independent runs and long frame deltas stay bounded.
const tunnel = new KennyWorld();
for (let i = 0; i < 1200; i++) tunnel.step(STEP, { ...idle, axis: 1 });
assert(tunnel.player.x < 520, 'Walking into the ravine must return to a checkpoint');
assert(tunnel.deaths > 0);
const reset = new KennyWorld();
reset.amber[0].collected = true;
reset.amberCount = 1;
reset.checkpoint = 2;
reset.switchOpen = true;
reset.runeProgress = 1;
reset.respawn();
assert.equal(reset.player.x, reset.checkpoints[2]);
assert.equal(reset.amberCount, 1);
assert.equal(reset.switchOpen, true);
assert.equal(reset.runeProgress, 1);
assert.equal(reset.health, 3);
const other = new KennyWorld();
assert.equal(other.amberCount, 0, 'Fresh expeditions must not share mutable state');
assert.equal(other.amber[0].collected, false);
assert.equal(other.switchOpen, false);
const suspended = new KennyWorld();
suspended.step(600, { ...idle, axis: 1 });
assert(suspended.elapsed <= STEP, 'Long deltas must be bounded');
console.log('Kenny platformer: full course, checkpoints, hazards and isolated runs passed.');

const jumper = new KennyWorld();
for (let i = 0; i < 10; i++) jumper.step(STEP, idle);
jumper.step(STEP, { ...idle, jump: true, jumpHeld: true });
for (let i = 0; i < 20; i++) jumper.step(STEP, { ...idle, jumpHeld: true });
const fallingVelocity = jumper.player.vy;
jumper.step(STEP, { ...idle, jump: true, jumpHeld: true });
assert(jumper.player.vy > fallingVelocity, 'A second airborne jump must not reset upward velocity');
const crawl = new KennyWorld();
crawl.player = { x: 1300, y: 418, w: 34, h: 32, vx: 0, vy: 0, facing: 1 };
crawl.step(STEP, idle);
assert.equal(crawl.player.h, 32, 'Kenny cannot stand inside the crawl tunnel');
crawl.player.x = 1200;
crawl.step(STEP, idle);
assert.equal(crawl.player.h, 60, 'Kenny can stand once the ceiling clears');
const fighter = new KennyWorld();
const armored = fighter.enemies[2];
fighter.player.x = armored.x - 45;
fighter.player.y = 390;
fighter.step(STEP, { ...idle, bite: true });
assert(armored.alive && armored.stun > 0, 'A frontal bite stuns the armored enemy');
for (let i = 0; i < 60; i++) fighter.step(STEP, idle);
armored.health = 1;
fighter.player.x = armored.x + armored.w + 10;
fighter.player.facing = -1;
fighter.step(STEP, { ...idle, bite: true });
assert.equal(armored.alive, false, 'A bite from behind defeats the armored enemy');
const temple = new KennyWorld();
temple.runeProgress = 1;
temple.player.x = temple.runes[2].x - 50;
temple.player.y = 295;
temple.step(STEP, { ...idle, bite: true });
assert.equal(temple.runeProgress, 0, 'Wrong rune order resets the puzzle');
console.log(
  'Kenny platformer: air-jump prevention, crawl clearance, armored bites and rune order passed.',
);
