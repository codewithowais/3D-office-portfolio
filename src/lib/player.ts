import type { Sample } from './actor'
import { resolve } from './collision'

/** The person you control in walk mode. A plain Sample so <Person> can render it directly. */
export const player: Sample = { x: 0, y: 0, z: 25, heading: Math.PI, speed: 0, pose: 'stand', visible: false }

export const SPAWN = { x: 0, z: 25, heading: Math.PI }

/** Held keys / on-screen pad directions. */
export const input = { f: false, b: false, l: false, r: false, run: false }

export function resetPlayer() {
  player.x = SPAWN.x
  player.z = SPAWN.z
  player.heading = SPAWN.heading
  player.speed = 0
}

/**
 * Moves the player relative to the camera's ground-plane forward direction (fx, fz).
 * Returns true if the player moved.
 */
export function stepPlayer(fx: number, fz: number, dt: number) {
  const fwd = (input.f ? 1 : 0) - (input.b ? 1 : 0)
  const side = (input.r ? 1 : 0) - (input.l ? 1 : 0)
  if (!fwd && !side) {
    player.speed = 0
    return false
  }
  // right vector for a camera looking along (fx, fz)
  const rx = -fz
  const rz = fx
  let mx = fx * fwd + rx * side
  let mz = fz * fwd + rz * side
  const len = Math.hypot(mx, mz) || 1
  mx /= len
  mz /= len
  const speed = input.run ? 4.4 : 2.3
  player.x += mx * speed * dt
  player.z += mz * speed * dt
  resolve(player, 0.38)
  player.heading = Math.atan2(mx, mz)
  player.speed = speed
  return true
}

/** Instantly places the player (used by "take me to..." dialogue options). */
export function teleport(x: number, z: number) {
  player.x = x
  player.z = z
  resolve(player, 0.38)
  player.speed = 0
}
