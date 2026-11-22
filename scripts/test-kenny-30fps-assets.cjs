const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'public/kenny/animations/manifest.json'), 'utf8'),
);
const contractPath = path.join(root, 'scripts/kenny-animation-contract.cjs');

assert.equal(manifest.fps, 30, 'animation playback must be authored at 30 FPS');
assert.deepEqual(manifest.actions, {
  idle: { frames: 48 },
  walk: { frames: 12 },
  attack: { frames: 12 },
  jump: { frames: 18 },
  feed: {
    frames: 96,
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
assert.equal(contract.frameAt(0.4, 12), 0);
assert.equal(contract.frameAt(0.4334, 12), 1);
assert.equal(contract.frameAt(1.2, 12), 0, 'looping frame selection wraps at 30 FPS');

console.log('KENNY 30 FPS CONTRACT PASS');
