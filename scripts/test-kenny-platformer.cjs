// Simulate the complete course through public controls, never teleporting Kenny.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );
const {
  KennyWorld,
  STEP,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const w = new KennyWorld();
const idle = { axis: 0, aim: 0, jump: false, jumpHeld: false, attack: false };
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
function goto(x) {
  until(() => w.player.x >= x, { axis: 1 });
}
function attack() {
  step({ attack: true });
  until(() => w.attackTime === 0, {});
  until(() => !!w.grounded, {});
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
goto(1675);
goto(1688);
attack();
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
  if (w.grounded !== targetPlatform && targetPlatform.origin === undefined) {
    // An overlapping ferry can catch the player just above a fixed island.
    // Hold position over the island until the ferry moves away underneath.
    until(
      () => w.grounded === targetPlatform,
      () => {
        const d = targetPlatform.x + 35 - w.player.x;
        return { axis: Math.abs(d) > 5 ? Math.sign(d) : 0 };
      },
      1200,
    );
  }
  if (w.grounded !== targetPlatform) throw Error('wrong landing ' + JSON.stringify(w.player));
}
goto(3690);
log('ferries');
goto(3950);
attack();
log('moon');
until(() => w.player.x <= 4020, { axis: -1 });
step({}, 20);
jumpTo(4130);
until(() => !!w.grounded, {});
log('step');
goto(4180);
jumpTo(4300);
until(() => !!w.grounded, {});
goto(4320);
attack();
log('fern');
goto(4390);
jumpTo(4620);
until(() => !!w.grounded, {});
goto(4620);
attack();
log('sun');
goto(5120);
log('won ' + w.won);
assert(w.won, 'The course must be solvable through normal controls');
assert(w.deaths <= 2, 'The stronger three-heart tail sweep allows at most two route resets');
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
const aimer = new KennyWorld();
for (let i = 0; i < 10; i++) aimer.step(STEP, idle);
const height = aimer.player.h,
  y = aimer.player.y;
for (const aim of [-1, 1]) {
  aimer.step(STEP, { ...idle, aim });
  assert.equal(aimer.player.h, height, 'Aiming cannot shrink Kenny');
  assert.equal(aimer.player.y, y, 'Aiming cannot jump or move Kenny vertically');
  assert.equal(aimer.aim, aim);
}
const {
  ATTACK_DISTANCE,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const lunge = new KennyWorld();
lunge.player.x = 40;
for (let i = 0; i < 10; i++) lunge.step(STEP, idle);
const origin = lunge.player.x;
lunge.step(STEP, { ...idle, special: true });
let frames = 0;
while (lunge.attackTime > 0 && frames++ < 100) {
  lunge.step(STEP, { ...idle, axis: -1, aim: -1, jump: true, jumpHeld: true });
  assert.equal(lunge.player.facing, 1, 'A/D cannot turn Kenny during a committed attack');
  assert.equal(lunge.attackAim, 0, 'Aim is latched when the attack begins');
}
assert(frames < 100);
assert(
  Math.abs(lunge.player.x - origin - ATTACK_DISTANCE) < 0.01,
  'A lunge travels the same distance regardless of held A/D',
);
lunge.step(STEP, { ...idle, axis: -1 });
assert.equal(lunge.player.facing, -1, 'Normal controls return after attack recovery');
const fighter = new KennyWorld();
const target = fighter.enemies[1];
fighter.player.x = target.x - 55;
fighter.step(STEP, { ...idle, attack: true });
for (let i = 0; i < 55; i++) fighter.step(STEP, idle);
assert.equal(
  target.health,
  3,
  'Only one damage event per enemy per attack, not one each collision tick',
);
const stego = new KennyWorld('triceratops-frill');
const armored = stego.enemies[2];
stego.player.x = armored.x - 120;
stego.step(STEP, idle);
assert(armored.attackTime > 0, 'A nearby Stegosaurus prepares its tail attack');
for (let i = 0; i < 65; i++) stego.step(STEP, idle);
assert.equal(
  armored.direction,
  -armored.attackFacing,
  'Stegosaurus turns away before its tail strikes',
);
assert(armored.tailHit, 'The tail sweep has a collision window on the target side');
assert.equal(stego.health, 2, 'A sweep damages Kenny once');
const {
  playerAnimation,
  enemyAnimation,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.animation.ts');
assert.equal(playerAnimation(aimer).motion, 'idle');
aimer.player.vx = 280;
assert.equal(playerAnimation(aimer).motion, 'walk');
aimer.grounded = undefined;
assert.equal(playerAnimation(aimer).motion, 'jump');
aimer.attackTime = 0.3;
assert.equal(playerAnimation(aimer).motion, 'attack');
assert.equal(enemyAnimation(armored, 0).animation, 'attack');
console.log(
  'Kenny platformer: aim-only W/S, fixed lunge, movement lock, single-hit damage, tail sweep and animation states passed.',
);

for (const aim of [-1, 1]) {
  const directed = new KennyWorld();
  directed.player.x = 100;
  directed.player.y = 200;
  directed.grounded = undefined;
  const enemy = directed.enemies[0];
  enemy.x = 110;
  enemy.y = aim < 0 ? 115 : 270;
  enemy.min = 110;
  enemy.max = 111;
  directed.step(STEP, { ...idle, aim, attack: true });
  for (let i = 0; i < 30; i++) directed.step(STEP, idle);
  assert.equal(enemy.health, 1, 'Aimed bites reach targets ' + (aim < 0 ? 'above' : 'below'));
}
console.log('Kenny platformer: up/down aimed attack hitboxes reach their intended targets.');

const outsideTail = new KennyWorld();
const outsideStego = outsideTail.enemies[2];
outsideTail.player.x = outsideStego.x - 34 - 3 * 50 - 1;
outsideStego.direction = -1;
outsideStego.alerted = true;
outsideStego.attackTime = 0.8;
outsideStego.attackFacing = -1;
outsideTail.step(STEP, idle);
assert(outsideStego.attackTime > 0, 'Stegosaurus can telegraph while Kenny is nearby');
for (let i = 0; i < 65; i++) outsideTail.step(STEP, idle);
assert.equal(outsideTail.health, 3, 'A tail sweep must miss Kenny outside its three-field range');
console.log('Stegosaurus: tail hits match sprite reach, with a safe miss outside the arc.');
