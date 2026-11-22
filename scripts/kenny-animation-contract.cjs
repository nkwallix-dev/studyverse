'use strict';

const KENNY_ANIMATION_FPS = 30;
const KENNY_CELL = 192;
const KENNY_COLUMNS = 12;
const KENNY_BASELINE = 180;
const KENNY_ACTIONS = Object.freeze({
  idle: Object.freeze({ frames: 48 }),
  walk: Object.freeze({ frames: 12 }),
  attack: Object.freeze({ frames: 12 }),
  jump: Object.freeze({ frames: 18 }),
  feed: Object.freeze({
    frames: 96,
    phases: Object.freeze({
      offscreen: Object.freeze([0, 11]),
      enter: Object.freeze([12, 29]),
      notice: Object.freeze([30, 41]),
      catch: Object.freeze([42, 59]),
      eat: Object.freeze([60, 77]),
      recover: Object.freeze([78, 95]),
    }),
  }),
});

function frameAt(elapsedSeconds, frameCount, fps = KENNY_ANIMATION_FPS) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return 0;
  if (!Number.isSafeInteger(frameCount) || frameCount < 1) return 0;
  return Math.floor(elapsedSeconds * fps) % frameCount;
}

module.exports = {
  KENNY_ACTIONS,
  KENNY_ANIMATION_FPS,
  KENNY_BASELINE,
  KENNY_CELL,
  KENNY_COLUMNS,
  frameAt,
};
