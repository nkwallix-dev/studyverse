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
  seconds(w, 0.75);
  assert.equal(w.health, 2, 'tail range three');
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
  assert.equal(enemy.health, 3);
  assert(enemy.poison > 0);
  tail.player.x = 100;
  seconds(tail, 4.1);
  assert.equal(enemy.health, 2, 'one direct plus one total DOT');
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
