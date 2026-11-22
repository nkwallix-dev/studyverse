const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );
const m = require('../src/app/features/dinoverse/equipment/companion-equipment.model.ts');
const {
  KennyWorld,
  STEP,
} = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const item = m.COMPANION_ITEMS[0].id;
let state = m.normalizeCompanions(null);
for (let i = 0; i < 49; i++) state = m.recordPickup(state, 'test_' + i, item);
assert.equal(m.countItem(state, item), 49);
assert.equal(m.equipCompanion(state, item).equipped, null);
state = m.recordPickup(state, 'test_49', item);
assert.equal(m.countItem(state, item), 50);
assert.equal(m.equipCompanion(state, item).equipped, item);
state = m.recordPickup(state, 'test_49', item);
assert.equal(m.countItem(state, item), 50);
state = m.recordPickup(state, 'test_50', item);
assert.equal(m.countItem(state, item), 51);
state = { ...state, seen: [item] };
state = m.normalizeCompanions(JSON.parse(JSON.stringify(state)));
assert.deepEqual(state.seen, [item]);
const a = m.recordPickup(state, 'device_a', item),
  b = m.recordPickup(state, 'device_b', item);
assert.equal(m.countItem(m.mergeCompanions(a, b), item), 53);
assert.deepEqual(m.mergeCompanions(a, b), m.mergeCompanions(b, a));
assert.equal(m.equipCompanion(m.equipCompanion(state, item), null).equipped, null);
for (const species of ['triceratops', 'stegosaurus']) {
  assert.equal(m.dropsFor(species, 'basic').length, 0);
  assert.equal(m.dropsFor(species, 'medium', () => 0).length, 1);
  assert.notEqual(
    m.dropsFor(species, 'medium', () => 0)[0],
    m.dropsFor(species, 'medium', () => 0.99)[0],
  );
  assert.equal(new Set(m.dropsFor(species, 'elite')).size, 2);
}
const w = new KennyWorld(item);
assert(w.fusions.has(item));
const idle = { axis: 0, aim: 0, jump: false, jumpHeld: false, attack: false };
const enemy = w.enemies[1];
enemy.health = 1;
w.player.x = enemy.x - 55;
w.step(STEP, { ...idle, attack: true });
for (let i = 0; i < 60 && enemy.alive; i++) w.step(STEP, idle);
assert.equal(w.loot.length, 1);
assert.equal(w.pickupEvents.length, 0, 'Defeating an enemy is not a pickup');
w.player.x = w.loot[0].x;
w.step(STEP, idle);
assert.equal(w.pickupEvents.length, 0, 'Collision alone does not pick up items');
w.step(STEP, { ...idle, interact: true });
assert.equal(w.pickupEvents.length, 1);
for (let i = 0; i < 10; i++) w.step(STEP, idle);
assert.equal(w.pickupEvents.length, 1, 'Collision cannot duplicate a pickup');
assert.equal(new KennyWorld().fusions.size, 0, 'Run fusion must not leak into next run');
assert.equal(w.enemies[0].health, 2);
assert.equal(w.enemies[2].health, 7);

const { COMPANION_SKILL_TREE, skillUnlocked } = require(
  '../src/app/features/dinoverse/equipment/companion-skill-tree.ts',
);
const nodeById = (id) => COMPANION_SKILL_TREE.find((node) => node.id === id);
let comboState = m.normalizeCompanions(null);
const fullStego = nodeById('full-stego');
for (let i = 0; i < 24; i++)
  comboState = m.recordFusionRun(comboState, 'stego_test_run_' + i, 'full-stego');
assert.equal(m.countFusionRuns(comboState, 'full-stego'), 24);
assert.equal(skillUnlocked(comboState, fullStego), false, '24/25 runs stays locked');
comboState = m.recordFusionRun(comboState, 'stego_test_run_24', 'full-stego');
comboState = m.recordFusionRun(comboState, 'stego_test_run_24', 'full-stego');
assert.equal(m.countFusionRuns(comboState, 'full-stego'), 25, 'same run cannot be farmed');
assert.equal(skillUnlocked(comboState, fullStego), true, '25 runs unlock complete Stego');
const fullKit = m.equipCompanionKit(comboState, fullStego.slots);
assert.deepEqual(fullKit.equippedSlots, fullStego.slots,
  'Completed run achievement allows dual starter kit even without 50 solo pickups');
assert.equal(m.equipCompanion(comboState, 'stegosaurus-spikes').equipped, null,
  'Run achievements do not bypass single-item 50 pickup requirement');
let hybrid = m.normalizeCompanions(null);
for (let i = 0; i < 9; i++)
  hybrid = m.recordFusionRun(hybrid, 'hybrid_run_' + i, 'spikes-frill');
