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
w.biteTime = 0;
w.attackTime = 0.6;
w.attackKind = 'tail';
assert.equal(fusionColumn(w, 'attack'), 7, 'Stego tail swing is animated');
w.defense = 'triceratops-frill';
assert.equal(fusionColumn(w, 'attack'), 5, 'Mixed spikes+frill never loses its neck shield on swing');
w.attackTime = 0;
w.player.vy = 55;
assert.equal(fusionColumn(w, 'jump'), 2, 'Landing cannot show the clipped tail-swing frame');
w.player.vy = -55;
assert.equal(fusionColumn(w, 'jump'), 3, 'Jumping uses the intact airborne frame');
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
// The 8px inset must crop adjacent atlas cells without changing the rendered footprint.
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
