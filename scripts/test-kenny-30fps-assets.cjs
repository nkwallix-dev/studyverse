const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'public/kenny/animations/manifest.json'), 'utf8'),
);
const contractPath = path.join(root, 'scripts/kenny-animation-contract.cjs');

assert.equal(manifest.fps, 30, 'animation playback must be authored at 30 FPS');
assert.equal(manifest.cell, 192, 'normalized atlas cells must be 192px square');
assert.equal(manifest.columns, 9, 'atlas must use nine consistent columns');
assert.equal(manifest.rows, 6, 'atlas must use six consistent rows');
assert.deepEqual(manifest.actions, {
  idle: { frames: 9, row: 0 },
  walk: { frames: 9, row: 5 },
  attack: { frames: 9, row: 2 },
  jump: { frames: 9, row: 4 },
  feed: {
    frames: 96,
    rows: [1, 2, 3],
    phases: {
      offscreen: [0, 11],
      enter: [12, 29],
      notice: [30, 41],
      catch: [42, 59],
      eat: [60, 77],
      recover: [78, 95],
    },
  },
});
assert.equal(fs.existsSync(contractPath), true, 'shared animation contract must exist');

const contract = require(contractPath);
assert.equal(contract.KENNY_ANIMATION_FPS, 30);
assert.equal(contract.KENNY_ACTIONS.feed.frames, 96);
assert.deepEqual(contract.KENNY_ACTIONS.feed.phases.enter, [12, 29]);
assert.equal(contract.frameAt(0.2667, 9), 8);
assert.equal(contract.frameAt(0.3, 9), 0, 'looping frame selection wraps at 30 FPS');

for (const skin of ['blue', 'green', 'red', 'pink', 'white']) {
  const atlas = path.join(root, 'public', 'kenny', 'atlases', `kenny-${skin}-30fps.png`);
  assert.equal(fs.existsSync(atlas), true, `${skin} 30 FPS atlas must exist`);
  const png = fs.readFileSync(atlas);
  assert.equal(png.readUInt32BE(16), 1728, `${skin} atlas must contain nine 192px columns`);
  assert.equal(png.readUInt32BE(20), 1152, `${skin} atlas must contain six 192px rows`);
}

console.log('KENNY 30 FPS CONTRACT PASS');
