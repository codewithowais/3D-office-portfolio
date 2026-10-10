import type { Pose, Sample } from './actor'

/**
 * Priya's guided tour. She walks you through the office, stopping to tell you about each part, waits
 * when you fall behind, then goes back to her desk. Pure logic; the scene reads `escort.sample`.
 */
type State = 'idle' | 'escorting' | 'returning' | 'parked'

interface Stop {
  x: number
  z: number
  /** heading to face while talking (omit to face the way she walked) */
  face?: number
  say?: string
  wait?: number
  pose?: Pose
}

const DESK = { x: -8, z: 7.2 }
const ROUTE: Stop[] = [
  { x: -4, z: 7.2 },
  { x: -3.4, z: 10 },
  { x: 0, z: 10.5, face: Math.PI, say: 'Welcome in, {name}! This is reception, where I look after every visitor.', wait: 3.2, pose: 'talk' },
  { x: 0, z: 6, face: Math.PI / 2, say: 'On your right: the Meeting Room, and behind it the Lounge where Omar relaxes.', wait: 3.2, pose: 'talk' },
  { x: 0, z: 0, face: -Math.PI / 2, say: 'The Work Studio is on your left and the Design Room on your right. Jin and Leo work there.', wait: 3.4, pose: 'talk' },
  { x: 0, z: -6, face: -Math.PI / 2, say: 'Operations is on the left. Maya keeps the backend and cloud running from there.', wait: 3.2, pose: 'talk' },
  { x: 0, z: -8.6, face: Math.PI / 2, say: 'And this is the Boss Cabin. Owais is expecting you.', wait: 2.6, pose: 'talk' },
  { x: 1.1, z: -7.4, face: Math.PI / 2, say: 'Go on in, {name}!', wait: 2.4, pose: 'wave' },
]
const BACK: Stop[] = [{ x: 0, z: -3 }, { x: 0, z: 7 }, { x: -3.5, z: 9.2 }, { x: -4, z: 7.2 }, { x: DESK.x, z: DESK.z }]

export const escort = {
  state: 'idle' as State,
  sample: { x: DESK.x, y: 0, z: DESK.z, heading: 0, speed: 0, pose: 'sit' as Pose, visible: true } as Sample,
  /** latest line she wants said (consumed by the caller) */
  say: '' as string,
  /** index of the stop she is heading to / standing at */
  i: 0,
  timer: 0,
  warned: false,
}

const SPEED = 1.6

export function resetEscort() {
  escort.state = 'idle'
  escort.say = ''
}

/** Begin the tour from wherever she currently is. */
export function startEscort(from: { x: number; z: number }) {
  const s = escort.sample
  s.x = from.x
  s.z = from.z
  s.speed = 0
  s.pose = 'stand'
  escort.state = 'escorting'
  escort.timer = 0
  escort.warned = false
  // already in the corridor? skip ahead to the next stop along it, otherwise start at the desk door
  escort.i = Math.abs(from.x) < 2 && from.z < 12 ? Math.max(2, ROUTE.findIndex((r) => r.say && r.z <= from.z + 0.5)) : 0
  if (escort.i < 0) escort.i = 2
}

export function updateEscort(dt: number, player: { x: number; z: number }) {
  if (escort.state === 'idle') return
  const s = escort.sample
  dt = Math.min(dt, 0.05)
  if (escort.state === 'parked') return

  const list = escort.state === 'escorting' ? ROUTE : BACK
  const stop = list[escort.i]
  if (!stop) {
    // finished the list
    if (escort.state === 'escorting') {
      escort.state = 'returning'
      escort.i = 0
    } else {
      escort.state = 'parked'
      s.x = DESK.x
      s.z = DESK.z
      s.heading = 0
      s.speed = 0
      s.pose = 'sit'
    }
    return
  }

  const dPlayer = Math.hypot(player.x - s.x, player.z - s.z)
  if (escort.state === 'escorting' && dPlayer > 16) {
    escort.say = "Looks like you wandered off. Find me at reception if you'd like the tour again!"
    escort.state = 'returning'
    escort.i = 0
    return
  }

  const dx = stop.x - s.x
  const dz = stop.z - s.z
  const dist = Math.hypot(dx, dz)
  if (dist > 0.2) {
    // wait for a player who has fallen behind
    if (escort.state === 'escorting' && dPlayer > 6) {
      s.speed = 0
      s.pose = 'wave'
      if (!escort.warned) {
        escort.warned = true
        escort.say = 'This way, {name}!'
      }
      return
    }
    escort.warned = false
    s.speed = SPEED
    s.pose = 'stand'
    s.heading = Math.atan2(dx, dz)
    s.x += (dx / dist) * SPEED * dt
    s.z += (dz / dist) * SPEED * dt
    return
  }

  // arrived: talk, wait for the player to catch up, then move on
  s.speed = 0
  if (stop.face !== undefined) s.heading = stop.face
  s.pose = stop.pose ?? 'stand'
  if (escort.timer === 0 && stop.say) escort.say = stop.say
  escort.timer += dt
  const ready = escort.state !== 'escorting' || dPlayer < 3.8
  if (escort.timer >= (stop.wait ?? 0) && ready) {
    escort.timer = 0
    escort.i++
  }
}
