import { resolve } from './collision'
import { SPEEDS, motion, player } from './player'

/** Click-to-walk: the character strolls in a straight line to a clicked spot. Pure logic, no rendering. */
export const goto = { active: false, x: 0, z: 0, stuck: 0 }

/** Farthest spot (metres from the player) a click may ask for. */
const MAX_REACH = 90

export function walkTo(x: number, z: number) {
  if (Math.hypot(x - player.x, z - player.z) > MAX_REACH) return false
  goto.active = true
  goto.x = x
  goto.z = z
  goto.stuck = 0
  return true
}

export function cancelWalkTo() {
  if (!goto.active) return
  goto.active = false
  player.speed = 0
}

/** Moves the player one step towards the target. Returns true while the player is being walked. */
export function stepWalkTo(dt: number) {
  if (!goto.active) return false
  const dx = goto.x - player.x
  const dz = goto.z - player.z
  const d = Math.hypot(dx, dz)
  if (d < 0.25) {
    cancelWalkTo()
    return false
  }
  const speed = SPEEDS[motion.level]
  const step = Math.min(d, speed * dt)
  const bx = player.x
  const bz = player.z
  player.x += (dx / d) * step
  player.z += (dz / d) * step
  resolve(player, 0.38)
  const moved = Math.hypot(player.x - bx, player.z - bz)
  // pressed against a wall or desk: give up after a moment instead of pushing forever
  goto.stuck = moved < step * 0.35 ? goto.stuck + dt : 0
  if (goto.stuck > 0.6) {
    cancelWalkTo()
    return false
  }
  player.heading = Math.atan2(dx, dz)
  player.speed = speed
  return true
}
