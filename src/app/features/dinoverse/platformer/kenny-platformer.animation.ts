import { Enemy, KennyWorld, STEGO_ATTACK_DURATION } from './kenny-platformer.world';
import { BALANCE, playerSpecialDuration } from './kenny-platformer.balance';
import { frameAt30Fps, idleAtlasFrame } from '../kenny-atlas.animation';
export type PlayerMotion = 'idle' | 'walk' | 'jump' | 'attack';
export function playerAnimation(world: KennyWorld): { motion: PlayerMotion; frame: number } {
  if (world.attackTime > 0) {
    const duration = playerSpecialDuration(world.attackKind),
      elapsed = duration - world.attackTime;
    if (world.attackKind === 'charge')
      return elapsed < BALANCE.playerChargeWindup
        ? { motion: 'attack', frame: 0 }
        : { motion: 'walk', frame: frameAt30Fps(elapsed) };
    const progress = elapsed / duration;
    return {
      motion: 'attack',
      frame: Math.min(8, Math.floor(progress * 9)),
    };
  }
  if (world.biteTime > 0)
    return {
      motion: 'attack',
      frame: Math.min(
        8,
        Math.floor(((BALANCE.bite.duration - world.biteTime) / BALANCE.bite.duration) * 9),
      ),
    };
  if (!world.grounded) return { motion: 'jump', frame: frameAt30Fps(world.elapsed) };
  if (Math.abs(world.player.vx) > 10)
    return { motion: 'walk', frame: frameAt30Fps(world.elapsed) };
  return { motion: 'idle', frame: idleAtlasFrame(world.elapsed) };
}
export function enemyAnimation(
  enemy: Enemy,
  elapsed: number,
): { animation: 'walk' | 'attack'; frame: number; facing: number } {
  if (enemy.attackTime > 0 && enemy.species === 'stegosaurus')
    return {
      animation: 'attack',
      frame: Math.min(3, Math.floor((1 - enemy.attackTime / STEGO_ATTACK_DURATION) * 4)),
      facing: enemy.attackFacing,
    };
  return {
    animation: 'walk',
    frame: enemy.stun > 0 ? 0 : Math.floor(elapsed * (enemy.attackTime > 0 ? 16 : 7)) % 4,
    facing: enemy.direction,
  };
}