assert(!skillUnlocked(hybrid, nodeById('spikes-frill')), '9/10 hybrid remains locked');
hybrid = m.recordFusionRun(hybrid, 'hybrid_run_9', 'spikes-frill');
assert(skillUnlocked(hybrid, nodeById('spikes-frill')), '10/10 hybrid unlocks');
const mergedHybrid = m.mergeCompanions(
  m.recordFusionRun(null, 'hybrid_device_a', 'horns-plates'),
  m.recordFusionRun(null, 'hybrid_device_b', 'horns-plates'),
);
assert.equal(m.countFusionRuns(mergedHybrid, 'horns-plates'), 2,
  'Distinct local and remote runs must survive cloud merge');
assert.deepEqual(
  m.mergeCompanions(mergedHybrid, comboState).fusionRuns,
  m.mergeCompanions(comboState, mergedHybrid).fusionRuns,
  'Cloud merge must be deterministic and commutative for combo runs',
);
const runWorld = new KennyWorld(fullStego.slots, { expedition: true, random: () => 0.7 });
runWorld.enemies.length = 0;
runWorld.step(STEP, idle);
assert.equal(runWorld.fusionRunEvents.length, 1, 'Starter combo counts when a real run begins');
runWorld.step(STEP, idle);
assert.equal(runWorld.fusionRunEvents.length, 1, 'No repeated credit per tick');
runWorld.discardEquipped();
runWorld.step(STEP, idle);
runWorld.equipRun('stegosaurus-spikes');
runWorld.step(STEP, idle);
assert.equal(runWorld.fusionRunEvents.length, 1, 'Q and re-equipping cannot farm one run');
const practice = new KennyWorld(fullStego.slots);
practice.step(STEP, idle);
assert.equal(practice.fusionRunEvents.length, 0, 'Tutorial/practice must not count toward fusion goals');
console.log('Fusion runs: 25 complete/10 hybrid, one receipt per real run, cloud merge and atomic kit passed.');
console.log(
  'Companion equipment: thresholds, deduplication, merge, persistence, equipment and real pickups passed.',
);

// Mock the Firestore REST boundary: retries merge into the latest remote profile.
(async () => {
  const { StudyverseCloud } = require('../src/app/cloud.ts');
  const cloud = new StudyverseCloud();
  cloud.config = { apiKey: 'test-only-api-key', projectId: 'test-project' };
  cloud.session = {
    uid: 'test-user',
    username: 'test',
    idToken: 'fixture',
    refreshToken: 'fixture',
    expiresAt: Date.now() + 3600000,
  };
  let remote = {
    version: 1,
    profile: {
      tokens: 987,
      xp: 456,
      inventory: ['existing'],
      companions: m.recordAmber(m.recordPickup(null, 'remote_one', item), 'remote_amber'),
    },
    trainers: { existing: { done: true } },
  };
  let revision = 1,
    writes = 0;
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    assert(String(url).startsWith('https://firestore.googleapis.com/'));
    if (!init.method)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          updateTime: 'rev' + revision,
          fields: { profile: { stringValue: JSON.stringify(remote) } },
        }),
      };
    assert.equal(init.method, 'PATCH');
    assert(String(url).includes('currentDocument.updateTime=rev' + revision));
    if (writes++ === 0) {
      remote.profile.companions = m.recordPickup(remote.profile.companions, 'remote_two', item);
      remote.profile.tokens = 999;
      revision++;
      return { ok: false, status: 412 };
    }
    remote = JSON.parse(JSON.parse(init.body).fields.profile.stringValue);
    revision++;
    return { ok: true, status: 200 };
  };
  try {
    const snapshot = {
      version: 1,
      profile: {
        tokens: 1,
        xp: 1,
        companions: m.recordAmber(m.recordPickup(null, 'local_one', item), 'local_amber'),
      },
      trainers: {},
    };
    await cloud.save(snapshot, true);
    assert.equal(remote.profile.tokens, 999, 'Companion writes preserve the latest wallet');
    assert.equal(remote.profile.xp, 456);
    assert.deepEqual(remote.profile.inventory, ['existing']);
    assert.deepEqual(remote.trainers, { existing: { done: true } });
    assert.equal(m.countItem(remote.profile.companions, item), 3);
    assert.equal(m.amberTotal(remote.profile.companions), 2);
    assert.equal(writes, 2, 'Precondition conflict retries against latest remote state');
    console.log(
      'Companion cloud: conflict retry, merged pickups and unchanged remote wallet/trainers passed.',
    );
  } finally {
    global.fetch = originalFetch;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
