import { Enemy, KennyWorld, STEGO_ATTACK_DURATION } from './kenny-platformer.world';
import { BALANCE, playerSpecialDuration } from './kenny-platformer.balance';
export type PlayerMotion = 'idle' | 'walk' | 'jump' | 'attack';
export function playerAnimation(world: KennyWorld): { motion: PlayerMotion; frame: number } {
  if (world.attackTime > 0) {
    const duration = playerSpecialDuration(world.attackKind),
      elapsed = duration - world.attackTime;
    if (world.attackKind === 'charge')
      return elapsed < BALANCE.playerChargeWindup
        ? { motion: 'attack', frame: 1 }
        : { motion: 'walk', frame: Math.floor(elapsed * 18) % 4 };
    const progress = elapsed / duration;
    return {
      motion: 'attack',
      frame: progress < 0.16 ? 0 : progress < 0.38 ? 1 : progress < 0.76 ? 2 : 3,
    };
  }
  if (world.biteTime > 0) return { motion: 'attack', frame: world.biteTime > 0.1 ? 2 : 3 };
  if (!world.grounded) return { motion: 'jump', frame: world.player.vy < 0 ? 1 : 3 };
  if (Math.abs(world.player.vx) > 10)
    return { motion: 'walk', frame: Math.floor(world.elapsed * 10) % 4 };
  return { motion: 'idle', frame: 0 };
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
