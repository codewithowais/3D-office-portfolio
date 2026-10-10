import { makeActor, makeLoop } from './actor'
import type { V3 } from './math'

const P = Math.PI
const SW = 22.8 // south sidewalk z

/* ---------- Security guard: tends the garden ---------- */
export const guard = makeActor(
  [-9, 0, 16],
  [
    { wait: 1.2, face: 0 },
    { walk: [[-12.2, 0, 16], [-13.6, 0, 15.3]], speed: 1.5, round: 0.8 },
    { wait: 2.4, pose: 'water', face: 0.3 },
    { walk: [[-17.5, 0, 15.3]], speed: 1.6 },
    { wait: 2.4, pose: 'water', face: 0.3 },
    { walk: [[-12.5, 0, 15.7], [-10.8, 0, 16], [-9, 0, 16]], speed: 1.6, round: 1 },
    { wait: 999, face: 0 },
  ],
)

/* ---------- Visitor ---------- */
const VISITOR_T0 = 50
export const visitor = makeActor(
  [-14, 0, SW],
  [
    { walk: [[0, 0, SW], [0, 0, 19]], round: 1.8, mark: 'gate' },
    { walk: [[0, 0, 11]], mark: 'inside' },
    { wait: 2.9, face: P, mark: 'greeted' },
    { walk: [[0, 0, -6]], mark: 'nearDoor' },
    { walk: [[0, 0, -9], [4, 0, -9], [12.6, 0, -9]], round: 1.4, mark: 'inRoom' },
    { wait: 14, pose: 'sit', face: P / 2, mark: 'meetingEnd' },
    { walk: [[3.5, 0, -9]], speed: 1.8, mark: 'doorOut' },
    { walk: [[0, 0, -9], [0, 0, 12], [0, 0, 19], [0, 0, SW], [31, 0, SW], [33.4, 0, 14.7]], speed: 2.1, round: 1.6, mark: 'atCar' },
    { wait: 0.9, face: 0, mark: 'enterCar' },
    { hide: true },
  ],
  VISITOR_T0,
  0,
)

/* ---------- Receptionist: leads the visitor to the boss ---------- */
const vm = visitor.marks
export const receptionist = makeActor(
  [-8, 0, 7.2],
  [
    { wait: vm.gate - 1.5, pose: 'sit', face: 0 },
    { walk: [[-4, 0, 7.2], [-3.4, 0, 10], [-0.9, 0, 9.6]], round: 1, mark: 'metVisitor' },
    { wait: 2.4, pose: 'wave', face: 0.55, mark: 'greeted' },
    { walk: [[0, 0, 9], [0, 0, -8.4], [1.1, 0, -7.2]], round: 1, mark: 'atDoor' },
    { wait: 9, pose: 'wave', face: P / 2, mark: 'doorWait' },
    { walk: [[0, 0, -3], [0, 0, 7], [-3.5, 0, 9.2], [-4, 0, 7.2], [-8, 0, 7.2]], round: 1.2 },
    { wait: 999, pose: 'sit', face: 0 },
  ],
)

export const boss = makeActor([16.9, 0, -9], [{ wait: 9999, pose: 'type', face: -P / 2 }])

/** Door of the boss cabin: [openStart, openEnd] windows, with ~0.9 s swing. */
export const DOOR_OPEN: [number, number][] = [
  [receptionist.marks.atDoor - 1.5, vm.inRoom + 0.8],
  [vm.meetingEnd - 0.6, vm.doorOut + 1.6],
]

/* ---------- Visitor's car ---------- */
const carStart = vm.enterCar + 0.8
const DRIVE = 12
export const car = makeActor(
  [34, 0, 16.6],
  [
    { wait: carStart, face: P / 2 },
    { walk: [[41, 0, 16.6], [41, 0, 22], [41, 0, 30], [-210, 0, 30]], speed: 5.6, round: 4.5 },
  ],
)

export const TOUR_LEN = carStart + DRIVE + 28
export const CAR_START = carStart
export const CAR_DRIVE = DRIVE

/* ---------- Jogger ---------- */
const JOG = 3.3
export const jogger = makeLoop(
  [[-54.5, 0, 23.2], [54.5, 0, 23.2], [54.5, 0, -23.2], [-54.5, 0, -23.2]],
  JOG,
  34.5 - 17 * JOG, // at t=17s he is near x=-20 on the south sidewalk
  3,
)

/* ---------- Five-a-side football ---------- */
const homes: V3[] = [
  [-46, 0, -7], [-40, 0, 0], [-46, 0, 7], // blue
  [-36, 0, -6], [-33.5, 0, 2], [-37, 0, 8], // red
]
export const players = homes.map((h, i) => {
  const r = 3 + (i % 3)
  const pts: V3[] = [
    [h[0] - r, 0, h[2] - r * 0.8],
    [h[0] + r, 0, h[2] - r * 0.8],
    [h[0] + r * 0.6, 0, h[2] + r],
    [h[0] - r * 0.8, 0, h[2] + r * 0.6],
  ]
  return makeLoop(pts, 2.4 + (i % 2) * 0.3, i * 9, 2)
})
const ORDER = [0, 3, 1, 4, 2, 5]
const PASS = 2.2
export function ballAt(t: number, out: V3): V3 {
  const k = Math.floor(t / PASS)
  const u = (t % PASS) / PASS
  const a = players[ORDER[k % 6]].sample(t)
  const ax = a.x
  const az = a.z
  const b = players[ORDER[(k + 1) % 6]].sample(t)
  out[0] = ax + (b.x - ax) * u
  out[2] = az + (b.z - az) * u
  out[1] = 0.28 + Math.sin(Math.PI * u) * 0.9
  return out
}
