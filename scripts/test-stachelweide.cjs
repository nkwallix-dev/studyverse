const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  ts = require('typescript');
require.extensions['.ts'] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    f,
  );
const {
  KennyWorld,
  STEP,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const {
  BALANCE,
  FIELD,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.balance.ts');
const { reaches } = require('../src/app/features/dinoverse/platformer/kenny-platformer.combat.ts');
const idle = {
  axis: 0,
  aim: 0,
  jump: false,
  jumpHeld: false,
  attack: false,
  special: false,
  interact: false,
};
function ticks(w, n, input = idle) {
  for (let i = 0; i < n; i++) w.step(STEP, input);
}
const w = new KennyWorld();
w.player.x = 40;
w.step(STEP, { ...idle, special: true });
while (w.attackTime > 0) w.step(STEP, { ...idle, axis: -1 });
assert(Math.abs(w.player.x - 40 - 3 * FIELD) < 3);
assert(w.specialCooldown > 2);
const bite = new KennyWorld();
const e = bite.enemies[1];
bite.player.x = e.x - 55;
bite.step(STEP, { ...idle, attack: true });
assert.equal(e.health, 3);
assert.equal(bite.attackTime, 0);
assert.equal(bite.biteTime, BALANCE.bite.duration);
const reach = { x: 0, y: 0, w: 34, h: 60 };
assert(reaches(reach, { x: 34 + 3 * FIELD, y: 0, w: 80, h: 60 }, 3, 1));
assert(!reaches(reach, { x: 35 + 3 * FIELD, y: 0, w: 80, h: 60 }, 3, 1));
assert(
  !reaches(
    { x: 100, y: 295, w: 34, h: 60 },
    { x: 130, y: 380, w: 140, h: 70 },
    3,
    1,
  ),
  'A horizontal tail sweep cannot hit Kenny standing safely on a platform above',
);
const pogo = new KennyWorld();
const target = pogo.enemies[1];
pogo.player.x = target.x;
pogo.player.y = target.y - 130;
pogo.grounded = undefined;
pogo.step(STEP, { ...idle, aim: 1, special: true });
ticks(pogo, 12);
assert.equal(target.health, 2);
assert(pogo.player.vy < -500, 'Downward leap bounces by two fields');
console.log('Stage 1 PASS: J bite, L leap damage/cooldown, field ranges, movement lock and pogo.');
module.exports = { ticks, idle, KennyWorld, STEP, BALANCE, FIELD };
const m = require('../src/app/features/dinoverse/equipment/companion-equipment.model.ts');
const dual = new KennyWorld({ offense: 'stegosaurus-spikes', defense: 'triceratops-frill' });
assert.equal(dual.shield, 2);
dual.hurt(dual.enemies[0], 1);
assert.equal(dual.health, 3);
assert.equal(dual.shield, 1);
dual.invulnerable = 0;
dual.hurt(dual.enemies[0], 1);
assert.equal(dual.defense, null);
assert.equal(dual.offense, 'stegosaurus-spikes');
dual.respawn();
assert.equal(dual.defense, null, 'Consumed shields do not respawn at checkpoints');
dual.equipRun('stegosaurus-plates');
dual.invulnerable = 0;
dual.hurt(dual.enemies[0], 1);
assert.equal(dual.shield, 0);
dual.sinceDamage = 7.99;
dual.step(STEP, idle);
assert.equal(dual.shield, 0);
dual.step(STEP, idle);
assert.equal(dual.shield, 1);
dual.invulnerable = 0;
dual.hurt(dual.enemies[0], 2);
assert.equal(dual.shield, 0);
assert.equal(dual.health, 2);
assert.equal(dual.sinceDamage, 0);
const pickup = new KennyWorld();
pickup.loot.push({
  id: 'receipt',
  item: 'triceratops-horns',
  x: 95,
  y: 410,
  w: 22,
  h: 22,
  collected: false,
});
pickup.step(STEP, idle);
assert.equal(pickup.pickupEvents.length, 0);
pickup.step(STEP, { ...idle, interact: true });
assert.equal(pickup.pickupEvents.length, 1);
pickup.step(STEP, { ...idle, interact: true });
assert.equal(pickup.pickupEvents.length, 1);
let state = m.normalizeCompanions(null);
for (const item of ['triceratops-horns', 'stegosaurus-plates'])
  for (let i = 0; i < 50; i++) state = m.recordPickup(state, item + '_' + i, item);
state = m.equipCompanion(state, 'triceratops-horns');
state = m.equipCompanion(state, 'stegosaurus-plates');
assert(state.equippedSlots.offense && state.equippedSlots.defense);
state = m.equipCompanion(state, null, 'offense');
assert.equal(state.equippedSlots.offense, null);
assert.equal(state.equippedSlots.defense, 'stegosaurus-plates');
state = m.recordAmber(state, 'amber_one');
state = m.recordAmber(state, 'amber_one');
assert.equal(m.amberTotal(state), 1);
const left = m.recordAmber(state, 'device_a'),
  right = m.recordAmber(state, 'device_b');
assert.equal(m.amberTotal(m.mergeCompanions(left, right)), 3);
console.log(
  'Stage 2 PASS: independent slots, legacy-safe persistence, E pickups, shield depletion/regeneration and amber deduplication.',
);

function seconds(w, s, input = idle) {
  ticks(w, Math.round(s / STEP), input);
}
// Front-facing acquisition, retained pursuit, disengagement and return.
{
  const w = new KennyWorld();
  const e = w.enemies[0];
  w.enemies.splice(1);
  e.x = 900;
  e.direction = 1;
  w.player.x = 750;
  seconds(w, 0.1);
  assert.equal(e.alerted, false, 'behind enemy is hidden');
  w.player.x = 1100;
  seconds(w, STEP);
  assert.equal(e.alerted, true);
  w.player.x = 1500;
  seconds(w, 0.1);
  assert.equal(e.alerted, true, 'keep target beyond initial sight');
  w.player.x = 2300;
  seconds(w, STEP);
  assert.equal(e.alerted, false);
  assert.equal(e.returning, true);
  w.player.x = 4000;
  seconds(w, 5);
  assert.ok(e.x >= e.min && e.x <= e.max, 'returned to patrol');
}
// Triceratops visibly prepares for 2 sec, then runs 4 fields; body vs charge damage.
{
  const w = new KennyWorld();
  const e = w.enemies[0];
  w.enemies.splice(1);
  e.x = 850;
  e.direction = 1;
  w.player.x = 1000;
  seconds(w, STEP);
  assert.ok(e.attackTime > 2);
  const x = e.x;
  seconds(w, 1.99);
  assert.equal(e.x, x, 'windup is stationary');
  assert.equal(w.health, 3);
  seconds(w, 0.6);
  assert.ok(Math.abs(e.x - x - 4 * FIELD) < 0.01);
  assert.equal(w.health, 1, 'charge hits for two');
  const contact = new KennyWorld();
  const c = contact.enemies[0];
  contact.enemies.splice(1);
  contact.player.x = c.x;
  seconds(contact, STEP);
  assert.equal(contact.health, 2);
}
{
  const w = new KennyWorld();
  const e = w.enemies[2];
  w.enemies.splice(0, 2);
  e.direction = -1;
  w.player.x = e.x - 120;
  w.player.y = 390;
  w.equipRun('triceratops-frill'); // A three-heart tail sweep must consume shields first.
  seconds(w, 0.75);
  assert.equal(w.health, 3, 'stego tail damages the shield for one heart');
  assert.equal(w.shield, 1);
  assert.ok(e.direction === 1, 'turned for tail');
  // Poison ticks exactly four times without affecting other actors.
  e.health = 7;
  e.poison = 4;
  e.poisonTick = 1;
  e.attackTime = 0;
  w.player.x = 100;
  seconds(w, 4.01);
  assert.equal(e.health, 6);
  // No running over the edge of the large pit.
  e.x = 2427;
  e.y = 380;
  e.alerted = true;
  e.attackTime = 0;
  e.attackCooldown = 100;
  e.direction = 1;
  w.player.x = 3000;
  seconds(w, 2);
  assert.ok(e.x + e.w <= 2540);
}
console.log(
  'Stage 3 PASS: directional sight, pursuit/return, 2s charge/4-field travel, damage, tail/DOT and pit edges.',
);

// Player fusion abilities share fixed fields/timings and do not extend range by moving.
{
  const charge = new KennyWorld('triceratops-horns');
  charge.player.x = 40;
  charge.enemies.length = 0;
  charge.step(STEP, { ...idle, special: true });
  seconds(charge, 1.99, { ...idle, axis: -1 });
  assert.equal(charge.player.x, 40);
  while (charge.attackTime > 0) charge.step(STEP, { ...idle, axis: -1 });
  assert(Math.abs(charge.player.x - 40 - 4 * FIELD) < 0.001);
  assert(charge.specialCooldown > 1);
  assert.equal(charge.player.facing, 1);
  const tail = new KennyWorld('stegosaurus-spikes');
  const enemy = tail.enemies[1];
  tail.enemies.splice(0, 1);
  tail.enemies.splice(1);
  tail.player.x = enemy.x - 110;
  tail.step(STEP, { ...idle, special: true });
  seconds(tail, 0.65);
  assert.equal(enemy.health, 1);
  assert(enemy.poison > 0);
  tail.player.x = 100;
  seconds(tail, 4.1);
  assert.equal(enemy.health, 0, 'three direct plus one total DOT');
  const bounded = new KennyWorld();
  const target = bounded.enemies[1];
  bounded.player.x = target.x - target.w - 200;
  const original = target.health;
  bounded.step(STEP, { ...idle, special: true });
  seconds(bounded, 0.55);
  assert.equal(target.health, original, 'moving leap cannot extend initial three-field reach');
}
// Damage after seven seconds restarts plate regeneration; consumption never erases receipts.
{
  const w = new KennyWorld('stegosaurus-plates');
  w.hurt(w.enemies[0], 1);
  seconds(w, 7);
  w.invulnerable = 0;
  w.hurt(w.enemies[0], 1);
  seconds(w, 1.1);
  assert.equal(w.shield, 0);
  seconds(w, 6.91);
  assert.equal(w.shield, 1);
  const legacy = m.normalizeCompanions({
    ...state,
    equippedSlots: undefined,
    slotUpdatedAt: undefined,
    equipped: 'stegosaurus-plates',
    equippedAt: 10,
  });
  assert.equal(legacy.equippedSlots.defense, 'stegosaurus-plates');
  const left = m.equipCompanion(state, 'triceratops-horns'),
    right = m.equipCompanion(state, 'stegosaurus-plates');
  assert.equal(m.mergeCompanions(left, right).equippedSlots.offense, 'triceratops-horns');
}
console.log(
  'Integration PASS: player charge/tail, origin range cap, regen timer reset and dual-slot migration.',
);
// A late pogo must keep its full two-field height after the attack animation ends.
{
  const w = new KennyWorld();
  const enemy = w.enemies[1];
  enemy.x = 1000;
  w.player.x = 1000;
  w.player.y = 260;
  w.grounded = undefined;
  w.step(STEP, { ...idle, special: true, aim: 1 });
  w.attackTime = 0.15;
  w.attackLaunched = true;
  w.step(STEP, idle);
  assert(w.player.vy < -500);
  const origin = w.player.y;
  let peak = origin;
  for (let i = 0; i < 60; i++) {
    w.step(STEP, idle);
    peak = Math.min(peak, w.player.y);
  }
  assert(Math.abs(origin - peak - 2 * FIELD) < 3, 'Releasing Space cannot cut the pogo short');
}
console.log('Pogo PASS: full two-field bounce survives late hits and released jump input.');

// Expedition mode is intentionally different from the legacy course replay:
const randomExpedition = new KennyWorld(null, { expedition: true, random: () => 0.05 });
assert.equal(randomExpedition.enemies.length, 20, 'Each new expedition has 20 enemy encounters');
assert.equal(randomExpedition.enemies.filter((enemy) => enemy.tier === 'elite').length, 1);
assert.equal(randomExpedition.enemies[0].species, 'stegosaurus');
assert.equal(randomExpedition.enemies[0].health, 7);
assert.equal(randomExpedition.enemies[1].tier, 'medium', 'No second elite can appear');
assert(randomExpedition.platforms.length > w.platforms.length, 'Expedition adds vertical routes');
const basicExpedition = new KennyWorld(null, { expedition: true, random: () => 0.99 });
assert.equal(basicExpedition.enemies.filter((enemy) => enemy.tier === 'elite').length, 0);
assert(basicExpedition.enemies.every((enemy) => enemy.species === 'triceratops'));
assert(basicExpedition.enemies.every((enemy) => enemy.health === 2));
basicExpedition.enemies.length = 0;
basicExpedition.player.x = 685;
basicExpedition.player.y = 480;
basicExpedition.step(STEP, idle);
assert.equal(basicExpedition.dead, true, 'Falling into a hazard ends the full expedition');
assert.equal(basicExpedition.deaths, 1);
const atDeath = basicExpedition.elapsed;
basicExpedition.step(STEP, idle);
assert.equal(basicExpedition.elapsed, atDeath, 'A dead run must not continue');
const freshExpedition = new KennyWorld(null, { expedition: true, random: () => 0.99 });
assert.equal(freshExpedition.dead, false);
assert.equal(freshExpedition.health, 3);
assert.equal(freshExpedition.checkpoint, 0);
assert.equal(freshExpedition.amberCount, 0);
assert.notEqual(freshExpedition.runId, basicExpedition.runId);
console.log('Expedition PASS: 20 randomized enemies, independent species/tier, one elite max and full restart after death.');

// Daily map amber receipts persist across fresh runs and are scoped to each calendar day.
const day1 = new KennyWorld(null, { expedition: true, amberDay: '2026-11-20', random: () => 0.99 });
day1.enemies.length = 0;
day1.player.x = 300;
day1.player.y = 265;
day1.step(STEP, idle);
assert(day1.amberEvents.includes('stachelweide_2026-11-20_map_0'));
const receipt = { 'stachelweide_2026-11-20_map_0': true };
const repeated = new KennyWorld(null, {
  expedition: true, amberDay: '2026-11-20', claimedAmber: receipt, random: () => 0.99,
});
assert(repeated.amber[0].collected, 'A map crystal cannot respawn after a new run on the same day');
const tomorrow = new KennyWorld(null, {
  expedition: true, amberDay: '2026-11-21', claimedAmber: receipt, random: () => 0.99,
});
assert(!tomorrow.amber[0].collected, 'A new calendar day unlocks new map amber');

// Enemy tiers determine amber volume, with physical crystals collectible near the kill site.
for (const [tier, amount, rng] of [
  ['basic', 1, 0],
  ['basic', 2, 0.99],
  ['medium', 2, 0],
  ['medium', 4, 0.99],
  ['elite', 6, 0.5],
]) {
  const run = new KennyWorld(null, { random: () => rng });
  const enemy = run.enemies[0];
  enemy.tier = tier;
  enemy.health = 1;
  run.hitEnemy(enemy, 1);
  assert.equal(run.enemyAmberDrops.length, amount, tier + ' amber drop count');
  assert(run.enemyAmberDrops.every(drop => !drop.collected));
  run.enemies.length = 0;
  run.player.x = run.enemyAmberDrops[0].x;
  run.player.y = run.enemyAmberDrops[0].y - 10;
  run.step(STEP, idle);
  assert(run.amberEvents.some(id => id.includes('_enemy_')), 'Enemy amber can be collected');
}

// Every successful player special stuns its target for a full second, blocking
// immediate body contact during a special attack overlap.
const specialStun = new KennyWorld();
const stunnedEnemy = specialStun.enemies[0];
stunnedEnemy.health = 4;
specialStun.player.x = stunnedEnemy.x - 50;
specialStun.player.y = stunnedEnemy.y;
specialStun.attackKind = 'tail';
specialStun.attackFacing = 1;
specialStun.attackOrigin = { ...specialStun.player };
specialStun.specialStrike();
assert.equal(stunnedEnemy.stun, BALANCE.specialStun);
assert(specialStun.invulnerable >= BALANCE.specialStun);
const stunExpiry = stunnedEnemy.stun;
specialStun.step(STEP, idle);
assert(stunnedEnemy.stun < stunExpiry);
const enemySpecial = new KennyWorld();
enemySpecial.hurt(enemySpecial.enemies[0], 2, true);
assert.equal(enemySpecial.playerStun, BALANCE.specialStun);
const charged = new KennyWorld();
charged.hurt(charged.enemies[0], 2, 'charge');
assert.equal(charged.playerStun, BALANCE.triceratopsStun, 'Trike charge stun lasts 3 seconds');
const bleeding = new KennyWorld();
bleeding.hurt(bleeding.enemies[2], 1, 'tail');
bleeding.bleedRemaining = BALANCE.stegoBleed.duration;
bleeding.bleedTick = BALANCE.stegoBleed.tick;
bleeding.enemies.length = 0;
assert.equal(bleeding.health, 2);
seconds(bleeding, 4.01);
assert.equal(bleeding.health, 1, 'bleed does four 0.25-heart ticks');
console.log('Amber/Stun PASS: daily map receipts, tier ranges, physical drops, 1s special stun.');

const expanded = new KennyWorld(null, { expedition: true, random: () => 0.99 });
assert(expanded.width >= 10000, 'The Pangaea expedition must actually be wider than legacy');
assert(expanded.platforms.filter(platform => platform.oneWay).length >= 15);
assert.equal(expanded.amber.length, 23, 'All daily map crystals are preserved');
const available = expanded.platforms;
for (const crystal of expanded.amber) {
  const support = available.find(platform =>
    crystal.x >= platform.x && crystal.x <= platform.x + platform.w &&
    platform.y - crystal.y >= 20 && platform.y - crystal.y <= 75
  );
  assert(support, 'Every crystal must be positioned above a reachable platform: ' + JSON.stringify(crystal));
}
const nearby = [...expanded.enemies].sort((a,b)=>a.x-b.x);
assert(nearby.every((enemy,i) => i===0 || enemy.x-nearby[i-1].x >= 150),
  'Enemies must have real breathing room across the expanded map');
const upperLane = new KennyWorld(null, { expedition: true, random: () => 0.99 });
upperLane.enemies.splice(1);
const firstEnemy = upperLane.enemies[0];
firstEnemy.direction = 1;
upperLane.player.x = firstEnemy.x + 125;
upperLane.player.y = 225;
seconds(upperLane, 0.5);
assert.equal(firstEnemy.alerted, false, 'Dinos must not chase Kenny onto an unreachable higher ledge');
upperLane.player.y = 390;
seconds(upperLane, STEP);
assert.equal(firstEnemy.alerted, true, 'Normal same-lane pursuit must still work');
upperLane.player.y = 225;
seconds(upperLane, STEP);
assert.equal(firstEnemy.alerted, false, 'Pursuit drops immediately after a level change');
const falling = new KennyWorld(null, { expedition: true, random: () => 0.99 });
falling.enemies.splice(1);
const fallingDino = falling.enemies[0];
fallingDino.x = 667;
fallingDino.y = 330;
fallingDino.vy = 0;
fallingDino.attackTime = 0;
fallingDino.attackCooldown = 99;
fallingDino.direction = 1;
fallingDino.alerted = false;
fallingDino.min = 640;
fallingDino.max = 760;
fallingDino.originX = 667;
seconds(falling, 0.7);
assert.equal(fallingDino.alive, false, 'Enemies entering the lava gap must die');
console.log('Pangaea PASS: expanded map, reachable crystals, level-aware pursuit, spread spawns and lava deaths.');

