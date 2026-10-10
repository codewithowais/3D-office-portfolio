import type { Sample } from './actor'
import { resolve } from './collision'

/** The person you control in walk mode. A plain Sample so <Person> can render it directly. */
export const player: Sample = { x: 0, y: 0, z: 25, heading: Math.PI, speed: 0, pose: 'stand', visible: false }

export const SPAWN = { x: 0, z: 25, heading: Math.PI }

/** Movement speeds in metres per second: walk, run, sprint. */
export const SPEEDS = [2.3, 4.4, 6.6] as const
export const SPEED_NAMES = ['Walk', 'Run', 'Sprint'] as const
/** The chosen base speed (index into SPEEDS). Holding Shift / "Hold to run" goes one level faster. */
export const motion = { level: 0 }

/** Held keys / on-screen pad directions. */
export const input = { f: false, b: false, l: false, r: false, run: false }

/** Sitting state: while active the player can't walk until they stand up. */
export const seat = { active: false, id: '', exit: [0, 0] as [number, number] }
/** Timed one-shot poses (drinking coffee, watering a plant): `until` is a world-clock time. */
export const action = { until: 0 }

export interface SeatSpec {
  x: number
  z: number
  heading: number
  /** shift the body down for low seats such as a bench */
  y?: number
  exit: [number, number]
  pose?: 'sit' | 'type'
}

export function sitAt(id: string, s: SeatSpec) {
  player.x = s.x
  player.z = s.z
  player.y = s.y ?? 0
  player.heading = s.heading
  player.speed = 0
  player.pose = s.pose ?? 'sit'
  seat.active = true
  seat.id = id
  seat.exit = s.exit
}

export function standUp() {
  if (!seat.active) return
  seat.active = false
  player.x = seat.exit[0]
  player.z = seat.exit[1]
  player.y = 0
  player.pose = 'stand'
  resolve(player, 0.38)
}

/** Play a pose for a few seconds, then go back to standing. */
export function doPose(pose: Sample['pose'], now: number, seconds: number) {
  player.pose = pose
  action.until = now + seconds
}

export function resetPlayer() {
  player.x = SPAWN.x
  player.z = SPAWN.z
  player.heading = SPAWN.heading
  player.speed = 0
  player.y = 0
  player.pose = 'stand'
  seat.active = false
  action.until = 0
}

/**
 * Moves the player relative to the camera's ground-plane forward direction (fx, fz).
 * Returns true if the player moved.
 */
export function stepPlayer(fx: number, fz: number, dt: number) {
  if (seat.active) {
    player.speed = 0
    return false
  }
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
  const level = Math.min(2, motion.level + (input.run ? 1 : 0))
  const speed = SPEEDS[level]
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
