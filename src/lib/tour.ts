type Sampler = { sample: (t: number) => import('./actor').Sample }
import { car, CAR_DRIVE, CAR_START, DOOR_OPEN, guard, jogger, receptionist, TOUR_LEN, visitor } from './actors'
import { V3, clamp, lerp3, smooth } from './math'
import { roomAt } from './world'

export { TOUR_LEN, DOOR_OPEN }

export interface Cam {
  p: V3
  t: V3
}

type ShotFn = (u: number, t: number, o: Cam) => void
interface Shot {
  from: number
  to: number
  fn: ShotFn
}

const vm = visitor.marks
const rm = receptionist.marks

/* ---------- shot helpers ---------- */
const fixed =
  (p0: V3, t0: V3, p1: V3 = p0, t1: V3 = t0): ShotFn =>
  (u, _t, o) => {
    const e = smooth(u)
    o.p = lerp3(p0, p1, e)
    o.t = lerp3(t0, t1, e)
  }

/** Look at an actor from a fixed world-space offset. */
const follow =
  (a: Sampler, off: V3, off1: V3 = off, lookY = 1): ShotFn =>
  (u, t, o) => {
    const s = a.sample(t)
    const x = s.x
    const z = s.z
    const f = lerp3(off, off1, smooth(u))
    o.t = [x, lookY, z]
    o.p = [x + f[0], f[1], z + f[2]]
  }

/** Look at the midpoint between two actors. */
const followPair =
  (a: Sampler, b: Sampler, off: V3, off1: V3 = off): ShotFn =>
  (u, t, o) => {
    const s = a.sample(t)
    const ax = s.x
    const az = s.z
    const q = b.sample(t)
    const x = (ax + q.x) / 2
    const z = (az + q.z) / 2
    const f = lerp3(off, off1, smooth(u))
    o.t = [x, 1, z]
    o.p = [x + f[0], f[1], z + f[2]]
  }

/** Chase camera: behind and above an actor, relative to the direction it faces. */
const chase =
  (a: Sampler, back: number, up: number, side = 0): ShotFn =>
  (_u, t, o) => {
    const s = a.sample(t)
    const fx = Math.sin(s.heading)
    const fz = Math.cos(s.heading)
    o.t = [s.x + fx * 2, 1, s.z + fz * 2]
    o.p = [s.x - fx * back - fz * side, up, s.z - fz * back + fx * side]
  }

const orbit =
  (cx: number, cz: number, r: number, h: number, a0: number): ShotFn =>
  (u, _t, o) => {
    const a = a0 + u * Math.PI * 2
    o.p = [cx + Math.cos(a) * r, h, cz + Math.sin(a) * r]
    o.t = [cx, 0, cz]
  }

/* ---------- chapters (captions) ---------- */
const driveEnd = CAR_START + CAR_DRIVE
export const CHAPTERS = [
  { from: 0, title: 'Small details. A living world.', sub: 'Follow the guard as he cares for the garden.' },
  { from: 17, title: 'Life beyond the office', sub: 'A continuous jog around the building.' },
  { from: 34, title: 'More than a building', sub: 'A neighbourhood with space to play.' },
  { from: 50, title: 'A personal welcome', sub: 'Follow your receptionist, meet the boss and head home.' },
  { from: vm.meetingEnd, title: 'Heading home', sub: 'Through security and directly to the car.' },
  { from: vm.enterCar, title: 'Until next time', sub: 'Your visitor drives away.' },
  { from: driveEnd, title: 'Your business. Your own world.', sub: 'Explore the complete 360° view.' },
]

export function chapterAt(t: number): number {
  let c = 0
  for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].from) c = i
  return c
}

/* ---------- camera shots ---------- */
const SHOTS: Shot[] = [
  // 1. guard & gate
  { from: 0, to: 17, fn: follow(guard, [10, 11, 19], [6, 9, 15], 1.6) },
  // 2. jogger
  { from: 17, to: 34, fn: follow(jogger, [7, 9, 11], [9, 8, 9]) },
  // 3. football pitch
  { from: 34, to: 50, fn: fixed([-16, 26, 34], [-41, 0, 2], [-22, 22, -26], [-41, 0, 2]) },
  // 4. welcome
  { from: 50, to: vm.inside, fn: fixed([-6, 14, 40], [0, 1, 14], [5, 10, 29], [-3, 1, 9]) },
  { from: vm.inside, to: rm.greeted, fn: fixed([10, 8.5, 22], [-4, 1.2, 9.2], [7, 8, 19], [-3, 1.2, 9.6]) },
  { from: rm.greeted, to: vm.nearDoor, fn: followPair(receptionist, visitor, [8, 10.5, 13]) },
  { from: vm.nearDoor, to: vm.inRoom - 2.5, fn: follow(visitor, [-6, 10, 12], [-8, 10, 11]) },
  { from: vm.inRoom - 2.5, to: vm.inRoom + 4, fn: fixed([0, 42, 32], [0, 0, 2], [3, 40, 28], [0, 0, 1]) },
  { from: vm.inRoom + 4, to: vm.meetingEnd, fn: fixed([4, 9.5, 3], [12, 0, -9], [8, 8.5, 1], [12.5, 0, -9]) },
  // 5. heading home
  { from: vm.meetingEnd, to: vm.atCar - 4, fn: chase(visitor, 9, 7.5, 3) },
  { from: vm.atCar - 4, to: vm.enterCar + 0.8, fn: fixed([26, 8, 27], [34, 0.5, 15.5], [27, 7, 26], [34.5, 0.5, 15.5]) },
  // 6. car leaves
  { from: vm.enterCar + 0.8, to: driveEnd, fn: chase(car, 13, 9, 5) },
  // 7. 360 orbit
  { from: driveEnd, to: TOUR_LEN, fn: orbit(0, -6, 112, 88, 0.55 * Math.PI) },
]

export function cameraAt(t: number, out: Cam) {
  let shot = SHOTS[SHOTS.length - 1]
  for (const s of SHOTS) {
    if (t >= s.from && t < s.to) {
      shot = s
      break
    }
  }
  shot.fn(clamp((t - shot.from) / Math.max(0.001, shot.to - shot.from)), t, out)
}

/** Which room should the side menu highlight at tour time t? */
export function activeRoomAt(t: number): string | null {
  if (t < vm.gate - 2 || t > vm.atCar) return null
  const s = visitor.sample(t)
  const x = s.x
  const z = s.z
  if (z > 15) return null
  if (t > vm.nearDoor && t < vm.meetingEnd + 6) {
    const r = roomAt(x, z)
    if (r) return r
  }
  const r = roomAt(x, z)
  if (r) return r
  // in the corridor: the room to the left of the walker
  if (z > 4) return 'reception'
  if (z > -4) return 'studio'
  return 'operations'
}

/** Boss-cabin door opening angle (radians) at time t. */
export function doorAngle(t: number): number {
  let a = 0
  for (const [s, e] of DOOR_OPEN) {
    const v = smooth((t - s) / 0.9) * (1 - smooth((t - e) / 0.9))
    a = Math.max(a, v)
  }
  return a * 1.9
}
