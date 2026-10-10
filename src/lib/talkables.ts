import { boss, guard, TOUR_LEN, visitor } from './actors'
import { receptionistSample } from './escort'
import type { SeatSpec } from './player'

export interface Spot {
  x: number
  z: number
  visible: boolean
}

export type Kind = 'person' | 'thing' | 'seat'

export interface Talkable {
  id: string
  kind: Kind
  /** height of the floating marker above the floor */
  marker: number
  /** how close you need to be to interact */
  range: number
  /** button text for things and seats ("Use the computer"); people show "Talk to <name>" */
  label?: string
  /** something you DO instead of opening a conversation */
  action?: 'sit' | 'coffee' | 'bell' | 'water'
  seat?: SeatSpec
  at: (t: number, out: Spot) => Spot
}

export const TALK_RANGE = 2.7

function actor(id: string, a: { sample: (t: number) => { x: number; z: number; visible: boolean } }, marker = 2.35): Talkable {
  return {
    id,
    kind: 'person',
    marker,
    range: TALK_RANGE,
    at(t, out) {
      const s = a.sample(t % TOUR_LEN)
      out.x = s.x
      out.z = s.z
      out.visible = s.visible
      return out
    },
  }
}

function fixed(id: string, x: number, z: number, extra: Partial<Talkable> = {}): Talkable {
  return {
    id,
    kind: 'person',
    marker: 2.35,
    range: TALK_RANGE,
    at(_t, out) {
      out.x = x
      out.z = z
      out.visible = true
      return out
    },
    ...extra,
  }
}

const thing = (id: string, x: number, z: number, label: string, extra: Partial<Talkable> = {}) => fixed(id, x, z, { kind: 'thing', marker: 1.7, range: 2.5, label, ...extra })
const chair = (id: string, label: string, seat: SeatSpec, marker = 1.2) =>
  fixed(id, seat.x, seat.z, { kind: 'seat', marker, range: 1.7, label, action: 'sit', seat })

/** Everything you can interact with in walk mode: people, objects and seats. */
export const TALKABLES: Talkable[] = [
  /* ---- people ---- */
  actor('receptionist', { sample: receptionistSample }),
  actor('guard', guard),
  actor('visitor', visitor),
  actor('boss', boss, 2.0),
  fixed('hamza', -17.4, -1.4, { marker: 2.0 }),
  fixed('sana', -17, -13, { marker: 2.0 }),
  fixed('zain', 7, -3.55, { marker: 2.0 }),
  fixed('mahnoor', 4.9, 7.55, { marker: 2.0 }),
  fixed('usman', 15.2, 12.7, { marker: 2.0 }),
  fixed('bilal', -41, -16.9),
  fixed('hira', -39.5, -16.9),

  /* ---- things ---- */
  thing('pc', 15.4, -9.5, "Use Owais's computer"),
  thing('board', -19.6, 0, 'Read the skills board', { range: 3 }),
  thing('shelf', 19.5, -9, 'Browse the bookshelf', { range: 3 }),
  thing('screen', 7.5, 4.6, 'Look at the screen', { range: 2.8 }),
  thing('bell', -5.9, 8.9, 'Ring the bell', { action: 'bell', marker: 1.5, range: 2.6 }),
  thing('coffee', 12.9, 11.6, 'Pour a coffee', { action: 'coffee', marker: 1.5, range: 2.3 }),
  thing('plant', -18.4, 12.6, 'Water the plant', { action: 'water', marker: 2.2, range: 2.3 }),

  /* ---- seats ---- */
  chair('seat-sofa', 'Sit on the sofa', { x: 16.9, z: 12.7, heading: Math.PI, exit: [16.9, 10.9] }),
  chair('seat-sofa2', 'Sit on the sofa', { x: 18.6, z: 9.5, heading: -Math.PI / 2, exit: [16.9, 9.5] }),
  chair('seat-reception', 'Take a seat', { x: -15.5, z: 11.2, heading: Math.PI / 2, exit: [-13.4, 11.2] }),
  chair('seat-meeting', 'Sit at the table', { x: 4.2, z: 9, heading: Math.PI / 2, exit: [3.9, 6] }),
  chair('seat-boss', "Sit across from Owais", { x: 12.6, z: -7.4, heading: Math.PI / 2, exit: [10.6, -7.4] }),
  chair('seat-bench', 'Sit on the bench', { x: -42.2, z: -15.35, heading: 0, y: -0.24, exit: [-42.2, -13.6] }, 0.9),
  chair('seat-studio', 'Work at the free desk', { x: -9.8, z: 1.4, heading: Math.PI, pose: 'type', exit: [-9.8, 3.1] }),
  chair('seat-ops', 'Work at the free desk', { x: -12.6, z: -10.2, heading: Math.PI, pose: 'type', exit: [-12.6, -9.2] }),
]

const scratch: Spot = { x: 0, z: 0, visible: true }

export const talkable = (id: string) => TALKABLES.find((k) => k.id === id)

/** Current position of a talkable, or null. The result is reused, copy what you need. */
export function spotOf(id: string, t: number): Spot | null {
  const tk = talkable(id)
  return tk ? tk.at(t, scratch) : null
}
