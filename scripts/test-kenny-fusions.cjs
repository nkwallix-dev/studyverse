const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

require.extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    file,
  );

const { fusionRow, fusionColumn, atlasPosition } = require(
  '../src/app/features/dinoverse/platformer/kenny-platformer.fusion.ts',
);

const cases = [
  [null, null, null],
  ['triceratops-horns', null, 0],
  [null, 'triceratops-frill', 1],
  [null, 'stegosaurus-plates', 2],
  ['stegosaurus-spikes', null, 3],
  ['triceratops-horns', 'triceratops-frill', 4],
  ['triceratops-horns', 'stegosaurus-plates', 5],
  ['stegosaurus-spikes', 'triceratops-frill', 6],
  ['stegosaurus-spikes', 'stegosaurus-plates', 7],
];
for (const [offense, defense, expected] of cases)
  assert.equal(fusionRow(offense, defense), expected,
    `Unexpected 8×8 row for ${offense} / ${defense}`);

// Regression matrix: across all eight real fusion types, J is ALWAYS a bite.
for (const [offense, defense, row] of cases.filter((c) => c[2] !== null)) {
  for (const aim of [-1, 0, 1]) {
    const world = {
      offense, defense, biteTime: 0.19, biteAim: aim, attackTime: 0,
      attackKind: 'tail', player: { vx: 0, vy: 0 }, elapsed: 0,
    };
    const pose = fusionColumn(world, 'attack');
    assert.equal(pose, aim === 1 ? 6 : 5,
      `J with ${offense} / ${defense}, aim=${aim} must bite, not swing`);
    assert.notEqual(pose, 7, 'Tail-swing pose is never a J action');
    world.biteTime = 0;
    world.attackTime = 0.3;
    world.attackKind = offense === 'stegosaurus-spikes' ? 'tail' : 'charge';
    if (offense === 'stegosaurus-spikes')
      assert.equal(fusionColumn(world, 'attack'), 7,
        `L with ${offense} / ${defense} must swing tail`);
    else
      assert.notEqual(fusionColumn(world, 'attack'), 7,
        'Other L abilities must not borrow the tail-swing frame');
    for (const vy of [-120, 120]) {
      world.attackTime = 0;
      world.player.vy = vy;
      assert.equal(fusionColumn(world, 'jump'), 2, 'Jump arms stay canonical');
    }
  }
}


function sampleWorld() {
  return {
    biteTime: 0, biteAim: 0,
    attackTime: 0, attackKind: 'charge', elapsed: 0,
    player: { vx: 0, vy: 0 },
  };
}
const w = sampleWorld();
assert.equal(fusionColumn(w, 'idle'), 0);
w.elapsed = 0.12;
assert.equal(fusionColumn(w, 'walk'), 1);
w.biteTime = 0.2;
w.biteAim = 0;
assert.equal(fusionColumn(w, 'attack'), 5, 'Side bite must open the real mouth');
w.biteAim = -1;
assert.equal(fusionColumn(w, 'attack'), 5, 'Upward bite keeps feet planted and rotates the actual head');
w.biteAim = 1;
assert.equal(fusionColumn(w, 'attack'), 6, 'Downward bite uses low head pose');
w.biteAim = -1;
w.offense = 'stegosaurus-spikes';
w.defense = 'triceratops-frill';
assert.equal(fusionColumn(w, 'attack'), 5, 'W+J must bite UP in spikes + frill');
w.biteAim = 0;
assert.equal(fusionColumn(w, 'attack'), 5, 'Neutral J must bite in spikes + frill');
w.biteAim = 1;
w.offense = 'stegosaurus-spikes';
assert.equal(fusionColumn(w, 'attack'), 6, 'S+J must BITE DOWN even when tail spikes are equipped');
w.biteTime = 0;
w.attackTime = 0.6;
w.attackKind = 'tail';
assert.equal(fusionColumn(w, 'attack'), 7, 'Stego tail swing is animated');
w.defense = 'triceratops-frill';
assert.equal(fusionColumn(w, 'attack'), 7, 'Mixed spikes+frill keeps the real tail swing');
w.attackTime = 0;
w.biteTime = 0.14;
assert.equal(fusionColumn(w, 'attack'), 6, 'Mixed spikes+frill J must BITE, never swing');
w.biteTime = 0;
w.attackTime = 0.4;
w.attackKind = 'charge';
w.player.vx = 300;
assert.equal(fusionColumn(w, 'attack'), 2, 'Charge keeps the familiar arms, not flight pose');
w.attackTime = 0;
w.player.vy = 55;
assert.equal(fusionColumn(w, 'jump'), 2, 'Landing cannot show the clipped tail-swing frame');
w.player.vy = -55;
assert.equal(fusionColumn(w, 'jump'), 2, 'Jump keeps canonical clawed arms rather than the draft raised-arm pose');
assert.equal(atlasPosition(0, 0), '0.00000% 0.00000%');
assert.equal(atlasPosition(7, 7), '100.00000% 100.00000%');

const root = path.resolve(__dirname, '../public/kenny/animations/fusions');
for (const [name, w, h] of [
  ['blue.png', 1254, 1254],
  ['green.png', 1254, 1254],
  ['pink.png', 1254, 1254],
  ['red.png', 1254, 1254],
  ['zebra.png', 1254, 1254],
  ['stegosaurus-8poses.png', 1774, 887],
]) {
  const file = path.join(root, name);
  assert(fs.existsSync(file), `Missing production-ready atlas ${name}`);
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${name} must be a real PNG`);
  assert.equal(bytes.readUInt32BE(16), w, `${name} width`);
  assert.equal(bytes.readUInt32BE(20), h, `${name} height`);
  assert(bytes.length > 1_000_000, `Do not ship tiny placeholder art: ${name}`);
}
// Both source and production-polished atlases must be real raster sheets.
for (const name of ['blue', 'green', 'pink', 'red', 'zebra']) {
  const polished = path.join(root, name + '-polished.png');
  assert(fs.existsSync(polished), `Missing 64-pose polished atlas for ${name}`);
  const bytes = fs.readFileSync(polished);
  assert.equal(bytes.readUInt32BE(16), 1536, `${name} must have 192px cells`);
  assert.equal(bytes.readUInt32BE(20), 1536);
  assert(bytes.length > 1_000_000, 'Real cleaned sprite art, not placeholders');
}
// The old 1254px sources are retained; 1536px polished cells draw edge-to-edge.

const { drawKennyFusionCell } = require(
  '../src/app/features/dinoverse/platformer/kenny-fusion-frame.ts',
);
const drawn = [];
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: () => ({
    clearRect: () => undefined,
    drawImage: (...args) => drawn.push(args),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
  }),
};
drawKennyFusionCell(mockCanvas, { naturalWidth: 1254, naturalHeight: 1254 }, 5, 6);
assert.equal(mockCanvas.width, 192);
assert.equal(mockCanvas.height, 192);
assert.equal(drawn.length, 1);
assert.equal(drawn[0][1], 6 * (1254 / 8) + 8, 'crop away left neighbour');
assert.equal(drawn[0][3], (1254 / 8) - 16, 'crop away both adjacent cells');
drawn.length = 0;
drawKennyFusionCell(mockCanvas, { naturalWidth: 1536, naturalHeight: 1536 }, 7, 7);
assert.deepEqual(drawn[0].slice(1, 5), [7 * 192, 7 * 192, 192, 192],
  'Polished tail swipe must keep the full head AND every spike');


const { KennyWorld, STEP } = require(
  '../src/app/features/dinoverse/platformer/kenny-platformer.world.ts',
);
const sandbox = new KennyWorld();
sandbox.equipRun('triceratops-horns');
sandbox.equipRun('stegosaurus-plates');
const input = (extra = {}) => ({
  axis: 0, aim: 0, jump: false, jumpHeld: false, attack: false, ...extra,
});
sandbox.step(STEP, input({ discard: true }));
assert.equal(sandbox.offense, null, 'Q discards offensive gear first');
assert.equal(sandbox.defense, 'stegosaurus-plates', 'Q leaves the other slot alone');
assert.equal(sandbox.loot.length, 1);
assert.equal(sandbox.loot[0].receiptEligible, false, 'discard cannot farm achievements');
sandbox.step(STEP, input({ interact: true }));
assert.equal(sandbox.offense, 'triceratops-horns', 'E restores discarded gear');
assert.equal(sandbox.pickupEvents.length, 0, 're-pick of discarded item grants no receipt');
assert.equal(sandbox.pickupBursts.length, 1, 'equipping an item creates magical sparks');
sandbox.step(STEP, input({ discard: true }));
sandbox.step(STEP, input({ discard: true }));
assert.equal(sandbox.offense, null);
assert.equal(sandbox.defense, null, 'Q can discard shield when no offense is equipped');
assert.equal(sandbox.shield, 0, 'discarding shield removes shield hearts');
assert.equal(sandbox.loot.filter(drop => !drop.collected).length, 2);
console.log('FUSION ATLAS PASS: true preview cells, no atlas bleed, safe Q drops and pickup sparks.');
